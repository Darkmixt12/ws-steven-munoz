/**
 * Los documentos con que nace una Tienda CR: el primer Administrador, el contador de Pedidos, la
 * Configuración de la tienda y la primera versión del Aviso de privacidad.
 *
 * Módulo puro: no habla con Firestore ni con el Admin SDK, así que las formas se fijan en una
 * prueba sin emuladores. El sello de hora entra por parámetro, que es donde el script mete el
 * `Timestamp` del Admin SDK.
 */
import type {
  Consent,
  Employee,
  OrderNumberCounter,
  PrivacyNotice,
  Purpose,
  StaffDirectoryEntry,
  StorefrontSettings,
  Timestamp,
} from 'tienda/domain';

/** Versión del primer Aviso, con la convención `yyyy-mm`. Es el id de `privacyNotices/{version}`. */
export const PRIVACY_NOTICE_VERSION = '2026-01';

/** Número del primer Pedido, si no se pide otro con `--first-order-number`. */
export const DEFAULT_FIRST_ORDER_NUMBER = 1001;

/** El primer Aviso cubre las tres Finalidades del glosario: es el único que hay. */
export const SEED_NOTICE_PURPOSES: readonly Purpose[] = [
  'accountAndOrders',
  'marketing',
  'panelAccess',
];

export const ORDER_NUMBER_COUNTER_PATH = 'counters/orderNumber';
export const STOREFRONT_SETTINGS_PATH = 'settings/storefront';
export const CONSENTS_COLLECTION = 'consents';

export const privacyNoticePath = (version: string): string =>
  `privacyNotices/${version}`;
export const employeePath = (uid: string): string => `employees/${uid}`;
export const staffDirectoryPath = (uid: string): string => `staffDirectory/${uid}`;

/** Lo que trae `seed/storefront.json`: la Configuración sin los sellos ni la versión del Aviso. */
export type StorefrontBaseValues = Omit<
  StorefrontSettings,
  'currentPrivacyNoticeVersion' | 'updatedAt' | 'updatedBy'
>;

const STOREFRONT_BASE_FIELDS = [
  'shippingRates',
  'shippingVatRateCode',
  'paymentTimeouts',
  'sinpeMovilNumber',
  'storeInfo',
  'pickupInfo',
] as const;

const PAYMENT_TIMEOUT_FIELDS = ['cardMinutes', 'sinpeMovilMinutes'] as const;
const STORE_INFO_FIELDS = ['name', 'contactEmail', 'contactPhone'] as const;
const PICKUP_INFO_FIELDS = ['address', 'hours'] as const;

/** Códigos de provincia de la DTA: los mismos siete que admite `firestore.rules`. */
const PROVINCE_CODES: readonly string[] = ['1', '2', '3', '4', '5', '6', '7'];

function asRecord(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${what}: se esperaba un objeto.`);
  }
  return value as Record<string, unknown>;
}

/** Claves exactas: ni de más ni de menos, como `keysAre` en las reglas. */
function expectKeys(
  value: Record<string, unknown>,
  fields: readonly string[],
  what: string,
): void {
  const actual = Object.keys(value).sort().join(', ');
  const expected = [...fields].sort().join(', ');
  if (actual !== expected) {
    throw new Error(
      `${what}: las claves tienen que ser exactamente [${expected}]; llegaron [${actual}].`,
    );
  }
}

function asText(value: unknown, what: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${what}: se esperaba un texto no vacío.`);
  }
  return value;
}

function asNumber(value: unknown, what: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${what}: se esperaba un número.`);
  }
  return value;
}

/**
 * Valida `seed/storefront.json` contra la forma que exige `firestore.rules`. El Admin SDK se salta
 * las reglas, así que sin esto un JSON mal puesto crearía una Configuración que el Panel nunca
 * podría volver a guardar.
 */
export function parseStorefrontBase(value: unknown): StorefrontBaseValues {
  const base = asRecord(value, 'storefront.json');
  expectKeys(base, STOREFRONT_BASE_FIELDS, 'storefront.json');

  const rates = asRecord(base['shippingRates'], 'shippingRates');
  const codes = Object.keys(rates);
  if (codes.length === 0) {
    throw new Error('shippingRates: hace falta la tarifa de al menos una provincia.');
  }
  for (const code of codes) {
    if (!PROVINCE_CODES.includes(code)) {
      throw new Error(
        `shippingRates: \`${code}\` no es un código de provincia; van del 1 al 7.`,
      );
    }
  }

  const timeouts = asRecord(base['paymentTimeouts'], 'paymentTimeouts');
  expectKeys(timeouts, PAYMENT_TIMEOUT_FIELDS, 'paymentTimeouts');

  const storeInfo = asRecord(base['storeInfo'], 'storeInfo');
  expectKeys(storeInfo, STORE_INFO_FIELDS, 'storeInfo');

  const pickupInfo = asRecord(base['pickupInfo'], 'pickupInfo');
  expectKeys(pickupInfo, PICKUP_INFO_FIELDS, 'pickupInfo');

  return {
    shippingRates: Object.fromEntries(
      codes.map((code) => [code, asNumber(rates[code], `shippingRates.${code}`)]),
    ),
    shippingVatRateCode: asText(base['shippingVatRateCode'], 'shippingVatRateCode'),
    paymentTimeouts: {
      cardMinutes: asNumber(timeouts['cardMinutes'], 'paymentTimeouts.cardMinutes'),
      sinpeMovilMinutes: asNumber(
        timeouts['sinpeMovilMinutes'],
        'paymentTimeouts.sinpeMovilMinutes',
      ),
    },
    sinpeMovilNumber: asText(base['sinpeMovilNumber'], 'sinpeMovilNumber'),
    storeInfo: {
      name: asText(storeInfo['name'], 'storeInfo.name'),
      contactEmail: asText(storeInfo['contactEmail'], 'storeInfo.contactEmail'),
      contactPhone: asText(storeInfo['contactPhone'], 'storeInfo.contactPhone'),
    },
    pickupInfo: {
      address: asText(pickupInfo['address'], 'pickupInfo.address'),
      hours: asText(pickupInfo['hours'], 'pickupInfo.hours'),
    },
  };
}

/** Todo lo que hace falta para armar la semilla. */
export interface SeedInput {
  /** `uid` de la Cuenta de Auth del primer Administrador. */
  adminUid: string;
  adminEmail: string;
  adminName: string;
  noticeVersion: string;
  noticeText: string;
  /** SHA-256 del texto del Aviso; lo calcula `privacyNoticeHash`. */
  noticeHash: string;
  storefront: StorefrontBaseValues;
  firstOrderNumber: number;
  now: Timestamp;
}

export type SeedDocumentData =
  | Consent
  | Employee
  | OrderNumberCounter
  | PrivacyNotice
  | StaffDirectoryEntry
  | StorefrontSettings;

/** Un documento de la semilla. */
export interface SeedDocument {
  /** Ruta del documento, o de la colección si el id lo pone Firestore. */
  path: string;
  /** `true` solo en la evidencia de Consentimiento, que es `consents/{autoId}`. */
  autoId: boolean;
  data: SeedDocumentData;
}

/** El primer Administrador: nadie lo invitó, así que se autoinvita. */
export function firstAdministrator(input: SeedInput): Employee {
  return {
    email: input.adminEmail,
    name: input.adminName,
    phone: null,
    role: 'administrator',
    status: 'active',
    statusReason: null,
    invitedBy: input.adminUid,
    invitedAt: input.now,
    statusChangedAt: input.now,
    lastPanelEntryAt: null,
    anonymizedAt: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function firstAdministratorDirectoryEntry(
  input: SeedInput,
): StaffDirectoryEntry {
  return { name: input.adminName };
}

export function orderNumberCounter(input: SeedInput): OrderNumberCounter {
  return { next: input.firstOrderNumber };
}

export function firstPrivacyNotice(input: SeedInput): PrivacyNotice {
  return {
    text: input.noticeText,
    purposes: [...SEED_NOTICE_PURPOSES],
    publishedAt: input.now,
    updatedBy: input.adminUid,
  };
}

export function baseStorefrontSettings(input: SeedInput): StorefrontSettings {
  return {
    ...input.storefront,
    currentPrivacyNoticeVersion: input.noticeVersion,
    updatedAt: input.now,
    updatedBy: input.adminUid,
  };
}

/** Consentimiento de acceso al Panel del primer Administrador, contra el Aviso recién sembrado. */
export function panelAccessConsent(input: SeedInput): Consent {
  return {
    subjectType: 'employee',
    subjectId: input.adminUid,
    purpose: 'panelAccess',
    granted: true,
    noticeVersion: input.noticeVersion,
    noticeHash: input.noticeHash,
    channel: 'panel',
    createdAt: input.now,
    expiresAt: null,
  };
}

/**
 * Los seis documentos, en el orden en que se escriben. El Aviso va primero porque
 * `firestore.rules` exige que exista la versión que señala `settings/storefront`.
 */
export function seedDocuments(input: SeedInput): readonly SeedDocument[] {
  return [
    {
      path: privacyNoticePath(input.noticeVersion),
      autoId: false,
      data: firstPrivacyNotice(input),
    },
    {
      path: employeePath(input.adminUid),
      autoId: false,
      data: firstAdministrator(input),
    },
    {
      path: staffDirectoryPath(input.adminUid),
      autoId: false,
      data: firstAdministratorDirectoryEntry(input),
    },
    {
      path: ORDER_NUMBER_COUNTER_PATH,
      autoId: false,
      data: orderNumberCounter(input),
    },
    {
      path: STOREFRONT_SETTINGS_PATH,
      autoId: false,
      data: baseStorefrontSettings(input),
    },
    {
      path: CONSENTS_COLLECTION,
      autoId: true,
      data: panelAccessConsent(input),
    },
  ];
}
