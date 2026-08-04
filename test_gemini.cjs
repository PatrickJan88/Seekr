const { GoogleGenAI } = require("@google/genai");
require('dotenv').config({path: '.env'});

async function runModel(name) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: name,
      contents: "Hello"
    });
    console.log(name, "SUCCESS");
  } catch(e) {
    console.error(name, "ERROR:", e.message.substring(0, 150));
  }
}

async function run() {
  await runModel("gemini-flash-latest");
  await runModel("gemini-2.0-flash-lite");
  await runModel("gemini-2.5-flash-lite");
  await runModel("gemini-3-flash-preview");
}
run();
