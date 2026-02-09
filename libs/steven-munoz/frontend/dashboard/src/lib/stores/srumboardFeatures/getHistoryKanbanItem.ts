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

withMethods((store) => {
  const firestore = inject(Firestore);
  const dialogService = inject(DialogService);

  return {
    openHistoryDialog: rxMethod<HistoryParams>(
      switchMap(({ ticketId, columnMap }) => {
        patchState(store, { loading: true });

        console.log('hola')
        const historyRef = collection(firestore, 'ticketHistory');
        const q = query(
          historyRef,
          where('ticketId', '==', ticketId),
          orderBy('changedAt', 'desc'),
          limit(50)
        );

        return collectionData(q, { idField: 'id' }).pipe(
          map((history) =>
            (history as TicketHistory[]).map((h) => ({
              ...h,
              label: buildLabel(h, columnMap),
            }))
          ),
          tap((history) => {
            patchState(store, {
              history,
              loading: false,
            });

            // 👉 abrir dialog SOLO cuando ya hay data
            dialogService.open(KanbanHistoryComponent, {
              header: 'History Item',
              width: '20vw',
              height: '50vh',
              modal: true,
              closable: true,
            });
          })
        );
      })
    ),

    clearHistory() {
      patchState(store, {
        history: [],
        loading: false,
      });
    },
  };
}))

}
