import baseConfig from '../../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@angular/*',
                'firebase',
                'firebase/*',
                '@firebase/*',
                'firebase-admin',
                'firebase-admin/*',
                'firebase-functions',
                'firebase-functions/*',
              ],
              message:
                'La librería del dominio no depende de Angular ni de ningún SDK de Firebase: la usan el front y las Functions.',
            },
          ],
        },
      ],
    },
  },
];
