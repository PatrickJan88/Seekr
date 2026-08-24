const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const \{ targetRole, cvText, pdfBase64, jobDescription \} = req\.body;/,
  `const { targetRole, cvText, pdfBase64, jobDescription, trackingSystem } = req.body;`
);

const oldPrompt = /const promptText = \`\nYou are a Senior Hiring Manager, Technical Recruiter, and Lead Evaluator/;

const newPrompt = `
      const isAcademic = trackingSystem === 'academic';
      const evaluatorTitle = isAcademic 
        ? \`Senior Faculty Search Committee Member, Postdoc Recruiter, and Academic Lead Evaluator\`
        : \`Senior Hiring Manager, Technical Recruiter, and Lead Evaluator\`;
        
      const promptText = \`
You are a \${evaluatorTitle} specializing in the role/domain of: \${role}.`;

code = code.replace(oldPrompt, newPrompt);

code = code.replace(
  /1\. Evaluate using ABDUCTIVE REASONING:\n\s*- Do NOT just perform basic keyword matching\./,
  `1. Evaluate using ABDUCTIVE REASONING:
   - Do NOT just perform basic keyword matching.
   - If this is an academic evaluation, focus on publications, research methodology, grants, academic impact, and teaching experience.`
);

fs.writeFileSync('server.ts', code);
