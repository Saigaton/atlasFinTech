from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime


class RequisicaoLoginUsuario(BaseModel):
    email: EmailStr
    senha: str

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


class RespostaUsuario(BaseModel):
    id: int
    nome: str
    email: EmailStr
    nomeEmpresa: str
    estaAtivo: bool = True
    estaVerificado: bool = False
    dataCriacao:  datetime = Field(alias="data_criacao")

    model_config = ConfigDict(from_attributes=True)


class RespostaLogin(BaseModel):
    token: RespostaToken
    usuario: RespostaUsuario

class RespostaRegistro(BaseModel):
    token: RespostaToken
    usuario: RespostaUsuario
