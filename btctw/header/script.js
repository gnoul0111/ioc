/* Base cua backend be_ioc_dash (user-info / rbac / qlnv token).
   Cau hinh qua window.API_BASE trong khoi <script> config cua trang, giong window.IOC_API_BASE
   va window.QLNV_API_BASE. KHONG hardcode hostname va KHONG hardcode cong: goi theo dung
   domain cua trang, prefix /api-nest duoc reverse proxy tra ve be_ioc_dash tren cong 443.
   Moi truong nao con phai goi thang cong 3004 thi set window.API_BASE tuong ung. */
function resolveApiBase() {
    var b = (typeof window !== "undefined" && window.API_BASE) || "";
    b = String(b).trim().replace(/\/+$/, "");
    return b || location.origin;
}

const data = [
    { id: 1, idcms: 142, name: "Ban Tổ chức Trung ương", parentId: null },
    { id: 2, idcms: null, name: "Thành phố Hà Nội", parentId: 1 },

    { id: 2, idcms: null, name: "Thành phố Hà Nội", parentId: 1 },
]
const axisMeta = {
    TW: { name: "Trung ương", icon: "🚩", color: "#e84d5b", desc: "Bí thư Trung ương · xem tất cả cấp", scope: "all", },
    DANG: { name: "Đảng ủy", icon: "🚩", color: "#e84d5b", desc: "Bí thư Đảng ủy · xem tất cả cấp", scope: "all", },
    HDND: { name: "HĐND", icon: "🏛️", color: "#f59e0b", desc: "Chủ tịch HĐND · chỉ xem HĐND", scope: "own", },
    UBND: { name: "UBND", icon: "🏢", color: "#2fb174", desc: "Chủ tịch UBND · UBND đầy đủ + HĐND/MTTQ chỉ số", scope: "ubnd", },
    MTTQ: { name: "MTTQ", icon: "🤝", color: "#8b5cf6", desc: "Chủ tịch MTTQ · chỉ xem MTTQ", scope: "own", },
};

const accounts = {
    tw: { user: "trunguong", pass: "123456", role: "TW", title: "Tài khoản Trung ương", subtitle: "Bí thư Trung ương · Xem tất cả cấp", icon: "🚩", },
    danguy: { user: "danguy", pass: "123456", role: "DANG", title: "Tài khoản Đảng ủy", subtitle: "Bí thư Đảng ủy · Xem tất cả cấp", icon: "🚩", },
    hdnd: { user: "hdnd", pass: "123456", role: "HDND", title: "Tài khoản HĐND", subtitle: "Chủ tịch HĐND · Chỉ xem HĐND", icon: "🏛️", },
    ubnd: { user: "ubnd", pass: "123456", role: "UBND", title: "Tài khoản UBND", subtitle: "Chủ tịch UBND · UBND full + HĐND/MTTQ chỉ số", icon: "🏢", },
    mttq: { user: "mttq", pass: "123456", role: "MTTQ", title: "Tài khoản MTTQ", subtitle: "Chủ tịch MTTQ · Chỉ xem MTTQ", icon: "🤝", },
};
const dataIOC_BKAV = [
    { "id": 1, "parentId": null, "label": "BAN TỔ CHỨC TRUNG ƯƠNG" },
    { "id": 11, "parentId": 1, "label": "Vụ Tổ chức - Điều lệ" },
    { "id": 9, "parentId": 1, "label": "Vụ Cơ sở đảng, đảng viên" },
    { "id": 8, "parentId": 1, "label": "Vụ Cán bộ" },
    { "id": 10, "parentId": 1, "label": "Vụ Chính sách cán bộ" },
    { "id": 14, "parentId": 1, "label": "Vụ Địa phương I (tại Hà Nội, gọi tắt là Vụ I)" },
    { "id": 15, "parentId": 1, "label": "Vụ Địa phương II (tại Đà Nẵng, gọi tắt là Vụ II)" },
    { "id": 16, "parentId": 1, "label": "Vụ Địa phương III  (tại Hồ Chí Minh, gọi tắt là Vụ III)" },
    { "id": 13, "parentId": 1, "label": "Vụ Các ban, bộ, ngành, đoàn thể ở Trung ương (gọi tắt là Vụ V)" },
    { "id": 12, "parentId": 1, "label": "Vụ Nghiên cứu khoa học tổ chức, cán bộ" },
    { "id": 7, "parentId": 1, "label": "Cục Đào tạo, bồi dưỡng cán bộ" },
    { "id": 6, "parentId": 1, "label": "Cục Bảo vệ chính trị nội bộ" },
    { "id": 5, "parentId": 1, "label": "Văn phòng Ban" },
    // { "id": 2, "parentId": 1, "label": "Đảng ủy cơ quan" },
    // { "id": 3, "parentId": 1, "label": "Tiểu ban BVCTNB TW" },
    // { "id": 4, "parentId": 1, "label": "Thường trực BCĐ KL 39" },
    { "id": 17, "parentId": 6, "label": "Phòng Bộ ngành" },
    { "id": 18, "parentId": 6, "label": "Phòng Địa phương" },
    { "id": 19, "parentId": 6, "label": "Văn phòng Cục" },
    { "id": 20, "parentId": 2, "label": "Văn phòng Đảng ủy" },
    { "id": 21, "parentId": 7, "label": "Phòng Đào tạo, bồi dưỡng trong nước" },
    { "id": 22, "parentId": 7, "label": "Phòng Hợp tác và ĐTBD nước ngoài" },
    { "id": 23, "parentId": 7, "label": "Văn phòng Cục - Cục Đào tạo, bồi dưỡng cán bộ" },
    { "id": 24, "parentId": 5, "label": "Phòng Tổng hợp" },
    { "id": 25, "parentId": 5, "label": "Phòng Tổ chức - Cán bộ" },
    { "id": 26, "parentId": 5, "label": "Phòng Hành chính - Lưu trữ" },
    { "id": 27, "parentId": 5, "label": "Phòng CNTT và Chuyển đổi số" },
    { "id": 28, "parentId": 5, "label": "Phòng Quản trị" },
    { "id": 29, "parentId": 5, "label": "Phòng Tài vụ" },
    // { "id": 30, "parentId": 1, "label": "Hội Cựu chiến binh Cơ quan" },
    // { "id": 31, "parentId": 1, "label": "Đoàn Thanh niên Cơ quan" },

    { "id": 3101, "parentId": null, "label": "Đảng ủy Các Cơ quan đảng TW" },
    { "id": 3102, "parentId": 3101, "label": "Ban Tổ chức" },

    { "id": 3103, "parentId": null, "label": "Đảng ủy Chính phủ" },
    { "id": 3104, "parentId": 3103, "label": "Ban Tổ chức" },

    { "id": 3105, "parentId": null, "label": "Đảng ủy MTTQ, các đoàn thể TW" },
    { "id": 3106, "parentId": 3105, "label": "Ban Tổ chức" },

    { "id": 3107, "parentId": null, "label": "Đảng ủy Quốc hội" },
    { "id": 31048, "parentId": 3107, "label": "Ban Tổ chức" },

    { "id": 3109, "parentId": null, "label": "Quân ủy Trung ương" },
    { "id": 3110, "parentId": 3109, "label": "Tổng cục Chính trị" },

    { "id": 3111, "parentId": null, "label": "Đảng ủy Công an Trung ương" },
    { "id": 3112, "parentId": 3111, "label": "Cục Tổ chức cán bộ" },

    { "id": 32, "parentId": null, "label": "Tỉnh Uỷ, Thành Uỷ, Đảng Uỷ Trực Thuộc TW" },
    // { "id": 33, "parentId": 32, "label": "Thành phố trực thuộc Trung ương" },

    { "id": 35, "parentId": 32, "label": "Thành ủy Hà Nội", "idcms": 131 },
    { "id": 36, "parentId": 35, "label": "Ban Tổ chức Thành ủy Hà Nội", "idcms": null },

    { "id": 38, "parentId": 32, "label": "Thành ủy Hồ Chí Minh" },
    { "id": 39, "parentId": 38, "label": "Ban Tổ chức Thành ủy Hồ Chí Minh", "idcms": null },

    { "id": 41, "parentId": 32, "label": "Thành ủy Hải Phòng" },
    { "id": 42, "parentId": 41, "label": "Ban Tổ chức Thành ủy Hải Phòng", "idcms": null },

    { "id": 44, "parentId": 32, "label": "Thành ủy Đà Nẵng" },
    { "id": 45, "parentId": 44, "label": "Ban Tổ chức Thành ủy Đà Nẵng", "idcms": null },

    { "id": 47, "parentId": 32, "label": "Thành ủy Cần Thơ" },
    { "id": 48, "parentId": 47, "label": "Ban Tổ chức Thành ủy Cần Thơ", "idcms": null },

    { "id": 50, "parentId": 32, "label": "Thành ủy Huế" },
    { "id": 51, "parentId": 50, "label": "Ban Tổ chức Thành ủy Huế", "idcms": null },

    { "id": 53, "parentId": 32, "label": "Thành ủy Đồng Nai" },
    { "id": 54, "parentId": 53, "label": "Ban Tổ chức Thành ủy Đồng Nai", "idcms": null },

    // { "id": 55, "parentId": 32, "label": "Thành phố không trực thuộc Trung ương" },
    { "id": 57, "parentId": 32, "label": "Đảng ủy Lai Châu" },
    { "id": 58, "parentId": 57, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 60, "parentId": 32, "label": "Đảng ủy Điện Biên" },
    { "id": 61, "parentId": 60, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 63, "parentId": 32, "label": "Đảng ủy Sơn La" },
    { "id": 64, "parentId": 63, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 66, "parentId": 32, "label": "Đảng ủy Lạng Sơn" },
    { "id": 67, "parentId": 66, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 69, "parentId": 32, "label": "Đảng ủy Quảng Ninh" },
    { "id": 70, "parentId": 69, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 72, "parentId": 32, "label": "Đảng ủy Thanh Hoá" },
    { "id": 73, "parentId": 72, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 75, "parentId": 32, "label": "Đảng ủy Nghệ An" },
    { "id": 76, "parentId": 75, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 78, "parentId": 32, "label": "Đảng ủy Hà Tĩnh" },
    { "id": 79, "parentId": 78, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 81, "parentId": 32, "label": "Đảng ủy Cao Bằng" },
    { "id": 82, "parentId": 81, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 84, "parentId": 32, "label": "Đảng ủy Tuyên Quang" },
    { "id": 85, "parentId": 84, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 87, "parentId": 32, "label": "Đảng ủy Lào Cai" },
    { "id": 88, "parentId": 87, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 90, "parentId": 32, "label": "Đảng ủy Thái Nguyên" },
    { "id": 91, "parentId": 90, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 93, "parentId": 32, "label": "Đảng ủy Phú Thọ" },
    { "id": 94, "parentId": 93, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 96, "parentId": 32, "label": "Đảng ủy Bắc Ninh" },
    { "id": 97, "parentId": 96, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 99, "parentId": 32, "label": "Đảng ủy Hưng Yên" },
    { "id": 100, "parentId": 99, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 102, "parentId": 32, "label": "Đảng ủy Ninh Bình" },
    { "id": 103, "parentId": 102, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 105, "parentId": 32, "label": "Đảng ủy Quảng Trị" },
    { "id": 106, "parentId": 105, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 108, "parentId": 32, "label": "Đảng ủy Quảng Ngãi" },
    { "id": 109, "parentId": 108, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 111, "parentId": 32, "label": "Đảng ủy Gia Lai" },
    { "id": 112, "parentId": 111, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 114, "parentId": 32, "label": "Đảng ủy Khánh Hòa" },
    { "id": 115, "parentId": 114, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 117, "parentId": 32, "label": "Đảng ủy Lâm Đồng" },
    { "id": 118, "parentId": 117, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 120, "parentId": 32, "label": "Đảng ủy Đắk Lắk" },
    { "id": 121, "parentId": 120, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 123, "parentId": 32, "label": "Đảng ủy Tây Ninh" },
    { "id": 124, "parentId": 123, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 126, "parentId": 32, "label": "Đảng ủy Vĩnh Long" },
    { "id": 127, "parentId": 126, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 129, "parentId": 32, "label": "Đảng ủy Đồng Tháp" },
    { "id": 130, "parentId": 129, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 132, "parentId": 32, "label": "Đảng ủy Cà Mau" },
    { "id": 133, "parentId": 132, "label": "Ban tổ chức tỉnh ủy" },

    { "id": 135, "parentId": 32, "label": "Đảng ủy An Giang" },
    { "id": 136, "parentId": 135, "label": "Ban tổ chức tỉnh ủy" }
]

let currentAccount = null,
    currentRole = null,
    currentSoId = null,
    currentXaId = null,
    activeMetric = "received",
    activeIndicatorRole = null,
    currentDrawerRecords = [],
    records = [],
    indicatorRecords = [];
function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, function (m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        if (m === '"') return "&quot;";
        return "&#39;";
    });
}
function jsAttr(s) {
    return String(s ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\r/g, "")
        .replace(/\n/g, " ");
}
function domText(id, val) {
    const el = document.getElementById(id);
    if (el && val != null) el.textContent = val;
    return el;
}
function snavIcon(type) {
    return {
        TW: '🌐',
        CUC: '🏢',
        DANG_UY: '🚩',
        VP: '📂',
        SO: '🏙️',
        PHONG_XA: '🏘️',
    }[type] || "";
}

function toggleSideNav() { document.getElementById("sideNav").classList.toggle("collapsed"); }

function actionItem(id) {
    console.log('actionItem', id)
    const node = window.dataInfo[id];
    const idcms = node?.idcms || null
    if (!idcms) return
    const newTab = window.open(
        `https://iochn.hanoi.dcs.vn/cms/view/${idcms}/`,
        "_blank",
    );
}

function getChilrenWards(id, type) {
    if (type === "wards") return [
        { "id": 1000 + id, "parentId": id, type: "BO_WARD", code: "DANG_UY_WARD", "label": "Đảng ủy" },
        { "id": 1000 + id, "parentId": id, type: "BO_WARD", code: "HDND_WARD", "label": "HĐND" },
        { "id": 1000 + id, "parentId": id, type: "BO_WARD", code: "MTTQ_WARD", "label": "MTTQ" },
        { "id": 1000 + id, "parentId": id, type: "BO_WARD", code: "UBND_WARD", "label": "UBND" },
    ]
    else if (type === "BO_WARD") return []
    return []
}

function snavToggle(btn, id, type) {
    const box = document.getElementById(id);
    console.log('snavToggle', window.parentIdMap, id, box)
    if (!box) return;
    const caret = btn.querySelector(".snav-caret");
    const willOpen = !box.classList.contains("open");
    if (willOpen && !box.dataset.rendered) {
        let children = (window.parentIdMap[id] || []).map((childId) => window.dataInfo[childId]);
        if (children.length === 0 && (type === 'wards' || type === "BO_WARD")) children = getChilrenWards(id, type)
        console.log('snavToggle children', children)
        box.innerHTML =
            children.map(snavNodeHtml).join("") ||
            '<div class="access-lock" style="margin:4px 8px">Chưa có đơn vị con.</div>';
        box.dataset.rendered = "1";
    }
    box.classList.toggle("open", willOpen);
    caret.classList.toggle("open", willOpen);
}
function snavNodeHtml(node) {
    console.log("snavNodeHtml", node)
    // const hasChildren = typeof node.children === "function";
    let hasChildren = window.parentIdMap[node.id] && window.parentIdMap[node.id].length > 0;
    if (node.type === "wards" || node.type === "BO_WARD") hasChildren = true
    const idcms = node?.idcms || null
    const fn = !idcms ? (hasChildren ? `snavToggle(this,'${node.id}', '${node.type}')` : '') : `actionItem('${node.id}')`;
    return `<div class="snav-node">
        <div class="snav-row snav-split">
        ${hasChildren ? `<button class="snav-caret-btn" onclick="snavToggle(this,'${node.id}')">
        <span class="snav-caret">▸</span>
        </button>` : ""}
        <button class="snav-main" onclick="${fn}">
        <span class="snav-icon">${snavIcon(node.type)}</span>
        <span class="snav-label">${esc(node.label)}</span>
        </button>
        </div>
        <div class="snav-children" id="${node.id}"></div>
        </div>`;
}
function snavPlaceholderClick() {
    toast("Chưa có dữ liệu cho đơn vị này — chờ cập nhật ở bản tiếp theo.");
}

/* Làm phẳng toàn bộ cây (kể cả nhánh chưa mở rộng, gọi children() ngay để lấy đủ dữ liệu) phục vụ tìm kiếm xuyên suốt. */
function sidebarFlattenNodes(nodes, path) {
    let out = [];
    (nodes || []).forEach((n) => {
        const curPath = path.concat([n.label]);
        out.push({ node: n, path: path });
        if (typeof n.children === "function")
            out = out.concat(sidebarFlattenNodes(n.children(), curPath));
    });
    return out;
}

function sidebarTree() {
    return dataAPi;
}
function filterSideNav(q) {
    const box = document.getElementById("sideNavBody");
    if (!box) return;
    const query = (q || "").trim().toLowerCase();
    if (!query) {
        renderSideNav();
        return;
    }
    snavSeq = 0;
    const matches = dataIOC_BKAV.filter((x) => x.label.toLowerCase().includes(query),)
    if (!matches.length) {
        box.innerHTML =
            '<div class="access-lock">Không tìm thấy đơn vị phù hợp.</div>';
        return;
    }
    box.innerHTML = matches
        .map((node) => {
            const crumb = window.dataInfo[node.id]?.crumb || '';
            console.log("filterSideNav", node)
            return `<div class="snav-node">
      <button class="snav-row snav-leaf" onclick="actionItem(${node.id})" title="${esc('')}">
      <span class="snav-caret"></span><span class="snav-icon">${snavIcon(node.type)}</span>
      <span class="snav-label">
      ${esc(node.label)}${crumb ? ` <small style="color:#8ab0c8;font-weight:400">· ${esc(crumb)}</small>` : ""}
      </span></button></div>`;
        })
        .join("");
}
function renderSideNav() {
    snavSeq = 0;
    const box = document.getElementById("sideNavBody");
    if (!box || !currentAccount) return;
    const tree = window.dataShow || [];
    box.innerHTML = tree.length
        ? tree.map(snavNodeHtml).join("")
        : '<div class="access-lock">Không có cơ cấu để hiển thị.</div>';
}
window.snavToggle = snavToggle;
window.snavPlaceholderClick = snavPlaceholderClick;
window.toggleSideNav = toggleSideNav;

function pad(n) {
    return String(n).padStart(2, "0");
}
function allowedRoles(role = currentRole) {
    if (role === "DANG") return ["DANG", "HDND", "UBND", "MTTQ"];
    if (role === "UBND") return ["UBND", "HDND", "MTTQ"];
    if (role === "HDND") return ["HDND"];
    if (role === "MTTQ") return ["MTTQ"];
    return [];
}
function updateClock() {
    const d = new Date();
    domText(
        "clock",
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    );
    domText(
        "dateText",
        d.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }),
    );
}
function applyUserHeaderDisplay(info) {
    var u = info || window.__userInfo;
    if (!u) {
        try {
            var cached = localStorage.getItem('userInfo');
            if (cached) u = JSON.parse(cached);
        } catch (e) { }
    }
    if (u) {
        var nameEl = document.getElementById("currentRoleName");
        var fullName = [u.family_name, u.given_name].filter(Boolean).join(" ");
        if (nameEl && fullName) nameEl.textContent = fullName;
        var descEl = document.getElementById("currentRoleDesc");
        if (descEl && u.job_title) descEl.textContent = u.job_title;
    }
}
window.applyUserHeaderDisplay = applyUserHeaderDisplay;

function renderAll() {
    const meta = axisMeta[currentRole];
    if (document.getElementById("currentIcon")) document.getElementById("currentIcon").textContent = meta.icon;
    applyUserHeaderDisplay();
    renderRoleScope();
}

window.jsAttr = jsAttr;
window.domText = domText;

function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => t.classList.remove("show"), 3000);
}

/* ============================== USER MENU (dropdown ở user-pill) ============================== */
function toggleUserMenu(evt) {
    if (evt) evt.stopPropagation();
    const menu = document.getElementById("userMenu");
    if (menu) menu.classList.toggle("show");
}
window.toggleUserMenu = toggleUserMenu;

function closeUserMenu() {
    const menu = document.getElementById("userMenu");
    if (menu) menu.classList.remove("show");
}
window.closeUserMenu = closeUserMenu;

document.addEventListener("click", function (evt) {
    const menu = document.getElementById("userMenu");
    const pill = document.getElementById("userPill");
    if (!menu || !menu.classList.contains("show")) return;
    if (pill && pill.contains(evt.target)) return;
    if (menu.contains(evt.target)) return;
    menu.classList.remove("show");
});

/* ============================== ĐỔI MẬT KHẨU ============================== */
function openChangePasswordModal() {
    const modal = document.getElementById("pwModal");
    const overlay = document.getElementById("overlay");
    const form = document.getElementById("changePasswordForm");
    const err = document.getElementById("pwError");
    if (form) form.reset();
    if (err) { err.textContent = ""; err.classList.add("hidden"); }
    if (overlay) overlay.classList.add("show");
    if (modal) modal.classList.add("open");
}
window.openChangePasswordModal = openChangePasswordModal;

function closeChangePasswordModal() {
    const modal = document.getElementById("pwModal");
    const overlay = document.getElementById("overlay");
    if (modal) modal.classList.remove("open");
    if (overlay && !document.querySelector(".modal.open")) overlay.classList.remove("show");
}
window.closeChangePasswordModal = closeChangePasswordModal;

/* Tối thiểu 8 ký tự, có ít nhất 1 chữ hoa và 1 ký tự đặc biệt (khớp rule phía BE
   nếu sau này bổ sung @Matches trên ChangeOwnPasswordDto). */
var PASSWORD_RULE_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
var PASSWORD_RULE_MESSAGE = "Mật khẩu mới phải có tối thiểu 8 ký tự, gồm ít nhất 1 chữ in hoa và 1 ký tự đặc biệt.";

function submitChangePassword(evt) {
    evt.preventDefault();
    const err = document.getElementById("pwError");
    const showErr = (msg) => { if (err) { err.textContent = msg; err.classList.remove("hidden"); } };
    if (err) { err.textContent = ""; err.classList.add("hidden"); }

    const current = document.getElementById("pwCurrent").value;
    const next = document.getElementById("pwNew").value;
    const confirm = document.getElementById("pwConfirm").value;

    if (!PASSWORD_RULE_REGEX.test(next)) { showErr(PASSWORD_RULE_MESSAGE); return false; }
    if (next !== confirm) { showErr("Xác nhận mật khẩu mới không khớp."); return false; }
    if (next === current) { showErr("Mật khẩu mới phải khác mật khẩu hiện tại."); return false; }

    const btn = document.getElementById("pwSubmitBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Đang xử lý..."; }

    /* BE tự phục vụ (không cần quyền admin): POST /rbac/me/password, đồng bộ cả local
       (ab_user.password) lẫn SSO (LifeSSO/WSO2 SCIM2) - xem
       src/rbac/organization/org-self.controller.ts + org-admin.service.ts#changeOwnPassword.
       userId lấy từ session cookie phía BE (SupersetSessionGuard), FE không cần biết trước.
       Dung chung base voi cac API khac cua trang qua resolveApiBase().
       Header "X-IOC-Request: 1" bắt buộc trên mọi mutation để qua SameOriginMutationGuard. */
    fetch(resolveApiBase() + "/api-nest/rbac/me/password", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-IOC-Request": "1",
        },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
        .then((r) => {
            if (!r.ok) return r.json().catch(() => null).then((body) => {
                /* ValidationPipe của Nest trả "message" là mảng chuỗi khi lỗi validate DTO
                   (vd newPassword ngắn hơn 8 ký tự); các lỗi nghiệp vụ khác trả "message"
                   dạng chuỗi (vd "Mật khẩu hiện tại không đúng"). */
                var raw = body && (body.message || body.detail);
                var text = Array.isArray(raw) ? raw.join("; ") : raw;
                throw new Error(text || "HTTP " + r.status);
            });
            return r.json().catch(() => ({}));
        })
        .then(() => {
            closeChangePasswordModal();
            toast("Đổi mật khẩu thành công.");
        })
        .catch((e) => {
            console.error("submitChangePassword", e);
            showErr(typeof e.message === "string" ? e.message : "Đổi mật khẩu thất bại, vui lòng thử lại.");
        })
        .finally(() => {
            if (btn) { btn.disabled = false; btn.textContent = "Xác nhận đổi mật khẩu"; }
        });

    return false;
}
window.submitChangePassword = submitChangePassword;

/* Nút mắt trên các ô mật khẩu của modal Đổi mật khẩu: đổi type input giữa
   password/text để xem/ẩn giá trị đang gõ, icon con mắt giữ nguyên - chỉ đổi màu/nền
   (class is-active) để thể hiện trạng thái đang hiện mật khẩu. */
var EYE_ICON_OPEN = '<svg class="pwi" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
var EYE_ICON_SLASH = '<svg class="pwi" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M6.61 6.61A18.5 18.5 0 0 0 1 12s4 8 11 8a9.26 9.26 0 0 0 5.39-1.61"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

function togglePasswordField(inputId, btn) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var showing = input.type === "text";
    input.type = showing ? "password" : "text";
    if (btn) {
        btn.classList.toggle("is-active", !showing);
        btn.title = showing ? "Hiện mật khẩu" : "Ẩn mật khẩu";
        btn.innerHTML = showing ? EYE_ICON_SLASH : EYE_ICON_OPEN;
    }
}
window.togglePasswordField = togglePasswordField;

function processData() {
    const dataShow = [];
    const dataInfo = {};
    const parentIdMap = {};

    dataIOC_BKAV.forEach((item) => {
        const { id, parentId } = item;

        // 1. Lưu item vào dataInfo dưới dạng key-value
        dataInfo[id] = { ...item, crumb: (parentId ? `${dataInfo[parentId]?.label || ''} › ` : '' + item.label) };

        // 2. Lấy các item không có parentId (null/undefined) vào dataShow
        if (parentId === null || parentId === undefined) {
            dataShow.push({ ...item });
        } else {
            // 3. Gom nhóm danh sách id theo parentId
            if (!parentIdMap[parentId]) {
                parentIdMap[parentId] = [];
            }
            parentIdMap[parentId].push(id);
        }
    });
    window.dataShow = dataShow;
    window.dataInfo = dataInfo;
    window.parentIdMap = parentIdMap;
}

/* user-info đã được React shell (src/utils/userInfo.ts) tải sẵn và ghi ra
   window.__userInfo + localStorage("userInfo") trước khi iframe này chạy. Đọc lại
   bản đó thay vì gọi API lần nữa — trước đây mỗi lần tải trang có tới 3 request
   /api-nest/auth/user-info giống hệt nhau. Không có sẵn (mở thẳng trang page-html,
   hoặc React chưa kịp ghi) thì mới tự gọi. */
function __readCachedUserInfo() {
    try {
        var info =
            window.__userInfo ||
            (window.parent && window.parent !== window && window.parent.__userInfo) ||
            JSON.parse(localStorage.getItem("userInfo") || "null");
        return info && info.username ? info : null;
    } catch (e) {
        return null;
    }
}

/** GET /api-nest/auth/user-info -> window.__userInfo (ưu tiên bản React đã tải) */
function loadUserInfo() {
    var cached = __readCachedUserInfo();
    if (cached) {
        window.__userInfo = cached;
        return Promise.resolve(cached);
    }
    var token = (typeof localStorage !== "undefined" && (localStorage.getItem("access_token") || localStorage.getItem("qlnv_jwt_access_token"))) || "";
    var headers = {
        Accept: "*/*",
        "Accept-Language": "vi",
    };
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }
    return fetch(resolveApiBase() + "/api-nest/auth/user-info", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: headers,
    }).then((r) => r.json())
        .then((data) => {
            window.__userInfo = data;
            localStorage.setItem('userInfo', JSON.stringify(data));
            return data;
        })
        .catch((err) => {
            console.error("loadUserInfo", err);
            window.__userInfo = null;
            throw err;
        });
}

/**
 * Goi song song API. Cac file js khac co the:
 *   - doc truc tiep window.__userInfo neu chay sau khi da load xong, hoac
 *   - await window.__headerApiReady de dam bao da co du lieu truoc khi dung.
 */
function loadHeaderApis() {
    window.__headerApiReady = Promise.allSettled([loadUserInfo()]);
    return window.__headerApiReady;
}
window.loadHeaderApis = loadHeaderApis;

(function () {
    function __boot() {
        try {
            loadHeaderApis().then(function () {
                try {
                    /* GET /api/auth/user-info trả job_title (chức danh) + given_name/family_name
                       (tên người dùng) — hiển thị vào user-pill trên header (#currentRoleName/
                       #currentRoleDesc), trước đó luôn giữ nguyên "--" vì chưa nơi nào ghi vào. */
                    var info = window.__userInfo;
                    if (info) {
                        var nameEl = document.getElementById("currentRoleName");
                        /* Họ (family_name) đứng trước tên (given_name) theo đúng thứ tự tên người Việt. */
                        var fullName = [info.family_name, info.given_name].filter(Boolean).join(" ");
                        if (nameEl && fullName) nameEl.textContent = fullName;
                        var descEl = document.getElementById("currentRoleDesc");
                        if (descEl && info.job_title) descEl.textContent = info.job_title;
                    }
                } catch (e) {
                    console.error("currentRoleName/Desc", e);
                }
            });
        } catch (e) {
            console.error("loadHeaderApis", e);
        }
        try {
            processData();
            var acc =
                typeof accounts !== "undefined"
                    ? accounts.tw ||
                    Object.keys(accounts)
                        .map(function (k) {
                            return accounts[k];
                        })
                        .find(function (a) {
                            return a.role === "TW";
                        })
                    : null;
            if (acc) {
                currentAccount = acc;
                currentRole = acc.role;
                currentSoId = null;
                currentXaId = null;
                window.__homeScope = null;
                window.__viewingLabel = null;
                window.__viewingIcon = null;
            }
        } catch (e) { }
        try {
            activeMetric = "received";
        } catch (e) { }
        try {
            activeIndicatorRole = allowedRoles()[0];
        } catch (e) { }
        /* Đồng hồ + danh tính (chỉ khi có phần tử tương ứng) */
        try {
            if (document.getElementById("clock")) {
                updateClock();
                setInterval(updateClock, 1000);
            }
        } catch (e) { }
        try {
            var i = document.getElementById("currentIcon");
            if (i) i.textContent = currentAccount.icon;
            var brand = document.getElementById("appBrandTitle");
            if (brand)
                brand.textContent = "TRUNG TÂM ĐIỀU HÀNH THÔNG MINH NGÀNH TỔ CHỨC XÂY DỰNG ĐẢNG";

            // Fallback đọc cache userInfo nếu có sẵn
            var cachedInfo = localStorage.getItem('userInfo');
            if (cachedInfo) {
                var info = JSON.parse(cachedInfo);
                if (info) {
                    var nameEl = document.getElementById("currentRoleName");
                    var fullName = [info.family_name, info.given_name].filter(Boolean).join(" ");
                    if (nameEl && fullName) nameEl.textContent = fullName;
                    var descEl = document.getElementById("currentRoleDesc");
                    if (descEl && info.job_title) descEl.textContent = info.job_title;
                }
            }
        } catch (e) { }
        /* Ctrl/Cmd+K mở lệnh nhanh nếu có modal */
        try {
            document.addEventListener("keydown", function (e) {
                if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "k") {
                    e.preventDefault();
                }
            });
        } catch (e) { }
        /* ==== RENDER RIÊNG CỦA COMPONENT ==== */
        try {
            renderSideNav();
        } catch (e) {
            console.error("renderSideNav", e);
        }
        /* Giữ renderAll an toàn: chỉ refresh side nav khi module khác gọi renderAll() */
        try {
            var _prevRenderAll = window.renderAll;
            renderAll = window.renderAll = function () {
                try {
                    if (
                        typeof _prevRenderAll === "function" &&
                        _prevRenderAll !== renderAll
                    ) {
                        _prevRenderAll();
                    }
                } catch (e) {
                    try {
                        renderRoleScope();
                    } catch (e2) { }
                }
                try {
                    renderSideNav();
                } catch (e3) {
                    console.error("renderSideNav", e3);
                }
                try {
                    applyUserHeaderDisplay();
                } catch (e4) { }
            };
        } catch (e) { }
        /* Bảo đảm widget của component luôn hiển thị (một số bản vá ẩn widget trùng) */
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
