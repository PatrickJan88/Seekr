const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  "if (view === 'settings') {\n    return <SettingsPage onBack={() => setView('sankey')} onClearData={handleClearData} isSyncing={isSyncing} />;\n  }",
  ""
);
code = code.replace(
  "if (view === 'eval-history') {\n    return <EvaluateHistoryPage onBack={() => setView('cv-match')} applications={applications} onAddToWishlist={handleSave} />;\n  }",
  ""
);

code = code.replace(
  "{view === 'notifications' && <NotificationsPage onNavigate={(viewName) => setView(viewName as any)} />}",
  `{view === 'notifications' && <NotificationsPage onNavigate={(viewName) => setView(viewName as any)} />}
              {view === 'settings' && <SettingsPage onBack={() => setView('sankey')} onClearData={handleClearData} isSyncing={isSyncing} />}
              {view === 'eval-history' && <EvaluateHistoryPage onBack={() => setView('cv-match')} applications={applications} onAddToWishlist={handleSave} />}`
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
