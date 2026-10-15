/* PHẦN 01 · MỤC ĐÍCH — C3 dữ liệu rải rác, C4 mảnh ghép thành màn hình tổng quan + "Báo cáo → Dữ liệu" */
window.S = window.S || {};
S.p1 = async function (t0) {
  const { tl, clamp, lerp, prog, ease, rng, $ } = E;
  const SCR = n => `../assets/screens/${n}.png`;
  const ch = E.chapter(t0, '01', 'Mục đích');
  const scene = E.el(`<div class="scene" id="p1"><div id="scatter"></div></div>`, $('#scenes'));
  const sc = scene.querySelector('#scatter');

  /* ---------- C3: các mảnh dữ liệu trôi rời rạc ---------- */
  const tV = ch.out + .35;
  const endV = E.voice('c3', tV);
  const r = rng(77);
  const kinds = ['doc', 'doc', 'sheet', 'win', 'doc', 'stack', 'win', 'sheet', 'doc', 'win'];
  const wins = ['so-yte', 'nhiem-vu-giao', 'so-taichinh', 'van-ban-den', 'gis', 'so-nnmt'];
  const items = [];
  for (let i = 0; i < 30; i++) {
    const k = kinds[i % kinds.length];
    let html;
    if (k === 'doc') { const b = [['PDF', '#e5484d'], ['DOC', '#2563eb'], ['XLS', '#1f9d55'], ['', '']][i % 4]; html = `<div class="doc">${'<i></i>'.repeat(9)}${b[0] ? `<div class="badge" style="background:${b[1]}">${b[0]}</div>` : ''}</div>`; }
    else if (k === 'sheet') html = `<div class="sheet"></div>`;
    else if (k === 'win') html = `<div class="win"><div class="wb"></div><img src="${SCR(wins[i % wins.length])}"></div>`;
    else html = `<div class="stack">${Array.from({ length: 6 }, (_, j) => `<div style="top:${j * 16}px;left:${(j % 2) * 6}px"></div>`).join('')}</div>`;
    const it = E.el(`<div class="sitem">${html}</div>`, sc);
    const o = { x: -200 + r() * 2300, y: 40 + r() * 900, z: -900 + r() * 1100, rx: (r() - .5) * 40, ry: (r() - .5) * 60, rz: (r() - .5) * 30, vx: (r() - .5) * 40, vy: (r() - .5) * 30, w: .4 + r() * .8, ph: r() * 6 };
    it._o = o; items.push(it);
  }
  // camera lia ngang + các mảnh trôi, nhấp nháy (vẽ theo t)
  const T_ASM = E.wordAt('c3', 'bảo đảm') - .2;   // lúc bắt đầu hút về giữa (C4)
  E.drawers.push(t => {
    if (t < ch.cover) return;
    // quá khoảng thì ẩn hẳn (không chỉ "return"), để khi tua thẳng tới giữa video vẫn đúng trạng thái
    if (t > T_ASM + 2.2) { items.forEach(it => { it.style.opacity = 0; }); return; }
    const pan = lerp(140, -140, prog(t, ch.cover, T_ASM + 1));
    const absorb = ease.in3(prog(t, T_ASM, T_ASM + 1.3));
    items.forEach((it, i) => {
      const o = it._o, tt = t - ch.cover;
      const x = o.x + o.vx * tt + pan * (1 + o.z / 1200), y = o.y + o.vy * tt + Math.sin(tt * o.w + o.ph) * 18;
      const fx = lerp(x, 960, absorb), fy = lerp(y, 540, absorb), fz = lerp(o.z, -1400, absorb);
      it.style.transform = `translate3d(${fx}px,${fy}px,${fz}px) rotateX(${o.rx + tt * 4 * o.w}deg) rotateY(${o.ry + tt * 6 * o.w}deg) rotateZ(${o.rz}deg)`;
      const flick = .75 + .25 * Math.sin(tt * 7 * o.w + o.ph);
      it.style.opacity = Math.min(1, prog(t, ch.out + i * .03, ch.out + .5 + i * .03)) * flick * (1 - absorb);
      it.style.filter = `saturate(.35) brightness(${.8 + .2 * flick})`;
    });
  });
  // nhãn vàng theo lời đọc: kết nối / tổng hợp / khai thác
  [['Kết nối', 'kết nối', 260, 210], ['Tổng hợp', 'tổng hợp', 1250, 160], ['Khai thác', 'khai thác', 1350, 640]].forEach(([txt, w, x, y], i) => {
    const tg = E.el(`<div class="redtag" style="left:${x}px;top:${y}px;background:rgba(40,28,4,.85);border-color:#f2c14e;color:#ffe7a3;box-shadow:0 0 30px rgba(242,193,78,.45)">${txt}</div>`, scene);
    const a = E.wordAt('c3', w) - .1;
    tl.fromTo(tg, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: .35, ease: 'back.out(2)' }, a);
    tl.to(tg, { x: '+=' + (i % 2 ? -30 : 30), duration: T_ASM - a, ease: 'none' }, a + .35);
    tl.to(tg, { opacity: 0, scale: .7, duration: .3 }, T_ASM);
    E.ev(a, 'pop');
  });

  /* ---------- C4: mảnh ghép thành màn hình tổng quan ---------- */
  const tV4 = Math.max(endV + .5, T_ASM + .6);
  const endV4 = E.voice('c4', tV4);
  const FW = 1500, FH = 844, FX = 210, FY = 100;
  const grid = E.el(`<div class="layer" style="perspective:1600px"></div>`, scene);
  const board = E.el(`<div style="position:absolute;left:${FX}px;top:${FY}px;width:${FW}px;height:${FH}px;transform-style:preserve-3d"></div>`, grid);
  const COLS = 6, ROWS = 4, tw = FW / COLS, th = FH / ROWS;
  const tiles = [];
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const tdiv = E.el(`<div class="tile" style="left:${i * tw}px;top:${j * th}px;width:${tw + .5}px;height:${th + .5}px;background-image:url(${SCR('tong-quan')});background-size:${FW}px ${FH}px;background-position:${-i * tw}px ${-j * th}px"></div>`, board);
    const d = Math.hypot(i - 2.5, j - 1.5);
    const a = T_ASM + .35 + d * .1 + r() * .1;
    tl.fromTo(tdiv, { x: (r() - .5) * 2600, y: (r() - .5) * 1400, z: -1500 + r() * 900, rotationX: (r() - .5) * 120, rotationY: (r() - .5) * 140, opacity: 0, filter: 'grayscale(1) brightness(.6)' },
      { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, opacity: 1, duration: 1.15, ease: 'power3.out' }, a);
    tl.to(tdiv, { filter: 'grayscale(0) brightness(1.1)', duration: .7, ease: 'power2.out' }, T_ASM + 1.7 + d * .06);
    tiles.push(tdiv);
  }
  const frameGlow = E.el(`<div style="position:absolute;left:${FX - 3}px;top:${FY - 3}px;width:${FW + 6}px;height:${FH + 6}px;border-radius:12px;border:3px solid var(--gold);box-shadow:0 0 50px rgba(242,193,78,.5);opacity:0"></div>`, grid);
  tl.to(frameGlow, { opacity: 1, duration: .5 }, T_ASM + 1.9);
  E.ev(T_ASM + 1.9, 'lock');
  // vệt sáng quét qua khi ghép xong
  const sweep = E.el(`<div style="position:absolute;left:${FX}px;top:${FY}px;width:${FW}px;height:${FH}px;overflow:hidden;pointer-events:none"><div style="position:absolute;top:-200px;width:260px;height:${FH + 400}px;background:linear-gradient(90deg,transparent,rgba(255,250,230,.35),transparent);transform:rotate(18deg)"></div></div>`, grid);
  tl.fromTo(sweep.firstChild, { x: -400 }, { x: FW + 400, duration: 1.0, ease: 'power2.inOut' }, T_ASM + 1.95);
  // camera đẩy chậm
  tl.fromTo(board, { scale: .96 }, { scale: 1.02, duration: 8, ease: 'sine.inOut', transformOrigin: '50% 50%' }, T_ASM + 1.2);
  // 3 nhãn: thông tin tổng hợp / cảnh báo / giao nhiệm vụ
  const S_ = FW / 1920;
  const marks = [
    { txt: 'Thông tin tổng hợp', w: 'thông tin tổng hợp', box: [32, 150, 1856, 268], chip: [FX + 40, FY + 40] },
    { txt: 'Cảnh báo', w: 'cảnh báo', box: [1421, 445, 480, 550], chip: [FX + 1000, FY + 330] },
    { txt: 'Giao nhiệm vụ & theo dõi', w: 'giao nhiệm vụ', box: [656, 155, 608, 260], chip: [FX + 520, FY + 400] },
  ];
  marks.forEach((m, i) => {
    const a = E.wordAt('c4', m.w) - .1;
    const hl = E.hl(FX + m.box[0] * S_, FY + m.box[1] * S_, m.box[2] * S_, m.box[3] * S_, grid);
    tl.fromTo(hl, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: .35, ease: 'power2.out' }, a);
    const c = E.chip(m.txt, i + 1, grid); c.style.left = m.chip[0] + 'px'; c.style.top = m.chip[1] + 'px';
    tl.fromTo(c, { opacity: 0, scale: .5, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: .45, ease: 'back.out(2)' }, a + .1);
    tl.to([hl, c], { opacity: .0, duration: .4 }, i < 2 ? E.wordAt('c4', marks[i + 1].w) - .15 : E.wordAt('c4', 'từng bước') - .2);
    E.ev(a, 'pop');
  });
  // "Nâng cao hiệu quả điều hành trên cơ sở DỮ LIỆU" — bố cục thống nhất kiểu thẻ chương, chuyển cảnh mềm ~1,3s
  const tTB = E.wordAt('c4', 'từng bước'), tNC = E.wordAt('c4', 'nâng cao'), tCS = E.wordAt('c4', 'trên cơ sở'), tDL = E.wordAt('c4', 'dữ liệu');
  // màn tổng quan ngả ra sau như mặt sàn, lùi xa và tối dần (giữ nét, không làm nhòe)
  tl.fromTo(board, { rotationX: 0, y: 0, filter: 'brightness(1)' }, { rotationX: 58, y: 170, scale: .82, filter: 'brightness(.3)', duration: 1.3, ease: 'power2.inOut', transformOrigin: '50% 100%', immediateRender: false }, tTB - .2);
  tl.to(frameGlow, { opacity: 0, duration: .6 }, tTB - .2);
  const kg = E.el(`<div class="layer" style="background:radial-gradient(ellipse 760px 380px at 960px 470px,rgba(242,193,78,.16),rgba(37,99,235,.10) 45%,transparent 75%)"></div>`, scene);
  const hud = E.el(`<svg width="700" height="700" viewBox="-350 -350 700 700" style="position:absolute;left:610px;top:150px"><circle class="h0" r="250" fill="none" stroke="rgba(242,193,78,.35)" stroke-width="2" stroke-dasharray="3 10"/><circle class="h1" r="300" fill="none" stroke="rgba(120,180,255,.35)" stroke-width="2.5" stroke-dasharray="140 50 40 50"/></svg>`, scene);
  const kl = E.el(`<div style="position:absolute;left:0;right:0;top:268px;display:flex;justify-content:center;align-items:center;gap:22px">
      <i style="display:block;width:150px;height:2px;background:linear-gradient(90deg,transparent,#f2c14e);transform-origin:right center"></i>
      <span style="font-size:40px;font-weight:800;letter-spacing:6px;color:#eef3ff;text-shadow:0 0 24px rgba(120,170,255,.45)">NÂNG CAO HIỆU QUẢ ĐIỀU HÀNH</span>
      <i style="display:block;width:150px;height:2px;background:linear-gradient(90deg,#f2c14e,transparent);transform-origin:left center"></i></div>`, scene);
  const k2 = E.el(`<div class="bigword" style="top:346px;font-size:30px;font-weight:700;color:#c9d6f2;letter-spacing:14px">TRÊN CƠ SỞ</div>`, scene);
  const GOLD = 'background:linear-gradient(180deg,#fff6d2 0%,#f6cc5c 40%,#a8741a 55%,#e8b545 75%,#ffe7a3 100%);-webkit-background-clip:text;color:transparent';   // bóng đổ đặt ở khung chứa, để hiệu ứng mờ từng chữ không xóa mất
  const w2 = E.el(`<div style="position:absolute;left:0;right:0;top:392px;text-align:center;font-size:176px;font-weight:900;line-height:1.1;letter-spacing:4px;filter:drop-shadow(0 4px 0 #6b4a0c) drop-shadow(0 8px 0 #4a3308) drop-shadow(0 0 30px rgba(242,193,78,.55))">${[...'DỮ LIỆU'].map(ch => ch === ' ' ? '<span style="display:inline-block;width:46px"></span>' : `<span class="lt" style="display:inline-block;${GOLD}">${ch}</span>`).join('')}</div>`, scene);
  const shine = E.el(`<div style="position:absolute;left:0;right:0;top:392px;text-align:center;font-size:176px;font-weight:900;line-height:1.1;letter-spacing:4px;background:linear-gradient(100deg,transparent 40%,rgba(255,255,255,.95) 50%,transparent 60%);background-size:300% 100%;-webkit-background-clip:text;color:transparent">DỮ LIỆU</div>`, scene);
  const dec = E.el(`<div style="position:absolute;left:0;right:0;top:612px;display:flex;justify-content:center;align-items:center;gap:18px"><i style="display:block;width:300px;height:2px;background:linear-gradient(90deg,transparent,#f2c14e);transform-origin:right center"></i><b style="display:block;width:14px;height:14px;transform:rotate(45deg);background:#f2c14e;box-shadow:0 0 18px #f2c14e"></b><i style="display:block;width:300px;height:2px;background:linear-gradient(90deg,#f2c14e,transparent);transform-origin:left center"></i></div>`, scene);
  tl.fromTo([kg, hud], { opacity: 0 }, { opacity: 1, duration: .9, ease: 'power1.out' }, tTB + .1);
  tl.fromTo(hud, { scale: .7 }, { scale: 1, duration: 1.2, ease: 'power3.out' }, tTB + .1);
  E.drawers.push(t => { if (t < tTB || t > tDL + 4) return; hud.querySelector('.h0').setAttribute('transform', `rotate(${t * 14})`); hud.querySelector('.h1').setAttribute('transform', `rotate(${-t * 20})`); });
  const tK1 = Math.max(tNC - .15, tTB + .85);   // đợi màn tổng quan ngả xuống gần xong mới hiện chữ, tránh chữ đè lên giao diện
  tl.fromTo(kl.querySelector('span'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, tK1);
  tl.fromTo(kl.querySelectorAll('i'), { scaleX: 0 }, { scaleX: 1, duration: .7, ease: 'power3.out' }, tK1 + .15);
  tl.fromTo(k2, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' }, tCS - .15);
  tl.fromTo(w2.querySelectorAll('.lt'), { opacity: 0, y: 40, scale: .6, filter: 'blur(10px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: .5, stagger: .06, ease: 'back.out(1.6)' }, tDL - .25);
  tl.fromTo(shine, { opacity: 1, backgroundPosition: '-150% 0' }, { backgroundPosition: '250% 0', duration: .9, ease: 'power2.inOut' }, tDL + .45);
  tl.fromTo(dec.querySelectorAll('i'), { scaleX: 0 }, { scaleX: 1, duration: .7, ease: 'power3.out' }, tDL + .1);
  tl.fromTo(dec.querySelector('b'), { scale: 0 }, { scale: 1, duration: .4, ease: 'back.out(3)' }, tDL + .05);
  tl.to([kl, k2, w2, shine, dec, hud], { scale: 1.04, duration: 2.2, ease: 'sine.out' }, tDL + .4);
  E.burst(tDL + .15, 960, 500, 110, 9, 900);  E.ev(tDL, 'hit');
  // ẩn cảnh ngay khi dải của chương sau phủ kín (end + 0.55)
  E.span(scene, ch.cover, endV4 + .55 + .6);
  return { end: endV4 + .55 };
};




