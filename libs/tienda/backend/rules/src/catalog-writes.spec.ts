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
  writeBatch,
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

// Escrituras del Panel directo sobre el catálogo (#58). Las expectativas por Rol salen
// de `hasPermission`; los criterios del ticket van fijados a mano más abajo.

/** Catálogo sembrado antes de cada prueba: cada Producto con su propio slug en el índice. */
function catalogDocs(): Record<string, DocumentData> {
  return {
    'categories/ropa': fixtures.category(),
    'categories/hogar': { ...fixtures.category(), name: 'Hogar' },
    'categories/camisetas': { ...fixtures.category(), name: 'Camisetas', parentId: 'ropa' },
    'tags/nuevo': fixtures.tag(),
    'products/published': fixtures.product('published'),
    'products/draft': { ...fixtures.product('draft'), slug: 'borrador' },
    'products/archived': { ...fixtures.product('archived'), slug: 'archivado' },
    'products/with-history': {
      ...fixtures.product('published'),
      slug: 'con-historial',
      hasHistory: true,
    },
    'slugs/camiseta': fixtures.slug('published'),
    'slugs/borrador': fixtures.slug('draft'),
    'slugs/archivado': fixtures.slug('archived'),
    'slugs/con-historial': fixtures.slug('with-history'),
  };
}

/** Sellos de toda escritura del Panel, tal como los pone `withFirestoreCrud`. */
function stamps(uid: string): DocumentData {
  return { updatedAt: serverTimestamp(), updatedBy: uid };
}

/** Producto nuevo tal como lo escribe el Panel: Borrador y derivados en su valor inicial. */
function newProduct(uid: string, overrides: DocumentData = {}): DocumentData {
  return {
    name: 'Camiseta nueva',
    description: 'Camiseta de algodón',
    slug: 'camiseta-nueva',
    categoryId: 'ropa',
    tagIds: ['nuevo'],
    status: 'draft',
    publishedAt: null,
    images: [{ id: 'img-1', alt: 'Camiseta azul' }],
    options: [{ name: 'Talla', values: ['S', 'M'] }],
    cabysCode: '1234567890123',
    vatRateCode: '08',
    unitOfMeasure: 'Unid',
    summary: { priceMin: 0, priceMax: 0, inStock: false, activeVariantCount: 0 },
    hasHistory: false,
    createdAt: serverTimestamp(),
    ...stamps(uid),
    ...overrides,
  };
}

function newCategory(uid: string, overrides: DocumentData = {}): DocumentData {
  return {
    name: 'Zapatos',
    parentId: null,
    sortOrder: 2,
    createdAt: serverTimestamp(),
    ...stamps(uid),
    ...overrides,
  };
}

function newTag(uid: string, overrides: DocumentData = {}): DocumentData {
  return { name: 'Oferta', createdAt: serverTimestamp(), ...stamps(uid), ...overrides };
}

/** Copia sin una clave, para probar un documento al que le falta un campo. */
function without(data: DocumentData, key: string): DocumentData {
  const copy = { ...data };
  delete copy[key];
  return copy;
}

/** Crea el Producto y reclama su slug en el mismo batch, como el Panel. */
function createProduct(
  db: Firestore,
  uid: string,
  { id = 'new-product', product, slug = true }: {
    id?: string;
    product?: DocumentData;
    slug?: boolean;
  } = {},
): Promise<void> {
  const data = product ?? newProduct(uid);
  const batch = writeBatch(db);
  batch.set(doc(db, `products/${id}`), data);
  if (slug) {
    batch.set(doc(db, `slugs/${data['slug']}`), { productId: id });
  }
  return batch.commit();
}

/** Renombra el slug de un Producto: crea el índice nuevo y borra el viejo, en un batch. */
function renameSlug(
  db: Firestore,
  uid: string,
  { id, from, to, dropOld = true, index, changes = {} }: {
    id: string;
    from: string;
    to: string;
    dropOld?: boolean;
    index?: DocumentData;
    changes?: DocumentData;
  },
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, `products/${id}`), { slug: to, ...changes, ...stamps(uid) });
  batch.set(doc(db, `slugs/${to}`), index ?? { productId: id });
  if (dropOld) {
    batch.delete(doc(db, `slugs/${from}`));
  }
  return batch.commit();
}

interface PanelWrite {
  /** En infinitivo: el título se arma con "can" o "cannot". */
  title: string;
  permission: Permission;
  run: (db: Firestore, uid: string) => Promise<unknown>;
}

/** Una escritura por fila de la matriz §13, con el Permiso que la abre. */
const PANEL_WRITES: readonly PanelWrite[] = [
  {
    title: 'create a product with its slug',
    permission: 'editProducts',
    run: (db, uid) => createProduct(db, uid),
  },
  {
    title: 'edit a product',
    permission: 'editProducts',
    run: (db, uid) =>
      updateDoc(doc(db, 'products/draft'), { name: 'Otro nombre', ...stamps(uid) }),
  },
  {
    title: 'rename the slug of a product',
    permission: 'editProducts',
    run: (db, uid) => renameSlug(db, uid, { id: 'draft', from: 'borrador', to: 'borrador-2' }),
  },
  {
    title: 'archive a product',
    permission: 'publishProducts',
    run: (db, uid) =>
      updateDoc(doc(db, 'products/published'), { status: 'archived', ...stamps(uid) }),
  },
  {
    title: 'create a category',
    permission: 'manageCategoriesAndTags',
    run: (db, uid) => setDoc(doc(db, 'categories/zapatos'), newCategory(uid)),
  },
  {
    title: 'edit a category',
    permission: 'manageCategoriesAndTags',
    run: (db, uid) =>
      updateDoc(doc(db, 'categories/ropa'), { name: 'Ropa y calzado', ...stamps(uid) }),
  },
  {
    title: 'create a tag',
    permission: 'manageCategoriesAndTags',
    run: (db, uid) => setDoc(doc(db, 'tags/oferta'), newTag(uid)),
  },
  {
    title: 'edit a tag',
    permission: 'manageCategoriesAndTags',
    run: (db, uid) => updateDoc(doc(db, 'tags/nuevo'), { name: 'Novedad', ...stamps(uid) }),
  },
];

/** Una hora que no es la del servidor, para probar sellos y fechas falsificadas. */
const anotherTime = Timestamp.fromDate(new Date('2026-02-01T12:00:00-06:00'));

/** Productos que la regla rechaza al crearlos. */
const INVALID_NEW_PRODUCTS: readonly [string, DocumentData][] = [
  ['published', { status: 'published' }],
  ['archived', { status: 'archived' }],
  ['with an unknown status', { status: 'hidden' }],
  ['with a publication date', { publishedAt: serverTimestamp() }],
  [
    'with a summary already filled',
    { summary: { priceMin: 1_000, priceMax: 2_000, inStock: true, activeVariantCount: 1 } },
  ],
  ['with history', { hasHistory: true }],
  ['with a backdated createdAt', { createdAt: anotherTime }],
  ['with an unknown key', { featured: true }],
  [
    'with more than ten images',
    { images: Array.from({ length: 11 }, (_, index) => ({ id: `img-${index}` })) },
  ],
  [
    'with more than three option axes',
    {
      options: ['Talla', 'Color', 'Material', 'Largo'].map((name) => ({
        name,
        values: ['A'],
      })),
    },
  ],
  ['in a category that does not exist', { categoryId: 'ninguna' }],
];

/** Categorías que la regla rechaza: el árbol tiene dos niveles y nadie es su propio padre. */
const INVALID_CATEGORIES: readonly [string, DocumentData][] = [
  ['a third level', { parentId: 'camisetas' }],
  ['a parent that does not exist', { parentId: 'ninguna' }],
  ['a category that is its own parent', { parentId: 'zapatos' }],
  ['an unknown key', { featured: true }],
];

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, catalogDocs());
});

afterAll(async () => {
  await env.cleanup();
});

function expectation(allowed: boolean) {
  return allowed ? assertSucceeds : assertFails;
}

describe.each(activeEmployeePersonas)('catalog writes as active %s', (role, persona) => {
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

  it(`${hasPermission(role, 'publishProducts') ? 'can' : 'cannot'} publish a product`, async () => {
    // Publicar mueve `status` y `publishedAt`, así que pide los dos Permisos; los dos
    // Roles que publican también editan.
    const allowed =
      hasPermission(role, 'publishProducts') && hasPermission(role, 'editProducts');
    await expectation(allowed)(
      updateDoc(doc(db, 'products/draft'), {
        status: 'published',
        publishedAt: serverTimestamp(),
        ...stamps(uid),
      }),
    );
  });
});

const deniedPersonas = [
  ...blockedEmployeePersonas.map(
    ([name, persona]) => [name, persona, EMPLOYEE_UIDS[name]] as const,
  ),
  ['customer and employee', asCustomerEmployee, EMPLOYEE_UIDS.customerEmployee] as const,
];

describe.each(deniedPersonas)('catalog writes as %s employee', (_name, persona, uid) => {
  it.each(PANEL_WRITES.map((write) => [write.title, write] as const))(
    'cannot %s',
    async (_title, write) => {
      const db = firestoreOf(await persona(env));
      await assertFails(write.run(db, uid));
    },
  );
});

// Criterios de #58 fijados a mano: los casos de arriba salen de la tabla de Permisos,
// así que un cambio en la tabla los movería sin fallar; estos no.
describe('as the administrator', () => {
  const uid = EMPLOYEE_UIDS.administrator;
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await asActiveEmployee('administrator')(env));
  });

  describe('the author and the server time', () => {
    it('rejects a write signed by somebody else', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/draft'), {
          name: 'Otro nombre',
          updatedAt: serverTimestamp(),
          updatedBy: EMPLOYEE_UIDS.operator,
        }),
      );
      await assertFails(
        createProduct(db, uid, { product: newProduct(EMPLOYEE_UIDS.operator) }),
      );
    });

    it('rejects a write without updatedAt', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/draft'), { name: 'Otro nombre', updatedBy: uid }),
      );
      await assertFails(
        setDoc(doc(db, 'tags/oferta'), without(newTag(uid), 'updatedAt')),
      );
    });

    it('rejects an updatedAt that is not the server time', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/draft'), {
          name: 'Otro nombre',
          updatedAt: anotherTime,
          updatedBy: uid,
        }),
      );
    });
  });

  describe('deletes', () => {
    it.each(['products/draft', 'categories/ropa', 'tags/nuevo'])(
      'cannot delete %s from the panel',
      async (path) => {
        await assertFails(deleteDoc(doc(db, path)));
      },
    );
  });

  describe('derived fields', () => {
    const derived = [
      ['summary', { priceMin: 1_000, priceMax: 2_000, inStock: true, activeVariantCount: 1 }],
      ['hasHistory', true],
      ['createdAt', serverTimestamp()],
    ] as const;

    it.each(derived)('cannot write %s of a product', async (field, value) => {
      await assertFails(
        updateDoc(doc(db, 'products/draft'), { [field]: value, ...stamps(uid) }),
      );
    });
  });

  describe('creating a product', () => {
    it('creates it as a draft, with its slug in the same batch', async () => {
      await assertSucceeds(createProduct(db, uid));
    });

    it.each(INVALID_NEW_PRODUCTS)('cannot create it %s', async (_title, overrides) => {
      await assertFails(createProduct(db, uid, { product: newProduct(uid, overrides) }));
    });

    it('cannot create it missing a field', async () => {
      await assertFails(
        createProduct(db, uid, { product: without(newProduct(uid), 'description') }),
      );
    });
  });

  describe('the slug index', () => {
    it('cannot create the product without claiming its slug', async () => {
      await assertFails(createProduct(db, uid, { slug: false }));
    });

    it('rejects a slug already taken', async () => {
      await assertFails(
        createProduct(db, uid, { product: newProduct(uid, { slug: 'camiseta' }) }),
      );
      await assertFails(
        updateDoc(doc(db, 'products/draft'), { slug: 'camiseta', ...stamps(uid) }),
      );
    });

    it('cannot rename without touching the index', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/draft'), { slug: 'borrador-2', ...stamps(uid) }),
      );
    });

    it('renames in the same batch and drops the old slug', async () => {
      await assertSucceeds(
        renameSlug(db, uid, { id: 'draft', from: 'borrador', to: 'borrador-2' }),
      );
    });

    it('keeps the old slug as an alias when the product has history', async () => {
      await assertFails(
        renameSlug(db, uid, { id: 'with-history', from: 'con-historial', to: 'otro-slug' }),
      );
      await assertSucceeds(
        renameSlug(db, uid, {
          id: 'with-history',
          from: 'con-historial',
          to: 'otro-slug',
          dropOld: false,
        }),
      );
    });

    it('cannot delete a slug the product still claims', async () => {
      await assertFails(deleteDoc(doc(db, 'slugs/borrador')));
    });

    it('cannot update an entry of the index', async () => {
      await assertFails(updateDoc(doc(db, 'slugs/borrador'), { productId: 'published' }));
    });

    it('cannot write another key in the index', async () => {
      await assertFails(
        renameSlug(db, uid, {
          id: 'draft',
          from: 'borrador',
          to: 'borrador-2',
          index: { productId: 'draft', reserved: true },
        }),
      );
    });

    it('cannot point the index to another product', async () => {
      await assertFails(
        renameSlug(db, uid, {
          id: 'draft',
          from: 'borrador',
          to: 'borrador-2',
          index: { productId: 'published' },
        }),
      );
    });
  });

  describe('publishing', () => {
    it('sets the publication date the first time', async () => {
      await assertSucceeds(
        updateDoc(doc(db, 'products/draft'), {
          status: 'published',
          publishedAt: serverTimestamp(),
          ...stamps(uid),
        }),
      );
    });

    it('cannot publish without at least one image', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/draft'), {
          status: 'published',
          publishedAt: serverTimestamp(),
          images: [],
          ...stamps(uid),
        }),
      );
    });

    it('cannot publish without setting the date, or with another date', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/draft'), { status: 'published', ...stamps(uid) }),
      );
      await assertFails(
        updateDoc(doc(db, 'products/draft'), {
          status: 'published',
          publishedAt: anotherTime,
          ...stamps(uid),
        }),
      );
    });

    it('keeps the date when an archived product goes back to published', async () => {
      await assertSucceeds(
        updateDoc(doc(db, 'products/archived'), { status: 'published', ...stamps(uid) }),
      );
    });

    it('cannot move the date after the first publication', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/published'), {
          publishedAt: serverTimestamp(),
          ...stamps(uid),
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'products/archived'), {
          status: 'published',
          publishedAt: serverTimestamp(),
          ...stamps(uid),
        }),
      );
    });

    it('cannot leave a published product without images', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/published'), { images: [], ...stamps(uid) }),
      );
    });

    it('archives it without touching the date', async () => {
      await assertSucceeds(
        updateDoc(doc(db, 'products/published'), { status: 'archived', ...stamps(uid) }),
      );
    });
  });

  describe('editing a product', () => {
    it('cannot go over ten images or three option axes', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/draft'), {
          images: Array.from({ length: 11 }, (_, index) => ({ id: `img-${index}` })),
          ...stamps(uid),
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'products/draft'), {
          options: ['Talla', 'Color', 'Material', 'Largo'].map((name) => ({
            name,
            values: ['A'],
          })),
          ...stamps(uid),
        }),
      );
    });

    it('cannot add an unknown key', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/draft'), { featured: true, ...stamps(uid) }),
      );
    });

    it('moves it to an existing category, never to one that does not exist', async () => {
      await assertSucceeds(
        updateDoc(doc(db, 'products/draft'), { categoryId: 'camisetas', ...stamps(uid) }),
      );
      await assertFails(
        updateDoc(doc(db, 'products/draft'), { categoryId: 'ninguna', ...stamps(uid) }),
      );
    });
  });

  describe('the category tree', () => {
    it('creates a root category and a subcategory under it', async () => {
      await assertSucceeds(setDoc(doc(db, 'categories/zapatos'), newCategory(uid)));
      await assertSucceeds(
        setDoc(doc(db, 'categories/tenis'), newCategory(uid, { parentId: 'ropa' })),
      );
    });

    it.each(INVALID_CATEGORIES)('rejects %s', async (_title, overrides) => {
      await assertFails(
        setDoc(doc(db, 'categories/zapatos'), newCategory(uid, overrides)),
      );
    });

    it('moves a subcategory to another root, or turns it into a root', async () => {
      await assertSucceeds(
        updateDoc(doc(db, 'categories/camisetas'), { parentId: 'hogar', ...stamps(uid) }),
      );
      await assertSucceeds(
        updateDoc(doc(db, 'categories/camisetas'), { parentId: null, ...stamps(uid) }),
      );
    });

    it('never turns a root into a subcategory', async () => {
      await assertFails(
        updateDoc(doc(db, 'categories/ropa'), { parentId: 'hogar', ...stamps(uid) }),
      );
    });

    it('cannot change createdAt', async () => {
      await assertFails(
        updateDoc(doc(db, 'categories/ropa'), {
          createdAt: serverTimestamp(),
          ...stamps(uid),
        }),
      );
    });
  });

  describe('tags', () => {
    it('creates one and renames it', async () => {
      await assertSucceeds(setDoc(doc(db, 'tags/oferta'), newTag(uid)));
      await assertSucceeds(
        updateDoc(doc(db, 'tags/nuevo'), { name: 'Novedad', ...stamps(uid) }),
      );
    });

    it('rejects an unknown key or a missing field', async () => {
      await assertFails(
        setDoc(doc(db, 'tags/oferta'), newTag(uid, { featured: true })),
      );
      await assertFails(setDoc(doc(db, 'tags/oferta'), without(newTag(uid), 'name')));
    });
  });

  // §14: el peor caso previsto es el batch de renombrado que además mueve la Categoría.
  // La escritura del Producto lee `employees/{uid}`, `categories/{categoryId}` y
  // `slugs/{nuevo}`; cada escritura del índice lee `employees/{uid}` y `products/{id}`.
  // Ninguna evaluación pasa de 4 documentos distintos.
  it('allows the worst case of the rules budget', async () => {
    await assertSucceeds(
      renameSlug(db, uid, {
        id: 'draft',
        from: 'borrador',
        to: 'borrador-2',
        changes: { categoryId: 'camisetas' },
      }),
    );
  });
});

describe('the permission table', () => {
  it.each(['editProducts', 'publishProducts', 'manageCategoriesAndTags'] as const)(
    'grants %s to the administrator and the catalog editor only',
    (permission) => {
      expect(ROLES.filter((role) => hasPermission(role, permission))).toEqual([
        'administrator',
        'catalogEditor',
      ]);
    },
  );
});
