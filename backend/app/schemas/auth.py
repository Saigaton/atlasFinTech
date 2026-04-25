from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime


class RequisicaoLoginUsuario(BaseModel):
    email: EmailStr
    senha: str

class RequisicaoRecuperarSenha(BaseModel):
    email: EmailStr

class RequisicaoRegistroUsuario(BaseModel):
    nome: str
    email: EmailStr
    nomeEmpresa: str
    senha: str
    confirmarSenha: str



class RespostaTokenUsuario(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RespostaUsuario(BaseModel):
    id: int
    nome: str
    email: EmailStr
    nomeEmpresa: str
    estaAtivo: bool = Field(alias="esta_ativo")
    estaVerificado: bool = Field(alias="esta_verificado")
    dataCriacao:  datetime = Field(alias="data_criacao")

    model_config = ConfigDict(from_attributes=True)


class RespostaLogin(BaseModel):
    token: RespostaTokenUsuario
    usuario: RespostaUsuario

class RespostaRegistro(BaseModel):
    token: RespostaTokenUsuario
    usuario: RespostaUsuario

class RespostaRecuperarSenha(BaseModel):
    link: str
