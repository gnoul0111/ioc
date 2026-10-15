/* =====================================================================
   Quản trị IOC — UI mobile mới (bản demo)
   - Độc lập với oua-admin.html / js/oua-data.js: chỉ đọc chung dữ liệu thật
     window.OUA_ACCOUNT_DATA (js/core/account-data.js).
   - Mọi thay đổi chỉ lưu trong bộ nhớ phiên làm việc, chưa ghi về máy chủ.
   - Ngày tạo / lần đăng nhập / tài khoản khóa là số giả lập (nguồn thật không có),
     sinh cố định theo id để mỗi lần mở đều ra cùng một kết quả.
   ===================================================================== */
(function(){
'use strict';

/* ---------------- Tiện ích ---------------- */
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Number(n || 0).toLocaleString('vi-VN');
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const DAY = 864e5;
const NOW = Date.now();
/* Nguồn dùng chung với màn quản trị máy tính (js/core/login-log-data.js): ngày tạo, khóa, lần đăng nhập gần nhất và
   toàn bộ Nhật ký đăng nhập — để 2 bản ra cùng một con số. Không có tệp đó thì quay về cách sinh số cũ bên dưới. */
const LL = window.LOGIN_LOG || null;
function rnd(seed, salt){
  let t = (Number(seed) * 7919 + salt * 104729) >>> 0;
  t += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function relTime(ms){
  const d = Math.floor((NOW - ms) / DAY);
  if(d <= 0) return 'Hôm nay';
  if(d === 1) return 'Hôm qua';
  if(d < 30) return d + ' ngày trước';
  if(d < 365) return Math.floor(d / 30) + ' tháng trước';
  return Math.floor(d / 365) + ' năm trước';
}
function fmtDate(ms, withTime){
  const d = new Date(ms), p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()}` + (withTime ? ` ${p(d.getHours())}:${p(d.getMinutes())}` : '');
}

const ICONS = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M15.5 4.8a3.3 3.3 0 0 1 0 6.4"/><path d="M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
  building:'<rect x="4" y="3" width="11" height="18" rx="1.5"/><path d="M15 9h4.5a.5.5 0 0 1 .5.5V21"/><path d="M8 7h3M8 11h3M8 15h3"/><path d="M3 21h18"/>',
  settings:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  chevR:'<path d="m9 5 7 7-7 7"/>', chevL:'<path d="m15 5-7 7 7 7"/>',
  more:'<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  lock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  unlock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/>',
  shield:'<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  shieldOff:'<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>',
  filter:'<path d="M4 5h16l-6 7.5V19l-4 1.5v-8z"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>',
  folder:'<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>',
  tag:'<path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  tree:'<rect x="3" y="3" width="6" height="5" rx="1"/><rect x="15" y="10" width="6" height="5" rx="1"/><rect x="15" y="17" width="6" height="4" rx="1"/><path d="M6 8v11h9M6 12.5h9"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',
  userPlus:'<circle cx="10" cy="8" r="4"/><path d="M2.5 20.5c.8-4 3.8-6 7.5-6 2 0 3.7.6 5 1.6"/><path d="M19 13v6M16 16h6"/>',
  userOff:'<circle cx="10" cy="8" r="4"/><path d="M2.5 20.5c.8-4 3.8-6 7.5-6 2 0 3.7.6 5 1.6"/><path d="M17 14l5 5M22 14l-5 5"/>',
  move:'<path d="M4 12h12"/><path d="m12 7 5 5-5 5"/><path d="M20 4v16"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:'<path d="M4 4l16 16"/><path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.9 3.7M6.4 7.3C3.9 9 2.5 12 2.5 12S6 18.5 12 18.5c1.7 0 3.2-.5 4.5-1.2"/><path d="M10 10a3 3 0 0 0 4 4"/>',
  alert:'<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  upload:'<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14.3-4.6L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.6L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
  reset:'<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  role:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17c.8-2 2.2-3 4-3s3.2 1 4 3"/>',
  inbox:'<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>', down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  logout:'<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
  select:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  sync:'<path d="M4 4v6h6"/><path d="M20 20v-6h-6"/><path d="M20 10A8 8 0 0 0 5.6 6.6L4 8M4 14a8 8 0 0 0 14.4 3.4L20 16"/>',
  monitor:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M7 12l3-3 2 2 4-4"/>',
  external:'<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  login:'<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l4-4-4-4M14 12H4"/>',
  download:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  chevD:'<path d="m6 9 6 6 6-6"/>'
};

/* Nút sang màn IOC (dashboard điều hành). Bản chạy cùng dự án mở ../demo_ioc.html ngay trong tab; bản
   artifact gán sẵn window.IOC_URL = địa chỉ đã deploy (https://ioc-thanhuy.vercel.app) và mở tab mới. */
const IOC_URL = (typeof window.IOC_URL === 'string' && window.IOC_URL) || '../demo_ioc.html';
const IOC_EXTERNAL = /^https?:/i.test(IOC_URL);
const iocAttrs = () => `href="${esc(IOC_URL)}"${IOC_EXTERNAL ? ' target="_blank" rel="noopener"' : ''}`;
const ic = (n, cls='') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------------- Danh mục cố định ---------------- */
const AX = {
  DANG:{name:'Đảng ủy', c:'var(--ax-dang)'},
  HDND:{name:'HĐND',    c:'var(--ax-hdnd)'},
  UBND:{name:'UBND',    c:'var(--ax-ubnd)'},
  MTTQ:{name:'MTTQ',    c:'var(--ax-mttq)'}
};
const AX_ORDER = ['DANG','HDND','UBND','MTTQ'];
const GROUPS = ['Cấp thành phố','Sở/Ban/Ngành','Xã/Phường','Phòng/Đơn vị','Trung ương (BTCTW)'];
const WARD_RE = /(Phường|Xã)\s(?!hội)/;

const ROLE_DESC = {
  'Lãnh đạo trục':'Chỉ đạo, giao việc, phê duyệt trong trục',
  'Cấp phó trục':'Như lãnh đạo trục, trừ phê duyệt cuối',
  'Văn phòng/Điều phối':'Tổng hợp, điều phối, theo dõi tiến độ',
  'Trưởng đơn vị':'Giao việc và duyệt trong đơn vị mình',
  'Phó đơn vị':'Giao việc trong đơn vị, không duyệt cuối',
  'Chuyên viên/Cán bộ':'Xử lý việc được giao, cập nhật tiến độ',
  'Văn thư':'Vào sổ, phát hành, lưu trữ văn bản',
  'Trực IOC':'Trực ca, tiếp nhận và chuyển cảnh báo',
  'Quản trị hệ thống':'Cấu hình, đồng bộ, quản lý tài khoản',
  'Chỉ xem':'Tra cứu, không tạo hay sửa',
  'Không cấp quyền':'Không vào được phân hệ này'
};
const LEAD_ROLES = ['Lãnh đạo trục','Cấp phó trục','Trưởng đơn vị','Phó đơn vị','Quản trị hệ thống'];
const R_ALL = ['Lãnh đạo trục','Cấp phó trục','Văn phòng/Điều phối','Trưởng đơn vị','Phó đơn vị','Chuyên viên/Cán bộ','Văn thư','Trực IOC','Chỉ xem','Không cấp quyền'];
const MODULE_GROUPS = [
  {name:'Điều hành IOC', items:[
    {id:'dash',   name:'Bảng điều hành', desc:'Xem số liệu, đi sâu, xuất báo cáo', roles:['Lãnh đạo trục','Cấp phó trục','Văn phòng/Điều phối','Chuyên viên/Cán bộ','Trực IOC','Chỉ xem','Không cấp quyền']},
    {id:'task',   name:'Nhiệm vụ', desc:'Tạo, giao, cập nhật, duyệt nhiệm vụ', roles:R_ALL},
    {id:'doc',    name:'Văn bản', desc:'Văn bản đến, đi, giao xử lý, phát hành', roles:['Lãnh đạo trục','Văn phòng/Điều phối','Trưởng đơn vị','Chuyên viên/Cán bộ','Văn thư','Chỉ xem','Không cấp quyền']},
    {id:'notify', name:'Cảnh báo', desc:'Tiếp nhận, chuyển thành nhiệm vụ, báo vượt cấp', roles:['Lãnh đạo trục','Văn phòng/Điều phối','Trực IOC','Chuyên viên/Cán bộ','Chỉ xem','Không cấp quyền']}
  ]},
  {name:'Nghiệp vụ mở rộng', items:[
    {id:'scenario', name:'Kịch bản xử lý', desc:'Chọn, tạo, sửa, lưu trữ kịch bản', roles:['Lãnh đạo trục','Văn phòng/Điều phối','Trực IOC','Chuyên viên/Cán bộ','Chỉ xem','Không cấp quyền']},
    {id:'indicator',name:'Chỉ tiêu – Lĩnh vực', desc:'Xem, cập nhật, xác nhận số liệu chỉ tiêu', roles:['Lãnh đạo trục','Cấp phó trục','Trưởng đơn vị','Chuyên viên/Cán bộ','Chỉ xem','Không cấp quyền']},
    {id:'gis',      name:'Bản đồ hiện trường', desc:'Lớp bản đồ, điểm, vùng giám sát', roles:['Lãnh đạo trục','Chuyên viên/Cán bộ','Chỉ xem','Không cấp quyền']},
    {id:'calendar', name:'Lịch họp – công tác', desc:'Lịch, tài liệu họp, giao việc từ kết luận', roles:['Lãnh đạo trục','Văn phòng/Điều phối','Chuyên viên/Cán bộ','Chỉ xem','Không cấp quyền']}
  ]},
  {name:'Quản trị & tích hợp', items:[
    {id:'source',   name:'Nguồn dữ liệu – đồng bộ', desc:'Cấu hình nguồn, chạy đồng bộ, xem lỗi', roles:['Quản trị hệ thống','Văn phòng/Điều phối','Trực IOC','Chỉ xem','Không cấp quyền']},
    {id:'audit',    name:'Quản trị – nhật ký', desc:'Vai trò, quyền, nhật ký thao tác', roles:['Quản trị hệ thống','Văn phòng/Điều phối','Chỉ xem','Không cấp quyền']},
    {id:'orgadmin', name:'Quản lý đơn vị', desc:'Cây tổ chức, đơn vị trực thuộc', roles:['Quản trị hệ thống','Chỉ xem','Không cấp quyền']},
    {id:'useradmin',name:'Quản lý người dùng', desc:'Tài khoản, vai trò, phạm vi dữ liệu', roles:['Quản trị hệ thống','Chỉ xem','Không cấp quyền']}
  ]}
];
const MODULES = MODULE_GROUPS.flatMap(g => g.items);
const SCOPES = [
  {id:'city', label:'Toàn trục cấp Thành phố', sub:'Số liệu, nhiệm vụ, văn bản của cả trục trên toàn Thành phố'},
  {id:'ward', label:'Toàn bộ xã/phường của mình', sub:'Đủ 4 trục, nhưng chỉ trong xã/phường đang công tác'},
  {id:'org',  label:'Đơn vị mình và trực thuộc', sub:'Dữ liệu của đơn vị công tác và các đơn vị cấp dưới'},
  {id:'self', label:'Chỉ việc được giao hoặc tự tạo', sub:'Không thấy việc của người khác trong đơn vị'}
];
const FIELD_DEFAULT = ['Y tế','Giáo dục','Hành chính công','Tài chính','Giao thông','Xây dựng','Tài nguyên – Môi trường','Khoa học – Công nghệ','Lao động – Xã hội','Nội chính','Văn hóa – Xã hội','Nông nghiệp'];

/* ---------------- Dựng dữ liệu từ nguồn thật ---------------- */
const D = { orgs:new Map(), users:[], userById:new Map(), rootId:null, axisRoot:{} };
function inferAxis(n){
  if(/Thành ủy|Đảng ủy|Đảng bộ/i.test(n)) return 'DANG';
  if(/HĐND/i.test(n)) return 'HDND';
  if(/MTTQ|Mặt trận/i.test(n)) return 'MTTQ';
  if(/UBND|Sở |Ban Quản lý|Thanh tra/i.test(n)) return 'UBND';
  return null;
}
/* Tên gọi = từ cuối có chữ cái, sau khi bỏ hậu tố " - …" và ghi chú trong ngoặc như "(1990)", "(PTB)".
   Dùng chung cho sắp xếp A–Z và chữ cái trên avatar. */
function givenName(name){
  const words = String(name || '').split(' - ')[0].replace(/\(.*?\)/g, ' ').split(/[\s\-–]+/).filter(w => /^\p{L}/u.test(w));
  return words[words.length - 1] || String(name || '?');
}
const isLeader = u =>/Lãnh đạo|Chủ tịch|Giám đốc|Trưởng|Bí thư|Chánh/i.test(u.position || '');
function addUser(raw, org){
  const id = raw.egov_user_id;
  const r1 = rnd(id, 1);
  const isNew = r1 < 0.04;
  const u = {
    id, name:(raw.name || '').trim() || '—',
    username:(raw.label || '').split(' - ')[0] || '',
    email:raw.email || '', position:raw.position || '', job:raw.job_title || raw.position || '',
    orgId:org.id, axis:org.axis,
    createdAt: NOW - (isNew ? Math.floor(r1 / 0.04 * 30) : 30 + Math.floor(rnd(id,2) * 700)) * DAY - Math.floor(rnd(id,6) * DAY),
    lastLoginAt: rnd(id,3) < 0.18 ? null : NOW - Math.floor(rnd(id,4) * 60) * DAY - Math.floor(rnd(id,7) * DAY),
    locked: rnd(id,5) < 0.012
  };
  const m = LL && LL.meta(id);
  if(m){ u.createdAt = m.createdAt; u.lastLoginAt = LL.lastLogin(id); u.locked = m.locked; }
  u.admin = isLeader(u);
  u._k = norm(u.name + ' ' + u.username + ' ' + u.email);
  u._given = givenName(u.name);
  D.users.push(u); D.userById.set(String(id), u); org.userIds.push(u.id);
  return u;
}
function build(){
  const src = window.OUA_ACCOUNT_DATA;
  if(!src) return;
  (function walk(n, parent){
    const axis = inferAxis(n.name) || (parent && parent.axis) || null;
    const o = {id:n.id, name:n.level === 1 ? 'Thành phố Hà Nội' : (n.name || '').trim(), level:n.level, parentId:parent ? parent.id : null, axis, children:[], userIds:[], total:0};
    o._k = norm(o.name);
    D.orgs.set(o.id, o);
    if(parent) parent.children.push(o.id); else D.rootId = o.id;
    if(o.level === 2 && axis) D.axisRoot[axis] = o.id;
    (n.users || []).forEach(raw => addUser(raw, o));
    (n.children || []).forEach(c => walk(c, o));
    o.total = o.userIds.length + o.children.reduce((s, cid) => s + D.orgs.get(cid).total, 0);
  })(src, null);
}
build();

const org = id => D.orgs.get(Number(id)) || D.orgs.get(id);
const userOf = id => D.userById.get(String(id));
function ancestors(o){ const a = []; let p = o && org(o.parentId); while(p){ a.unshift(p); p = org(p.parentId); } return a; }
function wardOf(o){ let p = o; while(p){ const m = p.name.match(/(Phường|Xã)\s(?!hội).+/); if(m && p.level > 2) return m[0]; p = org(p.parentId); } return null; }
const isSo = o => /^Sở\s/.test(o.name);
function autoGroup(o){
  if(WARD_RE.test(o.name) && !/,/.test(o.name)) return 'Xã/Phường';
  if(isSo(o) || /^(Ban Quản lý|Thanh tra Thành phố)/.test(o.name)) return 'Sở/Ban/Ngành';
  if(o.level <= 3) return 'Cấp thành phố';
  return 'Phòng/Đơn vị';
}
const groupOf = o => S.groupOverride[o.id] || autoGroup(o);
const levelLabel = o => o.level === 1 ? 'Thành phố' : `Cấp ${o.level - 1}`;
const descCache = new Map();
function descendantIds(id){
  if(descCache.has(id)) return descCache.get(id);
  const out = []; (function w(i){ out.push(i); org(i).children.forEach(w); })(id);
  descCache.set(id, out); return out;
}
function usersUnder(id){ const res = []; descendantIds(id).forEach(i => org(i).userIds.forEach(uid => res.push(userOf(uid)))); return res.filter(Boolean); }

/* ---------------- Trạng thái phiên ---------------- */
const S = {
  tab:'home',
  stacks:{ home:[{v:'home', p:{}}], users:[{v:'users', p:{}}], orgs:[{v:'orgs', p:{}}], settings:[{v:'settings', p:{}}] },
  select:null,
  perms:{}, drafts:{}, scopes:{},
  groupOverride:{}, mapping:{}, orgScope:{}, orgEdits:{},
  fieldDefault: FIELD_DEFAULT.map(n => ({name:n, custom:false, hidden:false})),
  fieldCatalogs:{},
  indicators:null, tree:null, log:[],
  theme:'dark', lastSync: NOW - 5.5 * 3600e3
};
/* Mặc định là bản tối xanh IOC (giống màn quản trị hiện tại); bản sáng chỉ khi người dùng chọn. */
try{ S.theme = localStorage.getItem('iocm-theme') === 'light' ? 'light' : 'dark'; }catch(e){}
function applyTheme(){
  document.documentElement.setAttribute('data-theme', S.theme);
  try{ localStorage.setItem('iocm-theme', S.theme); }catch(e){}
}
applyTheme();

function log(text, icon, ref){ S.log.unshift({t:Date.now(), text, icon:icon || 'clock', ...(ref || {})}); }
(function seedLog(){
  const leaders = D.users.filter(u => u.admin);
  const a = leaders[17], b = D.users[421], so = [...D.orgs.values()].find(isSo);
  S.log.push({t:S.lastSync, text:`Đồng bộ cơ cấu tổ chức: ${fmt(D.orgs.size)} đơn vị, ${fmt(D.users.length)} tài khoản`, icon:'sync'});
  if(a) S.log.push({t:NOW - 26 * 3600e3, text:`Cấp quyền quản trị cho ${a.name}`, icon:'shield', uid:a.id});
  if(b) S.log.push({t:NOW - 2.2 * DAY, text:`Khóa tài khoản ${b.name}`, icon:'lock', uid:b.id});
  if(so) S.log.push({t:NOW - 3.4 * DAY, text:`Bật bảng chỉ tiêu cho ${so.name}`, icon:'chart', oid:so.id});
})();

/* ---------------- Quyền theo phân hệ ---------------- */
function defaultRole(u, m){
  const pos = (u.position || '') + ' ' + (u.job || '');
  let r;
  if(['source','audit','orgadmin','useradmin'].includes(m.id)) r = m.id === 'source' && u.admin ? 'Chỉ xem' : 'Không cấp quyền';
  else if(m.id === 'gis') r = u.admin ? 'Lãnh đạo trục' : 'Chỉ xem';
  else if(u.admin) r = /Trưởng phòng|Phó/.test(pos) ? (m.roles.includes('Trưởng đơn vị') ? 'Trưởng đơn vị' : 'Cấp phó trục') : 'Lãnh đạo trục';
  else if(/Văn thư/.test(pos)) r = m.id === 'doc' ? 'Văn thư' : 'Chỉ xem';
  else if(/Chuyên viên|Cán bộ|Nhân viên/.test(pos)) r = 'Chuyên viên/Cán bộ';
  else r = 'Chỉ xem';
  return m.roles.includes(r) ? r : 'Chỉ xem';
}
function savedRole(u, m){ return (S.perms[u.id] || {})[m.id] || defaultRole(u, m); }
function roleOf(u, m){ const d = S.drafts[u.id]; return (d && d[m.id]) || savedRole(u, m); }
function defaultScope(u){
  const o = org(u.orgId);
  if(u.admin && o && o.level <= 3) return 'city';
  if(o && wardOf(o)) return 'ward';
  if(/Chuyên viên|Nhân viên/.test(u.position)) return 'self';
  return 'org';
}
const savedScope = u => S.scopes[u.id] || defaultScope(u);
const scopeOf = u => (S.drafts[u.id] && S.drafts[u.id].__scope) || savedScope(u);
function scopeText(u, id){
  const o = org(u.orgId);
  if(id === 'city') return `Toàn trục ${u.axis ? AX[u.axis].name : ''} cấp Thành phố`;
  if(id === 'ward') return `Toàn bộ ${wardOf(o) || 'xã/phường của mình'}`;
  if(id === 'org') return `${o ? o.name : 'Đơn vị'} và trực thuộc`;
  return 'Chỉ việc được giao hoặc tự tạo';
}
function draftChanges(u){
  const d = S.drafts[u.id]; if(!d) return [];
  const ch = [];
  MODULES.forEach(m => { if(d[m.id] && d[m.id] !== savedRole(u, m)) ch.push({label:m.name, from:savedRole(u, m), to:d[m.id]}); });
  if(d.__scope && d.__scope !== savedScope(u)) ch.push({label:'Phạm vi dữ liệu', from:scopeText(u, savedScope(u)), to:scopeText(u, d.__scope)});
  return ch;
}
function setDraft(u, key, val){
  S.drafts[u.id] = S.drafts[u.id] || {};
  S.drafts[u.id][key] = val;
  const ch = draftChanges(u);
  if(!ch.length) delete S.drafts[u.id];
}
function roleTag(r){
  const cls = LEAD_ROLES.includes(r) ? 'accent' : (r === 'Chỉ xem' || r === 'Không cấp quyền' ? '' : 'good');
  return `<span class="tag ${cls}">${esc(r === 'Không cấp quyền' ? 'Không cấp' : r)}</span>`;
}

/* ---------------- Lĩnh vực, chỉ tiêu, cây thư mục ---------------- */
const fieldCatalog = orgId => orgId ? (S.fieldCatalogs[orgId] || S.fieldDefault) : S.fieldDefault;
function ensureCatalog(orgId){
  if(!orgId) return S.fieldDefault;
  if(!S.fieldCatalogs[orgId]) S.fieldCatalogs[orgId] = S.fieldDefault.map(f => ({...f}));
  return S.fieldCatalogs[orgId];
}
function indicators(){
  if(S.indicators) return S.indicators;
  const seen = new Set(); S.indicators = [];
  D.orgs.forEach(o => { if(isSo(o) && !seen.has(o.name)){ seen.add(o.name); S.indicators.push({orgId:o.id, name:o.name, active:true}); } });
  return S.indicators;
}
const indicatorOf = o => indicators().find(r => r.orgId === o.id || r.name === o.name);

let treeSeq = 1;
function tnode(label, orgId, virtual){ const n = {id:'n' + (treeSeq++), label, orgId:orgId || null, virtual:!!virtual, children:[]}; S.tree.map[n.id] = n; return n; }
function buildTree(){
  S.tree = {map:{}, root:[]};
  const city = tnode('Thành phố Hà Nội', null, true);
  AX_ORDER.forEach(ax => {
    const o = org(D.axisRoot[ax]); if(!o) return;
    const n = tnode(o.name, o.id); city.children.push(n.id);
    o.children.forEach(cid => { const c = org(cid); const k = tnode(c.name, c.id); n.children.push(k.id); });
  });
  const tw = tnode('Khối Trung ương (mô phỏng)', null, true);
  ['Văn phòng Chủ tịch nước','Ban Tổ chức Trung ương','Ủy ban Thường vụ Quốc hội','Các bộ, cơ quan ngang bộ'].forEach(l => tw.children.push(tnode(l, null, false).id));
  S.tree.root = [city.id, tw.id];
}
buildTree();
const tchildren = id => id ? S.tree.map[id].children : S.tree.root;
function tparent(id){ if(S.tree.root.includes(id)) return null; return Object.values(S.tree.map).find(n => n.children.includes(id)) || null; }
function tpath(id){ const p = []; let n = id ? S.tree.map[id] : null; while(n){ p.unshift(n); n = tparent(n.id); } return p; }
function tIsDesc(anc, id){ if(anc === id) return true; return S.tree.map[anc].children.some(c => tIsDesc(c, id)); }
function tDetach(id){ const p = tparent(id); const arr = p ? p.children : S.tree.root; arr.splice(arr.indexOf(id), 1); return p; }

/* ---------------- Khung ứng dụng ---------------- */
const app = $('#app');
app.innerHTML = `<div class="views" id="views"></div>
  <nav class="tabbar" id="tabbar"></nav>
  <div id="floatHost"></div>
  <div class="sheet-backdrop" id="sbd"></div>
  <div id="sheets"></div>
  <div class="toast" id="toast" role="status"><span class="tx"></span><button type="button" hidden>Hoàn tác</button></div>`;
$('#sbd').addEventListener('click', () => closeSheet());

const TABS = [
  {id:'home', label:'Tổng quan', icon:'home'},
  {id:'users', label:'Người dùng', icon:'users'},
  {id:'orgs', label:'Đơn vị', icon:'building'},
  {id:'settings', label:'Cấu hình', icon:'settings'}
];
function renderTabbar(){
  $('#tabbar').innerHTML = TABS.map(t => `<button type="button" class="${S.tab === t.id ? 'on' : ''}" data-a="tab" data-t="${t.id}">${ic(t.icon)}<span>${t.label}</span></button>`).join('');
}
const curStack = () => S.stacks[S.tab];
const curRoute = () => curStack()[curStack().length - 1];

/* ---------- Chế độ mobile web ----------
   Trên điện thoại thật (màn hẹp hoặc màn cảm ứng) bỏ khung điện thoại và cuộn bằng chính trang, để trình
   duyệt tự thu thanh địa chỉ. Trên máy tính có chuột vẫn hiện khung điện thoại + ghi chú để duyệt demo. */
const WEB_MQ = matchMedia('(max-width:520px), (pointer:coarse)');
let WEB = WEB_MQ.matches;
document.documentElement.classList.toggle('web', WEB);
const scroller = () => WEB ? (document.scrollingElement || document.documentElement) : $('#views .view.cur');
const getScroll = () => { const s = scroller(); return s ? s.scrollTop : 0; };
const setScroll = y => { const s = scroller(); if(s) s.scrollTop = y; };
function onScroll(){
  const v = $('#views .view.cur'); if(!v) return;
  v.classList.toggle('scrolled', getScroll() > 28);
  loadMore(v);
}
window.addEventListener('scroll', () => { if(WEB) onScroll(); }, {passive:true});

function render(anim){
  const views = $('#views');
  const old = views.querySelector('.view.cur');
  if(old && old._route) old._route.scroll = getScroll();
  const route = curRoute();
  const el = document.createElement('div');
  el.className = 'view cur';
  el._route = route;
  el.innerHTML = VIEWS[route.v](route);
  views.appendChild(el);
  if(WEB){
    /* Trang cuộn chung nên không chồng 2 màn lên nhau: bỏ màn cũ ngay, màn mới trượt/hiện vào */
    if(old) old.remove();
    if(anim === 'push') el.classList.add('anim-in');
    else if(anim === 'pop' || anim === 'fade') el.classList.add('anim-fade');
  } else if(anim === 'push'){
    el.classList.add('anim-in');
    if(old){ old.classList.remove('cur'); setTimeout(() => old.remove(), 300); }
  } else if(anim === 'pop'){
    if(old){ old.classList.remove('cur'); old.classList.add('anim-out'); setTimeout(() => old.remove(), 260); }
  } else {
    if(old) old.remove();
    if(anim === 'fade') el.classList.add('anim-fade');
  }
  if(AFTER[route.v]) AFTER[route.v](el, route);
  setScroll(anim === 'push' ? 0 : (route.scroll || 0));
  if(!WEB) el.addEventListener('scroll', onScroll, {passive:true});
  el.classList.toggle('scrolled', getScroll() > 28);
  renderTabbar(); renderFloat();
  syncHistory(); saveNav();
}
const refresh = () => render();
function push(v, p){ curStack().push({v, p:p || {}}); render('push'); }
function pop(){ if(curStack().length > 1){ curStack().pop(); render('pop'); } }
function switchTab(t){
  exitSelect(true);
  if(S.tab === t){
    if(curStack().length > 1){ S.stacks[t].length = 1; render('fade'); }
    else { const s = scroller(); if(s) s.scrollTo({top:0, behavior:'smooth'}); }
    return;
  }
  const v = $('#views .view.cur'); if(v && v._route) v._route.scroll = getScroll();
  S.tab = t; render('fade');
}
function goTab(t, route){
  exitSelect(true);
  const v = $('#views .view.cur'); if(v && v._route) v._route.scroll = getScroll();
  S.tab = t;
  if(route) S.stacks[t] = [S.stacks[t][0], route];
  render('fade');
}
function loadMore(el){
  const r = el._route, s = scroller();
  if(r && r._more && s && s.scrollTop + s.clientHeight > s.scrollHeight - 400) r._more(el);
}

/* ---------- Nút Quay lại của trình duyệt ----------
   Mỗi lớp có thể "quay lại" (màn con, chế độ chọn nhiều, bảng trượt, đang ở tab khác Tổng quan) giữ đúng
   1 mục trong lịch sử trình duyệt. Thao tác trong app chỉ đổi trạng thái rồi gọi syncHistory() để cân lại
   số mục; nút back/vuốt quay lại của trình duyệt đi qua popstate → backOnce(). */
let hDepth = 0, ignorePops = 0, inPop = false;
try{ if(history.state && history.state.iocm) hDepth = history.state.d || 0; }catch(e){}
function wantDepth(){
  return (S.tab !== 'home' ? 1 : 0) + curStack().length - 1 + (S.select ? 1 : 0) + (sheets.length ? 1 : 0);
}
/* history.go() chạy bất đồng bộ: trong lúc chờ nó xong thì không pushState (sẽ lệch số mục), mà để
   popstate của chính lần lùi đó gọi lại syncHistory(). Có hẹn giờ gỡ kẹt nếu trình duyệt không phản hồi. */
let goGuard;
function syncHistory(){
  if(inPop || ignorePops > 0) return;
  const want = wantDepth();
  try{
    while(hDepth < want){ hDepth++; history.pushState({iocm:1, d:hDepth}, ''); }
    if(hDepth > want){
      ignorePops++; const k = want - hDepth; hDepth = want; history.go(k);
      clearTimeout(goGuard);
      goGuard = setTimeout(() => {
        if(ignorePops > 0){ ignorePops = 0; hDepth = (history.state && history.state.iocm && history.state.d) || 0; syncHistory(); }
      }, 700);
    }
  }catch(e){}
}
function backOnce(){
  if(sheets.length){ closeSheet(); return; }
  if(S.select){ exitSelect(); return; }
  if(curStack().length > 1){ curStack().pop(); render('pop'); return; }
  if(S.tab !== 'home') switchTab('home');
}
window.addEventListener('popstate', e => {
  const d = e.state && e.state.iocm ? (e.state.d || 0) : 0;
  if(ignorePops > 0){ ignorePops--; hDepth = d; if(!ignorePops){ clearTimeout(goGuard); syncHistory(); } return; }
  if(d >= hDepth){ hDepth = d; syncHistory(); return; }
  const n = hDepth - d; hDepth = d;
  inPop = true;
  try{ for(let i = 0; i < n; i++) backOnce(); } finally { inPop = false; }
  syncHistory();
});

/* ---------- Giữ chỗ đang xem khi tải lại trang ---------- */
function saveNav(){
  try{
    const stacks = {};
    Object.entries(S.stacks).forEach(([k, st]) => { stacks[k] = st.map(r => ({v:r.v, p:r.p, state:r.state, tab:r.tab, scroll:r.scroll, loaded:r.loaded})); });
    sessionStorage.setItem('iocm-nav', JSON.stringify({tab:S.tab, stacks}));
  }catch(e){}
}
function routeOk(r){
  if(!r || !VIEWS[r.v]) return false;
  if(r.v === 'user') return !!userOf(r.p.id);
  if(r.v === 'org' || r.v === 'orgChildren') return !!org(r.p.id);
  if(r.v === 'tree') return !r.p.node || !!S.tree.map[r.p.node];
  return true;
}
function loadNav(){
  try{
    const o = JSON.parse(sessionStorage.getItem('iocm-nav') || 'null');
    if(!o || !o.stacks) return;
    Object.keys(S.stacks).forEach(k => {
      const st = o.stacks[k]; if(!Array.isArray(st) || !st.length) return;
      const ok = []; for(const r of st){ if(!routeOk(r)) break; ok.push(r); }
      if(ok.length && ok[0].v === S.stacks[k][0].v) S.stacks[k] = ok;
    });
    if(S.stacks[o.tab]) S.tab = o.tab;
  }catch(e){}
}
let scrollSaveT;
window.addEventListener('scroll', () => { clearTimeout(scrollSaveT); scrollSaveT = setTimeout(() => { const r = curRoute(); r.scroll = getScroll(); saveNav(); }, 300); }, {passive:true});
window.addEventListener('pagehide', () => { const r = curRoute(); r.scroll = getScroll(); saveNav(); });

/* ---------------- Mảnh giao diện dùng chung ---------------- */
function titleOf(r){
  switch(r.v){
    case 'home': return 'Tổng quan';
    case 'users': return r.p.orgId ? 'Thành viên' : 'Người dùng';
    case 'user': { const u = userOf(r.p.id); return u ? u.name : 'Người dùng'; }
    case 'orgs': return 'Đơn vị';
    case 'org': case 'orgChildren': { const o = org(r.p.id); return o ? o.name : 'Đơn vị'; }
    case 'settings': return 'Cấu hình';
    case 'grouping': return 'Phân nhóm';
    case 'fields': return 'Lĩnh vực';
    case 'indicators': return 'Bảng chỉ tiêu';
    case 'tree': return r.p.node ? S.tree.map[r.p.node].label : 'Cây thư mục';
    case 'roles': return 'Vai trò mẫu';
    case 'activity': return 'Nhật ký';
    case 'loginLog': return 'Nhật ký đăng nhập';
    case 'search': return 'Tìm kiếm';
  }
  return '';
}
function topbar(o){
  o = o || {};
  const st = curStack();
  let back = '';
  if(st.length > 1){
    let lbl = titleOf(st[st.length - 2]);
    if(lbl.length > 12) lbl = 'Quay lại';
    back = `<button type="button" class="tb-btn back" data-a="back">${ic('chevL')}<span>${esc(lbl)}</span></button>`;
  }
  return `<div class="topbar"><div class="tb-side">${back}${o.left || ''}</div><div class="t ${o.always ? 'always' : ''}">${esc(o.title || '')}</div><div class="tb-side r">${o.right || ''}</div></div>`;
}
const AV_COLORS = ['#1d7ff2','#0f9e74','#7a6cf0','#c98a00','#1b9fd4','#d9506d','#3f63d8','#2a9a8c'];
function avatar(u, lg){
  const ch = (u._given || givenName(u.name))[0].toUpperCase();
  const st = u.locked ? 'locked' : (u.lastLoginAt ? 'ok' : 'never');
  const col = AV_COLORS[Math.abs(Number(String(u.id).replace(/\D/g, '')) || 0) % AV_COLORS.length];
  return `<span class="av ${lg ? 'lg' : ''}" style="background:${col}">${esc(ch)}<span class="st ${st}"></span></span>`;
}
const axisLabel = ax => ax ? `<span class="axis" style="--c:${AX[ax].c}"><i></i>${AX[ax].name}</span>` : '';
const axisIcon = (ax, name) => `<span class="lead-ic" style="${ax ? `background:color-mix(in srgb, ${AX[ax].c} 15%, transparent);color:${AX[ax].c}` : ''}">${ic(name || 'building')}</span>`;
function row(o){
  const tag = o.tag || 'button';
  const attrs = o.a ? ` data-a="${o.a}"` + Object.entries(o.d || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('') : '';
  const kvCls = o.inline && /class="val"/.test(o.trail || '') ? 'kv' : '';
  return `<${tag} ${tag === 'button' ? 'type="button"' : ''} class="row ${o.lead ? 'has-lead' : ''} ${o.sm ? 'sm' : ''} ${kvCls} ${o.cls || ''}"${attrs}>
    ${o.pre || ''}${o.lead || ''}
    <span class="body"><span class="title"><span class="tx">${o.title}</span>${o.badge || ''}</span>${o.sub ? `<span class="sub ${o.wrap ? 'wrap' : ''}">${o.sub}</span>` : ''}</span>
    ${o.trail != null ? `<span class="trail ${o.inline ? 'inline' : ''}">${o.trail}</span>` : ''}
    ${o.chev ? ic('chevR', 'chev') : ''}
  </${tag}>`;
}
const kv = (label, value, a, d) => row({title:esc(label), trail:`<span class="val">${value}</span>`, inline:true, a, d, chev:!!a, tag:a ? 'button' : 'div', cls:'kv'});
function section(title, inner, link){
  return `<div class="section">${title ? `<div class="section-h"><h3>${esc(title)}</h3>${link || ''}</div>` : ''}${inner}</div>`;
}
const group = rows => `<div class="group">${rows}</div>`;

function userRow(u, opts){
  opts = opts || {};
  const o = org(u.orgId);
  const sel = S.select && opts.selectable;
  const status = u.locked ? '<span style="color:var(--bad)">Đã khóa</span>' : (u.lastLoginAt ? relTime(u.lastLoginAt) : '<span style="color:var(--warn)">Chưa đăng nhập</span>');
  return row({
    a: sel ? 'toggleSel' : 'openUser', d:{id:u.id},
    pre: sel ? `<span class="check ${S.select.has(String(u.id)) ? 'on' : ''}">${ic('check')}</span>` : '',
    lead: avatar(u),
    title: esc(u.name),
    badge: (u.admin ? `<span title="Quản trị viên">${ic('shield', 'mini-ic accent')}</span>` : ''),
    sub: esc((u.job || 'Chưa có chức vụ') + (o ? ' · ' + o.name : '')),
    trail: axisLabel(u.axis) + `<span>${status}</span>`,
    cls: opts.selectable ? 'lp' : ''
  }).replace('<button ', `<button data-lp="${esc(u.id)}" `);
}
function orgRow(o, opts){
  opts = opts || {};
  const sub = [opts.showGroup === false ? null : groupOf(o), `${fmt(o.total)} người`, o.children.length ? `${fmt(o.children.length)} đơn vị con` : null].filter(Boolean).join(' · ');
  const warn = o.total === 0 ? `<span class="tag warn">${ic('alert')}Chưa có người</span>` : '';
  return row({a:opts.a || 'openOrg', d:{id:o.id}, lead:axisIcon(o.axis, isSo(o) ? 'building' : (WARD_RE.test(o.name) ? 'pin' : 'building')), title:esc(o.name), sub, trail:opts.trail != null ? opts.trail : warn, chev:true});
}
function emptyBox(text, icon){ return `<div class="empty">${ic(icon || 'search')}<div>${esc(text)}</div></div>`; }

/* =====================================================================
   CÁC MÀN HÌNH
   ===================================================================== */
const VIEWS = {}, AFTER = {};

/* ---------- Tổng quan ---------- */
function stats(){
  let locked = 0, never = 0, fresh = 0, admins = 0, active30 = 0;
  D.users.forEach(u => {
    if(u.locked) locked++;
    if(!u.lastLoginAt) never++; else if(NOW - u.lastLoginAt <= 30 * DAY) active30++;
    if(NOW - u.createdAt <= 30 * DAY) fresh++;
    if(u.admin) admins++;
  });
  let emptyOrgs = 0; D.orgs.forEach(o => { if(o.total === 0) emptyOrgs++; });
  return {locked, never, fresh, admins, active30, emptyOrgs};
}
VIEWS.home = () => {
  const s = stats();
  const today = new Date().toLocaleDateString('vi-VN', {weekday:'long', day:'numeric', month:'long'});
  const axisRows = AX_ORDER.map(ax => {
    const o = org(D.axisRoot[ax]); if(!o) return '';
    const us = usersUnder(o.id);
    return row({a:'openOrgTab', d:{id:o.id}, lead:axisIcon(ax), title:esc(o.name), sub:`${fmt(us.length)} tài khoản · ${fmt(us.filter(u => u.admin).length)} quản trị viên`, chev:true});
  }).join('');
  const todo = [
    {n:s.locked, cls:'bad', icon:'lock', t:'Đang bị khóa', sub:'Xem lại, mở khóa nếu cần', a:'goUsers', chip:'locked'},
    {n:s.never, cls:'warn', icon:'userOff', t:'Chưa đăng nhập', sub:'Nhắc kích hoạt hoặc khóa', a:'goUsers', chip:'never'},
    {n:s.fresh, cls:'accent', icon:'userPlus', t:'Mới tạo 30 ngày', sub:'Kiểm tra quyền đã cấp', a:'goUsers', chip:'new'},
    {n:s.emptyOrgs, cls:'warn', icon:'building', t:'Đơn vị chưa có người', sub:'Rà soát gán nhân sự', a:'goOrgs', chip:'empty'},
    ...(LL && LL.canView() ? (() => { const ts = LL.todayStats(); return [{n:ts.fail, cls:'bad', icon:'login', t:'Đăng nhập thất bại hôm nay', sub:`${fmt(ts.failUsers)} tài khoản · xem có bất thường không`, a:'goLoginFails', chip:''}]; })() : [])
  ].map(x => row({a:x.a, d:{chip:x.chip}, lead:`<span class="lead-ic ${x.cls === 'accent' ? '' : x.cls}">${ic(x.icon)}</span>`, title:x.t, sub:x.sub, trail:`<span class="count ${x.cls}">${fmt(x.n)}</span>`, inline:true, chev:true})).join('');
  const recent = S.log.slice(0, 4).map(tlItem).join('');
  return topbar({title:'Tổng quan', right:`<button type="button" class="tb-btn" data-a="account" aria-label="Tài khoản">${accountAv(30)}</button>`}) + `
    <div class="large-title lt-row"><div><div class="eyebrow">${esc(today.charAt(0).toUpperCase() + today.slice(1))}</div><h1>Tổng quan</h1></div><a class="ioc-btn" ${iocAttrs()}>${ic('monitor')}<span>Vào IOC</span></a></div>
    <button type="button" class="searchbar" data-a="openSearch">${ic('search')}<span>Tìm người dùng, đơn vị, cấu hình</span></button>
    <div class="tiles">
      <button type="button" class="tile" data-a="goUsers" data-chip="all"><span class="l">${ic('users')}Tài khoản</span><span class="v">${fmt(D.users.length)}</span><span class="h">${fmt(s.active30)} hoạt động 30 ngày</span></button>
      <button type="button" class="tile" data-a="tab" data-t="orgs"><span class="l">${ic('building')}Đơn vị</span><span class="v">${fmt(D.orgs.size)}</span><span class="h">6 cấp tổ chức</span></button>
      <button type="button" class="tile" data-a="goUsers" data-chip="admin"><span class="l">${ic('shield')}Quản trị viên</span><span class="v">${fmt(s.admins)}</span><span class="h">Có quyền quản trị</span></button>
      <button type="button" class="tile" data-a="sync"><span class="l">${ic('sync')}Đồng bộ</span><span class="v">${fmtDate(S.lastSync, true).slice(11)}</span><span class="h">${fmtDate(S.lastSync)} · lần gần nhất</span></button>
    </div>
    ${section('Cần xử lý', group(todo))}
    ${section('Theo trục', group(axisRows), `<button type="button" class="link" data-a="tab" data-t="orgs">Xem cây</button>`)}
    <div class="section-h" style="margin:0 16px"><h3>Thao tác nhanh</h3></div>
    <div class="quick" style="margin-top:8px">
      <button type="button" data-a="createUser"><span class="qi">${ic('userPlus')}</span>Tạo tài khoản</button>
      <button type="button" data-a="createOrg"><span class="qi">${ic('building')}</span>Tạo đơn vị</button>
      <button type="button" data-a="importExcel"><span class="qi">${ic('upload')}</span>Nhập từ Excel</button>
      <button type="button" data-a="sync"><span class="qi">${ic('sync')}</span>Đồng bộ</button>
    </div>
    ${section('Hoạt động gần đây', `<div class="tl">${recent}</div>`, `<button type="button" class="link" data-a="push" data-v="activity">Xem tất cả</button>`)}`;
};
/* Dòng "Mở màn hình IOC" dùng trong Cấu hình và bảng Tài khoản — là thẻ <a> thật để trình duyệt điều hướng */
function iocRow(){
  return `<a class="row has-lead sm accent" ${iocAttrs()}><span class="lead-ic sm">${ic('monitor')}</span><span class="body"><span class="title"><span class="tx">Mở màn hình IOC</span></span><span class="sub">Bảng điều hành các trục, sở, xã/phường</span></span>${ic(IOC_EXTERNAL ? 'external' : 'chevR', 'chev')}</a>`;
}
function accountAv(size){ return `<span class="av" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .42)}px;background:var(--logo-grad);border-radius:${Math.round(size * .28)}px">I</span>`; }
function tlItem(e){
  return `<div class="tl-item"><span class="lead-ic sm mute">${ic(e.icon)}</span><div class="tx">${esc(e.text)}<small>${relTime(e.t) === 'Hôm nay' ? 'Hôm nay ' + fmtDate(e.t, true).slice(11) : relTime(e.t)}</small></div></div>`;
}

/* ---------- Người dùng (danh sách) ---------- */
const USER_CHIPS = [
  {id:'all', label:'Tất cả', f:() => true},
  {id:'admin', label:'Quản trị viên', f:u => u.admin},
  {id:'new', label:'Mới 30 ngày', f:u => NOW - u.createdAt <= 30 * DAY},
  {id:'never', label:'Chưa đăng nhập', f:u => !u.lastLoginAt},
  {id:'locked', label:'Đã khóa', f:u => u.locked}
];
/* Tên người Việt sắp theo tên gọi (từ cuối), rồi tới họ đệm. D.users đã sắp sẵn theo thứ tự này một lần. */
const coll = new Intl.Collator('vi');
const byGiven = (a, b) => coll.compare(a._given, b._given) || coll.compare(a.name, b.name);
D.users.sort(byGiven);
const SORTS = [
  {id:'name', label:'Tên A–Z', f:byGiven},
  {id:'login', label:'Đăng nhập gần nhất', f:(a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0)},
  {id:'created', label:'Mới tạo gần nhất', f:(a, b) => b.createdAt - a.createdAt}
];
function userState(r){
  if(!r.state) r.state = {chip:r.p.chip || 'all', axes:[], sort:'name', q:r.p.q || ''};
  return r.state;
}
function userBase(r){ return r.p.orgId ? usersUnder(Number(r.p.orgId)) : D.users; }
function userFiltered(r){
  const f = userState(r), q = norm(f.q).trim();
  const pre = userBase(r).filter(u => (!q || u._k.includes(q)) && (!f.axes.length || f.axes.includes(u.axis)));
  const chip = USER_CHIPS.find(c => c.id === f.chip) || USER_CHIPS[0];
  const list = pre.filter(chip.f);
  if(f.sort !== 'name' || r.p.orgId) list.sort(SORTS.find(s => s.id === f.sort).f);
  r._list = list;
  return {pre, list};
}
function userChipsHtml(r, pre){
  const f = userState(r);
  return USER_CHIPS.map(c => `<button type="button" class="chip ${f.chip === c.id ? 'on' : ''}" data-a="userChip" data-c="${c.id}">${c.label}<span class="n">${fmt(pre.filter(c.f).length)}</span></button>`).join('');
}
VIEWS.users = r => {
  const f = userState(r);
  const {pre, list} = userFiltered(r);
  r.loaded = Math.max(r.loaded || 0, 40);
  const scoped = r.p.orgId ? org(r.p.orgId) : null;
  const filterOn = f.axes.length || f.sort !== 'name';
  const right = (S.select ? `<button type="button" class="tb-btn" data-a="exitSelect">Xong</button>` : `<button type="button" class="tb-btn" data-a="enterSelect">Chọn</button>`) +
    (scoped ? '' : `<button type="button" class="tb-btn" data-a="createUser" aria-label="Tạo tài khoản">${ic('plus')}</button>`);
  return topbar({title:scoped ? 'Thành viên' : 'Người dùng', right}) + `
    <div class="large-title">${scoped ? `<div class="eyebrow">${esc(scoped.name)}</div><h1>Thành viên</h1>` : '<h1>Người dùng</h1>'}</div>
    <div class="search-row">
      <label class="searchbar ${f.q ? 'has' : ''}">${ic('search')}<input data-in="userQ" value="${esc(f.q)}" placeholder="Tên, tên đăng nhập, email" enterkeyhint="search"><button type="button" class="clear" data-a="clearQ" aria-label="Xóa">${ic('x')}</button></label>
      <button type="button" class="icon-btn ${filterOn ? 'on' : ''}" data-a="userFilter" aria-label="Bộ lọc">${ic('filter')}${filterOn ? '<span class="dot"></span>' : ''}</button>
    </div>
    <div class="chips" data-part="chips">${userChipsHtml(r, pre)}</div>
    <div data-part="selbanner">${selBanner(r)}</div>
    <div class="list-count" data-part="count">${listCount(r)}</div>
    <div class="section"><div class="group" data-part="list">${list.length ? list.slice(0, r.loaded).map(u => userRow(u, {selectable:true})).join('') : ''}</div>${list.length ? '' : emptyBox('Không có tài khoản phù hợp')}</div>`;
};
function listCount(r){
  const f = userState(r);
  const extra = [f.axes.length ? 'Trục: ' + f.axes.map(a => AX[a].name).join(', ') : null, f.sort !== 'name' ? SORTS.find(s => s.id === f.sort).label : null].filter(Boolean).join(' · ');
  const total = r._list.length, shown = Math.min(r.loaded || 40, total);
  const head = shown < total ? `Đang hiện ${fmt(shown)} / ${fmt(total)} tài khoản` : `${fmt(total)} tài khoản`;
  return head + (extra ? ' · ' + esc(extra) : '');
}
function selBanner(r){
  if(!S.select) return '';
  const all = r._list.length;
  const allSel = all && S.select.size >= all && r._list.every(u => S.select.has(String(u.id)));
  return `<div class="callout">${ic('select')}<span>Chạm để chọn. ${allSel ? `Đã chọn toàn bộ <b>${fmt(all)}</b> kết quả.` : `<button type="button" data-a="selectAll" style="color:inherit;font-weight:700;text-decoration:underline">Chọn tất cả ${fmt(all)} kết quả</button>`}</span></div>`;
}
function chipIntoView(el){
  const c = el.querySelector('.chips .chip.on');
  if(c && c.offsetLeft + c.offsetWidth > c.parentElement.clientWidth) c.parentElement.scrollLeft = c.offsetLeft - 16;
}
AFTER.users = (el, r) => {
  chipIntoView(el);
  r._more = (view) => {
    if(r.loaded >= r._list.length) return;
    const from = r.loaded; r.loaded += 40;
    view.querySelector('[data-part=list]').insertAdjacentHTML('beforeend', r._list.slice(from, r.loaded).map(u => userRow(u, {selectable:true})).join(''));
    view.querySelector('[data-part=count]').innerHTML = listCount(r);
  };
};
function updateUserList(el, r){
  const {pre, list} = userFiltered(r);
  r.loaded = 40;
  el.querySelector('[data-part=chips]').innerHTML = userChipsHtml(r, pre);
  el.querySelector('[data-part=count]').innerHTML = listCount(r);
  el.querySelector('[data-part=selbanner]').innerHTML = selBanner(r);
  const box = el.querySelector('[data-part=list]');
  box.innerHTML = list.slice(0, r.loaded).map(u => userRow(u, {selectable:true})).join('');
  const sec = box.parentElement; const em = sec.querySelector('.empty');
  if(!list.length && !em) sec.insertAdjacentHTML('beforeend', emptyBox('Không có tài khoản phù hợp'));
  if(list.length && em) em.remove();
  el.querySelector('.searchbar').classList.toggle('has', !!userState(r).q);
}

/* ---------- Hồ sơ người dùng ---------- */
VIEWS.user = r => {
  const u = userOf(r.p.id);
  if(!u) return topbar() + emptyBox('Không tìm thấy tài khoản');
  r.tab = r.tab || 'perm';
  const o = org(u.orgId);
  const tags = [
    u.axis ? `<span class="tag" style="background:color-mix(in srgb, ${AX[u.axis].c} 14%, transparent);color:${AX[u.axis].c}">${AX[u.axis].name}</span>` : '',
    u.locked ? `<span class="tag bad">${ic('lock')}Đã khóa</span>` : (u.lastLoginAt ? `<span class="tag good">${ic('check')}Đang hoạt động</span>` : `<span class="tag warn">${ic('clock')}Chưa đăng nhập</span>`),
    u.admin ? `<span class="tag accent">${ic('shield')}Quản trị viên</span>` : ''
  ].join('');
  let body = '';
  if(r.tab === 'perm'){
    const sc = scopeOf(u), scChanged = S.drafts[u.id] && S.drafts[u.id].__scope && S.drafts[u.id].__scope !== savedScope(u);
    body = section('Phạm vi dữ liệu', group(row({a:'pickScope', d:{id:u.id}, lead:`<span class="lead-ic">${ic('eye')}</span>`, title:esc(scopeText(u, sc)), sub:scChanged ? '<span style="color:var(--warn);font-weight:600">Chưa lưu</span> · Dữ liệu người này được xem' : 'Dữ liệu người này được xem', chev:true})));
    MODULE_GROUPS.forEach((g, gi) => {
      body += section(g.name, group(g.items.map(m => {
        const role = roleOf(u, m), changed = role !== savedRole(u, m);
        return row({a:'pickRole', d:{id:u.id, m:m.id}, title:esc(m.name), sub:(changed ? '<span style="color:var(--warn);font-weight:600">Chưa lưu</span> · ' : '') + esc(m.desc), trail:roleTag(role), chev:true});
      }).join('')), `<button type="button" class="link" data-a="groupRole" data-id="${u.id}" data-g="${gi}">Áp cho cả nhóm</button>`);
    });
    body += section('', group(row({a:'previewPerm', d:{id:u.id}, cls:'accent', lead:`<span class="lead-ic">${ic('eye')}</span>`, title:'Xem trước quyền hiệu lực', sub:'Tóm tắt bằng lời người này làm được gì', chev:true})));
  } else if(r.tab === 'acc'){
    body = section('Thông tin tài khoản', group(
      kv('Họ tên', esc(u.name)) + kv('Tên đăng nhập', esc(u.username || '—')) + kv('Email', esc(u.email || '—')) +
      kv('Đơn vị', esc(o ? o.name : '—'), o ? 'openOrg' : null, o ? {id:o.id} : null) + kv('Chức vụ', esc(u.job || '—')) + kv('Nhóm chức vụ', esc(u.position || '—'))
    )) + section('Hoạt động', group(
      kv('Ngày tạo', fmtDate(u.createdAt)) + kv('Đăng nhập gần nhất', u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'Chưa đăng nhập') +
      kv('Quyền quản trị', u.admin ? 'Có' : 'Không')
    )) + section('Đồng bộ', group(
      kv('Tài khoản đăng nhập một lần', '<span class="tag good">Hợp lệ</span>') + kv('Hồ sơ cán bộ, công chức', '<span class="tag good">Đã khớp</span>')
    ), '') + `<div class="hint">${LL ? 'Ngày tạo là số giả lập cho bản demo (nguồn hiện tại chưa có). Lần đăng nhập gần nhất lấy từ Nhật ký đăng nhập — cũng là số mô phỏng.' : 'Ngày tạo, lần đăng nhập là số giả lập cho bản demo — nguồn hiện tại chưa có 2 trường này.'}</div>`;
  } else {
    const items = S.log.filter(e => String(e.uid) === String(u.id));
    items.push({t:u.createdAt, text:'Tạo tài khoản từ hồ sơ cán bộ, công chức', icon:'userPlus'});
    /* Có Nhật ký đăng nhập dùng chung: hiện các lượt đăng nhập thật của người này (90 ngày) thay cho 1 dòng "Đăng nhập" */
    if(!LL && u.lastLoginAt) items.push({t:u.lastLoginAt, text:'Đăng nhập', icon:'logout'});
    items.sort((a, b) => b.t - a.t);
    let logins = '';
    if(LL && LL.canView()){
      const ev = LL.userEvents(u.id, 90);
      logins = section(`Đăng nhập 90 ngày · ${fmt(ev.length)} lượt`, ev.length ? group(ev.slice(0, 8).map(llMiniRow).join('')) : emptyBox('Không có lượt đăng nhập nào trong 90 ngày gần nhất', 'login'),
        ev.length ? `<button type="button" class="link" data-a="llUserLog" data-id="${u.id}">Xem tất cả</button>` : '');
    }
    body = logins + section('Thao tác', `<div class="tl">${items.map(tlItem).join('')}</div>`);
  }
  return topbar({title:u.name, right:`<button type="button" class="tb-btn" data-a="userMore" data-id="${u.id}" aria-label="Thêm">${ic('more')}</button>`}) + `
    <div class="hero">${avatar(u, true)}<h2>${esc(u.name)}</h2><div class="sub">${esc(u.job || 'Chưa có chức vụ')}</div>
      ${o ? `<button type="button" class="link-chip" data-a="openOrg" data-id="${o.id}">${ic('building')}<span>${esc(o.name)}</span></button>` : ''}
      <div class="tags">${tags}</div></div>
    <div class="acts">
      <button type="button" class="${u.locked ? 'good' : 'bad'}" data-a="toggleLock" data-id="${u.id}">${ic(u.locked ? 'unlock' : 'lock')}${u.locked ? 'Mở khóa' : 'Khóa'}</button>
      <button type="button" data-a="toggleAdmin" data-id="${u.id}">${ic(u.admin ? 'shieldOff' : 'shield')}${u.admin ? 'Gỡ quản trị' : 'Cấp quản trị'}</button>
      <button type="button" data-a="editUser" data-id="${u.id}">${ic('edit')}Sửa</button>
      <button type="button" data-a="resetPerm" data-id="${u.id}">${ic('reset')}Đặt lại quyền</button>
    </div>
    <div class="seg">${[['perm','Quyền'],['acc','Tài khoản'],['log','Nhật ký']].map(([k, l]) => `<button type="button" class="${r.tab === k ? 'on' : ''}" data-a="userTab" data-t="${k}">${l}</button>`).join('')}</div>
    ${body}`;
};

/* ---------- Đơn vị (gốc tab) ---------- */
const ORG_CHIPS = [
  {id:'all', label:'Tất cả', f:() => true},
  {id:'so', label:'Sở/Ban/Ngành', f:o => groupOf(o) === 'Sở/Ban/Ngành'},
  {id:'ward', label:'Xã/Phường', f:o => groupOf(o) === 'Xã/Phường'},
  {id:'empty', label:'Chưa có người', f:o => o.total === 0},
  {id:'manual', label:'Gán nhóm tay', f:o => !!S.groupOverride[o.id]}
];
function orgState(r){ if(!r.state) r.state = {chip:r.p.chip || 'all', q:''}; return r.state; }
function orgFiltered(r){
  const f = orgState(r), q = norm(f.q).trim();
  const pre = [...D.orgs.values()].filter(o => !q || o._k.includes(q));
  const chip = ORG_CHIPS.find(c => c.id === f.chip);
  r._list = pre.filter(chip.f);
  return {pre, list:r._list};
}
VIEWS.orgs = r => {
  const f = orgState(r);
  const {pre, list} = orgFiltered(r);
  r.loaded = Math.max(r.loaded || 0, 40);
  return topbar({title:'Đơn vị', right:`<button type="button" class="tb-btn" data-a="createOrg" aria-label="Tạo đơn vị">${ic('plus')}</button>`}) + `
    <div class="large-title"><h1>Đơn vị</h1></div>
    <div class="search-row"><label class="searchbar ${f.q ? 'has' : ''}">${ic('search')}<input data-in="orgQ" value="${esc(f.q)}" placeholder="Tìm trong ${fmt(D.orgs.size)} đơn vị" enterkeyhint="search"><button type="button" class="clear" data-a="clearQ" aria-label="Xóa">${ic('x')}</button></label></div>
    <div class="chips" data-part="chips">${orgChipsHtml(r, pre)}</div>
    <div data-part="body">${orgBody(r, list)}</div>`;
};
function orgChipsHtml(r, pre){
  const f = orgState(r);
  return ORG_CHIPS.map(c => `<button type="button" class="chip ${f.chip === c.id ? 'on' : ''}" data-a="orgChip" data-c="${c.id}">${c.label}${c.id === 'all' ? '' : `<span class="n">${fmt(pre.filter(c.f).length)}</span>`}</button>`).join('');
}
function orgBody(r, list){
  const f = orgState(r);
  if(!f.q && f.chip === 'all'){
    const root = org(D.rootId);
    const ubnd = org(D.axisRoot.UBND);
    const quick = ubnd ? ubnd.children.map(org).filter(o => /Sở ngành|Xã, Phường/.test(o.name)) : [];
    return section('Cây tổ chức', group(
      row({a:'openOrg', d:{id:root.id}, lead:`<span class="lead-ic">${ic('building')}</span>`, title:'Thành phố Hà Nội', sub:`${fmt(D.orgs.size)} đơn vị · ${fmt(D.users.length)} người`, chev:true}) +
      AX_ORDER.map(ax => org(D.axisRoot[ax])).filter(Boolean).map(o => orgRow(o, {showGroup:false})).join('')
    )) + (quick.length ? section('Truy cập nhanh', group(quick.map(o => orgRow(o, {showGroup:false})).join(''))) : '') +
    `<div class="hint">Chạm vào đơn vị để mở hồ sơ: thành viên, đơn vị trực thuộc và toàn bộ cấu hình của đơn vị nằm chung một chỗ.</div>`;
  }
  return `<div class="list-count">${fmt(list.length)} đơn vị</div>` + (list.length ? `<div class="section"><div class="group" data-part="list">${list.slice(0, r.loaded).map(o => orgRow(o)).join('')}</div></div>` : emptyBox('Không có đơn vị phù hợp'));
}
AFTER.orgs = (el, r) => {
  chipIntoView(el);
  r._more = (view) => {
    const box = view.querySelector('[data-part=list]');
    if(!box || r.loaded >= r._list.length) return;
    const from = r.loaded; r.loaded += 40;
    box.insertAdjacentHTML('beforeend', r._list.slice(from, r.loaded).map(o => orgRow(o)).join(''));
  };
};
function updateOrgList(el, r){
  const {pre, list} = orgFiltered(r);
  r.loaded = 40;
  el.querySelector('[data-part=chips]').innerHTML = orgChipsHtml(r, pre);
  el.querySelector('[data-part=body]').innerHTML = orgBody(r, list);
  el.querySelector('.searchbar').classList.toggle('has', !!orgState(r).q);
}

/* ---------- Hồ sơ đơn vị ---------- */
function orgDisplay(o){ return (S.orgEdits[o.id] && S.orgEdits[o.id].name) || o.name; }
function orgScopeLabel(o){
  const id = S.orgScope[o.id] || (wardOf(o) ? 'ward' : (o.level <= 2 ? 'city' : 'org'));
  return SCOPES.find(s => s.id === id).label;
}
VIEWS.org = r => {
  const o = org(r.p.id);
  if(!o) return topbar() + emptyBox('Không tìm thấy đơn vị');
  const anc = ancestors(o);
  const crumbs = anc.length ? `<div class="crumbs">${(anc.length > 3 ? ['…'].concat(anc.slice(-3)) : anc).map(a => a === '…' ? '<span>…</span>' : `<button type="button" data-a="openOrg" data-id="${a.id}">${esc(a.name)}</button>`).join(ic('chevR', 'sep'))}</div>` : '';
  const g = groupOf(o), manual = !!S.groupOverride[o.id];
  const mp = S.mapping[o.id];
  const fc = S.fieldCatalogs[o.id];
  const ind = isSo(o) ? indicatorOf(o) : null;
  const direct = o.userIds.map(userOf).filter(Boolean);
  const members = direct.length ? direct : usersUnder(o.id);
  const tags = [
    o.axis ? `<span class="tag" style="background:color-mix(in srgb, ${AX[o.axis].c} 14%, transparent);color:${AX[o.axis].c}">${AX[o.axis].name}</span>` : '',
    `<span class="tag">${esc(g)}${manual ? ' · gán tay' : ''}</span>`,
    `<span class="tag">${levelLabel(o)}</span>`,
    o.total === 0 ? `<span class="tag warn">${ic('alert')}Chưa có người</span>` : ''
  ].join('');
  const childRows = o.children.slice(0, 6).map(id => orgRow(org(id))).join('');
  return topbar({title:orgDisplay(o), right:`<button type="button" class="tb-btn" data-a="orgMore" data-id="${o.id}" aria-label="Thêm">${ic('more')}</button>`}) + `
    ${crumbs}
    <div class="hero"><span class="org-ic" ${o.axis ? `style="background:color-mix(in srgb, ${AX[o.axis].c} 15%, transparent);color:${AX[o.axis].c}"` : ''}>${ic('building')}</span><h2>${esc(orgDisplay(o))}</h2><div class="tags">${tags}</div></div>
    <div class="acts">
      <button type="button" data-a="createUser" data-org="${o.id}">${ic('userPlus')}Thêm người</button>
      <button type="button" data-a="createOrg" data-parent="${o.id}">${ic('plus')}Đơn vị con</button>
      <button type="button" data-a="sync">${ic('sync')}Đồng bộ</button>
      <button type="button" data-a="editOrg" data-id="${o.id}">${ic('edit')}Sửa</button>
    </div>
    <div class="stats3"><div><div class="v">${fmt(o.userIds.length)}</div><div class="l">Trực tiếp</div></div><div><div class="v">${fmt(o.children.length)}</div><div class="l">Đơn vị con</div></div><div><div class="v">${fmt(o.total)}</div><div class="l">Tổng nhân sự</div></div></div>
    ${o.children.length ? section('Đơn vị trực thuộc', group(childRows), o.children.length > 6 ? `<button type="button" class="link" data-a="push" data-v="orgChildren" data-id="${o.id}">Tất cả ${fmt(o.children.length)}</button>` : '') : ''}
    ${members.length ? section(direct.length ? 'Thành viên' : 'Nhân sự trong các đơn vị con', group(members.slice(0, 5).map(u => userRow(u)).join('')), `<button type="button" class="link" data-a="push" data-v="users" data-org="${o.id}">Tất cả ${fmt(o.total)}</button>`) : ''}
    ${section('Cấu hình đơn vị', group(
      row({a:'pickGroup', d:{id:o.id}, lead:`<span class="lead-ic sm">${ic('layers')}</span>`, sm:true, title:'Phân nhóm', trail:`<span class="val">${esc(g)}${manual ? ' (tay)' : ''}</span>`, inline:true, chev:true}) +
      row({a:'pickMapping', d:{id:o.id}, lead:`<span class="lead-ic sm">${ic('pin')}</span>`, sm:true, title:'Trục / địa bàn', trail:`<span class="val">${esc(mp ? [mp.axis ? AX[mp.axis].name : null, mp.area].filter(Boolean).join(' · ') : (o.axis ? AX[o.axis].name : '—') + ' · ' + (wardOf(o) || 'Toàn Thành phố'))}</span>`, inline:true, chev:true}) +
      row({a:'push', d:{v:'fields', org:o.id}, lead:`<span class="lead-ic sm">${ic('tag')}</span>`, sm:true, title:'Lĩnh vực', trail:`<span class="val">${fc ? 'Riêng' : 'Mặc định'} · ${fieldCatalog(o.id).filter(x => !x.hidden).length}</span>`, inline:true, chev:true}) +
      (ind ? row({a:'editIndicator', d:{id:o.id}, lead:`<span class="lead-ic sm">${ic('chart')}</span>`, sm:true, title:'Bảng chỉ tiêu', trail:`<span class="val">${ind.active ? 'Đang dùng' : 'Đang ẩn'}</span>`, inline:true, chev:true}) : '') +
      row({a:'pickOrgScope', d:{id:o.id}, lead:`<span class="lead-ic sm">${ic('eye')}</span>`, sm:true, title:'Phạm vi dữ liệu mặc định', trail:`<span class="val">${esc(orgScopeLabel(o))}</span>`, inline:true, chev:true})
    ))}
    ${section('Thông tin', group(
      kv('Cấp tổ chức', levelLabel(o)) +
      (o.parentId ? kv('Đơn vị cấp trên', esc(org(o.parentId).name), 'openOrg', {id:o.parentId}) : '') +
      kv('Nguồn', 'Hồ sơ cán bộ, công chức') + kv('Lần đồng bộ', fmtDate(S.lastSync, true))
    ))}`;
};
VIEWS.orgChildren = r => {
  const o = org(r.p.id);
  const f = r.state || (r.state = {q:''});
  const q = norm(f.q);
  r._list = o.children.map(org).filter(c => !q || c._k.includes(q));
  r.loaded = Math.max(r.loaded || 0, 40);
  return topbar({title:'Đơn vị trực thuộc'}) + `
    <div class="large-title"><div class="eyebrow">${esc(o.name)}</div><h1>Đơn vị trực thuộc</h1></div>
    <div class="search-row"><label class="searchbar ${f.q ? 'has' : ''}">${ic('search')}<input data-in="childQ" value="${esc(f.q)}" placeholder="Tìm trong ${fmt(o.children.length)} đơn vị"><button type="button" class="clear" data-a="clearQ">${ic('x')}</button></label></div>
    <div class="section"><div class="group" data-part="list">${r._list.slice(0, r.loaded).map(c => orgRow(c)).join('')}</div></div>`;
};
AFTER.orgChildren = AFTER.orgs;

/* ---------- Cấu hình ---------- */
VIEWS.settings = () => {
  const manual = Object.keys(S.groupOverride).length;
  const themeLbl = {light:'Sáng', dark:'Xanh IOC'}[S.theme];
  return topbar({title:'Cấu hình'}) + `
    <div class="large-title"><h1>Cấu hình</h1></div>
    ${section('', group(row({a:'account', lead:accountAv(40), title:'ioc_mbfs', sub:'Quản trị toàn cục · toàn hệ thống', chev:true}) + iocRow()))}
    ${section('Tổ chức', group(
      row({a:'push', d:{v:'grouping'}, lead:`<span class="lead-ic sm">${ic('layers')}</span>`, sm:true, title:'Phân nhóm đơn vị', sub:`${fmt(D.orgs.size)} đơn vị${manual ? ` · ${manual} gán tay` : ''}`, chev:true}) +
      row({a:'push', d:{v:'tree'}, lead:`<span class="lead-ic sm">${ic('tree')}</span>`, sm:true, title:'Cây thư mục tùy biến', sub:'Cây đơn vị hiện cho người dùng', chev:true}) +
      row({a:'push', d:{v:'indicators'}, lead:`<span class="lead-ic sm">${ic('chart')}</span>`, sm:true, title:'Bảng chỉ tiêu theo đơn vị', sub:`${indicators().filter(x => x.active).length} Sở đang dùng`, chev:true})
    ))}
    ${section('Danh mục', group(
      row({a:'push', d:{v:'fields'}, lead:`<span class="lead-ic sm">${ic('tag')}</span>`, sm:true, title:'Lĩnh vực mặc định', sub:`${S.fieldDefault.filter(x => !x.hidden).length} lĩnh vực đang dùng`, chev:true}) +
      row({a:'push', d:{v:'roles'}, lead:`<span class="lead-ic sm">${ic('role')}</span>`, sm:true, title:'Vai trò mẫu', sub:`${Object.keys(ROLE_DESC).length} vai trò · ${MODULES.length} phân hệ`, chev:true})
    ))}
    ${section('Hệ thống', group(
      row({a:'sync', lead:`<span class="lead-ic sm">${ic('sync')}</span>`, sm:true, title:'Đồng bộ dữ liệu', trail:`<span class="val">${relTime(S.lastSync)}</span>`, inline:true, chev:true}) +
      (LL && LL.canView() ? (() => { const ts = LL.todayStats(); return row({a:'push', d:{v:'loginLog'}, lead:`<span class="lead-ic sm">${ic('login')}</span>`, sm:true, title:'Nhật ký đăng nhập', sub:`Hôm nay ${fmt(ts.total)} lượt · ${fmt(ts.fail)} thất bại`, chev:true}); })() : '') +
      row({a:'push', d:{v:'activity'}, lead:`<span class="lead-ic sm">${ic('clock')}</span>`, sm:true, title:'Nhật ký thao tác', chev:true}) +
      row({a:'themeSheet', lead:`<span class="lead-ic sm">${ic('moon')}</span>`, sm:true, title:'Giao diện', trail:`<span class="val">${themeLbl}</span>`, inline:true, chev:true})
    ))}
    <div class="hint">Bản demo — mọi thay đổi chỉ lưu trong phiên làm việc, chưa ghi về máy chủ.</div>`;
};

/* ---------- Phân nhóm đơn vị ---------- */
VIEWS.grouping = r => {
  const f = r.state || (r.state = {chip:'all', q:''});
  const q = norm(f.q);
  const pre = [...D.orgs.values()].filter(o => !q || o._k.includes(q));
  const chips = [{id:'all', label:'Tất cả', f:() => true}, ...GROUPS.map(g => ({id:g, label:g, f:o => groupOf(o) === g})), {id:'manual', label:'Gán tay', f:o => !!S.groupOverride[o.id]}];
  r._list = pre.filter(chips.find(c => c.id === f.chip).f);
  r.loaded = Math.max(r.loaded || 0, 40);
  r._chips = chips;
  return topbar({title:'Phân nhóm'}) + `
    <div class="large-title"><h1>Phân nhóm đơn vị</h1><p>Nhóm tự động tính theo cây tổ chức. Gán tay sẽ được ưu tiên và không bị đồng bộ ghi đè.</p></div>
    <div class="search-row"><label class="searchbar ${f.q ? 'has' : ''}">${ic('search')}<input data-in="groupQ" value="${esc(f.q)}" placeholder="Tìm đơn vị"><button type="button" class="clear" data-a="clearQ">${ic('x')}</button></label></div>
    <div class="chips">${chips.map(c => `<button type="button" class="chip ${f.chip === c.id ? 'on' : ''}" data-a="groupChip" data-c="${esc(c.id)}">${esc(c.label)}${c.id === 'all' ? '' : `<span class="n">${fmt(pre.filter(c.f).length)}</span>`}</button>`).join('')}</div>
    <div class="list-count">${fmt(r._list.length)} đơn vị</div>
    <div class="section"><div class="group" data-part="list">${r._list.slice(0, r.loaded).map(groupRow).join('')}</div></div>`;
};
function groupRow(o){
  const manual = !!S.groupOverride[o.id];
  return orgRow(o, {a:'pickGroup', showGroup:false, trail:`<span class="tag ${manual ? 'accent' : ''}">${esc(groupOf(o))}</span>`});
}
AFTER.grouping = (el, r) => {
  r._more = (view) => {
    if(r.loaded >= r._list.length) return;
    const from = r.loaded; r.loaded += 40;
    view.querySelector('[data-part=list]').insertAdjacentHTML('beforeend', r._list.slice(from, r.loaded).map(groupRow).join(''));
  };
};

/* ---------- Lĩnh vực ---------- */
VIEWS.fields = r => {
  const o = r.p.org ? org(r.p.org) : null;
  const custom = o && S.fieldCatalogs[o.id];
  const cat = fieldCatalog(o ? o.id : null);
  return topbar({title:'Lĩnh vực', right:`<button type="button" class="tb-btn" data-a="addField" aria-label="Thêm lĩnh vực">${ic('plus')}</button>`}) + `
    <div class="large-title">${o ? `<div class="eyebrow">${esc(o.name)}</div>` : ''}<h1>${o ? 'Lĩnh vực' : 'Lĩnh vực mặc định'}</h1>
      <p>${o ? 'Dùng cho kịch bản xử lý và thống kê của đơn vị.' : 'Áp cho mọi đơn vị chưa có danh mục riêng.'}</p></div>
    ${o && !custom ? `<div class="callout">${ic('alert')}<span>Đơn vị đang dùng <b>danh mục mặc định</b>. Thêm hoặc sửa một lĩnh vực sẽ tạo danh mục riêng, giữ nguyên các mục mặc định.</span></div>` : ''}
    <div class="stats3"><div><div class="v">${cat.filter(x => !x.hidden).length}</div><div class="l">Đang dùng</div></div><div><div class="v">${cat.filter(x => x.hidden).length}</div><div class="l">Đang ẩn</div></div><div><div class="v">${cat.filter(x => x.custom).length}</div><div class="l">Tự thêm</div></div></div>
    ${section('', group(cat.map((x, i) => row({tag:'div', a:'fieldMore', d:{i}, lead:`<span class="lead-ic sm ${x.hidden ? 'mute' : ''}">${ic('tag')}</span>`, sm:true, cls:'tap',
      title:esc(x.name), sub:x.custom ? 'Đơn vị tự thêm' : 'Mặc định',
      trail:`${x.hidden ? '<span class="tag">Đang ẩn</span>' : ''}<button type="button" class="more" data-a="fieldMore" data-i="${i}" aria-label="Thao tác">${ic('more')}</button>`, inline:true})).join('')))}`;
};

/* ---------- Bảng chỉ tiêu ---------- */
VIEWS.indicators = r => {
  const f = r.state || (r.state = {chip:'all'});
  const all = indicators();
  const list = all.filter(x => f.chip === 'all' || (f.chip === 'on' ? x.active : !x.active));
  return topbar({title:'Bảng chỉ tiêu', right:`<button type="button" class="tb-btn" data-a="addIndicator" aria-label="Thêm">${ic('plus')}</button>`}) + `
    <div class="large-title"><h1>Bảng chỉ tiêu</h1><p>Mỗi Sở gắn với một bảng chỉ tiêu. Đơn vị con chưa gắn riêng sẽ dùng bảng của đơn vị cấp trên.</p></div>
    <div class="chips">${[['all','Tất cả', all.length],['on','Đang dùng', all.filter(x => x.active).length],['off','Đang ẩn', all.filter(x => !x.active).length]].map(([k, l, n]) => `<button type="button" class="chip ${f.chip === k ? 'on' : ''}" data-a="indChip" data-c="${k}">${l}<span class="n">${n}</span></button>`).join('')}</div>
    ${list.length ? section('', group(list.map(x => row({a:'editIndicator', d:{id:x.orgId}, lead:`<span class="lead-ic sm ${x.active ? '' : 'mute'}">${ic('chart')}</span>`, sm:true, title:esc(x.name), sub:x.name === org(x.orgId).name ? 'Gắn với chính đơn vị' : 'Gắn với ' + esc(org(x.orgId).name), trail:x.active ? '<span class="tag good">Đang dùng</span>' : '<span class="tag">Đang ẩn</span>', inline:true, chev:true})).join(''))) : emptyBox('Không có bảng chỉ tiêu nào')}`;
};

/* ---------- Cây thư mục ---------- */
VIEWS.tree = r => {
  const nodeId = r.p.node || null;
  const node = nodeId ? S.tree.map[nodeId] : null;
  const kids = tchildren(nodeId);
  const path = tpath(nodeId);
  const crumbs = `<div class="path-bar"><button type="button" class="${nodeId ? '' : 'cur'}" data-a="treeJump" data-n="">${ic('tree')}<span>Gốc</span></button>${path.map(n => `<button type="button" class="${n.id === nodeId ? 'cur' : ''}" data-a="treeJump" data-n="${n.id}"><span>${esc(n.label)}</span></button>`).join('')}</div>`;
  return topbar({title:node ? node.label : 'Cây thư mục', right:`<button type="button" class="tb-btn" data-a="treeAdd" data-n="${nodeId || ''}" aria-label="Thêm">${ic('plus')}</button>`}) + `
    <div class="large-title"><h1>${esc(node ? node.label : 'Cây thư mục')}</h1>${node ? `<p>${node.virtual ? 'Thư mục ảo' : 'Đơn vị'} · ${kids.length} mục bên trong</p>` : '<p>Cây đơn vị hiện cho người dùng khi chọn đơn vị. Đi vào từng cấp để sắp xếp, dùng "Di chuyển đến…" thay cho kéo-thả.</p>'}</div>
    ${crumbs}
    ${kids.length ? section('', group(kids.map(id => {
      const n = S.tree.map[id];
      return row({tag:'div', a:'treeOpen', d:{n:id}, cls:'tap', lead:`<span class="lead-ic sm ${n.virtual ? 'warn' : ''}">${ic(n.virtual ? 'folder' : 'building')}</span>`, sm:true,
        title:esc(n.label), sub:`${n.virtual ? 'Thư mục ảo' : 'Đơn vị'}${n.children.length ? ` · ${n.children.length} mục` : ''}`,
        trail:`<button type="button" class="more" data-a="treeMore" data-n="${id}" aria-label="Thao tác">${ic('more')}</button>`, inline:true, chev:true});
    }).join(''))) : emptyBox('Thư mục trống. Bấm + để thêm thư mục ảo hoặc đơn vị.', 'folder')}
    ${nodeId ? '' : section('', group(row({a:'treeReset', cls:'danger', lead:`<span class="lead-ic sm bad">${ic('reset')}</span>`, sm:true, title:'Khôi phục cây mặc định'})))}`;
};

/* ---------- Vai trò mẫu ---------- */
VIEWS.roles = () => topbar({title:'Vai trò mẫu'}) + `
  <div class="large-title"><h1>Vai trò mẫu</h1><p>Mỗi phân hệ cho phép một số vai trò. Gán vai trò cho từng người trong hồ sơ người dùng.</p></div>
  ${section('', group(Object.keys(ROLE_DESC).map(rn => row({a:'roleInfo', d:{r:rn}, title:esc(rn), sub:esc(ROLE_DESC[rn]), trail:`<span class="count">${MODULES.filter(m => m.roles.includes(rn)).length}</span>`, inline:true, chev:true})).join('')))}
  <div class="hint">Con số bên phải: số phân hệ có vai trò này.</div>`;

/* ---------- Nhật ký ---------- */
VIEWS.activity = () => {
  const days = {};
  S.log.slice().sort((a, b) => b.t - a.t).forEach(e => { const k = relTime(e.t); (days[k] = days[k] || []).push(e); });
  return topbar({title:'Nhật ký'}) + `<div class="large-title"><h1>Nhật ký thao tác</h1></div>` +
    Object.entries(days).map(([k, items]) => section(k, `<div class="tl">${items.map(tlItem).join('')}</div>`)).join('');
};

/* ---------- Nhật ký đăng nhập (toàn hệ thống, chỉ Admin hệ thống) ----------
   Cùng nguồn js/core/login-log-data.js với trang "Nhật ký đăng nhập" bản máy tính nên ra cùng con số. Khác bản máy
   tính cho hợp điện thoại: cuộn tới đâu tải thêm 40 lượt tới đó (anh chốt bỏ phân trang 14/10/2026), lượt nhóm theo
   ngày, bấm 1 lượt mở bảng chi tiết; "Tùy chọn" mở bảng trượt có lịch 2 tháng xếp dọc. Chỉ xem, không sửa/xóa. */
const LL_MAX_DAYS = 365;
const LL_PRESETS = [['week','Tuần'],['month','Tháng'],['quarter','Quý'],['custom','Tùy chọn']];
const LL_STATUS = [['all','Tất cả'],['ok','Thành công'],['fail','Thất bại']];
const WEEKDAY = ['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
const dayStart = v => { const x = new Date(v); return new Date(x.getFullYear(), x.getMonth(), x.getDate()); };
const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a, b) => !!a && !!b && dayStart(a).getTime() === dayStart(b).getTime();
const isoD = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysIncl = (a, b) => Math.round((dayStart(b) - dayStart(a)) / DAY) + 1;
const hms = ts => { const d = new Date(ts), p = n => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
/* Tuần/Tháng/Quý = kỳ hiện tại chứa hôm nay, tính tới hết hôm nay (tuần bắt đầu Thứ Hai). */
function llPresetRange(p){
  const t = dayStart(Date.now());
  if(p === 'month') return {from:new Date(t.getFullYear(), t.getMonth(), 1), to:t};
  if(p === 'quarter') return {from:new Date(t.getFullYear(), Math.floor(t.getMonth() / 3) * 3, 1), to:t};
  return {from:addD(t, -((t.getDay() + 6) % 7)), to:t};
}
function llState(r){
  if(!r.state){
    const p = r.p || {}, t = dayStart(Date.now());
    const st = {preset:'week', from:0, to:0, status:p.status || 'all', axis:'', orgId:null, orgSub:true, q:'', uid:p.uid ? String(p.uid) : null};
    if(p.today){ st.preset = 'custom'; st.from = st.to = t.getTime(); }
    else if(p.uid){ st.preset = 'custom'; st.from = addD(t, -89).getTime(); st.to = t.getTime(); } // khớp mục "Đăng nhập 90 ngày" ở hồ sơ
    r.state = st;
  }
  const st = r.state;
  if(st.preset !== 'custom'){ const g = llPresetRange(st.preset); st.from = g.from.getTime(); st.to = g.to.getTime(); }
  return st;
}
function llRangeText(st){
  const lbl = {week:'Tuần này', month:'Tháng này', quarter:'Quý này'}[st.preset];
  const span = sameDay(st.from, st.to) ? fmtDate(st.from) : `${fmtDate(st.from)} – ${fmtDate(st.to)}`;
  return lbl ? `${lbl} · ${span}` : span;
}
function llMatch(st, e, skip, q){
  if(skip !== 'status'){ if(st.status === 'ok' && !e.ok) return false; if(st.status === 'fail' && e.ok) return false; }
  const u = LL.userOf(e);
  if(st.uid && String(u.id) !== st.uid) return false;
  if(skip !== 'axis' && st.axis && u.axis !== st.axis) return false;
  if(st.orgId){
    const p = LL.orgPathOf(st.orgId);
    if(st.orgSub ? !(u.orgPath === p || u.orgPath.startsWith(p + '.')) : String(u.orgId) !== String(st.orgId)) return false;
  }
  if(q && !u._s.includes(q) && !e.ip.includes(q)) return false;
  return true;
}
const llQn = st => LL.norm(st.q).trim();
function llFiltered(r){
  const st = llState(r);
  const key = [r._tk, st.status, st.axis, st.orgId, st.orgSub, st.q, st.uid].join('|');
  if(r._fk === key) return r._flist;
  const q = llQn(st), list = (r._rows || []).filter(e => llMatch(st, e, null, q));
  const days = new Map();
  list.forEach(e => { const k = isoD(new Date(e.ts)); days.set(k, (days.get(k) || 0) + 1); });
  r._fk = key; r._flist = list; r._list = list; r._days = days;
  return list;
}
function avPlain(u, lg){
  const ch = (u._given || givenName(u.name))[0].toUpperCase();
  const col = AV_COLORS[Math.abs(Number(String(u.id).replace(/\D/g, '')) || 0) % AV_COLORS.length];
  return `<span class="av ${lg ? 'lg' : ''}" style="background:${col}">${esc(ch)}</span>`;
}
function llRow(e, i){
  const u = LL.userOf(e), du = e.u >= 0 ? userOf(u.id) : null, cur = LL.isCurrent(e);
  const lead = e.u < 0 ? accountAv(40) : avPlain(du || u);
  const sub = e.ok ? `@${esc(u.username)} · ${esc(u.orgName)}` : `<span class="ll-reason">${esc(LL.reason(e.reason))}</span> · @${esc(u.username)}`;
  const tag = !e.ok ? '<span class="tag bad">Thất bại</span>' : (cur ? '<span class="tag accent">Phiên hiện tại</span>' : '<span class="tag good">Thành công</span>');
  return row({a:'llOpen', d:{i}, lead, title:esc(u.name), sub, trail:`<span class="ll-time">${hms(e.ts)}</span>${tag}`});
}
/* Dòng gọn trong hồ sơ người dùng (tab Nhật ký) */
function llMiniRow(e){
  const cur = LL.isCurrent(e);
  return row({tag:'div', lead:`<span class="lead-ic sm ${e.ok ? 'good' : 'bad'}">${ic(e.ok ? 'login' : 'x')}</span>`, sm:true,
    title:`${fmtDate(e.ts)} <span class="ll-time">${hms(e.ts)}</span>`, sub:e.ok ? `IP ${esc(e.ip)}` : `<span class="ll-reason">${esc(LL.reason(e.reason))}</span> · IP ${esc(e.ip)}`,
    trail:!e.ok ? '<span class="tag bad">Thất bại</span>' : (cur ? '<span class="tag accent">Phiên hiện tại</span>' : '<span class="tag good">Thành công</span>'), inline:true});
}
function llDayTitle(k){
  const [y, m, d] = k.split('-').map(Number), dt = new Date(y, m - 1, d), t = dayStart(Date.now());
  const pre = sameDay(dt, t) ? 'Hôm nay' : (sameDay(dt, addD(t, -1)) ? 'Hôm qua' : WEEKDAY[dt.getDay()]);
  return `${pre} · ${fmtDate(dt.getTime())}`;
}
/* Thêm lượt [from, to) vào danh sách, nhóm theo ngày: lượt cùng ngày với nhóm cuối thì nối tiếp vào nhóm đó. */
function llAppend(box, r, from, to){
  const list = r._flist.slice(from, to); if(!list.length) return;
  const last = box.lastElementChild;
  let curDay = last ? last.dataset.day : null, cont = '', html = '', open = null;
  list.forEach((e, j) => {
    const k = isoD(new Date(e.ts)), rh = llRow(e, from + j);
    if(open === null && k === curDay){ cont += rh; return; }
    if(k !== open){
      if(open !== null) html += '</div></div>';
      open = k;
      html += `<div class="section ll-dsec" data-day="${k}"><div class="section-h"><h3>${esc(llDayTitle(k))}</h3><span class="ll-dcount">${fmt(r._days.get(k) || 0)} lượt</span></div><div class="group">`;
    }
    html += rh;
  });
  if(open !== null) html += '</div></div>';
  if(cont && last) last.querySelector('.group').insertAdjacentHTML('beforeend', cont);
  if(html) box.insertAdjacentHTML('beforeend', html);
}
function llCountText(r){
  const total = r._flist.length, shown = Math.min(r.loaded || 40, total);
  return esc(llRangeText(llState(r))) + ' · ' + (shown < total ? `Đang hiện ${fmt(shown)} / ${fmt(total)} lượt đăng nhập` : `${fmt(total)} lượt đăng nhập`);
}
function llBodyHtml(r){
  const st = llState(r);
  if(r._err) return `<div class="empty">${ic('alert')}<div>${esc(r._err)}</div><button type="button" class="btn ll-retry" data-a="llRefresh">Thử lại</button></div>`;
  if(!r._rows) return `<div class="list-count">${esc(llRangeText(st))} · Đang tải…</div><div class="section"><div class="group" aria-busy="true">${Array.from({length:7}, () => `<div class="row has-lead"><span class="av ll-sk-av"></span><span class="body"><span class="ll-sk w1"></span><span class="ll-sk w2"></span></span><span class="ll-sk w3"></span></div>`).join('')}</div></div>`;
  if(!llFiltered(r).length) return `<div class="list-count">${esc(llRangeText(st))}</div>` + emptyBox('Không có dữ liệu trong khoảng thời gian đã chọn', 'cal');
  return `<div class="list-count" data-part="count">${llCountText(r)}</div><div data-part="list"></div>`;
}
function llFill(el, r){
  const body = el && el.querySelector('[data-part=llbody]'); if(!body) return;
  r.loaded = Math.max(40, r.loaded || 0);
  body.innerHTML = llBodyHtml(r);
  const box = body.querySelector('[data-part=list]');
  if(box) llAppend(box, r, 0, r.loaded);
}
/* Mô phỏng 1 lần gọi API (có độ trễ) để có đủ trạng thái đang tải / lỗi như khi nối API thật. */
function llLoad(el, r){
  const st = llState(r), tk = r._tk = (r._tk || 0) + 1;
  r._rows = null; r._err = null; r._rk = st.from + '-' + st.to; r.loaded = 40;
  llFill(el, r);
  setTimeout(() => {
    if(r._tk !== tk) return;
    try{ if(window.__ollSimulateError) throw new Error('simulated'); r._rows = LL.query(new Date(st.from), new Date(st.to)); }
    catch(e){ r._rows = null; r._err = 'Không tải được nhật ký đăng nhập. Vui lòng thử lại.'; }
    const v = view(); if(v && v._route === r) llFill(v, r);
  }, 280 + Math.floor(Math.random() * 220));
}
function llChips(r){
  const st = llState(r), o = st.orgId ? org(st.orgId) : null;
  const c = (a, label, val) => `<button type="button" class="chip ${val ? 'on' : ''}" data-a="${a}">${label}${val ? `<b class="ll-cv">${esc(val)}</b>` : ''}${ic('chevD', 'll-dd')}</button>`;
  return c('llStatus', 'Trạng thái', st.status === 'all' ? '' : LL_STATUS.find(s => s[0] === st.status)[1]) +
    c('llAxis', 'Trục', st.axis ? AX[st.axis].name : '') + c('llOrg', 'Đơn vị', o ? orgDisplay(o) : '');
}
VIEWS.loginLog = r => {
  if(!LL || !LL.canView()) return topbar({title:'Nhật ký đăng nhập'}) + `<div class="large-title"><h1>Nhật ký đăng nhập</h1></div>` + emptyBox('Chỉ tài khoản Admin hệ thống được xem nhật ký đăng nhập.', 'lock');
  const st = llState(r);
  const uidU = st.uid ? (LL.userById(st.uid) || (st.uid === LL.ADMIN_USER.id ? LL.ADMIN_USER : null)) : null;
  const right = `<button type="button" class="tb-btn" data-a="llRefresh" aria-label="Làm mới">${ic('refresh')}</button><button type="button" class="tb-btn" data-a="llExport" aria-label="Xuất Excel">${ic('download')}</button>`;
  return topbar({title:'Nhật ký đăng nhập', right}) + `
    <div class="large-title"><h1>Nhật ký đăng nhập</h1><p>Lượt đăng nhập của mọi tài khoản: thành công, thất bại, bị khóa. Chỉ xem, không sửa hay xóa.</p></div>
    <div class="search-row"><label class="searchbar ${st.q ? 'has' : ''}">${ic('search')}<input data-in="llQ" value="${esc(st.q)}" placeholder="Họ tên, tên đăng nhập, IP" enterkeyhint="search" autocomplete="off"><button type="button" class="clear" data-a="clearQ" aria-label="Xóa">${ic('x')}</button></label></div>
    <div class="seg">${LL_PRESETS.map(([k, l]) => `<button type="button" class="${st.preset === k ? 'on' : ''}" data-a="llPreset" data-p="${k}">${l}</button>`).join('')}</div>
    ${st.preset === 'custom' ? section('Khoảng ngày', group(row({a:'llRange', lead:`<span class="lead-ic sm">${ic('cal')}</span>`, sm:true, title:sameDay(st.from, st.to) ? fmtDate(st.from) : `${fmtDate(st.from)} → ${fmtDate(st.to)}`, sub:`${fmt(daysIncl(st.from, st.to))} ngày · tối đa ${LL_MAX_DAYS} ngày`, chev:true})), `<button type="button" class="link" data-a="llReset">Đặt lại</button>`) : ''}
    <div class="chips" data-part="chips">${llChips(r)}</div>
    ${st.uid ? `<div class="callout">${ic('user')}<span>Chỉ hiện lượt của <b>${esc(uidU ? uidU.name : 'tài khoản đã chọn')}</b></span><button type="button" class="x" data-a="llClearUid" aria-label="Bỏ lọc người dùng">${ic('x')}</button></div>` : ''}
    <div data-part="llbody"></div>`;
};
AFTER.loginLog = (el, r) => {
  if(!LL || !LL.canView()) return;
  const st = llState(r);
  r._more = v => {
    if(!r._flist || r.loaded >= r._flist.length) return;
    const box = v.querySelector('[data-part=list]'); if(!box) return;
    const from = r.loaded; r.loaded += 40;
    llAppend(box, r, from, r.loaded);
    const c = v.querySelector('[data-part=count]'); if(c) c.innerHTML = llCountText(r);
  };
  if((!r._rows && !r._err) || r._rk !== st.from + '-' + st.to) llLoad(el, r);
  else llFill(el, r);
};
/* Bảng trượt chọn khoảng ngày: 2 ô Từ ngày / Đến ngày + lịch 2 tháng xếp dọc. Chọn khoảng bằng 2 lần chạm, khoảng
   đã chọn tô nền, ngày tương lai bị khóa. Hủy = giữ nguyên; Áp dụng mới tải lại; Đặt lại = về Tuần. */
function llRangeSheet(r){
  const st = llState(r), today = dayStart(Date.now());
  const c = {start:new Date(st.from), end:new Date(st.to), pickEnd:false, err:''};
  const curM = new Date(today.getFullYear(), today.getMonth(), 1);
  const mAdd = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
  let top = mAdd(new Date(c.end.getFullYear(), c.end.getMonth(), 1), -1);
  if(mAdd(top, 1) > curM) top = mAdd(curM, -1);
  const month = first => {
    const lead = (first.getDay() + 6) % 7, n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(), end = c.end;
    let cells = '';
    for(let i = 0; i < lead; i++) cells += '<span></span>';
    for(let d = 1; d <= n; d++){
      const day = new Date(first.getFullYear(), first.getMonth(), d);
      const fut = day > today, isS = sameDay(day, c.start), isE = sameDay(day, end), band = c.start && end && !sameDay(c.start, end);
      const inR = c.start && end && day > c.start && day < end;
      const cls = ['ll-day', inR ? 'in' : '', isS && band ? 'start' : '', isE && band ? 'end' : '', (isS || isE) ? 'sel' : '', sameDay(day, today) ? 'today' : ''].filter(Boolean).join(' ');
      cells += `<button type="button" class="${cls}" ${fut ? 'disabled' : ''} data-a="pick" data-v="d:${isoD(day)}"><span>${d}</span></button>`;
    }
    return `<div class="ll-month"><div class="ll-month-t">Tháng ${first.getMonth() + 1} / ${first.getFullYear()}</div><div class="ll-dow"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div><div class="ll-days">${cells}</div></div>`;
  };
  const body = () => {
    const end = c.end || c.start, tooLong = c.start && daysIncl(c.start, end) > LL_MAX_DAYS;
    const note = c.err || (tooLong ? `Khoảng thời gian tối đa ${LL_MAX_DAYS} ngày` : (!c.start ? 'Chạm vào lịch để chọn ngày bắt đầu' : (c.pickEnd ? 'Chạm ngày kết thúc' : `${fmt(daysIncl(c.start, end))} ngày · tối đa ${LL_MAX_DAYS} ngày`)));
    return `<div class="ll-flds">
        <button type="button" class="ll-fld ${!c.pickEnd ? 'on' : ''}" data-a="pick" data-v="f:from"><small>Từ ngày</small><b>${c.start ? fmtDate(c.start.getTime()) : 'Chọn ngày'}</b></button>
        ${ic('chevR', 'll-arr')}
        <button type="button" class="ll-fld ${c.pickEnd ? 'on' : ''}" data-a="pick" data-v="f:to"><small>Đến ngày</small><b>${c.end ? fmtDate(c.end.getTime()) : 'Chọn ngày'}</b></button>
      </div>
      <div class="ll-cal-note ${c.err || tooLong ? 'err' : ''}" role="${c.err ? 'alert' : 'status'}">${esc(note)}</div>
      <div class="ll-cal-nav"><button type="button" data-a="pick" data-v="n:-1" aria-label="Lùi 1 tháng">${ic('chevL')}</button><span>Tháng ${top.getMonth() + 1} – ${mAdd(top, 1).getMonth() + 1} / ${mAdd(top, 1).getFullYear()}</span><button type="button" data-a="pick" data-v="n:1" ${mAdd(top, 1) >= curM ? 'disabled' : ''} aria-label="Tới 1 tháng">${ic('chevR')}</button></div>
      ${month(top)}${month(mAdd(top, 1))}`;
  };
  const redraw = () => { const sh = sheets[sheets.length - 1]; if(sh) sh.querySelector('.sh-body').innerHTML = body(); };
  openSheet({title:'Chọn khoảng ngày', full:true, body:body(),
    foot:`<button type="button" class="btn" data-a="closeSheet">Hủy</button><button type="button" class="btn" data-a="pick" data-v="reset">Đặt lại</button><button type="button" class="btn pri" data-a="ok">Áp dụng</button>`,
    onPick:v => {
      c.err = '';
      if(v === 'reset'){ st.preset = 'week'; closeSheet(); refresh(); return; }
      if(v === 'f:from') c.pickEnd = false;
      else if(v === 'f:to') c.pickEnd = !!c.start;
      else if(v.startsWith('n:')){ const nx = mAdd(top, Number(v.slice(2))); if(mAdd(nx, 1) <= curM) top = nx; }
      else if(v.startsWith('d:')){
        const [y, m, d] = v.slice(2).split('-').map(Number), day = new Date(y, m - 1, d);
        if(day > today) return;
        if(c.pickEnd && c.start && day >= c.start){ c.end = day; c.pickEnd = false; }
        else if(!c.start || c.end || day < c.start){ c.start = day; c.end = null; c.pickEnd = true; }
        else { c.end = day; c.pickEnd = false; }
      }
      redraw();
    },
    onOk:() => {
      const end = c.end || c.start;
      if(!c.start) c.err = 'Vui lòng chọn Từ ngày.';
      else if(c.start > end) c.err = 'Từ ngày không được lớn hơn Đến ngày.';
      else if(end > today) c.err = 'Không chọn ngày trong tương lai.';
      else if(daysIncl(c.start, end) > LL_MAX_DAYS) c.err = `Khoảng thời gian tối đa ${LL_MAX_DAYS} ngày.`;
      if(c.err){ redraw(); return; }
      st.preset = 'custom'; st.from = c.start.getTime(); st.to = end.getTime();
      closeSheet(); refresh();
    }});
}
function llOrgSheet(r){
  const st = llState(r);
  let sub = st.orgSub;
  const pool = [...D.orgs.values()].filter(o => o.total > 0);
  const listHtml = q => {
    const k = norm(q).trim();
    const l = pool.filter(o => (!st.axis || o.axis === st.axis) && (!k || o._k.includes(k))).slice(0, 60);
    return l.length ? group(l.map(o => { const p = ancestors(o).slice(-1)[0]; return row({a:'pick', d:{v:'o:' + o.id}, cls:String(st.orgId) === String(o.id) ? 'picked' : '', lead:axisIcon(o.axis), title:esc(orgDisplay(o)), sub:esc((p ? p.name + ' · ' : '') + fmt(o.total) + ' người')}); }).join('')) : emptyBox('Không có đơn vị phù hợp');
  };
  const segHtml = () => `<div class="seg">${[['1', 'Gồm đơn vị trực thuộc'], ['0', 'Chỉ đơn vị này']].map(([k, l]) => `<button type="button" class="${(sub ? '1' : '0') === k ? 'on' : ''}" data-a="pick" data-v="s:${k}">${l}</button>`).join('')}</div>`;
  openSheet({title:'Lọc theo đơn vị công tác', desc:st.axis ? `Đơn vị thuộc trục ${AX[st.axis].name}` : '', full:true,
    body:`<div class="search-row"><label class="searchbar">${ic('search')}<input data-in="sheetQ" placeholder="Tìm đơn vị (không cần dấu)" autocomplete="off"></label></div><div data-part="seg">${segHtml()}</div><div class="section" data-part="pl">${listHtml('')}</div>`,
    foot:st.orgId ? `<button type="button" class="btn" data-a="pick" data-v="clear">Bỏ lọc đơn vị</button>` : '',
    onInput:(v, sh) => { sh.querySelector('[data-part=pl]').innerHTML = listHtml(v); },
    onPick:(v, t) => {
      if(v.startsWith('s:')){ sub = v === 's:1'; t.closest('.sheet').querySelector('[data-part=seg]').innerHTML = segHtml(); if(st.orgId){ st.orgSub = sub; refresh(); } return; }
      if(v === 'clear') st.orgId = null;
      else { st.orgId = Number(v.slice(2)); st.orgSub = sub; }
      closeSheet(); refresh();
    }});
}
/* Xuất TOÀN BỘ kết quả theo bộ lọc (không chỉ phần đã tải trên màn hình), làm từng khúc để máy không bị đứng. */
let llExporting = false;
function llLoadExcel(){
  if(window.ExcelJS) return Promise.resolve(window.ExcelJS);
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
    s.onload = () => window.ExcelJS ? res(window.ExcelJS) : rej(new Error('ExcelJS'));
    s.onerror = rej; document.head.appendChild(s);
  });
}
async function llExport(r){
  if(llExporting) return;
  if(!r._rows){ toast(r._err ? 'Chưa tải được dữ liệu để xuất' : 'Đang tải dữ liệu, thử lại sau giây lát'); return; }
  const list = llFiltered(r).slice(), st = llState(r);
  if(!list.length){ toast('Không có dữ liệu để xuất'); return; }
  const o = st.orgId ? org(st.orgId) : null, uu = st.uid ? LL.userById(st.uid) : null;
  const filters = [st.status !== 'all' ? 'Trạng thái: ' + LL_STATUS.find(s => s[0] === st.status)[1] : null, st.axis ? 'Trục: ' + AX[st.axis].name : null,
    o ? `Đơn vị: ${orgDisplay(o)}${st.orgSub ? ' (gồm đơn vị trực thuộc)' : ''}` : null, uu ? 'Người dùng: ' + uu.name : null, st.q.trim() ? `Từ khóa: "${st.q.trim()}"` : null].filter(Boolean);
  llExporting = true;
  toast(`Đang chuẩn bị tệp Excel ${fmt(list.length)} dòng…`);
  try{
    const X = await llLoadExcel();
    const wb = new X.Workbook(), ws = wb.addWorksheet('Nhật ký đăng nhập');
    ws.addRow(['Nhật ký đăng nhập hệ thống IOC — toàn bộ tài khoản']).font = {bold:true, size:13};
    ws.addRow([`Từ ngày ${fmtDate(st.from)} đến ngày ${fmtDate(st.to)}${filters.length ? ' · ' + filters.join(' · ') : ''}`]);
    ws.addRow(['SỐ LIỆU MÔ PHỎNG (BẢN DEMO) — KHÔNG PHẢI SỐ LIỆU THẬT']).font = {italic:true, color:{argb:'FFC00000'}};
    ws.addRow([]);
    ws.addRow(['STT','Thời gian','Họ tên','Tên đăng nhập','Trục','Đơn vị công tác','Địa chỉ IP','Trạng thái','Ghi chú']).font = {bold:true};
    for(let i = 0; i < list.length; i++){
      const e = list[i], u = LL.userOf(e);
      ws.addRow([i + 1, `${fmtDate(e.ts)} ${hms(e.ts)}`, u.name, u.username, LL.AXIS_NAME[u.axis] || '', u.orgName, e.ip, e.ok ? 'Thành công' : 'Thất bại', e.ok ? (LL.isCurrent(e) ? 'Phiên hiện tại' : '') : LL.reason(e.reason)]);
      if((i + 1) % 4000 === 0){ toast(`Đang xuất Excel… ${Math.round((i + 1) / list.length * 90)}%`); await new Promise(res => setTimeout(res, 0)); }
    }
    ws.columns = [{width:8},{width:21},{width:26},{width:26},{width:11},{width:44},{width:16},{width:13},{width:20}];
    const buf = await wb.xlsx.writeBuffer();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
    a.download = `nhat-ky-dang-nhap-toan-he-thong-${isoD(new Date(st.from))}-${isoD(new Date(st.to))}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast(`Đã xuất ${fmt(list.length)} lượt đăng nhập ra Excel`);
  }catch(err){ toast('Không xuất được tệp Excel. Vui lòng thử lại.'); }
  finally{ llExporting = false; }
}

/* ---------- Tìm kiếm toàn cục ---------- */
const SETTING_ITEMS = [
  {label:'Phân nhóm đơn vị', v:'grouping', icon:'layers'}, {label:'Cây thư mục tùy biến', v:'tree', icon:'tree'},
  {label:'Bảng chỉ tiêu theo đơn vị', v:'indicators', icon:'chart'}, {label:'Lĩnh vực mặc định', v:'fields', icon:'tag'},
  {label:'Vai trò mẫu', v:'roles', icon:'role'}, {label:'Nhật ký thao tác', v:'activity', icon:'clock'},
  ...(LL && LL.canView() ? [{label:'Nhật ký đăng nhập', v:'loginLog', icon:'login'}] : [])
];
VIEWS.search = r => {
  const f = r.state || (r.state = {q:''});
  return topbar({title:'Tìm kiếm', always:true}) + `
    <div class="search-row" style="margin-top:4px"><label class="searchbar ${f.q ? 'has' : ''}">${ic('search')}<input data-in="globalQ" value="${esc(f.q)}" placeholder="Người dùng, đơn vị, cấu hình" enterkeyhint="search"><button type="button" class="clear" data-a="clearQ">${ic('x')}</button></label></div>
    <div data-part="results">${searchResults(f.q)}</div>`;
};
AFTER.search = el => { const i = el.querySelector('input'); if(i) setTimeout(() => i.focus(), 320); };
function searchResults(qRaw){
  const q = norm(qRaw).trim();
  if(!q) return `<div class="hint" style="padding-top:8px">Gõ tên người, tên đăng nhập, email hoặc tên đơn vị. Không cần gõ dấu.</div>` +
    section('Gợi ý', group(SETTING_ITEMS.map(s => row({a:'searchSetting', d:{v:s.v}, lead:`<span class="lead-ic sm">${ic(s.icon)}</span>`, sm:true, title:s.label, chev:true})).join('')));
  const us = D.users.filter(u => u._k.includes(q));
  const os = [...D.orgs.values()].filter(o => o._k.includes(q));
  const ss = SETTING_ITEMS.filter(s => norm(s.label).includes(q));
  if(!us.length && !os.length && !ss.length) return emptyBox(`Không tìm thấy "${qRaw}"`);
  return (us.length ? section(`Người dùng · ${fmt(us.length)}`, group(us.slice(0, 5).map(u => userRow(u)).join('')), us.length > 5 ? `<button type="button" class="link" data-a="searchAllUsers">Xem tất cả</button>` : '') : '') +
    (os.length ? section(`Đơn vị · ${fmt(os.length)}`, group(os.slice(0, 5).map(o => orgRow(o)).join('')), os.length > 5 ? `<button type="button" class="link" data-a="searchAllOrgs">Xem tất cả</button>` : '') : '') +
    (ss.length ? section('Cấu hình', group(ss.map(s => row({a:'searchSetting', d:{v:s.v}, lead:`<span class="lead-ic sm">${ic(s.icon)}</span>`, sm:true, title:s.label, chev:true})).join(''))) : '');
}

/* =====================================================================
   BẢNG TRƯỢT (BOTTOM SHEET)
   ===================================================================== */
const sheets = [];
function openSheet(o){
  const el = document.createElement('div');
  el.className = 'sheet' + (o.full ? ' full' : '');
  el.innerHTML = `<div class="grab"><i></i></div><div class="sh-head"><h3>${esc(o.title)}</h3><button type="button" class="tb-btn" data-a="closeSheet" aria-label="Đóng">${ic('x')}</button></div>${o.desc ? `<div class="sh-desc">${o.desc}</div>` : ''}<div class="sh-body">${o.body || ''}</div>${o.foot ? `<div class="sh-foot">${o.foot}</div>` : ''}`;
  $('#sheets').appendChild(el); sheets.push(el);
  $('#sbd').classList.add('show');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  Object.assign(el, {_pick:o.onPick, _ok:o.onOk, _in:o.onInput});
  dragToClose(el);
  if(o.mount) o.mount(el);
  document.documentElement.classList.add('sheet-open');
  syncHistory();
  return el;
}
function closeSheet(){
  const el = sheets.pop(); if(!el) return;
  el.classList.remove('show'); setTimeout(() => el.remove(), 320);
  if(!sheets.length){ $('#sbd').classList.remove('show'); document.documentElement.classList.remove('sheet-open'); }
  syncHistory();
}
/* Bàn phím ảo: iPhone/Android không co trang khi bàn phím hiện, nên đo phần bị che (--kb) để đẩy bảng
   trượt lên trên bàn phím, rồi cuộn ô đang nhập vào giữa vùng nhìn thấy. */
if(window.visualViewport){
  const vv = window.visualViewport;
  const upd = () => {
    const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    document.documentElement.style.setProperty('--kb', kb + 'px');
    document.documentElement.classList.toggle('kb-open', kb > 80);
  };
  vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd);
}
document.addEventListener('focusin', e => {
  const t = e.target;
  if(t.matches && t.matches('.sheet input, .sheet textarea')) setTimeout(() => t.scrollIntoView({block:'nearest'}), 320);
});
function closeAllSheets(){ while(sheets.length) closeSheet(); }
function dragToClose(el){
  const grab = el.querySelector('.grab'); let y0 = null, dy = 0;
  grab.addEventListener('pointerdown', e => { y0 = e.clientY; dy = 0; el.style.transition = 'none'; grab.setPointerCapture(e.pointerId); });
  grab.addEventListener('pointermove', e => { if(y0 == null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; });
  const end = () => { if(y0 == null) return; y0 = null; el.style.transition = ''; el.style.transform = ''; if(dy > 110) closeSheet(); };
  grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
}
function actionSheet(title, items, desc){
  openSheet({title, desc, body:section('', group(items.map((it, i) => row({a:'pick', d:{v:i}, cls:it.kind === 'bad' ? 'danger' : '', lead:it.icon ? `<span class="lead-ic sm ${it.kind === 'bad' ? 'bad' : ''}">${ic(it.icon)}</span>` : '', sm:true, title:esc(it.label), sub:it.sub ? esc(it.sub) : ''})).join(''))),
    onPick:i => { closeSheet(); setTimeout(() => items[i].fn(), 60); }});
}
function optionSheet(title, desc, options, current, onPick){
  openSheet({title, desc, body:section('', group(options.map(op => row({a:'pick', d:{v:op.v}, cls:'opt' + (op.v === current ? ' on' : ''), title:esc(op.label), sub:op.sub ? esc(op.sub) : '', trail:'<span class="radio"></span>', inline:true})).join(''))),
    onPick:v => { closeSheet(); onPick(v); }});
}
function confirmSheet(title, desc, okLabel, onOk, bad){
  openSheet({title, desc, foot:`<button type="button" class="btn" data-a="closeSheet">Hủy</button><button type="button" class="btn ${bad ? 'bad' : 'pri'}" data-a="ok">${esc(okLabel)}</button>`, onOk:() => { closeSheet(); onOk(); }});
}
function orgPicker(title, filterFn, onPick){
  const pool = [...D.orgs.values()].filter(filterFn || (() => true));
  const listHtml = q => { const k = norm(q).trim(); const l = pool.filter(o => !k || o._k.includes(k)).slice(0, 60); return l.length ? group(l.map(o => row({a:'pick', d:{v:o.id}, lead:axisIcon(o.axis), title:esc(o.name), sub:esc((ancestors(o).slice(-1)[0] || {name:''}).name)})).join('')) : emptyBox('Không có đơn vị phù hợp'); };
  openSheet({title, full:true,
    body:`<div class="search-row"><label class="searchbar">${ic('search')}<input data-in="sheetQ" placeholder="Tìm đơn vị (không cần dấu)"></label></div><div class="section" data-part="pl">${listHtml('')}</div>`,
    onInput:(v, sh) => { sh.querySelector('[data-part=pl]').innerHTML = listHtml(v); },
    onPick:id => { closeSheet(); onPick(org(id)); }});
}
function formSheet(o){
  openSheet({title:o.title, desc:o.desc, full:o.full, body:`<div class="form">${o.fields.map(f => f.pick ?
      `<div class="fld"><label>${esc(f.label)}</label><button type="button" class="pick" data-a="formPick" data-k="${f.k}" data-val="${esc(f.value || '')}">${f.display ? esc(f.display) : `<span class="ph">${esc(f.ph || 'Chọn')}</span>`}${ic('chevR', 'chev')}</button></div>` :
      `<div class="fld"><label for="f-${f.k}">${esc(f.label)}</label><input id="f-${f.k}" name="${f.k}" value="${esc(f.value || '')}" placeholder="${esc(f.ph || '')}" ${f.type ? `type="${f.type}"` : ''}></div>`).join('')}</div>${o.hint ? `<div class="hint">${o.hint}</div>` : ''}${o.extra || ''}`,
    foot:`<button type="button" class="btn" data-a="closeSheet">Hủy</button><button type="button" class="btn pri" data-a="ok">${esc(o.ok || 'Lưu')}</button>`,
    onOk:() => {
      const sh = sheets[sheets.length - 1], vals = {}; let bad = false;
      o.fields.forEach(f => {
        const v = f.pick ? sh.querySelector(`[data-k="${f.k}"]`).dataset.val : sh.querySelector(`[name="${f.k}"]`).value.trim();
        vals[f.k] = v;
        const fld = (f.pick ? sh.querySelector(`[data-k="${f.k}"]`) : sh.querySelector(`[name="${f.k}"]`)).closest('.fld');
        const miss = f.req && !v; fld.classList.toggle('err', miss); if(miss) bad = true;
      });
      if(bad){ toast('Vui lòng điền các trường bắt buộc'); return; }
      closeSheet(); o.onOk(vals);
    }, mount:o.mount});
}

/* ---------- Thông báo nổi ---------- */
let toastTimer;
function toast(msg, undo){
  const t = $('#toast');
  t.querySelector('.tx').textContent = msg;
  const b = t.querySelector('button');
  b.hidden = !undo; b.onclick = () => { t.classList.remove('show'); undo(); };
  t.style.bottom = $('#floatHost').children.length ? 'calc(var(--tabbar-h) + 76px)' : '';
  t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), undo ? 5000 : 2600);
}

/* ---------- Thanh nổi: chọn nhiều / lưu thay đổi ---------- */
function renderFloat(){
  const host = $('#floatHost'), r = curRoute();
  if(S.select){
    host.innerHTML = `<div class="floatbar"><button type="button" class="icon" data-a="exitSelect" aria-label="Thoát chọn">${ic('x')}</button><span class="lbl">${fmt(S.select.size)} đã chọn<small>${S.select.size ? 'Bấm Thao tác để áp dụng' : 'Chạm vào người cần chọn'}</small></span><button type="button" class="pri" data-a="bulkActions" ${S.select.size ? '' : 'disabled style="opacity:.5"'}>Thao tác</button></div>`;
    return;
  }
  if(r.v === 'user'){
    const u = userOf(r.p.id), ch = u ? draftChanges(u) : [];
    if(ch.length){
      host.innerHTML = `<div class="floatbar"><span class="lbl">${ch.length} thay đổi chưa lưu<small>Quyền của ${esc(u.name)}</small></span><button type="button" class="ghost" data-a="discardDraft" data-id="${u.id}">Hủy</button><button type="button" class="pri" data-a="saveDraft" data-id="${u.id}">Lưu</button></div>`;
      return;
    }
  }
  host.innerHTML = '';
}
function enterSelect(firstId){
  if(curRoute().v !== 'users') return;
  S.select = new Set(); if(firstId != null) S.select.add(String(firstId));
  refresh();
}
function exitSelect(silent){ if(!S.select) return; S.select = null; if(!silent) refresh(); }

/* =====================================================================
   HÀNH ĐỘNG
   ===================================================================== */
const view = () => $('#views .view.cur');
function setLock(u, v){ u.locked = v; log(`${v ? 'Khóa' : 'Mở khóa'} tài khoản ${u.name}`, v ? 'lock' : 'unlock', {uid:u.id}); }
function setAdmin(u, v){ u.admin = v; log(`${v ? 'Cấp' : 'Gỡ'} quyền quản trị: ${u.name}`, v ? 'shield' : 'shieldOff', {uid:u.id}); }

const A = {
  back: pop,
  tab: d => switchTab(d.t),
  push: d => { const p = {}; if(d.id) p.id = d.id; if(d.org) p.org = d.org, p.orgId = d.org; push(d.v, p); },
  openUser: d => push('user', {id:d.id}),
  openOrg: d => push('org', {id:Number(d.id)}),
  openOrgTab: d => goTab('orgs', {v:'org', p:{id:Number(d.id)}}),
  goUsers: d => { S.stacks.users = [{v:'users', p:{chip:d.chip}}]; goTab('users'); },
  goOrgs: d => { S.stacks.orgs = [{v:'orgs', p:{chip:d.chip}}]; goTab('orgs'); },
  openSearch: () => push('search'),
  searchSetting: d => { S.stacks.settings = [S.stacks.settings[0], {v:d.v, p:{}}]; S.tab = 'settings'; render('fade'); },
  searchAllUsers: () => { const q = curRoute().state.q; S.stacks.users = [{v:'users', p:{q}}]; goTab('users'); },
  searchAllOrgs: () => { const q = curRoute().state.q; S.stacks.orgs = [{v:'orgs', p:{}, state:{chip:'all', q}}]; goTab('orgs'); },
  clearQ: (d, t) => { const i = t.parentElement.querySelector('input'); i.value = ''; i.dispatchEvent(new Event('input', {bubbles:true})); i.focus(); },

  userChip: d => { const r = curRoute(); userState(r).chip = d.c; updateUserList(view(), r); },
  orgChip: d => { const r = curRoute(); orgState(r).chip = d.c; updateOrgList(view(), r); },
  groupChip: d => { curRoute().state.chip = d.c; curRoute().loaded = 40; refresh(); },
  indChip: d => { curRoute().state.chip = d.c; refresh(); },
  userFilter: () => {
    const r = curRoute(), f = userState(r);
    const body = () => section('Trục', `<div class="chips" style="padding:0;flex-wrap:wrap">${AX_ORDER.map(ax => `<button type="button" class="chip ${f.axes.includes(ax) ? 'on' : ''}" data-a="pick" data-v="ax:${ax}">${axisLabel(ax)}</button>`).join('')}</div>`) +
      section('Sắp xếp', group(SORTS.map(s => row({a:'pick', d:{v:'sort:' + s.id}, cls:'opt' + (f.sort === s.id ? ' on' : ''), title:s.label, trail:'<span class="radio"></span>', inline:true})).join('')));
    openSheet({title:'Bộ lọc', body:body(), foot:`<button type="button" class="btn" data-a="pick" data-v="reset">Đặt lại</button><button type="button" class="btn pri" data-a="closeSheet">Xem ${fmt(r._list.length)} kết quả</button>`,
      onPick:v => {
        if(v === 'reset'){ f.axes = []; f.sort = 'name'; }
        else if(v.startsWith('ax:')){ const ax = v.slice(3); f.axes = f.axes.includes(ax) ? f.axes.filter(x => x !== ax) : [...f.axes, ax]; }
        else f.sort = v.slice(5);
        refresh();
        const sh = sheets[sheets.length - 1];
        sh.querySelector('.sh-body').innerHTML = body();
        sh.querySelector('.sh-foot .pri').textContent = `Xem ${fmt(curRoute()._list.length)} kết quả`;
      }});
  },

  enterSelect: () => enterSelect(),
  exitSelect: () => exitSelect(),
  toggleSel: (d, t) => {
    const id = String(d.id);
    S.select.has(id) ? S.select.delete(id) : S.select.add(id);
    t.querySelector('.check').classList.toggle('on', S.select.has(id));
    view().querySelector('[data-part=selbanner]').innerHTML = selBanner(curRoute());
    renderFloat();
  },
  selectAll: () => { curRoute()._list.forEach(u => S.select.add(String(u.id))); refresh(); },
  bulkActions: () => {
    const sel = [...S.select].map(userOf).filter(Boolean);
    const run = (label, fn, field) => {
      const before = sel.map(u => [u, u[field]]);
      sel.forEach(fn);
      log(`${label} ${fmt(sel.length)} tài khoản (thao tác hàng loạt)`, field === 'locked' ? 'lock' : 'shield');
      exitSelect();
      toast(`${label} ${fmt(sel.length)} tài khoản`, () => { before.forEach(([u, v]) => u[field] = v); refresh(); toast('Đã hoàn tác'); });
    };
    actionSheet(`${fmt(sel.length)} tài khoản đã chọn`, [
      {label:'Khóa tài khoản', icon:'lock', fn:() => confirmSheet(`Khóa ${fmt(sel.length)} tài khoản?`, 'Người bị khóa sẽ không đăng nhập được cho tới khi mở lại.', 'Khóa', () => run('Đã khóa', u => u.locked = true, 'locked'), true)},
      {label:'Mở khóa tài khoản', icon:'unlock', fn:() => run('Đã mở khóa', u => u.locked = false, 'locked')},
      {label:'Cấp quyền quản trị', icon:'shield', fn:() => run('Đã cấp quyền quản trị cho', u => u.admin = true, 'admin')},
      {label:'Gỡ quyền quản trị', icon:'shieldOff', kind:'bad', fn:() => run('Đã gỡ quyền quản trị của', u => u.admin = false, 'admin')}
    ]);
  },

  userTab: d => { curRoute().tab = d.t; const top = getScroll(); curRoute().scroll = Math.min(top, 330); refresh(); },
  toggleLock: d => {
    const u = userOf(d.id);
    const doIt = () => { setLock(u, !u.locked); refresh(); toast(u.locked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', () => { setLock(u, !u.locked); refresh(); }); };
    if(u.locked) doIt(); else confirmSheet(`Khóa tài khoản ${u.name}?`, 'Người này sẽ không đăng nhập được cho tới khi mở lại.', 'Khóa tài khoản', doIt, true);
  },
  toggleAdmin: d => {
    const u = userOf(d.id);
    if(u.admin) confirmSheet('Gỡ quyền quản trị?', `${esc(u.name)} sẽ không còn quản lý tài khoản và đơn vị.`, 'Gỡ quyền', () => { setAdmin(u, false); refresh(); toast('Đã gỡ quyền quản trị', () => { setAdmin(u, true); refresh(); }); }, true);
    else { setAdmin(u, true); refresh(); toast('Đã cấp quyền quản trị', () => { setAdmin(u, false); refresh(); }); }
  },
  editUser: d => {
    const u = userOf(d.id);
    formSheet({title:'Sửa thông tin', fields:[{k:'name', label:'Họ tên', value:u.name, req:true}, {k:'email', label:'Email', value:u.email, type:'email'}, {k:'job', label:'Chức vụ', value:u.job}],
      hint:'Thông tin gốc lấy từ hồ sơ cán bộ, công chức. Sửa ở đây chỉ đổi cách hiển thị trên IOC.',
      onOk:v => { Object.assign(u, v); u._k = norm(u.name + ' ' + u.username + ' ' + u.email); log(`Sửa thông tin ${u.name}`, 'edit', {uid:u.id}); refresh(); toast('Đã lưu thông tin'); }});
  },
  resetPerm: d => {
    const u = userOf(d.id);
    confirmSheet('Đặt lại quyền về mặc định?', 'Vai trò từng phân hệ và phạm vi dữ liệu sẽ tính lại theo chức vụ và đơn vị. Thay đổi chưa lưu cũng bị bỏ.', 'Đặt lại', () => {
      delete S.perms[u.id]; delete S.scopes[u.id]; delete S.drafts[u.id];
      log(`Đặt lại quyền của ${u.name} về mặc định`, 'reset', {uid:u.id}); refresh(); toast('Đã đặt lại quyền');
    }, true);
  },
  userMore: d => {
    const u = userOf(d.id), o = org(u.orgId);
    actionSheet(u.name, [
      {label:'Sửa thông tin', icon:'edit', fn:() => A.editUser(d)},
      {label:'Chuyển đơn vị', icon:'move', fn:() => orgPicker('Chuyển sang đơn vị', null, no => {
        const old = org(u.orgId); old.userIds = old.userIds.filter(x => x !== u.id); no.userIds.push(u.id);
        for(let p = old; p; p = org(p.parentId)) p.total--;
        for(let p = no; p; p = org(p.parentId)) p.total++;
        u.orgId = no.id; u.axis = no.axis; descCache.clear();
        log(`Chuyển ${u.name} sang ${no.name}`, 'move', {uid:u.id}); refresh(); toast('Đã chuyển đơn vị');
      })},
      o ? {label:'Mở hồ sơ đơn vị', icon:'building', fn:() => push('org', {id:o.id})} : null,
      {label:'Gửi email kích hoạt', icon:'mail', fn:() => toast(`Đã gửi email tới ${u.email || 'người dùng'} (demo)`)},
      {label:'Đặt lại quyền về mặc định', icon:'reset', kind:'bad', fn:() => A.resetPerm(d)}
    ].filter(Boolean));
  },
  pickRole: d => {
    const u = userOf(d.id), m = MODULES.find(x => x.id === d.m);
    optionSheet(m.name, `Vai trò của ${esc(u.name)} trong phân hệ này`, m.roles.map(rn => ({v:rn, label:rn, sub:ROLE_DESC[rn]})), roleOf(u, m), v => { setDraft(u, m.id, v); refresh(); });
  },
  groupRole: d => {
    const u = userOf(d.id), g = MODULE_GROUPS[d.g];
    const roles = [...new Set(g.items.flatMap(m => m.roles))];
    optionSheet(`Áp cho nhóm ${g.name}`, `Áp một vai trò cho ${g.items.length} phân hệ. Phân hệ không có vai trò này sẽ giữ nguyên.`, roles.map(rn => ({v:rn, label:rn, sub:`${g.items.filter(m => m.roles.includes(rn)).length}/${g.items.length} phân hệ · ${ROLE_DESC[rn]}`})), null, v => {
      let n = 0; g.items.forEach(m => { if(m.roles.includes(v)){ setDraft(u, m.id, v); n++; } });
      refresh(); toast(`Đã áp "${v}" cho ${n}/${g.items.length} phân hệ — nhớ bấm Lưu`);
    });
  },
  pickScope: d => {
    const u = userOf(d.id);
    optionSheet('Phạm vi dữ liệu', `Dữ liệu ${esc(u.name)} được xem trong mọi phân hệ`, SCOPES.map(s => ({v:s.id, label:scopeText(u, s.id), sub:s.sub})), scopeOf(u), v => { setDraft(u, '__scope', v); refresh(); });
  },
  previewPerm: d => {
    const u = userOf(d.id);
    const can = MODULES.filter(m => !['Chỉ xem','Không cấp quyền'].includes(roleOf(u, m)));
    const view_ = MODULES.filter(m => roleOf(u, m) === 'Chỉ xem');
    const none = MODULES.filter(m => roleOf(u, m) === 'Không cấp quyền');
    const adminMods = ['source','audit','orgadmin','useradmin'];
    const warn = can.some(m => adminMods.includes(m.id)) && !u.admin;
    const e = (icon, cls, title, text) => `<div class="e"><span class="lead-ic sm ${cls}">${ic(icon)}</span><div><b>${title}</b><span>${text}</span></div></div>`;
    openSheet({title:'Quyền hiệu lực', desc:`${esc(u.name)} — tính cả thay đổi chưa lưu`, body:`<div class="eff">
      ${e('eye', '', 'Phạm vi dữ liệu', esc(scopeText(u, scopeOf(u))))}
      ${can.length ? e('check', 'good', `Được thao tác · ${can.length} phân hệ`, can.map(m => `${esc(m.name)}: ${esc(ROLE_DESC[roleOf(u, m)].toLowerCase())}`).join('<br>')) : ''}
      ${view_.length ? e('eye', 'mute', `Chỉ xem · ${view_.length} phân hệ`, view_.map(m => esc(m.name)).join(', ')) : ''}
      ${none.length ? e('x', 'mute', `Không truy cập · ${none.length} phân hệ`, none.map(m => esc(m.name)).join(', ')) : ''}
      ${warn ? e('alert', 'warn', 'Cần lưu ý', 'Đang cấp quyền nhóm quản trị cho người chưa phải quản trị viên.') : ''}
    </div>`});
  },
  discardDraft: d => { const u = userOf(d.id); const keep = S.drafts[u.id]; delete S.drafts[u.id]; refresh(); toast('Đã bỏ thay đổi', () => { S.drafts[u.id] = keep; refresh(); }); },
  saveDraft: d => {
    const u = userOf(d.id), ch = draftChanges(u);
    openSheet({title:'Lưu thay đổi quyền?', desc:`${ch.length} thay đổi cho ${esc(u.name)}`,
      body:section('', group(ch.map(c => row({tag:'div', title:esc(c.label), sub:`${esc(c.from)} → <b style="color:var(--text)">${esc(c.to)}</b>`, wrap:true})).join(''))) + `<div class="hint">Thay đổi được ghi vào nhật ký. Người dùng nhận quyền mới ở lần đăng nhập kế tiếp.</div>`,
      foot:`<button type="button" class="btn" data-a="closeSheet">Xem lại</button><button type="button" class="btn pri" data-a="ok">Lưu ${ch.length} thay đổi</button>`,
      onOk:() => {
        const dr = S.drafts[u.id] || {};
        S.perms[u.id] = S.perms[u.id] || {};
        Object.entries(dr).forEach(([k, v]) => { if(k === '__scope') S.scopes[u.id] = v; else S.perms[u.id][k] = v; });
        delete S.drafts[u.id];
        log(`Cập nhật ${ch.length} quyền của ${u.name}`, 'role', {uid:u.id});
        closeSheet(); refresh(); toast('Đã lưu thay đổi quyền');
      }});
  },

  createUser: d => {
    let pre = d.org ? org(d.org) : null;
    formSheet({title:'Tạo tài khoản', full:true, ok:'Tạo tài khoản',
      fields:[{k:'name', label:'Họ tên *', ph:'Nguyễn Văn A', req:true}, {k:'email', label:'Email công vụ *', ph:'ten@hanoi.gov.vn', type:'email', req:true},
        {k:'org', label:'Đơn vị công tác *', pick:true, value:pre ? pre.id : '', display:pre ? pre.name : '', ph:'Chọn đơn vị', req:true}, {k:'job', label:'Chức vụ', ph:'Chuyên viên'}],
      hint:'Tài khoản mới dùng đăng nhập một lần theo email. Quyền mặc định tính theo chức vụ, sửa được sau khi tạo.',
      onOk:v => {
        const o = org(v.org);
        const u = addUser({egov_user_id:'m' + Date.now(), name:v.name, label:v.email.split('@')[0], email:v.email, position:v.job, job_title:v.job}, o);
        D.users.pop(); D.users.unshift(u); u.createdAt = Date.now(); u.lastLoginAt = null; u.locked = false;
        let p = o; while(p){ p.total++; p = org(p.parentId); }
        log(`Tạo tài khoản ${u.name}`, 'userPlus', {uid:u.id});
        S.stacks.users = [S.stacks.users[0], {v:'user', p:{id:u.id}}]; goTab('users');
        toast('Đã tạo tài khoản');
      }});
  },
  createOrg: d => {
    const par = org(d.parent || D.rootId);
    formSheet({title:'Tạo đơn vị', ok:'Tạo đơn vị',
      fields:[{k:'name', label:'Tên đơn vị *', ph:'VD: Phòng Chuyển đổi số', req:true}, {k:'parent', label:'Đơn vị cấp trên *', pick:true, value:par.id, display:par.name, req:true}],
      hint:'Trục và nhóm tự tính theo đơn vị cấp trên, sửa được trong hồ sơ đơn vị.',
      onOk:v => {
        const p = org(v.parent), id = 900000 + D.orgs.size;
        const o = {id, name:v.name, level:p.level + 1, parentId:p.id, axis:inferAxis(v.name) || p.axis, children:[], userIds:[], total:0, _k:norm(v.name)};
        D.orgs.set(id, o); p.children.unshift(id); descCache.clear();
        log(`Tạo đơn vị ${o.name} thuộc ${p.name}`, 'building', {oid:id});
        S.stacks.orgs = [S.stacks.orgs[0], {v:'org', p:{id}}]; goTab('orgs'); toast('Đã tạo đơn vị');
      }});
  },
  formPick: (d, t) => {
    orgPicker('Chọn đơn vị', null, o => { t.dataset.val = o.id; t.innerHTML = esc(o.name) + ic('chevR', 'chev'); t.closest('.fld').classList.remove('err'); });
  },
  editOrg: d => {
    const o = org(d.id), e = S.orgEdits[o.id] || {};
    formSheet({title:'Sửa thông tin đơn vị', fields:[{k:'name', label:'Tên hiển thị trên IOC', value:e.name || o.name, req:true}, {k:'short', label:'Tên viết tắt', value:e.short || ''}, {k:'email', label:'Email công vụ', value:e.email || '', type:'email'}],
      hint:'Không đổi hồ sơ gốc trên hệ thống cán bộ, công chức — chỉ đổi cách hiển thị trên IOC.',
      onOk:v => { S.orgEdits[o.id] = v; log(`Sửa thông tin đơn vị ${v.name}`, 'edit', {oid:o.id}); refresh(); toast('Đã lưu'); }});
  },
  orgMore: d => {
    const o = org(d.id);
    actionSheet(orgDisplay(o), [
      {label:'Sửa thông tin', icon:'edit', fn:() => A.editOrg(d)},
      {label:'Thêm đơn vị con', icon:'plus', fn:() => A.createOrg({parent:o.id})},
      {label:'Thêm người vào đơn vị', icon:'userPlus', fn:() => A.createUser({org:o.id})},
      {label:'Xem toàn bộ thành viên', icon:'users', fn:() => push('users', {orgId:o.id})},
      {label:'Đồng bộ lại đơn vị này', icon:'sync', fn:() => { log(`Đồng bộ lại ${o.name}`, 'sync', {oid:o.id}); toast('Đã đồng bộ lại đơn vị'); }}
    ]);
  },
  pickGroup: d => {
    const o = org(d.id), auto = autoGroup(o);
    optionSheet('Phân nhóm', esc(o.name), [{v:'', label:`Tự động — ${auto}`, sub:'Tính theo vị trí trong cây tổ chức'}, ...GROUPS.map(g => ({v:g, label:g, sub:'Gán tay, đồng bộ không ghi đè'}))], S.groupOverride[o.id] || '', v => {
      if(v) S.groupOverride[o.id] = v; else delete S.groupOverride[o.id];
      log(v ? `Gán nhóm "${v}" cho ${o.name}` : `Đưa ${o.name} về nhóm tự động`, 'layers', {oid:o.id});
      refresh(); toast(v ? `Đã gán nhóm "${v}"` : 'Đã đưa về nhóm tự động');
    });
  },
  pickMapping: d => {
    const o = org(d.id), mp = S.mapping[o.id] || {axis:o.axis || '', area:wardOf(o) || ''};
    let ax = mp.axis;
    const segHtml = () => `<div class="seg">${[['', 'Không'], ...AX_ORDER.map(a => [a, AX[a].name])].map(([k, l]) => `<button type="button" class="${ax === k ? 'on' : ''}" data-a="pick" data-v="${k}">${l}</button>`).join('')}</div>`;
    openSheet({title:'Trục / địa bàn', desc:esc(o.name) + ' — sửa tay khi đơn vị chưa nhận đúng trục hoặc địa bàn.',
      body:`<div class="section-h" style="margin:0 20px"><h3>Trục</h3></div><div data-part="seg">${segHtml()}</div><div class="form"><div class="fld"><label for="f-area">Địa bàn</label><input id="f-area" name="area" value="${esc(mp.area)}" placeholder="Để trống nếu là toàn Thành phố"></div></div>`,
      foot:`<button type="button" class="btn" data-a="closeSheet">Hủy</button><button type="button" class="btn pri" data-a="ok">Lưu</button>`,
      onPick:(v, t) => { ax = v; t.closest('.sheet').querySelector('[data-part=seg]').innerHTML = segHtml(); },
      onOk:() => { const area = sheets[sheets.length - 1].querySelector('[name=area]').value.trim(); S.mapping[o.id] = {axis:ax, area}; log(`Sửa trục/địa bàn của ${o.name}`, 'pin', {oid:o.id}); closeSheet(); refresh(); toast('Đã lưu trục / địa bàn'); }});
  },
  pickOrgScope: d => {
    const o = org(d.id);
    optionSheet('Phạm vi dữ liệu mặc định', `Áp cho người mới của ${esc(o.name)}. Từng người vẫn chỉnh riêng được.`, SCOPES.slice(0, 3).map(s => ({v:s.id, label:s.label, sub:s.sub})), S.orgScope[o.id] || (wardOf(o) ? 'ward' : (o.level <= 2 ? 'city' : 'org')), v => { S.orgScope[o.id] = v; log(`Đổi phạm vi mặc định của ${o.name}`, 'eye', {oid:o.id}); refresh(); toast('Đã lưu phạm vi mặc định'); });
  },
  editIndicator: d => {
    const o = org(d.id); const ind = indicatorOf(o);
    let active = ind.active;
    const segHtml = () => `<div class="seg"><button type="button" class="${active ? 'on' : ''}" data-a="pick" data-v="1">Đang dùng</button><button type="button" class="${active ? '' : 'on'}" data-a="pick" data-v="0">Ẩn</button></div>`;
    openSheet({title:'Bảng chỉ tiêu', desc:esc(o.name),
      body:`<div class="form"><div class="fld"><label for="f-iname">Tên hiển thị</label><input id="f-iname" name="name" value="${esc(ind.name)}"></div></div><div class="section-h" style="margin:0 20px"><h3>Trạng thái</h3></div><div data-part="seg">${segHtml()}</div><div class="hint">Đơn vị con chưa gắn bảng riêng sẽ dùng bảng này.</div>` +
        section('', group(row({a:'pick', d:{v:'open'}, lead:`<span class="lead-ic sm">${ic('building')}</span>`, sm:true, title:'Mở hồ sơ đơn vị', chev:true}))),
      foot:`<button type="button" class="btn" data-a="closeSheet">Hủy</button><button type="button" class="btn pri" data-a="ok">Lưu</button>`,
      onPick:(v, t) => { if(v === 'open'){ closeSheet(); push('org', {id:o.id}); return; } active = v === '1'; t.closest('.sheet').querySelector('[data-part=seg]').innerHTML = segHtml(); },
      onOk:() => { ind.name = sheets[sheets.length - 1].querySelector('[name=name]').value.trim() || ind.name; ind.active = active; log(`Cập nhật bảng chỉ tiêu ${ind.name}`, 'chart', {oid:o.id}); closeSheet(); refresh(); toast('Đã lưu bảng chỉ tiêu'); }});
  },
  addIndicator: () => {
    orgPicker('Gắn bảng chỉ tiêu cho', o => isSo(o) && !indicatorOf(o), o => { indicators().unshift({orgId:o.id, name:o.name, active:true}); log(`Gắn bảng chỉ tiêu cho ${o.name}`, 'chart', {oid:o.id}); refresh(); toast('Đã gắn bảng chỉ tiêu'); });
  },
  addField: () => {
    const o = curRoute().p.org ? org(curRoute().p.org) : null;
    formSheet({title:'Thêm lĩnh vực', fields:[{k:'name', label:'Tên lĩnh vực *', ph:'VD: Đô thị thông minh', req:true}, {k:'desc', label:'Mô tả ngắn', ph:'Không bắt buộc'}],
      hint:o && !S.fieldCatalogs[o.id] ? 'Đơn vị sẽ có danh mục riêng gồm 12 lĩnh vực mặc định + lĩnh vực mới.' : '',
      onOk:v => { ensureCatalog(o ? o.id : null).push({name:v.name, custom:true, hidden:false}); log(`Thêm lĩnh vực "${v.name}"${o ? ' cho ' + o.name : ''}`, 'tag', o ? {oid:o.id} : null); refresh(); toast('Đã thêm lĩnh vực'); }});
  },
  fieldMore: d => {
    const o = curRoute().p.org ? org(curRoute().p.org) : null, oid = o ? o.id : null;
    const x = fieldCatalog(oid)[d.i];
    actionSheet(x.name, [
      {label:'Đổi tên', icon:'edit', fn:() => formSheet({title:'Đổi tên lĩnh vực', fields:[{k:'name', label:'Tên lĩnh vực', value:x.name, req:true}], onOk:v => { ensureCatalog(oid)[d.i].name = v.name; refresh(); toast('Đã đổi tên'); }})},
      {label:x.hidden ? 'Hiện lại' : 'Ẩn khi chọn lĩnh vực', icon:x.hidden ? 'eye' : 'eyeOff', fn:() => { const it = ensureCatalog(oid)[d.i]; it.hidden = !it.hidden; log(`${it.hidden ? 'Ẩn' : 'Hiện'} lĩnh vực "${it.name}"`, 'tag'); refresh(); toast(it.hidden ? 'Đã ẩn lĩnh vực' : 'Đã hiện lại'); }}
    ]);
  },
  roleInfo: d => {
    const mods = MODULES.filter(m => m.roles.includes(d.r));
    openSheet({title:d.r, desc:esc(ROLE_DESC[d.r]), body:section(`Có trong ${mods.length} phân hệ`, group(mods.map(m => row({tag:'div', title:esc(m.name), sub:esc(m.desc)})).join('')))});
  },

  treeOpen: d => push('tree', {node:d.n}),
  treeJump: d => {
    const st = curStack();
    const idx = st.findIndex(r => r.v === 'tree' && (r.p.node || '') === d.n);
    if(idx >= 0 && idx < st.length - 1){ st.length = idx + 1; render('pop'); }
    else if(idx < 0){ st.push({v:'tree', p:{node:d.n || null}}); render('push'); }
  },
  treeAdd: d => {
    const target = d.n || null;
    const into = list => { (target ? S.tree.map[target].children : S.tree.root).push(...list); };
    actionSheet('Thêm vào đây', [
      {label:'Thư mục ảo', sub:'Nhóm các đơn vị, không gắn với đơn vị thật', icon:'folder', fn:() => formSheet({title:'Thư mục ảo mới', fields:[{k:'name', label:'Tên thư mục', ph:'VD: Nhóm đơn vị mới', req:true}], ok:'Tạo', onOk:v => { into([tnode(v.name, null, true).id]); log(`Thêm thư mục ảo "${v.name}"`, 'folder'); refresh(); toast('Đã thêm thư mục'); }})},
      {label:'Đơn vị có sẵn', sub:'Chọn từ cây tổ chức', icon:'building', fn:() => orgPicker('Thêm đơn vị vào cây', null, o => { into([tnode(o.name, o.id).id]); log(`Thêm ${o.name} vào cây thư mục`, 'tree'); refresh(); toast('Đã thêm đơn vị'); })}
    ]);
  },
  treeMore: d => {
    const n = S.tree.map[d.n], p = tparent(n.id), arr = p ? p.children : S.tree.root, i = arr.indexOf(n.id);
    const swap = j => { [arr[i], arr[j]] = [arr[j], arr[i]]; refresh(); };
    actionSheet(n.label, [
      {label:'Di chuyển đến…', icon:'move', fn:() => movePicker(n)},
      i > 0 ? {label:'Lên trên', icon:'up', fn:() => swap(i - 1)} : null,
      i < arr.length - 1 ? {label:'Xuống dưới', icon:'down', fn:() => swap(i + 1)} : null,
      n.virtual ? {label:'Đổi tên', icon:'edit', fn:() => formSheet({title:'Đổi tên thư mục', fields:[{k:'name', label:'Tên', value:n.label, req:true}], onOk:v => { n.label = v.name; refresh(); }})} : null,
      n.orgId ? {label:'Mở hồ sơ đơn vị', icon:'building', fn:() => push('org', {id:n.orgId})} : null,
      {label:'Xóa khỏi cây', icon:'trash', kind:'bad', fn:() => confirmSheet(`Xóa "${n.label}" khỏi cây?`, n.children.length ? `Cả ${n.children.length} mục bên trong cũng bị gỡ khỏi cây. Đơn vị thật không bị xóa.` : 'Đơn vị thật không bị xóa.', 'Xóa', () => {
        const pos = i; tDetach(n.id); log(`Gỡ "${n.label}" khỏi cây thư mục`, 'trash'); refresh();
        toast('Đã xóa khỏi cây', () => { arr.splice(pos, 0, n.id); refresh(); });
      }, true)}
    ].filter(Boolean));
  },
  treeReset: () => confirmSheet('Khôi phục cây mặc định?', 'Mọi thư mục ảo và sắp xếp tay sẽ mất.', 'Khôi phục', () => { buildTree(); S.stacks[S.tab].length = S.stacks[S.tab].findIndex(r => r.v === 'tree') + 1; log('Khôi phục cây thư mục mặc định', 'reset'); refresh(); toast('Đã khôi phục'); }, true),

  sync: () => {
    openSheet({title:'Đồng bộ dữ liệu', desc:'Lấy cây đơn vị, chức vụ, trạng thái tài khoản từ hệ thống hồ sơ cán bộ, công chức.',
      body:section('', group(kv('Lần gần nhất', fmtDate(S.lastSync, true)) + kv('Đơn vị', fmt(D.orgs.size)) + kv('Tài khoản', fmt(D.users.length)) + kv('Lỗi lần trước', '<span class="tag good">Không có</span>'))) + `<div data-part="prog"></div>`,
      foot:`<button type="button" class="btn pri" data-a="ok">${ic('sync')}Đồng bộ ngay</button>`,
      onOk:() => {
        const sh = sheets[sheets.length - 1];
        sh.querySelector('[data-part=prog]').innerHTML = `<div class="progress"><i></i></div><div class="hint" style="text-align:center">Đang đồng bộ…</div>`;
        sh.querySelector('.sh-foot .btn').disabled = true;
        let p = 0; const bar = sh.querySelector('.progress i');
        const tm = setInterval(() => { p += 18; bar.style.width = Math.min(p, 100) + '%'; if(p >= 100){ clearInterval(tm); S.lastSync = Date.now(); log(`Đồng bộ cơ cấu tổ chức: ${fmt(D.orgs.size)} đơn vị, ${fmt(D.users.length)} tài khoản`, 'sync'); closeSheet(); refresh(); toast('Đồng bộ xong, không có thay đổi mới'); } }, 260);
      }});
  },
  importExcel: () => {
    openSheet({title:'Nhập tài khoản từ Excel', desc:'Mỗi dòng gồm: họ tên, email, đơn vị, chức vụ.',
      body:`<div class="eff">
        <div class="e"><span class="lead-ic sm">1</span><div><b>Chọn tệp</b><span>Tệp .xlsx theo mẫu, tối đa 5.000 dòng.</span></div></div>
        <div class="e"><span class="lead-ic sm">2</span><div><b>Kiểm tra</b><span>Đối chiếu email với tài khoản đăng nhập một lần, báo dòng trùng hoặc thiếu.</span></div></div>
        <div class="e"><span class="lead-ic sm">3</span><div><b>Duyệt và tạo</b><span>Xem danh sách hợp lệ rồi mới tạo hàng loạt.</span></div></div>
      </div>` + section('', group(row({tag:'label', lead:`<span class="lead-ic sm">${ic('upload')}</span>`, sm:true, cls:'tap', title:'<span data-part="fname">Chọn tệp Excel…</span>', sub:'<input type="file" accept=".xlsx,.xls" data-a="noop" style="display:none" onchange="this.closest(\'.row\').querySelector(\'[data-part=fname]\').textContent=this.files[0]?this.files[0].name:\'Chọn tệp Excel…\'">'})), `<button type="button" class="link" data-a="noop" onclick="event.preventDefault()">Tải tệp mẫu</button>`),
      foot:`<button type="button" class="btn pri" data-a="ok">Kiểm tra tệp</button>`,
      onOk:() => toast('Bản demo chưa đọc tệp thật')});
  },
  account: () => {
    openSheet({title:'Tài khoản', body:`<div class="hero">${accountAv(64)}<h2>ioc_mbfs</h2><div class="sub">Quản trị toàn cục · toàn hệ thống</div></div>` +
      section('Giao diện', `<div class="seg" style="margin:0">${[['dark','Xanh IOC (tối)'],['light','Sáng']].map(([k, l]) => `<button type="button" class="${S.theme === k ? 'on' : ''}" data-a="pick" data-v="${k}">${l}</button>`).join('')}</div>`) +
      section('', group(iocRow() + row({a:'noop', cls:'danger', lead:`<span class="lead-ic sm bad">${ic('logout')}</span>`, sm:true, title:'Đăng xuất'}))),
      onPick:(v, t) => { S.theme = v; applyTheme(); t.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); }});
  },
  themeSheet: () => optionSheet('Giao diện', '', [{v:'dark', label:'Xanh IOC (tối)', sub:'Giống màn quản trị hiện tại'}, {v:'light', label:'Sáng', sub:'Cùng tông xanh, nền sáng'}], S.theme, v => { S.theme = v; applyTheme(); refresh(); }),

  closeSheet: () => closeSheet(),
  pick: (d, t) => { const sh = t.closest('.sheet'); if(sh && sh._pick) sh._pick(d.v, t); },
  ok: (d, t) => { const sh = t.closest('.sheet'); if(sh && sh._ok) sh._ok(); },
  noop: () => {}
};

/* Thao tác của màn Nhật ký đăng nhập */
function llCounts(r, skip, keyOf){
  const st = llState(r), cnt = {}, q = llQn(st);
  (r._rows || []).forEach(e => { if(llMatch(st, e, skip, q)){ const k = keyOf(e); cnt[k] = (cnt[k] || 0) + 1; cnt.__all = (cnt.__all || 0) + 1; } });
  return cnt;
}
Object.assign(A, {
  goLoginFails: () => push('loginLog', {today:1, status:'fail'}),
  llUserLog: d => push('loginLog', {uid:d.id}),
  llPreset: d => {
    const r = curRoute(), st = llState(r);
    if(d.p === 'custom'){ llRangeSheet(r); return; }
    if(st.preset === d.p) return;
    st.preset = d.p; refresh();
  },
  llRange: () => llRangeSheet(curRoute()),
  llReset: () => { llState(curRoute()).preset = 'week'; refresh(); },
  llStatus: () => {
    const r = curRoute(), st = llState(r), cnt = llCounts(r, 'status', e => e.ok ? 'ok' : 'fail');
    optionSheet('Trạng thái', 'Lọc theo kết quả đăng nhập', LL_STATUS.map(([k, l]) => ({v:k, label:l, sub:r._rows ? `${fmt(k === 'all' ? cnt.__all : cnt[k])} lượt` : ''})), st.status, v => { st.status = v; refresh(); });
  },
  llAxis: () => {
    const r = curRoute(), st = llState(r), cnt = llCounts(r, 'axis', e => LL.userOf(e).axis || '');
    optionSheet('Trục', 'Trục của người đăng nhập', [{v:'', label:'Tất cả', sub:r._rows ? `${fmt(cnt.__all)} lượt` : ''}, ...AX_ORDER.map(ax => ({v:ax, label:AX[ax].name, sub:r._rows ? `${fmt(cnt[ax])} lượt` : ''}))], st.axis, v => {
      st.axis = v;
      if(v && st.orgId){ const o = org(st.orgId); if(o && o.axis && o.axis !== v) st.orgId = null; } // đơn vị đã chọn không thuộc trục mới → bỏ
      refresh();
    });
  },
  llOrg: () => llOrgSheet(curRoute()),
  llClearUid: () => { llState(curRoute()).uid = null; refresh(); },
  llRefresh: () => llLoad(view(), curRoute()),
  llExport: () => llExport(curRoute()),
  llOpen: d => {
    const r = curRoute(), e = r._flist && r._flist[d.i]; if(!e) return;
    const u = LL.userOf(e), du = e.u >= 0 ? userOf(u.id) : null, cur = LL.isCurrent(e);
    const status = e.ok ? '<span class="tag good">Thành công</span>' : '<span class="tag bad">Thất bại</span>';
    const note = e.ok ? (cur ? '<span class="tag accent">Phiên hiện tại</span>' : '—') : `<span class="ll-reason">${esc(LL.reason(e.reason))}</span>`;
    const acts = (du ? row({a:'pick', d:{v:'user'}, lead:`<span class="lead-ic sm">${ic('user')}</span>`, sm:true, title:'Mở hồ sơ người dùng', chev:true}) : '') +
      (!llState(r).uid ? row({a:'pick', d:{v:'only'}, lead:`<span class="lead-ic sm">${ic('filter')}</span>`, sm:true, title:'Chỉ xem lượt của người này', chev:true}) : '');
    openSheet({title:'Chi tiết lượt đăng nhập',
      body:`<div class="hero">${e.u < 0 ? accountAv(64) : avPlain(du || u, true)}<h2>${esc(u.name)}</h2><div class="sub">@${esc(u.username)}</div></div>` +
        section('', group(kv('Thời gian', `${fmtDate(e.ts)} ${hms(e.ts)}`) + kv('Trạng thái', status) + kv('Ghi chú', note) + kv('Địa chỉ IP', esc(e.ip)) + kv('Trục', esc(LL.AXIS_NAME[u.axis] || '—')) + kv('Đơn vị công tác', esc(u.orgName)))) +
        (acts ? section('', group(acts)) : ''),
      onPick:v => { closeSheet(); if(v === 'user') push('user', {id:du.id}); else { llState(r).uid = String(u.id); refresh(); } }});
  }
});
let llQTimer;
const llOnQ = (v, el, r) => {
  clearTimeout(llQTimer);
  llQTimer = setTimeout(() => {
    llState(r).q = v;
    const sb = el.querySelector('.searchbar'); if(sb) sb.classList.toggle('has', !!v);
    r.loaded = 40; llFill(el, r);
  }, 160);
};

/* Di chuyển nút cây: duyệt cây trong bảng trượt, chọn thư mục đích */
function movePicker(n){
  let at = null;
  const body = () => {
    const kids = tchildren(at).filter(id => id !== n.id);
    const path = tpath(at);
    return `<div class="path-bar"><button type="button" class="${at ? '' : 'cur'}" data-a="pick" data-v="go:">${ic('tree')}<span>Gốc</span></button>${path.map(p => `<button type="button" class="${p.id === at ? 'cur' : ''}" data-a="pick" data-v="go:${p.id}"><span>${esc(p.label)}</span></button>`).join('')}</div>` +
      (kids.length ? section('', group(kids.map(id => { const k = S.tree.map[id]; return row({a:'pick', d:{v:'go:' + id}, lead:`<span class="lead-ic sm ${k.virtual ? 'warn' : ''}">${ic(k.virtual ? 'folder' : 'building')}</span>`, sm:true, title:esc(k.label), sub:k.children.length ? k.children.length + ' mục' : '', chev:true}); }).join(''))) : emptyBox('Không có mục con', 'folder'));
  };
  const foot = () => `<button type="button" class="btn pri" data-a="ok">Chuyển vào "${esc(at ? S.tree.map[at].label : 'Gốc')}"</button>`;
  openSheet({title:`Di chuyển "${n.label}"`, full:true, body:body(), foot:foot(),
    onPick:(v, t) => { at = v.slice(3) || null; const sh = t.closest('.sheet'); sh.querySelector('.sh-body').innerHTML = body(); sh.querySelector('.sh-foot').innerHTML = foot(); },
    onOk:() => {
      if(at && tIsDesc(n.id, at)){ toast('Không thể chuyển vào chính nó hoặc mục con của nó'); return; }
      tDetach(n.id); (at ? S.tree.map[at].children : S.tree.root).push(n.id);
      log(`Chuyển "${n.label}" vào ${at ? S.tree.map[at].label : 'gốc cây'}`, 'move');
      closeSheet(); refresh(); toast('Đã di chuyển');
    }});
}

/* ---------------- Ô nhập ---------------- */
const INPUTS = {
  userQ: (v, el, r) => { userState(r).q = v; updateUserList(el, r); },
  orgQ: (v, el, r) => { orgState(r).q = v; updateOrgList(el, r); },
  childQ: (v, el, r) => { r.state.q = v; r.loaded = 40; const o = org(r.p.id), q = norm(v); r._list = o.children.map(org).filter(c => !q || c._k.includes(q)); el.querySelector('[data-part=list]').innerHTML = r._list.slice(0, 40).map(c => orgRow(c)).join(''); },
  groupQ: (v, el, r) => { r.state.q = v; r.loaded = 40; const pos = el.querySelector('input').selectionStart; refresh(); const i = view().querySelector('input'); i.focus(); i.setSelectionRange(pos, pos); },
  globalQ: (v, el, r) => { r.state.q = v; el.querySelector('[data-part=results]').innerHTML = searchResults(v); },
  llQ: (v, el, r) => llOnQ(v, el, r),
  sheetQ: (v, el, r, t) => { const sh = t.closest('.sheet'); if(sh && sh._in) sh._in(v, sh); }
};

/* ---------------- Ủy quyền sự kiện ---------------- */
let suppressClick = false, lpTimer = null;
app.addEventListener('click', e => {
  if(suppressClick){ suppressClick = false; e.preventDefault(); return; }
  const t = e.target.closest('[data-a]');
  if(!t || !app.contains(t)) return;
  if(t.tagName === 'INPUT') return;
  const fn = A[t.dataset.a];
  if(fn){ e.preventDefault(); fn(t.dataset, t, e); }
});
app.addEventListener('input', e => {
  const t = e.target.closest('[data-in]'); if(!t) return;
  const fn = INPUTS[t.dataset.in]; const el = view();
  if(fn) fn(t.value, el, curRoute(), t);
});
/* Nhấn giữ một dòng = vào chế độ chọn nhiều; chặn menu "Sao chép/Chọn" của trình duyệt trên dòng đó */
app.addEventListener('contextmenu', e => { if(e.target.closest('[data-lp]')) e.preventDefault(); });
app.addEventListener('pointerdown', e => {
  const t = e.target.closest('[data-lp]'); if(!t || S.select) return;
  const x0 = e.clientX, y0 = e.clientY;
  lpTimer = setTimeout(() => { suppressClick = true; enterSelect(t.dataset.lp); if(navigator.vibrate) navigator.vibrate(12); }, 480);
  const cancel = ev => { if(!ev.clientX || Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8 || ev.type !== 'pointermove'){ clearTimeout(lpTimer); off(); } };
  const off = () => { app.removeEventListener('pointermove', cancel); app.removeEventListener('pointerup', cancel); app.removeEventListener('pointercancel', cancel); };
  app.addEventListener('pointermove', cancel); app.addEventListener('pointerup', cancel); app.addEventListener('pointercancel', cancel);
});

/* ---------------- Khởi động + lối tắt cho người duyệt ---------------- */
if(!D.users.length){ app.innerHTML = '<div class="empty" style="margin-top:120px">Không đọc được dữ liệu tài khoản. Tải lại trang hoặc kiểm tra tệp js/core/account-data.js.</div>'; return; }
/* Vào màn quản trị = 1 phiên đăng nhập của Admin (lượt thật, hiện "Phiên hiện tại" trong Nhật ký đăng nhập);
   tải lại trang trong cùng tab không tính là lần đăng nhập mới. */
if(LL) LL.recordAdminSession(true);
loadNav();
try{ history.replaceState({iocm:1, d:hDepth}, ''); }catch(e){}
render('fade');
WEB_MQ.addEventListener && WEB_MQ.addEventListener('change', ev => {
  const r = curRoute(); r.scroll = getScroll();
  WEB = ev.matches; document.documentElement.classList.toggle('web', WEB);
  render();
});

const sample = {
  user: (D.users.find(u => u.admin && /Giám đốc/.test(u.job)) || D.users[0]).id,
  so: ([...D.orgs.values()].find(o => /^Sở Tài chính/.test(o.name)) || [...D.orgs.values()].find(isSo) || org(D.rootId)).id
};
const JUMPS = [
  ['Tổng quan', () => goTab('home')],
  ['Người dùng', () => { S.stacks.users = [{v:'users', p:{}}]; goTab('users'); }],
  ['Hồ sơ + phân quyền', () => { S.stacks.users = [S.stacks.users[0], {v:'user', p:{id:sample.user}}]; goTab('users'); }],
  ['Chọn nhiều', () => { S.stacks.users = [{v:'users', p:{chip:'never'}}]; goTab('users'); enterSelect(); }],
  ['Đơn vị', () => { S.stacks.orgs = [{v:'orgs', p:{}}]; goTab('orgs'); }],
  ['Hồ sơ đơn vị (Sở)', () => { S.stacks.orgs = [S.stacks.orgs[0], {v:'org', p:{id:sample.so}}]; goTab('orgs'); }],
  ['Cây thư mục', () => { S.stacks.settings = [S.stacks.settings[0], {v:'tree', p:{}}]; S.tab = 'settings'; render('fade'); }],
  ['Phân nhóm', () => { S.stacks.settings = [S.stacks.settings[0], {v:'grouping', p:{}}]; S.tab = 'settings'; render('fade'); }],
  ['Tìm kiếm', () => goTab('home', {v:'search', p:{}})],
  ['Nhật ký đăng nhập', () => { S.stacks.settings = [S.stacks.settings[0], {v:'loginLog', p:{}}]; S.tab = 'settings'; render('fade'); }],
  ['Xanh IOC / Sáng', () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; applyTheme(); refresh(); }]
];
const jump = document.getElementById('jump');
if(jump){
  jump.innerHTML = JUMPS.map((j, i) => `<button type="button" data-j="${i}">${j[0]}</button>`).join('');
  jump.addEventListener('click', e => { const b = e.target.closest('[data-j]'); if(!b) return; closeAllSheets(); JUMPS[b.dataset.j][1](); });
}
window.__iocm = {S, D, goTab, push, wantDepth};
})();
