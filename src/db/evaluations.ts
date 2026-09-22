import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc } from 'firebase/firestore';
import { CVEvaluation } from '../types';

const COLLECTION_NAME = 'evaluations';
const LOCAL_STORAGE_KEY_PREFIX = 'seekr_evaluations_cache_';
const DEMO_KEY = 'demo_evaluations_cache';

// Helper to deep-clean any undefined values from objects before writing to Firestore
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) => {
    return value === undefined ? null : value;
  }));
}

// Local cache helper to get evaluations
function getLocalEvaluations(userId?: string): CVEvaluation[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = userId ? `${LOCAL_STORAGE_KEY_PREFIX}${userId}` : `${LOCAL_STORAGE_KEY_PREFIX}guest`;
    const data = localStorage.getItem(key) || localStorage.getItem(DEMO_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading local evaluations:', e);
  }
  return [];
}

// Local cache helper to save evaluations
function setLocalEvaluations(userId: string, evals: CVEvaluation[]) {
  if (typeof window === 'undefined') return;
  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(evals));
    localStorage.setItem(DEMO_KEY, JSON.stringify(evals));
  } catch (e) {
    console.warn('Error saving local evaluations:', e);
  }
}

export const getEvaluations = async (userId: string): Promise<CVEvaluation[]> => {
  // Try Firestore first if authenticated
  if (auth.currentUser && userId && userId !== 'guest') {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const evals = snapshot.docs.map(doc => doc.data() as CVEvaluation);
      evals.sort((a, b) => b.createdAt - a.createdAt);
      setLocalEvaluations(userId, evals);
      return evals;
    } catch (err) {
      console.warn('Firestore getEvaluations failed, using local cache:', err);
    }
  }

  // Fallback to local storage cache
  const localList = getLocalEvaluations(userId);
  return localList.sort((a, b) => b.createdAt - a.createdAt);
};

export const addEvaluation = async (evaluation: Omit<CVEvaluation, 'id' | 'createdAt'>): Promise<CVEvaluation> => {
  const newRef = doc(collection(db, COLLECTION_NAME));
  const now = Date.now();
  const evalId = newRef.id || `eval_${now}_${Math.random().toString(36).substring(2, 9)}`;

  const newEval: CVEvaluation = {
    ...evaluation,
    id: evalId,
    createdAt: now,
  };

  const sanitized = sanitizeForFirestore(newEval);

  // Always persist locally
  const currentLocal = getLocalEvaluations(evaluation.userId);
  const updatedLocal = [sanitized, ...currentLocal.filter(e => e.id !== evalId)];
  setLocalEvaluations(evaluation.userId, updatedLocal);

  // If authenticated user, persist to Firestore
  if (auth.currentUser && evaluation.userId && evaluation.userId !== 'guest') {
    try {
      await setDoc(newRef, sanitized);
    } catch (e) {
      console.warn('Firestore setDoc failed, persisted locally:', e);
    }
  }

  return sanitized;
};

export const updateEvaluation = async (evalId: string, updates: Partial<CVEvaluation>): Promise<void> => {
  const sanitizedUpdates = sanitizeForFirestore(updates);

  // Update in local cache across guest and user keys
  if (typeof window !== 'undefined') {
    try {
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith(LOCAL_STORAGE_KEY_PREFIX) || k === DEMO_KEY);
      allKeys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              let updated = false;
              const nextList = list.map(item => {
                if (item.id === evalId) {
                  updated = true;
                  return { ...item, ...sanitizedUpdates };
                }
                return item;
              });
              if (updated) {
                localStorage.setItem(k, JSON.stringify(nextList));
              }
            }
          }
        } catch {}
      });
    } catch (e) {
      console.warn('Error updating local evaluation cache:', e);
    }
  }

  // If authenticated, persist to Firestore
  if (auth.currentUser && evalId) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, evalId), sanitizedUpdates);
    } catch (err) {
      console.warn('Firestore updateDoc failed, updated locally:', err);
    }
  }
};

export const deleteEvaluation = async (evalId: string, userId?: string): Promise<void> => {
  // Update local cache
  if (typeof window !== 'undefined') {
    try {
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith(LOCAL_STORAGE_KEY_PREFIX) || k === DEMO_KEY);
      allKeys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const nextList = list.filter(item => item.id !== evalId);
              localStorage.setItem(k, JSON.stringify(nextList));
            }
          }
        } catch {}
      });
    } catch {}
  }

  // Firestore delete
  if (auth.currentUser && evalId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, evalId));
    } catch (err) {
      console.warn('Firestore deleteDoc failed:', err);
    }
  }
};

