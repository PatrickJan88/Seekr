const fs = require('fs');

let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

content = content.replace(
  "import { Calendar, Building, MoreVertical, Eye, ChevronDown } from 'lucide-react';",
  "import { Calendar, Building, MoreVertical, Eye, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';"
);

fs.writeFileSync('src/components/ListView.tsx', content);
