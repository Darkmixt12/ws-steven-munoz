export interface KanbanColumn {
  id: string;
  title: string;
}

export interface Board {
  columns: KanbanColumn[];
  tickets: KanbanItem[];
}

export interface KanbanItem {
  columnId: string;
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
}

// Interfaces para el FIREBASE BOARD
export interface FireStoreKanbanColumn {
  id: number;
  title: string;
  create_date: Date;
  update_date: Date;
  visible: boolean;
  ticket: KanbanItem[];
}

export interface FireStoreKanbanItem {
  id: number;
  title: string;
  description: string;
  assignee: string;
  client: string;
  proposal: number;
  ranking: 'Bueno' | 'Medio' | 'Malo';
}
