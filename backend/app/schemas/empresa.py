from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional

class CriarEmpresa(BaseModel):
    nome:      str           = Field(..., min_length=2, max_length=120)
    documento: Optional[str] = Field(None, max_length=20)

    @field_validator("documento")
    @classmethod
    def validar_documento(cls, v: Optional[str]) -> Optional[str]:
        """Valida formato básico de CNPJ (XX.XXX.XXX/XXXX-XX) ou CPF (XXX.XXX.XXX-XX)."""
        if v is None:
            return v
        
        # Remove caracteres não numéricos
        digitos = "".join(c for c in v if c.isdigit())
        
        if len(digitos) not in (11, 14):
            raise ValueError(
                "Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos). "
                f"Recebido: {len(digitos)} dígitos."
            )
        return v
    
class EmpresaResposta(BaseModel):
    id:           int
    usuario_id:   int
    nome:         str
    documento:    Optional[str]
    ativo:        bool
    criado_em:    datetime

    model_config = ConfigDict(from_attributes=True)