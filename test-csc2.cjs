const { Country, City } = require('country-state-city');
console.time('getAllCities');
const allCities = City.getAllCities();
console.timeEnd('getAllCities');
console.log("Total cities:", allCities.length);
console.time('findBerlin');
const berlin = allCities.find(c => c.name === 'Berlin');
console.timeEnd('findBerlin');
console.log("Berlin:", berlin);
