from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, UploadFile, status
from fastapi.responses import Response

from app.configuracoes.dependencies import obterRelatorioService
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.services.relatorio_service import RelatorioService
from app.schemas.relatorio import (
    ContasPagarResumoResposta,
    ContasReceberResumoResposta,
    DisparadorRelatorioRequisicao,
    EnviarEmailRelatorioRequisicao,
    FluxoCaixaResposta,
    InscricaoAgendamentoRequisicao,
    ItemPorCategoriaResposta,
    ResultadoConciliacaoResposta,
    StatusAgendamentoResposta,
)

from app.schemas.resposta_api import RespostaApi
from app.utilitarios.email_utilitario import dispararEmailComTentativas, corpoEmailRelatorio

router = APIRouter()


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


# ── Agendamento de e-mail periódico ───────────────────────────────────────────

@router.get(
    "/empresas/{empresaId}/relatorios/agendamento/status",
    response_model=RespostaApi[StatusAgendamentoResposta],
    status_code=status.HTTP_200_OK,
    summary="Status do agendamento de relatório",
)
async def statusAgendamento(
    empresaId: int,
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.statusAgendamento(empresaId, usuario.id)
    return RespostaApi(conteudo=dados)


@router.post(
    "/empresas/{empresaId}/relatorios/agendamento/inscrever",
    status_code=status.HTTP_200_OK,
    summary="Inscrever e-mail periódico",
)
async def inscreverAgendamento(
    empresaId: int,
    body: InscricaoAgendamentoRequisicao,
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.inscreverAgendamento(empresaId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Agendamento salvo com sucesso.")


@router.delete(
    "/empresas/{empresaId}/relatorios/agendamento/cancelar",
    status_code=status.HTTP_200_OK,
    summary="Cancelar e-mail periódico",
)
async def cancelarAgendamento(
    empresaId: int,
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    service.cancelarAgendamento(empresaId, usuario.id)
    return RespostaApi(conteudo=None, mensagem="Agendamento cancelado com sucesso.")


@router.post(
    "/empresas/{empresaId}/relatorios/agendamento/disparar",
    status_code=status.HTTP_200_OK,
    summary="Enviar relatório agora",
)
async def disparar(
    empresaId: int,
    body: DisparadorRelatorioRequisicao,
    backgroundTasks: BackgroundTasks,
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    pdf = service.relatorioPdf(empresaId, usuario.id, None, None)
    backgroundTasks.add_task(dispararEmailComTentativas, body.email, corpoEmailRelatorio(pdf.decode("utf-8")), "Relatório Financeiro")
    return RespostaApi(conteudo=None, mensagem="Relatório enviado para o e-mail informado.")


# ── Exportações ───────────────────────────────────────────────────────────────

@router.get(
    "/empresas/{empresaId}/relatorios/transacoes/csv",
    status_code=status.HTTP_200_OK,
    summary="Download CSV de transações",
)
async def transacoesCsv(
    empresaId: int,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    conteudo = service.transacoesCsv(empresaId, usuario.id, mes, ano)
    return Response(content=conteudo, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=transacoes.csv"})


@router.get(
    "/empresas/{empresaId}/relatorios/contas-pagar/csv",
    status_code=status.HTTP_200_OK,
    summary="Download CSV de contas a pagar",
)
async def contas_pagarCsv(
    empresaId: int,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    conteudo = service.contas_pagarCsv(empresaId, usuario.id, mes, ano)
    return Response(content=conteudo, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=contas_pagar.csv"})


@router.get(
    "/empresas/{empresaId}/relatorios/contas-receber/csv",
    status_code=status.HTTP_200_OK,
    summary="Download CSV de contas a receber",
)
async def contas_receberCsv(
    empresaId: int,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    conteudo = service.contas_receberCsv(empresaId, usuario.id, mes, ano)
    return Response(content=conteudo, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=contas_receber.csv"})


@router.get(
    "/empresas/{empresaId}/relatorios/pdf",
    status_code=status.HTTP_200_OK,
    summary="Download relatório financeiro em texto",
)
async def relatorioPdf(
    empresaId: int,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    conteudo = service.relatorioPdf(empresaId, usuario.id, mes, ano)
    return Response(content=conteudo, media_type="text/plain; charset=utf-8", headers={"Content-Disposition": "attachment; filename=relatorio.txt"})


@router.get(
    "/empresas/{empresaId}/relatorios/backup",
    status_code=status.HTTP_200_OK,
    summary="Download backup em ZIP",
)
async def backup(
    empresaId: int,
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    conteudo = service.backupZip(empresaId, usuario.id)
    return Response(content=conteudo, media_type="application/zip", headers={"Content-Disposition": "attachment; filename=backup.zip"})


@router.post(
    "/empresas/{empresaId}/relatorios/email",
    status_code=status.HTTP_200_OK,
    summary="Enviar relatório por e-mail",
)
async def enviarEmail(
    empresaId: int,
    body: EnviarEmailRelatorioRequisicao,
    backgroundTasks: BackgroundTasks,
    mes: int | None = Query(None, ge=1, le=12),
    ano: int | None = Query(None, ge=2000, le=2100),
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    pdf = service.relatorioPdf(empresaId, usuario.id, mes, ano)
    backgroundTasks.add_task(dispararEmailComTentativas, body.email, corpoEmailRelatorio(pdf.decode("utf-8")), "Relatório Financeiro")
    return RespostaApi(conteudo=None, mensagem="Relatório enviado para o e-mail informado.")


@router.post(
    "/empresas/{empresaId}/relatorios/conciliacao",
    status_code=status.HTTP_200_OK,
    summary="Importar extrato bancário (CSV)",
)
async def conciliacao(
    empresaId: int,
    arquivo: UploadFile = File(...),
    service: RelatorioService = Depends(obterRelatorioService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    conteudo = (await arquivo.read()).decode("utf-8-sig")
    dados = service.conciliar(empresaId, usuario.id, conteudo)
    return RespostaApi(conteudo=dados)
