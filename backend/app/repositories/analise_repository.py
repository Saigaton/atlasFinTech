import calendar
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import extract, func

from app.entidades.contas import Contas
from app.entidades.contas_pagar import ContasPagar
from app.entidades.contas_receber import ContasReceber
from app.entidades.empresas import Empresas
from app.entidades.transacoes import Transacoes
from app.enums.tipo_situacao_conta_enum import TipoSituacaoContaEnum
from app.enums.tipo_transacao_enum import TipoTransacaoEnum


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

    def contas_pagar_vencidas(self, empresa_id: int, usuario_id: int) -> list[ContasPagar]:
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

    def contasBancariasNegativas(self, empresa_id: int, usuario_id: int) -> list[Contas]:
        return (
            self.session.query(Contas)
            .join(Empresas, Contas.empresa_id == Empresas.id)
            .filter(
                Contas.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                Contas.saldo_atual < 0,
            )
            .all()
        )

    def contas_receber_vencidas(self, empresa_id: int, usuario_id: int) -> list[ContasReceber]:
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

    def transacoesVencidas(self, empresa_id: int, usuario_id: int) -> list[Transacoes]:
        agora = datetime.now(timezone.utc)
        return (
            self.session.query(Transacoes)
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(
                Transacoes.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                Transacoes.situacao == 0,
                Transacoes.data < agora,
            )
            .all()
        )

    def contas_pagar_proximas_vencer(self, empresa_id: int, usuario_id: int) -> list[ContasPagar]:
        hoje = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        amanha = hoje + timedelta(days=1)
        return (
            self.session.query(ContasPagar)
            .join(Empresas, ContasPagar.empresa_id == Empresas.id)
            .filter(
                ContasPagar.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                ContasPagar.situacao_id == TipoSituacaoContaEnum.PENDENTE,
                ContasPagar.data_vencimento >= hoje,
                ContasPagar.data_vencimento < amanha,
            )
            .all()
        )

    def contas_receber_proximas_vencer(self, empresa_id: int, usuario_id: int) -> list[ContasReceber]:
        hoje = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        amanha = hoje + timedelta(days=1)
        return (
            self.session.query(ContasReceber)
            .join(Empresas, ContasReceber.empresa_id == Empresas.id)
            .filter(
                ContasReceber.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                ContasReceber.situacao_id == TipoSituacaoContaEnum.PENDENTE,
                ContasReceber.data_vencimento >= hoje,
                ContasReceber.data_vencimento < amanha,
            )
            .all()
        )

    def contas_pagar_por_mes(self, empresa_id: int, usuario_id: int, mes: int, ano: int) -> list[ContasPagar]:
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

    def contas_receber_por_mes(self, empresa_id: int, usuario_id: int, mes: int, ano: int) -> list[ContasReceber]:
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

    def contas_pagar_pendentes(self, empresa_id: int, usuario_id: int) -> list[ContasPagar]:
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

    def contas_receber_pendentes(self, empresa_id: int, usuario_id: int) -> list[ContasReceber]:
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

