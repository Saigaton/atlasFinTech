from pydantic import BaseModel


class RespostaMensagem(BaseModel):
  mensagem: str
  sucesso: bool = True