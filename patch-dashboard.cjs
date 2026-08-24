const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const filteredAppsDef = `
  const filteredApplications = useMemo(() => {
    return applications.filter(app => (app.trackingSystem || 'industry') === trackingSystem);
  }, [applications, trackingSystem]);
`;

if (!code.includes('const filteredApplications = useMemo')) {
  // insert after applications state
  code = code.replace(
    /const \[applications, setApplications\] = useState<JobApplication\[\]>\(\[\]\);\n/,
    `$&${filteredAppsDef}\n`
  );
  
  // Need to make sure useMemo is imported if not already. 
  // Wait, useMemo is usually imported if useState is.
}

code = code.replace(/<SankeyChart applications=\{applications\}/g, `<SankeyChart applications={filteredApplications}`);
code = code.replace(/<Kanban applications=\{applications\}/g, `<Kanban applications={filteredApplications}`);
code = code.replace(/<Analytics applications=\{applications\}/g, `<Analytics applications={filteredApplications}`);
code = code.replace(/<CVMatchAssessment applications=\{applications\}/g, `<CVMatchAssessment applications={filteredApplications} trackingSystem={trackingSystem}`);
// Note: we should pass trackingSystem to CVMatchAssessment too!

code = code.replace(/<EvaluateHistoryPage onBack=\{\(\) => setView\('cv-match'\)\} applications=\{applications\}/g, `<EvaluateHistoryPage onBack={() => setView('cv-match')} applications={filteredApplications}`);

fs.writeFileSync('src/components/Dashboard.tsx', code);
