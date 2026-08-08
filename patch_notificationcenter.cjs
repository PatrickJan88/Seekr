const fs = require('fs');
let content = fs.readFileSync('src/components/NotificationCenter.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = getNotifications(auth.currentUser.uid, (data) => {
      setNotifications(data);
    });
    return () => unsubscribe();
  }, []);`;

const newEffect = `  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = getNotifications(auth.currentUser.uid, (data) => {
      setNotifications(data);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);`;

content = content.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/NotificationCenter.tsx', content);
