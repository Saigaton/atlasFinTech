from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.configuracoes.database import get_db
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.repositories.dashboardRepository import DashboardRepository
from app.schemas.dashboard import KPIsResposta, PontoGraficoResposta, TransacaoRecenteResposta
from app.services.dashboardService import DashboardService

router = APIRouter()

def obterDashboardService(db: Session = Depends(get_db)):
    repo = DashboardRepository(db)
    return DashboardService(repo)

@router.get(
    "/empresas/{empresaId}/dashboard/kpis",
    response_model=KPIsResposta,
    status_code=status.HTTP_200_OK,
    summary="KPIs do período",
    responses={
        200: {"description": "Receitas, despesas, saldo do período e saldo total das contas"},
    },
)
async def obterKPIs(
    empresaId: int,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: DashboardService = Depends(obterDashboardService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.obterKPIs(empresaId, usuario.id, mes, ano)

@router.get(
    "/empresas/{empresaId}/dashboard/transacoes-recentes",
    response_model=list[TransacaoRecenteResposta],
    status_code=status.HTTP_200_OK,
    summary="Transações recentes",
    responses={
        200: {"description": "Últimas transações da empresa"},
    },
)
async def transacoesRecentes(
    empresaId: int,
    limite: int = Query(8, ge=1, le=20),
    service: DashboardService = Depends(obterDashboardService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.transacoesRecentes(empresaId, usuario.id, limite)

@router.get(
    "/empresas/{empresaId}/dashboard/grafico",
    response_model=list[PontoGraficoResposta],
    status_code=status.HTTP_200_OK,
    summary="Gráfico mensal",
    responses={
        200: {"description": "Receitas e despesas agrupadas por mês do ano"},
    },
)
async def graficoMensal(
    empresaId: int,
    ano: int | None = Query(None, ge=2000, le=2100),
    service: DashboardService = Depends(obterDashboardService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.graficoMensal(empresaId, usuario.id, ano)
