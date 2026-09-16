import { computed, effect, inject, signal, untracked, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user, type User } from '@angular/fire/auth';
import {
  signalStore,
  signalStoreFeature,
  withComputed,
  withHooks,
  withMethods,
  withProps,
} from '@ngrx/signals';
import {
  hasPermission,
  type Employee,
  type Permission,
  type Role,
} from 'tienda/domain';
import { withWatchDocument } from 'tienda/stores';

function withPanelSession() {
  /**
   * `withWatchDocument` recibe `documentPath` al **definir** el store, pero el
   * `uid` sale de `Auth`, que solo existe al construirlo. Este contenedor es el
   * puente: la fábrica de props mete adentro la señal del usuario y
   * `employeePath` la lee a través, sin un efecto de por medio.
   *
   * Hay un contenedor por composición de la feature, y por eso el store se
   * provee en la raíz: una sola instancia por aplicación.
   */
  const session = signal<Signal<User | null | undefined> | null>(null);

  /** `undefined` mientras Auth no ha respondido; `null` cuando no hay sesión. */
  const currentUser = computed(() => session()?.());

  const employeePath = computed(() => {
    const authenticated = currentUser();
    return authenticated ? `employees/${authenticated.uid}` : null;
  });

  return signalStoreFeature(
    withProps(() => {
      const auth = inject(Auth);
      // `user()` envuelve `onIdTokenChanged`, así que `emailVerified` se
      // refresca al renovarse el token y no se queda pegado al ingreso.
      session.set(toSignal(user(auth), { initialValue: undefined }));

      return {
        currentUser,
        /** Rol de la primera lectura de la sesión; contra él se compara el cambio. */
        _roleAtSessionStart: signal<Role | null>(null),
      };
    }),

    withWatchDocument<Employee>()({
      resourceName: '_employeeResource',
      documentPath: employeePath,
    }),

    withComputed((store) => {
      const isLoading = computed(() => store._employeeResource.isLoading());
      const error = computed(() => store._employeeResource.error());
      // `value()` relanza el error del recurso, así que con la lectura fallida
      // se responde «sin Empleado»; el aviso de salida lo da `error`.
      const employee = computed(() =>
        error() !== undefined ? undefined : store._employeeResource.value()
      );

      return {
        /** El Empleado con su id, `null` si no existe, `undefined` sin dato todavía. */
        employee,
        isLoading,
        error,
        role: computed(() => employee()?.role),

        /**
         * Señal de experiencia de usuario: avisa que el Panel ya no le
         * corresponde a quien lo tiene abierto. Quien de verdad corta el acceso
         * es la regla de Firestore (ADR 0002); este store nunca cierra sesión.
         *
         * Se queda apagada mientras carga: la lentitud no expulsa a nadie.
         */
        mustExit: computed(() => {
          if (isLoading()) return false;
          if (error() !== undefined) return true;

          const authenticated = currentUser();
          // Sin respuesta de Auth, o sin sesión, no hay de dónde salir.
          if (!authenticated) return false;
          if (!authenticated.emailVerified) return true;

          const current = employee();
          if (current === undefined) return false;
          if (current === null) return true;
          if (current.status !== 'active') return true;

          const anchored = store._roleAtSessionStart();
          return anchored !== null && current.role !== anchored;
        }),
      };
    }),

    withMethods((store) => ({
      /**
       * ¿El Empleado de la sesión tiene el Permiso? Las pantallas preguntan por
       * el Permiso y nunca por el Rol. Sin un Empleado Activo cargado es `false`.
       */
      can(permission: Permission): boolean {
        const current = store.employee();
        if (!current || current.status !== 'active') return false;
        return hasPermission(current.role, permission);
      },
    })),

    withHooks({
      onInit(store) {
        // Ancla el Rol con la primera lectura de la sesión y lo suelta al salir,
        // para que el siguiente ingreso vuelva a anclar.
        effect(() => {
          const authenticated = store.currentUser();
          if (!authenticated) {
            untracked(() => store._roleAtSessionStart.set(null));
            return;
          }

          const current = store.employee();
          if (!current) return;

          untracked(() => {
            if (store._roleAtSessionStart() === null) {
              store._roleAtSessionStart.set(current.role);
            }
          });
        });
      },
    })
  );
}

/**
 * Sesión del Panel: sigue en vivo `employees/{uid}` del usuario autenticado y
 * deriva de ahí el Rol, los Permisos y el aviso de salida.
 */
export const PanelSessionStore = signalStore(
  { providedIn: 'root' },
  withPanelSession()
);
