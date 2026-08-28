const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const streamRoute = `
  app.post("/api/company-teardown/stream", async (req, res) => {
    try {
      const { companyName, websiteUrl, extraContext } = req.body;
      if (!companyName && !websiteUrl) {
        return res.status(400).json({ error: "Company name or website URL is required." });
      }

      const cleanName = (companyName || "").trim();
      const cleanUrl = (websiteUrl || "").trim();
      
      let ogImage = "";
      let domain = "";
      let favicon = "";
      let metaDescription = "";

      if (cleanUrl) {
        try {
          const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : \`https://\${cleanUrl}\`);
          domain = parsed.hostname.replace(/^www\./, '');
          favicon = \`https://www.google.com/s2/favicons?domain=\${domain}&sz=128\`;
        } catch (e) {}

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const target = cleanUrl.startsWith('http') ? cleanUrl : \`https://\${cleanUrl}\`;
          const resp = await fetch(target, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0 (compatible; SeekrBot/1.0)" }
          });
          clearTimeout(timeout);
          if (resp.ok) {
            const html = await resp.text();
            const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                               html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
            if (ogImgMatch && ogImgMatch[1]) {
              let img = ogImgMatch[1];
              if (img.startsWith('//')) img = 'https:' + img;
              else if (img.startsWith('/') && domain) img = \`https://\${domain}\${img}\`;
              ogImage = img;
            }
            const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
            if (descMatch && descMatch[1]) {
              metaDescription = descMatch[1].trim();
            }
          }
        } catch (e) {}
      }

      const systemPrompt = \`You are a Principal Product Manager and Tech Financial Analyst.
You reverse-engineer companies using Yan Liu's 5 core product teardown principles:
1. Structure over opinion: Answer concrete architectural and business questions. No subjective fluff.
2. Loops, not features: The Core Loop (Flywheel) is the central spine. Features are downstream of the loop.
3. AI placement is a spectrum: Classify strictly as 'Assistive' (copilot/advisory), 'Embedded' (integral workflow/logic), or 'Autonomous' (agentic background loops) and defend with factual evidence.
4. Grounded product assets: Reference genuine product workflows, pricing mechanics, and metrics.
5. Provide high-signal English for all sections.

In addition, include comprehensive Financial / Fiscal Insights and Headcount Dynamics:
- Fiscal: Funding stage, Total funding, Lead investors, Valuation / Market Cap, ARR estimate, Business model, Pricing Gate mechanism.
- Headcount Dynamics: Current HC, % last month change, 1-year growth %, 2-year growth %, Department distribution, and a 24-month historical trend series from Aug 2024 to Aug 2026.
- SWOT Analysis: 4 quadrants (Strengths, Weaknesses, Opportunities, Threats).
- Strategic Interview Kit: 3 proactive strategic product proposals, 5 killer reverse-interview questions, and key business KPIs.\`;

      const prompt = \`Perform a holistic, Principal-PM level company intelligence teardown for:
Company: \${cleanName || domain}
Website: \${cleanUrl || domain}
Meta Description: \${metaDescription || 'N/A'}
Extra Context: \${extraContext || 'N/A'}

Return ONLY a valid JSON object strictly matching this schema:
{
  "companyName": "\${cleanName || domain}",
  "websiteUrl": "\${cleanUrl || 'https://' + domain}",
  "tagline": "Concise English value proposition",
  "industry": "e.g. Developer Tools & SaaS",
  "foundedYear": 2020,
  "headquarters": "San Francisco, CA or relevant HQ",
  "fiscal": {
    "fundingStage": "e.g. Series C",
    "totalFunding": "e.g. $65M Raised",
    "leadInvestors": ["Investor 1", "Investor 2"],
    "valuationOrMarketCap": "e.g. $1.2B Valuation",
    "arrEstimate": "e.g. $40M - $60M ARR",
    "businessModel": "e.g. Product-Led B2B SaaS",
    "pricingGate": "e.g. Free for individuals; $8/seat/mo Standard",
    "fiscalSummary": "Comprehensive English financial health summary"
  },
  "headcount": {
    "currentHeadcount": 78,
    "monthChangePct": 1.2,
    "oneYearGrowthPct": 26.5,
    "twoYearGrowthPct": 62.0,
    "hiringSignal": "Aggressive Expansion",
    "departmentBreakdown": [
      { "department": "Engineering", "percentage": 48, "count": 37 }
    ],
    "historicalTrend": [
      { "date": "Aug 2024", "headcount": 48 }
    ],
    "growthAnalysis": "Detailed English growth velocity commentary"
  },
  "systemProfile": {
    "targetCustomer": "Specific ICP (Ideal Customer Profile)",
    "coreProblemSolved": "High-urgency problem solved",
    "primaryMoat": "Defensible competitive moat",
    "retentionTrigger": "The specific feature/mechanic that drives sticky usage"
  },
  "coreLoop": {
    "spineSummary": "High-level summary of the engine flywheel",
    "steps": [
      {
        "step": 1,
        "title": "Acquisition / Onboarding",
        "description": "How new users enter",
        "mechanism": "Key mechanism"
      }
    ]
  },
  "aiSpectrum": {
    "tier": "Assistive",
    "headline": "AI is used to...",
    "evidence": ["Evidence 1"],
    "defendedRationale": "Rationale for the tier"
  },
  "swot": {
    "strengths": [{ "point": "Point", "detail": "Detail" }],
    "weaknesses": [{ "point": "Point", "detail": "Detail" }],
    "opportunities": [{ "point": "Point", "detail": "Detail" }],
    "threats": [{ "point": "Point", "detail": "Detail" }]
  },
  "interviewKit": {
    "strategicPitches": [
      {
        "title": "Pitch Idea 1",
        "proposal": "Actionable product feature",
        "rationale": "Why this addresses a bottleneck"
      }
    ],
    "reverseQuestions": [
      {
        "question": "Sharp question",
        "targetPersona": "VP of Product",
        "whyItWorks": "Signals deep domain understanding"
      }
    ],
    "criticalKpisToMention": ["Net Revenue Retention (NRR)"]
  }
}\`;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Initialize meta first so client has images
      res.write(\`data: \${JSON.stringify({ meta: { ogImage, logoUrl: favicon } })}\\n\\n\`);

      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        
        const responseStream = await ai.models.generateContentStream({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });
        
        for await (const chunk of responseStream) {
          if (chunk.text) {
             res.write(\`data: \${JSON.stringify({ text: chunk.text })}\\n\\n\`);
          }
        }
      } catch (aiErr: any) {
         console.warn("Stream failed mid-flight or at start:", aiErr);
         // Cannot easily fallback on stream error if we already sent headers
         res.write(\`data: \${JSON.stringify({ error: aiErr?.message || "AI Stream failed" })}\\n\\n\`);
      }
      
      res.write(\`data: [DONE]\\n\\n\`);
      res.end();
      
    } catch (error: any) {
      console.error("Stream setup error:", error);
      if (!res.headersSent) {
          res.status(500).json({ error: error.message });
      } else {
          res.write(\`data: \${JSON.stringify({ error: error.message })}\\n\\n\`);
          res.end();
      }
    }
  });
`;

server = server.replace('app.post("/api/extract-drive"', streamRoute + '\n  app.post("/api/extract-drive"');
fs.writeFileSync('server.ts', server);
console.log("Added stream route to server.ts");
