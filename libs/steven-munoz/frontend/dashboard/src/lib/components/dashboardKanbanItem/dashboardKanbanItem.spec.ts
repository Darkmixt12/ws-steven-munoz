import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardKanbanItem } from './dashboardKanbanItem';

describe('DashboardKanbanItem', () => {
  let component: DashboardKanbanItem;
  let fixture: ComponentFixture<DashboardKanbanItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardKanbanItem],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardKanbanItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
