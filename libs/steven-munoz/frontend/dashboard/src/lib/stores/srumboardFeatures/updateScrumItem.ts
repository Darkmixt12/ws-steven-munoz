import { inject } from '@angular/core';
import { doc, Firestore, runTransaction, Timestamp } from '@angular/fire/firestore';
import { signalStoreFeature, withMethods, withProps } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  KanbanForm,
  KanbanItem,
  KanbanUpdate,
} from '../../types/kanban.interface';
import { pipe, exhaustMap, from } from 'rxjs';

export function updateScrumboardItem() {
  return signalStoreFeature(
    withProps(() => ({
      firestore: inject(Firestore),
    })),

    withMethods((store) => ({
      updateScrumboardItem: rxMethod<KanbanUpdate>(
        pipe(
          exhaustMap((item) => {
            const scrumRef = doc(store.firestore, 'board2', 'scrum');

            return from(
              runTransaction(store.firestore, (transaction) => {
                return transaction.get(scrumRef).then((snap) => {
                  if (!snap.exists()) {
                    throw new Error('El documento no existe');
                  }

                  const tickets =
                    (snap.data()?.['tickets'] as KanbanItem[]) ?? [];

                  const updatedTickets = tickets.map((ticket) =>
                    ticket.id === item.id
                      ? {
                          ...ticket,
                          ...item.changes,
                          updatedAt: Timestamp.now()
                        }
                      : ticket
                  );

                  transaction.update(scrumRef, { tickets: updatedTickets });
                });
              })
            );
          })
        )
      ),
    }))
  );
}
