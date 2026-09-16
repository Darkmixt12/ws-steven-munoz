import { Route } from '@angular/router';
import { AdminShell } from './admin-shell';

export const adminRoutes: Route[] = [
  {
    path: '',
    component: AdminShell,
    children: [],
  },
];
