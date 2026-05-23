from fastapi import APIRouter, Depends, status

from app.configuracoes.dependencies import obterCategoriaService
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.services.categoria_service import CategoriaService
from app.schemas.categoria import AtualizarCategoria, CategoriaResposta, CriarCategoria
from app.schemas.resposta_api import RespostaApi

router = APIRouter()




@router.get(
    "/empresas/{empresaId}/categorias",
    status_code=status.HTTP_200_OK,
    summary="Listar categorias",
    responses={200: {"description": "Lista de categorias da empresa"}},
)
async def listarCategorias(
    empresaId: int,
    service: CategoriaService = Depends(obterCategoriaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.listarCategorias(empresaId, usuario.id)
    return RespostaApi(conteudo=dados)


@router.post(
    "/empresas/{empresaId}/categorias",
    status_code=status.HTTP_201_CREATED,
    summary="Criar categoria",
    responses={
        201: {"description": "Categoria criada com sucesso"},
        400: {"description": "Erro ao criar categoria"},
    },
)
async def criarCategoria(
    empresaId: int,
    body: CriarCategoria,
    service: CategoriaService = Depends(obterCategoriaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.criarCategoria(empresaId, body)
    return RespostaApi(conteudo=dados, mensagem="Categoria criada com sucesso.")


@router.put(
    "/empresas/{empresaId}/categorias/{categoriaId}",
    status_code=status.HTTP_200_OK,
    summary="Atualizar categoria",
    responses={
        200: {"description": "Categoria atualizada com sucesso"},
        404: {"description": "Categoria não encontrada"},
    },
)
async def atualizarCategoria(
    empresaId: int,
    categoriaId: int,
    body: AtualizarCategoria,
    service: CategoriaService = Depends(obterCategoriaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.atualizarCategoria(empresaId, categoriaId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Categoria atualizada com sucesso.")


@router.delete(
    "/empresas/{empresaId}/categorias/{categoriaId}",
    status_code=status.HTTP_200_OK,
    summary="Deletar categoria",
    responses={
        200: {"description": "Categoria deletada com sucesso"},
        404: {"description": "Categoria não encontrada"},
    },
)
async def deletarCategoria(
    empresaId: int,
    categoriaId: int,
    service: CategoriaService = Depends(obterCategoriaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    service.deletarCategoria(empresaId, categoriaId, usuario.id)
    return RespostaApi(conteudo=None, mensagem="Categoria deletada com sucesso.")
