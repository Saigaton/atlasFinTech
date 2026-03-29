export interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  dataRecebimento?: Date;
  status: 'Pendente' | 'Recebido' | 'Atrasado';
  categoria?: string;
  cliente?: string;
}
