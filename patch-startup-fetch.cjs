const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We will add a background fetch function that populates the cache.
// And we'll call it on startup.

code = code.replace(
  /let marketJobsCache: any\[\] = \[\];\s*let marketJobsLastFetch = 0;\s*const CACHE_TTL = 24 \* 60 \* 60 \* 1000; \/\/ 24 hours/g,
  `let marketJobsCache: any[] = [];
  let marketJobsLastFetch = 0;
  let isFetchingJobs = false;
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours`
);

// We need to extract the logic inside app.get("/api/market-jobs") into a standalone function
// It's a bit complex to regex replace the whole thing, so let's just do a manual string replace of the beginning of the route.

code = code.replace(
  /app\.get\("\/api\/market-jobs", async \(req, res\) => \{[\s\S]*?\/\/ Aggregate from multiple sources/g,
  `
  const refreshMarketJobsCache = async () => {
    if (isFetchingJobs) return;
    isFetchingJobs = true;
    try {
      let allJobs: any[] = [];
  `
);

// Now we need to replace the end of the route
code = code.replace(
  /marketJobsCache = uniqueJobs;\s*marketJobsLastFetch = now;\s*res\.json\(\{ jobs: marketJobsCache \}\);\s*\} catch \(error: any\) \{\s*console\.error\("Market Jobs error:", error\);\s*res\.status\(500\)\.json\(\{ error: error\.message \|\| "Failed to fetch market jobs" \}\);\s*\}\s*\}\);/g,
  `      marketJobsCache = uniqueJobs;
      marketJobsLastFetch = Date.now();
    } catch (error: any) {
      console.error("Market Jobs error:", error);
    } finally {
      isFetchingJobs = false;
    }
  };

  // Pre-fetch on startup
  refreshMarketJobsCache();

  app.get("/api/market-jobs", async (req, res) => {
    try {
      const now = Date.now();
      
      // If cache is empty and we are fetching, wait up to 4 seconds for it to finish
      if (marketJobsCache.length === 0 && isFetchingJobs) {
         let waitTime = 0;
         while (marketJobsCache.length === 0 && isFetchingJobs && waitTime < 4000) {
            await new Promise(resolve => setTimeout(resolve, 500));
            waitTime += 500;
         }
      }

      if (marketJobsCache.length === 0) {
        // Fallback: if still empty after waiting, return an empty array or a retry instruction
        return res.json({ jobs: [], status: "fetching_in_progress" });
      }

      if (now - marketJobsLastFetch > CACHE_TTL) {
        refreshMarketJobsCache(); // trigger background refresh
      }

      return res.json({ jobs: marketJobsCache });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch market jobs" });
    }
  });
`
);

fs.writeFileSync('server.ts', code);
console.log('patched startup fetch');
