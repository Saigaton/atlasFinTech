export interface Usuario {
  id: string;
  nome: string;
  email: string;
  dataCriacao: string;
  estaVerificado: boolean;
}

export interface Empresa {
  id:          number;
  nome:        string;
  documento?:  string;
  estaAtivo:   boolean;
  dataCricao:  string;
}
