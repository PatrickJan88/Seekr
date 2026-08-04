const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/"status": "Applied" \| "Interviewing" \| "Offer" \| "Rejected"/g, '"status": "Saved" | "Applied" | "Screening" | "Technical" | "Final" | "Offer" | "Rejected" | "Ghosted"');
fs.writeFileSync('server.ts', code);
console.log("Patched server.ts statuses");
