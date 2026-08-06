const fs = require('fs');
let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

// Also adding border-0 outline-none to the tr inside thead
content = content.replace(
  '            <tr>\n              <th',
  '            <tr className="outline-none focus:outline-none border-0">\n              <th'
);

fs.writeFileSync('src/components/ListView.tsx', content);
