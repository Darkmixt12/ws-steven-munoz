import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withProps } from '@ngrx/signals';

import { FirestoreService } from '../services/firestore.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { deleteScrumboardItem } from './srumboardFeatures/deleteScrumboardItem';
import { updateScrumboardItem } from './srumboardFeatures/updateScrumItem';
import { newScrumboardItem } from './srumboardFeatures/newScrumboardItem';
import { getHistoryKanbanItem } from './srumboardFeatures/getHistoryKanbanItem';
import { Firestore } from '@angular/fire/firestore';

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

    updateDoc: rxMethod<{ ref: any; data: any }>(
      pipe(
        switchMap(({ ref, data }) =>
          store.firestoreService.updateDoc(ref, data)
        )
      )
    ),


  }))
);



export const ScrumboardStore = signalStore(
  { providedIn: 'root' },

  

  newScrumboardItem(),
  deleteScrumboardItem(),
  updateScrumboardItem(),
  getHistoryKanbanItem()

);
