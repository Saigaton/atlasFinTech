export enum SituacaoReceber {
  Pendente   = 0,
  Recebido   = 1,
  Atrasado   = 2,
}

export interface ContaReceber {
  id:               number;
  empresa_id:       number;
  descricao:        string;
  valor:            number;
  data_vencimento:  string;
  data_recebimento?: string;
  situacao_id:      SituacaoReceber;
  notas?:           string;
  cliente?:         string;
  conta?:           { id: number; nome: string };
  categoria?:       { id: number; nome: string; cor?: string };
}

export interface CriarContaReceberDto {
  descricao:       string;
  valor:           number;
  data_vencimento: string;
  conta_id?:       number | null;
  categoria_id?:   number | null;
  cliente?:        string | null;
  notas?:          string | null;
}

export interface AtualizarContaReceberDto {
  descricao?:       string;
  valor?:           number;
  data_vencimento?: string;
  conta_id?:        number | null;
  categoria_id?:    number | null;
  cliente?:         string | null;
  notas?:           string | null;
}

export interface ResumoContasAReceber {
  total_pendente:      number;
  total_recebido:      number;
  total_atrasado:      number;
  quantidade_pendente: number;
  quantidade_recebido: number;
  quantidade_atrasado: number;
}

export interface RequisicaoRecebimento {
  contaId:         number;
  dataRecebimento: string;
  valor?:          number;
}
