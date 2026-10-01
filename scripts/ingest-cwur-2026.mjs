import fs from 'fs';
import path from 'path';

// Country code mapping helper
const COUNTRY_TO_CODE = {
  'USA': 'US',
  'United States': 'US',
  'United Kingdom': 'UK',
  'UK': 'UK',
  'China': 'CN',
  'Japan': 'JP',
  'Germany': 'DE',
  'France': 'FR',
  'Canada': 'CA',
  'Australia': 'AU',
  'Italy': 'IT',
  'South Korea': 'KR',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Switzerland': 'CH',
  'Sweden': 'SE',
  'Belgium': 'BE',
  'Taiwan': 'TW',
  'Singapore': 'SG',
  'Denmark': 'DK',
  'Israel': 'IL',
  'Finland': 'FI',
  'Norway': 'NO',
  'Austria': 'AT',
  'Brazil': 'BR',
  'India': 'IN',
  'Russia': 'RU',
  'Poland': 'PL',
  'Hong Kong': 'HK',
  'Ireland': 'IE',
  'New Zealand': 'NZ',
  'South Africa': 'ZA',
  'Portugal': 'PT',
  'Czech Republic': 'CZ',
  'Greece': 'GR',
  'Saudi Arabia': 'SA',
  'Turkey': 'TR',
  'Chile': 'CL',
  'Mexico': 'MX',
  'Argentina': 'AR',
  'Egypt': 'EG',
  'Malaysia': 'MY',
  'Thailand': 'TH',
  'Iran': 'IR',
  'Pakistan': 'PK',
  'Hungary': 'HU',
  'Colombia': 'CO',
  'Romania': 'RO',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'Estonia': 'EE',
  'Lithuania': 'LT',
  'Latvia': 'LV',
  'Croatia': 'HR',
  'Cyprus': 'CY',
  'Uruguay': 'UY',
  'United Arab Emirates': 'AE',
  'Lebanon': 'LB',
  'Jordan': 'JO',
  'Qatar': 'QA',
  'Kuwait': 'KW',
  'Oman': 'OM',
  'Iceland': 'IS',
  'Luxembourg': 'LU',
  'Malta': 'MT'
};

async function run() {
  console.log('--- Ingesting CWUR 2026 Global 2000 Universities ---');
  
  // 1. Load existing QS dataset if available to reuse known domains/career URLs
  const qsPath = path.join(process.cwd(), 'src', 'data', 'qsWorldUniversities.json');
  let qsUniversities = [];
  if (fs.existsSync(qsPath)) {
    try {
      qsUniversities = JSON.parse(fs.readFileSync(qsPath, 'utf8'));
    } catch (e) {
      console.warn('Could not read qsWorldUniversities.json:', e.message);
    }
  }

  const knownMap = new Map();
  for (const q of qsUniversities) {
    if (q.institution) {
      const clean = q.institution.toLowerCase().trim();
      knownMap.set(clean, q);
      const noParen = clean.replace(/\s*\([^)]*\)/g, '').trim();
      if (noParen) knownMap.set(noParen, q);
    }
  }

  // 2. Fetch CWUR 2026 page
  console.log('Fetching https://cwur.org/2026.php...');
  const res = await fetch('https://cwur.org/2026.php', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch CWUR: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  // 3. Extract table rows
  const trs = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1);
  console.log(`Found ${trs.length} table rows from CWUR 2026.`);

  const universities = [];

  for (const tr of trs) {
    const tds = [...tr[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    if (tds.length < 8) continue;

    // Rank & Percentile
    const rankMatch = tds[0].match(/(\d+)(?:<br>(.*))?/);
    const rankNum = rankMatch ? parseInt(rankMatch[1], 10) : universities.length + 1;
    const percentile = rankMatch && rankMatch[2] ? rankMatch[2].replace(/&nbsp;/g, ' ').trim() : '';

    // Institution Name & Detail Link
    const linkMatch = tds[1].match(/<a\s+href="([^"]+)">([\s\S]*?)<\/a>/);
    const detailHref = linkMatch ? linkMatch[1] : '';
    const name = linkMatch ? linkMatch[2].replace(/&amp;/g, '&').trim() : tds[1].replace(/<[^>]+>/g, '').trim();

    // Location / Country
    const location = tds[2].trim();

    // National Rank
    const natRank = parseInt(tds[3], 10) || 1;

    // Sub-ranks
    const eduRank = tds[4] ? tds[4].trim() : '-';
    const empRank = tds[5] ? tds[5].trim() : '-';
    const facRank = tds[6] ? tds[6].trim() : '-';
    const resRank = tds[7] ? tds[7].trim() : '-';

    // Score
    const scoreVal = tds[8] ? parseFloat(tds[8].trim()) : 65.0;

    const countryCode = COUNTRY_TO_CODE[location] || (location.length === 2 ? location.toUpperCase() : 'GLOBAL');

    universities.push({
      rank: rankNum.toString(),
      rankNum,
      percentile,
      institution: name,
      country: location === 'USA' ? 'United States' : location,
      countryCode,
      nationalRank: natRank,
      educationRank: eduRank,
      employabilityRank: empRank,
      facultyRank: facRank,
      researchRank: resRank,
      score: isNaN(scoreVal) ? '65.0' : scoreVal.toString(),
      cwurUrl: detailHref ? `https://cwur.org/${detailHref}` : '',
      detailHref,
      domain: '',
      careerUrl: ''
    });
  }

  console.log(`Successfully parsed ${universities.length} universities.`);

  // 4. Resolve domains and career URLs
  // Step A: First fill from known map
  let needDomainFetch = [];
  for (const u of universities) {
    const clean = u.institution.toLowerCase().trim();
    const noParen = clean.replace(/\s*\([^)]*\)/g, '').trim();
    const match = knownMap.get(clean) || knownMap.get(noParen);

    if (match && match.domain) {
      u.domain = match.domain;
      u.careerUrl = match.careerUrl || `https://www.${match.domain}/careers`;
    } else {
      needDomainFetch.push(u);
    }
  }

  console.log(`Matched ${universities.length - needDomainFetch.length} universities from existing catalog.`);
  console.log(`Fetching domain for remaining ${needDomainFetch.length} universities from CWUR detail pages...`);

  // Step B: Batch fetch domains from CWUR detail pages with concurrency pool
  const CONCURRENCY = 25;
  for (let i = 0; i < needDomainFetch.length; i += CONCURRENCY) {
    const chunk = needDomainFetch.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (u) => {
      if (!u.detailHref) return;
      try {
        const url = `https://cwur.org/${u.detailHref}`;
        const cRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000)
        });
        if (cRes.ok) {
          const cHtml = await cRes.text();
          const dMatch = cHtml.match(/<b>Domain<\/b><\/td><td>([^<]+)<\/td>/i);
          if (dMatch) {
            u.domain = dMatch[1].trim();
            u.careerUrl = `https://${u.domain}`;
          }
        }
      } catch (err) {
        // Fallback domain from institution slug if fetch fails
      }
    }));

    if ((i + CONCURRENCY) % 200 === 0 || i + CONCURRENCY >= needDomainFetch.length) {
      console.log(`Progress: fetched ${Math.min(i + CONCURRENCY, needDomainFetch.length)} / ${needDomainFetch.length}`);
    }
  }

  // Step C: Fallback resolution for any still missing domains
  for (const u of universities) {
    if (!u.domain) {
      // Derive clean domain heuristic from slug or name
      const slugName = u.institution.toLowerCase().replace(/[^a-z0-9]/g, '');
      const tld = u.countryCode === 'US' ? 'edu' : (u.countryCode === 'UK' ? 'ac.uk' : 'edu');
      u.domain = `${slugName}.${tld}`;
      u.careerUrl = `https://${u.domain}`;
    }

    // Enhance careerUrl if standard domain is available
    if (!u.careerUrl || u.careerUrl === `https://${u.domain}`) {
      if (u.domain.endsWith('.ac.uk')) {
        u.careerUrl = `https://www.jobs.ac.uk/search/?keywords=${encodeURIComponent(u.institution)}`;
      } else if (u.domain.endsWith('.edu')) {
        u.careerUrl = `https://www.higheredjobs.com/search/advanced_action.cfm?InstName=${encodeURIComponent(u.institution)}`;
      } else {
        u.careerUrl = `https://${u.domain}`;
      }
    }
  }

  // 5. Save to src/data/cwurWorldUniversities.json
  const outputPath = path.join(process.cwd(), 'src', 'data', 'cwurWorldUniversities.json');
  fs.writeFileSync(outputPath, JSON.stringify(universities, null, 2), 'utf8');
  console.log(`Saved ${universities.length} universities to ${outputPath}`);

  // Summary statistics
  const countries = new Set(universities.map(u => u.country));
  console.log(`Coverage summary:`);
  console.log(`- Total universities: ${universities.length}`);
  console.log(`- Countries represented: ${countries.size}`);
  console.log(`- Top 5 sample entries:`);
  console.log(universities.slice(0, 5).map(u => `#${u.rank} ${u.institution} (${u.country}) -> ${u.domain}`));
}

run().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
