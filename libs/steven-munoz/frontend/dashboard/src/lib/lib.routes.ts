import { Route } from '@angular/router';

import { LayoutComponent } from './components/layout/layout.component';
import { KanbanTable } from './components/kanbanComponent/kanban-table/kanban-table.component';
import { ClientsDashboardComponent } from './components/clientsComponent/clientDashboard/clientsDashboard.component';

export const DashboardRoutes: Route[] = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'kanban', component: KanbanTable },
      {path: '',redirectTo: 'board', pathMatch: 'full'},
      {path: 'content',component: ClientsDashboardComponent, pathMatch: 'full'},
      
    ],
  },
];
