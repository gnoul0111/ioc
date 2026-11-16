/* Kiểm tra khung «Cấu hình chức năng IOC» (js/core/ioc-cau-hinh.js): mặc định đúng bảng anh duyệt 17/11/2026,
   khoảng nhập động, lưu/đọc localStorage, dữ liệu lưu hỏng.
   Chạy: node tests/cau-hinh/ioc-cau-hinh.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const src = fs.readFileSync(path.join(root, 'js/core/ioc-cau-hinh.js'), 'utf8');

function moi() {
  const store = {};
  const nghe = {};
  const ctx = {
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    window: { addEventListener: (ev, cb) => { (nghe[ev] = nghe[ev] || []).push(cb); }, dispatchEvent() {} },
    CustomEvent: function (n) { this.type = n; },
    console
  };
  vm.createContext(ctx);
  vm.runInContext(src + '\n;this.API={ICH_CHUC_NANG,ICH_THAM_SO,ICH_STORE_KEY,ichMacDinh,ichKiemTra,ichKhoang,ichDoc,ichLuu,ichBat,ichSo,ichSaoChep,ichKhiDoi,ichBiKhoa,ichDangDung,ichGop,ichUuTien,ichTab};', ctx);
  return { ...ctx.API, store, nghe, reset: () => vm.runInContext('ichCache=null', ctx) };
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ---- Khai báo ---- */
let A = moi();
const ids = A.ICH_THAM_SO.map((t) => t.id);
ok(new Set(ids).size === ids.length, 'mã tham số không trùng');
const tabs = A.ICH_CHUC_NANG[0].tabs.map((t) => t.key);
ok(eq(A.ICH_CHUC_NANG.map((c) => c.key), ['noti']), 'lần này chỉ có chức năng Noti');
ok(eq(tabs, ['kcqt', 'nv', 'vb', 'kpi', 'gis']), '5 tab Noti đúng thứ tự');
ok(A.ICH_THAM_SO.every((t) => tabs.includes(t.tab) && t.ten && t.moTa), 'mỗi tham số thuộc tab có thật, có tên và cách áp dụng');
ok(A.ICH_THAM_SO.every((t) => !t.so || (t.so.macDinh != null)), 'ô số nào cũng có mặc định');
ok(A.ICH_THAM_SO.filter((t) => t.phuThuoc).every((t) => A.ICH_THAM_SO.some((x) => x.id === t.phuThuoc)), 'dòng phụ thuộc trỏ tới dòng có thật');

/* ---- Mặc định đúng bảng đã duyệt ---- */
const md = A.ichMacDinh();
const so = (id) => md[id].so, bat = (id) => md[id].bat;
ok(eq(A.ICH_THAM_SO.filter((t) => t.tab === 'kcqt').map((t) => [t.muc, t.icon, bat(t.id)]),
  [['Cao', '❗', true], ['Khẩn cấp', '⚠️', true], ['Gấp', '⚠️', false], ['Từ mức', '⚠️', true], ['Khẩn', '⚠️', true]]), 'KC/QT: mức, icon, mặc định (Gấp tắt)');
ok(so('noti.kcqt.gisNguyHiem') === 4, 'GIS: mức nguy hiểm từ 4');
ok(eq(A.ICH_THAM_SO.filter((t) => t.tab === 'nv').map((t) => t.id.split('.')[2]),
  ['moi', 'trongHan', 'sapHetHan', 'hanHomNay', 'quaHan', 'mocQuaHan', 'quaHanKhanCap', 'hoanThanh', 'capNhat', 'tienDoThap']), 'Nhiệm vụ: dòng xếp theo vòng đời như ảnh mẫu');
ok(eq(A.ichUuTien('noti', 'nv'), ['quaHanKhanCap', 'quaHan', 'hanHomNay', 'sapHetHan', 'moi', 'trongHan', 'hoanThanh'].map((k) => 'noti.nv.' + k)), 'Nhiệm vụ: thứ tự ưu tiên đã chốt');
ok(eq(A.ichUuTien('noti', 'vb'), ['noti.vb.sapDenHan', 'noti.vb.moi', 'noti.vb.doiTrangThai']), 'Văn bản: thứ tự ưu tiên');
ok(A.ICH_CHUC_NANG.every((c) => c.tabs.every((t) => (t.uuTien || []).every((k) => A.ICH_THAM_SO.some((x) => x.id === `${c.key}.${t.key}.${k}`)))), 'thứ tự ưu tiên chỉ trỏ tới tham số có thật');
ok(A.ichTab('noti', 'kcqt').congTac.tat === 'Ngừng hoạt động' && !A.ichTab('noti', 'nv').congTac, 'chữ công tắc: KC/QT «Hoạt động», tab khác mặc định');
ok(so('noti.nv.quaHanKhanCap') === 10 && so('noti.nv.mocQuaHan') === 5 && so('noti.nv.sapHetHan') === 3 && so('noti.nv.moi') === 3, 'Nhiệm vụ: 10 / 5 / 3 / 3 ngày');
ok(so('noti.nv.hoanThanh') === 0 && so('noti.nv.capNhat') === 3 && so('noti.nv.tienDoThap') === 40, 'Hoàn thành 0, Cập nhật 3, Tiến độ thấp 40%');
ok(so('noti.vb.sapDenHan') === 3 && so('noti.vb.moi') === 3, 'Văn bản: 3 / 3 ngày');
ok(A.ICH_THAM_SO.filter((t) => t.tab === 'kpi').length === 6 && A.ICH_THAM_SO.filter((t) => t.tab === 'kpi').every((t) => bat(t.id) && !t.so), 'OKR/KPI: 6 công tắc, bật hết, không ô số');
ok(eq(A.ICH_THAM_SO.filter((t) => t.chiXem).map((t) => t.id),
  ['noti.kcqt.cameraKhan', 'noti.nv.hanHomNay', 'noti.vb.doiTrangThai', 'noti.gis.cad']), 'đúng 4 dòng chỉ hiển thị');
ok(eq(A.ichKiemTra(md), {}), 'bộ mặc định hợp lệ');

/* ---- Khoảng nhập động ---- */
let g = A.ichSaoChep(md);
ok(eq([A.ichKhoang('noti.nv.quaHanKhanCap', g).min, A.ichKhoang('noti.nv.quaHanKhanCap', g).max], [6, 50]), 'mốc 5 → Quá hạn khẩn cấp nhập từ 6 đến 50');
ok(eq([A.ichKhoang('noti.nv.mocQuaHan', g).min, A.ichKhoang('noti.nv.mocQuaHan', g).max], [2, 9]), 'khẩn cấp 10 → mốc nhập từ 2 đến 9');
g['noti.nv.mocQuaHan'].so = 7;
ok(A.ichKhoang('noti.nv.quaHanKhanCap', g).min === 8, 'đổi mốc 7 → khẩn cấp từ 8');
g['noti.nv.mocQuaHan'].so = 10;
let loi = A.ichKiemTra(g);
ok(loi['noti.nv.mocQuaHan'] && loi['noti.nv.quaHanKhanCap'], 'mốc = khẩn cấp → báo lỗi cả hai ô');
ok(/Nhập từ 2 đến 9/.test(loi['noti.nv.mocQuaHan']) && /Nhập từ 11 đến 50/.test(loi['noti.nv.quaHanKhanCap']), 'lời báo ghi rõ khoảng đúng');
g['noti.nv.mocQuaHan'].bat = false;
ok(A.ichKhoang('noti.nv.quaHanKhanCap', g).min === 2 && !A.ichKiemTra(g)['noti.nv.quaHanKhanCap'], 'tắt mốc → khẩn cấp nhập từ 2, không còn lỗi');
ok(!A.ichKiemTra(g)['noti.nv.mocQuaHan'], 'dòng tắt không bắt nhập');
g = A.ichSaoChep(md); g['noti.nv.quaHan'].bat = false;
ok(A.ichBiKhoa('noti.nv.mocQuaHan', g) && !A.ichDangDung('noti.nv.mocQuaHan', g), 'tắt Quá hạn → khóa mốc nhận biết');
ok(A.ichKhoang('noti.nv.quaHanKhanCap', g).min === 2, 'tắt Quá hạn → khẩn cấp nhập từ 2');
g = A.ichSaoChep(md); g['noti.nv.quaHanKhanCap'].bat = false;
ok(A.ichKhoang('noti.nv.mocQuaHan', g).max === 50, 'tắt khẩn cấp → mốc nhập tới 50');
g = A.ichSaoChep(md); g['noti.nv.quaHanKhanCap'].so = null;
ok(A.ichKiemTra(g)['noti.nv.quaHanKhanCap'] === 'Nhập số nguyên' && !A.ichKiemTra(g)['noti.nv.mocQuaHan'], 'ô trống báo «Nhập số nguyên», không kéo lỗi sang ô kia');
g = A.ichSaoChep(md); g['noti.nv.hoanThanh'].so = 0; g['noti.nv.sapHetHan'].so = 0; g['noti.nv.tienDoThap'].so = 101; g['noti.kcqt.gisNguyHiem'].so = 6;
loi = A.ichKiemTra(g);
ok(!loi['noti.nv.hoanThanh'] && loi['noti.nv.sapHetHan'] && loi['noti.nv.tienDoThap'] && loi['noti.kcqt.gisNguyHiem'], 'Hoàn thành nhận 0; Sắp hết hạn 0, tiến độ 101%, mức GIS 6 bị chặn');
g = A.ichSaoChep(md); g['noti.nv.moi'].so = 2.5;
ok(A.ichKiemTra(g)['noti.nv.moi'] === 'Nhập số nguyên', 'số lẻ bị chặn');

/* ---- Lưu / đọc ---- */
A = moi();
ok(A.ichSo('noti.nv.sapHetHan') === 3 && A.ichBat('noti.kcqt.khanCap') && !A.ichBat('noti.kcqt.gap'), 'chưa lưu gì → đọc mặc định');
g = A.ichSaoChep(A.ichDoc()); g['noti.nv.sapHetHan'].so = 7; g['noti.kcqt.gap'].bat = true;
let goi = 0; A.ichKhiDoi(() => goi++);
let kq = A.ichLuu(g);
ok(kq.ok && A.ichSo('noti.nv.sapHetHan') === 7 && A.ichBat('noti.kcqt.gap') && goi === 1, 'lưu xong đọc ra giá trị mới và báo cho chức năng');
A.reset();
ok(A.ichSo('noti.nv.sapHetHan') === 7, 'đọc lại từ localStorage (tải lại trang) vẫn đúng');
g = A.ichSaoChep(A.ichDoc()); g['noti.nv.mocQuaHan'].so = 20;
kq = A.ichLuu(g);
ok(!kq.ok && kq.loi['noti.nv.mocQuaHan'] && A.ichSo('noti.nv.mocQuaHan') === 5, 'bộ sai thì không lưu, giá trị cũ giữ nguyên');
g = A.ichSaoChep(A.ichDoc()); g['noti.nv.hanHomNay'].bat = false;
A.ichLuu(g);
ok(A.ichBat('noti.nv.hanHomNay'), 'dòng chỉ hiển thị không tắt được');
/* Trang khác lưu → sự kiện storage → đọc lại. */
A.store[A.ICH_STORE_KEY] = JSON.stringify({ v: 1, giaTri: { 'noti.nv.moi': { bat: true, so: 9 } } });
goi = 0; A.nghe.storage.forEach((cb) => cb({ key: A.ICH_STORE_KEY }));
ok(A.ichSo('noti.nv.moi') === 9 && goi === 1, 'trang khác lưu → đọc giá trị mới, báo cho chức năng');

/* ---- Dữ liệu lưu hỏng ---- */
for (const [raw, ten] of [['{hỏng', 'JSON hỏng'], ['null', 'null'], [JSON.stringify({ giaTri: { 'noti.nv.moi': { so: 'ba' }, 'la.ma': { bat: false } } }), 'sai kiểu, mã lạ']]) {
  A = moi(); A.store[A.ICH_STORE_KEY] = raw;
  ok(eq(A.ichDoc(), A.ichMacDinh()), `${ten} → dùng mặc định`);
}
A = moi(); A.store[A.ICH_STORE_KEY] = JSON.stringify({ giaTri: { 'noti.nv.mocQuaHan': { bat: true, so: 30 }, 'noti.nv.sapHetHan': { bat: true, so: 5 } } });
ok(A.ichSo('noti.nv.mocQuaHan') === 5 && A.ichSo('noti.nv.sapHetHan') === 5, 'dòng lưu không hợp lệ về mặc định, dòng hợp lệ giữ nguyên');

console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
