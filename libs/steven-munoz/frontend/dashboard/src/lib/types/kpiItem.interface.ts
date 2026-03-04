export interface KpiItem {
  label: string;
  value: number;
  icon: string;
  trend?: number; // porcentaje
  progress?: number; // 0 - 100
  format: 'currency' | 'number' | 'percent' | 'days'
  customColor: string
  displayMessage?: string
}

export interface Deal {
  id: string;
  title: string;
  amount: number;
  status: 'Nuevo' | 'Calificado' | 'Propuesta' | 'Won' | 'Lose';
}