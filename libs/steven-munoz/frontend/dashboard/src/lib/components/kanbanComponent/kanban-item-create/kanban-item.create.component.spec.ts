import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanItemCreateComponent } from './kanban-item.create.component';
import { Firestore } from '@angular/fire/firestore';
import {
  DynamicDialogConfig,
  DynamicDialogRef,
  DialogService,
} from 'primeng/dynamicdialog';

describe('KanbanItemCreateComponent', () => {
  let component: KanbanItemCreateComponent;
  let fixture: ComponentFixture<KanbanItemCreateComponent>;

  const firestoreMock = {
    collection: jest.fn(),
    doc: jest.fn(),
  };

  const dialogConfigMock = {
    data: {},
  };

  const dialogRefMock = {
    close: jest.fn(),
  };

  const dialogServiceMock = {
    open: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanItemCreateComponent],
      providers: [
        {
          provide: Firestore,
          useValue: firestoreMock,
        },
        {
          provide: DynamicDialogConfig,
          useValue: dialogConfigMock,
        },
        {
          provide: DynamicDialogRef,
          useValue: dialogRefMock,
        },
        {
          provide: DialogService,
          useValue: dialogServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanItemCreateComponent);
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
