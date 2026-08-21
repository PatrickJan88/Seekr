const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// replace the old import
code = code.replace("import { Country, City } from 'country-state-city';", "import { getCountries, getAllCitiesInWorld } from '@countrystatecity/countries';");

// replace the setup
const oldSetup = `const allCountries = Country.getAllCountries();
const countryMap = new Map<string, any>(allCountries.map(c => [c.name.toLowerCase(), c]));
countryMap.set('usa', countryMap.get('united states'));
countryMap.set('us', countryMap.get('united states'));
countryMap.set('uk', countryMap.get('united kingdom'));
countryMap.set('england', countryMap.get('united kingdom'));
countryMap.set('northern ireland', countryMap.get('united kingdom'));
countryMap.set('scotland', countryMap.get('united kingdom'));
countryMap.set('wales', countryMap.get('united kingdom'));
countryMap.set('deutschland', countryMap.get('germany'));
countryMap.set('de', countryMap.get('germany'));

const allCities = City.getAllCities();
const cityMap = new Map<string, any>();
for (const city of allCities) {
    const key = city.name.toLowerCase();
    if (!cityMap.has(key)) {
        cityMap.set(key, city);
    }
}
cityMap.set('london', allCities.find(c => c.name === 'London' && c.countryCode === 'GB'));
cityMap.set('paris', allCities.find(c => c.name === 'Paris' && c.countryCode === 'FR'));
cityMap.set('berlin', allCities.find(c => c.name === 'Berlin' && c.countryCode === 'DE'));
cityMap.set('belfast', allCities.find(c => c.name === 'Belfast' && c.countryCode === 'GB'));
cityMap.set('edinburgh', allCities.find(c => c.name === 'Edinburgh' && c.countryCode === 'GB'));
cityMap.set('new york', allCities.find(c => c.name === 'New York' && c.countryCode === 'US'));
cityMap.set('san francisco', allCities.find(c => c.name === 'San Francisco' && c.countryCode === 'US'));
cityMap.set('amsterdam', allCities.find(c => c.name === 'Amsterdam' && c.countryCode === 'NL'));
cityMap.set('toronto', allCities.find(c => c.name === 'Toronto' && c.countryCode === 'CA'));
cityMap.set('münchen', cityMap.get('munich'));
cityMap.set('köln', cityMap.get('cologne'));`;

const newSetup = `const allCountries = await getCountries();
const countryMap = new Map<string, any>(allCountries.map(c => [c.name.toLowerCase(), c]));
countryMap.set('usa', countryMap.get('united states'));
countryMap.set('us', countryMap.get('united states'));
countryMap.set('uk', countryMap.get('united kingdom'));
countryMap.set('england', countryMap.get('united kingdom'));
countryMap.set('northern ireland', countryMap.get('united kingdom'));
countryMap.set('scotland', countryMap.get('united kingdom'));
countryMap.set('wales', countryMap.get('united kingdom'));
countryMap.set('deutschland', countryMap.get('germany'));
countryMap.set('de', countryMap.get('germany'));

const allCities = await getAllCitiesInWorld();
const cityMap = new Map<string, any>();
for (const city of allCities) {
    const key = city.name.toLowerCase();
    if (!cityMap.has(key)) {
        cityMap.set(key, city);
    }
}
cityMap.set('london', allCities.find(c => c.name === 'London' && c.country_code === 'GB'));
cityMap.set('paris', allCities.find(c => c.name === 'Paris' && c.country_code === 'FR'));
cityMap.set('berlin', allCities.find(c => c.name === 'Berlin' && c.country_code === 'DE'));
cityMap.set('belfast', allCities.find(c => c.name === 'Belfast' && c.country_code === 'GB'));
cityMap.set('edinburgh', allCities.find(c => c.name === 'Edinburgh' && c.country_code === 'GB'));
cityMap.set('new york', allCities.find(c => c.name === 'New York' && c.country_code === 'US'));
cityMap.set('san francisco', allCities.find(c => c.name === 'San Francisco' && c.country_code === 'US'));
cityMap.set('amsterdam', allCities.find(c => c.name === 'Amsterdam' && c.country_code === 'NL'));
cityMap.set('toronto', allCities.find(c => c.name === 'Toronto' && c.country_code === 'CA'));
cityMap.set('münchen', cityMap.get('munich'));
cityMap.set('köln', cityMap.get('cologne'));`;

if (!code.includes(oldSetup)) {
    console.error("Old setup not found");
}
code = code.replace(oldSetup, newSetup);

const oldContinentByCountry = `const getContinentByCountry = (countryObj: any) => {
    if (!countryObj) return 'Other';
    if (countryObj.timezones && countryObj.timezones.length > 0) {
        const tz = countryObj.timezones[0].zoneName.split('/')[0];
        if (tz === 'America') return 'Americas';
        if (tz === 'Europe') return 'Europe';
        if (tz === 'Asia') return 'Asia';
        if (tz === 'Africa') return 'Africa';
        if (tz === 'Pacific') return 'Oceania';
        if (tz === 'Atlantic' || tz === 'Indian') return 'Other';
    }
    return 'Other';
};`;

const newContinentByCountry = `const getContinentByCountry = (countryObj: any) => {
    if (!countryObj) return 'Other';
    const region = countryObj.region;
    if (region === 'Americas') return 'Americas';
    if (region === 'Europe') return 'Europe';
    if (region === 'Asia') return 'Asia';
    if (region === 'Africa') return 'Africa';
    if (region === 'Oceania') return 'Oceania';
    return 'Other';
};`;

code = code.replace(oldContinentByCountry, newContinentByCountry);

// We need to fix the countryObj mapping since we don't have Country.getCountryByCode anymore,
// but we have allCountries.
// So we can map iso2 to countryObj.

const iso2MapCode = `\nconst countryIso2Map = new Map<string, any>(allCountries.map(c => [c.iso2.toLowerCase(), c]));\n`;
code = code.replace(`const cityMap = new Map<string, any>();`, `${iso2MapCode}const cityMap = new Map<string, any>();`);

// Replace Country.getCountryByCode(cityObj.countryCode) with countryIso2Map.get(cityObj.country_code.toLowerCase())
code = code.replace(/Country\.getCountryByCode\(cityObj\.countryCode\)/g, "countryIso2Map.get(cityObj.country_code.toLowerCase())");

fs.writeFileSync('server.ts', code);
console.log('done');
