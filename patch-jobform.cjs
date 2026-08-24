const fs = require('fs');
let code = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

code = code.replace(
  /<label className="block text-xs font-medium text-\[#777c86\] mb-1">Company \*/g,
  `<label className="block text-xs font-medium text-[#777c86] mb-1">{trackingSystem === 'academic' ? 'Institution / University' : 'Company'} *`
);

code = code.replace(
  /<label className="block text-xs font-medium text-\[#777c86\] mb-1">Position \*/g,
  `<label className="block text-xs font-medium text-[#777c86] mb-1">{trackingSystem === 'academic' ? 'Academic Title / Position' : 'Position'} *`
);

code = code.replace(
  /Paste a job description here to automatically fill out the company, position, and notes\./g,
  `Paste a job description here to automatically fill out the {trackingSystem === 'academic' ? 'institution, title' : 'company, position'}, and notes.`
);

fs.writeFileSync('src/components/JobForm.tsx', code);
