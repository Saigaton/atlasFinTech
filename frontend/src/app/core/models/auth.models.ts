/**
 * Interfaces TypeScript do domínio de autenticação — Atlas FinTech.
 * Espelham os schemas Pydantic do backend para garantir consistência de tipos.
 */

/** Dados do usuário retornados pela API */
export interface Usuario {
  id:          number;
  nome:        string;
  email:       string;
  nomeEmpresa:     string | null;
  estaAtivo:   boolean;
  estaVerificado: boolean;
  dataCriacao:  Date;
}

/** Resposta completa de autenticação (login e cadastro) */
export interface RespostaToken {
  access_token:  string;
  refresh_token: string;
  token_type:    string;
  expires_in:    number;
  usuario:          Usuario;
}

/** Resposta de renovação de token (apenas o novo access token) */
export interface AccessTokenResponse {
  access_token: string;
  token_type:   string;
  expires_in:   number;
}

/** Payload de login */
export interface RequisicaoLoginUsuario {
  email:    string;
  senha:    string;
}

/** Payload de cadastro */
export interface RequisicaoRegistroUsuario {
  nome:             string;
  email:            string;
  nomeEmpresa:      string;
  senha:            string;
  confirmarSenha:   string;
}

/** Resposta genérica de operações sem retorno de dados */
export interface MensagemResposta {
  mensagem: string;
  sucesso: boolean;
}

/** Estrutura de erro retornado pela API FastAPI */
export interface ApiError {
  detail: string;
}

/**
 * Rotas disponíveis após login bem-sucedido.
 * Centralizado aqui para que AuthService.POST_LOGIN_ROUTE seja type-safe.
 * Adicione novas rotas conforme o sistema cresce.
 */
export type PostLoginRoute = '/dashboard' | '/transactions' | '/reports';
