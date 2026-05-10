from fastapi import APIRouter, BackgroundTasks, Depends, Request, status
from sqlalchemy.orm import Session
from app.configuracoes.database import get_db

from app.schemas.auth import RequisicaoEmail, RequisicaoRedefinirSenha, RequisicaoTokenAtualizacao, RequisicaoTrocarSenha, RequisicaoRegistroUsuario, RespostaLogin, RequisicaoLoginUsuario, RespostaTokenUsuario, RespostaUsuario
from app.configuracoes.config import settings
from app.configuracoes.security import criarTokenAcesso, criarTokenRefresh, obterUsuarioAtual, obterUsuarioAtualDB
from app.repositories.authRepository import AuthRepository
from app.schemas.respostaMensagem import RespostaMensagem
from app.services.authService import AuthService
from app.utilitarios.emailUtilitario import corpoEmailParaRecuperarSenha, corpoEmailVerificacao, dispararEmailComTentativas

router = APIRouter()

def obterUsuarioService(db: Session = Depends(get_db)):
    repo = AuthRepository(db)
    return AuthService(repo)

@router.post(
    "/auth/registro",
    response_model=RespostaMensagem,
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
    service.criarUsuario(body.model_dump())
    RespostaMensagem(mensagem="Usuário criado com sucesso.")

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
    usuario = service.loginUsuario(body.model_dump())
    tokenRefresh = criarTokenRefresh(str(usuario.id))
    service.salvarTokenRefresh(usuario.id, tokenRefresh.jti, tokenRefresh.expiracao)
    
    return RespostaLogin(
        token=RespostaTokenUsuario(
            access_token=criarTokenAcesso({"id": str(usuario.id), "nome": usuario.nome, "email": usuario.email}),
            refresh_token=tokenRefresh.token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
        usuario=usuario
    )

@router.get("/auth/verificar-email",     
    response_model=RespostaMensagem,    
    status_code=200
)
async def verificarEmail(token: str, service: AuthService = Depends(obterUsuarioService)):
  return service.verificarEmail(token)

@router.get(
    "/auth/me",
    status_code=status.HTTP_200_OK,
    summary="Dados do usuário autenticado",
    description="Retorna os dados do usuário extraídos do token JWT.",
    responses={
        200: {"description": "Dados do usuário"},
        401: {"description": "Token inválido ou expirado"},
    },
)
async def me(usuarioAtual = Depends(obterUsuarioAtualDB)):
    return RespostaUsuario.model_validate(usuarioAtual)

@router.post(
    "/auth/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout do usuário",
    description="Revoga o refresh token, encerrando a sessão.",
    responses={
        204: {"description": "Logout realizado com sucesso"},
        401: {"description": "Refresh token inválido ou já revogado"},
    },
)
async def logout(body: RequisicaoTokenAtualizacao, service: AuthService = Depends(obterUsuarioService), _: dict = Depends(obterUsuarioAtual)):
    service.logoutUsuario(body.refresh_token)

@router.post(
    "/auth/refresh",
    response_model=RespostaTokenUsuario,
    status_code=status.HTTP_200_OK,
    summary="Renovar access token",
    description="Recebe um refresh token válido e retorna um novo access token.",
    responses={
        200: {"description": "Token renovado com sucesso"},
        401: {"description": "Refresh token inválido ou expirado"},
    },
)
async def tokenAtualizacao(body: RequisicaoTokenAtualizacao, service: AuthService = Depends(obterUsuarioService)):
    return service.tokenAtualizacao(body.refresh_token)

@router.post(
    "/auth/reenviar-verificacao-email",
    response_model=RespostaMensagem,
    status_code=status.HTTP_200_OK,
    summary="Reenviar e-mail de verificação",
    description="Reenvia o link de verificação de e-mail. Retorna sempre a mesma mensagem genérica por segurança.",
    responses={
        200: {"description": "Solicitação processada"},
    },
)
async def reenviarVerificacaoEmail(request: Request, backgroundTasks: BackgroundTasks, body: RequisicaoEmail, service: AuthService = Depends(obterUsuarioService)):
    token = service.reenviarVerificacaoEmail(body.email)
    if token:
        linkVerificacao = f"{str(settings.FRONTEND_URL)}verificar-email?token={token}"
        backgroundTasks.add_task(dispararEmailComTentativas, body.email, corpoEmailVerificacao(linkVerificacao), "Verificar E-mail")
    return RespostaMensagem(mensagem="Se o e-mail existir e não estiver verificado, um novo link será enviado.")

@router.post(
    "/auth/esqueceu-senha",
    response_model=RespostaMensagem,
    status_code=status.HTTP_200_OK,
    summary="Solicitar recuperação de senha",
    description="Envia um link de redefinição de senha por e-mail. Retorna sempre a mesma mensagem genérica por segurança.",
    responses={
        200: {"description": "Solicitação processada"},
    },
)
async def esqueceuSenha(request: Request, backgroundTasks: BackgroundTasks, body: RequisicaoEmail, service: AuthService = Depends(obterUsuarioService)):
    token = service.esqueceuSenha(body.email)
    if token:
        linkRecuperacao = f"{str(settings.FRONTEND_URL)}redefinir-senha?token={token}"
        backgroundTasks.add_task(dispararEmailComTentativas, body.email, corpoEmailParaRecuperarSenha(linkRecuperacao), "Recuperar Senha")
    return RespostaMensagem(mensagem="Se o e-mail existir, um link de recuperação será enviado.")

@router.post(
    "/auth/redefinir-senha",
    response_model=RespostaMensagem,
    status_code=status.HTTP_200_OK,
    summary="Redefinir senha",
    description="Redefine a senha usando o token de reset recebido por e-mail. O token é invalidado após o uso.",
    responses={
        200: {"description": "Senha redefinida com sucesso"},
        400: {"description": "Token inválido, expirado ou já utilizado"},
    },
)
async def redefinirSenha(body: RequisicaoRedefinirSenha, service: AuthService = Depends(obterUsuarioService)):
    return service.redefinirSenha(body.token, body.novaSenha)


@router.post(
    "/auth/me/trocar-senha",
    response_model=RespostaMensagem,
    status_code=status.HTTP_200_OK,
    summary="Trocar senha",
    description="Troca a senha do usuário autenticado, exigindo a senha atual.",
    responses={
        200: {"description": "Senha alterada com sucesso"},
        400: {"description": "Senha atual incorreta"},
        401: {"description": "Token inválido ou expirado"},
    },
)
async def trocarSenha(body: RequisicaoTrocarSenha, service: AuthService = Depends(obterUsuarioService), usuarioAtual: dict = Depends(obterUsuarioAtual)):
    return service.trocarSenha(int(usuarioAtual["sub"]), body.senhaAtual, body.novaSenha)