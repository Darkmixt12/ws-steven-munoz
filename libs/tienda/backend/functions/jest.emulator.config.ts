/**
 * Pruebas que necesitan el emulador de Firestore. Solo corren dentro de
 * `nx run tienda-functions:test-functions`, que lo levanta; el target `test`
 * las ignora para que `run-many -t test` siga sin depender de Java.
 */
export default {
  displayName: 'tienda-functions (emulador)',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.emulator.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  maxWorkers: 1,
  testTimeout: 30_000,
};
