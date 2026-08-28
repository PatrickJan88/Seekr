function generateFallbackTeardown(companyName, websiteUrl, ogImage?, logoUrl?) {
  const name = companyName || "Target Company";
  const nameLower = name.toLowerCase();

  // Curated knowledge base for prominent tech companies
  if (nameLower.includes("linear")) {
    return {
      companyName: "Linear",
      websiteUrl: websiteUrl || "https://linear.app",
      logoUrl: logoUrl || "https://www.google.com/s2/favicons?domain=linear.app&sz=128",
      ogImage: ogImage || "https://linear.app/static/og-image.png",
      tagline: "The purpose-built tool for high-performance software teams",
            industry: "Developer Tools & Project Management",
      foundedYear: 2019,
      headquarters: "San Francisco, CA",
      fiscal: {
        fundingStage: "Series B",
        totalFunding: "$52M Raised",
        leadInvestors: ["Sequoia Capital", "Accel", "Dylan Field", "Patrick Collison"],
        valuationOrMarketCap: "$400M+ Valuation",
        arrEstimate: "$35M - $50M ARR",
        businessModel: "Product-Led B2B SaaS (Seat-based Tiering + Enterprise)",
        pricingGate: "Free tier up to 250 active issues; $8/user/mo Standard; $14/user/mo Plus; Custom Enterprise for SAML SSO & Priority SLAs",
                fiscalSummary: "Exceptional capital efficiency with a famously lean headcount (<90 employees) generating industry-leading revenue per employee (~$500k+/employee). High net dollar retention driven by grassroots engineering adoption."},
      headcount: {
        currentHeadcount: 77,
        monthChangePct: 1.0,
        oneYearGrowthPct: 28.3,
        twoYearGrowthPct: 65.0,
        hiringSignal: "Selective / Focused",
                departmentBreakdown: [
          { department: "Engineering", percentage: 52, count: 40 },
          { department: "Product & Design", percentage: 22, count: 17 },
          { department: "Sales & Customer Success", percentage: 16, count: 12 },
          { department: "Operations & G&A", percentage: 10, count: 8 }
        ],
        historicalTrend: [
          { date: "Aug 2024", headcount: 46 },
          { date: "Nov 2024", headcount: 51 },
          { date: "Feb 2025", headcount: 57 },
          { date: "May 2025", headcount: 62 },
          { date: "Aug 2025", headcount: 66 },
          { date: "Nov 2025", headcount: 70 },
          { date: "Feb 2026", headcount: 73 },
          { date: "May 2026", headcount: 75 },
          { date: "Aug 2026", headcount: 77 }
        ],
        growthAnalysis: "Intentional linear headcount growth maintaining high engineering craft and low management overhead, defying hyper-hiring traps while scaling Enterprise ACVs."},
      systemProfile: {
        targetCustomer: "Fast-moving tech startups, high-craft engineering teams, and modern scale-ups seeking alternatives to bloated legacy issue trackers (e.g. Jira).",
                coreProblemSolved: "Eliminates project management latency with sub-50ms sync, keyboard-first navigation, and opinionated cycle workflows.",
                primaryMoat: "High craft UX barrier, extreme speed (local-first architecture), developer brand worship, and Git/Slack integration lock-in.",
                retentionTrigger: "Daily triage loops, automated GitHub pull-request syncing, and cross-functional cycle planning rituals."},
      coreLoop: {
        spineSummary: "Keyboard-first Issue Capture -> Frictionless Execution -> Automated PR Resolution -> Project Insight Transparency",
                steps: [
          {
            step: 1,
            title: "Rapid Ingestion & Triage",
                        description: "Developers and PMs create issues in <2 seconds with Cmd+K shortcuts or via Slack bot capture.",
                        mechanism: "Global keyboard shortcuts & client-side local cache"},
          {
            step: 2,
            title: "Context-Rich Execution",
                        description: "Engineers assign cycles, link Figma prototypes, and branch git issues directly from ticket IDs.",
                        mechanism: "Deterministic ID branch naming & bidirectional integrations"},
          {
            step: 3,
            title: "Automated PR Closure Loop",
                        description: "Opening or merging a pull request automatically shifts issue status to In Review and Done.",
                        mechanism: "Webhook sync engine with zero manual status toggles"},
          {
            step: 4,
            title: "Strategic Velocity & Roadmapping",
                        description: "Leadership reviews cycle burn-down charts and roadmap initiatives, triggering expansion to other company orgs.",
                        mechanism: "Data aggregation into high-level Initiative Roadmaps"}
        ]
      },
      aiSpectrum: {
        tier: "Embedded",
                headline: "Linear embeds AI directly into the issue lifecycle for duplicate detection, auto-triage, and thread synthesis without invasive chatbots.",
                evidence: [
          "Linear Asks: AI automatically generates summaries of lengthy customer feedback and Slack threads into structured tickets.",
          "Similar Issues & Deduplication: Embeddings cluster duplicate bug reports in real time as the user types.",
          "Auto-Project Updates: AI drafts progress digests based on merged PRs and closed issues across the cycle."
        ],
                defendedRationale: "Linear avoids 'Assistive' sidecar chatbots and does not operate as an 'Autonomous' independent agent; instead, it seamlessly embeds ML intelligence into deterministic operational touchpoints."},
      swot: {
        strengths: [
          { point: "Unrivaled Performance & Design Craft",  detail: "Sub-50ms local sync gives an unmatched snappy feeling that developers refuse to surrender once adopted."},
          { point: "Grassroots Bottom-Up Viral Growth",  detail: "Engineers evangelize Linear when joining new companies, driving near-zero customer acquisition cost (CAC)."}
        ],
