from fastapi import APIRouter, Depends, Query, status
from typing import Optional

from app.configuracoes.dependencies import obterTransacaoService
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.services.transacao_service import TransacaoService
from app.schemas.transacao import AtualizarTransacao, CriarTransacao, TransacaoResposta
from app.schemas.resposta_api import RespostaApi, paginado

router = APIRouter()




@router.get(
    "/empresas/{empresaId}/transacoes",
    status_code=status.HTTP_200_OK,
    summary="Listar transações",
    responses={200: {"description": "Lista paginada de transações da empresa"}},
)
async def listarTransacoes(
    empresaId:  int,
    pagina:     int           = Query(1,    ge=1,   alias="pagina"),
    por_pagina: int           = Query(20,   ge=1, le=200, alias="porPagina"),
    tipo:       Optional[int] = Query(None, alias="tipo"),
    situacao:   Optional[int] = Query(None, alias="situacao"),
    pesquisa:   Optional[str] = Query(None, alias="pesquisa"),
    service: TransacaoService = Depends(obterTransacaoService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    todos = service.listarTransacoes(empresaId, usuario.id, tipo=tipo, situacao=situacao, pesquisa=pesquisa)
    return paginado(todos, pagina, por_pagina)


@router.post(
    "/empresas/{empresaId}/transacoes",
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
    dados = service.criarTransacao(empresaId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Transação criada com sucesso.")


@router.get(
    "/empresas/{empresaId}/transacoes/{transacaoId}",
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
    dados = service.buscarTransacao(empresaId, transacaoId, usuario.id)
    return RespostaApi(conteudo=dados)


@router.put(
    "/empresas/{empresaId}/transacoes/{transacaoId}",
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
    dados = service.atualizarTransacao(empresaId, transacaoId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Transação atualizada com sucesso.")


@router.post(
    "/empresas/{empresaId}/transacoes/{transacaoId}/gerar-recorrencia",
    status_code=status.HTTP_201_CREATED,
    summary="Gerar recorrência",
    description="Gera 11 cópias mensais da transação informada (12 parcelas no total).",
    responses={
        201: {"description": "Parcelas geradas com sucesso"},
        404: {"description": "Transação não encontrada"},
    },
)
async def gerarRecorrencia(
    empresaId: int,
    transacaoId: int,
    service: TransacaoService = Depends(obterTransacaoService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.gerarRecorrencia(empresaId, transacaoId, usuario.id)
    return RespostaApi(conteudo=dados, mensagem="Recorrência gerada com sucesso.")


@router.delete(
    "/empresas/{empresaId}/transacoes/{transacaoId}",
    status_code=status.HTTP_200_OK,
    summary="Deletar transação",
    responses={
        200: {"description": "Transação deletada com sucesso"},
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
    return RespostaApi(conteudo=None, mensagem="Transação deletada com sucesso.")
