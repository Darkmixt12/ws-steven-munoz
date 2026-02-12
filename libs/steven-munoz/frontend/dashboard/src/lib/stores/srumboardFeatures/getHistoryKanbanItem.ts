import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';
import { pipe, switchMap, tap } from 'rxjs';
import { TicketHistory } from '../../types/ticketHistory.interface';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { DialogService } from 'primeng/dynamicdialog';
import { KanbanHistoryComponent } from '../../components/kanbanComponent/kanban-history/kanban-history.component';
import { FirestoreService } from '../../services/firestore.service';

type HistoryParams = {
  ticketId: number;
  columns: { id: number; title: string }[];
};

export function getHistoryKanbanItem() {
  return signalStoreFeature(
    withState({
      history: [] as (TicketHistory & { label: string })[],
      loading: false,
    }),

    withMethods((innerStore) => {
      const dialog = inject(DialogService);
      const firestoreService = inject(FirestoreService);
      return {
        openHistoryDialog: rxMethod<HistoryParams>(
          pipe(
            tap(() => {
              patchState(innerStore, { loading: true });
            }),
            switchMap(({ ticketId, columns }) =>
              firestoreService.getHistoryTickets(ticketId, columns).pipe(
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
                    data: { history },
                  });
                })
              )
            )
          )
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
