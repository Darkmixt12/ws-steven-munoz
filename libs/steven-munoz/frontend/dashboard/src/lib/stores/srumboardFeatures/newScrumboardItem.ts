import { Timestamp } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import {
  arrayUnion,
  doc,
  Firestore,
  getDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { signalStoreFeature, withMethods, withProps } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { KanbanForm, KanbanItem } from '../../types/kanban.interface';
import { from, map, pipe, switchMap } from 'rxjs';

export function newScrumboardItem() {
  return signalStoreFeature(
    withProps(() => ({
      firestore: inject(Firestore),
    })),

    withMethods((store) => ({
      createScrumboardItem: rxMethod<KanbanForm>(
        pipe(
          switchMap((item) => {
            const scrumRef = doc(store.firestore, 'board2', 'scrum');

            return from(getDoc(scrumRef)).pipe(
              switchMap((snap) => {
                const tickets: KanbanItem[] = snap.data()?.['tickets'] ?? [];

                const lastTicketId =
                  tickets.length > 0
                    ? Math.max(...tickets.map((t) => Number(t.id)))
                    : 0;

                const newId = lastTicketId + 1;

                const newItem: KanbanItem = {
                  ...item,
                  id: newId,
                  createdAt: Timestamp.now(),
                };

                return from(
                  updateDoc(scrumRef, { tickets: arrayUnion(newItem) })
                );
              })
            );
          })
        )
      ),
    }))
  );
}
