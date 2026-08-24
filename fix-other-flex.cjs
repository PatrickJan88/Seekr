const fs = require('fs');

// CVMatchAssessment
let cvCode = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');
cvCode = cvCode.replace(
  '<div className="w-full space-y-6">',
  '<div className="w-full flex-1 flex flex-col space-y-6 min-h-0">'
);
fs.writeFileSync('src/components/CVMatchAssessment.tsx', cvCode);

// Analytics
let anCode = fs.readFileSync('src/components/Analytics.tsx', 'utf8');
anCode = anCode.replace(
  '<div className="grid grid-cols-12 gap-6">',
  '<div className="grid grid-cols-12 gap-6 flex-1 min-h-0">'
);
fs.writeFileSync('src/components/Analytics.tsx', anCode);

