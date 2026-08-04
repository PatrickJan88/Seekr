const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const importReplacement = `import { Plus, Download, Upload, LayoutDashboard, BarChart3, LogOut, Loader2, Calendar } from 'lucide-react';`;
code = code.replace(/import \{ Plus, Download, Upload, LayoutDashboard, BarChart3, LogOut, Loader2 \} from 'lucide-react';/g, importReplacement);

const stateInjection = `  const [view, setView] = useState<'sankey' | 'kanban' | 'analytics'>('sankey');
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');`;
code = code.replace(/  const \[view, setView\] = useState\<'sankey' \| 'kanban' \| 'analytics'\>\('sankey'\);\n  const \[editingApp, setEditingApp\] = useState\<JobApplication \| null\>\(null\);\n  const \[isFormOpen, setIsFormOpen\] = useState\(false\);/g, stateInjection);

const filterLogic = `
  const filteredApplications = applications.filter(app => {
    if (timeFilter === 'all') return true;
    if (!app.appliedDate) return false;
    
    const appliedTime = new Date(app.appliedDate).getTime();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (timeFilter === 'today') {
      return appliedTime >= today;
    }
    if (timeFilter === 'weekly') {
      const lastWeek = new Date(today - 7 * 24 * 60 * 60 * 1000).getTime();
      return appliedTime >= lastWeek;
    }
    if (timeFilter === 'monthly') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
      return appliedTime >= lastMonth;
    }
    if (timeFilter === 'yearly') {
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
      return appliedTime >= lastYear;
    }
    if (timeFilter === 'custom') {
      const start = customStartDate ? new Date(customStartDate).getTime() : 0;
      const end = customEndDate ? new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000 - 1 : Infinity;
      return appliedTime >= start && appliedTime <= end;
    }
    return true;
  });

  return (`;

code = code.replace(/  return \(/, filterLogic);

const componentPropsReplacement = `        {view === 'sankey' && <SankeyChart applications={filteredApplications} />}
        {view === 'kanban' && <Kanban applications={filteredApplications} onEdit={setEditingApp} onStatusChange={handleStatusChange} />}
        {view === 'analytics' && <Analytics applications={filteredApplications} />}`;

code = code.replace(/        \{view === 'sankey' && \<SankeyChart applications=\{applications\} \/\>\}\n        \{view === 'kanban' && \<Kanban applications=\{applications\} onEdit=\{setEditingApp\} onStatusChange=\{handleStatusChange\} \/\>\}\n        \{view === 'analytics' && \<Analytics applications=\{applications\} \/\>\}/g, componentPropsReplacement);

const filterUIRender = `        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">`;

const filterUIReplacement = `        <div className="flex items-center gap-4 bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-thin">
          <div className="flex gap-2 items-center">
            <Calendar size={16} className="text-slate-500 mr-2" />
            <span className="text-sm font-bold text-slate-700 mr-2">Time:</span>
            {['all', 'today', 'weekly', 'monthly', 'yearly', 'custom'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf as any)}
                className={\`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors \${timeFilter === tf ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'} border\`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
          
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">`;

code = code.replace(filterUIRender, filterUIReplacement);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Patched Dashboard.tsx");
