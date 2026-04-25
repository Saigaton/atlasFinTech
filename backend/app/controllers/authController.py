from fastapi import APIRouter, BackgroundTasks, Depends, Request, status, HTTPException
from sqlalchemy.orm import Session
from app.configuracoes.database import get_db

from app.schemas.auth import RequisicaoRecuperarSenha, RespostaRecuperarSenha, RespostaRegistro, RequisicaoRegistroUsuario, RespostaLogin, RequisicaoLoginUsuario, RespostaTokenUsuario
from app.configuracoes.config import settings
from app.configuracoes.security import createAccessToken
from app.repositories.authRepository import AuthRepository
from app.services.authService import AuthService
from app.utilitarios.emailUtilitario import corpoEmailParaRecuperarSenha, dispararEmailComTentativas

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
        token=RespostaTokenUsuario(
            access_token=createAccessToken({"nome": usuario.nome, "nomeEmpresa": usuario.nomeEmpresa, "email": usuario.email}),
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
        usuario=usuario
    )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post(
    "/auth/login",
    response_model=RespostaLogin,
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
async def login(body: RequisicaoLoginUsuario, service: AuthService = Depends(obterUsuarioService)):

    try:
        usuario = service.loginUsuario(body.model_dump())
        return RespostaLogin(
        token=RespostaTokenUsuario(
            access_token=createAccessToken({"nome": usuario.nome, "nomeEmpresa": usuario.nomeEmpresa, "email": usuario.email}),
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
        usuario=usuario
    )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post(
    "/auth/recuperar-senha",
    response_model=RespostaRecuperarSenha,
    status_code=status.HTTP_201_CREATED,
    summary="Recuperar senha do usuário",
    description=(
        "Recupera a senha do usuário. "
        "Retorna um token de recuperação de senha.\n\n"
    ),
    responses={
        201: {"description": "Token criado com sucesso."},
        404: {"description": "Usuário não existe."},
        400: {"description": "Erro ao processar recuperação de senha."},
    },
)
async def solicitarRecuperarSenha(request: Request, backgroundTasks: BackgroundTasks, body: RequisicaoRecuperarSenha, service: AuthService = Depends(obterUsuarioService)):

    try:
        token = service.solicitarRecuperacaoSenha(body.model_dump())
        linkRecuperacao = f"{str(request.url)}/{token.token}"
        backgroundTasks.add_task(dispararEmailComTentativas, body.model_dump()["email"]
                                 , corpoEmailParaRecuperarSenha(linkRecuperacao), "Recuperar Senha")
        return RespostaRecuperarSenha(
            link=linkRecuperacao
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))