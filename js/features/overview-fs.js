/* ============================== TỔNG QUAN ĐIỀU HÀNH KHI PHÓNG TO: TỔNG QUAN TRÁI + DANH SÁCH PHẢI ==============================
   Anh chọn hướng 2 (07/11/2026): khi widget Tổng quan điều hành (#roleScopeCards) phóng to toàn màn hình
   (widget-fs.js), 3 nhóm Văn bản / Nhiệm vụ giao / Nhiệm vụ nhận xếp dọc bên trái; bấm một trạng thái (hoặc nút
   «Xem chi tiết», «Thêm nhiệm vụ») thì danh sách / form hiện ở khung bên phải (ô #overviewFsDetail, ghim bằng
   wfsDock() của widget-fs.js) thay vì mở đè kín màn — tổng quan vẫn còn nguyên bên trái.

   Anh dặn thêm: đang xem danh sách của nhóm nào thì CẢ KHUNG nhóm đó sáng viền màu khác để nhận ra ngay
   (.ovfs-sel), dòng trạng thái đang xem cũng được đánh dấu (.ovfs-sel-row). Đổi trạng thái ngay trong danh sách
   bên phải (vòng tròn / ô Trạng thái của danh sách) thì dòng đánh dấu bên trái đổi theo. Đóng danh sách → bỏ sáng.

   Vừa phóng to: mở sẵn «Chưa HT quá hạn · Nhiệm vụ nhận» để khung phải không trống.
   Màn hẹp (≤1000px): không ghim, danh sách mở cửa sổ như bình thường. Bố cục ở css/widget-fs.css (mục 1). */
(function () {
  const WID = 'roleScopeCards';
  const DOCK_MQ = window.matchMedia ? window.matchMedia('(min-width:1001px)') : { matches: true };
  const OPEN_RE = /open(List|OverviewPieSegment|OverviewTaskSegment|AssignmentForm)\(/;
  const TASK_CARDS = ['overview-assigned', 'overview-received'];
  const SEL = { card: null, key: null };
  const $ = (id) => document.getElementById(id);

  function on() { const w = $(WID); return !!(w && w.classList.contains('wfs-on')); }
  function panelOpen() { return !!document.querySelector('#drawer.open, #modal.open'); }
  function drawerOpen() { const d = $('drawer'); return !!(d && d.classList.contains('open')); }

  /* Ô giữ chỗ bên phải, nằm cạnh #pieGrid trong #overviewPieBody. renderSummary() chỉ vẽ lại #pieGrid nên ô còn
     nguyên; renderRoleScope() (đổi tài khoản) vẽ lại cả khung → tạo lại ô. */
  function ensureSlot() {
    const body = $('overviewPieBody'); if (!body) return null;
    let s = $('overviewFsDetail');
    if (!s || s.parentNode !== body) {
      s = document.createElement('div');
      s.id = 'overviewFsDetail'; s.className = 'overview-fs-detail'; s.setAttribute('aria-hidden', 'true');
      s.innerHTML = '<div class="notify-fs-empty">Bấm một trạng thái hoặc nút «Xem chi tiết» bên trái để xem danh sách</div>';
      body.appendChild(s);
    }
    return s;
  }
  function syncDock() { if (typeof wfsDock === 'function') wfsDock(on() && DOCK_MQ.matches ? ensureSlot() : null); }

  /* Khoá trạng thái của dòng cần đánh dấu: nhóm Nhiệm vụ giao/nhận lấy theo trạng thái danh sách đang lọc
     (drawerPieStatus của drawer-list.js — đổi trạng thái ngay trong danh sách thì dòng bên trái đổi theo). */
  function rowKey() {
    if (TASK_CARDS.includes(SEL.card) && drawerOpen() && typeof drawerPieStatus !== 'undefined') return drawerPieStatus || null;
    return SEL.key;
  }
  function apply() {
    const w = $(WID); if (!w) return;
    w.querySelectorAll('.ovfs-sel, .ovfs-sel-row').forEach((el) => el.classList.remove('ovfs-sel', 'ovfs-sel-row'));
    w.querySelectorAll('.pie-grid>.pie-card').forEach((c) => { if (on()) c.title = 'Bấm vào khung để xem toàn bộ danh sách'; else c.removeAttribute('title'); });
    if (!on() || !panelOpen()) { if (!panelOpen()) { SEL.card = null; SEL.key = null; } return; }
    const card = SEL.card && $(SEL.card); if (!card) return;
    card.classList.add('ovfs-sel');
    const k = rowKey(); if (!k) return;
    const row = [...card.querySelectorAll('.pie-legend button')].find((b) => (b.getAttribute('onclick') || '').includes(`'${k}')`));
    if (row) row.classList.add('ovfs-sel-row');
  }
  const applyLater = () => setTimeout(apply, 0);

  function openDefault() {
    if (!on() || !document.documentElement.classList.contains('wfs-dock') || panelOpen()) return;
    if (!$('overview-received') || typeof openOverviewTaskSegment !== 'function') return;
    SEL.card = 'overview-received'; SEL.key = 'overdue';
    openOverviewTaskSegment('received', 'overdue');
    applyLater();
    setTimeout(reveal, 60);
  }
  /* Màn thấp: cột trái cuộn được — đưa nhóm đang xem vào tầm nhìn (chỉ cuộn cột trái, không đụng cuộn trang). */
  function reveal() {
    const grid = $('pieGrid'), card = SEL.card && $(SEL.card); if (!grid || !card) return;
    const g = grid.getBoundingClientRect(), c = card.getBoundingClientRect();
    if (c.bottom > g.bottom) grid.scrollTop += c.bottom - g.bottom + 4;
    else if (c.top < g.top) grid.scrollTop -= g.top - c.top + 4;
  }

  document.addEventListener('wfs:change', (e) => {
    if (!e.detail || e.detail.id !== WID) return;
    if (e.detail.on) {
      syncDock();
      setTimeout(() => { if (typeof wfsDockPlace === 'function') wfsDockPlace(); openDefault(); }, 320);
    } else { SEL.card = null; SEL.key = null; apply(); }
  });

  /* Anh dặn (07/11/2026): bấm vào cả khung nhóm (tên, vòng tròn, chỗ trống) → mở TOÀN BỘ danh sách của nhóm đó.
     Dùng đúng các danh sách đang có: Nhiệm vụ giao = nút «Xem chi tiết»; Nhiệm vụ nhận = danh sách nhiệm vụ nhận
     (theo trục đang chọn ở khung); Văn bản = văn bản đến + đi. */
  function openCardAll(cardId) {
    if (typeof openList !== 'function') return;
    const who = (typeof currentAccount !== 'undefined' && currentAccount && currentAccount.title) || '';
    const axis = (m) => (window.__overviewAxisSel && window.__overviewAxisSel[m]) || null;
    const axisName = (r) => (r && typeof roleMeta === 'function' ? roleMeta(r).name : who);
    if (cardId === 'overview-documents') openList({ metricIn: ['docIn', 'docOut'], title: `Văn bản đến/đi · ${who}` });
    else if (cardId === 'overview-assigned') { const r = axis('assigned'); openList({ metric: 'assigned', role: r, title: `Nhiệm vụ giao · ${axisName(r)}` }); }
    else if (cardId === 'overview-received') { const r = axis('received'); openList({ metric: 'received', role: r, title: `Nhiệm vụ nhận · ${axisName(r)}` }); }
  }
  /* Lát vòng tròn → dòng trạng thái cùng tên (biểu đồ bỏ các lát bằng 0 nên không so theo thứ tự). */
  const legendKey = (card, label) => {
    const b = [...card.querySelectorAll('.pie-legend button')].find((x) => (x.querySelector('span') || {}).textContent === label);
    const m = b && (b.getAttribute('onclick') || '').match(/'([^']+)'\)\s*$/); return m ? m[1] : null;
  };

  // Pha bắt: ghi lại nhóm + trạng thái vừa bấm (trước khi onclick mở danh sách).
  document.addEventListener('click', (e) => {
    if (!on() || !e.target.closest) return;
    const card = e.target.closest('#' + WID + ' .pie-card');
    const act = e.target.closest('[onclick], button, input, select, a, .ms-wrap, .ms-dropdown');
    if (card && act && card.contains(act)) {
      if (OPEN_RE.test(act.getAttribute('onclick') || '')) {
        const m = (act.getAttribute('onclick') || '').match(/open(?:OverviewPieSegment|OverviewTaskSegment)\('[^']*',\s*'([^']+)'\)/);
        SEL.card = card.id; SEL.key = m ? m[1] : null;
      }
    } else if (card && card.id) {
      // Bấm vào một lát của vòng tròn → biểu đồ tự mở danh sách trạng thái đó; chỉ ghi lại để sáng viền.
      let seg = null;
      if (e.target.tagName === 'CANVAS' && typeof Chart !== 'undefined' && Chart.getChart) {
        const ch = Chart.getChart(e.target);
        try { const els = ch ? ch.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false) : []; if (els.length) seg = String(ch.data.labels[els[0].index]); } catch (err) { /* bỏ qua */ }
      }
      SEL.card = card.id;
      if (seg !== null) SEL.key = legendKey(card, seg);
      else { SEL.key = null; openCardAll(card.id); }   // chỗ trống của khung → toàn bộ danh sách
    }
    if (panelOpen() || SEL.card) applyLater(); // bấm trong danh sách (đổi trạng thái) → cập nhật dòng đánh dấu
  }, true);

  // Danh sách / chi tiết đóng hay mở → cập nhật sáng viền.
  function watchPanels() {
    if (typeof MutationObserver === 'undefined') return;
    ['drawer', 'modal'].forEach((pid) => { const el = $(pid); if (el) new MutationObserver(applyLater).observe(el, { attributes: true, attributeFilter: ['class'] }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchPanels); else watchPanels();

  // Các nhóm vừa vẽ lại (đổi trục, đổi tài khoản…) trong lúc phóng to → giữ ô bên phải và sáng viền.
  document.addEventListener('overview:render', () => { if (on()) { syncDock(); applyLater(); } });
  if (DOCK_MQ.addEventListener) DOCK_MQ.addEventListener('change', () => { if (on()) syncDock(); });
})();
