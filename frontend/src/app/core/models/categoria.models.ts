export enum TipoCategoria {
    Receita = 0,
    Despesa = 1,
    Ambos = 2
}

export interface Categoria {
  id:          number;
  empresa_id:  number;
  nome:        string;
  tipo:        TipoCategoria;
  cor:         string | null;
  estaAtivado: boolean;
}

export interface CriarCategoria {
  nome: string;
  tipo: TipoCategoria;
  cor?: string | null;
}

export interface AtualizarCategoria {
  nome?: string;
  tipo?: TipoCategoria;
  cor?:  string | null;
}