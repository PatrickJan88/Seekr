const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const targetSave = `  const handleSave = async (appData: Partial<JobApplication>) => {
    if (!auth.currentUser) return;
    try {
      if (editingApp) {
        await updateApplication(editingApp.id, appData);
        setApplications(apps => apps.map(a => a.id === editingApp.id ? { ...a, ...appData } as JobApplication : a));
      } else {
        const newApp = await addApplication({ ...appData, userId: auth.currentUser.uid } as any);
        setApplications(apps => [newApp, ...apps]);
      }
      setIsFormOpen(false);
      setEditingApp(null);
    } catch (err) {
      console.error('Error saving', err);
      alert('Failed to save application');
    }
  };`;

const newSave = `  const handleSave = async (appData: Partial<JobApplication>) => {
    if (!auth.currentUser) return;
    try {
      if (editingApp) {
        await updateApplication(editingApp.id, appData);
        setApplications(apps => apps.map(a => a.id === editingApp.id ? { ...a, ...appData } as JobApplication : a));
      } else {
        const newApp = await addApplication({ ...appData, userId: auth.currentUser.uid } as any);
        setApplications(apps => [newApp, ...apps]);
      }
      setIsFormOpen(false);
      setEditingApp(null);
    } catch (err) {
      console.error('Error saving', err);
      throw err;
    }
  };`;

code = code.replace(targetSave, newSave);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Patched Dashboard.tsx");
