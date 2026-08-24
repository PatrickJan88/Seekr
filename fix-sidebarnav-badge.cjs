const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

code = code.replace(
  'isDemo: boolean,\n  onImport: () => void,\n  onExport: () => void,\n  onNew: () => void\n}) {',
  'isDemo: boolean,\n  onImport: () => void,\n  onExport: () => void,\n  onNew: () => void,\n  applicationCount?: number\n}) {'
);

code = code.replace(
  `{ id: 'kanban', title: 'My Applications', icon: FolderKanban },`,
  `{ id: 'kanban', title: 'My Applications', icon: FolderKanban, badge: applicationCount ? applicationCount : undefined },`
);

code = code.replace(
  `heading: 'Actions',`,
  `heading: 'WORKSPACE',`
);

fs.writeFileSync('src/components/SidebarNav.tsx', code);

let dashCode = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
dashCode = dashCode.replace(
  `<SidebarNav 
             activeId={view} 
             onSelect={setView}
             isDemo={isDemo}
             onImport={() => isDemo ? toast.info('Demo Mode: Importing data is disabled in this portfolio preview.') : setShowImportModal(true)}
             onExport={handleExport}
             onNew={() => setIsFormOpen(true)}
           />`,
  `<SidebarNav 
             activeId={view} 
             onSelect={setView}
             isDemo={isDemo}
             onImport={() => isDemo ? toast.info('Demo Mode: Importing data is disabled in this portfolio preview.') : setShowImportModal(true)}
             onExport={handleExport}
             onNew={() => setIsFormOpen(true)}
             applicationCount={applications.length}
           />`
);
fs.writeFileSync('src/components/Dashboard.tsx', dashCode);

