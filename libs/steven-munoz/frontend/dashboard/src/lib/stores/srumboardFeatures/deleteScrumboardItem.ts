import { inject } from '@angular/core';
import { signalStoreFeature, withMethods, withProps } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, from, pipe } from 'rxjs';
import {
  Firestore,
  Timestamp,
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
          exhaustMap((idToDelete) =>
            from(
              (async () => {
                if (idToDelete == null) return;

                const scrumRef = doc(store.firestore, 'board2', 'scrum');

                await runTransaction(store.firestore, async (transaction) => {
                  const snap = await transaction.get(scrumRef);

                  if (!snap.exists()) {
                    console.error('Documento no existe');
                    return;
                  }

                  const tickets =
                    (snap.data()?.['tickets'] as KanbanItem[]) ?? [];

                  const updatedTickets = tickets.map((t) => {
                    if (t.id === idToDelete) {
                      return {
                        ...t,
                        isDeleted: true,
                        deletedAt: Timestamp.now(),
                      };
                    }
                    return t;
                  });

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
