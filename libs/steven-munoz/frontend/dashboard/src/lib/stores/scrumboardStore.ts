import { inject } from '@angular/core';
import { signalStore, withProps, withFeature } from '@ngrx/signals';

import { deleteScrumboardItem } from './srumboardFeatures/deleteScrumboardItem';
import { updateScrumboardItem } from './srumboardFeatures/updateScrumItem';
import { newScrumboardItem } from './srumboardFeatures/newScrumboardItem';
import { getHistoryKanbanItem } from './srumboardFeatures/getHistoryKanbanItem';
import { DialogService } from 'primeng/dynamicdialog';
import { boardFeature } from './srumboardFeatures/getKanbanItems';
import { withPeriodTicketsFeature } from './periodTicketsFeature/withPeriodTicketsFeature';
import { withRevenueKpisFeature } from './kpisStoreFeatures/withRevenueKpisFeature';
import { withOpportunityKpisFeature } from './kpisStoreFeatures/withOpportunityKpisFeature';
import { withWinrateKpisFeature } from './kpisStoreFeatures/withWinRateKpisFeature';
import { withAvgCloseTimeKpisFeature } from './kpisStoreFeatures/withAvgCloseTimeKpisFeature';

export const ScrumboardStore = signalStore(
  { providedIn: 'root' },

  withProps(() => ({
    dialogService: inject(DialogService),
  })),

  newScrumboardItem(),
  deleteScrumboardItem(),
  updateScrumboardItem(),
  boardFeature(),
  withFeature((store) => getHistoryKanbanItem()),

  //KPIS FEATURES
  withPeriodTicketsFeature(),
  withWinrateKpisFeature(),
  withRevenueKpisFeature(),
  withOpportunityKpisFeature(),
  withAvgCloseTimeKpisFeature()
);
