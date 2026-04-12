export interface UsuarioAuth {
    id: string;
    nome: string;
    email: string;
    senha?: string;
    dataCriacao: Date;
    ativo: boolean;
  }
  
  export interface LoginRequest {
    email: string;
    senha: string;
  }
  
  export interface LoginResponse {
    usuario: UsuarioAuth;
    token: string;
  }
  