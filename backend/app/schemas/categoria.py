from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from app.enums.tipoCategoriaEnum import TipoCategoriaEnum


class CriarCategoria(BaseModel):
    nome: str               = Field(..., min_length=2, max_length=100)
    tipo: TipoCategoriaEnum = Field(TipoCategoriaEnum.DESPESA)
    cor:  Optional[str]     = Field(None, max_length=7)


class AtualizarCategoria(BaseModel):
    nome: Optional[str]               = Field(None, min_length=2, max_length=100)
    tipo: Optional[TipoCategoriaEnum] = None
    cor:  Optional[str]               = Field(None, max_length=7)


class CategoriaResposta(BaseModel):
    id:          int
    nome:        str
    empresa_id:  int
    tipo:        TipoCategoriaEnum = Field(TipoCategoriaEnum.DESPESA, validation_alias="tipo_id")
    cor:         Optional[str]     = None
    estaAtivado: bool              = Field(True, validation_alias="esta_ativo")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
