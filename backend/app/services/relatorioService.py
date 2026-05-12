from decimal import Decimal

from app.enums.tipoTransacaoEnum import TipoTransacaoEnum
from app.repositories.relatorioRepository import RelatorioRepository
from app.schemas.relatorio import (
    ContasPagarResumoResposta,
    ContasReceberResumoResposta,
    FluxoCaixaResposta,
    ItemFluxoCaixaResposta,
    ItemPorCategoriaResposta,
)


class RelatorioService:
    def __init__(self, repository: RelatorioRepository):
        self.repository = repository

    def fluxoCaixa(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> FluxoCaixaResposta:
        transacoes = self.repository.fluxoCaixa(empresa_id, usuario_id, mes, ano)

        total_receitas = sum((t.valor for t in transacoes if t.transacao_id == TipoTransacaoEnum.RECEITA), Decimal("0.00"))
        total_despesas = sum((t.valor for t in transacoes if t.transacao_id == TipoTransacaoEnum.DESPESA), Decimal("0.00"))

        return FluxoCaixaResposta(
            total_receitas=total_receitas,
            total_despesas=total_despesas,
            saldo=total_receitas - total_despesas,
            transacoes=[ItemFluxoCaixaResposta.model_validate(t) for t in transacoes],
        )

    def porCategoria(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> list[ItemPorCategoriaResposta]:
        rows = self.repository.totalPorCategoria(empresa_id, usuario_id, mes, ano)
        return [ItemPorCategoriaResposta(**r) for r in rows]

    def resumoContasPagar(self, empresa_id: int, usuario_id: int) -> ContasPagarResumoResposta:
        dados = self.repository.resumoContasPagar(empresa_id, usuario_id)
        return ContasPagarResumoResposta(**dados)

    def resumoContasReceber(self, empresa_id: int, usuario_id: int) -> ContasReceberResumoResposta:
        dados = self.repository.resumoContasReceber(empresa_id, usuario_id)
        return ContasReceberResumoResposta(**dados)
