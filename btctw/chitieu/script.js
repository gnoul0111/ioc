/**
 * Block indicators — paste TOÀN BỘ file này vào tab JS của CMS (1 file duy nhất).
 * Đã gộp sẵn lớp IOC API (iocApi.js).
 *
 * API mặc định: https://administrator.lifetex.vn:325/api/v1/ioc/dashboards
 * Ghi đè: window.IOC_API_BASE = '...' trước khi script chạy (tuỳ chọn).
 */
// window.TYPE = window.TYPE || 'so';
window.TYPE = window.TYPE || 'xa_phuong';
window.TYPE_FILTER = window.TYPE_FILTER || 'phuong_viet_hung';
window.IOC_API_KEY = window.IOC_API_KEY || 'dev-api-key-001';
window.Name = window.Name || 'Sở tư pháp';

const hideIndicatorFilters = new URLSearchParams(window.location.search).get('hideFilters') === '1';

const data_tabs = {
    "tabs": [
        { "code": "tat_ca", "name": "Tất cả" },
        { "code": "lanh_dao_ban", "name": "Lãnh đạo ban" },
        { "code": "dang_uy_co_quan", "name": "Đảng ủy cơ quan" },
        { "code": "tieu_ban_bvctnb_tw", "name": "Tiểu ban BVCTNB TW" },
        { "code": "thuong_truc_bcd_kl39", "name": "Thường trực BCĐ KL39" },
        { "code": "vu_to_chuc_dieu_le", "name": "Vụ Tổ chức - Điều lệ" },
        { "code": "vu_co_so_dang_dang_vien", "name": "Vụ Cơ sở đảng, đảng viên" },
        { "code": "vu_can_bo", "name": "Vụ Cán bộ" },
        { "code": "vu_chinh_sach_can_bo", "name": "Vụ Chính sách cán bộ" },
        { "code": "vu_dia_phuong_i", "name": "Vụ Địa phương I" },
        { "code": "vu_dia_phuong_ii", "name": "Vụ Địa phương II" },
        { "code": "vu_dia_phuong_iii", "name": "Vụ Địa phương III" },
        { "code": "vu_cac_ban_bo_nganh", "name": "Vụ Các ban, bộ, ngành, đoàn thể ở Trung ương" },
        { "code": "vu_nghien_cuu_khoa_hoc", "name": "Vụ Nghiên cứu Khoa học tổ chức, cán bộ" },
        { "code": "cuc_dao_tao_boi_duong", "name": "Cục đào tạo bồi dưỡng cán bộ" },
        { "code": "cuc_bao_ve_chinh_tri", "name": "Cục bảo vệ chính trị nội bộ" },
        { "code": "van_phong_ban", "name": "Văn phòng ban" },
        { "code": "hoi_cuu_chien_binh", "name": "Hội Cựu chiến binh cơ quan" },
        { "code": "doan_thanh_nien", "name": "Đoàn Thanh niên cơ quan" },
        { "code": "ban_chi_dao_thuc_hien", "name": "Ban Chỉ đạo thực hiện các chương trình" }
    ]
}

const data_dashboard = {
    "data": [
        {
            "_id": "chart_lanh_dao_ban",
            "charts": [],
            "titleDashboard": "LÃNH ĐẠO BAN",
            "description": "Các chỉ tiêu liên quan đến Lãnh đạo ban.",
            "_parent_id": "lanh_dao_ban"
        },
        {
            "_id": "chart_dang_uy",
            "charts": [],
            "titleDashboard": "ĐẢNG ỦY CƠ QUAN",
            "description": "Các chỉ tiêu của Đảng ủy cơ quan.",
            "_parent_id": "dang_uy_co_quan"
        },
        {
            "_id": "chart_tieu_ban",
            "charts": [],
            "titleDashboard": "TIỂU BAN BVCTNB TW",
            "description": "Các chỉ tiêu của Tiểu ban.",
            "_parent_id": "tieu_ban_bvctnb_tw"
        },
        {
            "_id": "chart_thuong_truc",
            "charts": [],
            "titleDashboard": "THƯỜNG TRỰC BCĐ KL39",
            "description": "Các chỉ tiêu Thường trực BCĐ KL39.",
            "_parent_id": "thuong_truc_bcd_kl39"
        },
        {
            "_id": "chart_vu_to_chuc",
            "charts": [],
            "titleDashboard": "VỤ TỔ CHỨC - ĐIỀU LỆ",
            "description": "Các chỉ tiêu Vụ Tổ chức - Điều lệ.",
            "_parent_id": "vu_to_chuc_dieu_le"
        },
        {
            "_id": "chart_vu_co_so_dang",
            "charts": [],
            "titleDashboard": "VỤ CƠ SỞ ĐẢNG, ĐẢNG VIÊN",
            "description": "Các chỉ tiêu Vụ Cơ sở đảng, đảng viên.",
            "_parent_id": "vu_co_so_dang_dang_vien"
        },
        {
            "_id": "chart_vu_can_bo",
            "charts": [],
            "titleDashboard": "VỤ CÁN BỘ",
            "description": "Các chỉ tiêu Vụ Cán bộ.",
            "_parent_id": "vu_can_bo"
        },
        {
            "_id": "chart_vu_chinh_sach_can_bo",
            "charts": [],
            "titleDashboard": "VỤ CHÍNH SÁCH CÁN BỘ",
            "description": "Các chỉ tiêu Vụ Chính sách cán bộ.",
            "_parent_id": "vu_chinh_sach_can_bo"
        },
        {
            "_id": "chart_vu_dia_phuong_i",
            "charts": [],
            "titleDashboard": "VỤ ĐỊA PHƯƠNG I",
            "description": "Các chỉ tiêu Vụ Địa phương I.",
            "_parent_id": "vu_dia_phuong_i"
        },
        {
            "_id": "chart_vu_dia_phuong_ii",
            "charts": [],
            "titleDashboard": "VỤ ĐỊA PHƯƠNG II",
            "description": "Các chỉ tiêu Vụ Địa phương II.",
            "_parent_id": "vu_dia_phuong_ii"
        },
        {
            "_id": "chart_vu_dia_phuong_iii",
            "charts": [],
            "titleDashboard": "VỤ ĐỊA PHƯƠNG III",
            "description": "Các chỉ tiêu Vụ Địa phương III.",
            "_parent_id": "vu_dia_phuong_iii"
        },
        {
            "_id": "chart_vu_cac_ban",
            "charts": [],
            "titleDashboard": "VỤ CÁC BAN, BỘ, NGÀNH...",
            "description": "Các chỉ tiêu Vụ Các ban, bộ, ngành, đoàn thể ở Trung ương.",
            "_parent_id": "vu_cac_ban_bo_nganh"
        },
        {
            "_id": "chart_vu_nghien_cuu",
            "charts": [],
            "titleDashboard": "VỤ NGHIÊN CỨU KHOA HỌC",
            "description": "Các chỉ tiêu Vụ Nghiên cứu Khoa học tổ chức, cán bộ.",
            "_parent_id": "vu_nghien_cuu_khoa_hoc"
        },
        {
            "_id": "chart_cuc_dao_tao",
            "charts": [],
            "titleDashboard": "CỤC ĐÀO TẠO BỒI DƯỠNG CÁN BỘ",
            "description": "Các chỉ tiêu Cục đào tạo bồi dưỡng cán bộ.",
            "_parent_id": "cuc_dao_tao_boi_duong"
        },
        {
            "_id": "chart_cuc_bao_ve",
            "charts": [],
            "titleDashboard": "CỤC BẢO VỆ CHÍNH TRỊ NỘI BỘ",
            "description": "Các chỉ tiêu Cục bảo vệ chính trị nội bộ.",
            "_parent_id": "cuc_bao_ve_chinh_tri"
        },
        {
            "_id": "chart_van_phong_ban",
            "charts": [],
            "titleDashboard": "VĂN PHÒNG BAN",
            "description": "Các chỉ tiêu Văn phòng ban.",
            "_parent_id": "van_phong_ban"
        },
        {
            "_id": "chart_hoi_ccb",
            "charts": [],
            "titleDashboard": "HỘI CỰU CHIẾN BINH CƠ QUAN",
            "description": "Các chỉ tiêu Hội Cựu chiến binh cơ quan.",
            "_parent_id": "hoi_cuu_chien_binh"
        },
        {
            "_id": "chart_doan_thanh_nien",
            "charts": [],
            "titleDashboard": "ĐOÀN THANH NIÊN CƠ QUAN",
            "description": "Các chỉ tiêu Đoàn Thanh niên cơ quan.",
            "_parent_id": "doan_thanh_nien"
        },
        {
            "_id": "chart_ban_chi_dao",
            "charts": [],
            "titleDashboard": "BAN CHỈ ĐẠO THỰC HIỆN CÁC CHƯƠNG TRÌNH",
            "description": "Các chỉ tiêu Ban Chỉ đạo thực hiện các chương trình.",
            "_parent_id": "ban_chi_dao_thuc_hien"
        }
    ]
}
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('widgetTitle').textContent = '🗺️ BẢN ĐỒ GIS – ' + (window.Name || 'Sở Giáo dục và Đào tạo') + ' · Công trình · Phản ánh · Trụ sở';
})

let iapiDonutSegmentClick = null;
let icatChartBox = null;
let cardInfo = null;
let roleInfoApi = {}

let actionChart = null;
let infoCards = {};
let showCards = {};
let _itemsKey = {};
(function initIocApiConfig() {
    if (typeof window === 'undefined') return;
    var base = window.IOC_API_BASE;
    if (base === undefined || base === null || String(base).trim() === '') {
        // window.IOC_API_BASE = 'https://iochn.hanoi.dcs.vn:324';
        // window.XA_PHUONG = 'phuong_viet_hung';
    }
    if (window.IOC_API_KEY === undefined) window.IOC_API_KEY = 'dev-api-key-001';
})();

/** CMS innerHTML không chạy <script> CDN trong tab HTML → tự nạp Chart.js khi cần */
var CHARTJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
function realDomHead() {
    try {
        var probe = document.createElement('i');
        var doc = probe.ownerDocument;
        if (doc && doc.head && doc.head.tagName === 'HEAD') return doc.head;
        if (doc && doc.documentElement) return doc.documentElement;
    } catch (e) { }
    return null;
}
function chartGlobal() {
    try {
        var probe = document.createElement('i');
        var w = probe.ownerDocument && probe.ownerDocument.defaultView;
        return w && w.Chart;
    } catch (e) { }
    return typeof Chart !== 'undefined' ? Chart : undefined;
}
// function ensureChartJs(callback) {
//     function done() { if (typeof callback === 'function') callback(); }
//     if (chartGlobal()) { done(); return Promise.resolve(chartGlobal()); }
//     if (window.__chartJsLoadPromise) {
//         return window.__chartJsLoadPromise.then(function () { done(); return chartGlobal(); });
//     }
//     window.__chartJsLoadPromise = new Promise(function (resolve, reject) {
//         var head = realDomHead();
//         var doc = head && head.ownerDocument;
//         var existing = doc && doc.querySelector('script[data-ioc-chartjs]');
//         if (existing) {
//             existing.addEventListener('load', function () { resolve(chartGlobal()); });
//             existing.addEventListener('error', function () { reject(new Error('Chart.js load failed')); });
//             return;
//         }
//         var s = document.createElement('script');
//         s.src = CHARTJS_CDN;
//         s.async = true;
//         s.dataset.iocChartjs = '1';
//         s.onload = function () { resolve(chartGlobal()); };
//         s.onerror = function () { reject(new Error('Không tải được Chart.js')); };
//         // (head || realDomHead() || document.documentElement || document.body).appendChild(s);
//         console.info('[indicators] Loading Chart.js:', CHARTJS_CDN);
//     });
//     return window.__chartJsLoadPromise.then(function (C) { done(); return C; }).catch(function (err) {
//         console.warn('[indicators]', err.message || err);
//     });
// }

/**
 * IOC Data Sharing API — layer cho block indicators.
 * Gọi qua /api/v1/ioc (webpack proxy hoặc Nest). Không hardcode API key.
 */
(function (global) {
    'use strict';
    const AppState = {
        // Tab hiện tại: 'tat_ca' | 'dang_uy' | 'hdnd' | 'mttq' | 'ubnd'
        activeTab: 'tat_ca',
        // Tab con hiện tại (chỉ áp dụng cho UBND): null | 'y_te' | 'giao_duc' | ...
        activeChild: null,
        // Dữ liệu gốc từ API
        _data: null,
        // Callbacks khi state thay đổi
        _listeners: [],
    };

    var IOC_DEFAULT_BASE = 'https://iochn.hanoi.dcs.vn:324';
    var PREVIEW_COLORS = ['#2fb174', '#2c7dd2', '#39d5ff', '#d8a50c', '#d25a19', '#ef4444', '#a78bfa', '#f59e0b'];

    function getIocApiBase() {
        var b = global.IOC_API_BASE;
        if (b === undefined || b === null || String(b).trim() === '') return IOC_DEFAULT_BASE;
        return String(b).replace(/\/+$/, '');
    }

    function setState(newState) {
        const changed = {};
        let hasChange = false;

        if (newState.activeTab !== undefined && newState.activeTab !== AppState.activeTab) {
            AppState.activeTab = newState.activeTab;
            changed.activeTab = AppState.activeTab;
            hasChange = true;
        }

        if (newState.activeChild !== undefined && newState.activeChild !== AppState.activeChild) {
            AppState.activeChild = newState.activeChild;
            changed.activeChild = AppState.activeChild;
            hasChange = true;
        }

        if (newState._data !== undefined) {
            AppState._data = newState._data;
            changed._data = AppState._data;
            hasChange = true;
        }

        if (hasChange) {
            AppState._listeners.forEach(function (fn) {
                try { fn(changed); } catch (e) { console.warn('[State] Listener error:', e); }
            });
        }
    }
    function getParentTabs() {
        var data = AppState._data;
        if (!data || !data.data) return [];

        var tabs = [];
        var map = data.data;

        var order = ['dang_uy', 'hdnd', 'mttq', 'ubnd'];
        var labelMap = {
            'dang_uy': 'Đảng ủy',
            'hdnd': 'HĐND',
            'mttq': 'MTTQ',
            'ubnd': 'UBND'
        };
        var iconMap = {
            'dang_uy': '🚩',
            'hdnd': '🏛️',
            'mttq': '🤝',
            'ubnd': '🏢'
        };

        order.forEach(function (key) {
            if (map[key]) {
                tabs.push({
                    id: key,
                    name: labelMap[key] || key,
                    icon: iconMap[key] || '📌'
                });
            }
        });

        return tabs;
    }

    function getChildTabs() {
        var data = AppState._data;
        if (!data || !data.data) return [];

        var ubnd = data.data['ubnd'];
        if (!ubnd || !ubnd.data || typeof ubnd.data !== 'object') return [];

        var children = [];
        var childMap = ubnd.data;

        var order = [
            'y_te', 'giao_duc', 'hanh_chinh_cong', 'quan_ly_van_ban',
            'noi_vu', 'van_hoa', 'kinh_te_xa_hoi', 'tai_chinh_ngan_sach',
            'gpmb'
        ];

        var labelMap = {
            'y_te': 'Y tế',
            'giao_duc': 'Giáo dục',
            'hanh_chinh_cong': 'Hành chính công',
            'quan_ly_van_ban': 'Quản lý văn bản',
            'noi_vu': 'Nội vụ',
            'van_hoa': 'Văn hóa',
            'kinh_te_xa_hoi': 'Kinh tế - Xã hội',
            'tai_chinh_ngan_sach': 'Tài chính - Ngân sách',
            'gpmb': 'GPMB'
        };

        order.forEach(function (key) {
            if (childMap[key] && childMap[key].dashboard) {
                children.push({
                    id: key,
                    name: labelMap[key] || key
                });
            }
        });

        // Nếu không có child nào theo order, lấy tất cả
        if (children.length === 0) {
            Object.keys(childMap).forEach(function (key) {
                if (childMap[key] && childMap[key].dashboard) {
                    children.push({
                        id: key,
                        name: key.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); })
                    });
                }
            });
        }

        return children;
    }

    function getCards() {
        var data = AppState._data;
        if (!data || !data.data) return [];

        var allData = data.data;
        var activeTab = AppState.activeTab;
        var activeChild = AppState.activeChild;

        var cards = [];

        // Hàm trích xuất card từ một entry
        function extractCardsFromEntry(entry, parentId) {
            var result = [];
            if (!entry) return result;

            // Nếu entry có dashboard trực tiếp
            if (entry.dashboard && typeof entry.dashboard === 'object') {
                var sections = entry.dashboard;
                Object.keys(sections).forEach(function (sectionKey) {
                    var section = sections[sectionKey];
                    if (!section || typeof section !== 'object') return;

                    // Lấy items từ section
                    var items = extractItemsFromSection(section);
                    if (items.length === 0) return;

                    result.push({
                        id: parentId + '-' + sectionKey,
                        name: section.name || sectionKey,
                        field: section.name || sectionKey,
                        desc: section.description || '',
                        types: ['API'],
                        items: items,
                        __api: true,
                        __datasetId: parentId,
                        __sectionKey: sectionKey,
                        __entry: entry,
                        __totalRecords: items.length
                    });
                });
            }

            // Nếu entry có data.children (UBND)
            if (entry.data && typeof entry.data === 'object') {
                Object.keys(entry.data).forEach(function (childKey) {
                    var child = entry.data[childKey];
                    if (child && child.dashboard) {
                        var childCards = extractCardsFromEntry(child, childKey);
                        childCards.forEach(function (card) {
                            card.__parentId = parentId;
                            card.__childId = childKey;
                            result.push(card);
                        });
                    }
                });
            }

            return result;
        }

        // Hàm trích xuất items từ một section
        function extractItemsFromSection(section) {
            var items = [];

            // Nếu section.dashboard là mảng
            if (section.dashboard && Array.isArray(section.dashboard)) {
                section.dashboard.forEach(function (item) {
                    var label = item.chi_tieu || item.ten || item.hoat_dong || item.trang_thai || item.linh_vuc || '';
                    var value = item.tong || item.so_luong || item.gia_tri || item.so_cuoc || item.so_du_an || 0;
                    var url = item._detail_url || '';

                    if (label) {
                        var displayName = label;
                        if (item.phan_loai) displayName += ' (' + item.phan_loai + ')';
                        if (item.loai) displayName += ' (' + item.loai + ')';
                        if (item.trang_thai) displayName += ' (' + item.trang_thai + ')';
                        items.push([displayName, value, '', 'API IOC', null, url]);
                    }
                });
            }

            // Nếu section.dashboard là object (không phải mảng)
            if (section.dashboard && typeof section.dashboard === 'object' && !Array.isArray(section.dashboard)) {
                var subDash = section.dashboard;
                Object.keys(subDash).forEach(function (subKey) {
                    var subVal = subDash[subKey];
                    if (typeof subVal === 'number' || typeof subVal === 'string') {
                        if (subKey !== '_detail_url' && subKey !== 'id' && subKey !== 'name') {
                            items.push([subKey, subVal, '', 'API IOC', null, '']);
                        }
                    } else if (typeof subVal === 'object' && subVal !== null && !Array.isArray(subVal)) {
                        Object.keys(subVal).forEach(function (innerKey) {
                            var innerVal = subVal[innerKey];
                            if (typeof innerVal === 'number' || typeof innerVal === 'string') {
                                if (innerKey !== '_detail_url' && innerKey !== 'id' && innerKey !== 'name') {
                                    items.push([subKey + ' - ' + innerKey, innerVal, '', 'API IOC', null, '']);
                                }
                            }
                        });
                    }
                });
            }

            return items;
        }

        // === LOGIC LỌC DỮ LIỆU ===

        // Trường hợp 1: Tab "Tất cả" — lấy tất cả card từ tất cả lĩnh vực
        if (activeTab === 'tat_ca') {
            Object.keys(allData).forEach(function (key) {
                var entry = allData[key];
                var extracted = extractCardsFromEntry(entry, key);
                extracted.forEach(function (card) {
                    card.__parentId = key;
                    cards.push(card);
                });
            });
            return cards;
        }

        // Trường hợp 2: Tab cụ thể (dang_uy, hdnd, mttq)
        if (activeTab !== 'ubnd') {
            var entry = allData[activeTab];
            if (entry) {
                var extracted = extractCardsFromEntry(entry, activeTab);
                extracted.forEach(function (card) {
                    card.__parentId = activeTab;
                    cards.push(card);
                });
            }
            return cards;
        }

        // Trường hợp 3: Tab UBND
        if (activeTab === 'ubnd') {
            var ubndEntry = allData['ubnd'];
            if (!ubndEntry) return cards;

            // Nếu có chọn Tab Con cụ thể
            if (activeChild) {
                var childEntry = ubndEntry.data && ubndEntry.data[activeChild];
                if (childEntry && childEntry.dashboard) {
                    var extracted = extractCardsFromEntry(childEntry, activeChild);
                    extracted.forEach(function (card) {
                        card.__parentId = 'ubnd';
                        card.__childId = activeChild;
                        cards.push(card);
                    });
                }
                return cards;
            }

            // Không chọn Tab Con -> lấy tất cả child của UBND
            if (ubndEntry.data && typeof ubndEntry.data === 'object') {
                Object.keys(ubndEntry.data).forEach(function (childKey) {
                    var child = ubndEntry.data[childKey];
                    if (child && child.dashboard) {
                        var extracted = extractCardsFromEntry(child, childKey);
                        extracted.forEach(function (card) {
                            card.__parentId = 'ubnd';
                            card.__childId = childKey;
                            cards.push(card);
                        });
                    }
                });
            }
        }

        return cards;
    }

    function esc(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Format số
     */
    function fmt(num) {
        return Number(num || 0).toLocaleString('vi-VN');
    }

    /**
     * Render thanh Tab Cha
     * @param {HTMLElement} container
     */

    // function renderParentTabs(container) {
    //     if (!container) return;

    //     var tabs = getParentTabs();
    //     var activeTab = AppState.activeTab;

    //     var html = '';
    //     // Thêm tab "Tất cả"
    //     html += '<button type="button" class="' + (activeTab === 'tat_ca' ? 'active' : '') + '" onclick="window._setApiTab(\'tat_ca\')">🌐 Tất cả</button>';

    //     tabs.forEach(function (tab) {
    //         var isActive = (activeTab === tab.id);
    //         html += '<button type="button" class="' + (isActive ? 'active' : '') + '" onclick="window._setApiTab(\'' + tab.id + '\')">' + tab.icon + ' ' + esc(tab.name) + '</button>';
    //     });

    //     container.innerHTML = html;
    // }

    // function subscribeToState(fn) {
    //     if (typeof fn === 'function') {
    //         AppState._listeners.push(fn);
    //     }
    // }

    function getIocApiKey() {
        return global.IOC_API_KEY || '';
    }

    var KPI_LABELS = {
        tong_dong_chi_tieu: 'Tổng dòng chỉ tiêu',
        chi_tieu_kt_xa_hoi: 'Chỉ tiêu KT-XH',
        linh_vuc_dau_tu_cong: 'Lĩnh vực đầu tư công',
        tong_so_du_an: 'Tổng số dự án',
        ky_hop_da_to_chuc: 'Kỳ họp đã tổ chức',
        nghi_quyet_da_ban_hanh: 'Nghị quyết đã ban hành',
        cuoc_tiep_xuc_cu_tri: 'Cuộc tiếp xúc cử tri',
        tong_ho_so_nhan: 'Tổng hồ sơ nhận',
        tong_da_giai_quyet: 'Đã giải quyết',
        tong_dang_giai_quyet: 'Đang giải quyết',
        ho_so_cho_tiep_nhan: 'Chờ tiếp nhận',
        ho_so_khong_tiep_nhan: 'Không tiếp nhận',
        ty_le_dung_han: 'Tỷ lệ đúng hạn',
        ty_le_giai_quyet: 'Tỷ lệ giải quyết',
        ty_le_truc_tuyen: 'Tỷ lệ trực tuyến',
    };

    var API_TAB_ICONS = {
        'tat_ca': '🌐',
        hdnd: '🏛️',
        'y-te': '🏥',
        'noi-vu': '📋',
        'hanh-chinh-cong': '📑',
    };

    /** Map dataset API → card mock (replace) hoặc card mới */
    var DATASET_CARD_MAP = {
        hdnd: { replaceId: 'hdnd-nhiem-vu', role: 'HDND', field: 'HĐND' },
        'y-te': { replaceId: 'ubnd-yte', role: 'UBND', field: 'Y tế' },
        'noi-vu': { replaceId: 'ubnd-noivu', role: 'UBND', field: 'Nội vụ' },
        'hanh-chinh-cong': { replaceId: null, role: 'UBND', field: 'Hành chính công', newId: 'api-hanh-chinh-cong' },
    };

    function apiUrl(path) {
        var base = getIocApiBase();
        if (!path) return base + '/api/v1/ioc/dashboards';
        if (path.indexOf('http') === 0) return path;
        return base + path;
    }

    function iocFetch(pathOrUrl, opts) {
        var url = pathOrUrl.indexOf('/api/') === 0 || pathOrUrl.indexOf('http') === 0
            ? apiUrl(pathOrUrl)
            : apiUrl('/api/v1/ioc/' + pathOrUrl);
        var headers = { Accept: 'application/json' };
        var apiKey = getIocApiKey();
        if (apiKey) headers['X-API-Key'] = apiKey;
        return fetch(url, Object.assign({
            headers: headers,
        }, opts || {})).then(function (r) {
            // //console.log('iocFetch', r)
            if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + url);
            return r.json();
        });
    }

    function loadDashboardsList() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const data = data_dashboard; // Sử dụng dữ liệu mock từ data_dashboard
                global.__iocDashboards = data.data || {};
                global.__allItems = extractAllItems(data.data);

                resolve(data);
            }, 300);
        });
        // return iocFetch(`/api/v1/ioc/${window.TYPE}/${window.TYPE_FILTER}/tong_quan`).then(function (data) {
        //     //console.log("loadDashboardsList", data)
        //     global.__iocDashboards = data.data || {};
        //     global.__allItems = extractAllItems(data.data);
        //     // //console.log('allItems', allItems)
        //     return data;
        // });

    }

    function loadDashboardsListFilter(tabId) {
        // Mặc định nếu không truyền tabId
        //  thì coi như là 'tat_ca'
        var activeTab = tabId || 'tat_ca';

        return new Promise((resolve) => {
            setTimeout(() => {
                const data = data_dashboard; // Sử dụng dữ liệu mock từ data_dashboard

                global.__iocDashboards = data.data || {};

                global.__allItems = extractAllItems(data.data);

                if (activeTab && activeTab !== 'tat_ca') {
                    const datamap = data.data.filter(function (item) {
                        return item.code === activeTab || item._parent_id === activeTab;
                    });
                    global.__iocDashboards = data.data.filter(function (item) {
                        return item.code === activeTab || item._parent_id === activeTab;
                    });
                    global.__allItems = data.data.filter(function (item) {
                        return item.code === activeTab || item._parent_id === activeTab;
                    });
                }
                resolve(data);
            }, 300);
        });

        // return iocFetch(`/api/v1/ioc/${window.TYPE}/${window.TYPE_FILTER}/tong_quan`).then(function (data) {

        //     global.__iocDashboards = data.data || {};

        //     global.__allItems = extractAllItems(data.data);

        //     if (activeTab && activeTab !== 'tat_ca') {
        //         const datamap = data.data.filter(function (item) {
        //             return item.code === activeTab || item._parent_id === activeTab;
        //         });
        //         global.__iocDashboards = data.data.filter(function (item) {
        //             return item.code === activeTab || item._parent_id === activeTab;
        //         });
        //         global.__allItems = data.data.filter(function (item) {
        //             return item.code === activeTab || item._parent_id === activeTab;
        //         });
        //     }
        //     return data;
        // });
    }

    function loadDashboardsTab() {
        // return iocFetch(`/api/v1/ioc/${window.TYPE}/${window.TYPE_FILTER}/tong_quan/tabs`).then(function (data) {
        //     global.__iocDashboardsTab = data.tabs || [];
        //     return data.tabs;
        // });

        return new Promise((resolve) => {
            setTimeout(() => {
                const data = data_tabs; // Sử dụng dữ liệu mock từ data_dashboard
                global.__iocDashboardsTab = data.tabs || [];
                resolve(data);
            }, 300);
        });
    }

    function loadDashboardsCategoryDetail(url) {
        //console.log("loadDashboardsCategoryDetail", url);
        return IocIndicatorsApi.iocFetch(url).then(function (data) {
            global.__iocDashboardsDetail = data;
            return data;
        });
    }

    function loadTableDetail(url) {
        return IocIndicatorsApi.iocFetch(url).then(function (data) {
            global.__iocTableDetail = data;
            return data;
        });
    }

    function getDatasetEntry(datasetId) {
        var list = global.__iocDashboards;
        if (!list || !list.data || !datasetId) return null;
        if (list.data[datasetId]) return list.data[datasetId];
        // //console.log('getDatasetEntry', list.data)
        var keys = Object.keys(list.data);
        for (var i = 0; i < keys.length; i++) {
            var entry = list.data[keys[i]];

            // //console.log('getDatasetEntry', entry, datasetId)
            if (entry && entry.id === datasetId) return entry;
            if (entry && entry.data && entry.data[datasetId.replace(/-/g, '_')]) return entry.data[datasetId.replace(/-/g, '_')];
        }
        return null;
    }

    function fmtNum(n) {
        return Number(n || 0).toLocaleString('vi-VN');
    }

    function escHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function chartBarHtml(rows, labelKey, valueKey, maxRows) {
        rows = (rows || []).slice(0, maxRows || 4);
        if (!rows.length) return '';
        var total = rows.reduce(function (s, r) { return s + (Number(r[valueKey]) || 0); }, 0) || 1;
        var segs = rows.map(function (r, i) {
            var n = Number(r[valueKey]) || 0;
            if (!n) return '';
            return '<div style="flex:' + (n / total * 100).toFixed(1) + ';background:' + PREVIEW_COLORS[i % PREVIEW_COLORS.length] + ';border-radius:3px" title="' + escHtml(r[labelKey]) + ': ' + fmtNum(n) + '"></div>';
        }).join('');
        var legend = rows.map(function (r, i) {
            var n = Number(r[valueKey]) || 0;
            if (!n) return '';
            return '<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><i style="width:7px;height:7px;border-radius:2px;background:' + PREVIEW_COLORS[i % PREVIEW_COLORS.length] + ';display:inline-block"></i>' + fmtNum(n) + '</span>';
        }).join('');
        return '<div style="display:flex;gap:3px;height:8px">' + segs + '</div><p style="font-size:9px;color:#c8dcec;margin:5px 0 0">' + legend + '</p>';
    }

    function previewRow(label, bodyHtml) {
        return { label: label, bodyHtml: bodyHtml };
    }

    /** Trích preview rows + items[] cho card từ dashboard payload */
    function adaptDashboard(datasetId, entry) {
        var dash = (entry && entry.dashboard) || {};
        var previews = [];
        var items = [];
        var totalRecords = 0;

        // Nếu dashboard có cấu trúc dạng danh sách chỉ tiêu
        Object.keys(dash).forEach(function (sectionKey) {
            var section = dash[sectionKey];
            if (!section || typeof section !== 'object') return;

            // Nếu section có dashboard là mảng
            if (section.dashboard && Array.isArray(section.dashboard)) {
                section.dashboard.forEach(function (item) {
                    var label = item.chi_tieu || item.ten || item.hoat_dong || '';
                    var value = item.tong || item.so_luong || item.gia_tri || 0;
                    var url = item._detail_url || '';
                    if (label && value) {
                        items.push([label, value, '', 'API IOC', null, url]);
                        totalRecords += Number(value) || 0;
                    }
                });

                var previewLabel = section.name || sectionKey;
                var previewRows = section.dashboard.map(function (item) {
                    var label = item.chi_tieu || item.ten || item.hoat_dong || '';
                    var value = item.tong || item.so_luong || item.gia_tri || 0;
                    return { label: label, v: value };
                }).filter(function (x) { return x.label && x.v; });

                if (previewRows.length) {
                    previews.push(previewRow(previewLabel, chartBarHtml(previewRows, 'label', 'v')));
                }
            }

            // Xử lý KPI
            if (sectionKey === 'kpi' && section.dashboard) {
                Object.keys(section.dashboard).forEach(function (k) {
                    if (!k.endsWith('_detail_url')) {
                        var val = section.dashboard[k];
                        var label = k.replace(/_/g, ' ');
                        items.push([label, val, '', 'API IOC', null, section.dashboard[k + '_detail_url']]);
                        totalRecords += Number(val) || 0;
                    }
                });
            }

            // Xử lý các object trực tiếp
            if (typeof section.dashboard === 'object' && !Array.isArray(section.dashboard)) {
                var subDash = section.dashboard;
                var hasItems = false;
                Object.keys(subDash).forEach(function (subKey) {
                    var subVal = subDash[subKey];
                    if (typeof subVal === 'number' || typeof subVal === 'string') {
                        items.push([subKey, subVal, '', 'API IOC', null, '']);
                        totalRecords += Number(subVal) || 0;
                        hasItems = true;
                    } else if (typeof subVal === 'object' && subVal !== null) {
                        Object.keys(subVal).forEach(function (innerKey) {
                            var innerVal = subVal[innerKey];
                            if (typeof innerVal === 'number' || typeof innerVal === 'string') {
                                items.push([subKey + ' - ' + innerKey, innerVal, '', 'API IOC', null, '']);
                                totalRecords += Number(innerVal) || 0;
                                hasItems = true;
                            }
                        });
                    }
                });
                if (hasItems) {
                    previews.push(previewRow(section.name || sectionKey, ''));
                }
            }
        });

        // Nếu không có items, thử lấy từ các trường khác
        if (!items.length) {
            Object.keys(dash).forEach(function (key) {
                var val = dash[key];
                if (typeof val === 'number' || typeof val === 'string') {
                    items.push([key, val, '', 'API IOC', null, '']);
                    totalRecords += Number(val) || 0;
                }
            });
        }

        if (!previews.length && items.length) {
            previews = items.slice(0, 4).map(function (it) {
                return previewRow(it[0], chartBarHtml([{ label: it[0], v: it[1] }], 'label', 'v', 1));
            });
        }

        return { previews: previews, items: items, totalRecords: totalRecords };
    }

    function buildApiCategoryCard(datasetId, entry) {
        if (!entry) return null;

        var adapted = adaptDashboard(datasetId, entry);
        var id = 'api-' + datasetId;

        var name = entry.name || datasetId;
        var field = entry.name || '';

        var role = 'UBND';
        if (datasetId === 'dang_uy' || datasetId === 'dang_uy' || datasetId === 'dang') role = 'DANG';
        else if (datasetId === 'hdnd' || datasetId === 'hoi_dong_nhan_dan') role = 'HDND';
        else if (datasetId === 'mttq' || datasetId === 'mat_tran_to_quoc') role = 'MTTQ';
        else if (datasetId === 'ubnd' || datasetId === 'uy_ban_nhan_dan') role = 'UBND';
        else if (['y-te', 'giao-duc', 'hanh-chinh-cong', 'noi-vu', 'van-hoa', 'kinh-te-xa-hoi', 'tai-chinh-ngan-sach', 'gpmb', 'quan-ly-van-ban'].includes(datasetId)) {
            role = 'UBND';
        }

        return {
            id: id,
            replaceId: null,
            name: name,
            field: field,
            desc: entry.description || '',
            types: ['API'],
            role: role,
            items: adapted.items,
            __api: true,
            __datasetId: datasetId,
            __entry: entry,
            __previewRows: adapted.previews,
            __totalRecords: adapted.totalRecords,
            __rawDataUrl: entry.raw_data_url,
            __parentId: null,
        };
    }

    /** Merge API cards vào danh sách category từ mock */
    function mergeApiIntoCategories(mockCats) {
        var list = global.__iocDashboards;
        if (!list || !list.data) return mockCats.slice();

        var result = mockCats.slice();
        var apiCards = [];

        Object.keys(list.data).forEach(function (dataKey) {
            var entry = list.data[dataKey];
            var datasetId = (entry && entry.id) || dataKey;
            var card = IocIndicatorsApi.buildApiCategoryCard(datasetId, entry);
            if (!card) return;
            apiCards.push(card);
            if (card.replaceId) {
                var idx = result.findIndex(function (c) { return c.id === card.replaceId; });
                if (idx >= 0) {
                    result[idx] = Object.assign({}, result[idx], {
                        name: card.name,
                        desc: card.desc,
                        types: ['API'],
                        items: card.items.length ? card.items : result[idx].items,
                        __api: true,
                        __datasetId: card.__datasetId,
                        __entry: card.__entry,
                        __previewRows: card.__previewRows,
                        __totalRecords: card.__totalRecords,
                        __rawDataUrl: card.__rawDataUrl,
                    });
                } else {
                    result.push(card);
                }
            } else {
                if (!result.some(function (c) { return c.id === card.id; })) result.push(card);
            }
        });

        return result;
    }

    function kpiStatsFromApi(mockCatCount, mockItemCount, mockRecordCount) {
        var list = global.__iocDashboards;
        if (!list || !list.data) {
            return { linhVuc: mockCatCount, chiTieu: mockItemCount, tongBanGhi: mockRecordCount, apiLoaded: false };
        }
        var apiCats = 0, apiItems = 0, apiRecords = 0;
        Object.keys(list.data).forEach(function (dataKey) {
            var entry = list.data[dataKey];
            var datasetId = (entry && entry.id) || dataKey;
            apiCats += 1;
            var adapted = adaptDashboard(datasetId, entry);
            apiItems += adapted.items.length;
            apiRecords += adapted.totalRecords || adapted.items.reduce(function (s, it) { return s + (Number(it[1]) || 0); }, 0);
        });
        return {
            linhVuc: mockCatCount,
            chiTieu: mockItemCount + ' · API ' + apiItems,
            tongBanGhi: mockRecordCount + ' · API ' + fmtNum(apiRecords),
            apiLoaded: true,
            apiDatasetCount: apiCats,
        };
    }

    /** Map 1 bản ghi list API → hàng drawer */
    function mapListRecord(rec, datasetId) {
        var title = rec.ten_chi_tieu || rec.chi_tieu || rec.doi_tuong_thong_ke || rec.nhom_chi_tieu || ('#' + rec.id);
        var value = rec.gia_tri_so != null ? rec.gia_tri_so : (rec.gia_tri_raw != null ? rec.gia_tri_raw : '—');
        var unit = rec.don_vi_tinh ? ' ' + rec.don_vi_tinh : '';
        var meta = [rec.chu_de_nhom, rec.linh_vuc, rec.ky_bao_cao, rec.nam && rec.thang ? (rec.thang + '/' + rec.nam) : null].filter(Boolean).join(' · ');
        return { id: rec.id, title: title, value: value + unit, meta: meta, raw: rec, datasetId: datasetId };
    }

    function buildAllApiCategoryCards() {
        var list = global.__iocDashboards;
        if (!list || !list.data) return [];
        var cards = [];

        Object.keys(list.data).forEach(function (dataKey) {
            var entry = list.data[dataKey];

            // Nếu entry có data.children (UBND)
            if (entry.data && typeof entry.data === 'object') {
                Object.keys(entry.data).forEach(function (childKey) {
                    var child = entry.data[childKey];
                    if (child && child.dashboard) {
                        var card = IocIndicatorsApi.buildApiCategoryCard(childKey, child);
                        if (card) {
                            card.__parentId = dataKey;
                            cards.push(card);
                        }
                    }
                });
            } else if (entry.dashboard) {
                var card = IocIndicatorsApi.buildApiCategoryCard(dataKey, entry);
                if (card) {
                    card.__parentId = null;
                    cards.push(card);
                }
            }
        });

        return cards;
    }

    function formatKpiValue(key, val) {
        if (val == null) return '—';
        if (String(key).indexOf('ty_le') === 0 && typeof val === 'number' && val <= 1) {
            return (val * 100).toFixed(1).replace('.', ',') + '%';
        }
        return fmtNum(val);
    }

    function getKpiTilesForTab(tabId) {
        var list = global.__iocDashboards;
        if (!list || !list.data) return [];

        if (tabId === 'tat_ca') {
            var cards = buildAllApiCategoryCards();
            var totalItems = cards.reduce(function (s, c) { return s + (c.items || []).length; }, 0);
            var totalRec = cards.reduce(function (s, c) { return s + (c.__totalRecords || 0); }, 0);
            return [
                { label: 'Lĩnh vực', value: cards.length },
                { label: 'Chỉ tiêu', value: totalItems },
                { label: 'Tổng bản ghi', value: totalRec },
                { label: 'Nguồn', value: 'API IOC' },
            ];
        }

        if (activeApiTabChild && activeApiTabChild === tabId) {
            var entry = list.data[activeApiTab];
            if (entry && entry.data && entry.data[tabId]) {
                var child = entry.data[tabId];
                var adapted = adaptDashboard(tabId, child);
                var totalItems = adapted.items.length;
                var totalRec = adapted.totalRecords || adapted.items.reduce(function (s, it) { return s + (Number(it[1]) || 0); }, 0);
                return [
                    { label: 'Lĩnh vực', value: child.name || tabId },
                    { label: 'Chỉ tiêu', value: totalItems },
                    { label: 'Tổng bản ghi', value: totalRec },
                    { label: 'Nguồn', value: 'API IOC' },
                ];
            }
        }

        var entry = getDatasetEntry(tabId);
        if (!entry) return [];

        if (entry.data && typeof entry.data === 'object') {
            var childCards = [];
            Object.keys(entry.data).forEach(function (childKey) {
                var child = entry.data[childKey];
                if (child && child.dashboard) {
                    var adapted = adaptDashboard(childKey, child);
                    childCards.push(adapted);
                }
            });
            var totalItems = childCards.reduce(function (s, c) { return s + c.items.length; }, 0);
            var totalRec = childCards.reduce(function (s, c) { return s + (c.totalRecords || 0); }, 0);
            return [
                { label: 'Lĩnh vực con', value: childCards.length },
                { label: 'Chỉ tiêu', value: totalItems },
                { label: 'Tổng bản ghi', value: totalRec },
                { label: 'Nguồn', value: 'API IOC' },
            ];
        }

        var dash = entry.dashboard || {};
        var tiles = [];

        if (dash.kpi && dash.kpi.dashboard) {
            var kpiData = dash.kpi.dashboard;
            Object.keys(kpiData).filter(function (k) {
                return !k.endsWith('_detail_url') && typeof kpiData[k] === 'number';
            }).slice(0, 4).forEach(function (k) {
                tiles.push({
                    label: (global.IocIndicatorsApi && global.IocIndicatorsApi.KPI_LABELS && global.IocIndicatorsApi.KPI_LABELS[k]) || k.replace(/_/g, ' '),
                    value: global.IocIndicatorsApi ? global.IocIndicatorsApi.formatKpiValue(k, kpiData[k]) : String(kpiData[k])
                });
            });
        }

        if (!tiles.length) {
            var adapted = adaptDashboard(tabId, entry);
            tiles = [
                { label: 'Chỉ tiêu', value: adapted.items.length },
                { label: 'Tổng bản ghi', value: adapted.totalRecords || adapted.items.reduce(function (s, it) { return s + (Number(it[1]) || 0); }, 0) },
                { label: 'Nguồn', value: 'API IOC' },
                { label: 'Dataset', value: entry.id || '—' },
            ];
        }

        while (tiles.length < 4) tiles.push({ label: '—', value: '—' });
        return tiles.slice(0, 4);
    }

    global.IocIndicatorsApi = {
        DATASET_CARD_MAP: DATASET_CARD_MAP,
        KPI_LABELS: KPI_LABELS,
        API_TAB_ICONS: API_TAB_ICONS,
        loadDashboardsList: loadDashboardsList,
        loadDashboardsListFilter: loadDashboardsListFilter,
        loadDashboardsTab: loadDashboardsTab,
        loadDashboardsCategoryDetail: loadDashboardsCategoryDetail,
        loadTableDetail: loadTableDetail,
        getDatasetEntry: getDatasetEntry,
        iocFetch: iocFetch,
        mergeApiIntoCategories: mergeApiIntoCategories,
        kpiStatsFromApi: kpiStatsFromApi,
        adaptDashboard: adaptDashboard,
        mapListRecord: mapListRecord,
        buildApiCategoryCard: buildApiCategoryCard,  // Đã có
        buildAllApiCategoryCards: buildAllApiCategoryCards,  // Đã có
        getKpiTilesForTab: getKpiTilesForTab,
        formatKpiValue: formatKpiValue,
        fmtNum: fmtNum,
        escHtml: escHtml,
        chartBarHtml: chartBarHtml,
        apiUrl: apiUrl,
    };
})(typeof window !== 'undefined' ? window : this);

function setAppVh() { document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px') }
setAppVh(); window.addEventListener('resize', setAppVh); window.addEventListener('orientationchange', setAppVh);

/* ============================== DATA TĨNH ============================== */
const statusDefs = [
    { key: 'done', label: 'Hoàn thành đúng tiến độ', short: 'Hoàn thành', color: '#2fb174', cls: 'green' },
    { key: 'doing', label: 'Đang thực hiện chưa đến hạn', short: 'Đang xử lý', color: '#2c7dd2', cls: 'blue' },
    { key: 'regular', label: 'Thường xuyên, liên tục', short: 'Thường xuyên', color: '#229cbd', cls: 'cyan' },
    { key: 'soon', label: 'Sắp đến hạn cảnh báo', short: 'Sắp đến hạn', color: '#d8a50c', cls: 'gold' },
    { key: 'risk', label: 'Nguy cơ không hoàn thành đúng hạn', short: 'Nguy cơ trễ', color: '#d25a19', cls: 'orange' },
    { key: 'overdue', label: 'Quá hạn', short: 'Quá hạn', color: '#d33a44', cls: 'red' }
];
const axisMeta = {
    DANG: { name: 'Thành ủy', icon: '🚩', color: '#e84d5b', desc: 'Thường trực Thành ủy · xem tất cả 04 trục', scope: 'all' },
    HDND: { name: 'HĐND TP', icon: '🏛️', color: '#f59e0b', desc: 'Chủ tịch HĐND Thành phố · chỉ xem HĐND', scope: 'own' },
    UBND: { name: 'UBND TP', icon: '🏢', color: '#2fb174', desc: 'Chủ tịch UBND Thành phố · UBND đầy đủ + HĐND/MTTQ chỉ số', scope: 'ubnd' },
    MTTQ: { name: 'MTTQ TP', icon: '🤝', color: '#8b5cf6', desc: 'Chủ tịch UB MTTQ Thành phố · chỉ xem MTTQ', scope: 'own' }
};
const metricMeta = {
    assigned: { label: 'Nhiệm vụ giao', short: 'Nhiệm vụ giao', icon: '📤' },
    received: { label: 'Nhiệm vụ nhận', short: 'Nhiệm vụ nhận', icon: '📥' },
    docIn: { label: 'Văn bản đến', short: 'Văn bản đến', icon: '📨' },
    docOut: { label: 'Văn bản đi', short: 'Văn bản đi', icon: '📄' }
};
/* DEMO credentials — stored as SHA-256 hex (không lưu plaintext). */
const _DEMO_PASS_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
const accounts = {
    danguy: { user: 'danguy', passHash: _DEMO_PASS_HASH, role: 'DANG', title: 'Tài khoản Thành ủy', subtitle: 'Thường trực Thành ủy · Xem tất cả 04 trục', icon: '🚩' },
    hdnd: { user: 'hdnd', passHash: _DEMO_PASS_HASH, role: 'HDND', title: 'Tài khoản HĐND', subtitle: 'Chủ tịch HĐND Thành phố · Chỉ xem HĐND', icon: '🏛️' },
    ubnd: { user: 'ubnd', passHash: _DEMO_PASS_HASH, role: 'UBND', title: 'Tài khoản UBND', subtitle: 'Chủ tịch UBND Thành phố · UBND full + HĐND/MTTQ chỉ số', icon: '🏢' },
    mttq: { user: 'mttq', passHash: _DEMO_PASS_HASH, role: 'MTTQ', title: 'Tài khoản MTTQ', subtitle: 'Chủ tịch UB MTTQ Thành phố · Chỉ xem MTTQ', icon: '🤝' }
};

const segmentTemplate = {
    DANG: { assigned: { done: 180, doing: 95, regular: 40, soon: 30, risk: 22, overdue: 10 }, received: { done: 120, doing: 70, regular: 25, soon: 20, risk: 15, overdue: 8 }, docIn: { done: 210, doing: 140, regular: 35, soon: 40, risk: 25, overdue: 12 }, docOut: { done: 160, doing: 110, regular: 30, soon: 28, risk: 18, overdue: 9 } },
    HDND: { assigned: { done: 40, doing: 22, regular: 10, soon: 8, risk: 6, overdue: 3 }, received: { done: 55, doing: 35, regular: 15, soon: 14, risk: 10, overdue: 5 }, docIn: { done: 60, doing: 38, regular: 14, soon: 12, risk: 9, overdue: 4 }, docOut: { done: 42, doing: 26, regular: 10, soon: 8, risk: 6, overdue: 3 } },
    UBND: { assigned: { done: 320, doing: 210, regular: 90, soon: 75, risk: 55, overdue: 28 }, received: { done: 480, doing: 330, regular: 130, soon: 110, risk: 85, overdue: 42 }, docIn: { done: 600, doing: 410, regular: 160, soon: 140, risk: 100, overdue: 55 }, docOut: { done: 440, doing: 290, regular: 120, soon: 105, risk: 75, overdue: 35 } },
    MTTQ: { assigned: { done: 60, doing: 32, regular: 15, soon: 12, risk: 9, overdue: 4 }, received: { done: 75, doing: 48, regular: 20, soon: 18, risk: 12, overdue: 6 }, docIn: { done: 80, doing: 52, regular: 18, soon: 16, risk: 12, overdue: 6 }, docOut: { done: 58, doing: 36, regular: 14, soon: 12, risk: 9, overdue: 4 } }
};

const indicators = {
    DANG: [
        ['Theo dõi nhiệm vụ (VPTU)', 180, 'Ngày', 'Đồng bộ dữ liệu API'],
        ['Ban Tổ chức - Tổng số CBCCVC khối Đảng, MTTQ', 24, '', 'CSDL/Excel nội bộ khối Đảng'],
        ['Ban Tổ chức - Tổng số CBCCVC diện BTV Thành ủy quản lý', 24, '', 'CSDL/Excel nội bộ khối Đảng'],
        ['Ban Tổ chức - Tổng số Tổ chức Cơ sở Đảng', 24, 'Quý', 'CSDL/Excel nội bộ khối Đảng'],
        ['Ban Tổ chức - Biên chế khối Đảng, Đoàn thể (126 xã/phường)', 126, '', 'CSDL/Excel nội bộ khối Đảng'],
        ['Ban Tổ chức - Kết quả đánh giá cán bộ hàng  (126 xã/phường)', 126, '', 'CSDL/Excel nội bộ khối Đảng'],
        ['Ban Tổ chức - Biến động Đảng viên theo thời gian (126 xã/phường)', 126, '', 'CSDL/Excel nội bộ khối Đảng'],
        ['Ban Tổ chức - Cơ cấu tổ chức Đảng trực thuộc', 24, 'Quý', 'CSDL/Excel nội bộ khối Đảng'],
        ['Ban Tổ chức - Kết quả thực hiện công tác chính trị nội bộ', 24, 'Quý', 'CSDL/Excel nội bộ khối Đảng'],
        ['UBKT - Thống kê số liệu kiểm tra, giám sát theo địa bàn (bản đồ)', 30, '', 'CSDL/Excel UBKT Thành ủy'],
        ['UBKT - Giám sát của UBKT các cấp', 30, '', 'CSDL/Excel UBKT Thành ủy'],
        ['UBKT - Kiểm tra giám sát của cấp ủy các cấp và chi bộ', 30, '', 'CSDL/Excel UBKT Thành ủy'],
        ['UBKT - Thi hành kỷ luật', 30, '', 'CSDL/Excel UBKT Thành ủy'],
        ['UBKT - Kiểm tra của UBKT các cấp (KTGS, THKL, tài chính Đảng)', 30, '', 'CSDL/Excel UBKT Thành ủy'],
        ['UBKT - Thống kê tình hình đoàn kiểm tra giám sát', 30, 'Tuần', 'CSDL/Excel UBKT Thành ủy'],
        ['Ban Nội chính - Tổng số cuộc tiếp/Tổng số lượt công dân', 45, 'Tuần', 'CSDL/Excel Ban Nội chính'],
        ['Ban Nội chính - Số văn bản tham mưu trong ', 12, '', 'CSDL/Excel Ban Nội chính'],
        ['Ban Nội chính - Vụ việc an toàn cháy nổ', 20, 'Tuần', 'CSDL/Excel Ban Nội chính'],
        ['Ban Nội chính - Số lượt công dân khiếu nại, tố cáo đông người', 20, 'Tuần', 'CSDL/Excel Ban Nội chính'],
        ['Ban Tuyên giáo & Dân vận - Đăng ký mô hình dân vận khéo', 30, 'Quý', 'CSDL/Excel Ban Tuyên giáo'],
        ['Ban Tuyên giáo & Dân vận - Học tập quán triệt nghị quyết, chỉ thị', 15, 'Quý', 'CSDL/Excel Ban Tuyên giáo'],
        ['Ban Tuyên giáo & Dân vận - Nắm bắt dư luận xã hội', 30, 'Tuần', 'CSDL/Excel Ban Tuyên giáo']
    ],
    HDND: [
        ['Theo dõi nhiệm vụ (HĐND)', 60, 'Ngày', 'Đồng bộ dữ liệu API']
    ],
    UBND: [
        ['Theo dõi nhiệm vụ (dùng chung khối chính quyền)', 420, 'Ngày', 'Đồng bộ dữ liệu API'],
        ['Sở GD&ĐT - Tổng quan số liệu toàn ngành', 30, '', 'Kết nối API'],
        ['Sở GD&ĐT - Tổng quan mạng lưới trường học', 30, '', 'Kết nối API'],
        ['Sở NN&MT - Chỉ tiêu tổng hợp ngành Nông nghiệp', 12, '', 'File'],
        ['Sở NN&MT - Tổng hợp dữ liệu Giải phóng mặt bằng', 12, '', 'File'],
        ['Sở NN&MT - Thống kê tình hình sử dụng đất đai', 12, 'Quý', 'File'],
        ['Sở NN&MT - Chỉ số chất lượng không khí (AQI)', 12, 'Ngày', 'File'],
        ['Sở Y tế - Tình hình dịch bệnh', 20, 'Tuần', 'File'],
        ['Sở Y tế - Số lượt khám chữa bệnh', 20, '', 'File'],
        ['TT Phục vụ HCC - Thống kê số lượng hồ sơ', 30, 'Ngày', 'Kết nối API (L0 đã thống nhất)'],
        ['TT Phục vụ HCC - Tỷ lệ cung cấp DVC trực tuyến', 30, 'Ngày', 'Kết nối API (L0 đã thống nhất)'],
        ['TT Phục vụ HCC - Tình hình xử lý hồ sơ', 30, 'Ngày', 'Kết nối API (L0 đã thống nhất)'],
        ['TT Phục vụ HCC - Mức độ hài lòng', 30, '', 'Kết nối API (L0 đã thống nhất)'],
        ['TT Phục vụ HCC - Sáng kiến diễn đàn KHCN', 15, 'Quý', 'Kết nối API (L0 đã thống nhất)'],
        ['TT Phục vụ HCC - Sáng kiến xây dựng Thủ đô', 15, 'Quý', 'Kết nối API (L0 đã thống nhất)'],
        ['TT Phục vụ HCC - Phản ánh hiện trường iHaNoi', 40, 'Ngày', 'Kết nối API (L0 đã thống nhất)'],
        ['Sở Tài chính - Sản phẩm trên địa bàn', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Tổng mức bán ra và doanh thu dịch vụ', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Tổng mức bán lẻ và doanh thu dịch vụ', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Vốn đầu tư phát triển xã hội theo giá hiện hành', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Vốn đầu tư thực hiện nguồn NSNN do địa phương quản lý', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Chỉ số sản xuất công nghiệp so với cùng kỳ', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Dự án trọng điểm', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Doanh thu vận tải, kho bãi, bưu chính chuyển phát', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Khách du lịch đến Hà Nội', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Kim ngạch nhập khẩu', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Kim ngạch xuất khẩu', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Chỉ số tiêu dùng, giá vàng, đô la Mỹ', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Tình hình thu ngân sách', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Tài chính - Tình hình chi ngân sách địa phương', 25, '', 'Đang trao đổi để kết nối API'],
        ['Sở Nội vụ - Số lượng tìm việc trên sàn giao dịch việc làm', 20, 'Tuần', 'File'],
        ['Sở Nội vụ - Tổng số chi trả an sinh cho người có công', 20, '', 'File'],
        ['Sở Nội vụ - Số lượng CCVC khối chính quyền', 20, 'Quý', 'File']
    ],
    MTTQ: [
        ['Theo dõi nhiệm vụ (MTTQ)', 60, 'Ngày', 'Đồng bộ dữ liệu API'],
        ['Thu chi quỹ "Vì người nghèo"', 15, '', 'Excel/CSDL MTTQ'],
        ['Tình hình vận động thu quỹ "Vì người nghèo"', 15, '', 'Excel/CSDL MTTQ'],
        ['Cơ cấu kết quả vận động nguồn lực hỗ trợ tặng quà Tết theo các cấp', 15, 'Quý', 'Excel/CSDL MTTQ'],
        ['Cơ cấu kết quả hỗ trợ tặng quà Tết theo nguồn quỹ', 15, 'Quý', 'Excel/CSDL MTTQ'],
        ['Thống kê ủng hộ quỹ "Vì biển, đảo Việt Nam"', 15, 'Quý', 'Excel/CSDL MTTQ']
    ]
};

/* Phân tổ (breakdown) của 1 chỉ tiêu: P = tách theo nhóm cùng đơn vị (vẽ dạng thanh %); S = các số liệu độc lập khác đơn vị (vẽ dạng thẻ KPI) */
function P(dim, items) { return { dim, type: 'bar', items: items.map(x => ({ label: x[0], value: x[1] })) }; }
function S(dim, items) { return { dim, type: 'stat', items: items.map(x => ({ label: x[0], value: x[1] })) }; }

const categorySeed = {
    DANG: [
        { id: 'dang-vptu', name: 'VPTU · Theo dõi nhiệm vụ', field: 'Thành ủy', desc: 'Thống kê số lượng, tình trạng nhận và giao nhiệm vụ theo khối/đơn vị, đồng bộ trực tiếp qua IOC.', types: ['API'], items: [['Theo dõi nhiệm vụ (VPTU)', 1442, 'Ngày', 'Đồng bộ dữ liệu API']] },
        {
            id: 'dang-to-chuc', name: 'Ban Tổ chức Thành ủy', field: 'Thành ủy', desc: 'Tổ chức cán bộ, biên chế, đánh giá cán bộ, biến động Đảng viên và công tác chính trị nội bộ.', types: ['CSDL', 'Excel'], items: [
                ['Ban Tổ chức - Tổng số CBCCVC khối Đảng, MTTQ', 4505, '', 'CSDL/Excel nội bộ khối Đảng', [P('Khối', [['Khối Đảng', 3240], ['Khối MTTQ', 1620]])]],
                ['Ban Tổ chức - Tổng số CBCCVC diện BTV Thành ủy quản lý', 24, '', 'CSDL/Excel nội bộ khối Đảng', [P('Loại cán bộ', [['Lãnh đạo chủ chốt', 180], ['Cán bộ diện quy hoạch', 320], ['Cán bộ khác', 180]])]],
                ['Ban Tổ chức - Tổng số Tổ chức Cơ sở Đảng', 5887, 'Quý', 'CSDL/Excel nội bộ khối Đảng', [P('Loại hình', [['Đảng bộ cơ sở', 186], ['Chi bộ cơ sở', 940]])]],
                ['Ban Tổ chức - Biên chế khối Đảng, Đoàn thể (126 xã/phường)', 126, '', 'CSDL/Excel nội bộ khối Đảng', [P('Khối', [['Khối Đảng', 1860], ['Đoàn thể', 940]])]],
                ['Ban Tổ chức - Kết quả đánh giá cán bộ hàng  (126 xã/phường)', 126, '', 'CSDL/Excel nội bộ khối Đảng', [P('Mức đánh giá', [['Hoàn thành xuất sắc', 420], ['Hoàn thành tốt', 1240], ['Hoàn thành nhiệm vụ', 980], ['Không hoàn thành', 60]])]],
                ['Ban Tổ chức - Biến động Đảng viên theo thời gian (126 xã/phường)', 126, '', 'CSDL/Excel nội bộ khối Đảng', [P('Loại biến động', [['Kết nạp mới', 680], ['Chuyển sinh hoạt đến', 420], ['Chuyển sinh hoạt đi', 380], ['Từ trần, xóa tên', 86]])]],
                ['Ban Tổ chức - Cơ cấu tổ chức Đảng trực thuộc', 24, 'Quý', 'CSDL/Excel nội bộ khối Đảng', [P('Loại hình', [['Đảng bộ trực thuộc', 48], ['Chi bộ trực thuộc', 186]])]],
                ['Ban Tổ chức - Kết quả thực hiện công tác chính trị nội bộ', 24, 'Quý', 'CSDL/Excel nội bộ khối Đảng', [P('Nội dung', [['Sinh hoạt định kỳ', 420], ['Học tập nghị quyết, chỉ thị', 280], ['Kiểm điểm, đánh giá cuối năm', 180]])]]
            ]
        },
        { id: 'dang-ubkt', name: 'Ủy ban Kiểm tra Thành ủy', field: 'Thành ủy', desc: 'Kiểm tra, giám sát theo địa bàn (bản đồ), thi hành kỷ luật và tình hình đoàn kiểm tra giám sát.', types: ['CSDL', 'Excel'], items: [['UBKT - Thống kê số liệu kiểm tra, giám sát theo địa bàn (bản đồ)', 30, '', 'CSDL/Excel UBKT Thành ủy'], ['UBKT - Giám sát của UBKT các cấp', 233, '', 'CSDL/Excel UBKT Thành ủy'], ['UBKT - Kiểm tra giám sát của cấp ủy các cấp và chi bộ', 1049, '', 'CSDL/Excel UBKT Thành ủy'], ['UBKT - Thi hành kỷ luật', 35, '', 'CSDL/Excel UBKT Thành ủy'], ['UBKT - Kiểm tra của UBKT các cấp (KTGS, THKL, tài chính Đảng)', 91, '', 'CSDL/Excel UBKT Thành ủy'], ['UBKT - Thống kê tình hình đoàn kiểm tra giám sát', 272, 'Tuần', 'CSDL/Excel UBKT Thành ủy']] },
        {
            id: 'dang-noi-chinh', name: 'Ban Nội chính Thành ủy', field: 'Thành ủy', desc: 'Tiếp công dân, văn bản tham mưu, an toàn cháy nổ và khiếu nại - tố cáo đông người.', types: ['CSDL', 'Excel'], items: [
                ['Ban Nội chính - Tổng số cuộc tiếp/Tổng số lượt công dân', 11, 'Tuần', 'CSDL/Excel Ban Nội chính'],
                ['Ban Nội chính - Số văn bản tham mưu trong ', 9, '', 'CSDL/Excel Ban Nội chính'],
                ['Ban Nội chính - Vụ việc an toàn cháy nổ', 59, 'Tuần', 'CSDL/Excel Ban Nội chính'],
                ['Ban Nội chính - Số lượt công dân khiếu nại, tố cáo đông người', 696, 'Tuần', 'CSDL/Excel Ban Nội chính']
            ]
        },
        {
            id: 'dang-tuyen-giao', name: 'Ban Tuyên giáo và Dân vận Thành ủy', field: 'Thành ủy', desc: 'Mô hình dân vận khéo, học tập quán triệt nghị quyết/chỉ thị và nắm bắt dư luận xã hội.', types: ['CSDL', 'Excel'], items: [
                ['Ban Tuyên giáo & Dân vận - Đăng ký mô hình dân vận khéo', 10972, 'Năm', 'CSDL/Excel Ban Tuyên giáo'],
                ['Ban Tuyên giáo & Dân vận - Học tập quán triệt nghị quyết, chỉ thị', 15, 'Quý', 'CSDL/Excel Ban Tuyên giáo', [P('Đối tượng', [['Cán bộ chủ chốt', 420], ['Đảng viên', 3860], ['Quần chúng, đoàn viên, hội viên', 1240]])]],
                ['Ban Tuyên giáo & Dân vận - Nắm bắt dư luận xã hội', 2410, 'Tuần', 'CSDL/Excel Ban Tuyên giáo']
            ]
        }
    ],
    HDND: [
        { id: 'hdnd-nhiem-vu', name: 'HĐND · Theo dõi nhiệm vụ', field: 'HĐND', desc: 'Thống kê số lượng, tình trạng nhận và giao nhiệm vụ của khối HĐND Thành phố.', types: ['API'], items: [['Theo dõi nhiệm vụ (HĐND)', 60, 'Ngày', 'Đồng bộ dữ liệu API']] }
    ],
    MTTQ: [
        { id: 'mttq-nhiem-vu', name: 'MTTQ · Theo dõi nhiệm vụ', field: 'MTTQ', desc: 'Thống kê số lượng, tình trạng nhận và giao nhiệm vụ của khối MTTQ Thành phố.', types: ['API'], items: [['Theo dõi nhiệm vụ (MTTQ)', 60, 'Ngày', 'Đồng bộ dữ liệu API']] },
        {
            id: 'mttq-quy', name: 'MTTQ · Quỹ và an sinh', field: 'MTTQ', desc: 'Thu chi Quỹ "Vì người nghèo", vận động tặng quà Tết và ủng hộ Quỹ "Vì biển, đảo Việt Nam".', types: ['Excel', 'CSDL'], items: [
                ['Thu chi quỹ "Vì người nghèo" (triệu đồng)', 15, '', 'Excel/CSDL MTTQ', [P('Loại', [['Thu quỹ', 680], ['Chi hỗ trợ', 540]])]],
                ['Tình hình vận động thu quỹ "Vì người nghèo"', 15, '', 'Excel/CSDL MTTQ', [P('Nguồn vận động', [['Cán bộ, công chức', 280], ['Doanh nghiệp', 420], ['Nhân dân', 680], ['Nguồn khác', 120]])]],
                ['Cơ cấu kết quả vận động nguồn lực hỗ trợ tặng quà Tết theo các cấp', 15, 'Quý', 'Excel/CSDL MTTQ', [P('Cấp vận động', [['Cấp Thành phố', 420], ['Cấp quận/huyện', 680], ['Cấp xã/phường', 940]])]],
                ['Cơ cấu kết quả hỗ trợ tặng quà Tết theo nguồn quỹ', 15, 'Quý', 'Excel/CSDL MTTQ', [P('Nguồn quỹ', [['Ngân sách hỗ trợ', 380], ['Quỹ Vì người nghèo', 620], ['Xã hội hóa, doanh nghiệp', 480]])]],
                ['Thống kê ủng hộ quỹ "Vì biển, đảo Việt Nam"', 15, 'Quý', 'Excel/CSDL MTTQ', [P('Đối tượng ủng hộ', [['Cán bộ, công chức, viên chức', 420], ['Doanh nghiệp', 280], ['Nhân dân', 680]])]]
            ]
        }
    ],
    UBND: [
        {
            id: 'ubnd-vhtt', name: 'Sở Văn hóa và Thể thao', field: 'Văn hóa - Thể thao', desc: 'Bộ chỉ tiêu STT 66-67 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                ['Số hoạt động nghệ thuật chuyên nghiệp', 186, 'Quý', 'File', [P('Loại hình', [['Liên hoan', 62], ['Hội diễn', 78], ['Hội thi', 46]]), P('Tính chất', [['Có thu', 104], ['Phục vụ chính trị', 82]]), P('Quy mô', [['Quốc gia', 35], ['Thành phố', 151]])]],
                ['Doanh thu của các đơn vị nghệ thuật Thành phố quản lý (42.800 triệu đồng)', 24, 'Quý', 'File', []]
            ]
        },
        {
            id: 'ubnd-gddt', name: 'Sở Giáo dục và Đào tạo', field: 'Giáo dục', desc: 'Tổng quan số liệu toàn ngành và mạng lưới trường học.', types: ['API'], items: [
                ['Sở GD&ĐT - Tổng quan số liệu toàn ngành', 30, '', 'Kết nối API', [S('Quy mô toàn ngành', [['Tổng số trường', 2963], ['Trường đạt chuẩn quốc gia', 1868], ['Tổng số lớp học', 50523], ['Tổng số phòng học', 41332]]), S('Nhân lực - học sinh', [['Tổng học sinh', 1918158], ['Tổng giáo viên', 144292], ['Tổng nhân sự', 186401]]), S('Sức khỏe & chính sách học sinh', [['HS biết bơi', 639081], ['HS có tật về mắt', 492302], ['HS diện chính sách', 51063]])]],
                ['Sở GD&ĐT - Tổng quan mạng lưới trường học', 30, '', 'Kết nối API', [P('Top 8 đơn vị theo số học sinh', [['Phường Hà Đông', 61084], ['Phường Từ Liêm', 53054], ['Phường Yên Hòa', 51622], ['Phường Cầu Giấy', 35595], ['Phường Nghĩa Đô', 34641], ['Phường Vĩnh Tuy', 33802], ['Xã Gia Lâm', 32804], ['Phường Thanh Xuân', 31094]]), P('Top 8 đơn vị chênh lệch số HS giữa 2 nguồn', [['Phường Vĩnh Tuy', 18243], ['Phường Yên Hòa', 13952], ['Phường Nghĩa Đô', 9833], ['Phường Từ Liêm', 8993], ['Xã Gia Lâm', 8833], ['Phường Định Công', 8050], ['Phường Tây Mỗ', 7236], ['Phường Cầu Giấy', 5288]])]]
            ]
        },
        {
            id: 'ubnd-nnmt', name: 'Sở Nông nghiệp và Môi trường (hợp nhất từ Sở NN&PTNT và Sở TN&MT)', field: 'Nông nghiệp - Môi trường', desc: 'Bộ chỉ tiêu STT 17-19, 75, 76, 78, 79, 81-83 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                ['Tỷ lệ xã được công nhận đạt chuẩn nông thôn mới', 126, 'Quý', 'File', [P('Mức đạt chuẩn', [['NTM nâng cao', 68], ['NTM kiểu mẫu', 34], ['Chưa đạt nâng cao/kiểu mẫu', 24]])]],
                ['Diện tích rừng bị thiệt hại (ha)', 186, 'Quý', 'File', [P('Nguyên nhân', [['Bị chặt phá', 62], ['Bị cháy', 84], ['Nguyên nhân khác', 40]])]],
                ['Diện tích rừng trồng mới tập trung (ha)', 420, 'Quý', 'File', []],
                ['Chương trình mục tiêu quốc gia về xây dựng nông thôn mới', 2860, 'Quý', 'File', [P('Nguồn vốn theo kế hoạch (tỷ đồng)', [['NS Trung ương', 980], ['NS Địa phương', 1240], ['Tín dụng', 420], ['Doanh nghiệp', 140], ['Đóng góp người dân', 80]]), S('Kết quả thực hiện', [['Tỷ lệ giải ngân so kế hoạch (%)', 62.4], ['Tỷ lệ dự án hoàn thành đúng tiến độ (%)', 78.6], ['Thu nhập bình quân đầu người nông thôn (triệu đồng/năm)', 68.2], ['Tỷ lệ tham gia BHYT (%)', 94.8], ['Tỷ lệ hộ dùng nước sạch (%)', 96.5]])]],
                ['Chương trình mục tiêu quốc gia giảm nghèo bền vững', 1420, 'Quý', 'File', [P('Nguồn vốn theo kế hoạch (tỷ đồng)', [['NS Trung ương', 520], ['NS Địa phương', 640], ['Tín dụng', 180], ['Doanh nghiệp', 50], ['Đóng góp người dân', 30]]), S('Kết quả thực hiện', [['Tỷ lệ hộ nghèo (%)', 0.8], ['Tỷ lệ hộ cận nghèo (%)', 1.4], ['Lao động hộ nghèo được hỗ trợ đào tạo nghề', 680]])]],
                ['Các thông tin về khí tượng thủy văn', 365, 'Ngày', 'File', []],
                ['Các thông tin về công trình phòng chống thiên tai', 248, 'Quý', 'File', [P('Loại công trình', [['Hồ chứa thủy lợi', 42], ['Thủy điện', 18], ['Đê điều', 126], ['Sạt lở bờ sông, bờ biển', 62]])]],
                ['Số hộ/người được hỗ trợ lương thực do thiên tai, hỏa hoạn, giáp hạt', 1860, 'Quý', 'File', []],
                ['Tổng số gạo hỗ trợ (tấn)', 3200, 'Quý', 'File', []],
                ['Các dữ liệu về bản đồ và ảnh viễn thám', 18, 'Quý', 'File', [P('Loại dữ liệu', [['Bản đồ rủi ro thiên tai', 6], ['Sạt lở', 4], ['Ngập lụt', 5], ['Ảnh vệ tinh', 3]])]],
                ['Tổng hợp dữ liệu GPMB', 14, 'Tuần', 'File'],
                ['Thống kê tình hình sử dụng đất đai (ha)', 3, 'Năm', 'File']
            ]
        },
        {
            id: 'ubnd-yte', name: 'Sở Y tế', field: 'Y tế', desc: 'Bộ chỉ tiêu STT 36, 37, 46 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                ['Số vụ ngộ độc thực phẩm và mức độ thiệt hại', 42, '', 'File', [S('Mức độ thiệt hại', [['Số vụ', 42], ['Số người bị ngộ độc', 386], ['Số người chết', 2]])]],
                ['Dịch bệnh nhóm A, B theo Luật Phòng chống bệnh truyền nhiễm', 1860, 'Tuần', 'File', [S('Tình hình dịch', [['Số người nhiễm', 1860], ['Số người tử vong', 4]])]],
                ['Bảo trợ xã hội', 60, '', 'File', [P('Đối tượng', [['Trợ cấp xã hội hàng ', 32400], ['Hỗ trợ kinh phí chăm sóc hàng ', 8600], ['Người khuyết tật được cấp giấy chứng nhận', 5200], ['Người khuyết tật được cấp thẻ BHYT', 2400]])]]
            ]
        },
        {
            id: 'ubnd-taichinh', name: 'Sở Tài chính (hợp nhất từ Sở Kế hoạch và Đầu tư và Sở Tài chính)', field: 'Tài chính - Ngân sách', desc: 'Bộ chỉ tiêu STT 2, 3, 5, 6, 7, 8, 11, 12, 21, 55, 57, 58, 80 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['Excel', 'CSDL'], items: [
                ['Thu ngân sách nhà nước (tỷ đồng)', 36, '', 'CSDL', [S('So với dự toán', [['Lũy kế đến kỳ báo cáo', 186500], ['Dự toán năm', 420000]])]],
                ['Thuế, phí, lệ phí và các khoản thu khác NSNN (tỷ đồng)', 36, '', 'CSDL', [P('Sắc thuế chính', [['Thuế GTGT', 52400], ['Thuế TNDN', 38600], ['Thuế TNCN', 29800], ['Phí, lệ phí và khoản thu khác', 21500]])]],
                ['Gạo xuất cấp hỗ trợ các địa phương (tấn)', 3200, 'Quý', 'File', [P('Mục đích', [['Cứu đói giáp hạt', 1400], ['Khắc phục thiên tai', 1100], ['Hỗ trợ khác', 700]])]],
                ['Doanh nghiệp', 60, '', 'CSDL', [P('Theo phân ngành kinh tế (VSIC)', [['Công nghiệp - Xây dựng', 18600], ['Thương mại - Dịch vụ', 26400], ['Nông - Lâm - Thủy sản', 3200], ['Ngành khác', 6000]]), S('Tình hình hoạt động', [['Đang hoạt động', 54200], ['Thành lập mới', 4800], ['Quay trở lại hoạt động', 1600], ['Tạm ngừng kinh doanh', 2100], ['Chờ giải thể', 540], ['Đã giải thể', 380]])]],
                ['Đấu thầu', 2860, 'Quý', 'CSDL', [P('Theo phân ngành kinh tế (VSIC)', [['Xây dựng', 1240], ['Y tế - Giáo dục', 480], ['CNTT - Viễn thông', 360], ['Ngành khác', 780]]), S('Kết quả đấu thầu', [['Tổng số gói thầu', 2860], ['Tổng giá trị trúng thầu (tỷ đồng)', 18400], ['Tỷ lệ tiết kiệm (%)', 8.6]])]],
                ['Hợp tác xã, kinh tế tập thể', 1850, 'Quý', 'CSDL', [P('Theo phân ngành kinh tế (VSIC)', [['Nông nghiệp', 920], ['Công nghiệp - TTCN', 380], ['Thương mại - Dịch vụ', 420], ['Ngành khác', 130]]), S('Biến động', [['Đang hoạt động', 1850], ['Thành lập mới', 86], ['Giải thể', 34], ['Vốn điều lệ HTX thành lập mới (tỷ đồng)', 142]])]],
                ['Vốn đầu tư có yếu tố nước ngoài (triệu USD)', 4820, '', 'CSDL', [S('Cơ cấu vốn FDI', [['Vốn đầu tư thực hiện', 2650], ['Vốn đăng ký cấp mới', 1680], ['Vốn đăng ký điều chỉnh', 490], ['Góp vốn mua cổ phần', 380]]), S('Dự án', [['Số dự án cấp mới', 186], ['Số lượt dự án điều chỉnh', 94]])]],
                ['Dự án đầu tư công', 420, 'Quý', 'CSDL', [P('Theo phân ngành kinh tế (VSIC)', [['Giao thông', 148], ['Giáo dục - Y tế', 96], ['Hạ tầng đô thị', 112], ['Ngành khác', 64]]), S('Giải ngân', [['Tổng vốn đầu tư (tỷ đồng)', 68400], ['Tỷ lệ giải ngân so kế hoạch (%)', 54.2]])]],
                ['Dự án quan trọng quốc gia, công trình trọng điểm giao thông vận tải', 18, 'Quý', 'File', [S('Tiến độ tổng hợp', [['Tổng vốn đầu tư (tỷ đồng)', 186000], ['Tiến độ giải ngân (%)', 42.5], ['Tiến độ thi công (%)', 58]])]],
                ['Số dự án, số vốn đầu tư bằng nguồn vốn trong nước ngoài ngân sách nhà nước được cấp chủ trương đầu tư', 96, 'Quý', 'CSDL', [P('Ngành kinh tế', [['Bất động sản', 34], ['Công nghiệp', 28], ['Thương mại - Dịch vụ', 22], ['Ngành khác', 12]])]],
                ['Thu ngân sách nhà nước và cơ cấu thu (tỷ đồng)', 36, '', 'CSDL', [P('Lĩnh vực thu', [['Thu nội địa', 158200], ['Thu từ hoạt động xuất nhập khẩu', 24600], ['Thu viện trợ', 1200], ['Thu khác', 2500]])]],
                ['Chi ngân sách nhà nước và cơ cấu chi (tỷ đồng)', 36, '', 'CSDL', [P('Khoản chi chủ yếu', [['Chi đầu tư phát triển', 58600], ['Chi thường xuyên', 76400], ['Chi trả nợ lãi', 7800]])]],
                ['Các thông tin về dân sinh – kinh tế', 126, 'Quý', 'File', [S('Chỉ tiêu tổng hợp', [['Dân cư (nghìn người)', 8580], ['Nhà ở (nghìn căn)', 2140], ['Đất diện tích trồng trọt (ha)', 86500], ['Số đầu con trong chăn nuôi (nghìn con)', 4250], ['Diện tích thủy sản (ha)', 24800], ['Số hộ thiếu đói', 86]])]],
                ['Tình hình thu ngân sách so với dự toán', 10, 'Quý', 'CSDL'],
                ['Tổng mức lưu chuyển hàng hóa và doanh thu dịch vụ tiêu dùng xã hội', 10, 'Quý', 'CSDL'],
                ['Vốn đầu tư phát triển toàn xã hội thực hiện theo giá hiện hành', 10, 'Quý', 'CSDL'],
                ['Vốn đầu tư thực hiện từ nguồn NSNN do địa phương quản lý', 10, 'Quý', 'CSDL'],
                ['Chỉ số sản xuất công nghiệp so với cùng kỳ năm trước', 10, 'Quý', 'CSDL'],
                ['Tiến độ hoàn thành các dự án trọng điểm', 10, 'Quý', 'CSDL'],
                ['Doanh thu vận tải, kho bãi, dịch vụ hỗ trợ vận tải và bưu chính chuyển phát', 10, 'Quý', 'CSDL'],
                ['Khách du lịch đến Hà Nội (do cơ sở lưu trú phục vụ)', 10, 'Quý', 'CSDL'],
                ['Kim ngạch xuất nhập khẩu', 10, 'Quý', 'CSDL'],
                ['Chỉ số giá tiêu dùng, giá vàng, đô la Mỹ', 10, 'Quý', 'CSDL'],
                ['Tình hình chi ngân sách địa phương', 10, 'Quý', 'CSDL']
            ]
        },
        {
            id: 'ubnd-noivu', name: 'Sở Nội vụ (hợp nhất từ Sở Nội vụ và Sở Lao động - Thương binh và Xã hội)', field: 'Nội vụ', desc: 'Bộ chỉ tiêu STT 42, 47, 53 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                ['Lao động', 60, 'Quý', 'File', [P('Loại hình lao động', [['LĐ Việt Nam đi làm việc ở nước ngoài theo hợp đồng', 8600], ['LĐ nước ngoài làm việc tại Việt Nam', 5200], ['Giao dịch việc làm', 38600]])]],
                ['Công chức, viên chức (186.401 biên chế thực hiện)', 60, 'Quý', 'File', [S('Biên chế', [['Biên chế được giao', 168500], ['Biên chế thực hiện', 162300], ['Biên chế hưởng lương từ NSNN', 159800]]), P('Biến động trong kỳ', [['Tuyển mới', 4200], ['Nghỉ hưu', 3100], ['Thôi việc', 1800], ['Chuyển công tác ra khỏi cơ quan', 950]])]],
                ['Chỉ số cải cách hành chính của thành phố (89,4 điểm)', 12, 'Năm', 'File', []],
                ['Doanh nghiệp tham gia tuyển dụng', 64, 'Quý', 'File'],
                ['Tổng số nhu cầu tuyển dụng', 443, 'Quý', 'File'],
                ['Số hồ sơ tìm việc', 652, 'Quý', 'File'],
                ['Tổng số chi trả an sinh cho người có công', 1, '', 'File'],
                ['Tổng số CCVC khối chính quyền', 20, 'Năm', 'File']
            ]
        },
        { id: 'ubnd-tuphap', name: 'Sở Tư pháp', field: 'Tư pháp', desc: 'Theo phụ lục khảo sát chỉ tiêu theo sở, Sở Tư pháp hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.', types: [], items: [], noItems: true },
        {
            id: 'ubnd-congthuong', name: 'Sở Công Thương', field: 'Công Thương', desc: 'Bộ chỉ tiêu STT 15, 16, 25 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                ['Xăng dầu (nghìn m3)', 1240, '', 'File', [P('Nguồn cung', [['Sản xuất trong nước', 780], ['Nhập khẩu', 460]])]],
                ['Than (nghìn tấn)', 860, '', 'File', [P('Nguồn cung', [['Sản xuất trong nước', 520], ['Nhập khẩu', 340]])]],
                ['Thương mại điện tử', 24, '', 'File', [S('Chỉ số tổng hợp', [['Doanh thu TMĐT (tỷ đồng)', 48600], ['Tỷ lệ đóng góp vào tổng mức bán lẻ (%)', 14.8], ['Số người mua sắm trực tuyến (nghìn người)', 3860], ['Giá trị GD trung bình/người mua (nghìn đồng)', 1260], ['Chỉ số phát triển hạ tầng logistics', 72.4], ['Mức độ phổ biến thanh toán điện tử (%)', 68.5]]), P('Phương thức thanh toán', [['Ví điện tử', 38], ['Thẻ ngân hàng', 34], ['Tiền mặt khi nhận hàng', 22], ['Khác', 6]]), P('Kênh mua sắm phổ biến', [['Sàn TMĐT', 46], ['Mạng xã hội', 28], ['Website doanh nghiệp', 18], ['Ứng dụng giao đồ ăn', 8]])]]
            ]
        },
        {
            id: 'ubnd-xaydung', name: 'Sở Xây dựng', field: 'Xây dựng', desc: 'Bộ chỉ tiêu STT 20, 84 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                ['Nhà ở và thị trường bất động sản', 48, 'Quý', 'File', [P('Phân loại công trình', [['Nhà ở thương mại', 9600], ['Nhà ở xã hội', 4200], ['Nhà ở riêng lẻ', 8400], ['Chung cư tái định cư', 2600]]), S('Diện tích xây dựng', [['Tổng diện tích (triệu m2)', 18.6]])]],
                ['Các thông tin dữ liệu về giao thông vận tải', 86, 'Quý', 'File', [P('Loại nguy cơ', [['Sạt lở', 34], ['Úng ngập', 52]])]]
            ]
        },
        { id: 'ubnd-khcn', name: 'Sở Khoa học và Công nghệ (hợp nhất từ Sở TT&TT và Sở KH&CN)', field: 'Khoa học - Công nghệ', desc: 'Theo phụ lục khảo sát chỉ tiêu theo sở, Sở Khoa học và Công nghệ hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.', types: [], items: [], noItems: true },
        {
            id: 'ubnd-dantoc-tongiao', name: 'Sở Dân tộc và Tôn giáo', field: 'Dân tộc - Tôn giáo', desc: 'Bộ chỉ tiêu STT 77 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                ['Chương trình mục tiêu quốc gia về phát triển kinh tế - xã hội vùng đồng bào dân tộc và miền núi', 680, 'Quý', 'File', [P('Nguồn vốn theo kế hoạch (tỷ đồng)', [['NS Trung ương', 280], ['NS Địa phương', 260], ['Tín dụng', 90], ['Doanh nghiệp', 30], ['Đóng góp người dân', 20]]), S('Kết quả thực hiện', [['Tỷ lệ hộ DTTS dùng nước sinh hoạt hợp vệ sinh (%)', 92.4], ['Tỷ lệ xã có đường ô tô đến trung tâm được cứng hóa (%)', 96.8], ['Tỷ lệ học sinh đi học đúng cấp học (%)', 97.2], ['Tỷ lệ giảm hộ nghèo tại xã/thôn khó khăn (%)', 2.6]])]]
            ]
        },
        {
            id: 'ubnd-dulich', name: 'Sở Du lịch', field: 'Du lịch', desc: 'Bộ chỉ tiêu STT 22, 23, 65 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                ['Số lượt khách du lịch nội địa (18.600 nghìn lượt)', 36, '', 'File', []],
                ['Số lượt khách du lịch quốc tế (nghìn lượt)', 4860, '', 'File', [P('Lưu trú', [['Có lưu trú', 3420], ['Không lưu trú', 1440]]), P('Thị trường trọng điểm', [['Trung Quốc', 1240], ['Hàn Quốc', 980], ['Ấn Độ', 620], ['Pháp', 480], ['Nhật Bản', 540], ['Thị trường khác', 1000]])]],
                ['Tổng thu từ khách du lịch (86.400 tỷ đồng)', 36, '', 'File', [P('Nhóm khách', [['Khách nội địa', 48600], ['Khách quốc tế', 37800]])]]
            ]
        },
        { id: 'ubnd-quyhoach-kientruc', name: 'Sở Quy hoạch - Kiến trúc', field: 'Quy hoạch - Kiến trúc', desc: 'Theo phụ lục khảo sát chỉ tiêu theo sở, Sở Quy hoạch - Kiến trúc hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.', types: [], items: [], noItems: true },
        { id: 'ubnd-so14', name: 'Sở/đơn vị chuyên môn thứ 14 (PMO xác nhận theo danh mục chính thức)', field: '', desc: 'Theo phụ lục khảo sát chỉ tiêu theo sở, đơn vị này hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.', types: [], items: [], noItems: true },
        {
            id: 'ubnd-thanhtra', name: 'Thanh tra Thành phố', field: 'Thanh tra', desc: 'Bộ chỉ tiêu STT 39, 40, 41 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                ['Thanh tra', 186, 'Quý', 'File', [S('Kết quả', [['Số đơn vị được thanh tra', 186], ['Đã ban hành kết luận', 162], ['Kiến nghị xử lý', 94]])]],
                ['Kiểm tra Chủ tịch UBND xã, phường, người đứng đầu cơ quan chuyên môn, tổ chức hành chính khác, đơn vị sự nghiệp công lập trong việc thực hiện pháp luật về tiếp công dân, giải quyết khiếu nại, tố cáo và phòng, chống tham nhũng, tiêu cực', 126, 'Quý', 'File', [S('Kết quả', [['Số đơn vị được kiểm tra', 126], ['Đã ban hành kết luận', 108], ['Kiến nghị xử lý', 46]])]],
                ['Tiếp công dân, giải quyết khiếu nại, tố cáo', 2860, 'Tuần', 'File', [S('Kết quả', [['Số cuộc tiếp công dân', 2860], ['Tiếp nhận đơn thư', 1940], ['Kết quả giải quyết vụ việc, khiếu nại, tố cáo', 1680]])]]
            ]
        },
        {
            id: 'ubnd-vpubnd', name: 'Văn phòng UBND Thành phố Hà Nội', field: 'Văn phòng UBND', desc: 'Bộ chỉ tiêu STT 74 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['API'], items: [
                ['Nhóm chỉ số theo dõi việc thực hiện nhiệm vụ Chính phủ, Thủ tướng Chính phủ giao', 4860, '', 'API', [P('Tình trạng thực hiện (lũy kế)', [['Hoàn thành đúng hạn', 3260], ['Hoàn thành quá hạn', 420], ['Chưa hoàn thành quá hạn', 180], ['Đang triển khai', 1000]])]]
            ]
        },
        {
            id: 'ubnd-bqlkcnc', name: 'Ban Quản lý Khu công nghệ cao và khu công nghiệp thành phố', field: 'Khu công nghệ cao - KCN', desc: 'Bộ chỉ tiêu STT 9, 10 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                ['Khu công nghiệp, khu chế xuất, khu kinh tế', 186, 'Quý', 'File', [S('Tình hình hoạt động', [['Số lượng thành lập, điều chỉnh', 18], ['Thu hút đầu tư (dự án)', 42], ['Đầu tư kết cấu hạ tầng (%)', 86.4]])]],
                ['Khu Công nghệ cao', 48, 'Quý', 'File', [S('Tình hình hoạt động', [['Số lượng thành lập, điều chỉnh', 6], ['Thu hút đầu tư (dự án)', 14], ['Đầu tư kết cấu hạ tầng (%)', 92.1]])]]
            ]
        }
    ]
};

const taskTitlePool = {
    DANG: ['Rà soát, tổng hợp nhiệm vụ thực hiện Nghị quyết 57-NQ/TW', 'Tổng hợp số liệu công tác cán bộ, Đảng viên (Ban Tổ chức)', 'Tổng hợp kết quả kiểm tra - giám sát (UBKT Thành ủy)', 'Xử lý đơn thư, tiếp công dân (Ban Nội chính)', 'Tổng hợp dư luận xã hội, mô hình dân vận khéo (Ban Tuyên giáo)', 'Chuẩn bị nội dung giao ban Thường trực Thành ủy'],
    HDND: ['Theo dõi tiến độ thực hiện nghị quyết HĐND Thành phố', 'Tổng hợp kết quả giám sát chuyên đề', 'Giải quyết kiến nghị cử tri', 'Chuẩn bị nội dung kỳ họp HĐND Thành phố', 'Rà soát báo cáo chất vấn, trả lời chất vấn', 'Theo dõi các dự án, công trình trọng điểm'],
    UBND: ['Tổng hợp số liệu ngành Giáo dục và Đào tạo', 'Tổng hợp số liệu Nông nghiệp và Môi trường (GPMB, AQI)', 'Tổng hợp tình hình dịch bệnh, khám chữa bệnh (Sở Y tế)', 'Xử lý hồ sơ tại Trung tâm Phục vụ hành chính công', 'Tổng hợp chỉ số kinh tế - tài chính - ngân sách (Sở Tài chính)', 'Tổng hợp số liệu tổ chức - biên chế (Sở Nội vụ)', 'Điều phối, giao ban khối chính quyền'],
    MTTQ: ['Tổng hợp phản biện xã hội, giám sát cộng đồng', 'Theo dõi thu chi Quỹ "Vì người nghèo"', 'Tổng hợp vận động Quỹ "Vì biển, đảo Việt Nam"', 'Tổng hợp kết quả hỗ trợ, tặng quà Tết', 'Theo dõi hoạt động Đoàn Thanh niên, Hội Phụ nữ, CCB, Công đoàn', 'Tổng hợp ý kiến nhân dân qua các đợt khảo sát IOC']
};
const fieldPool = {
    DANG: ['Điều hành – chỉ đạo', 'Tổ chức cán bộ (Ban Tổ chức)', 'Kiểm tra – giám sát (UBKT)', 'Nội chính – tiếp công dân', 'Tuyên giáo – dân vận', 'Nghị quyết 57-NQ/TW', 'Văn bản điều hành'],
    HDND: ['Điều hành kỳ họp', 'Theo dõi nghị quyết', 'Giám sát chuyên đề', 'Cử tri – kiến nghị'],
    UBND: ['Giáo dục và Đào tạo', 'Nông nghiệp và Môi trường', 'Y tế', 'Hành chính công', 'Tài chính – ngân sách', 'Nội vụ', 'Kinh tế – xã hội', 'Văn bản điều hành'],
    MTTQ: ['Phản biện xã hội', 'Quỹ vì người nghèo', 'Quỹ biển đảo', 'Tặng quà Tết', 'Đoàn thể chính trị - xã hội']
};
const units = ['Văn phòng Thành ủy', 'Ban Tổ chức Thành ủy', 'Ủy ban Kiểm tra Thành ủy', 'Ban Nội chính Thành ủy', 'Ban Tuyên giáo và Dân vận Thành ủy', 'Văn phòng HĐND Thành phố', 'Văn phòng UBND Thành phố', 'Sở Giáo dục và Đào tạo', 'Sở Nông nghiệp và Môi trường', 'Sở Y tế', 'Trung tâm Phục vụ hành chính công Thành phố', 'Sở Tài chính', 'Sở Nội vụ', 'Ủy ban MTTQ Việt Nam Thành phố'];
const docTypeOptions = ['Công văn', 'Đơn thư', 'Tường trình', 'Quyết định', 'Thông báo', 'Cảnh cáo'];
const docTypeCodePrefix = { 'Công văn': 'CV', 'Đơn thư': 'DT', 'Tường trình': 'TT', 'Quyết định': 'QD', 'Thông báo': 'TB', 'Cảnh cáo': 'CB' };
const docSignerPool = {
    DANG: ['Nguyễn Văn Phong', 'Trần Thị Hạnh'],
    HDND: ['Trần Thị Hạnh', 'Nguyễn Văn Phong'],
    UBND: ['Nguyễn Văn Phong', 'Trần Thị Hạnh', 'Nguyễn Đình Trường'],
    MTTQ: ['Trần Thị Hạnh', 'Nguyễn Đình Trường']
};
const docIssuerPool = { DANG: 'Thành ủy Hà Nội', HDND: 'HĐND Thành phố Hà Nội', UBND: 'UBND Thành phố Hà Nội', MTTQ: 'Ủy ban MTTQ Việt Nam Thành phố Hà Nội' };
const docTopicPhrases = ['đôn đốc tiến độ thực hiện', 'hướng dẫn triển khai', 'phê duyệt kế hoạch', 'kiện toàn tổ chức', 'thông báo kết luận giao ban', 'tổng hợp báo cáo kết quả', 'xử lý phản ánh, kiến nghị', 'rà soát, cập nhật số liệu', 'chỉ đạo tăng cường công tác', 'thành lập tổ công tác', 'ban hành quy định tạm thời', 'sơ kết, tổng kết công tác', 'phối hợp thực hiện nhiệm vụ', 'khảo sát, đánh giá hiện trạng'];
/* Sinh nội dung 1 văn bản (số/ký hiệu, tiêu đề, trích yếu, người ký, cơ quan...) theo mẫu thực tế, biến thiên theo lĩnh vực/trục — deterministic (không Math.random) để demo ổn định. */
function buildDocumentContent(role, idx) {
    const docType = pick(docTypeOptions, idx);
    const fieldName = pick(fieldPool[role], idx + 3);
    const topic = pick(docTopicPhrases, idx);
    const signer = pick(docSignerPool[role], idx);
    const issuer = /an ninh|trật tự|pccc/i.test(fieldName) ? 'Công an Thành phố Hà Nội' : docIssuerPool[role];
    const code = `${docTypeCodePrefix[docType]}-2026-${String(idx + 1).padStart(3, '0')}`;
    const title = `${docType} ${topic} thuộc lĩnh vực ${fieldName}`;
    const summary = `V/v ${topic} lĩnh vực ${fieldName.toLowerCase()} tại Thành phố Hà Nội`;
    return { code, title, summary, signer, issuer, docType, field: fieldName };
}

/* Kịch bản xử lý dùng chung cho hồ sơ/nhiệm vụ và chỉ tiêu */
const DEFAULT_SCENARIOS = {
    overdue: {
        title: 'Kịch bản xử lý quá hạn', level: 'Khẩn', desc: 'Dùng khi nhiệm vụ/văn bản/chỉ tiêu đã quá hạn hoặc chưa có kết quả trong thời gian cam kết.',
        objective: 'Phát hiện, cảnh báo và xử lý dứt điểm các nhiệm vụ/văn bản/chỉ tiêu đã quá hạn cam kết, đảm bảo có kết quả và trách nhiệm rõ ràng.',
        scope: 'Áp dụng cho toàn bộ nhiệm vụ, văn bản, chỉ tiêu do các đơn vị thuộc phường Việt Hưng chủ trì hoặc phối hợp xử lý, khi đã vượt hạn xử lý trên hệ thống IOC.',
        process: [{ step: 'Thu thập & đồng bộ dữ liệu', desc: 'Hệ thống tự động quét trạng thái, hạn xử lý của nhiệm vụ/văn bản/chỉ tiêu từ các nguồn kết nối IOC.' }, { step: 'Phân tích, đối chiếu, phát hiện bất thường', desc: 'So sánh hạn xử lý với thời điểm hiện tại để xác định các hồ sơ đã quá hạn, xác minh nguyên nhân và đơn vị phụ trách.' }, { step: 'Cảnh báo', desc: 'Gửi cảnh báo tới đơn vị chủ trì và lãnh đạo phụ trách ngay khi phát hiện quá hạn.' }, { step: 'Đề xuất phương án xử lý', desc: 'Yêu cầu đơn vị chủ trì báo cáo tiến độ, đề xuất mốc hoàn thành mới và giao nhiệm vụ nhánh cụ thể.' }, { step: 'Theo dõi kết quả & báo cáo', desc: 'Theo dõi đến khi có đủ minh chứng xử lý, cập nhật trạng thái và tổng hợp báo cáo lãnh đạo.' }],
        expectedResults: ['Rút ngắn thời gian phát hiện và xử lý hồ sơ quá hạn', 'Xác định rõ trách nhiệm đơn vị chủ trì', 'Giảm tồn đọng nhiệm vụ/văn bản quá hạn theo thời gian'],
        leadUnit: 'Văn phòng UBND phường', coordUnits: ['Văn phòng Đảng ủy', 'Công chức Văn phòng - Thống kê', 'Trực IOC/CAD'],
        sla: ['15 phút xác nhận', 'Trong ngày có phương án', '24h báo cáo kết quả'], tasks: [['Xác minh nguyên nhân quá hạn', 'Rà soát hồ sơ, xác định nút nghẽn, người phụ trách và thời điểm bắt đầu quá hạn.', 'Văn phòng UBND'], ['Yêu cầu đơn vị chủ trì cập nhật tiến độ', 'Gửi nhắc việc, yêu cầu nêu rõ kết quả đã làm, khó khăn và thời hạn hoàn thành mới.', 'Công chức Văn phòng - Thống kê'], ['Báo cáo lãnh đạo phụ trách', 'Tổng hợp tình trạng quá hạn và đề xuất chỉ đạo/đôn đốc.', 'Văn phòng Đảng ủy'], ['Cập nhật minh chứng xử lý', 'Đính kèm văn bản, file dữ liệu, ảnh hiện trường hoặc biên bản làm việc.', 'Đơn vị chuyên môn'], ['Đóng vòng xử lý sau khi có kết quả', 'Kiểm tra đủ minh chứng, cập nhật trạng thái và ghi nhật ký kết thúc.', 'Trực IOC/CAD']]
    },
    slow: {
        title: 'Kịch bản chậm tiến độ / nguy cơ trễ hạn', level: 'Cao', desc: 'Dùng khi nhiệm vụ chưa quá hạn nhưng tiến độ thấp, thiếu minh chứng hoặc có cảnh báo nguy cơ không hoàn thành.',
        objective: 'Phát hiện sớm các nhiệm vụ có tiến độ thấp hoặc nguy cơ không hoàn thành đúng hạn để can thiệp trước khi phát sinh quá hạn.',
        scope: 'Áp dụng cho nhiệm vụ, chỉ tiêu chưa quá hạn nhưng có tiến độ dưới ngưỡng an toàn hoặc thiếu minh chứng cập nhật trong khoảng thời gian quy định.',
        process: [{ step: 'Thu thập & đồng bộ dữ liệu', desc: 'Đồng bộ tiến độ và thời hạn còn lại của từng nhiệm vụ/chỉ tiêu theo thời gian thực.' }, { step: 'Phân tích, đối chiếu, phát hiện bất thường', desc: 'So sánh tiến độ thực tế với tiến độ kỳ vọng theo mốc thời gian để xác định nguy cơ trễ hạn.' }, { step: 'Cảnh báo', desc: 'Cảnh báo sớm cho đơn vị chủ trì và cán bộ tổng hợp IOC khi tiến độ dưới ngưỡng an toàn.' }, { step: 'Đề xuất phương án xử lý', desc: 'Chia nhỏ phần việc còn lại, bổ sung đơn vị phối hợp hoặc điều chỉnh nguồn lực xử lý.' }, { step: 'Theo dõi kết quả & báo cáo', desc: 'Thiết lập mốc nhắc tự động, theo dõi đến khi tiến độ trở lại an toàn hoặc hoàn thành đúng hạn.' }],
        expectedResults: ['Giảm số nhiệm vụ chuyển từ nguy cơ sang quá hạn thực tế', 'Tăng tỷ lệ hoàn thành đúng hạn cam kết', 'Phát hiện sớm vướng mắc để bổ sung nguồn lực kịp thời'],
        leadUnit: 'Đơn vị chủ trì nhiệm vụ', coordUnits: ['Cán bộ tổng hợp IOC', 'Lãnh đạo phụ trách', 'Trực IOC/CAD'],
        sla: ['30 phút nhắc việc', '4h cập nhật tiến độ', 'Trước hạn có kết quả'], tasks: [['Đánh giá lại tiến độ thực tế', 'Đối chiếu phần việc đã hoàn thành với thời hạn và sản phẩm đầu ra.', 'Đơn vị chủ trì'], ['Chia nhỏ phần việc còn lại', 'Tách thành các nhiệm vụ nhánh rõ tên việc, chủ trì, hạn xử lý và minh chứng.', 'Cán bộ tổng hợp IOC'], ['Bổ sung đơn vị phối hợp', 'Giao thêm đơn vị hỗ trợ nếu vướng dữ liệu, nhân lực hoặc xác nhận chuyên môn.', 'Lãnh đạo phụ trách'], ['Thiết lập mốc nhắc tự động', 'Đặt notify sắp hạn và cập nhật tiến độ theo từng mốc.', 'Trực IOC/CAD'], ['Cập nhật phương án xử lý thay thế', 'Đề xuất phương án nếu không hoàn thành đúng hạn.', 'Đơn vị chuyên môn']]
    },
    data: {
        title: 'Kịch bản thiếu dữ liệu / dữ liệu chưa xác nhận', level: 'Trung bình', desc: 'Dùng khi chỉ tiêu chưa đủ nguồn, chưa đúng biểu mẫu, thiếu xác nhận hoặc chưa đảm bảo đúng-đủ-sạch-sống.',
        objective: 'Đảm bảo dữ liệu phục vụ điều hành đúng - đủ - sạch - sống trước khi hiển thị chính thức trên dashboard IOC.',
        scope: 'Áp dụng cho các chỉ tiêu, hồ sơ có nguồn dữ liệu chưa đầy đủ, chưa đúng biểu mẫu, thiếu xác nhận hoặc chưa đối chiếu giữa các nguồn.',
        process: [{ step: 'Thu thập & đồng bộ dữ liệu', desc: 'Tổng hợp dữ liệu từ các nguồn được kết nối, xác định định dạng và tần suất cập nhật.' }, { step: 'Phân tích, đối chiếu, phát hiện bất thường', desc: 'Đối chiếu dữ liệu giữa các nguồn, phát hiện sai lệch, thiếu trường hoặc chưa đúng biểu mẫu.' }, { step: 'Cảnh báo', desc: 'Cảnh báo đơn vị cung cấp số liệu về phần dữ liệu chưa đạt yêu cầu đúng-đủ-sạch-sống.' }, { step: 'Đề xuất phương án xử lý', desc: 'Yêu cầu chuẩn hóa biểu mẫu, bổ sung minh chứng và xác nhận số liệu cuối cùng.' }, { step: 'Theo dõi kết quả & báo cáo', desc: 'Theo dõi đến khi dữ liệu được xác nhận, ghi nhận khó khăn vướng mắc còn tồn tại.' }],
        expectedResults: ['Dữ liệu hiển thị trên IOC đảm bảo đúng-đủ-sạch-sống', 'Giảm sai lệch số liệu giữa các nguồn báo cáo', 'Rõ trách nhiệm xác nhận số liệu cuối cùng'],
        leadUnit: 'Cán bộ tổng hợp IOC', coordUnits: ['Đơn vị cung cấp số liệu', 'Lãnh đạo đơn vị chuyên môn'],
        sla: ['Trong ngày rà soát', '24h bổ sung dữ liệu', '48h xác nhận'], tasks: [['Kiểm tra nguồn dữ liệu hiện có', 'Xác định dữ liệu đến từ API, Excel, CSDL, PDF hoặc file cứng.', 'Cán bộ dữ liệu'], ['Chuẩn hóa biểu mẫu theo phụ lục khảo sát', 'Đối chiếu trường dữ liệu, tần suất, đơn vị cung cấp và người xác nhận cuối cùng.', 'Cán bộ tổng hợp IOC'], ['Yêu cầu bổ sung minh chứng', 'Bổ sung file Excel/PDF/ảnh chụp màn hình hoặc trích xuất hệ thống.', 'Đơn vị cung cấp số liệu'], ['Xác nhận số liệu cuối cùng', 'Lãnh đạo/đơn vị được phân công xác nhận số liệu trước khi hiển thị chính thức.', 'Lãnh đạo đơn vị'], ['Ghi nhận khó khăn, vướng mắc', 'Ghi rõ khó khăn tổng hợp, chia sẻ dữ liệu hoặc hệ thống phần mềm.', 'Cán bộ phụ trách']]
    },
    coordinate: {
        title: 'Kịch bản phối hợp liên đơn vị', level: 'Cao', desc: 'Dùng khi nhiệm vụ cần nhiều đơn vị phối hợp, có liên quan địa bàn, lĩnh vực hoặc phát sinh phản ánh công dân.',
        objective: 'Đảm bảo các nhiệm vụ cần nhiều đơn vị phối hợp được phân công rõ vai trò, xử lý đồng bộ và đúng tiến độ.',
        scope: 'Áp dụng cho nhiệm vụ liên quan nhiều lĩnh vực/địa bàn, hoặc phát sinh từ phản ánh của công dân, doanh nghiệp cần phối hợp nhiều đơn vị xử lý.',
        process: [{ step: 'Thu thập & đồng bộ dữ liệu', desc: 'Tiếp nhận nhiệm vụ/phản ánh và xác định các lĩnh vực, đơn vị có liên quan.' }, { step: 'Phân tích, đối chiếu, phát hiện bất thường', desc: 'Xác định đơn vị chủ trì, đơn vị phối hợp và phạm vi dữ liệu mỗi đơn vị được xem.' }, { step: 'Cảnh báo', desc: 'Thông báo phân công tới các đơn vị liên quan kèm thời hạn và yêu cầu phối hợp.' }, { step: 'Đề xuất phương án xử lý', desc: 'Tổ chức trao đổi nhanh, giao nhiệm vụ nhánh theo từng đơn vị với minh chứng cụ thể.' }, { step: 'Theo dõi kết quả & báo cáo', desc: 'Tổng hợp tiến độ từng đơn vị, nhắc việc đơn vị chậm và báo cáo kết quả chung.' }],
        expectedResults: ['Rút ngắn thời gian phối hợp liên đơn vị', 'Rõ vai trò chủ trì - phối hợp trong từng nhiệm vụ', 'Tổng hợp kết quả xử lý đầy đủ, kịp thời'],
        leadUnit: 'Văn phòng UBND phường', coordUnits: ['Các đơn vị chuyên môn liên quan', 'Trực IOC/CAD', 'Lãnh đạo phụ trách'],
        sla: ['1h phân công', 'Trong ngày làm việc', 'Theo mốc giao việc'], tasks: [['Xác định đơn vị chủ trì và phối hợp', 'Làm rõ vai trò chủ trì, phối hợp, thời hạn và phạm vi dữ liệu được xem.', 'Văn phòng UBND phường'], ['Tổ chức trao đổi nhanh', 'Mở kênh trao đổi hoặc cuộc họp ngắn để thống nhất phương án xử lý.', 'Lãnh đạo phụ trách'], ['Giao nhiệm vụ nhánh theo từng đơn vị', 'Tạo việc con cho từng đơn vị, gắn hạn xử lý và minh chứng cụ thể.', 'Trực IOC/CAD'], ['Theo dõi tiến độ từng đơn vị', 'Tổng hợp tiến độ, nhắc việc đơn vị chậm và cảnh báo nguy cơ.', 'Cán bộ tổng hợp IOC'], ['Tổng hợp kết quả chung', 'Gộp kết quả xử lý, đối chiếu minh chứng và trình lãnh đạo.', 'Văn phòng']]
    },
    citizen: {
        title: 'Kịch bản xử lý kiến nghị cử tri', level: 'Cao', desc: 'Dùng cho nhóm ý kiến, kiến nghị cử tri hoặc phản ánh liên quan nhiều đơn vị, cần theo dõi trả lời đúng hạn.',
        objective: 'Đảm bảo các ý kiến, kiến nghị cử tri được phân loại, chuyển đúng đơn vị và trả lời đúng hạn theo quy định giám sát.',
        scope: 'Áp dụng cho các kiến nghị, phản ánh của cử tri thuộc thẩm quyền phường Việt Hưng, liên quan nhiều lĩnh vực đời sống dân sinh.',
        process: [{ step: 'Thu thập & đồng bộ dữ liệu', desc: 'Tiếp nhận và tổng hợp toàn bộ kiến nghị cử tri từ các kênh, kỳ họp HĐND.' }, { step: 'Phân tích, đối chiếu, phát hiện bất thường', desc: 'Phân nhóm nội dung kiến nghị theo lĩnh vực và xác định đơn vị chủ trì trả lời.' }, { step: 'Cảnh báo', desc: 'Cảnh báo các kiến nghị sắp/đã quá hạn trả lời theo quy định giám sát của HĐND.' }, { step: 'Đề xuất phương án xử lý', desc: 'Chuyển đơn vị chuyên môn trả lời, giao nhiệm vụ nhánh nêu rõ hạn và mẫu kết quả.' }, { step: 'Theo dõi kết quả & báo cáo', desc: 'Giám sát tiến độ trả lời, tổng hợp báo cáo kết quả xử lý kiến nghị cử tri.' }],
        expectedResults: ['Kiến nghị cử tri được trả lời đúng hạn, đúng thẩm quyền', 'Tăng tính minh bạch trong theo dõi giám sát', 'Giảm kiến nghị tồn đọng qua các kỳ họp'],
        leadUnit: 'Văn phòng HĐND phường', coordUnits: ['Văn phòng UBND', 'Thường trực HĐND', 'Đơn vị chuyên môn liên quan'],
        sla: ['Trong ngày phân loại', '03 ngày có phản hồi bước đầu', 'Theo hạn nghị quyết/giám sát'], tasks: [['Phân nhóm nội dung kiến nghị', 'Tách theo đất đai, đô thị, an sinh, môi trường, hành chính công.', 'Văn phòng HĐND'], ['Chuyển đơn vị chuyên môn trả lời', 'Giao nhiệm vụ nhánh cho đơn vị chủ trì, nêu rõ hạn và mẫu kết quả trả lời.', 'Văn phòng UBND'], ['Giám sát tiến độ trả lời', 'Theo dõi trạng thái đã xử lý/đang xử lý/chưa xử lý theo từng nhóm kiến nghị.', 'Thường trực HĐND'], ['Tổng hợp báo cáo cử tri', 'Lập báo cáo kết quả xử lý, khó khăn và kiến nghị cấp trên nếu vượt thẩm quyền.', 'Cán bộ tổng hợp IOC']]
    }
};

let docPickerSelection = new Set();
let currentAccount = null, currentRole = null, activeMetric = 'received', activeIndicatorRole = null, activeCategoryRole = 'ALL', currentDrawerRecords = [], records = [], indicatorRecords = [], drawerPieStatus = '', activeIndicatorPieStatus = '';
let iocApiLoading = false, iocApiError = null, activeApiTabId = 'tat_ca', activeApiTab = 'tat_ca', activeApiTabChild = null;

/* ============================== HELPERS ============================== */
function sumObj(o) { return statusDefs.reduce((a, s) => a + (o[s.key] || 0), 0) }
function statusMeta(k) { return statusDefs.find(s => s.key === k) || statusDefs[0] }
function fmt(n) { return Number(n).toLocaleString('vi-VN') }
function pct(n, d) { return d ? ((n / d) * 100).toFixed(1).replace('.', ',') + '%' : '0%' }
function pad(n) { return String(n).padStart(2, '0') }
function pick(arr, i) { return arr[i % arr.length] }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])) }
function dueDate(i, status) { const d = new Date(); let delta = { done: -i % 15, doing: (i % 12) + 3, regular: 30 + (i % 20), soon: (i % 4) + 1, risk: (i % 3) + 1, overdue: -(i % 8 + 1) }[status] || 5; d.setDate(d.getDate() + delta); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }
function progressFor(status, i) { return { done: 100, doing: 45 + (i % 38), regular: 70 + (i % 22), soon: 65 + (i % 20), risk: 38 + (i % 30), overdue: 20 + (i % 35) }[status] || 50 }
function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function parseISO(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d) }
function addDays(base, n) { const d = new Date(base); d.setDate(d.getDate() + n); return d }
function donutArc(cx, cy, r, start, end) {
    const rad = a => (a - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(rad(start)), y1 = cy + r * Math.sin(rad(start));
    const x2 = cx + r * Math.cos(rad(end)), y2 = cy + r * Math.sin(rad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

/* Plugin dùng chung: hiện số liệu ngay trên/cạnh mỗi cột/hàng của mọi biểu đồ Chart.js dạng bar (dọc lẫn ngang) */
if (typeof Chart !== 'undefined') {
    Chart.register({
        id: 'valueLabels',
        afterDatasetsDraw(chart) {
            if (chart.config.type !== 'bar') return;
            const { ctx } = chart;
            const isStacked = chart.options?.scales?.x?.stacked || chart.options?.scales?.y?.stacked;
            if (isStacked) return;
            chart.data.datasets.forEach((ds, dsIndex) => {
                const meta = chart.getDatasetMeta(dsIndex);
                meta.data.forEach((elem, i) => {
                    const raw = ds.data[i];
                    if (raw === null || raw === undefined) return;
                    const pos = elem.tooltipPosition();
                    ctx.save();
                    // Nhãn số cạnh cột phải đổi màu theo theme sáng/tối, nếu không sẽ trắng-trên-trắng khi bật theme-light/green.
                    ctx.fillStyle = (document.documentElement.classList.contains('theme-light') || document.documentElement.classList.contains('theme-green')) ? '#111827' : '#eaf6ff';
                    ctx.font = "700 11px 'Be Vietnam Pro',sans-serif";
                    if (chart.options.indexAxis === 'y') {
                        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                        const text = fmt(raw);
                        const textWidth = ctx.measureText(text).width;
                        let labelX = pos.x + 6;
                        if (labelX + textWidth > chart.width - 4) {
                            labelX = Math.max(pos.x - textWidth - 6, chart.width - textWidth - 4);
                        }
                        ctx.fillText(text, labelX, pos.y);
                    } else {
                        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                        const labelY = Math.max(12, pos.y - 4);
                        ctx.fillText(fmt(raw), pos.x, labelY);
                    }
                    ctx.restore();
                });
            });
        }
    });
}

function allowedRoles(role = currentRole) {
    if (role === 'DANG') return ['DANG', 'HDND', 'UBND', 'MTTQ'];
    if (role === 'UBND') return ['UBND', 'HDND', 'MTTQ'];
    if (role === 'HDND') return ['HDND'];
    if (role === 'MTTQ') return ['MTTQ'];
    return [];
}
function canSeeRole(role) { return allowedRoles().includes(role) }
function isLimitedRole(role) { return currentRole === 'UBND' && (role === 'HDND' || role === 'MTTQ') }
function metricTotal(role, metric) { return sumObj(segmentTemplate[role][metric]) }
function statusTotal(metric, status, roles = allowedRoles()) { return roles.reduce((a, r) => a + (segmentTemplate[r]?.[metric]?.[status] || 0), 0) }
function metricTotalVisible(metric) { return allowedRoles().reduce((a, r) => a + metricTotal(r, metric), 0) }

/* ============================== SINH DỮ LIỆU DEMO ============================== */
function generateRecords() {
    let idCounter = 1; records = [];
    Object.keys(segmentTemplate).forEach(role => {
        Object.keys(metricMeta).forEach(metric => {
            const isDocument = metric === 'docIn' || metric === 'docOut';
            statusDefs.forEach(st => {
                const count = segmentTemplate[role][metric][st.key] || 0;
                for (let i = 0; i < count; i++) {
                    const base = {
                        id: `PX-${metric.toUpperCase()}-${role}-${String(idCounter).padStart(4, '0')}`,
                        role, metric, status: st.key,
                        unit: pick(units, i + idCounter), priority: st.key === 'overdue' || st.key === 'risk' ? 'Cao' : st.key === 'soon' ? 'Trung bình' : 'Bình thường',
                        due: dueDate(i, st.key), created: `${pad((i % 25) + 1)}/06/2026`, progress: progressFor(st.key, i),
                        evidence: [`Biểu mẫu_${role}_${i + 1}.xlsx`, `Văn bản_chỉ_đạo_${i + 1}.pdf`, `Ảnh_minh_chứng_${i + 1}.jpg`],
                        history: [
                            { time: '08:15 24/06/2026', text: 'Tiếp nhận vào IOC/CAD' },
                            { time: '09:40 24/06/2026', text: `Phân loại ${st.label}` },
                            { time: '14:20 25/06/2026', text: `Gán xử lý cho ${pick(units, i + 2)}` },
                            { time: '10:10 26/06/2026', text: 'Cập nhật tiến độ và đính kèm minh chứng' }
                        ]
                    };
                    if (isDocument) {
                        const doc = buildDocumentContent(role, idCounter - 1);
                        records.push({
                            ...base, ...doc, title: doc.title,
                            description: `Văn bản ${metric === 'docIn' ? 'đến' : 'đi'} thuộc ${axisMeta[role].name}, lĩnh vực ${doc.field}. Trích yếu: ${doc.summary}.`
                        });
                    } else {
                        const titleBase = pick(taskTitlePool[role], i);
                        const field = pick(fieldPool[role], i + idCounter);
                        const creator = metric === 'received' ? pick(['Thành ủy Hà Nội', 'HĐND Thành phố', 'UBND Thành phố', 'MTTQ Thành phố', 'Sở/ban ngành phối hợp'], i) : axisMeta[role].name;
                        const receiver = metric === 'assigned' ? pick(units, i + role.length) : axisMeta[role].name;
                        records.push({
                            ...base, title: `${titleBase} #${i + 1}`, field, creator, receiver, linkedDocIds: [],
                            description: `Hồ sơ demo thuộc ${axisMeta[role].name}, lĩnh vực ${field}. Nội dung dùng để mô phỏng vận hành IOC/CAD Thành ủy Hà Nội, có theo dõi tiến độ, cảnh báo, đơn vị phối hợp và minh chứng số hóa.`,
                            subtasks: []
                        });
                    }
                    idCounter++;
                }
            })
        })
    });
    indicatorRecords = [];
    Object.keys(indicators).forEach(role => {
        indicators[role].forEach((it, idx) => {
            const [name, count, freq, source] = it;
            for (let i = 0; i < count; i++) {
                const st = statusDefs[(i + idx) % statusDefs.length];
                indicatorRecords.push({
                    id: `CT-${role}-${idx + 1}-${String(i + 1).padStart(4, '0')}`, role, indicator: name, status: st.key,
                    title: `${name} - bản ghi ${i + 1}`, field: name, source, freq,
                    unit: pick(units, i), due: dueDate(i, st.key), progress: progressFor(st.key, i),
                    description: `Bản ghi chỉ tiêu ${name} của ${axisMeta[role].name}. Tần suất cập nhật ${freq}, nguồn ${source}.`,
                    history: [{ time: '07:30 26/06/2026', text: 'Đồng bộ dữ liệu mẫu' }, { time: '11:00 26/06/2026', text: 'Xác nhận số liệu cấp phường' }, { time: '15:20 26/06/2026', text: 'Cập nhật tiến độ và đính kèm minh chứng' }]
                });
            }
        })
    })
}

/* Bổ sung chỉ tiêu con của category (nếu chưa có trong "indicators") + chỉ tiêu tổng hợp kiến nghị cử tri */
function addIndicatorFromCategory(role, item) {
    indicators[role] = indicators[role] || [];
    const [name, count, freq, source] = item;
    let idx = indicators[role].findIndex(x => x[0] === name);
    if (idx < 0) { indicators[role].push([name, count, freq, source]); idx = indicators[role].length - 1; }
    if (!indicatorRecords.some(r => r.role === role && r.indicator === name)) {
        for (let i = 0; i < count; i++) {
            const st = statusDefs[(i + idx) % statusDefs.length];
            indicatorRecords.push({ id: `CT-${role}-CAT-${idx + 1}-${String(i + 1).padStart(4, '0')}`, role, indicator: name, status: st.key, title: `${name} - bản ghi ${i + 1}`, field: name, source, freq, unit: pick(units, i + idx), due: dueDate(i, st.key), progress: progressFor(st.key, i), description: `Bản ghi thuộc nhóm chỉ tiêu ${name}; dữ liệu được phân cấp theo lĩnh vực, nguồn ${source}, tần suất ${freq}.`, history: [{ time: '08:00 30/06/2026', text: 'Đồng bộ/nhập mẫu theo phụ lục khảo sát xã phường' }, { time: '09:10 30/06/2026', text: 'Xác nhận phạm vi hiển thị theo phân quyền' }] });
        }
    }
}
function ensureCategoryIndicators() {
    Object.keys(categorySeed).forEach(role => categorySeed[role].forEach(cat => cat.items.forEach(item => addIndicatorFromCategory(role, item))));
    const label = 'Tổng số ý kiến liên quan đến kiến nghị cử tri';
    if (!indicators.HDND.some(x => x[0] === label)) indicators.HDND.push([label, 87, 'Tuần', 'Excel/API cử tri']);
    if (!indicatorRecords.some(r => r.role === 'HDND' && r.indicator === label)) {
        for (let i = 0; i < 87; i++) { const st = statusDefs[(i + 2) % statusDefs.length]; indicatorRecords.push({ id: `CT-HDND-KNCT-${String(i + 1).padStart(4, '0')}`, role: 'HDND', indicator: label, status: st.key, title: `Ý kiến/kiến nghị cử tri liên quan #${i + 1}`, field: 'Cử tri – kiến nghị', source: 'Excel/API cử tri', freq: 'Tuần', unit: pick(units, i + 3), due: dueDate(i, st.key), progress: progressFor(st.key, i), description: 'Bản ghi tổng hợp ý kiến liên quan đến kiến nghị cử tri: nhóm nội dung, đơn vị tiếp nhận, trạng thái xử lý và kết quả trả lời.', history: [{ time: '07:40 26/06/2026', text: 'Đồng bộ danh sách ý kiến/kiến nghị cử tri' }, { time: '10:30 26/06/2026', text: 'HĐND rà soát trạng thái xử lý' }] }); }
    }
}

/* Mỗi nhiệm vụ (assigned/received) có tối thiểu 5 nhiệm vụ nhánh mẫu để minh hoạ bảng thống kê. Văn bản (docIn/docOut) không có nhiệm vụ nhánh trực tiếp — con của văn bản là Nhiệm vụ, xem attachTasksToDocuments(). */
function seedDefaultSubtasks() {
    const samples = ['Rà soát hồ sơ nguồn và đối chiếu số liệu', 'Chuẩn hóa biểu mẫu/minh chứng gửi IOC', 'Liên hệ đơn vị phối hợp xác nhận kết quả', 'Cập nhật tiến độ xử lý lên hệ thống', 'Tổng hợp báo cáo ngắn phục vụ lãnh đạo'];
    records.forEach((r, idx) => {
        if (r.metric !== 'assigned' && r.metric !== 'received') return;
        r.subtasks = r.subtasks || [];
        while (r.subtasks.length < 5) {
            const n = r.subtasks.length;
            r.subtasks.push({ id: `${r.id}-N${String(n + 1).padStart(2, '0')}`, name: samples[n], content: `${samples[n]} cho hồ sơ ${r.id}, lĩnh vực ${r.field}.`, owner: pick(units, idx + n), state: n === 0 ? 'Hoàn thành' : n === 3 ? 'Sắp đến hạn' : 'Đang xử lý', due: dueDate(n, n === 0 ? 'done' : n === 3 ? 'soon' : 'doing'), priority: n === 3 ? 'Cao' : 'Trung bình', progress: n === 0 ? 100 : n === 3 ? 68 : 35 + n * 8, scenario: '', created: '26/06/2026 08:00' });
        }
    });
}

/* Gắn 1-3 nhiệm vụ (assigned/received) đã sinh sẵn cùng trục vào từng văn bản, làm nhiệm vụ "cấp 1" của văn bản đó.
   Chỉ gắn tham chiếu (linkedDocIds) vào nhiệm vụ đã có sẵn — không tạo thêm bản ghi, không đổi số KPI dashboard. */
function attachTasksToDocuments() {
    const tasksByRole = {};
    records.forEach(r => { if (r.metric === 'assigned' || r.metric === 'received') { (tasksByRole[r.role] = tasksByRole[r.role] || []).push(r); } });
    const cursor = {};
    records.forEach((doc, docIdx) => {
        if (doc.metric !== 'docIn' && doc.metric !== 'docOut') return;
        const pool = tasksByRole[doc.role] || []; if (!pool.length) return;
        const taskCount = 1 + (docIdx % 3);
        cursor[doc.role] = cursor[doc.role] || 0;
        for (let k = 0; k < taskCount; k++) {
            const task = pool[cursor[doc.role] % pool.length];
            cursor[doc.role]++;
            task.linkedDocIds = task.linkedDocIds || [];
            if (!task.linkedDocIds.includes(doc.id)) task.linkedDocIds.push(doc.id);
        }
    });
}

/* ============================== KHỞI TẠO TOÀN BỘ DỮ LIỆU ============================== */
function initData() {
    generateRecords();
    ensureCategoryIndicators();
    (categorySeed.UBND || []).forEach(cat => ensureFakeCategoryItems('UBND', cat.id));
    seedDefaultSubtasks();
    attachTasksToDocuments();
}

/* ============================== LỊCH CÔNG TÁC / KỲ HỌP (1 bộ hàm dùng chung) ============================== */
function ensureCalendarEvents() {
    if (window.__calendarEvents) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const templates = {
        DANG: ['Giao ban Thường trực Đảng ủy', 'Họp Ban Thường vụ Đảng ủy', 'Làm việc về Nghị quyết 57', 'Kiểm điểm tiến độ công tác Đảng viên', 'Họp giao ban tuyên giáo - dân vận', 'Họp rà soát văn bản chỉ đạo'],
        HDND: ['Họp Thường trực HĐND', 'Phiên giải trình chuyên đề', 'Giám sát kiến nghị cử tri', 'Chuẩn bị nội dung kỳ họp HĐND', 'Rà soát dự thảo nghị quyết', 'Họp tổ đại biểu HĐND'],
        UBND: ['Giao ban lãnh đạo UBND', 'Họp xử lý TTHC sắp hạn', 'Họp thu ngân sách - an sinh', 'Họp đô thị, môi trường, PCCC', 'Họp GPMB dự án trọng điểm', 'Họp chuyển đổi số dữ liệu IOC'],
        MTTQ: ['Họp Ban Thường trực MTTQ', 'Họp phản biện xã hội', 'Họp quỹ ủng hộ và an sinh', 'Họp Đoàn Thanh niên - Hội Phụ nữ', 'Họp giám sát cộng đồng', 'Họp tổng hợp dư luận xã hội']
    };
    const counts = { DANG: 18, HDND: 17, UBND: 15, MTTQ: 9 };
    let id = 1; const events = [];
    Object.keys(counts).forEach(role => {
        for (let i = 0; i < counts[role]; i++) {
            const offsets = [-8, -3, -1, 0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22, 27, 31, 38, 45];
            const d = addDays(today, offsets[i % offsets.length] + (role === 'UBND' ? 1 : role === 'MTTQ' ? 2 : 0));
            const late = d < today && i % 3 !== 0;
            const done = d < today && !late;
            events.push({
                id: `MEET-${role}-${String(id++).padStart(3, '0')}`, role, date: iso(d), time: ['07:45', '08:00', '08:30', '09:00', '14:00', '15:30'][i % 6], end: ['09:00', '09:30', '10:30', '11:00', '15:30', '16:30'][i % 6],
                title: `${templates[role][i % templates[role].length]} ${i + 1}`,
                venue: ['Phòng họp Đảng ủy', 'Hội trường UBND phường', 'Phòng họp HĐND', 'Phòng giao ban IOC', 'Nhà văn hóa trung tâm'][i % 5],
                chair: role === 'DANG' ? 'Bí thư Đảng ủy' : role === 'HDND' ? 'Chủ tịch HĐND' : role === 'UBND' ? 'Chủ tịch UBND' : 'Chủ tịch MTTQ',
                secretary: ['Văn phòng Đảng ủy', 'Văn phòng HĐND', 'Văn phòng UBND', 'Cán bộ MTTQ'][i % 4],
                participants: [axisMeta[role].name, 'Văn phòng phường', 'Công chức chuyên môn', i % 2 ? 'Đơn vị phối hợp' : 'Tổ chuyển đổi số', i % 3 ? 'Đại diện thôn/tổ dân phố' : 'Công an phường'],
                agenda: `Chuẩn bị nội dung, rà soát số liệu IOC, kết luận giao nhiệm vụ và cập nhật tiến độ sau họp cho ${axisMeta[role].name}.`,
                docs: [`Tài liệu_họp_${role}_${i + 1}.pdf`, `Dự_thảo_kết_luận_${i + 1}.docx`],
                rawStatus: done ? 'done' : late ? 'late' : 'planned',
                prepared: i % 4 !== 1, confirmed: i % 5 !== 2
            });
        }
    });
    window.__calendarEvents = events;
}
function eventState(e) {
    const today = new Date(); today.setHours(0, 0, 0, 0); const d = parseISO(e.date); d.setHours(0, 0, 0, 0); const diff = Math.round((d - today) / 86400000);
    if (e.rawStatus === 'late') return { key: 'late', label: 'Trễ xác nhận/chuẩn bị', icon: '⚠️' };
    if (e.rawStatus === 'done') return { key: 'done', label: 'Đã hoàn thành', icon: '✅' };
    if (diff === 0) return { key: 'today', label: 'Hôm nay', icon: '🔔' };
    if (diff > 0 && diff <= 7) return { key: 'upcoming', label: 'Sắp diễn ra', icon: '⏰' };
    return { key: 'planned', label: 'Đã lên lịch', icon: '📅' };
}
function getCalendarEventsForScope(roleFilter) { ensureCalendarEvents(); return (window.__calendarEvents || []).filter(e => allowedRoles().includes(e.role) && (!roleFilter || e.role === roleFilter)); }
function calendarStatusCounts(roleFilter) { const ev = getCalendarEventsForScope(roleFilter); const out = { today: 0, upcoming: 0, late: 0, planned: 0, done: 0 }; ev.forEach(e => out[eventState(e).key]++); return out; }
function eventFullDate(e) { const d = parseISO(e.date); return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) }
function eventDateShort(e) { const d = parseISO(e.date); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` }

function openCalendar(role = null, title = 'Lịch công tác/kỳ họp', stateFilter = '') {
    ensureCalendarEvents();
    const validRole = role && allowedRoles().includes(role) ? role : '';
    window.__calState = { mode: 'month', date: iso(new Date()), role: validRole, state: stateFilter || '' };
    document.getElementById('drawerTitle-ct').textContent = title;
    // document.getElementById('drawerSub').textContent = '';
    document.getElementById('drawerBodyCT').innerHTML = `<div class="calendar-shell" style="display:grid;gap:12px"><div class="calendar-toolbar" style="display:grid;grid-template-columns:repeat(6,max-content) minmax(160px,1fr);gap:8px;align-items:center"><div class="mode-tabs" style="margin:0"><button id="calModeDay" onclick="setCalMode('day')">Ngày</button><button id="calModeWeek" onclick="setCalMode('week')">Tuần</button><button id="calModeMonth" onclick="setCalMode('month')"></button></div><button class="ghost" onclick="moveCalendar(-1)">←</button><button class="ghost" onclick="moveCalendar(1)">→</button><input id="calDate" type="date" onchange="window.__calState.date=this.value;renderCalendar()" style="height:36px;border-radius:10px;border:1px solid rgba(87,178,255,.25);background:#071f38;color:#eaf8ff;padding:0 10px"/><select id="calRole" onchange="window.__calState.role=this.value;renderCalendar()" style="height:36px;border-radius:10px;border:1px solid rgba(87,178,255,.25);background:#071f38;color:#eaf8ff;padding:0 10px"><option value="">Tất cả trục được xem</option>${allowedRoles().map(r => `<option value="${r}" ${validRole === r ? 'selected' : ''}>${axisMeta[r].name}</option>`).join('')}</select><select id="calStateFilter" onchange="window.__calState.state=this.value;renderCalendar()" style="height:36px;border-radius:10px;border:1px solid rgba(87,178,255,.25);background:#071f38;color:#eaf8ff;padding:0 10px"><option value="">Tất cả trạng thái</option><option value="today">Hôm nay</option><option value="upcoming">Sắp diễn ra</option><option value="late">Trễ xác nhận</option><option value="planned">Đã lên lịch</option><option value="done">Đã hoàn thành</option></select><button class="primary" onclick="openAssignmentForm()">＋ Giao nhiệm vụ chuẩn bị họp</button></div><div class="calendar-report" id="calendarReport" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px"></div><div class="calendar-board" id="calendarBoard" style="border:1px solid rgba(87,178,255,.22);border-radius:14px;overflow:hidden;background:rgba(4,16,30,.72)"></div></div>`;
    document.getElementById('calDate').value = window.__calState.date;
    document.getElementById('calStateFilter').value = window.__calState.state;
    openDrawer(); renderCalendar();
}
function setCalMode(mode) { window.__calState.mode = mode; renderCalendar(); }
function moveCalendar(delta) { const st = window.__calState; let d = parseISO(st.date); if (st.mode === 'day') d = addDays(d, delta); else if (st.mode === 'week') d = addDays(d, delta * 7); else d = new Date(d.getFullYear(), d.getMonth() + delta, 1); st.date = iso(d); document.getElementById('calDate').value = st.date; renderCalendar(); }
function filterCalendarEvents() { const st = window.__calState || {}; return getCalendarEventsForScope(st.role).filter(e => !st.state || eventState(e).key === st.state).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)); }
function reportCard(label, valueCls, value, hint, stateKey) { return `<button class="report-card" style="border:1px solid rgba(87,178,255,.22);background:rgba(5,26,47,.72);border-radius:12px;padding:9px;min-height:78px;overflow:hidden;text-align:left" onclick="window.__calState.state='${stateKey}';document.getElementById('calStateFilter').value='${stateKey}';renderCalendar()"><span style="display:block;color:#c8ddec;font-weight:800;line-height:1.25">${label}</span><b class="${valueCls}" style="display:block;font-size:21px;line-height:1.05;margin-top:4px">${value}</b><small style="display:block;color:var(--muted);margin-top:4px;line-height:1.25">${hint}</small></button>` }
function renderCalendar() {
    const st = window.__calState; if (!st) return;
    document.querySelectorAll('#calModeDay,#calModeWeek,#calModeMonth').forEach(b => b.classList.remove('active'));
    document.getElementById('calMode' + st.mode[0].toUpperCase() + st.mode.slice(1))?.classList.add('active');
    const counts = calendarStatusCounts(st.role);
    document.getElementById('calendarReport').innerHTML = reportCard('Sắp đến lịch họp', 'warn', fmt(counts.upcoming + counts.today), 'Hôm nay và 7 ngày tới', 'upcoming') + reportCard('Lịch trễ xác nhận', 'danger', fmt(counts.late), 'Cần thư ký nhắc việc', 'late') + reportCard('Đã lên lịch', 'blue', fmt(counts.planned), 'Chưa đến hạn', 'planned') + reportCard('Đã hoàn thành', 'ok', fmt(counts.done), 'Có thể lập kết luận/giao việc', 'done');
    const board = document.getElementById('calendarBoard');
    if (st.mode === 'month') board.innerHTML = renderMonthCalendar();
    if (st.mode === 'week') board.innerHTML = renderWeekCalendar();
    if (st.mode === 'day') board.innerHTML = renderDayCalendar();
}
function eventChip(e) { const st = eventState(e); return `<button class="event-chip ${st.key}" style="border:1px solid rgba(87,178,255,.22);background:rgba(8,35,62,.88);border-radius:8px;padding:5px 6px;text-align:left;font-size:10.5px;line-height:1.24;min-width:0;overflow:hidden;display:block;width:100%" onclick="openMeetingDetail('${e.id}')"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${st.icon} ${e.time} · ${e.title}</b><small style="display:block;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${axisMeta[e.role].name} · ${e.venue}</small></button>` }
function renderMonthCalendar() {
    const st = window.__calState; const cursor = parseISO(st.date); const y = cursor.getFullYear(), m = cursor.getMonth(); const first = new Date(y, m, 1); const startOffset = (first.getDay() + 6) % 7; const start = addDays(first, -startOffset); const events = filterCalendarEvents();
    const headers = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(h => `<div style="padding:9px;background:rgba(44,125,210,.18);border-right:1px solid rgba(87,178,255,.16);font-weight:900;text-align:center">${h}</div>`).join('');
    let cells = ''; for (let i = 0; i < 42; i++) {
        const d = addDays(start, i); const dayIso = iso(d); const inMonth = d.getMonth() === m; const today = dayIso === iso(new Date()); const evs = events.filter(e => e.date === dayIso);
        cells += `<div style="min-height:118px;padding:8px;border-right:1px solid rgba(87,178,255,.12);border-top:1px solid rgba(87,178,255,.12);display:grid;grid-template-rows:auto 1fr;gap:6px;background:rgba(7,27,48,.42);overflow:hidden;${inMonth ? '' : 'opacity:.36;'}${today ? 'box-shadow:inset 0 0 0 2px rgba(255,213,75,.55);background:rgba(88,71,11,.25);' : ''}"><div style="font-weight:900;color:#e9f8ff">${d.getDate()}</div><div style="display:grid;gap:5px;align-content:start;overflow:hidden">${evs.slice(0, 4).map(eventChip).join('')}${evs.length > 4 ? `<button class="ghost" style="font-size:10px;padding:4px" onclick="window.__calState.mode='day';window.__calState.date='${dayIso}';document.getElementById('calDate').value='${dayIso}';renderCalendar()">+${evs.length - 4} lịch khác</button>` : ''}</div></div>`
    }
    return `<div style="display:grid;grid-template-columns:repeat(7,minmax(120px,1fr))">${headers}${cells}</div>`;
}
function weekStart(d) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x }
function renderWeekCalendar() { const st = window.__calState; const start = weekStart(parseISO(st.date)); const events = filterCalendarEvents(); let html = '<div style="display:grid;grid-template-columns:repeat(7,minmax(150px,1fr))">'; for (let i = 0; i < 7; i++) { const d = addDays(start, i), dayIso = iso(d), evs = events.filter(e => e.date === dayIso); html += `<div style="min-height:420px;border-right:1px solid rgba(87,178,255,.14);padding:9px;display:grid;align-content:start;gap:8px"><h4 style="margin:0 0 4px;font-size:12px">${d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}</h4>${evs.map(eventChip).join('') || '<div class="muted">Không có lịch</div>'}</div>` } return html + '</div>' }
function renderDayCalendar() { const st = window.__calState; const events = filterCalendarEvents().filter(e => e.date === st.date); const d = parseISO(st.date); return `<div style="display:grid;gap:8px"><div style="padding:9px;background:rgba(44,125,210,.18);font-weight:900">${d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>${events.map(e => `<button class="agenda-row" style="display:grid;grid-template-columns:84px 1fr auto;gap:9px;align-items:start;border:1px solid rgba(87,178,255,.2);background:rgba(5,26,47,.72);border-radius:10px;padding:9px;text-align:left;margin:0 9px" onclick="openMeetingDetail('${e.id}')"><div style="font-weight:900;color:#58b7ff">${e.time}<br/>${e.end}</div><div><h4 style="margin:0;font-size:12px;line-height:1.32">${eventState(e).icon} ${e.title}</h4><p style="margin:4px 0 0;color:var(--muted);font-size:11.5px;line-height:1.38">${axisMeta[e.role].name} · ${e.venue} · Chủ trì: ${e.chair}</p></div><span class="badge ${eventState(e).key === 'late' ? 'red' : eventState(e).key === 'today' ? 'ok' : 'gold'}">${eventState(e).label}</span></button>`).join('') || '<div class="access-lock" style="margin:0 9px">Không có lịch họp trong ngày này.</div>'}</div>` }
function openMeetingDetail(id) {
    ensureCalendarEvents(); const e = (window.__calendarEvents || []).find(x => x.id === id); if (!e) return; const st = eventState(e);
    document.getElementById('modalTitle').textContent = `Chi tiết lịch họp · ${e.id}`;
    document.getElementById('modalSub').textContent = `${axisMeta[e.role].name} · ${eventFullDate(e)} · ${e.time}-${e.end}`;
    document.getElementById('modalBody').innerHTML = `<div class="scenario-detail-grid"><div class="detail-card"><h4>${st.icon} ${e.title}</h4><div class="kv"><b>Trạng thái</b><span style="color:${st.key === 'late' ? '#ff626b' : st.key === 'today' ? '#39d5ff' : '#ffd65a'}">${st.label}</span><b>Ngày giờ</b><span>${eventFullDate(e)} · ${e.time}-${e.end}</span><b>Địa điểm</b><span>${e.venue}</span><b>Chủ trì</b><span>${e.chair}</span><b>Thư ký</b><span>${e.secretary}</span><b>Tài liệu</b><span>${e.docs.join(', ')}</span></div>${st.key === 'late' ? '<div class="access-lock" style="margin-top:10px;border-color:rgba(255,98,107,.45)">Vai trò thư ký: lịch này đã trễ xác nhận/chuẩn bị tài liệu. Cần nhắc đơn vị và giao nhiệm vụ hoàn thiện ngay.</div>' : ''}</div><div class="detail-card"><h4>Thành phần tham gia</h4><div style="display:flex;flex-wrap:wrap;gap:6px">${e.participants.map(p => `<span style="padding:5px 7px;border:1px solid rgba(87,178,255,.22);background:rgba(6,28,52,.72);border-radius:999px;font-size:11.5px">${p}</span>`).join('')}</div><h4 style="margin-top:10px">Nội dung họp</h4><p class="wrap">${e.agenda}</p><div class="action-bar"><button class="primary" onclick="openAssignmentForm()">Giao nhiệm vụ chuẩn bị/kết luận</button><button class="ghost" onclick="toast('Đã gửi nhắc lịch tới thành phần tham dự ${e.id}')">Gửi nhắc lịch</button><button class="ghost" onclick="toast('Đã xác nhận tham dự và cập nhật calendar ${e.id}')">Xác nhận tham dự</button><button class="ghost danger-btn" onclick="toast('Đã tạo báo cáo lịch trễ cho ${e.id}')">Báo cáo lịch trễ</button></div></div></div><div class="detail-card"><h4>Báo cáo thư ký</h4><div class="audit"><div class="audit-item"><b>Chuẩn bị tài liệu</b><span>${e.prepared ? 'Đã đủ tài liệu họp' : 'Thiếu tài liệu, cần nhắc đơn vị gửi trước giờ họp'}</span></div><div class="audit-item"><b>Xác nhận tham dự</b><span>${e.confirmed ? 'Đã xác nhận thành phần chính' : 'Chưa đủ xác nhận, cần gọi/nhắc tự động'}</span></div><div class="audit-item"><b>Việc sau họp</b><span>Tạo dự thảo kết luận, giao nhiệm vụ theo kết luận và theo dõi SLA trên IOC/CAD.</span></div></div></div>`;
    openModal();
}

/* ============================== ĐĂNG NHẬP / ĐỒNG HỒ / LỆNH NHANH ============================== */
function initLogin() {
    initData();
    const wrap = document.getElementById('loginAccounts');
    wrap.innerHTML = Object.values(accounts).map(acc => `<button class="account-pick" onclick="selectLogin('${acc.user}')"><div class="role-icon">${acc.icon}</div><div><b>${acc.title}</b><small class="muted">User: ${acc.user} · Pass: demo</small></div></button>`).join('');
    selectLogin('danguy');
    setInterval(updateClock, 1000); updateClock();
    document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openQuickCommand() } })
}
function selectLogin(user) {
    document.getElementById('username').value = user; document.getElementById('password').value = '';
    document.querySelectorAll('.account-pick').forEach(b => b.classList.remove('active'));
    const idx = Object.keys(accounts).indexOf(user); if (idx >= 0) document.querySelectorAll('.account-pick')[idx].classList.add('active');
}
/* Hàm tiện ích: tính SHA-256 hex bằng Web Crypto API. */
async function _sha256hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function login() {
    const u = document.getElementById('username').value.trim().toLowerCase();
    const p = document.getElementById('password').value;
    const acc = accounts[u];
    if (!acc) { toast('Sai tài khoản hoặc mật khẩu demo. '); return; }
    _sha256hex(p).then(hash => { if (hash !== acc.passHash) { toast('Sai tài khoản hoặc mật khẩu demo. '); return; }
    currentAccount = acc; currentRole = acc.role; activeMetric = 'received'; activeIndicatorRole = allowedRoles()[0]; activeCategoryRole = (acc.role === 'DANG') ? 'ALL' : allowedRoles()[0];
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    renderAll();
    toast(`Đăng nhập ${acc.title}. Áp dụng phân quyền dữ liệu theo tài khoản.`);
    });
}
function logout() { currentAccount = null; currentRole = null; closePanels(); document.getElementById('app').classList.add('hidden'); document.getElementById('loginScreen').classList.remove('hidden') }
function updateClock() {
    const d = new Date();
    document.getElementById('clock').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    document.getElementById('dateText').textContent = d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}
function openQuickCommand() {
    document.getElementById('modalTitle').textContent = 'Lệnh nhanh IOC/CAD'; document.getElementById('modalSub').textContent = '';
    document.getElementById('modalBody').innerHTML = `<div class="field"><label>Nhập lệnh</label><input id="quickInput" placeholder="Ví dụ: mở nhiệm vụ quá hạn UBND, giao việc TTHC, văn bản đến sắp hạn..." autofocus /></div><div class="action-bar"><button class="primary" onclick="runQuick()">Chạy lệnh</button><button class="ghost" onclick="setMetric('assigned');closeModal()">Mở nhiệm vụ giao</button><button class="ghost" onclick="setMetric('received');closeModal()">Mở nhiệm vụ nhận</button><button class="ghost" onclick="openList({metric:null,status:'overdue',title:'Tất cả hồ sơ quá hạn'})">Mở quá hạn</button></div>`; openModal(); setTimeout(() => document.getElementById('quickInput')?.focus(), 80)
}
function runQuick() { const q = (document.getElementById('quickInput')?.value || '').toLowerCase(); if (q.includes('giao')) openAssignmentForm(); else if (q.includes('quá hạn')) openList({ metric: null, status: 'overdue', title: 'Kết quả lệnh nhanh: quá hạn' }); else if (q.includes('văn bản đến')) { setMetric('docIn'); closeModal() } else if (q.includes('nhiệm vụ nhận')) { setMetric('received'); closeModal() } else { toast('Lệnh demo đã được ghi nhận. Gợi ý: "giao", "quá hạn", "văn bản đến", "nhiệm vụ nhận".') } }

/* ============================== MODAL / DRAWER / TOAST / CUSTOMIZER ============================== */
function lockScroll() { document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden'; }
function unlockScroll() {
    const drawerOpen = document.getElementById('drawer-ct')?.classList.contains('open');
    const modalOpen = document.querySelector('.modal.open');
    if (!drawerOpen && !modalOpen) { document.body.style.overflow = ''; document.documentElement.style.overflow = ''; }
}
function openDrawer() {
    document.getElementById('overlay-ct').classList.add('show');
    document.getElementById('drawer-ct').classList.add('open'); lockScroll(); document.getElementById('drawerBodyCT').scrollTop = 0;
    renderDrawerPeriodFilter();
}

/* ============================== BỘ LỌC NĂM/MỐC THỜI GIAN Ở DRAWER ==============================
   Chỉ hiện khi drawer đang mở đúng 1 chỉ tiêu có id thật (window.__activeDrawerIndicatorKey — set
   bởi van-phong-ban-to-chuc-dang.js openPopup()). Đổi filter nào cũng gọi lại API
   /api/v1/trung-uong/data/query (qua global.fetchIndicatorReportForKey, dùng chung URL/headers/dev-auth
   với van-phong-ban-to-chuc-dang.js) với đúng year/months của lựa chọn hiện tại.
   2 select: "Năm" (giữ nguyên logic cũ) và "Mốc thời gian" — gộp Tháng/Quý/Kỳ vào 1 select duy nhất,
   value có tiền tố để phân biệt: m<N> = Tháng N, q<N> = Quý N, k1 = Kỳ I (6 tháng đầu năm), k2 = Kỳ II
   (6 tháng cuối năm). */
// Nguồn sự thật cho lựa chọn Năm/Mốc thời gian hiện tại. BẮT BUỘC phải dùng biến này (không chỉ set
// .value trên DOM) vì mỗi lần load dữ liệu mới, ictApplyResultToDrawer() ghi đè toàn bộ
// #drawerBodyCT.innerHTML (kể cả xoá luôn 2 select này) rồi openDrawer() mới dựng lại filter mới —
// nếu chỉ set .value trên select cũ trước khi gọi thì giá trị đó bị mất ngay khi DOM bị thay thế.
let drawerFilterState = { key: null, nam: null, moc: '' };
function drawerPeriodYearOptionsHtml(selectedYear) {
    const now = new Date().getFullYear();
    const sel = selectedYear || now;
    const years = [];
    for (let y = now + 1; y >= now - 3; y--) years.push(y);
    return years.map((y) => `<option value="${y}"${y === sel ? ' selected' : ''}>${y}</option>`).join('');
}
function drawerPeriodFilterHtml() {
    const st = drawerFilterState;
    const mocOption = (v, label) => `<option value="${v}"${st.moc === v ? ' selected' : ''}>${label}</option>`;
    const thangOptions = Array.from({ length: 12 }, (_, i) => mocOption('m' + (i + 1), 'Tháng ' + (i + 1))).join('');
    const quyOptions = [1, 2, 3, 4].map((q) => mocOption('q' + q, 'Quý ' + q)).join('');
    const kyOptions = mocOption('k1', 'Kỳ I (6 tháng đầu năm)') + mocOption('k2', 'Kỳ II (6 tháng cuối năm)');
    return `<div class="drawer-period-filter" style="display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid rgba(87,178,255,.18)">
        <label class="field" style="max-width:120px">Năm
            <select id="drawerFilterNam" onchange="onDrawerPeriodFilterChange()">${drawerPeriodYearOptionsHtml(st.nam)}</select>
        </label>
        <label class="field" style="max-width:220px">Mốc thời gian
            <select id="drawerFilterMoc" onchange="onDrawerPeriodFilterChange()">
                <option value=""${st.moc ? '' : ' selected'}>-- (không chọn — cả năm)</option>
                <optgroup label="Tháng">${thangOptions}</optgroup>
                <optgroup label="Quý">${quyOptions}</optgroup>
                <optgroup label="Kỳ">${kyOptions}</optgroup>
            </select>
        </label>
    </div>`;
}
function renderDrawerPeriodFilter() {
    const body = document.getElementById('drawerBodyCT');
    if (!body) return;
    const key = window.__activeDrawerIndicatorKey;
    const existing = body.querySelector('.drawer-period-filter');
    if (!key) { if (existing) existing.remove(); drawerFilterState = { key: null, nam: null, moc: '' }; return; }
    if (drawerFilterState.key !== key) {
        // Mở sang chỉ tiêu khác -> reset bộ lọc về mặc định thay vì giữ lựa chọn của chỉ tiêu trước.
        drawerFilterState = { key: key, nam: null, moc: '' };
    }
    if (existing) existing.remove(); // luôn dựng lại đúng theo drawerFilterState (nguồn sự thật)
    body.insertAdjacentHTML('afterbegin', drawerPeriodFilterHtml());
}
function drawerFilterMonthsFromMoc(moc) {
    if (!moc) return null; // chỉ chọn Năm -> không gửi months (cả năm)
    if (moc.charAt(0) === 'm') return String(Number(moc.slice(1)));
    if (moc.charAt(0) === 'q') {
        const start = (Number(moc.slice(1)) - 1) * 3 + 1;
        return [start, start + 1, start + 2].join(',');
    }
    if (moc === 'k1') return '1,2,3,4,5,6';
    if (moc === 'k2') return '7,8,9,10,11,12';
    return null;
}
// Ngược lại với drawerFilterMonthsFromMoc: từ chuỗi "months" API trả về, suy ra nên tự chọn lại giá
// trị nào trên select "Mốc thời gian" — đúng 1 số -> Tháng; đúng 3 số liên tiếp khớp 1 quý chuẩn
// (1-3/4-6/7-9/10-12) -> Quý; đúng 6 số liên tiếp khớp 1-6 hoặc 7-12 -> Kỳ I/Kỳ II; còn lại (cả năm,
// hoặc không khớp mẫu nào) -> "" (không chọn gì, chỉ còn lọc theo Năm).
function drawerMocFromMonths(monthsStr) {
    if (!monthsStr) return '';
    const months = String(monthsStr).split(',').map((m) => Number(m.trim())).filter((n) => !isNaN(n));
    const sorted = months.slice().sort((a, b) => a - b);
    if (sorted.length === 1) return 'm' + sorted[0];
    if (sorted.length === 3) {
        for (let q = 1; q <= 4; q++) {
            const start = (q - 1) * 3 + 1;
            if (sorted[0] === start && sorted[1] === start + 1 && sorted[2] === start + 2) return 'q' + q;
        }
    }
    if (sorted.length === 6) {
        if (sorted.join(',') === '1,2,3,4,5,6') return 'k1';
        if (sorted.join(',') === '7,8,9,10,11,12') return 'k2';
    }
    return '';
}
window.onDrawerPeriodFilterChange = function () {
    const indicatorKey = window.__activeDrawerIndicatorKey;
    if (!indicatorKey) return;
    if (typeof window.fetchIndicatorReportForKey !== 'function') {
        console.warn('[drawer-filter] fetchIndicatorReportForKey chưa sẵn sàng (thiếu van-phong-ban-to-chuc-dang.js?).');
        return;
    }
    const nam = document.getElementById('drawerFilterNam')?.value;
    const moc = document.getElementById('drawerFilterMoc')?.value || '';
    drawerFilterState.key = indicatorKey;
    drawerFilterState.nam = Number(nam);
    drawerFilterState.moc = moc;
    const months = drawerFilterMonthsFromMoc(moc);
    window.fetchIndicatorReportForKey(indicatorKey, Number(nam), months || undefined)
        .then((json) => {
            console.log('[drawer-filter] response', json);
            if (json && typeof json.data === 'string' && json.data !== '') {
                try {
                    const parsedResult = JSON.parse(json.data);
                    // console.log('JparsedResult', JparsedResult)
                    // const parsedResult = JparsedResult.length > 0 ? JSON.parse(JparsedResult[0]) : '';
                    // Response có months -> tự điền lại đúng "Mốc thời gian" trên UI theo dữ liệu thật
                    // sự trả về (có thể khác lựa chọn user vừa gửi). Ghi thẳng vào drawerFilterState
                    // (nguồn sự thật) — KHÔNG set .value lên select hiện tại vì nó sắp bị huỷ ngay sau
                    // đây khi ictLoadResultFromQuery() ghi đè lại #drawerBodyCT.innerHTML.
                    let effectiveMoc = moc;
                    if (json.months) {
                        effectiveMoc = drawerMocFromMonths(json.months);
                        drawerFilterState.moc = effectiveMoc;
                    }
                    // Đổ trực tiếp vào drawer — luồng này độc lập, không cần modal nhập Excel đang mở.
                    window.ictLoadResultFromQuery?.(parsedResult, nam, effectiveMoc, indicatorKey);
                } catch (err) {
                    console.warn('[drawer-filter] Không parse được json.data thành JSON:', err.message || err);
                    toast('Đã gọi API nhưng không đọc được dữ liệu trả về.');
                }
            } else {
                // data === '' hoặc null -> xoá sạch chart/bảng cũ (dù là data cũ hay data fake ban đầu),
                // KHÔNG được giữ lại hiển thị như còn dữ liệu của kỳ trước.
                window.ictShowNoDataInDrawer?.('Không có dữ liệu cho kỳ báo cáo đã chọn.');
                toast('Chưa có dữ liệu đã lưu cho kỳ này.');
            }
        })
        .catch((err) => {
            toast('Gọi API lọc thất bại: ' + (err.message || err));
        });
};
function cleanupCategoryPopup() {
    const drawer = document.getElementById('drawer-ct');
    if (drawer?.dataset.categoryPopup === 'van-phong-ban-to-chuc-dang-vien-co-so') {
        window.destroyVanPhongBanToChucDangPopup?.();
        delete drawer.dataset.categoryPopup;
    }
}
function hideIctHeaderSaveBtn() { const btn = document.getElementById('ictHeaderSaveBtn'); if (btn) btn.style.display = 'none'; }
// Đóng drawer -> id chỉ tiêu đang mở không còn hợp lệ nữa (tránh lần import Excel kế tiếp lỡ dùng
// nhầm id của lần mở drawer trước, khi drawer được mở lại từ 1 luồng không set lại id này).
function clearActiveDrawerIndicatorKey() { window.__activeDrawerIndicatorKey = null; }
function closeDrawer() { cleanupCategoryPopup(); document.getElementById('drawer-ct').classList.remove('open'); if (!document.getElementById('modal').classList.contains('open')) document.getElementById('overlay-ct').classList.remove('show'); unlockScroll(); hideIctHeaderSaveBtn(); clearActiveDrawerIndicatorKey(); }
function closeDrawerTable() { cleanupCategoryPopup(); document.getElementById('drawer-ct').classList.remove('open'); if (!document.getElementById('modal').classList.contains('open')) document.getElementById('overlay-ct').classList.remove('show'); unlockScroll(); hideIctHeaderSaveBtn(); clearActiveDrawerIndicatorKey(); }
function openModal() { document.getElementById('overlay-ct').classList.add('show'); document.getElementById('modal').classList.add('open'); lockScroll(); }
function closeModal() { document.getElementById('modal').classList.remove('open'); if (!document.getElementById('drawer-ct').classList.contains('open')) document.getElementById('overlay-ct').classList.remove('show'); unlockScroll(); }
function closePanels() { closeDrawer(); closeModal(); document.getElementById('customizer').classList.remove('open') }
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(window.__toast); window.__toast = setTimeout(() => t.classList.remove('show'), 3000) }

function toggleWidgetBody(btn) { const box = btn.closest('.widget') || btn.closest('.top-overview') || btn.closest('.detail-card'); const body = box.querySelector('.widget-body'); body.classList.toggle('hidden'); btn.textContent = body.classList.contains('hidden') ? '＋' : '−' }
const widgetLabels = { summary: 'Tổng quan KPI & chân dung vận hành', indicators: 'Chỉ tiêu từng trục', sources: 'Nguồn dữ liệu', axisDashboard: 'Dashboard xử lý', notifications: 'Notify IOC/CAD & Điều hành CAD', gismap: 'Bản đồ GIS Tương tác – Thành ủy Hà Nội' };
function prefKey() { return `px-ioc-hidden-${currentRole}` }
function getHiddenWidgets() { try { return JSON.parse(localStorage.getItem(prefKey()) || '[]') } catch (e) { return [] } }
function setHiddenWidgets(arr) { localStorage.setItem(prefKey(), JSON.stringify(arr)) }
function renderCustomizer() { const hidden = getHiddenWidgets(); document.getElementById('customList').innerHTML = Object.keys(widgetLabels).map(k => `<label><input type="checkbox" ${hidden.includes(k) ? '' : 'checked'} onchange="toggleWidgetPref('${k}',this.checked)"/><span><b>${widgetLabels[k]}</b><br/><small class="muted">${hidden.includes(k) ? 'Đang ẩn' : 'Đang hiển thị'}</small></span></label>`).join('') }
function toggleWidgetPref(k, show) { let hidden = getHiddenWidgets(); if (show) hidden = hidden.filter(x => x !== k); else if (!hidden.includes(k)) hidden.push(k); setHiddenWidgets(hidden); applyWidgetVisibility(); renderCustomizer() }
function applyWidgetVisibility() { const hidden = getHiddenWidgets(); document.querySelectorAll('[data-widget]').forEach(w => w.classList.toggle('hidden', hidden.includes(w.dataset.widget))); if (!hidden.includes('gismap')) initGisMap(); }
function toggleCustomizer() { document.getElementById('customizer').classList.toggle('open') }

/* ============================== MỤC TỔNG QUAN (3 pie donut) ============================== */
function overviewSvg(segments, total, center, sub, group) {
    total = total || segments.reduce((a, s) => a + (s.value || 0), 0) || 1;
    let angle = 0;
    const paths = segments.map(s => {
        const val = Math.max(0, s.value || 0); const len = val / total * 360; const start = angle; const end = angle + len; angle = end;
        if (!val) return '';
        return `<path class="pie-seg" d="${donutArc(75, 75, 52, start, end)}" fill="none" stroke="${s.color}" stroke-width="18" stroke-linecap="butt" onclick="openOverviewPieSegment('${group}','${s.key}')"><title>${s.label}: ${fmt(val)}</title></path>`
    }).join('');
    return `<svg class="pie-donut" viewBox="0 0 150 150"><circle cx="75" cy="75" r="52" fill="none" stroke="#06192c" stroke-width="18"/>${paths}<circle cx="75" cy="75" r="35" fill="#061528" stroke="rgba(87,178,255,.24)"/><text x="75" y="72" text-anchor="middle" class="pie-center">${center}</text><text x="75" y="88" text-anchor="middle" class="pie-sub">${sub}</text></svg>`;
}
function pieCard(title, note, segments, group, center, sub, extra = '') {
    const total = segments.reduce((a, s) => a + (s.value || 0), 0);
    const legend = extra || `<div class="pie-legend">${segments.map(s => `<button onclick="openOverviewPieSegment('${group}','${s.key}')"><i style="background:${s.color}"></i><span>${s.label}</span><b>${fmt(s.value || 0)}</b></button>`).join('')}</div>`;
    return `<article class="pie-card"><div><h3>${title}</h3><div class="pie-note">${note}</div></div><div class="pie-card-body"><div class="pie-donut-wrap">${overviewSvg(segments, total, center ?? fmt(total), sub || 'Tổng', group)}</div><div>${legend}</div></div></article>`;
}
function totalForRole(role) { return Object.keys(metricMeta).reduce((sum, m) => sum + metricTotal(role, m), 0) }
function statusAllVisible(status) { return Object.keys(metricMeta).reduce((sum, m) => sum + statusTotal(m, status, allowedRoles()), 0) }

function renderRoleScope() {
    const el = document.getElementById('roleScopeCards'); if (!el) return;
    el.innerHTML = `<div class="top-overview-head"><div class="top-overview-title">TỔNG QUAN ĐIỀU HÀNH NHIỆM VỤ/VĂN BẢN</div><button class="mini-btn" onclick="toggleWidgetBody(this)">−</button></div><div class="top-overview-body widget-body" id="overviewPieBody"><div class="pie-grid" id="pieGrid"></div></div>`;
}
function renderSummary() {
    ensureCalendarEvents(); const roles = allowedRoles();
    const metricSegments = Object.keys(metricMeta).map((m, i) => ({ key: m, label: metricMeta[m].short, value: metricTotalVisible(m), color: ['#2fb174', '#2c7dd2', '#d8a50c', '#8b5cf6'][i] }));
    const statusSegments = statusDefs.map(st => ({ key: st.key, label: st.short, value: statusAllVisible(st.key), color: st.color }));
    const cal = calendarStatusCounts(); const calSegments = [{ key: 'today', label: 'Hôm nay', value: cal.today, color: '#39d5ff' }, { key: 'upcoming', label: 'Sắp diễn ra', value: cal.upcoming, color: '#d8a50c' }, { key: 'late', label: 'Trễ xác nhận', value: cal.late, color: '#d33a44' }, { key: 'planned', label: 'Đã lên lịch', value: cal.planned, color: '#2c7dd2' }, { key: 'done', label: 'Đã hoàn thành', value: cal.done, color: '#2fb174' }];
    const next = getCalendarEventsForScope().filter(e => ['today', 'upcoming', 'late'].includes(eventState(e).key)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 3);
    const secretary = `<div class="secretary-list">${next.map(e => { const st = eventState(e); return `<button class="secretary-row ${st.key === 'late' ? 'danger' : st.key === 'upcoming' ? 'warn' : ''}" onclick="openMeetingDetail('${e.id}')"><span>${st.icon}</span><b>${e.title}</b><small>${eventDateShort(e)} ${e.time}</small></button>` }).join('') || '<div class="muted">Không có lịch cần nhắc.</div>'}<button class="ghost" onclick="openCalendar(null,'Lịch công tác - thư ký điều hành')">Mở calendar</button></div>`;
    const cards = [
        pieCard('Cơ cấu hồ sơ điều hành', 'Nhiệm vụ giao/nhận, văn bản đến/đi trong phạm vi quyền.', metricSegments, 'metric', fmt(metricSegments.reduce((a, s) => a + s.value, 0)), 'Hồ sơ'),
        pieCard('Kết quả xử lý', 'Click trạng thái để lọc bảng đúng số liệu và giao nhiệm vụ.', statusSegments, 'status', fmt(statusSegments.reduce((a, s) => a + s.value, 0)), 'Kết quả'),
        pieCard('Lịch công tác/kỳ họp', 'Vai trò thư ký: ngày/tuần/, lịch sắp họp và lịch trễ.', calSegments, 'calendar', fmt(calSegments.reduce((a, s) => a + s.value, 0)), 'Lịch', secretary)
    ].join('');
    const body = document.getElementById('pieGrid'); if (body) body.innerHTML = cards;
}
function openOverviewPieSegment(group, key) {
    if (group === 'metric') {
        activeMetric = key; renderMetricTabs(); renderAxisDashboard();
        document.getElementById('axisDashboardWidget')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        openList({ metric: key, title: `${metricMeta[key].label} · ${currentAccount.title}` });
        return;
    }
    if (group === 'status') {
        openList({ metric: null, status: key, title: `${statusMeta(key).label} · toàn bộ phạm vi được xem` });
        return;
    }
    if (group === 'calendar') {
        openCalendar(null, 'Lịch công tác/kỳ họp', key);
        return;
    }
    if (group === 'drawerStatus') { setDrawerPieStatus(key); return; }
    if (group === 'indicatorPie') { setIndicatorStatusFilter(key); return; }
}

/* ============================== DASHBOARD KẾT QUẢ XỬ LÝ (mục giữa) ============================== */
// function renderMetricTabs() {
//     document.getElementById('metricTabs').innerHTML = Object.keys(metricMeta).map(m => `<button class="${activeMetric === m ? 'active' : ''}" onclick="setMetric('${m}')">${metricMeta[m].icon} ${metricMeta[m].label} <b class="mono">${fmt(metricTotalVisible(m))}</b></button>`).join('')
// }

function renderMetricTabs() {
    const tabsContainer = document.getElementById('metricTabs');

    // Kiểm tra an toàn: Nếu DOM chưa sẵn sàng thì thoát hàm thay vì gây lỗi crash
    if (!tabsContainer) return;

    tabsContainer.innerHTML = Object.keys(metricMeta || {})
        .map(m => {
            const meta = metricMeta[m] || {};
            const total = typeof fmt === 'function' && typeof metricTotalVisible === 'function'
                ? fmt(metricTotalVisible(m))
                : (metricTotalVisible ? metricTotalVisible(m) : 0);

            return `<button class="${activeMetric === m ? 'active' : ''}" onclick="setMetric('${m}')">${meta.icon || ''} ${meta.label || ''} <b class="mono">${total}</b></button>`;
        })
        .join('');
}
function setMetric(m) { activeMetric = m; renderMetricTabs(); renderAxisDashboard() }
function renderAxisDashboard() {
    const roles = allowedRoles();
    document.getElementById('axisDashboardTitle').textContent = `${metricMeta[activeMetric].label.toUpperCase()} THEO TRỤC`;
    const total = metricTotalVisible(activeMetric);
    const actionTitle = activeMetric === 'assigned' ? 'Giao nhiệm vụ theo trục' : activeMetric === 'received' ? 'Xử lý nhiệm vụ nhận' : activeMetric === 'docIn' ? 'Xử lý văn bản đến' : 'Theo dõi văn bản đi';
    document.getElementById('axisActions').innerHTML = `
      <div class="axis-action-card"><h4>${metricMeta[activeMetric].icon} ${actionTitle}</h4><div class="axis-action-buttons"><button class="primary" onclick="openAssignmentForm(${(activeMetric === 'docIn' || activeMetric === 'docOut') ? `'${activeMetric}'` : 'null'})">＋ Giao nhiệm vụ</button><button class="ghost danger-btn" onclick="openList({metric:'${activeMetric}',status:'risk',title:'Nguy cơ trễ hạn · ${metricMeta[activeMetric].short}'})">Nhắc nguy cơ trễ</button></div></div>`;
    const top = statusDefs.map(st => {
        const n = statusTotal(activeMetric, st.key, roles);
        return `<button class="seg-kpi" onclick="openList({metric:'${activeMetric}',status:'${st.key}',title:'${st.label} - ${metricMeta[activeMetric].short}'})"><span>${st.label}</span><b class="mono" style="color:${st.color}">${fmt(n)}</b><span>${pct(n, total)}</span></button>`
    }).join('');
    document.getElementById('segKpis').innerHTML = top;
    document.getElementById('axisRows').innerHTML = roles.map(role => {
        const data = segmentTemplate[role][activeMetric]; const rowTotal = sumObj(data);
        const segs = statusDefs.map(st => {
            const n = data[st.key] || 0; const w = rowTotal ? n / rowTotal * 100 : 0;
            return `<button class="seg ${n ? '' : 'zero'}" title="${axisMeta[role].name} · ${st.label}: ${n}" style="width:${w}%;background:${st.color}" onclick="openList({metric:'${activeMetric}',role:'${role}',status:'${st.key}',title:'${axisMeta[role].name} · ${st.label}'})">${n ? fmt(n) : ''}</button>`
        }).join('');
        return `<div class="axis-row"><button class="axis-label" onclick="openList({metric:'${activeMetric}',role:'${role}',title:'${axisMeta[role].name} · ${metricMeta[activeMetric].label}'})">${axisMeta[role].icon} ${axisMeta[role].name}</button><div class="bar">${segs}</div><button class="axis-total mono" onclick="openList({metric:'${activeMetric}',role:'${role}',title:'${axisMeta[role].name} · ${metricMeta[activeMetric].label}'})">${fmt(rowTotal)}</button></div>`
    }).join('');
    document.getElementById('legend').innerHTML = statusDefs.map(s => `<span><i class="sw" style="background:${s.color}"></i>${s.label}</span>`).join('')
}

/* ============================== DRAWER DANH SÁCH (cấp 1, có pie) ============================== */
function openList(opts) {
    const { metric = null, role = null, status = null, title = 'Danh sách' } = opts || {};
    let base = records.filter(r => canSeeRole(r.role));
    if (metric) base = base.filter(r => r.metric === metric);
    if (role) base = base.filter(r => r.role === role);
    currentDrawerRecords = base;
    drawerPieStatus = status || '';
    document.getElementById('drawerTitle-ct').textContent = title;
    const selected = drawerPieStatus ? ` · ${statusMeta(drawerPieStatus).label}` : '';
    // document.getElementById('drawerSub').textContent = `${fmt(base.length)} bản ghi${selected}`;
    renderDrawerList(base);
    openDrawer();
}
function drawerCounts() { return statusDefs.map(st => ({ key: st.key, label: st.label, short: st.short, color: st.color, count: currentDrawerRecords.filter(r => r.status === st.key).length })) }
function renderDrawerPie() {
    const counts = drawerCounts(); const total = counts.reduce((a, c) => a + c.count, 0) || 1;
    const segs = counts.map(c => ({ key: c.key, label: c.short, value: c.count, color: c.color }));
    const active = drawerPieStatus ? counts.find(c => c.key === drawerPieStatus)?.count || 0 : total;
    document.getElementById('drawerPieSvg').innerHTML = overviewSvg(segs, total, fmt(active), drawerPieStatus ? statusMeta(drawerPieStatus).short : 'Tổng', 'drawerStatus');
    document.getElementById('drawerPieLegend').innerHTML = counts.map(c => `<button class="${drawerPieStatus === c.key ? 'active' : ''}" onclick="setDrawerPieStatus('${c.key}')"><i class="sw" style="background:${c.color}"></i><span>${c.short}</span><b>${fmt(c.count)}</b></button>`).join('');
}
function setDrawerPieStatus(st) { drawerPieStatus = st || ''; const sel = document.getElementById('statusFilter'); if (sel) sel.value = drawerPieStatus; renderDrawerPie(); applyDrawerFilters(); }
function renderDrawerList(rs) {
    const body = document.getElementById('drawerBodyCT');
    const roles = [...new Set(rs.map(r => r.role))];
    body.innerHTML = `<div class="drawer-pie-layout"><div class="drawer-pie-box"><div id="drawerPieSvg"></div><button class="ghost" onclick="setDrawerPieStatus('')">Xem tất cả trạng thái</button></div><div class="drawer-pie-side"><h4 style="margin:0">Phân bổ kết quả xử lý</h4><div class="pie-legend" id="drawerPieLegend"></div><div class="action-bar"><button class="primary" onclick="openAssignmentForm()">＋ Giao nhiệm vụ tương ứng</button></div></div></div><div class="filters"><input id="qFilter" placeholder="Tìm mã, tiêu đề, lĩnh vực..." oninput="applyDrawerFilters()"/><select id="roleFilter" onchange="applyDrawerFilters()"><option value="">Tất cả trục</option>${roles.map(r => `<option value="${r}">${axisMeta[r].name}</option>`).join('')}</select><select id="statusFilter" onchange="setDrawerPieStatus(this.value)"><option value="">Tất cả trạng thái</option>${statusDefs.map(s => `<option value="${s.key}" ${drawerPieStatus === s.key ? 'selected' : ''}>${s.label}</option>`).join('')}</select><select id="metricFilter" onchange="applyDrawerFilters()"><option value="">Tất cả loại</option>${Object.keys(metricMeta).map(m => `<option value="${m}">${metricMeta[m].label}</option>`).join('')}</select></div><div class="list-summary" id="listSummary"></div><div id="recordList"></div>`;
    renderDrawerPie(); applyDrawerFilters();
}
function applyDrawerFilters() {
    const q = (document.getElementById('qFilter')?.value || '').toLowerCase();
    const role = document.getElementById('roleFilter')?.value || ''; const status = document.getElementById('statusFilter')?.value || drawerPieStatus || ''; const metric = document.getElementById('metricFilter')?.value || '';
    drawerPieStatus = status;
    const rs = currentDrawerRecords.filter(r => (!role || r.role === role) && (!status || r.status === status) && (!metric || r.metric === metric) && (!q || [r.id, r.title, r.field, r.unit, r.creator, r.receiver].join(' ').toLowerCase().includes(q)));
    const done = rs.filter(r => r.status === 'done').length, risk = rs.filter(r => r.status === 'risk').length, overdue = rs.filter(r => r.status === 'overdue').length;
    document.getElementById('listSummary').innerHTML = `<span class="badge gold">Đang hiển thị: ${fmt(rs.length)}</span><span class="badge">Tổng nền: ${fmt(currentDrawerRecords.length)}</span><span class="badge ok">Hoàn thành: ${fmt(done)}</span><span class="badge warn">Nguy cơ: ${fmt(risk)}</span><span class="badge red">Quá hạn: ${fmt(overdue)}</span><button class="ghost" onclick="openAssignmentForm()">＋ Giao nhiệm vụ nhánh</button>`;
    document.getElementById('recordList').innerHTML = rs.map(r => recordRowHtml(r)).join('') || '<div class="access-lock">Không có bản ghi phù hợp bộ lọc.</div>';
}
function recordRowHtml(r) {
    const st = statusMeta(r.status); const limited = isLimitedRole(r.role);
    return `<button class="record-row" onclick="openRecordDetail('${r.id}')"><div><b class="mono">${r.id}</b><small>${metricMeta[r.metric].short}</small></div><div class="wrap"><div class="title">${limited ? '[Tổng hợp] ' : ''}${r.title}</div><small>${axisMeta[r.role].icon} ${axisMeta[r.role].name} · ${r.field} · ${r.unit}</small></div><div><span class="status-pill" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span></div><div><small>Hạn</small><b>${r.due}</b></div><div><small>Tiến độ</small><div class="progress"><i style="width:${r.progress}%"></i></div><b class="mono">${r.progress}%</b></div></button>`
}

/* ============================== KỊCH BẢN XỬ LÝ (dùng chung hồ sơ + chỉ tiêu) ============================== */
const CUSTOM_SCENARIO_KEY = 'px-ioc-custom-scenarios-v15';
function loadCustomScenarios() { try { return JSON.parse(localStorage.getItem(CUSTOM_SCENARIO_KEY) || '{}') } catch (e) { return {} } }
function saveCustomScenarios(obj) { localStorage.setItem(CUSTOM_SCENARIO_KEY, JSON.stringify(obj || {})) }
function scenarioTemplates() { return Object.assign({}, DEFAULT_SCENARIOS, loadCustomScenarios()) }
function indicatorScenarioKeys(r) { const arr = []; if (r.status === 'overdue') arr.push('overdue'); if (['risk', 'soon'].includes(r.status) || Number(r.progress || 0) < 70) arr.push('slow'); arr.push('data'); if (/cử tri|kiến nghị/i.test(r.indicator || r.title || '')) arr.push('citizen'); arr.push('coordinate'); arr.push(...Object.keys(loadCustomScenarios())); return [...new Set(arr)] }
function recordScenarioKeys(r) { const arr = []; if (r.status === 'overdue') arr.push('overdue'); if (['risk', 'soon'].includes(r.status) || Number(r.progress || 0) < 70) arr.push('slow'); if (r.metric === 'indicator' || /dữ liệu|chỉ tiêu|bản ghi/i.test(r.title || '')) arr.push('data'); if (/cử tri|kiến nghị/i.test(r.field || r.title || '')) arr.push('citizen'); arr.push('coordinate'); arr.push(...Object.keys(loadCustomScenarios())); return [...new Set(arr)] }
function fieldTarget(fid) {
    const parts = String(fid || '').split('::');
    if (parts[0] === 'item') {
        const [, role, catId, idxStr] = parts; const idx = Number(idxStr);
        const cat = (categorySeed[role] || []).find(c => c.id === catId); const it = cat ? cat.items[idx] : null;
        return { scope: 'item', role, catId, idx, cat, label: it ? it[0] : 'Chỉ tiêu con' };
    }
    const [, role, catId] = parts; const cat = (categorySeed[role] || []).find(c => c.id === catId);
    return { scope: 'cat', role, catId, cat, label: cat ? cat.name : 'Lĩnh vực' };
}
function fieldScenarioKeys(fid) {
    const t = fieldTarget(fid); const arr = ['data', 'coordinate'];
    if (t.scope === 'cat' && categoryDataIssues[t.catId]) arr.unshift('overdue');
    if (/cử tri|kiến nghị/i.test(t.label || '')) arr.push('citizen');
    arr.push(...Object.keys(loadCustomScenarios())); return [...new Set(arr)];
}
function scenarioCardHtml(ctx, id, key) { const s = scenarioTemplates()[key]; if (!s) return ''; return `<button class="scenario-card" onclick="${ctx === 'indicator' ? 'selectIndicatorScenario' : ctx === 'field' ? 'selectFieldScenario' : 'selectScenario'}('${id}','${key}')"><div class="scenario-severity"><span class="badge ${s.level === 'Khẩn' ? 'red' : s.level === 'Cao' ? 'warn' : 'ok'}">${esc(s.level)}</span><span class="badge" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3">📋 ${(s.tasks || []).length} nhiệm vụ nhánh</span></div><h4>${esc(s.title)}</h4><p>${esc(s.desc)}</p>${s.objective ? `<p class="scenario-objective">🎯 ${esc(s.objective)}</p>` : ''}<div class="scenario-sla-tags">${(s.sla || []).map(x => `<span class="badge" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip">⏱ ${esc(x)}</span>`).join('')}</div></button>` }
function scenarioFullPageHtml(s, actionBarHtml, leadUnit, coordUnits) {
    const tagStyle = 'max-width:none;white-space:normal;overflow:visible;text-overflow:clip';
    const coordTags = (coordUnits && coordUnits.length) ? coordUnits.map(u => `<span class="badge" style="${tagStyle}">🤝 ${esc(u)}</span>`).join('') : '';
    return `<div class="detail-card scenario-fullpage">
      <div class="scenario-severity" style="margin-bottom:8px"><span class="badge ${s.level === 'Khẩn' ? 'red' : s.level === 'Cao' ? 'warn' : 'ok'}">${esc(s.level || '—')}</span><span class="badge" style="${tagStyle}">📌 ${(s.tasks || []).length} nhiệm vụ nhánh</span></div>
      <h4>📋 Kịch bản điều hành IOC: ${esc(s.title)}</h4><div class="scenario-fullpage-grid">
      <div class="scenario-fullpage-sec wide"><b>1. Mục tiêu</b><p>${esc(s.objective || '—')}</p></div>
      <div class="scenario-fullpage-sec wide"><b>2. Phạm vi áp dụng</b><p>${esc(s.scope || '—')}</p></div>
      <div class="scenario-fullpage-sec wide"><b>3. Quy trình vận hành</b><ol>${(s.process || []).map(p => `<li><b>${esc(p.step)}:</b> ${esc(p.desc)}</li>`).join('') || '<li>—</li>'}</ol></div>
      <div class="scenario-fullpage-sec"><b>4. Kết quả mong đợi</b><div class="scenario-sla-tags">${(s.expectedResults && s.expectedResults.length) ? s.expectedResults.map(x => `<span class="badge" style="${tagStyle}">✅ ${esc(x)}</span>`).join('') : '<span class="muted">—</span>'}</div></div>
      <div class="scenario-fullpage-sec"><b>5. Đơn vị chủ trì / phối hợp</b><div class="scenario-sla-tags"><span class="badge gold" style="${tagStyle}">🏢 ${esc(leadUnit || 'Chưa xác định')}</span>${coordTags}</div><small class="muted" style="display:block;margin-top:6px">Tự lấy theo nhiệm vụ/chỉ tiêu đang áp dụng kịch bản.</small></div>
    </div>${actionBarHtml || ''}</div>`;
}
function scenarioTaskTableHtml(ctx, id, key, s, recordLike) {
    const existingSubs = ctx === 'indicator' ? indicatorSubtasksStore(id) : ctx === 'field' ? fieldSubtasksStore(id) : (recordLike?.subtasks || []);
    const rows = (s.tasks || []).map((t, i) => {
        const already = existingSubs.find(x => x.name === t[0] && x.scenario === key);
        const coordText = (t[3] && t[3].length) ? esc(t[3].join(', ')) : '—';
        const priority = esc(t[4] || (s.level === 'Khẩn' ? 'Cao' : s.level) || 'Trung bình');
        const urgency = esc(t[5] || 'Thường');
        const dueText = already ? esc(already.due || '—') : esc(t[7] || 'Theo lúc áp dụng');
        const checkboxCell = already ? '<span title="Đã tạo nhiệm vụ nhánh này">✅</span>' : `<input type="checkbox" data-scenario-task="${i}" checked/>`;
        return `<tr><td class="tc">${checkboxCell}</td><td class="mono">${already ? esc(already.id) : '—'}</td><td class="subtask-name-col">${esc(t[0])}</td><td class="subtask-content-col">${esc(t[1])}</td><td>${esc(t[2])}</td><td>${coordText}</td><td>${priority}</td><td>${urgency}</td><td>${dueText}</td><td>${already ? '<span class="badge ok">Đã tạo</span>' : '<span class="badge warn">Chưa tạo</span>'}</td></tr>`;
    }).join('');
    return `<div class="detail-card"><h4>Nhiệm vụ nhánh trong kịch bản</h4><div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th></th><th>Mã nhánh</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Đơn vị phối hợp</th><th>Mức độ</th><th>Độ khẩn</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody>${rows || '<tr><td colspan="10">Kịch bản chưa khai báo nhiệm vụ nhánh nào.</td></tr>'}</tbody></table></div></div>`;
}
function scenarioDetailHtml(ctx, id, key, recordLike, subsHtmlFn) {
    const s = scenarioTemplates()[key]; if (!s) return '';
    const leadUnit = recordLike?.unit || '';
    const coordUnits = recordLike?.coordinators || [];
    const actionBarHtml = `<div class="action-bar" style="margin-top:12px"><button class="primary" onclick="${ctx === 'indicator' ? 'applyIndicatorScenarioTasks' : ctx === 'field' ? 'applyFieldScenarioTasks' : 'applyScenarioTasks'}('${id}','${key}')">Tạo các nhiệm vụ nhánh đã chọn</button><button class="ghost" onclick="${ctx === 'indicator' ? 'openIndicatorScenarioSelector' : ctx === 'field' ? 'openFieldScenarioSelector' : 'openScenarioSelector'}('${id}')">Chọn kịch bản khác</button><button class="ghost" onclick="openScenarioCreateForm('${ctx}','${id}')">＋ Thêm kịch bản mới</button></div>`;
    return `${scenarioFullPageHtml(s, '', leadUnit, coordUnits)}${scenarioTaskTableHtml(ctx, id, key, s, recordLike)}${actionBarHtml}`;
}
function openScenarioCreateForm(ctx, id) {
    const backFn = ctx === 'indicator' ? 'openIndicatorScenarioSelector' : ctx === 'field' ? 'openFieldScenarioSelector' : ctx === 'general' ? 'closeModal' : 'openScenarioSelector';
    window.__newScenarioTasksDraft = [];
    document.getElementById('modalTitle').textContent = 'Thêm mới kịch bản xử lý';
    document.getElementById('modalSub').textContent = '';
    const PROCESS_STEP_NAMES = ['Thu thập & đồng bộ dữ liệu', 'Phân tích, đối chiếu, phát hiện bất thường', 'Cảnh báo', 'Đề xuất phương án xử lý', 'Theo dõi kết quả & báo cáo'];
    document.getElementById('modalBody').innerHTML = `<div class="scenario-create-help">Khai báo kịch bản điều hành IOC theo mẫu rút gọn: mục tiêu, phạm vi áp dụng, quy trình vận hành 5 bước, kết quả mong đợi — và danh sách nhiệm vụ nhánh gợi ý để tự động giao việc khi áp dụng. Đơn vị chủ trì/phối hợp sẽ tự lấy theo nhiệm vụ/chỉ tiêu đang áp dụng kịch bản.</div><div class="form2"><div class="field"><label>Mã kịch bản</label><input id="newScenarioKey" value="custom_${Date.now().toString().slice(-5)}" /></div><div class="field"><label>Mức độ</label><select id="newScenarioLevel"><option>Cao</option><option>Khẩn</option><option>Trung bình</option><option>Bình thường</option></select></div><div class="field wide"><label>Tên kịch bản</label><input id="newScenarioTitle" placeholder="Ví dụ: Kịch bản xử lý dữ liệu sai lệch giữa các nguồn" /></div><div class="field wide"><label>Mô tả ngắn (khi nào dùng kịch bản này)</label><textarea id="newScenarioDesc" rows="2" placeholder="Khi nào áp dụng kịch bản này..."></textarea></div>
    <div class="field wide"><label>1. Mục tiêu</label><textarea id="newScenarioObjective" rows="2" placeholder="Mục tiêu của kịch bản..."></textarea></div>
    <div class="field wide"><label>2. Phạm vi áp dụng</label><textarea id="newScenarioScope" rows="2" placeholder="Áp dụng cho đối tượng/địa bàn nào..."></textarea></div>
    <div class="field wide"><label>3. Quy trình vận hành — mỗi dòng 1 bước theo thứ tự: ${PROCESS_STEP_NAMES.map((n, i) => `(${i + 1}) ${n}`).join(' → ')}</label><textarea id="newScenarioProcess" rows="5" placeholder="Mỗi dòng ứng với 1 bước, theo đúng thứ tự ở trên..."></textarea></div>
    <div class="field wide"><label>4. Kết quả mong đợi, mỗi dòng 1 ý</label><textarea id="newScenarioResults" rows="3" placeholder="Mỗi dòng 1 kết quả mong đợi..."></textarea></div>
    <div class="field wide"><label>SLA/Mốc xử lý, mỗi dòng 1 mốc</label><textarea id="newScenarioSla" rows="3" placeholder="Mỗi dòng 1 mốc thời gian xử lý..."></textarea></div>
    <div class="field wide">
      <label>Nhiệm vụ nhánh gợi ý (tự động tạo khi áp dụng kịch bản)</label>
      <div id="newScenarioTasksList" style="display:grid;gap:8px;margin-bottom:8px"></div>
      <button type="button" class="ghost" onclick="openNewScenarioTaskForm()">＋ Thêm nhiệm vụ nhánh</button>
      <div id="newScenarioTaskForm" class="detail-card hidden" style="display:none;margin-top:8px">
        <div class="card-head"><h4>Thông tin nhiệm vụ nhánh</h4></div>
        <div class="form2 compact">
          <div class="field wide"><label>Tên nhiệm vụ nhánh</label><input id="nsTaskName" placeholder="Nhập tên nhiệm vụ nhánh" /></div>
          <div class="field"><label>Người giao</label><input value="Theo tài khoản khi áp dụng" disabled /></div>
          <div class="field"><label>Mã nhiệm vụ nhánh</label><input value="Tự sinh khi áp dụng" disabled /></div>
          <div class="field"><label>Đơn vị chủ trì (nhận việc)</label><select id="nsTaskOwner">${units.map(u => `<option>${esc(u)}</option>`).join('')}</select></div>
          <div class="field wide"><label>Đơn vị/người phối hợp</label>
            <div class="ms-wrap" style="position:relative">
              <div id="nsCoordTrigger" onclick="toggleUnitDropdown('nsCoordDropdown')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px">
                <span id="nsCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span style="position:absolute;top:9px;right:12px;color:#49bcff">⌄</span>
              </div>
              <div id="nsCoordDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)">
                <input type="text" id="nsCoordSearch" placeholder="Tìm đơn vị..." oninput="filterUnitChecklist('nsCoordSearch','nsCoordBox')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" />
                <div id="nsCoordBox" style="display:flex;flex-direction:column;gap:2px">${units.map(u => `<label class="unit-check-row" data-name="${u.toLowerCase()}" style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:400;padding:5px 6px;border-radius:6px;transition:.15s"><input type="checkbox" value="${u}" class="nsCoord" onchange="updateUnitTriggerLabel('nsCoordTriggerText','nsCoordBox','Chọn đơn vị phối hợp')"/>${u}</label>`).join('')}</div>
              </div>
            </div>
          </div>
          <div class="field"><label>Mức độ quan trọng</label><select id="nsTaskPriority"><option>Cao</option><option selected>Trung bình</option><option>Bình thường</option></select></div>
          <div class="field"><label>Độ khẩn</label><select id="nsTaskUrgency"><option>Khẩn cấp</option><option>Gấp</option><option selected>Thường</option></select></div>
          <div class="field half"><label>Ngày bắt đầu</label><input id="nsTaskStart" type="date" /></div>
          <div class="field half"><label>Hạn hoàn thành</label><input id="nsTaskDue" type="date" /></div>
          <div class="field wide"><label>Nội dung/yêu cầu</label><textarea id="nsTaskContent" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu..."></textarea></div>
        </div>
        <div class="action-bar"><button type="button" class="primary" onclick="addNewScenarioTaskRow()">Thêm vào danh sách</button><button type="button" class="ghost" onclick="closeNewScenarioTaskForm()">Hủy</button></div>
      </div>
    </div></div><div class="action-bar"><button class="primary" onclick="saveNewScenarioTemplate('${ctx}','${id}')">Lưu kịch bản mới</button><button class="ghost" onclick="${backFn}('${id}')">Quay lại chọn kịch bản</button></div><div class="detail-card"><h4>Các kịch bản tự tạo hiện có</h4><div class="scenario-template-list">${Object.entries(loadCustomScenarios()).map(([k, s]) => `<div class="scenario-template-row"><div><b>${esc(s.title)}</b><small>${esc(s.desc || '')} · ${esc(s.level || '')}</small></div><button class="ghost danger-btn" onclick="deleteCustomScenario('${k}','${ctx}','${id}')">Xóa</button></div>`).join('') || '<div class="muted">Chưa có kịch bản tự tạo.</div>'}</div></div>`;
    renderNewScenarioTasksList();
    openModal();
}
function renderNewScenarioTasksList() {
    const box = document.getElementById('newScenarioTasksList'); if (!box) return;
    const list = window.__newScenarioTasksDraft || [];
    box.innerHTML = list.length ? list.map((t, i) => `<div class="scenario-template-row"><div><b>${esc(t[0])}</b><small>${esc(t[2])}${(t[3] && t[3].length) ? ' · phối hợp ' + esc(t[3].join(', ')) : ''} · ${esc(t[4] || 'Trung bình')}${t[7] ? ' · hạn ' + esc(t[7]) : ''}</small></div><button type="button" class="ghost danger-btn" onclick="removeNewScenarioTaskRow(${i})">Xóa</button></div>`).join('') : '<div class="muted">Chưa có nhiệm vụ nhánh nào — bấm "＋ Thêm nhiệm vụ nhánh" để khai báo.</div>';
}
function openNewScenarioTaskForm() {
    const form = document.getElementById('newScenarioTaskForm');
    if (!form) return;
    document.getElementById('nsTaskName').value = ''; document.getElementById('nsTaskContent').value = ''; document.getElementById('nsTaskOwner').selectedIndex = 0;
    document.getElementById('nsTaskPriority').selectedIndex = 1; document.getElementById('nsTaskUrgency').selectedIndex = 2;
    document.getElementById('nsTaskStart').value = ''; document.getElementById('nsTaskDue').value = '';
    document.querySelectorAll('.nsCoord').forEach(c => c.checked = false);
    updateUnitTriggerLabel('nsCoordTriggerText', 'nsCoordBox', 'Chọn đơn vị phối hợp');
    form.classList.remove('hidden');
    form.style.display = 'block';
    document.getElementById('nsTaskName').focus();
}
function closeNewScenarioTaskForm() {
    const form = document.getElementById('newScenarioTaskForm');
    if (form) {
        form.classList.add('hidden');
        form.style.display = 'none';
    }
}
function addNewScenarioTaskRow() {
    const name = (document.getElementById('nsTaskName').value || '').trim(); if (!name) { toast('Cần nhập tên nhiệm vụ nhánh.'); return; }
    const content = (document.getElementById('nsTaskContent').value || '').trim() || name;
    const owner = document.getElementById('nsTaskOwner').value;
    const coordinators = Array.from(document.querySelectorAll('.nsCoord:checked')).map(c => c.value);
    const priority = document.getElementById('nsTaskPriority').value;
    const urgency = document.getElementById('nsTaskUrgency').value;
    const startRaw = document.getElementById('nsTaskStart').value || ''; const startDate = startRaw ? startRaw.split('-').reverse().join('/') : '';
    const dueRaw = document.getElementById('nsTaskDue').value || ''; const due = dueRaw ? dueRaw.split('-').reverse().join('/') : '';
    window.__newScenarioTasksDraft = window.__newScenarioTasksDraft || [];
    window.__newScenarioTasksDraft.push([name, content, owner, coordinators, priority, urgency, startDate, due]);
    renderNewScenarioTasksList();
    closeNewScenarioTaskForm();
}
function removeNewScenarioTaskRow(idx) {
    (window.__newScenarioTasksDraft || []).splice(idx, 1);
    renderNewScenarioTasksList();
}
function saveNewScenarioTemplate(ctx, id) {
    const PROCESS_STEP_NAMES = ['Thu thập & đồng bộ dữ liệu', 'Phân tích, đối chiếu, phát hiện bất thường', 'Cảnh báo', 'Đề xuất phương án xử lý', 'Theo dõi kết quả & báo cáo'];
    const keyRaw = (document.getElementById('newScenarioKey')?.value || '').trim().replace(/\s+/g, '_'); const key = keyRaw || `custom_${Date.now()}`;
    const title = (document.getElementById('newScenarioTitle')?.value || '').trim(); if (!title) { toast('Cần nhập tên kịch bản.'); return; }
    const level = document.getElementById('newScenarioLevel')?.value || 'Trung bình';
    const desc = (document.getElementById('newScenarioDesc')?.value || '').trim() || 'Kịch bản tự tạo bởi người dùng.';
    const objective = (document.getElementById('newScenarioObjective')?.value || '').trim();
    const scope = (document.getElementById('newScenarioScope')?.value || '').trim();
    const processLines = (document.getElementById('newScenarioProcess')?.value || '').split('\n').map(x => x.trim()).filter(Boolean);
    const process = PROCESS_STEP_NAMES.map((step, i) => ({ step, desc: processLines[i] || '' })).filter(p => p.desc);
    const expectedResults = (document.getElementById('newScenarioResults')?.value || '').split('\n').map(x => x.trim()).filter(Boolean);
    const sla = (document.getElementById('newScenarioSla')?.value || '').split('\n').map(x => x.trim()).filter(Boolean);
    const tasks = (window.__newScenarioTasksDraft || []).slice();
    const c = loadCustomScenarios(); c[key] = { title, level, desc, objective, scope, process, expectedResults, sla: sla.length ? sla : ['Trong ngày tiếp nhận', '24h cập nhật kết quả'], tasks: tasks.length ? tasks : [[title, desc, 'Đơn vị chuyên môn']] }; saveCustomScenarios(c);
    toast('Đã thêm kịch bản mới.');
    if (ctx === 'indicator') openIndicatorScenarioSelector(id);
    else if (ctx === 'field') openFieldScenarioSelector(id);
    else if (ctx === 'general') openScenarioCreateForm('general', '');
    else openScenarioSelector(id);
}
function deleteCustomScenario(key, ctx, id) { const c = loadCustomScenarios(); delete c[key]; saveCustomScenarios(c); toast('Đã xóa kịch bản tự tạo.'); openScenarioCreateForm(ctx, id); }

/* --- Kịch bản cho hồ sơ/nhiệm vụ --- */
function openScenarioSelector(id) {
    const r = records.find(x => x.id === id); if (!r) return;
    const keys = recordScenarioKeys(r).filter(k => scenarioTemplates()[k]); const st = statusMeta(r.status);
    document.getElementById('modalTitle').textContent = 'Chọn kịch bản xử lý trước khi giao nhiệm vụ nhánh';
    document.getElementById('modalSub').textContent = `${r.id} · ${r.title}`;
    document.getElementById('modalBody').innerHTML = `<div class="scenario-history-badge"><b>Trạng thái hồ sơ chính:</b> <span style="color:${st.color}">${st.label}</span> · Tiến độ ${r.progress}% · Hạn ${r.due}. Chọn 01 kịch bản để hệ thống đề xuất nhiệm vụ nhánh phù hợp.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('record','${id}')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="returnFromScenario('${id}')">Quay lại hồ sơ chính</button></div><div class="scenario-grid">${keys.map(k => scenarioCardHtml('record', id, k)).join('')}</div>`;
    openModal();
}
function selectScenario(id, key) {
    const r = records.find(x => x.id === id); if (!r || !scenarioTemplates()[key]) return; r.selectedScenario = key;
    document.getElementById('modalTitle').textContent = `${scenarioTemplates()[key].title} · ${r.id}`;
    document.getElementById('modalSub').textContent = 'Chọn nhiệm vụ nhánh';
    document.getElementById('modalBody').innerHTML = scenarioDetailHtml('record', id, key, r, subtaskStatsHtml);
    openModal();
}
function applyScenarioTasks(id, key) {
    const r = records.find(x => x.id === id); const s = scenarioTemplates()[key]; if (!r || !s) return;
    const checked = [...document.querySelectorAll('[data-scenario-task]:checked')].map(x => Number(x.dataset.scenarioTask));
    if (!checked.length) { toast('Chưa chọn nhiệm vụ nhánh nào.'); return; }
    r.subtasks = r.subtasks || [];
    checked.forEach(idx => { const t = s.tasks[idx]; const dup = r.subtasks.some(x => x.name === t[0] && x.scenario === key); if (!dup) r.subtasks.push({ id: `${r.id}-N${String(r.subtasks.length + 1).padStart(2, '0')}`, name: t[0], content: t[1], owner: t[2], coordinators: t[3] || [], state: 'Đang xử lý', startDate: t[6] || '', due: t[7] || dueDate(idx, key === 'overdue' ? 'soon' : 'doing'), priority: t[4] || (s.level === 'Khẩn' ? 'Cao' : s.level), urgency: t[5] || 'Thường', progress: 10, scenario: key, created: new Date().toLocaleString('vi-VN') }); });
    r.selectedScenario = key; r.history = r.history || []; r.history.unshift({ time: new Date().toLocaleString('vi-VN'), text: `Áp dụng ${s.title}, tạo ${checked.length} nhiệm vụ nhánh liên quan` });
    toast(`Đã tạo ${checked.length} nhiệm vụ nhánh theo kịch bản.`); returnFromScenario(id);
}
/* --- Bảng thống kê nhiệm vụ nhánh (chung cho renderRecordDetail) --- */
/* Nhóm nhiệm vụ nhánh theo đúng kịch bản đã sinh ra nó (dùng chung cho bảng đầy đủ lẫn bản rút gọn trong cây văn bản) */
function groupSubtasksByScenario(subs) {
    const groups = []; const groupAt = {};
    subs.forEach((s, i) => {
        const key = s.scenario || '';
        if (!(key in groupAt)) { groupAt[key] = groups.length; groups.push({ key, label: key ? (scenarioTemplates()[key]?.title || key) : 'Giao thường (không qua kịch bản)', items: [] }); }
        groups[groupAt[key]].items.push({ s, i });
    });
    return groups;
}
function subtaskStatsHtml(r, filterScenario) {
    const allSubs = r.subtasks || [];
    const scoped = filterScenario === undefined ? allSubs : allSubs.filter(s => (s.scenario || '') === filterScenario);
    const done = scoped.filter(s => (s.state || '').toLowerCase().includes('hoàn')).length; const doing = scoped.filter(s => (s.state || '').toLowerCase().includes('đang')).length; const soon = scoped.filter(s => (s.state || '').toLowerCase().includes('sắp')).length;
    const allGroups = groupSubtasksByScenario(allSubs);
    const groups = filterScenario === undefined ? allGroups : allGroups.filter(g => g.key === filterScenario);
    const groupsHtml = groups.length ? groups.map(g => {
        const rows = g.items.map(({ s, i }) => `<tr class="clickable" onclick="openSubTaskDetail('${r.id}',${i})"><td>${s.id || ('NVN-' + String(i + 1).padStart(2, '0'))}</td><td class="subtask-name-col">${s.name || 'Việc nhánh'}</td><td class="subtask-content-col">${s.content || s.name || '--'}</td><td>${s.owner || '--'}</td><td>${s.due || '--'}</td><td>${s.progress ?? (s.state && s.state.includes('Hoàn') ? 100 : 35)}%</td><td><span class="badge ${s.state && s.state.includes('Hoàn') ? 'ok' : s.state && s.state.includes('Sắp') ? 'warn' : ''}">${s.state || 'Đang xử lý'}</span></td></tr>`).join('');
        return `<div class="task-scenario-group"><div class="task-scenario-heading">🎯 ${g.label}<span class="badge gold">${fmt(g.items.length)}</span></div><div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
    }).join('') : `<div class="subtask-empty">Chưa có nhiệm vụ nhánh${filterScenario !== undefined ? ' trong kịch bản này' : ''}. Bấm "Chọn kịch bản xử lý" để tạo các việc con theo tình huống chậm tiến độ/quá hạn/thiếu dữ liệu.</div>`;
    const heading = filterScenario === undefined ? `Thống kê nhiệm vụ nhánh liên quan ${r.metric === 'docIn' || r.metric === 'docOut' ? 'văn bản' : 'nhiệm vụ'} chính` : `Nhiệm vụ nhánh cùng kịch bản: ${groups[0] ? groups[0].label : (filterScenario ? scenarioTemplates()[filterScenario]?.title || filterScenario : 'Giao thường (không qua kịch bản)')}`;
    const actionBar = filterScenario === undefined ? `<div class="action-bar"><button class="primary" onclick="openScenarioSelector('${r.id}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="toast('Đã xuất bảng nhiệm vụ nhánh của ${r.id}')">Xuất bảng</button></div>` : `<div class="action-bar"><button class="ghost" onclick="toast('Đã xuất bảng nhiệm vụ nhánh của ${r.id}')">Xuất bảng</button></div>`;
    return `<section class="subtask-summary"><div class="subtask-head"><div><h4>${heading}</h4><div class="subtask-meta-note">Chọn kịch bản xử lý → tạo nhiệm vụ nhánh liên quan, nhóm theo đúng kịch bản → có thể thêm mới nhiệm vụ nhánh.</div></div>${actionBar}</div><div class="subtask-kpis"><div class="mini-kpi"><b class="mono">${fmt(scoped.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div><div class="task-scenario-groups">${groupsHtml}</div></section>`;
}
function openSubTaskForm(parentId) {
    const r = records.find(x => x.id === parentId); if (!r) return;
    window.__assignmentFiles = [];
    document.getElementById('modalTitle').textContent = `Giao nhiệm vụ nhánh · ${r.id}`;
    document.getElementById('modalSub').textContent = `Nhiệm vụ nhánh này sẽ là nhiệm vụ con của ${r.id} · ${r.title}`;
    document.getElementById('modalBody').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="returnFromScenario('${parentId}')">← Quay lại hồ sơ chính</button></div><div class="scenario-history-badge"><b>Nhiệm vụ cha:</b> ${r.id} · ${r.title} · Trục ${axisMeta[r.role].icon} ${axisMeta[r.role].name}</div>
    <div class="detail-card">
      <div class="card-head"><h4>Thông tin nhiệm vụ nhánh</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
      <div class="form2 compact widget-body">
      <div class="field wide"><label>Tên nhiệm vụ nhánh</label><input id="subTitle" placeholder="Nhập tên nhiệm vụ nhánh" /></div>
      <div class="field"><label>Người giao</label><input value="${currentAccount.title}" disabled /></div>
      <div class="field"><label>Mã nhiệm vụ nhánh</label><input id="subCode" value="${r.id}-N${String((r.subtasks || []).length + 1).padStart(2, '0')}" disabled /></div>
      <div class="field"><label>Đơn vị chủ trì (nhận việc)</label><select id="subOwner">${units.map(u => `<option>${u}</option>`).join('')}</select></div>
      <div class="field wide"><label>Đơn vị/người phối hợp</label>
        <div class="ms-wrap" style="position:relative">
          <div id="subCoordTrigger" onclick="toggleUnitDropdown('subCoordDropdown')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px">
            <span id="subCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span style="position:absolute;top:9px;right:12px;color:#49bcff">⌄</span>
          </div>
          <div id="subCoordDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)">
            <input type="text" id="subCoordSearch" placeholder="Tìm đơn vị..." oninput="filterUnitChecklist('subCoordSearch','subCoordBox')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" />
            <div id="subCoordBox" style="display:flex;flex-direction:column;gap:2px">${units.map(u => `<label class="unit-check-row" data-name="${u.toLowerCase()}" style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:400;padding:5px 6px;border-radius:6px;transition:.15s"><input type="checkbox" value="${u}" class="subCoord" onchange="updateUnitTriggerLabel('subCoordTriggerText','subCoordBox','Chọn đơn vị phối hợp')"/>${u}</label>`).join('')}</div>
          </div>
        </div>
      </div>
      <div class="field"><label>Mức độ quan trọng</label><select id="subPriority"><option>Cao</option><option selected>Trung bình</option><option>Bình thường</option></select></div>
      <div class="field"><label>Độ khẩn</label><select id="subUrgency"><option>Khẩn cấp</option><option>Gấp</option><option selected>Thường</option></select></div>
      <div class="field half"><label>Ngày bắt đầu</label><input id="subStart" type="date" /></div>
      <div class="field half"><label>Hạn hoàn thành</label><input id="subDue" type="date" /></div>
      <div class="field wide"><label>Nội dung/yêu cầu</label><textarea id="subContent" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu..."></textarea></div>
      <div class="field wide"><label>Đính kèm file</label><input id="subFileInput" type="file" multiple onchange="handleAssignmentFiles(this)" /><div id="assFileList" style="margin-top:5px;font-size:11.5px;color:#8ab0c8">Chưa có file đính kèm.</div></div>
      </div>
    </div>
    <div class="action-bar"><button class="primary" onclick="createSubTaskAssignment('${parentId}')">Phát hành nhiệm vụ nhánh</button><button class="ghost" onclick="openScenarioSelector('${parentId}')">⚡ Dùng kịch bản có sẵn</button><button class="ghost" onclick="closeModal()">Hủy</button></div>`;
    openModal();
}
function createSubTaskAssignment(parentId) {
    const r = records.find(x => x.id === parentId); if (!r) return;
    const name = (document.getElementById('subTitle').value || '').trim(); if (!name) { toast('Cần nhập tên nhiệm vụ nhánh.'); return; }
    const owner = document.getElementById('subOwner').value;
    const coordinators = Array.from(document.querySelectorAll('.subCoord:checked')).map(c => c.value);
    const priority = document.getElementById('subPriority').value;
    const urgency = document.getElementById('subUrgency').value;
    const startDate = document.getElementById('subStart').value || '';
    const dueRaw = document.getElementById('subDue').value || ''; const due = dueRaw ? dueRaw.split('-').reverse().join('/') : dueDate(0, 'doing');
    const content = (document.getElementById('subContent').value || '').trim() || name;
    r.subtasks = r.subtasks || [];
    const id = `${r.id}-N${String(r.subtasks.length + 1).padStart(2, '0')}`;
    const attachments = window.__assignmentFiles || []; const attachmentsKey = attachments.length ? `px-ioc-files-${id}` : null;
    if (attachmentsKey) localStorage.setItem(attachmentsKey, JSON.stringify(attachments));
    r.subtasks.push({ id, name, content, owner, coordinators, state: 'Đang xử lý', due, startDate, priority, urgency, progress: 5, scenario: '', attachmentsKey, evidence: attachments.map(a => a.name), created: new Date().toLocaleString('vi-VN') });
    r.history = r.history || []; r.history.unshift({ time: new Date().toLocaleString('vi-VN'), text: `${currentAccount.title} giao nhiệm vụ nhánh mới cho ${r.id}: ${name} → ${owner}` });
    toast(`Đã giao nhiệm vụ nhánh "${name}" là nhiệm vụ con của ${r.id}.`);
    returnFromScenario(r.id);
}
function openSubTaskDetail(parentId, idx) {
    const r = records.find(x => x.id === parentId); const s = r?.subtasks?.[idx]; if (!r || !s) return;
    document.getElementById('modalTitle').textContent = `Chi tiết nhiệm vụ nhánh · ${s.id || idx + 1}`;
    document.getElementById('modalSub').textContent = `Gắn với ${r.id} · ${r.title}`;
    const attFiles = s.attachmentsKey ? JSON.parse(localStorage.getItem(s.attachmentsKey) || '[]') : [];
    document.getElementById('modalBody').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="returnFromScenario('${parentId}')">← Quay lại hồ sơ chính</button></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id || '--'}</span><b>Nhiệm vụ cha</b><span>${r.id} · ${r.title}</span><b>Kịch bản</b><span>${s.scenario ? scenarioTemplates()[s.scenario]?.title : 'Giao thường'}</span><b>Tên nhiệm vụ</b><span>${s.name || '--'}</span><b>Nội dung</b><span class="wrap">${s.content || s.name || '--'}</span><b>Đơn vị chủ trì</b><span>${s.owner}</span><b>Đơn vị phối hợp</b><span>${(s.coordinators && s.coordinators.length) ? s.coordinators.join(', ') : '—'}</span><b>Ngày bắt đầu</b><span>${s.startDate || '—'}</span><b>Hạn xử lý</b><span>${s.due || '--'}</span><b>Mức ưu tiên</b><span>${s.priority || 'Trung bình'}</span><b>Độ khẩn</b><span>${s.urgency || '—'}</span><b>Trạng thái</b><span>${s.state || 'Đang xử lý'}</span>${attFiles.length ? `<b>File đính kèm</b><span>${attFiles.map(f => `<a href="${f.dataUrl}" download="${f.name}" style="color:#49bcff">${f.name}</a>`).join(', ')}</span>` : ''}</div></div><div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ nhánh đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p><div class="kv"><b>Trạng thái</b><span>${s.state || 'Đang xử lý'}</span><b>Tiến độ</b><span class="mono">${s.progress ?? 30}%</span></div></div></div>${subtaskStatsHtml(r, s.scenario || '')}`;
    openModal();
}

/* ============================== CHI TIẾT 1 HỒ SƠ/NHIỆM VỤ (cấp 2) ============================== */
function openRecordDetail(id, fromId) {
    const r = records.find(x => x.id === id); if (!r) return;
    window.__scenarioReturnDocId = null;
    window.__recordBackId = fromId || null;
    const limited = isLimitedRole(r.role);
    document.getElementById('modalTitle').textContent = `Cấp 2 · ${r.id}`;
    document.getElementById('modalSub').textContent = `${metricMeta[r.metric].label} · ${axisMeta[r.role].name} · ${statusMeta(r.status).label}`;
    renderRecordDetail(r, limited); openModal();
}
function sourceForRecord(r) {
    if (r.metric === 'docIn' || r.metric === 'docOut') return { name: 'Văn bản/PDF', offset: 26 * 60 * 60 * 1000 + 8 * 60 * 1000 };
    if (r.metric === 'indicator') return { name: 'CSDL chuyên ngành', offset: 18 * 60 * 1000 + 15 * 1000 };
    return { name: 'API realtime', offset: 3 * 60 * 1000 + 28 * 1000 };
}
function relTime(offsetMs) {
    const s = Math.floor(offsetMs / 1000);
    if (s < 60) return `${s} giây trước`;
    const m = Math.floor(s / 60); if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60), mm = m % 60; if (h < 24) return `${h} giờ${mm ? ` ${mm} phút` : ''} trước`;
    const d = Math.floor(h / 24), hh = h % 24; return `${d} ngày${hh ? ` ${hh} giờ` : ''} trước`;
}
function dtTime(offsetMs) { const d = new Date(Date.now() - offsetMs); return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }
function renderRecordDetail(r, limited) {
    const isDoc = r.metric === 'docIn' || r.metric === 'docOut';
    const st = statusMeta(r.status);
    let content = '';
    {
        if (isDoc) {
            content = `<div class="detail-grid"><div class="detail-card"><h4>Thông tin văn bản</h4><div class="kv"><b>Loại</b><span>${r.metric === 'docIn' ? '📨 Văn bản đến' : '📄 Văn bản đi'}</span><b>Số/ký hiệu</b><span class="mono">${r.code || '—'}</span><b>Tên văn bản</b><span>${r.title}</span><b>Trích yếu</b><span class="wrap">${r.summary || '—'}</span><b>Loại văn bản</b><span>${r.docType || '—'}</span><b>Trục</b><span>${axisMeta[r.role].icon} ${axisMeta[r.role].name}</span><b>Lĩnh vực</b><span>${r.field}</span><b>Lãnh đạo ký</b><span>${limited ? 'Ẩn theo phân quyền' : (r.signer || '—')}</span><b>Cơ quan ban hành</b><span>${r.issuer || '—'}</span><b>Đơn vị xử lý</b><span>${limited ? 'Ẩn theo phân quyền' : r.unit}</span><b>Ngày văn bản</b><span>${r.created}</span><b>Hạn xử lý</b><span>${r.due}</span><b>Trạng thái</b><span style="color:${st.color}">${st.label}</span></div></div><div class="detail-card"><h4>Mô tả &amp; tiến độ</h4><p class="wrap">${limited ? 'Nội dung được che theo phân quyền.' : r.description}</p><div class="progress"><i style="width:${r.progress}%"></i></div><p><b class="mono">${r.progress}%</b> hoàn thành</p><div class="action-bar"><button class="primary" onclick="openAssignmentFromDocument('${r.id}')">＋ Giao nhiệm vụ từ văn bản này</button><button class="ghost" onclick="openSyncLog('${r.id}')">Xem nhật ký đồng bộ</button><button class="ghost" onclick="toast('Đã gửi nhắc xử lý văn bản tới đơn vị: ${r.unit}')">Nhắc xử lý</button></div></div></div>`;
        } else {
            const linkedDocs = (r.linkedDocIds || []).map(id => records.find(x => x.id === id)).filter(Boolean);
            content = `<div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ/văn bản</h4><div class="kv"><b>Mã nhiệm vụ</b><span>${r.code || '—'}</span><b>Loại văn bản</b><span>${r.docType || '—'}</span><b>Tiêu đề</b><span>${limited ? '[Đã rút gọn theo phân quyền] ' : ''}${r.title}</span><b>Trục</b><span>${axisMeta[r.role].icon} ${axisMeta[r.role].name}</span><b>Lĩnh vực</b><span>${r.field}</span><b>Đơn vị chủ trì</b><span>${limited ? 'Đơn vị liên quan được masking' : r.unit}</span><b>Đơn vị phối hợp</b><span>${limited ? 'Ẩn theo phân quyền' : ((r.coordinators && r.coordinators.length) ? r.coordinators.join(', ') : '—')}</span><b>Người giao</b><span>${limited ? 'Ẩn theo phân quyền' : r.creator}</span><b>Người nhận</b><span>${limited ? 'Ẩn theo phân quyền' : r.receiver}</span><b>Ngày bắt đầu</b><span>${r.startDate || '—'}</span><b>Hạn hoàn thành</b><span>${r.due}</span><b>Mức độ quan trọng</b><span>${r.importance || r.priority}</span><b>Độ khẩn</b><span>${r.urgency || '—'}</span><b>Văn bản liên kết</b><span>${linkedDocs.length ? linkedDocs.map(d => `<a href="javascript:void(0)" onclick="openRecordDetail('${d.id}','${r.id}')" style="color:#49bcff">${d.code} – ${d.title}</a>`).join('; ') : '—'}</span><b>Trạng thái</b><span style="color:${st.color}">${st.label}</span></div></div><div class="detail-card"><h4>Mô tả &amp; tiến độ</h4><p class="wrap">${limited ? 'Nội dung được che theo phân quyền.' : r.description}</p>${r.additionalInfo ? `<p class="wrap"><b>Thông tin bổ sung:</b> ${r.additionalInfo}</p>` : ''}<div class="progress"><i style="width:${r.progress}%"></i></div><p><b class="mono">${r.progress}%</b> hoàn thành</p><div class="action-bar"><button class="primary" onclick="openSubTaskForm('${r.id}')">Giao nhiệm vụ nhánh</button><button class="ghost" onclick="openSyncLog('${r.id}')">Xem nhật ký đồng bộ</button><button class="ghost" onclick="toast('Đã gửi nhắc việc tới đơn vị xử lý: ${r.unit}')">Nhắc việc</button><button class="ghost danger-btn" onclick="toast('Đã lập phiếu báo cáo vượt cấp cho ${r.id}')">Báo cáo vượt cấp</button></div></div></div>`;
        }
    }
    const src = sourceForRecord(r);
    const note = `<div class="record-update-note">Nguồn dữ liệu liên quan: <b>${src.name}</b> · cập nhật gần nhất <b>${dtTime(src.offset)}</b> · <b>${relTime(src.offset)}</b>.</div>`;
    const bottom = isDoc ? linkedTasksTreeHtml(r) : subtaskStatsHtml(r);
    const backRec = window.__recordBackId ? records.find(x => x.id === window.__recordBackId) : null;
    const backHtml = backRec ? `<div class="iip-modal-back"><button class="ghost" onclick="openRecordDetail('${backRec.id}')">← Quay lại ${backRec.id}</button></div>` : '';
    document.getElementById('modalBody').innerHTML = `${backHtml}${note}${content}${bottom}`;
}

/* ============================== CÂY NHIỆM VỤ CỦA 1 VĂN BẢN ============================== */
function openAssignmentFromDocument(docId) {
    const doc = records.find(x => x.id === docId);
    window.__assignmentReturnDocId = docId;
    openAssignmentForm(doc ? doc.metric : 'doc');
    if (doc) { window.__selectedDocs = [doc]; renderSelectedDocsList(); }
}
function linkedTasksTreeHtml(doc) {
    const tasks = records.filter(t => (t.metric === 'assigned' || t.metric === 'received') && t.linkedDocIds?.includes(doc.id));
    if (!tasks.length) return `<div class="detail-card linked-tasks-card"><div class="card-head"><h4>Nhiệm vụ liên quan văn bản này</h4></div><div class="subtask-empty">Chưa có nhiệm vụ nào được giao từ văn bản này. Dùng nút "Giao nhiệm vụ từ văn bản này" ở trên để tạo nhiệm vụ đầu tiên.</div></div>`;
    const rows = tasks.map(t => {
        const st = statusMeta(t.status);
        return `<tr class="clickable" data-task-id="${t.id}" onclick="toggleTaskNode(this,'${t.id}','${doc.id}')"><td class="tc"><span class="tree-toggle">▸</span></td><td class="mono">${t.id}</td><td class="subtask-name-col">${t.title}</td><td>${metricMeta[t.metric].short}</td><td>${t.unit || ''}</td><td>${t.due}</td><td><div class="progress" style="width:76px"><i style="width:${t.progress}%"></i></div></td><td><span class="badge" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span></td><td class="tc"><button type="button" title="Xem chi tiết nhiệm vụ" onclick="event.stopPropagation();openTaskDetailFromDocument('${t.id}','${doc.id}')" style="border:0;background:none;color:#49bcff;cursor:pointer;font-size:15px;line-height:1">👁</button></td></tr><tr class="task-children-row hidden" data-task-children="${t.id}"><td colspan="9"></td></tr>`;
    }).join('');
    return `<div class="detail-card linked-tasks-card"><div class="card-head"><h4>Nhiệm vụ liên quan văn bản này (${fmt(tasks.length)})</h4></div><div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th></th><th>Mã nhiệm vụ</th><th>Tiêu đề</th><th>Loại</th><th>Đơn vị</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
/* Xem nhanh (rút gọn) khi mở 1 nhiệm vụ trong cây: tách rõ 2 phần — kịch bản đang áp dụng, và danh sách nhiệm vụ con (chỉ nội dung chính). Bấm vào 1 nhiệm vụ con mới mở chi tiết đầy đủ. */
function taskInlineSummaryHtml(task) {
    const subs = task.subtasks || [];
    const groups = groupSubtasksByScenario(subs);
    const groupsHtml = groups.length ? groups.map(g => {
        const rows = g.items.map(({ s, i }) => {
            const done = (s.state || '').toLowerCase().includes('hoàn'), soon = (s.state || '').toLowerCase().includes('sắp');
            const stColor = done ? '#2fb174' : soon ? '#d8a50c' : '#2c7dd2';
            return `<button type="button" class="task-subtask-mini-row" onclick="openSubTaskDetail('${task.id}',${i})">
          <span class="task-subtask-mini-name" title="${s.name || ''}">${s.name || 'Việc nhánh'}</span>
          <span class="task-subtask-mini-owner">${s.owner || ''}</span>
          <span class="badge" style="background:${stColor}22;color:${stColor};border:1px solid ${stColor}66">${s.state || 'Đang xử lý'}</span>
          <span class="mono task-subtask-mini-pct">${s.progress ?? 0}%</span>
        </button>`;
        }).join('');
        return `<div class="task-scenario-group">
        <div class="task-scenario-heading">🎯 ${g.label}<span class="badge gold">${fmt(g.items.length)}</span></div>
        <div class="task-subtask-mini-list">${rows}</div>
      </div>`;
    }).join('') : '<div class="subtask-empty">Chưa có nhiệm vụ con nào.</div>';
    return `<div class="task-inline-summary">
      <div class="task-scenario-groups">${groupsHtml}</div>
      <div class="action-bar"><button class="primary" onclick="openScenarioSelector('${task.id}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openSubTaskForm('${task.id}')">Giao nhiệm vụ nhánh</button></div>
    </div>`;
}
function toggleTaskNode(rowEl, taskId, docId) {
    if (docId) window.__scenarioReturnDocId = docId;
    const childRow = rowEl.nextElementSibling; if (!childRow) return;
    const cell = childRow.querySelector('td');
    const willOpen = childRow.classList.contains('hidden');
    const toggle = rowEl.querySelector('.tree-toggle');
    if (willOpen) {
        const task = records.find(x => x.id === taskId);
        cell.innerHTML = task ? taskInlineSummaryHtml(task) : '';
        childRow.classList.remove('hidden');
        if (toggle) toggle.textContent = '▾';
    } else {
        childRow.classList.add('hidden'); cell.innerHTML = '';
        if (toggle) toggle.textContent = '▸';
    }
}
/* Xem chi tiết đầy đủ 1 nhiệm vụ từ trong cây của văn bản — dùng lại popup hiện có, kèm nút quay lại đúng văn bản. */
function openTaskDetailFromDocument(taskId, docId) {
    openRecordDetail(taskId);
    window.__scenarioReturnDocId = docId;
    setTimeout(() => {
        const body = document.getElementById('modalBody');
        if (body && !body.querySelector('.iip-modal-back')) {
            body.insertAdjacentHTML('afterbegin', `<div class="iip-modal-back"><button class="ghost" onclick="openRecordDetail('${docId}')">← Quay lại văn bản</button></div>`);
        }
    }, 0);
}
/* Sau khi tạo/xong luồng kịch bản xử lý, nếu đang thao tác từ trong cây của 1 văn bản thì quay lại đúng văn bản đó (giữ nguyên nhiệm vụ đang mở), ngược lại về trang nhiệm vụ độc lập như cũ. */
function returnFromScenario(taskId) {
    const docId = window.__scenarioReturnDocId;
    if (docId && records.some(x => x.id === docId)) {
        openRecordDetail(docId, window.__recordBackId || undefined);
        setTimeout(() => {
            const row = document.querySelector(`.linked-tasks-card tr.clickable[data-task-id="${taskId}"]`);
            if (row) toggleTaskNode(row, taskId, docId);
        }, 0);
    } else {
        openRecordDetail(taskId, window.__recordBackId || undefined);
    }
}
/* IOC chỉ nhận và hiển thị dữ liệu nhiệm vụ/văn bản đổ về từ phần mềm nguồn — không có thao tác sửa trạng thái/tiến độ tay trong IOC.
   "Xem nhật ký đồng bộ" thay cho form cập nhật cũ: chỉ xem lịch sử đồng bộ, không sửa. */
function openSyncLog(id) {
    const r = records.find(x => x.id === id); if (!r) return;
    const isDoc = r.metric === 'docIn' || r.metric === 'docOut';
    const st = statusMeta(r.status); const src = sourceForRecord(r);
    document.getElementById('modalTitle').textContent = `Nhật ký đồng bộ · ${r.id}`;
    document.getElementById('modalSub').textContent = `${isDoc ? 'Văn bản' : 'Nhiệm vụ'} · Nguồn: ${src.name}`;
    document.getElementById('modalBody').innerHTML = `<div class="manual-note">Trạng thái và tiến độ của ${isDoc ? 'văn bản' : 'nhiệm vụ'} này được đồng bộ tự động từ <b>${src.name}</b> (hệ thống quản lý ${isDoc ? 'văn bản' : 'nhiệm vụ'} bên ngoài IOC). IOC chỉ hiển thị, không chỉnh sửa trực tiếp tại đây.</div><div class="detail-grid"><div class="detail-card"><h4>Trạng thái hiện tại</h4><div class="kv"><b>Trạng thái</b><span style="color:${st.color}">${st.label}</span><b>Tiến độ</b><span>${r.progress}%</span><b>Hạn xử lý</b><span>${r.due}</span><b>Cập nhật gần nhất</b><span>${dtTime(src.offset)} · ${relTime(src.offset)}</span></div></div><div class="detail-card"><h4>Lịch sử đồng bộ</h4><div class="audit">${r.history.map(h => `<div class="audit-item"><b>${h.time}</b><span>${h.text}</span></div>`).join('')}</div></div></div><div class="action-bar"><button class="ghost" onclick="openRecordDetail('${id}')">Quay lại chi tiết</button></div>`;
    openModal();
}

/* ============================== GIAO NHIỆM VỤ / CHỌN VĂN BẢN ============================== */
function generateTaskCode() { const y = new Date().getFullYear(); const rnd = Math.floor(10000 + Math.random() * 90000); return `${y}-${rnd}` }
function handleAssignmentFiles(input) {
    const files = Array.from(input.files || []);
    window.__assignmentFiles = window.__assignmentFiles || [];
    let remaining = files.length;
    if (!remaining) { renderAssignmentFileList(); return }
    files.forEach(f => { const reader = new FileReader(); reader.onload = () => { window.__assignmentFiles.push({ name: f.name, dataUrl: reader.result }); remaining--; if (remaining === 0) renderAssignmentFileList() }; reader.readAsDataURL(f) });
}
function renderAssignmentFileList() { const box = document.getElementById('assFileList'); if (!box) return; box.innerHTML = (window.__assignmentFiles || []).map(f => `📎 ${f.name}`).join('<br/>') || 'Chưa có file đính kèm.' }
function filterUnitChecklist(searchId, boxId) { const q = (document.getElementById(searchId).value || '').trim().toLowerCase(); document.getElementById(boxId).querySelectorAll('label.unit-check-row').forEach(l => { l.style.display = l.dataset.name.includes(q) ? 'flex' : 'none' }) }
function toggleUnitDropdown(id) { const el = document.getElementById(id); const willOpen = el.classList.contains('hidden'); document.querySelectorAll('.ms-dropdown').forEach(d => d.classList.add('hidden')); if (willOpen) el.classList.remove('hidden') }
function updateUnitTriggerLabel(textId, boxId, placeholder) { const checked = Array.from(document.querySelectorAll('#' + boxId + ' input[type=checkbox]:checked')).map(c => c.value); document.getElementById(textId).textContent = checked.length ? checked.join(', ') : placeholder; document.getElementById(textId).style.color = checked.length ? '#d0e8f8' : '#8ab0c8' }
document.addEventListener('click', function (e) { document.querySelectorAll('.ms-wrap').forEach(wrap => { if (!wrap.contains(e.target)) wrap.querySelectorAll('.ms-dropdown').forEach(d => d.classList.add('hidden')) }) });
function renderComboList(inputId, dropdownId, getBaseOptions, storeKey, query) {
    const q = (query || '').trim().toLowerCase();
    const custom = JSON.parse(localStorage.getItem(storeKey) || '[]');
    const all = [...getBaseOptions(), ...custom];
    const opts = q ? all.filter(f => f.toLowerCase().includes(q)) : all;
    const box = document.getElementById(dropdownId);
    box.innerHTML = opts.length ? opts.map(f => `<div class="field-opt-row" style="padding:8px 10px;border-radius:6px;cursor:pointer;font-size:13px">${f}</div>`).join('') : '<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">Không tìm thấy, bấm + để thêm mới</div>';
    Array.from(box.children).forEach((el, i) => { if (opts[i]) el.onclick = () => { document.getElementById(inputId).value = opts[i]; box.classList.add('hidden') } });
    document.querySelectorAll('.ms-dropdown').forEach(d => { if (d.id !== dropdownId) d.classList.add('hidden') });
    box.classList.remove('hidden');
}
function addComboOption(inputId, dropdownId, getBaseOptions, storeKey) {
    const val = (document.getElementById(inputId).value || '').trim();
    if (!val) { toast('Nhập giá trị trước khi thêm.'); return }
    const all = [...getBaseOptions(), ...JSON.parse(localStorage.getItem(storeKey) || '[]')];
    if (!all.some(f => f.toLowerCase() === val.toLowerCase())) {
        const custom = JSON.parse(localStorage.getItem(storeKey) || '[]'); custom.push(val); localStorage.setItem(storeKey, JSON.stringify(custom));
        toast(`Đã thêm: ${val}`);
    } else toast('Lĩnh vực/loại văn bản này đã có trong danh sách.');
    document.getElementById(dropdownId).classList.add('hidden');
}
function assFieldOptions() { return fieldPool[document.getElementById('assRole').value] || [] }
function openAssFieldDropdown() { const input = document.getElementById('assFieldInput'); renderComboList('assFieldInput', 'assFieldDropdown', assFieldOptions, 'px-ioc-custom-fields-' + document.getElementById('assRole').value, ''); input.select() }
function filterAssField() { renderComboList('assFieldInput', 'assFieldDropdown', assFieldOptions, 'px-ioc-custom-fields-' + document.getElementById('assRole').value, document.getElementById('assFieldInput').value) }
function addAssField() { addComboOption('assFieldInput', 'assFieldDropdown', assFieldOptions, 'px-ioc-custom-fields-' + document.getElementById('assRole').value) }
function assDocTypeOptions() { return docTypeOptions }
function openAssDocTypeDropdown() { const input = document.getElementById('assDocTypeInput'); renderComboList('assDocTypeInput', 'assDocTypeDropdown', assDocTypeOptions, 'px-ioc-custom-doctypes', ''); input.select() }
function filterAssDocType() { renderComboList('assDocTypeInput', 'assDocTypeDropdown', assDocTypeOptions, 'px-ioc-custom-doctypes', document.getElementById('assDocTypeInput').value) }
function addAssDocType() { addComboOption('assDocTypeInput', 'assDocTypeDropdown', assDocTypeOptions, 'px-ioc-custom-doctypes') }
/* Nguồn văn bản dùng chung cho ô chọn văn bản, đúng bằng dữ liệu đang hiển thị ở dashboard (lọc theo phân quyền tài khoản). */
function allDocumentRecords() { return records.filter(r => (r.metric === 'docIn' || r.metric === 'docOut') && canSeeRole(r.role)); }
function openDocPicker() {
    docPickerSelection = new Set((window.__selectedDocs || []).map(d => d.id));
    document.getElementById('docPickerSearch').value = '';
    const roleSel = document.getElementById('docPickerRole');
    roleSel.innerHTML = '<option value="">Tất cả trục</option>' + allowedRoles().map(r => `<option value="${r}">${axisMeta[r].name}</option>`).join('');
    const typeSel = document.getElementById('docPickerType');
    const lock = window.__assignmentDocTypeLock;
    typeSel.value = lock || '';
    typeSel.disabled = !!lock;
    const lockNote = document.getElementById('docPickerLockNote');
    if (lockNote) lockNote.classList.toggle('hidden', !lock);
    renderDocPickerList();
    document.getElementById('docPickerOverlay').classList.add('show');
    document.getElementById('docPickerModal').classList.add('open');
}
function closeDocPicker() { document.getElementById('docPickerOverlay').classList.remove('show'); document.getElementById('docPickerModal').classList.remove('open') }
function renderDocPickerList() {
    const q = (document.getElementById('docPickerSearch').value || '').trim().toLowerCase();
    const typeFilter = document.getElementById('docPickerType').value;
    const roleFilter = document.getElementById('docPickerRole').value;
    const list = allDocumentRecords().filter(d => (!typeFilter || d.metric === typeFilter) && (!roleFilter || d.role === roleFilter) && (!q || [d.code, d.title, d.summary].join(' ').toLowerCase().includes(q)));
    document.getElementById('docPickerTbody').innerHTML = list.length ? list.map((d, i) => `<tr><td class="tc"><input type="checkbox" ${docPickerSelection.has(d.id) ? 'checked' : ''} onchange="toggleDocPick('${d.id}',this.checked)"/></td><td class="tc">${i + 1}</td><td class="tc"><span class="badge ${d.metric === 'docIn' ? 'ok' : 'gold'}" title="${d.metric === 'docIn' ? 'Văn bản đến' : 'Văn bản đi'}">${d.metric === 'docIn' ? '📨 Đến' : '📄 Đi'}</span></td><td class="tc" title="${axisMeta[d.role].name}">${axisMeta[d.role].icon}</td><td class="mono" title="${d.code}">${d.code}</td><td class="wrap-cell">${d.title}</td><td class="wrap-cell">${d.summary}</td><td title="${d.signer || ''}">${d.signer || ''}</td><td title="${d.field || ''}">${d.field || ''}</td><td title="${d.issuer || ''}">${d.issuer || ''}</td><td class="tc">${d.created}</td><td class="tc"><button type="button" onclick="openDocDetail('${d.id}')" title="Xem chi tiết" style="border:0;background:none;color:#49bcff;cursor:pointer;font-size:15px;line-height:1">👁</button></td></tr>`).join('') : '<tr><td colspan="12">Không tìm thấy văn bản phù hợp.</td></tr>';
}
function toggleDocPick(id, checked) { if (checked) docPickerSelection.add(id); else docPickerSelection.delete(id) }
function openDocDetail(id) {
    const d = records.find(x => x.id === id); if (!d) return;
    document.getElementById('docDetailSub').textContent = d.code;
    document.getElementById('docDetailBody').innerHTML = `<div class="kv">
      <b>Loại</b><span>${d.metric === 'docIn' ? '📨 Văn bản đến' : '📄 Văn bản đi'}</span>
      <b>Trục</b><span>${axisMeta[d.role].icon} ${axisMeta[d.role].name}</span>
      <b>Số/ký hiệu</b><span class="mono">${d.code}</span>
      <b>Tên văn bản</b><span>${d.title}</span>
      <b>Trích yếu</b><span>${d.summary || ''}</span>
      <b>Loại văn bản</b><span>${d.docType || ''}</span>
      <b>Lãnh đạo ký</b><span>${d.signer || ''}</span>
      <b>Lĩnh vực</b><span>${d.field || ''}</span>
      <b>Cơ quan ban hành</b><span>${d.issuer || ''}</span>
      <b>Ngày văn bản</b><span>${d.created}</span>
    </div>`;
    document.getElementById('docDetailOverlay').classList.add('show');
    document.getElementById('docDetailModal').classList.add('open');
}
function closeDocDetail() { document.getElementById('docDetailOverlay').classList.remove('show'); document.getElementById('docDetailModal').classList.remove('open') }
function confirmDocPicker() {
    window.__selectedDocs = records.filter(d => docPickerSelection.has(d.id));
    renderSelectedDocsList();
    closeDocPicker();
    toast(`Đã chọn ${window.__selectedDocs.length} văn bản.`);
}
function renderSelectedDocsList() {
    const box = document.getElementById('assDocsList'); if (!box) return;
    const docs = window.__selectedDocs || [];
    if (!docs.length) { box.innerHTML = ''; return }
    box.innerHTML = `<table class="compact-table"><thead><tr><th>Loại</th><th>Mã văn bản</th><th>Tên văn bản</th><th>Trích yếu</th><th>Ngày văn bản</th><th></th></tr></thead><tbody>${docs.map(d => `<tr><td>${d.metric === 'docIn' ? '📨 Đến' : '📄 Đi'}</td><td class="mono">${d.code}</td><td>${d.title}</td><td>${d.summary || ''}</td><td>${d.created}</td><td><button type="button" onclick="removeSelectedDoc('${d.id}')" title="Bỏ chọn" style="border:0;background:none;color:#ff6b6b;cursor:pointer;font-weight:900;font-size:15px;line-height:1">×</button></td></tr>`).join('')}</tbody></table>`;
}
function removeSelectedDoc(id) { window.__selectedDocs = (window.__selectedDocs || []).filter(d => d.id !== id); renderSelectedDocsList() }
function openAssignmentForm(source) {
    const returnDocId = window.__assignmentReturnDocId || null; window.__assignmentReturnDocId = null;
    const roles = allowedRoles(); window.__assignmentFiles = []; window.__selectedDocs = [];
    const isDocSource = source === 'docIn' || source === 'docOut' || source === 'doc';
    window.__assignmentDocTypeLock = (source === 'docIn' || source === 'docOut') ? source : null;
    const formTitle = isDocSource ? 'Thêm mới nhiệm vụ từ văn bản' : source === 'field' ? 'Thêm mới nhiệm vụ từ lĩnh vực' : 'Giao nhiệm vụ IOC/CAD';
    document.getElementById('modalTitle').textContent = formTitle; document.getElementById('modalSub').textContent = '';
    document.getElementById('modalBody').innerHTML = `${returnDocId ? `<div class="iip-modal-back"><button class="ghost" onclick="openRecordDetail('${returnDocId}')">← Quay lại văn bản</button></div>` : ''}<div class="detail-card">
      <div class="card-head"><h4>Thông tin chung nhiệm vụ</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
      <div class="form2 compact widget-body">
      <div class="field wide"><label>Tiêu đề nhiệm vụ</label><input id="assTitle" value="Rà soát, cập nhật số liệu chỉ tiêu phục vụ dashboard IOC Thành ủy Hà Nội" /></div>
      <div class="field"><label>Người giao</label><input id="assGiver" value="${currentAccount.title}" disabled /></div>
      <div class="field"><label>Mã nhiệm vụ</label><input id="assCode" value="${generateTaskCode()}" /></div>
      <div class="field"><label>Trục nhận</label><select id="assRole" onchange="document.getElementById('assFieldInput').value=''">${roles.map(r => `<option value="${r}">${axisMeta[r].name}</option>`).join('')}</select></div>
      <div class="field"><label>Đơn vị chủ trì</label><select id="assUnit">${units.map(u => `<option>${u}</option>`).join('')}</select></div>
      <div class="field wide"><label>Đơn vị/người phối hợp</label>
        <div class="ms-wrap" style="position:relative">
          <div id="assCoordTrigger" onclick="toggleUnitDropdown('assCoordDropdown')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px">
            <span id="assCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span style="position:absolute;top:9px;right:12px;color:#49bcff">⌄</span>
          </div>
          <div id="assCoordDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)">
            <input type="text" id="assCoordSearch" placeholder="Tìm đơn vị..." oninput="filterUnitChecklist('assCoordSearch','assCoordBox')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" />
            <div id="assCoordBox" style="display:flex;flex-direction:column;gap:2px">${units.map(u => `<label class="unit-check-row" data-name="${u.toLowerCase()}" style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:400;padding:5px 6px;border-radius:6px;transition:.15s"><input type="checkbox" value="${u}" class="assCoord" onchange="updateUnitTriggerLabel('assCoordTriggerText','assCoordBox','Chọn đơn vị phối hợp')"/>${u}</label>`).join('')}</div>
          </div>
        </div>
      </div>
      <div class="field half"><label>Nhóm lĩnh vực</label><div class="ms-wrap" style="display:flex;gap:6px;align-items:center"><div style="flex:1;position:relative"><input type="text" id="assFieldInput" placeholder="Tìm kiếm" autocomplete="off" oninput="filterAssField()" onfocus="openAssFieldDropdown()" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;outline:0;color:#d0e8f8" /><span style="position:absolute;top:9px;right:12px;color:#49bcff;pointer-events:none">⌄</span><div id="assFieldDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:6px;max-height:220px;overflow-y:auto;box-shadow:0 14px 30px rgba(0,0,0,.45)"></div></div><button type="button" onclick="addAssField()" title="Thêm lĩnh vực mới" style="flex:0 0 auto;width:36px;height:36px;border-radius:9px;border:0;background:#2c7dd2;color:#fff;font-size:18px;font-weight:900;cursor:pointer;line-height:1">+</button></div></div>
      <div class="field"><label>Mức độ quan trọng</label><select id="assImportance"><option>Cao</option><option selected>Bình thường</option></select></div>
      <div class="field"><label>Độ khẩn</label><select id="assUrgency"><option>Khẩn cấp</option><option>Gấp</option><option selected>Thường</option></select></div>
      <div class="field half"><label>Ngày bắt đầu</label><input id="assStart" type="date" /></div>
      <div class="field half"><label>Hạn xử lý</label><input id="assDue" type="date" /></div>
      </div>
    </div>
    <div class="detail-card">
      <div class="card-head"><h4>Thông tin văn bản</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
      <div class="form2 compact widget-body">
      <div class="field"><label>Loại văn bản</label><div class="ms-wrap" style="display:flex;gap:6px;align-items:center"><div style="flex:1;position:relative"><input type="text" id="assDocTypeInput" placeholder="Tìm kiếm" autocomplete="off" oninput="filterAssDocType()" onfocus="openAssDocTypeDropdown()" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;outline:0;color:#d0e8f8" /><span style="position:absolute;top:9px;right:12px;color:#49bcff;pointer-events:none">⌄</span><div id="assDocTypeDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:6px;max-height:220px;overflow-y:auto;box-shadow:0 14px 30px rgba(0,0,0,.45)"></div></div><button type="button" onclick="addAssDocType()" title="Thêm loại văn bản mới" style="flex:0 0 auto;width:36px;height:36px;border-radius:9px;border:0;background:#2c7dd2;color:#fff;font-size:18px;font-weight:900;cursor:pointer;line-height:1">+</button></div></div>
      <div class="field wide"><label>Chọn văn bản (liên kết hệ thống quản lý văn bản)</label><div id="assDocsList" style="display:flex;flex-direction:column;gap:5px;margin-bottom:6px"></div><button type="button" onclick="openDocPicker()" style="border:1px dashed rgba(73,188,255,.45);background:rgba(44,125,210,.08);color:#49bcff;border-radius:10px;padding:9px 14px;cursor:pointer;font-size:13px;font-weight:700">+ Chọn văn bản từ hệ thống quản lý văn bản</button></div>
      <div class="field wide"><label>Ý kiến xử lý</label><textarea id="assDesc" rows="2">Cập nhật dữ liệu đúng, đủ, sạch, sống; đính kèm file Excel/PDF hoặc minh chứng xử lý.</textarea></div>
      <div class="field wide"><label>Đính kèm file</label><input id="assFileInput" type="file" multiple onchange="handleAssignmentFiles(this)" /><div id="assFileList" style="margin-top:5px;font-size:11.5px;color:#8ab0c8">Chưa có file đính kèm.</div></div>
      </div>
    </div>
    <div class="action-bar"><button class="primary" onclick="createAssignment()">Phát hành nhiệm vụ</button><button class="ghost" onclick="saveAssignmentDraft()">Lưu nháp</button><button class="ghost" onclick="closeModal()">Hủy</button></div>`; openModal();
}
function saveAssignmentDraft() {
    const draft = { code: document.getElementById('assCode').value, title: document.getElementById('assTitle').value, role: document.getElementById('assRole').value, unit: document.getElementById('assUnit').value, savedAt: new Date().toLocaleString('vi-VN') };
    const drafts = JSON.parse(localStorage.getItem('px-ioc-drafts') || '[]'); drafts.push(draft); localStorage.setItem('px-ioc-drafts', JSON.stringify(drafts));
    closeModal(); toast('Đã lưu nháp nhiệm vụ.');
}
function createAssignment() {
    const role = document.getElementById('assRole').value; const title = document.getElementById('assTitle').value.trim() || 'Nhiệm vụ mới'; const unit = document.getElementById('assUnit').value; const code = document.getElementById('assCode').value.trim() || generateTaskCode();
    const coordinators = Array.from(document.querySelectorAll('.assCoord:checked')).map(c => c.value);
    const id = `PX-NEW-${Date.now().toString().slice(-6)}`;
    const attachments = window.__assignmentFiles || []; const attachmentsKey = attachments.length ? `px-ioc-files-${id}` : null;
    if (attachmentsKey) localStorage.setItem(attachmentsKey, JSON.stringify(attachments));
    const field = document.getElementById('assFieldInput').value.trim() || 'Chưa phân loại';
    const docType = document.getElementById('assDocTypeInput').value.trim() || '';
    const linkedDocIds = (window.__selectedDocs || []).map(d => d.id);
    const r = { id, code, role, metric: 'assigned', status: 'doing', title, field, docType, creator: currentAccount.title, receiver: axisMeta[role].name, unit, coordinators, importance: document.getElementById('assImportance').value, urgency: document.getElementById('assUrgency').value, priority: document.getElementById('assImportance').value, startDate: document.getElementById('assStart').value || '', due: document.getElementById('assDue').value || '30/06/2026', created: new Date().toLocaleDateString('vi-VN'), progress: 5, description: document.getElementById('assDesc').value, linkedDocIds, evidence: attachments.map(a => a.name), attachmentsKey, history: [{ time: new Date().toLocaleString('vi-VN'), text: `${currentAccount.title} phát hành nhiệm vụ` }], subtasks: [] };
    records.push(r); segmentTemplate[role].assigned.doing += 1; closeModal(); renderAll(); openRecordDetail(id); toast('Đã phát hành nhiệm vụ và lưu file đính kèm (nếu có) vào trình duyệt.');
}

/* ============================== NGUỒN DỮ LIỆU & CẬP NHẬT ============================== */
const sourceDefs = [
    { key: 'api', icon: '🔌', name: 'API realtime', desc: 'Một cửa, văn bản, DVC quốc gia, đồng bộ nhiệm vụ', count: '98%', mode: 'API Gateway / Webhook', freq: 'Realtime / mỗi 1 phút', owner: 'Văn phòng UBND phường', offset: 3 * 60 * 1000 + 28 * 1000, quality: '99,1%', rows: 642, status: 'ok' },
    { key: 'excel', icon: '📗', name: 'Excel import', desc: 'Báo cáo chuyên môn, đoàn thể, mẫu khảo sát xã/phường', count: '42 file', mode: 'Import Excel có kiểm tra schema', freq: 'Khi phát sinh / cuối ngày', owner: 'Cán bộ tổng hợp IOC', offset: 2 * 60 * 60 * 1000 + 16 * 60 * 1000, quality: '96,4%', rows: 187, status: 'late' },
    { key: 'db', icon: '🗄️', name: 'CSDL chuyên ngành', desc: 'Tài chính, giáo dục, nội vụ, đô thị, GPMB, văn hóa', count: '12 nguồn', mode: 'Adapter / ETL delta', freq: '15 phút / theo lịch', owner: 'Đơn vị chuyên môn', offset: 18 * 60 * 1000 + 15 * 1000, quality: '98,7%', rows: 1248, status: 'ok' },
    { key: 'docs', icon: '📎', name: 'Văn bản/PDF', desc: 'Nghị quyết, kết luận, minh chứng, phụ lục, hồ sơ số hóa', count: '165', mode: 'DMS / OCR chỉ mục', freq: 'Ngày / khi phát hành', owner: 'Văn phòng Đảng ủy-HĐND-UBND', offset: 26 * 60 * 60 * 1000 + 8 * 60 * 1000, quality: '94,8%', rows: 305, status: 'stale' },
    { key: 'alert', icon: '🔔', name: 'Cảnh báo IOC', desc: 'Điểm nghẽn, cháy nổ, quá hạn, sắp hạn, lịch họp cần nhắc', count: '27', mode: 'Rule engine', freq: 'Realtime / sự kiện', owner: 'Trực IOC/CAD', offset: 46 * 1000, quality: '99,6%', rows: 189, status: 'ok' },
    { key: 'calendar', icon: '📅', name: 'Lịch công tác/kỳ họp', desc: 'Lịch Đảng ủy, HĐND, UBND, MTTQ; nhắc họp vai trò thư ký', count: '41 lịch', mode: 'Calendar API / nhập nhanh', freq: 'Ngay khi phát sinh', owner: 'Văn phòng phường', offset: 12 * 60 * 1000 + 5 * 1000, quality: '97,9%', rows: 59, status: 'ok' }
];
const bootTime = Date.now();
function sourceAt(s) { return bootTime - s.offset }
function getSource(keyOrName) { return sourceDefs.find(s => s.key === keyOrName || s.name === keyOrName) || sourceDefs[0] }
function freshnessClass(s) { return s.status === 'stale' ? 'stale' : s.status === 'late' ? 'late' : '' }
function renderSources() {
    const box = document.getElementById('sourceList'); if (!box) return;
    box.innerHTML = sourceDefs.map(s => { const t = sourceAt(s); const cls = freshnessClass(s); return `<button class="source-item" onclick="openSourceDetail('${s.key}')"><div class="dot">${s.icon}</div><div><b>${s.name}</b><small>${s.desc}</small><small class="source-update-line ${cls}">🕒 <span class="time">${dtTime(s.offset)}</span><span>·</span><span class="rel">${relTime(s.offset)}</span></small><div class="source-quality"><span>${s.mode}</span><span>${s.freq}</span><span>Độ tin cậy ${s.quality}</span></div></div><div class="source-badge-stack"><span class="badge ${s.status === 'ok' ? 'ok' : s.status === 'late' ? 'warn' : 'red'}">${s.count}</span><span class="badge">${fmt(s.rows)} dòng</span></div></button>` }).join('');
}
function openSourceDetail(keyOrName) {
    const s = getSource(keyOrName); const t = sourceAt(s); const cls = freshnessClass(s);
    const jobs = [0, 1, 2, 3, 4].map(i => ({ time: t - i * (s.key === 'api' ? 4 * 60 * 1000 : s.key === 'alert' ? 9 * 60 * 1000 : 47 * 60 * 1000), type: i === 0 ? 'Đồng bộ gần nhất' : i === 1 ? 'Đối soát dữ liệu' : 'Đồng bộ định kỳ', rows: Math.max(1, Math.round(s.rows / (i + 3))), result: i === 3 && s.status === 'late' ? 'Có cảnh báo chậm' : 'Thành công' }));
    document.getElementById('modalTitle').textContent = 'Nguồn dữ liệu & cập nhật · ' + s.name;
    document.getElementById('modalSub').textContent = `Lần cập nhật gần nhất: ${dtTime(s.offset)} · ${relTime(s.offset)} so với hiện tại`;
    document.getElementById('modalBody').innerHTML = `<div class="freshness-grid"><div class="freshness-kpi"><span>Thời điểm cập nhật</span><b>${dtTime(s.offset)}</b><small>${relTime(s.offset)}</small></div><div class="freshness-kpi"><span>Tần suất/SLA</span><b>${s.freq}</b><small>${s.mode}</small></div><div class="freshness-kpi"><span>Bản ghi/kết nối</span><b>${fmt(s.rows)}</b><small>${s.count} · chủ quản: ${s.owner}</small></div><div class="freshness-kpi"><span>Chất lượng dữ liệu</span><b class="${s.status === 'ok' ? 'ok' : s.status === 'late' ? 'warn' : 'danger'}">${s.quality}</b><small>${s.status === 'ok' ? 'Đúng hạn' : 'Cần rà soát cập nhật'}</small></div></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nguồn</h4><div class="kv"><b>Tên nguồn</b><span>${s.name}</span><b>Mô tả</b><span>${s.desc}</span><b>Cơ chế</b><span>${s.mode}</span><b>Tần suất</b><span>${s.freq}</span><b>Đơn vị phụ trách</b><span>${s.owner}</span><b>Kiểm tra dữ liệu</b><span>Đúng · đủ · sạch · sống · audit log</span></div></div><div class="detail-card"><h4>Data health</h4><div class="data-health"><div><b>Đúng</b><span>Kiểm tra định dạng/mã đơn vị</span></div><div><b>Đủ</b><span>${fmt(s.rows)} dòng có khóa định danh</span></div><div><b>Sạch</b><span>Tỷ lệ trùng lặp thấp, ${s.quality}</span></div><div><b>Sống</b><span>${dtTime(s.offset)} · ${relTime(s.offset)}</span></div></div><div class="action-bar" style="margin-top:12px"><button class="primary" onclick="toast('Đã chạy đồng bộ thử nguồn ${s.name}')">Đồng bộ thử</button><button class="ghost" onclick="toast('Đã mở màn import Excel cho ${s.name}')">Import Excel</button><button class="ghost" onclick="toast('Đã tạo cảnh báo lỗi dữ liệu nguồn ${s.name}')">Cảnh báo lỗi</button><button class="ghost" onclick="toast('Đã gửi yêu cầu xác nhận số liệu tới ${s.owner}')">Yêu cầu xác nhận</button></div></div></div><div class="detail-card"><h4>Nhật ký đồng bộ gần nhất</h4><div class="sync-timeline">${jobs.map(j => `<div class="sync-job"><b>${dtTime(bootTime - j.time + (bootTime - t))}</b><span><b>${j.type}</b><br/><small>${fmt(j.rows)} bản ghi · kiểm tra schema, mã đơn vị, trạng thái xử lý</small></span><span class="badge ${j.result === 'Thành công' ? 'ok' : 'warn'}">${j.result}</span></div>`).join('')}</div></div>`;
    openModal();
}

/* ============================== NOTIFY IOC/CAD ============================== */
function baseNotifications() {
    const roles = allowedRoles();
    const base = [
        { id: 'fire-market', icon: '🔥', role: 'UBND', type: 'Cháy nổ', level: 'Khẩn', title: 'Điểm nóng cháy nổ: cảnh báo khói tại khu chợ Việt Hưng', sub: 'Nguồn: API/CSDL sự kiện + trực ban IOC. Cần kích hoạt SOP PCCC.', metric: 'received', status: 'risk', source: 'API/CSDL sự kiện' },
        { id: 'bottleneck-tthc', icon: '⏰', role: 'UBND', type: 'Điểm nghẽn TTHC', level: 'Cao', title: '08 hồ sơ TTHC có nguy cơ quá hạn', sub: 'Nguồn: Rule engine SLA từ hồ sơ một cửa; cần nhắc việc trong ngày.', metric: 'received', status: 'risk', source: 'Rule engine IOC' },
        { id: 'doc-backlog', icon: '📨', role: 'UBND', type: 'Điểm nghẽn văn bản', level: 'Cao', title: '14 văn bản đến sắp đến hạn xử lý', sub: 'Nguồn: API quản lý văn bản; cần phân công và cập nhật kết quả.', metric: 'docIn', status: 'soon', source: 'API/CSDL sự kiện' },
        { id: 'urban-env', icon: '🚧', role: 'UBND', type: 'Đô thị/môi trường', level: 'Trung bình', title: 'Tồn tại phản ánh đô thị, vệ sinh môi trường', sub: 'Nguồn: Notify thủ công + phản ánh hiện trường; cần giao kiểm tra.', metric: 'received', status: 'soon', source: 'Nhập thủ công' },
        { id: 'hdnd-voter', icon: '🏛️', role: 'HDND', type: 'Giám sát', level: 'Trung bình', title: '03 kiến nghị cử tri chưa cập nhật kết quả', sub: 'Nguồn: Rule engine HĐND; giám sát tiến độ xử lý.', metric: 'received', status: 'soon', source: 'Rule engine IOC' },
        { id: 'mttq-social', icon: '🤝', role: 'MTTQ', type: 'Phản biện', level: 'Trung bình', title: '02 báo cáo phản biện cần xác nhận số liệu', sub: 'Nguồn: Excel/MTTQ; cần đồng bộ dữ liệu .', metric: 'received', status: 'risk', source: 'Excel import' },
        { id: 'party-resolution', icon: '🚩', role: 'DANG', type: 'Nghị quyết', level: 'Cao', title: '06 nhiệm vụ nghị quyết chuyên đề cần kiểm tra', sub: 'Nguồn: Rule engine Đảng ủy; báo cáo Ban Thường vụ.', metric: 'assigned', status: 'risk', source: 'Rule engine IOC' }
    ].filter(n => roles.includes(n.role));
    const manual = (window.__manualNotis || []).filter(n => roles.includes(n.role));
    const cal = calendarStatusCounts();
    const calendarNotis = [];
    if (cal.upcoming + cal.today > 0) calendarNotis.push({ id: 'calendar-upcoming', icon: '📅', role: roles[0] || currentRole, type: 'Lịch họp', level: 'Trung bình', title: `${fmt(cal.upcoming + cal.today)} lịch họp sắp diễn ra/hôm nay`, sub: 'Nguồn: Calendar thư ký; mở calendar để nhắc thành phần tham dự.', metric: 'received', status: 'soon', source: 'Calendar thư ký', calendar: true });
    if (cal.late > 0) calendarNotis.push({ id: 'calendar-late', icon: '⚠️', role: roles[0] || currentRole, type: 'Thư ký', level: 'Cao', title: `${fmt(cal.late)} lịch họp trễ xác nhận/chuẩn bị`, sub: 'Nguồn: Calendar thư ký; cần giao nhiệm vụ chuẩn bị tài liệu.', metric: 'received', status: 'risk', source: 'Calendar thư ký', calendar: true });
    return [...base, ...calendarNotis, ...manual];
}
function renderNotifications() {
    const notis = baseNotifications(); window.__incidents = notis;
    const sourceHtml = `<div class="notify-source"><div class="notify-actions"><button class="primary" onclick="openNotifyForm()">＋ Nhập notify</button><button class="ghost" onclick="openNotifySourceConfig()">Cấu hình nguồn notify</button></div></div>`;
    const list = notis.map(n => `<button class="notify" onclick="${n.calendar ? `openCalendar(null,'${n.title}', '${n.id === 'calendar-late' ? 'late' : 'upcoming'}')` : `openIncidentDetail('${n.id}')`}"><div class="dot">${n.icon}</div><div><b>${n.title}</b></div><span class="badge ${n.level === 'Khẩn' || n.status === 'risk' ? 'red' : 'warn'}">${n.type}</span></button>`).join('') || `<div class="access-lock">Không có notify trong phạm vi quyền hiện tại.</div>`;
    const box = document.getElementById('notifyList'); if (box) box.innerHTML = list + sourceHtml;
}
function openNotifyForm() {
    const roles = allowedRoles();
    document.getElementById('modalTitle').textContent = 'Nhập notify IOC/CAD';
    document.getElementById('modalSub').textContent = '';
    document.getElementById('modalBody').innerHTML = `<div class="manual-note">Notify thủ công dùng cho sự kiện phát sinh tại phường Việt Hưng như điểm nghẽn TTHC, phản ánh đô thị, cháy nổ, lịch họp trễ, văn bản khẩn. Dữ liệu demo được lưu trong phiên trình duyệt.</div><div class="form2"><div class="field"><label>Trục nhận notify</label><select id="notiRole">${roles.map(r => `<option value="${r}">${axisMeta[r].name}</option>`).join('')}</select></div><div class="field"><label>Loại notify</label><select id="notiType"><option>Điểm nghẽn</option><option>Cháy nổ</option><option>TTHC</option><option>Văn bản</option><option>Lịch họp</option><option>Đô thị/môi trường</option></select></div><div class="field"><label>Mức độ</label><select id="notiLevel"><option>Khẩn</option><option selected>Cao</option><option>Trung bình</option></select></div><div class="field"><label>Gắn với hồ sơ</label><select id="notiMetric">${Object.keys(metricMeta).map(m => `<option value="${m}">${metricMeta[m].label}</option>`).join('')}</select></div><div class="field wide"><label>Tiêu đề notify</label><textarea id="notiTitle" rows="2">Điểm nghẽn mới cần xử lý tại phường Việt Hưng</textarea></div><div class="field wide"><label>Khuyến nghị xử lý</label><textarea id="notiSub" rows="3">Đề nghị đơn vị chủ trì kiểm tra, cập nhật kết quả và đính kèm minh chứng trên IOC/CAD.</textarea></div></div><div class="action-bar"><button class="primary" onclick="saveNotify()">Lưu notify</button><button class="ghost" onclick="closeModal()">Hủy</button></div>`;
    openModal();
}
function saveNotify() {
    const role = document.getElementById('notiRole').value, metric = document.getElementById('notiMetric').value;
    const type = document.getElementById('notiType').value, level = document.getElementById('notiLevel').value;
    const icon = type.includes('Cháy') ? '🔥' : type.includes('Lịch') ? '📅' : type.includes('Văn bản') ? '📨' : type.includes('Đô thị') ? '🚧' : '🔔';
    window.__manualNotis = window.__manualNotis || [];
    window.__manualNotis.push({ id: `manual-${Date.now()}`, icon, role, type, level, title: document.getElementById('notiTitle').value.trim() || 'Notify mới', sub: document.getElementById('notiSub').value.trim() || 'Cần xử lý', metric, status: level === 'Khẩn' || level === 'Cao' ? 'risk' : 'soon', source: 'Nhập thủ công' });
    closeModal(); renderNotifications(); toast('Đã nhập notify IOC/CAD và cập nhật danh sách.');
}
function openNotifySourceConfig() {
    document.getElementById('modalTitle').textContent = 'Cấu hình nguồn Notify IOC/CAD';
    document.getElementById('modalSub').textContent = '';
    document.getElementById('modalBody').innerHTML = `<div class="detail-card"><h4>Luồng tạo Notify</h4>${['Rule engine kiểm tra SLA nhiệm vụ/văn bản mỗi 1 phút', 'API/CSDL sự kiện nhận biến động TTHC, văn bản, phản ánh, cháy nổ', 'Calendar thư ký sinh nhắc lịch sắp họp/trễ xác nhận', 'Cán bộ trực IOC nhập notify thủ công khi phát sinh tình huống'].map((s, i) => `<div class="scenario-task" style="grid-template-columns:30px 1fr auto"><i style="width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#12375f;color:#fff;font-style:normal;font-weight:900">${i + 1}</i><span>${s}</span><span class="badge ${i < 2 ? 'ok' : 'gold'}">${i < 2 ? 'Tự động' : 'Có thao tác'}</span></div>`).join('')}</div><div class="detail-card"><h4>Cấu hình demo</h4><table class="compact-table"><thead><tr><th>Nguồn</th><th>Tần suất</th><th>Điều kiện sinh notify</th><th>Người nhận</th></tr></thead><tbody><tr><td>Rule engine IOC</td><td>Realtime/1 phút</td><td>Sắp hạn, nguy cơ trễ, quá hạn</td><td>Lãnh đạo/đơn vị chủ trì</td></tr><tr><td>API/CSDL sự kiện</td><td>Realtime</td><td>Hồ sơ mới, điểm nóng, cháy nổ</td><td>Trực IOC/CAD</td></tr><tr><td>Calendar thư ký</td><td>15 phút/lần</td><td>Lịch họp trong 24h hoặc trễ xác nhận</td><td>Thư ký + chủ trì</td></tr><tr><td>Nhập thủ công</td><td>Khi phát sinh</td><td>Cán bộ trực tạo thông báo</td><td>Theo trục được chọn</td></tr></tbody></table></div>`;
    openModal();
}
function openIncidentDetail(id) {
    const n = (window.__incidents || []).find(x => x.id === id); if (!n) return;
    const related = records.filter(r => canSeeRole(r.role) && r.role === n.role && r.metric === n.metric && r.status === n.status).slice(0, 8);
    document.getElementById('modalTitle').textContent = `Notify IOC/CAD · ${n.type}`;
    document.getElementById('modalSub').textContent = `${axisMeta[n.role].name} · mức ${n.level} · ${n.title}`;
    const isFire = n.id === 'fire-market';
    document.getElementById('modalBody').innerHTML = `<div class="manual-note"><b>Nguồn phát sinh notify:</b> ${n.source || 'Rule engine IOC'} · <b>Vị trí nhập/cấu hình:</b> mục Notify IOC/CAD → nút "Nhập notify" hoặc "Cấu hình nguồn notify".</div><div class="scenario-detail-grid"><div class="detail-card"><h4>Thông tin cảnh báo</h4><div class="kv"><b>Loại</b><span>${n.type}</span><b>Mức độ</b><span class="${n.level === 'Khẩn' ? 'danger' : 'warn'}">${n.level}</span><b>Đơn vị/trục</b><span>${axisMeta[n.role].icon} ${axisMeta[n.role].name}</span><b>Nội dung</b><span>${n.title}</span><b>Khuyến nghị</b><span>${n.sub}</span><b>SLA</b><span>${isFire ? '15 phút tiếp nhận · 30 phút xử lý bước đầu' : 'Trong ngày làm việc'}</span></div><div class="action-bar" style="margin-top:12px"><button class="primary" onclick="openAssignmentForm()">Giao xử lý</button><button class="ghost" onclick="openList({metric:'${n.metric}',role:'${n.role}',status:'${n.status}',title:'${n.title}'})">Mở hồ sơ liên quan</button><button class="ghost danger-btn" onclick="toast('Đã kích hoạt SOP ${n.type} và gửi notify tới đơn vị trực.')">Kích hoạt SOP</button></div></div><div class="detail-card"><h4>SOP xử lý đề xuất</h4>${['Tiếp nhận/cảnh báo IOC', 'Phân loại mức độ & địa bàn', 'Gán đơn vị chủ trì/phối hợp', 'Theo dõi SLA và cập nhật hiện trường', 'Kết thúc xử lý, báo cáo lãnh đạo'].map((s, i) => `<div class="sop-step" style="display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;border:1px solid rgba(87,178,255,.2);background:rgba(6,28,52,.68);border-radius:10px;padding:9px;margin-top:8px"><i style="width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#12375f;color:#fff;font-style:normal;font-weight:900">${i + 1}</i><span>${s}</span><span class="badge ${i < 2 ? 'ok' : 'gold'}">${i < 2 ? 'Tự động' : 'Thao tác'}</span></div>`).join('')}</div></div><div class="detail-card"><h4>Hồ sơ/nhiệm vụ liên quan</h4><table class="compact-table"><thead><tr><th>Mã</th><th>Nội dung</th><th>Đơn vị</th><th>Trạng thái</th></tr></thead><tbody>${related.map(r => `<tr onclick="openRecordFromIncident('${r.id}','${n.id}')"><td>${r.id}</td><td>${r.title}</td><td>${r.unit}</td><td>${statusMeta(r.status).short}</td></tr>`).join('') || '<tr><td colspan="4">Chưa có hồ sơ liên quan</td></tr>'}</tbody></table></div>`;
    openModal();
}
function openRecordFromIncident(taskId, incidentId) {
    openRecordDetail(taskId);
    setTimeout(() => {
        const body = document.getElementById('modalBody');
        if (body && !body.querySelector('.iip-modal-back')) {
            body.insertAdjacentHTML('afterbegin', `<div class="iip-modal-back"><button class="ghost" onclick="openIncidentDetail('${incidentId}')">← Quay lại notify</button></div>`);
        }
    }, 0);
}
function renderCad() {
    document.getElementById('cadBox').innerHTML = `<div class="cmd-row"><button class="ghost" onclick="openAssignmentForm()">📤 <span>Giao nhiệm vụ IOC/CAD</span></button><button class="ghost" onclick="openScenarioCreateForm('general','')">🧩 <span>Tạo kịch bản mới</span></button></div><div class="cmd-row"><button class="ghost" onclick="openList({metric:'received',status:'soon',title:'Nhiệm vụ cần nhắc việc'})">🔔 <span>Nhắc việc sắp hạn</span></button><button class="ghost danger-btn" onclick="openList({metric:null,status:'overdue',title:'Báo cáo vượt cấp: quá hạn'})">⚠️ <span>Báo cáo vượt cấp</span></button></div><button class="primary" onclick="openQuickCommand()">Mở lệnh nhanh điều hành</button>`
}

/* ============================== BẢN ĐỒ GIS (Leaflet) ============================== */
const GC_CENTER = [21.0453, 105.8988], GC_ZOOM = 15;
const gisTileUrls = {
    dark: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap'],
    light: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap'],
    satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 'Tiles © Esri'],
    contrast: ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap']
};
const gisStatusColor = { done: '#2fb174', doing: '#2c7dd2', soon: '#d8a50c', risk: '#d25a19', overdue: '#d33a44' };
const gisStatusLabel = { done: 'Hoàn thành', doing: 'Đang xử lý', soon: 'Sắp đến hạn', risk: 'Nguy cơ trễ', overdue: 'Quá hạn' };
const gisCongTrinhData = [
    { id: 'CT-001', name: 'Nâng cấp trụ sở UBND phường', lat: 21.0453, lng: 105.8982, loai: 'Công sở', status: 'doing', pct: 62, don_vi: 'Văn phòng UBND', han: '30/09/2026' },
    { id: 'CT-002', name: 'Cải tạo đường khu Giang Biên', lat: 21.0459, lng: 105.9052, loai: 'Giao thông', status: 'done', pct: 100, don_vi: 'Công chức Địa chính', han: '15/06/2026' },
    { id: 'CT-003', name: 'Xây dựng nhà văn hóa khu Phúc Đông', lat: 21.0504, lng: 105.9032, loai: 'Văn hóa', status: 'soon', pct: 45, don_vi: 'Công chức VH-XH', han: '10/07/2026' },
    { id: 'CT-004', name: 'Hệ thống thoát nước khu chợ', lat: 21.0426, lng: 105.8962, loai: 'Hạ tầng', status: 'risk', pct: 28, don_vi: 'Công chức Địa chính', han: '05/07/2026' },
    { id: 'CT-005', name: 'Sân thể thao đa năng trường TH', lat: 21.0484, lng: 105.8917, loai: 'Giáo dục', status: 'doing', pct: 70, don_vi: 'Trường học', han: '20/08/2026' },
    { id: 'CT-006', name: 'Dự án GPMB đường vành đai', lat: 21.0404, lng: 105.9042, loai: 'GPMB', status: 'overdue', pct: 18, don_vi: 'Công chức Địa chính', han: '01/06/2026' }
];
const gisPhanAnhData = [
    { id: 'PA-001', name: 'Phản ánh ngập úng khu Giang Biên', lat: 21.0466, lng: 105.9002, loai: 'Môi trường', status: 'risk', ngay: '26/06/2026', nguoi: 'Nguyễn Văn A' },
    { id: 'PA-002', name: 'Lấn chiếm vỉa hè khu chợ Việt Hưng', lat: 21.0434, lng: 105.8965, loai: 'Đô thị', status: 'soon', ngay: '25/06/2026', nguoi: 'Trần Thị B' },
    { id: 'PA-003', name: 'Cột điện nghiêng nguy hiểm khu Phúc Đông', lat: 21.0519, lng: 105.9019, loai: 'Hạ tầng', status: 'risk', ngay: '27/06/2026', nguoi: 'Lê Văn C' },
    { id: 'PA-004', name: 'Chó thả rông cắn người khu Phúc Lợi', lat: 21.0376, lng: 105.8955, loai: 'Trật tự', status: 'done', ngay: '24/06/2026', nguoi: 'Phạm Thị D' },
    { id: 'PA-005', name: 'Ô nhiễm mương thoát nước khu Phúc Lợi', lat: 21.0394, lng: 105.8995, loai: 'Môi trường', status: 'overdue', ngay: '20/06/2026', nguoi: 'Hoàng Văn E' }
];
const gisTruSoData = [
    { id: 'TS-001', name: 'Trụ sở UBND phường Việt Hưng (số 1 phố Vạn Hạnh)', lat: 21.0453, lng: 105.8982, chuc_nang: 'Trung tâm hành chính' },
    { id: 'TS-002', name: 'Trụ sở Đảng ủy phường', lat: 21.0455, lng: 105.8976, chuc_nang: 'Cơ quan Đảng' },
    { id: 'TS-003', name: 'Trụ sở HĐND & MTTQ', lat: 21.0449, lng: 105.8989, chuc_nang: 'Dân chủ & Mặt trận' },
    { id: 'TS-004', name: 'Công an phường', lat: 21.0447, lng: 105.8972, chuc_nang: 'An ninh trật tự' },
    { id: 'TS-005', name: 'Trạm Y tế phường', lat: 21.0439, lng: 105.8997, chuc_nang: 'Y tế cộng đồng' }
];
/* Không còn vùng giám sát mẫu sẵn — layer "zones" chỉ chứa vùng do người dùng tự khoanh (gisStartDraw). */
const gisZoneDefs = [];
const GM = { map: null, base: 'dark', baseLayer: null, labelLayer: null, groups: {}, zoneLayer: null, markerRefs: new Map(), draw: { active: false, points: [], line: null }, userZones: [] };

function gisMarkerIcon(color, emoji, size) {
    size = size || 30;
    return L.divIcon({ className: '', html: '<div class="gis-marker" style="color:' + color + ';background:' + color + '22;border:1.5px solid ' + color + '88;width:' + size + 'px;height:' + size + 'px"><span class="gis-marker-pulse" style="color:' + color + '"></span><span style="font-size:' + Math.round(size * 0.38) + 'px">' + emoji + '</span></div>', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
}
function gisPctBarHtml(pct, col) { return '<div class="gis-pct-bar"><div class="gis-pct-bar-track"><span class="gis-pct-bar-fill" style="width:' + pct + '%;background:' + col + '"></span></div><small>' + pct + '% hoàn thành</small></div>'; }
function gisBadgeHtml(col, label) { return '<span class="gis-pb" style="background:' + col + '22;color:' + col + ';border:1px solid ' + col + '55">' + label + '</span>'; }
function gisTileLayer(theme) { const t = gisTileUrls[theme] || gisTileUrls.dark; const opt = { maxZoom: 20, maxNativeZoom: 19, attribution: t[1] }; if (t[0].indexOf('{s}') >= 0) opt.subdomains = 'abc'; return L.tileLayer(t[0], opt); }
function gisSetTheme(theme) {
    if (!GM.map) return;
    if (GM.baseLayer) GM.map.removeLayer(GM.baseLayer);
    if (GM.labelLayer) { GM.map.removeLayer(GM.labelLayer); GM.labelLayer = null; }
    GM.base = theme; GM.baseLayer = gisTileLayer(theme).addTo(GM.map); { var __tp = GM.map.getPane('tilePane'); if (__tp) __tp.style.filter = theme === 'dark' ? 'invert(1) hue-rotate(180deg) brightness(.86) contrast(1.06) saturate(.62)' : theme === 'light' ? 'grayscale(.82) brightness(1.06) contrast(.9) saturate(.55)' : 'none'; }
    if (theme === 'satellite') GM.labelLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, maxNativeZoom: 19 }).addTo(GM.map);
    const lbl = { dark: 'Nền tối', light: 'Nền sáng', satellite: 'Ảnh vệ tinh', contrast: 'OpenStreetMap' };
    const ll = document.getElementById('gisLiveLabel'); if (ll) ll.textContent = 'GIS trực tuyến • ' + lbl[theme];
    const sel = document.getElementById('gisBaseSelect'); if (sel) sel.value = theme;
}
function createGisGroups() {
    ['congtrinh', 'phananh', 'truso', 'zones', 'heatmap'].forEach(k => { GM.groups[k] = L.layerGroup(); });
    gisCongTrinhData.forEach(ct => {
        const col = gisStatusColor[ct.status] || '#2c7dd2';
        const m = L.marker([ct.lat, ct.lng], { icon: gisMarkerIcon(col, '🏗', 36), riseOnHover: true, title: ct.name });
        m.bindPopup('<h4>🏗 ' + ct.name + '</h4><p><b>Loại:</b> ' + ct.loai + ' · <b>Đơn vị:</b> ' + ct.don_vi + '</p><p><b>Hạn:</b> ' + ct.han + '</p>' + gisPctBarHtml(ct.pct, col) + gisBadgeHtml(col, gisStatusLabel[ct.status]));
        m.addTo(GM.groups.congtrinh);
        GM.markerRefs.set(ct.id, m);
    });
    gisPhanAnhData.forEach(pa => {
        const col = gisStatusColor[pa.status] || '#d33a44';
        const m = L.marker([pa.lat, pa.lng], { icon: gisMarkerIcon(col, '⚠', 34), riseOnHover: true, title: pa.name });
        m.bindPopup('<h4>⚠ ' + pa.name + '</h4><p><b>Loại:</b> ' + pa.loai + ' · <b>Ngày:</b> ' + pa.ngay + '</p><p><b>Người phản ánh:</b> ' + pa.nguoi + '</p>' + gisBadgeHtml(col, gisStatusLabel[pa.status]));
        m.addTo(GM.groups.phananh);
        GM.markerRefs.set(pa.id, m);
    });
    gisTruSoData.forEach(ts => {
        const m = L.marker([ts.lat, ts.lng], { icon: gisMarkerIcon('#39d5ff', '🏢', 34), riseOnHover: true, title: ts.name });
        m.bindPopup('<h4>🏢 ' + ts.name + '</h4><p>' + ts.chuc_nang + '</p><p style="color:#39d5ff;font-size:9px">Trụ sở hành chính phường Việt Hưng</p>');
        m.addTo(GM.groups.truso);
        GM.markerRefs.set(ts.id, m);
    });
    if (window.L && L.heatLayer) {
        const heatPts = [];
        gisPhanAnhData.forEach(pa => { heatPts.push([pa.lat, pa.lng, pa.status === 'overdue' ? 1 : pa.status === 'risk' ? .7 : .4]); });
        gisCongTrinhData.filter(ct => ct.status === 'risk' || ct.status === 'overdue').forEach(ct => { heatPts.push([ct.lat, ct.lng, .8]); });
        GM.groups.heatmap = L.heatLayer(heatPts, { radius: 32, blur: 24, maxZoom: 17, gradient: { 0.2: '#2c7dd2', 0.5: '#d8a50c', 0.8: '#d25a19', 1: '#d33a44' } });
        const hc = document.getElementById('gisHeatCount'); if (hc) hc.textContent = String(heatPts.length).padStart(2, '0');
    }
    gisZoneDefs.forEach(z => {
        L.polygon(z.coords, { color: z.color, weight: 2, fillColor: z.color, fillOpacity: .1, dashArray: '5 4' })
            .bindTooltip(z.name, { permanent: true, direction: 'center', className: 'gis-zone-tooltip' })
            .addTo(GM.groups.zones);
    });
    ['congtrinh', 'phananh', 'truso', 'zones'].forEach(k => { GM.groups[k].addTo(GM.map); });
    updateGisZoneCount();
    updateGisStatus();
}
function updateGisZoneCount() { const zc = document.getElementById('gisZoneCount'); if (zc) zc.textContent = String(gisZoneDefs.length + GM.userZones.length).padStart(2, '0'); }
function updateGisStatus() { const sb = document.getElementById('gisMapStatus'); if (sb) sb.innerHTML = gisCongTrinhData.length + ' công trình&nbsp;·&nbsp;' + gisPhanAnhData.length + ' phản ánh<br>' + gisTruSoData.length + ' trụ sở&nbsp;·&nbsp;' + (gisZoneDefs.length + GM.userZones.length) + ' vùng giám sát'; }
function updateGisCoord() { if (!GM.map) return; const z = GM.map.getZoom(), c = GM.map.getCenter(); const el = document.getElementById('gisCoordinate'); if (el) el.textContent = c.lat.toFixed(4) + ', ' + c.lng.toFixed(4) + ' • Z' + Math.round(z); }
function initGisMap() {
    if (!window.L) { if (window.toast) toast('Leaflet chưa tải – bản đồ GIS không khởi động được'); return; }
    const el = document.getElementById('gisMap'); if (!el) return;
    if (GM.map) { GM.map.invalidateSize(); return; }
    GM.map = L.map('gisMap', { center: GC_CENTER, zoom: GC_ZOOM, zoomControl: false, attributionControl: true, preferCanvas: true });
    gisSetTheme('dark');
    createGisGroups();
    L.control.zoom({ position: 'topright' }).addTo(GM.map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(GM.map);
    GM.map.on('moveend zoomend', updateGisCoord);
    updateGisCoord();
    setupGisControls();
    setTimeout(() => { GM.map.invalidateSize(); }, 300);
    window._gisMap = GM.map;
}
function setupGisControls() {
    const sel = document.getElementById('gisBaseSelect');
    if (sel) sel.onchange = () => { gisSetTheme(sel.value); };
    document.querySelectorAll('[data-gis-layer]').forEach(inp => {
        inp.onchange = () => {
            const key = inp.dataset.gisLayer, on = inp.checked;
            if (!GM.map || !GM.groups[key]) return;
            if (on) GM.groups[key].addTo(GM.map); else GM.map.removeLayer(GM.groups[key]);
        };
    });
    const db = document.getElementById('gisDrawBtn'), fb = document.getElementById('gisFinishBtn'), cb = document.getElementById('gisClearBtn');
    if (db) db.onclick = gisStartDraw; if (fb) fb.onclick = gisFinishDraw; if (cb) cb.onclick = gisClearZone;
    const si = document.getElementById('gisMapSearch');
    if (si) { si.oninput = () => { renderGisSearch(si.value); }; si.onkeydown = e => { if (e.key === 'Enter') { const f = document.querySelector('#gisSearchSuggest button'); if (f) f.click(); } }; }
    document.addEventListener('click', e => { if (!e.target.closest('#gisMapSearch, #gisSearchSuggest')) { const s = document.getElementById('gisSearchSuggest'); if (s) s.style.display = 'none'; } });
}
function renderGisSearch(value) {
    const box = document.getElementById('gisSearchSuggest'); if (!box) return;
    const k = value.trim().toLowerCase();
    if (!k) { box.style.display = 'none'; return; }
    const results = [];
    gisCongTrinhData.forEach(ct => { if ((ct.name + ' ' + ct.loai).toLowerCase().includes(k)) results.push({ icon: '🏗', label: ct.name, sub: ct.loai + ' • ' + gisStatusLabel[ct.status], action: () => { const m = GM.markerRefs.get(ct.id); if (m) { GM.map.flyTo([ct.lat, ct.lng], 16, { duration: .65 }); setTimeout(() => { m.openPopup(); }, 700); } } }); });
    gisPhanAnhData.forEach(pa => { if ((pa.name + ' ' + pa.loai).toLowerCase().includes(k)) results.push({ icon: '⚠', label: pa.name, sub: pa.loai + ' • ' + gisStatusLabel[pa.status], action: () => { const m = GM.markerRefs.get(pa.id); if (m) { GM.map.flyTo([pa.lat, pa.lng], 16, { duration: .65 }); setTimeout(() => { m.openPopup(); }, 700); } } }); });
    gisTruSoData.forEach(ts => { if ((ts.name + ' ' + ts.chuc_nang).toLowerCase().includes(k)) results.push({ icon: '🏢', label: ts.name, sub: ts.chuc_nang, action: () => { const m = GM.markerRefs.get(ts.id); if (m) { GM.map.flyTo([ts.lat, ts.lng], 17, { duration: .65 }); setTimeout(() => { m.openPopup(); }, 700); } } }); });
    if (!results.length) { box.style.display = 'none'; return; }
    box.innerHTML = results.slice(0, 8).map((r, i) => '<button data-i="' + i + '">' + r.icon + ' <span>' + r.label + '<br><em style="font-size:8px;color:#7598b0">' + r.sub + '</em></span></button>').join('');
    box.style.display = 'block';
    box.querySelectorAll('button').forEach((btn, i) => { btn.onclick = () => { results[i].action(); box.style.display = 'none'; const si = document.getElementById('gisMapSearch'); if (si) si.value = ''; }; });
}
function gisStartDraw() {
    if (!GM.map || GM.draw.active) return;
    GM.draw.active = true; GM.draw.points = [];
    GM.map.dragging.disable(); GM.map.doubleClickZoom.disable();
    const h = document.getElementById('gisDrawHint'), db = document.getElementById('gisDrawBtn'), fb = document.getElementById('gisFinishBtn');
    if (h) h.style.display = 'block'; if (db) db.classList.add('active'); if (fb) fb.style.display = '';
    GM.map.on('click', gisDrawPoint); GM.map.once('dblclick', gisFinishDraw);
    if (window.toast) toast('Khoanh vùng GIS: click từng điểm trên bản đồ, nhấn Hoàn tất hoặc double-click để đóng vùng.');
}
function gisDrawPoint(e) {
    GM.draw.points.push(e.latlng);
    if (GM.draw.line) GM.map.removeLayer(GM.draw.line);
    GM.draw.line = L.polyline(GM.draw.points, { color: '#59caff', weight: 2, dashArray: '5 5' }).addTo(GM.map);
}
function gisFinishDraw() {
    if (!GM.draw.active) return;
    if (GM.draw.points.length < 3) { if (window.toast) toast('Cần tối thiểu 3 điểm để tạo vùng giám sát.'); gisStopDraw(); return; }
    const colors = ['#f0a923', '#ef4444', '#29d5ea', '#2fb174', '#a78bfa'];
    const col = colors[GM.userZones.length % colors.length];
    const coords = GM.draw.points.map(ll => [ll.lat, ll.lng]);
    const poly = L.polygon(coords, { color: col, weight: 2, fillColor: col, fillOpacity: .12 }).bindTooltip('Vùng GS-' + (GM.userZones.length + 1), { permanent: true, direction: 'center', className: 'gis-zone-tooltip' });
    poly.addTo(GM.groups.zones);
    GM.userZones.push(poly);
    gisStopDraw();
    updateGisZoneCount();
    updateGisStatus();
    if (window.toast) toast('Đã tạo vùng giám sát ' + GM.userZones.length + ' trên bản đồ GIS.');
}
function gisStopDraw() {
    GM.draw.active = false; GM.draw.points = [];
    if (GM.draw.line) { GM.map.removeLayer(GM.draw.line); GM.draw.line = null; }
    GM.map.dragging.enable(); GM.map.doubleClickZoom.enable();
    GM.map.off('click', gisDrawPoint);
    const h = document.getElementById('gisDrawHint'), db = document.getElementById('gisDrawBtn'), fb = document.getElementById('gisFinishBtn');
    if (h) h.style.display = 'none'; if (db) db.classList.remove('active'); if (fb) fb.style.display = 'none';
}
function gisClearZone() {
    if (GM.draw.active) { if (GM.draw.line) GM.map.removeLayer(GM.draw.line); gisStopDraw(); return; }
    const z = GM.userZones.pop();
    if (z) { GM.groups.zones.removeLayer(z); if (window.toast) toast('Đã xóa vùng giám sát vừa tạo.'); }
    else if (window.toast) toast('Chưa có vùng tự tạo để xóa.');
    updateGisZoneCount();
    updateGisStatus();
}
function gisResetView() { if (GM.map) GM.map.flyTo(GC_CENTER, GC_ZOOM, { duration: .7 }); }
function gisFocusLayer(key) {
    if (!GM.map) return;
    const pts = [];
    if (key === 'congtrinh') { gisCongTrinhData.forEach(ct => { pts.push([ct.lat, ct.lng]); }); }
    else if (key === 'phananh') { gisPhanAnhData.forEach(pa => { pts.push([pa.lat, pa.lng]); }); }
    else if (key === 'truso') { gisTruSoData.forEach(ts => { pts.push([ts.lat, ts.lng]); }); }
    if (pts.length) GM.map.fitBounds(pts, { padding: [40, 40], maxZoom: 16 });
    const inp = document.querySelector('[data-gis-layer="' + key + '"]');
    if (inp && !inp.checked) { inp.checked = true; if (GM.groups[key]) GM.groups[key].addTo(GM.map); }
}
function gisToggleFullscreen(btn) {
    const widget = document.querySelector('.gis-widget');
    if (!widget) return;
    const isFs = widget.classList.toggle('gis-fs-active');
    if (btn) { btn.textContent = isFs ? '✕' : '⛶'; btn.title = isFs ? 'Thoát toàn màn hình' : 'Toàn màn hình'; }
    setTimeout(() => { GM.map && GM.map.invalidateSize(); }, 120);
    if (isFs) {
        widget.scrollIntoView({ behavior: 'smooth' });
        document.addEventListener('keydown', function _esc(e) { if (e.key === 'Escape') { gisToggleFullscreen(btn); document.removeEventListener('keydown', _esc); } });
    }
}

/* ============================== CHỈ TIÊU / LĨNH VỰC (mục Chỉ tiêu) ============================== */
const CDL_PAL = ['#2fb174', '#2c7dd2', '#d8a50c', '#d25a19', '#a78bfa', '#39d5ff', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#f97316'];
function fmtCompact(n) { n = Number(n) || 0; return n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 10000 ? (n / 1000).toFixed(1) + 'K' : fmt(n); }
function catTotal(cat) { return cat.items.reduce((s, it) => s + (Number(it[1]) || 0), 0) }
function isScheduleIndicator(name) { return /lịch|kỳ họp|chương trình kỳ họp/i.test(name || '') }

function renderCatDonut(cat) {
    const items = cat.items || []; if (!items.length) return '';
    const total = items.reduce((s, it) => s + (Number(it[1]) || 0), 0); if (!total) return '';
    let arcs = '', a = -Math.PI / 2;
    items.forEach((it, i) => {
        const cnt = Number(it[1]) || 0; if (!cnt) return;
        const sw = (cnt / total) * 2 * Math.PI;
        arcs += '<path class="cat-donut-seg" data-idx="' + i + '" onclick="catDonutSegmentClick(\'' + cat.role + '\',\'' + cat.id + '\',' + i + ')" d="' + donutArc(100, 100, 68, (a * 180 / Math.PI) + 90, ((a + sw - 0.014) * 180 / Math.PI) + 90) + '" fill="none" stroke="' + CDL_PAL[i % CDL_PAL.length] + '" stroke-width="26" stroke-linecap="butt"/>';
        a += sw;
    });
    const cname = cat.name.length > 13 ? cat.name.slice(0, 12) + '…' : cat.name;
    const legend = items.map((it, i) => {
        const nm = it[0], cnt = Number(it[1]) || 0, sh = nm.length > 33 ? nm.slice(0, 32) + '…' : nm;
        return '<div class="cdl-item" onclick="catDonutSegmentClick(\'' + cat.role + '\',\'' + cat.id + '\',' + i + ')"><span class="cdl-dot" style="background:' + CDL_PAL[i % CDL_PAL.length] + '"></span><span class="cdl-name">' + sh + '</span><span class="cdl-cnt">' + fmtCompact(cnt) + '</span></div>';
    }).join('');
    return '<div class="cat-donut-wrap">'
        + '<div class="cat-donut-svg"><svg viewBox="0 0 200 200" width="156" height="156" xmlns="http://www.w3.org/2000/svg">'
        + '<circle cx="100" cy="100" r="68" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="26"/>'
        + arcs
        + '<circle cx="100" cy="100" r="35" fill="transparent" cursor="pointer" onclick="catDonutClearSelection()" class="cat-donut-center"/>'
        + '<text x="100" y="94" text-anchor="middle" font-size="26" font-weight="700" fill="#e8f4ff">' + fmtCompact(total) + '</text>'
        + '<text x="100" y="113" text-anchor="middle" font-size="11" fill="#7aaed4">' + cname + '</text>'
        + '<text x="100" y="127" text-anchor="middle" font-size="10" fill="#4a7ea8">bản ghi · click để fill</text>'
        + '</svg></div>'
        + '<div class="cat-donut-legend"><div class="cdl-title">Phân bổ theo chỉ tiêu con — click để fill số liệu vào bảng</div>' + legend + '</div>'
        + '<button class="ghost" style="margin-top:6px;font-size:10.5px;padding:4px 10px" onclick="catDonutClearSelection()">Bỏ chọn</button>'
        + '</div>';
}
/* Click vào segment của donut (hoặc legend item) → fill số liệu vào bảng 126 đơn vị */
let __catDonutSelectedIdx = null;
function catFillTableColumn(role, catId, idx, valOverride, labelSuffix) {
    //console.log('col-active', { role, catId, idx, valOverride, labelSuffix })
    const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat) return;
    const it = cat.items[idx]; if (!it) return;
    __catDonutSelectedIdx = idx;
    const name = it[0], val = (valOverride !== undefined && valOverride !== null) ? valOverride : Number(it[1]) || 0;
    document.querySelectorAll('.cat-donut-seg').forEach(el => el.classList.remove('cat-donut-seg-active'));
    document.querySelectorAll(`.cat-donut-seg[data-idx="${idx}"]`).forEach(el => el.classList.add('cat-donut-seg-active'));
    document.querySelectorAll('.cdl-item').forEach(el => el.classList.remove('cdl-item-active'));
    const legendItems = document.querySelectorAll('.cdl-item');
    if (legendItems[idx]) legendItems[idx].classList.add('cdl-item-active');
    const labelPart = labelSuffix ? ' · ' + labelSuffix : '';
    const seed = String(role + catId + name + labelSuffix).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const unitVals = HN_UNIT_NAMES.map((_, ui) => {
        const r = ((seed + ui * 37 + idx * 53) % 100) / 100;
        return val > 0 ? Math.round((val / 126) * (0.3 + r * 1.4)) : 0;
    });
    const tbody = document.querySelector('.gen-unit-box table tbody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    HN_UNIT_NAMES.forEach((_, ui) => {
        const cells = rows[ui]?.querySelectorAll('td');
        if (cells && cells[idx + 1]) cells[idx + 1].textContent = fmt(unitVals[ui]);
    });
    const thead = document.querySelector('.gen-unit-box table thead tr');
    // if (thead) {
    //     const ths = thead.querySelectorAll('th');
    //     ths.forEach(t => t.classList.remove('col-active'));
    //     if (ths[idx + 1]) ths[idx + 1].classList.add('col-active');
    // }
    //console.log('cardInfo renderFilterTable', cardInfo)
    const title = document.querySelector('.gen-unit-box .cdl-title');
    if (title) title.textContent = `Danh sách:${actionChart ? ' · Đã chọn: ' + actionChart : ` ${cardInfo.titleDashboard || ""}`}`;
    // if (title) title.textContent = `Danh sách:${actionChart ? ' · Đã chọn: ' + actionChart : ''}`;
    const note = document.querySelector('.gen-unit-box > p');
    if (note) {
        const total = unitVals.reduce((s, v) => s + v, 0);
        note.innerHTML = 'Đã chọn "' + esc(name) + '" (' + fmt(val) + ' bản ghi) — phân bổ <b>' + fmt(total) + ' bản ghi</b> theo 126 đơn vị.';
    }
}
function catDonutSegmentClick(role, catId, idx) {
    const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat) return;
    const it = cat.items[idx]; if (!it) return;
    if (__catDonutSelectedIdx === idx) { catDonutClearSelection(); return; }
    catFillTableColumn(role, catId, idx, null, '');
}
function catDonutClearSelection() {
    __catDonutSelectedIdx = null;
    document.querySelectorAll('.cat-donut-seg').forEach(el => el.classList.remove('cat-donut-seg-active'));
    document.querySelectorAll('.cdl-item').forEach(el => el.classList.remove('cdl-item-active'));
    const tbody = document.querySelector('.gen-unit-box table tbody');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        HN_UNIT_NAMES.forEach((_, ui) => {
            const cells = rows[ui]?.querySelectorAll('td');
            if (cells) cells.forEach((td, ci) => { if (ci > 0) td.textContent = '0'; });
        });
    }
    const thead = document.querySelector('.gen-unit-box table thead tr');
    if (thead) thead.querySelectorAll('th').forEach(t => t.classList.remove('col-active'));
    //console.log('cardInfo renderFilterTable', cardInfo)
    const title = document.querySelector('.gen-unit-box .cdl-title');
    if (title) title.textContent = `Danh sách:${actionChart ? ' · Đã chọn: ' + actionChart : ` ${cardInfo.titleDashboard || ""}`}`;
    // if (title) title.textContent = `Danh sách:${actionChart ? ' · Đã chọn: ' + actionChart : ''}`;
    const note = document.querySelector('.gen-unit-box > p');
    if (note) note.innerHTML = 'Lĩnh vực này chưa có số liệu thật theo từng đơn vị — tạm hiển thị 0, chờ cập nhật dữ liệu.';
}

/* Preview kiểu "hàng thống kê + thanh mini" (port từ dashboard Giáo dục) dùng chung cho thẻ lĩnh vực khối UBND */
/* Bản thu gọn của phanToDimBodyHtml, dùng cho card preview nhỏ ở lưới chính — vẫn theo đúng 4 quy tắc, chỉ giảm kích thước */
function compactPhanToHtml(p) {
    if (p.type === 'stat') {
        const pctItems = p.items.filter(x => isPercentLabel(x.label));
        const plainItems = p.items.filter(x => !isPercentLabel(x.label));
        let html = '';
        if (pctItems.length) html += `<div class="mini-pct-row">${pctItems.map((x, i) => `<span class="mini-pct-chip" style="border-color:${PART_PAL[i % PART_PAL.length]}66" title="${esc(x.label)}"><b style="color:${PART_PAL[i % PART_PAL.length]}">${fmt(x.value)}%</b> ${esc(x.label.replace(/\s*\(%\)\s*$/, ''))}</span>`).join('')}</div>`;
        if (plainItems.length) html += `<div class="mini-stat-row">${plainItems.map(x => `<span class="mini-stat-chip" title="${esc(x.label)}">
        <b>${esc(x.label)}:</b> ${fmt(x.value)}${x.uint ? `<span> ${esc(x.uint)}</span>` : ''}</span>`).join('')}</div>`;
        return html;
    }
    if (shouldRankBar(p.items)) {
        const max = Math.max(...p.items.map(x => Number(x.value) || 0)) || 1;
        return `<div class="mini-rank">${p.items.map((x, i) => `<div class="mini-rank-row" title="${esc(x.label)}: ${fmt(x.value)}"><div class="mini-rank-track"><div style="width:${(x.value / max * 100).toFixed(1)}%;background:${PART_PAL[i % PART_PAL.length]}"></div></div><b>${fmt(x.value)}</b></div>`).join('')}</div>`;
    }
    const tot = p.items.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
    const segsHtml = p.items.map((x, i) => `<div style="flex:${(x.value / tot * 100).toFixed(1)};background:${PART_PAL[i % PART_PAL.length]};border-radius:3px" title="${esc(x.label)}: ${fmt(x.value)}"></div>`).join('');
    const legendHtml = p.items.map((x, i) => `<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><i style="width:7px;height:7px;border-radius:2px;background:${PART_PAL[i % PART_PAL.length]};display:inline-block;flex:0 0 auto"></i>${fmt(x.value)}</span>`).join('');
    return `<div style="display:flex;gap:3px;height:8px">${segsHtml}</div><p style="font-size:9px;color:#c8dcec;margin:5px 0 0">${legendHtml}</p>`;
}

function ChartType(dim, items, type) { return { dim, type, items: items.map(x => ({ label: x[0], value: x[1], uint: x[2] })) }; }
function RenderItemsDashborad(charts) {
    //// console.log('RenderItemsDashborad', charts)
    return charts.map(chart => {
        const total = chart.dataChart.reduce((sum, item) => sum + Number(item.value || 0), 0);
        return [
            chart.titleChart,
            total,
            '',
            `Mô tả ${chart.titleChart}`,
            [
                ChartType(
                    chart.uint,
                    chart.dataChart.map(e => e.uint ? [e.label, Number(e.value || 0), e.uint] : [e.label, Number(e.value || 0)]),
                    chart.typeChart
                    // (window.TYPE === 'so') ? 'stat' : 'bar' // Kiểm tra điều kiện ở đây
                )
            ]
        ];
        // return [chart.titleChart, total, '', `Mô tả ${chart.titleChart}`, [ChartType(chart.uint, chart.dataChart.map(e => ([e.label, Number(e.value || 0)])), chart.typeChart.includes('bar') ? 'bar' : 'star')]]
    })

}
function soCategoryPreviewHtml(cat) {
    if (cat._id === 'chart_vu_co_so_dang' || cat._parent_id === 'vu_co_so_dang_dang_vien') {
        const previewItems = [
            ['Đảng viên hiện có', 5718743, '#2a78d6'],
            ['Đảng viên mới kết nạp trong kỳ', 99909, '#1baf7a'],
            ['Đảng viên nữ', 2025845, '#eda100'],
            ['Tổ chức cơ sở đảng theo loại hình cơ sở', 57332, '#4a3aa7']
        ];
        return `<div style="display:grid;gap:7px;height:100%;overflow-y:auto">
          ${previewItems.map(item => `<div class="cat-preview-item"><p class="cpi-label">${item[0]}</p><div style="height:8px;background:${item[2]};border-radius:3px"></div><p style="font-size:11px;color:#dceeff;margin:5px 0 0;font-weight:700">${fmt(item[1])}</p></div>`).join('')}
        </div>`;
    }
    if (cat.__api && cat.__previewRows && cat.__previewRows.length) {
        return `<div style="display:grid;gap:7px;height:100%;overflow-y:auto">${cat.__previewRows.map(r => `
        <div style="background:rgba(6,28,52,.68);border:1px solid rgba(87,178,255,.16);border-radius:10px;padding:8px 10px">
          <p style="font-weight:700;font-size:11.5px;margin:0 0 6px;color:#eaf6ff">${esc(r.label)}</p>
          ${r.bodyHtml}
        </div>`).join('')}</div>`;
    }
    const role = cat.role;
    //// console.log('soCategoryPreviewHtml', cat)
    const rows = (RenderItemsDashborad(cat.charts) || []).map(it => {
        //// console.log('RenderItemsDashborad', it)
        const name = it[0], declared = Number(it[1]) || 0, itemParts = it[4] || [];
        const dim = itemParts.find(p => p.type === 'bar') || itemParts.find(p => p.type === 'stat');
        if (dim) return { label: name, bodyHtml: compactPhanToHtml(dim) };
        const recs = indicatorRecordsFor(role, name);
        const tot = recs.length || declared || 1;
        const cnts = {}; CAT_ST.forEach(s => cnts[s.k] = recs.filter(r => r.status === s.k).length);
        const parts = CAT_ST.map(s => ({ l: s.l, c: s.c, n: cnts[s.k] || 0 })).filter(s => s.n > 0);
        const list = parts.length ? parts : [{ l: 'Chưa phân loại', c: '#2c7dd2', n: tot }];
        const tot2 = list.reduce((s, x) => s + x.n, 0) || 1;
        const segsHtml = list.map(s => `<div style="flex:${(s.n / tot2 * 100).toFixed(1)};background:${s.c};border-radius:3px" title="${esc(s.l)}: ${fmt(s.n)}"></div>`).join('');
        const legendHtml = list.map(s => `<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><i style="width:7px;height:7px;border-radius:2px;background:${s.c};display:inline-block;flex:0 0 auto"></i>${fmt(s.n)}</span>`).join('');
        return { label: name, bodyHtml: `<div style="display:flex;gap:3px;height:8px">${segsHtml}</div><p style="font-size:9px;color:#c8dcec;margin:5px 0 0">${legendHtml}</p>` };
    });
    if (!rows.length) return '<div class="access-lock" style="height:100%">Chưa có chỉ tiêu con.</div>';
    return `<div style="display:grid;gap:7px;height:100%;overflow-y:auto">${rows.map(r => `
      <div style="background:rgba(6,28,52,.68);border:1px solid rgba(87,178,255,.16);border-radius:10px;padding:8px 10px">
        <p style="font-weight:700;font-size:11.5px;margin:0 0 6px;color:#eaf6ff">${esc(r.label)}</p>
        ${r.bodyHtml}
      </div>`).join('')}</div>`;
}
/* Thẻ chỉ tiêu con bên trong dashboard sở, giống hệt style card của dashboard Giáo dục (đơn giản, thanh mảnh, không badge/legend) */
function soCategoryItemCardHtml(role, catId, idx, it) {
    const name = it[0], parts = it[4] || [];
    if (!parts.length) {
        return `<div style="background:var(--surface-1);border-radius:12px;padding:1.3rem 1.4rem;">
        <p style="font-weight:600;font-size:14px;margin:0;">${esc(name)}</p>
      </div>`;
    }
    return parts.map(p => `<div style="background:var(--surface-1);border-radius:12px;padding:1.3rem 1.4rem;">
      <p style="font-weight:600;font-size:14px;margin:0 0 4px;color:#eaf6ff">${esc(name)}</p>
      <p class="cir-dim-label">${esc(p.dim)}</p>
      ${phanToDimBodyHtml(p)}
    </div>`).join('');
}
function allowedCategoryRoles() { return allowedRoles().filter(r => categorySeed[r]); }
function collectMockCategoryCats(sourceRoles) {
    const cats = []; sourceRoles.forEach(r => (categorySeed[r] || []).forEach(c => cats.push({ ...c, role: r })));
    return cats;
}
function isApiDataReady() {
    return typeof IocIndicatorsApi !== 'undefined' && window.__iocDashboards && window.__iocDashboards.data && Object.keys(window.__iocDashboards.data).length > 0;
}

function getApiCategoryCats() {
    var list = window.__iocDashboards;
    if (!list || !list.data) return [];

    var cards = [];

    // TRƯỜNG HỢP "Tất cả"
    if (activeApiTab === 'tat_ca') {
        Object.keys(list.data).forEach(function (dataKey) {
            var entry = list.data[dataKey];

            // Nếu entry có data (UBND) và KHÔNG có dashboard
            if (entry.data && typeof entry.data === 'object' && !entry.dashboard) {
                // UBND: lấy từ data của từng child
                Object.keys(entry.data).forEach(function (childKey) {
                    var child = entry.data[childKey];
                    if (child && child.dashboard) {
                        var childCards = extractSectionsFromDashboard(childKey, child);
                        childCards.forEach(function (card) {
                            card.__parentId = dataKey;
                            card.__childId = childKey;
                            cards.push(card);
                        });
                    }
                });
            } else if (entry.dashboard) {
                // Đảng ủy, HĐND, MTTQ: lấy từ dashboard trực tiếp
                var sections = extractSectionsFromDashboard(dataKey, entry);
                sections.forEach(function (card) {
                    card.__parentId = dataKey;
                    cards.push(card);
                });
            }
        });
        return cards;
    }

    // XỬ LÝ TAB CỤ THỂ
    var entry = list.data[activeApiTab];
    if (!entry) {
        console.warn('Không tìm thấy tab:', activeApiTab);
        return [];
    }

    // //console.log('Processing tab:', activeApiTab);

    // TRƯỜNG HỢP UBND: có data chứa các child, KHÔNG có dashboard
    if (entry.data && typeof entry.data === 'object' && !entry.dashboard) {
        var childKeys = Object.keys(entry.data);

        // Nếu đang chọn child cụ thể
        if (activeApiTabChild && entry.data[activeApiTabChild]) {
            var child = entry.data[activeApiTabChild];
            if (child && child.dashboard) {
                var childCards = extractSectionsFromDashboard(activeApiTabChild, child);
                childCards.forEach(function (card) {
                    card.__parentId = activeApiTab;
                    card.__childId = activeApiTabChild;
                    cards.push(card);
                });
            }
            return cards;
        }

        // Chưa chọn child -> lấy TẤT CẢ child của UBND
        childKeys.forEach(function (childKey) {
            var child = entry.data[childKey];
            if (child && child.dashboard) {
                var childCards = extractSectionsFromDashboard(childKey, child);
                childCards.forEach(function (card) {
                    card.__parentId = activeApiTab;
                    card.__childId = childKey;
                    cards.push(card);
                });
            }
        });
        return cards;
    }

    // TRƯỜNG HỢP TAB THÔNG THƯỜNG: có dashboard trực tiếp
    if (entry.dashboard) {
        var sections = extractSectionsFromDashboard(activeApiTab, entry);
        sections.forEach(function (card) {
            card.__parentId = activeApiTab;
            cards.push(card);
        });
    }

    return cards;
}

function extractSectionsFromDashboard(datasetId, entry) {
    var cards = [];
    var dash = entry.dashboard || {};

    Object.keys(dash).forEach(function (sectionKey) {
        var section = dash[sectionKey];
        if (!section || typeof section !== 'object') return;

        // Lấy tên hiển thị
        var name = section.name || sectionKey;

        // Lấy items từ section
        var items = extractItemsFromSection(section);

        // Xác định role
        var role = 'UBND';
        if (datasetId === 'dang_uy' || datasetId === 'dang_uy' || datasetId === 'dang') role = 'DANG';
        else if (datasetId === 'hdnd' || datasetId === 'hoi_dong_nhan_dan') role = 'HDND';
        else if (datasetId === 'mttq' || datasetId === 'mat_tran_to_quoc') role = 'MTTQ';
        else role = 'UBND';

        if (items.length > 0) {
            cards.push({
                id: 'api-' + datasetId + '-' + sectionKey,
                name: name,
                field: name,
                desc: '',
                types: ['API'],
                role: role,
                items: items,
                __api: true,
                __datasetId: datasetId,
                __sectionKey: sectionKey,
                __entry: entry,
                __totalRecords: items.length,
                __parentId: null,
                __childId: datasetId,
                __isChild: true
            });
        }
    });

    return cards;
}

function extractChildItemsFromDashboard(datasetId, entry) {
    var cards = [];
    var dash = entry.dashboard || {};

    Object.keys(dash).forEach(function (sectionKey) {
        var section = dash[sectionKey];
        if (!section || typeof section !== 'object') return;

        // Lấy tên hiển thị
        var name = section.name || sectionKey;
        var desc = '';

        // Lấy items từ section
        var items = extractItemsFromSection(section);

        // Xác định role
        var role = 'UBND';
        if (datasetId === 'dang_uy' || datasetId === 'dang_uy' || datasetId === 'dang') role = 'DANG';
        else if (datasetId === 'hdnd' || datasetId === 'hoi_dong_nhan_dan') role = 'HDND';
        else if (datasetId === 'mttq' || datasetId === 'mat_tran_to_quoc') role = 'MTTQ';
        else role = 'UBND';

        if (items.length > 0) {
            cards.push({
                id: 'api-' + datasetId + '-' + sectionKey,
                name: name,
                field: name,
                desc: desc,
                types: ['API'],
                role: role,
                items: items,
                __api: true,
                __datasetId: datasetId,
                __sectionKey: sectionKey,
                __entry: entry,
                __totalRecords: items.length,
                __parentId: null,
                __childId: datasetId,
                __isChild: true
            });
        }
    });

    return cards;
}

function extractItemsFromSection(section) {
    var items = [];

    // Nếu section.dashboard là mảng
    if (section.dashboard && Array.isArray(section.dashboard)) {
        section.dashboard.forEach(function (item) {
            var label = item.chi_tieu || item.ten || item.hoat_dong || item.trang_thai || item.linh_vuc || '';
            var value = item.tong || item.so_luong || item.gia_tri || item.so_cuoc || item.so_du_an || 0;
            var url = item._detail_url || '';

            if (label) {
                var displayName = label;
                if (item.phan_loai) displayName += ' (' + item.phan_loai + ')';
                if (item.loai) displayName += ' (' + item.loai + ')';
                if (item.trang_thai) displayName += ' (' + item.trang_thai + ')';
                items.push([displayName, value, '', 'API IOC', null, url]);
            }
        });
    }

    // Nếu section.dashboard là object (không phải mảng)
    if (section.dashboard && typeof section.dashboard === 'object' && !Array.isArray(section.dashboard)) {
        var subDash = section.dashboard;
        Object.keys(subDash).forEach(function (subKey) {
            var subVal = subDash[subKey];

            if (typeof subVal === 'number' || typeof subVal === 'string') {
                if (subKey !== '_detail_url' && subKey !== 'id' && subKey !== 'name') {
                    items.push([subKey, subVal, '', 'API IOC', null, '']);
                }
            } else if (typeof subVal === 'object' && subVal !== null && !Array.isArray(subVal)) {
                // Object lồng nhau
                Object.keys(subVal).forEach(function (innerKey) {
                    var innerVal = subVal[innerKey];
                    if (typeof innerVal === 'number' || typeof innerVal === 'string') {
                        if (innerKey !== '_detail_url' && innerKey !== 'id' && innerKey !== 'name') {
                            items.push([subKey + ' - ' + innerKey, innerVal, '', 'API IOC', null, '']);
                        }
                    }
                });
            }
        });
    }

    return items;
}

function buildApiCategoryCardFromEntry(datasetId, entry) {
    if (!entry) return null;

    var name = entry.name || datasetId;
    var field = entry.name || '';

    // Xác định role
    var role = 'UBND';
    if (datasetId === 'dang_uy' || datasetId === 'dang_uy' || datasetId === 'dang') role = 'DANG';
    else if (datasetId === 'hdnd' || datasetId === 'hoi_dong_nhan_dan') role = 'HDND';
    else if (datasetId === 'mttq' || datasetId === 'mat_tran_to_quoc') role = 'MTTQ';
    else if (datasetId === 'ubnd' || datasetId === 'uy_ban_nhan_dan') role = 'UBND';
    else role = 'UBND';

    // Lấy items từ dashboard
    var items = [];
    if (entry.dashboard) {
        items = extractItemsFromDashboard(entry.dashboard);
    }

    return {
        id: 'api-' + datasetId,
        name: name,
        field: field,
        desc: entry.description || '',
        types: ['API'],
        role: role,
        items: items,
        __api: true,
        __datasetId: datasetId,
        __entry: entry,
        __totalRecords: items.length,
        __rawDataUrl: entry.raw_data_url,
        __parentId: null,
        __childId: null,
        __isChild: false
    };
}

function extractItemsFromDashboard(dash) {
    const items = [];
    if (!dash || typeof dash !== 'object') return items;

    // //console.log('extractItemsFromDashboard')

    // Nếu dash là mảng
    if (Array.isArray(dash)) {
        dash.forEach(item => {
            const label = item.chi_tieu || item.ten || item.hoat_dong || '';
            const value = item.tong || item.so_luong || item.gia_tri || 0;
            if (label) items.push([label, value, '', 'API IOC', null, item._detail_url || '']);
        });
        return items;
    }

    // Nếu dash là object
    Object.keys(dash).forEach(sectionKey => {
        const section = dash[sectionKey];
        if (!section || typeof section !== 'object') return;

        // Nếu section có dashboard là mảng
        if (Array.isArray(section.dashboard)) {
            section.dashboard.forEach(item => {
                const label = item.chi_tieu || item.ten || item.hoat_dong || '';
                const value = item.tong || item.so_luong || item.gia_tri || 0;
                if (label) items.push([label, value, '', 'API IOC', null, item._detail_url || '']);
            });
        }
        // Nếu section.dashboard là object (key-value)
        else if (section.dashboard && typeof section.dashboard === 'object') {
            Object.keys(section.dashboard).forEach(subKey => {
                const subVal = section.dashboard[subKey];
                if (subKey !== '_detail_url' && subKey !== 'id' && (typeof subVal === 'number' || typeof subVal === 'string')) {
                    items.push([subKey, subVal, '', 'API IOC', null, '']);
                }
            });
        }
        // Nếu section trực tiếp có các cặp key-value (không có dashboard)
        else if (typeof section === 'object' && !Array.isArray(section)) {
            Object.keys(section).forEach(subKey => {
                const subVal = section[subKey];
                if (subKey !== '_detail_url' && (typeof subVal === 'number' || typeof subVal === 'string')) {
                    items.push([subKey, subVal, '', 'API IOC', null, '']);
                }
            });
        }
    });

    return items;
}

function buildCardFromEntry(entry, id, parentId) {
    if (!entry) return null;

    // Lấy dashboard từ entry (có thể là entry.dashboard hoặc entry.data.dashboard)
    let dash = entry.dashboard || null;
    if (!dash && entry.data && typeof entry.data === 'object') {
        dash = entry.data.dashboard || null;
    }

    const items = dash ? extractItemsFromDashboard(dash) : [];

    // Xác định role
    let role = 'UBND';
    if (parentId === 'dang_uy' || parentId === 'dang' || id === 'dang_uy') role = 'DANG';
    else if (parentId === 'hoi_dong_nhan_dan' || parentId === 'hdnd' || id === 'hoi_dong_nhan_dan') role = 'HDND';
    else if (parentId === 'mat_tran_to_quoc' || parentId === 'mttq' || id === 'mat_tran_to_quoc') role = 'MTTQ';
    else if (parentId === 'uy_ban_nhan_dan' || parentId === 'ubnd' || id === 'uy_ban_nhan_dan') role = 'UBND';

    const name = entry.name || id;
    return {
        id,
        name,
        field: name,
        desc: entry.description || '',
        types: ['API'],
        role,
        items,
        __api: true,
        __datasetId: id,
        __entry: entry,
        __totalRecords: items.length,
        __rawDataUrl: entry.raw_data_url,
        __parentId: parentId,
        __isChild: !!parentId,
    };
}

function toSlug(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/\s+/g, '_');  // thay 1 hoặc nhiều khoảng trắng bằng 1 gạch dưới
}

function renderOneItemsDashborad(_eDashboard, label, type) {
    if (type === "P") return [label, 0, '', '', [P('', Object.keys(_eDashboard).map(x => ([x, _eDashboard[x]])))], _eDashboard._detail_url]
    else return [label, 0, '', '', [S('', Object.keys(_eDashboard).map(x => ([x, _eDashboard[x]])))], _eDashboard._detail_url]
}

function renderItemDashboardP(_eDashboard, type, key, value) {
    let keyItems = {}
    _eDashboard.forEach((id) => {
        const _id = toSlug(id[type])
        if (!keyItems[_id]) keyItems[_id] = { _id, name: id[type], items: [] }
        keyItems[_id].items.push([id[key], id[value]])
    })
    // //console.log("keyItems _eDashboard _items", keyItems)
    return Object.values(keyItems).map(id => ([id.name, 0, '', '', [P('', id.items)]]))
}

function renderItemDashboardP(_eDashboard, type, key, value) {
    let keyItems = {}
    _eDashboard.forEach((id) => {
        const _id = toSlug(id[type])
        if (!keyItems[_id]) keyItems[_id] = { _id, name: id[type], items: [] }
        keyItems[_id].items.push([id[key], id[value]])
    })
    // //console.log("keyItems _eDashboard _items", keyItems)
    return Object.values(keyItems).map(id => ([id.name, 0, '', '', [P('', id.items)], id._detail_url]))
}

function renderItemDashboardS(_eDashboard, type, key, value) {
    let keyItems = {}
    _eDashboard.forEach((id) => {
        const _id = toSlug(id[type])
        if (!keyItems[_id]) keyItems[_id] = { _id, name: id[type], items: [] }
        keyItems[_id].items.push([id[key], id[value]])
    })
    // //console.log("keyItems", keyItems)
    return Object.values(keyItems).map(id => ([id.name, 0, '', '', [S('', id.items)], id._detail_url]))
}

function getDashboardArray(_eDashboard, e, iItem) {
    if (e === 'kiem_tra_giam_sat') {
        return renderItemDashboardP(_eDashboard, 'phan_loai', 'chi_tieu', 'tong')
    } else if (e === 'danh_gia_can_bo_theo_thang') {
        return renderItemDashboardS(_eDashboard, 'ky', 'phan_loai', 'tong')
    } else if (e === 'thi_hanh_ky_luat') {
        return renderItemDashboardS(_eDashboard, 'phan_loai', 'doi_tuong', 'tong')
    } else if (e === 'tham_dinh_chinh_tri') {
        return renderItemDashboardS(_eDashboard, 'chi_tieu', 'phan_loai', 'tong')
    } else if (e === 'kiem_tra_nhiem_vu_ktgs') {
        return [[iItem.name, 0, '', '', [P('', _eDashboard.map(x => ([x.phan_loai, x.tong])))], _eDashboard._detail_url]]
    } else if (e === 'ket_nap_dang_vien') {
        return [['Kết nạp mới', 0, '', '', [P('', _eDashboard.map(x => ([x.ky, x.tong])))], _eDashboard._detail_url]]
    } else if (e === 'thu_chi_ngan_sach') {
        return [['Tổng giá trị sản phẩm', 0, '', '', [P('', _eDashboard.map(x => ([x.nam, x.tong_gia_tri_san_pham_ty_dong])))], _eDashboard._detail_url]]
    } else if (e === 'dau_tu_cong') {
        return [['Số dự án', 0, '', '', [P('', _eDashboard.map(x => ([x.linh_vuc, x.so_du_an])))], _eDashboard._detail_url]]
    } else if (e === 'trang_thai_hoat_dong_giam_sat') {
        return [['Số hoạt động', 0, '', '', [P('', _eDashboard.map(x => ([x.trang_thai, x.so_cuoc])))], _eDashboard._detail_url]]
    } else if (e === 'khoi_luong_hoat_dong_hdnd') {
        return [['Số hoạt động', 0, '', '', [P('', _eDashboard.map(x => ([x.hoat_dong, x.so_luong])))], _eDashboard._detail_url]]
    } else if (e === 'to_chuc_truc_thuoc') {
        return [['Số lượng', 0, '', '', [P('', _eDashboard.map(x => ([x.phan_loai, x.tong])))], _eDashboard._detail_url]]
    } else if (e === 'co_cau_cac_khoan_thu_chi_tiet') {
        return [['Các khoản thu chi tiết', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.chi_tieu, x.thuc_hien])))], _eDashboard._detail_url]]
    } else if (e === 'co_cau_chi_ngan_sach_giao_uoc_thuc_hien') {
        return [['Ngân sách giao ước thực hiện', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.chi_tieu, x.thuc_hien])))], _eDashboard._detail_url]]
    } else if (e === 'co_cau_nguon_thu_ngan_sach') {
        return [['Nguồn thu ngân sách', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.chi_tieu, x.thuc_hien])))], _eDashboard._detail_url]]
    } else if (e === 'muc_do_hoan_thanh_chi_tieu_van_hoa_xa_hoi') {
        return [['Mức độ hoàn thành', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.chi_tieu, x.thuc_hien])))], _eDashboard._detail_url]]
    } else if (e === 'the_chi_so_kpi') {
        return [['Chỉ số', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.chi_tieu, x.thuc_hien])))], _eDashboard._detail_url]]
    } else if (e === 'thu_chi_ngan_sach_giao_uoc_thuc_hien') {
        return [['Thu chi ngân sách', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.chi_tieu, x.thuc_hien])))], _eDashboard._detail_url]]
    } else if (e === 'tong_van_ban_den_di_theo_don_vi') {
        return [['Văn bản đến', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.don_vi, x.tong])))], _eDashboard._detail_url]]
    } else if (e === 'tinh_hinh_bien_che') {
        return [['Số lượng biên chế', 0, '', '', [S('Tr.đồng', _eDashboard.map(x => ([x.nhom, x.gia_tri])))], _eDashboard._detail_url]]
    } else if (e === 'bien_dong_nhan_su_trong_thang') {
        return [['Số lượng biến động nhân sự trong ', 0, '', '', [S('Tr.đồng', _eDashboard.map(x => ([x.loai_bien_dong, x.so_nguoi])))], _eDashboard._detail_url]]
    } else if (e === 'di_san_van_hoa_kiem_ke_xep_hang') {
        return [['Di tích được xếp hạng', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.chi_tieu, x.so_luong])))], _eDashboard._detail_url]]
    } else if (e === 'hoat_dong_nghe_thuat_bieu_dien') {
        return [['Hoạt động nghệ thuật biểu diễn', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.chi_tieu, x.so_luong])))], _eDashboard._detail_url]]
    } else if (e === 'tinh_hinh_thu_so_voi_du_toan') {
        return [['Tình hình dự toán', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.khoan, x.du_toan])))], _eDashboard._detail_url]]
    } else if (e === 'co_cau_trang_thai_du_an') {
        return [['Dự án triển khai', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.trang_thai, x.so_du_an])))], _eDashboard._detail_url]]
    } else if (e === 'tien_do_thuc_te_theo_du_an') {
        return [['Tiến độ thực tế dự án', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.ten_du_an, x.tien_do_thuc_te_phan_tram])))], _eDashboard._detail_url]]
    } else if (e === 'Hồ sơ') {
        return [['Tiến độ thực tế dự án', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.trang_thai_chi_tiet, x.so_luong])))], _eDashboard._detail_url]]
    } else if (e === 'co_cau_ho_so_theo_kenh_tiep_nhan') {
        return [['Hồ sơ theo kênh tiếp nhận', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.kenh, x.so_luong])))], _eDashboard._detail_url]]
    } else if (e === 'co_cau_trang_thai_xu_ly_ho_so') {
        return [['Trạng thái hồ sơ xử lý', 0, '', '', [P('Tr.đồng', _eDashboard.map(x => ([x.trang_thai, x.so_luong])))], _eDashboard._detail_url]]
    } else {
        return [['', 0, '', '']]
    }
}

function getDashboardObj(_eDashboard, e) {
    let _labelItem = 'Số lượng', type = "P";
    if (e === "ho_so_hoat_dong_mttq") _labelItem = "Số lượt"
    if (e === 'mung_tho_nguoi_cao_tuoi') _labelItem = "Số người"
    if (e === "cbccvc_khoi_dang") type = "S"
    if (e === "co_cau_co_so") _labelItem = "Cơ cấu cơ sở"
    if (e === "giao_vien_cbql_theo_bac_hoc") _labelItem = "Giáo viên CBQL theo bậc học"
    if (e === "phan_bo_giao_vien") _labelItem = "Phân bổ giáo viên"
    if (e === "phan_bo_hoc_sinh") _labelItem = "Phân bổ học sinh"
    if (e === "so_co_so_giao_duc_theo_bac_hoc") _labelItem = "Số cơ sở giáo dục theo bậc học"
    if (e === "so_hoc_sinh_hoc_vien_theo_bac_hoc") _labelItem = "Số học sinh/học viên theo bậc học"
    return [renderOneItemsDashborad(_eDashboard, _labelItem, type)]
}

function getFilteredCards() {
    const list = window.__iocDashboards;
    //console.log('getFilteredCards', list);
    // if (!list || !list.data) return [];

    // const data = list.data;
    // const activeTab = activeApiTab || 'tat_ca';
    // const activeChild = activeApiTabChild || null;
    // const cards = [];

    // Object.keys(data).forEach(e => {
    //     roleInfoApi[e] = data[e].name
    //     const dashboard = e === "uy_ban_nhan_dan" ? data[e].data : data[e].dashboard;
    //     const shows = new Set();
    //     Object.keys(dashboard).forEach(ed => {
    //         const itemInfo = dashboard[ed]
    //         shows.add(ed)
    //         infoCards[ed] = {
    //             ...itemInfo,
    //             role: e,
    //             _id: ed,
    //             raw_data_url: itemInfo.raw_data_url || data[e].raw_data_url
    //         }
    //         //console.log("TUNDDDD", data, e)
    //     })
    //     showCards[e] = Array.from(new Set(shows));
    // })

    // // //console.log('xxxxx', infoCards, showCards, activeTab)

    // let newCards = []
    // const dataActive = activeTab === 'tat_ca' ? Object.keys(infoCards) : showCards[activeTab]
    // // //console.log("dataActive", dataActive)
    // dataActive.forEach(e => {
    //     const iItem = infoCards[e]
    //     const _eDashboard = iItem.dashboard
    //     const _typeDashboard = typeof _eDashboard
    //     let _items = []
    //     if (_typeDashboard === "object") {
    //         if (Array.isArray(_eDashboard)) {
    //             _items = getDashboardArray(_eDashboard, e, iItem)
    //         } else {
    //             const a = Object.keys(_eDashboard).filter(u => typeof _eDashboard[u] === "object")
    //             if (a.length === 0) {
    //                 _items = getDashboardObj(_eDashboard, e)
    //             } else {
    //                 a.forEach(b => {
    //                     const _eChildDash = _eDashboard[b]
    //                     const _typeChildDash = typeof _eChildDash
    //                     if (_typeChildDash === "object") {
    //                         let _iChild = []
    //                         if (Array.isArray(_eChildDash)) {
    //                             _iChild = getDashboardArray(_eChildDash, b, iItem)
    //                         } else {
    //                             const ac = Object.keys(_eChildDash).filter(u => typeof _eChildDash[u] === "object")
    //                             if (ac.length === 0) {
    //                                 _iChild = getDashboardObj(_eChildDash, b);
    //                             }
    //                         }
    //                         _items = [..._items, ..._iChild]
    //                     }
    //                 })
    //                 if (e === "y_te") {
    //                     _items = [
    //                         ['Số lượng người được trợ cấp xã hội', 0, '', '', [P('', _eDashboard.bao_tro_xa_hoi.doi_tuong.map(x => ([x.chi_tieu, x.gia_tri])))], _eDashboard._detail_url],
    //                         renderOneItemsDashborad(_eDashboard.dich_benh_nhom_a_b.tinh_hinh_dich, "Tình hình dịch bệnh", "S"),
    //                         renderOneItemsDashborad(_eDashboard.ngo_doc_thuc_pham.muc_do_thiet_hai, "Tình hình ngộ độc", "S"),
    //                     ]
    //                 }
    //                 if (e === 'kinh_te_xa_hoi') {
    //                     //console.log("kinh_te_xa_hoi", _items)
    //                 }
    //             }
    //         }
    //     }

    //     _itemsKey[e] = {
    //         _items, _eDashboard
    //     }

    //     newCards.push({
    //         id: iItem.id,
    //         name: iItem.name,
    //         field: iItem.name || iItem.id,
    //         desc: iItem.description || '',
    //         role: iItem.role,
    //         _items,
    //         _tieuChi: 0,
    //         // items,
    //         // __datasetId: id,
    //         // __entry: entry,
    //         // __rawDataUrl: entry.raw_data_url,
    //     })

    // })

    // //console.log('getFilteredCards', data, activeTab)
    // Hàm thêm card từ entry (có thể là parent hoặc child)
    // function addCardsFromEntry(entry, id, parentId) {
    //     if (!entry) return;

    //     // Trường hợp 1: entry có dashboard trực tiếp
    //     if (entry.dashboard) {
    //         const card = buildCardFromEntry(entry, id, parentId);
    //         if (card) cards.push(card);
    //         return;
    //     }

    //     // Trường hợp 2: entry có data và data.dashboard
    //     if (entry.data && typeof entry.data === 'object') {
    //         // Nếu data.dashboard tồn tại, tạo card từ data
    //         if (entry.data.dashboard) {
    //             const card = buildCardFromEntry(entry.data, id, parentId);
    //             if (card) cards.push(card);
    //             // Không return vì có thể còn child khác
    //         }

    //         // Duyệt các child trong data (các key khác 'dashboard')
    //         Object.keys(entry.data).forEach(childKey => {
    //             if (childKey === 'dashboard') return; // đã xử lý ở trên
    //             const child = entry.data[childKey];
    //             if (child && child.dashboard) {
    //                 const childCard = buildCardFromEntry(child, childKey, id);
    //                 if (childCard) cards.push(childCard);
    //             }
    //         });
    //     }
    // }

    // // ---- FILTER MATRIX ----
    // if (activeTab === 'tat_ca') {
    //     // Tất cả: lấy từ tất cả entry và child của UBND
    //     Object.keys(data).forEach(key => {
    //         const entry = data[key];
    //         if (key === 'uy_ban_nhan_dan' || key === 'ubnd') {
    //             // UBND: chỉ lấy child
    //             if (entry.data) {
    //                 Object.keys(entry.data).forEach(childKey => {
    //                     const child = entry.data[childKey];
    //                     if (child && child.dashboard) {
    //                         const card = buildCardFromEntry(child, childKey, key);
    //                         if (card) cards.push(card);
    //                     }
    //                 });
    //             }
    //         } else {
    //             // Các entry khác
    //             addCardsFromEntry(entry, key, null);
    //         }
    //     });
    // } else if (activeTab === 'uy_ban_nhan_dan' || activeTab === 'ubnd') {
    //     // Tab UBND: lấy child
    //     const ubndEntry = data['uy_ban_nhan_dan'] || data['ubnd'];
    //     if (ubndEntry && ubndEntry.data) {
    //         if (activeChild) {
    //             const child = ubndEntry.data[activeChild];
    //             if (child && child.dashboard) {
    //                 const card = buildCardFromEntry(child, activeChild, activeTab);
    //                 if (card) cards.push(card);
    //             }
    //         } else {
    //             Object.keys(ubndEntry.data).forEach(childKey => {
    //                 const child = ubndEntry.data[childKey];
    //                 if (child && child.dashboard) {
    //                     const card = buildCardFromEntry(child, childKey, activeTab);
    //                     if (card) cards.push(card);
    //                 }
    //             });
    //         }
    //     }
    // } else {
    //     // Các tab cha khác (dang_uy, hdnd, mttq)
    //     const entry = data[activeTab];

    //     // //console.log("getFilteredCards card", entry)
    //     if (entry) {
    //         addCardsFromEntry(entry, activeTab, null);
    //     }
    // }

    // //console.log("getFilteredCards card", cards)
    return list ? list : [];
}

// async function findListActiveTab(tabId) { 
//      if (typeof IocIndicatorsApi === 'undefined') { toast('Module iocApi.js chưa tải.'); return; }
//     iocApiLoading = true; iocApiError = null; renderIndicators();
//     IocIndicatorsApi.loadDashboardsList().then(function () {
//         iocApiLoading = false; iocApiError = null;
//         renderIndicators();
//         toast('Đã cập nhật dữ liệu API.');
//     }).catch(function (err) {
//         iocApiLoading = false; iocApiError = err.message || String(err);
//         renderIndicators();
//         toast('Lỗi API: ' + iocApiError);
//     });
// }

function setApiTab(tabId) {
    // 1. Kiểm tra xem module API có tồn tại hay không
    if (typeof IocIndicatorsApi !== 'undefined' && typeof IocIndicatorsApi.loadDashboardsListFilter === 'function') {

        // Bật trạng thái loading trước khi gọi API (nếu ứng dụng của bạn có biến này)
        if (typeof iocApiLoading !== 'undefined') iocApiLoading = true;

        // Gọi API và truyền tabId vào để lọc
        IocIndicatorsApi.loadDashboardsListFilter(tabId)
            .then(function (data) {
                // Tắt trạng thái loading khi API thành công
                if (typeof iocApiLoading !== 'undefined') iocApiLoading = false;

                // 2. CHỈ KHI API CHẠY XONG THÀNH CÔNG, mới thực hiện thay đổi Tab và Render giao diện
                activeApiTabId = tabId;

                switch (tabId) {
                    case "dang_uy":
                        activeApiTab = "dang_uy";
                        break;
                    case "hdnd":
                        activeApiTab = "hoi_dong_nhan_dan";
                        break;
                    case "mttq":
                        activeApiTab = "mat_tran_to_quoc";
                        break;
                    case "ubnd":
                        activeApiTab = "uy_ban_nhan_dan";
                        break;
                    default:
                        activeApiTab = tabId;
                        break;
                }

                activeApiTabChild = null;

                // Tiến hành render lại giao diện với dữ liệu mới đã được lọc
                renderIndicators();

                //console.log("Tải dữ liệu và render thành công cho tab:", tabId);
            })
            .catch(function (err) {
                // Xử lý khi API bị lỗi
                if (typeof iocApiLoading !== 'undefined') iocApiLoading = false;
                if (typeof iocApiError !== 'undefined') iocApiError = err.message || String(err);

                console.error("Lỗi khi tải dữ liệu cho tab " + tabId + ":", err);
                if (typeof toast === 'function') toast('Lỗi tải dữ liệu: ' + (err.message || String(err)));
            });

    } else {
        console.warn("IocIndicatorsApi hoặc loadDashboardsListFilter chưa được định nghĩa.");
        // Fallback: Nếu không có API vẫn chuyển tab và render bằng dữ liệu cũ (tùy bạn quyết định có nên chạy hay không)
        activeApiTabId = tabId;
        activeApiTabChild = null;
        renderIndicators();
    }
}

function setApiTabChild(childId) {
    activeApiTabChild = childId;
    if (activeApiTab !== 'uy_ban_nhan_dan' && activeApiTab !== 'ubnd') {
        activeApiTab = 'uy_ban_nhan_dan';
    }
    renderIndicators();
}

function getMergedCategoryCats(sourceRoles) {
    if (isApiDataReady()) return getApiCategoryCats();
    const mockCats = collectMockCategoryCats(sourceRoles);
    if (typeof IocIndicatorsApi !== 'undefined' && window.__iocDashboards) {
        return IocIndicatorsApi.mergeApiIntoCategories(mockCats);
    }
    return mockCats;
}

function categoryCardClickHandler(c) {
    //console.log('categoryCardClickHandler', c);
    if (c.__api && c.__datasetId) return `openApiCategoryDetail('${c.__datasetId}')`;
    if (c.field === 'Giáo dục') return 'openGiaoDucDashboard()';
    if (c.role === 'UBND') return `openSoDashboard('${c.role}','${c.id}')`;
    return `openCategoryDetail('${c.role}','${c.id}')`;
}

function renderCategoryGrid() {
    const grid = document.getElementById('indicatorGrid');
    if (!grid) return;

    const searchInput = document.getElementById('categorySearch');
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let cards = getFilteredCards();
    if (window.VanPhongBanPopup) {
        cards = window.VanPhongBanPopup.expandCards(cards, activeApiTabId);
    }
    const isVanPhongBanList = cards.some(c => window.VanPhongBanPopup?.isListCard(c));
    grid.classList.toggle('vpb-tdvcs-list-grid', isVanPhongBanList);
    if (searchInput) searchInput.placeholder = isVanPhongBanList ? 'Tìm chỉ tiêu...' : 'Tìm lĩnh vực...';

    if (q) {
        cards = cards.filter(c =>
            (c.titleDashboard || '').toLowerCase().includes(q) ||
            (c.description || '').toLowerCase().includes(q)
        );
    }

    if (!cards.length) {
        grid.innerHTML = `<div class="access-lock">Không có lĩnh vực phù hợp bộ lọc.</div>`;
        return;
    }

    const roleMap = {};
    //console.log('window.__iocDashboardsTab', window.__iocDashboardsTab);
    if (Array.isArray(window.__iocDashboardsTab)) {
        window.__iocDashboardsTab.forEach(item => {
            roleMap[item.code] = item.name;
        });
    }
    //console.log('roleMap', roleMap);

    grid.innerHTML = cards.map(c => {
        if (window.VanPhongBanPopup?.isListCard(c)) {
            return window.VanPhongBanPopup.gridCardHtml(c);
        }
        // const apiBadge = c.__api ? '<span class="badge ok">API</span>' : '';
        // const childBadge = c.__isChild ? '<span class="badge gold">Child</span>' : '';
        // console.log('Category Card:', c);
        const itemCount = c.__indicatorCount ?? (c.charts || []).length;
        const roleInfo = axisMeta[c._parent_id] || {
            icon: '',
            name: roleMap[c._parent_id] || c._parent_id || 'Unknown'
        };
        // console.log('Role Info:', roleInfo);

        const metaBadge = `
      <span class="badge ${c._parent_id === 'ubnd' ? 'ok' : c._parent_id === 'hdnd' ? 'gold' : c._parent_id === 'mttq' ? '' : 'red'}">
        ${roleInfo.icon} ${roleInfo.name}
      </span>
      <span class="badge">${itemCount} chỉ tiêu</span>
    `;

        let clickHandler = `openApiCategoryDetail('${c._id}')`;
        // if (c.__api && c.__datasetId) {
        //     clickHandler = `openApiCategoryDetail('${c.__datasetId}')`;
        // } else if (c.field === 'Giáo dục') {
        //     clickHandler = 'openGiaoDucDashboard()';
        // } else if (c.role === 'UBND') {
        //     clickHandler = `openSoDashboard('${c.role}','${c.id}')`;
        // } else {
        //     clickHandler = `openCategoryDetail('${c.role}','${c.id}')`;
        // }

        const previewHtml = soCategoryPreviewHtml(c) || '';

        return `
      <button class="field-category-card-ct${c.__api ? ' api-card' : ''}" onclick="${clickHandler}">
        <div class="field-category-meta">${metaBadge}</div>
        <h4>${esc(c.titleDashboard)}</h4>
        ${c.description ? `<p class="muted" style="font-size:10px;margin:0 0 4px;line-height:1.3">${esc(c.description)}</p>` : ''}
        ${previewHtml}
      </button>
    `;
    }).join('');
}

function setFieldCategoryRole(role) { activeCategoryRole = role; renderIndicators(); }



// function renderIndicators() {
//   var tabs = document.getElementById('indicatorRoleTabs');
//   var grid = document.getElementById('indicatorGrid');
//   if (!tabs || !grid) return;

//   var prevQ = document.getElementById('categorySearch')?.value || '';
//   var toolbar = '';

//   if (isApiDataReady()) {
//     var list = window.__iocDashboards;
//     var apiTabs = Object.values(list.data) || [];

//     var currentTab = apiTabs.find(function (t) { return t.id === activeApiTab; });

//     toolbar = `<div>
//       <div class="field-category-toolbar">
//         <div class="field-category-tabs">
//           <button type="button" class="${activeApiTab === 'tat_ca' ? 'active' : ''}" onclick="setApiTab('tat_ca')">🌐 Tất cả</button>
//           ${apiTabs.map(function (t) {
//       var icon = (IocIndicatorsApi.API_TAB_ICONS && IocIndicatorsApi.API_TAB_ICONS[t.id]) || '';
//       return `<button type="button" class="${activeApiTab === t.id ? 'active' : ''}" onclick="setApiTab('${t.id}')">${icon} ${esc(t.name)}</button>`;
//     }).join('')}
//         </div>
//         <div class="field-category-search">
//           <input id="categorySearch" placeholder="Tìm lĩnh vực..." oninput="renderCategoryGrid()" />
//           <button class="ghost" type="button" style="margin-left:6px;white-space:nowrap" onclick="refreshIocApi()" title="Tải lại /api/v1/ioc/dashboards">↻ API</button>
//         </div>
//       </div>`;

//     if (currentTab && currentTab.data && typeof currentTab.data === 'object') {
//       var childKeys = Object.keys(currentTab.data);
//       if (childKeys.length > 0) {
//         toolbar += `<div class="field-category-toolbar-childs">
//           ${childKeys.map(function (childKey) {
//           var child = currentTab.data[childKey];
//           var label = child && child.name ? child.name : childKey;
//           return `<button type="button" class="${activeApiTabChild === childKey ? 'active' : ''}" onclick="setApiTabChild('${childKey}')">${esc(label)}</button>`;
//         }).join('')}
//         </div>`;
//       }
//     }

//     toolbar += `</div>`;
//   } else {
//     // code cho mock data
//     var roles = allowedCategoryRoles();
//     var canSeeAll = currentRole === 'DANG';
//     if (activeCategoryRole === 'ALL') { if (!canSeeAll) activeCategoryRole = roles[0]; }
//     else if (!roles.includes(activeCategoryRole)) activeCategoryRole = canSeeAll ? 'ALL' : roles[0];
//     toolbar = `<div class="field-category-toolbar">
//       <div class="field-category-tabs">
//         ${canSeeAll ? `<button class="${activeCategoryRole === 'ALL' ? 'active' : ''}" onclick="setFieldCategoryRole('ALL')">🌐 Tất cả</button>` : ''}
//         ${roles.map(r => `<button class="${activeCategoryRole === r ? 'active' : ''}" onclick="setFieldCategoryRole('${r}')">${axisMeta[r].icon} ${axisMeta[r].name}</button>`).join('')}
//       </div>
//       <div class="field-category-search">
//         <input id="categorySearch" placeholder="Tìm lĩnh vực..." oninput="renderCategoryGrid()" />
//         <button class="ghost" type="button" style="margin-left:6px;white-space:nowrap" onclick="refreshIocApi()" title="Tải lại /api/v1/ioc/dashboards">↻ API</button>
//       </div>
//     </div>`;
//   }

//   var errBanner = iocApiError && !isApiDataReady() ?
//     `<div class="data-issue-banner" style="margin-bottom:8px">
//       <span class="di-icon">⚠️</span>
//       <span>Không tải API: ${esc(iocApiError)}</span>
//     </div>` : '';

//   tabs.innerHTML = errBanner + toolbar;
//   if (prevQ) document.getElementById('categorySearch').value = prevQ;

//   // KHÔNG GỌI renderIndicatorKpiRow() nữa
//   renderCategoryGrid();
// }


function renderIndicators() {
    const tabsContainer = document.getElementById('indicatorRoleTabs');
    const gridContainer = document.getElementById('indicatorGrid');
    if (!tabsContainer || !gridContainer) return;

    const searchInput = document.getElementById('categorySearch');
    const prevSearchValue = searchInput ? searchInput.value : '';

    // const list = window.__iocDashboards;
    const list = window.__iocDashboardsTab || []
    //console.log("renderIndicators list", list)
    const apiTabs = (list && list.data) ? Object.values(list.data) : [];
    const hasApiData = apiTabs.length > 0;

    let toolbarHtml = '';
    let childTabsHtml = '';

    if (list && !hideIndicatorFilters) {
        // Tabs cha
        const visibleButtons = [];
        const dropdownButtons = [];

        list.forEach((entry, index) => {
            const id = entry.code || '';
            const icon = (IocIndicatorsApi && IocIndicatorsApi.API_TAB_ICONS && IocIndicatorsApi.API_TAB_ICONS[id]) || '';
            const label = entry.name || id;
            const isActive = (activeApiTabId === id);

            if (index < 6 || isActive) {
                visibleButtons.push(`<button type="button" class="${isActive ? 'active' : ''}" onclick="setApiTab('${id}')">${icon} ${esc(label)}</button>`);
            } else {
                dropdownButtons.push(`<button type="button" class="field-category-more-item ${isActive ? 'active' : ''}" onclick="setApiTab('${id}'); this.closest('.dropdown-menu').classList.add('hidden')" style="display:block; width:100%; text-align:left; border:none; padding:8px 12px; background:transparent;">${icon} ${esc(label)}</button>`);
            }
        });

        let dropdownHtml = '';
        if (dropdownButtons.length > 0) {
            dropdownHtml = `
            <div style="position: relative; display: inline-block;">
                <button type="button" class="field-category-more-btn" onclick="const menu = this.nextElementSibling; menu.classList.toggle('hidden');" style="border:1px solid rgba(87,178,255,0.22);background:rgba(6,28,52,0.8);border-radius:999px;padding:8px 12px;color:#dcefff">Thêm ▾</button>
                <div class="field-category-more-menu dropdown-menu hidden" style="position: absolute; top: 100%; right: 0; background: #061528; border: 1px solid rgba(87,178,255,0.4); border-radius: 8px; padding: 8px; display: grid; gap: 4px; z-index: 100; max-height: 300px; overflow-y: auto; min-width: 240px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    ${dropdownButtons.join('')}
                </div>
            </div>`;
        }

        const tabButtonsHtml = visibleButtons.join('') + dropdownHtml;

        const allActive = (activeApiTabId === 'tat_ca');
        toolbarHtml = `
      <div class="field-category-toolbar">
        <div class="field-category-tabs" style="display:flex; flex-wrap:wrap; gap:8px;">
          ${tabButtonsHtml}
        </div>
        <div class="field-category-search">
          <input id="categorySearch" placeholder="Tìm lĩnh vực..." oninput="renderCategoryGrid()" value="${esc(prevSearchValue)}" />
          <button class="ghost" type="button" style="margin-left:6px;white-space:nowrap" onclick="refreshIocApi()" title="Tải lại API">↻ API</button>
        </div>
      </div>
    `;

        // Tabs con (chỉ khi activeTab là UBND)
        // const ubndEntry = apiTabs.find(t => t.id === 'uy_ban_nhan_dan' || t.id === 'ubnd');
        // if (ubndEntry && ubndEntry.data && typeof ubndEntry.data === 'object') {
        //     const childKeys = Object.keys(ubndEntry.data);
        //     if (childKeys.length > 0 && (activeApiTab === 'uy_ban_nhan_dan' || activeApiTab === 'ubnd')) {
        //         const childButtons = childKeys.map(childKey => {
        //             const child = ubndEntry.data[childKey];
        //             const label = (child && child.name) ? child.name : childKey;
        //             const isActive = (activeApiTabChild === childKey);
        //             return `<button type="button" class="${isActive ? 'active' : ''}" onclick="setApiTabChild('${childKey}')">${esc(label)}</button>`;
        //         }).join('');
        //         childTabsHtml = `<div class="field-category-toolbar-childs">${childButtons}</div>`;
        //     }
        // }
    } else if (!list) {
        toolbarHtml = `<div class="access-lock" style="padding:12px;text-align:center">Đang tải dữ liệu API...</div>`;
    }

    const errBanner = (iocApiError && !hasApiData) ?
        `<div class="data-issue-banner" style="margin-bottom:8px">
      <span class="di-icon">⚠️</span>
      <span>Không tải API: ${esc(iocApiError)}</span>
    </div>` : '';

    tabsContainer.hidden = hideIndicatorFilters;
    tabsContainer.innerHTML = errBanner + toolbarHtml + childTabsHtml;
    if (searchInput) searchInput.value = prevSearchValue;

    renderCategoryGrid();
}


/* Chi tiết 1 lĩnh vực: donut tổng + danh sách chỉ tiêu con dạng thanh ngang (bar theo trạng thái) */
const CAT_ST = [
    { k: 'done', l: 'Đã hoàn thành', c: '#2fb174' },
    { k: 'doing', l: 'Đang thực hiện', c: '#2c7dd2' },
    { k: 'regular', l: 'Vượt chỉ tiêu', c: '#39d5ff' },
    { k: 'soon', l: 'Chưa bắt đầu', c: '#d8a50c' },
    { k: 'risk', l: 'Tạm dừng', c: '#d25a19' },
    { k: 'overdue', l: 'Không đạt', c: '#ef4444' }
];
const chartColors = [
    'rgb(31, 119, 180)',   // 1 - Xanh dương đậm
    'rgb(255, 127, 14)',   // 2 - Cam
    'rgb(44, 160, 44)',    // 3 - Xanh lá đậm
    'rgb(214, 39, 40)',    // 4 - Đỏ
    'rgb(148, 103, 189)',  // 5 - Tím
    'rgb(140, 86, 75)',    // 6 - Nâu
    'rgb(227, 119, 194)',  // 7 - Hồng
    'rgb(127, 127, 127)',  // 8 - Xám
    'rgb(188, 189, 34)',   // 9 - Vàng ô liu
    'rgb(23, 190, 207)',   // 10 - Xanh ngọc

    'rgb(174, 199, 232)',  // 11 - Xanh dương nhạt
    'rgb(255, 187, 120)',  // 12 - Cam nhạt
    'rgb(152, 223, 138)',  // 13 - Xanh lá nhạt
    'rgb(255, 152, 150)',  // 14 - Đỏ nhạt
    'rgb(197, 176, 213)',  // 15 - Tím nhạt
    'rgb(196, 156, 148)',  // 16 - Nâu nhạt
    'rgb(247, 182, 210)',  // 17 - Hồng nhạt
    'rgb(199, 199, 199)',  // 18 - Xám nhạt
    'rgb(219, 219, 141)',  // 19 - Vàng nhạt
    'rgb(158, 218, 229)'   // 20 - Xanh ngọc nhạt
];
function catStatusInfo(k) { return CAT_ST.find(s => s.k === k) || { k, l: k, c: '#7a9ab8' }; }
function indicatorRecordsFor(role, name) { return indicatorRecords.filter(r => r.role === role && r.indicator === name); }
function catAxisRowHtml(role, it) {
    const name = it[0], declared = Number(it[1]) || 0;
    const recs = indicatorRecordsFor(role, name);
    const tot = recs.length || declared || 1;
    const enc = encodeURIComponent(name);
    const cnts = {}; CAT_ST.forEach(s => { cnts[s.k] = recs.filter(r => r.status === s.k).length; });
    const segs = CAT_ST.map(s => {
        const n = cnts[s.k] || 0;
        if (!n) return '<div class="seg zero"></div>';
        const w = (n / tot * 100).toFixed(1);
        return `<button class="seg" style="width:${w}%;background:${s.c};border:0;cursor:pointer;font-family:inherit" title="${s.l}: ${fmt(n)}" onclick="catSegClick(this,'${role}','${enc}','${s.k}')">${fmt(n)}</button>`;
    }).join('');
    return `<div class="cat-axis-row"><button class="cat-axis-label" title="Xem tất cả" onclick="catSegClick(this,'${role}','${enc}','')">${name}</button><div class="bar">${segs}</div><div class="cat-axis-total">${fmt(declared)}</div></div>`;
}
function catAxisLegendHtml() { return `<div class="legend" style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(87,178,255,.12)">${CAT_ST.map(s => `<span><span class="sw" style="background:${s.c}"></span>${s.l}</span>`).join('')}</div>` }

/* Banner cảnh báo lĩnh vực có số liệu chưa đồng nhất giữa các nguồn (Excel/CSDL/API...) */
const categoryDataIssues = {
    'ubnd-gddt': 'Số liệu học sinh, giáo viên toàn ngành đang tổng hợp từ báo cáo các Phòng/Sở GD-ĐT theo quận huyện; đối chiếu sơ bộ giữa các nguồn cho thấy chênh lệch khoảng 5-7% — cần chuẩn hóa về một nguồn trước khi công bố chính thức.',
    'ubnd-taichinh': 'Số liệu thu-chi ngân sách giữa CSDL kế toán Thành phố và báo cáo tổng hợp cấp trên đang lệch nhẹ theo kỳ báo cáo (do thời điểm chốt số khác nhau) — cần đối soát trước khi công bố cuối kỳ.',
    'dang-to-chuc': 'Số lượng đảng viên giữa sổ theo dõi Excel nội bộ khối Đảng và CSDL đảng viên Thành ủy chưa khớp hoàn toàn — đang rà soát, cập nhật.'
};
function dataIssueBannerHtml(catId) {
    if (!categoryDataIssues[catId]) return '';
    return `<div class="data-issue-banner"><span class="di-icon">⚠️</span><span>Lệch dữ liệu giữa các nguồn</span></div>`;
}

/* Biểu đồ phụ: phân bổ theo tần suất cập nhật của các chỉ tiêu con trong lĩnh vực */
const FREQ_COLORS = { 'Ngày': '#39d5ff', 'Tuần': '#2c7dd2', '': '#2fb174', 'Quý': '#d8a50c', 'Realtime': '#ef4444', 'Khi phát sinh': '#d25a19', 'Năm': '#a78bfa' };
function freqColor(f) { return FREQ_COLORS[f] || '#7a9ab8'; }
function renderCatFreqChart(cat) {
    const byFreq = {};
    (cat.items || []).forEach(it => { const f = it[2] || 'Khác'; byFreq[f] = (byFreq[f] || 0) + (Number(it[1]) || 0); });
    const list = Object.entries(byFreq).sort((a, b) => b[1] - a[1]);
    const max = list.reduce((m, x) => Math.max(m, x[1]), 0) || 1;
    const rows = list.map(([f, c]) => `<div class="freq-row"><span>${f}</span><div class="freq-track"><div class="freq-fill" style="width:${(c / max * 100).toFixed(1)}%;background:${freqColor(f)}"></div></div><span class="freq-cnt">${fmt(c)}</span></div>`).join('');
    return `<div class="cat-chart-box"><div class="cdl-title">Phân bổ theo tần suất cập nhật</div><div class="freq-bars">${rows || '<div class="unit-lookup-empty">Không có dữ liệu.</div>'}</div></div>`;
}


/* ============================== LĨNH VỰC GIÁO DỤC: port nguyên bản giaoduc_full_dashboard.html ============================== */
/* Dữ liệu thật 126 đơn vị phường/xã: [tên,số trường,trường CQG,học sinh,lớp học,phòng học,nhân sự,CBQL,giáo viên,biết bơi,tật về mắt,diện chính sách] — nguồn: Tong_hop_so_lieu_giao_duc_cap_nhat_A3_ngang.pdf, cập nhật 07/07/2026 */
const gdUnitData = [
    ['Phường Ba Đình', 17, 13, 9606, 238, 239, 893, 47, 678, 4555, 3447, 48],
    ['Phường Bạch Mai', 32, 20, 22876, 614, 520, 2126, 94, 1650, 9137, 9648, 57],
    ['Phường Bồ Đề', 54, 23, 25543, 748, 586, 2674, 149, 2062, 10138, 9389, 107],
    ['Phường Chương Mỹ', 28, 23, 22114, 428, 293, 1771, 86, 1432, 3650, 3441, 159],
    ['Phường Cầu Giấy', 38, 5, 35595, 697, 638, 3320, 113, 2771, 9505, 6997, 49],
    ['Phường Cửa Nam', 18, 6, 12105, 299, 216, 982, 44, 785, 6802, 5524, 250],
    ['Phường Dương Nội', 30, 10, 21748, 612, 295, 2390, 109, 1940, 6920, 5537, 35],
    ['Phường Giảng Võ', 23, 18, 27645, 582, 592, 1979, 74, 1628, 10617, 8106, 59],
    ['Phường Hai Bà Trưng', 26, 17, 16470, 341, 239, 1340, 69, 1035, 7628, 8190, 114],
    ['Phường Hoàn Kiếm', 19, 15, 11640, 186, 171, 977, 55, 753, 5126, 3638, 42],
    ['Phường Hoàng Liệt', 14, 4, 15441, 251, 204, 866, 39, 692, 8989, 6271, 37],
    ['Phường Hoàng Mai', 18, 7, 15109, 692, 627, 1094, 53, 864, 7654, 6310, 75],
    ['Phường Hà Đông', 84, 30, 61084, 1697, 1072, 6414, 321, 5110, 21565, 16659, 163],
    ['Phường Hồng Hà', 22, 13, 9132, 335, 332, 1195, 68, 911, 2364, 2767, 26],
    ['Phường Khương Đình', 24, 12, 25617, 589, 569, 2115, 70, 1791, 10236, 7477, 71],
    ['Phường Kim Liên', 31, 15, 19082, 431, 273, 1722, 85, 1333, 7383, 5400, 49],
    ['Phường Kiến Hưng', 19, 8, 17410, 561, 504, 1676, 85, 1325, 6125, 5455, 26],
    ['Phường Long Biên', 21, 17, 13001, 341, 310, 1223, 73, 913, 3966, 4027, 36],
    ['Phường Láng', 12, 6, 6865, 195, 185, 730, 31, 563, 3632, 2101, 15],
    ['Phường Lĩnh Nam', 5, 4, 3314, 76, 86, 279, 19, 197, 919, 472, 17],
    ['Phường Nghĩa Đô', 34, 8, 34641, 979, 989, 3856, 136, 3031, 11144, 8761, 50],
    ['Phường Ngọc Hà', 27, 13, 12710, 324, 232, 1539, 77, 1156, 4887, 3200, 27],
    ['Phường Phú Diễn', 29, 12, 21634, 713, 687, 2548, 81, 2087, 10127, 7380, 674],
    ['Phường Phú Lương', 17, 9, 11274, 321, 275, 1030, 58, 793, 4093, 3800, 63],
    ['Phường Phú Thượng', 18, 6, 10177, 257, 253, 1121, 55, 856, 2698, 2958, 15],
    ['Phường Phúc Lợi', 33, 17, 22533, 587, 621, 2250, 96, 1785, 6177, 6325, 54],
    ['Phường Phương Liệt', 15, 5, 7889, 346, 234, 1311, 76, 969, 3324, 2262, 18],
    ['Phường Sơn Tây', 25, 18, 14721, 339, 222, 1438, 65, 1080, 4601, 3818, 571],
    ['Phường Thanh Liệt', 22, 16, 16193, 413, 262, 1488, 86, 1168, 6663, 5240, 721],
    ['Phường Thanh Xuân', 48, 19, 31094, 871, 775, 3666, 126, 2815, 13986, 9023, 72],
    ['Phường Thượng Cát', 11, 6, 6354, 147, 165, 566, 32, 437, 3534, 2438, 67],
    ['Phường Tây Hồ', 32, 16, 18076, 521, 490, 2047, 82, 1496, 9043, 7315, 1981],
    ['Phường Tây Mỗ', 21, 6, 24943, 865, 509, 2928, 88, 2208, 6524, 5612, 82],
    ['Phường Tây Tựu', 16, 9, 6562, 182, 169, 707, 45, 522, 3384, 2416, 50],
    ['Phường Tùng Thiện', 21, 15, 10931, 266, 172, 874, 52, 661, 5194, 3341, 190],
    ['Phường Tương Mai', 31, 13, 23114, 667, 266, 1888, 109, 1450, 10709, 8786, 90],
    ['Phường Từ Liêm', 54, 21, 53054, 1651, 782, 5584, 180, 4019, 22536, 18300, 261],
    ['Phường Việt Hưng', 47, 25, 23749, 675, 379, 2223, 124, 1732, 6438, 7970, 198],
    ['Phường Văn Miếu - Quốc Tử Giám', 16, 6, 4651, 171, 40, 607, 39, 440, 1401, 1367, 29],
    ['Phường Vĩnh Hưng', 18, 13, 15389, 410, 350, 1296, 64, 1024, 6081, 5201, 177],
    ['Phường Vĩnh Tuy', 24, 8, 33802, 857, 598, 3363, 85, 2899, 8777, 5669, 152],
    ['Phường Xuân Phương', 24, 12, 15836, 544, 559, 1820, 82, 1480, 6401, 5276, 389],
    ['Phường Xuân Đỉnh', 15, 5, 13787, 523, 475, 1616, 78, 1256, 6020, 5327, 150],
    ['Phường Yên Hòa', 53, 15, 51622, 1395, 1385, 5156, 164, 4202, 16150, 12938, 48],
    ['Phường Yên Nghĩa', 14, 11, 8433, 310, 159, 969, 67, 743, 1716, 1951, 33],
    ['Phường Yên Sở', 13, 6, 8063, 389, 199, 823, 54, 632, 3903, 2592, 27],
    ['Phường Ô Chợ Dừa', 17, 9, 11861, 347, 282, 1061, 56, 815, 5154, 3920, 66],
    ['Phường Đông Ngạc', 20, 15, 17916, 520, 444, 1730, 75, 1347, 9388, 7319, 105],
    ['Phường Đại Mỗ', 24, 8, 13314, 593, 189, 2026, 94, 1595, 5348, 3573, 56],
    ['Phường Định Công', 21, 7, 24388, 446, 771, 2039, 57, 1688, 8402, 6180, 28],
    ['Phường Đống Đa', 19, 11, 15294, 378, 261, 1221, 57, 961, 6733, 5883, 504],
    ['Xã An Khánh', 33, 22, 19029, 648, 380, 2263, 98, 1705, 5201, 3226, 124],
    ['Xã Ba Vì', 13, 12, 4940, 144, 92, 586, 36, 416, 1278, 644, 1170],
    ['Xã Bát Tràng', 18, 16, 10812, 230, 227, 860, 47, 647, 3772, 3359, 390],
    ['Xã Bình Minh', 28, 17, 20554, 526, 550, 2358, 97, 1946, 5061, 3340, 210],
    ['Xã Bất Bạt', 14, 12, 6739, 187, 155, 673, 35, 491, 953, 906, 144],
    ['Xã Chuyên Mỹ', 17, 13, 7518, 197, 188, 789, 42, 585, 1233, 1225, 579],
    ['Xã Chương Dương', 19, 18, 9696, 267, 256, 989, 55, 758, 2162, 2007, 95],
    ['Xã Cổ Đô', 25, 23, 11573, 312, 249, 1208, 67, 880, 3166, 2668, 310],
    ['Xã Dân Hòa', 20, 19, 10430, 265, 189, 952, 55, 722, 2666, 2034, 225],
    ['Xã Dương Hòa', 20, 18, 10723, 255, 243, 1026, 46, 780, 3007, 2481, 87],
    ['Xã Gia Lâm', 32, 16, 32804, 853, 834, 3448, 98, 2668, 10895, 9312, 50],
    ['Xã Hoài Đức', 30, 15, 19016, 446, 325, 1731, 78, 1393, 4717, 4013, 84],
    ['Xã Hát Môn', 25, 16, 12477, 323, 290, 1196, 64, 913, 2917, 2324, 3489],
    ['Xã Hòa Lạc', 8, 4, 4685, 168, 224, 685, 28, 517, 1533, 905, 56],
    ['Xã Hòa Phú', 22, 19, 9331, 225, 141, 860, 53, 630, 2385, 1062, 1313],
    ['Xã Hòa Xá', 25, 21, 9026, 246, 171, 1011, 57, 726, 2607, 1633, 208],
    ['Xã Hưng Đạo', 19, 17, 9407, 240, 200, 938, 50, 702, 2249, 2223, 568],
    ['Xã Hương Sơn', 19, 16, 7979, 215, 177, 856, 51, 596, 1768, 1421, 182],
    ['Xã Hạ Bằng', 18, 12, 9721, 245, 239, 872, 51, 690, 2406, 1713, 155],
    ['Xã Hồng Sơn', 23, 23, 10006, 266, 274, 1104, 60, 789, 1676, 1651, 321],
    ['Xã Hồng Vân', 21, 15, 11079, 304, 211, 1085, 63, 826, 3497, 3117, 168],
    ['Xã Kim Anh', 13, 10, 9598, 221, 190, 783, 31, 605, 2534, 1279, 168],
    ['Xã Kiều Phú', 20, 18, 10445, 276, 265, 1026, 51, 759, 3640, 2404, 3082],
    ['Xã Liên Minh', 15, 14, 8160, 209, 181, 764, 35, 580, 1919, 1446, 81],
    ['Xã Minh Châu', 4, 1, 867, 27, 27, 113, 7, 77, 300, 44, 40],
    ['Xã Mê Linh', 19, 7, 12993, 308, 241, 1122, 53, 874, 2386, 2430, 161],
    ['Xã Mỹ Đức', 22, 17, 15085, 295, 249, 1355, 70, 1008, 2790, 3074, 371],
    ['Xã Nam Phù', 17, 13, 9409, 256, 209, 908, 47, 686, 4401, 2312, 85],
    ['Xã Ngọc Hồi', 15, 10, 12657, 265, 263, 991, 54, 767, 4730, 2635, 70],
    ['Xã Nội Bài', 22, 17, 16442, 387, 334, 1298, 56, 1007, 6626, 3470, 336],
    ['Xã Phù Đổng', 37, 28, 20475, 482, 417, 1779, 92, 1358, 7556, 6621, 142],
    ['Xã Phú Cát', 19, 14, 7028, 196, 152, 809, 41, 586, 2137, 832, 171],
    ['Xã Phú Nghĩa', 20, 12, 10363, 259, 265, 932, 54, 705, 1877, 1521, 180],
    ['Xã Phú Xuyên', 35, 24, 16388, 419, 348, 1831, 95, 1339, 3169, 3096, 763],
    ['Xã Phúc Lộc', 25, 20, 11913, 304, 210, 1173, 65, 868, 2804, 2319, 240],
    ['Xã Phúc Sơn', 20, 20, 8074, 211, 195, 961, 58, 670, 2407, 1383, 386],
    ['Xã Phúc Thịnh', 27, 18, 21391, 517, 598, 2089, 86, 1664, 7026, 5230, 813],
    ['Xã Phúc Thọ', 28, 22, 13255, 317, 253, 1392, 71, 1060, 2776, 1600, 1925],
    ['Xã Phượng Dực', 16, 15, 9069, 253, 207, 1063, 46, 787, 1306, 1140, 279],
    ['Xã Quang Minh', 26, 16, 18242, 434, 278, 1462, 66, 1155, 4014, 3339, 309],
    ['Xã Quảng Bị', 16, 13, 12261, 274, 224, 906, 41, 716, 2894, 1664, 160],
    ['Xã Quảng Oai', 24, 17, 12887, 316, 240, 1140, 60, 852, 4069, 2248, 510],
    ['Xã Quốc Oai', 25, 17, 15999, 398, 322, 1506, 70, 1162, 4658, 4304, 354],
    ['Xã Suối Hai', 12, 13, 8679, 226, 167, 793, 39, 592, 2061, 1108, 1663],
    ['Xã Sóc Sơn', 47, 32, 30785, 653, 579, 2536, 115, 1958, 10859, 6413, 2313],
    ['Xã Sơn Đồng', 27, 14, 13102, 367, 278, 1419, 72, 1059, 3662, 3097, 58],
    ['Xã Tam Hưng', 16, 10, 9609, 211, 192, 790, 40, 613, 2831, 2017, 122],
    ['Xã Thanh Oai', 23, 18, 11390, 296, 283, 1055, 60, 793, 3542, 2123, 478],
    ['Xã Thanh Trì', 17, 12, 9705, 298, 149, 1077, 77, 814, 3353, 3145, 26],
    ['Xã Thiên Lộc', 25, 14, 14890, 398, 358, 1315, 68, 1029, 5878, 4255, 4877],
    ['Xã Thuận An', 18, 18, 12743, 322, 286, 1126, 55, 870, 4456, 3605, 50],
    ['Xã Thư Lâm', 31, 21, 19612, 486, 442, 1651, 78, 1289, 7673, 6041, 3879],
    ['Xã Thường Tín', 32, 26, 19016, 451, 451, 1722, 89, 1328, 6452, 4306, 168],
    ['Xã Thượng Phúc', 16, 16, 7884, 208, 168, 770, 40, 593, 2294, 1269, 93],
    ['Xã Thạch Thất', 22, 17, 12867, 260, 249, 1059, 59, 817, 4224, 2339, 164],
    ['Xã Tiến Thắng', 16, 13, 9689, 243, 131, 868, 39, 660, 2252, 1739, 216],
    ['Xã Trung Giã', 19, 18, 11731, 257, 207, 1002, 49, 750, 4586, 2164, 353],
    ['Xã Trần Phú', 17, 9, 10508, 230, 183, 793, 42, 620, 3001, 1236, 264],
    ['Xã Tây Phương', 34, 26, 20250, 516, 442, 1836, 91, 1454, 4864, 5245, 351],
    ['Xã Vân Đình', 24, 19, 9654, 247, 193, 1027, 60, 747, 2773, 2212, 245],
    ['Xã Vĩnh Thanh', 16, 10, 8959, 295, 312, 938, 46, 725, 2869, 2154, 111],
    ['Xã Vật Lại', 18, 10, 12384, 269, 225, 1082, 54, 825, 3113, 1016, 704],
    ['Xã Xuân Mai', 29, 14, 16278, 435, 342, 1228, 70, 972, 5863, 2138, 276],
    ['Xã Yên Bài', 12, 12, 3753, 115, 100, 470, 29, 335, 1114, 667, 98],
    ['Xã Yên Lãng', 23, 17, 13586, 329, 286, 1248, 62, 928, 2153, 2333, 218],
    ['Xã Yên Xuân', 18, 10, 6417, 167, 129, 687, 47, 501, 2055, 614, 269],
    ['Xã Ô Diên', 30, 26, 17367, 471, 423, 1642, 76, 1273, 4027, 5698, 181],
    ['Xã Đa Phúc', 22, 20, 14748, 339, 277, 1303, 59, 979, 5430, 2178, 2152],
    ['Xã Đan Phượng', 18, 16, 12429, 266, 167, 1176, 48, 938, 2185, 2550, 97],
    ['Xã Đoài Phương', 11, 7, 6611, 142, 127, 575, 27, 434, 2845, 1054, 67],
    ['Xã Đông Anh', 42, 30, 29919, 613, 608, 2798, 114, 2268, 10370, 6144, 1157],
    ['Xã Đại Thanh', 26, 20, 17184, 526, 392, 1760, 102, 1334, 6401, 5055, 772],
    ['Xã Đại Xuyên', 25, 20, 12006, 301, 349, 1240, 57, 943, 1988, 1552, 207],
    ['Xã Ứng Hòa', 30, 29, 9796, 255, 210, 1046, 68, 729, 2151, 2273, 267],
    ['Xã Ứng Thiên', 19, 18, 8659, 225, 199, 919, 48, 677, 3141, 1910, 230]
];
/* Drill-down + chi tiết đơn vị cho dashboard Giáo dục — dùng chung 1 nguồn gdUnitData */
const GD_SOURCE_NOTE = 'Nguồn: file cập nhật "SỐ LIỆU TRƯỜNG HỌC CÁC ĐƠN VỊ_SỞ GIÁO DỤC.txt" (Sở Giáo dục và Đào tạo), ghép theo tên đơn vị phường/xã với dữ liệu sức khỏe học sinh — cập nhật 07/07/2026.';
const GD_COL_GET = { name: u => u[0], truong: u => u[1], cqg: u => u[2], cqgRate: u => u[1] ? u[2] / u[1] * 100 : 0, hs: u => u[3], lop: u => u[4], phong: u => u[5], nhansu: u => u[6], cbql: u => u[7], gv: u => u[8], boi: u => u[9], mat: u => u[10], cs: u => u[11], hsLop: u => u[4] ? u[3] / u[4] : 0, hsGv: u => u[8] ? u[3] / u[8] : 0 };
const gdColumns = [
    { label: 'Đơn vị', key: 'name', align: 'left' }, { label: 'Số trường', key: 'truong', align: 'right' }, { label: 'Trường CQG', key: 'cqg', align: 'right' }, { label: 'Tỷ lệ CQG', key: 'cqgRate', align: 'right' },
    { label: 'Học sinh', key: 'hs', align: 'right' }, { label: 'Lớp học', key: 'lop', align: 'right' }, { label: 'Phòng học', key: 'phong', align: 'right' }, { label: 'Nhân sự', key: 'nhansu', align: 'right' },
    { label: 'CBQL', key: 'cbql', align: 'right' }, { label: 'Giáo viên', key: 'gv', align: 'right' }, { label: 'Biết bơi', key: 'boi', align: 'right' }, { label: 'Tật về mắt', key: 'mat', align: 'right' }, { label: 'Diện chính sách', key: 'cs', align: 'right' }
];
let gdSort = { key: 'hs', dir: 'desc' };
function gdFmtVal(key, v) { return key === 'cqgRate' ? v.toFixed(1) + '%' : fmt(v); }
function gdSortedUnits() {
    const { key, dir } = gdSort, get = GD_COL_GET[key];
    return [...gdUnitData].sort((a, b) => {
        const av = get(a), bv = get(b);
        if (key === 'name') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        return dir === 'asc' ? av - bv : bv - av;
    });
}
function gdSortBy(key) {
    gdSort = gdSort.key === key ? { key, dir: gdSort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' };
    const thead = document.getElementById('gdUnitThead'); if (thead) thead.innerHTML = gdUnitTheadHtml();
    const tbody = document.getElementById('gdUnitTbody'); if (tbody) tbody.innerHTML = gdUnitTableRowsHtml();
}
function gdUnitTheadHtml() {
    return `<tr>${gdColumns.map(c => `<th onclick="gdSortBy('${c.key}')" style="cursor:pointer;text-align:${c.align};white-space:nowrap">${esc(c.label)}${gdSort.key === c.key ? (gdSort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr>`;
}
function gdUnitTableRowsHtml() {
    return gdSortedUnits().map(u => {
        const nameSafe = u[0].replace(/'/g, "\\'");
        return `<tr onclick="gdOpenUnitDetail('${nameSafe}')">${gdColumns.map(c => {
            const v = GD_COL_GET[c.key](u);
            return `<td style="text-align:${c.align}">${c.key === 'name' ? esc(v) : gdFmtVal(c.key, v)}</td>`;
        }).join('')}</tr>`;
    }).join('');
}
function gdDrillToUnits(key, names, note) {
    gdSort = { key, dir: key === 'name' ? 'asc' : 'desc' };
    const thead = document.getElementById('gdUnitThead'); if (thead) thead.innerHTML = gdUnitTheadHtml();
    const tbody = document.getElementById('gdUnitTbody'); if (tbody) tbody.innerHTML = gdUnitTableRowsHtml();
    if (note) toast(note);
    const rows = [...document.querySelectorAll('#gdUnitTbody tr')];
    const target = names && names.length ? rows.find(r => names.some(n => r.firstElementChild.textContent.indexOf(n) === 0)) : rows[0];
    if (target) {
        target.style.outline = '2px solid #ffd54b';
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => { target.style.outline = ''; }, 2500);
    }
}
function gdOpenUnitDetail(name) {
    toast('Tạm thời chưa hỗ trợ xem chi tiết đơn vị.'); return;
    const u = gdUnitData.find(x => x[0] === name); if (!u) return;
    const fields = [['Số trường', u[1]], ['Trường chuẩn quốc gia', u[2]], ['Số lớp học', u[4]], ['Số phòng học', u[5]], ['Tổng nhân sự', u[6]], ['CBQL', u[7]], ['Giáo viên', u[8]], ['Học sinh', u[3]], ['HS biết bơi', u[9]], ['HS có tật về mắt', u[10]], ['HS diện chính sách', u[11]]];
    document.getElementById('modalTitle').textContent = name;
    document.getElementById('modalSub').textContent = 'Sở Giáo dục và Đào tạo · 126 đơn vị phường/xã';
    document.getElementById('modalBody').innerHTML = `
      <div class="kv">${fields.map(f => `<b>${esc(f[0])}</b><span>${fmt(f[1])}</span>`).join('')}</div>
      <div class="record-update-note" style="margin-top:12px">${GD_SOURCE_NOTE}</div>`;
    openModal();
}

/* Xếp hạng cao nhất / thấp nhất theo 1 chỉ số — gộp thẳng vào từng màn chi tiết category, không tách card riêng */
function gdRankRowHtml(name, valueLabel, pct, color) {
    const nameSafe = name.replace(/'/g, "\\'");
    return `<div class="rank-row" style="cursor:pointer" onclick="gdOpenUnitDetail('${nameSafe}')"><div class="rank-row-top"><span class="rank-label">${esc(name)}</span><b class="rank-value">${valueLabel}</b></div><div class="rank-track"><div class="rank-fill" style="width:${pct.toFixed(1)}%;background:${color}"></div></div></div>`;
}
function gdMetricRankHtml(key, label, fmtFn) {
    const rows = gdUnitData.map(u => ({ name: u[0], v: GD_COL_GET[key](u) }));
    const highest = [...rows].sort((a, b) => b.v - a.v).slice(0, 5);
    const lowest = [...rows].sort((a, b) => a.v - b.v).slice(0, 5);
    const maxAbs = Math.max(...rows.map(r => r.v), 1);
    return `<div class="cat-chart-box">
      <div class="cdl-title">${esc(label)} — cao nhất / thấp nhất</div>
      <p style="font-size:11px;font-weight:800;color:#7fe0a0;margin:8px 0 6px">🔼 Cao nhất</p>
      <div class="rank-list" style="margin-bottom:12px">${highest.map(r => gdRankRowHtml(r.name, fmtFn(r.v), r.v / maxAbs * 100, '#2fb174')).join('')}</div>
      <p style="font-size:11px;font-weight:800;color:#8fc7ea;margin:0 0 6px">🔽 Thấp nhất</p>
      <div class="rank-list">${lowest.map(r => gdRankRowHtml(r.name, fmtFn(r.v), r.v / maxAbs * 100, '#2c9ed2')).join('')}</div>
    </div>`;
}

/* Lớp 2: 1 màn chi tiết riêng cho mỗi category (Mạng lưới trường học / Học sinh / Nhân sự) — panel nhỏ ước tính bên trái + xếp hạng 126 đơn vị (data thật) bên phải */
const GD_CAT_META = {
    truong: {
        title: 'Mạng lưới trường học', icon: '🏫',
        kpis: [['Số trường', '2.963'], ['Trường CQG', '1.868'], ['Tỷ lệ CQG', '63,04%'], ['Phòng học', '41.332']],
        smallCharts: [
            { id: 'gdD1', title: 'Số trường theo cấp học (ước tính toàn ngành)', type: 'bar', labels: ['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'GDTX'], data: [3600, 800, 400, 700, 123], color: '#2a78d6' },
            { id: 'gdD2', title: 'Loại hình trường (ước tính toàn ngành)', type: 'doughnut', labels: ['Công lập', 'Tư thục'], data: [2359, 3264], color: ['#2a78d6', '#1baf7a'] }
        ],
        rankKey: 'truong', rankLabel: 'số trường',
        tooltipFields: [['Số trường', 'truong'], ['Trường CQG', 'cqg'], ['Tỷ lệ CQG', 'cqgRate'], ['Phòng học', 'phong']],
        extraMetrics: [
            { key: 'cqgRate', label: 'Tỷ lệ trường chuẩn QG', fmt: v => v.toFixed(1) + '%' },
            { key: 'hsLop', label: 'Học sinh / lớp', fmt: v => v.toFixed(1) }
        ]
    },
    hocsinh: {
        title: 'Học sinh', icon: '🎓',
        kpis: [['Tổng học sinh', '1.918.158'], ['Học 2 buổi/ngày (ước tính)', '1.902.083'], ['HS diện chính sách', '51.063']],
        smallCharts: [
            { id: 'gdD3', title: 'Học sinh theo cấp học (ước tính toàn ngành)', type: 'bar', labels: ['Tiểu học', 'THCS', 'THPT', 'GDTX'], data: [756790, 652108, 318317, 66450], color: '#1baf7a' },
            { id: 'gdD4', title: 'Sức khỏe & chính sách (toàn ngành)', type: 'bar', labels: ['Biết bơi', 'Tật về mắt', 'Diện chính sách'], data: [639081, 492302, 51063], color: '#eda100' }
        ],
        rankKey: 'hs', rankLabel: 'học sinh',
        tooltipFields: [['Học sinh', 'hs'], ['Biết bơi', 'boi'], ['Tật về mắt', 'mat'], ['Diện chính sách', 'cs']]
    },
    nhansu: {
        title: 'Nhân sự – giáo viên', icon: '🧑‍🏫',
        kpis: [['Tổng nhân sự', '186.401'], ['CBQL', '8.464'], ['Giáo viên', '144.292'], ['Nhân viên (ước tính)', '33.645']],
        smallCharts: [
            { id: 'gdD5', title: 'Vị trí việc làm (ước tính toàn ngành)', type: 'doughnut', labels: ['Giáo viên', 'CBQL', 'Nhân viên'], data: [144292, 8464, 33645], color: ['#2a78d6', '#eda100', '#4a3aa7'] },
            { id: 'gdD6', title: 'Giáo viên theo cấp học (ước tính toàn ngành)', type: 'bar', labels: ['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'GDTX'], data: [48053, 32888, 30691, 17628, 4122], color: '#2a78d6' }
        ],
        rankKey: 'nhansu', rankLabel: 'nhân sự',
        tooltipFields: [['Tổng nhân sự', 'nhansu'], ['CBQL', 'cbql'], ['Giáo viên', 'gv']],
        extraMetrics: [
            { key: 'hsGv', label: 'Học sinh / giáo viên', fmt: v => v.toFixed(1) }
        ]
    }
};
function gdCategoryDetailHtml(catKey) {
    const m = GD_CAT_META[catKey];
    return `
<button class="category-view-back" onclick="openGiaoDucDashboard()"><i class="ti ti-arrow-left" style="font-size:14px" aria-hidden="true"></i>Quay lại</button>
<p style="font-weight:600;font-size:16px;margin:10px 0 12px">${m.icon} ${esc(m.title)}</p>
<div style="display:grid;grid-template-columns:1fr 1.6fr;gap:14px;align-items:start">
  <div style="display:grid;gap:14px">
    ${m.smallCharts.map(c => `<div class="cat-chart-box"><div class="cdl-title">${esc(c.title)}</div><div style="position:relative;height:190px"><canvas id="${c.id}"></canvas></div></div>`).join('')}
  </div>
  <div class="cat-chart-box">
    <div class="cdl-title">Xếp hạng 126 đơn vị theo ${esc(m.rankLabel)} (data thật — hover/bấm 1 cột để xem chi tiết đơn vị)</div>
    <div style="max-height:560px;overflow-y:auto"><div style="position:relative;height:${gdUnitData.length * 20}px"><canvas id="gdRankChart"></canvas></div></div>
  </div>
</div>
${(m.extraMetrics || []).length ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-top:14px">${m.extraMetrics.map(em => gdMetricRankHtml(em.key, em.label, em.fmt)).join('')}</div>` : ''}`;
}
function gdInitCategoryCharts(catKey) {
    const m = GD_CAT_META[catKey];
    m.smallCharts.forEach(c => {
        const labels = c.type === 'doughnut' ? c.labels.map((l, i) => `${l}: ${fmt(c.data[i])}`) : c.labels;
        new Chart(document.getElementById(c.id), { type: c.type, data: { labels, datasets: [{ data: c.data, backgroundColor: c.color, borderRadius: c.type === 'bar' ? 4 : 0, maxBarThickness: 28 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: c.type === 'doughnut', position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 13, padding: 10, font: { size: 14, weight: 700 } } } } } });
    });
    const sorted = [...gdUnitData].sort((a, b) => GD_COL_GET[m.rankKey](b) - GD_COL_GET[m.rankKey](a));
    new Chart(document.getElementById('gdRankChart'), {
        type: 'bar',
        data: { labels: sorted.map(u => u[0]), datasets: [{ data: sorted.map(u => GD_COL_GET[m.rankKey](u)), backgroundColor: '#2c9ed2', maxBarThickness: 14 }] },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const u = sorted[ctx.dataIndex];
                            return m.tooltipFields.map(f => `${f[0]}: ${gdFmtVal(f[1], GD_COL_GET[f[1]](u))}`);
                        }
                    }
                }
            },
            onClick: (evt, elements) => { if (elements.length) { gdOpenUnitDetail(sorted[elements[0].index][0]); } },
            scales: { y: { ticks: { color: chartLabelColor(), font: { size: 10 } } }, x: { ticks: { color: chartAxisColor() }, grid: { color: chartGridColor() } } }
        }
    });
}
function gdOpenCategoryDetail(catKey) {
    toast('Tạm thời chưa hỗ trợ xem chi tiết lĩnh vực con.'); return;
    document.getElementById('drawerBodyCT').innerHTML = `<div class="gd-dash">${gdCategoryDetailHtml(catKey)}</div>`;
    gdInitCategoryCharts(catKey);
}

function gdDashboardHtml() {
    return `
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
  <p style="font-weight:500;font-size:16px;margin:0;"><i class="ti ti-school" style="font-size:17px;vertical-align:-2px;margin-right:6px;" aria-hidden="true"></i>Giáo dục</p>
  <button class="primary" style="font-size:12px;" onclick="openFieldScenarioSelector('cat::UBND::ubnd-gddt')">Giao nhiệm vụ</button>
</div>
<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">
  <select style="height:32px;font-size:12px;"><option>2025-2026</option></select>
  <select style="height:32px;font-size:12px;"><option>Đầu năm</option></select>
  <span style="font-size:10.5px;color:var(--text-muted)">(hiển thị thông tin, chưa hỗ trợ lọc)</span>
</div>


<div class="gd-two-col">
  <div style="display:grid;gap:14px">
    <div class="cat-chart-box" style="cursor:pointer" onclick="gdOpenCategoryDetail('truong')">
      <div class="cdl-title">🏫 Mạng lưới trường học</div>
      <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 10px;">2.963 trường · 1.868 trường CQG (63,04%) · 41.332 phòng học</p>
      ${barDimBodyHtml(P('Cấp học (ước tính toàn ngành)', [['Mầm non', 3600], ['Tiểu học', 800], ['THCS', 400], ['THPT/GDTX', 823]]))}
      <p style="font-size:11px;color:#58b7ff;margin-top:8px">Bấm để xem chi tiết & xếp hạng 126 đơn vị →</p>
    </div>

    <div class="cat-chart-box" style="cursor:pointer" onclick="gdOpenCategoryDetail('hocsinh')">
      <div class="cdl-title">🎓 Học sinh</div>
      <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 10px;">1.918.158 học sinh · 99,2% học 2 buổi/ngày (ước tính)</p>
      ${barDimBodyHtml(P('Cấp học (ước tính toàn ngành)', [['Tiểu học', 756790], ['THCS', 652108], ['THPT', 318317], ['GDTX', 66450]]))}
      <p style="font-size:11px;color:#58b7ff;margin-top:8px">Bấm để xem chi tiết & xếp hạng 126 đơn vị →</p>
    </div>

    <div class="cat-chart-box" style="cursor:pointer" onclick="gdOpenCategoryDetail('nhansu')">
      <div class="cdl-title">🧑‍🏫 Nhân sự – giáo viên</div>
      <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 10px;">186.401 nhân sự · 144.292 giáo viên · 8.464 CBQL</p>
      ${barDimBodyHtml(P('Nhân lực', [['Giáo viên', 144292], ['CBQL', 8464], ['Nhân viên', 33645]]))}
      <p style="font-size:11px;color:#58b7ff;margin-top:8px">Bấm để xem chi tiết & xếp hạng 126 đơn vị →</p>
    </div>
  </div>

</div>

${fieldScenarioSummary('cat::UBND::ubnd-gddt')}`;
}

function gdFilterRows() {
    const q = document.getElementById('gd-search-donvi').value.toLowerCase();
    const rows = document.querySelectorAll('#gdUnitTbody tr');
    rows.forEach(function (r) {
        const name = r.children[0].textContent.toLowerCase();
        r.style.display = name.indexOf(q) !== -1 ? '' : 'none';
    });
}
function openGiaoDucDashboard() {
    document.getElementById('drawerTitle-ct').textContent = 'Lĩnh vực: Giáo dục';
    // document.getElementById('drawerSub').textContent = 'Giáo dục';
    document.getElementById('drawerBodyCT').innerHTML = `<div class="gd-dash">${gdDashboardHtml()}</div>`;
    openDrawer();
}

function catItemCardHtml(role, catId, idx, it) {
    const name = it[0], declared = Number(it[1]) || 0, freq = it[2], parts = it[4] || [];
    const clickAttr = `onclick="event.stopPropagation();openChartTableModalForCategory('${role}','${catId}',${idx})"`;
    let bodyHtml;
    if (parts.length) {
        /* Chỉ tiêu thống kê: hiển thị phân tổ thật (không phải trạng thái xử lý) */
        bodyHtml = parts.map(p => `<p class="cir-dim-label">${esc(p.dim)}</p>${phanToDimBodyHtml(p)}`).join('');
    } else {
        /* Chỉ tiêu dạng nhiệm vụ/việc: biểu đồ Chart.js donut theo trạng thái xử lý */
        const recs = indicatorRecordsFor(role, name);
        const tot = recs.length || declared || 1;
        const cnts = {}; CAT_ST.forEach(s => cnts[s.k] = recs.filter(r => r.status === s.k).length);
        const list = CAT_ST.map(s => ({ l: s.l, c: s.c, n: cnts[s.k] || 0 })).filter(s => s.n > 0);
        const finalList = list.length ? list : [{ l: 'Chưa phân loại', c: '#2c7dd2', n: tot }];
        const chartId = chartCanvasId();

        // queueDimChart(chartId, 'doughnut', finalList.map(s => s.l), finalList.map(s => s.n), finalList.map(s => s.c));
        bodyHtml = `<div style="position:relative;height:210px;margin-top:8px;cursor:pointer" ${clickAttr} title="Click biểu đồ để mở bảng dữ liệu chi tiết"><canvas id="${chartId}"></canvas></div>`;
    }
    return `<button class="cat-item-row" data-title-chart="${esc(name)}" onclick="openChartTableModalForCategory('${role}','${catId}',${idx})">
      <div class="field-category-meta"><span class="badge">${freq}</span></div>
      <h4 title="${esc(name)}">${name}</h4>
      <div class="cat-item-chart-trigger" style="cursor:pointer" ${clickAttr} title="Click biểu đồ để xem bảng dữ liệu chi tiết">${bodyHtml}</div>
    </button>`;
}

/* ==========================================================================
   POPUP DATA TABLE MODAL & FULL-WIDTH GRID HELPER
   ========================================================================== */
function normStr(str) {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd');
}

function catChartsSearchToolbarHtml() {
    return `<div class="cat-charts-search-toolbar">
      <div class="cat-charts-search-input-wrap">
        <span class="cat-charts-search-icon">🔍</span>
        <input type="text" id="catChartsSearchInput" class="cat-charts-search-input" placeholder="Tìm kiếm biểu đồ theo tên chỉ tiêu (titleChart)..." oninput="filterCatCharts(this.value)" autocomplete="off" />
        <button type="button" id="catChartsSearchClear" class="cat-charts-search-clear" onclick="clearCatChartsSearch()" title="Xóa tìm kiếm" style="display:none">✕</button>
      </div>
    </div>`;
}

function filterCatCharts(query) {
    const rawQ = (query || '').trim();
    const q = rawQ.toLowerCase();
    const qNorm = normStr(rawQ);

    const clearBtn = document.getElementById('catChartsSearchClear');
    if (clearBtn) {
        clearBtn.style.display = rawQ ? 'flex' : 'none';
    }

    const container = document.querySelector('.so-indicator-charts') || document.querySelector('.cat-item-list') || document.querySelector('.cat-chart-grid') || document.querySelector('.cat-charts-full-grid');
    if (!container) return;

    const cards = container.querySelectorAll('.cat-item-row, .so-breakdown-chart-card, .cat-chart-box');
    let visibleCount = 0;

    cards.forEach(card => {
        const titleAttr = card.getAttribute('data-title-chart') || '';
        const h4Text = card.querySelector('h4')?.textContent || '';
        const cdlText = card.querySelector('.cdl-title')?.textContent || '';
        const fullText = (titleAttr + ' ' + h4Text + ' ' + cdlText).trim();

        const fullTextLower = fullText.toLowerCase();
        const fullTextNorm = normStr(fullText);

        const match = !rawQ || fullTextLower.includes(q) || fullTextNorm.includes(qNorm);

        card.style.display = match ? '' : 'none';
        if (match) visibleCount++;
    });

    container.classList.remove('grid-1', 'grid-2');
    container.classList.add('grid-3');
    const parentGrid = container.closest('.cat-charts-full-grid');
    if (parentGrid && parentGrid !== container) {
        parentGrid.classList.remove('grid-1', 'grid-2', 'grid-3');
    }

    let emptyEl = document.getElementById('catChartsEmptyState');
    if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'catChartsEmptyState';
        emptyEl.className = 'cat-charts-empty-state';
        container.appendChild(emptyEl);
    }
    if (visibleCount === 0) {
        emptyEl.innerHTML = `🔍 Không tìm thấy biểu đồ nào phù hợp với từ khóa "<b>${esc(rawQ)}</b>"`;
        emptyEl.style.display = 'block';
    } else {
        emptyEl.style.display = 'none';
    }
}

function clearCatChartsSearch() {
    const input = document.getElementById('catChartsSearchInput');
    if (input) {
        input.value = '';
        filterCatCharts('');
        input.focus();
    }
}
function getChartGridClass(count) {
    return 'grid-3';
}

function applyChartGridLayout(container) {
    if (!container) return;
    container.classList.remove('grid-1', 'grid-2');
    container.classList.add('grid-3');
    const parentGrid = container.closest('.cat-charts-full-grid');
    if (parentGrid && parentGrid !== container) {
        parentGrid.classList.remove('grid-1', 'grid-2', 'grid-3');
    }
}

function ensureChartTableModal() {
    let overlay = document.getElementById('chartTableOverlay');
    let modal = document.getElementById('chartTableModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'chartTableOverlay';
        overlay.className = 'chart-table-overlay';
        overlay.style.display = 'none';
        overlay.onclick = closeChartTableModal;
        document.body.appendChild(overlay);
    }
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'chartTableModal';
        modal.className = 'chart-table-modal';
        modal.style.display = 'none';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="chart-table-modal-header">
                <div class="chart-table-modal-title-wrap">
                    <h3 id="chartTableModalTitle" class="chart-table-modal-title">📊 Bảng dữ liệu chi tiết</h3>
                    <p id="chartTableModalSub" class="chart-table-modal-sub">Dữ liệu chi tiết</p>
                </div>
                <button type="button" class="chart-table-modal-close" onclick="closeChartTableModal()" title="Đóng (ESC)">✕</button>
            </div>
            <div class="chart-table-modal-toolbar">
                <input id="chartTableModalSearch" class="chart-table-modal-search" placeholder="🔍 Tìm kiếm nhanh trong bảng..." oninput="filterChartTableModal(this)" />
                <span id="chartTableModalBadge" class="chart-table-modal-badge">0 bản ghi</span>
            </div>
            <div id="chartTableModalBody" class="chart-table-modal-body"></div>
        `;
        document.body.appendChild(modal);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeChartTableModal();
        });
    }
    return { overlay, modal };
}

function openChartTableModal(opts) {
    opts = opts || {};
    const { overlay, modal } = ensureChartTableModal();
    const titleEl = document.getElementById('chartTableModalTitle');
    const subEl = document.getElementById('chartTableModalSub');
    const bodyEl = document.getElementById('chartTableModalBody');
    const badgeEl = document.getElementById('chartTableModalBadge');
    const searchInput = document.getElementById('chartTableModalSearch');

    if (searchInput) searchInput.value = '';
    if (titleEl) titleEl.innerHTML = `📊 ${opts.title || 'Bảng dữ liệu chi tiết'}`;
    if (subEl) subEl.textContent = opts.subtitle || 'Dữ liệu chỉ tiêu';

    let tableHtml = opts.tableHtml || '';
    if (!tableHtml && opts.cat) {
        tableHtml = genUnitTableHtml(opts.cat);
    }

    if (bodyEl) {
        bodyEl.innerHTML = tableHtml;
        const rows = bodyEl.querySelectorAll('tbody tr:not(.iip-empty-row)');
        if (badgeEl) badgeEl.textContent = `${fmt(rows.length)} bản ghi`;
    }

    overlay.style.display = 'block';
    modal.style.display = 'flex';
    overlay.classList.add('show');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeChartTableModal() {
    const overlay = document.getElementById('chartTableOverlay');
    const modal = document.getElementById('chartTableModal');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('show');
    }
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
    document.body.style.overflow = '';
}

function filterChartTableModal(input) {
    const q = (input ? input.value : '').trim().toLowerCase();
    const bodyEl = document.getElementById('chartTableModalBody');
    const badgeEl = document.getElementById('chartTableModalBadge');
    if (!bodyEl) return;
    const rows = bodyEl.querySelectorAll('tbody tr:not(.iip-empty-row)');
    let visible = 0;
    rows.forEach(r => {
        const text = r.textContent.toLowerCase();
        const match = !q || text.includes(q);
        r.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    if (badgeEl) badgeEl.textContent = `${fmt(visible)} / ${fmt(rows.length)} bản ghi`;
}

function openChartTableModalForIndicator(name, idx, datasetId) {
    const data = window.__iocTableDetail?.data || [];
    const columns = window.__iocTableDetail?.columns || [];
    const ctx = window.__apiDrawerCtx;
    const cat = ctx?.cat || { name: name || '' };

    let tableHtml = '';
    if (data.length && columns.length) {
        const column_key = {};
        const cols = columns.map(e => {
            column_key[e.key] = e.name || e.key;
            return e.key;
        });
        const isNumericCol = (c) => {
            const keyLower = String(c || '').toLowerCase();
            const nameLower = String(column_key[c] || '').toLowerCase();
            if (nameLower.includes('giá trị') || keyLower === 'gia_tri' || keyLower === 'value' || keyLower === 'amount') return true;
            return false;
        };

        const thead = `<tr>${cols.map(c => {
            const align = isNumericCol(c) ? 'right' : 'left';
            return `<th style="text-align:${align}">${esc(column_key[c])}</th>`;
        }).join('')}</tr>`;

        const matchingRows = name ? data.filter(d => Object.keys(d).some(k => String(d[k]).toLowerCase() === String(name).toLowerCase() || String(d[k]).includes(name))) : [];
        const rowsToDisplay = matchingRows.length > 0 ? matchingRows : data;

        const rows = rowsToDisplay.map(d => `<tr id="table_${d.id}">${cols.map(c => `<td class="num" style="text-align:right">${esc(ctFormatTableCell(c, column_key[c], d[c]))}</td>`).join('')}</tr>`).join('');
        tableHtml = `<div class="iip-table-wrap" style="overflow:auto">
            <table class="iip-table" style="min-width:${Math.max(480, 200 + cols.length * 110)}px">
                <thead>${thead}</thead>
                <tbody>${rows || '<tr><td colspan="' + cols.length + '" style="text-align:center;padding:16px;color:#888">Chưa có bản ghi.</td></tr>'}</tbody>
            </table>
        </div>`;
    } else {
        tableHtml = genApiUnitTableHtml(cat);
    }

    openChartTableModal({
        title: name ? `Chỉ tiêu: ${name}` : (cat.name ? `Lĩnh vực: ${cat.name}` : 'Bảng dữ liệu chi tiết'),
        subtitle: `Dữ liệu phân bổ theo đơn vị · ${name || ''}`,
        tableHtml: tableHtml,
        cat: cat
    });
}

function openChartTableModalForCategory(role, catId, idx) {
    const cat = (categorySeed[role] || []).find(c => c.id === catId);
    if (!cat) return;
    const it = (cat.items || [])[idx];
    const name = it ? it[0] : cat.name;
    const tableHtml = genUnitTableHtml(cat);
    openChartTableModal({
        title: `Chỉ tiêu: ${name}`,
        subtitle: `Lĩnh vực: ${cat.name} · Bảng số liệu phân bổ đơn vị`,
        tableHtml: tableHtml,
        cat: cat
    });
}

const HN_UNIT_NAMES = gdUnitData.map(u => u[0]);

/* ===== Định dạng ngày giờ cho bảng dữ liệu chi tiết =====
   Cột của bảng do API trả (`__iocTableDetail.columns`), giá trị ngày giờ về dạng ISO
   ("2026-09-15T08:30:00Z") nên trước đây in thẳng ra ô. Nhận diện cột theo key/tên đã bỏ
   dấu: "Kỳ báo cáo" -> DD/MM/YYYY, "Thời gian nạp dữ liệu" -> DD/MM/YYYY HH:mm:ss.
   Giá trị không phải ngày (vd kỳ báo cáo ghi "Quý 3/2026") giữ nguyên, không bịa ra ngày. */
function ctNoAccent(s) {
    return String(s == null ? '' : s)
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase();
}
function ctParseDateValue(v) {
    if (v == null || v === '') return null;
    const s = String(v).trim();
    const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (dmy) {
        const d = new Date(+dmy[3], +dmy[2] - 1, +dmy[1], +(dmy[4] || 0), +(dmy[5] || 0), +(dmy[6] || 0));
        return isNaN(d) ? null : d;
    }
    // Chỉ nhận ISO; tránh new Date("Quý 3") hay new Date("2026") ra ngày vô nghĩa.
    if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
    const d = new Date(s);
    return isNaN(d) ? null : d;
}
function ctPad2(n) { return String(n).padStart(2, '0'); }
function ctFmtDateCell(v) {
    /* Kỳ báo cáo là một mốc lịch, không phải thời điểm -> lấy thẳng phần ngày trong chuỗi ISO.
       Nếu đổi qua new Date() thì "2026-09-30T17:00:00Z" sẽ thành 01/10/2026 ở giờ VN. */
    const iso = String(v == null ? '' : v).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const d = ctParseDateValue(v);
    if (!d) return null;
    return `${ctPad2(d.getDate())}/${ctPad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function ctFmtDateTimeCell(v) {
    /* Ngày và giờ phải cùng lấy từ Date đã quy về giờ máy, không dùng ctFmtDateCell (lấy
       ngày nguyên văn trong chuỗi) — nếu trộn hai nguồn thì "…T23:30:00Z" ra ngày hôm trước
       kèm giờ hôm sau. */
    const d = ctParseDateValue(v);
    if (!d) return null;
    return `${ctPad2(d.getDate())}/${ctPad2(d.getMonth() + 1)}/${d.getFullYear()}`
        + ` ${ctPad2(d.getHours())}:${ctPad2(d.getMinutes())}:${ctPad2(d.getSeconds())}`;
}
function ctFormatTableCell(colKey, colName, val) {
    /* Cột dữ liệu kiểu Number: số nguyên giữ nguyên, số thập phân CẮT (không làm tròn) còn
       đúng 1 chữ số sau dấu phẩy. Chỉ áp dụng khi val THẬT SỰ là kiểu number (API trả JSON
       number) — chuỗi số dạng text (vd mã đơn vị "001") không bị đụng tới. */
    if (typeof val === 'number') {
        if (!Number.isFinite(val)) return '';
        if (Number.isInteger(val)) return String(val);
        return (Math.trunc(val * 10) / 10).toFixed(1);
    }
    const raw = val == null ? '' : String(val);
    if (!raw) return '';
    const id = ctNoAccent(colKey) + ' ' + ctNoAccent(colName);
    if (/ky[\s_-]*bao[\s_-]*cao/.test(id)) return ctFmtDateCell(raw) || raw;
    if (/nap[\s_-]*du[\s_-]*lieu|thoi[\s_-]*gian[\s_-]*nap|loaded[\s_-]*at/.test(id)) {
        return ctFmtDateTimeCell(raw) || raw;
    }
    return raw;
}
function genUnitTableHtml(cat) {
    //console.log("genUnitTableHtml", cat)
    // const itemName = window.__allItems.find(e => e.id === cardInfo.it[0] || e._id === cardInfo.it[0])
    // const name = cardInfo.titleDashboard || "";
    const name = cat.name || "";
    const data = window.__iocTableDetail?.data || []
    const columns = window.__iocTableDetail?.columns || []
    // if(actionChart) data= [window.__iocTableDetail?.data || []].filter((a) => Object.keys(a).some(i => a[i] === value))

    //console.log('genUnitTableHtml', data)
    // const cols = cat.items.map(it => it[0]);
    const column_key = {}
    const cols = columns.map(e => {
        column_key[e.key] = e.name
        return e.key
    })
    //console.log('columns', { columns, cols, column_key })
    // //console.log("genUnitTableHtml", { cols, data, cat })
    const thead = `<tr>${cols.map(c => `<th style="text-align:right">${column_key[c]}</th>`).join('')}</tr>`;
    // //console.log('HN_UNIT_NAMES', HN_UNIT_NAMES)
    const rows = data.map(data => `<tr id="${'table_' + data.id}">${cols.map((c) => `<td class="num" style="text-align:right">${ctFormatTableCell(c, column_key[c], data[c])}</td>`).join('')}</tr>`).join('');
    return `<div class="cat-chart-box gen-unit-box" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
      <div class="cdl-title" style="margin-bottom:10px;flex:0 0 auto">Danh sách ${name}</div>
      <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
        <table class="iip-table" style="min-width:${280 + cols.length * 110}px"><thead>${thead}</thead><tbody>${rows}</tbody></table>
      </div>
    </div>`;
}
function genFilterUnitTable(input) {
    const wrap = input.closest('.cat-chart-box'); if (!wrap) return;
    const q = input.value.trim().toLowerCase();
    wrap.querySelectorAll('tbody tr').forEach(r => { r.style.display = r.children[0].textContent.toLowerCase().includes(q) ? '' : 'none'; });
}
/* Đo chiều cao thật của cột chỉ tiêu (trái) rồi gán cứng cho khung 126 đơn vị (phải) — tránh vòng lặp
   tính toán của CSS grid/flex khi nội dung bảng 126 dòng không bị giới hạn chiều cao. */
function syncGenUnitBoxHeight() {
    document.querySelectorAll('.cat-two-col').forEach(wrap => {
        const left = wrap.children[0], box = wrap.querySelector('.gen-unit-box');
        if (!left || !box) return;
        box.style.height = Math.max(left.offsetHeight, 320) + 'px';
    });
}
/* ===== Giao diện riêng cho "Ủy ban Kiểm tra Thành ủy" — port đúng số liệu & bố cục từ ảnh số liệu thật UBKT cung cấp ===== */
function ubktBox1Html() {
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-ubkt',1)" title="Giám sát UBKT — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Giám sát của UBKT các cấp</div>
      <p style="text-align:center;margin:8px 0 16px"><span style="font-size:10px;color:var(--text-muted)">Tổng: </span><b style="font-size:24px;color:#fff">233</b></p>
      <div style="display:flex;flex-direction:column;gap:9px">
        <div style="display:flex;justify-content:space-between;font-size:11.5px;color:#dceeff"><span>👥 Tổ chức Đảng</span><b>109</b></div>
        <div style="display:flex;justify-content:space-between;font-size:11.5px;color:#dceeff"><span>🏛 Đảng viên</span><b>124</b></div>
      </div>
    </div>`;
}
function ubktBox2Html() {
    const grp = (label, total, to, dv) => `<div style="background:rgba(44,125,210,.16);border:1px solid rgba(44,125,210,.4);border-radius:10px;padding:10px 12px">
      <div style="display:flex;justify-content:space-between;font-weight:800;color:#fff;font-size:11.5px"><span>${label}</span><span>${fmt(total)}</span></div>
      <div style="margin-top:9px;font-size:10.5px;color:#b7d4ee;display:flex;justify-content:space-between"><span>🏛 Tổ chức Đảng</span><b>${fmt(to)}</b></div>
      <div style="font-size:10.5px;color:#b7d4ee;display:flex;justify-content:space-between;margin-top:4px"><span>👥 Đảng viên</span><b>${fmt(dv)}</b></div>
    </div>`;
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-ubkt',2)" title="KTGS cấp ủy — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Kiểm tra giám sát của cấp ủy các cấp và chi bộ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">${grp('Kiểm tra', 574, 256, 318)}${grp('Giám sát', 475, 228, 247)}</div>
    </div>`;
}
function ubktBox3Html() {
    const rows = [['Cách chức', '#2c7dd2'], ['Cảnh cáo', '#d8a50c'], ['Khiển trách', '#d25a19'], ['Khai trừ', '#d33a44']];
    const vals = { 'Đảng viên': [1, 6, 8, 20], 'Tổ chức Đảng': [0, 0, 0, 0] };
    const col = (label, icon) => `<div style="background:rgba(6,28,52,.6);border:1px solid rgba(87,178,255,.2);border-radius:10px;padding:10px 12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-weight:800;color:#fff;font-size:11.5px">${label}</span><span style="background:rgba(87,178,255,.16);border-radius:8px;padding:2px 8px;font-size:11px">${icon}</span></div>
      ${rows.map((r, i) => `<div style="display:flex;align-items:center;gap:6px;font-size:10.5px;color:#c8dcec;margin-top:5px"><i style="width:8px;height:8px;border-radius:50%;background:${r[1]};display:inline-block;flex:0 0 auto"></i><span style="flex:1">${r[0]}</span><b>${vals[label][i]}</b></div>`).join('')}
    </div>`;
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-ubkt',3)" title="Thi hành kỷ luật — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Thi hành kỷ luật</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">${col('Đảng viên', '👥')}${col('Tổ chức Đảng', '🏛')}</div>
    </div>`;
}
function ubktBox4Html() {
    const rows = [
        ['Kiểm tra tổ chức đảng cấp dưới thực hiện nhiệm vụ KTGS', 42, '#2c7dd2'],
        ['Kiểm tra việc thi hành kỷ luật của tổ chức đảng cấp dưới', 6, '#1baf7a'],
        ['Về thu, chi ngân sách và sản xuất kinh doanh', 0, '#d33a44'],
        ['Về thu, nộp, quản lý và sử dụng đảng phí', 43, '#8b5cf6']
    ];
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-ubkt',4)" title="Kiểm tra UBKT — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Kiểm tra của UBKT các cấp (kiểm tra việc thực hiện nhiệm vụ KTGS và THKL và tài chính đảng)</div>
      <div style="display:grid;gap:10px;margin-top:8px">${rows.map(r => `<div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#dceeff"><i style="width:9px;height:9px;border-radius:50%;background:${r[2]};flex:0 0 auto"></i><span style="flex:1">${esc(r[0])}</span><b>${fmt(r[1])}</b></div>`).join('')}</div>
    </div>`;
}
const UBKT_DOAN_DATA = [
    ['Đoàn 1', 2, 2, 2, 8], ['Đoàn 2', 3, 3, 0, 40], ['Đoàn 3', 3, 3, 0, 8], ['Đoàn 4', 3, 3, 0, 14],
    ['Đoàn 5', 3, 3, 0, 12], ['Đoàn 6', 3, 3, 0, 31], ['Đoàn 7', 3, 3, 2, 19], ['Đoàn 8', 4, 4, 4, 23],
    ['Đoàn 9', 4, 4, 0, 19], ['Đoàn 10', 4, 4, 0, 37], ['Đoàn 11', 4, 4, 0, 31], ['Đoàn 12', 4, 4, 0, 30]
];
function ubktChartBoxHtml() {
    return `<div class="cat-chart-box" style="margin-top:14px;cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-ubkt',5)" title="Đoàn KTGS — click để fill số liệu">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
        <div class="cdl-title" style="margin:0">Thống kê tình hình đoàn kiểm tra, giám sát</div>
        <span style="height:30px;font-size:11.5px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid rgba(87,178,255,.32);background:#0a2338;color:#e8f4ff;border-radius:8px" title="Chưa hỗ trợ lọc theo "> 4/2026</span>
      </div>
      <div style="overflow-x:auto"><div style="position:relative;height:320px;min-width:${UBKT_DOAN_DATA.length * 150}px"><canvas id="ubktDoanChart"></canvas></div></div>
    </div>`;
}
let ubktDoanChartInstance = null;
function initUbktDoanChart() {
    const canvas = document.getElementById('ubktDoanChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (ubktDoanChartInstance) { ubktDoanChartInstance.destroy(); ubktDoanChartInstance = null; }
    const labels = UBKT_DOAN_DATA.map(d => d[0]);
    const series = [
        { label: 'Đơn vị đã công bố/triển khai QĐ', color: '#7c6fe0', idx: 1 },
        { label: 'Đơn vị đã báo cáo', color: '#39d5ff', idx: 2 },
        { label: 'Đơn vị được kiểm tra đã làm việc', color: '#eda100', idx: 3 },
        { label: 'Khó khăn, kiến nghị', color: '#ffd54b', idx: 4 }
    ];
    ubktDoanChartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: series.map(s => ({ label: s.label, data: UBKT_DOAN_DATA.map(d => d[s.idx]), backgroundColor: s.color, borderRadius: 3, maxBarThickness: 16 })) },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            categoryPercentage: 0.85, barPercentage: 0.85,
            scales: { y: { min: 0, max: 60, ticks: { stepSize: 10, color: chartAxisColor(), font: { size: 10 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 10 } }, grid: { display: false } } },
            plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 9.5 } } } }
        }
    });
}

const TOCHUC_BIENCHE_DATA = { labels: ['Biên chế CBCC, VC', 'LĐHĐ theo Nghị định 111', 'LĐHĐ theo Nghị định 173'], giao: [5238, 723, 0], hienco: [4505, 570, 40] };
function tochucBox1Html() {
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="if(window.__chartElClicked)window.__chartElClicked=false;else catDonutSegmentClick('DANG','dang-to-chuc',3)" title="Biên chế khối Đảng — click cột/bar cụ thể để fill số liệu tương ứng">
      <div class="cdl-title" style="text-align:center;font-size:11px">Biên chế khối Đảng, đoàn thể</div>
      <div style="position:relative;height:200px;margin-top:8px"><canvas id="tochucBienCheChart"></canvas></div>
    </div>`;
}
let tochucBienCheChartInstance = null;
function initTochucBienCheChart() {
    const canvas = document.getElementById('tochucBienCheChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (tochucBienCheChartInstance) { tochucBienCheChartInstance.destroy(); tochucBienCheChartInstance = null; }
    tochucBienCheChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: TOCHUC_BIENCHE_DATA.labels, datasets: [
                { label: 'Số được giao', data: TOCHUC_BIENCHE_DATA.giao, backgroundColor: '#38A13E', borderRadius: 3, maxBarThickness: 36 },
                { label: 'Số hiện có', data: TOCHUC_BIENCHE_DATA.hienco, backgroundColor: '#C9FFCC', borderRadius: 3, maxBarThickness: 36 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...TOCHUC_BIENCHE_DATA.giao, ...TOCHUC_BIENCHE_DATA.hienco) * 1.15), ticks: { color: chartAxisColor(), font: { size: 10 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 9.5 } }, grid: { display: false } } },
            plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 9.5 } } } },
            onClick: (e, els) => { if (els.length) { const el = els[0]; const v = TOCHUC_BIENCHE_DATA[['giao', 'hienco'][el.datasetIndex]][el.index]; window.__chartElClicked = true; catFillTableColumn('DANG', 'dang-to-chuc', 3, v, ['Giao', 'Hiện có'][el.datasetIndex] + ' - ' + TOCHUC_BIENCHE_DATA.labels[el.index]); } },
            onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }
        }
    });
}
/* Chỉ có số liệu chính xác của  3/2026 (từ tooltip thật); 5  trước ước lượng theo đúng hình dạng đường trong ảnh gốc */
const TOCHUC_DANHGIA_MONTHS = ['10/2025', '11/2025', '12/2025', '01/2026', '02/2026', '03/2026'];
const TOCHUC_DANHGIA_DATA = [
    { label: 'Không hoàn thành nhiệm vụ', color: '#d33a44', data: [65, 58, 62, 55, 60, 59] },
    { label: 'Hoàn thành nhiệm vụ', color: '#d8a50c', data: [1250, 1280, 1230, 1260, 1240, 1214] },
    { label: 'Hoàn thành tốt nhiệm vụ', color: '#2fb174', data: [130000, 127000, 122000, 131000, 131000, 115052] },
    { label: 'Hoàn thành xuất sắc nhiệm vụ', color: '#39d5ff', data: [21500, 22000, 21800, 22300, 22400, 22621] }
];
function tochucBox2Html() {
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="if(window.__chartElClicked)window.__chartElClicked=false;else catDonutSegmentClick('DANG','dang-to-chuc',4)" title="Đánh giá cán bộ — click từng đường/month để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Kết quả đánh giá cán bộ hàng  ( 3/2026 chính xác — các  trước ước lượng theo xu hướng)</div>
      <div style="position:relative;height:220px;margin-top:8px"><canvas id="tochucDanhGiaChart"></canvas></div>
    </div>`;
}
let tochucDanhGiaChartInstance = null;
function initTochucDanhGiaChart() {
    const canvas = document.getElementById('tochucDanhGiaChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (tochucDanhGiaChartInstance) { tochucDanhGiaChartInstance.destroy(); tochucDanhGiaChartInstance = null; }
    tochucDanhGiaChartInstance = new Chart(canvas, {
        type: 'line',
        data: { labels: TOCHUC_DANHGIA_MONTHS, datasets: TOCHUC_DANHGIA_DATA.map(s => ({ label: s.label, data: s.data, borderColor: s.color, backgroundColor: s.color, pointBackgroundColor: s.color, pointRadius: 4, tension: .3, fill: false })) },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { y: { beginAtZero: true, ticks: { color: chartAxisColor(), font: { size: 9.5 }, callback: v => (v / 1000) + ' nghìn' }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 9.5 } }, grid: { display: false } } },
            plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 10, font: { size: 9 } } } },
            onClick: (e, els) => { if (els.length) { const el = els[0]; const v = TOCHUC_DANHGIA_DATA[el.datasetIndex].data[el.index]; window.__chartElClicked = true; catFillTableColumn('DANG', 'dang-to-chuc', 4, v, TOCHUC_DANHGIA_DATA[el.datasetIndex].label + ' - ' + TOCHUC_DANHGIA_MONTHS[el.index]); } },
            onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }
        }
    });
}
const TOCHUC_BIENDONG_DATA = [['Kết nạp mới', 591, '#38A13E'], ['Chuyển SHĐ đến', 1357, '#00D5FF'], ['Chuyển SHĐ đi', 1021, '#FD9843'], ['Xóa tên, cho ra khỏi Đảng', 60, '#E80054'], ['Từ trần', 314, '#CACACA']];
function tochucBox3Html() {
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="if(window.__chartElClicked)window.__chartElClicked=false;else catDonutSegmentClick('DANG','dang-to-chuc',5)" title="Biến động đảng viên — click từng cột để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Biến động đảng viên theo thời gian</div>
      <div style="position:relative;height:200px;margin-top:8px"><canvas id="tochucBienDongChart"></canvas></div>
    </div>`;
}
let tochucBienDongChartInstance = null;
function initTochucBienDongChart() {
    const canvas = document.getElementById('tochucBienDongChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (tochucBienDongChartInstance) { tochucBienDongChartInstance.destroy(); tochucBienDongChartInstance = null; }
    tochucBienDongChartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels: TOCHUC_BIENDONG_DATA.map(d => d[0]), datasets: [{ data: TOCHUC_BIENDONG_DATA.map(d => d[1]), backgroundColor: TOCHUC_BIENDONG_DATA.map(d => d[2]), borderRadius: 3, maxBarThickness: 34 }] },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...TOCHUC_BIENDONG_DATA.map(d => d[1])) * 1.15), ticks: { color: chartAxisColor(), font: { size: 10 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 9 } }, grid: { display: false } } },
            plugins: { legend: { display: false } },
            onClick: (e, els) => { if (els.length) { const el = els[0]; window.__chartElClicked = true; catFillTableColumn('DANG', 'dang-to-chuc', 5, TOCHUC_BIENDONG_DATA[el.index][1], TOCHUC_BIENDONG_DATA[el.index][0]); } },
            onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }
        }
    });
}
function donutCenterTextPlugin(line1, line2) {
    return {
        id: 'donutCenterText',
        afterDraw(chart) {
            const { ctx, chartArea } = chart; if (!chartArea) return;
            const cx = (chartArea.left + chartArea.right) / 2, cy = (chartArea.top + chartArea.bottom) / 2;
            ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const isLightTheme = document.documentElement.classList.contains('theme-light') || document.documentElement.classList.contains('theme-green');
            ctx.fillStyle = isLightTheme ? '#111827' : '#fff'; ctx.font = "700 17px 'Be Vietnam Pro',Arial,sans-serif";
            ctx.fillText(line1, cx, cy - 8);
            ctx.fillStyle = isLightTheme ? '#475569' : '#a8c3d8'; ctx.font = "600 9.5px 'Be Vietnam Pro',Arial,sans-serif";
            ctx.fillText(line2, cx, cy + 11);
            ctx.restore();
        }
    };
}
function tochucBox4Html() {
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="if(window.__chartElClicked)window.__chartElClicked=false;else catDonutSegmentClick('DANG','dang-to-chuc',6)" title="Cơ cấu tổ chức Đảng — click từng phần để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Cơ cấu tổ chức Đảng trực thuộc</div>
      <div style="position:relative;height:190px;margin-top:8px"><canvas id="tochucCoCauChart"></canvas></div>
    </div>`;
}
let tochucCoCauChartInstance = null;
function initTochucCoCauChart() {
    const canvas = document.getElementById('tochucCoCauChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (tochucCoCauChartInstance) { tochucCoCauChartInstance.destroy(); tochucCoCauChartInstance = null; }
    const cocauLabels = ['Đảng bộ cơ sở: 862', 'Chi bộ cơ sở: 3.499']; const cocauVals = [862, 3499];
    tochucCoCauChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: { labels: cocauLabels, datasets: [{ data: cocauVals, backgroundColor: ['#6f6fe0', '#2fb174'], borderColor: '#04101d', borderWidth: 2 }] },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%',
            plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10 } } } },
            onClick: (e, els) => { if (els.length) { const el = els[0]; window.__chartElClicked = true; catFillTableColumn('DANG', 'dang-to-chuc', 6, cocauVals[el.index], cocauLabels[el.index].replace(':', '=')); } },
            onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }
        },
        plugins: [donutCenterTextPlugin('4.361', 'TCCSĐ')]
    });
}
function tochucBox5Html() {
    const abroadRows = [['Công tác', 60, '#39d5ff'], ['Việc riêng', 598, '#8fe3b0']];
    const maxAbroad = Math.max(...abroadRows.map(r => r[1]));
    const abroadBars = abroadRows.map(r => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff;margin-bottom:3px"><span>${r[0]}</span><b>${fmt(r[1])}</b></div><div style="height:14px;background:#061a2f;border-radius:6px;overflow:hidden"><div style="height:100%;width:${(r[1] / maxAbroad * 100).toFixed(1)}%;background:${r[2]}"></div></div></div>`).join('');
    const policyRows = [['Nghỉ điều dưỡng', 315, '#FFEF98'], ['Thăm hỏi', 15, '#FFC61B'], ['Phúng viếng', 14, '#E87F00'], ['Lễ Tang', 15, '#CACACA']];
    const maxPolicy = Math.max(...policyRows.map(r => r[1]));
    const policyBars = policyRows.map(r => `<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff;margin-bottom:3px"><span>${r[0]}</span><b>${fmt(r[1])}</b></div><div style="height:12px;background:#061a2f;border-radius:6px;overflow:hidden"><div style="height:100%;width:${(r[1] / maxPolicy * 100).toFixed(1)}%;background:${r[2]}"></div></div></div>`).join('');
    return `<div class="cat-chart-box" style="margin-top:14px;cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-to-chuc',7)" title="Chính trị nội bộ — click để fill số liệu vào bảng">
      <div class="cdl-title" style="text-align:center;font-size:11px">Kết quả thực hiện công tác bảo vệ chính trị nội bộ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:10px">
        <div>
          <p style="font-size:10.5px;color:var(--text-muted);text-align:center;margin:0 0 8px">Số cán bộ, đảng viên đi nước ngoài</p>
          ${abroadBars}
        </div>
        <div style="text-align:center">
          <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 8px">Kết quả thẩm định chính trị nội bộ</p>
          <b style="font-size:20px;color:#fff">2.304</b><span style="font-size:10px;color:var(--text-muted)"> trường hợp</span>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;text-align:left">
            <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span>🔴 Có vấn đề về chính trị</span><b>36</b></div>
            <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span>🟢 Không có vấn đề</span><b>2.268</b></div>
          </div>
        </div>
        <div>
          <p style="font-size:10.5px;color:var(--text-muted);text-align:center;margin:0 0 8px">Thực hiện chế độ, chính sách</p>
          ${policyBars}
        </div>
      </div>
    </div>`;
}

const NOICHINH_VANBAN_DATA = [['An ninh trật tự', 1], ['Phòng chống tham nhũng lãng phí tiêu cực', 3], ['Cải cách tư pháp', 3], ['Công tác tham mưu xử lý vụ án vụ việc', 1], ['Tiếp nhận, xử lý đơn thư tiếp công dân', 1]];
function noichinhBox1Html() {
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-noi-chinh',1)" title="Văn bản tham mưu — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Số văn bản tham mưu trong  cho Thành ủy lãnh đạo chỉ đạo</div>
      <div style="position:relative;height:200px;margin-top:8px"><canvas id="noichinhVanBanChart"></canvas></div>
    </div>`;
}
let noichinhVanBanChartInstance = null;
function initNoichinhVanBanChart() {
    const canvas = document.getElementById('noichinhVanBanChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (noichinhVanBanChartInstance) { noichinhVanBanChartInstance.destroy(); noichinhVanBanChartInstance = null; }
    noichinhVanBanChartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels: NOICHINH_VANBAN_DATA.map(d => d[0]), datasets: [{ data: NOICHINH_VANBAN_DATA.map(d => d[1]), backgroundColor: '#FFE96B', borderRadius: 3, maxBarThickness: 30 }] },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { y: { beginAtZero: true, suggestedMax: Math.max(...NOICHINH_VANBAN_DATA.map(d => d[1])) + 1, ticks: { stepSize: 1, color: chartAxisColor(), font: { size: 10 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 8.5 } }, grid: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}
function noichinhBox2Html() {
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-noi-chinh',2)" title="Cháy nổ — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Vụ việc an toàn cháy nổ</div>
      <div style="position:relative;height:190px;margin-top:8px"><canvas id="noichinhChayNoChart"></canvas></div>
    </div>`;
}
let noichinhChayNoChartInstance = null;
function initNoichinhChayNoChart() {
    const canvas = document.getElementById('noichinhChayNoChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (noichinhChayNoChartInstance) { noichinhChayNoChartInstance.destroy(); noichinhChayNoChartInstance = null; }
    noichinhChayNoChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: { labels: ['Ít nghiêm trọng: 58', 'Nghiêm trọng: 1'], datasets: [{ data: [58, 1], backgroundColor: ['#6FD195', '#7086FD'], borderColor: '#04101d', borderWidth: 2 }] },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%',
            plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10 } } } }
        },
        plugins: [donutCenterTextPlugin('59', 'vụ việc')]
    });
}
const NOICHINH_KHIEUNAI_DATA = [['Khiếu nại đông người', 90, '#00D5FF'], ['Tố cáo đông người', 606, '#E80054']];
function noichinhBox3Html() {
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-noi-chinh',3)" title="Khiếu nại tố cáo — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Số lượt công dân theo khiếu nại, tố cáo đông người</div>
      <div style="position:relative;height:200px;margin-top:8px"><canvas id="noichinhKhieuNaiChart"></canvas></div>
    </div>`;
}
let noichinhKhieuNaiChartInstance = null;
function initNoichinhKhieuNaiChart() {
    const canvas = document.getElementById('noichinhKhieuNaiChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (noichinhKhieuNaiChartInstance) { noichinhKhieuNaiChartInstance.destroy(); noichinhKhieuNaiChartInstance = null; }
    noichinhKhieuNaiChartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels: NOICHINH_KHIEUNAI_DATA.map(d => d[0]), datasets: [{ data: NOICHINH_KHIEUNAI_DATA.map(d => d[1]), backgroundColor: NOICHINH_KHIEUNAI_DATA.map(d => d[2]), borderRadius: 3, maxBarThickness: 60 }] },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...NOICHINH_KHIEUNAI_DATA.map(d => d[1])) * 1.15), ticks: { color: chartAxisColor(), font: { size: 10 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 10.5 } }, grid: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}
/* ===== Giao diện riêng cho "Ban Tuyên giáo và Dân vận Thành ủy" — đúng số liệu thật từ network JSON ===== */
const TUYENGIAO_DULUAN_CATS = ['Tin bài tuyên truyền qua các kênh thông tin', 'Số báo cáo viên hiện có cấp TP/ cơ sở', 'Số CTV hiện có cấp TP/ cơ sở'];
const TUYENGIAO_DULUAN_SERIES = [
    { label: 'Tin bài tuyên truyền qua các kênh thông tin', color: '#FFC300', data: [474, 0, 0] },
    { label: 'Cấp TP', color: '#6FD195', data: [0, 324, 70] },
    { label: 'Cấp cơ sở', color: '#93C381', data: [0, 660, 882] }
];
function tuyengiaoBox1Html() {
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-tuyen-giao',2)" title="Dư luận xã hội — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:12px">Nắm bắt dư luận xã hội (Tuần 10/2026)</div>
      <div style="position:relative;height:300px;margin-top:8px"><canvas id="tuyengiaoDuLuanChart"></canvas></div>
    </div>`;
}
let tuyengiaoDuLuanChartInstance = null;
function initTuyengiaoDuLuanChart() {
    const canvas = document.getElementById('tuyengiaoDuLuanChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (tuyengiaoDuLuanChartInstance) { tuyengiaoDuLuanChartInstance.destroy(); tuyengiaoDuLuanChartInstance = null; }
    tuyengiaoDuLuanChartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels: TUYENGIAO_DULUAN_CATS, datasets: TUYENGIAO_DULUAN_SERIES.map(s => ({ label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 40 })) },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...TUYENGIAO_DULUAN_SERIES.flatMap(s => s.data)) * 1.15), ticks: { color: chartAxisColor(), font: { size: 11 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 10.5 } }, grid: { display: false } } },
            plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 11 } } } }
        }
    });
}
const TUYENGIAO_DANVAN_CATS = ['Cấp xã, phường', 'Cấp cơ sở', 'Cấp thành phố'];
const TUYENGIAO_DANVAN_BARS = [
    { label: 'Lĩnh vực kinh tế', color: '#7086FD', data: [1126, 873, 210] },
    { label: 'Lĩnh vực văn hóa - xã hội', color: '#6FD195', data: [6655, 4618, 719] },
    { label: 'Lĩnh vực an ninh quốc phòng', color: '#FD9843', data: [1103, 692, 122] },
    { label: 'Lĩnh vực xây dựng hệ thống chính trị', color: '#FFD54B', data: [1163, 948, 185] }
];
const TUYENGIAO_DANVAN_LINES = [
    { label: 'Tổng số tập thể đăng ký', color: '#eda100', data: [6335, 3790, 847] },
    { label: 'Tổng số cá nhân đăng ký', color: '#39d5ff', data: [3712, 3341, 389] }
];
function tuyengiaoBox2Html() {
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-tuyen-giao',0)" title="Dân vận khéo — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:12px">Tổng hợp việc đăng ký thực hiện mô hình dân vận khéo (Năm 2026)</div>
      <div style="position:relative;height:320px;margin-top:8px"><canvas id="tuyengiaoDanVanChart"></canvas></div>
    </div>`;
}
let tuyengiaoDanVanChartInstance = null;
function initTuyengiaoDanVanChart() {
    const canvas = document.getElementById('tuyengiaoDanVanChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (tuyengiaoDanVanChartInstance) { tuyengiaoDanVanChartInstance.destroy(); tuyengiaoDanVanChartInstance = null; }
    const barDatasets = TUYENGIAO_DANVAN_BARS.map(s => ({ type: 'bar', label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 26 }));
    const lineDatasets = TUYENGIAO_DANVAN_LINES.map(s => ({ type: 'line', label: s.label, data: s.data, borderColor: s.color, backgroundColor: s.color, pointRadius: 4, tension: .3, fill: false }));
    tuyengiaoDanVanChartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels: TUYENGIAO_DANVAN_CATS, datasets: [...barDatasets, ...lineDatasets] },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { y: { beginAtZero: true, ticks: { color: chartAxisColor(), font: { size: 10.5 }, callback: v => (v / 1000) + ' nghìn' }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 11 } }, grid: { display: false } } },
            plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 11, font: { size: 10 } } } }
        }
    });
}
/* ===== Giao diện riêng cho "VPTU · Theo dõi nhiệm vụ" — đúng số liệu thật theo từng đầu mối giao việc ===== */
const VPTU_STATUS_COLORS = { 'CHT quá hạn': '#e0218a', 'CHT sắp quá hạn': '#f39c12', 'CHT trong hạn': '#39d5ff', 'HT quá hạn': '#8b5cf6', 'HT đúng hạn': '#2fb174' };
const VPTU_DATA = [
    { title: 'Trung ương giao Thành ủy', total: 403, rows: [['CHT quá hạn', 6], ['CHT sắp quá hạn', 2], ['CHT trong hạn', 180], ['HT quá hạn', 40], ['HT đúng hạn', 175]] },
    { title: 'UBND Thành phố', total: 981, rows: [['CHT quá hạn', 88], ['CHT sắp quá hạn', 0], ['CHT trong hạn', 267], ['HT quá hạn', 78], ['HT đúng hạn', 548]] },
    { title: 'HĐND Thành phố', total: 28, rows: [['CHT quá hạn', 3], ['CHT sắp quá hạn', 0], ['CHT trong hạn', 8], ['HT quá hạn', 2], ['HT đúng hạn', 15]] },
    { title: 'Ủy ban MTTQ Việt Nam Thành phố', total: 30, rows: [['CHT quá hạn', 3], ['CHT sắp quá hạn', 0], ['CHT trong hạn', 19], ['HT quá hạn', 3], ['HT đúng hạn', 5]] }
];
function vptuBoxHtml(idx) {
    const d = VPTU_DATA[idx];
    const rows = d.rows.map(r => `<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${VPTU_STATUS_COLORS[r[0]]};margin-right:6px"></i>${esc(r[0])}</span><b>${fmt(r[1])}</b></div>`).join('');
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-vptu',0)" title="Theo dõi nhiệm vụ — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">${esc(d.title)}</div>
      <div style="position:relative;height:170px;margin-top:8px"><canvas id="vptuChart${idx}"></canvas></div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">${rows}</div>
    </div>`;
}
let vptuChartInstances = [];
function initVptuCharts() {
    vptuChartInstances.forEach(c => c && c.destroy()); vptuChartInstances = [];
    VPTU_DATA.forEach((d, idx) => {
        const canvas = document.getElementById('vptuChart' + idx); if (!canvas || typeof Chart === 'undefined') return;
        const labels = d.rows.map(r => r[0]), data = d.rows.map(r => r[1]), colors = d.rows.map(r => VPTU_STATUS_COLORS[r[0]]);
        vptuChartInstances[idx] = new Chart(canvas, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#04101d', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { display: false } } },
            plugins: [donutCenterTextPlugin(fmt(d.total), 'nhiệm vụ')]
        });
    });
}
/* ============================== API IOC — chi tiết lĩnh vực (layout giống mock) ============================== */
let __apiDonutSelectedIdx = null;
let apiDrawerChartInstances = [];

function buildApiDrawerCat(entry, adapted, datasetId) {
    const map = IocIndicatorsApi.DATASET_CARD_MAP[datasetId] || { role: 'UBND' };
    return {
        id: 'api-' + datasetId,
        role: map.role,
        name: entry.name || datasetId,
        field: map.field || '',
        types: ['API'],
        items: adapted.items.map(it => [it[0], it[1], it[2] || '', it[3] || 'API IOC']),
        __apiItems: adapted.items,
        __datasetId: datasetId,
    };
}

function apiCategoryDetailHead(entry, adapted) {
    return null
}

function renderApiCatDonut(datasetId, cat) {
    const items = cat.items || []; if (!items.length) return '';
    //console.log("TUNDDDDDD apiChartBoxClick renderApiCatDonut", datasetId, items, cat)
    const total = items.reduce((s, it) => s + (Number(it[1]) || 0), 0); if (!total) return '';
    let arcs = '', a = -Math.PI / 2;
    items.forEach((it, i) => {
        const cnt = Number(it[1]) || 0; if (!cnt) return;
        const sw = (cnt / total) * 2 * Math.PI;
        const nameChart = it[0]
        arcs += '<path class="cat-donut-seg" data-idx="' + i + '" onclick="apiDonutSegmentClick(\'' + nameChart + '\',' + i + ')" d="' + donutArc(100, 100, 68, (a * 180 / Math.PI) + 90, ((a + sw - 0.014) * 180 / Math.PI) + 90) + '" fill="none" stroke="' + CDL_PAL[i % CDL_PAL.length] + '" stroke-width="26" stroke-linecap="butt"/>';
        a += sw;
    });
    const cname = cat.name.length > 13 ? cat.name.slice(0, 12) + '…' : cat.name;
    const legend = items.map((it, i) => {
        const itemName = window.__allItems.find(e => e.id === it[0] || e._id === it[0])
        const nm = itemName && itemName.name || it[0], cnt = Number(it[1]) || 0, sh = nm.length > 33 ? nm.slice(0, 32) + '…' : nm;
        return '<div class="cdl-item" onclick="apiDonutSegmentClick(\'' + nm + '\',' + i + ')"><span class="cdl-dot" style="background:' + CDL_PAL[i % CDL_PAL.length] + '"></span><span class="cdl-name">' + esc(sh) + '</span><span class="cdl-cnt">' + fmtCompact(cnt) + '</span></div>';
    }).join('');
    return '<div class="cat-donut-wrap">'
        + '<div class="cat-donut-svg"><svg viewBox="0 0 200 200" width="156" height="156" xmlns="http://www.w3.org/2000/svg">'
        + '<circle cx="100" cy="100" r="68" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="26"/>'
        + arcs
        + '<circle cx="100" cy="100" r="35" fill="transparent" cursor="pointer" onclick="apiDonutClearSelection()" class="cat-donut-center"/>'
        + '<text x="100" y="94" text-anchor="middle" font-size="26" font-weight="700" fill="#e8f4ff">' + fmtCompact(total) + '</text>'
        + '<text x="100" y="113" text-anchor="middle" font-size="11" fill="#7aaed4">' + esc(cname) + '</text>'
        + '<text x="100" y="127" text-anchor="middle" font-size="10" fill="#4a7ea8">bản ghi · click để xem</text>'
        + '</svg></div>'
        + '<div class="cat-donut-legend"><div class="cdl-title">Phân bổ theo chỉ tiêu con — click để xem danh sách API</div>' + legend + '</div>'
        + '<button class="ghost" style="margin-top:6px;font-size:10.5px;padding:4px 10px" onclick="apiDonutClearSelection()">Bỏ chọn</button>'
        + '</div>';
}

function apiDonutSegmentClick(datasetId, idx) {
    //console.log("apiDonutSegmentClick", datasetId, idx)
    //console.log('col-active', { datasetId, idx })

    if (actionChart == datasetId) actionChart = null
    else actionChart = datasetId
    renderFilterTable(datasetId)

    iapiDonutSegmentClick = true
    const ctx = window.__apiDrawerCtx; if (!ctx || ctx.datasetId !== datasetId) return;
    const it = ctx.adapted.items[idx]; if (!it) return;
    if (__apiDonutSelectedIdx === idx) { apiDonutClearSelection(); return; }
    __apiDonutSelectedIdx = idx;
    const name = it[0], val = Number(it[1]) || 0, url = it[5];
    document.querySelectorAll('.cat-donut-seg').forEach(el => el.classList.remove('cat-donut-seg-active'));
    document.querySelectorAll(`.cat-donut-seg[data-idx="${idx}"]`).forEach(el => el.classList.add('cat-donut-seg-active'));
    // document.querySelectorAll('.cdl-item').forEach((el, i) => el.classList.toggle('cdl-item-active', i === idx));
    const tbody = document.querySelector('.gen-unit-box table tbody');
    if (tbody) {
        // const rows = tbody.querySelectorAll('tr');
        // HN_UNIT_NAMES.forEach((_, ui) => {
        //     const cells = rows[ui]?.querySelectorAll('td');
        //     if (cells && cells[idx + 1]) cells[idx + 1].textContent = '0';
        // });
    }
    const thead = document.querySelector('.gen-unit-box table thead tr');
    if (thead) {
        // thead.querySelectorAll('th').forEach(t => t.classList.remove('col-active'));
        // const ths = thead.querySelectorAll('th');
        // if (ths[idx + 1]) ths[idx + 1].classList.add('col-active');
    }
    //console.log('cardInfo renderFilterTable', cardInfo)
    const title = document.querySelector('.gen-unit-box .cdl-title');
    if (title) title.textContent = `Danh sách:${actionChart ? ' · Đã chọn: ' + actionChart : ` ${cardInfo.titleDashboard || ""}`}`;
    const note = document.querySelector('.gen-unit-box > p');
    if (note) note.innerHTML = 'Đã chọn "<b>' + esc(name) + '</b>" (' + fmt(val) + ' bản ghi API). <button type="button" class="ghost" style="margin-left:6px;padding:2px 8px;font-size:11px" onclick=\'openApiDetailList(' + JSON.stringify(url) + ',' + JSON.stringify(name) + ')\'>Mở danh sách →</button>';
}

function apiDonutClearSelection() {
    //console.log('apiDonutClearSelectionxxxxxxxx')
    __apiDonutSelectedIdx = null;
    document.querySelectorAll('.cat-donut-seg').forEach(el => el.classList.remove('cat-donut-seg-active'));
    document.querySelectorAll('.cdl-item').forEach(el => el.classList.remove('cdl-item-active'));
    const tbody = document.querySelector('.gen-unit-box table tbody');
    if (tbody) {
        // tbody.querySelectorAll('tr').forEach(r => {
        //     r.querySelectorAll('td').forEach((td, ci) => { if (ci > 0) td.textContent = '0'; });
        // });
    }
    const thead = document.querySelector('.gen-unit-box table thead tr');
    if (thead) thead.querySelectorAll('th').forEach(t => t.classList.remove('col-active'));
    //console.log('cardInfo renderFilterTable', cardInfo)
    const title = document.querySelector('.gen-unit-box .cdl-title');
    if (title) title.textContent = 'Danh sách';
    const note = document.querySelector('.gen-unit-box > p');
    if (note) note.innerHTML = 'Chưa có số liệu theo từng đơn vị từ API — click chỉ tiêu hoặc donut để mở danh sách bản ghi.';
}

function genApiUnitTableHtml(cat) {
    return genUnitTableHtml(cat).replace(
        'Lĩnh vực này chưa có số liệu thật theo từng đơn vị — tạm hiển thị 0, chờ cập nhật dữ liệu.',
        'Chưa có số liệu theo từng đơn vị từ API — click chỉ tiêu hoặc donut để mở danh sách bản ghi.'
    );
}

function convertToChartConfig(data, options) {
    const {
        labelKey,
        groupKey,
        valueKey,
        datasetConfigs = {},
        colors = ['#7086FD', '#6FD195', '#FD9843', '#FF6B6B', '#A66CFF', '#FFB347']
    } = options;

    // 1. Lấy danh sách nhãn duy nhất theo thứ tự xuất hiện
    const labels = [];
    const labelSet = new Set();
    data.forEach(item => {
        const label = item[labelKey];
        if (!labelSet.has(label)) {
            labelSet.add(label);
            labels.push(label);
        }
    });

    // 2. Lấy danh sách nhóm duy nhất
    const groups = [];
    const groupSet = new Set();
    data.forEach(item => {
        const group = item[groupKey];
        if (!groupSet.has(group)) {
            groupSet.add(group);
            groups.push(group);
        }
    });

    // 3. Tạo dataset cho mỗi nhóm
    const datasets = groups.map((group, index) => {
        // Lấy cấu hình riêng cho nhóm (nếu có)
        const config = datasetConfigs[group] || {};
        const color = config.color || colors[index % colors.length];
        const type = config.type || 'bar'; // mặc định bar

        // Lấy giá trị tương ứng với từng nhãn
        const groupData = labels.map(label => {
            const found = data.find(item => item[labelKey] === label && item[groupKey] === group);
            return found ? found[valueKey] : 0;
        });

        // Tạo dataset cơ bản
        const dataset = {
            type: type,
            label: group,
            data: groupData,
            backgroundColor: color,
            borderColor: color,
            borderRadius: 3,
            maxBarThickness: 40,
            yAxisID: config.yAxisID || 'y',
            order: config.order || 2,
            pointRadius: type === 'line' ? 4 : undefined,
            tension: type === 'line' ? 0.3 : undefined,
            fill: type === 'line' ? false : undefined,
        };

        // Loại bỏ các thuộc tính không cần thiết cho line
        if (type === 'line') {
            delete dataset.backgroundColor;
            delete dataset.borderRadius;
            delete dataset.maxBarThickness;
        }

        return dataset;
    });

    return { labels, datasets };
}

// function apiCatItemCardHtml(datasetId, idx, it) {
//     //console.log("apiCatItemCardHtml", idx, it)
//     const color = chartColors
//     const name = it[0], val = Number(it[1]) || 0, freq = it[2] || '', url = it[5];
//     // const name = it.titleChart, val = it.dataChart.reduce((sum, item) => sum + Number(item.value || 0), 0), freq = "", url = null;
//     const list = CAT_ST.map(s => ({ l: s.l, c: s.c, n: val > 0 ? Math.max(1, Math.round(val / CAT_ST.length)) : 0 })).filter(s => s.n > 0);
//     const list2 = it[4] && it[4].length > 0 ? it[4][0].items : []
//     //console.log('xcccccc')
//     // const list2 = RenderItemsDashborad(it)
//     // //console.log('list2', list2)
//     // const finalList=list.length?list:[{l:'Giá trị',c:'#2c7dd2',n:val||1}];
//     const finalList = list2.map((e, i) => ({ l: e.label, c: color[i], n: e.value }))
//     const chartId = chartCanvasId();
//     //console.log("0000000000000-00000000000000000-", finalList.map(s => s.l), finalList.map(s => s.n), finalList.map(s => s.c))
//     // queueDimChart(chartId, 'bar', finalList.map(s => s.l), finalList.map(s => s.n), finalList.map(s => s.c));

//     const clickAttr = `onclick="event.stopPropagation();apiDonutSegmentClick('${name}',${idx})"`;
//     return `<button type="button" class="cat-item-row" onclick='openApiDetailList(${JSON.stringify(url)},${JSON.stringify(name)})'>
//       <div class="field-category-meta"><span class="badge ok">API</span></div>
//       <h4>${esc(name)}</h4>
//       <div class="cat-item-chart-trigger" style="cursor:pointer" ${clickAttr} title="Click biểu đồ để chọn cột bảng đơn vị">
//         <div style="position:relative;height:210px;margin-top:8px"><canvas id="${chartId}"></canvas></div>
//         <div class="row" style="margin-top:8px"><span class="muted">Giá trị API </span><b class="metric mono">${fmt(val)}</b></div>
//       </div>
//     </button>`;
// }

function apiChartBoxHtml(title, rows, labelKey, valueKey, canvasId, datasetId, boxIndex) {
    const mapped = (rows || []).map(r => [r[labelKey], Number(r[valueKey]) || 0]);
    const total = mapped.reduce((s, r) => s + (r[1] || 0), 0);
    const legend = mapped.map(r => `<div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--text)"><span>${esc(r[0])}</span><b>${fmt(r[1])}</b></div>`).join('');
    return `<div class="cat-chart-box" style="cursor:pointer" onclick="apiChartBoxClick('${datasetId}',${boxIndex})" title="Click để xem danh sách API">
      <div class="cdl-title" style="text-align:center;font-size:11px">${esc(title)}</div>
      <div style="position:relative;height:170px;margin-top:8px"><canvas id="${canvasId}"></canvas></div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">${legend}</div>
    </div>`;
}

function apiChartBoxClick(datasetId, boxIndex) {
    //console.log('TUNDDDDDD apiChartBoxClick', { datasetId, boxIndex })
    icatChartBox = true;
    const boxes = window.__apiDrawerChartBoxes || [];
    const box = boxes[boxIndex];
    if (!box) return;

    const url = (box.rows[0] && box.rows[0]._detail_url) || '';
    const title = box.title || '';

    if (url && url !== '' && url !== null) {
        openApiDetailList(url, title);
    } else if (box.itemIdx != null) {
        apiDonutSegmentClick(datasetId, box.itemIdx);
    } else {
        toast('Không có URL chi tiết cho mục này.');
    }
}

function renderApiCatChartsPanel(datasetId, dash) {
    if (!dash) return '';
    const boxes = [];
    let chartIdx = 0;
    function pushBox(title, rows, lk, vk, itemIdx) {
        if (!rows || !rows.length) return;
        boxes.push({ title, rows, lk, vk, canvasId: 'apiDrawerChart' + (chartIdx++), itemIdx, boxIndex: boxes.length });
    }
    if (datasetId === 'hdnd') {
        pushBox('Hoạt động HĐND', dash.bieu_do_hoat_dong_hdnd, 'hoat_dong', 'so_luong', 0);
        pushBox('Trạng thái giám sát', dash.bieu_do_trang_thai_giam_sat, 'trang_thai', 'so_cuoc', 1);
    } else if (datasetId === 'y-te') {
        if (dash.dich_benh_nhom_ab) {
            const db = dash.dich_benh_nhom_ab;
            pushBox('Dịch bệnh nhóm A,B', [{ label: 'Nhiễm', v: db.so_nguoi_nhiem, _detail_url: db._detail_url }, { label: 'Tử vong', v: db.so_nguoi_tu_vong, _detail_url: db._detail_url }], 'label', 'v', 0);
        }
        if (dash.bao_tro_xa_hoi) pushBox('Bảo trợ xã hội', dash.bao_tro_xa_hoi, 'chi_tieu', 'gia_tri', 1);
    } else if (datasetId === 'noi-vu') {
        if (dash.bien_che && dash.bien_che.bieu_do_cot) pushBox('Biên chế', dash.bien_che.bieu_do_cot, 'nhom', 'gia_tri', 0);
        if (dash.bien_dong_nhan_su) pushBox('Biến động nhân sự', dash.bien_dong_nhan_su, 'loai_bien_dong', 'so_nguoi', 1);
    } else if (datasetId === 'hanh-chinh-cong') {
        if (dash.bieu_do_tron_trang_thai) pushBox('Trạng thái hồ sơ', dash.bieu_do_tron_trang_thai, 'trang_thai', 'so_luong', 0);
        if (dash.bieu_do_cot_kenh_tiep_nhan) pushBox('Kênh tiếp nhận', dash.bieu_do_cot_kenh_tiep_nhan, 'kenh', 'so_luong', 1);
    }
    if (!boxes.length) return '';
    boxes.forEach((b, i) => { b.boxIndex = i; });
    window.__apiDrawerChartBoxes = boxes;
    return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${boxes.map(b => apiChartBoxHtml(b.title, b.rows, b.lk, b.vk, b.canvasId, datasetId, b.boxIndex)).join('')}</div>`;
}

function initApiDrawerCharts(datasetId, dash) {
    apiDrawerChartInstances.forEach(c => c && c.destroy()); apiDrawerChartInstances = [];
    var ChartLib = chartGlobal(); if (!ChartLib) return;
    const boxes = window.__apiDrawerChartBoxes || [];
    const pal = ['#2fb174', '#2c7dd2', '#39d5ff', '#d8a50c', '#d25a19', '#8b5cf6', '#ef4444', '#f59e0b'];
    boxes.forEach(b => {
        const canvas = document.getElementById(b.canvasId); if (!canvas) return;
        const labels = b.rows.map(r => r[b.lk]), data = b.rows.map(r => Number(r[b.vk]) || 0);
        const total = data.reduce((s, v) => s + v, 0) || 1;
        const inst = new ChartLib(canvas, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: labels.map((_, i) => pal[i % pal.length]), borderColor: '#04101d', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { display: false } } },
            plugins: [donutCenterTextPlugin(fmtCompact(total), 'chỉ tiêu')]
        });
        apiDrawerChartInstances.push(inst);
    });
}

function renderFilterTable(value) {
    //console.log('renderFilter', value)
    const data = window.__iocTableDetail?.data || []
    // console.log('renderFilterTable', data)
    // const newdata = data.filter((a) => Object.keys(a).some(i => a[i] === value))
    data.forEach(a => {
        const element = document.getElementById('table_' + a.id)
        element.style.display = !actionChart ? '' : Object.keys(a).some(i => a[i] === value) ? '' : 'none';
    })
    //console.log('cardInfo renderFilterTable', cardInfo)
    const title = document.querySelector('.gen-unit-box .cdl-title');
    if (title) title.textContent = `Danh sách:${actionChart ? ' · Đã chọn: ' + actionChart : ` ${cardInfo.titleDashboard || ""}`}`;

}

function openApiDetailList(url, title, sub) {
    //console.log('TUNDDDDDD genUnitTableHtml', url, title, sub)
    if (actionChart == title) actionChart = null
    else actionChart = title
    // if (typeof IocIndicatorsApi === 'undefined') {
    //     toast('Module API chưa tải.');
    //     return;
    // }

    // if (!url || url === null || url === '') {
    //     toast('Không có URL chi tiết cho lĩnh vực này.');
    //     return;
    // }

    // document.getElementById('drawerTitle-ct').textContent = title || 'Danh sách';
    // document.getElementById('drawerSub').textContent = sub || 'Đang tải…';
    // document.getElementById('drawerBodyCT').innerHTML = '<div class="access-lock">Đang tải dữ liệu API…</div>';
    renderFilterTable(title)
    // openDrawer();

    // IocIndicatorsApi.iocFetch(url).then(function (res) {
    //     // //console.log('openApiDetailList', res)
    //     window.__apiListRows = (res.data || []).map(function (rec) {
    //         return IocIndicatorsApi.mapListRecord(rec, res.dataset || '');
    //     });
    //     // document.getElementById('drawerSub').textContent = 'Tổng: ' + fmt(res.total || window.__apiListRows.length) + ' · Trang ' + fmt(res.page || 1);
    //     // document.getElementById('drawerBodyCT').innerHTML = renderApiListTable(window.__apiListRows);
    // }).catch(function (err) {
    //     document.getElementById('drawerBodyCT').innerHTML = '<div class="access-lock">Lỗi: ' + esc(err.message || err) + '</div>';
    //     toast('Không tải được danh sách API.');
    // });
}

function renderApiListTable(rows) {
    if (!rows.length) return '<div class="access-lock">Không có bản ghi.</div>';
    return `<div class="record-update-note"><b>Dữ liệu API</b> · Click dòng để mở modal chi tiết (cấp 2).</div>
      <div class="filters"><input id="qApiList" placeholder="Tìm chỉ tiêu, chủ đề…" oninput="filterApiListRows()"/></div>
      <div class="list-summary" id="apiListSummary"><span class="badge gold">Hiển thị: ${fmt(rows.length)}</span></div>
      <div id="apiRecordList">${rows.map((r, i) => apiListRowHtml(r, i)).join('')}</div>`;
}
function apiListRowHtml(r, idx) {
    const rec = r.raw || {};
    const val = rec.gia_tri_so != null ? fmt(rec.gia_tri_so) : (rec.gia_tri_raw || '—');
    const unit = rec.don_vi_tinh ? ' ' + rec.don_vi_tinh : '';
    const q = [r.id, r.title, r.meta, rec.chu_de_nhom, rec.doi_tuong_thong_ke, rec.ten_chi_tieu].join(' ').toLowerCase();
    return `<button class="record-row" type="button" onclick="openApiRecordModal(${idx})" data-q="${esc(q)}">
      <div><b class="mono">#${esc(rec.id || idx + 1)}</b><small>${esc(rec.ky_bao_cao || r.meta || '')}</small></div>
      <div class="wrap"><div class="title">${esc(r.title)}</div><small>${esc(rec.chu_de_nhom || rec.linh_vuc || '')}</small></div>
      <div><span class="status-pill" style="background:rgba(47,177,116,.15);color:#98f0bf;border:1px solid rgba(47,177,116,.4)">${esc(rec.phan_loai_ket_qua || 'Chỉ tiêu')}</span></div>
      <div><small>Giá trị</small><b class="mono">${esc(String(val) + unit)}</b></div>
      <div><small>Nguồn</small><b>${esc(rec.source_sheet || rec.source_file || 'API IOC')}</b></div>
    </button>`;
}
function filterApiListRows() {
    const q = (document.getElementById('qApiList')?.value || '').toLowerCase();
    let visible = 0;
    document.querySelectorAll('#apiRecordList .record-row').forEach(el => {
        const show = !q || el.dataset.q.includes(q);
        el.style.display = show ? '' : 'none';
        if (show) visible++;
    });
    const sum = document.getElementById('apiListSummary');
    if (sum) sum.innerHTML = `<span class="badge gold">Hiển thị: ${fmt(visible)}</span>`;
}
var API_FIELD_LABELS = {
    id: 'Mã bản ghi', stt: 'STT', ten_chi_tieu: 'Tên chỉ tiêu', chi_tieu: 'Chỉ tiêu', chu_de_nhom: 'Chủ đề / nhóm',
    doi_tuong_thong_ke: 'Đối tượng thống kê', nhom_chi_tieu: 'Nhóm chỉ tiêu', linh_vuc: 'Lĩnh vực', ky_bao_cao: 'Kỳ báo cáo',
    nam: 'Năm', thang: '', quy: 'Quý', sau_thang: 'Sáu ', phan_loai_ket_qua: 'Phân loại kết quả',
    gia_tri_so: 'Giá trị số', gia_tri_raw: 'Giá trị', don_vi_tinh: 'Đơn vị tính', toan_tu: 'Toán tử', ghi_chu: 'Ghi chú',
    nguoi_nhap: 'Người nhập', ngay_cap_nhat: 'Ngày cập nhật', source_file: 'File nguồn', source_sheet: 'Sheet nguồn',
    source_row: 'Dòng nguồn', loaded_at: 'Thời gian tải API', tieu_chi_tieu: 'Tiêu chí tiêu',
};
var API_RECORD_PRIMARY_KEYS = ['id', 'ten_chi_tieu', 'chi_tieu', 'chu_de_nhom', 'doi_tuong_thong_ke', 'nhom_chi_tieu', 'linh_vuc', 'ky_bao_cao', 'nam', 'thang', 'quy', 'phan_loai_ket_qua', 'gia_tri_so', 'gia_tri_raw', 'don_vi_tinh', 'ghi_chu'];
function apiDatasetLabel(datasetId) {
    return { 'hdnd': 'HĐND', 'y-te': 'Y tế', 'noi-vu': 'Nội vụ', 'hanh-chinh-cong': 'Hành chính công' }[datasetId] || datasetId || 'API IOC';
}
function formatApiFieldValue(key, val, rec) {
    if (val == null || val === '') return null;
    if (key === 'loaded_at' || key === 'ngay_cap_nhat') {
        try { const d = new Date(val); if (!isNaN(d)) return d.toLocaleString('vi-VN'); } catch (e) { }
    }
    if (key === 'gia_tri_so' && rec.don_vi_tinh) return fmt(val) + ' ' + rec.don_vi_tinh;
    return String(val);
}
function renderApiRecordModalBody(row) {
    const rec = row.raw || {};
    const dsLabel = apiDatasetLabel(row.datasetId);
    const val = rec.gia_tri_so != null ? fmt(rec.gia_tri_so) : (rec.gia_tri_raw != null ? rec.gia_tri_raw : '—');
    const unit = rec.don_vi_tinh && !String(val).includes(rec.don_vi_tinh) ? ' ' + rec.don_vi_tinh : '';
    const backHtml = `<div class="iip-modal-back"><button class="ghost" onclick="closeModal()">← Quay lại danh sách</button></div>`;
    const loadedNote = rec.loaded_at ? ` · Cập nhật <b>${esc(formatApiFieldValue('loaded_at', rec.loaded_at, rec) || rec.loaded_at)}</b>` : '';
    const note = `<div class="record-update-note">Nguồn dữ liệu: <b>API IOC</b> · Lĩnh vực <b>${esc(dsLabel)}</b>${loadedNote}.</div>`;
    const primaryKv = API_RECORD_PRIMARY_KEYS.filter(k => rec[k] != null && rec[k] !== '').map(k => {
        if (k === 'gia_tri_raw' && rec.gia_tri_so != null) return '';
        const v = formatApiFieldValue(k, rec[k], rec);
        return v == null ? '' : `<b>${esc(API_FIELD_LABELS[k] || k.replace(/_/g, ' '))}</b><span>${esc(v)}</span>`;
    }).filter(Boolean).join('');
    const valueBlock = (rec.gia_tri_so == null && rec.gia_tri_raw == null) ? '' : `<b>Giá trị hiển thị</b><span><b class="mono">${esc(val + unit)}</b></span>`;
    const extraKeys = Object.keys(rec).filter(k => !API_RECORD_PRIMARY_KEYS.includes(k) && rec[k] != null && rec[k] !== '' && !k.endsWith('_detail_url'));
    const extraKv = extraKeys.map(k => {
        const v = formatApiFieldValue(k, rec[k], rec);
        return v == null ? '' : `<b>${esc(API_FIELD_LABELS[k] || k.replace(/_/g, ' '))}</b><span>${esc(v)}</span>`;
    }).join('');
    const stColor = '#2fb174';
    const phanLoai = rec.phan_loai_ket_qua || 'Chỉ tiêu';
    return backHtml + note +
        `<div class="detail-grid"><div class="detail-card"><h4>Thông tin chỉ tiêu · ${esc(dsLabel)}</h4><div class="kv">${valueBlock}${primaryKv}</div></div>` +
        `<div class="detail-card"><h4>Theo dõi &amp; thao tác</h4><p><span class="status-pill" style="background:${stColor}22;color:#98f0bf;border:1px solid ${stColor}66">${esc(phanLoai)}</span></p>` +
        `${rec.ghi_chu ? `<p class="wrap">${esc(rec.ghi_chu)}</p>` : '<p class="muted">Dữ liệu đồng bộ từ API IOC — chỉ hiển thị, không chỉnh sửa trực tiếp tại dashboard.</p>'}` +
        `<div class="action-bar"><button class="ghost" onclick="closeModal()">Đóng</button><button class="ghost" onclick="toast('Đã ghi nhận yêu cầu cập nhật chỉ tiêu #${rec.id || ''}')">Yêu cầu cập nhật dữ liệu</button></div></div></div>` +
        (extraKv ? `<div class="detail-card"><h4>Thông tin bổ sung</h4><div class="kv">${extraKv}</div></div>` : '');
}
function openApiRecordModal(idx) {
    const r = window.__apiListRows[idx]; if (!r) return;
    const rec = r.raw || {};
    document.getElementById('modalTitle').textContent = `Cấp 2 · #${rec.id || r.title}`;
    document.getElementById('modalSub').textContent = `Chỉ tiêu · ${apiDatasetLabel(r.datasetId)} · ${r.meta || r.title}`;
    document.getElementById('modalBody').innerHTML = renderApiRecordModalBody(r);
    openModal();
}


// function getLoadDashboardsCategoryDetail(url) {
//     IocIndicatorsApi.loadDashboardsCategoryDetail(url).then(function (res) {
//         const data = res.data
//     }).catch(function (err) {
//     });
// }

function renderStatsGridHtml(statsArray = []) {
    if (!statsArray || !statsArray.length) return '';
    const boxes = statsArray.map(item => `
        <div class="cat-chart-box" style="padding:10px 12px">
            <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 4px">${item.label || ''}</p>
            <p style="font-size:17px;font-weight:800;color:#fff;margin:0">${item.value || 0}</p>
        </div>
    `).join('');

    return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:14px">
            ${boxes}
        </div>
    `;
}

async function openApiCategoryDetail(datasetId) {
    if (datasetId === 'chart_vu_co_so_dang' || datasetId === 'vu_co_so_dang_dang_vien') {
        if (typeof window.openVuCoSoDangPopup === 'function') {
            window.openVuCoSoDangPopup();
            return;
        }
    }
    const statsData = [
        { label: "Số trường", value: "2.963" },
        { label: "Học sinh", value: "1.918.158" },
        { label: "Giáo viên", value: "144.292" },
        { label: "Nhân sự", value: "186.401" },
        { label: "Số lớp", value: "50.523" },
        { label: "Phòng học", value: "41.332" },
        { label: "Chuẩn QG", value: "63,04%" },
        { label: "Trường CQG", value: "1.868" }
    ];
    //console.log('datasetId', datasetId, roleInfoApi, window.__iocDashboards)
    //console.log('TUND___openApiCategoryDetail', datasetId, window.__iocDashboards)
    // const entry = IocIndicatorsApi.getDatasetEntry(datasetId);
    // const entry = Object.values(infoCards).find(e => e.id === datasetId || e._id === datasetId);
    cardInfo = window.__iocDashboards.find(e => e._id === datasetId)
    //console.log('cardInfo', cardInfo)
    // if (!entry) {
    //     toast('Chưa có dữ liệu API cho lĩnh vực này.');
    //     return;
    // }
    // const entryItems = _itemsKey[entry._id]
    // //console.log('TUND___openApiCategoryDetail entry', datasetId, entry, entryItems)
    const infoCard = window.__iocDashboards?.find(e => e._id === datasetId);
    if (!infoCard) {
        toast('Chưa có dữ liệu API cho lĩnh vực này.');
        return;
    }
    //console.log('infoCard', infoCard)
    try {
        // Gọi API chi tiết
        // //console.log("entry", entry)
        let detailData = null, tableData = null;

        if (infoCard._board_api) {
            const detailResponse = await IocIndicatorsApi.loadDashboardsCategoryDetail(infoCard._board_api);

            detailData = detailResponse.data; // Lấy phần data
        }

        // const detailResponse = {
        //     "request_id": "req_f0ea7d3c34a5419483a21a958aa86f40",
        //     "source": "postgres_ioc",
        //     "dataset": "ioc.so.giao_duc.bieu_do.v1",
        //     "administrative_unit": {
        //         "code": "so_nganh",
        //         "name": "Sở Giáo dục và Đào tạo"
        //     },
        //     "reporting_period": {
        //         "year": 2025
        //     },
        //     "data": [
        //         {
        //             "_id": "giao_duc",
        //             "charts": [
        //                 {
        //                     "titleChart": "Số cơ sở giáo dục theo bậc học",
        //                     "dataChart": [
        //                         {
        //                             "_id": "mam_non",
        //                             "label": "Mầm non",
        //                             "value": "1"
        //                         },
        //                         {
        //                             "_id": "tieu_hoc",
        //                             "label": "Tiểu học",
        //                             "value": "2"
        //                         },
        //                         {
        //                             "_id": "thcs",
        //                             "label": "THCS",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "thpt",
        //                             "label": "THPT",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "gdtx",
        //                             "label": "GDTX",
        //                             "value": "0"
        //                         }
        //                     ],
        //                     "uint": "trường",
        //                     "typeChart": "bar_horizontal"
        //                 },
        //                 {
        //                     "titleChart": "Cơ cấu cơ sở",
        //                     "dataChart": [
        //                         {
        //                             "_id": "mam_non",
        //                             "label": "Mầm non",
        //                             "value": "0",
        //                             "groups": [
        //                                 {
        //                                     "label": "Công lập",
        //                                     "value": "0"
        //                                 },
        //                                 {
        //                                     "label": "Ngoài công lập",
        //                                     "value": "0"
        //                                 }
        //                             ]
        //                         },
        //                         {
        //                             "_id": "tieu_hoc",
        //                             "label": "Tiểu học",
        //                             "value": "0",
        //                             "groups": [
        //                                 {
        //                                     "label": "Công lập",
        //                                     "value": "0"
        //                                 },
        //                                 {
        //                                     "label": "Ngoài công lập",
        //                                     "value": "0"
        //                                 }
        //                             ]
        //                         },
        //                         {
        //                             "_id": "thcs",
        //                             "label": "THCS",
        //                             "value": "0",
        //                             "groups": [
        //                                 {
        //                                     "label": "Công lập",
        //                                     "value": "0"
        //                                 },
        //                                 {
        //                                     "label": "Ngoài công lập",
        //                                     "value": "0"
        //                                 }
        //                             ]
        //                         },
        //                         {
        //                             "_id": "thpt",
        //                             "label": "THPT",
        //                             "value": "0",
        //                             "groups": [
        //                                 {
        //                                     "label": "Công lập",
        //                                     "value": "0"
        //                                 },
        //                                 {
        //                                     "label": "Ngoài công lập",
        //                                     "value": "0"
        //                                 }
        //                             ]
        //                         },
        //                         {
        //                             "_id": "gdtx",
        //                             "label": "GDTX",
        //                             "value": "0",
        //                             "groups": [
        //                                 {
        //                                     "label": "Công lập",
        //                                     "value": "0"
        //                                 },
        //                                 {
        //                                     "label": "Ngoài công lập",
        //                                     "value": "0"
        //                                 }
        //                             ]
        //                         }
        //                     ],
        //                     "uint": "trường",
        //                     "typeChart": "bar"
        //                 },
        //                 {
        //                     "titleChart": "Số học sinh/học viên theo bậc học",
        //                     "dataChart": [
        //                         {
        //                             "_id": "mam_non",
        //                             "label": "Mầm non",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "tieu_hoc",
        //                             "label": "Tiểu học",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "thcs",
        //                             "label": "THCS",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "thpt",
        //                             "label": "THPT",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "gdtx",
        //                             "label": "GDTX",
        //                             "value": "0"
        //                         }
        //                     ],
        //                     "uint": "học sinh",
        //                     "typeChart": "bar_horizontal"
        //                 },
        //                 {
        //                     "titleChart": "Phân bố học sinh theo giới tính",
        //                     "dataChart": [
        //                         {
        //                             "_id": "nam",
        //                             "label": "Nam",
        //                             "value": "1"
        //                         },
        //                         {
        //                             "_id": "nu",
        //                             "label": "Nữ",
        //                             "value": "0"
        //                         }
        //                     ],
        //                     "uint": "học sinh",
        //                     "typeChart": "donut"
        //                 },
        //                 {
        //                     "titleChart": "Phân bố học sinh theo dân tộc",
        //                     "dataChart": [
        //                         {
        //                             "_id": "kinh",
        //                             "label": "Kinh",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "dan_toc_thieu_so",
        //                             "label": "Dân tộc thiểu số",
        //                             "value": "0"
        //                         }
        //                     ],
        //                     "uint": "học sinh",
        //                     "typeChart": "donut"
        //                 },
        //                 {
        //                     "titleChart": "Giáo viên/CBQL theo bậc học",
        //                     "dataChart": [
        //                         {
        //                             "_id": "mam_non",
        //                             "label": "Mầm non",
        //                             "value": "1"
        //                         },
        //                         {
        //                             "_id": "tieu_hoc",
        //                             "label": "Tiểu học",
        //                             "value": "2"
        //                         },
        //                         {
        //                             "_id": "thcs",
        //                             "label": "THCS",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "thpt",
        //                             "label": "THPT",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "gdtx",
        //                             "label": "GDTX",
        //                             "value": "0"
        //                         }
        //                     ],
        //                     "uint": "người",
        //                     "typeChart": "bar_horizontal"
        //                 },
        //                 {
        //                     "titleChart": "Phân bố giáo viên",
        //                     "dataChart": [
        //                         {
        //                             "_id": "nam",
        //                             "label": "Nam",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "nu",
        //                             "label": "Nữ",
        //                             "value": "0"
        //                         }
        //                     ],
        //                     "uint": "người",
        //                     "typeChart": "donut"
        //                 },
        //                 {
        //                     "titleChart": "Học sinh bình quân/giáo viên",
        //                     "dataChart": [
        //                         {
        //                             "_id": "mam_non",
        //                             "label": "Mầm non",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "tieu_hoc",
        //                             "label": "Tiểu học",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "thcs",
        //                             "label": "THCS",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "thpt",
        //                             "label": "THPT",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "gdtx",
        //                             "label": "GDTX",
        //                             "value": "0"
        //                         }
        //                     ],
        //                     "uint": "HS/GV",
        //                     "typeChart": "bar_horizontal"
        //                 },
        //                 {
        //                     "titleChart": "Cơ sở giáo dục nghề nghiệp",
        //                     "dataChart": [
        //                         {
        //                             "_id": "cong_lap",
        //                             "label": "Công lập",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "ngoai_cong_lap",
        //                             "label": "Ngoài công lập",
        //                             "value": "0"
        //                         }
        //                     ],
        //                     "uint": "cơ sở",
        //                     "typeChart": "bar"
        //                 },
        //                 {
        //                     "titleChart": "Học viên giáo dục nghề nghiệp",
        //                     "dataChart": [
        //                         {
        //                             "_id": "tuyen_moi",
        //                             "label": "Tuyển mới",
        //                             "value": "0"
        //                         },
        //                         {
        //                             "_id": "tot_nghiep",
        //                             "label": "Tốt nghiệp",
        //                             "value": "0"
        //                         }
        //                     ],
        //                     "uint": "học viên",
        //                     "typeChart": "bar_horizontal"
        //                 }
        //             ],
        //             "titleDashboard": "Giáo dục và Đào tạo",
        //             "description": "Biểu đồ chi tiết Giáo dục và Đào tạo",
        //             "_board_api": "/api/v1/ioc/so/giao_duc/bieu_do",
        //             "_row_table_api": "/api/v1/ioc/so/giao_duc/du_lieu",
        //             "_parent_id": "ubnd"
        //         }
        //     ]
        // }

        // detailData = detailResponse.data;



        if (infoCard._row_table_api) {
            const tableResponse = await IocIndicatorsApi.loadTableDetail(infoCard._row_table_api);
            tableData = tableResponse.data; // Lấy phần data
            tableTitle = tableResponse.columns; // Lấy phần data
        }

        // const tableResponse = {
        //     "request_id": "req_5b8ccea9f352426c9f4036ccfad71ea3",
        //     "source": "postgres_ioc",
        //     "dataset": "ioc.so.giao_duc.du_lieu.v1",
        //     "administrative_unit": {
        //         "code": "so_nganh",
        //         "name": "Sở Giáo dục và Đào tạo"
        //     },
        //     "block_code": "giao_duc",
        //     "parent_code": null,
        //     "page": 1,
        //     "page_size": 50,
        //     "total": 20,
        //     "columns": [
        //         {
        //             "key": "nam_hoc",
        //             "name": "Năm học"
        //         },
        //         {
        //             "key": "cap_hoc",
        //             "name": "Cấp học"
        //         },
        //         {
        //             "key": "nhom_thong_ke",
        //             "name": "Nhóm thống kê"
        //         },
        //         {
        //             "key": "chi_tieu",
        //             "name": "Chỉ tiêu"
        //         },
        //         {
        //             "key": "phan_loai_1",
        //             "name": "Phân loại 1"
        //         },
        //         {
        //             "key": "phan_loai_2",
        //             "name": "Phân loại 2"
        //         },
        //         {
        //             "key": "gia_tri_so",
        //             "name": "Giá trị"
        //         },
        //         {
        //             "key": "don_vi_tinh",
        //             "name": "Đơn vị tính"
        //         }
        //     ],
        //     "data": [
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "thcs",
        //             "nhom_thong_ke": "hocsinh",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "134.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "thcs",
        //             "nhom_thong_ke": "lop",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "178.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "thcs",
        //             "nhom_thong_ke": "nhansu",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "249.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "thcs",
        //             "nhom_thong_ke": "truong",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "365.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "gdtx",
        //             "nhom_thong_ke": "hocsinh",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "268.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "gdtx",
        //             "nhom_thong_ke": "lop",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "180.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "gdtx",
        //             "nhom_thong_ke": "nhansu",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "527.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "gdtx",
        //             "nhom_thong_ke": "truong",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "393.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "mamnon",
        //             "nhom_thong_ke": "hocsinh",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "314.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "mamnon",
        //             "nhom_thong_ke": "lop",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "428.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "mamnon",
        //             "nhom_thong_ke": "nhansu",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "150.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "mamnon",
        //             "nhom_thong_ke": "truong",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "425.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "tieuhoc",
        //             "nhom_thong_ke": "hocsinh",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "320.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "tieuhoc",
        //             "nhom_thong_ke": "lop",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "309.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "tieuhoc",
        //             "nhom_thong_ke": "nhansu",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "110.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "tieuhoc",
        //             "nhom_thong_ke": "truong",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "532.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "thpt",
        //             "nhom_thong_ke": "hocsinh",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "385.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "thpt",
        //             "nhom_thong_ke": "lop",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "426.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "thpt",
        //             "nhom_thong_ke": "nhansu",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "221.0000",
        //             "don_vi_tinh": "nguoi"
        //         },
        //         {
        //             "nam_hoc": "2024-2025",
        //             "cap_hoc": "thpt",
        //             "nhom_thong_ke": "truong",
        //             "chi_tieu": "Tổng số",
        //             "phan_loai_1": null,
        //             "phan_loai_2": null,
        //             "gia_tri_so": "330.0000",
        //             "don_vi_tinh": "nguoi"
        //         }
        //     ]
        // }

        // tableData = tableResponse.data; // Lấy phần data
        // tableTitle = tableResponse.columns; // Lấy phần data
        // window.__iocTableDetail = tableResponse;

        // console.log("TUND___openApiCategoryDetail items", { tableData, tableTitle })

        const resolvedId = infoCard._id || datasetId;
        // Tạo adapted từ entry gốc (chỉ để lấy metadata)
        const adapted = IocIndicatorsApi.adaptDashboard(resolvedId, infoCard);
        //console.log("TUND___openApiCategoryDetail adapted", adapted)
        // Ghi đè items bằng dữ liệu thực tế
        // adapted.items = items;

        const cat = buildApiDrawerCat(infoCard, adapted, resolvedId);
        // console.log('cat', cat)

        // Lưu context để các hàm khác sử dụng
        window.__apiDrawerCtx = { datasetId: resolvedId, infoCard, adapted, cat };
        __apiDonutSelectedIdx = null;

        // Cập nhật tiêu đề
        document.getElementById('drawerTitle-ct').textContent = `Lĩnh vực: ${infoCard.titleDashboard}`;
        // document.getElementById('drawerSub').textContent = `${items.length} chỉ tiêu · ${fmt(adapted.totalRecords)} bản ghi · Nguồn API IOC`;

        // Render nội dung
        const head = apiCategoryDetailHead(infoCard, adapted);
        const donutHtml = renderApiCatDonut(resolvedId, cat);
        const statsHtml = (window.TYPE === 'so') ? renderStatsGridHtml(statsData) : '';
        // const chartsPanel = renderApiCatChartsPanel(resolvedId, infoCard.dashboard);
        //console.log('detailData', detailData)
        const toolbarHtml = catChartsSearchToolbarHtml();
        const cardsHtml = `<div class="cat-item-list grid-3">${detailData.map((itemDetail) => {
            return (itemDetail.charts || []).map((it, idx) => apiCatItemCardHtml(resolvedId, idx, it)).join('')
        }).join('')}</div>`;
        const fullContent = `<div class="cat-charts-full-grid">${statsHtml}${toolbarHtml}<div class="cat-charts-wrapper">${cardsHtml}</div></div>`;

        document.getElementById('drawerBodyCT').innerHTML = donutHtml + fullContent;

        openDrawer();

        runDrawerCharts(function () {
            initApiDrawerCharts(resolvedId, infoCard.dashboard);
            flushPendingDimCharts();
            syncGenUnitBoxHeight();
        });

    } catch (err) {
        toast('Lỗi tải dữ liệu chi tiết: ' + err.message);
        console.error('openApiCategoryDetail error:', err);
    }
}
/**
 * Trích xuất items từ dữ liệu chi tiết của dashboard (dạng { key: [ {...} ] })
 * Mỗi key (trừ tong_so_ban_ghi) trở thành một item, value là tổng các 'tong'
 * @param {Object} detailData - Dữ liệu từ API chi tiết (data field)
 * @returns {Array} - Mảng items [label, value, freq, source, parts, url]
 */
function extractItemsFromDetailData(detailData, datasetId) {
    let items = [];
    let name = datasetId
    if (datasetId === 'y-te') items = [
        ['Số lượng người được trợ cấp xã hội', 0, '', '', [P('', detailData.bao_tro_xa_hoi.doi_tuong.map(x => ([x.chi_tieu, x.gia_tri])))]],
        renderOneItemsDashborad(detailData.dich_benh_nhom_a_b.tinh_hinh_dich, "Tình hình dịch bệnh", "S"),
        renderOneItemsDashborad(detailData.ngo_doc_thuc_pham.muc_do_thiet_hai, "Tình hình ngộ độc", "S"),
    ]
    else {
        const Dashboard = Object.keys(detailData).filter(u => typeof detailData[u] === "object" && u !== 'tong_quan_ho_so_tthc')
        Dashboard.forEach(b => {
            const _eChildDash = detailData[b]
            const _typeChildDash = typeof _eChildDash
            if (_typeChildDash === "object") {
                let _iChild = []
                if (Array.isArray(_eChildDash)) {
                    _iChild = getDashboardArray(_eChildDash, b, { name: '' })
                } else {
                    const ac = Object.keys(_eChildDash).filter(u => typeof _eChildDash[u] === "object")
                    if (ac.length === 0) {
                        _iChild = getDashboardObj(_eChildDash, b);
                    }
                }
                items = [...items, ..._iChild]
            }
        })
    }
    //console.log("extractItemsFromDetailData", { detailData, datasetId, items })

    if (!detailData || typeof detailData !== 'object') return items;

    return items;
}

function refreshIocApi() {
    //console.log('refreshIocApi')
    if (typeof IocIndicatorsApi === 'undefined') { toast('Module iocApi.js chưa tải.'); return; }
    iocApiLoading = true; iocApiError = null; renderIndicators();
    IocIndicatorsApi.loadDashboardsList().then(function () {
        iocApiLoading = false; iocApiError = null;
        renderIndicators();
        toast('Đã cập nhật dữ liệu API.');
    }).catch(function (err) {
        iocApiLoading = false; iocApiError = err.message || String(err);
        renderIndicators();
        toast('Lỗi API: ' + iocApiError);
    });
}
function loadIocApiAndRender() {
    if (typeof IocIndicatorsApi === 'undefined') return;

    var defaultTabId = new URLSearchParams(window.location.search).get('defaultTab') === 'van_phong_ban'
        ? 'van_phong_ban'
        : 'tat_ca';

    iocApiLoading = true;
    renderIndicators();

    return Promise.all([
        IocIndicatorsApi.loadDashboardsListFilter(defaultTabId),
        IocIndicatorsApi.loadDashboardsTab() // Hoặc loadDashboardTab nếu bạn đã đổi tên ánh xạ
    ])
        .then(function (results) {
            // results[0] là kết quả trả về của loadDashboardsList
            // results[1] là kết quả trả về của loadDashboardsTab
            var listData = results[0];
            var tabData = results[1];

            // Debug log để bạn dễ dàng kiểm tra dữ liệu trả về từ 2 API
            //console.log("Dữ liệu List:", listData);
            //console.log("Dữ liệu Tab:", tabData);

            // Lưu hoặc xử lý dữ liệu từ tabData vào một biến toàn cục nếu cần thiết, ví dụ:
            if (tabData) {
                window.__iocTabs = tabData.data || tabData;
            }

            iocApiLoading = false;
            iocApiError = null;
            activeApiTabId = defaultTabId;
            activeApiTab = defaultTabId;
            activeApiTabChild = null;

            renderIndicators();

            // Đếm số lượng lĩnh vực tải được để thông báo
            var totalFields = 0;
            if (window.__iocDashboards && window.__iocDashboards.data) {
                totalFields = Object.keys(window.__iocDashboards.data).length;
            } else if (window.__iocDashboards) {
                totalFields = Object.keys(window.__iocDashboards).length;
            }

            if (typeof toast === 'function') {
                toast('Đã tải dữ liệu API thành công (' + totalFields + ' lĩnh vực).');
            }
        })
        .catch(function (err) {
            iocApiLoading = false;
            iocApiError = err.message || String(err);

            renderIndicators();
            console.warn('[indicators] API load failed:', err);

            if (typeof toast === 'function') {
                toast('Lỗi tải dữ liệu: ' + iocApiError);
            }
        });
}

function openCategoryDetail(role, catId) {
    //console.log('openCategoryDetail', role, catId)
    // if (!canSeeRole(role)) { toast('Không có quyền xem lĩnh vực này.'); return }
    const cat = (categorySeed[role] || []).find(c => c.id === catId);
    //console.log('openCategoryDetail', cat, categorySeed)
    if (!cat) return;

    cat.role = role;
    const total = catTotal(cat);
    document.getElementById('drawerTitle-ct').textContent = `Lĩnh vực: ${cat.name}`;
    // document.getElementById('drawerSub').textContent = `${cat.items.length} chỉ tiêu · ${fmt(total)} bản ghi`;
    const head = `<div class="category-detail-head"><div><div class="field-category-meta"><span class="badge gold">${fmt(total)} bản ghi</span><span class="badge">${cat.items.length} chỉ tiêu</span>${cat.types.map(t => `<span class="badge">${t}</span>`).join('')}</div></div><button class="primary" onclick="openFieldScenarioSelector('cat::${role}::${catId}')">⚡ Chọn kịch bản xử lý</button></div>`;
    let cardsHtml;
    if (catId === 'dang-ubkt') {
        cardsHtml = `<div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${ubktBox1Html()}${ubktBox2Html()}${ubktBox3Html()}${ubktBox4Html()}</div>
        ${ubktChartBoxHtml()}
      </div>`;
    } else if (catId === 'dang-to-chuc') {
        cardsHtml = `<div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${tochucBox1Html()}${tochucBox2Html()}${tochucBox3Html()}${tochucBox4Html()}</div>
        ${tochucBox5Html()}
      </div>`;
    } else if (catId === 'dang-noi-chinh') {
        cardsHtml = `<div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${noichinhBox1Html()}${noichinhBox2Html()}</div>
        <div style="margin-top:14px">${noichinhBox3Html()}</div>
      </div>`;
    } else if (catId === 'dang-tuyen-giao') {
        cardsHtml = `<div>
        <div style="display:grid;gap:14px">${tuyengiaoBox1Html()}${tuyengiaoBox2Html()}</div>
      </div>`;
    } else if (catId === 'dang-vptu') {
        cardsHtml = `<div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${vptuBoxHtml(0)}${vptuBoxHtml(1)}${vptuBoxHtml(2)}${vptuBoxHtml(3)}</div>
      </div>`;
    } else {
        cardsHtml = `<div class="cat-item-list grid-3">${cat.items.map((it, idx) => catItemCardHtml(role, catId, idx, it)).join('')}</div>`;
    }
    const donutHtml = renderCatDonut(cat);
    const toolbarHtml = catChartsSearchToolbarHtml();
    const fullContent = `<div class="cat-charts-full-grid">${toolbarHtml}<div class="cat-charts-wrapper">${cardsHtml}</div></div>`;
    document.getElementById('drawerBodyCT').innerHTML = head + donutHtml + fullContent + fieldScenarioSummary(`cat::${role}::${catId}`);
    openDrawer();
    runDrawerCharts(function () {
        flushPendingDimCharts();
        syncGenUnitBoxHeight();
        if (catId === 'dang-ubkt') initUbktDoanChart();
        if (catId === 'dang-to-chuc') { initTochucBienCheChart(); initTochucDanhGiaChart(); initTochucBienDongChart(); initTochucCoCauChart(); }
        if (catId === 'dang-noi-chinh') { initNoichinhVanBanChart(); initNoichinhChayNoChart(); initNoichinhKhieuNaiChart(); }
        if (catId === 'dang-tuyen-giao') { initTuyengiaoDuLuanChart(); initTuyengiaoDanVanChart(); }
        if (catId === 'dang-vptu') initVptuCharts();
    });
}

/* Lớp 3a: chi tiết 1 chỉ tiêu con — KPI + Chart.js doughnut trạng thái + bảng bản ghi có tìm kiếm */
let itemStatusChartInstance = null;
function initItemStatusChart(cnts) {
    const canvas = document.getElementById('itemStatusCanvas'); if (!canvas || typeof Chart === 'undefined') return;
    if (itemStatusChartInstance) { itemStatusChartInstance.destroy(); itemStatusChartInstance = null; }
    const entries = CAT_ST.filter(s => cnts[s.k]);
    itemStatusChartInstance = new Chart(canvas, { type: 'doughnut', data: { labels: entries.map(s => s.l), datasets: [{ data: entries.map(s => cnts[s.k]), backgroundColor: entries.map(s => s.c) }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 10, font: { size: 10 } } } } } });
}
/* Biểu đồ cột fake (port phong cách dashboard Giáo dục) cho trang chi tiết chỉ tiêu con dùng chung mọi sở */
let catItemTrendChartInstance = null, catItemUnitChartInstance = null;
function catItemFakeSeed(name) { return [...String(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0); }
function catItemExtraChartsHtml(seed) {
    return `<div class="cat-charts-row" style="grid-template-columns:1fr 1fr">
      <div class="cat-chart-box"><div class="cdl-title">Xu hướng cập nhật theo thời gian</div><div class="cat-chart-canvas-wrap"><canvas id="catItemTrendCanvas"></canvas></div></div>
      <div class="cat-chart-box"><div class="cdl-title">Phân bổ theo đơn vị phụ trách</div><div class="cat-chart-canvas-wrap"><canvas id="catItemUnitCanvas"></canvas></div></div>
    </div>`;
}
function initCatItemExtraCharts(seed) {
    if (typeof Chart === 'undefined') return;
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
    const trendData = months.map((_, i) => 20 + ((seed + i * 17) % 80));
    const trendCanvas = document.getElementById('catItemTrendCanvas');
    if (trendCanvas) {
        if (catItemTrendChartInstance) { catItemTrendChartInstance.destroy(); catItemTrendChartInstance = null; }
        catItemTrendChartInstance = new Chart(trendCanvas, { type: 'bar', data: { labels: months, datasets: [{ data: trendData, backgroundColor: '#2a78d6', borderRadius: 4, maxBarThickness: 32 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: chartAxisColor(), font: { size: 10 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 10 } }, grid: { display: false } } } } });
    }
    const unitNames = [0, 3, 6, 9].map(o => units[(seed + o) % units.length]);
    const unitData = unitNames.map((_, i) => 10 + ((seed + i * 23) % 60));
    const unitCanvas = document.getElementById('catItemUnitCanvas');
    if (unitCanvas) {
        if (catItemUnitChartInstance) { catItemUnitChartInstance.destroy(); catItemUnitChartInstance = null; }
        catItemUnitChartInstance = new Chart(unitCanvas, { type: 'bar', data: { labels: unitNames, datasets: [{ data: unitData, backgroundColor: '#1baf7a', borderRadius: 4, maxBarThickness: 28 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: chartAxisColor(), font: { size: 10 } }, grid: { color: chartGridColor() } }, y: { ticks: { color: chartLabelColor(), font: { size: 10 } }, grid: { display: false } } } } });
    }
}
function itemRecordsTableHtml(recs) {
    return `<div class="iip-search-row"><input class="iip-search" placeholder="Tìm mã, tiêu đề, hạn..." oninput="filterItemRecords(this)"/><span class="iip-rec-count">${fmt(recs.length)} bản ghi</span></div><div class="iip-table-wrap"><table class="iip-table"><thead><tr><th>Mã</th><th>Tiêu đề</th><th>Trạng thái</th><th>Hạn</th><th>Tiến độ</th></tr></thead><tbody>${iipRowsHtml(recs)}</tbody></table></div>`;
}
function filterItemRecords(input) {
    const wrap = input.closest('.cat-chart-box'); if (!wrap) return;
    const role = wrap.dataset.role, name = decodeURIComponent(wrap.dataset.nameEnc || '');
    const q = input.value.trim().toLowerCase();
    let recs = indicatorRecordsFor(role, name);
    if (q) recs = recs.filter(r => ((r.id || '') + ' ' + (r.title || '') + ' ' + (r.due || '')).toLowerCase().includes(q));
    const tbody = wrap.querySelector('tbody'); if (tbody) tbody.innerHTML = iipRowsHtml(recs);
    const cnt = wrap.querySelector('.iip-rec-count'); if (cnt) cnt.textContent = fmt(recs.length) + (q ? ' kết quả' : ' bản ghi');
}
/* ===== Hiển thị phân tổ (breakdown) theo chỉ tiêu — dùng chung cho mọi nơi (card lưới, card lĩnh vực, drawer chi tiết) =====
   Quy tắc chọn biểu đồ:
   1) Phân tổ dạng % (nhãn có "%") → radial ring.
   2) Phân tổ dạng bar ≤3 mục và không mục nào quá nhỏ → thanh % xếp chồng (nhãn nổi).
   3) Phân tổ dạng bar 4+ mục, hoặc có mục < 8% tổng → thanh ngang xếp hạng (không xếp chồng).
   4) Phân tổ dạng stat khác (không phải %) → thẻ KPI rời. */
const PART_PAL = ['#2a78d6', '#1baf7a', '#eda100', '#4a3aa7', '#39d5ff', '#d33a44', '#898781'];
function isPercentLabel(l) { return /%/.test(l || ''); }
function radialRingSvg(pct, size, strokeW, color) {
    pct = Math.max(0, Math.min(100, Number(pct) || 0));
    const r = (size - strokeW) / 2, c = size / 2, circ = 2 * Math.PI * r, dash = circ * pct / 100;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="${strokeW}"/><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 ${c} ${c})"/><text x="${c}" y="${(c + size * 0.07).toFixed(1)}" text-anchor="middle" font-size="${(size * 0.24).toFixed(0)}" font-weight="900" fill="#fff">${Math.round(pct)}%</text></svg>`;
}
function shouldRankBar(items) {
    const total = items.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
    const minShare = Math.min(...items.map(x => (Number(x.value) || 0) / total));
    return items.length >= 4 || minShare < 0.08;
}
function rankedBarHtml(items) {
    const max = Math.max(...items.map(x => Number(x.value) || 0)) || 1;
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const rows = sorted.map((x, i) => `<div class="rank-row"><div class="rank-row-top"><span class="rank-label">${esc(x.label)}</span><b class="rank-value">${fmt(x.value)}</b></div><div class="rank-track"><div class="rank-fill" style="width:${(x.value / max * 100).toFixed(1)}%;background:${PART_PAL[i % PART_PAL.length]}"></div></div></div>`).join('');
    return `<div class="rank-list">${rows}</div>`;
}
function stackedBarHtml(items) {
    const tot = items.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
    let cum = 0;
    const segs = items.map((x, i) => `<div class="seg" style="width:${(x.value / tot * 100).toFixed(1)}%;background:${PART_PAL[i % PART_PAL.length]}" title="${esc(x.label)}: ${fmt(x.value)}"></div>`).join('');
    const labels = items.map((x, i) => { const w = x.value / tot * 100, center = cum + w / 2; cum += w; return `<div style="position:absolute;top:-24px;left:${center.toFixed(2)}%;transform:translateX(-50%);background:${PART_PAL[i % PART_PAL.length]};color:#fff;font-weight:900;font-size:12px;padding:2px 6px;border-radius:5px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.35)">${fmt(x.value)}</div>`; }).join('');
    const legend = `<div class="legend" style="margin-top:8px;font-size:10.5px">${items.map((x, i) => `<span><i class="sw" style="background:${PART_PAL[i % PART_PAL.length]}"></i>${esc(x.label)} <b>${fmt(x.value)}</b></span>`).join('')}</div>`;
    return `<div class="bar" style="height:22px;position:relative;margin-top:24px;overflow:visible">${segs}${labels}</div>${legend}`;
}
function barDimBodyHtml(p) { return shouldRankBar(p.items) ? rankedBarHtml(p.items) : stackedBarHtml(p.items); }
/* Biểu đồ Chart.js thật (donut/bar ngang) cho phân tổ chỉ tiêu — dùng chung cho mọi lĩnh vực, cùng phong cách với dashboard Giáo dục */
function queueDimChart(id, type, labels, data, colors) { (window.__pendingDimCharts = window.__pendingDimCharts || []).push({ id, type, labels, data, colors }); }

function chartDimBodyHtml(p) {
    const items = p.items; const id = chartCanvasId();
    const isDonut = !shouldRankBar(items);
    const colors = items.map((x, i) => PART_PAL[i % PART_PAL.length]);
    queueDimChart(id, isDonut ? 'doughnut' : 'bar', items.map(x => x.label), items.map(x => Number(x.value) || 0), colors);
    const h = isDonut ? 200 : Math.max(120, items.length * 34 + 20);
    return `<div style="position:relative;height:${h}px;margin-top:4px"><canvas id="${id}"></canvas></div>`;
}
function statDimBodyHtml(p) {
    const pctItems = p.items.filter(x => isPercentLabel(x.label));
    const plainItems = p.items.filter(x => !isPercentLabel(x.label));
    let html = '';
    if (pctItems.length) html += `<div class="phanto-radial-row">${pctItems.map((x, i) => `<div class="phanto-radial-item">${radialRingSvg(x.value, 64, 7, PART_PAL[i % PART_PAL.length])}<span>${esc(x.label.replace(/\s*\(%\)\s*$/, ''))}</span></div>`).join('')}</div>`;
    if (plainItems.length) html += `<div class="cir-stat-grid">${plainItems.map(x => `<div class="cir-stat-tile"><p>${esc(x.label)}</p><b>${fmt(x.value)}</b></div>`).join('')}</div>`;
    return html;
}
function phanToDimBodyHtml(p) { return p.type === 'stat' ? statDimBodyHtml(p) : chartDimBodyHtml(p); }
function catItemPartsHtml(parts) {
    if (!parts || !parts.length) return '';
    return `<div class="cat-parts-wrap">${parts.map(p => `<div class="cat-chart-box"><div class="cdl-title">${esc(p.dim)}</div>${phanToDimBodyHtml(p)}</div>`).join('')}</div>`;
}
function openCategoryItemDetail(role, catId, idx) {
    toast('Tạm thời chưa hỗ trợ xem chi tiết chỉ tiêu con.'); return;
    const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat) return;
    const it = cat.items[idx]; if (!it) return;
    const name = it[0], declared = Number(it[1]) || 0, freq = it[2], source = it[3], parts = it[4] || [];
    const recs = indicatorRecordsFor(role, name);
    const cnts = {}; CAT_ST.forEach(s => cnts[s.k] = recs.filter(r => r.status === s.k).length);
    document.getElementById('drawerTitle-ct').textContent = `Chỉ tiêu: ${name}`;

    const partsHtml = parts.length ? `<p style="font-size:12px;color:var(--text-secondary);margin:14px 0 8px">Phân tổ theo chỉ tiêu</p>${catItemPartsHtml(parts)}` : '';
    const backBtn = `<button class="category-view-back" onclick="${role === 'UBND' ? 'openSoDashboard' : 'openCategoryDetail'}('${role}','${catId}')">← Quay lại ${cat.name}</button>`;
    const seed = catItemFakeSeed(name);
    document.getElementById('drawerBodyCT').innerHTML = backBtn + partsHtml + catItemExtraChartsHtml(seed) + fieldScenarioSummary(`item::${role}::${catId}::${idx}`);
    openDrawer();
    runDrawerCharts(function () {
        initCatItemExtraCharts(seed);
        flushPendingDimCharts();
    });
}

/* Lớp 3b: bảng tra cứu chỉ tiêu con theo đơn vị phụ trách (toàn màn hình popup) */

/* Panel inline (accordion) hiện nhanh danh sách bản ghi của 1 chỉ tiêu, có thể lọc theo trạng thái */
function iipRowsHtml(rs) {
    if (!rs.length) return '<tr><td colspan="5" class="iip-empty">Không có bản ghi phù hợp</td></tr>';
    return rs.map(r => {
        const si = catStatusInfo(r.status), p = Number(r.progress) || 0;
        return `<tr style="cursor:pointer" onclick="iipOpenRecord('${r.id}')"><td class="iip-td-id">${r.id}</td><td style="color:#cde4f8">${r.title || r.indicator || ''}</td><td style="white-space:nowrap"><span style="font-size:10px;padding:2px 7px;border-radius:999px;background:${si.c}22;color:${si.c};border:1px solid ${si.c}44">${si.l}</span></td><td style="white-space:nowrap;color:#7aaed4;font-size:10px">${r.due || '--'}</td><td style="white-space:nowrap"><div class="iip-pct-bar"><div class="iip-pct-fill" style="width:${p}%"></div></div>${p}%</td></tr>`;
    }).join('');
}
function iipOpenRecord(id) {
    openIndicatorDetail(id);
    setTimeout(() => {
        const body = document.getElementById('modalBody');
        if (body && !body.querySelector('.iip-modal-back')) body.insertAdjacentHTML('afterbegin', '<div class="iip-modal-back"><button class="ghost" onclick="closeModal()">← Quay lại lĩnh vực</button></div>');
    }, 60);
}
function buildCatPanel(role, enc, statusKey) {
    const name = decodeURIComponent(enc);
    const all = indicatorRecordsFor(role, name);
    const rs = statusKey ? all.filter(r => r.status === statusKey) : all;
    const cnts = {}; CAT_ST.forEach(s => { cnts[s.k] = all.filter(r => r.status === s.k).length; });
    const st = statusKey ? catStatusInfo(statusKey) : null;
    const panel = document.createElement('div');
    panel.className = 'iip-wrap';
    panel.dataset.catEnc = enc; panel.dataset.catRole = role; panel.dataset.catStatus = statusKey || '';
    panel.innerHTML =
        `<div class="iip-head"><div class="iip-head-left"><span class="iip-head-title">${name}</span><span class="badge gold mono" style="font-size:10px">${fmt(all.length)} bản ghi</span>${st ? `<span class="badge" style="background:${st.c}22;color:${st.c};border:1px solid ${st.c}55">${st.l}</span>` : ''}</div><button class="iip-close-btn" onclick="this.closest('.iip-wrap').remove()">✕ Đóng</button></div>` +
        `<div class="iip-chips"><button class="iip-chip ${statusKey === '' ? 'iip-chip-active' : ''}" data-sk="" onclick="catPanelFilter(this,'${role}','${enc}','')"><span class="iip-chip-lbl">Tất cả</span><span class="iip-chip-cnt">${fmt(all.length)}</span></button>${CAT_ST.map(s => cnts[s.k] ? `<button class="iip-chip ${statusKey === s.k ? 'iip-chip-active' : ''}" data-sk="${s.k}" onclick="catPanelFilter(this,'${role}','${enc}','${s.k}')"><span class="iip-chip-dot" style="background:${s.c}"></span><span class="iip-chip-lbl">${s.l}</span><span class="iip-chip-cnt">${fmt(cnts[s.k])}</span></button>` : '').join('')}</div>` +
        `<div class="iip-search-row"><input class="iip-search" placeholder="Tìm mã, tiêu đề, hạn..." oninput="catIipSearch(this)"/><span class="iip-rec-count">${fmt(rs.length)} bản ghi</span></div>` +
        `<div class="iip-table-wrap"><table class="iip-table"><thead><tr><th>Mã</th><th>Tiêu đề</th><th>Trạng thái</th><th>Hạn</th><th>Tiến độ</th></tr></thead><tbody>${iipRowsHtml(rs)}</tbody></table></div>` +
        `<div style="padding:10px 0 2px;text-align:center"><button class="ghost" style="font-size:11px;padding:5px 14px" onclick="iipOpenAll(this)">Xem tất cả trong popup đầy đủ →</button></div>`;
    panel.dataset.iipCatRole = role; panel.dataset.iipEnc = enc;
    return panel;
}
function updateCatPanel(panel, role, enc, statusKey) {
    const name = decodeURIComponent(enc);
    const all = indicatorRecordsFor(role, name);
    const rs = statusKey ? all.filter(r => r.status === statusKey) : all;
    panel.dataset.catStatus = statusKey || '';
    panel.querySelectorAll('.iip-chip').forEach(b => b.classList.toggle('iip-chip-active', b.dataset.sk === statusKey));
    const badge = panel.querySelector('.badge:not(.gold)');
    if (statusKey) { const st = catStatusInfo(statusKey); const html = `<span class="badge" style="background:${st.c}22;color:${st.c};border:1px solid ${st.c}55">${st.l}</span>`; if (badge) badge.outerHTML = html; else panel.querySelector('.iip-head-left').insertAdjacentHTML('beforeend', html); }
    else if (badge) badge.remove();
    const tbody = panel.querySelector('tbody'); if (tbody) tbody.innerHTML = iipRowsHtml(rs);
    const cnt = panel.querySelector('.iip-rec-count'); if (cnt) cnt.textContent = fmt(rs.length) + ' bản ghi';
}
function catSegClick(btn, role, enc, statusKey) {
    const row = btn.closest('.cat-axis-row'); const grid = row ? row.parentElement : null; if (!grid) return;
    const existing = grid.querySelector(`.iip-wrap[data-cat-enc="${enc}"]`);
    if (existing) {
        if (existing.dataset.catStatus === statusKey) { existing.remove(); return; }
        updateCatPanel(existing, role, enc, statusKey);
        setTimeout(() => existing.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 40);
        return;
    }
    grid.querySelectorAll('.iip-wrap').forEach(el => el.remove());
    const panel = buildCatPanel(role, enc, statusKey);
    row.after(panel);
    setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}
function catPanelFilter(btn, role, enc, statusKey) { const panel = btn.closest('.iip-wrap'); if (panel) updateCatPanel(panel, role, enc, statusKey); }
function catIipSearch(input) {
    const panel = input.closest('.iip-wrap'); if (!panel) return;
    const role = panel.dataset.catRole, enc = panel.dataset.catEnc, statusKey = panel.dataset.catStatus || '';
    const name = decodeURIComponent(enc);
    const q = input.value.trim().toLowerCase();
    const all = indicatorRecordsFor(role, name);
    let rs = statusKey ? all.filter(r => r.status === statusKey) : all;
    if (q) rs = rs.filter(r => ((r.id || '') + ' ' + (r.title || '') + ' ' + (r.due || '')).toLowerCase().includes(q));
    const tbody = panel.querySelector('tbody'); if (tbody) tbody.innerHTML = iipRowsHtml(rs);
    const el = panel.querySelector('.iip-rec-count'); if (el) el.textContent = fmt(rs.length) + (q ? ' kết quả' : ' bản ghi');
}
function iipOpenAll(btn) {
    const panel = btn.closest('.iip-wrap'); if (!panel) return;
    const role = panel.dataset.iipCatRole || panel.dataset.catRole;
    const catId = panel.closest('.cat-axis-grid')?.dataset.catId;
    const enc = panel.dataset.iipEnc;
    window.__lastCat = { role, catId };
    openIndicatorByName(role, enc);
    setTimeout(() => {
        const body = document.getElementById('drawerBodyCT');
        if (body && !body.querySelector('.iip-back-in-drawer')) body.insertAdjacentHTML('afterbegin', `<div class="iip-back-in-drawer" style="margin-bottom:10px"><button class="ghost" style="font-size:11.5px;padding:6px 14px" onclick="(function(){const c=window.__lastCat;if(c)openCategoryDetail(c.role,c.catId);})()">← Quay lại lĩnh vực</button></div>`);
    }, 80);
}

/* Drawer đầy đủ 1 chỉ tiêu (donut + bảng có filter) */
function openIndicatorByName(role, encodedName) {
    const name = decodeURIComponent(encodedName);
    let idx = indicators[role].findIndex(x => x[0] === name);
    if (idx < 0) { addIndicatorFromCategory(role, [name, 10, '', 'Excel']); idx = indicators[role].length - 1; }
    openIndicator(role, idx);
}
function openIndicator(role, idx) {
    if (!canSeeRole(role)) { toast('Không có quyền xem chỉ tiêu này.'); return }
    const item = indicators[role][idx]; const [name, count] = item;
    if (isScheduleIndicator(name)) { openCalendar(role, name); return; }
    const rs = indicatorRecordsFor(role, name).map(r => ({ ...r, metric: 'indicator' }));
    currentDrawerRecords = rs;
    activeIndicatorPieStatus = '';
    document.getElementById('drawerTitle-ct').textContent = `Chỉ tiêu: ${name}`;
    // document.getElementById('drawerSub').textContent = `${fmt(count)} bản ghi · ${axisMeta[role].name}`;
    renderIndicatorList(currentDrawerRecords);
    openDrawer();
}
function indicatorCounts(rs = currentDrawerRecords) {
    return statusDefs.map(st => ({ key: st.key, label: st.label, short: st.short, color: st.color, count: rs.filter(r => r.status === st.key).length }));
}
function renderIndicatorList(rs) {
    const counts = indicatorCounts(rs); const total = rs.length || 1;
    document.getElementById('drawerBodyCT').innerHTML = `<div class="drawer-pie-layout"><div class="drawer-pie-box"><div id="indicatorDonut"></div><button class="ghost" style="margin-top:8px" onclick="setIndicatorStatusFilter('')">Xem tất cả trạng thái</button></div><div class="drawer-pie-side"><h4 style="margin:0">Phân bổ kết quả xử lý theo trạng thái</h4><div class="pie-legend" id="indicatorPieLegend"></div></div></div><div class="filters"><input id="qInd" placeholder="Tìm chỉ tiêu/bản ghi..." oninput="renderIndicatorRows()"/><select id="stInd" onchange="activeIndicatorPieStatus=this.value;renderIndicatorRows()"><option value="">Tất cả trạng thái</option>${statusDefs.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}</select><select id="unitInd" onchange="renderIndicatorRows()"><option value="">Tất cả đơn vị</option>${[...new Set(rs.map(r => r.unit))].map(u => `<option>${u}</option>`).join('')}</select><button class="ghost" onclick="openAssignmentForm()">Giao xử lý từ chỉ tiêu</button></div><div class="list-summary" id="indSummary"></div><div id="indRows"></div>`;
    document.getElementById('indicatorDonut').innerHTML = overviewSvg(counts.map(c => ({ key: c.key, label: c.short, value: c.count, color: c.color })), total, fmt(activeIndicatorPieStatus ? counts.find(c => c.key === activeIndicatorPieStatus)?.count || 0 : total), activeIndicatorPieStatus ? statusMeta(activeIndicatorPieStatus).short : 'Tổng bản ghi', 'indicatorPie');
    document.getElementById('indicatorPieLegend').innerHTML = counts.map(c => `<button class="${activeIndicatorPieStatus === c.key ? 'active' : ''}" onclick="setIndicatorStatusFilter('${c.key}')"><i class="sw" style="background:${c.color}"></i><span>${c.short}</span><b>${fmt(c.count)}</b></button>`).join('');
    renderIndicatorRows();
}
function setIndicatorStatusFilter(status) {
    activeIndicatorPieStatus = status || '';
    const sel = document.getElementById('stInd'); if (sel) sel.value = activeIndicatorPieStatus;
    renderIndicatorList(currentDrawerRecords);
}
function indicatorRowHtml(r) {
    const st = statusMeta(r.status); const progress = Number(r.progress || 0);
    return `<button class="indicator-row" onclick="openIndicatorDetail('${r.id}')">
      <div class="indicator-id"><b>${r.id}</b><small>Chỉ tiêu</small></div>
      <div class="indicator-title"><div class="title">${r.title}</div><small>${axisMeta[r.role]?.icon || ''} ${axisMeta[r.role]?.name || r.role} · ${r.unit}</small></div>
      <div class="indicator-status"><span class="status-pill" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span></div>
      <div class="indicator-source"><small>Nguồn</small><b>${r.source}</b></div>
      <div class="indicator-progress"><small>Tiến độ</small><div class="progress"><i style="width:${Math.max(0, Math.min(100, progress))}%"></i></div><b>${progress}%</b></div>
    </button>`;
}
function renderIndicatorRows() {
    const q = (document.getElementById('qInd')?.value || '').toLowerCase();
    const st = (document.getElementById('stInd')?.value || activeIndicatorPieStatus || '');
    const unit = document.getElementById('unitInd')?.value || '';
    activeIndicatorPieStatus = st;
    const rs = currentDrawerRecords.filter(r => (!st || r.status === st) && (!unit || r.unit === unit) && (!q || [r.id, r.title, r.indicator, r.unit, r.source, r.freq].join(' ').toLowerCase().includes(q)));
    const sourceLabel = rs[0]?.source || currentDrawerRecords[0]?.source || '--';
    const freqLabel = rs[0]?.freq || currentDrawerRecords[0]?.freq || '--';
    document.getElementById('indSummary').innerHTML = `<span class="badge gold">Đang hiển thị: ${fmt(rs.length)}</span><span class="badge ok">Tổng chỉ tiêu: ${fmt(currentDrawerRecords.length)}</span><span class="badge">Nguồn: ${sourceLabel}</span><span class="badge">Tần suất: ${freqLabel}</span>${st ? `<span class="badge" style="border-color:${statusMeta(st).color};color:${statusMeta(st).color}">${statusMeta(st).label}</span>` : ''}`;
    const holder = document.getElementById('indRows'); if (!holder) return;
    if (!rs.length) { holder.innerHTML = '<div class="access-lock">Không có bản ghi phù hợp bộ lọc.</div>'; return; }
    holder.innerHTML = `<div class="indicator-table"><div class="indicator-table-head"><span>Mã bản ghi</span><span>Chỉ tiêu / đơn vị</span><span>Trạng thái</span><span>Nguồn</span><span>Tiến độ</span></div>${rs.map(indicatorRowHtml).join('')}</div>`;
}

/* ============================== CHI TIẾT 1 BẢN GHI CHỈ TIÊU (cấp 2) ============================== */
function openIndicatorDetail(id) {
    const r = indicatorRecords.find(x => x.id === id); if (!r) return;
    const st = statusMeta(r.status);
    document.getElementById('modalTitle').textContent = `Cấp 2 · ${r.id}`;
    document.getElementById('modalSub').textContent = `Chỉ tiêu · ${axisMeta[r.role].name} · ${r.indicator}`;
    let body = `<div class="detail-grid"><div class="detail-card"><h4>Thông tin chỉ tiêu</h4><div class="kv"><b>Tên chỉ tiêu</b><span>${r.indicator}</span><b>Trục</b><span>${axisMeta[r.role].icon} ${axisMeta[r.role].name}</span><b>Đơn vị cập nhật</b><span>${r.unit}</span><b>Nguồn dữ liệu</b><span>${r.source}</span><b>Tần suất</b><span>${r.freq}</span><b>Trạng thái</b><span style="color:${st.color}">${st.label}</span><b>Tiến độ</b><span>${r.progress}%</span></div></div><div class="detail-card"><h4>Nội dung theo dõi</h4><p>${r.description}</p><div class="action-bar"><button class="primary" onclick="openIndicatorScenarioSelector('${id}')">Giao nhiệm vụ từ chỉ tiêu</button><button class="ghost" onclick="toast('Đã yêu cầu cập nhật số liệu chỉ tiêu ${r.id}')">Yêu cầu cập nhật dữ liệu</button><button class="ghost" onclick="toast('Đã tạo cảnh báo cho chỉ tiêu ${r.id}')">Tạo cảnh báo</button></div></div></div><div class="detail-card"><h4>Nhật ký chỉ tiêu</h4>${r.history.map(h => `<div class="audit-item"><b>${h.time}</b><span>${h.text}</span></div>`).join('')}</div>`;
    if (r.role === 'HDND' && /kiến nghị cử tri|ý kiến liên quan/i.test(r.indicator)) {
        const total = 87, done = 42, doing = 31, pending = 14;
        body += `<div class="detail-card"><h4>Tổng hợp ý kiến liên quan đến kiến nghị cử tri</h4><div class="subtask-kpis"><div class="mini-kpi"><b class="mono">${fmt(total)}</b><span>Tổng số ý kiến liên quan</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Đã xử lý/trả lời</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(pending)}</b><span>Chưa xử lý/cần giám sát</span></div></div><table class="compact-table"><thead><tr><th>Nhóm nội dung</th><th>Số ý kiến</th><th>Đã xử lý</th><th>Đang xử lý</th><th>Chưa xử lý</th></tr></thead><tbody><tr><td>Đất đai, GPMB</td><td>24</td><td>11</td><td>9</td><td>4</td></tr><tr><td>Giao thông, đô thị</td><td>21</td><td>10</td><td>7</td><td>4</td></tr><tr><td>An sinh, chính sách</td><td>18</td><td>9</td><td>6</td><td>3</td></tr><tr><td>Môi trường, trật tự</td><td>15</td><td>8</td><td>5</td><td>2</td></tr><tr><td>Hành chính công</td><td>9</td><td>4</td><td>4</td><td>1</td></tr></tbody></table><div class="action-bar"><button class="primary" onclick="openIndicator('HDND', indicators.HDND.findIndex(x=>x[0]==='Tổng số ý kiến liên quan đến kiến nghị cử tri'))">Mở danh sách 87 ý kiến</button><button class="ghost" onclick="openAssignmentForm()">Giao nhiệm vụ xử lý kiến nghị</button></div></div>`;
    }
    body += indicatorScenarioSummary(r);
    document.getElementById('modalBody').innerHTML = body;
    openModal();
}

/* --- Kịch bản xử lý từ chỉ tiêu (dùng chung helper với hồ sơ) --- */
function indicatorSubtasksStore(id) { window.__indicatorScenarioSubtasks = window.__indicatorScenarioSubtasks || {}; window.__indicatorScenarioSubtasks[id] = window.__indicatorScenarioSubtasks[id] || []; return window.__indicatorScenarioSubtasks[id] }
function indicatorSelectedScenario(id) { window.__indicatorSelectedScenario = window.__indicatorSelectedScenario || {}; return window.__indicatorSelectedScenario[id] || '' }
function setIndicatorSelectedScenario(id, key) { window.__indicatorSelectedScenario = window.__indicatorSelectedScenario || {}; window.__indicatorSelectedScenario[id] = key }
function indicatorScenarioSummary(ind) {
    const subs = indicatorSubtasksStore(ind.id);
    const done = subs.filter(s => (s.state || '').toLowerCase().includes('hoàn')).length;
    const doing = subs.filter(s => (s.state || '').toLowerCase().includes('đang')).length;
    const soon = subs.filter(s => (s.state || '').toLowerCase().includes('sắp')).length;
    const scen = indicatorSelectedScenario(ind.id) ? scenarioTemplates()[indicatorSelectedScenario(ind.id)] : null;
    const rows = subs.map((s, i) => `<tr class="clickable" onclick="openIndicatorSubTaskDetail('${ind.id}',${i})"><td>${s.id || ('CTN-' + String(i + 1).padStart(2, '0'))}</td><td class="subtask-scenario-col">${s.scenario ? scenarioTemplates()[s.scenario]?.title || s.scenario : 'Giao thường'}</td><td class="subtask-name-col">${s.name || 'Việc nhánh'}</td><td class="subtask-content-col">${s.content || s.name || '--'}</td><td>${s.owner || '--'}</td><td>${s.due || '--'}</td><td>${Number(s.progress ?? 35)}%</td><td><span class="badge ${s.state && s.state.includes('Hoàn') ? 'ok' : s.state && s.state.includes('Sắp') ? 'warn' : ''}">${s.state || 'Đang xử lý'}</span></td></tr>`).join('');
    return `<section class="indicator-scenario-panel"><div class="indicator-scenario-head"><div><h4>Kịch bản xử lý &amp; nhiệm vụ nhánh từ chỉ tiêu</h4><p>Chọn kịch bản → tạo nhiệm vụ nhánh liên quan → có thể thêm mới kịch bản hoặc nhiệm vụ nhánh.</p></div><div class="scenario-actions"><button class="primary" onclick="openIndicatorScenarioSelector('${ind.id}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openScenarioCreateForm('indicator','${ind.id}')">＋ Thêm kịch bản</button></div></div>${scen ? `<div class="scenario-applied"><b>Kịch bản đang áp dụng:</b> ${scen.title} · ${scen.desc}</div>` : ''}<div class="scenario-mini-grid"><div class="scenario-mini-card"><b class="mono">${fmt(subs.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="scenario-mini-card"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="scenario-mini-card"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="scenario-mini-card"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div>${subs.length ? `<div class="scenario-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Kịch bản</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="subtask-empty">Chưa có nhiệm vụ nhánh từ chỉ tiêu này. Bấm "Chọn kịch bản xử lý" để tạo các việc con theo tình huống quá hạn/chậm tiến độ/thiếu dữ liệu.</div>`}</section>`;
}
function openIndicatorScenarioSelector(id) {
    const ind = indicatorRecords.find(x => x.id === id); if (!ind) return;
    const keys = indicatorScenarioKeys(ind).filter(k => scenarioTemplates()[k]); const st = statusMeta(ind.status);
    document.getElementById('modalTitle').textContent = 'Chọn kịch bản xử lý từ chỉ tiêu';
    document.getElementById('modalSub').textContent = `${ind.id} · ${ind.indicator}`;
    document.getElementById('modalBody').innerHTML = `<div class="scenario-history-badge"><b>Trạng thái chỉ tiêu:</b> <span style="color:${st.color}">${st.label}</span> · Tiến độ ${ind.progress}% · Nguồn ${ind.source} · Tần suất ${ind.freq}. Chọn kịch bản để tạo nhiệm vụ nhánh.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('indicator','${id}')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="openIndicatorDetail('${id}')">Quay lại chi tiết chỉ tiêu</button></div><div class="scenario-grid">${keys.map(k => scenarioCardHtml('indicator', id, k)).join('')}</div>`;
    openModal();
}
function selectIndicatorScenario(id, key) {
    const ind = indicatorRecords.find(x => x.id === id); if (!ind || !scenarioTemplates()[key]) return; setIndicatorSelectedScenario(id, key);
    document.getElementById('modalTitle').textContent = `${scenarioTemplates()[key].title} · ${ind.id}`;
    document.getElementById('modalSub').textContent = 'Chọn nhiệm vụ nhánh';
    document.getElementById('modalBody').innerHTML = scenarioDetailHtml('indicator', id, key, ind, indicatorScenarioSummary);
    openModal();
}
function applyIndicatorScenarioTasks(id, key) {
    const ind = indicatorRecords.find(x => x.id === id); const s = scenarioTemplates()[key]; if (!ind || !s) return;
    const checked = [...document.querySelectorAll('[data-scenario-task]:checked')].map(x => Number(x.dataset.scenarioTask));
    if (!checked.length) { toast('Chưa chọn nhiệm vụ nhánh nào.'); return; }
    const subs = indicatorSubtasksStore(id);
    checked.forEach(idx => { const t = s.tasks[idx]; const dup = subs.some(x => x.name === t[0] && x.scenario === key); if (!dup) subs.push({ id: `${id}-N${String(subs.length + 1).padStart(2, '0')}`, name: t[0], content: t[1], owner: t[2], coordinators: t[3] || [], state: 'Đang xử lý', startDate: t[6] || '', due: t[7] || dueDate(idx, key === 'overdue' ? 'soon' : 'doing'), priority: t[4] || (s.level === 'Khẩn' ? 'Cao' : s.level), urgency: t[5] || 'Thường', progress: 10, scenario: key, created: new Date().toLocaleString('vi-VN') }); });
    setIndicatorSelectedScenario(id, key);
    toast(`Đã tạo ${checked.length} nhiệm vụ nhánh từ chỉ tiêu theo kịch bản.`); openIndicatorDetail(id);
}
function openIndicatorSubTaskDetail(indId, idx) {
    const ind = indicatorRecords.find(x => x.id === indId); const s = indicatorSubtasksStore(indId)[idx]; if (!ind || !s) return;
    document.getElementById('modalTitle').textContent = `Chi tiết nhiệm vụ nhánh từ chỉ tiêu · ${s.id}`;
    document.getElementById('modalSub').textContent = `Gắn với ${ind.id} · ${ind.indicator}`;
    document.getElementById('modalBody').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="openIndicatorDetail('${indId}')">← Quay lại chỉ tiêu</button></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id}</span><b>Kịch bản</b><span>${s.scenario ? scenarioTemplates()[s.scenario]?.title : 'Giao thường'}</span><b>Tên nhiệm vụ</b><span>${s.name}</span><b>Nội dung</b><span>${s.content}</span><b>Đơn vị nhận</b><span>${s.owner}</span><b>Hạn xử lý</b><span>${s.due}</span><b>Mức ưu tiên</b><span>${s.priority}</span><b>Trạng thái</b><span>${s.state}</span></div></div><div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ nhánh đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p><div class="kv"><b>Trạng thái</b><span>${s.state}</span><b>Tiến độ</b><span class="mono">${Number(s.progress ?? 30)}%</span></div></div></div>${indicatorScenarioSummary(ind)}`;
    openModal();
}

/* --- Kịch bản xử lý từ lĩnh vực/chỉ tiêu (dùng chung helper với hồ sơ/chỉ tiêu con) --- */
function fieldSubtasksStore(fid) { window.__fieldScenarioSubtasks = window.__fieldScenarioSubtasks || {}; window.__fieldScenarioSubtasks[fid] = window.__fieldScenarioSubtasks[fid] || []; return window.__fieldScenarioSubtasks[fid] }
function fieldSelectedScenario(fid) { window.__fieldSelectedScenario = window.__fieldSelectedScenario || {}; return window.__fieldSelectedScenario[fid] || '' }
function setFieldSelectedScenario(fid, key) { window.__fieldSelectedScenario = window.__fieldSelectedScenario || {}; window.__fieldSelectedScenario[fid] = key }
function openFieldSource(fid) {
    closeModal();
    const t = fieldTarget(fid); if (!t.cat) return;
    if (t.cat.field === 'Giáo dục') openGiaoDucDashboard();
    else if (t.scope === 'item') openCategoryItemDetail(t.role, t.catId, t.idx);
    else if (t.role === 'UBND') openSoDashboard(t.role, t.catId);
    else openCategoryDetail(t.role, t.catId);
}
function fieldScenarioSummary(fid) {
    const t = fieldTarget(fid); if (!t.cat) return '';
    const subs = fieldSubtasksStore(fid);
    const done = subs.filter(s => (s.state || '').toLowerCase().includes('hoàn')).length;
    const doing = subs.filter(s => (s.state || '').toLowerCase().includes('đang')).length;
    const soon = subs.filter(s => (s.state || '').toLowerCase().includes('sắp')).length;
    const scen = fieldSelectedScenario(fid) ? scenarioTemplates()[fieldSelectedScenario(fid)] : null;
    const rows = subs.map((s, i) => `<tr class="clickable" onclick="openFieldSubTaskDetail('${fid}',${i})"><td>${s.id || ('NV-' + String(i + 1).padStart(2, '0'))}</td><td class="subtask-scenario-col">${s.scenario ? scenarioTemplates()[s.scenario]?.title || s.scenario : 'Giao thường'}</td><td class="subtask-name-col">${s.name || 'Việc nhánh'}</td><td class="subtask-content-col">${s.content || s.name || '--'}</td><td>${s.owner || '--'}</td><td>${s.due || '--'}</td><td>${Number(s.progress ?? 35)}%</td><td><span class="badge ${s.state && s.state.includes('Hoàn') ? 'ok' : s.state && s.state.includes('Sắp') ? 'warn' : ''}">${s.state || 'Đang xử lý'}</span></td></tr>`).join('');
    return `<section class="indicator-scenario-panel"><div class="indicator-scenario-head"><h4>Nhiệm vụ đã giao</h4><div class="scenario-actions"><button class="primary" onclick="openFieldScenarioSelector('${fid}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openScenarioCreateForm('field','${fid}')">＋ Thêm kịch bản</button></div></div>${scen ? `<div class="scenario-applied"><b>${scen.title}</b></div>` : ''}<div class="scenario-mini-grid"><div class="scenario-mini-card"><b class="mono">${fmt(subs.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="scenario-mini-card"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="scenario-mini-card"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="scenario-mini-card"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div>${subs.length ? `<div class="scenario-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Kịch bản</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="subtask-empty">Chưa có nhiệm vụ nào được giao.</div>`}</section>`;
}
function openFieldScenarioSelector(fid) {
    const t = fieldTarget(fid); if (!t.cat) { toast('Không tìm thấy lĩnh vực/chỉ tiêu.'); return }
    const keys = fieldScenarioKeys(fid).filter(k => scenarioTemplates()[k]);
    document.getElementById('modalTitle').textContent = 'Chọn kịch bản xử lý theo ' + (t.scope === 'item' ? 'chỉ tiêu' : 'lĩnh vực');
    document.getElementById('modalSub').textContent = `${axisMeta[t.role].name} · ${t.label}`;
    document.getElementById('modalBody').innerHTML = `<div class="scenario-history-badge"><b>${t.scope === 'item' ? 'Chỉ tiêu' : 'Lĩnh vực'}:</b> ${esc(t.label)}. Chọn kịch bản để tạo nhiệm vụ nhánh.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('field','${fid}')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="openFieldSource('${fid}')">Quay lại ${t.scope === 'item' ? 'chỉ tiêu' : 'lĩnh vực'}</button></div><div class="scenario-grid">${keys.map(k => scenarioCardHtml('field', fid, k)).join('')}</div>`;
    openModal();
}
function selectFieldScenario(fid, key) {
    const t = fieldTarget(fid); if (!t.cat || !scenarioTemplates()[key]) return; setFieldSelectedScenario(fid, key);
    document.getElementById('modalTitle').textContent = `${scenarioTemplates()[key].title} · ${t.label}`;
    document.getElementById('modalSub').textContent = 'Chọn nhiệm vụ nhánh';
    document.getElementById('modalBody').innerHTML = scenarioDetailHtml('field', fid, key, null, null);
    openModal();
}
function applyFieldScenarioTasks(fid, key) {
    const t = fieldTarget(fid); const s = scenarioTemplates()[key]; if (!t.cat || !s) return;
    const checked = [...document.querySelectorAll('[data-scenario-task]:checked')].map(x => Number(x.dataset.scenarioTask));
    if (!checked.length) { toast('Chưa chọn nhiệm vụ nhánh nào.'); return; }
    const subs = fieldSubtasksStore(fid);
    checked.forEach(idx => { const tk = s.tasks[idx]; const dup = subs.some(x => x.name === tk[0] && x.scenario === key); if (!dup) subs.push({ id: `NV-${fid.replace(/::/g, '-')}-${String(subs.length + 1).padStart(2, '0')}`, name: tk[0], content: tk[1], owner: tk[2], coordinators: tk[3] || [], state: 'Đang xử lý', startDate: tk[6] || '', due: tk[7] || dueDate(idx, key === 'overdue' ? 'soon' : 'doing'), priority: tk[4] || (s.level === 'Khẩn' ? 'Cao' : s.level), urgency: tk[5] || 'Thường', progress: 10, scenario: key, created: new Date().toLocaleString('vi-VN') }); });
    setFieldSelectedScenario(fid, key);
    toast(`Đã tạo ${checked.length} nhiệm vụ nhánh theo ${t.scope === 'item' ? 'chỉ tiêu' : 'lĩnh vực'}.`); openFieldSource(fid);
}
function openFieldSubTaskDetail(fid, idx) {
    const t = fieldTarget(fid); const s = fieldSubtasksStore(fid)[idx]; if (!t.cat || !s) return;
    document.getElementById('modalTitle').textContent = `Chi tiết nhiệm vụ nhánh · ${s.id}`;
    document.getElementById('modalSub').textContent = `Gắn với ${axisMeta[t.role].name} · ${t.label}`;
    document.getElementById('modalBody').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="openFieldSource('${fid}')">← Quay lại ${t.scope === 'item' ? 'chỉ tiêu' : 'lĩnh vực'}</button></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id}</span><b>Kịch bản</b><span>${s.scenario ? scenarioTemplates()[s.scenario]?.title : 'Giao thường'}</span><b>Tên nhiệm vụ</b><span>${s.name}</span><b>Nội dung</b><span>${s.content}</span><b>Đơn vị nhận</b><span>${s.owner}</span><b>Hạn xử lý</b><span>${s.due}</span><b>Mức ưu tiên</b><span>${s.priority}</span><b>Trạng thái</b><span>${s.state}</span></div></div><div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ nhánh đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p><div class="kv"><b>Trạng thái</b><span>${s.state}</span><b>Tiến độ</b><span class="mono">${Number(s.progress ?? 30)}%</span></div></div></div>${fieldScenarioSummary(fid)}`;
    openModal();
}

/* ============================== DASHBOARD SỞ (dùng chung cho các sở UBND chưa có dữ liệu thật, port giao diện từ dashboard Giáo dục) ============================== */
function ensureFakeCategoryItems(role, catId) {
    const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat || cat.items.length || cat.noItems) return;
    const seed = [...catId].reduce((a, c) => a + c.charCodeAt(0), 0);
    const shortName = cat.name.split(' (')[0];
    const templates = [['Tổng hợp số liệu chuyên ngành', ''], ['Kết quả thực hiện nhiệm vụ trọng tâm', 'Quý'], ['Tình hình xử lý phản ánh, kiến nghị liên quan', 'Tuần'], ['Chỉ tiêu tổng hợp báo cáo định kỳ', '']];
    const n = 3 + (seed % 2);
    cat.items = templates.slice(0, n).map((t, i) => [`${shortName} - ${t[0]}`, 10 + ((seed + i * 13) % 50), t[1], 'Dữ liệu demo, chưa kết nối nguồn chính thức']);
    if (!cat.desc) cat.desc = 'Dữ liệu minh họa — lĩnh vực chưa có nguồn kết nối chính thức, số liệu chỉ mang tính demo.';
    if (!cat.types || !cat.types.length) cat.types = ['Demo'];
    cat.items.forEach(item => {
        addIndicatorFromCategory(role, item);
        const name = item[0], count = Number(item[1]) || 0;
        const idx = indicators[role].findIndex(x => x[0] === name);
        for (let i = 0; i < count; i++) {
            const st = statusDefs[(i + idx) % statusDefs.length];
            indicatorRecords.push({ id: `CT-${role}-${idx + 1}-FAKE-${String(i + 1).padStart(4, '0')}`, role, indicator: name, status: st.key, title: `${name} - bản ghi ${i + 1}`, field: name, source: item[3], freq: item[2], unit: pick(units, i), due: dueDate(i, st.key), progress: progressFor(st.key, i), description: `Bản ghi demo minh họa cho chỉ tiêu ${name}, chưa đồng bộ từ nguồn thật.`, history: [{ time: '--', text: 'Dữ liệu demo minh họa, chưa đồng bộ nguồn thật.' }] });
        }
    });
}
function soDashboardKpis(cat, seed) {
    return [
        { label: 'Tổng chỉ tiêu', value: fmt(cat.items.length) },
        { label: 'Tổng bản ghi', value: fmt(catTotal(cat)) },
        { label: 'Đơn vị trực thuộc', value: fmt(3 + (seed % 6)) },
        { label: 'Tỷ lệ hoàn thành', value: (55 + (seed % 35)) + '%' },
        { label: 'Đang xử lý', value: fmt(10 + (seed % 40)) },
        { label: 'Sắp đến hạn', value: fmt(3 + (seed % 10)) },
        { label: 'Quá hạn', value: fmt(seed % 5) },
        { label: 'Cập nhật gần nhất', value: (1 + (seed % 6)) + ' ngày trước' }
    ];
}
/* ===== Giao diện riêng cho "Sở Nông nghiệp và Môi trường" — đúng số liệu thật từ network JSON ===== */
const NNMT_GPMB_CATS = ['Các dự án đầu tư xây dựng cầu', 'Các đường vành đai', 'Các Dự án cải tạo, nâng cấp đường giao thông đường bộ'];
const NNMT_GPMB_INVEST = [754166193378, 3772, 22492140852];
const NNMT_GPMB_KINHPHI = [711955448286, 2587, 106129450930];
const NNMT_GPMB_PROJECTS = [5, 3, 6];
function nnmtGpmbBoxHtml() {
    return `<div class="cat-chart-box">
      <div class="cdl-title" style="text-align:center;font-size:12px">Tổng hợp dữ liệu GPMB (Tuần 01/2026)</div>
      <div style="position:relative;height:260px;margin-top:8px"><canvas id="nnmtGpmbChart"></canvas></div>
    </div>`;
}
let nnmtGpmbChartInstance = null;
function initNnmtGpmbChart() {
    const canvas = document.getElementById('nnmtGpmbChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (nnmtGpmbChartInstance) { nnmtGpmbChartInstance.destroy(); nnmtGpmbChartInstance = null; }
    nnmtGpmbChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: NNMT_GPMB_CATS, datasets: [
                { type: 'bar', label: 'Tổng mức đầu tư (đồng)', data: NNMT_GPMB_INVEST, backgroundColor: '#7086FD', borderRadius: 3, maxBarThickness: 40, yAxisID: 'y' },
                { type: 'bar', label: 'Tổng kinh phí GPMB (đồng)', data: NNMT_GPMB_KINHPHI, backgroundColor: '#6FD195', borderRadius: 3, maxBarThickness: 40, yAxisID: 'y' },
                { type: 'line', label: 'Tổng số dự án', data: NNMT_GPMB_PROJECTS, borderColor: '#FD9843', backgroundColor: '#FD9843', pointRadius: 4, tension: .3, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: {
                y: { beginAtZero: true, position: 'left', ticks: { color: chartAxisColor(), font: { size: 9 }, callback: v => fmt(v) }, grid: { color: chartGridColor() } },
                y1: { beginAtZero: true, position: 'right', ticks: { color: chartAxisColor(), font: { size: 9.5 } }, grid: { display: false } },
                x: { ticks: { color: chartLabelColor(), font: { size: 9.5 } }, grid: { display: false } }
            },
            plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 11, font: { size: 9.5 } } } }
        }
    });
}
const NNMT_DATDAI_CATS = ['Nhóm đất nông nghiệp', 'Nhóm đất phi nông nghiệp', 'Nhóm đất chưa sử dụng'];
const NNMT_DATDAI_SERIES = [
    { label: 'Diện tích sử dụng', color: '#7086FD', data: [173264, 138336, 2342] },
    { label: 'Diện tích được giao quản lý', color: '#6FD195', data: [22042, 66659, 2338] }
];
function nnmtDatDaiBoxHtml() {
    return `<div class="cat-chart-box">
      <div class="cdl-title" style="text-align:center;font-size:12px">Thống kê tình hình sử dụng đất đai — ha (Năm 2025)</div>
      <div style="position:relative;height:260px;margin-top:8px"><canvas id="nnmtDatDaiChart"></canvas></div>
    </div>`;
}
let nnmtDatDaiChartInstance = null;
function initNnmtDatDaiChart() {
    const canvas = document.getElementById('nnmtDatDaiChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (nnmtDatDaiChartInstance) { nnmtDatDaiChartInstance.destroy(); nnmtDatDaiChartInstance = null; }
    nnmtDatDaiChartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels: NNMT_DATDAI_CATS, datasets: NNMT_DATDAI_SERIES.map(s => ({ label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 40 })) },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { y: { beginAtZero: true, ticks: { color: chartAxisColor(), font: { size: 10 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 10.5 } }, grid: { display: false } } },
            plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10 } } } }
        }
    });
}
/* ===== Giao diện riêng cho "Sở Nội vụ" — đúng số liệu thật ===== */

function noivuBox1Html() {
    return `<div class="cat-chart-box">
      <div class="cdl-title" style="text-align:center;font-size:12px">Tổng số chi trả an sinh cho người có công ( 3/2026)</div>
      <div style="position:relative;height:190px;margin-top:8px"><canvas id="noivuAnSinhChart"></canvas></div>
      <p style="text-align:center;margin:12px 0 4px"><span style="font-size:10px;color:var(--text-muted)">Tổng </span><b style="font-size:20px;color:#fff">228,987</b><span style="font-size:10px;color:var(--text-muted)"> tỷ đồng</span></p>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
        <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span>🟢 Tổng số đã chi trả</span><b>228.987.078.109 đồng</b></div>
        <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span>🔴 Tổng số chưa chi trả</span><b>0 đồng</b></div>
      </div>
    </div>`;
}
let noivuAnSinhChartInstance = null;
function initNoivuAnSinhChart() {
    const canvas = document.getElementById('noivuAnSinhChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (noivuAnSinhChartInstance) { noivuAnSinhChartInstance.destroy(); noivuAnSinhChartInstance = null; }
    noivuAnSinhChartInstance = new Chart(canvas, {
        type: 'pie',
        data: { labels: ['Đã chi trả', 'Chưa chi trả'], datasets: [{ data: [228987078109, 0], backgroundColor: ['#2fb174', '#e0218a'], borderColor: '#04101d', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } } }
    });
}
function noivuBox2Html() {
    return `<div class="cat-chart-box">
      <div class="cdl-title" style="text-align:center;font-size:12px">Tổng số CCVC khối chính quyền (Năm 2025)</div>
      <div style="position:relative;height:220px;margin-top:8px"><canvas id="noivuCcvcChart"></canvas></div>
    </div>`;
}
let noivuCcvcChartInstance = null;
function initNoivuCcvcChart() {
    const canvas = document.getElementById('noivuCcvcChart'); if (!canvas || typeof Chart === 'undefined') return;
    if (noivuCcvcChartInstance) { noivuCcvcChartInstance.destroy(); noivuCcvcChartInstance = null; }
    noivuCcvcChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: { labels: ['Viên chức: 124.378', 'Công chức: 11.965'], datasets: [{ data: [124378, 11965], backgroundColor: ['#7086FD', '#6FD195'], borderColor: '#04101d', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10 } } } } },
        plugins: [donutCenterTextPlugin('136.343', 'CCVC')]
    });
}
const NOIVU_CUSTOM_ITEMS = ['Doanh nghiệp tham gia tuyển dụng', 'Tổng số nhu cầu tuyển dụng', 'Số hồ sơ tìm việc', 'Tổng số chi trả an sinh cho người có công', 'Tổng số CCVC khối chính quyền'];
/* ===== Giao diện riêng cho "Sở Tài chính" — 4/11 biểu đồ có số liệu thật (Thu ngân sách, 2 donut vốn đầu tư, Khách du lịch),
   8 biểu đồ còn lại (không có số hiển thị rõ trên ảnh gốc) tạm ước tính theo đúng hình dạng cột — sẽ cập nhật khi có số liệu thật. */
const TC_CUSTOM_ITEMS = ['Tình hình thu ngân sách so với dự toán', 'Tổng mức lưu chuyển hàng hóa và doanh thu dịch vụ tiêu dùng xã hội', 'Vốn đầu tư phát triển toàn xã hội thực hiện theo giá hiện hành', 'Vốn đầu tư thực hiện từ nguồn NSNN do địa phương quản lý', 'Chỉ số sản xuất công nghiệp so với cùng kỳ năm trước', 'Tiến độ hoàn thành các dự án trọng điểm', 'Doanh thu vận tải, kho bãi, dịch vụ hỗ trợ vận tải và bưu chính chuyển phát', 'Khách du lịch đến Hà Nội (do cơ sở lưu trú phục vụ)', 'Kim ngạch xuất nhập khẩu', 'Chỉ số giá tiêu dùng, giá vàng, đô la Mỹ', 'Tình hình chi ngân sách địa phương'];
function tcChartBox(id, title, height) {
    return `<div class="cat-chart-box"><div class="cdl-title" style="text-align:center;font-size:11.5px">${esc(title)}</div><div style="position:relative;height:${height || 220}px;margin-top:8px"><canvas id="${id}"></canvas></div></div>`;
}
const TC_THU_CATS = ['Thu từ hoạt động XNK', 'Thu dầu thô', 'Thu nội địa', 'Thu viện trợ không hoàn lại'];
const TC_THU_SERIES = [{ label: 'So với dự toán', color: '#7086FD', data: [27.6, 32.6, 39.9, 278.8] }, { label: 'So cùng kỳ năm 2025', color: '#6FD195', data: [122, 145.6, 98.7, 377.9] }];
const TC_LUUCHUYEN_CATS = ['Nhà nước', 'Ngoài nhà nước', 'Khu vực có vốn đầu tư nước ngoài'];
const TC_LUUCHUYEN_SERIES = [{ label: 'Tổng mức bán lẻ và doanh thu dịch vụ (ước tính)', color: '#7086FD', data: [45000, 230000, 35000] }, { label: 'Tổng mức bán ra và doanh thu dịch vụ (ước tính)', color: '#6FD195', data: [90000, 980000, 70000] }];
const TC_SXCN_CATS = ['Toàn ngành công nghiệp', 'Khai khoáng', 'Công nghiệp chế biến, chế tạo', 'Sản xuất và phân phối điện, khí đốt, hơi nước, điều hoà không khí', 'Cung cấp nước, quản lý và xử lý rác thải, nước thải'];
const TC_SXCN_DATA = [108, 102, 112, 106, 104];
const TC_DUAN_CATS = ['Nhóm 10 dự án, công trình', 'Dự án 07 cầu vượt sông Hồng', 'Các tuyến đường Vành đai và Giao thông trọng điểm', 'Quy hoạch và Thể chế phát triển Thủ đô', 'Xử lý các dự án ngoài ngân sách chậm triển khai'];
const TC_DUAN_DATA = [30, 35, 15, 40, 48];
const TC_VANTAI_CATS = ['Vận tải hành khách', 'Vận tải hàng hóa', 'Dịch vụ kho bãi và hỗ trợ vận tải', 'Bưu chính, chuyển phát'];
const TC_VANTAI_BAR = [78000, 48000, 52000, 8000];
const TC_VANTAI_LINE = [130, 120, 140, 10];
const TC_XNK_CATS = ['Khu vực kinh tế trong nước', 'Khu vực có vốn đầu tư nước ngoài'];
const TC_XNK_NHAPKHAU = [2950, 1200], TC_XNK_XUATKHAU = [620, 630];
const TC_XNK_NHAPKHAU_CK = [125, 110], TC_XNK_XUATKHAU_CK = [85, 110];
const TC_GIA_CATS = ['Chỉ số giá tiêu dùng', 'Chỉ số giá vàng', 'Chỉ số giá đô la Mỹ'];
const TC_GIA_DATA = [103, 190, 103];
const TC_CHINS_CATS = ['Tổng chi ngân sách địa phương', 'Chi đầu tư phát triển', 'Chi phát triển thường xuyên', 'Chi trả nợ lãi', 'Chi bổ sung quỹ dự trữ tài chính', 'Các khoản chi khác'];
const TC_CHINS_SERIES = [{ label: 'Quý I năm trước', color: '#7086FD', data: [28000, 10000, 20000, 1000, 500, 300] }, { label: 'Quý I năm 2026', color: '#6FD195', data: [45000, 28000, 22000, 1200, 600, 400] }];
let tcChartInstances = {};
function tcDestroy(id) { if (tcChartInstances[id]) { tcChartInstances[id].destroy(); delete tcChartInstances[id]; } }
function initTaichinhCharts() {
    ['tcThu', 'tcLuuChuyen', 'tcVonDauTu', 'tcVonNsnn', 'tcSxcn', 'tcDuAn', 'tcVanTai', 'tcKhachDL', 'tcXnk', 'tcGia', 'tcChiNs'].forEach(tcDestroy);
    let c;
    c = document.getElementById('tcThuChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcThu = new Chart(c, { type: 'bar', data: { labels: TC_THU_CATS, datasets: TC_THU_SERIES.map(s => ({ label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 46 })) }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, max: 400, ticks: { color: chartAxisColor(), font: { size: 11 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 11 } }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 11 } } } } } });
    c = document.getElementById('tcLuuChuyenChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcLuuChuyen = new Chart(c, { type: 'bar', data: { labels: TC_LUUCHUYEN_CATS, datasets: TC_LUUCHUYEN_SERIES.map(s => ({ label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 50 })) }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...TC_LUUCHUYEN_SERIES.flatMap(s => s.data)) * 1.18), ticks: { color: chartAxisColor(), font: { size: 10.5 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 11 } }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10.5 } } } } } });
    c = document.getElementById('tcVonDauTuChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcVonDauTu = new Chart(c, { type: 'doughnut', data: { labels: ['Vốn nhà nước: 42.006', 'Vốn ngoài nhà nước: 53.222', 'Vốn đầu tư trực tiếp nước ngoài: 7.032'], datasets: [{ data: [42006, 53222, 7032], backgroundColor: ['#7086FD', '#FD9843', '#6FD195'], borderColor: '#04101d', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10.5 } } } } }, plugins: [donutCenterTextPlugin('102.260', 'tỷ đồng')] });
    c = document.getElementById('tcVonNsnnChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcVonNsnn = new Chart(c, { type: 'doughnut', data: { labels: ['Cấp thành phố: 11.519', 'Cấp xã: 9.426'], datasets: [{ data: [11519, 9426], backgroundColor: ['#7086FD', '#6FD195'], borderColor: '#04101d', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10.5 } } } } }, plugins: [donutCenterTextPlugin('20.945', 'tỷ đồng')] });
    c = document.getElementById('tcSxcnChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcSxcn = new Chart(c, { type: 'bar', data: { labels: TC_SXCN_CATS, datasets: [{ data: TC_SXCN_DATA, backgroundColor: '#39d5ff', borderRadius: 3, maxBarThickness: 26 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { beginAtZero: true, max: 180, ticks: { color: chartAxisColor(), font: { size: 11 } }, grid: { color: chartGridColor() } }, y: { ticks: { color: chartLabelColor(), font: { size: 10.5 } }, grid: { display: false } } }, plugins: { legend: { display: false } } } });
    c = document.getElementById('tcDuAnChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcDuAn = new Chart(c, { type: 'bar', data: { labels: TC_DUAN_CATS, datasets: [{ data: TC_DUAN_DATA, backgroundColor: '#39d5ff', borderRadius: 3, maxBarThickness: 26 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { beginAtZero: true, max: 50, ticks: { color: chartAxisColor(), font: { size: 11 } }, grid: { color: chartGridColor() } }, y: { ticks: { color: chartLabelColor(), font: { size: 10.5 } }, grid: { display: false } } }, plugins: { legend: { display: false } } } });
    c = document.getElementById('tcVanTaiChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcVanTai = new Chart(c, { type: 'bar', data: { labels: TC_VANTAI_CATS, datasets: [{ type: 'bar', label: 'Ước tính quý I năm 2026 (tỷ đồng)', data: TC_VANTAI_BAR, backgroundColor: '#7086FD', borderRadius: 3, maxBarThickness: 46, yAxisID: 'y' }, { type: 'line', label: 'Quý I 2026 so với cùng kỳ (số lượng)', data: TC_VANTAI_LINE, borderColor: '#FD9843', backgroundColor: '#FD9843', pointRadius: 4, tension: .3, yAxisID: 'y1' }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, position: 'left', suggestedMax: Math.ceil(Math.max(...TC_VANTAI_BAR) * 1.18), ticks: { color: chartAxisColor(), font: { size: 10.5 } }, grid: { color: chartGridColor() } }, y1: { beginAtZero: true, position: 'right', suggestedMax: Math.ceil(Math.max(...TC_VANTAI_LINE) * 1.25), ticks: { color: chartAxisColor(), font: { size: 10.5 } }, grid: { display: false } }, x: { ticks: { color: chartLabelColor(), font: { size: 10.5 } }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10 } } } } } });
    c = document.getElementById('tcKhachDLChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcKhachDL = new Chart(c, { type: 'doughnut', data: { labels: ['Khách nội địa: 654', 'Khách quốc tế: 1.781'], datasets: [{ data: [654, 1781], backgroundColor: ['#FD9843', '#7086FD'], borderColor: '#04101d', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10.5 } } } } }, plugins: [donutCenterTextPlugin('2.435', 'nghìn lượt')] });
    c = document.getElementById('tcXnkChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcXnk = new Chart(c, {
        type: 'bar', data: {
            labels: TC_XNK_CATS, datasets: [
                { type: 'bar', label: 'Nhập khẩu', data: TC_XNK_NHAPKHAU, backgroundColor: '#7086FD', borderRadius: 3, maxBarThickness: 40, yAxisID: 'y' },
                { type: 'bar', label: 'Xuất khẩu', data: TC_XNK_XUATKHAU, backgroundColor: '#6FD195', borderRadius: 3, maxBarThickness: 40, yAxisID: 'y' },
                { type: 'line', label: 'Nhập khẩu so với cùng kỳ năm trước', data: TC_XNK_NHAPKHAU_CK, borderColor: '#FD9843', backgroundColor: '#FD9843', pointRadius: 4, tension: .3, yAxisID: 'y1' },
                { type: 'line', label: 'Xuất khẩu so với cùng kỳ năm trước', data: TC_XNK_XUATKHAU_CK, borderColor: '#39d5ff', backgroundColor: '#39d5ff', pointRadius: 4, tension: .3, yAxisID: 'y1' }
            ]
        }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, position: 'left', suggestedMax: Math.ceil(Math.max(...TC_XNK_NHAPKHAU, ...TC_XNK_XUATKHAU) * 1.18), ticks: { color: chartAxisColor(), font: { size: 10.5 } }, grid: { color: chartGridColor() } }, y1: { beginAtZero: true, position: 'right', suggestedMax: Math.ceil(Math.max(...TC_XNK_NHAPKHAU_CK, ...TC_XNK_XUATKHAU_CK) * 1.25), ticks: { color: chartAxisColor(), font: { size: 10.5 } }, grid: { display: false } }, x: { ticks: { color: chartLabelColor(), font: { size: 11 } }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10 } } } } }
    });
    c = document.getElementById('tcGiaChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcGia = new Chart(c, { type: 'bar', data: { labels: TC_GIA_CATS, datasets: [{ data: TC_GIA_DATA, backgroundColor: '#7086FD', borderRadius: 3, maxBarThickness: 60 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, max: 200, ticks: { color: chartAxisColor(), font: { size: 11 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 11.5 } }, grid: { display: false } } }, plugins: { legend: { display: false } } } });
    c = document.getElementById('tcChiNsChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcChiNs = new Chart(c, { type: 'bar', data: { labels: TC_CHINS_CATS, datasets: TC_CHINS_SERIES.map(s => ({ label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 28 })) }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...TC_CHINS_SERIES.flatMap(s => s.data)) * 1.18), ticks: { color: chartAxisColor(), font: { size: 10.5 } }, grid: { color: chartGridColor() } }, x: { ticks: { color: chartLabelColor(), font: { size: 10 } }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 12, font: { size: 10 } } } } } });
}
function taichinhBoxesHtml() {
    return `<div style="display:grid;gap:14px">
      ${tcChartBox('tcThuChart', 'Tình hình thu ngân sách so với dự toán (%)', 260)}
      ${tcChartBox('tcLuuChuyenChart', 'Tổng mức lưu chuyển hàng hóa và doanh thu dịch vụ tiêu dùng xã hội (ước tính)', 260)}
      ${tcChartBox('tcVonDauTuChart', 'Vốn đầu tư phát triển toàn xã hội thực hiện theo giá hiện hành', 260)}
      ${tcChartBox('tcVonNsnnChart', 'Vốn đầu tư thực hiện từ nguồn NSNN do địa phương quản lý', 260)}
      ${tcChartBox('tcSxcnChart', 'Chỉ số SXCN so với cùng kỳ năm trước (ước tính)', 260)}
      ${tcChartBox('tcDuAnChart', 'Tiến độ hoàn thành các dự án trọng điểm (ước tính)', 260)}
      ${tcChartBox('tcVanTaiChart', 'Doanh thu vận tải, kho bãi, bưu chính chuyển phát (ước tính)', 300)}
      ${tcChartBox('tcKhachDLChart', 'Khách du lịch đến Hà Nội', 260)}
      ${tcChartBox('tcXnkChart', 'Kim ngạch xuất nhập khẩu (ước tính)', 300)}
      ${tcChartBox('tcGiaChart', 'Chỉ số giá tiêu dùng, giá vàng, đô la Mỹ (ước tính)', 260)}
      ${tcChartBox('tcChiNsChart', 'Tình hình chi ngân sách địa phương Quý I/2026 (ước tính)', 300)}
    </div>`;
}
function openSoDashboard(role, catId) {
    if (!canSeeRole(role)) { toast('Không có quyền xem lĩnh vực này.'); return }
    ensureFakeCategoryItems(role, catId);
    const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat) return;
    cat.role = role;
    const seed = [...catId].reduce((a, c) => a + c.charCodeAt(0), 0);
    const fid = `cat::${role}::${catId}`;
    const kpis = soDashboardKpis(cat, seed);
    document.getElementById('drawerTitle-ct').textContent = `Lĩnh vực: ${cat.name}`;
    // document.getElementById('drawerSub').textContent = '';
    document.getElementById('drawerBodyCT').innerHTML = `<div class="gd-dash">
      <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
        <button style="font-size:12px;background:linear-gradient(180deg,#2c7dd2,#1c5aa0);color:#fff;border-radius:8px;padding:6px 14px;font-weight:800" onclick="openFieldScenarioSelector('${fid}')">Giao nhiệm vụ</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
        <select style="height:32px;font-size:12px;"><option>2025-2026</option></select>
        <select style="height:32px;font-size:12px;"><option>Đầu năm</option></select>
        <select style="height:32px;font-size:12px;"><option>Toàn thành phố</option></select>
        <select style="height:32px;font-size:12px;"><option>Tất cả chỉ tiêu</option></select>
      </div>
      ${cat.noItems ? `<div class="access-lock" style="text-align:center;padding:24px 12px"><i class="ti ti-info-circle" style="font-size:20px;color:var(--text-muted)" aria-hidden="true"></i><p style="margin:8px 0 0;color:var(--text-secondary);font-size:13px">Không có chỉ tiêu được giao.</p></div>` : `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:20px;">${kpis.map(k => `<div style="background:var(--surface-1);border-radius:var(--radius);padding:0.7rem;"><p style="font-size:11px;color:var(--text-secondary);margin:0 0 3px;">${esc(k.label)}</p><p style="font-size:17px;font-weight:500;margin:0;">${esc(k.value)}</p></div>`).join('')}</div>
      ${catId === 'ubnd-noivu' ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">${noivuBox1Html()}${noivuBox2Html()}</div>` : ''}
      <div class="cat-charts-full-grid" style="margin-top:0">
        <div>
          ${catId === 'ubnd-nnmt' ? `<div style="display:grid;gap:14px">${nnmtGpmbBoxHtml()}${nnmtDatDaiBoxHtml()}</div>` : catId === 'ubnd-taichinh' ? taichinhBoxesHtml() : `<p style="font-size:12px;color:var(--text-secondary);margin:0 0 8px;">Nhóm chỉ tiêu</p><div class="cat-item-list ${getChartGridClass(cat.items.length)}" style="display:grid;gap:12px">${cat.items.map((it, idx) => (catId === 'ubnd-noivu' && NOIVU_CUSTOM_ITEMS.includes(it[0])) ? '' : soCategoryItemCardHtml(role, catId, idx, it)).join('')}</div>`}
        </div>
      </div>
      ${fieldScenarioSummary(fid)}`}
    </div>`;
    openDrawer();
    runDrawerCharts(function () {
        flushPendingDimCharts();
        syncGenUnitBoxHeight();
        if (catId === 'ubnd-nnmt') { initNnmtGpmbChart(); initNnmtDatDaiChart(); }
        if (catId === 'ubnd-noivu') { initNoivuAnSinhChart(); initNoivuCcvcChart(); }
        if (catId === 'ubnd-taichinh') initTaichinhCharts();
    });
}

/* ============================== RENDER ALL / KHỞI ĐỘNG ============================== */
function renderAll() {
    const meta = axisMeta[currentRole];
    document.getElementById('currentIcon').textContent = meta.icon;
    document.getElementById('currentRoleName').textContent = currentAccount.title;
    document.getElementById('currentRoleDesc').textContent = currentAccount.subtitle;
    renderRoleScope(); renderSummary(); renderMetricTabs(); renderAxisDashboard(); renderIndicators(); renderSources(); renderNotifications(); renderCad(); renderCustomizer(); applyWidgetVisibility();
}



/* ===================================================================
 * BOOTSTRAP - khoi tao component standalone (da bo dang nhap).
 * Mac dinh dong vai tro DANG / Thanh uy (giong selectLogin('danguy') cua file goc) -> xem tat ca 04 truc.
 * =================================================================== */
(function () {
    function __boot() {
        try { if (typeof initData === 'function') { initData(); } else { generateRecords(); } } catch (e) { console.error('initData', e); }
        try {
            var acc = (typeof accounts !== 'undefined') ? (accounts.danguy || Object.keys(accounts).map(function (k) { return accounts[k]; }).filter(function (a) { return a.role === 'DANG'; })[0]) : null;
            if (acc) { currentAccount = acc; currentRole = acc.role; }
        } catch (e) { }
        try { activeMetric = 'received'; } catch (e) { }
        try { activeIndicatorRole = allowedRoles()[0]; } catch (e) { }
        try { activeCategoryRole = (currentRole === 'DANG') ? 'ALL' : allowedRoles()[0]; } catch (e) { }
        try { renderAll = window.renderAll = function () { }; } catch (e) { }
        try { if (document.getElementById('clock')) { updateClock(); setInterval(updateClock, 1000); } } catch (e) { }
        try {
            var m = axisMeta[currentRole];
            var i = document.getElementById('currentIcon'); if (i) i.textContent = m.icon;
            var n = document.getElementById('currentRoleName'); if (n) n.textContent = currentAccount.title;
            var d = document.getElementById('currentRoleDesc'); if (d) d.textContent = currentAccount.subtitle;
        } catch (e) { }
        try { document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') { e.preventDefault(); if (typeof openQuickCommand === 'function') openQuickCommand(); } }); } catch (e) { }
        /* ==== RENDER RIENG CUA COMPONENT ==== */
        try { renderIndicators(); } catch (e) { console.error('component render', e); }
        try { ensureChartJs(); } catch (e) { console.warn('[indicators] Chart.js preload', e); }
        try { loadIocApiAndRender(); } catch (e) { console.error('ioc api', e); }
        try { Array.prototype.forEach.call(document.querySelectorAll('[data-widget]'), function (el) { el.classList.remove('hidden'); }); } catch (e) { }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', __boot); else __boot();
})();


function extractAllItems(data, currentKey, parentId, seenIds, result) {
    if (!data || typeof data !== 'object') return result;

    seenIds = seenIds || new Set();
    result = result || [];

    // Nếu data là mảng, duyệt từng phần tử
    if (Array.isArray(data)) {
        data.forEach(function (item) {
            extractAllItems(item, null, parentId, seenIds, result);
        });
        return result;
    }

    // Duyệt các key của object
    Object.keys(data).forEach(function (key) {
        var value = data[key];
        // Nếu value là object, xử lý
        if (value && typeof value === 'object') {
            // Nếu value có id và name, thêm vào kết quả
            if (value.id && value.name) {
                var id = value.id;
                var name = value.name;
                var _id = key; // key gốc
                // Kiểm tra trùng lặp: chưa có id hoặc _id trong seenIds
                if (!seenIds.has(id) && !seenIds.has(_id)) {
                    seenIds.add(id);
                    seenIds.add(_id);
                    var entry = { id: id, name: name, _id: _id };
                    if (parentId) {
                        entry.parentId = parentId;
                    }
                    result.push(entry);
                }
                // Tiếp tục đào sâu vào value để tìm các object con khác
                extractAllItems(value, key, id, seenIds, result);
            } else {
                // Nếu không có id, name, tiếp tục đào sâu, dùng currentKey làm parentId tạm
                var newParent = parentId || currentKey;
                extractAllItems(value, key, newParent, seenIds, result);
            }
        }
    });

    return result;
}
function buildDynamicChartConfig(data, options = {}) {
    const {
        labelKey,
        groupKey,
        valueKey,
        datasetOptions = {},
        defaultColors = ['#7086FD', '#6FD195', '#FD9843', '#FF6B6B', '#A66CFF', '#FFB347']
    } = options;

    // 1. Lấy danh sách nhãn (giữ thứ tự xuất hiện)
    const labels = [];
    const labelSet = new Set();
    data.forEach(item => {
        const label = item[labelKey];
        if (!labelSet.has(label)) {
            labelSet.add(label);
            labels.push(label);
        }
    });

    // 2. Lấy danh sách nhóm
    const groups = [];
    const groupSet = new Set();
    data.forEach(item => {
        const group = item[groupKey];
        if (!groupSet.has(group)) {
            groupSet.add(group);
            groups.push(group);
        }
    });

    // 3. Tạo dataset cho mỗi nhóm
    const datasets = groups.map((group, idx) => {
        const opt = datasetOptions[group] || {};
        const color = opt.color || defaultColors[idx % defaultColors.length];
        const type = opt.type || 'bar'; // 'bar' hoặc 'line'

        // Lấy dữ liệu theo đúng thứ tự labels
        const groupData = labels.map(label => {
            const found = data.find(item => item[labelKey] === label && item[groupKey] === group);
            return found ? found[valueKey] : 0;
        });

        // Dataset cơ bản
        const dataset = {
            type: type,
            label: group,
            data: groupData,
            backgroundColor: color,
            borderColor: color,
            borderRadius: type === 'bar' ? 3 : undefined,
            maxBarThickness: type === 'bar' ? 40 : undefined,
            yAxisID: opt.yAxisID || 'y',
            order: opt.order || 2,
            pointRadius: type === 'line' ? 4 : undefined,
            tension: type === 'line' ? 0.3 : undefined,
            fill: type === 'line' ? false : undefined,
        };

        // Xoá các thuộc tính không cần cho line
        if (type === 'line') {
            delete dataset.backgroundColor;
            delete dataset.borderRadius;
            delete dataset.maxBarThickness;
        }

        return dataset;
    });

    return { labels, datasets };
}

function queueMixedChart(id, config) {
    // config = { type: 'bar', data: { labels, datasets: [...] }, options: {...} }
    window.__pendingMixedCharts = window.__pendingMixedCharts || [];
    window.__pendingMixedCharts.push({ id, config });
}

// ----------------------------Cấu hình chart biểu đồ-------------------------------------
// ======================== CẤU HÌNH ========================
const CHART_CONFIG = {
    maxBars: 30,
    barPadding: 0.2,
    minBarWidth: 4,
    fontSize: 10,
    labelRotation: 0,
    colors: ['#2c7dd2', '#f28e2b', '#4e79a7', '#f58518', '#e15759', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f']
};

function getColor(index) {
    return CHART_CONFIG.colors[index % CHART_CONFIG.colors.length];
}

// ========== CẤU HÌNH TOOLTIP ==========
const TOOLTIP_CONFIG = {
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: '#fff',
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '4px',
    pointerEvents: 'none'
};

function truncateLabel(label, maxLength) {
    if (!label) return '';
    if (label.length > maxLength) {
        return label.substring(0, maxLength - 1) + '…';
    }
    return label;
}

function escv2(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function fmtv2(num) {
    return num.toLocaleString();
}

function chartCanvasId() {
    window.__dimChartSeq = (window.__dimChartSeq || 0) + 1;
    return `dimChart${window.__dimChartSeq}`;
}

function drawMultiBarChart(canvasId, labels, series, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const isHorizontal = options.isHorizontal || false;
    const isStacked = options.isStacked !== undefined ? options.isStacked : true;
    const unit = options.unit || '';

    // Lấy kích thước thực tế
    const rect = canvas.getBoundingClientRect();
    const containerHeight = rect.height || 300;
    const containerWidth = rect.width || 400;

    // Tính barThickness động
    let barThickness = 20;
    const spacingRatio = 0.2;
    if (isHorizontal && labels.length > 0) {
        const availableHeight = containerHeight - 50;
        barThickness = Math.floor(availableHeight / (labels.length * (1 + spacingRatio)));
        barThickness = Math.min(30, Math.max(4, barThickness));
    } else if (!isHorizontal && labels.length > 0) {
        const availableWidth = containerWidth - 50;
        barThickness = Math.floor(availableWidth / (labels.length * (1 + spacingRatio)));
        barThickness = Math.min(40, Math.max(4, barThickness));
    }

    // Chuẩn bị datasets với barThickness động
    const datasets = series.map((s, idx) => ({
        label: s.label,
        data: s.data,
        backgroundColor: s.color || getColor(idx),
        borderColor: s.color || getColor(idx),
        borderWidth: 1,
        barThickness: barThickness,
        borderRadius: 3
    }));

    let finalLabels = labels;
    let finalDatasets = datasets;
    let finalStacked = isStacked;

    if (labels.length === 1 && datasets.length > 1) {
        const total = datasets.reduce((sum, ds) => sum + ds.data[0], 0);
        finalDatasets = [{
            label: 'Tổng',
            data: [total],
            backgroundColor: '#2c7dd2',
            borderColor: '#2c7dd2',
            borderWidth: 1,
            barThickness: barThickness,
            borderRadius: 3
        }];
        finalStacked = false;
    }

    // Cấu hình ticks
    const tickConfig = {
        color: chartLabelColor(),
        font: { size: isHorizontal ? 10 : 9.5 },
        maxRotation: isHorizontal ? 0 : 45,
        minRotation: isHorizontal ? 0 : 30,
        autoSkip: false,
        callback: function (value) {
            let label = this.getLabelForValue(value);
            if (!label) return '';
            const maxLen = isHorizontal ? 30 : 18;
            return label.length > maxLen ? label.substring(0, maxLen - 1) + '…' : label;
        }
    };

    const scales = {
        x: {
            stacked: finalStacked,
            beginAtZero: true,
            grace: isHorizontal ? '15%' : 0,
            ticks: isHorizontal ? { color: chartAxisColor(), font: { size: 10.5 } } : tickConfig,
            grid: { display: isHorizontal ? true : false, color: chartGridColor() }
        },
        y: {
            stacked: finalStacked,
            beginAtZero: true,
            grace: isHorizontal ? 0 : '15%',
            ticks: isHorizontal ? tickConfig : { color: chartAxisColor(), font: { size: 11 } },
            grid: { display: isHorizontal ? false : true, color: chartGridColor() }
        }
    };

    if (isHorizontal) {
        scales.x.stacked = finalStacked;
        scales.x.grace = '15%';
        scales.x.ticks = { color: chartAxisColor(), font: { size: 10.5 } };
        scales.y.ticks = tickConfig;
        scales.y.grid = { display: false };
        scales.y.stacked = false;
        scales.y.grace = 0;
    }

    // --- Tạo plugin vẽ tổng khi stacked ---
    const plugins = [];
    if (finalStacked) {
        plugins.push({
            id: 'stackedTotalLabels',
            afterDraw: function (chart) {
                const { ctx, data, scales } = chart;
                const meta = chart.getDatasetMeta(0);
                if (!meta || !meta.data) return;

                // Tính tổng cho từng cột
                const totals = data.labels.map((_, i) => {
                    return data.datasets.reduce((sum, ds) => sum + (ds.data[i] || 0), 0);
                });

                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = (document.documentElement.classList.contains('theme-light') || document.documentElement.classList.contains('theme-green')) ? '#111827' : '#eaf6ff';

                // Vị trí vẽ tổng: trên cùng của cột
                const yScale = scales.y;
                const xScale = scales.x;
                meta.data.forEach((element, index) => {
                    const x = isHorizontal ? xScale.getPixelForValue(totals[index]) : element.x;
                    const y = isHorizontal ? element.y : yScale.getPixelForValue(totals[index]);
                    if (isHorizontal) {
                        // Thanh ngang: tổng nằm ở cuối thanh (bên phải)
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        const text = typeof fmt === 'function' ? fmt(totals[index]) : totals[index];
                        const textWidth = ctx.measureText(text).width;
                        let labelX = x + 4;
                        if (labelX + textWidth > chart.width - 4) {
                            labelX = Math.max(x - textWidth - 4, chart.width - textWidth - 4);
                        }
                        ctx.fillText(text, labelX, y);
                    } else {
                        // Thanh dọc: tổng nằm trên đỉnh cột
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        const labelY = Math.max(12, y - 4);
                        ctx.fillText(typeof fmt === 'function' ? fmt(totals[index]) : totals[index], x, labelY);
                    }
                });
                ctx.restore();
            }
        });
    }

    // --- Tạo Chart ---
    new Chart(ctx, {
        type: 'bar',
        data: { labels: finalLabels, datasets: finalDatasets },
        options: {
            indexAxis: isHorizontal ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            layout: {
                padding: {
                    top: isHorizontal ? 6 : 18,
                    right: isHorizontal ? 24 : 8,
                    bottom: 0,
                    left: 0
                }
            },
            scales: scales,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            let value = context.raw;
                            return label + ': ' + value + (unit ? ' ' + unit : '');
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: { color: chartLabelColor(), boxWidth: 11, font: { size: 9.5 } }
                },
                // Tắt hiển thị giá trị từng phần (nếu có plugin valueLabels)
                valueLabels: { display: false }
            }
        },
        plugins: plugins  // Thêm plugin vẽ tổng
    });
}

let chartQueue = [];
let isProcessing = false;

function queueDimChartV2(id, type, labels, series, options = {}) {
    if (!labels || !series || labels.length === 0 || series.length === 0) {
        console.warn(`Bỏ qua chart ${id} do thiếu dữ liệu`);
        return;
    }
    chartQueue.push({ id, type, labels, series, options });
    if (!isProcessing) processChartQueue();
}

function processChartQueue() {
    if (isProcessing || chartQueue.length === 0) return;
    isProcessing = true;
    // Hàng đợi được nạp trong lúc dựng chuỗi HTML, tức là trước khi innerHTML được gán.
    // Đợi hai khung hình để DOM commit + layout xong rồi vẽ cả lô trong một lượt.
    requestAnimationFrame(function () {
        requestAnimationFrame(drainChartQueue);
    });
}

/**
 * Vẽ toàn bộ hàng đợi trong một lượt.
 * Trước đây mỗi biểu đồ bị giãn 50ms và mỗi canvas chưa có trong DOM tốn thêm 100ms riêng,
 * nên drawer nhiều biểu đồ phải chờ hàng chục giây. Nay cả lô chỉ chia sẻ đúng một lần chờ 100ms.
 */
var chartLazyObserver = null;

/** Vẽ một mục đã nằm trong hàng đợi. */
function renderQueuedChart(item) {
    try {
        drawMultiBarChart(item.id, item.labels, item.series, item.options);
    } catch (e) {
        console.error('Lỗi vẽ chart ' + item.id + ':', e);
    }
}

/**
 * Observer vẽ biểu đồ khi canvas cuộn vào khung nhìn.
 * Trả null nếu trình duyệt không hỗ trợ — khi đó drain sẽ vẽ hết ngay như trước.
 */
function getChartLazyObserver() {
    if (chartLazyObserver) return chartLazyObserver;
    if (typeof IntersectionObserver !== 'function') return null;
    chartLazyObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            chartLazyObserver.unobserve(entry.target);
            var item = entry.target.__queuedChart;
            if (!item) return;
            entry.target.__queuedChart = null;
            renderQueuedChart(item);
        });
    }, { rootMargin: '300px' });
    return chartLazyObserver;
}

/**
 * Huỷ các Chart còn sống nhưng canvas đã bị gỡ khỏi DOM.
 * Drawer thay nội dung bằng innerHTML nên canvas cũ biến mất mà instance Chart.js
 * vẫn giữ ResizeObserver và listener — không huỷ thì rò rỉ dần theo mỗi lần mở lĩnh vực.
 */
function destroyDetachedCharts() {
    var ChartLib = chartGlobal();
    var instances = ChartLib && ChartLib.instances;
    if (!instances) return 0;
    var removed = 0;
    Object.keys(instances).forEach(function (key) {
        var chart = instances[key];
        var canvas = chart && chart.canvas;
        if (!canvas || document.documentElement.contains(canvas)) return;
        try { chart.destroy(); removed++; } catch (e) { }
    });
    return removed;
}

function drainChartQueue() {
    destroyDetachedCharts();

    var batch = chartQueue;
    chartQueue = [];
    var retry = [];
    var observer = getChartLazyObserver();
    var viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
    var viewportW = window.innerWidth || document.documentElement.clientWidth || 0;
    var margin = 300;

    // Đọc hết vị trí trước, vẽ sau. Vẽ xen kẽ với đo sẽ bắt trình duyệt reflow lại mỗi lần.
    var pending = [];
    batch.forEach(function (item) {
        var canvas = document.getElementById(item.id);
        if (!canvas) {
            // Mỗi biểu đồ được thử lại đúng một lần; sau đó coi như canvas không tồn tại.
            if (!item.__retried) { item.__retried = true; retry.push(item); }
            else console.warn('Canvas #' + item.id + ' không xuất hiện, bỏ qua');
            return;
        }
        var box = canvas.getBoundingClientRect();
        pending.push({
            item: item,
            canvas: canvas,
            near: box.bottom > -margin && box.top < viewportH + margin
                && box.right > -margin && box.left < viewportW + margin
        });
    });

    // Chỉ vẽ ngay phần đang nhìn thấy. Drawer chỉ tiêu có thể chứa trên 100 biểu đồ
    // trong khi khung nhìn chỉ chứa vài cái; vẽ hết một lượt sẽ chặn main thread ~200ms.
    pending.forEach(function (p) {
        if (!observer || p.near) {
            renderQueuedChart(p.item);
            return;
        }
        p.canvas.__queuedChart = p.item;
        observer.observe(p.canvas);
    });

    if (retry.length) {
        chartQueue = retry.concat(chartQueue);
        setTimeout(drainChartQueue, 100);
        return;
    }
    isProcessing = false;
    if (chartQueue.length) processChartQueue();
}

function ensureChartJs(callback) {
    function done() { if (typeof callback === 'function') callback(); }
    if (chartGlobal()) { done(); return Promise.resolve(chartGlobal()); }
    if (window.__chartJsLoadPromise) {
        return window.__chartJsLoadPromise.then(function () { done(); return chartGlobal(); });
    }
    window.__chartJsLoadPromise = new Promise(function (resolve, reject) {
        var head = realDomHead();
        var doc = head && head.ownerDocument;
        var existing = doc && doc.querySelector('script[data-ioc-chartjs]');
        if (existing) {
            existing.addEventListener('load', function () { resolve(chartGlobal()); });
            existing.addEventListener('error', function () { reject(new Error('Chart.js load failed')); });
            return;
        }
        var s = document.createElement('script');
        s.src = CHARTJS_CDN;
        s.async = true;
        s.dataset.iocChartjs = '1';
        s.onload = function () { resolve(chartGlobal()); };
        s.onerror = function () { reject(new Error('Không tải được Chart.js')); };
        (head || realDomHead() || document.documentElement || document.body).appendChild(s);
    });
    return window.__chartJsLoadPromise.then(function (C) { done(); return C; }).catch(function (err) {
        console.warn('[indicators]', err.message || err);
        setTimeout(function () {
            if (chartGlobal()) { done(); }
        }, 500);
    });
}

function runDrawerCharts(callback) {
    ensureChartJs(function () {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                if (typeof callback === 'function') callback();
            });
        });
    });
}

function apiCatItemCardHtml(datasetId, idx, it) {
    // console.log('it', it)
    const name = it.titleChart || 'Không tên';
    const total = it.dataChart.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const chartId = chartCanvasId();

    // ✅ Khai báo tất cả các biến cần dùng trước khi sử dụng
    const numItems = it.dataChart.length;
    const isHorizontal = it.typeChart === 'bar_horizontal';
    // console.log('isHorizontal', isHorizontal)
    const hasGroups = it.dataChart.some(d => d.groups && d.groups.length > 0);
    const containerHeight = isHorizontal ? Math.max(300, numItems * 30 + 50) : 210;
    const minWidth = isHorizontal ? '100%' : Math.max(400, numItems * 60 + 50) + 'px';
    const scrollStyle = isHorizontal ? 'overflow-y:auto;overflow-x:hidden;' : 'overflow-x:auto;overflow-y:hidden;';
    const innerStyle = isHorizontal ? 'height:100%;width:100%;' : 'min-width:' + minWidth + ';height:100%;';

    // console.log('scrollStyle', scrollStyle)

    let labels = [];
    let series = [];
    let isStacked = false;

    if (hasGroups) {
        // --- Chuẩn hóa tất cả về dạng có groups ---
        const groupLabelSet = new Set();
        it.dataChart.forEach(d => {
            if (d.groups && d.groups.length > 0) {
                d.groups.forEach(g => groupLabelSet.add(g.label));
            } else {
                groupLabelSet.add('Giá trị');
            }
        });
        const groupLabels = Array.from(groupLabelSet);

        series = groupLabels.map((gLabel, idx) => {
            const data = it.dataChart.map(d => {
                if (d.groups && d.groups.length > 0) {
                    const found = d.groups.find(g => g.label === gLabel);
                    return Number(found?.value) || 0;
                } else {
                    return (gLabel === 'Giá trị') ? (Number(d.value) || 0) : 0;
                }
            });
            return {
                label: gLabel,
                data: data,
                backgroundColor: chartColors[idx % chartColors.length],
                borderColor: chartColors[idx % chartColors.length],
                borderRadius: 3,
                maxBarThickness: isHorizontal ? 20 : 40
            };
        });

        labels = it.dataChart.map(d => d.label);
        isStacked = true;
    } else {
        // --- Không groups -> một series duy nhất ---
        labels = it.dataChart.map(d => d.label);
        const data = it.dataChart.map(d => Number(d.value) || 0);
        series = [{
            label: 'Giá trị',
            data: data,
            color: chartColors[0],
            backgroundColor: chartColors[0],
            borderColor: chartColors[0],
            borderRadius: 3,
            maxBarThickness: isHorizontal ? 20 : 40
        }];
        isStacked = false;
    }

    // Đẩy vào hàng đợi
    queueDimChartV2(chartId, 'bar', labels, series, {
        isStacked: isStacked,
        isHorizontal: isHorizontal,
        unit: it.uint || ''
    });

    if (total === 0) return ``

    // HTML
    const clickAttr = `onclick="event.stopPropagation();openChartTableModalForIndicator('${name.replace(/'/g, "\\'")}',${idx},'${datasetId}')"`;
    return `<button type="button" class="cat-item-row" data-title-chart="${escv2(name)}" onclick="openChartTableModalForIndicator('${name.replace(/'/g, "\\'")}',${idx},'${datasetId}')">
      <div class="field-category-meta">${it.uint ? `<span class="badge">${escv2(it.uint)}</span>` : ''}</div>
      <h4 title="${escv2(name)}">${escv2(name)}</h4>
      <div class="cat-item-chart-trigger" style="cursor:pointer" ${clickAttr} title="Click biểu đồ để mở bảng dữ liệu chi tiết">
        <div style="position:relative;height:${containerHeight}px;margin-top:8px;${scrollStyle}width:100%;">
          <div style="${innerStyle}">
            <canvas id="${chartId}" style="width:100%;height:100%;display:block;"></canvas>
          </div>
        </div>
        <div class="row" style="margin-top:8px"><span class="muted">Giá trị API </span><b class="metric mono">${fmtv2(total)}</b></div>
      </div>
    </button>`;
}


function handleCanvasHover(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const clickAreas = canvas.__clickAreas || [];
    let found = null;
    for (let area of clickAreas) {
        if (mouseX >= area.x && mouseX <= area.x + area.width &&
            mouseY >= area.y && mouseY <= area.y + area.height) {
            found = area;
            break;
        }
    }
    if (found) {
        canvas.style.cursor = 'pointer';
        showTooltip(e.clientX, e.clientY, found, canvas);
    } else {
        canvas.style.cursor = 'default';
        hideTooltip();
    }
}
// ========== TOOLTIP ==========
let tooltipEl = null;

function getTooltipElement() {
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.style.position = 'fixed';
        tooltipEl.style.backgroundColor = TOOLTIP_CONFIG.backgroundColor;
        tooltipEl.style.color = TOOLTIP_CONFIG.color;
        tooltipEl.style.fontSize = TOOLTIP_CONFIG.fontSize;
        tooltipEl.style.padding = TOOLTIP_CONFIG.padding;
        tooltipEl.style.borderRadius = TOOLTIP_CONFIG.borderRadius;
        tooltipEl.style.pointerEvents = TOOLTIP_CONFIG.pointerEvents;
        tooltipEl.style.zIndex = 9999;
        document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
}

function showTooltip(x, y, data, canvas) {
    const el = getTooltipElement();
    const unit = canvas.__tooltipData?.unit || '';
    el.innerHTML = `
    <strong>${data.label}</strong><br>
    ${data.seriesLabel}: ${data.value} ${unit}
  `;
    el.style.display = 'block';
    // Đặt vị trí (tránh tràn màn hình)
    let left = x + 12;
    let top = y - 10;
    if (left + el.offsetWidth > window.innerWidth) left = x - el.offsetWidth - 12;
    if (top + el.offsetHeight > window.innerHeight) top = window.innerHeight - el.offsetHeight - 10;
    if (top < 10) top = 10;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
}

function hideTooltip() {
    if (tooltipEl) {
        tooltipEl.style.display = 'none';
    }
}


function flushPendingDimCharts() {
    var ChartLib = chartGlobal();
    // Nếu Chart.js chưa sẵn sàng, thử lại sau 200ms (tối đa 5 lần)
    if (!ChartLib) {
        if (!window.__chartRetryCount) window.__chartRetryCount = 0;
        if (window.__chartRetryCount < 5) {
            window.__chartRetryCount++;
            setTimeout(flushPendingDimCharts, 200);
            return;
        }
        console.warn('Chart.js not available after retries');
        return;
    }
    window.__chartRetryCount = 0;

    // Xử lý queue cũ (doughnut, bar đơn)
    var list = window.__pendingDimCharts || [];
    window.__pendingDimCharts = [];
    list.forEach(function (c) {
        var canvas = document.getElementById(c.id);
        if (!canvas) return;
        try {
            new ChartLib(canvas, {
                type: c.type,
                data: {
                    labels: c.labels,
                    datasets: [{ data: c.data, backgroundColor: c.colors, borderRadius: 4, maxBarThickness: 26 }]
                },
                options: {
                    indexAxis: c.type === 'doughnut' ? undefined : 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: c.type === 'doughnut', position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 13, padding: 8, font: { size: 12, weight: 700 } } }
                    },
                    scales: c.type === 'doughnut' ? {} : {
                        x: { ticks: { color: chartAxisColor(), font: { size: 10.5 } }, grid: { color: chartGridColor() } },
                        y: { ticks: { color: chartLabelColor(), font: { size: 11 } }, grid: { display: false } }
                    }
                }
            });
        } catch (e) {
            console.error('Error drawing chart:', e);
        }
    });

    // Xử lý queue mixed (được thêm bởi queueMixedChart)
    var mixed = window.__pendingMixedCharts || [];
    window.__pendingMixedCharts = [];
    mixed.forEach(function (item) {
        var canvas = document.getElementById(item.id);
        if (!canvas) return;
        try {
            new ChartLib(canvas, item.config);
        } catch (e) {
            console.error('Error drawing mixed chart:', e);
        }
    });
}
/* ============================== NHẬP CHỈ TIÊU TỪ FILE EXCEL ============================== */
(function () {
    const COLOR_PALETTE_ICT = ["#2563EB", "#16A34A", "#F59E0B", "#7C3AED", "#06B6D4", "#DC2626", "#6B7280"];
    const KHOI_TW_PREFIXES_ICT = ["đảng bộ", "đảng ủy", "quân ủy", "công an trung ương"];

    function ictSlugify(text) {
        return text.normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D")
            .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
    }
    function ictClassifyDonVi(ten) {
        const t = ten.trim().toLowerCase();
        if (t === "tổng" || t === "trung ương" || t === "trung ương (tổng số)") return "trung_uong";
        if (KHOI_TW_PREFIXES_ICT.some((p) => t.startsWith(p))) return "khoi_tw";
        return "tinh_thanh";
    }
    // Quy tắc: >=4 hạng mục HOẶC có hạng mục nào <8% tổng -> bar; ngược lại -> donut
    // Quy tắc chọn loại biểu đồ theo số hạng mục (n = số giá trị phân tổ):
    // n <= 1 -> không vẽ chart, chỉ hiển thị số liệu (kpi_only)
    // n = 2  -> biểu đồ tròn (donut)
    // n = 3-4 -> biểu đồ cột dọc (bar_v)
    // n >= 5 -> biểu đồ cột ngang (bar_h)
    function ictChooseChartType(values) {
        const vals = values.filter((v) => v !== null && v !== undefined);
        const n = vals.length;
        if (n <= 1) return "kpi_only";
        if (n < 3) return "donut";
        if (n < 5) return "bar_v";
        return "bar_h";
    }
    // Chuẩn hoá nhãn header để so khớp không phân biệt hoa/thường, dấu, khoảng trắng thừa và dấu ":" cuối
    // ("Trong đó" / "Trong đó:", "Chia ra" / "Chia ra:", "Tổng số" / "Tổng \r số")
    function ictNormalizeLabel(s) {
        return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/đ/gi, "d").replace(/\s+/g, " ").trim().toLowerCase().replace(/:+$/, "").trim();
    }
    // "Trong đó"/"Chia ra" (có/không dấu ":") đều là nhãn tổ chức thuần tuý (wrapper), không mang ý nghĩa
    // riêng — dùng để đánh dấu 1 nhóm phân tổ (breakdown) thật sự cần tách thành biểu đồ
    function ictIsTrongDo(name) { const n = ictNormalizeLabel(name); return n === "trong do" || n === "chia ra"; }
    function ictIsTongSo(name) { return ictNormalizeLabel(name) === "tong so"; }
    // Nhánh có TÊN RIÊNG kết thúc bằng "..., chia ra:"/"..., trong đó:" (vd "Lãnh đạo, quản lý và lao
    // động trong các doanh nghiệp, chia ra:") là 1 chỉ số độc lập, khác với wrapper thuần "Chia ra"/
    // "Trong đó" — bản thân tên đã tự giới thiệu phần chia nhỏ ngay sau, nên khi gộp làm 1 box ở card
    // cha thì KHÔNG cần vẽ thêm biểu đồ phân tổ (tránh 1 box giữa nhiều box khác lại có riêng 1 chart).
    function ictEndsWithWrapperWord(name) {
        const n = ictNormalizeLabel(name);
        return /(^|\s)(trong do|chia ra)$/.test(n);
    }

    // Dựng cây phân cấp chỉ tiêu từ đường dẫn header nhiều tầng của từng cột dữ liệu
    function ictBuildIndicatorTree(colPaths) {
        const root = { name: null, children: {}, colIdx: null };
        for (const p of colPaths) {
            let node = root;
            for (const label of p.levels) {
                if (!node.children[label]) node.children[label] = { name: label, children: {}, colIdx: null };
                node = node.children[label];
            }
            node.colIdx = p.colIdx;
        }
        return root;
    }
    // Trị số của 1 node theo 1 hàm lấy giá trị cột lá (getLeafValue) dùng chung cho cả tổng toàn quốc
    // lẫn giá trị theo từng đơn vị: ưu tiên con "Tổng số" nếu có, ngược lại cộng dồn các con
    // (dùng cho các nhãn tổ chức như "Trong đó" không có cột riêng)
    function ictResolveNodeValue(node, getLeafValue) {
        if (node.colIdx != null) return getLeafValue(node.colIdx) || 0;
        const keys = Object.keys(node.children);
        if (!keys.length) return 0;
        const tongKey = keys.find((k) => ictIsTongSo(k));
        if (tongKey) return ictResolveNodeValue(node.children[tongKey], getLeafValue);
        return keys.reduce((sum, k) => sum + ictResolveNodeValue(node.children[k], getLeafValue), 0);
    }
    function ictNodeValue(node, columnTotals) {
        return ictResolveNodeValue(node, (idx) => columnTotals[idx] || 0);
    }
    // Với các con của 1 node: nhãn phụ trực tiếp -> hiển thị dạng box số liệu;
    // nhãn "Trong đó: ..." -> tách thành 1 biểu đồ phân tổ riêng;
    // đúng 1 nhánh con có breakdown riêng -> gộp vào box (kèm nội dung con của nó);
    // từ 2 nhánh con có breakdown trở lên -> tách thành 1 biểu đồ so sánh, mỗi nhánh có card riêng
    // Trả về `items`: 1 MẢNG DUY NHẤT, thứ tự đúng như cột gốc trong Excel, mỗi phần tử là
    // { kind:'box', name, value, node } hoặc { kind:'chart', label, items:[...], hidden? } — dùng chung
    // 1 mảng (thay vì 2 mảng boxItems/chartGroups tách rời) để không mất thứ tự thật khi box và chart
    // xen kẽ nhau (vd 1 nhánh có nhiều box con RỒI MỚI tới 1 chart, nếu tách 2 mảng sẽ không biết chart
    // đó phải chèn sau box con cuối cùng nào).
    function ictCollectCardContent(node, columnTotals) {
        const items = [];
        const nestedCards = [];
        const entries = Object.entries(node.children);
        const branchEntries = entries.filter(([name, n]) => !ictIsTrongDo(name) && Object.keys(n.children).length > 0);
        // ≥2 nhánh con có breakdown riêng -> KHÔNG BAO GIỜ tách thành card riêng (dù node còn có leaf
        // độc lập khác cùng cấp hay không) — tất cả con (leaf lẫn nhánh) đều là các thành phần của CÙNG
        // 1 chỉ tiêu, gộp chung thành 1 biểu đồ cột so sánh duy nhất (giá trị mỗi cột = giá trị riêng của
        // leaf, hoặc "Tổng số"/tổng cộng dồn của nhánh nếu nhánh không có cột riêng — không cần phải có
        // "Tổng số" mới gộp được). Muốn xem chi tiết bên trong 1 nhánh thì xem BẢNG BÁO CÁO (luôn mirror
        // đầy đủ cấu trúc Excel khi có so sánh nhánh, xem `useFullTable`/`ictFullReportTableHtml`), không
        // phải tách thành card riêng hay xem lồng trong card.
        const multiBranch = branchEntries.length >= 2;

        // Duyệt đúng theo thứ tự cột gốc trong Excel để box/biểu đồ hiển thị (và sau này lên bảng báo
        // cáo) giữ nguyên đúng vị trí như file nguồn — không dồn nhánh có breakdown xuống cuối.
        for (const [name, n] of entries) {
            if (ictIsTrongDo(name)) {
                const tdChildren = Object.entries(n.children);
                // "Tổng số" đôi khi nằm lẫn trong chính danh sách con của wrapper (vd "Chia ra" → Tổng số,
                // Phó Giáo sư, Giáo sư) — đây là tổng của các mục còn lại chứ không phải 1 hạng mục ngang
                // hàng, nên tách riêng ra làm box thay vì đưa chung vào biểu đồ phân tổ.
                const tongSoChild = tdChildren.find(([cn]) => ictIsTongSo(cn));
                if (tongSoChild) items.push({ kind: 'box', name: tongSoChild[0], value: ictNodeValue(tongSoChild[1], columnTotals), node: tongSoChild[1] });
                const grpItems = tdChildren.filter(([cn]) => !ictIsTongSo(cn)).map(([gname, gnode]) => ({ name: gname, value: ictNodeValue(gnode, columnTotals), node: gnode }));
                // Gắn nhãn = tên của chính node cha (vd "Nghề nghiệp", "Lãnh đạo...chia ra:") để bảng báo
                // cáo có thể gộp các cột con này dưới 1 header cha đúng như cấu trúc gốc trong Excel.
                if (grpItems.length === 1) items.push({ kind: 'box', ...grpItems[0] });
                else if (grpItems.length > 1) items.push({ kind: 'chart', label: node.name, items: grpItems });
                continue;
            }
            if (multiBranch) continue; // ≥2 nhánh: TOÀN BỘ con (leaf lẫn nhánh) xử lý chung 1 lần sau vòng lặp (chart so sánh, xem dưới)
            const hasChildren = Object.keys(n.children).length > 0;
            if (!hasChildren) {
                items.push({ kind: 'box', name, value: ictNodeValue(n, columnTotals), node: n });
                continue;
            }
            // Đúng 1 nhánh con có breakdown riêng -> gộp vào box (kèm nội dung con của nó), giữ đúng vị trí
            // Nếu nhánh có sẵn 1 con tên "Tổng số" thì giá trị đó CHÍNH LÀ giá trị vừa gán cho box ở trên
            // (box lấy qua ictNodeValue ưu tiên con "Tổng số") — loại bỏ để tránh hiện trùng 2 box cùng
            // giá trị (1 tên theo nhánh, 1 tên "Tổng số"). Nếu nhánh KHÔNG có cột/con "Tổng số" nào cả
            // (giá trị box chỉ là TỔNG CỘNG DỒN từ các con, không ứng với 1 cột thật nào trong Excel) thì
            // đánh dấu `synthetic: true` — bảng báo cáo sẽ bỏ qua cột này (không có trong Excel gốc),
            // nhưng card vẫn hiển thị bình thường (tiện xem tổng nhanh).
            const nTongSoKey = Object.keys(n.children).find((k) => ictIsTongSo(k));
            const tongSoNode = nTongSoKey ? n.children[nTongSoKey] : null;
            const isSynthetic = n.colIdx == null && !tongSoNode;
            items.push({ kind: 'box', name, value: ictNodeValue(n, columnTotals), node: n, synthetic: isSynthetic });
            const inner = ictCollectCardContent(n, columnTotals);
            // Nhánh tự giới thiệu breakdown ngay trong tên (vd "...chia ra:") -> chỉ giữ 1 box, KHÔNG vẽ
            // thêm biểu đồ phân tổ cho card này (dữ liệu con vẫn giữ lại cho bảng báo cáo, hiển thị dạng
            // cột phẳng không gộp header cha, đánh dấu qua `hidden`).
            const suppressChart = ictEndsWithWrapperWord(name);
            inner.items.forEach((it) => {
                if (it.kind === 'box' && tongSoNode && it.node === tongSoNode) return; // loại box "Tổng số" trùng
                items.push(it.kind === 'chart' && suppressChart ? { ...it, hidden: true } : it);
            });
            nestedCards.push(...inner.nestedCards);
        }

        if (multiBranch) {
            // Gộp TẤT CẢ con (leaf lẫn nhánh, không tính wrapper đã xử lý riêng ở trên) thành 1 biểu đồ
            // cột so sánh duy nhất, đúng thứ tự cột gốc trong Excel.
            const cmpItems = entries
                .filter(([name]) => !ictIsTrongDo(name))
                .map(([ename, enode]) => ({ name: ename, value: ictNodeValue(enode, columnTotals), node: enode }));
            items.push({ kind: 'chart', label: null, items: cmpItems });
        }

        return { items, nestedCards, hasBranchComparison: multiBranch };
    }
    // Duyệt các chỉ tiêu cấp cao nhất, mỗi nhánh con có breakdown riêng sẽ tự tách thành 1 "chỉ tiêu" (card) độc lập
    function ictBuildIndicatorCards(tree, topLevelNames, columnTotals) {
        const cards = [];
        function pushCard(title, node) {
            const hasChildren = Object.keys(node.children).length > 0;
            if (!hasChildren) {
                cards.push({ ten_widget: title, total: ictNodeValue(node, columnTotals), boxItems: [], chartGroups: [], items: [], node, hasNestedCards: false, useFullTable: false });
                return;
            }
            const content = ictCollectCardContent(node, columnTotals);
            // boxItems/chartGroups (tách rời, giữ đúng thứ tự trong từng loại) dùng cho hiển thị card;
            // `items` (đúng thứ tự thật, box và chart xen kẽ) dùng riêng cho bảng báo cáo.
            const boxItems = content.items.filter((it) => it.kind === 'box');
            const chartGroups = content.items.filter((it) => it.kind === 'chart').map((it) => ({ label: it.label, items: it.items, hidden: it.hidden }));
            // `hasNestedCards`: card này có tách ra thêm card con riêng hay không (chỉ khi ≥2 nhánh VÀ
            // còn leaf khác cùng cấp). `useFullTable`: hễ chart của card là 1 biểu đồ so sánh nhánh (≥2
            // nhánh, DÙ CÓ TÁCH CARD HAY KHÔNG) thì bảng báo cáo của CHÍNH card này luôn hiển thị đầy đủ
            // toàn bộ cột gốc theo đúng cấu trúc nhiều tầng trong Excel (xem ictFullReportTableHtml),
            // không chỉ vài cột tổng hợp — vì chart đã đơn giản hoá, bảng cần bù lại phần chi tiết đó.
            const hasNestedCards = content.nestedCards.length > 0;
            const useFullTable = content.hasBranchComparison;
            cards.push({ ten_widget: title, total: ictNodeValue(node, columnTotals), boxItems, chartGroups, items: content.items, node, hasNestedCards, useFullTable });
            content.nestedCards.forEach((nc) => pushCard(`${title} - ${nc.title}`, nc.node));
        }
        topLevelNames.forEach((name) => pushCard(name, tree.children[name]));
        return cards;
    }
    function ictExtractKyBaoCao(titleText) {
        if (!titleText) return null;
        let m = titleText.match(/(\d)\s*THÁNG ĐẦU NĂM\s+(\d{4})/i);
        if (m) return `${m[2]}-H1`;
        m = titleText.match(/NĂM\s+(\d{4})/i);
        if (m) return m[1];
        return null;
    }

    // --- Đọc dữ liệu trực tiếp từ worksheet SheetJS (ws['!ref'], ws['!merges']) ---
    function ictCellVal(ws, r, c) {
        const addr = XLSX.utils.encode_cell({ r: r - 1, c: c - 1 });
        const cell = ws[addr];
        if (!cell) return null;
        if (cell.t === "n") return cell.v;
        if (cell.t === "s" || cell.t === "str") return cell.v;
        return cell.v ?? null;
    }
    function ictSheetDims(ws) {
        const ref = XLSX.utils.decode_range(ws["!ref"]);
        return { maxRow: ref.e.r + 1, maxCol: ref.e.c + 1 };
    }
    function ictSheetMerges(ws) {
        return (ws["!merges"] || []).map((m) => [m.s.r + 1, m.s.c + 1, m.e.r + 1, m.e.c + 1]);
    }
    function ictFindHeaderAndDataStart(ws, maxRow, maxCol, maxScanRows = 15) {
        let dataStart = null;
        for (let r = 1; r <= Math.min(maxScanRows, maxRow); r++) {
            const stt = ictCellVal(ws, r, 1);
            const unit = ictCellVal(ws, r, 2);
            if (typeof stt === "number" && typeof unit === "string" && unit.length > 3) { dataStart = r; break; }
        }
        if (dataStart === null) throw new Error("Không dò được dòng dữ liệu đầu tiên (cột A=số, cột B=tên đơn vị dạng chữ). Kiểm tra lại sheet đã chọn.");
        let headerStart = dataStart - 1;
        for (let r = dataStart - 1; r >= 1; r--) {
            let hasContent = false;
            for (let c = 3; c <= maxCol; c++) { if (ictCellVal(ws, r, c) !== null) { hasContent = true; break; } }
            if (!hasContent) break;
            headerStart = r;
        }
        return [headerStart, dataStart];
    }
    function ictReadSheet(ws, log) {
        const { maxRow, maxCol } = ictSheetDims(ws);
        const merges = ictSheetMerges(ws);

        let titleText = "", maBieu = null;
        for (let r = 1; r <= Math.min(8, maxRow); r++) {
            for (let c = 1; c <= maxCol; c++) {
                const v = ictCellVal(ws, r, c);
                if (typeof v === "string") {
                    titleText += " " + v;
                    if (!maBieu && /Biểu\s*(số)?\s*\d/i.test(v)) maBieu = v.trim();
                }
            }
        }
        const kyBaoCao = ictExtractKyBaoCao(titleText);
        const [headerStart, dataStart] = ictFindHeaderAndDataStart(ws, maxRow, maxCol);
        log(`Vùng header: dòng ${headerStart}–${dataStart - 1}; dữ liệu bắt đầu dòng ${dataStart}.`, "ok");

        const headerRows = [];
        for (let r = headerStart; r < dataStart; r++) headerRows.push(r);
        const matrix = headerRows.map((r) => {
            const row = [];
            for (let c = 1; c <= maxCol; c++) row.push(ictCellVal(ws, r, c));
            return row;
        });

        const rowIndexOf = {};
        headerRows.forEach((r, i) => (rowIndexOf[r] = i));
        let mergeFixCount = 0;
        for (const [r1, c1, r2, c2] of merges) {
            if (r1 > headerRows[headerRows.length - 1] || r2 < headerRows[0]) continue;
            const anchor = ictCellVal(ws, r1, c1);
            if (anchor === null || anchor === "") continue;
            for (let r = Math.max(r1, headerRows[0]); r <= Math.min(r2, headerRows[headerRows.length - 1]); r++) {
                if (!(r in rowIndexOf)) continue;
                const ri = rowIndexOf[r];
                for (let c = c1; c <= c2; c++) { if (c - 1 < maxCol) { matrix[ri][c - 1] = anchor; mergeFixCount++; } }
            }
        }
        log(`Đã unmerge ${merges.length} vùng merge trong file, áp dụng ${mergeFixCount} ô trong vùng header.`, "ok");

        for (let c = 0; c < maxCol; c++) {
            let last = null;
            for (const row of matrix) {
                if (row[c] !== null && row[c] !== "") last = row[c];
                else if (last !== null) row[c] = last;
            }
        }

        const colPaths = [];
        for (let c = 2; c < maxCol; c++) {
            const levels = [];
            for (const row of matrix) {
                const v = row[c];
                // Gộp mọi xuống dòng/khoảng trắng thừa (\r, \n, nhiều dấu cách liên tiếp do Excel wrap
                // text) thành 1 khoảng trắng TRƯỚC khi so khớp trùng lặp — nếu không, cùng 1 nhãn xuất
                // hiện qua nhiều dòng header (do merge/forward-fill) có thể bị coi là khác nhau và bị
                // đẩy vào làm nhiều tầng lồng nhau thay vì gộp thành 1 tầng duy nhất.
                const cleaned = v !== null && v !== "" ? String(v).replace(/\s+/g, " ").trim() : "";
                if (cleaned && !levels.includes(cleaned)) levels.push(cleaned);
            }
            if (levels.length) colPaths.push({ colIdx: c + 1, levels });
        }
        log(`Xác định được ${colPaths.length} cột chỉ tiêu con từ header.`, "ok");

        const factRecords = [];
        const unitSourceRows = [];
        const columnTotals = {};
        const unitColumnValues = {};
        for (let r = dataStart; r <= maxRow; r++) {
            const stt = ictCellVal(ws, r, 1);
            const unit = ictCellVal(ws, r, 2);
            if (typeof unit !== "string" || !unit.trim()) continue;
            if (typeof stt !== "number") continue;
            const tenDonVi = unit.trim();
            unitSourceRows.push({ sourceRow: r, name: tenDonVi });
            const colValues = unitColumnValues[tenDonVi] || (unitColumnValues[tenDonVi] = {});
            for (const cp of colPaths) {
                const val = ictCellVal(ws, r, cp.colIdx);
                if (typeof val !== "number") continue;
                columnTotals[cp.colIdx] = (columnTotals[cp.colIdx] || 0) + val;
                colValues[cp.colIdx] = (colValues[cp.colIdx] || 0) + val;
                const chiTieu = cp.levels[0];
                const rest = cp.levels.slice(1);
                let breakdownLabel = null;
                if (rest.length && !(rest.length === 1 && rest[0].trim().toLowerCase().startsWith("tổng"))) {
                    breakdownLabel = rest.join(" – ");
                }
                factRecords.push({ tenDonVi, chiTieu, breakdownLabel, giaTri: val });
            }
        }
        log(`Trích được ${factRecords.length} bản ghi dữ liệu (fact records).`, "ok");
        return { maBieu, kyBaoCao, factRecords, colPaths, columnTotals, unitColumnValues, unitSourceRows };
    }
    function ictBuildReportTable(factRecords) {
        const byUnit = {};
        for (const rec of factRecords) {
            byUnit[rec.tenDonVi] = byUnit[rec.tenDonVi] || {};
            const bucket = byUnit[rec.tenDonVi];
            bucket[rec.chiTieu] = bucket[rec.chiTieu] || { tong: 0, hasTong: false, childSum: 0 };
            if (rec.breakdownLabel === null) { bucket[rec.chiTieu].tong += rec.giaTri; bucket[rec.chiTieu].hasTong = true; }
            else bucket[rec.chiTieu].childSum += rec.giaTri;
        }
        const rows = Object.entries(byUnit).map(([tenDonVi, chiTieuMap]) => {
            const chiTieu = {};
            for (const [k, v] of Object.entries(chiTieuMap)) chiTieu[k] = v.hasTong ? v.tong : v.childSum;
            return { ma_don_vi: ictSlugify(tenDonVi), ten_don_vi: tenDonVi, cap_don_vi: ictClassifyDonVi(tenDonVi), chi_tieu: chiTieu };
        });
        rows.sort((a, b) => {
            const ta = a.cap_don_vi !== "trung_uong", tb = b.cap_don_vi !== "trung_uong";
            if (ta !== tb) return ta ? 1 : -1;
            return a.ten_don_vi.localeCompare(b.ten_don_vi, "vi");
        });
        let i = 1;
        for (const row of rows) row.stt = row.cap_don_vi !== "trung_uong" ? i++ : null;
        return rows;
    }
    /* ============================== LƯU DỮ LIỆU IMPORT EXCEL LÊN API ==============================
       Sau khi xử lý xong 1 file Excel (ictProcess), lưu toàn bộ result đã dựng lên
       /api/v1/trung-uong/data (POST). indicatorKey lấy theo ictActiveIndicatorKey — id của chỉ tiêu
       đang mở sẵn trên drawer TỪ TRƯỚC khi bấm "+ Nhập chỉ tiêu" (KHÔNG lấy theo tên/nội dung nhận
       diện được từ file Excel); year/months lấy từ 2 select Năm/Mốc thời gian trong modal nhập (không
       chọn gì ở Mốc thời gian thì gửi đủ 12 tháng). */
    var ICT_SAVE_DATA_API = 'https://administrator.lifetex.vn:324/api/v1/trung-uong/data';

    // Tái dùng drawerFilterMonthsFromMoc(moc) (khai báo global, cùng logic m<N>/q<N>/k1/k2 với bộ lọc
    // ở drawer) — chỉ khác là khi không chọn gì thì API lưu này cần gửi đủ "1,...,12", không được bỏ
    // qua field months như bên bộ lọc (query).
    function ictMonthsFromMoc(moc) {
        return drawerFilterMonthsFromMoc(moc) || Array.from({ length: 12 }, function (_, i) { return i + 1; }).join(',');
    }

    function ictSaveImportedData(result, nam, moc) {
        if (!ictActiveIndicatorKey) {
            console.warn('[ict] Không xác định được indicatorKey của chỉ tiêu đang mở trên drawer — huỷ lưu.');
            toast('Không xác định được chỉ tiêu đang mở trên dashboard — không thể lưu dữ liệu.');
            return Promise.resolve(null);
        }
        var body = {
            indicatorKey: ictActiveIndicatorKey,
            year: Number(nam),
            months: ictMonthsFromMoc(moc),
            data: JSON.stringify(result),
        };
        var headers = { Accept: 'application/json', 'Accept-Language': 'vi', 'Content-Type': 'application/json' };
        /* Dùng chung file dev-auth.local.js (category-details/) nếu có — không commit. */
        var devAuth = window.INDICATOR_REPORTS_DEV_AUTH;
        if (devAuth && devAuth.authorization) headers.Authorization = devAuth.authorization;
        console.info('[ict] POST', ICT_SAVE_DATA_API,
            { indicatorKey: body.indicatorKey, year: body.year, months: body.months },
            devAuth ? '(có Authorization dev)' : '(không có Authorization)');
        ictSaveStatus = 'saving';
        ictUpdateSaveButtons();
        return fetch(ICT_SAVE_DATA_API, {
            method: 'POST',
            cache: 'no-store',
            headers: headers,
            body: JSON.stringify(body),
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status + ' — ' + ICT_SAVE_DATA_API);
            return response.json().catch(function () { return null; });
        }).then(function (json) {
            ictSaveStatus = 'saved';
            ictUpdateSaveButtons();
            ictLog('Đã lưu dữ liệu import lên hệ thống.', 'ok');
            toast('Đã lưu dữ liệu import thành công.');
            return json;
        }).catch(function (err) {
            ictSaveStatus = 'idle';
            ictUpdateSaveButtons();
            if (err instanceof TypeError) {
                console.error('[ict] Request bị chặn trước khi tới server (CORS/network):', ICT_SAVE_DATA_API, err);
            }
            console.warn('[ict] Lưu dữ liệu lên API thất bại, dữ liệu vẫn hiển thị ở drawer bình thường:', err.message || err);
            ictLog('Lưu API thất bại: ' + (err.message || err), 'err');
        });
    }

    function ictBuildDashboardJSON(ws, opts, log) {
        const { maBieu, kyBaoCao, factRecords, colPaths, columnTotals, unitColumnValues, unitSourceRows } = ictReadSheet(ws, log);
        const tree = ictBuildIndicatorTree(colPaths);
        let topLevelNames = Object.keys(tree.children);
        if (opts.topN) {
            const totals = topLevelNames.map((name) => [name, ictNodeValue(tree.children[name], columnTotals)]);
            totals.sort((a, b) => b[1] - a[1]);
            topLevelNames = totals.slice(0, opts.topN).map((x) => x[0]);
        }
        const cards = ictBuildIndicatorCards(tree, topLevelNames, columnTotals);
        const reportTable = ictBuildReportTable(factRecords);
        reportTable.forEach((row) => { row.col_values = unitColumnValues[row.ten_don_vi] || {}; });
        log(`Đã dựng ${cards.length} chỉ tiêu (card) và ${reportTable.length} đơn vị trong bảng báo cáo.`, "ok");
        return {
            ten_linh_vuc: opts.tenLinhVuc || maBieu || "Chưa đặt tên",
            ma_bieu_nguon: maBieu,
            ky_bao_cao: opts.kyBaoCaoOverride || kyBaoCao,
            so_luong_chi_tieu: cards.length,
            so_ban_ghi: factRecords.length,
            chi_tieu_chinh: topLevelNames,
            bieu_do_chi_tieu: cards,
            bang_bao_cao_don_vi: reportTable,
            unit_record_counts: window.IndicatorImportCounts.build(unitSourceRows),
        };
    }

    /* ---------- UI: modal nhập chỉ tiêu từ Excel, kết quả hiển thị vào drawer ---------- */
    let ictWorkbook = null, ictFileName = "", ictLastResult = null;
    // Kỳ báo cáo (Năm/Quý/Tháng) đã chọn tại lúc xử lý — lưu lại để dùng cho "Hiển thị vào danh sách"
    // và "Lưu dữ liệu" sau đó, không đọc lại DOM để tránh lệch nếu user đổi select mà chưa xử lý lại.
    let ictLastPeriod = null; // { nam, moc } — moc: '' | 'm<1-12>' | 'q<1-4>' | 'k1' | 'k2'
    let ictSaveStatus = 'idle'; // 'idle' | 'saving' | 'saved'
    // indicatorKey THẬT dùng khi lưu — chính là id (TCD_ITEMS[i][5]) của chỉ tiêu đang mở trên
    // drawer từ trước khi bấm "+ Nhập chỉ tiêu" (window.__activeDrawerIndicatorKey, set bởi
    // van-phong-ban-to-chuc-dang.js openPopup()) — KHÔNG lấy theo tên/nội dung nhận diện từ file Excel.
    let ictActiveIndicatorKey = null;

    function ictHasPeriodSelected() {
        return !!(ictLastPeriod && ictLastPeriod.moc);
    }

    // Đọc lại Năm/Mốc thời gian hiện tại trên form (DOM vẫn còn trong modalBody kể cả sau closeModal())
    // rồi cập nhật ictLastPeriod — gọi trước khi validate ở "Hiển thị vào danh sách"/"Lưu dữ liệu" để
    // luôn khớp với lựa chọn mới nhất của user, tránh dùng snapshot cũ từ lúc bấm "Xử lý dữ liệu".
    function ictSyncPeriodFromForm() {
        const namEl = document.getElementById('ictNam');
        const mocEl = document.getElementById('ictMoc');
        if (!namEl) return; // modalBody đã bị thay nội dung khác -> giữ nguyên snapshot cũ
        ictLastPeriod = { nam: namEl.value, moc: mocEl ? mocEl.value : '' };
    }

    function ictUpdateSaveButtons() {
        document.querySelectorAll('.ict-save-btn').forEach((btn) => {
            if (ictSaveStatus === 'saved') {
                btn.disabled = true;
                btn.textContent = '✓ Đã lưu';
            } else if (ictSaveStatus === 'saving') {
                btn.disabled = true;
                btn.textContent = 'Đang lưu...';
            } else {
                btn.disabled = false;
                btn.textContent = '💾 Lưu dữ liệu';
            }
        });
    }

    function ictLog(msg, kind) {
        const panel = document.getElementById('ictLogPanel');
        const out = document.getElementById('ictLogOut');
        if (!panel || !out) return;
        panel.style.display = 'block';
        const span = document.createElement('div');
        span.style.color = kind === 'err' ? '#ef4444' : kind === 'warn' ? '#d8a50c' : '#39d5ff';
        span.textContent = '› ' + msg;
        out.appendChild(span);
        out.scrollTop = out.scrollHeight;
    }

    // Danh sách năm để chọn kỳ báo cáo thủ công: từ (năm hiện tại - 3) tới (năm hiện tại + 1), mặc định
    // chọn sẵn năm hiện tại.
    function ictYearOptionsHtml() {
        const now = new Date().getFullYear();
        const years = [];
        for (let y = now + 1; y >= now - 3; y--) years.push(y);
        return years.map((y) => `<option value="${y}"${y === now ? ' selected' : ''}>${y}</option>`).join('');
    }
    function ictModalHtml() {
        return `
        <div class="detail-card">
            <h4>1. Chọn file Excel</h4>
            <div id="ictDropzone" onclick="document.getElementById('ictFileInput').click()"
                style="border:1.5px dashed rgba(87,178,255,.35);border-radius:12px;padding:26px 16px;text-align:center;cursor:pointer;background:rgba(87,178,255,.05)">
                <div style="font-size:24px;margin-bottom:6px">📂</div>
                <div>Kéo thả file .xlsx vào đây, hoặc bấm để chọn file</div>
                <div class="muted" style="font-size:11.5px;margin-top:4px">Chấp nhận .xlsx / .xls — cột A = TT, cột B = Tên đơn vị</div>
                <input type="file" id="ictFileInput" accept=".xlsx,.xls" style="display:none" onchange="ictHandleFile(this.files[0])" />
            </div>
            <div class="muted mono" id="ictFileMeta" style="margin-top:10px;font-size:12px"></div>
            <div id="ictSheetControls" style="display:none;margin-top:14px">
                <div class="row" style="display:flex;gap:12px;flex-wrap:wrap">
                    <label class="field" style="flex:1;min-width:200px">Sheet chi tiết theo đơn vị
                        <select id="ictSheetSelect"></select>
                    </label>
                    <label class="field" style="max-width:140px">Năm
                        <select id="ictNam">${ictYearOptionsHtml()}</select>
                    </label>
                    <label class="field" style="max-width:220px">Mốc thời gian
                        <select id="ictMoc">
                            <option value="">-- (không chọn — cả năm)</option>
                            <optgroup label="Tháng">${Array.from({ length: 12 }, (_, i) => `<option value="m${i + 1}">Tháng ${i + 1}</option>`).join('')}</optgroup>
                            <optgroup label="Quý">${[1, 2, 3, 4].map((q) => `<option value="q${q}">Quý ${q}</option>`).join('')}</optgroup>
                            <optgroup label="Kỳ"><option value="k1">Kỳ I (6 tháng đầu năm)</option><option value="k2">Kỳ II (6 tháng cuối năm)</option></optgroup>
                        </select>
                    </label>
                </div>
                <div class="action-bar" style="margin-top:12px">
                    <button type="button" class="primary" onclick="ictProcess()">Xử lý dữ liệu</button>
                </div>
            </div>
        </div>
        <div class="detail-card" id="ictLogPanel" style="display:none">
            <h4>2. Nhật ký xử lý</h4>
            <pre id="ictLogOut" style="max-height:160px;overflow:auto;font-size:11.5px;line-height:1.6;margin:0;white-space:pre-wrap"></pre>
        </div>
        <div class="detail-card" id="ictResultPanel" style="display:none">
            <h4>3. Kết quả</h4>
            <div class="kv">
                <b>Chỉ tiêu</b><span id="ictStatChiTieu">–</span>
                <b>Bản ghi</b><span id="ictStatBanGhi">–</span>
                <b>Đơn vị</b><span id="ictStatDonVi">–</span>
                <b>Biểu đồ</b><span id="ictStatCanhBao">–</span>
            </div>
            <div class="iip-table-wrap" style="margin-top:10px">
                <table class="iip-table">
                    <thead><tr><th>Chỉ tiêu</th><th>Số box</th><th>Số biểu đồ</th><th>Tổng</th></tr></thead>
                    <tbody id="ictChartTableBody"></tbody>
                </table>
            </div>
        </div>
        <div class="action-bar">
            <button type="button" class="primary" id="ictApplyBtn" style="display:none" onclick="ictApplyToDrawer()">Hiển thị vào danh sách</button>
            <button type="button" class="ghost ict-save-btn" id="ictSaveBtn" style="display:none" onclick="ictSaveImportedDataClick()">💾 Lưu dữ liệu</button>
            <button type="button" class="ghost" onclick="closeModal()">Đóng</button>
        </div>`;
    }

    window.addChiTieu = function () {
        ictWorkbook = null; ictFileName = ''; ictLastResult = null;
        ictLastPeriod = null; ictSaveStatus = 'idle';
        // Chốt lại đúng chỉ tiêu đang mở trên drawer tại thời điểm bấm "+ Nhập chỉ tiêu" — dùng cho
        // toàn bộ phiên import này (kể cả khi drawer/tiêu đề sau đó bị đổi bởi thao tác khác).
        ictActiveIndicatorKey = window.__activeDrawerIndicatorKey || null;
        document.getElementById('modalTitle').textContent = 'Nhập chỉ tiêu từ file Excel';
        document.getElementById('modalSub').textContent = 'Tải file .xlsx theo mẫu Biểu 1/2/4/5-BTCTW để nạp dữ liệu vào danh sách.';
        document.getElementById('modalBody').innerHTML = ictModalHtml();
        openModal();
    };

    window.ictHandleFile = function (file) {
        if (!file) return;
        if (typeof XLSX === 'undefined') { toast('Thiếu thư viện đọc Excel (XLSX). Vui lòng tải lại trang.'); return; }
        ictFileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                ictWorkbook = XLSX.read(data, { type: 'array', cellDates: false });
                document.getElementById('ictFileMeta').textContent = `Đã tải: ${file.name} — ${ictWorkbook.SheetNames.length} sheet`;
                const sel = document.getElementById('ictSheetSelect');
                sel.innerHTML = '';
                ictWorkbook.SheetNames.forEach((name) => {
                    const opt = document.createElement('option');
                    opt.value = name; opt.textContent = name;
                    sel.appendChild(opt);
                });
                document.getElementById('ictSheetControls').style.display = 'block';
            } catch (err) {
                toast('Không đọc được file: ' + (err.message || err));
            }
        };
        reader.readAsArrayBuffer(file);
    };

    window.ictProcess = function () {
        const out = document.getElementById('ictLogOut'); if (out) out.innerHTML = '';
        document.getElementById('ictResultPanel').style.display = 'none';
        document.getElementById('ictApplyBtn').style.display = 'none';
        if (!ictWorkbook) { toast('Chưa có file Excel nào được tải.'); return; }
        try {
            const sheetName = document.getElementById('ictSheetSelect').value;
            // Kỳ báo cáo chọn thủ công (Năm bắt buộc chọn có sẵn giá trị mặc định; Mốc thời gian tuỳ
            // chọn — Tháng/Quý/Kỳ) — thay cho việc chỉ dò tự động từ tiêu đề file (vẫn giữ dò tự động
            // làm phương án dự phòng khi không chọn Năm).
            const nam = document.getElementById('ictNam').value;
            const moc = document.getElementById('ictMoc').value;
            let kyBaoCaoOverride = null;
            if (nam) {
                if (moc.charAt(0) === 'm') kyBaoCaoOverride = `${nam}-T${Number(moc.slice(1))}`;
                else if (moc.charAt(0) === 'q') kyBaoCaoOverride = `${nam}-Q${Number(moc.slice(1))}`;
                else if (moc === 'k1') kyBaoCaoOverride = `${nam}-KY1`;
                else if (moc === 'k2') kyBaoCaoOverride = `${nam}-KY2`;
                else kyBaoCaoOverride = nam;
            }
            ictLog(`Bắt đầu xử lý sheet "${sheetName}"...`, 'ok');
            const ws = ictWorkbook.Sheets[sheetName];
            const result = ictBuildDashboardJSON(ws, { tenLinhVuc: null, topN: null, kyBaoCaoOverride }, ictLog);
            ictLastResult = result;
            // Lưu lại result + kỳ báo cáo đã chọn để dùng sau cho "Hiển thị vào danh sách" / "Lưu dữ liệu"
            // (2 hành động này gọi lại sau, không nên đọc lại DOM select phòng khi user đổi mà chưa xử lý lại).
            ictLastPeriod = { nam, moc };
            ictSaveStatus = 'idle';
            console.log("result", result)
            ictRenderResult(result);
        } catch (err) {
            ictLog('LỖI: ' + (err.message || err), 'err');
            toast('Xử lý thất bại: ' + (err.message || err));
        }
    };

    function ictRenderResult(result, toastMessage) {
        document.getElementById('ictResultPanel').style.display = 'block';
        document.getElementById('ictStatChiTieu').textContent = fmt(result.so_luong_chi_tieu);
        document.getElementById('ictStatBanGhi').textContent = fmt(result.so_ban_ghi);
        document.getElementById('ictStatDonVi').textContent = fmt(result.bang_bao_cao_don_vi.length);
        document.getElementById('ictStatCanhBao').textContent = fmt(result.bieu_do_chi_tieu.reduce((s, c) => s + c.chartGroups.filter(g => !g.hidden).length, 0));
        const tbody = document.getElementById('ictChartTableBody');
        tbody.innerHTML = result.bieu_do_chi_tieu.map(c => `<tr>
            <td>${esc(c.ten_widget)}</td>
            <td>${fmt(c.boxItems.length)}</td>
            <td>${fmt(c.chartGroups.filter(g => !g.hidden).length)}</td>
            <td class="mono">${fmt(c.total)}</td>
        </tr>`).join('');
        document.getElementById('ictApplyBtn').style.display = '';
        document.getElementById('ictSaveBtn').style.display = '';
        ictUpdateSaveButtons();
        toast(toastMessage || 'Đã xử lý xong file Excel. Bấm "Hiển thị vào danh sách" để nạp vào danh sách.');
    }

    /* Gọi từ script.js (onDrawerPeriodFilterChange, khi filter Năm/Mốc thời gian ở drawer) khi API
       /api/v1/trung-uong/data/query trả về data (chuỗi JSON) khác rỗng — parse rồi hiển thị y như vừa
       xử lý xong 1 file Excel, coi như đã được lưu sẵn trên hệ thống (không cần bấm "Lưu dữ liệu" lại). */
    window.ictLoadResultFromQuery = function (result, nam, moc, indicatorKey) {
        if (!result) return;
        ictLastResult = result;
        ictLastPeriod = { nam: nam != null ? String(nam) : '', moc: moc || '' };
        if (indicatorKey) ictActiveIndicatorKey = indicatorKey;
        ictSaveStatus = 'saved'; // data lấy từ API tức đã có sẵn trên hệ thống, không cần "Lưu dữ liệu" lại
        ictApplyResultToDrawer(result, {
            toastMessage: `Đã tải ${fmt(result.so_luong_chi_tieu)} chỉ tiêu · ${fmt(result.bang_bao_cao_don_vi.length)} đơn vị theo bộ lọc.`,
        });
    };

    /* Gọi từ script.js (onDrawerPeriodFilterChange) khi API /api/v1/trung-uong/data/query trả về
       data rỗng ('' hoặc null) cho kỳ đang lọc — xoá sạch danh sách chart + bảng báo cáo đang hiển thị
       (dù đó là data cũ từ lần gọi trước, hay data mẫu/fake của van-phong-ban-to-chuc-dang.js lúc mới
       mở popup) và thay bằng thông báo "không có dữ liệu", KHÔNG được giữ lại nội dung cũ. */
    window.ictShowNoDataInDrawer = function (message) {
        ictLastResult = null;
        ictLastPeriod = null;
        ictSaveStatus = 'idle';
        const body = document.getElementById('drawerBodyCT');
        if (!body) return;
        body.innerHTML = `<div class="access-lock" style="text-align:center;padding:32px 16px">${esc(message || 'Không có dữ liệu cho kỳ báo cáo đã chọn.')}</div>`;
        openDrawer(); // dựng lại bộ lọc Năm/Quý/Tháng (bị xoá theo innerHTML ở trên) đúng theo drawerFilterState
        const saveBtn = document.getElementById('ictHeaderSaveBtn');
        if (saveBtn) saveBtn.style.display = 'none';
    };

    window.ictSaveImportedDataClick = function () {
        if (!ictLastResult || !ictLastPeriod) { toast('Chưa có dữ liệu đã xử lý.'); return; }
        ictSyncPeriodFromForm();
        if (!ictHasPeriodSelected()) { toast('Vui lòng chọn Mốc thời gian (Tháng/Quý/Kỳ) trước khi lưu dữ liệu.'); return; }
        if (ictSaveStatus === 'saving' || ictSaveStatus === 'saved') return;
        ictSaveImportedData(ictLastResult, ictLastPeriod.nam, ictLastPeriod.moc);
    };

    /* ---------- Vẽ biểu đồ thật (Chart.js) cho từng chỉ tiêu trong drawer ---------- */
    let ictChartSeq = 0, ictPendingCharts = [];
    function ictCanvasId() { ictChartSeq++; return `ictChart${ictChartSeq}`; }
    function ictQueueChart(id, kind, labels, data, colors, centerText) {
        ictPendingCharts.push({ id, kind, labels, data, colors, centerText });
    }
    function ictIsLightTheme() { return document.documentElement.classList.contains('theme-light') || document.documentElement.classList.contains('theme-green'); }
    function ictAxisColor() { return ictIsLightTheme() ? '#000000' : '#a8c3d8'; }
    function ictLabelColor() { return ictIsLightTheme() ? '#000000' : '#dceeff'; }
    function ictGridColor() { return 'rgba(87,178,255,.12)'; }
    function ictDonutCenterTextPlugin(line1, line2) {
        return {
            id: 'ictDonutCenterText', afterDraw(chart) {
                const { ctx, chartArea } = chart; if (!chartArea) return;
                const cx = (chartArea.left + chartArea.right) / 2, cy = (chartArea.top + chartArea.bottom) / 2;
                ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = ictLabelColor(); ctx.font = "700 15px 'Be Vietnam Pro',Arial,sans-serif";
                ctx.fillText(line1, cx, cy - 8);
                ctx.fillStyle = ictAxisColor(); ctx.font = "600 9px 'Be Vietnam Pro',Arial,sans-serif";
                ctx.fillText(line2, cx, cy + 10);
                ctx.restore();
            }
        };
    }
    function ictFlushCharts() {
        const list = ictPendingCharts; ictPendingCharts = [];
        if (typeof Chart === 'undefined') return;
        list.forEach(c => {
            const canvas = document.getElementById(c.id); if (!canvas) return;
            const isDonut = c.kind === 'donut';
            const isHBar = c.kind === 'bar_h';
            new Chart(canvas, {
                type: isDonut ? 'doughnut' : 'bar',
                data: {
                    labels: isDonut ? c.labels.map((l, i) => `${l}: ${fmt(c.data[i])}`) : c.labels,
                    datasets: [{
                        data: c.data, backgroundColor: c.colors, hoverBackgroundColor: c.colors, borderColor: c.colors,
                        hoverBorderColor: '#fff', borderWidth: isDonut ? 0 : 1, hoverBorderWidth: isDonut ? 3 : 2,
                        borderRadius: isDonut ? 0 : 4, maxBarThickness: 30, hoverOffset: isDonut ? 10 : 0
                    }]
                },
                options: {
                    indexAxis: isDonut ? undefined : (isHBar ? 'y' : 'x'),
                    responsive: true, maintainAspectRatio: false,
                    cutout: isDonut ? '68%' : undefined,
                    plugins: {
                        legend: { display: isDonut, position: 'bottom', labels: { color: ictLabelColor(), boxWidth: 12, padding: 8, font: { size: 11, weight: 700 } } },
                        tooltip: { backgroundColor: '#0a2038', titleColor: '#ffd54b', bodyColor: '#fff', borderColor: 'rgba(87,178,255,.5)', borderWidth: 1, padding: 10 }
                    },
                    scales: isDonut ? {} : isHBar
                        ? { x: { beginAtZero: true, ticks: { color: ictAxisColor(), font: { size: 10 } }, grid: { color: ictGridColor() } }, y: { ticks: { color: ictLabelColor(), font: { size: 10.5 } }, grid: { display: false } } }
                        : { x: { ticks: { color: ictLabelColor(), font: { size: 10 }, maxRotation: 30 }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: ictAxisColor(), font: { size: 10 } }, grid: { color: ictGridColor() } } }
                },
                plugins: (isDonut && c.centerText) ? [ictDonutCenterTextPlugin(c.centerText.line1, c.centerText.line2)] : []
            });
        });
    }

    function ictChartGroupHtml(items) {
        const loai = ictChooseChartType(items);
        const total = items.reduce((s, x) => s + (x.value || 0), 0);
        const colors = items.map((_, i) => COLOR_PALETTE_ICT[i % COLOR_PALETTE_ICT.length]);
        const canvasId = ictCanvasId();
        const centerText = loai === 'donut' ? { line1: fmt(total), line2: 'tổng' } : null;
        ictQueueChart(canvasId, loai, items.map(x => x.name), items.map(x => x.value), colors, centerText);
        const height = loai === 'bar_h' ? Math.max(120, items.length * 30 + 20) : 190;
        return `<div style="position:relative;height:${height}px;margin-top:8px"><canvas id="${canvasId}"></canvas></div>`;
    }

    function ictChiTieuCardHtml(card, idx, isActive) {
        const header = `<div style="margin-bottom:6px"><h4 style="margin:0">${esc(card.ten_widget)}</h4></div>`;
        // Nhóm bị đánh dấu `hidden` (nhánh tự giới thiệu breakdown ngay trong tên, vd "...chia ra:")
        // không vẽ chart trong card — dữ liệu vẫn giữ cho bảng báo cáo (xem ictCardReportTableHtml).
        const visibleChartGroups = card.chartGroups.filter((g) => !g.hidden);

        // Không có box lẫn chart -> chỉ tiêu đơn, hiển thị 1 số liệu tổng
        const inner = (!card.boxItems.length && !visibleChartGroups.length)
            ? (card.total > 0
                ? `<div class="cir-stat-grid" style="margin:0"><div class="cir-stat-tile"><p>Tổng toàn quốc</p><b>${fmt(card.total)}</b></div></div>`
                : '<div class="muted" style="font-size:11.5px">Không có dữ liệu.</div>')
            : (card.boxItems.length ? `<div class="cir-stat-grid" style="margin:0">${card.boxItems.map(b => `<div class="cir-stat-tile"><p>${esc(b.name)}</p><b>${fmt(b.value)}</b></div>`).join('')}</div>` : '')
                + visibleChartGroups.map(g => ictChartGroupHtml(g.items)).join('');

        return `<div class="cat-chart-box cat-item-row${isActive ? ' ict-card-active' : ''}" data-ict-idx="${idx}" onclick="ictSelectCard(${idx})">${header}${inner}</div>`;
    }

    /* ---------- Bảng báo cáo ĐẦY ĐỦ, mirror nguyên cấu trúc header nhiều tầng gốc trong Excel ----------
       Dùng cho các card có ≥2 nhánh con tách thành card riêng (hasNestedCards): biểu đồ ở card này chỉ
       còn là 1 chart so sánh tổng đơn giản, nhưng bảng báo cáo vẫn cần hiển thị ĐỦ toàn bộ cột gốc (dù
       Excel có header sâu 3-4 tầng) để đối chiếu dữ liệu chart/bảng với file nguồn được nhất quán. */
    function ictSubtreeLeafCount(node) {
        const keys = Object.keys(node.children);
        if (!keys.length) return 1;
        return keys.reduce((sum, k) => sum + ictSubtreeLeafCount(node.children[k]), 0);
    }
    function ictSubtreeMaxDepth(node) {
        const keys = Object.keys(node.children);
        if (!keys.length) return 1;
        return 1 + Math.max(...keys.map((k) => ictSubtreeMaxDepth(node.children[k])));
    }
    // Duyệt toàn bộ cây con của `node`, dựng ma trận header theo đúng số tầng thật (rowspan cho ô lá kéo
    // dài xuống tới tầng cuối, colspan cho ô cha bằng đúng số cột lá bên trong nó) + danh sách cột lá.
    function ictBuildFullHeaderMatrix(node, maxDepth) {
        const rows = Array.from({ length: maxDepth }, () => []);
        const leafColumns = [];
        function walk(n, level) {
            const keys = Object.keys(n.children);
            if (!keys.length) {
                rows[level].push({ label: n.name, colspan: 1, rowspan: maxDepth - level });
                leafColumns.push({ name: n.name, node: n });
                return;
            }
            rows[level].push({ label: n.name, colspan: ictSubtreeLeafCount(n), rowspan: 1 });
            keys.forEach((k) => walk(n.children[k], level + 1));
        }
        Object.keys(node.children).forEach((k) => walk(node.children[k], 0));
        return { rows, leafColumns };
    }
    function ictFullReportTableHtml(result, card) {
        const node = card.node;
        const hasChildren = node && Object.keys(node.children).length > 0;
        if (!hasChildren) return ictCardReportTableHtml(result, card);
        // maxDepth tính theo các CON của node (node chính là card, không tự chiếm 1 dòng header)
        const maxDepth = Math.max(...Object.keys(node.children).map((k) => ictSubtreeMaxDepth(node.children[k])));
        const { rows, leafColumns } = ictBuildFullHeaderMatrix(node, maxDepth);
        const thead = rows.map((rowCells, i) => {
            const firstCol = i === 0 ? `<th rowspan="${maxDepth}">ĐẢNG BỘ</th>` : '';
            const cells = rowCells.map((c) => {
                const attrs = (c.colspan > 1 ? ` colspan="${c.colspan}"` : '') + (c.rowspan > 1 ? ` rowspan="${c.rowspan}"` : '');
                const align = c.colspan > 1 ? 'text-align:center' : 'text-align:right';
                return `<th${attrs} style="${align}">${esc(c.label)}</th>`;
            }).join('');
            return `<tr>${firstCol}${cells}</tr>`;
        }).join('');
        const rowsHtml = result.bang_bao_cao_don_vi.map((row) => {
            const vals = leafColumns.map((c) => ictResolveNodeValue(c.node, (idx) => (row.col_values || {})[idx] || 0));
            return `<tr><td>${esc(row.ten_don_vi)}</td>${vals.map((v) => `<td class="num" style="text-align:right">${fmt(v)}</td>`).join('')}</tr>`;
        }).join('');
        return `<div class="cat-chart-box gen-unit-box" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
            <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">${esc(card.ten_widget)} · ${fmt(result.bang_bao_cao_don_vi.length)} đơn vị · đủ ${fmt(leafColumns.length)} cột gốc</div>
            <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">${result.ma_bieu_nguon ? esc(result.ma_bieu_nguon) + ' · ' : ''}${result.ky_bao_cao ? 'Kỳ báo cáo ' + esc(result.ky_bao_cao) : 'Dữ liệu nhập từ Excel'}</p>
            <input type="text" placeholder="Tìm tên đơn vị..." oninput="const q=this.value.toLowerCase();this.nextElementSibling.querySelectorAll('tbody tr').forEach(r=>{r.style.display=r.children[0].textContent.toLowerCase().includes(q)?'':'none';})" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
            <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto;width:100%">
                <table class="iip-table" style="min-width:${280 + leafColumns.length * 110}px"><thead>${thead}</thead><tbody>${rowsHtml}</tbody></table>
            </div>
        </div>`;
    }

    // Bảng báo cáo theo đơn vị chỉ gồm các cột dữ liệu thuộc riêng 1 chỉ tiêu (box + biểu đồ của card đó).
    // Các cột thuộc cùng 1 nhóm biểu đồ có "label" (vd "Lãnh đạo...chia ra:") được gộp header cha
    // (colspan) 2 tầng, đúng như cấu trúc gốc trong Excel — thay vì liệt kê phẳng ngang hàng với box.
    function ictCardReportTableHtml(result, card) {
        const hasBreakdown = card.items && card.items.length > 0;
        const columns = hasBreakdown ? [] : [{ group: null, name: card.ten_widget, node: card.node }];
        if (hasBreakdown) {
            // Duyệt trực tiếp `card.items` (mảng duy nhất, đúng thứ tự thật box/chart xen kẽ như Excel
            // gốc — xem ictCollectCardContent) thay vì so khớp tên giữa 2 mảng boxItems/chartGroups tách
            // rời (cách cũ có thể chèn sai vị trí khi 1 nhánh có NHIỀU box con rồi mới tới 1 chart).
            // `hidden` chỉ ảnh hưởng tới việc VẼ CHART trong card (xem ictChiTieuCardHtml) — bảng báo
            // cáo vẫn luôn gộp header cha-con (colspan) theo đúng cấu trúc Excel, bất kể nhóm có hidden
            // hay không, để không mất dữ liệu/cấu trúc phân cấp trong bảng.
            card.items.forEach((it) => {
                // Box "synthetic" (tổng cộng dồn, không ứng với cột thật nào trong Excel) không có trong
                // file gốc -> bỏ qua khi dựng bảng để bảng chỉ gồm đúng các cột thật, tránh trùng với
                // chính các cột con của nó đứng ngay sau.
                if (it.kind === 'box') { if (!it.synthetic) columns.push({ group: null, name: it.name, node: it.node }); }
                else it.items.forEach((sub) => columns.push({ group: it.label, name: sub.name, node: sub.node }));
            });
        }

        // Gộp các cột liên tiếp cùng nhóm (label khác null) thành 1 header cha
        const groupRuns = [];
        for (const c of columns) {
            const last = groupRuns[groupRuns.length - 1];
            if (last && c.group != null && last.group === c.group) last.cols.push(c);
            else groupRuns.push({ group: c.group, cols: [c] });
        }
        const hasAnyGroup = groupRuns.some((r) => r.group != null);
        const thead = hasAnyGroup
            ? `<tr><th rowspan="2">ĐẢNG BỘ</th>${groupRuns.map((r) => r.group != null
                ? `<th colspan="${r.cols.length}" style="text-align:center">${esc(r.group)}</th>`
                : `<th rowspan="2" style="text-align:right">${esc(r.cols[0].name)}</th>`).join('')}</tr>` +
              `<tr>${groupRuns.filter((r) => r.group != null).map((r) => r.cols.map((c) => `<th style="text-align:right">${esc(c.name)}</th>`).join('')).join('')}</tr>`
            : `<tr><th>ĐẢNG BỘ</th>${columns.map(c => `<th style="text-align:right">${esc(c.name)}</th>`).join('')}</tr>`;
        const rows = result.bang_bao_cao_don_vi.map(row => {
            const vals = columns.map(c => ictResolveNodeValue(c.node, (idx) => (row.col_values || {})[idx] || 0));
            return `<tr><td>${esc(row.ten_don_vi)}</td>${vals.map(v => `<td class="num" style="text-align:right">${fmt(v)}</td>`).join('')}</tr>`;
        }).join('');
        return `<div class="cat-chart-box gen-unit-box" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
            <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">${esc(card.ten_widget)} · ${fmt(result.bang_bao_cao_don_vi.length)} đơn vị</div>
            <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">${result.ma_bieu_nguon ? esc(result.ma_bieu_nguon) + ' · ' : ''}${result.ky_bao_cao ? 'Kỳ báo cáo ' + esc(result.ky_bao_cao) : 'Dữ liệu nhập từ Excel'}</p>
            <input type="text" placeholder="Tìm tên đơn vị..." oninput="const q=this.value.toLowerCase();this.nextElementSibling.querySelectorAll('tbody tr').forEach(r=>{r.style.display=r.children[0].textContent.toLowerCase().includes(q)?'':'none';})" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
            <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto;width:100%">
                <table class="iip-table" style="min-width:${280 + columns.length * 110}px"><thead>${thead}</thead><tbody>${rows}</tbody></table>
            </div>
        </div>`;
    }

    // Bảng tổng hợp: mỗi cột là 1 chỉ tiêu cấp cao nhất (mặc định hiển thị khi vừa nạp dữ liệu)
    function ictSummaryReportTableHtml(result) {
        const cols = result.chi_tieu_chinh || [];
        const thead = `<tr><th>ĐẢNG BỘ</th>${cols.map(c => `<th style="text-align:right">${esc(c)}</th>`).join('')}</tr>`;
        const rows = result.bang_bao_cao_don_vi.map(row => `<tr><td>${esc(row.ten_don_vi)}</td>${cols.map(c => `<td class="num" style="text-align:right">${fmt(row.chi_tieu[c] || 0)}</td>`).join('')}</tr>`).join('');
        return `<div class="cat-chart-box gen-unit-box" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
            <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Bảng tổng hợp · ${fmt(result.bang_bao_cao_don_vi.length)} đơn vị</div>
            <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">${result.ma_bieu_nguon ? esc(result.ma_bieu_nguon) + ' · ' : ''}${result.ky_bao_cao ? 'Kỳ báo cáo ' + esc(result.ky_bao_cao) : 'Dữ liệu nhập từ Excel'}</p>
            <input type="text" placeholder="Tìm tên đơn vị..." oninput="const q=this.value.toLowerCase();this.nextElementSibling.querySelectorAll('tbody tr').forEach(r=>{r.style.display=r.children[0].textContent.toLowerCase().includes(q)?'':'none';})" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
            <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto;width:100%">
                <table class="iip-table" style="min-width:${280 + cols.length * 110}px"><thead>${thead}</thead><tbody>${rows}</tbody></table>
            </div>
        </div>`;
    }
    function ictSetActiveRow(kind, idx) {
        const list = document.querySelectorAll('#drawerBodyCT .cat-item-list > .cat-item-row');
        list.forEach((el) => {
            const isSummary = el.dataset.ictSummary === '1';
            const match = kind === 'summary' ? isSummary : (!isSummary && Number(el.dataset.ictIdx) === idx);
            el.classList.toggle('ict-card-active', match);
        });
    }
    window.ictSelectSummary = function () {
        if (!ictLastResult) return;
        ictSetActiveRow('summary');
        const tableHtml = ictSummaryReportTableHtml(ictLastResult);
        openChartTableModal({
            title: 'Bảng tổng hợp chỉ tiêu',
            subtitle: 'Dữ liệu tổng hợp theo từng đơn vị',
            tableHtml: tableHtml
        });
    };
    window.ictSelectCard = function (idx) {
        if (!ictLastResult) return;
        const card = ictLastResult.bieu_do_chi_tieu[idx];
        if (!card) return;
        ictSetActiveRow('card', idx);
        const tableHtml = card.useFullTable ? ictFullReportTableHtml(ictLastResult, card) : ictCardReportTableHtml(ictLastResult, card);
        openChartTableModal({
            title: `Bảng dữ liệu: ${card.ten_widget}`,
            subtitle: `Dữ liệu chi tiết chỉ tiêu theo đơn vị`,
            tableHtml: tableHtml
        });
    };

    // Đổ `result` (shape của ictBuildDashboardJSON) thẳng vào drawer — dùng chung cho cả 2 luồng độc
    // lập với nhau: (1) bấm "Hiển thị vào danh sách" từ modal nhập Excel, (2) đổi filter Năm/Quý/Tháng
    // ở drawer nhận được data đã lưu sẵn từ API — luồng (2) KHÔNG cần modal đang mở.
    // Không đổi drawerTitle-ct — giữ nguyên tiêu đề của chỉ tiêu đang mở từ trước (theo yêu cầu).
    function ictApplyResultToDrawer(result, opts) {
        opts = opts || {};
        const summaryRowHtml = `<div class="cat-chart-box cat-item-row ict-card-active" data-ict-summary="1" onclick="ictSelectSummary()">
            <h4 style="margin:0">📊 Bảng tổng hợp</h4>
            <p class="muted" style="font-size:11px;margin:6px 0 0">Toàn bộ ${fmt(result.chi_tieu_chinh.length)} chỉ tiêu chính theo từng đơn vị</p>
        </div>`;
        const chartCount = (result.bieu_do_chi_tieu ? result.bieu_do_chi_tieu.length : 0) + 1;
        const gridClass = getChartGridClass(chartCount);
        const cardsHtml = result.bieu_do_chi_tieu.length
            ? `<div class="cat-item-list ${gridClass}">${summaryRowHtml}${result.bieu_do_chi_tieu.map((c, i) => ictChiTieuCardHtml(c, i, false)).join('')}</div>`
            : `<div class="access-lock" style="text-align:center;padding:24px 12px">Không có chỉ tiêu nào được nhận diện từ file.</div>`;
        document.getElementById('drawerBodyCT').innerHTML = `<div class="cat-charts-full-grid">${cardsHtml}</div>`;
        if (opts.closeModalFirst) closeModal();
        // openDrawer() cũng tự chèn lại bộ lọc Năm/Quý/Tháng (đã bị xoá mất do ghi đè innerHTML ở trên)
        // nếu window.__activeDrawerIndicatorKey vẫn còn hợp lệ.
        openDrawer();
        // Nút "Lưu dữ liệu" ở header CHỈ hiện khi data đến từ luồng nhập Excel (opts.showSaveButton) —
        // data lấy từ API (/data/query, dù do filter hay do mở drawer lần đầu) đã có sẵn trên hệ thống
        // rồi nên không cần lưu lại, ẩn hẳn nút này đi.
        const saveBtn = document.getElementById('ictHeaderSaveBtn');
        if (saveBtn) {
            saveBtn.style.display = opts.showSaveButton ? '' : 'none';
            if (opts.showSaveButton) ictUpdateSaveButtons();
        }
        setTimeout(ictFlushCharts, 50);
        if (opts.toastMessage) toast(opts.toastMessage);
    }

    window.ictApplyToDrawer = function () {
        if (!ictLastResult || !ictLastPeriod) { toast('Chưa có dữ liệu đã xử lý.'); return; }
        ictSyncPeriodFromForm();
        if (!ictHasPeriodSelected()) { toast('Vui lòng chọn Mốc thời gian (Tháng/Quý/Kỳ) trước khi hiển thị vào danh sách.'); return; }
        const result = ictLastResult;
        ictApplyResultToDrawer(result, {
            closeModalFirst: true,
            showSaveButton: true,
            toastMessage: `Đã nạp ${result.so_luong_chi_tieu} chỉ tiêu · ${result.bang_bao_cao_don_vi.length} đơn vị vào danh sách.`,
        });
    };

    // Hỗ trợ kéo-thả file trực tiếp vào dropzone trong modal
    document.addEventListener('dragover', (e) => {
        if (e.target && e.target.closest && e.target.closest('#ictDropzone')) e.preventDefault();
    });
    document.addEventListener('drop', (e) => {
        const zone = e.target && e.target.closest && e.target.closest('#ictDropzone');
        if (!zone) return;
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length) window.ictHandleFile(e.dataTransfer.files[0]);
    });
})();

/* Xuất Excel (CSV) bảng đơn vị đang hiển thị trong drawer chi tiết lĩnh vực — dùng chung cho mọi lĩnh vực có bảng "Danh sách N đơn vị" */
function exportDrawerTableToCsv() {
    const table = document.querySelector('#drawerBodyCT .gen-unit-box table') || document.querySelector('#drawerBodyCT table');
    if (!table) { toast('Không có bảng dữ liệu để xuất.'); return; }
    const rows = Array.from(table.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(cell => cell.textContent.trim())).filter(r => r.length);
    if (!rows.length) { toast('Không có dữ liệu để xuất.'); return; }
    const csv = '﻿' + rows.map(row => row.map(cell => '"' + String(cell ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const titleText = (document.getElementById('drawerTitle-ct')?.textContent || 'du-lieu').trim();
    const slug = (toSlug(titleText).replace(/[^a-zA-Z0-9_]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'du-lieu');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = slug + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
}

// === Vụ Cơ sở đảng, đảng viên Popup Demo Logic ===
(function () {
    function trendMonthLabels(n) { const out = [], base = new Date(); for (let i = n - 1; i >= 0; i--) { const d = new Date(base.getFullYear(), base.getMonth() - i, 1); out.push(`Th.${d.getMonth() + 1}/${d.getFullYear()}`); } return out; }
    function trendSeriesFor(total, seed, n) {
        const out = []; let prev = 0;
        for (let i = 0; i < n; i++) {
            const h = ((seed + 1) * (i + 3) * 2654435761) >>> 0;
            const noise = 0.55 + ((h % 450) / 1000);
            const v = Math.max(prev, Math.round(total * ((i + 1) / n) * noise));
            out.push(v); prev = v;
        }
        out[n - 1] = total;
        return out;
    }
    function isLightOrGreenTheme() { return document.documentElement.classList.contains('theme-light') || document.documentElement.classList.contains('theme-green'); }
    function chartAxisColor() { return isLightOrGreenTheme() ? '#000000' : '#a8c3d8' }
    function chartLabelColor() { return isLightOrGreenTheme() ? '#000000' : '#dceeff' }
    function chartGridColor() { return 'rgba(87,178,255,.12)' }
    function refreshChitieuChartsTheme() {
        if (typeof Chart === 'undefined') return;
        Object.values(Chart.instances || {}).forEach(chart => {
            try {
                const opts = chart.options; if (!opts) return;
                if (opts.plugins && opts.plugins.legend && opts.plugins.legend.labels) {
                    opts.plugins.legend.labels.color = chartLabelColor();
                }
                if (opts.scales) {
                    Object.keys(opts.scales).forEach(key => {
                        const scaleOpt = opts.scales[key];
                        const runtimeScale = chart.scales && chart.scales[key];
                        const isCategory = ((runtimeScale && runtimeScale.type) || scaleOpt.type) === 'category';
                        if (scaleOpt.ticks && scaleOpt.ticks.color !== undefined) {
                            scaleOpt.ticks.color = isCategory ? chartLabelColor() : chartAxisColor();
                        }
                        if (scaleOpt.grid && scaleOpt.grid.color !== undefined) {
                            scaleOpt.grid.color = chartGridColor();
                        }
                    });
                }
                chart.update('none');
            } catch (e) { }
        });
    }
    window.refreshChitieuChartsTheme = refreshChitieuChartsTheme;
    function destroyDetachedCharts() {
        if (typeof Chart === 'undefined') return;
        Object.values(Chart.instances || {}).forEach(c => { try { if (c.canvas && !document.body.contains(c.canvas)) c.destroy(); } catch (e) { } });
    }
    function lockScroll() { document.body.style.overflow = 'hidden'; }
    function unlockScroll() { document.body.style.overflow = ''; }
    function openDrawerCT() { document.getElementById('overlay-ct').classList.add('show'); document.getElementById('drawer-ct').classList.add('open'); lockScroll(); }

    const TW_DANG_BO_NAMES = [
        'Thành phố Hà Nội', 'Thành phố Hải Phòng', 'Tỉnh Hưng Yên', 'Tỉnh Bắc Ninh', 'Tỉnh Ninh Bình', 'Tỉnh Quảng Ninh',
        'Tỉnh Lào Cai', 'Tỉnh Tuyên Quang', 'Tỉnh Cao Bằng', 'Tỉnh Phú Thọ', 'Tỉnh Thái Nguyên', 'Tỉnh Lạng Sơn',
        'Tỉnh Lai Châu', 'Tỉnh Sơn La', 'Tỉnh Điện Biên', 'Tỉnh Thanh Hóa', 'Tỉnh Nghệ An', 'Tỉnh Hà Tĩnh',
        'Tỉnh Quảng Trị', 'Thành phố Huế', 'Thành phố Đà Nẵng', 'Tỉnh Quảng Ngãi', 'Tỉnh Khánh Hòa', 'Tỉnh Gia Lai',
        'Tỉnh Đắk Lắk', 'Tỉnh Lâm Đồng', 'Thành phố Hồ Chí Minh', 'Tỉnh Đồng Nai', 'Tỉnh Tây Ninh', 'Tỉnh Đồng Tháp',
        'Tỉnh Vĩnh Long', 'Tỉnh An Giang', 'Thành phố Cần Thơ', 'Tỉnh Cà Mau', 'Đảng bộ các cơ quan Đảng Trung ương',
        'Đảng bộ Chính phủ', 'Đảng ủy Quốc Hội', 'Đảng ủy Mặt trận Tổ quốc Việt Nam', 'Quân ủy Trung ương', 'Công an Trung ương'
    ];
    function P(dim, items) { return { dim, type: 'bar', items: items.map(x => ({ label: x[0], value: x[1] })) }; }
    function actualIndicator(name, total, source, unitValues) { return [name, total, 'Năm', source, [], unitValues]; }
    const vuCoSoDangCat = {
        id: 'tw-dang-btc-vucsddv', name: 'Vụ Cơ sở đảng, đảng viên', items: [
            actualIndicator('Đảng viên hiện có', 5718743, 'Biểu số 1-BTCTW', [511900, 250694, 184858, 160435, 245173, 121005, 124990, 139250, 65147, 266093, 144887, 72774, 32612, 96647, 51703, 248255, 207720, 104153, 131801, 59823, 146864, 95237, 76466, 152152, 142878, 128909, 392157, 136325, 97942, 123726, 154950, 134421, 147422, 83079, 15134, 117552, 2723, 4797, 272685, 73404]),
            actualIndicator('Đảng viên mới kết nạp trong kỳ', 99909, 'Biểu số 2A-BTCTW', [6262, 4943, 2001, 2740, 3877, 2045, 2801, 2282, 611, 4122, 2868, 1029, 506, 1393, 1184, 6246, 4618, 1933, 2046, 1052, 2901, 1553, 1451, 2880, 3194, 2436, 5629, 2049, 1523, 1870, 2230, 1840, 2789, 1302, 230, 1705, 23, 76, 6821, 2848]),
            actualIndicator('Đảng viên nữ', 2025845, 'Biểu số 4-BTCTW', [207969, 105661, 70533, 1553, 94782, 45634, 46487, 56995, 28345, 108044, 65346, 32086, 11702, 51521, 18781, 116765, 76544, 44115, 1110, 21640, 57583, 36244, 30641, 59605, 56467, 52549, 157203, 53419, 39094, 46281, 19586, 51563, 56337, 21995, 7465, 16423, 1159, 2381, 40999, 13238]),
            actualIndicator('Tổ chức cơ sở đảng theo loại hình cơ sở', 57332, 'Biểu số 5-BTCTW', [4549, 2165, 817, 1626, 2149, 821, 1869, 1806, 422, 2262, 1013, 1192, 314, 1172, 792, 1224, 2608, 834, 811, 648, 1772, 1166, 1068, 2095, 1374, 2433, 2448, 1960, 1741, 1322, 856, 1122, 1391, 1259, 186, 1270, 26, 34, 4219, 496])
        ]
    };
    const CAT_ST_LOCAL = [
        { k: 'done', l: 'Đã hoàn thành', c: '#2fb174' },
        { k: 'doing', l: 'Đang thực hiện', c: '#2c7dd2' },
        { k: 'regular', l: 'Vượt chỉ tiêu', c: '#39d5ff' },
        { k: 'soon', l: 'Chưa bắt đầu', c: '#d8a50c' },
        { k: 'risk', l: 'Tạm dừng', c: '#d25a19' },
        { k: 'overdue', l: 'Không đạt', c: '#ef4444' }
    ];
    function weightedStatusForIndex(i, seed) {
        const baseWeights = [38, 26, 14, 12, 7, 3];
        const n = CAT_ST_LOCAL.length, rot = ((seed % n) + n) % n;
        const weights = baseWeights.map((_, k) => baseWeights[(k + n - rot) % n]);
        const total = weights.reduce((a, b) => a + b, 0);
        const h = ((i * 2654435761 + seed * 40503) >>> 0) % total;
        let acc = 0;
        for (let k = 0; k < n; k++) { acc += weights[k]; if (h < acc) return CAT_ST_LOCAL[k]; }
        return CAT_ST_LOCAL[n - 1];
    }
    let indicatorRecords = [];
    (function () {
        let idx = 0;
        vuCoSoDangCat.items.forEach(item => {
            const [name, count, , , parts] = item;
            if ((parts && parts.length) || (item[5] && item[5].length)) { idx++; return; }
            const sampleCount = Math.min(Number(count) || 0, 300);
            for (let i = 0; i < sampleCount; i++) {
                const st = weightedStatusForIndex(i, idx);
                indicatorRecords.push({ catId: vuCoSoDangCat.id, indicator: name, status: st.k });
            }
            idx++;
        });
    })();
    function indicatorRecordsFor(catId, name) { return indicatorRecords.filter(r => r.catId === catId && r.indicator === name); }
    const PART_PAL = ['#2a78d6', '#1baf7a', '#eda100', '#4a3aa7', '#39d5ff', '#d33a44', '#898781'];
    function shouldRankBar(items) {
        const total = items.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
        const minShare = Math.min(...items.map(x => (Number(x.value) || 0) / total));
        return items.length >= 4 || minShare < 0.08;
    }
    function chartCanvasId() { window.__dimChartSeq = (window.__dimChartSeq || 0) + 1; return `dimChart${window.__dimChartSeq}`; }
    function queueDimChart(id, type, labels, data, colors, centerText) { (window.__pendingDimCharts = window.__pendingDimCharts || []).push({ id, type, labels, data, colors, centerText }); }
    function donutCenterTextPlugin(line1, line2) {
        return {
            id: 'donutCenterText', afterDraw(chart) {
                const { ctx, chartArea } = chart; if (!chartArea) return;
                const cx = (chartArea.left + chartArea.right) / 2, cy = (chartArea.top + chartArea.bottom) / 2;
                ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = chartLabelColor(); ctx.font = "700 17px 'Be Vietnam Pro',Arial,sans-serif";
                ctx.fillText(line1, cx, cy - 8);
                ctx.fillStyle = chartAxisColor(); ctx.font = "600 9.5px 'Be Vietnam Pro',Arial,sans-serif";
                ctx.fillText(line2, cx, cy + 11);
                ctx.restore();
            }
        };
    }
    function flushPendingDimCharts() {
        const list = window.__pendingDimCharts || []; window.__pendingDimCharts = [];
        if (typeof Chart === 'undefined') return;
        destroyDetachedCharts();
        list.forEach(c => {
            const canvas = document.getElementById(c.id); if (!canvas) return;
            const isDonut = c.type === 'doughnut';
            const isLine = c.type === 'line';
            const mainColor = c.colors[0] || '#39d5ff';
            const dataset = isLine
                ? { data: c.data, borderColor: mainColor, backgroundColor: mainColor + '2e', pointBackgroundColor: mainColor, pointBorderColor: mainColor, pointRadius: 3.5, borderWidth: 2, tension: .35, fill: true }
                : { data: c.data, backgroundColor: c.colors, hoverBackgroundColor: c.colors, borderColor: c.colors, hoverBorderColor: '#fff', borderWidth: isDonut ? 0 : 1, hoverBorderWidth: isDonut ? 3 : 2, borderRadius: isDonut ? 0 : 4, maxBarThickness: 26, hoverOffset: isDonut ? 10 : 0 };
            new Chart(canvas, {
                type: c.type,
                data: { labels: isDonut ? c.labels.map((l, i) => `${l}: ${fmt(c.data[i])}`) : c.labels, datasets: [dataset] },
                options: {
                    indexAxis: (!isDonut && !isLine) ? 'y' : undefined, responsive: true, maintainAspectRatio: false,
                    cutout: isDonut ? '68%' : undefined,
                    plugins: {
                        legend: { display: isDonut, position: 'bottom', labels: { color: chartLabelColor(), boxWidth: 13, padding: 8, font: { size: 12, weight: 700 } } },
                        tooltip: { backgroundColor: '#0a2038', titleColor: '#ffd54b', bodyColor: '#fff', borderColor: 'rgba(87,178,255,.5)', borderWidth: 1, padding: 10, displayColors: true, titleFont: { size: 12, weight: 700 }, bodyFont: { size: 12 } }
                    },
                    scales: isDonut ? {} : isLine ? { x: { ticks: { color: chartAxisColor(), font: { size: 10 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: chartAxisColor(), font: { size: 10 } }, grid: { color: chartGridColor() } } } : { x: { ticks: { color: chartAxisColor(), font: { size: 10.5 } }, grid: { color: chartGridColor() } }, y: { ticks: { color: chartLabelColor(), font: { size: 11 } }, grid: { display: false } } }
                },
                plugins: (isDonut && c.centerText) ? [donutCenterTextPlugin(c.centerText.line1, c.centerText.line2)] : []
            });
        });
    }
    function chartDimBodyHtml(p) {
        const items = p.items; const id = chartCanvasId();
        const isDonut = !shouldRankBar(items);
        const colors = items.map((x, i) => PART_PAL[i % PART_PAL.length]);
        queueDimChart(id, isDonut ? 'doughnut' : 'bar', items.map(x => x.label), items.map(x => Number(x.value) || 0), colors);
        const h = isDonut ? 200 : Math.max(120, items.length * 34 + 20);
        return `<div style="position:relative;height:${h}px;margin-top:4px"><canvas id="${id}"></canvas></div>`;
    }
    function phanToDimBodyHtml(p) { return chartDimBodyHtml(p); }
    function catBoxHeaderHtml(title, freq) {
        const periodOpts = ['Tháng', 'Quý', 'Năm'];
        const defaultPeriod = periodOpts.includes(freq) ? freq : 'Tháng';
        const periodHtml = `<select class="cat-item-period" onclick="event.stopPropagation()" onchange="event.stopPropagation();window.toast && toast('Đang xem theo '+this.value+' (dữ liệu minh họa)')" style="height:28px;flex:0 0 auto;border:1px solid rgba(87,178,255,.28);background:#061a2f;color:#d0e8f8;border-radius:8px;padding:0 6px;font-size:10.5px">${periodOpts.map(p => `<option ${p === defaultPeriod ? 'selected' : ''}>${p}</option>`).join('')}</select>`;
        return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px"><h4 style="margin:0;flex:1;min-width:0">${esc(title)}</h4>${periodHtml}</div>`;
    }
    function catBoxHtml(title, bodyHtml, freq) {
        return `<div class="cat-chart-box cat-item-row">${catBoxHeaderHtml(title, freq)}${bodyHtml}</div>`;
    }
    function catItemCardHtml(catId, idx, it) {
        const name = it[0], declared = Number(it[1]) || 0, freq = it[2], parts = it[4] || [], unitValues = it[5] || [];
        let bodyHtml;
        if (parts.length) {
            bodyHtml = parts.map(p => parts.length > 1 ? `<p class="cir-dim-label" style="margin-top:10px">${esc(p.dim)}</p>${phanToDimBodyHtml(p)}` : phanToDimBodyHtml(p)).join('');
        } else if (unitValues.length) {
            bodyHtml = `<div class="cir-stat-grid" style="margin-top:8px;margin-bottom:0"><div class="cir-stat-tile"><p>Tổng toàn quốc</p><b>${fmt(declared)}</b></div><div class="cir-stat-tile"><p>Đảng bộ có số liệu</p><b>${unitValues.length}</b></div></div>`;
        } else {
            const recs = indicatorRecordsFor(catId, name);
            const tot = recs.length || declared || 1;
            const cnts = {}; CAT_ST_LOCAL.forEach(s => cnts[s.k] = recs.filter(r => r.status === s.k).length);
            const list = CAT_ST_LOCAL.map(s => ({ l: s.l, c: s.c, n: cnts[s.k] || 0 })).filter(s => s.n > 0);
            const finalList = list.length ? list : [{ l: 'Chưa phân loại', c: '#2c7dd2', n: tot }];
            const seed = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) + idx;
            const variant = seed % 3;
            if (variant === 0) {
                const chartId = chartCanvasId();
                queueDimChart(chartId, 'doughnut', finalList.map(s => s.l), finalList.map(s => s.n), finalList.map(s => s.c), { line1: fmt(tot), line2: 'bản ghi' });
                const rows = finalList.map(s => `<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.c};margin-right:6px"></i>${esc(s.l)}</span><b>${fmt(s.n)}</b></div>`).join('');
                bodyHtml = `<div style="position:relative;height:170px;margin-top:8px"><canvas id="${chartId}"></canvas></div><div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">${rows}</div>`;
            } else if (variant === 1) {
                const sorted = finalList.slice().sort((a, b) => b.n - a.n);
                const chartId = chartCanvasId();
                queueDimChart(chartId, 'bar', sorted.map(s => s.l), sorted.map(s => s.n), sorted.map(s => s.c));
                bodyHtml = `<div style="position:relative;height:${Math.max(140, sorted.length * 34 + 20)}px;margin-top:8px"><canvas id="${chartId}"></canvas></div>`;
            } else {
                const chartId = chartCanvasId();
                queueDimChart(chartId, 'line', trendMonthLabels(6), trendSeriesFor(tot, seed, 6), ['#39d5ff']);
                const doneCnt = cnts.done || 0, remain = Math.max(0, tot - doneCnt);
                bodyHtml = `<div style="position:relative;height:170px;margin-top:8px"><canvas id="${chartId}"></canvas></div><div class="cir-stat-grid" style="margin-top:10px;margin-bottom:0"><div class="cir-stat-tile"><p>Đã hoàn thành</p><b>${fmt(doneCnt)}</b></div><div class="cir-stat-tile"><p>Đang xử lý/còn lại</p><b>${fmt(remain)}</b></div></div>`;
            }
        }
        return catBoxHtml(name, bodyHtml, freq);
    }
    function genUnitTableHtml(cat) {
        const cols = cat.items.map(it => it[0]);
        const thead = `<tr><th>Đơn vị</th>${cols.map(c => `<th style="text-align:right">${esc(c)}</th>`).join('')}</tr>`;
        const hasUnitData = cat.items.some(it => (it[5] || []).length);
        const rows = TW_DANG_BO_NAMES.map((name, rowIndex) => `<tr><td>${esc(name)}</td>${cat.items.map(it => `<td class="num" style="text-align:right">${fmt((it[5] || [])[rowIndex] || 0)}</td>`).join('')}</tr>`).join('');
        return `<div class="cat-chart-box gen-unit-box" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
        <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${TW_DANG_BO_NAMES.length} đảng bộ</div>
        <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">${hasUnitData ? 'Số liệu theo 40 đảng bộ, trích Biểu số 1, 2A, 4 và 5-BTCTW.' : 'Chưa có số liệu theo từng đảng bộ.'}</p>
        <input type="text" placeholder="Tìm tên đơn vị..." oninput="const q=this.value.toLowerCase();this.nextElementSibling.querySelectorAll('tbody tr').forEach(r=>{r.style.display=r.children[0].textContent.toLowerCase().includes(q)?'':'none';})" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
        <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto;width: 100%;">
            <table class="iip-table" style="min-width:${280 + cols.length * 110}px"><thead>${thead}</thead><tbody>${rows}</tbody></table>
        </div>
        </div>`;
    }

    window.openVuCoSoDangPopup = function () {
        const cat = vuCoSoDangCat;
        document.getElementById('drawerTitle-ct').textContent = `Lĩnh vực: ${cat.name}`;
        const count = (cat.items || []).length;
        const gridClass = getChartGridClass(count);
        const cardsHtml = cat.items.length
            ? `<div class="cat-item-list ${gridClass}">${cat.items.map((it, idx) => catItemCardHtml(cat.id, idx, it)).join('')}</div>`
            : `<div class="access-lock" style="text-align:center;padding:24px 12px">Không có chỉ tiêu được giao.</div>`;
        document.getElementById('drawerBodyCT').innerHTML = `<div class="cat-charts-full-grid">${cardsHtml}</div>`;
        openDrawerCT();
        setTimeout(flushPendingDimCharts, 50);
    }
})();
