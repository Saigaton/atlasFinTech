from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

from app.enums.tipoTransacaoEnum import TipoTransacaoEnum


class KPIsResposta(BaseModel):
    total_receitas: Decimal
    total_despesas: Decimal
    saldo_periodo:  Decimal
    saldo_contas:   Decimal


class TransacaoRecenteResposta(BaseModel):
    id:           int
    descricao:    str
    valor:        Decimal
    data:         datetime
    transacao_id: TipoTransacaoEnum
    categoria_id: int
    empresa_id:   int

    model_config = ConfigDict(from_attributes=True)


class PontoGraficoResposta(BaseModel):
    mes:      int
    receitas: Decimal
    despesas: Decimal
