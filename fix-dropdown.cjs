const fs = require('fs');

let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

const importLocations = `import locationsData from '../data/locations.json';\n`;

// We need to add getContinent to GlobalMarket.tsx
const getContinentCode = `const getContinent = (countryName: string) => {
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
};\n`;

const oldTreeCode = `  const locationTree = React.useMemo(() => {
    const tree = new Map<string, Map<string, Set<string>>>();
    jobs.forEach(job => {
      const { continent, country, city } = job.parsed_location || { continent: "Other", country: "Other", city: "" };
      if (!tree.has(continent)) tree.set(continent, new Map());
      const continentMap = tree.get(continent)!;
      if (!continentMap.has(country)) continentMap.set(country, new Set());
      if (city) continentMap.get(country)!.add(city);
    });
    return tree;
  }, [jobs]);`;

const newTreeCode = `  const locationTree = React.useMemo(() => {
    const tree = new Map<string, Map<string, Set<string>>>();
    
    // Remote option at the top
    tree.set("Remote / Global", new Map([["Remote / Global", new Set(["Remote"])]]));

    for (const [country, cities] of Object.entries(locationsData)) {
        const continent = getContinent(country);
        if (!tree.has(continent)) tree.set(continent, new Map());
        const continentMap = tree.get(continent)!;
        if (!continentMap.has(country)) continentMap.set(country, new Set());
        for (const city of (cities as string[])) {
            if (city) continentMap.get(country)!.add(city);
        }
    }
    return tree;
  }, []);`;

// Inject the getContinent code after imports
if (!code.includes(importLocations)) {
    code = code.replace(/import \{ .* \} from 'lucide-react';/, match => match + '\n' + importLocations + '\n' + getContinentCode);
}

// Replace tree logic
if (code.includes(oldTreeCode)) {
    code = code.replace(oldTreeCode, newTreeCode);
    fs.writeFileSync('src/components/GlobalMarket.tsx', code);
    console.log('patched');
} else {
    console.error('oldTreeCode not found');
}
