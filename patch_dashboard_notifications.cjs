const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const oldHeader = `<NotificationCenter />`;
const newHeader = `<NotificationCenter onViewAll={() => setView('notifications')} />`;
content = content.replace(oldHeader, newHeader);

const oldRender = `  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (`;

const newRender = `  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (view === 'notifications') {
    return <NotificationsPage onBack={() => setView('sankey')} />;
  }

  return (`;

content = content.replace(oldRender, newRender);

fs.writeFileSync('src/components/Dashboard.tsx', content);
