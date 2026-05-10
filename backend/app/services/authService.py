import bcrypt

from app.configuracoes.security import criarRecuperarSenhaTokenPorUsuario, criarTokenAcesso, criarTokenVerificacaoEmail, decodificarTokenAtualizacao, decodificarTokenVerificacaoEmail
from app.configuracoes.config import settings
from app.entidades.atualizacaoTokens import AtualizacaoTokens
from app.entidades.tokenResetSenha import TokenResetSenha
from app.schemas.auth import RespostaTokenUsuario, RespostaUsuario
from app.schemas.respostaMensagem import RespostaMensagem
from app.exceptions.businessException import BusinessException
from app.repositories.authRepository import AuthRepository
from app.entidades.usuarios import Usuarios
from datetime import datetime, timezone

class AuthService:
    def __init__(self, repository: AuthRepository):
        self.repository  = repository

    def criarUsuario(self, dados: dict) -> RespostaUsuario:
        # Validação de senha
        if dados["senha"] != dados["confirmarSenha"]:
            raise BusinessException("As senhas não coincidem", status_code=400)

        # Verificação de e-mail existente
        if self.repository.existeUsuarioPorEmail(dados["email"]):
            raise BusinessException("Este e-mail já existe no sistema", status_code=422)

        dados["senha_hash"] = self.criarSenhaHash(dados["senha"])

        dados.pop("confirmarSenha", None)
        dados.pop("senha", None)

        dados["data_criacao"] = datetime.now(timezone.utc)

        # 4. Preparar objeto para o banco
        novo_usuario = Usuarios(**dados)

        try:
            novo_usuario = self.repository.salvarUsuario(novo_usuario)

            self.repository.session.commit() 
            self.repository.session.refresh(novo_usuario)

            return RespostaUsuario.model_validate(novo_usuario)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao salvar novo usuário.", status_code=400)

    def loginUsuario(self, dados: dict) -> RespostaUsuario:
        usuario = self.repository.buscarUsuarioPorEmail(dados["email"])

        # Verificação de e-mail existente
        if not usuario or not self.validarSenha(dados["senha"], usuario.senha_hash):
            raise BusinessException("E-mail ou senha incorretos", status_code=401)
                
        return RespostaUsuario.model_validate(usuario)

    def validarSenha(self, senhaPura: str, senhaHash: str) -> bool:
        return bcrypt.checkpw(
        senhaPura.encode('utf-8'),
        senhaHash.encode('utf-8')
    )

    def criarSenhaHash(self, senha: str) -> str:
         # Bcrypt espera bytes, então codificamos a string
        pwd_bytes = senha.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_bytes, salt)

        return hashed.decode('utf-8')
    
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

    def verificarEmail(self, token: str) -> RespostaMensagem:
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
            return RespostaMensagem(mensagem="E-mail verificado com sucesso.")
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao verificar e-mail.", status_code=400)
    
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

    def reenviarVerificacaoEmail(self, email: str) -> str | None:
        usuario = self.repository.buscarUsuarioPorEmail(email.lower())
        if not usuario or usuario.esta_verificado:
            return None
        return criarTokenVerificacaoEmail(usuario.id)
    
    def trocarSenha(self, usuarioId: int, senhaAtual: str, novaSenha: str) -> RespostaMensagem:
        usuario = self.repository.buscarUsuarioPorId(usuarioId)
        if not self.validarSenha(senhaAtual, usuario.senha_hash):
            raise BusinessException("Senha atual incorreta.", status_code=400)

        senhaHash = self.criarSenhaHash(novaSenha)
        try:
            self.repository.atualizarSenhaUsuario(usuarioId, senhaHash)
            self.repository.revogarTodosTokensDoUsuario(usuarioId)
            self.repository.session.commit()
            return RespostaMensagem(mensagem="Senha alterada com sucesso.")
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao alterar senha.", status_code=400)

    def redefinirSenha(self, tokenStr: str, novaSenha: str) -> RespostaMensagem:
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
            return RespostaMensagem(mensagem="Senha redefinida com sucesso.")
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao redefinir senha.", status_code=400)
