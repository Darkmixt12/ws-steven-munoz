import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanItemCreateComponent } from './kanban-item.create.component';

describe('KanbanItemCreateComponent', () => {
  let component: KanbanItemCreateComponent;
  let fixture: ComponentFixture<KanbanItemCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanItemCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanItemCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
