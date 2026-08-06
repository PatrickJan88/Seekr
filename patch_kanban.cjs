const fs = require('fs');
let content = fs.readFileSync('src/components/Kanban.tsx', 'utf8');

// Add imports
content = content.replace("import { Calendar, Building, MoreVertical } from 'lucide-react';", "import { Calendar, Building, MoreVertical, LayoutDashboard, List } from 'lucide-react';\nimport { ListView } from './ListView';");

// Add layoutMode state
content = content.replace("const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');", "const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');\n  const [layoutMode, setLayoutMode] = useState<'kanban' | 'list'>('kanban');");

// Insert toggle after Time Filter div
// The Time Filter div ends with:
//         </div>
//       </div>
//       <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-270px)] snap-x">

const toggleHtml = `
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm ml-2">
            <button
              onClick={() => setLayoutMode('kanban')}
              className={\`p-1.5 rounded-md transition-colors \${layoutMode === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}\`}
              title="Kanban View"
            >
              <LayoutDashboard size={16} />
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={\`p-1.5 rounded-md transition-colors \${layoutMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}\`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
`;

content = content.replace(/<\/div>\s*<\/div>\s*<div className="flex gap-4 overflow-x-auto/g, toggleHtml + `      {layoutMode === 'kanban' ? (\n      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-270px)] snap-x">`);

// Close layout toggle at bottom
content = content.replace(/<\/div>\s*<\/div>\s*\);/g, `      </div>\n      ) : (\n        <ListView applications={filteredApplications} onEdit={onEdit} onStatusChange={onStatusChange} />\n      )}\n    </div>\n  );`);

fs.writeFileSync('src/components/Kanban.tsx', content);
