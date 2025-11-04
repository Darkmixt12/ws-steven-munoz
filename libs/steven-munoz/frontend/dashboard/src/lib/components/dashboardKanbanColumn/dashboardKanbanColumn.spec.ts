import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardKanbanColumn } from './dashboardKanbanColumn';

describe('DashboardKanbanColumn', () => {
  let component: DashboardKanbanColumn;
  let fixture: ComponentFixture<DashboardKanbanColumn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardKanbanColumn],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardKanbanColumn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
