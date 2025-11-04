import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentRoute } from './contentRoute';

describe('ContentRoute', () => {
  let component: ContentRoute;
  let fixture: ComponentFixture<ContentRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentRoute],
    }).compileComponents();

    fixture = TestBed.createComponent(ContentRoute);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
