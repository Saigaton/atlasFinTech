import pytest
from decimal import Decimal
from unittest.mock import MagicMock

from app.services.conta_bancaria_service import ContaBancariaService
from app.exceptions.business_exception import BusinessException
from app.schemas.conta_bancaria import ContaAtualizar, CriarContaBancaria, TransferirConta
from app.enums.tipo_conta_enum import TipoContaEnum
from tests.conftest import make_conta


@pytest.fixture
def repo():
    r = MagicMock()
    r.session = MagicMock()
    return r


@pytest.fixture
def service(repo):
    return ContaBancariaService(repo)


class TestCriarConta:
    def test_sucesso_cria_conta_com_saldo_inicial(self, service, repo):
        repo.criarConta.return_value = make_conta(id=1, saldo_atual=Decimal("500.00"))
        dados = CriarContaBancaria(
            nome="Poupança", tipo=TipoContaEnum.POUPANCA, saldoInicial=Decimal("500.00")
        )
        result = service.criarConta(empresaId=1, usuarioId=1, dados=dados)
        repo.criarConta.assert_called_once()
        repo.session.commit.assert_called_once()
        assert result.saldoAtual == Decimal("500.00")


class TestListarContas:
    def test_retorna_contas_da_empresa(self, service, repo):
        repo.listarContasPorEmpresa.return_value = [
            make_conta(id=1, nome="Corrente"),
            make_conta(id=2, nome="Poupança"),
        ]
        result = service.listarContas(empresaId=1, usuarioId=1)
        assert len(result) == 2


class TestAtualizarConta:
    def test_conta_nao_encontrada(self, service, repo):
        repo.buscarContaPorId.return_value = None
        dados = ContaAtualizar(tipo=TipoContaEnum.CORRENTE, saldoAtual=Decimal("0"))
        with pytest.raises(BusinessException) as exc:
            service.atualizarConta(empresaId=1, contaId=99, usuarioId=1, dados=dados)
        assert exc.value.status_code == 404

    def test_sucesso_atualiza_campos(self, service, repo):
        conta = make_conta(id=1, nome="Antiga", saldo_atual=Decimal("100.00"))
        repo.buscarContaPorId.return_value = conta

        def aplicar_update(c, campos):
            for k, v in campos.items():
                setattr(c, k, v)

        repo.atualizarConta.side_effect = aplicar_update
        dados = ContaAtualizar(
            nome="Nova", tipo=TipoContaEnum.CORRENTE, saldoAtual=Decimal("200.00")
        )
        result = service.atualizarConta(empresaId=1, contaId=1, usuarioId=1, dados=dados)
        repo.session.commit.assert_called_once()
        assert result.nome == "Nova"


class TestTransferir:
    def test_mesma_conta_levanta_excecao(self, service):
        dados = TransferirConta(
            deContaId=1, paraContaId=1, valor=Decimal("100.00"), data="2025-01-01"
        )
        with pytest.raises(BusinessException) as exc:
            service.transferir(empresaId=1, usuarioId=1, dados=dados)
        assert exc.value.status_code == 400
        assert "iguais" in exc.value.message

    def test_conta_origem_nao_encontrada(self, service, repo):
        repo.buscarContaPorId.return_value = None
        dados = TransferirConta(
            deContaId=1, paraContaId=2, valor=Decimal("100.00"), data="2025-01-01"
        )
        with pytest.raises(BusinessException) as exc:
            service.transferir(empresaId=1, usuarioId=1, dados=dados)
        assert exc.value.status_code == 404
        assert "origem" in exc.value.message

    def test_conta_destino_nao_encontrada(self, service, repo):
        origem = make_conta(id=1, saldo_atual=Decimal("1000.00"))

        def buscar(contaId, empresaId, usuarioId):
            if contaId == 1:
                return origem
            return None

        repo.buscarContaPorId.side_effect = buscar
        dados = TransferirConta(
            deContaId=1, paraContaId=2, valor=Decimal("100.00"), data="2025-01-01"
        )
        with pytest.raises(BusinessException) as exc:
            service.transferir(empresaId=1, usuarioId=1, dados=dados)
        assert exc.value.status_code == 404
        assert "destino" in exc.value.message

    def test_saldo_insuficiente(self, service, repo):
        origem = make_conta(id=1, saldo_atual=Decimal("50.00"))
        destino = make_conta(id=2, saldo_atual=Decimal("200.00"))

        def buscar(contaId, empresaId, usuarioId):
            return origem if contaId == 1 else destino

        repo.buscarContaPorId.side_effect = buscar
        dados = TransferirConta(
            deContaId=1, paraContaId=2, valor=Decimal("100.00"), data="2025-01-01"
        )
        with pytest.raises(BusinessException) as exc:
            service.transferir(empresaId=1, usuarioId=1, dados=dados)
        assert exc.value.status_code == 400
        assert "Saldo insuficiente" in exc.value.message

    def test_sucesso_debita_origem_e_credita_destino(self, service, repo):
        origem = make_conta(id=1, saldo_atual=Decimal("1000.00"))
        destino = make_conta(id=2, saldo_atual=Decimal("500.00"))

        def buscar(contaId, empresaId, usuarioId):
            return origem if contaId == 1 else destino

        repo.buscarContaPorId.side_effect = buscar
        dados = TransferirConta(
            deContaId=1, paraContaId=2, valor=Decimal("200.00"), data="2025-01-01"
        )
        service.transferir(empresaId=1, usuarioId=1, dados=dados)

        assert origem.saldo_atual == Decimal("800.00")
        assert destino.saldo_atual == Decimal("700.00")
        repo.session.commit.assert_called_once()


class TestDeletarConta:
    def test_conta_nao_encontrada(self, service, repo):
        repo.buscarContaPorId.return_value = None
        with pytest.raises(BusinessException) as exc:
            service.deletarConta(empresa_id=1, conta_id=99, usuario_id=1)
        assert exc.value.status_code == 404

    def test_sucesso_deleta_conta(self, service, repo):
        repo.buscarContaPorId.return_value = make_conta()
        repo.temTransacoesVinculadas.return_value = False
        service.deletarConta(empresa_id=1, conta_id=1, usuario_id=1)
        repo.deletarConta.assert_called_once()
        repo.session.commit.assert_called_once()
