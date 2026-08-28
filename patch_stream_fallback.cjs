const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const catchBlock = `
      } catch (aiErr: any) {
         console.warn("Stream failed mid-flight or at start:", aiErr);
         try {
             // Fallback to OpenAI compatible proxy
             const fallbackText = await callOpenAICompatibleAI({
                 prompt,
                 systemPrompt,
                 jsonMode: true,
                 temperature: 0.2
             });
             if (fallbackText) {
                 res.write(\`data: \${JSON.stringify({ text: fallbackText })}\\n\\n\`);
             } else {
                 throw new Error("Fallback AI returned null");
             }
         } catch (fallbackErr) {
             console.warn("Fallback also failed, sending static fallback object");
             const staticFallback = generateFallbackTeardown(cleanName || domain || "Target Company", cleanUrl, ogImage, favicon);
             res.write(\`data: \${JSON.stringify({ text: JSON.stringify(staticFallback) })}\\n\\n\`);
         }
      }
`;

server = server.replace(/\} catch \(aiErr: any\) \{[\s\S]*?res\.write\(\`data: \$\{JSON\.stringify\(\{ error: aiErr\?\.message \|\| "AI Stream failed" \}\)\}\\n\\n\`\);\s*\}/m, catchBlock);

fs.writeFileSync('server.ts', server);
console.log("Patched stream route fallback");
