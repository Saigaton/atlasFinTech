from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.enums.tipo_conta_enum import TipoContaEnum


class CriarContaBancaria(BaseModel):
    nome:          str            = Field(..., min_length=2, max_length=100)
    tipo:          TipoContaEnum
    saldoInicial: Decimal        = Field(Decimal("0.00"), ge=0)
    agencia:       Optional[str]  = Field(None, max_length=8)
    nomeBanco:    Optional[str]  = Field(None, max_length=100)
    cor:           Optional[str]   = Field(None, max_length=7)


class ContaResposta(BaseModel):
    id:            int
    empresa_id:    int
    nome:          str
    tipo: TipoContaEnum = Field(validation_alias="tipo_conta_id")
    saldoInicial: Decimal = Field(validation_alias="saldo_inicial")
    saldoAtual:   Decimal = Field(validation_alias="saldo_atual")
    agencia:       Optional[str]
    nomeBanco:    Optional[str] = Field(validation_alias="nome_banco")
    dataCriacao:  datetime = Field(validation_alias="data_criacao")
    cor:           Optional[str]   = Field(None, max_length=8)

    model_config = ConfigDict(from_attributes=True)

class ContaAtualizar(BaseModel):
    nome:       Optional[str]     = Field(None, min_length=2, max_length=80)
    tipo:       TipoContaEnum
    saldoAtual: Optional[Decimal] = Field(None, ge=0)
    nomeBanco:  Optional[str]     = Field(None, max_length=80)
    agencia:    Optional[str]     = Field(None, max_length=20)
    cor:        Optional[str]     = Field(None, max_length=7)


class TransferirConta(BaseModel):
    deContaId:   int
    paraContaId: int
    valor:       Decimal = Field(..., gt=0)
    descricao:   Optional[str] = Field(None, max_length=100)
    data:        datetime
