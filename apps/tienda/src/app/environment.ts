import { isDevMode } from '@angular/core';

/**
 * Configuración de Firebase de la tienda.
 *
 * Son los valores del proyecto real `tienda-cr`, creado en el paso humano de
 * https://github.com/Darkmixt12/ws-steven-munoz/issues/68. No se escriben a mano: se
 * obtienen con `npx firebase apps:sdkconfig WEB --project tienda-cr`.
 *
 * Los puertos salen de `firebase.tienda.json`.
 */
export const environment = {
  /**
   * Los emuladores solo en desarrollo: `isDevMode()` es falso en una compilación de
   * producción, así que el bundle desplegado nunca llama a `localhost`. Para trabajar
   * contra los emuladores basta la configuración de omisión (`development`).
   */
  useEmulators: isDevMode(),
  firebase: {
    apiKey: 'AIzaSyAW9q3UKjAF-TV_a5Jd1MMRY4sBOUNF1bc',
    authDomain: 'tienda-cr.firebaseapp.com',
    projectId: 'tienda-cr',
    storageBucket: 'tienda-cr.firebasestorage.app',
    messagingSenderId: '250524909607',
    appId: '1:250524909607:web:36717073922571d71b0e02',
  },
  emulators: {
    host: 'localhost',
    authPort: 9099,
    firestorePort: 8080,
  },
};
