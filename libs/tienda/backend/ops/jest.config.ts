export default {
  displayName: 'tienda-ops',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  coverageDirectory: '../../../../coverage/libs/tienda/backend/ops',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
};
