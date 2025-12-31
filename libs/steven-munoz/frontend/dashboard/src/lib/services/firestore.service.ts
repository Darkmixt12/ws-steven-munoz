import { Injectable } from '@angular/core';
import {deleteDoc, DocumentData, DocumentReference, updateDoc} from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  

  updateDoc(ref: DocumentReference<DocumentData, DocumentData>, columns: any){
    console.log('entramos al service')
    return updateDoc(ref, {columns})
  }

  deleteDoc(ref: DocumentReference<any>) {
    return deleteDoc(ref)
  }
}
