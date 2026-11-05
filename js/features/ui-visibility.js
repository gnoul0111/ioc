/* ============================== ẨN / HIỆN GIAO DIỆN IOC ==============================
   Người dùng bấm "👁 Ẩn/Hiện" ở thanh đầu trang để chọn khối nội dung nào hiện trên màn hình IOC. Khối ẩn thì bố cục
   tự dồn lại / kéo giãn cho kín chỗ (xem css/ui-visibility.css). Lựa chọn lưu theo TỪNG TÀI KHOẢN trong localStorage,
   đăng nhập lại vẫn giữ.

   Quy ước:
   - Ẩn bằng class riêng .uv-hidden, KHÔNG đụng .hidden / .btm-role-hidden / .btt-role-hidden (đó là cơ chế ẩn theo
     phân quyền tài khoản). Khối mà tài khoản không được xem thì không liệt kê trong bảng chọn.
   - Chỉ liệt kê khối đang thực sự có trên màn hình. Widget "Nguồn dữ liệu" (đang ẩn cứng cho mọi tài khoản từ
     2026-10-08, xem theme-base.css) và "Dashboard kết quả xử lý" (luôn .hidden) nên không có trong danh sách; nếu sau
     này bật lại thì chỉ cần thêm 1 dòng vào UV_BLOCKS.
   - Phần tính bố cục (uvComputeLayout) là hàm thuần, không đụng DOM, để kiểm thử bằng Node
     (tests/ui/ui-visibility.test.js). */

const UV_STORAGE_PREFIX = 'px-ioc-ui-visibility:';

/* inGrid: khối nằm trong .dashboard-grid (cần tính lại bố cục khi ẩn). unavailableClass: class của cơ chế phân quyền
   cho biết tài khoản hiện tại KHÔNG có khối này. */
const UV_BLOCKS = [
  { id: 'overview',   icon: '📊', label: 'Tổng quan điều hành',            sel: '#roleScopeCards',          unavailableClass: 'btt-role-hidden' },
  { id: 'overview-documents', icon: '📄', label: 'Văn bản',                 sel: '#overview-documents',     parent: 'overview' },
  { id: 'overview-assigned',  icon: '📤', label: 'Nhiệm vụ giao',           sel: '#overview-assigned',      parent: 'overview' },
  { id: 'overview-received',  icon: '📥', label: 'Nhiệm vụ nhận',           sel: '#overview-received',      parent: 'overview' },
  { id: 'taskTally',  icon: '🧮', label: 'Kiểm đếm nhiệm vụ (BTCTW)',      sel: '#btctwTaskTally',          unavailableClass: 'hidden' },
  { id: 'natMap',     icon: '🗺️', label: 'Bản đồ số toàn quốc',            sel: '#btctwMapWidget',          unavailableClass: 'hidden' },
  { id: 'gis',        icon: '📍', label: 'Bản đồ GIS & điểm nghẽn',        sel: '#gismap',                  unavailableClass: 'btm-role-hidden', inGrid: true },
  { id: 'gisCadBlock', icon: '🚨', label: 'Điều phối CAD trên bản đồ GIS', sel: '#gisCadBlock',              parent: 'gis', unavailableAttr: 'hidden' },
  { id: 'gisBottleneckSection', icon: '🚧', label: '5 điểm nghẽn',         sel: '#gisBottleneckSection',    parent: 'gis' },
  { id: 'gisStatusSection', icon: '📊', label: 'Trạng thái xử lý',          sel: '#gisStatusSection',        parent: 'gis' },
  { id: 'gisUserReportsSection', icon: '📝', label: 'Báo cáo người dùng',   sel: '#gisUserReportsSection',  parent: 'gis' },
  { id: 'notify',     icon: '🔔', label: 'Notify IOC/CAD cần xử lý',       sel: '#notificationsWidget',     inGrid: true },
  { id: 'indicators', icon: '📈', label: 'Nhóm chỉ tiêu theo lĩnh vực',    sel: '#indicatorsWidget',        inGrid: true },
  { id: 'ubndIndicatorOverview', icon: '📊', label: 'Tổng quan số liệu UBND', sel: '#uoOverviewBand',         parent: 'indicators' }
];

/* Bố cục lưới: hàng 1 gồm "khối chính + Notify" (khối chính = GIS; riêng bố cục BTCTW là Chỉ tiêu), các khối còn lại
   tự chiếm cả hàng. Trả về:
     gridOn  — có ít nhất 1 khối trong lưới bị ẩn → bật bố cục co giãn
     fullIds — các khối phải kéo giãn kín chiều ngang (bạn cùng hàng đã ẩn)  */
function uvComputeLayout(hiddenIds, isTwLayout) {
  const hid = new Set(hiddenIds || []);
  const gridOn = UV_BLOCKS.some((b) => b.inGrid && hid.has(b.id));
  const mainId = isTwLayout ? 'indicators' : 'gis';
  const fullIds = [];
  if (gridOn) {
    if (!hid.has(mainId) && hid.has('notify')) fullIds.push(mainId);
    if (!hid.has('notify') && hid.has(mainId)) fullIds.push('notify');
  }
  return { gridOn, fullIds };
}

/* tree: trạng thái mở/thu gọn từng nhóm trong bảng chọn ({id: 'open'|'closed'}); panelBox: vị trí, cỡ bảng chọn người
   dùng đã kéo; aliases: mã cũ → mã mới của mục (đổi cách đặt mã thì lựa chọn đã lưu không mất). */
const UV_STATE = { hidden: [], key: null, panel: null, editing: false, editBar: null, tree: {}, panelBox: null, panelRoot: null, query: '', aliases: new Map(), hiddenCount: 0, panelPosition: null, panelDrag: null, panelResize: null, badgeFrame: null, badgeTimer: null, badgeEvents: false, switchingTab: false, ignoreNextClick: false };

/* Chiều cao mặc định của bảng Ẩn/Hiện (px) khi người dùng chưa tự kéo cỡ. */
const UV_PANEL_H = 600;

/* Hàm thuần: bỏ dấu, chữ thường — dùng cho tìm kiếm và đặt mã. */
function uvNorm(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

function uvSlug(s) { return uvNorm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

/* Hàm thuần: mã cố định cho ô/thẻ ở khu chỉ tiêu (indicators.js gọi). KHÔNG chứa bộ lọc đang chọn (Tất cả / Thành ủy /
   UBND…) và KHÔNG theo số thứ tự, để ẩn 1 ô ở bộ lọc này thì sang bộ lọc khác ô đó vẫn ẩn, dữ liệu đổi thứ tự cũng không
   làm ô đã ẩn tự hiện lại.
     kind   — 'kpi' (số liệu then chốt) | 'group' (thẻ trục/nhóm) | 'unit' (thẻ đơn vị/lĩnh vực)
     action — việc ô đó làm khi bấm (vd openCategoryDetail('DANG','dang-to-chuc')), xác định đúng đơn vị/eform
     label  — tên ô; ô số liệu cần thêm tên vì nhiều ô cùng mở 1 eform (vd "Tổng đảng viên", "Số kết nạp mới"). */
function uvIndicatorItemId(kind, action, label) {
  const identity = kind === 'kpi' ? `${action || ''} ${label || ''}` : (action || label || '');
  return `ind-${kind}-${uvSlug(identity) || 'item'}`;
}

/* Hàm thuần: đổi mã cũ sang mã mới trong danh sách đang ẩn, bỏ trùng. */
function uvRenameIds(ids, aliases) {
  let changed = false;
  const out = [];
  (ids || []).forEach((id) => {
    const next = aliases && aliases.has(id) ? aliases.get(id) : id;
    if (next !== id) changed = true;
    if (out.indexOf(next) < 0) out.push(next); else changed = true;
  });
  return { ids: out, changed };
}

function uvMigrateHidden() {
  /* Chỉ đổi khi đã nạp đúng cấu hình của tài khoản đang đăng nhập — nếu chưa, uvLoad sẽ tự đổi sau khi nạp. */
  if (!UV_STATE.key || UV_STATE.key !== uvAccountKey()) return;
  const r = uvRenameIds(UV_STATE.hidden, UV_STATE.aliases);
  if (r.changed) { UV_STATE.hidden = r.ids; uvSave(); }
}

/* indicators.js báo cặp [mã cũ, mã mới] mỗi lần gắn mã cho khu chỉ tiêu. */
function uvAddIdAliases(pairs) {
  (pairs || []).forEach(([from, to]) => { if (from && to && from !== to) UV_STATE.aliases.set(from, to); });
  uvMigrateHidden();
}

/* Hàm thuần: nhóm trong bảng chọn có đang thu gọn không. Mặc định chỉ các nhóm chỉ tiêu (Số liệu then chốt, Nhóm lĩnh
   vực / trục, Danh sách lĩnh vực) thu gọn cho bảng ngắn; người dùng mở/đóng nhóm nào thì nhớ nhóm đó. */
function uvIsCollapsedIn(tree, block) {
  const s = tree && tree[block.id];
  if (s === 'open') return false;
  if (s === 'closed') return true;
  return !!block.groupOnly;
}

/* Hàm thuần: lọc cây theo từ khóa (không phân biệt dấu). Mục khớp → giữ nguyên cả nhánh con; chỉ có mục con khớp → giữ
   mục cha, buộc mở, chỉ giữ các nhánh con có khớp. */
function uvFilterTree(nodes, query) {
  const q = uvNorm(query);
  if (!q) return nodes;
  const walk = (node) => {
    if (uvNorm(node.block.label).includes(q)) return node;
    const kids = node.children.map(walk).filter(Boolean);
    return kids.length ? { block: node.block, children: kids, forceOpen: true } : null;
  };
  return nodes.map(walk).filter(Boolean);
}

/* Giữ chuột gắn với bảng chọn suốt lúc kéo, kể cả khi chuột chạy ra ngoài bảng. */
function uvCapturePointer(el, pointerId) {
  try { el.setPointerCapture(pointerId); } catch (e) { /* trình duyệt cũ không hỗ trợ — vẫn kéo được nhờ nghe trên document */ }
}

function uvAccountKey() {
  let who = 'guest';
  try { if (typeof currentAccount !== 'undefined' && currentAccount) who = currentAccount.user || currentAccount.title || 'guest'; } catch (e) { /* chưa đăng nhập */ }
  return UV_STORAGE_PREFIX + who;
}

function uvLoad() {
  const key = uvAccountKey();
  if (key !== UV_STATE.key) UV_STATE.query = '';
  UV_STATE.key = key;
  let parsed = null;
  try {
    const raw = localStorage.getItem(UV_STATE.key);
    parsed = raw ? JSON.parse(raw) : null;
  } catch (e) { /* localStorage bị chặn hoặc dữ liệu hỏng → coi như hiện đủ */ }
  const ids = parsed && Array.isArray(parsed.hidden) ? parsed.hidden : [];
  UV_STATE.hidden = ids.filter((id) => typeof id === 'string');
  UV_STATE.tree = parsed && parsed.tree && typeof parsed.tree === 'object' ? parsed.tree : {};
  const box = parsed && parsed.panel;
  UV_STATE.panelBox = box && Number.isFinite(box.left) && Number.isFinite(box.top) ? box : null;
  uvMigrateHidden();
}

function uvSave() {
  try {
    localStorage.setItem(UV_STATE.key || uvAccountKey(), JSON.stringify({ hidden: UV_STATE.hidden, tree: UV_STATE.tree, panel: UV_STATE.panelBox }));
  } catch (e) { /* bỏ qua */ }
}

function uvAllBlocks() {
  const dynamic = typeof document.querySelectorAll === 'function'
    ? [...document.querySelectorAll('[data-uv-item]')].map((el) => ({
      id: el.dataset.uvItem,
      label: el.dataset.uvLabel || el.getAttribute('aria-label') || el.textContent.trim(),
      icon: el.dataset.uvIcon || '◻',
      parent: el.dataset.uvGroup || el.dataset.uvParent || '',
      groupParent: el.dataset.uvParent || '',
      groupId: el.dataset.uvGroup || '',
      groupLabel: el.dataset.uvGroupLabel || '',
      groupIcon: el.dataset.uvGroupIcon || '📂',
      el,
      dynamic: true
    }))
    : [];
  const groups = new Map();
  dynamic.forEach((block) => {
    if (block.groupId && !groups.has(block.groupId)) {
      groups.set(block.groupId, {
        id: block.groupId,
        label: block.groupLabel,
        icon: block.groupIcon,
        parent: block.groupParent,
        groupOnly: true
      });
    }
  });
  return UV_BLOCKS.concat([...groups.values()], dynamic);
}

function uvBlockById(id) { return uvAllBlocks().find((block) => block.id === id); }

function uvEl(block) { return block.el || (block.sel ? document.querySelector(block.sel) : null); }

/* Khối có thực sự dành cho tài khoản đang đăng nhập không (không tính việc người dùng tự ẩn) */
function uvAvailable(block) {
  if (block.virtual) return true;
  if (block.groupOnly) {
    const parent = uvBlockById(block.parent);
    return !!parent && uvAvailable(parent)
      && [...document.querySelectorAll('[data-uv-item]')].some((el) => el.dataset.uvGroup === block.id);
  }
  if (block.parent) {
    const parent = uvBlockById(block.parent);
    if (!parent || !uvAvailable(parent)) return false;
  }
  const el = uvEl(block);
  if (!el) return false;
  return !(block.unavailableClass && el.classList.contains(block.unavailableClass))
    && !(block.unavailableAttr && el.hasAttribute(block.unavailableAttr));
}

function uvAvailableBlocks() { return uvAllBlocks().filter(uvAvailable); }

function uvBuildTree(blocks) {
  const nodes = blocks.map((block) => ({ block, children: [] }));
  const byId = new Map(nodes.map((node) => [node.block.id, node]));
  const roots = [];
  nodes.forEach((node) => {
    const parent = byId.get(node.block.parent);
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  });
  return roots;
}

function uvIsVisible(block, hiddenIds) {
  if (hiddenIds.has(block.id)) return false;
  if (!block.parent) return true;
  const parent = uvBlockById(block.parent);
  return !!parent && uvIsVisible(parent, hiddenIds);
}

function uvShouldCollapseSidebar(blocks, hiddenIds) {
  return blocks.length > 0 && !blocks.some((block) => uvIsVisible(block, hiddenIds));
}

/* Gắn class theo trạng thái hiện tại, rồi báo cho bản đồ/biểu đồ tính lại kích thước. */
function uvApply(notifyResize) {
  const hid = new Set(UV_STATE.hidden);
  const blocks = uvAllBlocks();
  blocks.forEach((b) => { const el = uvEl(b); if (el) el.classList.toggle('uv-hidden', hid.has(b.id)); });
  /* Vẽ lại Notify (nếu phải đổi tab) sẽ gọi lại uvApply; lần gọi lồng đó đã áp xong mọi thứ nên dừng ở đây. */
  if (!UV_STATE.switchingTab) {
    const before = window.__notiActiveTab;
    uvEnsureVisibleNotifyTab(hid);
    if (window.__notiActiveTab !== before) { if (notifyResize) uvNotifyResize(); return; }
  }

  const grid = document.querySelector('.dashboard-grid');
  if (grid) {
    const layout = uvComputeLayout(UV_STATE.hidden, grid.classList.contains('btm-tw-layout'));
    grid.classList.toggle('uv-on', layout.gridOn);
    UV_BLOCKS.filter((b) => b.inGrid).forEach((b) => {
      const el = uvEl(b); if (el) el.classList.toggle('uv-full', layout.fullIds.indexOf(b.id) >= 0);
    });
  }

  const sidebar = document.querySelector('.gis-layer-sidebar');
  const gisBody = sidebar && sidebar.closest('.gis-map-body');
  if (gisBody) {
    const sidebarBlocks = uvAvailableBlocks().filter((block) => block.parent === 'gis');
    gisBody.classList.toggle('uv-sidebar-collapsed', uvShouldCollapseSidebar(sidebarBlocks, hid));
  }

  const avail = uvAvailableBlocks();
  const shown = avail.filter((b) => uvIsVisible(b, hid));
  /* Số mục người dùng tự ẩn (mục con của khối đã ẩn không tính thêm) — hiện ở thanh chỉnh sửa, nút đầu trang, menu. */
  uvRenderCount(uvCountHidden(avail, hid));

  uvRenderEmpty(avail.length > 0 && shown.length === 0);
  uvSyncEditControls();
  if (notifyResize) uvNotifyResize();
}

function uvRenderEmpty(show) {
  let box = document.getElementById('uvEmpty');
  if (!box) {
    const grid = document.querySelector('.dashboard-grid');
    if (!grid || !grid.parentNode) return;
    box = document.createElement('div');
    box.id = 'uvEmpty';
    box.className = 'uv-empty';
    box.innerHTML = '<b>Tất cả nội dung đang được ẩn</b>Bấm “Hiện tất cả nội dung” hoặc mở “Chỉnh sửa màn hình” để hiện lại.'
      + '<br><button type="button" class="ghost" onclick="uvShowAll()">Hiện tất cả nội dung</button>';
    grid.parentNode.insertBefore(box, grid.nextSibling);
  }
  box.classList.toggle('show', !!show);
}

/* Bản đồ Leaflet và biểu đồ Chart.js chỉ tự co theo khung khi được báo kích thước đã đổi. */
function uvNotifyResize() {
  setTimeout(() => {
    try { if (window._gisMap) window._gisMap.invalidateSize(); } catch (e) { /* bản đồ chưa sẵn sàng */ }
    try { if (typeof BTM !== 'undefined' && BTM.map) BTM.map.invalidateSize(); } catch (e) { /* idem */ }
    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* idem */ }
  }, 80);
}

function uvSetVisible(id, visible) {
  const set = new Set(UV_STATE.hidden);
  if (visible) set.delete(id); else set.add(id);
  UV_STATE.hidden = [...set];
  uvSave();
  uvApply(true);
  uvRefreshOpenPanel();
}

/* Ẩn/hiện ở bất kỳ đâu (nút "−" trên màn hình…) khi bảng chọn đang mở → công tắc trong bảng đổi theo ngay. */
function uvRefreshOpenPanel() {
  if (UV_STATE.panel && UV_STATE.panel.classList.contains('open')) uvRenderPanel();
}

/* Hàm thuần: đếm số mục người dùng tự ẩn trong các mục tài khoản đang có (không tính nhóm chỉ để gom). */
function uvCountHidden(availBlocks, hiddenIds) {
  const hid = hiddenIds instanceof Set ? hiddenIds : new Set(hiddenIds || []);
  return (availBlocks || []).filter((b) => !b.groupOnly && hid.has(b.id)).length;
}

function uvRenderCount(n) {
  UV_STATE.hiddenCount = n;
  const text = n ? `Đang ẩn ${n} mục` : 'Đang hiện đủ';
  if (UV_STATE.editBar) {
    const el = UV_STATE.editBar.querySelector('.uv-count');
    if (el) { el.textContent = text; el.classList.toggle('has', n > 0); }
  }
  const btn = document.getElementById('uvOpenBtn');
  if (btn) {
    const badge = btn.querySelector('.uv-count-badge');
    if (badge) { badge.textContent = String(n); badge.hidden = !n; }
    btn.title = `Chỉnh sửa màn hình: ẩn/hiện các khối nội dung${n ? ` (${text.toLowerCase()})` : ''}`;
  }
  const menu = document.getElementById('uvMenuCount');
  if (menu) { menu.textContent = n ? `đang ẩn ${n}` : ''; menu.hidden = !n; }
}

/* Hàm thuần (kiểm thử được): tab Notify đang chọn bị ẩn thì chuyển sang tab đầu tiên còn hiện. Trả về khóa tab cần
   chuyển sang, hoặc null nếu không cần chuyển (tab đang chọn vẫn hiện, hoặc mọi tab đều ẩn). */
function uvPickNotifyTab(activeKey, tabKeys, hiddenIds) {
  const hid = hiddenIds instanceof Set ? hiddenIds : new Set(hiddenIds || []);
  if (!hid.has(`notify-tab-${activeKey}`)) return null;
  const next = (tabKeys || []).find((key) => !hid.has(`notify-tab-${key}`));
  return next === undefined ? null : next;
}

function uvEnsureVisibleNotifyTab(hid) {
  if (UV_STATE.switchingTab || typeof onNotiTabClick !== 'function') return;
  const keys = [...document.querySelectorAll('[data-uv-item^="notify-tab-"]')]
    .map((el) => el.dataset.uvItem.slice('notify-tab-'.length));
  if (!keys.length) return;
  const active = window.__notiActiveTab || keys[0];
  const next = uvPickNotifyTab(active, keys, hid);
  if (next === null) return;
  UV_STATE.switchingTab = true;
  try { onNotiTabClick(next); } finally { UV_STATE.switchingTab = false; }
}

/* Nút "−" (ẩn khối) khi chỉnh sửa màn hình: nằm trong 1 lớp nổi riêng (#uvBadges), đặt tâm đúng góc trên trái khung
   vàng của khối — KHÔNG gắn vào bên trong khối như trước, vì bên trong thì nút đè lên tiêu đề/chữ đầu dòng, còn khối
   nằm trong vùng cuộn (tab Notify, cột phải bản đồ GIS) thì nút bị cắt mất. Mỗi khung hình đọc lại vị trí khối nên
   nút bám theo khi cuộn trang/cuộn trong khối; góc khối bị che (cuộn khuất, hộp thoại, bảng chọn đè lên) thì nút ẩn. */
const UV_BADGE_SIZE = 24;

/* Hàm thuần (kiểm thử được): toạ độ nút "−" theo khung của khối. Tâm nút ở góc trên trái, lùi ra ngoài 3px cho trùng
   góc viền vàng (outline-offset 3px); khung có viền vẽ bên trong (mục con trong vùng cuộn) thì tâm nút ở đúng góc. */
function uvBadgePos(rect, insetOutline) {
  const off = insetOutline ? 0 : 3;
  return { left: Math.round(rect.left - off - UV_BADGE_SIZE / 2), top: Math.round(rect.top - off - UV_BADGE_SIZE / 2) };
}

function uvBadgeLayer() {
  let layer = document.getElementById('uvBadges');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'uvBadges';
    layer.className = 'uv-badges';
    document.body.appendChild(layer);
  }
  return layer;
}

/* Tìm lại phần tử của khối mỗi lần dùng (mục động như tab Notify bị vẽ lại → phần tử cũ không còn trên trang). */
function uvFindEl(id) {
  const block = UV_BLOCKS.find((b) => b.id === id);
  if (block) return document.querySelector(block.sel);
  const safe = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id.replace(/"/g, '\\"');
  return document.querySelector(`[data-uv-item="${safe}"]`);
}

function uvUpdateBadges() {
  const layer = document.getElementById('uvBadges');
  if (!layer) return;
  const badges = [...layer.children];
  /* Đọc hết rồi mới ghi, tránh bắt trình duyệt tính lại bố cục nhiều lần trong 1 khung hình. */
  const places = badges.map((badge) => { try {
    const el = uvFindEl(badge.dataset.uvFor);
    if (!el || el.classList.contains('uv-hidden')) return null;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    /* Góc khối có thực sự đang nhìn thấy không: điểm sát góc (trong khung) phải thuộc chính khối đó. */
    const px = rect.left + Math.min(8, rect.width / 2), py = rect.top + Math.min(8, rect.height / 2);
    const hit = document.elementsFromPoint(px, py).find((node) => !layer.contains(node));
    if (!hit || !el.contains(hit)) return null;
    const pos = uvBadgePos(rect, el.hasAttribute('data-uv-item'));
    /* Khối sát mép màn hình (điện thoại) → giữ nút trong màn hình, không lẹm ra ngoài. */
    return { left: Math.max(2, pos.left), top: Math.max(2, pos.top) };
  } catch (e) { return null; /* 1 khối lỗi không được làm dừng việc đặt các nút khác */ } });
  badges.forEach((badge, i) => {
    const p = places[i];
    badge.hidden = !p;
    if (p) badge.style.transform = `translate(${p.left}px,${p.top}px)`;
  });
}

/* Vị trí nút "−" được cập nhật theo NHIỀU đường, không chỉ dựa vào requestAnimationFrame (03/11/2026: trên máy anh Lương
   nút đứng yên ở vị trí cũ, lệch ~20px sau khi cuộn — vòng khung hình bị dừng; bản đồ cũng không vẽ lại cùng lúc):
   1) vòng khung hình (mượt khi trình duyệt chạy bình thường) — có bắt lỗi, lỗi thì vòng vẫn chạy tiếp;
   2) ngay khi cuộn (cửa sổ hoặc khung con) / đổi cỡ cửa sổ;
   3) kiểm định kỳ 400ms phòng khi 1) bị trình duyệt tạm dừng. */
function uvBadgeLoop() {
  if (!UV_STATE.editing) { UV_STATE.badgeFrame = null; return; }
  try { uvUpdateBadges(); } catch (e) { /* vẫn chạy vòng sau */ }
  UV_STATE.badgeFrame = requestAnimationFrame(uvBadgeLoop);
}

function uvBadgeTick() { if (UV_STATE.editing) { try { uvUpdateBadges(); } catch (e) { /* bỏ qua */ } } }

function uvStartBadgeWatch() {
  if (!UV_STATE.badgeFrame && typeof requestAnimationFrame === 'function') UV_STATE.badgeFrame = requestAnimationFrame(uvBadgeLoop);
  if (!UV_STATE.badgeTimer) UV_STATE.badgeTimer = setInterval(() => { if (!UV_STATE.editing) { clearInterval(UV_STATE.badgeTimer); UV_STATE.badgeTimer = null; return; } uvBadgeTick(); }, 400);
  if (!UV_STATE.badgeEvents) {
    UV_STATE.badgeEvents = true;
    document.addEventListener('scroll', uvBadgeTick, { capture: true, passive: true });
    window.addEventListener('resize', uvBadgeTick, { passive: true });
  }
}

function uvSyncEditControls() {
  const want = new Map();
  uvAllBlocks().forEach((block) => {
    const el = uvEl(block);
    if (!el) return;
    const on = UV_STATE.editing && uvAvailable(block);
    el.classList.toggle('uv-editable', on);
    if (on) want.set(block.id, block);
  });

  const layer = UV_STATE.editing ? uvBadgeLayer() : document.getElementById('uvBadges');
  if (!layer) return;
  [...layer.children].forEach((badge) => { if (!want.has(badge.dataset.uvFor)) badge.remove(); });
  const have = new Set([...layer.children].map((badge) => badge.dataset.uvFor));
  want.forEach((block, id) => {
    if (have.has(id)) return;
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'uv-remove';
    badge.dataset.uvFor = id;
    badge.hidden = true;
    badge.title = `Ẩn ${block.label}`;
    badge.setAttribute('aria-label', `Ẩn ${block.label}`);
    badge.innerHTML = '<span aria-hidden="true">−</span>';
    badge.addEventListener('click', (event) => {
      event.stopPropagation();
      uvSetVisible(id, false);
    });
    layer.appendChild(badge);
  });
  uvUpdateBadges();
  if (UV_STATE.editing) uvStartBadgeWatch();
}

function uvSetEditMode(editing) {
  UV_STATE.editing = !!editing;
  document.body.classList.toggle('uv-editing', UV_STATE.editing);
  if (!UV_STATE.editing) uvClosePanel();
  uvSyncEditControls();

  if (UV_STATE.editing) {
    if (!UV_STATE.editBar) {
      const bar = document.createElement('div');
      bar.className = 'uv-edit-bar';
      bar.innerHTML = '<div class="uv-edit-title"><b>Chỉnh sửa màn hình</b><span class="uv-count"></span></div>'
        + '<button type="button" class="ghost" onclick="uvTogglePanel(event)"><i class="ti ti-eye" aria-hidden="true"></i> Ẩn/Hiện</button>'
        + '<button type="button" class="primary" onclick="uvSetEditMode(false)">Xong</button>';
      document.body.appendChild(bar);
      UV_STATE.editBar = bar;
    }
    UV_STATE.editBar.classList.add('open');
    uvRenderCount(UV_STATE.hiddenCount);
  } else if (UV_STATE.editBar) {
    UV_STATE.editBar.classList.remove('open');
  }
  const btn = document.getElementById('uvOpenBtn');
  if (btn) { btn.setAttribute('aria-pressed', String(UV_STATE.editing)); btn.classList.toggle('active', UV_STATE.editing); }
}

function openUiEditMode() {
  if (typeof toggleAccountMenu === 'function') toggleAccountMenu(false);
  uvSetEditMode(true);
}

/* Nút "Sửa màn hình" ở đầu trang: bấm lần nữa thì thoát chế độ chỉnh sửa. */
function uvToggleEditMode(ev) {
  if (ev) ev.stopPropagation();
  if (UV_STATE.editing) uvSetEditMode(false); else openUiEditMode();
}

function uvShowAll() {
  UV_STATE.hidden = [];
  uvSave();
  uvApply(true);
  uvRefreshOpenPanel();
}

/* ---------- Bảng chọn ---------- */
function uvEnsurePanel() {
  if (UV_STATE.panel) return UV_STATE.panel;
  const p = document.createElement('div');
  p.id = 'uvPanel';
  p.className = 'uv-panel';
  p.setAttribute('role', 'dialog');
  p.setAttribute('aria-label', 'Ẩn/Hiện giao diện');
  /* Khung bảng dựng 1 lần; uvRenderPanel chỉ vẽ lại danh sách → ô tìm kiếm không mất con trỏ khi đang gõ. */
  p.innerHTML = '<div class="uv-head"><b>👁 Ẩn/Hiện giao diện</b>'
    + '<small>Chọn khối bên trái để xem các mục con bên phải. Kéo tiêu đề để di chuyển, kéo góc dưới phải để đổi cỡ.</small></div>'
    + '<div class="uv-search"><input type="search" placeholder="Tìm mục cần ẩn/hiện…" aria-label="Tìm mục cần ẩn/hiện" autocomplete="off"></div>'
    /* 2 cột: trái = các khối lớn (có công tắc), phải = mục con của khối đang chọn. Bảng hẹp (điện thoại) → cột trái
       thành 1 hàng cuộn ngang phía trên (xem @container trong ui-visibility.css). */
    + '<div class="uv-list uv-2col"><div class="uv-roots" role="tablist" aria-label="Các khối"></div><div class="uv-detail" role="tabpanel"></div></div>'
    + '<div class="uv-foot"><button type="button" class="ghost" onclick="uvShowAll()">Hiện tất cả</button>'
    + '<button type="button" class="ghost" onclick="uvClosePanel()">Đóng</button></div>'
    + '<div class="uv-resize-handle" aria-hidden="true"></div>';
  const search = p.querySelector('.uv-search input');
  search.addEventListener('input', () => { UV_STATE.query = search.value; uvRenderPanel(); });
  const list = p.querySelector('.uv-list');
  list.addEventListener('change', (event) => {
    const inp = event.target.closest('input[data-uv-id]');
    if (inp) uvSetVisible(inp.getAttribute('data-uv-id'), inp.checked);
  });
  list.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const pick = event.target.closest('[data-uv-pick]');
    if (!pick || event.target !== pick) return;
    event.preventDefault();
    UV_STATE.panelRoot = pick.getAttribute('data-uv-pick');
    uvRenderPanel(true);
    const again = list.querySelector(`[data-uv-pick="${UV_STATE.panelRoot}"]`);
    if (again) again.focus();
  });
  list.addEventListener('click', (event) => {
    const pick = event.target.closest('[data-uv-pick]');
    if (pick && !event.target.closest('label,input')) {
      UV_STATE.panelRoot = pick.getAttribute('data-uv-pick');
      uvRenderPanel(true);
      return;
    }
    const btn = event.target.closest('button[data-uv-collapse]');
    if (!btn) return;
    const id = btn.getAttribute('data-uv-collapse');
    const block = uvBlockById(id);
    const collapsed = block ? uvIsCollapsedIn(UV_STATE.tree, block) : false;
    UV_STATE.tree = Object.assign({}, UV_STATE.tree, { [id]: collapsed ? 'open' : 'closed' });
    uvSave();
    uvRenderPanel();
  });
  p.addEventListener('click', (e) => e.stopPropagation());
  p.addEventListener('pointerdown', (event) => {
    const rect = p.getBoundingClientRect();
    if (event.button !== 0) return;
    if (event.target.closest('.uv-resize-handle')) {
      delete p.dataset.autoH; /* người dùng tự chọn cỡ → giữ đúng cỡ đó */
      UV_STATE.panelResize = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      };
      UV_STATE.panelPosition = { left: rect.left, top: rect.top };
      p.style.left = `${rect.left}px`;
      p.style.top = `${rect.top}px`;
      p.style.right = 'auto';
      /* Người dùng tự kéo cỡ thì nới giới hạn cao 82% màn hình của CSS thành gần kín màn hình (JS vẫn chặn không vượt
         mép dưới cửa sổ), nếu không bảng đứng yên mà chuột cứ chạy xuống, ra khỏi bảng. */
      p.style.maxHeight = 'calc(var(--vh,1vh)*100 - 20px)';
      uvCapturePointer(p, event.pointerId);
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!event.target.closest('.uv-head')) return;
    UV_STATE.panelDrag = { pointerId: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top };
    uvCapturePointer(p, event.pointerId);
    event.preventDefault();
  });
  document.addEventListener('pointermove', (event) => {
    const resize = UV_STATE.panelResize;
    if (resize && resize.pointerId === event.pointerId) {
      const maxWidth = Math.max(240, window.innerWidth - resize.left - 10);
      const maxHeight = Math.max(220, uvPanelBottomLimit() - resize.top);
      p.style.width = `${Math.max(Math.min(320, maxWidth), Math.min(maxWidth, resize.width + event.clientX - resize.x))}px`;
      p.style.height = `${Math.max(Math.min(280, maxHeight), Math.min(maxHeight, resize.height + event.clientY - resize.y))}px`;
      event.preventDefault();
      return;
    }
    const drag = UV_STATE.panelDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const left = Math.max(0, Math.min(window.innerWidth - p.offsetWidth, event.clientX - drag.x));
    const top = Math.max(0, Math.min(uvPanelBottomLimit() - p.offsetHeight, event.clientY - drag.y));
    UV_STATE.panelPosition = { left, top };
    p.style.left = `${left}px`;
    p.style.top = `${top}px`;
    p.style.right = 'auto';
  });
  const stopDrag = (event) => {
    let ended = false;
    if (UV_STATE.panelDrag && UV_STATE.panelDrag.pointerId === event.pointerId) { UV_STATE.panelDrag = null; ended = true; }
    if (UV_STATE.panelResize && UV_STATE.panelResize.pointerId === event.pointerId) { UV_STATE.panelResize = null; ended = true; }
    /* Nhả chuột ở ngoài bảng sau khi kéo/kéo giãn → trình duyệt có thể phát thêm 1 cú "click" ở ngoài bảng ngay trong
       lượt nhả chuột này; cú click đó không phải người dùng bấm ra ngoài nên không được đóng bảng. Cờ chỉ sống đến hết
       lượt nhả chuột (setTimeout 0), để lần bấm ra ngoài thật sau đó vẫn đóng bảng. */
    if (ended && event.type === 'pointerup') {
      UV_STATE.ignoreNextClick = true;
      setTimeout(() => { UV_STATE.ignoreNextClick = false; }, 0);
    }
    /* Nhớ vị trí, cỡ bảng theo tài khoản — lần sau mở lại đúng chỗ anh đã kéo. */
    if (ended) {
      const r = p.getBoundingClientRect();
      UV_STATE.panelBox = {
        left: Math.round(r.left), top: Math.round(r.top),
        width: p.style.width ? Math.round(r.width) : null,
        height: p.style.height && p.dataset.autoH !== '1' ? Math.round(r.height) : null
      };
      uvSave();
    }
  };
  document.addEventListener('pointerup', stopDrag);
  document.addEventListener('pointercancel', stopDrag);
  document.body.appendChild(p);
  UV_STATE.panel = p;
  return p;
}

function uvPanelNodeHtml(node, hiddenIds, depth) {
  const block = node.block;
  const parent = block.parent ? uvBlockById(block.parent) : null;
  const parentDisabled = parent && !uvIsVisible(parent, hiddenIds);
  const isVisible = uvIsVisible(block, hiddenIds);
  const label = typeof esc === 'function' ? esc(block.label) : String(block.label).replace(/[&<>"']/g, '');
  const inputId = `uv-switch-${block.id}`;
  const collapsed = node.forceOpen ? false : uvIsCollapsedIn(UV_STATE.tree, block);
  const children = node.children.map((child) => uvPanelNodeHtml(child, hiddenIds, depth + 1)).join('');
  return `<div class="uv-node${depth === 0 ? ' uv-root-node' : ''}" data-depth="${depth}">`
    + `<div class="uv-row ${block.groupOnly ? 'uv-group-row' : depth === 0 ? 'uv-root-row' : 'uv-child-row'}">`
    + (children ? `<button type="button" class="uv-collapse" data-uv-collapse="${block.id}" aria-label="${collapsed ? 'Mở' : 'Thu gọn'} ${label}" aria-expanded="${!collapsed}">${collapsed ? '▸' : '▾'}</button>` : '<span class="uv-tree-spacer" aria-hidden="true"></span>')
    + `<span class="uv-ic" aria-hidden="true">${block.icon}</span>`
    + (block.groupOnly ? `<span class="uv-lb">${label}</span>`
      : `<label class="uv-toggle" for="${inputId}"><span class="uv-lb">${label}</span>`
        + `<input id="${inputId}" type="checkbox" data-uv-id="${block.id}" ${isVisible ? 'checked' : ''} ${parentDisabled ? 'disabled' : ''}><span class="uv-switch"></span></label>`)
    + '</div>'
    + (children ? `<div class="uv-children${collapsed ? ' collapsed' : ''}">${children}</div>` : '')
    + '</div>';
}

/* Hàm thuần (kiểm thử được): khối đang chọn ở cột trái — giữ khối đã chọn nếu còn trong danh sách, không thì khối đầu. */
function uvPickRoot(rootIds, current) {
  if (!rootIds || !rootIds.length) return null;
  return rootIds.indexOf(current) >= 0 ? current : rootIds[0];
}

/* Hàm thuần (kiểm thử được): số mục con (không tính nhóm chỉ để gom) và số mục con người dùng đang tự ẩn của 1 khối. */
function uvNodeCounts(node, hiddenIds) {
  const hid = hiddenIds instanceof Set ? hiddenIds : new Set(hiddenIds || []);
  let total = 0, hidden = 0;
  const walk = (n) => n.children.forEach((c) => {
    if (!c.block.groupOnly) { total += 1; if (hid.has(c.block.id)) hidden += 1; }
    walk(c);
  });
  walk(node);
  return { total, hidden };
}

function uvEscText(text) {
  return typeof esc === 'function' ? esc(text) : String(text).replace(/[&<>"']/g, '');
}

function uvRootItemHtml(node, hid, selected) {
  const block = node.block;
  const label = uvEscText(block.label);
  const on = !hid.has(block.id);
  const c = uvNodeCounts(node, hid);
  const meta = c.total ? `${c.total} mục con${c.hidden ? ` · <em>ẩn ${c.hidden}</em>` : ''}` : 'Không có mục con';
  return `<div class="uv-root-item${selected ? ' on' : ''}${on ? '' : ' off'}" data-uv-pick="${block.id}" role="tab" aria-selected="${selected}" tabindex="0">`
    + `<span class="uv-ic" aria-hidden="true">${block.icon}</span>`
    + `<span class="uv-root-txt"><span class="uv-lb">${label}</span><small>${meta}</small></span>`
    + `<label class="uv-root-switch" title="${on ? 'Ẩn' : 'Hiện'} ${label}"><input type="checkbox" data-uv-id="${block.id}" aria-label="${on ? 'Ẩn' : 'Hiện'} ${label}" ${on ? 'checked' : ''}><span class="uv-switch"></span></label>`
    + '</div>';
}

function uvDetailHtml(node, hid) {
  if (!node) return '';
  const block = node.block;
  const label = uvEscText(block.label);
  const off = hid.has(block.id);
  const head = `<div class="uv-detail-head"><span class="uv-ic" aria-hidden="true">${block.icon}</span><b>${label}</b></div>`
    + (off ? '<div class="uv-detail-note">Khối này đang ẩn — bật công tắc của khối ở cột trái để chỉnh các mục con.</div>' : '');
  const kids = node.children.map((child) => uvPanelNodeHtml(child, hid, 1)).join('');
  return head + (kids || '<div class="uv-none">Khối này không có mục con để ẩn riêng — dùng công tắc của khối ở cột trái.</div>');
}

function uvRenderPanel(resetDetailScroll) {
  const p = uvEnsurePanel();
  const hid = new Set(UV_STATE.hidden);
  const avail = uvAvailableBlocks();
  const full = uvBuildTree(avail);
  const tree = uvFilterTree(full, UV_STATE.query);
  const safeQ = String(UV_STATE.query || '').trim().replace(/[&<>"']/g, '');
  const roots = p.querySelector('.uv-roots');
  const detail = p.querySelector('.uv-detail');
  const keepRoots = roots.scrollTop, keepDetail = resetDetailScroll ? 0 : detail.scrollTop;
  if (!tree.length) {
    roots.innerHTML = '';
    detail.innerHTML = full.length
      ? `<div class="uv-none">Không có mục nào khớp “${safeQ}”.</div>`
      : '<div class="uv-none">Tài khoản này chưa có nội dung nào để ẩn/hiện.</div>';
  } else {
    const selected = uvPickRoot(tree.map((n) => n.block.id), UV_STATE.panelRoot);
    UV_STATE.panelRoot = selected;
    roots.innerHTML = tree.map((n) => uvRootItemHtml(n, hid, n.block.id === selected)).join('');
    detail.innerHTML = uvDetailHtml(tree.find((n) => n.block.id === selected), hid);
  }
  roots.scrollTop = keepRoots;
  detail.scrollTop = keepDetail;
  const search = p.querySelector('.uv-search input');
  if (search.value !== UV_STATE.query) search.value = UV_STATE.query;
  /* Mở/thu nhóm, tìm kiếm làm bảng cao/thấp đi → giữ bảng trong màn hình */
  uvFitPanel();
}

/* Mở bảng theo vị trí, cỡ đã nhớ (chặn trong màn hình hiện tại); chưa có thì để mặc định, nằm trên thanh chỉnh sửa. */
/* Mép dưới tối đa của bảng chọn: ngay trên thanh "Chỉnh sửa màn hình" (thanh nổi trên bảng — bảng lấn xuống dưới
   thanh thì góc kéo giãn bị thanh che, không nắm được nữa); ngoài chế độ chỉnh sửa thì cách đáy cửa sổ 10px. */
function uvPanelBottomLimit() {
  const bar = UV_STATE.editBar;
  if (UV_STATE.editing && bar && bar.classList.contains('open')) return Math.round(bar.getBoundingClientRect().top) - 8;
  return window.innerHeight - 10;
}

function uvRestorePanelBox(p) {
  const box = UV_STATE.panelBox;
  if (!box) {
    p.style.width = ''; p.style.height = ''; p.style.maxHeight = ''; p.dataset.autoH = '1';
    UV_STATE.panelPosition = null;
    return;
  }
  const w = window.innerWidth;
  p.style.width = box.width ? `${Math.min(box.width, w - 20)}px` : '';
  p.style.height = box.height ? `${Math.max(220, Math.min(box.height, uvPanelBottomLimit() - 10))}px` : '';
  if (box.height) delete p.dataset.autoH; else p.dataset.autoH = '1';
  p.style.maxHeight = box.height ? 'calc(var(--vh,1vh)*100 - 20px)' : '';
  UV_STATE.panelPosition = { left: box.left, top: box.top };
}

function uvPlacePanel() {
  const p = UV_STATE.panel, anchor = UV_STATE.editBar;
  if (!p) return;
  /* Bảng chưa được người dùng kéo cỡ: cao tối đa 82% màn hình nhưng không quá chỗ trống phía trên thanh chỉnh sửa */
  /* Chiều cao CỐ ĐỊNH khi mở (03/11/2026): trước đây bảng co giãn theo nội dung → đổi khối, ẩn/hiện
     làm bảng đổi cỡ và nhảy lên. Nay bảng giữ 1 cỡ (tối đa UV_PANEL_H, không quá chỗ trống trên thanh chỉnh sửa);
     nội dung dài thì từng cột tự cuộn. Người dùng tự kéo cỡ thì giữ cỡ đó (không có dataset.autoH). */
  if (!p.style.height || p.dataset.autoH === '1') {
    p.dataset.autoH = '1';
    p.style.height = `${Math.max(300, Math.min(UV_PANEL_H, uvPanelBottomLimit() - 10))}px`;
  }
  if (UV_STATE.panelPosition) {
    const left = Math.max(0, Math.min(window.innerWidth - p.offsetWidth, UV_STATE.panelPosition.left));
    const top = Math.max(0, Math.min(uvPanelBottomLimit() - p.offsetHeight, UV_STATE.panelPosition.top));
    UV_STATE.panelPosition = { left, top };
    p.style.left = `${left}px`;
    p.style.top = `${top}px`;
    p.style.right = 'auto';
    uvFitPanel();
    return;
  }
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  p.style.top = Math.max(10, Math.round(r.top - p.offsetHeight - 8)) + 'px';
  p.style.right = Math.max(10, Math.round(window.innerWidth - r.right)) + 'px';
  p.style.left = 'auto';
  uvFitPanel();
}

/* Giữ cả bảng (kể cả hàng nút Hiện tất cả / Đóng) trong màn hình, mép dưới không xuống dưới thanh chỉnh sửa
   (03/11/2026: bảng đã kéo cỡ + mở thêm nhóm → dài quá mép dưới, mất hàng nút). Chiều cao tối đa tính từ VỊ TRÍ THẬT
   của bảng đến mép trên thanh chỉnh sửa; bảng quá dài thì đẩy lên trước, vẫn thiếu chỗ thì danh sách tự cuộn. */
function uvFitPanel() {
  const p = UV_STATE.panel;
  if (!p || !p.classList.contains('open')) return;
  const limit = uvPanelBottomLimit();
  let top = p.getBoundingClientRect().top;
  if (top + p.offsetHeight > limit) {
    top = Math.max(10, Math.round(limit - p.offsetHeight));
    p.style.top = `${top}px`;
    if (UV_STATE.panelPosition) UV_STATE.panelPosition = { left: UV_STATE.panelPosition.left, top };
  }
  const room = Math.max(220, Math.round(limit - top));
  p.style.maxHeight = `${room}px`;
  if (p.style.height && parseFloat(p.style.height) > room) p.style.height = `${room}px`;
}

function uvOpenPanel() {
  uvRenderPanel(true);
  const p = UV_STATE.panel;
  uvRestorePanelBox(p);
  p.classList.add('open');
  uvPlacePanel();
  /* Khối đang chọn nằm trong tầm nhìn của cột trái (trên điện thoại cột trái là hàng cuộn ngang) — làm SAU khi bảng hiện,
     lúc bảng còn ẩn thì trình duyệt chưa tính được vị trí để cuộn. */
  const roots = p.querySelector('.uv-roots'), on = p.querySelector('.uv-root-item.on');
  if (roots && on) {
    const rr = roots.getBoundingClientRect(), r = on.getBoundingClientRect();
    if (r.right > rr.right || r.left < rr.left) roots.scrollLeft += r.left - rr.left - 8;
    if (r.bottom > rr.bottom || r.top < rr.top) roots.scrollTop += r.top - rr.top - 8;
  }
}

function uvClosePanel() {
  /* Đóng bảng thì xóa ô tìm — lần mở sau thấy đủ danh sách, không bị lọc sẵn từ lần trước. */
  UV_STATE.query = '';
  if (UV_STATE.panel) UV_STATE.panel.classList.remove('open');
}

function uvTogglePanel(ev) {
  if (ev) ev.stopPropagation();
  const open = UV_STATE.panel && UV_STATE.panel.classList.contains('open');
  if (open) uvClosePanel(); else uvOpenPanel();
}

/* Hàm thuần (kiểm thử được): cú click ngoài bảng có được đóng bảng không. */
function uvShouldCloseOnDocClick(state) {
  return !(state && (state.ignoreNextClick || state.panelDrag || state.panelResize));
}

document.addEventListener('click', () => {
  const close = uvShouldCloseOnDocClick(UV_STATE);
  UV_STATE.ignoreNextClick = false;
  if (close) uvClosePanel();
});
/* Esc: đang mở hộp thoại/ngăn kéo của IOC thì để Esc cho hộp thoại đó; đang mở bảng chọn thì chỉ đóng bảng; bấm Esc
   lần nữa mới thoát chế độ chỉnh sửa. */
function uvEscAction(state) {
  if (state.overlayOpen) return 'none';
  if (state.panelOpen) return 'close-panel';
  if (state.editing) return 'exit-edit';
  return 'none';
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const overlay = document.getElementById('overlay');
  const action = uvEscAction({
    overlayOpen: !!(overlay && overlay.classList.contains('show')),
    panelOpen: !!(UV_STATE.panel && UV_STATE.panel.classList.contains('open')),
    editing: UV_STATE.editing
  });
  if (action === 'close-panel') uvClosePanel();
  else if (action === 'exit-edit') uvSetEditMode(false);
});
window.addEventListener('resize', () => { if (UV_STATE.panel && UV_STATE.panel.classList.contains('open')) uvPlacePanel(); });

/* Bản đồ Leaflet chỉ tự vẽ lại khi CỬA SỔ đổi cỡ. Khung bản đồ đổi cỡ vì lý do khác — thu gọn rồi mở lại khối GIS
   (nút −), ẩn/hiện khối bên cạnh, thanh cuộn trang xuất hiện — thì bản đồ vẫn giữ cỡ cũ (rà 02/11/2026: thu gọn rồi mở
   lại GIS → bản đồ tưởng mình 0×0, hiển thị sai). Theo dõi cỡ khung chứa bản đồ và báo bản đồ vẽ lại. */
(function uvWatchMapResize() {
  if (typeof ResizeObserver !== 'function' || typeof document.querySelector !== 'function') return;
  let frame = 0;
  const redraw = () => {
    frame = 0;
    const maps = [];
    try { if (typeof GM !== 'undefined' && GM.map) maps.push(GM.map); } catch (e) { /* chưa có bản đồ */ }
    try { if (window._gisMap && maps.indexOf(window._gisMap) < 0) maps.push(window._gisMap); } catch (e) { /* idem */ }
    try { if (typeof BTM !== 'undefined' && BTM.map) maps.push(BTM.map); } catch (e) { /* idem */ }
    maps.forEach((m) => { try { m.invalidateSize({ pan: false }); } catch (e) { /* bản đồ đang dựng */ } });
  };
  /* setTimeout thay requestAnimationFrame: rAF có thể bị trình duyệt tạm dừng (03/11/2026, bản đồ không vẽ lại trên máy anh Lương). */
  const ro = new ResizeObserver(() => { if (!frame) frame = setTimeout(redraw, 60); });
  const watch = () => ['#gismap', '#btctwMapWidget'].forEach((sel) => { const el = document.querySelector(sel); if (el) ro.observe(el); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();

/* Móc vào renderAll() (render-all.js): mỗi lần dựng lại màn hình (đăng nhập, đổi phạm vi xem...) thì nạp cấu hình của
   tài khoản đang dùng và áp lại — chạy SAU khi các hàm render* đã bật/tắt khối theo phân quyền. */
(function hookRenderAll() {
  if (typeof window.renderAll !== 'function' || window.renderAll.__uvHooked) return;
  const original = window.renderAll;
  const wrapped = function () {
    const out = original.apply(this, arguments);
    try { uvClosePanel(); uvLoad(); uvApply(true); } catch (e) { console.error('[ui-visibility]', e); }
    return out;
  };
  wrapped.__uvHooked = true;
  window.renderAll = wrapped;
})();
