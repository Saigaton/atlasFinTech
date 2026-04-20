from decimal import Decimal
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.enums.tipoContaEnum import TipoContaEnum

class Contas(Base):
    __tablename__ = "contas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100))
    saldo_inicial: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    saldo_atual: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    descricao: Mapped[str] = mapped_column(String(255))
    data_criacao: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    usuario: Mapped["usuario"] = relationship(back_populates="contas")

    tipo_conta_id: Mapped[TipoContaEnum] = mapped_column(Integer, ForeignKey("tipo_contas.id"))
    tipo_conta: Mapped["tipoConta"] = relationship(back_populates="contas")