const { City } = require('country-state-city');
const all = City.getAllCities();
console.log(all.filter(c => c.name.toLowerCase() === 'cirencester'));
console.log(all.filter(c => c.name.toLowerCase() === 'vastorf'));
