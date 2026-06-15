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
  mes:      number;
  receitas: number;
  despesas: number;
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

