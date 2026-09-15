import {
  EnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  Firestore,
  doc,
  docData,
  type DocumentData,
  type DocumentReference,
} from '@angular/fire/firestore';
import { signalStoreFeature, withProps } from '@ngrx/signals';
import { map } from 'rxjs';
import { toPathArgs } from './firestore-path';
import { readMaybeSignal, type MaybeSignal } from './maybe-signal';
import type { WithId } from './types';

/**
 * Expone como `resourceName` un `rxResource` que escucha en vivo un documento
 * de Firestore (p. ej. `settings/storefront`).
 *
 * `value()` es el documento con su `id`, `null` si el documento no existe, y
 * `undefined` mientras no hay dato. Con `documentPath` en `null` o `enabled`
 * en `false` no se suscribe. Si la ruta cambia, suelta la suscripción
 * anterior y abre una nueva.
 */
export function withWatchDocument<T extends object>() {
  return function <const TPropName extends string>(params: {
    resourceName: TPropName;
    documentPath: MaybeSignal<string | null>;
    enabled?: MaybeSignal<boolean>;
  }) {
    return signalStoreFeature(
      withProps(() => {
        const fs = inject(Firestore);
        const injector = inject(EnvironmentInjector);

        const resource = rxResource<
          WithId<T> | null,
          { path: string } | undefined
        >({
          params: () => {
            const path = readMaybeSignal(params.documentPath);
            const enabled = readMaybeSignal(params.enabled ?? true);
            return enabled && path ? { path } : undefined;
          },
          stream: ({ params: { path } }) =>
            runInInjectionContext(injector, () => {
              const ref = doc(fs, ...toPathArgs(path)) as DocumentReference<
                DocumentData,
                DocumentData
              >;
              return docData(ref, { idField: 'id' }).pipe(
                map((data) => (data ?? null) as WithId<T> | null)
              );
            }),
        });

        return { [params.resourceName]: resource } as {
          [K in TPropName]: typeof resource;
        };
      })
    );
  };
}
