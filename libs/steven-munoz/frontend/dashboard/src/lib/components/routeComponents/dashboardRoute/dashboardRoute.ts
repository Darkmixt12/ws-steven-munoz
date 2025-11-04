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
      tickets: [
  {
    "assignee": "Laura Gómez",
    "description": "Actualizar el diseño del panel principal.",
    "id": "1",
    "priority": "High",
    "title": "Revisión de interfaz"
  },
  {
    "assignee": "Carlos Rivera",
    "description": "Corregir errores en el formulario de registro.",
    "id": "2",
    "priority": "Medium",
    "title": "Bug en registro de usuarios"
  },
  {
    "assignee": "Andrea López",
    "description": "Agregar validación al campo de correo electrónico.",
    "id": "3",
    "priority": "Low",
    "title": "Validación pendiente"
  },
      ]
    },
    {
      id: '2',
      title: 'In Progress',
      tickets: [
           {
    "assignee": "Laura Gómez",
    "description": "Refactorizar los componentes del dashboard para mejorar la legibilidad.",
    "id": "1",
    "priority": "High",
    "title": "Refactor del panel principal"
  },
  {
    "assignee": "Carlos Rivera",
    "description": "Implementar control de permisos por rol de usuario.",
    "id": "2",
    "priority": "Medium",
    "title": "Gestión de roles y permisos"
  },
  {
    "assignee": "Fernanda Ruiz",
    "description": "Revisar los tests unitarios y cubrir casos faltantes.",
    "id": "3",
    "priority": "Low",
    "title": "Cobertura de tests"
  },
  {
    "assignee": "Miguel Torres",
    "description": "Diseñar las vistas del nuevo módulo de reportes.",
    "id": "4",
    "priority": "High",
    "title": "Diseño del módulo de reportes"
  },
      ]
    },
    {
      id: '3',
      title: 'In Done',
      tickets: [
  {
    "assignee": "Andrea López",
    "description": "Se implementó la funcionalidad de recuperación de contraseña.",
    "id": "1",
    "priority": "Medium",
    "title": "Recuperación de contraseña lista"
  },
  {
    "assignee": "José Ramírez",
    "description": "Se corrigió el bug que afectaba la carga de imágenes en el perfil.",
    "id": "2",
    "priority": "Low",
    "title": "Bug de carga de imágenes resuelto"
  },
  {
    "assignee": "Sofía Morales",
    "description": "El sistema de notificaciones push ya fue integrado correctamente.",
    "id": "3",
    "priority": "High",
    "title": "Integración de notificaciones finalizada"
  },
      ]
    }

  ])


}
