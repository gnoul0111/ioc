/* CẢNH A — INTRO KIỂU MARVEL: tia sáng hội tụ → camera lao xuyên đường hầm màn hình → chữ IOC chứa màn hình → khối vàng → tên hệ thống */
window.S = window.S || {};
S.intro = async function () {
  const { tl, clamp, lerp, prog, ease, rng, $ } = E;
  const SCR = n => `../assets/screens/${n}.png`;
  const FLIP = [
    ['tong-quan', 'Tổng quan điều hành'], ['van-ban-den', 'Văn bản chỉ đạo'], ['nhiem-vu-giao', 'Giao nhiệm vụ'],
    ['so-gddt', 'Chỉ tiêu sở, ngành'], ['gis', 'Bản đồ số'], ['quan-tri', 'Quản trị tài khoản'], ['ban-do-toan-quoc', ''], ['nhiem-vu-nhan', ''], ['so-hcc', ''], ['giao-viec', ''], ['chi-tieu-luoi', ''], ['so-vhtt', ''], ['ubnd-tong-quan', ''], ['co-cau-to-chuc', ''],
    ['dang-to-chuc', ''], ['so-yte', ''], ['trung-uong', ''], ['so-taichinh', ''], ['hdnd-kt-ns', ''], ['so-nnmt', ''], ['sgd-g0', ''], ['dang-ubkt', ''], ['so-noivu', ''], ['sgd-g1', ''],
  ];
  const imgs = {};
  await Promise.all(FLIP.map(async ([n]) => { imgs[n] = await E.loadImg(SCR(n)); }));

  const T_FLASH = 2.75, T_REVEAL = 5.95, T_IMPACT = 8.05;
  /* ---------- lịch nhịp: 6 màn đều nhau (~0,53s/màn, tổng ~3s), màn nào cũng có nhãn ---------- */
  // màn đầu tiên tới đích lúc 3,05s: hiện dần ra từ trong chớp sáng (không bật lên giữa lúc tia sáng còn bay)
  const B0 = 3.05;
  const beats = []; { const NB = 6, d = (T_REVEAL - B0) / NB; for (let k = 0; k < NB; k++) beats.push({ t: B0 + k * d, d }); }
  beats.forEach((b, i) => { const nx = i + 1 < beats.length ? beats[i + 1].t : T_REVEAL; b.d = nx - b.t; });
  beats.push({ t: T_REVEAL, d: 1 });
  const LAST = beats.length - 1;
  const panelImg = k => FLIP[k % FLIP.length][0];
  function Kat(t) {
    if (t < B0) return -2.4 * (1 - ease.out3(prog(t, 2.45, B0)));
    if (t >= T_REVEAL) return LAST;
    let k = 0; while (k + 1 < beats.length && beats[k + 1].t <= t) k++;
    const b = beats[k], u = (t - b.t) / b.d;
    // nhịp chậm: trôi nhẹ rồi lao nhanh tới màn kế tiếp đúng phách; nhịp nhanh: chạy đều
    const hold = u < .7 ? .06 * u / .7 : .06 + .94 * ease.inOut3((u - .7) / .3);   // đứng 70% nhịp cho kịp đọc nhãn, rồi mới chuyển
    const w = clamp((b.d - .12) / .2);
    return k + lerp(u, hold, w);
  }
  const scene = E.el(`<div class="scene" id="tunnel"></div>`, $('#scenes'));
  scene.style.display = 'block'; scene.style.zIndex = 10;
  const tint = E.el(`<div class="layer" id="tunnelTint"></div>`, $('#scenes'));
  const r = rng(41);
  const panels = beats.map((b, k) => {
    const p = E.el(`<div class="tpanel"><img src="${SCR(panelImg(k))}"></div>`, scene);
    const sx = r() < .5 ? -1 : 1, sy = r() < .5 ? -1 : 1;
    p._o = { x: sx * (260 + r() * 360), y: sy * (130 + r() * 200), ry: -sx * (9 + r() * 10), rz: (r() - .5) * 8 };
    p.style.zIndex = 1000 - k;
    return p;
  });
  E.drawers.push(t => {
    if (t < 2.45 || t > T_REVEAL + .05) { scene.style.display = 'none'; return; }
    scene.style.display = 'block';
    scene.style.opacity = ease.out2(prog(t, 2.5, 3.05));   // mờ dần lên từ trong vùng sáng
    const K = Kat(t), D = 1300;
    panels.forEach((p, k) => {
      const rel = K - k;
      if (rel < -5 || rel > .65) { p.style.display = 'none'; return; }
      p.style.display = 'block';
      const u = clamp(-rel, 0, 1.5) / 1.5, o = p._o;
      p.style.transform = `translate3d(${o.x * u}px,${o.y * u}px,${rel * D}px) rotateY(${o.ry * u}deg) rotateZ(${o.rz * u}deg)`;
      const fadeIn = clamp((rel + 5) / 1.6), fadeOut = 1 - clamp((rel - .04) / .28);
      p.style.opacity = Math.min(fadeIn, fadeOut);
      p.style.filter = `brightness(${1 - .6 * clamp(-rel / 3)})${b2(t) ? ' blur(1.2px)' : ''}`;
    });
  });
  const b2 = t => { const K = Kat(t); const k = Math.floor(K); return beats[k] && beats[k].d < .13; };
  tl.set(tint, { display: 'none' }, T_REVEAL);
  // chớp sáng ở các nhịp chậm + nhãn chức năng
  beats.forEach((b, k) => {
    if (k === 0 || k === LAST) return;
    E.ev(b.t, 'beat', { speed: beats[k - 1].d });
    if (beats[k - 1].d > .2) tl.fromTo('#flashW', { opacity: .14 }, { opacity: 0, duration: .16, ease: 'power2.out' }, b.t - .02);
  });
  FLIP.forEach(([n, label], k) => {
    if (!label || k >= LAST || beats[k].d < .26) return;
    const lb = E.el(`<div class="tlabel"><b>${String(k + 1).padStart(2, '0')}</b>${label}</div>`, $('#scenes'));
    lb.style.zIndex = 14;
    const a = beats[k].t, z = a + beats[k].d;
    tl.fromTo(lb, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: .2, ease: 'power3.out' }, a + .02);
    tl.to(lb, { opacity: 0, x: 40, duration: .12, ease: 'power2.in' }, a + .6 * beats[k].d);   // tắt đúng lúc màn bắt đầu chuyển
  });
  E.ev(T_FLASH, 'flash'); E.ev(T_REVEAL, 'reveal'); E.ev(T_IMPACT, 'impact');

  /* ---------- tia sáng hội tụ + chớp sáng ---------- */
  const rL = rng(11);
  const rays = Array.from({ length: 90 }, () => { const a = rL() * Math.PI * 2; return { a, r0: 1150 + rL() * 500, d0: rL() * 1.1, len: 320 + rL() * 520, gold: rL() < .6, w: 1.4 + rL() * 2.4 }; });
  E.drawers.push(t => {
    if (t > 3.6) return;
    const fx = E.fxCtx();
    for (const ry of rays) {
      const u = ease.in3(clamp((t - ry.d0) / (2.45 - ry.d0)));
      if (u <= 0 || u >= 1) continue;
      const head = ry.r0 * (1 - u), tail = Math.min(ry.r0, head + ry.len * (.4 + u));
      const hx = 960 + Math.cos(ry.a) * head, hy = 540 + Math.sin(ry.a) * head * .62, tx = 960 + Math.cos(ry.a) * tail, ty = 540 + Math.sin(ry.a) * tail * .62;
      const g = fx.createLinearGradient(tx, ty, hx, hy), c = ry.gold ? '242,193,78' : '120,190,255', a = Math.min(1, .25 + u * 3);
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(1, `rgba(${c},${a})`);
      fx.strokeStyle = g; fx.lineCap = 'round';
      fx.globalAlpha = .35; fx.lineWidth = ry.w * 5; fx.beginPath(); fx.moveTo(tx, ty); fx.lineTo(hx, hy); fx.stroke();
      fx.globalAlpha = 1; fx.lineWidth = ry.w; fx.beginPath(); fx.moveTo(tx, ty); fx.lineTo(hx, hy); fx.stroke();
      fx.fillStyle = `rgba(255,248,225,${a})`; fx.beginPath(); fx.arc(hx, hy, ry.w * 1.6, 0, 6.283); fx.fill();
    }
    const core = prog(t, 1.2, 2.5);
    if (core > 0 && t < 3.0) {
      const rad = 10 + 60 * ease.in2(core), g = fx.createRadialGradient(960, 540, 0, 960, 540, rad * 3);
      g.addColorStop(0, `rgba(255,248,225,${core})`); g.addColorStop(.3, `rgba(242,193,78,${.6 * core})`); g.addColorStop(1, 'rgba(242,193,78,0)');
      fx.fillStyle = g; fx.fillRect(0, 0, 1920, 1080);
    }
    const fl = t < T_FLASH ? ease.in3(prog(t, 2.45, T_FLASH)) : 1 - ease.out2(prog(t, T_FLASH, 3.5));
    if (fl > 0) E.flash(fx, fl);
  });

  /* ---------- chữ IOC chứa màn hình → khối vàng ---------- */
  const lg = $('#logo').getContext('2d');
  const FONT = '900 410px "Be Vietnam Pro"';
  lg.font = FONT;
  const LET = ['I', 'O', 'C'], GAP = 26;
  const ms = LET.map(ch => lg.measureText(ch));
  const widths = ms.map(m => m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
  const totalW = widths.reduce((a, b) => a + b, 0) + GAP * 2;
  const capH = ms[0].actualBoundingBoxAscent, CY = 470, baseY = CY + capH / 2;
  let xx = 960 - totalW / 2;
  const letters = LET.map((ch, i) => { const L = { ch, x: xx + ms[i].actualBoundingBoxLeft }; xx += widths[i] + GAP; return L; });
  const Icenter = { x: letters[0].x - ms[0].actualBoundingBoxLeft + (ms[0].actualBoundingBoxRight - ms[0].actualBoundingBoxLeft) / 2, y: CY };
  const S0 = 30;
  const off = Array.from({ length: 3 }, () => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; return c; });
  const logoC = document.createElement('canvas'); logoC.width = 1920; logoC.height = 1080;
  const LOGO = { lift: 0 };
  tl.to(LOGO, { lift: 1, duration: .95, ease: 'power3.inOut' }, T_IMPACT + .95);
  const T = { rawS: 1, k: 1, cx: 960, cy: CY, fxp: 960, fyp: CY, dy: 0 };
  function logoT(t) {
    const u = ease.out3(prog(t, T_REVEAL, T_IMPACT + .1));
    T.rawS = Math.exp(lerp(Math.log(S0), 0, u)); T.fxp = lerp(Icenter.x, 960, u); T.fyp = lerp(Icenter.y, CY, u);
    T.cx = 960; T.cy = lerp(540, CY, u);
    T.k = lerp(1, .72, LOGO.lift) * (1 + .03 * prog(t, T_IMPACT, 20)); T.dy = -118 * LOGO.lift;
    return T;
  }
  function applyT(ctx) {
    const s = T.rawS * T.k;
    ctx.setTransform(s, 0, 0, s, 960 + T.k * (T.cx - T.rawS * T.fxp - 960), CY + T.k * (T.cy - T.rawS * T.fyp - CY) + T.dy);
  }
  function imgAt(t, li) {
    const tt = clamp(t, T_REVEAL, T_IMPACT - .25) - T_REVEAL;
    if (tt < .12) return imgs[panelImg(LAST)];
    const idx = Math.floor(tt / .32);   // đổi hình chậm, đỡ nhức mắt
    return imgs[FLIP[(Math.max(0, idx) * 3 + li * 7 + 4) % FLIP.length][0]];
  }
  let T_DISSOLVE = 1e9;
  E.drawers.push(t => {
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, 1920, 1080);
    if (t < T_REVEAL || t > T_DISSOLVE + 1.0) return;
    logoT(t);
    const lc = logoC.getContext('2d');
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, 1920, 1080);
    const gold = ease.out2(prog(t, T_IMPACT, T_IMPACT + .55));
    letters.forEach((L, i) => {
      const c = off[i].getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1920, 1080); c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      applyT(c); c.font = FONT; c.fillStyle = '#fff'; c.fillText(L.ch, L.x - ms[i].actualBoundingBoxLeft, baseY);
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-in';
      if (gold < 1) { const im = imgAt(t, i), z = 1.03 + .04 * Math.sin(t * 2 + i); c.drawImage(im, 960 - 960 * z, 540 - 540 * z, 1920 * z, 1080 * z); }
      c.globalCompositeOperation = 'source-atop';
      if (gold > 0) {
        c.globalAlpha = gold; applyT(c);
        const g = c.createLinearGradient(0, baseY - capH, 0, baseY);
        g.addColorStop(0, '#fff6d2'); g.addColorStop(.38, '#f6cc5c'); g.addColorStop(.52, '#a8741a'); g.addColorStop(.62, '#d9a23a'); g.addColorStop(.85, '#ffe7a3'); g.addColorStop(1, '#c58b25');
        c.fillStyle = g; c.fillRect(-2000, -2000, 6000, 6000); c.setTransform(1, 0, 0, 1, 0, 0);
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      lc.drawImage(off[i], 0, 0);
    });
    const sw = prog(t, T_IMPACT + .45, T_IMPACT + 1.35);
    if (sw > 0 && sw < 1) {
      lc.globalCompositeOperation = 'source-atop';
      const x = lerp(-400, 2300, ease.inOut2(sw)), g = lc.createLinearGradient(x - 220, 0, x + 220, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,240,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      lc.setTransform(1, 0, -.35, 1, 0, 0); lc.fillStyle = g; lc.fillRect(-600, 0, 3200, 1080);
      lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'source-over';
    }
    const dz = prog(t, T_DISSOLVE, T_DISSOLVE + .9);
    if (dz > 0) {
      lc.globalCompositeOperation = 'destination-out';
      const edge = lerp(560, 1400, dz), g = lc.createLinearGradient(edge - 90, 0, edge + 30, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g; lc.fillRect(0, 0, 1920, 1080); lc.globalCompositeOperation = 'source-over';
    }
    lg.save(); lg.shadowColor = 'rgba(242,193,78,.85)'; lg.shadowBlur = 24 + 30 * gold; lg.drawImage(logoC, 0, 0); lg.restore();
    if (gold < 1) {
      applyT(lg); lg.font = FONT; lg.lineWidth = 4 / (T.rawS * T.k); lg.strokeStyle = `rgba(255,214,120,${.9 * (1 - gold)})`;
      letters.forEach((L, i) => lg.strokeText(L.ch, L.x - ms[i].actualBoundingBoxLeft, baseY));
      lg.setTransform(1, 0, 0, 1, 0, 0);
    }
  });
  // chớp + tia lửa khi chốt; chớp nhẹ lúc bắt đầu lộ chữ
  E.drawers.push(t => { const dt = t - T_IMPACT; if (dt >= 0 && dt < .5) E.flash(E.fxCtx(), 1 - ease.out2(dt / .5), 960, CY, .8); });
  E.drawers.push(t => { const dt = t - T_REVEAL; if (dt >= -.05 && dt < .25) E.flash(E.fxCtx(), .6 * (1 - clamp(dt / .25)), 960, 540, 1); });
  E.burst(T_IMPACT, 960, CY, 170, 23, 1100);

  /* ---------- tên hệ thống, hiện theo nhịp đọc ---------- */
  const T_V1 = T_IMPACT + 1.25;
  const endV1 = E.voice('c2', T_V1);
  T_DISSOLVE = endV1 + .45;
  const title = E.el(`<div class="layer" id="title"><div class="t1"></div><div class="rule"></div><div class="t2"></div></div>`, $('#scenes'));
  const t1 = title.querySelector('.t1'), t2 = title.querySelector('.t2');
  const T1W = [['TRUNG TÂM', 'trung tâm'], ['ĐIỀU HÀNH', 'điều hành'], ['THÔNG MINH', 'thông minh']];
  const T2W = [['Phục vụ công tác', 'phục vụ'], ['quản lý,', 'quản lý'], ['chỉ đạo', 'chỉ đạo'], ['và điều hành', 'và điều hành'], ['của Thành phố Hà Nội', 'của thành phố']];
  t1.innerHTML = T1W.map(w => `<span>${w[0]}</span>`).join('');
  t2.innerHTML = T2W.map(w => `<span>${w[0]}</span>`).join('');
  [...t1.children].forEach((sp, i) => tl.fromTo(sp, { opacity: 0, y: 34, filter: 'blur(12px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .5, ease: 'power3.out' }, E.wordAt('c2', T1W[i][1]) - .12));
  [...t2.children].forEach((sp, i) => tl.fromTo(sp, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .45, ease: 'power2.out' }, E.wordAt('c2', T2W[i][1], T2W[i][2] || 1) - .1));
  tl.fromTo(title.querySelector('.rule'), { scaleX: 0 }, { scaleX: 1, duration: .8, ease: 'power2.out' }, E.wordAt('c2', 'phục vụ') - .3);
  tl.to(title, { opacity: 0, filter: 'blur(10px)', y: -20, duration: .7, ease: 'power2.in' }, T_DISSOLVE + .15);
  E.span(title, T_IMPACT, T_DISSOLVE + 1);
  // hạt vàng bay ra theo dải tan biến
  const rD = rng(31);
  const dust = Array.from({ length: 900 }, () => ({ x: 560 + rD() * 840, y: 250 + rD() * 215, vx: 80 + rD() * 260, vy: -60 - rD() * 160, life: .8 + rD() * .9, r: .8 + rD() * 1.8 }));
  E.drawers.push(t => {
    if (t < T_DISSOLVE || t > T_DISSOLVE + 2.6) return;
    const fx = E.fxCtx();
    for (const p of dust) {
      const td = T_DISSOLVE + (p.x - 560) / 840 * .9, dt = t - td;
      if (dt < 0 || dt > p.life) continue;
      const k = dt / p.life;
      fx.fillStyle = `rgba(255,${210 + 30 * (1 - k) | 0},130,${(1 - k) * .9})`;
      fx.beginPath(); fx.arc(p.x + p.vx * dt, p.y + p.vy * dt + 30 * dt * dt, p.r, 0, 6.283); fx.fill();
    }
  });
  E.ev(T_DISSOLVE, 'dissolve');
  return { end: T_DISSOLVE + .35 };
};




