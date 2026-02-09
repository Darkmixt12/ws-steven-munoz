import { rxResource } from '@angular/core/rxjs-interop';
import {
  collection,
  collectionData,
  Firestore,
  limit,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import {
  patchState,
  signalStoreFeature,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { EMPTY, map, of, switchMap, tap } from 'rxjs';
import { buildLabel } from '../../components/helpers/historyItems.helper';
import { TicketHistory } from '../../types/ticketHistory.interface';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { DialogService } from 'primeng/dynamicdialog';
import { KanbanHistoryComponent } from '../../components/kanbanComponent/kanban-history/kanban-history.component';
import { FirestoreService } from '../../services/firestore.service';

type HistoryParams = {
  ticketId: string;
  columnMap: Map<number, string>;
};

export function getHistoryKanbanItem() {
  return signalStoreFeature(
    withState({
      history: [] as (TicketHistory & { label: string })[],
      loading: false,
    }),

    withMethods((innerStore) => {
      const firestore = inject(Firestore);
      const dialog = inject(DialogService);
      const firestoreService = inject(FirestoreService);
      return {
        openHistoryDialog: rxMethod<HistoryParams>(
          switchMap(({ ticketId, columnMap }) => {
            patchState(innerStore, { loading: true });

            console.log('hola');


            return firestoreService.getHistoryTickets(ticketId, columnMap).pipe(
              tap((history) => console.log('fetching history...', history)),
              tap((history) => {
                patchState(innerStore, {
                  history,
                  loading: false,
                });
                dialog.open(KanbanHistoryComponent, {
                  header: 'History Item',
                  width: '20vw',
                  height: '50vh',
                  modal: true,
                  closable: true,
                });
              })
            );

            // return collectionData(q, { idField: 'id' }).pipe(
            //   tap((res) => console.log('fetching history...', res)),
            //   map((history) =>
            //     (history as TicketHistory[]).map((h) => ({
            //       ...h,
            //       label: buildLabel(h, columnMap),
            //     }))
            //   ),
            //   tap((history) => {
            //     patchState(innerStore, {
            //       history,
            //       loading: false,
            //     });

            //     // 👉 abrir dialog SOLO cuando ya hay data
            //     dialog.open(KanbanHistoryComponent, {
            //       header: 'History Item',
            //       width: '20vw',
            //       height: '50vh',
            //       modal: true,
            //       closable: true,
            //     });
            //   })
            // );
          })
        ),

        clearHistory() {
          patchState(innerStore, {
            history: [],
            loading: false,
          });
        },
      };
    })
  );
}
