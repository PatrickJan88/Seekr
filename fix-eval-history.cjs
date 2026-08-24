const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluateHistoryPage.tsx', 'utf8');

code = code.replace(
  '<div className="w-full h-full max-w-5xl mx-auto flex flex-col pt-6 pb-20 px-4 sm:px-6">',
  '<div className="w-full flex-1 max-w-5xl mx-auto flex flex-col min-h-0">'
);
fs.writeFileSync('src/components/EvaluateHistoryPage.tsx', code);
