import { Subject } from 'rxjs';

// Los mocks van antes de los imports reales, como en las pruebas de los stores.
jest.mock('@angular/fire/auth', () => ({
  Auth: class Auth {},
  signInWithEmailAndPassword: jest.fn(),
  user: jest.fn(() => new Subject()),
}));

jest.mock('@angular/fire/firestore', () => ({
  Firestore: class Firestore {},
  doc: jest.fn(),
  docData: jest.fn(() => new Subject()),
}));

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { PanelEntry } from 'tienda/admin-session';
import type { EmployeeStatus } from 'tienda/domain';
import { AdminLogin } from './admin-login';

const signInMock = signInWithEmailAndPassword as jest.Mock;

let fixture: ComponentFixture<AdminLogin>;
let component: AdminLogin;
let router: Router;
let enter: jest.Mock;

function setup(): void {
  enter = jest.fn<Promise<EmployeeStatus>, []>();

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      providePrimeNG({ theme: { preset: Aura } }),
      { provide: Auth, useValue: {} },
      { provide: PanelEntry, useValue: { enter } },
    ],
  });

  fixture = TestBed.createComponent(AdminLogin);
  component = fixture.componentInstance;
  router = TestBed.inject(Router);
  jest.spyOn(router, 'navigate').mockResolvedValue(true);
  fixture.detectChanges();
}

function fillCredentials(): void {
  component.email.set('persona@example.com');
  component.password.set('secreta');
}

afterEach(() => {
  jest.clearAllMocks();
  TestBed.resetTestingModule();
});

describe('AdminLogin', () => {
  it('llama a enterPanel tras autenticar y entra al Panel si quedó Activo', async () => {
    setup();
    signInMock.mockResolvedValue({});
    enter.mockResolvedValue('active');
    fillCredentials();

    await component.submit();

    expect(signInMock).toHaveBeenCalledWith(
      expect.anything(),
      'persona@example.com',
      'secreta'
    );
    expect(enter).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('manda a «sin acceso» a quien todavía está Invitado', async () => {
    setup();
    signInMock.mockResolvedValue({});
    enter.mockResolvedValue('invited');
    fillCredentials();

    await component.submit();

    expect(router.navigate).toHaveBeenCalledWith(['/admin/sin-acceso']);
  });

  it('no llama a enterPanel si la autenticación falla', async () => {
    setup();
    signInMock.mockRejectedValue(new Error('auth/wrong-password'));
    fillCredentials();

    await component.submit();

    expect(enter).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('da el mismo mensaje sin revelar si el correo es de un Empleado', async () => {
    setup();
    signInMock.mockRejectedValue(new Error('auth/user-not-found'));
    fillCredentials();
    await component.submit();
    const unknownAccount = component.error();

    signInMock.mockRejectedValue(new Error('auth/wrong-password'));
    await component.submit();

    expect(unknownAccount).not.toBeNull();
    expect(component.error()).toBe(unknownAccount);
  });

  it('no deja el formulario ocupado cuando algo falla', async () => {
    setup();
    signInMock.mockRejectedValue(new Error('auth/network-request-failed'));
    fillCredentials();

    await component.submit();

    expect(component.busy()).toBe(false);
  });

  it('avisa cuando enterPanel falla, aunque la autenticación haya salido bien', async () => {
    setup();
    signInMock.mockResolvedValue({});
    enter.mockRejectedValue(new Error('permission-denied'));
    fillCredentials();

    await component.submit();

    expect(component.error()).not.toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
