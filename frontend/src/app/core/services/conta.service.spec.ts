import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ContaService } from './conta.service';
import { Conta } from '../models/conta.model';

const API  = 'http://localhost:8000/api/v1';
const EID  = 3;
const BASE = `${API}/empresas/${EID}/contas`;

const mockConta: Conta = { id: 1, nome: 'Nubank', tipo: 0, saldoAtual: 1000, cor: '#3b82f6' } as Conta;

function mockApi<T>(conteudo: T) {
  return { sucesso: true, conteudo, mensagem: 'OK' };
}

describe('ContaService', () => {
  let service: ContaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ContaService],
    });
    service = TestBed.inject(ContaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarContas() deve GET e retornar array de Conta', (done) => {
    service.listarContas(EID).subscribe(res => {
      expect(res).toEqual([mockConta]);
      done();
    });
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi([mockConta]));
  });

  it('criarConta() deve POST e retornar Conta criada', (done) => {
    service.criarConta(EID, mockConta).subscribe(res => {
      expect(res).toEqual(mockConta);
      done();
    });
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockApi(mockConta));
  });

  it('atualizarConta() deve PUT na URL correta', (done) => {
    service.atualizarConta(EID, 1, mockConta).subscribe(res => {
      expect(res).toEqual(mockConta);
      done();
    });
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockApi(mockConta));
  });

  it('transferirConta() deve POST na rota de transferência', (done) => {
    const dados = { deContaId: 1, paraContaId: 2, valor: 500, descricao: 'Transferência', data: '2024-01-15' };
    service.transferirConta(EID, dados).subscribe(() => done());
    const req = http.expectOne(`${BASE}/transferir`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dados);
    req.flush(mockApi(null));
  });

  it('deletarConta() deve DELETE e retornar null', (done) => {
    service.deletarConta(EID, 1).subscribe(res => {
      expect(res).toBeNull();
      done();
    });
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockApi(null));
  });
});
