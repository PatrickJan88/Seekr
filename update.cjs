const fs = require('fs');

const file = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

const newParse = `
  const getContinent = (country: string) => {
    const eu = ['germany', 'united kingdom', 'france', 'spain', 'italy', 'netherlands', 'poland', 'sweden', 'switzerland', 'ireland', 'belgium', 'austria', 'denmark', 'finland', 'norway', 'portugal', 'romania', 'czechia', 'greece', 'hungary', 'estonia', 'latvia', 'lithuania', 'uk', 'bulgaria', 'croatia', 'slovakia', 'slovenia', 'luxembourg', 'malta', 'cyprus', 'iceland', 'serbia', 'ukraine', 'england', 'northern ireland', 'scotland', 'wales'];
    const na = ['united states', 'canada', 'mexico', 'us', 'usa', 'america', 'americas'];
    const as = ['india', 'japan', 'singapore', 'china', 'south korea', 'israel', 'united arab emirates', 'philippines', 'malaysia', 'indonesia', 'vietnam', 'thailand', 'taiwan', 'hong kong', 'pakistan', 'bangladesh', 'sri lanka', 'saudi arabia', 'turkey', 'asia'];
    const sa = ['brazil', 'argentina', 'colombia', 'chile', 'peru', 'venezuela', 'ecuador', 'bolivia', 'paraguay', 'uruguay', 'south america'];
    const oc = ['australia', 'new zealand', 'fiji', 'oceania'];
    const af = ['south africa', 'nigeria', 'kenya', 'egypt', 'morocco', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'africa'];

    const c = country.toLowerCase();
    if (['europe', 'emea', 'eu', 'dach'].includes(c)) return 'Europe';
    if (['asia', 'apac'].includes(c)) return 'Asia';
    if (['north america', 'na'].includes(c)) return 'North America';
    if (['south america', 'latam'].includes(c)) return 'South America';
    if (['africa'].includes(c)) return 'Africa';
    if (['oceania', 'australasia'].includes(c)) return 'Oceania';
    
    if (eu.includes(c)) return 'Europe';
    if (na.includes(c)) return 'North America';
    if (as.includes(c)) return 'Asia';
    if (sa.includes(c)) return 'South America';
    if (oc.includes(c)) return 'Oceania';
    if (af.includes(c)) return 'Africa';
    if (c.includes('remote') || c.includes('global') || c.includes('anywhere')) return 'Remote / Global';
    return 'Other';
  };

  const parseLocation = (loc: string) => {
    let raw = loc || '';
    let lower = raw.toLowerCase();
    
    if (!raw || lower === 'remote' || lower === 'anywhere' || lower === 'worldwide' || lower === 'unknown' || lower === 'homeoffice' || lower.includes('remote job')) {
      return { continent: 'Remote / Global', country: 'Remote / Global', city: '' };
    }
    
    // Explicit overrides for completely messy strings
    if (lower.includes('europe, emea, uk, germany, france, european timezones')) {
        return { continent: 'Europe', country: 'Multiple Locations', city: 'Europe (Multiple)' };
    }
    if (lower.includes('northern america, europe, uk, france, european timezones')) {
        return { continent: 'Multiple Continents', country: 'Multiple Locations', city: 'US & Europe' };
    }
    if (lower.includes('usa, canada, usa timezones')) {
        return { continent: 'North America', country: 'Multiple Locations', city: 'US & Canada' };
    }
    if (lower.includes('americas, europe, asia, africa, oceania')) {
        return { continent: 'Remote / Global', country: 'Remote / Global', city: 'Worldwide' };
    }
    if (lower.includes('americas, europe, israel')) {
        return { continent: 'Multiple Continents', country: 'Multiple Locations', city: 'Americas, Europe, Israel' };
    }
    if (lower.includes('mobiles arbeiten - deutschland') || lower.includes('deutschlandweit')) {
        return { continent: 'Europe', country: 'Germany', city: 'Germany (Remote)' };
    }

    // Clean up flags and common suffixes
    raw = raw.replace(/[\\uD83C][\\uDDE6-\\uDDFF][\\uD83C][\\uDDE6-\\uDDFF]/g, '').trim(); 
    raw = raw.replace(/\\([^)]+\\)/g, '').trim();
    raw = raw.replace(/\\bHQ\\b/gi, '').trim();
    raw = raw.replace(/\\boffice\\b/gi, '').trim(); 
    raw = raw.replace(/\\bhybrid\\b/gi, '').trim(); 
    raw = raw.replace(/^-|-$/g, '').trim(); 
    
    // Normalize delimiters
    if (raw.includes(';') || raw.includes('/')) {
       return { continent: 'Multiple Continents', country: 'Multiple Locations', city: raw };
    }

    let parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    
    // Clean parts
    let single = parts[0] || '';
    let singleLower = single.toLowerCase();
    
    // Fallbacks for known cities
    const knownCities: Record<string, string> = {
      'berlin': 'Germany',
      'munich': 'Germany',
      'münchen': 'Germany',
      'hamburg': 'Germany',
      'frankfurt': 'Germany',
      'augsburg': 'Germany',
      'cologne': 'Germany',
      'köln': 'Germany',
      'dusseldorf': 'Germany',
      'düsseldorf': 'Germany',
      'stuttgart': 'Germany',
      'leipzig': 'Germany',
      'dresden': 'Germany',
      'freiburg': 'Germany',
      'garching': 'Germany',
      'recklinghausen': 'Germany',
      'london': 'United Kingdom',
      'manchester': 'United Kingdom',
      'belfast': 'United Kingdom',
      'edinburgh': 'United Kingdom',
      'bristol': 'United Kingdom',
      'basingstoke': 'United Kingdom',
      'keynsham': 'United Kingdom',
      'milton keynes': 'United Kingdom',
      'marlow': 'United Kingdom',
      'paris': 'France',
      'new york': 'United States',
      'san francisco': 'United States',
      'amsterdam': 'Netherlands',
      'toronto': 'Canada'
    };

    if (parts.length >= 2) {
      let potentialCountry = parts[parts.length - 1];
      let potentialCountryLower = potentialCountry.toLowerCase();
      
      if (['deutschland', 'de', 'bavaria', 'bayern', 'brandenburg', 'nordrhein-westfalen', 'germany'].includes(potentialCountryLower)) {
          potentialCountry = 'Germany';
      }
      if (['uk', 'england', 'northern ireland', 'scotland', 'wales', 'united kingdom'].includes(potentialCountryLower)) {
          potentialCountry = 'United Kingdom';
      }
      if (['us', 'usa', 'united states'].includes(potentialCountryLower)) {
          potentialCountry = 'United States';
      }
      
      let country = potentialCountry;
      let city = parts.slice(0, parts.length - 1).join(', ');
      
      if (['germany', 'deutschland'].includes(city.toLowerCase())) {
         country = 'Germany';
         city = potentialCountry;
      }
      
      if (country !== potentialCountry) {
         return { continent: getContinent(country), country, city };
      }
      
      for (const [kcity, kcountry] of Object.entries(knownCities)) {
          if (city.toLowerCase().includes(kcity)) {
             return { continent: getContinent(kcountry), country: kcountry, city };
          }
      }
      
      return { continent: getContinent(country), country, city };
    }
    
    if (!single) return { continent: 'Other', country: 'Other', city: '' };
    
    if (['europe', 'emea', 'eu'].includes(singleLower)) return { continent: 'Europe', country: 'Europe', city: '' };
    if (['asia', 'apac'].includes(singleLower)) return { continent: 'Asia', country: 'Asia', city: '' };
    if (['americas'].includes(singleLower)) return { continent: 'North America', country: 'Americas', city: '' };
    if (singleLower.includes('remote')) return { continent: 'Remote / Global', country: 'Remote / Global', city: single };

    if (['usa', 'us', 'united states', 'uk', 'united kingdom', 'germany', 'france', 'spain', 'italy', 'canada', 'australia', 'india', 'netherlands'].includes(singleLower)) {
       if (singleLower === 'us' || singleLower === 'usa') single = 'United States';
       if (singleLower === 'uk') single = 'United Kingdom';
       return { continent: getContinent(single), country: single, city: '' };
    }
    
    for (const [city, country] of Object.entries(knownCities)) {
       if (singleLower.includes(city)) {
          return { continent: getContinent(country), country, city: single };
       }
    }
    
    return { continent: getContinent(single), country: single, city: '' };
  };
`;

const startIndex = file.indexOf('const getContinent = (country: string) => {');
const endIndex = file.indexOf('const locationTree = React.useMemo(() => {');

const newContent = file.substring(0, startIndex) + newParse.trim() + '\n\n  // Extract unique locations in a tree: Continent -> Country -> City\n  ' + file.substring(endIndex);

fs.writeFileSync('src/components/GlobalMarket.tsx', newContent);
