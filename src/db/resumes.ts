import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc, onSnapshot } from 'firebase/firestore';
import { UserResume } from '../types';

const COLLECTION_NAME = 'resumes';
const LOCAL_STORAGE_KEY_PREFIX = 'seekr_stored_resume_';

export const RESUME_UPDATED_EVENT = 'seekr_resume_updated';

// Helper to notify other components in real time
export const notifyResumeUpdated = (resume: UserResume | null) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RESUME_UPDATED_EVENT, { detail: resume }));
  }
};

// Quick synchronous read from localStorage for instant rendering
export const getStoredLocalResume = (userId?: string): UserResume | null => {
  if (typeof window === 'undefined') return null;
  try {
    const key = userId ? `${LOCAL_STORAGE_KEY_PREFIX}${userId}` : `${LOCAL_STORAGE_KEY_PREFIX}default`;
    const data = localStorage.getItem(key) || localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}default`);
    if (data) {
      return JSON.parse(data) as UserResume;
    }
  } catch (e) {
    console.warn('Error reading local stored resume:', e);
  }
  return null;
};

// Save locally for instant offline/re-render access
const setStoredLocalResume = (userId: string, resume: UserResume | null) => {
  if (typeof window === 'undefined') return;
  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    if (resume) {
      localStorage.setItem(key, JSON.stringify(resume));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}default`, JSON.stringify(resume));
    } else {
      localStorage.removeItem(key);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}default`);
    }
  } catch (e) {
    console.warn('Error saving local stored resume:', e);
  }
};

// Fetch user's stored resume from Firestore
export const getUserResume = async (userId: string): Promise<UserResume | null> => {
  // First check local storage for instant return if offline or loading
  const local = getStoredLocalResume(userId);

  if (!userId) return local;

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const resumes = snapshot.docs.map(doc => doc.data() as UserResume);
      // Pick the most recently updated
      resumes.sort((a, b) => (b.updatedAt || b.uploadedAt) - (a.updatedAt || a.uploadedAt));
      const active = resumes[0];
      setStoredLocalResume(userId, active);
      return active;
    }
  } catch (err) {
    console.warn('Firestore getUserResume failed, using local cache:', err);
  }

  return local;
};

// Save / replace the user's stored resume
export const saveUserResume = async (
  userId: string,
  data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    cvText: string;
    pdfBase64?: string;
  }
): Promise<UserResume> => {
  const now = Date.now();
  const effectiveUserId = userId || auth.currentUser?.uid || 'guest';

  // Construct resume object
  const newRef = doc(collection(db, COLLECTION_NAME));
  const resumeObj: UserResume = {
    id: newRef.id,
    userId: effectiveUserId,
    fileName: data.fileName,
    fileSize: data.fileSize,
    fileType: data.fileType,
    cvText: data.cvText,
    pdfBase64: data.pdfBase64 || '',
    uploadedAt: now,
    updatedAt: now,
  };

  // Always update local cache immediately
  setStoredLocalResume(effectiveUserId, resumeObj);
  notifyResumeUpdated(resumeObj);

  // If user is authenticated with Firebase, persist to Firestore
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    try {
      // Find existing resumes for this user and clean them up (so user has 1 active master resume)
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', effectiveUserId)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // Save new resume
      // Note: If base64 is very large (> 700KB), omit base64 from firestore document to avoid 1MB limit
      const payload: Record<string, any> = { ...resumeObj };
      if (payload.pdfBase64 && payload.pdfBase64.length > 700000) {
        delete payload.pdfBase64;
      }
      
      await setDoc(newRef, payload);
    } catch (error) {
      console.warn('Failed to persist resume to Firestore, retained locally:', error);
    }
  }

  return resumeObj;
};

// Delete user's stored resume
export const deleteUserResume = async (userId: string, resumeId?: string): Promise<void> => {
  const effectiveUserId = userId || auth.currentUser?.uid || 'guest';
  
  // Clear local storage
  setStoredLocalResume(effectiveUserId, null);
  notifyResumeUpdated(null);

  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    try {
      if (resumeId) {
        await deleteDoc(doc(db, COLLECTION_NAME, resumeId));
      } else {
        const q = query(
          collection(db, COLLECTION_NAME),
          where('userId', '==', effectiveUserId)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.warn('Failed to delete resume from Firestore:', error);
    }
  }
};
