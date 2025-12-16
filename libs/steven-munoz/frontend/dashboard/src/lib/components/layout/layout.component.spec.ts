import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutComponent } from './layout.component';
import { provideRouter, RouterModule } from '@angular/router';

jest.mock('@angular/fire/firestore', () => ({
  collection: jest.fn(),
  collectionData: jest.fn(),
  Firestore: jest.fn(),
}));
describe('Layout', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent, RouterModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
