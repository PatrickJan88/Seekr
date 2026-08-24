const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

const academicMock = `
const ACADEMIC_JOBS: any[] = [
  {
    id: "acad-1",
    title: "Postdoctoral Researcher in Quantum Computing",
    company_name: "Massachusetts Institute of Technology (MIT)",
    url: "#",
    publication_date: new Date().toISOString(),
    parsed_location: { continent: "North America", country: "United States", city: "Cambridge" }
  },
  {
    id: "acad-2",
    title: "Lecturer in Computer Science",
    company_name: "University of Oxford",
    url: "#",
    publication_date: new Date().toISOString(),
    parsed_location: { continent: "Europe", country: "United Kingdom", city: "Oxford" }
  },
  {
    id: "acad-3",
    title: "Assistant Professor - Artificial Intelligence",
    company_name: "Stanford University",
    url: "#",
    publication_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    parsed_location: { continent: "North America", country: "United States", city: "Stanford" }
  },
  {
    id: "acad-4",
    title: "PhD Candidate - Machine Learning",
    company_name: "ETH Zurich",
    url: "#",
    publication_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    parsed_location: { continent: "Europe", country: "Switzerland", city: "Zurich" }
  },
  {
    id: "acad-5",
    title: "Teaching Fellow in Data Science",
    company_name: "National University of Singapore (NUS)",
    url: "#",
    publication_date: new Date(Date.now() - 86400000 * 10).toISOString(),
    parsed_location: { continent: "Asia", country: "Singapore", city: "Singapore" }
  },
  {
    id: "acad-6",
    title: "Research Scientist - Bioinformatics",
    company_name: "Max Planck Institute",
    url: "#",
    publication_date: new Date(Date.now() - 86400000 * 1).toISOString(),
    parsed_location: { continent: "Europe", country: "Germany", city: "Munich" }
  }
];
`;

code = code.replace(
  /export function GlobalMarket/,
  `${academicMock}\nexport function GlobalMarket`
);

code = code.replace(
  /let result = jobs.filter\(\(job\) => \{/,
  `let baseJobs = trackingSystem === 'academic' ? ACADEMIC_JOBS : jobs;\n    let result = baseJobs.filter((job) => {`
);

// We need to also fix loading states so if it's academic, it doesn't show loading forever
code = code.replace(
  /\{loading \? \(/,
  `{(loading && trackingSystem !== 'academic') ? (`
);

// We should also replace the filters in GlobalMarket for academic
const oldCategories = `const ROLE_CATEGORIES = {`;
const dynamicCategories = `const ROLE_CATEGORIES_INDUSTRY = {`;

code = code.replace(oldCategories, dynamicCategories);

const academicCategories = `
const ROLE_CATEGORIES_ACADEMIC = {
  "Academic & Research": [
    { label: "Postdoctoral Researcher", value: "postdoc" },
    { label: "PhD Candidate", value: "phd" },
    { label: "Assistant Professor", value: "assistant professor" },
    { label: "Lecturer", value: "lecturer" },
    { label: "Research Scientist", value: "research scientist" },
    { label: "Teaching Fellow", value: "teaching fellow" }
  ]
};
`;

code = code.replace(
  /const ROLE_CATEGORIES_INDUSTRY = \{/,
  `${academicCategories}\nconst ROLE_CATEGORIES_INDUSTRY = {`
);

code = code.replace(
  /roleCategories=\{ROLE_CATEGORIES\}/,
  `roleCategories={trackingSystem === 'academic' ? ROLE_CATEGORIES_ACADEMIC : ROLE_CATEGORIES_INDUSTRY}`
);

fs.writeFileSync('src/components/GlobalMarket.tsx', code);
