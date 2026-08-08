const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace('  customReminderDate?: string;', '  customReminderDate?: string;\n  customReminderEndDate?: string;');

fs.writeFileSync('src/types.ts', content);
