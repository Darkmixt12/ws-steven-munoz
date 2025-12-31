import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanTable } from './kanban-table.component';
import { provideRouter, RouterModule } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';

jest.mock('@angular/fire/firestore', () => ({
  Firestore: jest.fn(),
  doc: jest.fn(() => ({})),
  docData: jest.fn(() => of({ tickets: [], columns: [] })),
  runTransaction: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
}));


describe('KanbanTable', () => {
  let component: KanbanTable;
  let fixture: ComponentFixture<KanbanTable>;

  (globalThis as any).fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
    })
  );


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanTable, RouterModule],
      providers: [
        provideRouter([]),
        { provide: Firestore, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
