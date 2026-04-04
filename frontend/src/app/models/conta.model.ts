export enum TipoConta {
  Banco = 0,
  CartaoCredito = 1,
  Poupança = 2
}

export interface Conta {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  saldoAtual: number;
  descricao?: string;
  dataCriacao: Date;
}
