/* ============================== BIỂU ĐỒ ĐƯỜNG DÙNG CHUNG ==============================
   Dùng cho: khuôn chỉ tiêu chung (ctm-engine.js) và thẻ "Xu hướng" của Sở Tài chính, Sở GD&ĐT, TT Phục vụ HCC.
   - Trục dọc chia số tròn (1, 2, 2,5, 5 × 10^k), không bắt đầu từ 0 (quy tắc H13), có thể có đường mốc (VD 100 của chỉ số).
   - Nhãn số đặt tránh đường, đường mốc, điểm và nhãn khác; điểm quá dày thì chỉ ghi đầu, cuối, cao nhất, thấp nhất.
   - lcBox() trả khung HTML có bản vẽ tạm 560 đơn vị; lcFit(gốc) vẽ lại đúng bề rộng thật của khung (1 đơn vị SVG = 1px)
     để chữ không bị phóng to / thu nhỏ theo khung. Gọi lcFit sau khi gán innerHTML và khi popup đã hiện.
   Không phụ thuộc file nào khác. Nạp trước các file dashboard-*.js và ctm-engine.js. */

const LC_REG = {};
let LC_SEQ = 0;
function lcE(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function lcNum(v, d) { return v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('vi-VN', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }

/* Trục chia số tròn, khoảng 4 vạch; đáy trục chừa ít nhất 1/4 bước dưới điểm thấp nhất để nhãn số không đè trục ngang.
   o.pct: kẹp trong 0–100; o.zero: không xuống dưới 0 (số đếm) */
function lcNiceAxis(mn, mx, o) {
  o = o || {};
  const range = (mx - mn) || Math.max(Math.abs(mx), 1) * 0.1, raw = range / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw - 1e-12);
  let lo = Math.floor(mn / step + 1e-9) * step, hi = Math.ceil(mx / step - 1e-9) * step;
  if (mn - lo < step * 0.25) lo -= step;
  if (hi <= lo) hi = lo + step;
  if (o.pct || o.zero) lo = Math.max(0, lo);
  if (o.pct) hi = Math.min(100, Math.max(hi, lo + step));
  const sd = String(+step.toFixed(6)).split('.')[1], dec = sd ? Math.min(3, sd.length) : 0;
  const ticks = [];
  for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(+v.toFixed(6));
  return { lo: lo, hi: hi, step: step, ticks: ticks, dec: dec };
}

/* pts: [{ l: nhãn trục, v: số | null, on: điểm đang xem }]
   o: { fmt(v): nhãn số, fmtAx(v, A): nhãn trục, pct, zero, ref: số mốc, cls: lớp CSS thêm cho <svg>,
        line: màu đường, dot: màu điểm thường, dotOn: màu điểm đang xem, gap: nối nét đứt qua điểm trống, ghost: vẽ vòng rỗng ở điểm trống, H } */
function lcSvg(pts, o, W) {
  o = o || {};
  W = W || 560;
  const Q0 = pts.map((p, i) => (p.v == null || !isFinite(p.v) ? null : { p: p, i: i }));
  const ok = Q0.filter(Boolean);
  const vs = ok.map((q) => q.p.v).concat(o.ref != null ? [o.ref] : []);
  const A = lcNiceAxis(Math.min.apply(null, vs), Math.max.apply(null, vs), o), lo = A.lo, hi = A.hi;
  const f = o.fmt || ((v) => lcNum(v, 1)), fa = o.fmtAx ? (v) => o.fmtAx(v, A) : (v) => lcNum(v, A.dec) + (o.pct ? '%' : '');
  const axL = A.ticks.map(fa), cw = 6.4;
  const H = o.H || 240, x0 = 16 + Math.max.apply(null, axL.map((t) => String(t).length)) * cw, x1 = W - 12, y0 = 30, y1 = H - 40, N = pts.length;
  const pad = Math.min(26, (x1 - x0) / 8);
  const xOf = (i) => (N === 1 ? (x0 + x1) / 2 : x0 + pad + (x1 - x0 - 2 * pad) * i / (N - 1)), yOf = (v) => y0 + (1 - (v - lo) / (hi - lo)) * (y1 - y0);
  const line = o.line || 'var(--s1)', dot = o.dot || 'var(--card)', dotOn = o.dotOn || line;
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="lc' + (o.cls ? ' ' + o.cls : '') + '" role="img" aria-label="Xu hướng"><g stroke="var(--line)" stroke-width="1">';
  /* vạch trục trùng (hoặc sát) đường mốc thì bỏ, số mốc ghi ở trục thay vào */
  const refY = o.ref != null ? yOf(o.ref) : null, ticks = A.ticks.filter((v) => refY == null || Math.abs(yOf(v) - refY) >= 14);
  ticks.forEach((v) => { s += '<line x1="' + x0 + '" y1="' + yOf(v).toFixed(1) + '" x2="' + x1 + '" y2="' + yOf(v).toFixed(1) + '"/>'; });
  s += '</g>';
  ticks.forEach((v) => { s += '<text class="stc-ax" x="' + (x0 - 8) + '" y="' + (yOf(v) + 4).toFixed(1) + '" text-anchor="end">' + lcE(fa(v)) + '</text>'; });
  if (refY != null) s += '<line x1="' + x0 + '" y1="' + refY.toFixed(1) + '" x2="' + x1 + '" y2="' + refY.toFixed(1) + '" stroke="var(--ink2)" stroke-dasharray="5 4" stroke-width="1.5"/><text class="stc-ax" x="' + (x0 - 8) + '" y="' + (refY + 4).toFixed(1) + '" text-anchor="end" style="font-weight:700">' + lcE(lcNum(o.ref, 0)) + '</text>';
  const Q = ok.map((q) => ({ x: xOf(q.i), y: yOf(q.p.v), p: q.p, i: q.i }));
  const segs = [];
  for (let k = 1; k < Q.length; k++) {
    const a = Q[k - 1], b = Q[k], dash = b.i - a.i > 1 && o.gap;
    segs.push([a, b]);
    s += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke="' + line + '" stroke-width="2.4" stroke-linecap="round"' + (dash ? ' stroke-dasharray="5 5"' : '') + '/>';
  }
  if (refY != null) segs.push([{ x: x0, y: refY }, { x: x1, y: refY }]);
  /* nhãn số: thử lần lượt trên / dưới / chéo, chọn chỗ không chạm đường, đường mốc, điểm, nhãn đã đặt và mép khung */
  const hitSeg = (r) => segs.some(([a, b]) => { for (let t = 0; t <= 1; t += 0.02) { const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t; if (x > r.l && x < r.r && y > r.t && y < r.b) return true; } return false; });
  const placed = [], lw = (t) => String(t).length * 7.2 + 4, gapX = N > 1 ? (x1 - x0 - 2 * pad) / (N - 1) : 999;
  const sparse = Q.some((q) => lw(f(q.p.v)) > gapX - 4);
  const vMin = Math.min.apply(null, Q.map((q) => q.p.v)), vMax = Math.max.apply(null, Q.map((q) => q.p.v));
  Q.forEach((q, k) => {
    const t = f(q.p.v);
    if (sparse && !(k === 0 || k === Q.length - 1 || q.p.on || q.p.v === vMin || q.p.v === vMax)) return;
    const w = lw(t), pv = Q[k - 1], nx = Q[k + 1];
    const low = (pv && nx && q.y > pv.y && q.y > nx.y) || (!pv && nx && nx.y < q.y) || (!nx && pv && pv.y < q.y);
    const C = [[0, -13, 'middle'], [0, 22, 'middle'], [10, -11, 'start'], [-10, -11, 'end'], [10, 21, 'start'], [-10, 21, 'end']];
    if (low) C.unshift(C.splice(1, 1)[0]);
    const box = (c) => { const x = q.x + c[0], l = c[2] === 'middle' ? x - w / 2 : c[2] === 'start' ? x : x - w; return { l: l, r: l + w, t: q.y + c[1] - 11, b: q.y + c[1] + 3, x: x, a: c[2], y: q.y + c[1] }; };
    const free = (r) => r.t >= 2 && r.b <= y1 + 4 && r.l >= x0 - 4 && r.r <= W - 2 && !hitSeg(r) && !placed.some((z) => z.l < r.r && r.l < z.r && z.t < r.b && r.t < z.b) &&
      !Q.some((z) => z !== q && Math.abs(z.x - (r.l + r.r) / 2) < w / 2 + 6 && z.y > r.t - 6 && z.y < r.b + 6);
    const r = C.map(box).find(free) || box(C[0]);
    placed.push(r);
    s += '<text class="stc-vl" x="' + r.x.toFixed(1) + '" y="' + r.y.toFixed(1) + '" text-anchor="' + r.a + '">' + lcE(t) + '</text>';
  });
  Q.forEach((q) => {
    s += '<circle cx="' + q.x.toFixed(1) + '" cy="' + q.y.toFixed(1) + '" r="' + (q.p.on ? 6 : 4) + '" fill="' + (q.p.on ? dotOn : dot) + '" stroke="' + (q.p.on ? dotOn : line) + '" stroke-width="2"><title>' + lcE((q.p.l ? q.p.l + ': ' : '') + f(q.p.v)) + '</title></circle>';
  });
  if (o.ghost) pts.forEach((p, i) => { if (p.v == null || !isFinite(p.v)) s += '<circle cx="' + xOf(i).toFixed(1) + '" cy="' + y1 + '" r="3.5" fill="none" stroke="var(--mute)" stroke-width="1.5"><title>' + lcE((p.l || '') + ': chưa có số') + '</title></circle>'; });
  const xEvery = Math.max(1, Math.ceil(Math.max.apply(null, pts.map((p) => String(p.l || '').length * cw + 8)) / Math.max(1, gapX)));
  pts.forEach((p, i) => { if (i % xEvery && i !== N - 1) return; s += '<text class="stc-ax" x="' + xOf(i).toFixed(1) + '" y="' + (y1 + 24) + '" text-anchor="middle">' + lcE(p.l) + '</text>'; });
  return { svg: s + '</svg>', A: A, fa: fa };
}
/* Khung chứa biểu đồ; trả { html, A, fa } — html có bản vẽ 560 tạm thời, lcFit sẽ vẽ lại theo bề rộng thật */
function lcBox(pts, o) {
  const id = 'lc' + (++LC_SEQ);
  LC_REG[id] = { pts: pts, o: o || {} };
  const old = LC_SEQ - 400;
  if (old > 0) delete LC_REG['lc' + old];
  const R = lcSvg(pts, o, 560);
  return { html: '<div class="lc-box" data-lc="' + id + '">' + R.svg + '</div>', A: R.A, fa: R.fa };
}
function lcFit(root) {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll('.lc-box[data-lc]').forEach((box) => {
    const a = LC_REG[box.getAttribute('data-lc')], W = Math.round(box.clientWidth);
    if (!a || W < 200) return;
    try { box.innerHTML = lcSvg(a.pts, a.o, W).svg; } catch (e) { /* giữ bản 560 */ }
  });
}
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  let lcRz = null;
  window.addEventListener('resize', () => { clearTimeout(lcRz); lcRz = setTimeout(() => lcFit(document.getElementById('modalBody')), 150); });
}
