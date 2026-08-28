const fs = require('fs');

let client = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf8');

const sseBlockStart = client.indexOf("const reader = resp.body.getReader();");
const sseBlockEnd = client.indexOf("// Final parse check");

const newSseBlock = `
      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let rawJsonStr = '';
      let metaData: any = {};
      
      setActiveTab('explorer');
      
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        
        // Keep the last line in the buffer as it might be incomplete
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: [DONE]')) {
             // force break
             break;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.error) {
                console.error("Stream reported error:", data.error);
                continue;
              }
              if (data.meta) {
                 metaData = data.meta;
              }
              if (data.text) {
                 rawJsonStr += data.text;
                 setStreamingRawJson(rawJsonStr);
              }
            } catch(e) {
               console.warn("Error parsing SSE line:", line, e);
            }
          }
        }
      }

      `;

client = client.substring(0, sseBlockStart) + newSseBlock + client.substring(sseBlockEnd);

fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', client);
console.log("Patched SSE buffer handling");
