import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanItemComponent } from './kanban-item.component';
import { KanbanItem } from '../../../types/kanban.interface';

describe('KanbanItem', () => {
  let component: KanbanItemComponent;
  let fixture: ComponentFixture<KanbanItemComponent>;

    const mockItem: KanbanItem = {
    assignee: 'Test Steven',
    description: 'Study',
    id: '1',
    priority: 'High',
    title: 'Test Pass'
  }


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', mockItem)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
