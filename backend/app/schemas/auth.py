from pydantic import BaseModel, EmailStr, ConfigDict, Field, model_validator
from datetime import datetime


class RequisicaoLoginUsuario(BaseModel):
    email: EmailStr
    senha: str

class RequisicaoEmail(BaseModel):
    email: EmailStr

class RequisicaoRegistroUsuario(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    confirmarSenha: str

class RespostaTokenUsuario(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class RespostaUsuario(BaseModel):
    id: int
    nome: str
    email: EmailStr
    estaAtivo: bool = Field(alias="esta_ativo")
    estaVerificado: bool = Field(alias="esta_verificado")
    dataCriacao:  datetime = Field(alias="data_criacao")

    model_config = ConfigDict(from_attributes=True)

class RespostaLogin(BaseModel):
    token: RespostaTokenUsuario
    usuario: RespostaUsuario

class RespostaRegistro(BaseModel):
    token: RespostaTokenUsuario
    tokenVerificarEmail: str
    usuario: RespostaUsuario

class RespostaRecuperarSenha(BaseModel):
    link: str

class RequisicaoTokenAtualizacao(BaseModel):
    refresh_token: str

class RequisicaoToken(BaseModel):
    token: str

class RequisicaoRedefinirSenha(BaseModel):
    token: str
    novaSenha: str = Field(..., min_length=8, max_length=128)
    confirmarSenha: str

    @model_validator(mode="after")
    def senhasConferem(self) -> "RequisicaoRedefinirSenha":
        if self.novaSenha != self.confirmarSenha:
            raise ValueError("As senhas não coincidem.")
        return self


class RequisicaoTrocarSenha(BaseModel):
    senhaAtual: str
    novaSenha: str = Field(..., min_length=8, max_length=128)
    confirmarSenha: str

    @model_validator(mode="after")
    def senhasConferem(self) -> "RequisicaoTrocarSenha":
        if self.novaSenha != self.confirmarSenha:
            raise ValueError("As senhas não coincidem.")
        return self