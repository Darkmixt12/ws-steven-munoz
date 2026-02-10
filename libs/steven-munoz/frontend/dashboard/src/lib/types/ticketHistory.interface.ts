export interface TicketHistory {
  ticketId: number;
  field: 'columnId' | 'proposal';
  oldValue: any;
  newValue: any;
  changedAt: any; // Timestamp de Firestore
}