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


class RequisicaoChatbot(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class RespostaChatbot(BaseModel):
    resposta: str
