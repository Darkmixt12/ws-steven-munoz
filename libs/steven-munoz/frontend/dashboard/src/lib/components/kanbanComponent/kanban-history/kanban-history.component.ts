import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TicketHistory } from '../../../types/ticketHistory.interface';
@Component({
  selector: 'steven-munoz-kanban-history.component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban-history.component.html',
  styleUrl: './kanban-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanHistoryComponent {
  readonly config = inject(DynamicDialogConfig);

  readonly history = this.config.data.history as (TicketHistory & {
  label: string;
})[];

  
}
