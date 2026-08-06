const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Import toast
if (!content.includes('import { toast } from \'sonner\'')) {
  content = content.replace(
    'import Papa from \'papaparse\';',
    'import Papa from \'papaparse\';\nimport { toast } from \'sonner\';'
  );
}

// State for delete confirm
if (!content.includes('const [deleteConfirmId, setDeleteConfirmId]')) {
  content = content.replace(
    'const [showClearConfirm, setShowClearConfirm] = useState(false);',
    'const [showClearConfirm, setShowClearConfirm] = useState(false);\n  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);'
  );
}

// Modify handleDelete
content = content.replace(
  /const handleDelete = async \(id: string\) => \{[\s\S]*?\};/,
  `const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteApp = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteApplication(deleteConfirmId);
      setIsFormOpen(false);
      setEditingApp(null);
      setApplications(apps => apps.filter(a => a.id !== deleteConfirmId));
      toast.success('Application deleted successfully');
    } catch (err) {
      console.error('Error deleting', err);
      toast.error('Failed to delete application');
    } finally {
      setDeleteConfirmId(null);
    }
  };`
);

// Add the modal HTML
const modalHtml = `
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-black text-slate-800 mb-2">Delete Application?</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Are you sure you want to delete this job application? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteApp}
                  className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  '{showClearConfirm && (',
  modalHtml + '\n      {showClearConfirm && ('
);

// We should also use toast in other places where we show alerts or successful actions
content = content.replace(
  /alert\('Failed to import data'\);/g,
  "toast.error('Failed to import data');"
);

content = content.replace(
  /alert\('Failed to clear data'\);/g,
  "toast.error('Failed to clear data');"
);

// Inside confirmClearData
content = content.replace(
  /setApplications\(\[\]\);\n\s*\}\s*catch/g,
  "setApplications([]);\n      toast.success('All data cleared');\n    } catch"
);

// Add toast on saved app
content = content.replace(
  /setApplications\(prev => \[\.\.\.prev\.filter\(a => a\.id !== app\.id\), app\]\);\n\s*setIsFormOpen\(false\);\n\s*setEditingApp\(null\);/g,
  "setApplications(prev => [...prev.filter(a => a.id !== app.id), app]);\n      setIsFormOpen(false);\n      setEditingApp(null);\n      toast.success('Application saved');"
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
