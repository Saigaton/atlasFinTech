import bcrypt

from app.schemas.auth import RepostaUsuario
from app.exceptions.businessException import BusinessException
from app.repositories.authRepository import AuthRepository
from app.entidades.usuarios import Usuarios
from datetime import datetime, timezone

class AuthService:
    def __init__(self, repository: AuthRepository):
        self.repository  = repository

    def criarUsuario(self, dados: dict) -> RepostaUsuario:
        # Validação de senha
        if dados["senha"] != dados["confirmarSenha"]:
            raise BusinessException("As senhas não coincidem", status_code=400)

        # Verificação de e-mail existente
        if self.repository.buscarPorEmail(dados["email"]):
            raise BusinessException("Este e-mail já existe no sistema", status_code=422)

        dados["senha_hash"] = self.fazerSenhaHash(dados["senha"])

        dados.pop("confirmarSenha", None)
        dados.pop("senha", None)

        dados["data_criacao"] = datetime.now(timezone.utc)

        # 4. Preparar objeto para o banco
        novo_usuario = Usuarios(**dados)

        return RepostaUsuario.model_validate(self.repository.salvarUsuario(novo_usuario))

    # def validarSenha(plain_password: str, hashed_password: str) -> bool:
    #     # return pwd_context.verify(plain_password, hashed_password)


    def fazerSenhaHash(self, senha: str) -> str:
         # Bcrypt espera bytes, então codificamos a string
        pwd_bytes = senha.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_bytes, salt)

        return hashed.decode('utf-8')