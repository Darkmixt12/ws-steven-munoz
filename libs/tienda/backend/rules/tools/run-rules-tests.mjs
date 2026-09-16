#!/usr/bin/env node
/**
 * Envoltorio de `test-rules` (issue #70). El barrido de jars huérfanos vive en
 * `libs/tienda/backend/tools/run-with-emulators.mjs`, compartido con las
 * pruebas de las Functions (#72).
 */
import {
  ejecutar,
  esEmuladorDeFirestore,
  esEmuladorDeStorage,
} from '../../tools/run-with-emulators.mjs';

ejecutar({
  prefijo: '[test-rules]',
  /** Firestore (8080) y su websocket (9150), Auth (9099) y Storage (9199). */
  puertos: [8080, 9150, 9099, 9199],
  only: 'firestore,storage,auth',
  comando: 'npx jest --config libs/tienda/backend/rules/jest.config.ts',
  esEmuladorPropio: (linea) =>
    esEmuladorDeStorage(linea) || esEmuladorDeFirestore(linea),
});
