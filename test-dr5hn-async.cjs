const { getCountries, getAllCitiesInWorld } = require('@countrystatecity/countries');

(async () => {
    const allCountries = await getCountries();
    console.log("Country Example:", allCountries[0]);

    const allCities = await getAllCitiesInWorld();
    console.log("City Example:", allCities[0]);
    console.log("Total Cities:", allCities.length);
})();
