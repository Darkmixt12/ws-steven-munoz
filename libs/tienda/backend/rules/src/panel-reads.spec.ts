import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import { hasPermission, ROLES } from 'tienda/domain';
import {
  activeEmployeePersonas,
  asActiveEmployee,
  asCustomer,
  asCustomerEmployee,
  blockedEmployeePersonas,
  createTestEnv,
  EMPLOYEE_UIDS,
  firestoreOf,
  seed,
} from './harness';
import {
  BACKEND_ONLY_DOCS,
  collectionOf,
  NOTIFICATION_ORIGINS,
  NOTIFICATION_PERMISSIONS,
  PANEL_READS,
  panelDocs,
} from './panel-matrix';

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

function expectation(allowed: boolean) {
  return allowed ? assertSucceeds : assertFails;
}

describe.each(activeEmployeePersonas)('panel reads as active %s', (role, persona) => {
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await persona(env));
  });

  const reads = PANEL_READS.map((read) => {
    const allowed = read.permission === null || hasPermission(role, read.permission);
    const verb = allowed ? 'reads' : 'cannot read';
    return [`${verb} ${read.path} (${read.permission ?? 'any active employee'})`, read, allowed] as const;
  });

  it.each(reads)('%s', async (_title, read, allowed) => {
    await expectation(allowed)(getDoc(doc(db, read.path)));
    if (read.list) {
      await expectation(allowed)(getDocs(collection(db, collectionOf(read.path))));
    }
  });

  it('reads its own employee document', async () => {
    await assertSucceeds(getDoc(doc(db, `employees/${EMPLOYEE_UIDS[role]}`)));
  });

  it('lists products without filtering by status', async () => {
    const products = await assertSucceeds(getDocs(collection(db, 'products')));
    expect(products.docs.map((snapshot) => snapshot.id).sort()).toEqual([
      'archived',
      'draft',
      'published',
    ]);
  });

  describe('notifications', () => {
    const readsAll = [...new Set(Object.values(NOTIFICATION_PERMISSIONS))].every(
      (permission) => hasPermission(role, permission),
    );

    it.each(
      NOTIFICATION_ORIGINS.map((origin) => {
        const allowed = hasPermission(role, NOTIFICATION_PERMISSIONS[origin]);
        return [`${allowed ? 'reads' : 'cannot read'} those from ${origin}`, origin, allowed] as const;
      }),
    )('%s, by id or filtering ref.collection', async (_title, origin, allowed) => {
      await expectation(allowed)(getDoc(doc(db, `notifications/n-${origin}`)));
      await expectation(allowed)(
        getDocs(
          query(collection(db, 'notifications'), where('ref.collection', '==', origin)),
        ),
      );
    });

    it(`${readsAll ? 'can' : 'cannot'} list them without filtering ref.collection`, async () => {
      await expectation(readsAll)(getDocs(collection(db, 'notifications')));
    });
  });

  it('cannot read counters', async () => {
    await assertFails(getDoc(doc(db, 'counters/orderNumber')));
    await assertFails(getDocs(collection(db, 'counters')));
  });

  it('cannot write its own employee document', async () => {
    const own = doc(db, `employees/${EMPLOYEE_UIDS[role]}`);
    await assertFails(updateDoc(own, { role: 'administrator', status: 'active' }));
    await assertFails(deleteDoc(own));
  });
});

describe('catalog editor', () => {
  it.each(['orders/o1', 'customers/customer-1', 'notifications/n-orders'])(
    'cannot read or list %s',
    async (path) => {
      const db = firestoreOf(await asActiveEmployee('catalogEditor')(env));
      await assertFails(getDoc(doc(db, path)));
      await assertFails(getDocs(collection(db, collectionOf(path))));
    },
  );
});

// Criterios de #57 fijados a mano: los casos de arriba salen de la tabla, así que un
// cambio en la tabla (y en su espejo) los movería sin fallar; estos no.
describe('the permission table', () => {
  it.each(ROLES)('lets the %s read the stock and the reports', (role) => {
    expect(hasPermission(role, 'recordStockMovements')).toBe(true);
    expect(hasPermission(role, 'viewReports')).toBe(true);
  });

  it.each(['viewAuditLog', 'viewEmployees', 'handleDataRequests', 'manageSettings'] as const)(
    'grants %s only to the administrator',
    (permission) => {
      expect(ROLES.filter((role) => hasPermission(role, permission))).toEqual(['administrator']);
    },
  );

  it('grants viewOrders to the administrator and the operator only', () => {
    expect(ROLES.filter((role) => hasPermission(role, 'viewOrders'))).toEqual([
      'administrator',
      'operator',
    ]);
  });
});

const writers = [
  ['customer', asCustomer],
  ...activeEmployeePersonas,
  ...blockedEmployeePersonas,
  ['customer and employee', asCustomerEmployee],
] as const;

describe.each(writers)('backend-only collections as %s', (_name, persona) => {
  it.each(BACKEND_ONLY_DOCS)('cannot create, update or delete %s', async (path) => {
    const db = firestoreOf(await persona(env));
    await assertFails(setDoc(doc(db, `${collectionOf(path)}/new`), { seeded: false }));
    await assertFails(setDoc(doc(db, path), { seeded: false }));
    await assertFails(updateDoc(doc(db, path), { seeded: false }));
    await assertFails(deleteDoc(doc(db, path)));
  });
});
