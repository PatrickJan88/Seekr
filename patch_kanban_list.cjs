const fs = require('fs');
let content = fs.readFileSync('src/components/Kanban.tsx', 'utf8');

content = content.replace(
  "<ListView applications={filteredApplications} onEdit={onEdit} onStatusChange={onStatusChange} />",
  "<ListView applications={filteredApplications.filter(app => displayStatuses.includes(app.status))} onEdit={onEdit} onStatusChange={onStatusChange} />"
);

fs.writeFileSync('src/components/Kanban.tsx', content);
