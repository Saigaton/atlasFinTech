import calendar
from datetime import datetime, timezone
from typing import Optional

from app.entidades.contas import Contas
from app.entidades.contas_pagar import ContasPagar
from app.entidades.transacoes import Transacoes
from app.enums.situacao_transacao_enum import SituacaoTransacaoEnum
from app.enums.tipo_situacao_conta_enum import TipoSituacaoContaEnum
from app.enums.tipo_transacao_enum import TipoTransacaoEnum
from app.exceptions.business_exception import BusinessException
from app.repositories.conta_pagar_repository import ContaPagarRepository
from app.schemas.conta_pagar import AtualizarContaPagar, ContaPagarResposta, CriarContaPagar, PagamentoContaPagar, ResumoContasPagarResposta


class ContaPagarService:
    def __init__(self, repository: ContaPagarRepository):
        self.repository = repository

    def criarContaPagar(self, empresa_id: int, usuario_id: int, dados: CriarContaPagar) -> list[ContaPagarResposta]:
        parcelas: list[ContasPagar] = []
        base_data = dados.data_vencimento
        n = dados.total_parcelas
        valor_parcela = round(dados.valor / n, 2)

        for i in range(n):
            mes = base_data.month + i
            ano = base_data.year + (mes - 1) // 12
            mes = (mes - 1) % 12 + 1
            dia = min(base_data.day, calendar.monthrange(ano, mes)[1])
            data_parcela = base_data.replace(year=ano, month=mes, day=dia)

            descricao = dados.descricao if n == 1 else f"{dados.descricao} ({i + 1}/{n})"
            parcelas.append(ContasPagar(
                descricao=descricao,
                valor=valor_parcela,
                data_vencimento=data_parcela,
                conta_id=dados.conta_id,
                categoria_id=dados.categoria_id,
                notas=dados.notas,
                total_parcelas=n,
                data_pagamento=None,
                situacao_id=TipoSituacaoContaEnum.PENDENTE,
                empresa_id=empresa_id,
            ))

        try:
            for p in parcelas:
                self.repository.session.add(p)
            self.repository.session.flush()

            for p in parcelas:
                transacao = Transacoes(
                    descricao=    p.descricao,
                    valor=        p.valor,
                    data=         p.data_vencimento,
                    conta_id=     p.conta_id,
                    categoria_id= p.categoria_id,
                    tipo_transacao_id= TipoTransacaoEnum.DESPESA,
                    situacao=     SituacaoTransacaoEnum.PENDENTE,
                    recorrencia=  "mensal" if n > 1 else "nenhuma",
                    empresa_id=   empresa_id,
                )
                self.repository.session.add(transacao)
                self.repository.session.flush()
                p.transacao_id = transacao.id

            self.repository.session.commit()
            for p in parcelas:
                self.repository.session.refresh(p)
            return [ContaPagarResposta.model_validate(p) for p in parcelas]
        except Exception as e:
            print(e)
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar conta a pagar.", status_code=400)

    def _atualizar_vencidas(self, empresa_id: int, usuario_id: int) -> None:
        hoje = datetime.now(timezone.utc).date()
        contas = self.repository.listarPorEmpresa(empresa_id, usuario_id)
        vencidas = [
            c for c in contas
            if c.situacao_id == TipoSituacaoContaEnum.PENDENTE
            and c.data_vencimento.date() < hoje
        ]
        if vencidas:
            for c in vencidas:
                c.situacao_id = TipoSituacaoContaEnum.ATRASADO
            self.repository.session.commit()

    def listarContasPagar(self, empresa_id: int, usuario_id: int, situacao: Optional[int] = None, pesquisa: Optional[str] = None) -> list[ContaPagarResposta]:
        self._atualizar_vencidas(empresa_id, usuario_id)
        contas = self.repository.listarPorEmpresa(empresa_id, usuario_id)
        if situacao is not None:
            contas = [c for c in contas if c.situacao_id == situacao]
        if pesquisa:
            contas = [c for c in contas if pesquisa.lower() in (c.descricao or "").lower()]
        return [ContaPagarResposta.model_validate(c) for c in contas]

    def atualizarContaPagar(self, empresa_id: int, conta_id: int, usuario_id: int, dados: AtualizarContaPagar) -> ContaPagarResposta:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a pagar não encontrada.", status_code=404)
        if conta.situacao_id == TipoSituacaoContaEnum.PAGO:
            raise BusinessException("Conta já paga não pode ser editada.", status_code=400)

        try:
            campos = dados.model_dump(exclude_none=True)
            self.repository.atualizarContaPagar(conta, campos)

            hoje = datetime.now(timezone.utc).date()
            nova_data = conta.data_vencimento.date() if hasattr(conta.data_vencimento, 'date') else conta.data_vencimento
            if nova_data < hoje:
                conta.situacao_id = TipoSituacaoContaEnum.ATRASADO
            else:
                conta.situacao_id = TipoSituacaoContaEnum.PENDENTE

            if conta.transacao_id:
                transacao = self.repository.session.get(Transacoes, conta.transacao_id)
                if transacao:
                    if "descricao"       in campos: transacao.descricao    = conta.descricao
                    if "valor"           in campos: transacao.valor         = conta.valor
                    if "data_vencimento" in campos: transacao.data          = conta.data_vencimento
                    if "conta_id"        in campos: transacao.conta_id      = conta.conta_id
                    if "categoria_id"    in campos: transacao.categoria_id  = conta.categoria_id
                    if "notas"           in campos: transacao.notas         = conta.notas

            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaPagarResposta.model_validate(conta)
        except BusinessException:
            raise
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar conta a pagar.", status_code=400)

    def pagarConta(self, empresa_id: int, conta_id: int, usuario_id: int, dados: PagamentoContaPagar) -> ContaPagarResposta:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a pagar não encontrada.", status_code=404)
        if conta.situacao_id == TipoSituacaoContaEnum.PAGO:
            raise BusinessException("Conta já foi paga.", status_code=400)

        try:
            self.repository.atualizarContaPagar(conta, {
                "situacao_id":    TipoSituacaoContaEnum.PAGO,
                "data_pagamento": dados.data_pagamento,
            })

            valor_pago  = dados.valor_pago or conta.valor
            recorrencia = "mensal" if (conta.total_parcelas or 1) > 1 else "nenhuma"

            if conta.transacao_id:
                transacao = self.repository.session.get(Transacoes, conta.transacao_id)
                if transacao:
                    transacao.situacao  = SituacaoTransacaoEnum.CONFIRMADO
                    transacao.data      = dados.data_pagamento
                    transacao.valor     = valor_pago
                    transacao.conta_id  = dados.conta_id
            else:
                transacao = Transacoes(
                    descricao=    conta.descricao,
                    valor=        valor_pago,
                    data=         dados.data_pagamento,
                    conta_id=     dados.conta_id,
                    categoria_id= conta.categoria_id,
                    tipo_transacao_id= TipoTransacaoEnum.DESPESA,
                    situacao=     SituacaoTransacaoEnum.CONFIRMADO,
                    empresa_id=   empresa_id,
                    recorrencia=  recorrencia,
                )
                self.repository.session.add(transacao)

            if dados.conta_id:
                cb = self.repository.session.get(Contas, dados.conta_id)
                if cb:
                    cb.saldo_atual -= valor_pago

            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaPagarResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao registrar pagamento.", status_code=400)

    def resumoContasPagar(self, empresa_id: int, usuario_id: int) -> ResumoContasPagarResposta:
        self._atualizar_vencidas(empresa_id, usuario_id)
        dados = self.repository.resumo(empresa_id, usuario_id)
        return ResumoContasPagarResposta(**dados)

    def deletarContaPagar(self, empresa_id: int, conta_id: int, usuario_id: int) -> None:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a pagar não encontrada.", status_code=404)

        try:
            if conta.transacao_id:
                transacao = self.repository.session.get(Transacoes, conta.transacao_id)
                if transacao:
                    if conta.situacao_id == TipoSituacaoContaEnum.PAGO and transacao.conta_id:
                        cb = self.repository.session.get(Contas, transacao.conta_id)
                        if cb:
                            cb.saldo_atual += transacao.valor
                    self.repository.session.delete(transacao)
            elif conta.situacao_id == TipoSituacaoContaEnum.PAGO and conta.conta_id:
                cb = self.repository.session.get(Contas, conta.conta_id)
                if cb:
                    cb.saldo_atual += conta.valor

            self.repository.deletarContaPagar(conta)
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao deletar conta a pagar.", status_code=400)
