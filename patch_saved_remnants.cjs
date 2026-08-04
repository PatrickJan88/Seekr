const fs = require('fs');

let jobFormCode = fs.readFileSync('src/components/JobForm.tsx', 'utf-8');
jobFormCode = jobFormCode.replace(`initialData || { status: 'Saved', company: '', position: '', appliedDate: new Date().toISOString().split('T')[0] }`, `initialData || { status: 'Applied', company: '', position: '', appliedDate: new Date().toISOString().split('T')[0] }`);
fs.writeFileSync('src/components/JobForm.tsx', jobFormCode);

let dashboardCode = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');
dashboardCode = dashboardCode.replace(`status: row.Status || row.status || 'Saved',`, `status: row.Status || row.status || 'Applied',`);
fs.writeFileSync('src/components/Dashboard.tsx', dashboardCode);

console.log("Patched saved remnants");
