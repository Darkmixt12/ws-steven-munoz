import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';

@Component({
  selector: 'steven-munoz-dashboard-kanban-column',
  imports: [CdkDragHandle],
  templateUrl: './dashboardKanbanColumn.html',
  styleUrl: './dashboardKanbanColumn.css',
})
export class DashboardKanbanColumn {}
