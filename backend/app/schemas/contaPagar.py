from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum


class CriarContaPagar(BaseModel):
    descricao:       str     = Field(..., min_length=2, max_length=100)
    valor:           Decimal = Field(..., gt=0)
    data_vencimento: datetime


class AtualizarContaPagar(BaseModel):
    descricao:       Optional[str]      = Field(None, min_length=2, max_length=100)
    valor:           Optional[Decimal]  = Field(None, gt=0)
    data_vencimento: Optional[datetime] = None


class ContaPagarResposta(BaseModel):
    id:              int
    empresa_id:      int
    descricao:       str
    valor:           Decimal
    data_vencimento: datetime
    data_pagamento:  Optional[datetime]
    situacao_id:     TipoSituacaoContaEnum

    model_config = ConfigDict(from_attributes=True)
