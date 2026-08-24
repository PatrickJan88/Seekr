const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (!code.includes('nestedBreadcrumb')) {
  // Add state
  const stateInsertion = `  const [nestedBreadcrumb, setNestedBreadcrumb] = useState<{label: string; onBack: () => void} | null>(null);

  useEffect(() => {
    setNestedBreadcrumb(null);
  }, [view]);
`;
  code = code.replace(
    `const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);`,
    `const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);\n${stateInsertion}`
  );

  // Replace header
  const newHeader = `<header className="h-16 border-b border-[#efefef] flex items-center px-6 md:px-8 justify-between bg-white shrink-0 z-30 sticky top-0">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="p-1.5 rounded-md text-[#a5a5a5] hover:bg-[#faf9f7] hover:text-[#121722] transition-colors cursor-pointer -ml-1.5"
             >
               {isSidebarOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
             </button>
             <div className="flex items-center gap-2 text-[13px] text-[#777c86] ml-2 border-l border-transparent pl-2">
               {nestedBreadcrumb ? (
                 <>
                   <span 
                     className="hidden sm:inline-block hover:text-[#121722] cursor-pointer transition-colors"
                     onClick={() => nestedBreadcrumb.onBack()}
                   >
                     {displayTitle}
                   </span>
                   <span className="hidden sm:inline-block text-[#d1d5db]">/</span>
                   <span className="font-semibold text-[#121722] truncate capitalize">{nestedBreadcrumb.label}</span>
                 </>
               ) : (
                 <span className="font-semibold text-[#121722] truncate capitalize">{displayTitle}</span>
               )}
             </div>
           </div>`;
           
  code = code.replace(
    /<header className="h-16 border-b border-\[#efefef\] flex items-center px-6 md:px-8 justify-between bg-white shrink-0 z-30 sticky top-0">[\s\S]*?<\/div>\s*<\/div>/,
    newHeader
  );

  // Update CVMatchAssessment
  code = code.replace(
    `<CVMatchAssessment applications={applications} onAddToWishlist={handleSave} onViewHistory={() => setView('eval-history')} />`,
    `<CVMatchAssessment applications={applications} onAddToWishlist={handleSave} onViewHistory={() => setView('eval-history')} setNestedBreadcrumb={setNestedBreadcrumb} />`
  );

  // Update EvaluateHistoryPage
  code = code.replace(
    `<EvaluateHistoryPage applications={applications} onAddToWishlist={handleSave} />`,
    `<EvaluateHistoryPage applications={applications} onAddToWishlist={handleSave} setNestedBreadcrumb={setNestedBreadcrumb} />`
  );
  
  fs.writeFileSync('src/components/Dashboard.tsx', code);
}
