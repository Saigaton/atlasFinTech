from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.configuracoes.database import Base

class TipoContas(Base):
    __tablename__ = "tipo_contas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100))

    conta: Mapped["Contas"] = relationship(back_populates="tipo_conta")