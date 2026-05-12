from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.configuracoes.database import get_db
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.repositories.contaReceberRepository import ContaReceberRepository
from app.schemas.contaReceber import AtualizarContaReceber, ContaReceberResposta, CriarContaReceber
from app.services.contaReceberService import ContaReceberService

router = APIRouter()

def obterContaReceberService(db: Session = Depends(get_db)):
    repo = ContaReceberRepository(db)
    return ContaReceberService(repo)

@router.get(
    "/empresas/{empresaId}/contas-receber",
    response_model=list[ContaReceberResposta],
    status_code=status.HTTP_200_OK,
    summary="Listar contas a receber",
    responses={
        200: {"description": "Lista de contas a receber da empresa"},
    },
)
async def listarContasReceber(
    empresaId: int,
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.listarContasReceber(empresaId, usuario.id)

@router.post(
    "/empresas/{empresaId}/contas-receber",
    response_model=ContaReceberResposta,
    status_code=status.HTTP_201_CREATED,
    summary="Criar conta a receber",
    responses={
        201: {"description": "Conta a receber criada com sucesso"},
        400: {"description": "Erro ao criar conta a receber"},
    },
)
async def criarContaReceber(
    empresaId: int,
    body: CriarContaReceber,
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.criarContaReceber(empresaId, usuario.id, body)

@router.put(
    "/empresas/{empresaId}/contas-receber/{contaId}",
    response_model=ContaReceberResposta,
    status_code=status.HTTP_200_OK,
    summary="Atualizar conta a receber",
    responses={
        200: {"description": "Conta a receber atualizada com sucesso"},
        404: {"description": "Conta a receber não encontrada"},
    },
)
async def atualizarContaReceber(
    empresaId: int,
    contaId: int,
    body: AtualizarContaReceber,
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.atualizarContaReceber(empresaId, contaId, usuario.id, body)

@router.post(
    "/empresas/{empresaId}/contas-receber/{contaId}/receber",
    response_model=ContaReceberResposta,
    status_code=status.HTTP_200_OK,
    summary="Registrar recebimento",
    responses={
        200: {"description": "Recebimento registrado com sucesso"},
        400: {"description": "Conta já recebida"},
        404: {"description": "Conta a receber não encontrada"},
    },
)
async def receberConta(
    empresaId: int,
    contaId: int,
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.receberConta(empresaId, contaId, usuario.id)

@router.delete(
    "/empresas/{empresaId}/contas-receber/{contaId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar conta a receber",
    responses={
        204: {"description": "Conta a receber deletada com sucesso"},
        404: {"description": "Conta a receber não encontrada"},
    },
)
async def deletarContaReceber(
    empresaId: int,
    contaId: int,
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    service.deletarContaReceber(empresaId, contaId, usuario.id)
