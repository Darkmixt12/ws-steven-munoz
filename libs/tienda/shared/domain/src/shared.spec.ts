import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { Timestamp as WebTimestamp } from 'firebase/firestore';
import { costaRicaDay, normalizeEmail, normalizeSku, type Timestamp } from './shared';

describe('Timestamp', () => {
  it('is satisfied by the Timestamp of the web SDK and of the Admin SDK', () => {
    const millis = 1_700_000_000_123;
    const fromWeb: Timestamp = WebTimestamp.fromMillis(millis);
    const fromAdmin: Timestamp = AdminTimestamp.fromMillis(millis);

    for (const timestamp of [fromWeb, fromAdmin]) {
      expect(timestamp.seconds).toBe(1_700_000_000);
      expect(timestamp.nanoseconds).toBe(123_000_000);
      expect(timestamp.toMillis()).toBe(millis);
      expect(timestamp.toDate()).toEqual(new Date(millis));
    }
  });
});

describe('normalizeSku', () => {
  it.each([
    ['cam-s', 'CAM-S'],
    ['  cam s  ', 'CAMS'],
    ['cam-s.1/2', 'CAM-S.1/2'],
  ])('normalizes %s to %s', (value, expected) => {
    expect(normalizeSku(value)).toBe(expected);
  });

  it('removes every kind of whitespace, not only the blank space', () => {
    expect(normalizeSku('cam\ts\nm')).toBe('CAMSM');
  });

  it('leaves an already normalized sku untouched', () => {
    expect(normalizeSku('CAM-S')).toBe('CAM-S');
  });

  it('is idempotent', () => {
    const once = normalizeSku(' cam s ');
    expect(normalizeSku(once)).toBe(once);
  });
});

describe('normalizeEmail', () => {
  it.each([
    ['Ana@Example.COM', 'ana@example.com'],
    ['  ana@example.com  ', 'ana@example.com'],
    ['ANA.PEREZ+tienda@example.com', 'ana.perez+tienda@example.com'],
  ])('normalizes %s to %s', (value, expected) => {
    expect(normalizeEmail(value)).toBe(expected);
  });

  it('removes every kind of whitespace, not only the blank space', () => {
    expect(normalizeEmail('ana\t@example\n.com')).toBe('ana@example.com');
  });

  it('leaves an already normalized email untouched', () => {
    expect(normalizeEmail('ana@example.com')).toBe('ana@example.com');
  });

  it('is idempotent', () => {
    const once = normalizeEmail(' Ana@Example.com ');
    expect(normalizeEmail(once)).toBe(once);
  });
});

describe('costaRicaDay', () => {
  it('is the day in Costa Rica, six hours behind UTC', () => {
    expect(costaRicaDay(new Date('2026-09-15T17:30:00Z'))).toBe('2026-09-15');
  });

  it('still belongs to the previous day until 06:00 UTC', () => {
    expect(costaRicaDay(new Date('2026-09-16T05:59:59Z'))).toBe('2026-09-15');
    expect(costaRicaDay(new Date('2026-09-16T06:00:00Z'))).toBe('2026-09-16');
  });

  it('rolls the year over at the right instant', () => {
    expect(costaRicaDay(new Date('2027-01-01T05:00:00Z'))).toBe('2026-12-31');
    expect(costaRicaDay(new Date('2027-01-01T06:00:00Z'))).toBe('2027-01-01');
  });

  it('does not shift with daylight saving, which Costa Rica does not observe', () => {
    expect(costaRicaDay(new Date('2026-07-01T06:00:00Z'))).toBe('2026-07-01');
    expect(costaRicaDay(new Date('2026-12-01T06:00:00Z'))).toBe('2026-12-01');
  });
});
