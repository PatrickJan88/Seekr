const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const returnStart = code.lastIndexOf('  return (');
if (returnStart > -1) {
  const mainEnd = code.indexOf('</main>', returnStart);
  
  const modalsStart = code.indexOf('{isFormOpen && (', mainEnd);
  
  const beforeRender = code.substring(0, returnStart);
  const modalsAndEnd = code.substring(modalsStart);
  
  const newRender = `  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[#faf9f7] md:p-4 lg:p-6 xl:p-8">
      <div className="relative w-full max-w-[1600px] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] xl:max-h-[900px] xl:aspect-video bg-white sm:rounded-2xl border-0 sm:border border-[#efefef] shadow-2xs flex overflow-hidden">
        
        {/* Sidebar */}
        <div className={\`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-[#faf9f7] border-r border-[#efefef] \${isSidebarOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none'}\`}>
          <SidebarNav
             className="w-[260px] border-none bg-transparent"
             activeId={view}
             onSelect={(id) => setView(id as any)}
             isDemo={isDemo}
             onImport={() => isDemo ? toast.info('Demo Mode: Importing data is disabled in this portfolio preview.') : setShowImportModal(true)}
             onExport={handleExport}
             onNew={() => { setEditingApp(null); setIsFormOpen(true); }}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white flex flex-col min-w-0 transition-all duration-300 relative">
           {/* Top Navbar */}
           <div className="h-14 border-b border-[#efefef] flex items-center px-4 justify-between bg-white shrink-0 z-10">
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                 className="p-1.5 rounded-md text-[#a5a5a5] hover:bg-[#faf9f7] hover:text-[#121722] transition-colors cursor-pointer"
               >
                 {isSidebarOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
               </button>
               <div className="flex items-center gap-2 text-sm text-[#777c86]">
                 <span className="font-medium text-[#121722] truncate capitalize">{view.replace('-', ' ')}</span>
               </div>
             </div>
             
             <div className="flex items-center gap-3">
               <CommandSearch applications={applications} onSelectApplication={(app) => { setEditingApp(app); setIsFormOpen(true); }} />
               <NotificationCenter onViewAll={() => setView('notifications')} />
             </div>
           </div>

           {/* Content Scrollable Area */}
           <div className="flex-1 overflow-y-auto bg-[#faf9f7] custom-scrollbar p-4 md:p-6 relative">
              {view === 'sankey' && <SankeyChart applications={applications} />}
              {view === 'global-market' && <GlobalMarket applications={applications} />}
              {view === 'kanban' && <Kanban applications={applications} onEdit={setEditingApp} setIsFormOpen={setIsFormOpen} onDelete={handleDelete} locationFilter={locationFilter} onLocationSelect={handleLocationSelect} />}
              {view === 'analytics' && <Analytics applications={applications} />}
              {view === 'cv-match' && <CVMatchAssessment applications={applications} onAddToWishlist={handleSave} onViewHistory={() => setView('eval-history')} />}
              {view === 'notifications' && <NotificationsPage onNavigate={(viewName) => setView(viewName as any)} />}
           </div>
        </div>
      </div>
      
      `;
      
      const newCode = beforeRender + newRender + modalsAndEnd;
      fs.writeFileSync('src/components/Dashboard.tsx', newCode);
      console.log('Render updated.');
} else {
  console.log('Could not find return statement.');
}
