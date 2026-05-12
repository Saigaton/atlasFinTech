from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class CriarCategoria(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)


class AtualizarCategoria(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=100)


class CategoriaResposta(BaseModel):
    id:         int
    nome:       str
    empresa_id: int

    model_config = ConfigDict(from_attributes=True)
