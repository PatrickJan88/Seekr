const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

code = code.replace(/let st = app\.status;/, "let st: string = app.status;");

fs.writeFileSync('src/components/Dashboard.tsx', code);
