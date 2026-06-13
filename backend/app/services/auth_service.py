import bcrypt
import secrets

import jwt as pyjwt
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.configuracoes.security import criarRecuperarSenhaTokenPorUsuario, criarTokenAcesso, criarTokenRefresh, criarTokenVerificacaoEmail, decodificarTokenAtualizacao, decodificarTokenVerificacaoEmail
from app.configuracoes.config import settings
from app.entidades.atualizacao_tokens import AtualizacaoTokens
from app.entidades.token_reset_senha import TokenResetSenha
from app.schemas.auth import RespostaLogin, RespostaTokenUsuario, RespostaUsuario
from app.schemas.resposta_api import RespostaApi
from app.exceptions.business_exception import BusinessException
from app.repositories.auth_repository import AuthRepository
from app.entidades.usuarios import Usuarios
from datetime import datetime, timezone

# Autor: Davi Santos
class AuthService:
    def __init__(self, repository: AuthRepository):
        self.repository  = repository

    # Cria um novo usuário validando que as senhas coincidem, que o e-mail ainda não
    # está cadastrado e gerando o hash bcrypt antes de persistir no banco.
    def criarUsuario(self, dados: dict) -> RespostaUsuario:
        if dados["senha"] != dados["confirmarSenha"]:
            raise BusinessException("As senhas não coincidem", status_code=400)

        if self.repository.existeUsuarioPorEmail(dados["email"]):
            raise BusinessException("Este e-mail já existe no sistema", status_code=422)

        dados["senha_hash"] = self.criarSenhaHash(dados["senha"])

        dados.pop("confirmarSenha", None)
        dados.pop("senha", None)

        dados["data_criacao"] = datetime.now(timezone.utc)

        novo_usuario = Usuarios(**dados)

        try:
            novo_usuario = self.repository.salvarUsuario(novo_usuario)

            self.repository.session.commit()
            self.repository.session.refresh(novo_usuario)

            return RespostaUsuario.model_validate(novo_usuario)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao salvar novo usuário.", status_code=400)

    # Autentica o usuário por e-mail e senha. Bloqueia o login com senha em contas
    # criadas exclusivamente via Google para evitar confusão de fluxos de autenticação.
    def loginUsuario(self, dados: dict) -> RespostaUsuario:
        usuario = self.repository.buscarUsuarioPorEmail(dados["email"])

        if not usuario:
            raise BusinessException("E-mail ou senha incorretos", status_code=401)

        if getattr(usuario, "criado_via_google", False):
            raise BusinessException(
                "Esta conta foi criada com o Google. Use o botão 'Continuar com Google' para entrar.",
                status_code=401,
            )

        if not self.validarSenha(dados["senha"], usuario.senha_hash):
            raise BusinessException("E-mail ou senha incorretos", status_code=401)

        return RespostaUsuario.model_validate(usuario)

    # Compara a senha em texto puro com o hash bcrypt armazenado no banco.
    def validarSenha(self, senhaPura: str, senhaHash: str) -> bool:
        return bcrypt.checkpw(
        senhaPura.encode('utf-8'),
        senhaHash.encode('utf-8')
    )

    # Gera um hash bcrypt com salt aleatório para armazenamento seguro da senha.
    def criarSenhaHash(self, senha: str) -> str:
        pwd_bytes = senha.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_bytes, salt)
        return hashed.decode('utf-8')

    # Invalida tokens de recuperação anteriores do usuário e gera um novo token
    # de redefinição de senha com prazo de expiração.
    def solicitarRecuperacaoSenha(self, dados: dict) -> TokenResetSenha:
        usuario = self.repository.buscarUsuarioPorEmail(dados["email"])

        if not usuario:
            raise BusinessException("Usuário invalido.", status_code=404)

        token = criarRecuperarSenhaTokenPorUsuario(usuario.id)
        try:
            self.repository.invalidarRecuperarSenhaTokenPorUsuario(usuario)
            self.repository.salvarRecuperarSenhaTokenPorUsuario(token)
            self.repository.session.commit()
            return token
        except Exception:
            raise BusinessException("Erro ao processar recuperação de senha.", status_code=400)

    # Decodifica o token JWT de verificação de e-mail e marca a conta como verificada.
    # Rejeita tokens inválidos, expirados ou já utilizados.
    def verificarEmail(self, token: str) -> RespostaApi:
        payload = decodificarTokenVerificacaoEmail(token)
        if not payload:
            raise BusinessException("Token de verificação inválido ou expirado.", status_code=400)

        usuario_id = int(payload.get("sub"))
        usuario = self.repository.buscarUsuarioPorId(usuario_id)
        if not usuario:
            raise BusinessException("Usuário não encontrado.", status_code=404)

        if usuario.esta_verificado:
            raise BusinessException("E-mail já verificado.", status_code=400)

        try:
            self.repository.marcarEmailVerificado(usuario_id)
            self.repository.session.commit()
            return RespostaApi(conteudo=None, mensagem="E-mail verificado com sucesso.")
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao verificar e-mail.", status_code=400)

    # Persiste o refresh token no banco após um login bem-sucedido para controle de sessões ativas.
    def salvarTokenRefresh(self, usuarioId: int, jti: str, expiracao: datetime) -> None:
        token = AtualizacaoTokens(
            jti=jti,
            user_id=usuarioId,
            expira_em=expiracao,
        )
        try:
            self.repository.salvarTokenAtualizacao(token)
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao salvar token de atualização.", status_code=400)

    # Revoga o refresh token no banco, encerrando a sessão do usuário. Impede reuso
    # de tokens já revogados mesmo que ainda estejam dentro do prazo de validade.
    def logoutUsuario(self, refresh_token: str) -> None:
        payload = decodificarTokenAtualizacao(refresh_token)
        if not payload:
            raise BusinessException("Refresh token inválido ou expirado.", status_code=401)

        jti = payload.get("jti")
        token_db = self.repository.buscarTokenAtualizacaoPorJti(jti)
        if not token_db or token_db.revogado:
            raise BusinessException("Refresh token inválido ou já revogado.", status_code=401)

        try:
            self.repository.revogarTokenAtualizacao(jti)
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao realizar logout.", status_code=400)

    # Valida o refresh token e emite um novo access token sem exigir nova autenticação,
    # permitindo que sessões permaneçam ativas além do tempo de vida do access token.
    def tokenAtualizacao(self, refresh_token: str) -> RespostaTokenUsuario:
        payload = decodificarTokenAtualizacao(refresh_token)
        if not payload:
            raise BusinessException("Refresh token inválido ou expirado.", status_code=401)

        jti = payload.get("jti")
        token_db = self.repository.buscarTokenAtualizacaoPorJti(jti)
        if not token_db or not token_db.esta_valido:
            raise BusinessException("Refresh token inválido ou expirado.", status_code=401)

        usuario_id = int(payload.get("sub"))
        usuario = self.repository.buscarUsuarioPorId(usuario_id)
        if not usuario or not usuario.esta_ativo:
            raise BusinessException("Usuário inválido.", status_code=401)

        return RespostaTokenUsuario(
            access_token=criarTokenAcesso({"id": str(usuario_id), "nome": usuario.nome, "email": usuario.email}),
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    # Gera um token de recuperação de senha para o e-mail informado. Retorna None sem
    # erro quando o e-mail não existe (evita enumeração de usuários por timing).
    def esqueceuSenha(self, email: str) -> str | None:
        usuario = self.repository.buscarUsuarioPorEmail(email.lower())
        if not usuario:
            return None

        token = criarRecuperarSenhaTokenPorUsuario(usuario.id)
        try:
            self.repository.invalidarRecuperarSenhaTokenPorUsuario(usuario)
            self.repository.salvarRecuperarSenhaTokenPorUsuario(token)
            self.repository.session.commit()
            return token.token
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao processar recuperação de senha.", status_code=400)

    # Reenvia o token de verificação de e-mail apenas se a conta existir e ainda não
    # estiver verificada. Retorna None silenciosamente nos demais casos.
    def reenviarVerificacaoEmail(self, email: str) -> str | None:
        usuario = self.repository.buscarUsuarioPorEmail(email.lower())
        if not usuario or usuario.esta_verificado:
            return None
        return criarTokenVerificacaoEmail(usuario.id)

    # Permite que contas criadas via Google sem senha própria definam uma pela primeira vez.
    # Revoga todas as sessões ativas após a definição para forçar novo login com a nova senha.
    def definirSenha(self, usuarioId: int, novaSenha: str) -> RespostaApi:
        usuario = self.repository.buscarUsuarioPorId(usuarioId)
        if not usuario:
            raise BusinessException("Usuário não encontrado.", status_code=404)
        if not getattr(usuario, "criado_via_google", False):
            raise BusinessException("Esta opção é exclusiva para contas criadas via Google sem senha cadastrada.", status_code=400)
        senhaHash = self.criarSenhaHash(novaSenha)
        try:
            self.repository.atualizarSenhaUsuario(usuarioId, senhaHash)
            self.repository.marcarSenhaDefinida(usuarioId)
            self.repository.revogarTodosTokensDoUsuario(usuarioId)
            self.repository.session.commit()
            return RespostaApi(conteudo=None, mensagem="Senha definida com sucesso.")
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao definir senha.", status_code=400)

    # Valida a senha atual antes de substituí-la pela nova. Revoga todas as sessões ativas
    # para forçar novo login em outros dispositivos após a troca.
    def trocarSenha(self, usuarioId: int, senhaAtual: str, novaSenha: str) -> RespostaApi:
        usuario = self.repository.buscarUsuarioPorId(usuarioId)
        if not self.validarSenha(senhaAtual, usuario.senha_hash):
            raise BusinessException("Senha atual incorreta.", status_code=400)

        senhaHash = self.criarSenhaHash(novaSenha)
        try:
            self.repository.atualizarSenhaUsuario(usuarioId, senhaHash)
            self.repository.revogarTodosTokensDoUsuario(usuarioId)
            self.repository.session.commit()
            return RespostaApi(conteudo=None, mensagem="Senha alterada com sucesso.")
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao alterar senha.", status_code=400)

    # Atualiza o nome do usuário autenticado no perfil.
    def atualizarPerfil(self, usuarioId: int, nome: str) -> RespostaUsuario:
        try:
            self.repository.atualizarNomeUsuario(usuarioId, nome)
            self.repository.session.commit()
            usuario = self.repository.buscarUsuarioPorId(usuarioId)
            return RespostaUsuario.model_validate(usuario)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar perfil.", status_code=400)

    # Verifica o id_token emitido pelo Google OAuth. Cria a conta automaticamente na
    # primeira vez (usando e-mail e nome do payload) e emite tokens JWT próprios da aplicação.
    # Aceita tokens sem verificação de assinatura quando GOOGLE_CLIENT_ID não está configurado
    # (útil em ambiente de desenvolvimento).
    def loginGoogle(self, idToken: str) -> RespostaLogin:
        try:
            if settings.GOOGLE_CLIENT_ID:
                payload = google_id_token.verify_oauth2_token(
                    idToken,
                    google_requests.Request(),
                    settings.GOOGLE_CLIENT_ID,
                )
            else:
                payload = pyjwt.decode(idToken, options={"verify_signature": False})
        except Exception:
            raise BusinessException("Token do Google inválido.", status_code=401)

        email     = payload.get("email", "")
        nome      = payload.get("name", email)
        google_id = payload.get("sub", "")

        if not email:
            raise BusinessException("Token do Google não contém e-mail.", status_code=400)

        senhaHash = self.criarSenhaHash(secrets.token_hex(32))

        try:
            usuario = self.repository.buscarOuCriarUsuarioGoogle(email, nome, senhaHash, google_id)
            tokenRefresh = criarTokenRefresh(str(usuario.id))
            self.repository.salvarTokenAtualizacao(
                AtualizacaoTokens(jti=tokenRefresh.jti, user_id=usuario.id, expira_em=tokenRefresh.expiracao)
            )
            self.repository.session.commit()
            self.repository.session.refresh(usuario)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao processar login com Google.", status_code=400)

        return RespostaLogin(
            token=RespostaTokenUsuario(
                access_token=criarTokenAcesso({"id": str(usuario.id), "nome": usuario.nome, "email": usuario.email}),
                refresh_token=tokenRefresh.token,
                token_type="bearer",
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            ),
            usuario=RespostaUsuario.model_validate(usuario),
        )

    # Valida o token de redefinição de senha (verifica existência, uso anterior e expiração),
    # aplica o hash da nova senha e revoga todas as sessões ativas do usuário.
    def redefinirSenha(self, tokenStr: str, novaSenha: str) -> RespostaApi:
        tokenReset = self.repository.buscarTokenResetPorToken(tokenStr)
        if not tokenReset or tokenReset.usado:
            raise BusinessException("Token inválido ou já utilizado.", status_code=400)

        if datetime.now() > tokenReset.expira_em:
            raise BusinessException("Token de recuperação expirado.", status_code=400)

        senhaHash = self.criarSenhaHash(novaSenha)
        try:
            self.repository.atualizarSenhaUsuario(tokenReset.usuario_id, senhaHash)
            self.repository.invalidarRecuperarSenhaTokenPorUsuario(tokenReset.usuario)
            self.repository.revogarTodosTokensDoUsuario(tokenReset.usuario_id)
            self.repository.session.commit()
            return RespostaApi(conteudo=None, mensagem="Senha redefinida com sucesso.")
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao redefinir senha.", status_code=400)
