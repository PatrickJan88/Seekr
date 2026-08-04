const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// Remove state
code = code.replace(/  const \[timeFilter, setTimeFilter\] = useState\<'all' \| 'today' \| 'weekly' \| 'monthly' \| 'yearly' \| 'custom'\>\('all'\);\n  const \[customStartDate, setCustomStartDate\] = useState\(''\);\n  const \[customEndDate, setCustomEndDate\] = useState\(''\);\n/g, '');

// Remove filtering logic
const filterLogicRegex = /  const filteredApplications = applications\.filter\(app => \{[\s\S]*?return true;\n  \}\);\n/g;
code = code.replace(filterLogicRegex, '');

// Replace `filteredApplications` with `applications` in props
code = code.replace(/\{view === 'sankey' && \<SankeyChart applications=\{filteredApplications\} \/\>\}/g, "{view === 'sankey' && <SankeyChart applications={applications} />}");
code = code.replace(/\{view === 'kanban' && \<Kanban applications=\{filteredApplications\} onEdit=\{setEditingApp\} onStatusChange=\{handleStatusChange\} \/\>\}/g, "{view === 'kanban' && <Kanban applications={applications} onEdit={setEditingApp} onStatusChange={handleStatusChange} />}");
code = code.replace(/\{view === 'analytics' && \<Analytics applications=\{filteredApplications\} \/\>\}/g, "{view === 'analytics' && <Analytics applications={applications} />}");

// Remove filter UI
const filterUIBlock = `        <div className="flex items-center gap-4 bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-thin">
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
        
`;
code = code.replace(filterUIBlock, '');

// Also remove `Calendar` from lucide-react import in Dashboard if it's unused, wait it might be used elsewhere. Actually it's okay to leave it.
fs.writeFileSync('src/components/Dashboard.tsx', code);
