from app.entidades.empresas import Empresas
from app.entidades.transacoes import Transacoes


class TransacaoRepository:
    def __init__(self, session):
        self.session = session

    def criarTransacao(self, transacao: Transacoes) -> Transacoes:
        self.session.add(transacao)
        return transacao

    def listarPorEmpresa(self, empresa_id: int, usuario_id: int) -> list[Transacoes]:
        return (
            self.session.query(Transacoes)
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(Transacoes.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
            .all()
        )

    def buscarPorId(self, transacao_id: int, empresa_id: int, usuario_id: int) -> Transacoes | None:
        return (
            self.session.query(Transacoes)
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(
                Transacoes.id == transacao_id,
                Transacoes.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
            )
            .first()
        )

    def atualizarTransacao(self, transacao: Transacoes, dados: dict) -> Transacoes:
        for campo, valor in dados.items():
            setattr(transacao, campo, valor)
        return transacao

    def deletarTransacao(self, transacao: Transacoes) -> None:
        self.session.delete(transacao)
