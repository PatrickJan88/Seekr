const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Replace map inference
code = code.replace("const countryMap = new Map(allCountries.map(c => [c.name.toLowerCase(), c]));", "const countryMap = new Map<string, any>(allCountries.map(c => [c.name.toLowerCase(), c]));");
code = code.replace("const cityMap = new Map();", "const cityMap = new Map<string, any>();");

fs.writeFileSync('server.ts', code);
