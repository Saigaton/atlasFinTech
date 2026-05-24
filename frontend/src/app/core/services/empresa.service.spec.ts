import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmpresaService } from './empresa.service';
import { Empresa } from '../models/usuario.model';

const API = 'http://localhost:8000/api/v1';

const mockEmpresa: Empresa = { id: 1, nome: 'Empresa Teste', documento: '12345678000199' } as Empresa;

function mockApi<T>(conteudo: T) {
  return { sucesso: true, conteudo, mensagem: 'OK' };
}

describe('EmpresaService', () => {
  let service: EmpresaService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EmpresaService],
    });
    service = TestBed.inject(EmpresaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  // ── criarEmpresa ──────────────────────────────────────────────────────
  it('criarEmpresa() deve POST e retornar Empresa', (done) => {
    service.criarEmpresa(mockEmpresa).subscribe(res => {
      expect(res).toEqual(mockEmpresa);
      done();
    });
    http.expectOne(`${API}/empresas`).flush(mockApi(mockEmpresa));
  });

  it('criarEmpresa() deve definir a empresa como ativa', (done) => {
    service.criarEmpresa(mockEmpresa).subscribe(() => {
      expect(service.ativoId()).toBe(1);
      done();
    });
    http.expectOne(`${API}/empresas`).flush(mockApi(mockEmpresa));
  });

  // ── listarEmpresas ────────────────────────────────────────────────────
  it('listarEmpresas() deve GET e retornar array de Empresa', (done) => {
    service.listarEmpresas().subscribe(res => {
      expect(res).toEqual([mockEmpresa]);
      done();
    });
    http.expectOne(`${API}/empresas`).flush(mockApi([mockEmpresa]));
  });

  it('listarEmpresas() deve definir a primeira empresa como ativa quando não há ativa', (done) => {
    service.listarEmpresas().subscribe(() => {
      expect(service.ativoId()).toBe(1);
      done();
    });
    http.expectOne(`${API}/empresas`).flush(mockApi([mockEmpresa]));
  });

  // ── definirAtivo / limparAtivo ────────────────────────────────────────
  it('definirAtivo() deve setar empresa no localStorage', () => {
    service.definirAtivo(mockEmpresa);
    const salvo = JSON.parse(localStorage.getItem('atlas_empresa')!);
    expect(salvo.id).toBe(1);
  });

  it('limparAtivo() deve remover empresa do localStorage e zerar ativoId', () => {
    service.definirAtivo(mockEmpresa);
    service.limparAtivo();
    expect(service.ativoId()).toBeNull();
    expect(localStorage.getItem('atlas_empresa')).toBeNull();
  });

  it('ativoId() deve retornar null quando não há empresa ativa', () => {
    expect(service.ativoId()).toBeNull();
  });
});
