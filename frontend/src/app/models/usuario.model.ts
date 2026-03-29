export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipoConta: 'Usuário' | 'Administrador';
  moedaPadrao: 'BRL' | 'USD' | 'EUR';
  formatoData: string;
  fusoHorario: string;
}
