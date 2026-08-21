const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Function to inject signal into fetch arguments
// Pattern: fetch(`url`) -> fetch(`url`, { signal: AbortSignal.timeout(8000) })
// Pattern: fetch(`url`, { headers... }) -> fetch(`url`, { headers..., signal: AbortSignal.timeout(8000) })

code = code.replace(/fetch\(([^,]+)\)/g, function(match, url) {
    if (url.includes('remotive') || url.includes('arbeitnow') || url.includes('weworkremotely') || url.includes('jobicy') || url.includes('adzuna') || url.includes('hacker-news')) {
        return `fetch(${url}, { signal: AbortSignal.timeout(8000) })`;
    }
    return match;
});

code = code.replace(/fetch\(([^,]+),\s*\{([\s\S]*?)\}\)/g, function(match, url, options) {
    if (url.includes('jooble') || url.includes('reed')) {
        return `fetch(${url}, {${options}, signal: AbortSignal.timeout(8000) })`;
    }
    return match;
});

fs.writeFileSync('server.ts', code);
console.log('patched timeouts');
