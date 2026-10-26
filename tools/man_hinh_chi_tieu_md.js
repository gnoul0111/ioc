'use strict';
/* ============================== TÀI LIỆU MÀN HÌNH CHỈ TIÊU (.md) — 4 TRỤC + 14 SỞ, NGÀNH ==============================
   Sinh tài liệu mô tả MÀN HÌNH chỉ tiêu cấp Thành phố: các màn, cách mở popup, từng ô số / thẻ / biểu đồ, số liệu, cách
   tính, nguồn và cách giả lập số. Số và cấu trúc đọc THẲNG từ code đang chạy (nạp các file cấu hình trong vm như bộ test
   tests/ctm), lời văn mô tả luồng viết tay ở đây — sửa code rồi chạy lại là tài liệu khớp giao diện.
   - Trục Thành ủy, HĐND, MTTQ → docs/CHUNG/TRUC_*_MAN_HINH_CHI_TIEU.md (màn ngoài của trục + từng đơn vị)
   - Trục UBND → docs/CHUNG/TRUC_UBND_MAN_HINH_CHI_TIEU.md (màn tổng quan UBND + danh mục sở, trỏ sang tài liệu từng sở)
   - 11 sở theo eform (khuôn chung) + Sở Tài chính, Sở GD&ĐT, TT Phục vụ HCC (form riêng) → docs/<đơn vị>/<MÃ>_MAN_HINH_CHI_TIEU.md
   Chỉ cấp Thành phố (không viết màn của tài khoản xã/phường). Chạy: node tools/man_hinh_chi_tieu_md.js (từ thư mục gốc ioc) */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const VER = '1.0', NGAY = '21/10/2026';
const escFn = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

/* ---------- 1. Nạp code chỉ tiêu vào vm (như tests/ctm/ctm-quy-tac.test.js), giữ lại khai báo gốc của từng đơn vị ---------- */
const SO_KEYS = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'];
/* thứ tự như demo_ioc.html: cấu hình (stc/sgd/hcc + 12 sở) → dữ liệu và form riêng Sở Tài chính, Sở GD&ĐT, TT HCC → khuôn chung → danh mục lĩnh vực */
const FILES = ['js/core/xa-dan-so.js', 'js/core/line-chart.js', 'js/core/stc-config.js', 'js/core/sgd-config.js', 'js/core/hcc-config.js'].concat(SO_KEYS.map((s) => 'js/core/' + s + '-config.js'),
  ['js/data/stc-snapshot.js', 'js/features/stc-demo-data.js', 'js/features/stc-data.js', 'js/features/dashboard-stc.js', 'js/features/sgd-data.js', 'js/features/dashboard-sgd.js',
    'js/features/hcc-data.js', 'js/features/dashboard-hcc.js', 'js/core/ctm-xa.js', 'js/features/ctm-engine.js', 'js/features/ctm-mttq.js', 'js/features/ctm-dang.js', 'js/features/ctm-hdnd.js',
    'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js', 'js/features/ubnd-overview.js', 'js/core/central-level.js']);
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc: escFn, document: {}, location: { search: '' }, setInterval, clearInterval, setTimeout, Promise, CTM_DEFS: {} });
ctx.window = ctx;
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + eduM[1] + '];', ctx);
/* chèn một dòng ghi lại khai báo (def) ở đầu các hàm khai báo — chỉ trong bản nạp vào vm, file gốc không đổi */
const HOOK = {
  'js/features/ctm-engine.js': [['function ctmMake(def) {', 'function ctmMake(def) { CTM_DEFS[def.id] = Object.assign(CTM_DEFS[def.id] || {}, { make: def });'],
    ['function ctmTaskSpec(def) {', 'function ctmTaskSpec(def) { CTM_DEFS[def.id] = Object.assign(CTM_DEFS[def.id] || {}, { task: def });']],
  'js/features/ctm-so.js': [['function ctmSo(def) {', 'function ctmSo(def) { CTM_DEFS[def.id] = Object.assign(CTM_DEFS[def.id] || {}, { so: def });']]
};
FILES.forEach((f) => {
  let src = read(f);
  (HOOK[f] || []).forEach(([a, b]) => { if (src.indexOf(a) < 0) throw new Error('Không tìm thấy "' + a + '" trong ' + f); src = src.replace(a, b); });
  vm.runInContext(src, ctx, { filename: f });
});
const run = (code) => vm.runInContext(code, ctx);
if (run('typeof wardNames') !== 'function') run('function wardNames(){return gdUnitData.map(function(u){return u[0]})}');
run('currentXaId=null');
const S = run('CTM_SPECS'), DEFS = run('CTM_DEFS'), OVS = run('CTM_OVERVIEWS');
const E = (name) => run(name);

/* ---------- 2. Tiện ích viết Markdown ---------- */
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n+/g, '<br>');
const table = (head, rows) => rows.length ? '| ' + head.map(cell).join(' | ') + ' |\n|' + head.map(() => '---').join('|') + '|\n' + rows.map((r) => '| ' + r.map(cell).join(' | ') + ' |').join('\n') + '\n' : '_(không có)_\n';
const fmt = (v, d) => E('ctmF')(v, d);
const code = (s) => '`' + String(s).replace(/`/g, "'") + '`';
/* lấy các khối chú thích /* … *\/ quanh khai báo một đơn vị trong file nguồn: khối ngay trước lần xuất hiện đầu tiên của mã
   đơn vị và mọi chú thích nằm trong phần khai báo (đến lần gọi khai báo kế tiếp ở đầu dòng) */
const cleanComment = (c) => c.replace(/^\/\*+\s?|\s*\*+\/$/g, '').split(/\r?\n/).map((l) => l.replace(/^\s{0,3}/, '').replace(/\s+$/, '')).join('\n').trim();
function sourceNotes(file, id) {
  const src = read(file), at = src.indexOf("'" + id + "'");
  if (at < 0) return [];
  const out = [];
  const before = src.slice(0, at), cEnd = before.lastIndexOf('*/'), cStart = before.lastIndexOf('/*', cEnd);
  if (cEnd > 0 && cStart >= 0) {
    const gap = before.slice(cEnd + 2);
    /* khối chú thích phải đứng ngay trước (chỉ cách vài dòng khai báo, không vắt qua khai báo khác) */
    if (gap.split('\n').length <= 12 && !/\bid:\s*'/.test(gap.replace(/^[\s\S]*?\n/, ''))) out.push(cleanComment(before.slice(cStart, cEnd + 2)));
  }
  const rest = src.slice(at), next = rest.slice(1).search(/\n(ctm[A-Za-z]+\(|hdndBan\(|\/\* -{5,})/);
  const body = next < 0 ? rest : rest.slice(0, next + 1);
  (body.match(/\/\*[\s\S]*?\*\//g) || []).forEach((c) => { const t = cleanComment(c); if (t.length > 25 && out.indexOf(t) < 0) out.push(t); });
  return out;
}
const quote = (t) => t.split('\n').map((l) => '> ' + l).join('\n') + '\n';

/* ---------- 3. Đọc cấu hình một đơn vị khuôn chung ---------- */
function nOf(spec) { return E('ctmNP')(spec); }
function val(spec, k, D) { return E('ctmV')(spec, k, D); }
function vtxt(spec, k, D) { const v = val(spec, k, D); return v == null ? '—' : E('ctmFmtM')(spec, k, v) + (E('ctmUnit')(spec, k) ? ' ' + E('ctmUnit')(spec, k) : ''); }
function lab(spec, k) { const m = E('ctmM')(spec, k); return m.l || k; }
/* nhãn kèm tên khối cho đơn vị Theo dõi nhiệm vụ (các khối có cùng tên trạng thái: tw_cho, ub_cho…) */
function labK(spec, k) {
  const T = DEFS[spec.id] && DEFS[spec.id].task, mm = /^([a-z]+)_/.exec(k);
  const K = T && mm && T.khoi.find((x) => x.id === mm[1]);
  return lab(spec, k) + (K && T.khoi.length > 1 && lab(spec, k).indexOf(K.label) < 0 ? ' (' + K.label + ')' : '');
}
/* kiểu dữ liệu và chiều tốt/xấu của một chỉ tiêu (quy tắc H1, H18) */
function kind(m) {
  const t = m.plan ? 'Kế hoạch, chỉ tiêu giao' : m.ck ? 'Lũy kế từ đầu năm' : m.td ? 'Số tại thời điểm' : m.month ? 'Số riêng một tháng' : m.u === '%' ? 'Tỷ lệ' : 'Phát sinh trong kỳ';
  const c = m.inv ? 'giảm là tốt' : m.neutral ? 'trung tính' : 'tăng là tốt';
  return t + ' · ' + c;
}
/* mốc so sánh của chỉ tiêu ở kỳ mới nhất (quy tắc H9, H10) */
function cmpText(spec, k, n) {
  const c = E('ctmCmpOf')(spec, k, n), m = E('ctmM')(spec, k);
  if (c.none) return 'Không so (kế hoạch)';
  const pv = E('ctmPrevV')(spec, k, n), now = val(spec, k, n.D);
  if (pv == null) return c.na || 'Chưa có kỳ so sánh';
  const rate = m.rate || m.u === '%';
  const dv = rate ? now - pv : pv ? (now / pv - 1) * 100 : null;
  const lbl = E('ctmPLabel')(spec, c.pid);
  return 'So ' + lbl + ' (' + E('ctmFmtM')(spec, k, pv) + '): ' + (dv == null ? '—' : (dv > 0 ? '+' : dv < 0 ? '−' : '') + fmt(Math.abs(dv), rate ? Math.max(1, m.d || 1) : 1) + (rate ? ' điểm %' : '%'));
}
/* cách có số của một chỉ tiêu: khuôn ctmMake (dãy giả lập / số khai báo từng kỳ / tính từ chỉ tiêu khác) hoặc ctmSo (biểu thức đọc cấu hình sở) */
function fnBody(f) { const s = String(f); const i = s.indexOf('=>'); return (i >= 0 ? s.slice(i + 2) : s).trim().replace(/^\{\s*return\s*|;?\s*\}$/g, ''); }
function pretty(spec, expr, pre) {
  return expr.replace(/\bD\.([A-Za-z_]\w*)/g, (x, k) => '«' + labK(spec, k) + '»').replace(/D\[p \+ '(\w+)'\]/g, (x, k) => '«' + (pre ? labK(spec, pre + k) : k) + '»')
    /* bỏ đoạn kiểm tra rỗng "(X == null ? null : công thức)" và "X ? công thức : null" — chỉ giữ công thức */
    .replace(/^\((«[^»]+»)\s*==\s*null\s*\?\s*null\s*:\s*([\s\S]*)\)$/, '$2').replace(/^\((«[^»]+»)\s*\?\s*([\s\S]*?)\s*:\s*null\)$/, '$2').replace(/^(«[^»]+»)\s*\?\s*([\s\S]*?)\s*:\s*null$/, '$2')
    .replace(/(\d)\.(\d)/g, '$1,$2').replace(/\s*\*\s*/g, ' × ').replace(/\s\/\s/g, ' ÷ ').replace(/ - /g, ' − ');
}
function srcMake(spec, def, k, periods) {
  const x = def.m[k];
  if (!x) return '';
  if (Array.isArray(x)) {
    if (Array.isArray(x[3])) return 'Số khai báo từng kỳ (mới nhất trước): ' + x[3].map((v, i) => (periods[i] ? periods[i].short + ': ' : '') + (v == null ? '—' : fmt(v, x[2] || 0))).join('; ');
    const g = x[4] || 0;
    return 'Giả lập: kỳ mới nhất ' + fmt(x[3], x[2] || 0) + (x[1] === '%' ? '%' : '') + '; lùi về các kỳ trước ' + (x[1] === '%' ? fmt(Math.abs(g), 2) + ' điểm %/kỳ' : fmt(Math.abs(g), 2) + '%/kỳ') +
      (g < 0 ? ' (theo chiều giảm dần về sau)' : '') + ', nhiễu cố định ' + (x[1] === '%' ? '±' + fmt(Math.max(0.3, Math.abs(g)) * 0.4, 2) + ' điểm' : '±1,5%');
  }
  if (x.sum) return 'Tính: cộng ' + x.sum.map((p) => '«' + labK(spec, p) + '»').join(' + ');
  if (x.f) { const mm = /^([a-z]+_)/.exec(k); return 'Tính: ' + pretty(spec, fnBody(x.f), mm ? mm[1] : ''); }
  return '';
}
function srcSo(def, k) {
  const x = def.m[k];
  if (!x) return '';
  const a = typeof x[3] === 'function' ? fnBody(x[3]) : x[3] == null ? '—' : String(x[3]);
  const b = typeof x[4] === 'function' ? fnBody(x[4]) : null;
  return 'Kỳ này: ' + code(a) + (b ? ' · cùng kỳ: ' + code(b) : '');
}
/* Đơn vị khai báo riêng (ctmRegister trực tiếp, không qua ctmMake): mô tả cách có số viết tay */
const CUSTOM = {
  'mttq-quy': {
    src: 'Số từng năm 2021–2025 khai báo ở `MTQ_QUY_BASE` (js/features/ctm-mttq.js; số công bố ghi chú ở từng năm); số dẫn xuất tính trong `mtqQuyData`: tồn đầu năm = tồn cuối năm trước (tồn đầu 2021: 19,8 tỷ), tồn cuối = tồn đầu + vận động − chi; chi xây mới, sửa chữa nhà = số căn × mức bình quân; phần chi còn lại chia theo cơ cấu cố định (Tết 47,7%, an sinh 27,1%, sinh kế 11,3%, học tập 7,9%, khám chữa bệnh 6%); quà Tết cấp Thành phố = 5.280 suất × 1 triệu + 300 suất × 0,5 triệu; Quỹ biển, đảo chia theo cơ cấu người ủng hộ cố định',
    xa: {
      q: 'Chia số Thành phố «Quỹ của 126 xã, phường» theo dân số × (phường 1,35 / xã 0,85) × hệ số cố định 0,75–1,25 (theo tên) × 0,94–1,06 (theo năm) — `mtqQuyXaRows`',
      qpc: '= Quỹ vận động tại xã ÷ dân số (nghìn đồng/người)',
      cn: 'Chia số hộ cận nghèo Thành phố theo số hộ (xã ×1, phường ×0,35) ÷ √mật độ dân số × hệ số cố định; số nơi mật độ cao nhất bằng "xã, phường không còn hộ cận nghèo" (số công bố) nhận 0; làm tròn phần dư lớn nhất nên cộng đúng tổng',
      cnR: '= Hộ cận nghèo ÷ số hộ × 100',
      nha: 'Chia số nhà Đại đoàn kết xây mới, sửa chữa theo (hộ cận nghèo + dân số ÷ 20.000) × hệ số cố định, làm tròn phần dư lớn nhất'
    }
  }
};
/* tên kiểu thẻ ở màn nhóm */
function cardKind(spec, c, n) {
  switch (c.type) {
    case 'cmp': return 'Thẻ so sánh: số lớn + thanh ngang kỳ này / kỳ so sánh';
    case 'cols': { const m = E('ctmM')(spec, c.m); const vals = spec.periods.map((p) => val(spec, c.m, E('ctmD')(spec, p.id))); return E('ctmLineFor')(m, vals) ? 'Biểu đồ đường qua các kỳ (trục không bắt đầu từ 0)' : 'Biểu đồ cột qua các kỳ' + (c.m2 ? ', 2 dãy' : ''); }
    case 'table': return 'Bảng' + (c.total ? ' có cột tỷ trọng và dòng tổng' : '');
    case 'parts': return 'Thẻ cơ cấu: thanh xếp chồng + từng phần (tỷ trọng, mức đổi)';
    case 'top': return 'Danh sách 10 xã, phường đứng đầu';
    case 'rates': return 'Thanh tỷ lệ 0–100%' + (c.items.some((k) => E('ctmM')(spec, k).plan) ? ', vạch chỉ tiêu giao' : '');
    case 'html': return 'Thẻ tự do';
    case 'mbars': return /chỉ số/i.test(c.t || '') || c.idx ? 'Biểu đồ đường, mốc 100' : c.u === '%' ? 'Biểu đồ đường (tỷ lệ theo tháng/quý)' : 'Biểu đồ cột theo tháng/quý' + (c.vals2 ? (c.plan || /kế hoạch/i.test(c.l2 || '') ? ', vạch kế hoạch' : ', 2 dãy') : '');
    case 'shares': return c.u === '%' ? 'Thanh tỷ lệ từng phần' : 'Thẻ cơ cấu: thanh xếp chồng + từng phần có %';
    case 'list': return 'Bảng danh sách';
    default: return c.type;
  }
}
function arr(f, D) { try { return (typeof f === 'function' ? f(D) : f) || []; } catch (e) { return []; } }
function cardContent(spec, c, n) {
  const L = (keys) => (keys || []).filter((k) => !E('ctmM')(spec, k).plan || c.type === 'rates').map((k) => lab(spec, k) + ': ' + vtxt(spec, k, n.D)).join('; ');
  switch (c.type) {
    case 'cmp': {
      /* đọc đúng thẻ đã dựng: thẻ gọn (chỉ số lớn) hay có các thanh nào — luật không lặp số quyết định lúc dựng */
      const items = (c.items || [c.big]).filter((k) => !E('ctmM')(spec, k).plan && !E('ctmM')(spec, k).month);
      const big = c.big && !E('ctmM')(spec, c.big).plan ? c.big : items[0];
      let html = ''; try { run('CTM_SHOWN = {}'); html = E('ctmCardHtml')(spec, c, n); } catch (e) { html = ''; }
      const bars = (html.match(/<div class="stc-cmp"[\s\S]*?<div class="stc-nm">([^<]*)<\/div>/g) || []).map((x) => x.replace(/[\s\S]*<div class="stc-nm">/, '').replace(/<\/div>$/, ''));
      let s = 'Số lớn: ' + lab(spec, big) + ' = ' + vtxt(spec, big, n.D);
      if (html.indexOf('ctm-compact') >= 0) s += '. Thẻ gọn: không vẽ thanh nhắc lại số' + (html.indexOf('ctm-cmpline') >= 0 ? ', dòng dưới ghi số kỳ so sánh' : '');
      else if (bars.length) s += '. Các thanh (kỳ này' + (html.indexOf('stc-b p') >= 0 ? ' và kỳ so sánh' : '') + '): ' + bars.map((t) => { const k = items.find((x) => (E('ctmM')(spec, x).short || lab(spec, x)) === t); return k ? t + ' ' + vtxt(spec, k, n.D) : t; }).join('; ');
      if (c.dupWith && c.dupWith.length && html.indexOf('ctm-compact') >= 0 && items.length > 1) s += ' (các phần đã có ở thẻ cơ cấu cùng nhóm nên không vẽ lại)';
      if (c.rates) s += '. Kèm dòng tỷ lệ: ' + L(c.rates);
      return s;
    }
    case 'cols': return lab(spec, c.m) + ' qua ' + spec.periods.length + ' kỳ: ' + spec.periods.slice().reverse().map((p) => p.short + ' ' + fmt(val(spec, c.m, E('ctmD')(spec, p.id)), E('ctmM')(spec, c.m).d)).join(', ') + (c.m2 ? '; dãy 2: ' + lab(spec, c.m2) : '');
    case 'table': return (c.rows || []).map((k) => lab(spec, k)).join('; ') + (c.total ? '; tổng: ' + lab(spec, c.total) : '');
    case 'parts': return 'Tổng ' + lab(spec, c.total) + ' = ' + vtxt(spec, c.total, n.D) + '; phần: ' + L(c.parts);
    case 'top': { const I = spec.xa && spec.xa.inds.find((x) => x.id === c.ind); return I ? I.l + ' (' + I.u + ')' : c.ind; }
    case 'rates': return L(c.items);
    case 'mbars': { const v = arr(c.vals, n.D), lb = arr(c.labels, n.D); return (c.l1 || c.t) + ': ' + v.map((x, i) => (lb[i] || '') + ' ' + fmt(x, c.d || 0)).join(', ') + (c.vals2 ? '; ' + (c.l2 || 'dãy 2') + ': ' + arr(c.vals2, n.D).map((x) => fmt(x, c.d || 0)).join(', ') : ''); }
    case 'shares': return arr(c.items || c.rows, n.D).map((r) => E('ctmLb')(r[0]) + ' ' + fmt(Number(r[1]), c.d || (c.u === '%' ? 1 : 0)) + (c.u === '%' ? '%' : '')).join('; ');
    case 'list': { const r = arr(c.rows, n.D); return 'Cột: ' + (c.head || []).map((h) => E('ctmLb')(h)).join(' · ') + ' — ' + r.length + ' dòng' + (r[0] ? ' (dòng đầu: ' + r[0].map((x) => typeof x === 'number' ? fmt(x, 0) : E('ctmLb')(x)).join(' · ') + ')' : ''); }
    case 'html': return 'Nội dung tự soạn';
    default: return '';
  }
}
const W_TXT = { pop: 'dân số', xa: 'dân số, xã ×1,4 / phường ×0,75', pho: 'dân số, phường ×1,4 / xã ×0,75', ho: 'số hộ', dt: 'diện tích', const: 'chia đều' };
function xaMethod(spec, I, def) {
  const dI = def && def.make && (def.make.xa || []).find((x) => x.id === I.id);
  if (dI && dI.from) return 'Chia số Thành phố «' + lab(spec, dI.from) + '»' + (dI.k != null && dI.k !== 1 ? ' × ' + fmt(dI.k, 2) + ' (phần thuộc cấp xã)' : '') + ' cho 126 xã, phường theo trọng số ' + (W_TXT[dI.w || 'pop'] || dI.w) + ' × hệ số ngẫu nhiên cố định 0,7–1,3 (theo tên) × 0,95–1,05 (theo kỳ); làm tròn theo phần dư lớn nhất nên cộng 126 nơi đúng bằng số Thành phố';
  if (dI && dI.rate) return 'Tỷ lệ Thành phố «' + lab(spec, dI.rate) + '» cộng dao động ngẫu nhiên cố định (biên độ ' + fmt(dI.spread || 6, 1) + ' điểm theo tên, 1,5 điểm theo kỳ), chặn 0–100, rồi dịch đều để gộp theo dân số đúng bằng tỷ lệ Thành phố';
  if (dI && dI.per) return '= ' + (spec.xa.inds.find((x) => x.id === dI.per[0]) || { l: dI.per[0] }).l + ' ÷ ' + (dI.per[1] === 'ds' ? 'dân số' : 'số hộ') + ' × ' + fmt(dI.per[2], 0);
  if (dI && dI.pct) return '= ' + (spec.xa.inds.find((x) => x.id === dI.pct[0]) || { l: dI.pct[0] }).l + ' ÷ ' + (spec.xa.inds.find((x) => x.id === dI.pct[1]) || { l: dI.pct[1] }).l + ' × 100';
  const sI = def && def.so && def.so.xa && def.so.xa.inds.find((x) => x.id === I.id);
  if (sI) return 'Số theo eform của từng xã, phường (bản ghi «Địa bàn» của sở): ' + code(fnBody(sI.f));
  if (CUSTOM[spec.id] && CUSTOM[spec.id].xa[I.id]) return CUSTOM[spec.id].xa[I.id];
  if (I.f) return code(fnBody(I.f));
  return 'Khai báo riêng của đơn vị (xem mục nguồn số)';
}
function xaTp(spec, I, def) {
  const sI = def && def.so && def.so.xa && def.so.xa.inds.find((x) => x.id === I.id);
  if (sI && sI.tpm) return 'Đọc đúng ô số Thành phố «' + lab(spec, sI.tpm) + '» (cùng số với màn Tổng quan)';
  if (I.tot) return 'Tổng 126 xã, phường (cột cuối là tỷ trọng)';
  const dI = def && def.make && (def.make.xa || []).find((x) => x.id === I.id);
  if (dI && dI.rate) return 'Tỷ lệ Thành phố «' + lab(spec, dI.rate) + '»';
  if (dI && (dI.per || dI.pct)) return 'Gộp: tổng tử số 126 nơi ÷ tổng mẫu số (không lấy trung bình cộng)';
  return 'Gộp theo trọng số dân số (tổng tử ÷ tổng mẫu, không lấy trung bình cộng)';
}
function xaRank(I) {
  const noRank = E('ctmXaNoRank')(I);
  if (noRank) return I.better === 'none' ? 'Trung tính: chỉ sắp theo số, cột "Thứ tự", không tô tốt/xấu' : 'Số tuyệt đối: cột "Thứ tự" (sắp từ lớn đến nhỏ), không xếp hạng tốt/kém';
  return 'Xếp hạng (cột "Hạng"), ' + (I.better === 'low' ? 'thấp là tốt' : 'cao là tốt') + '; cột "So mức TP" = chênh với mức Thành phố' + (I.minW ? '; mẫu số dưới ' + fmt(I.minW, 0) + ' thì ghi "Mẫu nhỏ", không xếp hạng' : '');
}

/* ---------- 4. Viết phần mô tả một đơn vị khuôn chung ---------- */
const H = (lv, t) => '#'.repeat(lv) + ' ' + t + '\n\n';
function unitDoc(id, lv, opt) {
  opt = opt || {};
  const spec = S[id], def = DEFS[id] || {}, n = nOf(spec);
  const name = E('ctmName')(spec), org = E('ctmOrg')(spec);
  const G = spec.groups || [];
  let h = '';
  const per = spec.periods.map((p) => p.label);
  h += table(['Mục', 'Nội dung'], [
    ['Mã lĩnh vực (catId)', code(id)],
    ['Tên hiển thị', name + (org ? ' · ' + org : '')],
    ['Kỳ báo cáo', per.length === 1 ? per[0] + ' (chỉ một kỳ, không có mũi tên so sánh)' : per.join(', ') + ' — mặc định kỳ mới nhất ' + per[0]],
    ['Cách so sánh', E('ctmQuarterly')(spec) ? 'Số phát sinh và lũy kế so cùng kỳ năm trước; số tại thời điểm so quý liền trước' : per.length > 1 ? (def.so ? 'Chỉ tiêu có số cùng kỳ thì so với ' + per[1] : 'So với năm (kỳ) liền trước') : 'Không so (một kỳ)'],
    ['Màn hình', spec.kpis.length + ' ô số chính · ' + G.length + ' nhóm (mỗi nhóm một màn)' + (spec.xa ? ' · màn "' + E('ctmXaLabel')(spec) + '" (' + spec.xa.inds.length + ' chỉ tiêu)' : ' · không có màn theo xã, phường')],
    ['Số chỉ tiêu khai báo', Object.keys(spec.metrics).length]
  ]);
  h += '\n';
  /* màn ngoài */
  h += H(lv + 1, 'Thẻ ở màn ngoài');
  h += 'Thẻ của đơn vị trên lưới màn ngoài ghi ' + E('ctmOvLines')(spec).length + ' dòng số (cùng số, cùng nhãn ở mọi màn ngoài và ở ô số khi mở chi tiết — quy tắc H22); chân thẻ ghi kỳ ' + E('ctmPLabel')(spec, n.p) + '. Bấm thẻ mở popup ở màn Tổng quan.\n\n';
  h += table(['Dòng', 'Số', 'Đơn vị'], E('ctmOvLines')(spec).map((x) => [x.l, x.v, x.u === '%' ? '%' : x.u]));
  h += '\n';
  /* Tổng quan */
  h += H(lv + 1, 'Màn Tổng quan (popup)');
  h += 'Tiêu đề popup: **' + name + '**; phụ đề: ' + (org ? org + ' · ' : '') + spec.kpis.length + ' chỉ tiêu chính · ' + G.length + ' nhóm · ' + E('ctmPLabel')(spec, n.p) + '. Thanh công cụ: chọn **Kỳ báo cáo**, **Nhập chỉ tiêu**, **Xuất Excel**. Từ trên xuống: hàng ô số chính, các thẻ nhóm' + (spec.xa ? ' và thẻ "' + E('ctmXaLabel')(spec) + '"' : '') + ', khung "Cách đọc", chân màn ghi kỳ và cách so sánh, cuối cùng là khối "Nhiệm vụ đã giao" của lĩnh vực.\n\n';
  h += '**Ô số chính** (bấm ô mở đúng nhóm hoặc màn xã ghi ở cột cuối):\n\n';
  h += table(['#', 'Ô số', 'Số (' + E('ctmPLabel')(spec, n.p) + ')', 'Dòng phụ', 'So sánh', 'Bấm mở'], spec.kpis.map((k, i) => {
    let sub = ''; try { sub = k.sub ? k.sub(n.D, n.P, n) : E('ctmUnit')(spec, k.m); } catch (e) { sub = ''; }
    const t = k.target || '';
    const go = t.indexOf('g:') === 0 ? 'Nhóm "' + ((G.find((g) => g.id === t.slice(2)) || {}).label || t) + '"' : t.indexOf('xa') === 0 ? 'Màn theo xã, phường' : '—';
    return [i + 1, lab(spec, k.m), vtxt(spec, k.m, n.D), sub, cmpText(spec, k.m, n), go];
  }));
  h += '\n**Thẻ nhóm** (mỗi thẻ liệt kê các dòng chỉ tiêu của nhóm; dòng "Xem nhóm … ›" ở đáy thẻ, cả thẻ bấm được):\n\n';
  h += table(['Nhóm', 'Các dòng trên thẻ'], G.map((g) => [g.label, (g.lines || []).map((k) => (E('ctmM')(spec, k).short || lab(spec, k)) + ' ' + vtxt(spec, k, n.D)).join('; ')]));
  if (spec.note) { let t = ''; try { t = typeof spec.note === 'function' ? spec.note(n.D, n.P, n) : spec.note; } catch (e) { t = ''; } if (t) h += '\nKhung **Cách đọc**: ' + String(t).replace(/<[^>]+>/g, '') + '\n'; }
  h += '\n';
  /* Màn nhóm */
  h += H(lv + 1, 'Các màn nhóm');
  h += 'Bấm thẻ nhóm (hoặc ô số) mở màn của nhóm: tiêu đề "' + name + ' — <tên nhóm>", phụ đề "Nhóm i/' + G.length + ' · kỳ"; nút "← Tổng quan"; dưới cùng có liên kết sang nhóm trước / nhóm sau. Thẻ xếp thành hàng 2 thẻ (thẻ gọn một chỉ tiêu đứng cạnh biểu đồ theo tỷ lệ 1:2; thẻ không có gì để vẽ thì bỏ).\n\n';
  G.forEach((g, gi) => {
    h += H(lv + 2, (gi + 1) + '. ' + g.label);
    if (g.note) { let t = ''; try { t = typeof g.note === 'function' ? g.note(n.D, n.P, n) : g.note; } catch (e) { t = ''; } if (t) h += 'Dòng mô tả đầu màn: _' + t + '_\n\n'; }
    const rows = g.rows || E('ctmAutoRows')(spec, g);
    const out = [];
    rows.forEach((row, ri) => row.forEach((c) => {
      let html = ''; try { html = E('ctmCardHtml')(spec, c, n); } catch (e) { html = ''; }
      if (!html) return;
      const t = c.t || (c.type === 'top' ? 'Xã, phường đứng đầu' : '');
      out.push([ri + 1, t, cardKind(spec, c, n), cardContent(spec, c, n) + (c.hint ? ' — Ghi chú dưới thẻ: ' + (typeof c.hint === 'function' ? '' : c.hint) : '')]);
    }));
    h += table(['Hàng', 'Thẻ', 'Kiểu', 'Nội dung, số (' + E('ctmPLabel')(spec, n.p) + ')'], out) + '\n';
  });
  /* Màn xã */
  if (spec.xa) {
    h += H(lv + 1, 'Màn "' + E('ctmXaLabel')(spec) + '"');
    h += 'Mở bằng liên kết "' + E('ctmXaLabel')(spec) + ' ›" ở màn Tổng quan, thẻ cùng tên, tên thẻ có dấu › ở màn nhóm, hoặc ô số trỏ tới. Bố cục: cột trái là danh sách chỉ tiêu (bấm để đổi), bên phải là 4 ô (mức chung Thành phố, cao nhất, thấp nhất, số nơi kém hơn mức Thành phố — số tuyệt đối thì là tổng, nhiều nhất, ít nhất, số nơi bằng 0), bộ lọc "Tất cả 126 / 51 phường / 75 xã", ô tìm tên, bảng 126 dòng (Hạng/Thứ tự · Xã, phường · Dân số · Tỷ lệ/Giá trị · So mức TP/Tỷ trọng). Bấm tên một nơi mở **khung hồ sơ** trượt từ phải: diện tích, dân số, mật độ, mọi chỉ tiêu của nơi đó kèm hạng, nút Trước/Sau. Dân số, diện tích, loại phường/xã là số thật (phương án sắp xếp đơn vị hành chính cấp xã 2025).\n\n';
    const rowsX = E('ctmXaRows')(spec, n.p);
    h += table(['Chỉ tiêu', 'Đơn vị', 'Số lẻ', 'Xếp hạng', 'Mức Thành phố (' + E('ctmPLabel')(spec, n.p) + ')', 'Số từng xã, phường'], spec.xa.inds.map((I) => {
      const tp = E('ctmXaTP')(spec, I, rowsX, n);
      return [I.l, I.u, I.d || 0, xaRank(I), (tp == null ? '—' : fmt(tp, I.d) + (I.u === '%' ? '%' : ' ' + I.u)) + ' — ' + xaTp(spec, I, def), xaMethod(spec, I, def)];
    }));
    let note = ''; try { note = typeof spec.xa.note === 'function' ? spec.xa.note(n.D, n.P, n) : spec.xa.note; } catch (e) { note = ''; }
    if (note) h += '\nGhi chú dưới bảng: _' + String(note).replace(/<[^>]+>/g, '') + '_\n';
    h += '\n';
  }
  /* Danh mục chỉ tiêu */
  h += H(lv + 1, 'Danh mục chỉ tiêu, số liệu và cách tính');
  h += 'Toàn bộ chỉ tiêu khai báo cho đơn vị (kể cả chỉ tiêu chỉ dùng trong thẻ). Cột "Cách có số" ghi: số khai báo từng kỳ, công thức giả lập, công thức tính từ chỉ tiêu khác' + (def.so ? ', hoặc biểu thức đọc số từ cấu hình eform của sở' : '') + '.\n\n';
  const periods = spec.periods;
  h += table(['Khóa', 'Chỉ tiêu', 'Đơn vị · số lẻ', 'Kiểu · chiều', 'Số ' + E('ctmPLabel')(spec, n.p), 'So sánh', 'Cách có số'], Object.keys(spec.metrics).map((k, i) => {
    const m = spec.metrics[k];
    return [code(k), m.l, (m.u || '—') + ' · ' + (m.d || 0), kind(m), vtxt(spec, k, n.D), cmpText(spec, k, n), def.so ? srcSo(def.so, k) : def.make ? srcMake(spec, def.make, k, periods) : def.task ? 'Số nhiệm vụ theo trạng thái (khai báo kỳ mới nhất, các kỳ trước giả lập)' : CUSTOM[id] ? (i === 0 ? CUSTOM[id].src : 'Như dòng đầu bảng') : ''];
  }));
  if (def.so && def.so.an && def.so.an.length) h += '\nĐang **ẩn** (eform không có trường để tính, quy ước 13/10/2026; khai báo vẫn giữ): ' + def.so.an.map(code).join(', ') + '.\n';
  h += '\n';
  if (opt.notes !== false) {
    const notes = sourceNotes(opt.file, id);
    if (notes.length) { h += H(lv + 1, 'Nguồn số và ghi chú trong khai báo'); h += notes.map(quote).join('\n') + '\n'; }
  }
  return h;
}

/* ---------- 5. Phần dùng chung: luồng mở, thành phần popup, quy tắc số ---------- */
const POPUP_CHUNG = `Mọi đơn vị dùng **khuôn chỉ tiêu chung** (js/features/ctm-engine.js). Popup mở trong khung modal chuẩn của IOC (\`#modal\`), có 3 màn:

\`\`\`mermaid
flowchart LR
  A[Màn ngoài: lưới thẻ đơn vị] -->|bấm thẻ / ô số| B[Popup · Tổng quan]
  B -->|bấm thẻ nhóm / ô số| C[Màn nhóm 1..n]
  C -->|‹ trước · sau ›| C
  C -->|← Tổng quan| B
  B -->|Theo 126 xã, phường ›| D[Màn theo 126 xã, phường]
  C -->|tên thẻ có ›| D
  D -->|bấm tên xã| E[Khung hồ sơ xã, phường]
\`\`\`

- **Đường gọi**: thẻ ở lưới màn ngoài gọi \`openCategoryDetail(trục, catId[, màn])\` (js/features/subtasks.js) → \`ctmHandles(catId)\` thấy đơn vị đã khai báo khuôn chung → \`ctmOpenForm(catId, màn, trục)\`. Tham số màn: số (thẻ chỉ tiêu cũ) = Tổng quan; \`'g:<nhóm>'\` = mở thẳng nhóm; \`'xa'\` / \`'xa:<chỉ tiêu>'\` = màn theo xã, phường.
- **Thanh công cụ** (mọi màn): ô chọn **Kỳ báo cáo** (đổi kỳ thì mọi số, mũi tên, biểu đồ tính lại theo kỳ đó), nút **Nhập chỉ tiêu**, nút **Xuất Excel** (sheet "Chỉ tiêu": ô số chính và mọi dòng của các nhóm, cột kỳ này / kỳ trước / so kỳ trước / đơn vị; sheet "Theo xã, phường": 126 dòng, dân số, diện tích và các chỉ tiêu xã).
- **Cuối popup**: khối "Nhiệm vụ đã giao" của lĩnh vực (tổng, hoàn thành, đang xử lý, sắp hạn) và nút "Thêm nhiệm vụ".
- **Đóng**: nút × hoặc phím Esc (đang mở danh sách chọn kỳ thì Esc đóng danh sách, đang mở khung hồ sơ xã thì Esc đóng khung).
- **Tắt khuôn**: cờ \`CTM_ENABLED\` (toàn bộ), \`CTM_OVERVIEW_ENABLED\` (màn ngoài) — tắt thì quay về giao diện cũ, code cũ không xóa.`;

const QUY_TAC = `- **Mũi tên tăng/giảm** (quy tắc H9, H10, H17, H18): màu xanh là tốt, đỏ là xấu, xám là trung tính, theo chiều của chỉ tiêu (tăng là tốt / giảm là tốt / trung tính). Mũi tên luôn ghi mốc: "so cùng kỳ", "so quý trước", "so năm trước". Số phát sinh và lũy kế của đơn vị báo cáo theo quý so **cùng kỳ năm trước**; số tại thời điểm so **kỳ liền trước**; kế hoạch không so; đơn vị chỉ có một kỳ số liệu ghi "Chưa có số cùng kỳ".
- **Mức thay đổi**: số thường ghi %; tỷ lệ ghi chênh lệch **điểm %**, cùng số lẻ với tỷ lệ (tỷ lệ 2 số lẻ → chênh 2 số lẻ). Rê chuột lên mũi tên thấy số hai kỳ.
- **Số lẻ và đơn vị** (H2, H4, H5): mỗi chỉ tiêu một đơn vị, một số lẻ ở mọi màn (ô số, thẻ, biểu đồ, bảng xã, Excel); tỷ lệ 1 số lẻ, riêng các tỷ lệ chênh nhau dưới 1 điểm giữa các xã thì 2 số lẻ.
- **Không lặp số** (H14): thẻ chỉ có một chỉ tiêu thì không vẽ thanh nhắc lại số lớn; tổng đã hiện ở thẻ trước thì thẻ cơ cấu không ghi lại; phần đã có ở thẻ cơ cấu thì thẻ so sánh chỉ giữ số lớn.
- **Biểu đồ đường** (H13): tỷ lệ, chỉ số, số ít thay đổi qua các kỳ vẽ đường, trục dọc chia số tròn, không bắt đầu từ 0 (ghi mức đầu trục dưới biểu đồ); chỉ số có đường nét đứt mốc 100 (js/core/line-chart.js).
- **Bảng 126 xã, phường** (H16, H20): chỉ xếp hạng tỷ lệ, bình quân; số tuyệt đối chỉ sắp "Thứ tự" kèm tỷ trọng; mức Thành phố của tỷ lệ là tổng tử số ÷ tổng mẫu số của 126 nơi (gộp theo trọng số, không lấy trung bình cộng) và khớp ô số Thành phố.`;

const GIA_LAP_CHUNG = `Khi chưa có số do đơn vị cung cấp, số được **giả lập** bằng các hàm trong js/features/ctm-engine.js và js/core/ctm-xa.js, luôn **cố định** (hạt giống ngẫu nhiên theo tên) nên mỗi lần mở ra cùng một số:

1. **Dãy số các kỳ** (\`ctmSeries\`): khai báo số kỳ mới nhất và mức đổi mỗi kỳ \`g\`. Kỳ thứ i lùi về trước = số mới nhất ÷ (1 + g%)^i × (1 ± 1,5% nhiễu). Với tỷ lệ: số mới nhất − g × i điểm ± nhiễu nhỏ, chặn 0–100.
2. **Số khai báo từng kỳ**: chỉ tiêu có số công bố hoặc số đã chốt thì ghi thẳng mảng số từng kỳ (mới nhất trước); ô \`null\` = chưa có số (VD cơ cấu tổ chức trước 01/7/2025).
3. **Chỉ tiêu tính**: \`sum\` (cộng các chỉ tiêu khác) hoặc \`f\` (công thức), tính lại ở mỗi kỳ nên luôn khớp.
4. **Chia về 126 xã, phường** (\`ctmShare\`, \`ctmShareInt\`): số Thành phố (× hệ số phần thuộc cấp xã nếu có) chia theo trọng số (dân số, số hộ, diện tích…) × hệ số ngẫu nhiên cố định 0,7–1,3 × 0,95–1,05 theo kỳ; số nguyên chia theo phần dư lớn nhất nên cộng 126 nơi **đúng bằng** số Thành phố. Tỷ lệ của xã = tỷ lệ Thành phố ± dao động cố định, rồi dịch đều để gộp theo dân số đúng bằng tỷ lệ Thành phố.
5. **Số nền thật**: tên, loại phường/xã, dân số, diện tích 126 đơn vị (js/core/ctm-xa.js, tổng 8.818.383 người, 3.350,16 km²); số hộ = dân số ÷ ${fmt(E('CTM_NGUOI_MOT_HO'), 2)} người/hộ.`;

/* ---------- 6. Tài liệu trục khuôn chung (Thành ủy, HĐND, MTTQ) ---------- */
const ROLE_TEN = { DANG: 'Thành ủy', HDND: 'HĐND Thành phố', UBND: 'UBND Thành phố', MTTQ: 'Ủy ban MTTQ Thành phố' };
/* tên đơn vị theo danh mục lĩnh vực (central-level.js), đơn vị khuôn chung lấy tên hiển thị */
function UNAME(id) {
  if (S[id]) return E('ctmName')(S[id]);
  for (const r of ['DANG', 'HDND', 'UBND', 'MTTQ']) { const c = E('categorySeedForRole')(r).find((x) => x.id === id); if (c) return c.name; }
  return id;
}
const AXES = {
  DANG: { file: 'js/features/ctm-dang.js', out: 'docs/CHUNG/TRUC_THANH_UY_MAN_HINH_CHI_TIEU.md', ten: 'TRỤC THÀNH ỦY', tk: '`danguy` (Thường trực Thành ủy): thấy hàng tab **🌐 Tất cả · 🚩 Thành ủy · HĐND · UBND · MTTQ**; tab "Thành ủy" là màn ngoài của trục này' },
  HDND: { file: 'js/features/ctm-hdnd.js', out: 'docs/CHUNG/TRUC_HDND_MAN_HINH_CHI_TIEU.md', ten: 'TRỤC HĐND THÀNH PHỐ', tk: '`hdnd` (Chủ tịch HĐND Thành phố): chỉ thấy trục HĐND, vào thẳng màn ngoài của trục; `danguy` xem được qua tab "HĐND" hoặc "Tất cả"' },
  MTTQ: { file: 'js/features/ctm-mttq.js', out: 'docs/CHUNG/TRUC_MTTQ_MAN_HINH_CHI_TIEU.md', ten: 'TRỤC ỦY BAN MTTQ VIỆT NAM THÀNH PHỐ', tk: '`mttq` (Chủ tịch Ủy ban MTTQ Thành phố): chỉ thấy trục MTTQ, vào thẳng màn ngoài của trục; `danguy` xem được qua tab "MTTQ" hoặc "Tất cả"' }
};
function overviewDoc(cfg, lv) {
  let h = '';
  h += 'Khai báo: `ctmRegisterOverview({ id: \'' + cfg.id + '\' … })`. Thay lưới thẻ cũ ở khung **"Nhóm chỉ tiêu theo lĩnh vực được phép xem"** của trang chủ IOC.\n\n';
  let title = ''; try { title = typeof cfg.title === 'function' ? cfg.title('N', {}) : cfg.title; } catch (e) { title = ''; }
  h += '- Dòng nhỏ đầu băng: _' + (typeof cfg.eyebrow === 'function' ? cfg.eyebrow({}) : cfg.eyebrow) + '_; tiêu đề: _' + String(title).replace('N', '<số đơn vị>') + '_; câu gợi ý: _' + (typeof cfg.hint === 'function' ? cfg.hint({}) : cfg.hint || 'Mỗi ô ghi rõ đơn vị cung cấp và kỳ số liệu · bấm ô để mở chi tiết') + '_.\n';
  h += '- **Ô số then chốt** (' + (cfg.kpis || []).length + ' ô, mỗi ô ghi đơn vị cung cấp và kỳ, bấm mở thẳng đúng màn của đơn vị đó):\n\n';
  h += table(['#', 'Ô số', 'Đơn vị cung cấp', 'Số', 'Bấm mở'], (cfg.kpis || []).map((k, i) => {
    const spec = S[k.cat];
    if (!spec) {
      /* đơn vị form riêng (Sở Tài chính, TT HCC): ô đọc dòng thứ `line` của thẻ đơn vị ở màn tổng quan UBND */
      const U = E('ubndOvData')(k.cat), x = U && U.lines[k.line || 0];
      return [i + 1, k.l || (x ? x.l : ''), UNAME(k.cat), x ? x.v + (x.u === '%' ? '%' : x.u ? ' ' + x.u : '') + ' · ' + U.ky : '—', 'Popup của đơn vị (form riêng) — dòng ' + ((k.line || 0) + 1) + ' của thẻ đơn vị'];
    }
    const n = nOf(spec);
    return [i + 1, k.l || lab(spec, k.m), E('ctmName')(spec), vtxt(spec, k.m, n.D) + ' · ' + E('ctmPLabel')(spec, n.p), k.target ? (k.target.indexOf('g:') === 0 ? 'Nhóm "' + ((spec.groups.find((g) => g.id === k.target.slice(2)) || {}).label || '') + '"' : 'Màn theo xã, phường') : 'Tổng quan'];
  }));
  if ((cfg.groups || []).length) {
    h += '\n- **Thẻ nhóm** (bấm để lọc lưới đơn vị bên dưới, bấm lần nữa bỏ lọc; nút "Tất cả N đơn vị" bỏ lọc). Mỗi thẻ ghi số đơn vị, tổng số chỉ tiêu và dòng số đầu của tối đa 6 đơn vị:\n\n';
    h += table(['Nhóm', 'Đơn vị trong nhóm'], cfg.groups.map((g) => [g.label, g.ids ? g.ids.map(UNAME).join('; ') : 'Mọi đơn vị của trục ' + ROLE_TEN[g.role] + ': ' + E('categorySeedForRole')(g.role).map((c) => c.name).join('; ')]));
  } else h += '\n- Màn ngoài của trục này **không có thẻ nhóm** (ít đơn vị): dưới hàng ô số là lưới thẻ đơn vị.\n';
  h += '\n- **Lưới thẻ đơn vị**: mỗi thẻ ghi nhãn trục, số chỉ tiêu, tên nhóm, tên đơn vị, các dòng số (mục "Thẻ ở màn ngoài" của từng đơn vị bên dưới) và kỳ ở chân thẻ. Ô tìm "Tìm lĩnh vực…" lọc theo tên.\n\n';
  return h;
}
function axisDoc(role) {
  const A = AXES[role];
  const ids = Object.keys(S).filter((id) => S[id].role === role && (S[id].level || 'city') === 'city');
  const cfg = OVS.find((c) => c.roles.length === 1 && c.roles[0] === role && (c.level || 'city') === 'city');
  let h = '# ' + A.ten + ' — TÀI LIỆU MÀN HÌNH CHỈ TIÊU\n\n';
  h += '- **Phiên bản**: ' + VER + ' · ngày ' + NGAY + ' · sinh từ code bằng `node tools/man_hinh_chi_tieu_md.js` (số, nhãn, cấu trúc đọc thẳng từ cấu hình đang chạy)\n';
  h += '- **Phạm vi**: màn chỉ tiêu cấp Thành phố của trục — màn ngoài và popup chi tiết của ' + ids.length + ' đơn vị. Không gồm màn của tài khoản xã, phường.\n\n';
  h += '## Mục lục\n\n1. Tổng quan trục\n2. Tài khoản và cách mở\n3. Màn ngoài của trục\n' + (role === 'DANG' ? '4. Tab "Tất cả" (4 trục)\n' : '') + '5. Khuôn popup dùng chung\n6. Từng đơn vị\n7. Quy tắc hiển thị số\n8. Cách giả lập số liệu\n9. File code liên quan\n\n';
  h += '## 1. Tổng quan trục\n\n';
  h += table(['#', 'Đơn vị', 'Mã', 'Kỳ', 'Ô số', 'Nhóm', 'Màn xã'], ids.map((id, i) => { const s = S[id]; return [i + 1, E('ctmName')(s), code(id), s.periods.length + ' kỳ (' + s.periods[s.periods.length - 1].label + ' – ' + s.periods[0].label + ')', s.kpis.length, (s.groups || []).length, s.xa ? s.xa.inds.length + ' chỉ tiêu' : '—']; }));
  h += '\n## 2. Tài khoản và cách mở\n\n';
  h += '- ' + A.tk + '.\n- Đăng nhập (mật khẩu demo `123456`) → trang chủ → khung **"Nhóm chỉ tiêu theo lĩnh vực được phép xem"** → hàng tab trục → màn ngoài (mục 3) → bấm thẻ đơn vị hoặc ô số → popup chi tiết (mục 5, 6).\n- Màn ngoài và popup đọc cùng một cấu hình nên cùng số, cùng nhãn (quy tắc H22).\n\n';
  h += '## 3. Màn ngoài của trục\n\n' + (cfg ? overviewDoc(cfg, 3) : '_(chưa khai báo)_\n\n');
  if (role === 'DANG') {
    const all = OVS.find((c) => c.id === 'tu-all');
    h += '## 4. Tab "Tất cả" (4 trục)\n\nChỉ tài khoản `danguy` có tab này (cờ `canSeeAll` trong js/features/indicators.js). Gộp 4 trục cấp Thành phố; số của trục UBND lấy từ màn tổng quan UBND (xem TRUC_UBND_MAN_HINH_CHI_TIEU.md). Khai báo ở js/features/ctm-all.js.\n\n' + overviewDoc(all, 3);
  }
  h += '## 5. Khuôn popup dùng chung\n\n' + POPUP_CHUNG + '\n\n';
  h += '## 6. Từng đơn vị\n\n';
  ids.forEach((id, i) => { h += '### 6.' + (i + 1) + '. ' + E('ctmName')(S[id]) + '\n\n' + unitDoc(id, 3, { file: A.file }); });
  h += '## 7. Quy tắc hiển thị số\n\n' + QUY_TAC + '\n\nChi tiết: docs/CHUNG/QUY_TAC_HIEN_THI_CHI_TIEU_2026_10_12.md.\n\n';
  h += '## 8. Cách giả lập số liệu\n\n' + GIA_LAP_CHUNG + '\n\n';
  h += '## 9. File code liên quan\n\n' + table(['File', 'Vai trò'], [
    [A.file, 'Khai báo các đơn vị của trục và màn ngoài'], ['js/features/ctm-engine.js', 'Khuôn chung: dựng màn, so sánh, giả lập, Excel'], ['js/core/ctm-xa.js', 'Số nền 126 xã, phường; hàm chia số'],
    ['js/core/line-chart.js', 'Biểu đồ đường dùng chung'], ['js/features/indicators.js', 'Khung "Nhóm chỉ tiêu theo lĩnh vực", tab trục, màn ngoài'], ['js/features/subtasks.js', 'openCategoryDetail → mở popup'],
    ['css/ctm.css, css/stc.css, css/sgd.css, css/ubnd-overview.css', 'Giao diện'], ['tests/ctm/ctm.test.js, tests/ctm/ctm-quy-tac.test.js', 'Kiểm thử số và quy tắc hiển thị']].concat(role === 'DANG' ? [['js/features/ctm-all.js', 'Tab "Tất cả"']] : []));
  return h;
}

/* ---------- 7. Tài liệu sở theo eform (khuôn chung) ---------- */
const SO_MAP = {
  'ubnd-vhtt': { cfg: ['js/core/vhtt-config.js', 'js/core/dl-config.js'], dir: 'VHTT_SoVanHoaTheThao', ma: 'VHTT' }, 'ubnd-vpubnd': { cfg: ['js/core/vpub-config.js'], dir: 'VPUB_VanPhongUBND', ma: 'VPUB' },
  'ubnd-bqlkcnc': { cfg: ['js/core/bql-config.js'], dir: 'BQL_BanQuanLyKCNC_KCN', ma: 'BQL' }, 'ubnd-dantoc-tongiao': { cfg: ['js/core/dttg-config.js'], dir: 'DTTG_SoDanTocTonGiao', ma: 'DTTG' },
  'ubnd-thanhtra': { cfg: ['js/core/ttra-config.js'], dir: 'TTRA_ThanhTraThanhPho', ma: 'TTRA' }, 'ubnd-khcn': { cfg: ['js/core/khcn-config.js'], dir: 'KHCN_SoKhoaHocCongNghe', ma: 'KHCN' },
  'ubnd-nnmt': { cfg: ['js/core/nnmt-config.js'], dir: 'NNMT_SoNongNghiepMoiTruong', ma: 'NNMT' }, 'ubnd-congthuong': { cfg: ['js/core/sct-config.js'], dir: 'SCT_SoCongThuong', ma: 'SCT' },
  'ubnd-xaydung': { cfg: ['js/core/sxd-config.js'], dir: 'SXD_SoXayDung', ma: 'SXD' }, 'ubnd-noivu': { cfg: ['js/core/snv-config.js'], dir: 'SNV_SoNoiVu', ma: 'SNV' },
  'ubnd-yte': { cfg: ['js/core/syt-config.js'], dir: 'SYT_SoYTe', ma: 'SYT' }
};
function headerComment(file) { const m = read(file).match(/^\s*\/\*[\s\S]*?\*\//); return m ? cleanComment(m[0]) : ''; }
/* các chú thích từng bước sinh số trong file cấu hình (bỏ khối đầu file đã in riêng, bỏ chú thích quá ngắn) — theo thứ tự trong file */
function fakeComments(file) {
  const seen = {};
  return (read(file).match(/\/\*[\s\S]*?\*\//g) || []).slice(1).map(cleanComment).map((t) => t.replace(/^-{3,}\s*|\s*-{3,}$/g, '').trim())
    .filter((t) => t.length > 30 && !/^Dòng chỉ tiêu cho categorySeed|^Mô tả \d+ chỉ tiêu \(dùng cho tài liệu/.test(t) && !seen[t] && (seen[t] = 1)).slice(0, 40);
}
/* cách các file cấu hình eform sinh số giả lập (chung cho 11 sở) */
const GIA_LAP_SO = `Các file cấu hình eform (js/core/*-config.js) sinh số theo cùng một khuôn, **không gọi API, không ngẫu nhiên theo lần mở**:

1. **Mốc thật**: tổng Thành phố, tỷ lệ, số đầu kỳ được đặt theo số công bố công khai gần nhất (ghi ở chú thích đầu file, mục dưới). Chỗ không có số công bố thì ghi rõ "GIẢ ĐỊNH".
2. **Từng phường, xã** (\`*_UNITS\`, đúng danh mục «Địa bàn» 126 đơn vị của eform): mỗi nơi có một bộ hệ số cố định băm từ tên (\`xxxR(tên, khóa)\` → số 0–1 không đổi) nên lần nào mở cũng ra cùng số; phân biệt phường / xã, nội đô / ngoại thành, vùng đặc thù (khu công nghiệp, miền núi, du lịch…) theo danh sách khai báo trong file. Số đếm chia từ tổng Thành phố theo trọng số và làm tròn theo phần dư lớn nhất (\`*Split\`) nên cộng 126 nơi đúng bằng tổng.
3. **Theo tháng / kỳ**: dãy tháng T1–T9 (hoặc kỳ) sinh theo xu hướng (mùa vụ, tăng dần về cuối năm…) rồi cộng dồn; số "cùng kỳ" (nếu có) khai báo riêng.
4. **Số tổng hợp** (\`*_SUM\`): cộng từ 126 phường, xã hoặc từ danh sách bản ghi (vụ việc, dự án…) nên các thẻ, bảng, màn xã luôn khớp nhau.
5. **Dân số** mẫu số của tỷ lệ theo dân số: đúng dân số thật (js/core/xa-dan-so.js) với Sở Y tế, Sở KH&CN, Sở Nội vụ.`;
function soDoc(id) {
  const M = SO_MAP[id], spec = S[id];
  const name = E('ctmName')(spec);
  const cat = E('categorySeed').UBND.find((c) => c.id === id) || {};
  let h = '# ' + (cat.name || name).toUpperCase() + ' — TÀI LIỆU MÀN HÌNH CHỈ TIÊU\n\n';
  h += '- **Phiên bản**: ' + VER + ' · ngày ' + NGAY + ' · sinh từ code bằng `node tools/man_hinh_chi_tieu_md.js` (số, nhãn, cấu trúc đọc thẳng từ cấu hình đang chạy)\n';
  h += '- **Phạm vi**: màn chỉ tiêu cấp Thành phố của ' + (cat.name || name) + ' (trục UBND). Số liệu theo eform của sở; định nghĩa trường eform, cách tính từng chỉ tiêu cho Sở xem ở tài liệu mô tả chỉ tiêu ' + M.ma + '_MO_TA_CHI_TIEU.md cùng thư mục.\n';
  if (id === 'ubnd-vhtt') h += '- **Sắp xếp 2026**: Sở Du lịch đã nhập vào sở này (cờ `UBND_SAP_XEP_SO_2026`); 2 chỉ tiêu du lịch (khách, doanh thu) là 2 nhóm cuối. Khai báo Sở Du lịch cũ (`ubnd-dulich`) vẫn giữ trong code nhưng không hiện.\n';
  h += '\n## Mục lục\n\n1. Tổng quan\n2. Tài khoản và cách mở\n3. Khuôn popup\n4. Chi tiết các màn\n5. Quy tắc hiển thị số\n6. Nguồn số liệu và cách giả lập\n7. File code liên quan\n\n';
  h += '## 1. Tổng quan\n\n';
  h += 'Mô tả trong danh mục lĩnh vực: _' + (cat.desc || '') + '_\n\n';
  h += '## 2. Tài khoản và cách mở\n\n' + table(['Tài khoản', 'Vào màn nào', 'Mở popup'], [
    ['`ubnd` (Chủ tịch UBND TP)', 'Màn tổng quan UBND: 8 ô số then chốt, 4 thẻ nhóm lĩnh vực, lưới thẻ sở (xem TRUC_UBND_MAN_HINH_CHI_TIEU.md)', 'Bấm thẻ sở hoặc ô số của sở → popup Tổng quan'],
    ['`danguy` (Thường trực Thành ủy)', 'Tab "UBND" (như trên) hoặc tab "Tất cả" (thẻ sở nằm trong nhóm "UBND Thành phố")', 'Như trên'],
    ['`so-' + id + '` (tài khoản riêng của sở)', 'Băng **"Tổng quan · ' + name + '"** rộng cả hàng: đủ ô số chính, thẻ nhóm, thẻ xã/phường (`ctmBandHtml`)', 'Bấm ô số / thẻ nhóm mở thẳng đúng màn; "Xem tổng quan đầy đủ ›" mở màn Tổng quan']
  ]);
  h += '\n## 3. Khuôn popup\n\n' + POPUP_CHUNG + '\n\n';
  h += '## 4. Chi tiết các màn\n\n' + unitDoc(id, 2, { notes: false });
  h += '## 5. Quy tắc hiển thị số\n\n' + QUY_TAC + '\n\nQuy ước xử lý dữ liệu eform (khóa bản ghi, lấy theo kỳ, chỉ hiện số có trường trong eform): docs/CHUNG/QUY_UOC_XU_LY_EFORM_2026_10_13.md.\n\n';
  h += '## 6. Nguồn số liệu và cách giả lập\n\n';
  h += 'Mọi số trên màn đọc từ cấu hình eform của sở (' + M.cfg.join(', ') + ': các biến `*_SUM`, `*_DATA`, `*_UNITS`), cùng số với tài liệu mô tả chỉ tiêu đã gửi Sở. File js/features/ctm-so.js chỉ đổi cách trình bày sang khuôn chung (cột "Cách có số" ở mục 4 ghi đúng biểu thức đọc số). **Toàn bộ là số giả lập** chờ nối eform thật; khi có dữ liệu eform, chỉ thay phần sinh số trong file cấu hình, giữ nguyên tên biến.\n\n' + GIA_LAP_SO + '\n\n';
  M.cfg.forEach((f) => {
    h += '### ' + f + '\n\n' + quote(headerComment(f)) + '\n';
    const fk = fakeComments(f);
    if (fk.length) h += 'Các bước sinh số giả lập trong file (chú thích theo thứ tự trong code):\n\n' + fk.map((t) => '- ' + t.replace(/\n\s*/g, ' ')).join('\n') + '\n\n';
  });
  const notes = sourceNotes('js/features/ctm-so.js', id);
  if (notes.length) h += '### Ghi chú trong khai báo màn (js/features/ctm-so.js)\n\n' + notes.map(quote).join('\n') + '\n';
  if (['ubnd-yte', 'ubnd-khcn', 'ubnd-noivu'].indexOf(id) >= 0) h += '**Dân số từng phường, xã** (mẫu số các tỷ lệ theo dân số) lấy đúng dân số thật ở js/core/xa-dan-so.js (tổng 8.818.383 người) để mẫu số khớp cột "Dân số" của bảng 126 xã (sửa 20/10/2026).\n\n';
  h += '## 7. File code liên quan\n\n' + table(['File', 'Vai trò'], M.cfg.map((f) => [f, 'Cấu hình eform, số giả lập, số theo 126 xã (*_UNITS)']).concat([
    ['js/features/ctm-so.js', 'Khai báo màn (ô số, nhóm, thẻ, màn xã) của 12 sở eform'], ['js/features/ctm-engine.js', 'Khuôn chung dựng màn'], ['js/features/ubnd-overview.js', 'Màn tổng quan UBND (thẻ sở)'],
    ['tests/ctm/ctm.test.js, tests/ctm/ctm-quy-tac.test.js, tests/' + M.ma.toLowerCase() + '/', 'Kiểm thử'], ['docs/' + M.dir + '/' + M.ma + '_MO_TA_CHI_TIEU.md', 'Tài liệu mô tả chỉ tiêu theo eform (gửi Sở)']]));
  return h;
}

/* ---------- 8. Form riêng: Sở Tài chính, Sở GD&ĐT, TT Phục vụ HCC — dựng thật từng màn rồi đọc ra ô số, thẻ ---------- */
const strip = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + ' …' : s);
function divText(b, cls) { const m = b.match(new RegExp('<div class="' + cls + '"[^>]*>([\\s\\S]*?)</div>')); return m ? strip(m[1]) : ''; }
/* ô số: nhãn · số · dòng phụ · mũi tên */
function kpisOf(h) {
  return [...h.matchAll(/<button type="button" class="stc-kpi[^"]*"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => {
    const b = m[1], after = b.split(/<div class="stc-u"[^>]*>[\s\S]*?<\/div>/)[1] || '';
    return [divText(b, 'stc-lb'), divText(b, 'stc-v'), divText(b, 'stc-u'), strip(after)];
  });
}
/* thẻ nhóm ở màn trang chủ: tiêu đề + các dòng */
function gcardsOf(h) {
  return [...h.matchAll(/<button type="button" class="stc-gcard[^"]*"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => {
    const t = (m[1].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '';
    const rows = [...m[1].matchAll(/<div class="stc-gl[^"]*">([\s\S]*?)<\/div>/g)].map((r) => strip(r[1])).filter(Boolean);
    return [strip(t), rows.join('; ')];
  });
}
/* thẻ ở một màn: tiêu đề, phụ đề, kiểu (đoán theo lớp CSS), tóm tắt chữ nhìn thấy */
function cardsOf(h) {
  const parts = h.split(/<div (?:id="[^"]*" )?class="stc-card(?=[" ])/).slice(1);
  /* bỏ phần còn lại của thẻ mở <div class="stc-card …"> (lớp phụ, thuộc tính) trước dấu > đầu tiên */
  return parts.map((p) => {
    p = p.slice(p.indexOf('>') + 1);
    const t = strip((p.match(/class="stc-ct">([\s\S]*?)<\/h3>/) || p.match(/class="sgd-ctl"[^>]*>([\s\S]*?)<\/button>/) || [])[1] || '');
    const s = strip((p.match(/class="stc-cs">([\s\S]*?)<\/div>/) || [])[1] || '');
    const k = [];
    if (/stc-oc-|stc-tree/.test(p)) k.push('sơ đồ cây chỉ tiêu');
    if (/stc-wf/.test(p)) k.push('cầu nối tăng giảm (thác nước)');
    if (/class="lc[ "]/.test(p)) k.push('biểu đồ đường');
    if (/sgd-cc/.test(p)) k.push('biểu đồ cột');
    if (/stc-cmp/.test(p)) k.push('thanh ngang kỳ này / kỳ so sánh');
    if (/stc-donut|<circle[^>]*stroke-dasharray/.test(p)) k.push('vành khuyên');
    if (/stc-stack/.test(p)) k.push('thanh xếp chồng');
    if (/stc-pg|sgd-rt/.test(p)) k.push('thanh tỷ lệ');
    if (/stc-tbl|stc-rawrow|sgd-xt-row/.test(p)) k.push('bảng');
    if (/stc-axis/.test(p)) k.push('thanh lệch quanh mốc');
    const body = strip(p).replace(t, '').replace(s, '').trim();
    return [t, s, k.join(', ') || 'số, chữ', cut(body, 320)];
  }).filter((x) => x[0] || x[3]);
}
function tree(nodes, depth, out) {
  (nodes || []).forEach((n) => {
    out.push('  '.repeat(depth) + '- ' + n.label + (n.unit ? ' (' + n.unit + ')' : '') + (n.kind === 'rate' || n.kind === 'pct' ? ' — tỷ lệ' : n.kind === 'idx' ? ' — chỉ số (mốc 100)' : '') + (n.inv ? ' — giảm là tốt' : n.neutral ? ' — trung tính' : ''));
    tree(n.kids, depth + 1, out);
  });
  return out;
}
const OWN = {
  stc: {
    id: 'ubnd-taichinh', dir: 'STC_SoTaiChinh', ma: 'STC', ten: 'SỞ TÀI CHÍNH', UI: 'STC_UI', groups: 'STC_GROUPS', inds: 'STC_INDICATORS', xa: null,
    files: [['js/core/stc-config.js', 'Danh mục chỉ tiêu, nhóm, cách đọc dòng API, giả định, cờ'], ['js/data/stc-snapshot.js', 'Bản chụp số liệu thật từ 14 API (sinh bằng stc-tool.js)'], ['js/features/stc-demo-data.js', 'Dữ liệu mẫu tự đặt (mặc định đang bật)'], ['js/features/stc-data.js', 'Lớp dữ liệu: đọc bản chụp, dựng cây chỉ tiêu, tính tổng, % tăng, tỷ trọng'], ['js/features/dashboard-stc.js', 'Giao diện popup, băng tổng quan, Excel'], ['tests/stc/', 'Kiểm thử'], ['docs/STC_SoTaiChinh/STC_DAC_TA.md, STC_HUONG_DAN.md', 'Đặc tả, hướng dẫn nạp kỳ']],
    open: '`openCategoryDetail` → `catId === \'ubnd-taichinh\'` và cờ `TC_SHOW_LEGACY = false` → `stcOpenForm(màn, trục)`',
    dataFiles: ['js/core/stc-config.js', 'js/features/stc-data.js', 'js/features/stc-demo-data.js']
  },
  sgd: {
    id: 'ubnd-gddt', dir: 'SGD_SoGiaoDuc', ma: 'SGD', ten: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO', UI: 'SGD_UI', groups: 'SGD_GROUPS', inds: 'SGD_TREE', xa: 'SGD_XA_INDS',
    files: [['js/core/sgd-config.js', 'Nhóm, giả định, mốc số Thành phố (SGD_TARGETS), cờ'], ['js/features/sgd-data.js', 'Sinh số giả lập theo 126 phường/xã và từng trường; cây chỉ tiêu SGD_TREE'], ['js/features/dashboard-sgd.js', 'Giao diện popup, màn 126 phường/xã, khung hồ sơ, Excel'], ['js/features/dashboard-education.js', 'gdUnitData — quy mô trường học 126 phường/xã (file "SỐ LIỆU TRƯỜNG HỌC" 07/2026), làm trọng số chia'], ['tests/sgd/', 'Kiểm thử'], ['docs/SGD_SoGiaoDuc/SGD_MO_TA_CHI_TIEU.md, SGD_DAC_TA_KY_THUAT.md', 'Mô tả chỉ tiêu, đặc tả kỹ thuật']],
    open: '`openCategoryDetail` → `catId === \'ubnd-gddt\'`, cấp Thành phố, cờ `SGD_SHOW_LEGACY = false` → `sgdOpenForm(màn, trục)`',
    dataFiles: ['js/core/sgd-config.js', 'js/features/sgd-data.js']
  },
  hcc: {
    id: 'ubnd-hcc', dir: 'HCC_TrungTamHCC', ma: 'HCC', ten: 'TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG THÀNH PHỐ', UI: 'HCC_UI', groups: 'HCC_GROUPS', inds: 'HCC_TREE', xa: 'HCC_XA_INDS',
    files: [['js/core/hcc-config.js', 'Kỳ, nhóm, giả định, mốc số (HCC_TARGETS), 15 sở có hồ sơ (HCC_SO), 14 lĩnh vực'], ['js/features/hcc-data.js', 'Sinh số giả lập theo đơn vị (15 sở + 126 phường/xã) và lĩnh vực; cây HCC_TREE'], ['js/features/dashboard-hcc.js', 'Giao diện popup, màn Theo đơn vị, khung hồ sơ, danh sách trễ hạn, Excel'], ['tests/hcc/', 'Kiểm thử'], ['docs/HCC_TrungTamHCC/HCC_MO_TA_CHI_TIEU.md, HCC_HUONG_DAN.md', 'Mô tả chỉ tiêu, hướng dẫn']],
    open: '`openCategoryDetail` → `catId === \'ubnd-hcc\'` (cờ `HCC_ENABLED`) → `hccOpenForm(màn, trục)`',
    dataFiles: ['js/core/hcc-config.js', 'js/features/hcc-data.js']
  }
};
/* mục "Cách so sánh" của 3 form riêng — cùng ý với tài liệu mô tả / đặc tả của đơn vị và code mũi tên (stcDlOne, hccDl, sgdDl) */
function cmpOwn(p) {
  const tinh = (rows) => table(['Kiểu chỉ tiêu', 'Mức thay đổi', 'Ghi trên màn'], rows);
  const mau = (giam, trung) => '- **Màu**: chỉ tiêu tăng là tốt thì tăng tô xanh, giảm tô đỏ; ' + (giam ? 'chỉ tiêu giảm là tốt (' + giam + ') thì ngược lại; ' : '') + 'chỉ tiêu trung tính (' + trung + ') tô xám. Mức đổi làm tròn bằng 0 ghi "Không đổi".\n';
  if (p === 'stc') {
    const P = E('stcPeriods')(), d = E('stcDefaultPeriod')(), q = (x) => 'Q' + x.period + '/' + x.year;
    const pq = d && E('stcPrevQ')(d.year, d.period), coPq = pq && P.some((x) => x.year === pq.year && x.period === pq.period);
    let h = 'Màn có **hai cách so**, ghi thành hai cột **"So kỳ trước"** và **"So cùng kỳ"** ở ô số chính, các dòng của thẻ nhóm ở Trang chủ và các bảng thành phần; ở số lớn đầu thẻ biểu đồ và màn Chi tiết, mức đổi ghi liền sau số kèm chữ "so kỳ trước" / "so cùng kỳ".\n\n';
    h += table(['Cách so', 'Mốc so sánh', 'Số của mốc lấy từ đâu'], [
      ['So kỳ trước', '**Quý liền trước** (Q2/2026 so Q1/2026; Q1/2026 so Q4/2025)', 'Số "kỳ này" trong bản chụp của quý liền trước. API không có cột này; chưa nạp bản chụp quý đó thì để trống'],
      ['So cùng kỳ', '**Cùng quý năm trước** (Q1/2026 so Q1/2025)', 'Lần lượt: dòng "Kỳ trước" của API (thực chất mang quý cùng kỳ năm trước); bản chụp cùng quý năm trước; suy ra từ chỉ số so cùng kỳ của API (giả định chỉ số lấy 100 làm mốc)']]);
    h += '\n**Cách tính mức thay đổi**:\n\n' + tinh([
      ['Số đếm, số tiền (cộng được)', 'So kỳ trước: (kỳ này ÷ quý trước − 1) × 100. So cùng kỳ: (kỳ này ÷ cùng kỳ − 1) × 100, hoặc chỉ số so cùng kỳ − 100', '%'],
      ['Tỷ lệ % (tiến độ dự án trọng điểm)', 'Kỳ này − kỳ so sánh', 'điểm %'],
      ['Chỉ số lấy cùng kỳ năm trước = 100 (IIP, CPI, giá vàng, giá đô la Mỹ)', 'So kỳ trước: chỉ số kỳ này − chỉ số quý trước. So cùng kỳ: chỉ số − 100', 'So kỳ trước: điểm; so cùng kỳ: %']]);
    h += '\n' + mau(null, 'chi ngân sách địa phương, nhập khẩu, chỉ số giá');
    h += '- **Ô "—"**: không tính được thì hiện "—"; rê chuột vào thấy lý do ("Chưa có số liệu của quý liền trước nên chưa so được" / "Nguồn số liệu chưa có số cùng kỳ năm trước cho mục này").\n';
    h += '- **Rê chuột lên mức đổi**: thấy mốc (quý nào), phép tính với số hai kỳ, ý nghĩa màu.\n';
    /* quý nào trong danh sách có số của quý liền trước thì mới so kỳ trước được */
    const soDuoc = P.filter((x) => { const y = E('stcPrevQ')(x.year, x.period); return P.some((z) => z.year === y.year && z.period === y.period); });
    if (d) h += '- **Kỳ mặc định ' + q(d) + '**: các quý có số liệu là ' + P.map(q).join(', ') + '. ' + (coPq ? 'Quý liền trước ' + q(pq) + ' có số nên cột "So kỳ trước" tính được.' : 'Chưa có số của quý liền trước (' + q(pq) + ') nên cột **"So kỳ trước" hiện "—" ở mọi chỉ tiêu**' + (soDuoc.length ? '; chọn ' + soDuoc.map((x) => q(x) + ' (so ' + q(E('stcPrevQ')(x.year, x.period)) + ')').join(', ') + ' thì cột này có số.' : '; nạp thêm số của quý liền trước thì cột này mới có số.')) + '\n';
    return h + '\nCông thức chi tiết: docs/STC_SoTaiChinh/STC_DAC_TA.md, mục 5 "Quy tắc tính toán".\n\n';
  }
  const hcc = p === 'hcc', P = hcc ? E('HCC_PERIODS') : E('SGD_YEARS');
  const moc = hcc ? '**quý liền trước** (Quý 2/2026 so Quý 1/2026)' : '**năm học liền trước** (2025–2026 so 2024–2025)';
  const chu = hcc ? 'so kỳ trước' : 'so năm trước';
  let h = 'Màn có **một cách so**: so với ' + moc + '. Kỳ chọn được: ' + (hcc ? P.map((x) => 'Quý ' + x.q + '/' + x.y).join(', ') : P.map((y) => y + '–' + (y + 1)).join(', ')) + '; chọn kỳ sớm nhất thì không có mốc nên không hiện mũi tên' + (hcc ? '' : ' (ô đầu màn theo phường, xã ghi "Chưa có năm học so sánh")') + '.\n\n';
  h += '- **Ở đâu**: ô số chính, các dòng thẻ nhóm, số lớn đầu thẻ biểu đồ (kèm chữ "' + chu + '" và số của mốc trong ngoặc), cột "' + (hcc ? 'So kỳ trước' : 'So năm trước') + '" trong các bảng, bảng Số liệu thành phần, cầu nối tăng giảm' + (hcc ? '' : ', vạch mốc năm trước trên thanh tỷ lệ (phòng học kiên cố, cận thị)') + '.\n\n';
  const nay = hcc ? 'kỳ này' : 'năm nay', truoc = hcc ? 'kỳ trước' : 'năm trước';
  h += '**Cách tính mức thay đổi**:\n\n' + tinh([
    ['Số đếm (' + (hcc ? 'hồ sơ, lượt đánh giá, tài khoản, thủ tục' : 'trường, học sinh, giáo viên, phòng học') + ')', '(' + nay + ' ÷ ' + truoc + ' − 1) × 100', '%'],
    ['Tỷ lệ (' + (hcc ? 'nộp trực tuyến, đúng hạn, số hóa, thanh toán trực tuyến, hài lòng' : 'cận thị, phòng học kiên cố') + '…)', 'Tỷ lệ ' + nay + ' − tỷ lệ ' + truoc, 'điểm % (ví dụ ' + (hcc ? '92,1% lên 92,9%' : '24,1% lên 24,9%') + ' là tăng 0,8 điểm %, không phải 0,8%)']]
    .concat(hcc ? [] : [['Sĩ số bình quân, học sinh / giáo viên', 'Số năm nay − số năm trước', 'số thường, không ghi đơn vị']]));
  h += '\n' + mau(hcc ? 'hồ sơ trễ hạn, tồn, không hài lòng' : 'tỷ lệ cận thị, phòng học tạm', hcc ? 'hồ sơ tiếp nhận mới…' : 'trường ngoài công lập, học sinh diện chính sách, sĩ số bình quân, học sinh / giáo viên');
  h += '- **Thiếu số của mốc**: không hiện mũi tên (để trống).\n- **Rê chuột lên mũi tên**: thấy cách tính, số ' + (hcc ? 'kỳ trước' : 'năm trước') + ' và ' + (hcc ? 'kỳ này' : 'năm nay') + ', ý nghĩa màu.\n';
  h += '- **Màn theo ' + (hcc ? 'đơn vị' : '126 phường, xã') + '**: mỗi dòng có cột "' + (hcc ? 'So kỳ trước' : 'So năm trước') + '" của đơn vị đó và một cột so với Thành phố: chỉ tiêu số đếm ghi **"Tỷ trọng TP"** (phần của đơn vị trong tổng Thành phố), chỉ tiêu tỷ lệ ghi **"So với TP"** (cao hơn / thấp hơn mức Thành phố, tỷ lệ tính bằng điểm %).\n';
  return h + '\nCông thức chi tiết: ' + (hcc ? 'docs/HCC_TrungTamHCC/HCC_MO_TA_CHI_TIEU.md' : 'docs/SGD_SoGiaoDuc/SGD_MO_TA_CHI_TIEU.md, SGD_DAC_TA_KY_THUAT.md') + '.\n\n';
}
function screenOf(p, screen, extra) { try { return run(OWN[p].UI + '.open=true;' + OWN[p].UI + '.screen=' + JSON.stringify(screen) + ';' + (extra || '') + p + 'ScreenHtml()'); } catch (e) { return ''; } }
function metaOf(p) { try { return run(p + 'ScreenMeta()'); } catch (e) { return {}; } }
function ownDoc(p) {
  const O = OWN[p], cat = E('categorySeed').UBND.find((c) => c.id === O.id) || {};
  const G = E(O.groups), T = E(O.inds), X = O.xa ? E(O.xa) : null;
  let h = '# ' + O.ten + ' — TÀI LIỆU MÀN HÌNH CHỈ TIÊU\n\n';
  h += '- **Phiên bản**: ' + VER + ' · ngày ' + NGAY + ' · sinh từ code bằng `node tools/man_hinh_chi_tieu_md.js` (dựng thật từng màn trong môi trường node rồi đọc ô số, thẻ; cây chỉ tiêu, giả định đọc từ cấu hình)\n';
  h += '- **Phạm vi**: màn chỉ tiêu cấp Thành phố của ' + cat.name + ' (trục UBND). Đơn vị này dùng **form riêng** (không dùng khuôn chung của các sở eform), cùng bộ giao diện với Sở Tài chính / Sở GD&ĐT / TT Phục vụ HCC.\n\n';
  /* số mục sau mục 5 đổi theo việc có màn theo đơn vị hay không (Sở Tài chính không có) */
  const nX = 6, nCmp = X ? 7 : 6, nSrc = nCmp + 1, nFile = nCmp + 2;
  h += '## Mục lục\n\n1. Tổng quan\n2. Tài khoản và cách mở\n3. Màn Trang chủ\n4. Các màn nhóm\n5. Màn Chi tiết theo cấp bậc\n' + (X ? nX + '. Màn theo đơn vị / phường, xã\n' : '') + nCmp + '. Cách so sánh\n' + nSrc + '. Nguồn số liệu, giả định và cách giả lập\n' + nFile + '. File code liên quan\n\n';
  h += '## 1. Tổng quan\n\nMô tả trong danh mục lĩnh vực: _' + (cat.desc || '') + '_\n\n';
  /* trang chủ — Sở Tài chính chọn kỳ khi mở popup: đặt kỳ mặc định như stcOpenForm (kỳ gần nhất có bản chụp) */
  run(O.UI + '.open=true;');
  if (p === 'stc') run('(function(){var d=stcDefaultPeriod();if(d){STC_UI.year=d.year;STC_UI.period=d.period;}})()');
  const home = screenOf(p, 'home'), mh = metaOf(p);
  h += table(['Mục', 'Nội dung'], [['Mã lĩnh vực (catId)', code(O.id)], ['Tiêu đề popup', (mh.title || '') + ' — phụ đề: ' + (mh.sub || '')], ['Số nhóm', G.length + ': ' + G.map((g) => g.label).join('; ')], ['Số chỉ tiêu gốc (cây)', T.length], ['Màn theo đơn vị', X ? X.length + ' chỉ tiêu' : 'Không có']]);
  h += '\n## 2. Tài khoản và cách mở\n\n' + table(['Tài khoản', 'Vào màn nào', 'Mở popup'], [
    ['`ubnd` (Chủ tịch UBND TP)', 'Màn tổng quan UBND: thẻ đơn vị trong lưới, ô số then chốt (xem TRUC_UBND_MAN_HINH_CHI_TIEU.md)', 'Bấm thẻ hoặc ô số → popup Trang chủ'],
    ['`danguy` (Thường trực Thành ủy)', 'Tab "UBND" hoặc tab "Tất cả"', 'Như trên'],
    ['`so-' + O.id + '` (tài khoản riêng)', 'Băng **Tổng quan** rộng cả hàng ở khung "Nhóm chỉ tiêu theo lĩnh vực" (`' + p + 'OverviewBandHtml`): đủ ô số và thẻ nhóm, bấm mở thẳng đúng màn', 'Bấm ô số / thẻ nhóm']]);
  h += '\nĐường gọi: ' + O.open + '. Popup dùng khung modal chuẩn của IOC; thanh công cụ có chọn kỳ (năm/quý/năm học), **Nhập chỉ tiêu**, **Xuất Excel**; cuối popup là khối "Nhiệm vụ đã giao". Đóng bằng nút × hoặc Esc.\n\n';
  h += '```mermaid\nflowchart LR\n  A[Thẻ / ô số ở màn ngoài] --> B[Trang chủ]\n  B -->|thẻ nhóm, ô số| C[Màn nhóm]\n  C -->|Chi tiết ›| D[Chi tiết theo cấp bậc]\n  B -->|Xem chi tiết theo cấp bậc ›| D\n  D -->|‹ Trước · Sau ›| D\n' + (X ? '  B -->|' + (p === 'hcc' ? 'Theo đơn vị' : 'Theo 126 phường/xã') + ' ›| E[Màn theo ' + (p === 'hcc' ? 'đơn vị' : '126 phường, xã') + ']\n  E -->|bấm tên| F[Khung hồ sơ đơn vị]\n' : '') + '```\n\n';
  h += '## 3. Màn Trang chủ\n\n**Ô số chính** (bấm ô mở đúng nhóm):\n\n' + table(['#', 'Ô số', 'Số', 'Dòng phụ', 'So sánh'], kpisOf(home).map((k, i) => [i + 1].concat(k)));
  h += '\n**Thẻ nhóm** (mỗi nhóm một màn; dòng "Xem nhóm … ›" ở đáy thẻ):\n\n' + table(['Thẻ', 'Các dòng trên thẻ'], gcardsOf(home));
  const note = (home.match(/<b>Cách đọc:<\/b>([\s\S]*?)<\/div>/) || [])[1];
  if (note) h += '\nKhung **Cách đọc**: ' + strip(note) + '\n';
  /* màn nhóm */
  h += '\n## 4. Các màn nhóm\n\nMỗi nhóm một màn: nút "← Tổng quan", dòng mô tả nhóm, các thẻ biểu đồ (tên thẻ có "Chi tiết ›" mở màn Chi tiết theo cấp bậc của chỉ tiêu đó), liên kết nhóm trước / sau.\n\n';
  G.forEach((g, i) => {
    const gh = screenOf(p, 'group', O.UI + '.group=' + JSON.stringify(g.id) + ';');
    h += '### 4.' + (i + 1) + '. ' + g.label + '\n\n' + (g.note ? 'Dòng mô tả: _' + g.note + '_\n\n' : '');
    h += table(['Thẻ', 'Phụ đề', 'Kiểu', 'Nội dung nhìn thấy (kỳ mặc định)'], cardsOf(gh)) + '\n';
  });
  /* chi tiết */
  h += '## 5. Màn Chi tiết theo cấp bậc\n\nMở từ "Chi tiết ›" ở thẻ, từ "Xem chi tiết theo cấp bậc ›" ở Trang chủ. Mỗi chỉ tiêu gốc một màn, nút ‹ Trước / Sau › chuyển qua ' + T.length + ' chỉ tiêu. Bố cục (lấy ví dụ chỉ tiêu đầu tiên):\n\n';
  const first = T[0];
  const dh = screenOf(p, 'detail', p === 'stc' ? 'STC_UI.ind=' + JSON.stringify(first.id) + ';' : O.UI + '.tree=' + JSON.stringify(first.id) + ';');
  h += table(['Thẻ', 'Phụ đề', 'Kiểu', 'Nội dung nhìn thấy'], cardsOf(dh));
  h += '\n- **Sơ đồ cây**: thẻ số của chỉ tiêu gốc, nối xuống các thẻ con (mỗi thẻ: số, tỷ trọng trong cha, mức đổi). Bấm một thẻ để chọn, chỉ tiêu 3 cấp mọc thêm hàng thẻ ngay dưới thẻ cha.\n- **Cầu nối tăng giảm**: cột kỳ trước → phần tăng (giảm) của từng thành phần → cột kỳ này; các bậc cộng lại đúng mức thay đổi chung (chỉ vẽ với chỉ tiêu cộng dồn được).\n- **Xu hướng**: biểu đồ đường các kỳ (js/core/line-chart.js), điểm đậm là kỳ đang xem, kỳ chưa có số để trống, không nội suy.\n- **Số liệu thành phần**: bảng thành phần kỳ này / kỳ trước / so kỳ trước. Khối "Cách tính" **ẩn** trên giao diện (cờ `SHOW_FORMULA_BOX`), cách tính để trong tài liệu mô tả.\n\n';
  h += '**Cây chỉ tiêu** (' + T.length + ' chỉ tiêu gốc):\n\n' + tree(T, 0, []).join('\n') + '\n\n';
  /* màn xã / đơn vị */
  if (X) {
    const xh = screenOf(p, 'xa');
    h += '## ' + nX + '. Màn theo ' + (p === 'hcc' ? 'đơn vị (' + (E('HCC_SO').length + 126) + ' đơn vị: ' + E('HCC_SO').length + ' sở, ngành và 126 phường, xã)' : '126 phường, xã') + '\n\n';
    h += 'Cột trái: danh sách chỉ tiêu; bên phải: các ô mức chung Thành phố, cao nhất, thấp nhất, số đơn vị kém hơn mức Thành phố; bộ lọc ' + (p === 'hcc' ? '(sở, ngành / phường / xã)' : '(phường / xã)') + ', ô tìm, bảng xếp hạng (cột hạng, tên, số, so mức Thành phố). Bấm tên mở **khung hồ sơ** trượt từ phải: mọi chỉ tiêu của đơn vị kèm hạng' + (p === 'hcc' ? ', danh sách hồ sơ trễ hạn / đang xử lý trễ hạn, thủ tục chưa trực tuyến toàn trình (mẫu)' : ', danh sách trường của phường, xã (tên mẫu)') + '.\n\n';
    h += 'Ô ở đầu màn (chỉ tiêu đầu tiên): ' + [...xh.matchAll(/<div class="stc-mchip">([\s\S]*?)<\/div><\/div>/g)].map((m) => strip(m[1])).slice(0, 4).join(' · ') + '\n\n';
    h += table(['Chỉ tiêu', 'Đơn vị', 'Kiểu', 'Chiều'], X.map((I) => [I.label || I.l, I.unit || (I.pct ? '%' : I.u || ''), I.type === 'count' ? 'Số đếm — cột "Tỷ trọng"' : I.type === 'ratio' ? 'Tỷ lệ / bình quân — xếp hạng' : (I.type || ''), I.better === 'none' ? 'trung tính' : I.better === 'low' || I.inv ? 'thấp là tốt' : 'cao là tốt']));
    if (p === 'hcc') h += '\nNgưỡng xếp hạng: đơn vị có mẫu số dưới ngưỡng (`HCC_XA_MIN_DEN` = ' + E('HCC_XA_MIN_DEN') + ' hồ sơ; riêng tỷ lệ không hài lòng 50, chỉ tiêu thủ tục 0) vẫn hiện số nhưng không xếp hạng, nằm cuối bảng.\n';
    h += '\n';
  }
  h += '## ' + nCmp + '. Cách so sánh\n\n' + cmpOwn(p);
  /* nguồn, giả định */
  h += '## ' + nSrc + '. Nguồn số liệu, giả định và cách giả lập\n\n';
  if (p === 'hcc') h += '**Lưu ý nguồn**: API "hcc_tkpro" ghi trong chú thích code đã **dừng từ 01/10/2026**; nguồn thay thế là API dịch vụ công Hà Nội (dichvucong.hanoi.gov.vn, trả theo từng hồ sơ, theo mã đơn vị H26.x, dữ liệu từ 07/2025) — tài liệu nguồn ở thư mục HCC_NEW/ (đặc tả, Mã định danh 632 đơn vị). Màn vẫn dùng **số giả lập** của hcc-data.js cho đến khi nối nguồn mới; danh sách 15 sở có hồ sơ (HCC_SO) đã theo Mã định danh, số của sở = mã sở cộng các đơn vị trực thuộc.\n\n';
  O.dataFiles.forEach((f) => { h += '### ' + f + '\n\n' + quote(headerComment(f)) + '\n'; });
  if (p === 'stc') {
    const A = E('STC_ASSUME');
    h += '**Chế độ số liệu**: cờ `STC_DEMO_DEFAULT = ' + E('STC_DEMO_DEFAULT') + '` — mở popup là **dữ liệu mẫu tự đặt** (js/features/stc-demo-data.js, phụ đề "DỮ LIỆU MẪU"); nút "Tắt dữ liệu mẫu" chuyển sang **số thật** trong bản chụp 14 API (js/data/stc-snapshot.js). Bản chụp thật hiện hầu hết bằng 0 (chỉ API dự án trọng điểm có số) nên các ô hiện "—" và báo "Chưa có số liệu từ Sở Tài chính".\n\n';
    h += '**Giả định chờ Sở Tài chính xác nhận** (STC_ASSUME): ' + [A.unitNote, A.ckNote].join(' ') + '\n\n';
    h += '**Cách đọc dòng API thành chỉ tiêu** (STC_INDICATORS): mỗi chỉ tiêu có mã API, trường nhận diện (loai / chiTieu), ý nghĩa giá trị (kỳ này–kỳ trước, so với cùng kỳ, giá so sánh), kiểu (cộng được / chỉ số / tỷ lệ):\n\n';
    h += table(['Chỉ tiêu', 'Đơn vị', 'Kiểu', 'API', 'Nhận diện', 'Thành phần'], T.map((n) => [n.label, n.unit || '', n.kind, code(n.api || ''), (n.match || '') + ' · ' + (n.measure || ''), (n.kids || []).map((k) => k.label).join('; ')]));
  } else {
    const A = E(p.toUpperCase() + '_ASSUME');
    if (A && A.length) h += '**Giả định chờ đơn vị xác nhận** (' + p.toUpperCase() + '_ASSUME):\n\n' + A.map((x) => '- ' + (typeof x === 'string' ? x : x.t || x.text || JSON.stringify(x))).join('\n') + '\n\n';
    const TG = E(p.toUpperCase() + '_TARGETS');
    h += '**Mốc số toàn Thành phố** (' + p.toUpperCase() + '_TARGETS, ' + (p === 'sgd' ? '[năm học 2025–2026, 2024–2025]' : 'theo quý') + ') — tổng chia về từng ' + (p === 'sgd' ? 'phường, xã theo quy mô trường học (gdUnitData) có nhiễu cố định; số con không vượt số cha; số Thành phố là tổng cộng dồn 126 nơi' : 'đơn vị (sở theo trọng số HCC_SO, phường/xã theo quy mô), mỗi đơn vị có "mức chất lượng" cố định; số Thành phố là tổng cộng dồn') + ':\n\n';
    h += table(['Khóa', 'Giá trị'], Object.keys(TG).slice(0, 80).map((k) => [code(k), JSON.stringify(TG[k]).replace(/,/g, ', ')]));
    h += '\n';
  }
  h += '## ' + nFile + '. File code liên quan\n\n' + table(['File', 'Vai trò'], O.files.concat([['js/features/ubnd-overview.js', 'Thẻ đơn vị ở màn tổng quan UBND (đọc số qua hàm của form riêng)'], ['js/core/line-chart.js', 'Biểu đồ đường "Xu hướng"']]));
  return h;
}

/* ---------- 9. Trục UBND ---------- */
function ubndDoc() {
  const cats = E('categorySeedForRole')('UBND'), KP = E('UBND_OV_KPIS'), GR = E('UBND_OV_GROUPS');
  const D = {}; cats.forEach((c) => { const d = E('ubndOvData')(c.id); if (d) D[c.id] = d; });
  const docOf = (id) => SO_MAP[id] ? 'docs/' + SO_MAP[id].dir + '/' + SO_MAP[id].ma + '_MAN_HINH_CHI_TIEU.md' : id === 'ubnd-taichinh' ? 'docs/STC_SoTaiChinh/STC_MAN_HINH_CHI_TIEU.md' : id === 'ubnd-gddt' ? 'docs/SGD_SoGiaoDuc/SGD_MAN_HINH_CHI_TIEU.md' : id === 'ubnd-hcc' ? 'docs/HCC_TrungTamHCC/HCC_MAN_HINH_CHI_TIEU.md' : '—';
  const kieu = (id) => S[id] ? 'Khuôn chung (ctm-so.js)' : ['ubnd-taichinh', 'ubnd-gddt', 'ubnd-hcc'].indexOf(id) >= 0 ? 'Form riêng' : 'Chưa có chỉ tiêu';
  let h = '# TRỤC UBND THÀNH PHỐ — TÀI LIỆU MÀN HÌNH CHỈ TIÊU\n\n';
  h += '- **Phiên bản**: ' + VER + ' · ngày ' + NGAY + ' · sinh từ code bằng `node tools/man_hinh_chi_tieu_md.js`\n- **Phạm vi**: màn tổng quan chỉ tiêu của trục UBND cấp Thành phố và danh mục ' + cats.length + ' sở, ngành. Chi tiết popup từng sở ở tài liệu riêng của sở (cột cuối bảng mục 1). Không gồm màn của tài khoản xã, phường.\n\n';
  h += '## Mục lục\n\n1. Danh mục sở, ngành\n2. Tài khoản và cách mở\n3. Màn tổng quan UBND\n4. Hai loại popup chi tiết\n5. Sắp xếp sở 2026\n6. File code liên quan\n\n';
  h += '## 1. Danh mục sở, ngành\n\n' + table(['#', 'Sở, ngành', 'Mã', 'Nhóm lĩnh vực', 'Kiểu popup', 'Kỳ số liệu', 'Tài liệu chi tiết'], cats.map((c, i) => {
    const g = GR.find((x) => x.ids.indexOf(c.id) >= 0);
    return [i + 1, c.name, code(c.id), g ? g.label : '—', kieu(c.id), D[c.id] ? D[c.id].ky : '—', docOf(c.id)];
  }));
  h += '\n## 2. Tài khoản và cách mở\n\n' + table(['Tài khoản', 'Thấy gì'], [
    ['`ubnd` (Chủ tịch UBND TP)', 'Chỉ trục UBND: vào thẳng màn tổng quan UBND (mục 3)'], ['`danguy` (Thường trực Thành ủy)', 'Tab "UBND" (màn tổng quan UBND) hoặc tab "Tất cả" (thẻ sở nằm trong nhóm "UBND Thành phố")'],
    ['`so-<mã sở>` (VD `so-ubnd-yte`)', 'Chỉ lĩnh vực của sở: băng "Tổng quan · <tên sở>" rộng cả hàng, bấm mở thẳng đúng màn chi tiết']]);
  h += '\nĐăng nhập (mật khẩu demo `123456`) → trang chủ → khung **"Nhóm chỉ tiêu theo lĩnh vực được phép xem"**. Bấm thẻ sở / ô số gọi `openCategoryDetail(\'UBND\', catId)` (js/features/subtasks.js) → Sở Tài chính, Sở GD&ĐT, TT HCC mở form riêng; 11 sở eform mở khuôn chung (`ctmOpenForm`).\n\n';
  h += '## 3. Màn tổng quan UBND\n\nKhai báo ở js/features/ubnd-overview.js (cờ `UBND_OVERVIEW_ENABLED = true`; tắt là quay về lưới thẻ cũ). Băng trên cùng: dòng nhỏ "Tổng quan · UBND Thành phố", tiêu đề "Số liệu then chốt của N sở, ngành", câu gợi ý "Mỗi ô ghi rõ sở cung cấp và kỳ số liệu · bấm ô để mở chi tiết của sở".\n\n';
  h += '**8 ô số then chốt** (mỗi ô lấy một dòng của thẻ sở — cùng số với popup, quy tắc H22; bấm ô mở popup của sở):\n\n' + table(['#', 'Ô số', 'Sở cung cấp', 'Số', 'Kỳ'], KP.map((k, i) => {
    const d = D[k.cat], L = d && d.lines, x = L && ((k.m && L.find((y) => y.k === k.m)) || L[k.line]);
    return [i + 1, k.label, E('UBND_OV_SHORT')[k.cat] || k.cat, x ? x.v + (((k.u != null ? k.u : x.u) === '%') ? '%' : (k.u != null ? k.u : x.u) ? ' ' + (k.u != null ? k.u : x.u) : '') : '—', d ? d.ky : '—'];
  }));
  h += '\n**4 thẻ nhóm lĩnh vực** (bấm để lọc lưới sở bên dưới, bấm lần nữa bỏ lọc; nút "Tất cả N đơn vị"). Mỗi thẻ ghi số sở, tổng số chỉ tiêu và dòng số đầu của từng sở:\n\n' + table(['Nhóm', 'Sở, ngành'], GR.map((g) => [g.label, g.ids.filter((id) => cats.some((c) => c.id === id)).map((id) => E('UBND_OV_SHORT')[id] || id).join('; ')]));
  h += '\n**Lưới thẻ sở**: mỗi thẻ có nhãn "UBND TP", số chỉ tiêu, tên nhóm, tên sở, 3–4 dòng số (nhãn – số – đơn vị, không có mũi tên so sánh: cờ `UBND_OV_SHOW_COMPARE = false`), chân thẻ ghi kỳ và nguồn (Eform / API). Sở chưa có chỉ tiêu ghi "Chưa có chỉ tiêu".\n\n';
  h += table(['Sở, ngành', 'Dòng số trên thẻ', 'Kỳ · nguồn', 'Lấy số từ'], cats.map((c) => {
    const d = D[c.id];
    return [c.name, d ? d.lines.map((x) => x.l + ' ' + x.v + (x.u === '%' ? '%' : x.u ? ' ' + x.u : '')).join('; ') : (c.noItems || !(c.items || []).length ? 'Chưa có chỉ tiêu' : '—'), d ? d.ky + ' · ' + d.src : '—',
      S[c.id] ? 'Dòng thẻ ngoài của cấu hình khuôn chung (`ctmOvLines`, cờ `UBND_OV_FROM_CTM`)' : d ? 'Hàm riêng trong `UBND_OV_SPECS` (đọc số qua lớp dữ liệu của form riêng)' : '—'];
  }));
  h += '\n## 4. Hai loại popup chi tiết\n\n' + table(['Loại', 'Đơn vị', 'Đặc điểm'], [
    ['Khuôn chung (js/features/ctm-engine.js + ctm-so.js)', cats.filter((c) => S[c.id]).map((c) => E('UBND_OV_SHORT')[c.id] || c.name).join('; '), 'Số theo eform của sở, thường 1 kỳ (3 sở có thêm số cùng kỳ); màn Tổng quan → nhóm → theo 126 xã, phường → hồ sơ xã'],
    ['Form riêng', 'Sở Tài chính; Sở GD&ĐT; TT Phục vụ HCC', 'Số theo API (thật / mẫu / giả lập), nhiều kỳ; thêm màn Chi tiết theo cấp bậc (sơ đồ cây, cầu nối tăng giảm, xu hướng); GD&ĐT, HCC có màn theo đơn vị và khung hồ sơ']]);
  h += '\n## 5. Sắp xếp sở 2026\n\nCờ `UBND_SAP_XEP_SO_2026 = true` (js/core/central-level.js, 15/10/2026): Sở Du lịch nhập vào Sở Văn hóa và Thể thao thành **Sở Văn hóa, Thể thao và Du lịch** (2 chỉ tiêu du lịch thành 2 nhóm cuối của sở này; ô số "Khách du lịch" đọc dòng `dlTong` của thẻ sở gộp); Sở Quy hoạch - Kiến trúc ẩn thẻ. Khai báo 2 sở cũ giữ nguyên, đặt cờ `false` là hiện lại. Sở Tư pháp và ô "Sở/đơn vị chuyên môn thứ 14" chưa có chỉ tiêu.\n\n';
  h += '## 6. File code liên quan\n\n' + table(['File', 'Vai trò'], [['js/features/ubnd-overview.js', 'Màn tổng quan UBND: 8 ô số, 4 nhóm, thẻ sở'], ['js/core/central-level.js', 'Danh mục lĩnh vực (categorySeed.UBND), cờ sắp xếp sở'], ['js/features/indicators.js', 'Khung "Nhóm chỉ tiêu theo lĩnh vực", chọn màn tổng quan / băng sở'], ['js/features/subtasks.js', 'openCategoryDetail → form riêng / khuôn chung'], ['js/features/ctm-so.js, ctm-engine.js', 'Popup 11 sở eform'], ['js/features/dashboard-stc.js, dashboard-sgd.js, dashboard-hcc.js', 'Popup 3 form riêng'], ['tests/ctm/ctm-quy-tac.test.js', 'Kiểm H22: tab UBND = tab Tất cả = cấu hình chi tiết']]);
  return h;
}

/* ---------- 10. Ghi file ---------- */
function write(rel, txt) { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, txt.replace(/\n{3,}/g, '\n\n')); console.log('ok ' + rel + ' (' + Math.round(txt.length / 1024) + ' KB)'); }
const only = process.argv.slice(2);
const want = (k) => !only.length || only.indexOf(k) >= 0;
['DANG', 'HDND', 'MTTQ'].forEach((r) => { if (want(r)) write(AXES[r].out, axisDoc(r)); });
Object.keys(SO_MAP).forEach((id) => { if (want(id)) write('docs/' + SO_MAP[id].dir + '/' + SO_MAP[id].ma + '_MAN_HINH_CHI_TIEU.md', soDoc(id)); });
Object.keys(OWN).forEach((p) => { if (want(p)) write('docs/' + OWN[p].dir + '/' + OWN[p].ma + '_MAN_HINH_CHI_TIEU.md', ownDoc(p)); });
if (want('UBND')) write('docs/CHUNG/TRUC_UBND_MAN_HINH_CHI_TIEU.md', ubndDoc());
/* mục lục chung của bộ tài liệu */
if (!only.length) {
  const rows = [['DANG', 'Trục Thành ủy', AXES.DANG.out], ['HDND', 'Trục HĐND Thành phố', AXES.HDND.out], ['UBND', 'Trục UBND Thành phố (màn tổng quan, danh mục sở)', 'docs/CHUNG/TRUC_UBND_MAN_HINH_CHI_TIEU.md'], ['MTTQ', 'Trục Ủy ban MTTQ Thành phố', AXES.MTTQ.out]]
    .map((r, i) => [i + 1, r[1], ['DANG', 'HDND', 'MTTQ'].indexOf(r[0]) >= 0 ? Object.keys(S).filter((id) => S[id].role === r[0] && (S[id].level || 'city') === 'city').length + ' đơn vị, khuôn chung' : 'Màn tổng quan + 16 đơn vị', r[2]]);
  const so = Object.keys(SO_MAP).map((id) => [E('categorySeed').UBND.find((c) => c.id === id).name, 'Khuôn chung (theo eform)', 'docs/' + SO_MAP[id].dir + '/' + SO_MAP[id].ma + '_MAN_HINH_CHI_TIEU.md'])
    .concat(Object.keys(OWN).map((p) => [E('categorySeed').UBND.find((c) => c.id === OWN[p].id).name, 'Form riêng', 'docs/' + OWN[p].dir + '/' + OWN[p].ma + '_MAN_HINH_CHI_TIEU.md']));
  let h = '# MÀN HÌNH CHỈ TIÊU — MỤC LỤC TÀI LIỆU (4 TRỤC + 14 SỞ, NGÀNH)\n\n- **Phiên bản**: ' + VER + ' · ngày ' + NGAY + ' · cả bộ sinh từ code bằng `node tools/man_hinh_chi_tieu_md.js` (chạy lại sau khi sửa code để tài liệu khớp giao diện; chạy riêng: thêm mã, VD `node tools/man_hinh_chi_tieu_md.js DANG ubnd-yte stc UBND`)\n';
  h += '- **Phạm vi**: màn chỉ tiêu cấp Thành phố — các màn, cách mở popup, từng ô số / thẻ / biểu đồ, số liệu, cách tính, nguồn và cách giả lập số. Không gồm màn của tài khoản xã, phường. Sở Tư pháp và "Sở/đơn vị chuyên môn thứ 14" chưa có chỉ tiêu nên không có tài liệu riêng (ghi trong tài liệu trục UBND).\n\n';
  h += '## 1. Tài liệu trục\n\n' + table(['#', 'Trục', 'Nội dung', 'File'], rows);
  h += '\n## 2. Tài liệu sở, ngành\n\n' + table(['#', 'Sở, ngành', 'Kiểu popup', 'File'], so.map((r, i) => [i + 1].concat(r)));
  h += '\n## 3. Cách đọc nhanh\n\n- **Khuôn chung** (11 sở eform, mọi đơn vị Thành ủy / HĐND / MTTQ): popup Tổng quan → màn từng nhóm → màn theo 126 xã, phường → khung hồ sơ xã.\n- **Form riêng** (Sở Tài chính, Sở GD&ĐT, TT Phục vụ HCC): Trang chủ → màn nhóm → Chi tiết theo cấp bậc (sơ đồ cây, cầu nối tăng giảm, xu hướng) → màn theo đơn vị / phường, xã.\n- Mỗi tài liệu có mục **Danh mục chỉ tiêu** (cột "Cách có số": số khai báo / công thức giả lập / công thức tính / biểu thức đọc cấu hình eform) và mục **Nguồn số liệu và cách giả lập** (số công bố làm mốc, cách chia về 126 xã, phường).\n- Quy tắc hiển thị số dùng chung: docs/CHUNG/QUY_TAC_HIEN_THI_CHI_TIEU_2026_10_12.md; quy ước dữ liệu eform: docs/CHUNG/QUY_UOC_XU_LY_EFORM_2026_10_13.md.\n';
  write('docs/CHUNG/MAN_HINH_CHI_TIEU_MUC_LUC.md', h);
}
module.exports = { ctx, S, DEFS, table, code, quote, cleanComment, headerComment, VER, NGAY, POPUP_CHUNG, QUY_TAC };
