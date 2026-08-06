const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('sonner')) {
  content = content.replace(
    'import { Footer } from \'./components/Footer\';',
    'import { Footer } from \'./components/Footer\';\nimport { Toaster } from \'sonner\';'
  );

  content = content.replace(
    'return <Dashboard />;',
    'return (\n    <>\n      <Toaster position="bottom-right" />\n      <Dashboard />\n    </>\n  );'
  );

  fs.writeFileSync('src/App.tsx', content);
}
