import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransacaoService } from './transacao.service';
import { Transacao } from '../models/transacao.model';

const API  = 'http://localhost:8000/api/v1';
const EID  = 4;
const BASE = `${API}/empresas/${EID}/transacoes`;

const mockTransacao: Transacao = {
  id: 7, descricao: 'Salário', valor: 5000, tipo: 1, situacao: 1,
  data: '2024-01-05',
} as Transacao;

function mockApi<T>(conteudo: T) {
  return { sucesso: true, conteudo, mensagem: 'OK' };
}

function mockPaginada<T>(conteudo: T[]) {
  return { sucesso: true, conteudo, mensagem: 'OK', total: 1, pagina: 1, por_pagina: 20, paginas: 1 };
}

describe('TransacaoService', () => {
  let service: TransacaoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TransacaoService],
    });
    service = TestBed.inject(TransacaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarTransacoes() deve GET e retornar RespostaPaginada', (done) => {
    service.listarTransacoes(EID).subscribe(res => {
      expect(res.conteudo).toEqual([mockTransacao]);
      done();
    });
    http.expectOne(BASE).flush(mockPaginada([mockTransacao]));
  });

  it('listarTransacoes() deve passar filtros como query params', (done) => {
    service.listarTransacoes(EID, { tipo: 1, pesquisa: 'salário' }).subscribe(() => done());
    const req = http.expectOne(r => r.url === BASE);
    expect(req.request.params.get('tipo')).toBe('1');
    expect(req.request.params.get('pesquisa')).toBe('salário');
    req.flush(mockPaginada([]));
  });

  it('criarTransacao() deve POST e retornar Transacao', (done) => {
    service.criarTransacao(EID, { descricao: 'Salário' } as any).subscribe(res => {
      expect(res).toEqual(mockTransacao);
      done();
    });
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockApi(mockTransacao));
  });

  it('atualizarTransacao() deve PUT na URL correta', (done) => {
    service.atualizarTransacao(EID, 7, { descricao: 'Atualizado' } as any).subscribe(res => {
      expect(res).toEqual(mockTransacao);
      done();
    });
    const req = http.expectOne(`${BASE}/7`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockApi(mockTransacao));
  });

  it('deletarTransacao() deve DELETE e retornar null', (done) => {
    service.deletarTransacao(EID, 7).subscribe(res => {
      expect(res).toBeNull();
      done();
    });
    const req = http.expectOne(`${BASE}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockApi(null));
  });

  it('gerarRecorrencia() deve POST na rota /gerar-recorrencia', (done) => {
    service.gerarRecorrencia(EID, 7).subscribe(res => {
      expect(res).toEqual([mockTransacao]);
      done();
    });
    const req = http.expectOne(`${BASE}/7/gerar-recorrencia`);
    expect(req.request.method).toBe('POST');
    req.flush(mockApi([mockTransacao]));
  });

  it('obterKpis() deve GET na rota /dashboard/kpis', (done) => {
    const mockKpi = { totalReceitas: 5000, totalDespesas: 2000, saldo: 3000 } as any;
    service.obterKpis(EID, 1, 2024).subscribe(res => {
      expect(res).toEqual(mockKpi);
      done();
    });
    const req = http.expectOne(r => r.url.includes('/dashboard/kpis'));
    expect(req.request.params.get('mes')).toBe('1');
    expect(req.request.params.get('ano')).toBe('2024');
    req.flush(mockApi(mockKpi));
  });

  it('obterTransacoesRecente() deve GET com param limit', (done) => {
    service.obterTransacoesRecente(EID, 5).subscribe(res => {
      expect(res).toEqual([mockTransacao]);
      done();
    });
    const req = http.expectOne(r => r.url.includes('/dashboard/transacoes-recentes'));
    expect(req.request.params.get('limit')).toBe('5');
    req.flush(mockApi([mockTransacao]));
  });

  it('obterMesGrafico() deve GET na rota /dashboard/grafico', (done) => {
    service.obterMesGrafico(EID, 2024).subscribe(res => {
      expect(res).toEqual([]);
      done();
    });
    const req = http.expectOne(r => r.url.includes('/dashboard/grafico'));
    expect(req.request.params.get('ano')).toBe('2024');
    req.flush(mockApi([]));
  });
});
