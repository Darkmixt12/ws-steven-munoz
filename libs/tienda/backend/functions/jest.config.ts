export default {
  displayName: 'tienda-functions',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  // Las pruebas con emulador viven en `test-functions`, no aquí: así
  // `run-many -t test` no necesita Java ni el puerto 8080.
  testPathIgnorePatterns: ['/node_modules/', '\\.emulator\\.spec\\.ts$'],
  coverageDirectory: '../../../../coverage/libs/tienda/backend/functions',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
};
