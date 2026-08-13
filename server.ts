import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

function safeParseJSON(text: string, fallback: any) {
  if (!text) return fallback;
  let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = clean.search(/[\{\[]/);
  const lastBrace = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response:", text);
    return fallback;
  }
}

/**
 * Resilient helper to execute Gemini API calls with automatic retries and fallback models
 * when encountering temporary 503 high demand, rate limits (429), or capacity issues.
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const modelsToTry = [
    params.preferredModel || "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || JSON.stringify(err) || "";
        const isUnavailable =
          errMessage.includes("503") ||
          errMessage.includes("UNAVAILABLE") ||
          errMessage.includes("high demand") ||
          errMessage.includes("429") ||
          errMessage.includes("RESOURCE_EXHAUSTED") ||
          errMessage.includes("overloaded");

        if (isUnavailable) {
          console.warn(`Model '${model}' high demand / 503 error (attempt ${attempt + 1}). Retrying or attempting fallback...`);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        // Non-transient error
        throw err;
      }
    }
  }

  const finalMsg = lastError?.message || "";
  if (finalMsg.includes("503") || finalMsg.includes("high demand") || finalMsg.includes("UNAVAILABLE")) {
    throw new Error("The AI service is currently experiencing high demand. Please wait a few seconds and try again.");
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  app.post("/api/extract-text", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `
        You are an expert job description data extraction assistant.
        Extract the job application information from this text carefully.

        Guidelines:
        - "position": Clean job title. Omit gender/diversity suffixes such as (m/w/d), (f/m/d), (m/f/x), (d/f/m), (all genders), etc.
        - "company": The company, team, or department name. If a line lists "Company/Team · Location (Mode)", e.g. "Spiele-Palast GmbH" or "Delta Consulting Company · Luxembourg (Hybrid)", extract ONLY the company name ("Spiele-Palast GmbH", "Delta Consulting Company"). Strip locations, work modes, and posting metadata from the company name.
        - "location": The physical geographic job location ONLY (city, region, country), e.g. "Berlin, Germany", "Luxembourg", "San Francisco, CA", "London, UK".
          STRICT REQUIREMENTS FOR LOCATION:
          1. Extract ONLY valid physical geographic locations (city, region, country).
          2. You MUST strictly exclude and strip non-location metadata such as posting dates/times ("2 days ago", "1 week ago", "Posted yesterday"), applicant counts ("Over 100 applicants", "50+ applicants", "23 applicants"), or work mode tags ("On-site", "Hybrid", "Remote").
          3. Example: If the text is "Berlin, Germany · 2 days ago · Over 100 applicants", extract ONLY "Berlin, Germany" as "location", and put posting metadata ("Posted 2 days ago · Over 100 applicants") into "notes".
        - "workType": Workplace model policy if mentioned in text e.g. "On-site", "Hybrid", or "Remote". Must strictly be one of: "On-site", "Hybrid", "Remote", or null if not mentioned.
        - "notes": Summary of key details, responsibilities, job post metadata (such as "2 days ago", "Over 100 applicants"), or salary if mentioned.

        Return ONLY a JSON object with this schema:
        {
          "company": "Company Name",
          "position": "Clean Job Title",
          "location": "Clean Physical Location e.g. Luxembourg or Berlin, Germany",
          "workType": "On-site" | "Hybrid" | "Remote" | null,
          "notes": "Relevant details / notes including posting date and applicant counts"
        }

        Job Description Text:
        ${text.substring(0, 15000)}
      `;

      const response = await generateContentWithRetry(ai, {
        preferredModel: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const application = safeParseJSON(responseText, {});

      res.json({ application });
    } catch (error: any) {
      console.error("Text Extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract text" });
    }
  });

  app.post("/api/extract-pdf", async (req, res) => {
    try {
      const { pdfBase64 } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ error: "No PDF data provided" });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `
        You are a data extraction assistant.
        Extract all job applications mentioned in this PDF.
        Return ONLY a JSON array of objects with the following schema:
        [
          {
            "company": "Company Name",
            "position": "Job Title",
            "status": "Saved" | "Applied" | "Screening" | "Technical" | "Final" | "Offer" | "Rejected" | "Ghosted",
            "notes": "Any other details, salary, etc."
          }
        ]
        If no applications are found, return [].
      `;

      const response = await generateContentWithRetry(ai, {
        preferredModel: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: pdfBase64,
                  mimeType: "application/pdf"
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "[]";
      const applications = safeParseJSON(responseText, []);

      res.json({ applications });
    } catch (error: any) {
      console.error("PDF Extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract PDF" });
    }
  });

  app.post("/api/cv-match", async (req, res) => {
    try {
      const { targetRole, cvText, pdfBase64, jobDescription } = req.body;
      if (!jobDescription) {
        return res.status(400).json({ error: "Job description is required" });
      }
      if (!cvText && !pdfBase64) {
        return res.status(400).json({ error: "CV text or PDF file is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const role = targetRole || "Tech Hiring Manager";

      const promptText = `
You are a Senior Hiring Manager, Technical Recruiter, and Lead Evaluator specializing in the role of: ${role}.
You will be given a candidate's CV (resume) and a Job Description (JD).
Your task is to conduct a rigorous, intelligent evaluation of the candidate's CV against the Job Description specifically through the technical and domain lens of a ${role}.

Methodology & Rules:
1. Evaluate using ABDUCTIVE REASONING:
   - Do NOT just perform basic keyword matching.
   - Observe the underlying evidence in the candidate's past projects, architecture, tools, metrics, leadership, and experience.
   - Intelligently infer their true capability, technical depth, and potential to fulfill the required duties in the JD.

2. Score & Category Definition:
   - 80 to 100: "High Match" (Strong alignment, fulfills key requirements with high technical evidence)
   - 60 to 79: "Medium Match" (Solid baseline, but has notable competency gaps or framing issues)
   - Below 60: "Low Match" (Significant missing technical or domain competencies)

3. Actionable Polish:
   - Provide concrete, strategic guidance on how to rewrite bullet points in the candidate's CV to elevate their experience, reframe basic work into high-impact accomplishments, and bridge missing gaps for this specific JD.

4. Forecasted Interview Questions:
   - Provide 3 realistic, high-probability interview questions that a top interviewer for this role would ask based on the candidate's CV and this JD.

You MUST return your analysis strictly as a JSON object with this exact structure:
{
  "score": 85,
  "matchCategory": "High Match",
  "strengths": [
    "Array of 2-3 strong alignment points based on evidence in CV"
  ],
  "gaps": [
    "Array of 1-2 missing competencies or areas needing stronger evidence"
  ],
  "actionable_polish": "Specific instruction on how to rewrite CV bullet points to elevate experience and address gaps.",
  "interview_questions": [
    "Tailored question 1",
    "Tailored question 2",
    "Tailored question 3"
  ]
}

Job Description:
${jobDescription.substring(0, 15000)}

${cvText ? `Candidate CV Text:\n${cvText.substring(0, 20000)}` : ''}
`;

      let contentsPayload: any;
      if (pdfBase64 && !cvText) {
        contentsPayload = [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: pdfBase64,
                  mimeType: "application/pdf"
                }
              },
              { text: promptText }
            ]
          }
        ];
      } else {
        contentsPayload = promptText;
      }

      const response = await generateContentWithRetry(ai, {
        preferredModel: "gemini-3.6-flash",
        contents: contentsPayload,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const result = safeParseJSON(responseText, {});

      // Calculate matchCategory if missing or out of sync
      const rawScore = typeof result.score === "number" ? result.score : 70;
      let computedCategory = "Medium Match";
      if (rawScore >= 80) computedCategory = "High Match";
      else if (rawScore < 60) computedCategory = "Low Match";

      res.json({
        score: Math.min(100, Math.max(0, rawScore)),
        matchCategory: result.matchCategory || computedCategory,
        strengths: Array.isArray(result.strengths) ? result.strengths : ["Good background alignment"],
        gaps: Array.isArray(result.gaps) ? result.gaps : ["Ensure all key technical keywords from JD are explicitly documented"],
        actionable_polish: result.actionable_polish || "Reframe past bullet points with quantified metrics and explicit technical tools mentioned in the job description.",
        interview_questions: Array.isArray(result.interview_questions) ? result.interview_questions : [
          "Walk me through a complex technical challenge from your past experience.",
          "How do you handle scope changes or tight deadlines?",
          "What is your approach to system quality and scalability?"
        ]
      });
    } catch (error: any) {
      console.error("CV Match error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze CV match" });
    }
  });

  app.post("/api/extract-drive", async (req, res) => {
    try {
      const { fileId, accessToken } = req.body;
      if (!fileId || !accessToken) {
        return res.status(400).json({ error: "Missing fileId or accessToken" });
      }

      const metaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!metaResponse.ok) {
        const errText = await metaResponse.text();
        throw new Error(`Failed to fetch file metadata: ${errText}`);
      }
      
      const meta: any = await metaResponse.json();
      let fileText = "";
      
      if (meta.mimeType === "application/vnd.google-apps.document") {
        const exportResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
           headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!exportResponse.ok) throw new Error("Failed to export Google Doc");
        fileText = await exportResponse.text();
      } else {
        const dlResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
           headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!dlResponse.ok) throw new Error("Failed to download file content (unsupported format for direct text extraction)");
        fileText = await dlResponse.text();
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `
        You are a data extraction assistant.
        Extract all job applications mentioned in this document.
        Return ONLY a JSON array of objects with the following schema:
        [
          {
            "company": "Company Name",
            "position": "Job Title",
            "status": "Saved" | "Applied" | "Screening" | "Technical" | "Final" | "Offer" | "Rejected" | "Ghosted",
            "notes": "Any other details, salary, etc."
          }
        ]
        If no applications are found, return [].
        
        Document Content:
        ${fileText.substring(0, 50000)}
      `;

      const response = await generateContentWithRetry(ai, {
        preferredModel: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "[]";
      const applications = safeParseJSON(responseText, []);

      res.json({ applications });
    } catch (error: any) {
      console.error("Drive Extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract from Drive" });
    }
  });

  // Global express error handler to ensure JSON responses for API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express API error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
