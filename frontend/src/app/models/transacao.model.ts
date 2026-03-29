export interface Transacao {
  id: string;
  contaId: string;
  tipo: 'Receita' | 'Despesa';
  descricao: string;
  valor: number;
  data: Date;
  categoria?: string;
}
