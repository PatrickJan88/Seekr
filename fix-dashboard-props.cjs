const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  "{view === 'global-market' && <GlobalMarket applications={applications} />}",
  "{view === 'global-market' && <GlobalMarket isDemo={isDemo} onAddToWishlist={handleSave} />}"
);

code = code.replace(
  "{view === 'kanban' && <Kanban applications={applications} onEdit={setEditingApp} setIsFormOpen={setIsFormOpen} onDelete={handleDelete} locationFilter={locationFilter} onLocationSelect={handleLocationSelect} />}",
  "{view === 'kanban' && <Kanban applications={applications} onEdit={setEditingApp} onStatusChange={handleStatusChange as any} onDelete={handleDelete} locationFilter={locationFilter} onLocationSelect={handleLocationSelect} />}"
);

code = code.replace(
  "onExport={handleExport}",
  "onExport={() => exportCsv(applications)}"
);

code = code.replace(
  "{view === 'notifications' && <NotificationsPage onNavigate={(viewName) => setView(viewName as any)} />}",
  "{view === 'notifications' && <NotificationsPage onBack={() => setView('sankey')} />}"
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
