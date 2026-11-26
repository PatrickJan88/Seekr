import { JobApplication, toCanonicalStatus } from '../types';

export interface StatusBreakdown {
  total: number;
  active: number;
  offer: number;
  rejected: number;
  ghosted: number;
}

export interface IndustryRoleNode {
  id: string;
  label: string;
  side: 'industry' | 'function';
  color: string;
  breakdown: StatusBreakdown;
  applicationIds: string[];
}

export interface IndustryRoleLink {
  sourceId: string;
  targetId: string;
  sourceLabel: string;
  targetLabel: string;
  value: number;
  breakdown: StatusBreakdown;
  applicationIds: string[];
}

export interface IndustryRoleSummary {
  totalApplied: number;
  offerCount: number;
  ghostedCount: number;
  rejectedCount: number;
  activeCount: number;
  wishlistExcludedCount: number;
  industries: IndustryRoleNode[];
  functions: IndustryRoleNode[];
  links: IndustryRoleLink[];
}

const INDUSTRY_COLORS: Record<string, string> = {
  'Telecom & Wireless': '#0068f9',
  'Semiconductors & Components': '#6736eb',
  'Consumer Tech': '#2b7fff',
  'Industrial / Space / Health': '#0d9488',
  'Engineering / Test Services': '#024bb1',
  'Cloud / AI & Software': '#4f46e5',
  'Digital / Finance / Other': '#64748b',
  // Academic industries
  'Technical & Engineering Universities': '#0068f9',
  'Medical & Life Sciences Institutes': '#0d9488',
  'National Labs & Research Centers': '#6736eb',
  'Comprehensive Universities': '#2b7fff',
  'Other Academic Institutions': '#64748b',
};

const FUNCTION_COLORS: Record<string, string> = {
  'RF / Radio / Antenna': '#0068f9',
  'Systems & Integration': '#0284c7',
  'Test / EMC / Validation': '#2b7fff',
  'Electronics & Hardware': '#6736eb',
  'Applications & Support': '#0d9488',
  'Data / AI / Modeling': '#4f46e5',
  'Software & Full-Stack': '#024bb1',
  'Product & Design': '#7c3aed',
  'Other Roles': '#64748b',
  // Academic functions
  'Postdoctoral Researcher': '#0068f9',
  'PhD Candidate': '#6736eb',
  'Faculty / Professor': '#024bb1',
  'Lecturer & Teaching': '#0d9488',
  'Research Scientist': '#2b7fff',
  'Other Academic Roles': '#64748b',
};

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function classifyEmployerIndustry(
  app: JobApplication,
  trackingSystem: 'industry' | 'academic' = 'industry'
): string {
  const company = (app.company || '').toLowerCase();
  const position = (app.position || '').toLowerCase();
  const notes = (app.notes || '').toLowerCase();
  const url = (app.companyUrl || '').toLowerCase();
  const combined = `${company} ${url} ${notes} ${position}`;

  if (trackingSystem === 'academic' || app.trackingSystem === 'academic') {
    if (
      matchesAny(combined, [
        /\b(karolinska|ki\.se|medical|biomed|pharma|hospital|broad institute|embl|health|clinical|oncology|neuro|genomic|life science)\b/i,
      ])
    ) {
      return 'Medical & Life Sciences Institutes';
    }
    if (
      matchesAny(combined, [
        /\b(kth|chalmers|mit|eth|epfl|delft|tu |polytechnique|imperial|georgia tech|caltech|technical university|technology|engineering)\b/i,
      ])
    ) {
      return 'Technical & Engineering Universities';
    }
    if (
      matchesAny(combined, [
        /\b(cern|nasa|esa|rise|fraunhofer|cnrs|nist|argonne|lawrence|max planck|research institute|national lab|laboratory|sintef)\b/i,
      ])
    ) {
      return 'National Labs & Research Centers';
    }
    if (
      matchesAny(combined, [
        /\b(university|universitet|college|högskola|hogskola|academy|school of)\b/i,
      ])
    ) {
      return 'Comprehensive Universities';
    }
    return 'Other Academic Institutions';
  }

  // Industry Seekr classification
  if (
    matchesAny(combined, [
      /\b(ericsson|nokia|qualcomm|telia|telenor|tele2|vodafone|verizon|at&t|t-mobile|huawei|motorola|cisco|tre|hi3g|telecom|wireless|5g|6g|cellular|baseband|ran|rf\s*system|antenna|telecommunications|satcom)\b/i,
    ])
  ) {
    return 'Telecom & Wireless';
  }

  if (
    matchesAny(combined, [
      /\b(nvidia|amd|intel|arm|broadcom|nxp|infineon|stmicro|texas instruments|tsmc|asml|micron|nordic semi|qorvo|skyworks|analog devices|microchip|renesas|semiconductor|silicon|wafer|asic|chip|microelectronics|components)\b/i,
    ])
  ) {
    return 'Semiconductors & Components';
  }

  if (
    matchesAny(combined, [
      /\b(volvo|scania|saab|airbus|boeing|spacex|esa|nasa|siemens|abb|ge |philips|medtronic|astrazeneca|novo nordisk|polestar|einride|northvolt|automotive|aerospace|defense|defence|space|satellite|robotics|industrial|medtech|biotech|healthcare|energy|automotive|manufacturing)\b/i,
    ])
  ) {
    return 'Industrial / Space / Health';
  }

  if (
    matchesAny(combined, [
      /\b(rohde|schwarz|keysight|national instruments|ni\.com|alten|afry|capgemini|altran|etteplan|sweco|combitech|sgs|intertek|tuv|ul |test service|test lab|emc|validation service|engineering consultancy|engineering services|consultancy)\b/i,
    ])
  ) {
    return 'Engineering / Test Services';
  }

  if (
    matchesAny(combined, [
      /\b(apple|google|meta|spotify|amazon|microsoft|netflix|airbnb|uber|sony|samsung|fitbit|garmin|sonos|xiaomi|bang & olufsen|marshall|teenage engineering|consumer tech|consumer electronics|design challenge|design engineering|product design|ux\/ui|product designer)\b/i,
    ])
  ) {
    return 'Consumer Tech';
  }

  if (
    matchesAny(combined, [
      /\b(openai|anthropic|databricks|snowflake|cloudflare|figma|linear|notion|mongodb|gitlab|palantir|perplexity|scale ai|hugging face|vercel|supabase|ai infrastructure|ai canvas|saas|cloud|inference|pair programming|api architecture)\b/i,
    ])
  ) {
    return 'Cloud / AI & Software';
  }

  if (
    matchesAny(combined, [
      /\b(klarna|adyen|stripe|revolut|visa|mastercard|jpmorgan|goldman|bank|fintech|finance|trading|insurance|e-commerce|ecommerce|retail|media|digital|telemetry metrics)\b/i,
    ])
  ) {
    return 'Digital / Finance / Other';
  }

  return 'Digital / Finance / Other';
}

export function classifyJobFunction(
  app: JobApplication,
  trackingSystem: 'industry' | 'academic' = 'industry'
): string {
  const pos = (app.position || '').toLowerCase();
  const notes = (app.notes || '').toLowerCase();
  const combined = `${pos} ${notes}`;

  if (trackingSystem === 'academic' || app.trackingSystem === 'academic') {
    if (matchesAny(pos, [/\b(postdoc|post-doc|postdoctoral)\b/i])) {
      return 'Postdoctoral Researcher';
    }
    if (matchesAny(pos, [/\b(phd|doctoral|doktorand|graduate research)\b/i])) {
      return 'PhD Candidate';
    }
    if (matchesAny(pos, [/\b(professor|faculty|chair|tenure)\b/i])) {
      return 'Faculty / Professor';
    }
    if (matchesAny(pos, [/\b(lecturer|teaching|instructor|adjunkt|lektor|tutor)\b/i])) {
      return 'Lecturer & Teaching';
    }
    if (matchesAny(pos, [/\b(researcher|research scientist|scientist|fellow|investigator)\b/i])) {
      return 'Research Scientist';
    }
    return 'Other Academic Roles';
  }

  // Industry Seekr job functions
  if (
    matchesAny(combined, [
      /\b(rf|radio|antenna|microwave|mmwave|millimeter wave|radar|transceiver|wireless|baseband|5g|lte|propagation)\b/i,
    ])
  ) {
    return 'RF / Radio / Antenna';
  }

  if (
    matchesAny(combined, [
      /\b(emc|emi|test engineer|verification|validation|compliance|certification|qa|quality assurance|sdet|automation test|hardware test|lab engineer)\b/i,
    ])
  ) {
    return 'Test / EMC / Validation';
  }

  if (
    matchesAny(pos, [
      /\b(systems? engineer|system integration|systems? architect|integration engineer|systems? & integration)\b/i,
    ])
  ) {
    return 'Systems & Integration';
  }

  if (
    matchesAny(pos, [
      /\b(hardware|electronics|pcb|fpga|asic|analog|power electronics|embedded|firmware|electrical|mechatronics|ic design|vlsi)\b/i,
    ])
  ) {
    return 'Electronics & Hardware';
  }

  if (
    matchesAny(pos, [
      /\b(application engineer|applications engineer|field application|fae|solutions engineer|support|customer engineer|technical specialist)\b/i,
    ])
  ) {
    return 'Applications & Support';
  }

  if (
    matchesAny(pos, [
      /\b(data|ai|ml|machine learning|llm|nlp|computer vision|deep learning|analytics|bi analyst|business intelligence|modeling|simulation|statistician|scientist)\b/i,
    ])
  ) {
    return 'Data / AI / Modeling';
  }

  if (
    matchesAny(pos, [
      /\b(product manager|program manager|product owner|product designer|ux|ui|ux\/ui|ui\/ux|design engineer|interaction designer)\b/i,
    ])
  ) {
    return 'Product & Design';
  }

  if (
    matchesAny(pos, [
      /\b(software|developer|full-stack|fullstack|full stack|front-end|frontend|front end|back-end|backend|back end|mobile|ios|android|devops|cloud|sre|reliability|security|platform engineer)\b/i,
    ])
  ) {
    return 'Software & Full-Stack';
  }

  return 'Other Roles';
}

function emptyBreakdown(): StatusBreakdown {
  return { total: 0, active: 0, offer: 0, rejected: 0, ghosted: 0 };
}

function incrementBreakdown(breakdown: StatusBreakdown, canonicalStatus: string) {
  breakdown.total += 1;
  if (canonicalStatus === 'Offer') {
    breakdown.offer += 1;
  } else if (canonicalStatus === 'Rejected') {
    breakdown.rejected += 1;
  } else if (canonicalStatus === 'Ghosted') {
    breakdown.ghosted += 1;
  } else {
    breakdown.active += 1;
  }
}

export function buildIndustryRoleSummary(
  applications: JobApplication[],
  trackingSystem: 'industry' | 'academic' = 'industry'
): IndustryRoleSummary {
  const industryMap = new Map<string, IndustryRoleNode>();
  const functionMap = new Map<string, IndustryRoleNode>();
  const linkMap = new Map<string, IndustryRoleLink>();

  let totalApplied = 0;
  let offerCount = 0;
  let ghostedCount = 0;
  let rejectedCount = 0;
  let activeCount = 0;
  let wishlistExcludedCount = 0;

  applications.forEach((app) => {
    const canon = toCanonicalStatus(app.status);
    if (canon === 'Wishlist') {
      wishlistExcludedCount += 1;
      return;
    }

    totalApplied += 1;
    if (canon === 'Offer') offerCount += 1;
    else if (canon === 'Ghosted') ghostedCount += 1;
    else if (canon === 'Rejected') rejectedCount += 1;
    else activeCount += 1;

    const industry = classifyEmployerIndustry(app, trackingSystem);
    const jobFn = classifyJobFunction(app, trackingSystem);

    const indId = `ind::${industry}`;
    const fnId = `fn::${jobFn}`;
    const linkKey = `${indId}__${fnId}`;

    if (!industryMap.has(indId)) {
      industryMap.set(indId, {
        id: indId,
        label: industry,
        side: 'industry',
        color: INDUSTRY_COLORS[industry] || '#64748b',
        breakdown: emptyBreakdown(),
        applicationIds: [],
      });
    }
    const indNode = industryMap.get(indId)!;
    incrementBreakdown(indNode.breakdown, canon);
    indNode.applicationIds.push(app.id);

    if (!functionMap.has(fnId)) {
      functionMap.set(fnId, {
        id: fnId,
        label: jobFn,
        side: 'function',
        color: FUNCTION_COLORS[jobFn] || '#64748b',
        breakdown: emptyBreakdown(),
        applicationIds: [],
      });
    }
    const fnNode = functionMap.get(fnId)!;
    incrementBreakdown(fnNode.breakdown, canon);
    fnNode.applicationIds.push(app.id);

    if (!linkMap.has(linkKey)) {
      linkMap.set(linkKey, {
        sourceId: indId,
        targetId: fnId,
        sourceLabel: industry,
        targetLabel: jobFn,
        value: 0,
        breakdown: emptyBreakdown(),
        applicationIds: [],
      });
    }
    const link = linkMap.get(linkKey)!;
    link.value += 1;
    incrementBreakdown(link.breakdown, canon);
    link.applicationIds.push(app.id);
  });

  const industries = Array.from(industryMap.values()).sort((a, b) => {
    if (a.label.includes('Other')) return 1;
    if (b.label.includes('Other')) return -1;
    return b.breakdown.total - a.breakdown.total;
  });

  const functions = Array.from(functionMap.values()).sort((a, b) => {
    if (a.label.includes('Other')) return 1;
    if (b.label.includes('Other')) return -1;
    return b.breakdown.total - a.breakdown.total;
  });

  const links = Array.from(linkMap.values()).sort((a, b) => b.value - a.value);

  return {
    totalApplied,
    offerCount,
    ghostedCount,
    rejectedCount,
    activeCount,
    wishlistExcludedCount,
    industries,
    functions,
    links,
  };
}
