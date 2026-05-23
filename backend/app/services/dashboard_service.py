import calendar as _cal
from datetime import date
from decimal import Decimal

from app.enums.tipo_transacao_enum import TipoTransacaoEnum
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import (
    KPIsResposta,
    PontoGraficoPorContaResposta,
    PontoGraficoResposta,
    TransacaoRecenteResposta,
)

_MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]


class DashboardService:
    def __init__(self, repository: DashboardRepository):
        self.repository = repository

    def obterKPIs(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> KPIsResposta:
        hoje  = date.today()
        m     = mes or hoje.month
        a     = ano or hoje.year

        receitas     = self.repository.totalPorTipo(empresa_id, usuario_id, TipoTransacaoEnum.RECEITA, mes, ano)
        despesas     = self.repository.totalPorTipo(empresa_id, usuario_id, TipoTransacaoEnum.DESPESA, mes, ano)
        saldo_contas = self.repository.saldoTotalContas(empresa_id, usuario_id)

        dias_mes      = _cal.monthrange(a, m)[1]
        periodo_label = f"{_MESES[m - 1]} {a}" if mes else f"Ano {a}"
        inicio        = f"{a}-{m:02d}-01" if mes else f"{a}-01-01"
        fim           = f"{a}-{m:02d}-{dias_mes}" if mes else f"{a}-12-31"

        return KPIsResposta(
            receitaTotal=receitas,
            despesaTotal=despesas,
            lucroLiquido=receitas - despesas,
            saldoTotal=saldo_contas,
            variacaoReceita=None,
            variacaoDespesa=None,
            variacaoLucro=None,
            periodoLabel=periodo_label,
            inicioPeriodo=inicio,
            fimPeriodo=fim,
        )

    def transacoesRecentes(self, empresa_id: int, usuario_id: int, limite: int) -> list[TransacaoRecenteResposta]:
        transacoes = self.repository.transacoesRecentes(empresa_id, usuario_id, limite)
        return [TransacaoRecenteResposta.model_validate(t) for t in transacoes]

    def graficoMensal(self, empresa_id: int, usuario_id: int, ano: int | None) -> list[PontoGraficoResposta]:
        ano_ref = ano or date.today().year
        rows    = self.repository.graficoMensal(empresa_id, usuario_id, ano_ref)

        pontos: dict[int, dict] = {}
        for row in rows:
            mes = row["mes"]
            if mes not in pontos:
                pontos[mes] = {"mes": mes, "receitas": Decimal("0.00"), "despesas": Decimal("0.00")}
            if row["tipo"] == TipoTransacaoEnum.RECEITA:
                pontos[mes]["receitas"] = row["total"]
            else:
                pontos[mes]["despesas"] = row["total"]

        return [PontoGraficoResposta(**v) for v in sorted(pontos.values(), key=lambda x: x["mes"])]

    def graficoPorConta(self, empresa_id: int, usuario_id: int, ano: int | None = None) -> list[PontoGraficoPorContaResposta]:
        contas = self.repository.graficoPorConta(empresa_id, usuario_id, ano)
        return [PontoGraficoPorContaResposta(**c) for c in contas]
