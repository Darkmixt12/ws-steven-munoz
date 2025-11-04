import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentsRoute } from './commentsRoute';

describe('CommentsRoute', () => {
  let component: CommentsRoute;
  let fixture: ComponentFixture<CommentsRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentsRoute],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentsRoute);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
