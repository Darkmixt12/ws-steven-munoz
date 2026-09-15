// Solo corre dentro de `nx run tienda-rules:test-rules`, que levanta los emuladores.
export default {
  displayName: 'tienda-rules',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  // Las suites comparten los emuladores y los limpian entre pruebas: una a la vez.
  maxWorkers: 1,
  testTimeout: 30_000,
};
