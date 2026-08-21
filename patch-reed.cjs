const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const reedFunc = `
      const fetchReed = async () => {
        try {
          // You must provide the reed API key via env var, defaults to empty to not break if missing
          const reedKey = process.env.REED_API_KEY || "";
          if (!reedKey) return;

          // Reed requires basic auth with API key as username and empty password
          const authHeader = 'Basic ' + Buffer.from(reedKey + ':').toString('base64');
          
          const response = await fetch('https://www.reed.co.uk/api/1.0/search?keywords=developer&resultsToTake=50', {
            headers: {
              'Authorization': authHeader
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && Array.isArray(data.results)) {
              allJobs = allJobs.concat(data.results.map((job: any) => ({
                id: \`reed-\${job.jobId}\`,
                url: job.jobUrl,
                title: job.jobTitle,
                company_name: job.employerName || 'Unknown',
                company_logo: '',
                category: 'software-dev',
                tags: ['reed', 'uk'],
                job_type: job.contractType === 'Permanent' ? 'full_time' : 'contract',
                publication_date: job.date || new Date().toISOString(),
                candidate_required_location: job.locationName || 'United Kingdom',
                salary: job.minimumSalary ? \`£\${job.minimumSalary} - £\${job.maximumSalary}\` : '',
                description: job.jobDescription || ''
              })));
            }
          }
        } catch (e) {
          console.error("Reed fetch error:", e);
        }
      };
`;

code = code.replace("const fetchHackerNews = async () => {", reedFunc + "\n      const fetchHackerNews = async () => {");
code = code.replace("fetchJooble()", "fetchJooble(),\n        fetchReed()");

fs.writeFileSync('server.ts', code);
console.log('patched reed');
