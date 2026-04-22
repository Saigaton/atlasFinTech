import bcrypt

from app.schemas.auth import RespostaUsuario
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

        dados["senha_hash"] = self.fazerSenhaHash(dados["senha"])

        dados.pop("confirmarSenha", None)
        dados.pop("senha", None)

        dados["data_criacao"] = datetime.now(timezone.utc)

        # 4. Preparar objeto para o banco
        novo_usuario = Usuarios(**dados)

        return RespostaUsuario.model_validate(self.repository.salvarUsuario(novo_usuario))

    def loginUsuario(self, dados: dict) -> RespostaUsuario:
        usuario = self.repository.buscarPorEmail(dados["email"])

        # Verificação de e-mail existente
        if not usuario or not self.validarSenha(dados["senha"], usuario.senha_hash):
            raise BusinessException("E-mail ou senha incorretos", status_code=401)

        return RespostaUsuario.model_validate(usuario)

    def validarSenha(self, senhaPura: str, senhaHash: str) -> bool:
        return bcrypt.checkpw(
        senhaPura.encode('utf-8'),
        senhaHash.encode('utf-8')
    )

    def fazerSenhaHash(self, senha: str) -> str:
         # Bcrypt espera bytes, então codificamos a string
        pwd_bytes = senha.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_bytes, salt)

        return hashed.decode('utf-8')