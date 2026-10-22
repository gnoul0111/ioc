/* ===== Dữ liệu cây đơn vị IOC/CAD — tự chứa, không phụ thuộc dữ liệu của dashboard chính ===== */
/* LƯU Ý: màn OUA này là 1 cây đơn vị RIÊNG, tự chứa, phục vụ demo "Quản trị đơn vị & người dùng" — không đọc
   chung dữ liệu với cây "Cơ cấu tổ chức" thật của dashboard chính (hàm sidebarTree()/snavOfficeNodes() ở cuối
   file, nay đã dùng tên phòng/ban thật từ categorySeed thay vì "Văn phòng 1-8" giả lập). Cây OUA dưới đây vẫn
   giữ dữ liệu giả lập độc lập của riêng nó — nếu muốn đồng bộ tên thật thì cần cập nhật thêm ở đây. */
const ouaAxisMeta = {
  DANG:{name:'Đảng ủy', parentLabel:'Đảng ủy Thành phố Hà Nội', pill:'red'},
  HDND:{name:'HĐND', parentLabel:'HĐND Thành phố Hà Nội', pill:'yellow'},
  UBND:{name:'UBND', parentLabel:'UBND Thành phố Hà Nội', pill:'green'},
  MTTQ:{name:'MTTQ', parentLabel:'Ủy ban MTTQ Việt Nam Thành phố Hà Nội', pill:'violet'},
  /* 5 khối cấp Trung ương — theo cơ cấu tổ chức thật (đứng trên cấp Thành phố), bổ sung thêm vào cây tổ chức OUA. */
  TW_CTN:{name:'Chủ tịch nước', parentLabel:'Trung ương', pill:'gold'},
  TW_DANG:{name:'BCH Trung ương', parentLabel:'Trung ương', pill:'red'},
  TW_QH:{name:'Quốc hội', parentLabel:'Trung ương', pill:'yellow'},
  TW_CP:{name:'Chính phủ', parentLabel:'Trung ương', pill:'green'},
  TW_MTTQ:{name:'MTTQ Trung ương', parentLabel:'Trung ương', pill:'violet'}
};
/* Cơ cấu Trung ương — copy đúng tên đơn vị đã dùng ở cây đăng nhập Trung ương của dashboard chính (xem
   TW_DANG_OFFICE_CATEGORIES và office tree quanh dòng ~1930-1960) để không lệch dữ liệu giữa 2 nơi. Chỉ BCH
   Trung ương Đảng có cấu trúc lồng sâu (Ban Tổ chức TW → Cục → Phòng); các khối còn lại 1 cấp con theo đúng PDF. */
const ouaTwUnits = [
  {khoi:'TW_CTN', name:'Văn phòng Chủ tịch nước', code:'ORG-TW-CTN-VP'},
  {khoi:'TW_DANG', name:'BTC Trung ương', code:'ORG-TW-DANG-BTC', children:[
    {name:'Cục đào tạo bồi dưỡng cán bộ', code:'ORG-TW-DANG-BTC-CDT', children:[
      {name:'Văn phòng cục', code:'ORG-TW-DANG-BTC-CDT-VP'},
      {name:'Phòng đào tạo bồi dưỡng trong nước', code:'ORG-TW-DANG-BTC-CDT-TN'},
      {name:'Phòng đào tạo bồi dưỡng nước ngoài', code:'ORG-TW-DANG-BTC-CDT-NN'}
    ]},
    {name:'Cục bảo vệ chính trị nội bộ', code:'ORG-TW-DANG-BTC-CBV', children:[
      {name:'Văn phòng cục', code:'ORG-TW-DANG-BTC-CBV-VP'},
      {name:'Phòng địa phương', code:'ORG-TW-DANG-BTC-CBV-DP'},
      {name:'Phòng bộ ban ngành', code:'ORG-TW-DANG-BTC-CBV-BB'}
    ]}
  ]},
  {khoi:'TW_DANG', name:'Văn phòng ban', code:'ORG-TW-DANG-VPBAN', children:[
    {name:'Phòng Tổ chức - Cán bộ', code:'ORG-TW-DANG-VPBAN-P1'},
    {name:'Phòng Tổng hợp', code:'ORG-TW-DANG-VPBAN-P2'},
    {name:'Phòng Hành chính - Lưu trữ', code:'ORG-TW-DANG-VPBAN-P3'},
    {name:'Phòng Công nghệ thông tin và Chuyển đổi số', code:'ORG-TW-DANG-VPBAN-P4'},
    {name:'Phòng Tài vụ', code:'ORG-TW-DANG-VPBAN-P5'},
    {name:'Phòng Quản trị', code:'ORG-TW-DANG-VPBAN-P6'}
  ]},
  {khoi:'TW_QH', name:'Ủy ban Thường vụ Quốc hội', code:'ORG-TW-QH-UBTV'},
  {khoi:'TW_CP', name:'Các bộ, cơ quan ngang bộ', code:'ORG-TW-CP-BO'},
  {khoi:'TW_CP', name:'Chính quyền hành chính', code:'ORG-TW-CP-CQHC'},
  {khoi:'TW_MTTQ', name:'Ủy ban Trung ương MTTQ Việt Nam', code:'ORG-TW-MTTQ-UB'},
  {khoi:'TW_MTTQ', name:'Các tổ chức chính trị xã hội trực thuộc hệ thống Mặt trận', code:'ORG-TW-MTTQ-TO'}
];
/* 2 đơn vị con thật của Đảng ủy phường/xã theo PDF cơ cấu tổ chức — dữ liệu tĩnh riêng của OUA (không tham chiếu
   DANG_XA_CATEGORIES của dashboard chính) để giữ đúng nguyên tắc module này tự chứa dữ liệu, không phụ thuộc. */
const ouaWardDangSubUnits = ['Văn phòng Đảng ủy phường', 'Ban Tuyên giáo và Dân vận phường'];
function ouaGenericOffices(axis, prefix){
  return [1,2,3,4,5,6,7,8].map(i=>({axis, code:`${prefix}-VP${i}`, name:`Văn phòng ${i}`, placeholder:true}));
}
const ouaCityUnits = [
  ...ouaGenericOffices('DANG','ORG-TU'),
  ...ouaGenericOffices('HDND','ORG-HD'),
  {axis:'UBND', code:'ORG-UB-VHTT', name:(typeof ACCOUNT_SAP_XEP_SO_2026!=='undefined' && ACCOUNT_SAP_XEP_SO_2026) ? 'Sở Văn hóa, Thể thao và Du lịch' : 'Sở Văn hóa và Thể thao'},
  {axis:'UBND', code:'ORG-UB-GDDT', name:'Sở Giáo dục và Đào tạo'},
  {axis:'UBND', code:'ORG-UB-NNMT', name:'Sở Nông nghiệp và Môi trường'},
  {axis:'UBND', code:'ORG-UB-YTE', name:'Sở Y tế'},
  {axis:'UBND', code:'ORG-UB-TC', name:'Sở Tài chính'},
  {axis:'UBND', code:'ORG-UB-NOIVU', name:'Sở Nội vụ'},
  {axis:'UBND', code:'ORG-UB-TUPHAP', name:'Sở Tư pháp'},
  {axis:'UBND', code:'ORG-UB-CT', name:'Sở Công Thương'},
  {axis:'UBND', code:'ORG-UB-XD', name:'Sở Xây dựng'},
  {axis:'UBND', code:'ORG-UB-KHCN', name:'Sở Khoa học và Công nghệ'},
  {axis:'UBND', code:'ORG-UB-DTTG', name:'Sở Dân tộc và Tôn giáo'},
  {axis:'UBND', code:'ORG-UB-DL', name:'Sở Du lịch'},
  {axis:'UBND', code:'ORG-UB-QHKT', name:'Sở Quy hoạch - Kiến trúc'},
  {axis:'UBND', code:'ORG-UB-14', name:'Sở/đơn vị chuyên môn thứ 14'},
  {axis:'UBND', code:'ORG-UB-TT', name:'Thanh tra Thành phố'},
  {axis:'UBND', code:'ORG-UB-VPUB', name:'Văn phòng UBND Thành phố Hà Nội'},
  {axis:'UBND', code:'ORG-UB-KCNC', name:'Ban Quản lý Khu công nghệ cao và khu công nghiệp'},
  ...ouaGenericOffices('MTTQ','ORG-MT')
/* Sở Du lịch, Sở Quy hoạch - Kiến trúc đã nhập sở khác (account-sap-xep.js): giữ dòng khai báo, chỉ lọc khỏi danh sách */
].filter(u=>!(typeof ACCOUNT_SAP_XEP_SO_2026!=='undefined' && ACCOUNT_SAP_XEP_SO_2026 && ['ORG-UB-DL','ORG-UB-QHKT'].includes(u.code)));
const ouaWardNames = ['Phường Ba Đình','Phường Bạch Mai','Phường Bồ Đề','Phường Chương Mỹ','Phường Cầu Giấy','Phường Cửa Nam','Phường Dương Nội','Phường Giảng Võ','Phường Hai Bà Trưng','Phường Hoàn Kiếm','Phường Hoàng Liệt','Phường Hoàng Mai','Phường Hà Đông','Phường Hồng Hà','Phường Khương Đình','Phường Kim Liên','Phường Kiến Hưng','Phường Long Biên','Phường Láng','Phường Lĩnh Nam','Phường Nghĩa Đô','Phường Ngọc Hà','Phường Phú Diễn','Phường Phú Lương','Phường Phú Thượng','Phường Phúc Lợi','Phường Phương Liệt','Phường Sơn Tây','Phường Thanh Liệt','Phường Thanh Xuân','Phường Thượng Cát','Phường Tây Hồ','Phường Tây Mỗ','Phường Tây Tựu','Phường Tùng Thiện','Phường Tương Mai','Phường Từ Liêm','Phường Việt Hưng','Phường Văn Miếu - Quốc Tử Giám','Phường Vĩnh Hưng','Phường Vĩnh Tuy','Phường Xuân Phương','Phường Xuân Đỉnh','Phường Yên Hòa','Phường Yên Nghĩa','Phường Yên Sở','Phường Ô Chợ Dừa','Phường Đông Ngạc','Phường Đại Mỗ','Phường Định Công','Phường Đống Đa','Xã An Khánh','Xã Ba Vì','Xã Bát Tràng','Xã Bình Minh','Xã Bất Bạt','Xã Chuyên Mỹ','Xã Chương Dương','Xã Cổ Đô','Xã Dân Hòa','Xã Dương Hòa','Xã Gia Lâm','Xã Hoài Đức','Xã Hát Môn','Xã Hòa Lạc','Xã Hòa Phú','Xã Hòa Xá','Xã Hưng Đạo','Xã Hương Sơn','Xã Hạ Bằng','Xã Hồng Sơn','Xã Hồng Vân','Xã Kim Anh','Xã Kiều Phú','Xã Liên Minh','Xã Minh Châu','Xã Mê Linh','Xã Mỹ Đức','Xã Nam Phù','Xã Ngọc Hồi','Xã Nội Bài','Xã Phù Đổng','Xã Phú Cát','Xã Phú Nghĩa','Xã Phú Xuyên','Xã Phúc Lộc','Xã Phúc Sơn','Xã Phúc Thịnh','Xã Phúc Thọ','Xã Phượng Dực','Xã Quang Minh','Xã Quảng Bị','Xã Quảng Oai','Xã Quốc Oai','Xã Suối Hai','Xã Sóc Sơn','Xã Sơn Đồng','Xã Tam Hưng','Xã Thanh Oai','Xã Thanh Trì','Xã Thiên Lộc','Xã Thuận An','Xã Thư Lâm','Xã Thường Tín','Xã Thượng Phúc','Xã Thạch Thất','Xã Tiến Thắng','Xã Trung Giã','Xã Trần Phú','Xã Tây Phương','Xã Vân Đình','Xã Vĩnh Thanh','Xã Vật Lại','Xã Xuân Mai','Xã Yên Bài','Xã Yên Lãng','Xã Yên Xuân','Xã Ô Diên','Xã Đa Phúc','Xã Đan Phượng','Xã Đoài Phương','Xã Đông Anh','Xã Đại Thanh','Xã Đại Xuyên','Xã Ứng Hòa','Xã Ứng Thiên'];

let ouaOrgRows = null;
/* Tách riêng phần dựng dòng khối Trung ương (BTCTW) — dùng chung cho cả ouaBuildOrgRows() (mock cũ, không gọi
   nữa) và ouaBuildOrgRowsFromReal() (nguồn thật, Phase 2) vì account.json không có dữ liệu Trung ương. */
function ouaBuildTwOrgRows(){
  return ouaTwUnits.map(u=>({
    code:u.code, name:u.name, axis:u.khoi,
    level:'Trung ương', parent: ouaAxisMeta[u.khoi].name,
    sub: u.children ? `Có ${u.children.length} đơn vị trực thuộc` : `Đơn vị thuộc ${ouaAxisMeta[u.khoi].name}`,
    source:'BKAV CBCCVC', status:'active', placeholder:false, real:false, twChildren:u.children||null
  }));
}
/* KHÔNG DÙNG NỮA (Phase 2) — thay bằng ouaBuildOrgRowsFromReal() dưới đây, dùng dữ liệu thật từ account.json.
   Giữ lại hàm này để đối chiếu/tham khảo cấu trúc dữ liệu giả lập cũ. */
function ouaBuildOrgRows(){
  const rows = ouaCityUnits.map(u=>({
    code:u.code, name:u.name, axis:u.axis,
    level:'Thành phố',
    parent: ouaAxisMeta[u.axis].parentLabel,
    sub: u.placeholder ? 'Giả lập — chưa có dữ liệu thật (theo cơ cấu tổ chức đang chạy trong dashboard)' : `Đơn vị chuyên môn thuộc trục ${ouaAxisMeta[u.axis].name}`,
    source: u.placeholder ? 'Chưa xác định' : 'BKAV CBCCVC',
    status: u.code==='ORG-HD-VP3' ? 'review' : (u.placeholder ? 'placeholder' : 'active'),
    placeholder: !!u.placeholder
  }));
  rows.push(...ouaBuildTwOrgRows());
  /* Mỗi xã/phường có đủ 4 nhánh trục (đúng theo snavWardBranches trong dashboard chính: Đảng ủy/HĐND/UBND/MTTQ).
     Trục Đảng ủy có 2 đơn vị con thật (Văn phòng đảng ủy phường, Ban Tuyên giáo và Dân vận phường — theo cơ cấu
     tổ chức thật); HĐND/UBND/MTTQ ở cấp phường vẫn giữ 8 "Văn phòng" giả lập bên trong như trước (chưa có dữ liệu
     thật ở cấp này) — không liệt kê rời 8 văn phòng/trục/phường (126×4×8 = 4.032 dòng) để bảng còn dùng được. */
  const axisKeys = ['DANG','HDND','UBND','MTTQ'];
  ouaWardNames.forEach((w,i)=>{
    const wcode = String(i+1).padStart(3,'0');
    axisKeys.forEach(ax=>{
      rows.push({
        code:`ORG-W${wcode}-${ax}`, name:`${ouaAxisMeta[ax].name} ${w}`, axis:ax,
        level:'Xã/Phường', parent:w,
        sub: ax==='DANG' ? `Cấp xã/phường — có ${ouaWardDangSubUnits.length} đơn vị trực thuộc (Văn phòng đảng ủy, Ban Tuyên giáo và Dân vận)` : 'Cấp xã/phường — có 8 "Văn phòng" giả lập bên trong, chưa có dữ liệu thật',
        source:'BKAV CBCCVC', status:'active', placeholder:false, ward:w
      });
    });
  });
  return rows;
}
function ouaStatusPill(status){
  if(status==='review') return '<span class="pill yellow">Cần rà soát</span>';
  if(status==='placeholder') return '<span class="pill violet">Chưa có dữ liệu</span>';
  return '<span class="pill green">Active</span>';
}
/* Màu pill desktop (red/green/yellow/violet/gold) -> lớp màu chip mobile Phase D (.oua-m-chip chỉ có
   blue/green/amber/red/violet) — dùng chung cho mọi khuôn thẻ mobile để khỏi lặp lại ánh xạ ở từng hàm render. */
function ouaPillToChip(pill){
  return pill==='yellow' || pill==='gold' ? 'amber' : (pill||'blue');
}
/* Nguồn dữ liệu THẬT cho "Quản lý đơn vị" (Phase 2) — chuyển ouaRealOrgRows (Phase 1, account.json) về đúng
   hình dạng dòng mà ouaRenderOrgRows()/ouaShowOrgDetail() đang dùng, + nối thêm khối Trung ương mô phỏng
   (ouaBuildTwOrgRows) vì account.json không có dữ liệu Trung ương. Bỏ dòng cấp 1 (root "THÀNH PHỐ HÀ NỘI")
   vì đó là gốc cây, không phải 1 đơn vị cụ thể để liệt kê ngang hàng các đơn vị khác. */
function ouaBuildOrgRowsFromReal(){
  if(!ouaRealOrgRows) ouaBuildRealData();
  const rows = ouaRealOrgRows.filter(r=>r.level>1 && r.axis).map(r=>({
    code:`ORG-${r.id}`, name:r.name, axis:r.axis,
    level:`Cấp ${r.level-1}`, parent:r.parentName||'—',
    sub:`${r.userCount} nhân sự${r.childCount?` · ${r.childCount} đơn vị con`:''}`,
    source:'BKAV CBCCVC', status: r.userCount===0 ? 'review' : 'active',
    placeholder:false, real:true, realId:r.id, realLevel:r.level, path:r.path, parentId:r.parentId
  }));
  rows.push(...ouaBuildTwOrgRows());
  return rows;
}
function ouaRenderOrgRows(list){
  const tbody = document.getElementById('ouaOrgTbody');
  const cardsEl = document.getElementById('ouaOrgCardsMobile');
  if(!tbody) return;
  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty">Không tìm thấy đơn vị phù hợp bộ lọc.</div></td></tr>`;
    if(cardsEl) cardsEl.innerHTML = `<div class="empty">Không tìm thấy đơn vị phù hợp bộ lọc.</div>`;
    return;
  }
  tbody.innerHTML = list.map((r,i)=>`<tr>
    <td class="oua-td-title" data-th="Tên đơn vị"><a class="link" onclick="ouaShowOrgDetail('${r.code}')">${r.name}</a><div class="muted">${r.sub}</div></td>
    <td data-th="Mã IOC">${r.code}</td>
    <td data-th="Trục"><span class="pill ${ouaAxisMeta[r.axis].pill}">${ouaAxisMeta[r.axis].name}</span></td>
    <td data-th="Cấp tổ chức">${r.level}</td>
    <td data-th="Đơn vị cấp trên">${r.parent}</td>
    <td data-th="Nguồn">${r.source}</td>
    <td data-th="Trạng thái">${ouaStatusPill(r.status)}</td>
    <td data-th="Thao tác"><div class="actions">
      <button class="btn small" onclick="ouaShowOrgDetail('${r.code}')">Chi tiết</button>
      <button class="btn small" onclick="ouaOpenModal('${r.level==='Xã/Phường'?'dataScopeModal':'mapOrgModal'}')">${r.level==='Xã/Phường'?'Scope':'Map mã'}</button>
      <button class="btn small" title="Đưa lên" onclick="ouaMoveOrgRow('${r.code}',-1)"${i===0?' disabled':''}>↑</button>
      <button class="btn small" title="Đưa xuống" onclick="ouaMoveOrgRow('${r.code}',1)"${i===list.length-1?' disabled':''}>↓</button>
    </div></td>
  </tr>`).join('');
  if(cardsEl) cardsEl.innerHTML = list.map((r,i)=>{
    const statusAccent = r.status==='active' ? 'green' : (r.status==='review' ? 'amber' : 'violet');
    const axisChip = ouaPillToChip(ouaAxisMeta[r.axis].pill);
    return `<div class="oua-m-card ${statusAccent}">
      <div class="oua-m-card-top">
        <div class="oua-m-card-body">
          <div class="oua-m-card-title"><a class="link" onclick="ouaShowOrgDetail('${r.code}')">${r.name}</a> <span class="oua-m-chip ${axisChip}" style="margin-left:4px">${ouaAxisMeta[r.axis].name}</span></div>
          <div class="oua-m-card-sub">${r.parent}</div>
          <div class="oua-m-card-chips">
            <span class="oua-m-chip ghost">${r.level}</span>
            <span class="oua-m-chip ghost">${r.source}</span>
          </div>
        </div>
      </div>
      <div class="oua-m-card-actions">
        <button class="oua-m-btn-text" onclick="ouaShowOrgDetail('${r.code}')">Chi tiết</button>
        <button class="oua-m-iconbtn" title="Đưa lên" onclick="ouaMoveOrgRow('${r.code}',-1)"${i===0?' disabled':''}>↑</button>
        <button class="oua-m-iconbtn" title="Đưa xuống" onclick="ouaMoveOrgRow('${r.code}',1)"${i===list.length-1?' disabled':''}>↓</button>
        <button class="oua-m-iconbtn" title="${r.level==='Xã/Phường'?'Scope':'Map mã'}" onclick="ouaOpenModal('${r.level==='Xã/Phường'?'dataScopeModal':'mapOrgModal'}')">⋯</button>
      </div>
    </div>`;
  }).join('');
}
function ouaMoveOrgRow(code, dir){
  const idx = ouaOrgRows.findIndex(r=>r.code===code);
  const swapIdx = idx+dir;
  if(idx<0 || swapIdx<0 || swapIdx>=ouaOrgRows.length) return;
  [ouaOrgRows[idx], ouaOrgRows[swapIdx]] = [ouaOrgRows[swapIdx], ouaOrgRows[idx]];
  ouaFilterOrgList();
  ouaToast('Đã đổi thứ tự hiển thị (demo, chỉ trong phiên làm việc, chưa lưu backend).');
}
function ouaUpdateOrgKpis(){
  const total = ouaOrgRows.length;
  const twCount = ouaOrgRows.filter(r=>r.level==='Trung ương').length;
  const realCount = ouaOrgRows.filter(r=>r.real).length;
  const review = ouaOrgRows.filter(r=>r.status==='review').length;
  const placeholder = ouaOrgRows.filter(r=>r.status==='placeholder').length;
  document.getElementById('ouaKpiTotal').textContent = total;
  document.getElementById('ouaKpiTotalHint').textContent = `${twCount} TW (mô phỏng) + ${realCount} đơn vị thật (Hà Nội)`;
  document.getElementById('ouaKpiMapped').textContent = total - review - placeholder;
  document.getElementById('ouaKpiReview').textContent = String(review + placeholder).padStart(2,'0');
  document.getElementById('ouaKpiActive').textContent = ouaOrgRows.filter(r=>r.status==='active').length;
}
function ouaFilterOrgList(){
  if(!ouaOrgRows) return;
  const q = (document.getElementById('ouaOrgSearch').value||'').trim().toLowerCase();
  const axis = document.getElementById('ouaOrgAxisSel').value;
  const level = document.getElementById('ouaOrgLevelSel').value;
  const filtered = ouaOrgRows.filter(r=>{
    if(axis && r.axis!==axis) return false;
    if(level && r.level!==level) return false;
    if(q && !(r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))) return false;
    return true;
  });
  ouaRenderOrgRows(filtered);
  const countEl = document.getElementById('ouaOrgListCount');
  if(countEl) countEl.textContent = `Hiển thị ${filtered.length}/${ouaOrgRows.length} đơn vị`;
}
function ouaShowOrgDetail(code){
  const r = ouaOrgRows.find(x=>x.code===code);
  if(!r) return;
  document.getElementById('ouaOrgDetailTitle').textContent = r.name;
  document.getElementById('ouaOrgDetailPath').textContent = `Mã IOC: ${r.code} • Trục ${ouaAxisMeta[r.axis].name} • ${r.level.startsWith('Cấp') ? r.level : 'Cấp '+r.level}`;
  document.getElementById('ouaOrgFName').textContent = r.name;
  document.getElementById('ouaOrgFAbbr').textContent = r.name;
  document.getElementById('ouaOrgFCode').textContent = r.code;
  document.getElementById('ouaOrgFBkav').textContent = `BKAV-${r.code}`;
  document.getElementById('ouaOrgFAxis').textContent = ouaAxisMeta[r.axis].name;
  document.getElementById('ouaOrgFLevel').textContent = r.level;
  document.getElementById('ouaOrgFParent').textContent = r.parent;
  document.getElementById('ouaOrgFStatus').innerHTML = ouaStatusPill(r.status).replace('Active','Đang hoạt động');
  const ouaWardHeadTitle = {DANG:'Bí thư Đảng ủy', HDND:'Chủ tịch HĐND', UBND:'Chủ tịch UBND', MTTQ:'Chủ tịch UB MTTQ'};
  document.getElementById('ouaOrgFHead').textContent = r.level==='Xã/Phường' ? `${ouaWardHeadTitle[r.axis]} ${r.ward}` : (r.placeholder ? '— (chưa có dữ liệu thật)' : `Lãnh đạo ${r.name}`);
  document.getElementById('ouaOrgFEmail').textContent = r.placeholder ? '—' : `${r.code.toLowerCase().replace(/[^a-z0-9]/g,'')}@hanoi.gov.vn`;
  document.getElementById('ouaOrgFSource').textContent = r.placeholder ? 'Chưa có dữ liệu thật — cây cơ cấu tổ chức mới có tên giả lập "Văn phòng 1-8" cho trục này.' : (r.source==='IOC nội bộ' ? 'IOC quản lý toàn bộ hồ sơ; chưa map nguồn BKAV' : 'BKAV làm nguồn gốc; IOC quản lý metadata mở rộng');
  const childTbody = document.getElementById('ouaOrgChildTbody');
  if(r.level==='Xã/Phường' && r.axis==='DANG'){
    childTbody.innerHTML = ouaWardDangSubUnits.map((name,i)=>`<tr><td>${name}</td><td>${r.code}-D${i+1}</td><td><span class="pill ${ouaAxisMeta[r.axis].pill}">${ouaAxisMeta[r.axis].name}</span></td><td><span class="pill green">Active</span></td><td><button class="btn small" onclick="ouaToast('Đơn vị: ${name}')">Xem nhanh</button></td></tr>`).join('');
  } else if(r.level==='Xã/Phường'){
    childTbody.innerHTML = [1,2,3,4,5,6,7,8].map(i=>`<tr><td>Văn phòng ${i}</td><td>${r.code}-VP${i}</td><td><span class="pill ${ouaAxisMeta[r.axis].pill}">${ouaAxisMeta[r.axis].name}</span></td><td><span class="pill violet">Chưa có dữ liệu</span></td><td><button class="btn small" onclick="ouaToast('Giả lập — chưa có dữ liệu thật cho Văn phòng ${i}')">Xem nhanh</button></td></tr>`).join('');
  } else if(r.level==='Trung ương' && r.twChildren){
    childTbody.innerHTML = r.twChildren.map(c=>`<tr><td>${c.name}</td><td>${c.code}</td><td><span class="pill ${ouaAxisMeta[r.axis].pill}">${ouaAxisMeta[r.axis].name}</span></td><td><span class="pill green">Active</span></td><td><button class="btn small" onclick="ouaToast('Đơn vị: ${c.name}')">Xem nhanh</button></td></tr>`).join('');
  } else if(r.real){
    /* Đơn vị thật (Phase 2) — lấy đơn vị con trực tiếp bằng parentId trong ouaRealOrgRows (không phải danh sách
       ouaOrgRows đang hiển thị, vì bảng chính không liệt kê hết mọi cấp con để tránh quá dài). */
    const children = (ouaRealOrgRows||[]).filter(x=>x.parentId===r.realId);
    childTbody.innerHTML = children.length ? children.map(c=>`<tr><td>${c.name}</td><td>ORG-${c.id}</td><td><span class="pill ${ouaAxisMeta[r.axis].pill}">${ouaAxisMeta[r.axis].name}</span></td><td><span class="pill ${c.userCount===0?'yellow':'green'}">${c.userCount===0?'Chưa gán người dùng':'Active'}</span></td><td><button class="btn small" onclick="ouaShowOrgDetail('ORG-${c.id}')">Xem nhanh</button></td></tr>`).join('')
      : `<tr><td colspan="5"><div class="empty">Đơn vị này không có đơn vị con trong dữ liệu thật.</div></td></tr>`;
  } else {
    childTbody.innerHTML = `<tr><td colspan="5"><div class="empty">Đơn vị này không có đơn vị con trong IOC.</div></td></tr>`;
  }
  const treeEl = document.getElementById('ouaOrgDetailTree');
  if(r.real){
    /* Dựng chuỗi tổ tiên từ r.path (vd "490.1775.12345") bằng ouaRealOrgRows để vẽ cây breadcrumb thật, thay vì
       cây 2 cấp giả lập (Trục -> Đơn vị) dùng cho khối Trung ương/mock. */
    const idChain = (r.path||'').split('.').filter(Boolean).map(Number);
    const byId = {}; (ouaRealOrgRows||[]).forEach(x=>{ byId[x.id]=x; });
    const chainNodes = idChain.map(id=>byId[id]).filter(Boolean);
    let openTags = 0, html = '';
    chainNodes.forEach((node,i)=>{
      const isLast = i===chainNodes.length-1;
      const label = isLast ? '<small>Đơn vị hiện tại</small>' : `<small>Cấp ${node.level-1}</small>`;
      html += `<li><span class="node">${i===0?'🏛️':(isLast?'📍':'🏢')} <span><b>${node.name}</b>${label}</span></span>`;
      if(!isLast){ html += '<ul>'; openTags++; }
    });
    html += '</ul>'.repeat(openTags);
    treeEl.innerHTML = `<ul>${html}</ul>`;
  } else {
    const rootLabel = r.level==='Trung ương' ? 'Trung ương' : 'Thành phố Hà Nội';
    treeEl.innerHTML = `<ul><li><span class="node">🏛️ <span><b>${rootLabel}</b><small>Root</small></span></span><ul>
      <li><span class="node">🚩 <span><b>${ouaAxisMeta[r.axis].name}</b><small>${r.level==='Trung ương'?'Khối':'Trục'}</small></span></span><ul>
        ${r.level==='Xã/Phường' ? `<li><span class="node">🏘️ <span><b>${r.ward}</b><small>Xã/Phường</small></span></span><ul><li><span class="node">🏛️ <span><b>${r.name}</b><small>Đơn vị hiện tại</small></span></span></li></ul></li>`
          : `<li><span class="node">🏛️ <span><b>${r.name}</b><small>Đơn vị hiện tại</small></span></span></li>`}
      </ul></li>
    </ul></li></ul>`;
  }
  ouaGoPage('org-detail');
}
/* Vẽ đệ quy 1 đơn vị Trung ương + các cấp con thật của nó (chỉ Ban Tổ chức Trung ương có nhiều cấp: Cục → Phòng). */
function ouaRenderTwUnitNode(u){
  const childrenHtml = u.children ? `<ul>${u.children.map(ouaRenderTwUnitNode).join('')}</ul>` : '';
  return `<li><span class="node">🏢 <span><b>${u.name}</b></span></span>${childrenHtml}</li>`;
}
function ouaBuildOrgTreeHtml(){
  const axisKeys = ['DANG','HDND','UBND','MTTQ'];
  const twKeys = ['TW_CTN','TW_DANG','TW_QH','TW_CP','TW_MTTQ'];
  const twBranches = twKeys.map(k=>{
    const units = ouaTwUnits.filter(u=>u.khoi===k);
    return `<li><span class="node">🚩 <span><b>${ouaAxisMeta[k].name}</b><small>${units.length} đơn vị</small></span></span><ul>
      ${units.map(ouaRenderTwUnitNode).join('')}
    </ul></li>`;
  }).join('');
  const branches = axisKeys.map(ax=>{
    const units = ouaOrgRows.filter(r=>r.axis===ax && r.level!=='Xã/Phường');
    const note = units.every(u=>u.placeholder) ? ' — giả lập, chưa có dữ liệu thật' : '';
    return `<li><span class="node">🚩 <span><b>${ouaAxisMeta[ax].name}</b><small>${units.length} đơn vị cấp Thành phố${note}</small></span></span><ul>
      ${units.map(c=>`<li><span class="node">${c.placeholder?'📁':'🏢'} <span><b>${c.name}</b><small>${c.placeholder?'Giả lập':'Thực'}</small></span></span></li>`).join('')}
    </ul></li>`;
  }).join('');
  /* Lồng đủ 4 trục con trong từng xã/phường (dữ liệu đã có sẵn trong ouaOrgRows) — trục Đảng ủy lồng thêm 2 đơn
     vị con thật (Văn phòng đảng ủy, Ban Tuyên giáo và Dân vận) đúng theo cơ cấu tổ chức thật. */
  const wardItems = ouaWardNames.map(w=>{
    const axisNodes = axisKeys.map(ax=>{
      const r = ouaOrgRows.find(x=>x.level==='Xã/Phường' && x.ward===w && x.axis===ax);
      const subHtml = ax==='DANG' ? `<ul>${ouaWardDangSubUnits.map(n=>`<li><span class="node">🏢 ${n}</span></li>`).join('')}</ul>` : '';
      return `<li><span class="node">🚩 <span><b>${r?r.name:ouaAxisMeta[ax].name}</b></span></span>${subHtml}</li>`;
    }).join('');
    return `<li><span class="node">🏘️ <span><b>${w}</b></span></span><ul>${axisNodes}</ul></li>`;
  }).join('');
  return `<div class="tree" style="max-height:60vh;overflow:auto"><ul>
    <li><span class="node">🏛️ <span><b>Trung ương</b><small>5 khối</small></span></span><ul>${twBranches}</ul></li>
    <li><span class="node">🏛️ <span><b>Thành phố Hà Nội</b><small>Root · 04 trục</small></span></span><ul>
      ${branches}
      <li><span class="node">🏘️ <span><b>Xã/Phường</b><small>${ouaWardNames.length} đơn vị cấp xã/phường</small></span></span><ul>${wardItems}</ul></li>
    </ul></li>
  </ul></div>`;
}
/* Cây đơn vị THẬT (Phase 2) — thay ouaBuildOrgTreeHtml() ở trên (giữ nguyên, không xoá, dùng cho modal
   orgTreeModal cũ không còn nút gọi tới). Dựng theo đúng quan hệ cha-con thật (parentId) từ ouaRealOrgRows,
   không còn gom phẳng theo trục như bản cũ. */
function ouaBuildRealOrgTreeHtml(){
  if(!ouaRealOrgRows) ouaBuildRealData();
  const twKeys = ['TW_CTN','TW_DANG','TW_QH','TW_CP','TW_MTTQ'];
  const twBranches = twKeys.map(k=>{
    const units = ouaTwUnits.filter(u=>u.khoi===k);
    return `<li><span class="node">🚩 <span><b>${ouaAxisMeta[k].name}</b><small>${units.length} đơn vị</small></span></span><ul>${units.map(ouaRenderTwUnitNode).join('')}</ul></li>`;
  }).join('');
  const byParent = {};
  ouaRealOrgRows.forEach(r=>{
    const key = r.parentId===null||r.parentId===undefined ? 'root' : r.parentId;
    (byParent[key]=byParent[key]||[]).push(r);
  });
  function renderReal(node){
    const kids = byParent[node.id]||[];
    const icon = node.level<=1 ? '🏛️' : (node.level===2 ? '🚩' : (node.level>=5 ? '🏘️' : '🏢'));
    const childHtml = kids.length ? `<ul>${kids.map(renderReal).join('')}</ul>` : '';
    return `<li><span class="node">${icon} <span><b>${node.name}</b><small>${node.userCount} nhân sự${kids.length?` · ${kids.length} đơn vị con`:''}</small></span></span>${childHtml}</li>`;
  }
  const rootNode = ouaRealOrgRows.find(r=>r.level===1);
  const realTreeHtml = rootNode ? renderReal(rootNode) : '<li>Không có dữ liệu.</li>';
  return `<div class="tree" style="max-height:60vh;overflow:auto"><ul>
    <li><span class="node">🏛️ <span><b>Trung ương / BTCTW</b><small>5 khối (mô phỏng, chưa có trong dữ liệu thật)</small></span></span><ul>${twBranches}</ul></li>
    ${realTreeHtml}
  </ul></div>`;
}
function ouaSetOrgView(mode){
  const tableWrap = document.getElementById('ouaOrgTableWrap');
  const treeWrap = document.getElementById('ouaOrgTreeWrap');
  const btnTable = document.getElementById('ouaOrgViewTableBtn');
  const btnTree = document.getElementById('ouaOrgViewTreeBtn');
  if(!tableWrap || !treeWrap) return;
  if(mode==='tree'){
    tableWrap.classList.add('hidden');
    treeWrap.classList.remove('hidden');
    treeWrap.innerHTML = ouaBuildRealOrgTreeHtml();
    btnTree.classList.add('primary'); btnTable.classList.remove('primary');
  } else {
    treeWrap.classList.add('hidden');
    tableWrap.classList.remove('hidden');
    btnTable.classList.add('primary'); btnTree.classList.remove('primary');
  }
}
function ouaInitOrgData(){
  if(!ouaRealOrgRows) ouaBuildRealData();
  ouaOrgRows = ouaBuildOrgRowsFromReal();
  ouaUpdateOrgKpis();
  ouaFilterOrgList();
}
function ouaSubmitNewOrg(){
  const name = (document.getElementById('newOrgName')?.value||'').trim();
  const axis = document.getElementById('newOrgAxis')?.value || 'UBND';
  const parentName = (document.getElementById('newOrgParent')?.value||'').trim() || 'THÀNH PHỐ HÀ NỘI';
  if(!name){ ouaToast('Vui lòng nhập tên đơn vị.'); return; }
  const newRow = {
    code:'ORG-NEW-'+Date.now(), name, axis, level:'Cấp mới', parent:parentName,
    sub:'Đơn vị mới tạo (demo — chỉ lưu trong phiên làm việc, chưa ghi backend)',
    source:'IOC nội bộ', status:'review', placeholder:false, real:false, manualNew:true
  };
  ouaOrgRows.unshift(newRow);
  ouaUpdateOrgKpis();
  ouaFilterOrgList();
  ouaCloseModal();
  ouaToast(`Đã thêm đơn vị "${name}" (demo, chỉ lưu tạm trong phiên làm việc).`);
}

/* ===== Adapter dữ liệu THẬT (data/account.json -> js/core/account-data.js -> window.OUA_ACCOUNT_DATA) =====
   Đây là dữ liệu thật (cây đơn vị + người dùng Thành phố Hà Nội, dump từ API administrator.lifetex.vn), dùng
   tĩnh (không fetch sống) cho các màn quản trị mới/nâng cấp. Khối BTCTW (Trung ương) không có trong dữ liệu này
   nên vẫn dùng ouaTwUnits (mock) như cũ ở phần "Quản lý đơn vị" hiện tại — 2 nguồn dữ liệu tồn tại song song. */
let ouaRealOrgRows = null;
let ouaRealUserRows = null;
function ouaInferAxisFromName(name){
  if(!name) return null;
  if(/Thành ủy|Đảng ủy|Đảng bộ/i.test(name)) return 'DANG';
  if(/HĐND/i.test(name)) return 'HDND';
  if(/UBND|Sở |Ban Quản lý|Thanh tra/i.test(name)) return 'UBND';
  if(/MTTQ/i.test(name)) return 'MTTQ';
  return null;
}
/* Tên xã/phường của 1 đơn vị — tên đơn vị cấp xã viết thường ("HĐND phường Định Công", "Đảng ủy xã An Khánh")
   nên regex không phân biệt hoa thường, loại "Xã hội" như OUA_WARD_NAME_RE. Trả về "xã An Khánh"/"phường Láng". */
const OUA_WARD_IN_NAME_RE = /(?:^|\s)((?:phường|xã)\s(?!hội).+)$/i;
function ouaWardFromOrgName(name){
  const m = (name||'').match(OUA_WARD_IN_NAME_RE);
  if(!m) return null;
  // Dữ liệu gốc lẫn 2 kiểu bỏ dấu ("Hoà"/"Hòa") giữa trục Đảng và 3 trục còn lại — gộp về kiểu "Hòa" để 1 xã không thành 2.
  const OLD_TONE = {'oà':'òa','oá':'óa','oả':'ỏa','oã':'õa','oạ':'ọa','oè':'òe','oé':'óe','oẻ':'ỏe','oẽ':'õe','oẹ':'ọe'};
  const w = m[1].normalize('NFC').replace(/o[àáảãạèéẻẽẹ](?!\p{L})/gu, s=>OLD_TONE[s]||s); // chỉ cuối âm tiết, không đụng "Đoài", "Khoái"
  return w.charAt(0).toLowerCase() + w.slice(1);
}
function ouaBuildRealData(){
  const rows = [], users = [];
  function walk(node, parentAxis, parentName, parentWard, parentSo){
    const axis = ouaInferAxisFromName(node.name) || parentAxis || null;
    // Chỉ nhận xã/phường ở đơn vị nằm ngay dưới nút gom "… Xã, Phường" — tránh nhầm "Trường PTCS Xã Đàn",
    // "Phòng Ngân sách cấp xã", "Chi nhánh thị xã Sơn Tây" trong khối Sở.
    // Nút gom: "HĐND Xã, Phường", "MTTQ Xã, Phường", "Xã, Phường" (UBND), "Đảng bộ trực thuộc" (Đảng ủy xã/phường).
    const ward = parentWard || (/Xã,\s*Phường|Đảng bộ trực thuộc/i.test(parentName||'') ? ouaWardFromOrgName(node.name) : null);
    const soName = parentSo || (parentName === 'Sở ngành' ? node.name : null); // con trực tiếp của nút gom "Sở ngành" (gồm cả Ban QL, Thanh tra…)
    rows.push({
      id: node.id, name: node.name, path: node.path, level: node.level,
      parentId: node.parent_id, parentName: parentName || null, axis,
      childCount: (node.children||[]).length, userCount: (node.users||[]).length
    });
    (node.users||[]).forEach(u=>{
      users.push({
        id: u.egov_user_id, name: u.name, label: u.label, email: u.email,
        position: u.position, positionLevel: u.position_level,
        jobTitle: u.job_title, jobTitleLevel: u.job_title_level,
        orgId: node.id, orgName: node.name, orgPath: node.path, level: node.level, axis, ward, soName
      });
    });
    (node.children||[]).forEach(c=>walk(c, axis, node.name, ward, soName));
  }
  if(typeof OUA_ACCOUNT_DATA !== 'undefined' && OUA_ACCOUNT_DATA){
    walk(OUA_ACCOUNT_DATA, null, null);
  }
  ouaRealOrgRows = rows;
  ouaRealUserRows = users;
  ouaAssignDemoAccountMeta(users);
  ouaSeedLockedDemoAccounts(users);
}
/* account.json không có ngày tạo/lần đăng nhập cuối — sinh ngẫu nhiên cho mục đích DEMO các ô thống kê ở màn
   "Quản lý người dùng" (Tổng/Tạo mới/Chưa đăng nhập/Đã đăng nhập). ~4% tài khoản "mới tạo" trong 30 ngày gần
   nhất, ~18% "chưa đăng nhập" (lastLoginAt=null) — tỉ lệ chọn tùy ý cho demo, không phải số liệu thật. */
function ouaAssignDemoAccountMeta(users){
  const now = Date.now(), DAY = 86400000;
  /* Có nguồn dùng chung js/core/login-log-data.js (2026-10-14): ngày tạo cố định theo id, "lần đăng nhập gần nhất" =
     lượt thành công mới nhất trong Nhật ký đăng nhập — khớp với trang Nhật ký đăng nhập và bản mobile. */
  if(typeof LOGIN_LOG !== 'undefined'){
    users.forEach(u=>{ const m = LOGIN_LOG.meta(u.id); if(m){ u.createdAt = m.createdAt; u.lastLoginAt = LOGIN_LOG.lastLogin(u.id); } });
    return;
  }
  users.forEach(u=>{
    const isNew = Math.random() < 0.04;
    const daysAgo = isNew ? Math.floor(Math.random()*30) : 30 + Math.floor(Math.random()*700);
    u.createdAt = now - daysAgo*DAY - Math.floor(Math.random()*DAY);
    u.lastLoginAt = Math.random() < 0.18 ? null : (now - Math.floor(Math.random()*60)*DAY - Math.floor(Math.random()*DAY));
  });
}
let ouaLockedSeeded = false;
function ouaSeedLockedDemoAccounts(users){
  if(ouaLockedSeeded || !users.length) return;
  if(typeof LOGIN_LOG !== 'undefined'){ // cùng danh sách khóa với Nhật ký đăng nhập và bản mobile
    users.forEach(u=>{ const m = LOGIN_LOG.meta(u.id); if(m && m.locked) ouaLockedUserIds.add(String(u.id)); });
    ouaLockedSeeded = true;
    return;
  }
  const sampleSize = Math.max(3, Math.round(users.length*0.01));
  for(let i=0;i<sampleSize;i++){
    ouaLockedUserIds.add(String(users[Math.floor(Math.random()*users.length)].id));
  }
  ouaLockedSeeded = true;
}
/* Nhãn "admin" ở màn Admin Tổng là suy luận demo từ chức vụ (position) — không phải quyền RBAC thật. */
function ouaIsAdminCandidate(u){
  return !!(u.position && /Lãnh đạo|Chủ tịch|Giám đốc|Trưởng|Bí thư|Chánh/i.test(u.position));
}
/* "Xã " là tiền tố cấp hành chính (Xã Đoài, Xã Cổ Đô...) nhưng cũng là 3 ký tự đầu của "Xã hội" (Ban Văn hóa -
   Xã hội...) — dùng regex riêng loại trừ "Xã hội" để không đếm nhầm các ban/phòng chuyên môn thành "địa bàn". */
const OUA_WARD_NAME_RE = /Phường\s|Xã\s(?!hội)/;
function ouaOrgLooksLikeWard(orgName){ return OUA_WARD_NAME_RE.test(orgName||''); }
const ouaRevokedAdminIds = new Set();
function ouaComputeAdminKpis(){
  const byAxis = {DANG:0, HDND:0, UBND:0, MTTQ:0};
  let total=0, soCount=0, diaBanCount=0;
  (ouaRealUserRows||[]).forEach(u=>{
    if(!ouaIsAdminCandidate(u)) return;
    total++;
    if(u.axis && byAxis.hasOwnProperty(u.axis)) byAxis[u.axis]++;
    if(/Sở /.test(u.orgName||'')) soCount++;
    if(ouaOrgLooksLikeWard(u.orgName)) diaBanCount++;
  });
  return {total, byAxis, soCount, diaBanCount};
}
function ouaRenderAdminOverview(){
  if(!ouaRealUserRows) ouaBuildRealData();
  const v1 = document.getElementById('ouaAdminV1'), v2 = document.getElementById('ouaAdminV2');
  if(v1) v1.style.display = OUA_ADMIN_TONG_V2 ? 'none' : '';
  if(v2) v2.style.display = OUA_ADMIN_TONG_V2 ? '' : 'none';
  if(OUA_ADMIN_TONG_V2 && v2){ ouaAdmRender(); return; }
  const kpi = ouaComputeAdminKpis();
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent = val.toLocaleString('vi-VN');};
  set('ouaKpiAdminTotal', kpi.total);
  set('ouaKpiAdminTw', ouaTwUnits.length);
  set('ouaKpiAdminDang', kpi.byAxis.DANG);
  set('ouaKpiAdminHdnd', kpi.byAxis.HDND);
  set('ouaKpiAdminUbnd', kpi.byAxis.UBND);
  set('ouaKpiAdminMttq', kpi.byAxis.MTTQ);
  set('ouaKpiAdminSo', kpi.soCount);
  set('ouaKpiAdminDiaBan', kpi.diaBanCount);
  ouaFilterAdminUsers();
}
let ouaAdminFilterMode = 'all';
function ouaSetAdminFilterMode(mode, btn){
  ouaAdminFilterMode = mode;
  const wrap = document.getElementById('adminUserFilterButtons');
  if(wrap) wrap.querySelectorAll('.btn').forEach(b=>b.classList.remove('primary'));
  if(btn) btn.classList.add('primary');
  ouaFilterAdminUsers();
}
/* ouaRealUserRows được duyệt theo thứ tự cây (đơn vị con của HĐND Thành phố đứng đầu mảng) — nếu lấy thẳng
   200 phần tử đầu sau filter thì toàn bộ trang chỉ toàn người thuộc 1 nhánh đứng đầu (bug đã gặp: 200 dòng đều
   là HĐND). Trộn xen kẽ theo trục (round-robin) trước khi cắt 200 dòng để mẫu hiển thị đại diện đủ các trục. */
function ouaInterleaveByAxis(list){
  const groups = {};
  list.forEach(u=>{ const k = u.axis || '_none'; (groups[k] = groups[k] || []).push(u); });
  const keys = Object.keys(groups);
  const result = [];
  for(let i = 0; result.length < list.length; i++){
    let addedAny = false;
    for(const k of keys){ if(groups[k][i]){ result.push(groups[k][i]); addedAny = true; } }
    if(!addedAny) break;
  }
  return result;
}
function ouaFilterAdminUsers(){
  if(!ouaRealUserRows) return;
  const q = (document.getElementById('ouaAdminUserSearch')?.value || '').trim().toLowerCase();
  const mode = document.getElementById('ouaAdminModeSel')?.value || '';
  let list = ouaRealUserRows.filter(ouaIsAdminCandidate);
  if(mode==='so') list = list.filter(u=>/Sở /.test(u.orgName||''));
  if(mode==='diaban') list = list.filter(u=>ouaOrgLooksLikeWard(u.orgName));
  if(q) list = list.filter(u => (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || (u.label||'').toLowerCase().includes(q));
  if(ouaAdminFilterMode==='granted') list = list.filter(u=>!ouaRevokedAdminIds.has(u.id));
  if(ouaAdminFilterMode==='ungranted') list = list.filter(u=>ouaRevokedAdminIds.has(u.id));
  const countEl = document.getElementById('ouaAdminUserCount');
  /* "Theo trục": gom nhóm theo trục (Đảng ủy -> HĐND -> UBND -> MTTQ) thay vì trộn xen kẽ, để dễ rà soát từng
     trục liền mạch. Các chế độ còn lại vẫn trộn xen kẽ (ouaInterleaveByAxis) để mẫu 200 dòng đại diện đủ trục. */
  const shown = (mode==='axis' ? [...list].sort((a,b)=>(a.axis||'').localeCompare(b.axis||'')) : ouaInterleaveByAxis(list)).slice(0, 200);
  if(countEl) countEl.dataset.base = `Hiển thị ${shown.length.toLocaleString('vi-VN')} / ${list.length.toLocaleString('vi-VN')} kết quả (tối đa 200 dòng cho bản demo)`;
  ouaRefreshAdminUserCountText();
  ouaRenderAdminUserRows(shown);
}
const ouaSelectedAdminUserIds = new Set();
function ouaRefreshAdminUserCountText(){
  const countEl = document.getElementById('ouaAdminUserCount');
  if(!countEl) return;
  const base = countEl.dataset.base || '';
  const selCount = ouaSelectedAdminUserIds.size;
  countEl.textContent = base + (selCount ? ` · (Đang chọn ${selCount.toLocaleString('vi-VN')} người)` : '');
}
function ouaToggleAdminUserSelect(id, checked){
  if(checked) ouaSelectedAdminUserIds.add(id); else ouaSelectedAdminUserIds.delete(id);
  ouaRefreshAdminUserCountText();
}
function ouaToggleSelectAllAdminUsers(checked){
  document.querySelectorAll('#ouaAdminUserTbody .oua-admin-row-check').forEach(cb=>{
    cb.checked = checked;
    const id = Number(cb.dataset.id);
    if(checked) ouaSelectedAdminUserIds.add(id); else ouaSelectedAdminUserIds.delete(id);
  });
  ouaRefreshAdminUserCountText();
}
function ouaRenderAdminUserRows(list){
  const tbody = document.getElementById('ouaAdminUserTbody');
  const cardsEl = document.getElementById('ouaAdminUserCardsMobile');
  if(!tbody) return;
  if(!list.length){
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Không có kết quả phù hợp.</td></tr>';
    if(cardsEl) cardsEl.innerHTML = `<div class="empty">Không có kết quả phù hợp.</div>`;
    return;
  }
  tbody.innerHTML = list.map(u=>{
    const wardMatch = (u.orgName||'').match(/(Phường\s.+|Xã\s(?!hội).+)/);
    const diaBan = wardMatch ? wardMatch[0] : 'Toàn thành phố';
    const axisLabel = u.axis && ouaAxisMeta[u.axis] ? ouaAxisMeta[u.axis].name : '—';
    const revoked = ouaRevokedAdminIds.has(u.id);
    const checked = ouaSelectedAdminUserIds.has(u.id);
    return `<tr>
      <td class="oua-td-check"><input type="checkbox" class="oua-admin-row-check" data-id="${u.id}" ${checked?'checked':''} onchange="ouaToggleAdminUserSelect(${u.id}, this.checked)"></td>
      <td class="oua-td-title" data-th="Người dùng"><b>${u.name||'—'}</b><div class="muted">${u.email||u.label||''}</div></td>
      <td data-th="Địa bàn"><span class="pill violet">📍 ${diaBan}</span></td>
      <td data-th="Đơn vị / Trục công tác"><span class="pill">${u.orgName||'—'}</span> ${u.axis?`<span class="pill yellow">${axisLabel}</span>`:''}</td>
      <td data-th="Quyền Admin hiện tại">${revoked ? '<span class="pill">Chưa cấp quyền</span>' : `<span class="pill green">Admin ${axisLabel}<button style="margin-left:6px;border:none;background:transparent;color:inherit;cursor:pointer;font-weight:900" onclick="ouaRevokeAdmin(${u.id})">×</button></span>`}</td>
    </tr>`;
  }).join('');
  if(cardsEl) cardsEl.innerHTML = list.map(u=>{
    const wardMatch = (u.orgName||'').match(/(Phường\s.+|Xã\s(?!hội).+)/);
    const diaBan = wardMatch ? wardMatch[0] : 'Toàn thành phố';
    const axisLabel = u.axis && ouaAxisMeta[u.axis] ? ouaAxisMeta[u.axis].name : '—';
    const revoked = ouaRevokedAdminIds.has(u.id);
    const checked = ouaSelectedAdminUserIds.has(u.id);
    return `<div class="oua-m-card ${revoked?'blue':'green'}" style="position:relative">
      <label style="position:absolute;top:var(--m-sp-4);right:var(--m-sp-4)"><input type="checkbox" class="oua-admin-row-check" data-id="${u.id}" ${checked?'checked':''} onchange="ouaToggleAdminUserSelect(${u.id}, this.checked)"></label>
      <div class="oua-m-card-title" style="padding-right:28px">${u.name||'—'}</div>
      <div class="oua-m-card-sub">${u.email||u.label||'—'}</div>
      <div class="oua-m-card-chips">
        <span class="oua-m-chip violet">📍 ${diaBan}</span>
        <span class="oua-m-chip ghost wrap">${u.orgName||'—'}</span>
      </div>
      <div class="oua-m-card-actions" style="justify-content:flex-end">
        ${revoked ? '<span class="oua-m-chip ghost">Chưa cấp quyền</span>' : `<span class="oua-m-chip green">Admin ${axisLabel}<button onclick="ouaRevokeAdmin(${u.id})" style="border:none;background:transparent;color:inherit;cursor:pointer;font-weight:900;margin-left:4px;padding:0">×</button></span>`}
      </div>
    </div>`;
  }).join('');
}
function ouaRevokeAdmin(id){
  ouaRevokedAdminIds.add(id);
  ouaFilterAdminUsers();
  ouaToast('Đã gỡ quyền admin (demo, chưa ghi backend).');
}

/* ===== Quản trị Tổng v2 (2026-10-19) — làm lại theo ảnh màn "Phân Quyền Quản Trị Hệ Thống" anh gửi:
   6 ô KPI (tổng + 4 trục + Quản trị địa bàn), khối cấu hình hình thức phân quyền + nút gán hàng loạt, tab 4 trục,
   bảng toàn bộ người dùng trong phạm vi (không chỉ ứng viên lãnh đạo như bản cũ).
   Bản cũ (8 ô KPI, #ouaAdminV1) giữ nguyên, ẩn bằng cờ OUA_ADMIN_TONG_V2.
   Quyền Quản trị vẫn là dữ liệu DEMO: mồi ban đầu suy từ chức vụ (ouaIsAdminCandidate), gán/gỡ chỉ trong phiên. */
const OUA_ADMIN_TONG_V2 = true;
const OUA_ADM_MODES = {
  diaban:{label:'Quản trị địa bàn', icon:'🏘️', who:'người dùng địa bàn',
    info:'<b>Quyền Quản trị địa bàn:</b> Cán bộ được cấp sẽ có toàn quyền quản trị, xem và điều hành tất cả các trục <b>(Đảng ủy, HĐND, UBND, MTTQ)</b> trên phạm vi địa bàn của tài khoản (xã, phường hoặc cấp thành phố).'},
  axis:{label:'Quản trị trục', icon:'🚩', who:'người dùng',
    info:'<b>Quyền Quản trị trục:</b> Cán bộ được cấp sẽ quản trị người dùng, đơn vị và dữ liệu của <b>một trục công tác</b> (Đảng ủy, HĐND, UBND hoặc MTTQ) mà tài khoản đang thuộc, trên phạm vi toàn thành phố.'},
  so:{label:'Quản trị Sở/Ngành', icon:'📘', who:'người dùng khối Sở/Ngành',
    info:'<b>Quyền Quản trị Sở/Ngành:</b> Cán bộ được cấp sẽ quản trị người dùng và dữ liệu của Sở/Ngành mình cùng các đơn vị trực thuộc.'}
};
const OUA_ADM_AXES = {
  DANG:{name:'Đảng ủy', icon:'🚩', color:'#ff5e7a'},
  HDND:{name:'HĐND', icon:'🏛️', color:'#f7b500'},
  UBND:{name:'UBND', icon:'🏢', color:'#14c38e'},
  MTTQ:{name:'MTTQ', icon:'🤝', color:'#8a7cff'}
};
const OUA_ADM_AVATAR_COLORS = ['#3b6fd6','#6c5ce7','#0f9d8a','#d97706','#c2410c','#2563eb','#7c3aed','#0891b2'];
const ouaAdmGrants = {diaban:new Map(), axis:new Map(), so:new Map()}; // id người dùng -> phạm vi (tên xã / mã trục / tên Sở)
const ouaAdmSelected = new Set();
let ouaAdmSeeded = false, ouaAdmTab = 'all', ouaAdmGrantFilter = 'all', ouaAdmLimit = 200, ouaAdmUserMap = null;
/* 2026-10-21 (anh yêu cầu): màn hiện ĐỦ mọi tài khoản (12.577 = khớp màn Quản lý người dùng), không lọc theo hình
   thức phân quyền nữa; tab trục = người ĐÃ có Quản trị của trục đó, thêm tab "Không phải Quản trị". Tài khoản không
   thuộc xã/phường (cấp Thành phố + khối Sở) có địa bàn "Thành phố Hà Nội". Đặt false để quay về bản 2026-10-19
   (danh sách chỉ người trong phạm vi hình thức đang chọn, tab trục = toàn bộ người của trục, có 3 chip lọc quyền). */
const OUA_ADM_FULL_POP = true;
const OUA_ADM_CITY = 'Thành phố Hà Nội';
function ouaAdmScopeOf(mode, u){ return mode==='diaban' ? (u.ward || (OUA_ADM_FULL_POP ? OUA_ADM_CITY : null)) : mode==='axis' ? u.axis : u.soName; }
function ouaAdmMode(){ const v = document.getElementById('ouaAdmModeSel')?.value; return OUA_ADM_MODES[v] ? v : 'diaban'; }
function ouaAdmUser(id){
  if(!ouaAdmUserMap || ouaAdmUserMap.src !== ouaRealUserRows){ ouaAdmUserMap = new Map(ouaRealUserRows.map(u=>[u.id,u])); ouaAdmUserMap.src = ouaRealUserRows; }
  return ouaAdmUserMap.get(id);
}
/* Mồi quyền ban đầu (demo): mỗi xã/phường 1 Quản trị địa bàn (ưu tiên người trục Đảng ủy), mỗi trục 2 Quản trị trục
   cấp Thành phố, mỗi Sở 1 Quản trị Sở — lấy người đầu tiên có chức vụ lãnh đạo trong phạm vi đó. */
function ouaAdmSeed(){
  if(ouaAdmSeeded || !ouaRealUserRows) return;
  /* Quản trị địa bàn: 1 người/xã, trục ưu tiên xoay vòng Đảng ủy → UBND → HĐND → MTTQ theo thứ tự xã, để 4 ô KPI trục
     đều có số (bản đầu dồn hết vào Đảng ủy, 3 ô còn lại = 0 trông như lỗi). Xã không có ứng viên ở trục đến lượt thì lấy trục khác. */
  const AX_ROT = ['DANG','UBND','HDND','MTTQ'];
  const wardOrder = [...new Set(ouaRealUserRows.map(u=>u.ward).filter(Boolean))];
  const wardPref = {}; wardOrder.forEach((w,i)=>wardPref[w] = AX_ROT[i % AX_ROT.length]);
  const wardRows = [...ouaRealUserRows].sort((a,b)=>(a.axis===wardPref[a.ward]?0:1)-(b.axis===wardPref[b.ward]?0:1));
  const seed = (mode, perScope, rows, extra) => {
    const cnt = {};
    rows.forEach(u=>{
      const s = ouaAdmScopeOf(mode, u);
      if(!s || !ouaIsAdminCandidate(u) || (extra && !extra(u)) || (cnt[s]||0) >= perScope) return;
      cnt[s] = (cnt[s]||0) + 1;
      ouaAdmGrants[mode].set(u.id, s);
    });
  };
  seed('diaban', 1, wardRows);
  seed('axis', 2, ouaRealUserRows, u=>!u.ward && !u.soName);
  seed('so', 1, ouaRealUserRows);
  ouaAdmSeeded = true;
}
function ouaAdmPopulation(mode){ return OUA_ADM_FULL_POP ? ouaRealUserRows : ouaRealUserRows.filter(u=>!!ouaAdmScopeOf(mode, u)); }
function ouaAdmRender(){
  if(!ouaRealUserRows) ouaBuildRealData();
  ouaAdmSeed();
  ouaAdmModeChanged(true);
}
/* Ô KPI (chốt lại 2026-10-19 theo anh):
   - Tổng người dùng = đúng số tài khoản đang có trong danh sách bên dưới (= tab "Tất cả", đã áp ô tìm kiếm).
   - 4 ô trục = số tài khoản ĐÃ CÓ quyền Quản trị (theo hình thức đang chọn) thuộc trục đó.
   - Ô hình thức (⭐) = tổng tài khoản Quản trị; ô "Không phải Quản trị" = phần còn lại → Tổng = ⭐ + Không phải. */
/* Bản đủ tài khoản (2026-10-21, anh chốt): "là Quản trị" = có BẤT KỲ quyền nào trong 3 hình thức, không chỉ hình
   thức đang chọn — tránh người có Quản trị trục vẫn nằm ở tab "Không phải Quản trị" khi đang chọn Quản trị địa bàn.
   Hình thức đang chọn chỉ còn quyết định loại quyền được gán khi bấm nút. */
function ouaAdmIsAdmin(u){ return Object.keys(OUA_ADM_MODES).some(m=>ouaAdmGrants[m].has(u.id)); }
function ouaAdmIsAdminFn(mode){ const grants = ouaAdmGrants[mode]; return OUA_ADM_FULL_POP ? ouaAdmIsAdmin : u=>grants.has(u.id); }
function ouaAdmRenderKpis(mode, pop){
  const m = OUA_ADM_MODES[mode], isAdm = ouaAdmIsAdminFn(mode);
  const set = (id, html)=>{ const el = document.getElementById(id); if(el) el.innerHTML = html; };
  const n = v => v.toLocaleString('vi-VN');
  let admins = 0;
  Object.keys(OUA_ADM_AXES).forEach(ax=>{
    const users = pop.filter(u=>u.axis===ax);
    const axAdmins = users.filter(isAdm).length;
    set('ouaAdmKpi_'+ax, n(axAdmins));
    set('ouaAdmKpiHint_'+ax, `Quản trị · trên ${n(users.length)} tài khoản`);
  });
  pop.forEach(u=>{ if(isAdm(u)) admins++; });
  set('ouaAdmKpiTotal', n(pop.length));
  set('ouaAdmKpiTotalHint', OUA_ADM_FULL_POP ? 'Toàn bộ tài khoản hệ thống' : `${m.who.charAt(0).toUpperCase() + m.who.slice(1)} · 4 trục`);
  set('ouaAdmKpiDiaBan', n(admins));
  if(OUA_ADM_FULL_POP){
    // Dòng phụ tách theo hình thức; 1 người có thể có nhiều loại quyền nên 3 số cộng lại có thể lớn hơn số lớn.
    const by = k => pop.filter(u=>ouaAdmGrants[k].has(u.id)).length;
    set('ouaAdmKpiGrantLbl', '⭐ Tài khoản Quản trị');
    set('ouaAdmKpiGrantHint', `Địa bàn ${n(by('diaban'))} · Trục ${n(by('axis'))} · Sở ${n(by('so'))}`);
    set('ouaAdmKpiNonAdmin', n(pop.length - admins));
    set('ouaAdmKpiNonAdminHint', 'Chưa được cấp quyền Quản trị nào');
    return;
  }
  set('ouaAdmKpiGrantLbl', `⭐ ${m.label}`);
  set('ouaAdmKpiGrantHint', 'Tổng tài khoản đã cấp quyền');
  set('ouaAdmKpiNonAdmin', n(pop.length - admins));
  set('ouaAdmKpiNonAdminHint', 'Chưa được cấp ' + m.label);
}
/* Đổi hình thức phân quyền: cập nhật khối giải thích + nhãn nút gán, bỏ chọn (người đã tick có thể nằm ngoài phạm vi mới). */
function ouaAdmModeChanged(keepSelection){
  const m = OUA_ADM_MODES[ouaAdmMode()];
  const info = document.getElementById('ouaAdmInfoText'); if(info) info.innerHTML = m.info;
  ['ouaAdmGrantedChip','ouaAdmUngrantedChip'].forEach((id,i)=>{ const el = document.getElementById(id); if(el) el.textContent = (i ? 'Chưa có quyền ' : 'Đã có quyền ') + m.label; });
  // Bản đủ tài khoản: 3 chip lọc quyền trùng với tab nên ẩn; tab "Không phải Quản trị" chỉ có ở bản này.
  document.querySelectorAll('#ouaAdminV2 .oua-adm-chips').forEach(el=>el.style.display = OUA_ADM_FULL_POP ? 'none' : '');
  document.querySelectorAll('#ouaAdminV2 .oua-adm-tab[data-tab="non"]').forEach(el=>el.style.display = OUA_ADM_FULL_POP ? '' : 'none');
  if(!keepSelection) ouaAdmSelected.clear();
  ouaAdmFilter(true);
}
/* Bản đủ tài khoản: tab = đúng tập ô KPI cùng tên (tab trục → Quản trị của trục, "non" → chưa có Quản trị). */
function ouaAdmSetTab(tab){
  if(OUA_ADM_FULL_POP){ ouaAdmKpiClick(tab==='non' ? 'ungranted' : tab); return; }
  ouaAdmTab = tab; ouaAdmSyncFilterUi(); ouaAdmFilter(true);
}
function ouaAdmSetGrantFilter(f){ ouaAdmGrantFilter = f; ouaAdmSyncFilterUi(); ouaAdmFilter(true); }
/* Bấm ô KPI = lọc bảng đúng tập ô đó đang đếm: Tổng → tất cả; ô trục → Quản trị của trục; ⭐ → mọi Quản trị;
   "Không phải Quản trị" → người chưa được cấp quyền. */
function ouaAdmKpiClick(k){
  if(k==='all'){ ouaAdmTab = 'all'; ouaAdmGrantFilter = 'all'; }
  else if(k==='granted' || k==='ungranted'){ ouaAdmTab = 'all'; ouaAdmGrantFilter = k; }
  else { ouaAdmTab = k; ouaAdmGrantFilter = 'granted'; }
  ouaAdmSyncFilterUi();
  ouaAdmFilter(true);
}
function ouaAdmSyncFilterUi(){
  const t = ouaAdmTab, f = ouaAdmGrantFilter;
  const kpi = f==='all' ? (t==='all' ? 'all' : null) : t==='all' ? f : (f==='granted' ? t : null);
  const activeTab = !OUA_ADM_FULL_POP ? t : kpi==='ungranted' ? 'non' : kpi==='granted' ? null : kpi;
  document.querySelectorAll('#ouaAdminV2 .oua-adm-tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===activeTab));
  document.querySelectorAll('#ouaAdminV2 .oua-adm-chipf').forEach(b=>b.classList.toggle('active', b.dataset.f===f));
  document.querySelectorAll('#ouaAdminV2 .oua-adm-kpi[data-kpi]').forEach(b=>b.classList.toggle('active', b.dataset.kpi===kpi));
}
/* 2026-10-19: anh yêu cầu bảng hiện ĐỦ mọi tài khoản trong phạm vi (bỏ giới hạn 200 dòng + nút "Xem thêm").
   Đặt cờ về false để quay lại kiểu 200 dòng/lần. Danh sách dài (tới 12.576 người) nên nạp dần OUA_ADM_CHUNK dòng khi cuộn tới. */
const OUA_ADM_SHOW_ALL = true;
const OUA_ADM_CHUNK = 400;
function ouaAdmMore(){ ouaAdmLimit += 200; ouaAdmFilter(false); }
let ouaAdmShown = [], ouaAdmRenderToken = 0;
/* skipRows: chỉ cập nhật số liệu (KPI, tab, dòng tổng), giữ nguyên các dòng đã vẽ — dùng khi gán/gỡ quyền để
   không vẽ lại cả nghìn dòng và không làm nhảy vị trí cuộn. */
function ouaAdmFilter(resetLimit, skipRows){
  if(!ouaRealUserRows) return;
  if(resetLimit) ouaAdmLimit = 200;
  const mode = ouaAdmMode(), isAdm = ouaAdmIsAdminFn(mode);
  const q = (document.getElementById('ouaAdmSearch')?.value || '').trim().toLowerCase();
  let pop = ouaAdmPopulation(mode);
  if(q) pop = pop.filter(u => [u.name, u.email, u.label, u.orgName, u.ward, u.soName].some(s=>(s||'').toLowerCase().includes(q)));
  ouaAdmRenderKpis(mode, pop);
  const counts = {all:pop.length, non:0}; Object.keys(OUA_ADM_AXES).forEach(a=>counts[a]=0);
  if(OUA_ADM_FULL_POP) pop.forEach(u=>{ if(!isAdm(u)) counts.non++; else if(counts[u.axis]!=null) counts[u.axis]++; });
  else pop.forEach(u=>{ if(counts[u.axis]!=null) counts[u.axis]++; });
  Object.keys(counts).forEach(k=>{ const el = document.getElementById('ouaAdmTabCnt_'+k); if(el) el.textContent = counts[k].toLocaleString('vi-VN'); });
  let list = ouaAdmTab==='all' ? pop : pop.filter(u=>u.axis===ouaAdmTab);
  if(ouaAdmGrantFilter==='granted') list = list.filter(isAdm);
  if(ouaAdmGrantFilter==='ungranted') list = list.filter(u=>!isAdm(u));
  const adminCount = list.filter(isAdm).length; // đếm sau bộ lọc quyền để khớp các dòng đang hiện
  const ordered = ouaAdmTab==='all' ? ouaInterleaveByAxis(list) : list;
  const shown = OUA_ADM_SHOW_ALL ? ordered : ordered.slice(0, ouaAdmLimit);
  if(!skipRows) ouaAdmShown = shown;
  const sum = document.getElementById('ouaAdmSummary');
  if(sum) sum.innerHTML = `Hiển thị <b>${list.length.toLocaleString('vi-VN')}</b> ${OUA_ADM_FULL_POP ? 'tài khoản' : OUA_ADM_MODES[mode].who} · <b class="oua-adm-accent">${adminCount.toLocaleString('vi-VN')}</b> Quản trị`
    + (list.length > shown.length ? ` <span class="oua-adm-dim">(đang hiện ${shown.length.toLocaleString('vi-VN')} dòng đầu)</span>` : '');
  const more = document.getElementById('ouaAdmMoreWrap');
  if(more) more.innerHTML = list.length > shown.length ? `<button class="btn ghost" onclick="ouaAdmMore()">Xem thêm ${Math.min(200, list.length-shown.length).toLocaleString('vi-VN')} người · còn ${(list.length-shown.length).toLocaleString('vi-VN')}</button>` : '';
  if(!skipRows) ouaAdmRenderRows(ouaAdmShown);
  ouaAdmRefreshActionBar();
}
function ouaAdmUsername(u){ return String(u.label||'').split(' - ')[0] || ''; }
function ouaAdmAvatar(u){
  const name = (u.name||'?').trim();
  const color = OUA_ADM_AVATAR_COLORS[Math.abs(Number(u.id)||name.length) % OUA_ADM_AVATAR_COLORS.length];
  return `<span class="oua-adm-av" style="background:${color}">${name.charAt(0).toUpperCase()}</span>`;
}
function ouaAdmGrantChips(u, chipClass){
  const out = [];
  Object.keys(OUA_ADM_MODES).forEach(mode=>{
    const s = ouaAdmGrants[mode].get(u.id);
    if(!s) return;
    const text = mode==='diaban' ? 'Quản trị địa bàn' : mode==='axis' ? 'Quản trị trục ' + (OUA_ADM_AXES[s]?.name || '') : 'Quản trị ' + s;
    out.push(`<span class="${chipClass}" title="${mode==='diaban' ? 'Phạm vi: '+s : ''}">${text}<button type="button" onclick="ouaAdmRevoke('${mode}', ${u.id})" title="Gỡ quyền">×</button></span>`);
  });
  return out.length ? out.join('') : '<span class="oua-adm-none">Chưa cấp Quản trị</span>';
}
function ouaAdmOrgTag(u){
  const ax = OUA_ADM_AXES[u.axis];
  const so = u.soName && u.soName !== u.orgName ? ` <span class="so">· ${u.soName}</span>` : '';
  return `<span class="oua-adm-org">${u.orgName||'—'}${so}${u.position ? ` <span class="pos">${u.position}</span>` : ''}${ax ? ` <span class="ax" style="color:${ax.color}">· ${ax.name}</span>` : ''}</span>`;
}
const ouaAdmPlace = u => u.ward || 'Thành phố Hà Nội';
function ouaAdmRowHtml(u){
  const checked = ouaAdmSelected.has(u.id) ? 'checked' : '';
  const uname = ouaAdmUsername(u);
  return `<tr class="${checked?'oua-adm-sel':''}">
      <td class="oua-td-check"><input type="checkbox" class="oua-adm-check" data-id="${u.id}" ${checked} onchange="ouaAdmToggle(${u.id}, this.checked)"></td>
      <td><div class="oua-adm-user">${ouaAdmAvatar(u)}<div><b>${u.name||'—'}</b><small>${uname ? `<span class="uname">@${uname}</span> · ` : ''}${u.email||''}</small></div></div></td>
      <td><span class="oua-adm-place" title="${ouaAdmPlace(u)}">📍 ${ouaAdmPlace(u)}</span></td>
      <td>${ouaAdmOrgTag(u)}</td>
      <td>${ouaAdmGrantChips(u, 'oua-adm-grant')}</td>
    </tr>`;
}
function ouaAdmCardHtml(u){
  const granted = Object.keys(OUA_ADM_MODES).some(m=>ouaAdmGrants[m].has(u.id));
  const checked = ouaAdmSelected.has(u.id) ? 'checked' : '';
  const uname = ouaAdmUsername(u);
  return `<div class="oua-m-card ${granted?'green':'blue'}" style="position:relative">
      <label style="position:absolute;top:var(--m-sp-4);right:var(--m-sp-4)"><input type="checkbox" class="oua-adm-check" data-id="${u.id}" ${checked} onchange="ouaAdmToggle(${u.id}, this.checked)"></label>
      <div class="oua-adm-user" style="padding-right:28px">${ouaAdmAvatar(u)}<div><div class="oua-m-card-title">${u.name||'—'}</div><div class="oua-m-card-sub">${uname ? '@'+uname : (u.email||'—')}</div></div></div>
      <div class="oua-m-card-chips">
        <span class="oua-m-chip violet">📍 ${ouaAdmPlace(u)}</span>
        <span class="oua-m-chip ghost wrap">${u.orgName||'—'}${u.position ? ' · '+u.position : ''}</span>
      </div>
      <div class="oua-m-card-actions" style="justify-content:flex-end;flex-wrap:wrap">${ouaAdmGrantChips(u, 'oua-m-chip green oua-adm-mgrant')}</div>
    </div>`;
}
/* Thẻ mobile chỉ vẽ khi màn hẹp (desktop không cần, đỡ gấp đôi số phần tử); đổi khổ màn thì vẽ lại. */
const ouaAdmMobileMq = window.matchMedia ? window.matchMedia('(max-width:760px)') : null;
if(ouaAdmMobileMq && ouaAdmMobileMq.addEventListener) ouaAdmMobileMq.addEventListener('change', ()=>{ if(document.getElementById('ouaAdmTbody')?.childElementCount) ouaAdmRenderRows(ouaAdmShown); });
function ouaAdmRenderRows(list){
  const tbody = document.getElementById('ouaAdmTbody');
  const cardsEl = document.getElementById('ouaAdmCardsMobile');
  if(!tbody) return;
  const token = ++ouaAdmRenderToken;
  const all = document.getElementById('ouaAdmSelectAll');
  if(all) all.checked = list.length > 0 && list.every(u=>ouaAdmSelected.has(u.id));
  if(!list.length){
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty">Không có người dùng phù hợp.</div></td></tr>';
    if(cardsEl) cardsEl.innerHTML = '<div class="empty">Không có người dùng phù hợp.</div>';
    return;
  }
  const mobile = !!(ouaAdmMobileMq && ouaAdmMobileMq.matches);
  tbody.innerHTML = list.slice(0, OUA_ADM_CHUNK).map(ouaAdmRowHtml).join('');
  if(cardsEl) cardsEl.innerHTML = mobile ? list.slice(0, OUA_ADM_CHUNK).map(ouaAdmCardHtml).join('') : '';
  /* Cuộn tới đâu nạp tới đó: mốc #ouaAdmMoreWrap (ngay dưới bảng) lọt vào vùng nhìn + 1500px thì nối thêm 1 đợt.
     Vẽ liền một mạch 12.576 dòng mất 8–15 giây (đo 2026-10-19, bảng phải tính lại bố cục mỗi lần nối). */
  let i = OUA_ADM_CHUNK;
  const sentinel = document.getElementById('ouaAdmMoreWrap');
  const step = ()=>{
    if(token !== ouaAdmRenderToken || i >= list.length) return false; // đã có lượt vẽ mới (đổi tab/tìm kiếm) thì dừng lượt cũ
    const part = list.slice(i, i + OUA_ADM_CHUNK);
    tbody.insertAdjacentHTML('beforeend', part.map(ouaAdmRowHtml).join(''));
    if(cardsEl && mobile) cardsEl.insertAdjacentHTML('beforeend', part.map(ouaAdmCardHtml).join(''));
    i += OUA_ADM_CHUNK;
    return i < list.length;
  };
  if(ouaAdmObserver){ ouaAdmObserver.disconnect(); ouaAdmObserver = null; }
  if(!sentinel || typeof IntersectionObserver === 'undefined'){ (function loop(){ if(step()) setTimeout(loop, 0); })(); return; }
  ouaAdmObserver = new IntersectionObserver(entries=>{
    if(!entries.some(e=>e.isIntersecting)) return;
    if(!step()){ ouaAdmObserver.disconnect(); ouaAdmObserver = null; return; }
    // mốc vẫn còn trong vùng nạp (màn cao / cuộn nhanh) thì nạp tiếp, không đợi sự kiện cuộn kế tiếp
    ouaAdmObserver.unobserve(sentinel); ouaAdmObserver.observe(sentinel);
  }, {rootMargin:'0px 0px 1500px 0px'});
  ouaAdmObserver.observe(sentinel);
}
let ouaAdmObserver = null;
/* Vá tại chỗ ô tick + ô quyền của các dòng có id trong ids (không vẽ lại cả bảng). */
function ouaAdmPatchRows(ids){
  ids.forEach(id=>{
    const u = ouaAdmUser(id); if(!u) return;
    document.querySelectorAll(`#ouaAdminV2 .oua-adm-check[data-id="${id}"]`).forEach(cb=>{
      const card = cb.closest('.oua-m-card');
      if(card){ card.outerHTML = ouaAdmCardHtml(u); return; }
      cb.checked = ouaAdmSelected.has(id);
      const tr = cb.closest('tr');
      if(tr){ tr.classList.toggle('oua-adm-sel', cb.checked); tr.lastElementChild.innerHTML = ouaAdmGrantChips(u, 'oua-adm-grant'); }
    });
  });
}
function ouaAdmToggle(id, checked){
  if(checked) ouaAdmSelected.add(id); else ouaAdmSelected.delete(id);
  document.querySelectorAll(`#ouaAdminV2 .oua-adm-check[data-id="${id}"]`).forEach(cb=>{ cb.checked = checked; cb.closest('tr')?.classList.toggle('oua-adm-sel', checked); });
  const all = document.getElementById('ouaAdmSelectAll');
  if(all) all.checked = ouaAdmShown.length > 0 && ouaAdmShown.every(u=>ouaAdmSelected.has(u.id));
  ouaAdmRefreshActionBar();
}
function ouaAdmToggleAll(checked){
  ouaAdmShown.forEach(u=>{ if(checked) ouaAdmSelected.add(u.id); else ouaAdmSelected.delete(u.id); });
  document.querySelectorAll('#ouaAdminV2 .oua-adm-check').forEach(cb=>{ cb.checked = checked; cb.closest('tr')?.classList.toggle('oua-adm-sel', checked); });
  const all = document.getElementById('ouaAdmSelectAll'); if(all) all.checked = checked;
  ouaAdmRefreshActionBar();
}
function ouaAdmClearSelection(){ ouaAdmToggleAll(false); ouaAdmSelected.clear(); ouaAdmRefreshActionBar(); }
function ouaAdmRefreshActionBar(){
  const n = ouaAdmSelected.size, m = OUA_ADM_MODES[ouaAdmMode()];
  const txt = document.getElementById('ouaAdmActionText');
  if(txt) txt.innerHTML = n ? `✅ Đã chọn <b>${n.toLocaleString('vi-VN')}</b> người dùng · <a class="link" onclick="ouaAdmClearSelection()">Bỏ chọn</a>` : '👉 Hãy tick chọn các người dùng trong bảng bên dưới để cấp quyền';
  const btn = document.getElementById('ouaAdmAssignBtn');
  if(btn){ btn.disabled = !n; btn.textContent = `Gán ${m.label}` + (n ? ` (${n.toLocaleString('vi-VN')})` : ''); }
}
function ouaAdmAssign(){
  const mode = ouaAdmMode();
  let added = 0, skipped = 0;
  ouaAdmSelected.forEach(id=>{
    const u = ouaAdmUser(id), s = u && ouaAdmScopeOf(mode, u);
    if(!s){ skipped++; return; }
    if(!ouaAdmGrants[mode].has(id)) added++;
    ouaAdmGrants[mode].set(id, s);
  });
  const ids = [...ouaAdmSelected];
  ouaAdmSelected.clear();
  ouaAdmAfterGrantChange(ids);
  ouaToast(`Đã gán ${OUA_ADM_MODES[mode].label} cho ${added.toLocaleString('vi-VN')} người` + (skipped ? `, bỏ qua ${skipped} người ngoài phạm vi` : '') + ' (demo, chưa ghi hệ thống).');
}
/* Sau khi gán/gỡ: đang xem "Tất cả quyền" thì vá tại chỗ (giữ vị trí cuộn), đang lọc đã/chưa có quyền thì lọc lại. */
function ouaAdmAfterGrantChange(ids){
  const all = document.getElementById('ouaAdmSelectAll'); if(all) all.checked = false;
  if(ouaAdmGrantFilter==='all'){ ouaAdmPatchRows(ids); ouaAdmFilter(false, true); }
  else ouaAdmFilter(false);
}
function ouaAdmRevoke(mode, id){
  ouaAdmGrants[mode].delete(id);
  ouaAdmAfterGrantChange([id]);
  ouaToast(`Đã gỡ ${OUA_ADM_MODES[mode].label} (demo, chưa ghi hệ thống).`);
}

/* ===== Quản lý người dùng (Phase 3) — bảng data-driven từ ouaRealUserRows (Phase 1), thay 3 dòng viết cứng
   trong HTML cũ. ouaManualUsers giữ tài khoản tạo tay qua modal "Tạo tài khoản" (demo, chỉ trong phiên làm
   việc). ouaLockedUserIds lưu id (dạng chuỗi, vì egov_user_id thật là number còn id tự tạo là chuỗi) của các
   tài khoản đã bấm khóa. */
let ouaManualUsers = [];
const ouaLockedUserIds = new Set();
function ouaAllUserRows(){
  return [...ouaManualUsers, ...(ouaRealUserRows||[])];
}
/* Nhãn role IOC ở đây là suy luận demo từ position/job_title thật — không phải role RBAC đã cấu hình thật,
   giống ghi chú ở ouaIsAdminCandidate() cho màn Admin Tổng. */
function ouaDeriveUserRole(u){
  if(ouaIsAdminCandidate(u)) return {label:'Lãnh đạo trục', pill:'red'};
  if(u.position && /Chuyên viên/i.test(u.position)) return {label:'Chuyên viên', pill:'green'};
  if(u.position) return {label:u.position, pill:'yellow'};
  return {label:'Chưa gán role', pill:'violet'};
}
/* Ô thống kê "Quản lý người dùng" — bấm vào 1 ô sẽ lọc bảng bên dưới theo đúng tiêu chí ô đó (bấm lại lần nữa
   để bỏ lọc, quay về "Tổng số tài khoản"). Định nghĩa từng ô (lưu lại để sau viết đặc tả):
   - Tổng số tài khoản: toàn bộ tài khoản đang có trong hệ thống (kể cả tài khoản tạo tay qua demo).
   - Tạo mới (30 ngày): tài khoản có thời điểm tạo (createdAt) trong vòng 30 ngày gần nhất tính từ hiện tại.
   - Chưa đăng nhập: tài khoản có lastLoginAt = null, tức chưa từng đăng nhập vào hệ thống lần nào.
   - Đã đăng nhập: tài khoản có lastLoginAt khác null, tức đã từng đăng nhập ít nhất 1 lần.
   - Đã khóa: tài khoản đang có id nằm trong ouaLockedUserIds (khớp đúng công tắc Khóa/Mở trong bảng). */
let ouaUserKpiFilter = 'all';
function ouaSetUserKpiFilter(mode){
  ouaUserKpiFilter = (ouaUserKpiFilter===mode) ? 'all' : mode;
  document.querySelectorAll('#user-list .oua-kpi-clickable').forEach(el=>el.classList.toggle('active', el.dataset.kpi===ouaUserKpiFilter));
  ouaFilterUserList();
}
function ouaUpdateUserKpis(pool){
  const now = Date.now(), DAY = 86400000;
  const total = pool.length;
  const newCount = pool.filter(u=>u.createdAt && (now-u.createdAt) <= 30*DAY).length;
  const neverLogin = pool.filter(u=>!u.lastLoginAt).length;
  const loggedIn = total - neverLogin;
  const locked = pool.filter(u=>ouaLockedUserIds.has(String(u.id))).length;
  const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v.toLocaleString('vi-VN');};
  set('ouaUserKpiTotal', total);
  set('ouaUserKpiNew', newCount);
  set('ouaUserKpiNeverLogin', neverLogin);
  set('ouaUserKpiLoggedIn', loggedIn);
  set('ouaUserKpiLocked', locked);
}
function ouaFilterUserList(){
  const pool = ouaAllUserRows();
  ouaUpdateUserKpis(pool);
  const now = Date.now(), DAY = 86400000;
  const q = (document.getElementById('ouaUserSearch')?.value || '').trim().toLowerCase();
  const statusSel = document.getElementById('ouaUserStatusSel')?.value || '';
  const roleSel = document.getElementById('ouaUserRoleSel')?.value || '';
  let list = pool.filter(u=>{
    if(q && !((u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || (u.label||'').toLowerCase().includes(q))) return false;
    const locked = ouaLockedUserIds.has(String(u.id));
    if(statusSel==='active' && locked) return false;
    if(statusSel==='locked' && !locked) return false;
    if(roleSel && ouaDeriveUserRole(u).label!==roleSel) return false;
    if(ouaUserKpiFilter==='new' && !(u.createdAt && (now-u.createdAt)<=30*DAY)) return false;
    if(ouaUserKpiFilter==='never_login' && u.lastLoginAt) return false;
    if(ouaUserKpiFilter==='logged_in' && !u.lastLoginAt) return false;
    if(ouaUserKpiFilter==='locked' && !locked) return false;
    return true;
  });
  const countEl = document.getElementById('ouaUserListCount');
  const shown = list.slice(0, 200);
  if(countEl) countEl.textContent = `Hiển thị ${shown.length.toLocaleString('vi-VN')} / ${list.length.toLocaleString('vi-VN')} người dùng (tối đa 200 dòng cho bản demo)`;
  const totalEl = document.getElementById('ouaUserTotalCount');
  if(totalEl) totalEl.textContent = `Tổng số: ${pool.length.toLocaleString('vi-VN')} tài khoản`;
  ouaRenderUserRows(shown);
}
const OUA_AVATAR_COLORS = ['#3b6fd6','#2f9e6e','#a855c9','#d68a2f','#2fb0c9','#c94f6b','#5c6bc0','#43a06e'];
function ouaAvatarColor(seed){
  let h = 0; const s = String(seed);
  for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  return OUA_AVATAR_COLORS[h % OUA_AVATAR_COLORS.length];
}
function ouaRenderUserRows(list){
  const tbody = document.getElementById('ouaUserTbody');
  const cardsEl = document.getElementById('ouaUserCardsMobile');
  if(!tbody) return;
  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty">Không tìm thấy người dùng phù hợp bộ lọc.</div></td></tr>`;
    if(cardsEl) cardsEl.innerHTML = `<div class="empty">Không tìm thấy người dùng phù hợp bộ lọc.</div>`;
    return;
  }
  tbody.innerHTML = list.map(u=>{
    const locked = ouaLockedUserIds.has(String(u.id));
    const initial = (u.name || '?').trim().charAt(0).toUpperCase() || '?';
    const username = (u.label || '').split(' - ')[0] || '';
    const axisLabel = u.axis && ouaAxisMeta[u.axis] ? ouaAxisMeta[u.axis].name : '—';
    return `<tr>
      <td class="oua-td-title" data-th="Người dùng"><div class="oua-user-cell">
        <div class="oua-avatar" style="background:${ouaAvatarColor(u.id)}">${initial}</div>
        <div><a class="link" onclick="ouaShowUserDetail('${u.id}')">${u.name||'—'}</a><div class="muted">${username?'@'+username:(u.email||'—')}</div></div>
      </div></td>
      <td data-th="Trục">${axisLabel}</td>
      <td data-th="Đơn vị công tác">${u.orgName || 'Chưa gán đơn vị'}</td>
      <td data-th="Chức vụ">${u.position || '—'}</td>
      <td data-th="Trạng thái">${locked ? '<span class="pill red">Khóa</span>' : '<span class="pill green">Đang hoạt động</span>'}</td>
      <td data-th="Khóa / Mở"><label class="oua-switch"><input type="checkbox" ${locked?'':'checked'} onchange="ouaToggleUserLock('${u.id}')"><span class="oua-switch-track"><span class="oua-switch-thumb"></span></span><span>${locked?'Khóa':'Mở'}</span></label></td>
      <td data-th="Thao tác"><div class="actions" style="flex-wrap:nowrap;white-space:nowrap">
        <button class="btn small" onclick="ouaOpenEditUserModal('${u.id}')">Sửa</button>
        <button class="btn small" onclick="ouaShowUserDetail('${u.id}')">Chi tiết</button>
      </div></td>
    </tr>`;
  }).join('');
  if(cardsEl) cardsEl.innerHTML = list.map(u=>{
    const locked = ouaLockedUserIds.has(String(u.id));
    const initial = (u.name || '?').trim().charAt(0).toUpperCase() || '?';
    const username = (u.label || '').split(' - ')[0] || '';
    const axisLabel = u.axis && ouaAxisMeta[u.axis] ? ouaAxisMeta[u.axis].name : '—';
    const role = ouaDeriveUserRole(u);
    const sub = [u.position || '—', u.orgName || 'Chưa gán đơn vị'].join(' · ');
    return `<div class="oua-m-card ${locked?'red':'green'}">
      <div class="oua-m-card-top">
        <div class="oua-m-avatar-wrap">
          <div class="oua-avatar" style="background:${ouaAvatarColor(u.id)}">${initial}</div>
          <span class="oua-m-avatar-dot ${locked?'red':'green'}"></span>
        </div>
        <div class="oua-m-card-body">
          <div class="oua-m-card-title"><a class="link" onclick="ouaShowUserDetail('${u.id}')">${u.name||'—'}</a></div>
          <div class="oua-m-card-sub">${username?'@'+username:(u.email||'—')} · ${sub}</div>
          <div class="oua-m-card-chips">
            <span class="oua-m-chip ghost">${axisLabel}</span>
            <span class="oua-m-chip ${ouaPillToChip(role.pill)}">${role.label}</span>
          </div>
        </div>
      </div>
      <div class="oua-m-card-actions">
        <label class="oua-switch"><input type="checkbox" ${locked?'':'checked'} onchange="ouaToggleUserLock('${u.id}')"><span class="oua-switch-track"><span class="oua-switch-thumb"></span></span><span>${locked?'Khóa':'Mở'}</span></label>
        <button class="oua-m-iconbtn" title="Sửa" onclick="ouaOpenEditUserModal('${u.id}')">✎</button>
        <button class="oua-m-iconbtn" title="Chi tiết" onclick="ouaShowUserDetail('${u.id}')">›</button>
      </div>
    </div>`;
  }).join('');
}
let ouaEditingUserId = null;
function ouaOpenEditUserModal(id){
  const u = ouaAllUserRows().find(x=>String(x.id)===String(id));
  if(!u) return;
  ouaEditingUserId = id;
  ouaOpenModal('editUserRealModal');
  setTimeout(()=>{
    const n=document.getElementById('editUserNameInput'); if(n) n.value = u.name || '';
    const o=document.getElementById('editUserOrgInput'); if(o) o.value = u.orgName || '';
    const p=document.getElementById('editUserPositionInput'); if(p) p.value = u.position || '';
  }, 0);
}
function ouaSubmitEditUser(){
  if(!ouaEditingUserId){ ouaCloseModal(); return; }
  const u = ouaAllUserRows().find(x=>String(x.id)===String(ouaEditingUserId));
  if(u){
    const name = (document.getElementById('editUserNameInput')?.value || '').trim();
    const org = (document.getElementById('editUserOrgInput')?.value || '').trim();
    const pos = (document.getElementById('editUserPositionInput')?.value || '').trim();
    if(name) u.name = name;
    u.orgName = org;
    u.position = pos;
  }
  ouaEditingUserId = null;
  ouaCloseModal();
  ouaFilterUserList();
  ouaToast('Đã cập nhật thông tin người dùng (demo, chỉ lưu trong phiên làm việc, chưa ghi backend).');
}
function ouaToggleUserLock(id){
  const key = String(id);
  if(ouaLockedUserIds.has(key)) ouaLockedUserIds.delete(key); else ouaLockedUserIds.add(key);
  ouaFilterUserList();
  ouaToast(ouaLockedUserIds.has(key) ? 'Đã khóa tài khoản (demo, chưa ghi backend).' : 'Đã mở khóa tài khoản (demo, chưa ghi backend).');
}
function ouaShowUserDetail(id){
  const u = ouaAllUserRows().find(x=>String(x.id)===String(id));
  if(u){
    const nameEl = document.getElementById('ouaUserDetailName');
    const pathEl = document.getElementById('ouaUserDetailPath');
    if(nameEl) nameEl.textContent = u.name || '—';
    if(pathEl) pathEl.textContent = `SSO: ${u.label || u.name || '—'} • Email: ${u.email || '—'} • Đơn vị: ${u.orgName || 'Chưa gán đơn vị'} • Trạng thái IOC: ${ouaLockedUserIds.has(String(u.id)) ? 'Khóa' : 'Active'}`;
  }
  ouaGoPage('user-detail');
}
/* ===== Cài đặt lĩnh vực (Phase 4, màn mới) — danh mục lĩnh vực dùng cho kịch bản xử lý/thống kê theo từng
   đơn vị. Đơn vị chưa tự thêm lĩnh vực nào dùng chung ouaFieldDefaultCatalog; ngay khi thêm lĩnh vực đầu tiên,
   hệ thống clone danh mục mặc định thành 1 bản riêng trong ouaFieldOrgCatalogs[orgKey] rồi mới thêm mục mới,
   đúng hành vi mô tả trong ảnh chụp gốc. Toàn bộ chỉ lưu trong bộ nhớ phiên làm việc (demo). */
const ouaFieldDefaultCatalog = [
  {code:'Y_TE', name:'Y tế'}, {code:'GIAO_DUC', name:'Giáo dục'}, {code:'HCC', name:'HCC'},
  {code:'TAI_CHINH', name:'Tài chính'}, {code:'GIAO_THONG', name:'Giao thông'}, {code:'XAY_DUNG', name:'Xây dựng'},
  {code:'TNMT', name:'TNMT'}, {code:'KHCN', name:'KHCN'}, {code:'LDTBXH', name:'LĐTBXH'}, {code:'NOI_CHINH', name:'Nội chính'},
  {code:'VH_XH', name:'Văn hóa - Xã hội'}, {code:'NONG_NGHIEP', name:'Nông nghiệp'}
].map(f=>({...f, source:'default', status:'active'}));
let ouaFieldOrgCatalogs = {};
let ouaFieldOrgOptions = null;
let ouaEditingField = null;
function ouaSlugify(str){
  return (str||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'d')
    .toUpperCase().trim().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'') || 'LINH_VUC';
}
function ouaGetFieldOrgOptions(){
  if(ouaFieldOrgOptions) return ouaFieldOrgOptions;
  const twOpts = ouaTwUnits.map(u=>({key:'TW:'+u.code, label:u.name}));
  const axisOpts = ['DANG','HDND','UBND','MTTQ'].map(ax=>({key:'AXIS:'+ax, label:ouaAxisMeta[ax].parentLabel}));
  ouaFieldOrgOptions = [...twOpts, ...axisOpts];
  return ouaFieldOrgOptions;
}
function ouaGetFieldCatalog(orgKey){
  return ouaFieldOrgCatalogs[orgKey] || ouaFieldDefaultCatalog;
}
function ouaRenderFieldOrgSelect(){
  const sel = document.getElementById('ouaFieldOrgSel');
  if(!sel) return;
  sel.innerHTML = ouaGetFieldOrgOptions().map(o=>`<option value="${o.key}">${o.label}</option>`).join('');
  const btcOpt = ouaGetFieldOrgOptions().find(o=>o.key==='TW:ORG-TW-DANG-BTC');
  sel.value = btcOpt ? btcOpt.key : ouaGetFieldOrgOptions()[0]?.key;
  ouaRenderFieldSettings();
}
function ouaRenderFieldSettings(){
  const orgKey = document.getElementById('ouaFieldOrgSel')?.value;
  const customized = !!ouaFieldOrgCatalogs[orgKey];
  const noteEl = document.getElementById('ouaFieldOrgNote');
  if(noteEl){
    noteEl.innerHTML = customized
      ? '💡 Đơn vị này đã có danh mục lĩnh vực riêng.'
      : '💡 Đơn vị đang dùng danh mục mặc định.<br>Thêm lĩnh vực đầu tiên để tạo danh mục riêng — hệ thống sẽ giữ nguyên các lĩnh vực mặc định bên dưới rồi bổ sung thêm mục mới của bạn.';
  }
  ouaFilterFieldList();
}
function ouaFilterFieldList(){
  const orgKey = document.getElementById('ouaFieldOrgSel')?.value;
  const catalog = ouaGetFieldCatalog(orgKey);
  const q = (document.getElementById('ouaFieldSearch')?.value || '').trim().toLowerCase();
  const list = catalog.filter(f => !q || f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q));
  const countEl = document.getElementById('ouaFieldCount');
  if(countEl) countEl.textContent = `${list.length}/${catalog.length} lĩnh vực`;
  ouaRenderFieldRows(list, orgKey);
  ouaUpdateFieldKpis(catalog);
}
function ouaRenderFieldRows(list, orgKey){
  const tbody = document.getElementById('ouaFieldTbody');
  const cardsEl = document.getElementById('ouaFieldCardsMobile');
  if(!tbody) return;
  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty">Không tìm thấy lĩnh vực phù hợp.</div></td></tr>`;
    if(cardsEl) cardsEl.innerHTML = `<div class="empty">Không tìm thấy lĩnh vực phù hợp.</div>`;
    return;
  }
  tbody.innerHTML = list.map(f=>`<tr>
    <td class="oua-td-title" data-th="Lĩnh vực"><b>${f.name}</b></td>
    <td data-th="Mã">${f.code}</td>
    <td data-th="Nguồn"><span class="pill${f.source==='custom'?' violet':''}">${f.source==='default'?'Mặc định':'Tuỳ chỉnh'}</span></td>
    <td data-th="Trạng thái">${f.status==='active' ? '<span class="pill green">Đang dùng</span>' : '<span class="pill yellow">Ẩn</span>'}</td>
    <td data-th="Thao tác"><div class="actions"><button class="btn small" onclick="ouaEditFieldName('${orgKey}','${f.code}')">Sửa</button><button class="btn small" onclick="ouaToggleFieldStatus('${orgKey}','${f.code}')">${f.status==='active'?'Ẩn':'Hiện'}</button></div></td>
  </tr>`).join('');
  if(cardsEl) cardsEl.innerHTML = list.map(f=>`<div class="oua-m-card ${f.status==='active'?'green':'amber'}">
    <div class="oua-m-card-top">
      <div class="oua-m-card-body">
        <div class="oua-m-card-title">${f.name}</div>
        <div class="oua-m-card-sub">${f.code}</div>
        <div class="oua-m-card-chips">
          <span class="oua-m-chip ${f.source==='custom'?'violet':'ghost'}">${f.source==='default'?'Mặc định':'Tuỳ chỉnh'}</span>
          <span class="oua-m-chip ${f.status==='active'?'green':'amber'}">${f.status==='active'?'Đang dùng':'Ẩn'}</span>
        </div>
      </div>
      <button class="oua-m-iconbtn" title="Sửa" onclick="ouaEditFieldName('${orgKey}','${f.code}')">✎</button>
      <button class="oua-m-iconbtn" title="${f.status==='active'?'Ẩn':'Hiện'}" onclick="ouaToggleFieldStatus('${orgKey}','${f.code}')">${f.status==='active'?'🙈':'👁'}</button>
    </div>
  </div>`).join('');
}
function ouaUpdateFieldKpis(catalog){
  const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
  set('ouaFieldKpiTotal', catalog.length);
  set('ouaFieldKpiDefault', catalog.filter(f=>f.source==='default').length);
  set('ouaFieldKpiCustom', catalog.filter(f=>f.source==='custom').length);
  set('ouaFieldKpiHidden', catalog.filter(f=>f.status==='hidden').length);
}
function ouaEnsureOrgFieldCatalog(orgKey){
  if(!ouaFieldOrgCatalogs[orgKey]) ouaFieldOrgCatalogs[orgKey] = ouaFieldDefaultCatalog.map(f=>({...f}));
  return ouaFieldOrgCatalogs[orgKey];
}
function ouaAddField(){
  const nameInput = document.getElementById('newFieldName');
  const name = (nameInput?.value || '').trim();
  if(!name){ ouaToast('Vui lòng nhập tên lĩnh vực.'); return; }
  const orgKey = document.getElementById('ouaFieldOrgSel')?.value;
  const catalog = ouaEnsureOrgFieldCatalog(orgKey);
  catalog.push({code: ouaSlugify(name), name, source:'custom', status:'active'});
  if(nameInput) nameInput.value = '';
  const descInput = document.getElementById('newFieldDesc');
  if(descInput) descInput.value = '';
  ouaRenderFieldSettings();
  ouaToast(`Đã thêm lĩnh vực "${name}" (demo, chỉ lưu trong phiên làm việc, chưa ghi backend).`);
}
function ouaToggleFieldStatus(orgKey, code){
  const catalog = ouaEnsureOrgFieldCatalog(orgKey);
  const f = catalog.find(x=>x.code===code);
  if(!f) return;
  f.status = f.status==='active' ? 'hidden' : 'active';
  ouaFilterFieldList();
  ouaToast(f.status==='hidden' ? `Đã ẩn lĩnh vực "${f.name}".` : `Đã hiện lại lĩnh vực "${f.name}".`);
}
function ouaEditFieldName(orgKey, code){
  const catalog = ouaGetFieldCatalog(orgKey);
  const f = catalog.find(x=>x.code===code);
  if(!f) return;
  ouaEditingField = {orgKey, code};
  ouaOpenModal('editFieldModal');
  setTimeout(()=>{ const inp = document.getElementById('editFieldNameInput'); if(inp) inp.value = f.name; }, 0);
}
function ouaSubmitEditField(){
  if(!ouaEditingField){ ouaCloseModal(); return; }
  const catalog = ouaEnsureOrgFieldCatalog(ouaEditingField.orgKey);
  const f = catalog.find(x=>x.code===ouaEditingField.code);
  const newName = (document.getElementById('editFieldNameInput')?.value || '').trim();
  if(f && newName) f.name = newName;
  ouaEditingField = null;
  ouaCloseModal();
  ouaFilterFieldList();
  ouaToast('Đã cập nhật tên lĩnh vực (demo, chỉ lưu trong phiên làm việc).');
}

/* ===== Phân nhóm đơn vị (Phase 5, màn mới) — gộp cây đơn vị THẬT (ouaRealOrgRows, kể cả node gốc "THÀNH PHỐ
   HÀ NỘI" mà Phase 2 lược bỏ khỏi bảng "Quản lý đơn vị") với khối Trung ương/BTCTW mô phỏng (ouaTwUnits), suy ra
   "Nhóm tự động" theo cấp trong đường dẫn phả hệ. "Nhóm gán tay" ưu tiên hơn nhóm tự động, lưu trong
   ouaManualGroupOverrides (demo, chỉ trong phiên làm việc). */
let ouaGroupingRowsCache = null;
function ouaFlattenTwUnits(){
  const rows = [];
  function walk(u, ancestorPath, depth){
    const path = ancestorPath ? ancestorPath+'.'+u.code : u.code;
    rows.push({key:'TW:'+u.code, name:u.name, path, dbLevel:depth});
    (u.children||[]).forEach(c=>walk(c, path, depth+1));
  }
  ouaTwUnits.forEach(u=>walk(u, null, 1));
  return rows;
}
function ouaFlattenRealOrgRowsForGrouping(){
  if(!ouaRealOrgRows) ouaBuildRealData();
  return ouaRealOrgRows.map(r=>({key:'REAL:'+r.id, name:r.name, path:r.path, dbLevel:r.level, axis:r.axis}));
}
function ouaBuildGroupingRows(){
  ouaGroupingRowsCache = [...ouaFlattenTwUnits(), ...ouaFlattenRealOrgRowsForGrouping()];
  return ouaGroupingRowsCache;
}
function ouaAutoGroupOf(row){
  if(row.key.startsWith('TW:')) return {label:'BTCTW (Trung ương)', pill:'gold'};
  if(row.dbLevel<=2) return {label:'Cấp thành phố', pill:'violet'};
  if(row.dbLevel===3) return {label:'Sở/Ban/Ngành', pill:'yellow'};
  if(row.dbLevel===4) return {label:'Phòng/Đơn vị', pill:''};
  return {label:'Xã/Phường', pill:'green'};
}
let ouaManualGroupOverrides = {};
function ouaSetManualGroup(key, value){
  if(value) ouaManualGroupOverrides[key] = value; else delete ouaManualGroupOverrides[key];
  ouaToast(value ? `Đã gán nhóm "${value}" cho đơn vị (demo, chưa ghi backend).` : 'Đã đưa đơn vị về nhóm tự động (demo).');
}
let ouaOrgAxisAndDiaBanMap = {};
let ouaEditingMapping = null;
function ouaOpenMappingModal(key){
  ouaEditingMapping = key;
  ouaOpenModal('orgAxisMappingModal');
  setTimeout(()=>{
    const cur = ouaOrgAxisAndDiaBanMap[key] || {};
    const axisSel = document.getElementById('mappingAxisInput');
    const diaBanInput = document.getElementById('mappingDiaBanInput');
    if(axisSel) axisSel.value = cur.axis || '';
    if(diaBanInput) diaBanInput.value = cur.diaBan || '';
  }, 0);
}
function ouaSubmitMapping(){
  if(!ouaEditingMapping){ ouaCloseModal(); return; }
  const axis = document.getElementById('mappingAxisInput')?.value || '';
  const diaBan = (document.getElementById('mappingDiaBanInput')?.value || '').trim();
  ouaOrgAxisAndDiaBanMap[ouaEditingMapping] = {axis, diaBan};
  ouaEditingMapping = null;
  ouaCloseModal();
  ouaFilterGroupingList();
  ouaToast('Đã lưu mapping trục/địa bàn (demo, chỉ lưu trong phiên làm việc, chưa ghi backend).');
}
function ouaFilterGroupingList(){
  if(!ouaGroupingRowsCache) ouaBuildGroupingRows();
  const q = (document.getElementById('ouaGroupSearch')?.value || '').trim().toLowerCase();
  const groupSel = document.getElementById('ouaGroupFilterSel')?.value || '';
  const list = ouaGroupingRowsCache.filter(r=>{
    if(q && !((r.name||'').toLowerCase().includes(q) || (r.path||'').toLowerCase().includes(q))) return false;
    if(groupSel){
      const label = ouaManualGroupOverrides[r.key] || ouaAutoGroupOf(r).label;
      if(label!==groupSel) return false;
    }
    return true;
  });
  const countEl = document.getElementById('ouaGroupListCount');
  const shown = list.slice(0, 200);
  if(countEl) countEl.textContent = `Hiển thị ${shown.length.toLocaleString('vi-VN')} / ${list.length.toLocaleString('vi-VN')} đơn vị (tổng ${ouaGroupingRowsCache.length.toLocaleString('vi-VN')}, tối đa 200 dòng cho bản demo)`;
  ouaRenderGroupingRows(shown);
}
function ouaRenderGroupingRows(list){
  const tbody = document.getElementById('ouaGroupTbody');
  const cardsEl = document.getElementById('ouaGroupCardsMobile');
  if(!tbody) return;
  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty">Không tìm thấy đơn vị phù hợp.</div></td></tr>`;
    if(cardsEl) cardsEl.innerHTML = `<div class="empty">Không tìm thấy đơn vị phù hợp.</div>`;
    return;
  }
  const groupOptions = ['BTCTW (Trung ương)','Cấp thành phố','Sở/Ban/Ngành','Phòng/Đơn vị','Xã/Phường'];
  tbody.innerHTML = list.map(r=>{
    const auto = ouaAutoGroupOf(r);
    const manual = ouaManualGroupOverrides[r.key] || '';
    const mapping = ouaOrgAxisAndDiaBanMap[r.key];
    return `<tr>
      <td class="oua-td-title" data-th="Đơn vị"><b>${r.name}</b></td>
      <td class="muted" data-th="Đường dẫn phả hệ">${r.path || '—'}</td>
      <td data-th="org_level (DB)">${r.dbLevel!=null ? r.dbLevel : '—'}</td>
      <td data-th="Nhóm tự động"><span class="pill${auto.pill?' '+auto.pill:''}">${auto.label}</span></td>
      <td data-th="Nhóm gán tay"><select onchange="ouaSetManualGroup('${r.key}', this.value)">
        <option value="">Mặc định (tự động)</option>
        ${groupOptions.map(g=>`<option value="${g}"${manual===g?' selected':''}>${g}</option>`).join('')}
      </select></td>
      <td data-th="Mapping trục / địa bàn">
        ${mapping ? `<div class="muted">${mapping.axis ? (ouaAxisMeta[mapping.axis]?.name || mapping.axis) : '—'}${mapping.diaBan ? ' · '+mapping.diaBan : ''}</div>` : ''}
        <button class="btn small" onclick="ouaOpenMappingModal('${r.key}')">${mapping ? 'Sửa mapping' : 'Thiết lập'}</button>
      </td>
    </tr>`;
  }).join('');
  if(cardsEl) cardsEl.innerHTML = list.map(r=>{
    const auto = ouaAutoGroupOf(r);
    const manual = ouaManualGroupOverrides[r.key] || '';
    const mapping = ouaOrgAxisAndDiaBanMap[r.key];
    const chipClass = auto.pill ? ouaPillToChip(auto.pill) : 'blue';
    return `<div class="oua-m-card ${chipClass}">
      <div class="oua-m-card-title">${r.name}</div>
      <div class="oua-m-card-sub" style="font-family:monospace;font-size:11px">${r.path || '—'}</div>
      <div class="oua-m-card-chips">
        <span class="oua-m-chip ${chipClass}">${auto.label}</span>
        ${mapping ? `<span class="oua-m-chip ghost wrap">${mapping.axis ? (ouaAxisMeta[mapping.axis]?.name || mapping.axis) : '—'}${mapping.diaBan ? ' · '+mapping.diaBan : ''}</span>` : ''}
      </div>
      <div style="margin-top:10px"><select onchange="ouaSetManualGroup('${r.key}', this.value)" style="width:100%">
        <option value="">Mặc định (tự động)</option>
        ${groupOptions.map(g=>`<option value="${g}"${manual===g?' selected':''}>${g}</option>`).join('')}
      </select></div>
      <button class="oua-m-btn-text" style="width:100%;margin-top:8px" onclick="ouaOpenMappingModal('${r.key}')">${mapping ? 'Sửa mapping' : 'Thiết lập mapping'}</button>
    </div>`;
  }).join('');
}

/* ===== Cấu hình chỉ tiêu đơn vị (Phase 6, màn mới) — mapping id_url_chi_tieu <-> đơn vị IOC, seed từ các Sở
   THẬT có trong ouaRealOrgRows (loại trùng tên vì account.json có 2 nhánh Sở trùng dữ liệu — chỉ lấy lần xuất
   hiện đầu tiên của mỗi tên Sở). Toàn bộ CRUD chỉ lưu trong bộ nhớ phiên làm việc (demo). */
function ouaIndicatorSlug(name){
  const stripped = (name||'').replace(/^Sở\s+/i, '');
  return 'so/' + ouaSlugify(stripped).toLowerCase();
}
function ouaGetSoOrgOptions(){
  if(!ouaRealOrgRows) ouaBuildRealData();
  const seen = new Set(), opts = [];
  ouaRealOrgRows.forEach(r=>{
    if(!/^Sở /.test(r.name) || seen.has(r.name)) return;
    seen.add(r.name);
    opts.push({id:r.id, name:r.name});
  });
  return opts;
}
function ouaBuildIndicatorMappings(){
  return ouaGetSoOrgOptions().map(o=>({
    idUrl: ouaIndicatorSlug(o.name), tenIOC:o.name, orgId:o.id, orgName:o.name, dashboard:'—', status:'active'
  }));
}
let ouaIndicatorRows = null;
function ouaBuildIndicatorAddFormHtml(){
  const opts = ouaGetSoOrgOptions();
  return `<div class="form-grid">
    <div class="form-control"><label>Đơn vị liên kết (Sở)</label><select id="newIndicatorOrgSel">${opts.map(o=>`<option value="${o.id}">${o.name}</option>`).join('')}</select></div>
    <div class="form-control"><label>id_url_chi_tieu (tuỳ chọn)</label><input id="newIndicatorSlug" placeholder="Để trống sẽ tự sinh từ tên Sở, vd: cong_thuong"></div>
  </div><div class="hint">Mapping mới chỉ lưu trong phiên làm việc trình duyệt (demo), chưa ghi vào backend.</div>`;
}
function ouaSubmitIndicatorMapping(){
  if(!ouaIndicatorRows) ouaIndicatorRows = ouaBuildIndicatorMappings();
  const orgId = Number(document.getElementById('newIndicatorOrgSel')?.value);
  const org = ouaGetSoOrgOptions().find(o=>o.id===orgId);
  if(!org){ ouaToast('Vui lòng chọn đơn vị liên kết.'); return; }
  const rawSlug = (document.getElementById('newIndicatorSlug')?.value || '').trim();
  const slug = rawSlug ? 'so/' + rawSlug.toLowerCase().replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,'') : ouaIndicatorSlug(org.name);
  if(ouaIndicatorRows.some(r=>r.idUrl===slug)){ ouaToast(`id_url_chi_tieu "${slug}" đã tồn tại.`); return; }
  ouaIndicatorRows.unshift({idUrl:slug, tenIOC:org.name, orgId:org.id, orgName:org.name, dashboard:'—', status:'active'});
  ouaCloseModal();
  ouaFilterIndicatorList();
  ouaToast(`Đã thêm mapping "${slug}" (demo, chỉ lưu trong phiên làm việc, chưa ghi backend).`);
}
let ouaEditingIndicator = null;
function ouaEditIndicatorRow(idUrl){
  if(!ouaIndicatorRows) ouaIndicatorRows = ouaBuildIndicatorMappings();
  const row = ouaIndicatorRows.find(r=>r.idUrl===idUrl);
  if(!row) return;
  ouaEditingIndicator = idUrl;
  ouaOpenModal('editIndicatorModal');
  setTimeout(()=>{
    const nameInput = document.getElementById('editIndicatorNameInput');
    const statusSel = document.getElementById('editIndicatorStatusInput');
    if(nameInput) nameInput.value = row.tenIOC;
    if(statusSel) statusSel.value = row.status;
  }, 0);
}
function ouaSubmitEditIndicator(){
  if(!ouaEditingIndicator){ ouaCloseModal(); return; }
  const row = ouaIndicatorRows.find(r=>r.idUrl===ouaEditingIndicator);
  const name = (document.getElementById('editIndicatorNameInput')?.value || '').trim();
  const status = document.getElementById('editIndicatorStatusInput')?.value;
  if(row){ if(name) row.tenIOC = name; if(status) row.status = status; }
  ouaEditingIndicator = null;
  ouaCloseModal();
  ouaFilterIndicatorList();
  ouaToast('Đã cập nhật mapping (demo, chỉ lưu trong phiên làm việc, chưa ghi backend).');
}
function ouaFilterIndicatorList(){
  if(!ouaIndicatorRows) ouaIndicatorRows = ouaBuildIndicatorMappings();
  const q = (document.getElementById('ouaIndicatorSearch')?.value || '').trim().toLowerCase();
  const statusSel = document.getElementById('ouaIndicatorStatusSel')?.value || '';
  const list = ouaIndicatorRows.filter(r=>{
    if(q && !(r.idUrl.toLowerCase().includes(q) || r.tenIOC.toLowerCase().includes(q) || r.orgName.toLowerCase().includes(q))) return false;
    if(statusSel && r.status!==statusSel) return false;
    return true;
  });
  const countEl = document.getElementById('ouaIndicatorCount');
  if(countEl) countEl.textContent = `Hiển thị ${list.length}/${ouaIndicatorRows.length} mapping`;
  ouaRenderIndicatorRows(list);
}
function ouaRenderIndicatorRows(list){
  const tbody = document.getElementById('ouaIndicatorTbody');
  const cardsEl = document.getElementById('ouaIndicatorCardsMobile');
  if(!tbody) return;
  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty">Không tìm thấy mapping phù hợp.</div></td></tr>`;
    if(cardsEl) cardsEl.innerHTML = `<div class="empty">Không tìm thấy mapping phù hợp.</div>`;
    return;
  }
  tbody.innerHTML = list.map(r=>`<tr>
    <td class="oua-td-title" data-th="id_url_chi_tieu"><code>${r.idUrl}</code></td>
    <td data-th="Tên đơn vị IOC">${r.tenIOC}</td>
    <td data-th="Org liên kết">${r.orgName}<div class="muted">ORG-${r.orgId}</div></td>
    <td data-th="Dashboard">${r.dashboard || '—'}</td>
    <td data-th="Trạng thái">${r.status==='active' ? '<span class="pill green">Đang dùng</span>' : '<span class="pill yellow">Ẩn</span>'}</td>
    <td data-th="Thao tác"><button class="btn small" onclick="ouaEditIndicatorRow('${r.idUrl}')">Sửa</button></td>
  </tr>`).join('');
  if(cardsEl) cardsEl.innerHTML = list.map(r=>`<div class="oua-m-card ${r.status==='active'?'green':'amber'}">
    <div class="oua-m-card-top">
      <div class="oua-m-card-body">
        <span class="oua-m-chip blue" style="font-family:monospace">${r.idUrl}</span>
        <div class="oua-m-card-title" style="margin-top:6px">${r.tenIOC}</div>
        <div class="oua-m-card-sub">${r.orgName} · ORG-${r.orgId}</div>
        <div class="oua-m-card-chips">
          <span class="oua-m-chip ghost">${r.dashboard || '—'}</span>
          <span class="oua-m-chip ${r.status==='active'?'green':'amber'}">${r.status==='active'?'Đang dùng':'Ẩn'}</span>
        </div>
      </div>
      <button class="oua-m-iconbtn" title="Sửa" onclick="ouaEditIndicatorRow('${r.idUrl}')">✎</button>
    </div>
  </div>`).join('');
}

/* ===== Cài đặt cây thư mục (Phase 7, màn mới, phức tạp nhất) — cây tuỳ biến kéo-thả bằng HTML5 Drag & Drop
   API thuần (không thêm thư viện ngoài). ouaCustomTree là 1 mảng cây độc lập (node: {id, label, virtual,
   sourceKey?, children}), khởi tạo từ 4 trục cấp Thành phố + toàn bộ khối Trung ương/BTCTW (ouaTwUnits) —
   không đụng tới ouaOrgRows/ouaRealOrgRows của các màn khác. Chỉ 1 cây dùng chung (không tách riêng theo
   đơn vị/user — 2 select phía trên chỉ mang tính minh hoạ, chưa có nhiều cây song song trong bản demo này). */
function ouaBuildDefaultCustomTree(){
  const axisChildren = ['DANG','HDND','UBND','MTTQ'].map(ax=>({
    id:'axis-'+ax, label:ouaAxisMeta[ax].parentLabel, virtual:false, sourceKey:'AXIS:'+ax, children:[]
  }));
  const cityNode = {id:'city-root', label:'THÀNH PHỐ HÀ NỘI', virtual:true, children:axisChildren};
  function cloneTw(u){
    const id = 'tw-'+u.code;
    return {id, label:u.name, virtual:false, sourceKey:'TW:'+u.code, children:(u.children||[]).map(cloneTw)};
  }
  return [cityNode, ...ouaTwUnits.map(cloneTw)];
}
let ouaCustomTree = null;
let ouaSelectedTreeNodeId = null;
let ouaDragNodeId = null;
function ouaFindTreeNode(nodes, id){
  for(const n of nodes){
    if(n.id===id) return n;
    const found = ouaFindTreeNode(n.children||[], id);
    if(found) return found;
  }
  return null;
}
function ouaRemoveTreeNode(nodes, id){
  for(let i=0;i<nodes.length;i++){
    if(nodes[i].id===id) return nodes.splice(i,1)[0];
    const removed = ouaRemoveTreeNode(nodes[i].children||[], id);
    if(removed) return removed;
  }
  return null;
}
function ouaIsDescendant(node, targetId){
  return (node.children||[]).some(c=>c.id===targetId || ouaIsDescendant(c, targetId));
}
function ouaTreeSelectNode(id){
  ouaSelectedTreeNodeId = (ouaSelectedTreeNodeId===id) ? null : id;
  ouaRenderCustomTree();
}
function ouaTreeDragStart(ev, id){
  ouaDragNodeId = id;
  ev.dataTransfer.effectAllowed = 'move';
}
function ouaTreeDragOver(ev){ ev.preventDefault(); }
function ouaTreeDrop(ev, targetId){
  ev.preventDefault();
  ev.stopPropagation();
  if(!ouaDragNodeId || ouaDragNodeId===targetId) return;
  const draggedId = ouaDragNodeId;
  ouaDragNodeId = null;
  ouaTreeMoveNode(draggedId, targetId);
}
/* Logic đổi vị trí cha-con dùng chung cho cả kéo-thả (desktop, ouaTreeDrop) lẫn chạm 2 lần (mobile,
   ouaTreeMoveSelectedHere) — tách riêng vì Drag & Drop API không có sự kiện tương đương khi chạm tay
   trên điện thoại (xem giới hạn đã ghi trong plan bright-squishing-yao.md, mục Phase G). */
function ouaTreeMoveNode(draggedId, targetId){
  if(!draggedId || draggedId===targetId) return;
  const dragged = ouaRemoveTreeNode(ouaCustomTree, draggedId);
  if(!dragged) return;
  if(targetId!=='root' && ouaIsDescendant(dragged, targetId)){
    ouaCustomTree.push(dragged);
    ouaRenderCustomTree();
    ouaToast('Không thể thả 1 nút vào chính nhánh con của nó — đã đưa về gốc cây.');
    return;
  }
  if(targetId==='root'){
    ouaCustomTree.push(dragged);
  } else {
    const target = ouaFindTreeNode(ouaCustomTree, targetId);
    if(target){ target.children = target.children || []; target.children.push(dragged); } else { ouaCustomTree.push(dragged); }
  }
  ouaRenderCustomTree();
  ouaToast('Đã đổi vị trí cha-con trong cây (demo, chỉ lưu trong phiên làm việc, chưa ghi backend).');
}
/* Thay thế kéo-thả cho mobile (chạm tay): bước 1 chạm vào tên 1 nút để "chọn" (dùng lại đúng
   ouaTreeSelectNode/ouaSelectedTreeNodeId đã có cho chức năng xoá nút); bước 2 chạm nút "Chuyển vào đây"
   (chỉ hiện trên mobile, xem CSS @media(max-width:760px)) ở nút đích. */
function ouaTreeMoveSelectedHere(ev, targetId){
  ev.stopPropagation();
  if(!ouaSelectedTreeNodeId){ ouaToast('Hãy chạm vào tên 1 đơn vị trong cây để chọn trước, rồi chạm "Chuyển vào đây" ở vị trí muốn chuyển tới.'); return; }
  if(ouaSelectedTreeNodeId===targetId){ ouaToast('Đơn vị đang chọn đã ở đây rồi.'); return; }
  const srcId = ouaSelectedTreeNodeId;
  ouaSelectedTreeNodeId = null;
  ouaTreeMoveNode(srcId, targetId);
}
function ouaTreeCustomNodeHtml(n){
  const childHtml = (n.children && n.children.length) ? `<ul>${n.children.map(ouaTreeCustomNodeHtml).join('')}</ul>` : '';
  const selected = n.id===ouaSelectedTreeNodeId;
  return `<li><span class="node oua-dnd-node${selected?' oua-dnd-selected':''}" draggable="true"
      ondragstart="ouaTreeDragStart(event,'${n.id}')" ondragover="ouaTreeDragOver(event)" ondrop="ouaTreeDrop(event,'${n.id}')"
      onclick="ouaTreeSelectNode('${n.id}')">${n.virtual?'📁':'🏢'} <span class="oua-tree-node-label"><b>${n.label}</b>${n.virtual?'<small>Thư mục ảo</small>':''}</span><button type="button" class="oua-m-iconbtn oua-tree-move-btn" title="Chuyển đơn vị đang chọn vào đây" onclick="ouaTreeMoveSelectedHere(event,'${n.id}')">⇩</button></span>${childHtml}</li>`;
}
function ouaRenderCustomTree(){
  if(!ouaCustomTree) ouaCustomTree = ouaBuildDefaultCustomTree();
  const wrap = document.getElementById('ouaCustomTreeWrap');
  if(!wrap) return;
  wrap.ondragover = (ev)=>ev.preventDefault();
  wrap.ondrop = (ev)=>{ if(ev.target===wrap) ouaTreeDrop(ev, 'root'); };
  wrap.innerHTML = `<ul>${ouaCustomTree.map(ouaTreeCustomNodeHtml).join('')}</ul>`;
}
function ouaGetTreeSourceOptions(){
  const axisOpts = ['DANG','HDND','UBND','MTTQ'].map(ax=>({key:'AXIS:'+ax, label:ouaAxisMeta[ax].parentLabel}));
  const twOpts = ouaFlattenTwUnits().map(r=>({key:r.key, label:r.name}));
  return [...axisOpts, ...twOpts];
}
function ouaFilterTreeSourceList(){
  const q = (document.getElementById('ouaTreeSourceSearch')?.value || '').trim().toLowerCase();
  const opts = ouaGetTreeSourceOptions().filter(o => !q || o.label.toLowerCase().includes(q));
  const wrap = document.getElementById('ouaTreeSourceList');
  if(!wrap) return;
  if(!opts.length){ wrap.innerHTML = `<div class="empty">Không tìm thấy đơn vị phù hợp.</div>`; return; }
  wrap.innerHTML = opts.map(o=>{
    const safeLabel = o.label.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<div class="tree-source-row"><span>🏢 ${o.label}</span><button class="btn small" onclick="ouaAssignSourceToTree('${o.key}','${safeLabel}')">⇄ Gán sang</button></div>`;
  }).join('');
}
function ouaAssignSourceToTree(sourceKey, label){
  if(!ouaCustomTree) ouaCustomTree = ouaBuildDefaultCustomTree();
  const parent = ouaSelectedTreeNodeId ? ouaFindTreeNode(ouaCustomTree, ouaSelectedTreeNodeId) : null;
  const newNode = {id:'src-'+Date.now()+'-'+Math.floor(Math.random()*1000), label, virtual:false, sourceKey, children:[]};
  if(parent){ parent.children = parent.children || []; parent.children.push(newNode); } else { ouaCustomTree.push(newNode); }
  ouaRenderCustomTree();
  ouaToast(`Đã gán "${label}" vào ${parent ? '"'+parent.label+'"' : 'cây gốc'} (demo, chỉ lưu trong phiên làm việc, chưa ghi backend).`);
}
function ouaSubmitVirtualFolder(){
  const name = (document.getElementById('newVirtualFolderName')?.value || '').trim();
  if(!name){ ouaToast('Vui lòng nhập tên thư mục.'); return; }
  if(!ouaCustomTree) ouaCustomTree = ouaBuildDefaultCustomTree();
  const parent = ouaSelectedTreeNodeId ? ouaFindTreeNode(ouaCustomTree, ouaSelectedTreeNodeId) : null;
  const newNode = {id:'virtual-'+Date.now(), label:name, virtual:true, children:[]};
  if(parent){ parent.children = parent.children || []; parent.children.push(newNode); } else { ouaCustomTree.push(newNode); }
  ouaCloseModal();
  ouaRenderCustomTree();
  ouaToast(`Đã thêm thư mục ảo "${name}" (demo, chỉ lưu trong phiên làm việc, chưa ghi backend).`);
}
function ouaDeleteSelectedNode(){
  if(!ouaSelectedTreeNodeId){ ouaToast('Vui lòng chọn 1 nút trong cây trước.'); return; }
  const removed = ouaRemoveTreeNode(ouaCustomTree, ouaSelectedTreeNodeId);
  ouaSelectedTreeNodeId = null;
  ouaRenderCustomTree();
  ouaToast(removed ? `Đã xoá nút "${removed.label}" (demo, chỉ lưu trong phiên làm việc, chưa ghi backend).` : 'Không tìm thấy nút để xoá.');
}
function ouaResetCustomTree(){
  ouaCustomTree = ouaBuildDefaultCustomTree();
  ouaSelectedTreeNodeId = null;
  ouaRenderCustomTree();
  ouaToast('Đã khôi phục cây thư mục mặc định.');
}
function ouaSaveCustomTree(){
  ouaToast('Đã lưu cấu hình cây (demo, chỉ lưu trong phiên làm việc trình duyệt, chưa ghi backend).');
}
function ouaInitTreeSettings(){
  if(!ouaCustomTree) ouaCustomTree = ouaBuildDefaultCustomTree();
  ouaFilterTreeSourceList();
  ouaRenderCustomTree();
}

function ouaSubmitNewUser(){
  const name = (document.getElementById('newUserName')?.value || '').trim();
  const email = (document.getElementById('newUserEmail')?.value || '').trim();
  const org = (document.getElementById('newUserOrg')?.value || '').trim();
  const position = (document.getElementById('newUserPosition')?.value || '').trim();
  if(!name){ ouaToast('Vui lòng nhập họ tên.'); return; }
  ouaManualUsers.unshift({ id:'NEW-'+Date.now(), name, label:name, email, position, orgName: org || 'Chưa gán đơn vị', axis:null, createdAt: Date.now(), lastLoginAt: null });
  ouaCloseModal();
  ouaFilterUserList();
  ouaToast(`Đã tạo tài khoản "${name}" (demo, chỉ lưu trong phiên làm việc, chưa ghi backend).`);
}

const ouaModalContent = {
editUserRealModal:{title:'Sửa người dùng',body:`<div class="form-grid"><div class="form-control"><label>Họ tên</label><input id="editUserNameInput" placeholder="Họ tên"></div><div class="form-control"><label>Đơn vị công tác</label><input id="editUserOrgInput" placeholder="Đơn vị công tác"></div><div class="form-control"><label>Chức vụ</label><input id="editUserPositionInput" placeholder="Chức vụ"></div></div><div class="hint">Thay đổi chỉ lưu trong phiên làm việc trình duyệt (demo), chưa ghi vào backend.</div>`},
addVirtualFolderModal:{title:'Thêm thư mục ảo',body:`<div class="form-control"><label>Tên thư mục</label><input id="newVirtualFolderName" placeholder="VD: Nhóm đơn vị mới"></div><div class="hint">Thư mục ảo không gắn với đơn vị thật, chỉ dùng để phân nhóm trong cây. Sẽ được thêm vào nút đang chọn (hoặc gốc cây nếu chưa chọn nút nào).</div>`},
addIndicatorMappingModal:{title:'Thêm mapping chỉ tiêu', dynamic:'indicatorAddForm'},
editIndicatorModal:{title:'Sửa mapping chỉ tiêu',body:`<div class="form-grid"><div class="form-control"><label>Tên đơn vị IOC</label><input id="editIndicatorNameInput" placeholder="Tên hiển thị"></div><div class="form-control"><label>Trạng thái</label><select id="editIndicatorStatusInput"><option value="active">Đang dùng</option><option value="hidden">Ẩn</option></select></div></div><div class="hint">Thay đổi chỉ lưu trong phiên làm việc (demo), chưa ghi vào backend.</div>`},
orgAxisMappingModal:{title:'Mapping trục / địa bàn',body:`<div class="form-grid"><div class="form-control"><label>Trục</label><select id="mappingAxisInput"><option value="">— Chọn trục —</option><option value="DANG">Đảng ủy</option><option value="HDND">HĐND</option><option value="UBND">UBND</option><option value="MTTQ">MTTQ</option></select></div><div class="form-control"><label>Địa bàn</label><input id="mappingDiaBanInput" placeholder="VD: Thành phố Hà Nội"></div></div><div class="hint">Dùng để sửa tay những đơn vị chưa map đúng trục/địa bàn từ nguồn tự động. Chỉ dành cho Global Admin (demo, chỉ lưu trong phiên làm việc).</div>`},
editFieldModal:{title:'Sửa lĩnh vực',body:`<div class="form-control"><label>Tên lĩnh vực</label><input id="editFieldNameInput" placeholder="Tên lĩnh vực"></div><div class="hint">Đổi tên chỉ áp dụng cho phiên làm việc hiện tại (demo).</div>`},
createUserRealModal:{title:'Tạo tài khoản',body:`<div class="form-grid"><div class="form-control"><label>Họ tên</label><input id="newUserName" placeholder="Nhập họ tên"></div><div class="form-control"><label>Email</label><input id="newUserEmail" placeholder="ten@hanoi.gov.vn"></div><div class="form-control"><label>Đơn vị công tác</label><input id="newUserOrg" placeholder="Nhập tên đơn vị"></div><div class="form-control"><label>Chức vụ</label><input id="newUserPosition" placeholder="Nhập chức vụ"></div></div><div class="hint">Tài khoản mới chỉ lưu tạm trong phiên làm việc trình duyệt (demo), chưa ghi vào backend/SSO thật.</div>`},
importUserExcelModal:{title:'Import Excel',body:`<div class="checklist"><div class="check"><b>Input</b><span>File Excel danh sách tài khoản (họ tên, email, đơn vị, chức vụ)</span></div><div class="check"><b>Xử lý</b><span>Đọc từng dòng, đối chiếu email/username với SSO, báo lỗi dòng trùng hoặc thiếu trường bắt buộc</span></div><div class="check"><b>Output</b><span>Danh sách tài khoản chờ duyệt trước khi map vào IOC</span></div></div><div class="hint">Bản demo chưa đọc file thật — Dev cần gắn xử lý Excel (vd SheetJS) + API import ở bước sau.</div>`},
addOrgRealModal:{title:'Tạo đơn vị mới',body:`<div class="form-grid"><div class="form-control"><label>Tên đơn vị</label><input id="newOrgName" placeholder="Nhập tên đơn vị"></div><div class="form-control"><label>Trục</label><select id="newOrgAxis"><option value="DANG">Đảng ủy</option><option value="HDND">HĐND</option><option value="UBND" selected>UBND</option><option value="MTTQ">MTTQ</option></select></div><div class="form-control"><label>Đơn vị cấp trên</label><input id="newOrgParent" placeholder="Mặc định: THÀNH PHỐ HÀ NỘI"></div></div><div class="hint">Đơn vị mới chỉ lưu tạm trong phiên làm việc trình duyệt (demo), chưa ghi vào backend/account.json thật.</div>`},
syncOrgModal:{title:'Đồng bộ cơ cấu tổ chức',body:`<div class="checklist"><div class="check"><b>Input</b><span>Nguồn đồng bộ, thời điểm đồng bộ, phạm vi đơn vị</span></div><div class="check"><b>Xử lý</b><span>Lấy cây đơn vị, mã đơn vị, chức vụ, trạng thái từ hệ thống CBCCVC/BKAV</span></div><div class="check"><b>Output</b><span>Cập nhật org mapping trong IOC, ghi audit log</span></div></div>`},
addOrgModal:{title:'Thêm đơn vị IOC nội bộ',body:`<div class="form-grid"><div class="form-control"><label>Tên đơn vị</label><input placeholder="Nhập tên đơn vị"></div><div class="form-control"><label>Trục</label><select><option>Thành ủy</option><option>HĐND</option><option>UBND</option><option>MTTQ</option></select></div><div class="form-control"><label>Đơn vị cấp trên</label><input placeholder="Chọn đơn vị cha"></div><div class="form-control"><label>Loại đơn vị</label><select><option>Đơn vị trực thuộc</option><option>Đơn vị xã/phường</option></select></div></div><div class="hint">Dev cần validate trùng mã, trùng tên trong cùng đơn vị cha, bắt buộc chọn trục và cấp tổ chức.</div>`},
orgTreeModal:{title:'Xem cây đơn vị', dynamic:'orgTree'},
mapOrgModal:{title:'Mapping mã đơn vị',body:`<div class="form-grid"><div class="form-control"><label>Mã đơn vị IOC</label><input value="ORG-TU-001"></div><div class="form-control"><label>Mã đơn vị BKAV</label><input value="BKAV-ORG-00012"></div></div><div class="hint">Chỉ quản trị hệ thống được sửa mapping. Sau khi lưu phải tính lại phạm vi dữ liệu của user thuộc đơn vị này.</div>`},
dataScopeModal:{title:'Cấu hình phạm vi dữ liệu đơn vị',body:`<div class="form-grid"><div class="form-control"><label>Scope mặc định</label><select><option>CITY_AXIS</option><option>WARD_ALL_AXIS</option><option>ORG_ONLY</option></select></div><div class="form-control"><label>Trục dữ liệu</label><select><option>Thành ủy</option><option>HĐND</option><option>UBND</option><option>MTTQ</option></select></div></div><div class="hint">Scope là điều kiện lọc dữ liệu backend, không phải button UI riêng.</div>`},
editOrgModal:{title:'Chỉnh sửa thông tin đơn vị',body:`<div class="form-grid"><div class="form-control"><label>Tên hiển thị IOC</label><input value="Văn phòng Thành ủy Hà Nội"></div><div class="form-control"><label>Tên viết tắt</label><input value="VPTU Hà Nội"></div><div class="form-control"><label>Email công vụ</label><input value="vptu@hanoi.gov.vn"></div><div class="form-control"><label>Trạng thái sử dụng</label><select><option>Đang hoạt động</option><option>Tạm khóa</option></select></div></div>`},
addChildOrgModal:{title:'Thêm đơn vị trực thuộc',body:`<div class="form-grid"><div class="form-control"><label>Tên đơn vị trực thuộc</label><input placeholder="Nhập tên"></div><div class="form-control"><label>Đơn vị cha</label><input value="Văn phòng Thành ủy Hà Nội"></div></div>`},
childOrgDetailModal:{title:'Xem nhanh đơn vị trực thuộc',body:`<table><tr><th>Tên đơn vị</th><td>Ban Tổ chức Thành ủy</td></tr><tr><th>Mã IOC</th><td>ORG-TU-TC</td></tr><tr><th>Trạng thái</th><td>Đang hoạt động</td></tr></table>`},
previewOrgScopeModal:{title:'Preview dữ liệu đơn vị được xem',body:`<div class="checklist"><div class="check"><b>Dashboard</b><span>Thấy số liệu trong trục Thành ủy cấp Thành phố</span></div><div class="check"><b>Nhiệm vụ</b><span>Thấy nhiệm vụ do đơn vị chủ trì/phối hợp hoặc được cấp scope</span></div><div class="check"><b>Văn bản</b><span>Thấy văn bản thuộc đơn vị/trục theo rule</span></div></div>`},
syncUserModal:{title:'Đồng bộ tài khoản SSO',body:`<div class="checklist"><div class="check"><b>Input</b><span>Username, email, trạng thái tài khoản từ SSO</span></div><div class="check"><b>Output</b><span>Danh sách tài khoản có thể mapping vào IOC</span></div><div class="check"><b>Rule</b><span>SSO chỉ là nguồn định danh/xác thực; quyền module chi tiết cấp tại IOC</span></div></div>`},
mapUserModal:{title:'Map tài khoản vào IOC',body:`<div class="stepper"><div class="step active">1. Chọn SSO</div><div class="step">2. Khớp CBCCVC</div><div class="step">3. Chọn đơn vị</div><div class="step">4. Gán role</div><div class="step">5. Preview</div></div><div class="form-grid"><div class="form-control"><label>Tài khoản SSO</label><input placeholder="Tìm username SSO"></div><div class="form-control"><label>Hồ sơ CBCCVC</label><input placeholder="Tìm mã cán bộ/công chức"></div></div>`},
filterModal:{title:'Bộ lọc nâng cao người dùng',body:`<div class="form-grid"><div class="form-control"><label>Đơn vị</label><input placeholder="Chọn đơn vị"></div><div class="form-control"><label>Trạng thái mapping</label><select><option>Đã map đủ</option><option>Thiếu role module</option><option>Chưa map IOC</option></select></div></div>`},
quickPermissionModal:{title:'Cấp quyền nhanh',body:`<div class="form-grid"><div class="form-control"><label>Role mẫu</label><select><option>Lãnh đạo trục</option><option>Chuyên viên</option><option>Văn thư</option><option>Quản trị hệ thống</option></select></div><div class="form-control"><label>Trục áp dụng</label><select><option>Thành ủy</option><option>HĐND</option><option>UBND</option><option>MTTQ</option></select></div></div><div class="hint">Sau khi chọn role mẫu, hệ thống tự fill quyền module. Admin vẫn phải Preview trước khi kích hoạt.</div>`},
applyRoleTemplateModal:{title:'Áp role mẫu cho nhiều module',body:`<div class="form-grid"><div class="form-control"><label>Chọn nhóm module</label><select><option>Tất cả module tác nghiệp</option><option>Nhóm điều hành IOC/CAD</option><option>Nhóm nghiệp vụ mở rộng</option><option>Nhóm quản trị & tích hợp</option></select></div><div class="form-control"><label>Role muốn áp dụng</label><select><option>Lãnh đạo trục</option><option>Cấp phó trục</option><option>Văn phòng/Điều phối</option><option>Trưởng đơn vị</option><option>Phó đơn vị</option><option>Chuyên viên/Cán bộ</option><option>Văn thư</option><option>Ủy viên/Đại biểu</option><option>Trực IOC/CAD</option><option>Quản trị hệ thống</option><option>Chỉ xem</option><option>Không cấp quyền</option></select></div></div><div class="hint">Dev cần áp role hàng loạt cho các module được chọn, sau đó refresh lại danh sách module/role và bắt buộc preview trước khi lưu.</div>`},
bulkEditOperationModulesModal:{title:'Sửa nhanh nhóm điều hành IOC/CAD',body:`<div class="hint">Áp role cho các module Dashboard, Nhiệm vụ, Văn bản, Notify. Không lưu ngay; chỉ cập nhật màn hình để quản trị viên kiểm tra.</div>`},
bulkEditBusinessModulesModal:{title:'Sửa nhanh nhóm nghiệp vụ mở rộng',body:`<div class="hint">Áp role cho các module Kịch bản xử lý, Chỉ tiêu/Lĩnh vực, GIS, Lịch họp.</div>`},
bulkEditAdminModulesModal:{title:'Sửa nhanh nhóm quản trị & tích hợp',body:`<div class="hint">Nhóm này mặc định Không cấp quyền, trừ tài khoản Quản trị hệ thống hoặc tài khoản được ủy quyền bằng văn bản.</div>`},
dashboardRoleDetailModal:{title:'Chi tiết quyền Dashboard theo role',body:`<div class="matrix"><table><thead><tr><th>Permission</th><th>Lãnh đạo trục</th><th>Chỉ xem</th><th>Không cấp quyền</th></tr></thead><tbody><tr><td>Xem dashboard</td><td>TRUE</td><td>TRUE</td><td>FALSE</td></tr><tr><td>Drilldown KPI</td><td>TRUE</td><td>TRUE</td><td>FALSE</td></tr><tr><td>Export</td><td>TRUE</td><td>FALSE</td><td>FALSE</td></tr></tbody></table></div>`},
taskRoleDetailModal:{title:'Chi tiết quyền Nhiệm vụ theo role',body:`<div class="matrix"><table><thead><tr><th>Permission</th><th>Lãnh đạo trục</th><th>Chuyên viên</th><th>Chỉ xem</th></tr></thead><tbody><tr><td>Xem nhiệm vụ</td><td>TRUE</td><td>TRUE</td><td>TRUE</td></tr><tr><td>Tạo/Giao nhiệm vụ</td><td>TRUE</td><td>FALSE</td><td>FALSE</td></tr><tr><td>Cập nhật tiến độ</td><td>TRUE</td><td>TRUE</td><td>FALSE</td></tr><tr><td>Phê duyệt/Trả lại</td><td>TRUE</td><td>FALSE</td><td>FALSE</td></tr><tr><td>Xóa nháp/Hủy/Mở lại</td><td>TRUE theo trạng thái</td><td>FALSE</td><td>FALSE</td></tr></tbody></table></div>`},
docRoleDetailModal:{title:'Chi tiết quyền Văn bản theo role',body:`<div class="hint">Hiển thị action theo file phân quyền: xem văn bản đến/đi, chọn văn bản, giao xử lý, phê duyệt/phát hành, lưu trữ. Quyền delete chỉ áp dụng văn bản/hồ sơ nháp nếu có rule trạng thái.</div>`},
notifyRoleDetailModal:{title:'Chi tiết quyền Notify theo role',body:`<div class="hint">Notify gồm xem danh sách, xem chi tiết, tiếp nhận, chuyển thành nhiệm vụ, báo cáo vượt cấp, cấu hình nguồn notify. Cấu hình nguồn chỉ dành cho Quản trị hệ thống/Trực IOC-CAD được ủy quyền.</div>`},
scenarioRoleDetailModal:{title:'Chi tiết quyền Kịch bản xử lý',body:`<div class="hint">Kịch bản gồm xem/chọn scenario, áp dụng vào nhiệm vụ/chỉ tiêu/lĩnh vực, tạo/sửa/archive/khôi phục. Scenario đã sinh nhiệm vụ nhánh thì khóa sửa trực tiếp.</div>`},
indicatorRoleDetailModal:{title:'Chi tiết quyền Chỉ tiêu/Lĩnh vực',body:`<div class="hint">Quyền gồm xem nhóm chỉ tiêu, mở dashboard lĩnh vực, xem record, cập nhật/xác nhận số liệu nếu role cho phép, export theo data scope.</div>`},
gisRoleDetailModal:{title:'Chi tiết quyền GIS',body:`<div class="hint">Quyền gồm xem bản đồ/layer/marker, tìm kiếm, khoanh vùng, cấu hình layer. Role Chỉ xem không được lưu/xóa vùng khoanh hoặc cấu hình layer.</div>`},
calendarRoleDetailModal:{title:'Chi tiết quyền Lịch họp',body:`<div class="hint">Quyền gồm xem lịch, xem chi tiết họp, tài liệu họp, tạo nhiệm vụ từ kết luận họp. Tạo nhiệm vụ phải check thêm quyền module Nhiệm vụ.</div>`},
sourceRoleDetailModal:{title:'Chi tiết quyền Nguồn dữ liệu',body:`<div class="hint">Role Chỉ xem chỉ thấy trạng thái nguồn, last sync, lỗi đồng bộ. Chạy sync/cấu hình nguồn chỉ dành cho Quản trị hệ thống hoặc Trực IOC/CAD được cấp quyền.</div>`},
adminRoleDetailModal:{title:'Chi tiết quyền Quản trị/Audit',body:`<div class="hint">Quản trị/Audit gồm quản lý user, role, quyền chức năng, data scope, status rule, audit log. Không cấp mặc định cho lãnh đạo nghiệp vụ.</div>`},
orgAdminRoleDetailModal:{title:'Chi tiết quyền Quản lý đơn vị',body:`<div class="hint">Quản lý đơn vị gồm xem danh sách, xem chi tiết, đồng bộ BKAV, sửa mapping IOC-BKAV, quản lý đơn vị trực thuộc, xem cây tổ chức.</div>`},
userAdminRoleDetailModal:{title:'Chi tiết quyền Quản lý người dùng',body:`<div class="hint">Quản lý người dùng gồm xem danh sách, mapping SSO vào IOC, gán role theo module, reset quyền, preview quyền, xem audit. Backend phải check quyền ở mọi API.</div>`},
roleModuleModal:{title:'Xem quyền của role đang chọn',body:`<div class="matrix"><table><thead><tr><th>Role</th><th>Ý nghĩa</th><th>Cách hệ thống dùng</th></tr></thead><tbody><tr><td>Lãnh đạo trục</td><td>Quyền chỉ đạo/phê duyệt trong trục</td><td>Suy ra TRUE/FALSE theo từng permission của module</td></tr><tr><td>Chuyên viên/Cán bộ</td><td>Xử lý hồ sơ được giao</td><td>Chủ yếu VIEW/UPDATE_STATUS/UPLOAD</td></tr><tr><td>Chỉ xem</td><td>Chỉ tra cứu dashboard/báo cáo</td><td>VIEW nhưng không CREATE/UPDATE/DELETE/APPROVE</td></tr><tr><td>Không cấp quyền</td><td>Không được vào module</td><td>Backend trả 403 nếu truy cập API module</td></tr></tbody></table></div>`},
previewPermissionModal:{title:'Preview quyền hiệu lực',body:`<div class="checklist"><div class="check"><b>Quyền chức năng</b><span>Được xem dashboard, giao nhiệm vụ, phê duyệt nhiệm vụ, xem văn bản.</span></div><div class="check"><b>Phạm vi dữ liệu</b><span>Thấy dữ liệu trục Thành ủy cấp Thành phố theo scope CITY_AXIS.</span></div><div class="check"><b>Cảnh báo</b><span>Không có quyền quản trị người dùng.</span></div></div>`},
resetPermissionModal:{title:'Reset quyền người dùng',body:`<div class="hint">Thao tác này đưa quyền module/data scope của user về mặc định theo role và đơn vị. Bắt buộc nhập lý do và ghi audit log.</div><div class="form-control"><label>Lý do reset</label><textarea rows="4" placeholder="Nhập lý do"></textarea></div>`},
savePermissionModal:{title:'Lưu thay đổi quyền',body:`<div class="hint">Trước khi lưu, hệ thống phải validate: tài khoản SSO còn hiệu lực, có mapping CBCCVC hoặc được đánh dấu tài khoản đặc biệt, có role module, có data scope hợp lệ.</div>`},
editScopeModal:{title:'Chỉnh phạm vi dữ liệu người dùng',body:`<div class="form-grid"><div class="form-control"><label>Scope level</label><select><option>CITY_AXIS</option><option>WARD_ALL_AXIS</option><option>ORG_ONLY</option><option>SELF_ASSIGNED</option></select></div><div class="form-control"><label>Đơn vị/trục áp dụng</label><input value="Thành ủy / Văn phòng Thành ủy"></div></div>`}
};
/* Bảng tra cứu pageId -> {menu, title} — thêm nhóm menu mới chỉ cần thêm entry ở đây, không sửa ouaGoPage(). */
const ouaPageMeta = {
  'admin-overview': {menu:'admin-overview', title:'Quản trị Tổng'},
  'org-list': {menu:'org-list', title:'Quản lý đơn vị'},
  'org-detail': {menu:'org-list', title:'Quản lý đơn vị'},
  'user-list': {menu:'user-list', title:'Quản lý người dùng'},
  'user-detail': {menu:'user-list', title:'Quản lý người dùng'},
  'field-settings': {menu:'field-settings', title:'Cài đặt lĩnh vực'},
  'org-grouping': {menu:'org-grouping', title:'Phân nhóm đơn vị'},
  'indicator-mapping': {menu:'indicator-mapping', title:'Cấu hình chỉ tiêu đơn vị'},
  'tree-settings': {menu:'tree-settings', title:'Cài đặt cây thư mục'},
  'login-log': {menu:'login-log', title:'Nhật ký đăng nhập'},
  'source-admin': {menu:'source-admin', title:'Quản trị nguồn dữ liệu'}
};
function ouaGoPage(id){
  const root=document.getElementById('ouaScreen');
  root.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  root.querySelectorAll('.nav').forEach(n=>n.classList.remove('active'));
  const meta = ouaPageMeta[id] || {menu:id, title:document.getElementById('pageTitle').innerText};
  const navBtn = root.querySelector(`.nav[data-page="${meta.menu}"]`);
  if(navBtn) navBtn.classList.add('active');
  document.getElementById('pageTitle').innerText = meta.title;
  ouaToggleMobileSidebar(false);
  ouaCloseFilterSheet();
  if(id==='admin-overview') ouaRenderAdminOverview();
  if(id==='user-list') ouaFilterUserList();
  if(id==='field-settings') ouaFilterFieldList();
  if(id==='org-grouping') ouaFilterGroupingList();
  if(id==='indicator-mapping') ouaFilterIndicatorList();
  if(id==='tree-settings') ouaInitTreeSettings();
  if(id==='login-log' && typeof ollOpen==='function') ollOpen(); // js/oua-login-log.js
  if(id==='source-admin' && typeof odsOpen==='function') odsOpen(); // js/oua-data-sources.js
  window.scrollTo({top:0,behavior:'smooth'});
}
function ouaGoDetail(id){ouaGoPage(id)}
document.querySelectorAll('#ouaScreen .nav').forEach(n=>n.onclick=()=>ouaGoPage(n.dataset.page));
document.querySelectorAll('#ouaScreen .tabs .tab').forEach(t=>t.onclick=()=>{let wrap=t.closest('.tabs');wrap.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');let panel=t.closest('.panel');panel.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));document.getElementById(t.dataset.target).classList.add('active');});
/* ouaActiveModalKey theo dõi modal đang mở để ouaConfirmModal() có thể định tuyến sang xử lý riêng (vd tạo đơn
   vị mới cần đọc input thật và đẩy vào ouaOrgRows) thay vì luôn hiện toast chung chung như trước. */
let ouaActiveModalKey = null;
function ouaOpenModal(key){ouaActiveModalKey=key;const okBtn=document.querySelector('#ouaModalRoot .modal-footer .btn.primary');if(okBtn)okBtn.textContent='Xác nhận';let c=ouaModalContent[key]||{title:'Thông báo',body:'Chức năng đang được mô tả cho Dev.'};let body=c.dynamic==='orgTree'?ouaBuildOrgTreeHtml():(c.dynamic==='indicatorAddForm'?ouaBuildIndicatorAddFormHtml():c.body);document.getElementById('ouaModalTitle').innerHTML=c.title;document.getElementById('ouaModalBody').innerHTML=body;document.getElementById('ouaModalRoot').classList.add('show')}
function ouaCloseModal(){document.getElementById('ouaModalRoot').classList.remove('show')}
function ouaConfirmModal(){
  if(ouaActiveModalKey==='addOrgRealModal'){ ouaSubmitNewOrg(); return; }
  if(ouaActiveModalKey==='createUserRealModal'){ ouaSubmitNewUser(); return; }
  if(ouaActiveModalKey==='editUserRealModal'){ ouaSubmitEditUser(); return; }
  if(ouaActiveModalKey==='editFieldModal'){ ouaSubmitEditField(); return; }
  if(ouaActiveModalKey==='orgAxisMappingModal'){ ouaSubmitMapping(); return; }
  if(ouaActiveModalKey==='addIndicatorMappingModal'){ ouaSubmitIndicatorMapping(); return; }
  if(ouaActiveModalKey==='editIndicatorModal'){ ouaSubmitEditIndicator(); return; }
  if(ouaActiveModalKey==='addVirtualFolderModal'){ ouaSubmitVirtualFolder(); return; }
  if(ouaActiveModalKey==='odsDetail'){ odsSaveConfig(); return; } // js/oua-data-sources.js
  ouaCloseModal();
  ouaToast('Đã ghi nhận thao tác mẫu. Dev cần gắn API thật theo SRS.');
}
function ouaToast(msg){let t=document.getElementById('ouaToastBox');t.innerText=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
/* Menu kéo ra (hamburger) cho mobile — sidebar vốn đã luôn nằm trong DOM, chỉ thêm/bớt class 'open' để trượt vào
   màn hình (CSS @media(max-width:900px) lo phần vị trí/transform). Tự đóng khi chọn 1 trang trong menu, vì trên
   điện thoại bấm xong nên thấy ngay nội dung thay vì vẫn che bởi sidebar. */
function ouaToggleMobileSidebar(open){
  const sidebar = document.getElementById('ouaSidebar');
  const backdrop = document.getElementById('ouaSidebarBackdrop');
  if(!sidebar || !backdrop) return;
  sidebar.classList.toggle('open', open);
  backdrop.classList.toggle('show', open);
}
/* ===== Phase C — Bảng lọc trượt lên (bottom sheet), dùng chung cho mọi trang =====
   Không copy/nhân đôi control — chuyển THẬT sự khối .oua-filter-extra (chứa các <select> đã được
   ouaEnhanceSelect() bọc dropdown riêng) từ đúng vị trí gốc trong trang vào #ouaFilterSheetBody, và trả lại
   đúng vị trí cũ (bằng ouaSheetOriginalNextSibling làm mốc) khi đóng — nên không cần đồng bộ giá trị 2 nơi. */
let ouaSheetContentEl = null, ouaSheetOriginalParent = null, ouaSheetOriginalNextSibling = null, ouaSheetTriggerEl = null;
function ouaOpenFilterSheet(selector, triggerEl){
  const el = document.querySelector(selector);
  const body = document.getElementById('ouaFilterSheetBody');
  if(!el || !body) return;
  ouaSheetContentEl = el;
  ouaSheetOriginalParent = el.parentNode;
  ouaSheetOriginalNextSibling = el.nextSibling;
  ouaSheetTriggerEl = triggerEl || null;
  body.appendChild(el);
  document.getElementById('ouaFilterSheetBackdrop').classList.add('show');
  document.getElementById('ouaFilterSheet').classList.add('open');
  if(ouaSheetTriggerEl) ouaSheetTriggerEl.classList.add('active');
}
function ouaCloseFilterSheet(){
  if(ouaSheetContentEl && ouaSheetOriginalParent){
    ouaSheetOriginalParent.insertBefore(ouaSheetContentEl, ouaSheetOriginalNextSibling);
  }
  if(ouaSheetTriggerEl) ouaSheetTriggerEl.classList.remove('active');
  ouaSheetContentEl = null; ouaSheetOriginalParent = null; ouaSheetOriginalNextSibling = null; ouaSheetTriggerEl = null;
  document.getElementById('ouaFilterSheetBackdrop').classList.remove('show');
  document.getElementById('ouaFilterSheet').classList.remove('open');
}
/* UI mobile mới cho màn quản trị (cách A, 2026-10-13): trên điện thoại / màn cảm ứng, mở quản trị sẽ chuyển
   sang mobile-admin/index.html; máy tính vẫn dùng màn này. Đặt cờ = false để quay lại bản mobile cũ (khối CSS
   mobile Phase A–G trong demo_ioc.html / oua-admin.html vẫn giữ nguyên, không xóa). oua-admin.html có 1 đoạn
   kiểm tra tương tự ở <head> — đổi cờ thì đổi cả ở đó. */
const OUA_MOBILE_NEW_UI = true;
const OUA_MOBILE_NEW_UI_URL = 'mobile-admin/index.html';
function ouaIsMobileWeb(){ try{ return matchMedia('(max-width:520px), (pointer:coarse)').matches; }catch(e){ return false; } }
function ouaOpen(){
  if(OUA_MOBILE_NEW_UI && ouaIsMobileWeb()){ location.href = OUA_MOBILE_NEW_UI_URL; return; }
  if(typeof ollRecordAdminSession==='function') ollRecordAdminSession(); // mỗi lần vào màn quản trị = 1 phiên trong Nhật ký đăng nhập
  document.getElementById('loginScreen').classList.add('hidden');document.getElementById('ouaScreen').classList.remove('hidden');ouaBuildRealData();ouaGoPage('admin-overview');
}
function ouaExit(){document.getElementById('ouaScreen').classList.add('hidden');document.getElementById('loginScreen').classList.remove('hidden');}
ouaInitOrgData();
ouaRenderFieldOrgSelect();

/* ===== Dropdown tự vẽ thay <select> gốc trong toàn bộ màn quản trị (#ouaScreen) =====
   Popup của <select> do trình duyệt vẽ (nền trắng, font hệ thống) nên CSS không chỉnh được. Ở đây mỗi <select> được
   giữ lại (ẩn) làm nguồn giá trị — mọi code cũ đọc/ghi select.value và onchange="..." vẫn chạy nguyên — và vẽ thêm
   1 nút + bảng chọn theo đúng phong cách web. MutationObserver tự bọc luôn các <select> sinh động (bảng, modal). */
function ouaEnhanceSelect(sel){
  if(sel.dataset.ouaDd) return;
  sel.dataset.ouaDd = '1';
  const wrap = document.createElement('div'); wrap.className = 'oua-dd';
  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(sel);
  sel.classList.add('oua-dd-native');
  const trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'oua-dd-trigger';
  trigger.innerHTML = '<span class="oua-dd-label"></span><span class="oua-dd-caret"></span>';
  const panel = document.createElement('div'); panel.className = 'oua-dd-panel hidden';
  wrap.append(trigger, panel);
  const labelEl = trigger.querySelector('.oua-dd-label');
  const syncLabel = ()=>{ const o = sel.options[sel.selectedIndex]; labelEl.textContent = o ? o.textContent : ''; };
  const close = ()=>{ panel.classList.add('hidden'); wrap.classList.remove('open'); };
  const renderOptions = ()=>{
    panel.innerHTML = '';
    [...sel.options].forEach((o,i)=>{
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'oua-dd-opt' + (i===sel.selectedIndex ? ' active' : '');
      b.textContent = o.textContent;
      b.onclick = (e)=>{ e.stopPropagation(); sel.selectedIndex = i; syncLabel(); sel.dispatchEvent(new Event('change',{bubbles:true})); close(); };
      panel.appendChild(b);
    });
  };
  const open = ()=>{
    document.querySelectorAll('#ouaScreen .oua-dd.open').forEach(w=>{ w.classList.remove('open'); w.querySelector('.oua-dd-panel')?.classList.add('hidden'); });
    renderOptions(); panel.classList.remove('hidden'); wrap.classList.add('open');
    panel.querySelector('.active')?.scrollIntoView({block:'nearest'});
  };
  trigger.onclick = (e)=>{ e.stopPropagation(); panel.classList.contains('hidden') ? open() : close(); };
  trigger.onkeydown = (e)=>{ if(e.key==='Escape') close(); };
  /* Code cũ hay gán select.value = ... bằng JS (không bắn sự kiện) — chặn setter để nhãn hiển thị luôn khớp. */
  const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  Object.defineProperty(sel, 'value', { configurable:true, get(){ return desc.get.call(this); }, set(v){ desc.set.call(this, v); syncLabel(); } });
  new MutationObserver(syncLabel).observe(sel, {childList:true});
  syncLabel();
}
function ouaEnhanceAllSelects(){
  const root = document.getElementById('ouaScreen'); if(!root) return;
  root.querySelectorAll('select:not([data-oua-dd])').forEach(ouaEnhanceSelect);
}
document.addEventListener('click', (e)=>{
  if(e.target.closest && e.target.closest('#ouaScreen .oua-dd')) return;
  document.querySelectorAll('#ouaScreen .oua-dd.open').forEach(w=>{ w.classList.remove('open'); w.querySelector('.oua-dd-panel')?.classList.add('hidden'); });
});
ouaEnhanceAllSelects();
(function(){ const root = document.getElementById('ouaScreen'); if(root) new MutationObserver(ouaEnhanceAllSelects).observe(root, {childList:true, subtree:true}); })();
