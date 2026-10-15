 /* ============================== DATA TĨNH ============================== */
 const statusDefs = [
 {key:'new', label:'Mới tạo', short:'Mới tạo', color:'#58b7ff', cls:'blue'},
 {key:'pending', label:'Chờ phê duyệt', short:'Chờ phê duyệt', color:'#d8a50c', cls:'gold'},
 {key:'extend', label:'Xin gia hạn', short:'Xin gia hạn', color:'#8b5cf6', cls:'violet'},
 {key:'done', label:'Hoàn thành', short:'Hoàn thành', color:'#2fb174', cls:'green'},
 {key:'closed', label:'Kết thúc', short:'Kết thúc', color:'#6f93b3', cls:'muted'},
 {key:'revoked', label:'Thu hồi', short:'Thu hồi', color:'#d33a44', cls:'red'}
 ];
 /* Trạng thái RIÊNG cho Văn bản đến/đi (metric docIn/docOut) — 5 mức chuẩn hóa theo yêu cầu nghiệp vụ văn bản,
 khác với luồng phê duyệt 7 bước của nhiệm vụ giao/nhận ở statusDefs. Khoá 'new'/'done' dùng chung tên và nghĩa
 với statusDefs nên thống kê gộp theo trạng thái (statusAllVisible/renderSummary) vẫn cộng đúng; 'progress'/
 'dueSoon'/'overdue' là khoá riêng của văn bản, không trùng khoá nào trong statusDefs. */
 const docStatusDefs = [
 {key:'new', label:'Mới tạo', short:'Mới tạo', color:'#58b7ff', cls:'blue'},
 {key:'progress', label:'Đang thực hiện', short:'Đang thực hiện', color:'#2c7dd2', cls:'blue'},
 {key:'dueSoon', label:'Sắp quá hạn', short:'Sắp quá hạn', color:'#d8a50c', cls:'gold'},
 {key:'done', label:'Hoàn thành', short:'Hoàn thành', color:'#2fb174', cls:'green'},
 {key:'overdue', label:'Quá hạn', short:'Quá hạn', color:'#d33a44', cls:'red'}
 ];
 /* Chỉ tiêu (đo kết quả đạt/không đạt so với mục tiêu) dùng bộ trạng thái RIÊNG (CAT_ST, định nghĩa ở dưới) —
 không dùng statusDefs ở trên, vì đó là trạng thái luồng xử lý nhiệm vụ (workflow), khác bản chất với trạng thái
 đạt mục tiêu của chỉ tiêu. VPTU/GIAO_DATA (nhiệm vụ giao/nhận theo trục) dùng chung statusDefs này. */
 /* fullName: tên đầy đủ cơ quan theo vai trò — dùng ở mọi nơi cần in tên chính thức (cơ quan ban hành văn bản,
 nhãn phạm vi bản đồ GIS, tên hiển thị header...) thay vì mỗi nơi tự khai báo lại 1 map riêng (từng gây lệch dữ
 liệu: cùng vai trò MTTQ nhưng 2 nơi ra 2 tên khác nhau). */
 const axisMeta = {
 DANG:{name:'Thành ủy', fullName:'Thành ủy Hà Nội', icon:'🚩', color:'#e84d5b', desc:'Thường trực Thành ủy · xem tất cả 04 trục', scope:'all'},
 HDND:{name:'HĐND TP', fullName:'HĐND Thành phố Hà Nội', icon:'🗳️', color:'#f59e0b', desc:'Chủ tịch HĐND Thành phố · chỉ xem HĐND', scope:'own'},
 UBND:{name:'UBND TP', fullName:'UBND Thành phố Hà Nội', icon:'🏢', color:'#2fb174', desc:'Chủ tịch UBND Thành phố · chỉ xem UBND', scope:'own'},
 MTTQ:{name:'MTTQ TP', fullName:'Ủy ban MTTQ Việt Nam Thành phố Hà Nội', icon:'🤝', color:'#8b5cf6', desc:'Chủ tịch UB MTTQ Thành phố · chỉ xem MTTQ', scope:'own'}
 };
 const metricMeta = {
 assigned:{label:'Nhiệm vụ giao', short:'Nhiệm vụ giao', icon:'📤'},
 received:{label:'Nhiệm vụ nhận', short:'Nhiệm vụ nhận', icon:'📥'},
 docIn:{label:'Văn bản đến', short:'Văn bản đến', icon:'📨'},
 docOut:{label:'Văn bản đi', short:'Văn bản đi', icon:'📄'}
 };
 const accounts = {
 danguy:{user:'danguy', pass:'123456', role:'DANG', title:'Tài khoản Thành ủy', subtitle:'Thường trực Thành ủy · Xem tất cả 04 trục', icon:'🚩'},
 hdnd:{user:'hdnd', pass:'123456', role:'HDND', title:'Tài khoản HĐND', subtitle:'Chủ tịch HĐND Thành phố · Chỉ xem HĐND', icon:'🗳️'},
 ubnd:{user:'ubnd', pass:'123456', role:'UBND', title:'Tài khoản UBND', subtitle:'Chủ tịch UBND Thành phố · Chỉ xem UBND', icon:'🏢'},
 mttq:{user:'mttq', pass:'123456', role:'MTTQ', title:'Tài khoản MTTQ', subtitle:'Chủ tịch UB MTTQ Thành phố · Chỉ xem MTTQ', icon:'🤝'}
 };

