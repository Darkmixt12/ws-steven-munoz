import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import * as fixtures from './fixtures';
import {
  asCustomer,
  asSecondCustomer,
  createTestEnv,
  CUSTOMER_UID,
  firestoreOf,
  seed,
} from './harness';

// Escrituras del Cliente directo sobre su Carrito (#61): una línea por escritura, cantidad
// entre 1 y 99 y hasta 50 líneas (§6.1). La cantidad 0 no se guarda: se borra la línea.

const CART = `carts/${CUSTOMER_UID}`;

let env: RulesTestEnvironment;

/** Línea tal como la escribe el Cliente, con la hora del servidor. */
function newLine(quantity = 1, productId = 'published'): DocumentData {
  return { productId, quantity, addedAt: serverTimestamp() };
}

/** Carrito sembrado con `count` líneas, `v1`…`v{count}`, cada una con su propia cantidad. */
function seededLines(count: number): Record<string, DocumentData> {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => [
      `v${index + 1}`,
      { ...fixtures.cartLine(), quantity: index + 1 },
    ]),
  );
}

function seedCart(count: number): Promise<void> {
  return seed(env, { [CART]: { lines: seededLines(count), updatedAt: fixtures.cart().updatedAt } });
}

const anotherTime = Timestamp.fromDate(new Date('2026-02-01T12:00:00-06:00'));

beforeAll(async () => {
  env = await createTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env.cleanup();
});

describe('creating the cart', () => {
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await asCustomer(env));
  });

  it('creates it empty', async () => {
    await assertSucceeds(setDoc(doc(db, CART), { lines: {}, updatedAt: serverTimestamp() }));
  });

  it('creates it with its first line', async () => {
    await assertSucceeds(
      setDoc(doc(db, CART), { lines: { v1: newLine() }, updatedAt: serverTimestamp() }),
    );
  });

  it('cannot create it with two lines', async () => {
    await assertFails(
      setDoc(doc(db, CART), {
        lines: { v1: newLine(), v2: newLine(2) },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it.each([0, 100])('cannot create it with a line of quantity %i', async (quantity) => {
    await assertFails(
      setDoc(doc(db, CART), {
        lines: { v1: newLine(quantity) },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('cannot create it without the server time', async () => {
    await assertFails(setDoc(doc(db, CART), { lines: {}, updatedAt: anotherTime }));
  });

  it('cannot create it with an unknown key', async () => {
    await assertFails(
      setDoc(doc(db, CART), { lines: {}, note: 'Para después', updatedAt: serverTimestamp() }),
    );
  });
});

describe('changing the cart', () => {
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await asCustomer(env));
    await seedCart(2);
  });

  it('adds a line', async () => {
    await assertSucceeds(
      updateDoc(doc(db, CART), { 'lines.v3': newLine(3), updatedAt: serverTimestamp() }),
    );
  });

  it('changes the quantity of a line', async () => {
    await assertSucceeds(
      updateDoc(doc(db, CART), { 'lines.v1': newLine(9), updatedAt: serverTimestamp() }),
    );
  });

  // La cantidad 0 se expresa quitando la línea: una sola clave afectada y ningún valor nuevo.
  it('removes a line', async () => {
    await assertSucceeds(
      updateDoc(doc(db, CART), { 'lines.v2': deleteField(), updatedAt: serverTimestamp() }),
    );
  });

  it('empties it', async () => {
    await assertSucceeds(updateDoc(doc(db, CART), { lines: {}, updatedAt: serverTimestamp() }));
  });

  it('deletes it', async () => {
    await assertSucceeds(deleteDoc(doc(db, CART)));
  });

  // El valor nuevo coincide con el de una línea que ya estaba, así que `removeAll` no deja
  // nada por revisar: ese valor ya pasó esta misma validación en su propia escritura.
  it('adds a line whose value already existed in another line', async () => {
    await assertSucceeds(
      updateDoc(doc(db, CART), {
        'lines.v3': { ...fixtures.cartLine(), quantity: 1 },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it.each([0, 100])('cannot set a line to quantity %i', async (quantity) => {
    await assertFails(
      updateDoc(doc(db, CART), { 'lines.v1': newLine(quantity), updatedAt: serverTimestamp() }),
    );
  });

  it('cannot set a quantity that is not a whole number', async () => {
    await assertFails(
      updateDoc(doc(db, CART), { 'lines.v1': newLine(1.5), updatedAt: serverTimestamp() }),
    );
  });

  it('cannot change two lines in one write', async () => {
    await assertFails(
      updateDoc(doc(db, CART), {
        'lines.v1': newLine(4),
        'lines.v2': newLine(5),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  // Con tres líneas, quitar dos deja el Carrito con una: no es un vaciado, así que la regla de
  // "una línea por escritura" aplica. Vaciarlo entero sí está permitido, y va probado arriba.
  it('cannot remove two lines in one write', async () => {
    await seedCart(3);
    await assertFails(
      updateDoc(doc(db, CART), {
        'lines.v1': deleteField(),
        'lines.v2': deleteField(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('cannot add a line with an unknown key', async () => {
    await assertFails(
      updateDoc(doc(db, CART), {
        'lines.v3': { ...newLine(), giftWrap: true },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('cannot add a line missing its product', async () => {
    await assertFails(
      updateDoc(doc(db, CART), {
        'lines.v3': { quantity: 1, addedAt: serverTimestamp() },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('cannot change a line without the server time', async () => {
    await assertFails(updateDoc(doc(db, CART), { 'lines.v1': newLine(9) }));
  });

  it('cannot change a line with a time that is not the server time', async () => {
    await assertFails(
      updateDoc(doc(db, CART), { 'lines.v1': newLine(9), updatedAt: anotherTime }),
    );
  });

  it('cannot add an unknown key to the document', async () => {
    await assertFails(
      updateDoc(doc(db, CART), { note: 'Para después', updatedAt: serverTimestamp() }),
    );
  });
});

describe('the fifty line limit', () => {
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await asCustomer(env));
  });

  it('adds the fiftieth line', async () => {
    await seedCart(49);
    await assertSucceeds(
      updateDoc(doc(db, CART), { 'lines.v50': newLine(), updatedAt: serverTimestamp() }),
    );
  });

  it('cannot add the fifty first line', async () => {
    await seedCart(50);
    await assertFails(
      updateDoc(doc(db, CART), { 'lines.v51': newLine(), updatedAt: serverTimestamp() }),
    );
  });

  it('still empties a full cart', async () => {
    await seedCart(50);
    await assertSucceeds(updateDoc(doc(db, CART), { lines: {}, updatedAt: serverTimestamp() }));
  });
});

describe('another customer', () => {
  it('cannot read or write the cart of the first customer', async () => {
    await seedCart(2);
    const db = firestoreOf(await asSecondCustomer(env));

    await assertFails(
      updateDoc(doc(db, CART), { 'lines.v1': newLine(9), updatedAt: serverTimestamp() }),
    );
    await assertFails(deleteDoc(doc(db, CART)));
  });
});
