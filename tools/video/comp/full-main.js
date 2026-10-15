/* Ghép toàn bộ video: intro → 01 Mục đích → 02 Giải pháp & kiến trúc → 03 Chức năng → 04 Tác dụng + kết */
(async function () {
  // giọng Vbee (đã cắt bỏ 2 đoạn chèn ngoài lời, xem vbee_split.py); giọng Edge-TTS cũ ở ../full/audio/
  E.timing = await (await fetch('../full/audio_vbee/timing.json')).json();
  await Promise.all([400, 500, 600, 700, 800, 900].map(w => document.fonts.load(`${w} 40px "Be Vietnam Pro"`)));
  await document.fonts.load('900 400px "Be Vietnam Pro"');
  // hạt nhiễu phim rất nhẹ, đổi theo từng khung (tất định theo t)
  const gc = E.$('#grain').getContext('2d'), gimg = gc.createImageData(960, 540);
  E.drawers.push(t => {
    const r = E.rng(Math.floor(t * 60) + 1), d = gimg.data;
    for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    gc.putImageData(gimg, 0, 0);
  });
  const a = await S.intro();
  const b = await S.p1(a.end);
  const c = await S.p2(b.end);
  const d = await S.p3(c.end);
  const e = await S.p4(d.end);
  E.tl.set({}, {}, e.end);
  E.duration = e.end;
  E.ready();
})().catch(err => { console.error(err); window.ERR = String(err && err.stack || err); });
