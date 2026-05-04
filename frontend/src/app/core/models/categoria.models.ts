export enum TipoCategoria {
    Receita = 0,
    Despesa = 1,
    Ambos = 2
}

export interface Categoria {
  id:         number;
  empresaId: number;
  nome:       string;
  tipo:       TipoCategoria;
  cor:      string | null;
  icone:       string | null;
  estaAtivado:  boolean;
  dataCriacao: string;
}