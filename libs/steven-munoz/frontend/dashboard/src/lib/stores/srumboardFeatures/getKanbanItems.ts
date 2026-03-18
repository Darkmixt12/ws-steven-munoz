import { computed, effect, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  Firestore,
  Timestamp,
  addDoc,
  collection,
  doc,
  docData,
  runTransaction,
  updateDoc,
} from '@angular/fire/firestore';
import {
  signalStoreFeature,
  withState,
  withProps,
  patchState,
  withMethods,
  withComputed,
} from '@ngrx/signals';
import {
  FireStoreKanbanColumn,
  KanbanColumn,
  KanbanItem,
} from '../../types/kanban.interface';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { EMPTY, exhaustMap, filter, from, map, pipe, switchMap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Filters } from '../../types/filters.interface';

const initialFilters: Filters = {
  seller: null,
  priority: null,
  search: '',
  minValue: null,
  maxValue: null,
  minAging: null,
  maxAging: null,
};

export function boardFeature() {
  return signalStoreFeature(
    withState({
      columns: [] as KanbanColumn[],
      tickets: [] as KanbanItem[],
      loading: false,

      filters: {
        ...initialFilters,
      } as Filters,
    }),

    withProps(() => ({
      firestore: inject(Firestore),
    })),

    withProps((store) => {
      const boardResource = rxResource<any, FireStoreKanbanColumn[]>({
        stream: () => {
          const ref = doc(store.firestore, 'board2/scrum');
          return docData(ref).pipe(
            map((data: any) => {
              const tickets: KanbanItem[] = data?.tickets ?? [];

              const activeTickets = tickets.filter((t) => !t.isDeleted);

              return {
                ...data,
                tickets: activeTickets,
                allTicketsforAnalytics: tickets,
              };
            })
          );
        },
      });

      const columns = computed(() => boardResource.value()?.columns ?? []);

      const tickets = computed(() => boardResource.value()?.tickets ?? []);

      const allTickets = computed(
        () => boardResource.value()?.allTicketsforAnalytics ?? []
      );

      return {
        boardResource,
        columns,
        tickets,
        allTickets,
      };
    }),

    withComputed((store) => ({
      ticketAgingMap: computed(() => {
        const tickets = store.tickets();
        const now = Date.now();

        const map = new Map<number, number>();

        for (const ticket of tickets) {
          const reference =
            ticket.updatedAt?.toDate().getTime() ??
            ticket.createdAt.toDate().getTime();

          const diff = now - reference;

          const days = Math.floor(diff / (1000 * 60 * 60 * 24));

          map.set(ticket.id, days);
        }

        return map;
      }),
    })),

    withComputed((store) => ({
      filteredTickets: computed(() => {
        const tickets = store.tickets();
        const filters = store.filters();
        const agingMap = store.ticketAgingMap();

        return tickets.filter((tickets) => {
          const aging = agingMap.get(tickets.id) ?? 0;

          if (
            store.filters().seller &&
            tickets.assignee !== store.filters().seller
          )
            return false;

          if (
            store.filters().priority &&
            tickets.priority !== store.filters().priority
          )
            return false;

          if (
            store.filters().search &&
            !tickets.client
              .toLowerCase()
              .includes(store.filters().search.toLowerCase())
          )
            return false;

          if (filters.minValue !== null && tickets.proposal < filters.minValue)
            return false;

          if (filters.maxValue !== null && tickets.proposal > filters.maxValue)
            return false;

          if (filters.minAging !== null && aging < filters.minAging)
            return false;

          if (filters.maxAging !== null && aging > filters.maxAging)
            return false;

          return true;
        });
      }),
    })),

    withComputed((store) => ({
      ticketsByColumn: computed(() => {
        const tickets = store.filteredTickets();

        const map = new Map<number, KanbanItem[]>();

        for (const ticket of tickets) {
          const list = map.get(ticket.columnId) ?? [];
          list.push(ticket);
          map.set(ticket.columnId, list);
        }

        return map;
      }),

      activeFiltersList: computed(() => {
        const f = store.filters();
        const list: string[] = [];

        if (f.seller) list.push(`Seller: ${f.seller}`);
        if (f.priority) list.push(`Priority: ${f.priority}`);
        if (f.search) list.push(`Search: "${f.search}"`);
        if (f.minValue !== null) list.push(`Min: $${f.minValue}`);
        if (f.maxValue !== null) list.push(`Max: $${f.maxValue}`);
        if (f.minAging !== null) list.push(`Min Days: ${f.minAging}`);
        if (f.maxAging !== null) list.push(`Max Days: ${f.maxAging}`);

        return list;
      }),
    })),

    withMethods((store) => ({
      async reorderColumns(previousIndex: number, currentIndex: number) {
        const columns = [...store.columns()];

        moveItemInArray(columns, previousIndex, currentIndex);

        const ref = doc(store.firestore, 'board2/scrum');

        await updateDoc(ref, { columns });
      },

      drop: rxMethod<{ event: CdkDragDrop<KanbanItem[]>; columnId: number }>(
        pipe(
          exhaustMap(({ event, columnId }) => {
            const {
              previousIndex,
              currentIndex,
              container,
              previousContainer,
            } = event;

            const tickets = [...store.allTickets()];

            if (container === previousContainer) {
              const columnTickets = tickets.filter(
                (t) => t.columnId === columnId
              );

              moveItemInArray(columnTickets, previousIndex, currentIndex);

              const otherTickets = tickets.filter(
                (t) => t.columnId !== columnId
              );

              const updatedTickets = [...otherTickets, ...columnTickets];

              patchState(store, { tickets: updatedTickets });

              const boardRef = doc(store.firestore, 'board2', 'scrum');

              return from(updateDoc(boardRef, { tickets: updatedTickets }));
            }

            const movedItem = previousContainer.data[previousIndex];
            const previousColumnId = movedItem.columnId;

            if (previousColumnId === columnId) {
              return EMPTY;
            }

            const WON = 4;

            const updatedTickets = tickets.map((t) => {
              if (t.id !== movedItem.id) return t;

              const updatedTicket = {
                ...t,
                columnId,
                updatedAt: Timestamp.now(),
              };

              if (columnId === WON) {
                return {
                  ...updatedTicket,
                  closedAt: Timestamp.now(),
                };
              }

              if (previousColumnId === WON && columnId !== WON) {
                return {
                  ...updatedTicket,
                  closedAt: null,
                };
              }

              return updatedTicket;
            });

            patchState(store, { tickets: updatedTickets });

            const boardRef = doc(store.firestore, 'board2', 'scrum');
            const historyRef = collection(store.firestore, 'ticketHistory');

            return from(updateDoc(boardRef, { tickets: updatedTickets })).pipe(
              switchMap(() =>
                from(
                  addDoc(historyRef, {
                    ticketId: movedItem.id,
                    boardId: 'scrum',
                    field: 'columnId',
                    oldValue: previousColumnId,
                    newValue: columnId,
                    changedAt: Timestamp.now(),
                  })
                )
              )
            );
          })
        )
      ),

      setTickets(tickets: KanbanItem[]) {
        patchState(store, { tickets });
      },

      updateFilter(filter: Partial<Filters>) {
        patchState(store, (state) => ({
          filters: {
            ...state.filters,
            ...filter,
          },
        }));
      },

      resetFilters() {
        patchState(store, {
          filters: initialFilters,
        });
      },
    }))
  );
}
