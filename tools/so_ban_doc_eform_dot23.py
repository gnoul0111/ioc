# -*- coding: utf-8 -*-
"""Chạy từ thư mục gốc ioc: python3 tools/so_ban_doc_eform_dot23.py — ghi docs/BAN_DOC_EFORM/SO_*.md của 12 sở đợt 2, 3
(KH&CN, Xây dựng, Dân tộc và Tôn giáo, Y tế, VH&TT, Du lịch, Ban QL khu CNC). Cùng khuôn với tools/so_ban_doc_eform.py (đợt 1):
bảng trường sinh thẳng từ js/core/eform-khung.js; vai trò khai theo MÃ ĐẦY ĐỦ, mã sai thì dừng."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from so_ban_doc_eform import gen, HEAD, KH, DB, OUTD

DUYET = '--duyet' in sys.argv
TDP = 'Mô tả dòng (thôn, tổ dân phố)'
NHAP = 'Số tỷ lệ đã nhập: hiện đúng số khi dòng là một bản ghi; dòng gộp thì xem ở Dữ liệu đã nhập; đối chiếu với IOC tính'
TD = 'Số tại thời điểm: mỗi khóa lấy kỳ cuối rồi cộng'
PS = 'Số phát sinh trong kỳ: cộng'
CO = 'Đếm xã, phường có (kỳ cuối)'

# ============================================================ KH&CN
def khcn(iok, chi, bieu, vai, kt, loi):
    v = {'loai_doi_tuong': 'Khóa (được để trống); chia cấp 2 (chữ do đơn vị gõ — câu hỏi 1)', 'ten_doi_tuong': 'Khóa (được để trống); mô tả dòng', 'dia_ban': DB}
    v.update(vai)
    return dict(iok=iok, ban_ghi='số liệu chuyển đổi số của một xã, phường («Địa bàn») — có thể chi tiết theo «Loại đối tượng», «Tên đối tượng» — trong một kỳ',
                khoa='«Địa bàn» + «Loại đối tượng» + «Tên đối tượng» (hai trường sau được để trống) + kỳ',
                loai_so='Dân số, số hộ, số người, số CBCCVC: tại thời điểm (xem quý, năm lấy kỳ cuối). Số hồ sơ, văn bản, hội nghị: phát sinh trong kỳ (cộng). Trường Có/Không: tình trạng tại thời điểm (kỳ cuối). Trường tỷ lệ: số đơn vị đã nhập (câu hỏi 3)',
                vai=v, chi=chi, bieu=bieu, kt=kt, loi=loi)
KHCN = [
 khcn('Sở KH&CN → eform 1 (thẻ "Hạ tầng và thiết bị số")',
  ['Hộ có Internet cáp quang (mã 9): «Tổng số hộ gia đình», «Số hộ có Internet cáp quang» (kỳ cuối); tỷ lệ IOC tính = số hộ có ÷ tổng số hộ × 100; «Tỷ lệ hộ có Internet cáp quang - mã 9 (%)» đã nhập hiện đúng số',
   'Người dùng smartphone (mã 42): «Dân số từ 15 tuổi», «Số người dùng smartphone»; tỷ lệ IOC tính; tỷ lệ đã nhập hiện đúng số',
   'Số xã, phường có: kết nối Internet cáp quang (mã 10), đáp ứng hạ tầng CNTT giao ban (mã 12), wifi công cộng miễn phí (mã 45), phục vụ DVC trực tuyến (mã 13)'],
  ['Thanh 2 tỷ lệ IOC tính (mã 9, 42)', 'Thanh 4 tiêu chí Có/Không (mã 10, 12, 45, 13): số xã, phường đạt', 'Tỷ lệ hộ có cáp quang qua các kỳ', 'Theo 126 xã, phường: 2 tỷ lệ, hồ sơ từng xã'],
  {'tong_so_ho_gia_dinh_ma9': TD + '; mẫu số tỷ lệ mã 9', 'so_ho_co_internet_cap_quang_ma9': TD + '; tử số tỷ lệ mã 9', 'ty_le_ma9': NHAP,
   'dan_so_tu_15_tuoi_ma42': TD + '; mẫu số tỷ lệ mã 42', 'so_nguoi_dung_smartphone_ma42': TD + '; tử số tỷ lệ mã 42', 'ty_le_ma42': NHAP,
   'co_ket_noi_internet_cap_quang_ma10': CO, 'da_dap_ung_ha_tang_cntt_giao_ban_ma12': CO, 'co_wifi_cong_cong_mien_phi_ma45': CO, 'co_phuc_vu_dvc_truc_tuyen_ma13': CO},
  ['Số "có" lớn hơn số "tổng" tương ứng (mã 9, 42)', 'Tỷ lệ đã nhập lệch số ÷ tổng × 100 quá 0,1 điểm (mã 9, 42)'],
  ['Dữ liệu mẫu: «Kỳ báo cáo» "tháng" (chữ thường); số người dùng smartphone 7 > dân số 5; tỷ lệ 8 không khớp', '«Loại đối tượng», «Tên đối tượng» mẫu "test" — chưa rõ nghĩa']),
 khcn('Sở KH&CN → eform 2 (thẻ "Con người và cộng đồng số")',
  ['5 cặp tử – mẫu (kỳ cuối) và tỷ lệ IOC tính: dùng DVC trực tuyến (mã 48), có danh tính điện tử (mã 40), có chữ ký số (mã 41), phổ cập kỹ năng số (mã 19), CBCCVC tham gia lớp ATTT (mã 21); 5 trường tỷ lệ đã nhập hiện đúng số',
   'Số xã, phường có: Tổ chuyển đổi số cộng đồng (mã 14), Đội hỗ trợ CĐS phản ứng nhanh (mã 15), mô hình khuyến khích DVC trực tuyến (mã 8)'],
  ['Thanh 5 tỷ lệ IOC tính', 'Thanh 3 tiêu chí Có/Không', 'Tỷ lệ có chữ ký số qua các kỳ', 'Theo 126 xã, phường'],
  {'dan_so_ma48': TD + '; mẫu số mã 48', 'so_nguoi_dung_dvc_truc_tuyen_ma48': TD + '; tử số mã 48', 'ty_le_ma48': NHAP,
   'dan_so_tu_14_tuoi_ma40': TD + '; mẫu số mã 40', 'so_nguoi_co_danh_tinh_dien_tu_ma40': TD + '; tử số mã 40', 'ty_le_ma40': NHAP,
   'dan_so_truong_thanh_ma41': TD + '; mẫu số mã 41', 'so_nguoi_co_chu_ky_so_ma41': TD + '; tử số mã 41', 'ty_le_ma41': NHAP,
   'dan_so_ma19': TD + '; mẫu số mã 19', 'so_nguoi_pho_cap_ky_nang_so_ma19': TD + '; tử số mã 19', 'ty_le_ma19': NHAP,
   'co_to_cds_cong_dong_ma14': CO, 'co_doi_ho_tro_cds_phan_ung_nhanh_ma15': CO, 'co_mo_hinh_khuyen_khich_dvc_tt_ma8': CO,
   'tong_cbccvc_ma21': TD + '; mẫu số mã 21', 'so_tham_gia_lop_attt_ma21': TD + '; tử số mã 21', 'ty_le_ma21': NHAP},
  ['Số "có" lớn hơn số "tổng" tương ứng (5 mã)', 'Tỷ lệ đã nhập lệch IOC tính quá 0,1 điểm (5 mã)'],
  ['Trường «Tỷ lệ tham gia lớp ATTT - mã 21 (%)» được bổ sung sau khi gửi file mô tả (sheet "Những chỉ tiêu bị thay đổi") — đã có trong file', 'Dữ liệu mẫu phần lớn là 1; tỷ lệ 8, 60 không khớp']),
 khcn('Sở KH&CN → eform 3 (thẻ "Văn bản, quy trình và dịch vụ công")',
  ['Hồ sơ TTHC (mã 25/49): cộng «Tổng hồ sơ TTHC tiếp nhận»; «Tỷ lệ hồ sơ trực tuyến toàn trình» đã nhập — **eform không có trường số hồ sơ toàn trình** nên gộp nhiều xã: IOC tính bình quân theo tổng hồ sơ (câu hỏi 2)',
   'Thanh toán trực tuyến (mã 50), xử lý trên môi trường mạng (mã 27), văn bản điện tử ký số (mã 28): cộng tử, mẫu (phát sinh); tỷ lệ IOC tính; tỷ lệ đã nhập hiện đúng số',
   'Số xã, phường chấp nhận thanh toán không tiền mặt (mã 37), có trợ lý ảo (mã 29); cộng «Số hội nghị tổ chức trong kỳ (mã 5)»'],
  ['Thanh 4 tỷ lệ (mã 25/49 bình quân, 50, 27, 28)', 'Thanh 2 tiêu chí Có/Không', 'Tổng hồ sơ TTHC qua các kỳ', 'Theo 126 xã, phường'],
  {'tong_ho_so_tthc_tiep_nhan_ma25_49': PS + '; trọng số bình quân tỷ lệ mã 25/49', 'ty_le_ma25_49': NHAP + ' (không có tử số: gộp = bình quân theo tổng hồ sơ, IOC tính)',
   'tong_ho_so_nghia_vu_tai_chinh_ma50': PS + '; mẫu số mã 50', 'so_ho_so_thanh_toan_truc_tuyen_ma50': PS + '; tử số mã 50', 'ty_le_ma50': NHAP,
   'co_chap_nhan_thanh_toan_khong_tien_mat_ma37': CO, 'tong_van_ban_ho_so_noi_bo_ma27': PS + '; mẫu số mã 27', 'so_xu_ly_tren_moi_truong_mang_ma27': PS + '; tử số mã 27', 'ty_le_ma27': NHAP,
   'tong_van_ban_trao_doi_cqnn_ma28': PS + '; mẫu số mã 28', 'so_van_ban_dien_tu_ky_so_ma28': PS + '; tử số mã 28', 'ty_le_ma28': NHAP, 'co_tro_ly_ao_ma29': CO, 'so_hoi_nghi_to_chuc_trong_ky_ma5': PS},
  ['Số "có" lớn hơn số "tổng" (mã 50, 27, 28)', 'Tỷ lệ đã nhập lệch IOC tính (mã 50, 27, 28)'],
  ['Mã 25/49 chỉ có tổng hồ sơ và tỷ lệ, **thiếu trường số hồ sơ trực tuyến toàn trình** (mã khác đều có tử số)', 'Dữ liệu mẫu: số thanh toán 5 > tổng có nghĩa vụ tài chính 4']),
]
KHCN_CAU = [
 '**«Loại đối tượng», «Tên đối tượng»** (cả 3 eform, kiểu Chữ, mẫu "test") là gì? Em đề xuất: hiện đúng như nhập, dùng làm khóa (cùng xã nhập nhiều đối tượng thì không bị coi là bản trùng) và chia cấp 2; không tự diễn giải.',
 '**Mã 25/49 (hồ sơ trực tuyến toàn trình)** không có trường tử số. Em đề xuất: một xã thì hiện đúng tỷ lệ đã nhập; gộp nhiều xã thì IOC tính bình quân có trọng số theo «Tổng hồ sơ TTHC tiếp nhận» (ghi rõ "IOC tính"); báo bên eform thêm trường số hồ sơ toàn trình.',
 '**Trường tỷ lệ đơn vị đã nhập** (14 trường "Tỷ lệ … - mã N (%)"): màn cũ không hiện mà tự tính. Em đề xuất theo quy ước: hiện đúng tỷ lệ đã nhập (khi dòng là một xã), IOC tính tử ÷ mẫu kèm theo và ghi "IOC tính"; lệch thì đánh dấu bản ghi. Dân số, số người là số tại thời điểm (xem quý lấy tháng cuối); hồ sơ, văn bản, hội nghị là số phát sinh (cộng).',
]

# ============================================================ XÂY DỰNG
SXD = [
 dict(iok='Sở Xây dựng → eform 1 (thẻ "Nhà ở")', ban_ghi='số công trình nhà ở theo «Loại công trình» × «Loại nhà ở» × «Tình trạng công trình» của một xã, phường («Đơn vị báo cáo») trong một kỳ',
  khoa='«Đơn vị báo cáo» + «Loại công trình» + «Loại nhà ở» + «Tình trạng công trình» + kỳ',
  loai_so='Đã cấp phép, đã hoàn thành, đưa vào sử dụng: phát sinh trong kỳ (cộng). Đang thi công: tại thời điểm (kỳ cuối) (câu hỏi 1). «Số tầng»: số đã nhập, không cộng',
  vai={'ngay_bao_cao': 'Mô tả', 'don_vi_bao_cao': DB, 'loai_cong_trinh': 'Chia cấp 2; biểu đồ', 'loai_nha_o': 'Chia cấp 3; biểu đồ', 'tinh_trang_cong_trinh': 'Chia cấp 1; cách cộng theo tình trạng (câu hỏi 1)',
       'so_luong_cong_trinh': 'Số: cộng theo tình trạng', 'tong_dien_tich_xay_dung_m2': 'Số: cộng theo tình trạng (m²)', 'tong_dien_tich_san_m2': 'Số: cộng theo tình trạng (m²)', 'so_tang': 'Số đã nhập: hiện đúng khi một bản ghi, không cộng (câu hỏi 2)'},
  chi=['Số công trình, diện tích xây dựng, diện tích sàn theo từng «Tình trạng công trình» (cấp phép / đang thi công / hoàn thành / đưa vào sử dụng)', 'Diện tích sàn nhà ở hoàn thành trong kỳ (m²)'],
  bieu=['Diện tích sàn hoàn thành theo «Loại nhà ở»', 'Số công trình theo «Loại công trình»', 'Diện tích sàn hoàn thành qua các kỳ', 'Theo 126 xã, phường: công trình cấp phép, diện tích sàn hoàn thành'],
  kt=['«Tổng diện tích sàn» nhỏ hơn «Tổng diện tích xây dựng» khi số tầng ≥ 1'], loi=['Dữ liệu mẫu năm 2022; mọi số mẫu là 123']),
 dict(iok='Sở Xây dựng → eform 2 (thẻ "Vận tải hành khách")', ban_ghi='số liệu vận tải hành khách theo «Ngành vận tải» × «Loại hình vận tải» của một «Đơn vị báo cáo» (xã, phường) trong một kỳ',
  khoa='«Đơn vị báo cáo» + «Ngành vận tải» + «Loại hình vận tải» + kỳ', loai_so='Phát sinh trong kỳ: cộng lượt hành khách, hành khách.km. Cự ly bình quân: số đã nhập, không cộng',
  vai={'ngay_bao_cao': 'Mô tả', 'don_vi_bao_cao': DB, 'nganh_van_tai': 'Chia cấp 1; biểu đồ', 'loai_hinh_van_tai': 'Chia cấp 2; biểu đồ', 'so_luot_hanh_khach_van_chuyen_hk': 'Số phát sinh: cộng',
       'cu_ly_van_chuyen_binh_quan_km': 'Số đã nhập; gộp = hành khách.km ÷ lượt hành khách (IOC tính)', 'hanh_khach_km_tu_tinh': 'Số đã nhập (kiểu để trống trong file) — có thì cộng; trống thì IOC tính = lượt × cự ly (câu hỏi 3)'},
  chi=['Cộng «Số lượt hành khách vận chuyển (HK)»', 'Hành khách.km: cộng «Hành khách.km (tự tính)» đã nhập; bản ghi để trống thì IOC tính = lượt × cự ly bình quân', 'Cự ly bình quân gộp (IOC tính) = hành khách.km ÷ lượt hành khách'],
  bieu=['Lượt hành khách theo «Ngành vận tải», «Loại hình vận tải»', 'Lượt hành khách qua các kỳ', 'Theo 126 xã, phường: lượt hành khách'],
  kt=['«Hành khách.km (tự tính)» lệch lượt × cự ly quá 1%'],
  loi=['Tên eform ghi "cấp đơn vị vận tải (doanh nghiệp/htx)" nhưng không có trường tên doanh nghiệp; «Đơn vị báo cáo» là danh mục 126 xã, phường (câu hỏi 4)', '«Hành khách.km (tự tính)» để trống kiểu nhập', 'Dữ liệu mẫu năm 2023']),
 dict(iok='Sở Xây dựng → eform 3 (thẻ "Điểm nguy cơ sạt lở, úng ngập")', ban_ghi='một điểm nguy cơ («Tên tuyến đường» + «Tên vị trí / Địa điểm») của một xã, phường tại thời điểm báo cáo',
  khoa='«Đơn vị báo cáo» + «Tên tuyến đường» + «Tên vị trí / Địa điểm» + kỳ', loai_so='Tại thời điểm: xem quý, năm thì mỗi điểm lấy bản báo cáo cuối cùng (không đếm một điểm nhiều lần)',
  vai={'don_vi_bao_cao': DB, 'cap_bao_cao': 'Không cộng chồng bản Sở/Ngành và Xã/Phường (câu hỏi 5)', 'ten_tuyen_duong': 'Khóa; chia cấp 2', 'ten_vi_tri_dia_diem': 'Khóa; mô tả dòng',
       'latitude_vi_do': 'Chỉ xem (tọa độ; có thể dùng cho bản đồ sau)', 'longitude_kinh_do': 'Chỉ xem (tọa độ)', 'loai_nguy_co': 'Chia cấp 1; biểu đồ', 'chieu_dai_anh_huong_m': 'Số tại thời điểm: cộng (m)',
       'muc_do_nguy_co': 'Biểu đồ; đếm điểm mức Cao, Rất cao', 'trang_thai_xu_ly': 'Biểu đồ; đếm điểm chưa xử lý'},
  chi=['Số điểm nguy cơ (mỗi điểm đếm một lần)', 'Số điểm theo «Loại nguy cơ», «Mức độ nguy cơ», «Trạng thái xử lý»; số điểm mức Cao, Rất cao; số điểm chưa xử lý', 'Cộng «Chiều dài ảnh hưởng (m)»'],
  bieu=['Điểm theo loại nguy cơ', 'Điểm theo mức độ, theo trạng thái xử lý', 'Số điểm qua các kỳ', 'Theo 126 xã, phường: số điểm, điểm mức Cao/Rất cao'],
  kt=['«Trạng thái xử lý» = Đã xử lý mà «Mức độ nguy cơ» trống'], loi=['Dữ liệu mẫu «Mức độ nguy cơ» trống; tọa độ mẫu 23456 không phải vĩ độ, kinh độ']),
 dict(iok='Sở Xây dựng → eform 4 (thẻ "Vận chuyển, luân chuyển hành khách, hàng hóa")', ban_ghi='khối lượng vận chuyển, luân chuyển theo «Đối tượng vận chuyển» × «Loại hình vận tải» của một xã, phường trong một kỳ',
  khoa='«Địa bàn» + «Cấp báo cáo» + «Đối tượng vận chuyển» + «Loại hình vận tải» + kỳ', loai_so='Phát sinh trong kỳ: cộng; **không cộng hành khách với hàng hóa** (đơn vị khác nhau)',
  vai={'dia_ban': DB, 'cap_bao_cao': 'Không cộng chồng bản Sở/Ngành và Xã/Phường (câu hỏi 5)', 'doi_tuong_van_chuyen': 'Chia cấp 1: tách đơn vị (hành khách, HK.km / tấn, tấn.km)', 'loai_hinh_van_tai': 'Chia cấp 2; biểu đồ',
       'khoi_luong_van_chuyen_hanh_khach_hoac_tan': 'Số phát sinh: cộng theo đối tượng', 'khoi_luong_luan_chuyen_hanh_khach_km_hoac_tan_km': 'Số phát sinh: cộng theo đối tượng'},
  chi=['Hành khách vận chuyển (lượt), luân chuyển (HK.km); hàng hóa vận chuyển (tấn), luân chuyển (tấn.km) — cộng theo «Đối tượng vận chuyển»'],
  bieu=['Khối lượng theo «Loại hình vận tải» (từng đối tượng)', 'Hàng hóa vận chuyển qua các kỳ', 'Theo 126 xã, phường'],
  kt=[], loi=['Dữ liệu mẫu «Năm», «Tháng» để trống; khối lượng luân chuyển mẫu 1.0E12']),
]
SXD_CAU = [
 '**Nhà ở (eform 1)**: số công trình theo tình trạng — «Đã cấp phép», «Đã hoàn thành», «Đưa vào sử dụng» là số phát sinh trong kỳ, «Đang thi công» là số tại thời điểm? Em đề xuất: đúng như vậy (xem quý: cộng 3 tháng cho 3 tình trạng đầu, lấy tháng cuối cho "Đang thi công").',
 '**«Số tầng» (eform 1)** của một dòng gộp nhiều công trình là gì (bình quân? cao nhất?)? Em đề xuất: hiện đúng số đã nhập khi dòng là một bản ghi, không cộng, không tự tính bình quân.',
 '**«Hành khách.km (tự tính)» (eform 2)** để trống kiểu nhập. Em đề xuất: bản ghi có số thì dùng số đó; trống thì IOC tính = lượt × cự ly bình quân (ghi "IOC tính"); cự ly bình quân gộp = hành khách.km ÷ lượt.',
 '**Eform 2** ghi "cấp đơn vị vận tải (doanh nghiệp/htx)" nhưng không có trường tên doanh nghiệp, «Đơn vị báo cáo» là 126 xã, phường. Em đề xuất: hiện theo xã, phường như eform đang có; báo bên eform nếu cần thêm trường doanh nghiệp.',
 '**«Cấp báo cáo» (eform 3, 4)**: cùng xã, cùng kỳ có cả bản Sở/Ngành và bản Xã/Phường thì sao? Em đề xuất: không cộng chồng — có bản Sở/Ngành thì dùng bản Sở/Ngành.',
]

# ============================================================ DÂN TỘC VÀ TÔN GIÁO
DTTG = [
 dict(iok='Sở Dân tộc và Tôn giáo → eform 1 (một thẻ, 45 trường)', ban_ghi='một dự án, tiểu dự án, hoạt động hoặc công trình («Tên dự án/tiểu dự án/hoạt động», «Loại bản ghi») theo một «Nguồn vốn» tại một xã, phường (có thể đến thôn) trong một kỳ',
  khoa='«Địa bàn» + «Thôn/TDP» (được để trống) + «Tên dự án/tiểu dự án/hoạt động» + «Loại bản ghi» + «Nguồn vốn» + kỳ',
  loai_so='Kế hoạch vốn năm, vốn phân bổ, giải ngân lũy kế, vốn đình trệ: tại thời điểm (kỳ cuối). Giải ngân kỳ này, số vụ vi phạm: phát sinh (cộng). Tỷ lệ, tiến độ: số đã nhập. Kết quả vùng (trường 26–37): số của cả xã — lấy một lần mỗi xã (câu hỏi 1)',
  vai={'dia_ban': DB, 'thon_tdp': 'Khóa (được để trống); mô tả dòng', 'ten_du_an_hoat_dong': 'Khóa; chia cấp 2', 'du_an_thanh_phan_noi_dung': 'Chia cấp 1 (7 nội dung); biểu đồ',
       'loai_ban_ghi': 'Khóa; bỏ «Không phát sinh» khỏi phần tính (câu hỏi 2)', 'nguon_von': 'Khóa; biểu đồ vốn theo nguồn', 'ke_hoach_von_nam_trieu_dong': TD + ' (triệu đồng); mẫu số tỷ lệ giải ngân/KH',
       'von_duoc_phan_bo_trieu_dong': TD + ' (triệu đồng); mẫu số tỷ lệ giải ngân/phân bổ', 'giai_ngan_ky_nay_trieu_dong': PS + ' (triệu đồng)', 'giai_ngan_luy_ke_trieu_dong': TD + ' (triệu đồng); tử số tỷ lệ giải ngân',
       'ty_le_giai_ngan_ke_hoach': NHAP, 'ty_le_giai_ngan_phan_bo': NHAP, 'trang_thai_trien_khai': 'Biểu đồ; đếm dự án theo trạng thái', 'tien_do_ke_hoach_pct': 'Số đã nhập: hiện đúng, không gộp', 'tien_do_thuc_te_pct': 'Số đã nhập: hiện đúng, không gộp',
       'dung_tien_do': 'Đếm dự án đúng / không đúng tiến độ', 'von_dinh_tre_phap_ly_tthc_trieu_dong': TD + ' (triệu đồng)', 'ty_le_von_dinh_tre': NHAP, 'so_vu_vi_pham_sai_pham': PS,
       'bao_cao_ktgs_dung_han': 'Đếm bản ghi Có / Không', 'ap_dung_cong_nghe_so': 'Đếm bản ghi Có / Không',
       'so_ho_dtts': 'Kết quả vùng: lấy một lần mỗi xã (kỳ cuối); mẫu số tỷ lệ nước HVS', 'so_ho_dtts_dung_nuoc_hvs': 'Kết quả vùng: một lần mỗi xã; tử số', 'ty_le_ho_dtts_dung_nuoc_hvs': NHAP,
       'so_dia_ban_co_duong_o_to_den_trung_tam': 'Kết quả vùng: một lần mỗi xã; mẫu số', 'so_dia_ban_da_cung_hoa': 'Kết quả vùng: một lần mỗi xã; tử số', 'ty_le_duong_trung_tam_cung_hoa': NHAP,
       'so_hs_trong_do_tuoi': 'Kết quả vùng: một lần mỗi xã; mẫu số', 'so_hs_di_hoc_dung_cap': 'Kết quả vùng: một lần mỗi xã; tử số', 'ty_le_hs_di_hoc_dung_cap': NHAP,
       'so_ho_ngheo_dau_ky': 'Kết quả vùng: một lần mỗi xã; mẫu số tỷ lệ giảm hộ nghèo', 'so_ho_ngheo_cuoi_ky': 'Kết quả vùng: một lần mỗi xã', 'ty_le_giam_ho_ngheo': NHAP,
       'nguon_du_lieu': 'Biểu đồ theo nguồn dữ liệu', 'trang_thai_doi_soat': 'Biểu đồ; đếm bản ghi cần giải trình', 'trang_thai_chat_luong_du_lieu': 'Biểu đồ; bản ghi khác "Đạt logic sơ bộ" được tô màu'},
  chi=['Số dự án, tiểu dự án, công trình (đếm bản ghi, bỏ «Không phát sinh»); theo «Dự án thành phần», «Trạng thái triển khai»; số đúng tiến độ',
       'Vốn (triệu đồng): kế hoạch năm, phân bổ, giải ngân lũy kế, vốn đình trệ (kỳ cuối); giải ngân kỳ này (cộng)',
       'Tỷ lệ giải ngân so kế hoạch, so phân bổ (IOC tính = lũy kế ÷ kế hoạch, ÷ phân bổ × 100); tỷ lệ đã nhập hiện đúng số; tỷ lệ vốn đình trệ (IOC tính)',
       'Kết quả vùng: hộ DTTS dùng nước hợp vệ sinh, đường trung tâm cứng hóa, học sinh đi học đúng cấp, giảm hộ nghèo — tử, mẫu lấy một lần mỗi xã; tỷ lệ IOC tính, tỷ lệ đã nhập hiện đúng số',
       'Số vụ vi phạm/sai phạm; báo cáo KTGS đúng hạn; áp dụng công nghệ số; bản ghi theo trạng thái đối soát, cờ dữ liệu'],
  bieu=['Vốn theo «Nguồn vốn»; theo «Dự án thành phần»', 'Dự án theo «Trạng thái triển khai»', 'Thanh 4 tỷ lệ kết quả vùng', 'Giải ngân lũy kế qua các kỳ', 'Theo 126 xã, phường: giải ngân, tỷ lệ giải ngân, kết quả vùng'],
  kt=['Tỷ lệ đã nhập lệch IOC tính quá 0,1 điểm (giải ngân/KH, giải ngân/phân bổ, 4 tỷ lệ vùng)', '«Giải ngân lũy kế» nhỏ hơn «Giải ngân kỳ này»', 'Số "có" lớn hơn số "tổng" (nước HVS, đường cứng hóa, học sinh)',
      '«Cờ dữ liệu» khác "Đạt logic sơ bộ"', 'Đình trệ, tạm dừng mà để trống «Vướng mắc/Nguyên nhân»'],
  loi=['Không có trường nối tiểu dự án, công trình với dự án cha — cộng mọi bản ghi có thể cộng chồng (câu hỏi 2)', 'Trường kết quả vùng (hộ DTTS, đường, học sinh, hộ nghèo) là số của cả xã nhưng nằm trong bản ghi dự án — có thể ghi lặp',
       'Dữ liệu mẫu: giải ngân lũy kế 200,84 < kỳ này 250,2; tỷ lệ không khớp; «Địa bàn» "phường Cầu Giấy" chữ thường']),
]
DTTG_CAU = [
 '**Kết quả vùng (trường 26–37: hộ DTTS, nước sạch, đường, học sinh, hộ nghèo)** là số của cả xã, ghi lặp ở mọi bản ghi dự án của xã đó? Em đề xuất: lấy một lần mỗi xã (bản gửi sau cùng trong kỳ xem), không cộng theo số dự án.',
 '**Dự án / tiểu dự án / công trình**: eform không có trường nối bản con với bản cha. Em đề xuất: coi mỗi bản ghi là một đầu mục độc lập, cộng vốn của mọi bản ghi (bỏ «Không phát sinh»); màn hình ghi rõ "cộng mọi loại bản ghi"; báo bên eform nếu bản con có lặp số của bản cha.',
 '**Vốn**: kế hoạch năm, phân bổ, giải ngân lũy kế là số tại thời điểm (xem quý lấy tháng cuối); giải ngân kỳ này cộng. Em đề xuất đúng như vậy; tỷ lệ đã nhập hiện đúng số, IOC tính kèm.',
]

# ============================================================ Y TẾ
SYT = [
 dict(iok='Sở Y tế → eform 1 (thẻ "Ngộ độc thực phẩm")', ban_ghi='một vụ ngộ độc thực phẩm («Tên vụ việc», «Ngày phát hiện») tại một xã, phường', khoa='«Địa bàn» + «Tên vụ việc» + «Ngày phát hiện» + kỳ',
  loai_so='Số của vụ: một vụ nhập lại khi cập nhật thì lấy bản gửi sau cùng trong kỳ xem (câu hỏi 1)',
  vai={'dia_ban': DB, 'thon_tdp': TDP, 'ten_vu_viec': 'Khóa; đếm số vụ', 'ngay_phat_hien': 'Khóa; xếp tháng của biểu đồ', 'so_nguoi_mac_nhap_vien': 'Số của vụ: cộng', 'so_ca_nang': 'Số của vụ: cộng', 'so_ca_tu_vong': 'Số của vụ: cộng',
       'nguyen_nhan_nghi_ngo': 'Biểu đồ theo nguyên nhân (chữ do đơn vị gõ)'},
  chi=['Số vụ ngộ độc (mỗi vụ một lần)', 'Cộng người mắc/nhập viện, ca nặng, ca tử vong'], bieu=['Vụ theo «Nguyên nhân nghi ngờ»', 'Người mắc qua các kỳ', 'Theo 126 xã, phường: số vụ, người mắc'],
  kt=['«Số ca nặng» hoặc «Số ca tử vong» lớn hơn «Số người mắc/nhập viện»'], loi=['Tài liệu cũ dùng «Mã bản ghi» làm khóa — eform không có trường này', 'Dữ liệu mẫu «Địa bàn» "phường Cầu Giấy" chữ thường; «Tên vụ việc» là tên phường']),
 dict(iok='Sở Y tế → eform 2 (thẻ "Bao phủ bảo hiểm y tế")', ban_ghi='dân số và số người có thẻ BHYT của một thôn/TDP thuộc một xã, phường tại thời điểm báo cáo', khoa='«Địa bàn» + «Thôn/TDP» + kỳ',
  loai_so='Tại thời điểm: xem quý, năm lấy kỳ cuối',
  vai={'thon_tdp': 'Khóa; chia cấp 2', 'tong_dan_so_thon': TD + '; mẫu số tỷ lệ', 'so_nguoi_co_the_bhyt': TD + '; tử số tỷ lệ', 'dia_ban': DB},
  chi=['Tổng dân số, số người có thẻ BHYT (kỳ cuối)', 'Tỷ lệ bao phủ BHYT (IOC tính) = số có thẻ ÷ dân số × 100'], bieu=['Tỷ lệ bao phủ qua các kỳ', 'Theo 126 xã, phường: tỷ lệ bao phủ (xếp thứ tự)'],
  kt=['«Số người có thẻ BHYT» lớn hơn «Tổng dân số thôn»'], loi=[]),
 dict(iok='Sở Y tế → eform 3 (thẻ "Dịch bệnh nhóm A, B")', ban_ghi='số ca mắc một bệnh («Tên bệnh») tại một thôn/TDP thuộc một xã, phường, phát hiện trong kỳ', khoa='«Địa bàn» + «Thôn/TDP» + «Tên bệnh» + «Ngày phát hiện» + kỳ',
  loai_so='Phát sinh trong kỳ: cộng',
  vai={'dia_ban': DB, 'thon_tdp': 'Khóa; mô tả dòng', 'ten_benh': 'Khóa; chia cấp 1; biểu đồ (chữ do đơn vị gõ)', 'ngay_phat_hien': 'Khóa; xếp tháng', 'so_ca_mac': PS, 'so_ca_nang': PS, 'so_ca_tu_vong': PS, 'bien_phap_xu_ly': 'Mô tả dòng'},
  chi=['Cộng ca mắc, ca nặng, ca tử vong theo «Tên bệnh»', 'Số ổ dịch (bản ghi)'], bieu=['Ca mắc theo bệnh', 'Ca mắc qua các kỳ', 'Theo 126 xã, phường'],
  kt=['«Số ca nặng» hoặc «Số ca tử vong» lớn hơn «Số ca mắc»'], loi=['«Tên bệnh» kiểu Chữ không danh mục — gõ khác nhau thì tách nhóm; Luật có danh mục bệnh nhóm A, B']),
 dict(iok='Sở Y tế → eform 4 (thẻ "Hồ sơ sức khỏe điện tử")', ban_ghi='dân số và số người có hồ sơ sức khỏe điện tử của một thôn/TDP thuộc một xã, phường tại thời điểm báo cáo', khoa='«Địa bàn» + «Thôn/TDP» + kỳ',
  loai_so='Tại thời điểm: xem quý, năm lấy kỳ cuối',
  vai={'thon_tdp': 'Khóa; chia cấp 2', 'tong_dan_so_thon': TD + '; mẫu số tỷ lệ', 'so_nguoi_co_ho_so_skdt': TD + '; tử số tỷ lệ', 'dia_ban': DB},
  chi=['Tổng dân số, số người có hồ sơ SKĐT (kỳ cuối)', 'Tỷ lệ có hồ sơ SKĐT (IOC tính)'], bieu=['Tỷ lệ qua các kỳ', 'Theo 126 xã, phường'],
  kt=['«Số người có hồ sơ SKĐT» lớn hơn «Tổng dân số thôn»'], loi=[]),
]
SYT_CAU = [
 '**Ngộ độc thực phẩm (eform 1)**: eform không còn «Mã bản ghi» (tài liệu cũ dùng làm khóa). Em đề xuất khóa một vụ = «Địa bàn» + «Tên vụ việc» + «Ngày phát hiện»; vụ nhập lại khi cập nhật thì lấy bản sau cùng trong kỳ xem.',
 '**Dịch bệnh (eform 3)**: «Số ca mắc» là số phát sinh trong kỳ (cộng khi xem quý, năm)? Em đề xuất: đúng vậy. «Tên bệnh» kiểu Chữ: hiện đúng chữ đã nhập.',
]

# ============================================================ VH&TT
VH_DS = 'Biểu đồ; đếm bản ghi cần bổ sung'
VHTT = [
 dict(iok='Sở VH, TT và Du lịch → eform 1 (thẻ "Chương trình 08-CT")', ban_ghi='tiến độ một chỉ tiêu/nhiệm vụ của Chương trình 08-CT do một đơn vị chủ trì, trong một kỳ',
  khoa='«Chỉ tiêu / Nhiệm vụ» + «Đơn vị chủ trì» + «Địa bàn» (được để trống) + kỳ', loai_so='Tình trạng tại thời điểm: xem quý, năm thì mỗi nhiệm vụ lấy bản báo cáo cuối',
  vai={'chi_tieu_nhiem_vu': 'Khóa; chia cấp 2; đếm nhiệm vụ', 'don_vi_chu_tri': 'Khóa; chia cấp 1; biểu đồ (chữ do đơn vị gõ)', 'tien_do_thuc_hien': 'Biểu đồ nhiệm vụ theo tiến độ (đúng chữ đã nhập — câu hỏi 2)',
       'ngay_cap_nhat_tien_do': 'Mô tả dòng', 'dia_ban': 'Khóa (được để trống); xã, phường nếu có'},
  chi=['Số nhiệm vụ (mỗi nhiệm vụ một lần)', 'Nhiệm vụ theo «Tiến độ thực hiện», theo «Đơn vị chủ trì»'], bieu=['Nhiệm vụ theo tiến độ thực hiện', 'Nhiệm vụ theo đơn vị chủ trì'],
  kt=[], loi=['«Thời gian hoàn thành theo Kế hoạch» kiểu Chữ, mẫu là số ngày Excel (46266)', 'Sheet "Những chỉ tiêu bị thay đổi" ghi «Tiến độ thực hiện» đã bị xóa (cùng 5 trường dự án) nhưng sheet vẫn còn trường này (câu hỏi 2)',
       'Nhóm "Dự án 2026–2030" trên màn cũ dựng từ eform «Cơ cấu dự án …» không còn trong file — bỏ khỏi màn mới']),
 dict(iok='Sở VH, TT và Du lịch → eform 2 (thẻ "Người tham gia hoạt động nghệ thuật")', ban_ghi='một hoạt động, chương trình nghệ thuật («Tên hoạt động/chương trình», «Ngày bắt đầu») tại một xã, phường',
  khoa='«Tên hoạt động/chương trình» + «Địa bàn» + «Ngày bắt đầu» + kỳ', loai_so='Số của hoạt động (buổi, người tham gia): cộng',
  vai={'don_vi_to_chuc': 'Mô tả dòng', 'hoat_dong_nghe_thuat': 'Chia cấp 1; biểu đồ', 'ten_hoat_dong_chuong_trinh': 'Khóa; chia cấp 2', 'loai_hoat_dong': 'Biểu đồ', 'quy_mo_ioc': 'Biểu đồ theo quy mô', 'cap_to_chuc_thuc_te': 'Biểu đồ',
       'dia_ban': DB, 'thon_tdp': TDP, 'ngay_bat_dau': 'Khóa; xếp tháng', 'ngay_ket_thuc': 'Kiểm tra thứ tự ngày', 'so_buoi_dem_dien': PS, 'so_nguoi_tham_gia': PS, 'trang_thai_doi_soat': VH_DS},
  chi=['Số hoạt động; cộng số buổi/đêm diễn, số người tham gia', 'Hoạt động theo loại, quy mô, cấp tổ chức'], bieu=['Người tham gia theo «Hoạt động/ Nghệ thuật»', 'Hoạt động theo «Quy mô IOC», «Cấp tổ chức thực tế»', 'Người tham gia qua các kỳ', 'Theo 126 xã, phường'],
  kt=['«Ngày kết thúc» trước «Ngày bắt đầu»'], loi=['«Hoạt động/ Nghệ thuật» và «Loại hoạt động» có danh mục gần trùng nhau']),
 dict(iok='Sở VH, TT và Du lịch → eform 3 (thẻ "Doanh thu đơn vị nghệ thuật")', ban_ghi='doanh thu, chi phí của một hoạt động do một đơn vị nghệ thuật Thành phố quản lý tổ chức',
  khoa='«Đơn vị nghệ thuật TP quản lý» + «Tên hoạt động/chương trình» + «Ngày bắt đầu» + kỳ', loai_so='Phát sinh: cộng. «Tổng doanh thu (tỷ đồng)»: số đã nhập, đối chiếu với tổng (triệu đồng)',
  vai={'don_vi_nghe_thuat_tp_quan_ly': 'Khóa; chia cấp 1; biểu đồ doanh thu theo đơn vị', 'ten_hoat_dong_chuong_trinh': 'Khóa; chia cấp 2', 'loai_hoat_dong': 'Mô tả dòng (chữ)', 'tinh_chat': 'Biểu đồ; bỏ «Không phát sinh»',
       'quy_mo_ioc': 'Biểu đồ', 'cap_to_chuc_thuc_te': 'Biểu đồ', 'dia_ban': DB, 'thon_tdp': TDP, 'ngay_bat_dau': 'Khóa; xếp tháng', 'ngay_ket_thuc': 'Kiểm tra thứ tự ngày',
       'so_buoi_dem_dien': PS, 'so_ve_ban': PS, 'gia_ve_binh_quan_dong': 'Số đã nhập: không cộng', 'doanh_thu_ban_ve_trieu_dong': PS + '; thành phần tổng', 'doanh_thu_hop_dong_dat_hang_trieu_dong': PS + '; thành phần tổng',
       'doanh_thu_tai_tro_quang_cao_trieu_dong': PS + '; thành phần tổng', 'doanh_thu_dich_vu_khac_trieu_dong': PS + '; thành phần tổng', 'tong_doanh_thu_trieu_dong': 'Số tổng đã nhập: cộng; đối chiếu 4 thành phần',
       'tong_doanh_thu_ty_dong': 'Số đã nhập: đối chiếu = triệu đồng ÷ 1.000 (câu hỏi 3)', 'luot_khan_gia': PS, 'kinh_phi_nsnn_ho_tro_trieu_dong': PS, 'chi_phi_truc_tiep_trieu_dong': PS,
       'chenh_lech_thu_chi_trieu_dong': 'Số đã nhập: cộng; đối chiếu tổng doanh thu − chi phí trực tiếp', 'trang_thai_hach_toan': 'Biểu đồ'},
  chi=['Cộng doanh thu 4 nguồn, tổng doanh thu (triệu đồng), lượt khán giả, NSNN hỗ trợ, chi phí trực tiếp, chênh lệch thu – chi', 'Số hoạt động có thu; số vé bán'],
  bieu=['Cơ cấu tổng doanh thu theo 4 nguồn', 'Doanh thu theo đơn vị nghệ thuật', 'Tổng doanh thu qua các kỳ', 'Theo 126 xã, phường: doanh thu, khán giả'],
  kt=['«Tổng doanh thu (triệu đồng)» khác cộng 4 nguồn', '«Tổng doanh thu (tỷ đồng)» khác tổng (triệu đồng) ÷ 1.000', '«Chênh lệch thu-chi» khác tổng doanh thu − chi phí trực tiếp', '«Ngày kết thúc» trước «Ngày bắt đầu»'],
  loi=['Hai trường tổng doanh thu (triệu đồng và tỷ đồng) cho cùng một số', 'Dữ liệu mẫu: dịch vụ khác 46.058 triệu, tổng (tỷ đồng) 46.082 — lệch đơn vị']),
 dict(iok='Sở VH, TT và Du lịch → eform 4 (thẻ "Hoạt động nghệ thuật chuyên nghiệp")', ban_ghi='một hoạt động nghệ thuật chuyên nghiệp («Tên hoạt động nghệ thuật», «Ngày bắt đầu») do một xã, phường báo cáo',
  khoa='«Tên hoạt động nghệ thuật» + «Đơn vị báo cáo» + «Ngày bắt đầu» + kỳ', loai_so='Số của hoạt động: cộng; tiền là đồng',
  vai={'don_vi_bao_cao': DB, 'thon_tdp': TDP, 'ten_hoat_dong_nghe_thuat': 'Khóa; chia cấp 2', 'ngay_bat_dau': 'Khóa; xếp tháng', 'ngay_ket_thuc': 'Kiểm tra thứ tự ngày',
       'loai_hinh_theo': 'Biểu đồ (liên hoan, hội diễn, hội thi)', 'tinh_chat_theo': 'Biểu đồ', 'quy_mo_theo': 'Biểu đồ (danh mục có giá trị lạ — câu hỏi 4)', 'cap_to_chuc_thuc_te': 'Biểu đồ',
       'loai_hinh_nghe_thuat': 'Chia cấp 1; biểu đồ', 'hinh_thuc_to_chuc': 'Biểu đồ', 'so_buoi_dem_dien': PS, 'so_luot_nghe_si_dien_vien': PS, 'so_luot_khan_gia': PS, 'so_ve_khach_moi_phat_hanh': PS,
       'doanh_thu_ve_dich_vu_dong': PS + ' (đồng)', 'kinh_phi_nsnn_ho_tro_dong': PS + ' (đồng)', 'nguon_kinh_phi_khac_dong': PS + ' (đồng)', 'trang_thai_hoat_dong': 'Biểu đồ; bỏ «Không phát sinh»; chỉ tiêu chính tính hoạt động «Đã diễn ra»'},
  chi=['Số hoạt động đã diễn ra; theo loại hình nghệ thuật, quy mô, hình thức', 'Cộng buổi diễn, lượt nghệ sĩ, khán giả, vé phát hành, doanh thu, NSNN, kinh phí khác'],
  bieu=['Hoạt động theo «Loại hình nghệ thuật»', 'Theo «Quy mô theo», «Hình thức tổ chức», «Trạng thái hoạt động»', 'Khán giả qua các kỳ', 'Theo 126 xã, phường'],
  kt=['«Ngày kết thúc» trước «Ngày bắt đầu»', 'Khán giả lớn hơn vé/khách mời phát hành nhiều lần (hơn 2 lần)'],
  loi=['Danh mục «Quý» ghi "Quý III" hai lần (mã quy_ii mang tên "Quý III")', 'Danh mục «Quy mô theo» có một câu bị tách thành 2 mã ("Khác cấp địa bàn - chỉ để drill-down" | "không cộng vào phân tổ chuẩn nếu chưa được duyệt")', 'Dữ liệu mẫu «Năm», «Tháng» trống']),
 dict(iok='Sở VH, TT và Du lịch → eform 5 (thẻ "Thông tin báo chí, mạng xã hội")', ban_ghi='một tin, bài trên báo, trang tin hoặc mạng xã hội về Thành phố',
  khoa='«Tiêu đề tin/bài» + «Tên báo/trang tin/mạng xã hội» + «Ngày đăng» + kỳ', loai_so='Số tương tác của tin/bài: cộng',
  vai={'ngay_dang': 'Khóa; xếp tháng', 'thoi_gian_cap_nhat': 'Kiểm tra thứ tự ngày', 'tieu_de_tin_bai': 'Khóa; đếm tin bài', 'loai_nguon': 'Chia cấp 1; biểu đồ', 'ten_bao_trang_tin_mang_xa_hoi': 'Khóa; chia cấp 2',
       'linh_vuc': 'Biểu đồ (chữ do đơn vị gõ)', 'chu_de': 'Mô tả dòng', 'dia_ban': DB, 'muc_do_cam_xuc': 'Biểu đồ; đếm tin tiêu cực', 'muc_do_lan_toa': 'Biểu đồ', 'muc_do_quan_tam': 'Biểu đồ',
       'luot_xem': PS, 'luot_chia_se': PS, 'luot_binh_luan': PS, 'luot_thich': PS, 'luot_tiep_can_reach': PS, 'diem_tuong_tac_engagement': PS, 'xu_huong': 'Biểu đồ', 'muc_do_uu_tien_xu_ly': 'Đếm tin ưu tiên Cao, Khẩn cấp', 'trang_thai_doi_soat': VH_DS},
  chi=['Số tin, bài; theo loại nguồn, mức độ cảm xúc (tích cực, trung tính, tiêu cực), lan tỏa', 'Cộng lượt xem, chia sẻ, bình luận, thích, tiếp cận, điểm tương tác', 'Số tin tiêu cực; số tin ưu tiên Cao, Khẩn cấp'],
  bieu=['Cơ cấu tin theo mức độ cảm xúc', 'Tin theo loại nguồn, lĩnh vực', 'Số tin, bài qua các kỳ', 'Theo 126 xã, phường: số tin, tin tiêu cực'],
  kt=['«Thời gian cập nhật» trước «Ngày đăng»'], loi=['«Link bài viết» mẫu "không có" nên không dùng làm khóa']),
]
VHTT_CAU = [
 '**Gộp Du lịch vào Sở VH, TT và Du lịch**: IOC đang gộp thẻ Sở Du lịch vào "Sở Văn hóa, Thể thao và Du lịch" (cờ UBND_SAP_XEP_SO_2026). Em đề xuất: một đơn vị gồm 7 eform (5 sheet "Sở VHTT" + 2 sheet "Sở Du lịch"); tắt cờ thì tách lại 2 đơn vị.',
 '**«Tiến độ thực hiện» (eform 1)**: sheet "Những chỉ tiêu bị thay đổi" ghi đã xóa, nhưng sheet "Sở VHTT" vẫn còn. Em đề xuất: IOC theo sheet (giữ trường, hiện đúng chữ đã nhập); hỏi bên eform. Nhóm "Dự án 2026–2030" của màn cũ (eform đã bỏ) không có ở màn mới.',
 '**Doanh thu (eform 3)**: hai trường tổng doanh thu (triệu đồng và tỷ đồng). Em đề xuất: số chính là «Tổng doanh thu (triệu đồng)»; «… (tỷ đồng)» hiện đúng như nhập, đối chiếu = triệu ÷ 1.000, lệch thì đánh dấu. Chênh lệch thu – chi đối chiếu với tổng doanh thu − chi phí trực tiếp.',
 '**«Quy mô theo», «Quý» (eform 4)** có lỗi danh mục. Em đề xuất: «Quy mô theo» hiện đúng như danh mục; «Quý» hiện tên theo mã (quy_ii → Quý II) như đã làm với «Kỳ báo cáo».',
]

# ============================================================ DU LỊCH
DL = [
 dict(iok='Sở VH, TT và Du lịch → eform 6 (thẻ "Khách du lịch") — sheet "Sở Du lịch"', ban_ghi='số lượt khách quốc tế, nội địa theo «Loại điểm du lịch» của một xã, phường («Đơn vị báo cáo») trong một tháng',
  khoa='«Đơn vị báo cáo» + «Loại điểm du lịch» + kỳ', loai_so='Phát sinh trong kỳ: cộng',
  vai={'don_vi_bao_cao': DB, 'loai_diem_du_lich': 'Chia cấp 1; biểu đồ', 'so_luot_khach_du_lich_quoc_te': PS, 'so_luot_khach_du_lich_noi_dia': PS},
  chi=['Lượt khách quốc tế, nội địa, tổng (IOC tính = quốc tế + nội địa)'], bieu=['Cơ cấu khách quốc tế – nội địa', 'Khách theo loại điểm du lịch', 'Tổng lượt khách qua các kỳ', 'Theo 126 xã, phường'],
  kt=[], loi=['«Kỳ báo cáo» chỉ có mã Tháng; «Năm» kiểu Số nhưng kèm danh sách "Năm | Quý"', 'Dữ liệu mẫu số khách 1,2 tỷ lượt']),
 dict(iok='Sở VH, TT và Du lịch → eform 7 (thẻ "Doanh thu du lịch") — sheet "Sở Du lịch"', ban_ghi='doanh thu một «Loại doanh thu» theo «Loại điểm du lịch» của một xã, phường trong một kỳ (số khách ghi kèm)',
  khoa='«Đơn vị báo cáo» + «Loại điểm du lịch» + «Loại doanh thu» + kỳ', loai_so='Doanh thu: phát sinh, cộng theo loại. Số khách ghi kèm: lấy một lần mỗi xã × loại điểm × kỳ (câu hỏi 1)',
  vai={'don_vi_bao_cao': DB + ' (kiểu Chữ có kèm danh sách: hiện đúng chữ)', 'loai_diem_du_lich': 'Chia cấp 2; biểu đồ', 'so_luot_khach_du_lich_quoc_te': 'Ghi kèm: một lần mỗi xã × loại điểm × kỳ', 'so_luot_khach_du_lich_noi_dia': 'Ghi kèm: một lần mỗi xã × loại điểm × kỳ',
       'loai_doanh_thu': 'Chia cấp 1: không cộng «Tổng thu từ khách du lịch» với 2 loại kia (câu hỏi 2)', 'gia_tri_doanh_thu_vnd': 'Số phát sinh: cộng theo loại doanh thu (đồng)'},
  chi=['Doanh thu lưu trú và ăn uống; doanh thu lữ hành; tổng thu từ khách du lịch — mỗi loại cộng riêng (đồng)'], bieu=['Doanh thu theo loại doanh thu', 'Doanh thu theo loại điểm', 'Tổng thu qua các kỳ', 'Theo 126 xã, phường'],
  kt=['«Tổng thu từ khách du lịch» nhỏ hơn cộng 2 loại kia cùng xã, cùng kỳ'], loi=['«Đơn vị báo cáo» kiểu Chữ nhưng kèm danh sách 126 xã, phường', 'Số khách lặp lại ở mọi loại doanh thu']),
]
DL_CAU = [
 '**Số khách ở eform Doanh thu** ghi lặp ở mỗi «Loại doanh thu». Em đề xuất: số khách chính lấy từ eform Khách du lịch; ở eform Doanh thu chỉ hiện để đối chiếu, mỗi xã × loại điểm × kỳ lấy một lần.',
 '**«Tổng thu từ khách du lịch»** là một loại doanh thu riêng (tổng) hay một nguồn thu thứ ba? Em đề xuất: là tổng — hiện riêng, không cộng với lưu trú, lữ hành; đánh dấu khi nhỏ hơn tổng 2 loại kia.',
]

# ============================================================ BAN QL KHU CNC
BQL = [
 dict(iok='Ban QL Khu CNC và KCN → eform 1 (một thẻ, 24 trường)', ban_ghi='số liệu một khu (công nghiệp, chế xuất, kinh tế, công nghệ cao — «Loại khu», «Tên khu») trên một xã, phường trong một kỳ',
  khoa='«Địa bàn» + «Loại khu» + «Tên khu» (hai trường sau được để trống: bổ sung sau) + kỳ',
  loai_so='Doanh nghiệp, vốn đăng ký, lao động, diện tích quy hoạch, lấp đầy: tại thời điểm (kỳ cuối). Thành lập/điều chỉnh, dự án mới, vốn mới, vốn hạ tầng, doanh thu: phát sinh (cộng)',
  vai={'dia_ban': DB, 'so_doanh_nghiep_dang_hoat_dong': TD, 'tong_von_dau_tu_dang_ky_ty_dong': TD + ' (tỷ đồng)', 'so_lao_dong_dang_lam_viec': TD, 'doi_tac_nha_dau_tu_chinh': 'Mô tả dòng',
       'so_luong_thanh_lap_dieu_chinh_trong_ky': PS, 'noi_dung_thanh_lap_dieu_chinh_gan_nhat': 'Mô tả dòng', 'so_du_an_thu_hut_dau_tu_moi_trong_ky': PS, 'tong_von_thu_hut_dau_tu_moi_ty_dong': PS + ' (tỷ đồng)',
       'tinh_hinh_dau_tu_ket_cau_ha_tang': 'Biểu đồ theo chữ đã nhập', 'von_dau_tu_ha_tang_trong_ky_ty_dong': PS + ' (tỷ đồng)', 'doanh_thu_san_xuat_kinh_doanh_trong_ky_ty_dong': PS + ' (tỷ đồng)',
       'tinh_hinh_bao_ve_moi_truong': 'Mô tả dòng', 'dat_chuan_moi_truong': 'Biểu đồ theo chữ đã nhập', 'loai_khu': 'Khóa; chia cấp 1; biểu đồ', 'ten_khu': 'Khóa; chia cấp 2',
       'dien_tich_quy_hoach_ha': TD + ' (ha); mẫu số tỷ lệ lấp đầy', 'dien_tich_da_lap_day_ha': TD + ' (ha); tử số tỷ lệ lấp đầy', 'ty_le_lap_day_phan_tram': NHAP},
  chi=['Doanh nghiệp đang hoạt động, vốn đầu tư đăng ký, lao động (kỳ cuối)', 'Thành lập/điều chỉnh, dự án mới, vốn thu hút mới, vốn hạ tầng, doanh thu (cộng)',
       'Diện tích quy hoạch, đã lấp đầy (kỳ cuối); tỷ lệ lấp đầy IOC tính = lấp đầy ÷ quy hoạch × 100; tỷ lệ đã nhập hiện đúng số'],
  bieu=['Theo «Loại khu»: doanh nghiệp, lao động, diện tích', 'Vốn thu hút mới qua các kỳ', 'Tình hình hạ tầng, đạt chuẩn môi trường (đúng chữ đã nhập)', 'Theo 126 xã, phường'],
  kt=['«Diện tích đã lấp đầy» lớn hơn «Diện tích quy hoạch»', '«Tỷ lệ lấp đầy (%)» lệch IOC tính quá 0,1 điểm'],
  loi=['5 trường Loại khu, Tên khu, Diện tích quy hoạch, Diện tích lấp đầy, Tỷ lệ lấp đầy được bổ sung sau khi gửi file mô tả (sheet "Những chỉ tiêu bị thay đổi")', 'Dữ liệu mẫu: tỷ lệ lấp đầy 30 nhưng 1.800 ÷ 2.000 = 90%; lao động 1,23 triệu; «Đạt chuẩn môi trường» kiểu Chữ']),
]
BQL_CAU = [
 '**Một bản ghi là một khu hay một địa bàn?** Trước khi bổ sung «Loại khu», «Tên khu», bản ghi theo địa bàn. Em đề xuất: khóa = Địa bàn + Loại khu + Tên khu (hai trường sau được để trống để bản ghi cũ vẫn hợp lệ); số doanh nghiệp, vốn, lao động, diện tích là số tại thời điểm (xem quý lấy tháng cuối), các số "trong kỳ" cộng.',
]

if __name__ == '__main__':
    A = dict(duyet=DUYET)
    H = lambda nguon, cap, an: HEAD(nguon, cap, an, DUYET)
    gen(os.path.join(OUTD, 'SO_KHCN_2026_10_28.md'), '# BẢN ĐỌC EFORM — SỞ KHOA HỌC VÀ CÔNG NGHỆ (3 eform)',
        H('sheet "Sở KHCN" của "File mô tả đầu vào eform"', 'Sở, ngành → Sở KH&CN → 3 eform (mỗi eform một thẻ) → Nhóm → Dòng số liệu → Bản ghi; cả 3 có «Địa bàn» nên có màn «Theo 126 xã, phường».',
          '12 chỉ tiêu cũ (khcn-config.js) thay bằng eform; khai báo cũ tắt bằng cờ, không xóa.'), 'khcn', KHCN, KHCN_CAU, **A)
    gen(os.path.join(OUTD, 'SO_XAY_DUNG_2026_10_28.md'), '# BẢN ĐỌC EFORM — SỞ XÂY DỰNG (4 eform)',
        H('sheet "Sở Xây dựng"', 'Sở, ngành → Sở Xây dựng → 4 eform (mỗi eform một thẻ); cả 4 có xã, phường («Đơn vị báo cáo» hoặc «Địa bàn») nên có màn «Theo 126 xã, phường».',
          '12 chỉ tiêu cũ (sxd-config.js, có số "cùng kỳ" ngoài eform) thay bằng eform; khai báo cũ tắt bằng cờ, không xóa.'), 'sxd', SXD, SXD_CAU, **A)
    gen(os.path.join(OUTD, 'SO_DTTG_2026_10_28.md'), '# BẢN ĐỌC EFORM — SỞ DÂN TỘC VÀ TÔN GIÁO (1 eform)',
        H('sheet "Sở DTTG"', 'Sở, ngành → Sở Dân tộc và Tôn giáo → 1 eform (một thẻ, các nhóm theo «Dự án thành phần») → Dòng số liệu → Bản ghi; có màn «Theo 126 xã, phường».',
          '19 chỉ tiêu cũ (dttg-config.js) thay bằng eform; khai báo cũ tắt bằng cờ, không xóa.'), 'dttg', DTTG, DTTG_CAU, **A)
    gen(os.path.join(OUTD, 'SO_Y_TE_2026_10_28.md'), '# BẢN ĐỌC EFORM — SỞ Y TẾ (4 eform)',
        H('sheet "Sở Y tế"', 'Sở, ngành → Sở Y tế → 4 eform (mỗi eform một thẻ); cả 4 có «Địa bàn» nên có màn «Theo 126 xã, phường».',
          '14 chỉ tiêu cũ (syt-config.js) thay bằng eform; khai báo cũ tắt bằng cờ, không xóa.'), 'syt', SYT, SYT_CAU, **A)
    gen(os.path.join(OUTD, 'SO_VHTT_2026_10_28.md'), '# BẢN ĐỌC EFORM — SỞ VĂN HÓA, THỂ THAO (VÀ DU LỊCH) — 5 eform sheet "Sở VHTT"',
        H('sheet "Sở VHTT"', 'Sở, ngành → Sở VH, TT và Du lịch → 7 eform (5 eform sheet "Sở VHTT" + 2 eform sheet "Sở Du lịch" — câu hỏi 1), mỗi eform một thẻ; có màn «Theo 126 xã, phường».',
          '29 chỉ tiêu cũ (vhtt-config.js), gồm nhóm "Dự án 2026–2030" dựng từ eform đã bỏ, thay bằng eform; khai báo cũ tắt bằng cờ, không xóa.'), 'vhtt', VHTT, VHTT_CAU, **A)
    gen(os.path.join(OUTD, 'SO_DU_LICH_2026_10_28.md'), '# BẢN ĐỌC EFORM — SỞ DU LỊCH (2 eform)',
        H('sheet "Sở Du lịch"', 'Gộp vào Sở VH, TT và Du lịch (bản đọc SO_VHTT, câu hỏi 1): eform 6, 7 của đơn vị này; có màn «Theo 126 xã, phường».',
          '10 chỉ tiêu cũ (dl-config.js) thay bằng eform; khai báo cũ tắt bằng cờ, không xóa.'), 'dl', DL, DL_CAU, **A)
    gen(os.path.join(OUTD, 'SO_BQL_KCNC_2026_10_28.md'), '# BẢN ĐỌC EFORM — BAN QUẢN LÝ KHU CÔNG NGHỆ CAO VÀ KHU CÔNG NGHIỆP (1 eform)',
        H('sheet "Ban Quản lý Khu công nghệ cao và khu công nghiệp thành phố"', 'Sở, ngành → Ban QL Khu CNC và KCN → 1 eform (một thẻ, nhóm theo «Loại khu»); có màn «Theo 126 xã, phường».',
          '12 chỉ tiêu cũ (bql-config.js) thay bằng eform; khai báo cũ tắt bằng cờ, không xóa.'), 'bql', BQL, BQL_CAU, **A)
