const fs = require('fs');

const file = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

const startIndex = file.indexOf('const getContinent = (country: string) => {');
const endIndex = file.indexOf('const locationTree = React.useMemo(() => {');

// Remove getContinent and parseLocation
let newContent = file.slice(0, startIndex) + file.slice(endIndex);

// Replace parseLocation usage
newContent = newContent.replace(
  'const { continent, country, city } = parseLocation(job.candidate_required_location);',
  'const { continent, country, city } = job.parsed_location || { continent: "Other", country: "Other", city: "" };'
);

newContent = newContent.replace(
  'const { continent, country, city } = parseLocation(job.candidate_required_location);',
  'const { continent, country, city } = job.parsed_location || { continent: "Other", country: "Other", city: "" };'
);

fs.writeFileSync('src/components/GlobalMarket.tsx', newContent);
console.log('Done');
