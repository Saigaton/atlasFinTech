from decimal import Decimal
from sqlalchemy import extract, func

from app.entidades.contasPagar import ContasPagar
from app.entidades.contasReceber import ContasReceber
from app.entidades.empresas import Empresas
from app.entidades.transacoes import Transacoes
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum
from app.enums.tipoTransacaoEnum import TipoTransacaoEnum


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
            .filter(Transacoes.transacao_id == TipoTransacaoEnum.DESPESA)
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
