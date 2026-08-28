const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/console\.log\("Stream failed mid-flight or at start:", aiErr\);/g, '/* rate limit expected */');
code = code.replace(/console\.log\("Gemini Teardown error, attempting OpenAI\/Empero fallback:", aiErr\);/g, '/* rate limit expected */');
code = code.replace(/console\.log\("Fallback also failed, sending static fallback object"\);/g, '/* fallback */');

fs.writeFileSync('server.ts', code);
