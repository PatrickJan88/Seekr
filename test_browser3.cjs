const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', resp => console.log('RESPONSE:', resp.url(), resp.status()));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  try {
     await page.type('input[placeholder*="Linear"]', 'Notion');
     await page.type('input[placeholder*="teamtailor"]', 'https://notion.so');
     const btn = await page.$x('//button[contains(., "Generate Insight")]');
     if (btn.length > 0) {
        await btn[0].click();
        await page.waitForTimeout(5000);
     } else {
        console.log("No generate button found");
     }
  } catch (e) {
     console.log("Error interacting", e);
  }
  
  await browser.close();
})();
