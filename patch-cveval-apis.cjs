const fs = require('fs');
let code = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');

code = code.replace(
  /jobDescription,\n          strengths: result\.strengths,\n          gaps: result\.gaps,\n          companyName: result\.company_name/g,
  `jobDescription,
          strengths: result.strengths,
          gaps: result.gaps,
          companyName: result.company_name,
          trackingSystem`
);

code = code.replace(
  /jobDescription,\n          strengths: result\.strengths,\n          companyName: result\.company_name/g,
  `jobDescription,
          strengths: result.strengths,
          companyName: result.company_name,
          trackingSystem`
);

fs.writeFileSync('src/components/CVMatchAssessment.tsx', code);
