from app.entidades.contasReceber import ContasReceber
from app.entidades.empresas import Empresas


class ContaReceberRepository:
    def __init__(self, session):
        self.session = session

    def criarContaReceber(self, conta: ContasReceber) -> ContasReceber:
        self.session.add(conta)
        return conta

    def listarPorEmpresa(self, empresa_id: int, usuario_id: int) -> list[ContasReceber]:
        return (
            self.session.query(ContasReceber)
            .join(Empresas, ContasReceber.empresa_id == Empresas.id)
            .filter(ContasReceber.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
            .all()
        )

    def buscarPorId(self, conta_id: int, empresa_id: int, usuario_id: int) -> ContasReceber | None:
        return (
            self.session.query(ContasReceber)
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
