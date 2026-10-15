/* Đoạn demo ~47s: Intro kiểu Marvel (C1–C2) → Sơ đồ dữ liệu chảy (C9) → Băng chuyền chỉ tiêu + tách lớp (C13). */
(async function () {
  const { tl, clamp, lerp, prog, ease, rng, $ } = E;
  E.timing = await (await fetch('../demo/audio/timing.json')).json();
  await Promise.all([400, 500, 600, 700, 800, 900].map(w => document.fonts.load(`${w} 40px "Be Vietnam Pro"`)));
  await document.fonts.load('900 400px "Be Vietnam Pro"');

  const SCR = n => `../assets/screens/${n}.png`;
  const PART = n => `../assets/parts/${n}.png`;

  /* =====================================================================
     CẢNH A — INTRO KIỂU MARVEL
     ===================================================================== */
  const FLIP = [
    ['tong-quan', 'Tổng quan điều hành'], ['van-ban-den', 'Văn bản đến – đi'], ['nhiem-vu-giao', 'Nhiệm vụ giao'],
    ['nhiem-vu-nhan', 'Nhiệm vụ nhận'], ['gis', 'Bản đồ số'], ['chi-tieu-luoi', 'Chỉ tiêu theo lĩnh vực'],
    ['so-hcc', 'Hành chính công'], ['ban-do-toan-quoc', 'Bản đồ toàn quốc'], ['giao-viec', 'Giao việc'],
    ['co-cau-to-chuc', 'Cơ cấu tổ chức'], ['quan-tri', 'Quản trị tài khoản'],
    ['ubnd-tong-quan'], ['so-vhtt'], ['so-gddt'], ['dang-to-chuc'], ['so-yte'], ['trung-uong'],
    ['so-taichinh'], ['hdnd-kt-ns'], ['so-nnmt'], ['dang-ubkt'], ['so-noivu'],
  ];
  const imgs = {};
  await Promise.all(FLIP.map(async ([n]) => { imgs[n] = await E.loadImg(SCR(n)); }));

  const T_FLASH = 2.75, T_REVEAL = 10.2, T_IMPACT = 12.3;
  // Lịch lật: chậm rồi nhanh dần
  const flips = []; { let t = T_FLASH, d = 0.62; while (t < T_REVEAL - 0.04) { flips.push({ t, d: Math.min(d, T_REVEAL - t) }); t += d; d = Math.max(0.075, d * 0.87); } }
  const cam = $('#flipCam');
  flips.forEach((f, k) => {
    const [name, label] = FLIP[k % FLIP.length];
    const p = document.createElement('div'); p.className = 'fpage'; p.style.zIndex = 1000 - k;
    p.innerHTML = `<img src="${SCR(name)}"><div class="shade"></div>`;
    cam.appendChild(p);
    const tOn = f.t, tFlip = f.t + f.d, fd = Math.min(0.34, f.d * 0.8);
    const prevFd = k ? Math.min(0.34, flips[k - 1].d * 0.8) : 0;
    // preserve-3d bỏ qua z-index -> xếp chồng bằng độ sâu z (trang trước nằm trên)
    const zk = -k * 3;
    if (k === 0) tl.fromTo(p, { opacity: 0, scale: .55, z: -500 }, { opacity: 1, scale: 1, z: zk, duration: .6, ease: 'power3.out' }, tOn - .15);
    else tl.fromTo(p, { opacity: 0, z: zk }, { opacity: 1, z: zk, duration: .001 }, tOn - .002);
    if (f.d < 0.13) tl.set(p, { filter: 'blur(1.4px) brightness(1.15)' }, tOn);
    if (tFlip < T_REVEAL) {
      tl.to(p, { rotationY: -118, duration: fd, ease: 'power1.in' }, tFlip);
      tl.to(p.querySelector('.shade'), { opacity: .85, duration: fd, ease: 'power1.in' }, tFlip);
      tl.set(p, { opacity: 0 }, tFlip + fd);
      E.ev(tFlip, 'flip', { speed: f.d });
    }
    if (label && label.length && f.d >= 0.24 && k < FLIP.length) {
      const lb = document.createElement('div'); lb.id = ''; lb.className = 'flabel';
      lb.style.cssText = 'position:absolute;left:110px;bottom:118px;padding:14px 26px;border-radius:8px;background:rgba(3,10,30,.85);border:2px solid #f2c14e;font-size:34px;font-weight:700;letter-spacing:1px;box-shadow:0 0 30px rgba(242,193,78,.35);opacity:0';
      lb.innerHTML = `<b style="color:#f2c14e;margin-right:12px">${String(k + 1).padStart(2, '0')}</b>${label}`;
      $('#flipLabels').appendChild(lb);
      // nhãn hiện khi trang trước đã lật gần hết (trang này lộ rõ)
      tl.fromTo(lb, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: Math.min(.22, f.d * .35), ease: 'power3.out' }, tOn + prevFd * .6);
      tl.to(lb, { opacity: 0, x: 40, duration: .12, ease: 'power2.in' }, tFlip - .1);
    }
  });
  // Camera trôi, xoay và đẩy dần vào cho tới khi trang phủ kín khung hình
  tl.fromTo(cam, { rotationX: 16, rotationY: -20, rotationZ: -3, scale: .72 }, { rotationX: -5, rotationY: 9, rotationZ: 2, scale: 1.0, duration: 8.4 - T_FLASH, ease: 'sine.inOut' }, T_FLASH);
  tl.to(cam, { rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1.2, duration: T_REVEAL - 8.4, ease: 'power2.in' }, 8.4);
  tl.fromTo('#flipTint', { opacity: .5 }, { opacity: 1, duration: T_REVEAL - T_FLASH, ease: 'none' }, T_FLASH);
  tl.set('#flipWrap', { display: 'none' }, T_REVEAL);
  tl.set('#flipLabels', { display: 'none' }, T_REVEAL);
  E.ev(T_FLASH, 'flash'); E.ev(T_IMPACT, 'impact'); E.ev(T_REVEAL, 'reveal');

  /* ---------- A1: đường sáng hội tụ + chớp sáng (vẽ trên #fx) ---------- */
  const rL = rng(11);
  const rays = Array.from({ length: 90 }, () => {
    const a = rL() * Math.PI * 2, r0 = 1150 + rL() * 500;
    return { a, r0, d0: rL() * 1.1, len: 320 + rL() * 520, gold: rL() < .6, w: 1.4 + rL() * 2.4 };
  });
  const fx = $('#fx').getContext('2d');
  function drawIntroFx(t) {
    if (t > 3.6) return;
    for (const r of rays) {
      const u = ease.in3(clamp((t - r.d0) / (2.45 - r.d0)));
      if (u <= 0 || u >= 1) continue;
      const head = r.r0 * (1 - u), tail = Math.min(r.r0, head + r.len * (0.4 + u));
      const hx = 960 + Math.cos(r.a) * head, hy = 540 + Math.sin(r.a) * head * .62;
      const tx = 960 + Math.cos(r.a) * tail, ty = 540 + Math.sin(r.a) * tail * .62;
      const g = fx.createLinearGradient(tx, ty, hx, hy);
      const c = r.gold ? '242,193,78' : '120,190,255';
      const a = Math.min(1, .25 + u * 3);
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(1, `rgba(${c},${a})`);
      fx.strokeStyle = g; fx.lineCap = 'round';
      // 2 lớp: quầng rộng mờ + lõi sáng mảnh
      fx.globalAlpha = .35; fx.lineWidth = r.w * 5; fx.beginPath(); fx.moveTo(tx, ty); fx.lineTo(hx, hy); fx.stroke();
      fx.globalAlpha = 1; fx.lineWidth = r.w; fx.beginPath(); fx.moveTo(tx, ty); fx.lineTo(hx, hy); fx.stroke();
      fx.fillStyle = `rgba(255,248,225,${a})`; fx.beginPath(); fx.arc(hx, hy, r.w * 1.6, 0, 6.283); fx.fill();
    }
    // điểm sáng trung tâm lớn dần
    const core = prog(t, 1.2, 2.5);
    if (core > 0 && t < 3.0) {
      const rad = 10 + 60 * ease.in2(core);
      const g = fx.createRadialGradient(960, 540, 0, 960, 540, rad * 3);
      g.addColorStop(0, `rgba(255,248,225,${core})`); g.addColorStop(.3, `rgba(242,193,78,${.6 * core})`); g.addColorStop(1, 'rgba(242,193,78,0)');
      fx.fillStyle = g; fx.fillRect(0, 0, 1920, 1080);
    }
    // chớp sáng bung ra
    const fl = t < T_FLASH ? ease.in3(prog(t, 2.45, T_FLASH)) : 1 - ease.out2(prog(t, T_FLASH, 3.5));
    if (fl > 0) flash(fl, 1.0);
  }
  function flash(a, size) {
    const g = fx.createRadialGradient(960, 540, 0, 960, 540, 1300 * size);
    g.addColorStop(0, `rgba(255,250,235,${a})`); g.addColorStop(.35, `rgba(255,226,150,${.75 * a})`); g.addColorStop(1, 'rgba(242,193,78,0)');
    fx.fillStyle = g; fx.fillRect(0, 0, 1920, 1080);
    // vệt sáng ngang kiểu ống kính điện ảnh
    const h = fx.createLinearGradient(0, 0, 1920, 0);
    h.addColorStop(0, 'rgba(255,220,140,0)'); h.addColorStop(.5, `rgba(255,240,200,${.8 * a})`); h.addColorStop(1, 'rgba(255,220,140,0)');
    fx.fillStyle = h; fx.fillRect(0, 536 - 6 * a, 1920, 12 * a);
  }

  /* ---------- A3–A4: chữ IOC chứa màn hình bên trong → khối vàng ---------- */
  const lg = $('#logo').getContext('2d');
  const FONT = '900 410px "Be Vietnam Pro"';
  lg.font = FONT;
  const LET = ['I', 'O', 'C'], GAP = 26;
  const ms = LET.map(ch => lg.measureText(ch));
  const widths = ms.map(m => m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
  const totalW = widths.reduce((a, b) => a + b, 0) + GAP * 2;
  const capH = ms[0].actualBoundingBoxAscent;
  const CY = 470, baseY = CY + capH / 2;
  let xx = 960 - totalW / 2;
  const letters = LET.map((ch, i) => { const L = { ch, x: xx + ms[i].actualBoundingBoxLeft, w: widths[i] }; xx += widths[i] + GAP; return L; });
  const Icenter = { x: letters[0].x + letters[0].w / 2 - ms[0].actualBoundingBoxLeft + ms[0].actualBoundingBoxLeft, y: CY };
  Icenter.x = letters[0].x - ms[0].actualBoundingBoxLeft + (ms[0].actualBoundingBoxRight - ms[0].actualBoundingBoxLeft) / 2;
  const S0 = 30;
  const off = Array.from({ length: 3 }, () => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; return c; });
  const logoC = document.createElement('canvas'); logoC.width = 1920; logoC.height = 1080;
  const LOGO = { lift: 0, fade: 1 };
  tl.to(LOGO, { lift: 1, duration: .95, ease: 'power3.inOut' }, 13.25);

  function logoTransform(t) {
    const u = ease.out3(prog(t, T_REVEAL, T_IMPACT + .1));
    const s = Math.exp(lerp(Math.log(S0), 0, u));
    const fxp = lerp(Icenter.x, 960, u), fyp = lerp(Icenter.y, CY, u);
    const cx = 960, cy = lerp(540, CY, u);
    // sau khi chốt: nâng lên, thu nhỏ để nhường chỗ cho tên hệ thống + phóng rất chậm
    const k = lerp(1, .72, LOGO.lift) * (1 + .03 * prog(t, T_IMPACT, 22));
    const dy = -118 * LOGO.lift;
    return { a: s * k, e: cx + (-fxp * s) * k + (1 - k) * 0 + (k - 1) * 0, f: 0, s: s * k, fxp, fyp, cx, cy, k, dy, rawS: s };
  }
  // ánh xạ điểm trong không gian chữ -> màn hình
  function applyT(ctx, T) {
    // p' = M + k*((C + s*(p - f)) - M) + (0,dy), với M = (960, CY)
    const s = T.rawS * T.k;
    const ex = 960 + T.k * (T.cx - T.rawS * T.fxp - 960);
    const ey = CY + T.k * (T.cy - T.rawS * T.fyp - CY) + T.dy;
    ctx.setTransform(s, 0, 0, s, ex, ey);
  }
  function imgAt(t, li) {
    // nhịp đổi hình trong chữ: nhanh rồi chậm dần, dừng hẳn trước khi chốt vàng
    const tt = clamp(t, T_REVEAL, T_IMPACT - .25) - T_REVEAL;
    const idx = Math.floor(tt / 0.085 - tt * tt * 2.2);
    return imgs[FLIP[(Math.max(0, idx) * 3 + li * 7 + 4) % FLIP.length][0]];
  }
  function drawLogo(t) {
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, 1920, 1080);
    if (t < T_REVEAL || LOGO_HIDDEN(t)) return;
    const T = logoTransform(t);
    const lc = logoC.getContext('2d');
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, 1920, 1080);
    const gold = ease.out2(prog(t, T_IMPACT, T_IMPACT + .55));
    // từng chữ: vẽ hình chữ -> phủ màn hình bên trong (cố định theo khung hình, như cửa sổ nhìn vào)
    letters.forEach((L, i) => {
      const c = off[i].getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1920, 1080);
      c.globalCompositeOperation = 'source-over';
      applyT(c, T); c.font = FONT; c.fillStyle = '#fff'; c.fillText(L.ch, L.x - ms[i].actualBoundingBoxLeft, baseY);
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-in';
      if (gold < 1) {
        const im = imgAt(t, i), z = 1.04 + .04 * Math.sin(t * 2 + i);
        c.globalAlpha = 1; c.drawImage(im, 960 - 960 * z, 540 - 540 * z, 1920 * z, 1080 * z);
      }
      // các lớp phủ sau phải dùng source-atop (source-in sẽ thay luôn hình bên dưới)
      c.globalCompositeOperation = 'source-atop';
      if (gold > 0) {
        c.globalAlpha = gold;
        applyT(c, T);
        const g = c.createLinearGradient(0, baseY - capH, 0, baseY);
        g.addColorStop(0, '#fff6d2'); g.addColorStop(.38, '#f6cc5c'); g.addColorStop(.52, '#a8741a'); g.addColorStop(.62, '#d9a23a'); g.addColorStop(.85, '#ffe7a3'); g.addColorStop(1, '#c58b25');
        c.fillStyle = g; c.fillRect(-2000, -2000, 6000, 6000);
        c.setTransform(1, 0, 0, 1, 0, 0);
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      lc.drawImage(off[i], 0, 0);
    });
    // vệt sáng quét qua khối vàng
    const sw = prog(t, T_IMPACT + .45, T_IMPACT + 1.35);
    if (sw > 0 && sw < 1) {
      lc.globalCompositeOperation = 'source-atop';
      const x = lerp(-400, 2300, ease.inOut2(sw));
      const g = lc.createLinearGradient(x - 220, 0, x + 220, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,240,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      lc.setTransform(1, 0, -.35, 1, 0, 0); lc.fillStyle = g; lc.fillRect(-600, 0, 3200, 1080);
      lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'source-over';
    }
    // tan biến theo dải từ trái sang phải
    const dz = prog(t, T_DISSOLVE, T_DISSOLVE + .9);
    if (dz > 0) {
      lc.globalCompositeOperation = 'destination-out';
      const edge = lerp(560, 1400, dz);
      const g = lc.createLinearGradient(edge - 90, 0, edge + 30, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g; lc.fillRect(0, 0, 1920, 1080);
      lc.globalCompositeOperation = 'source-over';
    }
    // viền vàng phát sáng
    lg.save();
    lg.shadowColor = 'rgba(242,193,78,.85)'; lg.shadowBlur = 24 + 30 * gold;
    lg.drawImage(logoC, 0, 0);
    lg.restore();
    if (gold < 1 && dz === 0) {
      applyT(lg, T); lg.font = FONT; lg.lineWidth = 4 / (T.rawS * T.k); lg.strokeStyle = `rgba(255,214,120,${.9 * (1 - gold)})`;
      letters.forEach((L, i) => lg.strokeText(L.ch, L.x - ms[i].actualBoundingBoxLeft, baseY));
      lg.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  /* ---------- tia lửa khi chốt logo + hạt khi tan biến ---------- */
  const rS = rng(23);
  const sparks = Array.from({ length: 160 }, () => { const a = rS() * 6.283, v = 300 + rS() * 900; return { vx: Math.cos(a) * v, vy: Math.sin(a) * v * .7, life: .6 + rS() * .9, r: 1 + rS() * 2.2 }; });
  function drawSparks(t) {
    const dt = t - T_IMPACT;
    if (dt < 0 || dt > 1.6) return;
    if (dt < .5) flash(1 - ease.out2(dt / .5), .8);
    for (const s of sparks) {
      if (dt > s.life) continue;
      const k = dt / s.life, x = 960 + s.vx * dt * (1 - k * .5), y = CY + s.vy * dt * (1 - k * .5) + 120 * dt * dt;
      fx.fillStyle = `rgba(255,${200 + 40 * (1 - k) | 0},120,${1 - k})`;
      fx.beginPath(); fx.arc(x, y, s.r * (1 - k * .6), 0, 6.283); fx.fill();
    }
  }

  /* ---------- tên hệ thống, hiện theo nhịp đọc ---------- */
  const T_V1 = 13.55;
  const endV1 = E.voice('c2', T_V1);
  const T_DISSOLVE = endV1 + 0.45;
  const LOGO_HIDDEN = t => t > T_DISSOLVE + 1.0;
  E.ev(T_V1, 'voice', { id: 'c2' });

  const t1 = $('#title .t1'), t2 = $('#title .t2');
  const T1W = [['HỆ THỐNG', 'hệ thống'], ['TRUNG TÂM', 'trung tâm'], ['ĐIỀU HÀNH', 'điều hành'], ['THÔNG MINH', 'thông minh']];
  const T2W = [['Phục vụ công tác', 'phục vụ'], ['lãnh đạo,', 'lãnh đạo'], ['chỉ đạo,', 'chỉ đạo'], ['điều hành', 'điều hành', 2], ['của Thành phố Hà Nội', 'của thành phố']];
  t1.innerHTML = T1W.map(w => `<span>${w[0]}</span>`).join('');
  t2.innerHTML = T2W.map(w => `<span>${w[0]}</span>`).join('');
  [...t1.children].forEach((sp, i) => tl.fromTo(sp, { opacity: 0, y: 34, filter: 'blur(12px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .5, ease: 'power3.out' }, E.wordAt('c2', T1W[i][1]) - .12));
  [...t2.children].forEach((sp, i) => tl.fromTo(sp, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .45, ease: 'power2.out' }, E.wordAt('c2', T2W[i][1], T2W[i][2] || 1) - .1));
  tl.fromTo('#title .rule', { scaleX: 0 }, { scaleX: 1, duration: .8, ease: 'power2.out' }, E.wordAt('c2', 'phục vụ') - .3);
  tl.to('#title', { opacity: 0, filter: 'blur(10px)', y: -20, duration: .7, ease: 'power2.in' }, T_DISSOLVE + .15);
  tl.set('#title', { display: 'none' }, T_DISSOLVE + 1.0);

  // hạt bụi vàng bay ra từ mép dải tan biến
  const rD = rng(31);
  const dust = Array.from({ length: 900 }, () => ({ x: 560 + rD() * 840, y: CY - 118 * .72 - 150 + rD() * 300 * .72 + 40, vx: 80 + rD() * 260, vy: -60 - rD() * 160, life: .8 + rD() * .9, r: .8 + rD() * 1.8 }));
  function drawDissolve(t) {
    if (t < T_DISSOLVE || t > T_DISSOLVE + 2.6) return;
    for (const p of dust) {
      const td = T_DISSOLVE + (p.x - 560) / 840 * .9, dt = t - td;
      if (dt < 0 || dt > p.life) continue;
      const k = dt / p.life;
      fx.fillStyle = `rgba(255,${210 + 30 * (1 - k) | 0},130,${(1 - k) * .9})`;
      fx.beginPath(); fx.arc(p.x + p.vx * dt, p.y + p.vy * dt + 30 * dt * dt, p.r, 0, 6.283); fx.fill();
    }
  }
  E.drawers.push(t => { fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, 1920, 1080); drawIntroFx(t); drawSparks(t); drawDissolve(t); });
  E.drawers.push(drawLogo);

  /* =====================================================================
     CẢNH B — SƠ ĐỒ: HỆ THỐNG NGUỒN → DATA HUB (C9)
     ===================================================================== */
  const T_CH2 = T_DISSOLVE + 0.7;
  const T_B0 = E.chapter(T_CH2, '02', 'Giải pháp & kiến trúc');
  const T_V2 = T_CH2 + 1.55;
  const endV2 = E.voice('c9', T_V2);
  E.ev(T_V2, 'voice', { id: 'c9' });

  const person = c => `<svg viewBox="0 0 24 24" style="color:${c}"><circle cx="12" cy="7" r="4.2" fill="currentColor"/><path d="M3.5 22c0-4.9 3.8-8.6 8.5-8.6s8.5 3.7 8.5 8.6" fill="currentColor"/></svg>`;
  const icon = {
    up: '<svg class="ic" viewBox="0 0 48 48" fill="none" stroke="#7fb2ff" stroke-width="3"><path d="M14 34h-2a9 9 0 0 1-1-18 12 12 0 0 1 23-2 8 8 0 0 1 2 20h-3"/><path d="M24 40V22m-7 7 7-7 7 7"/></svg>',
    db: '<svg class="ic" viewBox="0 0 48 48" fill="none" stroke="#4fd18b" stroke-width="3"><ellipse cx="24" cy="10" rx="14" ry="5"/><path d="M10 10v28c0 2.8 6.3 5 14 5s14-2.2 14-5V10M10 24c0 2.8 6.3 5 14 5s14-2.2 14-5"/></svg>',
    hub: '<svg class="ic" viewBox="0 0 48 48" fill="none" stroke="#b18cff" stroke-width="3"><ellipse cx="24" cy="12" rx="13" ry="5"/><path d="M11 12v12c0 2.8 5.8 5 13 5s13-2.2 13-5V12"/><path d="M11 24v12c0 2.8 5.8 5 13 5s13-2.2 13-5V24"/></svg>',
    api: '<svg class="ic" viewBox="0 0 48 48" fill="none" stroke="#4cc9ff" stroke-width="3"><rect x="6" y="12" width="36" height="24" rx="12"/><path d="M15 29l3-10 3 10m-5.2-3.5h4.4M25 29V19h3.5a2.8 2.8 0 0 1 0 5.6H25M35 19v10"/></svg>',
  };
  const T3CH = ['Quản lý chỉ đạo điều hành', 'Quản lý văn bản', 'Quản lý công việc, nhiệm vụ', 'Báo cáo chuyên ngành', 'Theo dõi tiến độ', 'Cảnh báo', 'IOC/Dashboard'];
  const T6CH = ['Dashboard Thành ủy', 'Dashboard HĐND', 'Dashboard UBND', 'Dashboard MTTQ', 'Dashboard Sở/Ngành', 'Bản đồ GIS', 'AI tóm tắt báo cáo', 'Cảnh báo thông minh'];
  const SUBS = [
    ['1. Tiếp nhận & tích hợp dữ liệu', ['API Gateway', 'ESB / Message Bus', 'CDC / Streaming', 'ETL / ELT'], icon.up],
    ['2. Chuẩn hóa & quản trị dữ liệu', ['Data Quality', 'Metadata', 'Master Data', 'Mapping'], icon.db],
    ['3. Data Hub / Data Mart', ['Dữ liệu văn bản, nhiệm vụ', 'Dữ liệu KPI/OKR', 'Dữ liệu phản ánh, cán bộ', 'Dữ liệu chuyên ngành'], icon.hub],
    ['4. Data Service', ['API Service', 'Query Service', 'Dashboard Service', 'Report Service'], icon.api],
  ];
  const SRC = [
    { key: 'xa', x: 400, w: 470, num: 126, pad: 3, lbl: 'phường / xã', color: '#3fd38a', say: ['một trăm hai mươi sáu'] },
    { key: 'so', x: 905, w: 440, num: 14, pad: 2, lbl: 'sở', color: '#5b9bff', say: ['mười bốn'] },
    { key: 'ns', x: 1380, w: 480, num: 3, pad: 2, lbl: 'đơn vị ngang cấp sở', color: '#3fd0e0', say: ['ba đơn vị'] },
  ];
  const dgCam = $('#dgCam');
  dgCam.innerHTML = `
    <div class="tlabel t3 dim" style="top:58px"><div class="no">3</div><div class="tx">Nền tảng điều hành<br>& tác nghiệp dùng chung</div></div>
    <div class="tlabel t4" style="top:252px"><div class="no">4</div><div class="tx">Hệ thống nguồn /<br>đơn vị thực thi</div></div>
    <div class="tlabel t5" style="top:562px"><div class="no">5</div><div class="tx">Data Hub &<br>Data Platform</div></div>
    <div class="tlabel t6 dim" style="top:832px"><div class="no">6</div><div class="tx">Kho dữ liệu và<br>IOC tổng hợp</div></div>
    <div class="dbox tier3 dim" style="left:400px;top:30px;width:1460px;height:122px"><div class="band-title" style="font-size:20px">NỀN TẢNG ĐIỀU HÀNH & TÁC NGHIỆP DÙNG CHUNG</div>
      <div class="chips">${T3CH.map(c => `<div class="chip">${c}</div>`).join('')}</div></div>
    ${SRC.map(s => `<div class="dbox src" id="src-${s.key}" style="left:${s.x}px;top:190px;width:${s.w}px;height:180px;border-color:${s.color}66">
      <div class="num" style="color:${s.color}">0</div><div class="lbl">${s.lbl}</div>
      <div class="people">${Array.from({ length: 6 }, () => person(s.color)).join('')}</div><div class="glow"></div></div>`).join('')}
    <div class="dbox hub" style="left:400px;top:420px;width:1460px;height:345px;border-color:rgba(242,193,78,.4)">
      <div class="hub-title">DATA HUB & DATA PLATFORM</div>
      ${SUBS.map((s, i) => `<div class="sub" id="sub${i}" style="left:${20 + i * 361}px">${s[2]}<div class="h">${s[0]}</div><ul>${s[1].map(x => `<li>${x}</li>`).join('')}</ul><div class="glow"></div></div>`).join('')}
    </div>
    <div class="dbox tier6 dim" style="left:400px;top:800px;width:1460px;height:122px"><div class="band-title" style="font-size:20px">KHO DỮ LIỆU VÀ IOC TỔNG HỢP</div>
      <div class="chips">${T6CH.map(c => `<div class="chip t6chip">${c}<div class="glow"></div></div>`).join('')}</div></div>
    <canvas id="dgFx" width="1920" height="1080" style="position:absolute;left:0;top:0;width:1920px;height:1080px;mix-blend-mode:screen"></canvas>`;
  dgCam.querySelectorAll('.chip').forEach(c => c.style.position = 'relative');
  $('#dgWrap').style.display = 'block';
  const rect = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; };
  const subR = [0, 1, 2, 3].map(i => rect($('#sub' + i)));
  const srcR = SRC.map(s => rect($('#src-' + s.key)));
  const chipR = [...dgCam.querySelectorAll('.t6chip')].map(rect);
  $('#dgWrap').style.display = 'none';

  tl.set('#dgWrap', { display: 'block' }, T_B0);
  tl.set(['#logo'], { display: 'none' }, T_B0);
  tl.fromTo(dgCam, { rotationX: 30, y: 140, scale: .82, opacity: .2 }, { rotationX: 5, y: 12, scale: .96, opacity: 1, duration: 2.2, ease: 'power3.out' }, T_B0 - .2);
  tl.to(dgCam, { rotationX: 0, rotationY: 2, x: 18, y: -4, scale: 1.02, duration: endV2 + 1.6 - (T_B0 + 2.0), ease: 'sine.inOut' }, T_B0 + 2.0);
  tl.fromTo(dgCam.querySelectorAll('.tlabel'), { opacity: 0, x: -40 }, { opacity: (i, el) => el.classList.contains('dim') ? .28 : 1, x: 0, duration: .6, stagger: .1, ease: 'power3.out' }, T_B0 + .1);
  tl.fromTo([dgCam.querySelector('.tier3'), dgCam.querySelector('.tier6')], { opacity: 0, y: 30 }, { opacity: .28, y: 0, duration: .7, stagger: .15, ease: 'power3.out' }, T_B0 + .2);
  tl.fromTo(dgCam.querySelector('.hub'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, T_B0 + .35);
  tl.fromTo(dgCam.querySelectorAll('.sub'), { opacity: 0, y: 30, scale: .94 }, { opacity: 1, y: 0, scale: 1, duration: .6, stagger: .12, ease: 'back.out(1.6)' }, T_B0 + .6);
  // 3 khối nguồn bật lên đúng lúc được đọc tên
  const srcT = SRC.map(s => E.wordAt('c9', s.say[0]) - .15);
  SRC.forEach((s, i) => {
    const el = $('#src-' + s.key);
    tl.fromTo(el, { opacity: 0, y: 50, scale: .85 }, { opacity: 1, y: 0, scale: 1, duration: .7, ease: 'back.out(1.7)' }, srcT[i]);
    tl.fromTo(el.querySelectorAll('.people svg'), { opacity: 0, y: 14, scale: .4 }, { opacity: 1, y: 0, scale: 1, duration: .35, stagger: .06, ease: 'back.out(2)' }, srcT[i] + .25);
    tl.fromTo(el.querySelector('.glow'), { opacity: 0 }, { opacity: 1, duration: .25, yoyo: true, repeat: 1, ease: 'power2.out' }, srcT[i] + .1);
    E.ev(srcT[i], 'pop');
  });
  // số đếm lên
  E.drawers.push(t => {
    SRC.forEach((s, i) => {
      const u = ease.out3(prog(t, srcT[i] + .1, srcT[i] + 1.1));
      $('#src-' + s.key + ' .num').textContent = String(Math.round(s.num * u)).padStart(s.pad, '0');
    });
  });
  // dòng dữ liệu
  const tFlowA = E.wordAt('c9', 'được tiếp nhận') - .35;
  const tFlowB = E.wordAt('c9', 'chuẩn hóa') - .25;
  const tFlowC = E.wordAt('c9', 'nền tảng') - .3;
  const tFlowD = endV2 + .1;
  const bez = (p0, p1, p2) => u => ({ x: (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * p1.x + u * u * p2.x, y: (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * p1.y + u * u * p2.y });
  const line = (a, b) => u => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
  const flows = [];
  srcR.forEach((r, i) => flows.push({ t0: tFlowA + i * .12, f: bez({ x: r.cx, y: r.y + r.h }, { x: r.cx, y: subR[0].y - 10 }, { x: subR[0].cx, y: subR[0].y + 4 }), len: 600, speed: 520, n: 9, color: SRC[i].color }));
  for (let i = 0; i < 3; i++) flows.push({ t0: i === 0 ? tFlowB : tFlowC + (i - 1) * .45, f: line({ x: subR[i].cx, y: subR[i].y + subR[i].h - 2 }, { x: subR[i + 1].cx, y: subR[i + 1].y + subR[i + 1].h - 2 }), len: 361, speed: 420, n: 7, color: '#f2c14e' });
  chipR.forEach((c, j) => flows.push({ t0: tFlowD + j * .05, f: bez({ x: subR[3].cx - 120 + j * 10, y: subR[3].y + subR[3].h + 6 }, { x: c.cx, y: subR[3].y + subR[3].h + 30 }, { x: c.cx, y: c.y + 4 }), len: 500, speed: 560, n: 5, color: '#4cc9ff' }));
  // ô sáng lên khi dòng chảy tới
  const glowAt = [tFlowA + .95, tFlowB + .75, tFlowC + .75, tFlowC + 1.2];
  glowAt.forEach((g, i) => { tl.fromTo($('#sub' + i + ' .glow'), { opacity: 0 }, { opacity: 1, duration: .35, ease: 'power2.out' }, g); E.ev(g, 'ding', { i }); });
  tl.to(dgCam.querySelector('.tier6'), { opacity: 1, filter: 'saturate(1)', duration: .7, ease: 'power2.out' }, tFlowD + .5);
  tl.to(dgCam.querySelector('.t6'), { opacity: 1, duration: .7 }, tFlowD + .5);
  tl.fromTo(dgCam.querySelectorAll('.t6chip .glow'), { opacity: 0 }, { opacity: 1, duration: .3, stagger: .07, ease: 'power2.out' }, tFlowD + .8);
  const dgFx = $('#dgFx').getContext('2d');
  E.drawers.push(t => {
    if (t < T_B0 || t > endV2 + 3) return;
    dgFx.clearRect(0, 0, 1920, 1080);
    for (const F of flows) {
      const dt = t - F.t0; if (dt < 0) continue;
      const lineA = clamp(dt / .4);
      // đường dẫn mờ có nét đứt chạy
      dgFx.save(); dgFx.setLineDash([10, 12]); dgFx.lineDashOffset = -t * 60; dgFx.strokeStyle = F.color; dgFx.globalAlpha = .45 * lineA; dgFx.lineWidth = 2.2;
      dgFx.beginPath(); for (let u = 0; u <= 1.0001; u += .04) { const p = F.f(Math.min(u, clamp(dt * F.speed / F.len))); u === 0 ? dgFx.moveTo(p.x, p.y) : dgFx.lineTo(p.x, p.y); } dgFx.stroke(); dgFx.restore();
      // hạt sáng chạy dọc đường
      for (let j = 0; j < F.n; j++) {
        const q = dt * F.speed / F.len - j / F.n; if (q < 0) continue;
        const u = q % 1, p = F.f(u), a = Math.sin(Math.PI * u);
        const g = dgFx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
        g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(.3, hexA(F.color, .9 * a)); g.addColorStop(1, hexA(F.color, 0));
        dgFx.fillStyle = g; dgFx.fillRect(p.x - 14, p.y - 14, 28, 28);
      }
    }
  });
  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

  /* =====================================================================
     CẢNH C — BĂNG CHUYỀN CHỈ TIÊU + TÁCH LỚP (C13)
     ===================================================================== */
  const T_CH3 = endV2 + 1.5;
  const T_C0 = E.chapter(T_CH3, '03', 'Chức năng');
  tl.set('#dgWrap', { display: 'none' }, T_C0);
  const T_V3 = T_C0 + 1.6;
  const endV3 = E.voice('c13', T_V3);
  E.ev(T_V3, 'voice', { id: 'c13' });

  const CARDS = [['so-vhtt', 'Sở Văn hóa và Thể thao'], ['dang-to-chuc', 'Ban Tổ chức Thành ủy'], ['so-gddt', 'Sở Giáo dục và Đào tạo'], ['so-hcc', 'Trung tâm Phục vụ hành chính công'],
    ['so-yte', 'Sở Y tế'], ['so-taichinh', 'Sở Tài chính'], ['so-nnmt', 'Sở Nông nghiệp và Môi trường'], ['so-noivu', 'Sở Nội vụ']];
  const N = CARDS.length, STEP = 360 / N, RAD = Math.round(440 / Math.tan(Math.PI / N) * 1.18);
  const ring = $('#carRing');
  ring.innerHTML = CARDS.map(([n, cap], k) => `<div class="cslot" style="position:absolute;transform-style:preserve-3d;transform:rotateY(${k * STEP}deg) translateZ(${RAD}px)">
      <div class="ccard"><img src="${SCR(n)}"></div><div class="ccap"><i>${String(k + 1).padStart(2, '0')}</i> · ${cap}</div></div>`).join('');
  const slots = [...ring.children];
  const T_STOP = E.wordAt('c13', 'thẻ chỉ số') - .45;
  const A_START = -STEP * 1.5, A_END = -360;
  tl.set('#carWrap', { display: 'block' }, T_C0);
  tl.fromTo('#carWrap', { opacity: 0 }, { opacity: 1, duration: .4 }, T_C0 - .1);
  E.drawers.push(t => {
    if (t < T_C0 - .2 || t > T_STOP + 1.2) return;
    const u = ease.inOutSine(prog(t, T_C0 - .2, T_STOP));
    const A = lerp(A_START, A_END, u);
    const zin = ease.out3(prog(t, T_C0 - .2, T_C0 + 1.2));
    const tilt = lerp(16, 4, zin) + 1.5 * Math.sin(t * .8);
    ring.style.transform = `translateZ(${lerp(-2600, 0, zin) - RAD}px) rotateX(${-tilt}deg) rotateY(${A}deg)`;
    slots.forEach((s, k) => {
      let th = ((k * STEP + A) % 360 + 540) % 360 - 180;
      const f = Math.cos(th * Math.PI / 180);
      const front = Math.max(0, f);
      s.querySelector('.ccard').style.filter = `brightness(${.32 + .68 * front * front})`;
      s.querySelector('.ccap').style.opacity = clamp((f - .86) / .14);
    });
  });
  // chốt ở thẻ đầu (Sở VHTT) -> phóng thành màn hình nền
  const xbase = $('#xbase'); xbase.querySelector('img').src = SCR('so-vhtt');
  tl.to('#carWrap', { opacity: 0, duration: .35, ease: 'power1.in' }, T_STOP + .05);
  tl.fromTo(xbase, { opacity: 0, scale: 880 / 1500, y: -70 }, { opacity: 1, scale: 1, y: 0, duration: .7, ease: 'power3.inOut' }, T_STOP);
  tl.set('#carWrap', { display: 'none' }, T_STOP + .5);
  tl.to(xbase, { filter: 'brightness(.42) blur(1.5px)', scale: .97, duration: .8, ease: 'power2.inOut' }, E.wordAt('c13', 'thẻ chỉ số') - .05);
  tl.to(xbase, { scale: 1.0, duration: endV3 + 1.5 - (E.wordAt('c13', 'thẻ chỉ số') + .8), ease: 'sine.inOut' }, E.wordAt('c13', 'thẻ chỉ số') + .8);

  const BS = 1500 / 1920, BX = 210, BY = 118;
  const toScr = (x, y, w, h) => ({ x: BX + x * BS, y: BY + y * BS, w: w * BS, h: h * BS });
  const PARTS = [
    { img: 'vhtt-kpi', ow: 512, oh: 142, src: toScr(46, 137, 512, 142), fin: { x: 110, y: 168, w: 760 }, n: 1, label: 'Thẻ chỉ số', say: 'thẻ chỉ số', chip: { dx: 0, dy: -70 }, ry: 7 },
    { img: 'vhtt-donut', ow: 512, oh: 286, src: toScr(46, 293, 512, 286), fin: { x: 150, y: 488, w: 620 }, n: 2, label: 'Màu theo mức đạt', say: 'màu theo', chip: { dx: 0, dy: -70 }, ry: 9 },
    { img: 'vhtt-trend', ow: 512, oh: 308, src: toScr(46, 973, 512, 308), fin: { x: 1030, y: 130, w: 700 }, n: 3, label: 'Biểu đồ diễn biến', say: 'biểu đồ', chip: { dx: 0, dy: -70 }, ry: -8, chipRight: true },
    { img: 'nguon-du-lieu', ow: 527, oh: 750, src: { x: 1980, y: 600, w: 400, h: 569 }, fin: { x: 1110, y: 640, w: 600, clipH: 290 }, n: 4, label: 'Nguồn dữ liệu & thời điểm cập nhật', say: 'kèm nguồn', chip: { dx: 0, dy: -70 }, ry: -9, chipRight: true },
  ];
  const xparts = $('#xparts');
  for (const P of PARTS) {
    const h = P.fin.w * P.oh / P.ow, boxH = P.fin.clipH || h;
    const el = document.createElement('div'); el.className = 'xpart';
    el.style.cssText = `left:${P.fin.x}px;top:${P.fin.y}px;width:${P.fin.w}px;height:${boxH}px;transform-origin:0 0`;
    el.innerHTML = `<div class="xin"><img src="${PART(P.img)}"></div>`;
    xparts.appendChild(el);
    const chip = document.createElement('div'); chip.className = 'xchip';
    chip.innerHTML = `<span class="n">${P.n}</span>${P.label}`;
    xparts.appendChild(chip);
    chip.style.top = (P.fin.y + P.chip.dy) + 'px';
    if (P.chipRight) chip.style.right = (1920 - P.fin.x - P.fin.w) + 'px'; else chip.style.left = P.fin.x + 'px';
    P.el = el; P.chipEl = chip; P.h = h;
    const tA = E.wordAt('c13', P.say) - .2;
    P.tA = tA;
    tl.fromTo(el, { opacity: 0, x: P.src.x - P.fin.x, y: P.src.y - P.fin.y, scale: P.src.w / P.fin.w, rotationY: 0 },
      { opacity: 1, x: 0, y: 0, scale: 1, rotationY: P.ry, rotationX: 3, duration: .85, ease: 'power3.out' }, tA);
    tl.fromTo(chip, { opacity: 0, scale: .6, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: .45, ease: 'back.out(2)' }, tA + .4);
    E.ev(tA, 'swoosh');
  }
  // các khối trôi lơ lửng nhẹ
  E.drawers.push(t => { PARTS.forEach((P, i) => { const a = t - P.tA; if (a < .8) return; P.el.querySelector('.xin').style.transform = `translateY(${Math.sin(a * 1.4 + i) * 6}px)`; }); });

  // kết thúc: tối dần
  const T_END = endV3 + 1.5;
  tl.fromTo('#fadeBlack', { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power1.in' }, T_END);
  E.ev(T_END, 'end');
  tl.set({}, {}, T_END + 1.15);
  E.duration = T_END + 1.15;
  E.ready();
})();
