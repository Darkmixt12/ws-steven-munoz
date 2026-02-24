import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientsDashboardComponent } from './clientsDashboard.component';
import { ClientsStore } from '../../../stores/clientsStore'; // ajusta path
import { signal } from '@angular/core';

describe('ClientsDashboardComponent', () => {
  let component: ClientsDashboardComponent;
  let fixture: ComponentFixture<ClientsDashboardComponent>;

  const clientsStoreMock = {
    getClientsResource: {
      value: signal([]),
    },
    loadClients: jest.fn(),
    deleteClient: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsDashboardComponent],
      providers: [
        {
          provide: ClientsStore,
          useValue: clientsStoreMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientsDashboardComponent);
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
