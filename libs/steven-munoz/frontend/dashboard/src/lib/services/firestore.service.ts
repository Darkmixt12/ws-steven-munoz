import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  DocumentData,
  DocumentReference,
  Firestore,
  updateDoc,
} from '@angular/fire/firestore';
import { Client, CreateClient } from '../types/client.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  firestore = inject(Firestore);

  updateDoc(ref: DocumentReference<DocumentData, DocumentData>, columns: any){
    console.log('entramos al service')
    return updateDoc(ref, {columns})
  }

  deleteDoc(ref: DocumentReference<any>) {
    return deleteDoc(ref)
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
