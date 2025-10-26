import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Job, Candidate, Talent, Message, HistoryEvent, Dynamic, User } from '../types';

const sanitizeData = (data: any) => {
    const sanitized: any = {};
    for (const key in data) {
        if (data[key] !== undefined) {
            sanitized[key] = data[key];
        }
    }
    return sanitized;
};

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
      const sanitizedData = sanitizeData(data);
      const docRef = await addDoc(collectionRef, sanitizedData);
      return { id: docRef.id, ...sanitizedData } as T;
    },
    update: async (id: string, data: Partial<T>): Promise<void> => {
      const sanitizedData = sanitizeData(data);
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, sanitizedData);
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

// Service for the single active timer document
const createSingletonService = <T>(collectionName: string, documentId: string) => {
    const docRef = doc(db, collectionName, documentId);

    return {
        get: async (): Promise<T | null> => {
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? (docSnap.data() as T) : null;
        },
        listen: (callback: (data: T | null) => void): (() => void) => {
            return onSnapshot(docRef, (doc) => {
                callback(doc.exists() ? (doc.data() as T) : null);
            });
        },
        set: async (data: T): Promise<void> => {
            await setDoc(docRef, sanitizeData(data));
        },
        update: async (data: Partial<T>): Promise<void> => {
            await updateDoc(docRef, sanitizeData(data));
        },
        delete: async (): Promise<void> => {
            await deleteDoc(docRef);
        }
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
export const activeTimerService = createSingletonService<ActiveDynamicTimer>('appState', 'activeTimer');
