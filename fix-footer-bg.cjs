const fs = require('fs');
let code = fs.readFileSync('src/components/Footer.tsx', 'utf8');

code = code.replace(
  'className="py-3 bg-white border-t border-[#efefef] flex flex-col font-sans text-[#121722] mt-auto"',
  'className="py-6 bg-transparent border-t border-[#efefef] flex flex-col font-sans text-[#121722] mt-auto"'
);
fs.writeFileSync('src/components/Footer.tsx', code);
