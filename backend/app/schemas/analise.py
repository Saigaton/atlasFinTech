from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProjecaoCaixaResposta(BaseModel):
    rotulo:           str
    receitaProjetada: Decimal
    despesaProjetada: Decimal
    liquido:          Decimal
    saldoProjetado:   Decimal


class DadosFluxoCaixaResposta(BaseModel):
    saldoAtual: Decimal
    projecao:   list[ProjecaoCaixaResposta]


class CategoriaTopResposta(BaseModel):
    categoriaId: Optional[int] = None
    total:       Decimal


class AnaliseFinanceiraResposta(BaseModel):
    totalReceita:                 Decimal
    totalDespesa:                 Decimal
    lucroLiquido:                 Decimal
    margemLucro:                  Optional[Decimal]
    crescimentoReceita:           Optional[Decimal] = None
    crescimentoDespesa:           Optional[Decimal] = None
    crescimentoLucro:             Optional[Decimal] = None
    totalTransacoes:              int
    ticketMedioReceita:           Decimal
    transacoesReceita:            int
    ticketMedioDespesa:           Decimal
    transacoesDespesa:            int
    principaisDespesasCategorias: list[CategoriaTopResposta] = []
    principaisReceitasCategorias: list[CategoriaTopResposta] = []


class AlertaResposta(BaseModel):
    tipo:     int
    titulo:   str
    mensagem: str
    rotaAcao: str


class PagavelCalendarioResposta(BaseModel):
    id:        int
    descricao: str
    valor:     Decimal
    situacao:  str


class RecebivelCalendarioResposta(BaseModel):
    id:          int
    descricao:   str
    valor:       Decimal
    situacao:    str
    nomeCliente: Optional[str] = None


class EventoCalendarioResposta(BaseModel):
    data:         str
    pagaveis:     list[PagavelCalendarioResposta]
    recebiveis:   list[RecebivelCalendarioResposta]
    totalPagar:   Decimal
    totalReceber: Decimal


class DadosCalendarioResposta(BaseModel):
    ano:               int
    mes:               int
    rotulo:            str
    primeiroDiaSemana: int
    diasNoMes:         int
    totalPagar:        Decimal
    totalReceber:      Decimal
    eventos:           list[EventoCalendarioResposta]


class PrevisaoMesResposta(BaseModel):
    ePositivo:        bool
    saldoProjetado:   Decimal
    receitaProjetada: Decimal
    despesaProjetada: Decimal
    diasRestantes:    int


class MetaOrcamentariaResposta(BaseModel):
    id:            int
    mes:           int
    ano:           int
    nomeCategoria: str
    corCategoria:  str
    valorMeta:     Decimal
    gasto:         Decimal
    excedido:      bool
    percentual:    float


class CriarMetaOrcamentaria(BaseModel):
    category_id: int
    amount:      Decimal = Field(..., gt=0)
    month:       Optional[int] = Field(None, ge=1, le=12)
    year:        Optional[int] = Field(None, ge=2000, le=2100)


class ItemLogAuditoriaResposta(BaseModel):
    id:        int
    acao:      str
    recurso:   str
    criado_em: datetime


class PaginaLogAuditoriaResposta(BaseModel):
    total:      int
    pagina:     int
    por_pagina: int
    itens:      list[ItemLogAuditoriaResposta]


class RequisicaoChatbot(BaseModel):
    message: str


class RespostaChatbot(BaseModel):
    resposta: str
