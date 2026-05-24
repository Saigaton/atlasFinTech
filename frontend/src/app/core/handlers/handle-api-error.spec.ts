import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { handleApiError } from './handle-api-error';
import { ToastService } from '../services/toast.service';

describe('handleApiError', () => {
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    toast = jasmine.createSpyObj('ToastService', ['error']);
    TestBed.configureTestingModule({ providers: [{ provide: ToastService, useValue: toast }] });
  });

  function erroHttp(body: object, status = 400): HttpErrorResponse {
    return new HttpErrorResponse({ error: body, status });
  }

  it('deve propagar o valor quando não há erro', (done) => {
    of(42).pipe(handleApiError(toast)).subscribe({
      next: v => { expect(v).toBe(42); done(); },
    });
  });

  it('deve extrair mensagem de err.error.erro', (done) => {
    throwError(() => erroHttp({ erro: 'mensagem via erro' })).pipe(
      handleApiError(toast, 'padrão')
    ).subscribe({ error: () => {
      expect(toast.error).toHaveBeenCalledWith('mensagem via erro');
      done();
    }});
  });

  it('deve extrair mensagem de err.error.mensagem quando erro não existe', (done) => {
    throwError(() => erroHttp({ mensagem: 'msg via mensagem' })).pipe(
      handleApiError(toast, 'padrão')
    ).subscribe({ error: () => {
      expect(toast.error).toHaveBeenCalledWith('msg via mensagem');
      done();
    }});
  });

  it('deve extrair mensagem de err.error.message', (done) => {
    throwError(() => erroHttp({ message: 'msg via message' })).pipe(
      handleApiError(toast, 'padrão')
    ).subscribe({ error: () => {
      expect(toast.error).toHaveBeenCalledWith('msg via message');
      done();
    }});
  });

  it('deve extrair mensagem de err.error.detail', (done) => {
    throwError(() => erroHttp({ detail: 'msg via detail' })).pipe(
      handleApiError(toast, 'padrão')
    ).subscribe({ error: () => {
      expect(toast.error).toHaveBeenCalledWith('msg via detail');
      done();
    }});
  });

  it('deve usar mensagem padrão quando nenhum campo existe', (done) => {
    throwError(() => erroHttp({})).pipe(
      handleApiError(toast, 'Ocorreu um erro genérico.')
    ).subscribe({ error: () => {
      expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro genérico.');
      done();
    }});
  });

  it('deve usar mensagem padrão do operador quando não passada', (done) => {
    throwError(() => erroHttp({})).pipe(
      handleApiError(toast)
    ).subscribe({ error: () => {
      expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro. Tente novamente.');
      done();
    }});
  });

  it('deve propagar o erro após exibir o toast', (done) => {
    const err = erroHttp({ erro: 'falhou' });
    throwError(() => err).pipe(handleApiError(toast, 'padrão')).subscribe({
      error: (e) => { expect(e).toBe(err); done(); },
    });
  });

  it('erro.erro tem prioridade sobre erro.mensagem', (done) => {
    throwError(() => erroHttp({ erro: 'prioritário', mensagem: 'secundário' })).pipe(
      handleApiError(toast, 'padrão')
    ).subscribe({ error: () => {
      expect(toast.error).toHaveBeenCalledWith('prioritário');
      done();
    }});
  });
});
