const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const adzunaFunc = `
      const fetchAdzuna = async () => {
        try {
          const appId = process.env.ADZUNA_APP_ID || "bbb9bf36";
          const appKey = process.env.ADZUNA_APP_KEY || "912639b735ecfa6e7699135fbc31a469";
          const countries = ['gb', 'de', 'fr', 'nl', 'it', 'es', 'pl'];
          
          for (const country of countries) {
            const response = await fetch(\`https://api.adzuna.com/v1/api/jobs/\${country}/search/1?app_id=\${appId}&app_key=\${appKey}&results_per_page=10&what=developer\`);
            
            if (response.ok) {
              const data = await response.json();
              if (data.results && Array.isArray(data.results)) {
                allJobs = allJobs.concat(data.results.map((job: any) => ({
                  id: \`adzuna-\${job.id}\`,
                  url: job.redirect_url,
                  title: job.title,
                  company_name: job.company?.display_name || 'Unknown',
                  company_logo: '',
                  category: 'software-dev',
                  tags: ['adzuna', 'europe'],
                  job_type: job.contract_type || 'full_time',
                  publication_date: job.created || new Date().toISOString(),
                  candidate_required_location: job.location?.display_name || 'Europe',
                  salary: job.salary_min ? \`\${job.salary_min} - \${job.salary_max}\` : '',
                  description: job.description || ''
                })));
              }
            }
          }
        } catch (e) {
          console.error("Adzuna fetch error:", e);
        }
      };
`;

code = code.replace("const fetchHackerNews = async () => {", adzunaFunc + "\n      const fetchHackerNews = async () => {");
code = code.replace("fetchHackerNews(),", "fetchHackerNews(),\n        fetchAdzuna(),");

fs.writeFileSync('server.ts', code);
console.log('patched adzuna');
