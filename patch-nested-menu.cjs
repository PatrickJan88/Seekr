const fs = require('fs');
let code = fs.readFileSync('src/components/NestedApplicationMenu.tsx', 'utf8');

code = code.replace(
  /export function NestedApplicationMenu\(\{ applications, onSelect, onCancel \}: NestedApplicationMenuProps\) \{/,
  `export function NestedApplicationMenu({ applications, onSelect, onCancel, trackingSystem = 'industry' }: NestedApplicationMenuProps & { trackingSystem?: 'industry' | 'academic' }) {`
);

// We should replace any "Company" or "Role" headers if they exist, but wait, NestedApplicationMenu might just render {app.company}. No headers needed.
// Does it say "Search company or role"?
code = code.replace(
  /placeholder="Search company or role\.\.\."/,
  `placeholder={trackingSystem === 'academic' ? "Search institution or title..." : "Search company or role..."}`
);

fs.writeFileSync('src/components/NestedApplicationMenu.tsx', code);
