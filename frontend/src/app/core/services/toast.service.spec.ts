import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('deve iniciar com toast invisível', () => {
    expect(service.toast.visible).toBeFalse();
  });

  it('success() deve exibir toast com tipo success', () => {
    service.success('Operação concluída!');
    expect(service.toast).toEqual(jasmine.objectContaining({ message: 'Operação concluída!', type: 'success', visible: true }));
  });

  it('error() deve exibir toast com tipo error', () => {
    service.error('Algo deu errado.');
    expect(service.toast).toEqual(jasmine.objectContaining({ message: 'Algo deu errado.', type: 'error', visible: true }));
  });

  it('info() deve exibir toast com tipo info', () => {
    service.info('Informação.');
    expect(service.toast).toEqual(jasmine.objectContaining({ message: 'Informação.', type: 'info', visible: true }));
  });

  it('show() deve ocultar o toast após a duração padrão', fakeAsync(() => {
    service.show('Mensagem', 'success', 3500);
    expect(service.toast.visible).toBeTrue();

    tick(3500);
    expect(service.toast.visible).toBeFalse();
  }));

  it('show() deve ocultar após duração customizada', fakeAsync(() => {
    service.show('Mensagem', 'info', 1000);
    tick(999);
    expect(service.toast.visible).toBeTrue();
    tick(1);
    expect(service.toast.visible).toBeFalse();
  }));

  it('show() deve cancelar timer anterior ao exibir novo toast', fakeAsync(() => {
    service.show('Primeiro', 'success', 3000);
    tick(2000);
    service.show('Segundo', 'error', 3000);
    tick(2000);
    expect(service.toast.visible).toBeTrue();
    expect(service.toast.message).toBe('Segundo');
    tick(1000);
    expect(service.toast.visible).toBeFalse();
  }));
});
