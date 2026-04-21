from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "usuario@exemplo.com",
                    "password": "senha123",
                }
            ]
        }
    }

class RequisicaoRegistroUsuario(BaseModel):
    nome: str
    email: EmailStr
    nomeEmpresa: str
    senha: str
    confirmarSenha: str



class RespostaToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RepostaUsuario(BaseModel):
    id: int
    nome: str
    email: EmailStr
    nomeEmpresa: str
    estaAtivo: bool = True
    estaVerificado: bool = False
    dataCriacao:  datetime = Field(alias="data_criacao")

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    token: RespostaToken
    user: RepostaUsuario

class RespostaRegistro(BaseModel):
    token: RespostaToken
    usuario: RepostaUsuario
