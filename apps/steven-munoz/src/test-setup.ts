import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

(globalThis as any).fetch = () =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  });

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
