const fs = require('fs');
let code = fs.readFileSync('src/components/JobForm.tsx', 'utf-8');

const targetSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company?.trim()) {`;

const newSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form data", formData);
    
    if (!formData.company?.trim()) {`;

code = code.replace(targetSubmit, newSubmit);

const targetCatch = `    } catch (err: any) {
      setSaveError(err.message || 'Failed to save application');
    } finally {`;

const newCatch = `    } catch (err: any) {
      console.error("Save Error Caught:", err);
      setSaveError(err.message || 'Failed to save application');
    } finally {`;

code = code.replace(targetCatch, newCatch);

fs.writeFileSync('src/components/JobForm.tsx', code);
console.log("Patched JobForm logs");
