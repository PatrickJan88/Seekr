const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const target1 = `res.write(\`data: \${JSON.stringify({ text: fallbackText })}\\n\\n\`);`;
const replacement1 = `res.write(\`data: \${JSON.stringify({ meta: { reset: true }, text: fallbackText })}\\n\\n\`);`;

const target2 = `res.write(\`data: \${JSON.stringify({ text: JSON.stringify(staticFallback) })}\\n\\n\`);`;
const replacement2 = `res.write(\`data: \${JSON.stringify({ meta: { reset: true }, text: JSON.stringify(staticFallback) })}\\n\\n\`);`;

server = server.replace(target1, replacement1);
server = server.replace(target2, replacement2);

fs.writeFileSync('server.ts', server);
console.log("Patched server to send reset flags");
