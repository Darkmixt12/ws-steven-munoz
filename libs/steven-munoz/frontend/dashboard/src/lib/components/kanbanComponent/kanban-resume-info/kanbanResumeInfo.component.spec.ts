import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanResumeInfoComponent } from './kanbanResumeInfo.component';

describe('KanbanResumeInfoComponent', () => {
  let component: KanbanResumeInfoComponent;
  let fixture: ComponentFixture<KanbanResumeInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanResumeInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanResumeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
