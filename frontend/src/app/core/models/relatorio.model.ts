export interface StatusAgendamento {
  inscrito: boolean;
  email:    string | null;
  diaMes:   number | null;
  hora:     number | null;
}

export interface ItemConciliado {
  dataExtrato:  string;
  valorExtrato: number;
  idTransacao:  number;
}

export interface ItemExtrato {
  data:  string;
  valor: number;
}

export interface ItemTransacao {
  id:    number;
  data:  string;
  tipo:  'receita' | 'despesa';
  valor: number;
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
