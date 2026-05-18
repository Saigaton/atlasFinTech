import calendar
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import extract, func
from sqlalchemy.orm import joinedload

from app.entidades.contasPagar import ContasPagar
from app.entidades.contasReceber import ContasReceber
from app.entidades.empresas import Empresas
from app.entidades.metasOrcamentarias import MetasOrcamentarias
from app.entidades.transacoes import Transacoes
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum
from app.enums.tipoTransacaoEnum import TipoTransacaoEnum


class AnaliseRepository:
    def __init__(self, session):
        self.session = session

    def _query_transacoes(self, empresa_id: int, usuario_id: int):
        return (
            self.session.query(Transacoes)
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(Transacoes.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
        )

    def totalMensal(self, empresa_id: int, usuario_id: int, tipo: TipoTransacaoEnum, mes: int, ano: int) -> Decimal:
        return (
            self.session.query(func.coalesce(func.sum(Transacoes.valor), 0))
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(
                Transacoes.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                Transacoes.transacao_id == tipo,
                extract("month", Transacoes.data) == mes,
                extract("year", Transacoes.data) == ano,
            )
            .scalar() or Decimal("0.00")
        )

    def historicoPorMes(self, empresa_id: int, usuario_id: int, meses: int) -> list[dict]:
        hoje = datetime.now(timezone.utc)
        resultado = []
        for i in range(meses - 1, -1, -1):
            m = hoje.month - i
            a = hoje.year
            while m <= 0:
                m += 12
                a -= 1
            receitas = self.totalMensal(empresa_id, usuario_id, TipoTransacaoEnum.RECEITA, m, a)
            despesas = self.totalMensal(empresa_id, usuario_id, TipoTransacaoEnum.DESPESA, m, a)
            resultado.append({"mes": m, "ano": a, "receitas": receitas, "despesas": despesas, "saldo": receitas - despesas})
        return resultado

    def transacoesPorMes(self, empresa_id: int, usuario_id: int, mes: int, ano: int) -> list[Transacoes]:
        return (
            self._query_transacoes(empresa_id, usuario_id)
            .filter(
                extract("month", Transacoes.data) == mes,
                extract("year", Transacoes.data) == ano,
            )
            .order_by(Transacoes.data)
            .all()
        )

    def contasPagarVencidas(self, empresa_id: int, usuario_id: int) -> list[ContasPagar]:
        agora = datetime.now(timezone.utc)
        return (
            self.session.query(ContasPagar)
            .join(Empresas, ContasPagar.empresa_id == Empresas.id)
            .filter(
                ContasPagar.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                ContasPagar.situacao_id == TipoSituacaoContaEnum.PENDENTE,
                ContasPagar.data_vencimento < agora,
            )
            .all()
        )

    def contasReceberVencidas(self, empresa_id: int, usuario_id: int) -> list[ContasReceber]:
        agora = datetime.now(timezone.utc)
        return (
            self.session.query(ContasReceber)
            .join(Empresas, ContasReceber.empresa_id == Empresas.id)
            .filter(
                ContasReceber.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                ContasReceber.situacao_id == TipoSituacaoContaEnum.PENDENTE,
                ContasReceber.data_vencimento < agora,
            )
            .all()
        )

    def contasPagarPorMes(self, empresa_id: int, usuario_id: int, mes: int, ano: int) -> list[ContasPagar]:
        return (
            self.session.query(ContasPagar)
            .join(Empresas, ContasPagar.empresa_id == Empresas.id)
            .filter(
                ContasPagar.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                extract("month", ContasPagar.data_vencimento) == mes,
                extract("year",  ContasPagar.data_vencimento) == ano,
            )
            .order_by(ContasPagar.data_vencimento)
            .all()
        )

    def contasReceberPorMes(self, empresa_id: int, usuario_id: int, mes: int, ano: int) -> list[ContasReceber]:
        return (
            self.session.query(ContasReceber)
            .join(Empresas, ContasReceber.empresa_id == Empresas.id)
            .filter(
                ContasReceber.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                extract("month", ContasReceber.data_vencimento) == mes,
                extract("year",  ContasReceber.data_vencimento) == ano,
            )
            .order_by(ContasReceber.data_vencimento)
            .all()
        )

    def contasPagarPendentes(self, empresa_id: int, usuario_id: int) -> list[ContasPagar]:
        return (
            self.session.query(ContasPagar)
            .join(Empresas, ContasPagar.empresa_id == Empresas.id)
            .filter(
                ContasPagar.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                ContasPagar.situacao_id == TipoSituacaoContaEnum.PENDENTE,
            )
            .order_by(ContasPagar.data_vencimento)
            .all()
        )

    def contasReceberPendentes(self, empresa_id: int, usuario_id: int) -> list[ContasReceber]:
        return (
            self.session.query(ContasReceber)
            .join(Empresas, ContasReceber.empresa_id == Empresas.id)
            .filter(
                ContasReceber.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                ContasReceber.situacao_id == TipoSituacaoContaEnum.PENDENTE,
            )
            .order_by(ContasReceber.data_vencimento)
            .all()
        )

    def ultimasTransacoes(self, empresa_id: int, usuario_id: int, limite: int = 5) -> list[Transacoes]:
        return (
            self._query_transacoes(empresa_id, usuario_id)
            .order_by(Transacoes.data.desc())
            .limit(limite)
            .all()
        )

    # ── Metas Orçamentárias ────────────────────────────────────────────────

    def listarMetas(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> list[MetasOrcamentarias]:
        q = (
            self.session.query(MetasOrcamentarias)
            .options(joinedload(MetasOrcamentarias.categoria))
            .join(Empresas, MetasOrcamentarias.empresa_id == Empresas.id)
            .filter(MetasOrcamentarias.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
        )
        if mes:
            q = q.filter(MetasOrcamentarias.mes == mes)
        if ano:
            q = q.filter(MetasOrcamentarias.ano == ano)
        return q.all()

    def criarMeta(self, meta: MetasOrcamentarias) -> MetasOrcamentarias:
        self.session.add(meta)
        return meta

    def buscarMetaPorId(self, meta_id: int, empresa_id: int, usuario_id: int) -> MetasOrcamentarias | None:
        return (
            self.session.query(MetasOrcamentarias)
            .join(Empresas, MetasOrcamentarias.empresa_id == Empresas.id)
            .filter(
                MetasOrcamentarias.id == meta_id,
                MetasOrcamentarias.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
            )
            .first()
        )

    def deletarMeta(self, meta: MetasOrcamentarias) -> None:
        self.session.delete(meta)

    def totalMensalPorCategoria(self, empresa_id: int, usuario_id: int, categoria_id: int, mes: int, ano: int) -> Decimal:
        return (
            self.session.query(func.coalesce(func.sum(Transacoes.valor), 0))
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(
                Transacoes.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                Transacoes.categoria_id == categoria_id,
                Transacoes.transacao_id == TipoTransacaoEnum.DESPESA,
                extract("month", Transacoes.data) == mes,
                extract("year", Transacoes.data) == ano,
            )
            .scalar() or Decimal("0.00")
        )

    def topCategorias(self, empresa_id: int, usuario_id: int, tipo: TipoTransacaoEnum, mes: int, ano: int, limite: int = 5) -> list[dict]:
        rows = (
            self.session.query(
                Transacoes.categoria_id,
                func.sum(Transacoes.valor).label("total"),
            )
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(
                Transacoes.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                Transacoes.transacao_id == tipo,
                extract("month", Transacoes.data) == mes,
                extract("year", Transacoes.data) == ano,
            )
            .group_by(Transacoes.categoria_id)
            .order_by(func.sum(Transacoes.valor).desc())
            .limit(limite)
            .all()
        )
        return [{"categoriaId": r.categoria_id, "total": r.total} for r in rows]
