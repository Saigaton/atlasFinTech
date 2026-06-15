from sqlalchemy import or_, select

from app.entidades.contas import Contas
from app.entidades.transacoes import Transacoes


class ContaBancariaRepository:
    def __init__(self, session):
        self.session = session

    def criarConta(self, conta: Contas) -> Contas:
        self.session.add(conta)
        return conta

    def listarContasPorEmpresa(self, empresa_id: int, usuario_id: int) -> list[Contas]:
        return (
            self.session.query(Contas)
            .filter(Contas.empresa_id == empresa_id, Contas.usuario_id == usuario_id)
            .all()
        )

    def buscarContaPorId(self, conta_id: int, empresa_id: int, usuario_id: int) -> Contas | None:
        return (
            self.session.query(Contas)
            .filter(
                Contas.id == conta_id,
                Contas.empresa_id == empresa_id,
                Contas.usuario_id == usuario_id,
            )
            .first()
        )

    def atualizarConta(self, conta: Contas, dados: dict) -> Contas:
        for campo, valor in dados.items():
            setattr(conta, campo, valor)
        return conta

    def temTransacoesVinculadas(self, conta_id: int) -> bool:
        resultado = self.session.execute(
            select(Transacoes.id).where(
                or_(
                    Transacoes.conta_id == conta_id,
                    Transacoes.transferencia_para_conta_id == conta_id,
                )
            ).limit(1)
        ).first()
        return resultado is not None

    def deletarConta(self, conta: Contas) -> None:
        self.session.delete(conta)
