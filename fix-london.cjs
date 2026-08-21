const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const explicitCities = `
cityMap.set('london', allCities.find(c => c.name === 'London' && c.countryCode === 'GB'));
cityMap.set('paris', allCities.find(c => c.name === 'Paris' && c.countryCode === 'FR'));
cityMap.set('berlin', allCities.find(c => c.name === 'Berlin' && c.countryCode === 'DE'));
cityMap.set('belfast', allCities.find(c => c.name === 'Belfast' && c.countryCode === 'GB'));
cityMap.set('edinburgh', allCities.find(c => c.name === 'Edinburgh' && c.countryCode === 'GB'));
cityMap.set('new york', allCities.find(c => c.name === 'New York' && c.countryCode === 'US'));
cityMap.set('san francisco', allCities.find(c => c.name === 'San Francisco' && c.countryCode === 'US'));
cityMap.set('amsterdam', allCities.find(c => c.name === 'Amsterdam' && c.countryCode === 'NL'));
cityMap.set('toronto', allCities.find(c => c.name === 'Toronto' && c.countryCode === 'CA'));
cityMap.set('münchen', cityMap.get('munich'));
cityMap.set('köln', cityMap.get('cologne'));
`;

code = code.replace("cityMap.set('münchen', cityMap.get('munich'));\ncityMap.set('köln', cityMap.get('cologne'));", explicitCities);

fs.writeFileSync('server.ts', code);
