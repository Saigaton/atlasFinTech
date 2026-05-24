import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriaService } from './categoria.service';
import { Categoria, TipoCategoria } from '../models/categoria.models';

const API  = 'http://localhost:8000/api/v1';
const EID  = 5;
const BASE = `${API}/empresas/${EID}/categorias`;

const mockCategoria: Categoria = { id: 1, nome: 'Alimentação', tipo: TipoCategoria.Despesa, cor: '#ef4444' } as unknown as Categoria;

function mockApi<T>(conteudo: T) {
  return { sucesso: true, conteudo, mensagem: 'OK' };
}

describe('CategoriaService', () => {
  let service: CategoriaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CategoriaService],
    });
    service = TestBed.inject(CategoriaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarCategoria() deve GET sem filtro de tipo', (done) => {
    service.listarCategoria(EID).subscribe(res => {
      expect(res).toEqual([mockCategoria]);
      done();
    });
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi([mockCategoria]));
  });

  it('listarCategoria() deve incluir query param tipo quando informado', (done) => {
    service.listarCategoria(EID, TipoCategoria.Despesa).subscribe(res => {
      expect(res).toEqual([mockCategoria]);
      done();
    });
    const req = http.expectOne(`${BASE}?tipo=${TipoCategoria.Despesa}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi([mockCategoria]));
  });

  it('criarCategoria() deve POST e retornar Categoria', (done) => {
    const payload = { nome: 'Transporte', tipo: TipoCategoria.Despesa, cor: null };
    service.criarCategoria(EID, payload).subscribe(res => {
      expect(res).toEqual(mockCategoria);
      done();
    });
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockApi(mockCategoria));
  });

  it('atualizarCategoria() deve PUT e retornar Categoria atualizada', (done) => {
    const payload = { nome: 'Lazer', tipo: TipoCategoria.Despesa, cor: '#3b82f6' };
    service.atualizarCategoria(EID, 1, payload).subscribe(res => {
      expect(res.nome).toBe('Alimentação');
      done();
    });
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockApi(mockCategoria));
  });

  it('deletarCategoria() deve DELETE e retornar null', (done) => {
    service.deletarCategoria(EID, 1).subscribe(res => {
      expect(res).toBeNull();
      done();
    });
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockApi(null));
  });
});
