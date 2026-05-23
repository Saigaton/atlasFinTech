from datetime import datetime, timezone

from app.entidades.atualizacao_tokens import AtualizacaoTokens
from app.entidades.token_reset_senha import TokenResetSenha
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

    def marcarSenhaDefinida(self, usuarioId: int) -> None:
        self.session.query(Usuarios).filter(Usuarios.id == usuarioId).update({"criado_via_google": False}, synchronize_session=False)

    def atualizarNomeUsuario(self, usuarioId: int, nome: str) -> None:
        self.session.query(Usuarios).filter(Usuarios.id == usuarioId).update({"nome": nome}, synchronize_session=False)

    def buscarOuCriarUsuarioGoogle(self, email: str, nome: str, senhaHash: str, googleId: str) -> Usuarios:
        usuario = self.buscarUsuarioPorEmail(email.lower())
        if not usuario:
            usuario = Usuarios(
                nome=nome,
                email=email.lower(),
                senha_hash=senhaHash,
                esta_ativo=True,
                esta_verificado=True,
                criado_via_google=True,
                data_criacao=datetime.now(timezone.utc),
                google_id=googleId,
            )
            self.session.add(usuario)
            self.session.flush()
        elif not usuario.google_id:
            usuario.google_id = googleId
            if not usuario.esta_verificado:
                usuario.esta_verificado = True
            self.session.flush()
        return usuario