import { Route } from '@angular/router';
import { StorefrontShell } from './storefront-shell';

export const storefrontRoutes: Route[] = [
  {
    path: '',
    component: StorefrontShell,
    children: [],
  },
];
