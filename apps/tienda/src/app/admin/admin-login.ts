import { Component, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { PanelEntry } from 'tienda/admin-session';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

/**
 * Ingreso al Panel: correo y contraseña. El acceso con Google llega con el
 * registro del Cliente, donde hay que resolver el enlace de credenciales.
 *
 * Tras autenticar llama a `enterPanel`, que liga la Invitación en el primer
 * ingreso y sella `lastPanelEntryAt`. Si esa llamada falla no se sigue: sin
 * Empleado no hay Panel, y la guarda mandaría de vuelta.
 */
@Component({
  selector: 'tienda-admin-login',
  imports: [Button, InputText],
  template: `
    <div class="lienzo">
      <header class="tope">
        <span class="punto" aria-hidden="true"></span>
        Tienda CR
      </header>

      <main class="centro">
        <h1>Entrá<br />al Panel</h1>

        <div class="campo">
          <label for="correo">Correo</label>
          <input
            pInputText
            id="correo"
            type="email"
            autocomplete="username"
            [value]="email()"
            [disabled]="busy()"
            (input)="email.set($any($event.target).value)"
          />
        </div>

        <div class="campo">
          <label for="contrasena">Contraseña</label>
          <input
            pInputText
            id="contrasena"
            type="password"
            autocomplete="current-password"
            [value]="password()"
            [disabled]="busy()"
            (input)="password.set($any($event.target).value)"
            (keyup.enter)="submit()"
          />
        </div>

        @if (error(); as message) {
          <p role="alert" class="error">{{ message }}</p>
        }

        <div class="accion">
          <p-button
            label="Entrar →"
            [loading]="busy()"
            [disabled]="!email() || !password()"
            (onClick)="submit()"
          />
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
      margin: 0 0 2.5rem;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-size: clamp(2.8rem, 7vw, 4.6rem);
      font-weight: 700;
      letter-spacing: -0.035em;
      line-height: 0.95;
    }
    .campo {
      margin-bottom: 1.75rem;
    }
    label {
      display: block;
      margin-bottom: 0.4rem;
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #8a8177;
    }
    input {
      width: 100%;
      padding: 0.35rem 0;
      border: 0;
      border-bottom: 2px solid #ddd5c9;
      border-radius: 0;
      background: transparent;
      color: var(--tinta);
      font-size: 1.15rem;
      transition: border-color 0.15s;
    }
    input:focus {
      outline: 0;
      border-bottom-color: var(--acento);
      box-shadow: none;
    }
    .error {
      margin: 0 0 1.75rem;
      padding-left: 0.9rem;
      border-left: 2px solid var(--acento);
      color: var(--acento);
      font-size: 0.88rem;
    }
    .accion {
      display: flex;
      justify-content: flex-end;
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
        margin-bottom: 2rem;
      }
      .accion {
        justify-content: stretch;
      }
      .accion ::ng-deep .p-button {
        width: 100%;
        justify-content: center;
      }
    }
  `,
})
export class AdminLogin {
  private readonly auth = inject(Auth);
  private readonly panelEntry = inject(PanelEntry);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);

    try {
      await signInWithEmailAndPassword(this.auth, this.email(), this.password());
      const status = await this.panelEntry.enter();
      // Quien todavía no es Activo no tiene Panel que ver; la guarda lo
      // mandaría igual, pero así no parpadea.
      await this.router.navigate([status === 'active' ? '/admin' : '/admin/sin-acceso']);
    } catch {
      // Un mensaje único: distinguir «no existe» de «contraseña incorrecta»
      // le diría a un atacante qué correos son Empleados.
      this.error.set('No pudimos iniciar sesión. Revisá el correo y la contraseña.');
    } finally {
      this.busy.set(false);
    }
  }
}
