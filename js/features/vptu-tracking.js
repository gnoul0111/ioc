 /* ===== Giao diện riêng cho "VPTU · Theo dõi nhiệm vụ" — đúng số liệu thật theo từng đầu mối giao việc ===== */
 /* 6 trạng thái luồng phê duyệt (statusDefs): Mới tạo/Chờ phê duyệt/Xin gia hạn/Hoàn thành/Kết thúc/Thu hồi
 (giữ nguyên tổng từng trục — nhóm "Đang xử lý" trước đây đã gộp vào "Chờ phê duyệt"). */
 const VPTU_DATA=[
 {role:'DANG',title:'Trung ương giao Thành ủy',total:403,rows:[['Mới tạo',36],['Chờ phê duyệt',144],['Xin gia hạn',2],['Hoàn thành',175],['Kết thúc',40],['Thu hồi',6]]},
 {role:'UBND',title:'UBND Thành phố',total:981,rows:[['Mới tạo',53],['Chờ phê duyệt',214],['Xin gia hạn',0],['Hoàn thành',548],['Kết thúc',78],['Thu hồi',88]]},
 {role:'HDND',title:'HĐND Thành phố',total:28,rows:[['Mới tạo',2],['Chờ phê duyệt',6],['Xin gia hạn',0],['Hoàn thành',15],['Kết thúc',2],['Thu hồi',3]]},
 {role:'MTTQ',title:'Ủy ban MTTQ Việt Nam Thành phố',total:30,rows:[['Mới tạo',4],['Chờ phê duyệt',15],['Xin gia hạn',0],['Hoàn thành',5],['Kết thúc',3],['Thu hồi',3]]}
 ];
