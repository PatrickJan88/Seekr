const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const oldHeader = `<header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800">Job <span className="text-blue-600">Seekr</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Synced with G-Cal
          </div>
          <button 
            onClick={() => { setEditingApp(null); setIsFormOpen(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Application</span>
          </button>
          <button onClick={logout} className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>`;

const newHeader = `<header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">Job <span className="text-blue-600">Seekr</span></span>
          </div>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Synced with G-Cal
            </div>
            <button 
              onClick={() => { setEditingApp(null); setIsFormOpen(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              <span>New Application</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={logout} title="Log Out" className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Patched header");
