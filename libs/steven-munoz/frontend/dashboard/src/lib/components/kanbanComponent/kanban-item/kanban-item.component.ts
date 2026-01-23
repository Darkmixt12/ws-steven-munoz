import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  input,
  Output,
} from '@angular/core';
import { KanbanItem } from '../../../types/kanban.interface';
import { CommonModule } from '@angular/common';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

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
  imports: [CommonModule, ChipModule, ConfirmDialogModule, ToastModule, ButtonModule, PopoverModule],
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

@Input() ticket!: KanbanItem
@Output() delete = new EventEmitter<{event: Event, id: number | undefined}>()
@Output() edit = new EventEmitter<{event: Event, id: KanbanItem}>()



onEdit(popover: any, event: Event, item: KanbanItem) {
  popover.hide();
  this.edit.emit({event, id: item})
}

onDelete(popover: any, event: Event, id: number | undefined) {
  popover.hide();
  this.confirmDelete(event,id)
}


//! CONFIRMATION DIALOG 

    confirmDelete(event: Event, id: number | undefined){
        this.delete.emit({event, id: this.ticket.id})
    }










}
