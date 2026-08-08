const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

content = content.replace(
  'type="datetime-local" name="customReminderDate" value={formData.customReminderDate?.slice(0, 16) || \'\'}',
  'type="date" name="customReminderDate" value={formData.customReminderDate?.split(\'T\')[0] || \'\'}'
);

content = content.replace(
  'new Date(formData.customReminderDate).toLocaleString()',
  'new Date(formData.customReminderDate).toLocaleDateString()'
);

fs.writeFileSync('src/components/JobForm.tsx', content);
