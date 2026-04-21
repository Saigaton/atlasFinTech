export enum SituacaoReceber {
  Pendente = 0,
  Recebido = 3,
  Atrasado = 2
}

export interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  dataRecebimento?: Date;
  status: SituacaoReceber;
  categoria?: string;
  cliente?: string;
}
