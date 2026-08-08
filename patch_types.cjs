const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace('  reminder?: string;', '  reminder?: string;\n  customReminderDate?: string;');

fs.writeFileSync('src/types.ts', content);
