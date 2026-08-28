const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/[a-zA-Z0-9_]+Zh:\s*'.*?',?\n?/g, '');
fs.writeFileSync('server.ts', server);
console.log("Cleaned server.ts third pass");
