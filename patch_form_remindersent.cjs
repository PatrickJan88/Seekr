const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');
content = content.replace('await onSave(formData);', 'await onSave({ ...formData, reminderSent: false });');
fs.writeFileSync('src/components/JobForm.tsx', content);
