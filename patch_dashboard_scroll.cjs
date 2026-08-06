const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(
  'if (isFormOpen || showClearConfirm || isSettingsOpen) {',
  'if (isFormOpen || showClearConfirm || isSettingsOpen || !!deleteConfirmId) {'
);

content = content.replace(
  '}, [isFormOpen, showClearConfirm, isSettingsOpen]);',
  '}, [isFormOpen, showClearConfirm, isSettingsOpen, deleteConfirmId]);'
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
