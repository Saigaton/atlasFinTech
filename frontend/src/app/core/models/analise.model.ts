export interface ProjecaoCaixa {
  rotulo:           string;
  receitaProjetada: number;
  despesaProjetada: number;
  liquido:          number;
  saldoProjetado:   number;
}

export interface DadosFluxoCaixa {
  saldoAtual: number;
  projecao:   ProjecaoCaixa[];
}

export interface AnaliseFinanceira {
  totalReceita:        number;
  crescimentoReceita:  number | null;
  totalDespesa:        number;
  crescimentoDespesa:  number | null;
  lucroLiquido:        number;
  crescimentoLucro:    number | null;
  margemLucro:         number;
  totalTransacoes:     number;
  ticketMedioReceita:  number;
  transacoesReceita:   number;
  ticketMedioDespesa:  number;
  transacoesDespesa:   number;
}

export enum TipoAlerta {
    Perigo = 0,
    Aviso = 1,
    Informacao = 2
}

export interface Alerta {
  tipo:     TipoAlerta;
  titulo:   string;
  mensagem: string;
  rotaAcao: string;
}

export interface ItemAuditoria {
  id:         number;
  criadoEm:   string;
  acao:       string;
  entidade:   string;
  entidadeId: number | null;
  ip:         string | null;
}

export interface PaginaAuditoria {
  total:   number;
  paginas: number;
  itens:   ItemAuditoria[];
}

export interface PagavelCalendario {
  id:       number;
  descricao: string;
  valor:    number;
  situacao: string;
}

export interface RecebivelCalendario {
  id:          number;
  descricao:   string;
  valor:       number;
  situacao:    string;
  nomeCliente?: string;
}

export interface EventoCalendario {
  data:        string;
  pagaveis:    PagavelCalendario[];
  recebiveis:  RecebivelCalendario[];
  totalPagar:  number;
  totalReceber: number;
}

export interface DadosCalendario {
  ano:               number;
  mes:               number;
  rotulo:            string;
  primeiroDiaSemana: number;
  diasNoMes:         number;
  totalPagar:        number;
  totalReceber:      number;
  eventos:           EventoCalendario[];
}
