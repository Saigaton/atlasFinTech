"""seed_tipo_situacao_conta

Revision ID: 002
Revises: 001
Create Date: 2026-05-16 14:26:03.462271

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum

revision: str = '002'
down_revision: Union[str, Sequence[str], None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NOMES = {
    TipoSituacaoContaEnum.PENDENTE: "Pendente",
    TipoSituacaoContaEnum.PAGO: "Pago",
    TipoSituacaoContaEnum.ATRASADO: "Atrasado",
}


def upgrade() -> None:
    valores = ", ".join(f"({t.value}, '{NOMES[t]}')" for t in TipoSituacaoContaEnum)
    op.execute(f"INSERT INTO tipo_situacao_conta (id, nome) VALUES {valores} ON CONFLICT (id) DO NOTHING")


def downgrade() -> None:
    op.execute(
        f"DELETE FROM tipo_situacao_conta WHERE id IN ({', '.join(str(t.value) for t in TipoSituacaoContaEnum)})"
    )
