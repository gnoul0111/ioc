 /* ============================== CẤP TRUNG ƯƠNG ============================== */
 /* Cấp mới, đứng trên cấp Thành phố — 5 khối theo đúng sơ đồ "2. Cơ cấu tổ chức / Trung Ương":
 Chủ tịch nước, BCH TW Đảng, Quốc hội, Chính phủ, MTTQ TW. Chưa có dữ liệu chỉ tiêu thật cho cấp này (categorySeed
 chỉ có dữ liệu Thành phố Hà Nội) nên các tài khoản Trung ương đăng nhập được, có cây cơ cấu tổ chức đúng, nhưng
 dashboard số liệu (nhiệm vụ, chỉ tiêu, GIS, notify...) hiển thị trạng thái "chưa có dữ liệu — đang chờ triển khai"
 thay vì mô phỏng số liệu — xem renderTwPlaceholder(). */
 const TW_AXIS_META = {
 TW_ALL:{name:'Trung ương', fullName:'Trung ương', icon:'🧭', color:'#39d5ff', desc:'Xem tổng hợp cả 5 khối Trung ương', scope:'tw'},
 TW_CTN:{name:'Chủ tịch nước', fullName:'Văn phòng Chủ tịch nước', icon:'🎖️', color:'#c9a227', desc:'Văn phòng Chủ tịch nước · Cấp Trung ương', scope:'tw'},
 TW_DANG:{name:'BCH Trung ương', fullName:'BTC Trung ương', icon:'🚩', color:'#e84d5b', desc:'Ban Tổ chức Trung ương và các đơn vị trực thuộc · Cấp Trung ương', scope:'tw'},
 TW_QH:{name:'Quốc hội', fullName:'Ủy ban Thường vụ Quốc hội', icon:'⚖️', color:'#f59e0b', desc:'Ủy ban Thường vụ Quốc hội · Cấp Trung ương', scope:'tw'},
 TW_CP:{name:'Chính phủ', fullName:'Văn phòng Chính phủ', icon:'🏢', color:'#2fb174', desc:'Các bộ, cơ quan ngang bộ và chính quyền hành chính · Cấp Trung ương', scope:'tw'},
 TW_MTTQ:{name:'MTTQ Trung ương', fullName:'Ủy ban Trung ương MTTQ Việt Nam', icon:'🤝', color:'#8b5cf6', desc:'Ủy ban Trung ương MTTQ Việt Nam · Cấp Trung ương', scope:'tw'}
 };
 /* Danh sách 5 mã trục TW thật (loại 'TW_ALL' — vai trò tổng hợp ảo, không phải 1 khối riêng) — dùng chung cho
 allowedRoles()/allowedCategoryRoles()/sidebarTree() khi tài khoản "Trung ương" cần duyệt qua cả 5 khối, giống
 hệt cách AXIS_CANONICAL_ORDER phục vụ tài khoản Thành ủy duyệt qua 4 trục Thành phố. */
 const TW_AXIS_REAL_ORDER=['TW_CTN','TW_DANG','TW_QH','TW_CP','TW_MTTQ'];
 const twAccounts = {
 tw:{user:'tw', pass:'123456', role:'TW_ALL', title:'Tài khoản Trung ương', subtitle:'Xem tổng hợp cả 5 khối Trung ương', icon:'🧭'},
 ctn:{user:'ctn', pass:'123456', role:'TW_CTN', title:'Tài khoản Chủ tịch nước', subtitle:'Văn phòng Chủ tịch nước · Cấp Trung ương', icon:'🎖️'},
 /* Tài khoản trục — KHÔNG gắn officeId, vào thẳng dashboard tổng của cả khối "BCH Trung ương Đảng" (5 khối ngang
 hàng: Chủ tịch nước/BCH TW Đảng/Quốc hội/Chính phủ/MTTQ TW), giống hệt ctn/qh/cp/twmttq bên dưới. Tài khoản riêng
 của đơn vị "Ban Tổ chức Trung ương" (tw-dang-btc) là tài khoản phòng/ban ban-tw-dang-btc (xem login.js, nhánh
 u.startsWith('ban-')) — 2 tài khoản này CỐ Ý tách riêng vì "BCH Trung ương Đảng" và "Ban Tổ chức Trung ương" là
 2 thực thể tổ chức khác nhau (BTC chỉ là 1 đơn vị trực thuộc trong cây cơ cấu của trục BCH TW Đảng). */
 twdang:{user:'twdang', pass:'123456', role:'TW_DANG', title:'Tài khoản BCH Trung ương', subtitle:'Ban Tổ chức Trung ương và các đơn vị trực thuộc · Cấp Trung ương', icon:'🚩'},
 qh:{user:'qh', pass:'123456', role:'TW_QH', title:'Tài khoản Quốc hội', subtitle:'Ủy ban Thường vụ Quốc hội · Cấp Trung ương', icon:'⚖️'},
 cp:{user:'cp', pass:'123456', role:'TW_CP', title:'Tài khoản Chính phủ', subtitle:'Các bộ, cơ quan ngang bộ · Cấp Trung ương', icon:'🏢'},
 twmttq:{user:'twmttq', pass:'123456', role:'TW_MTTQ', title:'Tài khoản MTTQ Trung ương', subtitle:'Ủy ban Trung ương MTTQ Việt Nam · Cấp Trung ương', icon:'🤝'}
 };
 /* Cây "Cơ cấu tổ chức" cấp Trung ương — dùng type:'placeholder' có sẵn (bấm vào chỉ toast "chưa có dữ liệu,
 chờ cập nhật") vì chưa có dữ liệu chỉ tiêu thật cho các đơn vị này. */
 /* Mọi dòng trong sơ đồ "2. Cơ cấu tổ chức / Trung Ương" đều là 1 node type:'office' — bấm được (xem theo, giống
 hệt sở/phòng-ban cấp Thành phố) VÀ có tài khoản đăng nhập thật riêng (ban-<officeId>, xem findOfficeCategory()).
 "Chủ tịch nước"/"Quốc hội"/"Chính phủ" không lặp lại thành node con vì đó CHÍNH LÀ dashboard của tài khoản trục
 (ctn/qh/cp) khi đăng nhập thẳng — không cần thêm 1 lớp node dư thừa trỏ về chính nó. */
 /* 34 tỉnh/thành sau sáp nhập 2025 (7 thành phố trực thuộc Trung ương + 27 tỉnh). "Thành phố" là 1 nhánh
 NGANG HÀNG với 5 khối Trung ương (Chủ tịch nước/BCH TW Đảng/Quốc hội/Chính phủ/MTTQ TW) — không phải con
 riêng của khối nào, vì nó đại diện chính quyền địa phương của CẢ NƯỚC, không thuộc về 1 khối cụ thể. Dùng ở
 sidebarTree() (nhánh TW_ALL) — xem twCityTreeNodes(). */
 const TW_CITY_GROUPS = [
 {label:'Thành phố trực thuộc Trung ương', names:['Hà Nội','Thành phố Hồ Chí Minh','Hải Phòng','Đà Nẵng','Cần Thơ','Huế','Đồng Nai']},
 {label:'Tỉnh, Thành phố không trực thuộc Trung ương', names:['Lai Châu','Điện Biên','Sơn La','Lạng Sơn','Quảng Ninh','Thanh Hoá','Nghệ An','Hà Tĩnh','Cao Bằng','Tuyên Quang','Lào Cai','Thái Nguyên','Phú Thọ','Bắc Ninh','Hưng Yên','Ninh Bình','Quảng Trị','Quảng Ngãi','Gia Lai','Khánh Hòa','Lâm Đồng','Đắk Lắk','Tây Ninh','Vĩnh Long','Đồng Tháp','Cà Mau','An Giang']}
 ];
 /* Cây con của "Thành phố" (2 nhóm → tên tỉnh/thành) dùng chung cho sidebarTree() — Hà Nội bấm vào dùng lại
 NGUYÊN hệ thống 4 trục Đảng ủy/HĐND/UBND/MTTQ + 126 xã/phường đang có (type:'city' → snavViewAsCity(), view-as
 role DANG, không tạo bản sao dữ liệu). 33 tỉnh/thành còn lại chỉ liệt kê tên, chưa có dữ liệu (type:'placeholder'
 — cơ chế có sẵn, bấm vào chỉ toast "chưa có dữ liệu, chờ cập nhật"). */
 /* Cây con của Hà Nội (4 trục + Xã/Phường) — NGUỒN DUY NHẤT dùng chung cho: sidebarTree() (browse cơ cấu),
 loginAccountTree() (chọn tài khoản đăng nhập), assignableTargets()/unit-picker (giao nhiệm vụ), buildCoordTreeData()
 (đơn vị phối hợp). Trước đây mỗi nơi tự viết lại cây này theo cách riêng (đặc biệt bộ giao nhiệm vụ dùng 1 bộ
 Ban/Phòng GIẢ LẬP tách biệt hẳn khỏi categorySeed thật), dẫn tới lệch nhau đúng chỗ quan trọng nhất: Trung ương
 không giao được việc xuống Thành phố, HĐND/MTTQ chưa từng giao được việc dù đã có dữ liệu Ban/đơn vị thật.
 restrictRole=null → đủ cả 4 trục + Xã/Phường không giới hạn (dùng cho Thành ủy, cho nhánh Trung ương→Thành phố,
 cho đăng nhập, cho phối hợp); restrictRole='UBND'/'HDND'/'MTTQ' → chỉ đúng 1 trục đó (dùng cho tài khoản trục
 đó tự xem/tự giao việc trong phạm vi mình, giữ đúng quy tắc phân quyền cũ). */
 function hanoiCityNode(restrictRole){
 const showAxis=r=>!restrictRole||restrictRole===r;
 const children=[];
 if(showAxis('DANG')) children.push({label:'Đảng ủy',type:'branch',key:'tp-hn-dang',officeRole:'DANG',children:()=>snavOfficeNodes('DANG','tp-hn-dang')});
 if(showAxis('HDND')) children.push({label:'HĐND',type:'branch',key:'tp-hn-hdnd',officeRole:'HDND',children:()=>snavOfficeNodes('HDND','tp-hn-hdnd')});
 if(showAxis('UBND')) children.push({label:'UBND',type:'branch',key:'tp-hn-ubnd',officeRole:'UBND',children:()=>snavSoNodes()});
 if(showAxis('MTTQ')) children.push({label:'MTTQ',type:'branch',key:'tp-hn-mttq',officeRole:'MTTQ',children:()=>snavOfficeNodes('MTTQ','tp-hn-mttq')});
 children.push(snavXaPhuongBranch('tp-hn', (!restrictRole||restrictRole==='DANG')?null:restrictRole));
 return children;
 }
 function twCityTreeNodes(){
 return TW_CITY_GROUPS.map(g=>({
 label:g.label, type:'branch', key:'tw-tp-grp-'+g.label,
 children:()=>g.names.map(name=>name==='Hà Nội'
 ?{label:name, type:'city', key:'tw-tp-hanoi', children:()=>hanoiCityNode(null)}
 :{label:name, type:'placeholder', key:'tw-tp-'+name})
 }));
 }
 /* Cây gốc DUY NHẤT của toàn bộ cơ cấu tổ chức (Trung ương 5 khối + Thành phố) — chính là thứ tài khoản "Trung
 ương" (TW_ALL) đang thấy khi mở "Cơ cấu tổ chức", nay tách thành 1 hàm riêng để loginAccountTree()/
 buildCoordTreeData() dùng lại được (thay vì mỗi nơi tự viết lại). */
 function orgTreeRoot(){
 return [
 ...TW_AXIS_REAL_ORDER.map(role=>({label:TW_AXIS_META[role].name,type:'branch',key:role,officeRole:role,children:()=>TW_ORG_TREE[role]||[]})),
 {label:'Thành phố',type:'branch',key:'tw-thanhpho',children:twCityTreeNodes}
 ];
 }
 /* BCH Trung ương/BTC Trung ương (role TW_DANG, officeId đúng bằng gốc của khối là 'tw-dang-btc' — tức chính
 tài khoản 'twdang', KHÔNG áp dụng cho Vụ/Cục/Phòng con sâu hơn bên trong) được xem THÊM đúng trục Đảng ủy/Thành
 ủy của Thành phố, và (theo đúng nguyên tắc đã áp dụng cho cả trục Thành phố — xem được gì thì giao nhiệm vụ
 được đúng đó, không tách 2 quyền riêng) cũng GIAO NHIỆM VỤ được xuống Đảng ủy Thành phố, các Ban của Đảng ủy,
 và xã/phường. Dùng chung cho cả orgFindHomeChildren() (xem cơ cấu tổ chức) và assignableTreeNodes() (giao
 nhiệm vụ, task-scope.js) để 2 quyền luôn khớp nhau tuyệt đối. */
 /* Nhánh "Thành phố" riêng cho BCH Trung ương — CHỈ đúng Đảng ủy ở MỌI cấp, kể cả trong từng xã/phường. Không thể
 tái dùng thẳng hanoiCityNode('DANG') vì restrictRole==='DANG' ở đó lại mang nghĩa KHÁC hẳn: "đây là tài khoản
 Thành ủy thật, được xem đủ cả 4 trục trong từng xã/phường vì Thành ủy giám sát toàn diện" (xem snavWardBranches).
 BCH Trung ương không phải Thành ủy nên phải lọc thủ công lại đúng còn Đảng ủy sau khi gọi snavWardBranches,
 không sửa snavWardBranches (sửa ở đó sẽ ảnh hưởng luôn tài khoản Thành ủy thật). */
 function twDangCityNode(){
 return [
 {label:'Đảng ủy',type:'branch',key:'tw-dang-tp-dang',officeRole:'DANG',children:()=>snavOfficeNodes('DANG','tw-dang-tp-dang')},
 {label:'Xã/Phường',type:'branch',key:'tw-dang-tp-xaphuong',children:()=>wardNames().map((name,idx)=>({
 label:name,type:'ward',key:String(idx),officeRole:'UBND',xaId:String(idx),
 children:()=>snavWardBranches(idx,'DANG').filter(b=>b.axisRole==='DANG')
 }))}
 ];
 }
 function twDangHomeChildren(officeId){
 const tree=TW_ORG_TREE.TW_DANG||[];
 const topOfficeId=tree[0]?.officeId;
 if(officeId && officeId!==topOfficeId) return tree;
 return [...tree, {label:'Thành phố',type:'branch',key:'tw-dang-tp',children:twDangCityNode}];
 }
 /* Chọn đúng nhánh mà 1 "home scope" (tài khoản gốc, không đổi theo trạng thái xem-thay) được thấy trong cây gốc
 chung — DUY NHẤT 1 nơi quyết định "tài khoản này thấy gì", dùng chung cho sidebarTree(). Y NGUYÊN logic phân
 quyền cũ (mỗi loại tài khoản thấy đúng phạm vi như trước), chỉ khác là lấy dữ liệu từ orgTreeRoot()/hanoiCityNode()
 thay vì mỗi nhánh tự viết lại. */
 function orgFindHomeChildren(home){
 if(home.role==='TW_ALL') return orgTreeRoot();
 if(home.role==='TW_DANG') return twDangHomeChildren(home.officeId);
 if(isTwRole(home.role)) return TW_ORG_TREE[home.role]||[];
 if(home.xaId!=null && home.officeId){
 const cat=(XA_CATEGORIES_BY_ROLE[home.role]||[]).find(c=>c.id===home.officeId);
 return [{label:cat?cat.name:currentAccount.title,type:'office',key:home.officeId,officeRole:home.role,officeId:home.officeId,wardIdx:Number(home.xaId)}];
 }
 if(home.xaId!=null) return snavWardBranches(Number(home.xaId),null);
 if(home.soId){
 const cat=(categorySeed.UBND||[]).find(c=>c.id===home.soId);
 return [{label:cat?cat.name:currentAccount.title,type:'so',key:home.soId,officeRole:'UBND',soId:home.soId}];
 }
 if(home.officeId){
 const found=findOfficeCategory(home.officeId);
 return [{label:found?found.cat.name:currentAccount.title,type:'office',key:home.officeId,officeRole:found?found.role:home.role,officeId:home.officeId}];
 }
 if(home.role==='DANG') return hanoiCityNode(null);
 if(home.role==='UBND') return hanoiCityNode('UBND');
 if(home.role==='HDND') return hanoiCityNode('HDND');
 if(home.role==='MTTQ') return hanoiCityNode('MTTQ');
 return [];
 }
 /* Làm phẳng 1 danh sách node (đệ quy) thành mảng target giao nhiệm vụ được {role,soId,xaId,officeId,label} —
 dùng chung cho assignableTargets()/unit-picker. Bỏ qua node placeholder (tỉnh/thành chưa có dữ liệu thật) và
 KHÔNG đi sâu quá cấp xã/phường (giữ đúng phạm vi giao việc hiện tại: chỉ tới cả 1 xã/phường, không tới từng
 phòng/ban con trong xã). Mọi node có officeRole đều tính là 1 target — nếu chưa có officeId/soId/xaId cụ thể
 (VD node "Đảng ủy" đại diện cả trục) thì coi là giao cho CẢ trục đó, nhãn hiển thị lấy tên đầy đủ qua roleMeta(). */
 function orgFlattenAssignable(nodes){
 const out=[];
 (function walk(list){
 (list||[]).forEach(n=>{
 if(n.type==='placeholder') return;
 if(n.officeRole){
 const hasSpecific=n.officeId||n.soId||n.xaId!=null;
 out.push({role:n.officeRole,soId:n.soId||null,xaId:n.xaId!=null?String(n.xaId):null,officeId:n.officeId||null,label:hasSpecific?n.label:(roleMeta(n.officeRole).name||n.label)});
 }
 if(n.type==='ward') return;
 if(typeof n.children==='function') walk(n.children());
 else if(Array.isArray(n.children)) walk(n.children);
 });
 })(nodes);
 return out;
 }
 const TW_ORG_TREE = {
 TW_CTN:[{label:'Văn phòng Chủ tịch nước', type:'office', key:'tw-ctn-vp', officeRole:'TW_CTN', officeId:'tw-ctn-vp'}],
 TW_DANG:[
 {label:'BTC Trung ương', type:'office', key:'tw-dang-btc', officeRole:'TW_DANG', officeId:'tw-dang-btc', children:()=>[
 {label:'Lãnh đạo ban', type:'office', key:'tw-dang-btc-lanhdao', officeRole:'TW_DANG', officeId:'tw-dang-btc-lanhdao'},
 {label:'Đảng ủy cơ quan', type:'office', key:'tw-dang-btc-danguy', officeRole:'TW_DANG', officeId:'tw-dang-btc-danguy'},
 {label:'Tiểu ban BVCTNB TW', type:'office', key:'tw-dang-btc-tieuban-bvctnb', officeRole:'TW_DANG', officeId:'tw-dang-btc-tieuban-bvctnb'},
 {label:'Thường trực BCĐ KL39', type:'office', key:'tw-dang-btc-bcd-kl39', officeRole:'TW_DANG', officeId:'tw-dang-btc-bcd-kl39'},
 {label:'Vụ Tổ chức - Điều lệ', type:'office', key:'tw-dang-btc-vutcdl', officeRole:'TW_DANG', officeId:'tw-dang-btc-vutcdl'},
 {label:'Vụ Cơ sở đảng, đảng viên', type:'office', key:'tw-dang-btc-vucsddv', officeRole:'TW_DANG', officeId:'tw-dang-btc-vucsddv'},
 {label:'Vụ Cán bộ', type:'office', key:'tw-dang-btc-vucanbo', officeRole:'TW_DANG', officeId:'tw-dang-btc-vucanbo'},
 {label:'Vụ Chính sách cán bộ', type:'office', key:'tw-dang-btc-vucscb', officeRole:'TW_DANG', officeId:'tw-dang-btc-vucscb'},
 {label:'Vụ Địa phương I (tại Hà Nội, gọi tắt là Vụ I)', type:'office', key:'tw-dang-btc-vudp1', officeRole:'TW_DANG', officeId:'tw-dang-btc-vudp1'},
 {label:'Vụ Địa phương II (tại Đà Nẵng, gọi tắt là Vụ II)', type:'office', key:'tw-dang-btc-vudp2', officeRole:'TW_DANG', officeId:'tw-dang-btc-vudp2'},
 {label:'Vụ Địa phương III (tại Thành phố Hồ Chí Minh, gọi tắt là Vụ III)', type:'office', key:'tw-dang-btc-vudp3', officeRole:'TW_DANG', officeId:'tw-dang-btc-vudp3'},
 {label:'Vụ Các ban, bộ, ngành, đoàn thể ở Trung ương (gọi tắt là Vụ V)', type:'office', key:'tw-dang-btc-vubbndt', officeRole:'TW_DANG', officeId:'tw-dang-btc-vubbndt'},
 {label:'Vụ Nghiên cứu Khoa học tổ chức, cán bộ', type:'office', key:'tw-dang-btc-vunckh', officeRole:'TW_DANG', officeId:'tw-dang-btc-vunckh'},
 {label:'Cục đào tạo bồi dưỡng cán bộ', type:'office', key:'tw-dang-btc-cudaotao', officeRole:'TW_DANG', officeId:'tw-dang-btc-cudaotao', children:()=>[
 {label:'Văn phòng cục', type:'office', key:'tw-dang-btc-cudaotao-vp', officeRole:'TW_DANG', officeId:'tw-dang-btc-cudaotao-vp'},
 {label:'Phòng đào tạo bồi dưỡng trong nước', type:'office', key:'tw-dang-btc-cudaotao-trongnuoc', officeRole:'TW_DANG', officeId:'tw-dang-btc-cudaotao-trongnuoc'},
 {label:'Phòng đào tạo bồi dưỡng nước ngoài', type:'office', key:'tw-dang-btc-cudaotao-nuocngoai', officeRole:'TW_DANG', officeId:'tw-dang-btc-cudaotao-nuocngoai'}
 ]},
 {label:'Cục bảo vệ chính trị nội bộ', type:'office', key:'tw-dang-btc-cubvcnb', officeRole:'TW_DANG', officeId:'tw-dang-btc-cubvcnb', children:()=>[
 {label:'Văn phòng cục', type:'office', key:'tw-dang-btc-cubvcnb-vp', officeRole:'TW_DANG', officeId:'tw-dang-btc-cubvcnb-vp'},
 {label:'Phòng địa phương', type:'office', key:'tw-dang-btc-cubvcnb-diaphuong', officeRole:'TW_DANG', officeId:'tw-dang-btc-cubvcnb-diaphuong'},
 {label:'Phòng bộ ban ngành', type:'office', key:'tw-dang-btc-cubvcnb-boban', officeRole:'TW_DANG', officeId:'tw-dang-btc-cubvcnb-boban'}
 ]},
 {label:'Văn phòng ban', type:'office', key:'tw-dang-vpban', officeRole:'TW_DANG', officeId:'tw-dang-vpban', children:()=>[
 {label:'Phòng Tổ chức - Cán bộ', type:'office', key:'tw-dang-p1', officeRole:'TW_DANG', officeId:'tw-dang-p1'},
 {label:'Phòng Tổng hợp', type:'office', key:'tw-dang-p2', officeRole:'TW_DANG', officeId:'tw-dang-p2'},
 {label:'Phòng Hành chính - Lưu trữ', type:'office', key:'tw-dang-p3', officeRole:'TW_DANG', officeId:'tw-dang-p3'},
 {label:'Phòng Công nghệ thông tin và Chuyển đổi số', type:'office', key:'tw-dang-p4', officeRole:'TW_DANG', officeId:'tw-dang-p4'},
 {label:'Phòng Tài vụ', type:'office', key:'tw-dang-p5', officeRole:'TW_DANG', officeId:'tw-dang-p5'},
 {label:'Phòng Quản trị', type:'office', key:'tw-dang-p6', officeRole:'TW_DANG', officeId:'tw-dang-p6'},
 /* 20 mục chỉ tiêu thống kê ngành TCXD Đảng (nguồn: file "260727 Mau bao cao va phu luc kem theo (PH)" —
 21 sheet Google Sheets anh cung cấp, mỗi sheet 1 mẫu biểu/phụ lục thống kê, tất cả ô số liệu gốc đều trống).
 Đặt làm 20 đơn vị con NẰM TRONG Văn phòng ban (ngang hàng 6 Phòng ở trên, không phải đơn vị ngang cấp BTC
 Trung ương) theo đúng yêu cầu — mỗi sheet ra 1 thẻ chỉ tiêu riêng khi xem tab "Tất cả" của Văn phòng ban.
 Số liệu là DỮ LIỆU MINH HỌA (fake) theo đúng quy ước chung của toàn khối Trung ương trong file này. */
 {label:'Kết quả thực hiện nhiệm vụ (KQBC)', type:'office', key:'tw-dang-vpban-kqbc', officeRole:'TW_DANG', officeId:'tw-dang-vpban-kqbc'},
 {label:'Đội ngũ cán bộ lãnh đạo, quản lý (CB.1)', type:'office', key:'tw-dang-vpban-cb1', officeRole:'TW_DANG', officeId:'tw-dang-vpban-cb1'},
 {label:'Công tác quy hoạch cán bộ (CB.2)', type:'office', key:'tw-dang-vpban-cb2', officeRole:'TW_DANG', officeId:'tw-dang-vpban-cb2'},
 {label:'Điều động, bổ nhiệm cán bộ (CB.3)', type:'office', key:'tw-dang-vpban-cb3', officeRole:'TW_DANG', officeId:'tw-dang-vpban-cb3'},
 {label:'Thẩm tra chính trị, kỷ luật cán bộ (CB.4)', type:'office', key:'tw-dang-vpban-cb4', officeRole:'TW_DANG', officeId:'tw-dang-vpban-cb4'},
 {label:'Đánh giá, xếp loại cán bộ (CB.5)', type:'office', key:'tw-dang-vpban-cb5', officeRole:'TW_DANG', officeId:'tw-dang-vpban-cb5'},
 {label:'Đào tạo, bồi dưỡng cán bộ (CB.6)', type:'office', key:'tw-dang-vpban-cb6', officeRole:'TW_DANG', officeId:'tw-dang-vpban-cb6'},
 {label:'Chính sách, sức khỏe cán bộ (CB.7)', type:'office', key:'tw-dang-vpban-cb7', officeRole:'TW_DANG', officeId:'tw-dang-vpban-cb7'},
 {label:'Cán bộ lãnh đạo cấp xã (CB Xã.1)', type:'office', key:'tw-dang-vpban-cbxa1', officeRole:'TW_DANG', officeId:'tw-dang-vpban-cbxa1'},
 {label:'CBCCVC cấp xã (CB Xã.2)', type:'office', key:'tw-dang-vpban-cbxa2', officeRole:'TW_DANG', officeId:'tw-dang-vpban-cbxa2'},
 {label:'Tổ chức bộ máy ngành cấp tỉnh (CB Ngành)', type:'office', key:'tw-dang-vpban-cbnganh', officeRole:'TW_DANG', officeId:'tw-dang-vpban-cbnganh'},
 {label:'Tổ chức đảng, đảng viên cơ sở (TCĐ)', type:'office', key:'tw-dang-vpban-tcd', officeRole:'TW_DANG', officeId:'tw-dang-vpban-tcd'},
 {label:'Đảng viên - kết nạp, khai trừ (ĐV)', type:'office', key:'tw-dang-vpban-dv', officeRole:'TW_DANG', officeId:'tw-dang-vpban-dv'},
 {label:'Biên chế cơ quan Trung ương (TCBM.1)', type:'office', key:'tw-dang-vpban-tcbm1', officeRole:'TW_DANG', officeId:'tw-dang-vpban-tcbm1'},
 {label:'Biên chế cấp tỉnh (TCBM.2)', type:'office', key:'tw-dang-vpban-tcbm2', officeRole:'TW_DANG', officeId:'tw-dang-vpban-tcbm2'},
 {label:'Biên chế cấp xã (TCBM.4)', type:'office', key:'tw-dang-vpban-tcbm4', officeRole:'TW_DANG', officeId:'tw-dang-vpban-tcbm4'},
 {label:'Danh mục vị trí việc làm công chức (VTVL.1)', type:'office', key:'tw-dang-vpban-vtvl1', officeRole:'TW_DANG', officeId:'tw-dang-vpban-vtvl1'},
 {label:'Danh mục vị trí việc làm viên chức (VTVL.2)', type:'office', key:'tw-dang-vpban-vtvl2', officeRole:'TW_DANG', officeId:'tw-dang-vpban-vtvl2'},
 {label:'Cơ cấu vị trí việc làm công chức (VTVL.3)', type:'office', key:'tw-dang-vpban-vtvl3', officeRole:'TW_DANG', officeId:'tw-dang-vpban-vtvl3'},
 {label:'Cơ cấu vị trí việc làm viên chức (VTVL.4)', type:'office', key:'tw-dang-vpban-vtvl4', officeRole:'TW_DANG', officeId:'tw-dang-vpban-vtvl4'}
 ]},
 {label:'Hội Cựu chiến binh cơ quan', type:'office', key:'tw-dang-btc-hoiccb', officeRole:'TW_DANG', officeId:'tw-dang-btc-hoiccb'},
 {label:'Đoàn Thanh niên cơ quan', type:'office', key:'tw-dang-btc-doantn', officeRole:'TW_DANG', officeId:'tw-dang-btc-doantn'},
 {label:'Ban Chỉ đạo thực hiện các chương trình đào tạo, bồi dưỡng cán bộ ở nước ngoài', type:'office', key:'tw-dang-btc-bcd-daotaonuocngoai', officeRole:'TW_DANG', officeId:'tw-dang-btc-bcd-daotaonuocngoai'}
 ]}
 ],
 TW_QH:[{label:'Ủy ban Thường vụ Quốc hội', type:'office', key:'tw-qh-ubtv', officeRole:'TW_QH', officeId:'tw-qh-ubtv'}],
 TW_CP:[{label:'Các bộ, cơ quan ngang bộ', type:'office', key:'tw-cp-bo', officeRole:'TW_CP', officeId:'tw-cp-bo'},{label:'Chính quyền hành chính', type:'office', key:'tw-cp-cqhc', officeRole:'TW_CP', officeId:'tw-cp-cqhc'}],
 TW_MTTQ:[{label:'Ủy ban Trung ương MTTQ Việt Nam', type:'office', key:'tw-mttq-ub', officeRole:'TW_MTTQ', officeId:'tw-mttq-ub'},{label:'Các tổ chức chính trị xã hội trực thuộc hệ thống Mặt trận', type:'office', key:'tw-mttq-to', officeRole:'TW_MTTQ', officeId:'tw-mttq-to'}]
 };
 function isTwRole(role){ return typeof role==='string' && role.startsWith('TW_'); }
 /* Toàn bộ officeId (kể cả node cha lẫn node lá) trong cây TW_ORG_TREE[role] — dùng để gán officeId cho từng
 bản ghi records[] khi sinh dữ liệu demo, phục vụ lọc đúng theo từng đơn vị con (Vụ/Cục/Văn phòng ban...) khi
 xem "VĂN BẢN/NHIỆM VỤ THEO TRỤC" ở phạm vi 1 đơn vị cụ thể thay vì luôn gộp chung cả trục. */
 let __twOfficeIdsCache={};
 function twAllOfficeIds(role){
 if(__twOfficeIdsCache[role]) return __twOfficeIdsCache[role];
 const out=[];
 (TW_ORG_TREE[role]||[]).forEach(n=>twCollectIds(n,out));
 return __twOfficeIdsCache[role]=out;
 }
 /* officeId -> đường dẫn phân cấp đầy đủ (VD "BCH Trung ương Đảng / Ban Tổ chức Trung ương / Vụ Tổ chức - Điều lệ"),
 CÙNG kiểu định dạng "Trục / ... / Đơn vị" mà vptuOrgLeafPaths() đang dùng cho 4 trục Thành phố — để cột "Đơn vị"/
 "Người-đơn vị phối hợp" của records[] cấp Trung ương khớp đúng với chính officeId đang gán cho bản ghi (trước đây
 lấy tên rời rạc từ twUnits, không liên quan gì đến officeId dùng để lọc, gây lệch dữ liệu hiển thị). */
 let __twOfficePathsCache={};
 function twOfficePaths(role){
 if(__twOfficePathsCache[role]) return __twOfficePathsCache[role];
 const map={};
 const rootLabel=roleMeta(role).name||role;
 const walk=(nodes,prefix)=>{
 nodes.forEach(n=>{
 const path=prefix.concat([n.label]);
 /* Chỉ ghi map cho node có officeId thật — nhánh "Thành phố" (type:'branch'/'city'/'placeholder') không có
 officeId, nếu không lọc sẽ ghi đè lẫn nhau vào 1 key "undefined" chung, lọt vào twAllOrgPaths() và có thể
 hiện nhầm thành "đơn vị phối hợp" ngẫu nhiên trong dữ liệu demo. */
 if(n.officeId) map[n.officeId]=[rootLabel,...path].join(' / ');
 if(typeof n.children==='function') walk(n.children(),path);
 });
 };
 walk(TW_ORG_TREE[role]||[],[]);
 return __twOfficePathsCache[role]=map;
 }
 /* Toàn bộ đường dẫn phân cấp của CẢ 5 khối Trung ương gộp lại — dùng làm nguồn "Người/đơn vị phối hợp" rải đều
 xuyên khối, giống cách cityLeafPaths gộp cả 4 trục Thành phố cho "phối hợp" (xem generateRecords()). */
 let __twAllPathsCache=null;
 function twAllOrgPaths(){
 if(__twAllPathsCache) return __twAllPathsCache;
 const out=[];
 TW_AXIS_REAL_ORDER.forEach(role=>out.push(...Object.values(twOfficePaths(role))));
 return __twAllPathsCache=out;
 }
 /* Meta hiển thị (tên/icon/màu) của 1 role, dùng chung cho cả cấp Thành phố (axisMeta) và cấp Trung ương (TW_AXIS_META). */
 function roleMeta(role){ return axisMeta[role]||TW_AXIS_META[role]||{}; }
 /* Icon tài khoản ở header (#currentIcon trong .role-icon) TRƯỚC ĐÂY lấy thẳng ký tự emoji màu (🏛️/🧭/⚖️...) —
    mọi emoji màu của Windows (Segoe UI Emoji) đều là ảnh raster có khung nền/viền riêng của chính glyph, đặt
    lên nền màu khác của .role-icon (gradient xanh) luôn lộ ra 1 "khung" tương phản dù đổi bất kỳ emoji nào.
    Đổi hẳn sang icon vector từ bộ Tabler Icons (đã nạp sẵn qua <link> webfont trong <head>, dùng chung với
    js/features/subtasks.js) — icon font vẽ theo currentColor, không có nền/khung riêng nên hoà đúng màu nền box. */
 /* Icon phải là hình khối/hở (building, flag, gavel, users, crown...) — TRÁNH icon tự vẽ thành 1 vòng tròn khép kín
    (compass, medal, circle-check...) vì đặt trong khung bo tròn .role-icon sẽ nhìn giống "khung lồng trong khung"
    y hệt lỗi emoji cũ, dù bản thân icon không còn nền/viền riêng như emoji nữa. */
 function roleIconClass(role){
 const map={DANG:'ti-flag',HDND:'ti-gavel',UBND:'ti-building',MTTQ:'ti-users',
 TW_ALL:'ti-building-bank',TW_CTN:'ti-crown',TW_DANG:'ti-flag',TW_QH:'ti-gavel',TW_CP:'ti-building',TW_MTTQ:'ti-users'};
 return map[role]||'ti-user-circle';
 }
 /* Chức năng, nhiệm vụ 6 phòng thuộc Văn phòng Ban Tổ chức Trung ương — theo QĐ 3538-QĐ/BTCTW ngày 04/02/2025.
 Mỗi gạch đầu dòng nhiệm vụ trong quyết định = 1 chỉ tiêu ở đây; số liệu/kỳ/nguồn là DỮ LIỆU MINH HỌA (chưa có
 số liệu thật cho cấp Trung ương). Dùng chung đúng khuôn categorySeed (items:[name,value,kỳ,nguồn,breakdown?])
 để tái sử dụng nguyên hệ thống hiển thị chỉ tiêu (card lưới, preview mini-chart, drawer chi tiết) đang có sẵn
 cho sở/phòng-ban cấp Thành phố — xem categorySeedForRole()/scopedSingleCategory(). */
 const TW_DANG_OFFICE_CATEGORIES = {
 'tw-dang-p1':{name:'Phòng Tổ chức - Cán bộ', chucNang:'Tham mưu và tổ chức thực hiện công tác tổ chức, cán bộ cơ quan Ban Tổ chức Trung ương; công tác nội vụ của Văn phòng và thi đua - khen thưởng Ngành Tổ chức xây dựng Đảng.', items:[
 ['Vị trí việc làm công chức đã xác định',42,'Năm','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Quy định, quy chế về tổ chức - cán bộ đã tham mưu ban hành',8,'Năm','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Lượt tuyển dụng, quy hoạch, bổ nhiệm, điều động, luân chuyển cán bộ',126,'Quý','CSDL nội bộ Ban Tổ chức Trung ương',[P('Loại hình nhân sự',[['Bổ nhiệm, bổ nhiệm lại',34],['Điều động, luân chuyển',28],['Quy hoạch',40],['Đào tạo, bồi dưỡng',24]])]],
 ['Chế độ chính sách, thi đua khen thưởng đã giải quyết',210,'Quý','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Vụ việc bảo vệ chính trị nội bộ, khiếu nại tố cáo đã xử lý',6,'Quý','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Kết quả thi đua khen thưởng ngành Tổ chức xây dựng Đảng',5887,'Năm','CSDL nội bộ Ban Tổ chức Trung ương',[P('Danh hiệu',[['Tập thể xuất sắc',186],['Cá nhân xuất sắc',420],['Bằng khen',640]])]],
 ['Nhiệm vụ Hội đồng thi đua khen thưởng, Hội đồng lương - nhà ở',12,'Quý','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Công tác tổ chức, cán bộ Văn phòng Ban đã tham mưu',24,'Quý','CSDL nội bộ Ban Tổ chức Trung ương']
 ]},
 'tw-dang-p2':{name:'Phòng Tổng hợp', chucNang:'Tham mưu, tổ chức thực hiện công tác tổng hợp thông tin, đối ngoại và thống kê số liệu cơ bản về tổ chức xây dựng Đảng.', items:[
 ['Báo cáo định kỳ, chuyên đề tổng hợp từ tỉnh ủy/thành ủy/đảng ủy trực thuộc TW',63,'Tháng','CSDL nội bộ Ban Tổ chức Trung ương',[S('Loại báo cáo',[['Báo cáo định kỳ',48],['Báo cáo chuyên đề',15]])]],
 ['Chương trình, kế hoạch công tác của Ban theo dõi, đôn đốc',18,'Quý','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Hoạt động đối ngoại của Ban đã phục vụ',9,'Quý','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Chỉ tiêu thống kê công tác tổ chức xây dựng Đảng (Danh mục toàn quốc)',24,'Năm','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Đoàn công tác của Lãnh đạo Ban tại địa phương',32,'Quý','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Tin, bài cập nhật Hệ thống Thông tin điện tử và Phòng Truyền thống',156,'Tháng','Hệ thống Thông tin điện tử Ban Tổ chức Trung ương']
 ]},
 'tw-dang-p3':{name:'Phòng Hành chính - Lưu trữ', chucNang:'Tham mưu, hướng dẫn, tổ chức thực hiện công tác hành chính, văn thư, lưu trữ, bảo vệ bí mật nhà nước, tiếp nhận, xử lý đơn thư của Ban Tổ chức Trung ương.', items:[
 ['Văn bản hướng dẫn văn thư, lưu trữ, bảo vệ bí mật nhà nước',10,'Năm','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Chương trình công tác tuần, phiên họp Lãnh đạo Ban đã phục vụ',48,'Tháng','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Báo cáo tiến độ công việc hằng tuần của các vụ, cục, đơn vị',52,'Tháng','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Văn bản tiếp nhận, xử lý, phát hành',3260,'Tháng','CSDL nội bộ Ban Tổ chức Trung ương',[S('Loại văn bản',[['Văn bản đến',1840],['Văn bản đi',1420]])]],
 ['Đơn thư tiếp nhận, đề xuất xử lý',21,'Tháng','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Giấy giới thiệu, giấy đi đường, xác nhận liên hệ công tác cấp phát',186,'Tháng','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Hồ sơ, tài liệu lưu trữ thu thập, chỉnh lý, giao nộp Lưu trữ Lịch sử',640,'Năm','CSDL nội bộ Ban Tổ chức Trung ương']
 ]},
 'tw-dang-p4':{name:'Phòng Công nghệ thông tin và Chuyển đổi số', chucNang:'Tham mưu, tổ chức thực hiện, quản lý ứng dụng, phát triển hệ thống công nghệ thông tin và chuyển đổi số của Ban Tổ chức Trung ương.', items:[
 ['Chương trình, kế hoạch ứng dụng CNTT và chuyển đổi số đã triển khai',14,'Năm','Hệ thống Thông tin điện tử Ban Tổ chức Trung ương'],
 ['Sự cố an ninh, an toàn hạ tầng CNTT đã xử lý',8,'Quý','Hệ thống Thông tin điện tử Ban Tổ chức Trung ương'],
 ['Hệ thống cơ sở dữ liệu, phần mềm chuyên ngành đang quản trị',22,'Quý','Hệ thống Thông tin điện tử Ban Tổ chức Trung ương',[P('Loại hệ thống',[['CSDL đảng viên',6],['Phần mềm dùng chung',9],['Hệ thống thông tin điện tử',7]])]],
 ['Lượt bồi dưỡng, tập huấn CNTT, chuyển đổi số cho cán bộ',480,'Năm','Hệ thống Thông tin điện tử Ban Tổ chức Trung ương'],
 ['Lượt hướng dẫn, hỗ trợ kỹ thuật cho ban tổ chức tỉnh/thành ủy',126,'Quý','Hệ thống Thông tin điện tử Ban Tổ chức Trung ương']
 ]},
 'tw-dang-p5':{name:'Phòng Tài vụ', chucNang:'Tham mưu, tổ chức thực hiện nghiệp vụ tài chính, kế toán, quản lý giá trị tài sản của cơ quan theo đúng chế độ, nguyên tắc, chủ trương của Đảng và pháp luật của Nhà nước. Điều phối nguồn tài chính phục vụ các hoạt động liên quan đến công tác chăm sóc sức khỏe cán bộ.', items:[
 ['Dự toán, quyết toán ngân sách năm đã tham mưu',2,'Năm','Hệ thống kế toán nội bộ Ban Tổ chức Trung ương'],
 ['Rà soát, điều chỉnh bổ sung dự toán ngân sách (tháng 12)',1,'Năm','Hệ thống kế toán nội bộ Ban Tổ chức Trung ương'],
 ['Chứng từ hạch toán kế toán, kiểm tra nội bộ đã thực hiện',1240,'Tháng','Hệ thống kế toán nội bộ Ban Tổ chức Trung ương'],
 ['Khoản tạm ứng, công nợ đang theo dõi, đôn đốc',46,'Tháng','Hệ thống kế toán nội bộ Ban Tổ chức Trung ương'],
 ['Đợt kiểm kê, đánh giá lại tài sản phối hợp thực hiện',4,'Năm','Hệ thống kế toán nội bộ Ban Tổ chức Trung ương'],
 ['Chế độ chính sách cán bộ, công chức, người lao động đã tham mưu',68,'Quý','Hệ thống kế toán nội bộ Ban Tổ chức Trung ương']
 ]},
 'tw-dang-p6':{name:'Phòng Quản trị', chucNang:'Tham mưu, tổ chức thực hiện lĩnh vực quản trị, công tác phục vụ, bảo đảm cơ sở vật chất, kỹ thuật, phương tiện và các điều kiện làm việc của cơ quan.', items:[
 ['Trụ sở, tài sản, trang thiết bị đang quản lý',1860,'Quý','CSDL quản trị tài sản Ban Tổ chức Trung ương'],
 ['Dự án đầu tư xây dựng cơ bản, sửa chữa trụ sở đang triển khai',5,'Năm','CSDL quản trị tài sản Ban Tổ chức Trung ương'],
 ['Tài liệu kỹ thuật nghiệp vụ đảng viên, ấn phẩm đã in ấn, cấp phát',4200,'Năm','CSDL quản trị tài sản Ban Tổ chức Trung ương'],
 ['Cuộc họp, hội nghị của Ban đã chuẩn bị, phục vụ',96,'Quý','CSDL quản trị tài sản Ban Tổ chức Trung ương'],
 ['Công tác vệ sinh, cảnh quan trụ sở đã thực hiện',12,'Tháng','CSDL quản trị tài sản Ban Tổ chức Trung ương'],
 ['Vụ việc an ninh trật tự, phòng cháy chữa cháy đã xử lý',2,'Quý','CSDL quản trị tài sản Ban Tổ chức Trung ương'],
 ['Lượt bố trí người, phương tiện phục vụ 24/24 giờ',340,'Tháng','CSDL quản trị tài sản Ban Tổ chức Trung ương'],
 ['Xe ô tô đang quản lý, bảo dưỡng, đăng kiểm',14,'Năm','CSDL quản trị tài sản Ban Tổ chức Trung ương',[S('Tình trạng',[['Đang hoạt động',12],['Đang bảo dưỡng, sửa chữa',2]])]],
 ['Hồ sơ theo dõi, lưu trữ cho từng xe đã cập nhật',14,'Năm','CSDL quản trị tài sản Ban Tổ chức Trung ương']
 ]}
 };
 /* Toàn bộ đơn vị con cấp Trung ương (13 đơn vị, khớp key với TW_ORG_TREE) — đóng vai trò tương đương categorySeed
 nhưng cho cấp Trung ương, để categorySeedForRole()/findOfficeCategory() xử lý đồng nhất với cấp Thành phố.
 Đơn vị chưa có chỉ tiêu thật thì để items:[] (hệ thống card/lưới chỉ tiêu đã tự xử lý rỗng, xem noItems ở
 categorySeed.UBND làm ví dụ) — chờ dữ liệu thật, không bịa số cho những đơn vị chưa có nội dung nguồn. */
 const TW_OFFICE_CATEGORIES_BY_ROLE = {
 TW_CTN:[
 {id:'tw-ctn-vp', name:'Văn phòng Chủ tịch nước', items:[
 ['Văn bản trình Chủ tịch nước ký ban hành',186,'Quý','CSDL nội bộ Văn phòng Chủ tịch nước'],
 ['Hồ sơ đề nghị đặc xá, ân giảm đã thẩm định',42,'Năm','CSDL nội bộ Văn phòng Chủ tịch nước'],
 ['Hồ sơ khen thưởng cấp Nhà nước đã tham mưu',1240,'Quý','CSDL nội bộ Văn phòng Chủ tịch nước',[P('Loại danh hiệu',[['Huân chương',420],['Huy chương',380],['Danh hiệu vinh dự Nhà nước',440]])]],
 ['Hoạt động đối ngoại, lễ tân Nhà nước đã phục vụ',68,'Quý','CSDL nội bộ Văn phòng Chủ tịch nước'],
 ['Đơn thư công dân gửi Chủ tịch nước đã tiếp nhận, xử lý',312,'Tháng','CSDL nội bộ Văn phòng Chủ tịch nước']
 ]}
 ],
 TW_DANG:[
 {id:'tw-dang-btc', name:'Ban Tổ chức Trung ương', items:[
 ['Tổng số cán bộ, công chức khối Ban Tổ chức Trung ương',640,'Năm','CSDL nội bộ Ban Tổ chức Trung ương',[S('Cơ cấu',[['Vụ, Cục',420],['Văn phòng ban',220]])]],
 ['Đề án, văn bản về công tác tổ chức - cán bộ đã tham mưu Bộ Chính trị, Ban Bí thư',24,'Năm','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Hội nghị, tập huấn nghiệp vụ tổ chức xây dựng Đảng toàn quốc',18,'Năm','CSDL nội bộ Ban Tổ chức Trung ương'],
 ['Đoàn kiểm tra, giám sát công tác cán bộ tại địa phương',46,'Quý','CSDL nội bộ Ban Tổ chức Trung ương']
 ]},
 /* Lãnh đạo ban/Đảng ủy/Tiểu ban/Ban chỉ đạo/đoàn thể — chưa có nguồn dữ liệu chỉ tiêu thật riêng, để items:[]
 (không bịa số) như quy ước ở đầu TW_OFFICE_CATEGORIES_BY_ROLE. */
 {id:'tw-dang-btc-lanhdao', name:'Lãnh đạo ban', items:[]},
 {id:'tw-dang-btc-danguy', name:'Đảng ủy cơ quan', items:[]},
 {id:'tw-dang-btc-tieuban-bvctnb', name:'Tiểu ban BVCTNB TW', items:[]},
 {id:'tw-dang-btc-bcd-kl39', name:'Thường trực BCĐ KL39', items:[]},
 /* 9 Vụ dưới đây là DỮ LIỆU MINH HỌA (chưa có số liệu thật cho cấp Trung ương), theo đúng tinh thần các đơn vị
 TW_DANG khác — tên chỉ tiêu suy theo đúng chức năng thực tế của từng Vụ. */
 {id:'tw-dang-btc-vutcdl', name:'Vụ Tổ chức - Điều lệ', items:[
 ['Điều lệ, quy định thi hành Điều lệ Đảng đã tham mưu, hướng dẫn',6,'Năm','CSDL nội bộ Vụ Tổ chức - Điều lệ'],
 ['Tổ chức cơ sở đảng thành lập mới, chia tách, sáp nhập đã thẩm định',214,'Năm','CSDL nội bộ Vụ Tổ chức - Điều lệ'],
 ['Đề án kiện toàn tổ chức bộ máy các cơ quan đảng đã tham mưu',12,'Năm','CSDL nội bộ Vụ Tổ chức - Điều lệ'],
 ['Văn bản hướng dẫn nghiệp vụ tổ chức đảng gửi địa phương',28,'Quý','CSDL nội bộ Vụ Tổ chức - Điều lệ']
 ]},
 {id:'tw-dang-btc-vucsddv', name:'Vụ Cơ sở đảng, đảng viên', items:[
 ['Đảng viên mới kết nạp trong kỳ',186400,'Năm','CSDL nội bộ Vụ Cơ sở đảng, đảng viên',[P('Khu vực',[['Nông thôn',68400],['Đô thị',82600],['Lực lượng vũ trang',35400]])]],
 ['Tổ chức cơ sở đảng hoàn thành tốt nhiệm vụ trở lên',68200,'Năm','CSDL nội bộ Vụ Cơ sở đảng, đảng viên'],
 ['Chi bộ sinh hoạt định kỳ đã theo dõi, tổng hợp',420600,'Quý','CSDL nội bộ Vụ Cơ sở đảng, đảng viên'],
 ['Hồ sơ đảng viên chuyển sinh hoạt đảng đã xử lý',15600,'Quý','CSDL nội bộ Vụ Cơ sở đảng, đảng viên']
 ]},
 {id:'tw-dang-btc-vucanbo', name:'Vụ Cán bộ', items:[
 ['Cán bộ diện Bộ Chính trị, Ban Bí thư quản lý đã theo dõi, tổng hợp',1240,'Năm','CSDL nội bộ Vụ Cán bộ'],
 ['Hồ sơ bổ nhiệm, giới thiệu ứng cử cán bộ diện Trung ương quản lý đã thẩm định',186,'Quý','CSDL nội bộ Vụ Cán bộ',[P('Loại hình',[['Bổ nhiệm mới',68],['Bổ nhiệm lại',52],['Giới thiệu ứng cử',66]])]],
 ['Quy hoạch cán bộ cấp chiến lược nhiệm kỳ đã rà soát',420,'Năm','CSDL nội bộ Vụ Cán bộ'],
 ['Hồ sơ điều động, luân chuyển cán bộ diện Trung ương quản lý',96,'Quý','CSDL nội bộ Vụ Cán bộ']
 ]},
 {id:'tw-dang-btc-vucscb', name:'Vụ Chính sách cán bộ', items:[
 ['Đề án chính sách cán bộ đã tham mưu Bộ Chính trị, Ban Bí thư',8,'Năm','CSDL nội bộ Vụ Chính sách cán bộ'],
 ['Hồ sơ chế độ, chính sách cán bộ nghỉ hưu, thôi việc đã giải quyết',2860,'Quý','CSDL nội bộ Vụ Chính sách cán bộ'],
 ['Kiến nghị, đề xuất sửa đổi chính sách cán bộ từ địa phương đã tổng hợp',64,'Năm','CSDL nội bộ Vụ Chính sách cán bộ']
 ]},
 {id:'tw-dang-btc-vudp1', name:'Vụ Địa phương I (tại Hà Nội, gọi tắt là Vụ I)', items:[
 ['Tỉnh, thành ủy khu vực phía Bắc đang theo dõi, tổng hợp',25,'Năm','CSDL nội bộ Vụ Địa phương I'],
 ['Báo cáo công tác tổ chức xây dựng Đảng địa phương đã tổng hợp',300,'Quý','CSDL nội bộ Vụ Địa phương I'],
 ['Đoàn công tác, kiểm tra tại địa phương phía Bắc đã thực hiện',42,'Năm','CSDL nội bộ Vụ Địa phương I']
 ]},
 {id:'tw-dang-btc-vudp2', name:'Vụ Địa phương II (tại Đà Nẵng, gọi tắt là Vụ II)', items:[
 ['Tỉnh, thành ủy khu vực miền Trung - Tây Nguyên đang theo dõi, tổng hợp',18,'Năm','CSDL nội bộ Vụ Địa phương II'],
 ['Báo cáo công tác tổ chức xây dựng Đảng địa phương đã tổng hợp',216,'Quý','CSDL nội bộ Vụ Địa phương II'],
 ['Đoàn công tác, kiểm tra tại địa phương miền Trung - Tây Nguyên đã thực hiện',30,'Năm','CSDL nội bộ Vụ Địa phương II']
 ]},
 {id:'tw-dang-btc-vudp3', name:'Vụ Địa phương III (tại Thành phố Hồ Chí Minh, gọi tắt là Vụ III)', items:[
 ['Tỉnh, thành ủy khu vực phía Nam đang theo dõi, tổng hợp',20,'Năm','CSDL nội bộ Vụ Địa phương III'],
 ['Báo cáo công tác tổ chức xây dựng Đảng địa phương đã tổng hợp',240,'Quý','CSDL nội bộ Vụ Địa phương III'],
 ['Đoàn công tác, kiểm tra tại địa phương phía Nam đã thực hiện',36,'Năm','CSDL nội bộ Vụ Địa phương III']
 ]},
 {id:'tw-dang-btc-vubbndt', name:'Vụ Các ban, bộ, ngành, đoàn thể ở Trung ương (gọi tắt là Vụ V)', items:[
 ['Ban cán sự đảng, đảng đoàn ở Trung ương đang theo dõi, tổng hợp',68,'Năm','CSDL nội bộ Vụ Các ban, bộ, ngành, đoàn thể ở Trung ương'],
 ['Báo cáo công tác tổ chức xây dựng Đảng khối cơ quan Trung ương đã tổng hợp',186,'Quý','CSDL nội bộ Vụ Các ban, bộ, ngành, đoàn thể ở Trung ương'],
 ['Đề án sắp xếp tổ chức đảng khối cơ quan Trung ương đã tham mưu',9,'Năm','CSDL nội bộ Vụ Các ban, bộ, ngành, đoàn thể ở Trung ương']
 ]},
 {id:'tw-dang-btc-vunckh', name:'Vụ Nghiên cứu Khoa học tổ chức, cán bộ', items:[
 ['Đề tài, đề án nghiên cứu khoa học tổ chức xây dựng Đảng đã triển khai',14,'Năm','CSDL nội bộ Vụ Nghiên cứu Khoa học tổ chức, cán bộ'],
 ['Hội thảo khoa học chuyên đề công tác tổ chức, cán bộ đã tổ chức',6,'Năm','CSDL nội bộ Vụ Nghiên cứu Khoa học tổ chức, cán bộ'],
 ['Bài viết, chuyên đề khoa học đã công bố trên tạp chí ngành',22,'Năm','CSDL nội bộ Vụ Nghiên cứu Khoa học tổ chức, cán bộ']
 ]},
 {id:'tw-dang-btc-cudaotao', name:'Cục đào tạo bồi dưỡng cán bộ', items:[
 ['Lớp đào tạo, bồi dưỡng cán bộ đã tổ chức',86,'Năm','CSDL nội bộ Cục Đào tạo bồi dưỡng cán bộ',[P('Loại hình',[['Trong nước',64],['Nước ngoài',22]])]],
 ['Lượt cán bộ tham gia đào tạo, bồi dưỡng',12400,'Năm','CSDL nội bộ Cục Đào tạo bồi dưỡng cán bộ'],
 ['Chương trình, giáo trình đào tạo đã biên soạn, cập nhật',14,'Năm','CSDL nội bộ Cục Đào tạo bồi dưỡng cán bộ'],
 ['Kinh phí đào tạo, bồi dưỡng đã giải ngân (tỷ đồng)',86.4,'Năm','CSDL nội bộ Cục Đào tạo bồi dưỡng cán bộ']
 ]},
 {id:'tw-dang-btc-cudaotao-vp', name:'Văn phòng cục (Cục đào tạo bồi dưỡng cán bộ)', items:[
 ['Văn bản hành chính, công văn đã xử lý',620,'Tháng','CSDL nội bộ Văn phòng Cục'],
 ['Kế hoạch, chương trình công tác của Cục đã tổng hợp',12,'Quý','CSDL nội bộ Văn phòng Cục'],
 ['Hồ sơ tài chính, hậu cần lớp học đã phục vụ',86,'Năm','CSDL nội bộ Văn phòng Cục']
 ]},
 {id:'tw-dang-btc-cudaotao-trongnuoc', name:'Phòng đào tạo bồi dưỡng trong nước', items:[
 ['Lớp đào tạo, bồi dưỡng trong nước đã tổ chức',64,'Năm','CSDL nội bộ Phòng Đào tạo bồi dưỡng trong nước'],
 ['Học viên hoàn thành chương trình đào tạo trong nước',9800,'Năm','CSDL nội bộ Phòng Đào tạo bồi dưỡng trong nước'],
 ['Cơ sở đào tạo, bồi dưỡng phối hợp tổ chức lớp học',22,'Năm','CSDL nội bộ Phòng Đào tạo bồi dưỡng trong nước']
 ]},
 {id:'tw-dang-btc-cudaotao-nuocngoai', name:'Phòng đào tạo bồi dưỡng nước ngoài', items:[
 ['Lớp, đoàn đào tạo bồi dưỡng nước ngoài đã tổ chức',22,'Năm','CSDL nội bộ Phòng Đào tạo bồi dưỡng nước ngoài'],
 ['Cán bộ được cử đi đào tạo, bồi dưỡng nước ngoài',2600,'Năm','CSDL nội bộ Phòng Đào tạo bồi dưỡng nước ngoài',[P('Khu vực',[['Châu Á',1240],['Châu Âu',860],['Khác',500]])]],
 ['Thỏa thuận hợp tác đào tạo với đối tác nước ngoài',8,'Năm','CSDL nội bộ Phòng Đào tạo bồi dưỡng nước ngoài']
 ]},
 {id:'tw-dang-btc-cubvcnb', name:'Cục bảo vệ chính trị nội bộ', items:[
 ['Hồ sơ thẩm định tiêu chuẩn chính trị cán bộ đã xử lý',4200,'Quý','CSDL nội bộ Cục Bảo vệ chính trị nội bộ'],
 ['Vụ việc liên quan chính trị nội bộ đã xác minh, kết luận',38,'Quý','CSDL nội bộ Cục Bảo vệ chính trị nội bộ'],
 ['Đoàn kiểm tra bảo vệ chính trị nội bộ tại địa phương, bộ ngành',26,'Năm','CSDL nội bộ Cục Bảo vệ chính trị nội bộ']
 ]},
 {id:'tw-dang-btc-cubvcnb-vp', name:'Văn phòng cục (Cục bảo vệ chính trị nội bộ)', items:[
 ['Văn bản hành chính, công văn đã xử lý',540,'Tháng','CSDL nội bộ Văn phòng Cục'],
 ['Hồ sơ lưu trữ bảo vệ chính trị nội bộ đang quản lý',18600,'Năm','CSDL nội bộ Văn phòng Cục']
 ]},
 {id:'tw-dang-btc-cubvcnb-diaphuong', name:'Phòng địa phương', items:[
 ['Hồ sơ thẩm định chính trị nội bộ cán bộ địa phương',2860,'Quý','CSDL nội bộ Phòng Địa phương'],
 ['Tỉnh, thành phố đã rà soát, thẩm định trong kỳ',63,'Năm','CSDL nội bộ Phòng Địa phương']
 ]},
 {id:'tw-dang-btc-cubvcnb-boban', name:'Phòng bộ ban ngành', items:[
 ['Hồ sơ thẩm định chính trị nội bộ cán bộ bộ, ban, ngành',1340,'Quý','CSDL nội bộ Phòng Bộ ban ngành'],
 ['Bộ, ban, ngành Trung ương đã rà soát, thẩm định trong kỳ',28,'Năm','CSDL nội bộ Phòng Bộ ban ngành']
 ]},
 {id:'tw-dang-vpban', name:'Văn phòng ban (Văn phòng Ban Tổ chức Trung ương)', items:[
 ['Tổng số cán bộ, công chức Văn phòng ban',186,'Năm','CSDL nội bộ Văn phòng Ban Tổ chức Trung ương'],
 ['Văn bản đến, đi toàn Văn phòng ban trong kỳ',8600,'Tháng','CSDL nội bộ Văn phòng Ban Tổ chức Trung ương',[S('Loại văn bản',[['Văn bản đến',4820],['Văn bản đi',3780]])]],
 ['Cuộc họp, hội nghị của Ban đã phục vụ',96,'Quý','CSDL nội bộ Văn phòng Ban Tổ chức Trung ương']
 ]},
 {id:'tw-dang-vpban-kqbc', name:'Kết quả thực hiện đề án, nhiệm vụ (KQBC)', items:[
 ['Tổng số nhiệm vụ được giao trong kỳ',186,'Quý','Hệ thống báo cáo ngành Tổ chức xây dựng Đảng',[P('Tiến độ thực hiện',[['Đã hoàn thành',132],['Đúng hạn, đang thực hiện',34],['Nguy cơ quá hạn',12],['Chậm/quá hạn',8]])]],
 ['Mô hình mới, cách làm hiệu quả đã ghi nhận',9,'Năm','Hệ thống báo cáo ngành Tổ chức xây dựng Đảng',[P('Nhóm mô hình',[['Mô hình quản lý, điều hành',5],['Mô hình chuyển đổi số',4]])]],
 ['Kiến nghị, đề xuất đã tổng hợp theo 9 lĩnh vực',34,'Quý','Hệ thống báo cáo ngành Tổ chức xây dựng Đảng',[P('Lĩnh vực',[['Tổ chức bộ máy, biên chế',6],['Cơ sở đảng, đảng viên',4],['Công tác cán bộ',5],['Đào tạo, bồi dưỡng cán bộ',3],['Chính sách cán bộ',4],['Bảo vệ chính trị nội bộ',3],['Chuyển đổi số',4],['Xây dựng Ngành TCXD Đảng',3],['Các vấn đề khác',2]])]]
 ]},
 {id:'tw-dang-vpban-cb1', name:'Đội ngũ cán bộ lãnh đạo, quản lý (CB.1)', items:[
 ['Tổng số cán bộ lãnh đạo, quản lý',18600,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Diện quản lý',[['Bộ Chính trị, Ban Bí thư',1860],['Cấp ủy, tổ chức đảng',16740]]),P('Chia theo khối',[['Cơ quan Đảng',5200],['Chính phủ, UBND',6400],['Quốc hội, HĐND',2100],['MTTQ, đoàn thể',2800],['Lực lượng vũ trang',2100]])]],
 ['Cơ cấu cán bộ nữ, trẻ, dân tộc thiểu số',18600,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Đặc điểm',[['Cán bộ nữ',5580],['Cán bộ trẻ (dưới 42 tuổi)',3720],['Dân tộc thiểu số',1490]])]],
 ['Độ tuổi cán bộ lãnh đạo, quản lý',18600,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Độ tuổi',[['Dưới 37',1120],['37-42',2340],['42-47',3860],['47-52',4680],['52-57',3900],['57-62',2100],['Trên 62',600]])]]
 ]},
 {id:'tw-dang-vpban-cb2', name:'Công tác quy hoạch cán bộ (CB.2)', items:[
 ['Tổng số cán bộ được quy hoạch nhiệm kỳ tới',24800,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Diện quản lý',[['Bộ Chính trị, Ban Bí thư',1860],['Cấp ủy, tổ chức đảng',22940]])]],
 ['Cán bộ được bổ nhiệm vào chức danh quy hoạch',3260,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Nguồn quy hoạch',[['Nhân sự tại chỗ',2340],['Nhân sự từ nơi khác',920]])]],
 ['Cán bộ nữ, cán bộ trẻ trong quy hoạch',24800,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Đặc điểm',[['Cán bộ nữ',7440],['Cán bộ trẻ (dưới 42 tuổi)',5580]])]]
 ]},
 {id:'tw-dang-vpban-cb3', name:'Điều động, luân chuyển, bổ nhiệm cán bộ (CB.3)', items:[
 ['Lượt điều động, luân chuyển, bổ nhiệm, giới thiệu ứng cử',6840,'Quý','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Loại hình',[['Điều động',1420],['Luân chuyển',980],['Bổ nhiệm',2860],['Bổ nhiệm lại/tái cử',1580]])]],
 ['Cán bộ nữ được điều động, bổ nhiệm, giới thiệu ứng cử',1980,'Quý','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Diện quản lý',[['Bộ Chính trị, Ban Bí thư',210],['Cấp ủy, tổ chức đảng',1770]])]]
 ]},
 {id:'tw-dang-vpban-cb4', name:'Thẩm tra chính trị và xử lý kỷ luật cán bộ (CB.4)', items:[
 ['Hồ sơ thẩm định, thẩm tra tiêu chuẩn chính trị đã xử lý',8600,'Quý','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Kết quả',[['Đạt tiêu chuẩn',7940],['Phức tạp, cần xác minh thêm',480],['Vi phạm tiêu chuẩn chính trị',180]])]],
 ['Cán bộ bị xử lý kỷ luật Đảng, chính quyền',186,'Quý','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Hình thức',[['Khiển trách',96],['Cảnh cáo',54],['Cách chức/giáng chức',24],['Khai trừ/buộc thôi việc',12]])]],
 ['Vụ việc có quyết định khởi tố hình sự',4,'Quý','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Diện quản lý',[['Bộ Chính trị, Ban Bí thư',1],['Cấp ủy, tổ chức đảng',3]])]]
 ]},
 {id:'tw-dang-vpban-cb5', name:'Đánh giá, xếp loại cán bộ (CB.5)', items:[
 ['Tổng số cán bộ được đánh giá, xếp loại hằng quý',22400,'Quý','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Mức xếp loại',[['Hoàn thành xuất sắc nhiệm vụ',6200],['Hoàn thành tốt nhiệm vụ',13400],['Hoàn thành nhiệm vụ',2480],['Không hoàn thành nhiệm vụ',320]]),S('Tỷ lệ hoàn thành',[['Hoàn thành tốt trở lên (%)',87.5]])]],
 ['Mức độ đáp ứng yêu cầu nhiệm vụ',22400,'Quý','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Mức độ',[['Chủ động, hiệu quả, có kết quả cụ thể',15680],['Cơ bản đáp ứng, còn hạn chế',6080],['Không đáp ứng yêu cầu',640]])]],
 ['Cán bộ không hoàn thành nhiệm vụ 2 quý liên tiếp đã thay thế',86,'Quý','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Kết quả',[['Đã thay thế',86],['Đang xem xét',24]])]]
 ]},
 {id:'tw-dang-vpban-cb6', name:'Đào tạo, bồi dưỡng cán bộ (CB.6)', items:[
 ['Lượt cán bộ được đào tạo lý luận chính trị',9600,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Cấp đào tạo',[['Cao cấp',3200],['Trung cấp',6400]])]],
 ['Lượt cán bộ bồi dưỡng cập nhật kiến thức, kỹ năng',18400,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Đối tượng',[['Phó ban đảng, thứ trưởng và tương đương',2400],['Cán bộ nguồn nhiệm kỳ tới',5200],['Chuyên môn (QLNN)',6800],['Nghiệp vụ (công tác Đảng, đoàn thể)',4000]])]],
 ['Cán bộ được cử đào tạo, bồi dưỡng ở nước ngoài',640,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Nguồn kinh phí',[['Ngân sách nhà nước',420],['Hiệp định hợp tác',160],['Khác',60]])]]
 ]},
 {id:'tw-dang-vpban-cb7', name:'Chính sách và chăm sóc sức khỏe cán bộ (CB.7)', items:[
 ['Hồ sơ chế độ chính sách cán bộ đã giải quyết',4860,'Quý','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Loại chế độ',[['Nghỉ hưu trước tuổi',1240],['Nghỉ chờ đủ tuổi',680],['Ảnh hưởng sắp xếp tổ chức',2140],['Thu hút nhân tài',800]])]],
 ['Lượt khám, chăm sóc sức khỏe cán bộ đã tổ chức',2860,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Hình thức',[['Kiểm tra định kỳ',1680],['Khám chữa bệnh, thăm hỏi',1180]])]]
 ]},
 {id:'tw-dang-vpban-cbxa1', name:'Đội ngũ cán bộ lãnh đạo, quản lý cấp xã (CB Xã.1)', items:[
 ['Tổng số cán bộ lãnh đạo, quản lý cấp xã',68400,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Chức danh',[['Bí thư',10260],['Phó Bí thư',10260],['Chủ tịch UBND',10260],['Phó Chủ tịch UBND',18800],['Chủ tịch HĐND',10260],['Chức danh khác',8560]])]],
 ['Cán bộ nữ, dân tộc thiểu số giữ chức danh lãnh đạo cấp xã',68400,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Đặc điểm',[['Cán bộ nữ',17100],['Dân tộc thiểu số',9576]])]]
 ]},
 {id:'tw-dang-vpban-cbxa2', name:'Cán bộ, công chức, viên chức cấp xã (CB Xã.2)', items:[
 ['Tổng số CBCCVC, người lao động cấp xã',248600,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Loại hình',[['Công chức',142400],['Viên chức',68200],['Hợp đồng',28600],['Khác',9400]])]],
 ['CBCCVC cấp xã có trình độ đại học trở lên',186400,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Trình độ chuyên môn',[['Đại học',148600],['Thạc sỹ',34200],['Tiến sỹ',3600]])]]
 ]},
 {id:'tw-dang-vpban-cbnganh', name:'Tổ chức bộ máy, cán bộ ngành TCXD Đảng cấp tỉnh (CB Ngành)', items:[
 ['Tổng biên chế ngành Tổ chức xây dựng Đảng cấp tỉnh',3860,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[S('Biên chế',[['Hiện có',3620],['Được giao',3860]])]],
 ['Cán bộ lãnh đạo, quản lý Ban Tổ chức cấp tỉnh',860,'Năm','CSDL cán bộ ngành Tổ chức xây dựng Đảng',[P('Chức danh',[['Trưởng Ban',34],['Phó Trưởng Ban',68],['Trưởng phòng và tương đương',320],['Phó Trưởng phòng và tương đương',438]])]]
 ]},
 {id:'tw-dang-vpban-tcd', name:'Tổ chức đảng, đảng viên ở cơ sở (TCĐ)', items:[
 ['Tổng số tổ chức cơ sở đảng',54200,'Năm','CSDL đảng viên ngành Tổ chức xây dựng Đảng',[P('Loại hình',[['Đảng bộ cơ sở',24600],['Chi bộ cơ sở',28400],['Tổ đảng',1200]])]],
 ['Tổng số đảng viên sinh hoạt tại tổ chức cơ sở',5624000,'Năm','CSDL đảng viên ngành Tổ chức xây dựng Đảng',[P('Khối',[['Địa phương (thôn, tổ dân phố, xã/phường)',3120000],['Cơ quan, đơn vị sự nghiệp',1680000],['Lực lượng vũ trang',420000],['Doanh nghiệp, kinh tế tập thể',404000]])]]
 ]},
 {id:'tw-dang-vpban-dv', name:'Đảng viên - kết nạp, khai trừ, xóa tên (ĐV)', items:[
 ['Đảng viên mới kết nạp trong kỳ',186400,'Năm','CSDL đảng viên ngành Tổ chức xây dựng Đảng',[P('Độ tuổi',[['18-30',86400],['31-35',42600],['36-40',28600],['Trên 40',28800]])]],
 ['Đảng viên bị khai trừ, xóa tên trong kỳ',4860,'Năm','CSDL đảng viên ngành Tổ chức xây dựng Đảng',[S('Hình thức',[['Khai trừ',1240],['Xóa tên',3620]])]],
 ['Đảng viên xin ra khỏi Đảng đã xử lý',620,'Năm','CSDL đảng viên ngành Tổ chức xây dựng Đảng',[S('Đối tượng',[['Đảng viên đương chức',180],['Đảng viên nghỉ hưu, nghỉ công tác',440]])]]
 ]},
 {id:'tw-dang-vpban-tcbm1', name:'Tổ chức bộ máy, biên chế cơ quan Trung ương (TCBM.1)', items:[
 ['Tổng biên chế được giao khối cơ quan Trung ương',12400,'Năm','CSDL biên chế ngành Tổ chức xây dựng Đảng',[S('Biên chế',[['Hiện có',11860],['Được giao',12400]]),S('Tỷ lệ sử dụng',[['Đã sử dụng (%)',95.6]])]],
 ['Biên chế theo loại hình đơn vị',12400,'Năm','CSDL biên chế ngành Tổ chức xây dựng Đảng',[P('Loại đơn vị',[['Cục, Vụ và tương đương',9200],['Đơn vị sự nghiệp trực thuộc',3200]])]]
 ]},
 {id:'tw-dang-vpban-tcbm2', name:'Tổ chức bộ máy, biên chế cấp tỉnh (TCBM.2)', items:[
 ['Tổng biên chế được giao cấp tỉnh',186400,'Năm','CSDL biên chế ngành Tổ chức xây dựng Đảng',[S('Biên chế',[['Hiện có',178600],['Được giao',186400]])]],
 ['Biên chế theo loại hình đơn vị',186400,'Năm','CSDL biên chế ngành Tổ chức xây dựng Đảng',[P('Loại đơn vị',[['Sở, ban, ngành',98600],['Đơn vị sự nghiệp',62800],['Văn phòng Đoàn ĐBQH và HĐND',25000]])]]
 ]},
 {id:'tw-dang-vpban-tcbm4', name:'Tổ chức bộ máy, biên chế cấp xã (TCBM.4)', items:[
 ['Tổng biên chế được giao cấp xã',420600,'Năm','CSDL biên chế ngành Tổ chức xây dựng Đảng',[S('Biên chế',[['Hiện có',398400],['Được giao',420600]])]],
 ['Biên chế theo loại hình đơn vị',420600,'Năm','CSDL biên chế ngành Tổ chức xây dựng Đảng',[P('Loại đơn vị',[['Phòng, ban chuyên môn',286400],['Đơn vị sự nghiệp',134200]])]]
 ]},
 {id:'tw-dang-vpban-vtvl1', name:'Danh mục vị trí việc làm công chức (VTVL.1)', items:[
 ['Tổng số vị trí việc làm công chức toàn hệ thống',1860,'Năm','CSDL vị trí việc làm ngành Tổ chức xây dựng Đảng',[P('Nhóm vị trí',[['Lãnh đạo, quản lý',420],['Chuyên môn, nghiệp vụ',1440]])]]
 ]},
 {id:'tw-dang-vpban-vtvl2', name:'Danh mục vị trí việc làm viên chức (VTVL.2)', items:[
 ['Tổng số vị trí việc làm viên chức toàn hệ thống',2140,'Năm','CSDL vị trí việc làm ngành Tổ chức xây dựng Đảng',[P('Nhóm vị trí',[['Quản lý',186],['Chuyên môn, nghiệp vụ',1640],['Hỗ trợ, phục vụ',314]])]]
 ]},
 {id:'tw-dang-vpban-vtvl3', name:'Cơ cấu vị trí việc làm công chức (VTVL.3)', items:[
 ['Tổng số công chức theo vị trí việc làm đã xếp',186400,'Năm','CSDL vị trí việc làm ngành Tổ chức xây dựng Đảng',[P('Ngạch',[['Chuyên viên cao cấp và tương đương',4200],['Chuyên viên chính và tương đương',28600],['Chuyên viên và tương đương',124800],['Cán sự và tương đương',20200],['Nhân viên',8600]])]]
 ]},
 {id:'tw-dang-vpban-vtvl4', name:'Cơ cấu vị trí việc làm viên chức (VTVL.4)', items:[
 ['Tổng số viên chức theo vị trí việc làm đã xếp',624000,'Năm','CSDL vị trí việc làm ngành Tổ chức xây dựng Đảng',[P('Bậc nghề nghiệp',[['Bậc 1',86000],['Bậc 2',148000],['Bậc 3',186000],['Bậc 4',124000],['Bậc 5',80000]])]]
 ]},
 {id:'tw-dang-btc-hoiccb', name:'Hội Cựu chiến binh cơ quan', items:[]},
 {id:'tw-dang-btc-doantn', name:'Đoàn Thanh niên cơ quan', items:[]},
 {id:'tw-dang-btc-bcd-daotaonuocngoai', name:'Ban Chỉ đạo thực hiện các chương trình đào tạo, bồi dưỡng cán bộ ở nước ngoài', items:[]},
 ...Object.entries(TW_DANG_OFFICE_CATEGORIES).map(([id,c])=>({id,name:c.name,desc:c.chucNang,items:c.items}))
 ],
 TW_QH:[
 {id:'tw-qh-ubtv', name:'Ủy ban Thường vụ Quốc hội', items:[
 ['Phiên họp Ủy ban Thường vụ Quốc hội đã tổ chức',12,'Năm','CSDL nội bộ Văn phòng Quốc hội'],
 ['Nghị quyết, pháp lệnh đã ban hành',46,'Năm','CSDL nội bộ Văn phòng Quốc hội',[P('Loại văn bản',[['Nghị quyết',34],['Pháp lệnh',12]])]],
 ['Dự án luật đã cho ý kiến trước khi trình Quốc hội',28,'Năm','CSDL nội bộ Văn phòng Quốc hội'],
 ['Kiến nghị cử tri đã giám sát việc giải quyết',1860,'Quý','CSDL nội bộ Văn phòng Quốc hội']
 ]}
 ],
 TW_CP:[
 {id:'tw-cp-bo', name:'Các bộ, cơ quan ngang bộ', items:[
 ['Bộ, cơ quan ngang bộ đang hoạt động',18,'Năm','CSDL nội bộ Văn phòng Chính phủ'],
 ['Nghị định, quyết định của Chính phủ đã ban hành',320,'Năm','CSDL nội bộ Văn phòng Chính phủ',[P('Loại văn bản',[['Nghị định',186],['Quyết định',134]])]],
 ['Nhiệm vụ Chính phủ, Thủ tướng giao đã theo dõi, đôn đốc',12400,'Tháng','CSDL nội bộ Văn phòng Chính phủ',[S('Tình trạng thực hiện',[['Hoàn thành đúng hạn',8600],['Đang triển khai',3200],['Quá hạn',600]])]]
 ]},
 {id:'tw-cp-cqhc', name:'Chính quyền hành chính', items:[
 ['Đơn vị hành chính cấp tỉnh, thành phố trực thuộc Trung ương',34,'Năm','CSDL nội bộ Bộ Nội vụ'],
 ['Thủ tục hành chính đã cắt giảm, đơn giản hóa',620,'Năm','CSDL nội bộ Bộ Nội vụ'],
 ['Hồ sơ dịch vụ công trực tuyến toàn trình đã xử lý',4200,'Tháng','Cổng Dịch vụ công Quốc gia',[S('Kết quả',[['Đúng hạn',3860],['Trễ hạn',340]])]]
 ]}
 ],
 TW_MTTQ:[
 {id:'tw-mttq-ub', name:'Ủy ban Trung ương MTTQ Việt Nam', items:[
 ['Hội nghị Ủy ban Trung ương MTTQ Việt Nam đã tổ chức',4,'Năm','CSDL nội bộ Ủy ban Trung ương MTTQ Việt Nam'],
 ['Chương trình giám sát, phản biện xã hội cấp Trung ương',22,'Năm','CSDL nội bộ Ủy ban Trung ương MTTQ Việt Nam'],
 ['Quỹ "Vì người nghèo" Trung ương vận động (tỷ đồng)',186.4,'Năm','CSDL nội bộ Ủy ban Trung ương MTTQ Việt Nam'],
 ['Ý kiến, kiến nghị cử tri tổng hợp gửi Quốc hội, Chính phủ',2860,'Quý','CSDL nội bộ Ủy ban Trung ương MTTQ Việt Nam']
 ]},
 {id:'tw-mttq-to', name:'Các tổ chức chính trị xã hội trực thuộc hệ thống Mặt trận', items:[
 ['Tổ chức chính trị - xã hội trực thuộc hệ thống Mặt trận',5,'Năm','CSDL nội bộ Ủy ban Trung ương MTTQ Việt Nam',[S('Tổ chức',[['Tổng Liên đoàn Lao động VN',1],['Hội Liên hiệp Phụ nữ VN',1],['Hội Nông dân VN',1],['Đoàn TNCS Hồ Chí Minh',1],['Hội Cựu chiến binh VN',1]])]],
 ['Tổng số hội viên, đoàn viên toàn hệ thống (triệu người)',42.6,'Năm','CSDL nội bộ Ủy ban Trung ương MTTQ Việt Nam'],
 ['Phong trào thi đua toàn quốc do các tổ chức phát động',16,'Năm','CSDL nội bộ Ủy ban Trung ương MTTQ Việt Nam']
 ]}
 ]
 };

 /* 6 trạng thái nhiệm vụ: Mới tạo → Chờ báo cáo tiến độ/Chờ phê duyệt → Xin gia hạn / Hoàn thành → Kết thúc / Thu hồi. */
 const segmentTemplate = {
 DANG:{assigned:{new:40,pending:125,extend:22,done:135,closed:45,revoked:10},received:{new:25,pending:90,extend:15,done:90,closed:30,revoked:8},docIn:{new:35,progress:140,dueSoon:65,done:210,overdue:12},docOut:{new:30,progress:110,dueSoon:46,done:160,overdue:9}},
 HDND:{assigned:{new:10,pending:30,extend:6,done:30,closed:10,revoked:3},received:{new:15,pending:49,extend:10,done:41,closed:14,revoked:5},docIn:{new:14,progress:38,dueSoon:21,done:60,overdue:4},docOut:{new:10,progress:26,dueSoon:14,done:42,overdue:3}},
 UBND:{assigned:{new:90,pending:285,extend:55,done:240,closed:80,revoked:28},received:{new:130,pending:440,extend:85,done:360,closed:120,revoked:42},docIn:{new:160,progress:410,dueSoon:240,done:600,overdue:55},docOut:{new:120,progress:290,dueSoon:180,done:440,overdue:35}},
 MTTQ:{assigned:{new:15,pending:44,extend:9,done:45,closed:15,revoked:4},received:{new:20,pending:66,extend:12,done:56,closed:19,revoked:6},docIn:{new:18,progress:52,dueSoon:28,done:80,overdue:6},docOut:{new:14,progress:36,dueSoon:21,done:58,overdue:4}},
 /* Cấp Trung ương — số liệu minh họa quy mô nhỏ hơn Thành phố Hà Nội (hợp lý vì đây là 1 cơ quan/khối, không phải
 cả bộ máy chính quyền 1 thành phố ~8 triệu dân). Dùng chung 1 pipeline generateRecords()/renderAxisDashboard()
 với Thành phố — không tạo hệ thống riêng. */
 TW_CTN:{assigned:{new:5,pending:12,extend:3,done:14,closed:6,revoked:1},received:{new:4,pending:10,extend:2,done:12,closed:5,revoked:1},docIn:{new:8,progress:20,dueSoon:9,done:32,overdue:2},docOut:{new:6,progress:16,dueSoon:7,done:26,overdue:1}},
 TW_DANG:{assigned:{new:18,pending:46,extend:9,done:52,closed:16,revoked:3},received:{new:14,pending:38,extend:7,done:44,closed:13,revoked:2},docIn:{new:22,progress:58,dueSoon:24,done:88,overdue:5},docOut:{new:18,progress:44,dueSoon:18,done:70,overdue:4}},
 TW_QH:{assigned:{new:8,pending:20,extend:4,done:24,closed:8,revoked:1},received:{new:6,pending:16,extend:3,done:20,closed:6,revoked:1},docIn:{new:12,progress:30,dueSoon:12,done:46,overdue:3},docOut:{new:9,progress:22,dueSoon:9,done:36,overdue:2}},
 TW_CP:{assigned:{new:24,pending:60,extend:12,done:68,closed:22,revoked:4},received:{new:20,pending:52,extend:10,done:58,closed:18,revoked:3},docIn:{new:30,progress:76,dueSoon:32,done:118,overdue:7},docOut:{new:24,progress:58,dueSoon:24,done:92,overdue:5}},
 TW_MTTQ:{assigned:{new:10,pending:26,extend:5,done:30,closed:9,revoked:2},received:{new:8,pending:22,extend:4,done:26,closed:8,revoked:1},docIn:{new:14,progress:34,dueSoon:15,done:52,overdue:3},docOut:{new:11,progress:26,dueSoon:11,done:42,overdue:2}}
 };

 const indicators = {
 DANG:[
 ['Theo dõi nhiệm vụ (VPTU)',180,'Ngày','Đồng bộ dữ liệu API'],
 ['Ban Tổ chức - Tổng số CBCCVC khối Đảng, MTTQ',24,'Tháng','CSDL/Excel nội bộ khối Đảng'],
 ['Ban Tổ chức - Tổng số CBCCVC diện BTV Thành ủy quản lý',24,'Tháng','CSDL/Excel nội bộ khối Đảng'],
 ['Ban Tổ chức - Tổng số Tổ chức Cơ sở Đảng',24,'Quý','CSDL/Excel nội bộ khối Đảng'],
 ['Ban Tổ chức - Biên chế khối Đảng, Đoàn thể (126 xã/phường)',126,'Tháng','CSDL/Excel nội bộ khối Đảng'],
 ['Ban Tổ chức - Kết quả đánh giá cán bộ hàng tháng (126 xã/phường)',126,'Tháng','CSDL/Excel nội bộ khối Đảng'],
 ['Ban Tổ chức - Biến động Đảng viên theo thời gian (126 xã/phường)',126,'Tháng','CSDL/Excel nội bộ khối Đảng'],
 ['Ban Tổ chức - Cơ cấu tổ chức Đảng trực thuộc',24,'Quý','CSDL/Excel nội bộ khối Đảng'],
 ['Ban Tổ chức - Kết quả thực hiện công tác chính trị nội bộ',24,'Quý','CSDL/Excel nội bộ khối Đảng'],
 ['UBKT - Thống kê số liệu kiểm tra, giám sát theo địa bàn (bản đồ)',30,'Tháng','CSDL/Excel UBKT Thành ủy'],
 ['UBKT - Giám sát của UBKT các cấp',30,'Tháng','CSDL/Excel UBKT Thành ủy'],
 ['UBKT - Kiểm tra giám sát của cấp ủy các cấp và chi bộ',30,'Tháng','CSDL/Excel UBKT Thành ủy'],
 ['UBKT - Thi hành kỷ luật',30,'Tháng','CSDL/Excel UBKT Thành ủy'],
 ['UBKT - Kiểm tra của UBKT các cấp (KTGS, THKL, tài chính Đảng)',30,'Tháng','CSDL/Excel UBKT Thành ủy'],
 ['UBKT - Thống kê tình hình đoàn kiểm tra giám sát',30,'Tuần','CSDL/Excel UBKT Thành ủy'],
 ['Ban Nội chính - Tổng số cuộc tiếp/Tổng số lượt công dân',45,'Tuần','CSDL/Excel Ban Nội chính'],
 ['Ban Nội chính - Số văn bản tham mưu trong tháng',12,'Tháng','CSDL/Excel Ban Nội chính'],
 ['Ban Nội chính - Vụ việc an toàn cháy nổ',20,'Tuần','CSDL/Excel Ban Nội chính'],
 ['Ban Nội chính - Số lượt công dân khiếu nại, tố cáo đông người',20,'Tuần','CSDL/Excel Ban Nội chính'],
 ['Ban Tuyên giáo & Dân vận - Đăng ký mô hình dân vận khéo',30,'Quý','CSDL/Excel Ban Tuyên giáo'],
 ['Ban Tuyên giáo & Dân vận - Học tập quán triệt nghị quyết, chỉ thị',15,'Quý','CSDL/Excel Ban Tuyên giáo'],
 ['Ban Tuyên giáo & Dân vận - Nắm bắt dư luận xã hội',30,'Tuần','CSDL/Excel Ban Tuyên giáo']
 ],
 HDND:[
 ['Theo dõi nhiệm vụ (HĐND)',60,'Ngày','Đồng bộ dữ liệu API']
 ],
 UBND:[
 ['Theo dõi nhiệm vụ (dùng chung khối chính quyền)',420,'Ngày','Đồng bộ dữ liệu API'],
 ['Sở GD&ĐT - Tổng quan số liệu toàn ngành',30,'Tháng','Kết nối API'],
 ['Sở GD&ĐT - Tổng quan mạng lưới trường học',30,'Tháng','Kết nối API'],
 ['Sở NN&MT - Chỉ tiêu tổng hợp ngành Nông nghiệp',12,'Tháng','File'],
 ['Sở NN&MT - Tổng hợp dữ liệu Giải phóng mặt bằng',12,'Tháng','File'],
 ['Sở NN&MT - Thống kê tình hình sử dụng đất đai',12,'Quý','File'],
 ['Sở NN&MT - Chỉ số chất lượng không khí (AQI)',12,'Ngày','File'],
 ['Sở Y tế - Tình hình dịch bệnh',20,'Tuần','File'],
 ['Sở Y tế - Số lượt khám chữa bệnh',20,'Tháng','File'],
 ['TT Phục vụ HCC - Thống kê số lượng hồ sơ',30,'Ngày','Kết nối API (L0 đã thống nhất)'],
 ['TT Phục vụ HCC - Tỷ lệ cung cấp DVC trực tuyến',30,'Ngày','Kết nối API (L0 đã thống nhất)'],
 ['TT Phục vụ HCC - Tình hình xử lý hồ sơ',30,'Ngày','Kết nối API (L0 đã thống nhất)'],
 ['TT Phục vụ HCC - Mức độ hài lòng',30,'Tháng','Kết nối API (L0 đã thống nhất)'],
 ['TT Phục vụ HCC - Sáng kiến diễn đàn KHCN',15,'Quý','Kết nối API (L0 đã thống nhất)'],
 ['TT Phục vụ HCC - Sáng kiến xây dựng Thủ đô',15,'Quý','Kết nối API (L0 đã thống nhất)'],
 ['TT Phục vụ HCC - Phản ánh hiện trường iHaNoi',40,'Ngày','Kết nối API (L0 đã thống nhất)'],
 ['Sở Tài chính - Sản phẩm trên địa bàn',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Tổng mức bán ra và doanh thu dịch vụ',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Tổng mức bán lẻ và doanh thu dịch vụ',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Vốn đầu tư phát triển xã hội theo giá hiện hành',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Vốn đầu tư thực hiện nguồn NSNN do địa phương quản lý',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Chỉ số sản xuất công nghiệp so với cùng kỳ',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Dự án trọng điểm',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Doanh thu vận tải, kho bãi, bưu chính chuyển phát',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Khách du lịch đến Hà Nội',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Kim ngạch nhập khẩu',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Kim ngạch xuất khẩu',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Chỉ số tiêu dùng, giá vàng, đô la Mỹ',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Tình hình thu ngân sách',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Tài chính - Tình hình chi ngân sách địa phương',25,'Tháng','Đang trao đổi để kết nối API'],
 ['Sở Nội vụ - Số lượng tìm việc trên sàn giao dịch việc làm',20,'Tuần','File'],
 ['Sở Nội vụ - Tổng số chi trả an sinh cho người có công',20,'Tháng','File'],
 ['Sở Nội vụ - Số lượng CCVC khối chính quyền',20,'Quý','File']
 ],
 MTTQ:[
 ['Theo dõi nhiệm vụ (MTTQ)',60,'Ngày','Đồng bộ dữ liệu API'],
 ['Thu chi quỹ "Vì người nghèo"',15,'Tháng','Excel/CSDL MTTQ'],
 ['Tình hình vận động thu quỹ "Vì người nghèo"',15,'Tháng','Excel/CSDL MTTQ'],
 ['Cơ cấu kết quả vận động nguồn lực hỗ trợ tặng quà Tết theo các cấp',15,'Quý','Excel/CSDL MTTQ'],
 ['Cơ cấu kết quả hỗ trợ tặng quà Tết theo nguồn quỹ',15,'Quý','Excel/CSDL MTTQ'],
 ['Thống kê ủng hộ quỹ "Vì biển, đảo Việt Nam"',15,'Quý','Excel/CSDL MTTQ']
 ]
 };

 /* Phân tổ (breakdown) của 1 chỉ tiêu: P = tách theo nhóm cùng đơn vị (vẽ dạng thanh %); S = các số liệu độc lập khác đơn vị (vẽ dạng thẻ KPI) */
 function P(dim,items){return {dim,type:'bar',items:items.map(x=>({label:x[0],value:x[1]}))};}
 function S(dim,items){return {dim,type:'stat',items:items.map(x=>({label:x[0],value:x[1]}))};}

 /* Cấp xã/phường (currentXaId!=null): 12 đơn vị đúng 12 eform của sheet "Xã/Phường" trong "File mô tả đầu vào eform" — Đảng ủy,
 HĐND, Ủy ban MTTQ mỗi trục một eform; UBND 9 eform. Chỉ tiêu, số liệu dựng ở js/features/ctm-xa-units.js từ bản ghi eform
 (chốt 28/10/2026: bỏ mọi chỉ tiêu ngoài eform). Khác hẳn bộ chỉ tiêu cấp Thành phố, tránh lộ dữ liệu cấp thành phố. */
 function xaEformCat(id,name,field,ef,desc){return {id,name,field,desc,types:['Eform'],items:[['Eform «'+ef+'»',0,'Quý','Eform '+ef,[]]]};}
 const DANG_XA_CATEGORIES = [
 xaEformCat('dangxa-eform','Đảng ủy phường','Đảng ủy phường','Đảng Ủy','Số liệu eform Đảng ủy: kiểm tra giám sát, thi hành kỷ luật, đánh giá cán bộ, biến động đảng viên, cơ cấu tổ chức đảng.')
 ];
 const UBND_XA_CATEGORIES = [
 xaEformCat('ubndxa-hcc','Hành chính công','UBND phường','Hành chính công','Hồ sơ thủ tục hành chính: tiếp nhận, kết quả giải quyết, đang giải quyết.'),
 xaEformCat('ubndxa-tcns','Tài chính - Ngân sách','UBND phường','Tài chính - Ngân sách','Thu, chi ngân sách, doanh nghiệp, hợp tác xã, đầu tư theo tiểu chỉ tiêu của eform.'),
 xaEformCat('ubndxa-qlvb','Quản lý văn bản','UBND phường','Quản lý văn bản','Văn bản đến, văn bản đi theo tình trạng xử lý, trong hạn, quá hạn.'),
 xaEformCat('ubndxa-gpmb','Giải phóng mặt bằng','UBND phường','GPMB','Dự án giải phóng mặt bằng: diện tích thu hồi, hộ bị ảnh hưởng, bàn giao mặt bằng, kinh phí bồi thường.'),
 xaEformCat('ubndxa-gd','Giáo dục','UBND phường','Giáo dục','Cơ sở, học sinh, giáo viên theo bậc học, loại cơ sở, nhóm đối tượng.'),
 xaEformCat('ubndxa-yte','Y tế','UBND phường','Y tế','Ngộ độc thực phẩm, dịch bệnh truyền nhiễm, bảo trợ xã hội.'),
 xaEformCat('ubndxa-vh','Văn hóa','UBND phường','Văn hóa','Nghệ thuật biểu diễn, di sản, lễ hội, thiết chế, thể thao, du lịch, truyền thông, gia đình và văn hóa cơ sở.'),
 xaEformCat('ubndxa-nv','Nội vụ','UBND phường','Nội vụ','Lao động, việc làm, biên chế, tuyển mới, nghỉ hưu, thôi việc, người có công.'),
 xaEformCat('ubndxa-ktxh','Kinh tế xã hội','UBND phường','Kinh tế xã hội','Chỉ tiêu kinh tế tổng hợp, văn hóa - xã hội, xây dựng đô thị: Thành phố giao, kế hoạch, ước thực hiện.')
 ];
 const HDND_XA_CATEGORIES = [
 xaEformCat('hdndxa-eform','Hội đồng nhân dân phường','HĐND phường','Hội đồng nhân dân','Số liệu eform HĐND: nghị quyết, hoạt động giám sát, họp Thường trực, kỳ họp, tiếp xúc cử tri.')
 ];
 const MTTQ_XA_CATEGORIES = [
 xaEformCat('mttqxa-eform','Mặt trận Tổ quốc phường','MTTQ phường','Mặt trận tổ quốc','Số liệu eform MTTQ: Mặt trận, Đoàn Thanh niên, Hội Nông dân, Hội Phụ nữ, Hội Cựu chiến binh, Công đoàn, các hội quần chúng.')
 ];
 const XA_CATEGORIES_BY_ROLE = {DANG:DANG_XA_CATEGORIES,HDND:HDND_XA_CATEGORIES,UBND:UBND_XA_CATEGORIES,MTTQ:MTTQ_XA_CATEGORIES};
 function categorySeedForRole(r){
 if(isTwRole(r)) return TW_OFFICE_CATEGORIES_BY_ROLE[r]||[];
 if(currentXaId!=null){
 if(r==='DANG') return DANG_XA_CATEGORIES;
 if(r==='UBND') return UBND_XA_CATEGORIES;
 if(r==='HDND') return HDND_XA_CATEGORIES;
 if(r==='MTTQ') return MTTQ_XA_CATEGORIES;
 }
 return (categorySeed[r]||[]).filter(c=>!c.an);
 }
 const categorySeed = {
 DANG:[
 {id:'dang-vptu',name:'VPTU · Theo dõi nhiệm vụ',field:'Thành ủy',desc:'Thống kê số lượng, tình trạng nhận và giao nhiệm vụ theo khối/đơn vị, đồng bộ trực tiếp qua IOC.',types:['API'],items:[['Theo dõi nhiệm vụ (VPTU)',1442,'Ngày','Đồng bộ dữ liệu API']]},
 {id:'dang-to-chuc',name:'Ban Tổ chức Thành ủy',field:'Thành ủy',desc:'Tổ chức cán bộ, biên chế, đánh giá cán bộ, biến động Đảng viên và công tác chính trị nội bộ.',types:['CSDL','Excel'],items:[
 ['Ban Tổ chức - Tổng số CBCCVC khối Đảng, MTTQ',4505,'Tháng','CSDL/Excel nội bộ khối Đảng',[P('Khối',[['Khối Đảng',3240],['Khối MTTQ',1620]])]],
 ['Ban Tổ chức - Tổng số CBCCVC diện BTV Thành ủy quản lý',24,'Tháng','CSDL/Excel nội bộ khối Đảng',[P('Loại cán bộ',[['Lãnh đạo chủ chốt',180],['Cán bộ diện quy hoạch',320],['Cán bộ khác',180]])]],
 ['Ban Tổ chức - Tổng số Tổ chức Cơ sở Đảng',5887,'Quý','CSDL/Excel nội bộ khối Đảng',[P('Loại hình',[['Đảng bộ cơ sở',186],['Chi bộ cơ sở',940]])]],
 ['Ban Tổ chức - Biên chế khối Đảng, Đoàn thể (126 xã/phường)',126,'Tháng','CSDL/Excel nội bộ khối Đảng',[P('Khối',[['Khối Đảng',1860],['Đoàn thể',940]])]],
 ['Ban Tổ chức - Kết quả đánh giá cán bộ hàng tháng (126 xã/phường)',126,'Tháng','CSDL/Excel nội bộ khối Đảng',[P('Mức đánh giá',[['Hoàn thành xuất sắc',420],['Hoàn thành tốt',1240],['Hoàn thành nhiệm vụ',980],['Không hoàn thành',60]])]],
 ['Ban Tổ chức - Biến động Đảng viên theo thời gian (126 xã/phường)',126,'Tháng','CSDL/Excel nội bộ khối Đảng',[P('Loại biến động',[['Kết nạp mới',680],['Chuyển sinh hoạt đến',420],['Chuyển sinh hoạt đi',380],['Từ trần, xóa tên',86]])]],
 ['Ban Tổ chức - Cơ cấu tổ chức Đảng trực thuộc',24,'Quý','CSDL/Excel nội bộ khối Đảng',[P('Loại hình',[['Đảng bộ trực thuộc',48],['Chi bộ trực thuộc',186]])]],
 ['Ban Tổ chức - Kết quả thực hiện công tác chính trị nội bộ',24,'Quý','CSDL/Excel nội bộ khối Đảng',[P('Nội dung',[['Sinh hoạt định kỳ',420],['Học tập nghị quyết, chỉ thị',280],['Kiểm điểm, đánh giá cuối năm',180]])]]
 ]},
 {id:'dang-ubkt',name:'Ủy ban Kiểm tra Thành ủy',field:'Thành ủy',desc:'Kiểm tra, giám sát theo địa bàn (bản đồ), thi hành kỷ luật và tình hình đoàn kiểm tra giám sát.',types:['CSDL','Excel'],items:[['UBKT - Thống kê số liệu kiểm tra, giám sát theo địa bàn (bản đồ)',30,'Tháng','CSDL/Excel UBKT Thành ủy'],['UBKT - Giám sát của UBKT các cấp',233,'Tháng','CSDL/Excel UBKT Thành ủy'],['UBKT - Kiểm tra giám sát của cấp ủy các cấp và chi bộ',1049,'Tháng','CSDL/Excel UBKT Thành ủy'],['UBKT - Thi hành kỷ luật',35,'Tháng','CSDL/Excel UBKT Thành ủy'],['UBKT - Kiểm tra của UBKT các cấp (KTGS, THKL, tài chính Đảng)',91,'Tháng','CSDL/Excel UBKT Thành ủy'],['UBKT - Thống kê tình hình đoàn kiểm tra giám sát',272,'Tuần','CSDL/Excel UBKT Thành ủy']]},
 {id:'dang-noi-chinh',name:'Ban Nội chính Thành ủy',field:'Thành ủy',desc:'Tiếp công dân, văn bản tham mưu, an toàn cháy nổ và khiếu nại - tố cáo đông người.',types:['CSDL','Excel'],items:[
 ['Ban Nội chính - Tổng số cuộc tiếp/Tổng số lượt công dân',11,'Tuần','CSDL/Excel Ban Nội chính'],
 ['Ban Nội chính - Số văn bản tham mưu trong tháng',9,'Tháng','CSDL/Excel Ban Nội chính'],
 ['Ban Nội chính - Vụ việc an toàn cháy nổ',59,'Tuần','CSDL/Excel Ban Nội chính'],
 ['Ban Nội chính - Số lượt công dân khiếu nại, tố cáo đông người',696,'Tuần','CSDL/Excel Ban Nội chính']
 ]},
 {id:'dang-tuyen-giao',name:'Ban Tuyên giáo và Dân vận Thành ủy',field:'Thành ủy',desc:'Mô hình dân vận khéo, học tập quán triệt nghị quyết/chỉ thị và nắm bắt dư luận xã hội.',types:['CSDL','Excel'],items:[
 ['Ban Tuyên giáo & Dân vận - Đăng ký mô hình dân vận khéo',10972,'Năm','CSDL/Excel Ban Tuyên giáo'],
 ['Ban Tuyên giáo & Dân vận - Học tập quán triệt nghị quyết, chỉ thị',15,'Quý','CSDL/Excel Ban Tuyên giáo',[P('Đối tượng',[['Cán bộ chủ chốt',420],['Đảng viên',3860],['Quần chúng, đoàn viên, hội viên',1240]])]],
 ['Ban Tuyên giáo & Dân vận - Nắm bắt dư luận xã hội',2410,'Tuần','CSDL/Excel Ban Tuyên giáo']
 ]}
 ],
 HDND:[
 {id:'hdnd-nhiem-vu',name:'HĐND · Theo dõi nhiệm vụ',field:'HĐND',desc:'Thống kê số lượng, tình trạng nhận và giao nhiệm vụ của khối HĐND Thành phố.',types:['API'],items:[['Theo dõi nhiệm vụ (HĐND)',60,'Ngày','Đồng bộ dữ liệu API']]},
 {id:'hdnd-do-thi',name:'Ban Đô thị',field:'HĐND',desc:'Giám sát quy hoạch, quản lý đô thị, hạ tầng kỹ thuật và các dự án chỉnh trang đô thị trên địa bàn Thành phố.',types:['Excel','CSDL'],items:[
 ['Số cuộc giám sát chuyên đề về quy hoạch, đô thị',30,'Quý','Excel/CSDL HĐND',[P('Lĩnh vực giám sát',[['Quy hoạch xây dựng',8],['Hạ tầng kỹ thuật',6],['Trật tự xây dựng',10]])]],
 ['Kết quả thẩm tra tờ trình, dự thảo nghị quyết lĩnh vực đô thị',30,'Năm','Excel/CSDL HĐND',[S('Kết quả thẩm tra',[['Đã thẩm tra, trình HĐND',18],['Đang xử lý',4]])]]
 ]},
 {id:'hdnd-khcn-mt',name:'Ban Khoa học Công nghệ và Môi trường',field:'HĐND',desc:'Giám sát ứng dụng khoa học công nghệ, chuyển đổi số và công tác bảo vệ môi trường của Thành phố.',types:['Excel','CSDL'],items:[
 ['Số cuộc giám sát chuyên đề KHCN, môi trường',30,'Quý','Excel/CSDL HĐND',[P('Lĩnh vực giám sát',[['Chuyển đổi số',7],['Bảo vệ môi trường',9],['Ứng dụng KHCN',5]])]],
 ['Kết quả xử lý kiến nghị cử tri liên quan môi trường',30,'Quý','Excel/CSDL HĐND',[S('Kết quả',[['Đã giải quyết',26],['Đang xử lý',8]])]]
 ]},
 {id:'hdnd-kt-ns',name:'Ban Kinh tế - Ngân sách',field:'HĐND',desc:'Thẩm tra dự toán, quyết toán ngân sách và giám sát các chỉ tiêu phát triển kinh tế - xã hội.',types:['Excel','CSDL'],items:[
 ['Kết quả thẩm tra dự toán, quyết toán ngân sách',30,'Năm','Excel/CSDL HĐND',[S('Nội dung thẩm tra',[['Dự toán ngân sách',12],['Quyết toán ngân sách',12]])]],
 ['Số cuộc giám sát chuyên đề kinh tế - ngân sách',30,'Quý','Excel/CSDL HĐND',[P('Lĩnh vực giám sát',[['Đầu tư công',9],['Thu chi ngân sách',7],['Doanh nghiệp nhà nước',4]])]]
 ]},
 {id:'hdnd-phap-che',name:'Ban Pháp chế',field:'HĐND',desc:'Giám sát công tác thi hành pháp luật, cải cách tư pháp, phòng chống tham nhũng và nội chính.',types:['Excel','CSDL'],items:[
 ['Số cuộc giám sát chuyên đề pháp chế, nội chính',30,'Quý','Excel/CSDL HĐND',[P('Lĩnh vực giám sát',[['Thi hành pháp luật',8],['Cải cách tư pháp',5],['Phòng chống tham nhũng',6]])]],
 ['Kết quả thẩm tra dự thảo nghị quyết lĩnh vực pháp chế',30,'Năm','Excel/CSDL HĐND',[S('Kết quả thẩm tra',[['Đã thẩm tra, trình HĐND',14],['Đang xử lý',3]])]]
 ]},
 {id:'hdnd-vh-xh',name:'Ban Văn hóa - Xã hội',field:'HĐND',desc:'Giám sát lĩnh vực giáo dục, y tế, văn hóa, lao động và các chính sách an sinh xã hội.',types:['Excel','CSDL'],items:[
 ['Số cuộc giám sát chuyên đề văn hóa - xã hội',30,'Quý','Excel/CSDL HĐND',[P('Lĩnh vực giám sát',[['Giáo dục - Đào tạo',9],['Y tế',7],['Lao động - Xã hội',6],['Văn hóa - Thể thao',5]])]],
 ['Kết quả xử lý kiến nghị cử tri lĩnh vực văn hóa - xã hội',30,'Quý','Excel/CSDL HĐND',[S('Kết quả',[['Đã giải quyết',32],['Đang xử lý',10]])]]
 ]},
 {id:'hdnd-doan-dbqh',name:'Đoàn ĐBQH',field:'HĐND',desc:'Hoạt động tiếp xúc cử tri, giám sát chuyên đề và tổng hợp ý kiến, kiến nghị của Đoàn Đại biểu Quốc hội Thành phố.',types:['Excel','CSDL'],items:[
 ['Số cuộc tiếp xúc cử tri của Đoàn ĐBQH',30,'Quý','Excel/CSDL HĐND',[S('Hình thức tiếp xúc',[['Trước kỳ họp',6],['Sau kỳ họp',6]])]],
 ['Kết quả tổng hợp ý kiến, kiến nghị cử tri gửi Quốc hội',30,'Quý','Excel/CSDL HĐND',[S('Kết quả',[['Đã trả lời',48],['Đang tổng hợp',14]])]]
 ]},
 {id:'hdnd-xa-phuong',name:'HĐND Xã, Phường',field:'HĐND',desc:'Tổng hợp hoạt động HĐND cấp xã, phường trên địa bàn Thành phố.',types:['Excel','CSDL'],items:[
 ['Số HĐND xã, phường trực thuộc',126,'Năm','Excel/CSDL HĐND',[]],
 ['Kết quả tổ chức kỳ họp HĐND cấp xã, phường',126,'Quý','Excel/CSDL HĐND',[S('Kết quả',[['Đã tổ chức đúng kế hoạch',118],['Chậm kế hoạch',8]])]]
 ]},
 {id:'hdnd-to-tuvan',name:'Tổ chuyên gia tư vấn thường trực HĐND TP',field:'HĐND',desc:'Tư vấn chuyên môn cho Thường trực HĐND trong thẩm tra, xây dựng nghị quyết và giám sát chuyên đề.',types:['Excel','CSDL'],items:[
 ['Số lượt tư vấn, góp ý dự thảo nghị quyết',30,'Quý','Excel/CSDL HĐND',[S('Kết quả',[['Đã có ý kiến tư vấn',22],['Đang xử lý',5]])]]
 ]},
 {id:'hdnd-vp-doan-dbqh',name:'Văn phòng Đoàn ĐBQH - HĐND Thành phố',field:'HĐND',desc:'Công tác hành chính, tổng hợp, phục vụ hoạt động của Đoàn ĐBQH và Thường trực HĐND Thành phố.',types:['Excel','CSDL'],items:[
 ['Số văn bản đến, đi trong kỳ',30,'Tháng','Excel/CSDL HĐND',[S('Loại văn bản',[['Văn bản đến',162],['Văn bản đi',128]])]],
 ['Kết quả phục vụ tổ chức kỳ họp, phiên họp HĐND',30,'Quý','Excel/CSDL HĐND',[S('Kết quả',[['Đã hoàn thành',16],['Đang chuẩn bị',3]])]]
 ]}
 ],
 MTTQ:[
 {id:'mttq-nhiem-vu',name:'MTTQ · Theo dõi nhiệm vụ',field:'MTTQ',desc:'Thống kê số lượng, tình trạng nhận và giao nhiệm vụ của khối MTTQ Thành phố.',types:['API'],items:[['Theo dõi nhiệm vụ (MTTQ)',60,'Ngày','Đồng bộ dữ liệu API']]},
 {id:'mttq-quy',name:'Ban Tuyên giáo và Công tác Xã hội',field:'MTTQ',desc:'Thu chi Quỹ "Vì người nghèo", vận động tặng quà Tết và ủng hộ Quỹ "Vì biển, đảo Việt Nam".',types:['Excel','CSDL'],items:[
 ['Tổng thu - chi - tồn quỹ "Vì người nghèo" (đồng)',15,'Tháng','Excel/CSDL MTTQ',[S('Tình hình quỹ',[['Tổng thu quỹ Vì người nghèo',58320766393],['Tổng chi quỹ Vì người nghèo',22049830640],['Tồn quỹ Vì người nghèo',36270935753]])]],
 ['Tình hình vận động thu quỹ "Vì người nghèo" (đồng)',15,'Tháng','Excel/CSDL MTTQ',[P('Nguồn vận động',[['Quỹ cấp xã, phường',5449307527],['Ủng hộ bằng hình thức khác',9568695205],['MTTQ TP hỗ trợ',1538800000]])]],
 ['Tình hình chi hỗ trợ quỹ "Vì người nghèo" (đồng)',15,'Tháng','Excel/CSDL MTTQ',[P('Nội dung hỗ trợ',[['Hỗ trợ xây mới nhà Đại đoàn kết',5795000000],['Hỗ trợ sửa chữa nhà Đại đoàn kết',820000000],['Hỗ trợ vốn, vật tư sản xuất',483476000],['Hỗ trợ khám chữa bệnh',98000000],['Hỗ trợ cho con em đi học',149000000],['Hỗ trợ khác quy ra tiền',14704354640]])]],
 ['Thống kê ủng hộ quỹ "Vì biển, đảo Việt Nam" (đồng)',15,'Quý','Excel/CSDL MTTQ',[P('Đối tượng ủng hộ',[['Thành ủy - HĐND - UBND - UB MTTQ VN TP và các Sở, Ban, Ngành, cơ quan, đơn vị',2075612459],['Ủy ban MTTQ Việt Nam xã, phường',3176804422],['Các đơn vị và sở - ban - ngành Thành phố',1249455586],['Doanh nghiệp',225840000],['Cá nhân',82007742]])]],
 ['Cơ cấu kết quả vận động các nguồn lực hỗ trợ tặng quà Tết (đồng)',15,'Năm','Excel/CSDL MTTQ',[P('Nguồn vận động',[['MTTQ TP hỗ trợ',5530000000],['Vận động tại cấp xã, phường',10144850000]])]],
 ['Cơ cấu kết quả hỗ trợ tặng quà Tết (đồng)',15,'Năm','Excel/CSDL MTTQ',[P('Nguồn quỹ',[['Nguồn Quỹ "Vì người nghèo"',11253400000],['Các đơn vị, doanh nghiệp và các nhà hảo tâm tặng quà',4880900000],['Nguồn khác',2629150000]])]]
 ]},
 {id:'mttq-danchu-giamsat',name:'Ban Dân chủ Giám sát và Phản biện Xã hội',field:'MTTQ',desc:'Kết quả giải quyết đơn, thư, tiếp công dân.',types:['Excel','CSDL'],items:[
 ['Kết quả giải quyết đơn, thư, tiếp công dân — Đơn lưu theo ngày',30,'Tuần','Excel/CSDL MTTQ',[P('Ngày',[['01/01',64],['02/01',51],['03/01',47],['04/01',37],['05/01',56],['06/01',42],['07/01',39]])]],
 ['Kết quả giải quyết đơn, thư, tiếp công dân — Đơn xử lý theo ngày',30,'Tuần','Excel/CSDL MTTQ',[P('Ngày',[['01/01',58],['02/01',64],['03/01',76],['04/01',69],['05/01',63],['06/01',55],['07/01',58]])]]
 ]},
 {id:'mttq-dantoc-tongiao',name:'Ban Công tác Dân tộc, Tôn giáo và Hội quần chúng (Hệ thống iHanoi)',field:'MTTQ',desc:'Tỷ lệ đánh giá và mức độ hài lòng sau xử lý phản ánh kiến nghị trên Hệ thống iHanoi.',types:['API'],items:[
 ['Tỷ lệ đánh giá sau xử lý phản ánh kiến nghị',30,'Tháng','Hệ thống iHanoi',[P('Đánh giá',[['Đã đánh giá',1],['Chưa đánh giá',4]])]],
 ['Mức độ hài lòng xử lý phản ánh kiến nghị',30,'Tháng','Hệ thống iHanoi',[P('Mức độ',[['Rất hài lòng',64],['Hài lòng',64],['Bình thường',76],['Không hài lòng',37],['Rất không hài lòng',56]])]]
 ]},
 {id:'mttq-cong-tac-phu-nu',name:'Ban Công tác Phụ nữ',field:'MTTQ',desc:'Hoạt động xây dựng người phụ nữ Thủ đô, tập huấn bồi dưỡng, kinh phí hỗ trợ phụ nữ - trẻ em, hoạt động ủy thác và bình đẳng giới.',types:['Excel','CSDL'],items:[
 ['Thống kê hoạt động xây dựng người Phụ nữ Thủ đô',30,'Tháng','Excel/CSDL MTTQ',[P('Số cuộc (cuộc)',[['Hoạt động thực hiện PTTĐ, CVĐ Phụ nữ Thủ đô ứng xử đẹp',64],['Dự án 8',64],['Hoạt động thực hiện Đề án 938',76]]),P('Tổng số lượt tham gia (lượt)',[['Hoạt động thực hiện PTTĐ, CVĐ Phụ nữ Thủ đô ứng xử đẹp',45],['Dự án 8',26],['Hoạt động thực hiện Đề án 938',27]])]],
 ['Hoạt động tập huấn, bồi dưỡng NVCTH, ứng dụng CNTT',30,'Tháng','Excel/CSDL MTTQ',[P('Số cuộc (cuộc)',[['01/2026',64],['02/2026',64],['03/2026',76],['04/2026',37],['05/2026',56],['06/2026',43]]),P('Tổng số lượt tham gia (lượt)',[['01/2026',45],['02/2026',24],['03/2026',25],['04/2026',24],['05/2026',25],['06/2026',24]])]],
 ['Kinh phí thực hiện các chương trình hỗ trợ phụ nữ và trẻ em (tỷ đồng)',30,'Năm','Excel/CSDL MTTQ',[P('Tỷ đồng',[['Chương trình hỗ trợ phụ nữ',52],['Chương trình hỗ trợ trẻ em',38],['Hoạt động an sinh xã hội',44]])]],
 ['Thống kê hoạt động ủy thác',30,'Tháng','Excel/CSDL MTTQ',[P('Số người vay (người)',[['01/2026',64],['02/2026',58],['03/2026',76],['04/2026',66],['05/2026',56],['06/2026',61]]),P('Số tiền (tỷ đồng)',[['01/2026',12.5],['02/2026',64],['03/2026',15.7],['04/2026',37],['05/2026',11.9],['06/2026',43]])]],
 ['Vận động xã hội thực hiện bình đẳng giới',30,'Tháng','Excel/CSDL MTTQ',[P('Số cuộc (cuộc)',[['Tuyên truyền chủ trương, CSPL, bầu cử, 5 điểm nghẽn',64],['Hỗ trợ nữ ứng cử viên HĐND các cấp',64],['Hoạt động bình đẳng giới',76]]),P('Tổng số lượt tham gia (lượt)',[['Tuyên truyền chủ trương, CSPL, bầu cử, 5 điểm nghẽn',45],['Hỗ trợ nữ ứng cử viên HĐND các cấp',100],['Hoạt động bình đẳng giới',25]])]]
 ]},
 {id:'mttq-cong-tac-cong-doan',name:'Ban Công tác Công đoàn',field:'MTTQ',desc:'Hỗ trợ đoàn viên/người lao động, công tác chăm lo, kết quả thực hiện chỉ tiêu Công đoàn và tai nạn lao động.',types:['Excel','CSDL'],items:[
 ['Tổng hợp hỗ trợ đoàn viên, NLĐ trong Tháng Công nhân, Tháng hành động về An toàn vệ sinh lao động',30,'Tháng','Excel/CSDL MTTQ',[P('Tổng số tiền hỗ trợ (triệu đồng)',[['Nguồn từ CĐ P,X, KCN',64],['Nguồn từ CĐCS',64]]),P('Số lượt người được hỗ trợ (người)',[['Nguồn từ CĐ P,X, KCN',45],['Nguồn từ CĐCS',26]])]],
 ['Tổng hợp công tác chăm lo khác',30,'Tháng','Excel/CSDL MTTQ',[P('Tổng số tiền hỗ trợ (triệu đồng)',[['Nguồn từ CĐ P,X, KCN',52],['Nguồn từ CĐCS',43]]),P('Số lượt người được hỗ trợ (người)',[['Nguồn từ CĐ P,X, KCN',35],['Nguồn từ CĐCS',25]])]],
 ['Kết quả thực hiện các chỉ tiêu Công đoàn',30,'Tháng','Excel/CSDL MTTQ',[P('Số giao (chỉ tiêu)',[['Thỏa ước lao động tiên tiến',64],['Quy chế dân chủ tại nơi làm việc',64],['Tăng giá trị bữa ăn ca',76],['Hội nghị người lao động',37]]),P('Số thực hiện (chỉ tiêu)',[['Thỏa ước lao động tiên tiến',45],['Quy chế dân chủ tại nơi làm việc',88],['Tăng giá trị bữa ăn ca',22],['Hội nghị người lao động',92]])]],
 ['Số vụ tai nạn lao động (người)',30,'Tháng','Excel/CSDL MTTQ',[P('Mức độ',[['Số người chết',0],['Số người bị thương nặng',1]])]]
 ]},
 {id:'mttq-cuu-chien-binh',name:'Ban Công tác Cựu chiến binh',field:'MTTQ',desc:'Tình hình tổ chức Hội, công tác tuyên giáo, chính sách hậu phương và hoạt động tiếp xúc, đối thoại.',types:['Excel','CSDL'],items:[
 ['Tình hình tổ chức Hội Cựu chiến binh',30,'Tháng','Excel/CSDL MTTQ',[P('Báo cáo (đơn vị)',[['Cấp xã và tương đương',64],['Chi hội',64],['Chưa có tổ chức hội',76]])]],
 ['Kết quả công tác tuyên giáo',30,'Tháng','Excel/CSDL MTTQ',[P('Số buổi (buổi)',[['Thời sự',64],['TT-CT-NQ',64],['Văn nghệ - TT',76]]),P('Số lượt tham gia (lượt)',[['Thời sự',40],['TT-CT-NQ',25],['Văn nghệ - TT',45]])]],
 ['Kết quả công tác chính sách, hậu phương',30,'Tháng','Excel/CSDL MTTQ',[P('Số tiền (triệu đồng)',[['Thăm hỏi - Phúng viếng - Mừng thọ - Hoạt động tình nghĩa',52],['Trợ cấp khó khăn',43],['Khám bệnh, cấp thuốc miễn phí',38]]),P('Số lượt tham gia (lượt)',[['Thăm hỏi - Phúng viếng - Mừng thọ - Hoạt động tình nghĩa',40],['Trợ cấp khó khăn',25],['Khám bệnh, cấp thuốc miễn phí',20]])]],
 ['Hoạt động tiếp xúc và đối thoại',30,'Tháng','Excel/CSDL MTTQ',[P('Số lượt tham gia (lượt)',[['Phản biện xã hội',64],['Tiếp xúc cử tri',64],['Đối thoại',76],['GPMB',37]]),P('Số lượt ý kiến (ý kiến)',[['Phản biện xã hội',45],['Tiếp xúc cử tri',40],['Đối thoại',44],['GPMB',42]])]]
 ]},
 {id:'mttq-doan-thanh-thieu-nhi',name:'Ban Công tác Đoàn và Thanh thiếu nhi',field:'MTTQ',desc:'Hoạt động Đoàn, phong trào thanh thiếu nhi, tình nguyện và tuyên truyền pháp luật cho thanh niên.',types:['Excel','CSDL'],items:[
 ['Số hoạt động Đoàn - phong trào thanh thiếu nhi tổ chức',30,'Tháng','Excel/CSDL MTTQ',[P('Loại hoạt động',[['Tình nguyện vì cộng đồng',42],['Tuyên truyền pháp luật',36],['Sinh hoạt hè, kỹ năng sống',28]])]],
 ['Số lượt đoàn viên, thanh thiếu nhi tham gia',30,'Tháng','Excel/CSDL MTTQ',[S('Đối tượng tham gia',[['Đoàn viên',3840],['Thanh thiếu nhi',2260]])]]
 ]},
 {id:'mttq-cong-tac-nong-dan',name:'Ban Công tác Nông Dân',field:'MTTQ',desc:'Phong trào nông dân sản xuất kinh doanh giỏi, hỗ trợ vốn - kỹ thuật và xây dựng nông thôn mới.',types:['Excel','CSDL'],items:[
 ['Kết quả phong trào nông dân sản xuất, kinh doanh giỏi',30,'Năm','Excel/CSDL MTTQ',[P('Danh hiệu',[['Cấp Trung ương',12],['Cấp Thành phố',86],['Cấp cơ sở',420]])]],
 ['Kinh phí hỗ trợ vốn, kỹ thuật cho hội viên (tỷ đồng)',30,'Năm','Excel/CSDL MTTQ',[S('Nguồn hỗ trợ',[['Quỹ Hỗ trợ nông dân',28.5],['Vốn ủy thác ngân hàng',64.2]])]]
 ]},
 {id:'mttq-thuong-truc',name:'Ban Thường trực',field:'MTTQ',desc:'Tổng hợp chương trình công tác, hội nghị Ủy ban MTTQ các cấp và kết quả hiệp thương phối hợp.',types:['Excel','CSDL'],items:[
 ['Số hội nghị Ủy ban MTTQ, Ban Thường trực tổ chức',30,'Quý','Excel/CSDL MTTQ',[P('Cấp tổ chức',[['Cấp Thành phố',8],['Cấp xã, phường',126]])]],
 ['Kết quả thực hiện chương trình phối hợp thống nhất hành động',30,'Năm','Excel/CSDL MTTQ',[S('Kết quả',[['Nội dung đã hoàn thành',34],['Nội dung đang triển khai',9]])]]
 ]},
 {id:'mttq-to-chuc-kiem-tra',name:'Ban Tổ chức, kiểm tra',field:'MTTQ',desc:'Công tác tổ chức cán bộ, kiểm tra - giám sát nội bộ khối MTTQ và các tổ chức thành viên.',types:['Excel','CSDL'],items:[
 ['Tổng số cán bộ, công chức khối MTTQ',30,'Tháng','Excel/CSDL MTTQ',[S('Cơ cấu cán bộ',[['Biên chế',186],['Hợp đồng',42]])]],
 ['Số cuộc kiểm tra, giám sát trong kỳ',30,'Quý','Excel/CSDL MTTQ',[P('Loại hình',[['Kiểm tra nội bộ',14],['Giám sát chuyên đề',9]])]]
 ]},
 {id:'mttq-hoi-lhpn',name:'Hội Liên hiệp phụ nữ thành phố',field:'MTTQ',desc:'Tổ chức hội, phong trào thi đua và hoạt động chăm lo hội viên phụ nữ toàn Thành phố.',types:['Excel','CSDL'],items:[
 ['Tổng số hội viên phụ nữ',30,'Năm','Excel/CSDL MTTQ',[S('Cơ cấu hội viên',[['Hội viên nòng cốt',86400],['Hội viên thường xuyên',214600]])]],
 ['Kết quả phong trào thi đua "Phụ nữ Thủ đô"',30,'Năm','Excel/CSDL MTTQ',[P('Danh hiệu',[['Gia đình văn hóa tiêu biểu',1240],['Phụ nữ điển hình tiên tiến',360]])]]
 ]},
 {id:'mttq-hoi-nong-dan-tp',name:'Hội Nông dân thành phố',field:'MTTQ',desc:'Tổ chức hội, hội viên và các phong trào thi đua của nông dân toàn Thành phố.',types:['Excel','CSDL'],items:[
 ['Tổng số hội viên nông dân',30,'Năm','Excel/CSDL MTTQ',[S('Cơ cấu hội viên',[['Hội viên chính thức',128400],['Hội viên mới kết nạp',3200]])]],
 ['Số mô hình kinh tế tập thể do Hội hỗ trợ',30,'Năm','Excel/CSDL MTTQ',[P('Loại mô hình',[['Tổ hợp tác',186],['Hợp tác xã nông nghiệp',64]])]]
 ]},
 {id:'mttq-lien-doan-lao-dong',name:'Liên đoàn lao động thành phố',field:'MTTQ',desc:'Tổ chức công đoàn cơ sở, đoàn viên và hoạt động chăm lo người lao động toàn Thành phố.',types:['Excel','CSDL'],items:[
 ['Tổng số công đoàn cơ sở, đoàn viên',30,'Năm','Excel/CSDL MTTQ',[S('Cơ cấu tổ chức',[['Công đoàn cơ sở',4820],['Đoàn viên công đoàn',612000]])]],
 ['Kinh phí chăm lo Tháng Công nhân (tỷ đồng)',30,'Năm','Excel/CSDL MTTQ',[S('Nguồn kinh phí',[['Nguồn Liên đoàn Lao động TP',18.6],['Nguồn công đoàn cơ sở',22.4]])]]
 ]},
 {id:'mttq-xa-phuong',name:'MTTQ Xã, Phường',field:'MTTQ',desc:'Tổng hợp hoạt động Ủy ban MTTQ Việt Nam cấp xã, phường trên địa bàn Thành phố.',types:['Excel','CSDL'],items:[
 ['Số Ủy ban MTTQ xã, phường trực thuộc',126,'Năm','Excel/CSDL MTTQ',[]],
 ['Kết quả vận động Quỹ, phong trào tại cơ sở (đồng)',126,'Quý','Excel/CSDL MTTQ',[S('Nội dung',[['Vận động Quỹ Vì người nghèo',5449307527],['Vận động Quỹ an sinh xã hội',2186400000]])]]
 ]},
 {id:'mttq-thanh-doan',name:'Thành Đoàn Hà Nội',field:'MTTQ',desc:'Tổ chức Đoàn, đoàn viên thanh niên và các phong trào tình nguyện toàn Thành phố.',types:['Excel','CSDL'],items:[
 ['Tổng số cơ sở Đoàn, đoàn viên',30,'Năm','Excel/CSDL MTTQ',[S('Cơ cấu tổ chức',[['Cơ sở Đoàn',612],['Đoàn viên thanh niên',248600]])]],
 ['Kết quả phong trào tình nguyện vì cộng đồng',30,'Năm','Excel/CSDL MTTQ',[P('Loại hoạt động',[['Chiến dịch Thanh niên tình nguyện hè',86],['Hiến máu nhân đạo',64],['Tình nguyện mùa đông',42]])]]
 ]},
 {id:'mttq-vp-co-quan',name:'Văn phòng Cơ quan',field:'MTTQ',desc:'Công tác hành chính, tổng hợp và bảo đảm điều kiện làm việc của cơ quan Ủy ban MTTQ Thành phố.',types:['Excel','CSDL'],items:[
 ['Số văn bản đến, đi trong kỳ',30,'Tháng','Excel/CSDL MTTQ',[S('Loại văn bản',[['Văn bản đến',186],['Văn bản đi',142]])]],
 ['Kết quả thực hiện chương trình công tác cơ quan',30,'Quý','Excel/CSDL MTTQ',[S('Kết quả',[['Nội dung đã hoàn thành',24],['Nội dung đang triển khai',6]])]]
 ]}
 ],
 UBND:[
 {id:'ubnd-vhtt',name:'Sở Văn hóa và Thể thao',field:'Văn hóa - Thể thao',desc:'6 chỉ tiêu theo eform của Sở: tiến độ Chương trình 08-CT, dự án đầu tư 2026-2030, hoạt động nghệ thuật và người tham gia, doanh thu đơn vị nghệ thuật, hoạt động nghệ thuật chuyên nghiệp, thông tin báo chí – mạng xã hội. Số liệu giả lập.',types:['Eform'],vhtt:true,items:VHTT_ITEMS},
 {id:'ubnd-gddt',name:'Sở Giáo dục và Đào tạo',field:'Giáo dục',desc:'Tổng quan số liệu toàn ngành và mạng lưới trường học.',types:['API'],sgd:true,
 /* Bộ chỉ tiêu CŨ bên dưới được ẨN bằng cờ SGD_SHOW_LEGACY (sgd-config.js), code giữ nguyên. Mặc định dùng bộ chỉ tiêu
    mới (SGD_ITEMS: Tổng quan + 5 nhóm + 126 phường/xã, form dashboard-sgd.js); đặt SGD_SHOW_LEGACY=true để hiện lại bộ cũ. */
 items:(typeof SGD_SHOW_LEGACY!=='undefined' && !SGD_SHOW_LEGACY && typeof SGD_ITEMS!=='undefined') ? SGD_ITEMS : [
 ['Sở GD&ĐT - Mạng lưới trường học',30,'Tháng','Kết nối API',[S('Quy mô mạng lưới',[['Tổng số trường',2963],['Trường đạt chuẩn quốc gia',1868],['Tổng số lớp học',50523],['Tổng số phòng học',41332]])]],
 ['Sở GD&ĐT - Học sinh',30,'Tháng','Kết nối API',[S('Học sinh toàn ngành',[['Tổng học sinh',1918158],['HS biết bơi',639081],['HS có tật về mắt',492302],['HS diện chính sách',51063]])]],
 ['Sở GD&ĐT - Nhân sự – giáo viên',30,'Tháng','Kết nối API',[S('Nhân sự toàn ngành',[['Tổng giáo viên',144292],['Tổng nhân sự',186401]])]]
 ]},
 /* 10 chỉ tiêu theo 10 eform (NM_ITEMS, nnmt-config.js; bộ cũ STT 17-19, 75, 76, 78, 79, 81-83 đã xóa) + 2 chỉ tiêu số liệu thật không có eform mới
    (GPMB, đất đai — dashboard-nong-nghiep.js), giữ nguyên ở cuối. */
 {id:'ubnd-nnmt',name:'Sở Nông nghiệp và Môi trường (hợp nhất từ Sở NN&PTNT và Sở TN&MT)',field:'Nông nghiệp - Môi trường',desc:'10 chỉ tiêu theo 10 eform của Sở (nông thôn mới, rừng, chương trình mục tiêu quốc gia, khí tượng thủy văn, phòng chống thiên tai, hỗ trợ lương thực, bản đồ viễn thám; số liệu giả lập) và 2 chỉ tiêu số liệu thật: tổng hợp giải phóng mặt bằng, thống kê sử dụng đất đai.',types:['Eform','File'],nm:true,items:[
 ...NM_ITEMS,
 ['Tổng hợp dữ liệu GPMB',14,'Tuần','File'],
 ['Thống kê tình hình sử dụng đất đai (ha)',3,'Năm','File']
 ]},
 /* 4 chỉ tiêu theo 4 eform (SYT_ITEMS, syt-config.js, form dashboard-syt.js); bộ cũ STT 36, 37, 46 đã xóa. */
 {id:'ubnd-yte',name:'Sở Y tế',field:'Y tế',desc:'4 chỉ tiêu theo 4 eform của Sở: ngộ độc thực phẩm và mức độ thiệt hại; tỷ lệ bao phủ bảo hiểm y tế; dịch bệnh nhóm A, B theo Luật Phòng, chống bệnh truyền nhiễm; tỷ lệ người dân có hồ sơ sức khỏe điện tử. Số liệu giả lập.',types:['Eform'],syt:true,items:SYT_ITEMS},
 /* Trung tâm Phục vụ hành chính công Thành phố — bộ chỉ tiêu mới theo 9 API hcc_tkpro (hcc-config.js, form dashboard-hcc.js,
    số giả lập). Ẩn cả lĩnh vực bằng cờ HCC_ENABLED=false (hcc-config.js). */
 ...((typeof HCC_ENABLED!=='undefined' && HCC_ENABLED && typeof HCC_ITEMS!=='undefined') ? [
 {id:'ubnd-hcc',name:'Trung tâm Phục vụ hành chính công Thành phố',field:'Hành chính công',desc:'Tiếp nhận, giải quyết hồ sơ thủ tục hành chính, dịch vụ công trực tuyến, số hóa hồ sơ và mức độ hài lòng của '+HCC_SO.length+' sở, ngành và 126 phường/xã.',types:['API'],hcc:true,items:HCC_ITEMS}
 ] : []),
 {id:'ubnd-taichinh',name:'Sở Tài chính (hợp nhất từ Sở Kế hoạch và Đầu tư và Sở Tài chính)',field:'Tài chính - Ngân sách',desc:'Bộ chỉ tiêu STT 2, 3, 5, 6, 7, 8, 11, 12, 21, 55, 57, 58, 80 theo phụ lục khảo sát chỉ tiêu theo sở.',types:['Excel','CSDL'],stc:true,
 /* Bộ chỉ tiêu CŨ bên dưới được ẨN bằng cờ TC_SHOW_LEGACY (stc-config.js), code giữ nguyên. Mặc định dùng 13 chỉ tiêu mới (STC_ITEMS)
    lấy từ 14 API Sở Tài chính; đặt TC_SHOW_LEGACY=true để hiện lại bộ cũ. */
 items:(typeof TC_SHOW_LEGACY!=='undefined' && !TC_SHOW_LEGACY && typeof STC_ITEMS!=='undefined') ? STC_ITEMS : [
 ['Thu ngân sách nhà nước (tỷ đồng)',36,'Tháng','CSDL',[S('So với dự toán',[['Lũy kế đến kỳ báo cáo',186500],['Dự toán năm',420000]])]],
 ['Thuế, phí, lệ phí và các khoản thu khác NSNN (tỷ đồng)',36,'Tháng','CSDL',[P('Sắc thuế chính',[['Thuế GTGT',52400],['Thuế TNDN',38600],['Thuế TNCN',29800],['Phí, lệ phí và khoản thu khác',21500]])]],
 ['Gạo xuất cấp hỗ trợ các địa phương (tấn)',3200,'Quý','File',[P('Mục đích',[['Cứu đói giáp hạt',1400],['Khắc phục thiên tai',1100],['Hỗ trợ khác',700]])]],
 ['Doanh nghiệp',60,'Tháng','CSDL',[P('Theo phân ngành kinh tế (VSIC)',[['Công nghiệp - Xây dựng',18600],['Thương mại - Dịch vụ',26400],['Nông - Lâm - Thủy sản',3200],['Ngành khác',6000]]),S('Tình hình hoạt động',[['Đang hoạt động',54200],['Thành lập mới',4800],['Quay trở lại hoạt động',1600],['Tạm ngừng kinh doanh',2100],['Chờ giải thể',540],['Đã giải thể',380]])]],
 ['Đấu thầu',2860,'Quý','CSDL',[P('Theo phân ngành kinh tế (VSIC)',[['Xây dựng',1240],['Y tế - Giáo dục',480],['CNTT - Viễn thông',360],['Ngành khác',780]]),S('Kết quả đấu thầu',[['Tổng số gói thầu',2860],['Tổng giá trị trúng thầu (tỷ đồng)',18400],['Tỷ lệ tiết kiệm (%)',8.6]])]],
 ['Hợp tác xã, kinh tế tập thể',1850,'Quý','CSDL',[P('Theo phân ngành kinh tế (VSIC)',[['Nông nghiệp',920],['Công nghiệp - TTCN',380],['Thương mại - Dịch vụ',420],['Ngành khác',130]]),S('Biến động',[['Đang hoạt động',1850],['Thành lập mới',86],['Giải thể',34],['Vốn điều lệ HTX thành lập mới (tỷ đồng)',142]])]],
 ['Vốn đầu tư có yếu tố nước ngoài (triệu USD)',4820,'Tháng','CSDL',[S('Cơ cấu vốn FDI',[['Vốn đầu tư thực hiện',2650],['Vốn đăng ký cấp mới',1680],['Vốn đăng ký điều chỉnh',490],['Góp vốn mua cổ phần',380]]),S('Dự án',[['Số dự án cấp mới',186],['Số lượt dự án điều chỉnh',94]])]],
 ['Dự án đầu tư công',420,'Quý','CSDL',[P('Theo phân ngành kinh tế (VSIC)',[['Giao thông',148],['Giáo dục - Y tế',96],['Hạ tầng đô thị',112],['Ngành khác',64]]),S('Giải ngân',[['Tổng vốn đầu tư (tỷ đồng)',68400],['Tỷ lệ giải ngân so kế hoạch (%)',54.2]])]],
 ['Dự án quan trọng quốc gia, công trình trọng điểm giao thông vận tải',18,'Quý','File',[S('Tiến độ tổng hợp',[['Tổng vốn đầu tư (tỷ đồng)',186000],['Tiến độ giải ngân (%)',42.5],['Tiến độ thi công (%)',58]])]],
 ['Số dự án, số vốn đầu tư bằng nguồn vốn trong nước ngoài ngân sách nhà nước được cấp chủ trương đầu tư',96,'Quý','CSDL',[P('Ngành kinh tế',[['Bất động sản',34],['Công nghiệp',28],['Thương mại - Dịch vụ',22],['Ngành khác',12]])]],
 ['Thu ngân sách nhà nước và cơ cấu thu (tỷ đồng)',36,'Tháng','CSDL',[P('Lĩnh vực thu',[['Thu nội địa',158200],['Thu từ hoạt động xuất nhập khẩu',24600],['Thu viện trợ',1200],['Thu khác',2500]])]],
 ['Chi ngân sách nhà nước và cơ cấu chi (tỷ đồng)',36,'Tháng','CSDL',[P('Khoản chi chủ yếu',[['Chi đầu tư phát triển',58600],['Chi thường xuyên',76400],['Chi trả nợ lãi',7800]])]],
 ['Các thông tin về dân sinh – kinh tế',126,'Quý','File',[S('Chỉ tiêu tổng hợp',[['Dân cư (nghìn người)',8580],['Nhà ở (nghìn căn)',2140],['Đất diện tích trồng trọt (ha)',86500],['Số đầu con trong chăn nuôi (nghìn con)',4250],['Diện tích thủy sản (ha)',24800],['Số hộ thiếu đói',86]])]],
 ['Tình hình thu ngân sách so với dự toán',10,'Quý','CSDL'],
 ['Tổng mức lưu chuyển hàng hóa và doanh thu dịch vụ tiêu dùng xã hội',10,'Quý','CSDL'],
 ['Vốn đầu tư phát triển toàn xã hội thực hiện theo giá hiện hành',10,'Quý','CSDL'],
 ['Vốn đầu tư thực hiện từ nguồn NSNN do địa phương quản lý',10,'Quý','CSDL'],
 ['Chỉ số sản xuất công nghiệp so với cùng kỳ năm trước',10,'Quý','CSDL'],
 ['Tiến độ hoàn thành các dự án trọng điểm',10,'Quý','CSDL'],
 ['Doanh thu vận tải, kho bãi, dịch vụ hỗ trợ vận tải và bưu chính chuyển phát',10,'Quý','CSDL'],
 ['Khách du lịch đến Hà Nội (do cơ sở lưu trú phục vụ)',10,'Quý','CSDL'],
 ['Kim ngạch xuất nhập khẩu',10,'Quý','CSDL'],
 ['Chỉ số giá tiêu dùng, giá vàng, đô la Mỹ',10,'Quý','CSDL'],
 ['Tình hình chi ngân sách địa phương',10,'Quý','CSDL']
 ]},
 /* 4 chỉ tiêu theo 2 eform (SNV_ITEMS, snv-config.js; bộ cũ STT 42, 47, 53 đã xóa) + 5 chỉ tiêu số liệu thật không có eform mới
    (tuyển dụng, chi trả người có công, CCVC 2025 — dashboard-noi-vu.js), giữ nguyên ở cuối. */
 {id:'ubnd-noivu',name:'Sở Nội vụ (hợp nhất từ Sở Nội vụ và Sở Lao động - Thương binh và Xã hội)',field:'Nội vụ',desc:'4 chỉ tiêu theo 2 eform của Sở (bảo hiểm xã hội, y tế, thất nghiệp; lao động, việc làm; biên chế công chức, viên chức cấp xã; cán bộ chuyển đổi số và chữ ký số; số liệu giả lập) và 5 chỉ tiêu số liệu thật: tuyển dụng, tìm việc, chi trả an sinh cho người có công, công chức, viên chức khối chính quyền.',types:['Eform','File'],snv:true,items:[
 ...SNV_ITEMS,
 ['Doanh nghiệp tham gia tuyển dụng',64,'Quý','File'],
 ['Tổng số nhu cầu tuyển dụng',443,'Quý','File'],
 ['Số hồ sơ tìm việc',652,'Quý','File'],
 ['Tổng số chi trả an sinh cho người có công',1,'Tháng','File'],
 ['Tổng số CCVC khối chính quyền',20,'Năm','File']
 ]},
 {id:'ubnd-tuphap',name:'Sở Tư pháp',field:'Tư pháp',desc:'Theo phụ lục khảo sát chỉ tiêu theo sở, Sở Tư pháp hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.',types:[],items:[],noItems:true},
 {id:'ubnd-congthuong',name:'Sở Công Thương',field:'Công Thương',desc:'5 chỉ tiêu theo 5 eform của Sở: xuất khẩu, nhập khẩu; tổng mức bán lẻ hàng hóa và doanh thu dịch vụ tiêu dùng; thương mại điện tử; điện năng, xăng dầu, than; chỉ số sản xuất công nghiệp. Số liệu giả lập.',types:['Eform'],sct:true,items:SCT_ITEMS},
 {id:'ubnd-xaydung',name:'Sở Xây dựng',field:'Xây dựng',desc:'4 chỉ tiêu theo 4 eform của Sở: nhà ở; vận tải hành khách của các đơn vị vận tải; điểm nguy cơ sạt lở, úng ngập trên tuyến đường; khối lượng vận chuyển, luân chuyển hành khách và hàng hóa. Số liệu giả lập.',types:['Eform'],sxd:true,items:SXD_ITEMS},
 {id:'ubnd-khcn',name:'Sở Khoa học và Công nghệ (hợp nhất từ Sở TT&TT và Sở KH&CN)',field:'Khoa học - Công nghệ',desc:'3 chỉ tiêu chuyển đổi số cấp phường/xã theo 3 eform của Sở: hạ tầng và thiết bị số; con người và cộng đồng số; văn bản, quy trình và dịch vụ công. Số liệu giả lập.',types:['Eform'],khcn:true,items:KHCN_ITEMS},
 {id:'ubnd-dantoc-tongiao',name:'Sở Dân tộc và Tôn giáo',field:'Dân tộc - Tôn giáo',desc:'4 chỉ tiêu theo eform Chương trình mục tiêu quốc gia phát triển KT-XH vùng đồng bào dân tộc thiểu số và miền núi: giải ngân vốn, tiến độ thực hiện dự án, kết quả đối với vùng đồng bào DTTS, tình hình báo cáo và đối soát dữ liệu. Số liệu giả lập.',types:['Eform'],dttg:true,items:DTTG_ITEMS},
 {id:'ubnd-dulich',name:'Sở Du lịch',field:'Du lịch',desc:'2 chỉ tiêu theo eform của Sở: khách du lịch nội địa và quốc tế, doanh thu dịch vụ du lịch. Số liệu giả lập.',types:['Eform'],dl:true,items:DL_ITEMS},
 {id:'ubnd-quyhoach-kientruc',name:'Sở Quy hoạch - Kiến trúc',field:'Quy hoạch - Kiến trúc',desc:'Theo phụ lục khảo sát chỉ tiêu theo sở, Sở Quy hoạch - Kiến trúc hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.',types:[],items:[],noItems:true},
 {id:'ubnd-so14',name:'Sở/đơn vị chuyên môn thứ 14 (PMO xác nhận theo danh mục chính thức)',field:'',desc:'Theo phụ lục khảo sát chỉ tiêu theo sở, đơn vị này hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.',types:[],items:[],noItems:true},
 {id:'ubnd-thanhtra',name:'Thanh tra Thành phố',field:'Thanh tra',desc:'3 chỉ tiêu theo 3 eform của Thanh tra Thành phố: kiểm tra trách nhiệm Chủ tịch UBND xã, phường và người đứng đầu trong thực hiện pháp luật; thanh tra; tiếp công dân, giải quyết khiếu nại, tố cáo. Số liệu giả lập.',types:['Eform'],ttra:true,items:TTRA_ITEMS},
 {id:'ubnd-vpubnd',name:'Văn phòng UBND Thành phố Hà Nội',field:'Văn phòng UBND',desc:'5 chỉ tiêu theo eform của Văn phòng: văn bản, hồ sơ xử lý trên môi trường mạng, triển khai trợ lý ảo, nhiệm vụ Chính phủ và Thủ tướng Chính phủ giao, hồ sơ thủ tục hành chính, hạ tầng công nghệ thông tin. Số liệu giả lập.',types:['Eform'],vpub:true,items:VPUB_ITEMS},
 {id:'ubnd-bqlkcnc',name:'Ban Quản lý Khu công nghệ cao và khu công nghiệp thành phố',field:'Khu công nghệ cao - KCN',desc:'3 chỉ tiêu theo eform "Khu công nghiệp, khu chế xuất, khu kinh tế và Khu Công nghệ cao" của Ban: doanh nghiệp, vốn đầu tư đăng ký và lao động; thu hút đầu tư, thành lập và điều chỉnh; đầu tư hạ tầng, sản xuất kinh doanh và bảo vệ môi trường. Số liệu giả lập.',types:['Eform'],bql:true,items:BQL_ITEMS}
 ]
 };
 /* Sắp xếp sở theo bộ máy mới (anh yêu cầu 15/10/2026): Sở Du lịch nhập vào Sở Văn hóa và Thể thao thành "Sở Văn hóa,
 Thể thao và Du lịch" (2 chỉ tiêu du lịch gộp vào thẻ, chi tiết của sở này — ctm-so.js); Sở Quy hoạch - Kiến trúc không
 còn nên ẩn thẻ. Khai báo 2 sở cũ ở trên GIỮ NGUYÊN; đặt UBND_SAP_XEP_SO_2026 = false là hiện lại như cũ. */
 const UBND_SAP_XEP_SO_2026 = true;
 const UBND_SO_DA_NHAP = ['ubnd-dulich','ubnd-quyhoach-kientruc'];
 if(UBND_SAP_XEP_SO_2026){
 const vh=categorySeed.UBND.find(c=>c.id==='ubnd-vhtt');
 if(vh) Object.assign(vh,{name:'Sở Văn hóa, Thể thao và Du lịch',field:'Văn hóa - Thể thao - Du lịch',
 desc:'8 chỉ tiêu theo eform của Sở: tiến độ Chương trình 08-CT, dự án đầu tư 2026-2030, hoạt động nghệ thuật và người tham gia, doanh thu đơn vị nghệ thuật, hoạt động nghệ thuật chuyên nghiệp, thông tin báo chí – mạng xã hội, khách du lịch nội địa và quốc tế, doanh thu dịch vụ du lịch. Số liệu giả lập.',
 items:VHTT_ITEMS.concat(DL_ITEMS)});
 categorySeed.UBND=categorySeed.UBND.filter(c=>!UBND_SO_DA_NHAP.includes(c.id));
 }
 /* Bốn trục cấp Thành phố theo eform (chốt 28/10/2026, docs/BAN_DOC_EFORM/TRUC_*): chỉ dựng đơn vị có eform, chỉ tiêu ở
 js/features/ctm-truc-eform.js. Đảng: 4 Ban giữ mã cũ, chỉ tiêu cũ thay bằng eform (giữ ở itemsCu); VPTU · Theo dõi nhiệm vụ ẩn.
 HĐND, MTTQ: mỗi eform một đơn vị (ef:true — không phải phòng/ban, không vào cây tổ chức); mọi đơn vị cũ ẩn (an:true).
 Ẩn chứ không xóa: tài khoản ban cũ vẫn đăng nhập được và xem cả trục. Đặt TRUC_AN_DON_VI_CU = false là về như cũ. */
 const TRUC_AN_DON_VI_CU = true;
 function efTrucCat(id,name,field,efs,desc){return {id,name,field,desc,types:['Eform'],ef:true,items:efs.map(e=>['Eform «'+e+'»',0,'Tháng/Quý/Năm','Eform',[]])};}
 if(TRUC_AN_DON_VI_CU){
 categorySeed.DANG.forEach(c=>{ if(c.id==='dang-vptu') c.an=true; });
 categorySeed.HDND.forEach(c=>{ c.an=true; });
 categorySeed.MTTQ.forEach(c=>{ c.an=true; });
 const DANG_EF={'dang-ubkt':['UBKT Thành ủy Hà Nội - Kiểm tra giám sát tổng hợp'],'dang-to-chuc':['Đánh giá cán bộ','Công tác chính trị nội bộ','Cơ cấu tổ chức Đảng','Biến động Đảng viên','Biên chế & CBCCVC khối Đảng'],'dang-tuyen-giao':['Ban Tuyên giáo và Dân vận Thành ủy'],'dang-noi-chinh':['Ban Nội chính Thành ủy']};
 categorySeed.DANG.forEach(c=>{ const e=DANG_EF[c.id]; if(!e) return; c.itemsCu=c.items; c.items=efTrucCat(c.id,'','',e,'').items; c.types=['Eform'];
 c.desc=e.length>1?e.length+' eform: '+e.join(', ')+'.':'Eform «'+e[0]+'».'; });
 categorySeed.HDND.push(
 efTrucCat('hdnd-ef1','Tiếp xúc cử tri và kiến nghị cử tri','HĐND',['Danh sách tiếp xúc cử tri và kiến nghị cử tri'],'Cuộc tiếp xúc cử tri, kiến nghị theo lĩnh vực, chuyển xử lý, trả lời, giải quyết dứt điểm.'),
 efTrucCat('hdnd-ef2','Theo dõi nhiệm vụ HĐND','HĐND',['Theo dõi nhiệm vụ Hội đồng nhân dân'],'Nhiệm vụ theo khối, đơn vị, tình trạng nhận và thực hiện.'),
 efTrucCat('hdnd-ef3','Giám sát, chất vấn và giải trình','HĐND',['Giám sát, chất vấn và giải trình HĐND'],'Hoạt động giám sát, chất vấn, giải trình và kiến nghị sau giám sát.'),
 efTrucCat('hdnd-ef4','Hoạt động Thường trực, Ban và Tổ đại biểu','HĐND',['Danh sách hoạt động Thường trực, Ban và Tổ đại biểu HĐND'],'Hoạt động theo loại, đơn vị thực hiện, kiến nghị và trạng thái tiếp thu.'),
 efTrucCat('hdnd-ef5','Kỳ họp và Nghị quyết','HĐND',['Kỳ họp và Nghị quyết Hội đồng nhân dân'],'Kỳ họp, nghị quyết theo lĩnh vực, ban hành đúng hạn, quá hạn.'),
 efTrucCat('hdnd-ef6','Chỉ số tổng hợp và kế hoạch hoạt động','HĐND',['Danh sách chỉ số tổng hợp và kế hoạch hoạt động'],'Tiêu chí hiệu quả, khảo sát hài lòng của cử tri, kiến nghị, kế hoạch năm.'));
 categorySeed.MTTQ.push(
 efTrucCat('mttq-ef1','Theo dõi nhiệm vụ - Khối Mặt trận Tổ quốc','MTTQ',['Theo dõi nhiệm vụ - Khối Mặt trận Tổ quốc'],'Nhiệm vụ theo khối, trạng thái giao, nhận, thực hiện.'),
 efTrucCat('mttq-ef2','Vận động thu Quỹ "Vì người nghèo"','MTTQ',['Tình hình vận động thu quỹ "Vì người nghèo"'],'Số tiền ủng hộ theo hình thức, nguồn; chỉ tiêu giao, tổng vận động của từng đơn vị.'),
 efTrucCat('mttq-ef3','Ủng hộ Quỹ "Vì biển, đảo Việt Nam"','MTTQ',['Thống kê ủng hộ quỹ vì biển đảo Việt Nam'],'Số đã vận động, đã chuyển về Quỹ Thành phố, còn phải chuyển theo đợt, cấp đơn vị.'),
 efTrucCat('mttq-ef4','Thu chi Quỹ "Vì người nghèo" (QĐ4795)','MTTQ',['MTTQ eForm QĐ4795 Thu chi quỹ Vì người nghèo'],'Tồn quỹ, các khoản thu, chi, kết quả hỗ trợ theo địa bàn.'),
 efTrucCat('mttq-ef5','Quà Tết theo cấp','MTTQ',['Cơ cấu kết quả vận động các nguồn lực hỗ trợ tặng quà Tết theo cấp'],'Đối tượng, hồ sơ theo nhóm nguồn lực theo cấp và đạt điều kiện.'),
 efTrucCat('mttq-ef6','Quà Tết theo nguồn quỹ','MTTQ',['Cơ cấu kết quả hỗ trợ tặng quà Tết theo nguồn quỹ'],'Đối tượng, hồ sơ theo nhóm nguồn quỹ và đạt điều kiện.'));
 const vp=categorySeed.UBND.find(c=>c.id==='ubnd-vpubnd');
 if(vp) vp.desc='9 eform của Văn phòng: chỉ số 27, 29, 52, 74, hạ tầng CNTT (sheet VP UBND) và 4 eform chỉ có ở sheet "Trục UBND": văn bản trên môi trường mạng, cắt giảm quy định, cuộc họp không giấy tờ, chữ ký số.';
 }

 /* Chỉ tiêu "Theo dõi nhiệm vụ"/tổng hợp xã-phường là số liệu gộp của cả trục, không đại diện cho 1 phòng/ban
 cụ thể — loại khỏi cây "Cơ cấu tổ chức" và màn chọn tài khoản phòng/ban cấp Thành phố. */
 const CITY_OFFICE_EXCLUDE_IDS = ['dang-vptu','hdnd-nhiem-vu','hdnd-xa-phuong','mttq-nhiem-vu','mttq-xa-phuong'];
 function cityOfficeList(role){ return (categorySeed[role]||[]).filter(c=>!c.ef&&!CITY_OFFICE_EXCLUDE_IDS.includes(c.id)); }
 /* Tìm phòng/ban cấp Thành phố theo id, dùng cho đăng nhập tài khoản phòng/ban (ban-<officeId>) — chỉ tìm trong
 Đảng ủy/HĐND/MTTQ vì UBND đã có cơ chế tài khoản Sở/ngành riêng (so-<soId>). */
 function findOfficeCategory(officeId){
 for(const role of ['DANG','HDND','MTTQ']){
 const cat=cityOfficeList(role).find(c=>c.id===officeId);
 if(cat) return {role,cat};
 }
 for(const role of ['TW_CTN','TW_DANG','TW_QH','TW_CP','TW_MTTQ']){
 const cat=(TW_OFFICE_CATEGORIES_BY_ROLE[role]||[]).find(c=>c.id===officeId);
 if(cat) return {role,cat};
 }
 return null;
 }
 /* Tìm đúng node trong TW_ORG_TREE[role] khớp officeId, duyệt đệ quy qua children() thật (giống twCollectIds) —
 dùng để biết 1 tài khoản cấp Trung ương đăng nhập trực tiếp vào 1 office (currentOfficeId) có phải "cấp trên"
 (còn đơn vị con bên trong) hay không, phục vụ scopedSingleCategory() gộp chỉ tiêu cấp dưới bên dưới. */
 function findTwNode(role,officeId,nodes){
 nodes=nodes||TW_ORG_TREE[role]||[];
 for(const n of nodes){
 if(n.officeId===officeId) return n;
 if(typeof n.children==='function'){ const found=findTwNode(role,officeId,n.children()); if(found) return found; }
 }
 return null;
 }
 /* Phạm vi officeId đang xem khi tài khoản cấp Trung ương scoped thẳng vào 1 đơn vị (currentOfficeId) — dùng
 để lọc đúng records[] theo đơn vị đang xem trong widget "VĂN BẢN/NHIỆM VỤ THEO TRỤC" (xem renderAxisDashboard),
 tránh tình trạng đổi đơn vị xem nhưng số liệu/bấm xem chi tiết vẫn luôn ra nguyên cả trục. Có con (VD "Ban Tổ
 chức Trung ương") thì gộp cả cây con, không có con (VD 1 Vụ/Phòng cụ thể) thì chỉ đúng 1 id đó. */
 function twOfficeScope(){
 if(!isTwRole(currentRole) || !currentOfficeId) return null;
 const node=findTwNode(currentRole,currentOfficeId);
 const ids = node && typeof node.children==='function' ? twCollectIds(node,[]) : [currentOfficeId];
 const title = node ? node.label : (findOfficeCategory(currentOfficeId)?.cat.name || currentOfficeId);
 return {ids, title};
 }
 /* Khi đang đăng nhập/xem theo đúng 1 Sở (currentSoId) hoặc đúng 1 phòng/ban (currentOfficeId), trả về đúng
 1 category đó để dashboard chỉ hiện chỉ tiêu riêng của đơn vị này — dùng chung cho cả cấp Thành phố lẫn cấp
 xã/phường vì categorySeedForRole tự chuyển sang bộ *_XA_CATEGORIES khi currentXaId đã được set.
 Riêng cấp Trung ương: nếu tài khoản đang đăng nhập đúng vào 1 office mà office đó còn đơn vị con bên trong
 (VD "Ban Tổ chức Trung ương" -> 9 Vụ + 2 Cục + 1 Văn phòng ban, hay 1 Cục -> 3 phòng), GỘP LUÔN chỉ tiêu của
 mọi đơn vị con/cháu vào items — "cấp trên phải quản lý được cấp dưới", đúng tinh thần tab "Tất cả" của tài
 khoản Thành ủy gộp cả 4 trục (xem twCategoryTabs() dùng chung 1 nguyên tắc, nhưng đó là cho account xem theo
 TAB, còn đây là cho account đăng nhập SCOPED thẳng vào 1 office cụ thể — 2 luồng UI khác nhau nên phải xử lý
 riêng cả 2 chỗ). */
 function scopedSingleCategory(){
 if(currentSoId){ const cat=(categorySeed.UBND||[]).find(c=>c.id===currentSoId); return cat?{...cat,role:'UBND'}:null; }
 if(currentOfficeId){
 const allCats=categorySeedForRole(currentRole);
 const cat=allCats.find(c=>c.id===currentOfficeId);
 if(!cat) return null;
 if(isTwRole(currentRole)){
 const node=findTwNode(currentRole,currentOfficeId);
 if(node && typeof node.children==='function'){
 const ids=twCollectIds(node,[]);
 const mergedItems=ids.flatMap(id=>{ const c=allCats.find(x=>x.id===id); return c?c.items:[]; });
 return {...cat,items:mergedItems,role:currentRole};
 }
 }
 return {...cat,role:currentRole};
 }
 return null;
 }

 const taskTitlePool = {
 DANG:['Rà soát, tổng hợp nhiệm vụ thực hiện Nghị quyết 57-NQ/TW','Tổng hợp số liệu công tác cán bộ, Đảng viên (Ban Tổ chức)','Tổng hợp kết quả kiểm tra - giám sát (UBKT Thành ủy)','Xử lý đơn thư, tiếp công dân (Ban Nội chính)','Tổng hợp dư luận xã hội, mô hình dân vận khéo (Ban Tuyên giáo)','Chuẩn bị nội dung giao ban Thường trực Thành ủy'],
 HDND:['Theo dõi tiến độ thực hiện nghị quyết HĐND Thành phố','Tổng hợp kết quả giám sát chuyên đề','Giải quyết kiến nghị cử tri','Chuẩn bị nội dung kỳ họp HĐND Thành phố','Rà soát báo cáo chất vấn, trả lời chất vấn','Theo dõi các dự án, công trình trọng điểm'],
 UBND:['Tổng hợp số liệu ngành Giáo dục và Đào tạo','Tổng hợp số liệu Nông nghiệp và Môi trường (GPMB, AQI)','Tổng hợp tình hình dịch bệnh, khám chữa bệnh (Sở Y tế)','Xử lý hồ sơ tại Trung tâm Phục vụ hành chính công','Tổng hợp chỉ số kinh tế - tài chính - ngân sách (Sở Tài chính)','Tổng hợp số liệu tổ chức - biên chế (Sở Nội vụ)','Điều phối, giao ban khối chính quyền'],
 MTTQ:['Tổng hợp phản biện xã hội, giám sát cộng đồng','Theo dõi thu chi Quỹ "Vì người nghèo"','Tổng hợp vận động Quỹ "Vì biển, đảo Việt Nam"','Tổng hợp kết quả hỗ trợ, tặng quà Tết','Theo dõi hoạt động Đoàn Thanh niên, Hội Phụ nữ, CCB, Công đoàn','Tổng hợp ý kiến nhân dân qua các đợt khảo sát IOC'],
 TW_CTN:['Rà soát, tổng hợp hồ sơ đặc xá, ân giảm','Chuẩn bị nội dung lễ tân, đối ngoại Nhà nước','Tổng hợp hồ sơ khen thưởng cấp Nhà nước','Xử lý đơn thư công dân gửi Chủ tịch nước','Chuẩn bị nội dung trình Chủ tịch nước ký ban hành','Theo dõi công tác quốc phòng - an ninh theo thẩm quyền'],
 TW_DANG:['Tổng hợp công tác tổ chức cán bộ toàn ngành','Tổng hợp kết quả đào tạo, bồi dưỡng cán bộ','Thẩm định chính trị nội bộ cán bộ diện quản lý','Tổng hợp báo cáo công tác tổ chức xây dựng Đảng địa phương','Chuẩn bị nội dung giao ban Lãnh đạo Ban','Theo dõi tiến độ đề án, chương trình công tác của Ban'],
 TW_QH:['Chuẩn bị nội dung phiên họp Ủy ban Thường vụ Quốc hội','Tổng hợp ý kiến thẩm tra dự án luật','Theo dõi việc giải quyết kiến nghị cử tri','Tổng hợp báo cáo giám sát chuyên đề','Chuẩn bị tài liệu kỳ họp Quốc hội','Rà soát tiến độ xây dựng pháp luật'],
 TW_CP:['Theo dõi, đôn đốc nhiệm vụ Chính phủ, Thủ tướng giao','Tổng hợp tình hình xây dựng nghị định, quyết định','Chuẩn bị nội dung phiên họp Chính phủ thường kỳ','Rà soát thủ tục hành chính cắt giảm, đơn giản hóa','Tổng hợp báo cáo kinh tế - xã hội định kỳ','Theo dõi tiến độ dự án đầu tư công trọng điểm'],
 TW_MTTQ:['Tổng hợp chương trình giám sát, phản biện xã hội','Theo dõi vận động Quỹ "Vì người nghèo" Trung ương','Tổng hợp ý kiến, kiến nghị cử tri toàn quốc','Chuẩn bị nội dung hội nghị Ủy ban Trung ương MTTQ','Theo dõi hoạt động các tổ chức chính trị - xã hội thành viên','Tổng hợp kết quả hiệp thương, phối hợp thống nhất hành động']
 };
 const fieldPool = {
 DANG:['Điều hành – chỉ đạo','Tổ chức cán bộ (Ban Tổ chức)','Kiểm tra – giám sát (UBKT)','Nội chính – tiếp công dân','Tuyên giáo – dân vận','Nghị quyết 57-NQ/TW','Văn bản điều hành','Cháy nổ','An toàn thực phẩm','Trật tự đô thị','Vệ sinh môi trường','Úng ngập đô thị','Văn hóa - thể thao - du lịch','Giáo dục đào tạo','Nông nghiệp','Y tế','Tài chính','Nội vụ','Tư pháp','Công thương','Xây dựng','Khoa học công nghệ','Dân tộc tôn giáo','Khu công nghiệp'],
 HDND:['Điều hành kỳ họp','Theo dõi nghị quyết','Giám sát chuyên đề','Cử tri – kiến nghị','Cháy nổ','An toàn thực phẩm','Trật tự đô thị','Vệ sinh môi trường','Úng ngập đô thị','Văn hóa - thể thao - du lịch','Giáo dục đào tạo','Nông nghiệp','Y tế','Tài chính','Nội vụ','Tư pháp','Công thương','Xây dựng','Khoa học công nghệ','Dân tộc tôn giáo','Khu công nghiệp'],
 UBND:['Giáo dục và Đào tạo','Nông nghiệp và Môi trường','Y tế','Hành chính công','Tài chính – ngân sách','Nội vụ','Kinh tế – xã hội','Văn bản điều hành','Cháy nổ','An toàn thực phẩm','Trật tự đô thị','Vệ sinh môi trường','Úng ngập đô thị','Văn hóa - thể thao - du lịch','Giáo dục đào tạo','Nông nghiệp','Tài chính','Tư pháp','Công thương','Xây dựng','Khoa học công nghệ','Dân tộc tôn giáo','Khu công nghiệp'],
 MTTQ:['Phản biện xã hội','Quỹ vì người nghèo','Quỹ biển đảo','Tặng quà Tết','Đoàn thể chính trị - xã hội','Cháy nổ','An toàn thực phẩm','Trật tự đô thị','Vệ sinh môi trường','Úng ngập đô thị','Văn hóa - thể thao - du lịch','Giáo dục đào tạo','Nông nghiệp','Y tế','Tài chính','Nội vụ','Tư pháp','Công thương','Xây dựng','Khoa học công nghệ','Dân tộc tôn giáo','Khu công nghiệp'],
 TW_CTN:['Đặc xá - ân giảm','Khen thưởng Nhà nước','Đối ngoại - lễ tân','Đơn thư công dân','Quốc phòng, an ninh quốc gia','Văn bản trình ký'],
 TW_DANG:['Tổ chức - cán bộ','Đào tạo bồi dưỡng','Bảo vệ chính trị nội bộ','Kiểm tra giám sát','Văn phòng ban','Công tác đảng vụ'],
 TW_QH:['Xây dựng pháp luật','Giám sát tối cao','Kiến nghị cử tri','Ngân sách nhà nước','Đối ngoại Quốc hội','Kỳ họp Quốc hội'],
 TW_CP:['Chỉ đạo điều hành','Cải cách hành chính','Đầu tư công','Kinh tế - xã hội','Xây dựng thể chế','Chính quyền địa phương'],
 TW_MTTQ:['Giám sát - phản biện','Vận động quỹ xã hội','Công tác dân tộc - tôn giáo','Đoàn thể chính trị - xã hội','Hiệp thương phối hợp','Kiến nghị cử tri']
 };
 const units = ['Văn phòng Thành ủy','Ban Tổ chức Thành ủy','Ủy ban Kiểm tra Thành ủy','Ban Nội chính Thành ủy','Ban Tuyên giáo và Dân vận Thành ủy','Văn phòng HĐND Thành phố','Văn phòng UBND Thành phố','Sở Giáo dục và Đào tạo','Sở Nông nghiệp và Môi trường','Sở Y tế','Trung tâm Phục vụ hành chính công Thành phố','Sở Tài chính','Sở Nội vụ','Ủy ban MTTQ Việt Nam Thành phố'];
 /* Đơn vị phối hợp/giao-nhận dùng riêng khi sinh dữ liệu demo cho cấp Trung ương — dùng "units" (toàn đơn vị Hà Nội)
 cho 1 hồ sơ của Chủ tịch nước/Quốc hội/Chính phủ sẽ sai ngữ cảnh. */
 const twUnits = ['Văn phòng Trung ương Đảng','Ban Tổ chức Trung ương','Ủy ban Kiểm tra Trung ương','Văn phòng Chủ tịch nước','Văn phòng Quốc hội','Văn phòng Chính phủ','Bộ Nội vụ','Bộ Ngoại giao','Ủy ban Trung ương MTTQ Việt Nam','Ban Tuyên giáo và Dân vận Trung ương'];
 const docTypeOptions = ['Công văn','Đơn thư','Tường trình','Quyết định','Thông báo','Cảnh cáo'];
 const docTypeCodePrefix = {'Công văn':'CV','Đơn thư':'DT','Tường trình':'TT','Quyết định':'QD','Thông báo':'TB','Cảnh cáo':'CB'};
 const docSignerPool = {
 DANG:['Nguyễn Văn Phong','Trần Thị Hạnh'],
 HDND:['Trần Thị Hạnh','Nguyễn Văn Phong'],
 UBND:['Nguyễn Văn Phong','Trần Thị Hạnh','Nguyễn Đình Trường'],
 MTTQ:['Trần Thị Hạnh','Nguyễn Đình Trường'],
 TW_CTN:['Nguyễn Văn Toàn','Trần Thị Mai'],
 TW_DANG:['Phạm Đình Quang','Lê Thị Hương'],
 TW_QH:['Vũ Đức Thắng','Ngô Thị Lan'],
 TW_CP:['Đặng Văn Hùng','Bùi Thị Ngọc'],
 TW_MTTQ:['Hoàng Văn Nam','Đỗ Thị Thu']
 };
 const docTopicPhrases =['đôn đốc tiến độ thực hiện','hướng dẫn triển khai','phê duyệt kế hoạch','kiện toàn tổ chức','thông báo kết luận giao ban','tổng hợp báo cáo kết quả','xử lý phản ánh, kiến nghị','rà soát, cập nhật số liệu','chỉ đạo tăng cường công tác','thành lập tổ công tác','ban hành quy định tạm thời','sơ kết, tổng kết công tác','phối hợp thực hiện nhiệm vụ','khảo sát, đánh giá hiện trạng'];
 /* Sinh nội dung 1 văn bản (số/ký hiệu, tiêu đề, trích yếu, người ký, cơ quan...) theo mẫu thực tế, biến thiên theo lĩnh vực/trục — deterministic (không Math.random) để demo ổn định. */
 function buildDocumentContent(role,idx){
 const docType=pick(docTypeOptions,idx);
 const fieldName=pick(fieldPool[role],idx+3);
 const topic=pick(docTopicPhrases,idx);
 const signer=pick(docSignerPool[role],idx);
 const issuer=(!isTwRole(role)&&/an ninh|trật tự|pccc/i.test(fieldName))?'Công an Thành phố Hà Nội':roleMeta(role).fullName;
 const code=`${docTypeCodePrefix[docType]}-2026-${String(idx+1).padStart(3,'0')}`;
 const title=`${docType} ${topic} thuộc lĩnh vực ${fieldName}`;
 const summary=`V/v ${topic} lĩnh vực ${fieldName.toLowerCase()} ${isTwRole(role)?'cấp Trung ương':'tại Thành phố Hà Nội'}`;
 return {code,title,summary,signer,issuer,docType,field:fieldName};
 }

 /* Kịch bản xử lý dùng chung cho hồ sơ/nhiệm vụ và chỉ tiêu */
 const DEFAULT_SCENARIOS = {
 overdue:{title:'Kịch bản xử lý quá hạn',level:'Khẩn',desc:'Dùng khi nhiệm vụ/văn bản/chỉ tiêu đã quá hạn hoặc chưa có kết quả trong thời gian cam kết.',
 objective:'Phát hiện, cảnh báo và xử lý dứt điểm các nhiệm vụ/văn bản/chỉ tiêu đã quá hạn cam kết, đảm bảo có kết quả và trách nhiệm rõ ràng.',
 scope:'Áp dụng cho toàn bộ nhiệm vụ, văn bản, chỉ tiêu do các đơn vị thuộc phường Việt Hưng chủ trì hoặc phối hợp xử lý, khi đã vượt hạn xử lý trên hệ thống IOC.',
 process:[{step:'Thu thập & đồng bộ dữ liệu',desc:'Hệ thống tự động quét trạng thái, hạn xử lý của nhiệm vụ/văn bản/chỉ tiêu từ các nguồn kết nối IOC.'},{step:'Phân tích, đối chiếu, phát hiện bất thường',desc:'So sánh hạn xử lý với thời điểm hiện tại để xác định các hồ sơ đã quá hạn, xác minh nguyên nhân và đơn vị phụ trách.'},{step:'Cảnh báo',desc:'Gửi cảnh báo tới đơn vị chủ trì và lãnh đạo phụ trách ngay khi phát hiện quá hạn.'},{step:'Đề xuất phương án xử lý',desc:'Yêu cầu đơn vị chủ trì báo cáo tiến độ, đề xuất mốc hoàn thành mới và giao nhiệm vụ nhánh cụ thể.'},{step:'Theo dõi kết quả & báo cáo',desc:'Theo dõi đến khi có đủ minh chứng xử lý, cập nhật trạng thái và tổng hợp báo cáo lãnh đạo.'}],
 expectedResults:['Rút ngắn thời gian phát hiện và xử lý hồ sơ quá hạn','Xác định rõ trách nhiệm đơn vị chủ trì','Giảm tồn đọng nhiệm vụ/văn bản quá hạn theo thời gian'],
 leadUnit:'Văn phòng UBND phường',coordUnits:['Văn phòng Đảng ủy','Công chức Văn phòng - Thống kê','Trực IOC/CAD'],
 sla:['15 phút xác nhận','Trong ngày có phương án','24h báo cáo kết quả'],tasks:[['Xác minh nguyên nhân quá hạn','Rà soát hồ sơ, xác định nút nghẽn, người phụ trách và thời điểm bắt đầu quá hạn.','Văn phòng UBND'],['Yêu cầu đơn vị chủ trì cập nhật tiến độ','Gửi nhắc việc, yêu cầu nêu rõ kết quả đã làm, khó khăn và thời hạn hoàn thành mới.','Công chức Văn phòng - Thống kê'],['Báo cáo lãnh đạo phụ trách','Tổng hợp tình trạng quá hạn và đề xuất chỉ đạo/đôn đốc.','Văn phòng Đảng ủy'],['Cập nhật minh chứng xử lý','Đính kèm văn bản, file dữ liệu, ảnh hiện trường hoặc biên bản làm việc.','Đơn vị chuyên môn'],['Đóng vòng xử lý sau khi có kết quả','Kiểm tra đủ minh chứng, cập nhật trạng thái và ghi nhật ký kết thúc.','Trực IOC/CAD']]},
 slow:{title:'Kịch bản chậm tiến độ / nguy cơ trễ hạn',level:'Cao',desc:'Dùng khi nhiệm vụ chưa quá hạn nhưng tiến độ thấp, thiếu minh chứng hoặc có cảnh báo nguy cơ không hoàn thành.',
 objective:'Phát hiện sớm các nhiệm vụ có tiến độ thấp hoặc nguy cơ không hoàn thành đúng hạn để can thiệp trước khi phát sinh quá hạn.',
 scope:'Áp dụng cho nhiệm vụ, chỉ tiêu chưa quá hạn nhưng có tiến độ dưới ngưỡng an toàn hoặc thiếu minh chứng cập nhật trong khoảng thời gian quy định.',
 process:[{step:'Thu thập & đồng bộ dữ liệu',desc:'Đồng bộ tiến độ và thời hạn còn lại của từng nhiệm vụ/chỉ tiêu theo thời gian thực.'},{step:'Phân tích, đối chiếu, phát hiện bất thường',desc:'So sánh tiến độ thực tế với tiến độ kỳ vọng theo mốc thời gian để xác định nguy cơ trễ hạn.'},{step:'Cảnh báo',desc:'Cảnh báo sớm cho đơn vị chủ trì và cán bộ tổng hợp IOC khi tiến độ dưới ngưỡng an toàn.'},{step:'Đề xuất phương án xử lý',desc:'Chia nhỏ phần việc còn lại, bổ sung đơn vị phối hợp hoặc điều chỉnh nguồn lực xử lý.'},{step:'Theo dõi kết quả & báo cáo',desc:'Thiết lập mốc nhắc tự động, theo dõi đến khi tiến độ trở lại an toàn hoặc hoàn thành đúng hạn.'}],
 expectedResults:['Giảm số nhiệm vụ chuyển từ nguy cơ sang quá hạn thực tế','Tăng tỷ lệ hoàn thành đúng hạn cam kết','Phát hiện sớm vướng mắc để bổ sung nguồn lực kịp thời'],
 leadUnit:'Đơn vị chủ trì nhiệm vụ',coordUnits:['Cán bộ tổng hợp IOC','Lãnh đạo phụ trách','Trực IOC/CAD'],
 sla:['30 phút nhắc việc','4h cập nhật tiến độ','Trước hạn có kết quả'],tasks:[['Đánh giá lại tiến độ thực tế','Đối chiếu phần việc đã hoàn thành với thời hạn và sản phẩm đầu ra.','Đơn vị chủ trì'],['Chia nhỏ phần việc còn lại','Tách thành các nhiệm vụ nhánh rõ tên việc, chủ trì, hạn xử lý và minh chứng.','Cán bộ tổng hợp IOC'],['Bổ sung đơn vị phối hợp','Giao thêm đơn vị hỗ trợ nếu vướng dữ liệu, nhân lực hoặc xác nhận chuyên môn.','Lãnh đạo phụ trách'],['Thiết lập mốc nhắc tự động','Đặt notify sắp hạn và cập nhật tiến độ theo từng mốc.','Trực IOC/CAD'],['Cập nhật phương án xử lý thay thế','Đề xuất phương án nếu không hoàn thành đúng hạn.','Đơn vị chuyên môn']]},
 data:{title:'Kịch bản thiếu dữ liệu / dữ liệu chưa xác nhận',level:'Trung bình',desc:'Dùng khi chỉ tiêu chưa đủ nguồn, chưa đúng biểu mẫu, thiếu xác nhận hoặc chưa đảm bảo đúng-đủ-sạch-sống.',
 objective:'Đảm bảo dữ liệu phục vụ điều hành đúng - đủ - sạch - sống trước khi hiển thị chính thức trên dashboard IOC.',
 scope:'Áp dụng cho các chỉ tiêu, hồ sơ có nguồn dữ liệu chưa đầy đủ, chưa đúng biểu mẫu, thiếu xác nhận hoặc chưa đối chiếu giữa các nguồn.',
 process:[{step:'Thu thập & đồng bộ dữ liệu',desc:'Tổng hợp dữ liệu từ các nguồn được kết nối, xác định định dạng và tần suất cập nhật.'},{step:'Phân tích, đối chiếu, phát hiện bất thường',desc:'Đối chiếu dữ liệu giữa các nguồn, phát hiện sai lệch, thiếu trường hoặc chưa đúng biểu mẫu.'},{step:'Cảnh báo',desc:'Cảnh báo đơn vị cung cấp số liệu về phần dữ liệu chưa đạt yêu cầu đúng-đủ-sạch-sống.'},{step:'Đề xuất phương án xử lý',desc:'Yêu cầu chuẩn hóa biểu mẫu, bổ sung minh chứng và xác nhận số liệu cuối cùng.'},{step:'Theo dõi kết quả & báo cáo',desc:'Theo dõi đến khi dữ liệu được xác nhận, ghi nhận khó khăn vướng mắc còn tồn tại.'}],
 expectedResults:['Dữ liệu hiển thị trên IOC đảm bảo đúng-đủ-sạch-sống','Giảm sai lệch số liệu giữa các nguồn báo cáo','Rõ trách nhiệm xác nhận số liệu cuối cùng'],
 leadUnit:'Cán bộ tổng hợp IOC',coordUnits:['Đơn vị cung cấp số liệu','Lãnh đạo đơn vị chuyên môn'],
 sla:['Trong ngày rà soát','24h bổ sung dữ liệu','48h xác nhận'],tasks:[['Kiểm tra nguồn dữ liệu hiện có','Xác định dữ liệu đến từ API, Excel, CSDL, PDF hoặc file cứng.','Cán bộ dữ liệu'],['Chuẩn hóa biểu mẫu theo phụ lục khảo sát','Đối chiếu trường dữ liệu, tần suất, đơn vị cung cấp và người xác nhận cuối cùng.','Cán bộ tổng hợp IOC'],['Yêu cầu bổ sung minh chứng','Bổ sung file Excel/PDF/ảnh chụp màn hình hoặc trích xuất hệ thống.','Đơn vị cung cấp số liệu'],['Xác nhận số liệu cuối cùng','Lãnh đạo/đơn vị được phân công xác nhận số liệu trước khi hiển thị chính thức.','Lãnh đạo đơn vị'],['Ghi nhận khó khăn, vướng mắc','Ghi rõ khó khăn tổng hợp, chia sẻ dữ liệu hoặc hệ thống phần mềm.','Cán bộ phụ trách']]},
 coordinate:{title:'Kịch bản phối hợp liên đơn vị',level:'Cao',desc:'Dùng khi nhiệm vụ cần nhiều đơn vị phối hợp, có liên quan địa bàn, lĩnh vực hoặc phát sinh phản ánh công dân.',
 objective:'Đảm bảo các nhiệm vụ cần nhiều đơn vị phối hợp được phân công rõ vai trò, xử lý đồng bộ và đúng tiến độ.',
 scope:'Áp dụng cho nhiệm vụ liên quan nhiều lĩnh vực/địa bàn, hoặc phát sinh từ phản ánh của công dân, doanh nghiệp cần phối hợp nhiều đơn vị xử lý.',
 process:[{step:'Thu thập & đồng bộ dữ liệu',desc:'Tiếp nhận nhiệm vụ/phản ánh và xác định các lĩnh vực, đơn vị có liên quan.'},{step:'Phân tích, đối chiếu, phát hiện bất thường',desc:'Xác định đơn vị chủ trì, đơn vị phối hợp và phạm vi dữ liệu mỗi đơn vị được xem.'},{step:'Cảnh báo',desc:'Thông báo phân công tới các đơn vị liên quan kèm thời hạn và yêu cầu phối hợp.'},{step:'Đề xuất phương án xử lý',desc:'Tổ chức trao đổi nhanh, giao nhiệm vụ nhánh theo từng đơn vị với minh chứng cụ thể.'},{step:'Theo dõi kết quả & báo cáo',desc:'Tổng hợp tiến độ từng đơn vị, nhắc việc đơn vị chậm và báo cáo kết quả chung.'}],
 expectedResults:['Rút ngắn thời gian phối hợp liên đơn vị','Rõ vai trò chủ trì - phối hợp trong từng nhiệm vụ','Tổng hợp kết quả xử lý đầy đủ, kịp thời'],
 leadUnit:'Văn phòng UBND phường',coordUnits:['Các đơn vị chuyên môn liên quan','Trực IOC/CAD','Lãnh đạo phụ trách'],
 sla:['1h phân công','Trong ngày làm việc','Theo mốc giao việc'],tasks:[['Xác định đơn vị chủ trì và phối hợp','Làm rõ vai trò chủ trì, phối hợp, thời hạn và phạm vi dữ liệu được xem.','Văn phòng UBND phường'],['Tổ chức trao đổi nhanh','Mở kênh trao đổi hoặc cuộc họp ngắn để thống nhất phương án xử lý.','Lãnh đạo phụ trách'],['Giao nhiệm vụ nhánh theo từng đơn vị','Tạo việc con cho từng đơn vị, gắn hạn xử lý và minh chứng cụ thể.','Trực IOC/CAD'],['Theo dõi tiến độ từng đơn vị','Tổng hợp tiến độ, nhắc việc đơn vị chậm và cảnh báo nguy cơ.','Cán bộ tổng hợp IOC'],['Tổng hợp kết quả chung','Gộp kết quả xử lý, đối chiếu minh chứng và trình lãnh đạo.','Văn phòng']]},
 citizen:{title:'Kịch bản xử lý kiến nghị cử tri',level:'Cao',desc:'Dùng cho nhóm ý kiến, kiến nghị cử tri hoặc phản ánh liên quan nhiều đơn vị, cần theo dõi trả lời đúng hạn.',
 objective:'Đảm bảo các ý kiến, kiến nghị cử tri được phân loại, chuyển đúng đơn vị và trả lời đúng hạn theo quy định giám sát.',
 scope:'Áp dụng cho các kiến nghị, phản ánh của cử tri thuộc thẩm quyền phường Việt Hưng, liên quan nhiều lĩnh vực đời sống dân sinh.',
 process:[{step:'Thu thập & đồng bộ dữ liệu',desc:'Tiếp nhận và tổng hợp toàn bộ kiến nghị cử tri từ các kênh, kỳ họp HĐND.'},{step:'Phân tích, đối chiếu, phát hiện bất thường',desc:'Phân nhóm nội dung kiến nghị theo lĩnh vực và xác định đơn vị chủ trì trả lời.'},{step:'Cảnh báo',desc:'Cảnh báo các kiến nghị sắp/đã quá hạn trả lời theo quy định giám sát của HĐND.'},{step:'Đề xuất phương án xử lý',desc:'Chuyển đơn vị chuyên môn trả lời, giao nhiệm vụ nhánh nêu rõ hạn và mẫu kết quả.'},{step:'Theo dõi kết quả & báo cáo',desc:'Giám sát tiến độ trả lời, tổng hợp báo cáo kết quả xử lý kiến nghị cử tri.'}],
 expectedResults:['Kiến nghị cử tri được trả lời đúng hạn, đúng thẩm quyền','Tăng tính minh bạch trong theo dõi giám sát','Giảm kiến nghị tồn đọng qua các kỳ họp'],
 leadUnit:'Văn phòng HĐND phường',coordUnits:['Văn phòng UBND','Thường trực HĐND','Đơn vị chuyên môn liên quan'],
 sla:['Trong ngày phân loại','03 ngày có phản hồi bước đầu','Theo hạn nghị quyết/giám sát'],tasks:[['Phân nhóm nội dung kiến nghị','Tách theo đất đai, đô thị, an sinh, môi trường, hành chính công.','Văn phòng HĐND'],['Chuyển đơn vị chuyên môn trả lời','Giao nhiệm vụ nhánh cho đơn vị chủ trì, nêu rõ hạn và mẫu kết quả trả lời.','Văn phòng UBND'],['Giám sát tiến độ trả lời','Theo dõi trạng thái đã xử lý/đang xử lý/chưa xử lý theo từng nhóm kiến nghị.','Thường trực HĐND'],['Tổng hợp báo cáo cử tri','Lập báo cáo kết quả xử lý, khó khăn và kiến nghị cấp trên nếu vượt thẩm quyền.','Cán bộ tổng hợp IOC']]}
 };

 let docPickerSelection = new Set();
 let currentAccount=null, currentRole=null, currentSoId=null, currentXaId=null, currentOfficeId=null, activeMetric='received', activeIndicatorRole=null, activeCategoryRole='ALL', activeCategorySubGroup=null, currentDrawerRecords=[], records=[], indicatorRecords=[], drawerPieStatus='', activeIndicatorPieStatus='', drawerPage=1, vptuDrawerPage=1, drawerRawStatusMode=false, drawerUnitSplitMode=false;
 const DRAWER_PAGE_SIZE=30;

