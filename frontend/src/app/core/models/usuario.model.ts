export enum TipoUsuario {
  Usuario = 0,
  Administrador = 1
}

export enum TipoMoeda {
  BRL = 0,
  USD = 1,
  EUR = 3
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipoConta: TipoUsuario;
  moedaPadrao: TipoMoeda;
  formatoData: string;
  fusoHorario: string;
  dataCriacao: string;
  estaVerificado: boolean;
}

export interface Empresa {
  id:         number;
  nome:       string;
  estaAtivo:  boolean;
  dataCricao: string;
}
