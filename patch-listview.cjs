const fs = require('fs');
let code = fs.readFileSync('src/components/ListView.tsx', 'utf8');

code = code.replace(
  /export function ListView\(\{ applications, onEdit, onDelete, locationFilter \}: ListViewProps\) \{/,
  `export function ListView({ applications, onEdit, onDelete, locationFilter, trackingSystem = 'industry' }: ListViewProps & { trackingSystem?: 'industry' | 'academic' }) {`
);

code = code.replace(
  /<div className="flex items-center">Company \{getSortIcon\('company'\)\}<\/div>/g,
  `<div className="flex items-center">{trackingSystem === 'academic' ? 'Institution' : 'Company'} {getSortIcon('company')}</div>`
);

code = code.replace(
  /<div className="flex items-center">Role \{getSortIcon\('position'\)\}<\/div>/g,
  `<div className="flex items-center">{trackingSystem === 'academic' ? 'Title' : 'Role'} {getSortIcon('position')}</div>`
);

fs.writeFileSync('src/components/ListView.tsx', code);
