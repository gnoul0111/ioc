/* ============================== XUẤT BÁO CÁO IOC (PDF) — HỘP CHỌN NỘI DUNG XUẤT (dựng giao diện thử, sửa 05/11/2026) ==============================
   Đổi từ xuất Excel sang xuất PDF (05/11/2026, task TU-274). MỖI LẦN XUẤT, IOC CHỐT DỮ LIỆU đúng lúc bấm; xem lại các lần chốt ở ô đồng hồ
   (js/features/ioc-moc.js). Dành cho người dùng ít quen máy tính, 3 bước đánh số, chỉ việc bấm và tích (không chọn thời gian; dữ liệu
   lấy như đang hiển thị trên màn hình):
     Bước 1 — chọn kiểu báo cáo: Tổng quan (các ô số, biểu đồ như trên màn hình) hoặc Chi tiết (thêm danh sách bên trong từng ô).
     Bước 2 — hai cột: trái là các mục (ô tích chọn cả mục, dòng «Đã chọn 2/3»); phải là nội dung của mục đang mở, mỗi nội dung một dòng
              có tên và câu giải thích báo cáo sẽ có gì (câu giải thích đổi theo kiểu báo cáo; it.ctOnly: chỉ có ở kiểu Chi tiết).
     Bước 3 — bấm «Tải file PDF»; cạnh nút ghi báo cáo gồm những phần nào.
   Đầu mục ĂN THEO «Sửa màn hình» (js/features/ui-visibility.js): khối, mục con, tab Notify, thẻ đơn vị chỉ tiêu mà tài khoản không có
   hoặc người dùng đã ẩn thì không có trong danh sách; nội dung đang ẩn ghi ngay trong mục, mục ẩn cả mục ghi cuối cột trái.
   BẢN DỰNG GIAO DIỆN: nút «Tải file PDF» chưa tạo file thật; chỉ thêm một mốc chốt (mẫu) vào lịch ở ô đồng hồ và báo tóm tắt lựa chọn.
   Mọi lớp CSS có tiền tố ix- (css/ioc-xuat.css). */

const IX = { open: false, kieu: 'tq', act: null, tick: new Set(), dv: new Set(), mo: new Set(), cay: [], an: [] };
const ixE = (s) => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])));

/* ---------- Ăn theo «Sửa màn hình» ---------- */
function ixUvHidden() { return new Set(typeof UV_STATE !== 'undefined' && UV_STATE.hidden ? UV_STATE.hidden : []); }
/* Mục id có đang hiện trên màn hình không: tài khoản có (uvAvailable) và người dùng không ẩn nó hay khối cha (uvIsVisible).
   Không có ui-visibility.js thì coi như hiện. */
function ixUvOn(id) {
  if (typeof uvBlockById !== 'function') return true;
  const b = uvBlockById(id);
  return !!b && uvAvailable(b) && uvIsVisible(b, ixUvHidden());
}
/* Tài khoản có mục đó nhưng người dùng đã ẩn (để ghi «đang ẩn»), khác với tài khoản không có */
function ixUvAn(id) { if (typeof uvBlockById !== 'function') return false; const b = uvBlockById(id); return !!b && uvAvailable(b) && !uvIsVisible(b, ixUvHidden()); }
/* Thẻ đơn vị ở «Nhóm chỉ tiêu theo lĩnh vực» bị ẩn chưa (mã thẻ tính như indicators.js → uvTagIndicatorItems) */
function ixDvAn(role, c) {
  if (typeof uvIndicatorItemId !== 'function') return false;
  const H = ixUvHidden();
  return H.has('indicators-fields') || H.has(uvIndicatorItemId('unit', "openCategoryDetail('" + role + "','" + c.id + "')", c.name));
}
/* Đơn vị chỉ tiêu tài khoản được xem, chia theo trục; .an: tên các đơn vị đang ẩn ở «Sửa màn hình» */
function ixDonVi() {
  const out = [], an = [];
  try {
    const roles = typeof allowedCategoryRoles === 'function' ? allowedCategoryRoles() : [];
    roles.forEach((r) => {
      const all = categorySeed[r] || [];
      all.filter((c) => ixDvAn(r, c)).forEach((c) => an.push(c.name));
      const opts = all.filter((c) => !ixDvAn(r, c)).map((c) => ({ id: c.id, ten: c.name }));
      if (opts.length) out.push({ k: r, ten: typeof roleAxisLabel === 'function' ? roleAxisLabel(r) : r, opts: opts });
    });
  } catch (e) { /* không có dữ liệu chỉ tiêu thì danh sách trống */ }
  out.an = an;
  return out;
}

/* ---------- Bước 1: các khối và nội dung (uv: mã mục ở «Sửa màn hình»; can: cần chọn đơn vị chỉ tiêu) ---------- */
const IX_NOTI_MOTA = {
  urgent: 'Các việc khẩn cấp hoặc quan trọng cần xử lý: nội dung, đơn vị, hạn xử lý, tình trạng.',
  nv: 'Thông báo về nhiệm vụ: nhiệm vụ mới, sắp đến hạn, quá hạn, chờ phê duyệt.',
  vb: 'Thông báo về văn bản đến, văn bản cần xử lý.',
  kpi: 'Thông báo về chỉ tiêu OKR/KPI chậm tiến độ, sắp đến hạn.',
  gis: 'Cảnh báo từ bản đồ GIS và camera AI.'
};
function ixKhoiDef() {
  const noti = (typeof NOTI_TAB_DEFS !== 'undefined' ? NOTI_TAB_DEFS : []).map((t) => ({ id: t.key, uv: 'notify-tab-' + t.key, ten: 'Thông báo «' + t.label + '»', tq: 'Số thông báo ở tab «' + t.label + '» như trên màn hình.', mota: IX_NOTI_MOTA[t.key] || 'Các thông báo ở tab «' + t.label + '».', sheet: 'Notify – ' + t.label }));
  return [
    { id: 'overview', uv: 'overview', icon: 'ti-layout-dashboard', ten: 'Tổng quan điều hành', mota: 'Ba thẻ ở đầu trang: văn bản, nhiệm vụ giao, nhiệm vụ nhận.', items: [
      { id: 'vb', uv: 'overview-documents', ten: 'Văn bản đến và văn bản đi', tq: 'Ô Văn bản như trên màn hình: số văn bản đến, đi theo tình trạng.', mota: 'Danh sách từng văn bản trong phạm vi tài khoản: số, ký hiệu, trích yếu, đơn vị gửi, đơn vị nhận, ngày, hạn xử lý, tình trạng.', sheet: 'Văn bản' },
      { id: 'giao', uv: 'overview-assigned', ten: 'Nhiệm vụ đã giao', tq: 'Ô Nhiệm vụ giao như trên màn hình: số nhiệm vụ theo tình trạng.', mota: 'Danh sách nhiệm vụ đơn vị đã giao cho nơi khác: tên nhiệm vụ, đơn vị nhận, ngày giao, hạn, tình trạng (trong hạn, quá hạn, hoàn thành).', sheet: 'Nhiệm vụ đã giao' },
      { id: 'nhan', uv: 'overview-received', ten: 'Nhiệm vụ được giao', tq: 'Ô Nhiệm vụ nhận như trên màn hình: số nhiệm vụ theo tình trạng.', mota: 'Danh sách nhiệm vụ đơn vị nhận từ cấp trên: tên nhiệm vụ, đơn vị giao, ngày giao, hạn, tình trạng.', sheet: 'Nhiệm vụ được giao' }] },
    { id: 'taskTally', uv: 'taskTally', icon: 'ti-list-check', ten: 'Kiểm đếm nhiệm vụ (BTCTW)', mota: 'Bảng kiểm đếm nhiệm vụ của Ban Tổ chức Trung ương.', items: [
      { id: 'bang', ten: 'Bảng kiểm đếm theo đơn vị', tq: 'Bảng kiểm đếm như trên màn hình.', mota: 'Mỗi đơn vị một dòng: tổng số nhiệm vụ, đang thực hiện, hoàn thành, quá hạn.', sheet: 'Kiểm đếm nhiệm vụ' }] },
    { id: 'natMap', uv: 'natMap', icon: 'ti-world', ten: 'Bản đồ số toàn quốc', mota: 'Chỉ tiêu theo từng tỉnh, thành phố.', items: [
      { id: 'dv', ten: 'Chỉ tiêu đảng viên', tq: 'Bản đồ và các số tổng đảng viên như trên màn hình.', mota: 'Mỗi tỉnh, thành phố một dòng: tổng số đảng viên, chính thức, dự bị, kết nạp mới.', sheet: 'Toàn quốc – Đảng viên' },
      { id: 'vb', ten: 'Chỉ tiêu văn bản và điều hành', tq: 'Bản đồ và các số tổng văn bản như trên màn hình.', mota: 'Mỗi tỉnh, thành phố một dòng: văn bản đi, văn bản đến, tỷ lệ xử lý.', sheet: 'Toàn quốc – Văn bản' }] },
    { id: 'gis', uv: 'gis', icon: 'ti-map-pin', ten: 'Bản đồ GIS và điểm nghẽn', mota: 'Các điểm nghẽn, sự cố trên bản đồ Thành phố.', items: [
      { id: 'diem', uv: 'gisBottleneckSection', ten: 'Danh sách điểm nghẽn', tq: 'Ảnh bản đồ và số điểm nghẽn của từng nhóm.', mota: 'Từng điểm nghẽn của 5 nhóm (trật tự đô thị, ùn tắc giao thông, vệ sinh môi trường, an toàn thực phẩm, ngập úng): tiêu đề, địa điểm, xã/phường, đơn vị chủ trì, trạng thái, thời gian.', sheet: 'Điểm nghẽn' },
      { id: 'tt', uv: 'gisStatusSection', ten: 'Tình hình xử lý điểm nghẽn', tq: 'Biểu đồ tình hình xử lý như trên màn hình.', mota: 'Số điểm đang xử lý và đã xử lý xong của từng nhóm.', sheet: 'Tình hình xử lý' },
      { id: 'bc', uv: 'gisUserReportsSection', ten: 'Báo cáo của người dùng', tq: 'Số báo cáo người dùng gửi lên như trên màn hình.', mota: 'Các báo cáo cán bộ, người dân gửi lên bản đồ: nội dung, vị trí, thời gian, tình trạng.', sheet: 'Báo cáo người dùng' },
      { id: 'cad', uv: 'gisCadBlock', ten: 'Điều phối sự cố (CAD)', tq: 'Số sự cố đang điều phối như trên màn hình.', mota: 'Các sự cố khẩn cấp đang điều phối: loại sự cố, đơn vị tham gia, từng bước xử lý.', sheet: 'Điều phối CAD' }] },
    { id: 'notify', uv: 'notify', icon: 'ti-bell', ten: 'Notify IOC/CAD cần xử lý', mota: 'Các thông báo, việc cần xử lý ở khung Notify.', items: noti },
    { id: 'indicators', uv: 'indicators', icon: 'ti-chart-bar', ten: 'Chỉ tiêu theo lĩnh vực', mota: 'Số liệu chỉ tiêu của các đơn vị. Tích nội dung, rồi chọn đơn vị ở phía dưới.', donVi: true, items: [
      { id: 'uo', uv: 'ubndIndicatorOverview', ten: 'Tổng quan số liệu UBND', tq: 'Các ô số tổng hợp ở đầu khung chỉ tiêu UBND.', mota: 'Các ô số tổng hợp ở đầu khung chỉ tiêu UBND.', sheet: 'Tổng quan số liệu UBND' },
      { id: 'so', ten: 'Bảng số liệu chỉ tiêu', tq: 'Các ô chỉ tiêu và biểu đồ của từng đơn vị như trên màn hình.', mota: 'Các con số chỉ tiêu của từng đơn vị như trên màn hình, kỳ này so với kỳ trước, có ghi cách tính.', sheet: 'Chỉ tiêu – số liệu', can: true },
      { id: 'dl', ten: 'Dữ liệu gốc đơn vị đã nhập', ctOnly: true, mota: 'Từng dòng dữ liệu các đơn vị đã nhập vào eform, đủ mọi cột như eform. Dùng để đối chiếu, kiểm tra số liệu.', sheet: 'Dữ liệu gốc (từng eform)', can: true },
      { id: 'xa', ten: 'Số liệu theo 126 xã, phường', tq: 'Biểu đồ so sánh 126 xã, phường như trên màn hình.', mota: 'Mỗi xã, phường một dòng, với các chỉ tiêu có số theo xã, phường.', sheet: 'Theo 126 xã, phường', can: true }] }
  ];
}
/* Dựng danh sách theo quyền và «Sửa màn hình»: k.an — nội dung của khối đang ẩn (ghi trong khối); IX.an — khối ẩn cả khối (ghi cuối cột trái) */
function ixBuild() {
  const cay = [], an = [];
  ixKhoiDef().forEach((k) => {
    if (!ixUvOn(k.uv)) { if (ixUvAn(k.uv)) an.push(k.ten); return; }
    const kan = [];
    let items = k.items.filter((it) => { if (!it.uv || ixUvOn(it.uv)) return true; if (ixUvAn(it.uv)) kan.push(it.ten); return false; });
    let dv = null;
    if (k.donVi) { dv = ixDonVi(); dv.an.forEach((t) => kan.push('thẻ đơn vị ' + t)); if (!dv.length) items = items.filter((it) => !it.can); }
    if (items.length) cay.push(Object.assign({}, k, { items: items, dv: dv, an: kan }));
    else if (kan.length) an.push(k.ten);
  });
  IX.cay = cay; IX.an = an;
}
const ixKey = (k, it) => k.id + '.' + it.id;
/* Nội dung của mục theo kiểu báo cáo đang chọn (kiểu Tổng quan bỏ các nội dung chỉ có ở Chi tiết) */
const ixIt = (k) => k.items.filter((it) => IX.kieu === 'ct' || !it.ctOnly);
const ixMota = (it) => (IX.kieu === 'tq' && it.tq) || it.mota;
const ixSoChon = (k) => ixIt(k).filter((it) => IX.tick.has(ixKey(k, it))).length;

/* ---------- Mở, đóng ---------- */
/* pre: mã khối mở sẵn và tích sẵn (VD nút Xuất Excel của một khối gọi ixOpen('indicators')) */
function ixOpen(pre) {
  ixBuild();
  IX.tick = new Set(); IX.mo = new Set(); IX.kieu = 'tq';
  IX.dv = new Set();
  IX.cay.forEach((k) => { if (k.dv) k.dv.forEach((g) => g.opts.forEach((o) => IX.dv.add(o.id))); if (k.id === pre) ixIt(k).forEach((it) => IX.tick.add(ixKey(k, it))); });
  IX.act = (IX.cay.find((k) => k.id === pre) || IX.cay[0] || {}).id;
  if (typeof toggleAccountMenu === 'function') toggleAccountMenu(false);
  let ov = document.getElementById('ixOv');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'ixOv'; ov.className = 'ix-ov';
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) ixClose(); });
    ov.addEventListener('click', ixClick);
    ov.addEventListener('change', ixChange);
    ov.addEventListener('keydown', (e) => { const r = e.target.closest && e.target.closest('.ix-root'); if (r && e.target === r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ixMoKhoi(r.dataset.k, true); } });
    document.body.appendChild(ov);
    document.addEventListener('keydown', (e) => { if (IX.open && e.key === 'Escape') { e.preventDefault(); ixClose(); } });
  }
  IX.open = true; ov.hidden = false;
  ixRender(true);
}
function ixClose() { IX.open = false; const ov = document.getElementById('ixOv'); if (ov) ov.hidden = true; }
function ixMoKhoi(id, focus) { IX.act = id; ixRender(true); if (focus) { const f = document.querySelector('#ixOv .ix-root.on'); if (f) f.focus(); } }

/* ---------- Vẽ ---------- */
/* Ô tích tự vẽ: input thật (ẩn, vẫn bấm và đọc được bằng bàn phím, trình đọc màn hình) + ô vẽ */
const ixCb = (attrs) => '<input type="checkbox" class="ix-in" ' + attrs + '><span class="ix-cb" aria-hidden="true"><i class="ti ti-check"></i><i class="ti ti-minus"></i></span>';
function ixRender(dau) {
  const ov = document.getElementById('ixOv');
  if (!ov || !IX.open) return;
  const d0 = ov.querySelector('.ix-detail'), r0 = ov.querySelector('.ix-roots'), top = d0 && !dau ? d0.scrollTop : 0, rtop = r0 ? r0.scrollTop : 0;
  const acct = ((document.getElementById('currentRoleName') || {}).textContent || '').trim();
  ov.innerHTML = '<div class="ix-dlg" role="dialog" aria-modal="true" aria-labelledby="ixT">' +
    '<div class="ix-head"><span class="ix-hic"><i class="ti ti-file-type-pdf"></i></span><div class="ix-ht"><b id="ixT">Xuất báo cáo PDF</b><small>Số liệu lấy như đang hiển thị trên màn hình, chỉ gồm phần ' + ixE(acct || 'tài khoản của bạn') + ' được xem. Lúc bấm tải, IOC chốt lại dữ liệu để xem lại sau ở ô đồng hồ.</small></div><button type="button" class="ix-x" data-ix="close" aria-label="Đóng"><i class="ti ti-x"></i></button></div>' +
    ixKieuHtml() +
    (IX.cay.length ? '<div class="ix-body"><div class="ix-roots">' + ixRoots() + '</div><div class="ix-detail">' + ixDetail() + '</div></div>'
      : '<div class="ix-body ix-body1"><p class="ix-empty">Không có nội dung nào để xuất: các mục đang ẩn ở «Sửa màn hình» hoặc tài khoản chưa được xem mục nào.</p>' + ixAnHtml() + '</div>') +
    ixFoot() + '</div>';
  const d = ov.querySelector('.ix-detail'); if (d) d.scrollTop = top;
  const r = ov.querySelector('.ix-roots'); if (r) r.scrollTop = rtop;
  /* màn hẹp (các mục thành hàng cuộn ngang): cuộn tới mục đang mở */
  const on = ov.querySelector('.ix-root.on');
  if (dau && r && on && r.scrollWidth > r.clientWidth) r.scrollLeft = Math.max(0, on.offsetLeft - r.offsetLeft - 8);
  ov.querySelectorAll('input[data-mixed]').forEach((i) => { i.indeterminate = true; });
}
/* Bước 1: kiểu báo cáo */
const IX_KIEU = [
  { id: 'tq', icon: 'ti-layout-dashboard', ten: 'Báo cáo tổng quan', mota: 'Các ô số và biểu đồ như trên màn hình. Ngắn gọn, dễ đọc.' },
  { id: 'ct', icon: 'ti-list-details', ten: 'Báo cáo chi tiết', mota: 'Thêm danh sách bên trong từng ô: văn bản, nhiệm vụ, điểm nghẽn, thông báo, chỉ tiêu.' }
];
function ixKieuHtml() {
  if (!IX.cay.length) return '';
  return '<div class="ix-kieu"><div class="ix-kh">' + ixStep(1, 'Chọn kiểu báo cáo') + '</div><div class="ix-kops" role="radiogroup" aria-label="Kiểu báo cáo">' +
    IX_KIEU.map((o) => { const on = IX.kieu === o.id;
      return '<button type="button" class="ix-kop' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-ix="kieu" data-v="' + o.id + '"><span class="ix-rd" aria-hidden="true"></span><span class="ix-ic"><i class="ti ' + o.icon + '"></i></span><span class="ix-itx"><b>' + ixE(o.ten) + '</b><small>' + ixE(o.mota) + '</small></span></button>'; }).join('') + '</div></div>';
}
const ixStep = (n, t) => '<span class="ix-step"><span class="ix-no">' + n + '</span>' + ixE(t) + '</span>';
/* Bước 1 — cột trái: các mục */
function ixRoots() {
  const n = IX.cay.reduce((s, k) => s + ixSoChon(k), 0);
  return '<div class="ix-colh">' + ixStep(2, 'Chọn nội dung') + '</div>' +
    IX.cay.map((k) => { const m = ixSoChon(k), all = m === ixIt(k).length, on = k.id === IX.act;
      return '<div class="ix-root' + (on ? ' on' : '') + (m ? ' co' : '') + '" role="button" tabindex="0" aria-pressed="' + on + '" data-ix="act" data-k="' + k.id + '">' +
        '<label class="ix-rck" title="Chọn cả mục ' + ixE(k.ten) + '">' + ixCb('data-ix="khoi" data-k="' + k.id + '"' + (all ? ' checked' : '') + (m && !all ? ' data-mixed="1"' : '') + ' aria-label="Chọn cả mục ' + ixE(k.ten) + '"') + '</label>' +
        '<span class="ix-ic"><i class="ti ' + k.icon + '"></i></span><span class="ix-rt"><span class="ix-lb">' + ixE(k.ten) + '</span><small>' + (m ? '<em>Đã chọn ' + m + '/' + ixIt(k).length + '</em>' : ixIt(k).length + ' nội dung') + '</small></span><i class="ti ti-chevron-right ix-chev" aria-hidden="true"></i></div>'; }).join('') +
    '<div class="ix-allbar"><button type="button" class="ix-lnk" data-ix="all"><i class="ti ti-checks"></i>Chọn tất cả</button><button type="button" class="ix-lnk" data-ix="none"' + (n ? '' : ' disabled') + '>Bỏ chọn</button></div>' + ixAnHtml();
}
function ixAnHtml() {
  if (!IX.an.length) return '';
  return '<div class="ix-an"><i class="ti ti-eye-off"></i><span><b>' + ixE(IX.an.join(', ')) + '</b> đang ẩn ở «Sửa màn hình» nên không có ở đây.</span></div>';
}
/* Bước 1 — cột phải: nội dung của mục đang mở */
function ixDetail() {
  const k = IX.cay.find((x) => x.id === IX.act) || IX.cay[0];
  if (!k) return '';
  const m = ixSoChon(k), all = m === ixIt(k).length;
  let h = '<div class="ix-dh"><span class="ix-ic lg"><i class="ti ' + k.icon + '"></i></span><div><b>' + ixE(k.ten) + '</b><small>' + ixE(k.mota) + '</small></div>' +
    '<button type="button" class="ix-btn sm ghost" data-ix="' + (all ? 'kbo' : 'kchon') + '" data-k="' + k.id + '">' + (all ? 'Bỏ chọn cả mục' : 'Chọn cả mục') + '</button></div>' +
    '<div class="ix-items">' + ixIt(k).map((it) => { const on = IX.tick.has(ixKey(k, it));
      return '<label class="ix-it' + (on ? ' on' : '') + '">' + ixCb('data-ix="it" data-k="' + k.id + '" data-i="' + it.id + '"' + (on ? ' checked' : '')) + '<span class="ix-itx"><b>' + ixE(it.ten) + '</b><small>' + ixE(ixMota(it)) + '</small></span></label>'; }).join('') + '</div>';
  if (k.dv && k.dv.length) h += ixDvHtml(k);
  if (k.an && k.an.length) h += '<div class="ix-an"><i class="ti ti-eye-off"></i><span>Đang ẩn ở «Sửa màn hình» nên không có ở đây: <b>' + ixE(k.an.join(', ')) + '</b>.</span></div>';
  return h;
}
/* Chọn đơn vị chỉ tiêu: mỗi trục một dòng tích (ghi tên các đơn vị), bấm «Xem từng đơn vị» để tích từng đơn vị */
function ixDvHtml(k) {
  const can = ixIt(k).some((it) => it.can && IX.tick.has(ixKey(k, it)));
  const tot = k.dv.reduce((s, g) => s + g.opts.length, 0), n = k.dv.reduce((s, g) => s + g.opts.filter((o) => IX.dv.has(o.id)).length, 0);
  return '<div class="ix-dv' + (can ? '' : ' mo') + '"><div class="ix-dvh"><b><i class="ti ti-building"></i>Lấy chỉ tiêu của đơn vị nào?</b><span class="ix-badge">' + n + '/' + tot + ' đơn vị</span></div>' +
    (can ? '' : '<p class="ix-hint">Dùng khi tích «Bảng số liệu chỉ tiêu», «Dữ liệu gốc» hoặc «Theo 126 xã, phường» ở trên.</p>') +
    k.dv.map((g) => { const m = g.opts.filter((o) => IX.dv.has(o.id)).length, all = m === g.opts.length, mo = IX.mo.has(g.k);
      return '<div class="ix-tr' + (mo ? ' open' : '') + '"><div class="ix-trh"><label class="ix-trl">' + ixCb('data-ix="truc" data-g="' + g.k + '"' + (all ? ' checked' : '') + (m && !all ? ' data-mixed="1"' : '')) + '<span class="ix-itx"><b>' + ixE(g.ten) + ' <em>' + m + '/' + g.opts.length + '</em></b><small>' + ixE(g.opts.slice(0, 3).map((o) => o.ten).join(', ') + (g.opts.length > 3 ? ', …' : '')) + '</small></span></label>' +
        '<button type="button" class="ix-mo" data-ix="mo" data-g="' + g.k + '" aria-expanded="' + mo + '">' + (mo ? 'Thu gọn' : 'Xem từng đơn vị') + '<i class="ti ti-chevron-down"></i></button></div>' +
        (mo ? '<div class="ix-dvs">' + g.opts.map((o) => '<label class="ix-ck">' + ixCb('data-ix="dv" value="' + ixE(o.id) + '"' + (IX.dv.has(o.id) ? ' checked' : '')) + '<span>' + ixE(o.ten) + '</span></label>').join('') + '</div>' : '') + '</div>'; }).join('') + '</div>';
}
/* Các phần của báo cáo (trang bìa ghi thời điểm chốt, người xuất, đơn vị) */
function ixDvCo(k) { return !!k.dv && k.dv.some((g) => g.opts.some((o) => IX.dv.has(o.id))); }
function ixSheets() {
  const out = [];
  IX.cay.forEach((k) => ixIt(k).forEach((it) => { if (IX.tick.has(ixKey(k, it)) && (!it.can || ixDvCo(k))) out.push(it.sheet); }));
  return out.length ? ['Trang bìa'].concat(out) : [];
}
/* Bước 2: chân */
function ixFoot() {
  const sh = ixSheets(), MAX = 5;
  const dvThieu = IX.cay.some((k) => k.dv && ixIt(k).some((it) => it.can && IX.tick.has(ixKey(k, it))) && !ixDvCo(k));
  return '<div class="ix-foot"><div class="ix-sum">' + ixStep(3, sh.length ? 'Báo cáo gồm ' + sh.length + ' phần' : 'Chưa chọn nội dung') +
    '<div class="ix-sumb">' + (sh.length ? '<span class="ix-chips">' + sh.slice(0, MAX).map((t) => '<span class="ix-chip">' + ixE(t) + '</span>').join('') + (sh.length > MAX ? '<span class="ix-chip more" title="' + ixE(sh.slice(MAX).join(', ')) + '">+' + (sh.length - MAX) + '</span>' : '') + '</span>'
      : '<span class="ix-mute">Tích ít nhất một nội dung ở bước 2.</span>') +
    (dvThieu ? '<span class="ix-warn"><i class="ti ti-alert-triangle"></i>Chưa chọn đơn vị cho phần chỉ tiêu.</span>' : '') + '</div></div>' +
    '<div class="ix-act"><button type="button" class="ix-btn ghost" data-ix="close">Đóng</button><button type="button" class="ix-btn primary" data-ix="xuat"' + (sh.length ? '' : ' disabled') + '><i class="ti ti-file-download"></i>Tải file PDF</button></div></div>';
}

/* ---------- Thao tác ---------- */
function ixClick(e) {
  if (e.target.closest('.ix-rck')) return; /* ô tích của mục ở cột trái: để sự kiện change xử lý */
  const b = e.target.closest('[data-ix]');
  if (!b || b.disabled || b.tagName === 'INPUT' || b.tagName === 'LABEL') return;
  const a = b.dataset.ix;
  if (a === 'close') return ixClose();
  if (a === 'kieu') { IX.kieu = b.dataset.v; IX.cay.forEach((k) => k.items.forEach((it) => { if (it.ctOnly && IX.kieu !== 'ct') IX.tick.delete(ixKey(k, it)); })); return ixRender(); }
  if (a === 'act') return ixMoKhoi(b.dataset.k);
  if (a === 'all') { IX.cay.forEach((k) => ixIt(k).forEach((it) => IX.tick.add(ixKey(k, it)))); return ixRender(); }
  if (a === 'none') { IX.tick.clear(); return ixRender(); }
  if (a === 'kchon' || a === 'kbo') { const k = IX.cay.find((x) => x.id === b.dataset.k); ixIt(k).forEach((it) => { if (a === 'kchon') IX.tick.add(ixKey(k, it)); else IX.tick.delete(ixKey(k, it)); }); return ixRender(); }
  if (a === 'mo') { const g = b.dataset.g; if (IX.mo.has(g)) IX.mo.delete(g); else IX.mo.add(g); return ixRender(); }
  if (a === 'xuat') return ixXuat();
}
function ixChange(e) {
  const el = e.target, a = el.dataset && el.dataset.ix;
  if (!a) return;
  /* tích ô của mục ở cột trái: chọn / bỏ cả mục và mở mục đó ở cột phải */
  if (a === 'khoi') { const k = IX.cay.find((x) => x.id === el.dataset.k); ixIt(k).forEach((it) => { if (el.checked) IX.tick.add(ixKey(k, it)); else IX.tick.delete(ixKey(k, it)); }); IX.act = k.id; return ixRender(true); }
  if (a === 'it') { const key = el.dataset.k + '.' + el.dataset.i; if (el.checked) IX.tick.add(key); else IX.tick.delete(key); return ixRender(); }
  if (a === 'truc' || a === 'dv') {
    const k = IX.cay.find((x) => x.dv);
    if (!k) return;
    const ids = a === 'dv' ? [el.value] : (k.dv.find((g) => g.k === el.dataset.g) || { opts: [] }).opts.map((o) => o.id);
    ids.forEach((id) => { if (el.checked) IX.dv.add(id); else IX.dv.delete(id); });
    /* tích đơn vị mà chưa tích nội dung chỉ tiêu nào: tích sẵn «Bảng số liệu chỉ tiêu» để người dùng khỏi quên */
    if (el.checked && !ixIt(k).some((it) => it.can && IX.tick.has(ixKey(k, it)))) { const so = ixIt(k).find((it) => it.id === 'so'); if (so) IX.tick.add(ixKey(k, so)); }
    return ixRender();
  }
}
/* Bản dựng giao diện: chưa tạo PDF thật — thêm một mốc chốt (mẫu) vào lịch ở ô đồng hồ và báo tóm tắt */
function ixXuat() {
  const sh = ixSheets();
  if (!sh.length) return;
  const nd = IX.cay.filter((k) => ixSoChon(k)).map((k) => k.ten);
  const m = typeof mcThem === 'function' ? mcThem({ kieu: IX.kieu, noiDung: nd }) : null;
  const gio = m ? ' lúc ' + mcGio(m.t) : '';
  if (typeof toast === 'function') toast('Đã chốt dữ liệu' + gio + ' — bấm ô đồng hồ để xem lại. Bản dựng giao diện: chưa tạo file PDF thật (' + sh.length + ' phần: ' + sh.join(', ') + ').');
  ixClose();
}
