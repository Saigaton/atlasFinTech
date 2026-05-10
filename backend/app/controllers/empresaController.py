from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.configuracoes.database import get_db
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.repositories.empresaRepository import EmpresaRepository
from app.schemas.empresa import CriarEmpresa, EmpresaResposta
from app.services.empresaService import EmpresaService

router = APIRouter()

def obterEmpresaService(db: Session = Depends(get_db)):
    repo = EmpresaRepository(db)
    return EmpresaService(repo)

@router.get(
    "/empresas",
    response_model=list[EmpresaResposta],
    status_code=status.HTTP_200_OK,
    summary="Listar empresas",
    responses={
        200: {"description": "Lista de empresas do usuário"},
    },
)
async def listarEmpresas(
    service: EmpresaService = Depends(obterEmpresaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.listarEmpresas(usuario.id)

@router.post(
    "/empresas",
    response_model=EmpresaResposta,
    status_code=status.HTTP_201_CREATED,
    summary="Criar empresa",
    responses={
        201: {"description": "Empresa criada com sucesso"},
        400: {"description": "Erro ao criar empresa"},
    },
)
async def criarEmpresa(
    body: CriarEmpresa,
    service: EmpresaService = Depends(obterEmpresaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    return service.criarEmpresa(body, usuario.id)
