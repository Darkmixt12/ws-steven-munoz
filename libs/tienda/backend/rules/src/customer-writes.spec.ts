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
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import * as fixtures from './fixtures';
import {
  asAccountWithoutCustomer,
  asCustomer,
  asSecondCustomer,
  createTestEnv,
  CUSTOMER_UID,
  firestoreOf,
  NO_CUSTOMER_UID,
  seed,
} from './harness';

// Escrituras del Cliente directo sobre su perfil, sus Direcciones y sus Perfiles de
// facturación (#61). El Cliente sella la hora del servidor pero no el Autor: `updatedBy` es
// solo del Panel directo, y estas escrituras no se auditan.

const CUSTOMER = `customers/${CUSTOMER_UID}`;
const ADDRESS = `${CUSTOMER}/addresses/a1`;
const BILLING_PROFILE = `${CUSTOMER}/billingProfiles/b1`;

function customerDocs(): Record<string, DocumentData> {
  return {
    [CUSTOMER]: fixtures.customer(),
    [ADDRESS]: fixtures.address(),
    [BILLING_PROFILE]: fixtures.billingProfile(),
  };
}

/** Dirección tal como la escribe el Cliente: sella la hora del servidor, sin Autor. */
function newAddress(overrides: DocumentData = {}): DocumentData {
  return {
    ...fixtures.addressDetails(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function newBillingProfile(overrides: DocumentData = {}): DocumentData {
  return {
    ...fixtures.billingProfileDetails(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

/** Ubicación del Perfil de facturación, para probar la forma de su mapa anidado. */
function location(overrides: DocumentData = {}): DocumentData {
  return {
    districtCode: '10101',
    provinceName: 'San José',
    cantonName: 'San José',
    districtName: 'Carmen',
    otherSigns: 'Frente al parque',
    ...overrides,
  };
}

/** Copia sin una clave, para probar un documento al que le falta un campo. */
function without(data: DocumentData, key: string): DocumentData {
  const copy = { ...data };
  delete copy[key];
  return copy;
}

/** Una hora que no es la del servidor, para probar sellos y fechas falsificadas. */
const anotherTime = Timestamp.fromDate(new Date('2026-02-01T12:00:00-06:00'));

/** Ediciones del perfil que la regla rechaza: solo `name`, `phone` y `defaultAddressId` (nota 6). */
const INVALID_PROFILE_UPDATES: readonly [string, DocumentData][] = [
  ['its status', { status: 'disabled' }],
  ['the reason of its status', { statusReason: { code: 'suspectedFraud', note: null } }],
  ['its email', { email: 'otro@example.com' }],
  ['its creation time', { createdAt: anotherTime }],
  ['an unknown key', { nickname: 'Cli' }],
  ['its name together with its status', { name: 'Nuevo', status: 'disabled' }],
];

/** Direcciones que la regla rechaza: §5.2 documenta la forma de cada campo. */
const INVALID_ADDRESSES: readonly [string, DocumentData][] = [
  ['with a district code of four digits', { districtCode: '1010' }],
  ['with a district code of six digits', { districtCode: '101011' }],
  ['with a district code that is not a number', { districtCode: 'SJ101' }],
  ['with a phone from another country', { phone: '+12025550123' }],
  ['with a phone without the country code', { phone: '88887777' }],
  ['with a phone of seven digits after +506', { phone: '+5068888777' }],
  ['with other signs of four characters', { otherSigns: 'Casa' }],
  ['with other signs of 251 characters', { otherSigns: 'x'.repeat(251) }],
  ['with an unknown key', { landmark: 'La iglesia' }],
];

/** Perfiles de facturación que la regla rechaza: §5.3 documenta la forma de cada campo. */
const INVALID_BILLING_PROFILES: readonly [string, DocumentData][] = [
  ['with an unknown id type', { idType: '05' }],
  ['with an id number that is not text', { idNumber: 100_000_000 }],
  ['with a location missing a key', { location: without(location(), 'cantonName') }],
  ['with an unknown key in the location', { location: location({ landmark: 'La iglesia' }) }],
  [
    'with a district code that is not five digits in the location',
    { location: location({ districtCode: '101' }) },
  ],
  [
    'with other signs of four characters in the location',
    { location: location({ otherSigns: 'Casa' }) },
  ],
  [
    'with other signs of 251 characters in the location',
    { location: location({ otherSigns: 'x'.repeat(251) }) },
  ],
  ['with an unknown key', { isDefault: true }],
];

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

  describe('its profile', () => {
    it('updates its name, phone and default address', async () => {
      await assertSucceeds(
        updateDoc(doc(db, CUSTOMER), {
          name: 'Cliente Nuevo',
          phone: '+50688887777',
          defaultAddressId: 'a1',
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('clears its default address', async () => {
      await assertSucceeds(
        updateDoc(doc(db, CUSTOMER), {
          defaultAddressId: null,
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it.each(INVALID_PROFILE_UPDATES)('cannot change %s', async (_title, overrides) => {
      await assertFails(
        updateDoc(doc(db, CUSTOMER), { ...overrides, updatedAt: serverTimestamp() }),
      );
    });

    it('cannot update it without the server time', async () => {
      await assertFails(updateDoc(doc(db, CUSTOMER), { name: 'Cliente Nuevo' }));
    });

    it('cannot update it with a time that is not the server time', async () => {
      await assertFails(
        updateDoc(doc(db, CUSTOMER), { name: 'Cliente Nuevo', updatedAt: anotherTime }),
      );
    });

    it('cannot set a phone that is not E.164', async () => {
      await assertFails(
        updateDoc(doc(db, CUSTOMER), { phone: '8888-7777', updatedAt: serverTimestamp() }),
      );
    });

    it('cannot set a default address that is not text', async () => {
      await assertFails(
        updateDoc(doc(db, CUSTOMER), { defaultAddressId: 1, updatedAt: serverTimestamp() }),
      );
    });

    // Lo borra `deleteMyAccount`, que además bloquea la baja con Pedidos en curso (§5.1).
    it('cannot delete it', async () => {
      await assertFails(deleteDoc(doc(db, CUSTOMER)));
    });

    it('cannot overwrite it wholesale', async () => {
      await assertFails(setDoc(doc(db, CUSTOMER), fixtures.customer()));
    });
  });

  describe('its addresses', () => {
    it('creates one', async () => {
      await assertSucceeds(setDoc(doc(db, `${CUSTOMER}/addresses/a2`), newAddress()));
    });

    it('creates one with a neighborhood', async () => {
      await assertSucceeds(
        setDoc(doc(db, `${CUSTOMER}/addresses/a2`), newAddress({ neighborhood: 'Barrio Escalante' })),
      );
    });

    it.each([5, 250])('creates one with other signs of %i characters', async (size) => {
      await assertSucceeds(
        setDoc(doc(db, `${CUSTOMER}/addresses/a2`), newAddress({ otherSigns: 'x'.repeat(size) })),
      );
    });

    it('edits one', async () => {
      await assertSucceeds(
        updateDoc(doc(db, ADDRESS), {
          otherSigns: 'Contiguo a la escuela',
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('deletes one', async () => {
      await assertSucceeds(deleteDoc(doc(db, ADDRESS)));
    });

    it.each(INVALID_ADDRESSES)('cannot create one %s', async (_title, overrides) => {
      await assertFails(
        setDoc(doc(db, `${CUSTOMER}/addresses/a2`), newAddress(overrides)),
      );
    });

    it.each(INVALID_ADDRESSES)('cannot edit one into %s', async (_title, overrides) => {
      await assertFails(
        setDoc(doc(db, ADDRESS), newAddress({ ...overrides, createdAt: fixtures.address().createdAt })),
      );
    });

    it('cannot create one missing a field', async () => {
      await assertFails(
        setDoc(doc(db, `${CUSTOMER}/addresses/a2`), without(newAddress(), 'provinceName')),
      );
    });

    it('cannot create one without the server time', async () => {
      await assertFails(
        setDoc(doc(db, `${CUSTOMER}/addresses/a2`), newAddress({ createdAt: anotherTime })),
      );
    });

    it('cannot move the creation time of an existing one', async () => {
      await assertFails(
        updateDoc(doc(db, ADDRESS), {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });
  });

  describe('its billing profiles', () => {
    it('creates one without a location', async () => {
      await assertSucceeds(
        setDoc(doc(db, `${CUSTOMER}/billingProfiles/b2`), newBillingProfile()),
      );
    });

    it('creates one with a location', async () => {
      await assertSucceeds(
        setDoc(
          doc(db, `${CUSTOMER}/billingProfiles/b2`),
          newBillingProfile({ location: location() }),
        ),
      );
    });

    // El Comprobante corta las señas en 160 (`settings/issuer`); el Perfil admite 250.
    it('creates one with other signs of 250 characters in its location', async () => {
      await assertSucceeds(
        setDoc(
          doc(db, `${CUSTOMER}/billingProfiles/b2`),
          newBillingProfile({ location: location({ otherSigns: 'x'.repeat(250) }) }),
        ),
      );
    });

    it.each(['01', '02', '03', '04'])('creates one with the id type %s', async (idType) => {
      await assertSucceeds(
        setDoc(doc(db, `${CUSTOMER}/billingProfiles/b2`), newBillingProfile({ idType })),
      );
    });

    it('edits one', async () => {
      await assertSucceeds(
        updateDoc(doc(db, BILLING_PROFILE), {
          legalName: 'Cliente Pérez Sociedad Anónima',
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('deletes one', async () => {
      await assertSucceeds(deleteDoc(doc(db, BILLING_PROFILE)));
    });

    it.each(INVALID_BILLING_PROFILES)('cannot create one %s', async (_title, overrides) => {
      await assertFails(
        setDoc(doc(db, `${CUSTOMER}/billingProfiles/b2`), newBillingProfile(overrides)),
      );
    });

    it('cannot create one missing a field', async () => {
      await assertFails(
        setDoc(
          doc(db, `${CUSTOMER}/billingProfiles/b2`),
          without(newBillingProfile(), 'legalName'),
        ),
      );
    });

    it('cannot create one without the server time', async () => {
      await assertFails(
        setDoc(
          doc(db, `${CUSTOMER}/billingProfiles/b2`),
          newBillingProfile({ updatedAt: anotherTime }),
        ),
      );
    });

    it('cannot move the creation time of an existing one', async () => {
      await assertFails(
        updateDoc(doc(db, BILLING_PROFILE), {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });
  });
});

// Criterio de Ley 8968: sin Consentimiento no hay dato personal en Firestore. Firestore deja
// crear un documento de subcolección bajo un padre que no existe, así que hace falta
// comprobar `customers/{uid}` en cada alta.
describe('as an account that has not completed its registration', () => {
  let db: Firestore;
  const own = `customers/${NO_CUSTOMER_UID}`;

  beforeEach(async () => {
    db = firestoreOf(await asAccountWithoutCustomer(env));
  });

  it('cannot create its own customer document', async () => {
    await assertFails(setDoc(doc(db, own), fixtures.customer()));
  });

  it('cannot create an address under the customer document it does not have', async () => {
    await assertFails(setDoc(doc(db, `${own}/addresses/a1`), newAddress()));
  });

  it('cannot create a billing profile under the customer document it does not have', async () => {
    await assertFails(setDoc(doc(db, `${own}/billingProfiles/b1`), newBillingProfile()));
  });

  it('cannot create its cart', async () => {
    await assertFails(
      setDoc(doc(db, `carts/${NO_CUSTOMER_UID}`), { lines: {}, updatedAt: serverTimestamp() }),
    );
  });
});

describe('as another customer', () => {
  let db: Firestore;

  beforeEach(async () => {
    db = firestoreOf(await asSecondCustomer(env));
  });

  it.each([
    ['the profile', CUSTOMER],
    ['the addresses', ADDRESS],
    ['the billing profiles', BILLING_PROFILE],
  ])('cannot write %s of the first customer', async (_title, path) => {
    await assertFails(updateDoc(doc(db, path), { updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(doc(db, path)));
  });
});
