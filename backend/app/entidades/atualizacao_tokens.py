from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.configuracoes.database import Base # Seu Base do SQLAlchemy

class AtualizacaoTokens(Base):
    __tablename__ = "atualizacao_tokens"

    id = Column(Integer, primary_key=True, index=True)
    
    # O 'jti' (JWT ID) é essencial para identificar o token individualmente
    jti = Column(String, unique=True, index=True, nullable=False)
    
    # Chave estrangeira para o seu usuário
    user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    
    # Campo para desabilitar o token
    revogado = Column(Boolean, default=False, nullable=False)
    
    # Auditoria e expiração
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expira_em = Column(DateTime, nullable=False)

    # Relacionamento opcional
    usuario = relationship("Usuarios", back_populates="refresh_tokens")

    @property
    def esta_valido(self):
        """Verifica se o token não foi revogado e não expirou."""
        agora = datetime.now(timezone.utc)
    
        # Se o self.expira_em for naive (sem fuso), force-o para UTC antes de comparar
        expira_em = self.expira_em
        if expira_em.tzinfo is None:
            expira_em = expira_em.replace(tzinfo=timezone.utc)
            
        return not self.revogado and expira_em > agora
