import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('steven-munoz/dashboard').then(
        (m) => m.stevenMunozDashboardRoutes
      ),
  },
];
