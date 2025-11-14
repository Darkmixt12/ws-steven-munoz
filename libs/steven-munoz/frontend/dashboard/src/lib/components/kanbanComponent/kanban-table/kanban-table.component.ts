import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';
import { KanbanItemComponent } from '../kanban-item/kanban-item.component';
import { RouterModule } from '@angular/router';
import {
  FireStoreKanbanColumn,
  KanbanColumn,
  KanbanItem,
} from '../../../types/kanban.interface';
import {
  collection,
  collectionData,
  CollectionReference,
  doc,
  docData,
  Firestore,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'steven-munoz-kanban-table.',
  imports: [
    RouterModule,
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    DragDropModule,
    KanbanColumnComponent,
    KanbanItemComponent,
  ],
  templateUrl: './kanban-table.component.html',
  styleUrl: './kanban-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanTable {
  firestore = inject(Firestore);

  testResource = rxResource<any, FireStoreKanbanColumn[] | null>({
    stream: () => {
      const ref = doc(this.firestore, 'board2/scrum');
      return docData(ref);
    },
  });

  constructor() {
    effect(() => {
      console.log('Datos de Firestore:', this.testResource.value());
    });
  }

  columns = signal<KanbanColumn[]>([
    {
      id: '1',
      title: 'To Do',
    },
        {
      id: '2',
      title: 'To Progress',
    },
    {
      id: '3',
      title: 'To End',
    },
  ]);

    items = signal<KanbanItem[]>([
    {
      columnId: '1',
      assignee: 'Laura Gómez',
      description: 'Actualizar el diseño del panel principal.',
      id: '1',
      priority: 'High',
      title: 'Revisión de interfaz',
    },
    {
      columnId: '2',
      assignee: 'Carlos Rivera',
      description: 'Corregir errores en el formulario de registro.',
      id: '2',
      priority: 'Medium',
      title: 'Bug en registro de usuarios',
    },
    {
      columnId: '3',
      assignee: 'Andrea López',
      description: 'Agregar validación al campo de correo electrónico.',
      id: '3',
      priority: 'Low',
      title: 'Validación pendiente',
    },
  ]);

  drop(event: CdkDragDrop<KanbanItem[]>, columnId: string) {
    const { previousIndex, currentIndex, container, previousContainer } = event;

    if (container === previousContainer)
      return moveItemInArray(container.data, previousIndex, currentIndex);

    transferArrayItem(
      previousContainer.data,
      container.data,
      previousIndex,
      currentIndex
    );

    const movedItem = container.data[currentIndex];
    movedItem.columnId = columnId;

  }

  getItemsByColumn(columnId: string) {
  return this.items().filter(item => item.columnId === columnId);
}

  async listDrop(event: CdkDragDrop<undefined>) {
    const { previousIndex, currentIndex } = event;
    moveItemInArray(
      this.testResource.value()?.columns,
      previousIndex,
      currentIndex
    );

    const ref = doc(this.firestore, 'board2', 'scrum');
    const columns = this.testResource.value()?.columns;
    await updateDoc(ref, { columns });
  }
}
