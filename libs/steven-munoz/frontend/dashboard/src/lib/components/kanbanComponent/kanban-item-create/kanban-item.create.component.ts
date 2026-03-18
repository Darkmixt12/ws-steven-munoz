import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonModule } from '@angular/common';
import { ClientsStore } from '../../../stores/clientsStore';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { ScrumboardStore } from '../../../stores/scrumboardStore';
import { KanbanForm, KanbanItem } from '../../../types/kanban.interface';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
  addDoc,
  collection,
  Firestore,
  serverTimestamp,
} from '@angular/fire/firestore';

interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'kaban-item-create',
  imports: [
    CommonModule,
    MessageModule,
    AutoCompleteModule,
    ButtonModule,
    FormsModule,
    InputTextModule,
    InputNumber,
    RadioButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './kanban-item.create.component.html',
  styleUrl: './kanban-item.create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanItemCreateComponent {
  readonly dialogConfig = inject(DynamicDialogConfig);
  readonly scrumboardStore = inject(ScrumboardStore);
  readonly dialogRef = inject(DynamicDialogRef);
  readonly clientstore = inject(ClientsStore);
  readonly firestore = inject(Firestore);
  readonly fb = inject(FormBuilder);

  clientsStore = this.clientstore.getClientsResource.value;

  filteredClients = signal<any[]>([]);
  selectedClient = signal<any>(null);
  clients = signal<any[]>([]);

  formSubmitted: boolean = false;
  editingItem?: KanbanItem;
  isEditMode = false;
  saving = false;

  // FORMULARIO PARA CREAR Y EDITAR EN UNO SOLO

  constructor() {
    effect(() => {
      this.editingItem = this.dialogConfig.data?.item;
      this.isEditMode = !!this.editingItem;

      if (this.isEditMode) {
        this.exampleForm.patchValue(this.editingItem!);
      }
    });
  }

  public exampleForm = this.fb.nonNullable.group<KanbanForm>({
    priority: 'Low',
    client: '',
    proposal: 0,
    title: '',
    description: '',
    columnId: 1,
    assignee: 'Andres Peralta',
    isDeleted: false,
  });

  searchClients(event: any) {
    const query = event.query.toLowerCase();
    this.filteredClients.set(
      this.clientsStore()!.filter((c) => c.name.toLowerCase().includes(query))
    );
  }

  categories: any[] = [
    { name: 'Baja', key: 'Low' },
    { name: 'Alta', key: 'High' },
    { name: 'Media', key: 'Medium' },
  ];

  isInvalid(controlName: string) {
    const control = this.exampleForm.get(controlName);
    return control?.invalid && this.formSubmitted;
  }

  async submit() {
    this.formSubmitted = true;
    if (this.exampleForm.invalid) return;

    const formValue: KanbanForm = this.exampleForm.getRawValue();

    if (this.isEditMode && this.editingItem) {
      this.scrumboardStore.updateScrumboardItem({
        id: this.editingItem.id,
        changes: formValue,
      });
    } else {
      this.scrumboardStore.createScrumboardItem(formValue);
    }

    this.dialogRef.close(true);
  }

  private async trackChanges(oldItem: KanbanItem, newItem: KanbanItem) {
    const historyRef = collection(this.firestore, 'ticketHistory');

    if (oldItem.columnId !== newItem.columnId) {
      addDoc(historyRef, {
        boardId: 'scrum',
        ticketId: oldItem.id,
        field: 'columnId',
        oldValue: oldItem.columnId,
        newValue: newItem.columnId,
        changedAt: serverTimestamp(),
        userId: 'steven',
      });
    }

    if (oldItem.proposal !== newItem.proposal) {
      addDoc(historyRef, {
        boardId: 'scrum',
        ticketId: oldItem.id,
        field: 'proposal',
        oldValue: oldItem.proposal,
        newValue: newItem.proposal,
        changedAt: serverTimestamp(),
        userId: 'steven',
      });
    }
  }
}
