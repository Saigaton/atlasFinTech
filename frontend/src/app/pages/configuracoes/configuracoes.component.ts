import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { Usuario } from '../../core/models/auth.models';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellComponent],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.scss'
})
export class ConfiguracoesComponent implements OnInit {

  perfil: Usuario | null = null;
  salvandoPerfil = false;
  alterandoSenha = false;
  mostrarAtual = false;
  mostrarNova = false;

  formPerfil: FormGroup;
  formSenha: FormGroup;

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private formBuilder: FormBuilder,
  ) {
    this.formPerfil = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.formSenha = this.formBuilder.group({
      senha_atual:          ['', Validators.required],
      nova_senha:           ['', [Validators.required, Validators.minLength(8)]],
      confirmar_nova_senha: ['', Validators.required],
    }, { validators: this._senhasConferem });
  }

  ngOnInit(): void { this._carregarPerfil(); }

  iniciais(): string {
    const nome = this.perfil?.nome ?? '';
    return nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  }

  private _carregarPerfil(): void {
    this.auth.obterPerfil().subscribe({
      next: res => {
        this.perfil = res.data;
        this.formPerfil.patchValue({ nome: res.data.nome });
      },
    });
  }

  salvarPerfil(): void {
    if (this.formPerfil.invalid) { this.formPerfil.markAllAsTouched(); return; }
    this.salvandoPerfil = true;
    this.auth.atualizarPerfil(this.formPerfil.value).subscribe({
      next: res => {
        this.perfil = res.data;
        this.toast.success('Perfil atualizado com sucesso!');
        this.salvandoPerfil = false;
      },
      error: (err: any) => {
        this.toast.error(err.error?.message ?? 'Erro ao atualizar perfil.');
        this.salvandoPerfil = false;
      },
    });
  }

  alterarSenha(): void {
    if (this.formSenha.invalid) { this.formSenha.markAllAsTouched(); return; }
    this.alterandoSenha = true;
    this.auth.alterarSenha(this.formSenha.value).subscribe({
      next: () => {
        this.toast.success('Senha alterada com sucesso!');
        this.formSenha.reset();
        this.alterandoSenha = false;
      },
      error: (err: any) => {
        this.toast.error(err.error?.message ?? 'Erro ao alterar senha.');
        this.alterandoSenha = false;
      },
    });
  }

  private _senhasConferem(group: AbstractControl): { [key: string]: boolean } | null {
    const np = group.get('nova_senha')?.value;
    const cp = group.get('confirmar_nova_senha')?.value;
    return np === cp ? null : { mismatch: true };
  }

  formatarData(iso?: string | Date): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }
}
