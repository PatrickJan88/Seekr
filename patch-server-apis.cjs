const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Cover letter
code = code.replace(
  /const \{ cvText, pdfBase64, jobDescription, strengths, companyName \} = req\.body;/,
  `const { cvText, pdfBase64, jobDescription, strengths, companyName, trackingSystem } = req.body;`
);

code = code.replace(
  /Write a highly professional, tailored cover letter for the candidate applying to \$\{companyName \|\| 'this company'\}\./,
  `Write a highly professional, tailored cover letter for the candidate applying to \${companyName || (trackingSystem === 'academic' ? 'this institution' : 'this company')}.
If trackingSystem is "academic", format this as an academic cover letter (focus on research, publications, teaching philosophy if applicable).`
);

// Interview guide
code = code.replace(
  /const \{ targetRole, cvText, pdfBase64, jobDescription, strengths, gaps, companyName \} = req\.body;/,
  `const { targetRole, cvText, pdfBase64, jobDescription, strengths, gaps, companyName, trackingSystem } = req.body;`
);

code = code.replace(
  /You are a Master Interview Coach preparing a candidate for a \$\{targetRole \|\| 'technical'\} interview at \$\{companyName \|\| 'the target company'\}\./,
  `You are a Master Interview Coach preparing a candidate for a \${targetRole || 'position'} interview at \${companyName || (trackingSystem === 'academic' ? 'the target institution' : 'the target company')}.
If trackingSystem is "academic", tailor the interview guide to academic positions (e.g., job talks, committee interviews, research presentations).`
);

fs.writeFileSync('server.ts', code);
