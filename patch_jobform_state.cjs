const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

content = content.replace(
  'const [saveError, setSaveError] = useState<string | null>(null);\n  const [showConfirmDelete, setShowConfirmDelete] = useState(false);',
  'const [saveError, setSaveError] = useState<string | null>(null);'
);

fs.writeFileSync('src/components/JobForm.tsx', content);
