const pkg = require('@countrystatecity/countries');
console.log(Object.keys(pkg));
if (pkg.getCountries) {
    console.log(pkg.getCountries()[0]);
}
if (pkg.getCities) {
    console.log(pkg.getCities().slice(0, 2));
}
