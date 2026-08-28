const fs = require('fs');

let client = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf8');

if (!client.includes('const [streamingRawJson')) {
  client = client.replace(
    'const [isLoading, setIsLoading] = useState(false);',
    'const [isLoading, setIsLoading] = useState(false);\n  const [streamingRawJson, setStreamingRawJson] = useState("");'
  );
}

// Update the handleGenerate to just append raw JSON and not parse aggressively
const handleGenStart = client.indexOf('const resp = await fetch(\'/api/company-teardown/stream\'');
const handleGenEnd = client.indexOf("toast.success('Company intelligence teardown ready!');");

const fetchBlockReplacement = `
      setStreamingRawJson("");
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
                continue;
              }
              if (data.meta) {
                 metaData = data.meta;
              }
              if (data.text) {
                 rawJsonStr += data.text;
                 setStreamingRawJson(rawJsonStr);
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
`;

client = client.substring(0, handleGenStart) + fetchBlockReplacement + client.substring(handleGenEnd);

// Now update the isLoading block
const loadingSkeletonStart = client.indexOf('{/* Loading Skeleton Indicator */}');
const loadingSkeletonEnd = client.indexOf('{/* Render Active Teardown Report */}');

const newLoadingSkeleton = `
          {/* Loading Skeleton Indicator */}
          {isLoading && (
            <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 border-b border-[#efefef] pb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-spin">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#121722]">
                    {'Synthesizing Company Intelligence...'}
                  </h3>
                  <p className="text-xs text-[#777c86]">
                    {'Extracting open-graph assets, mapping core loops, and reverse-engineering metrics.'}
                  </p>
                </div>
              </div>
              
              <div className="relative w-full h-[400px] bg-[#0d1117] rounded-xl overflow-hidden border border-[#30363d] shadow-inner">
                 <div className="absolute top-0 left-0 w-full h-8 bg-[#161b22] border-b border-[#30363d] flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                    <span className="text-[10px] text-[#8b949e] font-mono ml-2">seekr-ai-processor.ts</span>
                 </div>
                 <div className="p-4 pt-12 h-full overflow-y-auto font-mono text-xs text-[#c9d1d9] whitespace-pre-wrap flex flex-col-reverse">
                    <div>{streamingRawJson || 'Connecting to data sources...\\nInitiating intelligent teardown protocol...'}</div>
                 </div>
              </div>
            </div>
          )}
          
`;

client = client.substring(0, loadingSkeletonStart) + newLoadingSkeleton + client.substring(loadingSkeletonEnd);

fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', client);
console.log("Patched streaming UI");
