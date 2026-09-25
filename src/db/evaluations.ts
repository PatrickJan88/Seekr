import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc } from 'firebase/firestore';
import { CVEvaluation } from '../types';

const COLLECTION_NAME = 'evaluations';
const LOCAL_STORAGE_KEY_PREFIX = 'seekr_evaluations_cache_';

// Helper to deep-clean any undefined values from objects before writing to Firestore
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) => {
    return value === undefined ? null : value;
  }));
}

// Local cache helper to get evaluations strictly for a given userId
function getLocalEvaluations(userId?: string): CVEvaluation[] {
  if (typeof window === 'undefined') return [];
  if (!userId || userId === 'guest' || userId === 'default') return [];

  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && item.userId === userId);
      }
    }
  } catch (e) {
    console.warn('Error reading local evaluations:', e);
  }
  return [];
}

// Local cache helper to save evaluations strictly for a given userId
function setLocalEvaluations(userId: string, evals: CVEvaluation[]) {
  if (typeof window === 'undefined') return;
  if (!userId || userId === 'guest' || userId === 'default') return;

  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(evals));
  } catch (e) {
    console.warn('Error saving local evaluations:', e);
  }
}

export const getEvaluations = async (userId: string): Promise<CVEvaluation[]> => {
  if (!userId || userId === 'guest' || userId === 'default') {
    return [];
  }

  // Try Firestore first if authenticated and not anonymous guest without remote records
  if (auth.currentUser && auth.currentUser.uid === userId && !auth.currentUser.isAnonymous) {
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

  // Fallback to user-scoped local cache
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

  if (evaluation.userId && evaluation.userId !== 'guest') {
    // Persist locally for this user
    const currentLocal = getLocalEvaluations(evaluation.userId);
    const updatedLocal = [sanitized, ...currentLocal.filter(e => e.id !== evalId)];
    setLocalEvaluations(evaluation.userId, updatedLocal);

    // If authenticated user, persist to Firestore
    if (auth.currentUser && auth.currentUser.uid === evaluation.userId && !auth.currentUser.isAnonymous) {
      try {
        await setDoc(newRef, sanitized);
      } catch (e) {
        console.warn('Firestore setDoc failed, persisted locally:', e);
      }
    }
  }

  return sanitized;
};

export const updateEvaluation = async (evalId: string, updates: Partial<CVEvaluation>): Promise<void> => {
  const sanitizedUpdates = sanitizeForFirestore(updates);
  const currentUserId = auth.currentUser?.uid;

  if (typeof window !== 'undefined' && currentUserId) {
    try {
      const list = getLocalEvaluations(currentUserId);
      const nextList = list.map(item => {
        if (item.id === evalId) {
          return { ...item, ...sanitizedUpdates };
        }
        return item;
      });
      setLocalEvaluations(currentUserId, nextList);
    } catch (e) {
      console.warn('Error updating local evaluation cache:', e);
    }
  }

  // If authenticated, persist to Firestore
  if (auth.currentUser && evalId && !auth.currentUser.isAnonymous) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, evalId), sanitizedUpdates);
    } catch (err) {
      console.warn('Firestore updateDoc failed, updated locally:', err);
    }
  }
};

export const deleteEvaluation = async (evalId: string, userId?: string): Promise<void> => {
  const effectiveUserId = userId || auth.currentUser?.uid;

  // Update user-scoped local cache
  if (typeof window !== 'undefined' && effectiveUserId) {
    try {
      const list = getLocalEvaluations(effectiveUserId);
      const nextList = list.filter(item => item.id !== evalId);
      setLocalEvaluations(effectiveUserId, nextList);
    } catch (e) {
      console.warn('Error deleting from local evaluation cache:', e);
    }
  }

  // Firestore delete
  if (auth.currentUser && evalId && !auth.currentUser.isAnonymous) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, evalId));
    } catch (err) {
      console.warn('Firestore deleteDoc failed:', err);
    }
  }
};
