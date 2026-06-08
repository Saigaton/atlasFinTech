import calendar
from datetime import datetime, timezone
from typing import Optional

from app.entidades.contas import Contas
from app.entidades.transacoes import Transacoes
from app.entidades.contas_pagar import ContasPagar
from app.entidades.contas_receber import ContasReceber
from app.enums.tipo_transacao_enum import TipoTransacaoEnum
from app.enums.tipo_situacao_conta_enum import TipoSituacaoContaEnum
from app.enums.situacao_transacao_enum import SituacaoTransacaoEnum
from app.exceptions.business_exception import BusinessException
from app.repositories.transacao_repository import TransacaoRepository
from app.schemas.transacao import AtualizarTransacao, CriarTransacao, TransacaoResposta


class TransacaoService:
    def __init__(self, repository: TransacaoRepository):
        self.repository = repository

    def criarTransacao(self, empresa_id: int, usuario_id: int, dados: CriarTransacao) -> TransacaoResposta:
        transacao = Transacoes(
            descricao=dados.descricao,
            valor=dados.valor,
            data=dados.data,
            conta_id=dados.conta_id,
            categoria_id=dados.categoria_id,
            tipo_transacao_id=dados.tipo,
            situacao=int(dados.situacao),
            notas=dados.notas,
            recorrencia=dados.recorrencia,
            empresa_id=empresa_id,
            transferencia_para_conta_id=dados.transferencia_para_conta_id,
        )
        try:
            transacao = self.repository.criarTransacao(transacao)
            self.repository.session.flush()

            ja_pago      = int(dados.situacao) == SituacaoTransacaoEnum.CONFIRMADO
            sit_conta    = TipoSituacaoContaEnum.PAGO if ja_pago else TipoSituacaoContaEnum.PENDENTE
            data_efetiva = dados.data if ja_pago else None

            if int(dados.tipo) == TipoTransacaoEnum.DESPESA:
                conta_pagar = ContasPagar(
                    descricao=       dados.descricao,
                    valor=           dados.valor,
                    data_vencimento= dados.data,
                    data_pagamento=  data_efetiva,
                    conta_id=        dados.conta_id,
                    categoria_id=    dados.categoria_id,
                    notas=           dados.notas,
                    total_parcelas=  1,
                    situacao_id=     sit_conta,
                    empresa_id=      empresa_id,
                    transacao_id=    transacao.id,
                )
                self.repository.session.add(conta_pagar)

            elif int(dados.tipo) == TipoTransacaoEnum.RECEITA:
                conta_receber = ContasReceber(
                    descricao=        dados.descricao,
                    valor=            dados.valor,
                    data_vencimento=  dados.data,
                    data_recebimento= data_efetiva,
                    conta_id=         dados.conta_id,
                    categoria_id=     dados.categoria_id,
                    notas=            dados.notas,
                    situacao_id=      sit_conta,
                    empresa_id=       empresa_id,
                    transacao_id=     transacao.id,
                )
                self.repository.session.add(conta_receber)

            if ja_pago:
                if int(dados.tipo) == TipoTransacaoEnum.TRANSFERENCIA:
                    if dados.conta_id:
                        origem = self.repository.session.get(Contas, dados.conta_id)
                        if origem:
                            origem.saldo_atual -= dados.valor
                    if dados.transferencia_para_conta_id:
                        destino = self.repository.session.get(Contas, dados.transferencia_para_conta_id)
                        if destino:
                            destino.saldo_atual += dados.valor
                elif dados.conta_id:
                    sinal = -1 if int(dados.tipo) == TipoTransacaoEnum.DESPESA else 1
                    cb = self.repository.session.get(Contas, dados.conta_id)
                    if cb:
                        cb.saldo_atual += sinal * dados.valor

            self.repository.session.commit()
            self.repository.session.refresh(transacao)
            return TransacaoResposta.model_validate(
                self.repository.buscarComRelacionamentos(transacao.id)
            )
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar transação.", status_code=400)

    def listarTransacoes(
        self,
        empresa_id: int,
        usuario_id: int,
        tipo:     Optional[int] = None,
        situacao: Optional[int] = None,
        pesquisa: Optional[str] = None,
    ) -> list[TransacaoResposta]:
        transacoes = self.repository.listarComFiltros(empresa_id, usuario_id, tipo, situacao, pesquisa)
        return [TransacaoResposta.model_validate(t) for t in transacoes]

    def buscarTransacao(self, empresa_id: int, transacao_id: int, usuario_id: int) -> TransacaoResposta:
        transacao = self.repository.buscarComRelacionamentos(transacao_id, empresa_id, usuario_id)
        if not transacao:
            raise BusinessException("Transação não encontrada.", status_code=404)
        return TransacaoResposta.model_validate(transacao)

    def atualizarTransacao(self, empresa_id: int, transacao_id: int, usuario_id: int, dados: AtualizarTransacao) -> TransacaoResposta:
        transacao = self.repository.buscarPorId(transacao_id, empresa_id, usuario_id)
        if not transacao:
            raise BusinessException("Transação não encontrada.", status_code=404)

        campos = dados.model_dump(exclude_none=True)
        if "tipo" in campos:
            campos["tipo_transacao_id"] = int(campos.pop("tipo"))
        if "situacao" in campos:
            campos["situacao"] = int(campos["situacao"])

        situacao_anterior = int(transacao.situacao)
        conta_id_anterior = transacao.conta_id
        valor_anterior    = transacao.valor

        try:
            self.repository.atualizarTransacao(transacao, campos)

            tipo_transacao = int(transacao.tipo_transacao_id)
            sinal = -1 if tipo_transacao == TipoTransacaoEnum.DESPESA else (1 if tipo_transacao == TipoTransacaoEnum.RECEITA else 0)
            if sinal != 0:
                era_confirmado   = situacao_anterior     == SituacaoTransacaoEnum.CONFIRMADO
                agora_confirmado = int(transacao.situacao) == SituacaoTransacaoEnum.CONFIRMADO
                if era_confirmado and conta_id_anterior:
                    cb = self.repository.session.get(Contas, conta_id_anterior)
                    if cb:
                        cb.saldo_atual -= sinal * valor_anterior
                if agora_confirmado and transacao.conta_id:
                    cb = self.repository.session.get(Contas, transacao.conta_id)
                    if cb:
                        cb.saldo_atual += sinal * transacao.valor

            tipo_transacao = int(transacao.tipo_transacao_id)
            if tipo_transacao == TipoTransacaoEnum.DESPESA:
                conta_vinculada = self.repository.session.query(ContasPagar).filter_by(
                    transacao_id=transacao.id, empresa_id=empresa_id
                ).first()
                if conta_vinculada:
                    if "descricao"    in campos: conta_vinculada.descricao      = transacao.descricao
                    if "valor"        in campos: conta_vinculada.valor           = transacao.valor
                    if "data"         in campos: conta_vinculada.data_vencimento = transacao.data
                    if "conta_id"     in campos: conta_vinculada.conta_id        = transacao.conta_id
                    if "categoria_id" in campos: conta_vinculada.categoria_id    = transacao.categoria_id
                    if "notas"        in campos: conta_vinculada.notas           = transacao.notas
                    if "situacao"     in campos:
                        nova_sit = int(transacao.situacao)
                        conta_vinculada.situacao_id    = TipoSituacaoContaEnum.PAGO if nova_sit == SituacaoTransacaoEnum.CONFIRMADO else TipoSituacaoContaEnum.PENDENTE
                        conta_vinculada.data_pagamento = transacao.data if nova_sit == SituacaoTransacaoEnum.CONFIRMADO else None

            elif tipo_transacao == TipoTransacaoEnum.RECEITA:
                conta_vinculada = self.repository.session.query(ContasReceber).filter_by(
                    transacao_id=transacao.id, empresa_id=empresa_id
                ).first()
                if conta_vinculada:
                    if "descricao"    in campos: conta_vinculada.descricao        = transacao.descricao
                    if "valor"        in campos: conta_vinculada.valor             = transacao.valor
                    if "data"         in campos: conta_vinculada.data_vencimento   = transacao.data
                    if "conta_id"     in campos: conta_vinculada.conta_id          = transacao.conta_id
                    if "categoria_id" in campos: conta_vinculada.categoria_id      = transacao.categoria_id
                    if "notas"        in campos: conta_vinculada.notas             = transacao.notas
                    if "situacao"     in campos:
                        nova_sit = int(transacao.situacao)
                        conta_vinculada.situacao_id      = TipoSituacaoContaEnum.PAGO if nova_sit == SituacaoTransacaoEnum.CONFIRMADO else TipoSituacaoContaEnum.PENDENTE
                        conta_vinculada.data_recebimento = transacao.data if nova_sit == SituacaoTransacaoEnum.CONFIRMADO else None

            self.repository.session.commit()
            self.repository.session.refresh(transacao)
            return TransacaoResposta.model_validate(
                self.repository.buscarComRelacionamentos(transacao.id)
            )
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar transação.", status_code=400)

    def deletarTransacao(self, empresa_id: int, transacao_id: int, usuario_id: int) -> None:
        transacao = self.repository.buscarPorId(transacao_id, empresa_id, usuario_id)
        if not transacao:
            raise BusinessException("Transação não encontrada.", status_code=404)

        try:
            tipo = int(transacao.tipo_transacao_id)
            if int(transacao.situacao) == SituacaoTransacaoEnum.CONFIRMADO:
                if tipo == TipoTransacaoEnum.TRANSFERENCIA:
                    if transacao.conta_id:
                        origem = self.repository.session.get(Contas, transacao.conta_id)
                        if origem:
                            origem.saldo_atual += transacao.valor
                    if transacao.transferencia_para_conta_id:
                        destino = self.repository.session.get(Contas, transacao.transferencia_para_conta_id)
                        if destino:
                            destino.saldo_atual -= transacao.valor
                elif transacao.conta_id:
                    sinal = -1 if tipo == TipoTransacaoEnum.DESPESA else 1
                    cb = self.repository.session.get(Contas, transacao.conta_id)
                    if cb:
                        cb.saldo_atual -= sinal * transacao.valor

            if tipo == TipoTransacaoEnum.DESPESA:
                conta_pagar = self.repository.session.query(ContasPagar).filter_by(
                    transacao_id=transacao.id, empresa_id=empresa_id
                ).first()
                if conta_pagar:
                    self.repository.session.delete(conta_pagar)
            elif tipo == TipoTransacaoEnum.RECEITA:
                conta_receber = self.repository.session.query(ContasReceber).filter_by(
                    transacao_id=transacao.id, empresa_id=empresa_id
                ).first()
                if conta_receber:
                    self.repository.session.delete(conta_receber)

            self.repository.deletarTransacao(transacao)
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao deletar transação.", status_code=400)

    def gerarRecorrencia(self, empresa_id: int, transacao_id: int, usuario_id: int, parcelas: int = 11) -> list[TransacaoResposta]:
        origem = self.repository.buscarPorId(transacao_id, empresa_id, usuario_id)
        if not origem:
            raise BusinessException("Transação não encontrada.", status_code=404)

        novas: list[Transacoes] = []
        for i in range(1, parcelas + 1):
            data_base = origem.data
            mes  = data_base.month + i
            ano  = data_base.year + (mes - 1) // 12
            mes  = (mes - 1) % 12 + 1
            dia  = min(data_base.day, calendar.monthrange(ano, mes)[1])
            nova_data = data_base.replace(year=ano, month=mes, day=dia)

            novas.append(Transacoes(
                descricao=origem.descricao,
                valor=origem.valor,
                data=nova_data,
                conta_id=origem.conta_id,
                categoria_id=origem.categoria_id,
                tipo_transacao_id=origem.tipo_transacao_id,
                situacao=origem.situacao,
                empresa_id=empresa_id,
                recorrencia=origem.recorrencia,
            ))

        try:
            criadas = self.repository.criarEmLote(novas)
            self.repository.session.commit()
            for t in criadas:
                self.repository.session.refresh(t)
            ids = [t.id for t in criadas]
            criadas_completas = [self.repository.buscarComRelacionamentos(i) for i in ids]
            return [TransacaoResposta.model_validate(t) for t in criadas_completas]
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao gerar recorrência.", status_code=400)
