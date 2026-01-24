
export interface TicketHistory {
  id: string;
  ticketId: number;
  type: 'COLUMN_CHANGE' | 'AMOUNT_CHANGE' | 'EDIT';
  from?: any;
  to?: any;
  userId: string;
  createdAt: Date;
}
