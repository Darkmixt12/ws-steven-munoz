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
  KanbanItem,
} from '../../../types/kanban.interface';
import {
  collection,
  doc,
  docData,
  Firestore,
  runTransaction,
  Timestamp,
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
import { KanbanHistoryComponent } from '../kanban-history/kanban-history.component';
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
  readonly confirmationService = inject(ConfirmationService);
  readonly scrumboardStore = inject(DocumentsStore);
  readonly messageService = inject(MessageService);
  dialogService = inject(DialogService);
  store = inject(DocumentsStore);
  firestore = inject(Firestore);

  ref: DynamicDialogRef | null = null;

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

async drop(event: CdkDragDrop<KanbanItem[]>, columnId: number) {
  const { previousIndex, currentIndex, container, previousContainer } = event;


  if (container === previousContainer) {
    moveItemInArray(container.data, previousIndex, currentIndex);
    return;
  }

  const board = this.testResource.value();
  if (!board) return;

  const targetColumn = board.columns.find( (c: KanbanItem) => c.id === columnId);
  const wipLimit = targetColumn?.wipLimit;


  if (wipLimit && container.data.length + 1 > wipLimit) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Límite WIP excedido',
      detail: `Máximo permitido: ${wipLimit}`,
      life: 3000,
    });
  }

  // Movimiento visual inmediato
  transferArrayItem(
    previousContainer.data,
    container.data,
    previousIndex,
    currentIndex
  );

  const movedItem = container.data[currentIndex];
  const previousColumnId = movedItem.columnId;

  if (previousColumnId === columnId) return;

  movedItem.columnId = columnId;

  const boardRef = doc(this.firestore, 'board2/scrum');
  const historyRef = collection(this.firestore, 'ticketHistory');

  await runTransaction(this.firestore, async transaction => {
    const boardSnap = await transaction.get(boardRef);
    if (!boardSnap.exists()) return;

    const boardData = boardSnap.data() as Board;

    // 🔄 Actualizar ticket
    const updatedTickets = boardData.tickets.map(t =>
      t.id === movedItem.id ? { ...t, columnId } : t
    );

    transaction.update(boardRef, { tickets: updatedTickets });

    transaction.set(doc(historyRef), {
      ticketId: movedItem.id,
      boardId: 'scrum',
      field: 'columnId',
      oldValue: previousColumnId,
      newValue: columnId,
      changedAt: Timestamp.now(),
    });
  });
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

  openHistoryDialog(payload: { event: Event; id: number | undefined }) {
    this.ref = this.dialogService.open(KanbanHistoryComponent, {
      transitionOptions: '300ms ease-in-out',
      data: { item: payload.id, columns: this.testResource.value().columns ?? []},
      header: 'History Item',
      width: '20vw',
      height: '50vh',
      closable: true,
      modal: true,
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

  getColumnTotalProposal(columnId: number): number {
    return this.getItemsByColumn(columnId).reduce(
      (total: number, item: KanbanItem) => total + (item.proposal ?? 0),
      0
    );
  }
}
