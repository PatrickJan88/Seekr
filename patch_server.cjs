const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const targetStr = `  app.post("/api/extract-pdf", async (req, res) => {`;
const insertStr = `  app.post("/api/extract-text", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = \`
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
        \${text.substring(0, 15000)}
      \`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      const application = JSON.parse(responseText);

      res.json({ application });
    } catch (error: any) {
      console.error("Text Extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract text" });
    }
  });

`;

const startIndex = code.indexOf(targetStr);
if (startIndex !== -1) {
  code = code.substring(0, startIndex) + insertStr + code.substring(startIndex);
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts");
} else {
  console.log("Failed to patch server.ts");
}
