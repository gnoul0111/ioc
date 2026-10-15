/* ====================================================================
 * Dashboard coordinator – IOC/CAD Trung ương (page tổng hợp)
 * File này chạy TRƯỚC các module script, cung cấp:
 *   1. Viewport height helper
 *   2. Dashboard clock & navigation
 *   3. Shared utility functions (toggleWidgetBody, modal, drawer, toast...)
 *      để các module con khi load không bị thiếu hàm
 * ==================================================================== */

/* ---------- Viewport height ---------- */
function setAppVh() {
    document.documentElement.style.setProperty(
        "--vh",
        window.innerHeight * 0.01 + "px",
    );
}
setAppVh();
window.addEventListener("resize", setAppVh);
window.addEventListener("orientationchange", setAppVh);

/* ---------- Dashboard Clock ---------- */
function updateDashClock() {
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, "0");
    var mm = String(now.getMinutes()).padStart(2, "0");
    var ss = String(now.getSeconds()).padStart(2, "0");
    var el = document.getElementById("dashClockTime");
    if (el) el.textContent = hh + ":" + mm + ":" + ss;

    var days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    var dd = String(now.getDate()).padStart(2, "0");
    var mo = String(now.getMonth() + 1).padStart(2, "0");
    var yy = now.getFullYear();
    var dateEl = document.getElementById("dashClockDate");
    if (dateEl) dateEl.textContent = days[now.getDay()] + ", " + dd + "/" + mo + "/" + yy;
}
updateDashClock();
setInterval(updateDashClock, 1000);

/* ---------- Nav scroll ---------- */
function scrollToSection(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- Number / Time formatters (shared) ---------- */
function fmt(n) {
    if (n == null) return "--";
    return Number(n).toLocaleString("vi-VN");
}
function cfmt(n) { return fmt(n); }

function dtTime(offset) {
    var d = new Date(Date.now() - offset);
    return (
        String(d.getHours()).padStart(2, "0") + ":" +
        String(d.getMinutes()).padStart(2, "0") + " " +
        String(d.getDate()).padStart(2, "0") + "/" +
        String(d.getMonth() + 1).padStart(2, "0") + "/" +
        d.getFullYear()
    );
}
function relTime(offset) {
    var s = Math.floor(offset / 1000);
    if (s < 60) return s + " giây trước";
    var m = Math.floor(s / 60);
    if (m < 60) return m + " phút trước";
    var h = Math.floor(m / 60);
    if (h < 24) return h + " giờ " + (m % 60) + " phút trước";
    var d = Math.floor(h / 24);
    return d + " ngày " + (h % 24) + " giờ trước";
}

/* ---------- Shared UI helpers ---------- */
function toggleWidgetBody(btn) {
    var box = btn.closest(".widget") || btn.closest(".widget-gd") || btn.closest(".top-overview");
    if (!box) return;
    var body = box.querySelector(".widget-body") || box.querySelector(".widget-body-gd");
    if (!body) return;
    body.classList.toggle("hidden");
    btn.textContent = body.classList.contains("hidden") ? "＋" : "−";
}

function toggleCustomizer() {
    var el = document.getElementById("customizer");
    if (el) el.classList.toggle("open");
}

/* -- Modal / Drawer (tongquan + data use standard IDs) -- */
function openModal() {
    document.getElementById("overlay").classList.add("show");
    document.getElementById("modal").classList.add("open");
}
function closeModal() {
    var m = document.getElementById("modal");
    if (m) m.classList.remove("open");
    var d = document.getElementById("drawer");
    if (!d || !d.classList.contains("open")) {
        var o = document.getElementById("overlay");
        if (o) o.classList.remove("show");
    }
    // Also close GIS demo modal
    var gm = document.getElementById("gisDemoModal");
    if (gm) gm.classList.remove("open");
    var go = document.getElementById("gisDemoOverlay");
    if (go) go.classList.remove("show");
}
function openDrawer() {
    document.getElementById("overlay").classList.add("show");
    document.getElementById("drawer").classList.add("open");
}
function closeDrawer() {
    var d = document.getElementById("drawer");
    if (d) d.classList.remove("open");
    if (typeof window.__drawerPieStatus !== 'undefined') {
        window.__drawerPieStatus = "";
    }
    var subtaskElem = document.querySelector(".subtask-summary");
    if (subtaskElem) subtaskElem.style.display = "block";
    if (window.__drawerFilterState) window.__drawerFilterState.status = "";
    var m = document.getElementById("modal");
    if (!m || !m.classList.contains("open")) {
        var o = document.getElementById("overlay");
        if (o) o.classList.remove("show");
    }
}
function closePanels() {
    closeDrawer();
    closeModal();
    toggleCustomizer();
}

/* -- Noti module uses its own prefixed functions -- */
function closePanelsNotify() {
    if (typeof closeDrawerNoti === "function") closeDrawerNoti();
    if (typeof closeModalNoti === "function") closeModalNoti();
}

/* -- Toast -- */
function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(window.__toast);
    window.__toast = setTimeout(function () { t.classList.remove("show"); }, 3000);
}

/* ---------- Placeholder for clock used by module scripts ---------- */
function updateClock() {
    updateDashClock();
}
