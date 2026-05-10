from datetime import datetime, timezone

from app.entidades.contas import Contas
from app.exceptions.businessException import BusinessException
from app.repositories.contaBancariaRepository import ContaBancariaRepository
from app.schemas.contaBancaria import ContaAtualizar, ContaResposta, CriarContaBancaria


class ContaBancariaService:
    def __init__(self, repository: ContaBancariaRepository):
        self.repository = repository

    def criarConta(self, empresa_id: int, usuario_id: int, dados: CriarContaBancaria) -> ContaResposta:
        conta = Contas(
            nome=dados.nome,
            saldo_inicial=dados.saldo_inicial,
            saldo_atual=dados.saldo_inicial,
            agencia=dados.agencia,
            nome_banco=dados.nome_banco,
            data_criacao=datetime.now(timezone.utc),
            empresa_id=empresa_id,
            usuario_id=usuario_id,
            tipo_conta_id=dados.tipo,
        )
        try:
            conta = self.repository.criarConta(conta)
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar conta bancária.", status_code=400)

    def listarContas(self, empresa_id: int, usuario_id: int) -> list[ContaResposta]:
        contas = self.repository.listarContasPorEmpresa(empresa_id, usuario_id)
        return [ContaResposta.model_validate(c) for c in contas]

    def atualizarConta(self, empresa_id: int, conta_id: int, usuario_id: int, dados: ContaAtualizar) -> ContaResposta:
        conta = self.repository.buscarContaPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta não encontrada.", status_code=404)

        try:
            self.repository.atualizarConta(conta, dados.model_dump(exclude_none=True))
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar conta bancária.", status_code=400)

    def deletarConta(self, empresa_id: int, conta_id: int, usuario_id: int) -> None:
        conta = self.repository.buscarContaPorId(conta_id, empresa_id, usuario_id)
        if not conta:
            raise BusinessException("Conta não encontrada.", status_code=404)

        try:
            self.repository.deletarConta(conta)
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao deletar conta bancária.", status_code=400)
