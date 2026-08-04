const fs = require('fs');
let code = fs.readFileSync('src/components/JobForm.tsx', 'utf-8');

const targetDeleteBtn = `                  <button type="button" onClick={() => onDelete(initialData.id)} className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-xs font-bold uppercase">Yes</button>`;

const newDeleteBtn = `                  <button type="button" onClick={async () => {
                    try {
                      setSaveError(null);
                      await onDelete(initialData.id);
                    } catch (err: any) {
                      setSaveError(err.message || 'Failed to delete application');
                    }
                  }} className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-xs font-bold uppercase">Yes</button>`;

code = code.replace(targetDeleteBtn, newDeleteBtn);

fs.writeFileSync('src/components/JobForm.tsx', code);
console.log("Patched JobForm.tsx for delete error handling");
