const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

code = code.replace(
  /const data = await response\.json\(\);/,
  `        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse market jobs. Server returned:", text.substring(0, 500));
          throw new Error(\`Failed to parse server response: \${text.substring(0, 50)}\`);
        }`
);

fs.writeFileSync('src/components/GlobalMarket.tsx', code);
console.log('patched frontend');
