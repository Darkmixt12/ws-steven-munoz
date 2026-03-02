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
  clientstore = inject(ClientsStore);
  scrumboardStore = inject(ScrumboardStore);

  readonly firestore = inject(Firestore);

  clientsStore = this.clientstore.getClientsResource.value;
  readonly fb = inject(FormBuilder);

  selectedClient = signal<any>(null);
  filteredClients = signal<any[]>([]);
  clients = signal<any[]>([]);

  ingredient!: string;
  formSubmitted: boolean = false;

  // FORMULARIO PARA CREAR Y EDITAR EN UNO SOLO
  isEditMode = false;
  editingItem?: KanbanItem;
  saving = false;
  readonly dialogConfig = inject(DynamicDialogConfig);
  readonly dialogRef = inject(DynamicDialogRef);

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
      await addDoc(historyRef, {
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
      await addDoc(historyRef, {
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
