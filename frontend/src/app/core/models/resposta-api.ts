export interface RespostaApi<T = unknown> {
  sucesso: boolean;
  conteudo:    T;
  mensagem: string;
}

export interface RespostaPaginada<T = unknown> {
  sucesso:  boolean;
  conteudo:     T[];
  mensagem:  string;
  total:    number;
  pagina:     number;
  por_pagina: number;
  paginas:    number;
}