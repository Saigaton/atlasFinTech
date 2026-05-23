from sqlalchemy.orm import Session
from app.entidades.tipo_categorias import TipoCategorias
from app.entidades.tipo_transacoes import TipoTransacoes
from app.entidades.tipo_situacao_conta import TipoSituacaoConta

_TIPOS_CATEGORIA = [
    (0, "Receita"),
    (1, "Despesa"),
    (2, "Ambos"),
]

_TIPOS_TRANSACAO = [
    (0, "Receita"),
    (1, "Despesa"),
    (3, "Transferência"),
]

_TIPOS_SITUACAO_CONTA = [
    (0, "Pendente"),
    (1, "Pago"),
    (2, "Atrasado"),
]


def seed_tipo_categorias(db: Session) -> None:
    for id_, nome in _TIPOS_CATEGORIA:
        if not db.get(TipoCategorias, id_):
            db.add(TipoCategorias(id=id_, nome=nome))
    db.commit()


def seed_tipo_transacoes(db: Session) -> None:
    for id_, nome in _TIPOS_TRANSACAO:
        if not db.get(TipoTransacoes, id_):
            db.add(TipoTransacoes(id=id_, nome=nome))
    db.commit()


def seed_tipo_situacao_conta(db: Session) -> None:
    for id_, nome in _TIPOS_SITUACAO_CONTA:
        if not db.get(TipoSituacaoConta, id_):
            db.add(TipoSituacaoConta(id=id_, nome=nome))
    db.commit()
