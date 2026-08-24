const fs = require('fs');
let code = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');

code = code.replace(
  /export function CVMatchAssessment\(\{ applications, onAddToWishlist, onViewHistory, setNestedBreadcrumb \}: CVMatchAssessmentProps\) \{/,
  `export function CVMatchAssessment({ applications, onAddToWishlist, onViewHistory, setNestedBreadcrumb, trackingSystem = 'industry' }: CVMatchAssessmentProps & { trackingSystem?: 'industry' | 'academic' }) {`
);

code = code.replace(
  /<PersonaOrbCarousel\s*selectedRoleId=\{targetRole\}\s*onSelectRole=\{\(roleId\) => setTargetRole\(roleId\)\}\s*onContinue=\{\(\) => setCurrentStep\(2\)\}\s*\/>/,
  `<PersonaOrbCarousel\n                  selectedRoleId={targetRole}\n                  onSelectRole={(roleId) => setTargetRole(roleId)}\n                  onContinue={() => setCurrentStep(2)}\n                  trackingSystem={trackingSystem}\n                />`
);

fs.writeFileSync('src/components/CVMatchAssessment.tsx', code);
