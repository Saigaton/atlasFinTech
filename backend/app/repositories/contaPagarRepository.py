from app.entidades.contasPagar import ContasPagar
from app.entidades.empresas import Empresas


class ContaPagarRepository:
    def __init__(self, session):
        self.session = session

    def criarContaPagar(self, conta: ContasPagar) -> ContasPagar:
        self.session.add(conta)
        return conta

    def listarPorEmpresa(self, empresa_id: int, usuario_id: int) -> list[ContasPagar]:
        return (
            self.session.query(ContasPagar)
            .join(Empresas, ContasPagar.empresa_id == Empresas.id)
            .filter(ContasPagar.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
            .all()
        )

    def buscarPorId(self, conta_id: int, empresa_id: int, usuario_id: int) -> ContasPagar | None:
        return (
            self.session.query(ContasPagar)
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
