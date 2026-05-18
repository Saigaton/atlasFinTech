"""seed_tipo_contas

Revision ID: 001
Revises:
Create Date: 2026-05-16 12:17:13.028222

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from app.enums.tipoContaEnum import TipoContaEnum

revision: str = '001'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NOMES = {
    TipoContaEnum.CORRENTE: "Corrente",
    TipoContaEnum.POUPANCA: "Poupança",
    TipoContaEnum.INVESTIMENTO: "Investimento",
}


def upgrade() -> None:
    valores = ", ".join(f"({t.value}, '{NOMES[t]}')" for t in TipoContaEnum)
    op.execute(f"INSERT INTO tipo_contas (id, nome) VALUES {valores} ON CONFLICT (id) DO NOTHING")


def downgrade() -> None:
    op.execute(
        f"DELETE FROM tipo_contas WHERE id IN ({', '.join(str(t.value) for t in TipoContaEnum)})"
    )
