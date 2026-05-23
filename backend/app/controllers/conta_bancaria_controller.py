from fastapi import APIRouter, Depends, status

from app.configuracoes.dependencies import obterContaBancariaService
from app.configuracoes.security import obterUsuarioAtualDB
from app.entidades.usuarios import Usuarios
from app.services.conta_bancaria_service import ContaBancariaService
from app.schemas.conta_bancaria import ContaAtualizar, ContaResposta, CriarContaBancaria, TransferirConta
from app.schemas.resposta_api import RespostaApi

router = APIRouter()


@router.post(
    "/empresas/{empresaId}/contas",
    status_code=status.HTTP_201_CREATED,
    summary="Criar conta bancária",
)
async def criarConta(
    empresaId: int,
    body: CriarContaBancaria,
    service: ContaBancariaService = Depends(obterContaBancariaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.criarConta(empresaId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Conta criada com sucesso.")

@router.get(
    "/empresas/{empresaId}/contas",
    status_code=status.HTTP_200_OK,
    summary="Listar contas bancárias",
)
async def listarContas(
    empresaId: int,
    service: ContaBancariaService = Depends(obterContaBancariaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.listarContas(empresaId, usuario.id)
    return RespostaApi(conteudo=dados)

@router.put(
    "/empresas/{empresaId}/contas/{contaId}",
    status_code=status.HTTP_200_OK,
    summary="Atualizar conta bancária",
)
async def atualizarConta(
    empresaId: int,
    contaId: int,
    body: ContaAtualizar,
    service: ContaBancariaService = Depends(obterContaBancariaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    dados = service.atualizarConta(empresaId, contaId, usuario.id, body)
    return RespostaApi(conteudo=dados, mensagem="Conta atualizada com sucesso.")

@router.post(
    "/empresas/{empresaId}/contas/transferir",
    status_code=status.HTTP_200_OK,
    summary="Transferir entre contas",
)
async def transferir(
    empresaId: int,
    body: TransferirConta,
    service: ContaBancariaService = Depends(obterContaBancariaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    service.transferir(empresaId, usuario.id, body)
    return RespostaApi(conteudo=None, mensagem="Transferência realizada com sucesso.")

@router.delete(
    "/empresas/{empresaId}/contas/{contaId}",
    status_code=status.HTTP_200_OK,
    summary="Deletar conta bancária",
)
async def deletarConta(
    empresaId: int,
    contaId: int,
    service: ContaBancariaService = Depends(obterContaBancariaService),
    usuario: Usuarios = Depends(obterUsuarioAtualDB),
):
    service.deletarConta(empresaId, contaId, usuario.id)
    return RespostaApi(conteudo=None, mensagem="Conta deletada com sucesso.")
