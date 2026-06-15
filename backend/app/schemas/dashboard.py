from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class KPIsResposta(BaseModel):
    receitaTotal:    Decimal
    despesaTotal:    Decimal
    lucroLiquido:    Decimal
    saldoTotal:      Decimal
    variacaoReceita: Optional[Decimal] = None
    variacaoDespesa: Optional[Decimal] = None
    variacaoLucro:   Optional[Decimal] = None
    periodoLabel:    str = ""
    inicioPeriodo:   str = ""
    fimPeriodo:      str = ""


class CategoriaRecenteResposta(BaseModel):
    id:   int
    nome: str
    cor:  Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TransacaoRecenteResposta(BaseModel):
    id:        int
    descricao: str
    valor:     Decimal
    data:      datetime
    tipo:      int = Field(validation_alias="tipo_transacao_id")
    situacao:  int
    categoria: Optional[CategoriaRecenteResposta] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PontoGraficoResposta(BaseModel):
    mes:      int
    receitas: Decimal
    despesas: Decimal
