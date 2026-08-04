const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const emptyState = `{applications.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center bg-white border-2 border-slate-200 rounded-2xl p-12 shadow-sm text-center">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
               <Plus size={32} />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">No applications yet</h3>
             <p className="text-slate-500 max-w-md mb-6">You haven't tracked any job applications. Start by adding one manually or import from a CSV or PDF file.</p>
             <button
               onClick={() => { setEditingApp(null); setIsFormOpen(true); }}
               className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
             >
               <Plus size={20} />
               <span>Add Your First Application</span>
             </button>
          </div>
        ) : view === 'sankey' ? (
          <SankeyChart applications={applications} />
        ) : view === 'kanban' ? (
          <Kanban applications={applications} onEdit={(app) => { setEditingApp(app); setIsFormOpen(true); }} onStatusChange={handleStatusChange} />
        ) : (
          <Analytics applications={applications} />
        )}`;

code = code.replace(/\{view === 'sankey' \? \([\s\S]*?\<Analytics applications=\{applications\} \/\>\n        \)\}/, emptyState);

fs.writeFileSync('src/components/Dashboard.tsx', code);
