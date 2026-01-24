import { inject } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withProps,
} from '@ngrx/signals';

import { FirestoreService } from '../services/firestore.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CreateClient } from '../types/client.interface';

export const ClientsStore = signalStore(
  { providedIn: 'root' },

  withState({
  }),

  withProps(() => ({
    firestoreService: inject(FirestoreService),
  })),

  withMethods((store) => ({

      getClientsSignal: () => toSignal(store.firestoreService.getClients()),
    
      createClient: (client: CreateClient) =>
      store.firestoreService.createClient(client),
  }))
);
