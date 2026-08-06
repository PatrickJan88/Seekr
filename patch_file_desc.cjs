const fs = require('fs');

let fileUpload = fs.readFileSync('src/components/FileUpload.tsx', 'utf8');

fileUpload = fileUpload.replace(
  '  initialFiles?: UploadedFile[];\n}',
  '  initialFiles?: UploadedFile[];\n  description?: string;\n}'
);

fileUpload = fileUpload.replace(
  'initialFiles = [] }: FileUploadProps) {',
  'initialFiles = [], description }: FileUploadProps) {'
);

fileUpload = fileUpload.replace(
  '<p className="mt-1 text-xs text-center text-slate-500">\n              Accepted: {accept}. Max: {maxSizeMB}MB.\n            </p>',
  '<p className="mt-1 text-xs text-center text-slate-500">\n              {description || `Accepted: ${accept}. Max: ${maxSizeMB}MB.`}\n            </p>'
);

fs.writeFileSync('src/components/FileUpload.tsx', fileUpload);

let jobForm = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

jobForm = jobForm.replace(
  'accept=".pdf,.doc,.docx"',
  'accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,.csv"\n              description="Accepted: .pdf,.doc,.docx,excel,image,CSV. Max: 5MB."'
);

fs.writeFileSync('src/components/JobForm.tsx', jobForm);
