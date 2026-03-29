export interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  categoria?: string;
}
