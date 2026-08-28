import { ApplicationLink } from '../types';

const ATS_DOMAINS = [
  'lever.co',
  'jobs.lever.co',
  'greenhouse.io',
  'boards.greenhouse.io',
  'myworkdayjobs.com',
  'workday.com',
  'ashbyhq.com',
  'jobs.ashbyhq.com',
  'workable.com',
  'apply.workable.com',
  'smartrecruiters.com',
  'jobs.smartrecruiters.com',
  'bamboohr.com',
  'jobvite.com',
  'icims.com',
  'recruitee.com',
  'careers.page',
  'career.site',
  'breezy.hr',
  'pinpointhq.com',
  'rippling-ats.com',
  'wellfound.com',
  'angel.co',
  'indeed.com',
  'glassdoor.com',
  'ziprecruiter.com',
  'linkedin.com/jobs',
  'builtin.com',
  'otta.com',
  'hired.com'
];

const SOCIAL_DOMAINS = [
  'linkedin.com/company',
  'linkedin.com/in',
  'twitter.com',
  'x.com',
  'github.com',
  'youtube.com',
  'facebook.com',
  'instagram.com'
];

export interface ClassifiedLink {
  url: string;
  title: string;
  normalizedUrl: string;
  type: 'homepage' | 'ats_job_post' | 'social' | 'reference';
  score: number;
  domain: string;
  isVerifiedHomepage: boolean;
}

/**
 * Normalizes a URL string by ensuring it starts with https://
 */
export function normalizeHttpUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Extracts a clean domain from a URL
 */
export function extractDomain(url: string): string {
  try {
    const normalized = normalizeHttpUrl(url);
    const parsed = new URL(normalized);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch (e) {
    return url.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  }
}

/**
 * Checks if a URL is an ATS job board / job portal link
 */
export function isAtsOrJobPostingUrl(url: string, companyName?: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const domain = extractDomain(url);

  // If the company itself is the ATS company (e.g. company name is "Teamtailor" or "Lever"),
  // root domain teamtailor.com or lever.co is their official homepage, NOT an ATS posting for another company
  const cleanComp = (companyName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanComp && domain.includes(cleanComp) && (domain === `${cleanComp}.com` || domain === `${cleanComp}.app` || domain === `${cleanComp}.io` || domain === `www.${cleanComp}.com`)) {
    // Check if path is a specific job application route (e.g. /jobs/12345 or /careers/apply)
    if (/\/(jobs?|careers?|posting|apply)\/[a-z0-9-]+/i.test(lowerUrl) && !/(\/en-us|\/en|\/product|\/pricing|\/about)/i.test(lowerUrl)) {
      return true;
    }
    return false;
  }

  // Check known ATS aggregator domains
  for (const ats of ATS_DOMAINS) {
    if (domain.includes(ats) || lowerUrl.includes(ats)) {
      return true;
    }
  }

  // Check job post path keywords
  if (/\/(jobs?|careers?|posting|positions?|apply|viewjob|job-board)\/[a-z0-9-_]+/i.test(lowerUrl)) {
    return true;
  }

  return false;
}

/**
 * Checks if a URL is a social profile link
 */
export function isSocialProfileUrl(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  for (const soc of SOCIAL_DOMAINS) {
    if (lowerUrl.includes(soc)) {
      return true;
    }
  }
  return false;
}

/**
 * Classifies and scores a link to determine if it is the authentic company official homepage
 */
export function classifyLink(link: { url: string; title?: string } | string, companyName?: string): ClassifiedLink {
  const url = typeof link === 'string' ? link : (link.url || '');
  const title = typeof link === 'string' ? '' : (link.title || '');
  const normalizedUrl = normalizeHttpUrl(url);
  const domain = extractDomain(normalizedUrl);
  const lowerUrl = normalizedUrl.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const cleanComp = (companyName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  let type: 'homepage' | 'ats_job_post' | 'social' | 'reference' = 'reference';
  let score = 50;

  const isAts = isAtsOrJobPostingUrl(normalizedUrl, companyName);
  const isSocial = isSocialProfileUrl(normalizedUrl);

  if (isAts) {
    type = 'ats_job_post';
    score = 20; // Lower priority for company teardown
  } else if (isSocial) {
    type = 'social';
    score = 30;
  } else {
    // Potential official homepage
    type = 'homepage';
    score = 80;

    // Bonus if domain contains the company name (e.g. teamtailor.com matches "Teamtailor")
    if (cleanComp && domain.includes(cleanComp)) {
      score += 30;
    }

    // Bonus if title explicitly says homepage / official site
    if (lowerTitle.includes('official') || lowerTitle.includes('website') || lowerTitle.includes('homepage') || lowerTitle.includes('home')) {
      score += 20;
    }

    // Bonus if clean root or localization path (e.g. /en-us/ or /)
    try {
      const parsed = new URL(normalizedUrl);
      if (parsed.pathname === '/' || parsed.pathname === '' || /^\/(en|en-us|us|zh|ja|de|fr)\/?$/i.test(parsed.pathname)) {
        score += 15;
      }
    } catch (e) {}
  }

  // Penalize if title explicitly states Job Posting
  if (lowerTitle.includes('job') || lowerTitle.includes('posting') || lowerTitle.includes('apply') || lowerTitle.includes('lever') || lowerTitle.includes('greenhouse')) {
    score -= 25;
  }

  return {
    url,
    title,
    normalizedUrl,
    type,
    score,
    domain,
    isVerifiedHomepage: type === 'homepage' && score >= 80
  };
}

/**
 * Given an application's links and company info, finds the best verified official company homepage URL
 */
export function findBestCompanyHomepageUrl(
  links: Array<{ url: string; title?: string }> = [],
  companyUrl?: string,
  companyName?: string
): { bestUrl: string; classified: ClassifiedLink[] } {
  const candidatePool: Array<{ url: string; title?: string }> = [];

  if (companyUrl && companyUrl.trim()) {
    candidatePool.push({ url: companyUrl.trim(), title: 'Company Website' });
  }

  if (Array.isArray(links)) {
    links.forEach(l => {
      if (l && l.url && l.url.trim()) {
        // avoid exact duplicates
        if (!candidatePool.some(c => c.url.trim().toLowerCase() === l.url.trim().toLowerCase())) {
          candidatePool.push(l);
        }
      }
    });
  }

  if (candidatePool.length === 0) {
    return { bestUrl: '', classified: [] };
  }

  const classified = candidatePool.map(c => classifyLink(c, companyName));
  // Sort descending by score
  classified.sort((a, b) => b.score - a.score);

  const best = classified[0];
  return {
    bestUrl: best ? best.normalizedUrl : '',
    classified
  };
}
