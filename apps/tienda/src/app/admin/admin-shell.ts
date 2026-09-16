import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Cascarón del Panel. Todavía no monta guardas ni pantallas: quien corta el
 * acceso es la regla de Firestore (ADR 0002), y las pantallas llegan en los
 * tickets siguientes.
 */
@Component({
  selector: 'tienda-admin-shell',
  imports: [RouterOutlet],
  template: `
    <header>
      <h1>Panel</h1>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
})
export class AdminShell {}
