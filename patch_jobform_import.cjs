const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

content = content.replace(
  "import { Wand2, Loader2, X } from 'lucide-react';",
  "import { Wand2, Loader2, X } from 'lucide-react';\nimport { FileUpload } from './FileUpload';"
);

fs.writeFileSync('src/components/JobForm.tsx', content);
