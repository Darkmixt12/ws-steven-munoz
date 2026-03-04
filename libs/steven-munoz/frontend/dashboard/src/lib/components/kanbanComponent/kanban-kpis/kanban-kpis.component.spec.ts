import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanKpisComponent } from './kanban-kpis.component';

describe('KanbanResumeInfoComponent', () => {
  let component: KanbanKpisComponent;
  let fixture: ComponentFixture<KanbanKpisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanKpisComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanKpisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
