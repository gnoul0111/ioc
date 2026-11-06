/* ============================== PHÓNG TO TOÀN MÀN HÌNH TỪNG WIDGET ==============================
   Nút ⛶ ở đầu 4 widget màn hình Thành phố: Tổng quan điều hành (#roleScopeCards), Bản đồ GIS (#gismap),
   Notify (#notificationsWidget), Nhóm chỉ tiêu (#indicatorsWidget). Hai widget Trung ương (Kiểm đếm nhiệm vụ,
   Bản đồ số toàn quốc) giữ cách riêng của chúng, không dùng file này.

   Cách làm:
   - Cả TRANG vào toàn màn hình của trình duyệt (Fullscreen API trên <html>, như bấm F11), rồi widget phủ kín bằng
     lớp CSS .wfs-on. Không cho riêng widget vào Fullscreen API: popup/drawer chi tiết nằm ngoài widget sẽ không hiện.
   - Widget phủ ở z-index 85: dưới overlay (90), drawer (100), modal (110) → bấm xem chi tiết vẫn mở lên trên.
   - Phím Esc: Chrome/Edge khoá phím Esc (Keyboard Lock) → bấm Esc đóng popup đang mở trước, không có popup thì thu
     widget; GIỮ Esc thì trình duyệt tự thoát toàn màn hình. Firefox/Safari: Esc là trình duyệt thoát luôn.
     Thoát toàn màn hình bằng bất cứ cách nào (Esc, F11, nút) thì widget cũng thu về (sự kiện fullscreenchange).
   - Trình duyệt không cho vào toàn màn hình (iPhone, khung nhúng) → widget vẫn phủ kín trong trang.
   - Bố cục khi phóng to của từng widget ở css/widget-fs.css. */
(function () {
  const WFS_IDS = ['roleScopeCards', 'gismap', 'notificationsWidget', 'indicatorsWidget'];
  const WFS = { id: null, ownFs: false, escLocked: false, popupAtDown: false };
  const ICON_EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>';
  const ICON_SHRINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"/></svg>';

  const $ = (id) => document.getElementById(id);
  const headOf = (w) => w && w.querySelector(':scope > .widget-head, :scope > .top-overview-head');
  const bodyOf = (w) => w && w.querySelector(':scope > .widget-body, :scope > .top-overview-body');

  function setBtn(btn, on) {
    if (!btn) return;
    btn.classList.toggle('wfs-btn-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) {
      const key = WFS.escLocked ? 'giữ Esc' : 'Esc';
      btn.innerHTML = ICON_SHRINK + '<span>Thoát toàn màn hình</span><kbd>' + key + '</kbd>';
      btn.title = 'Thoát toàn màn hình (' + key + ')';
    } else {
      btn.innerHTML = ICON_EXPAND;
      btn.title = 'Phóng to toàn màn hình';
    }
    btn.setAttribute('aria-label', btn.title);
  }

  /* Gắn nút ⛶ vào đầu khung, ngay trước nút thu gọn (−) nếu có. Gọi nhiều lần không sao (chỉ gắn 1 lần). */
  function wfsMountButtons() {
    WFS_IDS.forEach((id) => {
      const w = $(id), head = headOf(w);
      if (!head || head.querySelector('.wfs-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mini-btn wfs-btn';
      btn.addEventListener('click', (e) => { e.stopPropagation(); wfsToggle(id); });
      setBtn(btn, WFS.id === id);   // đầu khung bị vẽ lại trong lúc đang phóng to → nút giữ đúng trạng thái
      const collapse = head.querySelector('[onclick^="toggleWidgetBody"]');
      if (collapse) collapse.parentNode.insertBefore(btn, collapse); else head.appendChild(btn);
    });
  }

  /* Vẽ lại những thứ đo kích thước theo khung: bản đồ Leaflet, biểu đồ Chart.js, dải tab tự co của Nhóm chỉ tiêu. */
  function wfsRefresh(w) {
    if (!w) return;
    try { if (w.id === 'gismap' && typeof GM !== 'undefined' && GM.map) GM.map.invalidateSize(); } catch (e) { /* bỏ qua */ }
    if (typeof Chart !== 'undefined' && Chart.getChart) {
      w.querySelectorAll('canvas').forEach((c) => { const ch = Chart.getChart(c); if (ch) { ch.resize(); ch.update('none'); } });
    }
    window.dispatchEvent(new Event('resize'));
  }
  function wfsRefreshLater(w) { [60, 260].forEach((t) => setTimeout(() => wfsRefresh(w), t)); }

  function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }

  function enterBrowserFs() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req || fsElement()) return;
    let p;
    try { p = req.call(el, { navigationUI: 'hide' }); } catch (e) { return; }
    WFS.ownFs = true;
    Promise.resolve(p).then(() => {
      if (navigator.keyboard && typeof navigator.keyboard.lock === 'function') {
        return navigator.keyboard.lock(['Escape']).then(() => {
          WFS.escLocked = true;
          const w = $(WFS.id); if (w) setBtn(w.querySelector('.wfs-btn'), true);
        });
      }
    }).catch(() => { WFS.ownFs = !!fsElement(); });
  }

  function exitBrowserFs() {
    if (navigator.keyboard && typeof navigator.keyboard.unlock === 'function') { try { navigator.keyboard.unlock(); } catch (e) { /* bỏ qua */ } }
    WFS.escLocked = false;
    if (WFS.ownFs && fsElement()) {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) { try { Promise.resolve(ex.call(document)).catch(() => {}); } catch (e) { /* bỏ qua */ } }
    }
    WFS.ownFs = false;
  }

  function wfsEnter(id) {
    const w = $(id); if (!w || w.classList.contains('hidden')) return;
    if (WFS.id && WFS.id !== id) wfsExit({ keepBrowserFs: true });
    // Widget đang thu gọn (nút −) thì mở ra trước, trả nút về '−' cho khớp trạng thái.
    const body = bodyOf(w);
    if (body && body.classList.contains('hidden')) {
      body.classList.remove('hidden');
      const c = headOf(w) && headOf(w).querySelector('[onclick^="toggleWidgetBody"]'); if (c) c.textContent = '−';
    }
    WFS.id = id;
    w.classList.add('wfs-on');
    document.documentElement.classList.add('wfs-active');
    if (typeof lockScroll === 'function') lockScroll();
    setBtn(w.querySelector('.wfs-btn'), true);
    enterBrowserFs();
    wfsRefreshLater(w);
  }

  function wfsExit(opt) {
    const id = WFS.id; if (!id) return;
    const w = $(id);
    WFS.id = null;
    if (w) { w.classList.remove('wfs-on'); setBtn(w.querySelector('.wfs-btn'), false); }
    document.documentElement.classList.remove('wfs-active');
    if (!(opt && opt.keepBrowserFs)) exitBrowserFs();
    if (typeof unlockScroll === 'function') unlockScroll();
    if (w) wfsRefreshLater(w);
  }

  function wfsToggle(id) { if (WFS.id === id) wfsExit(); else wfsEnter(id); }

  /* Popup/ngăn chi tiết đang mở phía trên widget (Esc lúc đó dành để đóng popup, không thu widget). */
  function modulePopupOpen() {
    return (typeof CTM_UI !== 'undefined' && CTM_UI.open) || (typeof STC_UI !== 'undefined' && STC_UI.open)
      || (typeof SGD_UI !== 'undefined' && SGD_UI.open) || (typeof HCC_UI !== 'undefined' && HCC_UI.open)
      || (typeof CAD !== 'undefined' && CAD.open) || (typeof IX !== 'undefined' && IX.open) || (typeof MC !== 'undefined' && MC.open);
  }
  function genericPopupOpen() { return !!document.querySelector('#drawer.open, .modal.open'); }
  function mapPopupOpen() { const w = $(WFS.id); return !!(w && w.querySelector('.leaflet-popup')); }
  function anyPopupOpen() { return modulePopupOpen() || genericPopupOpen() || mapPopupOpen(); }

  // Pha bắt (chạy trước mọi xử lý Esc khác): ghi lại lúc bấm có popup nào đang mở không.
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !WFS.id) return;
    WFS.popupAtDown = anyPopupOpen();
  }, true);
  // Pha nổi trên window (chạy SAU các xử lý Esc của từng màn ở document):
  // - lúc bấm không có popup → thu widget;
  // - có popup của màn riêng (chỉ tiêu, CAD, xuất báo cáo…) → màn đó tự đóng, ở đây không làm gì;
  // - chỉ có drawer/modal chung (vốn không có Esc) → đóng lớp trên cùng; thẻ thông tin trên bản đồ → đóng thẻ.
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !WFS.id) return;
    if (!WFS.popupAtDown) { e.preventDefault(); wfsExit(); return; }
    if (e.defaultPrevented || modulePopupOpen()) return;
    const modal = $('modal'), drawer = $('drawer');
    if (modal && modal.classList.contains('open')) { if (typeof closeModal === 'function') closeModal(); return; }
    if (drawer && drawer.classList.contains('open')) { if (typeof closeDrawer === 'function') closeDrawer(); return; }
    if (mapPopupOpen() && typeof GM !== 'undefined' && GM.map) GM.map.closePopup();
  });

  // Thoát toàn màn hình bằng cách khác (giữ Esc, F11, Esc trên Firefox/Safari) → thu widget về.
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, () => {
    if (!fsElement() && WFS.id && WFS.ownFs) { WFS.ownFs = false; wfsExit(); }
  }));
  window.addEventListener('resize', () => { if (WFS.id) { const w = $(WFS.id); try { if (w && w.id === 'gismap' && GM.map) GM.map.invalidateSize(); } catch (e) { /* bỏ qua */ } } });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wfsMountButtons); else wfsMountButtons();

  window.wfsToggle = wfsToggle;
  window.wfsEnter = wfsEnter;
  window.wfsExit = wfsExit;
  window.wfsActive = () => WFS.id;
  window.wfsMountButtons = wfsMountButtons;
})();
