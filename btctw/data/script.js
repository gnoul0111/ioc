/* ============================== UTILITY FUNCTIONS (shared) ============================== */
/* Các hàm này được dùng bởi renderSources / openSourceDetail nhưng gốc nằm ở file chung.
   Khi chạy standalone (iframe), cần khai báo ở đây. Guard typeof để không đè nếu đã có. */
if (typeof pad === 'undefined') { function pad(n) { return String(n).padStart(2, '0'); } window.pad = pad; }
if (typeof fmt === 'undefined') { function fmt(n) { return Number(n).toLocaleString('vi-VN'); } window.fmt = fmt; }
if (typeof dtTime === 'undefined') {
    function dtTime(offsetMs) {
        var d = new Date(Date.now() - offsetMs);
        return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    }
    window.dtTime = dtTime;
}
if (typeof relTime === 'undefined') {
    function relTime(offsetMs) {
        var s = Math.floor(offsetMs / 1000);
        if (s < 60) return s + ' giây trước';
        var m = Math.floor(s / 60);
        if (m < 60) return m + ' phút trước';
        var h = Math.floor(m / 60), mm = m % 60;
        if (h < 24) return h + ' giờ' + (mm ? ' ' + mm + ' phút' : '') + ' trước';
        var dd = Math.floor(h / 24), hh = h % 24;
        return dd + ' ngày' + (hh ? ' ' + hh + ' giờ' : '') + ' trước';
    }
    window.relTime = relTime;
}
if (typeof openModal === 'undefined') {
    function openModal() {
        var o = document.getElementById('overlay'); if (o) o.classList.add('show');
        var m = document.getElementById('modal'); if (m) m.classList.add('open');
    }
    window.openModal = openModal;
}
if (typeof closeModal === 'undefined') {
    function closeModal() {
        var m = document.getElementById('modal'); if (m) m.classList.remove('open');
        var d = document.getElementById('drawer');
        if (!d || !d.classList.contains('open')) { var o = document.getElementById('overlay'); if (o) o.classList.remove('show'); }
    }
    window.closeModal = closeModal;
}
if (typeof closePanels === 'undefined') {
    function closePanels() { if (typeof closeModal === 'function') closeModal(); }
    window.closePanels = closePanels;
}
if (typeof toast === 'undefined') {
    function toast(msg) {
        var t = document.getElementById('toast'); if (!t) return;
        t.textContent = msg; t.classList.add('show');
        clearTimeout(window.__toast);
        window.__toast = setTimeout(function () { t.classList.remove('show'); }, 3000);
    }
    window.toast = toast;
}
if (typeof toggleWidgetBody === 'undefined') {
    function toggleWidgetBody(btn) {
        var box = btn.closest('.widget') || btn.closest('.top-overview');
        if (!box) return;
        var body = box.querySelector('.widget-body');
        if (!body) return;
        body.classList.toggle('hidden');
        btn.textContent = body.classList.contains('hidden') ? '＋' : '−';
    }
    window.toggleWidgetBody = toggleWidgetBody;
}
/* Default account nếu chưa có (standalone mode) */
if (typeof currentRole === 'undefined') var currentRole = 'DANG';
if (typeof currentAccount === 'undefined') var currentAccount = { title: 'Thành ủy', subtitle: 'Bí thư Thành ủy · xem tất cả' };

function setAppVh() {
    document.documentElement.style.setProperty(
        "--vh",
        window.innerHeight * 0.01 + "px",
    );
}
setAppVh();
window.addEventListener("resize", setAppVh);
window.addEventListener("orientationchange", setAppVh);

/* ============================== DATA TĨNH ============================== */
const axisMeta = {
    DANG: {
        name: "Thành ủy",
        icon: "🚩",
        color: "#e84d5b",
        desc: "Thường trực Thành ủy · xem tất cả 04 trục",
        scope: "all",
    },
    HDND: {
        name: "HĐND TP",
        icon: "🏛️",
        color: "#f59e0b",
        desc: "Chủ tịch HĐND Thành phố · chỉ xem HĐND",
        scope: "own",
    },
    UBND: {
        name: "UBND TP",
        icon: "🏢",
        color: "#2fb174",
        desc: "Chủ tịch UBND Thành phố · UBND đầy đủ + HĐND/MTTQ chỉ số",
        scope: "ubnd",
    },
    MTTQ: {
        name: "MTTQ TP",
        icon: "🤝",
        color: "#8b5cf6",
        desc: "Chủ tịch UB MTTQ Thành phố · chỉ xem MTTQ",
        scope: "own",
    },
};

/* Phân tổ (breakdown) của 1 chỉ tiêu: P = tách theo nhóm cùng đơn vị (vẽ dạng thanh %); S = các số liệu độc lập khác đơn vị (vẽ dạng thẻ KPI) */
function P(dim, items) {
    return {
        dim,
        type: "bar",
        items: items.map((x) => ({ label: x[0], value: x[1] })),
    };
}
function S(dim, items) {
    return {
        dim,
        type: "stat",
        items: items.map((x) => ({ label: x[0], value: x[1] })),
    };
}


// ====================== NGUỒN DỮ LIỆU & CẬP NHẬT ============================== */
const sourceDefs = [
    {
        key: "api",
        icon: "🔌",
        name: "API realtime",
        desc: "Một cửa, văn bản, DVC quốc gia, đồng bộ nhiệm vụ",
        count: "98%",
        mode: "API Gateway / Webhook",
        freq: "Realtime / mỗi 1 phút",
        owner: "Văn phòng UBND phường",
        offset: 3 * 60 * 1000 + 28 * 1000,
        quality: "99,1%",
        rows: 642,
        status: "ok",
    },
    {
        key: "excel",
        icon: "📗",
        name: "Excel import",
        desc: "Báo cáo chuyên môn, đoàn thể, mẫu khảo sát xã/phường",
        count: "42 file",
        mode: "Import Excel có kiểm tra schema",
        freq: "Khi phát sinh / cuối ngày",
        owner: "Cán bộ tổng hợp IOC",
        offset: 2 * 60 * 60 * 1000 + 16 * 60 * 1000,
        quality: "96,4%",
        rows: 187,
        status: "late",
    },
    {
        key: "db",
        icon: "🗄️",
        name: "CSDL chuyên ngành",
        desc: "Tài chính, giáo dục, nội vụ, đô thị, GPMB, văn hóa",
        count: "12 nguồn",
        mode: "Adapter / ETL delta",
        freq: "15 phút / theo lịch",
        owner: "Đơn vị chuyên môn",
        offset: 18 * 60 * 1000 + 15 * 1000,
        quality: "98,7%",
        rows: 1248,
        status: "ok",
    },
    {
        key: "docs",
        icon: "📎",
        name: "Văn bản/PDF",
        desc: "Nghị quyết, kết luận, minh chứng, phụ lục, hồ sơ số hóa",
        count: "165",
        mode: "DMS / OCR chỉ mục",
        freq: "Ngày / khi phát hành",
        owner: "Văn phòng Đảng ủy-HĐND-UBND",
        offset: 26 * 60 * 60 * 1000 + 8 * 60 * 1000,
        quality: "94,8%",
        rows: 305,
        status: "stale",
    },
    {
        key: "alert",
        icon: "🔔",
        name: "Cảnh báo IOC",
        desc: "Điểm nghẽn, cháy nổ, quá hạn, sắp hạn, lịch họp cần nhắc",
        count: "27",
        mode: "Rule engine",
        freq: "Realtime / sự kiện",
        owner: "Trực IOC/CAD",
        offset: 46 * 1000,
        quality: "99,6%",
        rows: 189,
        status: "ok",
    },
    {
        key: "calendar",
        icon: "📅",
        name: "Lịch công tác/kỳ họp",
        desc: "Lịch Đảng ủy, HĐND, UBND, MTTQ; nhắc họp vai trò thư ký",
        count: "41 lịch",
        mode: "Calendar API / nhập nhanh",
        freq: "Ngay khi phát sinh",
        owner: "Văn phòng phường",
        offset: 12 * 60 * 1000 + 5 * 1000,
        quality: "97,9%",
        rows: 59,
        status: "ok",
    },
];
const bootTime = Date.now();
function sourceAt(s) {
    return bootTime - s.offset;
}
function getSource(keyOrName) {
    return (
        sourceDefs.find((s) => s.key === keyOrName || s.name === keyOrName) ||
        sourceDefs[0]
    );
}
function freshnessClass(s) {
    return s.status === "stale" ? "stale" : s.status === "late" ? "late" : "";
}
function renderSources() {
    const box = document.getElementById("sourceList");
    if (!box) return;
    box.innerHTML = sourceDefs
        .map((s) => {
            const t = sourceAt(s);
            const cls = freshnessClass(s);
            return `<button class="source-item" onclick="openSourceDetail('${s.key}')"><div class="dot">${s.icon}</div><div><b>${s.name}</b><small>${s.desc}</small><small class="source-update-line ${cls}">🕒 <span class="time">${dtTime(s.offset)}</span><span>·</span><span class="rel">${relTime(s.offset)}</span></small><div class="source-quality"><span>${s.mode}</span><span>${s.freq}</span><span>Độ tin cậy ${s.quality}</span></div></div><div class="source-badge-stack"><span class="badge ${s.status === "ok" ? "ok" : s.status === "late" ? "warn" : "red"}">${s.count}</span><span class="badge">${fmt(s.rows)} dòng</span></div></button>`;
        })
        .join("");
}
function openSourceDetail(keyOrName) {
    const s = getSource(keyOrName);
    const t = sourceAt(s);
    const cls = freshnessClass(s);
    const jobs = [0, 1, 2, 3, 4].map((i) => ({
        time:
            t -
            i *
            (s.key === "api"
                ? 4 * 60 * 1000
                : s.key === "alert"
                    ? 9 * 60 * 1000
                    : 47 * 60 * 1000),
        type:
            i === 0
                ? "Đồng bộ gần nhất"
                : i === 1
                    ? "Đối soát dữ liệu"
                    : "Đồng bộ định kỳ",
        rows: Math.max(1, Math.round(s.rows / (i + 3))),
        result: i === 3 && s.status === "late" ? "Có cảnh báo chậm" : "Thành công",
    }));
    document.getElementById("modalTitle").textContent =
        "Nguồn dữ liệu & cập nhật · " + s.name;
    document.getElementById("modalSub").textContent =
        `Lần cập nhật gần nhất: ${dtTime(s.offset)} · ${relTime(s.offset)} so với hiện tại`;
    document.getElementById("modalBody").innerHTML =
        `<div class="freshness-grid"><div class="freshness-kpi"><span>Thời điểm cập nhật</span><b>${dtTime(s.offset)}</b><small>${relTime(s.offset)}</small></div><div class="freshness-kpi"><span>Tần suất/SLA</span><b>${s.freq}</b><small>${s.mode}</small></div><div class="freshness-kpi"><span>Bản ghi/kết nối</span><b>${fmt(s.rows)}</b><small>${s.count} · chủ quản: ${s.owner}</small></div><div class="freshness-kpi"><span>Chất lượng dữ liệu</span><b class="${s.status === "ok" ? "ok" : s.status === "late" ? "warn" : "danger"}">${s.quality}</b><small>${s.status === "ok" ? "Đúng hạn" : "Cần rà soát cập nhật"}</small></div></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nguồn</h4><div class="kv"><b>Tên nguồn</b><span>${s.name}</span><b>Mô tả</b><span>${s.desc}</span><b>Cơ chế</b><span>${s.mode}</span><b>Tần suất</b><span>${s.freq}</span><b>Đơn vị phụ trách</b><span>${s.owner}</span><b>Kiểm tra dữ liệu</b><span>Đúng · đủ · sạch · sống · audit log</span></div></div><div class="detail-card"><h4>Data health</h4><div class="data-health"><div><b>Đúng</b><span>Kiểm tra định dạng/mã đơn vị</span></div><div><b>Đủ</b><span>${fmt(s.rows)} dòng có khóa định danh</span></div><div><b>Sạch</b><span>Tỷ lệ trùng lặp thấp, ${s.quality}</span></div><div><b>Sống</b><span>${dtTime(s.offset)} · ${relTime(s.offset)}</span></div></div><div class="action-bar" style="margin-top:12px"><button class="primary" onclick="toast('Đã chạy đồng bộ thử nguồn ${s.name}')">Đồng bộ thử</button><button class="ghost" onclick="toast('Đã mở màn import Excel cho ${s.name}')">Import Excel</button><button class="ghost" onclick="toast('Đã tạo cảnh báo lỗi dữ liệu nguồn ${s.name}')">Cảnh báo lỗi</button><button class="ghost" onclick="toast('Đã gửi yêu cầu xác nhận số liệu tới ${s.owner}')">Yêu cầu xác nhận</button></div></div></div><div class="detail-card"><h4>Nhật ký đồng bộ gần nhất</h4><div class="sync-timeline">${jobs.map((j) => `<div class="sync-job"><b>${dtTime(bootTime - j.time + (bootTime - t))}</b><span><b>${j.type}</b><br/><small>${fmt(j.rows)} bản ghi · kiểm tra schema, mã đơn vị, trạng thái xử lý</small></span><span class="badge ${j.result === "Thành công" ? "ok" : "warn"}">${j.result}</span></div>`).join("")}</div></div>`;
    openModal();
}

/* ============================== RENDER ALL / KHỞI ĐỘNG ============================== */
function renderAll() {
    const meta = axisMeta[currentRole];
    document.getElementById("currentIcon").textContent = meta.icon;
    document.getElementById("currentRoleName").textContent = currentAccount.title;
    document.getElementById("currentRoleDesc").textContent =
        currentAccount.subtitle;
    renderSources();

}

/* ===================================================================
 * BOOTSTRAP - khoi tao component standalone (da bo dang nhap).
 * Mac dinh dong vai tro DANG / Thanh uy (giong selectLogin('danguy') cua file goc) -> xem tat ca 04 truc.
 * =================================================================== */
(function () {
    function __boot() {
        /* ==== RENDER RIENG CUA COMPONENT ==== */
        try {
            renderSources();
        } catch (e) {
            console.error("component render", e);
        }
        try {
            Array.prototype.forEach.call(
                document.querySelectorAll("[data-widget]"),
                function (el) {
                    el.classList.remove("hidden");
                },
            );
        } catch (e) { }
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", __boot);
    else __boot();
})();
