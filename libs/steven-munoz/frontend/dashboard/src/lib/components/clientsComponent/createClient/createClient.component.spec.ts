import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateClientComponent } from './createClient.component';
import { Firestore } from '@angular/fire/firestore';

describe('CreateClientComponent', () => {
  let component: CreateClientComponent;
  let fixture: ComponentFixture<CreateClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateClientComponent],
      providers: [{
        provide: Firestore,
        useValue: {}
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
