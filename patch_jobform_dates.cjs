const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

content = content.replace(
  'new Date(formData.customReminderDate).toLocaleDateString()',
  'formData.customReminderDate'
).replace(
  'new Date(formData.customReminderEndDate).toLocaleDateString()',
  'formData.customReminderEndDate'
).replace(
  'new Date(formData.customReminderDate).toLocaleDateString()',
  'formData.customReminderDate'
);

fs.writeFileSync('src/components/JobForm.tsx', content);
