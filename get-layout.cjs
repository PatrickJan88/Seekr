const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const returnIdx = code.indexOf('return (\\n    <div className="min-h-screen bg-[#faf9f7]');
console.log(code.substring(returnIdx, returnIdx + 2000));
