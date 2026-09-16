import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Cascarón del área de la tienda. Las pantallas se cuelgan de su `router-outlet`. */
@Component({
  selector: 'tienda-storefront-shell',
  imports: [RouterOutlet],
  template: `
    <header>
      <h1>Tienda CR</h1>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
})
export class StorefrontShell {}
