const { Country, City } = require('country-state-city');

// Precompute lists for faster lookup (server only runs this once)
const allCountries = Country.getAllCountries();
const countryMap = new Map(allCountries.map(c => [c.name.toLowerCase(), c]));
const countryCodeMap = new Map(allCountries.map(c => [c.isoCode.toLowerCase(), c]));

// Precompute cities? 148,000 cities might be slow to search every time.
// Let's index cities by lowercase name.
const allCities = City.getAllCities();
const cityMap = new Map();
// If multiple cities have the same name (e.g. London, UK vs London, Ontario), 
// we prefer the one with higher population or just pick the first.
for (const city of allCities) {
    const key = city.name.toLowerCase();
    if (!cityMap.has(key)) {
        cityMap.set(key, city);
    }
}

console.log("Ready.");
