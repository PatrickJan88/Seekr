const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/"[a-zA-Z0-9]+Zh":\s*".*?",?/g, '');
server = server.replace(/"[a-zA-Z0-9]+Zh":\s*\[.*?\]\s*,?/g, '');
// Clean up trailing commas inside objects
server = server.replace(/,\s*\}/g, '}');

fs.writeFileSync('server.ts', server);

console.log("Cleaned server.ts");
