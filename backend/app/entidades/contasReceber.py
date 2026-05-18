from decimal import Decimal
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base
from app.enums.tipoSituacaoContaEnum import TipoSituacaoContaEnum

class ContasReceber(Base):
    __tablename__ = "contas_receber"

    id:               Mapped[int]                = mapped_column(Integer, primary_key=True, index=True)
    descricao:        Mapped[str]                = mapped_column(String(100))
    valor:            Mapped[Decimal]            = mapped_column(Numeric(precision=10, scale=2))
    data_vencimento:  Mapped[datetime]           = mapped_column(DateTime(timezone=True))
    data_recebimento: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notas:            Mapped[Optional[str]]      = mapped_column(String(500), nullable=True)
    cliente:          Mapped[Optional[str]]      = mapped_column(String(100), nullable=True)
    conta_id:     Mapped[Optional[int]]      = mapped_column(ForeignKey("contas.id"), nullable=True)
    conta:        Mapped[Optional["Contas"]] = relationship()

    categoria_id: Mapped[Optional[int]]          = mapped_column(ForeignKey("categorias.id"), nullable=True)
    categoria:    Mapped[Optional["Categorias"]] = relationship()

    situacao_id: Mapped[TipoSituacaoContaEnum] = mapped_column(Integer, ForeignKey("tipo_situacao_conta.id"))
    situacao:    Mapped["TipoSituacaoConta"]   = relationship(back_populates="contas_receber")

    empresa_id:  Mapped[int]        = mapped_column(ForeignKey("empresas.id"), nullable=False)
    empresa:     Mapped["Empresas"] = relationship(back_populates="contas_receber")
