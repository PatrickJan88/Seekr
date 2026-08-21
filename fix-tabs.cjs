const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const jobMarketTab = `            <button
              onClick={() => setView('global-market')}
              className={\`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all cursor-pointer \${view === 'global-market' ? 'bg-[#e8f1ff] text-[#0068f9] border border-[#0068f9]/30 shadow-2xs' : 'text-[#777c86] hover:text-[#121722] border border-transparent hover:bg-[#faf9f7]'}\`}
            >
              <Globe size={16} className={view === 'global-market' ? 'text-[#0068f9]' : 'text-[#777c86]'} />
              Job Market
            </button>
`;

code = code.replace(jobMarketTab, '');
const overviewEnd = `              Overview
            </button>
`;
code = code.replace(overviewEnd, overviewEnd + jobMarketTab);

fs.writeFileSync('src/components/Dashboard.tsx', code);
