import pytest
from unittest.mock import MagicMock

from app.services.categoria_service import CategoriaService
from app.exceptions.business_exception import BusinessException
from app.schemas.categoria import AtualizarCategoria, CriarCategoria
from app.enums.tipo_categoria_enum import TipoCategoriaEnum
from tests.conftest import make_categoria


@pytest.fixture
def repo():
    r = MagicMock()
    r.session = MagicMock()
    return r


@pytest.fixture
def service(repo):
    return CategoriaService(repo)


class TestCriarCategoria:
    def test_sucesso_cria_e_retorna_categoria(self, service, repo):
        repo.criarCategoria.return_value = make_categoria(id=1, nome="Lazer")
        dados = CriarCategoria(nome="Lazer", tipo=TipoCategoriaEnum.DESPESA, cor="#AABBCC")
        result = service.criarCategoria(empresa_id=1, dados=dados)
        repo.criarCategoria.assert_called_once()
        repo.session.commit.assert_called_once()
        assert result.id == 1
        assert result.nome == "Lazer"

    def test_erro_db_faz_rollback(self, service, repo):
        repo.criarCategoria.side_effect = Exception("DB error")
        dados = CriarCategoria(nome="Lazer", tipo=TipoCategoriaEnum.DESPESA)
        with pytest.raises(BusinessException):
            service.criarCategoria(empresa_id=1, dados=dados)
        repo.session.rollback.assert_called_once()


class TestListarCategorias:
    def test_retorna_categorias_da_empresa(self, service, repo):
        repo.listarPorEmpresa.return_value = [
            make_categoria(id=1, nome="Alimentação"),
            make_categoria(id=2, nome="Transporte"),
        ]
        result = service.listarCategorias(empresa_id=1, usuario_id=1)
        assert len(result) == 2


class TestAtualizarCategoria:
    def test_categoria_nao_encontrada(self, service, repo):
        repo.buscarPorId.return_value = None
        dados = AtualizarCategoria(nome="Novo Nome")
        with pytest.raises(BusinessException) as exc:
            service.atualizarCategoria(
                empresa_id=1, categoria_id=99, usuario_id=1, dados=dados
            )
        assert exc.value.status_code == 404

    def test_sucesso_atualiza_categoria(self, service, repo):
        categoria = make_categoria(id=1, nome="Antiga")
        repo.buscarPorId.return_value = categoria

        def aplicar_update(cat, campos):
            for k, v in campos.items():
                setattr(cat, k, v)

        repo.atualizarCategoria.side_effect = aplicar_update
        dados = AtualizarCategoria(nome="Nova")
        result = service.atualizarCategoria(
            empresa_id=1, categoria_id=1, usuario_id=1, dados=dados
        )
        repo.atualizarCategoria.assert_called_once()
        repo.session.commit.assert_called_once()
        assert result.nome == "Nova"


class TestDeletarCategoria:
    def test_categoria_nao_encontrada(self, service, repo):
        repo.buscarPorId.return_value = None
        with pytest.raises(BusinessException) as exc:
            service.deletarCategoria(empresa_id=1, categoria_id=99, usuario_id=1)
        assert exc.value.status_code == 404

    def test_sucesso_deleta_categoria(self, service, repo):
        repo.buscarPorId.return_value = make_categoria()
        service.deletarCategoria(empresa_id=1, categoria_id=1, usuario_id=1)
        repo.deletarCategoria.assert_called_once()
        repo.session.commit.assert_called_once()

    def test_erro_db_faz_rollback(self, service, repo):
        repo.buscarPorId.return_value = make_categoria()
        repo.deletarCategoria.side_effect = Exception("DB error")
        with pytest.raises(BusinessException):
            service.deletarCategoria(empresa_id=1, categoria_id=1, usuario_id=1)
        repo.session.rollback.assert_called_once()
