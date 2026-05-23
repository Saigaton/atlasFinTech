from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import secrets
from typing import Any, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.entidades.token_reset_senha import TokenResetSenha
from app.entidades.usuarios import Usuarios

from app.configuracoes.config import settings
from app.configuracoes.database import get_db

esquemaBearer = HTTPBearer()


@dataclass
class DadosTokenRefresh:
    token: str
    jti: str
    expiracao: datetime


def criarTokenAcesso(dados: dict[str, Any], deltaExpiracao: timedelta | None = None) -> str:
    expiracao = datetime.now(timezone.utc) + (
        deltaExpiracao if deltaExpiracao else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub":  dados["id"],
        "email":  dados["email"],
        "nome":  dados["nome"],
        "exp":  expiracao,
        "iat":  datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def criarTokenRefresh(usuarioId: Any) -> DadosTokenRefresh:
    jti = secrets.token_hex(16)
    expiracao = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub":  str(usuarioId),
        "exp":  expiracao,
        "iat":  datetime.now(timezone.utc),
        "type": "refresh",
        "jti":  jti,
    }
    token = jwt.encode(payload, settings.REFRESH_SECRET_KEY, algorithm=settings.ALGORITHM)
    return DadosTokenRefresh(token=token, jti=jti, expiracao=expiracao)

def criarRecuperarSenhaTokenPorUsuario(usuarioId: int) -> TokenResetSenha:
        token = TokenResetSenha(
            token=secrets.token_urlsafe(32),
            expira_em=datetime.now() + timedelta(hours=1),
            usuario_id=usuarioId,
        )
        return token

def criarTokenVerificacaoEmail(usuarioId: int) -> str:
    payload = {
        "sub": str(usuarioId),
        "type": "email_verification",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decodificarTokenVerificacaoEmail(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "email_verification":
            return None
        return payload
    except Exception:
        return None


def decodificarTokenAtualizacao(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, settings.REFRESH_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "refresh":
            return None
        return payload
    except Exception:
        return None


def obterUsuarioAtual(credenciais: HTTPAuthorizationCredentials = Depends(esquemaBearer)) -> dict[str, Any]:
    token = credenciais.credentials
    credenciaisInvalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        id: str | None = payload.get("sub")
        if id is None:
            raise credenciaisInvalidas
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise credenciaisInvalidas


def obterUsuarioAtualDB(
    payload: dict[str, Any] = Depends(obterUsuarioAtual),
    db: Session = Depends(get_db),
):
    email: str = payload["email"]
    id: str = payload["sub"]
    usuario = db.query(Usuarios).filter(Usuarios.email == email, Usuarios.id == id).first()
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")
    return usuario
