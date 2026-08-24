const fs = require('fs');
const code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const returnIdx = code.lastIndexOf('  return (');
const endIdx = code.indexOf('{isFormOpen &&', returnIdx);

const newRender = `  return (
    <div className="flex w-full h-screen bg-[#faf9f7] overflow-hidden text-[#121722] font-sans">
      {/* Sidebar */}
      <div className={\`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-white border-r border-[#efefef] z-20 \${isSidebarOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none'}\`}>
        <SidebarNav
           className="w-[260px] border-none bg-transparent"
           activeId={view}
           onSelect={(id) => setView(id as any)}
           isDemo={isDemo}
           onImport={() => isDemo ? toast.info('Demo Mode: Importing data is disabled in this portfolio preview.') : setShowImportModal(true)}
           onExport={() => exportCsv(applications)}
           onNew={() => { setEditingApp(null); setIsFormOpen(true); }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative bg-[#faf9f7] z-10">
         {/* Top Navbar */}
         <header className="h-16 border-b border-[#efefef] flex items-center px-6 md:px-8 justify-between bg-white shrink-0 z-30 sticky top-0">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="p-1.5 rounded-md text-[#a5a5a5] hover:bg-[#faf9f7] hover:text-[#121722] transition-colors cursor-pointer -ml-1.5"
             >
               {isSidebarOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
             </button>
             <div className="flex items-center gap-2 text-sm text-[#777c86] ml-2 border-l border-[#efefef] pl-4">
               <span className="font-medium text-[#121722] truncate capitalize">{view.replace('-', ' ')}</span>
             </div>
           </div>
           
           <div className="flex items-center gap-3">
             <CommandSearch applications={applications} onSelectApplication={(app) => { setEditingApp(app); setIsFormOpen(true); }} />
             <NotificationCenter onViewAll={() => setView('notifications')} />
           </div>
         </header>

         {/* Content Scrollable Area */}
         <main className="flex-1 overflow-y-auto bg-[#faf9f7] p-6 md:p-8 w-full flex flex-col custom-scrollbar relative">
            {view === 'sankey' && <SankeyChart applications={applications} />}
            {view === 'global-market' && <GlobalMarket isDemo={isDemo} onAddToWishlist={handleSave} />}
            {view === 'kanban' && <Kanban applications={applications} onEdit={setEditingApp} onStatusChange={handleStatusChange as any} onDelete={handleDelete} locationFilter={locationFilter} onLocationSelect={handleLocationSelect} />}
            {view === 'analytics' && <Analytics applications={applications} />}
            {view === 'cv-match' && <CVMatchAssessment applications={applications} onAddToWishlist={handleSave} onViewHistory={() => setView('eval-history')} />}
            {view === 'notifications' && <NotificationsPage onBack={() => setView('sankey')} />}
            {view === 'settings' && <SettingsPage onBack={() => setView('sankey')} onClearData={handleClearData} isSyncing={isSyncing} />}
            {view === 'eval-history' && <EvaluateHistoryPage onBack={() => setView('cv-match')} applications={applications} onAddToWishlist={handleSave} />}
         </main>
      </div>
      
      `;

const newCode = code.substring(0, returnIdx) + newRender + code.substring(endIdx);
fs.writeFileSync('src/components/Dashboard.tsx', newCode);
console.log("Dashboard layout updated.");
