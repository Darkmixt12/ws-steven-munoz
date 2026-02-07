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
import { EMPTY, map, of } from 'rxjs';
import { buildLabel } from '../../components/helpers/historyItems.helper';
import { TicketHistory } from '../../types/ticketHistory.interface';
import { inject } from '@angular/core';

type HistoryParams = {
  ticketId: string;
  columnMap: Map<number, string>;
};

export function getHistoryKanbanItem() {
  return signalStoreFeature(
    withState({
      historyTicketId: null as string | null,
      columnMap: null as Map<number, string> | null,
    }),

    withMethods((store) => ({
      setHistoryParams(params: {
        ticketId: string;
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
      const firestore = inject(Firestore);

      return {
        ticketHistory: rxResource({
          params: () => {
            const ticketId = store.historyTicketId();
            const columnMap = store.columnMap();

            if (!ticketId || !columnMap) return null;
            return { ticketId, columnMap };
          },

          stream: ({ params }) => {
            console.log('🔥 STREAM EJECUTADO', params);
            if (!params) {
              // 👇 EMITE al menos una vez
              return of([]);
            }

            const historyRef = collection(firestore, 'ticketHistory');
            const q = query(
              historyRef,
              where('ticketId', '==', params.ticketId),
              orderBy('changedAt', 'desc'),
              limit(50)
            );

            return collectionData(q, { idField: 'id' }).pipe(
              map((history) =>
                (history as TicketHistory[]).map((h) => ({
                  ...h,
                  label: buildLabel(h, params.columnMap),
                }))
              )
            );
          },
        }),
      };
    })
  );
}
