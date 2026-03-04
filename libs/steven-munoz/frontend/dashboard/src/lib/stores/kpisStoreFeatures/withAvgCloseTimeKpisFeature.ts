import { computed, Signal } from '@angular/core';
import { signalStoreFeature, type, withComputed } from '@ngrx/signals';
import { KanbanItem } from '../../types/kanban.interface';
import { Timestamp } from '@angular/fire/firestore';
import {
  getMonthRange,
  isWithinRange,
} from '../../components/helpers/getMonthRange';

type TicketsByMonth = {
  current: KanbanItem[];
  previous: KanbanItem[];
};

export function withAvgCloseTimeKpisFeature() {
  return signalStoreFeature(
    type<{
      props: {
        allTickets: Signal<KanbanItem[]>;
      };
    }>(),

    withComputed((store) => {
      const avgCloseTimeSummary = computed(() => {
        const tickets = store.allTickets();

        const { start: currStart, end: currEnd } = getMonthRange(0);
        const { start: prevStart, end: prevEnd } = getMonthRange(-1);

        let currTotal = 0;
        let currCount = 0;

        let prevTotal = 0;
        let prevCount = 0;

        for (const t of tickets) {
          if (t.isDeleted) continue;
          if (!t.closedAt || !t.createdAt) continue;

          const closedDate = t.closedAt.toDate();
          const createdMs = t.createdAt.toDate().getTime();
          const closedMs = closedDate.getTime();
          const duration = closedMs - createdMs;

          if (isWithinRange(closedDate, currStart, currEnd)) {
            currTotal += duration;
            currCount++;
          }

          if (isWithinRange(closedDate, prevStart, prevEnd)) {
            prevTotal += duration;
            prevCount++;
          }
        }

        const currentAvgDays =
          currCount === 0 ? 0 : currTotal / currCount / (1000 * 60 * 60 * 24);

        const previousAvgDays =
          prevCount === 0 ? 0 : prevTotal / prevCount / (1000 * 60 * 60 * 24);

        let trendPercent = 0;

        if (previousAvgDays > 0) {
          trendPercent =
            ((previousAvgDays - currentAvgDays) / previousAvgDays) * 100;
        }

        const progressPercent =
          currentAvgDays <= 7
            ? 100
            : (7 / currentAvgDays) * 100;

        return {
          currentAvgDays: Math.round(currentAvgDays * 100) / 100,
          previousAvgDays: Math.round(previousAvgDays * 100) / 100,
          trendPercent: Math.round(trendPercent * 100) / 100,
          currentClosedCount: currCount,
          progressPercent,
          displayMessage: `Actual ${currentAvgDays.toFixed(1)}d vs Mes anterior: ${previousAvgDays.toFixed(1)}d`
        };
      });

      return {
        avgCloseTimeSummary,
      };
    })
  );
}
