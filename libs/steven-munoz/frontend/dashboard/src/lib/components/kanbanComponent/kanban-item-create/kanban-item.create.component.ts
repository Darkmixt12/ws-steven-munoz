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
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { DocumentsStore } from '../../../stores/scrumboardStore';
import { KanbanForm, KanbanItem } from '../../../types/kanban.interface';
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

  constructor() {
    effect(() => {
      console.log('Clientes cargados:', this.clientsStore());
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
    let id = 1;
    const newItem: KanbanItem = {
      ...this.exampleForm.getRawValue(),
      id,
    };
    this.Scrumstore.newScrumItem(newItem);
  }
}
