import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanItemComponent } from './kanban-item.component';
import { KanbanItem } from '../../../types/kanban.interface';
import { DialogService } from 'primeng/dynamicdialog';

describe('KanbanItemComponent', () => {
  let component: KanbanItemComponent;
  let fixture: ComponentFixture<KanbanItemComponent>;

  const mockItem: KanbanItem = {
    proposal: 1500,
    assignee: 'Test Steven',
    columnId: 1,
    description: 'Study',
    id: 1,
    priority: 'High',
    title: 'Test Pass',
  };

  const dialogServiceMock = {
    open: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanItemComponent],
      providers: [
        {
          provide: DialogService,
          useValue: dialogServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanItemComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('ticket', mockItem);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should receive the ticket input correctly', () => {
    expect(component.ticket()).toEqual(mockItem);
  });
});
