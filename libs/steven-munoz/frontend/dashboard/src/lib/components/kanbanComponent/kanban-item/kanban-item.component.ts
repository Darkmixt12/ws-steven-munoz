import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { KanbanItem } from '../../../types/kanban.interface';

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
  imports: [],
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


}
