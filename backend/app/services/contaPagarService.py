from datetime import datetime, timezone

from app.entidades.contasPagar import ContasPagar
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum
from app.exceptions.businessException import BusinessException
from app.repositories.contaPagarRepository import ContaPagarRepository
from app.schemas.contaPagar import AtualizarContaPagar, ContaPagarResposta, CriarContaPagar


class ContaPagarService:
    def __init__(self, repository: ContaPagarRepository):
        self.repository = repository

    def criarContaPagar(self, empresa_id: int, usuario_id: int, dados: CriarContaPagar) -> ContaPagarResposta:
        conta = ContasPagar(
            descricao=dados.descricao,
            valor=dados.valor,
            data_vencimento=dados.data_vencimento,
            data_pagamento=None,
            situacao_id=TipoSituacaoContaEnum.PENDENTE,
            empresa_id=empresa_id,
        )
        try:
            conta = self.repository.criarContaPagar(conta)
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaPagarResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar conta a pagar.", status_code=400)

    def listarContasPagar(self, empresa_id: int, usuario_id: int) -> list[ContaPagarResposta]:
        contas = self.repository.listarPorEmpresa(empresa_id, usuario_id)
        return [ContaPagarResposta.model_validate(c) for c in contas]

    def atualizarContaPagar(self, empresa_id: int, conta_id: int, usuario_id: int, dados: AtualizarContaPagar) -> ContaPagarResposta:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a pagar não encontrada.", status_code=404)

        try:
            self.repository.atualizarContaPagar(conta, dados.model_dump(exclude_none=True))
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaPagarResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar conta a pagar.", status_code=400)

    def pagarConta(self, empresa_id: int, conta_id: int, usuario_id: int) -> ContaPagarResposta:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a pagar não encontrada.", status_code=404)
        if conta.situacao_id == TipoSituacaoContaEnum.PAGO:
            raise BusinessException("Conta já foi paga.", status_code=400)

        try:
            self.repository.atualizarContaPagar(conta, {
                "situacao_id": TipoSituacaoContaEnum.PAGO,
                "data_pagamento": datetime.now(timezone.utc),
            })
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaPagarResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao registrar pagamento.", status_code=400)

    def deletarContaPagar(self, empresa_id: int, conta_id: int, usuario_id: int) -> None:
        conta = self.repository.buscarPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta a pagar não encontrada.", status_code=404)

        try:
            self.repository.deletarContaPagar(conta)
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao deletar conta a pagar.", status_code=400)
