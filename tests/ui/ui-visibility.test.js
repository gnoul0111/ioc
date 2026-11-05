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
vm.runInContext(src + '\n;this.L=uvComputeLayout;this.B=UV_BLOCKS;this.V=uvIsVisible;this.A=uvAllBlocks;this.T=uvBuildTree;this.C=uvShouldCollapseSidebar;'
  + 'this.P=uvPickNotifyTab;this.BP=uvBadgePos;this.DC=uvShouldCloseOnDocClick;'
  + 'this.IID=uvIndicatorItemId;this.RN=uvRenameIds;this.COL=uvIsCollapsedIn;this.FT=uvFilterTree;this.NORM=uvNorm;this.CNT=uvCountHidden;this.ESC=uvEscAction;this.PR=uvPickRoot;this.NC=uvNodeCounts;', ctx);
const { L, B, V, A, T, C, P, BP, DC, IID, RN, COL, FT, NORM, CNT, ESC, PR, NC } = ctx;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Danh mục
ok(B.length === 14 && new Set(B.map((b) => b.id)).size === 14, '14 mục, id không trùng');
ok(B.every((b) => (b.sel || b.virtual) && b.label && b.icon), 'mỗi mục đủ selector hoặc cờ virtual, nhãn, biểu tượng');
ok(!B.some((b) => b.id === 'assignPopup'), 'không có mục ẩn cửa sổ giao nhiệm vụ');
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

// Nút "−" đặt ở góc khung vàng, không đè lên nội dung bên trong khối
const box = { left: 100, top: 200, width: 300, height: 120 };
ok(eq(BP(box, false), { left: 85, top: 185 }), 'khối thường: tâm nút "−" ở góc viền vàng (ra ngoài 3px)');
ok(eq(BP(box, true), { left: 88, top: 188 }), 'mục con (viền vẽ bên trong): tâm nút "−" ở đúng góc khối');
ok(BP(box, false).left + 24 / 2 <= box.left && BP(box, false).top + 24 / 2 <= box.top, 'khối thường: tâm nút nằm ngoài khối, nút chỉ lấn vào góc 9px');

// Ẩn đúng tab Notify đang chọn → chuyển sang tab đầu tiên còn hiện
const tabKeys = ['urgent', 'nv', 'vb', 'kpi', 'gis'];
ok(P('urgent', tabKeys, new Set(['notify-tab-urgent'])) === 'nv', 'ẩn tab đang chọn → chuyển sang tab đầu còn hiện');
ok(P('nv', tabKeys, new Set(['notify-tab-urgent', 'notify-tab-nv'])) === 'vb', 'bỏ qua các tab đã ẩn khi chọn tab thay');
ok(P('nv', tabKeys, new Set(['notify-tab-urgent'])) === null, 'tab đang chọn vẫn hiện → không đổi tab');
ok(P('urgent', tabKeys, new Set(tabKeys.map((k) => `notify-tab-${k}`))) === null, 'mọi tab đều ẩn → không đổi tab');
ok(P('urgent', tabKeys, ['notify-tab-urgent']) === 'nv', 'nhận cả mảng id ẩn');

// Kéo / kéo giãn bảng chọn rồi nhả chuột ngoài bảng → không đóng bảng
ok(DC({ ignoreNextClick: false, panelDrag: null, panelResize: null }) === true, 'bấm ra ngoài bình thường → đóng bảng');
ok(DC({ ignoreNextClick: true, panelDrag: null, panelResize: null }) === false, 'click sinh ra lúc nhả chuột kết thúc kéo → giữ bảng');
ok(DC({ ignoreNextClick: false, panelDrag: null, panelResize: { pointerId: 1 } }) === false, 'đang kéo giãn → giữ bảng');
ok(DC({ ignoreNextClick: false, panelDrag: { pointerId: 1 }, panelResize: null }) === false, 'đang kéo tiêu đề → giữ bảng');

// Mã cố định cho ô/thẻ khu chỉ tiêu: không theo bộ lọc, không theo số thứ tự
const kpiAll = IID('kpi', `openCategoryDetail('DANG','dang-to-chuc',"g:dang5")`, 'Tổng đảng viên hiện có (cuối kỳ)');
ok(!/all|indicator-|stc-kpi/.test(kpiAll), 'mã ô số liệu không kèm bộ lọc, không kèm class');
ok(kpiAll !== IID('kpi', `openCategoryDetail('DANG','dang-to-chuc',"g:dang5")`, 'Số kết nạp mới trong kỳ'), 'hai ô cùng mở 1 eform nhưng khác tên → khác mã');
ok(IID('unit', "openCategoryDetail('UBND','ubnd-yte')", 'Sở Y tế') === IID('unit', "openCategoryDetail('UBND','ubnd-yte')", 'Sở Y tế (tên khác)'), 'thẻ đơn vị: mã theo đơn vị, đổi tên hiển thị không đổi mã');
ok(IID('kpi', "openCategoryDetail('UBND','ubnd-taichinh')", 'Thu ngân sách nhà nước').startsWith('ind-kpi-'), 'mã có tiền tố ind-<loại>-');
ok(/^[a-z0-9-]+$/.test(IID('group', 'ctmOvPick("tu-all-ef","DANG")', 'Thành ủy')), 'mã chỉ gồm chữ thường không dấu, số, gạch nối');

// Chuyển lựa chọn đã lưu từ mã cũ sang mã mới
const al = new Map([['indicator-ALL-uo-card-x', 'ind-unit-x'], ['ubnd-kpi-0', 'ind-kpi-y']]);
ok(eq(RN(['gis', 'indicator-ALL-uo-card-x', 'ubnd-kpi-0'], al), { ids: ['gis', 'ind-unit-x', 'ind-kpi-y'], changed: true }), 'đổi mã cũ sang mã mới, giữ mục khác');
ok(eq(RN(['ind-unit-x', 'indicator-ALL-uo-card-x'], al), { ids: ['ind-unit-x'], changed: true }), 'mã cũ và mã mới cùng có → bỏ trùng');
ok(eq(RN(['gis'], al), { ids: ['gis'], changed: false }), 'không có mã cũ → không đổi');

// Nhóm mặc định thu gọn, nhớ lựa chọn mở/đóng
ok(COL({}, { id: 'indicators-summary', groupOnly: true }) === true, 'nhóm chỉ tiêu mặc định thu gọn');
ok(COL({}, { id: 'notify' }) === false, 'khối thường mặc định mở');
ok(COL({ 'indicators-summary': 'open' }, { id: 'indicators-summary', groupOnly: true }) === false, 'nhớ nhóm người dùng đã mở');
ok(COL({ notify: 'closed' }, { id: 'notify' }) === true, 'nhớ khối người dùng đã thu gọn');

// Tìm kiếm trong bảng chọn
ok(NORM('Đảng ủy Phường') === 'dang uy phuong', 'bỏ dấu, chữ thường khi tìm');
const ftree = T(A());
const fNotify = FT(ftree, 'khan cap');
ok(fNotify.length === 1 && fNotify[0].block.id === 'notify' && fNotify[0].forceOpen && fNotify[0].children.length === 1 && fNotify[0].children[0].block.id === 'notify-tab-urgent', 'tìm “khan cap” → chỉ còn Notify (buộc mở) và đúng tab khớp');
const fWhole = FT(ftree, 'notify');
ok(fWhole.length === 1 && fWhole[0].children.length === 5 && !fWhole[0].forceOpen, 'tìm trúng mục cha → giữ cả nhánh con');
ok(FT(ftree, '').length === ftree.length, 'ô tìm trống → hiện đủ');
ok(FT(ftree, 'khong co muc nay').length === 0, 'không khớp → danh sách rỗng');

// Đếm số mục đang ẩn
ok(CNT([{ id: 'gis' }, { id: 'notify' }, { id: 'g', groupOnly: true }], new Set(['gis', 'g', 'khong-co'])) === 1, 'chỉ đếm mục tài khoản đang có, không đếm nhóm gom');

// Phím Esc
ok(ESC({ overlayOpen: false, panelOpen: true, editing: true }) === 'close-panel', 'Esc lần 1: chỉ đóng bảng chọn');
ok(ESC({ overlayOpen: false, panelOpen: false, editing: true }) === 'exit-edit', 'Esc lần 2: thoát chế độ chỉnh sửa');
ok(ESC({ overlayOpen: true, panelOpen: true, editing: true }) === 'none', 'đang mở hộp thoại IOC → để Esc cho hộp thoại');
ok(ESC({ overlayOpen: false, panelOpen: false, editing: false }) === 'none', 'không chỉnh sửa → Esc không làm gì');


// Bảng 2 cột: khối đang chọn ở cột trái, đếm mục con
ok(PR(['overview', 'gis', 'notify'], 'notify') === 'notify', 'giữ khối đang chọn nếu còn trong danh sách');
ok(PR(['overview', 'gis'], 'notify') === 'overview', 'khối đang chọn không còn (vd lọc tìm kiếm) → chọn khối đầu');
ok(PR([], 'notify') === null, 'không có khối nào → không chọn');
const ntree = T(A()).find((n) => n.block.id === 'notify');
ok(eq(NC(ntree, new Set(['notify-tab-vb'])), { total: 5, hidden: 1 }), 'Notify: 5 mục con, đang ẩn 1');
const itree = T(A()).find((n) => n.block.id === 'indicators');
ok(NC(itree, new Set()).total === 2, 'không đếm nhóm chỉ để gom (Số liệu then chốt) là mục con');



console.log(fail ?`✗ ${fail} lỗi, ${pass} đạt` : `✓ ${pass} kiểm tra đạt`);
process.exit(fail ? 1 : 0);
