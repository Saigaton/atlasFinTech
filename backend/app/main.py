from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers import analise_controller, auth_controller, categoria_controller, conta_bancaria_controller, conta_pagar_controller, conta_receber_controller, dashboard_controller, empresa_controller, relatorio_controller, transacao_controller
from app.configuracoes.database import Base, engine
from app.exceptions.exception_handler import setupExceptionHandlers
from app.configuracoes.database import SessionLocal as _SessionLocal
from app.entidades import *
from app.utilitarios.seed import seed_tipo_categorias, seed_tipo_situacao_conta, seed_tipo_transacoes
from app.utilitarios.scheduler import criar_scheduler
from alembic.config import Config
from alembic import command


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = criar_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    lifespan=lifespan,
    title="API Atlas FinTech",
    description="""
        ### API de Gestão Financeira Pessoal 💰

        Esta API permite o controle total de finanças, ajudando usuários a monitorar receitas, despesas e planejar orçamentos de forma eficiente.

        #### Principais Funcionalidades:
        *   **Transações**: Registro de entradas e saídas com categorias.
        *   **Categorias**: Gerenciamento de categorias personalizadas (Ex: Alimentação, Lazer, Salário).
        *   **Relatórios**: Resumo mensal de gastos e saldo acumulado.
        *   **Contas**: Suporte a múltiplas contas (Carteira, Banco, Investimentos).
        *   **Autenticação**: Segurança de dados com JWT (JSON Web Tokens).

        ---
        *Desenvolvido para facilitar a saúde financeira e automação de orçamentos.*
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_controller.router, prefix="/api/v1", tags=["Autenticação"])
app.include_router(empresa_controller.router, prefix="/api/v1", tags=["Empresa"])
app.include_router(categoria_controller.router, prefix="/api/v1", tags=["Categoria"])
app.include_router(conta_bancaria_controller.router, prefix="/api/v1", tags=["Conta Bancária"])
app.include_router(conta_pagar_controller.router, prefix="/api/v1", tags=["Conta Pagar"])
app.include_router(conta_receber_controller.router, prefix="/api/v1", tags=["Conta Pagar"])
app.include_router(transacao_controller.router, prefix="/api/v1", tags=["Transação"])
app.include_router(dashboard_controller.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(relatorio_controller.router, prefix="/api/v1", tags=["Relatório"])
app.include_router(analise_controller.router,   prefix="/api/v1", tags=["Análise"])
setupExceptionHandlers(app)

# Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# TODO: remover em produção — migrations devem ser rodadas manualmente via "alembic upgrade head"
_alembic_cfg = Config("alembic.ini")
command.stamp(_alembic_cfg, "base")  # reseta o controle do alembic para re-executar os seeds
command.upgrade(_alembic_cfg, "head")

with _SessionLocal() as _db:
    seed_tipo_categorias(_db)
    seed_tipo_transacoes(_db)
    seed_tipo_situacao_conta(_db)


@app.get("/", tags=["Root"])
async def root():
    return {"message": "API de Autenticação - Acesse /docs para a documentação Swagger"}
