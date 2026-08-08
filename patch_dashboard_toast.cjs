const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const oldMsg = `            if (app.reminder !== 'custom') {
               msg = \`Upcoming interview with \${app.company} in \${app.reminder}\`;
            } else {
               msg = \`Reminder: Interview with \${app.company} is scheduled on \${new Date(app.nextInterviewDate).toLocaleDateString()}\`;
            }`;

const newMsg = `            if (app.reminder !== 'custom') {
               msg = \`Next interview with \${app.company} will begin in \${app.reminder} today\`;
            } else {
               msg = \`Reminder: Interview with \${app.company} is scheduled on \${new Date(app.nextInterviewDate).toLocaleDateString()}\`;
            }`;

content = content.replace(oldMsg, newMsg);

fs.writeFileSync('src/components/Dashboard.tsx', content);
