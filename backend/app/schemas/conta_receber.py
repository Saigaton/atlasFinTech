from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.enums.tipo_situacao_conta_enum import TipoSituacaoContaEnum


class _ContaSimples(BaseModel):
    id:   int
    nome: str
    model_config = ConfigDict(from_attributes=True)


class _CategoriaSimples(BaseModel):
    id:   int
    nome: str
    cor:  Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class CriarContaReceber(BaseModel):
    descricao:       str           = Field(..., min_length=2, max_length=100)
    valor:           Decimal       = Field(..., gt=0)
    data_vencimento: datetime
    conta_id:        Optional[int] = None
    categoria_id:    Optional[int] = None
    cliente:         Optional[str] = Field(None, max_length=100)
    notas:           Optional[str] = Field(None, max_length=500)


class AtualizarContaReceber(BaseModel):
    descricao:       Optional[str]      = Field(None, min_length=2, max_length=100)
    valor:           Optional[Decimal]  = Field(None, gt=0)
    data_vencimento: Optional[datetime] = None
    conta_id:        Optional[int]      = None
    categoria_id:    Optional[int]      = None
    cliente:         Optional[str]      = Field(None, max_length=100)
    notas:           Optional[str]      = Field(None, max_length=500)


class RecebimentoContaReceber(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    conta_id:         int               = Field(..., alias="contaId")
    data_recebimento: datetime          = Field(..., alias="dataRecebimento")
    valor_recebido:   Optional[Decimal] = Field(None, alias="valor", gt=0)

    @field_validator("data_recebimento")
    @classmethod
    def data_recebimento_nao_futura(cls, v: datetime) -> datetime:
        if v.date() > date.today():
            raise ValueError("A data de recebimento não pode ser no futuro.")
        return v


class ContaReceberResposta(BaseModel):
    id:               int
    empresa_id:       int
    descricao:        str
    valor:            Decimal
    data_vencimento:  datetime
    data_recebimento: Optional[datetime]
    situacao_id:      TipoSituacaoContaEnum
    notas:            Optional[str]              = None
    cliente:          Optional[str]              = None
    conta:            Optional[_ContaSimples]    = None
    categoria:        Optional[_CategoriaSimples] = None

    model_config = ConfigDict(from_attributes=True)


class ResumoContasReceberResposta(BaseModel):
    total_pendente:      Decimal
    total_recebido:      Decimal
    total_atrasado:      Decimal
    quantidade_pendente: int
    quantidade_recebido: int
    quantidade_atrasado: int
