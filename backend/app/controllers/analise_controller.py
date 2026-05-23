from fastapi import APIRouter, Depends, Query, status

from app.configuracoes.dependencies import obterAnaliseService
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.services.analise_service import AnaliseService
from app.schemas.analise import (
    RequisicaoChatbot,
)
from app.schemas.resposta_api import RespostaApi

router = APIRouter()




@router.get(
    "/empresas/{empresaId}/analises/fluxo-caixa",
    status_code=status.HTTP_200_OK,
    summary="Fluxo de caixa com previsão",
)
async def fluxoCaixa(
    empresaId: int,
    meses_frente: int = Query(3, ge=1, le=12),
    service: AnaliseService = Depends(obterAnaliseService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.fluxoCaixa(empresaId, usuario.id, meses_frente=meses_frente)
    return RespostaApi(conteudo=dados)


@router.get(
    "/empresas/{empresaId}/analises/analise-financeira",
    status_code=status.HTTP_200_OK,
    summary="Análise financeira do período",
)
async def analiseFinanceira(
    empresaId: int,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: AnaliseService = Depends(obterAnaliseService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.analiseFinanceira(empresaId, usuario.id, mes, ano)
    return RespostaApi(conteudo=dados)


@router.get(
    "/empresas/{empresaId}/analises/alertas",
    status_code=status.HTTP_200_OK,
    summary="Alertas financeiros",
)
async def alertas(
    empresaId: int,
    service: AnaliseService = Depends(obterAnaliseService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.alertas(empresaId, usuario.id)
    return RespostaApi(conteudo=dados)


@router.post(
    "/empresas/{empresaId}/analises/chatbot",
    status_code=status.HTTP_200_OK,
    summary="Assistente financeiro",
)
async def chatbot(
    empresaId: int,
    body: RequisicaoChatbot,
    service: AnaliseService = Depends(obterAnaliseService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.chatbot(empresaId, usuario.id, body.message)
    return RespostaApi(conteudo=dados)


@router.get(
    "/empresas/{empresaId}/analises/calendario",
    status_code=status.HTTP_200_OK,
    summary="Calendário financeiro",
)
async def calendario(
    empresaId: int,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: AnaliseService = Depends(obterAnaliseService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.calendario(empresaId, usuario.id, mes, ano)
    return RespostaApi(conteudo=dados)


@router.get(
    "/empresas/{empresaId}/analises/previsao",
    status_code=status.HTTP_200_OK,
    summary="Previsão financeira",
)
async def previsaoMes(
    empresaId: int,
    service: AnaliseService = Depends(obterAnaliseService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.previsaoMes(empresaId, usuario.id)
    return RespostaApi(conteudo=dados)


