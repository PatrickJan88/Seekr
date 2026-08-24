const fs = require('fs');
let code = fs.readFileSync('src/components/PersonaOrbCarousel.tsx', 'utf8');

const insertionPoint = "export const TECH_ROLES: TechRole[] = [\n";
const newRole = `  { 
    id: 'Game Developer', 
    label: 'Game Developer', 
    desc: 'Focus: Unity, Unreal Engine, Godot, Custom Engines & Graphics APIs',
    category: 'engineering'
  },\n`;

code = code.replace(insertionPoint, insertionPoint + newRole);

fs.writeFileSync('src/components/PersonaOrbCarousel.tsx', code);
