from decimal import Decimal
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base
from app.enums.tipo_conta_enum import TipoContaEnum

class Contas(Base):
    __tablename__ = "contas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100))
    saldo_inicial: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    saldo_atual: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    agencia: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)
    nome_banco: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    data_criacao: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    cor: Mapped[str]   = mapped_column(String(8))

    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id", ondelete="CASCADE"), index=True)
    empresa:    Mapped["Empresas"] = relationship(back_populates="contas")

    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    usuario: Mapped["Usuarios"] = relationship(back_populates="conta")

    tipo_conta_id: Mapped[TipoContaEnum] = mapped_column(Integer, ForeignKey("tipo_contas.id"))
    tipo_conta: Mapped["TipoContas"] = relationship(back_populates="conta")
