import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { privacyNoticeHash } from 'tienda/domain';
import {
  CONSENTS_COLLECTION,
  DEFAULT_FIRST_ORDER_NUMBER,
  employeePath,
  ORDER_NUMBER_COUNTER_PATH,
  parseStorefrontBase,
  privacyNoticePath,
  PRIVACY_NOTICE_VERSION,
  seedDocuments,
  staffDirectoryPath,
  STOREFRONT_SETTINGS_PATH,
  type SeedDocument,
  type SeedInput,
} from 'tienda/ops';
import { createTestEnv, firestoreOf, seed } from './harness';

// Criterio de aceptación #6 de #67: lo que siembra `tienda-ops:seed` sirve contra
// `firestore.rules`. Importa: el Admin SDK se salta las reglas, así que sin esta prueba la
// semilla podría crear documentos que el Panel nunca podría leer ni volver a guardar.
//
// No se prueba aquí la forma de cada documento —eso lo fija `seed-data.spec.ts` sin
// emuladores—, sino lo que solo se ve con reglas: quién lee qué, y que la Configuración
// sembrada siga siendo editable desde el Panel.

/** Los ficheros versionados de verdad, los mismos que lee el script. */
const SEED_DIR = join(__dirname, '..', '..', 'ops', 'seed');

const ADMIN_UID = 'seeded-administrator';
const ADMIN_EMAIL = 'admin@tienda.cr';

/** En producción el Consentimiento es `consents/{autoId}`; aquí necesita un id fijo. */
const SEEDED_CONSENT_ID = 'seeded';
const CONSENT_PATH = `${CONSENTS_COLLECTION}/${SEEDED_CONSENT_ID}`;

const NOTICE_PATH = privacyNoticePath(PRIVACY_NOTICE_VERSION);
const ADMIN_EMPLOYEE_PATH = employeePath(ADMIN_UID);
const ADMIN_DIRECTORY_PATH = staffDirectoryPath(ADMIN_UID);

function committedNoticeText(): string {
  return readFileSync(join(SEED_DIR, `privacy-notice-${PRIVACY_NOTICE_VERSION}.md`), 'utf8');
}

function committedStorefront(): SeedInput['storefront'] {
  return parseStorefrontBase(
    JSON.parse(readFileSync(join(SEED_DIR, 'storefront.json'), 'utf8')),
  );
}

/** La misma entrada que arma `seed.ts`, con la hora ya fijada. */
function seedInput(text: string, hash: string): SeedInput {
  return {
    adminUid: ADMIN_UID,
    adminEmail: ADMIN_EMAIL,
    adminName: 'Administradora',
    noticeVersion: PRIVACY_NOTICE_VERSION,
    noticeText: text,
    noticeHash: hash,
    storefront: committedStorefront(),
    firstOrderNumber: DEFAULT_FIRST_ORDER_NUMBER,
    now: Timestamp.fromDate(new Date('2026-01-15T12:00:00-06:00')),
  };
}

function seedDocs(documents: readonly SeedDocument[]): Record<string, DocumentData> {
  return Object.fromEntries(
    documents.map((document) => [
      document.autoId ? `${document.path}/${SEEDED_CONSENT_ID}` : document.path,
      document.data,
    ]),
  );
}

let env: RulesTestEnvironment;
let documents: readonly SeedDocument[];
let noticeText: string;
let noticeHash: string;

beforeAll(async () => {
  env = await createTestEnv();
  noticeText = committedNoticeText();
  noticeHash = await privacyNoticeHash(noticeText);
  documents = seedDocuments(seedInput(noticeText, noticeHash));
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, seedDocs(documents));
});

afterAll(async () => {
  await env.cleanup();
});

/**
 * Sesión del Administrador sembrado. Se arma a mano y no con `asActiveEmployee`, que sembraría
 * el fixture encima del documento de la semilla: aquí lo que se prueba es el documento sembrado.
 */
function asSeededAdministrator(): Firestore {
  return firestoreOf(
    env.authenticatedContext(ADMIN_UID, {
      email: ADMIN_EMAIL,
      email_verified: true,
    }),
  );
}

describe('the seeded administrator', () => {
  let db: Firestore;

  beforeEach(() => {
    db = asSeededAdministrator();
  });

  it('is an active administrator', async () => {
    const own = await assertSucceeds(getDoc(doc(db, ADMIN_EMPLOYEE_PATH)));
    expect(own.data()).toMatchObject({
      role: 'administrator',
      status: 'active',
      email: ADMIN_EMAIL,
    });
  });

  // Su Rol le da todos los Permisos, así que entra al Panel: si la semilla dejara el Empleado
  // en otro estado, `isActiveEmployee()` cortaría aquí.
  it.each([
    ['its own employee document', ADMIN_EMPLOYEE_PATH],
    ['its entry in the staff directory', ADMIN_DIRECTORY_PATH],
    ['the storefront settings', STOREFRONT_SETTINGS_PATH],
    ['the privacy notice', NOTICE_PATH],
    ['its own panel access consent', CONSENT_PATH],
  ])('reads %s', async (_title, path) => {
    const snapshot = await assertSucceeds(getDoc(doc(db, path)));
    expect(snapshot.exists()).toBe(true);
  });

  // El contador lo mueve solo el backend: no lo lee nadie, ni el Administrador.
  it('cannot read the order number counter', async () => {
    await assertFails(getDoc(doc(db, ORDER_NUMBER_COUNTER_PATH)));
    await assertFails(getDocs(collection(db, 'counters')));
  });

  // `settings/issuer` no tiene semilla: lo llena el Administrador desde el Panel (#68).
  it('finds the issuer settings empty', async () => {
    const issuer = await assertSucceeds(getDoc(doc(db, 'settings/issuer')));
    expect(issuer.exists()).toBe(false);
  });

  // La prueba que justifica el fichero: el Admin SDK escribió la Configuración saltándose las
  // reglas, y esto comprueba que aun así cumple `storefrontShape()` —claves exactas incluidas—
  // y que apunta a un Aviso que existe. Si no, el Panel no podría volver a guardarla nunca.
  it('updates the seeded storefront settings from the panel', async () => {
    await assertSucceeds(
      updateDoc(doc(db, STOREFRONT_SETTINGS_PATH), {
        sinpeMovilNumber: '+50611111111',
        updatedAt: serverTimestamp(),
        updatedBy: ADMIN_UID,
      }),
    );
  });
});

describe('a visitor without a session', () => {
  let db: Firestore;

  beforeEach(() => {
    db = firestoreOf(env.unauthenticatedContext());
  });

  // Lo público de la semilla: la tienda se puede mostrar antes de que nadie inicie sesión.
  it.each([
    ['the storefront settings', STOREFRONT_SETTINGS_PATH],
    ['the privacy notice', NOTICE_PATH],
  ])('reads %s', async (_title, path) => {
    const snapshot = await assertSucceeds(getDoc(doc(db, path)));
    expect(snapshot.exists()).toBe(true);
  });

  it('lists the published privacy notices', async () => {
    const notices = await assertSucceeds(getDocs(collection(db, 'privacyNotices')));
    expect(notices.docs.map((snapshot) => snapshot.id)).toEqual([PRIVACY_NOTICE_VERSION]);
  });

  it.each([
    ['the order number counter', ORDER_NUMBER_COUNTER_PATH],
    ['the administrator', ADMIN_EMPLOYEE_PATH],
    ['the staff directory', ADMIN_DIRECTORY_PATH],
    ['the panel access consent', CONSENT_PATH],
  ])('cannot read %s', async (_title, path) => {
    await assertFails(getDoc(doc(db, path)));
  });
});

describe('the seeded configuration', () => {
  it('points at the privacy notice it seeded', async () => {
    const db = asSeededAdministrator();
    const settings = await assertSucceeds(getDoc(doc(db, STOREFRONT_SETTINGS_PATH)));
    expect(settings.data()?.['currentPrivacyNoticeVersion']).toBe(PRIVACY_NOTICE_VERSION);

    const notice = await assertSucceeds(getDoc(doc(db, NOTICE_PATH)));
    expect(notice.exists()).toBe(true);
  });

  // La evidencia queda atada al texto exacto, no a la versión: así se puede acreditar qué
  // aceptó la persona aunque un día no se pudiera recuperar el documento del Aviso.
  it('ties the consent evidence to the text that was published', async () => {
    const db = asSeededAdministrator();
    const notice = await assertSucceeds(getDoc(doc(db, NOTICE_PATH)));
    const consent = await assertSucceeds(getDoc(doc(db, CONSENT_PATH)));

    expect(consent.data()?.['noticeVersion']).toBe(PRIVACY_NOTICE_VERSION);
    expect(consent.data()?.['noticeHash']).toBe(
      await privacyNoticeHash(notice.data()?.['text'] as string),
    );
  });

  // El contador no lo lee nadie con reglas, así que se comprueba con las reglas desactivadas:
  // lo que se prueba es que el documento llegó a la base, no quién puede verlo.
  it('starts the order numbers where it was told to', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const counter = await getDoc(doc(firestoreOf(context), ORDER_NUMBER_COUNTER_PATH));
      expect(counter.data()).toEqual({ next: DEFAULT_FIRST_ORDER_NUMBER });
    });
  });
});
