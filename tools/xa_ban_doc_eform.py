# -*- coding: utf-8 -*-
"""Sinh bản đọc 12 eform cấp xã, phường theo Phần IV quy ước 28/10/2026 → docs/BAN_DOC_EFORM/XA_*.md
Chạy từ thư mục gốc ioc:  python3 tools/xa_ban_doc_eform.py [khung.js]
  khung.js: khung eform xã sinh bằng tools/xa_eform_schema.py (mặc định js/core/xa-eform.js). Trước khi sinh lại khung trong
  dự án (bước B1), truyền khung sinh từ file eform mới vào thư mục tạm để bản đọc theo đúng file mới.
Bảng trường sinh thẳng từ khung (đủ mọi trường, đúng thứ tự); vai trò khai theo MÃ ĐẦY ĐỦ, mã không có trong eform thì dừng.
Phần đọc (một bản ghi là gì, khóa, loại số, chỉ tiêu, biểu đồ, câu hỏi) viết ở XA_DOC bên dưới — sửa ở đây rồi chạy lại."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'js', 'core', 'xa-eform.js')
s = open(SRC, encoding='utf-8').read()
i = s.index('const XA_EFORM = ') + len('const XA_EFORM = ')
X, _ = json.JSONDecoder().raw_decode(s[i:])
XE = {e['id']: e for e in X}
OUT = os.path.join(ROOT, 'docs', 'BAN_DOC_EFORM')
NGAY, FILE_NGAY = '30/10/2026', '30/10/2026'
KIEU = {'dm': 'Danh mục', 'so': 'Số', 'chu': 'Chữ', 'ngay': 'Ngày tháng'}
KY = {'ky_bao_cao': 'Kỳ: xếp bản ghi vào kỳ (IOC hiện tên theo mã)', 'nam': 'Kỳ', 'thang': 'Kỳ', 'quy': 'Kỳ'}
DB = 'Xã, phường của bản ghi: tài khoản xã chỉ thấy bản ghi của mình; thuộc khóa (G2)'
TRUC = {'DANG': 'Đảng ủy', 'HDND': 'HĐND', 'UBND': 'UBND', 'MTTQ': 'Ủy ban MTTQ'}


def md(x):
    return str(x).replace('|', '/').replace('\n', ' ')


def dmt(f):
    ls = [o.get('l') or o['v'] for o in f.get('dm') or []]
    if f['t'] == 'dm' and not ls:
        return '— (file không liệt kê mã)'
    if not ls:
        return '—'
    return f'{len(ls)} mã: ' + ', '.join(ls[:6]) + (f', … (+{len(ls) - 6})' if len(ls) > 6 else '')


# ============================== PHẦN ĐỌC TỪNG EFORM ==============================
# vai: { mã trường: vai trò ở phần tổng hợp } — trường không khai: "Chỉ xem ở Dữ liệu đã nhập"
XA_DOC = [
  dict(id='dang', file='XA_01_DANG_UY',
    iok='Xã, phường → Trục Đảng ủy → eform «Đảng Ủy» (thẻ "Đảng ủy")',
    ban_ghi='một chỉ tiêu (tên do xã gõ) thuộc một «Nhóm mục», một «Đối tượng thống kê», một «Phân loại/Kết quả» của Đảng ủy xã, phường trong một kỳ',
    khoa='«Địa bàn» + «Nhóm mục» + «Đối tượng thống kê» + «Tên chỉ tiêu» + «Phân loại/Kết quả» (được trống) + «Đơn vị tính» + kỳ',
    loai_so='«Giá trị» là số tại thời điểm (xem quý, năm lấy bản cuối kỳ) ở các nhóm mục «Tổng số CBCCVC khối Đảng», «Biến động Đảng viên theo thời gian», «Cơ cấu tổ chức Đảng trực thuộc»; là số phát sinh (cộng các tháng) ở 6 nhóm mục còn lại (câu DANG-1)',
    vai={'dia_ban': DB, 'nhom_muc': 'Chia cấp 1 (nhóm: 9 nhóm mục)', 'doi_tuong_thong_ke': 'Chia cấp 2; khóa', 'ten_chi_tieu': 'Chia cấp 3 (chữ do xã gõ); khóa',
         'phan_loai_ket_qua': 'Mô tả dòng (chữ do xã gõ); khóa, được trống', 'gia_tri': 'Số cộng dồn hoặc lấy kỳ cuối theo nhóm mục (câu DANG-1)',
         'don_vi_tinh': 'Chia cấp 4: không cộng khác đơn vị tính (chữ do xã gõ, so khớp theo G8)'},
    chi=['Mỗi dòng số liệu (Nhóm mục › Đối tượng thống kê › Tên chỉ tiêu › Đơn vị tính): «Giá trị» — cộng các bản ghi (nhóm mục phát sinh) hoặc lấy bản cuối kỳ (nhóm mục tại thời điểm)',
         'Số dòng số liệu đã nhập, theo từng nhóm mục (đếm, không cộng «Giá trị»)'],
    bieu=['Cột: số dòng số liệu theo «Nhóm mục» — bấm cột ra bản ghi',
          'Màn từng nhóm mục: thanh «Giá trị» từng dòng số liệu, mỗi «Đơn vị tính» một thẻ (không đặt cạnh nhau số khác đơn vị) — bấm thanh ra bản ghi',
          'Màn từng nhóm mục: thẻ so sánh kỳ này – kỳ trước và «Giá trị» qua các kỳ của từng dòng số liệu',
          'Bảng nhiều cấp «Nhóm mục» › «Đối tượng thống kê» › «Tên chỉ tiêu» › «Đơn vị tính» (thu gọn 12 dòng, "Xem đủ")'],
    kt=['«Giá trị» có mà «Đơn vị tính» trống, hoặc «Tên chỉ tiêu» trống'],
    loi=['Đã đổi mã ngày 30/10: «Thống kê tình hình đoàn kiểm tra giám sát» (thongkedoankttra), «Đoàn kiểm tra/giám sát» (doankttra) — khung IOC sinh lại ở bước B1',
         '«Phân loại/Kết quả», «Đơn vị tính» kiểu Chữ không danh mục (ở HĐND hai trường này là Danh mục) → mỗi xã gõ một kiểu, khó cộng',
         'Dữ liệu mẫu «Tên chỉ tiêu» "Test 1"'],
    cau=['DANG-1. Đề xuất: «Giá trị» là số tại thời điểm (lấy bản cuối kỳ, không cộng các tháng) ở 3 nhóm mục «Tổng số CBCCVC khối Đảng», «Biến động Đảng viên theo thời gian», «Cơ cấu tổ chức Đảng trực thuộc»; là số phát sinh (cộng các tháng) ở 6 nhóm mục còn lại. Đúng không?']),

  dict(id='hdnd', file='XA_02_HDND',
    iok='Xã, phường → Trục HĐND → eform «Hội đồng nhân dân» (thẻ "HĐND")',
    ban_ghi='một chỉ tiêu (tên do xã gõ) của một «Chủ đề / Nhóm» (nghị quyết, hoạt động giám sát, họp Thường trực, kỳ họp, tiếp xúc cử tri), một «Đối tượng thống kê», một «Phân loại/Kết quả» trong một kỳ; có thể kèm dự án đầu tư công, thu NSNN, chi NSĐP',
    khoa='«Địa bàn» + «Chủ đề / Nhóm» + «Đối tượng thống kê» + «Tên chỉ tiêu» + «Phân loại/Kết quả» + «Dự án đầu tư công» (được trống) + «Đơn vị tính» + kỳ',
    loai_so='«Giá trị» số phát sinh (cộng) ở hoạt động giám sát, họp Thường trực, kỳ họp, tiếp xúc cử tri; ở 4 nghị quyết là số chỉ tiêu của nghị quyết (tỷ lệ, tốc độ tăng, giá trị…) — lấy bản cuối kỳ, không cộng (câu HDND-2). Tỷ lệ, tốc độ (đơn vị % , %/năm): không cộng (X6). «Thu NSNN», «Chi NSDP»: câu HDND-3',
    vai={'dia_ban': DB, 'chu_de_nhom': 'Chia cấp 1 (nhóm: 8 chủ đề)', 'doi_tuong_thong_ke': 'Chia cấp 2; khóa', 'ten_chi_tieu': 'Chia cấp 3 (chữ do xã gõ); khóa',
         'phan_loai_ket_qua': 'Mô tả dòng; khóa; biểu đồ theo tình trạng thực hiện', 'gia_tri': 'Số cộng dồn hoặc lấy kỳ cuối (câu HDND-2); tỷ lệ không cộng',
         'don_vi_tinh': 'Chia cấp 4: không cộng khác đơn vị tính', 'du_an_dau_tu_cong': 'Mô tả dòng (chữ do xã gõ); khóa, được trống',
         'thu_nsnn': 'Số cộng dồn (chờ câu HDND-3)', 'chi_nsdp': 'Số cộng dồn (chờ câu HDND-3)'},
    chi=['Mỗi dòng số liệu (Chủ đề › Đối tượng › Tên chỉ tiêu › Đơn vị tính): «Giá trị» — cộng (hoạt động) hoặc bản cuối kỳ (nghị quyết); dòng % chỉ hiện số từng bản ghi',
         'Số cuộc giám sát, buổi họp Thường trực, kỳ họp, cuộc tiếp xúc cử tri: cộng «Giá trị» của chủ đề tương ứng, theo «Đơn vị tính»',
         'Cộng «Thu NSNN», «Chi NSDP» (sau câu HDND-3)'],
    bieu=['Cột: số dòng số liệu theo «Chủ đề / Nhóm»',
          'Cột: «Giá trị» theo «Phân loại/Kết quả» Đã thực hiện / Đang thực hiện / Chưa thực hiện — thanh riêng từng tình trạng, không cộng thành tổng (X7)',
          'Diễn biến qua các kỳ: số cuộc giám sát, kỳ họp, cuộc tiếp xúc cử tri',
          'Màn từng chủ đề: thẻ so sánh kỳ này – kỳ trước; thanh «Giá trị» từng dòng, mỗi đơn vị tính một thẻ',
          'Bảng nhiều cấp «Chủ đề / Nhóm» › «Đối tượng thống kê» › «Tên chỉ tiêu» › «Đơn vị tính», cột «Giá trị», «Thu NSNN», «Chi NSDP»'],
    kt=['Dòng có «Đơn vị tính» % hoặc %/năm mà «Giá trị» lớn hơn 1000 (nghi nhập nhầm đơn vị)'],
    loi=['Tên trường «Chi NSDP» (đúng: NSĐP); «Chủ đề / Nhóm» đổi tên ngày 30/10 (thêm khoảng trắng)',
         '«Chủ đề / Nhóm» và «Đối tượng thống kê» có 4 mục trùng tên (4 nghị quyết) — câu HDND-1',
         '«Đơn vị tính» có mục gần trùng: "Cuộc" và "Cuộc tiếp xúc", "Buổi tiếp công dân" và "Buổi/tháng"',
         'Dữ liệu mẫu «Tên chỉ tiêu» "Test 2"'],
    cau=['HDND-1. «Chủ đề / Nhóm» và «Đối tượng thống kê» cùng có 4 nghị quyết. Đề xuất: «Chủ đề / Nhóm» chia nhóm (cấp 1), «Đối tượng thống kê» là cấp 2. Đúng không?',
         'HDND-2. Ở 4 nghị quyết, «Giá trị» là số chỉ tiêu của nghị quyết (mục tiêu hay kết quả thực hiện?). Đề xuất: lấy bản cuối kỳ, không cộng các tháng, không so tăng giảm như số phát sinh. Đúng không?',
         'HDND-3. «Thu NSNN», «Chi NSDP» dùng khi nào (chỉ ở nghị quyết đầu tư công?), đơn vị là gì (đồng, triệu đồng hay theo «Đơn vị tính»)? Có cộng các bản ghi không?']),

  dict(id='hcc', file='XA_03_HANH_CHINH_CONG',
    iok='Xã, phường → Trục UBND → eform «Hành chính công» (thẻ "Hành chính công")',
    ban_ghi='số hồ sơ của một «Chỉ tiêu» (10 mã) thuộc một «Nhóm chỉ tiêu» (4 mã), của một «Đơn vị», trong một kỳ (kèm «Từ ngày» – «Đến ngày»)',
    khoa='«Địa bàn» + «Đơn vị» (được trống) + «Nhóm chỉ tiêu» + «Chỉ tiêu» + kỳ',
    loai_so='Phát sinh (cộng các tháng): tiếp nhận trực tiếp, trực tuyến, BCCI; đúng và trước hạn; đã giải quyết quá hạn; hồ sơ không được tiếp nhận. Đầu kỳ (xem quý, năm lấy bản đầu kỳ): số kỳ trước chuyển qua. Tại thời điểm (lấy bản cuối kỳ): chưa đến hạn; đang giải quyết quá hạn; hồ sơ TTHC chờ tiếp nhận (câu HCC-2)',
    vai={'dia_ban': DB, 'nhom_chi_tieu': 'Chia cấp 1 (nhóm: 4 nhóm chỉ tiêu)', 'chi_tieu': 'Chia cấp 2: mỗi mã một chỉ tiêu', 'gia_tri': 'Số: cộng / đầu kỳ / cuối kỳ theo chỉ tiêu',
         'don_vi': 'Chia cấp 3 (chữ do xã gõ); khóa, được trống', 'don_vi_tinh': 'Đơn vị ghi cạnh số (1 mã: Hồ sơ)',
         'tu_ngay': 'Chỉ xem; đánh dấu khi ngoài kỳ báo cáo', 'den_ngay': 'Chỉ xem; đánh dấu khi ngoài kỳ báo cáo'},
    chi=['10 chỉ tiêu, mỗi mã «Chỉ tiêu» một chỉ tiêu = «Giá trị» (cộng / đầu kỳ / cuối kỳ như mục Loại số): Số kỳ trước chuyển qua, Tiếp nhận trực tiếp, Tiếp nhận trực tuyến, Tiếp nhận BCCI, Đúng và trước hạn, Đã giải quyết quá hạn, Chưa đến hạn, Đang giải quyết quá hạn, Hồ sơ TTHC chờ tiếp nhận, Hồ sơ không được tiếp nhận',
         'Không tự cộng thành "tổng hồ sơ tiếp nhận", "tổng đã giải quyết", không tính tỷ lệ đúng hạn: eform không có trường tổng, X5/X7 không cho cộng các chỉ tiêu khác nhau thành tổng (câu HCC-3)'],
    bieu=['Cột: 4 chỉ tiêu nhóm «Số hồ sơ nhận giải quyết» (kỳ trước chuyển qua, trực tiếp, trực tuyến, BCCI) — thanh riêng, không cộng tổng; bấm thanh ra bản ghi',
          'Cột: «Kết quả giải quyết» — đúng và trước hạn, đã giải quyết quá hạn',
          'Cột: «Hồ sơ đang giải quyết» — chưa đến hạn, đang giải quyết quá hạn',
          'Diễn biến qua các kỳ: tiếp nhận trực tuyến; đúng và trước hạn; đã giải quyết quá hạn',
          'Bảng nhiều cấp «Nhóm chỉ tiêu» › «Chỉ tiêu» › «Đơn vị»'],
    kt=['«Chỉ tiêu» không thuộc «Nhóm chỉ tiêu» theo bảng ghép ở câu HCC-1', '«Từ ngày» sau «Đến ngày», hoặc «Đến ngày» ngoài kỳ báo cáo'],
    loi=['«Lĩnh vực», «Cấp đơn vị», «Đơn vị tính» là danh mục chỉ 1 mã', '«Đơn vị» kiểu Chữ, mẫu "Đơn vị test" — chưa rõ là gì (câu HCC-4)'],
    cau=['HCC-1. Ghép «Chỉ tiêu» vào «Nhóm chỉ tiêu» theo tên: Số hồ sơ nhận giải quyết = kỳ trước chuyển qua, trực tiếp, trực tuyến, BCCI; Kết quả giải quyết = đúng và trước hạn, đã giải quyết quá hạn; Hồ sơ đang giải quyết = chưa đến hạn, đang giải quyết quá hạn; Tiếp nhận hồ sơ = chờ tiếp nhận, không được tiếp nhận. Đúng không? (dùng để đánh dấu bản ghi ghép sai)',
         'HCC-2. Loại số như mục "Loại số" (kỳ trước chuyển qua lấy đầu kỳ; đang giải quyết, chờ tiếp nhận lấy cuối kỳ; còn lại cộng các tháng). Đúng không?',
         'HCC-3. Quy ước không cho IOC tự cộng các chỉ tiêu khác nhau thành tổng khi eform không có trường tổng, nên em KHÔNG đề xuất "tổng tiếp nhận", "tỷ lệ đúng hạn". Anh có muốn ngoại lệ (ghi rõ "IOC tính", công thức theo tên chỉ tiêu) không?',
         'HCC-4. «Đơn vị» (Chữ) là gì — bộ phận một cửa, phòng ban? Một xã có nhiều đơn vị không? «Từ ngày», «Đến ngày» chỉ để xem hay dùng xếp kỳ?']),

  dict(id='tcns', file='XA_04_TAI_CHINH_NGAN_SACH',
    iok='Xã, phường → Trục UBND → eform «Tài chính - Ngân sách» (thẻ "Tài chính - Ngân sách")',
    ban_ghi='một «Tiểu chỉ tiêu» (59 mã) dưới một «Tên chỉ tiêu» (xã gõ), là số tiền hoặc số lượng, trong một kỳ: giá trị kỳ báo cáo, lũy kế, dự toán/KH năm',
    khoa='«Địa bàn» + «Tên chỉ tiêu» + «Tiểu chỉ tiêu» + «Loại giá trị (SL/ST)» + «Đơn vị tính» + kỳ',
    loai_so='«Giá trị kỳ báo cáo»: phát sinh (cộng các tháng). «Giá trị lũy kế»: lũy kế từ đầu năm (lấy bản cuối kỳ, không cộng; so cùng kỳ năm trước). «Dự toán/KH năm»: kế hoạch năm (lấy bản cuối, không so tăng giảm, không vẽ thành thanh cạnh số thực hiện). «Tỷ lệ so với dự toán/KH»: Chữ — hiện đúng chữ đã nhập',
    vai={'dia_ban': DB, 'loai_gia_tri_sl_st': 'Chia cấp 1 (nhóm: Số tiền / Số lượng)', 'ten_chi_tieu': 'Chia cấp 2 (chữ do xã gõ); khóa', 'tieu_chi_tieu': 'Chia cấp 3: mỗi mã một chỉ tiêu',
         'don_vi_tinh': 'Chia cấp 4: không cộng khác đơn vị tính', 'gia_tri_ky_bao_cao': 'Số phát sinh: cộng', 'gia_tri_luy_ke': 'Số lũy kế: lấy bản cuối kỳ; tử số tỷ lệ IOC tính',
         'du_toan_kh_nam': 'Số kế hoạch: lấy bản cuối; mẫu số tỷ lệ IOC tính', 'ty_le_so_voi_du_toan_kh': 'Chữ: hiện đúng chữ đã nhập, ghi kèm dòng',
         'ngay_bao_cao': 'Chỉ xem; đánh dấu khi ngoài kỳ báo cáo'},
    chi=['Mỗi «Tiểu chỉ tiêu» × «Đơn vị tính»: «Giá trị kỳ báo cáo» (cộng), «Giá trị lũy kế» (cuối kỳ), «Dự toán/KH năm» (bản cuối)',
         'Tỷ lệ lũy kế so với dự toán (IOC tính) = «Giá trị lũy kế» ÷ «Dự toán/KH năm» × 100, đặt cạnh «Tỷ lệ so với dự toán/KH» đã nhập (câu TCNS-2)',
         'Tiểu chỉ tiêu dạng mô tả (Mục tiêu đầu tư; quy mô, Địa điểm, Thời gian thực hiện; hình thức, Vướng mắc, kiến nghị…): không vào số, chỉ xem ở Dữ liệu đã nhập (câu TCNS-3)'],
    bieu=['Cột: «Giá trị lũy kế» các khoản thu (Thuế GTGT, Thuế TNDN, Thuế TNCN, Phí, Lệ phí, Khoản thu khác) — thanh riêng, cùng đơn vị tính',
          'Cột: «Giá trị lũy kế» các khoản chi (Chi đầu tư phát triển, Chi thường xuyên, Chi trả nợ lãi, Chi khác)',
          'Thẻ tỷ lệ (IOC tính): lũy kế so với dự toán của Tổng thu NSNN, Tổng chi NSNN',
          'Diễn biến qua các kỳ: «Giá trị kỳ báo cáo» của Tổng thu NSNN, Tổng chi NSNN',
          'Cột: số doanh nghiệp, HTX đang hoạt động, HTX thành lập mới, giải thể (Số lượng)',
          'Bảng nhiều cấp «Loại giá trị» › «Tên chỉ tiêu» › «Tiểu chỉ tiêu» › «Đơn vị tính», cột kỳ báo cáo, lũy kế, dự toán, tỷ lệ đã nhập, tỷ lệ IOC tính'],
    kt=['«Giá trị lũy kế» nhỏ hơn «Giá trị kỳ báo cáo»', 'X5 (sau câu TCNS-1): «Tổng thu NSNN» lệch tổng các khoản thành phần; «Tổng chi NSNN» lệch tổng các khoản chi', '«Ngày báo cáo» ngoài kỳ báo cáo'],
    loi=['«Tỷ lệ so với dự toán/KH» kiểu Chữ (mẫu "đạt") — không đối chiếu số được với tỷ lệ IOC tính', '«Tần suất theo bộ chỉ tiêu» kiểu Chữ', '«Tháng» đặt giữa eform, «Quý», «Năm» ở cuối',
         'Ngày 30/10 gộp «Vướng mắc», «Kiến nghị» thành «Vướng mắc, kiến nghị» (mã vuong_mac_kien_nghi)', 'Có «Thu dầu thô», «Thu cân đối từ hoạt động xuất nhập khẩu» ở cấp xã (nghi thừa)', '«Đơn vị tính» mã "%" có ký tự đặc biệt'],
    cau=['TCNS-1. Có kiểm tra tổng không? Đề xuất: Tổng thu NSNN = Thu nội địa + Thu dầu thô + Thu cân đối XNK + Thu viện trợ; Tổng chi NSNN = Chi ĐTPT + Chi thường xuyên + Chi trả nợ lãi + Chi khác — IOC tính tổng thành phần, hiện kèm, lệch thì đánh dấu (X5). Đúng thành phần không?',
         'TCNS-2. Tỷ lệ IOC tính = «Giá trị lũy kế» ÷ «Dự toán/KH năm» × 100, đặt cạnh tỷ lệ đã nhập (Chữ). Đồng ý không?',
         'TCNS-3. Các tiểu chỉ tiêu dạng mô tả (Mục tiêu đầu tư, Địa điểm, Thời gian thực hiện, Tổng vốn đầu tư và nguồn vốn, Công tác GPMB, Tiến độ thi công, Tiến độ giải ngân, Nguồn cung VLXD, Vướng mắc kiến nghị, Theo phân ngành VSIC, Chi tiết khoản thu, Mục đích hỗ trợ…) nhập nội dung vào «Mô tả/Diễn giải»? Đề xuất: không vào số, chỉ xem.',
         'TCNS-4. Chia nhóm theo «Loại giá trị (SL/ST)» (Số tiền / Số lượng) như hiện nay, hay anh muốn nhóm khác (vẫn phải là trường danh mục của eform)?']),

  dict(id='qlvb', file='XA_05_QUAN_LY_VAN_BAN',
    iok='Xã, phường → Trục UBND → eform «Quản lý văn bản» (thẻ "Quản lý văn bản")',
    ban_ghi='số văn bản của một «Nhóm chỉ tiêu» (12 mã), một «Loại văn bản» (đến/đi), một «Phân loại» (trong hạn/quá hạn), của một cán bộ hoặc phòng, trong một kỳ',
    khoa='«Địa bàn» + «Tên Cán bộ/Phòng» (được trống) + «Loại văn bản» + «Nhóm chỉ tiêu» + «Phân loại» (được trống) + kỳ',
    loai_so='Phát sinh (cộng): tổng số văn bản đến, đi; văn bản liên thông, nội bộ; đã hoàn tất; đến đã chuyển thực hiện. Tại thời điểm (bản cuối kỳ): chưa xử lý, đang xử lý, đến chưa lưu, đến chờ duyệt. «Tổng số công văn», «Hạn xử lý»: câu QLVB-2',
    vai={'dia_ban': DB, 'loai_van_ban': 'Chia cấp 1 (nhóm: Văn bản đến / Văn bản đi)', 'nhom_chi_tieu': 'Chia cấp 2: mỗi mã một chỉ tiêu', 'phan_loai': 'Chia cấp 3 (trong hạn / quá hạn); khóa, được trống',
         'gia_tri': 'Số: cộng hoặc lấy cuối kỳ theo chỉ tiêu', 'ten_can_bo_phong': 'Bảng phụ theo cán bộ/phòng (chữ do xã gõ); khóa, được trống (câu QLVB-3)',
         'ngay_bao_cao': 'Chỉ xem; đánh dấu khi ngoài kỳ báo cáo (câu QLVB-4)'},
    chi=['Mỗi mã «Nhóm chỉ tiêu» × «Loại văn bản» × «Phân loại»: «Giá trị» (cộng hoặc cuối kỳ)', 'Văn bản quá hạn: cộng «Giá trị» các bản ghi «Phân loại» = Quá hạn, theo nhóm chỉ tiêu',
         'Kiểm tra tổng (X5, sau câu QLVB-1): Tổng số văn bản đến, Tổng số văn bản đi so với tổng thành phần'],
    bieu=['Cột: văn bản đến theo «Nhóm chỉ tiêu» (tổng số đến, chưa lưu, chờ duyệt, đã chuyển thực hiện) — thanh riêng',
          'Cột: văn bản đi — tổng số đi, liên thông, nội bộ', 'Cột: tình trạng xử lý — chưa xử lý, đang xử lý, đã hoàn tất; mỗi tình trạng tách trong hạn / quá hạn',
          'Thanh theo «Tên Cán bộ/Phòng»: văn bản quá hạn (bấm ra bản ghi)', 'Diễn biến qua các kỳ: tổng số văn bản đến, đi; văn bản quá hạn',
          'Bảng nhiều cấp «Loại văn bản» › «Nhóm chỉ tiêu» › «Phân loại»; bảng phụ «Tên Cán bộ/Phòng» › «Nhóm chỉ tiêu»'],
    kt=['«Nhóm chỉ tiêu» không hợp «Loại văn bản» (VD Văn bản đến mà nhóm "Tổng số văn bản đi")', '«Ngày báo cáo» ngoài kỳ báo cáo', 'X5 lệch tổng (sau câu QLVB-1)'],
    loi=['Ngày 30/10 thêm «Ngày báo cáo» (ngay_bao_cao, Ngày tháng) và «Tên Cán bộ/Phòng» (Chữ); bỏ «Ngày báo cáo» cũ (ngay_van_hanh); đổi mã «Văn bản đến đã chuyển thực hiện»',
         'Mã danh mục "hạn_xử_lý" có dấu', '«Tên Cán bộ/Phòng» gộp hai ý (tên người hoặc tên phòng)', '«Nguồn dữ liệu» kiểu Chữ, mẫu "nguồn test"'],
    cau=['QLVB-1. Tổng số văn bản đến = chưa lưu + chờ duyệt + đã chuyển thực hiện? hay = chưa xử lý + đang xử lý + đã hoàn tất? Tổng số văn bản đi = liên thông + nội bộ? (để IOC kiểm tổng, X5)',
         'QLVB-2. «Tổng số công văn» và «Hạn xử lý» là số gì? «Chưa xử lý / Đang xử lý / Đã hoàn tất» dùng cho văn bản đến, đi hay cả hai?',
         'QLVB-3. «Tên Cán bộ/Phòng»: nếu có thì mỗi bản ghi là số của một cán bộ/phòng, và tổng của xã = cộng các cán bộ/phòng? Có bản ghi tổng của xã (để trống trường này) đi kèm không — nếu có thì không cộng chồng.',
         'QLVB-4. «Ngày báo cáo» chỉ để xem hay dùng xếp kỳ khi thiếu «Tháng»/«Quý»?']),

  dict(id='gpmb', file='XA_06_GPMB',
    iok='Xã, phường → Trục UBND → eform «GPMB» (thẻ "GPMB")',
    ban_ghi='tình hình GPMB của một dự án («Loại dòng» = Dự án) hoặc một khu vực con của dự án («Loại dòng» = Khu vực con của dự án) trong một kỳ',
    khoa='«Địa bàn» + «Mã dự án» + «Loại dòng» + «Tên dự án/ khu vực GPMB» + kỳ',
    loai_so='Mọi trường số là số tại thời điểm / lũy kế đến kỳ (diện tích, số hộ các bước, kinh phí đã chi trả): xem quý, năm lấy bản cuối kỳ, không cộng các tháng (câu GPMB-2). «Tiến độ thực tế(%)», «Tỷ lệ thu hồi(%)», «Tỷ lệ bàn giao(%)»: tỷ lệ đã nhập — hiện đúng số',
    vai={'dia_ban': DB, 'nhom_trang_thai': 'Chia cấp 1 (nhóm: đang / chưa triển khai)', 'loai_dong': 'Dự án / khu vực con: tổng chỉ lấy dòng Dự án (câu GPMB-1)', 'ma_du_an': 'Chia cấp 2; khóa',
         'ten_du_an_khu_vuc_GPMB': 'Chia cấp 3 (khu vực con); khóa', 'nhom_du_an': 'Biểu đồ theo nhóm dự án', 'chu_dau_tu_don_vi_phu_trach': 'Biểu đồ theo chủ đầu tư',
         'trang_thai_tien_do': 'Biểu đồ theo trạng thái tiến độ', 'khu_vuc_dia_ban': 'Ghi kèm dòng (chữ do xã gõ)', 'tien_do_thuc_te': 'Tỷ lệ đã nhập: hiện từng dòng, không cộng',
         'tong_dien_tich_phai_thu_hoi': 'Số cuối kỳ: cộng các dự án; mẫu số tỷ lệ thu hồi IOC tính', 'dien_tich_da_thu_hoi': 'Số cuối kỳ: cộng các dự án; tử số tỷ lệ thu hồi IOC tính',
         'ty_le_thu_hoi': 'Tỷ lệ đã nhập: hiện đúng số; đối chiếu IOC tính', 'tong_so_doi_tuong_gpmb': 'Số cuối kỳ: cộng; bước đầu của chuỗi các bước',
         'da_thong_bao_thu_hoi_dat': 'Số cuối kỳ: cộng; bước', 'da_kiem_dem': 'Số cuối kỳ: cộng; bước', 'da_phe_duyet_phuong_an_boi_thuong': 'Số cuối kỳ: cộng; bước',
         'da_chi_tra_nhan_tien': 'Số cuối kỳ: cộng; bước', 'da_ban_giao_mat_bang': 'Số cuối kỳ: cộng; bước; tử số tỷ lệ bàn giao IOC tính (câu GPMB-3)',
         'ty_le_ban_giao': 'Tỷ lệ đã nhập: hiện đúng số; đối chiếu IOC tính (câu GPMB-3)', 'kinh_phi_boi_thuong_ho_tro_du_kien': 'Số: cộng các dự án', 'kinh_phi_da_chi_tra': 'Số cuối kỳ: cộng các dự án',
         'nhom_vuong_mac_chinh': 'Ghi kèm dòng', 'han_xu_ly_kien_nghi': 'Ghi kèm dòng'},
    chi=['Số dự án (đếm dòng Dự án) theo «Nhóm trạng thái», «Trạng thái tiến độ», «Nhóm dự án», «Chủ đầu tư/ Đơn vị phụ trách»',
         'Cộng (dòng Dự án): tổng diện tích phải thu hồi, đã thu hồi; tổng số đối tượng/hộ và từng bước (thông báo, kiểm đếm, phê duyệt, chi trả, bàn giao); kinh phí dự kiến, đã chi trả',
         'Tỷ lệ thu hồi gộp (IOC tính) = Σ«Diện tích đã thu hồi» ÷ Σ«Tổng diện tích phải thu hồi» × 100; một dự án thì hiện đúng «Tỷ lệ thu hồi(%)» đã nhập',
         'Tỷ lệ bàn giao gộp (IOC tính) = Σ«Đã bàn giao mặt bằng» ÷ Σ«Tổng số đối tượng/ hộ GPMB» × 100 (chờ câu GPMB-3)'],
    bieu=['Danh sách thanh các bước: Tổng số đối tượng/hộ → Đã thông báo thu hồi → Đã kiểm đếm → Đã phê duyệt phương án → Đã chi trả → Đã bàn giao (mỗi bước một số, không cộng)',
          'Cột: số dự án theo «Trạng thái tiến độ»; theo «Nhóm dự án»; theo «Chủ đầu tư/ Đơn vị phụ trách»', 'Thanh: «Tỷ lệ thu hồi(%)» đã nhập của từng dự án (bấm ra bản ghi)',
          'Thẻ tỷ lệ (IOC tính): tỷ lệ thu hồi, tỷ lệ bàn giao gộp', 'Diễn biến qua các kỳ: diện tích đã thu hồi; số hộ đã bàn giao',
          'Bảng nhiều cấp «Nhóm trạng thái» › «Mã dự án» › khu vực con, cột diện tích, các bước, kinh phí, tỷ lệ đã nhập'],
    kt=['«Diện tích đã thu hồi» lớn hơn «Tổng diện tích phải thu hồi»', '«Tỷ lệ thu hồi(%)», «Tỷ lệ bàn giao(%)» lệch IOC tính quá 0,1 điểm',
        'Khu vực con không có dòng Dự án cùng «Mã dự án»', 'X5 (sau câu GPMB-1): dòng Dự án lệch tổng các khu vực con'],
    loi=['«Hạn xử lý kiến nghị» kiểu Chữ (nên là Ngày tháng)', '«Nhóm vướng mắc chính», «Khu vực/ Địa bàn» kiểu Chữ', 'Đơn vị ghi trong tên trường: (m^2), (đồng), (%)'],
    cau=['GPMB-1. Dòng «Dự án» có phải tổng các dòng «Khu vực con» của cùng «Mã dự án» không? Đề xuất: số tổng chỉ lấy dòng Dự án (không cộng chồng khu vực con), lệch tổng khu vực con thì đánh dấu.',
         'GPMB-2. Các số diện tích, số hộ các bước, kinh phí đã chi trả là lũy kế đến kỳ báo cáo (lấy bản cuối kỳ, không cộng các tháng)? Đúng không?',
         'GPMB-3. «Tỷ lệ bàn giao(%)» tính trên số hộ («Đã bàn giao mặt bằng» ÷ «Tổng số đối tượng/ hộ GPMB») hay trên diện tích?']),

  dict(id='gd', file='XA_07_GIAO_DUC',
    iok='Xã, phường → Trục UBND → eform «Giáo dục» (thẻ "Giáo dục")',
    ban_ghi='một số liệu (tên chỉ tiêu do xã gõ) theo một tổ hợp «Bậc học/Loại hình giáo dục», «Loại cơ sở», «Giới tính», «Dân tộc», «Trình độ chuyên môn», «Nhóm đối tượng», «Phân loại/Kết quả» trong một kỳ',
    khoa='«Địa bàn» + «Nhóm chỉ tiêu» + «Tên chỉ tiêu» + «Bậc học/Loại hình giáo dục» + «Loại cơ sở» + «Giới tính» + «Dân tộc» + «Trình độ chuyên môn» + «Nhóm đối tượng» + «Phân loại/Kết quả» + «Đơn vị tính» + kỳ',
    loai_so='«Phân loại/Kết quả» = Tổng số (số cơ sở, giáo viên, học sinh hiện có): tại thời điểm, lấy bản cuối kỳ. Tuyển mới, Tốt nghiệp, Có dạy nghề cho người khuyết tật: phát sinh, cộng (câu GD-2)',
    vai={'dia_ban': DB, 'nhom_chi_tieu': 'Chia cấp 1 (nhóm: 3 nhóm chỉ tiêu)', 'ten_chi_tieu': 'Mô tả dòng (chữ do xã gõ); khóa', 'bac_hoc_loai_hinh_giao_duc': 'Chia cấp 2; biểu đồ theo bậc học',
         'loai_co_so': 'Khóa; biểu đồ công lập / ngoài công lập; "Tổng số" là dòng tổng (G5)', 'gioi_tinh': 'Khóa; biểu đồ Nam / Nữ; "Tổng số" là dòng tổng, "Không áp dụng" là không chia (G5)',
         'dan_toc': 'Khóa; biểu đồ Kinh / DTTS; "Tổng số" là dòng tổng (G5)', 'trinh_do_chuyen_mon': 'Khóa; biểu đồ theo trình độ (giáo dục nghề nghiệp)',
         'nhom_doi_tuong': 'Chia cấp 3', 'phan_loai_ket_qua': 'Chia cấp 4: Tổng số (cuối kỳ) / tuyển mới, tốt nghiệp (cộng)', 'gia_tri': 'Số: cuối kỳ hoặc cộng theo «Phân loại/Kết quả»',
         'don_vi_tinh': 'Không cộng khác đơn vị tính', 'nguon_so_lieu': 'Chỉ xem (1 mã)'},
    chi=['Mỗi dòng số liệu: «Giá trị» (cuối kỳ với Tổng số, cộng với tuyển mới, tốt nghiệp)',
         'Số học sinh, giáo viên, cơ sở theo bậc học: «Giá trị» các bản ghi «Phân loại/Kết quả» = Tổng số và các chiều khác = Tổng số hoặc Không áp dụng (không cộng chồng dòng tổng với dòng thành phần, G5)',
         'Kiểm tra tổng (X5): Công lập + Ngoài công lập so với dòng "Tổng số"; Nam + Nữ; Kinh + DTTS — IOC tính, hiện kèm, lệch thì đánh dấu'],
    bieu=['Cột: số học sinh theo «Bậc học/Loại hình giáo dục»', 'Cột: theo «Loại cơ sở» (công lập / ngoài công lập)', 'Cột: theo «Giới tính» (Nam / Nữ); theo «Dân tộc» (Kinh / DTTS)',
          'Cột: giáo dục nghề nghiệp theo «Trình độ chuyên môn» (sơ cấp, trung cấp, cao đẳng)', 'Cột: tuyển mới, tốt nghiệp theo bậc học',
          'Diễn biến qua các kỳ: số học sinh (Tổng số)', 'Mỗi biểu đồ chỉ một «Đơn vị tính», các chiều không vẽ lấy giá trị "Tổng số"/"Không áp dụng" để không đếm trùng',
          'Bảng nhiều cấp «Nhóm chỉ tiêu» › «Bậc học» › «Nhóm đối tượng» › «Phân loại/Kết quả»'],
    kt=['X5: dòng "Tổng số" lệch tổng thành phần (công lập + ngoài công lập, nam + nữ, kinh + DTTS)', '«Đơn vị tính» không hợp «Nhóm đối tượng» (VD đối tượng Học sinh mà đơn vị Giáo viên)'],
    loi=['Mã danh mục "nữ" có dấu', '«Nguồn số liệu» chỉ 1 mã; dữ liệu mẫu "Tuyển mới" không có trong danh mục (ngày 30/10 đã sửa tên mã thành "Báo cáo ngành giáo dục")'],
    cau=['GD-1. Có bản ghi "Tổng số" (loại cơ sở, giới tính, dân tộc) nhập kèm các bản ghi thành phần không? Đề xuất: không cộng chồng; biểu đồ tổng lấy dòng "Tổng số", biểu đồ chia lấy dòng thành phần; lệch thì đánh dấu.',
         'GD-2. «Phân loại/Kết quả» = Tổng số là số hiện có (cuối kỳ); Tuyển mới, Tốt nghiệp là phát sinh (cộng, thường theo năm học). Đúng không?']),

  dict(id='yte', file='XA_08_Y_TE',
    iok='Xã, phường → Trục UBND → eform «Y tế» (thẻ "Y tế")',
    ban_ghi='một số liệu (tên chỉ tiêu, tiểu chỉ tiêu do xã gõ) thuộc một «Nhóm chỉ tiêu» (ngộ độc thực phẩm, dịch bệnh truyền nhiễm, bảo trợ xã hội) trong một kỳ',
    khoa='«Địa bàn» + «Nhóm chỉ tiêu» + «Tên chỉ tiêu» + «Tiểu chỉ tiêu» (được trống) + «Đơn vị tính» + kỳ',
    loai_so='Ngộ độc thực phẩm, dịch bệnh truyền nhiễm (vụ, người mắc): phát sinh, cộng. Bảo trợ xã hội (người, hộ gia đình hưởng): tại thời điểm, lấy bản cuối kỳ (câu YTE-1). «Tần suất» Tuần: câu YTE-2',
    vai={'dia_ban': DB, 'nhom_chi_tieu': 'Chia cấp 1 (nhóm: 3 nhóm)', 'ten_chi_tieu': 'Chia cấp 2 (chữ do xã gõ); khóa', 'tieu_chi_tieu': 'Chia cấp 3 (chữ do xã gõ); khóa, được trống',
         'gia_tri': 'Số: cộng hoặc cuối kỳ theo nhóm', 'don_vi_tinh': 'Chia cấp 4: không cộng khác đơn vị tính', 'tan_suat': 'Ghi kèm dòng (câu YTE-2)',
         'ngay_cap_nhat': 'Chỉ xem', 'nguoi_nhap': 'Chỉ xem', 'linh_vuc': 'Chỉ xem (1 mã)'},
    chi=['Mỗi dòng số liệu (Nhóm › Tên chỉ tiêu › Tiểu chỉ tiêu › Đơn vị tính): «Giá trị»', 'Số vụ ngộ độc thực phẩm; số người mắc dịch bệnh: cộng «Giá trị» theo nhóm và đơn vị tính'],
    bieu=['Cột: «Giá trị» theo «Nhóm chỉ tiêu», mỗi «Đơn vị tính» một biểu đồ (Vụ / Người / Người/Hộ gia đình)', 'Thanh: từng «Tên chỉ tiêu» trong một nhóm (bấm ra bản ghi)',
          'Diễn biến qua các kỳ: số vụ ngộ độc thực phẩm; số người mắc dịch bệnh truyền nhiễm', 'Bảng nhiều cấp «Nhóm chỉ tiêu» › «Tên chỉ tiêu» › «Tiểu chỉ tiêu» › «Đơn vị tính»'],
    kt=['«Đơn vị tính» Vụ ở nhóm Bảo trợ xã hội (nghi nhầm)', '«Ngày cập nhật» trước ngày đầu kỳ báo cáo'],
    loi=['«Địa bàn» đặt cuối eform', '«Lĩnh vực» danh mục 1 mã', '«Tần suất» có "Tuần" nhưng «Kỳ báo cáo» chỉ có Năm / Tháng / Quý'],
    cau=['YTE-1. Bảo trợ xã hội là số người/hộ đang hưởng (cuối kỳ, không cộng các tháng); ngộ độc, dịch bệnh là phát sinh (cộng). Đúng không?',
         'YTE-2. Bản ghi «Tần suất» = Tuần nhập «Kỳ báo cáo» thế nào (Tháng?), một tháng có nhiều bản tuần thì cộng các tuần không?']),

  dict(id='vh', file='XA_09_VAN_HOA',
    iok='Xã, phường → Trục UBND → eform «Văn hóa» (thẻ "Văn hóa")',
    ban_ghi='một số liệu văn hóa (tên chỉ tiêu do xã gõ) theo «Nhóm chỉ tiêu», «Đối tượng thống kê», «Loại hình», «Tính chất», «Quy mô» (truyền thông thêm «Nguồn/Kênh», «Nhóm nội dung», mức độ lan tỏa, quan tâm) trong một kỳ; ba số: số lượng, kinh phí/doanh thu, số người tham gia',
    khoa='«Địa bàn» + «Nhóm chỉ tiêu» + «Tên chỉ tiêu» + «Đối tượng thống kê» + «Loại hình» + «Tính chất» + «Quy mô» + «Nguồn/Kênh» + «Nhóm nội dung» + «Đơn vị tính» + kỳ (các trường mô tả được trống)',
    loai_so='«Số lượng»: tại thời điểm (bản cuối kỳ) với di tích, di sản, nghệ nhân, thiết chế, CLB, đơn vị nghệ thuật; phát sinh (cộng) với chương trình, liên hoan, hội thi, lễ hội, sự kiện, tin/bài, khách (câu VH-1). «Kinh phí/Doanh thu», «Số người tham gia»: phát sinh, cộng',
    vai={'dia_ban': DB, 'nhom_chi_tieu': 'Chia cấp 1 (nhóm: 9 nhóm)', 'ten_chi_tieu': 'Mô tả dòng (chữ do xã gõ); khóa', 'doi_tuong_thong_ke': 'Chia cấp 2',
         'loai_hinh': 'Chia cấp 3; biểu đồ theo loại hình', 'tinh_chat': 'Khóa; biểu đồ theo tính chất', 'quy_mo': 'Khóa; biểu đồ theo quy mô',
         'nguon_kenh': 'Mô tả dòng truyền thông (chữ do xã gõ)', 'nhom_noi_dung': 'Mô tả dòng truyền thông (chữ do xã gõ)', 'muc_do_lan_toa': 'Biểu đồ truyền thông', 'muc_do_quan_tam': 'Biểu đồ truyền thông',
         'so_luong': 'Số: cuối kỳ hoặc cộng theo đối tượng (câu VH-1)', 'don_vi_tinh': 'Chia cấp 4: không cộng khác đơn vị tính', 'kinh_phi_doanh_thu': 'Số: cộng (VND)', 'so_nguoi_tham_gia': 'Số: cộng (người)'},
    chi=['Mỗi dòng số liệu: «Số lượng» (theo đơn vị tính), «Kinh phí/Doanh thu (VND)», «Số người tham gia»', 'Cộng «Số người tham gia», «Kinh phí/Doanh thu» theo nhóm chỉ tiêu (cùng đơn vị nên cộng được)'],
    bieu=['Cột: «Số người tham gia» theo «Nhóm chỉ tiêu»', 'Cột: «Kinh phí/Doanh thu» theo «Nhóm chỉ tiêu»', 'Cột: «Số lượng» theo «Loại hình» (trong một nhóm, một đơn vị tính)',
          'Cột: theo «Quy mô»; theo «Tính chất»', 'Truyền thông: số tin/bài theo «Mức độ lan tỏa», «Mức độ quan tâm»', 'Diễn biến qua các kỳ: số người tham gia; kinh phí/doanh thu',
          'Bảng nhiều cấp «Nhóm chỉ tiêu» › «Đối tượng thống kê» › «Loại hình» › «Đơn vị tính», cột 3 số'],
    kt=['«Số lượng» có mà «Đơn vị tính» trống'],
    loi=['«Kỳ báo cáo» ghi tên lệch mã (mã thang tên "Năm", quy tên "Tháng", nam tên "Quý") — IOC hiện tên theo mã', 'Mã danh mục "thuong_xuyên" có dấu', 'Dữ liệu mẫu «Đơn vị tính» để trống',
         '«Kinh phí/Doanh thu» gộp hai ý (chi hay thu) — câu VH-2'],
    cau=['VH-1. «Số lượng» của di tích, di sản, nghệ nhân, thiết chế, CLB, đơn vị nghệ thuật là số hiện có (cuối kỳ); chương trình, liên hoan, hội thi, lễ hội, sự kiện, tin/bài, khách là phát sinh (cộng). Đúng không?',
         'VH-2. «Kinh phí/Doanh thu» là kinh phí chi hay doanh thu thu về? Có cộng chung hai loại không? Đề xuất: hiện tên đúng như eform, cộng theo dòng, không gọi là "chi" hay "thu".']),

  dict(id='nv', file='XA_10_NOI_VU',
    iok='Xã, phường → Trục UBND → eform «Nội vụ» (thẻ "Nội vụ")',
    ban_ghi='một số liệu nội vụ, lao động (tên chỉ tiêu do xã gõ) theo một «Đối tượng thống kê» và một «Phân loại/Kết quả» trong một kỳ',
    khoa='«Địa bàn» + «Đối tượng thống kê» + «Tên chỉ tiêu» + «Phân loại/Kết quả» + «Đơn vị tính» + kỳ',
    loai_so='«Phân loại/Kết quả»: Tổng số — tại thời điểm (bản cuối kỳ); Trong kỳ, Số phiên giao dịch, Số lượt người tham gia, Thực hiện, Số phải trả, Số đã trả — phát sinh (cộng); Kế hoạch giao — kế hoạch (bản cuối, không so tăng giảm) (câu NV-1)',
    vai={'dia_ban': DB, 'doi_tuong_thong_ke': 'Chia cấp 1 (nhóm: 9 đối tượng)', 'phan_loai_ket_qua': 'Chia cấp 2; quyết định cách lấy số (câu NV-1)', 'ten_chi_tieu': 'Chia cấp 3 (chữ do xã gõ); khóa',
         'gia_tri': 'Số: cộng / cuối kỳ / kế hoạch theo «Phân loại/Kết quả»', 'don_vi_tinh': 'Chia cấp 4: không cộng khác đơn vị tính', 'ngay_thang': 'Chỉ xem; đánh dấu khi ngoài kỳ báo cáo',
         'linh_vuc': 'Chỉ xem (1 mã)'},
    chi=['Mỗi dòng số liệu: «Giá trị» (cộng / cuối kỳ / kế hoạch)', 'Tỷ lệ thực hiện (IOC tính) = «Giá trị» Thực hiện ÷ «Giá trị» Kế hoạch giao × 100, cùng đối tượng, tên chỉ tiêu, đơn vị tính (câu NV-2)',
         'Tỷ lệ đã trả (IOC tính) = Số đã trả ÷ Số phải trả × 100, người có công (câu NV-2)'],
    bieu=['Cột: «Giá trị» Tổng số theo «Đối tượng thống kê» (biên chế, lao động Việt Nam, lao động nước ngoài)', 'Cột: biến động trong kỳ — tuyển mới, nghỉ hưu, thôi việc, chuyển công tác (thanh riêng, không cộng)',
          'Giao dịch việc làm: số phiên, số lượt người tham gia', 'Thẻ tỷ lệ (IOC tính): thực hiện so với kế hoạch giao; đã trả so với phải trả (người có công)',
          'Diễn biến qua các kỳ: biên chế (Tổng số)', 'Bảng nhiều cấp «Đối tượng thống kê» › «Phân loại/Kết quả» › «Tên chỉ tiêu» › «Đơn vị tính»'],
    kt=['Số đã trả lớn hơn số phải trả', '«Ngày báo cáo» ngoài kỳ báo cáo'],
    loi=['«Kỳ báo cáo» ghi tên lệch mã (như Văn hóa) — IOC hiện tên theo mã', '«Ngày báo cáo» có mã ngay_thang (các eform khác là ngay_bao_cao)', '«Lĩnh vực» danh mục 1 mã'],
    cau=['NV-1. Cách lấy số theo «Phân loại/Kết quả» như mục "Loại số" (Tổng số lấy cuối kỳ; Kế hoạch giao là kế hoạch; còn lại cộng). Đúng không?',
         'NV-2. Có tính tỷ lệ thực hiện / kế hoạch giao và đã trả / phải trả (IOC tính, ghi công thức) không? Hai số cùng một trường «Giá trị», khác «Phân loại/Kết quả».']),

  dict(id='ktxh', file='XA_11_KINH_TE_XA_HOI',
    iok='Xã, phường → Trục UBND → eform «Kinh tế xã hội» (thẻ "Kinh tế xã hội")',
    ban_ghi='một chỉ tiêu kinh tế – xã hội (tên do xã gõ) của một «Nhóm chỉ tiêu», «Phân nhóm», «Đơn vị chủ trì báo cáo» trong một kỳ: Thành phố giao, kế hoạch năm, ước thực hiện đến nay, % hoàn thành',
    khoa='«Địa bàn» + «Nhóm chỉ tiêu» + «Phân nhóm» (được trống) + «Chỉ tiêu» + «Đơn vị chủ trì báo cáo» + «Đơn vị tính» + kỳ',
    loai_so='«Thành phố Giao», «Kế hoạch năm»: kế hoạch (bản cuối, không so tăng giảm, không vẽ thành thanh cạnh số thực hiện). «Ước thực hiện đến nay»: lũy kế đến kỳ (bản cuối kỳ, so cùng kỳ). «Đánh giá mức độ hoàn thành (%)»: tỷ lệ đã nhập — hiện đúng số',
    vai={'dia_ban': DB, 'nhom_chi_tieu': 'Chia cấp 1 (nhóm: 3 nhóm)', 'phan_nhom': 'Chia cấp 2; khóa, được trống', 'chi_tieu': 'Chia cấp 3 (chữ do xã gõ); khóa',
         'don_vi_tinh': 'Không cộng khác đơn vị tính', 'don_vi_chu_tri_bao_cao': 'Ghi kèm dòng; khóa', 'thanh_pho_giao': 'Số kế hoạch: hiện từng dòng', 'kh_nam': 'Số kế hoạch: mẫu số mức hoàn thành IOC tính',
         'uoc_thuc_hien_den_nay': 'Số lũy kế: tử số mức hoàn thành IOC tính; biểu đồ', 'danh_gia_muc_do_hoan_thanh': 'Tỷ lệ đã nhập: hiện đúng số; IOC tính đặt cạnh, không đánh dấu lệch'},
    chi=['Mỗi chỉ tiêu: «Thành phố Giao», «Kế hoạch năm», «Ước thực hiện đến nay», «Đánh giá mức độ hoàn thành (%)» — đúng số đã nhập',
         'Mức hoàn thành (IOC tính) = «Ước thực hiện đến nay» ÷ «Kế hoạch năm» × 100, đặt cạnh số đã nhập; không đánh dấu khi lệch số đã nhập (câu KTXH-1, sửa 03/11/2026)', 'Số chỉ tiêu đã nhập theo nhóm (đếm)'],
    bieu=['Thanh: «Đánh giá mức độ hoàn thành (%)» đã nhập của từng chỉ tiêu, sắp từ thấp đến cao (bấm ra bản ghi)', 'Cột: số chỉ tiêu theo «Nhóm chỉ tiêu»',
          'Diễn biến qua các kỳ: «Ước thực hiện đến nay» của từng chỉ tiêu (chọn chỉ tiêu ở bảng)', 'Bảng nhiều cấp «Nhóm chỉ tiêu» › «Phân nhóm» › «Chỉ tiêu», cột 4 số + mức hoàn thành IOC tính'],
    kt=['Không có kiểm tra riêng (bỏ «Đánh giá mức độ hoàn thành (%)» lệch IOC tính ngày 03/11/2026)'],
    loi=['«Kỳ báo cáo» ghi tên lệch mã (như Văn hóa) — IOC hiện tên theo mã', 'Dữ liệu mẫu «Nhóm chỉ tiêu» "NHÓM CHỈ TIÊU KINH TẾ TỔNG HỢP" không có trong danh mục',
         '«Phân nhóm» chỉ có Thu / Chi ngân sách, nhóm Văn hóa - xã hội, Xây dựng đô thị không có phân nhóm', 'Ngày 30/10 «Đơn vị tính» thêm Tỷ đồng'],
    cau=['KTXH-1. «Đánh giá mức độ hoàn thành (%)» so với «Kế hoạch năm» hay «Thành phố Giao»? IOC tính để đối chiếu theo trường nào?',
         'KTXH-2. «Thành phố Giao» là trường của eform nên được hiện (E2) — chỉ hiện, không dùng làm mốc chấm điểm. Đúng không?']),

  dict(id='mttq', file='XA_12_MTTQ',
    iok='Xã, phường → Trục MTTQ → eform «Mặt trận tổ quốc» (thẻ "Ủy ban MTTQ")',
    ban_ghi='một chỉ tiêu («Tên chỉ tiêu», 36 mã) của một «Nhóm tổ chức» (MTTQ, Đoàn TN, Hội ND, Hội PN, Hội CCB, Công đoàn, các hội quần chúng), có thể chi tiết «Đơn vị/Đoàn/Loại hình» và «Phân loại/ Kết quả», trong một kỳ',
    khoa='«Địa bàn» + «Nhóm tổ chức» + «Tên chỉ tiêu» + «Đơn vị/Đoàn/Loại hình» (được trống) + «Phân loại/ Kết quả» (được trống) + «Đơn vị tính» + kỳ',
    loai_so='Tại thời điểm (bản cuối kỳ): Đoàn viên, Số CBCC cơ quan, Biên chế tổ chức, Tồn quỹ. Phát sinh (cộng): Tổng thu, Tổng chi, Hiến máu, Giám sát, Phản biện xã hội, Mừng thọ, Hòa giải, hội nghị, mô hình… (câu MTTQ-1)',
    vai={'dia_ban': DB, 'nhom_to_chuc': 'Chia cấp 1 (nhóm: 7 tổ chức)', 'ten_chi_tieu': 'Chia cấp 2: mỗi mã một chỉ tiêu', 'don_vi_doan_loai_hinh': 'Chia cấp 3 (chữ do xã gõ); khóa, được trống',
         'phan_loai_ket_qua': 'Mô tả dòng (chữ do xã gõ); khóa, được trống', 'gia_tri': 'Số: cộng hoặc cuối kỳ theo chỉ tiêu', 'don_vi_tinh': 'Chia cấp 4: không cộng khác đơn vị tính (chữ do xã gõ, G8)'},
    chi=['Mỗi mã «Tên chỉ tiêu»: «Giá trị» theo «Đơn vị tính» (cộng hoặc cuối kỳ)', 'Ô số chính: Đoàn viên, Giám sát, Phản biện xã hội, Hiến máu tình nguyện, Mô hình hoạt động, Tổng thu, Tổng chi, Tồn quỹ (như hiện nay)',
         'Không tự tính tồn quỹ từ thu − chi (eform không có tồn đầu kỳ) (câu MTTQ-2)'],
    bieu=['Cột: Đoàn viên theo «Nhóm tổ chức»', 'Cột: Tổng thu, Tổng chi, Tồn quỹ — thanh riêng, theo tổ chức', 'Cột: số cuộc giám sát, phản biện xã hội, hiến máu theo tổ chức',
          'Diễn biến qua các kỳ: đoàn viên; tổng thu, tổng chi', 'Bảng nhiều cấp «Nhóm tổ chức» › «Tên chỉ tiêu» › «Đơn vị/Đoàn/Loại hình» › «Đơn vị tính»'],
    kt=['«Giá trị» không phải số (mẫu trong file ghi "địa bàn")', '«Đơn vị tính» trống khi có «Giá trị»'],
    loi=['Mã danh mục "chitieuh​oi" có ký tự ẩn (U+200B)', 'Dữ liệu mẫu «Giá trị» là "địa bàn" (không phải số)', '«Phân loại/ Kết quả», «Đơn vị tính» kiểu Chữ không danh mục'],
    cau=['MTTQ-1. Loại số như mục "Loại số" (đoàn viên, CBCC, biên chế, tồn quỹ lấy cuối kỳ; còn lại cộng). Đúng không?',
         'MTTQ-2. Có cần kiểm tồn quỹ (tồn kỳ này = tồn kỳ trước + tổng thu − tổng chi) không? Đề xuất: không, vì eform không có trường tồn đầu kỳ.']),
]

# ============================== SỬA, BỔ SUNG NGÀY 02/11/2026 (anh duyệt "làm đi" 02/11/2026) ==============================
# Rà soát 02/11/2026 theo quy ước E1 bổ sung (AGENTS.md mục 1): không thêm gì ngoài eform và bản đọc; không cộng các chỉ tiêu, tình trạng,
# tổ chức, đơn vị tính khác nhau (X7). Mỗi mục: ghi đè phần đọc (chi, bieu, loai_so…) bằng nội dung đang chạy, kèm 'ghi' — đã đổi gì, vì sao.
SUA = {
  'dang': dict(chi=['Mỗi dòng số liệu (Nhóm mục › Đối tượng thống kê › Tên chỉ tiêu › Đơn vị tính): «Giá trị» — cộng các bản ghi (nhóm mục phát sinh) hoặc lấy bản cuối kỳ (nhóm mục tại thời điểm)',
                    'Số dòng số liệu đã nhập (đếm), theo từng nhóm mục — ô số duy nhất của đơn vị'],
               ghi=['Bỏ các ô số đã tự thêm ngoài bản đọc: «Số bản ghi», «Nhóm mục có số liệu», «Đối tượng thống kê có số liệu».']),
  'hdnd': dict(chi=['Mỗi dòng số liệu (Chủ đề › Đối tượng › Tên chỉ tiêu › Đơn vị tính): «Giá trị» — cộng (hoạt động) hoặc bản cuối kỳ (nghị quyết); dòng % chỉ hiện số từng bản ghi',
                    'Cuộc giám sát đã thực hiện: cộng «Giá trị» các bản ghi «Chủ đề / Nhóm» = Hoạt động giám sát, «Đối tượng thống kê» = Cuộc giám sát, «Phân loại/Kết quả» = Đã thực hiện, «Đơn vị tính» = Cuộc',
                    'Kỳ họp HĐND xã: cộng «Giá trị» các bản ghi chủ đề Kỳ họp HĐND, đối tượng Kỳ họp HĐND xã, phân loại Số lượng, đơn vị tính Kỳ họp',
                    'Cuộc tiếp xúc cử tri: cộng «Giá trị» các bản ghi chủ đề Tiếp xúc cử tri, đối tượng Cuộc tiếp xúc cử tri, phân loại Số lượng, đơn vị tính Cuộc tiếp xúc',
                    'Số dòng số liệu đã nhập (đếm); «Thu NSNN», «Chi NSDP» chỉ hiện ở bảng (câu HDND-3)'],
               bieu=['Cột: số dòng số liệu theo «Chủ đề / Nhóm»', 'Cột: Cuộc giám sát theo «Phân loại/Kết quả» Đã thực hiện / Đang thực hiện / Chưa thực hiện — thanh riêng từng tình trạng, không cộng',
                     'Danh sách thanh: cuộc giám sát đã thực hiện, kỳ họp HĐND xã, cuộc tiếp xúc cử tri (thanh riêng)', 'Diễn biến qua các kỳ: cuộc giám sát đã thực hiện',
                     'Thanh «Giá trị» từng dòng số liệu, mỗi đơn vị tính một khối', 'Bảng nhiều cấp «Chủ đề / Nhóm» › «Đối tượng thống kê» › «Tên chỉ tiêu» › «Đơn vị tính»'],
               ghi=['Cuộc giám sát: không cộng các tình trạng Đã / Đang / Chưa thực hiện và không cộng đối tượng «Kết quả thực hiện kiến nghị sau giám sát»; ô số lấy Đã thực hiện.',
                    'Kỳ họp: không cộng hai đối tượng «Kỳ họp HĐND» và «Kỳ họp HĐND xã»; ô số lấy «Kỳ họp HĐND xã» (eform cấp xã).']),
  'tcns': dict(loai_so='«Giá trị kỳ báo cáo»: phát sinh (cộng các tháng), trừ «Số lượng doanh nghiệp đang hoạt động», «Số lượng HTX đang hoạt động» là số tại thời điểm (lấy bản cuối kỳ). «Giá trị lũy kế»: lũy kế từ đầu năm (bản cuối kỳ, so cùng kỳ năm trước). «Dự toán/KH năm»: kế hoạch năm (bản cuối, không so tăng giảm, không vẽ thành thanh cạnh số thực hiện). «Tỷ lệ so với dự toán/KH»: Chữ — ghi đúng chữ đã nhập',
               ghi=['Câu bổ sung 02/11: «Số lượng doanh nghiệp / HTX đang hoạt động» là số tại thời điểm, lấy bản cuối kỳ ở cả ô số lẫn dòng số liệu (trước đây dòng số liệu cộng 3 tháng).',
                    'Số lũy kế (và tỷ lệ lũy kế so với dự toán) so cùng kỳ năm trước, không so quý liền trước.', '«Tỷ lệ so với dự toán/KH» đã nhập ghi ở cột riêng cạnh tỷ lệ IOC tính trong bảng (lấy bản cuối kỳ mỗi khóa).']),
  'qlvb': dict(chi=['Mỗi mã «Nhóm chỉ tiêu» × «Loại văn bản» × «Phân loại»: «Giá trị» (cộng hoặc cuối kỳ) — không cộng các phân loại trong hạn / quá hạn với nhau',
                    'Ô số: Tổng số văn bản đến, Tổng số văn bản đi; Chưa xử lý, Đang xử lý, Đã hoàn tất của văn bản đến — chỉ bản ghi để trống «Phân loại» (số không chia hạn)',
                    'Văn bản quá hạn: cộng «Giá trị» các bản ghi «Phân loại» = Quá hạn, theo từng nhóm chỉ tiêu'],
               bieu=['Danh sách thanh: văn bản đến (tổng số đến, chưa lưu, chờ duyệt, đã chuyển thực hiện) — thanh riêng', 'Danh sách thanh: văn bản đi (tổng số đi, liên thông, nội bộ)',
                     'Danh sách thanh ở từng loại văn bản: chưa xử lý, đang xử lý, đã hoàn tất, mỗi tình trạng tách không chia hạn / trong hạn / quá hạn (thanh riêng, không cộng)',
                     'Cột ở từng loại văn bản: văn bản quá hạn theo nhóm chỉ tiêu', 'Cột: tổng số văn bản đến theo «Tên Cán bộ/Phòng» (số từng phòng đã nhập; bỏ bản để trống tên — số cả xã)',
                     'Diễn biến qua các kỳ: tổng số văn bản đến', 'Bảng nhiều cấp «Loại văn bản» › «Nhóm chỉ tiêu» › «Phân loại»; bảng phụ «Tên Cán bộ/Phòng» › «Nhóm chỉ tiêu»'],
               ghi=['Ô số tình trạng xử lý chỉ tính văn bản đến; biểu đồ tình trạng đặt ở màn từng loại văn bản — không cộng văn bản đến với văn bản đi.',
                    'Biểu đồ theo cán bộ/phòng vẽ «Tổng số văn bản đến» của từng phòng (bản đọc trước ghi "văn bản quá hạn" — số này phải cộng nhiều nhóm chỉ tiêu khác nhau).',
                    'Bỏ ô số «Văn bản quá hạn» (cộng các nhóm chỉ tiêu khác nhau); vẫn có cột quá hạn theo từng nhóm chỉ tiêu.']),
  'gpmb': dict(ghi=['Bổ sung biểu đồ đã có trong bản đọc nhưng chưa làm: số hộ đã bàn giao mặt bằng qua các kỳ.']),
  'gd': dict(chi=['Mỗi dòng số liệu: «Giá trị» (cuối kỳ với Tổng số, cộng với tuyển mới, tốt nghiệp)',
                  'Số học sinh, giáo viên, cơ sở theo bậc học: «Giá trị» các bản ghi «Phân loại/Kết quả» = Tổng số và các chiều khác = Tổng số hoặc Không áp dụng (G5)',
                  'Tuyển mới, tốt nghiệp: học sinh và học viên tách riêng (khác đơn vị tính), chỉ dòng "Tổng số"/"Không áp dụng" ở các chiều khác',
                  'Kiểm tra tổng (X5): Công lập + Ngoài công lập, Nam + Nữ, Kinh + DTTS so với dòng "Tổng số"', 'Ô số: Số học sinh (Tổng số), Số dòng số liệu đã nhập'],
             bieu=['Cột theo «Bậc học/Loại hình giáo dục»: số học sinh, số giáo viên, số cơ sở; học sinh tuyển mới, học sinh tốt nghiệp', 'Cột: học sinh theo loại cơ sở, giới tính, dân tộc',
                   'Cột: học viên tuyển mới, tốt nghiệp theo «Trình độ chuyên môn» (giáo dục nghề nghiệp)', 'Diễn biến qua các kỳ: số học sinh (Tổng số)', 'Thanh «Giá trị» từng dòng số liệu, mỗi đơn vị tính một khối',
                   'Bảng nhiều cấp «Nhóm chỉ tiêu» › «Bậc học» › «Nhóm đối tượng» › «Phân loại/Kết quả»'],
             ghi=['Tuyển mới, tốt nghiệp không cộng học sinh với học viên; bỏ ô số «Tuyển mới», «Tốt nghiệp», «Số giáo viên» (cộng khác đơn vị tính hoặc chưa có trong danh sách ô số).',
                  'Bổ sung biểu đồ đã có trong bản đọc nhưng chưa làm: số cơ sở, số giáo viên, học sinh tốt nghiệp theo bậc học.']),
  'yte': dict(chi=['Mỗi dòng số liệu (Nhóm › Tên chỉ tiêu › Tiểu chỉ tiêu › Đơn vị tính): «Giá trị» — không cộng các chỉ tiêu khác nhau', 'Ô số: Số dòng số liệu đã nhập (câu CHUNG-3)'],
              bieu=['Thanh «Giá trị» từng chỉ tiêu, mỗi đơn vị tính một khối (bấm thanh ra bản ghi)', 'Màn từng nhóm: thẻ so sánh kỳ này – kỳ trước và diễn biến qua các kỳ theo từng chỉ tiêu',
                    'Bảng nhiều cấp «Nhóm chỉ tiêu» › «Tên chỉ tiêu» › «Tiểu chỉ tiêu» › «Đơn vị tính»'],
              ghi=['Câu bổ sung 02/11: bỏ "cộng «Giá trị» theo nhóm và đơn vị tính" (cộng các bệnh, chỉ tiêu khác nhau); bỏ các ô số Số vụ ngộ độc, Số người mắc dịch bệnh, Đối tượng bảo trợ xã hội.']),
  'vh': dict(ghi=['Ô số: Số người tham gia, Kinh phí/Doanh thu (bản đọc duyệt diễn biến tổng qua các kỳ), Số dòng số liệu (câu CHUNG-3); bỏ ô số «Số tin/bài truyền thông» (chỉ còn trong biểu đồ theo mức độ lan tỏa, quan tâm).']),
  'nv': dict(chi=['Mỗi dòng số liệu: «Giá trị» (cộng / cuối kỳ / kế hoạch)', 'Tỷ lệ thực hiện (IOC tính) = Thực hiện ÷ Kế hoạch giao × 100; Tỷ lệ đã trả (IOC tính) = Số đã trả ÷ Số phải trả × 100',
                  'Ô số: Số dòng số liệu, hai tỷ lệ IOC tính, số phiên giao dịch, số lượt người tham gia'],
             bieu=['Cột: «Giá trị» Tổng số (người) theo «Đối tượng thống kê» — mỗi cột một đối tượng', 'Cột: biến động trong kỳ (người) theo đối tượng — tuyển mới, nghỉ hưu, thôi việc, chuyển công tác, thanh riêng, không cộng',
                   'Danh sách thanh: giao dịch việc làm — số phiên, số lượt', 'Thẻ tỷ lệ (IOC tính)', 'Diễn biến qua các kỳ: biên chế (Tổng số)', 'Bảng nhiều cấp «Đối tượng thống kê» › «Phân loại/Kết quả» › «Tên chỉ tiêu» › «Đơn vị tính»'],
             ghi=['Bỏ ô số «Tổng số (người)», «Trong kỳ (người)» (cộng các đối tượng, tình trạng khác nhau); diễn biến qua các kỳ chỉ của biên chế như bản đọc.']),
  'ktxh': dict(bieu=['Thanh: «Đánh giá mức độ hoàn thành (%)» đã nhập từng chỉ tiêu, thấp đến cao', 'Cột: số chỉ tiêu theo nhóm', 'Diễn biến qua các kỳ: «Ước thực hiện đến nay» của chỉ tiêu chọn ở thẻ "Chọn chỉ tiêu"',
                     'Bảng nhiều cấp «Nhóm chỉ tiêu» › «Phân nhóm» › «Chỉ tiêu», cột 4 số + mức hoàn thành IOC tính'],
               ghi=['«Ước thực hiện đến nay», mức hoàn thành IOC tính so cùng kỳ năm trước.', 'Thêm thẻ chọn chỉ tiêu để xem diễn biến (bản đọc ghi "chọn chỉ tiêu"). Bỏ ô số tự thêm: nhóm chỉ tiêu có số liệu, đơn vị chủ trì, số bản ghi.',
                    'Sửa 03/11/2026 (anh bảo bỏ cảnh báo): không đánh dấu "cần xem lại" khi «Đánh giá mức độ hoàn thành (%)» lệch IOC tính — số do xã nhập, hiện đúng số; cột mức hoàn thành IOC tính vẫn đặt cạnh để so.']),
  'mttq': dict(chi=['Mỗi mã «Tên chỉ tiêu»: «Giá trị» theo «Đơn vị tính» (cộng hoặc cuối kỳ), riêng từng «Nhóm tổ chức»',
                    'Ô số của Ủy ban MTTQ: 8 mã (Đoàn viên, Giám sát, Phản biện xã hội, Hiến máu, Mô hình, Tổng thu, Tổng chi, Tồn quỹ) của nhóm «MẶT TRẬN TỔ QUỐC», bản ghi để trống «Phân loại/ Kết quả»',
                    'Không tự tính tồn quỹ từ thu − chi (câu MTTQ-2)'],
               bieu=['Cột: đoàn viên, giám sát, hiến máu theo «Nhóm tổ chức» — mỗi cột một tổ chức', 'Danh sách thanh ở màn từng tổ chức: tổng thu, tổng chi, tồn quỹ của tổ chức đó',
                     'Diễn biến qua các kỳ: đoàn viên của nhóm Mặt trận Tổ quốc', 'Thanh «Giá trị» từng dòng số liệu', 'Bảng nhiều cấp «Nhóm tổ chức» › «Tên chỉ tiêu» › «Đơn vị/Đoàn/Loại hình» › «Đơn vị tính»'],
               ghi=['Không cộng các tổ chức (Mặt trận, Đoàn, các Hội…) với nhau: ô số lấy nhóm «MẶT TRẬN TỔ QUỐC»; số từng đoàn thể xem ở màn nhóm của đoàn thể.',
                    'Không cộng các «Phân loại/ Kết quả» khác nhau của cùng mã chỉ tiêu.']),
}
for c in XA_DOC:
    c.update({k: v for k, v in SUA.get(c['id'], {}).items() if k != 'ghi'})
    c['ghi'] = SUA.get(c['id'], {}).get('ghi', [])

# ============================== PHẦN CHUNG ==============================
CHUNG = [
  ('G1. Chia cấp trên IOC', 'Xã, phường → 4 trục (Đảng ủy, HĐND, UBND, Ủy ban MTTQ) → eform (Đảng ủy, HĐND, MTTQ mỗi trục một eform; UBND 9 eform) → Nhóm (danh mục chia nhóm của eform) → Dòng số liệu → Bản ghi. Giữ bố cục nhiều cấp: Tổng quan → thẻ nhóm → màn nhóm (thẻ so sánh, biểu đồ, bảng) → Dữ liệu đã nhập.'),
  ('G2. «Địa bàn»', 'Danh mục không liệt kê mã trong file; dữ liệu mẫu là tên tổ chức ("Đảng ủy phường Ba Đình", "UBND phường Ba Đình", "MTTQ phường Ba Đình"). API lấy theo mã xã (…/xa_phuong/{code_xa_phuong}/…). Vai trò: xác định xã của bản ghi, tài khoản xã chỉ thấy bản ghi của mình; thuộc khóa. Câu CHUNG-1.'),
  ('G3. Kỳ', 'Người xem chọn Tháng / Quý / Năm (X12). Bản tháng và bản quý cùng khóa không cộng chồng (X2); cùng khóa, cùng kỳ lấy bản gửi sau, bản bị thay vẫn hiện ở Dữ liệu đã nhập và được đánh dấu (X1). Số tại thời điểm lấy bản cuối kỳ (X3). Ngày tháng khác (Từ ngày, Đến ngày, Ngày báo cáo, Ngày cập nhật) chỉ để xem và đánh dấu khi ngoài kỳ.'),
  ('G4. Bản ghi dạng "một chỉ tiêu một bản ghi"', 'Hầu hết eform xã: mỗi bản ghi là một giá trị của một chỉ tiêu (Tên chỉ tiêu, nhóm, phân loại + Giá trị + Đơn vị tính). Ở 8 eform «Tên chỉ tiêu» là Chữ do xã gõ nên IOC không biết trước tên chỉ tiêu: dòng số liệu = tổ hợp các trường mô tả, chỉ cộng «Giá trị» của các bản ghi giống nhau ở mọi trường mô tả và cùng đơn vị tính (X7). Chỉ tiêu có tên cố định chỉ ở các trường danh mục có mã: Hành chính công («Chỉ tiêu»), Quản lý văn bản («Nhóm chỉ tiêu»), Tài chính - Ngân sách («Tiểu chỉ tiêu»), MTTQ («Tên chỉ tiêu»), GPMB (các trường số).'),
  ('G5. Mã "Tổng số" trong danh mục', 'Giáo dục (Loại cơ sở, Giới tính, Dân tộc, Phân loại/Kết quả), Nội vụ (Phân loại/Kết quả) có mã "Tổng số": dòng tổng không cộng chồng với dòng thành phần; IOC tính tổng thành phần, hiện kèm, lệch thì đánh dấu (X5). "Không áp dụng" là chiều không chia.'),
  ('G6. Không tự cộng thành tổng mới', 'Theo X5, X7: không cộng các chỉ tiêu, tình trạng khác nhau thành một tổng khi eform không có trường tổng; biểu đồ vẽ thanh riêng từng chỉ tiêu, không vẽ "cơ cấu" có tổng tự cộng. Tỷ lệ IOC tính chỉ dùng khi eform có đủ tử số, mẫu số; ghi "IOC tính" và công thức theo tên trường.'),
  ('G7. Mọi số lần lại được bản ghi (E4)', 'Ô số, dòng bảng, cột/thanh biểu đồ, thẻ so sánh, cột diễn biến qua các kỳ đều bấm được, mở Dữ liệu đã nhập chỉ với các bản ghi tạo ra số đó.'),
  ('G8. Trường Chữ dùng để gộp', 'Ở Đảng ủy, MTTQ «Đơn vị tính», «Phân loại/Kết quả» là Chữ; «Tên chỉ tiêu» là Chữ ở 8 eform. Đề xuất: gộp khi chữ giống nhau sau khi bỏ khoảng trắng thừa, không phân biệt hoa thường; khác thì là dòng khác. Câu CHUNG-2.'),
  ('G9. Dữ liệu', 'Sheet "API cần IOC cung cấp": 11 API xã, phường đều "Chưa cung cấp" → màn hình tiếp tục dùng bản ghi mẫu sinh đúng khung, đúng kiểu, mã trong danh mục, ghi rõ "bản ghi mẫu".'),
  ('G10. Không thêm, không cộng lẫn (bổ sung 02/11/2026)', 'Chỉ đúng chỉ tiêu, ô số, biểu đồ có trong bản đọc này — kể cả số đếm cũng không tự thêm; kiểm thử, quy tắc trình bày đòi thêm thì hỏi. Không cộng các chỉ tiêu, tình trạng, tổ chức, đơn vị tính khác nhau thành một số; kiểm thử tự động chặn ở mọi ô số và biểu đồ.'),
]
CAU_CHUNG = [
  'CHUNG-1. Quyền xem theo cấp: tài khoản cấp Thành phố có xem được số của từng xã, phường (chọn xã để xem như tài khoản xã) không? Có cần màn "Theo 126 xã, phường" cho các eform xã không? (Tài khoản xã vẫn chỉ xem số của mình, như anh chốt 27/10.)',
  'CHUNG-2. Gộp các bản ghi theo trường Chữ («Tên chỉ tiêu», «Đơn vị tính»…) khi chữ giống nhau sau khi bỏ khoảng trắng thừa, không phân biệt hoa thường — đồng ý không?',
  'CHUNG-3. Tổng quan xã (màn ngoài): ô số chính đề xuất — Hành chính công: Tiếp nhận trực tuyến, Đúng và trước hạn, Đang giải quyết quá hạn; Quản lý văn bản: Tổng số văn bản đến, Tổng số văn bản đi; GPMB: Diện tích đã thu hồi, Đã bàn giao mặt bằng; Tài chính - Ngân sách: Tổng thu NSNN, Tổng chi NSNN (lũy kế); MTTQ: Đoàn viên; Đảng ủy, HĐND, Giáo dục, Y tế, Văn hóa, Nội vụ, Kinh tế xã hội: số dòng số liệu đã nhập. Anh muốn thêm, bớt ô nào?',
]


# Trả lời ngày 30/10/2026: anh trả lời "theo đề xuất" cho mọi câu. Câu chỉ hỏi, chưa ghi đề xuất thì chốt theo hướng an toàn
# (chỉ hiện số đã nhập, không tự cộng, không tự tính) — anh đổi bất cứ lúc nào, sửa ở đây rồi chạy lại.
DUYET = 'ĐÃ DUYỆT 30/10/2026: anh trả lời "theo đề xuất" cho mọi câu hỏi (cuối bản đọc) · sửa, bổ sung 02/11/2026 (anh duyệt "làm đi")'
CHOT = {
  'HDND-3': '«Thu NSNN», «Chi NSDP»: cộng các bản ghi cùng dòng số liệu, chỉ hiện ở bảng, không ghi đơn vị (eform không có), không vẽ biểu đồ, không đưa lên ô số.',
  'HCC-4': '«Đơn vị» là cấp 3 của bảng (mô tả dòng), số của xã cộng các đơn vị; «Từ ngày», «Đến ngày» chỉ để xem, không dùng xếp kỳ.',
  'QLVB-1': 'Chưa rõ thành phần nên KHÔNG kiểm tổng văn bản đến, đi; chỉ hiện từng chỉ tiêu.',
  'QLVB-2': '«Tổng số công văn», «Hạn xử lý» hiện như chỉ tiêu phát sinh (cộng), theo «Phân loại»; «Chưa xử lý / Đang xử lý / Đã hoàn tất» tính theo «Loại văn bản» ghi ở bản ghi (đến hay đi).',
  'QLVB-3': 'Cùng chỉ tiêu, cùng kỳ: có bản ghi để trống «Tên Cán bộ/Phòng» thì đó là số của xã, chỉ lấy bản đó; không có thì cộng các cán bộ/phòng.',
  'QLVB-4': '«Ngày báo cáo» chỉ để xem, không dùng xếp kỳ.',
  'GPMB-3': '«Tỷ lệ bàn giao» IOC tính theo số hộ: «Đã bàn giao mặt bằng» ÷ «Tổng số đối tượng/ hộ GPMB» × 100.',
  'YTE-2': 'Bản ghi «Tần suất» = Tuần xếp vào kỳ theo «Tháng»/«Quý» ghi trên bản ghi; nhiều bản cùng khóa, cùng kỳ thì theo X1 lấy bản gửi sau (không cộng các tuần) và đánh dấu "nhiều bản tuần trong kỳ" để người nhập xem lại.',
  'KTXH-1': 'Mức hoàn thành IOC tính so với «Kế hoạch năm» (= «Ước thực hiện đến nay» ÷ «Kế hoạch năm» × 100). Sửa 03/11/2026: chỉ đặt cạnh số đã nhập, không đánh dấu khi lệch.',
  'CHUNG-1': 'Tài khoản cấp Thành phố chọn một xã, phường để xem (như tài khoản xã); chưa làm màn "Theo 126 xã, phường" cho eform xã. Tài khoản xã chỉ xem số của mình.',
}


def tra_loi(cau):
    ids = [q.split('.')[0] for q in cau]
    return ['', '**Trả lời (30/10/2026):** theo đề xuất.'] + [f'- {k}: {CHOT[k]}' for k in ids if k in CHOT]


def gen_one(c):
    e = XE[c['id']]
    codes = {f['c'] for f in e['fields']}
    bad = set(c['vai']) - codes
    assert not bad, (e['id'], bad)
    L = [f'# BẢN ĐỌC EFORM XÃ, PHƯỜNG — {e["ten"].upper()}', '',
         f'- **Ngày**: {NGAY} · lập theo Phần IV của docs/CHUNG/QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28 · **' + DUYET + '** (phần chung, câu hỏi chung ở XA_00_TONG_HOP)',
         f'- **Nguồn**: sheet "{e.get("sheet", "XãPhường")}" của "File mô tả đầu vào eform" tải ngày {FILE_NGAY}; bảng trường sinh thẳng từ file (đủ {len(e["fields"])} trường, đúng thứ tự)',
         f'- **Sheet, dòng**: từ dòng {e["dong"]} · {len(e["fields"])} trường · trục {TRUC.get(e["truc"], e["truc"])} · mã trên IOC: {e["id"]}',
         f'- **Trên IOC**: {c["iok"]}', f'- **Một bản ghi là**: {c["ban_ghi"]}', f'- **Khóa bản ghi**: {c["khoa"]}', f'- **Loại số**: {c["loai_so"]}', '',
         'Kỳ, cách gộp kỳ, bản trùng khóa theo phần chung G3. Mọi trường đều hiện ở màn "Dữ liệu đã nhập"; cột "Vai trò" chỉ nói trường đó dùng ở phần tổng hợp thế nào. Kiểu trường giữ y hệt eform.', '',
         '| # | Tên trường (đúng như eform) | Mã | Kiểu | Dữ liệu mẫu | Danh mục | Vai trò ở phần tổng hợp |', '|---|---|---|---|---|---|---|']
    for j, f in enumerate(e['fields']):
        v = KY.get(f['c']) or c['vai'].get(f['c'], 'Chỉ xem ở Dữ liệu đã nhập')
        L.append(f'| {j + 1} | {md(f["l"])} | {f["c"]} | {KIEU.get(f["t"], "(để trống trong file)")} | {md(str(f.get("mau", ""))[:30])} | {md(dmt(f))} | {md(v)} |')
    L += ['', '**Chỉ tiêu dự kiến** (chỉ dùng trường của eform):', ''] + [f'- {x}' for x in c['chi']]
    L += ['', '**Biểu đồ, bảng dự kiến** (mọi cột, thanh, thẻ bấm được ra bản ghi — G7):', ''] + [f'- {x}' for x in c['bieu']]
    L += ['', '**Đánh dấu bản ghi cần xem lại** (ngoài các lỗi chung X8: mã ngoài danh mục, ô số không đọc được, ngày không đọc được, thiếu trường khóa, trùng khóa):', ''] + [f'- {x}' for x in c['kt']]
    L += ['', '**Lỗi, chỗ nghi trong file eform:**', ''] + [f'- {x}' for x in c['loi']]
    if c.get('ghi'):
        L += ['', '## SỬA, BỔ SUNG NGÀY 02/11/2026', '', 'Rà soát theo quy ước E1 bổ sung (không thêm gì ngoài eform và bản đọc; không cộng các chỉ tiêu, tình trạng, tổ chức, đơn vị tính khác nhau). Các mục trên đã ghi theo nội dung đang chạy.', ''] + [f'- {x}' for x in c['ghi']]
    L += ['', '## CÂU HỎI VÀ TRẢ LỜI', ''] + [f'{n + 1}. {q}' for n, q in enumerate(c['cau'])] + tra_loi(c['cau']) + ['']
    return L


def main():
    assert [c['id'] for c in XA_DOC] == [e['id'] for e in X], 'XA_DOC phải đủ 12 eform, đúng thứ tự khung'
    os.makedirs(OUT, exist_ok=True)
    nf = 0
    for c in XA_DOC:
        L = gen_one(c)
        nf += len(XE[c['id']]['fields'])
        open(os.path.join(OUT, f'{c["file"]}_2026_10_30.md'), 'w', encoding='utf-8').write('\n'.join(L))
    T = ['# BẢN ĐỌC 12 EFORM XÃ, PHƯỜNG — TỔNG HỢP, PHẦN CHUNG, CÂU HỎI', '',
         f'- **Ngày**: {NGAY} · lập theo Phần IV của docs/CHUNG/QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28 · **' + DUYET + '**',
         f'- **Nguồn**: sheet "XãPhường" của "File mô tả đầu vào eform" (Google Sheets 1n1UHGnQ4sULz6_D9J0D2N02B0grCc8RbnLh0h9mY70k) tải ngày {FILE_NGAY}: 12 eform, {nf} trường',
         '- **Sau khi duyệt**: dựng lại màn hình trên khung chung js/features/ctm-eform.js (một khung cho xã, 4 trục, các sở), khung eform sinh lại từ file bằng tools/xa_eform_schema.py, kiểm thử, SRS và mô tả chỉ tiêu xã sinh lại từ code.', '',
         '## 1. Danh sách bản đọc', '', '| # | Eform | Trục | Trường | Bản đọc | Số câu hỏi |', '|---|---|---|---|---|---|']
    for n, c in enumerate(XA_DOC):
        e = XE[c['id']]
        T.append(f'| {n + 1} | {e["ten"]} | {TRUC.get(e["truc"], e["truc"])} | {len(e["fields"])} | {c["file"]}_2026_10_30.md | {len(c["cau"])} |')
    T += ['', '## 2. Thay đổi của file eform ngày 30/10/2026 so với khung IOC đang chạy (bản 28/10)', '',
          '- Quản lý văn bản: thêm «Ngày báo cáo» (ngay_bao_cao, Ngày tháng), «Tên Cán bộ/Phòng» (ten_can_bo_phong, Chữ); bỏ «Ngày báo cáo» cũ (ngay_van_hanh); «Nhóm chỉ tiêu»: van_ban_den_da_chuyen → van_ban_den_da_chuyen_thuc_hien',
          '- Đảng ủy: «Nhóm mục» thongkedoanktttra → thongkedoankttra, sửa tên «Biến động Đảng viên theo thời gian»; «Đối tượng thống kê» doanktttra → doankttra',
          '- Tài chính - Ngân sách: «Tiểu chỉ tiêu» gộp «Vướng mắc», «Kiến nghị» thành «Vướng mắc, kiến nghị» (vuong_mac_kien_nghi)',
          '- Giáo dục: «Nguồn số liệu» mã bao_cao_nganh_giao_duc đổi tên "Tuyển mới" → "Báo cáo ngành giáo dục"',
          '- Kinh tế xã hội: «Đơn vị tính» thêm Tỷ đồng (TY_DONG); HĐND: đổi tên «Chủ đề/Nhóm» → «Chủ đề / Nhóm»', '',
          '## 3. Phần chung', '']
    T += [f'- **{a}**: {b}' for a, b in CHUNG]
    T += ['', '## 4. Câu hỏi chung và trả lời', ''] + [f'{n + 1}. {q}' for n, q in enumerate(CAU_CHUNG)] + tra_loi(CAU_CHUNG)
    T += ['', '## 5. Câu hỏi từng eform và trả lời', '']
    for c in XA_DOC:
        T += [f'**{XE[c["id"]]["ten"]}**', ''] + [f'- {q}' for q in c['cau']] + tra_loi(c['cau']) + ['']
    T += ['## 6. Sửa, bổ sung ngày 02/11/2026', '']
    for c in XA_DOC:
        if c.get('ghi'): T += [f'- **{XE[c["id"]]["ten"]}**: ' + ' '.join(c['ghi'])]
    T += ['', '## 7. Lỗi trong file eform (gửi bên eform)', '']
    for c in XA_DOC:
        T += [f'- **{XE[c["id"]]["ten"]}**: ' + '; '.join(c['loi'])]
    T.append('')
    open(os.path.join(OUT, 'XA_00_TONG_HOP_2026_10_30.md'), 'w', encoding='utf-8').write('\n'.join(T))
    print(f'Đã ghi {len(XA_DOC) + 1} file vào {OUT} · 12 eform, {nf} trường, {sum(len(c["cau"]) for c in XA_DOC) + len(CAU_CHUNG)} câu hỏi')


if __name__ == '__main__':
    main()
