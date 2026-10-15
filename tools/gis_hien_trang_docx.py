# -*- coding: utf-8 -*-
"""Sinh docs/CHUNG/BAO_CAO_HIEN_TRANG_GIS_2026_10_12.docx + .md — báo cáo hiện trạng các chức năng bản đồ GIS trên IOC:
bản đồ GIS Thành phố Hà Nội (js/core/gis.js) và bản đồ số toàn quốc của Ban Tổ chức TW (js/features/btctw-national-map.js).
Chạy từ thư mục gốc ioc:  py tools/gis_hien_trang_docx.py
Sau khi sinh, cập nhật Mục lục bằng Word: tools/vhtt_doc_finalize.ps1 -Docx <đường dẫn .docx>."""
import os, sys
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'CHUNG', 'BAO_CAO_HIEN_TRANG_GIS_2026_10_12.docx')

DA, MOT, CHUA = 'Đã có', 'Một phần', 'Chưa có'
BAD_FILL = 'FDECEC'

# ---------- Chức năng bản đồ GIS Hà Nội: (nhóm, chức năng, hiện trạng, mức) ----------
HN = [
    ('A. Hiển thị, thao tác bản đồ', [
        ('Nền bản đồ', 'Ảnh vệ tinh, 3 lựa chọn: vệ tinh tối, vệ tinh sáng, vệ tinh. Nền tự đổi theo giao diện sáng/tối của IOC. Cả 3 lựa chọn dùng chung một ảnh vệ tinh, chỉ khác độ tối; không có tên đường, địa danh.', MOT),
        ('Giới hạn trong Hà Nội', 'Phần ngoài địa giới Hà Nội được che tối, có viền ranh giới; không kéo bản đồ ra ngoài Hà Nội, không thu nhỏ quá mức thấy trọn Thành phố.', DA),
        ('Công cụ bản đồ', 'Phóng to, thu nhỏ; thước tỷ lệ; hiện tọa độ tâm và mức phóng; nút về vị trí mặc định của tài khoản; toàn màn hình (Esc để thoát); thu gọn khung.', DA),
        ('Biểu tượng điểm', 'Mỗi nhóm một biểu tượng riêng, viền màu theo trạng thái xử lý, có quầng nhấp nháy; biểu tượng to dần khi phóng to. Khi xem xa, các điểm cùng nhóm gộp thành cụm có số đếm.', DA),
    ]),
    ('B. Lớp dữ liệu, tổng hợp', [
        ('Thanh đếm theo nhóm', '5 nhóm điểm nghẽn và 4 loại sự cố khẩn cấp, mỗi nhóm một nút có số đếm; bấm để bật/tắt lớp, khi bật bản đồ tự thu khung vừa các điểm của nhóm.', DA),
        ('Chú giải trạng thái', '4 màu theo quy trình: vàng (chưa xử lý, dưới 5 phản ánh), đỏ (chưa xử lý, từ 5 phản ánh), xanh dương (đang xử lý), xanh lá (đã hoàn thành, sắp tự ẩn).', DA),
        ('Số tổng hợp', 'Tổng số điểm nghẽn, sự cố khẩn cấp, vùng giám sát trong phạm vi đang xem.', DA),
        ('Bản đồ mật độ', 'Lớp "mật độ nguy hiểm" dạng vùng nhiệt đã gỡ khỏi giao diện; chưa có.', CHUA),
    ]),
    ('C. Thông tin điểm', [
        ('Khung thông tin khi bấm điểm', 'Nhóm; nội dung phản ánh; vị trí; đơn vị chịu trách nhiệm; thời gian nhận; hạn xử lý; số phản ánh trùng vị trí; ảnh; phản ánh liên quan; trạng thái. Nút Hoàn thành xử lý, Chia sẻ, Xem chi tiết đầy đủ.', DA),
        ('Chi tiết đầy đủ', 'Thêm mốc nhận biết, tọa độ, đơn vị phối hợp, mức nguy hiểm, mức khẩn cấp, độ đầy đủ dữ liệu, ghi chú, nguồn dữ liệu; nút Giao xử lý, Xem trên bản đồ. Nhãn trạng thái ở đây chưa khớp với bản đồ (mục IV.5).', MOT),
        ('Chia sẻ vị trí', 'Đường liên kết Google Maps theo tọa độ, nút sao chép, chia sẻ qua Zalo, WhatsApp, Gmail.', DA),
    ]),
    ('D. Tìm kiếm', [
        ('Ô tìm kiếm trên bản đồ', 'Tìm theo tên, vị trí, nhóm trong các điểm đang có; tài khoản xã, phường tìm thêm được thôn, tổ dân phố. Chưa tìm được địa chỉ bất kỳ; thôn, tổ dân phố là tên và vị trí ước tính.', MOT),
    ]),
    ('E. Phản ánh của người dùng', [
        ('Báo cáo mới', 'Chọn nhóm (tách riêng nhóm điểm nghẽn và nhóm sự cố khẩn cấp); chọn xã, phường (bản đồ bay tới); lấy vị trí bằng GPS hoặc bấm chọn trên bản đồ; tiêu đề, mô tả, địa chỉ, mốc nhận biết; đính kèm nhiều ảnh. Nội dung đã nhập được giữ khi đi chọn vị trí.', DA),
        ('Gộp phản ánh trùng', 'Phản ánh cùng nhóm trong bán kính khoảng 150 m quanh một điểm chưa xử lý xong được gộp vào điểm đó (tăng số phản ánh, không tạo điểm mới). Từ 5 phản ánh điểm chuyển đỏ; mức nguy hiểm tự tính theo số phản ánh, không nhập tay.', DA),
        ('Danh sách báo cáo người dùng', 'Khung bên phải, 2 thẻ "Đang hiển thị" và "Đã xử lý"; bấm một dòng để bay tới điểm.', DA),
    ]),
    ('F. Xử lý theo quy trình', [
        ('Giao xử lý', 'Từ chi tiết điểm mở form giao nhiệm vụ chung của IOC; khi phát hành, điểm chuyển xanh dương và gắn với nhiệm vụ (bấm xem được nhiệm vụ đã giao).', DA),
        ('Hoàn thành xử lý', 'Điểm chuyển xanh lá rồi tự ẩn khỏi bản đồ, chuyển sang thẻ "Đã xử lý". Bản demo tự ẩn sau 1 phút; quy định là 1 giờ.', DA),
        ('Sự cố khẩn cấp', 'Cháy nổ, thiên tai, an ninh trật tự, sự cố xã hội luôn hiện màu đỏ, không hạ mức cảnh báo theo trạng thái.', DA),
        ('Thông báo', 'Các điểm chưa xử lý xong hiện trong khung "Notify IOC/CAD cần xử lý" và trong "Việc của tôi" (lọc GIS/Camera AI), có nhãn đã giao hay chưa.', DA),
    ]),
    ('G. Khoanh vùng giám sát', [
        ('Vẽ vùng', 'Bấm từng điểm trên bản đồ, nhấp đúp hoặc "Hoàn tất" để đóng vùng (tối thiểu 3 điểm); tự đặt tên Vùng GS-1, 2…; bật/tắt lớp vùng; xóa vùng vừa vẽ. Chưa đặt tên, chưa lưu, chưa thống kê hay cảnh báo các điểm nằm trong vùng.', MOT),
    ]),
    ('H. Phạm vi, phân quyền', [
        ('Dữ liệu theo tài khoản', 'Tiêu đề và dữ liệu bản đồ đổi theo phạm vi: toàn Thành phố, sở, ngành, xã, phường, các khối Trung ương. Đổi tài khoản là làm mới dữ liệu.', DA),
        ('Chế độ chỉ xem', 'Khi xem IOC của cấp dưới, các thao tác khoanh vùng, xóa vùng, thêm báo cáo, hoàn thành xử lý bị chặn kèm thông báo.', DA),
        ('Phân quyền theo vai trò', 'Màn quản trị có cấu hình quyền phân hệ GIS (lãnh đạo, chuyên viên, chỉ xem) nhưng bản đồ chưa áp dụng theo cấu hình này.', MOT),
    ]),
    ('I. Kết nối, lưu trữ', [
        ('Camera AI trên bản đồ', 'Cảnh báo Camera AI chỉ có trong khung Notify, chưa có vị trí trên bản đồ.', CHUA),
        ('Lưu trữ, đồng bộ', 'Chưa có máy chủ: phản ánh, vùng khoanh, kết quả giao và hoàn thành xử lý chỉ tồn tại trong phiên trình duyệt.', CHUA),
        ('Nhận dữ liệu thật', 'Chưa nối eForm điểm nghẽn và các nguồn phản ánh (Công dân số…).', CHUA),
    ]),
]

# ---------- Bản đồ số toàn quốc (Ban Tổ chức TW) ----------
TQ = [
    ('Bản đồ 34 tỉnh, thành', 'Ranh giới 34 tỉnh, thành sau sắp xếp 01/7/2025, tự vẽ, không dùng nền bản đồ ngoài. Ghi rõ Quần đảo Hoàng Sa (Việt Nam), Quần đảo Trường Sa (Việt Nam), Biển Đông, các đảo lớn, nước láng giềng.', DA),
    ('Hai chế độ tô màu', 'Đảng viên: theo tổng số đảng viên (từ 500.000 xanh, 100.000 đến dưới 500.000 vàng, dưới 100.000 đỏ). Văn bản: theo tỷ lệ xử lý văn bản đi toàn trình (trên 80% xanh, 50–80% vàng, dưới 50% đỏ).', DA),
    ('Thông tin khi rê chuột', '6 chỉ số của tỉnh theo chế độ đang xem, kèm tỉnh được hợp nhất từ những tỉnh nào.', DA),
    ('Chọn địa bàn', 'Danh sách 34 tỉnh, thành và 4 đảng bộ trực thuộc Trung ương; chọn tỉnh thì bản đồ bay tới, mở khung thông tin, làm mờ tỉnh khác.', DA),
    ('Thẻ số liệu', '5 thẻ cho toàn quốc hoặc đơn vị đang chọn; khi chọn một đơn vị hiện thứ hạng toàn quốc.', DA),
    ('Bảng xếp hạng', '38 đơn vị, sắp xếp theo từng cột chỉ số, bấm một dòng để xem trên bản đồ.', DA),
    ('Tải Excel', 'Xuất bảng xếp hạng đầy đủ chỉ số; tệp và nội dung ghi rõ "số liệu mô phỏng".', DA),
    ('Biểu đồ 30 ngày', 'Diễn biến kết nạp đảng viên lũy kế hoặc tỷ lệ xử lý văn bản đến trong 30 ngày gần nhất.', DA),
    ('Tiện ích', 'Toàn màn hình; tự ẩn tên tỉnh bị chồng chữ khi thu nhỏ; nhãn "SỐ LIỆU MÔ PHỎNG" trên giao diện.', DA),
    ('Số liệu thật', 'Toàn bộ số liệu là mô phỏng; số liệu thật dự kiến nhập ở phần mềm khác.', CHUA),
]

# ---------- Tồn tại: (vấn đề, ảnh hưởng, đề xuất) ----------
TON_TAI = [
    ('Nền bản đồ chỉ là ảnh vệ tinh tạm thời; 3 lựa chọn nền gần như giống nhau.',
     'Không có tên đường, địa danh; khó định vị khi xem gần.',
     'Chốt nhà cung cấp nền bản đồ Việt Nam bảo đảm chủ quyền (đã bỏ OpenStreetMap, CARTO; Vietmap đã loại vì phí; Google Maps đang dừng ở bước tài khoản thanh toán). Khi có khóa truy cập chỉ cần thay ở một chỗ.'),
    ('Toàn bộ điểm trên bản đồ là dữ liệu mô phỏng.',
     'Chưa dùng được để điều hành thật.',
     'Nối eForm điểm nghẽn (khuôn 15 trường đã dựng đúng mẫu nhập) và nguồn phản ánh của người dân.'),
    ('Vị trí trung tâm của từng xã, phường là vị trí ước tính trong khu nội thành, không phải vị trí thật.',
     'Tài khoản xã ngoại thành (vd. Ba Vì, Sóc Sơn) vẫn mở bản đồ ở nội thành; chọn xã trong form báo cáo cũng bay tới vị trí ước tính.',
     'Bổ sung tọa độ trung tâm (tốt hơn là ranh giới) của 126 xã, phường.'),
    ('Chưa có lưu trữ.',
     'Tải lại trang hoặc đổi tài khoản là mất phản ánh người dùng, vùng khoanh, kết quả giao và hoàn thành xử lý; người dùng khác không thấy.',
     'Cần máy chủ và cơ sở dữ liệu khi triển khai.'),
    ('Nhãn trạng thái chưa thống nhất.',
     'Bản đồ và khung thông tin dùng 4 trạng thái theo quy trình; khung "Chi tiết đầy đủ" và gợi ý tìm kiếm còn dùng 5 nhãn cũ (Hoàn thành, Đang xử lý, Sắp đến hạn, Nguy cơ trễ, Quá hạn). Cùng một điểm có thể hiện đỏ "Chưa xử lý" trên bản đồ nhưng "Đang xử lý" trong chi tiết.',
     'Đưa về một bộ nhãn 4 trạng thái ở mọi nơi.'),
    ('Danh sách báo cáo người dùng tô màu theo mức nguy hiểm, bản đồ tô theo trạng thái.',
     'Cùng một điểm có hai màu khác nhau ở hai chỗ.',
     'Tô danh sách theo đúng màu trạng thái trên bản đồ.'),
    ('3 loại sự cố khẩn cấp mới (thiên tai, an ninh trật tự, sự cố xã hội) chưa có điểm mẫu, chưa có biểu tượng ảnh riêng.',
     'Chỉ thấy khi người dùng tự báo; biểu tượng tạm.',
     'Bổ sung biểu tượng và vài điểm mẫu tại địa danh thật.'),
    ('Khoanh vùng mới là hình vẽ.',
     'Không đặt tên, không lưu, không thống kê hay cảnh báo điểm phát sinh trong vùng; chỉ xóa được vùng vẽ sau cùng.',
     'Nếu cần dùng thật: đặt tên, lưu, đếm điểm theo vùng, xóa từng vùng.'),
    ('Phân quyền theo vai trò chưa áp lên bản đồ; màn quản trị còn hiện mã kỹ thuật của phân hệ GIS.',
     'Tài khoản "chỉ xem" vẫn khoanh vùng, báo cáo được (trừ khi xem IOC cấp dưới); trái quy tắc không hiện mã kỹ thuật trên giao diện.',
     'Áp quyền theo vai trò; thay mã bằng chữ mô tả.'),
    ('Thời gian tự ẩn điểm đã xử lý đang là 1 phút.',
     'Để xem nhanh khi trình diễn; quy định nghiệp vụ là 1 giờ.',
     'Đổi về 1 giờ khi triển khai.'),
    ('Phản ánh người dùng mới tạo chưa có hạn xử lý.',
     'Ô "Hạn xử lý" hiện "—".',
     'Chốt quy tắc tính hạn theo nhóm điểm nghẽn hoặc lấy theo nhiệm vụ khi giao xử lý.'),
    ('Camera AI chưa có vị trí trên bản đồ.',
     'Cảnh báo camera tách rời bản đồ.',
     'Gắn tọa độ camera, hiện thành một lớp riêng.'),
    ('Ranh giới Hà Nội lấy từ nguồn bản đồ mở, đã giản lược.',
     'Đủ dùng để che phần ngoài Hà Nội, chưa phải ranh giới chính thức.',
     'Thay bằng ranh giới chính thức khi có.'),
]


def fills_for(rows, col):
    m = {DA: Kit.OK_FILL, MOT: Kit.NOTE_FILL, CHUA: BAD_FILL}
    return {(ri, col): m[r[col]] for ri, r in enumerate(rows) if ri and r[col] in m}


hn_all = [x for _, items in HN for x in items]
C_HN = Counter(x[2] for x in hn_all)
C_TQ = Counter(x[2] for x in TQ)

k = Kit('Báo cáo hiện trạng phân hệ bản đồ GIS trên IOC')
para, table, box, heading, note, bullets = k.para, k.table, k.box, k.heading, k.note, k.bullets

# ======================================================= TRANG BÌA
k.blank(3)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(3)
para('BÁO CÁO HIỆN TRẠNG PHÂN HỆ BẢN ĐỒ GIS', 22, CENTER, 6, bold=True, color=NAVY, md=False)
k.md.title('Báo cáo hiện trạng phân hệ bản đồ GIS trên IOC')
para('Các chức năng đã có, mức độ hoàn thiện, dữ liệu đang dùng và những việc còn lại', 14, CENTER, 4, italic=True, color=GREY)
k.blank(3)
table([
    ['Phạm vi', ['Bản đồ GIS Thành phố Hà Nội (mọi tài khoản trừ Ban Tổ chức TW)', 'Bản đồ số toàn quốc (Ban Tổ chức Trung ương)']],
    ['Bản đánh giá', 'Bản trình diễn hiện tại trên web'],
    ['Ngày lập', '12/10/2026'],
], [3.5, 12.5], header=False, key_col=True, size=12)
k.page_break()
k.toc()
k.page_break()

# ======================================================= I. TÓM TẮT
heading('I. TÓM TẮT', 1)
bullets([
    'IOC hiện có **hai bản đồ**: (1) **Bản đồ GIS Thành phố Hà Nội** theo dõi điểm nghẽn đô thị và sự cố khẩn cấp, hiện cho mọi tài khoản (Thành phố, sở, ngành, 126 xã, phường, các khối Trung ương) trừ Ban Tổ chức TW; (2) **Bản đồ số toàn quốc** 34 tỉnh, thành, chỉ hiện cho Ban Tổ chức Trung ương.',
    f'Bản đồ Hà Nội có **{len(hn_all)} chức năng** được rà: **{C_HN[DA]} đã có**, **{C_HN[MOT]} có một phần**, **{C_HN[CHUA]} chưa có**. Quy trình xử lý điểm nghẽn chạy đủ 5 bước: báo phản ánh → gộp phản ánh trùng → cảnh báo đỏ khi từ 5 phản ánh → giao xử lý → hoàn thành và tự ẩn.',
    f'Bản đồ toàn quốc có **{len(TQ)} chức năng**: **{C_TQ[DA]} đã có**, **{C_TQ[CHUA]} chưa có** (số liệu thật).',
    '**Toàn bộ dữ liệu trên hai bản đồ là mô phỏng.** Phạm vi toàn Thành phố dùng 25 điểm nghẽn theo đúng mẫu nhập eForm và 6 điểm cháy nổ, đặt tại địa danh thật; sở, ngành, xã, phường dùng điểm sinh tự động.',
    '**Nền bản đồ Hà Nội đang tạm là ảnh vệ tinh** (không có tên đường) vì đã bỏ OpenStreetMap do không bảo đảm chủ quyền; chờ chốt nền bản đồ Việt Nam.',
    '**Chưa có lưu trữ**: phản ánh, vùng khoanh, kết quả xử lý mất khi tải lại trang. Đây cùng với nguồn dữ liệu thật là hai điều kiện để đưa bản đồ vào dùng thật.',
])
box([
    '**Đã có**: chạy đủ trên bản trình diễn.',
    '**Một phần**: chạy được nhưng còn thiếu so với nhu cầu dùng thật (ghi rõ thiếu gì).',
    '**Chưa có**: chưa làm hoặc đã gỡ khỏi giao diện.',
], k.NOTE_FILL, 'Cách đọc cột "Mức" trong báo cáo:')

# ======================================================= II. BẢN ĐỒ GIS HÀ NỘI
k.page_break()
heading('II. BẢN ĐỒ GIS THÀNH PHỐ HÀ NỘI', 1)
heading('1. Vị trí và người dùng', 2)
para('Bản đồ nằm ở màn Tổng quan, khung "BẢN ĐỒ GIS – <phạm vi> · 5 nhóm điểm nghẽn". Bên trái là bản đồ, bên phải là khung lớp dữ liệu, chú giải trạng thái và danh sách báo cáo người dùng. Tiêu đề và dữ liệu đổi theo tài khoản đăng nhập. Riêng tài khoản Ban Tổ chức Trung ương, khung này được ẩn và thay bằng bản đồ số toàn quốc (Phần III).')

heading('2. Các lớp dữ liệu', 2)
table([
    ['Nhóm', 'Loại', 'Đơn vị chịu trách nhiệm mặc định', 'Dữ liệu mẫu toàn Thành phố'],
    ['Điểm nghẽn', 'Trật tự đô thị', 'Công an Thành phố', '5 điểm'],
    ['Điểm nghẽn', 'Ùn tắc giao thông', 'Công an Thành phố', '5 điểm'],
    ['Điểm nghẽn', 'Vệ sinh môi trường', 'UBND phường, xã', '5 điểm'],
    ['Điểm nghẽn', 'An toàn thực phẩm', 'Ngành Y tế', '5 điểm'],
    ['Điểm nghẽn', 'Ngập úng đô thị', 'UBND phường, xã', '5 điểm'],
    ['Sự cố khẩn cấp', 'Cháy nổ', 'Công an Thành phố', '6 điểm tại địa danh thật'],
    ['Sự cố khẩn cấp', 'Thiên tai (vỡ đê…)', 'UBND phường, xã', 'Chưa có, chỉ phát sinh khi người dùng báo'],
    ['Sự cố khẩn cấp', 'An ninh, trật tự', 'Công an Thành phố', 'Chưa có, chỉ phát sinh khi người dùng báo'],
    ['Sự cố khẩn cấp', 'Sự cố xã hội', 'UBND phường, xã', 'Chưa có, chỉ phát sinh khi người dùng báo'],
    ['Vùng', 'Vùng giám sát', 'Người dùng tự khoanh', 'Không có vùng mẫu'],
], [3.0, 3.8, 4.4, 4.8], size=10.5)
note('Mỗi điểm nghẽn còn có đơn vị phối hợp mặc định (vd. ùn tắc giao thông: Sở Xây dựng, UBND phường, xã), hiện trong khung chi tiết.')

heading('3. Danh sách chức năng', 2)
rows = [['STT', 'Chức năng', 'Hiện trạng', 'Mức']]
i = 0
for grp, items in HN:
    rows.append(['', f'**{grp}**', '', ''])
    for name, desc, lv in items:
        i += 1
        rows.append([str(i), name, desc, lv])
grp_fill = {(ri, ci): Kit.KEY_FILL for ri, r in enumerate(rows) if ri and not r[0] for ci in range(4)}
table(rows, [1.1, 3.6, 9.2, 2.1], size=10.5, fills={**fills_for(rows, 3), **grp_fill})

heading('4. Dữ liệu đang dùng', 2)
table([
    ['Phạm vi xem', 'Điểm trên bản đồ', 'Vị trí', 'Mức thật'],
    ['Toàn Thành phố (Thành ủy, HĐND, UBND, MTTQ Thành phố) và các khối Trung ương', '25 điểm nghẽn theo đúng mẫu nhập eForm (5 điểm mỗi nhóm) và 6 điểm cháy nổ; trạng thái gán đủ 4 màu để trình diễn', 'Địa danh thật (ngõ, nút giao, chợ, khu tập thể…)', 'Mô phỏng nội dung, vị trí thật'],
    ['Sở, ngành', '10 điểm nghẽn, 4 điểm cháy nổ sinh tự động (cố định theo tài khoản)', 'Rải quanh trung tâm Thành phố', 'Mô phỏng'],
    ['Xã, phường', '10 điểm nghẽn (8 điểm chia đều các nhóm, thêm 1 ùn tắc và 1 ngập úng), 5 điểm cháy nổ, 8–15 thôn hoặc tổ dân phố để tìm kiếm', 'Rải quanh một tâm ước tính, chưa phải vị trí thật của xã', 'Mô phỏng'],
    ['Phản ánh người dùng', 'Do người dùng nhập trên bản đồ', 'GPS hoặc điểm chọn trên bản đồ', 'Thật trong phiên, chưa lưu'],
], [3.8, 5.6, 3.8, 2.8], size=10.5)
table([
    ['Dữ liệu nền', 'Nguồn', 'Ghi chú'],
    ['Nền bản đồ', 'Ảnh vệ tinh thế giới (tạm thời)', 'Chờ nền bản đồ Việt Nam'],
    ['Ranh giới Hà Nội', 'Nguồn bản đồ mở, giản lược còn 471 điểm', 'Dùng để che phần ngoài Hà Nội'],
    ['Danh mục 126 xã, phường', 'Danh mục sau sắp xếp 2025', 'Thật; chưa có tọa độ từng xã'],
    ['Biểu tượng nhóm', 'Ảnh do nhóm dự án cung cấp', '3 loại sự cố mới dùng biểu tượng tạm'],
], [4.0, 6.0, 6.0], size=10.5)

# ======================================================= III. BẢN ĐỒ TOÀN QUỐC
k.page_break()
heading('III. BẢN ĐỒ SỐ TOÀN QUỐC (BAN TỔ CHỨC TRUNG ƯƠNG)', 1)
para('Làm theo yêu cầu ngày 26/9/2026, bố cục theo màn "Theo dõi chỉ tiêu quản lý văn bản và điều hành tác nghiệp" của Hệ thống theo dõi thực hiện Nghị quyết Trung ương. Chỉ hiện với tài khoản Ban Tổ chức Trung ương; đến cấp tỉnh, không có cấp xã. Không dùng nền bản đồ ngoài nên tự kiểm soát việc thể hiện chủ quyền biển đảo.')
rows = [['STT', 'Chức năng', 'Hiện trạng', 'Mức']] + [[str(n + 1), a, b, c] for n, (a, b, c) in enumerate(TQ)]
table(rows, [1.1, 3.6, 9.2, 2.1], size=10.5, fills=fills_for(rows, 3))
box([
    'Không đưa Quân ủy Trung ương và Đảng ủy Công an Trung ương vào số liệu, kể cả số mô phỏng, vì số đảng viên lực lượng vũ trang là số liệu nhạy cảm.',
    'Không có form nhập liệu trong IOC; số liệu thật dự kiến nhập ở phần mềm khác rồi đưa sang.',
], k.NOTE_FILL, 'Đã chốt:')

# ======================================================= IV. TỒN TẠI
k.page_break()
heading('IV. TỒN TẠI, HẠN CHẾ', 1)
rows = [['STT', 'Vấn đề', 'Ảnh hưởng', 'Đề xuất']] + [[str(n + 1), a, b, c] for n, (a, b, c) in enumerate(TON_TAI)]
table(rows, [1.3, 4.5, 5.1, 5.1], size=10.5)

# ======================================================= V. ĐỀ XUẤT
heading('V. ĐỀ XUẤT BƯỚC TIẾP THEO', 1)
heading('1. Sửa được ngay trên bản trình diễn', 2)
bullets([
    'Thống nhất nhãn và màu trạng thái ở mọi nơi (mục IV.5, IV.6).',
    'Bổ sung tọa độ trung tâm 126 xã, phường để mỗi xã mở đúng địa bàn (mục IV.3).',
    'Thay mã kỹ thuật ở màn quản trị phân hệ GIS bằng chữ mô tả (mục IV.9).',
    'Bổ sung biểu tượng và điểm mẫu cho 3 loại sự cố khẩn cấp mới (mục IV.7).',
])
heading('2. Cần anh chị quyết định', 2)
bullets([
    'Chọn nền bản đồ Việt Nam và tài khoản sử dụng (mục IV.1).',
    'Có áp phân quyền theo vai trò lên bản đồ hay không, và quyền cụ thể từng vai trò (mục IV.9).',
    'Mức nâng cấp khoanh vùng giám sát (mục IV.8) và quy tắc hạn xử lý cho phản ánh mới (mục IV.11).',
    'Có đưa lại bản đồ mật độ hay không.',
])
heading('3. Khi có hạ tầng triển khai', 2)
bullets([
    'Máy chủ, cơ sở dữ liệu lưu phản ánh, vùng khoanh, kết quả xử lý (mục IV.4).',
    'Nối eForm điểm nghẽn và nguồn phản ánh của người dân (mục IV.2).',
    'Đưa Camera AI lên bản đồ (mục IV.12); đổi thời gian tự ẩn về 1 giờ (mục IV.10).',
    'Nhận số liệu thật cho bản đồ toàn quốc từ phần mềm nhập liệu của Ban Tổ chức Trung ương.',
])

# ======================================================= PHỤ LỤC
heading('PHỤ LỤC. VỊ TRÍ TRONG MÃ NGUỒN', 1)
note('Dành cho nhóm phát triển.')
table([
    ['Tệp', 'Nội dung'],
    ['js/core/gis.js', 'Toàn bộ bản đồ GIS Hà Nội: nền, ranh giới, dữ liệu mẫu, điểm, lớp, tìm kiếm, khoanh vùng, báo cáo người dùng, hoàn thành xử lý'],
    ['css/gis.css', 'Giao diện bản đồ GIS Hà Nội'],
    ['js/core/audit-log.js', 'Chi tiết đầy đủ, giao xử lý, xem trên bản đồ, đưa điểm GIS vào Notify'],
    ['js/core/coordination-tree.js', 'Gắn điểm GIS với nhiệm vụ khi phát hành giao xử lý'],
    ['js/core/my-tasks-notify.js', 'Điểm GIS trong "Việc của tôi"'],
    ['js/features/btctw-national-map.js, css/btctw-national-map.css', 'Bản đồ số toàn quốc'],
    ['js/data/vn34-map-data.js', 'Ranh giới 34 tỉnh, thành và nước láng giềng'],
    ['demo_ioc.html', 'Khung giao diện hai bản đồ; màn quản trị quyền phân hệ GIS'],
    ['lib/leaflet, lib/markercluster', 'Thư viện bản đồ, gộp cụm điểm (tự lưu trên máy chủ web)'],
], [6.0, 10.0], size=10.5)

docx, md = k.save(OUT)
print(docx); print(md)
print('HN', dict(C_HN), 'TQ', dict(C_TQ))
