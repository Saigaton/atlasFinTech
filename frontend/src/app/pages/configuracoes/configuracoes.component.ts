import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { PasswordChecklistComponent } from '../../shared/components/password-checklist/password-checklist.component';
import { Usuario } from '../../core/models/auth.models';
import { handleApiError } from '../../core/handlers/handle-api-error';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ShellComponent, PasswordChecklistComponent],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.scss'
})
export class ConfiguracoesComponent implements OnInit {

  perfil: Usuario | null = null;
  salvandoPerfil  = false;
  alterandoSenha  = false;
  definindoSenha  = false;
  mostrarAtual    = false;
  mostrarNova     = false;
  mostrarNovaDef  = false;

  ativarCampoSenha(event: FocusEvent): void {
    (event.target as HTMLInputElement).removeAttribute('readonly');
  }

  formPerfil:       FormGroup;
  formSenha:        FormGroup;
  formDefinirSenha!: FormGroup;

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private formBuilder: FormBuilder,
  ) {
    this.formPerfil = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.formSenha = this.formBuilder.group({
      senhaAtual:     ['', Validators.required],
      novaSenha:      ['', [Validators.required, this._validadorSenhaForte]],
      confirmarSenha: ['', Validators.required],
    }, { validators: this._senhasConferem });

    this.formDefinirSenha = this.formBuilder.group({
      novaSenha:      ['', [Validators.required, this._validadorSenhaForte]],
      confirmarSenha: ['', Validators.required],
    }, { validators: this._senhasConferem });
  }

  ngOnInit(): void { this._carregarPerfil(); }

  iniciais(): string {
    const nome = this.perfil?.nome ?? '';
    return nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  }

  get isGoogleUser(): boolean {
    return !!this.perfil?.criadoViaGoogle;
  }

  private _carregarPerfil(): void {
    this.auth.obterUsuario().subscribe({
      next: res => {
        this.perfil = res;
        this.formPerfil.patchValue({ nome: res.nome });
      },
    });
  }

  salvarPerfil(): void {
    if (this.formPerfil.invalid) { this.formPerfil.markAllAsTouched(); return; }
    this.salvandoPerfil = true;
    this.auth.atualizarPerfil(this.formPerfil.value).pipe(
      handleApiError(this.toast, 'Erro ao atualizar perfil.')
    ).subscribe({
      next: res => {
        this.perfil = res.data;
        this.toast.success('Perfil atualizado com sucesso!');
        this.salvandoPerfil = false;
      },
      error: () => { this.salvandoPerfil = false; },
    });
  }

  alterarSenha(): void {
    if (this.formSenha.invalid) { this.formSenha.markAllAsTouched(); return; }
    this.alterandoSenha = true;
    this.auth.alterarSenha(this.formSenha.value).pipe(
      handleApiError(this.toast, 'Erro ao alterar senha.')
    ).subscribe({
      next: () => {
        this.toast.success('Senha alterada com sucesso!');
        this.formSenha.reset();
        this.alterandoSenha = false;
      },
      error: () => { this.alterandoSenha = false; },
    });
  }

  definirSenha(): void {
    if (this.formDefinirSenha.invalid) { this.formDefinirSenha.markAllAsTouched(); return; }
    this.definindoSenha = true;
    this.auth.definirSenha(this.formDefinirSenha.value).pipe(
      handleApiError(this.toast, 'Erro ao definir senha.')
    ).subscribe({
      next: () => {
        this.toast.success('Senha definida! Agora você pode entrar com e-mail e senha.');
        this.formDefinirSenha.reset();
        this.definindoSenha = false;
        this._carregarPerfil();
      },
      error: () => { this.definindoSenha = false; },
    });
  }

  private _senhasConferem(group: AbstractControl): { [key: string]: boolean } | null {
    const np = group.get('novaSenha')?.value;
    const cp = group.get('confirmarSenha')?.value;
    return np === cp ? null : { mismatch: true };
  }

  private _validadorSenhaForte(control: AbstractControl): ValidationErrors | null {
    const v = control.value ?? '';
    const valid =
      v.length >= 8 &&
      /[A-Z]/.test(v) &&
      /[0-9]/.test(v) &&
      /[^A-Za-z0-9]/.test(v);
    return valid ? null : { passwordStrength: true };
  }

  formatarData(iso?: string | Date): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }
}
