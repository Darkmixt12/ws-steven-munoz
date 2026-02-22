import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';
import { KanbanItemComponent } from '../kanban-item/kanban-item.component';
import { RouterModule } from '@angular/router';
import { KanbanItem } from '../../../types/kanban.interface';

import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { KanbanItemCreateComponent } from '../kanban-item-create/kanban-item.create.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';
import { Firestore } from '@angular/fire/firestore';
import { ScrumboardStore } from '../../../stores/scrumboardStore';

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
  private readonly scrumboardStoreFeature = inject(ScrumboardStore);
  readonly messageService = inject(MessageService);
  dialogService = inject(DialogService);
  firestore = inject(Firestore);

  ref: DynamicDialogRef | null = null;
  readonly columns = computed(
    () => this.scrumboardStoreFeature.boardResource.value()?.columns ?? []
  );

  readonly tickets = computed(
    () => this.scrumboardStoreFeature.boardResource.value()?.tickets ?? []
  );

  openHistory(event: { ticketId: number }) {
    this.scrumboardStoreFeature.openHistoryDialog({
      ticketId: event.ticketId,
      columns: this.columns(),
    });
  }

  getItemsByColumn(columnId: number) {
    return (this.tickets() ?? []).filter(
      (item: KanbanItem) => item.columnId === columnId
    );
  }

  listDrop(event: CdkDragDrop<any>) {
    this.scrumboardStoreFeature.reorderColumns(
      event.previousIndex,
      event.currentIndex
    );
  }

  drop(event: CdkDragDrop<KanbanItem[]>, columnId: number) {
    this.scrumboardStoreFeature.drop(event, columnId);
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
        this.scrumboardStoreFeature.deleteScrumboardItem(payload.id);
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
    return this.scrumboardStoreFeature
      .tickets()
      .filter((item) => item.columnId === columnId).length;
  }

  isWipExceeded(columnId: number): boolean {
    const column = this.scrumboardStoreFeature
      .columns()
      .find((c) => c.id === columnId);

    if (!column?.wipLimit) return false;

    return this.getItemsCount(columnId) > column.wipLimit;
  }

  getColumnTotalProposal(columnId: number): number {
    return this.getItemsByColumn(columnId).reduce(
      (total: number, item: KanbanItem) => total + (item.proposal ?? 0),
      0
    );
  }
}
