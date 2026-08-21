const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const updatedJoobleFunc = `
      const fetchJooble = async () => {
        try {
          const joobleKey = process.env.JOOBLE_API_KEY || "f5932433-ee6c-4433-bef6-10585e0b7606";
          const queries = ['developer', 'software engineer', 'product manager', 'designer', 'data'];
          
          for (const query of queries) {
            const response = await fetch(\`https://jooble.org/api/\${joobleKey}\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keywords: query, location: 'Europe' })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.jobs && Array.isArray(data.jobs)) {
                allJobs = allJobs.concat(data.jobs.map((job: any) => ({
                  id: \`jooble-\${job.id}\`,
                  url: job.link,
                  title: job.title,
                  company_name: job.company || 'Unknown',
                  company_logo: '',
                  category: query === 'designer' ? 'design' : (query === 'data' ? 'data' : (query === 'product manager' ? 'product' : 'software-dev')),
                  tags: ['jooble', 'europe'],
                  job_type: job.type || 'full_time',
                  publication_date: job.updated ? new Date(job.updated).toISOString() : new Date().toISOString(),
                  candidate_required_location: job.location || 'Unknown',
                  salary: job.salary || '',
                  description: job.snippet || ''
                })));
              }
            }
          }
        } catch (e) {
          console.error("Jooble fetch error:", e);
        }
      };
`;

const oldJoobleFuncRegex = /const fetchJooble = async \(\) => \{[\s\S]*?console\.error\("Jooble fetch error:", e\);\n        \}\n      \};/;
if (code.match(oldJoobleFuncRegex)) {
  code = code.replace(oldJoobleFuncRegex, updatedJoobleFunc.trim());
  fs.writeFileSync('server.ts', code);
  console.log('patched again');
} else {
  console.log('regex failed');
}

