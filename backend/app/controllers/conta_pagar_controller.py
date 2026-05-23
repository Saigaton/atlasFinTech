from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.configuracoes.dependencies import obterContaPagarService
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.services.conta_pagar_service import ContaPagarService
from app.schemas.conta_pagar import AtualizarContaPagar, ContaPagarResposta, CriarContaPagar, PagamentoContaPagar, ResumoContasPagarResposta
from app.schemas.resposta_api import RespostaApi, paginado

router = APIRouter()




@router.get(
    "/empresas/{empresaId}/contas-pagar/resumo",
    status_code=status.HTTP_200_OK,
    summary="Resumo de contas a pagar",
    responses={200: {"description": "Totais e quantidades por situação"}},
)
async def resumoContasPagar(
    empresaId: int,
    service: ContaPagarService = Depends(obterContaPagarService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.resumoContasPagar(empresaId, usuario.id)
    return RespostaApi(conteudo=dados)


@router.get(
    "/empresas/{empresaId}/contas-pagar",
    status_code=status.HTTP_200_OK,
    summary="Listar contas a pagar",
    responses={200: {"description": "Lista paginada de contas a pagar da empresa"}},
)
async def listarContasPagar(
    empresaId: int,
    page:     int            = Query(1,    ge=1),
    per_page: int            = Query(50,   ge=1, le=200),
    status:   Optional[int]  = Query(None),
    pesquisa: Optional[str]  = Query(None),
    service: ContaPagarService = Depends(obterContaPagarService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    todos = service.listarContasPagar(empresaId, usuario.id, situacao=status, pesquisa=pesquisa)
    return paginado(todos, page, per_page)


@router.post(
    "/empresas/{empresaId}/contas-pagar",
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
    dados = service.criarContaPagar(empresaId, usuario.id, body)
    n = len(dados)
    msg = f"{n} parcela(s) criada(s) com sucesso." if n > 1 else "Conta a pagar criada com sucesso."
    return RespostaApi(conteudo=dados, mensagem=msg)


@router.put(
    "/empresas/{empresaId}/contas-pagar/{contaId}",
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
    dados = service.atualizarContaPagar(empresaId, contaId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Conta a pagar atualizada com sucesso.")


@router.post(
    "/empresas/{empresaId}/contas-pagar/{contaId}/pagar",
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
    body: PagamentoContaPagar,
    service: ContaPagarService = Depends(obterContaPagarService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.pagarConta(empresaId, contaId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Pagamento registrado com sucesso.")


@router.delete(
    "/empresas/{empresaId}/contas-pagar/{contaId}",
    status_code=status.HTTP_200_OK,
    summary="Deletar conta a pagar",
    responses={
        200: {"description": "Conta a pagar deletada com sucesso"},
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
    return RespostaApi(conteudo=None, mensagem="Conta a pagar deletada com sucesso.")
