/**
 * Smart CV to Job Market Matcher
 * Parses CV background, hard skills, previous experience, soft skills, and constraints,
 * and scores / ranks job opportunities from most matched to least matched.
 */

export interface CVProfile {
  rawText: string;
  detectedRole: string;
  seniority: string;
  primaryKeywords: string[];
  skills: string[];
  softSkills: string[];
  domains: string[];
  experienceYears?: number;
}

export interface JobMatchScore {
  jobId: string | number;
  totalScore: number; // 0 to 100
  roleScore: number;
  skillsScore: number;
  experienceScore: number;
  softSkillsScore: number;
  matchedKeywords: string[];
  matchSummary: string;
  matchTier: 'exceptional' | 'strong' | 'good' | 'moderate' | 'low';
}

// Common tech, design & academic skill catalog for precise semantic extraction
const COMMON_SKILLS = [
  // UI/UX & Design
  'ui/ux', 'ui', 'ux', 'figma', 'sketch', 'adobe xd', 'wireframing', 'prototyping',
  'user research', 'usability testing', 'design systems', 'design system', 'information architecture',
  'interaction design', 'visual design', 'product design', 'user journey', 'persona', 'responsive design',
  'motion design', 'micro-interactions', 'accessibility', 'wcag', 'typography', 'design thinking',
  'heuristic evaluation', 'affinity diagram', 'journey mapping', 'storyboarding',
  
  // Frontend
  'react', 'typescript', 'javascript', 'html', 'css', 'tailwind', 'vue', 'angular',
  'next.js', 'redux', 'svelte', 'web development', 'front-end', 'frontend', 'sass', 'css3',

  // Backend & Systems
  'node', 'nodejs', 'python', 'java', 'go', 'golang', 'c#', '.net', 'c++', 'ruby', 'rails',
  'php', 'sql', 'postgresql', 'mysql', 'mongodb', 'graphql', 'rest api', 'microservices',
  'backend', 'back-end', 'redis', 'kafka',

  // Mobile
  'ios', 'android', 'swift', 'kotlin', 'react native', 'flutter', 'mobile development',

  // Cloud & DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'devops', 'terraform', 'linux',
  'sre', 'site reliability', 'infrastructure', 'bash', 'ansible',
  
  // Data & AI
  'machine learning', 'data science', 'ai', 'deep learning', 'nlp', 'pandas', 'tensorflow',
  'pytorch', 'llm', 'computer vision', 'data analysis', 'power bi', 'tableau', 'numpy',
  'data engineering', 'spark', 'hadoop', 'scikit-learn',

  // Product & Agile
  'scrum', 'agile', 'kanban', 'jira', 'confluence', 'product management', 'roadmap',
  'stakeholder management', 'a/b testing', 'analytics', 'kpis', 'mvp',

  // Academic, Research & Higher Ed
  'grant writing', 'peer review', 'qualitative research', 'quantitative research',
  'experimental design', 'statistical analysis', 'latex', 'literature review',
  'r', 'spss', 'matlab', 'stata', 'bioinformatics', 'scientific writing',
  'curriculum development', 'pedagogy', 'ethics approval', 'data collection',
  'teaching', 'mentoring', 'publication', 'conference presentation', 'dissertation',
  'postdoctoral', 'lab management', 'meta-analysis', 'scientific computing',
  'higher education', 'research methodology', 'grant proposal'
];

const SOFT_SKILLS = [
  'communication', 'collaboration', 'leadership', 'problem solving', 'teamwork',
  'mentoring', 'cross-functional', 'critical thinking', 'adaptability', 'initiative',
  'presentation', 'negotiation', 'user advocacy', 'empathy', 'time management',
  'interpersonal', 'analytical thinking', 'public speaking', 'organization'
];

export const ROLE_FAMILIES: Record<string, string[]> = {
  // --- TECH SECTOR ---
  'UI/UX & Product Design': [
    'designer', 'design', 'ui', 'ux', 'ui/ux', 'product designer', 'ux designer', 'ui designer',
    'interaction designer', 'visual designer', 'web designer', 'user experience', 'user interface',
    'design lead', 'head of design', 'creative director', 'graphic designer'
  ],
  'Frontend Engineering': [
    'frontend', 'front-end', 'react', 'web developer', 'ui engineer', 'javascript developer',
    'client-side', 'frontend developer', 'front-end developer', 'frontend engineer'
  ],
  'Backend & Full Stack': [
    'backend', 'back-end', 'full stack', 'fullstack', 'full-stack', 'software engineer',
    'developer', 'api engineer', 'systems engineer', 'node engineer', 'python developer',
    'java developer', 'software developer', 'golang developer'
  ],
  'Mobile Engineering': [
    'mobile engineer', 'mobile developer', 'ios developer', 'android developer', 'swift', 'kotlin',
    'react native developer', 'flutter developer'
  ],
  'Data Science & AI': [
    'data scientist', 'data analyst', 'data engineer', 'machine learning', 'ai engineer',
    'ml engineer', 'business intelligence', 'bi analyst', 'deep learning', 'quantitative researcher',
    'statistician', 'data analytics'
  ],
  'Product & Project Management': [
    'product manager', 'technical product manager', 'product owner', 'program manager', 'project manager',
    'scrum master', 'agile delivery'
  ],
  'DevOps, Cloud & Infrastructure': [
    'devops', 'cloud engineer', 'site reliability engineer', 'sre', 'platform engineer', 'infrastructure',
    'systems administrator', 'sysadmin', 'cloud architect'
  ],
  'QA & Testing': [
    'qa engineer', 'quality assurance', 'test engineer', 'automation engineer', 'sdet', 'software test'
  ],
  'Cybersecurity & IT': [
    'security engineer', 'cybersecurity', 'infosec', 'penetration tester', 'security analyst',
    'it support', 'network administrator'
  ],

  // --- ACADEMIC & RESEARCH SECTOR ---
  'Postdoctoral Research': [
    'postdoc', 'postdoctoral', 'post-doctoral', 'research fellow', 'postdoctoral researcher',
    'postdoctoral fellow', 'senior research fellow', 'visiting fellow', 'research associate'
  ],
  'Professor & Faculty': [
    'professor', 'assistant professor', 'associate professor', 'adjunct professor', 'faculty',
    'tenure-track', 'tenured faculty', 'chair professor', 'endowed chair', 'distinguished professor'
  ],
  'Lecturer & Academic Teaching': [
    'lecturer', 'senior lecturer', 'teaching fellow', 'course director', 'instructor',
    'adjunct lecturer', 'teaching assistant', 'faculty lecturer', 'academic tutor', 'faculty instructor'
  ],
  'Research Scientist & PI': [
    'research scientist', 'principal investigator', 'pi', 'staff scientist',
    'scientific director', 'laboratory director', 'senior scientist', 'scientific researcher'
  ],
  'Doctoral & PhD Research': [
    'phd', 'doctoral', 'phd candidate', 'phd student', 'phd researcher', 'graduate researcher',
    'doctoral student', 'graduate research assistant'
  ],
  'Academic Administration & Clinical': [
    'academic coordinator', 'dean', 'provost', 'academic advisor', 'department chair',
    'clinical researcher', 'scientific officer', 'grant coordinator'
  ]
};

function escapeRegex(str: string): string {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function termRegex(term: string, flags = 'i'): RegExp {
  const clean = term.trim().toLowerCase();
  const escaped = escapeRegex(clean);
  const prefix = /^\w/.test(clean) ? '\\b' : '(?:^|\\s|[^a-zA-Z0-9])';
  const suffix = /\w$/.test(clean) ? '\\b' : '(?=$|\\s|[^a-zA-Z0-9])';
  return new RegExp(`${prefix}${escaped}${suffix}`, flags);
}

function countMatches(text: string, term: string): number {
  try {
    const rx = termRegex(term, 'gi');
    const matches = text.match(rx);
    return matches ? matches.length : 0;
  } catch {
    return text.includes(term.toLowerCase()) ? 1 : 0;
  }
}

function testMatch(text: string, term: string): boolean {
  try {
    const rx = termRegex(term, 'i');
    return rx.test(text);
  } catch {
    return text.includes(term.toLowerCase());
  }
}

/**
 * Parses CV text and extracts key signals: background, role, skills, soft skills, seniority
 */
export function extractCVProfile(cvText: string): CVProfile {
  const clean = cvText.toLowerCase();

  // 1. Detect role family
  let detectedRole = 'Professional Specialist';
  let bestRoleMatchCount = 0;

  for (const [family, keywords] of Object.entries(ROLE_FAMILIES)) {
    let count = 0;
    for (const kw of keywords) {
      const matchCount = countMatches(clean, kw);
      if (matchCount > 0) {
        count += matchCount * (kw.length > 4 ? 2 : 1);
      }
    }
    if (count > bestRoleMatchCount) {
      bestRoleMatchCount = count;
      detectedRole = family;
    }
  }

  // Refine specific title from the top portion of the CV
  const topText = clean.substring(0, 1500);
  if (topText.includes('ui/ux designer') || topText.includes('ux/ui designer') || topText.includes('ux designer') || topText.includes('product designer')) {
    detectedRole = 'UI/UX & Product Designer';
  } else if (topText.includes('frontend developer') || topText.includes('front-end engineer') || topText.includes('react developer')) {
    detectedRole = 'Frontend Engineer';
  } else if (topText.includes('full stack') || topText.includes('fullstack')) {
    detectedRole = 'Backend & Full Stack';
  } else if (topText.includes('backend developer') || topText.includes('backend engineer')) {
    detectedRole = 'Backend & Full Stack';
  } else if (topText.includes('mobile developer') || topText.includes('ios developer') || topText.includes('android developer')) {
    detectedRole = 'Mobile Engineering';
  } else if (topText.includes('data scientist') || topText.includes('machine learning') || topText.includes('ai researcher') || topText.includes('ai engineer')) {
    detectedRole = 'Data Science & AI';
  } else if (topText.includes('product manager') || topText.includes('product lead')) {
    detectedRole = 'Product & Project Management';
  } else if (topText.includes('devops') || topText.includes('cloud engineer') || topText.includes('sre')) {
    detectedRole = 'DevOps, Cloud & Infrastructure';
  } else if (topText.includes('postdoc') || topText.includes('postdoctoral')) {
    detectedRole = 'Postdoctoral Research';
  } else if (topText.includes('assistant professor') || topText.includes('associate professor') || topText.includes('professor')) {
    detectedRole = 'Professor & Faculty';
  } else if (topText.includes('lecturer') || topText.includes('teaching fellow')) {
    detectedRole = 'Lecturer & Academic Teaching';
  } else if (topText.includes('research scientist') || topText.includes('principal investigator')) {
    detectedRole = 'Research Scientist & PI';
  } else if (topText.includes('phd candidate') || topText.includes('doctoral researcher') || topText.includes('phd researcher')) {
    detectedRole = 'Doctoral & PhD Research';
  }

  // 2. Detect Seniority
  let seniority = 'Mid-Level';
  if (clean.includes('senior') || clean.includes('lead') || clean.includes('staff') || clean.includes('principal') || clean.includes('head of')) {
    seniority = 'Senior';
  } else if (clean.includes('junior') || clean.includes('associate') || clean.includes('entry level') || clean.includes('intern')) {
    seniority = 'Junior';
  }

  // Years of experience
  const expMatch = clean.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i);
  const experienceYears = expMatch ? parseInt(expMatch[1], 10) : (seniority === 'Senior' ? 5 : 2);

  // 3. Extract hard skills
  const skills: string[] = [];
  for (const skill of COMMON_SKILLS) {
    if (testMatch(clean, skill)) {
      skills.push(skill);
    }
  }

  // 4. Extract soft skills
  const extractedSoftSkills: string[] = [];
  for (const soft of SOFT_SKILLS) {
    if (clean.includes(soft)) {
      extractedSoftSkills.push(soft);
    }
  }

  // 5. Extract primary keywords for quick fuzzy scoring
  const primaryKeywords = Array.from(new Set([
    ...skills,
    ...extractedSoftSkills,
    ...(ROLE_FAMILIES[detectedRole] || [])
  ]));

  return {
    rawText: cvText,
    detectedRole,
    seniority,
    primaryKeywords,
    skills,
    softSkills: extractedSoftSkills,
    domains: [],
    experienceYears
  };
}

/**
 * Score a single job against the candidate's CV profile
 */
export function scoreJobMatch(
  job: {
    id: string | number;
    title: string;
    description: string;
    category?: string;
    tags?: string[];
    job_type?: string;
  },
  cvProfile: CVProfile
): JobMatchScore {
  const titleLower = (job.title || '').toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  const categoryLower = (job.category || '').toLowerCase();
  const tagsLower = (job.tags || []).map(t => t.toLowerCase());

  // 1. ROLE & TITLE MATCH (Weight: 45%)
  // The most critical criteria: does the job title match candidate's background?
  let roleScore = 0;
  const roleKeywords = ROLE_FAMILIES[cvProfile.detectedRole] || [];

  let titleMatches: string[] = [];
  for (const kw of roleKeywords) {
    if (testMatch(titleLower, kw)) {
      roleScore += kw.length > 5 ? 40 : 25;
      titleMatches.push(kw);
    }
  }

  // Category match
  for (const kw of roleKeywords) {
    if (categoryLower.includes(kw)) {
      roleScore += 15;
      break;
    }
  }

  // Tags match
  for (const tag of tagsLower) {
    if (roleKeywords.some(kw => tag.includes(kw))) {
      roleScore += 10;
    }
  }

  roleScore = Math.min(100, roleScore);

  // Strong boost when candidate's detected role keywords match the job title
  if (titleMatches.length > 0) {
    roleScore = Math.max(roleScore, Math.min(100, 75 + titleMatches.length * 12));
  }

  // 2. HARD SKILLS MATCH (Weight: 30%)
  let skillsScore = 0;
  const matchedSkills: string[] = [];

  for (const skill of cvProfile.skills) {
    const inTitle = testMatch(titleLower, skill);
    const inTags = tagsLower.some(t => testMatch(t, skill));
    const inDesc = testMatch(descLower, skill);

    if (inTitle || inTags || inDesc) {
      matchedSkills.push(skill);
      if (inTitle) skillsScore += 18;
      else if (inTags) skillsScore += 12;
      else if (inDesc) skillsScore += 6;
    }
  }

  if (cvProfile.skills.length > 0) {
    const skillRatio = matchedSkills.length / Math.min(cvProfile.skills.length, 10);
    skillsScore = Math.min(100, Math.round(skillRatio * 100));
  } else {
    skillsScore = 50;
  }

  // 3. EXPERIENCE & SENIORITY (Weight: 15%)
  let experienceScore = 70;
  const isJobSenior = titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal') || descLower.includes('5+ years');
  const isJobJunior = titleLower.includes('junior') || titleLower.includes('associate') || titleLower.includes('entry');

  if (cvProfile.seniority === 'Senior') {
    if (isJobSenior) experienceScore = 100;
    else if (!isJobJunior) experienceScore = 85;
    else experienceScore = 50;
  } else if (cvProfile.seniority === 'Junior') {
    if (isJobJunior) experienceScore = 100;
    else if (!isJobSenior) experienceScore = 80;
    else experienceScore = 40;
  }

  // 4. SOFT SKILLS MATCH (Weight: 10%)
  let softSkillsScore = 0;
  const matchedSoft: string[] = [];
  for (const soft of cvProfile.softSkills) {
    if (descLower.includes(soft)) {
      matchedSoft.push(soft);
      softSkillsScore += 20;
    }
  }
  softSkillsScore = Math.min(100, softSkillsScore || 60);

  // TOTAL WEIGHTED SCORE CALCULATION
  // Role: 45%, Skills: 30%, Experience: 15%, Soft Skills: 10%
  let totalScore = Math.round(
    roleScore * 0.45 +
    skillsScore * 0.30 +
    experienceScore * 0.15 +
    softSkillsScore * 0.10
  );

  // Guarantee realistic calibration (cap at 99%, floor at 25%)
  totalScore = Math.min(99, Math.max(25, totalScore));

  // Determine Tier
  let matchTier: JobMatchScore['matchTier'] = 'moderate';
  if (totalScore >= 88) matchTier = 'exceptional';
  else if (totalScore >= 75) matchTier = 'strong';
  else if (totalScore >= 60) matchTier = 'good';
  else if (totalScore >= 45) matchTier = 'moderate';
  else matchTier = 'low';

  const allMatched = Array.from(new Set([...titleMatches, ...matchedSkills, ...matchedSoft]));
  const highlightKeyWords = allMatched.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1));

  let matchSummary = '';
  if (matchTier === 'exceptional' || matchTier === 'strong') {
    matchSummary = `High match for ${cvProfile.detectedRole} with ${highlightKeyWords.join(', ')}`;
  } else {
    matchSummary = `Relevant to ${cvProfile.detectedRole}`;
  }

  return {
    jobId: job.id,
    totalScore,
    roleScore,
    skillsScore,
    experienceScore,
    softSkillsScore,
    matchedKeywords: highlightKeyWords,
    matchSummary,
    matchTier
  };
}

/**
 * Standard Sample CV for UI/UX Designer background (referenced explicitly in user instructions)
 */
export const SAMPLE_DESIGNER_CV = `
Alex Morgan
Senior UI/UX & Product Designer
alex.morgan.design@example.com | Portfolio: alexdesign.studio | London, UK (Remote)

SUMMARY
Accomplished Senior UI/UX Designer with 6+ years of experience designing intuitive B2B SaaS platforms, mobile consumer apps, and robust design systems. Adept in translating user research and complex business requirements into high-converting wireframes, interactive prototypes, and accessible user interfaces. Expert in Figma, user-centered design, and cross-functional agile collaboration with engineers and product managers.

CORE COMPETENCIES & SKILLS
• Design & Prototyping: UI/UX Design, Figma, Sketch, Adobe XD, Wireframing, High-Fidelity Prototyping, Responsive Web Design, Mobile App Design (iOS/Android), Interaction Design, Micro-interactions.
• Research & Usability: User Research, Usability Testing, User Interviews, Information Architecture, Journey Mapping, Persona Development, Heuristic Evaluation, Accessibility (WCAG 2.1).
• Design Systems: Component Architecture, Design Tokens, Design System Governance, Cross-Platform UI Consistency.
• Technical & Collaboration: HTML/CSS familiarity, Tailwind basics, Agile/Scrum, Jira, User Advocacy, Cross-Functional Collaboration, Mentoring Junior Designers.

EXPERIENCE
Senior Product & UI/UX Designer — CloudFlow Systems (2021 – Present)
• Led end-to-end UX redesign of core enterprise analytics dashboard in Figma, improving daily user task completion time by 34%.
• Architected scalable design system with 200+ modular components and tokens used across 4 cross-functional product squads.
• Conducted 50+ remote usability testing sessions and translated customer friction points into actionable UI improvements.

UI/UX Designer — Studio Pulse Digital (2018 – 2021)
• Crafted responsive web and mobile interfaces for FinTech and E-commerce clients from initial wireframing to high-fidelity handoff.
• Partnered closely with front-end engineers in daily standups to ensure pixel-perfect CSS implementation and seamless micro-interactions.
• Increased client conversion rates by 22% through data-driven A/B testing and checkout flow redesign.

EDUCATION
B.Sc. in Digital Media & Human-Computer Interaction (HCI)
`;
