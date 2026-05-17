import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EmpresaService } from '../../core/services/empresa.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { UnsubscriberComponent } from '../../core/unsubscriber.component';
import { Empresa } from '../../core/models/usuario.model';
import { CpfCnpjValidator } from '../../shared/validadores/cpf-cnpj.validator';
import { CpfCnpjMaskDirective } from '../../shared/diretivas/cpf-cnpj-mask.directive';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ThemeToggleComponent, CpfCnpjMaskDirective],
  templateUrl: './empresas.component.html',
  styleUrl: './empresas.component.scss',
})
export class EmpresasComponent extends UnsubscriberComponent implements OnInit {
  carregando = false;
  form!: FormGroup;

  constructor(
    private empresaService: EmpresaService,
    private toast: ToastService,
    private router: Router,
    private formBuilder: FormBuilder,
  ) {
    super();
  }

  ngOnInit(): void {
    this.criarFormulario();
  }

  criarFormulario(): void {
    this.form = this.formBuilder.group({
      nome:      ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      documento: ['', [CpfCnpjValidator.validar()]],
    });
  }

  get nome()      { return this.form.get('nome')!; }
  get documento() { return this.form.get('documento')!; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.carregando = true;

    const documento = (this.form.value.documento as string)?.replace(/\D/g, '') || undefined;
    this.empresaService.criarEmpresa({ nome: this.form.value.nome, documento } as Empresa).subscribe({
      next: () => {
        this.toast.success('Empresa criada! Bem-vindo ao Atlas FinTech.');
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.carregando = false;
        const msg = err.error?.erro ?? 'Erro ao criar empresa.';
        this.toast.error(msg);
      },
    });
  }
}
