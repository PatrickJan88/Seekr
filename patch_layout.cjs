const fs = require('fs');
let code = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf-8');

// 1. Remove renderTabSwitcher function
code = code.replace(/  const renderTabSwitcher = \(\) => \([\s\S]*?\n  \);\n\n/, '');

// 2. Rewrite the main return
const oldReturnStart = `  return (
    <div className="w-full flex-1 flex flex-col gap-6 pb-16 font-sans">
      {activeTab === 'explorer' ? (
        <>
          {/* Input & Search Section */}
          <div className="bg-white border border-[#efefef] rounded-2xl p-5 shadow-2xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#efefef]">
              <div>
                <h3 className="text-base font-bold text-[#121722]">
                  {'Analyze any company\\'s core loop and product features.'}
                </h3>
              </div>
              {renderTabSwitcher()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">`;

const newReturnStart = `  return (
    <div className="w-full flex-1 flex flex-col gap-6 pb-16 font-sans">
      {/* Unified Global Header */}
      <div className="bg-white border border-[#efefef] rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-1 bg-[#faf9f7] p-1 border border-[#efefef] rounded-full text-xs font-medium shrink-0">
            <button
              onClick={() => setActiveTab('explorer')}
              className={\`px-4 py-1.5 rounded-full transition-all cursor-pointer \${
                activeTab === 'explorer' 
                  ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' 
                  : 'text-[#777c86] hover:text-[#121722] border border-transparent'
              }\`}
            >
              {'Teardown'}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={\`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer \${
                activeTab === 'history' 
                  ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' 
                  : 'text-[#777c86] hover:text-[#121722] border border-transparent'
              }\`}
            >
              <span>{'Saved'}</span>
              {savedRecords.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-100 text-[10px] flex items-center justify-center font-bold text-blue-700 border border-blue-200">
                  {savedRecords.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto md:max-w-2xl">
            <div className="relative w-full">
              <Building2 className="w-4 h-4 text-[#a5a5a5] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Linear, Stripe"
                className="w-full pl-9 pr-3 h-10 text-xs bg-[#faf9f7] border border-[#efefef] rounded-xl text-[#121722] focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
            <div className="relative w-full">
              <Globe className="w-4 h-4 text-[#a5a5a5] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Website URL"
                className="w-full pl-9 pr-8 h-10 text-xs bg-[#faf9f7] border border-[#efefef] rounded-xl text-[#121722] focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
              {verification.verified && !verification.isAts && (
                <ShieldCheck className="w-4 h-4 text-blue-600 absolute right-2 top-1/2 -translate-y-1/2" title="Verified" />
              )}
            </div>
            <button
              onClick={() => { setActiveTab('explorer'); handleGenerate(); }}
              disabled={isLoading || (!companyName && !websiteUrl)}
              className="h-10 px-5 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 w-full sm:w-auto"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5 text-blue-200" />}
              <span>{'Generate'}</span>
            </button>
          </div>
        </div>

        {verification.isAts && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-600 shrink-0" />
              <span>
                <strong>{'ATS Job Portal Link Detected:'}</strong>{' '}
                {'Company intelligence works best with the authentic corporate homepage.'}
              </span>
            </div>
            {verification.suggestedHomepage && (
              <button
                onClick={() => {
                  setWebsiteUrl(verification.suggestedHomepage);
                  verifyAndSetUrl(verification.suggestedHomepage, companyName);
                  toast.success(\`Switched to official homepage: \${verification.suggestedHomepage}\`);
                }}
                className="px-2.5 py-1 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 text-xs shrink-0 cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 size={12} />
                <span>{\`Use Official: \${verification.suggestedHomepage}\`}</span>
              </button>
            )}
          </div>
        )}

        {recentSearches.length > 0 && activeTab === 'explorer' && (
          <div className="mt-4 pt-3 border-t border-[#efefef] flex items-center gap-3">
            <span className="text-[11px] text-[#777c86] font-bold uppercase shrink-0">Recent Searches</span>
            <div className="flex-1 overflow-x-auto flex items-center gap-2 scrollbar-hide">
              {recentSearches.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCompanyName(p.name);
                    setWebsiteUrl(p.url);
                    verifyAndSetUrl(p.url, p.name);
                    handleGenerate(p.name, p.url);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-[#faf9f7] hover:bg-blue-50 text-[#525866] hover:text-blue-700 border border-[#efefef] hover:border-blue-200 rounded-lg transition-all cursor-pointer font-medium whitespace-nowrap"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button className="p-1 hover:bg-[#faf9f7] rounded-lg text-[#a5a5a5] hover:text-[#121722] transition-colors cursor-pointer shrink-0">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {activeTab === 'explorer' ? (
        <>
          <div className="hidden">`;

code = code.replace(oldReturnStart, newReturnStart);

const oldSavedHeaderStart = `        /* Saved Teardowns & History View (Inside Dedicated Tab) */
        <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#efefef]">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#121722]">
                {'Saved Companies'}
              </h2>
              <div className="relative group flex items-center">
                <button type="button" className="text-[#a5a5a5] hover:text-blue-600 transition-colors cursor-help">
                  <Info size={14} />
                </button>
                <div className="absolute left-0 bottom-full mb-2 w-72 p-2.5 bg-[#121722] text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl pointer-events-none font-normal">
                  {'All previously generated holistic teardowns are stored securely for instant review.'}
                  <div className="absolute left-2 -bottom-1 border-4 border-transparent border-t-[#121722]"></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#a5a5a5] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder={'Search company...'}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#faf9f7] border border-[#efefef] rounded-xl text-[#121722] focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
              {renderTabSwitcher()}
            </div>
          </div>`;

const newSavedHeaderStart = `        /* Saved Teardowns View */
        <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#efefef]">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#121722]">
                {'Saved Companies'}
              </h2>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#a5a5a5] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={'Search saved companies...'}
                className="w-full pl-8 pr-3 h-9 text-xs bg-[#faf9f7] border border-[#efefef] rounded-xl text-[#121722] focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>`;

code = code.replace(oldSavedHeaderStart, newSavedHeaderStart);

// Clean up the leftover old explorer inputs container div
const leftoverInputs = `              <div className="md:col-span-4 relative">
                <label className="block text-[11px] font-bold text-[#777c86] mb-1.5">
                  {'Company Name'}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#a5a5a5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Linear, Stripe, Figma"
                    className="w-full pl-9 pr-3 h-10 text-sm bg-[#faf9f7] border border-[#efefef] rounded-xl text-[#121722] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="md:col-span-5 relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-[#777c86]">
                    {'Company Website'}
                  </label>
                </div>
                <div className="relative">
                  <Globe className="w-4 h-4 text-[#a5a5a5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.teamtailor.com/en-us/"
                    className="w-full pl-9 pr-8 h-10 text-sm bg-[#faf9f7] border border-[#efefef] rounded-xl text-[#121722] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  {verification.verified && !verification.isAts && (
                    <ShieldCheck className="w-4 h-4 text-blue-600 absolute right-3 top-1/2 -translate-y-1/2" title="Verified official homepage" />
                  )}
                </div>
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={() => handleGenerate()}
                  disabled={isLoading || (!companyName && !websiteUrl)}
                  className="w-full h-10 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{'Analyzing System...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-blue-200" />
                      <span>{'Generate Insight'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Smart ATS Warning / Link Switcher */}
            {verification.isAts && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-600 shrink-0" />
                  <span>
                    <strong>{'ATS Job Portal Link Detected:'}</strong>{' '}
                    {'Company intelligence works best with the authentic corporate homepage.'}
                  </span>
                </div>
                {verification.suggestedHomepage && (
                  <button
                    onClick={() => {
                      setWebsiteUrl(verification.suggestedHomepage!);
                      verifyAndSetUrl(verification.suggestedHomepage!, companyName);
                      toast.success(\`Switched to official homepage: \${verification.suggestedHomepage}\`);
                    }}
                    className="px-2.5 py-1 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 text-xs shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} />
                    <span>{\`Use Official: \${verification.suggestedHomepage}\`}</span>
                  </button>
                )}
              </div>
            )}

            {/* Candidate Links Badge Bar (when loaded from application) */}
            {candidateLinks.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#efefef]">
                <span className="text-[11px] font-bold text-[#777c86] uppercase flex items-center gap-1">
                  <Link2 size={12} className="text-blue-600" />
                  <span>{'Detected Links:'}</span>
                </span>
                {candidateLinks.map((lnk, idx) => {
                  const isCurrent = websiteUrl.toLowerCase().includes(lnk.domain);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setWebsiteUrl(lnk.normalizedUrl);
                        verifyAndSetUrl(lnk.normalizedUrl, companyName);
                      }}
                      className={\`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer \${
                        isCurrent
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                          : 'bg-[#faf9f7] text-[#525866] border-[#efefef] hover:border-blue-200'
                      }\`}
                    >
                      {lnk.type === 'homepage' && <CheckCircle2 size={12} className="text-blue-600" />}
                      <span>{lnk.title || lnk.domain}</span>
                      <span className={\`text-[10px] px-1 py-0.2 rounded font-medium \${
                        lnk.type === 'homepage' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }\`}>
                        {lnk.type === 'homepage' ? 'Official Homepage' : lnk.type === 'ats_job_post' ? 'Job Post (ATS)' : 'Link'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#efefef]">
              <span className="text-xs text-[#777c86] font-medium">
                {'Sample Companies:'}
              </span>
              {PRESET_COMPANIES.map(p => (
                <button
                  key={p.name}
                  onClick={() => {
                    setCompanyName(p.name);
                    setWebsiteUrl(p.url);
                    verifyAndSetUrl(p.url, p.name);
                    handleGenerate(p.name, p.url);
                  }}
                  className="px-2.5 py-1 text-xs bg-[#faf9f7] hover:bg-blue-50 text-[#525866] hover:text-blue-700 border border-[#efefef] hover:border-blue-200 rounded-lg transition-all cursor-pointer font-medium"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>`;

code = code.replace(leftoverInputs, '');
// there's an extra `<div className="hidden">` we started, we must close it. 
// It closes the `<div className="hidden">` because I stripped `leftoverInputs` which had a trailing `</div>`.
code = code.replace(/<div className="hidden">\s*$/, ''); // clean it up if it ends there, but it won't.

fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', code);
