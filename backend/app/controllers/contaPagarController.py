from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.configuracoes.database import get_db
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.repositories.contaPagarRepository import ContaPagarRepository
from app.schemas.contaPagar import AtualizarContaPagar, ContaPagarResposta, CriarContaPagar
from app.services.contaPagarService import ContaPagarService

router = APIRouter()

def obterContaPagarService(db: Session = Depends(get_db)):
    repo = ContaPagarRepository(db)
    return ContaPagarService(repo)

@router.get(
    "/empresas/{empresaId}/contas-pagar",
    response_model=list[ContaPagarResposta],
    status_code=status.HTTP_200_OK,
    summary="Listar contas a pagar",
    responses={
        200: {"description": "Lista de contas a pagar da empresa"},
    },
)
async def listarContasPagar(
    empresaId: int,
    service: ContaPagarService = Depends(obterContaPagarService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.listarContasPagar(empresaId, usuario.id)

@router.post(
    "/empresas/{empresaId}/contas-pagar",
    response_model=ContaPagarResposta,
    status_code=status.HTTP_201_CREATED,
    summary="Criar conta a pagar",
    responses={
        201: {"description": "Conta a pagar criada com sucesso"},
        400: {"description": "Erro ao criar conta a pagar"},
    },
)
async def criarContaPagar(
    empresaId: int,
    body: CriarContaPagar,
    service: ContaPagarService = Depends(obterContaPagarService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.criarContaPagar(empresaId, usuario.id, body)

@router.put(
    "/empresas/{empresaId}/contas-pagar/{contaId}",
    response_model=ContaPagarResposta,
    status_code=status.HTTP_200_OK,
    summary="Atualizar conta a pagar",
    responses={
        200: {"description": "Conta a pagar atualizada com sucesso"},
        404: {"description": "Conta a pagar não encontrada"},
    },
)
async def atualizarContaPagar(
    empresaId: int,
    contaId: int,
    body: AtualizarContaPagar,
    service: ContaPagarService = Depends(obterContaPagarService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.atualizarContaPagar(empresaId, contaId, usuario.id, body)

@router.post(
    "/empresas/{empresaId}/contas-pagar/{contaId}/pagar",
    response_model=ContaPagarResposta,
    status_code=status.HTTP_200_OK,
    summary="Registrar pagamento",
    responses={
        200: {"description": "Pagamento registrado com sucesso"},
        400: {"description": "Conta já paga"},
        404: {"description": "Conta a pagar não encontrada"},
    },
)
async def pagarConta(
    empresaId: int,
    contaId: int,
    service: ContaPagarService = Depends(obterContaPagarService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.pagarConta(empresaId, contaId, usuario.id)

@router.delete(
    "/empresas/{empresaId}/contas-pagar/{contaId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar conta a pagar",
    responses={
        204: {"description": "Conta a pagar deletada com sucesso"},
        404: {"description": "Conta a pagar não encontrada"},
    },
)
async def deletarContaPagar(
    empresaId: int,
    contaId: int,
    service: ContaPagarService = Depends(obterContaPagarService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    service.deletarContaPagar(empresaId, contaId, usuario.id)
