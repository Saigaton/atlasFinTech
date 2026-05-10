from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.enums.tipoContaEnum import TipoContaEnum


class CriarContaBancaria(BaseModel):
    nome:          str            = Field(..., min_length=2, max_length=100)
    tipo:          TipoContaEnum
    saldo_inicial: Decimal        = Field(Decimal("0.00"), ge=0)
    agencia:       Optional[str]  = Field(None, max_length=8)
    nome_banco:    Optional[str]  = Field(None, max_length=100)
    cor:           Optional[str]   = Field(None, max_length=7)


class ContaResposta(BaseModel):
    id:            int
    empresa_id:    int
    usuario_id:    int
    nome:          str
    tipo_conta_id: TipoContaEnum
    saldo_inicial: Decimal
    saldo_atual:   Decimal
    agencia:       Optional[str]
    nome_banco:    Optional[str]
    data_criacao:  datetime
    cor:           Optional[str]   = Field(None, max_length=7)

    model_config = ConfigDict(from_attributes=True)

class ContaAtualizar(BaseModel):
    nome:             Optional[str]   = Field(None, min_length=2, max_length=80)
    tipo_conta_id:    TipoContaEnum
    nome_banco:       Optional[str]   = Field(None, max_length=80)
    agencia:          Optional[str]   = Field(None, max_length=20)
    cor:              Optional[str]   = Field(None, max_length=7)
