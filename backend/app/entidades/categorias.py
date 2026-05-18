from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base


class Categorias(Base):
    __tablename__ = "categorias"

    id:         Mapped[int]           = mapped_column(primary_key=True)
    nome:       Mapped[str]           = mapped_column(String(100))
    cor:        Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    esta_ativo: Mapped[bool]          = mapped_column(Boolean, default=True)

    tipo_id: Mapped[int] = mapped_column(Integer, ForeignKey("tipo_categorias.id"), default=1)
    tipo_categoria: Mapped["TipoCategorias"] = relationship(back_populates="categorias")

    empresa_id: Mapped[int]      = mapped_column(ForeignKey("empresas.id"))
    empresa:    Mapped["Empresas"] = relationship(back_populates="categorias")

    transacoes: Mapped[list["Transacoes"]] = relationship(back_populates="categoria")
