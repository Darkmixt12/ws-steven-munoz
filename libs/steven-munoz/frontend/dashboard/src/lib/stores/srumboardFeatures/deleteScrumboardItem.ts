import { inject } from '@angular/core';
import { signalStoreFeature, withMethods, withProps } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, from, pipe } from 'rxjs';
import {
  Firestore,
  doc,
  getDoc,
  runTransaction,
} from '@angular/fire/firestore';
import { KanbanItem } from '../../types/kanban.interface';

export function deleteScrumboardItem() {
  return signalStoreFeature(

      withProps(() => ({
        firestore: inject(Firestore),
      })),

    withMethods((store) => ({
      deleteScrumboardItem: rxMethod<number | undefined>(
        pipe(
          exhaustMap((idTodelete) =>
            from(
              (async () => {
                const scrumRef = doc(store.firestore, 'board2', 'scrum');
                const snap = await getDoc(scrumRef);

                if (!snap.exists()) {
                  console.error('Documento no existe');
                  return;
                }

                await runTransaction(store.firestore, async (transaction) => {
                  const tickets =
                    (snap.data()?.['tickets'] as KanbanItem[]) ?? [];

                  const updatedTickets = tickets.filter(
                    (t) => t.id !== idTodelete
                  );

                  transaction.update(scrumRef, {
                    tickets: updatedTickets,
                  });
                });
              })()
            )
          )
        )
      ),
    }))
  );
}
