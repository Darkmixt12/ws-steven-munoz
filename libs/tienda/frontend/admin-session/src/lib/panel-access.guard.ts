import { computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, type CanActivateFn } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { PanelSessionStore } from './panel-session.store';

/** Ruta de la pantalla de ingreso; queda fuera de la guarda. */
export const PANEL_LOGIN_ROUTE = '/admin/login';

/** Ruta que explica por qué el Panel no le corresponde a quien tiene sesión. */
export const PANEL_NO_ACCESS_ROUTE = '/admin/sin-acceso';

type Decision = 'pending' | 'allow' | 'login' | 'noAccess';

/**
 * Guarda del Panel.
 *
 * Nunca decide mientras falte información: sin respuesta de Auth o con el
 * Empleado a medio cargar, espera. La lentitud no expulsa a nadie, igual que en
 * `PanelSessionStore.mustExit`.
 *
 * Es solo experiencia de usuario. Quien de verdad corta el acceso es la regla
 * de Firestore ([ADR 0002](../../../../../docs/adr/0002-permisos-del-panel-leyendo-el-empleado.md));
 * por eso la guarda redirige pero jamás cierra la sesión.
 */
export const panelAccessGuard: CanActivateFn = () => {
  const store = inject(PanelSessionStore);
  const router = inject(Router);

  const decision = computed<Decision>(() => {
    const authenticated = store.currentUser();
    // `undefined` es «Auth todavía no contestó», distinto de `null`, que es
    // «no hay sesión».
    if (authenticated === undefined) return 'pending';
    if (authenticated === null) return 'login';
    if (!authenticated.emailVerified) return 'noAccess';

    if (store.isLoading()) return 'pending';
    // La lectura negada por la regla también es falta de acceso.
    if (store.error() !== undefined) return 'noAccess';

    const employee = store.employee();
    if (employee === undefined) return 'pending';
    // Sin Empleado, o Invitado, o Deshabilitado: hay sesión pero no Panel.
    if (employee === null) return 'noAccess';
    return employee.status === 'active' ? 'allow' : 'noAccess';
  });

  return toObservable(decision).pipe(
    filter((value) => value !== 'pending'),
    take(1),
    map((value) => {
      if (value === 'allow') return true;
      return router.createUrlTree([
        value === 'login' ? PANEL_LOGIN_ROUTE : PANEL_NO_ACCESS_ROUTE,
      ]);
    })
  );
};
