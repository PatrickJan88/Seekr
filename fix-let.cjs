const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/let allJobs: any\[\] = \[\];\s*let allJobs: any\[\] = \[\];/g, 'let allJobs: any[] = [];');

fs.writeFileSync('server.ts', code);
