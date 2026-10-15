/* PHẦN 02 · GIẢI PHÁP & KIẾN TRÚC — sơ đồ "Mô hình luồng giải pháp liên thông 4 trục" dựng lại đủ 6 tầng + nguyên tắc.
   Mọi thứ nằm trong 1 hệ toạ độ #dg (1920×1950); camera = {cx, cy, s} tween theo lời đọc. */
window.S = window.S || {};
const IC = {
  user: c => `<svg width="30" height="30" viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="4.2" fill="${c}"/><path d="M3.5 22c0-4.9 3.8-8.6 8.5-8.6s8.5 3.7 8.5 8.6" fill="${c}"/></svg>`,
  s: (d, c = '#cfe0ff', z = 30, w = 1.9) => `<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`,
};
const P = {
  flag: '<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  check: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
  chart: '<path d="M4 20h16"/><rect x="6" y="11" width="3" height="7"/><rect x="11" y="7" width="3" height="11"/><rect x="16" y="13" width="3" height="5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  chat: '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
  dome: '<path d="M4 20h16M6 20v-7h12v7M9 13V9a3 3 0 0 1 6 0v4M12 3v3"/>',
  cols: '<path d="M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 .2 5 2.4 5 5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  folder: '<path d="M3 7h6l2 2h10v10H3z"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  dash: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 13l3-3 3 2 4-4"/>',
  org: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
  badge: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.4"/><path d="M5.5 16.5c.7-1.7 2-2.5 3.5-2.5s2.8.8 3.5 2.5M14 10h4M14 13h3"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path class="shk" d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  log: '<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  ai: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  monitor: '<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>',
};

S.p2 = async function (t0) {
  const { tl, clamp, lerp, prog, ease, rng, $ } = E;
  const ch = E.chapter(t0, '02', 'Giải pháp & kiến trúc');
  const scene = E.el(`<div class="scene" id="dgWrap"><div id="dgTilt" class="layer" style="transform-style:preserve-3d;transform-origin:960px 540px"><div id="dg"></div></div></div>`, $('#scenes'));
  const dg = scene.querySelector('#dg'), tilt = scene.querySelector('#dgTilt');
  const X0 = 380, W = 1480;
  const AX = [
    { name: 'Thành ủy', c: '#e5484d', ic: P.star, its: [['Chỉ đạo', P.flag], ['Văn bản', P.doc], ['Công việc', P.check], ['Báo cáo', P.chart]], say: 'thành ủy' },
    { name: 'HĐND', c: '#f08c2e', ic: P.dome, its: [['Giám sát', P.eye], ['Văn bản', P.doc], ['Công việc', P.check], ['Báo cáo', P.chart]], say: 'hội đồng' },
    { name: 'UBND', c: '#19b3a6', ic: P.cols, its: [['Điều hành', P.gear], ['Văn bản', P.doc], ['Công việc', P.check], ['Báo cáo', P.chart]], say: 'ủy ban nhân dân' },
    { name: 'MTTQ', c: '#9b6cf2', ic: P.users, its: [['Phản biện', P.chat], ['Văn bản', P.doc], ['Công việc', P.check], ['Báo cáo', P.chart]], say: 'mặt trận' },
  ];
  const USERS = ['Lãnh đạo Thành ủy', 'Lãnh đạo HĐND', 'Lãnh đạo UBND', 'Lãnh đạo MTTQ', 'Lãnh đạo sở, ngành', 'Lãnh đạo xã, phường', 'Cán bộ, công chức, viên chức'];
  const T3 = [['Quản lý chỉ đạo điều hành', P.flag], ['Quản lý văn bản', P.doc], ['Quản lý công việc, nhiệm vụ', P.check], ['Quản lý báo cáo chuyên ngành', P.chart], ['Theo dõi tiến độ, SLA', P.clock],
    ['Hồ sơ công việc', P.folder], ['Mobile, App cán bộ', P.phone], ['Tìm kiếm, tra cứu', P.search], ['Cảnh báo', P.bell], ['IOC / Dashboard', P.dash]];
  const T3B = [['Cơ quan, đơn vị', P.org], ['Chức danh', P.badge], ['Địa bàn', P.pin], ['Lĩnh vực', P.grid], ['SSO', P.key], ['RBAC / ABAC', P.lock], ['MFA', P.shield], ['Audit Log', P.log]];
  const SRC = [
    { key: 'xa', x: 380, w: 470, num: 126, pad: 3, lbl: 'phường / xã', color: '#3fd38a', say: 'một trăm hai mươi sáu' },
    { key: 'so', x: 870, w: 470, num: 14, pad: 2, lbl: 'sở', color: '#5b9bff', say: 'mười bốn' },
    { key: 'ns', x: 1360, w: 500, num: 3, pad: 2, lbl: 'đơn vị ngang cấp sở', color: '#3fd0e0', say: 'ba đơn vị' },
  ];
  const SUBS = [
    ['1. Tiếp nhận & tích hợp dữ liệu', ['API Gateway', 'ESB / Message Bus', 'CDC / Streaming', 'ETL / ELT'], IC.s('<path d="M7 17H6a4 4 0 0 1-.5-8A6 6 0 0 1 17 7.5a4 4 0 0 1 1 7.5h-1"/><path d="M12 20v-9m-3.5 3.5L12 11l3.5 3.5"/>', '#7fb2ff', 44)],
    ['2. Chuẩn hóa & quản trị dữ liệu', ['Data Quality', 'Metadata', 'Master Data', 'Mapping'], IC.s('<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>', '#4fd18b', 44)],
    ['3. Data Hub / Data Mart', ['Dữ liệu văn bản, nhiệm vụ', 'Dữ liệu KPI / OKR', 'Dữ liệu phản ánh, cán bộ', 'Dữ liệu chuyên ngành'], IC.s(P.layers, '#b18cff', 44)],
    ['4. Data Service', ['API Service', 'Query Service', 'Dashboard Service', 'Report Service'], IC.s('<rect x="2.5" y="6" width="19" height="12" rx="6"/><path d="M7 15l1.5-5 1.5 5M7.4 13.3h2.2M12.5 15v-5h1.8a1.4 1.4 0 0 1 0 2.8h-1.8M17.5 10v5"/>', '#4cc9ff', 44)],
  ];
  const T6 = [['Dashboard Thành ủy', P.chart, '#e5484d'], ['Dashboard HĐND', P.chart, '#f08c2e'], ['Dashboard UBND', P.chart, '#19b3a6'], ['Dashboard MTTQ', P.chart, '#9b6cf2'],
    ['Dashboard Sở, ngành', P.chart, '#5b9bff'], ['Dashboard Xã, phường', P.chart, '#3fd38a'], ['Bản đồ GIS', P.map, '#3fd0e0'], ['AI tóm tắt báo cáo', P.ai, '#b18cff'], ['Cảnh báo thông minh', P.alert, '#ff6b6b']];
  const PRIN = [['Nhập một lần, dùng nhiều lần', P.edit, 'nhập một lần'], ['Hạn chế trùng lặp', P.layers, 'hạn chế'], ['Đúng – đủ – sạch – sống', P.shield, 'đúng'], ['Phân quyền theo vai trò', P.users, null], ['Theo dõi đến cán bộ cấp xã', P.target, null]];

  const L = (no, y, txt, cls) => `<div class="tl2 ${cls}" style="top:${y - 28}px"><div class="no">${no}</div><div class="tx">${txt}</div></div>`;
  dg.innerHTML = `
    ${L(1, 130, 'Người dùng /<br>một cửa truy cập', 'lt1')}${L(2, 390, '4 không gian<br>làm việc theo vai trò', 'lt2')}${L(3, 685, 'Nền tảng điều hành<br>& tác nghiệp dùng chung', 'lt3')}
    ${L(4, 975, 'Hệ thống nguồn /<br>đơn vị thực thi', 'lt4')}${L(5, 1305, 'Data Hub &<br>Data Platform', 'lt5')}${L(6, 1610, 'Kho dữ liệu và<br>IOC tổng hợp', 'lt6')}
    <div class="tl2 lt7" style="top:${1815 - 28}px"><div class="no" style="background:linear-gradient(180deg,#f6cc5c,#a8741a)">★</div><div class="tx">Nguyên tắc</div></div>

    <div class="dbox t1a" style="left:380px;top:30px;width:620px;height:200px">
      <svg class="dev" width="230" height="160" viewBox="0 0 230 160" style="position:absolute;left:18px;top:22px">
        <g class="mon"><rect x="10" y="10" width="150" height="100" rx="8" fill="#0d2459" stroke="#7fb2ff" stroke-width="3"/><rect x="22" y="22" width="126" height="76" rx="3" fill="#1d4ed8" opacity=".55"/><path d="M60 128h50M85 110v18" stroke="#7fb2ff" stroke-width="4"/></g>
        <g class="tab"><rect x="128" y="50" width="62" height="88" rx="8" fill="#0d2459" stroke="#4cc9ff" stroke-width="3"/><rect x="136" y="60" width="46" height="66" rx="2" fill="#0891b2" opacity=".6"/></g>
        <g class="pho"><rect x="192" y="74" width="34" height="64" rx="7" fill="#0d2459" stroke="#f2c14e" stroke-width="3"/><rect x="197" y="82" width="24" height="46" rx="2" fill="#f2c14e" opacity=".45"/></g>
      </svg>
      <div style="position:absolute;left:262px;top:40px;width:330px;font-size:27px;font-weight:800;line-height:1.3">Ứng dụng điều hành số dùng chung</div>
      <div style="position:absolute;left:262px;top:120px;font-size:19px;color:#a9bde6">Web · Mobile · IOC Workspace</div>
      <div class="idb" style="position:absolute;right:16px;bottom:14px;display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:20px;background:rgba(242,193,78,.14);border:1.5px solid #f2c14e;font-size:16px;font-weight:800;color:#ffe7a3">${IC.s(P.key, '#f2c14e', 20, 2.2)}Một định danh số</div>
      <div class="glow"></div></div>
    <div class="dbox t1b" style="left:1030px;top:30px;width:830px;height:200px">
      <div class="btitle" style="font-size:17px;top:10px;color:#a9bde6">ĐỐI TƯỢNG SỬ DỤNG</div>
      ${USERS.map((u, i) => `<div class="user" style="left:${22 + i * 113}px;top:44px"><div class="av">${IC.user('#dbe7ff')}</div>${u}</div>`).join('')}
    </div>

    ${AX.map((a, i) => `<div class="axc ax${i}" style="left:${380 + i * 375}px;top:280px;width:355px;height:220px;border:2px solid ${a.c}">
      <div class="hd" style="background:linear-gradient(90deg,${E.hexA(a.c, .35)},${E.hexA(a.c, .08)})"><div class="nb" style="background:${a.c}">${i + 1}</div>${IC.s(a.ic, '#fff', 30, 2)}<span>${a.name}</span></div>
      <div class="its">${a.its.map(([n, p]) => `<div class="it"><div class="ic" style="background:${E.hexA(a.c, .18)};border:1.5px solid ${E.hexA(a.c, .6)}">${IC.s(p, '#fff', 30)}</div>${n}</div>`).join('')}</div><div class="glow" style="border-color:${a.c}"></div></div>`).join('')}

    <div class="dbox t3" style="left:380px;top:550px;width:1480px;height:270px">
      <div class="btitle">NỀN TẢNG ĐIỀU HÀNH & TÁC NGHIỆP DÙNG CHUNG</div>
      ${T3.map(([n, p], i) => `<div class="chip2 c3" style="left:${15 + i * 146}px;top:56px;width:136px;height:96px;font-size:15px">${IC.s(p, '#9cc3ff', 30)}<span>${n}</span><div class="glow"></div></div>`).join('')}
      <div style="position:absolute;left:0;right:0;top:166px;text-align:center;font-size:16px;font-weight:800;letter-spacing:2px;color:#a9bde6">DANH MỤC DÙNG CHUNG – SSO – PHÂN QUYỀN</div>
      ${T3B.map(([n, p], i) => `<div class="chip2 c3b" style="left:${15 + i * 182}px;top:196px;width:170px;height:58px;flex-direction:row;font-size:16px;gap:10px">${IC.s(p, '#f2c14e', 24)}<span>${n}</span><div class="glow"></div></div>`).join('')}
    </div>

    ${SRC.map(s => `<div class="dbox src" id="src-${s.key}" style="left:${s.x}px;top:870px;width:${s.w}px;height:210px;border-color:${s.color}66">
      <div class="num" style="color:${s.color}">0</div><div class="lbl">${s.lbl}</div>
      <div class="people">${Array.from({ length: 6 }, () => IC.user(s.color)).join('')}</div><div class="glow"></div></div>`).join('')}

    <div class="dbox hub" style="left:380px;top:1130px;width:1480px;height:350px;border-color:rgba(242,193,78,.45)">
      <div class="btitle" style="font-size:26px;letter-spacing:4px;top:18px">DATA HUB & DATA PLATFORM</div>
      ${SUBS.map((s, i) => `<div class="sub" id="sub${i}" style="left:${20 + i * 365}px">${s[2].replace('<svg', '<svg class="ic"')}<div class="h">${s[0]}</div><ul>${s[1].map(x => `<li>${x}</li>`).join('')}</ul><div class="glow"></div></div>`).join('')}
    </div>

    <div class="dbox t6" style="left:380px;top:1530px;width:1480px;height:165px">
      <div class="btitle">KHO DỮ LIỆU VÀ IOC TỔNG HỢP</div>
      ${T6.map(([n, p, c], i) => `<div class="chip2 c6" style="left:${15 + i * 162}px;top:56px;width:152px;height:94px;font-size:15px">${IC.s(p, c, 30)}<span>${n}</span><div class="glow"></div></div>`).join('')}
    </div>

    <div class="dbox prn" style="left:380px;top:1745px;width:1480px;height:150px;border-color:rgba(242,193,78,.5)">
      <div class="btitle" style="color:#f2c14e">NGUYÊN TẮC</div>
      ${PRIN.map(([n, p], i) => `<div class="prin" style="left:${28 + i * 292}px;top:60px;width:280px"><div class="pi">${IC.s(p, '#ffe7a3', 32)}</div><span>${n}</span></div>`).join('')}
    </div>
    <svg id="ring" width="1920" height="1950" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none">
      <rect class="rr" x="352" y="252" width="1536" height="276" rx="30" fill="none" stroke="rgba(242,193,78,.8)" stroke-width="3"/>
      <circle class="dot0" r="7" fill="#ffe08a" style="filter:drop-shadow(0 0 8px #f2c14e)"/><circle class="dot1" r="6" fill="#8cc8ff" style="filter:drop-shadow(0 0 8px #4cc9ff)"/>
      <text x="1120" y="212" text-anchor="middle" font-size="30" font-weight="900" letter-spacing="8" fill="#f2c14e">LIÊN THÔNG 4 TRỤC</text>
      <text x="1120" y="590" text-anchor="middle" font-size="24" font-weight="700" letter-spacing="3" fill="#cfe0ff">Một nền tảng · một định danh · nhiều vai trò</text>
    </svg>
    <canvas id="dgFx" width="1920" height="1950" style="position:absolute;left:0;top:0;width:1920px;height:1950px;mix-blend-mode:screen;pointer-events:none"></canvas>`;
  const q = s => dg.querySelector(s), qa = s => [...dg.querySelectorAll(s)];
  scene.style.display = 'block';
  const R0 = el => ({ x: el.offsetLeft + (el.offsetParent !== dg ? el.offsetParent.offsetLeft : 0), y: el.offsetTop + (el.offsetParent !== dg ? el.offsetParent.offsetTop : 0), w: el.offsetWidth, h: el.offsetHeight });
  const box = el => { const r = R0(el); r.cx = r.x + r.w / 2; r.cy = r.y + r.h / 2; return r; };
  const subR = [0, 1, 2, 3].map(i => box(q('#sub' + i))), srcR = SRC.map(s => box(q('#src-' + s.key))), c6R = qa('.c6').map(box), c3R = qa('.c3').map(box);
  scene.style.display = 'none';

  /* ---------- camera ---------- */
  // cảnh 4 trục là cảnh giới thiệu riêng: 4 thẻ ở giữa màn hình, chưa có nhãn tầng (nhãn 1 rồi 2 hiện khi lùi ra sơ đồ)
  const cam = { cx: 1120, cy: 390, s: 1.12 };
  E.drawers.push(() => { dg.style.transform = `translate(${960 - cam.cx * cam.s}px,${540 - cam.cy * cam.s}px) scale(${cam.s})`; });
  const go = (t, cx, cy, s, d = 1.2, e = 'power2.inOut') => tl.to(cam, { cx, cy, s, duration: d, ease: e }, t);
  tl.fromTo(tilt, { rotationX: 22, scale: .9 }, { rotationX: 0, scale: 1, duration: 1.6, ease: 'power3.out' }, ch.out - .1);
  tl.fromTo(tilt, { rotationY: -2 }, { rotationY: 2, duration: 30, ease: 'sine.inOut' }, ch.out);
  const tiers = { lt1: '.lt1', t1: '.t1a, .t1b', lt2: '.lt2', lt3: '.lt3', t3: '.t3', lt4: '.lt4', lt5: '.lt5', hub: '.hub', lt6: '.lt6', t6: '.t6', lt7: '.lt7', prn: '.prn' };
  Object.values(tiers).forEach(s => tl.set(qa(s), { opacity: 0 }, 0));
  tl.set(qa('.axc'), { opacity: 0 }, 0); tl.set(qa('.src'), { opacity: 0 }, 0); tl.set(q('#ring'), { opacity: 0 }, 0);
  const dim = (sel, t, a = .32) => tl.to(qa(sel), { opacity: a, duration: .5 }, t);

  /* ---------- C5: 4 trục ---------- */
  const tV5 = ch.out + .5; const e5 = E.voice('c5', tV5);
  const from = [{ x: -900, y: 0, rotationY: 60 }, { x: 0, y: -700, rotationX: -60 }, { x: 0, y: 700, rotationX: 60 }, { x: 900, y: 0, rotationY: -60 }];
  AX.forEach((a, i) => {
    const at = E.wordAt('c5', a.say) - .2, el = q('.ax' + i);
    tl.fromTo(el, Object.assign({ opacity: 0, scale: .6 }, from[i]), { opacity: 1, x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, duration: .8, ease: 'back.out(1.4)' }, at);
    tl.fromTo(el.querySelector('.glow'), { opacity: 0 }, { opacity: 1, duration: .25, yoyo: true, repeat: 1 }, at + .55);
    E.ev(at, 'swoosh'); E.ev(at + .6, 'pop');
  });
  // khung liên thông bo góc BAO NGOÀI 4 thẻ (không đè lên thẻ), chỉ hiện sau khi đủ 4 thẻ
  const ringT = E.wordAt('c5', 'mặt trận') + .75;
  const rr = q('#ring .rr'), rrL = rr.getTotalLength(), dots = [q('#ring .dot0'), q('#ring .dot1')];
  tl.fromTo(q('#ring'), { opacity: 0 }, { opacity: 1, duration: .3 }, ringT);
  tl.fromTo(rr, { attr: { 'stroke-dasharray': `0 ${rrL}` } }, { attr: { 'stroke-dasharray': `${rrL} 0` }, duration: 1.0, ease: 'power2.inOut' }, ringT);
  tl.set(rr, { attr: { 'stroke-dasharray': '14 12' } }, ringT + 1.02);
  tl.fromTo(qa('#ring text'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .5, stagger: .25 }, ringT + .3);
  E.drawers.push(t => {
    rr.setAttribute('stroke-dashoffset', -t * 40);
    dots.forEach((d, i) => { const p = rr.getPointAtLength(((t - ringT) * 420 + i * rrL / 2) % rrL + (t < ringT ? 0 : 0)); d.setAttribute('cx', p.x); d.setAttribute('cy', p.y); d.style.opacity = t < ringT + .8 ? 0 : 1; });
  });

  /* ---------- C6: tầng 1 ---------- */
  const tV6 = e5 + .7; const e6 = E.voice('c6', tV6);
  go(tV6 - .5, 960, 300, .98, 1.3);
  tl.to(q('#ring'), { opacity: 0, duration: .5 }, tV6 - .4);
  tl.fromTo(qa('.lt1'), { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: .5 }, tV6 - .1);
  tl.fromTo(q('.lt2'), { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: .5 }, tV6 + .35);
  tl.fromTo(q('.t1b'), { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: .5 }, tV6);
  tl.fromTo(qa('.user'), { opacity: 0, scale: .3, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: .45, stagger: .09, ease: 'back.out(2)' }, tV6 + .1);
  const tApp = E.wordAt('c6', 'ứng dụng') - .2;
  tl.fromTo(q('.t1a'), { opacity: 0, x: -120 }, { opacity: 1, x: 0, duration: .6, ease: 'power3.out' }, tApp);
  tl.fromTo(q('.dev .mon'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .4, ease: 'back.out(2)' }, tApp + .2);
  tl.fromTo(q('.dev .tab'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .4, ease: 'back.out(2)' }, E.wordAt('c6', 'web') - .1);
  tl.fromTo(q('.dev .pho'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .4, ease: 'back.out(2)' }, E.wordAt('c6', 'di động') - .1);
  tl.fromTo(q('.idb'), { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: .45, ease: 'back.out(2.4)' }, E.wordAt('c6', 'định danh') - .1);
  tl.fromTo(q('.t1a .glow'), { opacity: 0 }, { opacity: 1, duration: .3, yoyo: true, repeat: 1 }, E.wordAt('c6', 'định danh'));
  E.ev(E.wordAt('c6', 'định danh'), 'ding', { i: 1 });

  /* ---------- C7: không gian làm việc ---------- */
  const tV7 = e6 + .6; const e7 = E.voice('c7', tV7);
  go(tV7 - .4, 960, 390, 1.03, 1.1);
  dim('.t1a, .t1b, .lt1', tV7 - .3);
  AX.forEach((a, i) => {
    const its = [...q('.ax' + i).querySelectorAll('.it')];
    tl.fromTo(its, { opacity: .3, scale: .6, rotationY: 90 }, { opacity: 1, scale: 1, rotationY: 0, duration: .4, stagger: .07, ease: 'back.out(2)' }, tV7 + .1 + i * .32);
    tl.fromTo(q('.ax' + i + ' .glow'), { opacity: 0 }, { opacity: 1, duration: .3, yoyo: true, repeat: 1 }, tV7 + .3 + i * .32);
  });
  tl.set(qa('.axc .it'), { opacity: .3 }, 0);

  /* ---------- C8: tầng 3 ---------- */
  const tV8 = e7 + .55; const e8 = E.voice('c8', tV8);
  go(tV8 - .5, 960, 660, 1.0, 1.2);
  dim('.axc, .lt2', tV8 - .2, .4);
  tl.fromTo(qa('.lt3, .t3'), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, tV8 - .3);
  tl.fromTo(qa('.c3'), { opacity: 0, y: 30, scale: .7 }, { opacity: 1, y: 0, scale: 1, duration: .4, stagger: .07, ease: 'back.out(2)' }, tV8 + .1);
  [['chỉ đạo', 0], ['văn bản', 1], ['nhiệm vụ', 2], ['báo cáo', 3], ['cảnh báo', 8]].forEach(([w, i]) => {
    const a = E.wordAt('c8', w) - .05;
    tl.fromTo(qa('.c3')[i].querySelector('.glow'), { opacity: 0 }, { opacity: 1, duration: .25 }, a);
    tl.fromTo(qa('.c3')[i], { scale: 1 }, { scale: 1.08, duration: .2, yoyo: true, repeat: 1 }, a);
    E.ev(a, 'tick');
  });
  const tSSO = E.wordAt('c8', 'đăng nhập');
  tl.fromTo(qa('.c3b'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .35, stagger: .06, ease: 'power3.out' }, tSSO - .5);
  tl.fromTo(qa('.c3b')[4].querySelector('.glow'), { opacity: 0 }, { opacity: 1, duration: .3 }, tSSO);
  const tPQ = E.wordAt('c8', 'phân quyền');
  tl.fromTo(qa('.c3b')[5].querySelector('.glow'), { opacity: 0 }, { opacity: 1, duration: .3 }, tPQ);
  tl.fromTo(qa('.c3b')[5].querySelector('.shk'), { y: -4 }, { y: 0, duration: .25, ease: 'bounce.out' }, tPQ + .1);
  tl.fromTo(qa('.c3b')[6].querySelector('.glow'), { opacity: 0 }, { opacity: 1, duration: .3 }, tPQ + .3);
  E.ev(tSSO, 'lock'); E.ev(tPQ + .1, 'lock');

  /* ---------- C9: nguồn → data hub → kho ---------- */
  const tV9 = e8 + .6; const e9 = E.voice('c9', tV9);
  go(tV9 - .5, 960, 1150, .98, 1.3);
  dim('.t3, .lt3', tV9 - .2, .35);
  tl.fromTo(q('.lt4'), { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: .5 }, tV9);
  const srcT = SRC.map(s => E.wordAt('c9', s.say) - .15);
  SRC.forEach((s, i) => {
    const el = q('#src-' + s.key);
    tl.fromTo(el, { opacity: 0, y: 50, scale: .85 }, { opacity: 1, y: 0, scale: 1, duration: .7, ease: 'back.out(1.7)' }, srcT[i]);
    tl.fromTo(el.querySelectorAll('.people svg'), { opacity: 0, y: 14, scale: .4 }, { opacity: 1, y: 0, scale: 1, duration: .35, stagger: .06, ease: 'back.out(2)' }, srcT[i] + .25);
    tl.fromTo(el.querySelector('.glow'), { opacity: 0 }, { opacity: 1, duration: .25, yoyo: true, repeat: 1 }, srcT[i] + .1);
    E.ev(srcT[i], 'pop');
  });
  E.drawers.push(t => SRC.forEach((s, i) => { q('#src-' + s.key + ' .num').textContent = String(Math.round(s.num * ease.out3(prog(t, srcT[i] + .1, srcT[i] + 1.1)))).padStart(s.pad, '0'); }));
  const tA = E.wordAt('c9', 'được tiếp nhận') - .3, tB = E.wordAt('c9', 'chuẩn hóa') - .25, tC = E.wordAt('c9', 'và tổng hợp') - .2;
  const tKho = E.wordAt('c9', 'kho dữ liệu'), tK = tKho - .1;
  tl.fromTo(qa('.lt5, .hub'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, tA - .7);
  tl.fromTo(qa('.sub'), { opacity: 0, y: 30, scale: .94 }, { opacity: 1, y: 0, scale: 1, duration: .5, stagger: .1, ease: 'back.out(1.6)' }, tA - .5);
  go(tK - .3, 960, 1390, .98, 1.4);
  tl.fromTo(qa('.lt6, .t6'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, tKho - .4);
  tl.fromTo(qa('.c6'), { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .4, stagger: .05, ease: 'back.out(2)' }, tKho - .2);
  const glowsAt = [[tA + .95, '#sub0'], [tB + .75, '#sub1'], [tC + .7, '#sub2'], [tC + 1.15, '#sub3']];
  glowsAt.forEach(([g, s], i) => { tl.fromTo(q(s + ' .glow'), { opacity: 0 }, { opacity: 1, duration: .35 }, g); E.ev(g, 'ding', { i }); });
  const tDash = E.wordAt('c9', 'bảng thông tin'), tMap = E.wordAt('c9', 'bản đồ'), tWarn = E.wordAt('c9', 'cảnh báo');
  tl.fromTo(qa('.c6').slice(0, 6).map(c => c.querySelector('.glow')), { opacity: 0 }, { opacity: 1, duration: .3, stagger: .08 }, tDash);
  tl.fromTo(qa('.c6')[6].querySelector('.glow'), { opacity: 0 }, { opacity: 1, duration: .3 }, tMap);
  tl.fromTo(qa('.c6').slice(7).map(c => c.querySelector('.glow')), { opacity: 0 }, { opacity: 1, duration: .3, stagger: .1 }, tWarn);

  /* ---------- C10: nguyên tắc → toàn cảnh → lao vào IOC/Dashboard ---------- */
  const tV10 = e9 + .6; const e10 = E.voice('c10', tV10);
  go(tV10 - .5, 960, 1560, .98, 1.2);
  tl.fromTo(qa('.lt7, .prn'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, tV10 - .3);
  const prins = qa('.prin');
  tl.set(prins, { opacity: 0 }, 0);
  PRIN.forEach((p, i) => {
    const a = p[2] ? E.wordAt('c10', p[2]) - .1 : e10 - .2 + (i - 3) * .25;
    tl.fromTo(prins[i], { opacity: 0, y: 30, scale: .7 }, { opacity: 1, y: 0, scale: 1, duration: .45, ease: 'back.out(2)' }, a);
    E.ev(a, 'pop');
  });
  const tFull = e10 + .25;
  go(tFull, 960, 975, .55, 1.5, 'power3.inOut');
  tl.to(qa('.t1a, .t1b, .lt1, .axc, .lt2, .t3, .lt3'), { opacity: 1, duration: .8 }, tFull + .2);
  // lao xuyên vào ô IOC/Dashboard
  const tgt = c3R[9];
  const tZoom = tFull + 2.6;
  go(tZoom, tgt.cx, tgt.cy, 16, 1.0, 'power3.in');
  tl.to(scene, { filter: 'blur(6px)', duration: .5, ease: 'power2.in' }, tZoom + .5);
  tl.fromTo('#flashW', { opacity: 0 }, { opacity: .95, duration: .25, ease: 'power2.in' }, tZoom + .8);
  tl.to('#flashW', { opacity: 0, duration: .5, ease: 'power2.out' }, tZoom + 1.05);
  tl.fromTo(qa('.c3')[9].querySelector('.glow'), { opacity: 0 }, { opacity: 1, duration: .3 }, tZoom - .2);
  E.ev(tZoom, 'whoosh2'); E.ev(tZoom + .9, 'hit');

  /* ---------- đường nối giữa các tầng + dòng dữ liệu (canvas trong hệ toạ độ #dg) ---------- */
  const fxc = q('#dgFx').getContext('2d');
  const bez = (p0, p1, p2) => u => ({ x: (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * p1.x + u * u * p2.x, y: (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * p1.y + u * u * p2.y });
  const line = (a, b) => u => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
  const flows = [];
  const F = (t0, f, len, color, n = 7, speed = 420, dash = true) => flows.push({ t0, f, len, color, n, speed, dash });
  // tầng 1 → 2 (chỉ đạo, xanh dương) và 2 → 3
  for (let i = 0; i < 4; i++) {
    const cx = 380 + i * 375 + 177;
    F(tV6 + .9 + i * .1, line({ x: 1030 + 22 + i * 113 + 56, y: 230 }, { x: cx, y: 280 }), 700, '#5b9bff', 3, 160);
    F(tV8 + .2 + i * .08, line({ x: cx, y: 500 }, { x: cx, y: 550 }), 50, '#5b9bff', 2, 90);
  }
  // tầng 3 ↔ 4
  srcR.forEach((r, i) => { F(tV9 + .3, line({ x: r.cx - 40, y: 820 }, { x: r.cx - 40, y: 870 }), 50, '#5b9bff', 2, 90); F(srcT[i] + .6, line({ x: r.cx + 40, y: 870 }, { x: r.cx + 40, y: 820 }), 50, '#3fd38a', 2, 90); });
  // nguồn → tiếp nhận; dọc 4 ô; data service → kho
  srcR.forEach((r, i) => F(tA + i * .12, bez({ x: r.cx, y: r.y + r.h }, { x: r.cx, y: subR[0].y - 30 }, { x: subR[0].cx, y: subR[0].y + 4 }), 600, SRC[i].color, 9, 520));
  for (let i = 0; i < 3; i++) F(i === 0 ? tB : tC + (i - 1) * .45, line({ x: subR[i].cx, y: subR[i].y + subR[i].h - 2 }, { x: subR[i + 1].cx, y: subR[i + 1].y + subR[i + 1].h - 2 }), 365, '#f2c14e', 7, 420);
  c6R.forEach((c, j) => F(tKho + j * .05, bez({ x: subR[3].cx - 160 + j * 30, y: 1480 }, { x: c.cx, y: 1500 }, { x: c.cx, y: c.y + 2 }), 300, '#4cc9ff', 4, 420));
  // vòng đồng bộ dữ liệu bên phải (nét đứt)
  F(tFull + .3, line({ x: 1890, y: 1610 }, { x: 1890, y: 130 }), 1480, '#7fb2ff', 10, 700);
  F(tFull + .3, line({ x: 1890, y: 130 }, { x: 1860, y: 130 }), 30, '#7fb2ff', 1, 100);
  E.drawers.push(t => {
    if (t < ch.out || t > tZoom + 1.2) return;
    fxc.clearRect(0, 0, 1920, 1950);
    for (const Fl of flows) {
      const dt = t - Fl.t0; if (dt < 0) continue;
      const grow = clamp(dt * Fl.speed / Fl.len);
      fxc.save(); fxc.setLineDash([10, 12]); fxc.lineDashOffset = -t * 60; fxc.strokeStyle = Fl.color; fxc.globalAlpha = .5; fxc.lineWidth = 2.4;
      fxc.beginPath(); for (let u = 0; u <= 1.0001; u += .04) { const p = Fl.f(Math.min(u, grow)); u === 0 ? fxc.moveTo(p.x, p.y) : fxc.lineTo(p.x, p.y); } fxc.stroke(); fxc.restore();
      for (let j = 0; j < Fl.n; j++) {
        const qv = dt * Fl.speed / Fl.len - j / Fl.n; if (qv < 0) continue;
        const u = qv % 1, p = Fl.f(u), a = Math.sin(Math.PI * u);
        const g = fxc.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
        g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(.3, E.hexA(Fl.color, .9 * a)); g.addColorStop(1, E.hexA(Fl.color, 0));
        fxc.fillStyle = g; fxc.fillRect(p.x - 14, p.y - 14, 28, 28);
      }
    }
  });
  // nền dịu lại để sơ đồ nổi bật
  tl.to(E.bgp, { floor: .35, beams: .5, duration: 1 }, ch.out);
  tl.to(E.bgp, { floor: 1, beams: 1, duration: 1 }, tZoom + 1.2);
  E.span(scene, ch.cover, tZoom + 1.0);
  return { end: tZoom + .95 };
};




