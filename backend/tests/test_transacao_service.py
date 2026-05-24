import pytest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock, call

from app.services.transacao_service import TransacaoService
from app.exceptions.business_exception import BusinessException
from app.schemas.transacao import AtualizarTransacao, CriarTransacao
from app.enums.tipo_transacao_enum import TipoTransacaoEnum
from app.enums.situacao_transacao_enum import SituacaoTransacaoEnum
from app.entidades.contas import Contas
from tests.conftest import make_conta, make_transacao


@pytest.fixture
def repo():
    r = MagicMock()
    r.session = MagicMock()
    return r


@pytest.fixture
def service(repo):
    return TransacaoService(repo)


def _dados_transacao(**kwargs):
    defaults = dict(
        descricao="Compra mercado",
        valor=Decimal("100.00"),
        data=datetime(2025, 6, 1, tzinfo=timezone.utc),
        conta_id=1,
        tipo=TipoTransacaoEnum.DESPESA,
        situacao=SituacaoTransacaoEnum.PENDENTE,
        recorrencia="nenhuma",
    )
    defaults.update(kwargs)
    return CriarTransacao(**defaults)


class TestCriarTransacao:
    def test_despesa_pendente_nao_altera_saldo(self, service, repo):
        transacao_criada = make_transacao(id=1)
        repo.criarTransacao.return_value = transacao_criada
        repo.buscarComRelacionamentos.return_value = make_transacao(id=1)

        service.criarTransacao(1, 1, _dados_transacao(
            tipo=TipoTransacaoEnum.DESPESA,
            situacao=SituacaoTransacaoEnum.PENDENTE,
        ))

        # Saldo não deve ser alterado para transação pendente
        repo.session.get.assert_not_called()
        repo.session.commit.assert_called_once()

    def test_despesa_confirmada_debita_saldo_da_conta(self, service, repo):
        transacao_criada = make_transacao(id=1)
        conta_banco = make_conta(saldo_atual=Decimal("1000.00"))

        repo.criarTransacao.return_value = transacao_criada
        repo.session.get.return_value = conta_banco
        repo.buscarComRelacionamentos.return_value = make_transacao(id=1)

        service.criarTransacao(1, 1, _dados_transacao(
            tipo=TipoTransacaoEnum.DESPESA,
            situacao=SituacaoTransacaoEnum.CONFIRMADO,
            valor=Decimal("100.00"),
            conta_id=1,
        ))

        assert conta_banco.saldo_atual == Decimal("900.00")

    def test_receita_confirmada_credita_saldo_da_conta(self, service, repo):
        transacao_criada = make_transacao(id=1)
        conta_banco = make_conta(saldo_atual=Decimal("1000.00"))

        repo.criarTransacao.return_value = transacao_criada
        repo.session.get.return_value = conta_banco
        repo.buscarComRelacionamentos.return_value = make_transacao(
            id=1, transacao_id=int(TipoTransacaoEnum.RECEITA)
        )

        service.criarTransacao(1, 1, _dados_transacao(
            tipo=TipoTransacaoEnum.RECEITA,
            situacao=SituacaoTransacaoEnum.CONFIRMADO,
            valor=Decimal("200.00"),
            conta_id=1,
        ))

        assert conta_banco.saldo_atual == Decimal("1200.00")

    def test_despesa_cria_conta_pagar_vinculada(self, service, repo):
        transacao_criada = make_transacao(id=1)
        repo.criarTransacao.return_value = transacao_criada
        repo.buscarComRelacionamentos.return_value = make_transacao(id=1)

        service.criarTransacao(1, 1, _dados_transacao(
            tipo=TipoTransacaoEnum.DESPESA,
            situacao=SituacaoTransacaoEnum.PENDENTE,
        ))

        # session.add deve ser chamado para a ContasPagar vinculada
        repo.session.add.assert_called_once()


class TestListarTransacoes:
    def test_retorna_lista_paginavel(self, service, repo):
        repo.listarComFiltros.return_value = [
            make_transacao(id=1), make_transacao(id=2)
        ]
        result = service.listarTransacoes(empresa_id=1, usuario_id=1)
        assert len(result) == 2


class TestBuscarTransacao:
    def test_nao_encontrada_levanta_excecao(self, service, repo):
        repo.buscarComRelacionamentos.return_value = None
        with pytest.raises(BusinessException) as exc:
            service.buscarTransacao(empresa_id=1, transacao_id=99, usuario_id=1)
        assert exc.value.status_code == 404

    def test_sucesso_retorna_transacao(self, service, repo):
        repo.buscarComRelacionamentos.return_value = make_transacao(id=1)
        result = service.buscarTransacao(empresa_id=1, transacao_id=1, usuario_id=1)
        assert result.id == 1


class TestDeletarTransacao:
    def test_nao_encontrada_levanta_excecao(self, service, repo):
        repo.buscarPorId.return_value = None
        with pytest.raises(BusinessException) as exc:
            service.deletarTransacao(empresa_id=1, transacao_id=99, usuario_id=1)
        assert exc.value.status_code == 404

    def test_despesa_confirmada_reverte_saldo_ao_deletar(self, service, repo):
        transacao = make_transacao(
            id=1,
            transacao_id=int(TipoTransacaoEnum.DESPESA),
            situacao=int(SituacaoTransacaoEnum.CONFIRMADO),
            conta_id=1,
            valor=Decimal("100.00"),
        )
        conta_banco = make_conta(saldo_atual=Decimal("900.00"))

        repo.buscarPorId.return_value = transacao
        repo.session.get.return_value = conta_banco
        # Sem conta_pagar vinculada
        repo.session.query.return_value.filter_by.return_value.first.return_value = None

        service.deletarTransacao(empresa_id=1, transacao_id=1, usuario_id=1)

        # Saldo deve ser reembolsado: 900 + 100 = 1000
        assert conta_banco.saldo_atual == Decimal("1000.00")
        repo.session.commit.assert_called_once()

    def test_receita_confirmada_reverte_saldo_ao_deletar(self, service, repo):
        transacao = make_transacao(
            id=1,
            transacao_id=int(TipoTransacaoEnum.RECEITA),
            situacao=int(SituacaoTransacaoEnum.CONFIRMADO),
            conta_id=1,
            valor=Decimal("200.00"),
        )
        conta_banco = make_conta(saldo_atual=Decimal("1200.00"))

        repo.buscarPorId.return_value = transacao
        repo.session.get.return_value = conta_banco
        repo.session.query.return_value.filter_by.return_value.first.return_value = None

        service.deletarTransacao(empresa_id=1, transacao_id=1, usuario_id=1)

        # Saldo deve ser revertido: 1200 - 200 = 1000
        assert conta_banco.saldo_atual == Decimal("1000.00")

    def test_transacao_pendente_nao_altera_saldo_ao_deletar(self, service, repo):
        transacao = make_transacao(
            id=1,
            transacao_id=int(TipoTransacaoEnum.DESPESA),
            situacao=int(SituacaoTransacaoEnum.PENDENTE),
            conta_id=1,
            valor=Decimal("100.00"),
        )
        repo.buscarPorId.return_value = transacao
        repo.session.query.return_value.filter_by.return_value.first.return_value = None

        service.deletarTransacao(empresa_id=1, transacao_id=1, usuario_id=1)

        # session.get NÃO deve ser chamado para transações pendentes
        repo.session.get.assert_not_called()


class TestGerarRecorrencia:
    def test_transacao_nao_encontrada(self, service, repo):
        repo.buscarPorId.return_value = None
        with pytest.raises(BusinessException) as exc:
            service.gerarRecorrencia(empresa_id=1, transacao_id=99, usuario_id=1)
        assert exc.value.status_code == 404

    def test_sucesso_gera_11_parcelas_mensais(self, service, repo):
        origem = make_transacao(
            id=1,
            data=datetime(2025, 1, 15, tzinfo=timezone.utc),
        )
        repo.buscarPorId.return_value = origem

        parcelas_criadas = [make_transacao(id=i + 2) for i in range(11)]
        repo.criarEmLote.return_value = parcelas_criadas
        repo.buscarComRelacionamentos.side_effect = lambda tid, *_: make_transacao(id=tid)

        result = service.gerarRecorrencia(empresa_id=1, transacao_id=1, usuario_id=1)

        assert len(result) == 11
        repo.criarEmLote.assert_called_once()
        _, kwargs = repo.criarEmLote.call_args
        novas = repo.criarEmLote.call_args[0][0]
        assert len(novas) == 11
