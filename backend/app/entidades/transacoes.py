from decimal import Decimal
from datetime import datetime
from sqlalchemy import Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base
from app.enums.tipoTransacaoEnum import TipoTransacaoEnum

class Transacoes(Base):
    __tablename__ = "transacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    descricao: Mapped[str] = mapped_column(String(100))
    valor: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    senha_hash: Mapped[str] = mapped_column(String(255))
    data: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"))
    categoria: Mapped["Categorias"] = relationship(back_populates="transacoes")

    transacao_id: Mapped[TipoTransacaoEnum] = mapped_column(Integer, ForeignKey("tipo_transacoes.id"))
    tipo_transacao: Mapped["TipoTransacoes"] = relationship(back_populates="transacoes")    