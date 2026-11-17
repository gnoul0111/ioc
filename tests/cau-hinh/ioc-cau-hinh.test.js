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
ok(eq(tabs, ['kcqt', 'nv', 'kpi', 'gis']), '4 tab Noti (Văn bản không có tham số nên không có tab)');
ok(A.ICH_THAM_SO.every((t) => tabs.includes(t.tab) && t.ten && t.moTa), 'mỗi tham số thuộc tab có thật, có tên và cách áp dụng');
ok(A.ICH_THAM_SO.every((t) => !t.so || (t.so.macDinh != null)), 'ô số nào cũng có mặc định');
ok(A.ICH_THAM_SO.filter((t) => t.phuThuoc).every((t) => A.ICH_THAM_SO.some((x) => x.id === t.phuThuoc)), 'dòng phụ thuộc trỏ tới dòng có thật');

/* ---- Mặc định đúng bảng đã duyệt ---- */
const md = A.ichMacDinh();
const so = (id) => md[id].so, bat = (id) => md[id].bat;
ok(eq(A.ICH_THAM_SO.filter((t) => t.tab === 'kcqt').map((t) => [t.muc, t.icon.startsWith('<svg') ? 'sao' : t.icon, bat(t.id)]),
  [['Hỏa tốc', '🔥', true], ['Thượng khẩn', '⚠️', true], ['Khẩn', '❗', true], ['Cao', 'sao', true], ['Từ mức', '⚠️', true], ['Khẩn', '⚠️', true]]), 'KC/QT: Hỏa tốc 🔥, Thượng khẩn ⚠️, Khẩn ❗, quan trọng Cao ngôi sao vàng (SVG)');
ok(so('noti.kcqt.gisNguyHiem') === 4, 'GIS: mức nguy hiểm từ 4');
ok(eq(A.ICH_THAM_SO.filter((t) => t.tab === 'nv').map((t) => t.id.split('.')[2]),
  ['moi', 'trongHan', 'sapHetHan', 'hanHomNay', 'quaHan', 'quaHanKhanCap', 'choDuyet', 'hoanThanh', 'tienDoThap']), 'Nhiệm vụ: dòng theo vòng đời; đã bỏ Mốc nhận biết quá hạn, Cập nhật trạng thái');
ok(A.ICH_THAM_SO.find((t) => t.id === 'noti.nv.trongHan').nhan[0] === 'Đang thực hiện', '«Trong hạn» đổi tên thành «Đang thực hiện»');
ok(eq(A.ichUuTien('noti', 'nv'), ['hoanThanh', 'choDuyet', 'quaHanKhanCap', 'quaHan', 'hanHomNay', 'sapHetHan', 'moi', 'trongHan'].map((k) => 'noti.nv.' + k)), 'Nhiệm vụ: thứ tự ưu tiên đã chốt');
ok(A.ICH_CHUC_NANG.every((c) => c.tabs.every((t) => (t.uuTien || []).every((k) => A.ICH_THAM_SO.some((x) => x.id === `${c.key}.${t.key}.${k}`)))), 'thứ tự ưu tiên chỉ trỏ tới tham số có thật');
ok(A.ichTab('noti', 'kcqt').congTac.tat === 'Ngừng hoạt động' && !A.ichTab('noti', 'nv').congTac, 'chữ công tắc: KC/QT «Hoạt động», tab khác mặc định');
ok(so('noti.nv.quaHanKhanCap') === 10 && so('noti.nv.sapHetHan') === 3 && so('noti.nv.moi') === 3, 'Nhiệm vụ: 10 / 3 / 3 ngày');
ok(so('noti.nv.hoanThanh') === 1 && so('noti.nv.tienDoThap') === 40 && bat('noti.nv.choDuyet'), 'Hoàn thành 1 ngày, Tiến độ thấp 40%, Chờ duyệt bật');
ok(A.ICH_THAM_SO.filter((t) => t.tab === 'kpi').length === 6 && A.ICH_THAM_SO.filter((t) => t.tab === 'kpi').every((t) => bat(t.id) && !t.so), 'OKR/KPI: 6 công tắc, bật hết, không ô số');
ok(eq(A.ICH_THAM_SO.filter((t) => t.chiXem).map((t) => t.id),
  ['noti.kcqt.cameraKhan', 'noti.nv.trongHan', 'noti.nv.hanHomNay', 'noti.nv.quaHan', 'noti.gis.cad']), 'đúng 5 dòng luôn bật (Đang thực hiện, Quá hạn bắt buộc bật)');
ok(eq(A.ichKiemTra(md), {}), 'bộ mặc định hợp lệ');

/* ---- Khoảng nhập ---- */
let g = A.ichSaoChep(md);
ok(eq([A.ichKhoang('noti.nv.quaHanKhanCap', g).min, A.ichKhoang('noti.nv.quaHanKhanCap', g).max], [2, 50]), 'Quá hạn khẩn cấp nhập từ 2 đến 50');
g['noti.nv.quaHanKhanCap'].so = 1;
let loi = A.ichKiemTra(g);
ok(/Nhập từ 2 đến 50/.test(loi['noti.nv.quaHanKhanCap'] || ''), 'Quá hạn khẩn cấp 1 bị chặn, lời báo ghi rõ khoảng');
g['noti.nv.quaHanKhanCap'].bat = false;
ok(!A.ichKiemTra(g)['noti.nv.quaHanKhanCap'], 'dòng tắt không bắt nhập');
g = A.ichSaoChep(md); g['noti.nv.quaHanKhanCap'].so = null;
ok(A.ichKiemTra(g)['noti.nv.quaHanKhanCap'] === 'Nhập số nguyên', 'ô trống báo «Nhập số nguyên»');
g = A.ichSaoChep(md); g['noti.nv.hoanThanh'].so = 0; g['noti.nv.sapHetHan'].so = 0; g['noti.nv.tienDoThap'].so = 101; g['noti.kcqt.gisNguyHiem'].so = 6;
loi = A.ichKiemTra(g);
ok(!loi['noti.nv.hoanThanh'] && loi['noti.nv.sapHetHan'] && loi['noti.nv.tienDoThap'] && loi['noti.kcqt.gisNguyHiem'], 'Hoàn thành nhận 0; Sắp hết hạn 0, tiến độ 101%, mức GIS 6 bị chặn');
g = A.ichSaoChep(md); g['noti.nv.moi'].so = 2.5;
ok(A.ichKiemTra(g)['noti.nv.moi'] === 'Nhập số nguyên', 'số lẻ bị chặn');

/* ---- Lưu / đọc ---- */
A = moi();
ok(A.ichSo('noti.nv.sapHetHan') === 3 && A.ichBat('noti.kcqt.hoaToc') && A.ichBat('noti.kcqt.khan'), 'chưa lưu gì → đọc mặc định');
g = A.ichSaoChep(A.ichDoc()); g['noti.nv.sapHetHan'].so = 7; g['noti.kcqt.khan'].bat = false;
let goi = 0; A.ichKhiDoi(() => goi++);
let kq = A.ichLuu(g);
ok(kq.ok && A.ichSo('noti.nv.sapHetHan') === 7 && !A.ichBat('noti.kcqt.khan') && goi === 1, 'lưu xong đọc ra giá trị mới và báo cho chức năng');
A.reset();
ok(A.ichSo('noti.nv.sapHetHan') === 7, 'đọc lại từ localStorage (tải lại trang) vẫn đúng');
g = A.ichSaoChep(A.ichDoc()); g['noti.nv.quaHanKhanCap'].so = 99;
kq = A.ichLuu(g);
ok(!kq.ok && kq.loi['noti.nv.quaHanKhanCap'] && A.ichSo('noti.nv.quaHanKhanCap') === 10, 'bộ sai thì không lưu, giá trị cũ giữ nguyên');
g = A.ichSaoChep(A.ichDoc()); g['noti.nv.hanHomNay'].bat = false;
A.ichLuu(g);
ok(A.ichBat('noti.nv.hanHomNay'), 'dòng chỉ hiển thị không tắt được');
A.store[A.ICH_STORE_KEY] = JSON.stringify({ v: 1, giaTri: { 'noti.nv.trongHan': { bat: false }, 'noti.nv.quaHan': { bat: false } } }); A.reset();
ok(A.ichBat('noti.nv.trongHan') && A.ichBat('noti.nv.quaHan'), 'cấu hình cũ đã lưu tắt Đang thực hiện / Quá hạn → vẫn bật');
/* Trang khác lưu → sự kiện storage → đọc lại. */
A.store[A.ICH_STORE_KEY] = JSON.stringify({ v: 1, giaTri: { 'noti.nv.moi': { bat: true, so: 9 } } });
goi = 0; A.nghe.storage.forEach((cb) => cb({ key: A.ICH_STORE_KEY }));
ok(A.ichSo('noti.nv.moi') === 9 && goi === 1, 'trang khác lưu → đọc giá trị mới, báo cho chức năng');

/* ---- Dữ liệu lưu hỏng ---- */
for (const [raw, ten] of [['{hỏng', 'JSON hỏng'], ['null', 'null'], [JSON.stringify({ giaTri: { 'noti.nv.moi': { so: 'ba' }, 'la.ma': { bat: false } } }), 'sai kiểu, mã lạ']]) {
  A = moi(); A.store[A.ICH_STORE_KEY] = raw;
  ok(eq(A.ichDoc(), A.ichMacDinh()), `${ten} → dùng mặc định`);
}
A = moi(); A.store[A.ICH_STORE_KEY] = JSON.stringify({ giaTri: { 'noti.nv.quaHanKhanCap': { bat: true, so: 99 }, 'noti.nv.sapHetHan': { bat: true, so: 5 }, 'noti.nv.mocQuaHan': { bat: true, so: 5 } } });
ok(A.ichSo('noti.nv.quaHanKhanCap') === 10 && A.ichSo('noti.nv.sapHetHan') === 5 && A.ichDoc()['noti.nv.mocQuaHan'] === undefined, 'dòng lưu không hợp lệ về mặc định, dòng hợp lệ giữ nguyên, mã đã bỏ (mốc ‼) bị bỏ qua');

console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
