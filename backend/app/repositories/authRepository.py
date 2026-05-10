from app.entidades.atualizacaoTokens import AtualizacaoTokens
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

    def buscarUsuarioPorId(self, usuarioId: int) -> Usuarios | None:
        return self.session.query(Usuarios).filter(Usuarios.id == usuarioId).first()

    def salvarTokenAtualizacao(self, token: AtualizacaoTokens) -> None:
        self.session.add(token)
        self.session.flush()

    def buscarTokenAtualizacaoPorJti(self, jti: str) -> AtualizacaoTokens | None:
        return self.session.query(AtualizacaoTokens).filter(AtualizacaoTokens.jti == jti).first()

    def revogarTokenAtualizacao(self, jti: str) -> None:
        self.session.query(AtualizacaoTokens).filter(AtualizacaoTokens.jti == jti).update({"revogado": True}, synchronize_session=False)

    def revogarTodosTokensDoUsuario(self, usuarioId: int) -> None:
        self.session.query(AtualizacaoTokens).filter(
            AtualizacaoTokens.user_id == usuarioId,
            AtualizacaoTokens.revogado == False
        ).update({"revogado": True}, synchronize_session=False)

    def marcarEmailVerificado(self, usuarioId: int) -> None:
        self.session.query(Usuarios).filter(Usuarios.id == usuarioId).update({"esta_verificado": True}, synchronize_session=False)

    def buscarTokenResetPorToken(self, token: str) -> TokenResetSenha | None:
        return self.session.query(TokenResetSenha).filter(TokenResetSenha.token == token).first()

    def atualizarSenhaUsuario(self, usuarioId: int, senhaHash: str) -> None:
        self.session.query(Usuarios).filter(Usuarios.id == usuarioId).update({"senha_hash": senhaHash}, synchronize_session=False)