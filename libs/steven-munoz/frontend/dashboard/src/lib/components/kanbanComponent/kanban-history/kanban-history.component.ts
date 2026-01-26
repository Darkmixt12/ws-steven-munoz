import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { TicketHistory } from '../../../types/ticketHistory.interface';
import { DocumentsStore } from '../../../stores/scrumboardStore';

@Component({
  selector: 'steven-munoz-kanban-history.component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban-history.component.html',
  styleUrl: './kanban-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanHistoryComponent implements OnInit {
  readonly scrumboardStore = inject(DocumentsStore);

  readonly config = inject(DynamicDialogConfig);

  history$!: Observable<(TicketHistory & { label: string })[]>;

  private columnMap = new Map<number, string>();

  ngOnInit() {
    this.columnMap = new Map(this.config.data.columns.map((c: any) => [c.id, c.title]));
    this.history$ = this.scrumboardStore.getHistoryTickets(this.config.data.item, this.columnMap);
  }
}
