from datetime import datetime, timezone

from app.entidades.contasReceber import ContasReceber
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum
from app.exceptions.businessException import BusinessException
from app.repositories.contaReceberRepository import ContaReceberRepository
from app.schemas.contaReceber import AtualizarContaReceber, ContaReceberResposta, CriarContaReceber


class ContaReceberService:
    def __init__(self, repository: ContaReceberRepository):
        self.repository = repository

    def criarContaReceber(self, empresa_id: int, usuario_id: int, dados: CriarContaReceber) -> ContaReceberResposta:
        conta = ContasReceber(
            descricao=dados.descricao,
            valor=dados.valor,
            data_vencimento=dados.data_vencimento,
            data_recebimento=None,
            situacao_id=TipoSituacaoContaEnum.PENDENTE,
            empresa_id=empresa_id,
        )
        try:
            conta = self.repository.criarContaReceber(conta)
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaReceberResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar conta a receber.", status_code=400)

    def listarContasReceber(self, empresa_id: int, usuario_id: int) -> list[ContaReceberResposta]:
        contas = self.repository.listarPorEmpresa(empresa_id, usuario_id)
        return [ContaReceberResposta.model_validate(c) for c in contas]

    def atualizarContaReceber(self, empresa_id: int, conta_id: int, usuario_id: int, dados: AtualizarContaReceber) -> ContaReceberResposta:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a receber não encontrada.", status_code=404)

        try:
            self.repository.atualizarContaReceber(conta, dados.model_dump(exclude_none=True))
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaReceberResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar conta a receber.", status_code=400)

    def receberConta(self, empresa_id: int, conta_id: int, usuario_id: int) -> ContaReceberResposta:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a receber não encontrada.", status_code=404)
        if conta.situacao_id == TipoSituacaoContaEnum.PAGO:
            raise BusinessException("Conta já foi recebida.", status_code=400)

        try:
            self.repository.atualizarContaReceber(conta, {
                "situacao_id": TipoSituacaoContaEnum.PAGO,
                "data_recebimento": datetime.now(timezone.utc),
            })
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaReceberResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao registrar recebimento.", status_code=400)

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
