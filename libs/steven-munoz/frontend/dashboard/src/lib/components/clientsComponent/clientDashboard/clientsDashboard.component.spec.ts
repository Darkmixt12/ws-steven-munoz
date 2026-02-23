import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientsDashboardComponent } from './clientsDashboard.component';

describe('ClientsDashboardComponent', () => {
  let component: ClientsDashboardComponent;
  let fixture: ComponentFixture<ClientsDashboardComponent>;
  

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
