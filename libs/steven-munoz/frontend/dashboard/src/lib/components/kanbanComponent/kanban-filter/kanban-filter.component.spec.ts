import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanFilterComponent } from './kanban-filter.component';

describe('KanbanFilterComponent', () => {
  let component: KanbanFilterComponent;
  let fixture: ComponentFixture<KanbanFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
