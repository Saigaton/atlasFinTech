export enum SituacaoPagar {
  Pendente = 0,
  Pago = 1,
  Atrasado = 2
}

export interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: SituacaoPagar;
  categoria?: string;
}

export interface ResumoContasAPagar {
  pendente:   number;
  atrasado:   number;
  pago:       number;
  cancelado:  number;
}

export interface RequisicaoPagamento {
  contaId:           number;
  dataPagamento:     string;
  valorPago?:        number;
}
