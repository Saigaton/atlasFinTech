from datetime import datetime, timezone
from typing import Optional

from app.entidades.contasReceber import ContasReceber
from app.entidades.transacoes import Transacoes
from app.enums.situacaoTransacaoEnum import SituacaoTransacaoEnum
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum
from app.enums.tipoTransacaoEnum import TipoTransacaoEnum
from app.exceptions.businessException import BusinessException
from app.repositories.contaReceberRepository import ContaReceberRepository
from app.schemas.contaReceber import AtualizarContaReceber, ContaReceberResposta, CriarContaReceber, RecebimentoContaReceber, ResumoContasReceberResposta


class ContaReceberService:
    def __init__(self, repository: ContaReceberRepository):
        self.repository = repository

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

    def criarContaReceber(self, empresa_id: int, usuario_id: int, dados: CriarContaReceber) -> ContaReceberResposta:
        conta = ContasReceber(
            descricao=dados.descricao,
            valor=dados.valor,
            data_vencimento=dados.data_vencimento,
            conta_id=dados.conta_id,
            categoria_id=dados.categoria_id,
            cliente=dados.cliente,
            notas=dados.notas,
            data_recebimento=None,
            situacao_id=TipoSituacaoContaEnum.PENDENTE,
            empresa_id=empresa_id,
        )
        try:
            self.repository.session.add(conta)
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaReceberResposta.model_validate(conta)
        except Exception as e:
            print(e)
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar conta a receber.", status_code=400)

    def listarContasReceber(self, empresa_id: int, usuario_id: int, situacao: Optional[int] = None, pesquisa: Optional[str] = None) -> list[ContaReceberResposta]:
        self._atualizar_vencidas(empresa_id, usuario_id)
        contas = self.repository.listarPorEmpresa(empresa_id, usuario_id)
        if situacao is not None:
            contas = [c for c in contas if c.situacao_id == situacao]
        if pesquisa:
            contas = [c for c in contas if pesquisa.lower() in (c.descricao or "").lower()]
        return [ContaReceberResposta.model_validate(c) for c in contas]

    def atualizarContaReceber(self, empresa_id: int, conta_id: int, usuario_id: int, dados: AtualizarContaReceber) -> ContaReceberResposta:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a receber não encontrada.", status_code=404)
        if conta.situacao_id == TipoSituacaoContaEnum.PAGO:
            raise BusinessException("Conta já recebida não pode ser editada.", status_code=400)

        try:
            campos = dados.model_dump(exclude_none=True)
            self.repository.atualizarContaReceber(conta, campos)

            hoje = datetime.now(timezone.utc).date()
            nova_data = conta.data_vencimento.date() if hasattr(conta.data_vencimento, 'date') else conta.data_vencimento
            if nova_data < hoje:
                conta.situacao_id = TipoSituacaoContaEnum.ATRASADO
            else:
                conta.situacao_id = TipoSituacaoContaEnum.PENDENTE

            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaReceberResposta.model_validate(conta)
        except BusinessException:
            raise
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar conta a receber.", status_code=400)

    def receberConta(self, empresa_id: int, conta_id: int, usuario_id: int, dados: RecebimentoContaReceber) -> ContaReceberResposta:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a receber não encontrada.", status_code=404)
        if conta.situacao_id == TipoSituacaoContaEnum.PAGO:
            raise BusinessException("Conta já foi recebida.", status_code=400)

        try:
            self.repository.atualizarContaReceber(conta, {
                "situacao_id":     TipoSituacaoContaEnum.PAGO,
                "data_recebimento": dados.data_recebimento,
            })

            transacao = Transacoes(
                descricao=    conta.descricao,
                valor=        dados.valor_recebido or conta.valor,
                data=         dados.data_recebimento,
                conta_id=     dados.conta_id,
                categoria_id= conta.categoria_id,
                transacao_id= TipoTransacaoEnum.RECEITA,
                situacao=     SituacaoTransacaoEnum.CONFIRMADO,
                empresa_id=   empresa_id,
                recorrencia=  "nenhuma",
            )
            self.repository.session.add(transacao)

            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaReceberResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao registrar recebimento.", status_code=400)

    def resumoContasReceber(self, empresa_id: int, usuario_id: int) -> ResumoContasReceberResposta:
        self._atualizar_vencidas(empresa_id, usuario_id)
        dados = self.repository.resumo(empresa_id, usuario_id)
        return ResumoContasReceberResposta(**dados)

    def deletarContaReceber(self, empresa_id: int, conta_id: int, usuario_id: int) -> None:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a receber não encontrada.", status_code=404)

        try:
            self.repository.deletarContaReceber(conta)
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao deletar conta a receber.", status_code=400)
