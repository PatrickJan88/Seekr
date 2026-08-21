const { Country, City } = require('country-state-city');
const c = Country.getAllCountries()[0];
console.log("Country keys:", Object.keys(c));
const germany = Country.getAllCountries().find(x => x.name === 'Germany');
console.log("Germany:", germany);
