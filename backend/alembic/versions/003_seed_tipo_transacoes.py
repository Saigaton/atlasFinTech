"""seed_tipo_transacoes

Revision ID: 003
Revises: 002
Create Date: 2026-05-16 14:26:12.296848

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from app.enums.tipoTransacaoEnum import TipoTransacaoEnum

revision: str = '003'
down_revision: Union[str, Sequence[str], None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NOMES = {
    TipoTransacaoEnum.RECEITA: "Receita",
    TipoTransacaoEnum.DESPESA: "Despesa",
    TipoTransacaoEnum.TRANSFERENCIA: "Transferência",
}


def upgrade() -> None:
    valores = ", ".join(f"({t.value}, '{NOMES[t]}')" for t in TipoTransacaoEnum)
    op.execute(f"INSERT INTO tipo_transacoes (id, nome) VALUES {valores} ON CONFLICT (id) DO NOTHING")


def downgrade() -> None:
    op.execute(
        f"DELETE FROM tipo_transacoes WHERE id IN ({', '.join(str(t.value) for t in TipoTransacaoEnum)})"
    )
