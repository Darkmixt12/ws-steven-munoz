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
  imports: [CommonModule],
  templateUrl: './kanban-history.component.html',
  styleUrl: './kanban-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanHistoryComponent {
  readonly scrumboardStore = inject(ScrumboardStore);
  readonly config = inject(DynamicDialogConfig);
}
