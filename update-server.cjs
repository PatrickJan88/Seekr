const fs = require('fs');

const code = fs.readFileSync('server.ts', 'utf8');

const locationParserLogic = `
import { Country, City } from 'country-state-city';

const allCountries = Country.getAllCountries();
const countryMap = new Map(allCountries.map(c => [c.name.toLowerCase(), c]));
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
const cityMap = new Map();
for (const city of allCities) {
    const key = city.name.toLowerCase();
    if (!cityMap.has(key)) {
        cityMap.set(key, city);
    }
}
cityMap.set('münchen', cityMap.get('munich'));
cityMap.set('köln', cityMap.get('cologne'));

const getContinentByCountry = (countryObj: any) => {
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
};

const getContinent = (countryName: string) => {
    if (!countryName) return 'Other';
    const cLower = countryName.toLowerCase();
    const cObj = countryMap.get(cLower);
    if (cObj) return getContinentByCountry(cObj);

    if (['europe', 'emea', 'eu', 'dach'].includes(cLower)) return 'Europe';
    if (['asia', 'apac'].includes(cLower)) return 'Asia';
    if (['americas', 'north america', 'south america', 'latam', 'na'].includes(cLower)) return 'Americas';
    if (['africa'].includes(cLower)) return 'Africa';
    if (['oceania', 'australasia'].includes(cLower)) return 'Oceania';
    if (cLower.includes('remote') || cLower.includes('global')) return 'Remote / Global';

    return 'Other';
};

const parseLocation = (loc: string) => {
    let raw = loc || '';
    let lower = raw.toLowerCase();
    
    if (!raw || lower === 'remote' || lower === 'anywhere' || lower === 'worldwide' || lower === 'unknown' || lower === 'homeoffice' || lower.includes('remote job')) {
      return { continent: 'Remote / Global', country: 'Remote / Global', city: '' };
    }
    
    if (lower.includes('europe, emea, uk, germany, france')) return { continent: 'Europe', country: 'Multiple Locations', city: 'Europe (Multiple)' };
    if (lower.includes('northern america, europe, uk, france')) return { continent: 'Multiple Continents', country: 'Multiple Locations', city: 'US & Europe' };
    if (lower.includes('usa, canada, usa timezones')) return { continent: 'Americas', country: 'Multiple Locations', city: 'US & Canada' };
    if (lower.includes('americas, europe, asia, africa, oceania')) return { continent: 'Remote / Global', country: 'Remote / Global', city: 'Worldwide' };
    if (lower.includes('americas, europe, israel')) return { continent: 'Multiple Continents', country: 'Multiple Locations', city: 'Americas, Europe, Israel' };
    if (lower.includes('mobiles arbeiten - deutschland') || lower.includes('deutschlandweit')) return { continent: 'Europe', country: 'Germany', city: 'Germany (Remote)' };

    raw = raw.replace(/[\\uD83C][\\uDDE6-\\uDDFF][\\uD83C][\\uDDE6-\\uDDFF]/g, '').trim(); 
    raw = raw.replace(/\\([^)]+\\)/g, '').trim();
    raw = raw.replace(/\\bHQ\\b/gi, '').trim();
    raw = raw.replace(/\\boffice\\b/gi, '').trim(); 
    raw = raw.replace(/\\bhybrid\\b/gi, '').trim(); 
    raw = raw.replace(/^-|-$/g, '').trim(); 
    
    if (raw.includes(';') || raw.includes('/')) {
       return { continent: 'Multiple Continents', country: 'Multiple Locations', city: raw };
    }

    let parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    let single = parts[0] || '';
    let singleLower = single.toLowerCase();
    
    if (parts.length >= 2) {
      let potentialCountry = parts[parts.length - 1];
      let pLower = potentialCountry.toLowerCase();
      let cObj = countryMap.get(pLower);
      if (cObj) {
         let country = cObj.name;
         let city = parts.slice(0, parts.length - 1).join(', ');
         if (countryMap.has(city.toLowerCase())) {
             let temp = country;
             country = countryMap.get(city.toLowerCase())!.name;
             city = temp;
         }
         return { continent: getContinentByCountry(cObj), country, city };
      }
      
      // Check if any part is a known city
      for (const part of parts) {
         let p = part.toLowerCase();
         let cityObj = cityMap.get(p);
         if (cityObj) {
            let countryObj = Country.getCountryByCode(cityObj.countryCode);
            if (countryObj) return { continent: getContinentByCountry(countryObj), country: countryObj.name, city: cityObj.name };
         }
      }
    }
    
    if (!single) return { continent: 'Other', country: 'Other', city: '' };
    
    let cObj = countryMap.get(singleLower);
    if (cObj) return { continent: getContinentByCountry(cObj), country: cObj.name, city: '' };
    
    let cityObj = cityMap.get(singleLower);
    if (cityObj) {
       let countryObj = Country.getCountryByCode(cityObj.countryCode);
       if (countryObj) return { continent: getContinentByCountry(countryObj), country: countryObj.name, city: single };
    }
    
    if (['europe', 'emea', 'eu'].includes(singleLower)) return { continent: 'Europe', country: 'Europe', city: '' };
    if (['asia', 'apac'].includes(singleLower)) return { continent: 'Asia', country: 'Asia', city: '' };
    if (['americas'].includes(singleLower)) return { continent: 'Americas', country: 'Americas', city: '' };
    if (singleLower.includes('remote')) return { continent: 'Remote / Global', country: 'Remote / Global', city: single };

    return { continent: getContinent(single), country: single, city: '' };
};
`;

const insertIndex = code.indexOf('const app = express();');
let newCode = code.slice(0, insertIndex) + locationParserLogic + '\n' + code.slice(insertIndex);

// Find where uniqueJobs are populated to inject parsed_location
const mapStart = newCode.indexOf('for (const job of allJobs) {');
const mapEnd = newCode.indexOf('// Update cache');

const newMapLoop = `
      for (const job of allJobs) {
        if (!seenIds.has(job.id)) {
          seenIds.add(job.id);
          job.parsed_location = parseLocation(job.candidate_required_location);
          uniqueJobs.push(job);
        }
      }
      
`;

newCode = newCode.slice(0, mapStart) + newMapLoop + newCode.slice(mapEnd);

fs.writeFileSync('server.ts', newCode);
console.log('Done');
