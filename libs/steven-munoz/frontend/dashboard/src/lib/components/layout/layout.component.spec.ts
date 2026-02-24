import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutComponent } from './layout.component';
import { Firestore } from '@angular/fire/firestore';
import { ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { provideRouter, RouterModule } from '@angular/router';

describe('Layout', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  const firestoreMock = {
    collection: jest.fn(),
    doc: jest.fn(),
  };

  const confirmationServiceMock = {
    requireConfirmation$: new Subject<any>(),
    acceptConfirmation$: new Subject<any>(),
    confirm: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent, RouterModule],

      providers: [
        provideRouter([]), ConfirmationService,
        {
          provide: Firestore,
          useValue: firestoreMock,
        },
        {
          provide: ConfirmationService,
          useValue: confirmationServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
