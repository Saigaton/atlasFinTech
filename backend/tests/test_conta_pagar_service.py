import pytest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock, patch

from app.services.conta_pagar_service import ContaPagarService
from app.exceptions.business_exception import BusinessException
from app.schemas.conta_pagar import (
    AtualizarContaPagar,
    ContaPagarResposta,
    CriarContaPagar,
    PagamentoContaPagar,
)
from app.enums.tipo_situacao_conta_enum import TipoSituacaoContaEnum
from app.entidades.contas import Contas
from app.entidades.transacoes import Transacoes
from tests.conftest import make_conta, make_conta_pagar, make_transacao


@pytest.fixture
def repo():
    r = MagicMock()
    r.session = MagicMock()
    return r


@pytest.fixture
def service(repo):
    return ContaPagarService(repo)


def _dados_criar(**kwargs) -> CriarContaPagar:
    defaults = dict(
        descricao="Aluguel",
        valor=Decimal("1200.00"),
        data_vencimento=datetime(2025, 7, 1, tzinfo=timezone.utc),
        total_parcelas=1,
    )
    defaults.update(kwargs)
    return CriarContaPagar(**defaults)


class TestCriarContaPagar:
    def test_parcela_unica_sem_sufixo_no_nome(self, service, repo):
        with patch.object(ContaPagarResposta, "model_validate", side_effect=lambda p: MagicMock(descricao=p.descricao)):
            result = service.criarContaPagar(1, 1, _dados_criar(descricao="Aluguel", total_parcelas=1))
        assert result[0].descricao == "Aluguel"

    def test_parcelamento_divide_valor_e_adiciona_sufixo(self, service, repo):
        with patch.object(ContaPagarResposta, "model_validate", side_effect=lambda p: MagicMock(valor=p.valor, descricao=p.descricao)):
            result = service.criarContaPagar(1, 1, _dados_criar(
                descricao="Notebook",
                valor=Decimal("3000.00"),
                total_parcelas=3,
            ))
        assert len(result) == 3
        # Cada parcela vale 1000.00
        for item in result:
            assert item.valor == Decimal("1000.00")

    def test_parcelamento_calcula_datas_mensalmente(self, service, repo):
        parcelas_capturadas = []

        def capturar(p):
            parcelas_capturadas.append(p)
            return MagicMock()

        with patch.object(ContaPagarResposta, "model_validate", side_effect=capturar):
            service.criarContaPagar(1, 1, _dados_criar(
                data_vencimento=datetime(2025, 1, 15, tzinfo=timezone.utc),
                total_parcelas=3,
            ))

        meses = [p.data_vencimento.month for p in parcelas_capturadas]
        assert meses == [1, 2, 3]

    def test_erro_db_faz_rollback(self, service, repo):
        repo.session.add.side_effect = Exception("DB error")
        with pytest.raises(BusinessException):
            service.criarContaPagar(1, 1, _dados_criar())
        repo.session.rollback.assert_called_once()


class TestListarContasPagar:
    def test_filtra_por_situacao(self, service, repo):
        pendente = make_conta_pagar(situacao_id=int(TipoSituacaoContaEnum.PENDENTE))
        pago = make_conta_pagar(situacao_id=int(TipoSituacaoContaEnum.PAGO))
        # data_vencimento futura → _atualizar_vencidas não modifica
        repo.listarPorEmpresa.return_value = [pendente, pago]

        result = service.listarContasPagar(
            empresa_id=1, usuario_id=1,
            situacao=int(TipoSituacaoContaEnum.PENDENTE),
        )
        assert len(result) == 1
        assert result[0].situacao_id == TipoSituacaoContaEnum.PENDENTE

    def test_filtra_por_pesquisa_texto(self, service, repo):
        repo.listarPorEmpresa.return_value = [
            make_conta_pagar(descricao="Aluguel"),
            make_conta_pagar(descricao="Internet"),
        ]
        result = service.listarContasPagar(
            empresa_id=1, usuario_id=1, pesquisa="alug"
        )
        assert len(result) == 1
        assert result[0].descricao == "Aluguel"


class TestAtualizarContaPagar:
    def test_nao_encontrada(self, service, repo):
        repo.buscarPorId.return_value = None
        with pytest.raises(BusinessException) as exc:
            service.atualizarContaPagar(1, 99, 1, AtualizarContaPagar(descricao="Novo nome"))
        assert exc.value.status_code == 404

    def test_conta_ja_paga_nao_pode_ser_editada(self, service, repo):
        repo.buscarPorId.return_value = make_conta_pagar(
            situacao_id=int(TipoSituacaoContaEnum.PAGO)
        )
        with pytest.raises(BusinessException) as exc:
            service.atualizarContaPagar(1, 1, 1, AtualizarContaPagar(descricao="Novo nome"))
        assert exc.value.status_code == 400
        assert "paga" in exc.value.message

    def test_sucesso_atualiza_campos(self, service, repo):
        conta = make_conta_pagar(
            situacao_id=int(TipoSituacaoContaEnum.PENDENTE),
            data_vencimento=datetime(2027, 12, 31, tzinfo=timezone.utc),
        )
        repo.buscarPorId.return_value = conta

        def aplicar(c, campos):
            for k, v in campos.items():
                setattr(c, k, v)

        repo.atualizarContaPagar.side_effect = aplicar
        service.atualizarContaPagar(1, 1, 1, AtualizarContaPagar(descricao="Aluguel Novo"))
        repo.session.commit.assert_called_once()


class TestPagarConta:
    def test_nao_encontrada(self, service, repo):
        repo.buscarPorId.return_value = None
        pagamento = PagamentoContaPagar(
            contaId=1,
            dataPagamento=datetime(2025, 6, 1, tzinfo=timezone.utc),
        )
        with pytest.raises(BusinessException) as exc:
            service.pagarConta(1, 99, 1, pagamento)
        assert exc.value.status_code == 404

    def test_conta_ja_paga_levanta_excecao(self, service, repo):
        repo.buscarPorId.return_value = make_conta_pagar(
            situacao_id=int(TipoSituacaoContaEnum.PAGO)
        )
        pagamento = PagamentoContaPagar(
            contaId=1,
            dataPagamento=datetime(2025, 6, 1, tzinfo=timezone.utc),
        )
        with pytest.raises(BusinessException) as exc:
            service.pagarConta(1, 1, 1, pagamento)
        assert exc.value.status_code == 400

    def test_sucesso_debita_saldo_da_conta_bancaria(self, service, repo):
        conta_pagar = make_conta_pagar(
            situacao_id=int(TipoSituacaoContaEnum.PENDENTE),
            transacao_id=None,  # sem transação vinculada
            valor=Decimal("200.00"),
        )
        conta_banco = make_conta(saldo_atual=Decimal("1000.00"))

        repo.buscarPorId.return_value = conta_pagar
        repo.session.get.return_value = conta_banco

        pagamento = PagamentoContaPagar(
            contaId=1,
            dataPagamento=datetime(2025, 6, 1, tzinfo=timezone.utc),
        )
        service.pagarConta(1, 1, 1, pagamento)

        assert conta_banco.saldo_atual == Decimal("800.00")
        repo.session.commit.assert_called_once()

    def test_sucesso_com_valor_personalizado(self, service, repo):
        conta_pagar = make_conta_pagar(
            situacao_id=int(TipoSituacaoContaEnum.PENDENTE),
            transacao_id=None,
            valor=Decimal("200.00"),
        )
        conta_banco = make_conta(saldo_atual=Decimal("1000.00"))

        repo.buscarPorId.return_value = conta_pagar
        repo.session.get.return_value = conta_banco

        pagamento = PagamentoContaPagar(
            contaId=1,
            dataPagamento=datetime(2025, 6, 1, tzinfo=timezone.utc),
            valorPago=Decimal("150.00"),
        )
        service.pagarConta(1, 1, 1, pagamento)

        # Deve usar valor_pago (150), não o valor original (200)
        assert conta_banco.saldo_atual == Decimal("850.00")


class TestDeletarContaPagar:
    def test_nao_encontrada(self, service, repo):
        repo.buscarPorId.return_value = None
        with pytest.raises(BusinessException) as exc:
            service.deletarContaPagar(1, 99, 1)
        assert exc.value.status_code == 404

    def test_conta_paga_reembolsa_saldo_ao_deletar(self, service, repo):
        conta_pagar = make_conta_pagar(
            situacao_id=int(TipoSituacaoContaEnum.PAGO),
            transacao_id=1,
            valor=Decimal("300.00"),
        )
        transacao = make_transacao(id=1, conta_id=1, valor=Decimal("300.00"))
        conta_banco = make_conta(saldo_atual=Decimal("700.00"))

        repo.buscarPorId.return_value = conta_pagar
        repo.session.get.side_effect = lambda cls, pk: (
            transacao if cls is Transacoes else conta_banco
        )

        service.deletarContaPagar(1, 1, 1)

        assert conta_banco.saldo_atual == Decimal("1000.00")
        repo.session.commit.assert_called_once()

    def test_conta_pendente_nao_altera_saldo_ao_deletar(self, service, repo):
        conta_pagar = make_conta_pagar(
            situacao_id=int(TipoSituacaoContaEnum.PENDENTE),
            transacao_id=None,
        )
        repo.buscarPorId.return_value = conta_pagar

        service.deletarContaPagar(1, 1, 1)

        repo.session.get.assert_not_called()
        repo.session.commit.assert_called_once()
