async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/company-teardown/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: "FAIL_ME" })
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let raw = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
           if (line.trim() === '') continue;
           if (line.startsWith('data: [DONE]')) break;
           if (line.startsWith('data: ')) {
               const data = JSON.parse(line.substring(6));
               if (data.text) {
                  raw += data.text;
               }
           }
        }
    }
    const { jsonrepair } = require('jsonrepair');
    console.log("Raw text length:", raw.length);
    console.log("Repaired:", JSON.parse(jsonrepair(raw)).companyName);
  } catch (e) {
    console.log("Error:", e);
  }
}
run();
