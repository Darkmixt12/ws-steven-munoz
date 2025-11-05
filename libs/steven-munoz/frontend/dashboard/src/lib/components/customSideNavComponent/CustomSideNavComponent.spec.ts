import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomSideNavComponent } from './CustomSideNavComponent';
import { provideRouter, RouterModule } from '@angular/router';

describe('CustomSideNavComponent', () => {
  let component: CustomSideNavComponent;
  let fixture: ComponentFixture<CustomSideNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomSideNavComponent, RouterModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomSideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
