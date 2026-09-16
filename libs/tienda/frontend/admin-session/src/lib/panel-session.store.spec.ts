import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';

jest.mock('@angular/fire/firestore', () => ({
  Firestore: class Firestore {},
  doc: jest.fn((_fs: unknown, ...path: string[]) => ({
    id: path[path.length - 1],
    path: path.join('/'),
  })),
  docData: jest.fn(),
}));

jest.mock('@angular/fire/auth', () => ({
  Auth: class Auth {},
  user: jest.fn(),
}));

import { Auth, user, type User } from '@angular/fire/auth';
import { Firestore, docData } from '@angular/fire/firestore';
import {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  type Employee,
} from 'tienda/domain';
import type { WithId } from 'tienda/stores';
import { PanelSessionStore } from './panel-session.store';

const docDataMock = docData as jest.Mock;
const userMock = user as jest.Mock;
const streams = new Map<string, Subject<unknown>>();

let userStream: BehaviorSubject<User | null>;

const timestamp = {
  seconds: 0,
  nanoseconds: 0,
  toDate: () => new Date(0),
  toMillis: () => 0,
};

function authUser(overrides: Partial<User> = {}): User {
  return { uid: 'u1', emailVerified: true, ...overrides } as User;
}

function employeeDoc(overrides: Partial<Employee> = {}): WithId<Employee> {
  return {
    id: 'u1',
    email: 'admin@tienda.cr',
    name: 'Administradora',
    phone: null,
    role: 'administrator',
    status: 'active',
    statusReason: null,
    invitedBy: 'u1',
    invitedAt: timestamp,
    statusChangedAt: timestamp,
    lastPanelEntryAt: null,
    anonymizedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

async function flush(): Promise<void> {
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  TestBed.tick();
}

describe('PanelSessionStore', () => {
  beforeEach(() => {
    userStream = new BehaviorSubject<User | null>(null);
    userMock.mockImplementation(() => userStream.asObservable());
    docDataMock.mockImplementation((ref: { path: string }) => {
      const stream = new Subject<unknown>();
      streams.set(ref.path, stream);
      return stream.asObservable();
    });
  });

  afterEach(() => {
    streams.clear();
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        { provide: Firestore, useValue: {} },
        { provide: Auth, useValue: {} },
      ],
    });

    return TestBed.inject(PanelSessionStore);
  }

  function emitEmployee(value: WithId<Employee> | undefined): void {
    streams.get('employees/u1')?.next(value);
  }

  /** Ingresa y deja el Empleado cargado, que es el punto de partida de casi todo. */
  async function signIn(
    employee: WithId<Employee> = employeeDoc()
  ): Promise<ReturnType<typeof setup>> {
    const store = setup();
    userStream.next(authUser());
    await flush();

    emitEmployee(employee);
    await flush();

    return store;
  }

  it('no sigue ningún documento mientras no hay sesión', async () => {
    const store = setup();
    await flush();

    expect(docDataMock).not.toHaveBeenCalled();
    expect(store.employee()).toBeUndefined();
    expect(store.mustExit()).toBe(false);
    expect(store.can('viewOrders')).toBe(false);
  });

  it('sigue employees/{uid} del usuario autenticado', async () => {
    const store = await signIn();

    expect(docDataMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'employees/u1' }),
      { idField: 'id' }
    );
    expect(store.employee()).toEqual(employeeDoc());
    expect(store.role()).toBe('administrator');
  });

  it('no pide salir ni concede Permisos mientras carga el Empleado', async () => {
    const store = setup();
    userStream.next(authUser());
    await flush();

    expect(store.isLoading()).toBe(true);
    expect(store.mustExit()).toBe(false);
    expect(store.can('viewOrders')).toBe(false);
  });

  describe('can() por Rol', () => {
    for (const role of ROLES) {
      it(`responde la tabla de ${role}`, async () => {
        const store = await signIn(employeeDoc({ role }));

        for (const permission of PERMISSIONS) {
          expect(store.can(permission)).toBe(
            ROLE_PERMISSIONS[role].includes(permission)
          );
        }
      });
    }
  });

  describe('debe salir', () => {
    it('al deshabilitar al Empleado', async () => {
      const store = await signIn();
      expect(store.mustExit()).toBe(false);

      emitEmployee(employeeDoc({ status: 'disabled' }));
      await flush();

      expect(store.mustExit()).toBe(true);
      expect(store.can('viewOrders')).toBe(false);
    });

    it('al cambiarle el Rol', async () => {
      const store = await signIn();
      expect(store.mustExit()).toBe(false);

      emitEmployee(employeeDoc({ role: 'operator' }));
      await flush();

      expect(store.mustExit()).toBe(true);
    });

    it('al perder la verificación del correo', async () => {
      const store = await signIn();
      expect(store.mustExit()).toBe(false);

      userStream.next(authUser({ emailVerified: false }));
      await flush();

      expect(store.mustExit()).toBe(true);
    });

    it('cuando el Empleado deja de existir', async () => {
      const store = await signIn();

      emitEmployee(undefined);
      await flush();

      expect(store.employee()).toBeNull();
      expect(store.mustExit()).toBe(true);
    });

    it('cuando la lectura falla porque la regla la niega', async () => {
      const store = await signIn();

      streams.get('employees/u1')?.error(new Error('permission-denied'));
      await flush();

      expect(store.mustExit()).toBe(true);
    });

    it('sigue apagada si el Rol es el mismo de siempre', async () => {
      const store = await signIn();

      emitEmployee(employeeDoc({ name: 'Otro nombre' }));
      await flush();

      expect(store.mustExit()).toBe(false);
    });
  });
});
