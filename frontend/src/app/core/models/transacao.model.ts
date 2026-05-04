import { Categoria } from "./categoria.models";
import { Conta } from "./conta.model";

export enum TipoTransacao {
  Receita = 0,
  Despesa = 1,
  Transferencia = 3
}

export enum SituacaoTransacao {
  Pendente = 0,
  Confirmado = 1,
  Cancelado = 2
}

export interface Transacao {
  id: number;
  conta: Conta;
  situacao: SituacaoTransacao;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  data: string;
  recorrencia: string;
  notas: string;
  categoria?: Categoria;
}

export interface FiltroTransacao {
  contaId?:  number;
  categoriaId?: number;
  tipo?:        TipoTransacao;
  situacao?:      SituacaoTransacao;
  inicioData?:   string;
  fimData?:     string;
  pesquisa?:      string;
  pagina?:        number;
  porPagina?:    number;
}
