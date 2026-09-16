import { Component, computed, inject } from '@angular/core';
import { Auth, sendEmailVerification, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { PanelSessionStore } from 'tienda/admin-session';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';

/**
 * Explica por qué el Panel no le corresponde a quien sí tiene sesión.
 *
 * Existe porque la regla deja leer el `employees/{uid}` propio en cualquier
 * estado, así que se puede decir el motivo en vez de rebotar en silencio.
 */
@Component({
  selector: 'tienda-admin-no-access',
  imports: [Button, Card],
  template: `
    <main class="no-access">
      <p-card header="Sin acceso al Panel">
        <p>{{ reason() }}</p>

        @if (needsVerification()) {
          <p-button
            label="Reenviar la verificación"
            severity="secondary"
            (onClick)="resendVerification()"
          />
        }

        <p-button label="Cerrar sesión" (onClick)="leave()" />
      </p-card>
    </main>
  `,
  styles: `
    .no-access {
      display: grid;
      place-items: center;
      min-height: 100dvh;
      padding: 1rem;
    }
    p-button {
      margin-inline-end: 0.5rem;
    }
  `,
})
export class AdminNoAccess {
  private readonly auth = inject(Auth);
  private readonly store = inject(PanelSessionStore);
  private readonly router = inject(Router);

  readonly needsVerification = computed(
    () => this.store.currentUser()?.emailVerified === false
  );

  readonly reason = computed(() => {
    if (this.needsVerification()) {
      return 'Falta verificar tu correo. Abrí el enlace que te enviamos y volvé a entrar.';
    }

    const employee = this.store.employee();
    if (!employee) {
      return 'Esta cuenta no pertenece al Panel. Si esperabas una invitación, pedila a quien administra.';
    }
    if (employee.status === 'invited') {
      return 'Te falta completar tu perfil para activar tu acceso.';
    }
    return 'Tu acceso al Panel está deshabilitado.';
  });

  async resendVerification(): Promise<void> {
    const current = this.store.currentUser();
    if (current) {
      await sendEmailVerification(current);
    }
  }

  async leave(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/admin/login']);
  }
}
