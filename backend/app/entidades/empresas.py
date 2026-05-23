from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
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

    usuario_id:   Mapped[int]           = mapped_column(ForeignKey("usuarios.id"), nullable=False, unique=True)
    usuario:      Mapped["Usuarios"]    = relationship(back_populates="empresa")

    # Relacionamentos
    contas:               Mapped[List["Contas"]]           = relationship(back_populates="empresa", cascade="all, delete-orphan")
    categorias:           Mapped[List["Categorias"]]       = relationship(back_populates="empresa", cascade="all, delete-orphan")
    transacoes:           Mapped[List["Transacoes"]]       = relationship(back_populates="empresa", cascade="all, delete-orphan")
    contas_pagar:         Mapped[List["ContasPagar"]]      = relationship(back_populates="empresa", cascade="all, delete-orphan")
    contas_receber:       Mapped[List["ContasReceber"]]    = relationship(back_populates="empresa", cascade="all, delete-orphan")
    agendamento_relatorio: Mapped[Optional["AgendamentosRelatorio"]] = relationship(back_populates="empresa", uselist=False, cascade="all, delete-orphan")