const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

code = code.replace(
  '<div className="flex justify-between items-start mb-6">\n          <div>\n            <h2 className="text-xl font-bold text-[#121722] mb-1">Job Market</h2>\n            <p className="text-[#777c86] text-sm">Explore the latest tech roles aggregated from open global sources.</p>\n          </div>\n          <div className="text-[#777c86] text-sm whitespace-nowrap ml-4 mt-1">',
  '<div className="flex justify-end items-start mb-6">\n          <div className="text-[#777c86] text-sm whitespace-nowrap ml-4 mt-1">'
);

fs.writeFileSync('src/components/GlobalMarket.tsx', code);
