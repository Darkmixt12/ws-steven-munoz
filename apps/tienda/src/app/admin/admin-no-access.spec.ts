import { Subject } from 'rxjs';

// Los mocks van antes de los imports reales, como en `admin-login.spec.ts`.
jest.mock('@angular/fire/auth', () => ({
  Auth: class Auth {},
  sendEmailVerification: jest.fn(),
  signOut: jest.fn(),
  user: jest.fn(() => new Subject()),
}));

jest.mock('@angular/fire/firestore', () => ({
  Firestore: class Firestore {},
  doc: jest.fn(),
  docData: jest.fn(() => new Subject()),
}));

import { signal, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import {
  Auth,
  sendEmailVerification,
  signOut,
  type User,
} from '@angular/fire/auth';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { PanelSessionStore } from 'tienda/admin-session';
import type { Employee, EmployeeStatus, Role } from 'tienda/domain';
import { AdminNoAccess } from './admin-no-access';

const sendEmailVerificationMock = sendEmailVerification as jest.Mock;
const signOutMock = signOut as jest.Mock;

let fixture: ComponentFixture<AdminNoAccess>;
let component: AdminNoAccess;
let router: Router;
let currentUser: WritableSignal<User | null | undefined>;
let employee: WritableSignal<Employee | null | undefined>;

const timestamp = {
  seconds: 0,
  nanoseconds: 0,
  toDate: () => new Date(0),
  toMillis: () => 0,
};

function authUser(emailVerified: boolean): User {
  return { uid: 'u1', email: 'persona@example.com', emailVerified } as User;
}

function employeeDoc(
  status: EmployeeStatus,
  role: Role = 'operator'
): Employee {
  return {
    email: 'persona@example.com',
    name: 'Persona',
    phone: null,
    role,
    status,
    statusReason: null,
    invitedBy: 'administrator-1',
    invitedAt: timestamp,
    statusChangedAt: timestamp,
    lastPanelEntryAt: timestamp,
    anonymizedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Por omisión monta la sesión que *sí* tendría acceso, para que cada prueba
 * cambie una sola cosa. `'user' in options` distingue «no lo pasaron» de
 * «lo pasaron en `undefined`», que en este store significa «todavía cargando».
 */
function setup(
  options: {
    user?: User | null | undefined;
    employee?: Employee | null | undefined;
  } = {}
): void {
  currentUser = signal('user' in options ? options.user : authUser(true));
  employee = signal(
    'employee' in options ? options.employee : employeeDoc('active')
  );

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      providePrimeNG({ theme: { preset: Aura } }),
      { provide: Auth, useValue: {} },
      // El doble deja fuera Firestore y Auth de verdad: al componente solo le
      // importan estas dos señales del store.
      { provide: PanelSessionStore, useValue: { currentUser, employee } },
    ],
  });

  fixture = TestBed.createComponent(AdminNoAccess);
  component = fixture.componentInstance;
  router = TestBed.inject(Router);
  jest.spyOn(router, 'navigate').mockResolvedValue(true);
  fixture.detectChanges();
}

/** Los `<p-button>` que la plantilla está mostrando ahora mismo. */
function buttons(): NodeListOf<Element> {
  return (fixture.nativeElement as HTMLElement).querySelectorAll('p-button');
}

beforeEach(() => {
  sendEmailVerificationMock.mockResolvedValue(undefined);
  signOutMock.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.clearAllMocks();
  TestBed.resetTestingModule();
});

describe('AdminNoAccess', () => {
  describe('needsVerification()', () => {
    it('avisa cuando el correo de la sesión no está verificado', () => {
      setup({ user: authUser(false) });

      expect(component.needsVerification()).toBe(true);
    });

    it('no avisa cuando el correo está verificado', () => {
      setup({ user: authUser(true) });

      expect(component.needsVerification()).toBe(false);
    });

    it('no avisa cuando no hay sesión', () => {
      setup({ user: null });

      expect(component.needsVerification()).toBe(false);
    });
  });

  describe('reason()', () => {
    it('pide verificar el correo antes que cualquier otro motivo', () => {
      // Empleado Activo y todo: el correo sin verificar manda igual.
      setup({ user: authUser(false), employee: employeeDoc('active') });

      expect(component.reason()).toContain('Falta verificar tu correo');
    });

    it('dice que la Cuenta no es Empleado cuando el documento no existe', () => {
      setup({ employee: null });

      expect(component.reason()).toContain('no pertenece al Panel');
    });

    it('dice lo mismo mientras el Empleado todavía no cargó', () => {
      // `undefined` es «sin dato todavía». Hoy cae en la misma rama que `null`
      // por el `if (!employee)`; si eso cambia, esta prueba lo avisa.
      setup({ employee: undefined });

      expect(component.reason()).toContain('no pertenece al Panel');
    });

    it('pide completar el perfil al Empleado Invitado', () => {
      setup({ employee: employeeDoc('invited') });

      expect(component.reason()).toContain('completar tu perfil');
    });

    it('avisa del acceso deshabilitado al Empleado Deshabilitado', () => {
      setup({ employee: employeeDoc('disabled') });

      expect(component.reason()).toContain('deshabilitado');
    });
  });

  describe('resendVerification()', () => {
    it('reenvía la verificación al usuario de la sesión', async () => {
      const sesion = authUser(false);
      setup({ user: sesion });

      await component.resendVerification();

      expect(sendEmailVerificationMock).toHaveBeenCalledWith(sesion);
    });

    it('no intenta reenviar si no hay sesión', async () => {
      setup({ user: null });

      await component.resendVerification();

      expect(sendEmailVerificationMock).not.toHaveBeenCalled();
    });
  });

  describe('leave()', () => {
    it('cierra sesión y recién entonces manda al ingreso', async () => {
      setup();

      await component.leave();

      expect(signOutMock).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
      // Navegar antes de cerrar sesión dejaría la sesión viva en el ingreso.
      const navigate = router.navigate as jest.Mock;
      expect(signOutMock.mock.invocationCallOrder[0]).toBeLessThan(
        navigate.mock.invocationCallOrder[0]
      );
    });
  });

  describe('plantilla', () => {
    it('ofrece reenviar la verificación cuando falta verificar el correo', () => {
      setup({ user: authUser(false) });

      expect(buttons()).toHaveLength(2);
    });

    it('deja solo «cerrar sesión» cuando el correo ya está verificado', () => {
      setup({ user: authUser(true) });

      expect(buttons()).toHaveLength(1);
    });
  });
});
