from fastapi import Depends
from sqlalchemy.orm import Session

from app.configuracoes.database import get_db
from app.repositories.analise_repository import AnaliseRepository
from app.repositories.auth_repository import AuthRepository
from app.repositories.categoria_repository import CategoriaRepository
from app.repositories.conta_bancaria_repository import ContaBancariaRepository
from app.repositories.conta_pagar_repository import ContaPagarRepository
from app.repositories.conta_receber_repository import ContaReceberRepository
from app.repositories.dashboard_repository import DashboardRepository
from app.repositories.empresa_repository import EmpresaRepository
from app.repositories.relatorio_repository import RelatorioRepository
from app.repositories.transacao_repository import TransacaoRepository
from app.services.analise_service import AnaliseService
from app.services.auth_service import AuthService
from app.services.categoria_service import CategoriaService
from app.services.conta_bancaria_service import ContaBancariaService
from app.services.conta_pagar_service import ContaPagarService
from app.services.conta_receber_service import ContaReceberService
from app.services.dashboard_service import DashboardService
from app.services.empresa_service import EmpresaService
from app.services.relatorio_service import RelatorioService
from app.services.transacao_service import TransacaoService


def obterAnaliseService(db: Session = Depends(get_db)) -> AnaliseService:
    return AnaliseService(AnaliseRepository(db))

def obterAuthService(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(AuthRepository(db))

def obterCategoriaService(db: Session = Depends(get_db)) -> CategoriaService:
    return CategoriaService(CategoriaRepository(db))

def obterContaBancariaService(db: Session = Depends(get_db)) -> ContaBancariaService:
    return ContaBancariaService(ContaBancariaRepository(db))

def obterContaPagarService(db: Session = Depends(get_db)) -> ContaPagarService:
    return ContaPagarService(ContaPagarRepository(db))

def obterContaReceberService(db: Session = Depends(get_db)) -> ContaReceberService:
    return ContaReceberService(ContaReceberRepository(db))

def obterDashboardService(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(DashboardRepository(db))

def obterEmpresaService(db: Session = Depends(get_db)) -> EmpresaService:
    return EmpresaService(EmpresaRepository(db))

def obterRelatorioService(db: Session = Depends(get_db)) -> RelatorioService:
    return RelatorioService(RelatorioRepository(db))

def obterTransacaoService(db: Session = Depends(get_db)) -> TransacaoService:
    return TransacaoService(TransacaoRepository(db))
