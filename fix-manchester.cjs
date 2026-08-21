const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace("cityMap.set('toronto', { city: 'Toronto', country: 'Canada' });", "cityMap.set('toronto', { city: 'Toronto', country: 'Canada' });\ncityMap.set('manchester', { city: 'Manchester', country: 'United Kingdom' });");
fs.writeFileSync('server.ts', code);
