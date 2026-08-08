const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (!content.includes('import { NotificationCenter }')) {
  content = content.replace("import { Footer } from './Footer';", "import { Footer } from './Footer';\nimport { NotificationCenter } from './NotificationCenter';");
}

content = content.replace(
  '<div className="flex items-center gap-4">\n          <button onClick={() => setIsSettingsOpen(true)}',
  '<div className="flex items-center gap-3">\n          <NotificationCenter />\n          <button onClick={() => setIsSettingsOpen(true)}'
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
