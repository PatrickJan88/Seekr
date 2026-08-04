const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf-8');

const stateInjection = `export function Kanban({ applications, onEdit, onStatusChange }: KanbanProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

  const grouped = filteredApplications.reduce((acc, app) => {`;
code = code.replace(/export function Kanban\(\{ applications, onEdit, onStatusChange \}: KanbanProps\) \{\n  const \[activeTab, setActiveTab\] = useState\<'active' \| 'inactive'\>\('active'\);\n  const grouped = applications\.reduce\(\(acc, app\) => \{/, stateInjection);

const uiInjection = `    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div className="flex gap-2">
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
        
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-thin">
          <div className="flex gap-1 items-center">
            <Calendar size={14} className="text-slate-500 ml-2 mr-1" />
            <span className="text-xs font-bold text-slate-700 mr-2">Time:</span>
            {['all', 'today', 'weekly', 'monthly', 'yearly', 'custom'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf as any)}
                className={\`px-3 py-1.5 rounded-md font-bold text-xs transition-colors \${timeFilter === tf ? 'bg-blue-100 text-blue-700' : 'bg-transparent text-slate-600 hover:bg-slate-100'}\`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
          
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1 mr-1">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>`;

code = code.replace(/    \<div className="flex flex-col gap-4 h-full"\>\n      \<div className="flex gap-2 mb-2"\>\n        \<button \n          onClick=\{\(\) => setActiveTab\('active'\)\}\n          className=\{`px-4 py-2 rounded-lg font-bold text-sm transition-colors \$\{activeTab === 'active' \? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'\}`\}\n        \>\n          Active Pipeline\n        \<\/button\>\n        \<button \n          onClick=\{\(\) => setActiveTab\('inactive'\)\}\n          className=\{`px-4 py-2 rounded-lg font-bold text-sm transition-colors \$\{activeTab === 'inactive' \? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'\}`\}\n        \>\n          Closed \(Rejected \/ Ghosted\)\n        \<\/button\>\n      \<\/div\>/, uiInjection);

code = code.replace(/\{status === 'Applied' \? applications\.length : \(grouped\[status\] \|\| \[\]\)\.length\}/, "{(grouped[status] || []).length}");

fs.writeFileSync('src/components/Kanban.tsx', code);
