from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.enums.tipoTransacaoEnum import TipoTransacaoEnum


class CriarTransacao(BaseModel):
    descricao:    str              = Field(..., min_length=2, max_length=100)
    valor:        Decimal          = Field(..., gt=0)
    data:         datetime
    categoria_id: int
    tipo:         TipoTransacaoEnum


class AtualizarTransacao(BaseModel):
    descricao:    Optional[str]              = Field(None, min_length=2, max_length=100)
    valor:        Optional[Decimal]          = Field(None, gt=0)
    data:         Optional[datetime]         = None
    categoria_id: Optional[int]             = None
    tipo:         Optional[TipoTransacaoEnum] = None


class TransacaoResposta(BaseModel):
    id:           int
    empresa_id:   int
    categoria_id: int
    descricao:    str
    valor:        Decimal
    data:         datetime
    transacao_id: TipoTransacaoEnum

    model_config = ConfigDict(from_attributes=True)
