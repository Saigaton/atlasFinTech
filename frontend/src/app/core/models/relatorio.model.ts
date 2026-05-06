export interface StatusAgendamento {
  ativo:              boolean;
  inscrito:           boolean;
  email:              string | null;
  diaMes:             number;
  hora:               number;
  totalDestinatarios: number;
}

export interface ItemConciliado {
  dataExtrato:        string;
  descricaoExtrato:   string;
  valorExtrato:       number;
  idTransacao:        number;
  descricaoTransacao: string;
}

export interface ItemExtrato {
  data:      string;
  descricao: string;
  valor:     number;
}

export interface ItemTransacao {
  id:        number;
  data:      string;
  descricao: string;
  tipo:      'receita' | 'despesa';
  valor:     number;
}

export interface ResultadoConciliacao {
  conciliadas:            number;
  totalSomenteExtrato:    number;
  totalSomenteNosistema:  number;
  totalExtrato:           number;
  itensConciliados:       ItemConciliado[];
  somenteExtrato:         ItemExtrato[];
  somenteNosistema:       ItemTransacao[];
  errosImportacao:        string[];
}
