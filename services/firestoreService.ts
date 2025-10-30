import { db } from './firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { Job, Candidate, Talent, Message, HistoryEvent, Dynamic, User, ActiveDynamicTimer } from '../types';

// Helper to remove undefined values, which are not supported by Firestore.
const sanitizeData = (data: any) => {
    const sanitized: any = {};
    for (const key in data) {
        if (data[key] !== undefined) {
            sanitized[key] = data[key];
        }
    }
    return sanitized;
};

// Generic Firestore service factory for collections
const createFirestoreService = <T extends { id: string }>(collectionName: string) => {
  const collectionRef = collection(db, collectionName);

  return {
    getAll: async (): Promise<T[]> => {
      const snapshot = await getDocs(collectionRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    },

    listen: (callback: (data: T[]) => void): (() => void) => {
      let currentData: T[] = [];
      const unsubscribe = onSnapshot(collectionRef, snapshot => {
        const changes = snapshot.docChanges();

        // **THE DEFINITIVE FIX**: If Firebase sends a snapshot with no actual
        // document changes (which happens for metadata updates), do nothing.
        // This prevents the UI from re-rendering and causing the "flicker".
        if (changes.length === 0 && !snapshot.metadata.fromCache) {
            return;
        }

        let dataUpdated = false;
        changes.forEach(change => {
          const docData = { id: change.doc.id, ...change.doc.data() } as T;

          switch (change.type) {
            case 'added': {
              // Add if it's not already in the array (handles initial load gracefully)
              if (!currentData.some(item => item.id === docData.id)) {
                currentData.push(docData);
                dataUpdated = true;
              }
              break;
            }
            case 'modified': {
              const index = currentData.findIndex(item => item.id === docData.id);
              if (index !== -1) {
                currentData[index] = docData;
                dataUpdated = true;
              }
              break;
            }
            case 'removed': {
              const initialLength = currentData.length;
              currentData = currentData.filter(item => item.id !== docData.id);
              if (currentData.length < initialLength) {
                dataUpdated = true;
              }
              break;
            }
          }
        });

        if (dataUpdated) {
          // Send a new array reference only when data has actually changed.
          callback([...currentData]);
        }
      });
      return unsubscribe;
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

// Generic service factory for single documents (singletons)
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
            await setDoc(docRef, sanitizeData(data), { merge: true });
        },
        update: async (data: Partial<T>): Promise<void> => {
            await updateDoc(docRef, sanitizeData(data));
        },
        delete: async (): Promise<void> => {
            await deleteDoc(docRef);
        }
    };
};

// Export services for each collection and singleton
export const jobService = createFirestoreService<Job>('jobs');
export const candidateService = createFirestoreService<Candidate>('candidates');
export const talentService = createFirestoreService<Talent>('talentPool');
export const messageService = createFirestoreService<Message>('messages');
export const historyService = createFirestoreService<HistoryEvent>('history');
export const dynamicService = createFirestoreService<Dynamic>('dynamics');
export const userService = createFirestoreService<User>('users');
export const activeTimerService = createSingletonService<ActiveDynamicTimer>('appState', 'activeTimer');

// Function to get the estimated offset between client and server time.
export const getServerTimeOffset = async (): Promise<number> => {
    try {
        const docRef = doc(collection(db, 'diagnostics'), 'serverTime');

        // Write server timestamp to a document
        await setDoc(docRef, { timestamp: serverTimestamp() });

        const clientWriteTime = Date.now();

        // Read the document back from the server
        const docSnap = await getDocFromServer(docRef);
        const serverTime = docSnap.get('timestamp')?.toMillis();

        if (serverTime) {
            const clientReadTime = Date.now();
            const latency = (clientReadTime - clientWriteTime) / 2;
            const offset = serverTime - (clientReadTime - latency);
            return offset;
        }

        return 0;
    } catch (error) {
        console.error("Error getting server time offset:", error);
        return 0; // Fallback to no offset if there's an error
    }
};
