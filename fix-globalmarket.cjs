const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

// Remove the standalone results count block
code = code.replace(
  /<div className="flex justify-end items-start mb-6">\s*<div className="text-\[#777c86\] text-sm whitespace-nowrap ml-4 mt-1">\s*\{processedJobs\.length > 99 \? '99\+ results' : `\$\{processedJobs\.length\} results`\}\s*<\/div>\s*<\/div>/,
  ''
);

// Put it next to the search input
const searchInputBlock = `<div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a5a5a5]" size={16} />
            <input
              type="text"
              placeholder="Search roles or companies in market"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#efefef] rounded-full text-sm outline-none focus:border-[#0068f9] transition-colors bg-[#faf9f7]"
            />
          </div>`;

const searchInputWithResults = `<div className="relative flex-1 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a5a5a5]" size={16} />
              <input
                type="text"
                placeholder="Search roles or companies in market"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#efefef] rounded-full text-sm outline-none focus:border-[#0068f9] transition-colors bg-[#faf9f7]"
              />
            </div>
            <div className="text-[#777c86] text-sm whitespace-nowrap font-medium">
              {processedJobs.length > 99 ? '99+ results' : \`\${processedJobs.length} results\`}
            </div>
          </div>`;

code = code.replace(searchInputBlock, searchInputWithResults);

// Adjust padding of the header container to make it shorter and match Overview
code = code.replace(
  '<div className="p-6 border-b border-[#efefef] shrink-0">',
  '<div className="p-4 sm:p-6 border-b border-[#efefef] shrink-0">'
);

fs.writeFileSync('src/components/GlobalMarket.tsx', code);
