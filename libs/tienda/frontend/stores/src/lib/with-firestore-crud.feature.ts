import {
  EnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type DocumentReference,
  type UpdateData,
} from '@angular/fire/firestore';
import { signalStoreFeature, withMethods, withProps } from '@ngrx/signals';
import { from, map, throwError, type Observable } from 'rxjs';
import { toPathArgs } from './firestore-path';
import type { WithId } from './types';

function documentRef(
  firestore: Firestore,
  collectionPath: string,
  id: string
): DocumentReference<DocumentData, DocumentData> {
  return doc(firestore, ...toPathArgs(`${collectionPath}/${id}`));
}

/**
 * Escritura directa del Panel a Firestore, sin auditoría en el navegador: la
 * Bitácora la escribe un trigger del backend (ADR 0005).
 *
 * Cada escritura sella `updatedAt` (hora del servidor) y `updatedBy` (uid del
 * usuario autenticado), que las reglas exigen; `_create` además sella
 * `createdAt`. Los sellos se aplican después de `data`, así que pisan
 * cualquier valor que traiga quien llama. Sin usuario autenticado, el
 * Observable emite error y no se escribe nada.
 *
 * No hay borrado: las colecciones que el Panel escribe directo no admiten
 * borrados desde el cliente.
 *
 * No usar para `skus` ni `slugs`: se escriben en el mismo batch que la
 * Variante o el Producto, y no llevan sellos.
 */
export function withFirestoreCrud() {
  return signalStoreFeature(
    withProps(() => ({
      _auth: inject(Auth),
      _fs: inject(Firestore),
      _injector: inject(EnvironmentInjector),
    })),

    withMethods((store) => {
      function asCurrentUser<R>(
        write: (uid: string) => Observable<R>
      ): Observable<R> {
        const uid = store._auth.currentUser?.uid;
        if (!uid) {
          return throwError(
            () =>
              new Error(
                'withFirestoreCrud: no hay usuario autenticado; no se escribe.'
              )
          );
        }
        return runInInjectionContext(store._injector, () => write(uid));
      }

      function updateStamps(uid: string) {
        return { updatedAt: serverTimestamp(), updatedBy: uid };
      }

      return {
        _create: <T extends DocumentData>(params: {
          collectionPath: string;
          data: T;
        }): Observable<DocumentReference<T>> =>
          asCurrentUser((uid) => {
            const col = collection(
              store._fs,
              ...toPathArgs(params.collectionPath)
            );
            const ref = doc(col);
            return from(
              setDoc(ref, {
                ...params.data,
                createdAt: serverTimestamp(),
                ...updateStamps(uid),
              }).then(() => ref as DocumentReference<T>)
            );
          }),

        _set: <T extends DocumentData>(params: {
          collectionPath: string;
          id: string;
          data: T;
          merge?: boolean;
        }): Observable<void> =>
          asCurrentUser((uid) =>
            from(
              setDoc(
                documentRef(store._fs, params.collectionPath, params.id),
                { ...params.data, ...updateStamps(uid) },
                { merge: params.merge ?? false }
              )
            )
          ),

        _update: <T extends DocumentData>(params: {
          collectionPath: string;
          id: string;
          data: Partial<T>;
        }): Observable<void> =>
          asCurrentUser((uid) =>
            from(
              updateDoc(
                documentRef(store._fs, params.collectionPath, params.id),
                {
                  ...params.data,
                  ...updateStamps(uid),
                } as UpdateData<DocumentData>
              )
            )
          ),

        _get: <T extends DocumentData>(params: {
          collectionPath: string;
          id: string;
        }): Observable<WithId<T> | undefined> =>
          runInInjectionContext(store._injector, () =>
            from(
              getDoc(documentRef(store._fs, params.collectionPath, params.id))
            ).pipe(
              map((snap) =>
                snap.exists()
                  ? ({ ...(snap.data() as T), id: snap.id } as WithId<T>)
                  : undefined
              )
            )
          ),
      };
    })
  );
}
