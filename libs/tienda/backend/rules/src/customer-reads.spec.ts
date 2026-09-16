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
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import * as fixtures from './fixtures';
import {
  activeEmployeePersonas,
  asAccountWithoutCustomer,
  asCustomer,
  asCustomerEmployee,
  asSecondCustomer,
  createTestEnv,
  CUSTOMER_UID,
  EMPLOYEE_UIDS,
  firestoreOf,
  NO_CUSTOMER_UID,
  SECOND_CUSTOMER_UID,
  seed,
} from './harness';

// Lecturas del Cliente sobre lo suyo (#61): su perfil, sus Direcciones, sus Perfiles de
// facturación, su Carrito, sus Pedidos, sus Consentimientos y sus Solicitudes de derechos.

const CUSTOMER = `customers/${CUSTOMER_UID}`;
const ADDRESS = `${CUSTOMER}/addresses/a1`;
const BILLING_PROFILE = `${CUSTOMER}/billingProfiles/b1`;
const CART = `carts/${CUSTOMER_UID}`;

function customerDocs(): Record<string, DocumentData> {
  return {
    [CUSTOMER]: fixtures.customer(),
    [ADDRESS]: fixtures.address(),
    [BILLING_PROFILE]: fixtures.billingProfile(),
    [CART]: fixtures.cart(),
    'orders/own': fixtures.order(CUSTOMER_UID),
    // Pedido que quedó desasociado al eliminar una Cuenta anterior que tenía este mismo `uid`:
    // conserva `buyerUid` para el conflicto de interés, pero ya no tiene Cliente (§6.2).
    'orders/disassociated': fixtures.order(null, CUSTOMER_UID),
    'orders/other': fixtures.order(SECOND_CUSTOMER_UID),
    'consents/own': fixtures.consent(CUSTOMER_UID),
    'consents/other': fixtures.consent(SECOND_CUSTOMER_UID),
    'dataRequests/own': fixtures.dataRequest(CUSTOMER_UID),
    'dataRequests/other': fixtures.dataRequest(SECOND_CUSTOMER_UID),
    // Solicitud de supresión de una Cuenta cuyo Cliente ya no existe.
    'dataRequests/erasure': fixtures.dataRequest(NO_CUSTOMER_UID),
  };
}

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, customerDocs());
});

afterAll(async () => {
  await env.cleanup();
});

describe('as the owner customer', () => {
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await asCustomer(env));
  });

  it.each([
    ['its profile', CUSTOMER],
    ['its address', ADDRESS],
    ['its billing profile', BILLING_PROFILE],
    ['its cart', CART],
  ])('reads %s', async (_title, path) => {
    await assertSucceeds(getDoc(doc(db, path)));
  });

  it.each([
    ['its addresses', `${CUSTOMER}/addresses`],
    ['its billing profiles', `${CUSTOMER}/billingProfiles`],
  ])('lists %s', async (_title, path) => {
    await assertSucceeds(getDocs(collection(db, path)));
  });

  describe('its orders', () => {
    it('reads one of its own by id', async () => {
      await assertSucceeds(getDoc(doc(db, 'orders/own')));
    });

    it('lists them filtering by customerId', async () => {
      const orders = await assertSucceeds(
        getDocs(query(collection(db, 'orders'), where('customerId', '==', CUSTOMER_UID))),
      );
      expect(orders.docs.map((snapshot) => snapshot.id)).toEqual(['own']);
    });

    it('cannot list them without filtering by customerId', async () => {
      await assertFails(getDocs(collection(db, 'orders')));
    });

    // `buyerUid` sobrevive a la baja, así que no sirve de llave de lectura.
    it('cannot list them filtering by buyerUid', async () => {
      await assertFails(
        getDocs(query(collection(db, 'orders'), where('buyerUid', '==', CUSTOMER_UID))),
      );
    });

    it('cannot read one that belongs to another customer', async () => {
      await assertFails(getDoc(doc(db, 'orders/other')));
    });

    it('cannot read one that was disassociated from a previous customer with its uid', async () => {
      await assertFails(getDoc(doc(db, 'orders/disassociated')));
    });
  });

  describe('its privacy records', () => {
    it('reads its consents filtering by subjectId', async () => {
      const consents = await assertSucceeds(
        getDocs(query(collection(db, 'consents'), where('subjectId', '==', CUSTOMER_UID))),
      );
      expect(consents.docs.map((snapshot) => snapshot.id)).toEqual(['own']);
      await assertSucceeds(getDoc(doc(db, 'consents/own')));
    });

    it('reads its data requests filtering by the subject id', async () => {
      const requests = await assertSucceeds(
        getDocs(query(collection(db, 'dataRequests'), where('subject.id', '==', CUSTOMER_UID))),
      );
      expect(requests.docs.map((snapshot) => snapshot.id)).toEqual(['own']);
      await assertSucceeds(getDoc(doc(db, 'dataRequests/own')));
    });

    it.each([
      ['consents', 'consents'],
      ['data requests', 'dataRequests'],
    ])('cannot list all the %s', async (_title, path) => {
      await assertFails(getDocs(collection(db, path)));
    });

    it.each([
      ['consent', 'consents/other'],
      ['data request', 'dataRequests/other'],
    ])('cannot read the %s of another customer', async (_title, path) => {
      await assertFails(getDoc(doc(db, path)));
    });

    it.each([
      ['consents', 'consents/own'],
      ['data requests', 'dataRequests/own'],
    ])('cannot write its %s', async (_title, path) => {
      await assertFails(updateDoc(doc(db, path), { granted: false }));
      await assertFails(deleteDoc(doc(db, path)));
      await assertFails(setDoc(doc(db, `${path}-new`), { seeded: false }));
    });
  });
});

// Decisión de #61: la regla no exige `customers/{uid}` para leer una Solicitud de derechos.
// §5.8 la abre al dueño "mientras exista su Cliente", pero `deleteMyAccount` borra el Cliente
// y deja la Solicitud de supresión que confirma la baja: quien se dio de baja debe poder leerla.
describe('as an account whose customer document no longer exists', () => {
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await asAccountWithoutCustomer(env));
  });

  it('reads the data request that confirms its own erasure', async () => {
    await assertSucceeds(getDoc(doc(db, 'dataRequests/erasure')));
  });

  it('cannot read the data request of somebody else', async () => {
    await assertFails(getDoc(doc(db, 'dataRequests/own')));
  });

  it('cannot read the customer data of somebody else', async () => {
    await assertFails(getDoc(doc(db, CUSTOMER)));
    await assertFails(getDoc(doc(db, CART)));
  });
});

// Un Cliente no ve nada de otro Cliente.
describe('as another customer', () => {
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await asSecondCustomer(env));
  });

  it.each([
    ['the profile', CUSTOMER],
    ['the address', ADDRESS],
    ['the billing profile', BILLING_PROFILE],
    ['the cart', CART],
    ['the order', 'orders/own'],
  ])('cannot read %s of the first customer', async (_title, path) => {
    await assertFails(getDoc(doc(db, path)));
  });

  it.each([
    ['addresses', `${CUSTOMER}/addresses`],
    ['billing profiles', `${CUSTOMER}/billingProfiles`],
  ])('cannot list the %s of the first customer', async (_title, path) => {
    await assertFails(getDocs(collection(db, path)));
  });

  it('cannot list the orders of the first customer', async () => {
    await assertFails(
      getDocs(query(collection(db, 'orders'), where('customerId', '==', CUSTOMER_UID))),
    );
  });
});

// El Carrito no lo lee ningún Rol del Panel (§6.1). La matriz de #57 no puede expresarlo,
// porque `permission: null` significa "cualquier Empleado Activo": va fijado a mano.
describe.each(activeEmployeePersonas)('the cart as active %s', (_role, persona) => {
  it('is denied, by id and listing', async () => {
    const db = firestoreOf(await persona(env));
    await assertFails(getDoc(doc(db, CART)));
    await assertFails(getDocs(collection(db, 'carts')));
  });
});

// Los dos papeles de una misma Cuenta se evalúan por separado: son dos documentos y dos ramas
// de regla. El Empleado es Operador, así que tiene "Ver Clientes" y "Ver Pedidos".
describe('an account that is both customer and employee', () => {
  const uid = EMPLOYEE_UIDS.customerEmployee;

  it('keeps what is its own as a customer once its employee is disabled', async () => {
    const db = firestoreOf(await asCustomerEmployee(env, 'disabled'));
    await seed(env, { [`carts/${uid}`]: fixtures.cart() });

    await assertSucceeds(getDoc(doc(db, `customers/${uid}`)));
    await assertSucceeds(getDoc(doc(db, `carts/${uid}`)));
    await assertFails(getDoc(doc(db, CUSTOMER)));
    await assertFails(getDoc(doc(db, 'orders/own')));
  });

  it('keeps the panel once its customer is disabled', async () => {
    const db = firestoreOf(await asCustomerEmployee(env, 'active'));
    await seed(env, { [`customers/${uid}`]: fixtures.customer('disabled') });

    await assertSucceeds(getDoc(doc(db, CUSTOMER)));
    await assertSucceeds(getDoc(doc(db, 'orders/own')));
    await assertSucceeds(getDoc(doc(db, `customers/${uid}`)));
  });
});
