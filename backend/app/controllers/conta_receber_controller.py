from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.configuracoes.dependencies import obterContaReceberService
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.services.conta_receber_service import ContaReceberService
from app.schemas.conta_receber import AtualizarContaReceber, ContaReceberResposta, CriarContaReceber, RecebimentoContaReceber, ResumoContasReceberResposta
from app.schemas.resposta_api import RespostaApi, paginado

router = APIRouter()




@router.get(
    "/empresas/{empresaId}/contas-receber/resumo",
    status_code=status.HTTP_200_OK,
    summary="Resumo de contas a receber",
)
async def resumoContasReceber(
    empresaId: int,
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.resumoContasReceber(empresaId, usuario.id)
    return RespostaApi(conteudo=dados)


@router.get(
    "/empresas/{empresaId}/contas-receber",
    status_code=status.HTTP_200_OK,
    summary="Listar contas a receber",
)
async def listarContasReceber(
    empresaId: int,
    page:     int           = Query(1,    ge=1),
    per_page: int           = Query(50,   ge=1, le=200),
    status:   Optional[int] = Query(None),
    pesquisa: Optional[str] = Query(None),
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    todos = service.listarContasReceber(empresaId, usuario.id, situacao=status, pesquisa=pesquisa)
    return paginado(todos, page, per_page)


@router.post(
    "/empresas/{empresaId}/contas-receber",
    status_code=status.HTTP_201_CREATED,
    summary="Criar conta a receber",
)
async def criarContaReceber(
    empresaId: int,
    body: CriarContaReceber,
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.criarContaReceber(empresaId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Conta a receber criada com sucesso.")


@router.put(
    "/empresas/{empresaId}/contas-receber/{contaId}",
    status_code=status.HTTP_200_OK,
    summary="Atualizar conta a receber",
)
async def atualizarContaReceber(
    empresaId: int,
    contaId: int,
    body: AtualizarContaReceber,
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.atualizarContaReceber(empresaId, contaId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Conta a receber atualizada com sucesso.")


@router.post(
    "/empresas/{empresaId}/contas-receber/{contaId}/receber",
    status_code=status.HTTP_200_OK,
    summary="Registrar recebimento",
)
async def receberConta(
    empresaId: int,
    contaId: int,
    body: RecebimentoContaReceber,
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.receberConta(empresaId, contaId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Recebimento registrado com sucesso.")


@router.delete(
    "/empresas/{empresaId}/contas-receber/{contaId}",
    status_code=status.HTTP_200_OK,
    summary="Deletar conta a receber",
)
async def deletarContaReceber(
    empresaId: int,
    contaId: int,
    service: ContaReceberService = Depends(obterContaReceberService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    service.deletarContaReceber(empresaId, contaId, usuario.id)
    return RespostaApi(conteudo=None, mensagem="Conta a receber deletada com sucesso.")
