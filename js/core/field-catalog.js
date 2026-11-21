/* Danh mục lĩnh vực theo đơn vị — dùng chung cho màn quản trị «Cài đặt lĩnh vực» (js/oua-data.js) và ô «Nhóm lĩnh vực»
   khi giao nhiệm vụ (js/core/assign-task.js). Anh chốt 21/11/2026: mặc định 12 lĩnh vực của màn quản trị; ô «Nhóm lĩnh vực»
   lấy danh mục của đơn vị NGƯỜI GIAO, chỉ chọn trong các lĩnh vực «Đang dùng» (lĩnh vực đã ẩn không chọn được).
   Lưu trên trình duyệt (localStorage) để trang quản trị và IOC cùng đọc — bản demo chưa có máy chủ, nên chưa dùng chung giữa các máy.
   Khóa lưu: { "<mã đơn vị>": [ {code, name, desc, source:'default'|'custom', status:'active'|'hidden'} ] }; đơn vị chưa có khóa
   dùng danh mục mặc định. Mã đơn vị: 'AXIS:DANG|HDND|UBND|MTTQ' (cấp Thành phố) hoặc 'TW:<mã đơn vị Trung ương>' (ouaTwUnits). */
const FIELD_CATALOG_KEY = 'px-ioc-field-catalog:v1';
const FIELD_CATALOG_DEFAULT = [
  {code:'Y_TE', name:'Y tế'}, {code:'GIAO_DUC', name:'Giáo dục'}, {code:'HCC', name:'HCC'},
  {code:'TAI_CHINH', name:'Tài chính'}, {code:'GIAO_THONG', name:'Giao thông'}, {code:'XAY_DUNG', name:'Xây dựng'},
  {code:'TNMT', name:'TNMT'}, {code:'KHCN', name:'KHCN'}, {code:'LDTBXH', name:'LĐTBXH'}, {code:'NOI_CHINH', name:'Nội chính'},
  {code:'VH_XH', name:'Văn hóa - Xã hội'}, {code:'NONG_NGHIEP', name:'Nông nghiệp'}
].map(f=>({...f, source:'default', status:'active'}));

function fcLoadAll(){
  try { const o = JSON.parse(localStorage.getItem(FIELD_CATALOG_KEY) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }
  catch (e) { return {}; }
}
function fcSaveAll(all){
  try { localStorage.setItem(FIELD_CATALOG_KEY, JSON.stringify(all || {})); } catch (e) { /* trình duyệt chặn lưu: vẫn dùng được trong phiên */ }
}
function fcCatalog(orgKey){
  const all = fcLoadAll();
  return orgKey && Array.isArray(all[orgKey]) ? all[orgKey] : FIELD_CATALOG_DEFAULT;
}
/* Tên các lĩnh vực đơn vị đang dùng (bỏ lĩnh vực đã ẩn), đúng thứ tự trong danh mục */
function fcActiveNames(orgKey){
  return fcCatalog(orgKey).filter(f=>f.status !== 'hidden').map(f=>f.name);
}
/* Mã đơn vị trong danh mục ứng với tài khoản IOC đang đăng nhập.
   - 4 trục cấp Thành phố, kể cả tài khoản sở, xã/phường, ban (cùng role trục): danh mục của trục (màn quản trị chỉ cấu hình tới trục).
   - Trung ương: đơn vị Trung ương cấp đầu (ouaTwUnits) chứa office đang đăng nhập — mã 'ORG-TW-DANG-BTC' ứng với office 'tw-dang-btc'
     và các office con 'tw-dang-btc-…'; tài khoản cả khối (chưa vào office) lấy đơn vị đầu của khối.
   - Không khớp (VD «Trung ương» xem cả 5 khối): null → danh mục mặc định. */
function fcOrgKeyForAccount(role, officeId){
  if(['DANG','HDND','UBND','MTTQ'].includes(role)) return 'AXIS:' + role;
  if(typeof role === 'string' && role.startsWith('TW_') && typeof ouaTwUnits !== 'undefined'){
    const units = ouaTwUnits.filter(u=>u.khoi === role);
    const key = (u)=>String(u.code).replace(/^ORG-/, '').toLowerCase();
    const oid = String(officeId || '');
    const hit = units.filter(u=>oid === key(u) || oid.startsWith(key(u) + '-')).sort((a, b)=>key(b).length - key(a).length)[0];
    const u = hit || units[0];
    if(u) return 'TW:' + u.code;
  }
  return null;
}
