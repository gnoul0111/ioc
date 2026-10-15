/* ============================== btctw-national-map.js ==============================
   "Bản đồ số toàn quốc" cho Ban Tổ chức Trung ương (role TW_DANG) — đặt hàng qua anh CườngNM/anh Bằng, 2026-09-26.
   Bố cục mô phỏng màn "Theo dõi chỉ tiêu quản lý văn bản và điều hành tác nghiệp" của Hệ thống theo dõi thực hiện
   Nghị quyết TW: thẻ số liệu, bản đồ tô màu 34 tỉnh/thành, chọn địa bàn để zoom, khung thông tin khi rê chuột,
   bảng xếp hạng + tải Excel, biểu đồ diễn biến 30 ngày.

   Đã chốt với người dùng:
   - BẢN DEMO — toàn bộ số liệu là MÔ PHỎNG (sinh cố định theo mã tỉnh), KHÔNG có eForm trong IOC (sẽ nhập ở phần
     mềm khác sau này).
   - Chỉ đến cấp tỉnh.
   - 2 chế độ xem: "Đảng viên" tô màu theo TỔNG SỐ đảng viên (>=500.000 xanh / >=100.000 vàng / còn lại đỏ) và
     "Văn bản" tô màu theo tỷ lệ xử lý văn bản đi toàn trình (ngưỡng theo mẫu: >80% xanh / 50-80% vàng / <50% đỏ).

   Bản đồ KHÔNG dùng bản đồ nền (tile) nào — chỉ vẽ ranh giới tự có (js/data/vn34-map-data.js), nên không phụ thuộc
   OSM/Google/Vietmap và tự kiểm soát việc thể hiện Hoàng Sa, Trường Sa (xem ghi chú ở file dữ liệu). */

const BTM_DV_THRESHOLDS = [500000, 100000];   // Đảng viên: xanh >= 500.000, vàng >= 100.000, đỏ < 100.000
const BTM_VB_THRESHOLDS = [80, 50];           // Văn bản (%): xanh > 80, vàng 50-80, đỏ < 50 — theo chú thích của mẫu
const BTM_COLORS = { green: '#22a55b', yellow: '#f0b429', red: '#e03b3b' };
const BTM_VN_BOUNDS = [[7.0, 102.1], [23.45, 117.45]];
const BTM_YEAR = 2026;

/* Tổng số đảng viên MÔ PHỎNG theo mã tỉnh — chỉ để bản demo có phân bố hợp lý (vài tỉnh xanh, đa số vàng, vài tỉnh
   đỏ). Không phải số liệu thật. */
const BTM_DV_BASE = {
  '01': 568000, '79': 536000, '31': 262000, '37': 252000, '38': 243000, '40': 231000, '25': 221000, '33': 204000,
  '24': 193000, '48': 172000, '86': 163000, '75': 153000, '91': 152000, '52': 151000, '82': 149000, '68': 146000,
  '44': 142000, '66': 139000, '92': 138000, '08': 133000, '80': 131000, '15': 126000, '19': 121000, '42': 118000,
  '22': 112000, '51': 108000, '14': 106000, '56': 97000, '96': 91000, '20': 86000, '46': 76000, '11': 63000,
  '04': 56000, '12': 43000
};
/* Đảng bộ trực thuộc TW KHÔNG gắn địa bàn — chỉ có trong bảng xếp hạng, không có trên bản đồ (mẫu gốc cũng có đơn
   vị kiểu này, vd "Báo Nhân Dân"). Cố ý KHÔNG đưa Quân ủy TW/Đảng ủy Công an TW vào bản demo: số đảng viên lực lượng
   vũ trang là số liệu nhạy cảm, không nên có cả số mô phỏng. */
const BTM_TW_UNITS = [
  { id: 'tw-cqd', name: 'Đảng bộ các cơ quan Đảng Trung ương', base: 58000 },
  { id: 'tw-cp', name: 'Đảng bộ Chính phủ', base: 186000 },
  { id: 'tw-qh', name: 'Đảng bộ Quốc hội', base: 5600 },
  { id: 'tw-mttq', name: 'Đảng bộ Mặt trận Tổ quốc, các đoàn thể Trung ương', base: 11800 }
];

const BTM = { map: null, provLayer: null, layers: {}, labels: [], fixedLabels: [], mode: 'dv', selected: null, sort: null, chart: null, rows: null, dataDate: null };

/* ---------- Sinh số liệu mô phỏng (cố định theo mã, lần nào mở cũng ra cùng số) ---------- */
function btmRng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return function () { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function btmBuildMetrics(key, base) {
  const R = btmRng('btctw-' + key), between = (a, b) => a + (b - a) * R();
  const tong = Math.round(base * between(0.985, 1.015));
  const duBi = Math.round(tong * between(0.034, 0.052));
  const ketNapCT = Math.round(tong * between(0.022, 0.032) / 10) * 10;
  const ketNapDat = Math.round(ketNapCT * between(0.52, 0.96));
  const vbDen = Math.round(tong * between(11, 15.5));
  const denDienTu = Math.round(vbDen * between(0.968, 0.999));
  const tyLeDen = Math.round(between(76, 97.5) * 10) / 10;
  const vbDi = Math.round(vbDen * between(0.1, 0.16));
  const tyLeDiRaw = 97 - Math.pow(R(), 1.8) * 52;
  const kyDienTu = Math.round(vbDi * tyLeDiRaw / 100);
  // Diễn biến 30 ngày: kết nạp luỹ kế (tăng dần, ngày cuối = đã kết nạp) và tỷ lệ xử lý VB đến (dao động nhẹ).
  const kn = new Array(30), den = new Array(30);
  kn[29] = ketNapDat; den[29] = tyLeDen;
  for (let i = 28; i >= 0; i--) {
    kn[i] = Math.max(0, kn[i + 1] - Math.round(ketNapDat / 265 * between(0.4, 1.7)));
    den[i] = Math.min(99.5, Math.max(40, den[i + 1] - (R() - 0.35) * 0.45));
  }
  return {
    dv: { tong, chinhThuc: tong - duBi, duBi, ketNapCT, ketNapDat, tyLeKN: ketNapDat / ketNapCT * 100 },
    vb: { vbDen, denDienTu, denGiay: vbDen - denDienTu, tyLeDen, denDaXuLy: Math.round(vbDen * tyLeDen / 100), vbDi, kyDienTu, kyGiay: vbDi - kyDienTu, tyLeDi: kyDienTu / vbDi * 100 },
    trend: { kn, den }
  };
}
function btmProvDisplayName(p) {
  const ten = p.ten.replace(/^TP\.\s*/, '');
  return (p.loai === 'Thành phố' ? 'Thành phố ' : 'Tỉnh ') + ten;
}
function btmProvUnitName(p) {
  const ten = p.ten.replace(/^TP\.\s*/, '');
  return (p.loai === 'Thành phố' ? 'Thành ủy ' : 'Tỉnh ủy ') + ten;
}
function btmBuildRows() {
  if (BTM.rows) return BTM.rows;
  const rows = [];
  (window.VN34_GEOJSON ? window.VN34_GEOJSON.features : []).forEach((f) => {
    const p = f.properties;
    rows.push(Object.assign({ id: 'p' + p.ma, ma: p.ma, isTw: false, placeName: btmProvDisplayName(p), unitName: btmProvUnitName(p), sapNhap: p.sapNhap, feature: f }, btmBuildMetrics(p.ma, BTM_DV_BASE[p.ma] || 120000)));
  });
  BTM_TW_UNITS.forEach((u) => rows.push(Object.assign({ id: u.id, ma: null, isTw: true, placeName: u.name, unitName: u.name }, btmBuildMetrics(u.id, u.base))));
  BTM.rows = rows;
  return rows;
}
/* Gộp toàn quốc (hoặc 1 đơn vị) về cùng 1 cấu trúc số liệu để thẻ/biểu đồ dùng chung. */
function btmAggregate(rows) {
  const s = (f) => rows.reduce((a, r) => a + f(r), 0);
  const dv = { tong: s((r) => r.dv.tong), duBi: s((r) => r.dv.duBi), ketNapCT: s((r) => r.dv.ketNapCT), ketNapDat: s((r) => r.dv.ketNapDat) };
  dv.chinhThuc = dv.tong - dv.duBi; dv.tyLeKN = dv.ketNapDat / dv.ketNapCT * 100;
  const vb = { vbDen: s((r) => r.vb.vbDen), denDienTu: s((r) => r.vb.denDienTu), denDaXuLy: s((r) => r.vb.denDaXuLy), vbDi: s((r) => r.vb.vbDi), kyDienTu: s((r) => r.vb.kyDienTu) };
  vb.denGiay = vb.vbDen - vb.denDienTu; vb.kyGiay = vb.vbDi - vb.kyDienTu;
  vb.tyLeDen = vb.denDaXuLy / vb.vbDen * 100; vb.tyLeDi = vb.kyDienTu / vb.vbDi * 100;
  const kn = [], den = [];
  for (let i = 0; i < 30; i++) {
    kn.push(s((r) => r.trend.kn[i]));
    den.push(s((r) => r.trend.den[i] * r.vb.vbDen) / vb.vbDen);
  }
  return { dv, vb, trend: { kn, den } };
}
function btmScope() {
  const rows = btmBuildRows();
  const sel = BTM.selected && rows.find((r) => r.id === BTM.selected);
  return sel ? { label: sel.placeName, row: sel, data: sel } : { label: 'Toàn quốc', row: null, data: btmAggregate(rows) };
}

/* ---------- Định dạng & phân loại màu ---------- */
function btmNum(v) { return Math.round(v).toLocaleString('vi-VN'); }
function btmPct(v) { return (Math.round(v * 10) / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%'; }
function btmLevelDv(tong) { return tong >= BTM_DV_THRESHOLDS[0] ? 'green' : tong >= BTM_DV_THRESHOLDS[1] ? 'yellow' : 'red'; }
function btmLevelPct(p) { return p > BTM_VB_THRESHOLDS[0] ? 'green' : p >= BTM_VB_THRESHOLDS[1] ? 'yellow' : 'red'; }
function btmRowLevel(row) { return BTM.mode === 'dv' ? btmLevelDv(row.dv.tong) : btmLevelPct(row.vb.tyLeDi); }
function btmDateText(d, withTime) {
  const p = (n) => String(n).padStart(2, '0');
  return (withTime ? '17:00 ' : '') + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
}

/* ---------- Khung thông tin tỉnh (dùng cho cả tooltip rê chuột lẫn popup khi chọn) ---------- */
function btmInfoHtml(row) {
  const lv = btmRowLevel(row);
  const head = BTM.mode === 'dv' ? btmNum(row.dv.tong) + ' đảng viên' : btmPct(row.vb.tyLeDi);
  const lines = BTM.mode === 'dv'
    ? [['Tổng số đảng viên', btmNum(row.dv.tong)], ['Đảng viên chính thức', btmNum(row.dv.chinhThuc)], ['Đảng viên dự bị', btmNum(row.dv.duBi)],
       ['Chỉ tiêu kết nạp năm ' + BTM_YEAR, btmNum(row.dv.ketNapCT)], ['Đã kết nạp năm ' + BTM_YEAR, btmNum(row.dv.ketNapDat)], ['Tỷ lệ đạt chỉ tiêu kết nạp', btmPct(row.dv.tyLeKN)]]
    : [['Tổng số văn bản đi', btmNum(row.vb.vbDi)], ['Số văn bản ký điện tử', btmNum(row.vb.kyDienTu)], ['Tỷ lệ phát hành văn bản điện tử', btmPct(row.vb.tyLeDi)],
       ['Tổng số văn bản đến', btmNum(row.vb.vbDen)], ['Số văn bản đến điện tử', btmNum(row.vb.denDienTu)], ['Tỷ lệ xử lý văn bản đến', btmPct(row.vb.tyLeDen)]];
  const merged = row.sapNhap && row.sapNhap !== 'không sáp nhập' ? '<div class="btm-info-merge">Hợp nhất từ: ' + esc(row.sapNhap) + '</div>' : '';
  return '<div class="btm-info"><div class="btm-info-h"><i style="background:' + BTM_COLORS[lv] + '"></i><span>' + esc(row.placeName) + '</span><b>' + head + '</b></div>'
    + '<ul>' + lines.map((l) => '<li>' + esc(l[0]) + ': <b>' + l[1] + '</b></li>').join('') + '</ul>' + merged + '</div>';
}

/* ---------- Bản đồ ---------- */
function btmProvStyle(feature) {
  const row = btmBuildRows().find((r) => r.ma === feature.properties.ma);
  const isSel = BTM.selected === 'p' + feature.properties.ma;
  const dim = BTM.selected && !isSel;
  return { color: isSel ? '#0b1f33' : '#ffffff', weight: isSel ? 2.4 : 0.8, opacity: isSel ? 1 : 0.85, fillColor: BTM_COLORS[row ? btmRowLevel(row) : 'yellow'], fillOpacity: isSel ? 1 : dim ? 0.42 : 0.86 };
}
function btmRestyle() { if (BTM.provLayer) BTM.provLayer.setStyle(btmProvStyle); }
/* Icon 0x0 đặt đúng toạ độ, chữ nằm trong lớp bọc .btm-lbl-in tự căn giữa bằng CSS transform (không transform
   thẳng lên icon được vì Leaflet dùng transform của icon để định vị). */
function btmGeoLabel(latlng, html, cls) {
  return L.marker(latlng, { interactive: false, keyboard: false, icon: L.divIcon({ className: 'btm-geo-lbl ' + (cls || ''), html: '<div class="btm-lbl-in">' + html + '</div>', iconSize: [0, 0] }) });
}
function btmInitMap() {
  const el = document.getElementById('btmMap');
  if (!el || !window.L || !window.VN34_GEOJSON) return;
  const map = L.map(el, { zoomControl: false, attributionControl: false, zoomSnap: 0.25, zoomDelta: 0.5, minZoom: 4.5, maxZoom: 10, maxBounds: [[0.5, 93], [28.5, 125]], maxBoundsViscosity: 1, renderer: L.svg({ padding: 0.6 }) });
  BTM.map = map;
  L.control.zoom({ position: 'topright' }).addTo(map);
  map.keyboard.disable();
  el.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  // Nước láng giềng: chỉ làm nền xám, không tương tác. Màu nền/biển đặt bằng CSS theo giao diện sáng/tối.
  if (window.VN_NEIGHBORS_GEOJSON) L.geoJSON(window.VN_NEIGHBORS_GEOJSON, { interactive: false, style: { className: 'btm-neighbor', weight: 0.6 } }).addTo(map);
  BTM.provLayer = L.geoJSON(window.VN34_GEOJSON, {
    style: btmProvStyle,
    onEachFeature: (f, layer) => {
      BTM.layers[f.properties.ma] = layer;
      layer.bindTooltip(() => { const row = btmBuildRows().find((r) => r.ma === f.properties.ma); return row ? btmInfoHtml(row) : ''; }, { sticky: true, direction: 'auto', offset: [14, 0], className: 'btm-tip', opacity: 1 });
      layer.on('mouseover', () => { if (BTM.selected !== 'p' + f.properties.ma) layer.setStyle({ weight: 2, color: '#ffd54b', opacity: 1 }); });
      layer.on('mouseout', () => { layer.setStyle(btmProvStyle(f)); });
      // Tỉnh đang chọn đã có popup cố định — không mở thêm tooltip trùng nội dung.
      layer.on('tooltipopen', () => { if (BTM.selected === 'p' + f.properties.ma) layer.closeTooltip(); });
      layer.on('click', () => btmSelect('p' + f.properties.ma));
    }
  }).addTo(map);
  // Tên tỉnh (ẩn bớt nhãn chồng nhau sau mỗi lần zoom — xem btmDeclutterLabels).
  // Thành phố trực thuộc TW xếp trước để được ưu tiên giữ nhãn khi bị chồng.
  const byPriority = VN34_GEOJSON.features.slice().sort((a, b) => (b.properties.loai === 'Thành phố') - (a.properties.loai === 'Thành phố'));
  BTM.labels = byPriority.map((f) => btmGeoLabel(f.properties.label, '<i></i><span>' + esc(btmProvDisplayName(f.properties)) + '</span>', 'btm-prov-lbl').addTo(map));
  // Nhãn địa lý cố định — Hoàng Sa, Trường Sa luôn ghi rõ "(Việt Nam)"; dùng tên "Biển Đông".
  [
    [[15.72, 112.0], 'Quần đảo Hoàng Sa<br>(Việt Nam)', 'btm-island'],
    [[9.35, 114.35], 'Quần đảo Trường Sa<br>(Việt Nam)', 'btm-island'],
    [[20.13, 107.8], 'Đảo Bạch Long Vĩ', 'btm-island btm-small btm-right'],
    [[10.25, 103.45], 'Đảo Phú Quốc', 'btm-island btm-small btm-left'],
    [[8.52, 106.62], 'Côn Đảo', 'btm-island btm-small'],
    [[12.4, 113.4], 'B I Ể N &nbsp; Đ Ô N G', 'btm-sea'],
    [[19.2, 107.55], 'Vịnh Bắc Bộ', 'btm-sea btm-small'],
    [[10.6, 102.5], 'Vịnh Thái Lan', 'btm-sea btm-small'],
    [[22.95, 109.0], 'TRUNG QUỐC', 'btm-country'],
    [[19.2, 102.55], 'LÀO', 'btm-country'],
    [[15.6, 101.2], 'THÁI LAN', 'btm-country'],
    [[12.75, 104.75], 'CAMPUCHIA', 'btm-country']
  ].forEach((g) => BTM.fixedLabels.push(btmGeoLabel(g[0], g[1], g[2]).addTo(map)));
  map.on('zoomend', btmDeclutterLabels);
  map.fitBounds(BTM_VN_BOUNDS, { padding: [8, 8] });
}
/* Ẩn nhãn tên tỉnh bị chồng lên nhau (ưu tiên nhãn đứng trước trong danh sách) — ở mức zoom cả nước miền Bắc rất
   dày, hiện hết sẽ đè chữ lên nhau không đọc được. Nhãn địa lý cố định (Hoàng Sa, Trường Sa, đảo, biển, nước láng
   giềng) luôn hiện và được tính là "đã chiếm chỗ" trước — tên tỉnh nào đè lên chúng thì tên tỉnh bị ẩn. */
function btmDeclutterLabels() {
  if (!BTM.map) return;
  requestAnimationFrame(() => {
    const placed = BTM.fixedLabels.map((m) => m.getElement() && m.getElement().firstElementChild).filter(Boolean).map((c) => c.getBoundingClientRect());
    const far = BTM.map.getZoom() < 5;
    BTM.labels.forEach((m) => {
      const el = m.getElement(); if (!el || !el.firstElementChild) return;
      el.style.visibility = 'hidden';
      if (far) return;
      el.style.visibility = '';
      const r = el.firstElementChild.getBoundingClientRect();
      const hit = placed.some((p) => r.left < p.right + 2 && r.right > p.left - 2 && r.top < p.bottom + 1 && r.bottom > p.top - 1);
      if (hit) el.style.visibility = 'hidden'; else placed.push(r);
    });
  });
}
function btmSelect(id, opts) {
  opts = opts || {};
  BTM.selected = id || null;
  const sel = document.getElementById('btmProvinceSelect');
  if (sel) sel.value = BTM.selected || '';
  btmRestyle();
  if (BTM.map) {
    BTM.map.closePopup();
    const row = BTM.selected && btmBuildRows().find((r) => r.id === BTM.selected);
    if (row && !row.isTw) {
      const p = row.feature.properties;
      BTM.map.flyToBounds(p.bounds, { padding: [30, 30], maxZoom: 8, duration: 0.6 });
      BTM.map.once('moveend', () => {
        if (BTM.selected !== row.id) return;
        L.popup({ className: 'btm-popup', autoPan: true, closeButton: true, offset: [0, -4] }).setLatLng(p.label).setContent(btmInfoHtml(row)).openOn(BTM.map);
      });
    } else if (!opts.keepView) {
      BTM.map.flyToBounds(BTM_VN_BOUNDS, { padding: [8, 8], duration: 0.6 });
    }
    if (row && row.isTw && typeof toast === 'function') toast(row.placeName + ' không gắn với địa bàn tỉnh — chỉ xem số liệu ở thẻ và bảng xếp hạng.');
  }
  btmRenderPanels();
}

/* ---------- Thẻ số liệu / bảng xếp hạng / biểu đồ ---------- */
function btmCard(label, value, cls) { return '<div class="btm-kpi"><div class="btm-kpi-l">' + esc(label) + '</div><div class="btm-kpi-v ' + (cls || '') + '">' + value + '</div></div>'; }
function btmWideCard(label, value, cls, subs) {
  return '<div class="btm-kpi btm-kpi-wide"><div class="btm-kpi-l">' + esc(label) + '</div><div class="btm-kpi-v ' + (cls || '') + '">' + value + '</div>'
    + '<div class="btm-kpi-subs">' + subs.map((s) => '<div><small>' + esc(s[0]) + '</small><b class="' + (s[2] || '') + '">' + s[1] + '</b></div>').join('') + '</div></div>';
}
function btmRenderKpis(scope) {
  const box = document.getElementById('btmKpis'); if (!box) return;
  const d = scope.data, rows = btmBuildRows();
  if (BTM.mode === 'dv') {
    let wide2;
    if (scope.row) {
      const rank = (key) => rows.slice().sort((a, b) => b.dv[key] - a.dv[key]).findIndex((r) => r.id === scope.row.id) + 1;
      wide2 = btmWideCard('Xếp hạng toàn quốc (' + rows.length + ' đơn vị)', '#' + rank('tong'), 'is-blue', [['Theo tổng số đảng viên', '#' + rank('tong'), 'is-blue'], ['Theo tỷ lệ đạt chỉ tiêu kết nạp', '#' + rank('tyLeKN'), 'is-teal']]);
    } else {
      const prov = rows.filter((r) => !r.isTw), cnt = (lv) => prov.filter((r) => btmLevelDv(r.dv.tong) === lv).length;
      wide2 = btmWideCard('Tỉnh, thành phố theo số lượng đảng viên', prov.length, 'is-blue', [['≥ 500.000', cnt('green'), 'is-green'], ['100.000 – dưới 500.000', cnt('yellow'), 'is-yellow'], ['Dưới 100.000', cnt('red'), 'is-red']]);
    }
    box.innerHTML = btmCard('Tỷ lệ đạt chỉ tiêu kết nạp năm ' + BTM_YEAR, btmPct(d.dv.tyLeKN), 'is-' + btmLevelPct(d.dv.tyLeKN))
      + btmCard('Chỉ tiêu kết nạp năm ' + BTM_YEAR, btmNum(d.dv.ketNapCT), 'is-blue')
      + btmCard('Đã kết nạp năm ' + BTM_YEAR, btmNum(d.dv.ketNapDat), 'is-orange')
      + btmWideCard('Tổng số đảng viên', btmNum(d.dv.tong), 'is-blue', [['Đảng viên chính thức', btmNum(d.dv.chinhThuc), 'is-blue'], ['Đảng viên dự bị', btmNum(d.dv.duBi), 'is-teal']])
      + wide2;
  } else {
    box.innerHTML = btmCard('Tỷ lệ xử lý văn bản đi toàn trình', btmPct(d.vb.tyLeDi), 'is-' + btmLevelPct(d.vb.tyLeDi))
      + btmCard('Tỷ lệ xử lý văn bản đến', btmPct(d.vb.tyLeDen), 'is-' + btmLevelPct(d.vb.tyLeDen))
      + btmCard('Văn bản đến đã xử lý', btmNum(d.vb.denDaXuLy), 'is-orange')
      + btmWideCard('Tổng số văn bản đến', btmNum(d.vb.vbDen), 'is-blue', [['Số văn bản đến điện tử', btmNum(d.vb.denDienTu), 'is-blue'], ['Số văn bản đến giấy', btmNum(d.vb.denGiay), 'is-teal']])
      + btmWideCard('Tổng số văn bản đi', btmNum(d.vb.vbDi), 'is-green', [['Số văn bản ký điện tử', btmNum(d.vb.kyDienTu), 'is-green'], ['Số văn bản ký giấy', btmNum(d.vb.kyGiay), 'is-green']]);
  }
}
function btmColumns() {
  return BTM.mode === 'dv'
    ? [{ key: 'tong', label: 'Tổng số đảng viên', get: (r) => r.dv.tong, fmt: btmNum, level: (r) => btmLevelDv(r.dv.tong) },
       { key: 'tyLeKN', label: 'Tỷ lệ đạt chỉ tiêu kết nạp', get: (r) => r.dv.tyLeKN, fmt: btmPct, level: (r) => btmLevelPct(r.dv.tyLeKN) }]
    : [{ key: 'tyLeDen', label: 'Xếp hạng tỷ lệ xử lý văn bản đến', get: (r) => r.vb.tyLeDen, fmt: btmPct, level: (r) => btmLevelPct(r.vb.tyLeDen) },
       { key: 'tyLeDi', label: 'Xếp hạng tỷ lệ xử lý văn bản đi toàn trình', get: (r) => r.vb.tyLeDi, fmt: btmPct, level: (r) => btmLevelPct(r.vb.tyLeDi) }];
}
function btmSortedRows() {
  const cols = btmColumns();
  if (!BTM.sort || !cols.some((c) => c.key === BTM.sort.key)) BTM.sort = { key: cols[0].key, dir: -1 };
  const col = cols.find((c) => c.key === BTM.sort.key);
  return btmBuildRows().slice().sort((a, b) => (col.get(a) - col.get(b)) * BTM.sort.dir);
}
function btmRenderTable() {
  const t = document.getElementById('btmTable'); if (!t) return;
  const cols = btmColumns();
  const all = btmSortedRows();
  const rows = BTM.selected ? all.filter((r) => r.id === BTM.selected) : all;
  const arrow = (c) => BTM.sort.key === c.key ? (BTM.sort.dir < 0 ? ' ↓' : ' ↑') : ' ⇅';
  t.innerHTML = '<thead><tr><th>STT</th><th>Đơn vị thực hiện</th>' + cols.map((c) => '<th class="btm-sortable" data-key="' + c.key + '">' + esc(c.label) + '<em>' + arrow(c) + '</em></th>').join('') + '</tr></thead><tbody>'
    + rows.map((r) => '<tr data-id="' + r.id + '" class="' + (BTM.selected === r.id ? 'is-sel' : '') + '"><td>' + (all.indexOf(r) + 1) + '</td><td>' + esc(r.unitName) + (r.isTw ? ' <span class="btm-tag" title="Đảng bộ trực thuộc Trung ương, không gắn địa bàn tỉnh">Trực thuộc TW</span>' : '') + '</td>'
      + cols.map((c) => '<td><span class="btm-badge is-' + c.level(r) + '">' + c.fmt(c.get(r)) + '</span></td>').join('') + '</tr>').join('')
    + '</tbody>';
  t.querySelectorAll('th.btm-sortable').forEach((th) => th.onclick = () => {
    BTM.sort = BTM.sort.key === th.dataset.key ? { key: th.dataset.key, dir: -BTM.sort.dir } : { key: th.dataset.key, dir: -1 };
    btmRenderTable();
  });
  t.querySelectorAll('tbody tr').forEach((tr) => tr.onclick = () => btmSelect(BTM.selected === tr.dataset.id ? null : tr.dataset.id));
  const back = document.getElementById('btmTableBack');
  if (back) back.classList.toggle('hidden', !BTM.selected);
}
function btmRenderTrend(scope) {
  const canvas = document.getElementById('btmTrendChart'); if (!canvas || typeof Chart === 'undefined') return;
  const labels = [];
  for (let i = 29; i >= 0; i--) { const d = new Date(BTM.dataDate); d.setDate(d.getDate() - i); labels.push(String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0')); }
  const isDv = BTM.mode === 'dv';
  const data = isDv ? scope.data.trend.kn : scope.data.trend.den.map((v) => Math.round(v * 10) / 10);
  const color = isDv ? '#e8a33c' : '#22a55b';
  if (BTM.chart) { BTM.chart.destroy(); BTM.chart = null; }
  const min = Math.min.apply(null, data), max = Math.max.apply(null, data);
  BTM.chart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [{ label: isDv ? 'Số đảng viên kết nạp luỹ kế' : 'Tỷ lệ xử lý văn bản đến (%)', data, borderColor: color, backgroundColor: color + '26', pointBackgroundColor: color, pointRadius: 3, borderWidth: 2, tension: 0.25, fill: true }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      scales: {
        y: isDv ? { suggestedMin: Math.max(0, Math.floor(min * 0.96)), suggestedMax: Math.ceil(max * 1.02), ticks: { color: chartAxisColor(), font: { size: 10 }, callback: (v) => Number(v).toLocaleString('vi-VN') }, grid: { color: chartGridColor() } }
                : { suggestedMin: Math.max(0, Math.floor(min - 8)), max: 100, ticks: { color: chartAxisColor(), font: { size: 10 } }, grid: { color: chartGridColor() } },
        x: { ticks: { color: chartAxisColor(), font: { size: 9.5 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 15 }, grid: { display: false } }
      },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + (isDv ? btmNum(c.parsed.y) : btmPct(c.parsed.y)) } } }
    }
  });
}
function btmRenderLegend() {
  const el = document.getElementById('btmLegend'); if (!el) return;
  const items = BTM.mode === 'dv'
    ? [['red', 'Dưới 100.000 đảng viên'], ['yellow', '100.000 – dưới 500.000'], ['green', 'Từ 500.000 trở lên']]
    : [['red', 'Dưới 50%'], ['yellow', 'Đạt 50–80%'], ['green', 'Đạt trên 80%']];
  el.innerHTML = '<b>' + (BTM.mode === 'dv' ? 'Số lượng đảng viên' : 'Tiến độ hoàn thành') + '</b>' + items.map((i) => '<div><i style="background:' + BTM_COLORS[i[0]] + '"></i>' + i[1] + '</div>').join('');
}
function btmRenderPanels() {
  const scope = btmScope();
  const dateTxt = btmDateText(BTM.dataDate, false);
  const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  setText('btmSubtitle', BTM.mode === 'dv' ? 'Theo dõi chỉ tiêu đảng viên theo địa bàn · ' + scope.label : 'Theo dõi chỉ tiêu quản lý văn bản và điều hành tác nghiệp · ' + scope.label);
  const upd = document.getElementById('btmUpdated');
  if (upd) upd.innerHTML = 'Dữ liệu cập nhật mới nhất: ' + btmDateText(BTM.dataDate, true) + '<span class="btm-demo" title="Bản demo — số liệu sinh tự động, không phải số liệu thật">SỐ LIỆU MÔ PHỎNG</span>';
  setText('btmMapTitle', BTM.mode === 'dv' ? 'Bản đồ số lượng đảng viên theo tỉnh, thành phố đến ngày ' + dateTxt : 'Bản đồ tỷ lệ xử lý văn bản đi toàn trình đến ngày ' + dateTxt);
  setText('btmRankTitle', 'Xếp hạng các cơ quan, đơn vị đến ngày ' + dateTxt);
  setText('btmTrendTitle', (BTM.mode === 'dv' ? 'Diễn biến số đảng viên kết nạp luỹ kế 30 ngày gần nhất' : 'Diễn biến tỷ lệ xử lý văn bản đến luỹ kế 30 ngày gần nhất') + ' · ' + scope.label);
  document.querySelectorAll('#btctwMapWidget [data-btm-mode]').forEach((b) => b.classList.toggle('active', b.dataset.btmMode === BTM.mode));
  btmRenderKpis(scope);
  btmRenderLegend();
  btmRenderTable();
  btmRenderTrend(scope);
}
function btmSetMode(mode) {
  if (mode === BTM.mode) return;
  BTM.mode = mode;
  BTM.sort = null;
  btmRestyle();
  if (BTM.map) BTM.map.closePopup();
  if (BTM.selected) btmSelect(BTM.selected, { keepView: true }); else btmRenderPanels();
}
function btmFillSelect() {
  const sel = document.getElementById('btmProvinceSelect'); if (!sel || sel.options.length) return;
  const rows = btmBuildRows();
  const prov = rows.filter((r) => !r.isTw).sort((a, b) => a.placeName.replace(/^(Tỉnh|Thành phố) /, '').localeCompare(b.placeName.replace(/^(Tỉnh|Thành phố) /, ''), 'vi'));
  sel.innerHTML = '<option value="">Việt Nam (toàn quốc)</option><optgroup label="Tỉnh, thành phố">' + prov.map((r) => '<option value="' + r.id + '">' + esc(r.placeName) + '</option>').join('') + '</optgroup>'
    + '<optgroup label="Đảng bộ trực thuộc Trung ương">' + rows.filter((r) => r.isTw).map((r) => '<option value="' + r.id + '">' + esc(r.placeName) + '</option>').join('') + '</optgroup>';
  sel.onchange = () => btmSelect(sel.value || null);
}
function btmToggleFullscreen(btn) {
  const w = document.getElementById('btctwMapWidget'); if (!w) return;
  const on = w.classList.toggle('btm-fs');
  if (btn) btn.title = on ? 'Thoát toàn màn hình' : 'Toàn màn hình';
  document.body.style.overflow = on ? 'hidden' : '';
  setTimeout(() => { if (BTM.map) { BTM.map.invalidateSize(); btmDeclutterLabels(); } if (BTM.chart) BTM.chart.resize(); }, 60);
}
async function btmExportExcel() {
  if (typeof ExcelJS === 'undefined') { if (typeof toast === 'function') toast('Chưa tải được thư viện Excel — kiểm tra kết nối mạng.'); return; }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Xếp hạng');
  const dateTxt = btmDateText(BTM.dataDate, false);
  ws.addRow([(BTM.mode === 'dv' ? 'Chỉ tiêu đảng viên theo địa bàn' : 'Chỉ tiêu quản lý văn bản và điều hành tác nghiệp') + ' — đến ngày ' + dateTxt]).font = { bold: true, size: 13 };
  ws.addRow(['SỐ LIỆU MÔ PHỎNG (BẢN DEMO) — KHÔNG PHẢI SỐ LIỆU THẬT']).font = { italic: true, color: { argb: 'FFC00000' } };
  ws.addRow([]);
  const head = BTM.mode === 'dv'
    ? ['STT', 'Đơn vị thực hiện', 'Loại', 'Tổng số đảng viên', 'Đảng viên chính thức', 'Đảng viên dự bị', 'Chỉ tiêu kết nạp ' + BTM_YEAR, 'Đã kết nạp ' + BTM_YEAR, 'Tỷ lệ đạt chỉ tiêu kết nạp (%)', 'Phân loại']
    : ['STT', 'Đơn vị thực hiện', 'Loại', 'Tổng số văn bản đi', 'Số văn bản ký điện tử', 'Tỷ lệ xử lý văn bản đi toàn trình (%)', 'Tổng số văn bản đến', 'Số văn bản đến điện tử', 'Văn bản đến đã xử lý', 'Tỷ lệ xử lý văn bản đến (%)', 'Phân loại'];
  ws.addRow(head).font = { bold: true };
  const lvText = { green: 'Xanh', yellow: 'Vàng', red: 'Đỏ' };
  const r1 = (v) => Math.round(v * 10) / 10;
  btmSortedRows().forEach((r, i) => {
    const type = r.isTw ? 'Đảng bộ trực thuộc TW' : 'Tỉnh, thành phố';
    ws.addRow(BTM.mode === 'dv'
      ? [i + 1, r.unitName, type, r.dv.tong, r.dv.chinhThuc, r.dv.duBi, r.dv.ketNapCT, r.dv.ketNapDat, r1(r.dv.tyLeKN), lvText[btmLevelDv(r.dv.tong)]]
      : [i + 1, r.unitName, type, r.vb.vbDi, r.vb.kyDienTu, r1(r.vb.tyLeDi), r.vb.vbDen, r.vb.denDienTu, r.vb.denDaXuLy, r1(r.vb.tyLeDen), lvText[btmLevelPct(r.vb.tyLeDi)]]);
  });
  ws.columns = head.map((h, i) => ({ width: i === 0 ? 6 : i === 1 ? 46 : i === 2 ? 22 : 20 }));
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'BTCTW-' + (BTM.mode === 'dv' ? 'dang-vien' : 'van-ban') + '-' + dateTxt.replace(/\//g, '-') + '-DU-LIEU-MO-PHONG.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* Với BTCTW (yêu cầu 2026-09-26): ẨN widget "Bản đồ GIS" (Hà Nội) và "Nguồn dữ liệu" — chỉ ẩn bằng class riêng
   .btm-role-hidden (KHÔNG dùng .hidden để khỏi đụng cơ chế ẩn/hiện widget theo tuỳ chọn người dùng), code và dữ
   liệu 2 widget giữ nguyên; tài khoản khác vẫn thấy bình thường. Lưới dashboard đổi sang bố cục .btm-tw-layout
   (Chỉ tiêu 2/3 trái + Notify 1/3 phải) cho khỏi trống chỗ. */
function btmApplyTwLayout(on) {
  const grid = document.querySelector('.dashboard-grid');
  const gis = document.getElementById('gismap'), src = document.getElementById('sourcesWidget');
  const wasHidden = gis && gis.classList.contains('btm-role-hidden');
  if (grid) grid.classList.toggle('btm-tw-layout', on);
  [gis, src].forEach((el) => { if (el) el.classList.toggle('btm-role-hidden', on); });
  // GIS vừa hiện lại (chuyển từ BTCTW sang tài khoản khác) — Leaflet phải tính lại kích thước khung.
  if (!on && wasHidden && window._gisMap) setTimeout(() => window._gisMap.invalidateSize(), 60);
}

/* Gọi từ renderAll(): chỉ hiện cho Ban Tổ chức Trung ương (TW_DANG). Bản đồ chỉ khởi tạo khi khối đã hiện ra
   (Leaflet cần kích thước thật của khung để tính toán). */
function renderBtctwNationalMap() {
  const w = document.getElementById('btctwMapWidget'); if (!w) return;
  const show = typeof currentRole !== 'undefined' && currentRole === 'TW_DANG';
  w.classList.toggle('hidden', !show);
  btmApplyTwLayout(show);
  if (!show) { if (w.classList.contains('btm-fs')) btmToggleFullscreen(); return; }
  if (!BTM.dataDate) BTM.dataDate = new Date();
  if (!w.dataset.bound) {
    w.dataset.bound = '1';
    w.querySelectorAll('[data-btm-mode]').forEach((b) => b.onclick = () => btmSetMode(b.dataset.btmMode));
  }
  btmFillSelect();
  if (!BTM.map) { btmInitMap(); setTimeout(() => { if (BTM.map) { BTM.map.invalidateSize(); BTM.map.fitBounds(BTM_VN_BOUNDS, { padding: [8, 8] }); btmDeclutterLabels(); } }, 250); }
  else { BTM.map.invalidateSize(); btmDeclutterLabels(); }
  btmRenderPanels();
}
