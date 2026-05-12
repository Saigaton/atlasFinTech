from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.configuracoes.database import get_db
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.repositories.categoriaRepository import CategoriaRepository
from app.schemas.categoria import AtualizarCategoria, CategoriaResposta, CriarCategoria
from app.services.categoriaService import CategoriaService

router = APIRouter()

def obterCategoriaService(db: Session = Depends(get_db)):
    repo = CategoriaRepository(db)
    return CategoriaService(repo)

@router.get(
    "/empresas/{empresaId}/categorias",
    response_model=list[CategoriaResposta],
    status_code=status.HTTP_200_OK,
    summary="Listar categorias",
    responses={
        200: {"description": "Lista de categorias da empresa"},
    },
)
async def listarCategorias(
    empresaId: int,
    service: CategoriaService = Depends(obterCategoriaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.listarCategorias(empresaId, usuario.id)

@router.post(
    "/empresas/{empresaId}/categorias",
    response_model=CategoriaResposta,
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
    return service.criarCategoria(empresaId, usuario.id, body)

@router.put(
    "/empresas/{empresaId}/categorias/{categoriaId}",
    response_model=CategoriaResposta,
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
    return service.atualizarCategoria(empresaId, categoriaId, usuario.id, body)

@router.delete(
    "/empresas/{empresaId}/categorias/{categoriaId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar categoria",
    responses={
        204: {"description": "Categoria deletada com sucesso"},
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
