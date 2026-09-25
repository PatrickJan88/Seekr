import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { UserResume } from '../types';

const COLLECTION_NAME = 'resumes';
const LOCAL_STORAGE_KEY_PREFIX = 'seekr_stored_resume_';

export const RESUME_UPDATED_EVENT = 'seekr_resume_updated';

// One-time startup purge of legacy un-scoped or shared keys to prevent personal data leaking
export const purgeLegacySharedResumeData = () => {
  if (typeof window === 'undefined') return;
  try {
    // Purge known legacy shared keys
    localStorage.removeItem('seekr_stored_resume_default');
    localStorage.removeItem('seekr_stored_resume_guest');
    localStorage.removeItem('seekr_stored_resume_demo-user');
    localStorage.removeItem('seekr_stored_resume_undefined');
    localStorage.removeItem('seekr_stored_resume_null');
    localStorage.removeItem('demo_evaluations_cache');
    localStorage.removeItem('seekr_evaluations_cache_guest');
    localStorage.removeItem('seekr_evaluations_cache_default');
    localStorage.removeItem('seekr_evaluations_cache_undefined');
  } catch (e) {
    console.warn('Failed to purge legacy cache keys:', e);
  }
};

// Immediately invoke purge on module initialization
purgeLegacySharedResumeData();

// Helper to notify other components in real time
export const notifyResumeUpdated = (resume: UserResume | null) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RESUME_UPDATED_EVENT, { detail: resume }));
  }
};

// Safe synchronous read from localStorage strictly for the authenticated userId
export const getStoredLocalResume = (userId?: string): UserResume | null => {
  if (typeof window === 'undefined') return null;
  if (!userId || userId === 'guest' || userId === 'default') return null;

  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data) as UserResume;
      // Strict ownership check: only return if the record explicitly matches this userId
      if (parsed && parsed.userId === userId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local stored resume:', e);
  }
  return null;
};

// Save locally strictly for the authenticated userId
const setStoredLocalResume = (userId: string, resume: UserResume | null) => {
  if (typeof window === 'undefined') return;
  if (!userId || userId === 'guest' || userId === 'default') return;

  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    if (resume) {
      localStorage.setItem(key, JSON.stringify(resume));
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('Error saving local stored resume:', e);
  }
};

// Fetch user's stored resume from Firestore (or local user-scoped cache)
export const getUserResume = async (userId: string): Promise<UserResume | null> => {
  if (!userId || userId === 'guest' || userId === 'default') {
    return null;
  }

  // Check user-scoped local cache
  const local = getStoredLocalResume(userId);

  // If user is authenticated in Firebase and matches userId, verify against Firestore
  if (auth.currentUser && auth.currentUser.uid === userId && !auth.currentUser.isAnonymous) {
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
        if (active && active.userId === userId) {
          setStoredLocalResume(userId, active);
          return active;
        }
      } else {
        // User has no resume in Firestore, ensure local cache is clean
        setStoredLocalResume(userId, null);
        return null;
      }
    } catch (err) {
      console.warn('Firestore getUserResume failed, using local cache:', err);
    }
  }

  return local;
};

// Save / replace the user's stored resume securely
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
  const effectiveUserId = userId || auth.currentUser?.uid;

  if (!effectiveUserId || effectiveUserId === 'guest' || effectiveUserId === 'default') {
    throw new Error('You must be signed in to securely store a CV.');
  }

  // Construct resume object strictly owned by effectiveUserId
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

  // Update user-scoped local cache immediately
  setStoredLocalResume(effectiveUserId, resumeObj);
  notifyResumeUpdated(resumeObj);

  // If user is authenticated with Firebase (and not unauthenticated guest), persist to Firestore
  if (auth.currentUser && auth.currentUser.uid === effectiveUserId && !auth.currentUser.isAnonymous) {
    try {
      // Find existing resumes for this user and clean them up
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
      console.warn('Failed to persist resume to Firestore, retained in user-scoped local cache:', error);
    }
  }

  return resumeObj;
};

// Delete user's stored resume
export const deleteUserResume = async (userId: string, resumeId?: string): Promise<void> => {
  const effectiveUserId = userId || auth.currentUser?.uid;
  if (!effectiveUserId || effectiveUserId === 'guest' || effectiveUserId === 'default') return;
  
  // Clear user-scoped local storage
  setStoredLocalResume(effectiveUserId, null);
  notifyResumeUpdated(null);

  if (auth.currentUser && auth.currentUser.uid === effectiveUserId && !auth.currentUser.isAnonymous) {
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
