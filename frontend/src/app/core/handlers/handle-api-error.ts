import { HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';

/**
 * Operador RxJS que captura erros HTTP, exibe toast de erro e repropaga o erro.
 *
 * Uso:
 *   this.service.listar(id).pipe(handleApiError(this.toast, 'Erro ao carregar.')).subscribe(...)
 *
 * A mensagem de erro é extraída em cascata:
 *   err.error.erro → err.error.message → err.error.detail → mensagemPadrao
 */
export function handleApiError<T>(
  toast: ToastService,
  mensagemPadrao = 'Ocorreu um erro. Tente novamente.',
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> =>
    source.pipe(
      catchError((err: HttpErrorResponse) => {
        const mensagem =
          err.error?.erro ??
          err.error?.mensagem ??
          err.error?.message ??
          err.error?.detail ??
          mensagemPadrao;
        toast.error(mensagem);
        return throwError(() => err);
      }),
    );
}
