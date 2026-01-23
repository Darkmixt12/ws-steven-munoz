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
import { DocumentsStore } from '../../../stores/scrumboardStore';
import { KanbanForm, KanbanItem } from '../../../types/kanban.interface';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

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
  Scrumstore = inject(DocumentsStore);

  clientsStore = this.clientstore.getClientsSignal();
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

  submit() {
    this.formSubmitted = true;
    if (this.exampleForm.invalid) return;

    this.saving= true;

    const payload: KanbanItem = {
      ...this.editingItem, // conserva id y cosas no editables
      ...this.exampleForm.getRawValue(),
    };

setTimeout(()=> {
    this.isEditMode
      ? this.Scrumstore.updateScrumItem(payload)
      : this.Scrumstore.newScrumItem({
          ...payload,
          id: 1,
        });

    this.dialogRef.close(true);

}, 400)


  }
}
