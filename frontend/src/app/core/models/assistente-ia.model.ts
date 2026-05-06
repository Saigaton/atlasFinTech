export interface MensagemChat {
  papel:    'usuario' | 'assistente';
  conteudo: string;
  hora:     string;
}

export interface SugestaoChat {
  icone: string;
  texto: string;
}
