# -*- coding: utf-8 -*-
"""Chạy từ thư mục gốc ioc: python3 tools/so_ban_doc_eform.py — ghi docs/BAN_DOC_EFORM/SO_*.md.
Sinh bản đọc eform của các sở (đợt 1: Thanh tra, Công Thương, NN&MT, Nội vụ) theo Phần IV quy ước 28/10/2026.
Bảng trường sinh thẳng từ js/core/eform-khung.js; vai trò khai theo MÃ ĐẦY ĐỦ, mã sai thì dừng (tránh lỗi mã cắt cụt)."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(ROOT, 'js/core/eform-khung.js'), encoding='utf-8').read()
i = s.index('const EFORM_KHUNG = ') + len('const EFORM_KHUNG = ')
K, _ = json.JSONDecoder().raw_decode(s[i:])
KH = {k['id']: k for k in K}
KIEU = {'dm': 'Danh mục', 'so': 'Số', 'chu': 'Chữ', 'ngay': 'Ngày tháng'}
KY = {'ky_bao_cao': 'Kỳ: xếp bản ghi vào kỳ', 'nam': 'Kỳ', 'thang': 'Kỳ', 'quy': 'Kỳ'}
DB = 'Xã, phường của bản ghi: màn «Theo 126 xã, phường», hồ sơ xã'
NGAY = '28/10/2026'


def dmt(f):
    ls = [o.get('l') or o['v'] for o in f.get('dm') or []]
    if not ls:
        return '—'
    if f['t'] != 'dm':
        return f'— (file kèm {len(ls)} giá trị; trường {KIEU.get(f["t"], "để trống kiểu")} nên hiện đúng chữ đã nhập)'
    if len(ls) == 126:
        return '126 xã, phường'
    return f'{len(ls)} mã: ' + ', '.join(ls[:6]) + (f', … (+{len(ls) - 6})' if len(ls) > 6 else '')


def gen(out, title, head, khoi, cfgs, cau, chung=None, them=None):
    E = KH[khoi]['eforms']
    assert len(E) == len(cfgs), (len(E), len(cfgs))
    L = [title, ''] + head + ['', 'Mọi eform có trường kỳ «Kỳ báo cáo» (Tháng/Quý/Năm), «Năm», «Tháng», «Quý»: xếp bản ghi vào kỳ; người xem chọn Tháng / Quý / Năm (X12); '
                              'bản tháng và bản quý cùng khóa không cộng chồng (X2); cùng khóa, cùng kỳ lấy bản gửi sau (X1). Mọi trường đều hiện ở màn "Dữ liệu đã nhập"; '
                              'cột "Vai trò" chỉ nói trường đó dùng ở phần tổng hợp thế nào. Kiểu trường giữ y hệt eform (X11).', '']
    if chung:
        L += chung + ['']
    nf = 0
    for n, (e, c) in enumerate(zip(E, cfgs)):
        codes = {f['c'] for f in e['fields']}
        bad = set(c['vai']) - codes
        assert not bad, (e['id'], bad)
        nf += len(e['fields'])
        L += [f'## {n + 1}. {e["ten"]}', '',
              f'- **Sheet, dòng**: {KH[khoi]["sheet"]}, từ dòng {e["dong"]} · {len(e["fields"])} trường · mã trên IOC: {e["id"]}',
              f'- **Trên IOC**: {c["iok"]}',
              f'- **Một bản ghi là**: {c["ban_ghi"]}', f'- **Khóa bản ghi**: {c["khoa"]}', f'- **Loại số**: {c["loai_so"]}', '',
              '| # | Tên trường (đúng như eform) | Mã | Kiểu | Dữ liệu mẫu | Danh mục | Vai trò ở phần tổng hợp |', '|---|---|---|---|---|---|---|']
        for j, f in enumerate(e['fields']):
            v = KY.get(f['c']) or c['vai'].get(f['c'], 'Chỉ xem ở Dữ liệu đã nhập')
            L.append(f'| {j + 1} | {f["l"]} | {f["c"]} | {KIEU.get(f["t"], "(để trống trong file)")} | {str(f.get("mau", ""))[:30]} | {dmt(f)} | {v} |')
        L += ['', '**Chỉ tiêu dự kiến** (chỉ dùng trường của eform):', ''] + [f'- {x}' for x in c['chi']]
        L += ['', '**Biểu đồ, bảng dự kiến**:', ''] + [f'- {x}' for x in c['bieu']]
        if c.get('kt'):
            L += ['', '**Đánh dấu bản ghi cần xem lại** (ngoài các lỗi chung X8):', ''] + [f'- {x}' for x in c['kt']]
        if c.get('loi'):
            L += ['', '**Lỗi, chỗ nghi trong file eform:**', ''] + [f'- {x}' for x in c['loi']]
        L.append('')
    L += ['## CÂU HỎI VÀ TRẢ LỜI (28/10/2026)', '']
    L += [f'{n + 1}. {q}' for n, q in enumerate(cau)]
    L += ['', '**Trả lời (28/10/2026):** theo đề xuất ở tất cả các câu.'] + ([''] + them if them else [])
    open(out, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print('ok', out, len(E), 'eform', nf, 'trường', len(cau), 'câu hỏi')


OUTD = os.path.join(ROOT, 'docs', 'BAN_DOC_EFORM')
HEAD = lambda nguon, cap, an: [f'- **Ngày**: {NGAY} · lập theo Phần IV của docs/CHUNG/QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28 · **đã duyệt 28/10/2026**: anh trả lời "theo đề xuất" cho mọi câu hỏi (cuối bản đọc)',
                               f'- **Nguồn**: {nguon}; bảng trường sinh thẳng từ file (đủ mọi trường, đúng thứ tự). Khung trên IOC đã đối chiếu với file tải ngày {NGAY}: khớp.',
                               f'- **Chia cấp trên IOC**: {cap}', f'- **Chỉ tiêu cũ**: {an}']

# ============================================================ THANH TRA
TT_KT_CHUNG = 'Ô mã ngoài danh mục, ô Số không phải số, ô Ngày không đọc được, thiếu khóa, thiếu kỳ (X8)'
TTRA = [
 dict(iok='Thanh tra Thành phố → eform 1 (một thẻ "Kiểm tra Chủ tịch UBND xã, phường")',
  ban_ghi='một cuộc kiểm tra (theo «Căn cứ/Quyết định kiểm tra số») đối với một xã, phường («Địa bàn»), ghi kèm kết luận và kiến nghị của cuộc đó',
  khoa='«Căn cứ/Quyết định kiểm tra số» + «Địa bàn» + kỳ',
  loai_so='«Số đơn vị được kiểm tra», «Số kiến nghị xử lý», «Giá trị kiến nghị thu hồi/giảm trừ» là số của cuộc; «Đã/Đang/Quá hạn thực hiện kiến nghị» là tình trạng tại thời điểm báo cáo (câu hỏi 1)',
  vai={'dia_ban': DB, 'thon_tdp': 'Mô tả dòng', 'loai_ban_ghi': 'Bỏ bản «Không phát sinh» khỏi phần đếm (danh mục đang chép nhầm — câu hỏi 2)',
       'ten_cuoc_kiem_tra_noi_dung': 'Chia cấp 2 (tên cuộc kiểm tra)', 'doi_tuong_kiem_tra': 'Mô tả dòng', 'nhom_doi_tuong': 'Mô tả dòng',
       'co_quan_chu_tri_kiem_tra': 'Đếm cuộc theo Có / Không (nghĩa chưa rõ — câu hỏi 3)', 'can_cu_quyet_dinh_kiem_tra_so': 'Khóa; đếm số cuộc kiểm tra (số quyết định khác nhau)',
       'ngay_quyet_dinh': 'Mô tả dòng', 'thoi_gian_bat_dau': 'Kiểm tra thứ tự ngày', 'thoi_gian_ket_thuc_ke_hoach': 'So với kết thúc thực tế (cuộc chậm so kế hoạch)',
       'thoi_gian_ket_thuc_thuc_te': 'Kiểm tra thứ tự ngày', 'trang_thai_kiem_tra': 'Chia cấp 1; biểu đồ cuộc theo trạng thái (chữ do đơn vị gõ)',
       'so_don_vi_duoc_kiem_tra': 'Số: cộng (mỗi cuộc lấy bản kỳ cuối)', 'da_ban_hanh_ket_luan': 'Đếm cuộc đã ban hành kết luận', 'ngay_ban_hanh_ket_luan': 'Kiểm tra: Có kết luận mà thiếu ngày',
       'so_ket_luan': 'Kiểm tra: Có kết luận mà thiếu số kết luận', 'co_kien_nghi_xu_ly': 'Kiểm tra: Không mà số kiến nghị > 0', 'so_kien_nghi_xu_ly': 'Số: cộng (mỗi cuộc lấy bản kỳ cuối); mẫu số của tỷ lệ',
       'gia_tri_kien_nghi_thu_hoi_giam_tru_trieu_dong': 'Số: cộng, triệu đồng (mỗi cuộc lấy bản kỳ cuối)', 'da_thuc_hien_kien_nghi': 'Số tại thời điểm: mỗi cuộc lấy bản kỳ cuối rồi cộng; tử số của tỷ lệ',
       'dang_thuc_hien_kien_nghi': 'Số tại thời điểm: như trên', 'qua_han_thuc_hien_kien_nghi': 'Số tại thời điểm: như trên',
       'ty_le_thuc_hien_kien_nghi': 'Số tỷ lệ đã nhập: hiện đúng số; đối chiếu với IOC tính', 'tinh_trang_qua_han': 'Biểu đồ cuộc theo tình trạng quá hạn (chữ do đơn vị gõ)'},
  chi=['Số cuộc kiểm tra = đếm «Căn cứ/Quyết định kiểm tra số» khác nhau (bỏ «Không phát sinh»)', 'Số xã, phường được kiểm tra = đếm «Địa bàn» khác nhau',
       'Cộng «Số đơn vị được kiểm tra»; cuộc đã ban hành kết luận (đếm «Đã ban hành kết luận» = Có)',
       'Cộng «Số kiến nghị xử lý», «Giá trị kiến nghị thu hồi/giảm trừ (triệu đồng)»',
       'Cộng «Đã thực hiện», «Đang thực hiện», «Quá hạn thực hiện kiến nghị» (mỗi cuộc lấy bản kỳ cuối)',
       'Tỷ lệ thực hiện kiến nghị (IOC tính) = «Đã thực hiện kiến nghị» ÷ «Số kiến nghị xử lý» × 100 (câu hỏi 1); một cuộc thì hiện đúng «Tỷ lệ thực hiện kiến nghị» đã nhập'],
  bieu=['Cuộc kiểm tra theo «Trạng thái kiểm tra»; theo «Tình trạng quá hạn»; theo «Cơ quan chủ trì kiểm tra»', 'Thanh 3 tình trạng thực hiện kiến nghị (đã / đang / quá hạn)',
        'Số cuộc kiểm tra qua các kỳ', 'Bảng nhiều cấp «Trạng thái kiểm tra» › «Tên cuộc kiểm tra/nội dung»', 'Theo 126 xã, phường: số cuộc, số kiến nghị, tỷ lệ thực hiện kiến nghị'],
  kt=['«Tỷ lệ thực hiện kiến nghị» lệch «Đã thực hiện kiến nghị» ÷ «Số kiến nghị xử lý» × 100 quá 0,1 điểm', '«Đã» + «Đang» + «Quá hạn thực hiện kiến nghị» lớn hơn «Số kiến nghị xử lý»',
      '«Đã ban hành kết luận» = Có mà thiếu «Ngày ban hành kết luận» hoặc «Số kết luận»', '«Có kiến nghị xử lý» = Không mà «Số kiến nghị xử lý» > 0',
      '«Thời gian kết thúc thực tế» trước «Thời gian bắt đầu»'],
  loi=['«Loại bản ghi» chép danh mục của eform Tiếp công dân (Tổng hợp tiếp công dân/đơn thư, Chi tiết đơn thư, Chi tiết vụ việc, Không phát sinh) — không hợp với eform kiểm tra',
       '«Cơ quan chủ trì kiểm tra» là Có/Không: không rõ nghĩa (Thanh tra Thành phố chủ trì?)', '«Trạng thái kiểm tra», «Tình trạng quá hạn» kiểu Chữ, không có danh mục — mỗi đơn vị gõ một kiểu thì không gom được',
       'Dữ liệu mẫu: «Địa bàn» "phường Cầu Giấy" (chữ thường, không trùng danh mục); «Căn cứ/Quyết định kiểm tra số» "10.0"; đã 12 + đang 11 + quá hạn 10 = 33 > 10 kiến nghị; tỷ lệ 88,6 không khớp số nào']),
 dict(iok='Thanh tra Thành phố → eform 2 (thẻ "Thanh tra")',
  ban_ghi='một cuộc thanh tra (theo «Số QĐ thanh tra») tại một xã, phường, hoặc một lần theo dõi sau thanh tra của cuộc đó («Loại bản ghi»)',
  khoa='«Số QĐ thanh tra» + «Địa bàn» + «Loại bản ghi» + kỳ',
  loai_so='Số của cuộc (đơn vị, kiến nghị, giá trị kiến nghị thu hồi) và số theo dõi («Giá trị đã thu hồi», «Số văn bản đôn đốc») — mỗi cuộc lấy bản gửi sau cùng trong kỳ xem (câu hỏi 4)',
  vai={'loai_ban_ghi': 'Chia: Cuộc thanh tra / Theo dõi sau thanh tra; bỏ «Không phát sinh» khỏi phần đếm', 'ten_cuoc_thanh_tra_noi_dung': 'Chia cấp 2 (tên cuộc)',
       'nguon_ke_hoach': 'Biểu đồ cuộc theo nguồn kế hoạch', 'thon_tdp': 'Mô tả dòng', 'dia_ban': DB, 'don_vi_duoc_thanh_tra': 'Mô tả dòng',
       'linh_vuc_thanh_tra': 'Chia cấp 1 (11 lĩnh vực); biểu đồ', 'co_quan_chu_tri': 'Đếm cuộc theo Có / Không (nghĩa chưa rõ — câu hỏi 3)',
       'so_qd_thanh_tra': 'Khóa; đếm số cuộc thanh tra (số QĐ khác nhau)', 'ngay_bat_dau': 'Kiểm tra thứ tự ngày', 'ngay_ket_thuc_du_kien': 'So với kết thúc thực tế',
       'ngay_ket_thuc_thuc_te': 'Kiểm tra thứ tự ngày', 'trang_thai_cuoc_thanh_tra': 'Biểu đồ cuộc theo trạng thái (8 trạng thái)', 'so_don_vi_duoc_thanh_tra': 'Số: cộng',
       'da_ban_hanh_ket_luan': 'Đếm cuộc đã ban hành kết luận', 'so_kl_thanh_tra': 'Kiểm tra: Có kết luận mà thiếu số', 'ngay_kl_thanh_tra': 'Kiểm tra: Có kết luận mà thiếu ngày',
       'kien_nghi_xu_ly': 'Kiểm tra: Không mà số kiến nghị > 0', 'so_kien_nghi_xu_ly': 'Số: cộng', 'gia_tri_kien_nghi_thu_hoi_trieu_dong': 'Số: cộng (triệu đồng); mẫu số tỷ lệ thu hồi',
       'gia_tri_da_thu_hoi_trieu_dong': 'Số: cộng (triệu đồng); tử số tỷ lệ thu hồi', 'so_ca_nhan_to_chuc_kien_nghi_xu_ly_hc': 'Số: cộng', 'so_vu_viec_chuyen_cq_dieu_tra': 'Số: cộng',
       'so_van_ban_don_doc_nhac': 'Số: cộng', 'ty_le_thu_hoi': 'Số tỷ lệ đã nhập: hiện đúng số; đối chiếu IOC tính', 'tien_do_phan_tram': 'Số tỷ lệ đã nhập: hiện đúng số (không gộp)',
       'qua_han_ngay': 'Số đã nhập; kiểm tra với mức cảnh báo', 'muc_canh_bao': 'Biểu đồ cuộc theo mức cảnh báo; đếm cuộc mức Đỏ'},
  chi=['Số cuộc thanh tra = đếm «Số QĐ thanh tra» khác nhau (bỏ «Không phát sinh»); số cuộc theo «Lĩnh vực thanh tra», «Trạng thái cuộc thanh tra»',
       'Cuộc đã ban hành kết luận; cuộc mức cảnh báo Đỏ', 'Cộng «Số đơn vị được thanh tra», «Số kiến nghị xử lý», «Số cá nhân/tổ chức kiến nghị xử lý HC», «Số vụ việc chuyển CQ điều tra», «Số văn bản đôn đốc/nhắc»',
       'Cộng «Giá trị kiến nghị thu hồi (triệu đồng)», «Giá trị đã thu hồi (triệu đồng)»', 'Tỷ lệ thu hồi (IOC tính) = «Giá trị đã thu hồi» ÷ «Giá trị kiến nghị thu hồi» × 100; một cuộc thì hiện đúng «Tỷ lệ thu hồi» đã nhập'],
  bieu=['Cuộc theo «Lĩnh vực thanh tra», «Trạng thái cuộc thanh tra», «Nguồn kế hoạch», «Mức cảnh báo»', 'Thanh giá trị kiến nghị thu hồi – đã thu hồi', 'Số cuộc, giá trị đã thu hồi qua các kỳ',
        'Bảng nhiều cấp «Lĩnh vực thanh tra» › «Tên cuộc thanh tra/nội dung»', 'Theo 126 xã, phường: số cuộc, giá trị kiến nghị thu hồi, tỷ lệ thu hồi'],
  kt=['«Tỷ lệ thu hồi» lệch «Giá trị đã thu hồi» ÷ «Giá trị kiến nghị thu hồi» × 100 quá 0,1 điểm', '«Giá trị đã thu hồi» lớn hơn «Giá trị kiến nghị thu hồi»',
      '«Đã ban hành kết luận» = Có mà thiếu «Số KL thanh tra» hoặc «Ngày KL thanh tra»', '«Kiến nghị xử lý» = Không mà «Số kiến nghị xử lý» > 0',
      '«Ngày kết thúc thực tế» trước «Ngày bắt đầu»', '«Quá hạn (ngày)» > 0 mà «Mức cảnh báo» là Xanh - bình thường'],
  loi=['Danh mục «Lĩnh vực thanh tra» tách "Phòng chống tham nhũng, tiêu cực" thành hai mã: "Phòng chống tham nhũng" và "tiêu cực" (mã "tieu cuc" có dấu cách)',
       '«Cơ quan chủ trì» là Có/Không: không rõ nghĩa', 'Dữ liệu mẫu: «Tỷ lệ thu hồi» 88 nhưng 48,7 ÷ 50,4 = 96,6%; «Thôn/TDP» "test"']),
 dict(iok='Thanh tra Thành phố → eform 3 (thẻ "Tiếp công dân, khiếu nại, tố cáo")',
  ban_ghi='số liệu tiếp công dân, xử lý đơn thư, giải quyết vụ việc của một xã, phường (có thể chi tiết đến thôn/TDP) trong một kỳ; «Loại bản ghi» = Tổng hợp, Chi tiết đơn thư, Chi tiết vụ việc hoặc Không phát sinh',
  khoa='«Địa bàn» + «Thôn/TDP» (được để trống) + «Loại bản ghi» + kỳ',
  loai_so='Phát sinh trong kỳ (cộng khi xem kỳ dài hơn): cuộc tiếp, lượt, đoàn, vụ việc qua tiếp dân, đơn tiếp nhận, đơn mới, các loại đơn, vụ thụ lý, đã giải quyết, đúng hạn, quá hạn, rút đơn. Đầu kỳ (lấy kỳ đầu): «Đơn kỳ trước chuyển sang». Tại thời điểm (lấy kỳ cuối): «Số vụ đang xử lý trong hạn/quá hạn», «Số vụ phức tạp/kéo dài», «Tồn cuối kỳ» (câu hỏi 6)',
  vai={'ngay_bao_cao': 'Xếp kỳ cho bản «Đột xuất» (câu hỏi 7)', 'dia_ban': DB, 'thon_tdp': 'Khóa (được để trống); mô tả dòng',
       'loai_ban_ghi': 'Cùng địa bàn, kỳ có bản Tổng hợp thì chỉ dùng bản Tổng hợp; không có thì cộng bản chi tiết (câu hỏi 5)', 'loai_tiep_cong_dan_chinh': 'Biểu đồ theo loại tiếp công dân chính',
       'so_cuoc_tiep_cong_dan': 'Số phát sinh: cộng', 'so_luot_cong_dan': 'Số phát sinh: cộng', 'so_doan_dong_nguoi': 'Số phát sinh: cộng', 'so_vu_viec_tiep_nhan_qua_tiep_dan': 'Số phát sinh: cộng',
       'tong_don_thu_tiep_nhan': 'Số phát sinh: cộng; kiểm tra với các thành phần', 'don_ky_truoc_chuyen_sang': 'Số đầu kỳ: lấy kỳ đầu', 'don_moi_trong_ky': 'Số phát sinh: cộng',
       'don_du_dieu_kien_xu_ly': 'Số phát sinh: cộng', 'don_khong_du_dieu_kien_luu': 'Số phát sinh: cộng', 'don_thuoc_tham_quyen': 'Số phát sinh: cộng',
       'don_khong_thuoc_tham_quyen_da_chuyen': 'Số phát sinh: cộng', 'don_khong_thuoc_tham_quyen_da_huong_dan': 'Số phát sinh: cộng',
       'so_don_khieu_nai': 'Số phát sinh: cộng; cơ cấu loại đơn', 'so_don_to_cao': 'Số phát sinh: cộng; cơ cấu loại đơn', 'so_don_kien_nghi_phan_anh': 'Số phát sinh: cộng; cơ cấu loại đơn',
       'so_don_nhieu_noi_dung_khac': 'Số phát sinh: cộng; cơ cấu loại đơn', 'so_vu_viec_thu_ly': 'Số phát sinh: cộng; mẫu số tỷ lệ giải quyết', 'so_vu_viec_da_giai_quyet': 'Số phát sinh: cộng; tử số tỷ lệ giải quyết',
       'so_vu_giai_quyet_dung_han': 'Số phát sinh: cộng; tử số tỷ lệ đúng hạn', 'so_vu_giai_quyet_qua_han': 'Số phát sinh: cộng', 'so_vu_dang_xu_ly_trong_han': 'Số tại thời điểm: lấy kỳ cuối',
       'so_vu_dang_xu_ly_qua_han': 'Số tại thời điểm: lấy kỳ cuối', 'so_vu_rut_don_dinh_chi': 'Số phát sinh: cộng', 'so_vu_phuc_tap_keo_dai': 'Số tại thời điểm: lấy kỳ cuối',
       'ty_le_giai_quyet_vu_viec': 'Số tỷ lệ đã nhập: hiện đúng số; đối chiếu IOC tính', 'ty_le_giai_quyet_dung_han': 'Số tỷ lệ đã nhập: hiện đúng số; đối chiếu IOC tính', 'ton_cuoi_ky': 'Số tại thời điểm: lấy kỳ cuối',
       'tinh_trang_xu_ly_tong_hop': 'Biểu đồ theo tình trạng xử lý'},
  chi=['Cộng «Số cuộc tiếp công dân», «Số lượt công dân», «Số đoàn đông người», «Số vụ việc tiếp nhận qua tiếp dân»',
       'Đơn thư: cộng «Tổng đơn thư tiếp nhận», «Đơn mới trong kỳ»; «Đơn kỳ trước chuyển sang» lấy kỳ đầu; đủ / không đủ điều kiện; thuộc / không thuộc thẩm quyền (đã chuyển, đã hướng dẫn)',
       'Cơ cấu 4 loại đơn: khiếu nại, tố cáo, kiến nghị/phản ánh, nhiều nội dung/khác',
       'Vụ việc: cộng «Số vụ việc thụ lý», «đã giải quyết», «giải quyết đúng hạn», «quá hạn», «rút đơn/đình chỉ»; «đang xử lý trong hạn/quá hạn», «phức tạp/kéo dài», «Tồn cuối kỳ» lấy kỳ cuối',
       'Tỷ lệ giải quyết vụ việc (IOC tính) = «Số vụ việc đã giải quyết» ÷ «Số vụ việc thụ lý» × 100; tỷ lệ giải quyết đúng hạn (IOC tính) = «Số vụ giải quyết đúng hạn» ÷ «Số vụ việc đã giải quyết» × 100; một bản ghi thì hiện đúng tỷ lệ đã nhập'],
  bieu=['Cơ cấu 4 loại đơn; thanh các bước xử lý đơn (tiếp nhận → đủ điều kiện → thuộc thẩm quyền)', 'Thanh vụ việc: thụ lý, đã giải quyết, đúng hạn, quá hạn, đang xử lý',
        'Lượt công dân, tổng đơn tiếp nhận qua các kỳ', 'Theo «Loại tiếp công dân chính», «Tình trạng xử lý tổng hợp»',
        'Theo 126 xã, phường: lượt công dân, tổng đơn, tỷ lệ giải quyết, tồn cuối kỳ'],
  kt=['Tỷ lệ đã nhập lệch IOC tính quá 0,1 điểm (cả hai tỷ lệ)', '«Số vụ giải quyết đúng hạn» + «quá hạn» khác «Số vụ việc đã giải quyết»',
      'Các quan hệ tổng – thành phần ở câu hỏi 6 (chỉ đánh dấu khi anh xác nhận quan hệ đúng)'],
  loi=['6 trường Số có dữ liệu mẫu là chữ "test" (Số vụ giải quyết đúng hạn, quá hạn, đang xử lý trong hạn, đang xử lý quá hạn, rút đơn/đình chỉ, phức tạp/kéo dài)',
       '«Quá hạn báo cáo (ngày)» kiểu Ngày tháng nhưng tên là số ngày', '«Kỳ báo cáo» có thêm "Đột xuất" (eform khác chỉ có Tháng/Quý/Năm)',
       'Bản «Chi tiết đơn thư», «Chi tiết vụ việc» không có trường nào mô tả một đơn, một vụ (số đơn, người gửi, nội dung) — chỉ có các trường số như bản Tổng hợp',
       'Dữ liệu mẫu không cân: tổng đơn 10 nhưng kỳ trước 52 + mới 10; tỷ lệ giải quyết 80,4 nhưng 12 ÷ 33 = 36,4%; «Địa bàn» "phường Cầu Giấy" chữ thường']),
]
TTRA_CAU = [
 '**Kiểm tra Chủ tịch UBND xã (eform 1), Thanh tra (eform 2): một cuộc nhập một lần hay nhập lại mỗi kỳ để cập nhật?** Và «Tỷ lệ thực hiện kiến nghị» (eform 1) tính trên mẫu số nào? '
 'Em đề xuất: coi như có thể nhập lại mỗi kỳ — số cuộc là số quyết định khác nhau; các số của cuộc (kiến nghị, đã/đang/quá hạn thực hiện, đã thu hồi) mỗi cuộc lấy bản gửi sau cùng trong kỳ xem rồi cộng (nhập một lần thì kết quả vẫn đúng). Tỷ lệ IOC tính = «Đã thực hiện kiến nghị» ÷ «Số kiến nghị xử lý» × 100.',
 '**Eform 1: «Loại bản ghi»** đang chép danh mục của eform Tiếp công dân. Em đề xuất: hiện đúng như nhập, chỉ dùng để bỏ bản «Không phát sinh» khỏi phần đếm; báo bên eform sửa danh mục.',
 '**«Cơ quan chủ trì kiểm tra» (eform 1), «Cơ quan chủ trì» (eform 2) là Có/Không** — nghĩa là "Thanh tra Thành phố chủ trì" hay gì khác? Em đề xuất: hiện đúng nhãn của eform, chỉ đếm cuộc theo Có/Không, không đặt tên khác.',
 '**Eform 2: bản «Theo dõi sau thanh tra»** là bản riêng của cùng cuộc (cùng «Số QĐ thanh tra») ghi số thu hồi cập nhật? «Giá trị đã thu hồi» là số trong kỳ hay lũy kế đến kỳ báo cáo? '
 'Em đề xuất: lũy kế của cuộc — mỗi cuộc lấy bản gửi sau cùng (cuộc thanh tra hoặc theo dõi) trong kỳ xem, không cộng các kỳ với nhau.',
 '**Eform 3: bản «Chi tiết đơn thư», «Chi tiết vụ việc»** dùng thế nào khi đã có bản «Tổng hợp»? Em đề xuất (giống eform Thu chi Quỹ của MTTQ): cùng địa bàn, kỳ có bản Tổng hợp thì chỉ dùng bản Tổng hợp; không có thì cộng các bản chi tiết. Không cộng chồng.',
 '**Eform 3: các quan hệ số** — em đề xuất đánh dấu bản ghi khi lệch các quan hệ sau, anh xác nhận quan hệ nào đúng: (a) «Tổng đơn thư tiếp nhận» = «Đơn kỳ trước chuyển sang» + «Đơn mới trong kỳ»; '
 '(b) «Tổng đơn» = «Đơn đủ điều kiện xử lý» + «Đơn không đủ điều kiện/lưu»; (c) «Đơn đủ điều kiện» = «Đơn thuộc thẩm quyền» + «không thuộc thẩm quyền đã chuyển» + «đã hướng dẫn»; '
 '(d) 4 loại đơn cộng lại = «Tổng đơn»; (e) «Số vụ việc thụ lý» = đã giải quyết + đang xử lý (trong hạn, quá hạn) + rút đơn/đình chỉ. Phân loại số (phát sinh / đầu kỳ / tại thời điểm) như dòng "Loại số" của eform 3.',
 '**Eform 3: kỳ «Đột xuất»** xếp vào kỳ nào? Em đề xuất: xếp theo «Ngày báo cáo» (vào tháng, quý, năm chứa ngày đó); thiếu ngày thì đánh dấu thiếu kỳ.',
 '**Chỉ tiêu cũ của Thanh tra** (3 chỉ tiêu dựng theo cấu hình cũ, số từ ttra-config.js) thay bằng 3 eform như trên; khai báo cũ giữ lại, tắt bằng cờ. Anh đồng ý?',
]

# ============================================================ CÔNG THƯƠNG
SCT = [
 dict(iok='Sở Công Thương → eform 1 (thẻ "Xuất khẩu, nhập khẩu")', ban_ghi='kim ngạch xuất, nhập khẩu của một doanh nghiệp/đơn vị tại một xã, phường trong một kỳ',
  khoa='«Tên doanh nghiệp/đơn vị XNK» + «Địa bàn» + kỳ', loai_so='Phát sinh trong kỳ: cộng khi xem kỳ dài hơn (câu hỏi 1)',
  vai={'dia_ban': DB, 'ten_doanh_nghiep': 'Khóa; chia cấp 2; đếm số doanh nghiệp', 'loai_hinh_doanh_nghiep': 'Mô tả dòng (chữ do đơn vị gõ)', 'nganh_hang_mat_hang_chinh': 'Biểu đồ kim ngạch theo ngành hàng (chữ do đơn vị gõ)',
       'loai_hinh_hoat_dong': 'Chia cấp 1 (Xuất khẩu / Nhập khẩu / Cả hai)', 'thi_truong_chinh': 'Biểu đồ kim ngạch theo thị trường (chữ do đơn vị gõ)',
       'kim_ngach_xuat_khau_usd': 'Số: cộng', 'kim_ngach_nhap_khau_usd': 'Số: cộng', 'tong_kim_ngach_xnk_usd': 'Số tổng đã nhập: cộng, hiện đúng số; đối chiếu XK + NK'},
  chi=['Cộng «Kim ngạch xuất khẩu (USD)», «Kim ngạch nhập khẩu (USD)», «Tổng kim ngạch XNK (USD)»', 'Cán cân xuất nhập khẩu (IOC tính) = «Kim ngạch xuất khẩu» − «Kim ngạch nhập khẩu»', 'Số doanh nghiệp = đếm «Tên doanh nghiệp/đơn vị XNK» khác nhau'],
  bieu=['Kim ngạch xuất khẩu theo «Ngành hàng/Mặt hàng chính», theo «Thị trường chính»', 'Cơ cấu doanh nghiệp theo «Loại hình hoạt động»', 'Kim ngạch xuất, nhập khẩu qua các kỳ', 'Theo 126 xã, phường: kim ngạch xuất khẩu, nhập khẩu, số doanh nghiệp'],
  kt=['«Tổng kim ngạch XNK» khác «Kim ngạch xuất khẩu» + «Kim ngạch nhập khẩu»', '«Loại hình hoạt động» = Xuất khẩu mà có kim ngạch nhập khẩu > 0 (và ngược lại)'],
  loi=['Đơn vị "USD" nhưng dữ liệu mẫu 32,5 — nhiều khả năng là nghìn hoặc triệu USD (câu hỏi 2)', 'Dữ liệu mẫu: tổng 32,6 nhưng 32,5 + 33,5 = 66; năm 2023', '«Ngành hàng», «Thị trường chính», «Loại hình doanh nghiệp» kiểu Chữ không danh mục — gõ khác nhau thì tách nhóm']),
 dict(iok='Sở Công Thương → eform 2 (thẻ "Bán lẻ hàng hóa, dịch vụ tiêu dùng")', ban_ghi='doanh thu của một cơ sở/doanh nghiệp kinh doanh tại một xã, phường trong một kỳ',
  khoa='«Tên cơ sở/doanh nghiệp kinh doanh» + «Địa bàn» + kỳ', loai_so='Phát sinh trong kỳ: cộng. «Doanh thu kỳ trước liền kề» là số đơn vị tự nhập để so sánh (câu hỏi 3)',
  vai={'dia_ban': DB, 'ten_co_so_doanh_nghiep': 'Khóa; chia cấp 2; đếm số cơ sở', 'loai_hinh_kinh_doanh': 'Chia cấp 1 (chữ do đơn vị gõ)', 'nganh_hang_linh_vuc_dich_vu_chinh': 'Biểu đồ theo ngành hàng (chữ do đơn vị gõ)',
       'doanh_thu_ban_le_hang_hoa_dong': 'Số: cộng; phần của tổng mức', 'doanh_thu_dich_vu_dong': 'Số: cộng; phần của tổng mức', 'tong_muc_ban_le_dv_tieu_dung_dong': 'Số tổng đã nhập: cộng; đối chiếu bán lẻ + dịch vụ',
       'doanh_thu_ky_truoc_lien_ke_dong': 'Số đã nhập: cộng; mẫu số tốc độ tăng (IOC tính)', 'toc_do_tang_ky_truoc_phan_tram': 'Số tỷ lệ đã nhập: hiện đúng số; đối chiếu IOC tính'},
  chi=['Cộng «Doanh thu bán lẻ hàng hóa», «Doanh thu dịch vụ», «Tổng mức bán lẻ & DV tiêu dùng», «Doanh thu kỳ trước liền kề» (đồng)',
       'Tốc độ tăng so với kỳ trước (IOC tính) = «Tổng mức bán lẻ & DV tiêu dùng» ÷ «Doanh thu kỳ trước liền kề» × 100 − 100; một cơ sở thì hiện đúng số đã nhập', 'Số cơ sở = đếm «Tên cơ sở» khác nhau'],
  bieu=['Cơ cấu tổng mức: bán lẻ hàng hóa – dịch vụ', 'Tổng mức theo «Loại hình kinh doanh», «Ngành hàng/Lĩnh vực dịch vụ chính»', 'Tổng mức qua các kỳ', 'Theo 126 xã, phường: tổng mức, số cơ sở'],
  kt=['«Tổng mức bán lẻ & DV tiêu dùng» khác bán lẻ + dịch vụ', '«Tốc độ tăng so với kỳ trước» lệch IOC tính quá 0,1 điểm'],
  loi=['Ghi "(đồng)" nhưng dữ liệu mẫu 99,3 — đơn vị thật? (câu hỏi 2)', 'Dữ liệu mẫu năm 2022; tổng 99,5 ≠ 99,3 + 99,4']),
 dict(iok='Sở Công Thương → eform 3 (thẻ "Thương mại điện tử")', ban_ghi='một chỉ tiêu chuyển đổi số («Mã chỉ tiêu con (CĐS)») theo một nhóm «Đối tượng thống kê» tại một xã, phường trong một kỳ',
  khoa='«Địa bàn» + «Mã chỉ tiêu con (CĐS)» + «Đối tượng thống kê» + kỳ', loai_so='Tại thời điểm (số đối tượng, số đạt): mỗi khóa lấy kỳ cuối (câu hỏi 4)',
  vai={'dia_ban': DB, 'ma_chi_tieu_con_cds': 'Chia cấp 1 (6 chỉ tiêu 34–39)', 'doi_tuong_thong_ke': 'Chia cấp 2 (6 nhóm đối tượng)', 'tong_so_doi_tuong': 'Số tại thời điểm: mẫu số của tỷ lệ',
       'so_doi_tuong_dat': 'Số tại thời điểm: tử số của tỷ lệ', 'ty_le_dat_phan_tram': 'Số tỷ lệ đã nhập: hiện đúng số; đối chiếu IOC tính', 'nen_tang_so_hinh_thuc_ap_dung': 'Mô tả dòng'},
  chi=['Theo từng «Mã chỉ tiêu con (CĐS)» × «Đối tượng thống kê»: cộng «Tổng số đối tượng», «Số đối tượng đạt»', 'Tỷ lệ đạt (IOC tính) = «Số đối tượng đạt» ÷ «Tổng số đối tượng» × 100; một bản ghi thì hiện đúng «Tỷ lệ đạt (%)» đã nhập'],
  bieu=['Tỷ lệ đạt theo từng mã chỉ tiêu', 'Bảng nhiều cấp «Mã chỉ tiêu con» › «Đối tượng thống kê»', 'Tỷ lệ đạt qua các kỳ', 'Theo 126 xã, phường: tỷ lệ đạt'],
  kt=['«Số đối tượng đạt» lớn hơn «Tổng số đối tượng»', '«Tỷ lệ đạt (%)» lệch IOC tính quá 0,1 điểm'],
  loi=['Danh mục «Mã chỉ tiêu con (CĐS)» chỉ có số "34.0"…"39.0", không có tên chỉ tiêu (câu hỏi 4)', 'Dữ liệu mẫu số đối tượng 44,5 (số lẻ); năm 2023']),
 dict(iok='Sở Công Thương → eform 4 (thẻ "Điện năng, xăng dầu, than")', ban_ghi='sản lượng một mặt hàng của một đơn vị cung ứng/kinh doanh tại một xã, phường trong một kỳ',
  khoa='«Địa bàn» + «Tên đơn vị cung ứng/kinh doanh» + «Loại mặt hàng» + kỳ', loai_so='Phát sinh trong kỳ: cộng; không cộng khác «Đơn vị tính»',
  vai={'dia_ban': DB, 'ma_chi_tieu_qd4795': 'Mô tả (đối chiếu với loại mặt hàng — câu hỏi 5)', 'loai_mat_hang': 'Chia cấp 1 (Điện năng / Xăng dầu / Than)', 'ten_don_vi_cung_ung': 'Khóa; mô tả dòng',
       'loai_hinh_don_vi': 'Chia cấp 3; biểu đồ theo loại hình đơn vị', 'san_luong_trong_ky': 'Số phát sinh: cộng theo đơn vị tính', 'don_vi_tinh': 'Chia cấp 2: không cộng khác đơn vị tính'},
  chi=['Sản lượng điện năng (kWh), xăng dầu (lít, m³), than (tấn) = cộng «Sản lượng trong kỳ» theo «Loại mặt hàng» × «Đơn vị tính»', 'Số đơn vị cung ứng = đếm «Tên đơn vị cung ứng/kinh doanh» khác nhau'],
  bieu=['Sản lượng theo «Loại hình đơn vị» (từng mặt hàng)', 'Bảng nhiều cấp «Loại mặt hàng» › «Đơn vị tính» › «Loại hình đơn vị»', 'Sản lượng điện năng qua các kỳ', 'Theo 126 xã, phường: sản lượng điện năng'],
  kt=['«Đơn vị tính» không hợp «Loại mặt hàng» (Điện năng mà không phải kWh; Than mà không phải Tấn)', '«Mã chỉ tiêu QĐ4795» không khớp «Loại mặt hàng» (khi anh xác nhận cách khớp ở câu hỏi 5)'],
  loi=['«Mã chỉ tiêu QĐ4795» chỉ có số 14, 15, 16, không có tên', 'Dữ liệu mẫu năm 2022']),
 dict(iok='Sở Công Thương → eform 5 (thẻ "Chỉ số sản xuất công nghiệp")', ban_ghi='giá trị sản xuất công nghiệp của một doanh nghiệp/cơ sở tại một xã, phường trong một kỳ',
  khoa='«Tên doanh nghiệp/cơ sở sản xuất» + «Địa bàn» + kỳ', loai_so='Phát sinh trong kỳ: cộng. «Chỉ số IIP so với kỳ trước» là số đã nhập của từng doanh nghiệp, không cộng',
  vai={'dia_ban': DB, 'ten_doanh_nghiep_co_so': 'Khóa; chia cấp 2; đếm số doanh nghiệp', 'nganh_cong_nghiep_vsic': 'Chia cấp 1 (5 ngành)', 'gia_tri_sx_ky_nay_dong': 'Số: cộng; tử số so sánh',
       'gia_tri_sx_ky_truoc_dong': 'Số: cộng; mẫu số so sánh', 'chi_so_iip_ky_truoc_phan_tram': 'Số chỉ số đã nhập: hiện đúng số khi một doanh nghiệp; đối chiếu kỳ này ÷ kỳ trước'},
  chi=['Cộng «Giá trị sản xuất công nghiệp kỳ này», «kỳ trước» (đồng)', 'Giá trị sản xuất kỳ này so kỳ trước (IOC tính) = cộng kỳ này ÷ cộng kỳ trước × 100 — **không gọi là IIP** vì IIP cần quyền số ngành (câu hỏi 6)',
       '«Chỉ số IIP so với kỳ trước (%)» đã nhập: hiện đúng số của từng doanh nghiệp', 'Số doanh nghiệp = đếm «Tên doanh nghiệp/cơ sở sản xuất» khác nhau'],
  bieu=['Giá trị sản xuất kỳ này theo «Ngành công nghiệp (VSIC)»', 'Bảng nhiều cấp «Ngành công nghiệp» › «Tên doanh nghiệp»', 'Giá trị sản xuất qua các kỳ', 'Theo 126 xã, phường: giá trị sản xuất, số doanh nghiệp'],
  kt=['«Chỉ số IIP so với kỳ trước(%)» lệch «kỳ này» ÷ «kỳ trước» × 100 quá 0,1 điểm (khi anh xác nhận ở câu hỏi 6)'],
  loi=['Ghi "(đồng)" nhưng dữ liệu mẫu 123,4', 'Dữ liệu mẫu năm 2021; chỉ số IIP mẫu 123,6 nhưng 123,4 ÷ 123,5 × 100 = 99,9']),
]
SCT_CAU = [
 '**Kim ngạch, doanh thu, sản lượng trong eform** là số **trong kỳ** (tháng, quý) hay **lũy kế từ đầu năm**? Em đề xuất: trong kỳ — xem quý, năm thì cộng các tháng.',
 '**Đơn vị tiền**: eform ghi "USD", "đồng" nhưng dữ liệu mẫu là 32,5, 99,3, 123,4. Em đề xuất: hiện đúng đơn vị ghi ở tên trường (USD, đồng), không tự đổi; báo bên eform kiểm tra lại đơn vị.',
 '**Bán lẻ (eform 2): «Doanh thu kỳ trước liền kề»** là kỳ trước của «Tổng mức bán lẻ & DV tiêu dùng»? Em đề xuất: đúng vậy — tốc độ tăng IOC tính = Tổng mức ÷ Doanh thu kỳ trước liền kề × 100 − 100. Ngoài ra màn hình vẫn so với kỳ trước bằng bản ghi của kỳ trước (như mọi eform).',
 '**Thương mại điện tử (eform 3): mã 34–39** là các chỉ số chuyển đổi số nào? Danh mục chỉ có số. Em đề xuất: hiện đúng như danh mục ("34", "35"…), kèm nhóm đối tượng; báo bên eform bổ sung tên chỉ số. Số đối tượng, số đạt là số tại thời điểm (xem quý lấy tháng cuối).',
 '**Điện, xăng dầu, than (eform 4): «Mã chỉ tiêu QĐ4795» 14, 15, 16** có phải lần lượt Điện năng, Xăng dầu, Than không? Em đề xuất: chưa dùng mã để tính, chỉ chia theo «Loại mặt hàng»; anh xác nhận thì thêm kiểm tra mã khớp mặt hàng.',
 '**IIP (eform 5)**: IOC không tự tính chỉ số IIP gộp (cần quyền số). Em đề xuất: hiện «Chỉ số IIP» đã nhập của từng doanh nghiệp; số gộp là "Giá trị sản xuất kỳ này so kỳ trước (IOC tính)". Anh đồng ý tên gọi này?',
 '**Chỉ tiêu cũ của Sở Công Thương** (5 chỉ tiêu dựng theo cấu hình cũ, có số "cùng kỳ" lấy từ sct-config.js) thay bằng 5 eform như trên; khai báo cũ giữ lại, tắt bằng cờ. Anh đồng ý?',
]

# ============================================================ NỘI VỤ
SNV = [
 dict(iok='Sở Nội vụ → eform 1 (thẻ "Bảo hiểm xã hội, y tế, thất nghiệp")', ban_ghi='một chỉ tiêu QĐ4795 (27–31) của một xã, phường (có thể đến thôn/TDP) trong một kỳ',
  khoa='«Địa bàn» + «Thôn/TDP» (được để trống) + «Mã chỉ tiêu QĐ4795» + «Đối tượng/Nội dung» (được để trống) + kỳ', loai_so='Mã 27, 28 (tỷ lệ tham gia): tại thời điểm — lấy kỳ cuối. Mã 29, 30, 31 (người hưởng, thu, chi): phát sinh — cộng (câu hỏi 1)',
  vai={'thon_tdp': 'Khóa (được để trống); mô tả dòng', 'ma_chi_tieu_qd4795': 'Chia cấp 1 (5 chỉ tiêu 27–31)', 'ten_chi_tieu': 'Mô tả dòng (chữ do đơn vị gõ)', 'doi_tuong_noi_dung': 'Khóa (được để trống); chia cấp 3',
       'tong_so_doi_tuong': 'Số: mẫu số của tỷ lệ; cộng theo đơn vị tính', 'so_doi_tuong_dat': 'Số: tử số của tỷ lệ; cộng theo đơn vị tính', 'ty_le_phan_tram': 'Số tỷ lệ đã nhập: hiện đúng số; đối chiếu IOC tính',
       'don_vi_tinh': 'Chia cấp 2: không cộng khác đơn vị tính (chữ do đơn vị gõ)', 'dia_ban': DB},
  chi=['Theo từng «Mã chỉ tiêu QĐ4795» × «Đơn vị tính»: cộng «Tổng số đối tượng», «Số đối tượng đạt»',
       'Tỷ lệ tham gia BHTN (mã 27), BHXH (mã 28) (IOC tính) = «Số đối tượng đạt» ÷ «Tổng số đối tượng» × 100; một bản ghi thì hiện đúng «Tỷ lệ (%)» đã nhập',
       'Mã 29, 30, 31: số đã nhập ở trường nào là số người hưởng, số thu, số chi — chờ câu hỏi 1'],
  bieu=['Tỷ lệ tham gia BHTN, BHXH', 'Bảng nhiều cấp «Mã chỉ tiêu QĐ4795» › «Đơn vị tính» › «Đối tượng/Nội dung»', 'Tỷ lệ tham gia BHXH qua các kỳ', 'Theo 126 xã, phường: tỷ lệ tham gia BHTN, BHXH'],
  kt=['«Số đối tượng đạt» lớn hơn «Tổng số đối tượng» (mã 27, 28)', '«Tỷ lệ (%)» lệch IOC tính quá 0,1 điểm (sau khi chốt cách nhập tỷ lệ — câu hỏi 2)'],
  loi=['Tên eform "bảo hểm" (thiếu chữ "i")', 'Dữ liệu mẫu «Kỳ báo cáo» "3.0" không có trong danh mục', '«Tỷ lệ (%)» mẫu 0,5 với 5/10 — nhập dạng 0,5 hay 50?',
       '«Tên chỉ tiêu», «Đối tượng/Nội dung», «Đơn vị tính» mẫu để trống; «Đơn vị tính» kiểu Chữ không danh mục', '«Địa bàn» nằm cuối eform (các eform khác để đầu) — không ảnh hưởng IOC']),
 dict(iok='Sở Nội vụ → eform 2 (thẻ "Lao động, công chức, viên chức")', ban_ghi='số liệu lao động, công chức, viên chức của một xã, phường trong một kỳ',
  khoa='«Địa bàn» + kỳ', loai_so='Tại thời điểm (lấy kỳ cuối): lực lượng lao động, lao động đạt, đơn vị có chuyên trách, biên chế (3 trường), lao động nước ngoài làm việc tại địa phương. Phát sinh (cộng): tuyển mới, nghỉ hưu, thôi việc, chuyển công tác, lao động đi nước ngoài. Bồi dưỡng kỹ năng số, chữ ký số: chờ câu hỏi 3',
  vai={'dia_ban': DB, 'tong_luc_luong_lao_dong': 'Số tại thời điểm; mẫu số tỷ lệ lao động đạt', 'so_lao_dong_dat': 'Số tại thời điểm; tử số tỷ lệ (nghĩa "đạt" chưa rõ — câu hỏi 4)',
       'don_vi_co_cbccvc_chuyen_trach_cds': 'Số tại thời điểm: cộng', 'don_vi_co_cbccvc_chuyen_trach_antt_mang': 'Số tại thời điểm: cộng',
       'tong_cbccvc_boi_duong_ky_nang_so': 'Số: mẫu số tỷ lệ kỹ năng số', 'so_cbccvc_boi_duong_ky_nang_so_dat': 'Số: tử số tỷ lệ kỹ năng số', 'tong_cbccvc_cap_chu_ky_so': 'Số: mẫu số tỷ lệ chữ ký số',
       'so_cbccvc_cap_chu_ky_so_dat': 'Số: tử số tỷ lệ chữ ký số', 'lao_dong_viet_nam_di_nuoc_ngoai': 'Số phát sinh: cộng', 'lao_dong_nuoc_ngoai': 'Số tại thời điểm',
       'bien_che_huong_luong': 'Số tại thời điểm', 'bien_che_duoc_giao': 'Số tại thời điểm; so với thực hiện', 'bien_che_thuc_hien': 'Số tại thời điểm; so với được giao',
       'so_tuyen_moi': 'Số phát sinh: cộng', 'so_nghi_huu': 'Số phát sinh: cộng', 'thoi_viec': 'Số phát sinh: cộng', 'chuyen_cong_tac': 'Số phát sinh: cộng'},
  chi=['Lao động: «Tổng lực lượng lao động trên địa bàn», «Số lao động đạt»; tỷ lệ (IOC tính) = đạt ÷ tổng × 100', 'Đơn vị có CBCCVC chuyên trách chuyển đổi số, an toàn thông tin mạng',
       'Tỷ lệ CBCCVC bồi dưỡng kỹ năng số đạt (IOC tính) = «… đạt» ÷ «Tổng … được bồi dưỡng» × 100; tỷ lệ chữ ký số (IOC tính) = «Số … đạt» ÷ «Tổng … được cấp» × 100',
       'Lao động Việt Nam đi làm việc ở nước ngoài; lao động nước ngoài làm việc tại địa phương',
       'Biên chế: hưởng lương, được giao, thực hiện; biên chế còn thiếu (IOC tính) = «Biên chế được giao» − «Biên chế thực hiện»', 'Biến động: tuyển mới, nghỉ hưu, thôi việc, chuyển công tác'],
  bieu=['Thanh 3 tỷ lệ (IOC tính): lao động đạt, kỹ năng số, chữ ký số', 'Thanh biến động: tuyển mới – nghỉ hưu – thôi việc – chuyển công tác', 'Biên chế được giao – thực hiện', 'Lực lượng lao động qua các kỳ',
        'Theo 126 xã, phường: lực lượng lao động, biên chế thực hiện, tỷ lệ chữ ký số'],
  kt=['Số "đạt" lớn hơn số "tổng" tương ứng (lao động, kỹ năng số, chữ ký số)', '«Biên chế thực hiện» lớn hơn «Biên chế được giao»'],
  loi=['Thứ tự trường lẫn: 8 trường số đứng trước «Kỳ báo cáo», «Địa bàn» đứng cuối — không ảnh hưởng IOC', 'Mọi dữ liệu mẫu là 1 (không đối chiếu được)',
       'Tên trường "Tổng CBCCVC được cấp chữ ký số" và "Số CBCCVC được cấp … đạt" — chưa rõ "tổng" là số thuộc diện được cấp hay số đã cấp (câu hỏi 3)']),
]
SNV_CAU = [
 '**BHXH (eform 1): mã 29 (Số người hưởng), 30 (Thu), 31 (Chi)** nhập vào trường nào? Eform chỉ có «Tổng số đối tượng», «Số đối tượng đạt», «Tỷ lệ (%)», «Đơn vị tính». '
 'Em đề xuất: số người hưởng, số thu, số chi nhập ở «Tổng số đối tượng» kèm «Đơn vị tính» (người, triệu đồng…); IOC cộng theo từng đơn vị tính, không tính tỷ lệ cho 3 mã này.',
 '**«Tỷ lệ (%)» (eform 1)** nhập dạng 50 hay 0,5? Mẫu ghi 0,5 với 5/10. Em đề xuất: hiện đúng số đã nhập; chỉ đánh dấu lệch khi số đã nhập khác cả hai cách (50 và 0,5).',
 '**Lao động, CCVC (eform 2): «Tổng CBCCVC được bồi dưỡng/được cấp chữ ký số» và «Số … đạt»** là gì so với nhau (tổng = số thuộc diện, đạt = số đã được)? Là số trong kỳ hay lũy kế? '
 'Em đề xuất: tổng = số thuộc diện, đạt = số đã được, đều là số tại thời điểm (xem quý lấy tháng cuối); tỷ lệ IOC tính = đạt ÷ tổng.',
 '**«Số lao động đạt trên địa bàn»** — "đạt" nghĩa là gì (có việc làm? qua đào tạo? có kỹ năng số?)? Em đề xuất: hiện đúng tên trường, tỷ lệ ghi "Lao động đạt so tổng lực lượng lao động (IOC tính)", không đặt tên khác.',
 '**Chỉ tiêu cũ của Sở Nội vụ**: 4 chỉ tiêu theo cấu hình cũ thay bằng 2 eform; **5 chỉ tiêu nguồn File** (doanh nghiệp tham gia tuyển dụng, nhu cầu tuyển dụng, tìm việc, chi trả an sinh người có công, công chức viên chức khối chính quyền) **ẩn bằng cờ, không xóa** (quy ước 6). Anh đồng ý?',
]

# ============================================================ NN&MT
NN = {
 'nnmt1': ('Tỷ lệ xã đạt chuẩn nông thôn mới', 'số xã đạt chuẩn? (câu hỏi 1)', 'Chữ, không danh mục'),
 'nnmt2': ('Diện tích rừng bị thiệt hại', 'ha?', 'Bị chặt phá / Bị cháy / Nguyên nhân khác'),
 'nnmt3': ('Diện tích rừng trồng mới tập trung', 'ha?', 'Rừng phòng hộ / sản xuất / đặc dụng / Cây phân tán'),
 'nnmt4': ('CTMTQG xây dựng nông thôn mới', 'triệu đồng? (vốn theo nguồn)', 'NSTW / NSĐP / Tín dụng / Doanh nghiệp / Đóng góp người dân / Nguồn khác'),
 'nnmt5': ('CTMTQG giảm nghèo bền vững', 'chưa rõ', 'Chữ, không danh mục'),
 'nnmt6': ('Khí tượng thủy văn', 'chưa rõ (số bản tin? số trạm?)', 'Số liệu quan trắc / Bản tin dự báo / Cảnh báo thiên tai'),
 'nnmt7': ('Công trình phòng chống thiên tai', 'công trình?', 'Hồ chứa thủy lợi / Thủy điện / Đê điều / Sạt lở bờ sông / Điểm úng ngập'),
 'nnmt8': ('Hộ/người được hỗ trợ lương thực', 'hộ hay người?', 'Thiên tai / Hỏa hoạn / Giáp hạt / Bất khả kháng khác'),
 'nnmt9': ('Tổng số gạo hỗ trợ', 'tấn hay kg?', 'Thiên tai / Hỏa hoạn / Giáp hạt / Bất khả kháng khác / Dự trữ, khẩn cấp'),
 'nnmt10': ('Bản đồ và ảnh viễn thám', 'chưa rõ (số bản đồ? số lớp?)', 'Bản đồ rủi ro thiên tai / sạt lở / ngập lụt / Ảnh vệ tinh / Lớp GIS khác'),
}
NNMT = []
for e in KH['nnmt']['eforms']:
    ten, dvt, pt = NN[e['id']]
    F = {f['c'] for f in e['fields']}
    c9 = 'ten_noi_dung_du_an_su_kien' if 'ten_noi_dung_du_an_su_kien' in F else 'ten_noi_dung_du_an_s'
    c11 = [f['c'] for f in e['fields']][10]
    loi = []
    if e['id'] == 'nnmt2': loi.append('Mã trường «Kế hoạch/chuẩn tham chiếu» là "assignees" (các eform khác là "ke_hoach_chuan_tham_chieu")')
    if e['id'] == 'nnmt5': loi.append('Mã trường bị cắt cụt: "ten_noi_dung_du_an_s", "ke_hoach_chuan_tham"')
    if e['id'] in ('nnmt1', 'nnmt5'): loi.append('«Phân tổ/loại dữ liệu» kiểu Chữ không danh mục (các eform NN&MT khác có danh mục)')
    if e['id'] == 'nnmt1': loi.append('Dữ liệu mẫu «Tên nội dung» "Sợ kiện test"; năm 2023')
    NNMT.append(dict(iok=f'Sở NN&MT → eform {len(NNMT) + 1} (thẻ "{ten}")',
      ban_ghi='một nội dung/dự án/sự kiện («Tên nội dung/dự án/sự kiện») theo một «Phân tổ/loại dữ liệu» tại một xã, phường (có thể đến thôn/TDP) trong một kỳ',
      khoa='«Địa bàn» + «Thôn/TDP» (được để trống) + «Phân tổ/loại dữ liệu» + «Tên nội dung/dự án/sự kiện» (được để trống) + kỳ',
      loai_so=f'«Giá trị kỳ này»: phát sinh, cộng. «Giá trị lũy kế»: lấy kỳ cuối. «Cùng kỳ/chuẩn so sánh», «Tỷ lệ/tiến độ», «Chênh lệch»: số đã nhập. Đơn vị của giá trị: **{dvt}** — eform không có trường đơn vị tính (câu hỏi 1)',
      vai={'ngay_bao_cao': 'Mô tả (ngày đơn vị báo cáo)', 'dia_ban': DB, 'thon_tdp': 'Khóa (được để trống); mô tả dòng', 'phan_to_loai_du_lieu': f'Chia cấp 1 ({pt}); biểu đồ',
           c9: 'Khóa (được để trống); chia cấp 2', 'don_vi_chu_tri_phoi_hop': 'Mô tả dòng', 'gia_tri_ky_nay': 'Số phát sinh: cộng', 'gia_tri_luy_ke': 'Số lũy kế: mỗi khóa lấy kỳ cuối rồi cộng',
           'cung_ky_chuan_so_sanh': 'Số đã nhập: cộng (cùng kỳ của «Giá trị kỳ này» — câu hỏi 2)', 'ty_le_tien_do_tu_tinh': 'Số tỷ lệ đã nhập: hiện đúng số khi một bản ghi (không gộp)',
           'chenh_lech_ky_nay_cung_ky': 'Số đã nhập: cộng; đối chiếu kỳ này − cùng kỳ', 'trang_thai_trien_khai': 'Đếm nội dung theo trạng thái; biểu đồ', 'vuong_mac_nguyen_nhan': 'Kiểm tra: chậm, đình trệ mà không ghi vướng mắc'},
      chi=['Cộng «Giá trị kỳ này» theo «Phân tổ/loại dữ liệu»; «Giá trị lũy kế» lấy kỳ cuối; cộng «Cùng kỳ/chuẩn so sánh», «Chênh lệch kỳ này-cùng kỳ»',
           'Số nội dung = đếm bản ghi (bỏ «Không phát sinh»); nội dung theo «Trạng thái triển khai»; số nội dung chậm tiến độ, đình trệ, cần xử lý',
           '«Tỷ lệ/tiến độ» đã nhập: hiện đúng số khi dòng là một bản ghi; dòng gộp nhiều bản ghi xem ở Dữ liệu đã nhập (không tự tính thay — câu hỏi 2)'],
      bieu=['Giá trị kỳ này theo «Phân tổ/loại dữ liệu»', 'Cơ cấu nội dung theo «Trạng thái triển khai»', 'Giá trị kỳ này qua các kỳ', 'Bảng nhiều cấp «Phân tổ/loại dữ liệu» › «Tên nội dung/dự án/sự kiện»',
            'Theo 126 xã, phường: giá trị kỳ này, số nội dung chậm tiến độ'],
      kt=['«Chênh lệch kỳ này-cùng kỳ» khác «Giá trị kỳ này» − «Cùng kỳ/chuẩn so sánh»', '«Giá trị lũy kế» nhỏ hơn «Giá trị kỳ này»',
          '«Trạng thái triển khai» là Chậm tiến độ / Đình trệ / Cần xử lý mà để trống «Vướng mắc/Nguyên nhân»'],
      loi=loi + ['Không có trường đơn vị tính cho «Giá trị kỳ này», «Giá trị lũy kế»', 'Mã trường «Tỷ lệ/tiến độ» là "ty_le_tien_do_tu_tinh" (tự tính?) nhưng là ô nhập']))
NNMT_CAU = [
 '**Đơn vị của «Giá trị kỳ này», «Giá trị lũy kế» ở từng eform** (eform không có trường đơn vị tính). Em đoán: nông thôn mới — số xã; rừng bị thiệt hại, rừng trồng mới — ha; 2 chương trình MTQG — triệu đồng; '
 'công trình phòng chống thiên tai — công trình; hỗ trợ lương thực — ? (hộ hay người); gạo — tấn; khí tượng thủy văn, bản đồ viễn thám — chưa đoán được. '
 'Em đề xuất: **không ghi đơn vị** cho tới khi anh hoặc Sở xác nhận (hiện "giá trị như đã nhập"), và báo bên eform thêm trường «Đơn vị tính». Anh xác nhận được đơn vị nào thì em ghi đơn vị đó.',
 '**«Cùng kỳ/chuẩn so sánh», «Tỷ lệ/tiến độ», «Chênh lệch»** là số đơn vị tự nhập. Em đề xuất: hiện đúng như nhập; không tự tính tỷ lệ gộp (không biết mẫu số là cùng kỳ hay kế hoạch); chỉ đối chiếu «Chênh lệch» = kỳ này − cùng kỳ. Màn hình vẫn so với kỳ trước bằng bản ghi kỳ trước như mọi eform.',
 '**Eform «Tỷ lệ xã đạt chuẩn nông thôn mới»**: tỷ lệ xã đạt chuẩn có nhập ở «Tỷ lệ/tiến độ» không, hay IOC phải tính = số xã đạt ÷ tổng số xã? Em đề xuất: hiện đúng «Tỷ lệ/tiến độ» đã nhập, **không** tự lấy 126 xã làm mẫu số (quy ước không dùng số ngoài eform).',
 '**Hiện 10 eform thế nào**: em đề xuất Sở NN&MT là một đơn vị, 10 eform là 10 thẻ (mỗi thẻ một màn đủ biểu đồ, bảng, 126 xã), như Văn phòng UBND. Anh muốn gom thành nhóm (Nông thôn mới – giảm nghèo; Rừng; Thiên tai – khí tượng – bản đồ; Hỗ trợ lương thực) thì em thêm một cấp nhóm.',
 '**Chỉ tiêu cũ của Sở NN&MT**: 10 chỉ tiêu theo cấu hình cũ thay bằng 10 eform; **2 chỉ tiêu nguồn File** (Tổng hợp dữ liệu GPMB, Thống kê tình hình sử dụng đất đai) **ẩn bằng cờ, không xóa** (quy ước 6). Anh đồng ý?',
]

if __name__ == '__main__':
    gen(os.path.join(OUTD, 'SO_THANH_TRA_2026_10_28.md'), '# BẢN ĐỌC EFORM — THANH TRA THÀNH PHỐ (3 eform)',
        HEAD('sheet "Thanh Tra TP" của "File mô tả đầu vào eform"', 'Sở, ngành → Thanh tra Thành phố → 3 eform (mỗi eform một thẻ) → Nhóm → Dòng số liệu → Bản ghi. Cả 3 eform có «Địa bàn» (126 xã, phường) nên có màn «Theo 126 xã, phường».',
             '3 chỉ tiêu dựng theo cấu hình cũ (ttra-config.js) thay bằng eform; khai báo cũ tắt bằng cờ, không xóa.'), 'ttra', TTRA, TTRA_CAU)
    gen(os.path.join(OUTD, 'SO_CONG_THUONG_2026_10_28.md'), '# BẢN ĐỌC EFORM — SỞ CÔNG THƯƠNG (5 eform)',
        HEAD('sheet "Sở Công thương" của "File mô tả đầu vào eform"', 'Sở, ngành → Sở Công Thương → 5 eform (mỗi eform một thẻ) → Nhóm → Dòng số liệu → Bản ghi. Cả 5 eform có «Địa bàn» nên có màn «Theo 126 xã, phường».',
             '5 chỉ tiêu dựng theo cấu hình cũ (sct-config.js, có số "cùng kỳ" ngoài eform) thay bằng eform; khai báo cũ tắt bằng cờ, không xóa.'), 'sct', SCT, SCT_CAU)
    gen(os.path.join(OUTD, 'SO_NOI_VU_2026_10_28.md'), '# BẢN ĐỌC EFORM — SỞ NỘI VỤ (2 eform)',
        HEAD('sheet "Sở Nội vụ" của "File mô tả đầu vào eform"', 'Sở, ngành → Sở Nội vụ → 2 eform (mỗi eform một thẻ) → Nhóm → Dòng số liệu → Bản ghi. Cả 2 eform có «Địa bàn» nên có màn «Theo 126 xã, phường».',
             '4 chỉ tiêu theo cấu hình cũ thay bằng eform; 5 chỉ tiêu nguồn File ẩn bằng cờ, không xóa (câu hỏi 5).'), 'snv', SNV, SNV_CAU)
    gen(os.path.join(OUTD, 'SO_NNMT_2026_10_28.md'), '# BẢN ĐỌC EFORM — SỞ NÔNG NGHIỆP VÀ MÔI TRƯỜNG (10 eform)',
        HEAD('sheet "Sở NNMT" của "File mô tả đầu vào eform"', 'Sở, ngành → Sở NN&MT → 10 eform (mỗi eform một thẻ — câu hỏi 4) → Nhóm → Dòng số liệu → Bản ghi. Cả 10 eform có «Địa bàn» nên có màn «Theo 126 xã, phường».',
             '10 chỉ tiêu theo cấu hình cũ thay bằng eform; 2 chỉ tiêu nguồn File ẩn bằng cờ, không xóa (câu hỏi 5).'), 'nnmt', NNMT, NNMT_CAU,
        them=['**Bổ sung (28/10/2026) — câu 1, đơn vị:** anh không có thông tin của Sở nên giao em ghi theo đoán. Đã ghi: nông thôn mới — xã; rừng bị thiệt hại, rừng trồng mới — ha; '
              '2 chương trình MTQG — triệu đồng; công trình phòng chống thiên tai — công trình; hỗ trợ lương thực — hộ; gạo — tấn. Khí tượng thủy văn, bản đồ và ảnh viễn thám: chưa đoán được, để số trơn. '
              'Màn hình ghi rõ đơn vị là IOC tạm ghi, Sở chưa xác nhận; bên eform nên thêm trường «Đơn vị tính».'],
        chung=['**10 eform dùng chung một mẫu 18 trường**, chỉ khác danh mục «Phân tổ/loại dữ liệu» (và vài mã trường). Cách hiểu, chỉ tiêu, biểu đồ giống nhau cho cả 10; '
               'bảng trường của từng eform vẫn ghi đủ để đối chiếu.'])
