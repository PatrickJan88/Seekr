async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/company-teardown/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: "Notion" })
    });
    console.log("Status:", res.status, res.statusText);
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    for (let i = 0; i < 3; i++) {
        const { done, value } = await reader.read();
        console.log("Chunk:", decoder.decode(value));
        if (done) break;
    }
  } catch (e) {
    console.log("Error:", e);
  }
}
run();
