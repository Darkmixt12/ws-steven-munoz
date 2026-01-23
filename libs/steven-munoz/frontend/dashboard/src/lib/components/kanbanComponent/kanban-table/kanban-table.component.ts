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
} from '@angular/core';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';
import { KanbanItemComponent } from '../kanban-item/kanban-item.component';
import { RouterModule } from '@angular/router';
import {
  Board,
  FireStoreKanbanColumn,
  KanbanColumn,
  KanbanItem,
} from '../../../types/kanban.interface';
import {
  doc,
  docData,
  Firestore,
  runTransaction,
} from '@angular/fire/firestore';
import { rxResource } from '@angular/core/rxjs-interop';
import { DocumentsStore } from '../../../stores/scrumboardStore';

import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { KanbanItemCreateComponent } from '../kanban-item-create/kanban-item.create.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'steven-munoz-kanban-table.',
  imports: [
    CommonModule,
    RouterModule,
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    DragDropModule,
    KanbanColumnComponent,
    KanbanItemComponent,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [DialogService, MessageService],
  templateUrl: './kanban-table.component.html',
  styleUrl: './kanban-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanTable {
  firestore = inject(Firestore);
  store = inject(DocumentsStore);
  dialogService = inject(DialogService);
  ref: DynamicDialogRef | null = null;
  readonly scrumboardStore = inject(DocumentsStore);
  readonly messageService = inject(MessageService);
  readonly confirmationService = inject(ConfirmationService);

  testResource = rxResource<any, FireStoreKanbanColumn[] | null>({
    stream: () => {
      const ref = doc(this.firestore, 'board2/scrum');
      return docData(ref);
    },
  });

  constructor() {
    console.log('ConfirmationService instance', this.confirmationService);
    effect(() => {
      console.log('Datos de Firestore:', this.testResource.value());
    });
  }

  async drop(event: CdkDragDrop<KanbanItem[]>, columnId: number) {
    const { previousIndex, currentIndex, container, previousContainer } = event;

    if (container === previousContainer)
      return moveItemInArray(container.data, previousIndex, currentIndex);

    const board = this.testResource.value();
    const targetColumn = board?.columns.find((c: KanbanItem) => c.id === columnId);
    const wipLimit = targetColumn?.wipLimit;

    const itemsInTargetColumn = container.data.length;

    if (wipLimit && itemsInTargetColumn + 1 > wipLimit) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Límite WIP excedido',
        detail: `Esta columna permite máximo ${wipLimit} items`,
        life: 3000,
      });
    }

    transferArrayItem(
      previousContainer.data,
      container.data,
      previousIndex,
      currentIndex
    );

    const movedItem = container.data[currentIndex];
    movedItem.columnId = columnId;

    const boardRef = doc(this.firestore, 'board2/scrum');

    await runTransaction(this.firestore, async (transaction) => {
      const boardSnap = await transaction.get(boardRef);

      if (!boardSnap.exists()) return;

      const board = boardSnap.data() as Board;

      const updatedTickets = board.tickets.map((t: KanbanItem) =>
        t.id === movedItem.id ? { ...t, columnId } : t
      );

      // ACTUALIZA DENTRO DE LA TRANSACCIÓN
      transaction.update(boardRef, { tickets: updatedTickets });
    });
  }

  getItemsByColumn(columnId: number) {
    return (this.testResource.value()?.tickets ?? []).filter(
      (item: KanbanItem) => item.columnId === columnId
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

    this.store.updateDoc({ ref, data: columns });
  }

  openCreateDialog() {
    this.ref = this.dialogService.open(KanbanItemCreateComponent, {
      transitionOptions: '300ms ease-in-out',
      data: { item: null },
      header: 'Crear Nuevo Item',
      width: '20vw',
      height: '50vh',
      closable: true,
      modal: true,
    });
  }

  openEditDialog(payload: { event: Event; id: KanbanItem }) {
    this.ref = this.dialogService.open(KanbanItemCreateComponent, {
      transitionOptions: '300ms ease-in-out',
      data: { item: payload.id },
      header: 'Editar Item',
      width: '20vw',
      height: '50vh',
      closable: true,
      modal: true,
    });
  }

  openDeleteDialog(payload: { event: Event; id: number | undefined }) {
    this.confirmationService.confirm({
      message: 'Realmente quiere eliminar este registro?',
      header: 'Cuidado',
      icon: 'pi pi-info-circle',

      rejectLabel: 'Cancelar',
      rejectButtonProps: {
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        severity: 'danger',
      },

      accept: () => {
        this.scrumboardStore.firestoreService.deleteScrumboardItem(payload.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Confirmado',
          detail: 'Has eliminado el ticket con exito',
        });
      },

      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Has cancelado la eliminación',
        });
      },
    });
  }

  //! WIP LIMITE DE ITEMS POR COLUMNA

  getItemsCount(columnId: number): number {
    return this.testResource
      .value()
      .filter((item: KanbanItem) => item.columnId === columnId).length;
  }

isWipExceeded(columnId: number): boolean {
  const column = this.testResource
    .value()
    ?.columns.find((c: KanbanItem) => c.id === columnId);

  if (!column?.wipLimit) return false;

  return this.getItemsByColumn(columnId).length > column.wipLimit;
}


  
}
