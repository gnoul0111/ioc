/* PHẦN 03 · CHỨC NĂNG — C11 tổng quan, C12 văn bản/nhiệm vụ, C13 chỉ tiêu sở (Sở GD&ĐT), C14 cảnh báo + truy sâu, C15 bản đồ, C16 quản trị + nhật ký */
window.S = window.S || {};
S.p3 = async function (t0) {
  const { tl, clamp, lerp, prog, ease, rng, $ } = E;
  const SCR = n => `../assets/screens/${n}.png`, PART = n => `../assets/parts/${n}.png`;
  const ch = E.chapter(t0, '03', 'Chức năng');
  const wrap = (id) => E.el(`<div class="scene p3w" id="${id}"></div>`, $('#scenes'));

  /* =============== C11 — TỔNG QUAN =============== */
  const s11 = wrap('s11');
  const FW = 1500, FH = 844, SC = FW / 1920;
  const f11 = E.frame(SCR('tong-quan'), FW, FH, s11); f11.style.left = '210px'; f11.style.top = '96px';
  const tV11 = ch.out + .45; const e11 = E.voice('c11', tV11);
  tl.fromTo(f11, { rotationY: -32, rotationX: 16, scale: .7, z: -500, opacity: 0 }, { rotationY: 0, rotationX: 0, scale: 1, z: 0, opacity: 1, duration: 1.7, ease: 'power3.out' }, ch.out - .1);
  tl.to(f11, { scale: 1.04, duration: 3, ease: 'sine.inOut' }, ch.out + 1.6);
  const W11 = [[32, 155, 608, 260, 'Văn bản'], [656, 155, 608, 260, 'Nhiệm vụ giao'], [1280, 155, 608, 260, 'Nhiệm vụ nhận'], [18, 445, 1387, 550, 'Bản đồ GIS'], [1421, 445, 480, 550, 'Cảnh báo']];
  W11.forEach((w, i) => {
    const h = E.hl(w[0] * SC, 38 + w[1] * SC, w[2] * SC, w[3] * SC, f11);
    const a = tV11 + .5 + i * .55;
    tl.fromTo(h, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: .3 }, a);
    tl.to(h, { opacity: .0, duration: .4 }, a + 1.0);
    const c = E.el(`<div class="mlabel" style="left:${w[0] * SC + 12}px;top:${38 + w[1] * SC + 10}px">${w[4]}</div>`, f11);
    tl.fromTo(c, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .3, ease: 'back.out(2)' }, a + .1);
    tl.to(c, { opacity: 0, duration: .3 }, a + 1.0);
    E.ev(a, 'tick');
  });
  const tOut11 = Math.max(e11, tV11 + .5 + 5 * .55) + .4;
  tl.to(f11, { x: -900, rotationY: 35, opacity: 0, duration: .7, ease: 'power3.in' }, tOut11);
  E.span(s11, ch.cover, tOut11 + .75);

  /* =============== C12 — VĂN BẢN, NHIỆM VỤ =============== */
  const s12 = wrap('s12');
  const tV12 = tOut11 + .35; const e12 = E.voice('c12', tV12);
  const CW = 1300, CH = 731, CS = CW / 1920;
  const STK = [['van-ban-den', 'Văn bản chỉ đạo', 'văn bản chỉ đạo'], ['nhiem-vu-giao', 'Nhiệm vụ được giao', 'được giao'], ['nhiem-vu-nhan', 'Nhiệm vụ tiếp nhận', 'tiếp nhận']];
  const cards = STK.map(([n, lab, w], i) => {
    const c = E.el(`<div class="stackc" style="left:${960 - CW / 2}px;top:${150}px;width:${CW}px;height:${CH}px"><img src="${SCR(n)}"></div>`, s12);
    const chip = E.chip(lab, i + 1, c); chip.style.left = '20px'; chip.style.top = '18px'; chip.style.fontSize = '26px';
    return { c, chip, at: E.wordAt('c12', w) - .25 };
  });
  cards.forEach((k, i) => {
    tl.fromTo(k.c, { x: 1500, z: 200, rotationY: -45, opacity: 0 }, { x: 0, z: 0, rotationY: 0, opacity: 1, duration: .75, ease: 'power3.out' }, k.at);
    tl.fromTo(k.chip, { opacity: 0, scale: .5 }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(2)' }, k.at + .45);
    E.ev(k.at, 'swoosh');
    for (let j = 0; j < i; j++) {
      const depth = i - j;
      tl.to(cards[j].c, { x: -230 * depth, z: -260 * depth, rotationY: 16, filter: `brightness(${1 - .25 * depth})`, duration: .75, ease: 'power3.out' }, k.at);
    }
  });
  const tHan = E.wordAt('c12', 'hạn xử lý') - .2, top = cards[2].c;
  const hHan = E.hl(1636 * CS, 562 * CS, 230 * CS, 470 * CS, top);
  tl.fromTo(hHan, { opacity: 0 }, { opacity: 1, duration: .3 }, tHan + .2);
  tl.to(top, { scale: 1.35, x: -380, y: -60, duration: .9, ease: 'power3.inOut', transformOrigin: '100% 60%' }, tHan);
  tl.to(cards.slice(0, 2).map(k => k.c), { opacity: .15, duration: .5 }, tHan);
  // con trỏ bấm dòng đầu -> mở chi tiết hồ sơ (tiến độ, kết quả)
  const tTD = E.wordAt('c12', 'tiến độ') - .35;
  E.cursor(s12, [{ t: tTD - 1.1, x: 1500, y: 980 }, { t: tTD - .3, x: 760, y: 520, hold: .4 }], [tTD - .25]);
  const rec = E.el(`<div class="stackc" style="left:${960 - CW / 2}px;top:150px;width:${CW}px;height:${CH}px"><img src="${SCR('record')}"></div>`, s12);
  tl.fromTo(rec, { opacity: 0, scale: .4, y: 120 }, { opacity: 1, scale: 1, y: 0, duration: .6, ease: 'back.out(1.3)' }, tTD);
  tl.to(top, { opacity: 0, duration: .4 }, tTD + .1);
  const hP = E.hl(972 * CS, 252 * CS, 806 * CS, 56 * CS, rec), hT = E.hl(1488 * CS, 812 * CS, 270 * CS, 240 * CS, rec);
  const cP = E.chip('Tiến độ', null, rec); cP.style.left = 972 * CS + 'px'; cP.style.top = 252 * CS - 58 + 'px'; cP.style.fontSize = '22px';
  const cK = E.chip('Kết quả', null, rec); cK.style.left = 1488 * CS - 30 + 'px'; cK.style.top = 812 * CS - 60 + 'px'; cK.style.fontSize = '22px';
  tl.fromTo([hP, cP], { opacity: 0 }, { opacity: 1, duration: .3, stagger: .1 }, tTD + .5);
  tl.fromTo([hT, cK], { opacity: 0 }, { opacity: 1, duration: .3, stagger: .1 }, E.wordAt('c12', 'kết quả') - .1);
  tl.to(rec, { scale: 1.04, duration: 2.5, ease: 'sine.inOut' }, tTD + .6);
  const tOut12 = e12 + .7;
  // chuyển cảnh mềm: thẻ hồ sơ thu nhỏ, mờ dần, cùng lúc băng chuyền hiện dần từ xa (chồng nhau ~0,6s)
  tl.to(rec, { scale: .55, y: -40, opacity: 0, filter: 'blur(8px)', duration: .9, ease: 'power2.inOut' }, tOut12);
  E.span(s12, tV12 - .3, tOut12 + .95);

  /* =============== C13 — CHỈ TIÊU SỞ, NGÀNH (băng chuyền → Sở GD&ĐT tách lớp) =============== */
  const s13 = wrap('s13');
  s13.innerHTML = `<div class="layer" id="carWrap" style="perspective:2000px;perspective-origin:50% 45%"><div id="carRing"></div></div>`;
  const tC0 = tOut12 + .2;
  const tV13 = tC0 + 1.4; const e13 = E.voice('c13', tV13);
  const CARDS = [['so-gddt', 'Sở Giáo dục và Đào tạo'], ['so-vhtt', 'Sở Văn hóa và Thể thao'], ['dang-to-chuc', 'Ban Tổ chức Thành ủy'], ['so-hcc', 'Trung tâm Phục vụ hành chính công'],
    ['so-yte', 'Sở Y tế'], ['so-taichinh', 'Sở Tài chính'], ['so-nnmt', 'Sở Nông nghiệp và Môi trường'], ['so-noivu', 'Sở Nội vụ']];
  const N = CARDS.length, STEP = 360 / N, RAD = Math.round(440 / Math.tan(Math.PI / N) * 1.18);
  const ring = s13.querySelector('#carRing');
  ring.innerHTML = CARDS.map(([n, cap], k) => `<div class="cslot" style="transform:rotateY(${k * STEP}deg) translateZ(${RAD}px)"><div class="ccard"><img src="${SCR(n)}"></div><div class="ccap"><i>${String(k + 1).padStart(2, '0')}</i> · ${cap}</div></div>`).join('');
  const slots = [...ring.children];
  const T_STOP = E.wordAt('c13', 'thông tin chỉ số') - 1.3;   // dừng sớm để kịp phóng to rồi mới tách lớp
  ring.style.transform = 'translateZ(-6000px)';   // trạng thái chờ, tránh hiện băng chuyền ở vị trí mặc định
  E.drawers.push(t => {
    if (t < tC0 - .5 || t > T_STOP + 1.2) return;
    const u = ease.inOutSine(prog(t, tC0 - .5, T_STOP)), A = lerp(-STEP * 3.5, -360, u);   // lướt qua ~3–4 sở, quay chậm đều
    // ~1,1s cuối băng chuyền về thẳng (tilt=0) để thẻ giữa nằm đúng chỗ màn phóng to bắt đầu -> không bị nhảy
    const level = 1 - ease.inOut2(prog(t, T_STOP - 1.1, T_STOP));
    const zin = ease.out3(prog(t, tC0 - .5, tC0 + 1.4)), tilt = (lerp(16, 4, zin) + 1.5 * Math.sin(t * .8)) * level;
    ring.style.transform = `translateZ(${lerp(-2600, 0, zin) - RAD}px) rotateX(${-tilt}deg) rotateY(${A}deg)`;
    slots.forEach((s, k) => {
      const th = ((k * STEP + A) % 360 + 540) % 360 - 180, f = Math.cos(th * Math.PI / 180), fr = Math.max(0, f);
      s.querySelector('.ccard').style.filter = `brightness(${.32 + .68 * fr * fr})`;
      s.querySelector('.ccap').style.opacity = clamp((f - .86) / .14);
    });
  });
  tl.fromTo(s13.querySelector('#carWrap'), { opacity: 0 }, { opacity: 1, duration: .8, ease: 'power1.out' }, tC0 - .5);
  const xb = E.el(`<div class="xbase"><img src="${SCR('so-gddt')}"></div>`, s13);
  // thẻ giữa (Sở GD&ĐT) được thay ngay bằng màn phóng to ở đúng vị trí -> không bị mờ nhạt 1 nhịp; các thẻ khác mờ dần
  tl.set(slots[0], { opacity: 0 }, T_STOP);
  tl.to(s13.querySelector('#carWrap'), { opacity: 0, duration: .6, ease: 'power1.in' }, T_STOP);
  tl.fromTo(xb, { opacity: 0, scale: 880 / 1500, y: -70 }, { opacity: 1, duration: .01 }, T_STOP - .01);
  tl.to(xb, { scale: 1, y: 0, duration: .9, ease: 'power2.inOut' }, T_STOP);
  const tK = E.wordAt('c13', 'thông tin chỉ số');
  const tDim = Math.max(tK - .05, T_STOP + .95);
  tl.to(xb, { filter: 'brightness(.38) blur(2px)', scale: .97, duration: .7, ease: 'power2.inOut' }, tDim);
  const title13 = E.el(`<div class="sotitle"><div>Sở Giáo dục và Đào tạo</div></div>`, s13);
  tl.fromTo(title13, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: .5, ease: 'back.out(2)' }, T_STOP + .4);
  const BS = 1500 / 1920, BX = 210, BY = 118, toScr = (x, y, w, h) => ({ x: BX + x * BS, y: BY + y * BS, w: w * BS, h: h * BS });
  const PARTS = [
    { img: 'sgd-kpi', ow: 1650, oh: 154, src: toScr(135, 160, 1650, 154), fin: { x: 90, y: 170, w: 1740 }, n: 1, label: 'Thông tin chỉ số', say: 'thông tin chỉ số', ry: 0, chipAt: [90, 104] },
    { img: 'sgd-health', ow: 539, oh: 241, src: toScr(690, 630, 539, 241), fin: { x: 100, y: 470, w: 600 }, n: 2, label: 'Mức độ hoàn thành', say: 'mức độ hoàn thành', ry: 8, chipAt: [100, 404] },
    { img: 'sgd-chart', ow: 817, oh: 465, src: { x: 900, y: 1100, w: 500, h: 285 }, fin: { x: 740, y: 450, w: 620 }, n: 3, label: 'Biểu đồ diễn biến', say: 'biểu đồ', ry: 0, chipAt: [740, 384] },
    { img: 'nguon-du-lieu', ow: 527, oh: 750, src: { x: 1980, y: 600, w: 400, h: 569 }, fin: { x: 1400, y: 450, w: 440, clipH: 330 }, n: 4, label: 'Nguồn & thời điểm cập nhật', say: 'kèm theo nguồn', ry: -8, chipAt: [1360, 384] },
  ];
  PARTS.forEach(P => {
    const h = P.fin.w * P.oh / P.ow, bh = P.fin.clipH || h;
    const el = E.el(`<div class="xpart" style="left:${P.fin.x}px;top:${P.fin.y}px;width:${P.fin.w}px;height:${bh}px;transform-origin:0 0"><div class="xin"><img src="${PART(P.img)}"></div></div>`, s13);
    const chip = E.chip(P.label, P.n, s13); chip.style.left = P.chipAt[0] + 'px'; chip.style.top = P.chipAt[1] + 'px';
    const a = Math.max(E.wordAt('c13', P.say) - .2, tDim + .35); P.el = el; P.tA = a;
    tl.fromTo(el, { opacity: 0, x: P.src.x - P.fin.x, y: P.src.y - P.fin.y, scale: P.src.w / P.fin.w }, { opacity: 1, x: 0, y: 0, scale: 1, rotationY: P.ry, rotationX: 3, duration: .85, ease: 'power3.out' }, a);
    tl.fromTo(chip, { opacity: 0, scale: .6, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: .45, ease: 'back.out(2)' }, a + .4);
    E.ev(a, 'swoosh');
  });
  E.drawers.push(t => PARTS.forEach((P, i) => { const a = t - P.tA; if (a < .85) return; P.el.firstChild.style.transform = `translateY(${Math.sin(a * 1.4 + i) * 6}px)`; }));
  const tOut13 = e13 + 1.0;
  tl.to(s13, { scale: 1.25, opacity: 0, filter: 'blur(8px)', duration: .6, ease: 'power3.in' }, tOut13);
  E.span(s13, tC0 - .55, tOut13 + .65);

  /* =============== C14 — CẢNH BÁO + TRUY SÂU =============== */
  const s14 = wrap('s14');
  const tV14 = tOut13 + .5; const e14 = E.voice('c14', tV14);
  const np = E.el(`<div class="xpart" style="left:150px;top:150px;width:620px;height:709px;transform-origin:50% 50%"><img src="${PART('notify')}"></div>`, s14);
  tl.fromTo(np, { opacity: 0, x: -500, rotationY: 40 }, { opacity: 1, x: 0, rotationY: 12, duration: .8, ease: 'power3.out' }, tOut13 + .3);
  const bell = E.el(`<div style="position:absolute;left:700px;top:110px;width:130px;height:130px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#ff6b6b,#a3121c);display:flex;align-items:center;justify-content:center;box-shadow:0 0 50px rgba(229,72,77,.7)">${IC.s(P.bell, '#fff', 70, 2.2)}</div>`, s14);
  tl.fromTo(bell, { scale: 0 }, { scale: 1, duration: .5, ease: 'back.out(2.5)' }, tV14);
  E.drawers.push(t => { if (t < tV14 || t > e14 + 1) return; bell.firstChild.style.transform = `rotate(${Math.sin(t * 28) * 14 * (0.5 + 0.5 * Math.sin(t * 2.2) ** 2)}deg)`; });
  for (let k = 0; k < 3; k++) { const rp = E.el(`<div style="position:absolute;left:765px;top:175px;width:0;height:0"><div style="position:absolute;left:-65px;top:-65px;width:130px;height:130px;border-radius:50%;border:3px solid #ff6b6b"></div></div>`, s14); tl.fromTo(rp.firstChild, { scale: 1, opacity: .9 }, { scale: 3.2, opacity: 0, duration: 1.4, repeat: 3, ease: 'power2.out' }, tV14 + k * .45); }
  const ALR = [['Sắp đến hạn', '509 nhiệm vụ giao chưa hoàn thành, gần hạn', '#f2a33a', P.clock, 'sắp đến hạn'], ['Quá hạn', 'Tổng hợp số liệu ngành Giáo dục và Đào tạo · quá hạn 9 ngày', '#e5484d', P.alert, 'quá hạn'], ['Vượt ngưỡng', 'Tỷ lệ cận thị 24,9% · tăng 0,8 điểm %', '#c86bff', P.chart, 'vượt ngưỡng']];
  ALR.forEach(([h, d, c, ic, w], i) => {
    const el = E.el(`<div style="position:absolute;left:930px;top:${250 + i * 175}px;width:860px;height:150px;border-radius:16px;background:linear-gradient(90deg,${E.hexA(c, .28)},rgba(8,20,56,.94) 40%);border:2px solid ${c};box-shadow:0 0 40px ${E.hexA(c, .4)};display:flex;align-items:center;gap:26px;padding:0 30px">
      <div style="width:84px;height:84px;border-radius:18px;background:${c};display:flex;align-items:center;justify-content:center;flex:0 0 auto">${IC.s(ic, '#fff', 50, 2.2)}</div>
      <div><div style="font-size:38px;font-weight:900;color:#fff">${h}</div><div style="font-size:22px;color:#d6e2ff;margin-top:6px">${d}</div></div></div>`, s14);
    const a = E.wordAt('c14', w) - .15;
    tl.fromTo(el, { opacity: 0, x: 400 }, { opacity: 1, x: 0, duration: .55, ease: 'back.out(1.5)' }, a);
    tl.fromTo(el, { boxShadow: `0 0 80px ${E.hexA(c, .9)}` }, { boxShadow: `0 0 40px ${E.hexA(c, .4)}`, duration: .8 }, a + .4);
    E.ev(a, 'alert');
  });
  // truy sâu: Thành phố → Sở, ngành → Phường, xã
  const tDrill = E.wordAt('c14', 'tra cứu') - .3;
  tl.to(s14.children, { opacity: 0, x: -200, duration: .5, ease: 'power2.in', stagger: .02 }, tDrill - .2);
  const DL = [['tong-quan', 'Thành phố', 'tra cứu'], ['so-gddt', 'Sở, ngành', 'từng đơn vị'], ['sgd-xa', 'Phường, xã', 'địa bàn']];
  const crumb = E.el(`<div class="crumb">${DL.map(d => `<span>${d[1]}</span>`).join('')}</div>`, s14);
  const crumbs = [...crumb.children];
  DL.forEach(([n, lab, w], i) => {
    const a = i ? E.wordAt('c14', w) - .3 : tDrill + .2;
    const c = E.el(`<div class="stackc" style="left:${960 - CW / 2}px;top:160px;width:${CW}px;height:${CH}px"><img src="${SCR(n)}"></div>`, s14);
    tl.fromTo(c, { opacity: 0, z: -1400, scale: .9 }, { opacity: 1, z: 0, scale: 1, duration: .7, ease: 'power3.out' }, a);
    tl.fromTo(crumbs[i], { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: .35 }, a + .2);
    if (i < 2) {
      const nx = i ? E.wordAt('c14', DL[i + 1][2]) - .3 : E.wordAt('c14', DL[1][2]) - .3;
      tl.to(c, { z: 500, opacity: 0, scale: 1.3, duration: .55, ease: 'power3.in' }, nx);
      E.cursor(s14, [{ t: nx - .9, x: 1300, y: 900 }, { t: nx - .2, x: i ? 760 : 620, y: i ? 560 : 330, hold: .15 }], [nx - .15]);
    }
    E.ev(a, 'swoosh');
  });
  tl.set(crumbs, { opacity: 0 }, 0);
  const shield = E.el(`<div style="position:absolute;left:0;right:0;top:850px;display:flex;justify-content:center;z-index:9"><div style="display:flex;align-items:center;gap:16px;padding:14px 32px;border-radius:40px;background:rgba(3,10,30,.94);border:2.5px solid #3fd38a;box-shadow:0 0 40px rgba(63,211,138,.5);font-size:30px;font-weight:900">${IC.s(P.shield, '#3fd38a', 40, 2.2)}Đúng phạm vi phân quyền</div></div>`, s14);
  tl.fromTo(shield, { opacity: 0, scale: .5 }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(2.2)' }, E.wordAt('c14', 'phạm vi') - .2);
  E.ev(E.wordAt('c14', 'phạm vi'), 'lock');
  const tOut14 = e14 + .8;
  tl.to(s14, { opacity: 0, scale: .9, duration: .5 }, tOut14);
  E.span(s14, tOut13 + .2, tOut14 + .55);

  /* =============== C15 — BẢN ĐỒ TOÀN QUỐC (vẽ từ dữ liệu ranh giới 34 tỉnh) =============== */
  const s15 = wrap('s15');
  const tV15 = tOut14 + .5; const e15 = E.voice('c15', tV15);
  const K = 112, LON0 = 101.5, LAT0 = 24.0;
  const pj = ([lon, lat]) => [((lon - LON0) * K).toFixed(1), ((LAT0 - lat) * K * 1.03).toFixed(1)];
  const ringPath = ring => 'M' + ring.map(pj).map(p => p.join(',')).join('L') + 'Z';
  const geomPath = g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map(poly => poly.map(ringPath).join('')).join('');
  const feats = VN34_GEOJSON.features;
  const neigh = (typeof VN_NEIGHBORS_GEOJSON !== 'undefined' ? VN_NEIGHBORS_GEOJSON.features : []);
  const pal = ['#1d4ed8', '#2563eb', '#0e7490', '#0891b2', '#1e40af', '#0369a1', '#3b5bdb', '#155e75'];
  s15.innerHTML = `<svg id="vnmap" width="1920" height="1080" style="position:absolute;left:0;top:0"><g id="mapCam">
      ${neigh.map(f => `<path d="${geomPath(f.geometry)}" fill="#0d1a38" stroke="#22345e" stroke-width="1"/>`).join('')}
      ${feats.map((f, i) => `<path class="prov" data-lat="${f.properties.label ? f.properties.label[0] : 16}" data-hn="${/Hà Nội/.test(f.properties.ten) ? 1 : 0}" d="${geomPath(f.geometry)}" fill="#0b1a3d" stroke="#f2c14e" stroke-opacity=".55" stroke-width="1.1" data-c="${pal[i % pal.length]}"/>`).join('')}
    </g></svg>
    <div id="mapHud" style="position:absolute;left:90px;top:90px"><div style="font-size:24px;font-weight:800;color:#f2c14e;letter-spacing:5px">BẢN ĐỒ SỐ TOÀN QUỐC</div>
      <div style="display:flex;align-items:baseline;gap:14px;margin-top:6px"><span class="cnt" style="font-size:110px;font-weight:900;line-height:1">0</span><span style="font-size:34px;font-weight:700">tỉnh, thành phố</span></div></div>`;
  const cam15 = s15.querySelector('#mapCam'), provs = [...s15.querySelectorAll('.prov')];
  const C = { lon: 105.8, lat: 21.2, z: 2.4 };
  E.drawers.push(t => {
    if (t < tV15 - 1 || t > e15 + 2.5) return;
    const [x, y] = pj([C.lon, C.lat]).map(Number);
    cam15.setAttribute('transform', `translate(${960 - x * C.z},${540 - y * C.z}) scale(${C.z})`);
    cam15.querySelectorAll('path').forEach(p => p.setAttribute('stroke-width', 1.1 / C.z));
    provs.forEach(p => {
      const lat = +p.dataset.lat, at = tV15 - .2 + (24 - lat) / 16 * 3.2, u = ease.out2(prog(t, at, at + .6));
      p.setAttribute('fill', u <= 0 ? '#0b1a3d' : (p.dataset.hn === '1' ? `rgba(242,193,78,${.35 + .6 * u})` : E.hexA(p.dataset.c, .25 + .65 * u)));
    });
    const cnt = Math.round(34 * ease.out2(prog(t, E.wordAt('c15', 'ba mươi tư') - .4, E.wordAt('c15', 'ba mươi tư') + 1.6)));
    s15.querySelector('.cnt').textContent = cnt;
  });
  tl.fromTo(s15, { opacity: 0 }, { opacity: 1, duration: .5 }, tV15 - .6);
  tl.to(C, { lon: 106.6, lat: 17.0, z: 1.55, duration: 2.0, ease: 'power2.inOut' }, tV15 - .2);
  tl.to(C, { lon: 106.2, lat: 12.0, z: 1.45, duration: 1.6, ease: 'power2.inOut' }, tV15 + 1.8);
  const tHS = E.wordAt('c15', 'hoàng sa'), tTS = E.wordAt('c15', 'trường sa');
  tl.to(C, { lon: 110.6, lat: 14.0, z: .86, duration: 1.6, ease: 'power2.inOut' }, Math.min(tV15 + 3.4, tHS - 1.4));
  const ISL = [[112.0, 16.45, 'Quần đảo Hoàng Sa', tHS, -1], [114.0, 9.9, 'Quần đảo Trường Sa', tTS, 1]];
  ISL.forEach(([lon, lat, name, a, side], i) => {
    const mk = E.el(`<div style="position:absolute;left:0;top:0;width:0;height:0"><div class="pr" style="position:absolute;left:-46px;top:-46px;width:92px;height:92px;border-radius:50%;border:3px solid #f2c14e;box-shadow:0 0 24px #f2c14e"></div><div class="pr2" style="position:absolute;left:-46px;top:-46px;width:92px;height:92px;border-radius:50%;border:2px solid #f2c14e"></div>
      <div class="mlabel" style="left:${side > 0 ? 64 : 64}px;top:${-26}px;font-size:28px">${name}</div></div>`, s15);
    E.drawers.push(t => { const [x, y] = pj([lon, lat]).map(Number); mk.style.transform = `translate(${960 + (x - Number(pj([C.lon, C.lat])[0])) * C.z}px,${540 + (y - Number(pj([C.lon, C.lat])[1])) * C.z}px)`; });
    tl.fromTo(mk, { opacity: 0, scale: .3 }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(2)' }, a - .1);
    tl.fromTo(mk.querySelector('.pr2'), { scale: 1, opacity: .9 }, { scale: 2.4, opacity: 0, duration: 1.1, repeat: 3, ease: 'power2.out' }, a);
    E.ev(a, 'ding', { i: i + 1 });
  });
  const tOut15 = e15 + 1.2;
  tl.to(C, { z: .95, duration: tOut15 - (tTS + .5), ease: 'sine.inOut' }, tTS + .5);
  tl.to(s15, { opacity: 0, duration: .5 }, tOut15);
  E.span(s15, tV15 - .7, tOut15 + .55);

  /* =============== C16 — QUẢN TRỊ TỔ CHỨC, TÀI KHOẢN, PHÂN QUYỀN + NHẬT KÝ =============== */
  const s16 = wrap('s16');
  const tV16 = tOut15 + .45; const e16 = E.voice('c16', tV16);
  const bgq = E.el(`<img src="${SCR('quan-tri')}" style="position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.13;filter:blur(3px)">`, s16);
  // cây tổ chức: cấp Thành phố dùng "Thành ủy", cấp xã/phường dùng "Đảng ủy" (theo góp ý)
  const tree = E.el(`<div class="layer" style="transform-origin:0 0"></div>`, s16);
  const NODES = [
    ['root', 'Thành phố Hà Nội', 960, 150, null, '#f2c14e'],
    ['tu', 'Thành ủy', 220, 320, 'root', '#e5484d'], ['hd', 'HĐND', 520, 320, 'root', '#f08c2e'], ['ub', 'UBND', 860, 320, 'root', '#19b3a6'], ['mt', 'MTTQ', 1180, 320, 'root', '#9b6cf2'], ['xa', '126 xã, phường', 1580, 320, 'root', '#3fd38a'],
    ['tu1', 'Các ban Đảng', 220, 490, 'tu'], ['hd1', 'Các ban HĐND', 520, 490, 'hd'], ['ub1', '14 sở', 760, 490, 'ub'], ['ub2', '03 đơn vị ngang sở', 965, 490, 'ub'], ['mt1', 'Tổ chức thành viên', 1185, 650, 'mt'],
    ['xa1', 'Đảng ủy xã, phường', 1450, 490, 'xa'], ['xa2', 'HĐND, UBND, MTTQ xã', 1730, 490, 'xa'],
    ['s1', 'Phòng, ban sở', 760, 660, 'ub1'], ['x1', 'Phòng, ban xã, phường', 1730, 660, 'xa2'],
  ];
  const svgT = E.el(`<svg width="1920" height="1080" style="position:absolute;left:0;top:0">${NODES.filter(n => n[4]).map(n => { const p = NODES.find(m => m[0] === n[4]); return `<path class="ed" d="M${p[2]},${p[3] + 24} C${p[2]},${(p[3] + n[3]) / 2} ${n[2]},${(p[3] + n[3]) / 2} ${n[2]},${n[3] - 24}" fill="none" stroke="rgba(140,180,255,.7)" stroke-width="2.5"/>`; }).join('')}</svg>`, tree);
  const nodeEls = NODES.map(n => E.el(`<div class="tnode" style="left:${n[2]}px;top:${n[3]}px;${n[5] ? `border-color:${n[5]};box-shadow:0 0 24px ${E.hexA(n[5], .45)};font-size:24px` : ''}">${n[1]}</div>`, tree));
  s16.style.display = 'block'; const nodeW = nodeEls.map(el => el.offsetWidth); s16.style.display = 'none';
  const tTree = tV16 - .2;
  const depthOf = i => { let d = 0, p = NODES[i][4]; while (p) { d++; p = NODES.find(m => m[0] === p)[4]; } return d; };
  nodeEls.forEach((el, i) => tl.fromTo(el, { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(2)' }, tTree + depthOf(i) * .45 + i * .03));
  [...svgT.querySelectorAll('.ed')].forEach((p, i) => { const n = NODES.filter(m => m[4])[i]; tl.fromTo(p, { attr: { 'stroke-dasharray': '0 600' } }, { attr: { 'stroke-dasharray': '600 0' }, duration: .55, ease: 'power2.out' }, tTree + depthOf(NODES.indexOf(n)) * .45 - .25); });
  // tài khoản + quyền truy cập gắn vào nút
  const tTK = E.wordAt('c16', 'tài khoản') - .1, tPQ = E.wordAt('c16', 'quyền truy cập') - .1;
  ['tu', 'hd', 'ub', 'mt', 'xa', 'ub1', 'xa1'].forEach((id, i) => {
    const k = NODES.findIndex(m => m[0] === id), x = NODES[k][2] + nodeW[k] / 2 - 10, y = NODES[k][3];
    const b = E.el(`<div style="position:absolute;left:${x}px;top:${y - 46}px;width:36px;height:36px;border-radius:50%;background:#2563eb;border:2px solid #fff;display:flex;align-items:center;justify-content:center">${IC.s(P.users, '#fff', 20, 2.2)}</div>`, tree);
    tl.fromTo(b, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(3)' }, tTK + i * .06);
    const l = E.el(`<div style="position:absolute;left:${x}px;top:${y + 12}px;width:36px;height:36px;border-radius:50%;background:#0f7a4a;border:2px solid #3fd38a;display:flex;align-items:center;justify-content:center">${IC.s(P.lock, '#fff', 20, 2.2)}</div>`, tree);
    tl.fromTo(l, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(3)' }, tPQ + i * .06);
  });
  // khi nhật ký xuất hiện: cây thu nhỏ sang trái nhường chỗ
  const tLog = E.wordAt('c16', 'nhật ký') - 1.2;
  tl.to(tree, { scale: .64, x: 30, y: 150, duration: .8, ease: 'power3.inOut' }, tLog - .3);  E.ev(tTK, 'pop'); E.ev(tPQ, 'lock');
  // nhật ký thao tác cuộn liên tục
  const LOGS = [['Tài khoản Thành ủy đăng nhập hệ thống', 'Cấp 04 trục · Trục Thành ủy', '#2563eb', P.key], ['Giao nhiệm vụ cho Sở Giáo dục và Đào tạo', 'Tổng hợp số liệu ngành Giáo dục và Đào tạo', '#f2a33a', P.check],
    ['Cập nhật chỉ tiêu Sở Y tế', 'Ngộ độc thực phẩm · tháng 9/2026', '#19b3a6', P.chart], ['Phân quyền tài khoản Phường Ba Đình', 'Phạm vi: dữ liệu của phường', '#3fd38a', P.lock],
    ['Phê duyệt kết quả nhiệm vụ', 'Ban Nội chính Thành ủy', '#9b6cf2', P.shield], ['Xuất Excel bộ chỉ tiêu Sở Tài chính', 'Kỳ báo cáo quý 3/2026', '#5b9bff', P.doc],
    ['Tài khoản UBND đăng nhập hệ thống', 'Cấp 04 trục · Trục UBND', '#2563eb', P.key], ['Tạo tài khoản phòng, ban xã', 'Phòng Văn hóa – Xã hội · Phường Hoàn Kiếm', '#3fd38a', P.users],
    ['Thu hồi nhiệm vụ', 'Điều phối, giao ban khối chính quyền', '#e5484d', P.alert], ['Cấu hình chỉ tiêu đơn vị', 'Sở Nội vụ', '#f2c14e', P.gear]];
  const logBox = E.el(`<div style="position:absolute;left:1250px;top:120px;width:620px;height:760px;border-radius:18px;background:rgba(6,16,44,.9);border:2px solid rgba(242,193,78,.6);box-shadow:0 0 40px rgba(242,193,78,.25);overflow:hidden">
    <div style="height:70px;display:flex;align-items:center;gap:14px;padding:0 22px;border-bottom:1px solid rgba(255,255,255,.12);font-size:24px;font-weight:900;letter-spacing:3px"><span class="rec" style="width:14px;height:14px;border-radius:50%;background:#e5484d;box-shadow:0 0 12px #e5484d"></span>NHẬT KÝ THAO TÁC</div>
    <div class="lw" style="position:absolute;left:20px;top:84px;width:580px;height:660px;overflow:hidden"><div class="lst" style="position:absolute;left:0;top:0;width:580px"></div></div></div>`, s16);
  const lst = logBox.querySelector('.lst');
  const ROWS = [...LOGS, ...LOGS];
  lst.innerHTML = ROWS.map((l, i) => `<div class="logrow" style="top:${i * 104}px;width:580px"><div class="li" style="background:${E.hexA(l[2], .25)};border:1.5px solid ${l[2]}">${IC.s(l[3], '#fff', 26, 2)}</div><div><div class="lt">${l[0]}</div><div class="ls">${l[1]} · ${String(17 - Math.floor(i / 3)).padStart(2, '0')}:${String((59 - i * 4 + 120) % 60).padStart(2, '0')}</div></div></div>`).join('');
  tl.fromTo(logBox, { opacity: 0, x: 200 }, { opacity: 1, x: 0, duration: .6, ease: 'power3.out' }, tLog);
  E.drawers.push(t => { const a = t - (E.wordAt('c16', 'nhật ký') - 1.2); if (a < 0) return; lst.style.transform = `translateY(${-((a * 60) % (LOGS.length * 104))}px)`; logBox.querySelector('.rec').style.opacity = .4 + .6 * (Math.sin(t * 6) > 0); });
  const tOut16 = e16 + 1.0;
  E.span(s16, tV16 - .5, tOut16 + .65);
  tl.fromTo(s16, { opacity: 0 }, { opacity: 1, duration: .4 }, tV16 - .5);
  return { end: tOut16 };
};




