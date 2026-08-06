const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(
  /alert\('Imported successfully'\);/g,
  "toast.success('Imported successfully');"
);

content = content.replace(
  /alert\(`Successfully synced \$\{appsToImport\.length\} records from PDF!`\);/g,
  "toast.success(`Successfully synced ${appsToImport.length} records from PDF!`);"
);

content = content.replace(
  /alert\('No job applications found in PDF\.'\);/g,
  "toast.info('No job applications found in PDF.');"
);

content = content.replace(
  /alert\('Failed to sync PDF'\);/g,
  "toast.error('Failed to sync PDF');"
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
