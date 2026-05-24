import pytest
from unittest.mock import MagicMock

from app.services.empresa_service import EmpresaService
from app.exceptions.business_exception import BusinessException
from app.schemas.empresa import CriarEmpresa
from tests.conftest import make_empresa


@pytest.fixture
def repo():
    r = MagicMock()
    r.session = MagicMock()
    return r


@pytest.fixture
def service(repo):
    return EmpresaService(repo)


class TestListarEmpresas:
    def test_lista_vazia(self, service, repo):
        repo.listarEmpresasPorUsuario.return_value = []
        result = service.listarEmpresas(usuario_id=1)
        assert result == []

    def test_retorna_empresas_do_usuario(self, service, repo):
        repo.listarEmpresasPorUsuario.return_value = [
            make_empresa(id=1, nome="Empresa A"),
            make_empresa(id=2, nome="Empresa B"),
        ]
        result = service.listarEmpresas(usuario_id=1)
        assert len(result) == 2
        assert result[0].nome == "Empresa A"


class TestCriarEmpresa:
    def test_usuario_ja_possui_empresa_levanta_excecao(self, service, repo):
        repo.listarEmpresasPorUsuario.return_value = [make_empresa()]
        dados = CriarEmpresa(nome="Nova Empresa")
        with pytest.raises(BusinessException) as exc:
            service.criarEmpresa(dados, usuario_id=1)
        assert exc.value.status_code == 400
        assert "já possui" in exc.value.message

    def test_sucesso_cria_empresa(self, service, repo):
        repo.listarEmpresasPorUsuario.return_value = []
        repo.criarEmpresa.return_value = make_empresa(id=1, nome="Minha Empresa")
        dados = CriarEmpresa(nome="Minha Empresa")
        result = service.criarEmpresa(dados, usuario_id=1)
        repo.criarEmpresa.assert_called_once()
        repo.session.commit.assert_called_once()
        assert result.nome == "Minha Empresa"

    def test_erro_db_faz_rollback(self, service, repo):
        repo.listarEmpresasPorUsuario.return_value = []
        repo.criarEmpresa.side_effect = Exception("DB error")
        dados = CriarEmpresa(nome="Empresa")
        with pytest.raises(BusinessException):
            service.criarEmpresa(dados, usuario_id=1)
        repo.session.rollback.assert_called_once()
