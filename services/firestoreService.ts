import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Job, Candidate, Talent, Message, HistoryEvent, Dynamic, User } from '../types';

// Generic Firestore service to handle CRUD operations
const createFirestoreService = <T>(collectionName: string) => {
  const collectionRef = collection(db, collectionName);

  return {
    getAll: async (): Promise<T[]> => {
      const snapshot = await getDocs(collectionRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    },
    listen: (callback: (data: T[]) => void): (() => void) => {
      return onSnapshot(collectionRef, snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        callback(data);
      });
    },
    create: async (data: Omit<T, 'id'>): Promise<T> => {
      const docRef = await addDoc(collectionRef, data);
      return { id: docRef.id, ...data } as T;
    },
    update: async (id: string, data: Partial<T>): Promise<void> => {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data);
    },
    set: async (id: string, data: T): Promise<void> => {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, data);
    },
    delete: async (id: string): Promise<void> => {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    },
  };
};

// Export services for each collection
export const jobService = createFirestoreService<Job>('jobs');
export const candidateService = createFirestoreService<Candidate>('candidates');
export const talentService = createFirestoreService<Talent>('talentPool');
export const messageService = createFirestoreService<Message>('messages');
export const historyService = createFirestoreService<HistoryEvent>('history');
export const dynamicService = createFirestoreService<Dynamic>('dynamics');
export const userService = createFirestoreService<User>('users');
