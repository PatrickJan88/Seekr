const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
const match = code.match(/const getContinent = \([\s\S]*?return 'Other';\n\};/);
if (match) {
    console.log(match[0]);
}
