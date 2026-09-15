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
import * as fixtures from './fixtures';
import { createTestEnv, firestoreOf, publicPersonas, seed } from './harness';

const PUBLIC_DOCS = [
  'categories/ropa',
  'tags/nuevo',
  'slugs/camiseta',
  'catalogIndex/storefront',
  'settings/storefront',
  'privacyNotices/2026-01',
];

const PUBLIC_COLLECTIONS = ['categories', 'tags', 'slugs', 'privacyNotices'];

const CATALOG_DOCS = [
  'products/published',
  'products/published/variants/v1',
  ...PUBLIC_DOCS,
];

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    'products/published': fixtures.product('published'),
    'products/draft': fixtures.product('draft'),
    'products/archived': fixtures.product('archived'),
    'products/published/variants/v1': fixtures.variant(),
    'products/draft/variants/v1': fixtures.variant(),
    'products/archived/variants/v1': fixtures.variant(),
    'products/missing/variants/v1': fixtures.variant(),
    'categories/ropa': fixtures.category(),
    'tags/nuevo': fixtures.tag(),
    'slugs/camiseta': fixtures.slug('published'),
    'catalogIndex/storefront': fixtures.catalogIndex('published'),
    'settings/storefront': fixtures.storefrontSettings(),
    'privacyNotices/2026-01': fixtures.privacyNotice(),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe.each(publicPersonas)('public catalog as %s', (_name, persona) => {
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await persona(env));
  });

  describe('products', () => {
    it('reads a published product', async () => {
      await assertSucceeds(getDoc(doc(db, 'products/published')));
    });

    it.each(['draft', 'archived'])('cannot read a %s product', async (id) => {
      await assertFails(getDoc(doc(db, `products/${id}`)));
    });

    it('lists products filtered by status == published', async () => {
      const published = await assertSucceeds(
        getDocs(
          query(collection(db, 'products'), where('status', '==', 'published')),
        ),
      );
      expect(published.docs.map((snapshot) => snapshot.id)).toEqual(['published']);
    });

    it('cannot list products without filtering by status', async () => {
      await assertFails(getDocs(collection(db, 'products')));
    });

    it('cannot list products filtered by another status', async () => {
      await assertFails(
        getDocs(query(collection(db, 'products'), where('status', '==', 'draft'))),
      );
    });
  });

  describe('variants', () => {
    it('reads and lists the variants of a published product', async () => {
      await assertSucceeds(getDoc(doc(db, 'products/published/variants/v1')));
      await assertSucceeds(getDocs(collection(db, 'products/published/variants')));
    });

    it.each(['draft', 'archived', 'missing'])(
      'cannot read or list the variants of a %s product',
      async (id) => {
        await assertFails(getDoc(doc(db, `products/${id}/variants/v1`)));
        await assertFails(getDocs(collection(db, `products/${id}/variants`)));
      },
    );
  });

  describe('public collections', () => {
    it.each(PUBLIC_DOCS)('reads %s', async (path) => {
      await assertSucceeds(getDoc(doc(db, path)));
    });

    it.each(PUBLIC_COLLECTIONS)('lists %s', async (path) => {
      await assertSucceeds(getDocs(collection(db, path)));
    });
  });

  describe('writes', () => {
    it.each(CATALOG_DOCS)('cannot create, update or delete %s', async (path) => {
      const [collectionPath] = path.split(/\/(?=[^/]+$)/);
      await assertFails(setDoc(doc(db, `${collectionPath}/new`), { name: 'x' }));
      await assertFails(setDoc(doc(db, path), { name: 'x' }));
      await assertFails(updateDoc(doc(db, path), { name: 'x' }));
      await assertFails(deleteDoc(doc(db, path)));
    });
  });
});
