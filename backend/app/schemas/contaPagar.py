from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum


class PagamentoContaPagar(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    conta_id:       int               = Field(..., alias="contaId")
    data_pagamento: datetime          = Field(..., alias="dataPagamento")
    valor_pago:     Optional[Decimal] = Field(None,  alias="valorPago", gt=0)


class _ContaSimples(BaseModel):
    id:   int
    nome: str
    model_config = ConfigDict(from_attributes=True)


class _CategoriaSimples(BaseModel):
    id:   int
    nome: str
    cor:  Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class CriarContaPagar(BaseModel):
    descricao:       str           = Field(..., min_length=2, max_length=100)
    valor:           Decimal       = Field(..., gt=0)
    data_vencimento: datetime
    conta_id:        Optional[int] = None
    categoria_id:    Optional[int] = None
    notas:           Optional[str] = Field(None, max_length=500)
    total_parcelas:  int           = Field(1, ge=1, le=360)


class AtualizarContaPagar(BaseModel):
    descricao:       Optional[str]      = Field(None, min_length=2, max_length=100)
    valor:           Optional[Decimal]  = Field(None, gt=0)
    data_vencimento: Optional[datetime] = None
    conta_id:        Optional[int]      = None
    categoria_id:    Optional[int]      = None
    notas:           Optional[str]      = Field(None, max_length=500)


class ContaPagarResposta(BaseModel):
    id:              int
    empresa_id:      int
    descricao:       str
    valor:           Decimal
    data_vencimento: datetime
    data_pagamento:  Optional[datetime]
    situacao_id:     TipoSituacaoContaEnum
    notas:           Optional[str]            = None
    conta:           Optional[_ContaSimples]  = None
    categoria:       Optional[_CategoriaSimples] = None

    model_config = ConfigDict(from_attributes=True)


class ResumoContasPagarResposta(BaseModel):
    total_pendente:      Decimal
    total_pago:          Decimal
    total_atrasado:      Decimal
    quantidade_pendente: int
    quantidade_pago:     int
    quantidade_atrasado: int
