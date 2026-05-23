from fastapi import APIRouter, Depends, status

from app.configuracoes.dependencies import obterEmpresaService
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.services.empresa_service import EmpresaService
from app.schemas.empresa import CriarEmpresa, EmpresaResposta
from app.schemas.resposta_api import RespostaApi

router = APIRouter()


@router.get(
    "/empresas",
    status_code=status.HTTP_200_OK,
    summary="Listar empresas",
)
async def listarEmpresas(
    service: EmpresaService = Depends(obterEmpresaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.listarEmpresas(usuario.id)
    return RespostaApi(conteudo=dados)

@router.post(
    "/empresas",
    status_code=status.HTTP_201_CREATED,
    summary="Criar empresa",
)
async def criarEmpresa(
    body: CriarEmpresa,
    service: EmpresaService = Depends(obterEmpresaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.criarEmpresa(body, usuario.id)
    return RespostaApi(conteudo=dados, mensagem="Empresa criada com sucesso.")
