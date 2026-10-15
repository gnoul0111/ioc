/* PHẦN 04 · TÁC DỤNG (C17) + KẾT (C18) */
window.S = window.S || {};
S.p4 = async function (t0) {
  const { tl, clamp, lerp, prog, ease, rng, $ } = E;
  const ch = E.chapter(t0, '04', 'Hiệu quả mang lại');
  const s17 = E.el(`<div class="scene" id="s17" style="perspective:1600px"></div>`, $('#scenes'));
  const tV = ch.out + .4; const e17 = E.voice('c17', tV);
  const t2 = E.wordAt('c17', 'giảm trùng lặp') - .3, t3 = E.wordAt('c17', 'tăng cường') - .25, tHT = E.wordAt('c17', 'hỗ trợ');

  /* ---- khối 1: ra quyết định nhanh, chính xác ---- */
  const b1 = E.el(`<div class="layer"></div>`, s17);
  b1.innerHTML = `<div class="bft"><div class="k">HIỆU QUẢ 1</div><div class="v v1a">Dữ liệu tập trung, rõ nguồn, kịp thời</div><div class="v v1b" style="position:absolute;left:0;right:0;top:44px;opacity:0">Hỗ trợ phân tích, đánh giá, ra quyết định</div></div>
    <svg width="1920" height="1080" style="position:absolute;left:0;top:0">
      <defs><linearGradient id="ar" x1="0" x2="1"><stop offset="0" stop-color="#4cc9ff" stop-opacity="0"/><stop offset="1" stop-color="#f2c14e"/></linearGradient>
      <linearGradient id="fillA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4cc9ff" stop-opacity=".35"/><stop offset="1" stop-color="#4cc9ff" stop-opacity="0"/></linearGradient></defs>
      <g transform="translate(360,330)">
        ${Array.from({ length: 6 }, (_, i) => `<line x1="0" y1="${i * 90}" x2="1200" y2="${i * 90}" stroke="rgba(140,180,255,.15)"/>`).join('')}
        ${Array.from({ length: 9 }, (_, i) => `<rect class="bar" x="${40 + i * 130}" y="${450 - (60 + i * 38)}" width="70" height="${60 + i * 38}" rx="8" fill="rgba(76,201,255,.25)" stroke="rgba(76,201,255,.6)"/>`).join('')}
        <path class="area" d="M0,420 C200,400 300,330 450,300 S750,180 900,140 S1100,40 1200,20 L1200,450 L0,450 Z" fill="url(#fillA)"/>
        <path class="ln" d="M0,420 C200,400 300,330 450,300 S750,180 900,140 S1100,40 1200,20" fill="none" stroke="url(#ar)" stroke-width="7" stroke-linecap="round"/>
        <circle class="dot" r="14" fill="#f2c14e" cx="1200" cy="20"/>
      </g></svg>
    <div class="layer spd"></div>`;
  const ln = b1.querySelector('.ln'), lnL = 1400;
  tl.fromTo(b1.querySelector('.bft'), { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: .5 }, tV - .2);
  tl.to(b1.querySelector('.v1a'), { opacity: 0, y: -20, duration: .4 }, tHT - .2);
  tl.fromTo(b1.querySelector('.v1b'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .45 }, tHT - .1);
  tl.fromTo(b1.querySelectorAll('.bar'), { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .6, stagger: .07, ease: 'back.out(1.6)' }, tV);
  tl.fromTo(ln, { attr: { 'stroke-dasharray': `0 ${lnL}` } }, { attr: { 'stroke-dasharray': `${lnL} 0` }, duration: 1.6, ease: 'power2.inOut' }, tV + .3);
  tl.fromTo(b1.querySelector('.area'), { opacity: 0 }, { opacity: 1, duration: .8 }, tV + 1.2);
  tl.fromTo(b1.querySelector('.dot'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .4, ease: 'back.out(3)' }, tV + 1.8);
  // vệt tốc độ
  const spd = b1.querySelector('.spd'); const rS = rng(91);
  const streaks = Array.from({ length: 26 }, () => { const s = E.el(`<div style="position:absolute;height:3px;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(255,230,160,.9))"></div>`, spd); s._o = { y: 260 + rS() * 620, w: 120 + rS() * 340, sp: 1400 + rS() * 1600, ph: rS() * 3 }; return s; });
  E.drawers.push(t => { if (t < tV || t > t2 + .5) return; streaks.forEach(s => { const o = s._o, x = ((t * o.sp + o.ph * 900) % 2600) - 400; Object.assign(s.style, { left: x + 'px', top: o.y + 'px', width: o.w + 'px', opacity: .6 * prog(t, tV, tV + .5) }); }); });
  E.burst(tV + 1.8, 360 + 1200, 330 + 20, 60, 13, 500);
  tl.to(b1, { x: -1920, duration: .7, ease: 'power3.inOut' }, t2 - .2);

  /* ---- khối 2: giảm nhập liệu trùng lặp ---- */
  const b2 = E.el(`<div class="layer"></div>`, s17);
  b2.innerHTML = `<div class="bft"><div class="k">HIỆU QUẢ 2</div><div class="v">Giảm trùng lặp trong nhập liệu</div></div>
    ${Array.from({ length: 5 }, (_, i) => `<div class="form f${i}" style="left:${240 + i * 300}px;top:420px">${'<i></i>'.repeat(8)}</div>`).join('')}
    <div class="dcard" style="left:795px;top:380px">${IC.s(P.edit, '#ffe7a3', 80, 2)}Nhập một lần<br><span style="font-size:22px;font-weight:600;color:#cfe0ff">Khai thác nhiều lần</span></div>
    <div class="x5" style="position:absolute;left:0;right:0;top:760px;text-align:center;font-size:40px;font-weight:900;color:#ff8a8f">5 lần nhập</div>`;
  tl.fromTo(b2, { x: 1920 }, { x: 0, duration: .7, ease: 'power3.inOut' }, t2 - .2);
  const forms = [...b2.querySelectorAll('.form')], dc = b2.querySelector('.dcard'), x5 = b2.querySelector('.x5');
  tl.fromTo(forms, { y: 80, opacity: 0, rotation: (i) => (i - 2) * 6 }, { y: 0, opacity: 1, duration: .5, stagger: .08, ease: 'back.out(1.6)' }, t2 + .15);
  tl.fromTo(x5, { opacity: 0 }, { opacity: 1, duration: .3 }, t2 + .4);
  tl.to(forms, { x: (i) => 795 + 50 - (240 + i * 300), y: -30, rotation: 0, scale: .9, duration: .5, stagger: .04, ease: 'power3.in' }, t2 + .75);
  tl.to(forms, { opacity: 0, duration: .15 }, t2 + 1.35);
  tl.to(x5, { opacity: 0, duration: .2 }, t2 + .85);
  tl.fromTo(dc, { opacity: 0, scale: .3 }, { opacity: 1, scale: 1, duration: .6, ease: 'back.out(2)' }, t2 + 1.25);
  E.burst(t2 + 1.35, 960, 545, 80, 17, 600); E.ev(t2 + 1.3, 'hit');
  tl.to(b2, { x: -1920, duration: .7, ease: 'power3.inOut' }, t3 - .2);

  /* ---- khối 3: liên thông chỉ đạo đến cơ sở (bản đồ chấm Hà Nội, 126 điểm) ---- */
  const b3 = E.el(`<div class="layer"></div>`, s17);
  b3.innerHTML = `<div class="bft" style="top:70px"><div class="k">HIỆU QUẢ 3</div><div class="v">Tăng cường phối hợp và liên thông</div></div><canvas width="1920" height="1080" style="position:absolute;left:0;top:0"></canvas>
    <div style="position:absolute;left:120px;top:420px;display:flex;flex-direction:column;gap:18px">${[['Thành ủy', '#e5484d'], ['HĐND', '#f08c2e'], ['UBND', '#19b3a6'], ['MTTQ', '#9b6cf2']].map(([n, c]) => `<div class="lg3" style="display:flex;align-items:center;gap:14px;font-size:30px;font-weight:800"><i style="width:22px;height:22px;border-radius:50%;background:${c};box-shadow:0 0 16px ${c}"></i>${n}</div>`).join('')}</div>
    <div class="c126" style="position:absolute;right:150px;top:470px;text-align:right"><div style="font-size:120px;font-weight:900;line-height:1;color:#f2c14e">0</div><div style="font-size:30px;font-weight:700">xã, phường</div></div>`;
  tl.fromTo(b3, { x: 1920 }, { x: 0, duration: .7, ease: 'power3.inOut' }, t3 - .2);
  tl.fromTo(b3.querySelectorAll('.lg3'), { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: .4, stagger: .15 }, t3 + .4);
  const hn = VN34_GEOJSON.features.find(f => /Hà Nội/.test(f.properties.ten));
  const polys = hn.geometry.type === 'Polygon' ? [hn.geometry.coordinates] : hn.geometry.coordinates;
  let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
  polys.forEach(p => p[0].forEach(([x, y]) => { mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y); }));
  const KH = 640 / (mxy - mny), cx0 = 960 - (mnx + mxx) / 2 * KH, cy0 = 590 + (mny + mxy) / 2 * KH;
  const pj = ([x, y]) => [cx0 + x * KH, cy0 - y * KH];
  const inside = (x, y) => polys.some(p => { const r = p[0]; let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; });
  const rP = rng(126), pts = [];
  while (pts.length < 126) { const x = mnx + rP() * (mxx - mnx), y = mny + rP() * (mxy - mny); if (inside(x, y)) pts.push({ p: pj([x, y]), ax: pts.length % 4, d: 0 }); }
  const HUB = pj([105.85, 21.03]);
  pts.forEach(o => { o.d = Math.hypot(o.p[0] - HUB[0], o.p[1] - HUB[1]); });
  const maxD = Math.max(...pts.map(o => o.d));
  const AXC = ['#e5484d', '#f08c2e', '#19b3a6', '#9b6cf2'];
  const cv3 = b3.querySelector('canvas').getContext('2d');
  E.drawers.push(t => {
    if (t < t3 - .3 || t > e17 + 3) return;
    cv3.clearRect(0, 0, 1920, 1080);
    const ap = ease.out2(prog(t, t3, t3 + .8));
    cv3.globalAlpha = ap;
    polys.forEach(p => { cv3.beginPath(); p[0].forEach((c, i) => { const [x, y] = pj(c); i ? cv3.lineTo(x, y) : cv3.moveTo(x, y); }); cv3.closePath(); cv3.fillStyle = 'rgba(20,50,120,.55)'; cv3.fill(); cv3.strokeStyle = 'rgba(242,193,78,.8)'; cv3.lineWidth = 2.5; cv3.stroke(); });
    cv3.globalAlpha = 1;
    let lit = 0;
    pts.forEach(o => {
      const at = t3 + .8 + o.d / maxD * 2.6, u = prog(t, at, at + .5);
      if (u <= 0) { cv3.fillStyle = 'rgba(140,180,255,.25)'; cv3.beginPath(); cv3.arc(o.p[0], o.p[1], 3, 0, 6.283); cv3.fill(); return; }
      lit++;
      const c = AXC[o.ax], lu = ease.out2(u);
      cv3.strokeStyle = E.hexA(c, .55 * lu); cv3.lineWidth = 1.4;
      cv3.beginPath(); cv3.moveTo(HUB[0], HUB[1]); cv3.lineTo(lerp(HUB[0], o.p[0], lu), lerp(HUB[1], o.p[1], lu)); cv3.stroke();
      const pul = .5 + .5 * Math.sin(t * 4 + o.d);
      const g = cv3.createRadialGradient(o.p[0], o.p[1], 0, o.p[0], o.p[1], 12);
      g.addColorStop(0, `rgba(255,255,255,${lu})`); g.addColorStop(.35, E.hexA(c, lu)); g.addColorStop(1, E.hexA(c, 0));
      cv3.fillStyle = g; cv3.beginPath(); cv3.arc(o.p[0], o.p[1], 8 + 3 * pul, 0, 6.283); cv3.fill();
    });
    const hg = cv3.createRadialGradient(HUB[0], HUB[1], 0, HUB[0], HUB[1], 46);
    hg.addColorStop(0, 'rgba(255,246,210,1)'); hg.addColorStop(.4, 'rgba(242,193,78,.9)'); hg.addColorStop(1, 'rgba(242,193,78,0)');
    cv3.fillStyle = hg; cv3.globalAlpha = ap; cv3.beginPath(); cv3.arc(HUB[0], HUB[1], 40 + 5 * Math.sin(t * 3), 0, 6.283); cv3.fill(); cv3.globalAlpha = 1;
    b3.querySelector('.c126 div').textContent = lit;
  });
  E.span(s17, ch.cover, e17 + 3.5);

  /* =============== C18 — KẾT =============== */
  const tV18 = e17 + .9; const e18 = E.voice('c18', tV18);
  tl.to(b3, { opacity: 0, scale: .8, filter: 'blur(10px)', duration: .8, ease: 'power2.in' }, tV18 - .7);
  const lg = $('#logo').getContext('2d');
  const FONT = '900 300px "Be Vietnam Pro"';
  const endS = E.el(`<div class="scene" id="s18"><div class="endw"><span>Kịp thời</span><b>·</b><span>Chính xác</span><b>·</b><span>Minh bạch</span></div>
    <div style="position:absolute;left:0;right:0;top:600px;text-align:center;font-size:32px;font-weight:700;letter-spacing:6px;color:#cfe0ff" class="sl">ĐIỀU HÀNH TRÊN CƠ SỞ DỮ LIỆU</div></div>`, $('#scenes'));
  E.span(endS, tV18 - .5, e18 + 4.5);
  const tLogo = tV18 - .3, tSweep = tV18 + .8;
  E.drawers.push(t => {
    if (t < tLogo) return;
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, 1920, 1080);
    const u = ease.out3(prog(t, tLogo, tLogo + 1.0)), s = lerp(.4, 1, u) * (1 + .03 * prog(t, tLogo, tLogo + 9));
    lg.save(); lg.globalAlpha = u; lg.translate(960, 440); lg.scale(s, s); lg.font = FONT; lg.textAlign = 'center'; lg.textBaseline = 'middle';
    const g = lg.createLinearGradient(0, -110, 0, 110);
    g.addColorStop(0, '#fff6d2'); g.addColorStop(.38, '#f6cc5c'); g.addColorStop(.52, '#a8741a'); g.addColorStop(.62, '#d9a23a'); g.addColorStop(.85, '#ffe7a3'); g.addColorStop(1, '#c58b25');
    lg.shadowColor = 'rgba(242,193,78,.8)'; lg.shadowBlur = 40; lg.fillStyle = g; lg.fillText('IOC', 0, 0); lg.shadowBlur = 0;
    const sw = prog(t, tSweep, tSweep + 1.0);
    if (sw > 0 && sw < 1) { lg.globalCompositeOperation = 'source-atop'; const x = lerp(-600, 600, ease.inOut2(sw)), sg = lg.createLinearGradient(x - 120, 0, x + 120, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); lg.fillStyle = sg; lg.fillRect(-700, -200, 1400, 400); }
    lg.restore();
  });
  // mạng điểm sáng co về logo
  const rN = rng(55), net = Array.from({ length: 220 }, () => { const a = rN() * 6.283, r = 500 + rN() * 900; return { x: 960 + Math.cos(a) * r, y: 540 + Math.sin(a) * r * .6, c: AXC[Math.floor(rN() * 4)] }; });
  E.drawers.push(t => {
    const u = prog(t, tLogo - .6, tLogo + .7); if (u <= 0 || u >= 1) return;
    const fx = E.fxCtx(), e = ease.in3(u);
    net.forEach(n => { const x = lerp(n.x, 960, e), y = lerp(n.y, 440, e); fx.fillStyle = E.hexA(n.c, 1 - u * .5); fx.beginPath(); fx.arc(x, y, 3, 0, 6.283); fx.fill(); });
  });
  E.drawers.push(t => { const dt = t - (tLogo + .7); if (dt >= 0 && dt < .5) E.flash(E.fxCtx(), .8 * (1 - dt / .5), 960, 440, .7); });
  E.burst(tLogo + .7, 960, 440, 120, 77, 900); E.ev(tLogo + .7, 'impact');
  // hiện mượt: giữ nguyên khoảng cách chữ (co giãn khoảng cách làm cả dòng trượt ngang -> giật), mở từ giữa ra hai bên
  tl.fromTo(endS.querySelector('.sl'), { opacity: 0, y: 16, clipPath: 'inset(0% 50% 0% 50%)' }, { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'power3.out' }, E.wordAt('c18', 'trên cơ sở') - .2);
  const words = [...endS.querySelectorAll('.endw span')], dots = [...endS.querySelectorAll('.endw b')];
  ['kịp thời', 'chính xác', 'minh bạch'].forEach((w, i) => { const a = E.wordAt('c18', w) - .1; tl.fromTo(words[i], { opacity: 0, y: 30, scale: .7 }, { opacity: 1, y: 0, scale: 1, duration: .45, ease: 'back.out(2)' }, a); if (i) tl.fromTo(dots[i - 1], { opacity: 0 }, { opacity: 1, duration: .3 }, a - .1); E.ev(a, 'pop'); });
  const T_END = e18 + 1.6;
  tl.fromTo('#fadeBlack', { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power1.in' }, T_END);
  E.ev(T_END, 'end');
  return { end: T_END + 1.45 };
};





