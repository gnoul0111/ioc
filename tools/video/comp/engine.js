/* Bộ máy dựng khung hình tất định cho video IOC.
   Mọi chuyển động đều là hàm của thời gian t: GSAP timeline (paused) + các "drawer" vẽ canvas theo t.
   Trình quay (render.js) gọi window.seek(t) rồi chụp từng khung. */
(function () {
  const E = window.E = {
    tl: gsap.timeline({ paused: true }),
    drawers: [],
    voices: {},      // id -> {start, dur, words, text}
    cues: [],        // phụ đề: {a, b, text}
    events: [],      // mốc cho phần nhạc: {t, type, ...}
    duration: 0,
  };
  gsap.ticker.lagSmoothing(0);

  /* ---------- tiện ích ---------- */
  E.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  E.lerp = (a, b, u) => a + (b - a) * u;
  E.prog = (t, a, b) => E.clamp((t - a) / (b - a));
  E.ease = {
    out2: u => 1 - (1 - u) * (1 - u),
    out3: u => 1 - Math.pow(1 - u, 3),
    out5: u => 1 - Math.pow(1 - u, 5),
    in2: u => u * u,
    in3: u => u * u * u,
    inOut2: u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2,
    inOut3: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
    inOutSine: u => -(Math.cos(Math.PI * u) - 1) / 2,
    backOut: u => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
  };
  E.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };
  E.$ = sel => document.querySelector(sel);
  E.ev = (t, type, extra) => E.events.push(Object.assign({ t: +t.toFixed(3), type }, extra || {}));
  E.el = (html, parent) => { const d = document.createElement('div'); d.innerHTML = html.trim(); const n = d.firstChild; (parent || E.$('#stage')).appendChild(n); return n; };
  E.hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  E.loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => im.decode().then(() => res(im), () => res(im)); im.onerror = () => rej(new Error('img ' + src)); im.src = src; });
  // Ẩn/hiện 1 cảnh trong khoảng [a, b] (display) để trình duyệt khỏi vẽ phần không dùng
  E.span = (sel, a, b) => { const el = typeof sel === 'string' ? E.$(sel) : sel; el.style.display = 'none'; E.tl.set(el, { display: 'block' }, a); E.tl.set(el, { display: 'none' }, b); };

  /* ---------- giọng đọc + phụ đề ---------- */
  E.voice = function (id, start) {
    const v = E.timing[id];
    if (!v) throw new Error('Thiếu giọng ' + id);
    E.voices[id] = { start, dur: v.dur, words: v.words, text: v.text };
    E.buildCues(id);
    E.ev(start, 'voice', { id });
    return start + v.dur;
  };
  const norm = s => s.toLowerCase().normalize('NFC').replace(/[.,:;!?–\-"“”]/g, '').trim();
  E.wordAt = function (id, phrase, nth = 1, edge = 'start') {
    const v = E.voices[id]; const ws = v.words.map(w => norm(w.w));
    const target = norm(phrase).split(/\s+/);
    let seen = 0;
    for (let i = 0; i <= ws.length - target.length; i++) {
      let ok = true;
      for (let k = 0; k < target.length; k++) if (ws[i + k] !== target[k]) { ok = false; break; }
      if (ok && ++seen === nth) {
        const w = edge === 'end' ? v.words[i + target.length - 1] : v.words[i];
        return v.start + (edge === 'end' ? w.t + w.d : w.t);
      }
    }
    console.warn('Không thấy cụm từ', id, phrase);
    return v.start;
  };
  E.vEnd = id => E.voices[id].start + E.voices[id].dur;
  E.buildCues = function (id) {
    const v = E.voices[id];
    const parts = v.text.match(/[^,:;.]+[,:;.]?/g).map(s => s.trim()).filter(Boolean);
    const groups = []; let cur = '';
    for (const p of parts) {
      const cand = cur ? cur + ' ' + p : p;
      if (cand.length > 58 && cur) { groups.push(cur); cur = p; } else cur = cand;
    }
    if (cur) groups.push(cur);
    const countWords = s => s.split(/\s+/).filter(w => norm(w).length).length;
    const total = groups.reduce((a, g) => a + countWords(g), 0);
    const aligned = total === v.words.length;
    let wi = 0;
    groups.forEach(g => {
      const n = countWords(g);
      let a, b;
      if (aligned) {
        const w0 = v.words[wi], w1 = v.words[wi + n - 1];
        a = v.start + w0.t - 0.12; b = v.start + w1.t + w1.d + 0.25;
      } else {
        a = v.start + v.dur * (wi / total); b = v.start + v.dur * ((wi + n) / total);
      }
      wi += n;
      E.cues.push({ a, b, text: g.replace(/[,:;]$/, '') });
    });
    const mine = E.cues.slice(-groups.length);
    for (let i = 0; i < mine.length - 1; i++) mine[i].b = mine[i + 1].a;
  };
  let lastCue = null;
  function drawSubs(t) {
    const box = E.$('#subs');
    const c = E.cues.find(c => t >= c.a && t < c.b);
    if (c !== lastCue) { box.innerHTML = c ? `<div class="cue">${c.text}</div>` : ''; lastCue = c; }
    if (c) {
      const el = box.firstChild;
      const fi = E.prog(t, c.a, c.a + 0.18), fo = 1 - E.prog(t, c.b - 0.18, c.b);
      const isFirst = !E.cues.some(o => o !== c && Math.abs(o.b - c.a) < 0.01);
      const isLast = !E.cues.some(o => o !== c && Math.abs(o.a - c.b) < 0.01);
      el.style.opacity = Math.min(isFirst ? fi : 1, isLast ? fo : 1);
    }
  }

  /* ---------- NỀN NHIỀU LỚP ----------
     quầng sáng trôi + sàn lưới phối cảnh + mạch sáng có xung chạy + tia sáng quét + bokeh + bụi sáng.
     E.bgp điều chỉnh độ đậm từng lớp theo cảnh (tween được). */
  E.bgp = { aurora: 1, floor: 1, circuit: 1, beams: 1, bokeh: 1, bright: 1 };
  const R = E.rng(7);
  const blobs = [
    { c: '37,99,235', r: 820, x: 520, y: 300, ax: 260, ay: 140, fx: .045, fy: .061, ph: 0, a: .30 },
    { c: '8,145,178', r: 700, x: 1450, y: 380, ax: 300, ay: 160, fx: .038, fy: .052, ph: 2, a: .22 },
    { c: '79,70,229', r: 760, x: 980, y: 820, ax: 360, ay: 120, fx: .031, fy: .047, ph: 4, a: .24 },
    { c: '242,193,78', r: 560, x: 1600, y: 120, ax: 220, ay: 90, fx: .027, fy: .043, ph: 1, a: .07 },
  ];
  const dust = Array.from({ length: 150 }, () => ({ x: R() * 1920, y: R() * 1080, z: .3 + R() * .9, r: .6 + R() * 1.7, ph: R() * 6.28, gold: R() < .22 }));
  const bokeh = Array.from({ length: 24 }, () => ({ x: R() * 1920, y: R() * 1080, r: 25 + R() * 80, a: .035 + R() * .06, sp: .2 + R() * .6, ph: R() * 6.28, gold: R() < .3 }));
  // mạch điện tử: đường gấp khúc vuông góc/45°, có xung sáng chạy dọc
  const circuits = Array.from({ length: 16 }, (_, i) => {
    const left = i % 2 === 0;
    let x = left ? -20 : 1940, y = 70 + R() * 540; const pts = [[x, y]];
    const dir = left ? 1 : -1;
    for (let s = 0; s < 5; s++) {
      const L = 90 + R() * 220;
      if (s % 2 === 0) x += dir * L; else { const dy = (R() < .5 ? -1 : 1) * (40 + R() * 110); x += dir * Math.abs(dy); y += dy; }
      pts.push([x, y]);
    }
    let len = 0; const seg = [];
    for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push(d); len += d; }
    return { pts, seg, len, sp: 160 + R() * 260, ph: R() * 3, gold: R() < .35 };
  });
  const posAt = (c, s) => { for (let k = 0; k < c.seg.length; k++) { if (s <= c.seg[k]) { const u = s / c.seg[k]; return [E.lerp(c.pts[k][0], c.pts[k + 1][0], u), E.lerp(c.pts[k][1], c.pts[k + 1][1], u)]; } s -= c.seg[k]; } return c.pts[c.pts.length - 1]; };
  function drawBg(t) {
    const P = E.bgp;
    const cv = E.$('#bg'), ctx = cv.getContext('2d');
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(960, 470, 60, 960, 540, 1300);
    g.addColorStop(0, '#0b1f4f'); g.addColorStop(.5, '#06122f'); g.addColorStop(1, '#01040c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    // quầng sáng trôi
    ctx.globalCompositeOperation = 'lighter';
    for (const b of blobs) {
      const x = b.x + Math.sin(t * b.fx * 6.283 + b.ph) * b.ax, y = b.y + Math.cos(t * b.fy * 6.283 + b.ph) * b.ay;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, b.r);
      rg.addColorStop(0, `rgba(${b.c},${b.a * P.aurora * P.bright})`); rg.addColorStop(1, `rgba(${b.c},0)`);
      ctx.fillStyle = rg; ctx.fillRect(x - b.r, y - b.r, b.r * 2, b.r * 2);
    }
    // tia sáng quét từ trên xuống
    if (P.beams > 0) {
      for (let i = 0; i < 3; i++) {
        const ox = 420 + i * 540 + Math.sin(t * .23 + i * 2) * 160, ang = Math.sin(t * .17 + i) * .35;
        ctx.save(); ctx.translate(ox, -80); ctx.rotate(ang);
        const lg = ctx.createLinearGradient(0, 0, 0, 1100);
        lg.addColorStop(0, `rgba(150,190,255,${.10 * P.beams * P.bright})`); lg.addColorStop(1, 'rgba(150,190,255,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.lineTo(260, 1150); ctx.lineTo(-260, 1150); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    // sàn lưới phối cảnh chạy về phía người xem
    if (P.floor > 0) {
      const HZ = 640, VX = 960, VY = 600, N = 18, sp = .55;
      const fa = .5 * P.floor * P.bright;
      for (let i = 0; i < N; i++) {
        const z = 1 + (((i - t * sp) % N) + N) % N;
        const y = HZ + 520 / z;
        if (y > 1080) continue;
        const a = fa * Math.min(1, 2.2 / z) * E.prog(y, HZ, HZ + 60);
        ctx.strokeStyle = `rgba(80,140,255,${a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1920, y); ctx.stroke();
      }
      for (let xb = -3200; xb <= 5120; xb += 180) {
        const lgV = ctx.createLinearGradient(0, HZ, 0, 1080);
        lgV.addColorStop(0, 'rgba(80,140,255,0)'); lgV.addColorStop(1, `rgba(80,140,255,${fa * .9})`);
        ctx.strokeStyle = lgV; ctx.lineWidth = 1.1;
        const k = (HZ - VY) / (1080 - VY);
        ctx.beginPath(); ctx.moveTo(VX + (xb - VX) * k, HZ); ctx.lineTo(xb, 1080); ctx.stroke();
      }
      const hg = ctx.createLinearGradient(0, 0, 1920, 0);
      hg.addColorStop(0, 'rgba(242,193,78,0)'); hg.addColorStop(.5, `rgba(242,193,78,${.35 * P.floor * P.bright})`); hg.addColorStop(1, 'rgba(242,193,78,0)');
      ctx.fillStyle = hg; ctx.fillRect(0, HZ - 1, 1920, 2);
    }
    // mạch sáng + xung chạy
    if (P.circuit > 0) {
      ctx.lineWidth = 1.2;
      for (const c of circuits) {
        ctx.strokeStyle = `rgba(110,160,255,${.13 * P.circuit * P.bright})`;
        ctx.beginPath(); c.pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
        const last = c.pts[c.pts.length - 1];
        ctx.fillStyle = `rgba(110,160,255,${.25 * P.circuit * P.bright})`; ctx.beginPath(); ctx.arc(last[0], last[1], 3, 0, 6.283); ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 2; j++) {
          const s = ((t * c.sp + c.ph * 400 + j * c.len / 2) % (c.len + 300));
          if (s > c.len) continue;
          for (let q = 0; q < 6; q++) {
            const p = posAt(c, Math.max(0, s - q * 7)); const a = (1 - q / 6) * .8 * P.circuit * P.bright;
            ctx.fillStyle = c.gold ? `rgba(255,214,120,${a})` : `rgba(120,200,255,${a})`;
            ctx.beginPath(); ctx.arc(p[0], p[1], 2.4 - q * .3, 0, 6.283); ctx.fill();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    // bokeh + bụi sáng
    ctx.globalCompositeOperation = 'lighter';
    for (const b of bokeh) {
      const x = (b.x + t * 12 * b.sp) % 2100 - 90, y = b.y + Math.sin(t * .3 * b.sp + b.ph) * 40;
      const rg = ctx.createRadialGradient(x, y, b.r * .6, x, y, b.r);
      const c = b.gold ? '242,193,78' : '120,170,255';
      rg.addColorStop(0, `rgba(${c},${b.a * P.bokeh * P.bright})`); rg.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = rg; ctx.fillRect(x - b.r, y - b.r, b.r * 2, b.r * 2);
    }
    for (const p of dust) {
      const x = (p.x + t * 14 * p.z) % 1960 - 20, y = (p.y - t * 6 * p.z + 1100) % 1100 - 10;
      const a = (.25 + .35 * Math.sin(t * 1.3 + p.ph) ** 2) * p.z * P.bright;
      ctx.fillStyle = p.gold ? `rgba(242,193,78,${a})` : `rgba(140,190,255,${a})`;
      ctx.beginPath(); ctx.arc(x, y, p.r * p.z, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- hiệu ứng sáng dùng chung (vẽ lên #fx) ---------- */
  E.fxCtx = () => E.$('#fx').getContext('2d');
  E.flash = function (ctx, a, cx = 960, cy = 540, size = 1) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1300 * size);
    g.addColorStop(0, `rgba(255,250,235,${a})`); g.addColorStop(.35, `rgba(255,226,150,${.7 * a})`); g.addColorStop(1, 'rgba(242,193,78,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    const h = ctx.createLinearGradient(0, 0, 1920, 0);
    h.addColorStop(0, 'rgba(255,220,140,0)'); h.addColorStop(.5, `rgba(255,240,200,${.8 * a})`); h.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = h; ctx.fillRect(0, cy - 4 - 6 * a, 1920, 8 + 12 * a);
  };
  // chùm tia lửa nổ tại (cx,cy) lúc t0
  E.burst = function (t0, cx, cy, n = 90, seed = 5, spread = 700, color = '255,214,120') {
    const r = E.rng(seed);
    const ps = Array.from({ length: n }, () => { const a = r() * 6.283, v = spread * (.3 + r() * .7); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v * .75, life: .5 + r() * .8, s: 1 + r() * 2 }; });
    E.drawers.push(t => {
      const dt = t - t0; if (dt < 0 || dt > 1.4) return;
      const ctx = E.fxCtx();
      for (const p of ps) {
        if (dt > p.life) continue;
        const k = dt / p.life;
        ctx.fillStyle = `rgba(${color},${1 - k})`;
        ctx.beginPath(); ctx.arc(cx + p.vx * dt * (1 - k * .5), cy + p.vy * dt * (1 - k * .5) + 90 * dt * dt, p.s * (1 - k * .5), 0, 6.283); ctx.fill();
      }
    });
  };

  /* ---------- THẺ CHƯƠNG (thiết kế mới) ----------
     dải quét phủ kín → vòng HUD xoay + số lớn ánh kim + chữ hiện từng ký tự + hạt bung → camera lao xuyên ra cảnh sau.
     Trả về {cover: lúc phủ kín (đổi cảnh sau lưng), out: lúc bắt đầu lao ra (cảnh sau vào)} */
  E.chapter = function (t, num, name, total = '04') {
    const el = document.createElement('div');
    el.className = 'layer chapter';
    const R2 = [170, 214, 256, 300];
    el.innerHTML = `<div class="band"></div>
      <div class="cbody layer">
        <div class="cglow layer"></div>
        <div class="cghost">${num}</div>
        <svg class="hud" width="700" height="700" viewBox="-350 -350 700 700">
          <circle class="r0" r="${R2[0]}" fill="none" stroke="rgba(242,193,78,.55)" stroke-width="2" stroke-dasharray="3 9"/>
          <circle class="r1" r="${R2[1]}" fill="none" stroke="rgba(120,180,255,.55)" stroke-width="3" stroke-dasharray="120 40 30 40" />
          <g class="r2">${Array.from({ length: 72 }, (_, i) => { const a = i * 5 * Math.PI / 180, l = i % 6 === 0 ? 16 : 7; return `<line x1="${Math.cos(a) * R2[2]}" y1="${Math.sin(a) * R2[2]}" x2="${Math.cos(a) * (R2[2] + l)}" y2="${Math.sin(a) * (R2[2] + l)}" stroke="rgba(242,193,78,${i % 6 === 0 ? .8 : .35})" stroke-width="2"/>`; }).join('')}</g>
          <circle class="r3" r="${R2[3]}" fill="none" stroke="rgba(120,180,255,.35)" stroke-width="1.5" stroke-dasharray="400 120"/>
          <g class="orb"><circle cx="${R2[1]}" cy="0" r="6" fill="#ffe08a"/><circle cx="-${R2[3]}" cy="0" r="4" fill="#8cc8ff"/></g>
        </svg>
        <div class="ckicker">PHẦN ${num} / ${total}</div>
        <div class="cnum"><span class="b">${num}</span><span class="s">${num}</span></div>
        <div class="cname">${[...name].map(ch => ch === ' ' ? '<span class="sp"> </span>' : `<span>${ch}</span>`).join('')}</div>
        <div class="cdeco"><i></i><b></b><i></i></div>
      </div>`;
    el.style.display = 'none';
    E.$('#chapters').appendChild(el);
    const q = s => el.querySelector(s), qa = s => el.querySelectorAll(s);
    const tl = E.tl;
    tl.set(el, { display: 'block' }, t);
    tl.fromTo(q('.band'), { x: -3000, skewX: -14, opacity: 1 }, { x: -480, duration: .55, ease: 'power3.in' }, t);
    tl.to(q('.band'), { x: -420, duration: 1.75, ease: 'none' }, t + .55);
    tl.fromTo(q('.cbody'), { opacity: 0 }, { opacity: 1, duration: .2 }, t + .42);
    tl.fromTo(q('.cghost'), { x: -200, opacity: 0 }, { x: 160, opacity: .07, duration: 2.4, ease: 'none' }, t + .4);
    qa('.hud circle.r0, .hud circle.r1, .hud circle.r3').forEach((c, i) => {
      const L = 2 * Math.PI * +c.getAttribute('r');
      tl.fromTo(c, { attr: { 'stroke-dashoffset': L }, opacity: 0 }, { attr: { 'stroke-dashoffset': 0 }, opacity: 1, duration: .7, ease: 'power2.out' }, t + .5 + i * .08);
    });
    tl.fromTo(q('.hud'), { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .7, ease: 'power3.out' }, t + .5);
    tl.fromTo(q('.cnum'), { scale: 2.4, opacity: 0, filter: 'blur(18px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: .42, ease: 'power4.in' }, t + .55);
    tl.fromTo(q('.cnum .s'), { backgroundPosition: '-150% 0' }, { backgroundPosition: '250% 0', duration: .8, ease: 'power2.inOut' }, t + 1.0);
    tl.fromTo(q('.ckicker'), { opacity: 0, y: 12, clipPath: 'inset(0% 50% 0% 50%)' }, { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: .7, ease: 'power3.out' }, t + .75);   // không co giãn khoảng cách chữ (gây giật)
    tl.fromTo(qa('.cname span'), { opacity: 0, y: 40, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .45, stagger: .03, ease: 'power3.out' }, t + .9);
    tl.fromTo(qa('.cdeco i'), { scaleX: 0 }, { scaleX: 1, duration: .6, ease: 'power3.out' }, t + 1.1);
    tl.fromTo(q('.cdeco b'), { scale: 0 }, { scale: 1, duration: .4, ease: 'back.out(3)' }, t + 1.05);
    // lao xuyên ra cảnh sau
    tl.to(q('.cbody'), { scale: 2.8, opacity: 0, filter: 'blur(12px)', duration: .6, ease: 'power3.in' }, t + 2.3);
    tl.to(q('.band'), { opacity: 0, duration: .45, ease: 'power2.in' }, t + 2.35);
    tl.set(el, { display: 'none' }, t + 2.95);
    // vòng HUD xoay liên tục + hạt bung khi số chốt
    const rings = [q('.r0'), q('.r1'), q('.r2'), q('.r3'), q('.orb')], sp = [14, -22, 6, 30, -55];
    E.drawers.push(tt => { if (tt < t || tt > t + 3) return; rings.forEach((r, i) => r.setAttribute('transform', `rotate(${(tt - t) * sp[i]})`)); });
    E.drawers.push(tt => { const dt = tt - (t + .97); if (dt < 0 || dt > .45) return; E.flash(E.fxCtx(), .55 * (1 - dt / .45), 960, 430, .5); });
    E.burst(t + .97, 960, 430, 80, num.charCodeAt(1) * 7, 650);
    E.ev(t, 'whoosh', { dur: 1.2 }); E.ev(t + .97, 'hit'); E.ev(t + 2.3, 'whoosh2');
    return { cover: t + .55, out: t + 2.3 };
  };

  /* ---------- thành phần dùng chung ---------- */
  // khung trình duyệt chứa ảnh màn hình (w×h là kích thước vùng ảnh)
  E.frame = function (src, w, h, parent, title = 'Trung tâm điều hành IOC') {
    return E.el(`<div class="bframe" style="width:${w}px;height:${h + 38}px">
      <div class="bbar"><i></i><i></i><i></i><span>${title}</span></div>
      <div class="bimg" style="height:${h}px"><img src="${src}"></div></div>`, parent);
  };
  // nhãn vàng có số
  E.chip = (text, n, parent) => E.el(`<div class="xchip">${n != null ? `<span class="n">${n}</span>` : ''}${text}</div>`, parent);
  // khung sáng viền vàng
  E.hl = (x, y, w, h, parent, color = '#f2c14e') => E.el(`<div class="hlbox" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-color:${color};box-shadow:0 0 24px ${E.hexA(color, .55)}, inset 0 0 18px ${E.hexA(color, .2)}"></div>`, parent);
  // con trỏ chuột: path = [{t,x,y}], clicks = [t...]
  E.cursor = function (parent, path, clicks = []) {
    const c = E.el(`<div class="cursor"><svg width="34" height="40" viewBox="0 0 34 40"><path d="M3 2 L3 32 L11 25 L17 38 L23 35 L17 23 L28 23 Z" fill="#fff" stroke="#0a1a3a" stroke-width="2.4" stroke-linejoin="round"/></svg></div>`, parent);
    const rip = E.el(`<div class="ripple"></div>`, parent);
    c.style.opacity = 0;
    E.tl.set(c, { opacity: 1, x: path[0].x, y: path[0].y }, path[0].t);
    for (let i = 1; i < path.length; i++) E.tl.to(c, { x: path[i].x, y: path[i].y, duration: path[i].t - path[i - 1].t, ease: 'power2.inOut' }, path[i - 1].t);
    E.tl.to(c, { opacity: 0, duration: .25 }, path[path.length - 1].t + (path[path.length - 1].hold || .3));
    clicks.forEach(ct => {
      const p = path.reduce((a, b) => (b.t <= ct ? b : a), path[0]);
      E.tl.fromTo(c, { scale: 1 }, { scale: .82, duration: .08, yoyo: true, repeat: 1 }, ct);
      E.tl.fromTo(rip, { x: p.x - 30, y: p.y - 30, scale: .2, opacity: .9 }, { scale: 1.6, opacity: 0, duration: .55, ease: 'power2.out' }, ct);
      E.ev(ct, 'click');
    });
    return c;
  };

  /* ---------- seek ---------- */
  window.seek = function (t) {
    E.tl.seek(t, false);
    drawBg(t);
    const fx = E.fxCtx(); fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, 1920, 1080);
    for (const d of E.drawers) d(t);
    drawSubs(t);
  };
  E.ready = function () {
    E.duration = Math.max(E.duration, E.tl.duration());
    window.META = { duration: E.duration, voices: Object.fromEntries(Object.entries(E.voices).map(([k, v]) => [k, { start: v.start, dur: v.dur }])), events: E.events, cues: E.cues };
    window.READY = true;
  };
})();

