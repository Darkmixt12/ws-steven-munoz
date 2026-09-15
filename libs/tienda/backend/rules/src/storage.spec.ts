import {
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadString } from 'firebase/storage';
import { asAnonymous, createTestEnv, storageOf } from './harness';

const IMAGE_PATH = 'products/published/img-1.webp';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

beforeEach(async () => {
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (context) => {
    await uploadString(ref(storageOf(context), IMAGE_PATH), 'image');
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe('storage as anonymous', () => {
  it('cannot read or write any file yet', async () => {
    const storage = storageOf(await asAnonymous(env));

    await assertFails(getBytes(ref(storage, IMAGE_PATH)));
    await assertFails(uploadString(ref(storage, IMAGE_PATH), 'other'));
  });
});
