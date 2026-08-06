const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// I will make handleDelete async again, just resolving immediately
content = content.replace(
  'const handleDelete = (id: string) => {',
  'const handleDelete = async (id: string) => {'
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
