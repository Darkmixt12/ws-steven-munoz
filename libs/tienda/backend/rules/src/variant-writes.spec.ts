import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { hasPermission, normalizeSku, ROLES, type Permission } from 'tienda/domain';
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

// Escrituras del Panel directo sobre Variantes y el índice de SKU (#59). Las expectativas
// por Rol salen de `hasPermission`; los criterios del ticket van fijados a mano más abajo.

/** Catálogo sembrado antes de cada prueba: cada Variante con su SKU en el índice. */
function catalogDocs(): Record<string, DocumentData> {
  return {
    'products/published': fixtures.product('published'),
    'products/draft': { ...fixtures.product('draft'), slug: 'borrador' },
    'slugs/camiseta': fixtures.slug('published'),
    'slugs/borrador': fixtures.slug('draft'),
    'products/published/variants/v1': fixtures.variant(),
    'products/published/variants/with-history': {
      ...fixtures.variant(),
      sku: 'CAM-M',
      optionValues: { Talla: 'M' },
      hasHistory: true,
    },
    'products/draft/variants/v1': { ...fixtures.variant(), sku: 'BOR-S' },
    'skus/CAM-S': fixtures.sku(),
    'skus/CAM-M': { productId: 'published', variantId: 'with-history' },
    'skus/BOR-S': { productId: 'draft', variantId: 'v1' },
  };
}

/** Sellos de toda escritura del Panel, tal como los pone `withFirestoreCrud`. */
function stamps(uid: string): DocumentData {
  return { updatedAt: serverTimestamp(), updatedBy: uid };
}

/** Variante nueva tal como la escribe el Panel: en cero, sin historial y con su SKU. */
function newVariant(uid: string, overrides: DocumentData = {}): DocumentData {
  return {
    sku: 'CAM-L',
    price: 9_500,
    optionValues: { Talla: 'L' },
    weightGrams: 200,
    active: true,
    imageId: null,
    stock: 0,
    hasHistory: false,
    createdAt: serverTimestamp(),
    ...stamps(uid),
    ...overrides,
  };
}

/** Copia sin una clave, para probar un documento al que le falta un campo. */
function without(data: DocumentData, key: string): DocumentData {
  const copy = { ...data };
  delete copy[key];
  return copy;
}

/**
 * Crea la Variante y reclama su SKU en el mismo batch, como el Panel: el id del índice sale
 * de `normalizeSku`, así que un SKU sin normalizar deja de coincidir con el documento.
 */
function createVariant(
  db: Firestore,
  uid: string,
  { productId = 'published', id = 'new-variant', variant, index = true }: {
    productId?: string;
    id?: string;
    variant?: DocumentData;
    index?: boolean;
  } = {},
): Promise<void> {
  const data = variant ?? newVariant(uid);
  const batch = writeBatch(db);
  batch.set(doc(db, `products/${productId}/variants/${id}`), data);
  if (index) {
    batch.set(doc(db, `skus/${normalizeSku(String(data['sku']))}`), {
      productId,
      variantId: id,
    });
  }
  return batch.commit();
}

/** Renombra el SKU de una Variante: crea el índice nuevo y borra el viejo, en un batch. */
function renameSku(
  db: Firestore,
  uid: string,
  { productId = 'published', id, from, to, dropOld = true, index, changes = {} }: {
    productId?: string;
    id: string;
    from: string;
    to: string;
    dropOld?: boolean;
    index?: DocumentData;
    changes?: DocumentData;
  },
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, `products/${productId}/variants/${id}`), {
    sku: to,
    ...changes,
    ...stamps(uid),
  });
  batch.set(doc(db, `skus/${to}`), index ?? { productId, variantId: id });
  if (dropOld) {
    batch.delete(doc(db, `skus/${from}`));
  }
  return batch.commit();
}

interface PanelWrite {
  /** En infinitivo: el título se arma con "can" o "cannot". */
  title: string;
  permission: Permission;
  run: (db: Firestore, uid: string) => Promise<unknown>;
}

/** Una escritura por fila de la matriz §13 de `variants` y `skus`. */
const PANEL_WRITES: readonly PanelWrite[] = [
  {
    title: 'create a variant with its sku',
    permission: 'editProducts',
    run: (db, uid) => createVariant(db, uid),
  },
  {
    title: 'edit a variant',
    permission: 'editProducts',
    run: (db, uid) =>
      updateDoc(doc(db, 'products/published/variants/v1'), {
        price: 10_500,
        ...stamps(uid),
      }),
  },
  {
    title: 'rename the sku of a variant',
    permission: 'editProducts',
    run: (db, uid) => renameSku(db, uid, { id: 'v1', from: 'CAM-S', to: 'CAM-XS' }),
  },
];

/** Una hora que no es la del servidor, para probar sellos y fechas falsificadas. */
const anotherTime = Timestamp.fromDate(new Date('2026-02-01T12:00:00-06:00'));

/** Variantes que la regla rechaza al crearlas. */
const INVALID_NEW_VARIANTS: readonly [string, DocumentData][] = [
  ['with stock', { stock: 5 }],
  ['with history', { hasHistory: true }],
  ['with a backdated createdAt', { createdAt: anotherTime }],
  ['with an unknown key', { featured: true }],
  ['with a sku in lowercase', { sku: 'cam-l' }],
  ['with a sku with spaces', { sku: 'CAM L' }],
  ['with a sku that starts with a dot', { sku: '.CAM-L' }],
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

describe.each(activeEmployeePersonas)('variant writes as active %s', (role, persona) => {
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

describe.each(deniedPersonas)('variant writes as %s employee', (_name, persona, uid) => {
  it.each(PANEL_WRITES.map((write) => [write.title, write] as const))(
    'cannot %s',
    async (_title, write) => {
      const db = firestoreOf(await persona(env));
      await assertFails(write.run(db, uid));
    },
  );
});

// Criterios de #59 fijados a mano: los casos de arriba salen de la tabla de Permisos,
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
        updateDoc(doc(db, 'products/published/variants/v1'), {
          price: 10_500,
          updatedAt: serverTimestamp(),
          updatedBy: EMPLOYEE_UIDS.operator,
        }),
      );
      await assertFails(
        createVariant(db, uid, { variant: newVariant(EMPLOYEE_UIDS.operator) }),
      );
    });

    it('rejects a write without updatedAt', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/published/variants/v1'), {
          price: 10_500,
          updatedBy: uid,
        }),
      );
      await assertFails(
        createVariant(db, uid, { variant: without(newVariant(uid), 'updatedAt') }),
      );
    });

    it('rejects an updatedAt that is not the server time', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/published/variants/v1'), {
          price: 10_500,
          updatedAt: anotherTime,
          updatedBy: uid,
        }),
      );
    });
  });

  describe('deletes', () => {
    it('cannot delete a variant from the panel', async () => {
      await assertFails(deleteDoc(doc(db, 'products/published/variants/v1')));
    });
  });

  describe('fields only the backend writes', () => {
    const derived = [
      ['stock', 5],
      ['hasHistory', true],
      ['createdAt', serverTimestamp()],
    ] as const;

    it.each(derived)('cannot write %s of a variant', async (field, value) => {
      await assertFails(
        updateDoc(doc(db, 'products/published/variants/v1'), {
          [field]: value,
          ...stamps(uid),
        }),
      );
    });
  });

  describe('creating a variant', () => {
    it('creates it in zero and without history, with its sku in the same batch', async () => {
      await assertSucceeds(createVariant(db, uid));
    });

    it.each(INVALID_NEW_VARIANTS)('cannot create it %s', async (_title, overrides) => {
      await assertFails(createVariant(db, uid, { variant: newVariant(uid, overrides) }));
    });

    it('cannot create it missing a field', async () => {
      await assertFails(
        createVariant(db, uid, { variant: without(newVariant(uid), 'weightGrams') }),
      );
    });

    it('creates it under a draft product too', async () => {
      await assertSucceeds(
        createVariant(db, uid, {
          productId: 'draft',
          variant: newVariant(uid, { sku: 'BOR-L' }),
        }),
      );
    });
  });

  describe('editing a variant', () => {
    it('edits everything but the fields of the backend', async () => {
      await assertSucceeds(
        updateDoc(doc(db, 'products/published/variants/v1'), {
          price: 10_500,
          optionValues: { Talla: 'XS' },
          weightGrams: 250,
          active: false,
          imageId: 'img-1',
          ...stamps(uid),
        }),
      );
    });

    it('cannot add an unknown key', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/published/variants/v1'), {
          featured: true,
          ...stamps(uid),
        }),
      );
    });

    it('edits a variant with history, as long as the sku stays', async () => {
      await assertSucceeds(
        updateDoc(doc(db, 'products/published/variants/with-history'), {
          price: 11_000,
          ...stamps(uid),
        }),
      );
    });
  });

  describe('the sku index', () => {
    it('cannot create the variant without claiming its sku', async () => {
      await assertFails(createVariant(db, uid, { index: false }));
    });

    it('rejects a sku already taken', async () => {
      await assertFails(
        createVariant(db, uid, { variant: newVariant(uid, { sku: 'CAM-S' }) }),
      );
      await assertFails(renameSku(db, uid, { id: 'v1', from: 'CAM-S', to: 'BOR-S' }));
    });

    it('cannot rename without touching the index', async () => {
      await assertFails(
        updateDoc(doc(db, 'products/published/variants/v1'), {
          sku: 'CAM-XS',
          ...stamps(uid),
        }),
      );
    });

    it('renames in the same batch and drops the old sku', async () => {
      await assertSucceeds(renameSku(db, uid, { id: 'v1', from: 'CAM-S', to: 'CAM-XS' }));
    });

    it('cannot rename the sku of a variant with history', async () => {
      await assertFails(
        renameSku(db, uid, { id: 'with-history', from: 'CAM-M', to: 'CAM-XM' }),
      );
      await assertFails(
        renameSku(db, uid, {
          id: 'with-history',
          from: 'CAM-M',
          to: 'CAM-XM',
          dropOld: false,
        }),
      );
    });

    it('cannot delete a sku the variant still claims', async () => {
      await assertFails(deleteDoc(doc(db, 'skus/CAM-S')));
    });

    it('cannot update an entry of the index', async () => {
      await assertFails(
        updateDoc(doc(db, 'skus/CAM-S'), { productId: 'draft', variantId: 'v1' }),
      );
    });

    it('cannot write another key in the index', async () => {
      await assertFails(
        renameSku(db, uid, {
          id: 'v1',
          from: 'CAM-S',
          to: 'CAM-XS',
          index: { productId: 'published', variantId: 'v1', reserved: true },
        }),
      );
    });

    it('cannot point the index to another variant', async () => {
      await assertFails(
        renameSku(db, uid, {
          id: 'v1',
          from: 'CAM-S',
          to: 'CAM-XS',
          index: { productId: 'published', variantId: 'with-history' },
        }),
      );
    });
  });

  // §14: renombrar el SKU es la petición más cara prevista. La escritura de la Variante lee
  // `employees/{uid}` y `skus/{nuevo}`; cada escritura del índice lee `employees/{uid}` y la
  // Variante. Ninguna evaluación pasa de 4 documentos distintos.
  it('allows the worst case of the rules budget', async () => {
    await assertSucceeds(
      renameSku(db, uid, {
        id: 'v1',
        from: 'CAM-S',
        to: 'CAM-XS',
        changes: { price: 10_500, active: false },
      }),
    );
  });
});

describe('the permission table', () => {
  it('grants editProducts to the administrator and the catalog editor only', () => {
    expect(ROLES.filter((role) => hasPermission(role, 'editProducts'))).toEqual([
      'administrator',
      'catalogEditor',
    ]);
  });
});
