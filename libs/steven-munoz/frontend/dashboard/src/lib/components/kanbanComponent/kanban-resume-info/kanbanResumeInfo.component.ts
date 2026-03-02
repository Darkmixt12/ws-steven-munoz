import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CardModule } from 'primeng/card';
import { Deal, KpiItem } from '../../../types/kpiItem.interface';
import { CommonModule } from '@angular/common';
import { ScrumboardStore } from '../../../stores/scrumboardStore';
import { KanbanItem } from '../../../types/kanban.interface';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'steven-munoz-kanban-resume-info',
  imports: [CardModule, CommonModule],
  templateUrl: './kanbanResumeInfo.component.html',
  styleUrl: './kanbanResumeInfo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanResumeInfoComponent {
  private readonly scrumboardStore = inject(ScrumboardStore);

  deals = signal<Deal[]>([]);

  kpis = computed<KpiItem[]>(() => {
    const pipeValue = computed(() => {
      const tickets = this.scrumboardStore.tickets();
      return tickets
        .filter((ticket) => ticket.columnId !== 4 && ticket.columnId !== 5)
        .reduce((acc, ticket) => acc + (ticket.proposal || 0), 0);
    });

    const winRate = computed(() => {
      const tickets = this.scrumboardStore.tickets();

      const won = tickets.filter((t) => t.columnId === 4).length;
      const lost = tickets.filter((t) => t.columnId === 5).length;

      const closed = won + lost;

      if (closed === 0) return 0;

      return Math.round((won / closed) * 100);
    });

    const activeDeals = computed(() => {
      const tickets = this.scrumboardStore.tickets();

      return tickets.filter((t) => t.columnId !== 4 && t.columnId !== 5).length;
    });

    const avgCloseTime = computed(() => {
      const tickets = this.scrumboardStore.tickets();

      // Filtramos solo los tickets cerrados que tengan Timestamps válidos
      const closedTickets = tickets.filter(
        (t): t is KanbanItem & { closedAt: Timestamp; createdAt: Timestamp } =>
          t.closedAt instanceof Timestamp && t.createdAt instanceof Timestamp
      );

      if (!closedTickets.length) return 0;

      const totalMs = closedTickets.reduce((acc, ticket) => {
        const createdMs = ticket.createdAt.toDate().getTime();
        const closedMs = ticket.closedAt.toDate().getTime();

        return acc + (closedMs - createdMs);
      }, 0);

      const avgMs = totalMs / closedTickets.length;

      // Convertimos de ms a días
      return Math.round((avgMs / (1000 * 60 * 60 * 24)) * 100) / 100;
    });

    return [
      {
        label: 'Revenue Total',
        value: pipeValue(),
        icon: 'pi pi-money-bill',
        progress: 65,
        trend: 12,
        customColor: '#28a745', // color personalizado
        format: 'currency',
      },
      {
        label: 'Oportunidades',
        value: activeDeals(),
        icon: 'pi pi-briefcase',
        progress: (activeDeals() / 20) * 100,
        trend: 5,
        customColor: '#007bff',
        format: 'number',
      },
      {
        label: 'Win Rate',
        value: winRate(),
        icon: 'pi pi-chart-bar',
        progress: winRate(),
        trend: 3,
        customColor: '#ffc107',
        format: 'percent',
      },
      {
        label: 'Avg Close Time',
        value: avgCloseTime(),
        icon: 'pi pi-clock',
        progress: avgCloseTime() ? (30 / avgCloseTime()) * 100 : 0,
        trend: -2,
        customColor: '#17a2b8',
        format: 'days',
      },
    ];
  });
}
