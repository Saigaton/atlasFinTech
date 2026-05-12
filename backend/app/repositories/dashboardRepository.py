from decimal import Decimal
from sqlalchemy import func, extract

from app.entidades.contas import Contas
from app.entidades.empresas import Empresas
from app.entidades.transacoes import Transacoes
from app.enums.tipoTransacaoEnum import TipoTransacaoEnum


class DashboardRepository:
    def __init__(self, session):
        self.session = session

    def queryTransacoes(self, empresa_id: int, usuario_id: int):
        return (
            self.session.query(Transacoes)
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(Transacoes.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
        )

    def totalPorTipo(self, empresa_id: int, usuario_id: int, tipo: TipoTransacaoEnum, mes: int | None, ano: int | None) -> Decimal:
        q = (
            self.session.query(func.coalesce(func.sum(Transacoes.valor), 0))
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(Transacoes.empresa_id == empresa_id, Empresas.usuario_id == usuario_id, Transacoes.transacao_id == tipo)
        )
        if mes:
            q = q.filter(extract("month", Transacoes.data) == mes)
        if ano:
            q = q.filter(extract("year", Transacoes.data) == ano)
        return q.scalar() or Decimal("0.00")

    def saldoTotalContas(self, empresa_id: int, usuario_id: int) -> Decimal:
        return (
            self.session.query(func.coalesce(func.sum(Contas.saldo_atual), 0))
            .filter(Contas.empresa_id == empresa_id, Contas.usuario_id == usuario_id)
            .scalar() or Decimal("0.00")
        )

    def transacoesRecentes(self, empresa_id: int, usuario_id: int, limite: int) -> list[Transacoes]:
        return (
            self.queryTransacoes(empresa_id, usuario_id)
            .order_by(Transacoes.data.desc())
            .limit(limite)
            .all()
        )

    def graficoMensal(self, empresa_id: int, usuario_id: int, ano: int) -> list[dict]:
        rows = (
            self.session.query(
                extract("month", Transacoes.data).label("mes"),
                Transacoes.transacao_id,
                func.sum(Transacoes.valor).label("total"),
            )
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(
                Transacoes.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
                extract("year", Transacoes.data) == ano,
            )
            .group_by("mes", Transacoes.transacao_id)
            .all()
        )
        return [{"mes": int(r.mes), "tipo": r.transacao_id, "total": r.total} for r in rows]
