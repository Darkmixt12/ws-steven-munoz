import { Signal, computed } from '@angular/core';
import { signalStoreFeature, type, withComputed } from '@ngrx/signals';
import {
  getMonthRange,
  isWithinRange,
} from '../../components/helpers/getMonthRange';
import { KanbanItem } from '../../types/kanban.interface';

type TicketsByMonth = {
  current: KanbanItem[];
  previous: KanbanItem[];
};

export function withOpportunityKpisFeature() {
  return signalStoreFeature(
    type<{
      props: {
        ticketsByMonth: Signal<TicketsByMonth>;
        allTickets: Signal<KanbanItem[]>;
      };
    }>(),

    withComputed((store) => {
      const opportunitySummary = computed(() => {
        const tickets = store.allTickets();
        const pipelineColumns = [1, 2, 3];

        const { start: currentStart, end: currentEnd } = getMonthRange(0);
        const { start: prevStart, end: prevEnd } = getMonthRange(-1);

        let current = 0;
        let previous = 0;

        for (const t of tickets) {
          if (t.isDeleted) continue;
          if (!pipelineColumns.includes(t.columnId)) continue;

          const created = t.createdAt.toDate();

          if (isWithinRange(created, currentStart, currentEnd)) {
            current++;
          }

          if (isWithinRange(created, prevStart, prevEnd)) {
            previous++;
          }
        }

        const trendPercent =
          previous === 0 ? 100 : ((current - previous) / previous) * 100;

        const progressPercent =
          previous === 0 ? 100 : Math.min((current / previous) * 100, 100);

        return {
          current,
          previous,
          trendPercent,
          progressPercent,
          displayMessage: `Actual: ${current} vs Mes anterior: ${previous}`,
        };
      });

      return { opportunitySummary };
    })
  );
}
