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
  runTransaction,
  updateDoc,
} from '@angular/fire/firestore';
import { Client, CreateClient } from '../types/client.interface';
import { Observable } from 'rxjs';
import { KanbanItem } from '../types/kanban.interface';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  firestore = inject(Firestore);

  updateDoc(ref: DocumentReference<DocumentData, DocumentData>, columns: any) {
    console.log('entramos al service');
    return updateDoc(ref, { columns });
  }

  //! CREAR NUEVO ITEM KANBAN
  async createScrumboardItem(scrumItem: KanbanItem) {
    const scrumRef = doc(this.firestore, 'board2', 'scrum');
    const snap = await getDoc(scrumRef);

    const getTickets: KanbanItem[] = snap.data()?.['tickets'] ?? 0;

    const lasTicketsid =
      getTickets.length > 0
        ? Math.max(...getTickets.map((t) => Number(t.id)))
        : 0;

    const newId = lasTicketsid + 1;

    const newItem: KanbanItem = {
      ...scrumItem,
      id: newId,
    };

    await updateDoc(scrumRef, { tickets: arrayUnion(newItem) });
  }

  //! BORRAR NUEVO ITEM KANBAN
  async deleteScrumboardItem(idTodelete: number | undefined) {
    const scrumRef = doc(this.firestore, 'board2', 'scrum');

    const snap = await getDoc(scrumRef);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        if (!snap.exists()) {
          console.error('Documento no existe');
          return;
        }

        const tickets = (snap.data()?.['tickets'] as KanbanItem[]) ?? [];

        const updatedTickets = tickets.filter((t) => t.id !== idTodelete);

        transaction.update(scrumRef, { tickets: updatedTickets });
      });
    } catch (error) {
      console.log('Error eliminando ticket', error);
    }
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
}
