from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.configuracoes.database import get_db
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.repositories.transacaoRepository import TransacaoRepository
from app.schemas.transacao import AtualizarTransacao, CriarTransacao, TransacaoResposta
from app.services.transacaoService import TransacaoService

router = APIRouter()

def obterTransacaoService(db: Session = Depends(get_db)):
    repo = TransacaoRepository(db)
    return TransacaoService(repo)

@router.get(
    "/empresas/{empresaId}/transacoes",
    response_model=list[TransacaoResposta],
    status_code=status.HTTP_200_OK,
    summary="Listar transações",
    responses={
        200: {"description": "Lista de transações da empresa"},
    },
)
async def listarTransacoes(
    empresaId: int,
    service: TransacaoService = Depends(obterTransacaoService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.listarTransacoes(empresaId, usuario.id)

@router.post(
    "/empresas/{empresaId}/transacoes",
    response_model=TransacaoResposta,
    status_code=status.HTTP_201_CREATED,
    summary="Criar transação",
    responses={
        201: {"description": "Transação criada com sucesso"},
        400: {"description": "Erro ao criar transação"},
    },
)
async def criarTransacao(
    empresaId: int,
    body: CriarTransacao,
    service: TransacaoService = Depends(obterTransacaoService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.criarTransacao(empresaId, usuario.id, body)

@router.get(
    "/empresas/{empresaId}/transacoes/{transacaoId}",
    response_model=TransacaoResposta,
    status_code=status.HTTP_200_OK,
    summary="Buscar transação",
    responses={
        200: {"description": "Dados da transação"},
        404: {"description": "Transação não encontrada"},
    },
)
async def buscarTransacao(
    empresaId: int,
    transacaoId: int,
    service: TransacaoService = Depends(obterTransacaoService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.buscarTransacao(empresaId, transacaoId, usuario.id)

@router.put(
    "/empresas/{empresaId}/transacoes/{transacaoId}",
    response_model=TransacaoResposta,
    status_code=status.HTTP_200_OK,
    summary="Atualizar transação",
    responses={
        200: {"description": "Transação atualizada com sucesso"},
        404: {"description": "Transação não encontrada"},
    },
)
async def atualizarTransacao(
    empresaId: int,
    transacaoId: int,
    body: AtualizarTransacao,
    service: TransacaoService = Depends(obterTransacaoService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.atualizarTransacao(empresaId, transacaoId, usuario.id, body)

@router.delete(
    "/empresas/{empresaId}/transacoes/{transacaoId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar transação",
    responses={
        204: {"description": "Transação deletada com sucesso"},
        404: {"description": "Transação não encontrada"},
    },
)
async def deletarTransacao(
    empresaId: int,
    transacaoId: int,
    service: TransacaoService = Depends(obterTransacaoService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    service.deletarTransacao(empresaId, transacaoId, usuario.id)
