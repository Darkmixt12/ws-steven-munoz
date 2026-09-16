import { Route } from '@angular/router';
import { panelAccessGuard } from 'tienda/admin-session';
import { AdminShell } from './admin-shell';
import { AdminLogin } from './admin-login';
import { AdminNoAccess } from './admin-no-access';

/**
 * El ingreso y la pantalla de «sin acceso» van antes de la ruta vacía y fuera
 * de la guarda: si estuvieran detrás, quien no puede entrar no tendría a dónde
 * ser mandado.
 */
export const adminRoutes: Route[] = [
  {
    path: 'login',
    component: AdminLogin,
  },
  {
    path: 'sin-acceso',
    component: AdminNoAccess,
  },
  {
    path: '',
    component: AdminShell,
    canActivate: [panelAccessGuard],
    children: [],
  },
];
