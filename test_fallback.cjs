const fetch = require('node-fetch'); // wait, fetch is global in Node 18+
async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/company-teardown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: "Vercel" })
    });
    console.log(res.status, res.statusText);
    const text = await res.text();
    console.log(text.substring(0, 100));
  } catch (e) {
    console.log(e);
  }
}
run();
