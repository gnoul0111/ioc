// Khảo sát nhanh: đăng nhập 1 tài khoản, chụp màn hình + liệt kê nút/onclick đang hiện.
// node explore.js <username> [outName] [jsToEvalAfterLogin]
const path = require('path');
const { chromium } = require('playwright');
const { serve } = require('./lib/server');

(async () => {
  const [user = 'danguy', out = user, extra = ''] = process.argv.slice(2);
  const root = path.resolve(__dirname, '../..');
  const server = await serve(root, 5177);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  await page.goto('http://localhost:5177/');
  await page.waitForTimeout(800);
  if (user !== 'login') {
    await page.evaluate(u => { document.getElementById('username').value = u; document.getElementById('password').value = '123456'; login(); }, user);
    await page.waitForTimeout(1500);
  }
  if (extra) { await page.evaluate(extra); await page.waitForTimeout(1200); }
  await page.screenshot({ path: path.join(__dirname, 'shots', out + '.png') });
  const items = await page.evaluate(() => [...document.querySelectorAll('[onclick]')]
    .filter(e => e.offsetParent && e.getBoundingClientRect().width > 0)
    .map(e => (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50) + '  =>  ' + e.getAttribute('onclick').slice(0, 90))
    .filter((v, i, a) => a.indexOf(v) === i));
  console.log(items.slice(0, 120).join('\n'));
  await browser.close(); server.close();
})();
