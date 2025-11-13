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
      tickets: [
        {
          assignee: 'Laura Gómez',
          description: 'Actualizar el diseño del panel principal.',
          id: '1',
          priority: 'High',
          title: 'Revisión de interfaz',
        },
        {
          assignee: 'Carlos Rivera',
          description: 'Corregir errores en el formulario de registro.',
          id: '2',
          priority: 'Medium',
          title: 'Bug en registro de usuarios',
        },
        {
          assignee: 'Andrea López',
          description: 'Agregar validación al campo de correo electrónico.',
          id: '3',
          priority: 'Low',
          title: 'Validación pendiente',
        },
      ],
    },
    {
      id: '2',
      title: 'In Progress',
      tickets: [
        {
          assignee: 'Laura Gómez',
          description:
            'Refactorizar los componentes del dashboard para mejorar la legibilidad.',
          id: '1',
          priority: 'High',
          title: 'Refactor del panel principal',
        },
        {
          assignee: 'Carlos Rivera',
          description: 'Implementar control de permisos por rol de usuario.',
          id: '2',
          priority: 'Medium',
          title: 'Gestión de roles y permisos',
        },
        {
          assignee: 'Fernanda Ruiz',
          description: 'Revisar los tests unitarios y cubrir casos faltantes.',
          id: '3',
          priority: 'Low',
          title: 'Cobertura de tests',
        },
        {
          assignee: 'Miguel Torres',
          description: 'Diseñar las vistas del nuevo módulo de reportes.',
          id: '4',
          priority: 'High',
          title: 'Diseño del módulo de reportes',
        },
      ],
    },
    {
      id: '3',
      title: 'In Done',
      tickets: [
        {
          assignee: 'Andrea López',
          description:
            'Se implementó la funcionalidad de recuperación de contraseña.',
          id: '1',
          priority: 'Medium',
          title: 'Recuperación de contraseña lista',
        },
        {
          assignee: 'José Ramírez',
          description:
            'Se corrigió el bug que afectaba la carga de imágenes en el perfil.',
          id: '2',
          priority: 'Low',
          title: 'Bug de carga de imágenes resuelto',
        },
        {
          assignee: 'Sofía Morales',
          description:
            'El sistema de notificaciones push ya fue integrado correctamente.',
          id: '3',
          priority: 'High',
          title: 'Integración de notificaciones finalizada',
        },
      ],
    },
  ]);

  drop(event: CdkDragDrop<KanbanItem[]>) {
    const { previousIndex, currentIndex, container, previousContainer } = event;

    if (container === previousContainer)
      return moveItemInArray(container.data, previousIndex, currentIndex);

    transferArrayItem(
      previousContainer.data,
      container.data,
      previousIndex,
      currentIndex
    );
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
