const getContinent = (country) => {
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

const parseLocation = (loc) => {
    let raw = loc || '';
    const lower = raw.toLowerCase();
    if (!raw || lower === 'remote' || lower === 'anywhere' || lower === 'worldwide' || lower === 'unknown' || lower === 'homeoffice') {
      return { continent: 'Remote / Global', country: 'Remote / Global', city: '' };
    }

    // Clean up flags and common suffixes
    raw = raw.replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '').trim(); 
    raw = raw.replace(/\([^)]+\)/g, '').trim();
    raw = raw.replace(/\bHQ\b/gi, '').trim();
    raw = raw.replace(/\boffice\b/gi, '').trim(); 
    raw = raw.replace(/\bhybrid\b/gi, '').trim(); 
    raw = raw.replace(/^-|-$/g, '').trim(); 
    
    // Normalize delimiters
    if (raw.includes(';') || raw.includes('/')) {
       return { continent: 'Other', country: 'Multiple Locations', city: raw };
    }

    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      let country = parts[parts.length - 1];
      const city = parts.slice(0, parts.length - 1).join(', ');
      
      // Fix common country names
      if (country.toLowerCase() === 'deutschland' || country.toLowerCase() === 'de') country = 'Germany';
      if (country.toLowerCase() === 'uk' || country.toLowerCase() === 'england' || country.toLowerCase() === 'northern ireland') country = 'United Kingdom';
      if (country.toLowerCase() === 'us' || country.toLowerCase() === 'usa') country = 'United States';
      
      return { continent: getContinent(country), country, city };
    }
    
    let single = parts[0] || '';
    if (!single) return { continent: 'Other', country: 'Other', city: '' };
    
    const singleLower = single.toLowerCase();
    
    if (['europe', 'emea', 'eu'].includes(singleLower)) return { continent: 'Europe', country: 'Europe', city: '' };
    if (['asia', 'apac'].includes(singleLower)) return { continent: 'Asia', country: 'Asia', city: '' };
    if (['americas'].includes(singleLower)) return { continent: 'North America', country: 'Americas', city: '' };
    if (singleLower.includes('remote')) return { continent: 'Remote / Global', country: 'Remote / Global', city: single };

    if (['usa', 'us', 'united states', 'uk', 'united kingdom', 'germany', 'france', 'spain', 'italy', 'canada', 'australia', 'india', 'netherlands'].includes(singleLower)) {
       if (singleLower === 'us' || singleLower === 'usa') single = 'United States';
       if (singleLower === 'uk') single = 'United Kingdom';
       return { continent: getContinent(single), country: single, city: '' };
    }
    
    const knownCities = {
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
      'london': 'United Kingdom',
      'manchester': 'United Kingdom',
      'belfast': 'United Kingdom',
      'edinburgh': 'United Kingdom',
      'bristol': 'United Kingdom',
      'paris': 'France',
      'new york': 'United States',
      'san francisco': 'United States',
      'amsterdam': 'Netherlands',
      'toronto': 'Canada'
    };
    
    for (const [city, country] of Object.entries(knownCities)) {
       if (singleLower.includes(city)) {
          return { continent: getContinent(country), country, city: single };
       }
    }
    
    return { continent: getContinent(single), country: single, city: '' };
};

fetch('http://localhost:3000/api/market-jobs')
  .then(res => res.json())
  .then(data => {
    const locs = data.jobs.map(j => j.candidate_required_location);
    const unique = Array.from(new Set(locs)).sort();
    unique.forEach(u => {
        console.log(`Raw: "${u}" ->`, parseLocation(u));
    });
  })
  .catch(console.error);
