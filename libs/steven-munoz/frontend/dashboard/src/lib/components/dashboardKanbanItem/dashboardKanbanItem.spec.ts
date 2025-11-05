import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardKanbanItem } from './dashboardKanbanItem';
import { KanbanItem } from '../../interfaces/kanban.interface';

describe('DashboardKanbanItem', () => {
  let component: DashboardKanbanItem;
  let fixture: ComponentFixture<DashboardKanbanItem>;

  const mockItem: KanbanItem = {
    assignee: 'Test Steven',
    description: 'Study',
    id: '1',
    priority: 'High',
    title: 'Test Pass'
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardKanbanItem],

    }).compileComponents();

    fixture = TestBed.createComponent(DashboardKanbanItem);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', mockItem)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
