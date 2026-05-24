import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ContaReceberService } from './conta-receber.service';
import { ContaReceber } from '../models/conta-receber.model';

const API  = 'http://localhost:8000/api/v1';
const EID  = 2;
const BASE = `${API}/empresas/${EID}/contas-receber`;

const mockContaReceber: ContaReceber = {
  id: 20, descricao: 'Fatura cliente', valor: 3000, situacao_id: 0,
  data_vencimento: '2024-03-15',
} as unknown as ContaReceber;

function mockApi<T>(conteudo: T) {
  return { sucesso: true, conteudo, mensagem: 'OK' };
}

function mockPaginada<T>(conteudo: T[]) {
  return { sucesso: true, conteudo, mensagem: 'OK', total: 1, pagina: 1, por_pagina: 20, paginas: 1 };
}

describe('ContaReceberService', () => {
  let service: ContaReceberService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ContaReceberService],
    });
    service = TestBed.inject(ContaReceberService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarContasReceber() deve GET e retornar RespostaPaginada', (done) => {
    service.listarContasReceber(EID).subscribe(res => {
      expect(res.conteudo).toEqual([mockContaReceber]);
      done();
    });
    http.expectOne(BASE).flush(mockPaginada([mockContaReceber]));
  });

  it('listarContasReceber() deve passar query params de filtro', (done) => {
    service.listarContasReceber(EID, { status: '1', pesquisa: 'fatura' }).subscribe(() => done());
    const req = http.expectOne(r => r.url === BASE);
    expect(req.request.params.get('status')).toBe('1');
    expect(req.request.params.get('pesquisa')).toBe('fatura');
    req.flush(mockPaginada([]));
  });

  it('criarContaReceber() deve POST e retornar ContaReceber', (done) => {
    service.criarContaReceber(EID, { descricao: 'Nova', valor: 500 } as any).subscribe(res => {
      expect(res).toEqual(mockContaReceber);
      done();
    });
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockApi(mockContaReceber));
  });

  it('atualizarContaReceber() deve PUT na URL correta', (done) => {
    service.atualizarContaReceber(EID, 20, { descricao: 'Atualizada' } as any).subscribe(res => {
      expect(res).toEqual(mockContaReceber);
      done();
    });
    const req = http.expectOne(`${BASE}/20`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockApi(mockContaReceber));
  });

  it('receberContaReceber() deve POST na rota /receber', (done) => {
    const recebimento = { contaId: 1, dataRecebimento: '2024-03-10' } as any;
    service.receberContaReceber(EID, 20, recebimento).subscribe(res => {
      expect(res).toEqual(mockContaReceber);
      done();
    });
    const req = http.expectOne(`${BASE}/20/receber`);
    expect(req.request.method).toBe('POST');
    req.flush(mockApi(mockContaReceber));
  });

  it('deletarContaReceber() deve DELETE e retornar null', (done) => {
    service.deletarContaReceber(EID, 20).subscribe(res => {
      expect(res).toBeNull();
      done();
    });
    const req = http.expectOne(`${BASE}/20`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockApi(null));
  });

  it('obterResumoContaReceber() deve GET na rota /resumo', (done) => {
    const mockResumo = { totalPendente: 3000, totalRecebido: 0, totalInadimplente: 0 } as any;
    service.obterResumoContaReceber(EID).subscribe(res => {
      expect(res).toEqual(mockResumo);
      done();
    });
    const req = http.expectOne(`${BASE}/resumo`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi(mockResumo));
  });
});
