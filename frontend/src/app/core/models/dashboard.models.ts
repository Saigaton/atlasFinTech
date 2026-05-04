export interface DashboardKPI {
  receitaTotal:     number;
  despesaTotal:     number;
  lucroLiquido:     number;
  saldoTotal:       number;
  variacaoReceita:  number | null;
  variacaoDespesa:  number | null;
  variacaoLucro:    number | null;
  periodoLabel:     string;
  inicioPeriodo:    string;
  fimPeriodo:       string;
}

export interface MesGrafico {
  mes:     number;
  receita: number;
  despesa: number;
}

export interface PontoCategoria {
  nome:        string;
  total:       number;
  cor:         string;
  percentual:  number;
  categoriaId: number | null;
}

export interface SegmentoDonut {
  nome:   string;
  cor:    string;
  dash:   number;
  gap:    number;
  offset: number;
}

export interface PrevisaoMes {
  ePositivo:        boolean;
  saldoProjetado:   number;
  receitaProjetada: number;
  despesaProjetada: number;
  diasRestantes:    number;
}

export interface MetaOrcamentaria {
  id:            number;
  corCategoria:  string;
  nomeCategoria: string;
  excedido:      boolean;
  gasto:         number;
  valorMeta:     number;
  percentual:    number;
}

export interface GraficoPorConta {
  contaId:   number;
  nomeConta: string;
  receita:   number;
  despesa:   number;
}
