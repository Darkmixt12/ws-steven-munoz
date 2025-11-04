import { Component, signal } from '@angular/core';
import { DashboardKanbanColumn } from '../../dashboardKanbanColumn/dashboardKanbanColumn';
import { DashboardKanbanItem } from '../../dashboardKanbanItem/dashboardKanbanItem';
import { KanbanColumn } from '../../../interfaces/kanban.interface';

@Component({
  selector: 'steven-munoz-dashboard-route',
  imports: [DashboardKanbanColumn, DashboardKanbanItem],
  templateUrl: './dashboardRoute.html',
  styleUrl: './dashboardRoute.scss',
})
export class DashboardRoute {


  columns = signal<KanbanColumn[]>( [
    {
      id: '1',
      title: 'To Do',
      tickets: []
    },
    {
      id: '2',
      title: 'In Progress',
      tickets: []
    },
    {
      id: '3',
      title: 'In Done',
      tickets: []
    }

  ])


}
