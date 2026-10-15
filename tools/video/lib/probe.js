// Gỡ lỗi: tua tới t rồi chạy 1 biểu thức JS trong trang dựng hình.  node lib/probe.js comp/full.html 4.0 "expr"
const path = require('path');
const { chromium } = require('playwright');
const { serve } = require('./server');
(async () => {
  const [comp, t, expr] = process.argv.slice(2);
  const server = await serve(path.resolve(__dirname, '..'), 5181);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  await page.goto('http://localhost:5181/' + comp);
  await page.waitForFunction('window.READY === true || !!window.ERR', null, { timeout: 120000 });
  await page.evaluate(x => window.seek(x), +t);
  console.log(JSON.stringify(await page.evaluate(expr), null, 1));
  await browser.close(); server.close();
})();
