import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ScrumboardStore } from '../../../stores/scrumboardStore';

@Component({
  selector: 'steven-munoz-kanban-history.component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban-history.component.html',
  styleUrl: './kanban-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanHistoryComponent {
  readonly scrumboardStore = inject(ScrumboardStore);
  readonly config = inject(DynamicDialogConfig);




    $history = effect(() => {
      const ticketId = this.config.data.item;
      const columns = this.config.data.columns;

      if (!ticketId || !columns?.length) return;

      const columnMap = new Map<number, string>(
        columns.map((c: { id: number; title: string }) => [c.id, c.title])
      );

      this.scrumboardStore.setHistoryParams({
        ticketId,
        columnMap,
      });
    });
  
}
