
export interface KanbanColumn {
  id: number;
  title: string;
  wipLimit?: number;
}

export interface Board {
  columns: KanbanColumn[];
  tickets: KanbanItem[];
}

export interface KanbanItem {
  columnId: number;
  id?: number;
  title: string;
  proposal: number;
  description: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';

}

export type KanbanForm = Omit<KanbanItem, 'id'> & {
  client?: string
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
