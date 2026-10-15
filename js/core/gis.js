/* ============================== gis.js ==============================
   Toàn bộ logic Bản đồ GIS (Leaflet) — tách khỏi demo_ioc.html, nạp qua
   <script src="gis.js"> (đặt giữa 2 khối <script> chính: các hàm/biến dùng
   chung như esc/toast/lockScroll/unlockScroll/currentRole/currentXaId/
   currentSoId/wardNames/categorySeed/isTwRole/roleMeta đã được định nghĩa
   ở khối script phía trên nên gis.js dùng thẳng, không tự định nghĩa lại).

   Ghi lại ngày 2026-07-29 dựa theo bản demo độc lập (index.html/style.css/
   script.js) người dùng cung cấp — đây là bản gốc thật (đã mất khỏi ổ đĩa
   trước đó), chỉ bỏ phần thư viện Leaflet/markercluster/heat (đã có sẵn
   trong demo_ioc.html) và các hàm "stub" chỉ phục vụ chạy độc lập (openGisEformDetail
   thật đã có sẵn trong demo_ioc.html, đầy đủ hơn bản stub). */

/* Chặn dòng attribution "Leaflet | © OpenStreetMap" (có link ra ngoài) cho MỌI bản đồ:
   mặc định không tạo control, và nếu ai đó tự thêm lại thì cũng không có prefix/link Leaflet. */
if(window.L){L.Map.mergeOptions({attributionControl:false});L.Control.Attribution.prototype.options.prefix=false;}

/* ============================== NỀN TẢNG BẢN ĐỒ ============================== */
/* 2026-09-23: BỎ HẲN OpenStreetMap theo yêu cầu người dùng — bản đồ OSM không thể hiện Hoàng Sa, Trường Sa
   thuộc Việt Nam và có đường lưỡi bò, KHÔNG được dùng lại OSM (hay CARTO, vốn vẽ từ dữ liệu OSM).
   Tạm thời mọi theme đều dùng ảnh vệ tinh Esri World Imagery: chỉ là ảnh chụp, không có đường biên giới/nhãn
   địa danh. "dark" gắn class gis-tile-dark (gis.css) để làm tối ảnh. Khi có API key bản đồ Việt Nam
   (Map4D/Vietmap/bản đồ nền quốc gia) thì thay URL tại đây. */
const GIS_SAT_URL='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const gisTileUrls={
 dark:[GIS_SAT_URL,''],
 light:[GIS_SAT_URL,''],
 satellite:[GIS_SAT_URL,'']
};
const gisStatusColor={done:'#2fb174',doing:'#2c7dd2',soon:'#d8a50c',risk:'#d25a19',overdue:'#d33a44'};
const gisStatusLabel={done:'Hoàn thành',doing:'Đang xử lý',soon:'Sắp đến hạn',risk:'Nguy cơ trễ',overdue:'Quá hạn'};

/* 5 nhóm điểm nghẽn đúng theo bottleneck_code/bottleneck_name của sheet EFORM_INPUT — org/coord là
   responsible_org_id/coordinating_org_ids mặc định của nhóm, dùng khi sinh dữ liệu ước tính ngoài
   25 bản ghi mẫu thật (GIS_EFORM_SEED_RAW), vốn giữ đúng org/coord ghi trong sheet. */
const GIS_BOTTLENECKS=[
 {code:'URBAN_ORDER',name:'Trật tự đô thị',color:'#2c7dd2',icon:'🚧',org:'ORG-CA-TPHN',coord:['ORG-UBND-PH','ORG-QLDT']},
 {code:'TRAFFIC_JAM',name:'Ùn tắc giao thông',color:'#d8a50c',icon:'🚦',org:'ORG-CA-TPHN',coord:['ORG-XD','ORG-UBND-PH']},
 {code:'ENVIRONMENT',name:'Vệ sinh môi trường',color:'#2fb174',icon:'🗑️',org:'ORG-UBND-PH',coord:['ORG-MT','ORG-CA-TPHN']},
 {code:'FOOD_SAFETY',name:'An toàn thực phẩm',color:'#8b5cf6',icon:'🍜',org:'ORG-YTE',coord:['ORG-CA-TPHN','ORG-UBND-PH']},
 {code:'URBAN_FLOOD',name:'Ngập úng đô thị',color:'#39d5ff',icon:'🌊',org:'ORG-UBND-PH',coord:['ORG-THOATNUOC','ORG-CA-TPHN']}
];
const GIS_ORG_LABELS={
 'ORG-CA-TPHN':'Công an Thành phố Hà Nội','ORG-UBND-PH':'UBND phường/xã','ORG-QLDT':'Đội Quản lý đô thị',
 'ORG-XD':'Sở Xây dựng','ORG-MT':'Đơn vị Môi trường đô thị','ORG-YTE':'Ngành Y tế','ORG-THOATNUOC':'Đơn vị Thoát nước Hà Nội'
};
/* "Sự cố khẩn cấp" là nhóm mục RIÊNG, tách khỏi GIS_BOTTLENECKS (5 nhóm điểm nghẽn chính) theo đúng yêu cầu
   nghiệp vụ (King Kông chốt 2026-08-10): gồm Cháy nổ + 3 loại mới (Thiên tai, An ninh trật tự, Sự cố xã hội).
   'truso' (Cháy nổ) vẫn giữ nguyên code cũ để không phá dữ liệu/marker đã có; 3 loại mới dùng chung 1 pipeline
   marker/màu/popup/Giao xử lý với Cháy nổ qua gisBottleneckMeta() — chỗ nào bỏ sót vẫn gọi GIS_BOTTLENECKS.find()
   trực tiếp sẽ bị lỗi (undefined) khi gặp bản ghi thuộc nhóm này. */
const GIS_EMERGENCY_TYPES=[
 {code:'truso',name:'Cháy nổ',color:'#ff4c4c',icon:'🔥',org:'ORG-CA-TPHN',coord:['ORG-YTE','ORG-UBND-PH']},
 {code:'DISASTER',name:'Thiên tai (Vỡ đê,...)',color:'#d25a19',icon:'🌪️',org:'ORG-UBND-PH',coord:['ORG-CA-TPHN']},
 {code:'SECURITY',name:'An ninh, trật tự (bắt cóc, đe dọa, bạo lực..)',color:'#d33a44',icon:'🚨',org:'ORG-CA-TPHN',coord:['ORG-UBND-PH']},
 {code:'SOCIAL',name:'Sự cố xã hội (tự tử, người mất tích..)',color:'#8b5cf6',icon:'🆘',org:'ORG-UBND-PH',coord:['ORG-CA-TPHN']}
];
const GIS_TRUSO_META=GIS_EMERGENCY_TYPES[0];
function gisIsEmergencyCode(code){return GIS_EMERGENCY_TYPES.some(e=>e.code===code);}
function gisBottleneckMeta(code){return GIS_EMERGENCY_TYPES.find(e=>e.code===code)||GIS_BOTTLENECKS.find(x=>x.code===code);}
/* Hạn xử lý fake phải LUÔN nằm trong tương lai so với ngày thật đang chạy demo, không phải ngày cố định lúc
   soạn dữ liệu (2026-07-29) — nếu không, chỉ cần mở demo trễ vài ngày là các "hạn xử lý" rơi vào quá khứ trong
   khi trạng thái vẫn hiện "Đang xử lý" (không phải "Quá hạn"), vô lý. daysFromToday là số ngày kể từ lúc mở demo. */
function gisFutureDateStr(daysFromToday){
 const d=new Date(); d.setDate(d.getDate()+daysFromToday);
 return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} 17:00`;
}

/* 25 bản ghi mẫu thật dịch 1:1 từ sheet EFORM_INPUT (EF-00001..EF-00025, 5 dòng/nhóm điểm nghẽn) — dùng làm dữ
   liệu gốc cho view "toàn Thành phố Hà Nội". Cột theo đúng thứ tự: id, bottleneck_code, title, description,
   location_text, landmark, lat, lng, responsible_org_id, coordinating_org_ids, due_at, danger_level,
   emergency_level, user_notes, data_source_note. */
const GIS_EFORM_SEED_RAW=[
['EF-00001','URBAN_ORDER','Lấn chiếm vỉa hè tại ngõ 129 Nguyễn Trãi','Lấn chiếm vỉa hè/kinh doanh tự phát; cần xác minh hiện trường và cập nhật kết quả xử lý.','Ngõ 129 đường Nguyễn Trãi, phường Khương Đình','Khu kinh doanh tự phát',20.9988,105.8078,'ORG-CA-TPHN',['ORG-UBND-PH','ORG-QLDT'],gisFutureDateStr(1),3,3,'Đã tiếp nhận; đã giao CA TPHN chủ trì.','https://khuongdinh.hanoi.gov.vn/tin-tuyen-truyen'],
['EF-00002','URBAN_ORDER','Dựng mái che, bày hàng trên vỉa hè phố Tây Sơn','Dựng mái che, bày hàng trên vỉa hè; cần xác minh hiện trường và cập nhật kết quả xử lý.','Đoạn vỉa hè phố Tây Sơn gần nút Thái Hà – Tây Sơn','Dãy hàng ăn và mái che tạm',21.0057,105.8208,'ORG-CA-TPHN',['ORG-UBND-PH','ORG-QLDT'],gisFutureDateStr(2),3,2,'Đã tiếp nhận; đang xác minh hiện trường.','https://khuongdinh.hanoi.gov.vn/tin-tuyen-truyen'],
['EF-00003','URBAN_ORDER','Điểm trông giữ xe tự phát tại phố Trần Duy Hưng','Phản ánh chiếm dụng lòng đường để trông giữ xe; cần kiểm tra biển báo và diện tích sử dụng.','Khu vực trước dãy cửa hàng','Trục Trần Duy Hưng',21.0108,105.7944,'ORG-CA-TPHN',['ORG-UBND-PH','ORG-QLDT'],gisFutureDateStr(3),4,3,'Đã tiếp nhận; đã giao CA TPHN chủ trì.','https://khuongdinh.hanoi.gov.vn/tin-tuyen-truyen'],
['EF-00004','URBAN_ORDER','Lấn chiếm vỉa hè quanh chợ Đồng Xuân','Theo dõi tình trạng bày bán hàng hóa tràn ra lối đi bộ, ảnh hưởng người dân và du khách.','Cổng chợ và tuyến phố lân cận','Khu phố cổ',21.038,105.8494,'ORG-CA-TPHN',['ORG-UBND-PH','ORG-QLDT'],gisFutureDateStr(4),4,3,'Đã tiếp nhận; đang xử lý.','https://khuongdinh.hanoi.gov.vn/tin-tuyen-truyen'],
['EF-00005','URBAN_ORDER','Biển quảng cáo che khuất lối đi tại phố Huế','Cần kiểm tra biển quảng cáo, vật cản và trách nhiệm tháo dỡ/khắc phục.','Mặt tiền dãy cửa hàng phố Huế','Khu dân cư phố Huế',21.0186,105.851,'ORG-CA-TPHN',['ORG-UBND-PH','ORG-QLDT'],gisFutureDateStr(5),2,2,'Chờ xác nhận; chưa giao nhiệm vụ.','https://khuongdinh.hanoi.gov.vn/tin-tuyen-truyen'],
['EF-00006','TRAFFIC_JAM','Ùn tắc tại trục Khuất Duy Tiến – Nguyễn Trãi','Theo dõi ùn tắc giờ cao điểm; cần ghi nhận thời gian, chiều dài hàng xe và phương án phân luồng.','Nút giao hướng vào trung tâm','Trục Nguyễn Trãi',20.9976,105.8034,'ORG-CA-TPHN',['ORG-XD','ORG-UBND-PH'],gisFutureDateStr(1),4,4,'Đã tiếp nhận; đã giao CA TPHN chủ trì.','https://pbgdpl.hanoi.gov.vn/tin-noi-bat'],
['EF-00007','TRAFFIC_JAM','Ùn tắc nút Vành đai 3 – Phạm Hùng','Theo dõi dòng xe dồn ứ tại nhánh lên/xuống và ảnh hưởng đến xe buýt, phương tiện khẩn cấp.','Nút lên xuống Vành đai 3','Đường Phạm Hùng',21.0195,105.7844,'ORG-CA-TPHN',['ORG-XD','ORG-UBND-PH'],gisFutureDateStr(2),5,5,'Đã tiếp nhận; đang phân luồng.','https://pbgdpl.hanoi.gov.vn/tin-noi-bat'],
['EF-00008','TRAFFIC_JAM','Ùn tắc quanh cầu Chương Dương giờ cao điểm','Cần đối chiếu camera, lưu lượng xe và thời gian giải tỏa sau khi tổ chức phân luồng.','Đầu cầu phía nội thành','Trục Nguyễn Văn Cừ – Chương Dương',21.0388,105.8612,'ORG-CA-TPHN',['ORG-XD','ORG-UBND-PH'],gisFutureDateStr(3),4,4,'Đã tiếp nhận; đã giao CA TPHN chủ trì.','https://pbgdpl.hanoi.gov.vn/tin-noi-bat'],
['EF-00009','TRAFFIC_JAM','Ùn tắc tại nút Tố Hữu – Lê Văn Lương','Theo dõi ùn tắc do lưu lượng lớn và xung đột dòng xe tại khu vực đô thị mới.','Nút giao Tố Hữu – Lê Văn Lương','Trục Tố Hữu',20.9924,105.7876,'ORG-CA-TPHN',['ORG-XD','ORG-UBND-PH'],gisFutureDateStr(4),4,4,'Đã tiếp nhận; đang xử lý.','https://pbgdpl.hanoi.gov.vn/tin-noi-bat'],
['EF-00010','TRAFFIC_JAM','Ùn tắc cục bộ trước cổng trường trên phố Hoàng Quốc Việt','Cần ghi nhận khung giờ, chiều dài hàng xe và giải pháp phân luồng trước/sau giờ học.','Cổng trường và điểm dừng đỗ','Phố Hoàng Quốc Việt',21.0468,105.7917,'ORG-CA-TPHN',['ORG-XD','ORG-UBND-PH'],gisFutureDateStr(5),3,3,'Chờ xác nhận; chưa giao nhiệm vụ.','https://pbgdpl.hanoi.gov.vn/tin-noi-bat'],
['EF-00011','ENVIRONMENT','Điểm ô nhiễm môi trường tại 190 Nguyễn Trãi','Phản ánh điểm rác/tình trạng ô nhiễm; cần kiểm tra hiện trường, khối lượng tồn đọng và kết quả thu gom.','Điểm phản ánh ô nhiễm','Khu dân cư ven Nguyễn Trãi',20.9972,105.8087,'ORG-UBND-PH',['ORG-MT','ORG-CA-TPHN'],gisFutureDateStr(1),2,2,'Đã tiếp nhận; đang khắc phục.','https://congdanso.hanoi.gov.vn/phan-anh'],
['EF-00012','ENVIRONMENT','Rác tồn tại khu vực gầm cầu Long Biên','Theo dõi tập kết rác không đúng nơi quy định, mùi và ảnh hưởng cảnh quan khu vực.','Khu vực gầm cầu','Gầm cầu Long Biên',21.041,105.8529,'ORG-UBND-PH',['ORG-MT','ORG-CA-TPHN'],gisFutureDateStr(2),3,3,'Đã tiếp nhận; đã giao đơn vị môi trường.','https://congdanso.hanoi.gov.vn/phan-anh'],
['EF-00013','ENVIRONMENT','Nước thải, mùi hôi tại tuyến mương khu dân cư','Cần kiểm tra nguồn xả, tình trạng dòng chảy và phương án vệ sinh/khơi thông.','Đoạn mương cạnh khu dân cư','Khu dân cư Hoàng Mai',20.9813,105.86,'ORG-UBND-PH',['ORG-MT','ORG-CA-TPHN'],gisFutureDateStr(3),4,3,'Đã tiếp nhận; đang xác minh nguồn xả.','https://congdanso.hanoi.gov.vn/phan-anh'],
['EF-00014','ENVIRONMENT','Điểm tập kết rác sai quy định tại phố Kim Ngưu','Theo dõi tần suất thu gom, thời gian tồn rác và khả năng phát sinh điểm nóng tái diễn.','Điểm tập kết tạm','Phố Kim Ngưu',20.9979,105.8623,'ORG-UBND-PH',['ORG-MT','ORG-CA-TPHN'],gisFutureDateStr(4),3,2,'Đã tiếp nhận; đang xử lý.','https://congdanso.hanoi.gov.vn/phan-anh'],
['EF-00015','ENVIRONMENT','Ô nhiễm bụi tại khu vực thi công đường','Cần kiểm tra che chắn, tưới nước, vệ sinh bánh xe và phản ánh của người dân.','Khu vực công trường','Trục đường đang thi công',21.0255,105.8031,'ORG-UBND-PH',['ORG-MT','ORG-CA-TPHN'],gisFutureDateStr(5),3,3,'Chờ xác nhận; chưa giao nhiệm vụ.','https://congdanso.hanoi.gov.vn/phan-anh'],
['EF-00016','FOOD_SAFETY','Cơ sở kinh doanh thực phẩm cần kiểm tra tại phường Đống Đa','Theo dõi cơ sở thuộc diện kiểm tra/xử lý ATTP; cần cập nhật kết quả, vi phạm và tình trạng khắc phục.','Cơ sở kinh doanh dịch vụ ăn uống','Địa chỉ cơ sở cần xác minh',21.0152,105.8234,'ORG-YTE',['ORG-CA-TPHN','ORG-UBND-PH'],gisFutureDateStr(1),4,4,'Đã tiếp nhận; đang xác minh cơ sở.','https://dongda.hanoi.gov.vn/an-toan-thuc-pham'],
['EF-00017','FOOD_SAFETY','Cơ sở bán thực phẩm không rõ nguồn gốc tại chợ dân sinh','Cần kiểm tra hồ sơ nguồn gốc, điều kiện bảo quản và kết quả xử lý nếu có vi phạm.','Quầy thực phẩm trong chợ','Chợ dân sinh khu Hai Bà Trưng',21.0086,105.852,'ORG-YTE',['ORG-CA-TPHN','ORG-UBND-PH'],gisFutureDateStr(2),4,4,'Đã tiếp nhận; đã giao đoàn kiểm tra.','https://dongda.hanoi.gov.vn/an-toan-thuc-pham'],
['EF-00018','FOOD_SAFETY','Điểm kinh doanh thức ăn đường phố gần trường học','Theo dõi điều kiện vệ sinh, nguồn nước, dụng cụ chế biến và nguy cơ ảnh hưởng học sinh.','Hàng ăn đường phố','Khu vực gần trường học',21.033,105.8166,'ORG-YTE',['ORG-CA-TPHN','ORG-UBND-PH'],gisFutureDateStr(3),3,3,'Đã tiếp nhận; đang kiểm tra.','https://dongda.hanoi.gov.vn/an-toan-thuc-pham'],
['EF-00019','FOOD_SAFETY','Kho bảo quản thực phẩm cần xác minh điều kiện nhiệt độ','Cần kiểm tra kho, nhật ký nhiệt độ, hạn sử dụng và biện pháp khắc phục.','Kho bảo quản thực phẩm','Khu vực Minh Khai',20.9992,105.8701,'ORG-YTE',['ORG-CA-TPHN','ORG-UBND-PH'],gisFutureDateStr(4),4,4,'Chờ xác nhận; chưa giao nhiệm vụ.','https://dongda.hanoi.gov.vn/an-toan-thuc-pham'],
['EF-00020','FOOD_SAFETY','Phản ánh suất ăn có dấu hiệu không bảo đảm an toàn','Theo dõi phản ánh, lấy mẫu khi cần và cập nhật kết luận xác minh, xử lý, khắc phục.','Bếp ăn tập thể','Khu tập thể/cơ quan',21.0284,105.8346,'ORG-YTE',['ORG-CA-TPHN','ORG-UBND-PH'],gisFutureDateStr(5),5,5,'Đã tiếp nhận; đang xác minh.','https://dongda.hanoi.gov.vn/an-toan-thuc-pham'],
['EF-00021','URBAN_FLOOD','Điểm ngập tại ngõ 44 Vũ Trọng Phụng','Phản ánh ngập úng sau mưa; cần đo độ sâu, phạm vi ảnh hưởng, thời gian rút nước và tình trạng xử lý.','Đoạn ngõ thường xuyên ngập','Khu dân cư Vũ Trọng Phụng',20.9996,105.8055,'ORG-UBND-PH',['ORG-THOATNUOC','ORG-CA-TPHN'],gisFutureDateStr(1),4,5,'Đã tiếp nhận; đã giao đơn vị thoát nước.','https://congdanso.hanoi.gov.vn/phan-anh'],
['EF-00022','URBAN_FLOOD','Ngập cục bộ tại nút Nguyễn Xiển – đường 70','Theo dõi độ sâu, chiều dài đoạn ngập, ảnh hưởng phương tiện và thời gian rút nước.','Nút giao và đường dẫn','Trục Nguyễn Xiển',20.9778,105.7869,'ORG-UBND-PH',['ORG-THOATNUOC','ORG-CA-TPHN'],gisFutureDateStr(2),5,5,'Đã tiếp nhận; đang ứng phó.','https://congdanso.hanoi.gov.vn/phan-anh'],
['EF-00023','URBAN_FLOOD','Ngập khu vực quanh hầm chui Kim Liên','Cần kiểm tra cửa thu, bơm thoát nước, biển cảnh báo và thời gian bảo đảm giao thông.','Khu vực hầm chui','Hầm chui Kim Liên',21.0114,105.8424,'ORG-UBND-PH',['ORG-THOATNUOC','ORG-CA-TPHN'],gisFutureDateStr(3),5,5,'Đã tiếp nhận; đang xử lý.','https://congdanso.hanoi.gov.vn/phan-anh'],
['EF-00024','URBAN_FLOOD','Ngập đường ven sông Tô Lịch sau mưa lớn','Theo dõi đoạn ngập, khả năng tiêu thoát, ảnh hưởng hộ dân và phương án cảnh báo.','Đoạn đường ven sông','Sông Tô Lịch',20.9997,105.8276,'ORG-UBND-PH',['ORG-THOATNUOC','ORG-CA-TPHN'],gisFutureDateStr(4),4,4,'Đã tiếp nhận; đang xác minh.','https://congdanso.hanoi.gov.vn/phan-anh'],
['EF-00025','URBAN_FLOOD','Ngập cục bộ tại khu dân cư Yên Hòa','Cần ghi nhận độ sâu, số hộ ảnh hưởng, điểm tắc dòng chảy và kết quả khắc phục.','Ngõ/khu dân cư thấp trũng','Khu dân cư Yên Hòa',21.0224,105.8017,'ORG-UBND-PH',['ORG-THOATNUOC','ORG-CA-TPHN'],gisFutureDateStr(5),3,4,'Chờ xác nhận; chưa giao nhiệm vụ.','https://congdanso.hanoi.gov.vn/phan-anh']
];
function gisBuildEformSeed(){
 return GIS_EFORM_SEED_RAW.map(r=>{
  const [id,bcode,title,description,location_text,landmark,lat,lng,org,coord,due_at,danger_level,emergency_level,user_notes,data_source_note]=r;
  return {id,bottleneck_code:bcode,title,description,location_text,landmark,lat,lng,responsible_org_id:org,coordinating_org_ids:coord,due_at,danger_level,emergency_level,completeness_score:0.82,user_notes,gis_ai_notes:'Đã bổ sung thuộc tính liên quan (RELATED_ATTRIBUTES); dữ liệu demo cần xác minh trước khi sử dụng chính thức.',data_source_note,status:/chưa giao nhiệm vụ/.test(user_notes)?'soon':'doing',linkedRecordId:null,reportCount:1,relatedReports:[],images:[],received_at:Date.now()};
 });
}
const GIS_EFORM_SEED=gisBuildEformSeed();
/* Gán tay đủ 4 trạng thái màu (vàng/đỏ/xanh dương/xanh lá) cho MỖI nhóm điểm nghẽn trên view "toàn Hà Nội" —
   25 bản ghi gốc từ sheet đều mặc định vàng (status 'soon'/'doing' không có linkedRecordId), nên bản đồ demo
   trước đây gần như chỉ toàn 1 màu. Không đổi title/description/toạ độ, chỉ đổi field điều khiển màu
   (linkedRecordId/reportCount/status) — xem gisMarkerStateColor(). */
(function gisFakeStatusVariety(){
 const byId=id=>GIS_EFORM_SEED.find(r=>r.id===id);
 /* Đang xử lý (xanh dương) — KHÔNG gán linkedRecordId giả (field này dùng để liên kết tới 1 nhiệm vụ THẬT trong
    coordination-tree.js, các nơi khác như audit-log.js đọc nó để tạo nút "Xem nhiệm vụ đã giao" điều hướng tới
    id đó — gán chuỗi giả sẽ vỡ khi bấm vào vì không có bản ghi đó thật). Dùng cờ riêng demoLinked chỉ để tô màu
    xanh dương/nhãn "Đang xử lý" (xem gisMarkerStateColor/gisStateLabel), không đụng tới linkedRecordId thật. */
 ['EF-00001','EF-00006','EF-00011','EF-00016','EF-00021'].forEach(id=>{const r=byId(id);if(r)r.demoLinked=true;});
 /* Chưa xử lý, ≥5 phản ánh trùng vị trí (đỏ). */
 ['EF-00002','EF-00007','EF-00012','EF-00017','EF-00022'].forEach(id=>{const r=byId(id);if(r)r.reportCount=6;});
 /* Đã hoàn thành xử lý (xanh lá, sắp tự ẩn). */
 ['EF-00003','EF-00008','EF-00013','EF-00018','EF-00023'].forEach(id=>{const r=byId(id);if(r)r.status='done';});
 /* Còn lại (EF-00004/5, 9/10, 14/15, 19/20, 24/25) giữ nguyên vàng — chưa xử lý, <5 phản ánh. */
})();
/* 6 bản ghi "Cháy nổ" mẫu dùng toạ độ thật ngoài đời (không rải ngẫu nhiên như trước) cho view "toàn thành phố"
   — cùng tinh thần với GIS_EFORM_SEED (25 điểm nghẽn thật ở trên), để marker Cháy nổ cũng nằm đúng vị trí có
   thể nhận ra (chợ, khu tập thể, cụm công nghiệp, trục đường lớn) thay vì lệch ra sông/hồ/ruộng do jitter ngẫu
   nhiên quanh tâm thành phố. Tên sự việc là giả lập, chỉ toạ độ/địa danh là thật.
   Trước đây Cháy nổ tô màu theo gisDangerColor(danger_level) (4 mức tĩnh: xanh lá/vàng/cam/đỏ) — khác hẳn quy
   tắc màu theo TRẠNG THÁI XỬ LÝ (gisMarkerStateColor: vàng/đỏ/xanh dương/xanh lá) mà 5 nhóm điểm nghẽn (và cả
   báo cáo Cháy nổ do người dùng tự thêm) dùng, nên 2 kiểu marker không cùng 1 "ngôn ngữ" màu trên bản đồ dù
   đứng cạnh nhau. Gộp thẳng 6 bản ghi này vào gisEformData (bottleneck_code:'truso', đủ status/linkedRecordId/
   reportCount) để đi qua ĐÚNG 1 pipeline marker/màu/popup/Giao xử lý/Hoàn thành xử lý như 5 nhóm kia — không
   còn mảng/hàm vẽ riêng cho Cháy nổ nữa. */
const GIS_TRUSO_SEED_RAW=[
 ['CN-01','Cháy nhà dân tại khu tập thể Nghĩa Tân',21.0409,105.7898,3,'Trung bình','Đang kiểm soát'],
 ['CN-02','Cháy ki-ốt tại chợ Hôm – Đức Viên',21.0138,105.8524,5,'Nghiêm trọng','Đang xử lý'],
 ['CN-03','Cháy xưởng sản xuất tại cụm công nghiệp Vĩnh Tuy',20.9917,105.8734,5,'Nghiêm trọng','Đang xử lý'],
 ['CN-04','Cháy phương tiện trên đường Giải Phóng',20.9752,105.8410,2,'Nhẹ','Đã dập tắt'],
 ['CN-05','Nổ bình gas tại khu tập thể Thành Công',21.0246,105.8140,5,'Nghiêm trọng','Đang xử lý'],
 ['CN-06','Cháy bãi tập kết phế liệu tại Cổ Nhuế',21.0611,105.7746,3,'Trung bình','Đang kiểm soát']
];
/* "Đã dập tắt" → coi như đã xử lý xong (status:'done', tô xanh lá rồi tự ẩn khỏi bản đồ như mọi điểm đã hoàn
   thành xử lý); "Đang xử lý"/"Đang kiểm soát" → chưa giao xử lý (status:'soon', tô vàng/đỏ theo reportCount như
   1 điểm nghẽn mới, sẽ chuyển xanh dương khi được "Giao xử lý"). Giữ lại name/chuc_nang vì tooltip marker/
   renderGisSearch vẫn đọc 2 field này. */
const GIS_TRUSO_SEED=GIS_TRUSO_SEED_RAW.map(([id,name,lat,lng,danger_level,levelLabel,statusLabel],idx)=>{
 const done=statusLabel==='Đã dập tắt';
 return {
  id,bottleneck_code:'truso',name,lat,lng,danger_level,emergency_level:danger_level,
  chuc_nang:`Mức độ: ${levelLabel} · ${statusLabel}`,
  title:name,description:`Mức độ: ${levelLabel} · ${statusLabel}`,location_text:name,landmark:'',
  responsible_org_id:GIS_TRUSO_META.org,coordinating_org_ids:GIS_TRUSO_META.coord,
  due_at:gisFutureDateStr(1+idx),completeness_score:0.82,
  user_notes:done?'Đã dập tắt/khống chế xong; đang chờ xác nhận đóng.':`${statusLabel}; cần theo dõi tiếp diễn biến hiện trường.`,
  gis_ai_notes:'Đã bổ sung thuộc tính liên quan (RELATED_ATTRIBUTES); dữ liệu demo cần xác minh trước khi sử dụng chính thức.',
  data_source_note:'Dữ liệu minh hoạ tại vị trí thực tế (chưa có nguồn xác thực chính thức).',
  status:done?'done':'soon',linkedRecordId:null,reportCount:1,relatedReports:[],images:[],received_at:Date.now()
 };
});
let gisEformData=GIS_EFORM_SEED.concat(GIS_TRUSO_SEED), gisKhuDanCuData=[];
/* Không còn vùng giám sát mẫu sẵn — layer "zones" chỉ chứa vùng do người dùng tự khoanh (gisStartDraw). */
const gisZoneDefs=[];

/* 25 bản ghi eForm mẫu (GIS_EFORM_SEED) là dữ liệu thật, phủ toàn Thành phố Hà Nội — dùng làm gốc cho view
   "toàn thành phố". Nhưng chưa có dữ liệu eForm thật riêng cho từng xã/phường, sở/ngành cụ thể, nên với các
   phạm vi hẹp hơn vẫn cần sinh dữ liệu ước tính (seed cố định theo tài khoản, không đổi lung tung mỗi lần
   render) quanh 1 tâm điểm phù hợp phạm vi — xem gisBuildSyntheticEform()/buildGisScopeData(). */
const HN_BOUNDS={latMin:20.98,latMax:21.10,lngMin:105.76,lngMax:105.92};
const HN_CENTER=[21.0278,105.8342];
/* Ranh giới cho phép kéo/zoom trên bản đồ GIS — RỘNG HƠN HN_BOUNDS (vốn chỉ là hộp hẹp để rải toạ độ mẫu
   theo xã/phường) vì phải phủ hết địa giới hành chính thật của Hà Nội (kể cả Ba Vì, Sóc Sơn, Mỹ Đức ở rìa
   xa trung tâm), có thêm chút đệm cho dễ thao tác gần biên. Dùng ở initGisMap() để chặn kéo/zoom ra ngoài
   Hà Nội (xem cả nước hoặc nơi khác không liên quan tới dữ liệu demo). */
const HN_MAP_BOUNDS=[[20.4,105.05],[21.5,106.2]];
/* Ranh giới địa chính thật của Thành phố Hà Nội (lấy từ OpenStreetMap/Nominatim, đơn giản hoá bằng thuật toán
   Ramer–Douglas–Peucker từ ~5.530 điểm gốc xuống còn 471 điểm — đủ mượt ở mọi mức zoom bản đồ GIS dùng, nhẹ
   hơn nhiều lần để nhúng thẳng vào JS). Dùng để vẽ lớp phủ che phần ngoài Hà Nội (xem gisHanoiMask() bên dưới),
   khác HN_MAP_BOUNDS (chỉ là 1 hình chữ nhật giới hạn kéo/zoom, không đúng hình dạng thật). */
const HN_BOUNDARY_RING=[[21.15700,105.28896],[21.13167,105.30959],[21.11162,105.32022],[21.09353,105.31680],[21.07115,105.30141],[21.05503,105.29430],[21.03736,105.29684],[21.02068,105.30625],[21.01385,105.31642],[21.01909,105.32214],[21.02027,105.32037],[21.02407,105.32886],[21.02231,105.33136],[21.01664,105.32883],[21.01635,105.32670],[21.01382,105.32774],[21.00997,105.32500],[21.00871,105.32649],[21.00848,105.33371],[21.01346,105.33886],[21.01425,105.34788],[21.00740,105.35346],[21.01361,105.37425],[21.02441,105.38751],[21.01772,105.38681],[21.01417,105.39369],[21.00727,105.39192],[21.00287,105.39345],[20.99807,105.40333],[20.99974,105.40951],[20.99694,105.41362],[20.99766,105.41842],[20.99261,105.41793],[20.98344,105.42161],[20.98136,105.42857],[20.97342,105.43052],[20.96421,105.44224],[20.95642,105.44421],[20.95332,105.45330],[20.94698,105.46106],[20.94573,105.46601],[20.94861,105.47056],[20.94871,105.47820],[20.93540,105.48856],[20.93040,105.50253],[20.92231,105.51256],[20.92244,105.52092],[20.91906,105.52521],[20.92751,105.53864],[20.92312,105.54614],[20.92718,105.55241],[20.92448,105.56087],[20.92778,105.57107],[20.93011,105.57079],[20.92820,105.58148],[20.92067,105.57887],[20.91642,105.58029],[20.90979,105.55991],[20.90818,105.55792],[20.90585,105.56029],[20.90533,105.55582],[20.89867,105.56379],[20.89808,105.56125],[20.89075,105.55984],[20.88635,105.55498],[20.88369,105.55617],[20.88324,105.55285],[20.87968,105.55412],[20.88080,105.55928],[20.87556,105.56166],[20.87511,105.56594],[20.86729,105.57553],[20.86402,105.57547],[20.85720,105.58574],[20.84840,105.58475],[20.84505,105.58553],[20.84488,105.58814],[20.83615,105.58035],[20.82484,105.57780],[20.82170,105.57190],[20.82190,105.56225],[20.81140,105.55846],[20.80793,105.55102],[20.80792,105.57549],[20.81182,105.58336],[20.81717,105.58395],[20.82094,105.58806],[20.82908,105.58788],[20.83128,105.59605],[20.83385,105.59800],[20.83864,105.59697],[20.84142,105.60095],[20.83858,105.60329],[20.83782,105.61013],[20.83147,105.61665],[20.83178,105.62408],[20.83935,105.63671],[20.83283,105.63553],[20.83303,105.64169],[20.82410,105.64118],[20.82084,105.63022],[20.82031,105.63223],[20.81715,105.63132],[20.81571,105.62738],[20.81392,105.63228],[20.80302,105.63250],[20.80202,105.63469],[20.79367,105.63071],[20.79296,105.63338],[20.79545,105.63590],[20.79191,105.64168],[20.79644,105.64503],[20.79576,105.64660],[20.75348,105.65125],[20.75290,105.65379],[20.74106,105.65786],[20.73504,105.66706],[20.72262,105.66187],[20.71723,105.66402],[20.69546,105.68253],[20.69103,105.67946],[20.68376,105.67890],[20.68024,105.66871],[20.66365,105.67527],[20.66567,105.67754],[20.67150,105.67691],[20.65241,105.68091],[20.64667,105.67859],[20.64024,105.68209],[20.63792,105.68656],[20.63511,105.68357],[20.63300,105.68477],[20.62841,105.67836],[20.62919,105.67325],[20.63222,105.67109],[20.62813,105.66356],[20.62353,105.66675],[20.61699,105.66619],[20.61599,105.68643],[20.62131,105.69065],[20.61976,105.69699],[20.62136,105.70123],[20.60921,105.70531],[20.60265,105.70404],[20.59870,105.70829],[20.59645,105.72019],[20.60536,105.72735],[20.59962,105.73288],[20.59946,105.74199],[20.57588,105.76482],[20.56508,105.76877],[20.56485,105.78215],[20.56926,105.79631],[20.58455,105.80173],[20.59322,105.80128],[20.59946,105.80542],[20.59731,105.80776],[20.60058,105.80693],[20.60444,105.81163],[20.60993,105.80560],[20.61878,105.81491],[20.62238,105.81327],[20.62487,105.81477],[20.62812,105.81107],[20.63341,105.81329],[20.64760,105.83389],[20.66082,105.81951],[20.66206,105.82301],[20.66447,105.82306],[20.65906,105.84049],[20.65717,105.84023],[20.65323,105.84920],[20.64530,105.85676],[20.64302,105.87849],[20.65184,105.89607],[20.66891,105.89612],[20.66467,105.90562],[20.66841,105.90541],[20.68011,105.93236],[20.68122,105.94424],[20.67635,105.94669],[20.66778,105.94677],[20.66372,105.94324],[20.65795,105.94350],[20.65417,105.94653],[20.65079,105.95799],[20.65919,105.95835],[20.66491,105.96717],[20.66574,105.97753],[20.67380,105.97846],[20.68462,105.99008],[20.68159,105.99479],[20.67859,105.99234],[20.67837,105.99749],[20.68920,105.99187],[20.69237,105.99803],[20.69744,105.99563],[20.70435,106.00392],[20.70402,105.99001],[20.70021,105.98255],[20.69996,105.97384],[20.72497,105.96415],[20.73416,105.96809],[20.77324,105.96691],[20.77916,105.96030],[20.78368,105.93763],[20.78819,105.92685],[20.79806,105.91895],[20.81455,105.91264],[20.82496,105.91071],[20.83510,105.91277],[20.84212,105.91685],[20.85154,105.93328],[20.85679,105.93562],[20.86673,105.93551],[20.87377,105.93131],[20.89177,105.89856],[20.89779,105.89532],[20.90519,105.89916],[20.91816,105.91299],[20.92210,105.91269],[20.92633,105.90846],[20.93575,105.91580],[20.94715,105.90302],[20.97372,105.91299],[20.97574,105.92446],[20.97267,105.92984],[20.97359,105.93226],[20.96795,105.93979],[20.96930,105.94765],[20.96658,105.95185],[20.96821,105.95612],[20.96416,105.95916],[20.96341,105.96408],[20.97246,105.96471],[20.97587,105.96137],[20.98137,105.96178],[20.98502,105.96516],[20.98925,105.96165],[20.99102,105.96506],[20.98869,105.96883],[20.98972,105.97225],[20.99705,105.97171],[20.99890,105.97715],[20.99676,105.98518],[21.00103,105.99137],[20.99986,105.99965],[21.00749,106.00133],[21.00827,106.00845],[21.01226,106.00981],[21.01167,106.00447],[21.01506,106.00616],[21.01748,106.00328],[21.02204,106.00458],[21.02438,106.00944],[21.02885,106.00646],[21.03027,106.01286],[21.03437,106.01638],[21.04140,106.02004],[21.04762,106.02003],[21.05095,106.01390],[21.05596,106.01437],[21.05820,106.01135],[21.05553,106.00822],[21.06232,106.00957],[21.06888,106.00141],[21.07456,105.99964],[21.06893,105.99370],[21.07214,105.96819],[21.07374,105.96872],[21.07811,105.96189],[21.09136,105.95799],[21.08335,105.94019],[21.08995,105.94027],[21.09652,105.93447],[21.10152,105.93638],[21.11113,105.93100],[21.11643,105.92107],[21.12078,105.92330],[21.11848,105.92148],[21.11894,105.91559],[21.12264,105.91373],[21.12624,105.91292],[21.12993,105.91929],[21.13211,105.91780],[21.13536,105.92189],[21.13332,105.92460],[21.13815,105.92385],[21.14052,105.92632],[21.14692,105.92565],[21.14724,105.92344],[21.15531,105.91964],[21.16313,105.92256],[21.16319,105.91929],[21.17158,105.91686],[21.17374,105.92108],[21.17839,105.92024],[21.18272,105.92367],[21.18726,105.91535],[21.19237,105.91237],[21.19242,105.90705],[21.19677,105.90707],[21.20305,105.91373],[21.20697,105.90984],[21.20846,105.91553],[21.21505,105.91546],[21.22459,105.91047],[21.22248,105.90489],[21.22573,105.90406],[21.23220,105.90678],[21.23113,105.91935],[21.23514,105.92094],[21.24169,105.93292],[21.24543,105.93351],[21.24340,105.93788],[21.24512,105.93891],[21.27076,105.92301],[21.28718,105.92313],[21.29400,105.93173],[21.29478,105.91689],[21.30567,105.91699],[21.30158,105.90814],[21.30630,105.89848],[21.32433,105.89970],[21.32675,105.89813],[21.32980,105.87113],[21.32799,105.86707],[21.33800,105.86290],[21.33833,105.85848],[21.34245,105.85588],[21.34559,105.85640],[21.34560,105.85910],[21.34910,105.85248],[21.35253,105.85471],[21.35748,105.85166],[21.36995,105.85776],[21.37605,105.85713],[21.37440,105.84935],[21.37749,105.84717],[21.37752,105.84132],[21.37324,105.83213],[21.37569,105.83037],[21.37797,105.82137],[21.38302,105.81592],[21.38061,105.81280],[21.38542,105.80132],[21.38159,105.79909],[21.38251,105.79669],[21.37790,105.79023],[21.37583,105.78794],[21.37340,105.78973],[21.37040,105.78582],[21.35468,105.78634],[21.35352,105.78290],[21.34283,105.78501],[21.33707,105.77605],[21.32534,105.77186],[21.31349,105.76253],[21.30333,105.75947],[21.29736,105.75279],[21.29507,105.75341],[21.29594,105.74913],[21.29184,105.74523],[21.29270,105.74295],[21.29033,105.74279],[21.29042,105.74066],[21.28730,105.74196],[21.28696,105.73634],[21.27947,105.73586],[21.27938,105.73358],[21.27523,105.73261],[21.27579,105.72924],[21.27284,105.72528],[21.26956,105.72940],[21.26617,105.72448],[21.26271,105.72377],[21.25128,105.72334],[21.24876,105.72918],[21.24235,105.72516],[21.24172,105.73469],[21.23601,105.73745],[21.23548,105.73434],[21.23852,105.73022],[21.23314,105.73464],[21.22846,105.72962],[21.22479,105.72470],[21.22785,105.72182],[21.22327,105.71954],[21.22328,105.71227],[21.21963,105.70985],[21.22144,105.70511],[21.21861,105.70181],[21.21967,105.69857],[21.21357,105.69786],[21.22151,105.69333],[21.21988,105.69024],[21.22967,105.68587],[21.23035,105.68255],[21.23235,105.68811],[21.23475,105.68785],[21.23432,105.68091],[21.22694,105.67617],[21.23061,105.67122],[21.23366,105.67499],[21.23615,105.67464],[21.23306,105.66905],[21.23954,105.66709],[21.23466,105.66010],[21.23814,105.65242],[21.23665,105.64761],[21.23340,105.64408],[21.22723,105.64526],[21.22569,105.65129],[21.22758,105.65437],[21.22320,105.65865],[21.22032,105.65798],[21.21544,105.64536],[21.21741,105.63596],[21.21195,105.63928],[21.20727,105.63897],[21.21097,105.62887],[21.20590,105.62125],[21.20871,105.61678],[21.20763,105.61499],[21.20259,105.61623],[21.20071,105.62250],[21.19488,105.62155],[21.19361,105.62447],[21.18738,105.62506],[21.18488,105.62931],[21.18300,105.62706],[21.18064,105.62829],[21.18074,105.62438],[21.17814,105.62671],[21.17336,105.62632],[21.17819,105.62203],[21.17912,105.61731],[21.17452,105.60497],[21.16966,105.60006],[21.16405,105.57633],[21.16019,105.57075],[21.15590,105.53415],[21.15891,105.49849],[21.16551,105.48367],[21.17665,105.46956],[21.20091,105.46633],[21.20126,105.46390],[21.20631,105.46391],[21.20814,105.46125],[21.20868,105.46324],[21.21888,105.46108],[21.24537,105.44601],[21.27005,105.44397],[21.27411,105.43262],[21.29516,105.41165],[21.30451,105.39580],[21.30167,105.38817],[21.29618,105.38281],[21.29567,105.37753],[21.27853,105.35630],[21.26078,105.35626],[21.23003,105.34984],[21.21006,105.33931],[21.20822,105.34404],[21.20372,105.34177],[21.20119,105.33635],[21.20411,105.32919],[21.20323,105.32478],[21.19158,105.30369],[21.16986,105.29224],[21.15700,105.28896]];
/* Hình chữ nhật bao trọn phạm vi có thể kéo (HN_MAP_BOUNDS) + biên ranh giới Hà Nội bên trên tạo thành lớp
   phủ "khoét lỗ" (donut) — Leaflet mặc định vẽ đa giác nhiều vòng theo fill-rule evenodd nên vòng thứ 2 tự
   động thành lỗ hổng, không phụ thuộc chiều thuận/nghịch của toạ độ.
   QUAN TRỌNG: vòng ngoài chỉ nên lớn hơn HN_MAP_BOUNDS một chút (không phải cả Đông Nam Á như bản trước) —
   toạ độ quá xa khung nhìn khi quy đổi ra pixel ở mức zoom gần bị tràn số trên Canvas (preferCanvas:true),
   khiến trình duyệt vẽ sai thành cả khối đặc thay vì đúng hình vành khuyên — đã gặp lỗi này thực tế. */
function gisHanoiMaskRings(){
 return [[[19.8,104.5],[19.8,106.8],[22.2,106.8],[22.2,104.5]],HN_BOUNDARY_RING];
}
const GIS_STATUS_KEYS=['done','doing','soon','risk','overdue'];
function gisSeedNum(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function gisRng(seed){let s=seed>>>0||1;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function gisScopeKey(){return `${currentRole||''}|${currentSoId||''}|${currentXaId||''}`;}
function gisScopeLabel(){
 if(isTwRole(currentRole)) return roleMeta(currentRole).name||'Trung ương';
 if(currentXaId!=null){const n=wardNames()[Number(currentXaId)]; return n||'Xã/phường';}
 if(currentSoId){const cat=(categorySeed.UBND||[]).find(c=>c.id===currentSoId); return cat?cat.name:'Sở/ngành';}
 return roleMeta(currentRole)?.fullName||'Toàn Thành phố Hà Nội';
}
function gisScopeCenterZoom(rng){
 if(currentXaId!=null){
  const lat=HN_BOUNDS.latMin+rng()*(HN_BOUNDS.latMax-HN_BOUNDS.latMin);
  const lng=HN_BOUNDS.lngMin+rng()*(HN_BOUNDS.lngMax-HN_BOUNDS.lngMin);
  return {center:[lat,lng],zoom:15};
 }
 if(currentSoId) return {center:HN_CENTER,zoom:14};
 return {center:HN_CENTER,zoom:13};
}
function pad2(n){return String(n).padStart(2,'0');}
/* Đơn vị dân cư dưới cấp xã/phường: xã (nông thôn) chia theo Thôn, phường (đô thị) chia theo Tổ dân phố —
   chỉ dùng để gợi ý tìm kiếm trên bản đồ GIS (renderGisSearch), không phải 1 lớp bản đồ riêng. */
function wardIsXa(name){return (name||'').trim().startsWith('Xã');}
function updateGisSearchPlaceholder(){
 const inp=document.getElementById('gisMapSearch'); if(!inp) return;
 if(currentXaId!=null){
  const name=wardNames()[Number(currentXaId)]||'';
  inp.placeholder=`Tìm điểm nghẽn, ${wardIsXa(name)?'thôn':'tổ dân phố'}, trụ sở…`;
 } else {
  inp.placeholder='Tìm điểm nghẽn, khu dân cư, trụ sở…';
 }
}
function buildKhuDanCuData(center,rng,spread,isXa){
 const n=8+Math.floor(rng()*8);
 const type=isXa?'Thôn':'Tổ dân phố';
 const arr=[];
 for(let i=0;i<n;i++){
  const jitter=()=>(rng()-0.5)*2*spread;
  arr.push({id:'KDC-'+pad2(i+1),name:`${type} ${i+1}`,type,lat:center[0]+jitter(),lng:center[1]+jitter()});
 }
 return arr;
}
/* Bộ cụm từ mô tả cụ thể theo từng nhóm điểm nghẽn + mốc nhận biết/loại vị trí — dùng để sinh title/description/
   location_text đa dạng cho các phạm vi chưa có eForm thật (mọi xã/phường/sở ngoài view toàn Hà Nội) — vẫn là
   dữ liệu ước tính (ghi rõ trong data_source_note/gis_ai_notes), không bịa thành địa chỉ có thật. */
const GIS_ISSUE_POOL={
 URBAN_ORDER:['Lấn chiếm vỉa hè kinh doanh','Bày bán hàng rong trái phép trên lòng đường','Dựng mái che, lều bạt lấn chiếm vỉa hè','Đỗ xe sai quy định gây cản trở lối đi','Tụ tập buôn bán tự phát không đúng nơi quy định','Biển quảng cáo, vật dụng lấn chiếm không gian công cộng'],
 TRAFFIC_JAM:['Ùn tắc giờ cao điểm','Ùn ứ do công trình đang thi công','Xung đột dòng xe tại nút giao','Ùn tắc do đỗ xe trái phép ven đường','Ùn tắc cục bộ trước cổng trường/chợ','Ùn tắc do lượng phương tiện tăng đột biến'],
 ENVIRONMENT:['Rác thải tồn đọng chưa thu gom','Nước thải, mùi hôi từ cống rãnh','Bụi bẩn phát sinh từ công trình xây dựng','Ô nhiễm quanh khu vực chợ tạm','Tập kết rác sai giờ, sai nơi quy định','Mương thoát nước bị lấn chiếm, ứ đọng'],
 FOOD_SAFETY:['Cơ sở kinh doanh chưa đủ điều kiện an toàn thực phẩm','Thức ăn đường phố không rõ nguồn gốc','Cơ sở giết mổ, sơ chế không phép','Hàng quán gần trường học vi phạm vệ sinh','Nguyên liệu chế biến không rõ xuất xứ','Bếp ăn tập thể chưa đảm bảo điều kiện vệ sinh'],
 URBAN_FLOOD:['Ngập úng sau mưa lớn','Ngập cục bộ do tắc nghẽn cống thoát nước','Ngập tại điểm trũng khu dân cư','Ngập tại nút giao thông trọng điểm','Ngập tầng hầm, khu vực thấp trũng','Ngập kéo dài do hệ thống thoát nước quá tải']
};
const GIS_LANDMARK_POOL=['gần chợ dân sinh','gần cổng trường học','gần trạm y tế','khu tập thể cũ','ven sông/kênh mương','gần khu công nghiệp','chân cầu vượt/cầu chui','khu vực chợ tạm','tuyến phố kinh doanh sầm uất','ngõ/hẻm dân cư đông đúc'];
const GIS_LOCATION_TYPE_POOL=['Tuyến đường','Ngõ dân cư','Khu vực chợ','Nút giao','Trục đường chính','Khu tập thể','Cổng chợ','Đoạn đường trước trường học'];
function gisOneEform(bcode,idx,rng,center,jitter,label){
 const b=GIS_BOTTLENECKS.find(x=>x.code===bcode);
 const status=GIS_STATUS_KEYS[Math.floor(rng()*GIS_STATUS_KEYS.length)];
 const issue=GIS_ISSUE_POOL[bcode][Math.floor(rng()*GIS_ISSUE_POOL[bcode].length)];
 const landmark=GIS_LANDMARK_POOL[Math.floor(rng()*GIS_LANDMARK_POOL.length)];
 const locType=GIS_LOCATION_TYPE_POOL[Math.floor(rng()*GIS_LOCATION_TYPE_POOL.length)];
 return {
  id:bcode+'-'+pad2(idx),
  bottleneck_code:bcode,
  title:`${issue} tại ${label}`,
  description:`Ghi nhận ${issue.toLowerCase()} tại ${locType.toLowerCase()} thuộc ${label}, ${landmark}; cần xác minh hiện trường và cập nhật kết quả xử lý.`,
  location_text:`${locType} ${landmark}, ${label}`,
  landmark:landmark.charAt(0).toUpperCase()+landmark.slice(1),
  lat:center[0]+jitter(),lng:center[1]+jitter(),
  responsible_org_id:b.org,coordinating_org_ids:b.coord,
  /* Khớp due_at với đúng status vừa random ở trên: 'overdue' phải có hạn đã trôi qua (ngày âm), các trạng thái
     còn lại phải có hạn còn trong tương lai — trước đây due_at random độc lập với status, có thể ra hạn tương
     lai cho bản ghi 'overdue' (vô lý) hoặc hạn quá khứ cho bản ghi 'doing' (chưa gắn overdue dù đã trễ hạn). */
  due_at:status==='overdue'?gisFutureDateStr(-(1+Math.floor(rng()*10))):gisFutureDateStr(2+Math.floor(rng()*40)),
  danger_level:1+Math.floor(rng()*5),emergency_level:1+Math.floor(rng()*5),
  completeness_score:Math.round((0.7+rng()*0.25)*100)/100,
  user_notes:status==='overdue'?'Đã quá hạn xử lý, cần đôn đốc.':status==='done'?'Đã xử lý xong, đang chờ xác nhận đóng.':'Đã tiếp nhận, đang theo dõi xử lý.',
  gis_ai_notes:'Dữ liệu ước tính theo phạm vi tài khoản (chưa có eForm thật cho đơn vị này).',
  data_source_note:'Sinh tự động theo seed tài khoản — cần thay bằng dữ liệu eForm thật khi triển khai.',
  status,linkedRecordId:null,reportCount:1,relatedReports:[],images:[],received_at:Date.now()
 };
}
function gisBuildSyntheticEform(rng,center,jitter,label,n){
 const arr=[]; for(let i=0;i<n;i++) arr.push(gisOneEform(GIS_BOTTLENECKS[i%GIS_BOTTLENECKS.length].code,i+1,rng,center,jitter,label));
 /* Mọi xã/phường đều luôn có ít nhất 1 điểm "Ùn tắc giao thông" và 1 điểm "Ngập úng đô thị" — 2 vấn đề này
    gần như xã/phường nào cũng gặp. */
 if(currentXaId!=null){
  arr.push(gisOneEform('TRAFFIC_JAM','TD',rng,center,jitter,label));
  arr.push(gisOneEform('URBAN_FLOOD','NU',rng,center,jitter,label));
 }
 return arr;
}
function buildGisScopeData(){
 const label=gisScopeLabel();
 const rng=gisRng(gisSeedNum(gisScopeKey()||'default'));
 const {center,zoom}=gisScopeCenterZoom(rng);
 const spread=currentXaId!=null?0.006:(currentSoId?0.05:0.07);
 const jitter=()=>(rng()-0.5)*2*spread;
 const kdc=currentXaId!=null?buildKhuDanCuData(center,gisRng(gisSeedNum('khudancu|'+gisScopeKey())),spread*1.2,wardIsXa(label)):[];
 /* Trước đây tài khoản Trung ương (isTwRole) bị loại khỏi "toàn thành phố" nên luôn nhận dữ liệu ước tính
    (jitter ngẫu nhiên quanh tâm thành phố) thay vì 25 điểm nghẽn + 6 điểm cháy nổ thật ở trên — trong khi đó
    vẫn là ĐÚNG 1 lớp bản đồ GIS của Hà Nội, chỉ khác nhãn tài khoản đang xem, nên toạ độ không có lý do gì
    khác nhau giữa 2 trường hợp. Bỏ điều kiện loại trừ để Trung ương cũng thấy đúng vị trí thật như Thành ủy. */
 const isCityWide=currentXaId==null&&!currentSoId;
 const nEform=currentXaId!=null?8:(currentSoId?10:15);
 const baseEform=isCityWide?GIS_EFORM_SEED:gisBuildSyntheticEform(rng,center,jitter,label,nEform);
 const nTs=currentXaId!=null?5:(currentSoId?4:6);
 /* Lớp "Cháy nổ" — vị trí sự cố cháy/nổ ước tính (seed cố định theo tài khoản). Gộp thẳng vào `eform` (cùng
    bottleneck_code:'truso', đủ status/linkedRecordId/reportCount) để dùng ĐÚNG 1 pipeline màu/popup/Giao xử lý
    như 5 nhóm điểm nghẽn kia — xem ghi chú tại GIS_TRUSO_SEED phía trên. */
 const tsNames=currentXaId!=null?['Cháy nhà dân','Cháy ki-ốt chợ','Nổ bình gas','Cháy phương tiện','Chập điện']:['Cháy nhà dân','Cháy chợ/trung tâm thương mại','Cháy xưởng sản xuất','Cháy phương tiện giao thông','Nổ khí gas','Cháy rừng/bãi rác'];
 const CHAYNO_LEVELS=['Nhẹ','Trung bình','Nghiêm trọng'];
 /* danger_level dạng số song song với CHAYNO_LEVELS (cùng chỉ số i%3) — trước đây "cháy nổ" chỉ có nhãn chữ
    trong chuc_nang, không có số nên bị loại khỏi vòng glow "Mức độ nguy hiểm" (chỉ chạy qua gisEformData).
    Nhẹ→2 (Thấp), Trung bình→3 (TB), Nghiêm trọng→5 (Khẩn cấp, vì cháy nổ mức nghiêm trọng luôn cần ưu tiên cao nhất). */
 const CHAYNO_DANGER=[2,3,5];
 const CHAYNO_STATUS=['Đang xử lý','Đang kiểm soát','Đã dập tắt'];
 /* Toàn thành phố dùng đúng 6 vị trí thật (GIS_TRUSO_SEED) như 25 điểm nghẽn ở trên, thay vì rải ngẫu nhiên
    quanh tâm thành phố (có thể lệch vào sông/hồ/ruộng, không gắn với địa danh cụ thể nào). Phạm vi hẹp hơn
    (xã/phường, sở/ngành) vẫn chưa có seed thật riêng nên tiếp tục dùng vị trí ước tính quanh tâm phạm vi. */
 const ts=isCityWide?GIS_TRUSO_SEED:(()=>{
  const arr=[]; for(let i=0;i<nTs;i++){
   const nm=`${tsNames[i%tsNames.length]} ${label}`;
   const lvlLabel=CHAYNO_LEVELS[i%CHAYNO_LEVELS.length],statusLabel=CHAYNO_STATUS[i%CHAYNO_STATUS.length];
   const done=statusLabel==='Đã dập tắt';
   /* Cùng bộ trường chuẩn hoá như GIS_TRUSO_SEED ở trên (xem ghi chú tại đó) — áp dụng luôn cho dữ liệu ước
      tính theo phạm vi hẹp (xã/phường, sở/ngành), không riêng view toàn thành phố. */
   arr.push({id:'CN-'+pad2(i+1),bottleneck_code:'truso',name:nm,lat:center[0]+jitter(),lng:center[1]+jitter(),
    danger_level:CHAYNO_DANGER[i%3],emergency_level:CHAYNO_DANGER[i%3],chuc_nang:`Mức độ: ${lvlLabel} · ${statusLabel}`,
    title:nm,description:`Mức độ: ${lvlLabel} · ${statusLabel}`,location_text:nm,landmark:'',
    responsible_org_id:GIS_TRUSO_META.org,coordinating_org_ids:GIS_TRUSO_META.coord,
    due_at:gisFutureDateStr(2+i),completeness_score:0.82,
    user_notes:done?'Đã dập tắt/khống chế xong; đang chờ xác nhận đóng.':`${statusLabel}; cần theo dõi tiếp diễn biến hiện trường.`,
    gis_ai_notes:'Dữ liệu ước tính theo phạm vi tài khoản (chưa có eForm thật cho đơn vị này).',
    data_source_note:'Sinh tự động theo seed tài khoản — cần thay bằng dữ liệu eForm thật khi triển khai.',
    status:done?'done':'soon',linkedRecordId:null,reportCount:1,relatedReports:[],images:[],received_at:Date.now()});
  }
  return arr;
 })();
 const eform=baseEform.concat(ts);
 return {label,center,zoom,eform,kdc};
}
function refreshGisScope(){
 const d=buildGisScopeData();
 gisEformData=d.eform; gisKhuDanCuData=d.kdc||[];
 /* Đổi phạm vi xem = đổi hẳn bối cảnh dữ liệu — báo cáo người dùng tạo ở phạm vi cũ không còn liên
    quan, xóa luôn kể cả lịch sử đã xử lý (không đồng bộ báo cáo giữa các phạm vi/tài khoản). */
 gisEformHistory=[]; gisReportTab='active';
 /* Đổi phạm vi = đổi hẳn dữ liệu gisEformData — mọi hẹn giờ tự ẩn (gisScheduleAutoHide) đang chờ trên bộ dữ
    liệu cũ phải huỷ, nếu không khi hết giờ chúng sẽ thao tác nhầm lên dữ liệu của phạm vi mới. */
 GM.completionTimers.forEach(t=>clearTimeout(t));
 GM.completionTimers.clear();
 const titleEl=document.getElementById('gisWidgetTitle');
 if(titleEl) titleEl.textContent=`🗺️ BẢN ĐỒ GIS – ${d.label} · 5 nhóm điểm nghẽn`;
 updateGisSearchPlaceholder();
 if(GM.map){
  [...GIS_BOTTLENECKS.map(b=>b.code),...GIS_EMERGENCY_TYPES.map(e=>e.code),'zones'].forEach(k=>{if(GM.groups[k]){GM.map.removeLayer(GM.groups[k]);if(typeof GM.groups[k].clearLayers==='function')GM.groups[k].clearLayers();}});
  GM.markerRefs.clear();
  GM.userZones=[];
  createGisGroups();
  GM.map.invalidateSize();
  GM.map.setView(d.center,d.zoom,{animate:false});
  setTimeout(()=>{GM.map.invalidateSize();GM.map.setView(d.center,d.zoom,{animate:false});},260);
 }
}
const GM={map:null,base:'dark',baseLayer:null,labelLayer:null,groups:{},zoneLayer:null,markerRefs:new Map(),draw:{active:false,points:[],line:null},userZones:[],pinActive:false,completionTimers:new Map(),reportDraft:null};

/* ============================== BÁO CÁO NGƯỜI DÙNG (nhập liệu GIS) ==============================
   Bản ghi do người dùng tự tạo trên bản đồ (source_type:'user_report') — khác 25 bản ghi eForm mẫu
   thật và dữ liệu ước tính theo phạm vi tài khoản (synthetic), nên KHÔNG bị buildGisScopeData() ghi
   đè; chỉ bị xóa khi đổi phạm vi xem (refreshGisScope) vì lúc đó cả bối cảnh dữ liệu đã đổi hẳn.
   Mức độ nguy hiểm không cho nhập tay — tự tính từ số lượng PHẢN ÁNH TRÙNG VỊ TRÍ đã gộp vào bản ghi
   (rec.reportCount, xem gisFindMergeTarget) qua gisDangerFromReportCount, đúng kịch bản nghiệp vụ.
   Khi bấm "Hoàn thành xử lý" (gisCompleteReport), marker chuyển xanh lá rồi tự ẩn khỏi bản đồ sau
   GIS_AUTO_HIDE_MS (xem gisScheduleAutoHide) — bản ghi vẫn được giữ trong gisEformHistory để xem lại. */
let gisEformHistory=[];
let gisUserReportSeq=0;
let gisReportTab='active';
/* Tham số n giờ là SỐ LẦN PHẢN ÁNH TRÙNG VỊ TRÍ đã gộp vào 1 điểm (rec.reportCount), không còn là "số người
   báo cáo" nhập tay như bản cũ — giữ nguyên ngưỡng quy đổi, chỉ đổi ý nghĩa đầu vào. */
function gisDangerFromReportCount(n){
 n=Math.max(1,Number(n)||1);
 if(n<=2)return 2;
 if(n<=5)return 3;
 if(n<=10)return 4;
 return 5;
}
/* Kịch bản gốc: "Trên 05 phản ánh" tại cùng 1 điểm/vị trí → marker chuyển đỏ (xem gisMarkerStateColor). */
const GIS_REPORT_RED_THRESHOLD=5;
/* "Cùng một điểm/vị trí" = trong bán kính ~150m quanh 1 bản ghi CÙNG nhóm điểm nghẽn, chưa hoàn thành xử lý —
   đủ chặt để không gộp nhầm 2 sự việc khác nhau ở 2 đầu phố, đủ rộng để không bắt người dùng ghim đúng tuyệt
   đối 1 toạ độ. ~0.0015° ở vĩ độ Hà Nội (~21°N) tương đương ~150-165m theo cả lat lẫn lng. */
const GIS_MERGE_RADIUS_DEG=0.0015;
function gisFindMergeTarget(bcode,lat,lng){
 return (gisEformData||[]).find(r=>r.bottleneck_code===bcode&&r.status!=='done'&&Math.abs(r.lat-lat)<GIS_MERGE_RADIUS_DEG&&Math.abs(r.lng-lng)<GIS_MERGE_RADIUS_DEG);
}
/* Toạ độ trung tâm CỐ ĐỊNH (seed theo chính xaId, không phụ thuộc tài khoản đang đăng nhập) cho 1 xã/phường bất
   kỳ trong 126 đơn vị — dùng để bản đồ bay tới khi người dùng chọn địa bàn trong form báo cáo, khác với
   gisScopeCenterZoom() vốn chỉ tính tâm cho xã/phường của TÀI KHOẢN đang xem. */
function gisWardCenter(xaId){
 const rng=gisRng(gisSeedNum('wardcenter|'+xaId));
 const lat=HN_BOUNDS.latMin+rng()*(HN_BOUNDS.latMax-HN_BOUNDS.latMin);
 const lng=HN_BOUNDS.lngMin+rng()*(HN_BOUNDS.lngMax-HN_BOUNDS.lngMin);
 return [lat,lng];
}
/* Kịch bản gốc: marker "Đã xử lý" (xanh lá) tự ẩn khỏi bản đồ sau ĐÚNG 1 giờ. Rút ngắn còn 1 phút ở bản demo
   này để anh xem được kết quả ngay khi kiểm thử — đổi lại thành 60*60*1000 khi triển khai thật. */
const GIS_AUTO_HIDE_MS=60*1000;

/* Icon ảnh thật (PNG do anh cung cấp trong assets/images) cho từng nhóm điểm nghẽn + Cháy nổ — thay cho bộ
   SVG viền mảnh trước đây. object-fit:contain để ảnh không méo dù kích thước gốc khác tỉ lệ khung marker. */
const GIS_MARKER_SVG={
 URBAN_ORDER:'<img src="assets/images/trattudothi.png" alt="Trật tự đô thị" style="width:100%;height:100%;object-fit:contain"/>',
 TRAFFIC_JAM:'<img src="assets/images/untacgiaothong.png" alt="Ùn tắc giao thông" style="width:100%;height:100%;object-fit:contain"/>',
 ENVIRONMENT:'<img src="assets/images/vesinhmoitruong.png" alt="Vệ sinh môi trường" style="width:100%;height:100%;object-fit:contain"/>',
 FOOD_SAFETY:'<img src="assets/images/vesinhantoanthucpham.png" alt="An toàn thực phẩm" style="width:100%;height:100%;object-fit:contain"/>',
 URBAN_FLOOD:'<img src="assets/images/ngaplut.png" alt="Ngập úng đô thị" style="width:100%;height:100%;object-fit:contain"/>',
 truso:'<img src="assets/images/chayno.png" alt="Cháy nổ" style="width:100%;height:100%;object-fit:contain"/>',
 /* Chưa có ảnh PNG riêng cho 3 loại "Sự cố khẩn cấp" mới → dùng emoji làm icon tạm, cỡ chữ tính theo size
    truyền vào (hàm thay vì chuỗi tĩnh) để vẫn to/nhỏ đúng theo zoom như các icon ảnh khác. */
 DISASTER:size=>`<span style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${Math.round((size||14)*0.8)}px;line-height:1">🌪️</span>`,
 SECURITY:size=>`<span style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${Math.round((size||14)*0.8)}px;line-height:1">🚨</span>`,
 SOCIAL:size=>`<span style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${Math.round((size||14)*0.8)}px;line-height:1">🆘</span>`
};
/* Icon nhỏ dùng ở chip/popup (không phải marker bản đồ) — dùng chung đúng 1 bộ SVG với marker để 2 nơi luôn khớp nhau. */
function gisInlineIconHtml(svgKey,px,color){
 px=px||14;
 const raw=GIS_MARKER_SVG[svgKey];
 const svg=typeof raw==='function'?raw(px):(raw||'');
 return `<span style="display:inline-flex;width:${px}px;height:${px}px;vertical-align:-2px;color:${color||'inherit'}">${svg}</span>`;
}
/* Marker = nền màu (color40, đậm hơn bản trước color22 để viền trạng thái dễ nhận ra ở khoảng cách xa), viền
   ĐẶC màu trạng thái (không alpha, trước là color88 mờ), cộng 1 quầng nhấp nháy động (.gis-marker-pulse).
   iconSize tăng tỉ lệ 0.4→0.6 so với khung marker để ảnh icon bên trong không bị "chìm" trong khung tròn. */
function gisMarkerIcon(color,svgKey,size){
 size=size||GIS_MARKER_SIZE_DEFAULT;
 const svgRaw=GIS_MARKER_SVG[svgKey];
 /* Icon là ảnh VUÔNG — hình vuông nội tiếp vừa khít 1 vòng tròn tối đa chỉ ~70.7% đường kính (cạnh × căn2 =
    đường kính), quá mốc đó là 4 góc vuông của ảnh sẽ chọc ra ngoài viền tròn (đã xảy ra ở tỉ lệ .78). Dùng 2
    lớp khung riêng: khung CẮT (clipSize, .70 — sát ngưỡng an toàn 70.7%, không đổi) đứng yên ở giữa marker,
    và khung ICON THẬT (iconSize, .62 — nhỏ hơn khung cắt) nằm bên trong, được dịch lên ~6% để "căn tâm quang
    học" (bù ảo giác thị giác của hình tam giác — đỉnh nhọn trên/đáy rộng dưới luôn trông lệch xuống nếu đặt
    đúng tâm hình học, đã đo pixel thật xác nhận ảnh gốc không lệch). Khung cắt RỘNG HƠN khung icon đúng bằng
    phần dịch lên, nên phần bị dịch vẫn nằm trong vùng cắt — không còn bị mất góc như bản trước (dịch icon
    nhưng khung cắt khít đúng bằng icon, phần dịch lên bị hụt mất). */
 const clipSize=Math.round(size*0.70);
 /* Lần trước khoảng đệm giữa khung cắt (.70) và icon (.62) chỉ ~4% size, gần bằng đúng phần dịch lên (6% của
    .62 ≈ 3.7% size) — sát nút, làm tròn số (Math.round) đủ để vẫn hụt mất 1 chút ở đỉnh. Co icon nhỏ lại .58
    (đệm rộng ra ~6% size) và giảm mức dịch còn 5%-của-icon (~2.9% size) để có khoảng dư an toàn rõ ràng hơn. */
 const iconSize=Math.round(size*0.58);
 const opticalOffset=Math.round(iconSize*0.05);
 const svg=typeof svgRaw==='function'?svgRaw(iconSize):(svgRaw||'');
 return L.divIcon({className:'',html:`<div class="gis-marker" style="color:${color};background:${color}40;border:2.5px solid ${color};width:${size}px;height:${size}px"><span class="gis-marker-pulse" style="color:${color}"></span><span style="width:${clipSize}px;height:${clipSize}px;display:flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden"><span style="width:${iconSize}px;height:${iconSize}px;display:flex;flex-shrink:0;transform:translateY(-${opticalOffset}px)">${svg}</span></span></div>`,iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-size/2]});
}
/* Kích thước marker theo mức zoom hiện tại — nội suy TUYẾN TÍNH giữa zoom 12 (28px) và zoom 20 (90px), thay vì
   vài mốc rời rạc, để marker to dần MỖI khi kéo zoom (kể cả zoom nhẹ 1-2 mức) chứ không phải chờ nhảy qua hẳn
   1 ngưỡng cao mới thấy đổi — gisRefreshMarkerSizes() gọi hàm này mỗi khi bản đồ đổi zoom. Mốc max KHỚP ĐÚNG
   zoom tối đa thật của nền bản đồ (maxZoom:20 ở gisTileLayer) — trước để mốc max ở 19 nên tới Z20 marker đã
   "hết cỡ" từ trước, không to thêm được nữa dù màn hình còn rất nhiều khoảng trống. */
const GIS_MARKER_SIZE_DEFAULT=34;
const GIS_MARKER_ZOOM_MIN=12, GIS_MARKER_ZOOM_MAX=20, GIS_MARKER_SIZE_MIN=28, GIS_MARKER_SIZE_MAX=140;
function gisMarkerSizeForZoom(zoom){
 const t=Math.min(1,Math.max(0,(zoom-GIS_MARKER_ZOOM_MIN)/(GIS_MARKER_ZOOM_MAX-GIS_MARKER_ZOOM_MIN)));
 return Math.round(GIS_MARKER_SIZE_MIN+(GIS_MARKER_SIZE_MAX-GIS_MARKER_SIZE_MIN)*t);
}
/* Vẽ lại toàn bộ marker (eForm + Cháy nổ) theo size đúng zoom hiện tại. Với marker thuộc L.markerClusterGroup,
   setIcon() một marker ĐANG bị gộp trong cụm không tự vẽ lại DOM (marker đó chưa thật sự nằm trên bản đồ, chỉ
   nằm trong cụm) — phải gọi group.refreshClusters() (không tham số = làm mới toàn bộ cụm của group đó) sau khi
   đã setIcon xong cho tất cả marker, để Leaflet.markercluster tính lại & vẽ lại đúng ngay, không cần chờ zoom
   thêm lần nữa. Đây cũng chính là hàm fix lỗi "viền màu không đúng trạng thái" sau khi Giao xử lý/Hoàn thành
   xử lý/gộp báo cáo. */
function gisRefreshMarkerSizes(){
 if(!GM.map)return;
 const size=gisMarkerSizeForZoom(GM.map.getZoom());
 const touchedGroups=new Set();
 gisEformData.forEach(rec=>{
  const m=GM.markerRefs.get(rec.id);if(!m)return;
  const b=gisBottleneckMeta(rec.bottleneck_code);
  m.setIcon(gisMarkerIcon(gisMarkerStateColor(rec),b.code,size));
  touchedGroups.add(rec.bottleneck_code);
 });
 touchedGroups.forEach(key=>{
  const grp=GM.groups[key];
  if(grp&&typeof grp.refreshClusters==='function')grp.refreshClusters();
 });
}
function gisBadgeHtml(col,label){return '<span class="gis-pb" style="background:'+col+'22;color:'+col+';border:1px solid '+col+'55">'+label+'</span>';}
/* "2026-07-30 17:00" (định dạng detected_at/due_at trong sheet) → "17:00 30/07/2026". */
function gisFmtDue(s){const m=/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})$/.exec(s||'');return m?`${m[4]} ${m[3]}/${m[2]}/${m[1]}`:(s||'—');}
function gisDangerColor(n){return n>=5?'#d33a44':n===4?'#d25a19':n===3?'#d8a50c':'#2fb174';}
function gisDangerLabel(n){return n>=5?'Khẩn cấp':n===4?'Cao':n===3?'Trung bình':'Thấp';}
/* Màu marker theo ĐÚNG kịch bản nghiệp vụ 5 bước (khác màu theo nhóm điểm nghẽn dùng cho icon ảnh):
   chưa xử lý ≤5 phản ánh trùng vị trí → vàng, chưa xử lý >5 phản ánh → đỏ, đã "Giao xử lý" → xanh dương,
   đã "Hoàn thành xử lý" (đang chờ tự ẩn) → xanh lá. Tái dùng đúng bảng gisStatusColor có sẵn, không thêm
   palette mới. */
function gisMarkerStateColor(rec){
 /* Mọi loại "Sự cố khẩn cấp" (Cháy nổ, Thiên tai, An ninh trật tự, Sự cố xã hội) luôn cảnh báo mức cao nhất
    (đỏ) bất kể trạng thái xử lý — yêu cầu nghiệp vụ: sự cố khẩn cấp không bao giờ được hạ mức cảnh báo trên
    bản đồ như 5 nhóm điểm nghẽn thường. */
 if(gisIsEmergencyCode(rec.bottleneck_code)) return gisStatusColor.overdue;
 if(rec.status==='done') return gisStatusColor.done;
 if(rec.linkedRecordId||rec.demoLinked) return gisStatusColor.doing;
 return (rec.reportCount||1)>=GIS_REPORT_RED_THRESHOLD?gisStatusColor.overdue:gisStatusColor.soon;
}
/* Nhãn chữ đi kèm gisMarkerStateColor() — dùng thay cho gisStatusLabel[status] cũ (done/doing/soon/risk/
   overdue, không khớp đúng 4 trạng thái của kịch bản) ở mọi nơi hiển thị trạng thái điểm nghẽn cho người dùng. */
function gisStateLabel(rec){
 if(rec.status==='done') return 'Đã hoàn thành xử lý';
 if(rec.linkedRecordId||rec.demoLinked) return 'Đang xử lý';
 return 'Chưa xử lý ('+(rec.reportCount||1)+' phản ánh)';
}
/* Mốc thời gian dạng epoch ms (Date.now()) — dùng cho "Thời gian nhận phản ánh" (rec.received_at), khác định
   dạng chuỗi "YYYY-MM-DD HH:MM" của due_at/gisFmtDue (dữ liệu sheet). */
function gisFmtTimestamp(ts){
 if(!ts) return '—';
 const d=new Date(ts);
 return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;
}
function gisOrgLabel(code){return GIS_ORG_LABELS[code]||code||'—';}
/* Mọi theme dùng chung ảnh vệ tinh (xem gisTileUrls) — theme "dark" gắn thêm className để CSS làm tối ảnh
   (xem .gis-tile-dark trong gis.css). Theme lạ (vd "contrast"/OSM cũ) rơi về "dark". */
function gisTileLayer(theme){const t=gisTileUrls[theme]||gisTileUrls.dark;const opt={maxZoom:19,attribution:t[1]};if(theme==='dark')opt.className='gis-tile-dark';return L.tileLayer(t[0],opt);}
function gisSetTheme(theme){
 if(!GM.map)return;
 if(GM.baseLayer)GM.map.removeLayer(GM.baseLayer);
 if(GM.labelLayer){GM.map.removeLayer(GM.labelLayer);GM.labelLayer=null;}
 if(!gisTileUrls[theme])theme='dark';
 GM.base=theme;GM.baseLayer=gisTileLayer(theme).addTo(GM.map);
 /* Lớp nhãn phố phủ lên ảnh vệ tinh trước đây lấy từ basemaps.cartocdn.com (dark_only_labels) — cùng
    domain bị CARTO yêu cầu API key ở gisTileUrls, nên bỏ hẳn lớp này thay vì hiện watermark "API KEY
    REQUIRED" đè lên ảnh vệ tinh; vệ tinh vẫn xem được, chỉ không còn nhãn tên phố/địa danh phủ thêm. */
 const lbl={dark:'Vệ tinh tối',light:'Vệ tinh sáng',satellite:'Ảnh vệ tinh'};
 const ll=document.getElementById('gisLiveLabel');if(ll)ll.textContent='GIS trực tuyến • '+lbl[theme];
 const sel=document.getElementById('gisBaseSelect');if(sel)sel.value=theme;
}
/* Khung popup DÙNG CHUNG cho MỌI loại marker trên bản đồ GIS (5 nhóm điểm nghẽn lẫn Cháy nổ) — 1 nơi duy nhất
   định nghĩa cấu trúc/thứ tự khối/cỡ chữ, tránh việc 2 nơi viết tay riêng rồi lệch nhau về sau (đã xảy ra 1
   lần với popup Cháy nổ trước đây). Khác biệt nội dung giữa các loại marker truyền vào qua opts — bản thân
   khung (title → khối nội dung → các dòng thông tin → badge → nút hành động) không đổi. */
function gisPopupShell(opts){
 return '<h4 class="gis-popup-title">'+gisInlineIconHtml(opts.iconKey,26,opts.iconColor)+' '+esc(opts.title)+'</h4>'
 +'<div class="manual-note gis-popup-content"><b>'+esc(opts.contentLabel)+'</b><br>'+opts.contentHtml+'</div>'
 +(opts.rowsHtml||'')
 +(opts.badgeHtml||'')
 +(opts.actionsHtml?'<div class="action-bar" style="margin-top:10px;flex-wrap:wrap">'+opts.actionsHtml+'</div>':'');
}
/* 1 nút hành động trong popup — dùng chung style mặc định (viền/nền trung tính), truyền `style` để ghi đè màu
   riêng (VD nút "Hoàn thành xử lý" tông xanh lá) mà không phải chép lại toàn bộ khai báo style mỗi nơi gọi. */
function gisPopupActionBtn(onclickJs,label,style){
 return '<button onclick="'+onclickJs+'" style="font-size:12.5px;padding:7px 14px;border-radius:6px;cursor:pointer;'+(style||'border:1px solid rgba(255,255,255,.25);background:rgba(4,20,39,.9);color:#d0e8f8')+'">'+label+'</button>';
}
/* 4 dòng thông tin CHUẨN, DÙNG CHUNG cho MỌI loại điểm nghẽn trên bản đồ (5 nhóm lẫn Cháy nổ) — cả 2 loại giờ
   mang cùng field name (location_text/responsible_org_id/due_at/received_at, xem GIS_TRUSO_SEED) nên chỉ cần
   1 hàm duy nhất đọc dữ liệu, không còn 2 bản viết tay khác field/khác cách trình bày như trước. */
function gisPopupInfoRows(rec){
 return '<p><b>Vị trí:</b> '+esc(rec.location_text)+'</p>'
 +'<p><b>Đơn vị chịu trách nhiệm:</b> '+esc(gisOrgLabel(rec.responsible_org_id))+'</p>'
 +'<p><b>Thời gian nhận phản ánh:</b> '+gisFmtTimestamp(rec.received_at||rec.created_at)+'</p>'
 +'<p><b>Hạn xử lý:</b> '+gisFmtDue(rec.due_at)+'</p>';
}
/* Popup 5 nhóm điểm nghẽn (gisEformData) — bấm "Xem chi tiết đầy đủ" mới mở modal đủ toàn bộ trường
   (openGisEformDetail). Title = icon+tên NHÓM (để nhận diện nhanh loại điểm nghẽn) thay vì tên riêng báo cáo —
   tên riêng + mô tả nằm chung khối "Nội dung phản ánh". Badge trạng thái theo ĐÚNG kịch bản
   (gisMarkerStateColor/gisStateLabel — vàng/đỏ/xanh dương/xanh lá). */
function gisEformPopupHtml(rec){
 const b=gisBottleneckMeta(rec.bottleneck_code);
 const linkedHtml=rec.linkedRecordId?'<p style="color:#8ff0c1">✓ Nhiệm vụ liên kết: '+rec.linkedRecordId+'</p>':(rec.demoLinked?'<p style="color:#8ff0c1">✓ Đã giao xử lý (dữ liệu minh hoạ)</p>':'');
 const doneHtml=rec.status==='done'?'<p style="color:#7dffba">Sẽ tự ẩn khỏi bản đồ sau ít phút</p>':'';
 /* Bước 3 kịch bản: hiện số lần phản ánh trùng vị trí đã gộp vào điểm này (chỉ hiện khi >1 để đỡ rối mắt
    với các điểm chỉ có đúng 1 phản ánh) — áp dụng cho MỌI bottleneck_code kể cả 'truso' (Cháy nổ), vì giờ dùng
    chung 1 pipeline dữ liệu với 5 nhóm điểm nghẽn. */
 const countHtml=(rec.reportCount||1)>1?'<p><b>Số phản ánh trùng vị trí:</b> '+rec.reportCount+'</p>':'';
 const imgs=rec.images||[];
 const imagesHtml=imgs.length?'<div class="gis-report-images" style="margin:4px 0">'+imgs.map(im=>'<span class="gis-report-image-thumb"><img src="'+im.dataUrl+'" alt="'+esc(im.name||'')+'"/></span>').join('')+'</div>':'';
 const related=rec.relatedReports||[];
 const relatedHtml=related.length?'<div class="gis-report-related" style="font-size:12.5px"><b style="font-size:12.5px;color:#8ab0c8">Phản ánh liên quan ('+related.length+')</b>'+related.slice(0,3).map(r=>'<div>• '+esc(r.title)+'</div>').join('')+'</div>':'';
 /* Nút "Hoàn thành xử lý" chỉ hiện khi đã qua bước "Giao xử lý" (linkedRecordId) và chưa hoàn thành — đúng
    thứ tự bước 4→5 của kịch bản, áp dụng cho MỌI điểm nghẽn chứ không riêng báo cáo người dùng. */
 const completeBtnHtml=((rec.linkedRecordId||rec.demoLinked)&&rec.status!=='done')?gisPopupActionBtn("gisCompleteReport('"+rec.id+"')",'✓ Hoàn thành xử lý','border:1px solid rgba(47,177,116,.5);background:rgba(3,60,36,.85);color:#7dffba'):'';
 return gisPopupShell({
  iconKey:b.code,iconColor:b.color,title:b.name,
  contentLabel:'Nội dung phản ánh',
  contentHtml:'<b>'+esc(rec.title)+'</b><br>'+esc(rec.description),
  rowsHtml:gisPopupInfoRows(rec)+countHtml+imagesHtml+relatedHtml+linkedHtml+doneHtml,
  badgeHtml:gisBadgeHtml(gisMarkerStateColor(rec),gisStateLabel(rec)),
  actionsHtml:completeBtnHtml+gisPopupActionBtn("gisShareLocation('"+rec.id+"')",'🔗 Chia sẻ')+gisPopupActionBtn("openGisEformDetail('"+rec.id+"')",'Xem chi tiết đầy đủ','border:1px solid rgba(73,188,255,.4);background:rgba(4,20,39,.9);color:#d0e8f8')
 });
}
/* Popup marker "🔥 Cháy nổ" (bottleneck_code:'truso') giờ dùng thẳng gisEformPopupHtml() như 5 nhóm điểm nghẽn
   kia — không còn hàm/badge riêng theo danger_level, vì Cháy nổ đã nằm chung trong gisEformData và có đủ
   status/linkedRecordId/reportCount để chạy đúng cùng state machine (Giao xử lý/Hoàn thành xử lý). */
/* Dialog "Chia sẻ vị trí" (giống Google Maps) — dùng chung cho MỌI marker trong gisEformData (5 nhóm điểm
   nghẽn lẫn Cháy nổ). Link chia sẻ là tọa độ Google Maps thật (không phụ thuộc backend) — mở đúng vị trí dù
   người nhận không mở được demo local này. */
function gisShareLocation(id){
 const rec=(gisEformData||[]).find(x=>x.id===id);
 if(!rec) return;
 const title=rec.title||rec.name||'Vị trí GIS';
 const addr=rec.location_text||rec.chuc_nang||'';
 const lat=rec.lat,lng=rec.lng;
 const mapUrl=`https://www.google.com/maps?q=${lat},${lng}`;
 const shareText=addr?`${title} — ${addr}`:title;
 document.getElementById('modalTitle').textContent='Chia sẻ vị trí';
 document.getElementById('modalSub').textContent=title;
 document.getElementById('modalBody').innerHTML=`<div class="detail-card">`
 +`<div class="kv"><b>Vị trí</b><span>${esc(addr||'—')}</span><b>Tọa độ</b><span>${lat.toFixed(6)}, ${lng.toFixed(6)}</span></div>`
 +`<div style="display:flex;gap:8px;margin-top:12px">`
 +`<input id="gisShareLinkInput" readonly value="${esc(mapUrl)}" onclick="this.select()" style="flex:1;min-width:0;padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(4,20,39,.9);color:#d0e8f8;font-size:12px"/>`
 +`<button class="ghost" onclick="gisCopyShareLink('${mapUrl.replace(/'/g,"\\'")}')">Sao chép đường liên kết</button>`
 +`</div>`
 +`<div style="display:flex;gap:22px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.1)">`
 +gisShareAppLink('#25D366',GIS_SHARE_APP_ICONS.whatsapp,'WhatsApp',`https://wa.me/?text=${encodeURIComponent(shareText+' '+mapUrl)}`)
 +gisShareAppLink('#0068FF',GIS_SHARE_APP_ICONS.zalo,'Zalo',`https://sp.zalo.me/share?u=${encodeURIComponent(mapUrl)}&d=${encodeURIComponent(shareText)}`)
 +gisShareAppLink('#EA4335',GIS_SHARE_APP_ICONS.gmail,'Gmail',`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText+'\n\n'+mapUrl)}`)
 +`</div></div>`;
 document.getElementById('modal').classList.add('modal-compact');
 openModal();
}
/* Icon SVG thật (đơn sắc, fill trắng) của từng app chia sẻ — thay cho emoji chung chung trước đây (⚡ không hề
   giống Zalo, 💬/✉️ chỉ là icon hệ thống). Vẽ tay dạng glyph đơn giản, đủ nhận diện, không dùng ảnh/logo bản quyền. */
const GIS_SHARE_APP_ICONS={
 whatsapp:'<svg viewBox="0 0 24 24" fill="#fff" width="22" height="22"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.35 5.09L2 22l5.09-1.32C8.58 21.5 10.25 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.16 14.24c-.24.68-1.19 1.25-1.94 1.4-.52.1-1.2.19-3.49-.75-2.93-1.21-4.82-4.19-4.97-4.39-.14-.2-1.18-1.57-1.18-3s.73-2.12 1-2.41c.23-.25.5-.31.66-.31.17 0 .33 0 .48.01.15.01.36-.06.56.43.21.51.71 1.76.77 1.89.06.13.1.28.02.45-.08.17-.12.28-.24.43-.12.15-.25.34-.36.46-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.65.92.82 1.69 1.08 1.93 1.2.24.12.38.1.53-.06.15-.16.62-.72.79-.97.17-.24.34-.2.56-.12.23.08 1.46.69 1.71.82.25.13.42.19.48.3.06.11.06.63-.18 1.31z"/></svg>',
 zalo:'<svg viewBox="0 0 24 24" fill="#fff" width="22" height="22"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h3v4l5-4h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/><text x="12" y="12.5" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="900" fill="#0068FF" font-family="Arial,sans-serif">Z</text></svg>',
 gmail:'<svg viewBox="0 0 24 24" fill="#fff" width="22" height="22"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>'
};
/* 1 nút "app chia sẻ" kiểu Google Maps: icon tròn màu thương hiệu + nhãn ngay dưới, không phải nút bo viền
   như action-bar thường — bấm mở đúng share-intent của app đó (không cần SDK/app cài sẵn). */
function gisShareAppLink(color,icon,label,href){
 return `<a href="${href}" target="_blank" rel="noopener" style="display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;color:#a8c3d8;font-size:10.5px;font-weight:700"><span style="width:44px;height:44px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,.3)">${icon}</span>${label}</a>`;
}
function gisCopyShareLink(url){
 const done=()=>toast('Đã sao chép đường liên kết');
 const fail=()=>{
  const inp=document.getElementById('gisShareLinkInput');
  if(inp){ inp.select(); try{ document.execCommand('copy'); done(); return; }catch(e){} }
  toast('Không sao chép được, vui lòng copy thủ công');
 };
 if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done).catch(fail);
 else fail();
}
/* Cập nhật đúng 1 marker eForm tại chỗ (popup) sau khi "Giao xử lý" — không rebuild lại toàn bộ layer/scope
   để tránh mất linkedRecordId/status vừa gán. */
function gisUpdateEformMarker(rec){
 const m=GM.markerRefs&&GM.markerRefs.get(rec.id); if(!m)return;
 m.setPopupContent(gisEformPopupHtml(rec));
 const b=gisBottleneckMeta(rec.bottleneck_code);
 const col=gisMarkerStateColor(rec);
 const size=GM.map?gisMarkerSizeForZoom(GM.map.getZoom()):GIS_MARKER_SIZE_DEFAULT;
 m.setIcon(gisMarkerIcon(col,b.code,size));
 /* Fix lỗi "viền màu không đúng trạng thái": nếu marker này đang bị gộp trong 1 cụm (markerClusterGroup),
    setIcon() ở trên không tự vẽ lại cụm — phải chủ động refreshClusters() để cụm hiện đúng màu ngay, không
    cần chờ người dùng zoom. */
 const grp=GM.groups[rec.bottleneck_code];
 if(grp&&typeof grp.refreshClusters==='function')grp.refreshClusters(m);
}
/* Dải KPI: mỗi chip = 1 layer (5 nhóm điểm nghẽn + nhóm Sự cố khẩn cấp), màu/icon lấy thẳng từ GIS_BOTTLENECKS/
   GIS_EMERGENCY_TYPES, số đếm live. Bấm 1 chip vừa bật/tắt layer đó vừa tự fitBounds khi bật. */
function gisRenderKpiStrip(){
 const box=document.getElementById('gisKpiStrip'); if(!box) return;
 const chips=GIS_BOTTLENECKS.map(b=>({key:b.code,name:b.name,color:b.color,count:gisEformData.filter(r=>r.bottleneck_code===b.code).length}));
 const emerChips=GIS_EMERGENCY_TYPES.map(e=>({key:e.code,name:e.name,color:e.color,count:gisEformData.filter(r=>r.bottleneck_code===e.code).length}));
 const chipHtml=c=>{
  const on=!GM.groups[c.key]||(GM.map&&GM.map.hasLayer(GM.groups[c.key]));
  return `<button class="gis-kpi-chip${on?'':' off'}" data-gis-layer="${c.key}" style="border-color:${c.color}77;color:${c.color}"><span class="gis-kpi-chip-icon">${gisInlineIconHtml(c.key,14)}</span><span class="gis-kpi-chip-name">${esc(c.name)}</span><b>${c.count}</b></button>`;
 };
 /* Nhóm "Sự cố khẩn cấp" tách riêng khỏi 5 nhóm điểm nghẽn theo đúng kiến trúc gốc (GIS_EMERGENCY_TYPES không
    nằm trong GIS_BOTTLENECKS) — hiển thị cách biệt bằng 1 đường kẻ phân vùng để không gây hiểu nhầm là cùng
    loại với 5 nhóm điểm nghẽn chính. */
 box.innerHTML=chips.map(chipHtml).join('')+'<div class="gis-kpi-strip-divider"></div>'+emerChips.map(chipHtml).join('');
 box.querySelectorAll('[data-gis-layer]').forEach(chip=>{
  chip.onclick=()=>{
   const key=chip.dataset.gisLayer; if(!GM.map||!GM.groups[key])return;
   const willOn=chip.classList.contains('off');
   chip.classList.toggle('off',!willOn);
   if(willOn){ GM.groups[key].addTo(GM.map); gisFocusLayer(key); } else GM.map.removeLayer(GM.groups[key]);
  };
 });
}
function createGisGroups(){
 const size=GM.map?gisMarkerSizeForZoom(GM.map.getZoom()):GIS_MARKER_SIZE_DEFAULT;
 GIS_BOTTLENECKS.forEach(b=>{
  GM.groups[b.code]=(window.L&&L.markerClusterGroup)?L.markerClusterGroup({maxClusterRadius:46,iconCreateFunction:c=>L.divIcon({className:'',html:`<div class="gis-cluster" style="color:${b.color};background:${b.color}22;border:1.5px solid ${b.color}88"><span class="gis-marker-pulse" style="color:${b.color}"></span>${c.getChildCount()}</div>`,iconSize:[38,38]})}):L.layerGroup();
 });
 [...GIS_EMERGENCY_TYPES.map(e=>e.code),'zones'].forEach(k=>{GM.groups[k]=L.layerGroup();});
 gisEformData.forEach(rec=>{
  const b=gisBottleneckMeta(rec.bottleneck_code);
  const m=L.marker([rec.lat,rec.lng],{icon:gisMarkerIcon(gisMarkerStateColor(rec),b.code,size),riseOnHover:true,title:rec.title});
  m.bindPopup(gisEformPopupHtml(rec));
  m.addTo(GM.groups[rec.bottleneck_code]);
  GM.markerRefs.set(rec.id,m);
 });
 gisZoneDefs.forEach(z=>{
  L.polygon(z.coords,{color:z.color,weight:2,fillColor:z.color,fillOpacity:.1,dashArray:'5 4'})
   .bindTooltip(z.name,{permanent:true,direction:'center',className:'gis-zone-tooltip'})
   .addTo(GM.groups.zones);
 });
 [...GIS_BOTTLENECKS.map(b=>b.code),...GIS_EMERGENCY_TYPES.map(e=>e.code),'zones'].forEach(k=>{if(GM.groups[k])GM.groups[k].addTo(GM.map);});
 updateGisZoneCount();
 updateGisStatus();
 gisRenderKpiStrip();
 renderGisReportSidebar();
}
function updateGisZoneCount(){const zc=document.getElementById('gisZoneCount');if(zc)zc.textContent=String(gisZoneDefs.length+GM.userZones.length).padStart(2,'0');}
function updateGisStatus(){
 const sb=document.getElementById('gisMapStatus');if(!sb)return;
 const bottleneckCount=gisEformData.filter(r=>!gisIsEmergencyCode(r.bottleneck_code)).length;
 const emerCount=gisEformData.filter(r=>gisIsEmergencyCode(r.bottleneck_code)).length;
 sb.innerHTML=bottleneckCount+' điểm nghẽn&nbsp;·&nbsp;'+emerCount+' sự cố khẩn cấp<br>'+(gisZoneDefs.length+GM.userZones.length)+' vùng giám sát';
}
function updateGisCoord(){if(!GM.map)return;const z=GM.map.getZoom(),c=GM.map.getCenter();const el=document.getElementById('gisCoordinate');if(el)el.textContent=c.lat.toFixed(4)+', '+c.lng.toFixed(4)+' • Z'+Math.round(z);}
function initGisMap(){
 if(!window.L){if(window.toast)toast('Leaflet chưa tải – bản đồ GIS không khởi động được');return;}
 const el=document.getElementById('gisMap');if(!el)return;
 if(GM.map){GM.map.invalidateSize();if(GM.scopeKey!==gisScopeKey()){GM.scopeKey=gisScopeKey();refreshGisScope();}return;}
 GM.scopeKey=gisScopeKey();
 const d=buildGisScopeData();
 gisEformData=d.eform; gisKhuDanCuData=d.kdc||[];
 const titleEl=document.getElementById('gisWidgetTitle');
 if(titleEl) titleEl.textContent=`🗺️ BẢN ĐỒ GIS – ${d.label} · 5 nhóm điểm nghẽn`;
 updateGisSearchPlaceholder();
 /* maxBounds+maxBoundsViscosity:1 chặn cứng việc kéo bản đồ ra ngoài Hà Nội (không cho trôi sang tỉnh khác/
    biển/nước ngoài); minZoom:10 chặn zoom ra xa hơn mức thấy trọn Hà Nội (không zoom tới mức thấy cả nước
    hay bản đồ thế giới) — cả 2 cùng giới hạn phạm vi bản đồ đúng theo yêu cầu chỉ hiện Hà Nội. */
 GM.map=L.map('gisMap',{center:d.center,zoom:d.zoom,minZoom:10,zoomControl:false,attributionControl:false,preferCanvas:true,maxBounds:HN_MAP_BOUNDS,maxBoundsViscosity:1.0});
 /* Lớp phủ che phần ngoài ranh giới Hà Nội thật (interactive:false để không chặn kéo/click bản đồ bên dưới) —
    thêm ngay sau khi tạo map, TRƯỚC tile layer/marker, để nằm đúng giữa 2 lớp đó (Leaflet tự xếp theo pane:
    tile ở dưới cùng, polygon overlayPane ở giữa, marker trên cùng — không phụ thuộc thứ tự gọi addTo()).
    Dùng renderer riêng thay vì Canvas mặc định của map (preferCanvas:true) VÀ tăng hẳn "padding" (vùng đệm
    quanh khung nhìn mà renderer cấp phát để vẽ, mặc định Leaflet chỉ 0.1 = 10%) — cả Canvas lẫn SVG đều dùng
    chung cơ chế "chỉ vẽ trong 1 vùng đệm quanh viewport hiện tại" (class Renderer gốc, xem leaflet.js), KHÔNG
    phải riêng Canvas như em từng nghĩ lúc trước. Với 1 đa giác lớn cỡ ranh giới Hà Nội (~1-1.5 độ kinh/vĩ),
    10% vùng đệm là quá ít — phần đa giác vượt khỏi vùng đệm đó bị cắt cụt, phá vỡ luôn phép tính khoét lỗ
    (evenodd) của CẢ vòng đó, hiện thành khối/notch chữ nhật sai vị trí (đã gặp ở nhiều zoom/vị trí khác nhau).
    padding:4 (400%) đủ lớn để luôn chứa trọn đa giác trong mọi trường hợp thực tế của app (phạm vi kéo được
    đã bị maxBounds giới hạn sẵn, không zoom/kéo được ra quá xa). */
 L.polygon(gisHanoiMaskRings(),{renderer:L.svg({padding:4}),interactive:false,stroke:true,color:'#49bcff',weight:1.5,opacity:.55,fillColor:'#020b16',fillOpacity:1}).addTo(GM.map);
 /* Trackpad pinch/Ctrl+cuộn trên vùng bản đồ có thể bị trình duyệt hiểu nhầm thành zoom cả trang — chặn hành
    vi mặc định của trình duyệt khi phím Ctrl đang giữ ngay trên khung bản đồ. */
 el.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault();},{passive:false});
 /* Tắt điều hướng bàn phím của Leaflet vì click vào bản đồ sẽ tự gọi focus() khiến trình duyệt tự cuộn trang
    lên một chút cho khung bản đồ lọt hẳn vào màn hình — đã có kéo chuột/chạm để di chuyển bản đồ rồi. */
 GM.map.keyboard.disable();
 gisSetTheme(typeof isLightTheme==='function'&&isLightTheme()?'light':'dark');
 createGisGroups();
 L.control.zoom({position:'topright'}).addTo(GM.map);
 L.control.scale({imperial:false,position:'bottomleft'}).addTo(GM.map);
 GM.map.on('moveend zoomend',updateGisCoord);
 /* Marker "phóng to theo" bản đồ khi zoom (yêu cầu đã chốt) — L.divIcon mặc định giữ nguyên size pixel bất kể
    zoom, phải tự vẽ lại bằng gisRefreshMarkerSizes() mỗi khi đổi mức zoom. */
 GM.map.on('zoomend',gisRefreshMarkerSizes);
 updateGisCoord();
 setupGisControls();
 setTimeout(()=>{GM.map.invalidateSize();GM.map.setView(d.center,d.zoom,{animate:false});},300);
 window._gisMap=GM.map;
}
function setupGisControls(){
 const sel=document.getElementById('gisBaseSelect');
 if(sel)sel.onchange=()=>{gisSetTheme(sel.value);};
 document.querySelectorAll('[data-gis-layer]').forEach(inp=>{
  inp.onchange=()=>{
   const key=inp.dataset.gisLayer,on=inp.checked;
   if(!GM.map||!GM.groups[key])return;
   if(on)GM.groups[key].addTo(GM.map);else GM.map.removeLayer(GM.groups[key]);
  };
 });
 const db=document.getElementById('gisDrawBtn'),fb=document.getElementById('gisFinishBtn'),cb=document.getElementById('gisClearBtn'),rpb=document.getElementById('gisReportBtn');
 if(db)db.onclick=gisStartDraw;if(fb)fb.onclick=gisFinishDraw;if(cb)cb.onclick=gisClearZone;if(rpb)rpb.onclick=gisOpenNewReportForm;
 const si=document.getElementById('gisMapSearch');
 if(si){si.oninput=()=>{renderGisSearch(si.value);};si.onkeydown=e=>{if(e.key==='Enter'){const f=document.querySelector('#gisSearchSuggest button');if(f)f.click();}};}
 document.addEventListener('click',e=>{if(!e.target.closest('#gisMapSearch, #gisSearchSuggest')){const s=document.getElementById('gisSearchSuggest');if(s)s.style.display='none';}});
}
function renderGisSearch(value){
 const box=document.getElementById('gisSearchSuggest');if(!box)return;
 const k=value.trim().toLowerCase();
 if(!k){box.style.display='none';return;}
 const results=[];
 gisEformData.forEach(rec=>{
  const b=gisBottleneckMeta(rec.bottleneck_code);
  if((rec.title+' '+rec.location_text+' '+b.name).toLowerCase().includes(k))results.push({label:rec.title,sub:b.name+' • '+gisStatusLabel[rec.status],action:()=>openGisEformMap(rec.id)});
 });
 (gisKhuDanCuData||[]).forEach(kdc=>{if(kdc.name.toLowerCase().includes(k))results.push({label:kdc.name,sub:'Khu dân cư · '+gisScopeLabel(),action:()=>{GM.map.flyTo([kdc.lat,kdc.lng],17,{duration:.65});setTimeout(()=>{L.popup().setLatLng([kdc.lat,kdc.lng]).setContent(`<b>${kdc.name}</b><br><small>${gisScopeLabel()}</small>`).openOn(GM.map);},650);}});});
 if(!results.length){box.style.display='none';return;}
 box.innerHTML=results.slice(0,8).map((r,i)=>'<button data-i="'+i+'"><span>'+r.label+'<br><em style="font-size:8px;color:#7598b0">'+r.sub+'</em></span></button>').join('');
 box.style.display='block';
 box.querySelectorAll('button').forEach((btn,i)=>{btn.onclick=()=>{results[i].action();box.style.display='none';const si=document.getElementById('gisMapSearch');if(si)si.value='';};});
}
function gisStartDraw(){
 if(guardAction('khoanh vùng'))return;
 if(!GM.map||GM.draw.active)return;
 GM.draw.active=true;GM.draw.points=[];
 GM.map.dragging.disable();GM.map.doubleClickZoom.disable();
 const h=document.getElementById('gisDrawHint'),db=document.getElementById('gisDrawBtn'),fb=document.getElementById('gisFinishBtn');
 if(h)h.style.display='block';if(db)db.classList.add('active');if(fb)fb.style.display='';
 GM.map.on('click',gisDrawPoint);GM.map.once('dblclick',gisFinishDraw);
 if(window.toast)toast('Khoanh vùng GIS: click từng điểm trên bản đồ, nhấn Hoàn tất hoặc double-click để đóng vùng.');
}
function gisDrawPoint(e){
 GM.draw.points.push(e.latlng);
 if(GM.draw.line)GM.map.removeLayer(GM.draw.line);
 GM.draw.line=L.polyline(GM.draw.points,{color:'#59caff',weight:2,dashArray:'5 5'}).addTo(GM.map);
}
function gisFinishDraw(){
 if(!GM.draw.active)return;
 if(GM.draw.points.length<3){if(window.toast)toast('Cần tối thiểu 3 điểm để tạo vùng giám sát.');gisStopDraw();return;}
 const colors=['#f0a923','#ef4444','#29d5ea','#2fb174','#a78bfa'];
 const col=colors[GM.userZones.length%colors.length];
 const coords=GM.draw.points.map(ll=>[ll.lat,ll.lng]);
 const poly=L.polygon(coords,{color:col,weight:2,fillColor:col,fillOpacity:.12}).bindTooltip('Vùng GS-'+(GM.userZones.length+1),{permanent:true,direction:'center',className:'gis-zone-tooltip'});
 poly.addTo(GM.groups.zones);
 GM.userZones.push(poly);
 gisStopDraw();
 updateGisZoneCount();
 updateGisStatus();
 if(window.toast)toast('Đã tạo vùng giám sát '+GM.userZones.length+' trên bản đồ GIS.');
}
function gisStopDraw(){
 GM.draw.active=false;GM.draw.points=[];
 if(GM.draw.line){GM.map.removeLayer(GM.draw.line);GM.draw.line=null;}
 GM.map.dragging.enable();GM.map.doubleClickZoom.enable();
 GM.map.off('click',gisDrawPoint);
 const h=document.getElementById('gisDrawHint'),db=document.getElementById('gisDrawBtn'),fb=document.getElementById('gisFinishBtn');
 if(h)h.style.display='none';if(db)db.classList.remove('active');if(fb)fb.style.display='none';
}
function gisClearZone(){
 if(guardAction('xóa vùng khoanh'))return;
 if(GM.draw.active){if(GM.draw.line)GM.map.removeLayer(GM.draw.line);gisStopDraw();return;}
 const z=GM.userZones.pop();
 if(z){GM.groups.zones.removeLayer(z);if(window.toast)toast('Đã xóa vùng giám sát vừa tạo.');}
 else if(window.toast)toast('Chưa có vùng tự tạo để xóa.');
 updateGisZoneCount();
 updateGisStatus();
}
function gisResetView(){if(!GM.map)return;const {center,zoom}=gisScopeCenterZoom(gisRng(gisSeedNum(gisScopeKey()||'default')));GM.map.flyTo(center,zoom,{duration:.7});}
function gisFocusLayer(key){
 if(!GM.map)return;
 const pts=[];
 if(key==='all'){gisEformData.forEach(rec=>{pts.push([rec.lat,rec.lng]);});}
 else{gisEformData.filter(rec=>rec.bottleneck_code===key).forEach(rec=>{pts.push([rec.lat,rec.lng]);});}
 if(pts.length)GM.map.fitBounds(pts,{padding:[40,40],maxZoom:16});
 const inp=document.querySelector('[data-gis-layer="'+key+'"]');
 if(inp&&!inp.checked){inp.checked=true;if(GM.groups[key])GM.groups[key].addTo(GM.map);}
}
/* Bấm "➕ Báo cáo mới" (toolbar hoặc sidebar) → mở form ngay (KHÔNG bắt buộc click bản đồ trước như bản cũ).
   Trong form, người dùng chọn vị trí bằng 1 trong 2 cách (GPS hoặc chọn trên bản đồ) — đúng bước 1-2 của
   kịch bản. GM.reportDraft giữ tạm dữ liệu form khi phải đóng modal để chọn điểm trên bản đồ/lấy GPS, để
   không mất nội dung đã nhập khi form mở lại. */
function gisOpenNewReportForm(){
 if(guardAction('thêm báo cáo'))return;
 if(GM.draw.active){if(window.toast)toast('Đang trong chế độ khoanh vùng — hoàn tất hoặc hủy trước khi thêm báo cáo.');return;}
 openGisReportForm({images:[]});
}
function gisCaptureReportDraft(){
 const d=GM.reportDraft||{};
 const val=id=>{const el=document.getElementById(id);return el?el.value:undefined;};
 return {
  ...d,
  bcode:val('grpBottleneck')??d.bcode,
  ward:val('grpWard')??d.ward,
  title:val('grpTitle')??d.title,
  description:val('grpDesc')??d.description,
  location_text:val('grpLocation')??d.location_text,
  landmark:val('grpLandmark')??d.landmark,
  images:d.images||[]
 };
}
function gisReportFormHtml(draft){
 draft=draft||{};
 /* "Sự cố khẩn cấp" (Cháy nổ, Thiên tai, An ninh trật tự, Sự cố xã hội) phải nằm RIÊNG optgroup, tách khỏi
    5 nhóm điểm nghẽn — yêu cầu nghiệp vụ chốt 2026-08-10 (trước đây Cháy nổ lẫn chung 1 danh sách phẳng với
    5 nhóm điểm nghẽn, gây hiểu nhầm là cùng loại). */
 const bottleneckOpts=GIS_BOTTLENECKS.map(b=>`<option value="${b.code}" ${draft.bcode===b.code?'selected':''}>${b.icon} ${esc(b.name)}</option>`).join('');
 const emergencyOpts=GIS_EMERGENCY_TYPES.map(e=>`<option value="${e.code}" ${draft.bcode===e.code?'selected':''}>${e.icon} ${esc(e.name)}</option>`).join('');
 const opts=`<optgroup label="Nhóm điểm nghẽn">${bottleneckOpts}</optgroup><optgroup label="Sự cố khẩn cấp">${emergencyOpts}</optgroup>`;
 const wardOpts=wardNames().map(n=>`<option value="${esc(n)}">`).join('');
 const posHtml=(draft.lat!=null&&draft.lng!=null)
  ?`<b style="color:#7dffba">✓ Đã chọn vị trí:</b> ${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}`
  :`<b style="color:#f0c14b">Chưa chọn vị trí</b> — dùng 1 trong 2 cách bên dưới`;
 return `<div class="form2">
  <div class="field"><label>1. Nhóm điểm nghẽn</label><select id="grpBottleneck">${opts}</select></div>
  <div class="field"><label>2. Địa bàn (xã/phường)</label><input id="grpWard" list="grpWardList" value="${esc(draft.ward||'')}" placeholder="Gõ để tìm xã/phường…" autocomplete="off" oninput="gisOnWardPick(this.value)"/><datalist id="grpWardList">${wardOpts}</datalist></div>
  <div class="field wide"><label>3. Vị trí</label>
   <div class="manual-note" id="grpPosNote">${posHtml}</div>
   <div class="action-bar" style="margin-top:6px"><button type="button" class="ghost" onclick="gisPickGps()">📍 Lấy vị trí GPS hiện tại</button><button type="button" class="ghost" onclick="gisPickOnMap()">🗺️ Chọn điểm trên bản đồ</button></div>
  </div>
  <div class="field wide"><label>4. Tiêu đề</label><input id="grpTitle" value="${esc(draft.title||'')}" placeholder="VD: Cháy ki-ốt tại chợ Ngã Tư Sở" /></div>
  <div class="field wide"><label>Mô tả</label><textarea id="grpDesc" rows="3" placeholder="Mô tả chi tiết sự việc...">${esc(draft.description||'')}</textarea></div>
  <div class="field"><label>Vị trí (địa chỉ/mô tả)</label><input id="grpLocation" value="${esc(draft.location_text||'')}" placeholder="VD: Ngõ 12 phố ABC" /></div>
  <div class="field"><label>Mốc nhận biết</label><input id="grpLandmark" value="${esc(draft.landmark||'')}" placeholder="VD: Gần cổng trường học" /></div>
  <div class="field wide"><label>5. Đính kèm hình ảnh (nếu có)</label><input id="grpImages" type="file" accept="image/*" multiple onchange="gisHandleReportImages(this)"/><div id="grpImageList" class="gis-report-images"></div></div>
 </div>
 <div class="action-bar" style="margin-top:12px"><button class="primary" onclick="submitGisReport()">Gửi phản ánh</button><button class="ghost" onclick="closeModal()">Hủy</button></div>`;
}
function openGisReportForm(draft){
 GM.reportDraft=draft||{images:[]};
 if(!GM.reportDraft.images)GM.reportDraft.images=[];
 document.getElementById('modalTitle').textContent='Báo cáo điểm nghẽn mới (GIS)';
 document.getElementById('modalSub').textContent=gisScopeLabel();
 document.getElementById('modalBody').innerHTML=gisReportFormHtml(GM.reportDraft);
 document.getElementById('modal').classList.add('modal-compact');
 openModal();
 gisRenderReportImageList();
}
/* Chọn xã/phường trong form → bản đồ bay tới khu vực đó để hỗ trợ định vị trước khi ghim điểm chính xác
   (yêu cầu nghiệp vụ đã chốt) — dùng gisWardCenter() vì gisScopeCenterZoom() chỉ tính tâm theo tài khoản
   đang đăng nhập, không theo xã/phường được chọn trong form. */
function gisOnWardPick(val){
 if(GM.reportDraft)GM.reportDraft.ward=val;
 const names=wardNames();
 const idx=names.findIndex(n=>n.toLowerCase()===String(val||'').trim().toLowerCase());
 if(idx<0||!GM.map)return;
 GM.map.flyTo(gisWardCenter(idx),15,{duration:.6});
}
function gisPickGps(){
 if(!navigator.geolocation){if(window.toast)toast('Trình duyệt không hỗ trợ định vị GPS.');return;}
 const draft=gisCaptureReportDraft();
 navigator.geolocation.getCurrentPosition(pos=>{
  draft.lat=pos.coords.latitude;draft.lng=pos.coords.longitude;
  openGisReportForm(draft);
  if(GM.map)GM.map.flyTo([draft.lat,draft.lng],17,{duration:.6});
 },err=>{
  if(window.toast)toast('Không lấy được vị trí GPS: '+(err&&err.message?err.message:'trình duyệt từ chối quyền định vị.'));
 },{enableHighAccuracy:true,timeout:8000});
}
function gisPickOnMap(){
 if(!GM.map){if(window.toast)toast('Bản đồ GIS chưa sẵn sàng.');return;}
 GM.reportDraft=gisCaptureReportDraft();
 closeModal();
 if(GM.pinActive)return;
 GM.pinActive=true;
 document.querySelector('.gis-widget')?.scrollIntoView({behavior:'smooth',block:'center'});
 const h=document.getElementById('gisReportHint');if(h)h.style.display='block';
 GM.map.getContainer().style.cursor='crosshair';
 GM.map.once('click',gisReportPinClick);
 if(window.toast)toast('Chọn 1 điểm trên bản đồ cho báo cáo.');
}
function gisReportPinClick(e){
 GM.pinActive=false;
 const h=document.getElementById('gisReportHint');if(h)h.style.display='none';
 GM.map.getContainer().style.cursor='';
 const draft=GM.reportDraft||{};
 draft.lat=e.latlng.lat;draft.lng=e.latlng.lng;
 openGisReportForm(draft);
}
function gisHandleReportImages(input){
 const files=[...(input.files||[])];
 GM.reportDraft=gisCaptureReportDraft();
 let remaining=files.length;if(!remaining)return;
 files.forEach(f=>{
  const reader=new FileReader();
  reader.onload=()=>{GM.reportDraft.images.push({name:f.name,dataUrl:reader.result});remaining--;if(remaining===0)gisRenderReportImageList();};
  reader.readAsDataURL(f);
 });
 input.value='';
}
function gisRemoveReportImage(idx){
 if(!GM.reportDraft||!GM.reportDraft.images)return;
 GM.reportDraft.images.splice(idx,1);
 gisRenderReportImageList();
}
function gisRenderReportImageList(){
 const box=document.getElementById('grpImageList');if(!box)return;
 const images=(GM.reportDraft&&GM.reportDraft.images)||[];
 box.innerHTML=images.map((im,i)=>`<span class="gis-report-image-thumb"><img src="${im.dataUrl}" alt="${esc(im.name)}"/><button type="button" onclick="gisRemoveReportImage(${i})" title="Xóa ảnh">✕</button></span>`).join('')||'<div style="color:#5f7f99;font-size:10.5px">Chưa có ảnh đính kèm.</div>';
}
function submitGisReport(){
 if(guardAction('thêm báo cáo'))return;
 const draft=gisCaptureReportDraft();
 GM.reportDraft=draft;
 const bcode=draft.bcode;
 const title=(draft.title||'').trim();
 const description=(draft.description||'').trim();
 const location_text=(draft.location_text||'').trim();
 const landmark=(draft.landmark||'').trim();
 const ward=(draft.ward||'').trim();
 const images=draft.images||[];
 if(!title||!description){if(window.toast)toast('Vui lòng nhập Tiêu đề và Mô tả.');return;}
 if(draft.lat==null||draft.lng==null){if(window.toast)toast('Vui lòng chọn vị trí bằng GPS hoặc chọn trên bản đồ.');return;}
 const lat=draft.lat,lng=draft.lng;
 const b=gisBottleneckMeta(bcode);
 /* Bước 3 của kịch bản: hệ thống tổng hợp số lượng phản ánh tại CÙNG 1 điểm/vị trí — nếu đã có bản ghi
    cùng nhóm trong bán kính gộp (GIS_MERGE_RADIUS_DEG) và chưa xử lý xong, GỘP vào bản ghi đó (tăng
    reportCount, không tạo marker mới) thay vì tạo điểm nghẽn trùng lặp trên bản đồ. */
 const merge=gisFindMergeTarget(bcode,lat,lng);
 if(merge){
  merge.reportCount=(merge.reportCount||1)+1;
  merge.relatedReports=merge.relatedReports||[];
  merge.relatedReports.unshift({title,description,images,location_text,landmark,ward,created_at:Date.now()});
  const lvl=gisDangerFromReportCount(merge.reportCount);
  merge.danger_level=lvl;merge.emergency_level=lvl;
  gisUpdateEformMarker(merge);
  closeModal();
  updateGisStatus();gisRenderKpiStrip();renderGisReportSidebar();
  if(window.toast)toast('Đã gộp vào phản ánh hiện có tại vị trí này ('+merge.reportCount+' phản ánh).');
  document.querySelector('.gis-widget')?.scrollIntoView({behavior:'smooth',block:'center'});
  const mm=GM.markerRefs.get(merge.id);
  if(GM.map&&mm){GM.map.flyTo([merge.lat,merge.lng],16,{duration:.6});setTimeout(()=>mm.openPopup(),650);}
  return;
 }
 const danger=gisDangerFromReportCount(1);
 const rec={
  id:'UR-'+pad2(++gisUserReportSeq),
  bottleneck_code:bcode,title,description,
  location_text:location_text||ward||gisScopeLabel(),
  landmark,lat,lng,ward,
  responsible_org_id:b.org,coordinating_org_ids:b.coord,
  due_at:'',danger_level:danger,emergency_level:danger,
  completeness_score:1,
  user_notes:'Báo cáo trực tiếp từ người dân qua form GIS.',
  gis_ai_notes:'',
  data_source_note:'Người dùng nhập trực tiếp qua form báo cáo GIS.',
  /* 'soon' = chưa xử lý (vàng/đỏ theo reportCount, xem gisMarkerStateColor) — chỉ chuyển 'doing' khi thật
     sự có nhiệm vụ "Giao xử lý" (linkedRecordId), đúng thứ tự bước 3→4 của kịch bản. */
  status:'soon',linkedRecordId:null,
  reportCount:1,relatedReports:[],images,
  source_type:'user_report',created_at:Date.now(),received_at:Date.now()
 };
 gisEformData.push(rec);
 if(GM.map&&GM.groups[bcode]){
  const m=L.marker([lat,lng],{icon:gisMarkerIcon(gisMarkerStateColor(rec),b.code,gisMarkerSizeForZoom(GM.map.getZoom())),riseOnHover:true,title:rec.title});
  m.bindPopup(gisEformPopupHtml(rec));
  m.addTo(GM.groups[bcode]);
  GM.markerRefs.set(rec.id,m);
  /* Marker mới rất dễ bị "chìm" giữa marker cluster có sẵn trên bản đồ,
     đặc biệt khi đang xem toàn thành phố (zoom xa) — bay thẳng tới điểm vừa lưu + tự mở popup để người
     dùng thấy ngay báo cáo đã lên bản đồ, không phải tự dò tìm giữa hàng chục điểm khác. */
  closeModal();
  const grp=GM.groups[bcode];
  document.querySelector('.gis-widget')?.scrollIntoView({behavior:'smooth',block:'center'});
  GM.map.flyTo([lat,lng],16,{duration:.6});
  setTimeout(()=>{if(typeof grp.zoomToShowLayer==='function')grp.zoomToShowLayer(m,()=>m.openPopup());else m.openPopup();},650);
 } else closeModal();
 updateGisStatus();
 gisRenderKpiStrip();
 renderGisReportSidebar();
 if(window.toast)toast('Đã gửi phản ánh lên bản đồ GIS.');
}
/* "Hoàn thành xử lý" (bước 5 kịch bản) — marker chuyển xanh lá (gisMarkerStateColor) rồi TỰ ẨN khỏi bản đồ
   sau GIS_AUTO_HIDE_MS, áp dụng cho MỌI điểm nghẽn đã "Giao xử lý" chứ không riêng báo cáo người dùng —
   điều kiện hiện nút xem ở gisEformPopupHtml/openGisEformDetail (chỉ hiện khi đã có linkedRecordId). */
function gisCompleteReport(id){
 if(guardAction('hoàn thành xử lý'))return;
 const rec=(gisEformData||[]).find(x=>x.id===id);if(!rec||rec.status==='done')return;
 rec.status='done';rec.completed_at=Date.now();
 gisUpdateEformMarker(rec);
 updateGisStatus();gisRenderKpiStrip();renderGisReportSidebar();
 if(window.toast)toast('Đã hoàn thành xử lý — marker sẽ tự ẩn khỏi bản đồ sau ít phút.');
 gisScheduleAutoHide(id);
}
function gisScheduleAutoHide(id){
 const old=GM.completionTimers.get(id);if(old)clearTimeout(old);
 GM.completionTimers.set(id,setTimeout(()=>gisHideCompletedMarker(id),GIS_AUTO_HIDE_MS));
}
/* Gỡ marker khỏi bản đồ/gisEformData sau khi hết hạn hiển thị "Đã xử lý" — vẫn giữ bản ghi trong
   gisEformHistory để xem lại trong sidebar "Báo cáo người dùng" (tab "Đã xử lý"). */
function gisHideCompletedMarker(id){
 GM.completionTimers.delete(id);
 const idx=gisEformData.findIndex(x=>x.id===id);if(idx<0)return;
 const rec=gisEformData[idx];
 const m=GM.markerRefs.get(id);
 if(m&&GM.groups[rec.bottleneck_code])GM.groups[rec.bottleneck_code].removeLayer(m);
 GM.markerRefs.delete(id);
 gisEformData.splice(idx,1);
 gisEformHistory.unshift(rec);
 updateGisStatus();gisRenderKpiStrip();renderGisReportSidebar();
}
function gisSetReportTab(tab){gisReportTab=tab;renderGisReportSidebar();}
function renderGisReportSidebar(){
 const box=document.getElementById('gisReportList');if(!box)return;
 const ta=document.getElementById('gisReportTabActive'),th=document.getElementById('gisReportTabHistory');
 const activeList=gisEformData.filter(r=>r.source_type==='user_report');
 if(ta){ta.classList.toggle('active',gisReportTab==='active');ta.textContent=`Đang hiển thị (${activeList.length})`;}
 if(th){th.classList.toggle('active',gisReportTab==='history');th.textContent=`Đã xử lý (${gisEformHistory.length})`;}
 const list=gisReportTab==='active'?activeList:gisEformHistory;
 if(!list.length){box.innerHTML='<div style="padding:6px 0;color:#5f7f99">'+(gisReportTab==='active'?'Chưa có báo cáo nào.':'Chưa có báo cáo đã xử lý.')+'</div>';return;}
 const clickable=gisReportTab==='active';
 box.innerHTML=list.map(r=>{
  const b=gisBottleneckMeta(r.bottleneck_code);
  const col=gisDangerColor(r.danger_level);
  return `<div class="gis-report-item${clickable?' clickable':''}" ${clickable?`onclick="openGisEformMap('${r.id}')"`:''}>
   <b style="color:${col}">${gisInlineIconHtml(b.code,11,b.color)} ${esc(r.title)}</b><br>
   <span>${r.reportCount||1} phản ánh · ${gisDangerLabel(r.danger_level)}</span>
  </div>`;
 }).join('');
}
function gisToggleFullscreen(btn){
 const widget=document.querySelector('.gis-widget');
 if(!widget)return;
 const isFs=widget.classList.toggle('gis-fs-active');
 if(btn) btn.title=isFs?'Thoát toàn màn hình':'Toàn màn hình';
 if(isFs) lockScroll(); else unlockScroll();
 setTimeout(()=>{GM.map&&GM.map.invalidateSize();},120);
 if(isFs){
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){gisToggleFullscreen(btn);document.removeEventListener('keydown',_esc);}});
 }
}
