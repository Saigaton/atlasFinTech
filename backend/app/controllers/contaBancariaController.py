from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.configuracoes.database import get_db
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.repositories.contaBancariaRepository import ContaBancariaRepository
from app.schemas.contaBancaria import ContaAtualizar, ContaResposta, CriarContaBancaria
from app.services.contaBancariaService import ContaBancariaService

router = APIRouter()

def obterContaBancariaService(db: Session = Depends(get_db)):
    repo = ContaBancariaRepository(db)
    return ContaBancariaService(repo)

@router.post(
    "/empresas/{empresaId}/contas",
    response_model=ContaResposta,
    status_code=status.HTTP_201_CREATED,
    summary="Criar conta bancária",
    responses={
        201: {"description": "Conta criada com sucesso"},
        400: {"description": "Erro ao criar conta"},
    },
)
async def criarConta(
    empresaId: int,
    body: CriarContaBancaria,
    service: ContaBancariaService = Depends(obterContaBancariaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.criarConta(empresaId, usuario.id, body)

@router.get(
    "/empresas/{empresaId}/contas",
    response_model=list[ContaResposta],
    status_code=status.HTTP_200_OK,
    summary="Listar contas bancárias",
    responses={
        200: {"description": "Lista de contas da empresa"},
    },
)
async def listarContas(
    empresaId: int,
    service: ContaBancariaService = Depends(obterContaBancariaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.listarContas(empresaId, usuario.id)

@router.put(
    "/empresas/{empresaId}/contas/{contaId}",
    response_model=ContaResposta,
    status_code=status.HTTP_200_OK,
    summary="Atualizar conta bancária",
    responses={
        200: {"description": "Conta atualizada com sucesso"},
        404: {"description": "Conta não encontrada"},
    },
)
async def atualizarConta(
    empresaId: int,
    contaId: int,
    body: ContaAtualizar,
    service: ContaBancariaService = Depends(obterContaBancariaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.atualizarConta(empresaId, contaId, usuario.id, body)

@router.delete(
    "/empresas/{empresaId}/contas/{contaId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar conta bancária",
    responses={
        204: {"description": "Conta deletada com sucesso"},
        404: {"description": "Conta não encontrada"},
    },
)
async def deletarConta(
    empresaId: int,
    contaId: int,
    service: ContaBancariaService = Depends(obterContaBancariaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    service.deletarConta(empresaId, contaId, usuario.id)
