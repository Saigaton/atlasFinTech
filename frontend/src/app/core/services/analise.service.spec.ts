import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AnaliseService } from './analise.service';

const API  = 'http://localhost:8000/api/v1';
const EID  = 6;
const BASE = `${API}/empresas/${EID}/analises`;

function mockApi<T>(conteudo: T) {
  return { sucesso: true, conteudo, mensagem: 'OK' };
}

describe('AnaliseService', () => {
  let service: AnaliseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AnaliseService],
    });
    service = TestBed.inject(AnaliseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obterFluxoCaixa() deve GET com param meses_frente padrão 3', (done) => {
    const mockFluxo = { entradas: [], saidas: [], saldo: [] } as any;
    service.obterFluxoCaixa(EID).subscribe(res => {
      expect(res).toEqual(mockFluxo);
      done();
    });
    const req = http.expectOne(r => r.url === `${BASE}/fluxo-caixa`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('meses_frente')).toBe('3');
    req.flush(mockApi(mockFluxo));
  });

  it('obterFluxoCaixa() deve aceitar mesesAFrente customizado', (done) => {
    const mockFluxo = { entradas: [], saidas: [], saldo: [] } as any;
    service.obterFluxoCaixa(EID, 6).subscribe(() => done());
    const req = http.expectOne(r => r.url === `${BASE}/fluxo-caixa`);
    expect(req.request.params.get('meses_frente')).toBe('6');
    req.flush(mockApi(mockFluxo));
  });

  it('obterAnaliseFinanceira() deve GET sem params opcionais', (done) => {
    const mockAnalise = { totalReceitas: 5000, totalDespesas: 3000, lucro: 2000 } as any;
    service.obterAnaliseFinanceira(EID).subscribe(res => {
      expect(res).toEqual(mockAnalise);
      done();
    });
    const req = http.expectOne(`${BASE}/analise-financeira`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi(mockAnalise));
  });

  it('obterAnaliseFinanceira() deve incluir mes e ano quando informados', (done) => {
    const mockAnalise = { totalReceitas: 1000, totalDespesas: 500, lucro: 500 } as any;
    service.obterAnaliseFinanceira(EID, 2, 2024).subscribe(() => done());
    const req = http.expectOne(r => r.url === `${BASE}/analise-financeira`);
    expect(req.request.params.get('mes')).toBe('2');
    expect(req.request.params.get('ano')).toBe('2024');
    req.flush(mockApi(mockAnalise));
  });

  it('obterAlertas() deve GET na rota /alertas e retornar array', (done) => {
    const mockAlertas = [{ tipo: 'saldo_baixo', mensagem: 'Saldo crítico' }] as any;
    service.obterAlertas(EID).subscribe(res => {
      expect(res).toEqual(mockAlertas);
      done();
    });
    const req = http.expectOne(`${BASE}/alertas`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi(mockAlertas));
  });

  it('enviarMensagemChat() deve POST na rota /chatbot e retornar resposta', (done) => {
    const mockResposta = { resposta: 'Seu saldo está positivo.' };
    service.enviarMensagemChat(EID, 'Como está meu saldo?').subscribe(res => {
      expect(res).toEqual(mockResposta);
      done();
    });
    const req = http.expectOne(`${BASE}/chatbot`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'Como está meu saldo?' });
    req.flush(mockApi(mockResposta));
  });

  it('obterCalendario() deve GET sem params opcionais', (done) => {
    const mockCalendario = { eventos: [] } as any;
    service.obterCalendario(EID).subscribe(res => {
      expect(res).toEqual(mockCalendario);
      done();
    });
    const req = http.expectOne(`${BASE}/calendario`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi(mockCalendario));
  });

  it('obterCalendario() deve incluir mes e ano quando informados', (done) => {
    const mockCalendario = { eventos: [] } as any;
    service.obterCalendario(EID, 5, 2024).subscribe(() => done());
    const req = http.expectOne(r => r.url === `${BASE}/calendario`);
    expect(req.request.params.get('mes')).toBe('5');
    expect(req.request.params.get('ano')).toBe('2024');
    req.flush(mockApi(mockCalendario));
  });

  it('obterPrevisaoMes() deve GET na rota /previsao', (done) => {
    const mockPrevisao = { receitas: 5000, despesas: 3000 };
    service.obterPrevisaoMes(EID).subscribe(res => {
      expect(res).toEqual(mockPrevisao);
      done();
    });
    const req = http.expectOne(`${BASE}/previsao`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi(mockPrevisao));
  });
});
