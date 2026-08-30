const fs = require('fs');
let code = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf-8');

// 1. Remove recent searches from header
const headerRecentRegex = /\{\s*recentSearches\.length > 0 && activeTab === 'explorer' && \([\s\S]*?\}\s*\)\s*\}/;
code = code.replace(headerRecentRegex, '');

// 2. Add empty state to explorer tab
const emptyStateStr = `          {/* Empty State for Explorer */}
          {!currentTeardown && !isLoading && (
            <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col items-center justify-center gap-2 min-h-[600px] animate-in fade-in duration-300">
              <Building2 className="w-8 h-8 text-[#d1d5db]" />
              <span className="font-semibold text-sm text-[#121722]">
                {'No company analyzed yet'}
              </span>
              <p className="max-w-xs text-[#a5a5a5] text-center text-xs">
                {'Enter any company name and website URL in the top bar to generate your first analysis.'}
              </p>
              
              {recentSearches.length > 0 && (
                <div className="mt-8 w-full max-w-lg border-t border-[#efefef] pt-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-[#121722] uppercase tracking-wider">Recent Searches</span>
                    <button className="text-[11px] text-[#a5a5a5] hover:text-[#121722] font-semibold flex items-center gap-1 transition-colors cursor-pointer">
                      <span>View All</span> <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    {recentSearches.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCompanyName(p.name);
                          setWebsiteUrl(p.url);
                          verifyAndSetUrl(p.url, p.name);
                          handleGenerate(p.name, p.url);
                        }}
                        className="px-3.5 py-2 text-xs bg-[#faf9f7] hover:bg-blue-50 text-[#525866] hover:text-blue-700 border border-[#efefef] hover:border-blue-200 rounded-xl transition-all cursor-pointer font-medium shadow-sm"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}`;

const targetInsertion = `{/* Loading Skeleton Indicator */}`;
code = code.replace(targetInsertion, emptyStateStr + '\n\n          ' + targetInsertion);

// 3. Make Saved Companies container min-h-[600px]
// Find the exact line for Saved Companies
code = code.replace(/<div className="bg-white border border-\[\#efefef\] rounded-2xl p-6 shadow-2xs flex flex-col gap-5">/g, 
  '<div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col gap-5 min-h-[600px]">');

fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', code);
