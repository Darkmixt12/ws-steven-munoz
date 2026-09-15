/** Documento leído de Firestore con su id inyectado (el id nunca se guarda dentro). */
export type WithId<T> = T & { id: string };
