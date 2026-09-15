import {
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import * as fixtures from './fixtures';
import { asAnonymous, createTestEnv, firestoreOf, seed } from './harness';

// Colecciones privadas del Modelo de datos, más colecciones que no están en él
// (también bajo documentos públicos): todas caen en la regla final.
const PRIVATE_DOCS = [
  'skus/CAM-S',
  'stockMovements/m1',
  'stockImports/i1',
  'orders/o1',
  'customers/customer-1',
  'customers/customer-1/addresses/a1',
  'customers/customer-1/billingProfiles/b1',
  'employees/employee-1',
  'invitations/persona@example.com',
  'staffDirectory/employee-1',
  'consents/c1',
  'dataRequests/r1',
  'carts/customer-1',
  'counters/orderNumber',
  'settings/issuer',
  'salesDaily/2026-01-15',
  'auditEvents/e1',
  'notifications/n1',
  'unknownCollection/x1',
  'categories/ropa/unknownSubcollection/x1',
  'products/published/unknownSubcollection/x1',
];

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    'products/published': fixtures.product('published'),
    'categories/ropa': fixtures.category(),
    ...Object.fromEntries(PRIVATE_DOCS.map((path) => [path, { seeded: true }])),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe('private and unknown collections as anonymous', () => {
  it.each(PRIVATE_DOCS)('cannot read, list or write %s', async (path) => {
    const db = firestoreOf(await asAnonymous(env));
    const [collectionPath] = path.split(/\/(?=[^/]+$)/);

    await assertFails(getDoc(doc(db, path)));
    await assertFails(getDocs(collection(db, collectionPath)));
    await assertFails(setDoc(doc(db, path), { seeded: false }));
  });
});
