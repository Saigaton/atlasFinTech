from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.entidades.contasReceber import ContasReceber
from app.entidades.empresas import Empresas
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum


class ContaReceberRepository:
    def __init__(self, session):
        self.session = session

    def _com_relacionamentos(self):
        return (
            self.session.query(ContasReceber)
            .options(
                joinedload(ContasReceber.conta),
                joinedload(ContasReceber.categoria),
            )
        )

    def criarContaReceber(self, conta: ContasReceber) -> ContasReceber:
        self.session.add(conta)
        return conta

    def listarPorEmpresa(self, empresa_id: int, usuario_id: int) -> list[ContasReceber]:
        return (
            self._com_relacionamentos()
            .join(Empresas, ContasReceber.empresa_id == Empresas.id)
            .filter(ContasReceber.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
            .order_by(ContasReceber.data_vencimento.asc())
            .all()
        )

    def buscarPorId(self, conta_id: int, empresa_id: int, usuario_id: int) -> ContasReceber | None:
        return (
            self._com_relacionamentos()
            .join(Empresas, ContasReceber.empresa_id == Empresas.id)
            .filter(
                ContasReceber.id == conta_id,
                ContasReceber.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
            )
            .first()
        )

    def atualizarContaReceber(self, conta: ContasReceber, dados: dict) -> ContasReceber:
        for campo, valor in dados.items():
            setattr(conta, campo, valor)
        return conta

    def deletarContaReceber(self, conta: ContasReceber) -> None:
        self.session.delete(conta)

    def resumo(self, empresa_id: int, usuario_id: int) -> dict:
        def _total(situacao: TipoSituacaoContaEnum) -> Decimal:
            return (
                self.session.query(func.coalesce(func.sum(ContasReceber.valor), 0))
                .join(Empresas, ContasReceber.empresa_id == Empresas.id)
                .filter(ContasReceber.empresa_id == empresa_id, Empresas.usuario_id == usuario_id, ContasReceber.situacao_id == situacao)
                .scalar() or Decimal("0.00")
            )

        def _qtd(situacao: TipoSituacaoContaEnum) -> int:
            return (
                self.session.query(func.count(ContasReceber.id))
                .join(Empresas, ContasReceber.empresa_id == Empresas.id)
                .filter(ContasReceber.empresa_id == empresa_id, Empresas.usuario_id == usuario_id, ContasReceber.situacao_id == situacao)
                .scalar() or 0
            )

        return {
            "total_pendente":      _total(TipoSituacaoContaEnum.PENDENTE),
            "total_recebido":      _total(TipoSituacaoContaEnum.PAGO),
            "total_atrasado":      _total(TipoSituacaoContaEnum.ATRASADO),
            "quantidade_pendente": _qtd(TipoSituacaoContaEnum.PENDENTE),
            "quantidade_recebido": _qtd(TipoSituacaoContaEnum.PAGO),
            "quantidade_atrasado": _qtd(TipoSituacaoContaEnum.ATRASADO),
        }
