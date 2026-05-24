import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ContaPagarService } from './conta-pagar.service';
import { ContaPagar } from '../models/conta-pagar.model';

const API  = 'http://localhost:8000/api/v1';
const EID  = 2;
const BASE = `${API}/empresas/${EID}/contas-pagar`;

const mockContaPagar: ContaPagar = {
  id: 10, descricao: 'Aluguel', valor: 1200, situacao_id: 0,
  data_vencimento: '2024-02-10',
} as unknown as ContaPagar;

function mockApi<T>(conteudo: T) {
  return { sucesso: true, conteudo, mensagem: 'OK' };
}

function mockPaginada<T>(conteudo: T[]) {
  return { sucesso: true, conteudo, mensagem: 'OK', total: 1, pagina: 1, por_pagina: 20, paginas: 1 };
}

describe('ContaPagarService', () => {
  let service: ContaPagarService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ContaPagarService],
    });
    service = TestBed.inject(ContaPagarService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarContasPagar() deve GET sem params e retornar RespostaPaginada', (done) => {
    service.listarContasPagar(EID).subscribe(res => {
      expect(res.conteudo).toEqual([mockContaPagar]);
      expect(res.total).toBe(1);
      done();
    });
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush(mockPaginada([mockContaPagar]));
  });

  it('listarContasPagar() deve incluir query params de filtro', (done) => {
    service.listarContasPagar(EID, { status: '0', page: 2, per_page: 10 }).subscribe(() => done());
    const req = http.expectOne(r => r.url === BASE);
    expect(req.request.params.get('status')).toBe('0');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('per_page')).toBe('10');
    req.flush(mockPaginada([]));
  });

  it('criarContaPagar() deve POST e retornar array de ContaPagar', (done) => {
    const payload = { descricao: 'Internet', valor: 100, data_vencimento: '2024-02-01', total_parcelas: 1 } as any;
    service.criarContaPagar(EID, payload).subscribe(res => {
      expect(res).toEqual([mockContaPagar]);
      done();
    });
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockApi([mockContaPagar]));
  });

  it('atualizarContaPagar() deve PUT na URL correta', (done) => {
    service.atualizarContaPagar(EID, 10, { descricao: 'Aluguel atualizado' } as any).subscribe(res => {
      expect(res).toEqual(mockContaPagar);
      done();
    });
    const req = http.expectOne(`${BASE}/10`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockApi(mockContaPagar));
  });

  it('pagarContaPagar() deve POST na rota /pagar', (done) => {
    const pagamento = { contaId: 1, dataPagamento: '2024-02-05' } as any;
    service.pagarContaPagar(EID, 10, pagamento).subscribe(res => {
      expect(res).toEqual(mockContaPagar);
      done();
    });
    const req = http.expectOne(`${BASE}/10/pagar`);
    expect(req.request.method).toBe('POST');
    req.flush(mockApi(mockContaPagar));
  });

  it('deletarContaPagar() deve DELETE e retornar null', (done) => {
    service.deletarContaPagar(EID, 10).subscribe(res => {
      expect(res).toBeNull();
      done();
    });
    const req = http.expectOne(`${BASE}/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockApi(null));
  });

  it('obterResumoContaPagar() deve GET na rota /resumo', (done) => {
    const mockResumo = { totalPendente: 1200, totalVencido: 0, totalPago: 0 } as any;
    service.obterResumoContaPagar(EID).subscribe(res => {
      expect(res).toEqual(mockResumo);
      done();
    });
    const req = http.expectOne(`${BASE}/resumo`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi(mockResumo));
  });
});
