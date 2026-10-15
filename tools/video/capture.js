// Chụp các màn hình chức năng IOC (1920x1080) làm chất liệu cho video.
// node capture.js [tênMàn1,tênMàn2,...]   (bỏ trống = chụp tất cả)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { serve } = require('./lib/server');

const OUT = path.join(__dirname, 'assets', 'screens');

// Mỗi màn: tài khoản đăng nhập + đoạn JS mở đúng màn + (tuỳ chọn) cuộn tới phần tử / chụp riêng phần tử.
const SCREENS = [
  { name: 'tong-quan', user: 'danguy' },
  { name: 'gis', user: 'danguy', scroll: '#gisMap', offset: -120 },
  { name: 'chi-tieu-luoi', user: 'danguy', text: 'Nhóm chỉ tiêu theo lĩnh vực' },
  { name: 'ban-do-toan-quoc', user: 'ban-tw-dang-btc', scroll: '#btctwMapWidget', offset: -10 },
  { name: 'van-ban-den', user: 'danguy', js: `openOverviewPieSegment('doc','docIn')` },
  { name: 'nhiem-vu-giao', user: 'danguy', js: `openList({metric:'assigned',role:null,title:'Nhiệm vụ giao · Tài khoản Thành ủy'})` },
  { name: 'nhiem-vu-nhan', user: 'danguy', js: `openOverviewPieSegment('metric','received')` },
  { name: 'giao-viec', user: 'danguy', js: `openAssignmentForm(null)` },
  { name: 'co-cau-to-chuc', user: 'danguy', js: `toggleSideNav()` },
  { name: 'ubnd-tong-quan', user: 'ubnd', text: 'Nhóm chỉ tiêu theo lĩnh vực' },
  { name: 'so-vhtt', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-vhtt')` },
  { name: 'so-gddt', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-gddt')` },
  { name: 'so-nnmt', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-nnmt')` },
  { name: 'so-yte', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-yte')` },
  { name: 'so-hcc', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-hcc')` },
  { name: 'so-taichinh', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-taichinh')` },
  { name: 'so-noivu', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-noivu')` },
  { name: 'dang-to-chuc', user: 'danguy', js: `openCategoryDetail('DANG','dang-to-chuc')` },
  { name: 'dang-ubkt', user: 'danguy', js: `openCategoryDetail('DANG','dang-ubkt')` },
  { name: 'hdnd-kt-ns', user: 'hdnd', js: `openCategoryDetail('HDND','hdnd-kt-ns')` },
  { name: 'trung-uong', user: 'tw' },
  { name: 'sgd-g0', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-gddt'); setTimeout(()=>sgdGo('group', SGD_GROUPS[0].id),300)` },
  { name: 'sgd-g1', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-gddt'); setTimeout(()=>sgdGo('group', SGD_GROUPS[1].id),300)` },
  { name: 'sgd-g4', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-gddt'); setTimeout(()=>sgdGo('group', SGD_GROUPS[4].id),300)` },
  { name: 'sgd-xa', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-gddt'); setTimeout(()=>sgdXa(),300)` },
  { name: 'sgd-src', user: 'ubnd', js: `openCategoryDetail('UBND','ubnd-gddt'); setTimeout(()=>sgdGo('src'),300)` },
  { name: 'nhat-ky', user: 'danguy', js: `openActionLogModal()` },
  { name: 'record', user: 'danguy', js: `openRecordDetail('PX-RECEIVED-UBND-3849')` },
  { name: 'canh-bao', user: 'danguy', js: `document.querySelector('[onclick*="onNotiTabClick(\\'urgent\\')"]')?.click()` },
  { name: 'quan-tri', user: 'login', js: `ouaOpen()` },
];

(async () => {
  const only = (process.argv[2] || '').split(',').filter(Boolean);
  fs.mkdirSync(OUT, { recursive: true });
  const root = path.resolve(__dirname, '../..');
  const server = await serve(root, 5178);
  const browser = await chromium.launch();
  for (const s of SCREENS.filter(s => !only.length || only.includes(s.name))) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.on('pageerror', e => console.log(`  [${s.name}] PAGEERR`, e.message));
    await page.goto('http://localhost:5178/');
    await page.waitForTimeout(700);
    // Ẩn toast thông báo để ảnh sạch
    await page.addStyleTag({ content: '#toast,.toast,.toast-wrap{display:none!important}' });
    if (s.user !== 'login') {
      await page.evaluate(u => { document.getElementById('username').value = u; document.getElementById('password').value = '123456'; login(); }, s.user);
      await page.waitForTimeout(1600);
    }
    if (s.js) { await page.evaluate(s.js).catch(e => console.log(`  [${s.name}] JSERR`, e.message)); await page.waitForTimeout(1500); }
    let clip = null;
    if (s.text) {
      // Widget nằm cuối trang nên không cuộn lên đầu được: kéo cao viewport rồi cắt khung 1920x1080 từ tiêu đề widget
      await page.setViewportSize({ width: 1920, height: 2600 });
      await page.waitForTimeout(600);
      const top = await page.evaluate(t => {
        const el = [...document.querySelectorAll('body *')].find(e => e.children.length === 0 && e.offsetParent && (e.textContent || '').includes(t));
        const box = el && (el.closest('section,.widget,.panel,.card') || el);
        return box ? box.getBoundingClientRect().top + window.scrollY : 0;
      }, s.text);
      clip = { x: 0, y: Math.max(0, top - 12), width: 1920, height: 1080 };
    }
    if (s.scroll) { await page.evaluate(([sel, off]) => { const el = document.querySelector(sel); if (el) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, off || 0); } }, [s.scroll, s.offset]); await page.waitForTimeout(800); }
    await page.screenshot(clip ? { path: path.join(OUT, s.name + '.png'), clip, fullPage: true } : { path: path.join(OUT, s.name + '.png') });
    console.log('ok', s.name);
    await page.close();
  }
  await browser.close(); server.close();
})();
