const fs = require('fs');
let content = fs.readFileSync('src/lib/notifications.ts', 'utf8');

content = content.replace("import { AppNotification } from '../types';", "import { AppNotification } from '../types';\nimport { toast } from 'sonner';");

const oldAdd = `export const addNotification = async (userId: string, type: string, title: string, message: string) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      timestamp: Date.now(),
      unread: true
    });
  } catch (err) {
    console.error('Failed to add notification', err);
  }
};`;

const newAdd = `export const addNotification = async (userId: string, type: string, title: string, message: string) => {
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
};`;

content = content.replace(oldAdd, newAdd);
fs.writeFileSync('src/lib/notifications.ts', content);
