const fs = require('fs');
let content = fs.readFileSync('src/components/Kanban.tsx', 'utf8');

const search = `        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-thin">`;

const replace = `        <div className="flex items-center gap-2">
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-thin">`;

content = content.replace(search, replace);

const toggleHtmlSearch = `          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm ml-2">
            <button
              onClick={() => setLayoutMode('kanban')}`;

const toggleHtmlReplace = `        </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
            <button
              onClick={() => setLayoutMode('kanban')}`;

content = content.replace(toggleHtmlSearch, toggleHtmlReplace);

// Also we need to add onDelete to KanbanProps and ListView
content = content.replace(
  "onStatusChange: (appId: string, status: JobStatus) => void;\n}",
  "onStatusChange: (appId: string, status: JobStatus) => void;\n  onDelete: (appId: string) => void;\n}"
);

content = content.replace(
  "export function Kanban({ applications, onEdit, onStatusChange }: KanbanProps) {",
  "export function Kanban({ applications, onEdit, onStatusChange, onDelete }: KanbanProps) {"
);

content = content.replace(
  "<ListView applications={filteredApplications.filter(app => displayStatuses.includes(app.status))} onEdit={onEdit} onStatusChange={onStatusChange} />",
  "<ListView applications={filteredApplications.filter(app => displayStatuses.includes(app.status))} onEdit={onEdit} onStatusChange={onStatusChange} onDelete={onDelete} />"
);

fs.writeFileSync('src/components/Kanban.tsx', content);
