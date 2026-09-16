/**
 * Fija la forma de cada documento de la semilla de #67 y la validación de `seed/storefront.json`.
 * No necesita emuladores: el módulo es puro. Las reglas se prueban aparte, en
 * `libs/tienda/backend/rules/src/seed.spec.ts`.
 */
import { Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CONSENTS_COLLECTION,
  DEFAULT_FIRST_ORDER_NUMBER,
  ORDER_NUMBER_COUNTER_PATH,
  PRIVACY_NOTICE_VERSION,
  SEED_NOTICE_PURPOSES,
  STOREFRONT_SETTINGS_PATH,
  baseStorefrontSettings,
  firstAdministrator,
  firstPrivacyNotice,
  orderNumberCounter,
  panelAccessConsent,
  parseStorefrontBase,
  seedDocuments,
  type SeedInput,
  type StorefrontBaseValues,
} from './seed-data';

const SEED_DIR = join(__dirname, '..', 'seed');

const ADMIN_UID = 'administrator-1';
const now = Timestamp.fromDate(new Date('2026-01-15T12:00:00-06:00'));

/** El fichero versionado, tal como lo lee el script. */
function committedStorefront(): unknown {
  return JSON.parse(readFileSync(join(SEED_DIR, 'storefront.json'), 'utf8'));
}

function committedNoticeText(): string {
  return readFileSync(
    join(SEED_DIR, `privacy-notice-${PRIVACY_NOTICE_VERSION}.md`),
    'utf8',
  );
}

function input(overrides: Partial<SeedInput> = {}): SeedInput {
  return {
    adminUid: ADMIN_UID,
    adminEmail: 'admin@tienda.cr',
    adminName: 'Administradora',
    noticeVersion: PRIVACY_NOTICE_VERSION,
    noticeText: committedNoticeText(),
    noticeHash: 'a'.repeat(64),
    storefront: parseStorefrontBase(committedStorefront()),
    firstOrderNumber: DEFAULT_FIRST_ORDER_NUMBER,
    now,
    ...overrides,
  };
}

/** Copia del JSON versionado con una clave cambiada, para probar la validación. */
function storefrontWith(overrides: Record<string, unknown>): unknown {
  return { ...(committedStorefront() as Record<string, unknown>), ...overrides };
}

function without(value: unknown, key: string): unknown {
  const copy = { ...(value as Record<string, unknown>) };
  delete copy[key];
  return copy;
}

describe('the committed seed values', () => {
  it('parses storefront.json', () => {
    expect(() => parseStorefrontBase(committedStorefront())).not.toThrow();
  });

  it('gives a shipping rate to each of the seven provinces', () => {
    const base = parseStorefrontBase(committedStorefront());
    expect(Object.keys(base.shippingRates).sort()).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
    ]);
  });

  it('names the privacy notice file after the version', () => {
    expect(PRIVACY_NOTICE_VERSION).toMatch(/^\d{4}-\d{2}$/u);
    expect(committedNoticeText().trim()).not.toBe('');
  });
});

describe('parseStorefrontBase', () => {
  it.each([
    ['is not an object', 'texto'],
    ['is null', null],
    ['is an array', []],
  ])('rejects a value that %s', (_title, value) => {
    expect(() => parseStorefrontBase(value)).toThrow();
  });

  it('rejects an unknown key', () => {
    expect(() => parseStorefrontBase(storefrontWith({ bannerText: 'Envío gratis' }))).toThrow(
      /claves/u,
    );
  });

  it('rejects a missing key', () => {
    expect(() => parseStorefrontBase(without(committedStorefront(), 'pickupInfo'))).toThrow(
      /claves/u,
    );
  });

  // `firestore.rules` solo admite los códigos 1–7: un código de más dejaría una Configuración
  // que el Panel nunca podría volver a guardar.
  it('rejects a province that does not exist', () => {
    expect(() => parseStorefrontBase(storefrontWith({ shippingRates: { '8': 2_500 } }))).toThrow(
      /provincia/u,
    );
  });

  it('rejects an empty shipping rate table', () => {
    expect(() => parseStorefrontBase(storefrontWith({ shippingRates: {} }))).toThrow();
  });

  it('rejects a rate that is not a number', () => {
    expect(() =>
      parseStorefrontBase(storefrontWith({ shippingRates: { '1': '2500' } })),
    ).toThrow(/número/u);
  });

  it.each([
    ['payment timeouts', 'paymentTimeouts', { cardMinutes: 60, sinpeMovilMinutes: 1_440, cashHours: 2 }],
    ['store info', 'storeInfo', { name: 'Tienda CR', contactEmail: 'x@y.cr' }],
    ['pickup info', 'pickupInfo', { address: 'San José' }],
  ])('rejects wrong keys in the %s', (_title, key, value) => {
    expect(() => parseStorefrontBase(storefrontWith({ [key]: value }))).toThrow(/claves/u);
  });

  it('rejects an empty text field', () => {
    expect(() => parseStorefrontBase(storefrontWith({ sinpeMovilNumber: '   ' }))).toThrow();
  });
});

describe('the first administrator', () => {
  it('is an active administrator that invited itself', () => {
    expect(firstAdministrator(input())).toEqual({
      email: 'admin@tienda.cr',
      name: 'Administradora',
      phone: null,
      role: 'administrator',
      status: 'active',
      statusReason: null,
      invitedBy: ADMIN_UID,
      invitedAt: now,
      statusChangedAt: now,
      lastPanelEntryAt: null,
      anonymizedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  });
});

describe('the order number counter', () => {
  it('starts at 1001 by default', () => {
    expect(orderNumberCounter(input())).toEqual({ next: 1_001 });
    expect(DEFAULT_FIRST_ORDER_NUMBER).toBe(1_001);
  });

  it('starts wherever it is told to', () => {
    expect(orderNumberCounter(input({ firstOrderNumber: 5_000 }))).toEqual({ next: 5_000 });
  });
});

describe('the first privacy notice', () => {
  it('publishes the committed text and covers the three purposes', () => {
    const notice = firstPrivacyNotice(input());
    expect(notice.text).toBe(committedNoticeText());
    expect(notice.purposes).toEqual([...SEED_NOTICE_PURPOSES]);
    expect(notice.publishedAt).toBe(now);
    expect(notice.updatedBy).toBe(ADMIN_UID);
  });
});

describe('the storefront settings', () => {
  it('point at the seeded notice and carry the author', () => {
    const settings = baseStorefrontSettings(input());
    expect(settings.currentPrivacyNoticeVersion).toBe(PRIVACY_NOTICE_VERSION);
    expect(settings.updatedBy).toBe(ADMIN_UID);
    expect(settings.updatedAt).toBe(now);
  });

  it('keep every base value untouched', () => {
    const base: StorefrontBaseValues = parseStorefrontBase(committedStorefront());
    expect(baseStorefrontSettings(input())).toMatchObject(base);
  });
});

describe('the panel access consent', () => {
  it('is the administrator granting panelAccess through the panel', () => {
    expect(panelAccessConsent(input())).toEqual({
      subjectType: 'employee',
      subjectId: ADMIN_UID,
      purpose: 'panelAccess',
      granted: true,
      noticeVersion: PRIVACY_NOTICE_VERSION,
      noticeHash: 'a'.repeat(64),
      channel: 'panel',
      createdAt: now,
      expiresAt: null,
    });
  });
});

describe('seedDocuments', () => {
  const documents = seedDocuments(input());

  it('writes the privacy notice before the settings that point at it', () => {
    const paths = documents.map((document) => document.path);
    expect(paths.indexOf(`privacyNotices/${PRIVACY_NOTICE_VERSION}`)).toBeLessThan(
      paths.indexOf(STOREFRONT_SETTINGS_PATH),
    );
  });

  it('is exactly the six documents of #67', () => {
    expect(documents.map((document) => document.path)).toEqual([
      `privacyNotices/${PRIVACY_NOTICE_VERSION}`,
      `employees/${ADMIN_UID}`,
      `staffDirectory/${ADMIN_UID}`,
      ORDER_NUMBER_COUNTER_PATH,
      STOREFRONT_SETTINGS_PATH,
      CONSENTS_COLLECTION,
    ]);
  });

  // `settings/issuer` lo llena el Administrador desde el Panel: no tiene semilla.
  it('does not seed the issuer settings', () => {
    expect(documents.map((document) => document.path)).not.toContain('settings/issuer');
  });

  it('only lets Firestore number the consent', () => {
    expect(
      documents.filter((document) => document.autoId).map((document) => document.path),
    ).toEqual([CONSENTS_COLLECTION]);
  });

  it('is stable: the same input gives the same documents', () => {
    expect(seedDocuments(input())).toEqual(documents);
  });
});
