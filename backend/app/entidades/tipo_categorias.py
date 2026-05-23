from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base


class TipoCategorias(Base):
    __tablename__ = "tipo_categorias"

    id:   Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100))

    categorias: Mapped[list["Categorias"]] = relationship(back_populates="tipo_categoria")
