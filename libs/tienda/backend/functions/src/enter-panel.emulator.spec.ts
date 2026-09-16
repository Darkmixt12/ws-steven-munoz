import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';
import type { Employee, Invitation } from 'tienda/domain';
import { enterPanel } from './enter-panel';

/**
 * `emulators:exec` exporta `FIRESTORE_EMULATOR_HOST` y `GCLOUD_PROJECT`, así que
 * el Admin SDK habla con el emulador sin credenciales. Las reglas no intervienen:
 * el Admin SDK se las salta, que es justo la condición en la que corre la callable.
 */
const PROJECT_ID = process.env['GCLOUD_PROJECT'] ?? 'demo-tienda-cr';

const UID = 'persona-1';
const EMAIL = 'persona@example.com';

let app: App;
let db: Firestore;

/** Las colecciones que tocan estas pruebas. */
const COLLECTIONS = ['employees', 'invitations', 'staffDirectory', 'auditEvents'];

/**
 * Vacía Firestore entre pruebas. Va por el Admin SDK y no por el endpoint REST
 * del emulador porque `@types/node` está fijado en 18, que todavía no declara
 * el `fetch` global.
 */
async function clearFirestore(): Promise<void> {
  await Promise.all(
    COLLECTIONS.map((name) => db.recursiveDelete(db.collection(name)))
  );
}

/** Petición de callable con sesión. El resto de `CallableRequest` no lo toca `enterPanel`. */
function request({
  uid = UID,
  email = EMAIL,
  emailVerified = true,
}: { uid?: string; email?: string; emailVerified?: boolean } = {}): CallableRequest {
  return {
    data: {},
    auth: { uid, token: { email, email_verified: emailVerified } },
  } as unknown as CallableRequest;
}

/** Petición sin sesión. */
function anonymousRequest(): CallableRequest {
  return { data: {} } as unknown as CallableRequest;
}

const at = Timestamp.fromDate(new Date('2026-01-15T12:00:00-06:00'));

function invitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    email: EMAIL,
    role: 'operator',
    invitedBy: 'administrator-1',
    invitedAt: at,
    expiresAt: Timestamp.fromDate(new Date('2099-01-01T00:00:00-06:00')),
    ...overrides,
  };
}

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    email: EMAIL,
    name: 'Persona',
    phone: null,
    role: 'operator',
    status: 'active',
    statusReason: null,
    invitedBy: 'administrator-1',
    invitedAt: at,
    statusChangedAt: at,
    lastPanelEntryAt: at,
    anonymizedAt: null,
    createdAt: at,
    updatedAt: at,
    ...overrides,
  };
}

/** Corre la callable y devuelve el código de error de `HttpsError`. */
async function codeOf(req: CallableRequest): Promise<string> {
  try {
    await enterPanel.run(req);
  } catch (error) {
    return (error as { code?: string }).code ?? 'sin código';
  }
  throw new Error('se esperaba un HttpsError y la callable no falló');
}

beforeAll(() => {
  app = initializeApp({ projectId: PROJECT_ID });
  db = getFirestore(app);
});

afterAll(async () => {
  await deleteApp(app);
});

beforeEach(async () => {
  await clearFirestore();
});

describe('enterPanel', () => {
  describe('rechaza', () => {
    it('sin sesión', async () => {
      expect(await codeOf(anonymousRequest())).toBe('unauthenticated');
    });

    it('con el correo sin verificar', async () => {
      await db.doc(`employees/${UID}`).set(employee());
      expect(await codeOf(request({ emailVerified: false }))).toBe(
        'failed-precondition'
      );
    });

    it('al Empleado Deshabilitado', async () => {
      await db.doc(`employees/${UID}`).set(employee({ status: 'disabled' }));
      expect(await codeOf(request())).toBe('permission-denied');
    });

    it('a quien no es Empleado ni tiene Invitación', async () => {
      expect(await codeOf(request())).toBe('permission-denied');
    });

    it('una Invitación vencida que el TTL todavía no borró', async () => {
      const expired = Timestamp.fromDate(new Date('2020-01-01T00:00:00-06:00'));
      await db.doc(`invitations/${EMAIL}`).set(invitation({ expiresAt: expired }));

      expect(await codeOf(request())).toBe('permission-denied');
    });

    it('y de paso borra la Invitación vencida', async () => {
      const expired = Timestamp.fromDate(new Date('2020-01-01T00:00:00-06:00'));
      await db.doc(`invitations/${EMAIL}`).set(invitation({ expiresAt: expired }));

      await codeOf(request());

      expect((await db.doc(`invitations/${EMAIL}`).get()).exists).toBe(false);
    });
  });

  describe('con el Empleado ya creado', () => {
    it('sella lastPanelEntryAt', async () => {
      await db.doc(`employees/${UID}`).set(employee({ lastPanelEntryAt: null }));

      await enterPanel.run(request());

      const saved = (await db.doc(`employees/${UID}`).get()).data() as Employee;
      expect(saved.lastPanelEntryAt).not.toBeNull();
    });

    it('no le toca el Rol ni el estado', async () => {
      await db.doc(`employees/${UID}`).set(employee({ role: 'catalogEditor' }));

      await enterPanel.run(request());

      const saved = (await db.doc(`employees/${UID}`).get()).data() as Employee;
      expect(saved.role).toBe('catalogEditor');
      expect(saved.status).toBe('active');
    });

    it('deja entrar al Empleado Invitado, que todavía debe completar su perfil', async () => {
      await db.doc(`employees/${UID}`).set(
        employee({ status: 'invited', name: null, lastPanelEntryAt: null })
      );

      await enterPanel.run(request());

      const saved = (await db.doc(`employees/${UID}`).get()).data() as Employee;
      expect(saved.status).toBe('invited');
      expect(saved.lastPanelEntryAt).not.toBeNull();
    });
  });

  describe('al consumir la Invitación', () => {
    it('crea el Empleado Invitado con el Rol de la Invitación', async () => {
      await db.doc(`invitations/${EMAIL}`).set(invitation({ role: 'catalogEditor' }));

      await enterPanel.run(request());

      const saved = (await db.doc(`employees/${UID}`).get()).data() as Employee;
      expect(saved.status).toBe('invited');
      expect(saved.role).toBe('catalogEditor');
      expect(saved.email).toBe(EMAIL);
      expect(saved.name).toBeNull();
      expect(saved.phone).toBeNull();
      expect(saved.invitedBy).toBe('administrator-1');
      expect(saved.lastPanelEntryAt).not.toBeNull();
    });

    it('borra la Invitación al ligarla', async () => {
      await db.doc(`invitations/${EMAIL}`).set(invitation());

      await enterPanel.run(request());

      expect((await db.doc(`invitations/${EMAIL}`).get()).exists).toBe(false);
    });

    it('la busca con el correo normalizado', async () => {
      await db.doc(`invitations/${EMAIL}`).set(invitation());

      await enterPanel.run(request({ email: '  Persona@Example.COM  ' }));

      expect((await db.doc(`employees/${UID}`).get()).exists).toBe(true);
    });

    it('no escribe la Bitácora ni el directorio: el Invitado no tiene nombre', async () => {
      await db.doc(`invitations/${EMAIL}`).set(invitation());

      await enterPanel.run(request());

      expect((await db.doc(`staffDirectory/${UID}`).get()).exists).toBe(false);
      expect((await db.collection('auditEvents').get()).empty).toBe(true);
    });
  });
});
