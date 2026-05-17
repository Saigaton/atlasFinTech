import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CpfCnpjValidator {
  static validar(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Campo vazio é válido (use Validators.required se obrigatório)
      }

      const valor = control.value.replace(/\D/g, '');

      if (valor.length === 11) {
        return this.validarCPF(valor) ? null : { cpfInvalido: true };
      } else if (valor.length === 14) {
        return this.validarCNPJ(valor) ? null : { cnpjInvalido: true };
      } else {
        return { formatoInvalido: true };
      }
    };
  }

  private static validarCPF(cpf: string): boolean {
    // Remove sequências repetidas (000.000.000-00 é inválido)
    if (/^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    // Calcula primeiro dígito verificador
    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    // Calcula segundo dígito verificador
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  private static validarCNPJ(cnpj: string): boolean {
    // Remove sequências repetidas
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    // Calcula primeiro dígito verificador
    let tamanho: number = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    // Calcula segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
  }
}