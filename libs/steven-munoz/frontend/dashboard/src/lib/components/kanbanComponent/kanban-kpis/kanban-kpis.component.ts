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

@Component({
  selector: 'steven-munoz-kanban-kpis-info',
  imports: [CardModule, CommonModule],
  templateUrl: './kanban-kpis.component.html',
  styleUrl: './kanban-kpis.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanKpisComponent {
  private readonly scrumboardStore = inject(ScrumboardStore);

  readonly revenueSummary = this.scrumboardStore.revenueSummary;
  readonly opportunitySummary = this.scrumboardStore.opportunitySummary;
  readonly winrateSummary = this.scrumboardStore.winrateSummary;
  readonly avgCloseTimeSummary = this.scrumboardStore.avgCloseTimeSummary;

  deals = signal<Deal[]>([]);

  kpis = computed<KpiItem[]>(() => {
    return [
      {
        label: 'Ganancia Total',
        value: this.revenueSummary().pipelineValue,
        icon: 'pi pi-money-bill',
        progress: this.revenueSummary().progressPercent,
        trend: this.revenueSummary().growthPercent,
        customColor: '#28a745',
        format: 'currency',
        displayMessage: this.revenueSummary().displayMessage
      },
      {
        label: 'Oportunidades de este Mes',
        value: this.opportunitySummary().current,
        icon: 'pi pi-briefcase',
        progress: this.opportunitySummary().progressPercent,
        trend: this.opportunitySummary().trendPercent,
        customColor: '#007bff',
        format: 'number',
        displayMessage: this.opportunitySummary().displayMessage

      },
      {
        label: 'Win Rate',
        value: this.winrateSummary().currentRate,
        icon: 'pi pi-chart-bar',
        progress: this.winrateSummary().currentRate,
        trend: this.winrateSummary().trend,
        customColor: '#ffc107',
        format: 'percent',
        displayMessage: this.winrateSummary().displayMessage

      },
      {
        label: 'Avg Close Time',
        value: this.avgCloseTimeSummary().currentAvgDays,
        icon: 'pi pi-clock',
        progress: this.avgCloseTimeSummary().progressPercent,
        trend: this.avgCloseTimeSummary().trendPercent,
        customColor: '#17a2b8',
        format: 'days',
        displayMessage: this.avgCloseTimeSummary().displayMessage

      },
    ];
  });
}
