import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RelatorioService } from './relatorio.service';

const API  = 'http://localhost:8000/api/v1';
const EID  = 1;
const BASE = `${API}/empresas/${EID}/relatorios`;

function mockApi<T>(conteudo: T) {
  return { sucesso: true, conteudo, mensagem: 'OK' };
}

describe('RelatorioService', () => {
  let service: RelatorioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RelatorioService],
    });
    service = TestBed.inject(RelatorioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obterStatusAgendamento() deve GET na rota /agendamento/status', (done) => {
    const mockStatus = { ativo: true, email: 'test@test.com', diaMes: 1, hora: 8 } as any;
    service.obterStatusAgendamento(EID).subscribe(res => {
      expect(res).toEqual(mockStatus);
      done();
    });
    const req = http.expectOne(`${BASE}/agendamento/status`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi(mockStatus));
  });

  it('inscreverEmailPeriodico() deve POST na rota /agendamento/inscrever', (done) => {
    service.inscreverEmailPeriodico(EID, 'user@test.com', 5, 9).subscribe(res => {
      expect(res).toBeUndefined();
      done();
    });
    const req = http.expectOne(`${BASE}/agendamento/inscrever`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@test.com', dia_mes: 5, hora: 9 });
    req.flush(mockApi(null));
  });

  it('cancelarEmailPeriodico() deve DELETE na rota /agendamento/cancelar', (done) => {
    service.cancelarEmailPeriodico(EID).subscribe(res => {
      expect(res).toBeUndefined();
      done();
    });
    const req = http.expectOne(`${BASE}/agendamento/cancelar`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockApi(null));
  });

  it('dispararRelatorioAgora() deve POST na rota /agendamento/disparar', (done) => {
    service.dispararRelatorioAgora(EID, 'user@test.com').subscribe(res => {
      expect(res).toBeUndefined();
      done();
    });
    const req = http.expectOne(`${BASE}/agendamento/disparar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@test.com' });
    req.flush(mockApi(null));
  });

  it('baixarTransacoesCsv() deve GET com responseType blob', (done) => {
    const mockBlob = new Blob(['csv'], { type: 'text/csv' });
    service.baixarTransacoesCsv(EID, 3, 2024).subscribe(res => {
      expect(res).toBeInstanceOf(Blob);
      done();
    });
    const req = http.expectOne(r => r.url === `${BASE}/transacoes/csv`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('mes')).toBe('3');
    expect(req.request.params.get('ano')).toBe('2024');
    req.flush(mockBlob);
  });

  it('baixarContasPagarCsv() deve GET com responseType blob', (done) => {
    const mockBlob = new Blob(['csv']);
    service.baixarContasPagarCsv(EID, 1, 2024).subscribe(res => {
      expect(res).toBeInstanceOf(Blob);
      done();
    });
    const req = http.expectOne(r => r.url === `${BASE}/contas-pagar/csv`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);
  });

  it('baixarContasReceberCsv() deve GET com responseType blob', (done) => {
    const mockBlob = new Blob(['csv']);
    service.baixarContasReceberCsv(EID).subscribe(res => {
      expect(res).toBeInstanceOf(Blob);
      done();
    });
    const req = http.expectOne(r => r.url === `${BASE}/contas-receber/csv`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);
  });

  it('baixarPdf() deve GET na rota /pdf com responseType blob', (done) => {
    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
    service.baixarPdf(EID, 6, 2024).subscribe(res => {
      expect(res).toBeInstanceOf(Blob);
      done();
    });
    const req = http.expectOne(r => r.url === `${BASE}/pdf`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('mes')).toBe('6');
    expect(req.request.params.get('ano')).toBe('2024');
    req.flush(mockBlob);
  });

  it('baixarBackup() deve GET na rota /backup com responseType blob', (done) => {
    const mockBlob = new Blob(['backup']);
    service.baixarBackup(EID).subscribe(res => {
      expect(res).toBeInstanceOf(Blob);
      done();
    });
    const req = http.expectOne(`${BASE}/backup`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);
  });

  it('enviarEmailRelatorio() deve POST na rota /email com params opcionais', (done) => {
    service.enviarEmailRelatorio(EID, 'dest@test.com', 4, 2024).subscribe(res => {
      expect(res).toBeUndefined();
      done();
    });
    const req = http.expectOne(r => r.url === `${BASE}/email`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'dest@test.com' });
    expect(req.request.params.get('mes')).toBe('4');
    expect(req.request.params.get('ano')).toBe('2024');
    req.flush(mockApi(null));
  });

  it('importarExtrato() deve POST com FormData na rota /conciliacao', (done) => {
    const mockResultado = { novos: 5, duplicados: 1, erros: 0 } as any;
    const arquivo = new File(['conteudo'], 'extrato.csv', { type: 'text/csv' });
    service.importarExtrato(EID, arquivo).subscribe(res => {
      expect(res).toEqual(mockResultado);
      done();
    });
    const req = http.expectOne(`${BASE}/conciliacao`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush(mockApi(mockResultado));
  });

  it('dispararDownload() deve criar elemento <a> e acionar clique', () => {
    const blob = new Blob(['dados'], { type: 'text/csv' });
    const createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');
    const revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
    const clickSpy = jasmine.createSpy('click');
    const appendSpy = spyOn(document.body, 'appendChild').and.callFake((el: any) => { el.click = clickSpy; return el; });
    const removeSpy = spyOn(document.body, 'removeChild').and.stub();

    service.dispararDownload(blob, 'relatorio.csv');

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(appendSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
});
