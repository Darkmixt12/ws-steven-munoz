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
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import * as fixtures from './fixtures';
import {
  asActiveEmployee,
  asCustomer,
  asCustomerEmployee,
  asEmployee,
  blockedEmployeePersonas,
  createTestEnv,
  EMPLOYEE_UIDS,
  firestoreOf,
  seed,
} from './harness';
import { collectionOf, NOTIFICATION_ORIGINS, PANEL_READS, panelDocs } from './panel-matrix';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, panelDocs());
});

afterAll(async () => {
  await env.cleanup();
});

const PANEL_PATHS = [
  ...PANEL_READS.map((read) => read.path),
  ...NOTIFICATION_ORIGINS.map((origin) => `notifications/n-${origin}`),
];

/** Toda lectura y listado del Panel falla. */
async function expectNoPanel(db: Firestore): Promise<void> {
  for (const path of PANEL_PATHS) {
    await assertFails(getDoc(doc(db, path)));
    await assertFails(getDocs(collection(db, collectionOf(path))));
  }
}

async function expectPublicCatalog(db: Firestore): Promise<void> {
  await assertSucceeds(getDoc(doc(db, 'products/published')));
  await assertSucceeds(
    getDocs(query(collection(db, 'products'), where('status', '==', 'published'))),
  );
  await assertSucceeds(getDoc(doc(db, 'products/published/variants/v1')));
}

describe.each(blockedEmployeePersonas)('panel access as %s employee', (name, persona) => {
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await persona(env));
  });

  it('is denied every panel read, even with the administrator role', async () => {
    await expectNoPanel(db);
  });

  it('still reads its own employee document', async () => {
    await assertSucceeds(getDoc(doc(db, `employees/${EMPLOYEE_UIDS[name]}`)));
  });

  it('still reads the public catalog', async () => {
    await expectPublicCatalog(db);
  });
});

describe('panel access without an employee document', () => {
  it('denies the panel to a customer', async () => {
    await expectNoPanel(firestoreOf(await asCustomer(env)));
  });
});

describe('unexpected employee documents', () => {
  it.each([
    ['an unknown role', { ...fixtures.employee('administrator', 'active'), role: 'owner' }],
    ['an unknown status', { ...fixtures.employee('administrator', 'active'), status: 'suspended' }],
  ])('denies the panel to an employee with %s', async (_case, data) => {
    const db = firestoreOf(await asEmployee(env, 'unexpected-1', data));
    await expectNoPanel(db);
  });
});

describe('immediate cut', () => {
  it('rejects the next request with the same token once the employee is disabled', async () => {
    const uid = EMPLOYEE_UIDS.administrator;
    const db = firestoreOf(await asActiveEmployee('administrator')(env));
    await assertSucceeds(getDoc(doc(db, 'settings/issuer')));

    await seed(env, { [`employees/${uid}`]: fixtures.employee('administrator', 'disabled') });

    await assertFails(getDoc(doc(db, 'settings/issuer')));
    await assertSucceeds(getDoc(doc(db, `employees/${uid}`)));
  });
});

describe('an account that is both customer and employee', () => {
  it('reads the panel while its employee is active', async () => {
    const db = firestoreOf(await asCustomerEmployee(env, 'active'));
    await assertSucceeds(getDoc(doc(db, 'products/draft')));
    await assertSucceeds(getDoc(doc(db, 'skus/CAM-S')));
  });

  it('keeps the public catalog and loses the panel once its employee is disabled', async () => {
    const db = firestoreOf(await asCustomerEmployee(env, 'disabled'));
    await expectPublicCatalog(db);
    await expectNoPanel(db);
  });
});
