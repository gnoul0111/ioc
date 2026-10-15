// Chụp riêng từng khối (thẻ chỉ số, biểu đồ, nguồn dữ liệu...) ở độ phân giải x2 cho hiệu ứng "tách lớp".
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { serve } = require('./lib/server');

const OUT = path.join(__dirname, 'assets', 'parts');

// text: đoạn chữ nằm trong khối; minW/minH: leo lên tổ tiên tới khi khối đủ lớn (đúng cái "card" bao ngoài)
const PARTS = [
  { name: 'vhtt-kpi', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-vhtt')`, text: '1. Tiến độ triển khai', minW: 450, minH: 110 },
  { name: 'vhtt-donut', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-vhtt')`, text: 'Nhiệm vụ theo tiến độ', minW: 450, minH: 250 },
  { name: 'vhtt-bar', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-vhtt')`, text: 'Nhiệm vụ theo đơn vị chủ trì', minW: 450, minH: 300 },
  { name: 'vhtt-trend', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-vhtt')`, text: 'Kế hoạch và thực tế hoàn thành', minW: 450, minH: 250 },
  { name: 'nguon-du-lieu', user: 'danguy', text: 'Nguồn dữ liệu & cập nhật gần nhất', minW: 400, minH: 400 },
  { name: 'sgd-kpi', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-gddt')`, text: 'Số trường (5 cấp học)', minW: 1500, minH: 120 },
  { name: 'sgd-health', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-gddt')`, text: 'Sức khỏe và điều kiện học', minW: 450, minH: 200 },
  { name: 'sgd-chart', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-gddt'); setTimeout(()=>sgdGo('group', SGD_GROUPS[0].id),300)`, text: 'Số trường theo cấp học', minW: 600, minH: 300 },
  { name: 'notify', user: 'danguy', text: 'Notify IOC/CAD cần xử lý', minW: 400, minH: 400 },
];
const only = (process.argv[2] || '').split(',').filter(Boolean);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const root = path.resolve(__dirname, '../..');
  const server = await serve(root, 5179);
  const browser = await chromium.launch();
  for (const s of PARTS.filter(p => !only.length || only.includes(p.name))) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5179/');
    await page.waitForTimeout(700);
    await page.addStyleTag({ content: '#toast,.toast,.toast-wrap{display:none!important}' });
    await page.evaluate(u => { document.getElementById('username').value = u; document.getElementById('password').value = '123456'; login(); }, s.user);
    await page.waitForTimeout(1500);
    if (s.js) { await page.evaluate(s.js); await page.waitForTimeout(1500); }
    const handle = await page.evaluateHandle(({ text, minW, minH }) => {
      const leaf = [...document.querySelectorAll('body *')].find(e => e.children.length === 0 && e.offsetParent && (e.textContent || '').includes(text));
      let el = leaf;
      while (el && el.parentElement) {
        const r = el.getBoundingClientRect();
        if (r.width >= minW && r.height >= minH) break;
        el = el.parentElement;
      }
      return el;
    }, s);
    const el = handle.asElement();
    if (!el) { console.log('MISS', s.name); await page.close(); continue; }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await el.screenshot({ path: path.join(OUT, s.name + '.png') });
    const box = await el.boundingBox();
    console.log('ok', s.name, Math.round(box.width) + 'x' + Math.round(box.height));
    await page.close();
  }
  await browser.close(); server.close();
})();


