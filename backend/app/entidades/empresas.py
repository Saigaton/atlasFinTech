import datetime
from time import timezone
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Integer, String
from app.configuracoes.database import Base

from sqlalchemy.orm import Mapped, mapped_column, relationship


class Empresas(Base):
    __tablename__ = "empresas"

    id:           Mapped[int]           = mapped_column(Integer, primary_key=True, index=True)
    nome:         Mapped[str]           = mapped_column(String(120), nullable=False)
    documento:    Mapped[Optional[str]] = mapped_column(String(20),  nullable=True)   # CNPJ/CPF
    ativo:        Mapped[bool]          = mapped_column(Boolean, default=True)

    criado_em:    Mapped[datetime] = mapped_column(DateTime(timezone=True),
                     default=lambda: datetime.now(timezone.utc))
    atualizado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                     default=lambda: datetime.now(timezone.utc),
                     onupdate=lambda: datetime.now(timezone.utc))

    # Relacionamentos
    contas:       Mapped[List["Conta"]]        = relationship(back_populates="empresa", cascade="all, delete-orphan")
    categorias:   Mapped[List["Categoria"]]    = relationship(back_populates="empresa", cascade="all, delete-orphan")
    transacoes:   Mapped[List["Transacao"]]    = relationship(back_populates="empresa", cascade="all, delete-orphan")