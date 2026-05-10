from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base

class Categorias(Base):
    __tablename__ = "categorias"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column()
    
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id")) 

    transacoes: Mapped[list["Transacoes"]] = relationship(back_populates="categoria")
    empresa: Mapped["Empresas"] = relationship(back_populates="categorias")