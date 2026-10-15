/* Base cua backend be_ioc_dash (user-tree / user-info / qlnv token).
   Cau hinh qua window.API_BASE trong khoi <script> config cua trang, giong window.IOC_API_BASE
   va window.QLNV_API_BASE. KHONG hardcode hostname: cookie "session" chi duoc gui kem khi request
   cung site, nen gan cung mot moi truong lam cac API nay that bai o moi truong con lai.
   Khong set thi dung chinh origin cua trang (theo domain, cong 443) — prefix /api-nest
   duoc reverse proxy tra ve be_ioc_dash. Moi truong nao con phai goi thang cong 3004
   thi set window.API_BASE tuong ung, KHONG hardcode trong code. Doc lai moi lan goi de khong phu thuoc thu tu load script. */
function resolveApiBase() {
    var b = (typeof window !== "undefined" && window.API_BASE) || "";
    b = String(b).trim().replace(/\/+$/, "");
    return b || location.origin;
}

(function initQlnvApiConfig() {
    if (typeof window === "undefined") return;
    window.QLNV_API_BASE =
        window.QLNV_API_BASE || resolveApiBase() + "/api-nest";
    window.urlAPI = window.urlAPI || "https://iochn.hanoi.dcs.vn:360/api";
})();

/* CRM Status Cache for mapping codes */
var crmStatusCache = {
    DUT: null, // Độ khẩn
    S3103: null, // Nhóm lĩnh vực
    S3Z03: null, // Loại văn bản
    LOAINHIEMVU: null, // Loại nhiệm vụ
    S3O03: null, // Đơn vị chủ trì
};

let urlAPI = "https://iochn.hanoi.dcs.vn:360";
var CRM_STATUS_URL = `${urlAPI}/api/crm-source`;
var DOC_PICKER_URL = `${urlAPI}/api/incommingdocument/list-document-by-organ?&limit=10&sort=-updatedAt&filter%5Bstatus%5D=1&`;
var QLNV_RECEIVED_DASHBOARD_URL = `${urlAPI}/api/danh-sach-nhiem-vu/moi?type=urgencyLevel&limit=100&sort=-createdAt&&`;

/* ============================================================
 * QLNV TOKEN MANAGEMENT
 * ============================================================ */
var QLNV_TOKEN_CFG = {
    meUrl: "https://iochn.hanoi.dcs.vn/api/v1/me/",
    oauthBase: "https://administrator.lifetex.vn:351",
    tokenPath: "/oauth/token",
    authorizePath: "/oauth/authorize",
    clientIdToken: "authServer",
    clientIdAuthorize: "03_Driver",
    redirectUri: "https://administrator.lifetex.vn:353/api/oauth/callback",
    state: "antiCSRF",
    scope: "user",
    username: "Botruong",
    servicePassword: "12345678",
    useAuthorizeStep: false,
    proxyTokenUrl: resolveApiBase() + "/api/token",
};

var QLNV_SUBTASK_SEGMENTS = [
    "con-moi",
    "con-dang-trien-khai",
    "con-hoan-thanh",
];

var _qlnvTokenState = { jwt: "", expMs: 0, inflight: null };

const statusDefs = [
    {
        key: "done",
        label: "Hoàn thành",
        short: "Hoàn thành",
        color: "#2fb174",
        cls: "green",
    },
    {
        key: "doing",
        label: "Chưa HT trong hạn",
        short: "Chưa HT trong hạn",
        color: "#2c7dd2",
        cls: "blue",
    },
    // { key: 'regular', label: 'Thường xuyên, liên tục', short: 'Thường xuyên', color: '#229cbd', cls: 'cyan' },
    // { key: 'soon', label: 'Sắp đến hạn cảnh báo', short: 'Sắp đến hạn', color: '#d8a50c', cls: 'gold' },
    {
        key: "risk",
        label: "Chưa HT gần hạn",
        short: "Chưa HT gần hạn",
        color: "#d8a50c",
        cls: "orange",
    },
    {
        key: "overdue",
        label: "Chưa HT quá hạn",
        short: "Chưa HT quá hạn",
        color: "#d33a44",
        cls: "red",
    },
];

const statusDoc = [
    /* Trạng thái văn bản QLVB theo statusNumber: 1 = Ban hành, 0 = Xoá (xem QLVB_STATUS_BY_NUMBER). */
    {
        key: "published",
        label: "Ban hành",
        short: "Ban hành",
        color: "#2fb174",
        cls: "green",
    },
    {
        key: "deleted",
        label: "Xoá",
        short: "Xoá",
        color: "#d33a44",
        cls: "red",
    },
];

// activeMetric = "assigned" | "received" -> statusDefs; "docIn" | "docOut" -> statusDoc
function isDocMetric(metric) {
    return metric === "docIn" || metric === "docOut";
}
function getStatusDefsForMetric(metric) {
    return isDocMetric(metric) ? statusDoc : statusDefs;
}

const axisMeta = {
    DANG: {
        name: "Đảng ủy",
        icon: "🚩",
        color: "#e84d5b",
        desc: "Bí thư Đảng ủy · xem tất cả cấp",
        scope: "all",
    },
    HDND: {
        name: "HĐND",
        icon: "🏛️",
        color: "#f59e0b",
        desc: "Chủ tịch HĐND · chỉ xem HĐND",
        scope: "own",
    },
    UBND: {
        name: "UBND",
        icon: "🏢",
        color: "#2fb174",
        desc: "Chủ tịch UBND · UBND đầy đủ + HĐND/MTTQ chỉ số",
        scope: "ubnd",
    },
    MTTQ: {
        name: "MTTQ",
        icon: "🤝",
        color: "#8b5cf6",
        desc: "Chủ tịch MTTQ · chỉ xem MTTQ",
        scope: "own",
    },
};
const metricMeta = {
    assigned: { label: "Tổng nhiệm vụ giao", short: "Nhiệm vụ giao", icon: "📤" },
    received: { label: "Tổng nhiệm vụ nhận", short: "Nhiệm vụ nhận", icon: "📥" },
    docIn: { label: "Tổng văn bản đến", short: "Văn bản đến", icon: "📨" },
    docOut: { label: "Tổng văn bản đi", short: "Văn bản đi", icon: "📄" },
    // resultProcess: { label: "Tổng kết quả xử lý", short: "Kết quả xử lý", icon: "📊" },
};
const accounts = {
    danguy: {
        user: "danguy",
        pass: "123456",
        role: "DANG",
        title: "Tài khoản Đảng ủy",
        subtitle: "Bí thư Đảng ủy · Xem tất cả cấp",
        icon: "🚩",
    },
    hdnd: {
        user: "hdnd",
        pass: "123456",
        role: "HDND",
        title: "Tài khoản HĐND",
        subtitle: "Chủ tịch HĐND · Chỉ xem HĐND",
        icon: "🏛️",
    },
    ubnd: {
        user: "ubnd",
        pass: "123456",
        role: "UBND",
        title: "Tài khoản UBND",
        subtitle: "Chủ tịch UBND · UBND full + HĐND/MTTQ chỉ số",
        icon: "🏢",
    },
    mttq: {
        user: "mttq",
        pass: "123456",
        role: "MTTQ",
        title: "Tài khoản MTTQ",
        subtitle: "Chủ tịch MTTQ · Chỉ xem MTTQ",
        icon: "🤝",
    },
};

const segmentTemplate = {
    DANG: {
        assigned: { done: 38, doing: 22, regular: 8, soon: 7, risk: 6, overdue: 3 },
        received: { done: 15, doing: 9, regular: 3, soon: 4, risk: 3, overdue: 2 },
        docIn: { done: 26, doing: 18, regular: 4, soon: 7, risk: 5, overdue: 2 },
        docOut: { done: 20, doing: 14, regular: 4, soon: 5, risk: 3, overdue: 2 },
    },
    HDND: {
        assigned: { done: 9, doing: 5, regular: 3, soon: 2, risk: 2, overdue: 1 },
        received: { done: 12, doing: 8, regular: 4, soon: 5, risk: 3, overdue: 2 },
        docIn: { done: 12, doing: 9, regular: 3, soon: 3, risk: 3, overdue: 1 },
        docOut: { done: 8, doing: 5, regular: 2, soon: 1, risk: 1, overdue: 1 },
    },
    UBND: {
        assigned: {
            done: 36,
            doing: 25,
            regular: 10,
            soon: 9,
            risk: 8,
            overdue: 4,
        },
        received: {
            done: 58,
            doing: 41,
            regular: 16,
            soon: 14,
            risk: 12,
            overdue: 6,
        },
        docIn: { done: 75, doing: 52, regular: 20, soon: 19, risk: 14, overdue: 8 },
        docOut: {
            done: 56,
            doing: 35,
            regular: 15,
            soon: 14,
            risk: 10,
            overdue: 4,
        },
    },
    MTTQ: {
        assigned: { done: 8, doing: 4, regular: 2, soon: 2, risk: 1, overdue: 1 },
        received: { done: 10, doing: 7, regular: 3, soon: 3, risk: 2, overdue: 2 },
        docIn: { done: 10, doing: 7, regular: 2, soon: 2, risk: 2, overdue: 1 },
        docOut: { done: 7, doing: 4, regular: 2, soon: 1, risk: 1, overdue: 1 },
    },
};

const indicators = {
    DANG: [
        ["Lịch công tác Ban Thường vụ Đảng ủy", 18, "Tuần", "API + Excel"],
        ["Chỉ tiêu Nghị quyết Đại hội / nhiệm vụ chính trị", 24, "Tháng", "CSDL"],
        ["Theo dõi nghị quyết chuyên đề", 17, "Tuần", "Excel"],
        ["Tiến độ chương trình công tác toàn khóa", 12, "Tháng", "CSDL"],
        ["Công tác Đảng viên", 46, "Tháng", "CSDL"],
        ["Công tác cán bộ", 21, "Khi phát sinh", "CSDL"],
        ["Kiểm tra – giám sát", 16, "Tháng", "Excel"],
        ["Tuyên giáo – dân vận", 28, "Tuần", "Excel"],
        ["Chuyển đổi số Đảng", 9, "Tháng", "API"],
        ["Văn bản – điều hành", 62, "Ngày", "API"],
    ],
    HDND: [
        ["Danh sách kỳ họp HĐND", 6, "Quý", "Excel"],
        ["Chương trình kỳ họp", 11, "Khi phát sinh", "Excel"],
        ["Nội dung nghị quyết", 14, "Khi phát sinh", "CSDL"],
        ["Theo dõi nghị quyết HĐND: KTXH", 9, "Tháng", "Excel"],
        ["Theo dõi nghị quyết HĐND: đô thị", 7, "Tháng", "Excel"],
        ["Theo dõi nghị quyết HĐND: an sinh", 8, "Tháng", "Excel"],
        ["Theo dõi nghị quyết HĐND: môi trường", 5, "Tháng", "Excel"],
        ["Hoạt động giám sát HĐND", 13, "Tháng", "CSDL"],
        ["Kết quả giám sát", 12, "Tháng", "CSDL"],
        ["Giải quyết kiến nghị cử tri", 31, "Tuần", "Excel/API"],
    ],
    UBND: [
        ["Tổng số TTHC tiếp nhận", 243, "Ngày", "API Một cửa"],
        ["TTHC đang xử lý", 52, "Realtime", "API"],
        ["Tỷ lệ đồng bộ DVC quốc gia", 97, "Ngày", "API"],
        ["Thu ngân sách", 86, "Tháng", "CSDL kế toán"],
        ["Chi ngân sách", 74, "Tháng", "CSDL kế toán"],
        ["An sinh xã hội", 128, "Tháng", "Excel/CSDL"],
        ["Học sinh theo trường/khối/lớp", 1840, "Tháng", "Excel"],
        ["Giáo viên theo trình độ & quản lý", 146, "Quý", "Excel"],
        ["Cơ sở vật chất trường học", 96, "Quý", "Excel"],
        ["Văn bản đến theo trạng thái", 188, "Ngày", "API"],
        ["Văn bản đi/liên thông/nội bộ", 134, "Ngày", "API"],
        ["Đơn thư, khiếu nại, phản ánh", 42, "Tuần", "Excel"],
        ["Ý kiến, kiến nghị", 57, "Tuần", "Excel/API"],
        ["Thông báo kết luận", 33, "Tuần", "API"],
        ["Nhân sự, biên chế", 212, "Tháng", "CSDL"],
        ["Đối tượng chính sách", 318, "Tháng", "CSDL"],
        ["Ki-ốt, cơ sở kinh doanh, giấy phép", 86, "Tháng", "Excel/Thuế"],
        ["Lễ hội, nghệ nhân, di tích", 39, "Quý", "Excel/PDF"],
        ["Cơ sở y tế ngoài công lập", 28, "Tháng", "Excel"],
        ["Dự án giải phóng mặt bằng", 11, "Tuần", "Excel/CSDL"],
        ["Đô thị: chung cư, hội nghị, tranh chấp", 19, "Tháng", "Excel"],
        ["Kinh tế xã hội theo tháng/quý/năm", 25, "Tháng", "CSDL"],
    ],
    MTTQ: [
        ["Phản biện xã hội", 12, "Tháng", "Excel"],
        ["Quỹ ủng hộ", 9, "Tháng", "Excel/CSDL"],
        ["Đoàn Thanh niên: chỉ tiêu công tác đoàn", 21, "Tháng", "Excel"],
        ["Đoàn Thanh niên: thi đua khen thưởng", 8, "Quý", "Excel"],
        ["Hội Liên hiệp Phụ nữ: mô hình hoạt động", 16, "Tháng", "Excel"],
        ["Hội Liên hiệp Phụ nữ: thi đua", 11, "Quý", "Excel"],
        ["Hội Cựu chiến binh: chỉ tiêu công tác", 14, "Tháng", "Excel"],
        ["Hội Cựu chiến binh: biên chế tổ chức", 7, "Quý", "Excel"],
        ["Công đoàn: đoàn viên", 68, "Tháng", "CSDL"],
        ["Công đoàn: chăm lo đoàn viên", 19, "Tháng", "Excel"],
        ["Các hội quần chúng: danh sách hội", 15, "Quý", "Excel"],
        ["Các hội quần chúng: chỉ tiêu hoạt động", 23, "Tháng", "Excel"],
    ],
};

const taskTitlePool = {
    DANG: [
        "Xây dựng lịch công tác tuần của Ban Thường vụ",
        "Rà soát chỉ tiêu Nghị quyết Đại hội",
        "Theo dõi công tác đảng viên mới",
        "Kiểm tra tiến độ chuyển đổi số Đảng",
        "Tổng hợp kiến nghị về tổ chức cán bộ",
        "Theo dõi văn bản chỉ đạo của Đảng ủy",
    ],
    HDND: [
        "Theo dõi thực hiện nghị quyết HĐND",
        "Chuẩn bị nội dung kỳ họp chuyên đề",
        "Giám sát kết quả giải quyết kiến nghị cử tri",
        "Tổng hợp báo cáo chất vấn",
        "Giám sát lĩnh vực đô thị, môi trường",
        "Rà soát cam kết sau giám sát",
    ],
    UBND: [
        "Xử lý hồ sơ hành chính công",
        "Cập nhật chỉ tiêu thu ngân sách",
        "Điều phối chính sách an sinh xã hội",
        "Rà soát văn bản đến của UBND",
        "Kiểm tra tiến độ giải phóng mặt bằng",
        "Tổng hợp chỉ tiêu giáo dục, y tế, đô thị",
        "Xử lý đơn thư, phản ánh của công dân",
    ],
    MTTQ: [
        "Tổng hợp phản biện xã hội",
        "Theo dõi quỹ ủng hộ",
        "Cập nhật chỉ tiêu Đoàn Thanh niên",
        "Tổng hợp phong trào Hội Phụ nữ",
        "Theo dõi hoạt động Hội Cựu chiến binh",
        "Tổng hợp chỉ tiêu công đoàn và hội quần chúng",
    ],
};
const fieldPool = {
    DANG: [
        "Điều hành – chỉ đạo",
        "Nghị quyết đại hội",
        "Tổ chức Đảng",
        "Đảng viên, cán bộ",
        "Kiểm tra giám sát",
        "Dân vận, tuyên giáo",
        "Văn bản điều hành",
    ],
    HDND: [
        "Điều hành kỳ họp",
        "Theo dõi nghị quyết",
        "Giám sát HĐND",
        "Cử tri – kiến nghị",
    ],
    UBND: [
        "Hành chính công",
        "Tài chính – ngân sách",
        "An sinh xã hội",
        "Giáo dục",
        "Quản lý văn bản",
        "Nội vụ",
        "Công thương",
        "Văn hóa – Di tích",
        "Y tế ngoài công lập",
        "GPMB",
        "Đô thị",
        "Kinh tế xã hội",
    ],
    MTTQ: [
        "Phản biện xã hội",
        "Quỹ ủng hộ",
        "Đoàn Thanh niên",
        "Hội Phụ nữ",
        "Hội Cựu chiến binh",
        "Công đoàn",
        "Hội quần chúng",
    ],
};
const units = [
    "Văn phòng Đảng ủy",
    "Văn phòng HĐND",
    "Văn phòng UBND",
    "Ủy ban MTTQ",
    "Bộ phận Một cửa",
    "Công chức Văn phòng - Thống kê",
    "Công chức Tài chính - Kế toán",
    "Công chức Địa chính - Xây dựng",
    "Công chức Văn hóa - Xã hội",
    "Công an phường",
    "Trạm Y tế",
    "Các trường học",
];

const fieldGroups = [
    { key: "an_toan_thuc_pham", value: "An toàn thực phẩm" },
    { key: "chay_no", value: "Cháy nổ" },
    { key: "cong_thuong", value: "Công thương" },
    { key: "cu_tri_kien_nghi", value: "Cử tri – kiến nghị" },
    { key: "dan_toc_ton_giao", value: "Dân tộc tôn giáo" },
    { key: "du_lich", value: "Du lịch" },
    { key: "dieu_hanh_chi_dao", value: "Điều hành – chỉ đạo" },
    { key: "dieu_hanh_ky_hop", value: "Điều hành kỳ họp" },
    { key: "doan_the_chinh_tri_xa_hoi", value: "Đoàn thể chính trị - xã hội" },
    { key: "giam_sat_chuyen_de", value: "Giám sát chuyên đề" },
    { key: "giao_duc_dao_tao", value: "Giáo dục đào tạo" },
    { key: "giao_duc_va_dao_tao", value: "Giáo dục và Đào tạo" },
    { key: "hanh_chinh_cong", value: "Hành chính công" },
    { key: "khoa_hoc_cong_nghe", value: "Khoa học công nghệ" },
    { key: "khu_cong_nghiep", value: "Khu công nghiệp" },
    { key: "kiem_tra_giam_sat_ubkt", value: "Kiểm tra – giám sát (UBKT)" },
    { key: "kinh_te_xa_hoi", value: "Kinh tế – xã hội" },
    { key: "nghi_quyet_57_nq_tw", value: "Nghị quyết 57-NQ/TW" },
    { key: "noi_chinh_tiep_cong_dan", value: "Nội chính – tiếp công dân" },
    { key: "noi_vu", value: "Nội vụ" },
    { key: "nong_nghiep", value: "Nông nghiệp" },
    { key: "nong_nghiep_va_moi_truong", value: "Nông nghiệp và Môi trường" },
    { key: "phan_bien_xa_hoi", value: "Phản biện xã hội" },
    { key: "quy_bien_dao", value: "Quỹ biển đảo" },
    { key: "quy_hoach_kien_truc", value: "Quy hoạch kiến trúc" },
    { key: "quy_vi_nguoi_ngheo", value: "Quỹ vì người nghèo" },
    { key: "tai_chinh", value: "Tài chính" },
    { key: "tai_chinh_ngan_sach", value: "Tài chính – ngân sách" },
    { key: "tang_qua_tet", value: "Tặng quà Tết" },
    { key: "theo_doi_nghi_quyet", value: "Theo dõi nghị quyết" },
    { key: "to_chuc_can_bo_ban_to_chuc", value: "Tổ chức cán bộ (Ban Tổ chức)" },
    { key: "trat_tu_do_thi", value: "Trật tự đô thị" },
    { key: "tuyen_giao_dan_van", value: "Tuyên giáo – dân vận" },
    { key: "tu_phap", value: "Tư pháp" },
    { key: "ung_ngap_do_thi", value: "Úng ngập đô thị" },
    { key: "van_ban_dieu_hanh", value: "Văn bản điều hành" },
    { key: "van_hoa_the_thao", value: "Văn hóa - thể thao" },
    { key: "ve_sinh_moi_truong", value: "Vệ sinh môi trường" },
    { key: "xay_dung", value: "Xây dựng" },
    { key: "y_te", value: "Y tế" },
];

const leadUnits = [
    { key: "ban_noi_chinh_thanh_uy", value: "Ban Nội chính Thành ủy" },
    { key: "ban_to_chuc_thanh_uy", value: "Ban Tổ chức Thành ủy" },
    {
        key: "ban_tuyen_giao_va_dan_van_thanh_uy",
        value: "Ban Tuyên giáo và Dân vận Thành ủy",
    },
    { key: "so_giao_duc_va_dao_tao", value: "Sở Giáo dục và Đào tạo" },
    { key: "so_noi_vu", value: "Sở Nội vụ" },
    {
        key: "so_nong_nghiep_va_moi_truong",
        value: "Sở Nông nghiệp và Môi trường",
    },
    { key: "so_tai_chinh", value: "Sở Tài chính" },
    { key: "so_y_te", value: "Sở Y tế" },
    {
        key: "trung_tam_phuc_vu_hanh_chinh_cong_thanh_pho",
        value: "Trung tâm Phục vụ hành chính công Thành phố",
    },
    { key: "uy_ban_kiem_tra_thanh_uy", value: "Ủy ban Kiểm tra Thành ủy" },
    {
        key: "uy_ban_mttq_viet_nam_thanh_pho",
        value: "Ủy ban MTTQ Việt Nam Thành phố",
    },
    { key: "van_phong_hdnd_thanh_pho", value: "Văn phòng HĐND Thành phố" },
    { key: "van_phong_thanh_uy", value: "Văn phòng Thành ủy" },
    { key: "van_phong_ubnd_thanh_pho", value: "Văn phòng UBND Thành phố" },
];

function extractCrmOptionList(group) {
    if (!group) return [];
    const raw = group.data || group.items || group.values || group.options || [];
    if (Array.isArray(raw)) {
        return raw
            .map((item) => {
                if (item == null) return null;
                if (typeof item !== "object") {
                    return { value: String(item), label: String(item) };
                }
                const value = item.value ?? item.code ?? item.id ?? item.key;
                if (value == null || value === "") return null;
                return {
                    value: String(value),
                    label: String(item.title || item.name || item.label || value),
                };
            })
            .filter(Boolean);
    }
    if (raw && typeof raw === "object") {
        return Object.entries(raw).map(([value, title]) => ({
            value: String(value),
            label: String(
                title && typeof title === "object"
                    ? title.title || title.name || value
                    : (title ?? value),
            ),
        }));
    }
    return [];
}

function getFieldGroupOptions() {
    const fromCrm = extractCrmOptionList(crmStatusCache?.S3103);
    if (fromCrm.length) {
        return [{ value: "", label: "Tất cả lĩnh vực" }, ...fromCrm];
    }
    return fieldGroups;
}

function getLeadUnitOptions() {
    // value = id SỐ (iddv) vì API lọc theo `iddvChuTri`; label = tên đơn vị để hiển thị.
    const fromOrg = (window.__orgLeadUnitOptions || [])
        .map((u) => ({ value: String(u.id || u._id || ""), label: String(u.fullName || u.name || u.id || "") }))
        .filter((x) => x.value && x.label);
    if (fromOrg.length) {
        return [{ value: "", label: "Tất cả đơn vị" }, ...fromOrg];
    }
    const fromCrm = extractCrmOptionList(crmStatusCache?.S3O03);
    if (fromCrm.length) {
        return [{ value: "", label: "Tất cả đơn vị" }, ...fromCrm];
    }
    return leadUnits;
}

/* Ngày về `yyyy-mm-dd` cho <input type="date">. API trả cả 2 kiểu: "30/09/2026"
   (dd/mm/yyyy) và ISO "2026-09-30T…" -> nhận cả hai, không hợp lệ thì trả "". */
function qlnvToDateInput(v) {
    var s = String(v == null ? "" : v).trim();
    if (!s) return "";
    var dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy)
        return (
            dmy[3] +
            "-" +
            String(dmy[2]).padStart(2, "0") +
            "-" +
            String(dmy[1]).padStart(2, "0")
        );
    var iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return iso ? iso[1] : "";
}

function isoToApiDate(iso) {
    if (!iso) return "";
    const [y, m, d] = String(iso).split("-");
    if (!y || !m || !d) return "";
    return `${d}/${m}/${y}`;
}

function mapApiListItemToRecord(item, metric = "assigned") {
    if (isDocMetric(metric) && item && item.documentId != null) {
        return mapQlvbItemToRecord(item, metric);
    }
    const statusRaw = item?.statusType || item?.status || "";
    // docIn/docOut (statusDoc) giữ "Mới tạo" là trạng thái riêng biệt;
    // assigned/received (statusDefs) gộp "Mới tạo" vào "doing" (Chưa HT trong hạn).
    const statusMap = isDocMetric(metric)
        ? {
            "Mới tạo": "new",
            "Đang thực hiện": "doing",
            "Hoàn thành": "done",
            "Sắp hết hạn": "risk",
            "Nguy cơ trễ": "risk",
            "Quá hạn": "overdue",
            // moiTao: "new",
            // chuaHtTrongHan: "doing",
            // hoanThanh: "done",
            // chuaHTganhan: "risk",
            // chuaHTquahan: "overdue",
        }
        : {
            // "Hoàn thành": "done",
            // "Đang thực hiện": "doing",
            // "Sắp hết hạn": "risk",
            // "Nguy cơ trễ": "risk",
            // "Quá hạn": "overdue",
            // "Mới tạo": "doing",
            chuaHtTrongHan: "doing",
            hoanThanh: "done",
            chuaHtGanHan: "risk",
            chuaHtQuaHan: "overdue",
        };
    /* Route v2 `get-task` trả trạng thái là CÂU ("Chưa hoàn thành quá hạn", "Đã hoàn
       thành quá hạn"…) ở `trangThai`, KHÔNG phải mã `statusType` như route cũ -> bảng mã
       bên trên trượt hết và mọi bản ghi rơi về "doing". Ưu tiên phân loại theo câu. */
    const status =
        statusMap[statusRaw] ||
        (!isDocMetric(metric) && item?.trangThai
            ? subtaskStatusKey(item.trangThai)
            : null) ||
        (isDocMetric(metric) ? "new" : "doing");
    /* Tiến độ phải lấy SỐ THẬT từ API (`tienDoHoanThanh` dạng "0%"/"35%"). Trước đây
       hardcode 100/30/55 theo trạng thái nên nhiệm vụ vừa tạo đã hiện "55% hoàn thành".
       API không trả -> để 0 và bật cờ __hasProgress=false, chi tiết sẽ hiện trạng thái
       thay vì bịa %. */
    const pctRaw = item?.tienDoHoanThanh ?? item?.progress;
    const pctNum = parseInt(String(pctRaw ?? "").replace("%", ""), 10);
    const hasProgress = !isNaN(pctNum);
    const dueRaw = item?.thoiHanHoanThanh || item?.ngayHetHan || item?.due || "";
    const due = String(dueRaw).includes("-")
        ? isoToApiDate(String(dueRaw).slice(0, 10)) || dueRaw
        : dueRaw;

    return {
        /* ⚠️ `get-task` v2 KHÔNG trả `_id`, chỉ có `taskId` (số Bkav hoặc chuỗi 24 hex với
           nhiệm vụ do xã/phường tạo). Lấy `_id` như trước -> id = "" -> mở chi tiết và gọi
           sub-task với taskId RỖNG (route con-* cũ bỏ qua parentId rỗng nên trả về cả đống
           nhiệm vụ không liên quan). Giữ NGUYÊN VĂN, không parseInt. */
        id: item?.taskId != null ? String(item.taskId) : item?._id || "",
        numberDoc: item?.soKyHieu || item?.code || item?.soVanBan || "",
        role: window.__drawerListRole || currentRole || "UBND",
        metric,
        status,
        title: item?.tenNhiemVu || item?.title || "",
        field: item?.nhomLinhVuc || item?.nhomLinhVucName || item?.field || "",
        creator: item?.nguoiGiao || item?.createdBy || item?.lanhDaoChiDaoId || "",
        receiver: item?.donViPhoiHop || item?.donViThucHienName || "",
        nguoiThucHien: item?.nguoiThucHien || "",
        nguoiGiao: item?.nguoiGiao || "",
        unit: item?.donVi || item?.donViChuTriName || item?.donViChuTri || "",
        priority:
            (item?.doKhan && (item.doKhan.title || item.doKhan)) ||
            item?.priority ||
            "Thường",
        due,
        created: (() => {
            const raw = item?.ngayBatDau || item?.ngayChiDao || item?.createdAt || "";
            return isoToApiDate(qlnvToDateInput(raw)) || raw;
        })(),
        progress: hasProgress ? pctNum : 0,
        __hasProgress: hasProgress,
        description: item?.noiDungNhiemVu || item?.description || "",
        evidence: [],
        history: [],
        subtasks: [],
        _raw: item,
    };
}

function buildDrawerListFilterParams() {
    // Bảng ánh xạ giữa key trạng thái UI (statusDefs/statusDoc) và giá trị trạng thái API.
    const STATUS_KEY_MAP_DOC = {
        new: "moiTao",
        done: "hoanThanh",
        doing: "dangThucHien",
        soon: "sapHetHan",
        risk: "nguyCoTre",
        overdue: "quaHan",
    };
    const STATUS_KEY_MAP = {
        done: "hoanThanh",
        doing: "chuaHtTrongHan",
        risk: "chuaHtGanHan",
        overdue: "chuaHtQuaHan",
    };
    const search = (document.getElementById("qFilter")?.value || "").trim();
    const status =
        document.getElementById("statusFilter")?.value || drawerPieStatus || "";
    const nhomLinhVuc = document.getElementById("fieldGroups")?.value || "";
    const donViChuTri = document.getElementById("leadUnits")?.value || "";
    const batDauTuNgay = isoToApiDate(
        document.getElementById("batDauTuNgay")?.value || "",
    );
    const batDauDenNgay = isoToApiDate(
        document.getElementById("batDauDenNgay")?.value || "",
    );
    const hanXuLyTuNgay = isoToApiDate(
        document.getElementById("hanXuLyTuNgay")?.value || "",
    );
    const hanXuLyDenNgay = isoToApiDate(
        document.getElementById("hanXuLyDenNgay")?.value || "",
    );

    const params = {};
    if (search) params.search = search;
    // Chọn "Tất cả trạng thái" -> status === "" -> statusApiValue = undefined
    // -> fetchFromApi sẽ bỏ qua tham số này, không gửi lên API.
    const map = isDocMetric(activeMetric) ? STATUS_KEY_MAP_DOC : STATUS_KEY_MAP;
    const statusApiValue = map[status]; // Sẽ tự ra undefined nếu status null/undefined
    // quan-ly-nhiem-vu (assigned/received) dùng tham số "statusType",
    // van-ban-den/van-ban-di (docIn/docOut) dùng tham số "status".
    if (isDocMetric(activeMetric)) {
        params.status = statusApiValue;
    } else {
        params.statusType = statusApiValue;
    }
    params.nhomLinhVuc = nhomLinhVuc || undefined;
    params.donViChuTri = donViChuTri || undefined;
    params.batDauTuNgay = batDauTuNgay || undefined;
    params.batDauDenNgay = batDauDenNgay || undefined;
    params.hanXuLyTuNgay = hanXuLyTuNgay || undefined;
    params.hanXuLyDenNgay = hanXuLyDenNgay || undefined;
    console.log("params", params);
    return params;
}

function renderSelectOptions(options, selected = "", label = "") {
    return `
    <option value="">Tất cả ${label || ""}</option>
    ${(options || [])
            .map(
                (opt) => `
          <option
            value="${String(opt.key).replace(/"/g, "&quot;")}"
            ${String(opt.key) === String(selected) ? "selected" : ""}
          >
            ${opt.value}
          </option>`,
            )
            .join("")}
  `;
}

function filterFieldHtml(label, controlHtml) {
    return `<div class="filter-field"><label>${label}</label>${controlHtml}</div>`;
}

let currentAccount = null,
    currentRole = null,
    activeMetric = "received",
    activeIndicatorRole = null,
    currentDrawerRecords = [],
    records = [],
    indicatorRecords = [];
let drawerPieStatus = "";
let limit = 30;
let skip = 0;
let totalPage = 0;

function sumObj(o) {
    return statusDefs.reduce((a, s) => a + (o[s.key] || 0), 0);
}
function statusMeta(k, metric) {
    const defs = getStatusDefsForMetric(metric);
    return defs.find((s) => s.key === k) || defs[0];
}
function fmt(n) {
    return Number(n).toLocaleString("vi-VN");
}
function pct(n, d) {
    return d ? ((n / d) * 100).toFixed(1).replace(".", ",") + "%" : "0%";
}
function pad(n) {
    return String(n).padStart(2, "0");
}
function pick(arr, i) {
    return arr[i % arr.length];
}
function dueDate(i, status) {
    const d = new Date();
    let delta =
        {
            done: -i % 15,
            doing: (i % 12) + 3,
            regular: 30 + (i % 20),
            soon: (i % 4) + 1,
            risk: (i % 3) + 1,
            overdue: -((i % 8) + 1),
        }[status] || 5;
    d.setDate(d.getDate() + delta);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function progressFor(status, i) {
    return (
        {
            done: 100,
            doing: 45 + (i % 38),
            regular: 70 + (i % 22),
            soon: 65 + (i % 20),
            risk: 38 + (i % 30),
            overdue: 20 + (i % 35),
        }[status] || 50
    );
}

function _qlnvReadCookie(name) {
    try {
        var m = document.cookie.match(
            new RegExp(
                "(?:^|; )" +
                name.replace(/([.$?*|{}()\[\]\\\/+^])/g, "\\$1") +
                "=([^;]*)",
            ),
        );
        return m ? decodeURIComponent(m[1]) : "";
    } catch (e) {
        return "";
    }
}

function _qlnvCsrfToken() {
    return (
        _qlnvReadCookie("csrftoken") ||
        _qlnvReadCookie("csrf") ||
        _qlnvReadCookie("XSRF-TOKEN") ||
        ""
    );
}

var QLNV_TOKEN_MAX_AGE_MS = 10 * 60 * 1000;
function _qlnvParseJwtExpMs(jwt) {
    try {
        var parts = String(jwt).split(".");
        if (parts.length < 2) return 0;
        var b = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (b.length % 4) b += "=";
        var payload = JSON.parse(atob(b));
        if (!payload || !payload.exp) return 0;
        // CHẶN TRẦN hạn dùng lại. Token SSO trả exp = 361789526284 (năm 13434, expires_in hơn
        // 11.000 năm) -> tin nguyên giá trị đó thì token nằm trong localStorage vĩnh viễn:
        // đăng xuất rồi người khác đăng nhập trên cùng máy vẫn gọi API bằng token người trước.
        // Trần này ép lấy lại token từ /api/token (same-origin, cookie sẵn có nên rất rẻ).
        return Math.min(payload.exp * 1000, Date.now() + QLNV_TOKEN_MAX_AGE_MS);
    } catch (e) {
        return 0;
    }
}

function _qlnvPick(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
        var cur = obj,
            parts = keys[i].split("."),
            ok = true;
        for (var j = 0; j < parts.length; j++) {
            if (cur && typeof cur === "object" && parts[j] in cur) {
                cur = cur[parts[j]];
            } else {
                ok = false;
                break;
            }
        }
        if (ok && cur != null && cur !== "") return cur;
    }
    return "";
}

function _qlnvErr(code, msg) {
    var e = new Error(msg || code);
    e.code = code;
    return e;
}

function _qlnvHostToken() {
    try {
        if (typeof window !== "undefined" && window.QLNV_JWT_TOKEN)
            return String(window.QLNV_JWT_TOKEN);
    } catch (e) { }
    try {
        var t = localStorage.getItem("access_token");
        if (t) return String(t);
    } catch (e) { }
    return "";
}

function _qlnvFetchUsername() {
    var headers = { Accept: "application/json" };
    var csrf = _qlnvCsrfToken();
    if (csrf) headers["x-csrftoken"] = csrf;
    return fetch(QLNV_TOKEN_CFG.meUrl, {
        credentials: "include",
        headers: headers,
    })
        .then(function (r) {
            if (!r.ok) return null;
            return r.json();
        })
        .then(
            function (me) {
                var u = me
                    ? _qlnvPick(me, [
                        "username",
                        "userName",
                        "user_name",
                        "data.username",
                        "data.userName",
                        "user.username",
                        "user.userName",
                        "email",
                        "data.email",
                    ])
                    : "";
                return String(u || QLNV_TOKEN_CFG.username);
            },
            function () {
                return QLNV_TOKEN_CFG.username;
            },
        );
}

function _qlnvFetchAccessToken(username) {
    var body =
        "username=" +
        encodeURIComponent(username) +
        "&password=" +
        encodeURIComponent(QLNV_TOKEN_CFG.servicePassword) +
        "&client_id=" +
        encodeURIComponent(QLNV_TOKEN_CFG.clientIdToken) +
        "&grant_type=password&scope=" +
        encodeURIComponent(QLNV_TOKEN_CFG.scope);
    return fetch(QLNV_TOKEN_CFG.oauthBase + QLNV_TOKEN_CFG.tokenPath, {
        method: "POST",
        headers: {
            Accept: "*/*",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        credentials: "omit",
        body: body,
    })
        .then(function (r) {
            if (!r.ok) throw _qlnvErr("OAUTH_FAILED", "oauth/token HTTP " + r.status);
            return r.json();
        })
        .then(
            function (res) {
                var t = _qlnvPick(res, [
                    "access_token",
                    "accessToken",
                    "token",
                    "data.access_token",
                    "data.token",
                ]);
                if (!t)
                    throw _qlnvErr(
                        "OAUTH_FAILED",
                        "Không có access_token từ oauth/token",
                    );
                return String(t);
            },
            function (err) {
                if (err && err.code) throw err;
                throw _qlnvErr(
                    "CORS_BLOCKED",
                    "Không gọi được oauth/token (CORS/mạng): " +
                    ((err && err.message) || err),
                );
            },
        );
}

function _qlnvFetchAppJwt(accessTokenB2) {
    var q =
        "?client_id=" +
        encodeURIComponent(QLNV_TOKEN_CFG.clientIdAuthorize) +
        "&allowed=true" +
        "&redirect_uri=" +
        encodeURIComponent(QLNV_TOKEN_CFG.redirectUri) +
        "&state=" +
        encodeURIComponent(QLNV_TOKEN_CFG.state) +
        "&response_type=code&scope=" +
        encodeURIComponent(QLNV_TOKEN_CFG.scope);
    return fetch(QLNV_TOKEN_CFG.oauthBase + QLNV_TOKEN_CFG.authorizePath + q, {
        headers: { Accept: "*/*", Authorization: "Bearer " + accessTokenB2 },
        credentials: "include",
        redirect: "follow",
    })
        .then(function (r) {
            if (!r.ok)
                throw _qlnvErr("OAUTH_FAILED", "oauth/authorize HTTP " + r.status);
            var ct = r.headers.get("content-type") || "";
            if (ct.indexOf("json") >= 0) return r.json();
            return r.text().then(function (t) {
                try {
                    return JSON.parse(t);
                } catch (e) {
                    return { _raw: t };
                }
            });
        })
        .then(
            function (res) {
                var jwt = _qlnvPick(res, [
                    "access_token",
                    "accessToken",
                    "token",
                    "jwt",
                    "data.access_token",
                    "data.token",
                    "data.jwt",
                ]);
                if (!jwt) {
                    jwt =
                        _qlnvReadCookie("access_token") ||
                        (function () {
                            try {
                                return localStorage.getItem("access_token") || "";
                            } catch (e) {
                                return "";
                            }
                        })();
                }
                if (!jwt)
                    throw _qlnvErr(
                        "OAUTH_FAILED",
                        "Không lấy được JWT từ oauth/authorize callback",
                    );
                return String(jwt);
            },
            function (err) {
                if (err && err.code) throw err;
                throw _qlnvErr(
                    "CORS_BLOCKED",
                    "Không gọi được oauth/authorize (CORS/redirect): " +
                    ((err && err.message) || err),
                );
            },
        );
}

function _qlnvFetchProxyToken() {
    if (!QLNV_TOKEN_CFG.proxyTokenUrl)
        return Promise.reject(
            _qlnvErr("OAUTH_FAILED", "Chưa cấu hình proxyTokenUrl"),
        );
    return fetch(QLNV_TOKEN_CFG.proxyTokenUrl, {
        credentials: "include",
        headers: { Accept: "application/json" },
    })
        .then(function (r) {
            if (r.status === 401 || r.status === 403)
                throw _qlnvErr(
                    "NOT_AUTHENTICATED",
                    "Proxy: chưa đăng nhập (" + r.status + ")",
                );
            if (!r.ok) throw _qlnvErr("OAUTH_FAILED", "Proxy token HTTP " + r.status);
            return r.json();
        })
        .then(
            function (res) {
                var t = _qlnvPick(res, ["access_token", "token", "data.access_token"]);
                if (!t) throw _qlnvErr("OAUTH_FAILED", "Proxy không trả access_token");
                return String(t);
            },
            function (err) {
                if (err && err.code) throw err;
                throw _qlnvErr(
                    "CORS_BLOCKED",
                    "Không gọi được proxy token: " + ((err && err.message) || err),
                );
            },
        );
}

function getQlnvToken(opts) {
    opts = opts || {};
    var now = Date.now();
    if (
        !opts.force &&
        _qlnvTokenState.jwt &&
        now < _qlnvTokenState.expMs - 60000
    ) {
        return Promise.resolve(_qlnvTokenState.jwt);
    }
    // Token do widget KHÁC (iframe khác, cùng origin: tongquan/noti/...) lấy trước đó
    // và lưu localStorage — dùng lại thay vì mỗi iframe tự xin token riêng của mình.
    if (!opts.force) {
        var shared = localStorage.getItem("qlnv_jwt_access_token") || "";
        var sharedExp = shared ? _qlnvParseJwtExpMs(shared) : 0;
        if (shared && sharedExp && now < sharedExp - 60000) {
            _qlnvTokenState.jwt = shared;
            _qlnvTokenState.expMs = sharedExp;
            return Promise.resolve(shared);
        }
    }
    if (!QLNV_TOKEN_CFG.proxyTokenUrl) {
        var host = _qlnvHostToken();
        if (host) {
            _qlnvTokenState.jwt = host;
            _qlnvTokenState.expMs = _qlnvParseJwtExpMs(host) || now + 5 * 60000;
            return Promise.resolve(host);
        }
    }
    if (_qlnvTokenState.inflight) return _qlnvTokenState.inflight;
    var acquire = QLNV_TOKEN_CFG.proxyTokenUrl
        ? _qlnvFetchProxyToken()
        : _qlnvFetchUsername()
            .then(_qlnvFetchAccessToken)
            .then(function (accessTokenB2) {
                if (QLNV_TOKEN_CFG.useAuthorizeStep)
                    return _qlnvFetchAppJwt(accessTokenB2);
                return accessTokenB2;
            });
    var p = acquire.then(
        function (jwt) {
            _qlnvTokenState.jwt = jwt;
            var exp = _qlnvParseJwtExpMs(jwt);
            _qlnvTokenState.expMs = exp || Date.now() + 5 * 60000;
            _qlnvTokenState.inflight = null;
            try {
                localStorage.setItem("qlnv_jwt_access_token", jwt);
            } catch (e) { }
            return jwt;
        },
        function (err) {
            _qlnvTokenState.inflight = null;
            throw err;
        },
    );
    _qlnvTokenState.inflight = p;
    return p;
}

function clearQlnvToken() {
    _qlnvTokenState.jwt = "";
    _qlnvTokenState.expMs = 0;
    _qlnvTokenState.inflight = null;
}
function readQlnvToken() {
    return _qlnvTokenState.jwt || "";
}

try {
    if (typeof window !== "undefined") {
        window.QlnvToken = {
            get: getQlnvToken,
            clear: clearQlnvToken,
            current: readQlnvToken,
        };
    }
} catch (e) { }
function generateRecords() {
    let idCounter = 1;
    records = [];
    Object.keys(segmentTemplate).forEach((role) => {
        Object.keys(metricMeta).forEach((metric) => {
            statusDefs.forEach((st) => {
                const count = segmentTemplate[role][metric][st.key] || 0;
                for (let i = 0; i < count; i++) {
                    const titleBase =
                        metric === "docIn"
                            ? "Văn bản đến cần xử lý"
                            : metric === "docOut"
                                ? "Văn bản đi/phát hành"
                                : pick(taskTitlePool[role], i);
                    const field = pick(fieldPool[role], i + idCounter);
                    const creator =
                        metric === "received"
                            ? pick(
                                [
                                    "Thành phố",
                                    "Đảng ủy phường",
                                    "HĐND phường",
                                    "UBND phường",
                                    "MTTQ phường",
                                    "Sở/ngành phối hợp",
                                ],
                                i,
                            )
                            : axisMeta[role].name;
                    const receiver =
                        metric === "assigned"
                            ? pick(units, i + role.length)
                            : axisMeta[role].name;
                    records.push({
                        id: `PX-${metric.toUpperCase()}-${role}-${String(idCounter).padStart(4, "0")}`,
                        role,
                        metric,
                        status: st.key,
                        title: `${titleBase} #${i + 1}`,
                        field,
                        creator,
                        receiver,
                        unit: pick(units, i + idCounter),
                        priority:
                            st.key === "overdue" || st.key === "risk"
                                ? "Cao"
                                : st.key === "soon"
                                    ? "Trung bình"
                                    : "Bình thường",
                        due: dueDate(i, st.key),
                        created: `${pad((i % 25) + 1)}/06/2026`,
                        progress: progressFor(st.key, i),
                        description: `Hồ sơ demo thuộc ${axisMeta[role].name}, lĩnh vực ${field}. Nội dung dùng để mô phỏng vận hành IOC/CAD phường Việt Hưng, có theo dõi tiến độ, cảnh báo, đơn vị phối hợp và minh chứng số hóa.`,
                        evidence: [
                            `Biểu mẫu_${role}_${i + 1}.xlsx`,
                            `Văn bản_chỉ_đạo_${i + 1}.pdf`,
                            `Ảnh_minh_chứng_${i + 1}.jpg`,
                        ],
                        history: [
                            { time: "08:15 24/06/2026", text: "Tiếp nhận vào IOC/CAD" },
                            { time: "09:40 24/06/2026", text: `Phân loại ${st.label}` },
                            {
                                time: "14:20 25/06/2026",
                                text: `Gán xử lý cho ${pick(units, i + 2)}`,
                            },
                            {
                                time: "10:10 26/06/2026",
                                text: "Cập nhật tiến độ và đính kèm minh chứng",
                            },
                        ],
                        subtasks: [
                            {
                                name: "Rà soát dữ liệu nguồn",
                                owner: pick(units, i),
                                state: i % 3 === 0 ? "Hoàn thành" : "Đang xử lý",
                            },
                            {
                                name: "Đối chiếu báo cáo chuyên môn",
                                owner: pick(units, i + 1),
                                state: i % 4 === 0 ? "Sắp đến hạn" : "Đang xử lý",
                            },
                        ],
                    });
                    idCounter++;
                }
            });
        });
    });
    indicatorRecords = [];
    Object.keys(indicators).forEach((role) => {
        indicators[role].forEach((it, idx) => {
            const [name, count, freq, source] = it;
            for (let i = 0; i < count; i++) {
                const st = statusDefs[(i + idx) % statusDefs.length];
                indicatorRecords.push({
                    id: `CT-${role}-${idx + 1}-${String(i + 1).padStart(4, "0")}`,
                    role,
                    indicator: name,
                    status: st.key,
                    title: `${name} - bản ghi ${i + 1}`,
                    field: name,
                    source,
                    freq,
                    unit: pick(units, i),
                    due: dueDate(i, st.key),
                    progress: progressFor(st.key, i),
                    description: `Bản ghi chỉ tiêu ${name} của ${axisMeta[role].name}. Tần suất cập nhật ${freq}, nguồn ${source}.`,
                    history: [
                        { time: "07:30 26/06/2026", text: "Đồng bộ dữ liệu mẫu" },
                        { time: "11:00 26/06/2026", text: "Xác nhận số liệu cấp phường" },
                        {
                            time: "15:20 26/06/2026",
                            text: "Cập nhật tiến độ và đính kèm minh chứng",
                        },
                    ],
                });
            }
        });
    });
}

function allowedRoles(role = currentRole) {
    if (role === "DANG") return ["DANG", "HDND", "UBND", "MTTQ"];
    if (role === "UBND") return ["UBND", "HDND", "MTTQ"];
    if (role === "HDND") return ["HDND"];
    if (role === "MTTQ") return ["MTTQ"];
    return [];
}
function canSeeRole(role) {
    return allowedRoles().includes(role);
}
function isLimitedRole(role) {
    return currentRole === "UBND" && (role === "HDND" || role === "MTTQ");
}
function getVisibleRecords(metric = activeMetric) {
    return records.filter(
        (r) => canSeeRole(r.role) && (!metric || r.metric === metric),
    );
}
function metricTotal(role, metric) {
    return sumObj(segmentTemplate[role][metric]);
}
function statusTotal(metric, status, roles = allowedRoles()) {
    return roles.reduce(
        (a, r) => a + (segmentTemplate[r]?.[metric]?.[status] || 0),
        0,
    );
}
function metricTotalVisible(metric) {
    return allowedRoles().reduce((a, r) => a + metricTotal(r, metric), 0);
}

function initLogin() {
    generateRecords();
    const wrap = document.getElementById("loginAccounts");
    wrap.innerHTML = Object.values(accounts)
        .map(
            (acc) =>
                `<button class="account-pick" onclick="selectLogin('${acc.user}')"><div class="role-icon">${acc.icon}</div><div><b>${acc.title}</b><small>${acc.subtitle}</small><small class="muted">User: ${acc.user} · Pass: 123456</small></div></button>`,
        )
        .join("");
    selectLogin("ubnd");
    setInterval(updateClock, 1000);
    updateClock();
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            openQuickCommand();
        }
    });
}
function selectLogin(user) {
    document.getElementById("username").value = user;
    document.getElementById("password").value = "123456";
    document
        .querySelectorAll(".account-pick")
        .forEach((b) => b.classList.remove("active"));
    const idx = Object.keys(accounts).indexOf(user);
    if (idx >= 0)
        document.querySelectorAll(".account-pick")[idx].classList.add("active");
}
function login() {
    const u = document.getElementById("username").value.trim().toLowerCase();
    const p = document.getElementById("password").value;
    const acc = accounts[u];
    if (!acc || acc.pass !== p) {
        toast("Sai tài khoản hoặc mật khẩu demo. ");
        return;
    }
    currentAccount = acc;
    currentRole = acc.role;
    activeMetric = "received";
    activeIndicatorRole = allowedRoles()[0];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    renderAll();
    toast(`Đăng nhập ${acc.title}. Áp dụng phân quyền dữ liệu theo tài khoản.`);
}
function logout() {
    currentAccount = null;
    currentRole = null;
    closePanels();
    document.getElementById("app").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
}
function updateClock() {
    const d = new Date();
    document.getElementById("clock").textContent =
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    document.getElementById("dateText").textContent = d.toLocaleDateString(
        "vi-VN",
        { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" },
    );
}

function renderAll() {
    const meta = axisMeta[currentRole];
    document.getElementById("currentIcon").textContent = meta.icon;
    document.getElementById("currentRoleName").textContent = currentAccount.title;
    document.getElementById("currentRoleDesc").textContent =
        currentAccount.subtitle;
    renderNav();
    renderRoleScope();
    renderSummary();
    renderMetricTabs();
    renderAxisDashboard();
    renderIndicators();
    renderSources();
    renderNotifications();
    renderCad();
    renderDocOverview();
    renderPermission();
    renderRoleDetail();
    renderCustomizer();
    applyWidgetVisibility();
}
function renderNav() {
    const tabs = [
        ["overview", "🌐 Tổng quan", ""],
        ["DANG", "🚩 Khối Đảng ủy", "DANG"],
        ["HDND", "🏛️ HĐND", "HDND"],
        ["UBND", "🏢 UBND", "UBND"],
        ["MTTQ", "🤝 MTTQ", "MTTQ"],
        ["fields", "📊 Lĩnh vực", ""],
        ["data", "🧩 Widget & dữ liệu", ""],
    ];
    document.getElementById("navTabs").innerHTML = tabs
        .map((t) => {
            const locked = t[2] && !canSeeRole(t[2]);
            return `<button class="${t[0] === "overview" ? "active" : ""} ${locked ? "locked" : ""}" ${locked ? 'title="Không thuộc quyền xem"' : ""} onclick="navClick('${t[0]}','${t[2] || ""}')">${t[1]}</button>`;
        })
        .join("");
}
function navClick(tab, role) {
    if (role && !canSeeRole(role)) {
        toast("Tài khoản hiện tại không có quyền xem trục này.");
        return;
    }
    document
        .querySelectorAll(".nav button")
        .forEach((b) => b.classList.remove("active"));
    event.currentTarget.classList.add("active");
    if (role) {
        activeIndicatorRole = role;
        renderIndicators();
        document
            .querySelector('[data-widget="indicators"]')
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (tab === "fields") {
        document
            .querySelector('[data-widget="indicators"]')
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (tab === "data") {
        toggleCustomizer();
        toast("Đã mở cấu hình ẩn/hiện widget và phạm vi dữ liệu theo tài khoản.");
    }
}
function summaryClick(key) {
    console.log("key", key);
    if (metricMeta[key]) {
        activeMetric = key;
        renderMetricTabs();
        renderAxisDashboard();
        document
            .querySelector('[data-widget="axisDashboard"]')
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        openList({
            metric: key,
            title: `${metricMeta[key].label} · ${currentAccount.title}`,
        });
        toast(`Đã mở dashboard và bảng chi tiết: ${metricMeta[key].label}`);
        return;
    }
    if (key === "overdue" || key === "risk" || key === "done") {
        openList({
            metric: null,
            status: key === "done" ? "done" : key,
            title:
                key === "done"
                    ? "Danh sách hoàn thành đúng hạn"
                    : key === "risk"
                        ? "Danh sách nguy cơ trễ hạn"
                        : "Danh sách quá hạn",
        });
        return;
    }
    if (key === "indicators") {
        document
            .querySelector('[data-widget="indicators"]')
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        const r = activeIndicatorRole || allowedRoles()[0];
        activeIndicatorRole = r;
        renderIndicators();
        toast("Chọn một thẻ chỉ tiêu để xem biểu đồ pie và bảng dữ liệu chi tiết.");
    }
}
function renderMetricTabs() {
    if (!document.getElementById("metricTabs")) return;
    document.getElementById("metricTabs").innerHTML = Object.keys(metricMeta)
        .map(
            (m) =>
                `<button class="${activeMetric === m ? "active" : ""}" onclick="setMetric('${m}')">${metricMeta[m].icon} ${metricMeta[m].label} <b class="mono">${fmt(metricTotalVisible(m))}</b></button>`,
        )
        .join("");
}
function setMetric(m) {
    activeMetric = m;
    renderMetricTabs();
    renderAxisDashboard();
}
function renderAxisDashboard() {
    if (!document.getElementById("axisRows")) return;
    const roles = allowedRoles();
    document.getElementById("axisDashboardTitle").textContent =
        `${metricMeta[activeMetric].label.toUpperCase()} THEO TRỤC`;
    const total = metricTotalVisible(activeMetric);
    const done = statusTotal(activeMetric, "done", roles),
        risk = statusTotal(activeMetric, "risk", roles),
        overdue = statusTotal(activeMetric, "overdue", roles),
        soon = statusTotal(activeMetric, "soon", roles);
    const actionTitle =
        activeMetric === "assigned"
            ? "Giao nhiệm vụ theo trục"
            : activeMetric === "received"
                ? "Xử lý nhiệm vụ nhận"
                : activeMetric === "docIn"
                    ? "Xử lý văn bản đến"
                    : "Theo dõi văn bản đi";
    if (document.getElementById("axisActions")) {
        document.getElementById("axisActions").innerHTML = `
    <div class="axis-action-card"><h4>${metricMeta[activeMetric].icon} ${actionTitle}</h4><div class="axis-action-buttons"><button class="primary" onclick="qlnvxOpenAssignmentForm()">＋ Giao nhiệm vụ</button><button class="ghost danger-btn" onclick="openList({metric:'${activeMetric}',status:'risk',title:'Nguy cơ trễ hạn · ${metricMeta[activeMetric].short}'})">Nhắc nguy cơ trễ</button></div></div>`;
    }
    const top = statusDefs
        .map((st) => {
            const n = statusTotal(activeMetric, st.key, roles);
            return `<button class="seg-kpi" onclick="openList({metric:'${activeMetric}',status:'${st.key}',title:'${st.label} - ${metricMeta[activeMetric].short}'})"><span>${st.label}</span><b class="mono" style="color:${st.color}">${fmt(n)}</b><span>${pct(n, total)}</span></button>`;
        })
        .join("");
    document.getElementById("segKpis").innerHTML = top;
    document.getElementById("axisRows").innerHTML = roles
        .map((role) => {
            const data = segmentTemplate[role][activeMetric];
            const rowTotal = sumObj(data);
            const segs = statusDefs
                .map((st) => {
                    const n = data[st.key] || 0;
                    const w = rowTotal ? (n / rowTotal) * 100 : 0;
                    return `<button class="seg ${n ? "" : "zero"}" title="${axisMeta[role].name} · ${st.label}: ${n}" style="width:${w}%;background:${st.color}" onclick="openList({metric:'${activeMetric}',role:'${role}',status:'${st.key}',title:'${axisMeta[role].name} · ${st.label}'})">${n ? fmt(n) : ""}</button>`;
                })
                .join("");
            return `<div class="axis-row"><button class="axis-label" onclick="openList({metric:'${activeMetric}',role:'${role}',title:'${axisMeta[role].name} · ${metricMeta[activeMetric].label}'})">${axisMeta[role].icon} ${axisMeta[role].name}</button><div class="bar">${segs}</div><button class="axis-total mono" onclick="openList({metric:'${activeMetric}',role:'${role}',title:'${axisMeta[role].name} · ${metricMeta[activeMetric].label}'})">${fmt(rowTotal)}</button></div>`;
        })
        .join("");
    document.getElementById("legend").innerHTML = statusDefs
        .map(
            (s) =>
                `<span><i class="sw" style="background:${s.color}"></i>${s.label}</span>`,
        )
        .join("");
}
function renderIndicators() {
    const roles = allowedRoles();
    if (!roles.includes(activeIndicatorRole)) activeIndicatorRole = roles[0];
    document.getElementById("indicatorRoleTabs").innerHTML = roles
        .map(
            (r) =>
                `<button class="${activeIndicatorRole === r ? "active" : ""}" onclick="activeIndicatorRole='${r}';renderIndicators()">${axisMeta[r].icon} ${axisMeta[r].name}</button>`,
        )
        .join("");
    const items = indicators[activeIndicatorRole] || [];
    document.getElementById("indicatorGrid").innerHTML = items
        .map((it, idx) => {
            const [name, count, freq, source] = it;
            const val = Math.min(96, 58 + ((idx * 7) % 39));
            return `<button class="indicator-card" onclick="openIndicator('${activeIndicatorRole}',${idx})"><h4>${name}</h4><div class="row"><span class="badge">${freq}</span><span class="badge ${source.includes("API") ? "ok" : "gold"}">${source}</span></div><div class="row"><span class="muted">Bản ghi/chỉ tiêu</span><b class="metric mono">${fmt(count)}</b></div><div class="mini-progress"><i style="width:${val}%"></i></div><small class="muted">Click: cấp 1 danh sách ${fmt(count)} bản ghi → cấp 2 hồ sơ chi tiết</small></button>`;
        })
        .join("");
}
function renderSources() {
    const data = [
        ["API realtime", "Một cửa, văn bản, đồng bộ DVC", "98%"],
        ["Excel import", "Báo cáo chuyên môn, đoàn thể", "42 file"],
        ["CSDL chuyên ngành", "Tài chính, giáo dục, nội vụ", "12 nguồn"],
        ["Văn bản/PDF", "Minh chứng, kết luận, nghị quyết", "165"],
        ["Cảnh báo IOC", "Quá hạn, nguy cơ trễ, biến động chỉ số", "27"],
    ];
    document.getElementById("sourceList").innerHTML = data
        .map(
            (r, i) =>
                `<button class="source-item" onclick="openSourceDetail('${r[0]}')"><div class="dot">${["🔌", "📗", "🗄️", "📎", "🔔"][i]}</div><div><b>${r[0]}</b><small>${r[1]}</small></div><span class="badge ${i === 0 ? "ok" : i === 4 ? "red" : "gold"}">${r[2]}</span></button>`,
        )
        .join("");
}
function openIncidentDetail(id) {
    const n = (window.__incidents || []).find((x) => x.id === id);
    if (!n) return;
    const related = records
        .filter(
            (r) =>
                canSeeRole(r.role) &&
                r.role === n.role &&
                r.metric === n.metric &&
                r.status === n.status,
        )
        .slice(0, 8);
    document.getElementById("modalTitle").textContent =
        `Notify IOC/CAD · ${n.type}`;
    document.getElementById("modalSub").textContent =
        `${axisMeta[n.role].name} · mức ${n.level} · ${n.title}`;
    const isFire = n.id === "fire-market";
    document.getElementById("modalBody").innerHTML =
        `<div class="incident-modal-grid"><div class="detail-card"><h4>Thông tin cảnh báo</h4><div class="kv"><b>Loại</b><span>${n.type}</span><b>Mức độ</b><span class="${n.level === "Khẩn" ? "danger" : "warn"}">${n.level}</span><b>Đơn vị/trục</b><span>${axisMeta[n.role].icon} ${axisMeta[n.role].name}</span><b>Nội dung</b><span>${n.title}</span><b>Khuyến nghị</b><span>${n.sub}</span><b>SLA</b><span>${isFire ? "15 phút tiếp nhận · 30 phút xử lý bước đầu" : "Trong ngày làm việc"}</span></div><div class="action-bar" style="margin-top:12px"><button class="primary" onclick="qlnvxOpenAssignmentForm()">Giao xử lý</button><button class="ghost" onclick="openList({metric:'${n.metric}',role:'${n.role}',status:'${n.status}',title:'${n.title}'})">Mở hồ sơ liên quan</button><button class="ghost danger-btn" onclick="toast('Đã kích hoạt SOP ${n.type} và gửi notify tới đơn vị trực.')">Kích hoạt SOP</button></div></div><div class="detail-card"><h4>SOP xử lý đề xuất</h4>${["Tiếp nhận/cảnh báo IOC", "Phân loại mức độ & địa bàn", "Gán đơn vị chủ trì/phối hợp", "Theo dõi SLA và cập nhật hiện trường", "Kết thúc xử lý, báo cáo lãnh đạo"].map((s, i) => `<div class="sop-step"><i>${i + 1}</i><span>${s}</span><span class="badge ${i < 2 ? "ok" : "gold"}">${i < 2 ? "Tự động" : "Thao tác"}</span></div>`).join("")}</div></div><div class="detail-card"><h4>Hồ sơ/nhiệm vụ liên quan</h4><table class="compact-table"><thead><tr><th>Mã</th><th>Nội dung</th><th>Đơn vị</th><th>Trạng thái</th></tr></thead><tbody>${related.map((r) => `<tr onclick="qlnvxOpenRecordDetail('${r.id}')"><td>${r.id}</td><td>${r.title}</td><td>${r.unit}</td><td>${statusMeta(r.status).short}</td></tr>`).join("") || '<tr><td colspan="4">Chưa có hồ sơ liên quan</td></tr>'}</tbody></table></div>`;
    openModal();
}
function renderCad() {
    document.getElementById("cadBox").innerHTML =
        `<div class="cmd-row"><button class="ghost" onclick="qlnvxOpenAssignmentForm()">📤 <span>Giao nhiệm vụ IOC/CAD</span></button></div><div class="cmd-row"><button class="ghost" onclick="openList({metric:'received',status:'soon',title:'Nhiệm vụ cần nhắc việc'})">🔔 <span>Nhắc việc sắp hạn</span></button><button class="ghost danger-btn" onclick="openList({metric:null,status:'overdue',title:'Báo cáo vượt cấp: quá hạn'})">⚠️ <span>Báo cáo vượt cấp</span></button></div><button class="primary" onclick="openQuickCommand()">Mở lệnh nhanh điều hành</button>`;
}
function renderDocOverview() {
    const inTotal = metricTotalVisible("docIn"),
        outTotal = metricTotalVisible("docOut");
    document.getElementById("docOverview").innerHTML =
        `<div class="kpi-grid"><button class="kpi gold" onclick="setMetric('docIn');document.querySelector('[data-widget=axisDashboard]')?.scrollIntoView({behavior:'smooth'})"><small>Văn bản đến được phép xem</small><div class="num mono">${fmt(inTotal)}</div><div class="hint">Theo trạng thái xử lý, đơn vị, hạn và cảnh báo</div></button><button class="kpi purple" onclick="setMetric('docOut');document.querySelector('[data-widget=axisDashboard]')?.scrollIntoView({behavior:'smooth'})"><small>Văn bản đi/phát hành</small><div class="num mono">${fmt(outTotal)}</div><div class="hint">Liên thông, nội bộ, kết luận, báo cáo</div></button></div><table class="compact-table"><thead><tr><th>Trục</th><th>VB đến</th><th>VB đi</th><th>Quá hạn</th></tr></thead><tbody>${allowedRoles()
            .map(
                (r) =>
                    `<tr onclick="openList({metric:'docIn',role:'${r}',title:'Văn bản đến · ${axisMeta[r].name}'})"><td>${axisMeta[r].icon} ${axisMeta[r].name}</td><td class="mono">${fmt(metricTotal(r, "docIn"))}</td><td class="mono">${fmt(metricTotal(r, "docOut"))}</td><td class="mono danger">${fmt(segmentTemplate[r].docIn.overdue + segmentTemplate[r].docOut.overdue)}</td></tr>`,
            )
            .join("")}</tbody></table>`;
}
function renderPermission() {
    if (!document.getElementById("permissionBody")) return;
    const r = currentRole;
    const text = {
        DANG: "Được xem tất cả trục, tất cả cấp, đầy đủ nhiệm vụ, văn bản, chỉ tiêu, lịch sử xử lý và minh chứng.",
        UBND: "Được xem đầy đủ UBND và lĩnh vực chuyên môn; được xem chỉ số/tổng hợp HĐND, MTTQ; chi tiết nhạy cảm ngoài UBND bị che.",
        HDND: "Chỉ xem chỉ tiêu, nhiệm vụ, văn bản và hồ sơ HĐND; không xem dữ liệu Đảng ủy, UBND, MTTQ ngoài phối hợp.",
        MTTQ: "Chỉ xem MTTQ và đoàn thể; không xem dữ liệu Đảng ủy, HĐND, UBND ngoài phối hợp.",
    }[r];
    document.getElementById("permissionBody").innerHTML =
        `<div class="access-lock"><b>${currentAccount.title}</b><br/>${text}</div><table class="compact-table"><thead><tr><th>Trục</th><th>Chỉ số</th><th>Danh sách</th><th>Chi tiết</th></tr></thead><tbody>${[
            "DANG",
            "HDND",
            "UBND",
            "MTTQ",
        ]
            .map((role) => {
                const allow = canSeeRole(role);
                const limited = isLimitedRole(role);
                return `<tr><td>${axisMeta[role].icon} ${axisMeta[role].name}</td><td>${allow ? "✅" : "❌"}</td><td>${allow ? "✅" : "❌"}</td><td>${allow ? (limited ? "Giới hạn/masking" : "✅ đầy đủ") : "❌"}</td></tr>`;
            })
            .join("")}</tbody></table>`;
}

function openList(opts) {
    const {
        metric = null,
        role = null,
        status = null,
        title = "Danh sách",
    } = opts || {};
    let base = records.filter((r) => canSeeRole(r.role));

    if (metric) base = base.filter((r) => r.metric === metric);
    if (role) base = base.filter((r) => r.role === role);
    currentDrawerRecords = base;
    drawerPieStatus = status || "";
    document.getElementById("drawerTitle").textContent = "Sở giáo dục và đào tạo";

    const selected = drawerPieStatus
        ? ` · ${statusMeta(drawerPieStatus).label}`
        : "";
    renderDrawerList(base);
    openDrawer();
}

function renderDrawerList(rs) {
    const body = document.getElementById("drawerBody");
    const roles = [...new Set(rs.map((r) => r.role))];
    const fieldOpts = getFieldGroupOptions();
    const leadOpts = getLeadUnitOptions();

    body.innerHTML = `<div class="filters filters-drawer">${filterFieldHtml(
        "Tìm kiếm",
        `<input id="qFilter" placeholder="Tìm mã, tiêu đề, lĩnh vực..." oninput="applyDrawerFiltersGd()"/>`,
    )}
    ${filterFieldHtml(
        "Đơn vị chủ trì",
        `<select id="leadUnits" onchange="applyDrawerFiltersGd()">${renderSelectOptions(leadOpts)}</select>`,
    )}${filterFieldHtml(
        "Nhóm lĩnh vực",
        `<select id="fieldGroups" onchange="applyDrawerFiltersGd()">${renderSelectOptions(fieldOpts)}</select>`,
    )}${filterFieldHtml(
        "Trạng thái",
        `<select id="statusFilter" onchange="applyDrawerFiltersGd()"><option value="">Tất cả trạng thái</option>${statusDefs.map((s) => `<option value="${s.key}">${s.label}</option>`).join("")}</select>`,
    )}${filterFieldHtml(
        "Loại",
        `<select id="metricFilter" onchange="applyDrawerFiltersGd()"><option value="">Tất cả loại</option>${Object.keys(
            metricMeta,
        )
            .map((m) => `<option value="${m}">${metricMeta[m].label}</option>`)
            .join("")}</select>`,
    )}${filterFieldHtml(
        "Bắt đầu từ ngày",
        `<input id="batDauTuNgay" type="date" onchange="applyDrawerFiltersGd()"/>`,
    )}${filterFieldHtml(
        "Bắt đầu đến ngày",
        `<input id="batDauDenNgay" type="date" onchange="applyDrawerFiltersGd()"/>`,
    )}${filterFieldHtml(
        "Hạn xử lý từ ngày",
        `<input id="hanXuLyTuNgay" type="date" onchange="applyDrawerFiltersGd()"/>`,
    )}${filterFieldHtml(
        "Hạn xử lý đến ngày",
        `<input id="hanXuLyDenNgay" type="date" onchange="applyDrawerFiltersGd()"/>`,
    )}</div><div class="list-summary" id="listSummary"></div><div id="recordList"></div><div id="drawerPagination"></div>`;
    applyDrawerFiltersGd();
}

function drawerCounts() {
    const data = window.metricsApiData[activeMetric];
    console.log("data", data);
    const mapCounts = {
        hoanthanh: data["hoanThanh"],
        chuaHtTrongHan: data["dangThucHien"] + data["moiTao"],
        chuaHTganhan: data["nguyCoTre"] + data["sapHetHan"],
        chuaHTquahan: data["quaHan"],
    };
    return statusDefs.map((st) => ({
        key: st.key,
        label: st.label,
        short: st.short,
        color: st.color,
        count: mapCounts[st.key],
    }));
}

function formatDate(date) {
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
}

function vptuDisplayId(id) {
    return String(id).replace(/-OUT$/, "");
}

(function () {
    let drawerPage = 0;
    /* 20 = đúng cỡ trang mặc định của BE (qlnvV2.controller: `Number(req.query.limit) || 20`)
       và cũng là cỡ trang UI đang chạy. Để lệch thì FE đánh số dòng một đằng, BE cắt trang
       một nẻo -> trang 2 hiện "11–30" trong khi BE trả bản ghi 21–40. */
    const DRAWER_LIST_DEFAULT_LIMIT = 20;
    const oldOpenIndicator = openIndicator;

    function overviewSvg(segments, total, center, sub, group) {
        total = segments.reduce((a, s) => a + (s.value || 0), 0) || 1;
        let angle = 0;
        const paths = segments
            .map((s, idx) => {
                const val = Math.max(0, s.value || 0);
                const len = (val / total) * 360;
                const start = angle;
                const end = angle + len;
                angle = end;
                if (!val) return "";
                return `<path class="overview-seg" 
            d="${donutArc(90, 90, 62, start, start == 0 && end === 360 ? 359.9 : end)}" 
            fill="none" stroke="${s.color}" 
            stroke-width="20" stroke-linecap="butt"
            onclick="openOverviewPieSegment('${group}','${s.key}')"><title>${s.label}: ${fmt(val)}</title></path>`;
            })
            .join("");
        return `<svg class="overview-donut" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="62" fill="none" stroke="#06192c" stroke-width="20"/>
            ${paths}
            <circle cx="90" cy="90" r="42" fill="#061528" stroke="rgba(87,178,255,.24)"/><text x="90" y="86" text-anchor="middle" 
            class="overview-center">${center}</text><text x="90" y="105" text-anchor="middle" class="overview-sub">${sub}</text>
            </svg>`;
    }

    openOverviewPieSegment = window.openOverviewPieSegment = function (
        group,
        key,
    ) {
        if (group === "metric") {
            activeMetric = key;
            openList({
                metric: key,
                title: `${metricMeta[key].short}  · Tài khoản Sở giáo dục và đào tạo`,
            });
            // renderMetricTabs();
            renderAxisDashboard();
            return;
        }
        if (
            group === "assigned" ||
            group === "received" ||
            group === "docIn" ||
            group === "docOut"
        ) {
            /* ĐẶT ĐỦ CẢ 3 BIẾN metric ngay tại đây: donut đọc __drawerListMetric,
               bảng danh sách đọc _type, phần còn lại đọc activeMetric. Thiếu một cái là
               drawer "Nhiệm vụ giao" vẽ số của "Nhiệm vụ nhận" (đúng lỗi 58/60). */
            activeMetric = group;
            window._type = group;
            window.__drawerListMetric = group;
            openList({
                metric: group,
                status: key,
                title: `${metricMeta[group]?.short || "Danh sách"} · ${key ? statusMeta(key, group).label : "Tất cả trạng thái"}`,
            });
            return;
        }
        if (group === "status") {
            activeMetric = "assigned";
            openList({
                metric: "assigned",
                status: key,
                title: `${statusMeta(key, "assigned").label} · Nhiệm vụ giao`,
            });
            return;
        }
        if (group === "role") {
            activeIndicatorRole = key;
            renderIndicators();
            openList({
                metric: null,
                role: key,
                title: `${axisMeta[key].name} · toàn bộ nhiệm vụ/văn bản`,
            });
            return;
        }
        if (group === "alert") {
            if (["soon", "risk", "overdue"].includes(key)) {
                openList({
                    metric: null,
                    status: key,
                    title: `Cảnh báo ${statusMeta(key).short}`,
                });
                return;
            }
            if (key === "fire") {
                const canFire = allowedRoles().includes("UBND");
                if (
                    canFire &&
                    (window.__incidents || []).some((x) => x.id === "fire-market")
                )
                    openIncidentDetail("fire-market");
                else
                    toast(
                        "Tài khoản hiện tại không có điểm nóng cháy nổ trong phạm vi quyền.",
                    );
                return;
            }
            if (key === "meetings") {
                openCalendar(null, "Lịch họp cần nhắc", "upcoming");
                return;
            }
        }
        if (group === "calendar") {
            openCalendar(null, "Lịch công tác/kỳ họp", key);
        }
    };

    openList = window.openList = function (opts) {
        console.log("opts", opts);
        const {
            metric = null,
            role = null,
            status = null,
            title = "Danh sách",
        } = opts || {};
        console.log("records", records);
        let base = records.filter((r) => canSeeRole(r.role));
        if (metric) base = base.filter((r) => r.metric === metric);
        if (role) base = base.filter((r) => r.role === role);
        currentDrawerRecords = base;
        drawerPieStatus = status || "";
        window.__drawerListMetric = metric;
        window.__drawerListRole = role;
        document.getElementById("drawerTitle").textContent =
            window._type === "assigned"
                ? "Nhiệm vụ giao"
                : window._type === "received"
                    ? "Nhiệm vụ nhận"
                    : "Sở giáo dục và đào tạo";
        const selected = drawerPieStatus
            ? ` · Đang lọc: ${statusMeta(drawerPieStatus, metric).label}`
            : "";
        console.log("selected", selected);
        renderDrawerList(base);
        openDrawer();
    };

    renderDrawerList = window.renderDrawerList = function (rs) {
        const body = document.getElementById("drawerBody");
        const roles = [...new Set(rs.map((r) => r.role))];
        const fieldOpts = getFieldGroupOptions();
        const leadOpts = getLeadUnitOptions();
        const savedFilters = window.__drawerFilterState || {};
        body.innerHTML = `<div class="drawer-pie-layout"><div class="drawer-pie-box"><div 
    id="drawerPieSvg"></div><button class="ghost" onclick="openOverviewPieSegment('drawerStatus','')">Xem tất cả trạng thái</button>
    </div><div class="drawer-pie-side"><h4 style="margin:0">Phân bổ kết quả xử lý</h4><div class="drawer-pie-legend" id="drawerPieLegend" style="margin-top:24px;"></div><div class="status-bar-mini" id="drawerPieBars">
    </div></div></div><div class="filters filters-drawer">${filterFieldHtml(
            "Tìm kiếm",
            `<input id="qFilter" placeholder="Tìm mã, tiêu đề, lĩnh vực..." value="${savedFilters.q || ""}" oninput="applyDrawerFiltersGd()"/>`,
        )}
        ${filterFieldHtml(
            "Đơn vị chủ trì",
            `<select id="leadUnits" onchange="applyDrawerFiltersGd()">${renderSelectOptions(leadOpts, savedFilters.leadUnits || "", "đơn vị")}</select>`,
        )}${filterFieldHtml(
            "Nhóm lĩnh vực",
            `<select id="fieldGroups" onchange="applyDrawerFiltersGd()">${renderSelectOptions(fieldOpts, savedFilters.fieldGroups || "", "lĩnh vực")}</select>`,
        )}${filterFieldHtml(
            "Trạng thái",
            `<select id="statusFilter" onchange="drawerPieStatus=this.value;window.__drawerPieStatus=this.value;applyDrawerFiltersGd()"><option value="">Tất cả trạng thái</option>${getStatusDefsForMetric(
                activeMetric,
            )
                .map(
                    (s) =>
                        `<option value="${s.key}" ${(drawerPieStatus || savedFilters.status) === s.key ? "selected" : ""}>${s.label}</option>`,
                )
                .join("")}</select>`,
        )}${filterFieldHtml(
            "Bắt đầu từ ngày",
            `<input id="batDauTuNgay" type="date" value="${savedFilters.batDauTuNgay || ""}" onchange="applyDrawerFiltersGd()"/>`,
        )}${filterFieldHtml(
            "Bắt đầu đến ngày",
            `<input id="batDauDenNgay" type="date" value="${savedFilters.batDauDenNgay || ""}" onchange="applyDrawerFiltersGd()"/>`,
        )}${filterFieldHtml(
            "Hạn xử lý từ ngày",
            `<input id="hanXuLyTuNgay" type="date" value="${savedFilters.hanXuLyTuNgay || ""}" onchange="applyDrawerFiltersGd()"/>`,
        )}${filterFieldHtml(
            "Hạn xử lý đến ngày",
            `<input id="hanXuLyDenNgay" type="date" value="${formatDate(savedFilters.hanXuLyDenNgay) || ""}" onchange="applyDrawerFiltersGd()"/>`,
        )}</div><div id="recordList"></div><div id="drawerPagination"></div>`;
        renderDrawerPie();
        applyDrawerFiltersGd();
    };

    // Bảng ánh xạ giữa key của UI (statusDefs/statusDoc) và key trả về từ API
    // const STATUS_KEY_MAP = {
    //     new: "moiTao",
    //     done: "hoanThanh",
    //     doing: "dangThucHien",
    //     soon: "sapHetHan",
    //     risk: "nguyCoTre",
    //     overdue: "quaHan",
    //     regular: "thuongXuyen", // Trường này nếu API không có sẽ tự động về 0
    // };

    function drawerCounts(metricKey = "assigned") {
        console.log("activeMetric", activeMetric);
        // 1. Lấy dữ liệu API tương ứng (mặc định lấy 'assigned', có thể truyền 'received'...)
        const apiData =
            (window.metricsApiData && window.metricsApiData[metricKey]) || {};
        // assigned/received (statusDefs) gộp "Mới tạo" vào "doing"; docIn/docOut (statusDoc)
        // chỉ có Ban hành / Xoá (xem normalizeQlvbSummary).
        const mapCounts = isDocMetric(metricKey)
            ? {
                published: apiData["banHanh"] || 0,
                deleted: apiData["xoa"] || 0,
            }
            : {
                doing: apiData["chuaHtTrongHan"] || 0,
                done: apiData["hoanThanh"] || 0,
                risk: apiData["chuaHtGanHan"] || 0,
                overdue: apiData["chuaHtQuaHan"] || 0,
            };
        // 2. Map qua danh sách trạng thái (đúng bộ statusDefs/statusDoc) và ghi đè value từ API vào count
        return getStatusDefsForMetric(metricKey).map((st) => ({
            key: st.key,
            label: st.label,
            short: st.short,
            color: st.color,
            cls: st.cls,
            count: mapCounts[st.key] || 0,
        }));
    }

    /* METRIC CỦA DRAWER ĐANG MỞ — nguồn DUY NHẤT cho donut/legend.
       LỖI CŨ: donut đọc `activeMetric`, còn bảng danh sách fetch theo `window._type`
       (xem loadDrawerAssignedListByFilters: type = _type==='assigned' ? 'giao' : 'nhan').
       Hai biến này lệch nhau -> mở "Nhiệm vụ giao" (list ra 4 dòng) mà donut vẫn vẽ
       summary của "Nhiệm vụ nhận" (58/60). Ưu tiên metric mà openList đã ghi lại. */
    function qlnvDrawerMetric() {
        var m = window.__drawerListMetric;
        if (m && metricMeta[m]) return m;
        if (window._type === "assigned" || window._type === "received")
            return window._type;
        /* LƯỚI CUỐI — suy từ TIÊU ĐỀ drawer đang mở. Cần vì drawer có thể được mở bởi
           block CMS khác (nó vẽ thẻ pie ở mục 1) mà không đặt 2 biến trên; khi đó rơi về
           `activeMetric` (mặc định "received") và donut vẽ nhầm số của Nhiệm vụ nhận. */
        var t = (document.getElementById("drawerTitle") || {}).textContent || "";
        if (/nhi(ệ|e)m\s*v(ụ|u)\s*giao/i.test(t)) return "assigned";
        if (/nhi(ệ|e)m\s*v(ụ|u)\s*nh(ậ|a)n/i.test(t)) return "received";
        return activeMetric;
    }
    renderDrawerPie = window.renderDrawerPie = function () {
        const svgEl = document.getElementById("drawerPieSvg");
        if (!svgEl) return;
        const activeMetric = qlnvDrawerMetric(); // che biến toàn cục trong phạm vi hàm
        const counts = drawerCounts(activeMetric);
        /* Tổng = CỘNG ĐÚNG 4 TRẠNG THÁI ĐANG HIỂN THỊ, không lấy `tong` của API: `tong`
           gồm cả những trạng thái không vẽ trong donut (moiTao/dangThucHien…) nên số ở giữa
           không khớp với các dòng legend bên cạnh. */
        const total = counts.reduce((sum, c) => sum + (Number(c.count) || 0), 0);
        const segs = counts.map((c) => ({
            key: c.key,
            label: c.short,
            value: c.count,
            color: c.color,
        }));

        const active = drawerPieStatus
            ? counts.find((c) => c.key === drawerPieStatus)?.count || 0
            : total;

        svgEl.innerHTML = overviewSvg(
            segs,
            total,
            fmt(active),
            drawerPieStatus
                ? statusMeta(drawerPieStatus, activeMetric).short
                : metricMeta[activeMetric]?.short || "Tổng",
            "drawerStatus",
        );
        const legendEl = document.getElementById("drawerPieLegend");
        if (legendEl) {
            legendEl.innerHTML = counts
                .map(
                    (c) =>
                        `<button class="${drawerPieStatus === c.key ? "active" : ""}" onclick="openOverviewPieSegment('drawerStatus','${c.key}')"><i class="sw" style="background:${c.color}"></i><span>${c.short}</span><b>${fmt(c.count)}</b></button>`,
                )
                .join("");
        }
    };
    function setDrawerPieStatus(st) {
        drawerPieStatus = st || "";
        window.__drawerPieStatus = drawerPieStatus;
        const sel = document.getElementById("statusFilter");
        if (sel) sel.value = drawerPieStatus;
        renderDrawerPie();
        applyDrawerFiltersGd();
    }
    const oldOpenOverview = window.openOverviewPieSegment;
    const originalOpenOverviewPieSegment = window.openOverviewPieSegment;
    // drawer pie uses this group value
    const summaryOpen = openOverviewPieSegment;

    openOverviewPieSegment = window.openOverviewPieSegment = function (
        group,
        key,
    ) {
        console.log("group", group, key);
        if (group === "drawerStatus") {
            setDrawerPieStatus(key);
            return;
        }
        summaryOpen(group, key);
    };

    // 1. Định nghĩa hàm vẽ lại Legend riêng biệt
    renderDrawerPieLegend = window.renderDrawerPieLegend = function () {
        const el = document.getElementById("drawerPieLegend");

        // AN TOÀN: Nếu không tìm thấy element trên DOM thì dừng ngay, không cố gán innerHTML
        if (!el) {
            console.warn(
                "[renderDrawerPieLegend] Element #drawerPieLegend không tồn tại.",
            );
            return;
        }

        // Legend phải cùng metric với donut/bảng (xem qlnvDrawerMetric), không lấy activeMetric.
        const currentMetric = qlnvDrawerMetric();
        const counts =
            typeof drawerCounts === "function" ? drawerCounts(currentMetric) : [];
        const currentStatus =
            typeof drawerPieStatus !== "undefined"
                ? drawerPieStatus
                : window.drawerPieStatus;
        const formatFunc = typeof fmt === "function" ? fmt : (v) => v;

        el.innerHTML = counts
            .map(
                (c) =>
                    `<button class="${currentStatus === c.key ? "active" : ""}" onclick="window.drawerPieStatus='${c.key}'; if(typeof window.renderDrawerPieLegend==='function') window.renderDrawerPieLegend(); if(typeof window.openOverviewPieSegment==='function') window.openOverviewPieSegment('drawerStatus','${c.key}');"><i class="sw" style="background:${c.color}"></i><span>${c.short}</span><b>${formatFunc(c.count)}</b></button>`,
            )
            .join("");
    };

    // 2. Hàm xử lý riêng khi người dùng BẤM TRỰC TIẾP vào nút Legend
    window.selectPieSegmentFromLegend = function (key) {
        // Nếu bấm lại chính status đang chọn thì bỏ chọn (toggle) hoặc giữ nguyên tùy bạn
        drawerPieStatus = drawerPieStatus === key ? "" : key;

        // Cập nhật lại dropdown statusFilter (nếu có) cho đồng bộ
        const statusSelect = document.getElementById("statusFilter");
        if (statusSelect) statusSelect.value = drawerPieStatus;

        // Chạy lại lọc dữ liệu
        applyDrawerFiltersGd();
        renderDrawerPie();
    };

    // 3. Hàm applyDrawerFiltersGd đã được tối ưu
    applyDrawerFiltersGd = window.applyDrawerFiltersGd = function () {
        const q = document.getElementById("qFilter")?.value || "";
        const role = document.getElementById("roleFilter")?.value || "";
        const status =
            document.getElementById("statusFilter")?.value ||
            (typeof drawerPieStatus !== "undefined" ? drawerPieStatus : "") ||
            "";
        const metric = document.getElementById("metricFilter")?.value || "";

        // Đồng bộ trạng thái status
        if (typeof drawerPieStatus !== "undefined") drawerPieStatus = status;
        window.drawerPieStatus = status;
        window.__drawerPieStatus = status;

        // Lưu state filter vào window
        window.__drawerFilterState = {
            q,
            role,
            status,
            metric,
            fieldGroups: document.getElementById("fieldGroups")?.value || "",
            leadUnits: document.getElementById("leadUnits")?.value || "",
            batDauTuNgay: document.getElementById("batDauTuNgay")?.value || "",
            batDauDenNgay: document.getElementById("batDauDenNgay")?.value || "",
            hanXuLyTuNgay: document.getElementById("hanXuLyTuNgay")?.value || "",
            hanXuLyDenNgay: document.getElementById("hanXuLyDenNgay")?.value || "",
        };

        console.log("q, role, status, metric", q, role, status);

        // Gọi vẽ lại Legend & Pie (Hàm renderDrawerPieLegend đã có null-check bên dưới)
        if (typeof renderDrawerPieLegend === "function") {
            renderDrawerPieLegend();
        }
        if (typeof renderDrawerPie === "function") {
            renderDrawerPie();
        }

        // Debounce gọi API load danh sách
        clearTimeout(window.__drawerFilterTimer);
        window.__drawerFilterTimer = setTimeout(() => {
            if (typeof loadDrawerAssignedListByFilters === "function") {
                loadDrawerAssignedListByFilters(1);
            }
        }, 350);
    };

    function setDrawerPage(p) {
        drawerPage = Math.max(1, Number(p) || 1);
        loadDrawerAssignedListByFilters(drawerPage);
    }
    window.setDrawerPage = setDrawerPage;

    function renderDrawerFilterResults(data) {
        console.log("data", data);
        const rs = (data.items || []).map((item) =>
            mapApiListItemToRecord(item, activeMetric),
        );
        currentDrawerRecords = rs;
        /* Lưu MỌI bản ghi vừa render vào cache theo id: người dùng bấm 1 dòng ngay lúc
           bộ lọc/debounce vừa nạp lại danh sách -> currentDrawerRecords đã bị thay, tra
           theo index/id đều trượt và rơi vào toast "Không tìm thấy hồ sơ này". */
        window.__recordCache = window.__recordCache || {};
        window.__rowStore = window.__rowStore || {};
        /* KHÓA DÒNG riêng cho mỗi lần render: dòng HTML mang theo khóa này nên bấm vào là
           lấy được ĐÚNG bản ghi đã render, không phụ thuộc `currentDrawerRecords` (mảng có
           thể đã bị thay bởi lần nạp lại của bộ lọc) cũng không phụ thuộc việc bản ghi có
           taskId hay không. */
        var renderSeq = (window.__rowStoreSeq = (window.__rowStoreSeq || 0) + 1);
        rs.forEach(function (r, i) {
            r.__rowKey = "row_" + renderSeq + "_" + i;
            window.__rowStore[r.__rowKey] = r;
            var key = String(r && r.id != null ? r.id : "").trim();
            if (key) window.__recordCache[key] = r;
        });
        // Chỉ giữ vài lần render gần nhất, tránh phình bộ nhớ khi lọc/phân trang nhiều.
        Object.keys(window.__rowStore).forEach(function (k) {
            var seq = Number(String(k).split("_")[1]);
            if (renderSeq - seq > 5) delete window.__rowStore[k];
        });
        const totalBase = data?.total || 0;
        // Cỡ trang phải là cỡ trang ĐÃ GỬI lên API; nếu API không trả `limit` thì
        // giá trị suy ra từ số phần tử ở trang cuối sẽ làm tổng số trang sai.
        const limit =
            Number(data?.limit) ||
            Number(window.__drawerPageSize) ||
            DRAWER_LIST_DEFAULT_LIMIT;
        // Tổng số trang luôn suy từ tổng bản ghi / cỡ trang cố định. Trước đây dùng
        // rs.length làm limit nên ở trang cuối (số bản ghi lẻ) tổng trang bị tính sai.
        const totalPages = Math.max(1, Math.ceil(totalBase / limit));
        drawerPage = Math.min(Math.max(1, Number(data?.page) || drawerPage || 1), totalPages);
        // Lỡ vượt quá trang cuối (dữ liệu đổi giữa chừng): kéo về trang cuối hợp lệ
        // thay vì render danh sách rỗng -> màn hình trắng.
        if (!rs.length && totalBase > 0 && drawerPage > 1) {
            setDrawerPage(totalPages);
            return;
        }
        const start = (drawerPage - 1) * limit;
        const recordList = document.getElementById("recordList");
        console.log("rs", rs);
        recordList.innerHTML =
            totalBase > 0
                ? `<div class="vptu-table-wrap">
      <table class="vptu-table">
      ${isDocMetric(activeMetric) ? qlvbDocTableHead() : `<thead>
        <tr>
          <th>STT</th>
          <th>Số ký hiệu</th>
          <th>Tiêu đề nhiệm vụ</th><th class="col-unit">Đơn vị</th>
          <th>Người thực hiện</th>
           <th>Người giao</th>
          <th class="col-field">Nhóm lĩnh vực</th><th>Ngày bắt đầu</th>
          <th>Hạn xử lý</th><th>Trạng thái xử lý</th>
        </tr>
      </thead>`}
    <tbody>${rs.map((r, i) => recordRowHtml(r, start + i + 1)).join("")}</tbody></table></div>`
                : '<div class="access-lock">Không có bản ghi phù hợp bộ lọc.</div>';
        const pagBox = document.getElementById("drawerPagination");
        if (!pagBox) return;
        if (!rs.length) {
            pagBox.innerHTML = "";
            return;
        }
        pagBox.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;flex-wrap:wrap">
        <span style="font-size:11.5px;color:var(--muted)">Hiển thị ${fmt(start + 1)}–${fmt(start + rs.length)} / ${fmt(totalBase)} bản ghi</span>
        <div style="display:flex;gap:6px;align-items:center">
        <button class="ghost" ${drawerPage <= 1 ? "disabled" : ""} onclick="setDrawerPage(${drawerPage - 1})">‹ Trước</button>
        <span style="font-size:12px">Trang ${drawerPage}/${totalPages}</span>
        <button class="ghost" ${drawerPage >= totalPages ? "disabled" : ""} onclick="setDrawerPage(${drawerPage + 1})">Sau ›</button>
        </div>
    </div>`;
    }

    const fetchApiListWithMetric = async (
        metric,
        token,
        limit = 10,
        skip = 0,
        params = {},
    ) => {
        switch (metric) {
            case "assigned":
                return await fetchApiListAssigned(token, limit, skip, params);
            case "received":
                return await fetchApiListReceived(token, limit, skip, params);
            case "docIn":
                return await fetchApiListDocIn(token, limit, skip, params);
            case "docOut":
                return await fetchApiListDocOut(token, limit, skip, params);
            case "resultProcess":
                return await fetchApiListResultProcess(token, limit, skip, params);
        }
    };

    // async function loadDrawerAssignedListByFilters(resetPage = false) {
    //   const reqId = (window.__drawerFilterReqId =
    //     (window.__drawerFilterReqId || 0) + 1);
    //   const role = document.getElementById("roleFilter")?.value || "";
    //   console.log('resetPage', resetPage)
    //   // Đổi filter -> luôn ép về trang 1 (skip=0), limit giữ nguyên mặc định.
    //   if (resetPage) drawerPage = resetPage;
    //   // const page = drawerPage > 1 ? drawerPage : 1;
    //   const limit = DRAWER_LIST_DEFAULT_LIMIT;
    //   const skip = (page - 1) * limit;
    //   console.log('skip', skip)
    //   // API phân trang theo "page" (xem API_Feature_Dashboard_NhiemVu.md), không phải "skip".
    //   const params = { ...buildDrawerListFilterParams(), page };
    //   console.log('params', params)
    //   const recordList = document.getElementById("recordList");
    //   if (recordList) {
    //     recordList.innerHTML =
    //       '<div class="access-lock">Đang tải danh sách nhiệm vụ giao...</div>';
    //   }

    //   try {
    //     const authData = await getTokenAuth();
    //     const token =
    //       authData?.token?.jwt_access_token ||
    //       authData?.jwt_access_token ||
    //       authData;
    //     const res = await fetchApiListWithMetric(
    //       activeMetric,
    //       token,
    //       limit,
    //       skip,
    //       params,
    //     );
    //     if (reqId !== window.__drawerFilterReqId) return;

    //     console.log('res', res)
    //     const normalized = normalizeData(res);
    //     window.metricsApiData.listAssigned = normalized;
    //     console.log('normalized', normalized)
    //     renderDrawerFilterResults(normalized);
    //   } catch (err) {
    //     if (reqId !== window.__drawerFilterReqId) return;
    //     console.error("[Drawer Filter] Lỗi fetchApiListAssigned:", err);
    //     if (recordList) {
    //       recordList.innerHTML =
    //         '<div class="access-lock">Không tải được danh sách từ API. Thử lại bộ lọc.</div>';
    //     }
    //   }
    // }

    async function loadDrawerAssignedListByFilters(resetPage = false) {
        const reqId = (window.__drawerFilterReqId =
            (window.__drawerFilterReqId || 0) + 1);
        const role = document.getElementById("roleFilter")?.value || "";
        console.log("resetPage", resetPage);
        // Đổi filter -> luôn ép về trang 1 (skip=0), limit giữ nguyên mặc định.
        if (resetPage) drawerPage = resetPage;
        const page = drawerPage > 1 ? drawerPage : 1;
        const limit = DRAWER_LIST_DEFAULT_LIMIT;
        window.__drawerPageSize = limit;
        const skip = (page - 1) * limit;
        console.log("skip", skip);
        // API phân trang theo "page" (xem API_Feature_Dashboard_NhiemVu.md), không phải "skip".
        // Bỏ pageId — phạm vi suy từ token (xem METRIC_API_CONFIG).
        const params = {
            ...buildDrawerListFilterParams(),
            page,
            // fetchFromApi KHÔNG đưa đối số `limit` vào query -> phải gửi qua params,
            // nếu không BE dùng cỡ trang mặc định 20 còn FE lại tính theo 10.
            limit,
            type: window._type === "assigned" ? "giao" : "nhan",
            year: 2026,
        };
        console.log("params", params);
        const recordList = document.getElementById("recordList");
        if (recordList) {
            recordList.innerHTML =
                `<div class="access-lock">Đang tải danh sách ${isDocMetric(activeMetric) ? "văn bản" : "nhiệm vụ"}...</div>`;
        }

        try {
            const authData = await getTokenAuth();
            const token =
                qlnvPickToken(authData);

            const res = await fetchApiListWithMetric(
                activeMetric,
                token,
                limit,
                skip,
                params,
            );
            if (reqId !== window.__drawerFilterReqId) return;

            console.log("res", res);
            const normalized = normalizeData(res);
            window.metricsApiData.listAssigned = normalized;
            console.log("normalized", normalized);
            renderDrawerFilterResults(normalized);
        } catch (err) {
            if (reqId !== window.__drawerFilterReqId) return;
            console.error("[Drawer Filter] Lỗi fetchApiListAssigned:", err);
            if (recordList) {
                recordList.innerHTML =
                    '<div class="access-lock">Không tải được danh sách từ API. Thử lại bộ lọc.</div>';
            }
        }
    }

    // async function loadDrawerAssignedListByFilters({ resetPage = false } = {}) {
    //     const reqId = (window.__drawerFilterReqId =
    //         (window.__drawerFilterReqId || 0) + 1);

    //     // Đổi filter -> luôn ép về trang 1
    //     if (resetPage) drawerPage = resetPage;
    //     const page = drawerPage && drawerPage > 0 ? drawerPage : 1;
    //     const limit = DRAWER_LIST_DEFAULT_LIMIT;

    //     // Gộp page và limit vào params
    //     const params = {
    //         ...buildDrawerListFilterParams(),
    //         page,
    //         limit
    //     };

    //     const recordList = document.getElementById("recordList");
    //     if (recordList) {
    //         recordList.innerHTML =
    //             '<div class="access-lock">Đang tải danh sách nhiệm vụ giao...</div>';
    //     }

    //     try {
    //         const authData = await getTokenAuth();
    //         const token =
    //             authData?.token?.jwt_access_token ||
    //             authData?.jwt_access_token ||
    //             authData;

    //         // Tùy theo định nghĩa của hàm fetchApiListWithMetric:
    //         // Nếu hàm nhận (metric, token, params) -> truyền params chứa `page`
    //         // Nếu hàm nhận (metric, token, limit, page, params) -> truyền `page` vào vị trí tham số thứ 4 thay cho `skip`
    //         const res = await fetchApiListWithMetric(
    //             activeMetric,
    //             token,
    //             limit,
    //             page, // <-- Đổi skip thành page ở đây
    //             params
    //         );

    //         if (reqId !== window.__drawerFilterReqId) return;

    //         const normalized = normalizeData(res);
    //         window.metricsApiData.listAssigned = normalized;
    //         renderDrawerFilterResults(normalized);
    //     } catch (err) {
    //         if (reqId !== window.__drawerFilterReqId) return;
    //         console.error("[Drawer Filter] Lỗi fetchApiListAssigned:", err);
    //         if (recordList) {
    //             recordList.innerHTML =
    //                 '<div class="access-lock">Không tải được danh sách từ API. Thử lại bộ lọc.</div>';
    //         }
    //     }
    // }
    window.loadDrawerAssignedListByFilters = loadDrawerAssignedListByFilters;

    function isScheduleIndicator(name) {
        return /lịch|kỳ họp|chương trình kỳ họp/i.test(name || "");
    }
    openIndicator = window.openIndicator = function (role, idx) {
        if (!canSeeRole(role)) {
            toast("Không có quyền xem chỉ tiêu này.");
            return;
        }
        const item = indicators[role][idx];
        if (item && isScheduleIndicator(item[0])) {
            openCalendar(role, item[0]);
            return;
        }
        oldOpenIndicator(role, idx);
    };

    const oldRenderIndicators = renderIndicators;
    renderIndicators = window.renderIndicators = function () {
        oldRenderIndicators();
        document.querySelectorAll(".indicator-card").forEach((btn) => {
            const h = btn.querySelector("h4")?.textContent || "";
            if (isScheduleIndicator(h)) {
                const small = btn.querySelector("small.muted");
                if (small)
                    small.textContent =
                        "Click mở calendar ngày/tuần/tháng, xem chi tiết lịch họp và báo cáo thư ký.";
            }
        });
    };

    function iso(d) {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    function parseISO(s) {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m - 1, d);
    }
    function addDays(base, n) {
        const d = new Date(base);
        d.setDate(d.getDate() + n);
        return d;
    }
    function ensureCalendarEvents() {
        if (window.__calendarEvents) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const templates = {
            DANG: [
                "Giao ban Thường trực Đảng ủy",
                "Họp Ban Thường vụ Đảng ủy",
                "Làm việc về Nghị quyết 57",
                "Kiểm điểm tiến độ công tác Đảng viên",
                "Họp giao ban tuyên giáo - dân vận",
                "Họp rà soát văn bản chỉ đạo",
            ],
            HDND: [
                "Họp Thường trực HĐND",
                "Phiên giải trình chuyên đề",
                "Giám sát kiến nghị cử tri",
                "Chuẩn bị nội dung kỳ họp HĐND",
                "Rà soát dự thảo nghị quyết",
                "Họp tổ đại biểu HĐND",
            ],
            UBND: [
                "Giao ban lãnh đạo UBND",
                "Họp xử lý TTHC sắp hạn",
                "Họp thu ngân sách - an sinh",
                "Họp đô thị, môi trường, PCCC",
                "Họp GPMB dự án trọng điểm",
                "Họp chuyển đổi số dữ liệu IOC",
            ],
            MTTQ: [
                "Họp Ban Thường trực MTTQ",
                "Họp phản biện xã hội",
                "Họp quỹ ủng hộ và an sinh",
                "Họp Đoàn Thanh niên - Hội Phụ nữ",
                "Họp giám sát cộng đồng",
                "Họp tổng hợp dư luận xã hội",
            ],
        };
        const counts = { DANG: 18, HDND: 17, UBND: 15, MTTQ: 9 };
        let id = 1;
        const events = [];
        Object.keys(counts).forEach((role) => {
            for (let i = 0; i < counts[role]; i++) {
                const offsets = [
                    -8, -3, -1, 0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22, 27, 31, 38, 45,
                ];
                const d = addDays(
                    today,
                    offsets[i % offsets.length] +
                    (role === "UBND" ? 1 : role === "MTTQ" ? 2 : 0),
                );
                const late = d < today && i % 3 !== 0;
                const done = d < today && !late;
                events.push({
                    id: `MEET-${role}-${String(id++).padStart(3, "0")}`,
                    role,
                    date: iso(d),
                    time: ["07:45", "08:00", "08:30", "09:00", "14:00", "15:30"][i % 6],
                    end: ["09:00", "09:30", "10:30", "11:00", "15:30", "16:30"][i % 6],
                    title: `${templates[role][i % templates[role].length]} ${i + 1}`,
                    venue: [
                        "Phòng họp Đảng ủy",
                        "Hội trường UBND phường",
                        "Phòng họp HĐND",
                        "Phòng giao ban IOC",
                        "Nhà văn hóa trung tâm",
                    ][i % 5],
                    chair:
                        role === "DANG"
                            ? "Bí thư Đảng ủy"
                            : role === "HDND"
                                ? "Chủ tịch HĐND"
                                : role === "UBND"
                                    ? "Chủ tịch UBND"
                                    : "Chủ tịch MTTQ",
                    secretary: [
                        "Văn phòng Đảng ủy",
                        "Văn phòng HĐND",
                        "Văn phòng UBND",
                        "Cán bộ MTTQ",
                    ][i % 4],
                    participants: [
                        axisMeta[role].name,
                        "Văn phòng phường",
                        "Công chức chuyên môn",
                        i % 2 ? "Đơn vị phối hợp" : "Tổ chuyển đổi số",
                        i % 3 ? "Đại diện thôn/tổ dân phố" : "Công an phường",
                    ],
                    agenda: `Chuẩn bị nội dung, rà soát số liệu IOC, kết luận giao nhiệm vụ và cập nhật tiến độ sau họp cho ${axisMeta[role].name}.`,
                    docs: [
                        `Tài liệu_họp_${role}_${i + 1}.pdf`,
                        `Dự_thảo_kết_luận_${i + 1}.docx`,
                    ],
                    rawStatus: done ? "done" : late ? "late" : "planned",
                    prepared: i % 4 !== 1,
                    confirmed: i % 5 !== 2,
                });
            }
        });
        window.__calendarEvents = events;
    }
    function eventState(e) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = parseISO(e.date);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / 86400000);
        if (e.rawStatus === "late")
            return {
                key: "late",
                label: "Trễ xác nhận/chuẩn bị",
                icon: "⚠️",
                cls: "late",
            };
        if (e.rawStatus === "done")
            return { key: "done", label: "Đã hoàn thành", icon: "✅", cls: "done" };
        if (diff === 0)
            return { key: "today", label: "Hôm nay", icon: "🔔", cls: "today" };
        if (diff > 0 && diff <= 7)
            return {
                key: "upcoming",
                label: "Sắp diễn ra",
                icon: "⏰",
                cls: "upcoming",
            };
        return { key: "planned", label: "Đã lên lịch", icon: "📅", cls: "planned" };
    }
    function getCalendarEventsForScope(roleFilter) {
        ensureCalendarEvents();
        return (window.__calendarEvents || []).filter(
            (e) =>
                allowedRoles().includes(e.role) &&
                (!roleFilter || e.role === roleFilter),
        );
    }
    function calendarStatusCounts() {
        const ev = getCalendarEventsForScope();
        const out = { today: 0, upcoming: 0, late: 0, planned: 0, done: 0 };
        ev.forEach((e) => out[eventState(e).key]++);
        return out;
    }
    function formatEventDate(e) {
        const d = parseISO(e.date);
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
    }
    function eventFullDate(e) {
        const d = parseISO(e.date);
        return d.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    openCalendar = window.openCalendar = function (
        role = null,
        title = "Lịch công tác/kỳ họp",
        stateFilter = "",
    ) {
        ensureCalendarEvents();
        const validRole = role && allowedRoles().includes(role) ? role : "";
        window.__calState = {
            mode: "month",
            date: iso(new Date()),
            role: validRole,
            state: stateFilter || "",
        };
        document.getElementById("drawerTitle").textContent =
            "Sở giáo dục và đào tạo";
        document.getElementById("drawerBody").innerHTML =
            `<div class="calendar-shell"><div class="calendar-toolbar"><div class="mode-tabs"><button id="calModeDay" onclick="setCalMode('day')">Ngày</button><button id="calModeWeek" onclick="setCalMode('week')">Tuần</button><button id="calModeMonth" onclick="setCalMode('month')">Tháng</button></div><button class="ghost" onclick="moveCalendar(-1)">←</button><button class="ghost" onclick="moveCalendar(1)">→</button><input id="calDate" type="date" onchange="window.__calState.date=this.value;renderCalendar()"/><select id="calRole" onchange="window.__calState.role=this.value;renderCalendar()"><option value="">Tất cả trục được xem</option>${allowedRoles()
                .map(
                    (r) =>
                        `<option value="${r}" ${validRole === r ? "selected" : ""}>${axisMeta[r].name}</option>`,
                )
                .join(
                    "",
                )}</select><select id="calStateFilter" onchange="window.__calState.state=this.value;renderCalendar()"><option value="">Tất cả trạng thái</option><option value="today">Hôm nay</option><option value="upcoming">Sắp diễn ra</option><option value="late">Trễ xác nhận</option><option value="planned">Đã lên lịch</option><option value="done">Đã hoàn thành</option></select><button class="primary" onclick="qlnvxOpenAssignmentForm()">＋ Giao nhiệm vụ chuẩn bị họp</button></div><div class="calendar-report" id="calendarReport"></div><div class="calendar-board" id="calendarBoard"></div></div>`;
        document.getElementById("calDate").value = window.__calState.date;
        document.getElementById("calStateFilter").value = window.__calState.state;
        openDrawer();
        renderCalendar();
    };
    setCalMode = window.setCalMode = function (mode) {
        window.__calState.mode = mode;
        renderCalendar();
    };
    moveCalendar = window.moveCalendar = function (delta) {
        const st = window.__calState;
        let d = parseISO(st.date);
        if (st.mode === "day") d = addDays(d, delta);
        else if (st.mode === "week") d = addDays(d, delta * 7);
        else d = new Date(d.getFullYear(), d.getMonth() + delta, 1);
        st.date = iso(d);
        document.getElementById("calDate").value = st.date;
        renderCalendar();
    };
    function filterCalendarEvents() {
        const st = window.__calState || {};
        return getCalendarEventsForScope(st.role)
            .filter((e) => !st.state || eventState(e).key === st.state)
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    }
    renderCalendar = window.renderCalendar = function () {
        const st = window.__calState;
        if (!st) return;
        document
            .querySelectorAll("#calModeDay,#calModeWeek,#calModeMonth")
            .forEach((b) => b.classList.remove("active"));
        document
            .getElementById("calMode" + st.mode[0].toUpperCase() + st.mode.slice(1))
            ?.classList.add("active");
        const all = getCalendarEventsForScope(st.role);
        const counts = { today: 0, upcoming: 0, late: 0, planned: 0, done: 0 };
        all.forEach((e) => counts[eventState(e).key]++);
        document.getElementById("calendarReport").innerHTML =
            `<button class="report-card" onclick="window.__calState.state='upcoming';document.getElementById('calStateFilter').value='upcoming';renderCalendar()"><span>Sắp đến lịch họp</span><b class="warn">${fmt(counts.upcoming + counts.today)}</b><small>Hôm nay và 7 ngày tới</small></button><button class="report-card" onclick="window.__calState.state='late';document.getElementById('calStateFilter').value='late';renderCalendar()"><span>Lịch trễ xác nhận</span><b class="danger">${fmt(counts.late)}</b><small>Cần thư ký nhắc việc</small></button><button class="report-card" onclick="window.__calState.state='planned';document.getElementById('calStateFilter').value='planned';renderCalendar()"><span>Đã lên lịch</span><b class="blue">${fmt(counts.planned)}</b><small>Chưa đến hạn</small></button><button class="report-card" onclick="window.__calState.state='done';document.getElementById('calStateFilter').value='done';renderCalendar()"><span>Đã hoàn thành</span><b class="ok">${fmt(counts.done)}</b><small>Có thể lập kết luận/giao việc</small></button>`;
        const board = document.getElementById("calendarBoard");
        if (st.mode === "month") board.innerHTML = renderMonthCalendar();
        if (st.mode === "week") board.innerHTML = renderWeekCalendar();
        if (st.mode === "day") board.innerHTML = renderDayCalendar();
    };
    function renderMonthCalendar() {
        const st = window.__calState;
        const cursor = parseISO(st.date);
        const y = cursor.getFullYear(),
            m = cursor.getMonth();
        const first = new Date(y, m, 1);
        const startOffset = (first.getDay() + 6) % 7;
        const start = addDays(first, -startOffset);
        const events = filterCalendarEvents();
        const headers = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
            .map((h) => `<div class="calendar-head-cell">${h}</div>`)
            .join("");
        let cells = "";
        for (let i = 0; i < 42; i++) {
            const d = addDays(start, i);
            const dayIso = iso(d);
            const inMonth = d.getMonth() === m;
            const today = dayIso === iso(new Date());
            const evs = events.filter((e) => e.date === dayIso);
            cells += `<div class="day-cell ${inMonth ? "" : "out"} ${today ? "today" : ""}"><div class="day-num">${d.getDate()}</div><div class="event-stack">${evs.slice(0, 4).map(eventChip).join("")}${evs.length > 4 ? `<button class="event-chip" onclick="window.__calState.mode='day';window.__calState.date='${dayIso}';document.getElementById('calDate').value='${dayIso}';renderCalendar()">+${evs.length - 4} lịch khác</button>` : ""}</div></div>`;
        }
        return `<div class="month-grid">${headers}${cells}</div>`;
    }
    function weekStart(d) {
        const x = new Date(d);
        const day = (x.getDay() + 6) % 7;
        x.setDate(x.getDate() - day);
        return x;
    }
    function renderWeekCalendar() {
        const st = window.__calState;
        const start = weekStart(parseISO(st.date));
        const events = filterCalendarEvents();
        let html = '<div class="week-grid">';
        for (let i = 0; i < 7; i++) {
            const d = addDays(start, i),
                dayIso = iso(d),
                evs = events.filter((e) => e.date === dayIso);
            html += `<div class="week-col"><h4>${d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}</h4>${evs.map(eventChip).join("") || '<div class="muted">Không có lịch</div>'}</div>`;
        }
        return html + "</div>";
    }
    function renderDayCalendar() {
        const st = window.__calState;
        const events = filterCalendarEvents().filter((e) => e.date === st.date);
        const d = parseISO(st.date);
        return `<div class="day-agenda"><div class="calendar-head-cell">${d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</div>${events.map((e) => `<button class="agenda-row" onclick="openMeetingDetail('${e.id}')"><div class="agenda-time">${e.time}<br/>${e.end}</div><div><h4>${eventState(e).icon} ${e.title}</h4><p>${axisMeta[e.role].name} · ${e.venue} · Chủ trì: ${e.chair}</p></div><span class="badge ${eventState(e).key === "late" ? "red" : eventState(e).key === "today" ? "ok" : "gold"}">${eventState(e).label}</span></button>`).join("") || '<div class="calendar-empty">Không có lịch họp trong ngày này.</div>'}</div>`;
    }
    function eventChip(e) {
        const st = eventState(e);
        return `<button class="event-chip ${st.cls}" onclick="openMeetingDetail('${e.id}')"><b>${st.icon} ${e.time} · ${e.title}</b><small>${axisMeta[e.role].name} · ${e.venue}</small></button>`;
    }
    openMeetingDetail = window.openMeetingDetail = function (id) {
        ensureCalendarEvents();
        const e = (window.__calendarEvents || []).find((x) => x.id === id);
        if (!e) return;
        const st = eventState(e);
        document.getElementById("modalTitle").textContent =
            `Chi tiết lịch họp · ${e.id}`;
        document.getElementById("modalSub").textContent =
            `${axisMeta[e.role].name} · ${eventFullDate(e)} · ${e.time}-${e.end}`;
        document.getElementById("modalBody").innerHTML =
            `<div class="meeting-detail-grid"><div class="detail-card"><h4>${st.icon} ${e.title}</h4><div class="kv"><b>Trạng thái</b><span style="color:${st.key === "late" ? "#ff626b" : st.key === "today" ? "#39d5ff" : "#ffd65a"}">${st.label}</span><b>Ngày giờ</b><span>${eventFullDate(e)} · ${e.time}-${e.end}</span><b>Địa điểm</b><span>${e.venue}</span><b>Chủ trì</b><span>${e.chair}</span><b>Thư ký</b><span>${e.secretary}</span><b>Tài liệu</b><span>${e.docs.join(", ")}</span></div>${st.key === "late" ? '<div class="access-lock" style="margin-top:10px;border-color:rgba(255,98,107,.45)">Vai trò thư ký: lịch này đã trễ xác nhận/chuẩn bị tài liệu. Cần nhắc đơn vị và giao nhiệm vụ hoàn thiện ngay.</div>' : ""}</div><div class="detail-card"><h4>Thành phần tham gia</h4><div class="participants">${e.participants.map((p) => `<span class="participant">${p}</span>`).join("")}</div><h4>Nội dung họp</h4><p class="wrap">${e.agenda}</p><div class="action-bar"><button class="primary" onclick="qlnvxOpenAssignmentForm()">Giao nhiệm vụ chuẩn bị/kết luận</button><button class="ghost" onclick="toast('Đã gửi nhắc lịch tới thành phần tham dự ${e.id}')">Gửi nhắc lịch</button><button class="ghost" onclick="toast('Đã xác nhận tham dự và cập nhật calendar ${e.id}')">Xác nhận tham dự</button><button class="ghost danger-btn" onclick="toast('Đã tạo báo cáo lịch trễ cho ${e.id}')">Báo cáo lịch trễ</button></div></div></div><div class="detail-card"><h4>Báo cáo thư ký</h4><div class="audit"><div class="audit-item"><b>Chuẩn bị tài liệu</b><span>${e.prepared ? "Đã đủ tài liệu họp" : "Thiếu tài liệu, cần nhắc đơn vị gửi trước giờ họp"}</span></div><div class="audit-item"><b>Xác nhận tham dự</b><span>${e.confirmed ? "Đã xác nhận thành phần chính" : "Chưa đủ xác nhận, cần gọi/nhắc tự động"}</span></div><div class="audit-item"><b>Việc sau họp</b><span>Tạo dự thảo kết luận, giao nhiệm vụ theo kết luận và theo dõi SLA trên IOC/CAD.</span></div></div></div>`;
        openModal();
    };
})();

/* Cache bản ghi đã mở: sau khi tạo nhiệm vụ nhánh, code gọi lại
   qlnvxOpenRecordDetail(<id cha>) NHƯNG danh sách vừa được nạp lại theo bộ lọc nên bản ghi
   cha có thể không còn trong `currentDrawerRecords` -> trước đây rơi thẳng vào toast
   "Không tìm thấy hồ sơ này". Giữ lại bản ghi để mở lại được. */
window.__recordCache = window.__recordCache || {};

/* So id kiểu LỎNG: id đi qua chuỗi HTML onclick nên luôn là string, trong khi bản ghi
   có thể giữ số (taskId Bkav) -> `x.id === id` trượt. Cắt khoảng trắng + so String. */
function qlnvSameId(a, b) {
    return (
        String(a == null ? "" : a).trim() === String(b == null ? "" : b).trim()
    );
}
/* Tra bản ghi theo mọi nguồn đang có; hết cách thì dựng lại từ item API gần nhất. */
function qlnvFindRecord(id) {
    const key = String(id == null ? "" : id).trim();
    if (!key) return null;
    return (
        (currentDrawerRecords || []).find((x) => qlnvSameId(x.id, key)) ||
        (records || []).find((x) => qlnvSameId(x.id, key)) ||
        window.__recordCache[key] ||
        (function () {
            // Danh sách API gần nhất (chưa map) — dùng khi currentDrawerRecords vừa bị thay.
            const raw =
                (window.metricsApiData &&
                    (window.metricsApiData.listAssigned?.items ||
                        window.metricsApiData.listAssigned?.data ||
                        [])) ||
                [];
            const hit = raw.find((it) => qlnvSameId(it?.taskId ?? it?._id, key));
            return hit ? mapApiListItemToRecord(hit, activeMetric) : null;
        })() ||
        null
    );
}

async function qlnvxOpenRecordDetail(id, fromId, fromFieldId) {
    console.log("id", id);
    const r = qlnvFindRecord(id);
    console.log("currentDrawerRecords", r);

    if (!r) {
        /* Log đủ để biết vì sao trượt: id bấm vào là gì và danh sách đang có id nào. */
        console.warn("[QLNV] qlnvxOpenRecordDetail không tra được bản ghi", {
            idBam: id,
            kieuId: typeof id,
            idDangCo: (currentDrawerRecords || []).map((x) => x.id),
        });
        toast(
            "Không tìm thấy hồ sơ này" +
            (String(id || "").trim()
                ? " (danh sách/bộ lọc có thể đã thay đổi)."
                : " — nhiệm vụ chưa có mã (taskId) nên không mở được chi tiết."),
        );
        return;
    }
    window.__recordCache[String(id)] = r;

    window.__scenarioReturnDocId = null;
    window.__scenarioReturnFieldId = null;
    window.__recordBackId = fromId || null;
    window.__recordBackFieldId = fromFieldId || null;

    const limited = isLimitedRole(r.role);
    document.getElementById("modalTitle").textContent =
        `Cấp 2 · ${r.mirrorOfId ? vptuDisplayId(r.id) : r.id}`;
    document.getElementById("modalSub").textContent =
        `${metricMeta[r.metric]?.label || ""} · ${axisMeta[r.role]?.name || ""} · ${statusMeta(r.status, r.metric).label}`;

    /* MỞ MODAL NGAY với dữ liệu đã có sẵn từ danh sách, rồi mới nạp nhiệm vụ nhánh ở
       nền (giống bản chuẩn filev2). Trước đây `await fetchAllChildStatus(id)` nằm TRƯỚC
       openModal() nên bấm xong phải đợi 3 API con-* (+ refresh token) mới thấy gì. */
    if (!r.subtasks || !r.subtasks.combinedData)
        r.subtasks = makeSubtaskResult([], null);
    qlnvxRenderRecordDetail(r, limited);
    openModal();

    // Mở nhanh nhiều bản ghi -> chỉ nhận kết quả của lần mở gần nhất.
    const reqId = (window.__recordDetailReqId =
        (window.__recordDetailReqId || 0) + 1);
    /* Văn bản QLVB: nạp chi tiết thay cho nhiệm vụ nhánh (documentId không phải taskId,
       gọi sub-task với nó sẽ ra dữ liệu của nhiệm vụ khác). */
    if (isDocMetric(r.metric) && r.documentId != null) {
        const docBody = document.getElementById("modalBody");
        if (docBody) {
            docBody.insertAdjacentHTML(
                "afterbegin",
                '<div class="record-update-note qlvb-loading-note">⏳ Đang tải chi tiết văn bản…</div>',
            );
        }
        try {
            const kind = r.metric === "docIn" ? "den" : "di";
            const res = await qlvbGet(
                `/api/v1/qlvb/van-ban/${kind}/${encodeURIComponent(r.documentId)}`,
            );
            if (reqId !== window.__recordDetailReqId) return;
            Object.assign(r, mapQlvbItemToRecord((res && res.data) || {}, r.metric), {
                __rowKey: r.__rowKey,
                subtasks: r.subtasks,
            });
            window.__recordCache[String(r.id)] = r;
            qlnvxRenderRecordDetail(r, isLimitedRole(r.role));
        } catch (err) {
            if (reqId !== window.__recordDetailReqId) return;
            console.error("[QLVB] Không tải được chi tiết văn bản:", err);
            const note = document.querySelector(".qlvb-loading-note");
            if (note) {
                note.textContent = "⚠ Không tải được chi tiết văn bản từ QLVB: " + (err.message || err);
                note.style.color = "#e6934a";
            }
        }
        return;
    }
    const body = document.getElementById("modalBody");
    if (body && !body.querySelector(".subtask-loading-note")) {
        body.insertAdjacentHTML(
            "afterbegin",
            '<div class="record-update-note subtask-loading-note">⏳ Đang tải nhiệm vụ nhánh…</div>',
        );
    }
    try {
        /* Dùng taskId THẬT của bản ghi, không dùng `id` truyền vào: khi mở theo khóa dòng
           (bản ghi chưa có taskId) thì `id` là khóa nội bộ, gọi sub-task với nó sẽ sai. */
        const subtaskData = await fetchAllChildStatus(r.id);
        if (reqId !== window.__recordDetailReqId) return; // đã mở bản ghi khác
        r.subtasks = subtaskData;
        qlnvxRenderRecordDetail(r, limited);
    } catch (err) {
        if (reqId !== window.__recordDetailReqId) return;
        console.error("[QLNV] Không tải được nhiệm vụ nhánh:", err);
        const note = document.querySelector(".subtask-loading-note");
        if (note) {
            note.textContent = "⚠ Không tải được nhiệm vụ nhánh từ API.";
            note.style.color = "#e6934a";
        }
    }
}

function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/* Mở chi tiết theo VỊ TRÍ DÒNG trong `currentDrawerRecords` — không phụ thuộc việc so
   `id` (id có thể rỗng/lệch kiểu số-chuỗi/đã bị đổi khi danh sách nạp lại). Lấy trực
   tiếp bản ghi vừa render nên click luôn ăn; chỉ khi mất bản ghi mới lùi về tra theo id. */
window.qlnvxOpenRecordDetailAt = function (idx, id, rowKey) {
    window.__recordCache = window.__recordCache || {};
    window.__rowStore = window.__rowStore || {};
    /* (1) KHÓA DÒNG — nguồn tin cậy nhất: chính bản ghi đã dựng ra dòng này. Không phụ
       thuộc mảng hiện tại nên bấm lúc bộ lọc vừa nạp lại vẫn mở đúng hồ sơ. */
    var stored = rowKey ? window.__rowStore[rowKey] : null;
    if (stored) {
        var sid = String(stored.id == null ? "" : stored.id).trim();
        if (sid) {
            window.__recordCache[sid] = stored;
            return qlnvxOpenRecordDetail(sid);
        }
        /* Bản ghi KHÔNG có taskId: vẫn mở được phần thông tin đã có, chỉ nhiệm vụ nhánh là
           không tải được (qlnvxOpenRecordDetail tự bỏ qua khi id rỗng). */
        window.__recordCache[rowKey] = stored;
        return qlnvxOpenRecordDetail(rowKey);
    }
    /* (2) Theo id đã cache lúc render. */
    var byId = String(id == null ? "" : id).trim();
    if (byId && window.__recordCache[byId]) return qlnvxOpenRecordDetail(byId);
    /* (3) Cuối cùng mới theo vị trí dòng trong mảng hiện tại. */
    var r = (currentDrawerRecords || [])[Number(idx)];
    if (r) {
        window.__recordCache[String(r.id || id || idx)] = r;
        return qlnvxOpenRecordDetail(r.id || id || String(idx));
    }
    return qlnvxOpenRecordDetail(id);
};

function recordRowHtml(r, stt) {
    if (isDocMetric(r.metric) && r.documentId != null) return qlvbDocRowHtml(r, stt);
    console.log("rrrrrr", r, stt);
    const st = statusMeta(r.status, r.metric); // _raw.statusType
    const limited = isLimitedRole(r.role);
    // stt = số thứ tự bắt đầu từ 1 của TRANG hiện tại -> chỉ số trong mảng = stt-1.
    const rowIdx = (currentDrawerRecords || []).indexOf(r);
    return `<tr onclick="qlnvxOpenRecordDetailAt(${rowIdx >= 0 ? rowIdx : Number(stt) - 1},'${esc(r.id)}','${esc(r.__rowKey || "")}')">
            <td class="mono">${stt}</td>
            <td class="mono">${esc(r.numberDoc)}</td>
            <td><div class="title">${limited ? "[Tổng hợp] " : ""}${esc(r.title)}</div><small>${r.unit}</small></td>
            <td class="col-unit" title="${esc(r.unit || "")}"><div class="truncate-cell">${esc(r.unit || "")}</div></td>
            <td>${esc(r.nguoiThucHien || "")}</td>
            <td>${esc(r.nguoiGiao || "")}</td>
            <td class="col-field" title="${esc(r.field || "")}"><div class="truncate-cell">${esc(r.field || "")}</div></td>
            <td class="mono">${r.created || ""}</td>
            <td class="mono">${r.due || ""}</td>
            <td><span class="status-pill" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${r._raw.trangThai || st.short}</span></td>
      </tr>`;
}
let activeIndicatorPieStatus = "";
function openIndicator(role, idx) {
    if (!canSeeRole(role)) {
        toast("Không có quyền xem chỉ tiêu này.");
        return;
    }
    const item = indicators[role][idx];
    const [name, count] = item;
    const rs = indicatorRecords.filter(
        (r) => r.role === role && r.indicator === name,
    );
    currentDrawerRecords = rs.map((r) => ({ ...r, metric: "indicator" }));
    activeIndicatorPieStatus = "";
    document.getElementById("drawerTitle").textContent = `Chỉ tiêu: ${name}`;
    renderIndicatorList(currentDrawerRecords);
    openDrawer();
}
function donutArc(cx, cy, r, start, end) {
    const rad = (a) => ((a - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(start)),
        y1 = cy + r * Math.sin(rad(start));
    const x2 = cx + r * Math.cos(rad(end)),
        y2 = cy + r * Math.sin(rad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}
function indicatorCounts(rs = currentDrawerRecords) {
    return statusDefs.map((st) => ({
        key: st.key,
        label: st.label,
        short: st.short,
        color: st.color,
        count: rs.filter((r) => r.status === st.key).length,
    }));
}
function renderDonut(counts) {
    const total = counts.reduce((a, c) => a + c.count, 0) || 1;
    let angle = 0;
    const paths = counts
        .map((c) => {
            const len = (c.count / total) * 360;
            const start = angle;
            const end = angle + len;
            angle = end;
            if (c.count === 0) return "";
            return `<path class="donut-seg" d="${donutArc(120, 120, 82, start, end)}" fill="none" stroke="${c.color}" stroke-width="28" stroke-linecap="butt" onclick="setIndicatorStatusFilter('${c.key}')"><title>${c.label}: ${c.count}</title></path>`;
        })
        .join("");
    return `<svg class="donut-svg" viewBox="0 0 240 240"><circle cx="120" cy="120" r="82" fill="none" stroke="#06192c" stroke-width="28"/>${paths}<circle cx="120" cy="120" r="54" fill="#061528" stroke="rgba(87,178,255,.25)"/><text x="120" y="116" text-anchor="middle" class="donut-center">${fmt(activeIndicatorPieStatus ? counts.find((c) => c.key === activeIndicatorPieStatus)?.count || 0 : total)}</text><text x="120" y="137" text-anchor="middle" class="donut-sub">${activeIndicatorPieStatus ? statusMeta(activeIndicatorPieStatus).short : "Tổng bản ghi"}</text></svg>`;
}
function renderIndicatorList(rs) {
    const counts = indicatorCounts(rs);
    const total = rs.length || 1;
    document.getElementById("drawerBody").innerHTML =
        `<div class="indicator-analytics"><div class="donut-box"><div id="indicatorDonut"></div><button class="ghost" style="margin-top:8px" onclick="setIndicatorStatusFilter('')">Xem tất cả trạng thái</button></div><div class="pie-side"><h4 style="margin:0">Phân bổ kết quả xử lý theo trạng thái</h4><div class="pie-legend" id="indicatorPieLegend"></div><div class="status-bar-mini" id="indicatorBars"></div></div></div><div class="filters"><input id="qInd" placeholder="Tìm chỉ tiêu/bản ghi..." oninput="renderIndicatorRows()"/><select id="stInd" onchange="activeIndicatorPieStatus=this.value;renderIndicatorRows()"><option value="">Tất cả trạng thái</option>${statusDefs.map((s) => `<option value="${s.key}">${s.label}</option>`).join("")}</select><select id="unitInd" onchange="renderIndicatorRows()"><option value="">Tất cả đơn vị</option>${[...new Set(rs.map((r) => r.unit))].map((u) => `<option>${u}</option>`).join("")}</select><button class="ghost" onclick="qlnvxOpenAssignmentForm()">Giao xử lý từ chỉ tiêu</button></div><div class="list-summary" id="indSummary"></div><div id="indRows"></div>`;
    document.getElementById("indicatorDonut").innerHTML = renderDonut(counts);
    document.getElementById("indicatorPieLegend").innerHTML = counts
        .map(
            (c) =>
                `<button class="${activeIndicatorPieStatus === c.key ? "active" : ""}" onclick="setIndicatorStatusFilter('${c.key}')"><i class="sw" style="background:${c.color}"></i><span>${c.short}</span><b>${fmt(c.count)}</b></button>`,
        )
        .join("");
    document.getElementById("indicatorBars").innerHTML = counts
        .map(
            (c) =>
                `<div class="status-bar-row"><label>${c.short}</label><div class="status-bar-track"><i style="width:${total ? (c.count / total) * 100 : 0}%;background:${c.color}"></i></div><b>${fmt(c.count)}</b></div>`,
        )
        .join("");
    renderIndicatorRows();
}
function setIndicatorStatusFilter(status) {
    activeIndicatorPieStatus = status || "";
    const sel = document.getElementById("stInd");
    if (sel) sel.value = activeIndicatorPieStatus;
    renderIndicatorList(currentDrawerRecords);
}
function renderIndicatorRows() {
    const q = (document.getElementById("qInd")?.value || "").toLowerCase();
    const st =
        document.getElementById("stInd")?.value || activeIndicatorPieStatus || "";
    const unit = document.getElementById("unitInd")?.value || "";
    activeIndicatorPieStatus = st;
    const rs = currentDrawerRecords.filter(
        (r) =>
            (!st || r.status === st) &&
            (!unit || r.unit === unit) &&
            (!q ||
                [r.id, r.title, r.indicator, r.unit]
                    .join(" ")
                    .toLowerCase()
                    .includes(q)),
    );
    document.getElementById("indSummary").innerHTML =
        `<span class="badge gold">Đang hiển thị: ${fmt(rs.length)}</span><span class="badge ok">Tổng chỉ tiêu: ${fmt(currentDrawerRecords.length)}</span><span class="badge">Nguồn: ${rs[0]?.source || currentDrawerRecords[0]?.source || "--"}</span><span class="badge">Tần suất: ${rs[0]?.freq || currentDrawerRecords[0]?.freq || "--"}</span>${st ? `<span class="badge" style="border-color:${statusMeta(st).color};color:${statusMeta(st).color}">${statusMeta(st).label}</span>` : ""}`;
    document.getElementById("indRows").innerHTML =
        rs
            .map((r) => {
                const st = statusMeta(r.status);
                return `<button class="record-row" onclick="openIndicatorDetail('${r.id}')"><div><b>${r.id}</b><small>Chỉ tiêu</small></div><div><div class="title">${r.title}</div><small>${axisMeta[r.role].icon} ${axisMeta[r.role].name} · ${r.unit}</small></div><div><span class="status-pill" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span></div><div><small>Nguồn</small><b>${r.source}</b></div><div><small>Tiến độ</small><div class="progress"><i style="width:${r.progress}%"></i></div><b>${r.progress}%</b></div></button>`;
            })
            .join("") ||
        '<div class="access-lock">Không có bản ghi phù hợp bộ lọc.</div>';
}

function isRecordOwnedByMe(r) {
    if (!r || r.metric === "docIn" || r.metric === "docOut") return false;
    if (!r.creatorRole) return false;
    return (
        r.creatorRole === currentRole &&
        (r.creatorSoId || null) === (currentSoId || null) &&
        (r.creatorXaId || null) === (currentXaId || null)
    );
}

function sourceForRecord(r) {
    if (r.metric === "docIn" || r.metric === "docOut")
        return {
            name: "Văn bản/PDF",
            offset: 26 * 60 * 60 * 1000 + 8 * 60 * 1000,
        };
    if (r.metric === "indicator")
        return {
            name: "CSDL chuyên ngành",
            offset: 18 * 60 * 1000 + 15 * 1000,
        };
    return { name: "API realtime", offset: 3 * 60 * 1000 + 28 * 1000 };
}

function dtTime(offsetMs) {
    const d = new Date(Date.now() - offsetMs);
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function relTime(offsetMs) {
    const s = Math.floor(offsetMs / 1000);
    if (s < 60) return `${s} giây trước`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60),
        mm = m % 60;
    if (h < 24) return `${h} giờ${mm ? ` ${mm} phút` : ""} trước`;
    const d = Math.floor(h / 24),
        hh = h % 24;
    return `${d} ngày${hh ? ` ${hh} giờ` : ""} trước`;
}

function linkedTasksTreeHtml(doc) {
    /* Chưa có API QLNV trả nhiệm vụ theo văn bản -> hiện trạng thái trống thay cho dữ liệu mẫu.
       Có API thì lọc nhiệm vụ theo doc (vd. vanBanDenDinhKem/vanBanDiDinhKem) và vẽ bảng ở đây. */
    return `<div class="detail-card linked-tasks-card"><div class="card-head"><h4>Nhiệm vụ liên quan văn bản này</h4></div><div class="subtask-empty">Chưa có dữ liệu.</div></div>`;
}

window.approveButtonHtml =
    window.approveButtonHtml ||
    function (hasPending) {
        if (!hasPending) return "";
        return `<button type="button" class="btn-approve-all primary" onclick="event.stopPropagation(); approveAllLinkedTasks(this)" style="margin-left: auto; padding: 4px 12px; font-size: 13px; cursor: pointer;">✓ Duyệt tất cả nhiệm vụ</button>`;
    };

/* ============================================================
 * CHI TIẾT NHIỆM VỤ — port từ filev2.js (qlnvxRenderRecordDetail + các helper nó cần).
 * Khác filev2: record ở đây dựng từ route v2 (`r._raw`) nên tên đơn vị/người đã là
 * chuỗi phẳng (donViChuTriName/donViThucHienName), KHÔNG phải dò cây tổ chức như
 * qlnvItemUnitPath bên kia -> các helper dưới đọc thẳng `_raw`.
 * ============================================================ */
var QLNV_EXTERNAL_TASK_URL = {
    // PROD (bỏ tiền tố `test-`); ghi đè được bằng window.QLNV_EXTERNAL_BKAV_HOST.
    bkavHost:
        (typeof window !== "undefined" && window.QLNV_EXTERNAL_BKAV_HOST) ||
        "https://theodoinhiemvu.hanoi.gov.vn",
    /* DEEPLINK CHÍNH THỨC của Bkav: /api/deeplink/task?task_id=<mã>&username=<tài khoản>
        &key=<api key>. Hệ đích tự đăng nhập theo username + key nên KHÔNG cần bọc SSO,
        cũng không dùng /app/task?taskDetail= như trước (vào là đòi đăng nhập lại). */
    bkavDeeplink: "/api/deeplink/task",
    bkavApiKey:
        (typeof window !== "undefined" && window.QLNV_EXTERNAL_BKAV_API_KEY) ||
        "RJFwW1Uqvd85QkWw_10xo4QZNc3wxhGw2j7NkUiJjZg",
    // Không có task_id thì mở màn danh sách của app.
    bkavAppList: "/app/task"
};
var QLNV_CHUTRUONG_BASE =
    (typeof window !== "undefined" && window.QLNV_CHUTRUONG_BASE) ||
    "https://iochn.hanoi.dcs.vn:300/";
var QLNV_CHUTRUONG_PAGE =
    (typeof window !== "undefined" && window.QLNV_CHUTRUONG_PAGE) ||
    "/OutGoingDocument";

function qlnvSerializeQuery(obj) {
    var params = new URLSearchParams();
    Object.keys(obj || {}).forEach(function (key) {
        var val = obj[key];
        if (val == null || val === "") return;
        params.append(key, String(val));
    });
    return params.toString();
}
/* Bundle {tokenBase, token:{jwt_access_token}} từ proxy BE — dùng cho deeplink tự đăng
   nhập sang DHVB. Cross-origin (:3004) nên KHÔNG thêm header lạ để tránh preflight. */
function qlnvFetchProxyTokenBundle() {
    // KHÔNG dùng QLNV_TOKEN_CFG.proxyTokenUrl: từ khi xác thực chuyển sang token SSO,
    // biến đó trỏ /api/token và trả access_token SSO. Deeplink lại cần đúng bundle
    // {tokenBase, token:{jwt_access_token}} — JWT do be_qlnv ký — vì DHVB nhận
    // token đó để tự đăng nhập. Hai việc khác nhau, giữ hai endpoint khác nhau.
    var bundleUrl = resolveApiBase() + "/api-nest/qlnv/token";
    return fetch(bundleUrl, {
        credentials: "include",
        headers: { Accept: "application/json" },
    }).then(function (r) {
        if (!r.ok) throw new Error("Lấy token HTTP " + r.status);
        return r.json();
    });
}
/* "Cập nhật nhiệm vụ" -> mở nhiệm vụ trên Bkav (Theo dõi nhiệm vụ) qua deeplink chính thức.
    Mọi nhiệm vụ — kể cả xã/phường giao — đều đã lên BMM nên không còn nhánh mở QLNV lifetex
    theo _id Mongo. Thiếu mã hoặc tài khoản thì lùi về trang danh sách của Bkav. */
function qlnvOpenTaskExternal(recId) {
    var r =
        (currentDrawerRecords || []).find(function (x) {
            return x.id === recId;
        }) ||
        (records || []).find(function (x) {
            return x.id === recId;
        });
    if (!r) return;
    var raw = r._raw || {};
    var T = QLNV_EXTERNAL_TASK_URL;
    /* Mã BKAV để vào thẳng chi tiết = `taskId` của route v2 (chính là `Ma` bên BKAV).
          get-task trả `bmmTaskId` (= taskId) cho mọi dòng; bản BE cũ không trả thì lùi về
          chính `r.id`, nếu không nút "Cập nhật nhiệm vụ" chỉ mở được trang DANH SÁCH của BKAV.
          Đối chiếu: GET /qlnv/v2/detail?taskId=237831 trả "Ma": 237831 -> taskId === mã BKAV. */
    var bmmId = raw.bmmTaskId != null ? String(raw.bmmTaskId) : "";
    if (!bmmId && /^\d+$/.test(String(r.id || ""))) bmmId = String(r.id);
    /* Deeplink cần TÀI KHOẢN ĐĂNG NHẬP để hệ Bkav biết mở dưới danh nghĩa ai. */
    var bkavUser = String((window.__assMe && window.__assMe.account) || "").trim();
    var target =
        bmmId && bkavUser
            ? T.bkavHost +
            T.bkavDeeplink +
            "?" +
            qlnvSerializeQuery({
                task_id: bmmId,
                username: bkavUser,
                key: T.bkavApiKey,
            })
            : T.bkavHost + T.bkavAppList;
    try {
        window.open(target, "_blank", "noopener");
    } catch (e) {
        location.href = target;
    }
    toast(
        "Mở nhiệm vụ trên hệ Theo dõi nhiệm vụ (Bkav) — " +
        (bmmId && bkavUser
            ? "chi tiết nhiệm vụ"
            : !bmmId
                ? "danh sách (chưa mirror mã nhiệm vụ)"
                : "danh sách (chưa lấy được tài khoản đăng nhập)") +
        "…",
    );
}
/* "Tạo chủ trương/kế hoạch" -> mở hệ Văn bản đi (DHVB) kèm token để tự đăng nhập. */
function qlnvOpenChuTruong() {
    qlnvFetchProxyTokenBundle()
        .then(function (bundle) {
            var tokenBase = (bundle && bundle.tokenBase) || null;
            var token = (bundle && bundle.token) || null;
            if (!token || !token.jwt_access_token) {
                window.open(QLNV_CHUTRUONG_BASE, "_blank", "noopener");
                return;
            }
            window.open(
                QLNV_CHUTRUONG_BASE +
                "?" +
                qlnvSerializeQuery(
                    Object.assign({}, tokenBase || {}, {
                        token: token.jwt_access_token,
                        isRedirect: true,
                        default_page: QLNV_CHUTRUONG_PAGE,
                    }),
                ),
                "_blank",
                "noopener",
            );
        })
        .catch(function (err) {
            console.warn("[DHVB redirect] token lỗi", err);
            window.open(QLNV_CHUTRUONG_BASE, "_blank", "noopener");
        });
    toast("Mở hệ Văn bản đi (DHVB) để tạo chủ trương/kế hoạch…");
}
/* Nút "Tạo chủ trương/kế hoạch".
   ⚠️ KHÁC bản chuẩn qlnv_v2 (canCreateChuTruong + qlnvIsMoiTao): bên đó chỉ hiện khi
   nhiệm vụ còn ở ĐẦU vòng đời (Mới tạo / Đang thực hiện), các trạng thái hoàn thành /
   sắp hạn / nguy cơ trễ / quá hạn thì ẩn. Theo yêu cầu, ở đây hiện cho MỌI nhiệm vụ —
   chỉ trừ văn bản đến/đi (nhánh isDoc có bộ nút riêng). */
function canCreateChuTruong(r) {
    return !!r && !isDocMetric(r.metric);
}
/* "Đơn vị chủ trì" hiển thị dạng "<đơn vị>/<cán bộ được giao đích danh>" nếu có người. */
function qlnvUnitPathWithPerson(r) {
    var raw = (r && r._raw) || {};
    var path = raw.donVi || raw.donViChuTriName || (r && r.unit) || "—";
    var person = raw.nguoiThucHien || "";
    return person ? path + "/" + person : path;
}

function qlnvxRenderRecordDetail(r, limited) {
    console.log("aaaaaaaa", r, limited);
    /* Bản ghi "nhiệm vụ giao" (mirror) chỉ để liệt kê đúng ở phía người giao — nội dung/sửa/xóa/nhánh việc đều
  nằm ở bản ghi gốc phía "nhiệm vụ nhận" (r.mirrorOfId), tránh 2 nơi lưu dữ liệu lệch nhau. */
    if (r.mirrorOfId) {
        const st = statusMeta(r.status, r.metric);
        document.getElementById("modalBody").innerHTML =
            `<div class="manual-note">Đây là nhiệm vụ bạn đã giao cho <b>${esc(r.unit)}</b> — toàn bộ nội dung, tiến độ, nhiệm vụ nhánh được quản lý tại phía "Nhiệm vụ nhận" của đơn vị đó.</div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ</h4><div class="kv"><b>Mã nhiệm vụ</b><span>${r.code || "—"}</span><b>Tiêu đề</b><span>${esc(r.title)}</span><b>Đơn vị nhận</b><span>${esc(r.unit)}</span><b>Hạn hoàn thành</b><span>${r.due}</span><b>Trạng thái</b><span style="color:${st.color}">${st.label}</span></div></div><div class="detail-card"><h4>Mô tả</h4><p class="wrap">${esc(r.description || "")}</p><div class="progress"><i style="width:${r.progress}%"></i></div><p><b class="mono">${r.progress}%</b> hoàn thành</p><div class="action-bar"><button class="primary" onclick="qlnvxOpenRecordDetail('${r.mirrorOfId}')">→ Xem đầy đủ tại nhiệm vụ nhận</button></div></div></div>`;
        return;
    }
    const isDoc = isDocMetric(r.metric);
    console.log("isDoc", isDoc);
    const st = statusMeta(r.status, r.metric);
    let content = "";
    {
        if (isDoc) {
            content = qlvbDocDetailHtml(r, st, limited);
        } else {
            const linkedDocs = (r.linkedDocIds || [])
                .map((id) => records.find((x) => x.id === id))
                .filter(Boolean);
            /* Bố cục theo filev2.qlnvxRenderRecordDetail: 2 thẻ "Thông tin nhiệm vụ" + "Mô tả &
               tiến độ", nút Tạo chủ trương/Cập nhật nhiệm vụ mở phần mềm nguồn. Giữ các dòng
               dữ liệu riêng của route v2 (loại văn bản, phối hợp, người giao/nhận, độ khẩn)
               mà filev2 không có. */
            const raw = r._raw || {};
            const doKhanText =
                (raw.doKhan && (raw.doKhan.title || raw.doKhan.name)) ||
                (typeof raw.doKhan === "string" ? raw.doKhan : "") ||
                r.priority ||
                "—";
            const mucDoText =
                raw.mucDoQuanTrong || raw.UuTien || raw.uuTien || "Bình thường";
            /* "Đơn vị phối hợp" hiển thị GẠCH ĐẦU DÒNG như bản chuẩn (nhiều đơn vị, mỗi đơn
               vị là một đường dẫn cơ cấu tổ chức). API v2 trả 1 chuỗi ngăn cách bởi dấu phẩy. */
            const coordList = String(
                raw.donViPhoiHop || raw.donViPhoiHopName || raw.donViThucHienName || "",
            )
                .split(/\s*[,;]\s*/)
                .map((x) => x.trim())
                .filter(Boolean);
            const coordListHtml = coordList.length
                ? `<ul style="margin:0;padding-left:18px">${coordList
                    .map((x) => `<li>${esc(x)}</li>`)
                    .join("")}</ul>`
                : "—";
            const linkedVanBan = Array.isArray(raw.vanBanDenDinhKem)
                ? raw.vanBanDenDinhKem
                : [];
            const vanBanLienKetHtml = linkedVanBan.length
                ? linkedVanBan
                    .map((d) =>
                        esc(
                            [d && (d.soVanBan || d.code), d && (d.trichYeu || d.tenVanBan)]
                                .filter(Boolean)
                                .join(" – "),
                        ),
                    )
                    .join("; ")
                : "—";
            const progressHtml = r.__hasProgress
                ? `<div class="progress"><i style="width:${r.progress}%"></i></div><p><b class="mono">${r.progress}%</b> hoàn thành</p>`
                : `<p class="wrap" style="color:#8ab0c8;margin-top:6px">Tiến độ: <b style="color:${st.color}">${st.label}</b> <span style="opacity:.65">· QLNV chưa cung cấp số liệu %</span></p>`;
            content = `<div class="detail-grid">
        <div class="detail-card">
          <h4>Thông tin nhiệm vụ</h4>
          <div class="kv">
            <b>Tiêu đề</b><span>${limited ? "[Đã rút gọn theo phân quyền] " : ""}${esc(r.title)}</span>
            <b>Lĩnh vực</b><span>${esc(r.field || "—")}</span>
            <b>Đơn vị chủ trì</b><span>${limited ? "Đơn vị liên quan được masking" : esc(qlnvUnitPathWithPerson(r))}</span>
            <b>Đơn vị phối hợp</b><span>${limited ? "Ẩn theo phân quyền" : coordListHtml}</span>
            <b>Người giao</b><span>${limited ? "Ẩn theo phân quyền" : esc(raw.nguoiGiao || raw.createdBy || "—")}</span>
            <b>Ngày bắt đầu</b><span>${esc(r.created || "—")}</span>
            <b>Hạn hoàn thành</b><span>${esc(r.due || "—")}</span>
            <b>Mức độ quan trọng</b><span>${esc(mucDoText)}</span>
            <b>Độ khẩn</b><span>${esc(doKhanText)}</span>
            <b>Văn bản liên kết</b><span>${vanBanLienKetHtml}</span>
            <b>Trạng thái</b><span style="color:${st.color}">${esc(raw.trangThai || st.label)}</span>
          </div>
        </div>
        <div class="detail-card">
          <h4>Mô tả &amp; tiến độ</h4>
          <p class="wrap">${limited ? "Nội dung được che theo phân quyền." : esc(r.description || "—")}</p>
          ${r.additionalInfo ? `<p class="wrap"><b>Thông tin bổ sung:</b> ${esc(r.additionalInfo)}</p>` : ""}
          ${progressHtml}
          <div class="action-bar">
            ${canCreateChuTruong(r) ? `<button class="ghost" onclick="qlnvOpenChuTruong()" title="Mở hệ Văn bản đi (DHVB) để tạo chủ trương/kế hoạch">Tạo chủ trương/kế hoạch</button>` : ""}
            <button class="ghost" onclick="qlnvOpenTaskExternal('${esc(r.id)}')" title="Mở phần mềm nguồn (Bkav / QLNV) theo đơn vị nhận">Cập nhật nhiệm vụ</button>
            <button class="ghost" onclick="toast('Đã gửi nhắc việc tới đơn vị xử lý.')">Nhắc xử lý</button>
          </div>
        </div>
      </div>`;
        }
    }
    const src = sourceForRecord(r);
    /* Bản ghi lấy từ API thì ghi NGUỒN THẬT (theo filev2), không bịa "X phút trước" như
       dữ liệu demo. */
    const note = r._raw
        ? `<div class="record-update-note">Nguồn: <b>Hệ thống QLNV</b> · đồng bộ trực tiếp khi mở chi tiết${r.id ? ` · ID <span class="mono">${esc(r.id)}</span>` : ""}.</div>`
        : `<div class="record-update-note">Nguồn dữ liệu liên quan: <b>${src.name}</b> · cập nhật gần nhất <b>${dtTime(src.offset)}</b> · <b>${relTime(src.offset)}</b>.</div>`;
    const bottom = isDoc ? linkedTasksTreeHtml(r) : qlnvxSubtaskStatsHtmlGd(r);
    const backRec = window.__recordBackId
        ? records.find((x) => x.id === window.__recordBackId)
        : null;
    const backFieldCtx = window.__recordBackFieldId
        ? fieldTarget(window.__recordBackFieldId)
        : null;
    const backHtml = backRec
        ? `<div class="iip-modal-back"><button class="ghost" onclick="qlnvxOpenRecordDetail('${backRec.id}')">← Quay lại ${backRec.id}</button></div>`
        : backFieldCtx
            ? `<div class="iip-modal-back"><button class="ghost" onclick="openFieldSource('${window.__recordBackFieldId}')">← Quay lại ${backFieldCtx.scope === "item" ? "chỉ tiêu" : "lĩnh vực"}: ${esc(backFieldCtx.label)}</button></div>`
            : "";
    document.getElementById("modalBody").innerHTML =
        `${backHtml}${note}${content}${bottom}`;
}

function openIndicatorDetail(id) {
    const r = indicatorRecords.find((x) => x.id === id);
    if (!r) return;
    const st = statusMeta(r.status);
    document.getElementById("modalTitle").textContent = `Cấp 2 · ${r.id}`;
    document.getElementById("modalSub").textContent =
        `Chỉ tiêu · ${axisMeta[r.role].name} · ${r.indicator}`;
    document.getElementById("modalBody").innerHTML =
        `<div class="detail-grid"><div class="detail-card"><h4>Thông tin chỉ tiêu</h4><div class="kv"><b>Tên chỉ tiêu</b><span>${r.indicator}</span><b>Đơn vị cập nhật</b><span>${r.unit}</span><b>Nguồn dữ liệu</b><span>${r.source}</span><b>Tần suất</b><span>${r.freq}</span><b>Trạng thái</b><span style="color:${st.color}">${st.label}</span><b>Tiến độ</b><span>${r.progress}%</span></div></div><div class="detail-card"><h4>Nội dung theo dõi</h4><p>${r.description}</p><div class="action-bar"><button class="primary" onclick="qlnvxOpenAssignmentForm()">Giao nhiệm vụ từ chỉ tiêu</button><button class="ghost" onclick="toast('Đã yêu cầu cập nhật số liệu chỉ tiêu ${r.id}')">Yêu cầu cập nhật dữ liệu</button><button class="ghost" onclick="toast('Đã tạo cảnh báo cho chỉ tiêu ${r.id}')">Tạo cảnh báo</button></div></div></div><div class="detail-card"><h4>Nhật ký chỉ tiêu</h4>${r.history.map((h) => `<div class="audit-item"><b>${h.time}</b><span>${h.text}</span></div>`).join("")}</div>`;
    openModal();
}
function openSourceDetail(name) {
    document.getElementById("modalTitle").textContent = "Nguồn dữ liệu · " + name;
    document.getElementById("modalSub").textContent =
        "Cấu hình cập nhật dữ liệu phường Việt Hưng";
    document.getElementById("modalBody").innerHTML =
        `<div class="detail-grid"><div class="detail-card"><h4>Thông tin nguồn</h4><div class="kv"><b>Tên nguồn</b><span>${name}</span><b>Cơ chế</b><span>API realtime hoặc nhập Excel/PDF theo phụ lục khảo sát</span><b>Tần suất</b><span>Ngày/Tuần/Tháng/Khi phát sinh</span><b>Kiểm tra</b><span>Đúng · đủ · sạch · sống</span></div></div><div class="detail-card"><h4>Thao tác</h4><div class="action-bar"><button class="primary" onclick="toast('Đã chạy đồng bộ thử nguồn ${name}')">Đồng bộ thử</button><button class="ghost" onclick="toast('Đã mở màn import Excel')">Import Excel</button><button class="ghost" onclick="toast('Đã tạo cảnh báo lỗi dữ liệu')">Cảnh báo lỗi</button></div></div></div>`;
    openModal();
}
function openPermissionModal() {
    document.getElementById("modalTitle").textContent =
        "Phạm vi dữ liệu tài khoản";
    document.getElementById("modalSub").textContent = currentAccount.title;
    document.getElementById("modalBody").innerHTML =
        '<div class="access-lock">Phạm vi dữ liệu được áp dụng trong dashboard theo tài khoản đăng nhập. Widget Quyền dữ liệu đã được ẩn theo yêu cầu; có thể kiểm soát ẩn/hiện widget bằng nút cấu hình.</div>';
    openModal();
}
function openQuickCommand() {
    document.getElementById("modalTitle").textContent = "Lệnh nhanh IOC/CAD";
    document.getElementById("modalSub").textContent =
        "Giao việc, lọc dữ liệu, mở dashboard chi tiết";
    document.getElementById("modalBody").innerHTML =
        `<div class="field"><label>Nhập lệnh</label><input id="quickInput" placeholder="Ví dụ: mở nhiệm vụ quá hạn UBND, giao việc TTHC, văn bản đến sắp hạn..." autofocus /></div><div class="action-bar"><button class="primary" onclick="runQuick()">Chạy lệnh</button><button class="ghost" onclick="setMetric('assigned');closeModal()">Mở nhiệm vụ giao</button><button class="ghost" onclick="setMetric('received');closeModal()">Mở nhiệm vụ nhận</button><button class="ghost" onclick="openList({metric:null,status:'overdue',title:'Tất cả hồ sơ quá hạn'})">Mở quá hạn</button></div>`;
    openModal();
    setTimeout(() => document.getElementById("quickInput")?.focus(), 80);
}
function runQuick() {
    const q = (document.getElementById("quickInput")?.value || "").toLowerCase();
    if (q.includes("giao")) qlnvxOpenAssignmentForm();
    else if (q.includes("quá hạn"))
        openList({
            metric: null,
            status: "overdue",
            title: "Kết quả lệnh nhanh: quá hạn",
        });
    else if (q.includes("văn bản đến")) {
        setMetric("docIn");
        closeModal();
    } else if (q.includes("nhiệm vụ nhận")) {
        setMetric("received");
        closeModal();
    } else {
        toast(
            'Lệnh demo đã được ghi nhận. Gợi ý: "giao", "quá hạn", "văn bản đến", "nhiệm vụ nhận".',
        );
    }
}
/* ============================================================
 * GIAO NHIỆM VỤ — port từ luồng thật trong block_cms_ioc/task/qlnv_v2.js
 * (qlnvxOpenAssignmentForm / qlnvxCreateAssignment / buildQlnvCreateBody + các picker).
 * Gồm: cây cơ cấu tổ chức (đơn vị nhận + đơn vị phối hợp), chọn văn bản,
 * kịch bản xử lý, đính kèm file (upload sau khi tạo), lưu nháp.
 * ============================================================ */

/* Cây cơ cấu tổ chức: NGUỒN DUY NHẤT là GET /api-nest/dashboards/user-tree của
    be_ioc_dash (đổi 2026-09-10, theo yêu cầu "dùng một API cho đồng nhất").
    Trước đây cây lấy từ /qlnv/v2/organization-structure và chỉ có DANH SÁCH TRỤC GỐC
    là theo user-tree -> hai nguồn lệch nhau: organization-structure là cây TOÀN HỆ
    THỐNG (phải tự cắt phạm vi bằng cách dò TÊN ĐỊA BÀN), còn user-tree đã là đúng
    phạm vi + đúng các trục mà tài khoản được cấp, giống hệt cây trên header.
    user-tree trả cây LỒNG (`tree[].children[]`) nên dựng lại được y hệt cấu trúc
    {nodes, byId, children} mà cả 3 chỗ dùng: ô "đơn vị chủ trì", ô "đơn vị phối hợp"
    và options bộ lọc "Đơn vị chủ trì". KHÔNG còn đường lùi về organization-structure:
    user-tree hỏng/rỗng thì cây hiện trống (user chốt 2026-09-10) — thà trống còn hơn
    dựng lại cây sai phạm vi. */
var ASS_DRAFT_KEY = "ioc-assignment-draft";
/* Định dạng file BE cho phép (đo từ response upload của app QLNV). Ngoài whitelist
   thì BE trả "File X không đúng định dạng" -> chặn sớm ở FE cho rõ. */
var ASS_UPLOAD_EXTS = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "csv",
    "zip",
    "rar",
    "png",
    "jpg",
    "jpeg",
    "gif",
];

var __assOrg = null,
    __assOrgP = null;

function assNorm(v) {
    return String(v || "")
        .trim()
        .toLowerCase();
}
function assSearchKey(v) {
    return assNorm(v)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
}
function assEsc(v) {
    return String(v == null ? "" : v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/* Nạp 1 lần + gộp lời gọi trùng. Lỗi -> cây rỗng, form vẫn mở được. */
/* Dựng {nodes, byId, children} từ cây LỒNG của user-tree.
    - id đơn vị của mỗi node lấy qua assUserTreeUnitId (node `custom-*` để id đơn vị ở
      `orgId`, node `org-*` thì chính `id` là id đơn vị — xem chú thích hàm đó);
    - `parent` = id đơn vị của node CHA trong user-tree, "" nếu là gốc, để assTreeHtml /
      assCoordRoots / assUserTreeRoots dùng lại nguyên xi như hồi còn organization-structure;
    - MỘT ĐƠN VỊ CHỈ VÀO CÂY MỘT LẦN: cấu hình cơ cấu có thể gắn cùng một orgId ở nhiều
      node -> lần sau chỉ GỘP con vào node đã có, nếu không cây hiện trùng và
      assCoordRoots đếm sai độ sâu. */
function assOrgFromUserTree(ut) {
    var list = (ut && (ut.tree || ut.data)) || [];
    var nodes = [],
        byId = {},
        children = {};
    (function walk(arr, parentId) {
        (arr || []).forEach(function (n) {
            if (!n) return;
            var id = assUserTreeUnitId(n);
            // Node không tra được id đơn vị thì bỏ qua node đó nhưng VẪN đi tiếp xuống
            // con, để nhánh dưới không bị mất theo (con được treo lên cha còn lại).
            if (!id) return walk(n.children, parentId);
            var node = byId[id];
            if (!node) {
                node = {
                    id: isNaN(Number(id)) ? id : Number(id),
                    name: n.name || n.title || id,
                    parent: parentId === "" ? null : parentId,
                    dashboardId: n.dashboardId != null ? n.dashboardId : null,
                    /* Đường dẫn cơ cấu ("490.698.1310.1427" / "/490/698/1310/1427/"), giữ lại
                        để assDuoiMinh phân biệt CẤP DƯỚI với NGANG CẤP: user-tree trả node gốc
                        cho cả 4 trục của địa bàn, `parent` của node gốc luôn null nên không
                        suy ra được quan hệ, chỉ `path` mới nói được 1427 không nằm dưới 2164. */
                    path: n.external_path || n.path || null,
                };
                byId[id] = node;
                nodes.push(node);
                (children[parentId] = children[parentId] || []).push(node);
            }
            walk(n.children, id);
        });
    })(list, "");
    return { nodes: nodes, byId: byId, children: children };
}
function assLoadOrgStructure() {
    if (__assOrg) return Promise.resolve(__assOrg);
    if (__assOrgP) return __assOrgP;
    // Chờ luôn phạm vi tài khoản: assScopeRoot cần iddv, thiếu là không cắt được phạm vi.
    __assOrgP = Promise.all([assLoadMyScope(), assLoadUserTree()]).then(
        function (r) {
            __assOrg = assOrgFromUserTree(r[1]);
            __assOrgP = null;
            if (!__assOrg.nodes.length)
                console.warn("[ORG] user-tree rỗng -> cây đơn vị sẽ trống");
            return __assOrg;
        },
        function (err) {
            console.warn("[ORG] Load failed:", err);
            __assOrg = { nodes: [], byId: {}, children: {} };
            __assOrgP = null;
            return __assOrg;
        },
    );
    return __assOrgP;
}
/* Đơn vị của TÀI KHOẢN ĐĂNG NHẬP — NGUỒN CHÍNH là GET /api/employees/profile.
    Một người có thể thuộc NHIỀU đơn vị (bảng `user_organizations`), nhưng /qlnv/v2/pham-vi
    chỉ trả MỘT `canBo.iddv` = đơn vị PRIMARY, và token SSO cũng chỉ mang một chuỗi `Donvi`
    nên không đường nào suy ra đơn vị thứ hai từ đó. Đo prod 2026-09-30 với
    `bithu_duviethung`: /pham-vi ra 2164 "HĐND phường Việt Hưng", còn profile ra CẢ 2164 lẫn
    1640 "Đảng ủy phường Việt Hưng" — bám /pham-vi thì người này mất hẳn tư cách Đảng ủy ở
    cả ô CHỦ TRÌ lẫn ô PHỐI HỢP.
    `profile.organizations[].id` ĐÚNG hệ iddv (cùng lần đo: id 2164 trùng `canBo.iddv`,
    `externalId` cũng "2164") -> nối thẳng vào cây, KHÔNG quy đổi qua externalId.
    VẪN gọi /pham-vi song song vì chỉ nó có `filter.viewAllUnits` (whitelist lãnh đạo, xem
    assScopeRoots) và `canBo` mà các chỗ khác đang đọc. Hai request độc lập: hỏng cái nào thì
    lùi về cái còn lại, hỏng cả hai thì rỗng. */
var __assScopeInfo = null,
    __assScopeP = null;
/* Danh sách iddv của tài khoản, PRIMARY ĐỨNG ĐẦU — assScopeRoot (số ít) vẫn lấy phần tử
    đầu nên mọi chỗ đang bám "đơn vị của tôi" giữ nguyên hành vi.
    NGUỒN LÀ PROFILE, đã đủ cả primary lẫn kiêm nhiệm: ssoUser.js `ORDER BY uo.is_primary
    DESC` nên phần tử đầu CHÍNH LÀ primary.
    `canBo.iddv` chỉ là ĐƯỜNG LÙI, không gộp vào: hai giá trị khác nguồn — `canBo.iddv` từ
    `dm_user` (datamart Bkav) hoặc suy từ claim `Donvi`, còn `organizations` từ bảng
    `user_organizations` của portal — nên khi lệch, nhét `canBo.iddv` lên đầu là ĐẨY primary
    thật xuống, sai cả nhãn người giao lẫn bộ lọc. Chỉ dùng khi profile không cho được gì:
    ssoUser.js trả `organizations: []` nếu môi trường đó thiếu bảng `user_organizations`
    (`coOrg` false), và profile còn có thể lỗi mạng.
    Không dùng `Number()` trần rồi tin: `Number('')` ra 0 và id rác lọt xuống thành node
    tra không thấy, ô im lặng thiếu đơn vị mà không báo gì. */
function assScopeIddvList(phamVi, profile) {
    var out = [],
        seen = {};
    function them(v) {
        if (v == null || v === "") return;
        var n = Number(v);
        if (!isFinite(n) || n <= 0) return;
        if (seen[n]) return;
        seen[n] = 1;
        out.push(n);
    }
    ((profile && profile.organizations) || []).forEach(function (o) {
        them(o && o.id);
    });
    if (!out.length) them(phamVi && phamVi.canBo && phamVi.canBo.iddv);
    return out;
}
function assLoadMyScope() {
    if (__assScopeInfo) return Promise.resolve(__assScopeInfo);
    if (__assScopeP) return __assScopeP;
    __assScopeP = assAuthHeaders()
        .then(function (headers) {
            function nap(url, nhan) {
                return fetch(url, { headers: headers })
                    .then(function (r) {
                        if (!r.ok) throw new Error(nhan + " HTTP " + r.status);
                        return r.json();
                    })
                    .catch(function (err) {
                        // Một trong hai hỏng KHÔNG được kéo theo cái kia: mất viewAllUnits
                        // thì phạm vi hẹp lại, còn mất profile thì chỉ còn đơn vị primary —
                        // đều tốt hơn ô trống.
                        console.warn("[" + nhan + "] Load failed:", err);
                        return null;
                    });
            }
            /* Danh sách đơn vị lấy qua assLoadMe(): nó đã gọi ĐÚNG /employees/profile và có
                cache, gọi lại ở đây là bắn trùng một request cho cùng dữ liệu. Lỗi -> {} ->
                assScopeIddvList tự lùi về canBo.iddv. */
            return Promise.all([
                nap(`${urlAPI}/api/qlnv/v2/pham-vi`, "PHAM VI"),
                assLoadMe().catch(function () {
                    return null;
                }),
            ]);
        })
        .then(
            function (res) {
                var phamVi = res[0],
                    profile = { organizations: (res[1] && res[1].orgs) || [] };
                /* Giữ luôn cờ `filter.viewAllUnits` — BE bật cho tài khoản trong
                    LEADER_WHITELIST (be_qlnv/leaderWhitelist.js). assScopeRoots dùng nó để
                    nâng phạm vi lên gốc cây, xem chú thích ở đó. */
                __assScopeInfo = (phamVi && phamVi.canBo) || {};
                if (phamVi && phamVi.filter && phamVi.filter.viewAllUnits)
                    __assScopeInfo.viewAllUnits = true;
                __assScopeInfo.iddvs = assScopeIddvList(phamVi, profile);
                // /pham-vi hỏng mà profile còn sống -> vẫn có đơn vị để bám cây.
                if (__assScopeInfo.iddv == null && __assScopeInfo.iddvs.length)
                    __assScopeInfo.iddv = __assScopeInfo.iddvs[0];
                __assScopeP = null;
                return __assScopeInfo;
            },
            function (err) {
                console.warn("[PHAM VI] Load failed:", err);
                __assScopeInfo = {};
                __assScopeP = null;
                return __assScopeInfo;
            },
        );
    return __assScopeP;
}

/* Gốc phạm vi = các đơn vị của TÀI KHOẢN (profile.organizations, primary đứng đầu). */
/* ---------- TỪ ĐIỂN ĐƠN VỊ (phẳng, TOÀN HỆ THỐNG) ----------
    GET /api-nest/dashboards/org-directory — chỉ {id, name, parent_id}, KHÔNG cắt phạm vi.
    Khác hẳn user-tree/coordination-tree: hai cây kia trả lời "được CHỌN đơn vị nào", cái
    này trả lời "id này tên gì / tên này id bao nhiêu". Trước đây cả hai việc dùng chung
    /qlnv/v2/organization-structure; khi cây chọn đổi sang user-tree thì phần TRA CỨU mất
    dữ liệu với mọi đơn vị ngoài phạm vi (nhiệm vụ mình NHẬN luôn rơi vào ca này).
    Nạp lười + cache; lỗi thì trả mảng rỗng, nơi gọi tự lùi về hành vi "không tra được". */
var ASS_ORG_DIR_URL = `${window.QLNV_API_BASE || (resolveApiBase() + "/api-nest")}/dashboards/org-directory`;
var __assOrgDir = null,
    __assOrgDirP = null;
function assOrgDirectory() {
    if (!__assOrgDir && !__assOrgDirP) assLoadOrgDirectory();
    return __assOrgDir || [];
}
function assLoadOrgDirectory() {
    if (__assOrgDir) return Promise.resolve(__assOrgDir);
    if (__assOrgDirP) return __assOrgDirP;
    __assOrgDirP = fetch(ASS_ORG_DIR_URL, {
        credentials: "include",
        headers: { Accept: "application/json" },
    })
        .then(function (r) {
            if (!r.ok) throw new Error("ORG DIRECTORY HTTP " + r.status);
            return r.json();
        })
        .then(
            function (res) {
                __assOrgDir = (res && res.data) || [];
                __assOrgDirP = null;
                return __assOrgDir;
            },
            function (err) {
                console.warn("[ORG DIRECTORY] Load failed:", err);
                __assOrgDir = [];
                __assOrgDirP = null;
                return __assOrgDir;
            },
        );
    return __assOrgDirP;
}
/* ---------- CÂY ĐƠN VỊ THEO CƠ CẤU TỔ CHỨC ĐÃ SETUP ----------
    GET /api/dashboards/user-tree trả đúng các TRỤC mà tài khoản được giao (Đảng ủy /
    UBND / HĐND / MTTQ của địa bàn mình) KÈM cấp dưới của từng trục -> đây là nguồn
    DUY NHẤT của cả cây đơn vị trong form giao nhiệm vụ (xem assOrgFromUserTree).
    CÁN BỘ vẫn nạp lười theo iddv của node khi bấm ▸ (/api-nest/qlnv-directory/users).
    Trang header (header-ward/script.js) đã gọi API này và cache vào localStorage
    "userTree" -> đọc cache trước, không có mới fetch (kèm credentials để có cookie
    session của cổng IOC). */
var ASS_USER_TREE_URL = `${window.QLNV_API_BASE || (resolveApiBase() + "/api-nest")}/dashboards/user-tree`;
var __assUserTree = null,
    __assUserTreeP = null;
function assLoadUserTree() {
    if (__assUserTree) return Promise.resolve(__assUserTree);
    if (__assUserTreeP) return __assUserTreeP;
    try {
        var cached =
            window.__userTree ||
            JSON.parse(localStorage.getItem("userTree") || "null");
        if (cached && (cached.tree || cached.data)) {
            __assUserTree = cached;
            return Promise.resolve(__assUserTree);
        }
    } catch (e) { }
    __assUserTreeP = fetch(ASS_USER_TREE_URL, {
        credentials: "include",
        headers: { Accept: "application/json" },
    })
        .then(function (r) {
            if (!r.ok) throw new Error("USER TREE HTTP " + r.status);
            return r.json();
        })
        .then(
            function (res) {
                __assUserTree = res && typeof res === "object" ? res : {};
                __assUserTreeP = null;
                return __assUserTree;
            },
            function (err) {
                console.warn("[USER TREE] Load failed:", err);
                __assUserTree = {};
                __assUserTreeP = null;
                return __assUserTree;
            },
        );
    return __assUserTreeP;
}
/* Trục -> node organization-structure theo `orgId` (id_dv SỐ, trùng `id` trên cây org).
    Không tra được thì dựng node tạm từ chính bản ghi user-tree để dòng vẫn hiện và vẫn
    mở rộng xuống cán bộ được. */
/* ID ĐƠN VỊ CỦA 1 NODE user-tree. API trả HAI DẠNG node (đo 2026-08-26):
    - `key: "custom-22126"` -> `id` là id BẢN GHI CẤU HÌNH, id đơn vị nằm ở `orgId`;
    - `key: "org-1451"`     -> KHÔNG có `orgId`, chính `id` mới là id đơn vị.
    Chỉ đọc `orgId` thì dạng thứ hai ra rỗng, cây rơi về fallback dò tên địa bàn và trông
    y hệt bản cũ. `path`/`external_path` đúng cho cả hai dạng (phần tử cuối là đơn vị của
    node) nên dùng làm nguồn thứ hai. */
function assUserTreeUnitId(n) {
    if (!n) return "";
    if (n.orgId != null && n.orgId !== "") return String(n.orgId);
    var seg = String(n.external_path || "")
        .split(".")
        .concat(String(n.path || "").split("/"))
        .filter(function (s) {
            return s !== "";
        });
    if (seg.length) return String(seg[seg.length - 1]);
    if (n.id != null && String(n.key || "").indexOf("org-") === 0)
        return String(n.id);
    return "";
}
/* Trục gốc = node gốc của chính cây đã dựng từ user-tree. assOrgFromUserTree đã khử
    trùng đơn vị và giữ đúng quan hệ cha-con nên không cần lọc "bỏ node có tổ tiên trong
    danh sách" như bản cũ (hồi đó roots bị làm phẳng từ cây lồng). */
function assUserTreeRoots(org) {
    return (org && org.children && org.children[""]) || [];
}
/* Tổ tiên cao nhất của một node trong cây (guard 50 vì dữ liệu cơ cấu từng có vòng). */
function assRootAncestor(org, node) {
    var cur = node;
    for (var g = 0; cur && cur.parent != null && String(cur.parent) !== "" && g < 50; g++) {
        var p = org.byId[String(cur.parent)];
        if (!p) break;
        cur = p;
    }
    return cur;
}
/* MỌI đơn vị của tài khoản có mặt trong cây (profile.organizations, primary đứng đầu).
    CHỈ theo iddv. Bỏ đường lùi theo dashboardId: id trang là hệ id khác hẳn iddv datamart
    (xem donViMap.js), lùi về nó là cắt phạm vi vào nhầm đơn vị.
    LÃNH ĐẠO XEM TOÀN HỆ THỐNG (`filter.viewAllUnits` của /pham-vi) -> phạm vi giao việc là
    CẢ CÂY, nên gốc là node cao nhất chứ không phải đơn vị trên giấy tờ, và khi đó chỉ còn
    ĐÚNG MỘT gốc (cả cây đã bao trùm mọi đơn vị của người đó).
    Ca thật: `hoangvanbang_vptu` có iddv = 701 "Văn phòng Thành ủy" (701 < 695 < 490), nhưng
    user-tree cấp cho tài khoản này cả cây Hà Nội (3.632 đơn vị) và nhãn "người giao" hiện
    donViCap01 = "THÀNH PHỐ HÀ NỘI". Bám 701 thì ô nhận chỉ ra 7 phòng của Văn phòng, trong
    khi phải là 4 TRỤC (695 Thành ủy, 698 UBND TP, 1775 HĐND TP, 1790 MTTQ TP) — tức cấp dưới
    của 490. Leo cây thay vì hard-code 490: cùng cách này chạy đúng cho cả cây BTCTW (900000).
    Phía be_qlnv từng nâng ngầm 701 -> 490 trong userScope (NANG_PHAM_VI) nhưng đã gỡ
    2026-08-20 vì làm `?truc=` trả 403 và `?iddonvi=695` tụt xuống bảng đơn vị — nên phép nâng
    phải nằm ở FE, chỉ cho luồng giao việc. */
function assScopeRoots(org) {
    var info = __assScopeInfo || {};
    var ids =
        info.iddvs && info.iddvs.length
            ? info.iddvs
            : info.iddv != null
                ? [info.iddv]
                : [];
    var out = [],
        seen = {};
    ids.forEach(function (id) {
        var n = org && org.byId ? org.byId[String(id)] : null;
        // Đơn vị được cấp nhưng KHÔNG có trong user-tree -> bỏ, không tự dựng node: cây chọn
        // phải là quyền đã cấp (chốt 2026-09-10), thà thiếu còn hơn giao ra ngoài phạm vi.
        if (!n || seen[String(n.id)]) return;
        seen[String(n.id)] = 1;
        out.push(n);
    });
    if (!out.length) return [];
    if (info.viewAllUnits) {
        var goc = assRootAncestor(org, out[0]);
        return goc ? [goc] : [];
    }
    return out;
}
/* Đơn vị "của tôi" theo nghĩa cũ = PRIMARY. Dùng cho nhãn người giao và bộ lọc — những chỗ
    cần MỘT đơn vị, không phải danh sách. */
function assScopeRoot(org) {
    var roots = assScopeRoots(org);
    return roots.length ? roots[0] : null;
}
/* Ô "ĐƠN VỊ CHỦ TRÌ" = GIAO XUỐNG. Danh sách gốc gồm HAI phần:
    1. CHÍNH các đơn vị tài khoản đang thuộc (mở ▸ để xuống cấp dưới và tới cán bộ) — nhiều
       đơn vị vì một người có thể kiêm nhiệm, xem assScopeIddvList;
    2. các NODE GỐC KHÁC mà user-tree cấp NHƯNG nằm DƯỚI một đơn vị của tài khoản
       (assDuoiMinh, xét theo `path`).
    Phần (2) có vì user-tree trả node gốc cho cả những đơn vị ở ĐỘ SÂU KHÁC: đo trên dữ liệu
    thật, `lanhdao_viethung` được cấp 1427 UBND phường Việt Hưng KÈM 6469 "Điểm phục vụ HCC
    Việt Hưng" (thực tế là CHÁU, cha 6466). Chỉ lấy con trực tiếp của 1427 thì 6469 rơi khỏi
    ô chủ trì mà cũng không lọt ô phối hợp (nó ở độ sâu khác) -> đơn vị đã được cấp quyền lại
    không chọn được ở đâu cả.
    ⚠️ Phần (2) KHÔNG nhận đơn vị NGANG CẤP. user-tree = QUYỀN ĐÃ CẤP chứ không phải quan hệ
    trên-dưới: tài khoản kiêm Đảng ủy được cấp cả 4 trục của địa bàn (quy tắc 26/08) nên
    UBND/MTTQ/Đảng ủy phường về làm node gốc y hệt "đơn vị lẻ nhánh khác". Chúng là NGANG CẤP
    -> thuộc ô phối hợp, coordination-tree đã trả sẵn (đo prod 2026-09-30, bithu_duviethung:
    1427/2924/1640 đều có mặt kèm `axis`). Để lọt vào đây là giao ngang, sai vai.
    Đơn vị mình luôn có mặt nên ô này không bao giờ rỗng khi tra được phạm vi; cán bộ của nó
    nằm dưới chính nó (bung ▸), assCanSelfPeople do đó không còn phải nối khối phẳng nào. */
/* Node `n` có nằm DƯỚI một trong các đơn vị của tài khoản không?
    Cần vì user-tree = QUYỀN ĐÃ CẤP, không phải quan hệ trên-dưới: tài khoản kiêm Đảng ủy
    được cấp cả 4 trục của địa bàn nên UBND/MTTQ/Đảng ủy phường về làm NODE GỐC, `parent`
    null, trông y hệt "đơn vị lẻ ở nhánh khác". Hai thứ đó phải tách ra: cấp dưới thì vào ô
    giao, ngang cấp thì đã có ô phối hợp lo (coordination-tree trả sẵn 3 trục kia của cùng
    phường — đo prod 2026-09-30 với bithu_duviethung: 1427 UBND, 2924 MTTQ, 1640 Đảng ủy).
    Phân biệt bằng `path` cơ cấu: 1427 = "490.698.1310.1427" KHÔNG chứa 2164 -> ngang cấp;
    6469 "Điểm phục vụ HCC Việt Hưng" = "...1310.1427.6466.6469" CÓ chứa 1427 -> là CHÁU của
    đơn vị `lanhdao_viethung`, vẫn phải giao được (đây là ca phần (2) sinh ra để cứu).
    KHÔNG có `path` -> trả true: chỉ loại khi CHỨNG MINH được là ngang cấp, để môi trường nào
    user-tree thiếu trường đó vẫn giữ nguyên hành vi cũ thay vì ô giao đột ngột rỗng. */
function assDuoiMinh(n, laMinh) {
    if (!n) return false;
    if (!n.path) return true;
    return assPathSegs(n).some(function (seg) {
        return laMinh[seg] && String(seg) !== String(n.id);
    });
}
/* Các mã trên đường dẫn cơ cấu: "490.698.1310.1427" và "/490/698/1310/1427/" cùng ra
    ["490","698","1310","1427"]. */
function assPathSegs(n) {
    return String((n && n.path) || "")
        .split(/[./]/)
        .filter(Boolean);
}
/* Mã TRỤC của một đơn vị = phần tử thứ 2 của path (ngay dưới 490 Thành phố Hà Nội):
    695 Thành ủy · 1775 HĐND Thành phố · 698 UBND Thành phố · 1790 MTTQ Thành phố.
    Dùng path chứ không dùng `iddv_captren` (1558/2041/1310/2801, chỉ đúng cấp xã/phường)
    để cùng một phép nhận trục chạy được ở mọi cấp. */
var ASS_TRUC_DANG = "695";
function assTrucCua(n) {
    var segs = assPathSegs(n);
    return segs.length > 1 ? segs[1] : null;
}
/* NGOẠI LỆ ĐẢNG ỦY (quy tắc nghiệp vụ 26/08): Đảng ủy giao được cho CẢ 4 TRỤC của địa bàn,
    các trục khác chỉ giao trong trục mình và chỉ xuống. Nên khi tài khoản có một đơn vị
    thuộc trục Đảng, các đơn vị NGANG CẤP mà user-tree đã cấp vẫn được vào ô giao.
    Hai chốt chặn để ngoại lệ này không thành "giao đi đâu cũng được":
      - phải là đơn vị user-tree ĐÃ CẤP (hàm chỉ được gọi cho node gốc của cây đó), mà
        user-tree cấp theo địa bàn -> không với sang phường khác;
      - phải CÙNG ĐỘ SÂU với chính đơn vị Đảng ủy đó (đo thật: 1640/2164/1427/2924 đều depth
        4) -> không nhấc node ở cấp khác lên, và không có path thì không tính là thỏa. */
function assDangGiaoDuoc(n, roots) {
    if (!n || !n.path) return false;
    var d = assPathSegs(n).length;
    return (roots || []).some(function (r) {
        return (
            r &&
            r.path &&
            assTrucCua(r) === ASS_TRUC_DANG &&
            assPathSegs(r).length === d
        );
    });
}
function assLeadRoots(org) {
    var roots = assScopeRoots(org);
    var treeRoots = assUserTreeRoots(org);
    // Không tra được đơn vị nào của mình trong cây -> hiện cả cây, không thì ô chết cứng.
    if (!roots.length) return treeRoots;
    var out = [],
        seen = {},
        laMinh = {},
        toTien = {};
    roots.forEach(function (r) {
        laMinh[String(r.id)] = 1;
    });
    /* TỔ TIÊN của mình KHÔNG được vào ô chủ trì: giao là giao XUỐNG. Cây user-tree của
        tài khoản được cấp rộng (vd VPTU được cả cây Hà Nội) có node gốc là 490 — cấp trên
        của 701 — nếu không lọc thì hiện ra và giao ngược lên trên. Tính tổ tiên cho TỪNG
        đơn vị của tài khoản (guard 50 vì dữ liệu cơ cấu từng có vòng). */
    roots.forEach(function (r) {
        for (
            var cur = r, g = 0;
            cur && cur.parent != null && String(cur.parent) !== "" && g < 50;
            g++
        ) {
            toTien[String(cur.parent)] = 1;
            cur = org.byId[String(cur.parent)];
            if (!cur) break;
        }
    });
    /* GỐC = chính các đơn vị của tài khoản, theo thứ tự primary trước. KHÔNG phải cấp dưới
        của chúng: cấp dưới nằm sẵn trong `org.children` nên bung ▸ là thấy, mà để đơn vị
        mình làm gốc thì cây đọc đúng như cơ cấu thật, và cán bộ của đơn vị mình về đúng chỗ
        (dưới đơn vị của họ) thay vì phải đắp thêm một khối phẳng ngoài cây.
        "Không giao cho chính mình" là chuyện ở tầng NGƯỜI — assLocChinhMinh loại người đang
        đăng nhập khỏi danh sách cán bộ — chứ không phải ở tầng ĐƠN VỊ. Trước 2026-09-30 chỗ
        này loại luôn đơn vị mình (commit 657c430a), gộp nhầm việc chặn GIAO NGANG vào đó;
        giao ngang nay đã có phép lọc riêng và đúng hơn là assDuoiMinh. */
    roots.forEach(function (r) {
        var k = String(r.id);
        if (seen[k]) return;
        seen[k] = 1;
        out.push(r);
    });
    treeRoots.forEach(function (n) {
        // Bỏ tổ tiên (giao ngược lên trên) và node đã có.
        if (!n || seen[String(n.id)] || toTien[String(n.id)]) return;
        /* Node đã có CHA trong cây thì bung ▸ từ cha là thấy -> thêm vào gốc là hiện TRÙNG
            hai lần. Chỉ node thật sự không có cha mới cần nhấc lên (ca 6469). */
        if (n.parent != null && String(n.parent) !== "") return;
        /* Bỏ NGANG CẤP: giao là giao XUỐNG, ngang cấp thuộc ô phối hợp — TRỪ tài khoản có
            vai Đảng ủy, vốn giao được cả 4 trục của địa bàn. */
        if (!assDuoiMinh(n, laMinh) && !assDangGiaoDuoc(n, roots)) return;
        seen[String(n.id)] = 1;
        out.push(n);
    });
    return out;
}
/* ---------- ĐƠN VỊ PHỐI HỢP (NGANG CẤP) ----------
    GET /api-nest/dashboards/coordination-tree của be_ioc_dash — CÙNG bảng `organizations`
    với user-tree, nhưng BE đã cắt sẵn danh sách ngang cấp (xem getCoordinationTree).
    Vì sao không dùng chung user-tree: cây user-tree bắt đầu ngay TẠI trục của tài khoản
    nên không có node cha lẫn anh em của cha, trong khi phối hợp là quan hệ NGANG HÀNG,
    phải nhìn RA NGOÀI phạm vi (UBND xã A phối hợp với UBND xã B). Trước đây FE lấy cây
    toàn hệ thống của be_qlnv (/qlnv/v2/organization-structure) rồi tự cắt theo độ sâu;
    nay logic đó nằm ở BE, FE chỉ vẽ.
    Trả về cùng hình dạng node với user-tree nên dựng cây bằng đúng assOrgFromUserTree. */
var ASS_COORD_TREE_URL = `${window.QLNV_API_BASE || (resolveApiBase() + "/api-nest")}/dashboards/coordination-tree`;
var __assCoordOrg = null,
    __assCoordOrgP = null;
function assLoadCoordOrg() {
    if (__assCoordOrg) return Promise.resolve(__assCoordOrg);
    if (__assCoordOrgP) return __assCoordOrgP;
    __assCoordOrgP = fetch(ASS_COORD_TREE_URL, {
        credentials: "include",
        headers: { Accept: "application/json" },
    })
        .then(function (r) {
            if (!r.ok) throw new Error("COORD TREE HTTP " + r.status);
            return r.json();
        })
        .then(
            function (res) {
                __assCoordOrg = assOrgFromUserTree(res);
                __assCoordOrgP = null;
                return __assCoordOrg;
            },
            function (err) {
                // Lỗi -> ô phối hợp trống. KHÔNG lùi về cây chủ trì: nó là CẤP DƯỚI, chọn
                // vào là ghi sai vai (cấp dưới thành đơn vị phối hợp ngang hàng).
                console.warn("[COORD TREE] Load failed:", err);
                __assCoordOrg = { nodes: [], byId: {}, children: {} };
                __assCoordOrgP = null;
                return __assCoordOrg;
            },
        );
    return __assCoordOrgP;
}
/* Ghép một đơn vị của org-directory (phẳng: {id, name, parent_id}) vào cây phối hợp, KÈM
    cả nhánh dưới nó — assTreeHtml chỉ tra `children` trên đúng cây được truyền vào, không
    ghép nhánh thì bấm ▸ mở ra rỗng.
    CHỈ ghép key CHƯA có: dữ liệu BE trả về là nguồn đúng hơn (có `dashboardId`), đè lên là
    mất. `seen` chặn vòng — cơ cấu tổ chức từng có bản ghi tự tham chiếu. */
function assCoordMergeDirNode(coordOrg, conDir, o, parentId, seen) {
    var k = String(o.id);
    if (seen[k]) return coordOrg.byId[k] || null;
    seen[k] = 1;
    var node = coordOrg.byId[k];
    if (!node) {
        node = {
            id: isNaN(Number(o.id)) ? o.id : Number(o.id),
            name: o.name || k,
            parent: parentId,
            dashboardId: null,
        };
        coordOrg.byId[k] = node;
        coordOrg.nodes.push(node);
    }
    if (!coordOrg.children[k]) {
        coordOrg.children[k] = (conDir[k] || [])
            .map(function (c) {
                return assCoordMergeDirNode(coordOrg, conDir, c, k, seen);
            })
            .filter(Boolean);
    }
    return node;
}
/* ĐƠN VỊ NGANG CẤP CỦA CÁC ĐƠN VỊ NGOÀI PRIMARY.
    coordination-tree chỉ nhận userId và BE cắt theo ĐÚNG MỘT đơn vị (getCoordinationTree
    lấy `userOrgs.map(...).find(...)`), nên đơn vị kiêm nhiệm thứ hai không có ai ngang cấp
    trong đó. Tính tại FE từ /dashboards/org-directory (phẳng, TOÀN hệ thống) theo đúng ba
    luật của pickCoordinationPeers bên be_ioc_dash:
      - ngang cấp = CÙNG ĐỘ SÂU, KHÔNG phải cùng cha (cơ cấu gom theo KHỐI: UBND xã nằm dưới
        "Xã, Phường", HĐND xã nằm dưới "HĐND Xã, Phường" -> hai đơn vị thật sự ngang cấp lại
        khác cha nhau);
      - chỉ quét TRONG CÂY GỐC của chính đơn vị đó (bảng có 2 gốc: 490 Thành phố Hà Nội và
        900000 Ban Tổ chức Trung ương). Quét cả hai thì đơn vị TW lọt vào danh sách phối hợp
        mà be_qlnv `giaiMaDonVi()` không tra được -> chặn hẳn việc phát hành nhiệm vụ;
      - đơn vị là GỐC (depth 0) -> không có ai ngang cấp, trả CẤP DƯỚI TRỰC TIẾP để ô không
        chết cứng.
    Directory chưa nạp xong (nạp lười, lỗi thì rỗng) -> bỏ qua phần này, ô vẫn có peers của
    đơn vị primary từ BE. */
function assCoordOtherRoots(coordOrg) {
    var info = __assScopeInfo || {};
    var ids = (info.iddvs || []).slice(1);
    if (!ids.length || !coordOrg || !coordOrg.byId) return [];
    var dir =
        (typeof assOrgDirectory === "function" && assOrgDirectory()) || [];
    if (!dir.length) return [];
    var byId = {},
        conDir = {};
    dir.forEach(function (o) {
        if (o && o.id != null) byId[String(o.id)] = o;
    });
    dir.forEach(function (o) {
        if (!o || o.id == null) return;
        // parent_id trỏ tới đơn vị đã ngừng hoạt động -> coi như gốc, nếu không cả nhánh
        // biến mất khỏi cây (đúng cách BE làm).
        var cha =
            o.parent_id != null && byId[String(o.parent_id)]
                ? String(o.parent_id)
                : "";
        (conDir[cha] = conDir[cha] || []).push(o);
    });
    // Độ sâu + gốc cây, tính MỘT lần cho cả directory (3.6k đơn vị: tính lại theo từng
    // node trong vòng lặp là O(n²) ngay trên luồng vẽ).
    var meta = {};
    function doSau(o) {
        var k = String(o.id);
        if (meta[k]) return meta[k];
        var cur = o,
            d = 0;
        for (
            var g = 0;
            cur && cur.parent_id != null && byId[String(cur.parent_id)] && g < 50;
            g++
        ) {
            cur = byId[String(cur.parent_id)];
            d++;
        }
        meta[k] = { depth: d, root: cur };
        return meta[k];
    }
    dir.forEach(doSau);
    var out = [],
        seen = {},
        merged = {};
    // Không ai trong số đơn vị của CHÍNH MÌNH được vào ô phối hợp.
    (info.iddvs || []).forEach(function (id) {
        seen[String(id)] = 1;
    });
    if (info.iddv != null) seen[String(info.iddv)] = 1;
    /* Node BE đã trả ở MỨC GỐC thì thôi (đã hiện rồi). Nhưng node BE trả ở SÂU trong nhánh
        thì vẫn phải nâng lên gốc: coordination-tree trả peers KÈM cả nhánh dưới, nên một
        đơn vị ngang cấp của đơn vị kiêm nhiệm hoàn toàn có thể đang nằm làm CON của một
        peer thuộc trục khác — bỏ qua theo `coordOrg.byId` là nó mất hẳn khỏi ô, người dùng
        phải mò mở ▸ đúng nhánh của trục khác mới thấy. Chấp nhận nó hiện ở hai chỗ (gốc +
        trong nhánh) còn hơn không chọn được. */
    var laGoc = {};
    (coordOrg.children[""] || []).forEach(function (n) {
        if (n && n.id != null) laGoc[String(n.id)] = 1;
    });
    ids.forEach(function (id) {
        var self = byId[String(id)];
        if (!self) return;
        var m = meta[String(self.id)];
        var peers =
            m.depth === 0
                ? conDir[String(self.id)] || []
                : dir.filter(function (o) {
                    if (String(o.id) === String(self.id)) return false;
                    var t = meta[String(o.id)];
                    return (
                        t.depth === m.depth &&
                        t.root &&
                        m.root &&
                        String(t.root.id) === String(m.root.id)
                    );
                });
        peers.forEach(function (p) {
            var k = String(p.id);
            if (seen[k] || laGoc[k]) return;
            seen[k] = 1;
            /* Đã có trong cây (ở sâu) -> dùng lại ĐÚNG node đó, đừng dựng node mới: bản của
                BE có `dashboardId` và nhánh con đúng, dựng đè là mất. */
            var node = coordOrg.byId[k]
                ? coordOrg.byId[k]
                : assCoordMergeDirNode(coordOrg, conDir, p, null, merged);
            if (node) out.push(node);
        });
    });
    return out;
}
/* BE đã cắt đúng độ sâu -> gốc của cây trả về CHÍNH LÀ danh sách phối hợp của đơn vị
    PRIMARY; cấp dưới của chúng vẫn mở được bằng ▸.
    NHƯNG BE chỉ loại ĐÚNG MỘT đơn vị (`self.id` = primary), nó không biết người này còn
    đơn vị nào khác — mà các đơn vị kiêm nhiệm RẤT HAY ngang hàng nhau: đo trên dữ liệu thật
    2026-09-30, `bithu_duviethung` có 2164 HĐND phường Việt Hưng (/490/1775/2041/2164) và
    1640 Đảng ủy phường Việt Hưng (/490/695/1558/1640) — CÙNG depth 3, cùng cây gốc 490, nên
    1640 nằm ngay trong 598 peers mà BE trả về cho 2164. Không lọc thì ô phối hợp hiện CHÍNH
    ĐƠN VỊ CỦA MÌNH, chọn vào là nhiệm vụ tự phối hợp với chính mình.
    Cũng vì cùng độ sâu nên assCoordOtherRoots thường không thêm gì (trùng, đã khử) — nó chỉ
    thật sự có việc khi hai đơn vị LỆCH độ sâu, vd kiêm nhiệm dọc (xã + một phòng của nó). */
function assCoordRoots(coordOrg) {
    var info = __assScopeInfo || {};
    var laMinh = {};
    (info.iddvs || []).forEach(function (id) {
        laMinh[String(id)] = 1;
    });
    if (info.iddv != null) laMinh[String(info.iddv)] = 1;
    var roots = assUserTreeRoots(coordOrg).filter(function (n) {
        return !(n && laMinh[String(n.id)]);
    });
    return roots.concat(assCoordOtherRoots(coordOrg));
}


/* CÁN BỘ CỦA CHÍNH ĐƠN VỊ ĐĂNG NHẬP ở ô "đơn vị nhận": giao xuống không chỉ là đơn vị
    con — còn giao được cho cán bộ ngang cấp trong đơn vị mình (và đây là lựa chọn DUY
    NHẤT với tài khoản không có đơn vị cấp dưới). Để PHẲNG ở CUỐI danh sách, sau các đơn
    vị con, chứ không bọc trong một node đơn vị phải bấm ▸ mới thấy. */
/* Có nên nối thêm khối "Cán bộ <đơn vị mình>" phẳng ở cuối cây không? CHỈ khi đơn vị đó
    KHÔNG có mặt trong cây — mà từ khi ô chủ trì chỉ liệt kê CẤP DƯỚI (assLeadRoots) thì
    gần như luôn đúng, nên khối này là lối giao cho cán bộ trong chính đơn vị mình (và là
    lựa chọn DUY NHẤT với đơn vị lá). Nếu đơn vị mình có mặt trong cây thì mở ▸ đã thấy
    cán bộ của nó (assLoadUnitPeople) -> thêm khối phẳng nữa là hiện TRÙNG hai lần. */
function assCanSelfPeople(roots, selfRoot) {
    if (!selfRoot || selfRoot.id == null) return false;
    return !(roots || []).some(function (n) {
        return n && String(n.id) === String(selfRoot.id);
    });
}
function assRenderSelfPeople(box, root) {
    if (!box || !root || root.id == null) return;
    var label = root.name || root.tenVietTat || String(root.id);
    var wrap = document.createElement("div");
    wrap.dataset.selfPeople = "1";
    box.appendChild(wrap);
    assLoadPeople(root.id, true).then(function (people) {
        /* Rỗng thì PHẢI nói rõ, đừng im lặng: đơn vị lá (vd 6403 "Bộ phận Dự án") không có
            cấp dưới nên cán bộ là lựa chọn DUY NHẤT — trả về rỗng mà không báo gì thì ô chỉ
            còn dòng "không có đơn vị", người dùng tưởng mất quyền chứ không biết danh bạ hỏng. */
        if (!people.length) {
            var phEmpty = box.querySelector(".ass-empty");
            if (phEmpty) phEmpty.remove();
            wrap.innerHTML =
                `<div style="color:#8ab0c8;font-size:12.5px">Đơn vị <b>${assEsc(label)}</b> không có đơn vị cấp dưới, và chưa lấy được danh bạ cán bộ của đơn vị này.</div>`;
            return;
        }
        // Có cán bộ để chọn thì bỏ dòng "không có đơn vị cấp dưới" cho đỡ rối.
        var ph = box.querySelector(".ass-empty");
        if (ph) ph.remove();
        wrap.innerHTML =
            `<div style="margin:8px 0 2px;color:#8ab0c8;font-size:11.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase">Cán bộ ${assEsc(label)}</div>` +
            assPeopleRowsHtml(people, root.id, label, false, 0);
    });
}

/* ---------- Cây chọn đơn vị (dùng chung cho ô nhận và ô phối hợp) ----------
   Dùng ĐÚNG bộ class của bản chuẩn qlnv_v2 (.qlnv-tree-row/-arrow/-name) để giao diện
   giống hệt app QLNV, thay vì tự đặt style inline. */
function assTreeHtml(org, nodes, mode, depth) {
    return (nodes || [])
        .map(function (n) {
            var kids = org.children[String(n.id)] || [];
            var label = n.name || n.tenVietTat || String(n.id);
            /* CHỈ ô "đơn vị phối hợp" (chọn nhiều) mới có ô tích vuông .qlnv-box. Ô "đơn vị
               chủ trì" chọn 1 đơn vị -> giữ nguyên như cũ: không ô tích, chọn rồi thì tô đậm
               dòng bằng class .on. */
            var input =
                mode === "lead"
                    ? `<input type="radio" name="assLeadUnit" class="assLead" value="${assEsc(n.id)}" data-label="${assEsc(label)}" onchange="assOnLeadPick(this)" />`
                    : `<input type="checkbox" class="assCoord" value="${assEsc(n.id)}" data-label="${assEsc(label)}" onchange="__qlnvSyncCoord(this)" /><span class="qlnv-box"></span>`;
            /* MỌI đơn vị đều có mũi tên ▸ ở ô "đơn vị nhận": ngoài đơn vị con còn có CÁN BỘ
               trong đơn vị (nạp lười từ /qlnv/v2/can-bo khi bấm mở), giống cây của qlnv_v2. */
            // Ô "phối hợp" cũng phải xuống tới CÁN BỘ -> mọi node đều mở rộng được.
            var expandable = kids.length || mode === "lead" || mode === "coord";
            var arrow = expandable
                ? `<button type="button" class="qlnv-tree-arrow" onclick="assToggleNode(this)" title="Mở rộng">▸</button>`
                : `<span class="qlnv-tree-arrow"></span>`;
            return `<div class="ass-node" data-key="${assEsc(assSearchKey(label))}" data-unit-id="${assEsc(n.id)}" data-unit-label="${assEsc(label)}" data-depth="${depth}">
        <div class="qlnv-tree-row" style="padding-left:${depth * 14}px">
          ${arrow}
          <label class="qlnv-tree-name">${input}<span>${assEsc(label)}</span></label>
        </div>
        ${expandable ? `<div class="ass-kids qlnv-tree-children" style="display:none">${kids.length ? assTreeHtml(org, kids, mode, depth + 1) : ""}</div>` : ""}
      </div>`;
        })
        .join("");
}
function assToggleNode(el) {
    var node = el.closest(".ass-node");
    var box = node && node.querySelector(".ass-kids");
    if (!box) return;
    var open = box.style.display !== "none";
    box.style.display = open ? "none" : "block";
    el.textContent = open ? "▸" : "▾";
    el.title = open ? "Mở rộng" : "Thu gọn";
    // Mở lần đầu ở cây "đơn vị nhận" HOẶC "đơn vị phối hợp" -> nạp cán bộ của đơn vị đó.
    if (
        !open &&
        !node.dataset.peopleLoaded &&
        (node.closest("#assUnitBox") || node.closest("#assCoordBox"))
    )
        assLoadUnitPeople(node);
}

/* ---------- CÁN BỘ THEO ĐƠN VỊ ----------
   /api-nest/qlnv-directory/users?iddv=<id SỐ của organization-structure> — nạp lười theo
   từng đơn vị và nhớ kết quả.
   ⚠️ PHẢI có includeChildren=true (đo 2026-08-10): cán bộ nằm ở đơn vị LÁ (vd iddv 12397
   "Ban Khoa học Công nghệ và Môi trường"), nên hỏi đơn vị CHA mà thiếu cờ này thì data
   luôn rỗng.
   NGUỒN (đổi 2026-09-10): quan hệ user_organizations bên be_ioc_dash, KHÔNG còn là
   dm_user của datamart Bkav; gọi THẲNG be_ioc_dash chứ không đi vòng qua be_qlnv nữa
   (lý do ở khối ngay dưới).
   Cán bộ chưa map được sang canbo_id của datamart trả về kèm `selectable:false`: vẫn
   hiện tên nhưng không chọn được, vì gửi lên luồng tạo nhiệm vụ sẽ bị từ chối. */
/* Gọi THẲNG be_ioc_dash (đổi 2026-09-10). Trước đây đi vòng qua be_qlnv
    `/qlnv/v2/can-bo-ioc`, mà route đó chỉ chuyển tiếp ngược lại be_ioc_dash qua biến môi
    trường `IOC_DASH_BASE_URL` (mặc định http://127.0.0.1:3000/api) — môi trường nào không
    đặt biến đó thì hỏng cả ô chọn cán bộ: đo trên prod 2026-09-10 trả
    "Không kết nối được danh bạ IOC: connect ECONNREFUSED 127.0.0.1:3000", data rỗng, nên
    đơn vị KHÔNG có cấp dưới (vd 6403 "Bộ phận Dự án") thì ô chủ trì trắng trơn.
    Cùng nguồn `organizations`/user_organizations với user-tree, cùng đi bằng cookie session
    của cổng IOC nên phải có credentials:'include'. Response `{status, data}` giữ nguyên
    shape (canboId/hoTen/account/selectable) nên phần dựng HTML không phải đổi. */
var ASS_CANBO_URL = `${resolveApiBase()}/api-nest/qlnv-directory/users`;
var __assPeople = {};
/* selfOnly = chỉ cán bộ ĐỨNG TRONG đơn vị đó (không gộp cấp dưới) — dùng cho node
    "đơn vị của mình", nếu không cán bộ của các đơn vị con sẽ bị liệt kê trùng. */
/* KHÔNG GIAO CHO CHÍNH MÌNH — quy tắc này ở tầng NGƯỜI, không phải tầng đơn vị: đơn vị của
    tài khoản vẫn hiện trong cây và vẫn giao xuống được, chỉ riêng bản thân người đang đăng
    nhập thì không tự giao cho mình (và cũng không tự phối hợp với mình).
    So bằng `account` ↔ `username` của /employees/profile là chính, `canboId` ↔ `_id` là
    đường phụ. Chưa nạp xong hồ sơ -> không lọc ai: thà hiện dư một dòng còn hơn giấu nhầm
    người khác, và lọc ở chỗ ĐỌC chứ không lúc ghi cache để cache không đóng băng kết quả
    lọc từ lúc hồ sơ còn rỗng. */
function assLaChinhMinh(p) {
    if (!p) return false;
    var me = __assMe || {};
    var acc = String(p.account || "").trim().toLowerCase();
    var un = String(me.username || "").trim().toLowerCase();
    if (acc && un && acc === un) return true;
    var cid = p.canboId != null ? String(p.canboId) : "";
    var mid = me._id != null ? String(me._id) : "";
    return !!(cid && mid && cid === mid);
}
function assLocChinhMinh(list) {
    return (list || []).filter(function (p) {
        return !assLaChinhMinh(p);
    });
}
function assLoadPeople(unitId, selfOnly) {
    var key = String(unitId) + (selfOnly ? ":self" : "");
    if (__assPeople[key]) return Promise.resolve(assLocChinhMinh(__assPeople[key]));
    return fetch(
        ASS_CANBO_URL +
        "?iddv=" +
        encodeURIComponent(String(unitId)) +
        (selfOnly ? "" : "&includeChildren=true") +
        "&limit=200",
        { credentials: "include", headers: { Accept: "application/json" } },
    )
        .then(function (r) {
            if (!r.ok) throw new Error("CAN BO HTTP " + r.status);
            return r.json();
        })
        .then(
            function (res) {
                __assPeople[key] = (res && res.data) || [];
                return assLocChinhMinh(__assPeople[key]);
            },
            function (err) {
                console.warn("[CAN BO] Load failed:", err);
                __assPeople[key] = [];
                return __assPeople[key];
            },
        );
}
function assLoadUnitPeople(node) {
    node.dataset.peopleLoaded = "1";
    var box = node.querySelector(".ass-kids");
    var unitId = node.dataset.unitId;
    var unitLabel = node.dataset.unitLabel || "";
    var depth = Number(node.dataset.depth || 0) + 1;
    var loading = document.createElement("div");
    loading.className = "ass-people-loading";
    loading.style.cssText =
        "padding:6px 8px 6px " + depth * 14 + "px;color:#8ab0c8;font-size:12.5px";
    loading.textContent = "Đang tải cán bộ…";
    box.appendChild(loading);
    // Cây "phối hợp" chọn NHIỀU -> cán bộ là ô tích; cây "nhận" chọn 1 -> vẫn là nút bấm.
    var isCoord = !!node.closest("#assCoordBox");
    /* Mở 1 đơn vị = thấy CÁN BỘ CỦA CHÍNH NÓ, còn cấp dưới vẫn là các node đơn vị con
        (mở tiếp để thấy cán bộ của từng đơn vị con). Nếu không sẽ đổ phẳng cán bộ của cả
        nhánh vào node cha, vừa trùng vừa mất ngữ cảnh đơn vị.
        Đơn vị LÁ trong cây mà hỏi riêng không ra ai -> lùi về includeChildren=true, vì cây
        BE gom theo khối nên có nhánh không hiện đủ đơn vị con. */
    var hasKidUnits = !!box.querySelector(".ass-node");
    assLoadPeople(unitId, true)
        .then(function (people) {
            if (people.length || hasKidUnits) return people;
            return assLoadPeople(unitId, false);
        })
        .then(function (people) {
            loading.remove();
            if (!people.length) return; // Đơn vị chưa có dữ liệu cán bộ -> chỉ giao cho đơn vị.
            box.insertAdjacentHTML(
                "beforeend",
                assPeopleRowsHtml(people, unitId, unitLabel, isCoord, depth),
            );
        });
}

/* Dòng chọn cán bộ, dùng chung cho cây đơn vị và danh sách cán bộ đơn vị mình. */
function assPeopleRowsHtml(people, unitId, unitLabel, isCoord, depth) {
    return people
        .map(function (p) {
            var name = p.hoTen || p.account || String(p.canboId || "");
            var chuc = p.chucDanh || p.chucVu || "";
            /* Nguồn IOC trả cả người CHƯA map được sang canbo_id của datamart
               (selectable:false). Hiện mờ + không cho chọn: gửi lên tạo nhiệm vụ
               sẽ bị từ chối, thà nói rõ "có người này mà chưa dùng được" còn hơn
               giấu đi để người dùng đi tìm. */
            if (p.selectable === false) {
                return `<div class="ass-node ass-person" data-key="${assEsc(assSearchKey(name + " " + (p.account || "")))}">
              <div class="qlnv-tree-row" style="padding-left:${depth * 14}px;opacity:.55">
                <span class="qlnv-tree-arrow"></span>
                <span class="qlnv-tree-name" title="Chưa có trong danh mục nhân sự nên chưa giao việc được">
                  <span>${assEsc(name)}${chuc ? ` <small style="color:#8ab0c8">· ${assEsc(chuc)}</small>` : ""}</span>
                </span>
              </div>
            </div>`;
            }
            var row = isCoord
                ? /* PHỐI HỢP: id gửi lên BE vẫn là ĐƠN VỊ (donViThucHien là mảng id đơn vị),
                 tên cán bộ chỉ đi kèm ở donViPhoiHopName -> tick người = tick đơn vị của
                 người đó + ghi rõ tên người. */
                `<label class="qlnv-tree-name"><input type="checkbox" class="assCoordPerson"
                  value="${assEsc(p.canboId || name)}" data-unit-id="${assEsc(unitId)}"
                  data-unit-label="${assEsc(unitLabel)}" data-person-name="${assEsc(name)}"
                  data-label="${assEsc(name + " · " + unitLabel)}"
                  onchange="__qlnvSyncCoord(this)" /><span class="qlnv-box"></span>
                <span>${assEsc(name)}${chuc ? ` <small style="color:#8ab0c8">· ${assEsc(chuc)}</small>` : ""}</span></label>`
                : `<button type="button" class="qlnv-tree-name" onclick="assPickPerson(this)"
                data-person-id="${assEsc(p.canboId || "")}" data-person-name="${assEsc(name)}"
                data-unit-id="${assEsc(unitId)}" data-unit-label="${assEsc(unitLabel)}">
                <span>${assEsc(name)}${chuc ? ` <small style="color:#8ab0c8">· ${assEsc(chuc)}</small>` : ""}</span>
              </button>`;
            return `<div class="ass-node ass-person" data-key="${assEsc(assSearchKey(name + " " + (p.account || "")))}">
            <div class="qlnv-tree-row" style="padding-left:${depth * 14}px">
              <span class="qlnv-tree-arrow"></span>
              ${row}
            </div>
          </div>`;
        })
        .join("");
}
/* Chọn NGƯỜI = chọn luôn đơn vị của người đó; id người gửi lên ở lanhDaoChiDaoId
   (giống bản chuẩn qlnv_v2 — BE chưa có trường "người nhận" riêng). */
/* GHI LỰA CHỌN "đơn vị/người chủ trì" LÊN CHÍNH DOM CỦA FORM.
   Trước đây chỉ giữ ở `window.__assLeadUnit`; form bị vẽ lại (nạp xong danh mục CRM,
   quay về từ màn chọn văn bản/kịch bản...) là biến global bị đặt null -> bấm "Phát hành"
   báo "Chưa chọn đơn vị nhận nhiệm vụ" dù ô vẫn hiện tên đơn vị/người. Ghi kèm lên
   #assUnitTriggerText thì trạng thái sống đúng bằng vòng đời của form. */
function assStampLead(unit, person) {
    var t = assFormEl("assUnitTriggerText");
    if (!t) return;
    if (unit && unit.id) {
        t.dataset.unitId = String(unit.id);
        t.dataset.unitLabel = String(unit.label == null ? "" : unit.label);
    } else {
        delete t.dataset.unitId;
        delete t.dataset.unitLabel;
    }
    if (person && (person.id || person.name)) {
        t.dataset.personId = String(person.id == null ? "" : person.id);
        t.dataset.personName = String(person.name == null ? "" : person.name);
    } else {
        delete t.dataset.personId;
        delete t.dataset.personName;
    }
}
/* Đọc lại lựa chọn theo thứ tự tin cậy: biến global -> dấu vết trên DOM -> radio đang
   tick. Dùng cho cả lúc submit lẫn lúc dựng lại form. */
/* Tra lại nhiệm vụ cha từ dấu vết trên #modalBody (dùng khi window.__assParent bị xóa
   bởi một lần vẽ lại form). Trả null nếu form đang là nhiệm vụ chính. */
function assRecallParent() {
    var root = document.getElementById("modalBody");
    var id = root && root.dataset ? root.dataset.assParentId : "";
    if (!id) return null;
    return (window.__assParentById || {})[String(id)] || { id: id };
}
function assResolveLead() {
    if (window.__assLeadUnit && window.__assLeadUnit.id)
        return window.__assLeadUnit;
    var t = assFormEl("assUnitTriggerText");
    if (t && t.dataset && t.dataset.unitId) {
        window.__assLeadUnit = {
            id: t.dataset.unitId,
            label: t.dataset.unitLabel || t.dataset.unitId,
        };
        if (t.dataset.personName)
            window.__assLeadPerson = {
                id: t.dataset.personId || "",
                name: t.dataset.personName,
            };
        return window.__assLeadUnit;
    }
    var checked = assFormRoot().querySelector(".assLead:checked");
    if (checked) {
        window.__assLeadUnit = {
            id: checked.value,
            label: checked.getAttribute("data-label") || String(checked.value),
        };
        return window.__assLeadUnit;
    }
    return null;
}
function assPickPerson(btn) {
    window.__assLeadUnit = {
        id: btn.getAttribute("data-unit-id"),
        label: btn.getAttribute("data-unit-label"),
    };
    window.__assLeadPerson = {
        id: btn.getAttribute("data-person-id"),
        name: btn.getAttribute("data-person-name"),
    };
    assStampLead(window.__assLeadUnit, window.__assLeadPerson);
    document.querySelectorAll(".assLead").forEach(function (r) {
        r.checked = false;
        var lb = r.closest(".qlnv-tree-name");
        if (lb) lb.classList.remove("on");
    });
    document
        .querySelectorAll("#assUnitBox .ass-person .qlnv-tree-name")
        .forEach(function (b) {
            b.classList.toggle("on", b === btn);
        });
    var t = assFormEl("assUnitTriggerText");
    if (t) {
        /* Cán bộ CÙNG đơn vị đang đăng nhập -> chỉ hiện tên, khỏi kèm "· <đơn vị>" thừa. */
        var selfNode = !!btn.closest('[data-self-people="1"]');
        t.textContent = selfNode
            ? window.__assLeadPerson.name
            : window.__assLeadPerson.name + " · " + window.__assLeadUnit.label;
        t.classList.remove("ms-placeholder");
    }
    assToggleDropdown("assUnitDropdown");
}
/* Tìm kiếm: node khớp thì hiện, đồng thời mở toàn bộ tổ tiên của nó. */
function assFilterTree(inputId, boxId) {
    var q = assSearchKey(document.getElementById(inputId).value || "");
    var box = document.getElementById(boxId);
    if (!box) return;
    var nodes = box.querySelectorAll(".ass-node");
    if (!q) {
        nodes.forEach(function (n) {
            n.style.display = "";
            var kids = n.querySelector(".ass-kids");
            if (kids && kids.parentElement === n) kids.style.display = "none";
        });
        return;
    }
    nodes.forEach(function (n) {
        n.style.display = "none";
    });
    nodes.forEach(function (n) {
        if ((n.getAttribute("data-key") || "").indexOf(q) < 0) return;
        n.style.display = "";
        var p = n.parentElement;
        while (p && p !== box) {
            if (p.classList && p.classList.contains("ass-kids"))
                p.style.display = "block";
            if (p.classList && p.classList.contains("ass-node")) p.style.display = "";
            p = p.parentElement;
        }
    });
}
/* Mũi tên xổ xuống — copy từ qlnvChevronHtml của bản chuẩn (ăn theo màu chữ của ô). */
function assChevronHtml() {
    return '<svg class="ms-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8.25 9.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function assToggleDropdown(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var willOpen = !el.classList.contains("open");
    // Đóng MỌI dropdown đang mở trong form (cây đơn vị + các ô chọn tự vẽ),
    // tránh 2 danh sách chồng lên nhau.
    document.querySelectorAll(".ms-dropdown.open").forEach(function (o) {
        o.classList.remove("open");
        var pWrap = o.closest(".ms-wrap, .field");
        if (pWrap) pWrap.style.zIndex = "";
        var pCard = o.closest(".detail-card");
        if (pCard) pCard.style.zIndex = "";
    });
    if (willOpen) {
        el.classList.add("open");
        var pWrap = el.closest(".ms-wrap, .field");
        if (pWrap) pWrap.style.zIndex = "100";
        var pCard = el.closest(".detail-card");
        if (pCard) pCard.style.zIndex = "90";
    }
    return willOpen;
}

/* ---------- Ô CHỌN TỰ VẼ (thay <select>) ----------
   Popup của <select> do OS vẽ (macOS luôn nền sáng, không nghe color-scheme) nên
   không đồng bộ được với nền tối của app -> tự vẽ bằng .ms-wrap/.ms-dropdown như ô
   chọn đơn vị. Giá trị vẫn nằm ở <input type="hidden" id="..."> để mọi chỗ đang đọc
   document.getElementById(id).value chạy nguyên như cũ. */
function assSelectHtml(id, placeholder, options, selected) {
    var sel = String(selected == null ? "" : selected);
    var hit = (options || []).find(function (o) {
        return String(o.value) === sel;
    });
    var text = hit ? hit.label : placeholder;
    return `<div class="ms-wrap">
    <input type="hidden" id="${assEsc(id)}" value="${assEsc(sel)}" data-ms-select="1" />
    <div class="ms-trigger" onclick="assToggleDropdown('${assEsc(id)}Dropdown')"><span id="${assEsc(id)}Text"${hit ? "" : ' class="ms-placeholder"'}>${assEsc(text)}</span>${assChevronHtml()}</div>
    <div id="${assEsc(id)}Dropdown" class="ms-dropdown ms-dropdown-plain">
      ${(options || [])
            .map(function (o) {
                return `<button type="button" class="ms-option${String(o.value) === sel ? " on" : ""}" data-value="${assEsc(o.value)}" onclick="assPickOption('${assEsc(id)}',this)">${assEsc(o.label)}</button>`;
            })
            .join("")}
    </div>
  </div>`;
}
function assPickOption(id, btn) {
    var input = document.getElementById(id);
    if (input) input.value = btn.getAttribute("data-value") || "";
    var t = document.getElementById(id + "Text");
    if (t) {
        t.textContent = btn.textContent;
        t.classList.remove("ms-placeholder");
    }
    var box = document.getElementById(id + "Dropdown");
    if (box) {
        box.querySelectorAll(".ms-option").forEach(function (b) {
            b.classList.toggle("on", b === btn);
        });
        box.classList.remove("open");
    }
}
/* Khôi phục nháp/quay lại form: input ẩn đã có value, cần vẽ lại chữ trên ô bấm. */
function assSyncSelectText(id) {
    var input = document.getElementById(id),
        box = document.getElementById(id + "Dropdown"),
        t = document.getElementById(id + "Text");
    if (!input || !box || !t) return;
    var v = String(input.value || "");
    var hit = Array.from(box.querySelectorAll(".ms-option")).find(function (b) {
        return (b.getAttribute("data-value") || "") === v;
    });
    box.querySelectorAll(".ms-option").forEach(function (b) {
        b.classList.toggle("on", b === hit);
    });
    if (hit) {
        t.textContent = hit.textContent;
        t.classList.remove("ms-placeholder");
    }
}
/* Bấm ra ngoài -> đóng dropdown đang mở (kể cả cây đơn vị). */
document.addEventListener("click", function (e) {
    if (e.target.closest(".ms-wrap")) return;
    document.querySelectorAll(".ms-dropdown.open").forEach(function (o) {
        o.classList.remove("open");
    });
});
function assOnLeadPick(input) {
    window.__assLeadUnit = {
        id: input.value,
        label: input.getAttribute("data-label") || input.value,
    };
    // Chọn thẳng đơn vị -> bỏ người đã chọn trước đó (giao cho đơn vị, không cho người).
    window.__assLeadPerson = null;
    assStampLead(window.__assLeadUnit, null);
    document
        .querySelectorAll("#assUnitBox .ass-person .qlnv-tree-name.on")
        .forEach(function (b) {
            b.classList.remove("on");
        });
    document.querySelectorAll(".assLead").forEach(function (r) {
        var lb = r.closest(".qlnv-tree-name");
        if (lb) lb.classList.toggle("on", r.checked);
    });
    var t = assFormEl("assUnitTriggerText");
    if (t) {
        t.textContent = window.__assLeadUnit.label;
        t.classList.remove("ms-placeholder");
    }
    assToggleDropdown("assUnitDropdown");
}
/* Chỉ lấy ô "đơn vị phối hợp" ĐANG TICK trong form của file này. Dùng #assCoordBox làm
   mốc thay vì quét cả document: id `.assCoord` bị block qlnv_v2 cũ dùng trùng. */
function assCoordBoxEl() {
    // Form giao nhiệm vụ của file này luôn nằm trong #modalBody -> ưu tiên bản trong đó,
    // tránh vớ phải #assCoordBox của form ẩn do block qlnv_v2 cũ dựng.
    var modal = document.getElementById("modalBody");
    return (
        (modal && modal.querySelector("#assCoordBox")) || assFormEl("assCoordBox")
    );
}
/* Ô phối hợp gồm 2 loại ô tích: .assCoord (đơn vị) và .assCoordPerson (cán bộ trong
   đơn vị). Mọi chỗ đọc "đang tick gì" phải lấy CẢ HAI, nếu không tick người xong thì
   chữ trên ô không đổi và body gửi lên thiếu đơn vị của người đó. */
var ASS_COORD_SEL = ".assCoord:checked, .assCoordPerson:checked";
function assCheckedCoordInputs() {
    var box = assCoordBoxEl();
    return (box || document).querySelectorAll(ASS_COORD_SEL);
}
function assSyncCoordText(srcInput) {
    /* PHẢI khoanh vùng theo đúng form đang mở: trang CMS có thể nạp song song block
       qlnv_v2 cũ, cũng dựng `#assCoordTriggerText` + `.assCoord` -> getElementById trả
       phần tử ĐẦU TIÊN (của form ẩn) nên tick xong chữ không lên ô đang nhìn thấy. */
    var box =
        (srcInput && srcInput.closest && srcInput.closest("#assCoordBox")) ||
        assCoordBoxEl();
    var scope = (box && box.closest(".ms-wrap")) || document;
    var picked = Array.from(scope.querySelectorAll(ASS_COORD_SEL));
    scope.querySelectorAll(".assCoord, .assCoordPerson").forEach(function (c) {
        var lb = c.closest(".qlnv-tree-name");
        if (lb) lb.classList.toggle("on", c.checked);
    });
    /* Tìm ô chữ theo CẤU TRÚC trước, id sau: trang CMS có thể có NHIỀU phần tử cùng id
       `assCoordTriggerText` (block qlnv_v2 cũ dựng form ẩn) -> querySelector('#...')
       vẫn có thể trả nhầm nếu cây bị lồng khác đi. Ô chữ luôn là <span> đầu tiên trong
       .ms-trigger của chính .ms-wrap đang chứa ô tích vừa bấm. */
    /* ĐƯỜNG CHẮC CHẮN NHẤT: ô tích -> .ms-dropdown chứa nó -> .ms-wrap cha -> .ms-trigger
       -> <span> đầu tiên. Quan hệ cha-con này do chính markup của form dựng ra nên không
       phụ thuộc id (id có thể trùng với form ẩn của block qlnv_v2 cũ). */
    var dd = srcInput && srcInput.closest && srcInput.closest(".ms-dropdown");
    var wrap = (dd && dd.parentElement) || (scope !== document ? scope : null);
    var trig = wrap && wrap.querySelector(".ms-trigger");
    var t =
        (trig &&
            (trig.querySelector("#assCoordTriggerText") ||
                trig.querySelector("span"))) ||
        (scope.querySelector && scope.querySelector("#assCoordTriggerText")) ||
        document.getElementById("assCoordTriggerText");
    console.log("[QLNV] assSyncCoordText", {
        soODaTick: picked.length,
        timThayOChu: !!t,
        quaCauTruc: !!(trig && trig.querySelector("span")),
        idOChu: t && t.id,
    });
    if (!t) {
        console.warn(
            "[QLNV] assSyncCoordText: không thấy #assCoordTriggerText -> ô 'Đơn vị phối hợp' không cập nhật được.",
            { soONhoDaTick: picked.length },
        );
        return;
    }
    /* Tick rồi mà `picked` rỗng nghĩa là ô tích nằm NGOÀI phạm vi .ms-wrap vừa dò
       (cây bị vẽ vào hộp khác) -> lấy toàn bộ ô đang tick trong hộp phối hợp. */
    if (!picked.length && srcInput && srcInput.checked) {
        var fb = assCoordBoxEl();
        picked = fb ? Array.from(fb.querySelectorAll(ASS_COORD_SEL)) : [srcInput];
        if (!picked.length) picked = [srcInput];
        console.warn(
            "[QLNV] assSyncCoordText: ô tích nằm ngoài .ms-wrap đang dò -> dùng phương án dự phòng.",
            { soODaTick: picked.length },
        );
    }
    t.textContent = picked.length
        ? picked
            .map(function (c) {
                return c.getAttribute("data-label") || c.value;
            })
            .join(", ")
        : "Chọn đơn vị phối hợp";
    t.classList.toggle("ms-placeholder", !picked.length);
}
/* TÊN RIÊNG, KHÔNG THỂ BỊ CHIẾM: bundle CMS ở trang thật khác file local và đã từng
   ghi đè các hàm toàn cục (xem `openAssignmentForm`). Nếu nó cũng định nghĩa
   `assSyncCoordText` thì markup gọi theo tên đó sẽ chạy BẢN
   CỦA NÓ — bản đó không biết `.assCoordPerson` nên tick cán bộ xong chữ không lên ô.
   -> markup gọi tên riêng này, giữ tham chiếu cứng tới bản của file này. */
window.__qlnvSyncCoord = assSyncCoordText;
/* Lưới an toàn cho ô "Đơn vị phối hợp": chỉ dựa vào `onchange` inline trên từng ô tích
   thì mất tác dụng nếu trang nhúng chặn handler inline (CSP) hoặc cây bị vẽ lại bởi
   block khác. Bắt sự kiện change ở cấp document nên tick ô nào cũng đồng bộ được chữ
   trên ô chọn. `change` không nổi bọt qua capture=false ở mọi trình duyệt cũ -> dùng
   capture=true cho chắc. */
document.addEventListener(
    "change",
    function (e) {
        var el = e.target;
        if (!el || !el.classList) return;
        /* CHỈ xử lý ô phối hợp: assSyncCoordText chạy nhiều lần vẫn cho cùng kết quả.
           KHÔNG đụng vào .assLead — assOnLeadPick có toggle dropdown, gọi 2 lần (inline +
           delegated) sẽ đóng rồi mở lại danh sách. */
        if (
            el.classList.contains("assCoord") ||
            el.classList.contains("assCoordPerson")
        )
            window.__qlnvSyncCoord(el);
    },
    true,
);

/* ---------- Danh mục CRM ---------- */
/* Nạp danh mục CRM bằng ĐÚNG đường token mà các API dashboard đang chạy được
   (fetchFromApi -> localStorage qlnv_jwt_access_token + tự refresh khi 401).
   loadCrmStatusMapping() cũ đi qua getQlnvToken()/proxy nên có máy lấy được, có máy 401. */
function assLoadCrm() {
    return fetchFromApi({ segment: "crm-source" })
        .then(function (res) {
            var data = extractCrmStatusList(res);
            crmStatusCache.DUT = findCrmGroupByCode(data, "DUT");
            crmStatusCache.S3103 = findCrmGroupByCode(data, "S3103");
            crmStatusCache.S3Z03 = findCrmGroupByCode(data, "S3Z03");
            crmStatusCache.LOAINHIEMVU = findCrmGroupByCode(data, "LOAINHIEMVU");
            crmStatusCache.S3O03 = findCrmGroupByCode(data, "S3O03");
            if (!crmStatusCache.DUT)
                console.warn("[CRM] Không tìm thấy nhóm DUT trong response:", res);
            return crmStatusCache;
        })
        .catch(function (err) {
            console.warn("[CRM] Load failed:", err);
            toast(
                "Không tải được danh mục lĩnh vực/độ khẩn: " + (err.message || err),
            );
            return crmStatusCache;
        });
}
/* DANH MỤC LĨNH VỰC THEO ĐƠN VỊ (bảng linh_vuc của be_ioc_dash).
   Trước đây ô "Nhóm lĩnh vực" chỉ có danh mục CRM S3103 dùng chung toàn hệ thống, quản trị
   đơn vị không sửa được. Nay đọc GET /rbac/me/linh-vuc?organizationId= — route chỉ cần
   phiên đăng nhập (bản /rbac/linh-vuc nằm sau guard quản trị nên user thường bị 403).
   Đơn vị lấy từ iocContext.primaryOrganizationId của /rbac/me, cùng nguồn màn quản trị dùng.
   API hỏng -> giữ nguyên S3103 như cũ, KHÔNG để ô chọn trống vì mất danh mục là chặn tạo việc. */
var assLinhVucCache = null;
function assLinhVucBase() {
    return window.QLNV_API_BASE || window.location.origin + "/api";
}
function assLoadLinhVuc() {
    if (assLinhVucCache) return assLinhVucCache;
    assLinhVucCache = fetch(assLinhVucBase() + "/rbac/me", { credentials: "include" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (me) {
            var orgId = me && me.iocContext && me.iocContext.primaryOrganizationId;
            var url = assLinhVucBase() + "/rbac/me/linh-vuc" + (orgId ? "?organizationId=" + orgId : "");
            return fetch(url, { credentials: "include" });
        })
        .then(function (r) { return r && r.ok ? r.json() : null; })
        .then(function (res) {
            var items = (res && res.items) || [];
            items = items.filter(function (i) { return i && i.isActive !== false; });
            if (!items.length) return null;
            // Đổ vào đúng shape của nhóm CRM để mọi chỗ đọc S3103 không phải sửa.
            return { code: "S3103", data: items.map(function (i) { return { title: i.name, value: i.name }; }) };
        })
        .catch(function (err) {
            console.warn("[LinhVuc] không tải được danh mục theo đơn vị, giữ CRM S3103:", err);
            return null;
        })
        .then(function (nhom) {
            if (nhom) crmStatusCache.S3103 = nhom;
            return nhom;
        });
    return assLinhVucCache;
}
function assCrmItems(crmCode) {
    var g = crmStatusCache[crmCode];
    return g && Array.isArray(g.data) ? g.data : [];
}
function assFindCrmItem(crmCode, rawValue) {
    var norm = assNorm(rawValue);
    if (!norm) return null;
    return (
        assCrmItems(crmCode).find(function (it) {
            return [
                it && it.name,
                it && it.title,
                it && it.value,
                it && it.code,
            ].some(function (c) {
                return assNorm(c) === norm;
            });
        }) || null
    );
}
/* Payload JWT đang dùng — nguồn duy nhất cho id/tên người đăng nhập.
   Ưu tiên token của fetchFromApi (localStorage) vì đó là token các API dashboard
   đang chạy được; readQlnvToken() chỉ có giá trị khi đi qua getQlnvToken(). */
function assJwtPayload() {
    var t = "";
    try {
        t = localStorage.getItem("qlnv_jwt_access_token") || "";
    } catch (e) { }
    if (!t) t = readQlnvToken() || "";
    try {
        var parts = String(t).split(".");
        if (parts.length < 2) return null;
        var b = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (b.length % 4) b += "=";
        return JSON.parse(decodeURIComponent(escape(atob(b))));
    } catch (e) {
        return null;
    }
}

/* id nhân sự đang đăng nhập (dùng cho lanhDaoChiDaoId / nguoiTaoId).
   Ưu tiên _id từ /employees/profile, JWT là dự phòng khi chưa nạp xong hồ sơ. */
function assCurrentUserId() {
    if (__assMe && __assMe.id) return __assMe.id;
    var p = assJwtPayload();
    return String((p && (p.user || p.userId || p.sub)) || "");
}

/* 1 bản ghi employee -> {id, name, unitName}. Dò nhiều khóa vì shape chưa chốt. */
function assAdaptEmployee(e) {
    e = e && typeof e === "object" ? e : {};
    var ou = e.organizationUnit || {};
    return {
        id: String(e._id || e.id || ""),
        name: String(
            e.fullName || e.name || e.hoTen || e.tenNhanVien || e.displayName || "",
        ),
        unitName: String(ou.name || ou.fullName || ""),
        /* MỌI đơn vị của người này (`user_organizations`), primary đứng đầu — `organizationUnit`
            ở trên CHỈ là primary nên một mình nó không đủ cho người kiêm nhiệm. Giữ cả id lẫn
            tên: assScopeIddvList cần id, và ô "Người giao" (khối departments/communes-wards)
            cần tên để hiện. */
        orgs: (Array.isArray(e.organizations) ? e.organizations : [])
            .map(function (o) {
                var n = o && o.id != null ? Number(o.id) : NaN;
                return isFinite(n) && n > 0
                    ? { id: n, name: String((o && o.name) || "") }
                    : null;
            })
            .filter(Boolean),
    };
}

/* ĐÃ VÔ HIỆU (giữ hàm để nơi gọi không phải đổi) — luôn trả null.
   Trước đây tra GET /api/employees?filter[_id]=<uid> làm phương án 2 khi /profile không ra
   họ tên. Không dùng được nữa: với token LifeSSO, `uid` là `ab_user.id` (số) hoặc JWT `sub`
   (tên tài khoản) — cả hai đều không phải ObjectId, nên route list ném CastError -> 500.
   Họ tên có dấu nay lấy bằng assLoadHoTenByAccount() (dm_user, khớp theo account). */
function assLoadMeById(uid) {
    return Promise.resolve(null);
}

/* HỒ SƠ NGƯỜI ĐANG ĐĂNG NHẬP — GET /api/employees/profile (theo bản chuẩn filev2.js).
   PHẢI gọi API: payload JWT chỉ có id, KHÔNG có họ tên. Nạp 1 lần + gộp lời gọi trùng;
   lỗi -> object rỗng, form vẫn dùng được (rơi về title tài khoản). */
var __assMe = null,
    __assMeP = null;
function assLoadMe() {
    if (__assMe) return Promise.resolve(__assMe);
    if (__assMeP) return __assMeP;
    var uid = "";
    try {
        var p = assJwtPayload();
        uid = String((p && (p.user || p.userId || p.sub)) || "");
    } catch (e) { }
    __assMeP = fetchFromApi({ segment: "employees/profile" })
        .then(function (res) {
            // /profile trả object TRẦN; vẫn dò lớp bọc phòng BE đổi shape.
            return assAdaptEmployee(
                res && res._id ? res : (res && (res.data || res.employee)) || {},
            );
        })
        .catch(function (err) {
            console.warn("[EMP] Load profile failed:", err);
            return null;
        })
        .then(function (me) {
            if (me && me.name) return me;
            return assLoadMeById(uid).then(function (fb) {
                return fb || me || { id: uid, name: "", unitName: "" };
            });
        })
        .then(function (me) {
            __assMe = me;
            __assMeP = null;
            try {
                window.__assMe = me;
            } catch (e) { }
            // Form có thể đã mở TRƯỚC khi biết người đăng nhập -> điền lại ô "Người giao".
            var el = document.getElementById("assGiver");
            if (el && me.name) el.value = me.name;
            return me;
        });
    return __assMeP;
}

/* TÊN người đăng nhập. Tra không ra -> trả "" để body gửi null, KHÔNG lấy
   currentAccount.title (tài khoản DEMO hardcode "Tài khoản UBND") làm dữ liệu thật. */
function assCurrentUserName() {
    return String((__assMe && __assMe.name) || "");
}

/* ---------- FILE ĐÍNH KÈM ---------- */
function assSyncFileInput() {
    var el = assFormEl("assFileInput");
    if (!el) return;
    var files = window.__assFiles || [];
    if (!files.length) {
        el.value = "";
        return;
    }
    try {
        var dt = new DataTransfer();
        files.forEach(function (item) {
            if (item.file instanceof File) {
                dt.items.add(item.file);
            } else {
                dt.items.add(new File([], item.name || "file"));
            }
        });
        el.files = dt.files;
    } catch (e) {
        // Ignore if DataTransfer is not supported
    }
}
function assHandleFiles(input) {
    var files = Array.from(input.files || []);
    window.__assFiles = window.__assFiles || [];
    var bad = files.filter(function (f) {
        var ext = String(f.name).split(".").pop().toLowerCase();
        return ASS_UPLOAD_EXTS.indexOf(ext) < 0;
    });
    if (bad.length) {
        toast(
            "Định dạng không được phép: " +
            bad
                .map(function (f) {
                    return f.name;
                })
                .join(", "),
        );
    }
    var ok = files.filter(function (f) {
        return bad.indexOf(f) < 0;
    });
    var remaining = ok.length;
    if (!remaining) {
        assRenderFileList();
        assSyncFileInput();
        return;
    }
    ok.forEach(function (f) {
        var reader = new FileReader();
        reader.onload = function () {
            window.__assFiles.push({ name: f.name, dataUrl: reader.result, file: f });
            if (!--remaining) {
                assRenderFileList();
                assSyncFileInput();
            }
        };
        reader.onerror = function () {
            if (!--remaining) {
                assRenderFileList();
                assSyncFileInput();
            }
        };
        reader.readAsDataURL(f);
    });
}
function assRemoveFile(idx) {
    (window.__assFiles || []).splice(idx, 1);
    assRenderFileList();
    assSyncFileInput();
}
function assRenderFileList() {
    var box = assFormEl("assFileList");
    if (!box) return;
    var files = window.__assFiles || [];
    box.innerHTML = files.length
        ? files
            .map(function (f, i) {
                return `<div style="display:flex;gap:8px;align-items:center"><span>📎 ${assEsc(f.name)}</span><button type="button" class="ghost danger-btn" onclick="assRemoveFile(${i})" style="padding:2px 8px">Bỏ</button></div>`;
            })
            .join("")
        : "Chưa có file đính kèm.";
}
function assDataUrlToBlob(dataUrl) {
    return fetch(dataUrl).then(function (r) {
        return r.blob();
    });
}
/* Upload đính kèm: POST multipart /qlnv/bmm/files/:id/upload, field 'files'.
   :id = task_id BKAV (SỐ) chứ KHÔNG phải _id Mongo — thiếu nó nghĩa là nhiệm vụ
   chưa mirror sang BKAV, phải báo rõ thay vì nuốt lỗi. */
function assUploadFiles(bmmId, files, mongoId) {
    if (!files || !files.length) return Promise.resolve();
    return Promise.all(
        files.map(function (f) {
            return assDataUrlToBlob(f.dataUrl).then(function (b) {
                return { name: f.name, blob: b };
            });
        }),
    ).then(function (parts) {
        var fd = new FormData();
        parts.forEach(function (p) {
            fd.append("files", p.blob, p.name);
        });
        // Trục trên (đã mirror BKAV -> có bmmId): đẩy thẳng sang BKAV như cũ.
        if (bmmId) {
            return QlnvApi.qlnvFetch(
                "/qlnv/bmm/files/" + encodeURIComponent(bmmId) + "/upload",
                { method: "POST", body: fd },
            ).then(assAssertUploadOk);
        }
        // Xã/phường (không mirror BKAV): lưu Mongo qua endpoint v2, KHÔNG đụng BKAV.
        if (!mongoId)
            return Promise.reject(
                new Error("Thiếu định danh nhiệm vụ để lưu đính kèm"),
            );
        fd.append("taskId", mongoId);
        return QlnvApi.qlnvFetch(
            "/qlnv/v2/nhiem-vu/tep-dinh-kem-file",
            { method: "POST", body: fd },
        ).then(assAssertUploadOk);
    });
}
/* BE trả HTTP 200 + vỏ {status:1} NGAY CẢ KHI LỖI; lỗi thật nằm lồng trong `data`. */
function assAssertUploadOk(res) {
    var inner = res && typeof res === "object" ? res.data : null;
    var st = inner && inner.status;
    var bad =
        (res && Number(res.status) === 0) ||
        (inner &&
            ((st != null && Number(st) >= 400) ||
                (Array.isArray(inner.errors) && inner.errors.length)));
    if (bad) {
        throw new Error(
            (inner &&
                (Array.isArray(inner.errors)
                    ? inner.errors.join("; ")
                    : inner.message)) ||
            (res && res.message) ||
            "Upload thất bại",
        );
    }
    return res;
}

/* ---------- CHỌN VĂN BẢN ---------- */
var __assDocItems = null;
function assNormalizeDoc(raw, metric) {
    return {
        id: String((raw && (raw._id || raw.id)) || ""),
        metric: metric,
        /* ĐO 2026-08-11 trên van-ban-di: `toBook`/`name`/`documentDate` đều null, chỉ có
           `abstractNote` + `draftDocumentSymbol`/`docId` -> nếu chỉ đọc toBook/name thì
           dòng trong bảng chọn TRỐNG TRƠN, tick vào nhìn như không có gì xảy ra. */
        code:
            raw.toBook ||
            raw.code ||
            raw.documentNumber ||
            raw.soVanBan ||
            raw.draftDocumentSymbol ||
            raw.reportDocumentSymbol ||
            raw.docId ||
            "",
        title: raw.name || raw.title || raw.tenVanBan || raw.abstractNote || "",
        summary: raw.abstractNote || raw.summary || raw.trichYeu || "",
        signer:
            (raw.signer && (raw.signer.name || raw.signer)) || raw.nguoiKy || "",
        created: raw.documentDate || raw.ngayVanBan || raw.createdAt || "",
        raw: raw,
    };
}
function assLoadDocs() {
    if (__assDocItems) return Promise.resolve(__assDocItems);
    var statuses = [
        "moiTao",
        "dangThucHien",
        "sapHetHan",
        "nguyCoTre",
        "quaHan",
        "hoanThanh",
    ];
    /* ĐO 2026-08-11: GET /api/van-ban-den|van-ban-di/list-by-status KHÔNG token -> HTTP 401
       "No authorization token was found". Trước đây hàm này lấy token qua getQlnvToken()
       (proxy :3004, phụ thuộc cookie phiên) — đúng cái đường đã hỏng ở loadCrmStatusMapping,
       máy có máy không. -> đi qua fetchFromApi như mọi API dashboard khác: đọc
       localStorage `qlnv_jwt_access_token` và TỰ LÀM MỚI khi hết hạn/401. */
    var failed = 0,
        tried = 0;
    function fetchSeg(seg, metric) {
        return Promise.all(
            statuses.map(function (st) {
                tried++;
                return fetchFromApi({
                    segment: seg + "/list-by-status",
                    params: { status: st, skip: 0, limit: 100 },
                }).then(
                    function (res) {
                        return (res && res.data) || [];
                    },
                    function (err) {
                        failed++;
                        console.warn("[VAN BAN] " + seg + "/" + st + " lỗi:", err);
                        return [];
                    },
                );
            }),
        ).then(function (lists) {
            var seen = {},
                out = [];
            lists.forEach(function (arr) {
                (arr || []).forEach(function (it) {
                    var id = String((it && (it._id || it.id)) || "");
                    if (id && seen[id]) return;
                    if (id) seen[id] = 1;
                    out.push(assNormalizeDoc(it, metric));
                });
            });
            return out;
        });
    }
    return Promise.all([
        fetchSeg("van-ban-den", "docIn"),
        fetchSeg("van-ban-di", "docOut"),
    ]).then(function (lists) {
        /* HỎNG TOÀN BỘ (401/mất mạng) mà vẫn trả mảng rỗng thì picker hiện "Không có văn
           bản phù hợp" — người dùng tưởng hệ thống không có văn bản nào. Báo lỗi thật. */
        if (failed >= tried && tried > 0)
            throw new Error(
                "Không gọi được API văn bản (" +
                failed +
                "/" +
                tried +
                " request lỗi) — nhiều khả năng phiên đăng nhập hết hạn.",
            );
        __assDocItems = (lists[0] || []).concat(lists[1] || []);
        return __assDocItems;
    });
}
function assOpenDocPicker() {
    window.__assDraft = assCaptureForm();
    document.getElementById("modalTitle").textContent = "Chọn văn bản liên quan";
    document.getElementById("modalSub").textContent =
        "Tick văn bản để gắn vào nhiệm vụ sắp giao";
    document.getElementById("modalBody").innerHTML = `
    <div class="iip-modal-back"><button class="ghost" onclick="assBackToForm()">← Quay lại giao nhiệm vụ</button></div>
    <div class="filters"><input id="assDocSearch" placeholder="Tìm mã/tên/trích yếu..." oninput="assRenderDocPicker()" />
    <select id="assDocMetric" onchange="assRenderDocPicker()"><option value="">Tất cả loại</option><option value="docIn">Văn bản đến</option><option value="docOut">Văn bản đi</option></select></div>
    <div id="assDocPickedNote" style="margin:6px 0;font-size:12.5px;color:#8ab0c8"></div>
    <div id="assDocRows">Đang tải văn bản...</div>
    <div class="action-bar"><button class="primary" onclick="assBackToForm()">Xong</button></div>`;
    assRenderDocPickedNote();
    openModal();
    assLoadDocs().then(assRenderDocPicker, function (err) {
        var box = document.getElementById("assDocRows");
        if (box)
            box.textContent = "Không tải được danh sách văn bản: " + err.message;
    });
}
function assRenderDocPicker() {
    var box = document.getElementById("assDocRows");
    if (!box) return;
    var q = assSearchKey(document.getElementById("assDocSearch").value || "");
    var metric = document.getElementById("assDocMetric").value;
    var picked = {};
    (window.__assDocs || []).forEach(function (d) {
        picked[d.id] = 1;
    });
    var list = (__assDocItems || []).filter(function (d) {
        if (metric && d.metric !== metric) return false;
        if (!q) return true;
        return (
            assSearchKey([d.code, d.title, d.summary, d.signer].join(" ")).indexOf(
                q,
            ) >= 0
        );
    });
    box.innerHTML = list.length
        ? `<table class="compact-table"><thead><tr><th></th><th>Số/ký hiệu</th><th>Tên văn bản</th><th>Trích yếu</th><th>Loại</th></tr></thead><tbody>${list
            .map(function (d) {
                return `<tr><td><input type="checkbox" class="assDocPick" value="${assEsc(d.id)}" ${picked[d.id] ? "checked" : ""} onchange="assToggleDoc('${assEsc(d.id)}',this.checked)" /></td><td class="mono">${assEsc(d.code)}</td><td>${assEsc(d.title)}</td><td class="wrap">${assEsc(d.summary)}</td><td>${d.metric === "docIn" ? "Đến" : "Đi"}</td></tr>`;
            })
            .join("")}</tbody></table>`
        : "Không có văn bản phù hợp.";
}
/* Dòng "Đã chọn N văn bản" ngay trong bảng chọn: trước đây tick xong KHÔNG có phản hồi
   nào (danh sách đã chọn chỉ vẽ lại sau khi bấm "Xong" và quay về form), nên nhìn như
   bấm không ăn. */
function assRenderDocPickedNote() {
    var el = document.getElementById("assDocPickedNote");
    if (!el) return;
    var docs = window.__assDocs || [];
    el.innerHTML = docs.length
        ? "Đã chọn <b>" +
        docs.length +
        "</b> văn bản: " +
        docs
            .map(function (d) {
                return assEsc(d.code || d.title || d.summary || d.id);
            })
            .join("; ")
        : "Chưa chọn văn bản nào — tick vào ô vuông ở cột đầu để gắn văn bản.";
}
function assToggleDoc(id, checked) {
    window.__assDocs = window.__assDocs || [];
    var doc = (__assDocItems || []).find(function (d) {
        return d.id === id;
    });
    if (checked) {
        if (
            doc &&
            !window.__assDocs.some(function (d) {
                return d.id === id;
            })
        )
            window.__assDocs.push(doc);
    } else {
        window.__assDocs = window.__assDocs.filter(function (d) {
            return d.id !== id;
        });
    }
    assRenderDocPickedNote();
    toast(
        (checked ? "Đã chọn: " : "Đã bỏ chọn: ") +
        ((doc && (doc.code || doc.title || doc.summary)) || id) +
        " · tổng " +
        (window.__assDocs || []).length +
        " văn bản",
    );
}
function assRenderDocList() {
    var box = assFormEl("assDocsList");
    if (!box) return;
    var docs = window.__assDocs || [];
    box.innerHTML = docs.length
        ? docs
            .map(function (d) {
                return `<div style="display:flex;gap:8px;align-items:center;font-size:12.5px"><span class="mono">${assEsc(d.code || d.id)}</span><span>${assEsc(d.title || d.summary)}</span></div>`;
            })
            .join("")
        : '<div style="color:#8ab0c8;font-size:12.5px">Chưa chọn văn bản.</div>';
}
/* Chỉ gửi _id THẬT (24 hex); văn bản không có _id hợp lệ thì để null. */
function assIsObjectId(v) {
    return /^[0-9a-fA-F]{24}$/.test(String(v || ""));
}
function assMapDocsToDinhKem(docs) {
    return (docs || []).map(function (d) {
        var raw = d.raw || {};
        return {
            soVanBan: d.code || "",
            ngayVanBan: d.created || null,
            trichYeu: d.summary || "",
            nguoiKy: d.signer || "",
            fileDinhKem: Array.isArray(raw.fileDinhKem) ? raw.fileDinhKem : [],
            _id: assIsObjectId(raw._id) ? raw._id : assIsObjectId(d.id) ? d.id : null,
        };
    });
}

/* ---------- KỊCH BẢN XỬ LÝ ----------
   Kịch bản ở dashboard là bộ mẫu tại chỗ (window.__scenarioTemplates), KHÔNG có API
   riêng -> chọn kịch bản sẽ ghép mô tả + các mốc SLA vào ý kiến chỉ đạo gửi lên BE. */
function assScenarioBoxHtml() {
    var key = window.__assScenario || "";
    var s =
        key && window.__scenarioTemplates ? window.__scenarioTemplates[key] : null;
    if (s) {
        return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="badge ok">Đã chọn</span><b>${assEsc(s.title)}</b><button type="button" class="ghost" onclick="assOpenScenarioPicker()">Đổi kịch bản</button><button type="button" class="ghost danger-btn" onclick="assClearScenario()">Bỏ chọn</button></div>`;
    }
    return '<button type="button" class="primary" onclick="assOpenScenarioPicker()">⚡ Chọn kịch bản xử lý</button>';
}
function assClearScenario() {
    window.__assScenario = "";
    var box = assFormEl("assScenarioBox");
    if (box) box.innerHTML = assScenarioBoxHtml();
}
function assOpenScenarioPicker() {
    /* CHỈ chụp lại form khi form còn trên DOM. Quay về đây từ màn "Thêm mới kịch bản"
       thì modalBody đã là form kịch bản -> assCaptureForm() đọc ra toàn chuỗi rỗng và
       xóa sạch nội dung người dùng vừa nhập ở form giao nhiệm vụ. */
    if (assFormEl("assTitle")) window.__assDraft = assCaptureForm();
    var tpl =
        (typeof window.getScenarioTemplatesV15 === "function"
            ? window.getScenarioTemplatesV15()
            : null) || window.__scenarioTemplates || {};
    document.getElementById("modalTitle").textContent =
        "Chọn kịch bản xử lý cho nhiệm vụ sắp giao";
    document.getElementById("modalSub").textContent =
        "Kịch bản sẽ gợi ý nội dung chỉ đạo và các mốc SLA";
    var fieldFilterBtns =
        '<button type="button" class="ghost active" data-field-filter onclick="scenarioFilterByField(\'__all__\', this)">Tất cả</button>' +
        window.qlnvScenarioLinhVucList()
            .map(function (lv) {
                return `<button type="button" class="ghost" data-field-filter onclick="scenarioFilterByField('${lv}', this)">${lv}</button>`;
            })
            .join("");
    document.getElementById("modalBody").innerHTML =
        `<div class="iip-modal-back"><button class="ghost" onclick="assBackToForm()">← Quay lại giao nhiệm vụ</button></div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('assign','')">＋ Thêm mới kịch bản</button></div><div class="scenario-field-filter">${fieldFilterBtns}</div><div class="scenario-grid">${Object.keys(
            tpl,
        )
            .map(function (k) {
                var s = tpl[k];
                /* Badge SỐ NHIỆM VỤ NHÁNH (port từ scenarioCardHtml của qlnv_v2): người giao
                   phải biết chọn kịch bản này sẽ sinh ra bao nhiêu việc con trước khi bấm.
                   Ép max-width/white-space vì .badge dùng chung có luật cắt chữ 1 dòng. */
                return `<button class="scenario-card" data-scenario-key="${k}" data-fields="${(s.fields || []).join("|")}" onclick="assPickScenario('${k}')"><div class="scenario-severity"><span class="badge ${s.level === "Khẩn" ? "red" : s.level === "Cao" ? "warn" : "ok"}">${s.level}</span><span class="badge" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3">📋 ${(s.tasks || []).length} nhiệm vụ nhánh</span></div><h4>${assEsc(s.title)}</h4><p>${assEsc(s.desc)}</p><ul>${(
                    s.sla || []
                )
                    .map(function (x) {
                        return `<li>${assEsc(x)}</li>`;
                    })
                    .join("")}</ul></button>`;
            })
            .join("")}</div>`;
    openModal();
}
function assPickScenario(key) {
    window.__assScenario = key;
    assBackToForm();
}

/* ---------- NHÁP / KHÔI PHỤC TRẠNG THÁI FORM ---------- */
/* Mọi field của form giao nhiệm vụ PHẢI tra trong #modalBody: trang CMS có thể nạp
   song song block qlnv_v2 cũ dùng TRÙNG id (assTitle/assDue/assCode/.assLead…),
   getElementById khi đó trả phần tử của form ẩn -> đọc ra rỗng và "Phát hành" dừng
   sớm/không gửi gì. */
function assFormRoot() {
    return document.getElementById("modalBody") || document;
}
function assFormEl(id) {
    var root = assFormRoot();
    return (
        (root.querySelector && root.querySelector("#" + id)) ||
        document.getElementById(id)
    );
}
function assVal(id) {
    var el = assFormEl(id);
    return el ? el.value : "";
}
function assCaptureForm() {
    return {
        title: assVal("assTitle"),
        code: assVal("assCode"),
        field: assVal("assField"),
        importance: assVal("assImportance"),
        urgency: assVal("assUrgency"),
        taskType: assVal("assTaskType"),
        docType: assVal("assDocType"),
        start: assVal("assStart"),
        due: assVal("assDue"),
        desc: assVal("assDesc"),
        leadUnit: assResolveLead(),
        // Giữ cả người chủ trì: trước đây chỉ lưu đơn vị -> quay về từ màn chọn văn bản/kịch
        // bản là mất tên cán bộ đã chọn đích danh.
        leadPerson: window.__assLeadPerson || null,
        coordinators: Array.from(assCheckedCoordInputs()).map(function (c) {
            return { id: c.value, label: c.getAttribute("data-label") || c.value };
        }),
    };
}
function assApplyForm(st) {
    if (!st) return;
    [
        ["assTitle", "title"],
        ["assCode", "code"],
        ["assField", "field"],
        ["assImportance", "importance"],
        ["assUrgency", "urgency"],
        ["assTaskType", "taskType"],
        ["assDocType", "docType"],
        ["assStart", "start"],
        ["assDue", "due"],
        ["assDesc", "desc"],
    ].forEach(function (p) {
        var el = document.getElementById(p[0]);
        if (el && st[p[1]] != null) el.value = st[p[1]];
    });
    // Các ô chọn tự vẽ: giá trị nằm ở input ẩn -> phải vẽ lại chữ hiển thị.
    [
        "assField",
        "assImportance",
        "assUrgency",
        "assTaskType",
        "assDocType",
    ].forEach(assSyncSelectText);
    if (st.leadUnit && st.leadUnit.id) {
        window.__assLeadUnit = st.leadUnit;
        window.__assLeadPerson = st.leadPerson || null;
        // Ghi lại dấu vết trên DOM để lần vẽ lại sau vẫn đọc được.
        assStampLead(window.__assLeadUnit, window.__assLeadPerson);
        var radio = document.querySelector(
            '.assLead[value="' + st.leadUnit.id + '"]',
        );
        if (radio && !window.__assLeadPerson) radio.checked = true;
        var t = assFormEl("assUnitTriggerText");
        if (t) {
            t.textContent = window.__assLeadPerson
                ? window.__assLeadPerson.name + " · " + st.leadUnit.label
                : st.leadUnit.label;
            t.classList.remove("ms-placeholder");
        }
    }
    (st.coordinators || []).forEach(function (c) {
        var cb = document.querySelector('.assCoord[value="' + c.id + '"]');
        if (cb) cb.checked = true;
    });
    assSyncCoordText();
}
function assSaveDraft() {
    try {
        localStorage.setItem(
            ASS_DRAFT_KEY,
            JSON.stringify({
                form: assCaptureForm(),
                docs: window.__assDocs || [],
                scenario: window.__assScenario || "",
            }),
        );
        toast("Đã lưu nháp nhiệm vụ trên máy này.");
    } catch (e) {
        toast("Không lưu được nháp: " + e.message);
    }
}
function assReadDraft() {
    try {
        return JSON.parse(localStorage.getItem(ASS_DRAFT_KEY) || "null");
    } catch (e) {
        return null;
    }
}
function assClearDraft() {
    try {
        localStorage.removeItem(ASS_DRAFT_KEY);
    } catch (e) { }
    toast("Đã xóa nháp.");
    qlnvxOpenAssignmentForm();
}
/* Quay lại form sau khi mở picker (giữ nguyên dữ liệu đã nhập). */
function assBackToForm() {
    qlnvxOpenAssignmentForm({ restore: window.__assDraft });
}

/* Thu gọn/mở lại phần thân của 1 thẻ trong form (nút − ở mép phải đầu thẻ).
   Ẩn MỌI phần tử sau .card-head chứ không chỉ .form2, để thẻ nào cũng thu gọn được. */
function assToggleCard(btn) {
    var card = btn.closest(".detail-card");
    var head = btn.closest(".card-head");
    if (!card || !head) return;
    var hide = btn.textContent.trim() !== "＋";
    Array.prototype.forEach.call(card.children, function (el) {
        if (el !== head) el.style.display = hide ? "none" : "";
    });
    btn.textContent = hide ? "＋" : "−";
    btn.title = hide ? "Mở rộng" : "Thu gọn";
}

/* ---------- FORM GIAO NHIỆM VỤ ---------- */
function qlnvxOpenAssignmentForm(opts) {
    opts = opts || {};
    var restore = opts.restore || null;
    var mbPre = document.getElementById("modalBody");
    /* NHIỆM VỤ NHÁNH (theo filev2: openSubTaskFormOverview + buildQlnvSubTaskBody):
       dùng CHUNG form này, chỉ khác ở chỗ gắn nhiệm vụ cha -> body thêm
       loaiNV="NHIEM_VU_CON" + parentId. Giữ qua các lần mở lại form (chọn văn bản/kịch
       bản rồi quay lại) nên chỉ ghi đè khi caller truyền tường minh. */
    if (opts.parent !== undefined) {
        window.__assParent = opts.parent || null;
        if (!window.__assParent && mbPre && mbPre.dataset) delete mbPre.dataset.assParentId;
    } else if (!restore && !opts.keepSelection) {
        window.__assParent = null;
        if (mbPre && mbPre.dataset) delete mbPre.dataset.assParentId;
    }
    /* NHIỆM VỤ CHA cũng phải sống sót khi form vẽ lại: `window.__assParent` bị đặt null
       ở nhánh trên là submit tưởng đang tạo nhiệm vụ CHÍNH (log `laNhanh: false`) ->
       body gửi lên thiếu parentId/loaiNV=NHIEM_VU_CON. Ghi id cha lên #modalBody và giữ
       object trong sổ tra không bao giờ bị xóa. */
    var parent = (opts.parent !== undefined)
        ? (opts.parent || null)
        : ((restore || opts.keepSelection) ? (window.__assParent || assRecallParent()) : null);
    if (parent && parent.id) {
        window.__assParent = parent;
        window.__assParentById = window.__assParentById || {};
        window.__assParentById[String(parent.id)] = parent;
    } else {
        window.__assParent = null;
        if (mbPre && mbPre.dataset) delete mbPre.dataset.assParentId;
    }
    /* Mở lại form = phiên gửi mới. Nếu lần trước lỗi ở đoạn dựng body (trước khi vào
       promise) thì cờ này còn treo -> mọi lần bấm "Phát hành" sau đó chỉ báo
       "Đang gửi nhiệm vụ, vui lòng đợi…" và không làm gì. */
    window.__assSubmitting = false;
    if (!restore && !opts.keepSelection) {
        window.__assLeadUnit = null;
        window.__assLeadPerson = null;
        window.__assDocs = [];
        window.__assFiles = [];
        window.__assScenario = "";
    }
    // Nháp là của nhiệm vụ CHÍNH -> không khôi phục vào form nhánh.
    var draft = !restore && !parent ? assReadDraft() : null;
    var urgencies = assCrmItems("DUT");
    var fields = assCrmItems("S3103");
    var docTypes = assCrmItems("S3Z03");
    var taskTypes = assCrmItems("LOAINHIEMVU");
    var defaultTaskType = (function () {
        var item = assFindCrmItem("LOAINHIEMVU", "Không định kỳ");
        if (item) return String(item.value || item.code || "");
        var found = taskTypes.find(function (t) {
            var l = String(t.title || t.name || t.value || t.code || "").toLowerCase();
            return l.indexOf("không định kỳ") !== -1 || l.indexOf("khong dinh ky") !== -1;
        });
        if (found) return String(found.value || found.code || "");
        return "";
    })();
    // Hiển thị đúng tên sẽ gửi lên BE (nguoiGiaoNhiemVu), không phải title tài khoản demo.
    // Chưa có hồ sơ -> nạp nền rồi tự điền lại ô #assGiver khi có (xem assLoadMe).
    assLoadMe();
    var giver = assCurrentUserName() || "Theo tài khoản đăng nhập";
    var taskCode = `${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    document.getElementById("modalTitle").textContent = parent
        ? `Giao nhiệm vụ nhánh · ${assEsc(parent.code || parent.id)}`
        : "Giao nhiệm vụ IOC/CAD";
    document.getElementById("modalSub").textContent = parent
        ? `Nhiệm vụ nhánh này sẽ là nhiệm vụ con của ${parent.code || parent.id} · ${parent.title || ""}`
        : "Chọn đơn vị nhận trong phạm vi cấp dưới của đơn vị đang đăng nhập";
    document.getElementById("modalBody").innerHTML = `
    <div class="detail-card">
      <div class="card-head"><h4>${parent ? "Thông tin nhiệm vụ nhánh" : "Thông tin chung nhiệm vụ"}</h4><button type="button" class="ass-collapse" onclick="assToggleCard(this)" title="Thu gọn">−</button></div>
      <div class="form2 compact">
        <div class="field wide"><label>${parent ? "Tên nhiệm vụ nhánh" : "Tiêu đề nhiệm vụ"}</label><input id="assTitle" placeholder="${parent ? "Nhập tên nhiệm vụ nhánh" : ""}" value="${parent ? "" : "Rà soát, cập nhật số liệu chỉ tiêu phục vụ dashboard IOC Thành ủy Hà Nội"}" /></div>
        <div class="form2-row-3">
          <div class="field"><label>Người giao</label><input id="assGiver" value="${assEsc(giver)}" disabled /></div>
          <div class="field"><label>${parent ? "Mã nhiệm vụ nhánh" : "Mã nhiệm vụ"}</label><input id="assCode" value="${taskCode}" /></div>
          <div class="field"><label>${parent ? "Đơn vị chủ trì (nhận việc)" : "Đơn vị nhận nhiệm vụ"}</label>
            <div class="ms-wrap">
              <div class="ms-trigger" onclick="assToggleDropdown('assUnitDropdown')"><span id="assUnitTriggerText" class="ms-placeholder">Chọn đơn vị nhận nhiệm vụ</span>${assChevronHtml()}</div>
              <div id="assUnitDropdown" class="ms-dropdown">
                <div class="ms-dropdown-title">Chọn đơn vị nhận nhiệm vụ</div>
                <div class="ms-dropdown-sub">Cây cơ cấu tổ chức — tick để chọn 01 đơn vị, bấm ▸ để mở rộng</div>
                <input type="text" id="assUnitSearch" placeholder="Tìm đơn vị..." autocomplete="off" oninput="assFilterTree('assUnitSearch','assUnitBox')" />
                <div id="assUnitBox">Đang tải cơ cấu tổ chức...</div>
              </div>
            </div>
          </div>
        </div>
        <div class="field wide"><label>Đơn vị/người phối hợp</label>
          <div class="ms-wrap">
            <div class="ms-trigger" onclick="assToggleDropdown('assCoordDropdown')"><span id="assCoordTriggerText" class="ms-placeholder">Chọn đơn vị phối hợp</span>${assChevronHtml()}</div>
            <div id="assCoordDropdown" class="ms-dropdown">
              <div class="ms-dropdown-title">Chọn đơn vị/người phối hợp</div>
              <div class="ms-dropdown-sub">Đơn vị ngang cấp (cùng cha với đơn vị của bạn) — tick để chọn nhiều đơn vị, bấm ▸ để mở rộng</div>
              <input type="text" id="assCoordSearch" placeholder="Tìm đơn vị..." autocomplete="off" oninput="assFilterTree('assCoordSearch','assCoordBox')" />
              <div id="assCoordBox">Đang tải cơ cấu tổ chức...</div>
            </div>
          </div>
        </div>
        <div class="form2-row-3">
          ${parent
            ? ""
            : `<div class="field"><label>Nhóm lĩnh vực</label>${assSelectHtml(
                "assField",
                "Chưa phân loại",
                [{ value: "", label: "Chưa phân loại" }].concat(
                    fields.map(function (f) {
                        var l = String(
                            f.title || f.name || f.value || f.code || "",
                        );
                        return { value: l, label: l };
                    }),
                ),
                "",
            )}</div>`
        }
          <div class="field"><label>Mức độ quan trọng</label>${assSelectHtml(
            "assImportance",
            "Bình thường",
            [
                { value: "Cao", label: "Cao" },
                { value: "Bình thường", label: "Bình thường" },
            ],
            "Bình thường",
        )}</div>
          <div class="field"><label>Độ khẩn</label>${assSelectHtml(
            "assUrgency",
            "Thường",
            urgencies.length
                ? urgencies.map(function (u) {
                    var l = String(u.title || u.name || u.code || u.value || "");
                    return { value: l, label: l };
                })
                : [{ value: "Thường", label: "Thường" }],
            urgencies.length
                ? String(
                    urgencies[0].title ||
                    urgencies[0].name ||
                    urgencies[0].code ||
                    urgencies[0].value ||
                    "",
                )
                : "Thường",
        )}</div>
        </div>
        <div class="form2-row-3">
          <div class="field"><label>Ngày bắt đầu</label><input id="assStart" type="date" /></div>
          <div class="field"><label>${parent ? "Hạn hoàn thành" : "Hạn xử lý"}</label><input id="assDue" type="date" /></div>
          ${parent
            ? ""
            : `<div class="field"><label>Loại nhiệm vụ</label>${assSelectHtml(
                "assTaskType",
                "Không định kỳ",
                taskTypes.length
                    ? taskTypes.map(function (t) {
                        return {
                            value: String(t.value || t.code || ""),
                            label: String(
                                t.title || t.name || t.value || t.code || "",
                            ),
                        };
                    })
                    : [{ value: "", label: "Không định kỳ" }],
                defaultTaskType,
            )}</div>`
        }
        </div>
        ${parent
            ? ""
            : `<div class="field wide ass-scenario-field"><label>Kịch bản xử lý (tuỳ chọn)</label><div id="assScenarioBox" style="padding:2px 0">${assScenarioBoxHtml()}</div></div>`
        }
        ${parent
            ? `<div class="field wide"><label>Nội dung/yêu cầu</label><textarea id="assDesc" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu..."></textarea></div>
        <div class="field wide"><label>Đính kèm file</label><input id="assFileInput" type="file" multiple onchange="assHandleFiles(this)" /><div id="assFileList" style="margin-top:5px;font-size:12px;color:#8ab0c8">Chưa có file đính kèm.</div></div>`
            : ""
        }
      </div>
    </div>
    ${parent
            ? ""
            : `<div class="detail-card">
      <div class="card-head"><h4>Thông tin văn bản</h4><button type="button" class="ass-collapse" onclick="assToggleCard(this)" title="Thu gọn">−</button></div>
      <div class="form2 compact">
        <div class="field half"><label>Loại văn bản</label>${assSelectHtml(
                "assDocType",
                "Không gắn văn bản",
                [{ value: "", label: "Không gắn văn bản" }].concat(
                    docTypes.map(function (d) {
                        return {
                            value: String(d.value || d.code || ""),
                            label: String(d.title || d.name || d.value || d.code || ""),
                        };
                    }),
                ),
                "",
            )}</div>
        <div class="field wide"><label>Chọn văn bản (liên kết hệ thống quản lý văn bản)</label>
          <div id="assDocsList" style="margin-bottom:6px"></div>
          <button type="button" onclick="assOpenDocPicker()" style="border:1px dashed rgba(73,188,255,.45);background:rgba(44,125,210,.08);color:#49bcff;border-radius:10px;padding:9px 14px;cursor:pointer;font-size:13px;font-weight:700">+ Chọn văn bản từ hệ thống quản lý văn bản</button>
        </div>
        <div class="field wide"><label>Ý kiến xử lý</label><textarea id="assDesc" rows="3">Cập nhật dữ liệu đúng, đủ, sạch, sống; đính kèm file Excel/PDF hoặc minh chứng xử lý.</textarea></div>
        <div class="field wide"><label>Đính kèm file</label><input id="assFileInput" type="file" multiple onchange="assHandleFiles(this)" /><div id="assFileList" style="margin-top:5px;font-size:12px;color:#8ab0c8">Chưa có file đính kèm.</div></div>
      </div>
    </div>`
        }
    <div class="action-bar"><button class="primary" onclick="qlnvxCreateAssignment()">${parent ? "Phát hành nhiệm vụ nhánh" : "Phát hành nhiệm vụ"}</button>${parent ? `<button class="ghost" onclick="openScenarioSelector('${assEsc(parent.id)}')">⚡ Dùng kịch bản có sẵn</button>` : '<button class="ghost" onclick="assSaveDraft()">Lưu nháp</button>'}${!parent && draft ? '<button class="ghost danger-btn" onclick="assClearDraft()">Xóa nháp</button>' : ""}<button class="ghost" onclick="closeModal()">Hủy</button></div>`;
    openModal();
    /* Dấu vết nhiệm vụ cha: đặt SAU khi innerHTML đã ghi (dataset nằm trên chính
       #modalBody nên không bị innerHTML xóa). Form nhiệm vụ chính phải xóa hẳn, nếu không
       lần mở sau sẽ ăn nhầm cha cũ. */
    var mb = document.getElementById("modalBody");
    if (mb) {
        if (parent && parent.id) mb.dataset.assParentId = String(parent.id);
        else delete mb.dataset.assParentId;
    }
    assRenderDocList();
    assRenderFileList();
    assSyncFileInput();

    /* Danh mục CRM (nhóm lĩnh vực S3103 / độ khẩn DUT / loại nhiệm vụ LOAINHIEMVU) nằm ở
       /api/crm-source và PHẢI có Bearer token. Chưa nạp thì 3 select chỉ có option mặc định
       -> nạp xong vẽ lại form (giữ nguyên dữ liệu đang nhập), giống qlnv_v2 làm trước khi mở form. */
    // __assCrmTried: nạp lỗi (mất mạng/401) thì thôi, không lặp vô hạn mở lại form.
    if (!crmStatusCache.DUT && !window.__assCrmLoading && !window.__assCrmTried) {
        window.__assCrmLoading = true;
        window.__assCrmTried = true;
        Promise.all([
            assLoadCrm().then(assLoadLinhVuc),
            typeof loadOrganizationUnitOptions === "function"
                ? loadOrganizationUnitOptions()
                : null,
        ]).then(function () {
            window.__assCrmLoading = false;
            if (document.getElementById("assTitle"))
                qlnvxOpenAssignmentForm({ restore: assCaptureForm() });
        });
    }

    // Cây cơ cấu tổ chức nạp bất đồng bộ -> vẽ vào 2 ô sau khi có dữ liệu.
    assLoadOrgDirectory();
    Promise.all([assLoadOrgStructure(), assLoadCoordOrg()]).then(function (r) {
        /* HAI CÂY, HAI NGUỒN — đừng gộp:
            - ô "chủ trì" = CẤP DƯỚI của đơn vị mình, dựng từ user-tree (đúng phạm vi được cấp);
            - ô "phối hợp" = NGANG CẤP, dựng từ coordination-tree (nhìn ra ngoài phạm vi).
            Vẽ ô phối hợp bằng `coordOrg` chứ không phải `org`, nếu không assTreeHtml tra
            children trên cây sai và mọi node ngang cấp đều mở ra rỗng. */
        var org = r[0],
            coordOrg = r[1];
        var roots = assLeadRoots(org);
        var coordRoots = assCoordRoots(coordOrg);
        var unitBox = assFormEl("assUnitBox");
        var coordBox = assCoordBoxEl();
        var empty =
            '<div class="ass-empty" style="color:#8ab0c8;font-size:12.5px">Không có đơn vị trong phạm vi tài khoản (cơ cấu tổ chức chưa được cấp).</div>';
        var emptyCoord =
            '<div style="color:#8ab0c8;font-size:12.5px">Không có đơn vị ngang cấp trong cơ cấu tổ chức.</div>';
        if (unitBox)
            unitBox.innerHTML = roots.length
                ? assTreeHtml(org, roots, "lead", 0)
                : empty;
        /* Cán bộ đơn vị mình: nối phẳng vào CUỐI ô chủ trì — ô này chỉ có CẤP DƯỚI nên
            đơn vị mình thường không có trong đó, và đây là cách giao cho cán bộ ngang cấp
            trong chính đơn vị mình. assCanSelfPeople chặn trường hợp đơn vị đó vẫn nằm
            trong cây (mở ▸ đã thấy cán bộ) để không hiện TRÙNG hai lần. */
        var scopeRoots = assScopeRoots(org);
        var selfRoot = scopeRoots.length ? scopeRoots[0] : null;
        /* Đơn vị giao = đúng gốc mà cây đang bám (với viewAllUnits là gốc cây, không phải
            iddv trên token) — xem assCurrentUnitId. Người kiêm nhiệm nhiều đơn vị thì danh
            nghĩa người giao vẫn là đơn vị PRIMARY. */
        window.__assGiverUnitId = selfRoot && selfRoot.id != null ? selfRoot.id : null;
        /* Nối khối cán bộ cho TỪNG đơn vị của tài khoản: đơn vị kiêm nhiệm thứ hai cũng
            không nằm trong ô chủ trì (assLeadRoots loại "chính mình"), nên không nối thì
            cán bộ của nó không chọn được ở đâu cả. */
        if (unitBox)
            scopeRoots.forEach(function (sr) {
                if (assCanSelfPeople(roots, sr)) assRenderSelfPeople(unitBox, sr);
            });
        /* Cây chỉ có ĐÚNG 1 đơn vị (tài khoản xã/phường chỉ được cấp trục của mình): mọi
            lựa chọn thật sự đều nằm bên trong nó -> mở sẵn, khỏi bắt người dùng bấm ▸ vào
            dòng duy nhất mới thấy cán bộ. Nhiều đơn vị thì vẫn thu gọn như cũ. */
        if (unitBox && roots.length === 1) {
            var only = unitBox.querySelector(".ass-node > .qlnv-tree-row > .qlnv-tree-arrow");
            if (only && only.tagName === "BUTTON") assToggleNode(only);
        }
        if (coordBox)
            coordBox.innerHTML = coordRoots.length
                ? assTreeHtml(coordOrg, coordRoots, "coord", 0)
                : emptyCoord;
        // Nạp bù danh sách đơn vị cho bộ lọc "Đơn vị chủ trì" (dùng lại cây đã cache).
        if (
            !(window.__orgLeadUnitOptions || []).length &&
            typeof loadOrganizationUnitOptions === "function"
        )
            loadOrganizationUnitOptions();
        /* FORM NHÁNH: chưa có state khôi phục thì điền sẵn theo hồ sơ CHA (lĩnh vực, loại
           văn bản, độ khẩn, ngày) — giống qlnv_v2 kế thừa hồ sơ cha khi dựng body nhánh. */
        var state = restore || (draft && draft.form) || null;
        if (!state && parent) {
            state = {
                field: parent.field || "",
                docType: parent.docType || "",
                urgency: parent.urgency || "",
                start: parent.start || "",
                due: parent.due || "",
            };
        }
        if (draft && !restore) {
            window.__assDocs = draft.docs || [];
            window.__assScenario = draft.scenario || "";
            assRenderDocList();
            var sBox = assFormEl("assScenarioBox");
            if (sBox) sBox.innerHTML = assScenarioBoxHtml();
            toast("Đã khôi phục nháp nhiệm vụ đã lưu.");
        }
        assApplyForm(state);
    });
}

/* Route v2 nhận đơn vị theo dashboardId | iddv datamart | _id Mongo -> gửi thẳng id SỐ
   của organization-structure, không phải quy đổi tên sang ObjectId như route cũ. */
var ASS_CREATE_V2_URL = `${urlAPI}/api/qlnv/v2/nhiem-vu`;

/* Đơn vị đang đăng nhập, suy từ token qua /qlnv/v2/pham-vi. */
function assCurrentUnitId() {
    /* donViGiao/donViTao CHỈ lấy từ token (/pham-vi). Đường lùi cũ về `idDashBoard` đóng
        dấu đơn vị giao sai (58 -> iddv 1427 = UBND phường Việt Hưng); BE thấy xã/phường
        giao thì bỏ đồng bộ BMM nên nhiệm vụ không sang Bkav. Không suy được -> null để
        nơi gọi chặn phát hành.
        `__assGiverUnitId` chỉ khác iddv với tài khoản viewAllUnits (xem assScopeRoot): khi
        đó đơn vị giao là GỐC CÂY, để id gửi lên khớp với cây đang hiện và với nhãn "người
        giao". Nó do luồng vẽ cây đặt sau khi cây nạp xong; chưa có thì vẫn dùng iddv. */
    if (window.__assGiverUnitId != null) return Number(window.__assGiverUnitId);
    var iddv = __assScopeInfo && __assScopeInfo.iddv;
    return iddv != null ? Number(iddv) : null;
}

/* id đơn vị cho v2: giữ nguyên số của cây cơ cấu tổ chức. */
function assUnitIdForApi(v) {
    var n = Number(v);
    return isNaN(n) ? String(v) : n;
}

/* POST /api/qlnv/v2/nhiem-vu — BẮT BUỘC Bearer token (BE suy `create_user` từ token).
   BE có thể trả HTTP 200 kèm status 0/400 nên phải soi cả body chứ không chỉ r.ok. */
/* Token route v2: localStorage -> token trong bộ nhớ -> lấy mới qua proxy. */
function assAccessToken() {
    var t = "";
    try {
        t = localStorage.getItem("qlnv_jwt_access_token") || "";
    } catch (e) { }
    t = t || readQlnvToken() || "";
    if (t) return Promise.resolve(t);
    return getQlnvToken().catch(function () {
        return "";
    });
}

/* Thiếu token thì dừng ngay tại FE thay vì để BE trả 401. */
function assAuthHeaders() {
    return assAccessToken().then(function (tk) {
        if (!tk)
            throw new Error(
                "Thiếu token đăng nhập, đăng nhập lại rồi thử lại.",
            );
        return {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + tk,
        };
    });
}

function assCreateTaskV2(body) {
    return assAuthHeaders()
        .then(function (headers) {
            return fetch(ASS_CREATE_V2_URL, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            });
        })
        .then(function (r) {
            return r.json().then(
                function (res) {
                    return { ok: r.ok, res: res };
                },
                function () {
                    return { ok: r.ok, res: null };
                },
            );
        })
        .then(function (out) {
            var res = out.res;
            var st = res && res.status;
            if (!out.ok || (st != null && Number(st) !== 1)) {
                throw new Error(
                    (res && res.message) ||
                    "Tạo nhiệm vụ thất bại (HTTP " + (out.ok ? 200 : "lỗi") + ")",
                );
            }
            return res;
        });
}

/* Ghi đính kèm cho nhiệm vụ ĐÃ tạo. Ưu tiên taskId BKAV, fallback docId (_id Mongo) vì
    nhiệm vụ do xã/phường giao không mirror BMM. */
function assSaveDinhKemV2(ref, payload) {
    var body = Object.assign({}, payload);
    var soBmm = ref && ref.bmmTaskId != null ? String(ref.bmmTaskId) : "";
    if (soBmm) body.taskId = Number(soBmm) || soBmm;
    else if (ref && ref.docId) body.docId = String(ref.docId);
    else return Promise.reject(new Error("Thiếu định danh nhiệm vụ vừa tạo"));
    return assAuthHeaders()
        .then(function (headers) {
            return fetch(`${urlAPI}/api/qlnv/v2/nhiem-vu/tep-dinh-kem`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            });
        })
        .then(function (r) {
            return r.json().then(
                function (res) {
                    return { ok: r.ok, res: res };
                },
                function () {
                    return { ok: r.ok, res: null };
                },
            );
        })
        .then(function (out) {
            var st = out.res && out.res.status;
            if (!out.ok || (st != null && Number(st) !== 1))
                throw new Error(
                    (out.res && out.res.message) || "Lưu đính kèm thất bại",
                );
            return out.res;
        });
}

/* ============================================================
 * TẠO NHIỆM VỤ NHÁNH TỪ KỊCH BẢN khi vừa PHÁT HÀNH nhiệm vụ cha
 * (port từ createScenarioSubtasksForNewTask của block_cms_ioc/task/qlnv_v2.js).
 * TRƯỚC ĐÂY ô "Kịch bản xử lý" ở form giao nhiệm vụ CHỈ nối tiêu đề + mốc SLA vào
 * `yKienChiDao` -> các việc con khai trong `scenario.tasks` KHÔNG bao giờ được tạo.
 * Giờ mỗi việc = 1 POST /api/qlnv/v2/nhiem-vu với loaiNV=NHIEM_VU_CON + parentId,
 * TẤT CẢ giao về ĐÚNG đơn vị nhận của nhiệm vụ cha (tên đơn vị trong template chỉ là
 * NHÃN CHỮ — "Trực IOC/CAD", "Đơn vị chủ trì"… — không phải id nên không POST được).
 * ============================================================ */
/* parentId cho nhánh: ưu tiên task_id BKAV (SỐ, giống `taskId` mà get-task trả về và
   là giá trị luồng giao-nhánh tay đang dùng); chưa mirror BMM thì lùi về _id Mongo. */
function assCreatedParentId(res) {
    var mongo = res && res.data && res.data.mongo;
    var row = (Array.isArray(mongo) && mongo[0]) || null;
    if (!row) return "";
    if (row.bmmTaskId != null && String(row.bmmTaskId))
        return String(row.bmmTaskId);
    return String(row._id || row.id || "");
}
/* Body 1 nhánh sinh từ kịch bản — cùng bộ khóa với nhánh giao tay ở
   qlnvxCreateAssignmentImpl (loaiNV/parentId/status/capTrinh/mảng rỗng…). */
function assScenarioSubTaskBody(o) {
    var body = {
        loaiNV: "NHIEM_VU_CON",
        lanhDaoChiDaoId: o.leaderId,
        donViGiao: o.myUnit,
        donViChuTri: [o.ownerId],
        donViTao: o.myUnit,
        nguoiTaoId: o.leaderId,
        nguoiTaoNhiemVu: o.giver || null,
        nguoiTaoNhiemVuId: o.leaderId || null,
        nguoiGiaoNhiemVu: o.giver || null,
        nguoiThucHien: o.ownerLabel || null,
        tenNhiemVu: o.title,
        noiDungNhiemVu: o.description || o.title,
        ngayChiDao: o.startDate || undefined,
        ngayHetHan: o.dueDate,
        doKhan: o.doKhan || undefined,
        linhVuc: o.field || undefined,
        loaiVanBan: o.docType || undefined,
        status: 1,
        capTrinh: "1",
    };
    body[
        (typeof window !== "undefined" && window.QLNV_SUBTASK_PARENT_FIELD) ||
        "parentId"
    ] = String(o.parentId);
    if (o.field) body.nhiemVu = o.field; // app QLNV lưu nhóm lĩnh vực ở khóa `nhiemVu`
    [
        "donViThucHien",
        "vanBanDenDinhKem",
        "vanBanDiDinhKem",
        "hoSoCongViecLienQuan",
        "danhSachBaoCao",
        "donViLienQuan",
    ].forEach(function (k) {
        if (!Array.isArray(body[k])) body[k] = [];
    });
    return body;
}
/* Trả Promise<số nhánh tạo thành công>. Lỗi từng nhánh không chặn nhánh còn lại. */
function assCreateScenarioSubtasks(opts) {
    opts = opts || {};
    var key = opts.scenarioKey || "";
    var s =
        key && window.__scenarioTemplates ? window.__scenarioTemplates[key] : null;
    var tasks = (s && Array.isArray(s.tasks) && s.tasks) || [];
    if (!tasks.length) return Promise.resolve(0);
    if (!opts.parentId) {
        toast(
            'Đã tạo nhiệm vụ nhưng CHƯA tạo được nhánh theo kịch bản "' +
            ((s && s.title) || key) +
            '" (thiếu mã nhiệm vụ cha) — vào chi tiết nhiệm vụ để giao nhánh.',
        );
        return Promise.resolve(0);
    }
    toast("Đang tạo " + tasks.length + " nhiệm vụ nhánh theo kịch bản…");
    return Promise.all(
        tasks.map(function (t) {
            // t = [tên việc, nội dung, tên đơn vị (NHÃN, không dùng), ...]
            return assCreateTaskV2(
                assScenarioSubTaskBody({
                    parentId: opts.parentId,
                    leaderId: opts.leaderId,
                    myUnit: opts.myUnit,
                    giver: opts.giver,
                    ownerId: opts.ownerId,
                    ownerLabel: opts.ownerLabel,
                    title: t[0],
                    description: t[1] || t[0],
                    startDate: opts.startDate,
                    dueDate: opts.dueDate,
                    doKhan: opts.doKhan,
                    field: opts.field,
                    docType: opts.docType,
                }),
            ).then(
                function () {
                    return true;
                },
                function (err) {
                    console.warn("[QLNV] Nhánh kịch bản lỗi:", t[0], err);
                    return false;
                },
            );
        }),
    ).then(function (results) {
        var ok = results.filter(Boolean).length;
        if (ok === tasks.length)
            toast("Đã tạo " + ok + " nhiệm vụ nhánh theo kịch bản.");
        else
            toast(
                "Tạo nhánh theo kịch bản: " +
                ok +
                "/" +
                tasks.length +
                " thành công (một số nhánh lỗi).",
            );
        return ok;
    });
}

/* Bọc try/catch: lỗi JS ở đoạn dựng body (đọc phần tử không có, dữ liệu thiếu…) trước
   đây làm hàm chết im lặng -> bấm "Phát hành" như không ăn. Giờ báo rõ ra toast + console. */
function qlnvxCreateAssignment() {
    try {
        return qlnvxCreateAssignmentImpl();
    } catch (err) {
        window.__assSubmitting = false;
        console.error("[QLNV] qlnvxCreateAssignment lỗi:", err);
        toast("Lỗi khi phát hành: " + ((err && err.message) || err));
    }
}
function qlnvxCreateAssignmentImpl() {
    /* Mọi lần dừng sớm đều log kèm state, để bấm "Phát hành" mà không thấy request lên
       Network thì mở Console là biết ngay chốt nào chặn (trước đây chỉ có toast). */
    function assBlock(reason, extra) {
        console.warn("[QLNV] Không phát hành được nhiệm vụ:", reason, extra || {});
        toast(reason);
    }
    if (window.__assSubmitting) {
        assBlock("Đang gửi nhiệm vụ, vui lòng đợi…");
        return;
    }
    /* Log mốc vào hàm: bấm "Phát hành" mà Console không có dòng này nghĩa là click không
       tới được hàm (nút bị block khác thay / handler inline bị chặn), khác hẳn với việc
       hàm chạy rồi dừng ở một chốt kiểm tra bên dưới. */
    console.log("[QLNV] qlnvxCreateAssignment: bắt đầu", {
        laNhanh: !!(window.__assParent || assRecallParent()),
    });
    var title = String(assVal("assTitle") || "").trim() || "Nhiệm vụ mới";
    /* Đọc THẲNG từ DOM nếu biến state chưa được cập nhật: `window.__assLeadUnit` chỉ
       được gán trong assOnLeadPick (chạy từ onchange inline). Nếu handler inline không
       chạy thì ô radio vẫn đang tick nhưng biến còn null -> chặn oan "Chưa chọn đơn vị
       nhận nhiệm vụ". Lấy ngay ô radio đang chọn làm nguồn tin cậy. */
    /* assResolveLead: global -> dấu vết trên DOM (#assUnitTriggerText.dataset) -> radio.
       Bổ sung nhánh DOM vì form có thể đã được vẽ lại sau khi người dùng chọn, lúc đó
       `window.__assLeadUnit` bị đặt null trong khi ô vẫn hiển thị đơn vị/người đã chọn. */
    var lead = assResolveLead();
    if (!lead || !lead.id) {
        assBlock("Chưa chọn đơn vị nhận nhiệm vụ.", {
            __assLeadUnit: lead,
            goiY: "Bấm vào tên đơn vị trong cây (radio), không chỉ mở rộng nhánh.",
        });
        return;
    }
    var dueVal = assVal("assDue");
    if (!dueVal) {
        assBlock("Chưa chọn hạn xử lý.", { assDue: dueVal });
        return;
    }
    var leadUnitId = assUnitIdForApi(lead.id);
    /* lanhDaoChiDaoId BẮT BUỘC là _id Employee (24 hex). id cán bộ lấy từ /can-bo là số
       BKAV nên KHÔNG dùng được ở đây -> luôn gửi id người đăng nhập, tên người nhận
       chuyển sang nguoiThucHien. */
    var leaderId = assCurrentUserId();
    if (!leaderId) {
        assBlock("Chưa xác định được tài khoản đăng nhập, thử tải lại trang.", {
            __assMe: window.__assMe,
            jwtPayload: assJwtPayload(),
        });
        return;
    }
    /* donViThucHien = đơn vị phối hợp, canBoThucHien = cán bộ phối hợp (canboId SỐ).
        Hai field riêng vì canboId và iddv trùng dải số -> gộp là BE 400 hoặc lưu sai vai. */
    var coordIds = [],
        coordNames = [],
        coordStaffIds = [];
    Array.from(assCheckedCoordInputs()).forEach(function (c) {
        /* Ô CÁN BỘ (.assCoordPerson): `value` là id cán bộ BKAV, KHÔNG phải id đơn vị ->
           phải lấy `data-unit-id`. Gửi nhầm id cán bộ vào donViThucHien là sai đơn vị. */
        var label = c.getAttribute("data-label") || String(c.value);
        if (c.classList.contains("assCoordPerson")) {
            // `value` của ô cán bộ là canboId BKAV (số) — gửi thẳng, KHÔNG quy sang đơn vị.
            var cbId = Number(c.value);
            if (!isNaN(cbId) && coordStaffIds.indexOf(cbId) < 0)
                coordStaffIds.push(cbId);
            return;
        }
        var id = assUnitIdForApi(c.value);
        if (String(id) === String(leadUnitId)) return; // không tự phối hợp với đơn vị nhận
        /* Tick cả đơn vị lẫn vài cán bộ trong CÙNG đơn vị -> id chỉ gửi 1 lần, nhưng TÊN
           thì giữ đủ để người nhận biết đích danh ai phối hợp. */
        if (coordIds.indexOf(id) < 0) coordIds.push(id);
        if (coordNames.indexOf(label) < 0) coordNames.push(label);
    });

    var startVal = assVal("assStart");
    var desc = assVal("assDesc");
    var scenario =
        window.__assScenario && window.__scenarioTemplates
            ? window.__scenarioTemplates[window.__assScenario]
            : null;
    var yKien = scenario
        ? `${desc}\n\nKịch bản áp dụng: ${scenario.title}. Mốc SLA: ${(scenario.sla || []).join("; ")}.`
        : desc;
    var urgencyItem = assFindCrmItem("DUT", assVal("assUrgency"));
    /* Form nhiệm vụ NHÁNH không có ô "Nhóm lĩnh vực"/"Loại văn bản" (theo mẫu rút gọn)
       -> kế thừa từ hồ sơ cha thay vì đọc phần tử không tồn tại (trước đây ném lỗi). */
    var assParentForm = window.__assParent || assRecallParent();
    var fieldName =
        assVal("assField") || (assParentForm && assParentForm.field) || "";
    var fieldItem = assFindCrmItem("S3103", fieldName);
    var dinhKem = assMapDocsToDinhKem(window.__assDocs || []);
    var myUnit = assCurrentUnitId();
    // Thiếu iddv thì dừng: đơn vị giao sai làm BE đi nhánh xã/phường, bỏ đồng bộ Bkav.
    if (myUnit == null) {
        assBlock("Chưa xác định được đơn vị của tài khoản, thử lại sau giây lát.");
        assLoadMyScope();
        return;
    }
    var giver = assCurrentUserName();

    // Body của POST /api/qlnv/v2/nhiem-vu — BE tự map + mirror sang BMM/datamart.
    var body = {
        // Top-level LUÔN là NHIEM_VU; NHIEM_VU_CON chỉ dùng cho nhiệm vụ nhánh (cần parentId).
        loaiNV: "NHIEM_VU",
        lanhDaoChiDaoId: leaderId,

        donViGiao: myUnit,
        donViChuTri: [leadUnitId],
        donViTao: myUnit,

        nguoiTaoId: leaderId,
        // Tra không ra tên -> gửi null, không bịa từ title tài khoản demo.
        nguoiTaoNhiemVu: giver || null,
        // BE đọc thẳng field này, không suy từ nguoiTaoId.
        nguoiTaoNhiemVuId: leaderId || null,
        nguoiGiaoNhiemVu: giver || null,
        nguoiThucHien:
            (window.__assLeadPerson && window.__assLeadPerson.name) ||
            lead.label ||
            null,

        tenNhiemVu: title,
        noiDungNhiemVu: desc || title,
        // Bỏ trống -> BE tự sinh mã từ BMM.
        soVanBan: String(assVal("assCode") || "").trim() || undefined,
        ngayChiDao: startVal || undefined,
        ngayHetHan: dueVal,
        // doKhan là MÃ ("Ckhn", "Dthng"...) nằm ở `code`; `value` của DUT là số priority.
        doKhan: urgencyItem ? urgencyItem.code || urgencyItem.value : undefined,
        linhVuc: fieldItem
            ? fieldItem.title || fieldItem.name || fieldName
            : fieldName || undefined,
        loaiVanBan:
            assVal("assDocType") ||
            (assParentForm && assParentForm.docType) ||
            undefined,
        yKienChiDao: yKien || undefined,
    };
    // donViPhoiHopName chỉ gửi khi có ĐƠN VỊ phối hợp; bỏ trống thì BE tự dựng.
    if (coordIds.length) {
        body.donViThucHien = coordIds;
        body.donViPhoiHopName = coordNames.join(", ");
    }
    if (coordStaffIds.length) body.canBoThucHien = coordStaffIds;
    /* NHIỆM VỤ NHÁNH — theo buildQlnvSubTaskBody của filev2: cùng payload nhiệm vụ chính,
       chỉ đổi loaiNV sang NHIEM_VU_CON và gắn khóa cha `parentId` (đã kiểm chứng với route
       v2: POST xong thì GET /qlnv/v2/sub-task?taskId=<cha> trả đúng nhánh vừa tạo).
       Mã nhiệm vụ (soVanBan) KHÔNG kế thừa của cha — BMM báo trùng mã; form đã tự sinh mã mới. */
    var assParent = window.__assParent || assRecallParent();
    if (assParent && assParent.id) {
        body.loaiNV = "NHIEM_VU_CON";
        body[
            (typeof window !== "undefined" && window.QLNV_SUBTASK_PARENT_FIELD) ||
            "parentId"
        ] = assParent.id;
        /* Các field app QLNV LUÔN gửi kèm khi tạo nhánh (buildQlnvSubTaskBody) — thiếu thì
           BE có thể 400 hoặc lưu sai nhóm, và nhánh không hiện lại ở bảng nhiệm vụ nhánh. */
        if (body.status == null) body.status = 1;
        if (body.capTrinh == null) body.capTrinh = assParent.capTrinh || "1";
        // Nhóm lĩnh vực: app gửi khóa `nhiemVu` (KHÔNG phải `linhVuc`), kế thừa của cha.
        var nhomLinhVucCha = assParent.field || body.linhVuc;
        if (nhomLinhVucCha) body.nhiemVu = nhomLinhVucCha;
        if (assParent.ngayVanBan) body.ngayVanBan = assParent.ngayVanBan;
        // Payload thật dùng MẢNG RỖNG (không phải null) cho các danh sách.
        if (!Array.isArray(body.donViChuTri)) body.donViChuTri = [];
        if (!Array.isArray(body.donViThucHien)) body.donViThucHien = [];
        [
            "vanBanDenDinhKem",
            "vanBanDiDinhKem",
            "hoSoCongViecLienQuan",
            "danhSachBaoCao",
            "donViLienQuan",
        ].forEach(function (k) {
            if (!Array.isArray(body[k])) body[k] = [];
        });
    }
    /* vanBanDenDinhKem KHÔNG có trong bảng param của route v2 — gửi kèm để BE dùng nếu
       có hỗ trợ; nếu route bỏ qua thì văn bản đã chọn sẽ không được lưu. */
    // vanBanDenDinhKem: route create bỏ qua -> ghi bằng /tep-dinh-kem sau khi tạo.

    var files = window.__assFiles || [];
    // Kịch bản đang chọn — phải giữ TRƯỚC khi khối .then reset window.__assScenario.
    var scenarioKey = window.__assScenario || "";
    window.__assSubmitting = true;
    toast("Đang phát hành nhiệm vụ…");
    assCreateTaskV2(body)
        .then(function (res) {
            /* task_id BKAV (SỐ) cho path upload — nhánh xã/phường không mirror BMM nên
               bmmTaskId = null, khi đó file sẽ không đính được và báo rõ ở dưới. */
            var mongo = res && res.data && res.data.mongo;
            var row = (Array.isArray(mongo) && mongo[0]) || null;
            var bmmId = (row && row.bmmTaskId) || null;
            // Đính kèm ghi bằng API riêng; lỗi ở đây KHÔNG rollback nhiệm vụ.
            var dinhKemStep = dinhKem.length
                ? assSaveDinhKemV2(
                    { bmmTaskId: bmmId, docId: row && (row._id || row.docId) },
                    { vanBanDenDinhKem: dinhKem },
                ).catch(function (err) {
                    toast(
                        "Nhiệm vụ đã tạo nhưng văn bản đính kèm CHƯA lưu: " +
                        err.message,
                    );
                })
                : Promise.resolve();
            /* KỊCH BẢN XỬ LÝ: tạo luôn các nhiệm vụ nhánh (NHIEM_VU_CON) của nhiệm vụ vừa
               phát hành. Chỉ áp cho nhiệm vụ CHÍNH — nhánh không sinh tiếp nhánh. */
            var scenarioStep =
                scenarioKey && !assParent
                    ? assCreateScenarioSubtasks({
                        scenarioKey: scenarioKey,
                        parentId: assCreatedParentId(res),
                        leaderId: leaderId,
                        myUnit: myUnit,
                        giver: giver,
                        ownerId: leadUnitId,
                        ownerLabel:
                            (window.__assLeadPerson && window.__assLeadPerson.name) ||
                            lead.label ||
                            null,
                        startDate: startVal,
                        dueDate: dueVal,
                        doKhan: body.doKhan,
                        field: body.linhVuc,
                        docType: body.loaiVanBan,
                    }).catch(function () {
                        return 0; // lỗi tạo nhánh KHÔNG làm hỏng luồng của nhiệm vụ cha
                    })
                    : Promise.resolve(0);
            return Promise.all([dinhKemStep, scenarioStep]).then(function () {
                if (!files.length) return null;
                toast("Đang tải " + files.length + " file đính kèm…");
                return assUploadFiles(bmmId, files, (row && (row._id || row.docId)) || null).then(
                    function () {
                        toast("Đã đính " + files.length + " file vào nhiệm vụ.");
                    },
                    function (err) {
                        // Nhiệm vụ đã tạo -> không rollback, chỉ báo rõ file chưa đính.
                        toast("Nhiệm vụ đã tạo nhưng file CHƯA đính: " + err.message);
                    },
                );
            });
        })
        .then(function () {
            window.__assSubmitting = false;
            try {
                localStorage.removeItem(ASS_DRAFT_KEY);
            } catch (e) { }
            window.__assDocs = [];
            window.__assFiles = [];
            window.__assScenario = "";
            window.__assLeadUnit = null;
            window.__assLeadPerson = null;
            var doneParent = window.__assParent || assRecallParent();
            window.__assParent = null;
            closeModal();
            /* Vừa tạo nhánh -> mở lại hồ sơ cha để bảng "nhiệm vụ nhánh" nạp lại từ
               qlnv/v2/sub-task (thấy ngay nhánh mới), thay vì về dashboard. */
            if (doneParent && doneParent.id) {
                toast('Đã phát hành nhiệm vụ nhánh "' + title + '".');
                qlnvxOpenRecordDetail(doneParent.id);
                return;
            }
            /* renderAll() là no-op ở bản standalone -> nạp lại số liệu/danh sách từ API
               để nhiệm vụ vừa tạo hiện ngay (màn cấp khối 130/135/137 phải chờ ETL). */
            if (typeof loadAll4MetricsData === "function") {
                loadAll4MetricsData().then(function () {
                    if (typeof window.renderDrawerPie === "function") window.renderDrawerPie();
                    if (typeof window.renderDrawerPieLegend === "function") window.renderDrawerPieLegend();
                });
            }
            if (typeof loadAllListData === "function") loadAllListData();
            /* BÁO THÀNH CÔNG Ở BƯỚC CUỐI, kèm tên NV + đơn vị nhận.
               Trước đây toast "Đã tạo nhiệm vụ" bắn NGAY sau khi POST xong, rồi các toast
               upload file bắn đè lên (mỗi lúc chỉ hiện 1 toast), cuối cùng modal đóng cái
               rụp -> người giao không thấy báo gì, tưởng không lưu được. */
            toast(
                'Đã phát hành nhiệm vụ "' +
                title +
                '" tới ' +
                ((lead && lead.label) || "đơn vị nhận") +
                ".",
            );
            /* MỞ LUÔN DANH SÁCH "Nhiệm vụ giao" (theo filev2: tạo xong là mở list để thấy
               bản ghi mới). Nếu drawer đang mở sẵn thì chỉ nạp lại, không mở chồng. */
            if (document.getElementById("recordList")) {
                if (typeof loadDrawerAssignedListByFilters === "function")
                    loadDrawerAssignedListByFilters(1);
            } else if (typeof openList === "function") {
                window._type = "assigned";
                activeMetric = "assigned";
                openList({ metric: "assigned", title: "Nhiệm vụ giao" });
            }
            renderAll();
        })
        .catch(function (err) {
            window.__assSubmitting = false;
            console.error("[QLNV] create task failed:", err);
            toast(
                "Tạo nhiệm vụ thất bại: " + (err && err.message ? err.message : err),
            );
        });
}
function qlnvxOpenSubTaskForm(id) {
    console.log("id id", id);
    const r = records.find((x) => x.id === id);
    if (!r) return;
    document.getElementById("modalTitle").textContent = "Giao nhiệm vụ nhánh";
    document.getElementById("modalSub").textContent = r.id;
    document.getElementById("modalBody").innerHTML =
        `<div class="form2"><div class="field wide"><label>Nội dung việc nhánh</label><textarea id="subName" rows="3">Kiểm tra, đối chiếu và cập nhật minh chứng cho ${r.title}</textarea></div><div class="field"><label>Đơn vị nhận</label><select id="subOwner">${units.map((u) => `<option>${u}</option>`).join("")}</select></div><div class="field"><label>Hạn hoàn thành</label><input type="date" id="subDue" /></div></div><div class="action-bar"><button class="primary" onclick="saveSubTask('${id}')">Giao việc nhánh</button><button class="ghost" onclick="qlnvxOpenRecordDetail('${id}')">Quay lại hồ sơ</button></div>`;
    openModal();
}
// function saveSubTask(id) {
//   const r = records.find((x) => x.id === id);
//   if (!r) return;
//   r.subtasks.push({
//     name: document.getElementById("subName").value,
//     owner: document.getElementById("subOwner").value,
//     state: "Đang xử lý",
//   });
//   toast("Đã giao nhiệm vụ nhánh demo.");
//   qlnvxOpenRecordDetail(id);
// }
function openUpdateTask(id) {
    const r = records.find((x) => x.id === id);
    if (!r) return;
    document.getElementById("modalTitle").textContent = "Cập nhật nhiệm vụ";
    document.getElementById("modalSub").textContent = r.id;
    document.getElementById("modalBody").innerHTML =
        `<div class="form2"><div class="field"><label>Trạng thái</label><select id="upStatus">${statusDefs.map((s) => `<option value="${s.key}" ${r.status === s.key ? "selected" : ""}>${s.label}</option>`).join("")}</select></div><div class="field"><label>Tiến độ (%)</label><input id="upProgress" type="number" min="0" max="100" value="${r.progress}" /></div><div class="field wide"><label>Nội dung cập nhật</label><textarea id="upNote" rows="3">Cập nhật tiến độ xử lý, bổ sung minh chứng và đề xuất hướng xử lý tiếp theo.</textarea></div></div><div class="action-bar"><button class="primary" onclick="saveUpdateTask('${id}')">Lưu cập nhật</button><button class="ghost" onclick="qlnvxOpenRecordDetail('${id}')">Quay lại hồ sơ</button></div>`;
    openModal();
}
function saveUpdateTask(id) {
    const r = records.find((x) => x.id === id);
    if (!r) return;
    const old = r.status;
    const ns = document.getElementById("upStatus").value;
    r.status = ns;
    r.progress = Number(
        document.getElementById("upProgress").value || r.progress,
    );
    r.history.unshift({
        time: new Date().toLocaleString("vi-VN"),
        text: document.getElementById("upNote").value,
    });
    if (old !== ns && segmentTemplate[r.role]?.[r.metric]) {
        segmentTemplate[r.role][r.metric][old] -= 1;
        segmentTemplate[r.role][r.metric][ns] += 1;
    }
    renderAll();
    toast("Đã cập nhật nhiệm vụ và dashboard.");
    qlnvxOpenRecordDetail(id);
}

function toggleWidgetBody(btn) {
    const box =
        btn.closest(".widget") ||
        btn.closest(".widget-gd") ||
        btn.closest(".top-overview") ||
        btn.closest(".detail-card") ||
        btn.closest("article") ||
        btn.closest("section");
    if (!box) return;
    let body =
        box.querySelector(".widget-body") ||
        box.querySelector(".widget-body-gd") ||
        box.querySelector(".top-overview-body") ||
        box.querySelector(".card-body") ||
        box.querySelector(".v12-card-body");
    if (!body) {
        const head =
            btn.closest(".widget-head") ||
            btn.closest(".top-overview-head") ||
            btn.closest(".card-head") ||
            btn.closest(".iip-head") ||
            btn.closest("header");
        if (head && head.nextElementSibling) {
            body = head.nextElementSibling;
        }
    }
    if (!body) return;
    const isHidden = body.classList.toggle("hidden");
    if (isHidden) {
        body.style.setProperty("visibility", "hidden", "important");
        body.style.setProperty("opacity", "0", "important");
        body.style.setProperty("pointer-events", "none", "important");
    } else {
        body.style.removeProperty("visibility");
        body.style.removeProperty("opacity");
        body.style.removeProperty("pointer-events");
    }
    btn.textContent = isHidden ? "＋" : "−";
}
const widgetLabels = {
    summary: "Tổng quan KPI & chân dung vận hành",
    indicators: "Chỉ tiêu từng trục",
    sources: "Nguồn dữ liệu",
    axisDashboard: "Dashboard xử lý",
    notifications: "Notify IOC/CAD & Điều hành CAD",
    documents: "Văn bản đến/đi",
};
function prefKey() {
    return `px-ioc-hidden-${currentRole}`;
}
function getHiddenWidgets() {
    try {
        return JSON.parse(localStorage.getItem(prefKey()) || "[]");
    } catch (e) {
        return [];
    }
}
function setHiddenWidgets(arr) {
    localStorage.setItem(prefKey(), JSON.stringify(arr));
}
function renderCustomizer() {
    const hidden = getHiddenWidgets();
    document.getElementById("customList").innerHTML = Object.keys(widgetLabels)
        .map(
            (k) =>
                `<label><input type="checkbox" ${hidden.includes(k) ? "" : "checked"} onchange="toggleWidgetPref('${k}',this.checked)"/><span><b>${widgetLabels[k]}</b><br/><small class="muted">${hidden.includes(k) ? "Đang ẩn" : "Đang hiển thị"}</small></span></label>`,
        )
        .join("");
}
function toggleWidgetPref(k, show) {
    let hidden = getHiddenWidgets();
    if (show) hidden = hidden.filter((x) => x !== k);
    else if (!hidden.includes(k)) hidden.push(k);
    setHiddenWidgets(hidden);
    applyWidgetVisibility();
    renderCustomizer();
}
function applyWidgetVisibility() {
    const hidden = getHiddenWidgets();
    document
        .querySelectorAll("[data-widget]")
        .forEach((w) =>
            w.classList.toggle("hidden", hidden.includes(w.dataset.widget)),
        );
}
function toggleCustomizer() {
    document.getElementById("customizer").classList.toggle("open");
}
function openDrawer() {
    document.getElementById("overlay").classList.add("show");
    document.getElementById("drawer").classList.add("open");
}
function closeDrawer() {
    document.getElementById("drawer").classList.remove("open");
    if (typeof window.__drawerPieStatus !== "undefined") {
        window.__drawerPieStatus = "";
    }
    const subtaskElem = document.querySelector(".subtask-summary");
    if (subtaskElem) {
        subtaskElem.style.display = "block";
    }
    if (window.__drawerFilterState) {
        window.__drawerFilterState.status = "";
    }
    if (!document.getElementById("modal").classList.contains("open"))
        document.getElementById("overlay").classList.remove("show");
}
function openModal() {
    document.getElementById("overlay").classList.add("show");
    document.getElementById("modal").classList.add("open");
}
function closeModal() {
    document.getElementById("modal").classList.remove("open");
    if (!document.getElementById("drawer").classList.contains("open"))
        document.getElementById("overlay").classList.remove("show");
    window.__assParent = null;
    var mb = document.getElementById("modalBody");
    if (mb && mb.dataset) delete mb.dataset.assParentId;
}
function closePanels() {
    closeDrawer();
    closeModal();
    document.getElementById("customizer").classList.remove("open");
}
function toast(msg) {
    /* Trang nhúng dạng block CMS có thể KHÔNG có sẵn #toast -> trước đây t.textContent
       ném lỗi, làm hàm gọi nó (vd qlnvxCreateAssignment) chết giữa chừng và nhìn như "bấm
       không ăn". Thiếu thì tự tạo. */
    let t = document.getElementById("toast");
    if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        t.className = "toast";
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    /* Trang nhúng có thể KHÔNG nạp file.css -> .toast không có style, div nằm cuối body
       và người dùng không nhìn thấy thông báo (bấm nút như "không ăn"). Thiếu style thì
       tự đắp inline, và luôn ép z-index cao hơn modal (.modal z-index:110). */
    if (getComputedStyle(t).position !== "fixed") {
        t.style.cssText =
            "position:fixed;right:18px;bottom:18px;background:#06223f;color:#ecf7ff;" +
            "border:1px solid rgba(87,178,255,.45);border-radius:12px;padding:12px 14px;" +
            "box-shadow:0 15px 50px rgba(0,0,0,.4);max-width:420px;overflow-wrap:anywhere;" +
            "font-size:13px;line-height:1.45";
    }
    t.style.zIndex = "100000";
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => t.classList.remove("show"), 3000);
}

function extractCrmStatusList(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    var directKeys = ["data", "items", "rows", "results", "docs"];
    for (var i = 0; i < directKeys.length; i += 1) {
        var value = payload[directKeys[i]];
        if (Array.isArray(value)) return value;
        if (value && typeof value === "object") {
            var nested = extractCrmStatusList(value);
            if (nested.length) return nested;
        }
    }
    var objectKeys = Object.keys(payload);
    for (var j = 0; j < objectKeys.length; j += 1) {
        var child = payload[objectKeys[j]];
        if (child && typeof child === "object") {
            var childList = extractCrmStatusList(child);
            if (childList.length) return childList;
        }
    }
    return [];
}

function findCrmGroupByCode(list, code) {
    if (!Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i += 1) {
        var item = list[i];
        if (item && item.code === code) return item;
    }
    return null;
}

async function loadCrmStatusMapping() {
    var token = "";
    try {
        token = await getQlnvToken();
    } catch (e) {
        token = "";
    }
    var _crmHeaders = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };
    if (token) _crmHeaders.Authorization = "Bearer " + token;
    return fetch(CRM_STATUS_URL, { headers: _crmHeaders })
        .then(function (r) {
            if (!r.ok) throw new Error("CRM Status HTTP " + r.status);
            return r.json();
        })
        .then(function (res) {
            var data = extractCrmStatusList(res);
            crmStatusCache.DUT = findCrmGroupByCode(data, "DUT");
            crmStatusCache.S3103 = findCrmGroupByCode(data, "S3103");
            crmStatusCache.S3Z03 = findCrmGroupByCode(data, "S3Z03");
            crmStatusCache.LOAINHIEMVU = findCrmGroupByCode(data, "LOAINHIEMVU");
            crmStatusCache.S3O03 = findCrmGroupByCode(data, "S3O03");
            return crmStatusCache;
        })
        .catch(function (err) {
            console.warn("[CRM] Load failed:", err);
            return crmStatusCache;
        });
}

/* Danh sách đơn vị cho bộ lọc "Đơn vị chủ trì" — lấy từ cây user-tree
   (cùng nguồn với cây chọn đơn vị ở form giao nhiệm vụ), KHÔNG dùng /organization-units nữa:
   - organization-units là danh sách phẳng theo ObjectId, không có phạm vi cấp dưới;
   - API danh sách nhiệm vụ lọc bằng `iddvChuTri` và BE bắt buộc SỐ NGUYÊN DƯƠNG
     (xem be_qlnv taskFilters), nên option phải mang id SỐ của cây chứ không phải tên đơn vị.
   Phạm vi = đơn vị của tài khoản + toàn bộ cấp dưới; không tra được đơn vị mình trong
   cây thì danh sách RỖNG như trước (select rơi về danh mục dự phòng), không tự nới ra
   cả cây kẻo lọc rộng hơn quyền. */
function loadOrganizationUnitOptions() {
    return assLoadOrgStructure()
        .then(function (org) {
            var root = assScopeRoot(org);
            var out = [];
            var seen = {};
            function walk(node) {
                if (!node || node.id == null) return;
                var key = String(node.id);
                if (seen[key]) return; // cây có thể tự tham chiếu vòng -> chặn lặp vô hạn
                seen[key] = 1;
                out.push({ id: key, name: node.name || node.fullName || key });
                (org.children[key] || []).forEach(walk);
            }
            walk(root);
            window.__orgLeadUnitOptions = out;
            return out;
        })
        .catch(function (err) {
            console.warn("[ORG] Load failed:", err);
            window.__orgLeadUnitOptions = [];
            return window.__orgLeadUnitOptions;
        });
}

(function () {
    const v10BootTime = Date.now();
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
            mode: "Rule engine / SOP",
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
    window.__v10Sources = sourceDefs;

    function dt(ts) {
        const d = new Date(ts);
        return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
    function rel(ts) {
        const diff = Math.max(0, Date.now() - ts);
        const s = Math.floor(diff / 1000);
        if (s < 60) return `${s} giây trước`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m} phút trước`;
        const h = Math.floor(m / 60),
            mm = m % 60;
        if (h < 24) return `${h} giờ${mm ? ` ${mm} phút` : ""} trước`;
        const d = Math.floor(h / 24),
            hh = h % 24;
        return `${d} ngày${hh ? ` ${hh} giờ` : ""} trước`;
    }
    function sourceAt(s) {
        return v10BootTime - s.offset;
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

    function v10AddDays(base, n) {
        const d = new Date(base);
        d.setDate(d.getDate() + n);
        return d;
    }
    function v10Iso(d) {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    function v10ParseISO(s) {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m - 1, d);
    }
    function v10EnsureCalendarEvents() {
        if (window.__calendarEvents) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const templates = {
            DANG: [
                "Giao ban Thường trực Đảng ủy",
                "Họp Ban Thường vụ Đảng ủy",
                "Làm việc về Nghị quyết 57",
                "Kiểm điểm tiến độ công tác Đảng viên",
                "Họp tuyên giáo - dân vận",
                "Rà soát văn bản chỉ đạo",
            ],
            HDND: [
                "Họp Thường trực HĐND",
                "Phiên giải trình chuyên đề",
                "Giám sát kiến nghị cử tri",
                "Chuẩn bị kỳ họp HĐND",
                "Rà soát dự thảo nghị quyết",
                "Họp tổ đại biểu HĐND",
            ],
            UBND: [
                "Giao ban lãnh đạo UBND",
                "Họp xử lý TTHC sắp hạn",
                "Họp thu ngân sách - an sinh",
                "Họp đô thị, môi trường, PCCC",
                "Họp GPMB dự án trọng điểm",
                "Họp chuyển đổi số dữ liệu IOC",
            ],
            MTTQ: [
                "Họp Ban Thường trực MTTQ",
                "Họp phản biện xã hội",
                "Họp quỹ ủng hộ và an sinh",
                "Họp Đoàn Thanh niên - Hội Phụ nữ",
                "Họp giám sát cộng đồng",
                "Họp tổng hợp dư luận xã hội",
            ],
        };
        const counts = { DANG: 18, HDND: 17, UBND: 15, MTTQ: 9 };
        let id = 1;
        const events = [];
        Object.keys(counts).forEach((role) => {
            for (let i = 0; i < counts[role]; i++) {
                const offsets = [
                    -8, -3, -1, 0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22, 27, 31, 38, 45,
                ];
                const d = v10AddDays(
                    today,
                    offsets[i % offsets.length] +
                    (role === "UBND" ? 1 : role === "MTTQ" ? 2 : 0),
                );
                const late = d < today && i % 3 !== 0;
                const done = d < today && !late;
                events.push({
                    id: `MEET-${role}-${String(id++).padStart(3, "0")}`,
                    role,
                    date: v10Iso(d),
                    time: ["07:45", "08:00", "08:30", "09:00", "14:00", "15:30"][i % 6],
                    end: ["09:00", "09:30", "10:30", "11:00", "15:30", "16:30"][i % 6],
                    title: `${templates[role][i % templates[role].length]} ${i + 1}`,
                    venue: [
                        "Phòng họp Đảng ủy",
                        "Hội trường UBND",
                        "Phòng họp HĐND",
                        "Phòng giao ban IOC",
                        "Nhà văn hóa trung tâm",
                    ][i % 5],
                    chair:
                        role === "DANG"
                            ? "Bí thư Đảng ủy"
                            : role === "HDND"
                                ? "Chủ tịch HĐND"
                                : role === "UBND"
                                    ? "Chủ tịch UBND"
                                    : "Chủ tịch MTTQ",
                    secretary: [
                        "Văn phòng Đảng ủy",
                        "Văn phòng HĐND",
                        "Văn phòng UBND",
                        "Cán bộ MTTQ",
                    ][i % 4],
                    participants: [
                        axisMeta[role].name,
                        "Văn phòng",
                        "Công chức chuyên môn",
                        i % 2 ? "Đơn vị phối hợp" : "Tổ chuyển đổi số",
                        i % 3 ? "Đại diện thôn/tổ dân phố" : "Công an phường",
                    ],
                    agenda: `Chuẩn bị nội dung, rà soát số liệu IOC, kết luận giao nhiệm vụ và cập nhật tiến độ sau họp cho ${axisMeta[role].name}.`,
                    docs: [
                        `Tài liệu_họp_${role}_${i + 1}.pdf`,
                        `Dự_thảo_kết_luận_${i + 1}.docx`,
                    ],
                    rawStatus: done ? "done" : late ? "late" : "planned",
                    prepared: i % 4 !== 1,
                    confirmed: i % 5 !== 2,
                });
            }
        });
        window.__calendarEvents = events;
    }
    function v10EventState(e) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = v10ParseISO(e.date);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / 86400000);
        if (e.rawStatus === "late")
            return {
                key: "late",
                label: "Trễ xác nhận/chuẩn bị",
                icon: "⚠️",
                cls: "late",
            };
        if (e.rawStatus === "done")
            return { key: "done", label: "Đã hoàn thành", icon: "✅", cls: "done" };
        if (diff === 0)
            return { key: "today", label: "Hôm nay", icon: "🔔", cls: "today" };
        if (diff > 0 && diff <= 7)
            return {
                key: "upcoming",
                label: "Sắp diễn ra",
                icon: "⏰",
                cls: "upcoming",
            };
        return { key: "planned", label: "Đã lên lịch", icon: "📅", cls: "planned" };
    }
    function v10CalendarForScope() {
        v10EnsureCalendarEvents();
        return (window.__calendarEvents || []).filter((e) =>
            allowedRoles().includes(e.role),
        );
    }
    function v10CalendarCounts() {
        const out = { today: 0, upcoming: 0, late: 0, planned: 0, done: 0 };
        v10CalendarForScope().forEach((e) => out[v10EventState(e).key]++);
        return out;
    }
    function v10DateShort(e) {
        const d = v10ParseISO(e.date);
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
    }
    function v10FreshnessStrip() {
        return `<div class="freshness-strip">${sourceDefs
            .map((s) => {
                const t = sourceAt(s);
                return `<button class="freshness-chip" onclick="openSourceDetail('${s.key}')"><div class="dot">${s.icon}</div><div><b>${s.name}</b><small>${dt(t)} · <em>${rel(t)}</em></small><small>${s.freq}</small></div></button>`;
            })
            .join("")}</div>`;
    }

    renderSources = window.renderSources = function () {
        const box = document.getElementById("sourceList");
        if (!box) return;
        box.classList.add("v10-source-list");
        box.innerHTML = sourceDefs
            .map((s) => {
                const t = sourceAt(s);
                const cls = freshnessClass(s);
                return `<button class="source-item v10-source" onclick="openSourceDetail('${s.key}')"><div class="dot">${s.icon}</div><div><b>${s.name}</b><small>${s.desc}</small><small class="source-update-line ${cls}">🕒 <span class="time">${dt(t)}</span><span>·</span><span class="rel">${rel(t)}</span></small><div class="source-quality"><span>${s.mode}</span><span>${s.freq}</span><span>Độ tin cậy ${s.quality}</span></div></div><div class="source-badge-stack"><span class="badge ${s.status === "ok" ? "ok" : s.status === "late" ? "warn" : "red"}">${s.count}</span><span class="badge">${fmt(s.rows)} dòng</span></div></button>`;
            })
            .join("");
    };

    openSourceDetail = window.openSourceDetail = function (keyOrName) {
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
            result:
                i === 3 && s.status === "late" ? "Có cảnh báo chậm" : "Thành công",
        }));
        document.getElementById("modalTitle").textContent =
            "Nguồn dữ liệu & cập nhật · " + s.name;
        document.getElementById("modalSub").textContent =
            `Lần cập nhật gần nhất: ${dt(t)} · ${rel(t)} so với hiện tại`;
        document.getElementById("modalBody").innerHTML =
            `<div class="record-update-note">🕒 <b>${s.name}</b> cập nhật gần nhất lúc <b>${dt(t)}</b>, tương đương <b>${rel(t)}</b>. Thông tin này được hiển thị đồng bộ ở dashboard chính và màn chi tiết nguồn.</div><div class="freshness-grid"><div class="freshness-kpi"><span>Thời điểm cập nhật</span><b>${dt(t)}</b><small>${rel(t)}</small></div><div class="freshness-kpi"><span>Tần suất/SLA</span><b>${s.freq}</b><small>${s.mode}</small></div><div class="freshness-kpi"><span>Bản ghi/kết nối</span><b>${fmt(s.rows)}</b><small>${s.count} · chủ quản: ${s.owner}</small></div><div class="freshness-kpi"><span>Chất lượng dữ liệu</span><b class="${s.status === "ok" ? "ok" : s.status === "late" ? "warn" : "danger"}">${s.quality}</b><small>${s.status === "ok" ? "Đúng hạn" : "Cần rà soát cập nhật"}</small></div></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nguồn</h4><div class="kv"><b>Tên nguồn</b><span>${s.name}</span><b>Mô tả</b><span>${s.desc}</span><b>Cơ chế</b><span>${s.mode}</span><b>Tần suất</b><span>${s.freq}</span><b>Đơn vị phụ trách</b><span>${s.owner}</span><b>Kiểm tra dữ liệu</b><span>Đúng · đủ · sạch · sống · audit log</span></div></div><div class="detail-card"><h4>Data health</h4><div class="data-health"><div><b>Đúng</b><span>Kiểm tra định dạng/mã đơn vị</span></div><div><b>Đủ</b><span>${fmt(s.rows)} dòng có khóa định danh</span></div><div><b>Sạch</b><span>Tỷ lệ trùng lặp thấp, ${s.quality}</span></div><div><b>Sống</b><span>${dt(t)} · ${rel(t)}</span></div></div><div class="action-bar" style="margin-top:12px"><button class="primary" onclick="toast('Đã chạy đồng bộ thử nguồn ${s.name}')">Đồng bộ thử</button><button class="ghost" onclick="toast('Đã mở màn import Excel cho ${s.name}')">Import Excel</button><button class="ghost" onclick="toast('Đã tạo cảnh báo lỗi dữ liệu nguồn ${s.name}')">Cảnh báo lỗi</button><button class="ghost" onclick="toast('Đã gửi yêu cầu xác nhận số liệu tới ${s.owner}')">Yêu cầu xác nhận</button></div></div></div><div class="detail-card"><h4>Nhật ký đồng bộ gần nhất</h4><div class="sync-timeline">${jobs.map((j) => `<div class="sync-job"><b>${dt(j.time)}</b><span><b>${j.type}</b><br/><small>${fmt(j.rows)} bản ghi · kiểm tra schema, mã đơn vị, trạng thái xử lý</small></span><span class="badge ${j.result === "Thành công" ? "ok" : "warn"}">${j.result}</span></div>`).join("")}</div></div>`;
        openModal();
    };

    // Bổ sung cập nhật gần nhất cho bảng/hồ sơ nhiệm vụ sau khi mở cấp 2.
    const v10OldRenderRecordDetail =
        window.qlnvxRenderRecordDetail || qlnvxRenderRecordDetail;
    qlnvxRenderRecordDetail = window.qlnvxRenderRecordDetail = function (
        r,
        limited,
        tab,
    ) {
        v10OldRenderRecordDetail(r, limited, tab);
        const modalBody = document.getElementById("modalBody");
        if (!modalBody || !r) return;
        const source =
            r.metric === "docIn" || r.metric === "docOut"
                ? getSource("docs")
                : r.metric === "indicator"
                    ? getSource("db")
                    : getSource("api");
        const t = sourceAt(source);
        const note = `<div class="record-update-note">Nguồn dữ liệu liên quan: <b>${source.name}</b> · cập nhật gần nhất <b>${dt(t)}</b> · <b>${rel(t)}</b> · SLA ${source.freq}.</div>`;
        if (!modalBody.querySelector(".record-update-note"))
            modalBody.insertAdjacentHTML("afterbegin", note);
    };

    // Cập nhật nhãn widget nếu có cấu hình ẩn/hiện.
    if (typeof widgetLabels !== "undefined")
        widgetLabels.sources = "Nguồn dữ liệu & cập nhật gần nhất";

    // Khi đang ở app, làm mới mốc thời gian tương đối mỗi phút.
    setInterval(() => {
        if (!document.getElementById("app")?.classList.contains("hidden")) {
            renderSources();
            renderSummary();
        }
    }, 60000);
})();

(function () {
    const pieColors = {
        metric: ["#2fb174", "#2c7dd2", "#d8a50c", "#8b5cf6"],
        alert: ["#d8a50c", "#d25a19", "#d33a44", "#ff4c4c", "#39d5ff"],
    };
    const alertSources = [
        {
            name: "Rule engine IOC",
            desc: "Tự sinh từ SLA: sắp hạn, nguy cơ trễ, quá hạn",
        },
        {
            name: "API/CSDL sự kiện",
            desc: "Điểm nghẽn TTHC, văn bản, hồ sơ một cửa",
        },
        {
            name: "Calendar thư ký",
            desc: "Lịch họp sắp diễn ra, trễ xác nhận/tài liệu",
        },
        {
            name: "Nhập thủ công",
            desc: "Cán bộ trực IOC nhập notify mới tại mục 6",
        },
    ];
    window.__manualNotis = window.__manualNotis || [];

    function v11Arc(cx, cy, r, start, end) {
        const rad = (a) => ((a - 90) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(rad(start)),
            y1 = cy + r * Math.sin(rad(start));
        const x2 = cx + r * Math.cos(rad(end)),
            y2 = cy + r * Math.sin(rad(end));
        const large = end - start > 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    }

    function isoV11(d) {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    function addDaysV11(base, n) {
        const d = new Date(base);
        d.setDate(d.getDate() + n);
        return d;
    }
    function parseIsoV11(s) {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m - 1, d);
    }
    function ensureCalendarEventsV11() {
        if (window.__calendarEvents) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const templates = {
            DANG: [
                "Giao ban Thường trực Đảng ủy",
                "Họp Ban Thường vụ Đảng ủy",
                "Làm việc về Nghị quyết 57",
            ],
            HDND: [
                "Họp Thường trực HĐND",
                "Phiên giải trình chuyên đề",
                "Giám sát kiến nghị cử tri",
            ],
            UBND: [
                "Giao ban lãnh đạo UBND",
                "Họp xử lý TTHC sắp hạn",
                "Họp đô thị, môi trường, PCCC",
            ],
            MTTQ: [
                "Họp Ban Thường trực MTTQ",
                "Họp phản biện xã hội",
                "Họp quỹ ủng hộ và an sinh",
            ],
        };
        const counts = { DANG: 18, HDND: 17, UBND: 15, MTTQ: 9 };
        let id = 1;
        const events = [];
        Object.keys(counts).forEach((role) => {
            for (let i = 0; i < counts[role]; i++) {
                const offsets = [
                    -8, -3, -1, 0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22, 27, 31, 38, 45,
                ];
                const d = addDaysV11(
                    today,
                    offsets[i % offsets.length] +
                    (role === "UBND" ? 1 : role === "MTTQ" ? 2 : 0),
                );
                const late = d < today && i % 3 !== 0;
                const done = d < today && !late;
                events.push({
                    id: `MEET-${role}-${String(id++).padStart(3, "0")}`,
                    role,
                    date: isoV11(d),
                    time: ["07:45", "08:00", "08:30", "09:00", "14:00", "15:30"][i % 6],
                    end: ["09:00", "09:30", "10:30", "11:00", "15:30", "16:30"][i % 6],
                    title: `${templates[role][i % templates[role].length]} ${i + 1}`,
                    venue: [
                        "Phòng họp Đảng ủy",
                        "Hội trường UBND",
                        "Phòng họp HĐND",
                        "Phòng giao ban IOC",
                    ][i % 4],
                    chair:
                        role === "DANG"
                            ? "Bí thư Đảng ủy"
                            : role === "HDND"
                                ? "Chủ tịch HĐND"
                                : role === "UBND"
                                    ? "Chủ tịch UBND"
                                    : "Chủ tịch MTTQ",
                    secretary: [
                        "Văn phòng Đảng ủy",
                        "Văn phòng HĐND",
                        "Văn phòng UBND",
                        "Cán bộ MTTQ",
                    ][i % 4],
                    participants: [
                        axisMeta[role].name,
                        "Văn phòng",
                        "Công chức chuyên môn",
                        i % 2 ? "Đơn vị phối hợp" : "Tổ chuyển đổi số",
                    ],
                    agenda: `Chuẩn bị nội dung, rà soát số liệu IOC và kết luận giao nhiệm vụ cho ${axisMeta[role].name}.`,
                    docs: [`Tài_liệu_họp_${role}_${i + 1}.pdf`],
                    rawStatus: done ? "done" : late ? "late" : "planned",
                    prepared: i % 4 !== 1,
                    confirmed: i % 5 !== 2,
                });
            }
        });
        window.__calendarEvents = events;
    }
    function eventStateV11(e) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = parseIsoV11(e.date);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / 86400000);
        if (e.rawStatus === "late")
            return { key: "late", label: "Trễ xác nhận", icon: "⚠️" };
        if (e.rawStatus === "done")
            return { key: "done", label: "Đã hoàn thành", icon: "✅" };
        if (diff === 0) return { key: "today", label: "Hôm nay", icon: "🔔" };
        if (diff > 0 && diff <= 7)
            return { key: "upcoming", label: "Sắp diễn ra", icon: "⏰" };
        return { key: "planned", label: "Đã lên lịch", icon: "📅" };
    }
    function calForScopeV11() {
        ensureCalendarEventsV11();
        return (window.__calendarEvents || []).filter((e) =>
            allowedRoles().includes(e.role),
        );
    }
    function calCountsV11() {
        const out = { today: 0, upcoming: 0, late: 0, planned: 0, done: 0 };
        calForScopeV11().forEach((e) => out[eventStateV11(e).key]++);
        return out;
    }
    function dateShortV11(e) {
        const d = parseIsoV11(e.date);
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
    }

    function baseNotificationsV11() {
        const roles = allowedRoles();
        const base = [
            {
                id: "fire-market",
                icon: "🔥",
                role: "UBND",
                type: "Cháy nổ",
                level: "Khẩn",
                title: "Điểm nóng cháy nổ: cảnh báo khói tại khu chợ Việt Hưng",
                sub: "Nguồn: API/CSDL sự kiện + trực ban IOC. Cần kích hoạt SOP PCCC.",
                metric: "received",
                status: "risk",
                source: "API/CSDL sự kiện",
            },
            {
                id: "bottleneck-tthc",
                icon: "⏰",
                role: "UBND",
                type: "Điểm nghẽn TTHC",
                level: "Cao",
                title: "08 hồ sơ TTHC có nguy cơ quá hạn",
                sub: "Nguồn: Rule engine SLA từ hồ sơ một cửa; cần nhắc việc trong ngày.",
                metric: "received",
                status: "risk",
                source: "Rule engine IOC",
            },
            {
                id: "doc-backlog",
                icon: "📨",
                role: "UBND",
                type: "Điểm nghẽn văn bản",
                level: "Cao",
                title: "14 văn bản đến sắp đến hạn xử lý",
                sub: "Nguồn: API quản lý văn bản; cần phân công và cập nhật kết quả.",
                metric: "docIn",
                status: "soon",
                source: "API/CSDL sự kiện",
            },
            {
                id: "urban-env",
                icon: "🚧",
                role: "UBND",
                type: "Đô thị/môi trường",
                level: "Trung bình",
                title: "Tồn tại phản ánh đô thị, vệ sinh môi trường",
                sub: "Nguồn: Notify thủ công + phản ánh hiện trường; cần giao kiểm tra.",
                metric: "received",
                status: "soon",
                source: "Nhập thủ công",
            },
            {
                id: "hdnd-voter",
                icon: "🏛️",
                role: "HDND",
                type: "Giám sát",
                level: "Trung bình",
                title: "03 kiến nghị cử tri chưa cập nhật kết quả",
                sub: "Nguồn: Rule engine HĐND; giám sát tiến độ xử lý.",
                metric: "received",
                status: "soon",
                source: "Rule engine IOC",
            },
            {
                id: "mttq-social",
                icon: "🤝",
                role: "MTTQ",
                type: "Phản biện",
                level: "Trung bình",
                title: "02 báo cáo phản biện cần xác nhận số liệu",
                sub: "Nguồn: Excel/MTTQ; cần đồng bộ dữ liệu tháng.",
                metric: "received",
                status: "risk",
                source: "Excel import",
            },
            {
                id: "party-resolution",
                icon: "🚩",
                role: "DANG",
                type: "Nghị quyết",
                level: "Cao",
                title: "06 nhiệm vụ nghị quyết chuyên đề cần kiểm tra",
                sub: "Nguồn: Rule engine Đảng ủy; báo cáo Ban Thường vụ.",
                metric: "assigned",
                status: "risk",
                source: "Rule engine IOC",
            },
        ].filter((n) => roles.includes(n.role));
        const manual = (window.__manualNotis || []).filter((n) =>
            roles.includes(n.role),
        );
        ensureCalendarEventsV11();
        const cal = calCountsV11();
        const calendarNotis = [];
        if (cal.upcoming + cal.today > 0)
            calendarNotis.push({
                id: "calendar-upcoming",
                icon: "📅",
                role: roles[0] || currentRole,
                type: "Lịch họp",
                level: "Trung bình",
                title: `${fmt(cal.upcoming + cal.today)} lịch họp sắp diễn ra/hôm nay`,
                sub: "Nguồn: Calendar thư ký; mở calendar để nhắc thành phần tham dự.",
                metric: "received",
                status: "soon",
                source: "Calendar thư ký",
                calendar: true,
            });
        if (cal.late > 0)
            calendarNotis.push({
                id: "calendar-late",
                icon: "⚠️",
                role: roles[0] || currentRole,
                type: "Thư ký",
                level: "Cao",
                title: `${fmt(cal.late)} lịch họp trễ xác nhận/chuẩn bị`,
                sub: "Nguồn: Calendar thư ký; cần giao nhiệm vụ chuẩn bị tài liệu.",
                metric: "received",
                status: "risk",
                source: "Calendar thư ký",
                calendar: true,
            });
        return [...base, ...calendarNotis, ...manual];
    }
    renderNotifications = window.renderNotifications = function () {
        const notis = baseNotificationsV11();
        window.__incidents = notis;
        const sourceHtml = `<div class="v11-notify-source"><h4>Notify IOC/CAD lấy thông tin từ đâu?</h4><p>Notify được tạo từ 04 nguồn: rule engine theo SLA, API/CSDL sự kiện, calendar thư ký và nhập thủ công bởi cán bộ trực IOC.</p><div class="notify-actions"><button class="primary" onclick="openNotifyForm()">＋ Nhập notify</button><button class="ghost" onclick="openNotifySourceConfig()">Cấu hình nguồn notify</button></div></div>`;
        const list =
            notis
                .map(
                    (n) =>
                        `<button class="notify" onclick="${n.calendar ? `openCalendar(null,'${n.title}', '${n.id === "calendar-late" ? "late" : "upcoming"}')` : `openIncidentDetail('${n.id}')`}"><div class="dot">${n.icon}</div><div><b>${n.title}</b></div><span class="badge ${n.level === "Khẩn" || n.status === "risk" ? "red" : "warn"}">${n.type}</span></button>`,
                )
                .join("") ||
            `<div class="access-lock">Không có notify trong phạm vi quyền hiện tại.</div>`;
        const box = document.getElementById("notifyList");
        if (box) {
            box.classList.add("v11");
            box.innerHTML = sourceHtml + list;
        }
    };
    openNotifyForm = window.openNotifyForm = function () {
        const roles = allowedRoles();
        document.getElementById("modalTitle").textContent = "Nhập notify IOC/CAD";
        document.getElementById("modalSub").textContent =
            "Nguồn: nhập thủ công bởi cán bộ trực IOC, sau khi lưu sẽ hiện ngay tại mục 6.";
        document.getElementById("modalBody").innerHTML =
            `<div class="manual-note">Notify thủ công dùng cho sự kiện phát sinh tại phường Việt Hưng như điểm nghẽn TTHC, phản ánh đô thị, cháy nổ, lịch họp trễ, văn bản khẩn. Dữ liệu demo được lưu trong phiên trình duyệt.</div><div class="form2"><div class="field"><label>Trục nhận notify</label><select id="notiRole">${roles.map((r) => `<option value="${r}">${axisMeta[r].name}</option>`).join("")}</select></div><div class="field"><label>Loại notify</label><select id="notiType"><option>Điểm nghẽn</option><option>Cháy nổ</option><option>TTHC</option><option>Văn bản</option><option>Lịch họp</option><option>Đô thị/môi trường</option></select></div><div class="field"><label>Mức độ</label><select id="notiLevel"><option>Khẩn</option><option selected>Cao</option><option>Trung bình</option></select></div><div class="field"><label>Gắn với hồ sơ</label><select id="notiMetric">${Object.keys(
                metricMeta,
            )
                .map((m) => `<option value="${m}">${metricMeta[m].label}</option>`)
                .join(
                    "",
                )}</select></div><div class="field wide"><label>Tiêu đề notify</label><textarea id="notiTitle" rows="2">Điểm nghẽn mới cần xử lý tại phường Việt Hưng</textarea></div><div class="field wide"><label>Khuyến nghị xử lý</label><textarea id="notiSub" rows="3">Đề nghị đơn vị chủ trì kiểm tra, cập nhật kết quả và đính kèm minh chứng trên IOC/CAD.</textarea></div></div><div class="action-bar"><button class="primary" onclick="saveNotify()">Lưu notify</button><button class="ghost" onclick="closeModal()">Hủy</button></div>`;
        openModal();
    };
    saveNotify = window.saveNotify = function () {
        const role = document.getElementById("notiRole").value,
            metric = document.getElementById("notiMetric").value;
        const type = document.getElementById("notiType").value,
            level = document.getElementById("notiLevel").value;
        const icon = type.includes("Cháy")
            ? "🔥"
            : type.includes("Lịch")
                ? "📅"
                : type.includes("Văn bản")
                    ? "📨"
                    : type.includes("Đô thị")
                        ? "🚧"
                        : "🔔";
        const n = {
            id: `manual-${Date.now()}`,
            icon,
            role,
            type,
            level,
            title: document.getElementById("notiTitle").value.trim() || "Notify mới",
            sub: document.getElementById("notiSub").value.trim() || "Cần xử lý",
            metric,
            status: level === "Khẩn" || level === "Cao" ? "risk" : "soon",
            source: "Nhập thủ công",
        };
        window.__manualNotis.push(n);
        closeModal();
        renderNotifications();
        toast("Đã nhập notify IOC/CAD và cập nhật mục 6.");
    };
    openNotifySourceConfig = window.openNotifySourceConfig = function () {
        document.getElementById("modalTitle").textContent =
            "Cấu hình nguồn Notify IOC/CAD";
        document.getElementById("modalSub").textContent =
            "Mô phỏng cấu hình nơi phát sinh notify và quy tắc cảnh báo.";
        document.getElementById("modalBody").innerHTML =
            `<div class="detail-card"><h4>Luồng tạo Notify</h4>${["Rule engine kiểm tra SLA nhiệm vụ/văn bản mỗi 1 phút", "API/CSDL sự kiện nhận biến động TTHC, văn bản, phản ánh, cháy nổ", "Calendar thư ký sinh nhắc lịch sắp họp/trễ xác nhận", "Cán bộ trực IOC nhập notify thủ công khi phát sinh tình huống"].map((s, i) => `<div class="sop-step"><i>${i + 1}</i><span>${s}</span><span class="badge ${i < 2 ? "ok" : "gold"}">${i < 2 ? "Tự động" : "Có thao tác"}</span></div>`).join("")}</div><div class="detail-card"><h4>Cấu hình demo</h4><table class="compact-table"><thead><tr><th>Nguồn</th><th>Tần suất</th><th>Điều kiện sinh notify</th><th>Người nhận</th></tr></thead><tbody><tr><td>Rule engine IOC</td><td>Realtime/1 phút</td><td>Sắp hạn, nguy cơ trễ, quá hạn</td><td>Lãnh đạo/đơn vị chủ trì</td></tr><tr><td>API/CSDL sự kiện</td><td>Realtime</td><td>Hồ sơ mới, điểm nóng, cháy nổ</td><td>Trực IOC/CAD</td></tr><tr><td>Calendar thư ký</td><td>15 phút/lần</td><td>Lịch họp trong 24h hoặc trễ xác nhận</td><td>Thư ký + chủ trì</td></tr><tr><td>Nhập thủ công</td><td>Khi phát sinh</td><td>Cán bộ trực tạo thông báo</td><td>Theo trục được chọn</td></tr></tbody></table></div>`;
        openModal();
    };

    const oldOpenIncidentDetailV11 =
        window.openIncidentDetail || openIncidentDetail;
    openIncidentDetail = window.openIncidentDetail = function (id) {
        oldOpenIncidentDetailV11(id);
        const n = (window.__incidents || []).find((x) => x.id === id);
        const body = document.getElementById("modalBody");
        if (n && body && !body.querySelector(".manual-note"))
            body.insertAdjacentHTML(
                "afterbegin",
                `<div class="manual-note"><b>Nguồn phát sinh notify:</b> ${n.source || "Rule engine IOC"} · <b>Vị trí nhập/cấu hình:</b> mục 6 Notify IOC/CAD → nút “Nhập notify” hoặc “Cấu hình nguồn notify”.</div>`,
            );
    };

    qlnvxSubtaskStatsHtmlGd = window.qlnvxSubtaskStatsHtmlGd = function (r) {
        console.log("rrrr aa", r);
        const subtasks = r.subtasks.combinedData || [{}, {}];
        const done = subtasks.filter((s) =>
            (s.status || "").toLowerCase().includes("Hoàn"),
        ).length;
        const doing = subtasks.filter((s) =>
            (s.status || "").toLowerCase().includes("Đang"),
        ).length;
        const soon = subtasks.filter((s) =>
            (s.status || "").toLowerCase().includes("Sắp"),
        ).length;
        const other = Math.max(0, subtasks.length - done - doing - soon);
        console.log("done, doing, soon, other", done, doing, soon, other);
        const rows = subtasks
            .map(
                (s, i) =>
                    `<tr class="clickable" onclick="openSubTaskDetail('${r.id}',${i})"><td>${s.id || "NVN-" + String(i + 1).padStart(2, "0")}</td><td>${s.noiDungNhiemVu || "Việc nhánh"}</td><td>${s.noiDungNhiemVu || "--"}</td><td>${s.due || "--"}</td><td>${s.progress ?? (s.state && s.state.includes("Hoàn") ? 100 : 35)}%</td><td><span class="badge ${s.state && s.state.includes("Hoàn") ? "ok" : s.state && s.state.includes("Sắp") ? "warn" : ""}">${s.state || "Đang xử lý"}</span></td></tr>`,
            )
            .join("");
        return `<section class="subtask-summary-v11"><div class="subtask-head-v11"><h4>Thống kê nhiệm vụ nhánh liên quan ${r.metric === "docIn" || r.metric === "docOut" ? "văn bản" : "nhiệm vụ"} chính</h4><div class="action-bar"><button class="primary" onclick="qlnvxOpenSubTaskForm('${r.id}')">＋ Giao nhiệm vụ nhánh</button><button class="ghost" onclick="toast('Đã xuất bảng nhiệm vụ nhánh của ${r.id}')">Xuất bảng</button></div></div><div class="subtask-kpis-v11"><div class="mini-kpi"><b class="mono">${fmt(subtasks.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(soon + other)}</b><span>Cần theo dõi</span></div></div>${subtasks.length ? `<div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="subtask-empty">Chưa có nhiệm vụ nhánh nào. Bấm “Giao nhiệm vụ nhánh” để tạo việc con gắn trực tiếp với hồ sơ/văn bản này.</div>`}</section>`;
    };
    const prevRenderRecordDetailV11 =
        window.qlnvxRenderRecordDetail || qlnvxRenderRecordDetail;
    qlnvxRenderRecordDetail = window.qlnvxRenderRecordDetail = function (
        r,
        limited,
        tab,
    ) {
        prevRenderRecordDetailV11(r, limited, tab);
        const body = document.getElementById("modalBody");
        if (!body || !r) return;
        if (!body.querySelector(".subtask-summary-v11"))
            body.insertAdjacentHTML("beforeend", qlnvxSubtaskStatsHtmlGd(r));
    };
    //   const prevOpenSubTaskFormV11 = window.qlnvxOpenSubTaskForm || qlnvxOpenSubTaskForm;
    //   qlnvxOpenSubTaskForm = window.qlnvxOpenSubTaskForm = function (id) {
    //     prevOpenSubTaskFormV11(id);
    //     const body = document.getElementById("modalBody");
    //     if (body && !document.getElementById("subPriority")) {
    //       const dueField = document.getElementById("subDue");
    //       dueField
    //         ?.closest(".field")
    //         ?.insertAdjacentHTML(
    //           "afterend",
    //           `<div class="field"><label>Mức ưu tiên</label><select id="subPriority"><option>Cao</option><option selected>Trung bình</option><option>Bình thường</option></select></div>`,
    //         );
    //     }
    //   };
    //   saveSubTask = window.saveSubTask = function (id) {
    //     console.log('id', id)
    //     const r = records.find((x) => x.id === id);
    //     if (!r) return;
    //     const dueRaw = document.getElementById("subDue")?.value || "";
    //     const due = dueRaw ? dueRaw.split("-").reverse().join("/") : "30/06/2026";
    //     const sub = {
    //       id: `${id}-N${String((r.subtasks || []).length + 1).padStart(2, "0")}`,
    //       name:
    //         document.getElementById("subName").value.trim() ||
    //         `Nhiệm vụ nhánh của ${id}`,
    //       owner: document.getElementById("subOwner").value,
    //       state: "Đang xử lý",
    //       due,
    //       priority: document.getElementById("subPriority")?.value || "Trung bình",
    //       progress: 10,
    //       created: new Date().toLocaleString("vi-VN"),
    //     };
    //     r.subtasks = r.subtasks || [];
    //     r.subtasks.push(sub);
    //     r.history.unshift({
    //       time: new Date().toLocaleString("vi-VN"),
    //       text: `Giao nhiệm vụ nhánh ${sub.id} cho ${sub.owner}: ${sub.name}`,
    //     });
    //     toast(
    //       "Đã giao nhiệm vụ nhánh và cập nhật bảng thống kê trong hồ sơ chính.",
    //     );
    //     qlnvxOpenRecordDetail(id);
    //   };
    openSubTaskDetail = window.openSubTaskDetail = function (parentId, idx) {
        const r = records.find((x) => x.id === parentId);
        const s = r?.subtasks?.[idx];
        if (!r || !s) return;
        document.getElementById("modalTitle").textContent =
            `Chi tiết nhiệm vụ nhánh · ${s.id || idx + 1}`;
        document.getElementById("modalSub").textContent =
            `Gắn với ${r.id} · ${r.title}`;
        document.getElementById("modalBody").innerHTML =
            `<div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id || "--"}</span><b>Nội dung</b><span>${s.name}</span><b>Đơn vị nhận</b><span>${s.owner}</span><b>Hạn xử lý</b><span>${s.due || "--"}</span><b>Mức ưu tiên</b><span>${s.priority || "Trung bình"}</span><b>Trạng thái</b><span>${s.state || "Đang xử lý"}</span></div></div><div class="detail-card"><h4>Cập nhật nhanh</h4><div class="field"><label>Trạng thái</label><select id="subState"><option ${s.state === "Đang xử lý" ? "selected" : ""}>Đang xử lý</option><option ${s.state === "Sắp đến hạn" ? "selected" : ""}>Sắp đến hạn</option><option ${s.state === "Hoàn thành" ? "selected" : ""}>Hoàn thành</option></select></div><div class="field"><label>Tiến độ</label><input id="subProgress" type="number" min="0" max="100" value="${s.progress ?? 30}" /></div><div class="action-bar"><button class="primary" onclick="saveSubTaskState('${parentId}',${idx})">Lưu cập nhật</button><button class="ghost" onclick="qlnvxOpenRecordDetail('${parentId}')">Quay lại hồ sơ chính</button><button class="ghost" onclick="toast('Đã gửi nhắc việc nhánh ${s.id || ""} tới ${s.owner}')">Nhắc việc</button></div></div></div>${qlnvxSubtaskStatsHtmlGd(r)}`;
        openModal();
    };
    saveSubTaskState = window.saveSubTaskState = function (parentId, idx) {
        const r = records.find((x) => x.id === parentId);
        const s = r?.subtasks?.[idx];
        if (!s) return;
        s.state = document.getElementById("subState").value;
        s.progress = Number(
            document.getElementById("subProgress").value || s.progress || 0,
        );
        r.history.unshift({
            time: new Date().toLocaleString("vi-VN"),
            text: `Cập nhật nhiệm vụ nhánh ${s.id}: ${s.state}, tiến độ ${s.progress}%`,
        });
        toast("Đã cập nhật nhiệm vụ nhánh.");
        qlnvxOpenRecordDetail(parentId);
    };

    // Bỏ widget văn bản lặp ở mục 8 khỏi cấu hình ẩn/hiện và ép ẩn trên màn hình.
    try {
        delete widgetLabels.documents;
    } catch (e) { }
    const prevRenderCustomizerV11 = window.renderCustomizer || renderCustomizer;
    renderCustomizer = window.renderCustomizer = function () {
        prevRenderCustomizerV11();
        document
            .querySelectorAll('[data-widget="documents"]')
            .forEach((el) => el.classList.add("hidden"));
    };
    const prevApplyWidgetVisibilityV11 =
        window.applyWidgetVisibility || applyWidgetVisibility;
    applyWidgetVisibility = window.applyWidgetVisibility = function () {
        prevApplyWidgetVisibilityV11();
        document
            .querySelectorAll('[data-widget="documents"]')
            .forEach((el) => el.classList.add("hidden"));
    };

    // Nếu đã đăng nhập trước khi script V11 nạp xong, làm mới giao diện.
    setTimeout(() => {
        if (currentAccount) {
            renderAll();
        }
    }, 0);
})();

(function () {
    const v12MetricColors = ["#2fb174", "#2c7dd2", "#d8a50c", "#8b5cf6"];
    function v12Arc(cx, cy, r, start, end) {
        const rad = (a) => ((a - 90) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(rad(start)),
            y1 = cy + r * Math.sin(rad(start));
        const x2 = cx + r * Math.cos(rad(end)),
            y2 = cy + r * Math.sin(rad(end));
        const large = end - start > 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    }

    function v12Pad(n) {
        return String(n).padStart(2, "0");
    }
    function v12Iso(d) {
        return `${d.getFullYear()}-${v12Pad(d.getMonth() + 1)}-${v12Pad(d.getDate())}`;
    }
    function v12AddDays(base, n) {
        const d = new Date(base);
        d.setDate(d.getDate() + n);
        return d;
    }
    function v12ParseIso(s) {
        const [y, m, d] = String(s).split("-").map(Number);
        return new Date(y, m - 1, d);
    }
    function v12EnsureCalendar() {
        if (window.__calendarEvents && window.__calendarEvents.length) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const templates = {
            DANG: [
                "Giao ban Thường trực Đảng ủy",
                "Họp Ban Thường vụ Đảng ủy",
                "Làm việc về Nghị quyết 57",
            ],
            HDND: [
                "Họp Thường trực HĐND",
                "Phiên giải trình chuyên đề",
                "Giám sát kiến nghị cử tri",
            ],
            UBND: [
                "Giao ban lãnh đạo UBND",
                "Họp xử lý TTHC sắp hạn",
                "Họp đô thị, môi trường, PCCC",
            ],
            MTTQ: [
                "Họp Ban Thường trực MTTQ",
                "Họp phản biện xã hội",
                "Họp quỹ ủng hộ và an sinh",
            ],
        };
        const counts = { DANG: 18, HDND: 17, UBND: 15, MTTQ: 9 };
        let id = 1;
        const events = [];
        Object.keys(counts).forEach((role) => {
            for (let i = 0; i < counts[role]; i++) {
                const offsets = [
                    -8, -3, -1, 0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22, 27, 31, 38, 45,
                ];
                const d = v12AddDays(
                    today,
                    offsets[i % offsets.length] +
                    (role === "UBND" ? 1 : role === "MTTQ" ? 2 : 0),
                );
                const late = d < today && i % 3 !== 0;
                const done = d < today && !late;
                events.push({
                    id: `MEET-${role}-${String(id++).padStart(3, "0")}`,
                    role,
                    date: v12Iso(d),
                    time: ["07:45", "08:00", "08:30", "09:00", "14:00", "15:30"][i % 6],
                    end: ["09:00", "09:30", "10:30", "11:00", "15:30", "16:30"][i % 6],
                    title: `${templates[role][i % templates[role].length]} ${i + 1}`,
                    venue: [
                        "Phòng họp Đảng ủy",
                        "Hội trường UBND",
                        "Phòng họp HĐND",
                        "Phòng giao ban IOC",
                    ][i % 4],
                    chair:
                        role === "DANG"
                            ? "Bí thư Đảng ủy"
                            : role === "HDND"
                                ? "Chủ tịch HĐND"
                                : role === "UBND"
                                    ? "Chủ tịch UBND"
                                    : "Chủ tịch MTTQ",
                    secretary: [
                        "Văn phòng Đảng ủy",
                        "Văn phòng HĐND",
                        "Văn phòng UBND",
                        "Cán bộ MTTQ",
                    ][i % 4],
                    participants: [
                        axisMeta[role].name,
                        "Văn phòng",
                        "Công chức chuyên môn",
                        i % 2 ? "Đơn vị phối hợp" : "Tổ chuyển đổi số",
                    ],
                    agenda: `Chuẩn bị nội dung, rà soát số liệu IOC và kết luận giao nhiệm vụ cho ${axisMeta[role].name}.`,
                    docs: [`Tài_liệu_họp_${role}_${i + 1}.pdf`],
                    rawStatus: done ? "done" : late ? "late" : "planned",
                    prepared: i % 4 !== 1,
                    confirmed: i % 5 !== 2,
                });
            }
        });
        window.__calendarEvents = events;
    }
    function v12EventState(e) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = v12ParseIso(e.date);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / 86400000);
        if (e.rawStatus === "late")
            return { key: "late", label: "Trễ xác nhận", icon: "⚠️" };
        if (e.rawStatus === "done")
            return { key: "done", label: "Đã hoàn thành", icon: "✅" };
        if (diff === 0) return { key: "today", label: "Hôm nay", icon: "🔔" };
        if (diff > 0 && diff <= 7)
            return { key: "upcoming", label: "Sắp diễn ra", icon: "⏰" };
        return { key: "planned", label: "Đã lên lịch", icon: "📅" };
    }
    function v12CalScope() {
        v12EnsureCalendar();
        return (window.__calendarEvents || []).filter((e) =>
            allowedRoles().includes(e.role),
        );
    }
    function v12CalCounts() {
        const out = { today: 0, upcoming: 0, late: 0, planned: 0, done: 0 };
        v12CalScope().forEach((e) => out[v12EventState(e).key]++);
        return out;
    }
    function v12DateShort(e) {
        const d = v12ParseIso(e.date);
        return `${v12Pad(d.getDate())}/${v12Pad(d.getMonth() + 1)}`;
    }

    function v12AddCitizenIndicator() {
        const label = "Tổng số ý kiến liên quan đến kiến nghị cử tri";
        if (!indicators.HDND.some((x) => x[0] === label))
            indicators.HDND.push([label, 87, "Tuần", "Excel/API cử tri"]);
        if (
            !indicatorRecords.some((r) => r.role === "HDND" && r.indicator === label)
        ) {
            const startIdx = indicators.HDND.findIndex((x) => x[0] === label) + 1;
            for (let i = 0; i < 87; i++) {
                const st = statusDefs[(i + 2) % statusDefs.length];
                indicatorRecords.push({
                    id: `CT-HDND-KNCT-${String(i + 1).padStart(4, "0")}`,
                    role: "HDND",
                    indicator: label,
                    status: st.key,
                    title: `Ý kiến/kiến nghị cử tri liên quan #${i + 1}`,
                    field: "Cử tri – kiến nghị",
                    source: "Excel/API cử tri",
                    freq: "Tuần",
                    unit: pick(units, i + 3),
                    due: dueDate(i, st.key),
                    progress: progressFor(st.key, i),
                    description:
                        "Bản ghi tổng hợp ý kiến liên quan đến kiến nghị cử tri: nhóm nội dung, đơn vị tiếp nhận, trạng thái xử lý và kết quả trả lời.",
                    history: [
                        {
                            time: "07:40 26/06/2026",
                            text: "Đồng bộ danh sách ý kiến/kiến nghị cử tri",
                        },
                        { time: "10:30 26/06/2026", text: "HĐND rà soát trạng thái xử lý" },
                    ],
                });
            }
        }
    }
    v12AddCitizenIndicator();

    function v12SeedSubtasks() {
        const samples = [
            "Rà soát hồ sơ nguồn và đối chiếu số liệu",
            "Chuẩn hóa biểu mẫu/minh chứng gửi IOC",
            "Liên hệ đơn vị phối hợp xác nhận kết quả",
            "Cập nhật tiến độ xử lý lên hệ thống",
            "Tổng hợp báo cáo ngắn phục vụ lãnh đạo",
        ];
        (records || []).forEach((r, idx) => {
            r.subtasks = r.subtasks || [];
            while (r.subtasks.length < 5) {
                const n = r.subtasks.length;
                r.subtasks.push({
                    id: `${r.id}-N${String(n + 1).padStart(2, "0")}`,
                    name: samples[n],
                    content: `${samples[n]} cho hồ sơ ${r.id}, lĩnh vực ${r.field}.`,
                    owner: pick(units, idx + n),
                    state:
                        n === 0 ? "Hoàn thành" : n === 3 ? "Sắp đến hạn" : "Đang xử lý",
                    due: dueDate(n, n === 0 ? "done" : n === 3 ? "soon" : "doing"),
                    priority: n === 3 ? "Cao" : "Trung bình",
                    progress: n === 0 ? 100 : n === 3 ? 68 : 35 + n * 8,
                    created: "26/06/2026 08:00",
                });
            }
        });
    }
    v12SeedSubtasks();

    renderRoleDetail = window.renderRoleDetail = function () {
        renderSummary();
    };

    // Patch form giao nhiệm vụ nhánh: có trường Tên nhiệm vụ và nội dung chi tiết.
    qlnvxOpenSubTaskForm = window.qlnvxOpenSubTaskForm = function (id) {
        console.log("id bbbb", id, window.metricsApiData.listAssigned.data);
        const r = window.metricsApiData.listAssigned.data.find((x) => x._id === id);
        if (!r) return;
        document.getElementById("modalTitle").textContent = "Giao nhiệm vụ nhánh";
        document.getElementById("modalSub").textContent =
            `Gắn với hồ sơ chính ${r._id}`;
        document.getElementById("modalBody").innerHTML =
            `<div class="form2"><div class="field wide"><label>Tên nhiệm vụ</label><input id="subTaskTitle" value="Rà soát và cập nhật kết quả xử lý cho ${r._id}" /></div><div class="field wide"><label>Nội dung nhiệm vụ nhánh</label><textarea id="subName" rows="3">Kiểm tra, đối chiếu dữ liệu, cập nhật minh chứng và báo cáo tiến độ cho hồ sơ: ${r._id}</textarea></div><div class="field"><label>Đơn vị nhận</label><select id="subOwner">${units.map((u) => `<option>${u}</option>`).join("")}</select></div><div class="field"><label>Hạn hoàn thành</label><input type="date" id="subDue" /></div><div class="field"><label>Mức ưu tiên</label><select id="subPriority"><option>Cao</option><option selected>Trung bình</option><option>Bình thường</option></select></div></div><div class="action-bar"><button class="primary" onclick="saveSubTask('${id}')">Giao việc nhánh</button><button class="ghost" onclick="qlnvxOpenRecordDetail('${id}')">Quay lại hồ sơ</button></div>`;
        openModal();
    };
    saveSubTask = window.saveSubTask = function (id) {
        const r = window.metricsApiData.listAssigned.data.find((x) => x._id === id);
        if (!r) return;
        const dueRaw = document.getElementById("subDue")?.value || "";
        const due = dueRaw ? dueRaw.split("-").reverse().join("/") : "30/06/2026";
        const title =
            document.getElementById("subTaskTitle")?.value.trim() ||
            `Nhiệm vụ nhánh của ${id}`;
        const content = document.getElementById("subName")?.value.trim() || title;
        const sub = {
            id: `${id}-N${String((r.subtasks || []).length + 1).padStart(2, "0")}`,
            name: title,
            content,
            owner: document.getElementById("subOwner").value,
            state: "Đang xử lý",
            due,
            priority: document.getElementById("subPriority")?.value || "Trung bình",
            progress: 10,
            created: new Date().toLocaleString("vi-VN"),
        };
        r.subtasks = r.subtasks || [];
        r.subtasks.push(sub);
        // r.history.unshift({
        //   time: new Date().toLocaleString("vi-VN"),
        //   text: `Giao nhiệm vụ nhánh ${sub.id} cho ${sub.owner}: ${sub.name}`,
        // });
        toast(
            "Đã giao nhiệm vụ nhánh và cập nhật bảng thống kê trong hồ sơ chính.",
        );
        qlnvxOpenRecordDetail(id);
    };
    // qlnvxSubtaskStatsHtmlGd = window.qlnvxSubtaskStatsHtmlGd = function (r) {
    //     console.log('rrrrrr', r)
    //     const subs = [
    //         { id: "NVN-01", name: "Rà soát hồ sơ", content: "Kiểm tra pháp lý", owner: "Phòng PC", due: "15/08/2026", progress: 100, state: "Hoàn thành" },
    //         { id: "NVN-02", name: "Soạn thảo báo cáo", content: "Tổng hợp số liệu", owner: "Văn phòng", due: "20/08/2026", progress: 45, state: "Đang xử lý" }
    //     ]
    //     const done = subs.filter((s) =>
    //         (s.state || "").toLowerCase().includes("hoàn"),
    //     ).length;
    //     const doing = subs.filter((s) =>
    //         (s.state || "").toLowerCase().includes("đang"),
    //     ).length;
    //     const soon = subs.filter((s) =>
    //         (s.state || "").toLowerCase().includes("sắp"),
    //     ).length;
    //     const other = Math.max(0, subs.length - done - doing - soon);
    //     console.log('subs', subs)
    //     const rows = subs
    //         .map(
    //             (s, i) =>
    //                 `<tr class="clickable" onclick="openSubTaskDetail('${r.id}',${i})"><td>${s.id || "NVN-" + String(i + 1).padStart(2, "0")}</td><td class="subtask-name-col">${s.name || "Việc nhánh"}</td><td class="subtask-content-col">${s.content || s.name || "--"}</td><td>${s.owner || "--"}</td><td>${s.due || "--"}</td><td>${s.progress ?? (s.state && s.state.includes("Hoàn") ? 100 : 35)}%</td><td><span class="badge ${s.state && s.state.includes("Hoàn") ? "ok" : s.state && s.state.includes("Sắp") ? "warn" : ""}">${s.state || "Đang xử lý"}</span></td></tr>`,
    //         )
    //         .join("");
    //     return `<section class="subtask-summary-v11"><div class="subtask-head-v11"><div><h4>Thống kê nhiệm vụ nhánh liên quan ${r.metric === "docIn" || r.metric === "docOut" ? "văn bản" : "nhiệm vụ"} chính bbb</h4><div class="subtask-meta-note">Hiển thị tối thiểu 5 nhiệm vụ nhánh mẫu; nếu phát sinh hơn 5 nhiệm vụ thì bảng tự có thanh cuộn.</div></div><div class="action-bar"><button class="primary" onclick="qlnvxOpenSubTaskForm('${r.id}')">＋ Giao nhiệm vụ nhánh</button><button class="ghost" onclick="toast('Đã xuất bảng nhiệm vụ nhánh của ${r.id}')">Xuất bảng</button></div></div><div class="subtask-kpis-v11"><div class="mini-kpi"><b class="mono">${fmt(subs.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(soon + other)}</b><span>Cần theo dõi</span></div></div>${subs.length ? `<div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="subtask-empty">Chưa có nhiệm vụ nhánh nào. Bấm “Giao nhiệm vụ nhánh” để tạo việc con gắn trực tiếp với hồ sơ/văn bản này.</div>`}</section>`;
    // };
    openSubTaskDetail = window.openSubTaskDetail = function (parentId, idx) {
        const r = records.find((x) => x.id === parentId);
        const s = r?.subtasks?.[idx];
        if (!r || !s) return;
        document.getElementById("modalTitle").textContent =
            `Chi tiết nhiệm vụ nhánh · ${s.id || idx + 1}`;
        document.getElementById("modalSub").textContent =
            `Gắn với ${r.id} · ${r.title}`;
        document.getElementById("modalBody").innerHTML =
            `<div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id || "--"}</span><b>Tên nhiệm vụ</b><span>${s.name || "--"}</span><b>Nội dung</b><span>${s.content || s.name || "--"}</span><b>Đơn vị nhận</b><span>${s.owner}</span><b>Hạn xử lý</b><span>${s.due || "--"}</span><b>Mức ưu tiên</b><span>${s.priority || "Trung bình"}</span><b>Trạng thái</b><span>${s.state || "Đang xử lý"}</span></div></div><div class="detail-card"><h4>Cập nhật nhanh</h4><div class="field"><label>Trạng thái</label><select id="subState"><option ${s.state === "Đang xử lý" ? "selected" : ""}>Đang xử lý</option><option ${s.state === "Sắp đến hạn" ? "selected" : ""}>Sắp đến hạn</option><option ${s.state === "Hoàn thành" ? "selected" : ""}>Hoàn thành</option></select></div><div class="field"><label>Tiến độ</label><input id="subProgress" type="number" min="0" max="100" value="${s.progress ?? 30}" /></div><div class="action-bar"><button class="primary" onclick="saveSubTaskState('${parentId}',${idx})">Lưu cập nhật</button><button class="ghost" onclick="qlnvxOpenRecordDetail('${parentId}')">Quay lại hồ sơ chính</button><button class="ghost" onclick="toast('Đã gửi nhắc việc nhánh ${s.id || ""} tới ${s.owner}')">Nhắc việc</button></div></div></div>${qlnvxSubtaskStatsHtmlGd(r)}`;
        openModal();
    };

    // Bổ sung thống kê ý kiến liên quan đến kiến nghị cử tri trong detail chỉ tiêu HĐND.
    const oldOpenIndicatorDetailV12 =
        window.openIndicatorDetail || openIndicatorDetail;
    openIndicatorDetail = window.openIndicatorDetail = function (id) {
        oldOpenIndicatorDetailV12(id);
        const r = indicatorRecords.find((x) => x.id === id);
        if (!r) return;
        const body = document.getElementById("modalBody");
        if (
            r.role === "HDND" &&
            /kiến nghị cử tri|ý kiến liên quan/i.test(r.indicator) &&
            body &&
            !body.querySelector(".v12-citizen-kpi")
        ) {
            const total = 87,
                done = 42,
                doing = 31,
                pending = 14;
            body.insertAdjacentHTML(
                "beforeend",
                `<div class="detail-card"><h4>Tổng hợp ý kiến liên quan đến kiến nghị cử tri</h4><div class="v12-citizen-kpi"><div class="mini-kpi"><b class="mono">${fmt(total)}</b><span>Tổng số ý kiến liên quan</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Đã xử lý/trả lời</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(pending)}</b><span>Chưa xử lý/cần giám sát</span></div></div><table class="compact-table"><thead><tr><th>Nhóm nội dung</th><th>Số ý kiến</th><th>Đã xử lý</th><th>Đang xử lý</th><th>Chưa xử lý</th></tr></thead><tbody><tr><td>Đất đai, GPMB</td><td>24</td><td>11</td><td>9</td><td>4</td></tr><tr><td>Giao thông, đô thị</td><td>21</td><td>10</td><td>7</td><td>4</td></tr><tr><td>An sinh, chính sách</td><td>18</td><td>9</td><td>6</td><td>3</td></tr><tr><td>Môi trường, trật tự</td><td>15</td><td>8</td><td>5</td><td>2</td></tr><tr><td>Hành chính công</td><td>9</td><td>4</td><td>4</td><td>1</td></tr></tbody></table><div class="action-bar"><button class="primary" onclick="openIndicator('HDND', indicators.HDND.findIndex(x=>x[0]==='Tổng số ý kiến liên quan đến kiến nghị cử tri'))">Mở danh sách 87 ý kiến</button><button class="ghost" onclick="qlnvxOpenAssignmentForm()">Giao nhiệm vụ xử lý kiến nghị</button></div></div>`,
            );
        }
    };

    // Khi lưu cập nhật nhiệm vụ nhánh, giữ lại màn bảng lớn.
    const oldSaveSubTaskStateV12 = window.saveSubTaskState || saveSubTaskState;
    saveSubTaskState = window.saveSubTaskState = function (parentId, idx) {
        const r = records.find((x) => x.id === parentId);
        const s = r?.subtasks?.[idx];
        if (!s) return;
        s.state = document.getElementById("subState").value;
        s.progress = Number(
            document.getElementById("subProgress").value || s.progress || 0,
        );
        r.history.unshift({
            time: new Date().toLocaleString("vi-VN"),
            text: `Cập nhật nhiệm vụ nhánh ${s.id}: ${s.state}, tiến độ ${s.progress}%`,
        });
        toast("Đã cập nhật nhiệm vụ nhánh.");
        qlnvxOpenRecordDetail(parentId);
    };

    setTimeout(() => {
        if (currentAccount) {
            v12AddCitizenIndicator();
            v12SeedSubtasks();
            renderAll();
        }
    }, 0);
})();

(function () {
    const prevRenderRecordDetailFinal =
        window.qlnvxRenderRecordDetail || qlnvxRenderRecordDetail;
    qlnvxRenderRecordDetail = window.qlnvxRenderRecordDetail = function (
        r,
        limited,
        tab,
    ) {
        prevRenderRecordDetailFinal(r, limited, tab);
        const body = document.getElementById("modalBody");
        if (body && r && typeof window.qlnvxSubtaskStatsHtmlGd === "function") {
            body
                .querySelectorAll(".subtask-summary-v11")
                .forEach((el) => el.remove());
            body.insertAdjacentHTML("beforeend", window.qlnvxSubtaskStatsHtmlGd(r));
        }
    };
})();

(function () {
    const CONFIG_VERSION = "v13-chart-config";
    const chartDefaults = {
        donutSize: "normal",
        legendMode: "full",
        cards: {
            metric: {
                visible: true,
                title: "Văn bản",
                note: "Văn bản đến/đi trong phạm vi quyền",
            },
            status: {
                visible: true,
                title: "Nhiệm vụ giao",
                note: "Theo dõi, đôn đốc nhiệm vụ đã giao",
            },
            calendar: {
                visible: true,
                title: "Nhiệm vụ nhận",
                note: "Trực tiếp xử lý nhiệm vụ được giao",
            },
            role: {
                visible: true,
                title: "Chân dung vận hành nhiệm vụ/văn bản theo trục",
                note: "Giao/nhận nhiệm vụ và văn bản đến/đi theo trục được phép xem.",
            },
            alert: {
                visible: true,
                title: "Cảnh báo IOC/CAD",
                note: "Điểm nghẽn, cháy nổ, sắp hạn, quá hạn và nhắc lịch họp.",
            },
        },
    };
    const chartOrder = ["metric", "status", "calendar"];
    const chartKeyLabel = {
        metric: "Cơ cấu hồ sơ",
        status: "Kết quả xử lý",
        calendar: "Lịch công tác/kỳ họp",
        role: "Chân dung theo trục",
        alert: "Cảnh báo IOC/CAD",
    };
    const cfgKey = () => `${prefKey()}-${CONFIG_VERSION}`;
    function deepMerge(base, over) {
        const out = JSON.parse(JSON.stringify(base));
        function m(t, s) {
            Object.keys(s || {}).forEach((k) => {
                if (s[k] && typeof s[k] === "object" && !Array.isArray(s[k])) {
                    t[k] = t[k] || {};
                    m(t[k], s[k]);
                } else t[k] = s[k];
            });
        }
        m(out, over);
        return out;
    }
    window.getChartConfig = function () {
        try {
            return deepMerge(
                chartDefaults,
                JSON.parse(localStorage.getItem(cfgKey()) || "{}"),
            );
        } catch (e) {
            return deepMerge(chartDefaults, {});
        }
    };
    window.saveChartConfig = function (cfg) {
        localStorage.setItem(
            cfgKey(),
            JSON.stringify(deepMerge(chartDefaults, cfg)),
        );
    };
    function sourceDefs() {
        return (
            window.__v10Sources || [
                {
                    key: "api",
                    icon: "🔌",
                    name: "API realtime",
                    freq: "Realtime / mỗi 1 phút",
                    owner: "Văn phòng UBND phường",
                    mode: "API Gateway/Webhook",
                    rows: 642,
                    quality: "99,1%",
                    offset: 240000,
                    status: "ok",
                },
                {
                    key: "excel",
                    icon: "📗",
                    name: "Excel import",
                    freq: "Khi phát sinh / cuối ngày",
                    owner: "Cán bộ tổng hợp IOC",
                    mode: "Import Excel",
                    rows: 187,
                    quality: "96,4%",
                    offset: 8200000,
                    status: "late",
                },
                {
                    key: "db",
                    icon: "🗄️",
                    name: "CSDL chuyên ngành",
                    freq: "15 phút / theo lịch",
                    owner: "Đơn vị chuyên môn",
                    mode: "Adapter/ETL",
                    rows: 1248,
                    quality: "98,7%",
                    offset: 1140000,
                    status: "ok",
                },
                {
                    key: "alert",
                    icon: "🔔",
                    name: "Cảnh báo IOC",
                    freq: "Realtime / sự kiện",
                    owner: "Trực IOC/CAD",
                    mode: "Rule engine/SOP",
                    rows: 189,
                    quality: "99,6%",
                    offset: 46000,
                    status: "ok",
                },
            ]
        );
    }
    function v13dt(ts) {
        const d = new Date(ts);
        return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
    function v13rel(ts) {
        const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
        if (s < 60) return `${s} giây trước`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m} phút trước`;
        const h = Math.floor(m / 60),
            mm = m % 60;
        if (h < 24) return `${h} giờ${mm ? ` ${mm} phút` : ""} trước`;
        const d = Math.floor(h / 24),
            hh = h % 24;
        return `${d} ngày${hh ? ` ${hh} giờ` : ""} trước`;
    }
    function sourceAt(s) {
        return Date.now() - (s.offset || 0);
    }
    function v13Arc(cx, cy, r, start, end) {
        const rad = (a) => ((a - 90) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(rad(start)),
            y1 = cy + r * Math.sin(rad(start));
        const x2 = cx + r * Math.cos(rad(end)),
            y2 = cy + r * Math.sin(rad(end));
        const large = end - start > 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    }
    function v13Svg(segments, total, center, sub, group) {
        console.log("center", center);
        total = total || segments.reduce((a, s) => a + (s.value || 0), 0) || 1;
        let angle = 0;
        const paths = segments
            .map((s, idx) => {
                const val = Math.max(0, s.value || 0);
                const len = (val / total) * 360;
                const start = angle;
                const end = angle + len;
                angle = end;
                if (!val) return "";
                return `<path class="overview-seg" 
            d="${donutArc(90, 90, 62, start, start == 0 && end === 360 ? 359.9 : end)}" 
            fill="none" stroke="${s.color}" 
            stroke-width="20" stroke-linecap="butt"
            onclick="openOverviewPieSegment('${group}','${s.key}')"><title>${s.label}: ${fmt(val)}</title></path>`;
            })
            .join("");
        return `<svg class="overview-donut" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="62" fill="none" stroke="#06192c" stroke-width="20"/>
            ${paths}
            <circle cx="90" cy="90" r="42" fill="#061528" stroke="rgba(87,178,255,.24)"/><text x="90" y="86" text-anchor="middle" 
            class="overview-center">${center}</text><text x="90" y="105" text-anchor="middle" class="overview-sub">${sub}</text></svg>`;
    }
    // function v13PieCard(
    //   key,
    //   title,
    //   note,
    //   segments,
    //   group,
    //   center,
    //   sub,
    //   extra = "",
    // ) {
    //   const cfg = getChartConfig();
    //   const total = segments.reduce((a, s) => a + (s.value || 0), 0);
    //   const legendCls =
    //     cfg.legendMode === "compact"
    //       ? "compact"
    //       : cfg.legendMode === "noValue"
    //         ? "hide-values"
    //         : "";

    //   const legend = `<div class="overview-legend ${legendCls}">${segments.map((s) =>
    //     `<button onclick="window._type = '${group}';openOverviewPieSegment('${group}','${s.key}')" title="${s.label}: ${fmt(s.value || 0)}">
    //      <i style="background:${s.color}"></i><span>${s.label}</span><b>${fmt(s.value || 0)}</b></button>`).join("")}</div>`;

    //   // 1. Nút "Xem chi tiết" (Nhiệm vụ giao & Nhiệm vụ nhận đều có)
    //   const btnDetail = `
    //       <button
    //           type="button"
    //           onclick="window._type = '${group}'; openOverviewPieSegment('${group}', '');"
    //           style="
    //               flex: 1;
    //               padding: 10px 16px;
    //               border-radius: 20px;
    //               border: 1px solid #1e3a5f;
    //               background-color: transparent;
    //               color: #ffffff;
    //               font-size: 14px;
    //               font-weight: 700;
    //               cursor: pointer;
    //               text-align: center;
    //           "
    //       >
    //           Xem chi tiết
    //       </button>
    //   `;

    //   // 2. Nút "Giao nhiệm vụ" (Chỉ dành cho Nhiệm vụ giao)
    //   const btnAssign = `
    //       <button
    //           type="button"
    //           onclick="onAssignTask('${group}', '${key}')"
    //           style="
    //               flex: 1;
    //               padding: 10px 16px;
    //               border-radius: 20px;
    //               border: none;
    //               background-color: #1976d2;
    //               color: #ffffff;
    //               font-size: 14px;
    //               font-weight: 700;
    //               cursor: pointer;
    //               text-align: center;
    //           "
    //       >
    //           Giao nhiệm vụ
    //       </button>
    //   `;

    //   // 3. Xử lý logic hiển thị theo biến `group`
    //   // (Bạn có thể đổi tên chuỗi "giao" / "nhan" cho khớp với dữ liệu thực tế của bạn)
    //   let actions = "";
    //   if (group === "giao" || group === "assigned") {
    //     actions = `<div style="display: flex; gap: 12px; margin-top: 12px; width: 100%;">${btnDetail}}</div>`;
    //   } else if (group === "nhan" || group === "received") {
    //     actions = `<div style="display: flex; gap: 12px; margin-top: 12px; width: 100%;">${btnDetail}</div>`;
    //   }

    //   return `<article class="summary-pie-card v12-card" data-chart-card="${key}">
    //         <div><h3>${title}</h3><div class="summary-note">${note}</div></div>
    //         <div class="v12-card-body">
    //             <div class="overview-donut-wrap">
    //                 ${v13Svg(segments, total, center ?? fmt(total), sub || "Tổng", group)}
    //             </div>
    //             <div style="display: flex; flex-direction: column; width: 100%;">
    //                 ${extra || legend}
    //                 ${actions}
    //             </div>
    //         </div>
    //       </article>`;
    // }
    function v13PieCard(
        key,
        title,
        note,
        segments,
        group,
        center,
        sub,
        extra = "",
    ) {
        const cfg = getChartConfig();
        const total = segments.reduce((a, s) => a + (s.value || 0), 0);
        const legendCls =
            cfg.legendMode === "compact"
                ? "compact"
                : cfg.legendMode === "noValue"
                    ? "hide-values"
                    : "";

        console.log("group", group);

        const legend = `<div class="overview-legend ${legendCls}">${segments
            .map((s) => {
                // Văn bản đến/đi cũng click được: mở modal danh sách QLVB (openList -> fetchQlvbList).
                const clickAttr = `onclick="window._type = '${group}'; openOverviewPieSegment('${group}','${s.key}')"`;
                const cursorStyle = "";

                return `<button ${clickAttr} ${cursorStyle} title="${s.label}: ${fmt(s.value || 0)}">
   <i style="background:${s.color}"></i><span>${s.label}</span><b>${fmt(s.value || 0)}</b></button>`;
            })
            .join("")}</div>`;

        // Nút hành động — dùng đúng class như bản chuẩn filev2 (.pie-card-actions + .ghost/.primary),
        // KHÔNG inline style để ăn theo hệ thống nút chung của CSS.
        const btnDetail = `<button type="button" class="ghost" onclick="window._type = '${group}'; openOverviewPieSegment('${group}', '');">Xem chi tiết</button>`;
        const btnAssign = `<button type="button" class="primary" onclick="qlnvxOpenAssignmentForm()">Thêm Nhiệm vụ</button>`;

        let actions = "";
        if (group === "giao" || group === "assigned") {
            actions = `<div class="pie-card-actions">${btnDetail}${btnAssign}</div>`;
        } else if (group === "nhan" || group === "received") {
            actions = `<div class="pie-card-actions">${btnDetail}</div>`;
        }

        return `<article class="summary-pie-card v12-card" data-chart-card="${key}">
          <div><h3>${title}</h3><div class="summary-note">${note}</div></div>
          <div class="v12-card-body">
              <div class="overview-donut-wrap">
                  ${v13Svg(segments, total, center ?? fmt(total), sub || "Tổng", group)}
              </div>
              <div style="display: flex; flex-direction: column; width: 100%;">
                  ${extra || legend}
                  ${actions}
              </div>
          </div>
        </article>`;
    }
    function v13Pad(n) {
        return String(n).padStart(2, "0");
    }
    function v13Iso(d) {
        return `${d.getFullYear()}-${v13Pad(d.getMonth() + 1)}-${v13Pad(d.getDate())}`;
    }
    function v13AddDays(base, n) {
        const d = new Date(base);
        d.setDate(d.getDate() + n);
        return d;
    }
    function v13ParseIso(s) {
        const [y, m, d] = String(s).split("-").map(Number);
        return new Date(y, m - 1, d);
    }
    function v13EnsureCalendar() {
        if (window.__calendarEvents) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const counts = { DANG: 18, HDND: 17, UBND: 15, MTTQ: 9 };
        let id = 1;
        const events = [];
        const templates = {
            DANG: [
                "Giao ban Thường trực Đảng ủy",
                "Họp Ban Thường vụ Đảng ủy",
                "Làm việc về Nghị quyết 57",
            ],
            HDND: [
                "Họp Thường trực HĐND",
                "Phiên giải trình chuyên đề",
                "Giám sát kiến nghị cử tri",
            ],
            UBND: [
                "Giao ban lãnh đạo UBND",
                "Họp xử lý TTHC sắp hạn",
                "Họp đô thị, môi trường, PCCC",
            ],
            MTTQ: [
                "Họp Ban Thường trực MTTQ",
                "Họp phản biện xã hội",
                "Họp quỹ ủng hộ và an sinh",
            ],
        };
        Object.keys(counts).forEach((role) => {
            for (let i = 0; i < counts[role]; i++) {
                const offs = [
                    -8, -3, -1, 0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22, 27, 31, 38, 45,
                ];
                const d = v13AddDays(
                    today,
                    offs[i % offs.length] +
                    (role === "UBND" ? 1 : role === "MTTQ" ? 2 : 0),
                );
                const late = d < today && i % 3 !== 0;
                const done = d < today && !late;
                events.push({
                    id: `MEET-${role}-${String(id++).padStart(3, "0")}`,
                    role,
                    date: v13Iso(d),
                    time: ["07:45", "08:00", "08:30", "09:00", "14:00", "15:30"][i % 6],
                    end: ["09:00", "09:30", "10:30", "11:00", "15:30", "16:30"][i % 6],
                    title: `${templates[role][i % templates[role].length]} ${i + 1}`,
                    venue: [
                        "Phòng họp Đảng ủy",
                        "Hội trường UBND phường",
                        "Phòng họp HĐND",
                        "Phòng giao ban IOC",
                    ][i % 4],
                    chair:
                        role === "DANG"
                            ? "Bí thư Đảng ủy"
                            : role === "HDND"
                                ? "Chủ tịch HĐND"
                                : role === "UBND"
                                    ? "Chủ tịch UBND"
                                    : "Chủ tịch MTTQ",
                    secretary: [
                        "Văn phòng Đảng ủy",
                        "Văn phòng HĐND",
                        "Văn phòng UBND",
                        "Cán bộ MTTQ",
                    ][i % 4],
                    participants: [
                        axisMeta[role].name,
                        "Văn phòng",
                        "Công chức chuyên môn",
                        "Tổ chuyển đổi số",
                    ],
                    agenda: `Rà soát số liệu IOC/CAD, kết luận giao nhiệm vụ và cập nhật tiến độ sau họp.`,
                    docs: [`Tài liệu_họp_${role}_${i + 1}.pdf`],
                    rawStatus: done ? "done" : late ? "late" : "planned",
                    prepared: i % 4 !== 1,
                    confirmed: i % 5 !== 2,
                });
            }
        });
        window.__calendarEvents = events;
    }
    function v13EventState(e) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = v13ParseIso(e.date);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / 86400000);
        if (e.rawStatus === "late")
            return { key: "late", label: "Trễ xác nhận/chuẩn bị", icon: "⚠️" };
        if (e.rawStatus === "done")
            return { key: "done", label: "Đã hoàn thành", icon: "✅" };
        if (diff === 0) return { key: "today", label: "Hôm nay", icon: "🔔" };
        if (diff > 0 && diff <= 7)
            return { key: "upcoming", label: "Sắp diễn ra", icon: "⏰" };
        return { key: "planned", label: "Đã lên lịch", icon: "📅" };
    }
    function v13CalScope() {
        v13EnsureCalendar();
        return (window.__calendarEvents || []).filter((e) =>
            allowedRoles().includes(e.role),
        );
    }
    function v13CalCounts() {
        const out = { today: 0, upcoming: 0, late: 0, planned: 0, done: 0 };
        v13CalScope().forEach((e) => out[v13EventState(e).key]++);
        return out;
    }
    function v13DateShort(e) {
        const d = v13ParseIso(e.date);
        return `${v13Pad(d.getDate())}/${v13Pad(d.getMonth() + 1)}`;
    }
    function v13TotalForRole(role) {
        return Object.keys(metricMeta).reduce(
            (sum, m) => sum + metricTotal(role, m),
            0,
        );
    }
    function v13StatusVisible(status) {
        return Object.keys(metricMeta).reduce(
            (sum, m) => sum + statusTotal(m, status, allowedRoles()),
            0,
        );
    }
    window.renderRoleScope = renderRoleScope = function () {
        const cfg = getChartConfig();
        const sizeCls =
            cfg.donutSize === "small"
                ? "chart-size-small"
                : cfg.donutSize === "large"
                    ? "chart-size-large"
                    : "";
        const el = document.getElementById("roleScopeCards");
        if (!el) return;
        el.className = `top-overview ${sizeCls}`;
        el.dataset.widget = "summary";
        el.innerHTML = `<div class="top-overview-head"><div class="top-overview-title">TỔNG QUAN ĐIỀU HÀNH NHIỆM VỤ/VĂN BẢN</div>
        <div style="display:flex">
            <button type="button" class="dongbo-bkav-btn" title="Kéo dữ liệu mới từ BKAV về theo tài khoản đang đăng nhập" onclick="dongBoBkav(this)" style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;padding:6px 9px;margin-right:10px;border:1px solid rgba(255,255,255,.4);border-radius:8px;background:rgba(255,255,255,.15);color:#fff;font-size:13px;font-weight:600;line-height:1;cursor:pointer;vertical-align:middle" aria-label="Đồng bộ dữ liệu từ BKAV"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"></path><polyline points="21 3 21 9 15 9"></polyline></svg>
        </button><button class="mini-btn" onclick="toggleWidgetBody(this)">−</button>
        </div>
        </div>
        <div class="top-overview-body overview-pie-body v12-overview-body widget-body-gd" id="overviewPieBody"></div>`;
    };

    window.renderSummary = renderSummary = function () {
        v13EnsureCalendar();
        const cfg = getChartConfig();
        const roles = allowedRoles();

        // 🟢 1. CẬP NHẬT METRIC SEGMENTS: Chỉ giữ lại Văn bản đến (docIn) và Văn bản đi (docOut)
        const metricSegments = ["docIn", "docOut"].map((m, i) => ({
            key: m,
            label: metricMeta[m].short,
            value: getDynamicMetricTotal(m), // Số thật từ QLVB (van-ban/summary) — xem fetchQlvbSummary().
            color: ["#2fb174", "#2c7dd2"][i % 2],
        }));
        // 2.ket qua xu ly
        console.log("window.metricsApiData", window.metricsApiData);
        const data = window.metricsApiData || {};
        const mapValueAssigned = {
            done: data?.assigned?.["hoanThanh"] || 0,
            doing: data?.assigned?.["chuaHtTrongHan"] || 0,
            risk: data?.assigned?.["chuaHtGanHan"] || 0,
            overdue: data?.assigned?.["chuaHtQuaHan"] || 0,
        };

        const mapValueReceived = {
            done: data?.received?.["hoanThanh"] || 0,
            doing: data?.received?.["chuaHtTrongHan"] || 0,
            risk: data?.received?.["chuaHtGanHan"] || 0,
            overdue: data?.received?.["chuaHtQuaHan"] || 0,
        };

        const assignedStatusSegments = statusDefs.map((st) => ({
            key: st.key,
            label: st.short,
            value: mapValueAssigned[st.key] || 0,
            color: st.color,
        }));

        const receivedStatusSegments = statusDefs.map((st) => ({
            key: st.key,
            label: st.short,
            value: mapValueReceived[st.key] || 0,
            color: st.color,
        }));

        console.log("assignedStatusSegments", assignedStatusSegments);
        console.log("receivedStatusSegments", receivedStatusSegments);
        const roleSegments = roles.map((r) => ({
            key: r,
            label: axisMeta[r].name,
            value: v13TotalForRole(r),
            color: axisMeta[r].color,
        }));

        const soon = v13StatusVisible("soon");
        const risk = v13StatusVisible("risk");
        const overdue = v13StatusVisible("overdue");
        const fire = roles.includes("UBND") ? 1 : 0;
        const meetAlert = v13CalScope().filter((e) =>
            ["today", "upcoming", "late"].includes(v13EventState(e).key),
        ).length;

        const alertSegments = [
            { key: "soon", label: "Sắp đến hạn", value: soon, color: "#d8a50c" },
            { key: "risk", label: "Nguy cơ trễ", value: risk, color: "#d25a19" },
            { key: "overdue", label: "Quá hạn", value: overdue, color: "#d33a44" },
            {
                key: "fire",
                label: "Cháy nổ/điểm nóng",
                value: fire,
                color: "#ff4c4c",
            },
            {
                key: "meetings",
                label: "Lịch họp cần nhắc",
                value: meetAlert,
                color: "#39d5ff",
            },
        ];

        const cal = v13CalCounts();
        const calSegments = [
            { key: "today", label: "Hôm nay", value: cal.today, color: "#39d5ff" },
            {
                key: "upcoming",
                label: "Sắp diễn ra",
                value: cal.upcoming,
                color: "#d8a50c",
            },
            { key: "late", label: "Trễ xác nhận", value: cal.late, color: "#d33a44" },
            {
                key: "planned",
                label: "Đã lên lịch",
                value: cal.planned,
                color: "#2c7dd2",
            },
            {
                key: "done",
                label: "Đã hoàn thành",
                value: cal.done,
                color: "#2fb174",
            },
        ];

        const next = v13CalScope()
            .filter((e) =>
                ["today", "upcoming", "late"].includes(v13EventState(e).key),
            )
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
            .slice(0, 3);

        const secretary = `<div class="v12-secretary"><div class="secretary-mini">${next
            .map((e) => {
                const st = v13EventState(e);
                return `<button class="secretary-row ${st.key === "late" ? "danger" : st.key === "upcoming" ? "warn" : ""}" onclick="openMeetingDetail('${e.id}')"><span>${st.icon}</span><b>${e.title}</b><small>${v13DateShort(e)} ${e.time}</small></button>`;
            })
            .join("") || '<div class="muted">Không có lịch cần nhắc.</div>'
            }<button class="ghost" onclick="openCalendar(null,'Lịch công tác - thư ký điều hành')">Mở calendar</button></div></div>`;

        // Map Card Render
        const cardMap = {
            metric: () =>
                v13PieCard(
                    "metric",
                    cfg.cards.metric.title,
                    cfg.cards.metric.note,
                    metricSegments,
                    "metric",
                    // Tổng văn bản đến + đi (cùng nguồn QLVB summary với legend).
                    fmt(metricSegments.reduce((a, s) => a + (s.value || 0), 0)),
                    "Hồ sơ",
                ),
            status: () =>
                v13PieCard(
                    "status",
                    cfg.cards.status.title,
                    cfg.cards.status.note,
                    assignedStatusSegments,
                    "assigned",
                    // Chỉ cộng 4 trạng thái đang vẽ, không dùng `tong` của API (gồm cả trạng thái không hiển thị).
                    fmt(assignedStatusSegments.reduce((a, s) => a + s.value, 0)),
                    "Nhiệm vụ giao",
                ),
            calendar: () =>
                v13PieCard(
                    "calendar",
                    cfg.cards.calendar.title,
                    cfg.cards.calendar.note,
                    receivedStatusSegments,
                    "received",
                    fmt(receivedStatusSegments.reduce((a, s) => a + s.value, 0)),
                    "Nhiệm vụ nhận",
                ),
            role: () =>
                v13PieCard(
                    "role",
                    cfg.cards.role.title,
                    `${cfg.cards.role.note} ${roles.map((r) => axisMeta[r].name).join(" · ")}.`,
                    roleSegments,
                    "role",
                    fmt(roleSegments.reduce((a, s) => a + s.value, 0)),
                    "Theo trục",
                ),
            alert: () =>
                v13PieCard(
                    "alert",
                    cfg.cards.alert.title,
                    cfg.cards.alert.note,
                    alertSegments,
                    "alert",
                    fmt(alertSegments.reduce((a, s) => a + s.value, 0)),
                    "Cảnh báo",
                ),
        };

        const row1 = ["metric", "calendar", "status"]
            .filter((k) => cfg.cards[k].visible)
            .map((k) => cardMap[k]())
            .join("");
        const body = document.getElementById("overviewPieBody");
        if (body)
            body.innerHTML = `${row1 ? `<div class="v12-pie-row v12-row-3">${row1}</div>` : '<div class="cfg-note">Tất cả biểu đồ đang bị ẩn. Vào trang Cấu hình để bật lại.</div>'}`;
    };
    function ensureConfigPage() {
        if (document.getElementById("configPage")) return;
        const page = document.createElement("section");
        page.id = "configPage";
        page.className = "config-page hidden";
        document.getElementById("app").appendChild(page);
    }
    window.showDashboardPage = function () {
        ensureConfigPage();
        document.getElementById("configPage").classList.add("hidden");
        document.getElementById("roleScopeCards")?.classList.remove("hidden");
        document.querySelector(".grid")?.classList.remove("hidden");
    };
    window.showConfigPage = function () {
        ensureConfigPage();
        document.getElementById("roleScopeCards")?.classList.add("hidden");
        document.querySelector(".grid")?.classList.add("hidden");
        document.getElementById("configPage").classList.remove("hidden");
        renderConfigPage();
    };
    window.__v13ActiveTab = window.__v13ActiveTab || "overview";
    window.renderNav = renderNav = function () {
        const tabs = [
            ["overview", "🌐 Tổng quan", ""],
            ["DANG", "🚩 Khối Đảng ủy", "DANG"],
            ["HDND", "🏛️ HĐND", "HDND"],
            ["UBND", "🏢 UBND", "UBND"],
            ["MTTQ", "🤝 MTTQ", "MTTQ"],
            ["fields", "📊 Lĩnh vực", ""],
            ["config", "⚙️ Cấu hình", ""],
        ];
        const nav = document.getElementById("navTabs");
        if (!nav) return;
        nav.innerHTML = tabs
            .map((t) => {
                const locked = t[2] && !canSeeRole(t[2]);
                const active =
                    window.__v13ActiveTab === t[0] ||
                    (t[2] && window.__v13ActiveTab === t[2]);
                return `<button class="${active ? "active" : ""} ${locked ? "locked" : ""}" ${locked ? 'title="Không thuộc quyền xem"' : ""} onclick="navClick('${t[0]}','${t[2] || ""}')">${t[1]}</button>`;
            })
            .join("");
    };
    window.navClick = navClick = function (tab, role) {
        if (role && !canSeeRole(role)) {
            toast("Tài khoản hiện tại không có quyền xem trục này.");
            return;
        }
        window.__v13ActiveTab = role || tab;
        renderNav();
        if (tab === "config") {
            showConfigPage();
            return;
        }
        showDashboardPage();
        if (role) {
            activeIndicatorRole = role;
            renderIndicators();
            document
                .querySelector('[data-widget="indicators"]')
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if (tab === "fields") {
            document
                .querySelector('[data-widget="indicators"]')
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };
    const oldRenderAllV13 = window.renderAll || renderAll;
    window.renderAll = renderAll = function () {
        oldRenderAllV13();
        ensureConfigPage();
        if (window.__v13ActiveTab === "config") showConfigPage();
        else showDashboardPage();
    };
    window.renderConfigPage = function () {
        ensureConfigPage();
        const cfg = getChartConfig();
        const page = document.getElementById("configPage");
        if (!page) return;
        const roles = allowedRoles();
        const totalRecords = records.filter((r) => roles.includes(r.role)).length;
        const totalIndicators = roles.reduce(
            (a, r) => a + (indicators[r] || []).reduce((s, it) => s + it[1], 0),
            0,
        );
        const chartRows = chartOrder
            .map(
                (k) =>
                    `<div class="chart-config-row"><input type="checkbox" ${cfg.cards[k].visible ? "checked" : ""} onchange="setChartVisible('${k}',this.checked)"/><div><b>${chartKeyLabel[k]}</b><small>${k}</small></div><input value="${cfg.cards[k].title.replace(/"/g, "&quot;")}" oninput="setChartTitle('${k}',this.value)"/><input value="${cfg.cards[k].note.replace(/"/g, "&quot;")}" oninput="setChartNote('${k}',this.value)"/></div>`,
            )
            .join("");
        const sources = sourceDefs();
        const sourceRows = sources
            .map((s) => {
                const t = sourceAt(s);
                return `<div class="source-config-row"><div class="dot">${s.icon || "🔗"}</div><input value="${s.name}" onchange="setSourceField('${s.key}','name',this.value)"/><input value="${s.freq || ""}" onchange="setSourceField('${s.key}','freq',this.value)"/><input value="${s.owner || ""}" onchange="setSourceField('${s.key}','owner',this.value)"/><select onchange="setSourceField('${s.key}','status',this.value)"><option value="ok" ${s.status === "ok" ? "selected" : ""}>Đúng SLA</option><option value="late" ${s.status === "late" ? "selected" : ""}>Cần cập nhật</option><option value="stale" ${s.status === "stale" ? "selected" : ""}>Quá hạn dữ liệu</option></select><small class="muted" style="grid-column:2/-1">Cập nhật gần nhất: ${v13dt(t)} · ${v13rel(t)} · ${fmt(s.rows || 0)} dòng · ${s.mode || ""}</small></div>`;
            })
            .join("");
        const matrixRows = [];
        roles.forEach((r) =>
            Object.keys(metricMeta).forEach((m) =>
                statusDefs.forEach((st) => {
                    matrixRows.push(
                        `<tr><td>${axisMeta[r].icon} ${axisMeta[r].name}</td><td>${metricMeta[m].short}</td><td>${st.short}</td><td><input type="number" min="0" value="${segmentTemplate[r][m][st.key] || 0}" data-count-input="${r}|${m}|${st.key}"/></td></tr>`,
                    );
                }),
            ),
        );
        const hidden = getHiddenWidgets();
        page.innerHTML = `<section class="config-hero"><div class="config-hero-head"><h2>⚙️ Trang cấu hình biểu đồ, widget, nguồn dữ liệu và notify</h2><small>${currentAccount?.title || ""} · cấu hình lưu theo tài khoản</small></div><div class="config-body"><div class="config-grid-3"><div class="mini-stat"><b class="mono">${fmt(totalRecords)}</b><span>Hồ sơ/nhiệm vụ/văn bản trong quyền xem</span></div><div class="mini-stat"><b class="mono">${fmt(totalIndicators)}</b><span>Bản ghi chỉ tiêu theo phụ lục khảo sát</span></div><div class="mini-stat"><b class="mono">${fmt(sources.length)}</b><span>Nguồn dữ liệu đang cấu hình cập nhật</span></div></div><div class="config-grid-2"><div class="config-card"><h3>Cấu hình các biểu đồ pie/donut ở Mục 1</h3><p>Bật/tắt biểu đồ, đổi tiêu đề, mô tả; sau khi chỉnh dashboard cập nhật ngay.</p><div class="cfg-toolbar" style="margin-bottom:10px"><label>Size biểu đồ <select onchange="setChartSize(this.value)"><option value="small" ${cfg.donutSize === "small" ? "selected" : ""}>Nhỏ</option><option value="normal" ${cfg.donutSize === "normal" ? "selected" : ""}>Chuẩn</option><option value="large" ${cfg.donutSize === "large" ? "selected" : ""}>Lớn</option></select></label><label>Label <select onchange="setLegendMode(this.value)"><option value="full" ${cfg.legendMode === "full" ? "selected" : ""}>Đầy đủ nhãn + số</option><option value="compact" ${cfg.legendMode === "compact" ? "selected" : ""}>Gọn nhãn</option><option value="noValue" ${cfg.legendMode === "noValue" ? "selected" : ""}>Ẩn số ở legend</option></select></label><button class="ghost" onclick="resetChartConfig()">Reset biểu đồ</button><button class="primary" onclick="exportChartsHtml()">Xuất HTML biểu đồ</button></div><div class="chart-config-list">${chartRows}</div></div><div class="config-card"><h3>Ẩn/hiện widget dashboard</h3><p>Giống nút ẩn/hiện widget, nhưng đưa vào trang cấu hình để quản trị rõ hơn.</p><div class="custom-list">${Object.keys(
            widgetLabels,
        )
            .map(
                (k) =>
                    `<label><input type="checkbox" ${hidden.includes(k) ? "" : "checked"} onchange="toggleWidgetPref('${k}',this.checked)"/><span><b>${widgetLabels[k]}</b><br/><small class="muted">${hidden.includes(k) ? "Đang ẩn" : "Đang hiển thị"}</small></span></label>`,
            )
            .join(
                "",
            )}</div><div class="cfg-note" style="margin-top:10px">Tài khoản Đảng ủy xem tất cả; UBND xem UBND đầy đủ và tổng hợp HĐND/MTTQ; HĐND/MTTQ xem theo trục của mình.</div></div></div><div class="config-card"><h3>Nguồn dữ liệu & lịch cập nhật</h3><p>Cấu hình tên nguồn, SLA, đơn vị phụ trách. Thời điểm cập nhật gần nhất vẫn hiển thị ở Mục 3 và detail nguồn.</p><div class="source-config-list">${sourceRows}</div><div class="action-bar" style="margin-top:10px"><button class="primary" onclick="renderSources();toast('Đã áp dụng cấu hình nguồn dữ liệu vào Mục 3')">Áp dụng nguồn dữ liệu</button><button class="ghost" onclick="openSourceDetail((window.__v10Sources||[])[0]?.key||'api')">Kiểm tra nhanh nguồn đầu tiên</button></div></div><div class="config-grid-2"><div class="config-card"><h3>Cấu hình số liệu demo cho biểu đồ nhiệm vụ/văn bản</h3><p>Sửa số lượng theo trục, loại hồ sơ và trạng thái. Lưu xong hệ thống sinh lại records để click đúng số lượng.</p><div class="count-matrix-wrap"><table class="count-matrix"><thead><tr><th>Trục</th><th>Loại</th><th>Trạng thái</th><th>Số lượng</th></tr></thead><tbody>${matrixRows.join("")}</tbody></table></div><div class="action-bar" style="margin-top:10px"><button class="primary" onclick="saveCountMatrix()">Lưu & sinh lại sample data</button><button class="ghost" onclick="renderConfigPage()">Hủy thay đổi</button></div></div><div class="config-card"><h3>Notify IOC/CAD & cấu hình xuất/nhập</h3><p>Notify được sinh từ Rule engine theo SLA, nguồn API/CSDL sự kiện, calendar thư ký và nhập thủ công bởi cán bộ trực IOC.</p><div class="cfg-toolbar"><button class="primary" onclick="openNotifyForm()">＋ Nhập notify</button><button class="ghost" onclick="openNotifySourceConfig()">Cấu hình nguồn notify</button><button class="ghost" onclick="exportConfigJson()">Xuất JSON cấu hình</button><button class="ghost" onclick="importConfigJson()">Nhập JSON cấu hình</button></div><textarea id="cfgJson" class="config-json" placeholder="JSON cấu hình sẽ hiển thị tại đây..."></textarea></div></div></div></section>`;
    };
    window.setChartVisible = function (k, v) {
        const cfg = getChartConfig();
        cfg.cards[k].visible = v;
        saveChartConfig(cfg);
        renderRoleScope();
        renderSummary();
        renderConfigPage();
    };
    window.setChartTitle = function (k, v) {
        const cfg = getChartConfig();
        cfg.cards[k].title = v || chartDefaults.cards[k].title;
        saveChartConfig(cfg);
        renderSummary();
    };
    window.setChartNote = function (k, v) {
        const cfg = getChartConfig();
        cfg.cards[k].note = v || chartDefaults.cards[k].note;
        saveChartConfig(cfg);
        renderSummary();
    };
    window.setChartSize = function (v) {
        const cfg = getChartConfig();
        cfg.donutSize = v;
        saveChartConfig(cfg);
        renderRoleScope();
        renderSummary();
        renderConfigPage();
    };
    window.setLegendMode = function (v) {
        const cfg = getChartConfig();
        cfg.legendMode = v;
        saveChartConfig(cfg);
        renderSummary();
        renderConfigPage();
    };
    window.resetChartConfig = function () {
        localStorage.removeItem(cfgKey());
        renderRoleScope();
        renderSummary();
        renderConfigPage();
        toast("Đã reset cấu hình biểu đồ.");
    };
    window.setSourceField = function (key, field, value) {
        const s = sourceDefs().find((x) => x.key === key);
        if (s) {
            s[field] = value;
            renderSources();
        }
    };
    window.saveCountMatrix = function () {
        document.querySelectorAll("[data-count-input]").forEach((inp) => {
            const [r, m, st] = inp.dataset.countInput.split("|");
            segmentTemplate[r][m][st] = Math.max(0, Number(inp.value || 0));
        });
        generateRecords();
        try {
            if (typeof v12AddCitizenIndicator === "function")
                v12AddCitizenIndicator();
            if (typeof v12SeedSubtasks === "function") v12SeedSubtasks();
        } catch (e) { }
        renderAll();
        showConfigPage();
        toast("Đã sinh lại dữ liệu demo theo cấu hình số lượng.");
    };
    window.exportConfigJson = function () {
        const data = {
            chartConfig: getChartConfig(),
            sources: sourceDefs().map((s) => ({
                key: s.key,
                name: s.name,
                freq: s.freq,
                owner: s.owner,
                status: s.status,
            })),
            segmentTemplate,
        };
        document.getElementById("cfgJson").value = JSON.stringify(data, null, 2);
        toast("Đã xuất JSON cấu hình vào ô nội dung.");
    };
    window.importConfigJson = function () {
        try {
            const data = JSON.parse(document.getElementById("cfgJson").value || "{}");
            if (data.chartConfig) saveChartConfig(data.chartConfig);
            if (data.segmentTemplate) {
                Object.keys(data.segmentTemplate).forEach((r) =>
                    Object.keys(data.segmentTemplate[r]).forEach((m) =>
                        Object.keys(data.segmentTemplate[r][m]).forEach((st) => {
                            if (segmentTemplate[r]?.[m])
                                segmentTemplate[r][m][st] = Number(
                                    data.segmentTemplate[r][m][st] || 0,
                                );
                        }),
                    ),
                );
                generateRecords();
            }
            renderAll();
            showConfigPage();
            toast("Đã nhập cấu hình demo.");
        } catch (e) {
            toast("JSON không hợp lệ.");
        }
    };
    window.exportChartsHtml = function () {
        renderRoleScope();
        renderSummary();
        const html = document.getElementById("roleScopeCards")?.outerHTML || "";
        const doc = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Biểu đồ IOC phường Việt Hưng</title><style>body{margin:0;background:#04101d;color:#ecf7ff;font-family:Segoe UI,Arial,sans-serif;padding:18px}.top-overview{border:1px solid #1f6fa6;background:#071d35;border-radius:16px;overflow:hidden}.top-overview-head{height:44px;background:linear-gradient(180deg,#b3212a,#7a1118);display:flex;align-items:center;padding:0 14px}.top-overview-title{font-weight:900;text-transform:uppercase}.top-overview-body{padding:14px;display:grid;gap:14px}.v12-pie-row{display:grid;gap:14px}.v12-row-3{grid-template-columns:repeat(3,1fr)}.v12-row-2{grid-template-columns:repeat(2,1fr)}.summary-pie-card{border:1px solid rgba(87,178,255,.25);border-radius:14px;padding:12px;background:#082039}.v12-card-body{display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center}.overview-donut{width:150px;height:150px}.overview-center{font-size:17px;font-weight:900;fill:#ecf7ff}.overview-sub{font-size:7px;fill:#a8c3d8}.overview-legend{display:grid;gap:6px}.overview-legend button{border:1px solid rgba(87,178,255,.25);background:#061a2f;color:#ecf7ff;border-radius:9px;padding:6px;display:grid;grid-template-columns:12px 1fr auto;gap:6px}.overview-legend i{width:12px;height:12px;border-radius:3px}@media(max-width:1100px){.v12-row-3,.v12-row-2{grid-template-columns:1fr}}</style></head><body>${html}</body></html>`;
        const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bieu_do_ioc_phuong_viet_hung.html";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast("Đã xuất HTML chỉ gồm các biểu đồ hiện hành.");
    };
    ensureConfigPage();
})();

(function () {
    const categorySeed = {
        DANG: [
            {
                id: "dang-dieu-hanh",
                name: "Đảng ủy · Điều hành – chỉ đạo",
                field: "Đảng Ủy",
                desc: "Lịch công tác Ban Thường vụ, lịch Thường trực HĐND và lịch lãnh đạo UBND phối hợp.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Lịch công tác Ban Thường vụ Đảng ủy", 18, "Tuần", "API/Excel"],
                    ["Lịch Thường trực HĐND", 12, "Tuần", "Excel"],
                    ["Lịch lãnh đạo UBND phối hợp", 15, "Tuần", "Excel/API"],
                ],
            },
            {
                id: "dang-nghi-quyet",
                name: "Chỉ tiêu nghị quyết / nhiệm vụ chính trị",
                field: "Đảng Ủy",
                desc: "Chỉ tiêu Nghị quyết Đại hội, nghị quyết chuyên đề, chương trình công tác toàn khóa.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Chỉ tiêu Nghị quyết Đại hội", 24, "Tháng", "CSDL"],
                    ["Theo dõi thực hiện nghị quyết chuyên đề", 17, "Tuần", "Excel"],
                    [
                        "Tiến độ thực hiện chương trình công tác toàn khóa",
                        12,
                        "Tháng",
                        "CSDL",
                    ],
                ],
            },
            {
                id: "dang-to-chuc",
                name: "Công tác tổ chức Đảng",
                field: "Đảng Ủy",
                desc: "Đảng viên, cán bộ, kiểm tra – giám sát, tuyên giáo – dân vận, chuyển đổi số Đảng, văn bản điều hành.",
                types: ["Excel", "API", "CSDL", "File cứng A4", "PDF"],
                items: [
                    ["Công tác Đảng viên", 46, "Tháng", "CSDL"],
                    ["Công tác cán bộ", 21, "Khi phát sinh", "CSDL"],
                    ["Kiểm tra – giám sát", 16, "Tháng", "Excel"],
                    ["Tuyên giáo – dân vận", 28, "Tuần", "Excel"],
                    ["Chuyển đổi số Đảng", 9, "Tháng", "API"],
                    ["Văn bản – điều hành", 62, "Ngày", "API"],
                ],
            },
        ],
        HDND: [
            {
                id: "hdnd-ky-hop",
                name: "HĐND · Điều hành kỳ họp",
                field: "HĐND",
                desc: "Danh sách kỳ họp, chương trình kỳ họp và nội dung nghị quyết.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Danh sách kỳ họp HĐND", 6, "Quý", "Excel"],
                    ["Chương trình kỳ họp", 11, "Khi phát sinh", "Excel"],
                    ["Nội dung nghị quyết", 14, "Khi phát sinh", "CSDL"],
                ],
            },
            {
                id: "hdnd-nghi-quyet",
                name: "Theo dõi nghị quyết HĐND",
                field: "HĐND",
                desc: "Theo dõi nghị quyết HĐND theo nhóm kinh tế – xã hội, đô thị, an sinh và môi trường.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Theo dõi nghị quyết HĐND: Kinh tế – xã hội", 9, "Tháng", "Excel"],
                    ["Theo dõi nghị quyết HĐND: Đô thị", 7, "Tháng", "Excel"],
                    ["Theo dõi nghị quyết HĐND: An sinh", 8, "Tháng", "Excel"],
                    ["Theo dõi nghị quyết HĐND: Môi trường", 5, "Tháng", "Excel"],
                ],
            },
            {
                id: "hdnd-giam-sat",
                name: "Giám sát HĐND",
                field: "HĐND",
                desc: "Hoạt động giám sát và kết quả giám sát.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Hoạt động giám sát HĐND", 13, "Tháng", "CSDL"],
                    ["Kết quả giám sát HĐND", 12, "Tháng", "CSDL"],
                ],
            },
            {
                id: "hdnd-cu-tri",
                name: "Cử tri – kiến nghị",
                field: "HĐND",
                desc: "Giải quyết kiến nghị cử tri, tiến độ xử lý kiến nghị và tổng số ý kiến liên quan.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Giải quyết kiến nghị cử tri", 31, "Tuần", "Excel/API"],
                    ["Tiến độ xử lý kiến nghị cử tri", 29, "Tuần", "Excel/API"],
                    [
                        "Tổng số ý kiến liên quan đến kiến nghị cử tri",
                        87,
                        "Tuần",
                        "Excel/API cử tri",
                    ],
                ],
            },
        ],
        MTTQ: [
            {
                id: "mttq-phan-bien",
                name: "MTTQ · Phản biện xã hội",
                field: "MTTQ",
                desc: "Thống kê phản biện xã hội và tình trạng xử lý kết quả phản biện.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Thống kê phản biện xã hội", 12, "Tháng", "Excel"],
                    ["Báo cáo kết quả phản biện xã hội", 18, "Tháng", "Excel"],
                ],
            },
            {
                id: "mttq-quy",
                name: "MTTQ · Quỹ ủng hộ",
                field: "MTTQ",
                desc: "Thống kê quỹ ủng hộ, kết quả vận động và chi hỗ trợ.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Thống kê quỹ ủng hộ", 9, "Tháng", "Excel/CSDL"],
                    ["Kết quả vận động quỹ ủng hộ", 15, "Tháng", "Excel"],
                ],
            },
            {
                id: "doan-the",
                name: "Đoàn thể · Chỉ tiêu hoạt động",
                field: "Đoàn Thể",
                desc: "Đoàn Thanh niên, Hội Phụ nữ, Hội Cựu chiến binh, Công đoàn và các hội quần chúng.",
                types: ["Excel", "API", "CSDL", "File cứng A4", "PDF"],
                items: [
                    ["Đoàn Thanh niên: Chỉ tiêu công tác đoàn", 21, "Tháng", "Excel"],
                    ["Đoàn Thanh niên: Thi đua khen thưởng", 8, "Quý", "Excel"],
                    ["Hội Liên hiệp Phụ nữ: Mô hình hoạt động", 16, "Tháng", "Excel"],
                    ["Hội Liên hiệp Phụ nữ: Thi đua", 11, "Quý", "Excel"],
                    ["Hội Cựu chiến binh: Chỉ tiêu công tác", 14, "Tháng", "Excel"],
                    ["Hội Cựu chiến binh: Biên chế tổ chức", 7, "Quý", "Excel"],
                    ["Công đoàn: Đoàn viên", 68, "Tháng", "CSDL"],
                    ["Công đoàn: Thỏa ước lao động", 10, "Quý", "Excel"],
                    ["Công đoàn: Chăm lo đoàn viên", 19, "Tháng", "Excel"],
                    ["Các hội quần chúng: Danh sách hội", 15, "Quý", "Excel"],
                    ["Các hội quần chúng: Chỉ tiêu hoạt động", 23, "Tháng", "Excel"],
                ],
            },
        ],
        UBND: [
            {
                id: "ubnd-hanh-chinh-cong",
                name: "Hành chính công",
                field: "Hành chính công",
                desc: "Tổng hồ sơ tiếp nhận, tỷ lệ đồng bộ DVC quốc gia, đánh giá hài lòng, kết quả giải quyết hồ sơ.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Tổng số TTHC tiếp nhận", 243, "Ngày", "API Một cửa"],
                    ["TTHC đang xử lý", 52, "Realtime", "API"],
                    ["Tỷ lệ đồng bộ DVC quốc gia", 97, "Ngày", "API"],
                    ["Số lượt đánh giá hài lòng", 138, "Tháng", "API"],
                    ["Kết quả giải quyết hồ sơ hành chính công", 214, "Tháng", "API"],
                ],
            },
            {
                id: "ubnd-giao-duc",
                name: "Giáo dục",
                field: "Giáo dục",
                desc: "Học sinh theo trường/khối/lớp, giáo viên theo trình độ, cơ sở vật chất trường học.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Học sinh theo trường/khối/lớp", 1840, "Tháng", "Excel"],
                    ["Giáo viên theo trình độ & quản lý", 146, "Quý", "Excel"],
                    ["Cơ sở vật chất trường học", 96, "Quý", "Excel"],
                ],
            },
            {
                id: "ubnd-van-ban",
                name: "Quản lý văn bản",
                field: "Quản lý văn bản",
                desc: "Văn bản đến, văn bản khác/liên thông, đơn thư, ý kiến/kiến nghị, thông báo kết luận.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Văn bản đến theo trạng thái", 188, "Ngày", "API"],
                    ["Văn bản đi/liên thông/nội bộ", 134, "Ngày", "API"],
                    ["Đơn thư, khiếu nại, phản ánh", 42, "Tuần", "Excel"],
                    ["Ý kiến, kiến nghị theo đơn vị thực hiện", 57, "Tuần", "Excel/API"],
                    ["Thông báo kết luận theo trạng thái", 33, "Tuần", "API"],
                ],
            },
            {
                id: "ubnd-noi-vu",
                name: "Nội vụ",
                field: "Nội vụ",
                desc: "Nhân sự, biên chế, biến động tăng/giảm và đối tượng chính sách.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Nhân sự, biên chế", 212, "Tháng", "CSDL"],
                    ["Đối tượng chính sách", 318, "Tháng", "CSDL"],
                ],
            },
            {
                id: "ubnd-cong-thuong",
                name: "Công thương",
                field: "Công thương",
                desc: "Ki-ốt trong chợ, giấy phép kinh doanh rượu, cơ sở kinh doanh theo dữ liệu thuế và biến động theo tháng.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Ki-ốt, cơ sở kinh doanh, giấy phép", 86, "Tháng", "Excel/Thuế"],
                    ["Biến động công thương theo tháng", 24, "Tháng", "Excel/Thuế"],
                ],
            },
            {
                id: "ubnd-van-hoa",
                name: "Văn hóa – Di tích",
                field: "Văn hóa – Di tích",
                desc: "Lễ hội, nghệ nhân, di tích, hồ sơ quyết định xếp hạng và bản vẽ kỹ thuật nếu có.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Lễ hội theo thời gian", 18, "Quý", "Excel/PDF"],
                    ["Nghệ nhân", 8, "Năm", "Excel/PDF"],
                    ["Di tích", 13, "Quý", "Excel/PDF"],
                ],
            },
            {
                id: "ubnd-y-te",
                name: "Y tế ngoài công lập",
                field: "Y tế ngoài công lập",
                desc: "Cơ sở y tế đạt chuẩn, cần kiểm tra, dừng hoạt động và phân loại theo loại hình.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [["Cơ sở y tế ngoài công lập", 28, "Tháng", "Excel"]],
            },
            {
                id: "ubnd-tai-chinh",
                name: "Tài chính – Ngân sách",
                field: "Tài chính – Ngân sách",
                desc: "Thu – chi theo thời gian, dự toán, chi đầu tư/chi thường xuyên, cơ cấu thu chi và so sánh dự toán – thực hiện.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Thu ngân sách", 86, "Tháng", "CSDL kế toán"],
                    ["Chi ngân sách", 74, "Tháng", "CSDL kế toán"],
                    ["Cơ cấu thu/chi ngân sách", 64, "Tháng", "CSDL kế toán"],
                    ["So sánh dự toán và thực hiện", 32, "Tháng", "CSDL kế toán"],
                ],
            },
            {
                id: "ubnd-gpmb",
                name: "Giải phóng mặt bằng",
                field: "Giải phóng mặt bằng",
                desc: "Dự án GPMB, đối tượng GPMB, tình trạng bàn giao/bồi thường và tiến độ các bước.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Dự án giải phóng mặt bằng", 11, "Tuần", "Excel/CSDL"],
                    ["Đối tượng GPMB", 146, "Tuần", "Excel/CSDL"],
                    ["Tiến độ các bước giải phóng mặt bằng", 39, "Tuần", "Excel/CSDL"],
                ],
            },
            {
                id: "ubnd-do-thi",
                name: "Đô thị",
                field: "Đô thị",
                desc: "Rà soát chung cư, hội nghị tham gia, chung cư chưa có BQL, tranh chấp và thống kê tổng quan.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [
                    ["Đô thị: chung cư, hội nghị, tranh chấp", 19, "Tháng", "Excel"],
                    ["Chung cư chưa có BQL", 7, "Tháng", "Excel"],
                    ["Chung cư xảy ra tranh chấp", 5, "Tháng", "Excel"],
                ],
            },
            {
                id: "ubnd-ktxh",
                name: "Kinh tế xã hội",
                field: "Kinh tế xã hội",
                desc: "Các chỉ số kinh tế xã hội phường/xã theo tháng, quý, năm.",
                types: ["Excel", "API", "CSDL", "PDF"],
                items: [["Kinh tế xã hội theo tháng/quý/năm", 25, "Tháng", "CSDL"]],
            },
        ],
    };
    window.__v14Categories = categorySeed;
    function v14AllowedCategoryRoles() {
        return allowedRoles().filter((r) => categorySeed[r]);
    }
    function v14AddIndicator(role, item) {
        indicators[role] = indicators[role] || [];
        const [name, count, freq, source] = item;
        let idx = indicators[role].findIndex((x) => x[0] === name);
        if (idx < 0) {
            indicators[role].push([name, count, freq, source]);
            idx = indicators[role].length - 1;
        }
        if (
            !indicatorRecords.some((r) => r.role === role && r.indicator === name)
        ) {
            for (let i = 0; i < count; i++) {
                const st = statusDefs[(i + idx) % statusDefs.length];
                indicatorRecords.push({
                    id: `CT-${role}-V14-${idx + 1}-${String(i + 1).padStart(4, "0")}`,
                    role,
                    indicator: name,
                    status: st.key,
                    title: `${name} - bản ghi ${i + 1}`,
                    field: name,
                    source,
                    freq,
                    unit: pick(units, i + idx),
                    due: dueDate(i, st.key),
                    progress: progressFor(st.key, i),
                    description: `Bản ghi thuộc nhóm chỉ tiêu ${name}; dữ liệu được phân cấp theo lĩnh vực, nguồn ${source}, tần suất ${freq}.`,
                    history: [
                        {
                            time: "08:00 30/06/2026",
                            text: "Đồng bộ/nhập mẫu theo phụ lục khảo sát xã phường",
                        },
                        {
                            time: "09:10 30/06/2026",
                            text: "Xác nhận phạm vi hiển thị theo phân quyền",
                        },
                    ],
                });
            }
        }
    }
    function v14EnsureCategoryData() {
        Object.keys(categorySeed).forEach((role) =>
            categorySeed[role].forEach((cat) =>
                cat.items.forEach((item) => v14AddIndicator(role, item)),
            ),
        );
    }
    v14EnsureCategoryData();
    function catTotal(cat) {
        return cat.items.reduce((s, it) => s + (Number(it[1]) || 0), 0);
    }
    function catSources(cat) {
        return [...new Set(cat.items.map((x) => String(x[3]).split("/")[0]))]
            .slice(0, 3)
            .join(" · ");
    }
    window.__v14ActiveCategoryRole = window.__v14ActiveCategoryRole || "ALL";
    window.renderCategoryGrid = function () {
        const grid = document.getElementById("indicatorGrid");
        if (!grid) return;
        const roles = v14AllowedCategoryRoles();
        const q = (
            document.getElementById("categorySearch")?.value || ""
        ).toLowerCase();
        const sourceRoles =
            window.__v14ActiveCategoryRole === "ALL"
                ? roles
                : [window.__v14ActiveCategoryRole];
        const cats = [];
        sourceRoles.forEach((r) =>
            (categorySeed[r] || []).forEach((c) => cats.push({ ...c, role: r })),
        );
        const filtered = cats.filter((c) => !q || c.name.toLowerCase().includes(q));
        grid.className = "field-category-grid";
        grid.innerHTML =
            filtered
                .map(
                    (c) =>
                        `<button class="field-category-card" onclick="openCategoryDetail('${c.role}','${c.id}')"><div class="field-category-meta"><span class="badge ${c.role === "UBND" ? "ok" : c.role === "HDND" ? "gold" : c.role === "MTTQ" ? "" : "red"}">${axisMeta[c.role].icon} ${axisMeta[c.role].name}</span><span class="badge">${c.items.length} chỉ tiêu</span></div><h4>${c.name}</h4>${window.renderCatDonut ? window.renderCatDonut(c) : ""}</button>`,
                )
                .join("") ||
            '<div class="access-lock">Không có lĩnh vực phù hợp bộ lọc.</div>';
    };
    window.renderIndicators = renderIndicators = function () {
        v14EnsureCategoryData();
        const roles = v14AllowedCategoryRoles();
        if (
            !roles.includes(window.__v14ActiveCategoryRole) &&
            window.__v14ActiveCategoryRole !== "ALL"
        )
            window.__v14ActiveCategoryRole = "ALL";
        const tabs = document.getElementById("indicatorRoleTabs");
        const grid = document.getElementById("indicatorGrid");
        if (!tabs || !grid) return;
        const prevQ = document.getElementById("categorySearch")?.value || "";
        tabs.innerHTML = `<div class="field-category-toolbar"><div class="field-category-tabs"><button class="${window.__v14ActiveCategoryRole === "ALL" ? "active" : ""}" onclick="setFieldCategoryRole('ALL')">🌐 Tất cả lĩnh vực được phép xem</button>${roles.map((r) => `<button class="${window.__v14ActiveCategoryRole === r ? "active" : ""}" onclick="setFieldCategoryRole('${r}')">${axisMeta[r].icon} ${axisMeta[r].name}</button>`).join("")}</div><div class="field-category-search"><input id="categorySearch" placeholder="Tìm lĩnh vực..." oninput="renderCategoryGrid()" /></div></div>`;
        if (prevQ) document.getElementById("categorySearch").value = prevQ;
        renderCategoryGrid();
    };
    window.setFieldCategoryRole = function (role) {
        window.__v14ActiveCategoryRole = role;
        renderIndicators();
    };
    window.openCategoryDetail = function (role, catId) {
        if (!canSeeRole(role)) {
            toast("Không có quyền xem lĩnh vực này.");
            return;
        }
        const cat = (categorySeed[role] || []).find((c) => c.id === catId);
        if (!cat) return;
        const total = catTotal(cat);
        document.getElementById("drawerTitle").textContent =
            `Lĩnh vực: ${cat.name}`;
        document.getElementById("drawerBody").innerHTML =
            `<div class="category-detail-head"><div><h4>${axisMeta[role].icon} ${cat.name}</h4><p>${cat.desc}</p><div class="field-category-meta" style="margin-top:8px"><span class="badge gold">${fmt(total)} bản ghi</span><span class="badge">${cat.items.length} chỉ tiêu</span>${cat.types.map((t) => `<span class="badge">${t}</span>`).join("")}</div></div><button class="primary" onclick="qlnvxOpenAssignmentForm()">＋ Giao nhiệm vụ theo lĩnh vực</button></div><div class="category-item-grid">${cat.items.map((it, idx) => `<article class="category-item-card"><h5>${it[0]}</h5><div class="field-category-meta"><span class="badge">${it[2]}</span><span class="badge ${String(it[3]).includes("API") ? "ok" : "gold"}">${it[3]}</span><span class="badge gold mono">${fmt(it[1])}</span></div><div class="mini-progress"><i style="width:${Math.min(96, 50 + idx * 5)}%"></i></div><div class="actions"><button class="primary" onclick="openIndicatorByName('${role}', '${encodeURIComponent(it[0])}')">Xem dữ liệu</button><button class="ghost" onclick="qlnvxOpenAssignmentForm()">Giao xử lý</button></div></article>`).join("")}</div>`;
        openDrawer();
    };
    const v14PrevOpenIndicator = window.openIndicator || openIndicator;
    window.openIndicatorByName = function (role, encodedName) {
        const name = decodeURIComponent(encodedName);
        let idx = indicators[role].findIndex((x) => x[0] === name);
        if (idx < 0) {
            v14AddIndicator(role, [name, 10, "Tháng", "Excel"]);
            idx = indicators[role].length - 1;
        }
        v14PrevOpenIndicator(role, idx);
    };

    /* Bộ kịch bản cũ ở đây từng là 4 kịch bản hardcode riêng (thiếu "kiến nghị cử tri"),
       tách rời bộ V15 bên dưới -> sửa nội dung kịch bản phải sửa 2 chỗ, quên là 2 màn
       hiện khác nhau. Giờ cả hai trỏ vào CÙNG một cache nạp từ /qlnv/scenarios.
       Lưu ý: scenarioLoadAll() cập nhật cache TẠI CHỖ, không gán object mới, nên tham
       chiếu `scenarioTemplates` giữ ở đây luôn còn hiệu lực. */
    window.__scenarioCache = window.__scenarioCache || {};
    const scenarioTemplates = window.__scenarioCache;
    // Form giao nhiệm vụ (ngoài IIFE này) dùng lại bộ kịch bản mẫu để chọn kịch bản xử lý.
    window.__scenarioTemplates = scenarioTemplates;
    function scenarioForRecord(r) {
        const arr = [];
        if (r.status === "overdue") arr.push("overdue");
        if (["risk", "soon"].includes(r.status) || Number(r.progress || 0) < 70)
            arr.push("slow");
        if (
            r.metric === "indicator" ||
            /dữ liệu|chỉ tiêu|bản ghi/i.test(r.title || "")
        )
            arr.push("data");
        arr.push("coordinate");
        return [...new Set(arr)];
    }
    window.qlnvxOpenSubTaskForm = function (id) {
        (console.log("id nhiem vu nhanh", id), openScenarioSelector(id));
    };
    window.openScenarioSelector = function (id) {
        const r = records.find((x) => x.id === id);
        if (!r) return;
        const keys = scenarioForRecord(r);
        const st = statusMeta(r.status);
        document.getElementById("modalTitle").textContent =
            "Chọn kịch bản xử lý trước khi giao nhiệm vụ nhánh";
        document.getElementById("modalSub").textContent = `${r.id} · ${r.title}`;
        document.getElementById("modalBody").innerHTML =
            `<div class="scenario-history-badge"><b>Trạng thái hồ sơ chính:</b> <span style="color:${st.color}">${st.label}</span> · Tiến độ ${r.progress}% · Hạn ${r.due}. Chọn 01 kịch bản để hệ thống đề xuất nhiệm vụ nhánh phù hợp.</div><div class="scenario-grid">${keys
                .map((k) => {
                    const s = scenarioTemplates[k];
                    return `<button class="scenario-card" onclick="selectScenario('${id}','${k}')"><div class="scenario-severity"><span class="badge ${s.level === "Khẩn" ? "red" : s.level === "Cao" ? "warn" : "ok"}">${s.level}</span><span class="badge">${s.tasks.length} nhiệm vụ nhánh gợi ý</span></div><h4>${s.title}</h4><p>${s.desc}</p><ul>${s.sla.map((x) => `<li>${x}</li>`).join("")}</ul></button>`;
                })
                .join("")}</div>`;
        openModal();
    };
    window.selectScenario = function (id, key) {
        const r = records.find((x) => x.id === id);
        const s = scenarioTemplates[key];
        if (!r || !s) return;
        r.selectedScenario = key;
        document.getElementById("modalTitle").textContent = `${s.title} · ${r.id}`;
        document.getElementById("modalSub").textContent =
            "Bước 2: chọn nhiệm vụ nhánh liên quan hoặc thêm nhiệm vụ nhánh mới";
        document.getElementById("modalBody").innerHTML =
            `<div class="scenario-detail-grid"><div class="detail-card"><h4>${s.title}</h4><p>${s.desc}</p><div class="scenario-route"><span>Hồ sơ chính</span><i>→</i><span>Kịch bản xử lý</span><i>→</i><span>Nhiệm vụ nhánh</span><i>→</i><span>Cập nhật tiến độ</span></div><div class="scenario-sla">${s.sla.map((x, i) => `<div><b>Mốc ${i + 1}</b><span>${x}</span></div>`).join("")}</div><div class="action-bar" style="margin-top:12px"><button class="primary" onclick="applyScenarioTasks('${id}','${key}')">Tạo các nhiệm vụ nhánh đã chọn</button><button class="ghost" onclick="openScenarioSelector('${id}')">Chọn kịch bản khác</button></div></div><div class="detail-card"><h4>Nhiệm vụ nhánh gợi ý trong kịch bản</h4><div class="scenario-task-list">${s.tasks.map((t, i) => `<label class="scenario-task"><input type="checkbox" data-scenario-task="${i}" checked/><span><b>${t[0]}</b><small>${t[1]}</small></span><span class="badge">${t[2]}</span></label>`).join("")}</div></div></div><div class="detail-card"><h4>Thêm mới nhiệm vụ nhánh ngoài kịch bản</h4><div class="scenario-custom-form"><div class="form2"><div class="field wide"><label>Tên nhiệm vụ</label><input id="scenarioCustomTitle" placeholder="Nhập tên nhiệm vụ nhánh mới" /></div><div class="field wide"><label>Nội dung</label><textarea id="scenarioCustomContent" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu..."></textarea></div><div class="field"><label>Đơn vị nhận</label><select id="scenarioCustomOwner">${units.map((u) => `<option>${u}</option>`).join("")}</select></div><div class="field"><label>Hạn hoàn thành</label><input id="scenarioCustomDue" type="date" /></div><div class="field"><label>Ưu tiên</label><select id="scenarioCustomPriority"><option>Cao</option><option selected>Trung bình</option><option>Bình thường</option></select></div></div><div class="action-bar"><button class="primary" onclick="saveCustomScenarioTask('${id}','${key}')">＋ Thêm nhiệm vụ nhánh mới</button><button class="ghost" onclick="qlnvxOpenRecordDetail('${id}')">Quay lại hồ sơ chính</button></div></div></div>${qlnvxV14SubtaskStatsHtml(r)}`;
        openModal();
    };
    window.applyScenarioTasks = function (id, key) {
        const r = records.find((x) => x.id === id);
        const s = scenarioTemplates[key];
        if (!r || !s) return;
        const checked = [
            ...document.querySelectorAll("[data-scenario-task]:checked"),
        ].map((x) => Number(x.dataset.scenarioTask));
        if (!checked.length) {
            toast("Chưa chọn nhiệm vụ nhánh nào.");
            return;
        }
        r.subtasks = r.subtasks || [];
        checked.forEach((idx) => {
            const t = s.tasks[idx];
            const dup = r.subtasks.some((x) => x.name === t[0] && x.scenario === key);
            if (!dup) {
                r.subtasks.push({
                    id: `${r.id}-N${String(r.subtasks.length + 1).padStart(2, "0")}`,
                    name: t[0],
                    content: t[1],
                    owner: t[2],
                    state: "Đang xử lý",
                    due: dueDate(idx, key === "overdue" ? "soon" : "doing"),
                    priority: s.level === "Khẩn" ? "Cao" : s.level,
                    progress: 10,
                    scenario: key,
                    created: new Date().toLocaleString("vi-VN"),
                });
            }
        });
        r.selectedScenario = key;
        r.history.unshift({
            time: new Date().toLocaleString("vi-VN"),
            text: `Áp dụng ${s.title}, tạo ${checked.length} nhiệm vụ nhánh liên quan`,
        });
        toast(`Đã tạo ${checked.length} nhiệm vụ nhánh theo kịch bản.`);
        qlnvxOpenRecordDetail(id);
    };
    window.saveCustomScenarioTask = function (id, key) {
        const r = records.find((x) => x.id === id);
        const s = scenarioTemplates[key];
        if (!r || !s) return;
        const title = document.getElementById("scenarioCustomTitle")?.value.trim();
        const content = document
            .getElementById("scenarioCustomContent")
            ?.value.trim();
        if (!title) {
            toast("Cần nhập Tên nhiệm vụ.");
            return;
        }
        const dueRaw = document.getElementById("scenarioCustomDue")?.value || "";
        const due = dueRaw ? dueRaw.split("-").reverse().join("/") : "30/06/2026";
        r.subtasks = r.subtasks || [];
        r.subtasks.push({
            id: `${r.id}-N${String(r.subtasks.length + 1).padStart(2, "0")}`,
            name: title,
            content: content || title,
            owner: document.getElementById("scenarioCustomOwner").value,
            state: "Đang xử lý",
            due,
            priority: document.getElementById("scenarioCustomPriority").value,
            progress: 5,
            scenario: key,
            created: new Date().toLocaleString("vi-VN"),
        });
        r.selectedScenario = key;
        r.history.unshift({
            time: new Date().toLocaleString("vi-VN"),
            text: `Thêm nhiệm vụ nhánh thủ công trong ${s.title}: ${title}`,
        });
        toast("Đã thêm nhiệm vụ nhánh mới trong kịch bản.");
        selectScenario(id, key);
    };

    // Khởi tạo trang hiện tại nếu chưa có
    window.__subtaskCurrentPage = window.__subtaskCurrentPage || 1;

    // Hàm hỗ trợ đổi trang
    window.changeSubtaskPage = function (rId, newPage) {
        window.__subtaskCurrentPage = newPage;
        // Gọi lại hàm render để cập nhật bảng
        const container = document.querySelector(".subtask-summary-v11");
        if (container && window.currentRecord) {
            container.outerHTML = window.qlnvxV14SubtaskStatsHtml(
                window.currentRecord,
            );
        }
    };

    window.qlnvxV14SubtaskStatsHtml = function (r) {
        const subtaskElem = document.querySelector(".subtask-summary");
        if (subtaskElem) {
            subtaskElem.style.display = "none";
        }

        // Lưu lại record hiện tại để hàm chuyển trang có thể tham chiếu
        window.currentRecord = r;

        // Lấy dữ liệu subtask (tránh bị crash nếu r.subtasks hoặc combinedData bị null/undefined)
        const subtasks = r.subtasks?.combinedData || r.subtasks || [];

        /* API trả trạng thái dạng câu ("Chưa hoàn thành quá hạn", "Chưa HT gần hạn"…).
           Bắt bằng includes("hoàn") là SAI: "CHƯA hoàn thành" cũng chứa "hoàn" nên bị đếm
           vào cột Hoàn thành. -> phân loại theo cụm phủ định trước. */
        const done = subtasks.filter(
            (s) => subtaskStatusKey(s.status) === "done",
        ).length;
        const doing = subtasks.filter(
            (s) => subtaskStatusKey(s.status) === "doing",
        ).length;
        const soon = subtasks.filter((s) =>
            ["soon", "overdue"].includes(subtaskStatusKey(s.status)),
        ).length;

        const scen = r.selectedScenario
            ? scenarioTemplates[r.selectedScenario]
            : null;

        // --- CẤU HÌNH PHÂN TRANG ---
        const pageSize = 20;
        const totalPages = Math.ceil(subtasks.length / pageSize) || 1;

        // Đảm bảo trang hiện tại nằm trong khoảng hợp lệ [1, totalPages]
        if (window.__subtaskCurrentPage > totalPages)
            window.__subtaskCurrentPage = totalPages;
        if (window.__subtaskCurrentPage < 1) window.__subtaskCurrentPage = 1;

        const currentPage = window.__subtaskCurrentPage;
        const startIndex = (currentPage - 1) * pageSize;
        const pagedSubtasks = subtasks.slice(startIndex, startIndex + pageSize);

        /* GOM NHÓM THEO KỊCH BẢN như bản chuẩn: mỗi nhóm có 1 dải tiêu đề
           ("GIAO THƯỜNG (KHÔNG QUA KỊCH BẢN)" hoặc tên kịch bản) kèm số lượng, thay cho
           cột "Kịch bản" lặp lại ở từng dòng. */
        const groups = new Map();
        pagedSubtasks.forEach((s, idx) => {
            const key = s.scenario || "";
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push({ s, actualIndex: startIndex + idx });
        });
        const rows = [...groups.entries()]
            .map(([key, items]) => {
                const label = key
                    ? (scenarioTemplates[key]?.title || key).toUpperCase()
                    : "GIAO THƯỜNG (KHÔNG QUA KỊCH BẢN)";
                const band = `<tr class="subtask-group-row"><td colspan="8" style="background:rgba(216,165,12,.10);color:#e7c55a;font-weight:800;letter-spacing:.02em;font-size:12px;vertical-align:middle;">${esc(label)} <span class="badge gold mono" style="margin-left:6px;vertical-align:middle;">${fmt(items.length)}</span></td></tr>`;
                return (
                    band +
                    items
                        .map(({ s, actualIndex }) => {
                            const stKey = subtaskStatusKey(s.status);
                            const valName = s.noiDungNhiemVu || "Việc nhánh";
                            const valContent = s.noiDungNhiemVu || "--";
                            return `<tr class="clickable" onclick="openSubTaskDetail('${r.id}',${actualIndex})">
                <td>${s.id || "NVN-" + String(actualIndex + 1).padStart(2, "0")}</td>
                <td class="subtask-name-col" title="${esc(valName)}"><div style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;word-break:break-word;">${esc(valName)}</div></td>
                <td class="subtask-content-col" title="${esc(valContent)}"><div style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;word-break:break-word;">${esc(valContent)}</div></td>
                <td>${s.units?.[0]?.unitId?.name || "--"}</td>
                <td>${s._raw?.donViPhoiHop || "--"}</td>
                <td>${s.ngayHetHan || "--"}</td>
                <td>${s.progress ?? 0}%</td>
                <td><span class="badge ${stKey === "done" ? "ok" : stKey === "overdue" ? "red" : stKey === "soon" ? "warn" : ""}">${s.status || "Đang xử lý"}</span></td>
            </tr>`;
                        })
                        .join("")
                );
            })
            .join("");

        // Thanh phân trang UI
        // Thanh phân trang UI: Thông tin bên trái - Nút bấm bên phải
        const paginationHtml =
            totalPages > 1
                ? `
        <div class="subtask-pagination" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; margin-top: 8px;">
            <div style="font-size: 13px; color: #666;">
                Hiển thị <b>${startIndex + 1}</b> - <b>${Math.min(startIndex + pageSize, subtasks.length)}</b> trên <b>${subtasks.length}</b> bản ghi
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="ghost" ${currentPage === 1 ? "disabled" : ""} onclick="changeSubtaskPage('${r.id}', ${currentPage - 1})">‹ Trước</button>
                <span style="font-size: 13px; padding: 0 8px;">Trang <b>${currentPage}</b> / ${totalPages}</span>
                <button class="ghost" ${currentPage === totalPages ? "disabled" : ""} onclick="changeSubtaskPage('${r.id}', ${currentPage + 1})">Sau ›</button>
            </div>
        </div>
    `
                : "";

        return `<section class="subtask-summary-v11">
        <div class="subtask-head-v11">
            <div>
                <h4>Thống kê nhiệm vụ nhánh liên quan ${r.metric === "docIn" || r.metric === "docOut" ? "văn bản" : "nhiệm vụ"} chính</h4>
                <div class="subtask-meta-note">Chọn kịch bản xử lý → tạo nhiệm vụ nhánh liên quan, nhóm theo đúng kịch bản → có thể thêm mới nhiệm vụ nhánh.</div>
            </div>
            <div class="action-bar">
                <button class="primary" onclick="openScenarioSelector('${r.id}')">⚡ Chọn kịch bản xử lý</button>
                <button class="ghost" onclick="qlnvxOpenSubTaskForm('${r.id}')">＋ Giao nhiệm vụ nhánh</button>
                <button class="ghost" onclick="toast('Đã xuất bảng nhiệm vụ nhánh của ${r.id}')">Xuất bảng</button>
            </div>
        </div>
        ${scen ? `<div class="scenario-history-badge"><b>Kịch bản đang áp dụng:</b> ${scen.title} · ${scen.desc}</div>` : ""}
        <div class="subtask-kpis-v11">
            <div class="mini-kpi"><b class="mono">${fmt(subtasks.length)}</b><span>Tổng nhiệm vụ nhánh</span></div>
            <div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div>
            <div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div>
            <div class="mini-kpi"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div>
        </div>
        ${subtasks.length
                ? `
            <div class="subtask-table-wrap">
                <table class="compact-table">
                    <thead>
                        <tr>
                            <th>Mã nhánh</th>
                            <th>Tên nhiệm vụ</th>
                            <th>Nội dung</th>
                            <th>Đơn vị nhận</th>
                            <th>Người/Đơn vị phối hợp</th>
                            <th>Hạn</th>
                            <th>Tiến độ</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            ${paginationHtml}
        `
                : `<div class="subtask-empty">Chưa có nhiệm vụ nhánh. Bấm “Chọn kịch bản xử lý” để tạo các việc con theo tình huống chậm tiến độ/quá hạn/thiếu dữ liệu.</div>`
            }
    </section>`;
    };
    const v14PrevRenderRecordDetail =
        window.qlnvxRenderRecordDetail || qlnvxRenderRecordDetail;

    window.qlnvxRenderRecordDetail = qlnvxRenderRecordDetail = function (
        r,
        limited,
        tab,
    ) {
        v14PrevRenderRecordDetail(r, limited, tab);
        const body = document.getElementById("modalBody");
        if (body && r) {
            body
                .querySelectorAll(".subtask-summary-v11")
                .forEach((el) => el.remove());
            body.insertAdjacentHTML("beforeend", qlnvxV14SubtaskStatsHtml(r));
        }
    };
    // const v14PrevOpenSubTaskDetail =
    //     window.openSubTaskDetail || openSubTaskDetail;
    // window.openSubTaskDetail = function (parentId, idx) {
    //     const r = records.find((x) => x.id === parentId);
    //     const s = r?.subtasks?.[idx];
    //     if (!r || !s) return;
    //     document.getElementById("modalTitle").textContent =
    //         `Chi tiết nhiệm vụ nhánh · ${s.id || idx + 1}`;
    //     document.getElementById("modalSub").textContent =
    //         `Gắn với ${r.id} · ${r.title}`;
    //     document.getElementById("modalBody").innerHTML =
    //         `<div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id || "--"}</span><b>Kịch bản</b><span>${s.scenario ? scenarioTemplates[s.scenario]?.title : "Giao thường"}</span><b>Tên nhiệm vụ</b><span>${s.name || "--"}</span><b>Nội dung</b><span>${s.content || s.name || "--"}</span><b>Đơn vị nhận</b><span>${s.owner}</span><b>Hạn xử lý</b><span>${s.due || "--"}</span><b>Mức ưu tiên</b><span>${s.priority || "Trung bình"}</span><b>Trạng thái</b><span>${s.state || "Đang xử lý"}</span></div></div><div class="detail-card"><h4>Cập nhật nhanh</h4><div class="field"><label>Trạng thái</label><select id="subState"><option ${s.state === "Đang xử lý" ? "selected" : ""}>Đang xử lý</option><option ${s.state === "Sắp đến hạn" ? "selected" : ""}>Sắp đến hạn</option><option ${s.state === "Hoàn thành" ? "selected" : ""}>Hoàn thành</option></select></div><div class="field"><label>Tiến độ</label><input id="subProgress" type="number" min="0" max="100" value="${s.progress ?? 30}" /></div><div class="action-bar"><button class="primary" onclick="saveSubTaskState('${parentId}',${idx})">Lưu cập nhật</button><button class="ghost" onclick="qlnvxOpenRecordDetail('${parentId}')">Quay lại hồ sơ chính</button><button class="ghost" onclick="openScenarioSelector('${parentId}')">Chọn kịch bản khác</button></div></div></div>${qlnvxV14SubtaskStatsHtml(r)}`;
    //     openModal();
    // };
    // cập nhật nhãn tiêu đề widget mục 2
    setTimeout(() => {
        const t = document.querySelector(
            '[data-widget="indicators"] .widget-title',
        );
        if (t) t.textContent = "Nhóm chỉ tiêu theo lĩnh vực được phép xem";
        if (currentAccount) {
            v14EnsureCategoryData();
            renderIndicators();
        }
    }, 0);
})();

(function () {
    const SCENARIO_LINH_VUC = [
        "Y tế",
        "Giáo dục",
        "HCC",
        "Tài chính",
        "Giao thông",
        "Xây dựng",
        "TNMT",
        "KHCN",
        "LĐTBXH",
        "Nội chính",
        "Tổ chức",
        "Kiểm tra",
    ];
    window.SCENARIO_LINH_VUC = SCENARIO_LINH_VUC;

    /* DANH MỤC LĨNH VỰC CHO KỊCH BẢN — LẤY THEO ĐƠN VỊ ĐANG ĐĂNG NHẬP.
       Trước đây 12 lĩnh vực nằm cứng ngay trên đây (và mỗi block lại khai báo một bản),
       nên quản trị đơn vị thêm/bớt lĩnh vực trong bảng linh_vuc của be_ioc_dash thì bộ
       lọc kịch bản + ô "Lĩnh vực áp dụng" vẫn hiện danh sách cũ.
       Nguồn: GET /rbac/me -> iocContext.primaryOrganizationId, rồi
       GET /rbac/me/linh-vuc?organizationId= (route chỉ cần phiên đăng nhập; bản
       /rbac/linh-vuc nằm sau guard quản trị nên user thường bị 403). Cùng nguồn với
       assLoadLinhVuc() đang dùng cho ô "Nhóm lĩnh vực" ở form giao nhiệm vụ.
       API lỗi/rỗng -> giữ danh sách cứng, KHÔNG để trống vì mất bộ lọc là chặn chọn kịch bản.
       Cache nằm ở window.__scenarioLinhVucNames chứ không ghi đè window.SCENARIO_LINH_VUC:
       nhiều block (tongquan, noti) cùng khai báo biến đó nên block nạp sau sẽ ghi đè lại
       bản cứng và xoá mất kết quả API. */
    if (typeof window.qlnvScenarioLinhVucList !== "function") {
        /* "&organizationId=..." để gắn/lọc kịch bản theo đơn vị; rỗng khi chưa nạp được
           /rbac/me -> BE chỉ trả phần dùng chung (5 kịch bản mặc định). */
        window.qlnvScenarioOrgQuery = function (prefix) {
            var id = window.__scenarioOrgId;
            if (!id) return "";
            return (prefix || "&") + "organizationId=" + encodeURIComponent(id);
        };
        window.qlnvScenarioLinhVucList = function () {
            var api = window.__scenarioLinhVucNames;
            if (Array.isArray(api) && api.length) return api;
            return window.SCENARIO_LINH_VUC || [];
        };
        window.qlnvLoadScenarioLinhVuc = function () {
            if (window.__scenarioLinhVucP) return window.__scenarioLinhVucP;
            var base = window.QLNV_API_BASE || window.location.origin + "/api";
            window.__scenarioLinhVucP = fetch(base + "/rbac/me", { credentials: "include" })
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (me) {
                    var orgId = me && me.iocContext && me.iocContext.primaryOrganizationId;
                    /* Giữ lại id đơn vị: kịch bản tự tạo cũng phân phạm vi theo ĐÚNG hệ id
                       này (organizations của be_ioc_dash), xem qlnvScenarioOrgQuery(). */
                    window.__scenarioOrgId = orgId != null && orgId !== "" ? String(orgId) : null;
                    return fetch(
                        base + "/rbac/me/linh-vuc" + (orgId ? "?organizationId=" + encodeURIComponent(orgId) : ""),
                        { credentials: "include" },
                    );
                })
                .then(function (r) { return r && r.ok ? r.json() : null; })
                .then(function (res) {
                    var names = ((res && res.items) || [])
                        .filter(function (i) { return i && i.isActive !== false && i.name; })
                        .map(function (i) { return String(i.name); });
                    if (names.length) window.__scenarioLinhVucNames = names;
                    return window.qlnvScenarioLinhVucList();
                })
                .catch(function (err) {
                    console.warn("[QLNV] Không tải được lĩnh vực theo đơn vị, giữ danh sách mặc định:", err);
                    return window.qlnvScenarioLinhVucList();
                });
            return window.__scenarioLinhVucP;
        };
    }
    /* KỊCH BẢN XỬ LÝ — NGUỒN DỮ LIỆU LÀ API, KHÔNG CÒN HARDCODE.
       Trước đây 5 kịch bản mặc định nằm cứng trong file này (DEFAULT_SCENARIOS_V15) và
       kịch bản tự tạo nằm trong localStorage -> mỗi máy một kiểu, 3 cấp dashboard lệch
       nhau. Giờ tất cả đọc/ghi qua /qlnv/scenarios (collection `kichban`).

       templates() vẫn ĐỒNG BỘ vì hơn 20 chỗ trong file gọi nó trong lúc dựng HTML; nó
       đọc từ cache __scenarioCache. Cache được nạp bởi scenarioLoadAll() — các hàm mở
       màn kịch bản đã được bọc ở cuối file để luôn nạp xong mới vẽ. */
    const SCENARIO_API_URL =
        (window.urlAPI || window.QLNV_API_BASE || window.location.origin + "/api") + "/qlnv/scenarios";

    window.__scenarioCache = window.__scenarioCache || {};
    window.__scenarioLoaded = false;
    let __scenarioLoadP = null;

    /* FE hiển thị task dạng mảng [tên, nội dung, đơn vị, ưu tiên, hạn, {…}] còn BE lưu
       dạng object. Hai hàm dưới là chỗ duy nhất chuyển đổi qua lại. */
    const PRIORITY_TO_NUM = { "Cao": 2, "Trung bình": 3, "Bình thường": 4 };
    const PRIORITY_TO_TEXT = { 1: "Cao", 2: "Cao", 3: "Trung bình", 4: "Bình thường", 5: "Bình thường" };
    const URGENCY_TO_API = { "Hỏa tốc": "Khẩn cấp", "Khẩn": "Gấp", "Thường": "Thường" };
    const URGENCY_TO_FE = { "Khẩn cấp": "Hỏa tốc", "Gấp": "Khẩn", "Thường": "Thường" };

    /* <input type="date"> chỉ nhận yyyy-mm-dd. API trả ngày dạng chuỗi ISO, nhưng chỗ
       khác có thể đưa vào Date -> String(Date) ra "Thu Dec 31 2026..." và ô ngày sẽ
       trống. Chuẩn hoá tại một chỗ. */
    function scenarioDateInput(v) {
        if (!v) return "";
        const d = v instanceof Date ? v : new Date(v);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().slice(0, 10);
    }

    function scenarioTaskFromApi(t) {
        const owner = t.donViChuTriName || t.donViChuTri || "";
        return [
            t.tenNhiemVu || "",
            t.noiDungNhiemVu || t.tenNhiemVu || "",
            typeof owner === "string" ? owner : "",
            PRIORITY_TO_TEXT[t.priority] || "Trung bình",
            scenarioDateInput(t.ngayHetHan),
            {
                urgency: URGENCY_TO_FE[t.doKhan] || "Thường",
                start: scenarioDateInput(t.ngayChiDao),
                coordinators: [],
            },
        ];
    }

    function scenarioTaskToApi(t) {
        const extra = t[5] || {};
        const out = {
            tenNhiemVu: t[0],
            noiDungNhiemVu: t[1] || t[0],
            priority: PRIORITY_TO_NUM[t[3]] || 3,
            doKhan: URGENCY_TO_API[extra.urgency] || "Thường",
        };
        /* Gửi tên đơn vị dạng chữ; BE tự tra OrganizationUnit, không khớp thì giữ nguyên
           chữ ở donViChuTriName để màn kịch bản vẫn hiện đúng nhãn. */
        if (t[2]) out.donViChuTri = t[2];
        if (t[4]) out.ngayHetHan = t[4];
        if (extra.start) out.ngayChiDao = extra.start;
        if (Array.isArray(extra.coordinators) && extra.coordinators.length)
            out.donViThucHien = extra.coordinators;
        return out;
    }

    function scenarioFromApi(doc) {
        return {
            title: doc.title || "",
            level: doc.level || "Trung bình",
            desc: doc.desc || "",
            sla: Array.isArray(doc.sla) ? doc.sla : [],
            fields: Array.isArray(doc.fields) ? doc.fields : [],
            tasks: (doc.tasks || []).map(scenarioTaskFromApi),
            __id: doc._id,
            __isDefault: !!doc.isDefault,
        };
    }

    /* Kịch bản nằm sau auth.isAuthenticated (khác /qlnv/v2/* là public) nên bắt buộc
       Bearer token. Dùng lại assAccessToken() của luồng giao nhiệm vụ. */
    function scenarioAuthHeaders() {
        const p =
            typeof assAccessToken === "function"
                ? assAccessToken()
                : Promise.resolve(
                    (typeof getTokenAuth === "function" && getTokenAuth()) || "",
                );
        return Promise.resolve(p).then(function (tk) {
            if (!tk) throw new Error("Thiếu token đăng nhập, đăng nhập lại rồi thử lại.");
            return {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + tk,
            };
        });
    }

    /* Gắn organizationId vào MỌI lệnh gọi /qlnv/scenarios (list, tạo, sửa, xoá):
       BE dùng nó để biết kịch bản thuộc đơn vị nào và chỉ trả về kịch bản dùng chung +
       kịch bản của chính đơn vị đang đăng nhập. Chèn ở đây thay vì từng nơi gọi để
       không sót — kể cả nhánh lọc theo lĩnh vực (?fields=). */
    function scenarioApiUrl(path) {
        var p = path || "";
        var org =
            typeof window.qlnvScenarioOrgQuery === "function"
                ? window.qlnvScenarioOrgQuery(p.indexOf("?") >= 0 ? "&" : "?")
                : "";
        return SCENARIO_API_URL + p + org;
    }
    function scenarioApiFetch(path, opts) {
        return scenarioAuthHeaders().then(function (headers) {
            return fetch(scenarioApiUrl(path),
                Object.assign({ headers: headers }, opts || {}),
            ).then(function (r) {
                return r.json().catch(function () {
                    throw new Error("KỊCH BẢN HTTP " + r.status);
                }).then(function (body) {
                    if (!r.ok || body.success === false) {
                        const msg = (body.error && body.error.message) || ("HTTP " + r.status);
                        throw new Error(msg);
                    }
                    return body;
                });
            });
        });
    }

    /* limit=100: 5 kịch bản mặc định + kịch bản tự tạo; mặc định của BE là 20. */
    function scenarioLoadAll(force) {
        if (window.__scenarioLoaded && !force) return Promise.resolve(window.__scenarioCache);
        if (__scenarioLoadP && !force) return __scenarioLoadP;
        __scenarioLoadP = scenarioApiFetch("?limit=100")
            .then(function (body) {
                const cache = window.__scenarioCache;
                Object.keys(cache).forEach(function (k) {
                    delete cache[k];
                });
                (body.data || []).forEach(function (doc) {
                    if (doc && doc.key) cache[doc.key] = scenarioFromApi(doc);
                });
                window.__scenarioLoaded = true;
                __scenarioLoadP = null;
                return cache;
            })
            .catch(function (err) {
                __scenarioLoadP = null;
                throw err;
            });
        return __scenarioLoadP;
    }

    function templates() {
        return window.__scenarioCache || {};
    }
    /* Chỉ kịch bản tự tạo (isDefault=false) — màn "Thêm mới kịch bản" liệt kê để xoá. */
    function loadCustom() {
        const out = {};
        Object.keys(templates()).forEach(function (k) {
            if (!templates()[k].__isDefault) out[k] = templates()[k];
        });
        return out;
    }
    window.getScenarioTemplatesV15 = templates;
    window.scenarioLoadAll = scenarioLoadAll;
    /* Bộ lọc "lĩnh vực áp dụng" dùng chung cho mọi lưới kịch bản (assOpenScenarioPicker +
       openScenarioSelector) vì cả hai đều render vào cùng #modalBody và chỉ 1 modal mở
       tại 1 thời điểm -> chỉ có đúng 1 .scenario-grid trong DOM. */
    /* Ẩn/hiện thẻ theo tập key được phép. keys = null nghĩa là hiện tất cả. */
    function scenarioApplyFilterKeys(grid, keys) {
        Array.from(grid.querySelectorAll(".scenario-card")).forEach(function (card) {
            var k = card.getAttribute("data-scenario-key") || "";
            card.style.display = !keys || keys.indexOf(k) !== -1 ? "" : "none";
        });
    }

    /* Lọc dự phòng bằng data-fields sẵn trên thẻ, dùng khi gọi API lỗi để nút lọc
       không chết cứng. Cùng quy ước với BE: fields rỗng = áp dụng mọi lĩnh vực. */
    function scenarioFilterLocally(grid, field) {
        Array.from(grid.querySelectorAll(".scenario-card")).forEach(function (card) {
            var raw = card.getAttribute("data-fields") || "";
            var cardFields = raw ? raw.split("|") : [];
            var show =
                field === "__all__" ||
                cardFields.length === 0 ||
                cardFields.indexOf(field) !== -1;
            card.style.display = show ? "" : "none";
        });
    }

    window.scenarioFilterByField = function (field, btnEl) {
        var grid = document.querySelector("#modalBody .scenario-grid");
        if (!grid) return;
        var toolbar = btnEl ? btnEl.parentElement : null;
        if (toolbar)
            Array.from(toolbar.querySelectorAll("button[data-field-filter]")).forEach(
                function (b) {
                    b.classList.toggle("active", b === btnEl);
                },
            );

        if (field === "__all__") {
            scenarioApplyFilterKeys(grid, null);
            return;
        }

        /* Hỏi thẳng BE thay vì tự lọc trên thẻ: danh sách kịch bản có thể dài hơn số thẻ
           đang vẽ, và quy tắc "fields rỗng = dùng chung" chỉ nên có một bản ở BE. */
        scenarioApiFetch("?limit=100&fields=" + encodeURIComponent(field))
            .then(function (body) {
                var keys = (body.data || []).map(function (d) {
                    return d.key;
                });
                scenarioApplyFilterKeys(grid, keys);
            })
            .catch(function (err) {
                console.warn("[QLNV] Lọc lĩnh vực qua API lỗi, lọc tạm tại chỗ:", err);
                scenarioFilterLocally(grid, field);
            });
    };
    function esc(s) {
        return String(s ?? "").replace(
            /[&<>"']/g,
            (m) =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                })[m],
        );
    }
    /* Bản ghi đang mở đến TỪ API nên nằm ở `currentDrawerRecords`, KHÔNG có trong mảng
       demo `records` -> trước đây bấm "Giao nhiệm vụ nhánh"/"Chọn kịch bản xử lý" là
       getRecord() trả undefined rồi return im lặng (nút như không ăn). Tìm cả 2 nguồn. */
    function getRecord(id) {
        return (
            (typeof currentDrawerRecords !== "undefined"
                ? currentDrawerRecords
                : []
            ).find((x) => x.id === id) || (records || []).find((x) => x.id === id)
        );
    }
    function getIndicator(id) {
        return (indicatorRecords || []).find((x) => x.id === id);
    }
    function indicatorKey(id) {
        return "indicator:" + id;
    }
    function indicatorSubs(id) {
        window.__indicatorScenarioSubtasks =
            window.__indicatorScenarioSubtasks || {};
        window.__indicatorScenarioSubtasks[id] =
            window.__indicatorScenarioSubtasks[id] || [];
        return window.__indicatorScenarioSubtasks[id];
    }
    function indicatorSelected(id) {
        window.__indicatorSelectedScenario =
            window.__indicatorSelectedScenario || {};
        return window.__indicatorSelectedScenario[id] || "";
    }
    function setIndicatorSelected(id, key) {
        window.__indicatorSelectedScenario =
            window.__indicatorSelectedScenario || {};
        window.__indicatorSelectedScenario[id] = key;
    }
    function indicatorStatusKeys(r) {
        const arr = [];
        if (r.status === "overdue") arr.push("overdue");
        if (["risk", "soon"].includes(r.status) || Number(r.progress || 0) < 70)
            arr.push("slow");
        arr.push("data");
        if (/cử tri|kiến nghị/i.test(r.indicator || r.title || ""))
            arr.push("citizen");
        arr.push("coordinate");
        return [...new Set(arr)];
    }
    function recordStatusKeys(r) {
        const arr = [];
        if (r.status === "overdue") arr.push("overdue");
        if (["risk", "soon"].includes(r.status) || Number(r.progress || 0) < 70)
            arr.push("slow");
        if (
            r.metric === "indicator" ||
            /dữ liệu|chỉ tiêu|bản ghi/i.test(r.title || "")
        )
            arr.push("data");
        if (/cử tri|kiến nghị/i.test(r.field || r.title || "")) arr.push("citizen");
        arr.push("coordinate");
        return [...new Set(arr)];
    }
    function templateCardHtml(ctx, id, key) {
        const s = templates()[key];
        if (!s) return "";
        return `<button class="scenario-card" data-scenario-key="${key}" data-fields="${(s.fields || []).join("|")}" onclick="${ctx === "indicator" ? "selectIndicatorScenario" : "selectScenario"}('${id}','${key}')"><div class="scenario-severity"><span class="badge ${s.level === "Khẩn" ? "red" : s.level === "Cao" ? "warn" : "ok"}">${esc(s.level)}</span><span class="badge">${(s.tasks || []).length} nhiệm vụ nhánh gợi ý</span></div><h4>${esc(s.title)}</h4><p>${esc(s.desc)}</p><ul>${(s.sla || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></button>`;
    }
    function selectScenarioHtml(ctx, id, key, recordLike, subsHtmlFn) {
        const s = templates()[key];
        if (!s) return "";
        return `<div class="scenario-detail-grid"><div class="detail-card"><h4>${esc(s.title)}</h4><p>${esc(s.desc)}</p><div class="scenario-route"><span>${ctx === "indicator" ? "Chỉ tiêu" : "Hồ sơ chính"}</span><i>→</i><span>Kịch bản xử lý</span><i>→</i><span>Nhiệm vụ nhánh</span><i>→</i><span>Cập nhật tiến độ</span></div><div class="scenario-sla">${(s.sla || []).map((x, i) => `<div><b>Mốc ${i + 1}</b><span>${esc(x)}</span></div>`).join("")}</div><div class="action-bar" style="margin-top:12px"><button class="primary" onclick="${ctx === "indicator" ? "applyIndicatorScenarioTasks" : "applyScenarioTasks"}('${id}','${key}')">Tạo các nhiệm vụ nhánh đã chọn</button><button class="ghost" onclick="${ctx === "indicator" ? "openIndicatorScenarioSelector" : "openScenarioSelector"}('${id}')">Chọn kịch bản khác</button><button class="ghost" onclick="openScenarioCreateForm('${ctx}','${id}','${key}')">＋ Thêm kịch bản mới</button></div></div><div class="detail-card"><h4>Nhiệm vụ nhánh gợi ý trong kịch bản</h4><div class="scenario-task-list">${(s.tasks || []).map((t, i) => `<label class="scenario-task"><input type="checkbox" data-scenario-task="${i}" checked/><span><b>${esc(t[0])}</b><small>${esc(t[1])}</small></span><span class="badge">${esc(t[2])}</span></label>`).join("")}</div></div></div><div class="detail-card"><h4>Thêm mới nhiệm vụ nhánh ngoài kịch bản</h4><div class="scenario-custom-form"><div class="form2"><div class="field wide"><label>Tên nhiệm vụ</label><input id="scenarioCustomTitle" placeholder="Nhập tên nhiệm vụ nhánh mới" /></div><div class="field wide"><label>Nội dung</label><textarea id="scenarioCustomContent" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu..."></textarea></div><div class="field"><label>Đơn vị nhận</label><select id="scenarioCustomOwner">${units.map((u) => `<option>${esc(u)}</option>`).join("")}</select></div><div class="field"><label>Hạn hoàn thành</label><input id="scenarioCustomDue" type="date" /></div><div class="field"><label>Ưu tiên</label><select id="scenarioCustomPriority"><option>Cao</option><option selected>Trung bình</option><option>Bình thường</option></select></div></div><div class="action-bar"><button class="primary" onclick="${ctx === "indicator" ? "saveIndicatorCustomScenarioTask" : "saveCustomScenarioTask"}('${id}','${key}')">＋ Thêm nhiệm vụ nhánh mới</button><button class="ghost" onclick="${ctx === "indicator" ? "openIndicatorDetail" : "qlnvxOpenRecordDetail"}('${id}')">Quay lại chi tiết</button></div></div></div>${subsHtmlFn(recordLike)}`;
    }
    /* select multiple size="4" trước đây khiến người dùng tưởng chỉ chọn được 1 lĩnh vực
       (không rõ phải giữ Ctrl/Cmd) và không tìm kiếm được khi danh sách dài. Thay bằng
       dropdown tự viết: nhấn mở mới hiện danh sách, có ô tìm kiếm, chọn nhiều qua checkbox. */
    function msSearchKey(v) {
        return String(v || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d");
    }
    function msTagsHtml(fieldId) {
        const st = window.__msState[fieldId];
        if (!st.selected.length)
            return `<span class="ms-placeholder">Mọi lĩnh vực (mặc định)</span>`;
        return st.selected
            .map(
                (v) =>
                    `<span class="ms-tag">${esc(v)}<i onclick="msRemoveTag(event,'${fieldId}','${esc(v).replace(/'/g, "\\'")}')">×</i></span>`,
            )
            .join("");
    }
    function msOptionsHtml(fieldId, filterText) {
        const st = window.__msState[fieldId];
        const key = msSearchKey(filterText);
        const opts = st.options.filter((o) => !key || msSearchKey(o).indexOf(key) !== -1);
        if (!opts.length)
            return `<div class="ms-empty">Không tìm thấy lĩnh vực phù hợp</div>`;
        return opts
            .map((o) => {
                const checked = st.selected.indexOf(o) !== -1;
                return `<label class="ms-option" onclick="event.stopPropagation()"><input type="checkbox" ${checked ? "checked" : ""} onchange="msToggleOption('${fieldId}','${esc(o).replace(/'/g, "\\'")}')" /><span>${esc(o)}</span></label>`;
            })
            .join("");
    }
    function msFieldHtml(fieldId, options, selected) {
        window.__msState = window.__msState || {};
        window.__msState[fieldId] = { options: options.slice(), selected: (selected || []).slice() };
        if (!window.__msOutsideBound) {
            window.__msOutsideBound = true;
            document.addEventListener("click", function (e) {
                document.querySelectorAll(".ms-field.open").forEach(function (el) {
                    if (!el.contains(e.target)) el.classList.remove("open");
                });
            });
        }
        return (
            `<div class="ms-field" id="${fieldId}_wrap">` +
            `<div class="ms-control" onclick="msToggle('${fieldId}')">` +
            `<div class="ms-tags" id="${fieldId}_tags">${msTagsHtml(fieldId)}</div>` +
            `<span class="ms-chevron">▾</span>` +
            `</div>` +
            `<div class="ms-panel"><div class="ms-search"><input type="text" placeholder="Tìm lĩnh vực..." oninput="msFilter('${fieldId}', this.value)" onclick="event.stopPropagation()" /></div>` +
            `<div class="ms-options" id="${fieldId}_options">${msOptionsHtml(fieldId, "")}</div></div>` +
            `</div>`
        );
    }
    window.msToggle = function (fieldId, forceOpen) {
        const wrap = document.getElementById(fieldId + "_wrap");
        if (!wrap) return;
        const willOpen = typeof forceOpen === "boolean" ? forceOpen : !wrap.classList.contains("open");
        document.querySelectorAll(".ms-field.open").forEach(function (el) {
            if (el !== wrap) el.classList.remove("open");
        });
        wrap.classList.toggle("open", willOpen);
        if (willOpen) {
            const input = wrap.querySelector(".ms-search input");
            if (input) {
                input.value = "";
                setTimeout(() => input.focus(), 0);
            }
            const optsEl = document.getElementById(fieldId + "_options");
            if (optsEl) optsEl.innerHTML = msOptionsHtml(fieldId, "");
        }
    };
    window.msFilter = function (fieldId, text) {
        const optsEl = document.getElementById(fieldId + "_options");
        if (optsEl) optsEl.innerHTML = msOptionsHtml(fieldId, text);
    };
    window.msToggleOption = function (fieldId, value) {
        const st = window.__msState[fieldId];
        if (!st) return;
        const idx = st.selected.indexOf(value);
        if (idx === -1) st.selected.push(value);
        else st.selected.splice(idx, 1);
        const tagsEl = document.getElementById(fieldId + "_tags");
        if (tagsEl) tagsEl.innerHTML = msTagsHtml(fieldId);
        const searchInput = document.querySelector("#" + fieldId + "_wrap .ms-search input");
        const optsEl = document.getElementById(fieldId + "_options");
        if (optsEl) optsEl.innerHTML = msOptionsHtml(fieldId, searchInput ? searchInput.value : "");
    };
    window.msRemoveTag = function (evt, fieldId, value) {
        if (evt) evt.stopPropagation();
        const st = window.__msState[fieldId];
        if (!st) return;
        st.selected = st.selected.filter((v) => v !== value);
        const tagsEl = document.getElementById(fieldId + "_tags");
        if (tagsEl) tagsEl.innerHTML = msTagsHtml(fieldId);
        const searchInput = document.querySelector("#" + fieldId + "_wrap .ms-search input");
        const optsEl = document.getElementById(fieldId + "_options");
        if (optsEl) optsEl.innerHTML = msOptionsHtml(fieldId, searchInput ? searchInput.value : "");
    };
    window.msGetValues = function (fieldId) {
        const st = window.__msState && window.__msState[fieldId];
        return st ? st.selected.slice() : [];
    };
    window.__newScenarioTasksDraft = [];
    window.renderNewScenarioTasksList = function () {
        const box = document.getElementById("newScenarioTasksList");
        if (!box) return;
        const list = window.__newScenarioTasksDraft || [];
        if (!list.length) {
            box.innerHTML =
                '<div class="muted">Chưa có nhiệm vụ nhánh nào — bấm "＋ Thêm nhiệm vụ nhánh" để khai báo.</div>';
            return;
        }
        box.innerHTML = list
            .map((t, i) => {
                const extra = t[5] || {};
                const coord = (extra.coordinators || []).length
                    ? " · phối hợp " + esc(extra.coordinators.join(", "))
                    : "";
                const urgency = extra.urgency ? " · " + esc(extra.urgency) : "";
                const start = extra.start ? " · từ " + esc(extra.start) : "";
                const due = t[4] ? " · hạn " + esc(t[4]) : "";
                return `<div class="scenario-template-row"><div><b>${esc(t[0])}</b><small>${esc(t[2])} · ${esc(t[3] || "Trung bình")}${urgency}${coord}${start}${due}</small></div><button type="button" class="ghost danger-btn" onclick="removeNewScenarioTaskRow(${i})">Xóa</button></div>`;
            })
            .join("");
    };
    window.filterNsCoordOptions = function () {
        const q = (document.getElementById("nsCoordSearch")?.value || "")
            .trim()
            .toLowerCase();
        document.querySelectorAll("#nsCoordBox .ns-opt").forEach((el) => {
            const name = (el.getAttribute("data-name") || "").toLowerCase();
            el.style.display = !q || name.indexOf(q) !== -1 ? "flex" : "none";
        });
    };
    window.getNsCoordSelected = function () {
        return Array.from(document.querySelectorAll(".nsCoord:checked")).map(
            (c) => c.value,
        );
    };
    window.updateNsCoordLabel = function () {
        const el = document.getElementById("nsCoordTriggerText");
        if (!el) return;
        const picked = window.getNsCoordSelected();
        el.textContent = picked.length
            ? picked.join(", ")
            : "Chọn đơn vị phối hợp";
        el.style.color = picked.length ? "#d0e8f8" : "#8ab0c8";
    };
    window.openNewScenarioTaskForm = function () {
        const form = document.getElementById("newScenarioTaskForm");
        if (!form) return;
        document.getElementById("nsTaskName").value = "";
        document.getElementById("nsTaskContent").value = "";
        document.getElementById("nsTaskPriority").value = "Trung bình";
        document.getElementById("nsTaskUrgency").value = "Thường";
        document.getElementById("nsTaskStart").value = "";
        document.getElementById("nsTaskDue").value = "";
        document.querySelectorAll(".nsCoord").forEach((c) => (c.checked = false));
        const search = document.getElementById("nsCoordSearch");
        if (search) search.value = "";
        window.filterNsCoordOptions();
        window.updateNsCoordLabel();
        document.getElementById("nsCoordDropdown")?.classList.remove("open");
        form.classList.remove("hidden");
        form.style.display = "block";
        document.getElementById("nsTaskName").focus();
    };
    window.closeNewScenarioTaskForm = function () {
        const form = document.getElementById("newScenarioTaskForm");
        if (form) {
            form.classList.add("hidden");
            form.style.display = "none";
        }
        document.getElementById("nsCoordDropdown")?.classList.remove("open");
    };
    window.addNewScenarioTaskRow = function () {
        const name = (document.getElementById("nsTaskName")?.value || "").trim();
        if (!name) {
            toast("Cần nhập tên nhiệm vụ nhánh.");
            return;
        }
        const content =
            (document.getElementById("nsTaskContent")?.value || "").trim() || name;
        const owner =
            document.getElementById("nsTaskOwner")?.value || "Đơn vị chuyên môn";
        const priority =
            document.getElementById("nsTaskPriority")?.value || "Trung bình";
        const urgency = document.getElementById("nsTaskUrgency")?.value || "Thường";
        const start = document.getElementById("nsTaskStart")?.value || "";
        const due = document.getElementById("nsTaskDue")?.value || "";
        if (start && due && due < start) {
            toast("Hạn hoàn thành phải sau ngày bắt đầu.");
            return;
        }
        window.__newScenarioTasksDraft = window.__newScenarioTasksDraft || [];
        window.__newScenarioTasksDraft.push([
            name,
            content,
            owner,
            priority,
            due,
            { urgency, start, coordinators: window.getNsCoordSelected() },
        ]);
        window.closeNewScenarioTaskForm();
        window.renderNewScenarioTasksList();
        toast("Đã thêm nhiệm vụ nhánh vào kịch bản.");
    };
    window.removeNewScenarioTaskRow = function (i) {
        const list = window.__newScenarioTasksDraft || [];
        list.splice(i, 1);
        window.renderNewScenarioTasksList();
    };
    window.openScenarioCreateForm = function (ctx, id, returnKey) {
        /* ctx "assign" = mở từ form GIAO NHIỆM VỤ; ở đó chưa có hồ sơ nên không có id để
           quay về openScenarioSelector(id) — phải quay lại chính màn chọn kịch bản của form. */
        const backFn =
            ctx === "assign"
                ? "assOpenScenarioPicker"
                : ctx === "indicator"
                    ? "openIndicatorScenarioSelector"
                    : "openScenarioSelector";
        const backArg = ctx === "assign" ? "" : `'${id}'`;
        window.__newScenarioTasksDraft = [];
        document.getElementById("modalTitle").textContent =
            "Thêm mới kịch bản xử lý";
        document.getElementById("modalSub").textContent =
            "Kịch bản mới sẽ dùng được cho cả chỉ tiêu và hồ sơ/nhiệm vụ trong phiên trình duyệt";
        document.getElementById("modalBody").innerHTML =
            `<div class="scenario-create-help">Nhập kịch bản theo cấu trúc: tên kịch bản, mức độ, mô tả, các mốc SLA và danh sách nhiệm vụ gợi ý. Sau khi lưu, kịch bản mới xuất hiện ngay trong màn chọn kịch bản.</div><div class="form2"><div class="field"><label>Mã kịch bản</label><input id="newScenarioKey" value="custom_${Date.now().toString().slice(-5)}" /></div><div class="field"><label>Mức độ</label><select id="newScenarioLevel"><option>Cao</option><option>Khẩn</option><option>Trung bình</option><option>Bình thường</option></select></div><div class="field wide"><label>Tên kịch bản</label><input id="newScenarioTitle" placeholder="Ví dụ: Kịch bản xử lý dữ liệu sai lệch giữa các nguồn" /></div><div class="field wide"><label>Mô tả kịch bản</label><textarea id="newScenarioDesc" rows="3" placeholder="Mô tả khi nào áp dụng và mục tiêu xử lý..."></textarea></div><div class="field wide"><label>Lĩnh vực áp dụng (để trống = áp dụng mọi lĩnh vực)</label>${msFieldHtml("newScenarioFields", window.qlnvScenarioLinhVucList(), [])}</div><div class="field wide"><label>SLA/Mốc xử lý, mỗi dòng 1 mốc</label><textarea id="newScenarioSla" rows="3">30 phút tiếp nhận\nTrong ngày có phương án\n24h cập nhật kết quả</textarea></div><div class="field wide"><label>Nhiệm vụ nhánh gợi ý (tự động tạo khi áp dụng kịch bản)</label><div id="newScenarioTasksList" style="display:grid;gap:8px;margin-bottom:8px"></div><button type="button" class="ghost" onclick="openNewScenarioTaskForm()">＋ Thêm nhiệm vụ nhánh</button><div id="newScenarioTaskForm" class="detail-card hidden" style="display:none;margin-top:8px"><div class="card-head"><h4>Thông tin nhiệm vụ nhánh</h4></div><div class="form2 compact"><div class="field wide"><label>Tên nhiệm vụ nhánh</label><input id="nsTaskName" placeholder="Nhập tên nhiệm vụ nhánh" /></div><div class="field"><label>Người giao</label><input value="Theo tài khoản khi áp dụng" disabled /></div><div class="field"><label>Mã nhiệm vụ nhánh</label><input value="Tự sinh khi áp dụng" disabled /></div><div class="field"><label>Đơn vị chủ trì (nhận việc)</label><select id="nsTaskOwner">${units.map((u) => `<option>${esc(u)}</option>`).join("")}</select></div><div class="field wide"><label>Đơn vị/người phối hợp</label><div class="ms-wrap" style="position:relative"><div id="nsCoordTrigger" onclick="assToggleDropdown('nsCoordDropdown')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px"><span id="nsCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span style="position:absolute;top:9px;right:12px;color:#49bcff">⌄</span></div><div id="nsCoordDropdown" class="ms-dropdown" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)"><input type="text" id="nsCoordSearch" placeholder="Tìm đơn vị..." oninput="filterNsCoordOptions()" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" /><div id="nsCoordBox" style="display:flex;flex-direction:column;gap:2px;max-height:220px;overflow-y:auto">${units.map((u) => `<label class="ns-opt" data-name="${esc(u)}" style="display:flex;gap:8px;align-items:center;justify-content:flex-start;padding:5px 6px;cursor:pointer;text-transform:none;font-size:13px;color:#d0e8f8"><input type="checkbox" class="nsCoord" value="${esc(u)}" onchange="updateNsCoordLabel()" style="width:auto;flex:0 0 auto;margin:0" /><span style="flex:1;text-align:left">${esc(u)}</span></label>`).join("")}</div></div></div></div><div class="field"><label>Mức độ quan trọng</label><select id="nsTaskPriority"><option>Cao</option><option selected>Trung bình</option><option>Bình thường</option></select></div><div class="field"><label>Độ khẩn</label><select id="nsTaskUrgency"><option>Hỏa tốc</option><option>Khẩn</option><option selected>Thường</option></select></div><div class="field"><label>Ngày bắt đầu</label><input id="nsTaskStart" type="date" /></div><div class="field"><label>Hạn hoàn thành</label><input id="nsTaskDue" type="date" /></div><div class="field wide"><label>Nội dung/yêu cầu</label><textarea id="nsTaskContent" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu..."></textarea></div></div><div class="action-bar"><button type="button" class="primary" onclick="addNewScenarioTaskRow()">Thêm vào danh sách</button><button type="button" class="ghost" onclick="closeNewScenarioTaskForm()">Hủy</button></div></div></div></div><div class="action-bar"><button class="primary" onclick="saveNewScenarioTemplate('${ctx}','${id}')">Lưu kịch bản mới</button><button class="ghost" onclick="${backFn}(${backArg})">Quay lại chọn kịch bản</button></div><div class="detail-card"><h4>Các kịch bản tự tạo hiện có</h4><div class="scenario-template-list">${Object.entries(loadCustom())
                .map(
                    ([k, s]) =>
                        `<div class="scenario-template-row"><div><b>${esc(s.title)}</b><small>${esc(s.desc || "")} · ${esc(s.level || "")}</small></div><button class="ghost danger-btn" onclick="deleteCustomScenario('${k}','${ctx}','${id}')">Xóa</button></div>`,
                )
                .join("") || '<div class="muted">Chưa có kịch bản tự tạo.</div>'
            }</div></div>`;
        window.renderNewScenarioTasksList();
        openModal();
    };
    window.saveNewScenarioTemplate = function (ctx, id) {
        const keyRaw = (document.getElementById("newScenarioKey")?.value || "")
            .trim()
            .replace(/\s+/g, "_");
        const key = keyRaw || `custom_${Date.now()}`;
        const title = (
            document.getElementById("newScenarioTitle")?.value || ""
        ).trim();
        if (!title) {
            toast("Cần nhập tên kịch bản.");
            return;
        }
        const level =
            document.getElementById("newScenarioLevel")?.value || "Trung bình";
        const desc =
            (document.getElementById("newScenarioDesc")?.value || "").trim() ||
            "Kịch bản tự tạo bởi người dùng.";
        const sla = (document.getElementById("newScenarioSla")?.value || "")
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean);
        const tasks = (window.__newScenarioTasksDraft || [])
            .filter((x) => x && x[0])
            .map((x) => [
                x[0],
                x[1] || x[0],
                x[2] || "Đơn vị chuyên môn",
                x[3] || "",
                x[4] || "",
                x[5] || {},
            ]);
        const fields = window.msGetValues("newScenarioFields");
        const finalTasks = tasks.length ? tasks : [[title, desc, "Đơn vị chuyên môn"]];
        const payload = {
            key,
            title,
            level,
            desc,
            sla: sla.length ? sla : ["Trong ngày tiếp nhận", "24h cập nhật kết quả"],
            fields,
            tasks: finalTasks.map(scenarioTaskToApi),
        };
        scenarioApiFetch("", { method: "POST", body: JSON.stringify(payload) })
            .then(function () {
                return scenarioLoadAll(true);
            })
            .then(function () {
                toast("Đã thêm kịch bản mới.");
                if (ctx === "assign") assOpenScenarioPicker();
                else if (ctx === "indicator") openIndicatorScenarioSelector(id);
                else openScenarioSelector(id);
            })
            .catch(function (err) {
                toast("Không lưu được kịch bản: " + err.message);
            });
    };
    window.deleteCustomScenario = function (key, ctx, id) {
        const s = templates()[key];
        if (!s || !s.__id) {
            toast("Không tìm thấy kịch bản để xóa.");
            return;
        }
        if (s.__isDefault) {
            toast("Không thể xóa kịch bản mặc định.");
            return;
        }
        scenarioApiFetch("/" + s.__id, { method: "DELETE" })
            .then(function () {
                return scenarioLoadAll(true);
            })
            .then(function () {
                toast("Đã xóa kịch bản tự tạo.");
                openScenarioCreateForm(ctx, id);
            })
            .catch(function (err) {
                toast("Không xóa được kịch bản: " + err.message);
            });
    };
    function addTaskToRecord(r, t, key, idx) {
        r.subtasks = r.subtasks || [];
        const dup = r.subtasks.some((x) => x.name === t[0] && x.scenario === key);
        if (!dup)
            r.subtasks.push({
                id: `${r.id}-N${String(r.subtasks.length + 1).padStart(2, "0")}`,
                name: t[0],
                content: t[1],
                owner: t[2],
                state: "Đang xử lý",
                due: dueDate(idx, key === "overdue" ? "soon" : "doing"),
                priority:
                    templates()[key]?.level === "Khẩn"
                        ? "Cao"
                        : templates()[key]?.level || "Trung bình",
                progress: 10,
                scenario: key,
                created: new Date().toLocaleString("vi-VN"),
            });
    }
    function addTaskToIndicator(ind, t, key, idx) {
        const subs = indicatorSubs(ind.id);
        const dup = subs.some((x) => x.name === t[0] && x.scenario === key);
        if (!dup)
            subs.push({
                id: `${ind.id}-N${String(subs.length + 1).padStart(2, "0")}`,
                name: t[0],
                content: t[1],
                owner: t[2],
                state: "Đang xử lý",
                due: dueDate(idx, key === "overdue" ? "soon" : "doing"),
                priority:
                    templates()[key]?.level === "Khẩn"
                        ? "Cao"
                        : templates()[key]?.level || "Trung bình",
                progress: 10,
                scenario: key,
                created: new Date().toLocaleString("vi-VN"),
            });
    }
    window.openScenarioSelector = function (id) {
        const r = getRecord(id);
        if (!r) return;
        const keys = recordStatusKeys(r).filter((k) => templates()[k]);
        const st = statusMeta(r.status);
        document.getElementById("modalTitle").textContent =
            "Chọn kịch bản xử lý trước khi giao nhiệm vụ nhánh";
        document.getElementById("modalSub").textContent = `${r.id} · ${r.title}`;
        document.getElementById("modalBody").innerHTML =
            `<div class="scenario-history-badge"><b>Trạng thái hồ sơ chính:</b> <span style="color:${st.color}">${st.label}</span> · Tiến độ ${r.progress}% · Hạn ${r.due}. Chọn 01 kịch bản để hệ thống đề xuất nhiệm vụ nhánh phù hợp.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('record','${id}')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="qlnvxOpenRecordDetail('${id}')">Quay lại hồ sơ chính</button></div><div class="scenario-grid">${keys.map((k) => templateCardHtml("record", id, k)).join("")}</div>`;
        openModal();
    };
    window.selectScenario = function (id, key) {
        const r = getRecord(id);
        if (!r || !templates()[key]) return;
        r.selectedScenario = key;
        document.getElementById("modalTitle").textContent =
            `${templates()[key].title} · ${r.id}`;
        document.getElementById("modalSub").textContent =
            "Bước 2: chọn nhiệm vụ nhánh liên quan hoặc thêm nhiệm vụ nhánh mới";
        document.getElementById("modalBody").innerHTML = selectScenarioHtml(
            "record",
            id,
            key,
            r,
            window.qlnvxV14SubtaskStatsHtml || (() => ""),
        );
        openModal();
    };
    window.applyScenarioTasks = function (id, key) {
        const r = getRecord(id);
        const s = templates()[key];
        if (!r || !s) return;
        const checked = [
            ...document.querySelectorAll("[data-scenario-task]:checked"),
        ].map((x) => Number(x.dataset.scenarioTask));
        if (!checked.length) {
            toast("Chưa chọn nhiệm vụ nhánh nào.");
            return;
        }
        checked.forEach((idx) => addTaskToRecord(r, s.tasks[idx], key, idx));
        r.selectedScenario = key;
        r.history = r.history || [];
        r.history.unshift({
            time: new Date().toLocaleString("vi-VN"),
            text: `Áp dụng ${s.title}, tạo ${checked.length} nhiệm vụ nhánh liên quan`,
        });
        toast(`Đã tạo ${checked.length} nhiệm vụ nhánh theo kịch bản.`);
        qlnvxOpenRecordDetail(id);
    };
    window.saveCustomScenarioTask = function (id, key) {
        const r = getRecord(id);
        const s = templates()[key];
        if (!r || !s) return;
        const title = document.getElementById("scenarioCustomTitle")?.value.trim();
        if (!title) {
            toast("Cần nhập Tên nhiệm vụ.");
            return;
        }
        const content =
            document.getElementById("scenarioCustomContent")?.value.trim() || title;
        const dueRaw = document.getElementById("scenarioCustomDue")?.value || "";
        const due = dueRaw ? dueRaw.split("-").reverse().join("/") : "30/06/2026";
        r.subtasks = r.subtasks || [];
        r.subtasks.push({
            id: `${r.id}-N${String(r.subtasks.length + 1).padStart(2, "0")}`,
            name: title,
            content,
            owner: document.getElementById("scenarioCustomOwner").value,
            state: "Đang xử lý",
            due,
            priority: document.getElementById("scenarioCustomPriority").value,
            progress: 5,
            scenario: key,
            created: new Date().toLocaleString("vi-VN"),
        });
        r.selectedScenario = key;
        r.history = r.history || [];
        r.history.unshift({
            time: new Date().toLocaleString("vi-VN"),
            text: `Thêm nhiệm vụ nhánh thủ công trong ${s.title}: ${title}`,
        });
        toast("Đã thêm nhiệm vụ nhánh mới trong kịch bản.");
        selectScenario(id, key);
    };
    function indicatorScenarioSummary(ind) {
        const subtasks = indicatorSubs(ind.id);
        const done = subtasks.filter((s) =>
            (s.state || "").toLowerCase().includes("hoàn"),
        ).length;
        const doing = subtasks.filter((s) =>
            (s.state || "").toLowerCase().includes("đang"),
        ).length;
        const soon = subtasks.filter((s) =>
            (s.state || "").toLowerCase().includes("sắp"),
        ).length;
        const scen = indicatorSelected(ind.id)
            ? templates()[indicatorSelected(ind.id)]
            : null;
        const rows = subtasks
            .map(
                (s, i) =>
                    `<tr class="clickable" onclick="openIndicatorSubTaskDetail('${ind.id}',${i})"><td>${esc(s.id || "CTN-" + String(i + 1).padStart(2, "0"))}</td><td class="subtask-scenario-col">${esc(s.scenario ? templates()[s.scenario]?.title || s.scenario : "Giao thường")}</td><td class="subtask-name-col">${esc(s.name || "Việc nhánh")}</td><td class="subtask-content-col">${esc(s.content || s.name || "--")}</td><td>${esc(s.owner || "--")}</td><td>${esc(s.due || "--")}</td><td>${Number(s.progress ?? 35)}%</td><td><span class="badge ${s.state && s.state.includes("Hoàn") ? "ok" : s.state && s.state.includes("Sắp") ? "warn" : ""}">${esc(s.state || "Đang xử lý")}</span></td></tr>`,
            )
            .join("");
        return `<section class="indicator-scenario-panel"><div class="indicator-scenario-head"><div><h4>Kịch bản xử lý & nhiệm vụ nhánh từ chỉ tiêu</h4><p>Luồng mới áp dụng cho cả modal cấp 2 chỉ tiêu: chọn kịch bản → tạo nhiệm vụ nhánh liên quan → có thể thêm mới kịch bản hoặc nhiệm vụ nhánh.</p></div><div class="scenario-actions"><button class="primary" onclick="openIndicatorScenarioSelector('${ind.id}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openScenarioCreateForm('indicator','${ind.id}')">＋ Thêm kịch bản</button></div></div>${scen ? `<div class="scenario-applied"><b>Kịch bản đang áp dụng:</b> ${esc(scen.title)} · ${esc(scen.desc)}</div>` : ""}<div class="scenario-mini-grid"><div class="scenario-mini-card"><b class="mono">${fmt(subs.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="scenario-mini-card"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="scenario-mini-card"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="scenario-mini-card"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div>${subs.length ? `<div class="scenario-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Kịch bản</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="subtask-empty">Chưa có nhiệm vụ nhánh từ chỉ tiêu này. Bấm “Chọn kịch bản xử lý” để tạo các việc con theo tình huống quá hạn/chậm tiến độ/thiếu dữ liệu.</div>`}</section>`;
    }
    const prevOpenIndicatorDetail =
        window.openIndicatorDetail || openIndicatorDetail;
    window.openIndicatorDetail = function (id) {
        prevOpenIndicatorDetail(id);
        const ind = getIndicator(id);
        const body = document.getElementById("modalBody");
        if (ind && body) {
            body
                .querySelectorAll(".indicator-scenario-panel")
                .forEach((el) => el.remove());
            body.insertAdjacentHTML("beforeend", indicatorScenarioSummary(ind));
            const firstBtn = [...body.querySelectorAll("button")].find((b) =>
                /Giao nhiệm vụ từ chỉ tiêu/.test(b.textContent || ""),
            );
            if (firstBtn)
                firstBtn.setAttribute(
                    "onclick",
                    `openIndicatorScenarioSelector('${id}')`,
                );
        }
    };
    window.openIndicatorScenarioSelector = function (id) {
        const ind = getIndicator(id);
        if (!ind) return;
        const keys = indicatorStatusKeys(ind).filter((k) => templates()[k]);
        const st = statusMeta(ind.status);
        document.getElementById("modalTitle").textContent =
            "Chọn kịch bản xử lý từ chỉ tiêu";
        document.getElementById("modalSub").textContent =
            `${ind.id} · ${ind.indicator}`;
        document.getElementById("modalBody").innerHTML =
            `<div class="scenario-history-badge"><b>Trạng thái chỉ tiêu:</b> <span style="color:${st.color}">${st.label}</span> · Tiến độ ${ind.progress}% · Nguồn ${esc(ind.source)} · Tần suất ${esc(ind.freq)}. Chọn kịch bản để tạo nhiệm vụ nhánh.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('indicator','${id}')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="openIndicatorDetail('${id}')">Quay lại chi tiết chỉ tiêu</button></div><div class="scenario-grid">${keys.map((k) => templateCardHtml("indicator", id, k)).join("")}</div>`;
        openModal();
    };
    window.selectIndicatorScenario = function (id, key) {
        const ind = getIndicator(id);
        if (!ind || !templates()[key]) return;
        setIndicatorSelected(id, key);
        document.getElementById("modalTitle").textContent =
            `${templates()[key].title} · ${ind.id}`;
        document.getElementById("modalSub").textContent =
            "Bước 2: chọn nhiệm vụ nhánh liên quan hoặc thêm nhiệm vụ nhánh mới từ chỉ tiêu";
        document.getElementById("modalBody").innerHTML = selectScenarioHtml(
            "indicator",
            id,
            key,
            ind,
            indicatorScenarioSummary,
        );
        openModal();
    };
    window.applyIndicatorScenarioTasks = function (id, key) {
        const ind = getIndicator(id);
        const s = templates()[key];
        if (!ind || !s) return;
        const checked = [
            ...document.querySelectorAll("[data-scenario-task]:checked"),
        ].map((x) => Number(x.dataset.scenarioTask));
        if (!checked.length) {
            toast("Chưa chọn nhiệm vụ nhánh nào.");
            return;
        }
        checked.forEach((idx) => addTaskToIndicator(ind, s.tasks[idx], key, idx));
        setIndicatorSelected(id, key);
        toast(`Đã tạo ${checked.length} nhiệm vụ nhánh từ chỉ tiêu theo kịch bản.`);
        openIndicatorDetail(id);
    };
    window.saveIndicatorCustomScenarioTask = function (id, key) {
        const ind = getIndicator(id);
        const s = templates()[key];
        if (!ind || !s) return;
        const title = document.getElementById("scenarioCustomTitle")?.value.trim();
        if (!title) {
            toast("Cần nhập Tên nhiệm vụ.");
            return;
        }
        const content =
            document.getElementById("scenarioCustomContent")?.value.trim() || title;
        const dueRaw = document.getElementById("scenarioCustomDue")?.value || "";
        const due = dueRaw ? dueRaw.split("-").reverse().join("/") : "30/06/2026";
        const subs = indicatorSubs(id);
        subs.push({
            id: `${id}-N${String(subs.length + 1).padStart(2, "0")}`,
            name: title,
            content,
            owner: document.getElementById("scenarioCustomOwner").value,
            state: "Đang xử lý",
            due,
            priority: document.getElementById("scenarioCustomPriority").value,
            progress: 5,
            scenario: key,
            created: new Date().toLocaleString("vi-VN"),
        });
        setIndicatorSelected(id, key);
        toast("Đã thêm nhiệm vụ nhánh mới từ chỉ tiêu.");
        selectIndicatorScenario(id, key);
    };
    window.openIndicatorSubTaskDetail = function (indId, idx) {
        const ind = getIndicator(indId);
        const s = indicatorSubs(indId)[idx];
        if (!ind || !s) return;
        document.getElementById("modalTitle").textContent =
            `Chi tiết nhiệm vụ nhánh từ chỉ tiêu · ${esc(s.id)}`;
        document.getElementById("modalSub").textContent =
            `Gắn với ${ind.id} · ${ind.indicator}`;
        document.getElementById("modalBody").innerHTML =
            `<div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${esc(s.id)}</span><b>Kịch bản</b><span>${esc(s.scenario ? templates()[s.scenario]?.title : "Giao thường")}</span><b>Tên nhiệm vụ</b><span>${esc(s.name)}</span><b>Nội dung</b><span>${esc(s.content)}</span><b>Đơn vị nhận</b><span>${esc(s.owner)}</span><b>Hạn xử lý</b><span>${esc(s.due)}</span><b>Mức ưu tiên</b><span>${esc(s.priority)}</span><b>Trạng thái</b><span>${esc(s.state)}</span></div></div><div class="detail-card"><h4>Cập nhật nhanh</h4><div class="field"><label>Trạng thái</label><select id="indSubState"><option ${s.state === "Đang xử lý" ? "selected" : ""}>Đang xử lý</option><option ${s.state === "Sắp đến hạn" ? "selected" : ""}>Sắp đến hạn</option><option ${s.state === "Hoàn thành" ? "selected" : ""}>Hoàn thành</option></select></div><div class="field"><label>Tiến độ</label><input id="indSubProgress" type="number" min="0" max="100" value="${Number(s.progress ?? 30)}" /></div><div class="action-bar"><button class="primary" onclick="saveIndicatorSubTaskState('${indId}',${idx})">Lưu cập nhật</button><button class="ghost" onclick="openIndicatorDetail('${indId}')">Quay lại chỉ tiêu</button><button class="ghost" onclick="openIndicatorScenarioSelector('${indId}')">Chọn kịch bản khác</button></div></div></div>${indicatorScenarioSummary(ind)}`;
        openModal();
    };
    window.saveIndicatorSubTaskState = function (indId, idx) {
        const s = indicatorSubs(indId)[idx];
        if (!s) return;
        s.state = document.getElementById("indSubState").value;
        s.progress = Number(
            document.getElementById("indSubProgress").value || s.progress || 0,
        );
        toast("Đã cập nhật nhiệm vụ nhánh từ chỉ tiêu.");
        openIndicatorDetail(indId);
    };
})();

(function () {
    function escV16(s) {
        return String(s ?? "").replace(
            /[&<>\"']/g,
            (m) =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '\"': "&quot;",
                    "'": "&#39;",
                })[m],
        );
    }
    function indicatorRowHtmlV16(r) {
        const st = statusMeta(r.status);
        const progress = Number(r.progress || 0);
        return `<button class="indicator-row-v16" onclick="openIndicatorDetail('${escV16(r.id)}')">
    <div class="indicator-id-v16"><b>${escV16(r.id)}</b><small>Chỉ tiêu</small></div>
    <div class="indicator-title-v16"><div class="title">${escV16(r.title)}</div><small>${escV16(axisMeta[r.role]?.icon || "")} ${escV16(axisMeta[r.role]?.name || r.role)} · ${escV16(r.unit)}</small></div>
    <div class="indicator-status-v16"><span class="status-pill" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${escV16(st.short)}</span></div>
    <div class="indicator-source-v16"><small>Nguồn</small><b>${escV16(r.source)}</b></div>
    <div class="indicator-progress-v16"><small>Tiến độ</small><div class="progress"><i style="width:${Math.max(0, Math.min(100, progress))}%"></i></div><b>${progress}%</b></div>
  </button>`;
    }
    window.renderIndicatorRows = function () {
        const q = (document.getElementById("qInd")?.value || "").toLowerCase();
        const st =
            document.getElementById("stInd")?.value ||
            window.activeIndicatorPieStatus ||
            activeIndicatorPieStatus ||
            "";
        const unit = document.getElementById("unitInd")?.value || "";
        activeIndicatorPieStatus = st;
        const rs = (currentDrawerRecords || []).filter(
            (r) =>
                (!st || r.status === st) &&
                (!unit || r.unit === unit) &&
                (!q ||
                    [r.id, r.title, r.indicator, r.unit, r.source, r.freq]
                        .join(" ")
                        .toLowerCase()
                        .includes(q)),
        );
        const sourceLabel =
            rs[0]?.source || currentDrawerRecords?.[0]?.source || "--";
        const freqLabel = rs[0]?.freq || currentDrawerRecords?.[0]?.freq || "--";
        const summary = document.getElementById("indSummary");
        if (summary) {
            summary.innerHTML = `<span class="badge gold">Đang hiển thị: ${fmt(rs.length)}</span><span class="badge ok">Tổng chỉ tiêu: ${fmt((currentDrawerRecords || []).length)}</span><span class="badge">Nguồn: ${escV16(sourceLabel)}</span><span class="badge">Tần suất: ${escV16(freqLabel)}</span>${st ? `<span class="badge" style="border-color:${statusMeta(st).color};color:${statusMeta(st).color}">${escV16(statusMeta(st).label)}</span>` : ""}`;
        }
        const holder = document.getElementById("indRows");
        if (!holder) return;
        if (!rs.length) {
            holder.innerHTML =
                '<div class="access-lock">Không có bản ghi phù hợp bộ lọc.</div>';
            return;
        }
        holder.innerHTML = `<div class="indicator-table-v16"><div class="indicator-table-head-v16"><span>Mã bản ghi</span><span>Chỉ tiêu / đơn vị</span><span>Trạng thái</span><span>Nguồn</span><span>Tiến độ</span></div>${rs.map(indicatorRowHtmlV16).join("")}</div>`;
    };
})();

(function () {
    /* ══ GIS phường Việt Hưng – xây lại theo đúng kiến trúc bản đồ GIS Thành ủy Hà Nội (1 bộ state/hàm duy nhất) ══ */
    var GC_CENTER = [21.0453, 105.8988],
        GC_ZOOM = 15;
    var tileUrls = {
        dark: [
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            "© OpenStreetMap",
        ],
        light: [
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            "© OpenStreetMap",
        ],
        satellite: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            "Tiles © Esri",
        ],
        contrast: [
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "© OpenStreetMap",
        ],
    };
    var sColor = {
        done: "#2fb174",
        doing: "#2c7dd2",
        soon: "#d8a50c",
        risk: "#d25a19",
        overdue: "#d33a44",
    };
    var sLabel = {
        done: "Hoàn thành",
        doing: "Đang xử lý",
        soon: "Sắp đến hạn",
        risk: "Nguy cơ trễ",
        overdue: "Quá hạn",
    };

    /* ── Dữ liệu riêng của phường Việt Hưng (giữ nguyên) ── */
    var thonData = [
        {
            name: "Khu Việt Hưng (cũ)",
            coords: [
                [21.0544, 105.8857],
                [21.0544, 105.8987],
                [21.0474, 105.8987],
                [21.0474, 105.8857],
            ],
            mota: "Khu đô thị Việt Hưng cũ, giáp phố Vạn Hạnh, trung tâm hành chính phường.",
        },
        {
            name: "Khu Giang Biên",
            coords: [
                [21.0474, 105.8987],
                [21.0474, 105.9107],
                [21.0414, 105.9107],
                [21.0414, 105.8987],
            ],
            mota: "Khu vực Giang Biên cũ sáp nhập, dân cư đông, gần chợ đầu mối.",
        },
        {
            name: "Khu Phúc Đông",
            coords: [
                [21.0544, 105.8987],
                [21.0544, 105.9107],
                [21.0474, 105.9107],
                [21.0474, 105.8987],
            ],
            mota: "Khu vực Phúc Đông cũ sáp nhập, đang chỉnh trang đô thị.",
        },
        {
            name: "Khu Phúc Lợi",
            coords: [
                [21.0414, 105.8987],
                [21.0414, 105.8867],
                [21.0344, 105.8867],
                [21.0344, 105.8987],
            ],
            mota: "Một phần diện tích Phúc Lợi cũ sáp nhập vào phường.",
        },
        {
            name: "Khu Gia Thụy - Đức Giang",
            coords: [
                [21.0414, 105.8867],
                [21.0414, 105.8987],
                [21.0344, 105.8987],
                [21.0344, 105.8867],
            ],
            mota: "Một phần diện tích Gia Thụy, Đức Giang cũ sáp nhập vào phường.",
        },
    ];
    var congTrinhData = [
        {
            id: "CT-001",
            name: "Nâng cấp trụ sở UBND phường",
            lat: 21.0453,
            lng: 105.8982,
            loai: "Công sở",
            status: "doing",
            pct: 62,
            don_vi: "Văn phòng UBND",
            han: "30/09/2026",
        },
        {
            id: "CT-002",
            name: "Cải tạo đường khu Giang Biên",
            lat: 21.0459,
            lng: 105.9052,
            loai: "Giao thông",
            status: "done",
            pct: 100,
            don_vi: "Công chức Địa chính",
            han: "15/06/2026",
        },
        {
            id: "CT-003",
            name: "Xây dựng nhà văn hóa khu Phúc Đông",
            lat: 21.0504,
            lng: 105.9032,
            loai: "Văn hóa",
            status: "soon",
            pct: 45,
            don_vi: "Công chức VH-XH",
            han: "10/07/2026",
        },
        {
            id: "CT-004",
            name: "Hệ thống thoát nước khu chợ",
            lat: 21.0426,
            lng: 105.8962,
            loai: "Hạ tầng",
            status: "risk",
            pct: 28,
            don_vi: "Công chức Địa chính",
            han: "05/07/2026",
        },
        {
            id: "CT-005",
            name: "Sân thể thao đa năng trường TH",
            lat: 21.0484,
            lng: 105.8917,
            loai: "Giáo dục",
            status: "doing",
            pct: 70,
            don_vi: "Trường học",
            han: "20/08/2026",
        },
        {
            id: "CT-006",
            name: "Dự án GPMB đường vành đai",
            lat: 21.0404,
            lng: 105.9042,
            loai: "GPMB",
            status: "overdue",
            pct: 18,
            don_vi: "Công chức Địa chính",
            han: "01/06/2026",
        },
    ];
    var phanAnhData = [
        {
            id: "PA-001",
            name: "Phản ánh ngập úng khu Giang Biên",
            lat: 21.0466,
            lng: 105.9002,
            loai: "Môi trường",
            status: "risk",
            ngay: "26/06/2026",
            nguoi: "Nguyễn Văn A",
        },
        {
            id: "PA-002",
            name: "Lấn chiếm vỉa hè khu chợ Việt Hưng",
            lat: 21.0434,
            lng: 105.8965,
            loai: "Đô thị",
            status: "soon",
            ngay: "25/06/2026",
            nguoi: "Trần Thị B",
        },
        {
            id: "PA-003",
            name: "Cột điện nghiêng nguy hiểm khu Phúc Đông",
            lat: 21.0519,
            lng: 105.9019,
            loai: "Hạ tầng",
            status: "risk",
            ngay: "27/06/2026",
            nguoi: "Lê Văn C",
        },
        {
            id: "PA-004",
            name: "Chó thả rông cắn người khu Phúc Lợi",
            lat: 21.0376,
            lng: 105.8955,
            loai: "Trật tự",
            status: "done",
            ngay: "24/06/2026",
            nguoi: "Phạm Thị D",
        },
        {
            id: "PA-005",
            name: "Ô nhiễm mương thoát nước khu Phúc Lợi",
            lat: 21.0394,
            lng: 105.8995,
            loai: "Môi trường",
            status: "overdue",
            ngay: "20/06/2026",
            nguoi: "Hoàng Văn E",
        },
    ];
    var truSoData = [
        {
            id: "TS-001",
            name: "Trụ sở UBND phường Việt Hưng (số 1 phố Vạn Hạnh)",
            lat: 21.0453,
            lng: 105.8982,
            chuc_nang: "Trung tâm hành chính",
        },
        {
            id: "TS-002",
            name: "Trụ sở Đảng ủy phường",
            lat: 21.0455,
            lng: 105.8976,
            chuc_nang: "Cơ quan Đảng",
        },
        {
            id: "TS-003",
            name: "Trụ sở HĐND & MTTQ",
            lat: 21.0449,
            lng: 105.8989,
            chuc_nang: "Dân chủ & Mặt trận",
        },
        {
            id: "TS-004",
            name: "Công an phường",
            lat: 21.0447,
            lng: 105.8972,
            chuc_nang: "An ninh trật tự",
        },
        {
            id: "TS-005",
            name: "Trạm Y tế phường",
            lat: 21.0439,
            lng: 105.8997,
            chuc_nang: "Y tế cộng đồng",
        },
    ];
    var zoneDefs = [
        {
            id: "ZG-001",
            name: "Vùng trọng điểm khu chợ",
            color: "#f0a923",
            coords: [
                [21.0442, 105.8947],
                [21.0442, 105.8982],
                [21.0419, 105.8982],
                [21.0419, 105.8947],
            ],
        },
        {
            id: "ZG-002",
            name: "Vùng giám sát thoát nước khu Phúc Lợi",
            color: "#28cedd",
            coords: [
                [21.0409, 105.8957],
                [21.0409, 105.9007],
                [21.0374, 105.9007],
                [21.0374, 105.8957],
            ],
        },
    ];

    /* ── State (tương đương GM trong file Thành ủy) ── */
    var GM = {
        map: null,
        base: "dark",
        baseLayer: null,
        labelLayer: null,
        groups: {},
        zoneLayer: null,
        markerRefs: new Map(),
        draw: { active: false, points: [], line: null },
        userZones: [],
    };

    function gisMarkerIcon(color, emoji, size) {
        size = size || 30;
        return L.divIcon({
            className: "",
            html:
                '<div class="gis-marker" style="color:' +
                color +
                ";background:" +
                color +
                "22;border:1.5px solid " +
                color +
                "88;width:" +
                size +
                "px;height:" +
                size +
                'px"><span class="gis-marker-pulse" style="color:' +
                color +
                '"></span><span style="font-size:' +
                Math.round(size * 0.38) +
                'px">' +
                emoji +
                "</span></div>",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2],
        });
    }
    function pctBarHtml(pct, col) {
        return (
            '<div class="gis-pct-bar"><div class="gis-pct-bar-track"><span class="gis-pct-bar-fill" style="width:' +
            pct +
            "%;background:" +
            col +
            '"></span></div><small>' +
            pct +
            "% hoàn thành</small></div>"
        );
    }
    function badgeHtml(col, label) {
        return (
            '<span class="gis-pb" style="background:' +
            col +
            "22;color:" +
            col +
            ";border:1px solid " +
            col +
            '55">' +
            label +
            "</span>"
        );
    }

    function gisTileLayer(theme) {
        var t = tileUrls[theme] || tileUrls.dark;
        var opt = { maxZoom: 20, maxNativeZoom: 19, attribution: t[1] };
        if (t[0].indexOf('{s}') >= 0) opt.subdomains = 'abc';
        return L.tileLayer(t[0], opt);
    }

    function gisSetTheme(theme) {
        if (!GM.map) return;
        if (GM.baseLayer) GM.map.removeLayer(GM.baseLayer);
        if (GM.labelLayer) {
            GM.map.removeLayer(GM.labelLayer);
            GM.labelLayer = null;
        }
        GM.base = theme;
        GM.baseLayer = gisTileLayer(theme).addTo(GM.map); { var __tp = GM.map.getPane('tilePane'); if (__tp) __tp.style.filter = theme === 'dark' ? 'invert(1) hue-rotate(180deg) brightness(.86) contrast(1.06) saturate(.62)' : theme === 'light' ? 'grayscale(.82) brightness(1.06) contrast(.9) saturate(.55)' : 'none'; }
        if (theme === "satellite")
            GM.labelLayer = L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
                { maxZoom: 20, maxNativeZoom: 19 },
            ).addTo(GM.map);
        var lbl = {
            dark: "Nền tối",
            light: "Nền sáng",
            satellite: "Ảnh vệ tinh",
            contrast: "OpenStreetMap",
        };
        var ll = document.getElementById("gisLiveLabel2");
        if (ll) ll.textContent = "GIS trực tuyến • " + lbl[theme];
        var sel = document.getElementById("gisBaseSelect2");
        if (sel) sel.value = theme;
    }
    window.gisSetTheme = gisSetTheme;

    function createGisGroups() {
        ["thon", "congtrinh", "phananh", "truso", "zones", "heatmap"].forEach(
            function (k) {
                GM.groups[k] = L.layerGroup();
            },
        );

        /* Ranh giới khu dân cư */
        thonData.forEach(function (t) {
            var poly = L.polygon(t.coords, {
                color: "#f59e0b",
                weight: 2,
                opacity: 0.85,
                fillColor: "#f59e0b",
                fillOpacity: 0.07,
                dashArray: "6 4",
            });
            poly.bindPopup("<h4>🏘 " + t.name + "</h4><p>" + t.mota + "</p>");
            poly.addTo(GM.groups.thon);
            var c = poly.getBounds().getCenter();
            L.marker(c, {
                icon: L.divIcon({
                    html:
                        '<div style="color:#f59e0b;font-size:9px;font-weight:800;white-space:nowrap;text-shadow:0 1px 3px #000,0 0 6px #000">' +
                        t.name +
                        "</div>",
                    className: "",
                    iconAnchor: [0, 0],
                }),
            }).addTo(GM.groups.thon);
        });

        /* Công trình / dự án */
        congTrinhData.forEach(function (ct) {
            var col = sColor[ct.status] || "#2c7dd2";
            var m = L.marker([ct.lat, ct.lng], {
                icon: gisMarkerIcon(col, "🏗", 36),
                riseOnHover: true,
                title: ct.name,
            });
            m.bindPopup(
                "<h4>🏗 " +
                ct.name +
                "</h4><p><b>Loại:</b> " +
                ct.loai +
                " · <b>Đơn vị:</b> " +
                ct.don_vi +
                "</p><p><b>Hạn:</b> " +
                ct.han +
                "</p>" +
                pctBarHtml(ct.pct, col) +
                badgeHtml(col, sLabel[ct.status]),
            );
            m.addTo(GM.groups.congtrinh);
            GM.markerRefs.set(ct.id, m);
        });

        /* Phản ánh / sự cố */
        phanAnhData.forEach(function (pa) {
            var col = sColor[pa.status] || "#d33a44";
            var m = L.marker([pa.lat, pa.lng], {
                icon: gisMarkerIcon(col, "⚠", 34),
                riseOnHover: true,
                title: pa.name,
            });
            m.bindPopup(
                "<h4>⚠ " +
                pa.name +
                "</h4><p><b>Loại:</b> " +
                pa.loai +
                " · <b>Ngày:</b> " +
                pa.ngay +
                "</p><p><b>Người phản ánh:</b> " +
                pa.nguoi +
                "</p>" +
                badgeHtml(col, sLabel[pa.status]),
            );
            m.addTo(GM.groups.phananh);
            GM.markerRefs.set(pa.id, m);
        });

        /* Trụ sở hành chính */
        truSoData.forEach(function (ts) {
            var m = L.marker([ts.lat, ts.lng], {
                icon: gisMarkerIcon("#39d5ff", "🏢", 34),
                riseOnHover: true,
                title: ts.name,
            });
            m.bindPopup(
                "<h4>🏢 " +
                ts.name +
                "</h4><p>" +
                ts.chuc_nang +
                '</p><p style="color:#39d5ff;font-size:9px">Trụ sở hành chính phường Việt Hưng</p>',
            );
            m.addTo(GM.groups.truso);
            GM.markerRefs.set(ts.id, m);
        });

        /* Mật độ sự cố (heatmap phản ánh + công trình nguy cơ/quá hạn) */
        if (window.L && L.heatLayer) {
            var heatPts = [];
            phanAnhData.forEach(function (pa) {
                heatPts.push([
                    pa.lat,
                    pa.lng,
                    pa.status === "overdue" ? 1 : pa.status === "risk" ? 0.7 : 0.4,
                ]);
            });
            congTrinhData
                .filter(function (ct) {
                    return ct.status === "risk" || ct.status === "overdue";
                })
                .forEach(function (ct) {
                    heatPts.push([ct.lat, ct.lng, 0.8]);
                });
            GM.groups.heatmap = L.heatLayer(heatPts, {
                radius: 32,
                blur: 24,
                maxZoom: 17,
                gradient: {
                    0.2: "#2c7dd2",
                    0.5: "#d8a50c",
                    0.8: "#d25a19",
                    1: "#d33a44",
                },
            });
            var hc = document.getElementById("gisHeatCount");
            if (hc) hc.textContent = String(heatPts.length).padStart(2, "0");
        }

        /* Vùng giám sát định sẵn (từ CATP) – bật/tắt qua checkbox "Vùng giám sát" */
        zoneDefs.forEach(function (z) {
            L.polygon(z.coords, {
                color: z.color,
                weight: 2,
                fillColor: z.color,
                fillOpacity: 0.1,
                dashArray: "5 4",
            })
                .bindTooltip(z.name, {
                    permanent: true,
                    direction: "center",
                    className: "gis-zone-tooltip",
                })
                .addTo(GM.groups.zones);
        });

        ["thon", "congtrinh", "phananh", "truso", "zones"].forEach(function (k) {
            GM.groups[k].addTo(GM.map);
        });
        updateGisZoneCount();
        updateGisStatus();
    }

    function updateGisZoneCount() {
        var zc = document.getElementById("gisZoneCount2");
        if (zc)
            zc.textContent = String(zoneDefs.length + GM.userZones.length).padStart(
                2,
                "0",
            );
    }

    function updateGisStatus() {
        var sb = document.getElementById("gisMapStatus2");
        if (sb)
            sb.innerHTML =
                thonData.length +
                " khu dân cư&nbsp;·&nbsp;" +
                congTrinhData.length +
                " công trình<br>" +
                phanAnhData.length +
                " phản ánh&nbsp;·&nbsp;" +
                truSoData.length +
                " trụ sở<br>" +
                (zoneDefs.length + GM.userZones.length) +
                " vùng giám sát";
    }

    function updateGisCoord() {
        if (!GM.map) return;
        var z = GM.map.getZoom(),
            c = GM.map.getCenter();
        var el = document.getElementById("gisCoordinate2");
        if (el)
            el.textContent =
                c.lat.toFixed(4) + ", " + c.lng.toFixed(4) + " • Z" + Math.round(z);
    }

    function initGisMap() {
        if (!window.L) {
            if (window.toast)
                toast("Leaflet chưa tải – bản đồ GIS không khởi động được");
            return;
        }
        var el = document.getElementById("gisMap");
        if (!el) return;
        if (GM.map) {
            GM.map.invalidateSize();
            return;
        }
        GM.map = L.map("gisMap", {
            center: GC_CENTER,
            zoom: GC_ZOOM,
            zoomControl: false,
            attributionControl: true,
            preferCanvas: true,
        });
        gisSetTheme("dark");
        createGisGroups();
        L.control.zoom({ position: "topright" }).addTo(GM.map);
        L.control.scale({ imperial: false, position: "bottomleft" }).addTo(GM.map);
        GM.map.on("moveend zoomend", updateGisCoord);
        updateGisCoord();
        setupGisControls();
        setTimeout(function () {
            GM.map.invalidateSize();
        }, 300);
        window._gisMap = GM.map;
    }
    window.initGisMap = initGisMap;

    function setupGisControls() {
        var sel = document.getElementById("gisBaseSelect2");
        if (sel)
            sel.onchange = function () {
                gisSetTheme(sel.value);
            };
        document.querySelectorAll("[data-gis-layer]").forEach(function (inp) {
            inp.onchange = function () {
                var key = inp.dataset.gisLayer,
                    on = inp.checked;
                if (!GM.map || !GM.groups[key]) return;
                if (on) GM.groups[key].addTo(GM.map);
                else GM.map.removeLayer(GM.groups[key]);
            };
        });
        var db = document.getElementById("gisDrawBtn2"),
            fb = document.getElementById("gisFinishBtn2"),
            cb = document.getElementById("gisClearBtn2");
        if (db) db.onclick = gisStartDraw2;
        if (fb) fb.onclick = gisFinishDraw2;
        if (cb) cb.onclick = gisClearZone2;
        var si = document.getElementById("gisMapSearch2");
        if (si) {
            si.oninput = function () {
                renderGisSearch(si.value);
            };
            si.onkeydown = function (e) {
                if (e.key === "Enter") {
                    var f = document.querySelector("#gisSearchSuggest2 button");
                    if (f) f.click();
                }
            };
        }
        document.addEventListener("click", function (e) {
            if (!e.target.closest("#gisMapSearch2, #gisSearchSuggest2")) {
                var s = document.getElementById("gisSearchSuggest2");
                if (s) s.style.display = "none";
            }
        });
    }

    function renderGisSearch(value) {
        var box = document.getElementById("gisSearchSuggest2");
        if (!box) return;
        var k = value.trim().toLowerCase();
        if (!k) {
            box.style.display = "none";
            return;
        }
        var results = [];
        thonData.forEach(function (t) {
            if (t.name.toLowerCase().includes(k))
                results.push({
                    icon: "🏘",
                    label: t.name,
                    sub: "Ranh giới khu dân cư",
                    action: function () {
                        var c = L.latLngBounds(t.coords).getCenter();
                        GM.map.flyTo([c.lat, c.lng], 15, { duration: 0.65 });
                    },
                });
        });
        congTrinhData.forEach(function (ct) {
            if ((ct.name + " " + ct.loai).toLowerCase().includes(k))
                results.push({
                    icon: "🏗",
                    label: ct.name,
                    sub: ct.loai + " • " + sLabel[ct.status],
                    action: function () {
                        var m = GM.markerRefs.get(ct.id);
                        if (m) {
                            GM.map.flyTo([ct.lat, ct.lng], 16, { duration: 0.65 });
                            setTimeout(function () {
                                m.openPopup();
                            }, 700);
                        }
                    },
                });
        });
        phanAnhData.forEach(function (pa) {
            if ((pa.name + " " + pa.loai).toLowerCase().includes(k))
                results.push({
                    icon: "⚠",
                    label: pa.name,
                    sub: pa.loai + " • " + sLabel[pa.status],
                    action: function () {
                        var m = GM.markerRefs.get(pa.id);
                        if (m) {
                            GM.map.flyTo([pa.lat, pa.lng], 16, { duration: 0.65 });
                            setTimeout(function () {
                                m.openPopup();
                            }, 700);
                        }
                    },
                });
        });
        truSoData.forEach(function (ts) {
            if ((ts.name + " " + ts.chuc_nang).toLowerCase().includes(k))
                results.push({
                    icon: "🏢",
                    label: ts.name,
                    sub: ts.chuc_nang,
                    action: function () {
                        var m = GM.markerRefs.get(ts.id);
                        if (m) {
                            GM.map.flyTo([ts.lat, ts.lng], 17, { duration: 0.65 });
                            setTimeout(function () {
                                m.openPopup();
                            }, 700);
                        }
                    },
                });
        });
        if (!results.length) {
            box.style.display = "none";
            return;
        }
        box.innerHTML = results
            .slice(0, 8)
            .map(function (r, i) {
                return (
                    '<button data-i="' +
                    i +
                    '">' +
                    r.icon +
                    " <span>" +
                    r.label +
                    '<br><em style="font-size:8px;color:#7598b0">' +
                    r.sub +
                    "</em></span></button>"
                );
            })
            .join("");
        box.style.display = "block";
        box.querySelectorAll("button").forEach(function (btn, i) {
            btn.onclick = function () {
                results[i].action();
                box.style.display = "none";
                var si = document.getElementById("gisMapSearch2");
                if (si) si.value = "";
            };
        });
    }

    function gisStartDraw2() {
        if (!GM.map || GM.draw.active) return;
        GM.draw.active = true;
        GM.draw.points = [];
        GM.map.dragging.disable();
        GM.map.doubleClickZoom.disable();
        var h = document.getElementById("gisDrawHint2"),
            db = document.getElementById("gisDrawBtn2"),
            fb = document.getElementById("gisFinishBtn2");
        if (h) h.style.display = "block";
        if (db) db.classList.add("active");
        if (fb) fb.style.display = "";
        GM.map.on("click", gisDrawPoint);
        GM.map.once("dblclick", gisFinishDraw2);
        if (window.toast)
            toast(
                "Khoanh vùng GIS: click từng điểm trên bản đồ, nhấn Hoàn tất hoặc double-click để đóng vùng.",
            );
    }
    window.gisStartDraw2 = gisStartDraw2;

    function gisDrawPoint(e) {
        GM.draw.points.push(e.latlng);
        if (GM.draw.line) GM.map.removeLayer(GM.draw.line);
        GM.draw.line = L.polyline(GM.draw.points, {
            color: "#59caff",
            weight: 2,
            dashArray: "5 5",
        }).addTo(GM.map);
    }

    function gisFinishDraw2() {
        if (!GM.draw.active) return;
        if (GM.draw.points.length < 3) {
            if (window.toast) toast("Cần tối thiểu 3 điểm để tạo vùng giám sát.");
            gisStopDraw2();
            return;
        }
        var colors = ["#f0a923", "#ef4444", "#29d5ea", "#2fb174", "#a78bfa"];
        var col = colors[GM.userZones.length % colors.length];
        var coords = GM.draw.points.map(function (ll) {
            return [ll.lat, ll.lng];
        });
        var poly = L.polygon(coords, {
            color: col,
            weight: 2,
            fillColor: col,
            fillOpacity: 0.12,
        }).bindTooltip("Vùng GS-" + (GM.userZones.length + 1), {
            permanent: true,
            direction: "center",
            className: "gis-zone-tooltip",
        });
        poly.addTo(GM.groups.zones);
        GM.userZones.push(poly);
        gisStopDraw2();
        updateGisZoneCount();
        updateGisStatus();
        if (window.toast)
            toast(
                "Đã tạo vùng giám sát " + GM.userZones.length + " trên bản đồ GIS.",
            );
    }
    window.gisFinishDraw2 = gisFinishDraw2;

    function gisStopDraw2() {
        GM.draw.active = false;
        GM.draw.points = [];
        if (GM.draw.line) {
            GM.map.removeLayer(GM.draw.line);
            GM.draw.line = null;
        }
        GM.map.dragging.enable();
        GM.map.doubleClickZoom.enable();
        GM.map.off("click", gisDrawPoint);
        var h = document.getElementById("gisDrawHint2"),
            db = document.getElementById("gisDrawBtn2"),
            fb = document.getElementById("gisFinishBtn2");
        if (h) h.style.display = "none";
        if (db) db.classList.remove("active");
        if (fb) fb.style.display = "none";
    }

    function gisClearZone2() {
        if (GM.draw.active) {
            if (GM.draw.line) GM.map.removeLayer(GM.draw.line);
            gisStopDraw2();
            return;
        }
        var z = GM.userZones.pop();
        if (z) {
            GM.groups.zones.removeLayer(z);
            if (window.toast) toast("Đã xóa vùng giám sát vừa tạo.");
        } else if (window.toast) toast("Chưa có vùng tự tạo để xóa.");
        updateGisZoneCount();
        updateGisStatus();
    }
    window.gisClearZone2 = gisClearZone2;

    function gisResetView2() {
        if (GM.map) GM.map.flyTo(GC_CENTER, GC_ZOOM, { duration: 0.7 });
    }
    window.gisResetView2 = gisResetView2;

    function gisFocusLayer(key) {
        if (!GM.map) return;
        var pts = [];
        if (key === "thon") {
            thonData.forEach(function (t) {
                t.coords.forEach(function (c) {
                    pts.push(c);
                });
            });
        } else if (key === "congtrinh") {
            congTrinhData.forEach(function (ct) {
                pts.push([ct.lat, ct.lng]);
            });
        } else if (key === "phananh") {
            phanAnhData.forEach(function (pa) {
                pts.push([pa.lat, pa.lng]);
            });
        } else if (key === "truso") {
            truSoData.forEach(function (ts) {
                pts.push([ts.lat, ts.lng]);
            });
        }
        if (pts.length) GM.map.fitBounds(pts, { padding: [40, 40], maxZoom: 16 });
        var inp = document.querySelector('[data-gis-layer="' + key + '"]');
        if (inp && !inp.checked) {
            inp.checked = true;
            if (GM.groups[key]) GM.groups[key].addTo(GM.map);
        }
    }
    window.gisFocusLayer = gisFocusLayer;

    function gisToggleFullscreen(btn) {
        var widget = document.querySelector('.gis-widget[data-widget="gismap"]');
        if (!widget) return;
        var isFs = widget.classList.toggle("gis-fs-active");
        if (btn) {
            btn.textContent = isFs ? "✕" : "⛶";
            btn.title = isFs ? "Thoát toàn màn hình" : "Toàn màn hình";
        }
        setTimeout(function () {
            GM.map && GM.map.invalidateSize();
        }, 120);
        if (isFs) {
            widget.scrollIntoView({ behavior: "smooth" });
            document.addEventListener("keydown", function _esc(e) {
                if (e.key === "Escape") {
                    gisToggleFullscreen(btn);
                    document.removeEventListener("keydown", _esc);
                }
            });
        }
    }
    window.gisToggleFullscreen = gisToggleFullscreen;

    /* Hook vào renderAll để tự khởi tạo/khôi phục khi widget được hiển thị */
    var _origRenderAll = window.renderAll;
    window.renderAll = function () {
        if (_origRenderAll) _origRenderAll.apply(this, arguments);
        setTimeout(function () {
            var hidden = (function () {
                try {
                    return JSON.parse(
                        localStorage.getItem(
                            "px-ioc-hidden-" +
                            (typeof currentRole !== "undefined" ? currentRole : ""),
                        ) || "[]",
                    );
                } catch (e) {
                    return [];
                }
            })();
            if (!hidden.includes("gismap")) initGisMap();
        }, 200);
    };

    /* widgetLabels */
    setTimeout(function () {
        if (typeof widgetLabels !== "undefined")
            widgetLabels.gismap = "Bản đồ GIS Tương tác – phường Việt Hưng";
    }, 0);
})();

(function () {
    var CDL_PAL = [
        "#2fb174",
        "#2c7dd2",
        "#d8a50c",
        "#d25a19",
        "#a78bfa",
        "#39d5ff",
        "#ef4444",
        "#f59e0b",
        "#06b6d4",
        "#ec4899",
        "#84cc16",
        "#f97316",
    ];

    /* helpers */
    function cdlArc(cx, cy, r, a1, a2) {
        var x1 = cx + r * Math.cos(a1),
            y1 = cy + r * Math.sin(a1),
            x2 = cx + r * Math.cos(a2),
            y2 = cy + r * Math.sin(a2),
            lg = a2 - a1 > Math.PI ? 1 : 0;
        return (
            "M " +
            x1.toFixed(2) +
            " " +
            y1.toFixed(2) +
            " A " +
            r +
            " " +
            r +
            " 0 " +
            lg +
            " 1 " +
            x2.toFixed(2) +
            " " +
            y2.toFixed(2)
        );
    }
    function fmtN(n) {
        n = Number(n) || 0;
        return n >= 1000000
            ? (n / 1000000).toFixed(1) + "M"
            : n >= 10000
                ? (n / 1000).toFixed(1) + "K"
                : window.fmt
                    ? window.fmt(n)
                    : n.toLocaleString("vi-VN");
    }

    /* donut chỉ tiêu con */
    function renderCatDonut(cat) {
        var items = cat.items || [];
        if (!items.length) return "";
        var total = items.reduce(function (s, it) {
            return s + (Number(it[1]) || 0);
        }, 0);
        if (!total) return "";
        var arcs = "",
            a = -Math.PI / 2;
        items.forEach(function (it, i) {
            var cnt = Number(it[1]) || 0;
            if (!cnt) return;
            var sw = (cnt / total) * 2 * Math.PI;
            arcs +=
                '<path d="' +
                cdlArc(100, 100, 68, a, a + sw - 0.014) +
                '" fill="none" stroke="' +
                CDL_PAL[i % CDL_PAL.length] +
                '" stroke-width="26" stroke-linecap="butt"/>';
            a += sw;
        });
        var cname = cat.name.length > 13 ? cat.name.slice(0, 12) + "…" : cat.name;
        var legend = items
            .map(function (it, i) {
                var nm = it[0],
                    cnt = Number(it[1]) || 0,
                    sh = nm.length > 33 ? nm.slice(0, 32) + "…" : nm;
                return (
                    '<div class="cdl-item"><span class="cdl-dot" style="background:' +
                    CDL_PAL[i % CDL_PAL.length] +
                    '"></span><span class="cdl-name">' +
                    sh +
                    '</span><span class="cdl-cnt">' +
                    fmtN(cnt) +
                    "</span></div>"
                );
            })
            .join("");
        return (
            '<div class="cat-donut-wrap">' +
            '<div class="cat-donut-svg"><svg viewBox="0 0 200 200" width="156" height="156" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="100" cy="100" r="68" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="26"/>' +
            arcs +
            '<text x="100" y="94" text-anchor="middle" font-size="26" font-weight="700" fill="#e8f4ff" font-family="\'Roboto Mono\',monospace">' +
            fmtN(total) +
            "</text>" +
            '<text x="100" y="113" text-anchor="middle" font-size="11" fill="#7aaed4" font-family="\'Segoe UI\',sans-serif">' +
            cname +
            "</text>" +
            '<text x="100" y="127" text-anchor="middle" font-size="10" fill="#4a7ea8" font-family="\'Segoe UI\',sans-serif">bản ghi</text>' +
            "</svg></div>" +
            '<div class="cat-donut-legend"><div class="cdl-title">Phân bổ theo chỉ tiêu con</div>' +
            legend +
            "</div>" +
            "</div>"
        );
    }
    window.renderCatDonut = renderCatDonut;

    /* status info */
    var IIP_ST = [
        { k: "done", l: "Hoàn thành", c: "#2fb174" },
        { k: "doing", l: "Đang xử lý", c: "#2c7dd2" },
        // { k: "regular", l: "Thường xuyên", c: "#39d5ff" },
        { k: "soon", l: "Sắp đến hạn", c: "#d8a50c" },
        { k: "risk", l: "Nguy cơ trễ", c: "#d25a19" },
        { k: "overdue", l: "Quá hạn", c: "#ef4444" },
    ];
    function stInfo(key) {
        if (window.statusMeta) {
            var m = window.statusMeta(key);
            if (m && m.label) return { l: m.label, c: m.color || "#aaa" };
        }
        var f = IIP_ST.find(function (s) {
            return s.k === key;
        });
        return f ? { l: f.l, c: f.c } : { l: key, c: "#7a9ab8" };
    }

    /* render rows (dùng chung cho lần đầu và khi search) */
    function iipRows(rs) {
        if (!rs.length)
            return '<tr><td colspan="5" class="iip-empty">Không có bản ghi phù hợp</td></tr>';
        return rs
            .map(function (r) {
                var si = stInfo(r.status),
                    pct = Number(r.progress) || 0;
                return (
                    "<tr onclick=\"iipOpenRecord('" +
                    r.id +
                    "')\">" +
                    '<td class="iip-td-id">' +
                    r.id +
                    "</td>" +
                    '<td style="color:#cde4f8">' +
                    (r.title || r.indicator || "") +
                    "</td>" +
                    '<td style="white-space:nowrap"><span style="font-size:10px;padding:2px 7px;border-radius:999px;background:' +
                    si.c +
                    "22;color:" +
                    si.c +
                    ";border:1px solid " +
                    si.c +
                    '44">' +
                    si.l +
                    "</span></td>" +
                    '<td style="white-space:nowrap;color:#7aaed4;font-size:10px">' +
                    (r.due || "--") +
                    "</td>" +
                    '<td style="white-space:nowrap"><div class="iip-pct-bar"><div class="iip-pct-fill" style="width:' +
                    pct +
                    '%"></div></div>' +
                    pct +
                    "%</td></tr>"
                );
            })
            .join("");
    }

    /* search handler */
    window.iipSearch = function (input) {
        var panel = input.closest(".iip-wrap");
        if (!panel) return;
        var role = panel.dataset.iipRole,
            enc = panel.dataset.iipEnc,
            name = decodeURIComponent(enc);
        var q = input.value.trim().toLowerCase();
        var _all =
            window.indicatorRecords ||
            (typeof indicatorRecords !== "undefined" ? indicatorRecords : []);
        var rs = _all.filter(function (r) {
            return r.role === role && r.indicator === name;
        });
        if (q)
            rs = rs.filter(function (r) {
                return (
                    (r.id || "") +
                    " " +
                    (r.title || "") +
                    " " +
                    (r.status || "") +
                    " " +
                    (r.due || "")
                )
                    .toLowerCase()
                    .includes(q);
            });
        var tbody = panel.querySelector(".iip-table tbody");
        if (tbody) tbody.innerHTML = iipRows(rs);
        var el = panel.querySelector(".iip-rec-count");
        if (el) el.textContent = fmtN(rs.length) + (q ? " kết quả" : " bản ghi");
    };

    /* mở indicator detail + thêm nút quay lại */
    window.iipOpenRecord = function (id) {
        var fn =
            window.openIndicatorDetail ||
            (typeof openIndicatorDetail !== "undefined" ? openIndicatorDetail : null);
        if (!fn) return;
        fn(id);
        setTimeout(function () {
            var body = document.getElementById("modalBody");
            if (body && !body.querySelector(".iip-modal-back")) {
                body.insertAdjacentHTML(
                    "afterbegin",
                    '<div class="iip-modal-back"><button class="ghost" onclick="closeModal()">← Quay lại lĩnh vực</button></div>',
                );
            }
        }, 60);
    };

    /* inline accordion */
    function iipCloseAll(grid) {
        grid.querySelectorAll(".iip-wrap").forEach(function (el) {
            el.remove();
        });
        grid.querySelectorAll(".iip-btn-active").forEach(function (b) {
            b.textContent = "Xem dữ liệu";
            b.classList.remove("iip-btn-active");
        });
    }
    window.toggleInlineData = function (btn, role, enc) {
        var name = decodeURIComponent(enc);
        var card = btn.closest("article.category-item-card");
        var grid = card ? card.parentElement : null;
        if (!grid) return;
        var wasActive = btn.classList.contains("iip-btn-active");
        iipCloseAll(grid);
        if (wasActive) return;
        btn.textContent = "Thu gọn ▲";
        btn.classList.add("iip-btn-active");
        var _all =
            window.indicatorRecords ||
            (typeof indicatorRecords !== "undefined" ? indicatorRecords : []);
        var rs = _all.filter(function (r) {
            return r.role === role && r.indicator === name;
        });
        var total = rs.length;
        /* chips */
        var cnts = {};
        rs.forEach(function (r) {
            cnts[r.status] = (cnts[r.status] || 0) + 1;
        });
        var chips = "";
        IIP_ST.forEach(function (s) {
            if (cnts[s.k] > 0)
                chips +=
                    '<span class="iip-chip"><span class="iip-chip-dot" style="background:' +
                    s.c +
                    '"></span><span class="iip-chip-lbl">' +
                    s.l +
                    '</span><span class="iip-chip-cnt">' +
                    fmtN(cnts[s.k]) +
                    "</span></span>";
        });
        Object.keys(cnts).forEach(function (k) {
            if (
                !IIP_ST.find(function (s) {
                    return s.k === k;
                })
            ) {
                var si = stInfo(k);
                chips +=
                    '<span class="iip-chip"><span class="iip-chip-dot" style="background:' +
                    si.c +
                    '"></span><span class="iip-chip-lbl">' +
                    si.l +
                    '</span><span class="iip-chip-cnt">' +
                    fmtN(cnts[k]) +
                    "</span></span>";
            }
        });
        var closeJs =
            "(function(b){var g=b.closest('.category-item-grid');if(g){g.querySelectorAll('.iip-wrap').forEach(function(e){e.remove();});g.querySelectorAll('.iip-btn-active').forEach(function(x){x.textContent='Xem dữ liệu';x.classList.remove('iip-btn-active');});}})(this)";
        var panel = document.createElement("div");
        panel.className = "iip-wrap";
        panel.dataset.iipRole = role;
        panel.dataset.iipEnc = enc;
        panel.dataset.iipCatId = grid.dataset.catId || "";
        panel.dataset.iipCatRole = grid.dataset.catRole || role;
        panel.innerHTML =
            '<div class="iip-head">' +
            '<div class="iip-head-left"><span class="iip-head-title">' +
            name +
            '</span><span class="badge gold mono" style="font-size:10px">' +
            fmtN(total) +
            " bản ghi</span></div>" +
            '<button class="iip-close-btn" onclick="' +
            closeJs +
            '">✕ Đóng</button>' +
            "</div>" +
            '<div class="iip-chips">' +
            chips +
            "</div>" +
            '<div class="iip-search-row">' +
            '<input class="iip-search" placeholder="Tìm mã, tiêu đề, trạng thái, hạn..." oninput="iipSearch(this)"/>' +
            '<span class="iip-rec-count">' +
            fmtN(total) +
            " bản ghi</span>" +
            "</div>" +
            '<div class="iip-table-wrap"><table class="iip-table"><thead><tr><th>Mã bản ghi</th><th>Tiêu đề</th><th>Trạng thái</th><th>Hạn</th><th>Tiến độ</th></tr></thead><tbody>' +
            iipRows(rs) +
            "</tbody></table></div>" +
            '<div style="padding:10px 0 2px;text-align:center"><button class="ghost" style="font-size:11px;padding:5px 14px" onclick="iipOpenAll(this)">Xem tất cả trong popup đầy đủ →</button></div>';
        card.after(panel);
        setTimeout(function () {
            panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 60);
    };

    /* chặn scroll nền khi drawer/modal mở */
    (function () {
        function lockScroll() {
            document.body.style.overflow = "hidden";
        }
        function unlockScroll() {
            var drawerOpen =
                document.getElementById("drawer") &&
                document.getElementById("drawer").classList.contains("open");
            var modalOpen =
                document.getElementById("modal") &&
                document.getElementById("modal").classList.contains("open");
            if (!drawerOpen && !modalOpen) document.body.style.overflow = "";
        }
        var _oD = window.openDrawer,
            _cD = window.closeDrawer,
            _oM = window.openModal,
            _cM = window.closeModal;
        window.openDrawer = function () {
            if (_oD) _oD();
            lockScroll();
        };
        window.closeDrawer = function () {
            if (_cD) _cD();
            unlockScroll();
        };
        window.openModal = function () {
            if (_oM) _oM();
            lockScroll();
        };
        window.closeModal = function () {
            if (_cM) _cM();
            unlockScroll();
        };
    })();

    /* mở toàn bộ indicator list (drawer đầy đủ) + inject nút quay lại */
    window.iipOpenAll = function (btn) {
        var panel = btn.closest(".iip-wrap");
        if (!panel) return;
        var role = panel.dataset.iipCatRole || panel.dataset.iipRole;
        var catId = panel.dataset.iipCatId;
        var enc = panel.dataset.iipEnc;
        window._iipLastCat = { role: role, catId: catId };
        var fn =
            window.openIndicatorByName ||
            (typeof openIndicatorByName !== "undefined" ? openIndicatorByName : null);
        if (fn) fn(role, enc);
        setTimeout(function () {
            var body = document.getElementById("drawerBody");
            if (body && !body.querySelector(".iip-back-in-drawer")) {
                body.insertAdjacentHTML(
                    "afterbegin",
                    '<div class="iip-back-in-drawer" style="margin-bottom:10px">' +
                    '<button class="ghost" style="font-size:11.5px;padding:6px 14px" onclick="(function(){var c=window._iipLastCat;if(c&&window.openCategoryDetail)openCategoryDetail(c.role,c.catId);})()">← Quay lại lĩnh vực</button>' +
                    "</div>",
                );
            }
        }, 80);
    };

    /* openCategoryDetail override */
    window.openCategoryDetail = function (role, catId) {
        var canSee =
            window.canSeeRole ||
            function () {
                return true;
            };
        if (!canSee(role)) {
            (window.toast || alert)("Không có quyền xem lĩnh vực này.");
            return;
        }
        var seeds = window.__v14Categories || {};
        var cat = (seeds[role] || []).find(function (c) {
            return c.id === catId;
        });
        if (!cat) return;
        var total = cat.items.reduce(function (s, it) {
            return s + (Number(it[1]) || 0);
        }, 0);
        var AM = window.axisMeta || {},
            fmtFn =
                window.fmt ||
                function (n) {
                    return String(n);
                },
            am = AM[role] || { icon: "", name: role };
        document.getElementById("drawerTitle").textContent =
            "Lĩnh vực: " + cat.name;
        var cards = cat.items
            .map(function (it, idx) {
                var apiClass = String(it[3]).includes("API") ? "ok" : "gold",
                    enc = encodeURIComponent(it[0]);
                return (
                    '<article class="category-item-card"><h5>' +
                    it[0] +
                    "</h5>" +
                    '<div class="field-category-meta"><span class="badge">' +
                    it[2] +
                    '</span><span class="badge ' +
                    apiClass +
                    '">' +
                    it[3] +
                    '</span><span class="badge gold mono">' +
                    fmtFn(it[1]) +
                    "</span></div>" +
                    '<div class="mini-progress"><i style="width:' +
                    Math.min(96, 50 + idx * 5) +
                    '%"></i></div>' +
                    '<div class="actions"><button class="primary" onclick="toggleInlineData(this,\'' +
                    role +
                    "','" +
                    enc +
                    '\')">Xem dữ liệu</button><button class="ghost" onclick="qlnvxOpenAssignmentForm()">Giao xử lý</button></div>' +
                    "</article>"
                );
            })
            .join("");
        var head =
            '<div class="category-detail-head"><div><h4>' +
            am.icon +
            " " +
            cat.name +
            "</h4><p>" +
            cat.desc +
            "</p>" +
            '<div class="field-category-meta" style="margin-top:8px"><span class="badge gold">' +
            fmtFn(total) +
            ' bản ghi</span><span class="badge">' +
            cat.items.length +
            " chỉ tiêu</span>" +
            cat.types
                .map(function (t) {
                    return '<span class="badge">' + t + "</span>";
                })
                .join("") +
            "</div></div>" +
            '<button class="primary" onclick="qlnvxOpenAssignmentForm()">＋ Giao nhiệm vụ theo lĩnh vực</button></div>';
        document.getElementById("drawerBody").innerHTML =
            renderCatDonut(cat) +
            head +
            '<div class="category-item-grid" data-cat-id="' +
            catId +
            '" data-cat-role="' +
            role +
            '">' +
            cards +
            "</div>";
        (window.openDrawer || function () { })();
    };
})();

(function () {
    var CAT_ST = [
        { k: "done", l: "Đã hoàn thành", c: "#2fb174" },
        { k: "doing", l: "Đang thực hiện", c: "#2c7dd2" },
        { k: "regular", l: "Vượt chỉ tiêu", c: "#39d5ff" },
        { k: "soon", l: "Chưa bắt đầu", c: "#d8a50c" },
        { k: "risk", l: "Tạm dừng", c: "#d25a19" },
        { k: "overdue", l: "Không đạt", c: "#ef4444" },
    ];

    function cfmt(n) {
        return (
            window.fmt ||
            function (v) {
                return Number(v).toLocaleString("vi-VN");
            }
        )(Number(n) || 0);
    }
    function cSt(k) {
        return CAT_ST.find((s) => s.k === k) || { k: k, l: k, c: "#7a9ab8" };
    }
    function getRecs(role, name) {
        var arr =
            window.indicatorRecords ||
            (typeof indicatorRecords !== "undefined" ? indicatorRecords : []);
        return arr.filter((r) => r.role === role && r.indicator === name);
    }

    /* build 1 axis-row cho mỗi chỉ tiêu — dùng lại .bar và .seg có sẵn */
    function buildAxisRow(role, it) {
        var name = it[0],
            declared = Number(it[1]) || 0;
        var recs = getRecs(role, name);
        var tot = recs.length || declared || 1;
        var enc = encodeURIComponent(name);
        var cnts = {};
        CAT_ST.forEach((s) => {
            cnts[s.k] = recs.filter((r) => r.status === s.k).length;
        });
        var segs = CAT_ST.map((s) => {
            var n = cnts[s.k] || 0;
            if (!n) return '<div class="seg zero"></div>';
            var w = ((n / tot) * 100).toFixed(1);
            return (
                '<button class="seg" style="width:' +
                w +
                "%;background:" +
                s.c +
                ';border:0;cursor:pointer;font-family:inherit"' +
                ' title="' +
                s.l +
                ": " +
                cfmt(n) +
                '"' +
                " onclick=\"catSegClick(this,'" +
                role +
                "','" +
                enc +
                "','" +
                s.k +
                "')\">" +
                cfmt(n) +
                "</button>"
            );
        }).join("");
        return (
            '<div class="v16-axis-row">' +
            '<button class="v16-axis-label" title="Xem tất cả" onclick="catSegClick(this,\'' +
            role +
            "','" +
            enc +
            "','')\">" +
            name +
            "</button>" +
            '<div class="bar">' +
            segs +
            "</div>" +
            '<div class="v16-axis-total">' +
            cfmt(declared) +
            "</div>" +
            "</div>"
        );
    }

    /* legend dùng lại .legend và .sw */
    function buildLegend() {
        return (
            '<div class="legend" style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(87,178,255,.12)">' +
            CAT_ST.map(
                (s) =>
                    '<span><span class="sw" style="background:' +
                    s.c +
                    '"></span>' +
                    s.l +
                    "</span>",
            ).join("") +
            "</div>"
        );
    }

    function buildRows(rs) {
        if (!rs.length)
            return '<tr><td colspan="5" class="iip-empty">Không có bản ghi phù hợp</td></tr>';
        return rs
            .map((r) => {
                var si = cSt(r.status),
                    pct = Number(r.progress) || 0;
                return (
                    '<tr style="cursor:pointer" onclick="(window.iipOpenRecord||function(){})(\'' +
                    r.id +
                    "')\">" +
                    '<td class="iip-td-id" style="color:#5b9acf;font-size:10px;white-space:nowrap">' +
                    r.id +
                    "</td>" +
                    '<td style="color:#cde4f8">' +
                    (r.title || r.indicator || "") +
                    "</td>" +
                    '<td style="white-space:nowrap"><span style="font-size:10px;padding:2px 7px;border-radius:999px;background:' +
                    si.c +
                    "22;color:" +
                    si.c +
                    ";border:1px solid " +
                    si.c +
                    '44">' +
                    si.l +
                    "</span></td>" +
                    '<td style="white-space:nowrap;color:#7aaed4;font-size:10px">' +
                    (r.due || "--") +
                    "</td>" +
                    '<td style="white-space:nowrap"><div class="iip-pct-bar"><div class="iip-pct-fill" style="width:' +
                    pct +
                    '%"></div></div>' +
                    pct +
                    "%</td>" +
                    "</tr>"
                );
            })
            .join("");
    }

    function buildPanel(role, enc, statusKey) {
        var name = decodeURIComponent(enc);
        var all = getRecs(role, name);
        var rs = statusKey ? all.filter((r) => r.status === statusKey) : all;
        var cnts = {};
        CAT_ST.forEach((s) => {
            cnts[s.k] = all.filter((r) => r.status === s.k).length;
        });
        var st = statusKey ? cSt(statusKey) : null;
        var panel = document.createElement("div");
        panel.className = "iip-wrap";
        panel.dataset.catEnc = enc;
        panel.dataset.catRole = role;
        panel.dataset.catStatus = statusKey || "";
        panel.innerHTML =
            '<div class="iip-head">' +
            '<div class="iip-head-left">' +
            '<span class="iip-head-title">' +
            name +
            "</span>" +
            '<span class="badge gold mono" style="font-size:10px">' +
            cfmt(all.length) +
            " bản ghi</span>" +
            (st
                ? '<span class="v16-status-badge" style="background:' +
                st.c +
                "22;color:" +
                st.c +
                ";border:1px solid " +
                st.c +
                '55">' +
                st.l +
                "</span>"
                : "") +
            "</div>" +
            '<button class="iip-close-btn" onclick="this.closest(\'.iip-wrap\').remove()">✕ Đóng</button>' +
            "</div>" +
            '<div class="iip-chips">' +
            '<button class="iip-chip v16-chip-btn' +
            (statusKey === "" ? " v16-chip-active" : "") +
            '" data-sk="" onclick="catPanelFilter(this,\'' +
            role +
            "','" +
            enc +
            "','')\">" +
            '<span class="iip-chip-lbl">Tất cả</span><span class="iip-chip-cnt">' +
            cfmt(all.length) +
            "</span></button>" +
            CAT_ST.map((s) =>
                cnts[s.k]
                    ? '<button class="iip-chip v16-chip-btn' +
                    (statusKey === s.k ? " v16-chip-active" : "") +
                    '" data-sk="' +
                    s.k +
                    '" onclick="catPanelFilter(this,\'' +
                    role +
                    "','" +
                    enc +
                    "','" +
                    s.k +
                    "')\">" +
                    '<span class="iip-chip-dot" style="background:' +
                    s.c +
                    '"></span>' +
                    '<span class="iip-chip-lbl">' +
                    s.l +
                    "</span>" +
                    '<span class="iip-chip-cnt">' +
                    cfmt(cnts[s.k]) +
                    "</span></button>"
                    : "",
            ).join("") +
            "</div>" +
            '<div class="iip-search-row">' +
            '<input class="iip-search" placeholder="Tìm mã, tiêu đề, hạn..." oninput="catIipSearch(this)"/>' +
            '<span class="iip-rec-count">' +
            cfmt(rs.length) +
            " bản ghi</span>" +
            "</div>" +
            '<div class="iip-table-wrap"><table class="iip-table">' +
            "<thead><tr><th>Mã</th><th>Tiêu đề</th><th>Trạng thái</th><th>Hạn</th><th>Tiến độ</th></tr></thead>" +
            "<tbody>" +
            buildRows(rs) +
            "</tbody>" +
            "</table></div>" +
            '<div style="padding:10px 0 2px;text-align:center"><button class="ghost" style="font-size:11px;padding:5px 14px" onclick="iipOpenAll(this)">Xem tất cả trong popup đầy đủ →</button></div>';
        /* set attrs cho iipOpenAll */
        panel.dataset.iipCatRole = role;
        panel.dataset.iipEnc = enc;
        return panel;
    }

    function updatePanel(panel, role, enc, statusKey) {
        var name = decodeURIComponent(enc);
        var all = getRecs(role, name);
        var rs = statusKey ? all.filter((r) => r.status === statusKey) : all;
        panel.dataset.catStatus = statusKey || "";
        /* chips */
        panel.querySelectorAll(".v16-chip-btn").forEach((b) => {
            b.classList.toggle("v16-chip-active", b.dataset.sk === statusKey);
        });
        /* status badge in head */
        var badge = panel.querySelector(".v16-status-badge");
        if (statusKey) {
            var st = cSt(statusKey);
            var html =
                '<span class="v16-status-badge" style="background:' +
                st.c +
                "22;color:" +
                st.c +
                ";border:1px solid " +
                st.c +
                '55">' +
                st.l +
                "</span>";
            if (badge) badge.outerHTML = html;
            else
                panel
                    .querySelector(".iip-head-left")
                    .insertAdjacentHTML("beforeend", html);
        } else {
            if (badge) badge.remove();
        }
        /* table */
        var tbody = panel.querySelector("tbody");
        if (tbody) tbody.innerHTML = buildRows(rs);
        var cnt = panel.querySelector(".iip-rec-count");
        if (cnt) cnt.textContent = cfmt(rs.length) + " bản ghi";
    }

    /* ── rút ngắn nút "Tất cả lĩnh vực được phép xem" → "🌐 Tất cả" ── */
    function fixCatToolbar() {
        var tabs = document.getElementById("indicatorRoleTabs");
        if (!tabs) return;
        tabs
            .querySelectorAll(".field-category-tabs button")
            .forEach(function (btn) {
                if (btn.textContent.includes("Tất cả lĩnh vực"))
                    btn.textContent = "🌐 Tất cả";
            });
    }
    var _catObs = new MutationObserver(fixCatToolbar);
    (function waitTabs() {
        var el = document.getElementById("indicatorRoleTabs");
        if (el) _catObs.observe(el, { childList: true, subtree: true });
        else setTimeout(waitTabs, 200);
    })();

    /* ── override openCategoryDetail ── */
    var _prev = window.openCategoryDetail;
    window.openCategoryDetail = function (role, catId) {
        _prev(role, catId); /* renders donut + header + old grid + openDrawer */
        var grid = document.querySelector(
            '.category-item-grid[data-cat-id="' + catId + '"]',
        );
        if (!grid) return;
        var seeds = window.__v14Categories || {};
        var cat = (seeds[role] || []).find((c) => c.id === catId);
        if (!cat) return;
        grid.classList.add("v16-axis-grid");
        grid.innerHTML =
            cat.items.map((it) => buildAxisRow(role, it)).join("") + buildLegend();
    };

    /* click segment hoặc tên chỉ tiêu */
    window.catSegClick = function (btn, role, enc, statusKey) {
        var row = btn.closest(".v16-axis-row");
        var grid = row ? row.parentElement : null;
        if (!grid) return;
        var existing = grid.querySelector('.iip-wrap[data-cat-enc="' + enc + '"]');
        if (existing) {
            if (existing.dataset.catStatus === statusKey) {
                existing.remove();
                return;
            }
            updatePanel(existing, role, enc, statusKey);
            setTimeout(
                () => existing.scrollIntoView({ behavior: "smooth", block: "nearest" }),
                40,
            );
            return;
        }
        grid.querySelectorAll(".iip-wrap").forEach((el) => el.remove());
        var panel = buildPanel(role, enc, statusKey);
        row.after(panel);
        setTimeout(
            () => panel.scrollIntoView({ behavior: "smooth", block: "nearest" }),
            60,
        );
    };

    /* click chip inside panel */
    window.catPanelFilter = function (btn, role, enc, statusKey) {
        var panel = btn.closest(".iip-wrap");
        if (!panel) return;
        updatePanel(panel, role, enc, statusKey);
    };

    /* search inside panel */
    window.catIipSearch = function (input) {
        var panel = input.closest(".iip-wrap");
        if (!panel) return;
        var role = panel.dataset.catRole,
            enc = panel.dataset.catEnc,
            statusKey = panel.dataset.catStatus || "";
        var name = decodeURIComponent(enc);
        var q = input.value.trim().toLowerCase();
        var all = getRecs(role, name);
        var rs = statusKey ? all.filter((r) => r.status === statusKey) : all;
        if (q)
            rs = rs.filter((r) =>
                ((r.id || "") + " " + (r.title || "") + " " + (r.due || ""))
                    .toLowerCase()
                    .includes(q),
            );
        var tbody = panel.querySelector("tbody");
        if (tbody) tbody.innerHTML = buildRows(rs);
        var el = panel.querySelector(".iip-rec-count");
        if (el) el.textContent = cfmt(rs.length) + (q ? " kết quả" : " bản ghi");
    };
})();

/* ===================================================================
 * BOOTSTRAP – khởi tạo component standalone (đã bỏ đăng nhập).
 * Mặc định đóng vai trò UBND (giống selectLogin('ubnd') của file gốc).
 * =================================================================== */
(function () {
    function __boot() {
        try {
            generateRecords();
        } catch (e) {
            console.error("generateRecords", e);
        }
        try {
            var acc =
                typeof accounts !== "undefined"
                    ? Object.keys(accounts)
                        .map(function (k) {
                            return accounts[k];
                        })
                        .filter(function (a) {
                            return a.role === "UBND";
                        })[0] || accounts.ubnd
                    : null;
            if (acc) {
                currentAccount = acc;
                currentRole = acc.role;
            }
        } catch (e) { }
        try {
            activeMetric = "received";
        } catch (e) { }
        try {
            activeIndicatorRole = allowedRoles()[0];
        } catch (e) { }
        /* STANDALONE: vô hiệu renderAll() toàn cục. Mỗi component tự render phần của mình;
             nhiều bản vá (v11/v12...) đặt setTimeout gọi renderAll() -> sẽ đụng phần tử DOM
             của các widget khác (không tồn tại trong trang lẻ). No-op để tránh vỡ. */
        try {
            renderAll = window.renderAll = function () { };
        } catch (e) { }
        /* Đồng hồ + danh tính (chỉ khi có phần tử tương ứng) */
        try {
            if (document.getElementById("clock")) {
                updateClock();
                setInterval(updateClock, 1000);
            }
        } catch (e) { }
        try {
            var m = axisMeta[currentRole];
            var i = document.getElementById("currentIcon");
            if (i) i.textContent = m.icon;
            var n = document.getElementById("currentRoleName");
            if (n) n.textContent = currentAccount.title;
            var d = document.getElementById("currentRoleDesc");
            if (d) d.textContent = currentAccount.subtitle;
        } catch (e) { }
        /* Ctrl/Cmd+K mở lệnh nhanh nếu có modal */
        try {
            document.addEventListener("keydown", function (e) {
                if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "k") {
                    e.preventDefault();
                    if (typeof openQuickCommand === "function") openQuickCommand();
                }
            });
        } catch (e) { }
        /* ==== RENDER RIÊNG CỦA COMPONENT ==== */
        renderRoleScope();
        renderSummary();
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

(function (global) {
    "use strict";

    function qlnvWin() {
        return typeof window !== "undefined" ? window : global;
    }
    function qlnvBase() {
        return String(qlnvWin().urlAPI || "").replace(/\/+$/, "");
    }

    var LOAI_NV_LABELS = {
        NHIEM_VU: "Nhiệm vụ cá nhân",
        NHIEM_VU_CON: "Nhiệm vụ nhiều đơn vị",
        CHI_DAO_DX: "Chỉ đạo điện tử",
        NHIEM_VU_THUONG_XUYEN: "Nhiệm vụ thường xuyên",
        CONG_VIEC_THUONG_XUYEN: "Công việc thường xuyên",
    };

    function apiUrl(path) {
        var base = qlnvBase();
        if (!base) return "";
        if (!path || path === "/") return base;
        if (path.indexOf("http") === 0) return path;
        if (path.charAt(0) === "?") return base + path;
        if (path.charAt(0) === "/") return base + path;
        return base + "/" + path;
    }

    var QLNV_TIMEOUT_MS = 30000;

    function qlnvHttpMessage(status, bodyMsg) {
        if (bodyMsg) return String(bodyMsg);
        var m = {
            400: "Yêu cầu không hợp lệ (400).",
            401: "Không có quyền / phiên hết hạn (401).",
            403: "Không có quyền truy cập (403).",
            404: "Không tìm thấy (404).",
            409: "Xung đột dữ liệu (409).",
            422: "Dữ liệu không hợp lệ (422).",
            500: "Lỗi máy chủ (500).",
            502: "Không kết nối được dịch vụ liên thông (502).",
            503: "Dịch vụ tạm gián đoạn (503).",
            504: "Hết thời gian chờ dịch vụ (504).",
        };
        return m[status] || "Lỗi HTTP " + status + ".";
    }

    // async function qlnvFetch(pathOrUrl, opts) {
    //     opts = opts || {};
    //     var url = apiUrl(pathOrUrl);
    //     if (!url) throw new Error('QLNV_API_BASE chưa cấu hình');
    //     var token = '';
    //     try { token = await getQlnvToken(); } catch (e) { token = ''; }

    //     function doFetch(tk) {
    //         var isForm = (typeof FormData !== 'undefined' && opts.body instanceof FormData);
    //         var headers = Object.assign(
    //             isForm ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
    //             opts.headers || {}
    //         );
    //         if (tk) headers.Authorization = 'Bearer ' + tk;
    //         var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    //         var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, opts.timeout || QLNV_TIMEOUT_MS) : null;
    //         var fetchOpts = Object.assign({}, opts, { headers: headers, credentials: 'omit', cache: 'no-store' });
    //         if (ctrl) fetchOpts.signal = ctrl.signal;
    //         return fetch(url, fetchOpts).finally(function () { if (timer) clearTimeout(timer); });
    //     }

    //     var r;
    //     try {
    //         r = await doFetch(token);
    //         if (r.status === 401 && token) {
    //             clearQlnvToken();
    //             try { token = await getQlnvToken({ force: true }); } catch (e) { token = ''; }
    //             r = await doFetch(token);
    //         }
    //     } catch (e) {
    //         if (e && e.name === 'AbortError') throw new Error('Hết thời gian chờ (timeout) khi gọi ' + (pathOrUrl || url));
    //         throw new Error('Lỗi mạng khi gọi ' + (pathOrUrl || url) + ': ' + ((e && e.message) || e));
    //     }

    //     var ct = r.headers.get('content-type') || '';
    //     var payload = null;
    //     if (ct.indexOf('json') >= 0) { try { payload = await r.json(); } catch (e) { payload = null; } }
    //     else { var t = await r.text(); payload = { raw: t }; }

    //     if (!r.ok) {
    //         var bodyMsg = payload && (payload.message || payload.error || (payload.errors ? String(payload.errors) : ''));
    //         var err = new Error(qlnvHttpMessage(r.status, bodyMsg) + (token ? '' : ' (thiếu Bearer token)'));
    //         err.status = r.status; err.body = payload;
    //         throw err;
    //     }
    //     return payload;
    // }

    async function qlnvFetch(pathOrUrl, opts) {
        opts = opts || {};
        var url = apiUrl(pathOrUrl);
        if (!url) throw new Error("QLNV_API_BASE chưa cấu hình");
        var token = "";
        try {
            token = await getQlnvToken();
        } catch (e) {
            token = "";
        }

        function doFetch(tk) {
            var isForm =
                typeof FormData !== "undefined" && opts.body instanceof FormData;
            var headers = Object.assign(
                isForm
                    ? { Accept: "application/json" }
                    : { Accept: "application/json", "Content-Type": "application/json" },
                opts.headers || {},
            );
            if (tk) headers.Authorization = "Bearer " + tk;
            var ctrl =
                typeof AbortController !== "undefined" ? new AbortController() : null;
            var timer = ctrl
                ? setTimeout(function () {
                    ctrl.abort();
                }, opts.timeout || QLNV_TIMEOUT_MS)
                : null;
            var fetchOpts = Object.assign({}, opts, {
                headers: headers,
                credentials: "omit",
                cache: "no-store",
            });
            if (ctrl) fetchOpts.signal = ctrl.signal;
            return fetch(url, fetchOpts).finally(function () {
                if (timer) clearTimeout(timer);
            });
        }

        var r;
        try {
            r = await doFetch(token);
            if (r.status === 401 && token) {
                clearQlnvToken();
                try {
                    token = await getQlnvToken({ force: true });
                } catch (e) {
                    token = "";
                }
                r = await doFetch(token);
            }
        } catch (e) {
            if (e && e.name === "AbortError")
                throw new Error(
                    "Hết thời gian chờ (timeout) khi gọi " + (pathOrUrl || url),
                );
            throw new Error(
                "Lỗi mạng khi gọi " +
                (pathOrUrl || url) +
                ": " +
                ((e && e.message) || e),
            );
        }

        var ct = r.headers.get("content-type") || "";
        var payload = null;
        if (ct.indexOf("json") >= 0) {
            try {
                payload = await r.json();
            } catch (e) {
                payload = null;
            }
        } else {
            var t = await r.text();
            payload = { raw: t };
        }

        if (!r.ok) {
            var bodyMsg =
                payload &&
                (payload.message ||
                    payload.error ||
                    (payload.errors ? String(payload.errors) : ""));
            var err = new Error(
                qlnvHttpMessage(r.status, bodyMsg) +
                (token ? "" : " (thiếu Bearer token)"),
            );
            err.status = r.status;
            err.body = payload;
            throw err;
        }
        return payload;
    }

    function mapDoKhanToPriority(doKhan) {
        var s = String(doKhan || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        if (/hoa toc|dac biet/.test(s)) return "3";
        if (/thuong khan/.test(s)) return "2";
        if (/khan/.test(s)) return "1";
        return "0";
    }

    function mapPriorityToDoKhan(priority) {
        var p = String(priority || "0");
        if (p === "3") return "Hỏa tốc";
        if (p === "2") return "Thượng khẩn";
        if (p === "1") return "Khẩn";
        return "Thường";
    }

    function toIsoDateTime(val) {
        if (!val) return null;
        if (typeof val === "string" && val.indexOf("T") >= 0) return val;
        var d = val instanceof Date ? val : new Date(val);
        if (isNaN(d.getTime())) return null;
        var pad = function (n) {
            return String(n).padStart(2, "0");
        };
        return (
            d.getFullYear() +
            "-" +
            pad(d.getMonth() + 1) +
            "-" +
            pad(d.getDate()) +
            "T00:00:00+07:00"
        );
    }

    function asArray(v) {
        return Array.isArray(v) ? v : v == null ? [] : [v];
    }

    function listSegment(seg, params) {
        params = params || {};
        var qs = [];
        qs.push(
            "limit=" + encodeURIComponent(params.limit != null ? params.limit : 200),
        );
        qs.push(
            "skip=" + encodeURIComponent(params.skip != null ? params.skip : 0),
        );
        if (params.sort) qs.push("sort=" + encodeURIComponent(params.sort));
        if (params.filter)
            qs.push(
                "filter=" +
                encodeURIComponent(
                    typeof params.filter === "string"
                        ? params.filter
                        : JSON.stringify(params.filter),
                ),
            );
        return qlnvFetch(
            "/quan-ly-nhiem-vu/" + seg + (qs.length ? "?" + qs.join("&") : ""),
        );
    }

    function getTask(id) {
        return qlnvFetch("/qlnv/" + encodeURIComponent(id));
    }
    function createTask(body) {
        return qlnvFetch("/qlnv", { method: "POST", body: JSON.stringify(body) });
    }
    function updateTask(id, body) {
        return qlnvFetch("/qlnv/" + encodeURIComponent(id), {
            method: "PUT",
            body: JSON.stringify(body),
        });
    }
    function deleteTasks(ids, content, deleteSub) {
        var payload = {
            ids: asArray(ids),
            content: content || "",
            delete_sub_task: !!deleteSub,
        };
        return qlnvFetch("/qlnv", {
            method: "DELETE",
            body: JSON.stringify(payload),
        });
    }

    function normalizeListResponse(res) {
        if (!res) return { items: [], total: 0, page: 1, limit: 20 };
        if (Array.isArray(res))
            return {
                items: res,
                total: res.length,
                page: 1,
                limit: res.length || 20,
            };
        var body =
            res.data &&
                !Array.isArray(res.data) &&
                (Array.isArray(res.data.data) || res.data.count != null)
                ? res.data
                : res;
        var items = Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.items)
                ? body.items
                : Array.isArray(res.data)
                    ? res.data
                    : [];
        var total =
            Number(
                body.count != null
                    ? body.count
                    : body.total != null
                        ? body.total
                        : items.length,
            ) || items.length;
        /* Cỡ trang: BE qlnvV2 trả `page_size` (xem qlnvV2.controller.js), KHÔNG phải `limit`.
               Đọc thiếu tên này là rơi về mặc định 20 dù BE đang chia trang cỡ khác.
               Tuyệt đối không suy từ items.length: trang cuối trả ít bản ghi hơn cỡ trang. */
        var limit = Number(body.page_size || body.pageSize || body.limit) || 20;
        var skip = Number(body.skip || 0);
        // var page = limit > 0 ? Math.floor(skip / limit) + 1 : 1;
        var page =
            Number(
                body.page != null
                    ? body.page
                    : res.page != null
                        ? res.page
                        : body.skip != null
                            ? Math.floor(Number(body.skip) / limit) + 1
                            : 1,
            ) || 1;
        return { items: items, total: total, page: page, limit: limit };
    }

    global.QlnvApi = {
        LOAI_NV_LABELS: LOAI_NV_LABELS,
        qlnvFetch: qlnvFetch,
        listSegment: listSegment,
        getTask: getTask,
        createTask: createTask,
        updateTask: updateTask,
        deleteTasks: deleteTasks,
        mapDoKhanToPriority: mapDoKhanToPriority,
        mapPriorityToDoKhan: mapPriorityToDoKhan,
        toIsoDateTime: toIsoDateTime,
        normalizeListResponse: normalizeListResponse,
        asArray: asArray,
    };
})(typeof window !== "undefined" ? window : global);

function setAppVh() {
    document.documentElement.style.setProperty(
        "--vh",
        window.innerHeight * 0.01 + "px",
    );
}
setAppVh();
window.addEventListener("resize", setAppVh);
window.addEventListener("orientationchange", setAppVh);

/* ============================================================
 * LUỒNG THỰC THI GỌI 4 API ĐỒNG THỜI (PROMISE.ALL)
 * ============================================================ */

// 🟢 CẤU HÌNH CÁC CHỈ SỐ METRICS THAM SỐ API (TẠI ĐÂY)

// 0. Giá trị mặc định cho URL API

/* Phạm vi lấy từ token, không phải từ URL (BE 2026-08-12): 3 API summary/get-task bỏ
   id/pageId/iddv/donvi/loaicap/loaicapcha/nguoi. Lãnh đạo thấy cả đơn vị, nhân viên chỉ
   thấy việc mình. Debug: GET /qlnv/v2/pham-vi.
   ⚠️ organization-structure / don-vi / can-bo / sub-task / detail KHÔNG đổi. */
const METRIC_API_CONFIG = {
    assigned: {
        segment: `qlnv/v2/giao/summary`,
    },
    received: {
        segment: `qlnv/v2/nhan/summary`,
    },
    // resultProcess: { segment: "quan-ly-nhiem-vu/dashboard/tong-hop/summary", limit: 10, skip: 0 },
    // docIn: { segment: "van-ban-den/sumry", limit: 10, skip: 0 },
    // docOut: { segment: "van-ban-di/sumry", limit: 10, skip: 0 },

    listAssigned: {
        segment: "qlnv/v2/get-task",
        limit: 10,
        skip: 0,
    },
    listReceived: {
        segment: "qlnv/v2/get-task",
        limit: 10,
        skip: 0,
    },
    // listDocIn: { segment: "van-ban-den/list-by-status", limit: 10, skip: 0 },
    // listDocOut: { segment: "van-ban-di/list-by-status", limit: 10, skip: 0 },
    // listResultProcess: { segment: "quan-ly-nhiem-vu/dashboard/tong-hop/list", limit: 10, skip: 0 },
};

// Biến lưu trữ kết quả toàn cục
window.metricsApiData = window.metricsApiData || {
    assigned: { total: 0, items: [], count: 0, tong: 0 },
    received: { total: 0, items: [], count: 0, tong: 0 },
    docIn: { total: 0, items: [], count: 0, tong: 0 },
    docOut: { total: 0, items: [], count: 0, tong: 0 },
    listAssigned: { total: 0, items: [] },
    listReceived: { total: 0, items: [] },
    listDocIn: { total: 0, items: [] },
    listDocOut: { total: 0, items: [] },
    resultProcess: { total: 0, items: [] },
    listResultProcess: { total: 0, items: [] },
};

// 1. Hàm lấy Auth Token (Có cache ngắn hạn)
let cachedTokenPromise = null;

/* /api/token của portal trả {access_token,...}; endpoint cũ /api-nest/qlnv/token trả
   {jwt_access_token} hoặc {token:{jwt_access_token}}; departments/tongquan lại trả thẳng
   string. Chỉ nhận chuỗi — fallback `|| authData` cũ nhét cả object vào header, sinh ra
   "Authorization: Bearer [object Object]" và mọi API trả 401. */
function qlnvPickToken(authData) {
    var s = function (v) { return (typeof v === 'string' && v) ? v : ''; };
    return s(authData && authData.access_token)
        || s(authData && authData.token && authData.token.jwt_access_token)
        || s(authData && authData.jwt_access_token)
        || s(authData && authData.data && authData.data.access_token)
        || s(authData && authData.token)
        || s(authData);
}

async function getTokenAuth(forceRefresh = false) {
    if (cachedTokenPromise && !forceRefresh) {
        return cachedTokenPromise;
    }

    cachedTokenPromise = (async () => {
        // Token SSO lấy thẳng từ portal (same-origin, cookie có sẵn). Trước đây đi qua
        // be_ioc_dash /api-nest/qlnv/token — endpoint đó mint JWT riêng của be_qlnv bằng
        // master API key, nay be_qlnv verify chữ ký token SSO nên không dùng được nữa.
        const url = resolveApiBase() + "/api/token";
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                credentials: "include", // 👈 Rất quan trọng nếu API xác thực qua Cookie/Session
                cache: "no-store",
            });

            console.log("response", response);

            if (!response.ok) {
                throw new Error(
                    `Lỗi HTTP khi lấy token! Trạng thái: ${response.status}`,
                );
            }

            const data = await response.json();
            console.log("Token thu được:", data);
            return data;
        } catch (error) {
            cachedTokenPromise = null; // Xóa cache promise nếu lỗi
            console.error("Lỗi khi lấy token:", error);
            throw error;
        }
    })();

    return cachedTokenPromise;
}

// 2. Hàm dùng chung để thực hiện fetch API
// Hàm phụ trợ kiểm tra JWT token đã hết hạn hay chưa
function isTokenExpired(token) {
    if (!token || typeof token !== "string") return true;
    try {
        const payloadBase64 = token.split(".")[1];
        if (!payloadBase64) return true;

        // Base64 decode hỗ trợ unicode & URL safe
        const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join(""),
        );

        const decoded = JSON.parse(jsonPayload);
        if (!decoded.exp) return false; // Không có trường exp thì coi như chưa hết hạn

        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp <= currentTime; // True nếu đã quá hạn
    } catch (e) {
        return true; // Nếu parse lỗi thì coi như token hỏng/hết hạn
    }
}

// Hàm lấy token mới từ getTokenAuth và cập nhật vào localStorage
async function refreshAndSaveToken() {
    const authData = await getTokenAuth();
    const newToken =
        qlnvPickToken(authData);

    if (newToken && typeof newToken === "string") {
        localStorage.setItem("qlnv_jwt_access_token", newToken);
    }
    return newToken;
}

async function fetchFromApi(
    { segment, limit = 10, skip = 0, params = {} },
    tokenOverride = null,
    isRetry = false, // Cờ tránh lặp vô tận nếu retry vẫn thất bại
) {
    try {
        let jwtToken = tokenOverride;

        // 1. Nếu không có tokenOverride, kiểm tra localStorage
        if (!jwtToken) {
            jwtToken = localStorage.getItem("qlnv_jwt_access_token");

            // 2. Nếu không có token hoặc token đã hết hạn -> gọi getTokenAuth()
            if (!jwtToken || isTokenExpired(jwtToken)) {
                console.warn(
                    `[${segment}] Token hết hạn hoặc không tồn tại. Đang lấy token mới...`,
                );
                jwtToken = await refreshAndSaveToken();
            }
        }

        const encodedSegment = encodeURI(segment);
        const baseUrl = window.urlAPI || "https://iochn.hanoi.dcs.vn:360/api";

        const query = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value == null) return;
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (item != null) query.append(key, item);
                });
            } else {
                query.set(key, value);
            }
        });

        const queryString = query.toString();
        const url = queryString
            ? `${baseUrl}/${encodedSegment}?${queryString}`
            : `${baseUrl}/${encodedSegment}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwtToken}`,
            },
        });

        // 3. Nếu API trả về 401 (Unauthorized) và chưa từng retry -> gọi getTokenAuth() và thử lại 1 lần
        if (response.status === 401 && !isRetry && !tokenOverride) {
            console.warn(
                `[${segment}] Server trả về 401. Đang làm mới token và thử lại...`,
            );
            const newToken = await refreshAndSaveToken();
            if (newToken) {
                return await fetchFromApi({ segment, limit, skip, params }, null, true);
            }
        }

        if (!response.ok) {
            /* Đọc `message` của BE để báo đúng việc cần làm, thay vì chỉ phơi mã số.
               Hai mã đáng chú ý từ 2026-08-12 (phạm vi lấy từ token):
                 401 -> token hỏng/hết hạn (đã thử làm mới ở trên mà vẫn 401) -> đăng nhập lại.
                 409 -> tài khoản CHƯA NỐI được sang danh bạ Bkav (thiếu bmmUserId / không có
                        trong dm_user / chưa gán đơn vị). KHÔNG PHẢI LỖI FE -> phải hiện nguyên
                        văn `message` để người dùng mang đi báo admin, đừng nuốt thành "lỗi tải". */
            let beMsg = "";
            try {
                const errBody = await response.json();
                beMsg = (errBody && (errBody.message || errBody.error)) || "";
            } catch (e) { }
            const err = new Error(
                response.status === 409
                    ? beMsg ||
                    "Tài khoản chưa được nối sang danh bạ Bkav — liên hệ quản trị hệ thống."
                    : response.status === 401
                        ? beMsg || "Phiên đăng nhập đã hết hạn — vui lòng đăng nhập lại."
                        : beMsg ||
                        `Lỗi HTTP! Trạng thái: ${response.status} khi gọi ${segment}`,
            );
            err.status = response.status;
            throw err;
        }

        const data = await response.json();
        console.log(`Kết quả fetch [${segment}]:`, data);
        return data;
    } catch (error) {
        console.error(`Lỗi khi fetch [${segment}]:`, error);
        throw error;
    }
}

// 3. Các hàm thực thi lẻ cho từng API
async function fetchApiAssigned(token) {
    return await fetchFromApi(
        {
            segment: METRIC_API_CONFIG.assigned.segment,
        },
        token,
    );
}
async function fetchApiReceived(token) {
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    const res = await fetchFromApi(
        {
            segment: METRIC_API_CONFIG.received.segment,
        },
        token,
    );
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", res);
    return res;
}
async function fetchApiDocIn(token) {
    return await fetchFromApi(
        {
            segment: METRIC_API_CONFIG.docIn.segment,
        },
        token,
    );
}
async function fetchApiDocOut(token) {
    return await fetchFromApi(
        {
            segment: METRIC_API_CONFIG.docOut.segment,
        },
        token,
    );
}

async function fetchApiListAssigned(token, limit = 30, skip = 0, params = {}) {
    return await fetchFromApi(
        {
            segment: METRIC_API_CONFIG.listAssigned.segment,
            limit,
            skip,
            params,
        },
        token,
    );
}
async function fetchApiListReceived(token, limit = 30, skip = 0, params = {}) {
    return await fetchFromApi(
        {
            segment: METRIC_API_CONFIG.listReceived.segment,
            limit,
            skip,
            params,
        },
        token,
    );
}

// Văn bản đến/đi lấy thẳng từ QLVB (xem fetchQlvbList), không qua be_qlnv.
async function fetchApiListDocIn(token, limit = 30, skip = 0, params = {}) {
    return await fetchQlvbList("den", params);
}
async function fetchApiListDocOut(token, limit = 30, skip = 0, params = {}) {
    return await fetchQlvbList("di", params);
}
async function fetchApiListResultProcess(
    token,
    limit = 30,
    skip = 0,
    params = {},
) {
    return await fetchFromApi(
        {
            segment: METRIC_API_CONFIG.listResultProcess.segment,
            limit,
            skip,
            params,
        },
        token,
    );
}
async function fetchApiResultProcess(token) {
    return await fetchFromApi(
        {
            segment: METRIC_API_CONFIG.resultProcess.segment,
        },
        token,
    );
}

async function fetchApiResultDuty(id) {
    return await fetchFromApi(
        {
            segment: `qlnv/${id}`,
        },
        token,
    );
}

// async function fetchApiChildDuty(token, id) {
//     return await fetchFromApi(
//         {
//             segment: `danh-sach-nhiem-vu/con-moi-full?parentId=${id}&isKichBan=false`,
//         },
//         token,
//     );
// }

async function fetchApiChildDuty(id) {
    return await fetchFromApi({
        segment: `danh-sach-nhiem-vu/con-moi?parentId=${id}`,
    });
}

async function fetchApiChildDone(id) {
    return await fetchFromApi({
        segment: `danh-sach-nhiem-vu/con-hoan-thanh?parentId=${id}`,
    });
}

async function fetchApiChildDoing(id) {
    return await fetchFromApi({
        segment: `danh-sach-nhiem-vu/con-dang-trien-khai?parentId=${id}`,
    });
}

/* Nhiệm vụ nhánh — route v2 `sub-task`: 1 REQUEST thay cho 3 route cũ
   (con-moi / con-hoan-thanh / con-dang-trien-khai) và KHÔNG cần Bearer token, nên
   bỏ luôn vòng refresh token mà 3 call cũ có thể cùng lúc kích khi JWT hết hạn.
   taskId truyền NGUYÊN VĂN giá trị lấy từ list: số (Bkav) hoặc chuỗi 24 hex
   (nhiệm vụ do xã/phường giao) — ép parseInt là hỏng.
   Route v2 trả field khác con-*, nên map lại về shape mà bảng nhánh đang đọc. */
var QLNV_SUBTASK_PAGE_LIMIT = 200;
/* Kết quả nhiệm vụ nhánh phải dùng được ở CẢ HAI kiểu truy cập đang tồn tại trong
   file: có chỗ đọc `r.subtasks.combinedData`, có chỗ gọi thẳng `r.subtasks.filter(...)`
   (lỗi "scoped.filter is not a function" khi trả object thuần). -> trả MẢNG và gắn
   thêm `combinedData` trỏ về chính nó. */
function makeSubtaskResult(items, duty) {
    var arr = Array.isArray(items) ? items : [];
    try {
        Object.defineProperty(arr, "combinedData", {
            value: arr,
            enumerable: false,
        });
        Object.defineProperty(arr, "duty", { value: duty, enumerable: false });
    } catch (e) {
        arr.combinedData = arr;
        arr.duty = duty;
    }
    return arr;
}
/* Trạng thái nhiệm vụ nhánh -> key chuẩn. Phải xét cụm PHỦ ĐỊNH trước vì
   "Chưa hoàn thành quá hạn" cũng chứa chữ "hoàn thành". */
function subtaskStatusKey(raw) {
    var s = String(raw || "")
        .trim()
        .toLowerCase();
    if (!s) return "doing";
    var chua = /ch(ư|u)a\s*(ho(à|a)n\s*th(à|a)nh|ht)|^cht\b/.test(s);
    /* "Đã hoàn thành quá hạn" = ĐÃ XONG (chỉ xong muộn) -> vẫn tính Hoàn thành; chỉ khi
       có cụm phủ định mới xét tiếp gần hạn/quá hạn. */
    if (!chua && /ho(à|a)n\s*th(à|a)nh|đã\s*xong/.test(s)) return "done";
    if (chua || /qu(á|a)\s*h(ạ|a)n/.test(s)) {
        if (/qu(á|a)\s*h(ạ|a)n/.test(s)) return "overdue";
        if (/g(ầ|a)n\s*h(ạ|a)n|s(ắ|a)p/.test(s)) return "soon";
        return "doing";
    }
    if (/s(ắ|a)p|g(ầ|a)n\s*h(ạ|a)n/.test(s)) return "soon";
    return "doing";
}
window.subtaskStatusKey = subtaskStatusKey;
function mapV2SubTaskItem(it, idx) {
    it = it || {};
    var pct = parseInt(String(it.tienDoHoanThanh || "").replace("%", ""), 10);
    return {
        id: it.soKyHieu || it.taskId || "NVN-" + String(idx + 1).padStart(2, "0"),
        taskId: it.taskId,
        noiDungNhiemVu: it.tenNhiemVu || "",
        // Bảng nhánh đọc s.units[0].unitId.name cho cột "Đơn vị nhận".
        units: [{ unitId: { name: it.donVi || it.donViPhoiHop || "--" } }],
        ngayHetHan: isoToApiDate(qlnvToDateInput(it.thoiHanHoanThanh)) || it.thoiHanHoanThanh || "",
        ngayBatDau: isoToApiDate(qlnvToDateInput(it.ngayBatDau)) || it.ngayBatDau || "",
        progress: isNaN(pct) ? undefined : pct,
        status: it.trangThai || "",
        nhomLinhVuc: it.nhomLinhVuc || "",
        _raw: it,
    };
}
async function fetchAllChildStatus(id) {
    /* KHÔNG có id thì DỪNG. Route cũ `con-*` bỏ qua `parentId` rỗng và trả về toàn bộ
       nhiệm vụ mới của đơn vị -> bảng nhánh hiện hàng chục dòng không liên quan. */
    if (!id && id !== 0) {
        console.warn("[QLNV] Thiếu taskId -> bỏ qua tải nhiệm vụ nhánh.");
        return makeSubtaskResult([], null);
    }
    try {
        const res = await fetchFromApi({
            segment: "qlnv/v2/sub-task",
            params: {
                taskId: id,
                page: 1,
                limit: QLNV_SUBTASK_PAGE_LIMIT,
            },
        });
        return makeSubtaskResult((res?.data || []).map(mapV2SubTaskItem), res);
    } catch (error) {
        /* v2 lỗi (route chưa deploy / mất mạng) -> lùi về 3 route cũ để không mất bảng
           nhiệm vụ nhánh, chấp nhận chậm hơn. */
        console.warn("[QLNV] sub-task v2 lỗi, lùi về route con-* cũ:", error);
        const [duty, done, doing] = await Promise.all([
            fetchApiChildDuty(id),
            fetchApiChildDone(id),
            fetchApiChildDoing(id),
        ]);
        return makeSubtaskResult(
            [...(done?.data || []), ...(doing?.data || [])],
            duty,
        );
    }
}

// 4. Helper Chuẩn hóa Dữ liệu
function normalizeData(res) {
    console.log("res res", res);
    if (
        typeof window.QlnvApi !== "undefined" &&
        typeof window.QlnvApi.normalizeListResponse === "function"
    ) {
        const normalized = window.QlnvApi.normalizeListResponse(res);
        // Bảo tồn object gốc nếu res chứa các trường đếm như 'tong'
        return typeof res === "object" && !Array.isArray(res)
            ? { ...res, ...normalized }
            : normalized;
    }

    if (Array.isArray(res)) {
        return {
            total: res.length,
            count: res.length,
            items: res,
            tong: res.length,
        };
    }

    if (typeof res === "object" && res !== null) {
        const dataRes = {
            ...res, // Giữ lại toàn bộ thuộc tính phẳng từ API như tong, hoanThanh, quaHan...
            total: res.tong ?? res.total ?? res.count ?? res.data?.length ?? 0,
            count: res.tong ?? res.count ?? res.total ?? res.data?.length ?? 0,
            items: res.data || res.items || [],
        };
        console.log("data res", dataRes);
        return {
            ...res, // Giữ lại toàn bộ thuộc tính phẳng từ API như tong, hoanThanh, quaHan...
            total: res.tong ?? res.total ?? res.count ?? res.data?.length ?? 0,
            count: res.tong ?? res.count ?? res.total ?? res.data?.length ?? 0,
            items: res.data || res.items || [],
        };
    }

    return { total: 0, count: 0, items: [], tong: 0 };
}

// Helper phụ trợ trích xuất số tổng
function extractTotal(obj, isSum) {
    if (!obj) return 0;
    console.log("obj", obj);

    // 1. Danh sách các trường cần cộng tổng (Ưu tiên số 1)
    const fieldsToSum = [
        obj.hoanThanh,
        obj.chuaHtTrongHan,
        obj.chuaHtGanHan,
        obj.chuaHtQuaHan,
    ];

    // Kiểm tra xem obj có chứa ít nhất một trong các trường trên không
    const hasStatusFields = fieldsToSum.some(
        (val) => val !== undefined && val !== null && val !== "",
    );

    if (hasStatusFields && isSum) {
        return fieldsToSum.reduce((sum, val) => sum + (Number(val) || 0), 0);
    }

    // 2. Nếu không có các trường trên mới dùng các trường fallback cũ
    return (
        obj.tong ??
        obj.total ??
        obj.count ??
        (Array.isArray(obj.items) ? obj.items.length : 0)
    );
}

// 5. Hàm điều phối tải 4 API Summary
/**
 * Nút "Đồng bộ BKAV": kéo nhiệm vụ MỚI của chính tài khoản đang đăng nhập từ
 * BKAV về datamart (BE: POST /qlnv/v2/dong-bo-bkav, phiên SSO cách C), rồi tải
 * lại số + danh sách để thấy ngay. Danh tính do BE suy từ token — KHÔNG gửi
 * username lên, tránh biến nút thành cửa đồng bộ hộ người khác.
 */
/**
 * Mở chi tiết nhiệm vụ TRÊN BKAV (deeplink, mục 6.2). Backend đổi task_id ->
 * task_user_id qua phiên SSO cách C rồi trả URL; FE chỉ window.open. Chỉ dùng
 * cho nhiệm vụ CÓ task_id BKAV (Ma số) — nhiệm vụ xã/phường (id Mongo 24-hex)
 * không có bên BKAV nên giữ drawer nội bộ (qlnvxOpenRecordDetail).
 */
window.moNhiemVuBkav = async function (taskId) {
    if (taskId == null || taskId === "") {
        if (typeof toast === "function") toast("Thiếu mã nhiệm vụ để mở");
        return;
    }
    try {
        const baseUrl = window.urlAPI || "https://iochn.hanoi.dcs.vn:360/api";
        const token = typeof assAccessToken === "function"
            ? await assAccessToken()
            : localStorage.getItem("qlnv_jwt_access_token");
        const res = await fetch(
            baseUrl + "/qlnv/v2/deeplink-bkav?taskId=" + encodeURIComponent(taskId),
            { headers: { Accept: "application/json", Authorization: "Bearer " + token } },
        );
        let body = {};
        try { body = await res.json(); } catch (e) { }
        if (!res.ok) {
            // 404: không có quyền xem HOẶC nhiệm vụ đã xoá (BKAV cố ý trả cùng câu).
            const msg = (body && (body.message || body.error))
                || ("Không mở được nhiệm vụ (" + res.status + ")");
            if (typeof toast === "function") toast(msg);
            return;
        }
        const url = body && body.data && body.data.url;
        if (url) window.open(url, "_blank");
        else if (typeof toast === "function") toast("Không lấy được đường dẫn nhiệm vụ trên BKAV");
    } catch (err) {
        if (typeof toast === "function") toast("Lỗi mở nhiệm vụ trên BKAV: " + err.message);
    }
};

window.dongBoBkav = async function (btn) {
    if (window.__dangDongBoBkav) return;
    window.__dangDongBoBkav = true;
    if (btn) { btn.disabled = true; btn.style.opacity = "0.5"; }
    try {
        const baseUrl = window.urlAPI || "https://iochn.hanoi.dcs.vn:360/api";
        const token = typeof assAccessToken === "function"
            ? await assAccessToken()
            : localStorage.getItem("qlnv_jwt_access_token");
        const res = await fetch(baseUrl + "/qlnv/v2/dong-bo-bkav", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        });
        let body = {};
        try { body = await res.json(); } catch (e) { }
        if (!res.ok) {
            let msg = (body && (body.message || body.error)) || "";
            if (res.status === 429) msg = "Bạn vừa đồng bộ — đợi một phút rồi thử lại.";
            else if (res.status === 409) msg = msg || "Tài khoản chưa nối được sang danh bạ BKAV — liên hệ quản trị.";
            else if (res.status === 401) msg = msg || "Phiên đăng nhập đã hết hạn — vui lòng đăng nhập lại.";
            throw new Error(msg || ("Đồng bộ thất bại (" + res.status + ")"));
        }
        if (typeof toast === "function") {
            toast("Đồng bộ BKAV: " + (body.soNhan || 0) + " nhận, " + (body.soGiao || 0)
                + " giao — ghi mới " + (body.soGhi || 0) + ", bỏ qua " + (body.soBoQua || 0) + " (ETL đã có).");
        }
        // Tải lại số (donut) + danh sách để phản ánh dữ liệu vừa ghi xuống datamart.
        if (typeof loadAll4MetricsData === "function") await loadAll4MetricsData();
        if (typeof loadAllListData === "function") await loadAllListData();
    } catch (err) {
        console.error("[Đồng bộ BKAV] lỗi:", err);
        if (typeof toast === "function") toast(err.message || "Đồng bộ BKAV thất bại.");
    } finally {
        window.__dangDongBoBkav = false;
        if (btn) { btn.disabled = false; btn.style.opacity = ""; }
    }
};

/* ============================================================
 * TÍCH HỢP TRỰC TIẾP API QLVB (https://iochn.hanoi.dcs.vn:361)
 * Gọi thẳng từ trình duyệt, KHÔNG qua proxy backend (theo yêu cầu).
 * Auth: Bearer SSO portal access_token — đã có sẵn trong localStorage
 * (khoá "access_token", được bootstrap ở authBootstrap.ts cho toàn app).
 * Nếu QLVB chưa bật CORS cho origin của dashboard này, fetch sẽ bị trình
 * duyệt chặn -> bắt lỗi, giữ nguyên số 0 cũ, không ảnh hưởng các thẻ khác.
 * ============================================================ */
var QLVB_API_BASE = window.QLVB_API_BASE || "https://iochn.hanoi.dcs.vn:361";
var QLVB_FILE_BASE = window.QLVB_FILE_BASE || "https://lgsp.dcs.vn/dhtn/1.0.0";

/* Bearer cho QLVB = `access_token` SSO của portal (authBootstrap/chatbotAuth lưu vào
   localStorage + sessionStorage). Chưa có -> getQlnvToken(): token còn hạn ở
   `qlnv_jwt_access_token`, hoặc tự gọi /api/token bằng cookie phiên.
   force (khi QLVB trả 401): bỏ qua token đang lưu, xin token mới từ /api/token. */
async function getQlvbAuthToken(force) {
    if (!force) {
        const stored =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");
        if (stored) return stored;
    }
    try {
        const t = await getQlnvToken({ force: !!force });
        if (t) return t;
    } catch (err) {
        console.warn("[QLVB] Không lấy được access_token qua /api/token:", err);
    }
    return localStorage.getItem("qlnv_jwt_access_token") || "";
}

/* GET tới QLVB kèm Bearer SSO. Mọi route QLVB trả envelope
   { success, data, metadata, timestamp, path, requestId }; lỗi trả
   { success:false, error:{ code, message } } -> ném Error với đúng message của BE. */
async function qlvbGet(path, params, isRetry) {
    const token = await getQlvbAuthToken(isRetry);
    if (!token) {
        throw new Error("Thiếu access_token (SSO) — vui lòng đăng nhập lại.");
    }
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v != null && v !== "") qs.set(k, v);
    });
    const q = qs.toString();
    const url = `${QLVB_API_BASE}${path}${q ? "?" + q : ""}`;
    console.info("[QLVB] GET", url);
    const res = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    // Token hết hạn/không hợp lệ -> xin token mới 1 lần rồi gọi lại.
    if (res.status === 401 && !isRetry) {
        return qlvbGet(path, params, true);
    }
    let body = null;
    try {
        body = await res.json();
    } catch (e) { }
    if (!res.ok || (body && body.success === false)) {
        const err = new Error(
            (body && body.error && body.error.message) ||
            `QLVB trả lỗi HTTP ${res.status} khi gọi ${path}`,
        );
        err.status = res.status;
        throw err;
    }
    return body;
}

/* orgId BẮT BUỘC với /van-ban/summary. Ưu tiên window.QLVB_ORG_ID (cấu hình của trang),
   không có thì lấy iocContext.primaryOrganizationId của /rbac/me — cùng nguồn đơn vị
   mà form giao việc đang dùng. Lỗi/không có -> không cache để lần sau thử lại. */
var __qlvbOrgIdP = null;
function getQlvbOrgId() {
    if (window.QLVB_ORG_ID != null && window.QLVB_ORG_ID !== "") {
        return Promise.resolve(window.QLVB_ORG_ID);
    }
    if (!__qlvbOrgIdP) {
        const base = window.QLNV_API_BASE || window.location.origin + "/api";
        __qlvbOrgIdP = fetch(base + "/rbac/me", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((me) => {
                const id = me && me.iocContext && me.iocContext.primaryOrganizationId;
                if (id == null || id === "") __qlvbOrgIdP = null;
                return id == null || id === "" ? null : id;
            })
            .catch(() => {
                __qlvbOrgIdP = null;
                return null;
            });
    }
    return __qlvbOrgIdP;
}

async function fetchQlvbSummary() {
    try {
        const orgId = await getQlvbOrgId();
        if (orgId == null) {
            console.warn("[QLVB] Chưa xác định được orgId — bỏ qua tải số văn bản.");
            return null;
        }
        const body = await qlvbGet("/api/v1/qlvb/van-ban/summary", { orgId });
        console.log("[QLVB] van-ban/summary raw:", body);
        return body;
    } catch (err) {
        // Thường gặp nhất là 401 (hết phiên), lỗi CORS hoặc mất mạng.
        console.warn("[QLVB] Không gọi được van-ban/summary:", err);
        return null;
    }
}

/* Chuẩn hoá response summary ({ data: { totalVbDen, totalVbDi, totalAll } }) về đúng
   shape { tong, total, count } mà extractTotal()/getDynamicMetricTotal() đang đọc. */
function normalizeQlvbSummary(body) {
    const d = (body && body.data) || {};
    const den = Number(d.totalVbDen) || 0;
    const di = Number(d.totalVbDi) || 0;
    /* Summary chỉ có tổng, không chia theo statusNumber -> banHanh/xoa lấy từ lần đếm gần nhất
       (countQlvbByStatus), rồi đếm lại ở nền; đếm xong refreshQlvbStatusCounts vẽ lại donut. */
    const cached = (window.__qlvbStatusCounts && window.__qlvbStatusCounts.counts) || {};
    refreshQlvbStatusCounts();
    return {
        docIn: { tong: den, total: den, count: den, banHanh: 0, xoa: 0, ...cached.docIn },
        docOut: { tong: di, total: di, count: di, banHanh: 0, xoa: 0, ...cached.docOut },
    };
}

/* Đếm văn bản theo statusNumber (1 = Ban hành, 0 = Xoá) từ danh sách /van-ban/{den|di}:
   tải đủ các trang (cùng orgId với summary, không lọc trục) rồi cộng dồn.
   BE có thể giới hạn `limit` -> trang đầu thử từ cỡ lớn xuống nhỏ; các trang sau tải theo
   lô QLVB_COUNT_CONCURRENCY request để không dồn vài chục request cùng lúc. */
var QLVB_COUNT_PAGE_SIZES = [200, 100, 50, 20];
var QLVB_COUNT_CONCURRENCY = 4;
async function countQlvbByStatus(kind, orgId) {
    const fetchPage = (page, limit) =>
        qlvbGet(`/api/v1/qlvb/van-ban/${kind}`, { orgId, page, limit });
    let first = null;
    let limit = 0;
    let lastErr = null;
    for (const size of QLVB_COUNT_PAGE_SIZES) {
        try {
            first = await fetchPage(1, size);
            limit = size;
            break;
        } catch (err) {
            lastErr = err;
            if (err && err.status === 401) throw err;
        }
    }
    if (!first) throw lastErr;
    const meta = first.metadata || {};
    const totalPages =
        Number(meta.totalPages) ||
        Math.ceil((Number(meta.totalItems) || 0) / (Number(meta.limit) || limit)) ||
        1;
    const bodies = [first];
    for (let p = 2; p <= totalPages; p += QLVB_COUNT_CONCURRENCY) {
        const batch = [];
        for (let q = p; q < p + QLVB_COUNT_CONCURRENCY && q <= totalPages; q++) {
            batch.push(fetchPage(q, limit));
        }
        bodies.push(...(await Promise.all(batch)));
    }
    const counts = { banHanh: 0, xoa: 0 };
    bodies.forEach((body) => {
        ((body && body.data && body.data.items) || []).forEach((item) => {
            const n = Number(item.statusNumber);
            if (n === 1) counts.banHanh += 1;
            else if (n === 0) counts.xoa += 1;
        });
    });
    console.info(`[QLVB] Đếm ${kind} theo trạng thái (limit=${limit}, ${totalPages} trang):`, counts);
    return counts;
}

/* Đếm lại tối đa 5 phút/lần cho mỗi orgId; đang đếm dở thì dùng chung promise. */
var QLVB_STATUS_COUNT_TTL = 5 * 60 * 1000;
function refreshQlvbStatusCounts() {
    const state = (window.__qlvbStatusCounts = window.__qlvbStatusCounts || {});
    if (state.pending) return state.pending;
    state.pending = (async () => {
        try {
            const orgId = await getQlvbOrgId();
            if (orgId == null) return;
            if (state.orgId === orgId && Date.now() - (state.at || 0) < QLVB_STATUS_COUNT_TTL) return;
            const [docIn, docOut] = await Promise.all([
                countQlvbByStatus("den", orgId),
                countQlvbByStatus("di", orgId),
            ]);
            Object.assign(state, { orgId, at: Date.now(), counts: { docIn, docOut } });
            const data = window.metricsApiData || {};
            if (data.docIn) Object.assign(data.docIn, docIn);
            if (data.docOut) Object.assign(data.docOut, docOut);
            if (typeof window.__qlnvRenderDrawerPie === "function") window.__qlnvRenderDrawerPie();
            if (typeof window.__qlnvRenderDrawerPieLegend === "function")
                window.__qlnvRenderDrawerPieLegend();
        } catch (err) {
            console.warn("[QLVB] Không đếm được văn bản theo trạng thái:", err);
        } finally {
            state.pending = null;
        }
    })();
    return state.pending;
}

// Trục của dashboard (axisMeta) <-> enum QlvbAxis của QLVB.
var QLVB_ROLE_TO_AXIS = { DANG: "DANG_UY", HDND: "HDND", UBND: "UBND", MTTQ: "MTTQ" };
var QLVB_AXIS_TO_ROLE = { DANG_UY: "DANG", HDND: "HDND", UBND: "UBND", MTTQ: "MTTQ" };

// "dd/mm/yyyy" (định dạng buildDrawerListFilterParams trả ra) -> "yyyy-mm-dd" cho QLVB.
// Bộ lọc drawer trả ngày dạng "dd/mm/yyyy" (isoToApiDate) hoặc để nguyên "yyyy-mm-dd" của
// <input type="date"> tuỳ trang -> nhận cả hai, trả "yyyy-mm-dd" cho QLVB.
function qlvbIsoDate(v) {
    const s = String(v || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
}
function qlvbDisplayDate(v) {
    if (!v) return "";
    return isoToApiDate(String(v).slice(0, 10)) || String(v);
}

/* Danh sách văn bản đến/đi: GET /api/v1/qlvb/van-ban/{den|di}.
   `params` là bộ lọc của drawer (buildDrawerListFilterParams + page/limit) -> đổi sang
   tham số QLVB. Trả về shape mà normalizeData()/renderDrawerFilterResults() đọc được. */
async function fetchQlvbList(kind, params = {}) {
    const titleEl = document.getElementById("drawerTitle");
    if (titleEl) {
        const unitName = window.__assMe && window.__assMe.unitName;
        titleEl.textContent =
            (kind === "den" ? "Văn bản đến" : "Văn bản đi") +
            (unitName ? " · Tài khoản: " + unitName : "");
    }
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const orgId = await getQlvbOrgId();
    const body = await qlvbGet(`/api/v1/qlvb/van-ban/${kind}`, {
        search: params.search,
        orgId: orgId == null ? undefined : orgId,
        axis: QLVB_ROLE_TO_AXIS[window.__drawerListRole] || undefined,
        page,
        limit,
        // buildDrawerListFilterParams đặt tên khoá khác nhau giữa các trang
        // (batDauTuNgay… ở btctw, batDauTu/hanTu… ở departments/communes-wards) -> đọc cả hai.
        promulgateDateFrom: qlvbIsoDate(params.batDauTuNgay ?? params.batDauTu),
        promulgateDateTo: qlvbIsoDate(params.batDauDenNgay ?? params.batDauDen),
        deadlineDateFrom: qlvbIsoDate(params.hanXuLyTuNgay ?? params.hanTu),
        deadlineDateTo: qlvbIsoDate(params.hanXuLyDenNgay ?? params.hanDen),
    });
    const items = (body && body.data && body.data.items) || [];
    const meta = (body && body.metadata) || {};
    let total = Number(
        meta.total ?? meta.totalItems ?? meta.count ?? meta.pagination?.total,
    );
    /* BE không trả tổng -> suy ra: trang chưa đầy là trang cuối, trang đầy thì cho phép
       bấm "Sau" thêm một trang. */
    if (!Number.isFinite(total)) {
        total = (page - 1) * limit + items.length + (items.length >= limit ? 1 : 0);
    }
    return { data: items, items, total, count: total, page, limit };
}

/* statusNumber của QLVB -> key trạng thái statusDoc: 0 = Xoá, 1 = Ban hành. */
var QLVB_STATUS_BY_NUMBER = { 0: "deleted", 1: "published" };

// Map 1 văn bản QLVB (VanBanListItem / VanBanDetail) sang shape `record` của dashboard.
function mapQlvbItemToRecord(item, metric) {
    return {
        id: String(item.documentId),
        documentId: item.documentId,
        numberDoc: item.code || item.registerNumber || "",
        code: item.code || item.registerNumber || "",
        role:
            QLVB_AXIS_TO_ROLE[item.axis] ||
            window.__drawerListRole ||
            currentRole ||
            "UBND",
        metric,
        status: QLVB_STATUS_BY_NUMBER[item.statusNumber] || "",
        title: item.title || "",
        summary: item.title || "",
        field: "",
        signer: item.signer || "",
        issuer: item.officeSender || "",
        /* Văn bản đến: đơn vị = cơ quan gửi; văn bản đi: đơn vị soạn thảo (createGroupName,
           vd. "Phòng Hành chính - Lưu trữ") — builtGroupName là cấp tổ chức, trùng issuer. */
        unit:
            metric === "docIn"
                ? item.officeSender || item.builtGroupName || ""
                : item.createGroupName || item.builtGroupName || item.officeSender || "",
        receiver: "",
        nguoiThucHien: "",
        // creatorName là văn thư nhập văn bản, không phải người giao việc.
        nguoiGiao: "",
        priority: item.priority || "Thường",
        created: qlvbDisplayDate(item.promulgateDate),
        due: qlvbDisplayDate(item.deadlineDate),
        registerNumber: item.registerNumber || "",
        securityLevel: item.stype || "",
        numberOfCopy: item.numberOfCopy ?? null,
        creatorName: item.creatorName || "",
        createGroupName: item.createGroupName || "",
        enteredAt: qlvbDisplayDateTime(item.createDate),
        syncedAt: qlvbDisplayDateTime(item.syncedAt),
        attachments: mapQlvbAttachments(item),
        progress: 0,
        __hasProgress: false,
        description: item.note || "",
        evidence: [],
        history: [],
        subtasks: [],
        _raw: { ...item, loaiVanBan: item.type || "" },
    };
}

// "2026-09-24T11:43:09" -> "24/09/2026 11:43"; chuỗi có múi giờ (syncedAt "...Z") đổi sang giờ máy.
function qlvbDisplayDateTime(v) {
    if (!v) return "";
    const s = String(v);
    const p = (n) => String(n).padStart(2, "0");
    if (/(Z|[+-]\d{2}:?\d{2})$/i.test(s.slice(10))) {
        const d = new Date(s);
        if (!isNaN(d)) {
            return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
        }
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(s);
    return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : qlvbDisplayDate(s);
}
function qlvbFileSize(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n < 1024) return n + " B";
    return n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(1) + " MB";
}
/* listAttachment = bản phát hành (PDF đã đóng dấu), listAttachTemplate = file gốc (.doc). */
function mapQlvbAttachments(item) {
    const pick = (list, kind) =>
        (Array.isArray(list) ? list : []).map((f) => ({
            id: f.fileAttachmentId,
            kind,
            fileName: f.fileName || "",
            filePath: f.filePath || "",
            storage: f.storage || "",
            fileSize: Number(f.fileSize) || 0,
        }));
    return [...pick(item.listAttachment, "release"), ...pick(item.listAttachTemplate, "template")];
}

/* Modal chi tiết văn bản QLVB. Link file = QLVB_API_BASE + filePath. */
window.QLVB_FILE_URL = (att) => (att && att.filePath ? `${QLVB_FILE_BASE}${att.filePath}` : "");
function qlvbDocDetailHtml(r, st, limited) {
    const raw = r._raw || {};
    const isIn = r.metric === "docIn";
    const hidden = "Ẩn theo phân quyền";
    const val = (v) => (v === null || v === undefined || v === "" ? "—" : esc(v));
    const kv = (label, v, cls) => `<b>${label}</b><span${cls ? ` class="${cls}"` : ""}>${v}</span>`;
    const fileUrl = typeof window.QLVB_FILE_URL === "function" ? window.QLVB_FILE_URL : null;
    const atts = r.attachments || [];
    const files = atts
        .map((f) => {
            const url = fileUrl ? fileUrl(f) : "";
            const name = url
                ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(f.fileName)}</a>`
                : esc(f.fileName);
            const size = qlvbFileSize(f.fileSize);
            return `<li style="margin:4px 0">📎 <span class="wrap">${name}</span><br><small>${f.kind === "release" ? "Bản phát hành" : "File gốc"}${size ? " · " + size : ""}</small></li>`;
        })
        .join("");
    const showUnit = !isIn || (r.unit && r.unit !== r.issuer);
    const info =
        kv("Loại", isIn ? "📨 Văn bản đến" : "📄 Văn bản đi") +
        kv("Số/ký hiệu", val(r.code), "mono") +
        kv("Số đăng ký", val(r.registerNumber), "mono") +
        kv("Trích yếu", val(r.title), "wrap") +
        kv("Loại văn bản", val(raw.loaiVanBan)) +
        kv("Độ khẩn", val(r.priority)) +
        kv("Độ mật", val(r.securityLevel)) +
        kv("Lãnh đạo ký", limited ? hidden : val(r.signer)) +
        kv("Cơ quan ban hành", val(r.issuer)) +
        (showUnit ? kv(isIn ? "Đơn vị gửi" : "Đơn vị soạn thảo", limited ? hidden : val(r.unit)) : "") +
        kv("Ngày ban hành", val(r.created), "mono") +
        kv("Hạn xử lý", val(r.due), "mono") +
        kv("Số bản", val(r.numberOfCopy)) +
        kv("Trạng thái", `<span style="color:${st.color}">${st.label}</span>`) +
        kv("Trạng thái xử lý", `<span style="color:${st.color}">${r.statusNumber === 0 ? "Đã xoá" : r.statusNumber === 1 ? "Ban hành" : val(r.statusNumber)}</span>`);
    const entry =
        kv("Người nhập", limited ? hidden : val(r.creatorName)) +
        (isIn ? kv("Đơn vị nhập", limited ? hidden : val(r.createGroupName)) : "") +
        kv("Ngày nhập", val(r.enteredAt), "mono") +
        kv("Đồng bộ lúc", val(r.syncedAt), "mono");
    const note = limited ? "Nội dung được che theo phân quyền." : esc(r.description || "") || "—";
    const fileBlock = limited
        ? `<p>${hidden}</p>`
        : files
            ? `<ul style="list-style:none;margin:6px 0 0;padding:0">${files}</ul>`
            : "<p>—</p>";
    return `<div class="detail-grid"><div class="detail-card"><h4>Thông tin văn bản</h4><div class="kv">${info}</div></div><div class="detail-card"><h4>Nhập liệu &amp; đính kèm</h4><div class="kv">${entry}</div><h4 style="margin-top:12px">Ghi chú</h4><p class="wrap">${note}</p><h4 style="margin-top:12px">File đính kèm (${limited ? 0 : atts.length})</h4>${fileBlock}<div class="action-bar"><button class="primary" onclick="openAssignmentFromDocument('${r.id}')">＋ Giao nhiệm vụ từ văn bản này</button><button class="ghost" onclick="openSyncLog('${r.id}')">Xem nhật ký đồng bộ</button><button class="ghost" onclick="toast('Đã gửi nhắc xử lý văn bản tới đơn vị: ${r.unit}')">Nhắc xử lý</button></div></div></div>`;
}

/* Bảng danh sách văn bản QLVB: cột theo đúng trường của VanBanListItem, thay cho bộ cột
   của nhiệm vụ (Người thực hiện/Người giao/Nhóm lĩnh vực — văn bản không có). */
function qlvbDocTableHead() {
    return `<thead>
          <tr>
            <th>STT</th>
            <th>Số ký hiệu</th>
            <th>Tiêu đề văn bản</th>
            <th class="col-unit">Đơn vị</th>
            <th>Người ký</th>
            <th class="col-field">Loại văn bản</th>
            <th>Ngày ban hành</th>
            <th>Hạn xử lý</th>
            <th>Trạng thái xử lý</th>
          </tr>
        </thead>`;
}
function qlvbDocRowHtml(r, stt) {
    const st = statusMeta(r.status, r.metric);
    const rowIdx = (currentDrawerRecords || []).indexOf(r);
    const ax = axisMeta[r.role] || { icon: "", name: "" };
    const kindLabel = r.metric === "docIn" ? "Văn bản đến" : "Văn bản đi";
    const urgent =
        r.priority && r.priority !== "Thường"
            ? ` · <b style="color:#ff6b6b">${esc(r.priority)}</b>`
            : "";
    return `<tr onclick="qlnvxOpenRecordDetailAt(${rowIdx >= 0 ? rowIdx : Number(stt) - 1},'${esc(r.id)}','${esc(r.__rowKey || "")}')">
              <td class="mono">${stt}</td>
              <td class="mono">${esc(r.numberDoc)}</td>
              <td><div class="title" title="${esc(r.title)}">${esc(r.title)}</div><small>${ax.icon} ${esc(ax.name)} · ${kindLabel}${urgent}</small></td>
              <td class="col-unit" title="${esc(r.unit || "")}"><div class="truncate-cell">${esc(r.unit || "")}</div></td>
              <td>${esc(r.signer || "")}</td>
              <td class="col-field" title="${esc(r._raw.loaiVanBan || "")}"><div class="truncate-cell">${esc(r._raw.loaiVanBan || "")}</div></td>
              <td class="mono" style="white-space: nowrap;">${r.created || ""}</td>
              <td class="mono" style="white-space: nowrap;">${r.due || "—"}</td>
              <td><span class="status-pill" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span></td>
        </tr>`;
}

// Vẽ lại các khối dùng metricsApiData (card tổng quan + donut trong drawer).
function renderSummaryWidgets() {
    if (typeof window.renderSummary === "function") {
        window.renderSummary();
    }
    if (typeof window.renderDrawerPie === "function") {
        window.renderDrawerPie();
    }
    if (typeof window.renderDrawerPieLegend === "function") {
        window.renderDrawerPieLegend();
    }
}

async function loadAll4MetricsData() {
    console.log("[API Controller] Đang tải dữ liệu 4 API Summary...");
    try {
        const authData = await getTokenAuth();
        const token =
            qlnvPickToken(authData);

        /* QLVB (văn bản đến/đi) chạy song song nhưng KHÔNG nằm trong Promise.all của giao/nhan:
           fetchQlvbSummary() phải gọi /rbac/me rồi mới gọi cross-origin sang QLVB (:361, có CORS
           preflight, không timeout) -> nếu gom chung, card nhiệm vụ giao/nhận phải đợi QLVB xong
           mới được vẽ dù summary đã về từ lâu. Về tới đâu vẽ tới đó. */
        const qlvbDone = fetchQlvbSummary().then((qlvbSummaryRes) => {
            const qlvbTotals = normalizeQlvbSummary(qlvbSummaryRes);
            window.metricsApiData.docIn = qlvbTotals.docIn;
            window.metricsApiData.docOut = qlvbTotals.docOut;
            renderSummaryWidgets();
        });

        const [assignedRes, receivedRes] = await Promise.all([
            // Lỗi 1 API không được kéo theo cả khối (vd. số văn bản QLVB đã về vẫn hiện 0).
            fetchApiAssigned(token).catch((err) => {
                console.error("[API Controller] Lỗi summary nhiệm vụ giao:", err);
                return null;
            }),
            // Lỗi 1 API không được kéo theo cả khối (vd. số văn bản QLVB đã về vẫn hiện 0).
            fetchApiReceived(token).catch((err) => {
                console.error("[API Controller] Lỗi summary nhiệm vụ nhan:", err);
                return null;
            }),
        ]);

        // Chuẩn hóa và gán dữ liệu
        window.metricsApiData.assigned = normalizeData(assignedRes);
        window.metricsApiData.received = normalizeData(receivedRes);

        console.log("[API Controller] Tải xong Summary nhiệm vụ! Dữ liệu đếm:", {
            assigned: extractTotal(window.metricsApiData.assigned, false),
            received: extractTotal(window.metricsApiData.received, false),
        });

        renderSummaryWidgets();

        await qlvbDone;
        return window.metricsApiData;
    } catch (err) {
        console.error(
            "[API Controller] Có lỗi phát sinh khi tải 4 API Summary:",
            err,
        );
    }
}

// 6. Hàm điều phối tải dữ liệu Danh sách (List)
async function loadAllListData() {
    console.log("[API Controller] Đang tải dữ liệu 2 API Danh sách...");
    try {
        const authData = await getTokenAuth();
        const token =
            qlnvPickToken(authData);

        const [listAssignedRes, listReceivedRes] = await Promise.all([
            fetchApiListAssigned(token),
            fetchApiListReceived(token),
        ]);

        window.metricsApiData.listAssigned = normalizeData(listAssignedRes);
        window.metricsApiData.listReceived = normalizeData(listReceivedRes);

        console.log("[API Controller] Tải xong Danh sách!");

        if (typeof window.renderList === "function") {
            window.renderList();
        }

        return {
            listAssigned: window.metricsApiData.listAssigned,
            listReceived: window.metricsApiData.listReceived,
        };
    } catch (err) {
        console.error("[API Controller] Lỗi khi tải dữ liệu Danh sách:", err);
    }
}

async function loadDetailDuty(id) {
    console.log("[API Controller] Đang tải Api nhiệm vụ");
    try {
        const { data } = await fetchApiResultDuty(id);
        console.log("[API Controller] Tải xong chi tiết nhiệm vụ!");
        return data;
    } catch (err) {
        console.error("[API Controller] Lỗi khi tải dữ liệu Danh sách:", err);
    }
}

async function loadChildDuty(id) {
    console.log("[API Controller] Đang tải Api nhiệm vụ");
    try {
        const { data } = await fetchApiChildDuty(id);
        console.log("[API Controller] Tải xong chi tiết nhiệm vụ!");
        return data;
    } catch (err) {
        console.error("[API Controller] Lỗi khi tải dữ liệu Danh sách:", err);
    }
}

async function loadChildDone(id) {
    console.log("[API Controller] Đang tải Api nhiệm vụ");
    try {
        const { data } = await fetchApiChildDone(id);
        console.log("[API Controller] Tải xong chi tiết nhiệm vụ!");
        return data;
    } catch (err) {
        console.error("[API Controller] Lỗi khi tải dữ liệu Danh sách:", err);
    }
}

async function loadChildDoing(id) {
    console.log("[API Controller] Đang tải Api nhiệm vụ");
    try {
        const { data } = await fetchApiChildDoing(id);
        console.log("[API Controller] Tải xong chi tiết nhiệm vụ!");
        return data;
    } catch (err) {
        console.error("[API Controller] Lỗi khi tải dữ liệu Danh sách:", err);
    }
}

/* ============================================================
 * 7. HÀM TÍNH TOÁN COUNT ĐỘNG DỰA TRÊN DỮ LIỆU API
 * ============================================================ */
function getDynamicMetricTotal(metricKey) {
    const data = window.metricsApiData || {};

    switch (metricKey) {
        case "assigned":
        case "gui-don-vi-cap-duoi":
            return extractTotal(data.assigned, false);

        case "received":
        case "moi":
            return extractTotal(data.received, false);

        case "docIn":
        case "van-ban-den":
            return extractTotal(data.docIn);

        case "docOut":
        case "van-ban-di":
            return extractTotal(data.docOut);

        default:
            return typeof metricTotalVisible === "function"
                ? metricTotalVisible(metricKey)
                : 0;
    }
}

// Khởi chạy khi DOM load xong
if (typeof window !== "undefined") {
    console.log(
        "[API Controller] Đã nạp Script, trạng thái DOM:",
        document.readyState,
    );

    // Bắt hàm thực thi an toàn
    var runMetrics = function () {
        console.log("[API Controller] Tiến hành gọi loadAll4MetricsData()...");
        loadAll4MetricsData();
        loadAllListData();
        // Danh mục dùng cho form giao nhiệm vụ (lĩnh vực/độ khẩn/loại nhiệm vụ/loại văn bản):
        // nạp sẵn ngay từ đầu để mở form là có luôn, khỏi phải vẽ lại form lần hai.
        if (typeof assLoadCrm === "function")
            assLoadCrm().then(function () {
                // Ghi đè S3103 bằng danh mục lĩnh vực của đơn vị — phải chạy SAU
                // assLoadCrm, nếu không CRM về sau sẽ ghi đè ngược lại.
                if (typeof assLoadLinhVuc === "function") return assLoadLinhVuc();
                return null;
            });
        // Hồ sơ người đăng nhập (tên + _id) cho trường "Người giao" khi tạo nhiệm vụ.
        if (typeof assLoadMe === "function") assLoadMe();
        if (typeof loadOrganizationUnitOptions === "function")
            loadOrganizationUnitOptions();
    };

    // Nếu DOM đã dựng xong (interactive / complete) -> Gọi ngay lập tức!
    if (
        document.readyState === "interactive" ||
        document.readyState === "complete"
    ) {
        console.log("[API Controller] DOM đã sẵn sàng từ trước -> Chạy ngay");
        runMetrics();
    } else {
        // Nếu DOM còn đang load -> Lắng nghe sự kiện DOMContentLoaded
        console.log(
            "[API Controller] DOM đang loading -> Chờ sự kiện DOMContentLoaded",
        );
        window.addEventListener("DOMContentLoaded", runMetrics);
    }
}

/* ============================================================
 * GIAO NHIỆM VỤ NHÁNH (nhiệm vụ con) — chốt sau cùng.
 * Các bản vá v14/v15 đã ghi đè qlnvxOpenSubTaskForm thành "chọn kịch bản xử lý" (mở ra một
 * loạt việc mẫu) — KHÔNG phải tạo nhiệm vụ con. Theo filev2 (openSubTaskFormOverview +
 * buildQlnvSubTaskBody), nút này phải mở FORM tạo 01 nhiệm vụ con của hồ sơ đang xem;
 * nút "⚡ Chọn kịch bản xử lý" mới là luồng tạo hàng loạt theo kịch bản.
 * ============================================================ */
(function () {
    window.qlnvxOpenSubTaskForm = function (id) {
        /* Tra NỚI LỎNG (qlnvFindRecord: so String + cache + dựng lại từ API) thay cho
           `x.id === id` — id đi qua chuỗi onclick luôn là string còn bản ghi có thể giữ số.
           Phương án cuối: `window.currentRecord` = bản ghi đang render trong modal, nên
           bấm từ chính màn chi tiết thì luôn có nhiệm vụ cha. */
        var r =
            (typeof qlnvFindRecord === "function" ? qlnvFindRecord(id) : null) ||
            (window.currentRecord &&
                String(window.currentRecord.id || "") === String(id || "")
                ? window.currentRecord
                : null) ||
            window.currentRecord ||
            null;
        if (!r) {
            console.warn("[QLNV] qlnvxOpenSubTaskForm không tra được nhiệm vụ cha", {
                idBam: id,
                idDangCo: (currentDrawerRecords || []).map(function (x) {
                    return x.id;
                }),
            });
            toast("Không tìm thấy nhiệm vụ cha để giao việc nhánh.");
            return;
        }
        var raw = r._raw || {};
        /* KẾ THỪA HỒ SƠ CHA (theo buildQlnvSubTaskBody của qlnv_v2): nhánh thuộc cùng hồ sơ
           với cha nên lĩnh vực / loại văn bản / độ khẩn / ngày văn bản lấy từ cha; chỉ tên
           việc, đơn vị nhận và hạn là nhập mới. Trước đây form nhánh mở ra TRỐNG TRƠN. */
        qlnvxOpenAssignmentForm({
            parent: {
                id: r.id, // = taskId, gửi nguyên văn lên parentId
                code: raw.soKyHieu || raw.code || r.numberDoc || r.id,
                title: r.title || "",
                field: r.field || raw.nhomLinhVuc || "",
                docType: raw.loaiVanBan || "",
                urgency:
                    (raw.doKhan && (raw.doKhan.title || raw.doKhan.name)) ||
                    (typeof raw.doKhan === "string" ? raw.doKhan : "") ||
                    r.priority ||
                    "",
                // Ngày bắt đầu/hạn của cha làm gợi ý; người giao vẫn sửa được.
                start: qlnvToDateInput(raw.ngayBatDau || raw.ngayChiDao || r.created),
                due: qlnvToDateInput(raw.thoiHanHoanThanh || raw.ngayHetHan || r.due),
                ngayVanBan: raw.ngayVanBan || "",
                capTrinh: raw.capTrinh || "1",
                raw: raw,
            },
        });
    };
})();

/* ============================================================
 * ÁP KỊCH BẢN Ở CHI TIẾT NHIỆM VỤ -> PHÁT HÀNH NHÁNH THẬT LÊN QLNV
 * (port từ applyScenarioTasksViaApi của block_cms_ioc/task/qlnv_v2.js).
 * TRƯỚC ĐÂY `applyScenarioTasks` của bản vá v15 chỉ `r.subtasks.push(...)` vào mảng
 * demo trong bộ nhớ -> bảng nhánh nhìn có vẻ đầy đủ, nhưng KHÔNG có POST nào, tải
 * lại trang là mất sạch và đơn vị nhận chẳng thấy việc nào.
 * Giờ mỗi việc đã tick = 1 POST /api/qlnv/v2/nhiem-vu (NHIEM_VU_CON + parentId),
 * dùng CHUNG assScenarioSubTaskBody với luồng chọn kịch bản lúc giao nhiệm vụ mới.
 * Đặt SAU mọi IIFE v14/v15 để thắng ở tầng gán hàm; tên cũng được đưa vào bộ giữ
 * hàm keepQlnvRenderFns bên dưới để block CMS nạp muộn không ghi đè lại.
 * ============================================================ */
(function () {
    /* Đơn vị nhận của nhiệm vụ CHA. Bản ghi từ route v2 chỉ có TÊN đơn vị (chuỗi), nên
       quy đổi sang id SỐ bằng cây organization-structure (đã nạp sẵn cho form giao việc).
       Không khớp -> trả "" để báo người dùng dùng form giao nhánh mà chọn tay. */
    function assOwnerUnitIdOfRecord(r) {
        var raw = (r && r._raw) || {};
        // Một số bản ghi có sẵn id số ở donViChuTri -> dùng luôn, khỏi dò tên.
        var direct = Array.isArray(raw.donViChuTri)
            ? raw.donViChuTri[0]
            : raw.donViChuTri;
        if (direct != null && /^\d+$/.test(String(direct))) return Number(direct);
        var name = raw.donVi || raw.donViChuTriName || (r && r.unit) || "";
        if (!name) return "";
        /* Tra trong TỪ ĐIỂN TOÀN HỆ THỐNG, KHÔNG phải cây phạm vi (__assOrg): nhiệm vụ mình
            NHẬN thì đơn vị chủ trì gần như luôn nằm NGOÀI phạm vi được cấp, tra trên cây phạm
            vi là trượt -> trả "" -> không tạo được nhánh. Từ điển nạp lười ở assLoadOrgDirectory. */
        var key = assNorm(name);
        var hit = (assOrgDirectory() || []).find(function (n) {
            return n && assNorm(n.name) === key;
        });
        return hit && hit.id != null ? assUnitIdForApi(hit.id) : "";
    }

    /* MÀN CHỌN KỊCH BẢN Ở CHI TIẾT — vẽ GIỐNG màn chọn kịch bản lúc giao nhiệm vụ.
       KHÁC BẢN v15 hai điểm, đúng như so sánh 2 ảnh:
       1) v15 LỌC kịch bản theo trạng thái hồ sơ (recordStatusKeys, file.js:8785) nên
          nhiệm vụ "Chưa HT trong hạn" chỉ còn 2 thẻ (slow + coordinate) — mất "xử lý quá
          hạn"/"thiếu dữ liệu". Ở đây hiện TẤT CẢ, gồm cả kịch bản người dùng tự tạo.
       2) Badge số nhánh của v15 dùng `.badge` trần nên bị cắt "5 nhiệm vụ nhánh g…";
          dùng lại đúng inline style của form (ép max-width/white-space) cho khỏi cắt. */
    window.openScenarioSelector = function (id) {
        var r = typeof qlnvFindRecord === "function" ? qlnvFindRecord(id) : null;
        if (!r && window.currentRecord) r = window.currentRecord;
        if (!r) {
            toast("Không tìm thấy nhiệm vụ để chọn kịch bản.");
            return;
        }
        var tpl =
            (typeof window.getScenarioTemplatesV15 === "function"
                ? window.getScenarioTemplatesV15()
                : null) ||
            window.__scenarioTemplates ||
            {};
        var st = statusMeta(r.status, r.metric);
        var raw = r._raw || {};
        var cards = Object.keys(tpl)
            .map(function (k) {
                var s = tpl[k] || {};
                return `<button class="scenario-card" data-scenario-key="${assEsc(k)}" data-fields="${(s.fields || []).join("|")}" onclick="selectScenario('${assEsc(id)}','${assEsc(k)}')"><div class="scenario-severity"><span class="badge ${s.level === "Khẩn" ? "red" : s.level === "Cao" ? "warn" : "ok"}">${assEsc(s.level)}</span><span class="badge" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3">📋 ${(s.tasks || []).length} nhiệm vụ nhánh</span></div><h4>${assEsc(s.title)}</h4><p>${assEsc(s.desc)}</p><ul>${(
                    s.sla || []
                )
                    .map(function (x) {
                        return `<li>${assEsc(x)}</li>`;
                    })
                    .join("")}</ul></button>`;
            })
            .join("");
        var fieldFilterBtns =
            '<button type="button" class="ghost active" data-field-filter onclick="scenarioFilterByField(\'__all__\', this)">Tất cả</button>' +
            window.qlnvScenarioLinhVucList()
                .map(function (lv) {
                    return `<button type="button" class="ghost" data-field-filter onclick="scenarioFilterByField('${lv}', this)">${lv}</button>`;
                })
                .join("");
        document.getElementById("modalTitle").textContent =
            "Chọn kịch bản xử lý trước khi giao nhiệm vụ nhánh";
        document.getElementById("modalSub").textContent =
            String(r.id) + " · " + (r.title || "");
        document.getElementById("modalBody").innerHTML =
            `<div class="scenario-history-badge"><b>Trạng thái hồ sơ chính:</b> <span style="color:${st.color}">${assEsc(raw.trangThai || st.label)}</span>${r.__hasProgress ? " · Tiến độ " + r.progress + "%" : ""} · Hạn ${assEsc(r.due || "—")}. Chọn 01 kịch bản để hệ thống đề xuất nhiệm vụ nhánh phù hợp.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('record','${assEsc(id)}')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="qlnvxOpenRecordDetail('${assEsc(id)}')">Quay lại hồ sơ chính</button></div><div class="scenario-field-filter">${fieldFilterBtns}</div><div class="scenario-grid">${cards}</div>`;
        openModal();
    };

    /* BƯỚC 2 của luồng kịch bản. Bản v15 tra bằng `getRecord()` — so `x.id === id` trong
       `currentDrawerRecords`/`records` và KHÔNG có cache. Bản ghi mở từ API có thể đã rời
       `currentDrawerRecords` (bộ lọc nạp lại) -> trả undefined rồi `return` IM LẶNG: bấm
       vào thẻ kịch bản không thấy gì xảy ra. Dùng cùng đường tra với openScenarioSelector. */
    window.selectScenario = function (id, key) {
        var r = typeof qlnvFindRecord === "function" ? qlnvFindRecord(id) : null;
        if (!r && window.currentRecord) r = window.currentRecord;
        var tplAll =
            (typeof window.getScenarioTemplatesV15 === "function"
                ? window.getScenarioTemplatesV15()
                : null) ||
            window.__scenarioTemplates ||
            {};
        var s = tplAll[key];
        if (!r) {
            toast("Không tra được nhiệm vụ để áp kịch bản.");
            return;
        }
        if (!s) {
            toast("Không tìm thấy kịch bản đã chọn.");
            return;
        }
        r.selectedScenario = key;
        document.getElementById("modalTitle").textContent =
            s.title + " · " + String(r.id);
        document.getElementById("modalSub").textContent =
            "Bước 2: chọn nhiệm vụ nhánh liên quan hoặc thêm nhiệm vụ nhánh mới";
        /* selectScenarioHtml nằm trong phạm vi riêng của IIFE v15 -> không gọi được từ đây.
           Dựng lại đúng bố cục: danh sách việc con tick sẵn + nút "Tạo các nhiệm vụ nhánh". */
        var tasks = (s.tasks || [])
            .map(function (t, i) {
                return `<label class="scenario-task"><input type="checkbox" data-scenario-task="${i}" checked/><span><b>${assEsc(t[0])}</b><small>${assEsc(t[1])}</small></span><span class="badge">${assEsc(t[2])}</span></label>`;
            })
            .join("");
        var sla = (s.sla || [])
            .map(function (x, i) {
                return `<div><b>Mốc ${i + 1}</b><span>${assEsc(x)}</span></div>`;
            })
            .join("");
        document.getElementById("modalBody").innerHTML =
            `<div class="scenario-detail-grid"><div class="detail-card"><h4>${assEsc(s.title)}</h4><p>${assEsc(s.desc)}</p><div class="scenario-route"><span>Hồ sơ chính</span><i>→</i><span>Kịch bản xử lý</span><i>→</i><span>Nhiệm vụ nhánh</span><i>→</i><span>Cập nhật tiến độ</span></div><div class="scenario-sla">${sla}</div><div class="action-bar" style="margin-top:12px"><button class="primary" onclick="applyScenarioTasks('${assEsc(id)}','${assEsc(key)}')">Tạo các nhiệm vụ nhánh đã chọn</button><button class="ghost" onclick="openScenarioSelector('${assEsc(id)}')">Chọn kịch bản khác</button><button class="ghost" onclick="qlnvxOpenRecordDetail('${assEsc(id)}')">Quay lại hồ sơ chính</button></div></div><div class="detail-card"><h4>Nhiệm vụ nhánh trong kịch bản</h4><div class="scenario-task-list">${tasks || '<div class="subtask-empty">Kịch bản chưa khai báo nhiệm vụ nhánh nào.</div>'}</div></div></div>`;
        openModal();
    };

    window.applyScenarioTasks = function (id, key) {
        var r = typeof qlnvFindRecord === "function" ? qlnvFindRecord(id) : null;
        if (!r && window.currentRecord) r = window.currentRecord;
        var tplAll =
            (typeof window.getScenarioTemplatesV15 === "function"
                ? window.getScenarioTemplatesV15()
                : null) ||
            window.__scenarioTemplates ||
            {};
        var s = tplAll[key];
        if (!r || !s) {
            toast("Không tra được nhiệm vụ cha hoặc kịch bản để tạo nhánh.");
            return;
        }
        var checked = Array.prototype.map.call(
            document.querySelectorAll("[data-scenario-task]:checked"),
            function (x) {
                return Number(x.dataset.scenarioTask);
            },
        );
        if (!checked.length) {
            toast("Chưa chọn nhiệm vụ nhánh nào.");
            return;
        }
        if (window.__assScenarioApplying) {
            toast("Đang phát hành nhiệm vụ nhánh, vui lòng đợi…");
            return;
        }
        var ownerId = assOwnerUnitIdOfRecord(r);
        if (!ownerId) {
            toast(
                'Không xác định được đơn vị nhận của nhiệm vụ cha — dùng "＋ Giao nhiệm vụ nhánh" để chọn đơn vị.',
            );
            return;
        }
        var leaderId = assCurrentUserId();
        if (!leaderId) {
            toast("Chưa xác định được tài khoản đăng nhập, thử tải lại trang.");
            return;
        }
        var myUnit = assCurrentUnitId();
        if (myUnit == null) {
            toast("Chưa xác định được đơn vị của tài khoản, thử lại sau giây lát.");
            assLoadMyScope();
            return;
        }
        var raw = r._raw || {};
        var items = checked
            .map(function (i) {
                return s.tasks[i];
            })
            .filter(Boolean);
        window.__assScenarioApplying = true;
        toast("Đang phát hành " + items.length + " nhiệm vụ nhánh theo kịch bản…");
        Promise.all(
            items.map(function (t) {
                return assCreateTaskV2(
                    assScenarioSubTaskBody({
                        parentId: r.id,
                        leaderId: leaderId,
                        myUnit: myUnit,
                        giver: assCurrentUserName(),
                        ownerId: ownerId,
                        // Tên đơn vị trong template chỉ là NHÃN -> hiển thị tên đơn vị nhận của cha.
                        ownerLabel: raw.donVi || raw.donViChuTriName || r.unit || null,
                        title: t[0],
                        description: t[1] || t[0],
                        // Ngày kế thừa của cha; template không có ngày thật.
                        startDate: qlnvToDateInput(raw.ngayBatDau || raw.ngayChiDao),
                        dueDate: qlnvToDateInput(
                            raw.thoiHanHoanThanh || raw.ngayHetHan || r.due,
                        ),
                        field: r.field || raw.nhomLinhVuc || "",
                        docType: raw.loaiVanBan || "",
                    }),
                ).then(
                    function () {
                        return true;
                    },
                    function (err) {
                        console.warn("[QLNV] Nhánh kịch bản lỗi:", t[0], err);
                        return false;
                    },
                );
            }),
        ).then(function (results) {
            window.__assScenarioApplying = false;
            var ok = results.filter(Boolean).length;
            toast(
                ok === items.length
                    ? "Đã phát hành " + ok + " nhiệm vụ nhánh theo kịch bản."
                    : "Phát hành nhánh: " +
                    ok +
                    "/" +
                    items.length +
                    " thành công (một số nhánh lỗi).",
            );
            r.selectedScenario = key;
            // Mở lại hồ sơ cha -> bảng nhánh nạp lại từ /qlnv/v2/sub-task, thấy nhánh vừa tạo.
            qlnvxOpenRecordDetail(r.id);
        });
    };
})();

/* ============================================================
 * CHIẾM TÊN `openAssignmentForm` — nút "Giao nhiệm vụ" KHÔNG do file này vẽ.
 *
 * Đo trên trang thật (view 58): CMS gộp mọi block thành 1 file `cms/view/58/qlnv_v2.js`,
 * và cụm thẻ pie ở mục 1 do BLOCK KHÁC render, nên markup nút là:
 *     [...document.querySelectorAll('button')]…getAttribute('onclick')  ->  ['openAssignmentForm()']
 * Tức file này thua ở tầng RENDER chứ không phải tầng hàm: guard bên dưới giành lại
 * `qlnvxOpenAssignmentForm` vẫn đúng, nhưng nút không gọi tên đó nên vô tác dụng.
 *
 * -> Cho `openAssignmentForm` trỏ thẳng vào form của file này. Bất kể block nào vẽ nút,
 *    bấm vào là mở form đúng. Đặt TRƯỚC keepQlnvRenderFns để guard chụp được và giành
 *    lại mỗi khi block kia nạp muộn rồi gán đè.
 * ============================================================ */
window.openAssignmentForm = function (source, skipReset, restoreState) {
    /* Bản cũ gọi bằng nhiều dạng: openAssignmentForm(), openAssignmentForm('docIn'),
       openAssignmentForm(source, skipReset, restoreState). Form của file này nhận 01
       object opts -> chỉ chuyển tiếp khi đúng kiểu object, còn lại mở form trắng.
       Truyền thẳng chuỗi 'docIn' vào sẽ thành opts='docIn' (opts.parent/.restore đều
       undefined) — chạy được nhưng dựa vào may rủi, nên chặn tường minh. */
    var opts =
        source && typeof source === "object" && !Array.isArray(source)
            ? source
            : {};
    if (restoreState && typeof restoreState === "object")
        opts.restore = restoreState;
    if (skipReset === true) opts.keepSelection = true;
    return qlnvxOpenAssignmentForm(opts);
};

/* ============================================================
 * GIỮ BẢN RENDER CHI TIẾT CỦA FILE NÀY — chống bị block khác ghi đè.
 * Trang CMS có thể nạp song song bản qlnv_v2 cũ (action bar 4 nút: Giao nhiệm vụ nhánh /
 * Xem nhật ký đồng bộ / Nhắc việc / Báo cáo vượt cấp, bảng thông tin có "Người nhận").
 * Hai bản cùng khai báo `qlnvxRenderRecordDetail`/`qlnvxOpenRecordDetail` ở phạm vi GLOBAL -> block
 * nào nạp SAU thì thắng, nên chi tiết nhiệm vụ vẫn hiện bộ nút cũ dù file này đã đúng.
 *
 * KHÔNG dùng defineProperty(writable:false) để khoá: khai báo `function qlnvxRenderRecordDetail`
 * ở script nạp sau sẽ ném TypeError và làm chết cả block đó.
 * -> Giữ tham chiếu bản của file này rồi GIÀNH LẠI sau mỗi mốc script khác có thể nạp xong.
 * ============================================================ */

/* Các hàm mở màn kịch bản đều vẽ đồng bộ từ templates(), mà templates() giờ đọc cache
   nạp từ API -> phải nạp xong mới cho vẽ, nếu không lần mở đầu tiên sẽ ra lưới rỗng.
   Bọc ở đây chứ không bọc sau khối keepQlnvRenderFns bên dưới: khối đó chụp lại bản hàm
   tại thời điểm chạy rồi khôi phục định kỳ, bọc sau sẽ bị nó ghi đè mất. */
(function wrapScenarioEntryPoints() {
    var NAMES = [
        "assOpenScenarioPicker",
        "openScenarioSelector",
        "openIndicatorScenarioSelector",
        "openScenarioCreateForm",
    ];
    NAMES.forEach(function (name) {
        var orig = window[name];
        if (typeof orig !== "function") return;
        window[name] = function () {
            var self = this;
            var args = arguments;
            if (window.__scenarioLoaded) return orig.apply(self, args);
            /* Nạp danh mục lĩnh vực theo đơn vị TRƯỚC, rồi mới nạp kịch bản — KHÔNG chạy
               song song: chính lượt gọi /rbac/me đó mới có id đơn vị, mà danh sách kịch
               bản lại phải kèm ?organizationId= thì BE mới trả kịch bản của đơn vị mình.
               Chạy song song thì lần mở đầu tiên chỉ thấy 5 kịch bản mặc định. */
            return (typeof window.qlnvLoadScenarioLinhVuc === "function"
                ? window.qlnvLoadScenarioLinhVuc()
                : Promise.resolve())
                .then(function () {
                    return window.scenarioLoadAll();
                })
                .then(function () {
                    return orig.apply(self, args);
                })
                .catch(function (err) {
                    console.error("[QLNV] Không nạp được kịch bản:", err);
                    if (typeof toast === "function")
                        toast("Không tải được danh sách kịch bản: " + err.message);
                });
        };
    });
})();

(function keepQlnvRenderFns() {
    if (typeof window === "undefined") return;
    var NAMES = [
        "qlnvxRenderRecordDetail",
        "qlnvxOpenRecordDetail",
        "qlnvxSubtaskStatsHtmlGd",
        "qlnvxV14SubtaskStatsHtml",
        // Nút "＋ Giao nhiệm vụ nhánh": bản v14/v15 (và block cũ) đổi hàm này thành
        // "chọn kịch bản xử lý" -> phải giữ bản mở FORM tạo nhiệm vụ con của file này.
        "qlnvxOpenSubTaskForm",
        "qlnvxOpenAssignmentForm",
        "qlnvxCreateAssignment",
        /* Áp kịch bản ở chi tiết nhiệm vụ: bản v15 (và block cũ) chỉ push vào mảng demo,
           bản của file này POST thật lên /qlnv/v2/nhiem-vu -> phải giữ. */
        "applyScenarioTasks",
        // Màn chọn kịch bản ở chi tiết: bản v15 lọc bớt thẻ + cắt chữ badge.
        "openScenarioSelector",
        /* Bước 2 của kịch bản: bản v15 tra bằng getRecord() nên bấm thẻ kịch bản có thể
           không phản hồi gì với bản ghi đến từ API. */
        "selectScenario",
        /* Tên của bản cũ, đã trỏ về form file này ngay phía trên. Nút do block khác vẽ gọi
           đúng tên này -> phải giành lại, nếu không block kia nạp muộn sẽ gán đè lại. */
        "openAssignmentForm",
    ];
    var mine = {};
    NAMES.forEach(function (n) {
        if (typeof window[n] === "function") mine[n] = window[n];
    });
    function reclaim(reason) {
        Object.keys(mine).forEach(function (n) {
            if (window[n] !== mine[n]) {
                console.warn(
                    "[QLNV] " + n + " bị block khác ghi đè -> giành lại (" + reason + ")",
                );
                window[n] = mine[n];
            }
        });
    }
    // Các mốc mà script/block khác có thể vừa nạp xong và ghi đè.
    [0, 300, 1000, 3000].forEach(function (ms) {
        setTimeout(function () {
            reclaim("t+" + ms + "ms");
        }, ms);
    });
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", function () {
            reclaim("DOMContentLoaded");
        });
    window.addEventListener("load", function () {
        reclaim("window.load");
    });
    /* CÁC MỐC CỐ ĐỊNH LÀ CHƯA ĐỦ: block CMS có thể nạp SAU window.load (lazy/chèn động),
       lúc đó nó ghi đè và không còn ai giành lại -> chi tiết nhiệm vụ hiện lại bộ nút cũ.
       Thêm 2 lưới an toàn:
       1) Giành lại ngay TRƯỚC mỗi cú bấm (capture=true chạy trước handler inline của dòng
          danh sách / nút), nên hàm được gọi luôn là bản của file này.
       2) Quét định kỳ trong 60s đầu để bắt block nạp muộn ngay cả khi người dùng chưa bấm. */
    document.addEventListener(
        "click",
        function () {
            reclaim("trước khi bấm");
        },
        true,
    );
    var __reclaimTicks = 0;
    var __reclaimTimer = setInterval(function () {
        reclaim("quét định kỳ");
        if (++__reclaimTicks >= 60) clearInterval(__reclaimTimer);
    }, 1000);
    // Mở chi tiết lúc nào cũng dùng bản của file này, kể cả khi bị đè ngoài các mốc trên.
    window.qlnvReclaimRenderFns = reclaim;
})();
