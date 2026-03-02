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
import { from, map, pipe } from 'rxjs';

export function newScrumboardItem() {
  return signalStoreFeature(

    withProps(() => ({
      firestore :inject(Firestore)
    })),

    withMethods((store) => ({
      createScrumboardItem: rxMethod<KanbanForm>(
        pipe(
          map((item) =>
            from(
              (async () => {
                const scrumRef = doc(store.firestore, 'board2', 'scrum');
                const snap = await getDoc(scrumRef);
                const getTickets: KanbanItem[] = snap.data()?.['tickets'] ?? 0;

                const lasTicketsid =
                  getTickets.length > 0
                    ? Math.max(...getTickets.map((t) => Number(t.id)))
                    : 0;

                const newId = lasTicketsid + 1;

                const newItem: KanbanItem = {
                  ...item,
                  id: newId,
                  createdAt:  Timestamp.now()
                };

                await updateDoc(scrumRef, { tickets: arrayUnion(newItem) });
              })()
            )
          )
        )
      ),
    }))
  );
}
