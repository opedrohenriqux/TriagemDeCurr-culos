import 'dotenv/config';
import { db } from './services/firebase.ts';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { INITIAL_JOBS, INITIAL_CANDIDATES, INITIAL_TALENT_POOL } from './constants.ts';

const clearCollection = async (collectionName: string) => {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
  }
  console.log(`Collection ${collectionName} cleared.`);
};

const populateDb = async () => {
  console.log('Clearing and populating database...');

  try {
    // Clear existing data
    await clearCollection('jobs');
    await clearCollection('candidates');
    await clearCollection('talentPool');

    // Populate jobs
    for (const job of INITIAL_JOBS) {
      const { id, ...jobData } = job;
      await setDoc(doc(db, 'jobs', id), jobData);
    }
    console.log('Jobs populated successfully!');

    // Populate candidates
    for (const candidate of INITIAL_CANDIDATES) {
      const { id, ...candidateData } = candidate;
      Object.keys(candidateData).forEach(key => {
        if (candidateData[key] === undefined) {
          delete candidateData[key];
        }
      });
      await setDoc(doc(db, 'candidates', String(id)), candidateData);
    }
    console.log('Candidates populated successfully!');

    // Populate talent pool
    for (const talent of INITIAL_TALENT_POOL) {
      const { id, ...talentData } = talent;
      await setDoc(doc(db, 'talentPool', String(id)), talentData);
    }
    console.log('Talent pool populated successfully!');

    console.log('Database population complete!');
  } catch (error) {
    console.error('Error populating database:', error);
  }
};

populateDb();
