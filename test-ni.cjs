const { Country } = require('country-state-city');
const all = Country.getAllCountries();
console.log(all.filter(c => c.name.toLowerCase().includes('ireland')));
