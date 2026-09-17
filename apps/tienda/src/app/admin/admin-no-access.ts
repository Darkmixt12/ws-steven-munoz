import { Component, computed, inject } from '@angular/core';
import { Auth, sendEmailVerification, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { PanelSessionStore } from 'tienda/admin-session';
import { Button } from 'primeng/button';

/**
 * Explica por qué el Panel no le corresponde a quien sí tiene sesión.
 *
 * Existe porque la regla deja leer el `employees/{uid}` propio en cualquier
 * estado, así que se puede decir el motivo en vez de rebotar en silencio.
 */
@Component({
  selector: 'tienda-admin-no-access',
  imports: [Button],
  template: `
    <div class="lienzo">
      <header class="tope">
        <span class="punto" aria-hidden="true"></span>
        Tienda CR
      </header>

      <main class="centro">
        <h1>Sin acceso<br />al Panel</h1>

        <p class="motivo">{{ reason() }}</p>

        <div class="accion">
          @if (needsVerification()) {
            <p-button
              label="Reenviar la verificación"
              severity="secondary"
              (onClick)="resendVerification()"
            />
          }

          <p-button label="Cerrar sesión →" (onClick)="leave()" />
        </div>
      </main>

      <footer class="pie">Acceso restringido a personal autorizado.</footer>
    </div>
  `,
  styles: `
    :host {
      --hueso: #faf7f2;
      --tinta: #14110f;
      --acento: #ff4d2e;
      --p-button-primary-background: transparent;
      --p-button-primary-hover-background: #14110f;
      --p-button-primary-active-background: #14110f;
      --p-button-primary-border-color: #14110f;
      --p-button-primary-hover-border-color: #14110f;
      --p-button-primary-color: #14110f;
      --p-button-primary-hover-color: #faf7f2;
      --p-button-secondary-background: transparent;
      --p-button-secondary-hover-background: transparent;
      --p-button-secondary-active-background: transparent;
      --p-button-secondary-border-color: #ddd5c9;
      --p-button-secondary-hover-border-color: #14110f;
      --p-button-secondary-color: #8a8177;
      --p-button-secondary-hover-color: #14110f;
      --p-button-border-radius: 0;
      --p-button-padding-x: 1.6rem;
      --p-button-padding-y: 0.7rem;
      display: block;
      background: var(--hueso);
      color: var(--tinta);
      font-family: Inter, system-ui, sans-serif;
    }
    .lienzo {
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 2rem;
      min-height: 100dvh;
      padding: 2rem clamp(1.5rem, 8vw, 7rem);
    }
    .tope {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .punto {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--acento);
    }
    .centro {
      width: min(30rem, 100%);
      align-self: center;
    }
    .centro h1 {
      margin: 0 0 1.75rem;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-size: clamp(2.8rem, 7vw, 4.6rem);
      font-weight: 700;
      letter-spacing: -0.035em;
      line-height: 0.95;
    }
    .motivo {
      margin: 0 0 2.5rem;
      padding-left: 0.9rem;
      border-left: 2px solid var(--acento);
      font-size: 1.05rem;
      line-height: 1.5;
    }
    .accion {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .accion ::ng-deep .p-button {
      border-width: 2px;
      font-weight: 500;
      letter-spacing: 0.04em;
    }
    .pie {
      margin: 0;
      color: #a29889;
      font-size: 0.75rem;
      letter-spacing: 0.06em;
    }
    @media (max-width: 720px) {
      .lienzo {
        gap: 1.5rem;
        padding: 1.75rem 1.5rem;
      }
      .centro h1 {
        margin-bottom: 1.5rem;
      }
      .accion {
        flex-direction: column-reverse;
      }
      .accion ::ng-deep .p-button {
        width: 100%;
        justify-content: center;
      }
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
