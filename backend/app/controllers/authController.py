from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.configuracoes.database import get_db

from app.schemas.auth import RespostaToken, RespostaRegistro, RequisicaoRegistroUsuario
from app.configuracoes.config import settings
from app.configuracoes.security import createAccessToken
from app.repositories.authRepository import AuthRepository
from app.services.authService import AuthService

router = APIRouter()

def obterUsuarioService(db: Session = Depends(get_db)):
    repo = AuthRepository(db)
    return AuthService(repo)

@router.post(
    "/auth/registro",
    response_model=RespostaRegistro,
    status_code=status.HTTP_201_CREATED,
    summary="Registro do usuário",
    description=(
        "Cria um usuário. "
        "Retorna um token JWT Bearer e os dados do usuário.\n\n"
    ),
    responses={
        201: {"description": "Novo usuário cadastrado com sucesso."},
        422: {"description": "Dados de entrada inválidos"},
    },
)
async def registro(body: RequisicaoRegistroUsuario, service: AuthService = Depends(obterUsuarioService)):

    try:
        usuario = service.criarUsuario(body.model_dump())
        return RespostaRegistro(
        token=RespostaToken(
            access_token=createAccessToken({"nome": usuario.nome, "nomeEmpresa": usuario.nomeEmpresa, "email": usuario.email}),
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
        usuario=usuario
    )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

