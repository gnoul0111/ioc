/* ============================== SẮP XẾP SỞ THEO BỘ MÁY MỚI — CÂY TÀI KHOẢN ==============================
   account-data.js là bản xuất account.json GỐC (BKAV CBCCVC), chưa cập nhật sắp xếp sở theo Nghị quyết HĐND Thành phố
   kỳ họp thứ 6 (10/8/2026): Sở Quy hoạch - Kiến trúc nhập vào Sở Xây dựng; Sở Du lịch nhập vào Sở Văn hóa và Thể thao
   thành Sở Văn hóa, Thể thao và Du lịch. File này KHÔNG sửa bản gốc mà dựng lại cây trên một bản sao rồi gán vào
   window.OUA_ACCOUNT_DATA, nên mọi màn đọc cây (trang quản trị, bản mobile, Nhật ký đăng nhập) cùng thấy sở mới:
     - lãnh đạo của sở cũ chuyển thành người dùng trực tiếp của sở nhận,
     - phòng, đơn vị của sở cũ thành đơn vị con của sở nhận (tên chưa nói rõ gốc thì ghi thêm "từ Sở … cũ"),
     - nút sở cũ bỏ khỏi cây. Không người dùng nào bị mất.
   Bản gốc giữ ở window.OUA_ACCOUNT_DATA_GOC. Đặt ACCOUNT_SAP_XEP_SO_2026 = false là quay về cây gốc.
   Nạp NGAY SAU js/core/account-data.js, trước mọi file đọc OUA_ACCOUNT_DATA. */
const ACCOUNT_SAP_XEP_SO_2026 = true;
/* [sở cũ, sở nhận, tên mới của sở nhận (null = giữ tên), từ khóa nhận ra đơn vị con vốn thuộc sở cũ] */
const ACCOUNT_SO_NHAP = [
  ['Sở Du lịch', 'Sở Văn hóa và Thể thao', 'Sở Văn hóa, Thể thao và Du lịch', /du lịch/i],
  ['Sở Quy hoạch Kiến trúc', 'Sở Xây dựng', null, /quy hoạch/i]
];
(function () {
  if (!ACCOUNT_SAP_XEP_SO_2026 || typeof window === 'undefined' || !window.OUA_ACCOUNT_DATA) return;
  window.OUA_ACCOUNT_DATA_GOC = window.OUA_ACCOUNT_DATA;
  const root = JSON.parse(JSON.stringify(window.OUA_ACCOUNT_DATA));
  const norm = (s) => String(s || '').replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  /* đổi path của cả nhánh sang cha mới */
  function rePath(n, parentPath) {
    n.path = parentPath + '.' + n.id;
    (n.children || []).forEach((c) => { c.parent_id = n.id; rePath(c, n.path); });
  }
  (function walk(p) {
    const kids = p.children || [];
    ACCOUNT_SO_NHAP.forEach(([cu, nhan, ten, kw]) => {
      const src = kids.find((c) => norm(c.name) === norm(cu)), dst = kids.find((c) => norm(c.name) === norm(nhan));
      if (!src || !dst) return;
      dst.users = (dst.users || []).concat(src.users || []);
      (src.children || []).forEach((c) => {
        if (!kw.test(c.name || '')) c.name = String(c.name || '').trim() + ' (từ ' + cu.replace('Quy hoạch Kiến trúc', 'Quy hoạch - Kiến trúc') + ' cũ)';
        c.parent_id = dst.id; c.level = dst.level + 1; rePath(c, dst.path);
        dst.children = (dst.children || []).concat([c]);
      });
      if (ten) dst.name = ten;
      kids.splice(kids.indexOf(src), 1);
    });
    kids.forEach(walk);
  })(root);
  window.OUA_ACCOUNT_DATA = root;
})();
