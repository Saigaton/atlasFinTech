from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base

class TipoSituacaoConta(Base):
    __tablename__ = "tipo_situacao_conta"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100))

    contas_receber: Mapped["ContasReceber"] = relationship(back_populates="situacao")
    contas_pagar: Mapped["ContasPagar"] = relationship(back_populates="situacao")