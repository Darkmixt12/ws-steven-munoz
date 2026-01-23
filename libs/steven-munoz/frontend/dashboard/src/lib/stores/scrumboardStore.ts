import { inject } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withProps,
} from '@ngrx/signals';

import { FirestoreService } from '../services/firestore.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { KanbanItem } from '../types/kanban.interface';

export const DocumentsStore = signalStore(
  { providedIn: 'root' },

  withState({
    loading: false,
  }),

  withProps(() => ({
    firestoreService: inject(FirestoreService),
  })),

  withMethods((store) => ({
    // updateDoc(ref: any, data: any) {
    //   return store.firestoreService.updateDoc(ref, data);
    // },

    updateDoc: rxMethod<{ref: any, data: any}>(
      pipe(
        switchMap( ({ref,data}) => store.firestoreService.updateDoc(ref,data))
      )
    ),

    deleteScrumItem: (id: number | undefined) => store.firestoreService.deleteScrumboardItem(id),

    updateScrumItem: (scrumItem: KanbanItem) => store.firestoreService.updateScrumboardTicket(scrumItem),

    newScrumItem: (scrumItem: KanbanItem) => store.firestoreService.createScrumboardItem(scrumItem)
  }))
);
