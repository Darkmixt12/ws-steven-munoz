import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { Timestamp as WebTimestamp } from 'firebase/firestore';
import type { Timestamp } from './shared';

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
