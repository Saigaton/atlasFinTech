import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresaService } from '../services/empresa.service';

export const empresaGuard: CanActivateFn = async () => {
  const empresa = inject(EmpresaService);
  const router  = inject(Router);

  if (empresa.ativoId()) return true;

  try {
    const lista = await firstValueFrom(empresa.listarEmpresas());
    // listarEmpresas() já chama definirAtivo() na primeira empresa encontrada
    if (empresa.ativoId()) return true;

    if (!lista.length) {
      router.navigate(['/empresa/nova']);
      return false;
    }
  } catch {
    router.navigate(['/empresa/nova']);
    return false;
  }

  router.navigate(['/empresa/nova']);
  return false;
};
