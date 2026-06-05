from decimal import Decimal
from sqlalchemy import extract, func

from app.entidades.agendamentos_relatorio import AgendamentosRelatorio
from app.entidades.contas_pagar import ContasPagar
from app.entidades.contas_receber import ContasReceber
from app.entidades.empresas import Empresas
from app.entidades.transacoes import Transacoes
from app.enums.tipo_situacao_conta_enum import TipoSituacaoContaEnum
from app.enums.tipo_transacao_enum import TipoTransacaoEnum


class RelatorioRepository:
    def __init__(self, session):
        self.session = session

    def _filtrar_transacoes(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None):
        q = (
            self.session.query(Transacoes)
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(Transacoes.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
        )
        if mes:
            q = q.filter(extract("month", Transacoes.data) == mes)
        if ano:
            q = q.filter(extract("year", Transacoes.data) == ano)
        return q

    def fluxoCaixa(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> list[Transacoes]:
        return self._filtrar_transacoes(empresa_id, usuario_id, mes, ano).order_by(Transacoes.data.desc()).all()

    def totalPorCategoria(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> list[dict]:
        rows = (
            self._filtrar_transacoes(empresa_id, usuario_id, mes, ano)
            .with_entities(Transacoes.categoria_id, func.sum(Transacoes.valor).label("total"))
            .filter(Transacoes.tipo_transacao_id == TipoTransacaoEnum.DESPESA)
            .group_by(Transacoes.categoria_id)
            .all()
        )
        return [{"categoria_id": r.categoria_id, "total": r.total} for r in rows]

    def _soma_contas_pagar(self, empresa_id: int, usuario_id: int, situacao: TipoSituacaoContaEnum) -> Decimal:
        return (
            self.session.query(func.coalesce(func.sum(ContasPagar.valor), 0))
            .join(Empresas, ContasPagar.empresa_id == Empresas.id)
            .filter(ContasPagar.empresa_id == empresa_id, Empresas.usuario_id == usuario_id, ContasPagar.situacao_id == situacao)
            .scalar() or Decimal("0.00")
        )

    def resumoContasPagar(self, empresa_id: int, usuario_id: int) -> dict:
        return {
            "total_pendente": self._soma_contas_pagar(empresa_id, usuario_id, TipoSituacaoContaEnum.PENDENTE),
            "total_pago":     self._soma_contas_pagar(empresa_id, usuario_id, TipoSituacaoContaEnum.PAGO),
            "total_atrasado": self._soma_contas_pagar(empresa_id, usuario_id, TipoSituacaoContaEnum.ATRASADO),
        }

    def _soma_contas_receber(self, empresa_id: int, usuario_id: int, situacao: TipoSituacaoContaEnum) -> Decimal:
        return (
            self.session.query(func.coalesce(func.sum(ContasReceber.valor), 0))
            .join(Empresas, ContasReceber.empresa_id == Empresas.id)
            .filter(ContasReceber.empresa_id == empresa_id, Empresas.usuario_id == usuario_id, ContasReceber.situacao_id == situacao)
            .scalar() or Decimal("0.00")
        )

    def resumoContasReceber(self, empresa_id: int, usuario_id: int) -> dict:
        return {
            "total_pendente":  self._soma_contas_receber(empresa_id, usuario_id, TipoSituacaoContaEnum.PENDENTE),
            "total_recebido":  self._soma_contas_receber(empresa_id, usuario_id, TipoSituacaoContaEnum.PAGO),
            "total_atrasado":  self._soma_contas_receber(empresa_id, usuario_id, TipoSituacaoContaEnum.ATRASADO),
        }

    def buscarAgendamento(self, empresa_id: int, usuario_id: int) -> AgendamentosRelatorio | None:
        return (
            self.session.query(AgendamentosRelatorio)
            .join(Empresas, AgendamentosRelatorio.empresa_id == Empresas.id)
            .filter(AgendamentosRelatorio.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
            .first()
        )

    def salvarAgendamento(self, ag: AgendamentosRelatorio) -> AgendamentosRelatorio:
        self.session.add(ag)
        return ag

    def cancelarAgendamento(self, empresa_id: int, usuario_id: int) -> None:
        ag = self.buscarAgendamento(empresa_id, usuario_id)
        if ag:
            self.session.delete(ag)

    def listarContasPagar(self, empresa_id: int, usuario_id: int, mes: int | None = None, ano: int | None = None) -> list[ContasPagar]:
        q = (
            self.session.query(ContasPagar)
            .join(Empresas, ContasPagar.empresa_id == Empresas.id)
            .filter(ContasPagar.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
        )
        if mes:
            q = q.filter(extract("month", ContasPagar.data_vencimento) == mes)
        if ano:
            q = q.filter(extract("year", ContasPagar.data_vencimento) == ano)
        return q.all()

    def listarContasReceber(self, empresa_id: int, usuario_id: int, mes: int | None = None, ano: int | None = None) -> list[ContasReceber]:
        q = (
            self.session.query(ContasReceber)
            .join(Empresas, ContasReceber.empresa_id == Empresas.id)
            .filter(ContasReceber.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
        )
        if mes:
            q = q.filter(extract("month", ContasReceber.data_vencimento) == mes)
        if ano:
            q = q.filter(extract("year", ContasReceber.data_vencimento) == ano)
        return q.all()

    def todasTransacoes(self, empresa_id: int, usuario_id: int) -> list[Transacoes]:
        return (
            self.session.query(Transacoes)
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(Transacoes.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
            .order_by(Transacoes.data.desc())
            .all()
        )
