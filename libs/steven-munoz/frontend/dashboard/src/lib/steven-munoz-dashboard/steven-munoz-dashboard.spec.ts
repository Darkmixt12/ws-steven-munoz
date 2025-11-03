import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StevenMunozDashboard } from './steven-munoz-dashboard';

describe('StevenMunozDashboard', () => {
  let component: StevenMunozDashboard;
  let fixture: ComponentFixture<StevenMunozDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StevenMunozDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(StevenMunozDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
