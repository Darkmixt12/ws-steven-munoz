import { inject } from '@angular/core';
import {
  signalStore,
  withProps,
  withFeature,
} from '@ngrx/signals';

import { deleteScrumboardItem } from './srumboardFeatures/deleteScrumboardItem';
import { updateScrumboardItem } from './srumboardFeatures/updateScrumItem';
import { newScrumboardItem } from './srumboardFeatures/newScrumboardItem';
import { getHistoryKanbanItem } from './srumboardFeatures/getHistoryKanbanItem';
import { DialogService } from 'primeng/dynamicdialog';
import { boardFeature } from './srumboardFeatures/getKanbanItems';



export const ScrumboardStore = signalStore(
  { providedIn: 'root' },

  withProps(() => ({
    dialogService: inject(DialogService),
  })),

  newScrumboardItem(),
  deleteScrumboardItem(),
  updateScrumboardItem(),
  boardFeature(),
  withFeature((store) => getHistoryKanbanItem())
);
