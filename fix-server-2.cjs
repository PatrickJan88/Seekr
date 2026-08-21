const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("const allCountries = Country.getAllCountries();", "const allCountries = await getCountries();");
code = code.replace("const allCities = City.getAllCities();", "const allCities = await getAllCitiesInWorld();");

code = code.replace(/cityObj\.countryCode/g, "cityObj.country_code");
code = code.replace(/c\.countryCode/g, "c.country_code");

fs.writeFileSync('server.ts', code);
