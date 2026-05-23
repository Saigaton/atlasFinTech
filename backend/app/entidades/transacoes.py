from decimal import Decimal
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base
from app.enums.tipo_transacao_enum import TipoTransacaoEnum
from app.enums.situacao_transacao_enum import SituacaoTransacaoEnum


class Transacoes(Base):
    __tablename__ = "transacoes"

    id:        Mapped[int]     = mapped_column(Integer, primary_key=True, index=True)
    descricao: Mapped[str]     = mapped_column(String(100))
    valor:     Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    data:      Mapped[datetime] = mapped_column(DateTime(timezone=True))
    notas:     Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    recorrencia: Mapped[str]   = mapped_column(String(20), default="nenhuma")
    situacao:  Mapped[int]     = mapped_column(Integer, default=SituacaoTransacaoEnum.PENDENTE)

    conta_id: Mapped[Optional[int]] = mapped_column(ForeignKey("contas.id"), nullable=True)
    conta:    Mapped[Optional["Contas"]] = relationship()

    categoria_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categorias.id"), nullable=True)
    categoria:    Mapped[Optional["Categorias"]] = relationship(back_populates="transacoes")

    transacao_id: Mapped[TipoTransacaoEnum] = mapped_column(Integer, ForeignKey("tipo_transacoes.id"))
    tipo_transacao: Mapped["TipoTransacoes"] = relationship(back_populates="transacoes")

    empresa_id: Mapped[int]      = mapped_column(ForeignKey("empresas.id"))
    empresa:    Mapped["Empresas"] = relationship(back_populates="transacoes")
