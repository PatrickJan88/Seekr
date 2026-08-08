const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace('  customReminderEndDate?: string;', '  customReminderEndDate?: string;\n  reminderSent?: boolean;');
fs.writeFileSync('src/types.ts', content);
