import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { Timestamp as WebTimestamp } from 'firebase/firestore';
import { normalizeSku, type Timestamp } from './shared';

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
