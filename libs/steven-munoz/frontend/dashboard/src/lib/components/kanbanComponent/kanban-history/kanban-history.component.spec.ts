import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanHistoryComponent } from './kanban-history.component';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

describe('KanbanHistoryComponent', () => {
  let component: KanbanHistoryComponent;
  let fixture: ComponentFixture<KanbanHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanHistoryComponent],
      providers: [
        {
          provide: DynamicDialogConfig,
          useValue: {
            data: {
              history: [],
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
