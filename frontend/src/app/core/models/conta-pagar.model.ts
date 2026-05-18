export enum SituacaoPagar {
  Pendente = 0,
  Pago     = 1,
  Atrasado = 2,
}

export interface ContaPagar {
  id:              number;
  empresa_id:      number;
  descricao:       string;
  valor:           number;
  data_vencimento: string;
  data_pagamento?: string;
  situacao_id:     SituacaoPagar;
  notas?:          string;
  conta?:          { id: number; nome: string };
  categoria?:      { id: number; nome: string; cor?: string };
}

export interface CriarContaPagarDto {
  descricao:       string;
  valor:           number;
  data_vencimento: string;
  conta_id?:       number | null;
  categoria_id?:   number | null;
  notas?:          string | null;
  total_parcelas:  number;
}

export interface AtualizarContaPagarDto {
  descricao?:       string;
  valor?:           number;
  data_vencimento?: string;
  conta_id?:        number | null;
  categoria_id?:    number | null;
  notas?:           string | null;
}

export interface ResumoContasAPagar {
  total_pendente:      number;
  total_pago:          number;
  total_atrasado:      number;
  quantidade_pendente: number;
  quantidade_pago:     number;
  quantidade_atrasado: number;
}

export interface RequisicaoPagamento {
  contaId:       number;
  dataPagamento: string;
  valorPago?:    number;
}
