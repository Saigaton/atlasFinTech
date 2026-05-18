from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base


class MetasOrcamentarias(Base):
    __tablename__ = "metas_orcamentarias"

    id:        Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    valor:     Mapped[Decimal]  = mapped_column(Numeric(precision=10, scale=2))
    mes:       Mapped[int]      = mapped_column(Integer, nullable=False)
    ano:       Mapped[int]      = mapped_column(Integer, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    empresa_id:   Mapped[int]          = mapped_column(ForeignKey("empresas.id"), nullable=False)
    empresa:      Mapped["Empresas"]   = relationship(back_populates="metas_orcamentarias")

    categoria_id: Mapped[int]          = mapped_column(ForeignKey("categorias.id"), nullable=False)
    categoria:    Mapped["Categorias"] = relationship()
