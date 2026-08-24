const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf8');

code = code.replace(
  '<div className="flex justify-between items-start mb-6">\n          <div>\n            <h3 className="text-lg font-bold text-[#121722] mb-1">Application Process Overview</h3>\n            <p className="text-sm text-[#777c86]">Visualize your application pipeline from submission to outcome.</p>\n          </div>',
  '<div className="absolute top-6 right-6 z-10">'
);
code = code.replace(
  '          </button>\n        </div>\n        <div className="flex-1 w-full min-h-0 relative">',
  '          </button>\n        </div>\n        <div className="flex-1 w-full min-h-0 relative">'
);
fs.writeFileSync('src/components/SankeyChart.tsx', code);
