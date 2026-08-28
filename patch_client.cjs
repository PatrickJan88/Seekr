const fs = require('fs');

let client = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf8');

client = client.replace(
  "import { getSavedTeardowns, saveTeardown, deleteSavedTeardown, SavedTeardownRecord } from '../db/teardowns';",
  "import { getSavedTeardowns, saveTeardown, deleteSavedTeardown, SavedTeardownRecord } from '../db/teardowns';\nimport { jsonrepair } from 'jsonrepair';"
);

const fetchBlockRegex = /const resp = await fetch\('\/api\/company-teardown', \{[\s\S]*?toast\.success\('Company intelligence teardown ready!'\);/m;

const newFetchBlock = `
      // Switch to streaming endpoint
      const resp = await fetch('/api/company-teardown/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: targetName,
          websiteUrl: targetUrl
        })
      });

      if (!resp.ok) {
        throw new Error('Failed to generate company analysis');
      }

      if (!resp.body) throw new Error('ReadableStream not supported');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let rawJsonStr = '';
      let metaData: any = {};
      
      // Reveal the skeleton immediately
      setActiveTab('explorer');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\\n');
        
        for (const line of lines) {
          if (line.startsWith('data: [DONE]')) break;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.error) {
                console.error("Stream reported error:", data.error);
                continue; // let it finish and maybe fallback
              }
              if (data.meta) {
                 metaData = data.meta;
              }
              if (data.text) {
                 rawJsonStr += data.text;
                 
                 // Progressively parse
                 try {
                   const repaired = jsonrepair(rawJsonStr);
                   const parsed = JSON.parse(repaired);
                   
                   // Re-attach meta
                   if (metaData.ogImage && !parsed.ogImage) parsed.ogImage = metaData.ogImage;
                   if (metaData.logoUrl && !parsed.logoUrl) parsed.logoUrl = metaData.logoUrl;
                   
                   setCurrentTeardown(parsed as CompanyTeardownData);
                 } catch (parseErr) {
                   // Silently ignore mid-stream parse errors
                 }
              }
            } catch(e) {}
          }
        }
      }

      // Final parse check
      let finalTeardown: CompanyTeardownData | null = null;
      try {
        finalTeardown = JSON.parse(jsonrepair(rawJsonStr));
      } catch (e) {
        throw new Error("Stream returned invalid or incomplete data.");
      }
      
      if (finalTeardown) {
         if (metaData.ogImage && !finalTeardown.ogImage) finalTeardown.ogImage = metaData.ogImage;
         if (metaData.logoUrl && !finalTeardown.logoUrl) finalTeardown.logoUrl = metaData.logoUrl;
         finalTeardown.generatedAt = Date.now();
         setCurrentTeardown(finalTeardown);
         
         const userId = auth.currentUser?.uid || 'guest_user';
         try {
           const saved = await saveTeardown(userId, finalTeardown);
           setSavedRecords(prev => [saved, ...prev.filter(r => r.id !== saved.id)]);
         } catch (saveErr) {
           console.warn('Save teardown warning:', saveErr);
         }
      }

      toast.success('Company intelligence teardown ready!');`;

client = client.replace(fetchBlockRegex, newFetchBlock);

fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', client);
console.log("Patched client to use stream and jsonrepair");
