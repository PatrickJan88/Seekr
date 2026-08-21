const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const importRegex = /import \{ getCountries, getAllCitiesInWorld \} from '@countrystatecity\/countries';/;
code = code.replace(importRegex, "import fs from 'fs';\nimport path from 'path';");

const setupRegex = /const allCountries = await getCountries\(\);[\s\S]*?cityMap\.set\('köln', cityMap\.get\('cologne'\)\);/m;

const newSetup = `const locationsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'locations.json'), 'utf8'));

const countryMap = new Map<string, string>();
const cityMap = new Map<string, { city: string, country: string }>();

for (const [country, cities] of Object.entries(locationsData)) {
    countryMap.set(country.toLowerCase(), country);
    for (const city of (cities as string[])) {
        const key = city.toLowerCase();
        if (!cityMap.has(key)) {
            cityMap.set(key, { city, country });
        }
    }
}
countryMap.set('usa', countryMap.get('united states')!);
countryMap.set('us', countryMap.get('united states')!);
countryMap.set('uk', countryMap.get('united kingdom')!);
countryMap.set('england', countryMap.get('united kingdom')!);
countryMap.set('northern ireland', countryMap.get('united kingdom')!);
countryMap.set('scotland', countryMap.get('united kingdom')!);
countryMap.set('wales', countryMap.get('united kingdom')!);
countryMap.set('deutschland', countryMap.get('germany')!);
countryMap.set('de', countryMap.get('germany')!);

cityMap.set('london', { city: 'London', country: 'United Kingdom' });
cityMap.set('paris', { city: 'Paris', country: 'France' });
cityMap.set('berlin', { city: 'Berlin', country: 'Germany' });
cityMap.set('belfast', { city: 'Belfast', country: 'United Kingdom' });
cityMap.set('edinburgh', { city: 'Edinburgh', country: 'United Kingdom' });
cityMap.set('new york', { city: 'New York', country: 'United States' });
cityMap.set('san francisco', { city: 'San Francisco', country: 'United States' });
cityMap.set('amsterdam', { city: 'Amsterdam', country: 'Netherlands' });
cityMap.set('toronto', { city: 'Toronto', country: 'Canada' });
if (cityMap.has('munich')) cityMap.set('münchen', cityMap.get('munich')!);
if (cityMap.has('cologne')) cityMap.set('köln', cityMap.get('cologne')!);`;

if (code.match(setupRegex)) {
    code = code.replace(setupRegex, newSetup);
} else {
    console.error("Setup regex failed");
}

const parseRegex = /const getContinentByCountry = \([\s\S]*?const parseLocation = \(loc: string\) => \{/m;

const newParseRegex = `const getContinent = (countryName: string) => {
    if (!countryName) return 'Other';
    const cLower = countryName.toLowerCase();
    
    const europe = ['united kingdom', 'germany', 'france', 'spain', 'italy', 'netherlands', 'sweden', 'norway', 'denmark', 'finland', 'ireland', 'switzerland', 'belgium', 'austria', 'poland', 'portugal', 'greece', 'czech republic', 'romania', 'hungary', 'ukraine', 'russia', 'bulgaria', 'serbia', 'slovakia', 'croatia', 'lithuania', 'slovenia', 'latvia', 'estonia', 'cyprus', 'luxembourg', 'malta', 'iceland', 'andorra', 'monaco', 'liechtenstein', 'san marino'];
    const americas = ['united states', 'canada', 'brazil', 'mexico', 'argentina', 'colombia', 'chile', 'peru', 'cuba', 'venezuela', 'ecuador', 'guatemala', 'bolivia', 'haiti', 'dominican republic', 'honduras', 'paraguay', 'nicaragua', 'el salvador', 'costa rica', 'panama', 'uruguay', 'jamaica', 'trinidad and tobago', 'bahamas', 'belize', 'barbados', 'saint lucia', 'grenada', 'saint vincent and the grenadines', 'antigua and barbuda', 'dominica', 'saint kitts and nevis'];
    const asia = ['china', 'india', 'japan', 'south korea', 'indonesia', 'pakistan', 'bangladesh', 'philippines', 'vietnam', 'turkey', 'iran', 'thailand', 'myanmar', 'iraq', 'afghanistan', 'saudi arabia', 'uzbekistan', 'malaysia', 'yemen', 'nepal', 'north korea', 'sri lanka', 'kazakhstan', 'syria', 'cambodia', 'jordan', 'azerbaijan', 'united arab emirates', 'tajikistan', 'israel', 'laos', 'lebanon', 'kyrgyzstan', 'turkmenistan', 'singapore', 'oman', 'state of palestine', 'kuwait', 'georgia', 'mongolia', 'armenia', 'qatar', 'bahrain', 'timor-leste', 'cyprus', 'bhutan', 'maldives', 'brunei', 'taiwan', 'hong kong', 'macau'];
    const oceania = ['australia', 'papua new guinea', 'new zealand', 'fiji', 'solomon islands', 'micronesia', 'vanuatu', 'samoa', 'kiribati', 'tonga', 'marshall islands', 'palau', 'tuvalu', 'nauru'];
    const africa = ['nigeria', 'ethiopia', 'egypt', 'democratic republic of the congo', 'tanzania', 'south africa', 'kenya', 'uganda', 'algeria', 'sudan', 'morocco', 'angola', 'mozambique', 'ghana', 'madagascar', 'cameroon', 'cote d\\'ivoire', 'niger', 'burkina faso', 'mali', 'malawi', 'zambia', 'senegal', 'chad', 'somalia', 'zimbabwe', 'guinea', 'rwanda', 'benin', 'burundi', 'tunisia', 'south sudan', 'togo', 'sierra leone', 'libya', 'congo', 'liberia', 'central african republic', 'mauritania', 'eritrea', 'namibia', 'gambia', 'botswana', 'gabon', 'lesotho', 'guinea-bissau', 'equatorial guinea', 'mauritius', 'eswatini', 'djibouti', 'comoros', 'cabo verde', 'sao tome and principe', 'seychelles'];

    if (europe.includes(cLower) || ['europe', 'emea', 'eu', 'dach'].includes(cLower)) return 'Europe';
    if (asia.includes(cLower) || ['asia', 'apac'].includes(cLower)) return 'Asia';
    if (americas.includes(cLower) || ['americas', 'north america', 'south america', 'latam', 'na', 'usa'].includes(cLower)) return 'Americas';
    if (africa.includes(cLower) || ['africa'].includes(cLower)) return 'Africa';
    if (oceania.includes(cLower) || ['oceania', 'australasia'].includes(cLower)) return 'Oceania';
    if (cLower.includes('remote') || cLower.includes('global')) return 'Remote / Global';

    return 'Other';
};

const parseLocation = (loc: string) => {`;

if (code.match(parseRegex)) {
    code = code.replace(parseRegex, newParseRegex);
} else {
    console.error("Parse regex failed");
}


const insideParseRegex = /if \(parts\.length >= 2\) \{[\s\S]*?return \{ continent: getContinent\(single\), country: single, city: '' \};\n\}/m;

const newInsideParse = `if (parts.length >= 2) {
      let potentialCountry = parts[parts.length - 1];
      let pLower = potentialCountry.toLowerCase();
      let cName = countryMap.get(pLower);
      if (cName) {
         let country = cName;
         let city = parts.slice(0, parts.length - 1).join(', ');
         if (countryMap.has(city.toLowerCase())) {
             let temp = country;
             country = countryMap.get(city.toLowerCase())!;
             city = temp;
         }
         return { continent: getContinent(country), country, city };
      }
      
      // Check if any part is a known city
      for (const part of parts) {
         let p = part.toLowerCase();
         let cityObj = cityMap.get(p);
         if (cityObj) {
            let countryName = cityObj.country;
            if (countryName) return { continent: getContinent(countryName), country: countryName, city: cityObj.city };
         }
      }
    }
    
    if (!single) return { continent: 'Other', country: 'Other', city: '' };
    
    let cName = countryMap.get(singleLower);
    if (cName) return { continent: getContinent(cName), country: cName, city: '' };
    
    let cityObj = cityMap.get(singleLower);
    if (cityObj) {
       let countryName = cityObj.country;
       if (countryName) return { continent: getContinent(countryName), country: countryName, city: cityObj.city };
    }
    
    if (['europe', 'emea', 'eu'].includes(singleLower)) return { continent: 'Europe', country: 'Europe', city: '' };
    if (['asia', 'apac'].includes(singleLower)) return { continent: 'Asia', country: 'Asia', city: '' };
    if (['americas'].includes(singleLower)) return { continent: 'Americas', country: 'Americas', city: '' };
    if (singleLower.includes('remote')) return { continent: 'Remote / Global', country: 'Remote / Global', city: single };

    return { continent: getContinent(single), country: single, city: '' };
}`;

if (code.match(insideParseRegex)) {
    code = code.replace(insideParseRegex, newInsideParse);
} else {
    console.error("Inside parse regex failed");
}

fs.writeFileSync('server.ts', code);
console.log('patched');
