import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  output,
  Output,
} from '@angular/core';
import { KanbanItem } from '../../../types/kanban.interface';
import { CommonModule } from '@angular/common';
import { ChipModule } from 'primeng/chip';

import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';

const statusMapperColors = {
  Medium: 'bg-yellow-200',
  High: 'bg-red-200',
  Low: 'bg-green-200',
};

const statusMapperText = {
  Medium: 'Media',
  High: 'Alta',
  Low: 'Baja',
};

@Component({
  selector: 'steven-munoz-kanban-item',
  imports: [CommonModule, ChipModule, ToastModule, ButtonModule, PopoverModule],
  standalone: true,
  templateUrl: './kanban-item.component.html',
  styleUrl: './kanban-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanItemComponent {
  item = input.required<KanbanItem>();

  color = computed(() => {
    return statusMapperColors[this.item().priority];
  });

  statusText = computed(() => {
    return statusMapperText[this.item().priority];
  });

  priorityColor(priority: 'Low' | 'Medium' | 'High') {
    return {
      Low: 'priority-low',
      Medium: 'priority-medium',
      High: 'priority-high',
    }[priority];
  }

  ticket = input<KanbanItem>;
  delete = output<{event: Event;id: number | undefined}>();
  edit = output<{event: Event;id: KanbanItem}>();
  history = output<{event: Event;id: number | undefined}>();

  onEdit(popover: any, event: Event, item: KanbanItem) {
    popover.hide();
    this.edit.emit({ event, id: item });
  }

  onDelete(popover: any, event: Event, id: number | undefined) {
    event.stopPropagation();
    event.preventDefault();
    this.delete.emit({ event, id });
    popover.hide();
  }

  onHistory(popover: any, event: Event, id: number | undefined) {
    event.stopPropagation();
    event.preventDefault();
    this.history.emit({ event, id });
    popover.hide();
  }
}
