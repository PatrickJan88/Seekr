const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/[a-zA-Z0-9_]+Zh:\s*`.*?`,?\n?/g, '');
server = server.replace(/[a-zA-Z0-9_]+Zh:\s*".*?",?\n?/g, '');
server = server.replace(/[a-zA-Z0-9_]+Zh:\s*\[.*?\]\s*,?\n?/gs, '');
// For the JSON prompt string that has quoted keys
server = server.replace(/"[a-zA-Z0-9_]+Zh":\s*".*?",?\n?/g, '');
server = server.replace(/"[a-zA-Z0-9_]+Zh":\s*\[.*?\]\s*,?\n?/gs, '');
// Clean up any stray trailing commas before closing braces
server = server.replace(/,\s*\}/g, '}');

fs.writeFileSync('server.ts', server);
console.log("Cleaned server.ts again");
