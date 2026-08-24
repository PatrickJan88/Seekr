const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

const searchRegex = /<div className="relative flex-1">\s*<Search className="absolute left-4 top-1\/2 -translate-y-1\/2 text-\[#a5a5a5\]" size=\{16\} \/>\s*<input\s*type="text"\s*placeholder="Search roles or companies in market"\s*value=\{searchTerm\}\s*onChange=\{\(e\) => setSearchTerm\(e\.target\.value\)\}\s*className="w-full pl-11 pr-4 h-11 bg-white border border-\[#efefef\] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-\[#0068f9\] transition-all shadow-2xs hover:bg-\[#faf9f7\]"\s*\/>\s*<\/div>/;

const newSearchBlock = `<div className="relative flex-1 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a5a5a5]" size={16} />
              <input
                type="text"
                placeholder="Search roles or companies in market"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 h-11 bg-white border border-[#efefef] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0068f9] transition-all shadow-2xs hover:bg-[#faf9f7]"
              />
            </div>
            <div className="text-[#777c86] text-sm whitespace-nowrap font-medium pr-2">
              {processedJobs.length > 99 ? '99+ results' : \`\${processedJobs.length} results\`}
            </div>
          </div>`;

code = code.replace(searchRegex, newSearchBlock);
fs.writeFileSync('src/components/GlobalMarket.tsx', code);
