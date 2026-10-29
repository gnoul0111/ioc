/* Kiểm tra tính năng Ẩn/Hiện giao diện: logic bố cục lưới (uvComputeLayout) và danh mục khối.
   Chạy: node tests/ui/ui-visibility.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const src = fs.readFileSync(path.join(root, 'js/features/ui-visibility.js'), 'utf8');

// Chỉ nạp phần logic: DOM/window giả tối thiểu để file nạp được trong Node.
const dynamicNodes = [
   { dataset: { uvItem: 'notify-tab-urgent', uvLabel: 'Khẩn cấp/Quan trọng', uvIcon: '🔔', uvParent: 'notify' }, textContent: '' },
   { dataset: { uvItem: 'notify-tab-nv', uvLabel: 'Nhiệm vụ', uvIcon: '🔔', uvParent: 'notify' }, textContent: '' },
   { dataset: { uvItem: 'notify-tab-vb', uvLabel: 'Văn bản', uvIcon: '🔔', uvParent: 'notify' }, textContent: '' },
   { dataset: { uvItem: 'notify-tab-kpi', uvLabel: 'OKR/KPI', uvIcon: '🔔', uvParent: 'notify' }, textContent: '' },
   { dataset: { uvItem: 'notify-tab-gis', uvLabel: 'GIS/Camera AI', uvIcon: '🔔', uvParent: 'notify' }, textContent: '' },
   { dataset: { uvItem: 'ubnd-kpi-fields', uvLabel: 'Lĩnh vực', uvIcon: '📊', uvParent: 'ubndIndicatorOverview', uvGroup: 'ubndIndicatorOverview-summary', uvGroupLabel: 'Số liệu then chốt', uvGroupIcon: '📊' }, textContent: 'Lĩnh vực' }
];
const ctx = { document: { addEventListener() {}, querySelectorAll: () => dynamicNodes }, window: { addEventListener() {} }, localStorage: {} };
ctx.window.window = ctx.window;
vm.createContext(ctx);
vm.runInContext(src + '\n;this.L=uvComputeLayout;this.B=UV_BLOCKS;this.V=uvIsVisible;this.A=uvAllBlocks;this.T=uvBuildTree;this.C=uvShouldCollapseSidebar;', ctx);
const { L, B, V, A, T, C } = ctx;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Danh mục
ok(B.length === 15 && new Set(B.map((b) => b.id)).size === 15, '15 mục, id không trùng');
ok(B.every((b) => (b.sel || b.virtual) && b.label && b.icon), 'mỗi mục đủ selector hoặc cờ virtual, nhãn, biểu tượng');
ok(B.some((b) => b.id === 'assignPopup' && b.virtual), 'cửa sổ giao nhiệm vụ có thể ẩn riêng');
ok(eq(B.filter((b) => b.parent === 'overview').map((b) => b.id), ['overview-documents', 'overview-assigned', 'overview-received']), 'ba thẻ con của tổng quan có thể ẩn riêng');
ok(B.some((b) => b.id === 'ubndIndicatorOverview' && b.parent === 'indicators'), 'tổng quan chỉ tiêu UBND có thể ẩn riêng');
ok(B.some((b) => b.id === 'gisCadBlock' && b.parent === 'gis' && b.unavailableAttr === 'hidden'), 'Điều phối CAD là mục con GIS, ẩn khỏi popup khi không áp dụng');
ok(eq(B.filter((b) => ['gisBottleneckSection', 'gisStatusSection', 'gisUserReportsSection'].includes(b.id)).map((b) => b.parent), ['gis', 'gis', 'gis']), '5 điểm nghẽn, trạng thái và báo cáo là các mục con GIS');
const gisChildren = B.filter((b) => b.parent === 'gis');
ok(C(gisChildren, new Set(gisChildren.map((b) => b.id))), 'thu gọn sidebar khi mọi mục GIS con đều ẩn');
ok(!C(gisChildren, new Set()), 'giữ sidebar khi còn mục GIS con đang hiện');
ok(eq(A().filter((b) => b.dynamic).map((b) => b.id), ['notify-tab-urgent', 'notify-tab-nv', 'notify-tab-vb', 'notify-tab-kpi', 'notify-tab-gis', 'ubnd-kpi-fields']), 'nhận diện tab Notify và mục con render động');
const tree = T(A());
const notifyNode = tree.find((node) => node.block.id === 'notify');
const indicatorsNode = tree.find((node) => node.block.id === 'indicators');
ok(eq(notifyNode.children.map((node) => node.block.id), ['notify-tab-urgent', 'notify-tab-nv', 'notify-tab-vb', 'notify-tab-kpi', 'notify-tab-gis']), 'tab Notify được xếp dưới đúng nhóm');
ok(indicatorsNode.children.some((node) => node.block.id === 'ubndIndicatorOverview' && node.children.some((group) => group.block.groupOnly && group.block.label === 'Số liệu then chốt' && group.children.some((child) => child.block.id === 'ubnd-kpi-fields'))), 'ô KPI được xếp dưới nhóm số liệu tổng quan UBND');
const documents = B.find((b) => b.id === 'overview-documents');
ok(V(documents, new Set()), 'thẻ con hiện khi khung tổng quan hiện');
ok(!V(documents, new Set(['overview'])), 'thẻ con được tính ẩn khi khung tổng quan bị ẩn');
ok(eq(B.filter((b) => b.inGrid).map((b) => b.id), ['gis', 'notify', 'indicators']), '3 khối trong lưới: gis, notify, indicators');

// Bố cục thường (khối chính = GIS)
ok(eq(L([], false), { gridOn: false, fullIds: [] }), 'không ẩn gì → giữ bố cục gốc');
ok(eq(L(['overview', 'taskTally', 'natMap'], false), { gridOn: false, fullIds: [] }), 'ẩn khối ngoài lưới → lưới giữ nguyên');
ok(eq(L(['gis'], false), { gridOn: true, fullIds: ['notify'] }), 'ẩn GIS → Notify kéo giãn kín hàng');
ok(eq(L(['notify'], false), { gridOn: true, fullIds: ['gis'] }), 'ẩn Notify → GIS kéo giãn kín hàng');
ok(eq(L(['gis', 'notify'], false), { gridOn: true, fullIds: [] }), 'ẩn cả GIS và Notify → không còn gì để kéo giãn');
ok(eq(L(['indicators'], false), { gridOn: true, fullIds: [] }), 'ẩn Chỉ tiêu → GIS + Notify giữ chung hàng');

// Bố cục BTCTW (khối chính = Chỉ tiêu, GIS bị ẩn theo phân quyền)
ok(eq(L(['indicators'], true), { gridOn: true, fullIds: ['notify'] }), 'BTCTW: ẩn Chỉ tiêu → Notify kéo giãn');
ok(eq(L(['notify'], true), { gridOn: true, fullIds: ['indicators'] }), 'BTCTW: ẩn Notify → Chỉ tiêu kéo giãn');
ok(eq(L(['indicators', 'notify'], true), { gridOn: true, fullIds: [] }), 'BTCTW: ẩn cả hai → không kéo giãn');

// Đầu vào lạ không làm hỏng
ok(eq(L(undefined, false), { gridOn: false, fullIds: [] }), 'đầu vào undefined an toàn');
ok(eq(L(['khong-ton-tai'], false), { gridOn: false, fullIds: [] }), 'id lạ bị bỏ qua');

console.log(fail ? `✗ ${fail} lỗi, ${pass} đạt` : `✓ ${pass} kiểm tra đạt`);
process.exit(fail ? 1 : 0);
