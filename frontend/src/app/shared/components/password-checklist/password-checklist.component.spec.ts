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

  function setPassword(value: string) {
    fixture.componentRef.setInput('password', value);
    fixture.detectChanges();
  }

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter 4 regras', () => {
    setPassword('');
    expect(component.rules.length).toBe(4);
  });

  it('deve iniciar com todas as regras inválidas', () => {
    setPassword('');
    expect(component.rules.every(r => !r.valid)).toBeTrue();
  });

  it('deve validar mínimo de 8 caracteres', () => {
    setPassword('12345678');
    const rule = component.rules.find(r => r.label.includes('8 caracteres'));
    expect(rule?.valid).toBeTrue();
  });

  it('deve invalidar menos de 8 caracteres', () => {
    setPassword('1234');
    const rule = component.rules.find(r => r.label.includes('8 caracteres'));
    expect(rule?.valid).toBeFalse();
  });

  it('deve validar letra maiúscula', () => {
    setPassword('Abc');
    const rule = component.rules.find(r => r.label.includes('maiúscula'));
    expect(rule?.valid).toBeTrue();
  });

  it('deve invalidar sem letra maiúscula', () => {
    setPassword('abc');
    const rule = component.rules.find(r => r.label.includes('maiúscula'));
    expect(rule?.valid).toBeFalse();
  });

  it('deve validar número', () => {
    setPassword('abc1');
    const rule = component.rules.find(r => r.label === 'Número');
    expect(rule?.valid).toBeTrue();
  });

  it('deve invalidar sem número', () => {
    setPassword('abcdef');
    const rule = component.rules.find(r => r.label === 'Número');
    expect(rule?.valid).toBeFalse();
  });

  it('deve validar caractere especial', () => {
    setPassword('abc@');
    const rule = component.rules.find(r => r.label.includes('especial'));
    expect(rule?.valid).toBeTrue();
  });

  it('deve invalidar sem caractere especial', () => {
    setPassword('abc123');
    const rule = component.rules.find(r => r.label.includes('especial'));
    expect(rule?.valid).toBeFalse();
  });

  it('deve marcar allValid quando todos os critérios são atendidos', () => {
    setPassword('Senha@123');
    expect(component.allValid).toBeTrue();
  });

  it('deve marcar allValid como false quando critérios incompletos', () => {
    setPassword('senha123');
    expect(component.allValid).toBeFalse();
  });
});
