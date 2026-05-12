from datetime import date
from decimal import Decimal

from app.enums.tipoTransacaoEnum import TipoTransacaoEnum
from app.repositories.dashboardRepository import DashboardRepository
from app.schemas.dashboard import KPIsResposta, PontoGraficoResposta, TransacaoRecenteResposta


class DashboardService:
    def __init__(self, repository: DashboardRepository):
        self.repository = repository

    def obterKPIs(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> KPIsResposta:
        receitas = self.repository.totalPorTipo(empresa_id, usuario_id, TipoTransacaoEnum.RECEITA, mes, ano)
        despesas = self.repository.totalPorTipo(empresa_id, usuario_id, TipoTransacaoEnum.DESPESA, mes, ano)
        saldo_contas = self.repository.saldoTotalContas(empresa_id, usuario_id)

        return KPIsResposta(
            total_receitas=receitas,
            total_despesas=despesas,
            saldo_periodo=receitas - despesas,
            saldo_contas=saldo_contas,
        )

    def transacoesRecentes(self, empresa_id: int, usuario_id: int, limite: int) -> list[TransacaoRecenteResposta]:
        transacoes = self.repository.transacoesRecentes(empresa_id, usuario_id, limite)
        return [TransacaoRecenteResposta.model_validate(t) for t in transacoes]

    def graficoMensal(self, empresa_id: int, usuario_id: int, ano: int | None) -> list[PontoGraficoResposta]:
        ano_ref = ano or date.today().year
        rows = self.repository.graficoMensal(empresa_id, usuario_id, ano_ref)

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
