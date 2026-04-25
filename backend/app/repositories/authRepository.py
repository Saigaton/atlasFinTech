from app.entidades.tokenResetSenha import TokenResetSenha
from app.entidades.usuarios import Usuarios
from sqlalchemy import exists

class AuthRepository:
    def __init__(self, session):
        self.session = session

    def existeUsuarioPorEmail(self, email: str) -> bool:
        return self.session.query(exists().where(Usuarios.email == email)).scalar()

    def buscarUsuarioPorEmail(self, email: str) -> bool:
        return self.session.query(Usuarios).filter(Usuarios.email == email).first()
    
    def invalidarRecuperarSenhaTokenPorUsuario(self, usuario: Usuarios):
        self.session.query(TokenResetSenha).filter(
        TokenResetSenha.usuario_id == usuario.id,
        TokenResetSenha.usado == False
        ).update({"usado": True}, synchronize_session=False)

    def salvarRecuperarSenhaTokenPorUsuario(self, token: TokenResetSenha):
        self.session.add(token)
        self.session.flush()

    def salvarUsuario(self, usuario: Usuarios) -> Usuarios:
        self.session.add(usuario)
        self.session.flush()
        return usuario