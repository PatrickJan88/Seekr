const fs = require('fs');

let content = fs.readFileSync('src/components/BlobTextReveal.tsx', 'utf8');

// The original file actually contains literal "\`blur(\${blur}px)\`" instead of template literals because the create_file tool parsed them.
content = content.replace(/\\`blur\(\\\${blur}px\)\\`/g, '`blur(${blur}px)`');
content = content.replace(/\\`\\\${currentWord}-\\\${i}\\`/g, '`${currentWord}-${i}`');
content = content.replace(/\\`\\\${prefix} \\`/g, '`${prefix} `');

fs.writeFileSync('src/components/BlobTextReveal.tsx', content);
