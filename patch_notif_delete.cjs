const fs = require('fs');
let content = fs.readFileSync('src/lib/notifications.ts', 'utf8');
content += `\nexport const deleteNotification = async (id: string) => {
  try {
    const docRef = doc(db, 'notifications', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete notification', err);
  }
};\n`;
fs.writeFileSync('src/lib/notifications.ts', content);
