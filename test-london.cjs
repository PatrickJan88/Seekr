const { City } = require('country-state-city');
const all = City.getAllCities();
const matches = all.filter(c => c.name.toLowerCase() === 'london');
console.log(matches.slice(0, 5));
