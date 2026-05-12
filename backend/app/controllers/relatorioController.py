from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.configuracoes.database import get_db
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.repositories.relatorioRepository import RelatorioRepository
from app.schemas.relatorio import (
    ContasPagarResumoResposta,
    ContasReceberResumoResposta,
    FluxoCaixaResposta,
    ItemPorCategoriaResposta,
)
from app.services.relatorioService import RelatorioService

router = APIRouter()

def obterRelatorioService(db: Session = Depends(get_db)):
    repo = RelatorioRepository(db)
    return RelatorioService(repo)

@router.get(
    "/empresas/{empresaId}/relatorios/fluxo-caixa",
    response_model=FluxoCaixaResposta,
    status_code=status.HTTP_200_OK,
    summary="Fluxo de caixa",
    responses={
        200: {"description": "Receitas, despesas e saldo do período com lista de transações"},
    },
)
async def fluxoCaixa(
    empresaId: int,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.fluxoCaixa(empresaId, usuario.id, mes, ano)

@router.get(
    "/empresas/{empresaId}/relatorios/por-categoria",
    response_model=list[ItemPorCategoriaResposta],
    status_code=status.HTTP_200_OK,
    summary="Despesas por categoria",
    responses={
        200: {"description": "Total de despesas agrupado por categoria no período"},
    },
)
async def porCategoria(
    empresaId: int,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.porCategoria(empresaId, usuario.id, mes, ano)

@router.get(
    "/empresas/{empresaId}/relatorios/contas-pagar",
    response_model=ContasPagarResumoResposta,
    status_code=status.HTTP_200_OK,
    summary="Resumo de contas a pagar",
    responses={
        200: {"description": "Totais de contas a pagar por situação"},
    },
)
async def resumoContasPagar(
    empresaId: int,
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.resumoContasPagar(empresaId, usuario.id)

@router.get(
    "/empresas/{empresaId}/relatorios/contas-receber",
    response_model=ContasReceberResumoResposta,
    status_code=status.HTTP_200_OK,
    summary="Resumo de contas a receber",
    responses={
        200: {"description": "Totais de contas a receber por situação"},
    },
)
async def resumoContasReceber(
    empresaId: int,
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.resumoContasReceber(empresaId, usuario.id)
