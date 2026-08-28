import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { CompanyTeardownData } from '../types';

const COLLECTION_NAME = 'company_teardowns';

export interface SavedTeardownRecord {
  id: string;
  userId: string;
  applicationId?: string;
  companyName: string;
  websiteUrl: string;
  teardown: CompanyTeardownData;
  createdAt: number;
}

export const getSavedTeardowns = async (userId: string): Promise<SavedTeardownRecord[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedTeardownRecord));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    console.warn('Firestore query error in getSavedTeardowns, using local fallback:', e);
    const local = localStorage.getItem(`seekr_teardowns_${userId}`);
    return local ? JSON.parse(local) : [];
  }
};

export const saveTeardown = async (
  userId: string,
  teardown: CompanyTeardownData,
  applicationId?: string
): Promise<SavedTeardownRecord> => {
  const newRef = doc(collection(db, COLLECTION_NAME));
  const record: SavedTeardownRecord = {
    id: newRef.id,
    userId,
    applicationId,
    companyName: teardown.companyName,
    websiteUrl: teardown.websiteUrl,
    teardown,
    createdAt: Date.now(),
  };

  try {
    // Remove undefined
    const cleanRecord = JSON.parse(JSON.stringify(record));
    await setDoc(newRef, cleanRecord);
  } catch (err) {
    console.warn('Firestore save error, persisting locally:', err);
  }

  // Also cache locally
  try {
    const localKey = `seekr_teardowns_${userId}`;
    const prev = JSON.parse(localStorage.getItem(localKey) || '[]');
    const filtered = prev.filter((p: SavedTeardownRecord) => p.id !== record.id && p.companyName.toLowerCase() !== record.companyName.toLowerCase());
    localStorage.setItem(localKey, JSON.stringify([record, ...filtered]));
  } catch (e) {}

  return record;
};

export const deleteSavedTeardown = async (id: string, userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
  try {
    const localKey = `seekr_teardowns_${userId}`;
    const prev: SavedTeardownRecord[] = JSON.parse(localStorage.getItem(localKey) || '[]');
    localStorage.setItem(localKey, JSON.stringify(prev.filter(p => p.id !== id)));
  } catch (e) {}
};
