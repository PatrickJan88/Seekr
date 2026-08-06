const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

const oldDeleteHtml = `{initialData && onDelete ? (
            showConfirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-500 uppercase">Are you sure?</span>
                <button type="button" onClick={async () => {
                  try {
                    setSaveError(null);
                    await onDelete(initialData.id);
                  } catch (err: any) {
                    setSaveError(err.message || 'Failed to delete application');
                  }
                }} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-red-500 text-slate-50 shadow hover:bg-red-500/90 h-9 px-4 py-2">Yes</button>
                <button type="button" onClick={() => setShowConfirmDelete(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2">No</button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowConfirmDelete(true)} className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wider">
                Delete
              </button>
            )
          ) : <div></div>}`;

const newDeleteHtml = `{initialData && onDelete ? (
              <button type="button" onClick={(e) => { e.preventDefault(); onDelete(initialData.id); }} className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wider">
                Delete
              </button>
          ) : <div></div>}`;

if (content.includes('showConfirmDelete ? (')) {
    content = content.replace(oldDeleteHtml, newDeleteHtml);
    fs.writeFileSync('src/components/JobForm.tsx', content);
} else {
    console.log("Could not find the target string.");
}
