import { Component, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { PanelEntry } from 'tienda/admin-session';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
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
  imports: [Button, Card, InputText],
  template: `
    <main class="login">
      <p-card header="Panel">
        <label for="correo">Correo</label>
        <input
          pInputText
          id="correo"
          type="email"
          autocomplete="username"
          [value]="email()"
          (input)="email.set($any($event.target).value)"
        />

        <label for="contrasena">Contraseña</label>
        <input
          pInputText
          id="contrasena"
          type="password"
          autocomplete="current-password"
          [value]="password()"
          (input)="password.set($any($event.target).value)"
          (keyup.enter)="submit()"
        />

        @if (error(); as message) {
          <p role="alert" class="error">{{ message }}</p>
        }

        <p-button
          label="Entrar"
          [loading]="busy()"
          [disabled]="!email() || !password()"
          (onClick)="submit()"
        />
      </p-card>
    </main>
  `,
  styles: `
    .login {
      display: grid;
      place-items: center;
      min-height: 100dvh;
      padding: 1rem;
    }
    label {
      display: block;
      margin-block: 0.75rem 0.25rem;
    }
    input {
      width: 100%;
    }
    .error {
      color: var(--p-red-500);
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
