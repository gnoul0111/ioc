/* ============================== API IOC (lớp 3: tổng_quan/biểu_đồ/dữ_liệu) ==============================
   file:// (mở trực tiếp) -> qua local-proxy.js (localhost:8787) vì API thật không trả CORS header.
   Deploy Vercel -> qua rewrite /api/ioc/:path* trong vercel.json (server-to-server, không dính CORS). */
const API_BASE = location.protocol === 'file:'
  ? 'http://localhost:8787/api/ioc'
  : '/api/ioc';

/* path: 'so/<so_id>' hoặc 'xa_phuong/<ma_xa>/<khoi>'. layer: 'tong_quan' | 'bieu_do' | 'du_lieu'.
   opts: { page, page_size } chỉ dùng cho layer 'du_lieu'. */
async function fetchIocLayer(path, layer, opts) {
  let url = `${API_BASE}/${path}/${layer}`;
  if (opts && (opts.page != null || opts.page_size != null)) {
    const qs = new URLSearchParams();
    if (opts.page != null) qs.set('page', opts.page);
    if (opts.page_size != null) qs.set('page_size', opts.page_size);
    url += `?${qs.toString()}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${url} trả lỗi ${res.status}`);
  return res.json();
}

async function fetchIocLayerSafe(path, layer, opts) {
  try {
    return await fetchIocLayer(path, layer, opts);
  } catch (err) {
    toast(`Không tải được dữ liệu từ API (${path}/${layer})`);
    console.error(err);
    return null;
  }
}

/* catId (categorySeed) -> so_id thật của API, chỉ các Sở đã chốt phạm vi làm API (xem project memory
   "IOC API integration"). Loại trừ Sở GD&ĐT cấp Thành phố (ubnd-gddt) và Thành ủy cấp Thành phố (role DANG).
   TẠM TẮT theo yêu cầu (đang cần đối chiếu lại dữ liệu API trả về) — để rỗng {} cho apiCategoryFetcher()
   luôn trả null, mọi nơi tự rơi về nhánh dữ liệu tĩnh cũ. Bật lại: khôi phục nguyên 4 dòng dưới đây. */
const API_SO_ID_MAP = {
  // 'ubnd-taichinh': 'tai_chinh_ngan_sach',
  // 'ubnd-yte': 'y_te',
  // 'ubnd-vhtt': 'van_hoa',
  // 'ubnd-noivu': 'noi_vu',
};

/* Render 1 kpi thật từ API (display_type STAT/BAR/TASK_STATUS + segments[{label,value,color}]) thành 1 thẻ
   catBoxHtml, dùng chung hạ tầng chart sẵn có (queueDimChart/flushPendingDimCharts) để giữ đúng phong cách UI. */
function apiKpiCardHtml(kpi) {
  const segs = kpi.segments || [];
  let bodyHtml;
  if (kpi.display_type === 'BAR') {
    const id = chartCanvasId();
    queueDimChart(id, 'bar', segs.map(s => s.label), segs.map(s => Number(s.value) || 0), segs.map(s => s.color || '#39d5ff'));
    bodyHtml = `<div style="position:relative;height:${Math.max(140, segs.length * 34 + 20)}px;margin-top:8px"><canvas id="${id}"></canvas></div>`;
  } else if (kpi.display_type === 'TASK_STATUS') {
    const id = chartCanvasId();
    const total = segs.reduce((s, x) => s + (Number(x.value) || 0), 0);
    queueDimChart(id, 'doughnut', segs.map(s => s.label), segs.map(s => Number(s.value) || 0), segs.map(s => s.color || '#39d5ff'), { line1: fmt(total), line2: 'mục' });
    const rows = segs.map(s => `<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color || '#39d5ff'};margin-right:6px"></i>${esc(s.label)}</span><b>${fmt(s.value)}</b></div>`).join('');
    bodyHtml = `<div style="position:relative;height:170px;margin-top:8px"><canvas id="${id}"></canvas></div><div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">${rows}</div>`;
  } else if (segs.length <= 1) {
    bodyHtml = `<b style="font-size:24px;color:#fff;display:block;margin-top:4px">${segs[0] != null ? fmt(segs[0].value) : '--'}</b>`;
  } else {
    bodyHtml = `<div class="cir-stat-grid" style="margin-top:10px;margin-bottom:0">${segs.map(s => `<div class="cir-stat-tile"><p>${esc(s.label)}</p><b>${fmt(s.value)}</b></div>`).join('')}</div>`;
  }
  return catBoxHtml(kpi.label, bodyHtml);
}

/* Cache trong-phiên theo so_id (giống window.__acctFlatCache ở login.js) — cả lưới thẻ "Chỉ tiêu" lẫn drawer
   chi tiết đều dùng chung 1 lần fetch, tránh gọi API lặp lại khi gõ tìm kiếm hoặc mở/đóng nhiều lần. */
const _soTongQuanCache = {};
function fetchSoTongQuanCached(soId) {
  if (!_soTongQuanCache[soId]) {
    _soTongQuanCache[soId] = fetchIocLayerSafe(`so/${soId}`, 'tong_quan').then(json => {
      if (!json) return null;
      return (json.items || []).flatMap(it => it.kpis || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    });
  }
  return _soTongQuanCache[soId];
}

/* Preview gọn cho 1 kpi trên lưới thẻ "Chỉ tiêu" (khác apiKpiCardHtml — không vẽ chart, chỉ liệt kê nhanh
   segment đầu, cùng phong cách/CSS với soItemCardHtml đang dùng cho các lĩnh vực chưa có API). */
/* Preview gọn cho 1 category API-backed trên lưới nhiều-lĩnh-vực (renderCategoryGrid nhánh chung) — cùng
   khung/CSS với soCategoryPreviewHtml (cat-preview-item/cpi-label) để đứng cạnh các card chưa có API không
   bị lệch style. */
function apiCategoryPreviewHtml(items) {
  const rows = (items || []).slice(0, 4).map(it => {
    const seg = (it.segments || [])[0];
    return `<div class="cat-preview-item"><p class="cpi-label">${esc(it.label)}</p>${seg ? `<div class="mini-stat-row"><span class="mini-stat-chip"><b>${fmt(seg.value)}</b> ${esc(seg.label)}</span></div>` : ''}</div>`;
  }).join('');
  return `<div style="display:grid;gap:7px;height:100%;overflow-y:auto">${rows || '<div class="access-lock" style="height:100%">Không có dữ liệu.</div>'}</div>`;
}

function apiKpiGridCardHtml(kpi, idx, role, catId) {
  const segs = kpi.segments || [];
  const bodyHtml = segs.length
    ? `<div class="mini-stat-row">${segs.slice(0, 4).map(s => `<span class="mini-stat-chip" title="${esc(s.label)}"><b>${fmt(s.value)}</b> ${esc(s.label)}</span>`).join('')}</div>`
    : '';
  return `<button class="field-category-card so-item-card" onclick="openCategoryDetail('${role}','${catId}',${idx})"><h4>${esc(kpi.label)}</h4>${bodyHtml}</button>`;
}

/* catId cấp xã/phường (UBND_XA_CATEGORIES) -> khối thật của API, chỉ 4 khối khớp nghĩa với category UI có
   sẵn (xem project memory "IOC API integration" + đối chiếu nội dung bieu_do thật).
   TẠM TẮT cùng lý do với API_SO_ID_MAP ở trên — để rỗng {} cho apiCategoryFetcher() luôn trả null. */
const API_XA_KHOI_MAP = {
  // 'ubndxa-yte': 'y_te',
  // 'ubndxa-mocua': 'hanh_chinh_cong',
  // 'ubndxa-vp': 'quan_ly_van_ban',
  // 'ubndxa-vhxh': 'van_hoa',
};
/* wardIdx (currentXaId, dạng string) -> ma_xa thật của API. Chỉ 2 xã/phường mẫu có data thật. */
const API_XA_WARD_MAP = { '84': 'xa_phu_xuyen', '37': 'phuong_viet_hung' };

/* Cấp xã/phường không có lớp tong_quan (404) — dùng bieu_do làm nguồn chính, chuẩn hoá về đúng shape
   {label, display_type, segments} như kpis cấp Sở để dùng lại nguyên apiKpiCardHtml/apiKpiGridCardHtml,
   không cần renderer riêng. typeChart 'donut' -> TASK_STATUS (doughnut+legend có sẵn); mọi loại bar/line
   khác -> BAR (đơn giản hoá, bỏ qua groups[] của bar_stacked). */
const _xaBieuDoCache = {};
function fetchXaBieuDoCached(maXa, khoi) {
  const key = `${maXa}/${khoi}`;
  if (!_xaBieuDoCache[key]) {
    _xaBieuDoCache[key] = fetchIocLayerSafe(`xa_phuong/${maXa}/${khoi}`, 'bieu_do').then(json => {
      if (!json) return null;
      const charts = (json.data || []).flatMap(d => d.charts || []);
      return charts.map(c => ({
        label: c.titleChart,
        display_type: c.typeChart === 'donut' ? 'TASK_STATUS' : 'BAR',
        segments: (c.dataChart || []).map(d => ({ label: d.label, value: Number(d.value) || 0 })),
      }));
    });
  }
  return _xaBieuDoCache[key];
}

/* Trả về hàm fetch (Promise<items[]>) đúng nguồn (Sở hoặc xã/phường) cho 1 catId, hoặc null nếu catId
   không thuộc phạm vi API. Dùng chung cho lưới "Chỉ tiêu", hàng KPI tổng, và drawer chi tiết. */
function apiCategoryFetcher(catId) {
  if (API_SO_ID_MAP[catId]) return () => fetchSoTongQuanCached(API_SO_ID_MAP[catId]);
  const khoi = API_XA_KHOI_MAP[catId];
  const maXa = API_XA_WARD_MAP[currentXaId];
  if (khoi && maXa) return () => fetchXaBieuDoCached(maXa, khoi);
  return null;
}
