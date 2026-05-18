from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

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


class StatusAgendamentoResposta(BaseModel):
    inscrito: bool
    email:    Optional[str] = None
    diaMes:   Optional[int] = None
    hora:     Optional[int] = None


class InscricaoAgendamentoRequisicao(BaseModel):
    email:   EmailStr
    dia_mes: int = Field(..., ge=1, le=28)
    hora:    int = Field(..., ge=0, le=23)


class DisparadorRelatorioRequisicao(BaseModel):
    email: EmailStr


class EnviarEmailRelatorioRequisicao(BaseModel):
    email: EmailStr


class ItemConciliadoResposta(BaseModel):
    dataExtrato:        str
    descricaoExtrato:   str
    valorExtrato:       float
    idTransacao:        int
    descricaoTransacao: str

class ItemExtratoResposta(BaseModel):
    data:      str
    descricao: str
    valor:     float

class ItemTransacaoSistemaResposta(BaseModel):
    id:        int
    data:      str
    descricao: str
    tipo:      str
    valor:     float

class ResultadoConciliacaoResposta(BaseModel):
    conciliadas:           int
    totalSomenteExtrato:   int
    totalSomenteNosistema: int
    totalExtrato:          int
    itensConciliados:      list[ItemConciliadoResposta]
    somenteExtrato:        list[ItemExtratoResposta]
    somenteNosistema:      list[ItemTransacaoSistemaResposta]
    errosImportacao:       list[str]
