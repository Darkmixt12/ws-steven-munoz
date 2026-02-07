import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  arrayUnion,
  collection,
  collectionData,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  Firestore,
  getDoc,
  limit,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Client, CreateClient } from '../types/client.interface';
import { map, Observable } from 'rxjs';
import { KanbanItem } from '../types/kanban.interface';
import { TicketHistory } from '../types/ticketHistory.interface';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  firestore = inject(Firestore);

  updateDoc(ref: DocumentReference<DocumentData, DocumentData>, columns: any) {
    console.log('entramos al service');
    return updateDoc(ref, { columns });
  }



  async updateScrumboardTicket(updatedTicket: KanbanItem) {
    const scrumRef = doc(this.firestore, 'board2', 'scrum');

    await runTransaction(this.firestore, async (transaction) => {
      const snap = await transaction.get(scrumRef);

      if (!snap.exists()) {
        throw new Error('El documento no existe');
      }

      const tickets = (snap.data()?.['tickets'] as KanbanItem[]) ?? [];

      const updatedTickets = tickets.map((ticket) =>
        ticket.id === updatedTicket.id
          ? { ...ticket, ...updatedTicket }
          : ticket
      );

      transaction.update(scrumRef, { tickets: updatedTickets });
    });
  }

  deleteDoc(ref: DocumentReference<any>) {
    return deleteDoc(ref);
  }

  getClients(): Observable<Client[]> {
    const ref = collection(this.firestore, 'clients');
    return collectionData(ref) as Observable<Client[]>;
  }

  createClient(client: CreateClient) {
    const clientsRef = collection(this.firestore, 'clients');
    return addDoc(clientsRef, client);
  }

  //? HISTORIAL DE TICKETS

  readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });

  readonly columnMap = new Map<string, string>([
    ['todo', 'Por hacer'],
    ['doing', 'En progreso'],
    ['done', 'Completado'],
  ]);

  private formatValue(
    field: string,
    value: any,
    columnMap: Map<number, string>
  ): string {
    if (field === 'columnId') {
      return columnMap.get(value) ?? `Columna ${value}`;
    }

    if (field === 'proposal') {
      return this.currencyFormatter.format(value);
    }

    return String(value);
  }

  private getFieldName(field: string): string {
    if (field === 'columnId') return 'Columna';
    if (field === 'proposal') return 'Monto';
    return field;
  }

  buildLabel(h: TicketHistory, columnMap: Map<number, string>): string {
    const fieldName = this.getFieldName(h.field);
    const from = this.formatValue(h.field, h.oldValue, columnMap);
    const to = this.formatValue(h.field, h.newValue, columnMap);

    return `${fieldName}: ${from} → ${to}`;
  }

  getHistoryTickets(
    ticketId: string,
    columnMap: Map<number, string>
  ): Observable<(TicketHistory & { label: string })[]> {
    const historyRef = collection(this.firestore, 'ticketHistory');

    const q = query(
      historyRef,
      where('ticketId', '==', ticketId),
      orderBy('changedAt', 'desc'),
      limit(50)
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map((history) =>
        (history as TicketHistory[]).map((h) => ({
          ...h,
          label: this.buildLabel(h, columnMap),
        }))
      )
    );
  }
}
