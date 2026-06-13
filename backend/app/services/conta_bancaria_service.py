from datetime import datetime, timezone

from app.entidades.contas import Contas
from app.exceptions.business_exception import BusinessException
from app.repositories.conta_bancaria_repository import ContaBancariaRepository
from app.schemas.conta_bancaria import ContaAtualizar, ContaResposta, CriarContaBancaria, TransferirConta

# Autor: Davi Santos
class ContaBancariaService:
    def __init__(self, repository: ContaBancariaRepository):
        self.repository = repository

    # Cria uma nova conta bancária definindo o saldo atual igual ao saldo inicial informado.
    def criarConta(self, empresaId: int, usuarioId: int, dados: CriarContaBancaria) -> ContaResposta:
        conta = Contas(
            nome=dados.nome,
            saldo_inicial=dados.saldoInicial,
            saldo_atual=dados.saldoInicial,
            agencia=dados.agencia,
            nome_banco=dados.nomeBanco,
            data_criacao=datetime.now(timezone.utc),
            empresa_id=empresaId,
            usuario_id=usuarioId,
            tipo_conta_id=dados.tipo,
            cor=dados.cor
        )
        try:
            conta = self.repository.criarConta(conta)
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar conta bancária.", status_code=400)

    # Lista todas as contas bancárias pertencentes à empresa e usuário autenticado.
    def listarContas(self, empresaId: int, usuarioId: int) -> list[ContaResposta]:
        contas = self.repository.listarContasPorEmpresa(empresaId, usuarioId)
        return [ContaResposta.model_validate(c) for c in contas]

    # Mapeamento de campos camelCase do schema para snake_case da entidade.
    _CAMPO_ENTIDADE = {
        "saldoAtual": "saldo_atual",
        "tipo":       "tipo_conta_id",
        "nomeBanco":  "nome_banco",
    }

    # Atualiza apenas os campos enviados na requisição (PATCH semântico via exclude_none).
    # Converte os nomes camelCase do schema para snake_case da entidade antes de persistir.
    def atualizarConta(self, empresaId: int, contaId: int, usuarioId: int, dados: ContaAtualizar) -> ContaResposta:
        conta = self.repository.buscarContaPorId(contaId, empresaId, usuarioId)
        if not conta:
            raise BusinessException("Conta não encontrada.", status_code=404)

        dados_mapeados = {
            self._CAMPO_ENTIDADE.get(k, k): v
            for k, v in dados.model_dump(exclude_none=True).items()
        }

        try:
            self.repository.atualizarConta(conta, dados_mapeados)
            self.repository.session.commit()
            self.repository.session.refresh(conta)
            return ContaResposta.model_validate(conta)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar conta bancária.", status_code=400)

    # Realiza transferência entre duas contas da mesma empresa. Valida que origem e destino
    # são diferentes, que ambas existem e que a conta de origem possui saldo suficiente.
    # Debita da origem e credita no destino de forma atômica.
    def transferir(self, empresaId: int, usuarioId: int, dados: TransferirConta) -> None:
        if dados.deContaId == dados.paraContaId:
            raise BusinessException("Conta de origem e destino não podem ser iguais.", status_code=400)

        origem = self.repository.buscarContaPorId(dados.deContaId, empresaId, usuarioId)
        if not origem:
            raise BusinessException("Conta de origem não encontrada.", status_code=404)

        destino = self.repository.buscarContaPorId(dados.paraContaId, empresaId, usuarioId)
        if not destino:
            raise BusinessException("Conta de destino não encontrada.", status_code=404)

        if origem.saldo_atual < dados.valor:
            raise BusinessException("Saldo insuficiente na conta de origem.", status_code=400)

        try:
            origem.saldo_atual  -= dados.valor
            destino.saldo_atual += dados.valor
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao realizar transferência.", status_code=400)

    # Remove a conta bancária da empresa. Não estorna saldos (responsabilidade do usuário
    # zerar a conta antes de excluir).
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
