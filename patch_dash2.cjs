const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const targetDelete = `  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await deleteApplication(id);
        setIsFormOpen(false);
        setEditingApp(null);
        setApplications(apps => apps.filter(a => a.id !== id));
      } catch (err) {
        console.error('Error deleting', err);
        alert('Failed to delete application');
      }
    }
  };`;

const newDelete = `  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id);
      setIsFormOpen(false);
      setEditingApp(null);
      setApplications(apps => apps.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting', err);
      throw err;
    }
  };`;

code = code.replace(targetDelete, newDelete);
fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Patched Dashboard.tsx for delete");
