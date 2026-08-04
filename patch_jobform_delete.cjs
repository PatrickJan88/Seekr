const fs = require('fs');
let code = fs.readFileSync('src/components/JobForm.tsx', 'utf-8');

code = code.replace(
  "const [saveError, setSaveError] = useState<string | null>(null);",
  "const [saveError, setSaveError] = useState<string | null>(null);\n  const [showConfirmDelete, setShowConfirmDelete] = useState(false);"
);

const targetDeleteBtn = `            {initialData && onDelete ? (
              <button type="button" onClick={() => onDelete(initialData.id)} className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wider">
                Delete
              </button>
            ) : <div></div>}`;

const newDeleteBtn = `            {initialData && onDelete ? (
              showConfirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-500 uppercase">Are you sure?</span>
                  <button type="button" onClick={() => onDelete(initialData.id)} className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-xs font-bold uppercase">Yes</button>
                  <button type="button" onClick={() => setShowConfirmDelete(false)} className="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded text-xs font-bold uppercase">No</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowConfirmDelete(true)} className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wider">
                  Delete
                </button>
              )
            ) : <div></div>}`;

code = code.replace(targetDeleteBtn, newDeleteBtn);

fs.writeFileSync('src/components/JobForm.tsx', code);
console.log("Patched JobForm.tsx for delete button");
