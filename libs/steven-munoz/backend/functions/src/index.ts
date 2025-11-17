import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const onScrumChanged = onDocumentWritten('board2/scrum', async () => {
  const ref = admin.firestore().collection('notifications').doc('global');
  await ref.set(
    {
      count: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
});
