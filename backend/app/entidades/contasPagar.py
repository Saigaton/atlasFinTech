from decimal import Decimal
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum

class ContasPagar(Base):
    __tablename__ = "contas_pagar"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    descricao: Mapped[str] = mapped_column(String(100))
    valor: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    data_vencimento: Mapped[str] = mapped_column(String(255))
    data_pagamento: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"))
    categoria: Mapped["categoria"] = relationship(back_populates="contas_pagar")

    situacao_id: Mapped[TipoSituacaoContaEnum] = mapped_column(Integer, ForeignKey("tipo_situacao_conta.id"))
    situacao: Mapped["situacao"] = relationship(back_populates="contas_pagar")    