// Codebase `tienda` de Cloud Functions. Cada ticket del backend exporta aquí
// sus callables, triggers y funciones programadas.
// El build hace un bundle con esbuild, así que las librerías del monorepo
// (p. ej. `tienda/domain`) quedan dentro de `lib/index.js`.
import { initializeApp } from 'firebase-admin/app';

// Una sola app del Admin SDK para todo el codebase, antes de cualquier callable.
initializeApp();

export { enterPanel } from './enter-panel';
