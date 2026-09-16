import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  Functions,
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions,
} from '@angular/fire/functions';
import { Auth, connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import {
  Firestore,
  connectFirestoreEmulator,
  getFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { environment } from './environment';

/** Storage (9199) queda fuera hasta que alguna pantalla suba Imágenes de Producto. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Aura } }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth: Auth = getAuth();
      if (environment.useEmulators) {
        connectAuthEmulator(
          auth,
          `http://${environment.emulators.host}:${environment.emulators.authPort}`,
          { disableWarnings: true }
        );
      }
      return auth;
    }),
    provideFirestore(() => {
      const firestore: Firestore = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(
          firestore,
          environment.emulators.host,
          environment.emulators.firestorePort
        );
      }
      return firestore;
    }),
    provideFunctions(() => {
      // La región se declara aquí y en la callable: si no coinciden, la llamada
      // no encuentra la función.
      const functions: Functions = getFunctions(getApp(), 'us-central1');
      if (environment.useEmulators) {
        connectFunctionsEmulator(
          functions,
          environment.emulators.host,
          environment.emulators.functionsPort
        );
      }
      return functions;
    }),
  ],
};
