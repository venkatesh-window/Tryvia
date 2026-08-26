const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  console.log("Navigating to http://localhost:8081/vendor/login...");
  
  try {
    await page.goto('http://localhost:8081/vendor/login', { waitUntil: 'networkidle2', timeout: 10000 });
    
    // Check if the page is blank by getting the body HTML
    const html = await page.evaluate(() => document.body.innerHTML);
    if (html.length < 500) {
      console.log("PAGE MIGHT BE BLANK, HTML:", html);
    } else {
      console.log("PAGE RENDERED OK, HTML LENGTH:", html.length);
    }
  } catch (err) {
    console.error("Navigation failed:", err.message);
  }
  
  await browser.close();
})();
