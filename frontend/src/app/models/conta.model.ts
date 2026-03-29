export interface Conta {
  id: string;
  nome: string;
  tipo: 'Banco' | 'Caixa' | 'Cartão de Crédito' | 'Poupança';
  saldoInicial: number;
  saldoAtual: number;
  descricao?: string;
  dataCriacao: Date;
}
