import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ScrumboardStore } from '../../../stores/scrumboardStore';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'steven-munoz-kanban-filter',
  imports: [InputTextModule, SelectModule, ReactiveFormsModule, ButtonModule],
  templateUrl: './kanban-filter.component.html',
  styleUrl: './kanban-filter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanFilterComponent {
  store = inject(ScrumboardStore);

  assigne = signal([
    { name: 'Usuario', key: null },
    { name: 'Andres Peralta', key: 'Andres Peralta' },
    { name: 'Maria', key: 'Maria' },
  ]);

  categories = signal([
    { name: 'Prioridad', key: null },
    { name: 'Low', key: 'Low' },
    { name: 'High', key: 'High' },
    { name: 'Medium', key: 'Medium' },
  ]);

  form = new FormGroup({
    priority: new FormControl({ name: 'Prioridad', key: null }),
    assigne: new FormControl({ name: 'Usuario', key: null }),
  });

  filteredCategories = signal<any[]>([]);

  onSearch(value: string) {
    this.store.updateFilter({ search: value });
  }

  onSellerChange(value: any) {
    this.store.updateFilter({
      seller: value?.key ?? null,
    });
  }

  onPriorityChange(value: any) {
    this.store.updateFilter({
      priority: value?.key ?? null,
    });
  }

  onMinChange(value: string) {
    this.store.updateFilter({
      minValue: value ? Number(value) : null,
    });
  }

  onMaxChange(value: string) {
    this.store.updateFilter({
      maxValue: value ? Number(value) : null,
    });
  }

  onMinAgingChange(value: string) {
    this.store.updateFilter({
      minAging: value ? Number(value) : null,
    });
  }

  onMaxAgingChange(value: string) {
    this.store.updateFilter({
      maxAging: value ? Number(value) : null,
    });
  }

  setAging(min: number | null, max: number | null) {
    this.store.updateFilter({
      minAging: min,
      maxAging: max,
    });
  }

  onResetFilters() {
    this.store.resetFilters();

    this.form.setValue({
      priority: { name: 'Prioridad', key: null },
      assigne: { name: 'Usuario', key: null },
    });
  }

  searchClients(event: any) {
    const query = event.query?.toLowerCase() ?? '';

    const data = this.categories();

    if (!query) {
      this.filteredCategories.set([...data]);
      return;
    }

    this.filteredCategories.set(
      data.filter((c) => c.name.toLowerCase().includes(query))
    );
  }

  isAgingActive(min: number | null, max: number | null) {
    const filters = this.store.filters();

    return filters.minAging === min && filters.maxAging === max;
  }
}
