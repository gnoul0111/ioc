// Quay trang dựng hình thành video, từng khung hình một (tất định, không rớt khung).
//   node render.js <comp.html> <out.mp4> [--fps 60] [--from 0] [--to <giây>] [--scale 1]
//   node render.js <comp.html> --stills 1.5,3,10.8  [--out shots/]   -> chụp vài khung PNG để kiểm tra
//   node render.js <comp.html> --meta <meta.json>                   -> xuất mốc thời gian (giọng, nhạc, phụ đề)
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const { serve } = require('./lib/server');

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; }

(async () => {
  const comp = process.argv[2];
  const out = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : null;
  const fps = +arg('fps', 60);
  const port = +arg('port', 5180);
  const server = await serve(__dirname, port);
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('console.' + m.type(), m.text()); });
  await page.goto(`http://localhost:${port}/${comp.replace(/\\/g, '/')}`);
  await page.waitForFunction('window.READY === true || !!window.ERR', null, { timeout: 120000 });
  const err = await page.evaluate('window.ERR');
  if (err) { console.log('LỖI DỰNG:', err); await browser.close(); server.close(); process.exit(1); }
  const meta = await page.evaluate('window.META');
  console.log('Thời lượng:', meta.duration.toFixed(2) + 's');

  if (arg('meta')) {
    fs.writeFileSync(arg('meta'), JSON.stringify(meta, null, 1));
    console.log('Đã ghi', arg('meta'));
  }
  if (arg('stills')) {
    const dir = arg('out', path.join(__dirname, 'shots'));
    fs.mkdirSync(dir, { recursive: true });
    for (const s of arg('stills').split(',').map(Number)) {
      await page.evaluate(t => window.seek(t), s);
      await page.screenshot({ path: path.join(dir, `still_${s.toFixed(2)}.png`) });
      console.log('still', s);
    }
  }
  if (out) {
    const from = +arg('from', 0), to = +arg('to', meta.duration);
    const n = Math.round((to - from) * fps);
    const ffmpeg = require('child_process').execSync('python -I -c "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"').toString().trim();
    const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      // ảnh JPEG là dải màu full -> đổi về dải chuẩn (tv) để máy chiếu/trình phát hiển thị đúng độ sáng
      '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const t = from + i / fps;
      await page.evaluate(tt => window.seek(tt), t);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % (fps * 2) === 0) {
        const el = (Date.now() - t0) / 1000, eta = el / (i + 1) * (n - i - 1);
        console.log(`khung ${i}/${n}  (t=${t.toFixed(1)}s)  còn ~${Math.round(eta)}s`);
      }
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log('Xong', out, `(${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  await browser.close(); server.close();
})();

