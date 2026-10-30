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
  { id: 'assignPopup', icon: '📨', label: 'Cửa sổ giao nhiệm vụ',          virtual: true },
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

const UV_STATE = { hidden: [], key: null, panel: null, editing: false, editBar: null, collapsed: [], panelPosition: null, panelDrag: null };

function uvAccountKey() {
  let who = 'guest';
  try { if (typeof currentAccount !== 'undefined' && currentAccount) who = currentAccount.user || currentAccount.title || 'guest'; } catch (e) { /* chưa đăng nhập */ }
  return UV_STORAGE_PREFIX + who;
}

function uvLoad() {
  UV_STATE.key = uvAccountKey();
  let ids = [];
  try {
    const raw = localStorage.getItem(UV_STATE.key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.hidden)) ids = parsed.hidden;
  } catch (e) { /* localStorage bị chặn hoặc dữ liệu hỏng → coi như hiện đủ */ }
  UV_STATE.hidden = ids.filter((id) => typeof id === 'string');
}

function uvSave() {
  try { localStorage.setItem(UV_STATE.key || uvAccountKey(), JSON.stringify({ hidden: UV_STATE.hidden })); } catch (e) { /* bỏ qua */ }
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
  const hiddenCount = avail.length - shown.length;

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
}

function uvSyncEditControls() {
  uvAllBlocks().forEach((block) => {
    const el = uvEl(block);
    if (!el) return;
    const available = uvAvailable(block);
    el.classList.toggle('uv-editable', UV_STATE.editing && available);
    if (block.dynamic && el.tagName === 'BUTTON') {
      el.classList.toggle('uv-hide-action', UV_STATE.editing && available);
      if (!el.dataset.uvHideBound) {
        el.dataset.uvHideBound = '1';
        el.addEventListener('click', (event) => {
          if (!UV_STATE.editing || !el.classList.contains('uv-editable')) return;
          const rect = el.getBoundingClientRect();
          if (event.clientX > rect.left + 32 || event.clientY > rect.top + 32) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          uvSetVisible(block.id, false);
        }, true);
      }
      return;
    }
    let control = el.querySelector('.uv-remove');
    if (UV_STATE.editing && available) {
      if (!control) {
        control = document.createElement('button');
        control.type = 'button';
        control.className = 'uv-remove';
        control.title = `Ẩn ${block.label}`;
        control.setAttribute('aria-label', `Ẩn ${block.label}`);
        control.innerHTML = '<i class="ti ti-minus" aria-hidden="true"></i>';
        control.addEventListener('click', (event) => {
          event.stopPropagation();
          uvSetVisible(block.id, false);
        });
        el.appendChild(control);
      }
    } else if (control) {
      control.remove();
    }
  });

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
      bar.innerHTML = '<b>Chỉnh sửa màn hình</b><button type="button" class="ghost" onclick="uvTogglePanel(event)"><i class="ti ti-eye" aria-hidden="true"></i> Ẩn/Hiện</button><button type="button" class="primary" onclick="uvSetEditMode(false)">Xong</button>';
      document.body.appendChild(bar);
      UV_STATE.editBar = bar;
    }
    UV_STATE.editBar.classList.add('open');
  } else if (UV_STATE.editBar) {
    UV_STATE.editBar.classList.remove('open');
  }
}

function openUiEditMode() {
  if (typeof toggleAccountMenu === 'function') toggleAccountMenu(false);
  uvSetEditMode(true);
}

function uvAssignmentPopupHidden() {
  return UV_STATE.hidden.includes('assignPopup');
}

function uvShowAll() {
  UV_STATE.hidden = [];
  uvSave();
  uvApply(true);
  uvRenderPanel();
}

/* ---------- Bảng chọn ---------- */
function uvEnsurePanel() {
  if (UV_STATE.panel) return UV_STATE.panel;
  const p = document.createElement('div');
  p.id = 'uvPanel';
  p.className = 'uv-panel';
  p.setAttribute('role', 'dialog');
  p.setAttribute('aria-label', 'Ẩn/Hiện giao diện');
  p.addEventListener('click', (e) => e.stopPropagation());
  p.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.uv-head') || event.button !== 0) return;
    const rect = p.getBoundingClientRect();
    UV_STATE.panelDrag = { pointerId: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.preventDefault();
  });
  document.addEventListener('pointermove', (event) => {
    const drag = UV_STATE.panelDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const left = Math.max(0, Math.min(window.innerWidth - p.offsetWidth, event.clientX - drag.x));
    const top = Math.max(0, Math.min(window.innerHeight - p.offsetHeight, event.clientY - drag.y));
    UV_STATE.panelPosition = { left, top };
    p.style.left = `${left}px`;
    p.style.top = `${top}px`;
    p.style.right = 'auto';
  });
  const stopDrag = (event) => {
    if (UV_STATE.panelDrag && UV_STATE.panelDrag.pointerId === event.pointerId) UV_STATE.panelDrag = null;
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
  const collapsed = UV_STATE.collapsed.includes(block.id);
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

function uvRenderPanel() {
  const p = uvEnsurePanel();
  const hid = new Set(UV_STATE.hidden);
  const avail = uvAvailableBlocks();
  const tree = uvBuildTree(avail);
  const rows = tree.length
    ? tree.map((node) => uvPanelNodeHtml(node, hid, 0)).join('')
    : '<div class="uv-none">Tài khoản này chưa có nội dung nào để ẩn/hiện.</div>';
  p.innerHTML = '<div class="uv-head"><b>👁 Ẩn/Hiện giao diện</b>'
    + '<small>Kéo tiêu đề để di chuyển. Bấm mũi tên để thu gọn hoặc mở nhóm.</small></div>'
    + `<div class="uv-list">${rows}</div>`
    + '<div class="uv-foot"><button type="button" class="ghost" onclick="uvShowAll()">Hiện tất cả</button>'
    + '<button type="button" class="ghost" onclick="uvClosePanel()">Đóng</button></div>';
  p.querySelectorAll('input[data-uv-id]').forEach((inp) => {
    inp.addEventListener('change', () => {
      uvSetVisible(inp.getAttribute('data-uv-id'), inp.checked);
      uvRenderPanel();
    });
  });
  p.querySelectorAll('button[data-uv-collapse]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-uv-collapse');
      const collapsed = new Set(UV_STATE.collapsed);
      if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id);
      UV_STATE.collapsed = [...collapsed];
      uvRenderPanel();
    });
  });
}

function uvPlacePanel() {
  const p = UV_STATE.panel, anchor = UV_STATE.editBar;
  if (!p) return;
  if (UV_STATE.panelPosition) {
    const left = Math.max(0, Math.min(window.innerWidth - p.offsetWidth, UV_STATE.panelPosition.left));
    const top = Math.max(0, Math.min(window.innerHeight - p.offsetHeight, UV_STATE.panelPosition.top));
    UV_STATE.panelPosition = { left, top };
    p.style.left = `${left}px`;
    p.style.top = `${top}px`;
    p.style.right = 'auto';
    return;
  }
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  p.style.top = Math.max(10, Math.round(r.top - p.offsetHeight - 8)) + 'px';
  p.style.right = Math.max(10, Math.round(window.innerWidth - r.right)) + 'px';
  p.style.left = 'auto';
}

function uvOpenPanel() {
  uvRenderPanel();
  const p = UV_STATE.panel;
  p.classList.add('open');
  uvPlacePanel();
}

function uvClosePanel() {
  if (UV_STATE.panel) UV_STATE.panel.classList.remove('open');
}

function uvTogglePanel(ev) {
  if (ev) ev.stopPropagation();
  const open = UV_STATE.panel && UV_STATE.panel.classList.contains('open');
  if (open) uvClosePanel(); else uvOpenPanel();
}

document.addEventListener('click', () => uvClosePanel());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { uvClosePanel(); uvSetEditMode(false); } });
window.addEventListener('resize', () => { if (UV_STATE.panel && UV_STATE.panel.classList.contains('open')) uvPlacePanel(); });

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

(function hookAssignmentForm() {
  if (typeof window.openAssignmentForm !== 'function' || window.openAssignmentForm.__uvHooked) return;
  const original = window.openAssignmentForm;
  const wrapped = function () {
    if (uvAssignmentPopupHidden()) {
      if (typeof toast === 'function') toast('Cửa sổ giao nhiệm vụ đang bị ẩn. Bật lại trong Ẩn/Hiện.');
      return;
    }
    return original.apply(this, arguments);
  };
  wrapped.__uvHooked = true;
  window.openAssignmentForm = wrapped;
})();
