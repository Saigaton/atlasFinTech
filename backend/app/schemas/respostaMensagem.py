from typing import Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class RespostaMensagem(BaseModel, Generic[T]):
  mensagem: str
  sucesso: bool = True
  data:    Optional[T]     = None