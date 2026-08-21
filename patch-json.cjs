const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace all json parsing with safe json parsing
code = code.replace(/const data = await response.json\(\);/g, `
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.error("Invalid JSON response:", text.substring(0, 100));
                return;
              }
`);

// For hacker news top ids
code = code.replace(/const ids = await response.json\(\);/g, `
            const text = await response.text();
            let ids;
            try {
              ids = JSON.parse(text);
            } catch(e) { return; }
`);

// For hacker news item
code = code.replace(/if \(itemRes.ok\) return itemRes.json\(\);/g, `
                if (itemRes.ok) {
                  const itemText = await itemRes.text();
                  try {
                    return JSON.parse(itemText);
                  } catch(e) { return null; }
                }
`);

fs.writeFileSync('server.ts', code);
console.log('patched json');
