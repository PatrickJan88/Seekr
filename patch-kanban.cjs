const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf8');

code = code.replace(
  /interface KanbanProps \{/,
  `interface KanbanProps {\n  trackingSystem?: 'industry' | 'academic';`
);

code = code.replace(
  /export function Kanban\(\{ applications, onEdit, onStatusChange, onDelete, locationFilter, onLocationSelect \}: KanbanProps\) \{/,
  `export function Kanban({ applications, onEdit, onStatusChange, onDelete, locationFilter, onLocationSelect, trackingSystem = 'industry' }: KanbanProps) {`
);

code = code.replace(
  /<span className="truncate">\{app.company\}<\/span>/g,
  `<span className="truncate" title={app.company}>{app.company}</span>`
);

fs.writeFileSync('src/components/Kanban.tsx', code);
