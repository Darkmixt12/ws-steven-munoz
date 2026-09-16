/**
 * Configuración de Firebase de la tienda.
 *
 * El proyecto Firebase real todavía no existe: lo crea el paso humano de
 * https://github.com/Darkmixt12/ws-steven-munoz/issues/68, que reemplaza estos
 * marcadores. Mientras tanto el id empieza por `demo-`, que solo existe en los
 * emuladores, así que estos valores no alcanzan ningún proyecto de Internet.
 *
 * Los puertos salen de `firebase.tienda.json`.
 */
export const environment = {
  useEmulators: true,
  firebase: {
    apiKey: 'demo-api-key', // marcador: #68
    authDomain: 'demo-tienda-cr.firebaseapp.com', // marcador: #68
    projectId: 'demo-tienda-cr', // marcador: #68
    storageBucket: 'demo-tienda-cr.firebasestorage.app', // marcador: #68
    messagingSenderId: '000000000000', // marcador: #68
    appId: '1:000000000000:web:0000000000000000000000', // marcador: #68
  },
  emulators: {
    host: 'localhost',
    authPort: 9099,
    firestorePort: 8080,
  },
};
