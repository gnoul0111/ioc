/* ============================== CẤU HÌNH CHỨC NĂNG IOC — khung dùng chung ==============================
 Khai báo tham số của các chức năng IOC (lần này: Noti; sau thêm Nhiệm vụ, GIS, Chỉ tiêu… chỉ cần khai báo thêm).
 Màn quản trị «Cấu hình chức năng IOC» (js/oua-cau-hinh.js) tự dựng bảng từ khai báo này; chức năng đọc giá trị
 qua ichBat()/ichSo(). Bảng tham số anh duyệt 17/11/2026.
 Bản demo: lưu localStorage của trình duyệt, áp chung mọi đơn vị. Tiền tố ich.

 Mỗi tab: kieu 'muc' (cột Nhóm/Mức/Icon) hoặc 'thamso' (cột Tham số/Trạng thái/Giá trị); congTac: chữ cột và chữ dưới công
 tắc (mặc định Sử dụng / Đang bật / Đang tắt); uuTien: thứ tự ưu tiên (tên sau dấu chấm cuối của id) khi một bản ghi
 thỏa nhiều trạng thái — chức năng đọc thứ tự này qua ichUuTien(), không tự viết lại.

 Mỗi tham số:
   id        mã duy nhất "<chức năng>.<tab>.<tên>"
   cn, tab   chức năng, tab chứa nó
   ten       tên dòng (cột Tham số / Nhóm)
   muc       (tab kiểu 'muc') cột Mức;  apDung: cột Áp dụng cho;  icon: cột Icon
   nhan      nhãn trạng thái như trên Noti: [chữ, lớp màu]
   moTa      cột Cách áp dụng
   so        có ô nhập số: {macDinh, donVi, min, max, ghiChu} — min/max là số hoặc hàm (giá trị hiện tại) → số;
             có luaChon {số: tên} thì hiện ô chọn thay cho ô nhập
   bat       mặc định của công tắc Sử dụng (true/false)
   chiXem    true: dòng chỉ hiển thị, luôn bật, không sửa được
   giaTriXem chữ hiện ở cột Giá trị cho dòng chỉ hiển thị
   phuThuoc  id dòng cha: dòng cha tắt thì dòng này khóa
   doan      tên đoạn (dòng tiêu đề nhỏ) bắt đầu từ dòng này */

const ICH_STORE_KEY='ioc.cauHinhChucNang.v1';
const ICH_EVENT='ioc-cau-hinh-doi';

const ICH_CHUC_NANG=[
 {key:'noti',label:'Noti',icon:'🔔',ten:'Notify IOC/CAD cần xử lý',tabs:[
  {key:'kcqt',label:'Khẩn cấp/Quan trọng',kieu:'muc',tieuDe:'Nhiệm vụ khẩn cấp/quan trọng',
   congTac:{cot:'Hoạt động',bat:'Hoạt động',tat:'Ngừng hoạt động'},
   moTa:'Chọn những mức được đưa vào tab Khẩn cấp/Quan trọng trên Noti. Nhiệm vụ, văn bản, điểm nghẽn thỏa ít nhất một mức đang bật thì hiện trong tab; icon hiện cạnh tiêu đề và không thay cho nhãn trạng thái.',
   chuThich:'Mức độ quan trọng Bình thường và độ khẩn Thường không thuộc tab này. Thỏa nhiều mức thì hiện đủ các icon. Trong tab, Khẩn cấp xếp trước Gấp, Gấp xếp trước Quan trọng.'},
  {key:'nv',label:'Nhiệm vụ',kieu:'thamso',tieuDe:'Thông báo nhiệm vụ',
   moTa:'Thiết lập mốc thời gian và ngưỡng dùng để xác định trạng thái nhiệm vụ trên Noti. Mỗi nhiệm vụ chỉ hiện ở một trạng thái; thỏa nhiều trạng thái thì lấy trạng thái đứng trước trong thứ tự ưu tiên. Giá trị mới áp dụng ngay sau khi lưu.',
   uuTien:['quaHanKhanCap','quaHan','hanHomNay','sapHetHan','moi','trongHan','hoanThanh'],
   chuThich:'Trạng thái tắt sẽ không hiện trên Noti và không có trong bộ lọc trạng thái. Dòng có dấu 🔒 chỉ để xem, không thay đổi được.'},
  {key:'vb',label:'Văn bản',kieu:'thamso',tieuDe:'Thông báo văn bản',
   moTa:'Thiết lập mốc thời gian dùng để xác định trạng thái văn bản trên Noti. Mỗi văn bản chỉ hiện ở một trạng thái; thỏa nhiều trạng thái thì lấy trạng thái đứng trước trong thứ tự ưu tiên.',
   uuTien:['sapDenHan','moi','doiTrangThai'],
   chuThich:'Trạng thái tắt sẽ không hiện trên Noti và không có trong bộ lọc trạng thái. Dòng có dấu 🔒 chỉ để xem, không thay đổi được.'},
  {key:'kpi',label:'OKR/KPI',kieu:'thamso',tieuDe:'Thông báo chỉ tiêu OKR/KPI',
   moTa:'Chọn trạng thái chỉ tiêu được hiện trên Noti. Chỉ tiêu không có hạn xử lý nên không có mốc thời gian.',
   chuThich:'Trạng thái tắt sẽ không hiện trên Noti và không có trong bộ lọc trạng thái.'},
  {key:'gis',label:'GIS',kieu:'thamso',tieuDe:'Thông báo GIS/Camera AI',
   moTa:'Chọn trạng thái điểm nghẽn GIS, cảnh báo Camera AI được hiện trên Noti.',
   chuThich:'Trạng thái tắt sẽ không hiện trên Noti và không có trong bộ lọc trạng thái. Dòng có dấu 🔒 chỉ để xem, không thay đổi được.'}
 ]}
];

/* Giá trị hiện tại của một tham số khác, dùng trong khoảng nhập động. Ô đang nhập sai (không phải số) thì coi như
   không có, để khoảng của ô kia không bị hỏng theo. */
function ichSoHopLe(gt,id){const x=gt&&gt[id];return x&&Number.isInteger(x.so)?x.so:null;}

const ICH_THAM_SO=[
 /* ---- Noti · Khẩn cấp/Quan trọng ---- */
 {id:'noti.kcqt.quanTrongCao',cn:'noti',tab:'kcqt',ten:'Mức độ quan trọng',muc:'Cao',apDung:'Nhiệm vụ, Văn bản',icon:'❗',bat:true,
  moTa:'Nhiệm vụ, văn bản có mức độ quan trọng Cao được đưa vào tab, hiện icon ❗ cạnh tiêu đề.'},
 {id:'noti.kcqt.khanCap',cn:'noti',tab:'kcqt',ten:'Độ khẩn',muc:'Khẩn cấp',apDung:'Nhiệm vụ, Văn bản',icon:'⚠️',bat:true,
  moTa:'Nhiệm vụ, văn bản có độ khẩn Khẩn cấp được đưa vào tab, hiện icon ⚠️ cạnh tiêu đề.'},
 {id:'noti.kcqt.gap',cn:'noti',tab:'kcqt',ten:'Độ khẩn',muc:'Gấp',apDung:'Nhiệm vụ, Văn bản',icon:'⚠️',bat:false,
  moTa:'Nhiệm vụ, văn bản có độ khẩn Gấp được đưa vào tab, hiện icon ⚠️ cạnh tiêu đề.'},
 {id:'noti.kcqt.gisNguyHiem',cn:'noti',tab:'kcqt',ten:'Mức nguy hiểm',muc:'Từ mức',apDung:'GIS',icon:'⚠️',bat:true,
  so:{macDinh:4,donVi:'trở lên',min:1,max:5,luaChon:{1:'Thấp',2:'Thấp',3:'Trung bình',4:'Cao',5:'Khẩn cấp'}}, // tên mức theo gisDangerLabel() (js/core/gis.js)
  moTa:'Điểm nghẽn GIS có mức nguy hiểm từ mức này trở lên được đưa vào tab, hiện icon ⚠️ cạnh tiêu đề.'},
 {id:'noti.kcqt.cameraKhan',cn:'noti',tab:'kcqt',ten:'Mức cảnh báo',muc:'Khẩn',apDung:'Camera AI',icon:'⚠️',chiXem:true,
  moTa:'Cảnh báo Camera AI mức Khẩn luôn được đưa vào tab, hiện icon ⚠️ cạnh tiêu đề.'},

 /* ---- Noti · Nhiệm vụ (dòng xếp theo vòng đời như ảnh mẫu; thứ tự ưu tiên khi một nhiệm vụ thỏa nhiều trạng
    thái nằm ở uuTien của tab) ---- */
 {id:'noti.nv.moi',cn:'noti',tab:'nv',ten:'Nhiệm vụ mới',nhan:['Mới','blue'],bat:true,
  so:{macDinh:3,donVi:'ngày',min:1,max:30},
  moTa:'Nhiệm vụ hiện nhãn «Mới» trong số ngày này, tính từ ngày tạo.'},
 {id:'noti.nv.trongHan',cn:'noti',tab:'nv',ten:'Nhiệm vụ trong hạn',nhan:['Trong hạn','neutral'],bat:true,
  moTa:'Nhiệm vụ chưa hoàn thành, đã qua thời gian Mới và chưa tới thời gian Sắp hết hạn, hiện nhãn «Còn X ngày».'},
 {id:'noti.nv.sapHetHan',cn:'noti',tab:'nv',ten:'Nhiệm vụ sắp hết hạn',nhan:['Sắp hết hạn','warn'],bat:true,
  so:{macDinh:3,donVi:'ngày',min:1,max:30},
  moTa:'Nhiệm vụ còn từ 1 đến số ngày này là đến hạn thì hiện nhãn «Còn X ngày» màu vàng.'},
 {id:'noti.nv.hanHomNay',cn:'noti',tab:'nv',ten:'Hạn hôm nay',nhan:['Hạn hôm nay','orange'],chiXem:true,giaTriXem:'0 ngày',
  moTa:'Nhiệm vụ có hạn xử lý là hôm nay hiện nhãn «Hạn hôm nay» màu cam.'},
 {id:'noti.nv.quaHan',cn:'noti',tab:'nv',ten:'Nhiệm vụ quá hạn',nhan:['Quá hạn','red'],bat:true,
  moTa:'Nhiệm vụ chưa hoàn thành đã qua hạn xử lý hiện nhãn «Quá hạn X ngày», tính từ ngày quá hạn đầu tiên.'},
 {id:'noti.nv.mocQuaHan',cn:'noti',tab:'nv',ten:'Mốc nhận biết quá hạn',nhan:['‼ Quá hạn','red'],bat:true,phuThuoc:'noti.nv.quaHan',
  so:{macDinh:5,donVi:'ngày',min:2,
   max:gt=>{const k=ichSoHopLe(gt,'noti.nv.quaHanKhanCap');return (gt['noti.nv.quaHanKhanCap'].bat&&k!=null)?k-1:50;},
   lyDoMax:gt=>gt['noti.nv.quaHanKhanCap'].bat?'nhỏ hơn Quá hạn khẩn cấp':''},
  moTa:'Nhiệm vụ quá hạn từ số ngày này trở lên hiện thêm dấu ‼ trước nhãn Quá hạn để dễ nhận biết.'},
 {id:'noti.nv.quaHanKhanCap',cn:'noti',tab:'nv',ten:'Quá hạn khẩn cấp',nhan:['Quá hạn khẩn cấp','redSolid'],bat:true,
  so:{macDinh:10,donVi:'ngày',max:50,
   min:gt=>{const m=ichSoHopLe(gt,'noti.nv.mocQuaHan');return (gt['noti.nv.quaHan'].bat&&gt['noti.nv.mocQuaHan'].bat&&m!=null)?m+1:2;},
   lyDoMin:gt=>(gt['noti.nv.quaHan'].bat&&gt['noti.nv.mocQuaHan'].bat)?'lớn hơn Mốc nhận biết quá hạn':''},
  moTa:'Nhiệm vụ quá hạn từ số ngày này trở lên hiện nhãn «Quá hạn khẩn cấp» nền đỏ đặc, thay cho nhãn Quá hạn.'},
 {id:'noti.nv.hoanThanh',cn:'noti',tab:'nv',ten:'Nhiệm vụ hoàn thành',nhan:['Hoàn thành','ok'],bat:true,
  so:{macDinh:0,donVi:'ngày',min:0,max:30,ghiChu:'0 = ẩn ngay'},
  moTa:'Số ngày nhiệm vụ đã hoàn thành vẫn hiện trên Noti, tính từ lúc hoàn thành. Nhập 0: hoàn thành là ẩn ngay.'},
 {id:'noti.nv.capNhat',cn:'noti',tab:'nv',ten:'Cập nhật trạng thái',nhan:['Cập nhật trạng thái','neutral'],bat:true,
  so:{macDinh:3,donVi:'ngày',min:1,max:30},
  moTa:'Thông báo nhiệm vụ đổi trạng thái (ví dụ chuyển sang Quá hạn) hiện trong số ngày này, tính từ lúc đổi.'},
 {id:'noti.nv.tienDoThap',cn:'noti',tab:'nv',ten:'Ngưỡng tiến độ thấp',nhan:['Tiến độ thấp','red'],bat:true,
  so:{macDinh:40,donVi:'%',min:1,max:100},
  moTa:'Tiến độ dưới ngưỡng này thì hiện thêm thanh tiến độ đỏ ở nhiệm vụ Quá hạn khẩn cấp, Quá hạn, Hạn hôm nay, Sắp hết hạn.'},

 /* ---- Noti · Văn bản ---- */
 {id:'noti.vb.moi',cn:'noti',tab:'vb',ten:'Văn bản mới',nhan:['Văn bản mới','blue'],bat:true,
  so:{macDinh:3,donVi:'ngày',min:1,max:30},
  moTa:'Văn bản hiện nhãn «Văn bản mới» trong số ngày này, tính từ ngày tạo.'},
 {id:'noti.vb.sapDenHan',cn:'noti',tab:'vb',ten:'Văn bản sắp đến hạn',nhan:['Văn bản sắp đến hạn','warn'],bat:true,
  so:{macDinh:3,donVi:'ngày',min:1,max:30},
  moTa:'Văn bản còn từ 0 đến số ngày này là đến hạn xử lý thì hiện nhãn «Văn bản sắp đến hạn».'},
 {id:'noti.vb.doiTrangThai',cn:'noti',tab:'vb',ten:'Văn bản đổi trạng thái',nhan:['Văn bản đổi trạng thái','neutral'],chiXem:true,giaTriXem:'—',
  moTa:'Văn bản đang xử lý hiện nhãn «Văn bản đổi trạng thái».'},

 /* ---- Noti · OKR/KPI (màu nhãn khớp CAT_ST trong js/features/indicators.js) ---- */
 {id:'noti.kpi.done',cn:'noti',tab:'kpi',ten:'Đã hoàn thành',nhan:['Đã hoàn thành','#2fb174'],bat:true,moTa:'Chỉ tiêu ở trạng thái Đã hoàn thành hiện trên Noti.'},
 {id:'noti.kpi.doing',cn:'noti',tab:'kpi',ten:'Đang thực hiện',nhan:['Đang thực hiện','#2c7dd2'],bat:true,moTa:'Chỉ tiêu ở trạng thái Đang thực hiện hiện trên Noti.'},
 {id:'noti.kpi.regular',cn:'noti',tab:'kpi',ten:'Vượt chỉ tiêu',nhan:['Vượt chỉ tiêu','#39d5ff'],bat:true,moTa:'Chỉ tiêu ở trạng thái Vượt chỉ tiêu hiện trên Noti.'},
 {id:'noti.kpi.soon',cn:'noti',tab:'kpi',ten:'Chưa bắt đầu',nhan:['Chưa bắt đầu','#d8a50c'],bat:true,moTa:'Chỉ tiêu ở trạng thái Chưa bắt đầu hiện trên Noti.'},
 {id:'noti.kpi.risk',cn:'noti',tab:'kpi',ten:'Tạm dừng',nhan:['Tạm dừng','#d25a19'],bat:true,moTa:'Chỉ tiêu ở trạng thái Tạm dừng hiện trên Noti.'},
 {id:'noti.kpi.overdue',cn:'noti',tab:'kpi',ten:'Không đạt',nhan:['Không đạt','#ef4444'],bat:true,moTa:'Chỉ tiêu ở trạng thái Không đạt hiện trên Noti.'},

 /* ---- Noti · GIS ---- */
 {id:'noti.gis.chuaXuLy',cn:'noti',tab:'gis',ten:'Chưa xử lý',nhan:['Chưa xử lý','warn'],bat:true,
  moTa:'Điểm nghẽn GIS, cảnh báo Camera AI chưa được giao nhiệm vụ xử lý hiện trên Noti.'},
 {id:'noti.gis.daGiao',cn:'noti',tab:'gis',ten:'Đã giao xử lý',nhan:['Đã giao xử lý','ok'],bat:true,
  moTa:'Điểm nghẽn GIS, cảnh báo Camera AI đã được giao nhiệm vụ xử lý hiện trên Noti.'},
 {id:'noti.gis.cad',cn:'noti',tab:'gis',ten:'Điều phối CAD',nhan:['Điều phối CAD','neutral'],chiXem:true,giaTriXem:'—',
  moTa:'Thông báo điều phối xử lý điểm nghẽn (CAD) luôn hiện ở đầu tab.'}
];
const ICH_BY_ID=Object.fromEntries(ICH_THAM_SO.map(t=>[t.id,t]));

function ichThamSo(id){return ICH_BY_ID[id]||null;}
function ichTab(cn,tab){const c=ICH_CHUC_NANG.find(x=>x.key===cn);return c?c.tabs.find(t=>t.key===tab)||null:null;}
/* Thứ tự ưu tiên của tab, dạng id đầy đủ: ['noti.nv.quaHanKhanCap', …]. */
function ichUuTien(cn,tab){const t=ichTab(cn,tab);return t&&t.uuTien?t.uuTien.map(k=>`${cn}.${tab}.${k}`):[];}
function ichThamSoCuaTab(cn,tab){return ICH_THAM_SO.filter(t=>t.cn===cn&&t.tab===tab);}

/* Bộ giá trị mặc định: {id:{bat,so}}. Dòng chỉ hiển thị luôn bật. */
function ichMacDinh(){
 const gt={};
 ICH_THAM_SO.forEach(t=>{gt[t.id]={bat:t.chiXem?true:t.bat!==false,so:t.so?t.so.macDinh:null};});
 return gt;
}
function ichSaoChep(gt){return JSON.parse(JSON.stringify(gt));}

/* Dòng có bị khóa không: chỉ hiển thị, hoặc dòng cha đang tắt. */
function ichBiKhoa(id,gt){
 const t=ICH_BY_ID[id]; if(!t) return true;
 if(t.chiXem) return true;
 return !!(t.phuThuoc&&gt[t.phuThuoc]&&!gt[t.phuThuoc].bat);
}
/* Có đang dùng (để Noti áp): bật, và dòng cha (nếu có) cũng bật. */
function ichDangDung(id,gt){
 const t=ICH_BY_ID[id]; if(!t) return false;
 if(t.chiXem) return true;
 if(!gt[id]||!gt[id].bat) return false;
 return !(t.phuThuoc&&!ichDangDung(t.phuThuoc,gt));
}

/* Khoảng nhập hiện tại của một ô số: {min,max,lyDoMin,lyDoMax}. */
function ichKhoang(id,gt){
 const t=ICH_BY_ID[id]; if(!t||!t.so) return null;
 const f=(v)=>typeof v==='function'?v(gt):v;
 return {min:f(t.so.min),max:f(t.so.max),lyDoMin:f(t.so.lyDoMin)||'',lyDoMax:f(t.so.lyDoMax)||''};
}

/* Kiểm tra cả bộ giá trị → {id: lời báo lỗi}. Chỉ xét ô số của dòng đang dùng (dòng tắt, dòng khóa không bắt nhập). */
function ichKiemTra(gt){
 const loi={};
 ICH_THAM_SO.forEach(t=>{
  if(!t.so||t.chiXem||!ichDangDung(t.id,gt)) return;
  const v=gt[t.id]&&gt[t.id].so;
  if(!Number.isInteger(v)){loi[t.id]='Nhập số nguyên';return;}
  const k=ichKhoang(t.id,gt);
  if(v<k.min||v>k.max){
   const lyDo=v<k.min?k.lyDoMin:k.lyDoMax;
   loi[t.id]=k.min>k.max?`Không có giá trị hợp lệ: ${lyDo||'xem lại các ô liên quan'}`
    :`Nhập từ ${k.min} đến ${k.max}${lyDo?` (${lyDo})`:''}`;
  }
 });
 return loi;
}

/* Gộp giá trị đã lưu vào mặc định: bỏ mã lạ, sai kiểu thì lấy mặc định. Bộ đã lưu không còn hợp lệ (ví dụ khoảng
   nhập đổi sau này) thì trả lại mặc định cho các dòng lỗi; vẫn lỗi thì dùng toàn bộ mặc định. */
function ichGop(luu){
 const gt=ichMacDinh();
 const src=luu&&typeof luu==='object'?luu:{};
 Object.keys(gt).forEach(id=>{
  const t=ICH_BY_ID[id], x=src[id];
  if(!x||typeof x!=='object'||t.chiXem) return;
  if(typeof x.bat==='boolean') gt[id].bat=x.bat;
  if(t.so&&Number.isInteger(x.so)) gt[id].so=x.so;
 });
 let loi=ichKiemTra(gt);
 if(Object.keys(loi).length){
  const md=ichMacDinh();
  Object.keys(loi).forEach(id=>{gt[id]=md[id];});
  loi=ichKiemTra(gt);
  if(Object.keys(loi).length) return md;
 }
 return gt;
}

let ichCache=null;
function ichLsGet(){try{return localStorage.getItem(ICH_STORE_KEY);}catch(e){return null;}}
function ichLsSet(s){try{localStorage.setItem(ICH_STORE_KEY,s);return true;}catch(e){return false;}}
/* Bộ giá trị đang áp dụng (đã lưu, gộp mặc định). */
function ichDoc(){
 if(ichCache) return ichCache;
 let luu=null;
 try{const raw=ichLsGet(); if(raw){const o=JSON.parse(raw); luu=o&&o.giaTri;}}catch(e){luu=null;}
 ichCache=ichGop(luu);
 return ichCache;
}
/* Lưu bộ giá trị. Sai thì không lưu, trả {ok:false, loi}. */
function ichLuu(gt){
 const loi=ichKiemTra(gt);
 if(Object.keys(loi).length) return {ok:false,loi};
 const sach=ichGop(gt);
 if(!ichLsSet(JSON.stringify({v:1,luuLuc:Date.now(),giaTri:sach}))) return {ok:false,loi:{},khongLuuDuoc:true};
 ichCache=sach;
 ichBaoDoi();
 return {ok:true,loi:{}};
}
function ichCoKhacMacDinh(gt){return JSON.stringify(gt)!==JSON.stringify(ichMacDinh());}

/* Giá trị cho chức năng dùng. ichBat: đang dùng (bật, dòng cha bật). ichSo: số đã lưu (hoặc mặc định). */
function ichBat(id){return ichDangDung(id,ichDoc());}
function ichSo(id){const x=ichDoc()[id];return x?x.so:null;}

/* Báo cho chức năng vẽ lại khi cấu hình đổi: cùng trang (màn quản trị nằm trong demo_ioc.html) qua sự kiện riêng,
   trang khác cùng trình duyệt (oua-admin.html mở tab riêng) qua sự kiện storage. */
const ichNghe=[];
function ichKhiDoi(cb){ichNghe.push(cb);}
function ichBaoDoi(){
 ichNghe.forEach(cb=>{try{cb();}catch(e){}});
 try{window.dispatchEvent(new CustomEvent(ICH_EVENT));}catch(e){}
}
if(typeof window!=='undefined'&&window.addEventListener){
 window.addEventListener('storage',e=>{
  if(e.key!==ICH_STORE_KEY) return;
  ichCache=null;
  ichNghe.forEach(cb=>{try{cb();}catch(err){}});
 });
}
