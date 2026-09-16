import { Route } from '@angular/router';

/**
 * Dos áreas: la tienda en la raíz y el Panel bajo `/admin` (`admin` es el
 * identificador que `CONTEXT.md` le da al Panel). El área del Panel va primero
 * porque la de la tienda cuelga de la ruta vacía y si no la taparía.
 */
export const appRoutes: Route[] = [
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./storefront/storefront.routes').then((m) => m.storefrontRoutes),
  },
];
