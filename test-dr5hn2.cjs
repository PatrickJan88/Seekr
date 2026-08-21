const { getCountries, getAllCitiesInWorld } = require('@countrystatecity/countries');

const allCountries = getCountries();
console.log("Country Example:", allCountries[0]);

const allCities = getAllCitiesInWorld();
console.log("City Example:", allCities[0]);
console.log("Total Cities:", allCities.length);
