const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const jobicyFunc = `
      const fetchJobicy = async () => {
        try {
          // Fetch EMEA jobs
          const response = await fetch('https://jobicy.com/api/v2/remote-jobs?geo=emea&count=50');
          if (response.ok) {
            const data = await response.json();
            if (data.jobs && Array.isArray(data.jobs)) {
              allJobs = allJobs.concat(data.jobs.map((job: any) => ({
                id: \`jobicy-\${job.id}\`,
                url: job.url,
                title: job.jobTitle,
                company_name: job.companyName || 'Unknown',
                company_logo: job.companyLogo || '',
                category: 'software-dev', // Default mapping
                tags: job.jobIndustry || [],
                job_type: job.jobType?.[0] || 'full_time',
                publication_date: new Date().toISOString(), // Jobicy lastUpdate or fallback
                candidate_required_location: job.jobGeo || 'EMEA',
                salary: '',
                description: job.jobDescription || job.jobExcerpt || ''
              })));
            }
          }
        } catch (e) {
          console.error("Jobicy fetch error:", e);
        }
      };
`;

// Insert the function right before fetchHackerNews
code = code.replace("const fetchHackerNews = async () => {", jobicyFunc + "\n      const fetchHackerNews = async () => {");

// Add fetchJobicy() to the Promise.allSettled
code = code.replace("fetchHackerNews(),", "fetchHackerNews(),\n        fetchJobicy(),");

fs.writeFileSync('server.ts', code);
console.log('patched');
