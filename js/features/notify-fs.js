/* ============================== NOTIFY KHI PHÓNG TO: DANH SÁCH + CHI TIẾT BÊN PHẢI ==============================
   Anh chọn cách B (07/11/2026): khi widget Notify (#notificationsWidget) phóng to toàn màn hình (widget-fs.js),
   bên trái là danh sách thông báo (1 cột), bên phải là chi tiết của thông báo đang chọn — không mở cửa sổ đè lên.

   Chi tiết Nhiệm vụ / Văn bản / GIS / Camera AI / OKR-KPI vốn đều mở trong cửa sổ chung #modal; lúc Notify phóng to,
   cửa sổ được ghim vào ô #notifyFsDetail bên phải bằng wfsDock() (widget-fs.js). Bấm thông báo khác → chi tiết đổi
   tại chỗ. Notify CAD mở màn điều phối riêng của CAD, giữ nguyên. Màn hẹp (≤1000px) không ghim: chi tiết mở cửa sổ
   như bình thường. Bố cục ở css/widget-fs.css (mục 3). */
(function () {
  const WID = 'notificationsWidget';
  const DOCK_MQ = window.matchMedia ? window.matchMedia('(min-width:1001px)') : { matches: true };
  const DETAIL_RE = /open(RecordDetail|GisEformDetail|NoticeCameraDetail|IndicatorDetail)\(/;
  const $ = (id) => document.getElementById(id);
  const html = document.documentElement;

  function nfsOn() { const w = $(WID); return !!(w && w.classList.contains('wfs-on')); }
  function docked() { return html.classList.contains('wfs-dock'); }
  function modalOpen() { const m = $('modal'); return !!(m && m.classList.contains('open')); }
  function syncDock() { if (typeof wfsDock === 'function') wfsDock(nfsOn() && DOCK_MQ.matches ? $('notifyFsDetail') : null); }
  function clearSel() { document.querySelectorAll('#myTaskList .notify.nfs-sel').forEach((b) => b.classList.remove('nfs-sel')); }

  /* Mở sẵn thông báo đầu danh sách (nếu nó mở chi tiết ở khung phải được) để khung phải không trống. */
  function openFirst() {
    if (!nfsOn() || !docked() || modalOpen()) return;
    const first = document.querySelector('#myTaskList .notify');
    if (first && DETAIL_RE.test(first.getAttribute('onclick') || '')) first.click();
  }

  document.addEventListener('wfs:change', (e) => {
    if (!e.detail || e.detail.id !== WID) return;
    if (e.detail.on) {
      syncDock();
      if (typeof renderMyTasksNotify === 'function') renderMyTasksNotify(); // vẽ lại để hiện số trên tab
      if (typeof noiResetListScroll === 'function') noiResetListScroll();
      setTimeout(() => { if (typeof wfsDockPlace === 'function') wfsDockPlace(); openFirst(); }, 320);
    } else {
      clearSel(); // widget-fs.js đã bỏ ghim và đóng chi tiết
      if (typeof renderMyTasksNotify === 'function') renderMyTasksNotify();
    }
  });

  // Đánh dấu thông báo đang xem. Pha bắt (true): chạy trước onclick của nút — bấm tab thì dải tab bị vẽ lại ngay
  // trong onclick, sau đó không còn dò ngược được nút đã bấm nằm trong #notiTabsBox nữa.
  document.addEventListener('click', (e) => {
    if (!nfsOn() || !e.target.closest) return;
    const b = e.target.closest('#myTaskList .notify');
    if (b) { clearSel(); if (DETAIL_RE.test(b.getAttribute('onclick') || '')) b.classList.add('nfs-sel'); return; }
    // Đổi tab trong lúc phóng to → mở sẵn thông báo đầu của tab mới.
    if (e.target.closest('#notiTabsBox .gis-report-tab')) {
      if (docked() && modalOpen() && typeof closeModal === 'function') closeModal();
      setTimeout(openFirst, 0);
    }
  }, true);

  // Cửa sổ chi tiết đóng (nút ×, Esc) → bỏ đánh dấu.
  function watchModal() {
    const m = $('modal'); if (!m || typeof MutationObserver === 'undefined') return;
    new MutationObserver(() => { if (!modalOpen()) clearSel(); }).observe(m, { attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchModal); else watchModal();
  if (DOCK_MQ.addEventListener) DOCK_MQ.addEventListener('change', () => { if (nfsOn()) syncDock(); });

  window.nfsActive = nfsOn;
})();
