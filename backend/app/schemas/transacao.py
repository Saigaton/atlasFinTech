from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.enums.tipo_transacao_enum import TipoTransacaoEnum
from app.enums.situacao_transacao_enum import SituacaoTransacaoEnum


class _ContaSimples(BaseModel):
    id:   int
    nome: str
    cor:  Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class _CategoriaSimples(BaseModel):
    id:   int
    nome: str
    cor:  Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class CriarTransacao(BaseModel):
    descricao:    str                    = Field(..., min_length=2, max_length=100)
    valor:        Decimal                = Field(..., gt=0)
    data:         datetime
    conta_id:     int
    categoria_id: Optional[int] = None
    tipo:         TipoTransacaoEnum
    situacao:     SituacaoTransacaoEnum  = SituacaoTransacaoEnum.PENDENTE
    notas:        Optional[str]          = Field(None, max_length=500)
    recorrencia:  str                    = "nenhuma"

    @field_validator("tipo", mode="before")
    @classmethod
    def tipo_valido(cls, v) -> TipoTransacaoEnum:
        try:
            return TipoTransacaoEnum(int(v))
        except (ValueError, TypeError):
            valores_aceitos = [e.value for e in TipoTransacaoEnum]
            raise ValueError(f"Tipo de transação inválido. Valores aceitos: {valores_aceitos}")

    @field_validator("situacao", mode="before")
    @classmethod
    def situacao_valida(cls, v) -> SituacaoTransacaoEnum:
        try:
            return SituacaoTransacaoEnum(int(v))
        except (ValueError, TypeError):
            valores_aceitos = [e.value for e in SituacaoTransacaoEnum]
            raise ValueError(f"Situação inválida. Valores aceitos: {valores_aceitos}")


class AtualizarTransacao(BaseModel):
    descricao:    Optional[str]                   = Field(None, min_length=2, max_length=100)
    valor:        Optional[Decimal]               = Field(None, gt=0)
    data:         Optional[datetime]              = None
    conta_id:     Optional[int]                   = None
    categoria_id: Optional[int]                   = None
    tipo:         Optional[TipoTransacaoEnum]     = None
    situacao:     Optional[SituacaoTransacaoEnum] = None
    notas:        Optional[str]                   = Field(None, max_length=500)


class TransacaoResposta(BaseModel):
    id:          int
    empresa_id:  int
    descricao:   str
    valor:       Decimal
    data:        datetime
    notas:       Optional[str] = None
    recorrencia: str           = "nenhuma"
    tipo:        TipoTransacaoEnum    = Field(validation_alias="tipo_transacao_id")
    situacao:    SituacaoTransacaoEnum
    conta:       Optional[_ContaSimples]    = None
    categoria:   Optional[_CategoriaSimples] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
