const { Country } = require('country-state-city');
const all = Country.getAllCountries();
const continents = new Set();
for (const c of all) {
   if (c.timezones && c.timezones.length > 0) {
      const tz = c.timezones[0].zoneName;
      const continent = tz.split('/')[0];
      continents.add(continent);
   }
}
console.log(Array.from(continents));
