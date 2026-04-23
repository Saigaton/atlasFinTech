from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers import authController
from app.configuracoes.database import Base, engine
from app.exceptions.exceptionHandler import setupExceptionHandlers
from app.entidades import *

app = FastAPI(
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

app.include_router(authController.router, prefix="/api/v1", tags=["Autenticação"])
setupExceptionHandlers(app)

# Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


@app.get("/", tags=["Root"])
async def root():
    return {"message": "API de Autenticação - Acesse /docs para a documentação Swagger"}
