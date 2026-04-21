import {
  HttpInterceptorFn, HttpErrorResponse,
  HttpRequest, HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor HTTP de autenticação — Atlas FinTech.
 *
 * Executado automaticamente em TODA requisição HTTP da aplicação.
 *
 * Responsabilidades:
 * 1. Injetar o Bearer token no header Authorization de cada requisição
 * 2. Capturar erros 401 (token expirado) e tentar renovar via refresh token
 * 3. Se o refresh falhar, fazer logout e redirecionar para o login
 *
 * Fluxo de refresh token:
 *   Requisição → 401 → POST /auth/refresh → nova requisição com novo token
 *   Se /auth/refresh também falhar → logout() → /login
 *
 * Nota: A condição !req.url.includes('/auth/refresh') evita loop infinito
 * caso o próprio endpoint de refresh retorne 401.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Adiciona o token à requisição atual (se existir)
  const token   = auth.getAccessToken();
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Tenta refresh apenas em erros 401 e apenas uma vez (não em /auth/refresh)
      if (err.status === 401 && !req.url.includes('/auth/refresh')) {
        return auth.refreshToken().pipe(
          // Refresh bem-sucedido: repete a requisição original com o novo token
          switchMap(res => next(addToken(req, res.access_token))),
          catchError(() => {
            // Refresh falhou: encerra a sessão e redireciona
            auth.logout();
            router.navigate(['/login']);
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};

/** Clona a requisição adicionando o header Authorization com Bearer token */
function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
