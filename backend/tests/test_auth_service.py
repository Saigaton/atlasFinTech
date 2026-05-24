import pytest
import bcrypt
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services.auth_service import AuthService
from app.exceptions.business_exception import BusinessException
from tests.conftest import make_usuario

# Hash gerado uma única vez para toda a sessão de testes (rounds=4 = mais rápido)
_SENHA = "senha123"
_HASH = bcrypt.hashpw(_SENHA.encode(), bcrypt.gensalt(rounds=4)).decode()


@pytest.fixture
def repo():
    r = MagicMock()
    r.session = MagicMock()
    return r


@pytest.fixture
def service(repo):
    return AuthService(repo)


# ── criarUsuario ──────────────────────────────────────────────────────────────

class TestCriarUsuario:
    def test_senhas_incompativeis_levanta_excecao(self, service):
        with pytest.raises(BusinessException) as exc:
            service.criarUsuario({
                "nome": "Ana", "email": "ana@test.com",
                "senha": "abc123", "confirmarSenha": "xyz999",
            })
        assert exc.value.status_code == 400
        assert "coincidem" in exc.value.message

    def test_email_duplicado_levanta_excecao(self, service, repo):
        repo.existeUsuarioPorEmail.return_value = True
        with pytest.raises(BusinessException) as exc:
            service.criarUsuario({
                "nome": "Ana", "email": "ana@test.com",
                "senha": "abc", "confirmarSenha": "abc",
            })
        assert exc.value.status_code == 422

    def test_sucesso_salva_usuario_e_comita(self, service, repo):
        repo.existeUsuarioPorEmail.return_value = False
        repo.salvarUsuario.return_value = make_usuario(id=1, nome="Ana", email="ana@test.com")
        result = service.criarUsuario({
            "nome": "Ana", "email": "ana@test.com",
            "senha": "abc", "confirmarSenha": "abc",
        })
        repo.salvarUsuario.assert_called_once()
        repo.session.commit.assert_called_once()
        assert result.id == 1

    def test_erro_db_faz_rollback(self, service, repo):
        repo.existeUsuarioPorEmail.return_value = False
        repo.salvarUsuario.side_effect = Exception("DB error")
        with pytest.raises(BusinessException):
            service.criarUsuario({
                "nome": "Ana", "email": "ana@test.com",
                "senha": "abc", "confirmarSenha": "abc",
            })
        repo.session.rollback.assert_called_once()


# ── loginUsuario ──────────────────────────────────────────────────────────────

class TestLoginUsuario:
    def test_usuario_nao_encontrado(self, service, repo):
        repo.buscarUsuarioPorEmail.return_value = None
        with pytest.raises(BusinessException) as exc:
            service.loginUsuario({"email": "x@x.com", "senha": "abc"})
        assert exc.value.status_code == 401

    def test_conta_google_nao_permite_login_por_senha(self, service, repo):
        repo.buscarUsuarioPorEmail.return_value = make_usuario(
            criado_via_google=True, senha_hash=_HASH
        )
        with pytest.raises(BusinessException) as exc:
            service.loginUsuario({"email": "x@x.com", "senha": _SENHA})
        assert exc.value.status_code == 401
        assert "Google" in exc.value.message

    def test_senha_incorreta(self, service, repo):
        repo.buscarUsuarioPorEmail.return_value = make_usuario(
            criado_via_google=False, senha_hash=_HASH
        )
        with pytest.raises(BusinessException) as exc:
            service.loginUsuario({"email": "x@x.com", "senha": "senha_errada"})
        assert exc.value.status_code == 401

    def test_sucesso_retorna_usuario(self, service, repo):
        repo.buscarUsuarioPorEmail.return_value = make_usuario(
            criado_via_google=False, senha_hash=_HASH
        )
        result = service.loginUsuario({"email": "joao@example.com", "senha": _SENHA})
        assert result.id == 1
        assert result.estaAtivo is True


# ── validarSenha ──────────────────────────────────────────────────────────────

class TestValidarSenha:
    def test_senha_correta_retorna_true(self, service):
        assert service.validarSenha(_SENHA, _HASH) is True

    def test_senha_incorreta_retorna_false(self, service):
        assert service.validarSenha("senha_errada", _HASH) is False


# ── verificarEmail ────────────────────────────────────────────────────────────

class TestVerificarEmail:
    def test_token_invalido(self, service):
        with patch("app.services.auth_service.decodificarTokenVerificacaoEmail", return_value=None):
            with pytest.raises(BusinessException) as exc:
                service.verificarEmail("token_invalido")
            assert exc.value.status_code == 400

    def test_usuario_nao_encontrado(self, service, repo):
        with patch("app.services.auth_service.decodificarTokenVerificacaoEmail", return_value={"sub": "1"}):
            repo.buscarUsuarioPorId.return_value = None
            with pytest.raises(BusinessException) as exc:
                service.verificarEmail("token")
            assert exc.value.status_code == 404

    def test_email_ja_verificado(self, service, repo):
        with patch("app.services.auth_service.decodificarTokenVerificacaoEmail", return_value={"sub": "1"}):
            repo.buscarUsuarioPorId.return_value = make_usuario(esta_verificado=True)
            with pytest.raises(BusinessException) as exc:
                service.verificarEmail("token")
            assert exc.value.status_code == 400

    def test_sucesso_marca_email_verificado(self, service, repo):
        with patch("app.services.auth_service.decodificarTokenVerificacaoEmail", return_value={"sub": "1"}):
            repo.buscarUsuarioPorId.return_value = make_usuario(esta_verificado=False)
            service.verificarEmail("token")
            repo.marcarEmailVerificado.assert_called_once_with(1)
            repo.session.commit.assert_called_once()


# ── logoutUsuario ─────────────────────────────────────────────────────────────

class TestLogoutUsuario:
    def test_token_invalido(self, service):
        with patch("app.services.auth_service.decodificarTokenAtualizacao", return_value=None):
            with pytest.raises(BusinessException) as exc:
                service.logoutUsuario("token")
            assert exc.value.status_code == 401

    def test_token_nao_existe_no_banco(self, service, repo):
        with patch("app.services.auth_service.decodificarTokenAtualizacao", return_value={"jti": "abc"}):
            repo.buscarTokenAtualizacaoPorJti.return_value = None
            with pytest.raises(BusinessException) as exc:
                service.logoutUsuario("token")
            assert exc.value.status_code == 401

    def test_token_ja_revogado(self, service, repo):
        with patch("app.services.auth_service.decodificarTokenAtualizacao", return_value={"jti": "abc"}):
            repo.buscarTokenAtualizacaoPorJti.return_value = SimpleNamespace(revogado=True)
            with pytest.raises(BusinessException) as exc:
                service.logoutUsuario("token")
            assert exc.value.status_code == 401

    def test_sucesso_revoga_token(self, service, repo):
        with patch("app.services.auth_service.decodificarTokenAtualizacao", return_value={"jti": "abc"}):
            repo.buscarTokenAtualizacaoPorJti.return_value = SimpleNamespace(revogado=False)
            service.logoutUsuario("token")
            repo.revogarTokenAtualizacao.assert_called_once_with("abc")
            repo.session.commit.assert_called_once()


# ── tokenAtualizacao ──────────────────────────────────────────────────────────

class TestTokenAtualizacao:
    def test_refresh_token_invalido(self, service):
        with patch("app.services.auth_service.decodificarTokenAtualizacao", return_value=None):
            with pytest.raises(BusinessException) as exc:
                service.tokenAtualizacao("token")
            assert exc.value.status_code == 401

    def test_token_invalido_no_banco(self, service, repo):
        with patch("app.services.auth_service.decodificarTokenAtualizacao", return_value={"jti": "abc", "sub": "1"}):
            repo.buscarTokenAtualizacaoPorJti.return_value = None
            with pytest.raises(BusinessException) as exc:
                service.tokenAtualizacao("token")
            assert exc.value.status_code == 401

    def test_usuario_inativo(self, service, repo):
        with patch("app.services.auth_service.decodificarTokenAtualizacao", return_value={"jti": "abc", "sub": "1"}):
            repo.buscarTokenAtualizacaoPorJti.return_value = SimpleNamespace(esta_valido=True)
            repo.buscarUsuarioPorId.return_value = make_usuario(esta_ativo=False)
            with pytest.raises(BusinessException) as exc:
                service.tokenAtualizacao("token")
            assert exc.value.status_code == 401

    def test_sucesso_retorna_novo_access_token(self, service, repo):
        with patch("app.services.auth_service.decodificarTokenAtualizacao", return_value={"jti": "abc", "sub": "1"}):
            with patch("app.services.auth_service.criarTokenAcesso", return_value="novo_access"):
                repo.buscarTokenAtualizacaoPorJti.return_value = SimpleNamespace(esta_valido=True)
                repo.buscarUsuarioPorId.return_value = make_usuario(id=1, esta_ativo=True)
                result = service.tokenAtualizacao("meu_refresh")
        assert result.access_token == "novo_access"
        assert result.refresh_token == "meu_refresh"


# ── esqueceuSenha ─────────────────────────────────────────────────────────────

class TestEsqueceuSenha:
    def test_usuario_nao_encontrado_retorna_none(self, service, repo):
        repo.buscarUsuarioPorEmail.return_value = None
        assert service.esqueceuSenha("x@x.com") is None

    def test_sucesso_retorna_token_string(self, service, repo):
        repo.buscarUsuarioPorEmail.return_value = make_usuario(id=1)
        token_mock = SimpleNamespace(token="reset_abc123")
        with patch("app.services.auth_service.criarRecuperarSenhaTokenPorUsuario", return_value=token_mock):
            result = service.esqueceuSenha("joao@example.com")
        assert result == "reset_abc123"
        repo.session.commit.assert_called_once()


# ── reenviarVerificacaoEmail ──────────────────────────────────────────────────

class TestReenviarVerificacaoEmail:
    def test_usuario_nao_encontrado_retorna_none(self, service, repo):
        repo.buscarUsuarioPorEmail.return_value = None
        assert service.reenviarVerificacaoEmail("x@x.com") is None

    def test_email_ja_verificado_retorna_none(self, service, repo):
        repo.buscarUsuarioPorEmail.return_value = make_usuario(esta_verificado=True)
        assert service.reenviarVerificacaoEmail("x@x.com") is None

    def test_sucesso_retorna_token(self, service, repo):
        repo.buscarUsuarioPorEmail.return_value = make_usuario(id=1, esta_verificado=False)
        with patch("app.services.auth_service.criarTokenVerificacaoEmail", return_value="verif_token"):
            result = service.reenviarVerificacaoEmail("joao@example.com")
        assert result == "verif_token"


# ── definirSenha ──────────────────────────────────────────────────────────────

class TestDefinirSenha:
    def test_usuario_nao_encontrado(self, service, repo):
        repo.buscarUsuarioPorId.return_value = None
        with pytest.raises(BusinessException) as exc:
            service.definirSenha(1, "nova_senha")
        assert exc.value.status_code == 404

    def test_usuario_nao_criado_via_google_rejeita(self, service, repo):
        repo.buscarUsuarioPorId.return_value = make_usuario(criado_via_google=False)
        with pytest.raises(BusinessException) as exc:
            service.definirSenha(1, "nova_senha")
        assert exc.value.status_code == 400

    def test_sucesso_atualiza_senha_e_revoga_tokens(self, service, repo):
        repo.buscarUsuarioPorId.return_value = make_usuario(criado_via_google=True)
        service.definirSenha(1, "nova_senha_segura")
        repo.atualizarSenhaUsuario.assert_called_once()
        repo.marcarSenhaDefinida.assert_called_once_with(1)
        repo.revogarTodosTokensDoUsuario.assert_called_once_with(1)
        repo.session.commit.assert_called_once()


# ── trocarSenha ───────────────────────────────────────────────────────────────

class TestTrocarSenha:
    def test_senha_atual_incorreta(self, service, repo):
        repo.buscarUsuarioPorId.return_value = make_usuario(senha_hash=_HASH)
        with pytest.raises(BusinessException) as exc:
            service.trocarSenha(1, "senha_errada", "nova_senha")
        assert exc.value.status_code == 400
        assert "incorreta" in exc.value.message

    def test_sucesso_atualiza_senha_e_revoga_tokens(self, service, repo):
        repo.buscarUsuarioPorId.return_value = make_usuario(senha_hash=_HASH)
        service.trocarSenha(1, _SENHA, "nova_senha_123")
        repo.atualizarSenhaUsuario.assert_called_once()
        repo.revogarTodosTokensDoUsuario.assert_called_once_with(1)
        repo.session.commit.assert_called_once()


# ── redefinirSenha ────────────────────────────────────────────────────────────

class TestRedefinirSenha:
    def test_token_nao_encontrado(self, service, repo):
        repo.buscarTokenResetPorToken.return_value = None
        with pytest.raises(BusinessException) as exc:
            service.redefinirSenha("token_invalido", "nova_senha")
        assert exc.value.status_code == 400

    def test_token_ja_utilizado(self, service, repo):
        repo.buscarTokenResetPorToken.return_value = SimpleNamespace(usado=True)
        with pytest.raises(BusinessException) as exc:
            service.redefinirSenha("token", "nova_senha")
        assert exc.value.status_code == 400

    def test_token_expirado(self, service, repo):
        repo.buscarTokenResetPorToken.return_value = SimpleNamespace(
            usado=False,
            expira_em=datetime(2020, 1, 1),
            usuario_id=1, usuario=make_usuario(),
        )
        with pytest.raises(BusinessException) as exc:
            service.redefinirSenha("token", "nova_senha")
        assert exc.value.status_code == 400
        assert "expirado" in exc.value.message

    def test_sucesso_redefine_senha_e_revoga_tokens(self, service, repo):
        repo.buscarTokenResetPorToken.return_value = SimpleNamespace(
            usado=False,
            expira_em=datetime(2030, 12, 31),
            usuario_id=1, usuario=make_usuario(),
        )
        service.redefinirSenha("token", "nova_senha_segura")
        repo.atualizarSenhaUsuario.assert_called_once()
        repo.revogarTodosTokensDoUsuario.assert_called_once_with(1)
        repo.session.commit.assert_called_once()
