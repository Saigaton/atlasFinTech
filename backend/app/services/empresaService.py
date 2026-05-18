from datetime import datetime, timezone

from app.entidades.empresas import Empresas
from app.exceptions.businessException import BusinessException
from app.repositories.empresaRepository import EmpresaRepository
from app.schemas.empresa import CriarEmpresa, EmpresaResposta


class EmpresaService:
    def __init__(self, repository: EmpresaRepository):
        self.repository = repository

    def listarEmpresas(self, usuario_id: int) -> list[EmpresaResposta]:
        empresas = self.repository.listarEmpresasPorUsuario(usuario_id)
        return [EmpresaResposta.model_validate(e) for e in empresas]

    def criarEmpresa(self, dados: CriarEmpresa, usuario_id: int) -> EmpresaResposta:
        empresas_existentes = self.repository.listarEmpresasPorUsuario(usuario_id)
        if empresas_existentes:
            raise BusinessException("Usuário já possui uma empresa cadastrada.", status_code=400)

        empresa = Empresas(
            nome=dados.nome,
            documento=dados.documento,
            ativo=True,
            usuario_id=usuario_id,
            criado_em=datetime.now(timezone.utc),
            atualizado_em=datetime.now(timezone.utc),
        )
        try:
            empresa = self.repository.criarEmpresa(empresa)
            self.repository.session.commit()
            self.repository.session.refresh(empresa)
            return EmpresaResposta.model_validate(empresa)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar empresa.", status_code=400)
