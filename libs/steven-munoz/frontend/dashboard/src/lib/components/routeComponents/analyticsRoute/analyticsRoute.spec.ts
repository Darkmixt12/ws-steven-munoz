import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyticsRoute } from './analyticsRoute';

describe('AnalyticsRoute', () => {
  let component: AnalyticsRoute;
  let fixture: ComponentFixture<AnalyticsRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsRoute],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsRoute);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
