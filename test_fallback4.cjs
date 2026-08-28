const fs = require('fs');
const { jsonrepair } = require('jsonrepair');
const content = fs.readFileSync('current_fallback.js', 'utf8');

// evaluate the function
eval(content + `
  const fb = generateFallbackTeardown('Test', '');
  try {
     const str = JSON.stringify(fb);
     const rep = jsonrepair(str);
     const parsed = JSON.parse(rep);
     console.log("Success:", parsed.companyName);
  } catch (e) {
     console.error("Error:", e);
  }
`);
