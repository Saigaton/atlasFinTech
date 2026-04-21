export enum TipoTransacao {
  Receita = 0,
  Despesa = 1
}

export interface Transacao {
  id: string;
  contaId: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  data: Date;
  categoria?: string;
}
