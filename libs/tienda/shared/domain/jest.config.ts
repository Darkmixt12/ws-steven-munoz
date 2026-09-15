export default {
  displayName: 'tienda-domain',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  coverageDirectory: '../../../../coverage/libs/tienda/shared/domain',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
};
