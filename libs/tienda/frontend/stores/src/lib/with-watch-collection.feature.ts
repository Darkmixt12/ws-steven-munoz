import {
  EnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  Firestore,
  collection,
  collectionData,
  query,
  type DocumentData,
  type Query,
  type QueryConstraint,
} from '@angular/fire/firestore';
import { signalStoreFeature, withProps } from '@ngrx/signals';
import { of, type Observable } from 'rxjs';
import { toPathArgs } from './firestore-path';
import { readMaybeSignal, type MaybeSignal } from './maybe-signal';
import type { WithId } from './types';

/**
 * Expone como `resourceName` un `rxResource` que escucha en vivo una colección
 * (o subcolección) de Firestore, con el id de cada documento en `id`.
 * Con `enabled` en `false` entrega `defaultValue` sin suscribirse.
 */
export function withWatchCollection<T extends object>() {
  return function <const TPropName extends string>(params: {
    resourceName: TPropName;
    collectionToWatchPath: MaybeSignal<string>;
    defaultValue: WithId<T>[];
    enabled?: MaybeSignal<boolean>;
    constraints?: MaybeSignal<readonly QueryConstraint[]>;
  }) {
    return signalStoreFeature(
      withProps(() => {
        const fs = inject(Firestore);
        const injector = inject(EnvironmentInjector);

        const resource = rxResource<
          WithId<T>[],
          {
            path: string;
            constraints: readonly QueryConstraint[];
            enabled: boolean;
          }
        >({
          params: () => ({
            path: readMaybeSignal(params.collectionToWatchPath),
            constraints: readMaybeSignal(params.constraints ?? []),
            enabled: readMaybeSignal(params.enabled ?? true),
          }),
          stream: ({ params: resourceParams }) => {
            if (!resourceParams.enabled) return of(params.defaultValue);

            return runInInjectionContext(injector, () => {
              const col = collection(fs, ...toPathArgs(resourceParams.path));
              const q = query(col, ...resourceParams.constraints);
              return collectionData(q as Query<DocumentData, DocumentData>, {
                idField: 'id',
              }) as Observable<WithId<T>[]>;
            });
          },
          defaultValue: params.defaultValue,
        });

        return { [params.resourceName]: resource } as {
          [K in TPropName]: typeof resource;
        };
      })
    );
  };
}
