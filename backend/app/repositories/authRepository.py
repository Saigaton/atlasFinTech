from app.entidades.usuarios import Usuarios
from sqlalchemy import exists

class AuthRepository:
    def __init__(self, session):
        self.session = session

    def buscarPorEmail(self, email: str) -> bool:
        return self.session.query(exists().where(Usuarios.email == email)).scalar()

    def salvarUsuario(self, usuario: Usuarios) -> Usuarios:
        self.session.add(usuario)
        self.session.commit()
        self.session.refresh(usuario)
        return usuario