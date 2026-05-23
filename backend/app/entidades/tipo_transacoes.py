from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base

class TipoTransacoes(Base):
    __tablename__ = "tipo_transacoes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100))

    transacoes: Mapped[["Transacoes"]] = relationship("Transacoes", back_populates="tipo_transacao")