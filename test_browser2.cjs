const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Try clicking something
  try {
     await page.type('input[placeholder*="Company"]', 'Notion');
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
