export enum SituacaoReceber {
  Pendente  = 0,
  Atrasado  = 2,
  Recebido  = 3,
  Cancelado = 4,
}

export interface ContaReceber {
  id:               number;
  descricao:        string;
  valor:            number;
  dataVencimento:   string;
  dataRecebimento?: string;
  situacao:         SituacaoReceber;
  nomeCategoria?:   string;
  corCategoria?:    string;
  cliente?:         string;
  contaId?:         number;
  categoriaId?:     number;
  diasAtraso:       number;
  notas?:           string;
}

export interface ResumoContasAReceber {
  pendente:  number;
  atrasado:  number;
  recebido:  number;
  cancelado: number;
}

export interface RequisicaoRecebimento {
  contaId:         number;
  dataRecebimento: string;
  valor?:          number;
}
