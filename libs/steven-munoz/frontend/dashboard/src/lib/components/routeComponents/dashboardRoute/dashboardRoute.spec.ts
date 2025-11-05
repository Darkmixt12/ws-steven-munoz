import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardRoute } from './dashboardRoute';
import { provideRouter, RouterModule } from '@angular/router';

describe('DashboardRoute', () => {
  let component: DashboardRoute;
  let fixture: ComponentFixture<DashboardRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRoute,RouterModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardRoute);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
