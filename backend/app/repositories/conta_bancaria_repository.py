from app.entidades.contas import Contas


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

    def deletarConta(self, conta: Contas) -> None:
        self.session.delete(conta)
