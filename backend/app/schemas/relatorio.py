from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

from app.enums.tipoTransacaoEnum import TipoTransacaoEnum


class ItemFluxoCaixaResposta(BaseModel):
    id:           int
    descricao:    str
    valor:        Decimal
    data:         datetime
    transacao_id: TipoTransacaoEnum
    categoria_id: int

    model_config = ConfigDict(from_attributes=True)


class FluxoCaixaResposta(BaseModel):
    total_receitas: Decimal
    total_despesas: Decimal
    saldo:          Decimal
    transacoes:     list[ItemFluxoCaixaResposta]


class ItemPorCategoriaResposta(BaseModel):
    categoria_id: int
    total:        Decimal


class ContasPagarResumoResposta(BaseModel):
    total_pendente: Decimal
    total_pago:     Decimal
    total_atrasado: Decimal


class ContasReceberResumoResposta(BaseModel):
    total_pendente:  Decimal
    total_recebido:  Decimal
    total_atrasado:  Decimal
