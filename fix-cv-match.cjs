const fs = require('fs');
let code = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');

code = code.replace(
  /const \[jobDescription,\n\s*trackingSystem, setJobDescription\] = useState/,
  `const [jobDescription, setJobDescription] = useState`
);

fs.writeFileSync('src/components/CVMatchAssessment.tsx', code);
