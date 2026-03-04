import { Signal, computed } from '@angular/core';
import { signalStoreFeature, type, withComputed } from '@ngrx/signals';
import { KanbanItem } from '../../types/kanban.interface';

type TicketsByMonth = {
  current: KanbanItem[];
  previous: KanbanItem[];
};

export function withWinrateKpisFeature() {
  return signalStoreFeature(
type<{
  props: {
    ticketsByMonth: Signal<TicketsByMonth>;
  };
}>(),

    withComputed((store) => {
      const wonColumnId = 4;

      const winrateSummary = computed(() => {
        const { current, previous } = store.ticketsByMonth();

        const currentWon = current.filter(
          (t) => t.columnId === wonColumnId
        ).length;
        const previousWon = previous.filter(
          (t) => t.columnId === wonColumnId
        ).length;

        const currentClosed = current.length;
        const previousClosed = previous.length;

        const currentRate =
          currentClosed === 0 ? 0 : (currentWon / currentClosed) * 100;

        const previousRate =
          previousClosed === 0 ? 0 : (previousWon / previousClosed) * 100;

        const trend =
          previousRate === 0
            ? currentRate
            : ((currentRate - previousRate) / previousRate) * 100;

        return {
          currentWon,
          currentClosed,
          previousWon,
          previousClosed,
          currentRate,
          previousRate,
          trend,
          displayMessage: ` Mes anterior: ${previousWon} / ${previousClosed} | Mes actual: ${currentWon}/ ${currentClosed} `
        };
      });

      return { winrateSummary };
    })
  );
}

