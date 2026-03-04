import { Signal, computed } from "@angular/core";
import { signalStoreFeature, type, withComputed } from "@ngrx/signals";
import { getMonthRange, isWithinRange } from "../../components/helpers/getMonthRange";
import { KanbanItem } from "../../types/kanban.interface";

export function withPeriodTicketsFeature() {
  return signalStoreFeature(
    type<{
      props: {
        allTickets: Signal<KanbanItem[]>;
      };
    }>(),

    withComputed((store) => {
      const currentRange = computed(() => getMonthRange(0));
      const previousRange = computed(() => getMonthRange(-1));

      const ticketsByMonth = computed(() => {
        const tickets = store.allTickets();

        return {
          current: tickets.filter(
            (t) =>
              t.closedAt &&
              isWithinRange(
                t.closedAt.toDate(),
                currentRange().start,
                currentRange().end
              )
          ),
          previous: tickets.filter(
            (t) =>
              t.closedAt &&
              isWithinRange(
                t.closedAt.toDate(),
                previousRange().start,
                previousRange().end
              )
          ),
        };
      });

      return {
        ticketsByMonth,
      };
    })
  );
}
