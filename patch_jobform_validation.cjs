const fs = require('fs');
let code = fs.readFileSync('src/components/JobForm.tsx', 'utf-8');

const targetSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      if (syncCalendar && formData.nextInterviewDate) {`;

const newSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company?.trim()) {
      setSaveError("Company is required.");
      return;
    }
    if (!formData.position?.trim()) {
      setSaveError("Position is required.");
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    try {
      if (syncCalendar && formData.nextInterviewDate) {`;

code = code.replace(targetSubmit, newSubmit);

code = code.replace('<input required type="text" name="company"', '<input type="text" name="company"');
code = code.replace('<input required type="text" name="position"', '<input type="text" name="position"');

fs.writeFileSync('src/components/JobForm.tsx', code);
console.log("Patched JobForm validation");
