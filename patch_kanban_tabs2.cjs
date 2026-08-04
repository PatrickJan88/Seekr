const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf-8');

const targetReturn = `const ACTIVE_STATUSES: JobStatus[] = ['Applied', 'Screening', 'Technical', 'Final', 'Offer'];
  const INACTIVE_STATUSES: JobStatus[] = ['Rejected', 'Ghosted'];
  
  const displayStatuses = activeTab === 'active' ? ACTIVE_STATUSES : INACTIVE_STATUSES;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-2 mb-2">
        <button 
          onClick={() => setActiveTab('active')}
          className={\`px-4 py-2 rounded-lg font-bold text-sm transition-colors \${activeTab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}\`}
        >
          Active Pipeline
        </button>
        <button 
          onClick={() => setActiveTab('inactive')}
          className={\`px-4 py-2 rounded-lg font-bold text-sm transition-colors \${activeTab === 'inactive' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}\`}
        >
          Closed (Rejected / Ghosted)
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-270px)] snap-x">
        {displayStatuses.map(status => (`

code = code.replace(targetReturn, targetReturn + '\\n'); // just to check if it's matching.
// Wait, the error is at the end of the file.
