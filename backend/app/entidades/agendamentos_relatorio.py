from datetime import datetime, timezone
from sqlalchemy import Boolean, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base


class AgendamentosRelatorio(Base):
    __tablename__ = "agendamentos_relatorio"

    id:        Mapped[int]  = mapped_column(Integer, primary_key=True, index=True)
    email:     Mapped[str]  = mapped_column(String(255), nullable=False)
    dia_mes:   Mapped[int]  = mapped_column(Integer, nullable=False)
    hora:      Mapped[int]  = mapped_column(Integer, nullable=False)
    ativo:     Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    empresa_id: Mapped[int]       = mapped_column(ForeignKey("empresas.id"), nullable=False, unique=True)
    empresa:    Mapped["Empresas"] = relationship(back_populates="agendamento_relatorio")
