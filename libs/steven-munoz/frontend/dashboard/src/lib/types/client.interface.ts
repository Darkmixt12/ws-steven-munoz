export interface Client {
  id: number;       // tu Firestore lo tiene como number
  email: string;
  name: string;
  tel: number;
}



export interface CreateClient {
  name: string;
  tel?: string;
  email?: string;
  user_owner?: string;
}