const fs = require('fs');
let code = fs.readFileSync('src/components/PersonaOrbCarousel.tsx', 'utf8');

const insertionPoint = "export const TECH_ROLES: TechRole[] = [\n";
const newRole = `  { 
    id: 'Mobile Developer', 
    label: 'Mobile Developer', 
    desc: 'Focus: iOS (Swift), Android (Kotlin), Flutter & React Native',
    category: 'engineering'
  },\n`;

code = code.replace(insertionPoint, insertionPoint + newRole);

fs.writeFileSync('src/components/PersonaOrbCarousel.tsx', code);
