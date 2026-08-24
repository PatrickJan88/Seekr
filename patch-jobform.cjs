const fs = require('fs');
let code = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

code = code.replace(
  /interface JobFormProps \{/,
  `interface JobFormProps {\n  trackingSystem?: 'industry' | 'academic';`
);

code = code.replace(
  /export function JobForm\(\{ initialData, onSave, onCancel, onDelete, isDemo = false \}: JobFormProps\) \{/,
  `export function JobForm({ initialData, onSave, onCancel, onDelete, isDemo = false, trackingSystem = 'industry' }: JobFormProps) {`
);

code = code.replace(
  /const \[formData, setFormData\] = useState<Partial<JobApplication>>\(\s*initialData \|\| \{ status: 'Applied', company: '', position: '', appliedDate: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\] \}\s*\);/,
  `const [formData, setFormData] = useState<Partial<JobApplication>>(\n    initialData || { status: 'Applied', company: '', position: '', appliedDate: new Date().toISOString().split('T')[0], trackingSystem }\n  );`
);

// We need to change labels based on trackingSystem.
code = code.replace(
  /htmlFor="company" className="block text-\[13px\] font-semibold text-\[#121722\] mb-1\.5">Company/g,
  `htmlFor="company" className="block text-[13px] font-semibold text-[#121722] mb-1.5">{trackingSystem === 'academic' ? 'Institution / University' : 'Company'}`
);

code = code.replace(
  /htmlFor="position" className="block text-\[13px\] font-semibold text-\[#121722\] mb-1\.5">Role \/ Position/g,
  `htmlFor="position" className="block text-[13px] font-semibold text-[#121722] mb-1.5">{trackingSystem === 'academic' ? 'Academic Title / Position' : 'Role / Position'}`
);

code = code.replace(
  /htmlFor="salaryRange" className="block text-\[13px\] font-semibold text-\[#121722\] mb-1\.5">Salary \/ Compensation/g,
  `htmlFor="salaryRange" className="block text-[13px] font-semibold text-[#121722] mb-1.5">{trackingSystem === 'academic' ? 'Funding / Salary' : 'Salary / Compensation'}`
);

fs.writeFileSync('src/components/JobForm.tsx', code);
