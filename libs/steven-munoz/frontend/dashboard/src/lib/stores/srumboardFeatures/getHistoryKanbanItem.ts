import {
  withProps,
  withState,
  patchState,
  withMethods,
  signalStoreFeature,
} from '@ngrx/signals';
import { of, tap } from 'rxjs';
import { inject } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { rxResource } from '@angular/core/rxjs-interop';
import { FirestoreService } from '../../services/firestore.service';
import { KanbanHistoryComponent } from '../../components/kanbanComponent/kanban-history/kanban-history.component';

export function getHistoryKanbanItem() {
  return signalStoreFeature(
    withState({
      historyTicketId: null as number | null,
      columnMap: null as Map<number, string> | null,
    }),

    withMethods((store) => ({
      setHistoryParams(params: {
        ticketId: number;
        columnMap: Map<number, string>;
      }) {
        patchState(store, {
          historyTicketId: params.ticketId,
          columnMap: params.columnMap,
        });
      },

      clearHistoryParams() {
        patchState(store, {
          historyTicketId: null,
          columnMap: null,
        });
      },
    })),

    withProps((store) => {
      const dialogService = inject(DialogService);
      const fireStoreService = inject(FirestoreService);
      return {
        ticketHistory: rxResource({
          params: () => {
            const ticketId = store.historyTicketId();
            const columnMap = store.columnMap();

            if (ticketId == null || !columnMap) return undefined;
            return { ticketId, columnMap };
          },

          stream: ({ params }) => {
            return fireStoreService
              .getHistoryTickets(params.ticketId, params.columnMap)
              .pipe(
                tap(() =>
                  dialogService.open(KanbanHistoryComponent, {
                    transitionOptions: '300ms ease-in-out',
                    data: {
                      item: params.ticketId,
                      columns: params.columnMap ?? [],
                    },
                    header: 'History Item',
                    width: '20vw',
                    height: '50vh',
                    closable: true,
                    modal: true,
                  })
                )
              );
          },
        }),
      };
    })
  );
}
