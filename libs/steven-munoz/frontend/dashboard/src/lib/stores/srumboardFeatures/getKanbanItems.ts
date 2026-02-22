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
} from '@ngrx/signals';
import {
  FireStoreKanbanColumn,
  KanbanColumn,
  KanbanItem,
} from '../../types/kanban.interface';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

export function boardFeature() {
  return signalStoreFeature(
    withState({
      columns: [] as KanbanColumn[],
      tickets: [] as KanbanItem[],
      loading: false,
    }),

    withProps(() => ({
      firestore: inject(Firestore),
    })),

    withProps((store) => {
      const boardResource = rxResource<any, FireStoreKanbanColumn[]>({
        stream: () => {
          const ref = doc(store.firestore, 'board2/scrum');
          return docData(ref);
        },
      });

      const columns = computed(() => boardResource.value()?.columns ?? []);

      const tickets = computed(() => boardResource.value()?.tickets ?? []);

      return {
        boardResource,
        columns,
        tickets,
      };
    }),

    withMethods((store) => ({
      async reorderColumns(previousIndex: number, currentIndex: number) {
        const columns = [...store.columns()];

        moveItemInArray(columns, previousIndex, currentIndex);

        const ref = doc(store.firestore, 'board2/scrum');

        await updateDoc(ref, { columns });
      },

      async drop(event: CdkDragDrop<KanbanItem[]>, columnId: number) {
        const { previousIndex, currentIndex, container, previousContainer } =
          event;

        const tickets = [...store.tickets()];

        if (container === previousContainer) {
          const columnTickets = tickets.filter((t) => t.columnId === columnId);

          moveItemInArray(columnTickets, previousIndex, currentIndex);

          const updatedTickets = tickets.map((t) => {
            const reordered = columnTickets.find((ct) => ct.id === t.id);
            return reordered ?? t;
          });

          patchState(store, { tickets: updatedTickets });

          const boardRef = doc(store.firestore, 'board2', 'scrum');
          await updateDoc(boardRef, { tickets: updatedTickets });

          return;
        }

        const movedItem = previousContainer.data[previousIndex];
        const previousColumnId = movedItem.columnId;

        if (previousColumnId === columnId) return;

        const updatedTickets = tickets.map((t) =>
          t.id === movedItem.id ? { ...t, columnId } : t
        );

        patchState(store, { tickets: updatedTickets });

        const boardRef = doc(store.firestore, 'board2', 'scrum');
        const historyRef = collection(store.firestore, 'ticketHistory');

        try {
          await updateDoc(boardRef, { tickets: updatedTickets });

          await addDoc(historyRef, {
            ticketId: movedItem.id,
            boardId: 'scrum',
            field: 'columnId',
            oldValue: previousColumnId,
            newValue: columnId,
            changedAt: Timestamp.now(),
          });
        } catch (error) {
          console.error('Error moving ticket:', error);

          patchState(store, { tickets });
        }
      },
    }))
  );
}
