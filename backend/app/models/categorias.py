from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Categorias(Base):
    __tablename__ = "categorias"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column()
    
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    contas: Mapped[list["contas"]] = relationship(back_populates="categorias")