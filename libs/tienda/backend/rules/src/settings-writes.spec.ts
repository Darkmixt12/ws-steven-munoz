import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { hasPermission, ROLES, type Permission } from 'tienda/domain';
import * as fixtures from './fixtures';
import {
  activeEmployeePersonas,
  asActiveEmployee,
  asCustomerEmployee,
  blockedEmployeePersonas,
  createTestEnv,
  EMPLOYEE_UIDS,
  firestoreOf,
  seed,
} from './harness';

// Escrituras del Panel directo sobre la Configuración y el Aviso de privacidad (#60). Las
// expectativas por Rol salen de `hasPermission`; los criterios del ticket van fijados a mano
// más abajo.

/** Versión vigente del Aviso, la que señala `settings/storefront`. */
const CURRENT_NOTICE = '2026-01';

/** Configuración sembrada antes de cada prueba. */
function settingsDocs(): Record<string, DocumentData> {
  return {
    'settings/storefront': fixtures.storefrontSettings(),
    'settings/issuer': fixtures.issuerSettings(),
    [`privacyNotices/${CURRENT_NOTICE}`]: fixtures.privacyNotice(),
  };
}

/** Sellos de toda escritura del Panel, tal como los pone `withFirestoreCrud`. */
function stamps(uid: string): DocumentData {
  return { updatedAt: serverTimestamp(), updatedBy: uid };
}

function newStorefront(uid: string, overrides: DocumentData = {}): DocumentData {
  return { ...fixtures.storefrontSettings(), ...stamps(uid), ...overrides };
}

function newIssuer(uid: string, overrides: DocumentData = {}): DocumentData {
  return { ...fixtures.issuerSettings(), ...stamps(uid), ...overrides };
}

/** Ubicación del emisor, para probar la forma de su mapa anidado. */
function issuerLocation(overrides: DocumentData = {}): DocumentData {
  return { ...fixtures.issuerSettings().location, ...overrides };
}

/**
 * Versión nueva del Aviso, tal como la escribe el Panel: su sello de hora es `publishedAt`,
 * porque el Aviso no lleva `updatedAt` (§7.3).
 */
function newPrivacyNotice(uid: string, overrides: DocumentData = {}): DocumentData {
  return {
    text: 'Aviso de privacidad, versión de febrero',
    purposes: ['accountAndOrders', 'marketing'],
    publishedAt: serverTimestamp(),
    updatedBy: uid,
    ...overrides,
  };
}

/** Copia sin una clave, para probar un documento al que le falta un campo. */
function without(data: DocumentData, key: string): DocumentData {
  const copy = { ...data };
  delete copy[key];
  return copy;
}

interface PanelWrite {
  /** En infinitivo: el título se arma con "can" o "cannot". */
  title: string;
  permission: Permission;
  run: (db: Firestore, uid: string) => Promise<unknown>;
}

/** Una escritura por fila de la matriz §13 de `settings` y `privacyNotices`. */
const PANEL_WRITES: readonly PanelWrite[] = [
  {
    title: 'update the storefront settings',
    permission: 'manageSettings',
    run: (db, uid) =>
      updateDoc(doc(db, 'settings/storefront'), {
        sinpeMovilNumber: '+50611111111',
        ...stamps(uid),
      }),
  },
  {
    title: 'update the issuer settings',
    permission: 'manageSettings',
    run: (db, uid) =>
      updateDoc(doc(db, 'settings/issuer'), {
        email: 'comprobantes@example.com',
        ...stamps(uid),
      }),
  },
  {
    title: 'publish a new version of the privacy notice',
    permission: 'manageSettings',
    run: (db, uid) => setDoc(doc(db, 'privacyNotices/2026-02'), newPrivacyNotice(uid)),
  },
];

/** Una hora que no es la del servidor, para probar sellos y fechas falsificadas. */
const anotherTime = Timestamp.fromDate(new Date('2026-02-01T12:00:00-06:00'));

/** Configuraciones de la tienda que la regla rechaza. */
const INVALID_STOREFRONTS: readonly [string, DocumentData][] = [
  ['with a shipping rate for a province that does not exist', { shippingRates: { '8': 2_500 } }],
  [
    'with an unknown key in the payment timeouts',
    { paymentTimeouts: { cardMinutes: 60, sinpeMovilMinutes: 1_440, cashHours: 2 } },
  ],
  ['missing a key in the store info', { storeInfo: { name: 'Tienda CR', contactEmail: 'x@y.cr' } }],
  ['missing a key in the pickup info', { pickupInfo: { address: 'San José' } }],
  ['with an unknown key', { bannerText: 'Envío gratis' }],
  ['pointing to a privacy notice that does not exist', { currentPrivacyNoticeVersion: '2030-01' }],
];

/** Datos del emisor que la regla rechaza: §7.2 documenta la forma de cada campo. */
const INVALID_ISSUERS: readonly [string, DocumentData][] = [
  ['with an unknown id type', { idType: '05' }],
  ['with a branch that is not three digits', { branch: '1' }],
  ['with a terminal that is not five digits', { terminal: '123' }],
  [
    'with a district code that is not five digits',
    { location: issuerLocation({ districtCode: '101' }) },
  ],
  [
    'with other signs shorter than five characters',
    { location: issuerLocation({ otherSigns: 'Casa' }) },
  ],
  [
    'with other signs longer than 160 characters',
    { location: issuerLocation({ otherSigns: 'x'.repeat(161) }) },
  ],
  ['with an unknown key in the location', { location: issuerLocation({ landmark: 'La iglesia' }) }],
  ['with an unknown key', { website: 'https://tienda.cr' }],
];

/** Avisos de privacidad que la regla rechaza. */
const INVALID_NOTICES: readonly [string, DocumentData][] = [
  ['with an unknown purpose', { purposes: ['accountAndOrders', 'resale'] }],
  ['with an unknown key', { author: 'Legal' }],
  ['with a backdated publication', { publishedAt: anotherTime }],
];

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, settingsDocs());
});

afterAll(async () => {
  await env.cleanup();
});

function expectation(allowed: boolean) {
  return allowed ? assertSucceeds : assertFails;
}

describe.each(activeEmployeePersonas)('settings writes as active %s', (role, persona) => {
  let db: Firestore;
  const uid = EMPLOYEE_UIDS[role];

  beforeEach(async () => {
    db = firestoreOf(await persona(env));
  });

  const writes = PANEL_WRITES.map((write) => {
    const allowed = hasPermission(role, write.permission);
    const verb = allowed ? 'can' : 'cannot';
    return [`${verb} ${write.title} (${write.permission})`, write, allowed] as const;
  });

  it.each(writes)('%s', async (_title, write, allowed) => {
    await expectation(allowed)(write.run(db, uid));
  });
});

const deniedPersonas = [
  ...blockedEmployeePersonas.map(
    ([name, persona]) => [name, persona, EMPLOYEE_UIDS[name]] as const,
  ),
  ['customer and employee', asCustomerEmployee, EMPLOYEE_UIDS.customerEmployee] as const,
];

describe.each(deniedPersonas)('settings writes as %s employee', (_name, persona, uid) => {
  it.each(PANEL_WRITES.map((write) => [write.title, write] as const))(
    'cannot %s',
    async (_title, write) => {
      const db = firestoreOf(await persona(env));
      await assertFails(write.run(db, uid));
    },
  );
});

// Criterios de #60 fijados a mano: los casos de arriba salen de la tabla de Permisos, así que
// un cambio en la tabla los movería sin fallar; estos no.
describe('as the administrator', () => {
  const uid = EMPLOYEE_UIDS.administrator;
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await asActiveEmployee('administrator')(env));
  });

  describe('the author and the server time', () => {
    it('rejects a write signed by somebody else', async () => {
      await assertFails(
        updateDoc(doc(db, 'settings/storefront'), {
          sinpeMovilNumber: '+50611111111',
          updatedAt: serverTimestamp(),
          updatedBy: EMPLOYEE_UIDS.operator,
        }),
      );
      await assertFails(
        setDoc(
          doc(db, 'privacyNotices/2026-02'),
          newPrivacyNotice(EMPLOYEE_UIDS.operator),
        ),
      );
    });

    it('rejects a write without updatedAt', async () => {
      await assertFails(
        updateDoc(doc(db, 'settings/storefront'), {
          sinpeMovilNumber: '+50611111111',
          updatedBy: uid,
        }),
      );
      await assertFails(
        setDoc(doc(db, 'settings/issuer'), without(newIssuer(uid), 'updatedAt')),
      );
    });

    it('rejects an updatedAt that is not the server time', async () => {
      await assertFails(
        updateDoc(doc(db, 'settings/issuer'), {
          email: 'comprobantes@example.com',
          updatedAt: anotherTime,
          updatedBy: uid,
        }),
      );
    });

    // El Aviso no lleva `updatedAt`: su sello de hora del servidor es `publishedAt`.
    it('rejects a privacy notice without its publication time', async () => {
      await assertFails(
        setDoc(
          doc(db, 'privacyNotices/2026-02'),
          without(newPrivacyNotice(uid), 'publishedAt'),
        ),
      );
    });
  });

  describe('deletes', () => {
    it.each(['settings/storefront', 'settings/issuer', `privacyNotices/${CURRENT_NOTICE}`])(
      'cannot delete %s from the panel',
      async (path) => {
        await assertFails(deleteDoc(doc(db, path)));
      },
    );
  });

  describe('the storefront settings', () => {
    it('updates them', async () => {
      await assertSucceeds(
        updateDoc(doc(db, 'settings/storefront'), {
          shippingRates: { '1': 2_000, '7': 4_500 },
          sinpeMovilNumber: '+50611111111',
          pickupInfo: { address: 'Heredia', hours: 'L–V 8:00–16:00' },
          ...stamps(uid),
        }),
      );
    });

    it.each(INVALID_STOREFRONTS)('cannot update them %s', async (_title, overrides) => {
      await assertFails(
        setDoc(doc(db, 'settings/storefront'), newStorefront(uid, overrides)),
      );
    });

    it('cannot update them missing a field', async () => {
      await assertFails(
        setDoc(doc(db, 'settings/storefront'), without(newStorefront(uid), 'pickupInfo')),
      );
    });

    it('points the current privacy notice to a version that exists', async () => {
      await seed(env, { 'privacyNotices/2026-02': fixtures.privacyNotice() });
      await assertSucceeds(
        updateDoc(doc(db, 'settings/storefront'), {
          currentPrivacyNoticeVersion: '2026-02',
          ...stamps(uid),
        }),
      );
    });
  });

  describe('the issuer settings', () => {
    it('updates them', async () => {
      await assertSucceeds(
        updateDoc(doc(db, 'settings/issuer'), {
          name: 'Tienda CR Sociedad Anónima',
          branch: '002',
          terminal: '00002',
          location: issuerLocation({ otherSigns: 'Contiguo a la escuela' }),
          ...stamps(uid),
        }),
      );
    });

    it.each(INVALID_ISSUERS)('cannot update them %s', async (_title, overrides) => {
      await assertFails(setDoc(doc(db, 'settings/issuer'), newIssuer(uid, overrides)));
    });

    it('cannot update them missing a field', async () => {
      await assertFails(
        setDoc(doc(db, 'settings/issuer'), without(newIssuer(uid), 'economicActivityCode')),
      );
    });
  });

  describe('the privacy notice', () => {
    it('publishes a new version', async () => {
      await assertSucceeds(
        setDoc(doc(db, 'privacyNotices/2026-02'), newPrivacyNotice(uid)),
      );
    });

    it.each(INVALID_NOTICES)('cannot publish one %s', async (_title, overrides) => {
      await assertFails(
        setDoc(doc(db, 'privacyNotices/2026-02'), newPrivacyNotice(uid, overrides)),
      );
    });

    it('cannot publish one missing a field', async () => {
      await assertFails(
        setDoc(doc(db, 'privacyNotices/2026-02'), without(newPrivacyNotice(uid), 'text')),
      );
    });

    // La evidencia de Consentimiento apunta a su texto: una versión existente no se toca.
    it('cannot edit an existing version', async () => {
      await assertFails(
        updateDoc(doc(db, `privacyNotices/${CURRENT_NOTICE}`), {
          text: 'Otro texto',
          updatedBy: uid,
        }),
      );
    });

    it('cannot overwrite an existing version', async () => {
      await assertFails(
        setDoc(doc(db, `privacyNotices/${CURRENT_NOTICE}`), newPrivacyNotice(uid)),
      );
    });
  });

  // `settings/issuer` no tiene semilla: el Administrador lo llena desde el Panel, y eso es un
  // `create`, no un `update`. `settings/storefront` sí la tiene (#67), así que la §13 no le da
  // `C` y la regla no lo deja crear ni siquiera con la base vacía.
  describe('creating the configuration the first time', () => {
    let emptyDb: Firestore;

    beforeEach(async () => {
      await env.clearFirestore();
      await seed(env, {
        [`privacyNotices/${CURRENT_NOTICE}`]: fixtures.privacyNotice(),
      });
      emptyDb = firestoreOf(await asActiveEmployee('administrator')(env));
    });

    it('creates the issuer settings', async () => {
      await assertSucceeds(setDoc(doc(emptyDb, 'settings/issuer'), newIssuer(uid)));
    });

    it('cannot create the storefront settings, which the seed already wrote', async () => {
      await assertFails(setDoc(doc(emptyDb, 'settings/storefront'), newStorefront(uid)));
    });

    it('still rejects an invalid shape', async () => {
      await assertFails(
        setDoc(doc(emptyDb, 'settings/issuer'), newIssuer(uid, { idType: '05' })),
      );
    });
  });
});

describe('the permission table', () => {
  it('grants manageSettings to the administrator only', () => {
    expect(ROLES.filter((role) => hasPermission(role, 'manageSettings'))).toEqual([
      'administrator',
    ]);
  });
});
