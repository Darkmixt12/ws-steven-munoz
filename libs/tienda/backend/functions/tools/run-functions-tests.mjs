#!/usr/bin/env node
/**
 * Envoltorio de `test-functions` (issue #72).
 *
 * Las callables corren con `firebase-admin`, que se salta las reglas, así que
 * aquí solo hace falta el emulador de Firestore: ni Auth (el contexto de la
 * callable lo arma la prueba) ni Storage.
 */
import {
  ejecutar,
  esEmuladorDeFirestore,
} from '../../tools/run-with-emulators.mjs';

ejecutar({
  prefijo: '[test-functions]',
  /** Firestore (8080) y su websocket (9150). */
  puertos: [8080, 9150],
  only: 'firestore',
  comando:
    'npx jest --config libs/tienda/backend/functions/jest.emulator.config.ts',
  esEmuladorPropio: esEmuladorDeFirestore,
});
