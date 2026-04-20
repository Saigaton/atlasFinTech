from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db

from app.core.security import create_access_token, verify_password
from app.schemas.auth import LoginRequest, LoginResponse, TokenResponse, UserInfo
from app.core.config import settings

router = APIRouter()

# Usuários fictícios para demonstração (em produção, use um banco de dados)
FAKE_USERS_DB: dict[str, dict] = {
    "usuario@exemplo.com": {
        "id": 1,
        "email": "usuario@exemplo.com",
        "name": "Usuário Exemplo",
        # senha: senha123
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
    },
    "admin@exemplo.com": {
        "id": 2,
        "email": "admin@exemplo.com",
        "name": "Administrador",
        # senha: admin123
        "hashed_password": "$2b$12$gSvqqUPvlXP2tfVFaWK1Be7DlH.PKZbv5H8KnzzVgXXbVxpva.pFm",
    },
}


@router.post(
    "/auth/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Login do usuário",
    description=(
        "Autentica o usuário com e-mail e senha. "
        "Retorna um token JWT Bearer e os dados do usuário.\n\n"
    ),
    responses={
        200: {"description": "Login realizado com sucesso"},
        401: {"description": "Credenciais inválidas"},
        422: {"description": "Dados de entrada inválidos"},
    },
)
async def login(body: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = FAKE_USERS_DB.get(body.email)

    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["email"], "user_id": user["id"]})

    return LoginResponse(
        token=TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
        user=UserInfo(
            id=user["id"],
            email=user["email"],
            name=user["name"],
        ),
    )
