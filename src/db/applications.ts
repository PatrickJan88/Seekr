import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { JobApplication, JobStatus } from '../types';

const COLLECTION_NAME = 'applications';

export const getApplications = async (userId: string): Promise<JobApplication[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const apps = snapshot.docs.map(doc => doc.data() as JobApplication);
  return apps.sort((a, b) => b.createdAt - a.createdAt);
};

export const addApplication = async (app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobApplication> => {
  const newRef = doc(collection(db, COLLECTION_NAME));
  const now = Date.now();
  const newApp: JobApplication = {
    ...app,
    id: newRef.id,
    createdAt: now,
    updatedAt: now,
  };
  
  // Remove any undefined values
  Object.keys(newApp).forEach(key => {
    if ((newApp as any)[key] === undefined) {
      delete (newApp as any)[key];
    }
  });
  
  await setDoc(newRef, newApp);
  return newApp;
};

export const addApplicationsBatch = async (apps: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> => {
  console.log(`Starting concurrent insert for ${apps.length} applications...`);
  const now = Date.now();

  const promises = apps.map(async (app) => {
    const newRef = doc(collection(db, COLLECTION_NAME));
    const newApp: JobApplication = {
      ...app,
      id: newRef.id,
      createdAt: now,
      updatedAt: now,
    };
    
    // Remove any undefined values
    Object.keys(newApp).forEach(key => {
      if ((newApp as any)[key] === undefined) {
        delete (newApp as any)[key];
      }
    });
    
    await setDoc(newRef, newApp);
  });

  await Promise.all(promises);
  console.log('Insert complete.');
};

export const updateApplication = async (id: string, appUpdate: Partial<JobApplication>): Promise<void> => {
  const appRef = doc(db, COLLECTION_NAME, id);
  const updateData = { ...appUpdate, updatedAt: Date.now() };
  
  // Remove any undefined values
  Object.keys(updateData).forEach(key => {
    if ((updateData as any)[key] === undefined) {
      delete (updateData as any)[key];
    }
  });

  await updateDoc(appRef, updateData);
};

export const deleteApplication = async (id: string): Promise<void> => {
  const appRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(appRef);
};

export const deleteAllApplications = async (userId: string): Promise<void> => {
  const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(promises);
};
