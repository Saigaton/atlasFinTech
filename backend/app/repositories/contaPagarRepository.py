from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.entidades.contasPagar import ContasPagar
from app.entidades.empresas import Empresas
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum


class ContaPagarRepository:
    def __init__(self, session):
        self.session = session

    def _com_relacionamentos(self):
        return (
            self.session.query(ContasPagar)
            .options(
                joinedload(ContasPagar.conta),
                joinedload(ContasPagar.categoria),
            )
        )

    def criarContaPagar(self, conta: ContasPagar) -> ContasPagar:
        self.session.add(conta)
        return conta

    def listarPorEmpresa(self, empresa_id: int, usuario_id: int) -> list[ContasPagar]:
        return (
            self._com_relacionamentos()
            .join(Empresas, ContasPagar.empresa_id == Empresas.id)
            .filter(ContasPagar.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
            .order_by(ContasPagar.data_vencimento.asc())
            .all()
        )

    def buscarPorId(self, conta_id: int, empresa_id: int, usuario_id: int) -> ContasPagar | None:
        return (
            self._com_relacionamentos()
            .join(Empresas, ContasPagar.empresa_id == Empresas.id)
            .filter(
                ContasPagar.id == conta_id,
                ContasPagar.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
            )
            .first()
        )

    def atualizarContaPagar(self, conta: ContasPagar, dados: dict) -> ContasPagar:
        for campo, valor in dados.items():
            setattr(conta, campo, valor)
        return conta

    def deletarContaPagar(self, conta: ContasPagar) -> None:
        self.session.delete(conta)

    def resumo(self, empresa_id: int, usuario_id: int) -> dict:
        def _total(situacao: TipoSituacaoContaEnum) -> Decimal:
            return (
                self.session.query(func.coalesce(func.sum(ContasPagar.valor), 0))
                .join(Empresas, ContasPagar.empresa_id == Empresas.id)
                .filter(ContasPagar.empresa_id == empresa_id, Empresas.usuario_id == usuario_id, ContasPagar.situacao_id == situacao)
                .scalar() or Decimal("0.00")
            )

        def _qtd(situacao: TipoSituacaoContaEnum) -> int:
            return (
                self.session.query(func.count(ContasPagar.id))
                .join(Empresas, ContasPagar.empresa_id == Empresas.id)
                .filter(ContasPagar.empresa_id == empresa_id, Empresas.usuario_id == usuario_id, ContasPagar.situacao_id == situacao)
                .scalar() or 0
            )

        return {
            "total_pendente":      _total(TipoSituacaoContaEnum.PENDENTE),
            "total_pago":          _total(TipoSituacaoContaEnum.PAGO),
            "total_atrasado":      _total(TipoSituacaoContaEnum.ATRASADO),
            "quantidade_pendente": _qtd(TipoSituacaoContaEnum.PENDENTE),
            "quantidade_pago":     _qtd(TipoSituacaoContaEnum.PAGO),
            "quantidade_atrasado": _qtd(TipoSituacaoContaEnum.ATRASADO),
        }
