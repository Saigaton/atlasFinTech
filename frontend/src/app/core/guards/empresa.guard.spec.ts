import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { empresaGuard } from './empresa.guard';
import { EmpresaService } from '../services/empresa.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Empresa } from '../models/usuario.model';

const API = 'http://localhost:8000/api/v1';

const mockEmpresa: Empresa = { id: 1, nome: 'Atlas Corp', documento: '00.000.000/0001-00' } as Empresa;

const fakeRoute = {} as ActivatedRouteSnapshot;
const fakeState = {} as RouterStateSnapshot;

describe('empresaGuard', () => {
  let empresaService: EmpresaService;
  let router: Router;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        EmpresaService,
      ],
    });
    empresaService = TestBed.inject(EmpresaService);
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('deve retornar true imediatamente quando há empresa ativa', async () => {
    spyOn(empresaService, 'ativoId').and.returnValue(1);

    const result = await TestBed.runInInjectionContext(() => empresaGuard(fakeRoute, fakeState));

    expect(result).toBeTrue();
    http.expectNone(`${API}/empresas`);
  });

  it('deve carregar empresas, definir ativo e retornar true', async () => {
    spyOnProperty(empresaService, 'ativo', 'get').and.returnValues(null, mockEmpresa);
    spyOn(empresaService, 'ativoId').and.returnValues(null as any, 1 as any);

    const resultPromise = TestBed.runInInjectionContext(() => empresaGuard(fakeRoute, fakeState));

    http.expectOne(`${API}/empresas`).flush({
      sucesso: true, conteudo: [mockEmpresa], mensagem: 'OK',
    });

    const result = await resultPromise;
    expect(result).toBeTrue();
  });

  it('deve navegar para /empresa/nova quando lista retorna vazia', async () => {
    spyOn(empresaService, 'ativoId').and.returnValue(null as any);
    const navigateSpy = spyOn(router, 'navigate');

    const resultPromise = TestBed.runInInjectionContext(() => empresaGuard(fakeRoute, fakeState));

    http.expectOne(`${API}/empresas`).flush({
      sucesso: true, conteudo: [], mensagem: 'OK',
    });

    const result = await resultPromise;
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/empresa/nova']);
  });

  it('deve navegar para /empresa/nova quando a requisição falha', async () => {
    spyOn(empresaService, 'ativoId').and.returnValue(null as any);
    const navigateSpy = spyOn(router, 'navigate');

    const resultPromise = TestBed.runInInjectionContext(() => empresaGuard(fakeRoute, fakeState));

    http.expectOne(`${API}/empresas`).flush('Erro', { status: 500, statusText: 'Server Error' });

    const result = await resultPromise;
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/empresa/nova']);
  });
});
