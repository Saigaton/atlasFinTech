from sqlalchemy.orm import joinedload
from app.entidades.empresas import Empresas
from app.entidades.transacoes import Transacoes


class TransacaoRepository:
    def __init__(self, session):
        self.session = session

    def _com_relacionamentos(self):
        return (
            self.session.query(Transacoes)
            .options(
                joinedload(Transacoes.conta),
                joinedload(Transacoes.categoria),
            )
        )

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

    def listarComRelacionamentos(self, empresa_id: int, usuario_id: int) -> list[Transacoes]:
        return (
            self._com_relacionamentos()
            .join(Empresas, Transacoes.empresa_id == Empresas.id)
            .filter(Transacoes.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
            .order_by(Transacoes.data.desc())
            .all()
        )

    def buscarPorId(self, transacao_id: int, empresa_id: int = None, usuario_id: int = None) -> Transacoes | None:
        q = self.session.query(Transacoes).filter(Transacoes.id == transacao_id)
        if empresa_id is not None:
            q = q.join(Empresas, Transacoes.empresa_id == Empresas.id).filter(
                Transacoes.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
            )
        return q.first()

    def buscarComRelacionamentos(self, transacao_id: int, empresa_id: int = None, usuario_id: int = None) -> Transacoes | None:
        q = self._com_relacionamentos().filter(Transacoes.id == transacao_id)
        if empresa_id is not None:
            q = q.join(Empresas, Transacoes.empresa_id == Empresas.id).filter(
                Transacoes.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
            )
        return q.first()

    def atualizarTransacao(self, transacao: Transacoes, dados: dict) -> Transacoes:
        for campo, valor in dados.items():
            setattr(transacao, campo, valor)
        return transacao

    def deletarTransacao(self, transacao: Transacoes) -> None:
        self.session.delete(transacao)

    def criarEmLote(self, transacoes: list[Transacoes]) -> list[Transacoes]:
        for t in transacoes:
            self.session.add(t)
        return transacoes
