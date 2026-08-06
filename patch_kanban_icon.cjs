const fs = require('fs');
let content = fs.readFileSync('src/components/Kanban.tsx', 'utf8');

content = content.replace(
  '<Building size={14} />\n                  <span className="truncate">{app.company}</span>',
  '<span className="truncate">{app.company}</span>'
);

// We can also remove the Building import if we want, but it's okay to leave it.
fs.writeFileSync('src/components/Kanban.tsx', content);
