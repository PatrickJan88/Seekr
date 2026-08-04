const { GoogleGenAI } = require("@google/genai");
require('dotenv').config({path: '.env'});

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  // there is no list models in the new SDK easily available? 
  // Let's just try to fetch via REST API
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await res.json();
  console.log(data.models.map(m => m.name).join('\n'));
}
run();
