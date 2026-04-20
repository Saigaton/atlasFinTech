from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth
from app.core.database import Base, engine
from app.models import *

app = FastAPI(
    title="API Atlas FinTech",
    description="API com autenticação JWT usando FastAPI e Swagger",
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

app.include_router(auth.router, prefix="/api/v1", tags=["Autenticação"])

Base.metadata.create_all(bind=engine)


@app.get("/", tags=["Root"])
async def root():
    return {"message": "API de Autenticação - Acesse /docs para a documentação Swagger"}
