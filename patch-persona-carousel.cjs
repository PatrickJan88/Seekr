const fs = require('fs');
let code = fs.readFileSync('src/components/PersonaOrbCarousel.tsx', 'utf8');

const academicRoles = `
export const ACADEMIC_ROLES: TechRole[] = [
  { id: 'Computer Science', label: 'Computer Science', desc: 'Focus: Algorithms, AI/ML, Systems & Theory', category: 'engineering' },
  { id: 'Life Sciences', label: 'Life Sciences', desc: 'Focus: Biology, Genetics, Bioinformatics & Medical', category: 'ai_data' },
  { id: 'Physics & Astronomy', label: 'Physics & Astronomy', desc: 'Focus: Quantum, Astrophysics, Mechanics & Particles', category: 'engineering' },
  { id: 'Mathematics', label: 'Mathematics', desc: 'Focus: Pure Math, Applied Math, Statistics & Cryptography', category: 'ai_data' },
  { id: 'Chemistry', label: 'Chemistry', desc: 'Focus: Organic, Inorganic, Physical & Materials', category: 'engineering' },
  { id: 'Engineering', label: 'Engineering', desc: 'Focus: Mechanical, Electrical, Civil & Chemical', category: 'product_design' },
  { id: 'Social Sciences', label: 'Social Sciences', desc: 'Focus: Psychology, Sociology, Economics & PoliSci', category: 'product_design' },
  { id: 'Humanities', label: 'Humanities', desc: 'Focus: History, Philosophy, Literature & Languages', category: 'product_design' },
  { id: 'Earth Sciences', label: 'Earth Sciences', desc: 'Focus: Geology, Climate, Oceanography & Env.', category: 'ai_data' },
  { id: 'Business & Management', label: 'Business & Management', desc: 'Focus: Strategy, Operations, Finance & Marketing', category: 'product_design' }
];
`;

if (!code.includes('ACADEMIC_ROLES')) {
  code = code.replace(/export const TECH_ROLES: TechRole\[\] = \[/, `${academicRoles}\nexport const TECH_ROLES: TechRole[] = [`);
}

code = code.replace(
  /export interface PersonaOrbCarouselProps \{/,
  `export interface PersonaOrbCarouselProps {\n  trackingSystem?: 'industry' | 'academic';`
);

code = code.replace(
  /export default function PersonaOrbCarousel\(\{ selectedRoleId, onSelectRole, onContinue \}: PersonaOrbCarouselProps\) \{/,
  `export default function PersonaOrbCarousel({ selectedRoleId, onSelectRole, onContinue, trackingSystem = 'industry' }: PersonaOrbCarouselProps) {`
);

code = code.replace(
  /const roles = TECH_ROLES;/,
  `const roles = trackingSystem === 'academic' ? ACADEMIC_ROLES : TECH_ROLES;`
);

fs.writeFileSync('src/components/PersonaOrbCarousel.tsx', code);
