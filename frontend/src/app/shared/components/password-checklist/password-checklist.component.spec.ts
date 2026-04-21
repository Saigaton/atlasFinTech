import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordChecklistComponent } from './password-checklist.component';

describe('PasswordChecklistComponent', () => {
  let fixture: ComponentFixture<PasswordChecklistComponent>;
  let component: PasswordChecklistComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordChecklistComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(PasswordChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar com todas as regras inválidas', () => {
    component.password = '';
    fixture.detectChanges();
    expect(component.rules().every(r => !r.valid)).toBeTrue();
  });

  it('deve validar mínimo de 8 caracteres', () => {
    component.password = '12345678';
    fixture.detectChanges();
    const rule = component.rules().find(r => r.label.includes('8 caracteres'));
    expect(rule?.valid).toBeTrue();
  });

  it('deve invalidar menos de 8 caracteres', () => {
    component.password = '1234';
    fixture.detectChanges();
    const rule = component.rules().find(r => r.label.includes('8 caracteres'));
    expect(rule?.valid).toBeFalse();
  });

  it('deve validar letra maiúscula', () => {
    component.password = 'Abc';
    fixture.detectChanges();
    const rule = component.rules().find(r => r.label.includes('maiúscula'));
    expect(rule?.valid).toBeTrue();
  });

  it('deve invalidar sem letra maiúscula', () => {
    component.password = 'abc';
    fixture.detectChanges();
    const rule = component.rules().find(r => r.label.includes('maiúscula'));
    expect(rule?.valid).toBeFalse();
  });

  it('deve validar número', () => {
    component.password = 'abc1';
    fixture.detectChanges();
    const rule = component.rules().find(r => r.label === 'Número');
    expect(rule?.valid).toBeTrue();
  });

  it('deve invalidar sem número', () => {
    component.password = 'abcdef';
    fixture.detectChanges();
    const rule = component.rules().find(r => r.label === 'Número');
    expect(rule?.valid).toBeFalse();
  });

  it('deve validar caractere especial', () => {
    component.password = 'abc@';
    fixture.detectChanges();
    const rule = component.rules().find(r => r.label.includes('especial'));
    expect(rule?.valid).toBeTrue();
  });

  it('deve invalidar sem caractere especial', () => {
    component.password = 'abc123';
    fixture.detectChanges();
    const rule = component.rules().find(r => r.label.includes('especial'));
    expect(rule?.valid).toBeFalse();
  });

  it('deve marcar allValid quando todos os critérios são atendidos', () => {
    component.password = 'Senha@123';
    fixture.detectChanges();
    expect(component.allValid).toBeTrue();
  });

  it('deve marcar allValid como false quando critérios incompletos', () => {
    component.password = 'senha123';
    fixture.detectChanges();
    expect(component.allValid).toBeFalse();
  });

  it('deve ter 4 regras', () => {
    expect(component.rules().length).toBe(4);
  });
});
