import { db } from './firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc, DocumentData } from 'firebase/firestore';
import { Job, Candidate, Talent, Message, HistoryEvent, Dynamic, User } from '../types';

// Helper function to remove undefined properties from an object, as Firestore does not support them.
const cleanDataForFirestore = <T extends object>(data: T): T => {
    const cleanedData: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
            cleanedData[key] = data[key];
        }
    }
    return cleanedData as T;
};

// Generic Firestore service to handle CRUD operations
const createFirestoreService = <T>(collectionName: string) => {
  const collectionRef = collection(db, collectionName);

  return {
    getById: async (id: string): Promise<T | null> => {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    },
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
      const cleanedData = cleanDataForFirestore(data as DocumentData);
      const docRef = await addDoc(collectionRef, cleanedData);
      return { id: docRef.id, ...cleanedData } as T;
    },
    update: async (id: string, data: Partial<T>): Promise<void> => {
      const cleanedData = cleanDataForFirestore(data as DocumentData);
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, cleanedData);
    },
    set: async (id: string, data: T): Promise<void> => {
      const cleanedData = cleanDataForFirestore(data as DocumentData);
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, cleanedData);
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
export const dynamicTimerService = createFirestoreService<DynamicTimer>('dynamicTimers');
