import { signalStoreFeature, type, withComputed } from '@ngrx/signals';
import { computed, Signal } from '@angular/core';
import { KanbanItem } from '../../types/kanban.interface';

type TicketsByMonth = {
  current: KanbanItem[];
  previous: KanbanItem[];
};

export function withRevenueKpisFeature() {
  return signalStoreFeature(
    type<{
      props: {
        ticketsByMonth: Signal<TicketsByMonth>;
        allTickets: Signal<KanbanItem[]>;
      };
    }>(),

    withComputed((store) => {
      const revenueSummary = computed(() => {
        const { current, previous } = store.ticketsByMonth();
        const allTickets = store.allTickets();

        const wonColumnId = 4;
        const pipelineColumns = [1, 2, 3];

        const activeTickets = allTickets.filter((t) => !t.isDeleted);

        const currentRevenue = current
          .filter((t) => t.columnId === wonColumnId && !t.isDeleted)
          .reduce((sum, t) => sum + (t.proposal || 0), 0);

        const previousRevenue = previous
          .filter((t) => t.columnId === wonColumnId)
          .reduce((sum, t) => sum + (t.proposal || 0), 0);

        const growthPercent =
          previousRevenue === 0
            ? 0
            : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

        const progressPercent =
          previousRevenue === 0
            ? 0
            : Math.min((currentRevenue / previousRevenue) * 100, 100);

        const pipelineValue = activeTickets
          .filter((t) => pipelineColumns.includes(t.columnId))
          .reduce((sum, t) => sum + (t.proposal || 0), 0);

        return {
          currentRevenue,
          previousRevenue,
          growthPercent,
          progressPercent,
          pipelineValue,
          displayMessage: `$${currentRevenue} vs mes anterior $${previousRevenue}`
        };
      });

      return { revenueSummary };
    })
  );
}
