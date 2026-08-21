const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldRemotive = `            if (response.ok) {
              const data = await response.json();
              if (data.jobs && Array.isArray(data.jobs)) {
                allJobs = allJobs.concat(data.jobs.map((job: any) => ({
                  ...job,
                  id: \`remotive-\${job.id}\`
                })));
              }
            }`;

const newRemotive = `            if (response.ok) {
              const data = await response.json();
              if (data.jobs && Array.isArray(data.jobs)) {
                // Focus: Specifically for remote tech jobs in Europe or UK
                const filteredJobs = data.jobs.filter((job: any) => {
                  const loc = (job.candidate_required_location || '').toLowerCase();
                  return loc.includes('europe') || loc.includes('uk') || loc.includes('emea') || loc.includes('worldwide') || loc.includes('global') || loc.includes('anywhere');
                });
                
                allJobs = allJobs.concat(filteredJobs.map((job: any) => ({
                  ...job,
                  id: \`remotive-\${job.id}\`
                })));
              }
            }`;

if (code.includes(oldRemotive)) {
    code = code.replace(oldRemotive, newRemotive);
    fs.writeFileSync('server.ts', code);
    console.log('patched remotive');
} else {
    console.log('remotive regex failed');
}
