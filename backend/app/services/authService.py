import secrets
import bcrypt

from app.entidades.tokenResetSenha import TokenResetSenha
from app.schemas.auth import RespostaUsuario
from app.exceptions.businessException import BusinessException
from app.repositories.authRepository import AuthRepository
from app.entidades.usuarios import Usuarios
from datetime import datetime, timedelta, timezone

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
        except Exception as e:
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

        token = self.criarRecuperarSenhaTokenPorUsuario(usuario.id)
        try:
            self.repository.invalidarRecuperarSenhaTokenPorUsuario(usuario)
            self.repository.salvarRecuperarSenhaTokenPorUsuario(token)
            self.repository.session.commit()
            return token
        except Exception as e:
            raise BusinessException("Erro ao processar recuperação de senha.", status_code=400)

    # def redefinirSenha(token_str: str, nova_senha: str, session: Session):
    #     token = session.query(TokenResetSenha).filter(
    #         TokenResetSenha.token == token_str,
    #         TokenResetSenha.usado == False,
    #         TokenResetSenha.expira_em > datetime.now()
    #     ).first()

    #     if not token:
    #         raise ValueError("Token inválido ou expirado")

    #     token.usuario.senha_hash = pwd_context.hash(nova_senha)
    #     token.usado = True  # invalida após uso
    #     session.commit()

    def criarRecuperarSenhaTokenPorUsuario(self, usuarioId: int) -> TokenResetSenha:
        token = TokenResetSenha(
            token=secrets.token_urlsafe(32),
            expira_em=datetime.now() + timedelta(hours=1),
            usuario_id=usuarioId,
        )
        return token
