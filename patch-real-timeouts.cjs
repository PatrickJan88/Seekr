const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const fetchRegex1 = /fetch\(\`([^`]+)\`\)/g;
const fetchRegex2 = /fetch\('([^']+)'\)/g;
const fetchRegex3 = /fetch\(\`([^`]+)\`,\s*\{/g;
const fetchRegex4 = /fetch\('([^']+)',\s*\{/g;

code = code.replace(/fetch\(\`https:\/\/remotive\.com[^\`]+\`\)/g, match => match.replace(')', ', { signal: AbortSignal.timeout(5000) })'));
code = code.replace(/fetch\('https:\/\/www\.arbeitnow\.com[^']+'\)/g, match => match.replace(')', ', { signal: AbortSignal.timeout(5000) })'));
code = code.replace(/fetch\(\`https:\/\/jooble\.org[^\`]+\`,\s*\{/g, match => match + " signal: AbortSignal.timeout(5000), ");
code = code.replace(/fetch\('https:\/\/jobicy\.com[^']+'\)/g, match => match.replace(')', ', { signal: AbortSignal.timeout(5000) })'));
code = code.replace(/fetch\(\`https:\/\/api\.adzuna\.com[^\`]+\`\)/g, match => match.replace(')', ', { signal: AbortSignal.timeout(5000) })'));
code = code.replace(/fetch\('https:\/\/www\.reed\.co\.uk[^']+',\s*\{/g, match => match + " signal: AbortSignal.timeout(5000), ");
code = code.replace(/fetch\('https:\/\/hacker-news\.firebaseio\.com[^']+'\)/g, match => match.replace(')', ', { signal: AbortSignal.timeout(5000) })'));
code = code.replace(/fetch\(\`https:\/\/hacker-news\.firebaseio\.com[^\`]+\`\)/g, match => match.replace(')', ', { signal: AbortSignal.timeout(5000) })'));

// Wrap rss-parser in a timeout
code = code.replace(
  /const feed = await parser\.parseURL\('https:\/\/weworkremotely\.com\/categories\/remote-programming-jobs\.rss'\);/g,
  `const feed = await Promise.race([
            parser.parseURL('https://weworkremotely.com/categories/remote-programming-jobs.rss'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('WWR Timeout')), 5000))
          ]) as any;`
);

fs.writeFileSync('server.ts', code);
console.log('patched real timeouts');
