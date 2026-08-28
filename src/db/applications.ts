import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { JobApplication, JobStatus } from '../types';

const COLLECTION_NAME = 'applications';

export function sanitizeForFirestore<T = any>(data: T): T {
  if (data === undefined || data === null) return data;

  const cleanValue = (val: any): any => {
    if (val === undefined || val === null) return null;
    if (typeof val === 'function' || typeof val === 'symbol') return null;
    if (typeof val !== 'object') return val;

    if (Array.isArray(val)) {
      return val
        .map(item => {
          if (item === undefined || item === null) return null;
          if (typeof item !== 'object') return item;
          // Plain map inside array: must only contain scalar primitives (string, number, boolean)
          const cleanItem: Record<string, any> = {};
          for (const [k, v] of Object.entries(item)) {
            if (v !== undefined && v !== null && typeof v !== 'function') {
              if (typeof v === 'object') {
                if (Array.isArray(v)) {
                  // Firestore disallows nested arrays inside array of maps
                  cleanItem[k] = v.map(sub => String(sub)).join(', ');
                } else {
                  cleanItem[k] = String(v);
                }
              } else {
                cleanItem[k] = v;
              }
            }
          }
          return cleanItem;
        })
        .filter(item => item !== null);
    }

    // Object (map)
    const cleanObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        if (Array.isArray(v)) {
          cleanObj[k] = v
            .map(item => {
              if (item === undefined || item === null) return null;
              if (typeof item !== 'object') return item;
              const cleanItem: Record<string, any> = {};
              for (const [subK, subV] of Object.entries(item)) {
                if (subV !== undefined && subV !== null && typeof subV !== 'function') {
                  if (typeof subV === 'object') {
                    if (Array.isArray(subV)) {
                      cleanItem[subK] = subV.map(s => String(s)).join(', ');
                    } else {
                      cleanItem[subK] = String(subV);
                    }
                  } else {
                    cleanItem[subK] = subV;
                  }
                }
              }
              return cleanItem;
            })
            .filter(item => item !== null);
        } else if (typeof v === 'object' && v !== null) {
          cleanObj[k] = cleanValue(v);
        } else {
          cleanObj[k] = v;
        }
      }
    }
    return cleanObj;
  };

  const cleaned = cleanValue(data);
  return JSON.parse(JSON.stringify(cleaned));
}

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
  
  const sanitized = sanitizeForFirestore(newApp);
  await setDoc(newRef, sanitized);
  return sanitized;
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
    
    const sanitized = sanitizeForFirestore(newApp);
    await setDoc(newRef, sanitized);
  });

  await Promise.all(promises);
  console.log('Insert complete.');
};

export const updateApplication = async (id: string, appUpdate: Partial<JobApplication>): Promise<void> => {
  const appRef = doc(db, COLLECTION_NAME, id);
  const now = Date.now();
  const updateData = sanitizeForFirestore({ ...appUpdate, updatedAt: now });

  try {
    await updateDoc(appRef, updateData);
  } catch (err: any) {
    await setDoc(appRef, { ...updateData, id, createdAt: updateData.createdAt || now });
  }
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
