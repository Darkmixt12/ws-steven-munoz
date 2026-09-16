/**
 * Fija lo que la §12 de `docs/modelo-de-datos-firestore.md` decide: los catorce
 * índices compuestos, la exención de `catalogIndex.entries` y las cinco
 * políticas TTL. Si alguien edita el JSON sin pasar por el documento, o edita el
 * documento sin tocar el JSON, esta prueba lo cuenta. No necesita emuladores.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { TTL_COLLECTIONS, TTL_FIELD } from './ttl-policies';

const WORKSPACE_ROOT = join(__dirname, '..', '..', '..', '..', '..');
const INDEXES_PATH = join(
  WORKSPACE_ROOT,
  'libs/tienda/backend/firestore.indexes.json'
);
const TIENDA_CONFIG_PATH = join(WORKSPACE_ROOT, 'firebase.tienda.json');

interface IndexField {
  fieldPath: string;
  order: 'ASCENDING' | 'DESCENDING';
}

interface CompositeIndex {
  collectionGroup: string;
  queryScope: string;
  fields: IndexField[];
}

interface FieldOverride {
  collectionGroup: string;
  fieldPath: string;
  indexes: unknown[];
}

interface IndexesFile {
  indexes: CompositeIndex[];
  fieldOverrides: FieldOverride[];
}

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(path, 'utf8')) as T;

const ARROW = { ASCENDING: '↑', DESCENDING: '↓' } as const;

/** Un índice escrito como lo escribe la §12, para comparar de un vistazo. */
const signature = (index: CompositeIndex): string =>
  `${index.collectionGroup}: ${index.fields
    .map((field) => `${field.fieldPath}${ARROW[field.order]}`)
    .join(', ')}`;

/** Las catorce filas de la §12, en su orden. */
const EXPECTED_INDEXES = [
  'products: status↑, updatedAt↓',
  'stockMovements: variantId↑, createdAt↓',
  'stockMovements: origin.id↑, createdAt↑',
  'stockMovements: type↑, createdAt↓',
  'orders: customerId↑, createdAt↓',
  'orders: status↑, paymentDeadlineAt↑',
  'orders: status↑, createdAt↓',
  'orders: legalHold↑, anonymizedAt↑, retentionUntil↑',
  'consents: subjectId↑, purpose↑, createdAt↓',
  'dataRequests: status↑, dueAt↑',
  'auditEvents: target.collection↑, target.id↑, occurredAt↓',
  'auditEvents: actor.id↑, occurredAt↓',
  'auditEvents: actionKey↑, occurredAt↓',
  'notifications: ref.collection↑, ref.id↑, createdAt↓',
];

describe('índices compuestos de la Tienda CR', () => {
  const file = readJson<IndexesFile>(INDEXES_PATH);

  it('declara los catorce índices de la §12, y solo esos', () => {
    expect(file.indexes.map(signature)).toEqual(EXPECTED_INDEXES);
  });

  it('los declara todos sobre la colección, no sobre el grupo', () => {
    // La §12 no pide ninguna consulta de grupo de colección; ver ADR 0008.
    for (const index of file.indexes) {
      expect(index.queryScope).toBe('COLLECTION');
    }
  });

  it('exenta `catalogIndex.entries` de los índices de campo único', () => {
    expect(file.fieldOverrides).toEqual([
      { collectionGroup: 'catalogIndex', fieldPath: 'entries', indexes: [] },
    ]);
  });
});

describe('políticas TTL de la Tienda CR', () => {
  it('cubre las cinco colecciones de la §12', () => {
    expect([...TTL_COLLECTIONS]).toEqual([
      'auditEvents',
      'invitations',
      'consents',
      'dataRequests',
      'notifications',
    ]);
  });

  it('vigila `expiresAt`', () => {
    expect(TTL_FIELD).toBe('expiresAt');
  });
});

describe('configuración de Firebase de la tienda', () => {
  it('apunta al archivo de índices de la tienda', () => {
    const config = readJson<{ firestore: { indexes?: string } }>(
      TIENDA_CONFIG_PATH
    );
    expect(config.firestore.indexes).toBe(
      'libs/tienda/backend/firestore.indexes.json'
    );
  });
});
