from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.configuracoes.database import get_db
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.repositories.dashboardRepository import DashboardRepository
from app.schemas.dashboard import KPIsResposta, PontoGraficoPorContaResposta, PontoGraficoResposta, TransacaoRecenteResposta
from app.schemas.respostaApi import RespostaApi
from app.services.dashboardService import DashboardService

router = APIRouter()


def obterDashboardService(db: Session = Depends(get_db)):
    repo = DashboardRepository(db)
    return DashboardService(repo)


@router.get(
    "/empresas/{empresaId}/dashboard/kpis",
    status_code=status.HTTP_200_OK,
    summary="KPIs do período",
)
async def obterKPIs(
    empresaId: int,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: DashboardService = Depends(obterDashboardService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.obterKPIs(empresaId, usuario.id, mes, ano)
    return RespostaApi(conteudo=dados)


@router.get(
    "/empresas/{empresaId}/dashboard/transacoes-recentes",
    status_code=status.HTTP_200_OK,
    summary="Transações recentes",
)
async def transacoesRecentes(
    empresaId: int,
    limite: int = Query(8, ge=1, le=20),
    service: DashboardService = Depends(obterDashboardService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.transacoesRecentes(empresaId, usuario.id, limite)
    return RespostaApi(conteudo=dados)


@router.get(
    "/empresas/{empresaId}/dashboard/grafico",
    status_code=status.HTTP_200_OK,
    summary="Gráfico mensal",
)
async def graficoMensal(
    empresaId: int,
    ano: int | None = Query(None, ge=2000, le=2100),
    service: DashboardService = Depends(obterDashboardService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.graficoMensal(empresaId, usuario.id, ano)
    return RespostaApi(conteudo=dados)


@router.get(
    "/empresas/{empresaId}/dashboard/grafico-por-conta",
    status_code=status.HTTP_200_OK,
    summary="Receita e despesa por conta",
)
async def graficoPorConta(
    empresaId: int,
    ano: int | None = Query(None, ge=2000, le=2100),
    service: DashboardService = Depends(obterDashboardService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.graficoPorConta(empresaId, usuario.id, ano)
    return RespostaApi(conteudo=dados)
