import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

import { DocumentsStore } from '../../../stores/scrumboardStore';

@Component({
  selector: 'steven-munoz-kanban-history.component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban-history.component.html',
  styleUrl: './kanban-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanHistoryComponent {
  readonly scrumboardStore = inject(DocumentsStore);
  readonly config = inject(DynamicDialogConfig);

  columnMap: Map<number, string> = new Map(this.config.data.columns.map((c: any) => [c.id, c.title]));
  history$ = this.scrumboardStore.getHistoryTickets(this.config.data.item, this.columnMap);

}
