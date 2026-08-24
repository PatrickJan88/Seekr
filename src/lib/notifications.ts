import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { AppNotification } from '../types';
import { toast } from 'sonner';

export const getNotifications = (userId: string, callback: (notifications: AppNotification[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as AppNotification[];
    // Sort client-side to avoid needing a composite index for timestamp
    data.sort((a, b) => b.timestamp - a.timestamp);
    callback(data);
  }, (error) => {
    console.warn("Notification listener error:", error);
  });
};

export const addNotification = async (userId: string, type: string, title: string, message: string) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      timestamp: Date.now(),
      unread: true
    });
  } catch (err: any) {
    console.error('Failed to add notification', err);
    toast.error('Failed to add notification: ' + err.message);
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { unread: false });
  } catch (err) {
    console.error('Failed to mark read', err);
  }
};

export const markAllNotificationsRead = async (notifications: AppNotification[]) => {
  if (!notifications.length) return;
  try {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (n.unread) {
        const docRef = doc(db, 'notifications', n.id);
        batch.update(docRef, { unread: false });
      }
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to mark all read', err);
  }
};

export const deleteNotification = async (id: string) => {
  try {
    const docRef = doc(db, 'notifications', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete notification', err);
  }
};

export const clearAllNotifications = async (notifications: AppNotification[]) => {
  if (!notifications.length) return;
  try {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      const docRef = doc(db, 'notifications', n.id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to clear all notifications', err);
  }
};
