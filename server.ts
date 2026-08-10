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
        Extract the job application information from this job description text.
        Return ONLY a JSON object with the following schema:
        {
          "company": "Company Name (if found)",
          "position": "Job Title (if found)",
          "notes": "Brief summary of key requirements or responsibilities (if found)"
        }
        Return an empty object {} if nothing matches.
        
        Job Description Text:
        ${text.substring(0, 15000)}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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
