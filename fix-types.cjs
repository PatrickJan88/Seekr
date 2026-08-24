const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
if (!code.includes('trackingSystem?:')) {
  code = code.replace(
    /updatedAt: number;\n\}/,
    `updatedAt: number;\n  trackingSystem?: 'industry' | 'academic';\n}`
  );
  fs.writeFileSync('src/types.ts', code);
}
