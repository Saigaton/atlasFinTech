from decimal import Decimal
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum

class ContasReceber(Base):
    __tablename__ = "contas_receber"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    descricao: Mapped[str] = mapped_column(String(100))
    valor: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    data_vencimento: Mapped[str] = mapped_column(String(255))
    data_pagamento: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"))
    categoria: Mapped["Categorias"] = relationship(back_populates="contas_receber")

    situacao_id: Mapped[TipoSituacaoContaEnum] = mapped_column(Integer, ForeignKey("tipo_situacao_conta.id"))
    situacao: Mapped["TipoSituacaoConta"] = relationship(back_populates="contas_receber")    