async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/company-teardown/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: "Vercel" })
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log("Chunk:", decoder.decode(value));
    }
  } catch (e) {
    console.log("Error:", e);
  }
}
run();
