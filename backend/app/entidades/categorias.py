from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base

class Categorias(Base):
    __tablename__ = "categorias"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column()
    
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))

    transacoes: Mapped[list["Transacoes"]] = relationship(back_populates="categoria")
    contas_receber: Mapped[list["ContasReceber"]] = relationship(back_populates="categoria")
    contas_pagar: Mapped[list["ContasPagar"]] = relationship(back_populates="categoria")