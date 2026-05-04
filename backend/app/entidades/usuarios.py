from datetime import datetime
from sqlalchemy import Boolean, Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base

class Usuarios(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    esta_ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    esta_verificado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    data_criacao: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    conta: Mapped["Contas"] = relationship(back_populates="usuario")
    tokens_reset: Mapped[list["TokenResetSenha"]] = relationship(back_populates="usuario")