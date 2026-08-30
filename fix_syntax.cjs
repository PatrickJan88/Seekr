const fs = require('fs');
let code = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf-8');

// The leftover block is from <div className="hidden"> to the end of that block.
// Wait, I can just use my regex to find `<div className="hidden">` and remove until the next `{/* Loading Skeleton Indicator */}`
code = code.replace(/<div className="hidden">[\s\S]*?\{\/\* Loading Skeleton Indicator \*\/\}/, '{/* Loading Skeleton Indicator */}');

fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', code);
