from decimal import Decimal
from sqlalchemy import func, extract
from sqlalchemy.orm import joinedload

from app.entidades.contas import Contas
from app.entidades.empresas import Empresas
from app.entidades.transacoes import Transacoes
from app.enums.tipo_transacao_enum import TipoTransacaoEnum
from app.entidades.usuarios import Usuarios


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
            .options(joinedload(Transacoes.categoria))
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

    def graficoPorConta(self, empresa_id: int, usuario_id: int, ano: int | None = None) -> list[dict]:
        contas = (
            self.session.query(Contas)
            .filter(Contas.empresa_id == empresa_id, Contas.usuario_id == usuario_id)
            .all()
        )
        resultado = []
        for c in contas:
            q = (
                self.session.query(
                    Transacoes.transacao_id,
                    func.coalesce(func.sum(Transacoes.valor), 0).label("total"),
                )
                .filter(Transacoes.conta_id == c.id, Transacoes.empresa_id == empresa_id)
            )
            if ano:
                q = q.filter(extract("year", Transacoes.data) == ano)
            q = q.group_by(Transacoes.transacao_id)
            rows = {int(r.transacao_id): r.total for r in q.all()}
            resultado.append({
                "contaId":   c.id,
                "nomeConta": c.nome,
                "receita":   Decimal(str(rows.get(TipoTransacaoEnum.RECEITA, "0.00"))),
                "despesa":   Decimal(str(rows.get(TipoTransacaoEnum.DESPESA, "0.00"))),
            })
        return resultado
