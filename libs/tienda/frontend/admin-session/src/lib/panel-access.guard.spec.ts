import { Subject, BehaviorSubject, firstValueFrom } from 'rxjs';

// Los mocks van antes de los imports reales, como en `panel-session.store.spec.ts`.
jest.mock('@angular/fire/firestore', () => ({
  Firestore: class Firestore {},
  doc: jest.fn((_firestore: unknown, ...path: string[]) => ({
    id: path.at(-1),
    path: path.join('/'),
  })),
  docData: jest.fn(),
}));

jest.mock('@angular/fire/auth', () => ({
  Auth: class Auth {},
  user: jest.fn(),
}));

import { TestBed } from '@angular/core/testing';
import { Auth, user, type User } from '@angular/fire/auth';
import { Firestore, docData } from '@angular/fire/firestore';
import { Router, provideRouter, type UrlTree } from '@angular/router';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import type { Employee, EmployeeStatus, Role } from 'tienda/domain';
import {
  PANEL_LOGIN_ROUTE,
  PANEL_NO_ACCESS_ROUTE,
  panelAccessGuard,
} from './panel-access.guard';
import { PanelSessionStore } from './panel-session.store';

const docDataMock = docData as jest.Mock;
const userMock = user as jest.Mock;

const UID = 'u1';

const streams = new Map<string, Subject<unknown>>();
let userStream: BehaviorSubject<User | null>;

const timestamp = {
  seconds: 0,
  nanoseconds: 0,
  toDate: () => new Date(0),
  toMillis: () => 0,
};

function authUser(overrides: Partial<User> = {}): User {
  return { uid: UID, emailVerified: true, ...overrides } as User;
}

function employeeDoc(
  status: EmployeeStatus = 'active',
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

/** Deja que corran los efectos y las promesas pendientes. */
async function flush(): Promise<void> {
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  TestBed.tick();
}

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: Firestore, useValue: {} },
      { provide: Auth, useValue: {} },
    ],
  });
  // El store empieza a seguir `employees/{uid}` cuando se le inyecta; sin esto
  // nadie escucha el Subject y las emisiones se pierden.
  TestBed.inject(PanelSessionStore);
  return TestBed.inject(Router);
}

/** Corre la guarda dentro del contexto de inyección, como hace el router. */
function runGuard() {
  return TestBed.runInInjectionContext(() =>
    panelAccessGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );
}

/**
 * Suscribe la guarda y recién entonces vacía: `toObservable` publica en el
 * ciclo siguiente, así que esperar sin volver a vaciar no llega nunca.
 */
function decide(): Promise<boolean | UrlTree> {
  const settled = firstValueFrom(
    runGuard() as never
  ) as unknown as Promise<boolean | UrlTree>;
  return flush().then(() => settled);
}

/** Emite el documento de `employees/{uid}`. */
function emitEmployee(value: Employee | undefined): void {
  streams.get(`employees/${UID}`)?.next(value);
}

beforeEach(() => {
  docDataMock.mockImplementation((ref: { path: string }) => {
    const stream = new Subject<unknown>();
    streams.set(ref.path, stream);
    return stream;
  });
  userStream = new BehaviorSubject<User | null>(null);
  userMock.mockReturnValue(userStream);
});

afterEach(() => {
  streams.clear();
  jest.clearAllMocks();
  TestBed.resetTestingModule();
});

describe('panelAccessGuard', () => {
  it('espera mientras Auth no ha respondido: la lentitud no expulsa a nadie', async () => {
    // `user()` sin valor todavía: el store queda en `undefined`.
    userMock.mockReturnValue(new Subject<User | null>());
    setup();

    let settled = false;
    (firstValueFrom(runGuard() as never) as Promise<unknown>).then(() => {
      settled = true;
    });
    await flush();

    expect(settled).toBe(false);
  });

  it('manda al ingreso a quien no tiene sesión', async () => {
    const router = setup();

    const result = (await decide()) as UrlTree;

    expect(router.serializeUrl(result)).toBe(PANEL_LOGIN_ROUTE);
  });

  it('deja pasar al Empleado Activo con el correo verificado', async () => {
    setup();
    userStream.next(authUser());
    await flush();
    emitEmployee(employeeDoc('active'));

    expect(await decide()).toBe(true);
  });

  it('manda a «sin acceso» a quien no verificó el correo', async () => {
    const router = setup();
    userStream.next(authUser({ emailVerified: false } as Partial<User>));
    await flush();

    const result = (await decide()) as UrlTree;

    expect(router.serializeUrl(result)).toBe(PANEL_NO_ACCESS_ROUTE);
  });

  it.each<EmployeeStatus>(['invited', 'disabled'])(
    'manda a «sin acceso» al Empleado %s',
    async (status) => {
      const router = setup();
      userStream.next(authUser());
      await flush();
      emitEmployee(employeeDoc(status));

      const result = (await decide()) as UrlTree;

      expect(router.serializeUrl(result)).toBe(PANEL_NO_ACCESS_ROUTE);
    }
  );

  it('manda a «sin acceso» a la Cuenta que no es Empleado', async () => {
    const router = setup();
    userStream.next(authUser());
    await flush();
    emitEmployee(undefined);

    const result = (await decide()) as UrlTree;

    expect(router.serializeUrl(result)).toBe(PANEL_NO_ACCESS_ROUTE);
  });

  it('manda a «sin acceso» cuando la regla niega la lectura', async () => {
    const router = setup();
    userStream.next(authUser());
    await flush();
    streams.get(`employees/${UID}`)?.error(new Error('permission-denied'));

    const result = (await decide()) as UrlTree;

    expect(router.serializeUrl(result)).toBe(PANEL_NO_ACCESS_ROUTE);
  });
});
