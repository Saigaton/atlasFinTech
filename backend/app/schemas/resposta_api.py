import math
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class RespostaApi(BaseModel, Generic[T]):
    sucesso:  bool = True
    conteudo: Optional[T] = None
    mensagem: str = ""


class RespostaPaginada(BaseModel, Generic[T]):
    sucesso:    bool = True
    conteudo:   list[T] = []
    mensagem:   str = ""
    total:      int = 0
    pagina:     int = 1
    por_pagina: int = 50
    paginas:    int = 0


def paginado(itens: list, pagina: int, por_pagina: int) -> dict:
    total  = len(itens)
    inicio = (pagina - 1) * por_pagina
    return {
        "sucesso":    True,
        "conteudo":   itens[inicio: inicio + por_pagina],
        "mensagem":   "",
        "total":      total,
        "pagina":     pagina,
        "por_pagina": por_pagina,
        "paginas":    math.ceil(total / por_pagina) if total else 0,
    }
