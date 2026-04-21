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
  is_active:   boolean;
  is_verified: boolean;
  created_at:  string;
}

/** Resposta completa de autenticação (login e cadastro) */
export interface TokenResponse {
  access_token:  string;
  refresh_token: string;
  token_type:    string;
  expires_in:    number;
  user:          Usuario;
}

/** Resposta de renovação de token (apenas o novo access token) */
export interface AccessTokenResponse {
  access_token: string;
  token_type:   string;
  expires_in:   number;
}

/** Payload de login */
export interface LoginRequest {
  email:    string;
  password: string;
}

/** Payload de cadastro */
export interface RegisterRequest {
  name:             string;
  email:            string;
  company:          string;
  password:         string;
  confirm_password: string;
}

/** Resposta genérica de operações sem retorno de dados */
export interface MessageResponse {
  message: string;
  success: boolean;
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
