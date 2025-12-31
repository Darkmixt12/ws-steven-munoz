import { Route } from '@angular/router';

import { LayoutComponent } from './components/layout/layout.component';
import { KanbanTable } from './components/kanbanComponent/kanban-table/kanban-table.component';

export const DashboardRoutes: Route[] = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'kanban', component: KanbanTable },
      {path: '',redirectTo: 'board', pathMatch: 'full'}
    ],
  },
];
