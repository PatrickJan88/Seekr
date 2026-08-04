const fs = require('fs');
let code = fs.readFileSync('src/components/JobForm.tsx', 'utf-8');

code = code.replace(`const STATUSES: JobStatus[] = ['Saved', 'Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];`, `const STATUSES: JobStatus[] = ['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];`);
code = code.replace(`value={formData.status || 'Saved'}`, `value={formData.status || 'Applied'}`);

fs.writeFileSync('src/components/JobForm.tsx', code);
console.log("Patched JobForm");
