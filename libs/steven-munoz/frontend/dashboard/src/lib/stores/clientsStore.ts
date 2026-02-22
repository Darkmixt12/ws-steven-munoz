import {
  signalStore,
} from '@ngrx/signals';

import { createClient } from './clientsStoreFeatures/createClient';
import { getClients } from './clientsStoreFeatures/getClients';

export const ClientsStore = signalStore(
  { providedIn: 'root' },

  createClient(),
  getClients(),

);
