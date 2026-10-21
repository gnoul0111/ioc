# -*- coding: utf-8 -*-
"""Sinh docs/STC_SoTaiChinh/STC_DOI_CHIEU_API_24_CHI_TIEU.docx + .md — đối chiếu 14 API báo cáo của Sở Tài chính Hà Nội
với 24 eform chỉ tiêu thuộc nhóm Sở Tài chính (QĐ 4795, QĐ 5279): API hiện có đáp ứng được yêu cầu nào của từng chỉ tiêu.
Chỉ kiểm dữ liệu API, KHÔNG liên quan bộ chỉ tiêu đang hiện trên IOC. Cùng khuôn với tools/sgd_doi_chieu_api_docx.py.
Chạy từ thư mục gốc ioc:  python tools/stc_doi_chieu_api_docx.py
- Danh sách API: bộ Postman "SoTC_Hanoi" (thư mục cha của ioc).
- Số liệu API: bản chụp js/data/stc-snapshot.js (lấy ngày 18/09/2026, quý I/2026), đọc qua node nên luôn khớp.
- Yêu cầu từng chỉ tiêu: chép từ 24 file eform trên Google Drive (sheet hướng dẫn và sheet mapping QĐ), 19/10/2026.
Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PM = os.path.join(os.path.dirname(ROOT), 'SoTC_Hanoi.postman_collection.json')
OUT = os.path.join(ROOT, 'docs', 'STC_SoTaiChinh', 'STC_DOI_CHIEU_API_24_CHI_TIEU.docx')

# ---------------- API: danh sách (Postman) + số liệu (bản chụp) ----------------
API_NAME = {}
for it in json.load(open(PM, encoding='utf-8'))['item']:
    u = it['request']['url']; raw = u if isinstance(u, str) else u.get('raw', '')
    if '/receive-request/' in raw:
        code = raw.split('/receive-request/')[1].split('/')[0]
        API_NAME[code] = it['name'].split(' ', 2)[-1].split(' (')[0]
_JS = ("global.window={};require('./js/data/stc-snapshot.js');const p=window.STC_SNAPSHOT.periods['2026-1'];"
       "process.stdout.write(JSON.stringify({src:p.source,data:p.data}))")
_S = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))
SNAP, SNAP_SRC = _S['data'], _S['src']
N_API = len(API_NAME)
CO_SO = [k for k, rows in SNAP.items() if any(r.get('giaTri') not in (None, 0, '') for r in rows)]
def loai(code): return list(dict.fromkeys(r['loai'] for r in SNAP[code]))
def chitieu(code): return list(dict.fromkeys(r['chiTieu'] for r in SNAP[code]))
def nd(code): return API_NAME.get(code, code)
DA = {r['loai']: r['giaTri'] for r in SNAP['DA_TRONG_DIEM']}

CO, MOT_PHAN, KHONG = 'Đáp ứng', 'Một phần', 'Không'
RED_FILL = 'FBE9E7'
KY_API = ('Kỳ báo cáo', KHONG, 'Tham số năm, quý', 'API chỉ lấy được theo **quý**; không có số theo ngày, tháng.')
KY_API_QUY = ('Kỳ báo cáo', MOT_PHAN, 'Tham số năm, quý', 'Có số theo quý; không có số theo tháng.')
DB_API = ('Địa bàn phường/xã (lớp dữ liệu của eform)', KHONG, '—', 'API chỉ có **số toàn Thành phố**; số theo phường/xã vẫn phải lấy từ eform.')
def khong_api(*yc):
    return [(y, KHONG, '—', 'Không có API.') for y in yc]

# ---------------- 24 chỉ tiêu (theo 24 file eform) ----------------
# nhom, ten, can_cu, dau_moi, ky, file, api, ket_luan, [(yêu cầu, mức, API/trường, ghi chú)]
CT = [
    # ===== Ngân sách nhà nước
    dict(nhom='Ngân sách nhà nước', ten='Thu ngân sách nhà nước', cc='QĐ 4795 · chỉ tiêu 2', dm='Sở Tài chính', ky='Ngày, Tháng',
         file='eForm_Thu_Ngan_Sach_Nha_Nuoc_QD4795.xlsx', api=['THU_NGAN_SACH'], kl=MOT_PHAN, rows=[
        ('Lũy kế thu NSNN đến kỳ báo cáo', MOT_PHAN, 'THU_NGAN_SACH: 4 lĩnh vực thu, dòng «Kỳ này»', 'Cộng 4 lĩnh vực ra tổng thu; chưa rõ «Kỳ này» là số trong quý hay lũy kế từ đầu năm.'),
        ('So sánh với dự toán', KHONG, '—', 'API không có dự toán.'),
        ('So với cùng kỳ năm trước', CO, 'THU_NGAN_SACH: dòng «Kỳ trước»', 'Dòng «Kỳ trước» ghi quý I/2025; riêng «Thu nội địa» ghi quý I/2026, cần Sở xác nhận.'),
        KY_API, DB_API]),
    dict(nhom='Ngân sách nhà nước', ten='Thu ngân sách nhà nước và cơ cấu thu', cc='QĐ 4795 · chỉ tiêu 57', dm='Sở Tài chính', ky='Tháng, Quý, Năm',
         file='eForm_Thu_NSNN_Va_Co_Cau_Thu_QD4795.xlsx', api=['THU_NGAN_SACH'], kl=MOT_PHAN, rows=[
        ('Thu theo lĩnh vực: nội địa, dầu thô, xuất nhập khẩu, viện trợ', CO, 'THU_NGAN_SACH', 'Đúng 4 lĩnh vực theo QĐ.'),
        ('Tỷ trọng cơ cấu thu (%)', CO, 'Tính từ 4 lĩnh vực', 'Mỗi lĩnh vực ÷ tổng 4 lĩnh vực × 100.'),
        ('Chi tiết từng khoản thu', KHONG, '—', 'API không tách khoản thu chi tiết.'),
        ('Dự toán, % so dự toán', KHONG, '—', 'API không có dự toán.'),
        KY_API_QUY, DB_API]),
    dict(nhom='Ngân sách nhà nước', ten='Thuế, phí, lệ phí và các khoản thu khác NSNN', cc='QĐ 4795 · chỉ tiêu 3', dm='Sở Tài chính', ky='Tháng',
         file='eForm_Thue_Phi_LePhi_KhoanThuKhac_NSNN_QD4795.xlsx', api=['THU_NGAN_SACH'], kl=KHONG, rows=[
        ('Tổng thu các sắc thuế: GTGT, TNDN, TNCN…', KHONG, '—', 'API chỉ có «Thu nội địa» gộp, không tách sắc thuế.'),
        ('Các loại phí, lệ phí', KHONG, '—', 'Không có.'),
        ('Các khoản thu khác NSNN', KHONG, '—', 'Không có.'),
        KY_API, DB_API]),
    dict(nhom='Ngân sách nhà nước', ten='Chi ngân sách nhà nước và cơ cấu chi', cc='QĐ 4795 · chỉ tiêu 58', dm='Sở Tài chính', ky='Ngày, Tháng, Quý, Năm',
         file='eForm_Chi_NSNN_Va_Co_Cau_Chi_QD4795.xlsx', api=['CHI_NGAN_SACH_DIA_PHUONG'], kl=MOT_PHAN, rows=[
        ('Các khoản chi chủ yếu: tổng chi, chi đầu tư phát triển, chi thường xuyên, chi trả nợ lãi…', CO, 'CHI_NGAN_SACH_DIA_PHUONG', 'Có ' + str(len(chitieu('CHI_NGAN_SACH_DIA_PHUONG'))) + ' khoản: ' + ', '.join(chitieu('CHI_NGAN_SACH_DIA_PHUONG')) + '. Lưu ý: là chi **ngân sách địa phương**, chưa gồm chi của Trung ương trên địa bàn.'),
        ('Chi theo chức năng (giáo dục, y tế, quản lý nhà nước…)', KHONG, '—', 'API không tách chức năng chi.'),
        ('Dự toán, % hoàn thành dự toán', KHONG, '—', 'API không có dự toán.'),
        ('So với cùng kỳ năm trước', CO, 'Dòng «Kỳ trước»', 'Quý I/2025.'),
        KY_API_QUY, DB_API]),
    dict(nhom='Ngân sách nhà nước', ten='Tổng chi NSNN cho công nghệ thông tin, chuyển đổi số', cc='QĐ 5279 · chỉ số 33', dm='Sở Tài chính (hướng dẫn, chấm điểm)', ky='Năm',
         file='eForm_Tong_Chi_NSNN_CNTT_ChuyenDoiSo_QD5279.xlsx', api=[], kl=KHONG, rows=khong_api(
        'Tổng chi NSNN cho CNTT, chuyển đổi số', 'Chi theo nhóm nhiệm vụ chuyển đổi số', 'Chi theo nguồn kinh phí NSNN') +
        [('Ghi chú', KHONG, 'CHI_NGAN_SACH_DIA_PHUONG', 'API chi ngân sách không tách riêng phần CNTT, chuyển đổi số.')]),
    # ===== Tổng sản phẩm trên địa bàn (GRDP)
    dict(nhom='Tổng sản phẩm trên địa bàn', ten='GRDP theo giá so sánh, giá hiện hành', cc='QĐ 4795 · chỉ tiêu 70', dm='Thống kê Thành phố Hà Nội', ky='Quý, Năm',
         file='eForm_GRDP_Gia_So_Sanh_Gia_Hien_Hanh_QD4795.xlsx', api=['SP_DIA_BAN'], kl=MOT_PHAN, rows=[
        ('GRDP theo giá hiện hành', CO, 'SP_DIA_BAN: «Theo giá hiện hành»', 'Theo ' + str(len(loai('SP_DIA_BAN'))) + ' khu vực: ' + ', '.join(loai('SP_DIA_BAN')) + '.'),
        ('GRDP theo giá so sánh', MOT_PHAN, 'SP_DIA_BAN: «Theo giá so sánh cùng kỳ năm trước»', 'Chưa rõ dòng này là giá trị theo giá so sánh của kỳ này, của cùng kỳ năm trước, hay là tốc độ tăng (%).'),
        ('Phân tổ quý: theo ngành kinh tế', MOT_PHAN, 'SP_DIA_BAN', 'Chỉ có 4 khu vực kinh tế lớn, không chi tiết ngành.'),
        ('Phân tổ năm: theo ngành và loại hình kinh tế', KHONG, '—', 'Không có loại hình kinh tế.'),
        KY_API_QUY, DB_API]),
    dict(nhom='Tổng sản phẩm trên địa bàn', ten='Cơ cấu tổng sản phẩm trên địa bàn', cc='QĐ 4795 · chỉ tiêu 71', dm='Thống kê Thành phố Hà Nội', ky='Quý, Năm',
         file='eForm_Co_Cau_Tong_San_Pham_Tren_Dia_Ban_QD4795.xlsx', api=['SP_DIA_BAN'], kl=MOT_PHAN, rows=[
        ('Cơ cấu GRDP theo ngành (%)', CO, 'Tính từ SP_DIA_BAN giá hiện hành', 'Mỗi khu vực ÷ tổng × 100; chỉ ở mức 4 khu vực.'),
        ('Cơ cấu theo loại hình kinh tế (kỳ năm)', KHONG, '—', 'Không có.'),
        ('Cơ cấu cùng kỳ năm trước', MOT_PHAN, 'SP_DIA_BAN', 'Phụ thuộc cách hiểu dòng «cùng kỳ năm trước» (mục Phần IV).'),
        KY_API_QUY, DB_API]),
    dict(nhom='Tổng sản phẩm trên địa bàn', ten='Tốc độ tăng tổng sản phẩm trên địa bàn', cc='QĐ 4795 · chỉ tiêu 72', dm='Thống kê Thành phố Hà Nội', ky='Quý, Năm',
         file='eForm_Toc_Do_Tang_GRDP_QD4795.xlsx', api=['SP_DIA_BAN'], kl=MOT_PHAN, rows=[
        ('Tốc độ tăng GRDP theo ngành (%)', MOT_PHAN, 'SP_DIA_BAN: «Theo giá so sánh cùng kỳ năm trước»', 'Nếu dòng này là tốc độ tăng thì dùng thẳng; nếu là giá trị thì còn thiếu giá trị kỳ này theo giá so sánh.'),
        ('Theo loại hình kinh tế (kỳ năm)', KHONG, '—', 'Không có.'),
        KY_API_QUY, DB_API]),
    dict(nhom='Tổng sản phẩm trên địa bàn', ten='Tổng sản phẩm trên địa bàn bình quân đầu người', cc='QĐ 4795 · chỉ tiêu 73', dm='Thống kê Thành phố Hà Nội', ky='Năm',
         file='eForm_GRDP_Binh_Quan_Dau_Nguoi_QD4795.xlsx', api=['SP_DIA_BAN', 'CHI_SO_KINH_TE'], kl=MOT_PHAN, rows=[
        ('GRDP giá hiện hành (tử số)', CO, 'SP_DIA_BAN', 'Cộng 4 khu vực.'),
        ('Dân số trung bình (mẫu số)', KHONG, '—', 'Không có trong API Sở Tài chính.'),
        ('Tỷ giá VND/USD (quy đổi USD/người)', KHONG, 'CHI_SO_KINH_TE', 'Chỉ có **chỉ số** giá đô la Mỹ, không phải tỷ giá.'),
        DB_API]),
    # ===== Giá cả
    dict(nhom='Giá cả', ten='Chỉ số giá tiêu dùng tháng (CPI)', cc='QĐ 4795 · chỉ tiêu 1', dm='Thống kê Thành phố Hà Nội', ky='Tháng',
         file='eForm_CPI_Thang_QD4795.xlsx', api=['CHI_SO_KINH_TE'], kl=MOT_PHAN, rows=[
        ('CPI chung', MOT_PHAN, 'CHI_SO_KINH_TE: «Chỉ số giá tiêu dùng»', 'Một con số theo quý; chưa rõ gốc so sánh.'),
        ('Theo 11 nhóm hàng chính', KHONG, '—', 'Không có.'),
        ('So với tháng trước, cùng kỳ năm trước, tháng 12 năm trước', KHONG, '—', 'API chỉ có một giá trị.'),
        KY_API, DB_API]),
    dict(nhom='Giá cả', ten='Chỉ số giá tiêu dùng (CPI) — eform Sở Tài chính', cc='QĐ 4795 · chỉ tiêu 63', dm='Thống kê Thành phố Hà Nội', ky='Tháng, Quý, Năm',
         file='eForm_CPI_QD4795_So_TaiChinh.xlsx', api=['CHI_SO_KINH_TE'], kl=MOT_PHAN, rows=[
        ('CPI chung', MOT_PHAN, 'CHI_SO_KINH_TE: «Chỉ số giá tiêu dùng»', 'Như trên.'),
        ('Theo 11 nhóm hàng; thành thị, nông thôn', KHONG, '—', 'Không có.'),
        KY_API_QUY, DB_API]),
    # ===== Đầu tư
    dict(nhom='Đầu tư', ten='Vốn đầu tư thực hiện trên địa bàn', cc='QĐ 4795 · chỉ tiêu 54', dm='Thống kê Thành phố Hà Nội', ky='Tháng, Quý, Năm',
         file='eForm_Von_Dau_Tu_Thuc_Hien_Tren_Dia_Ban_QD4795.xlsx', api=['VON_DAU_TU', 'VON_NSNN_DIA_PHUONG'], kl=MOT_PHAN, rows=[
        ('Kỳ tháng: nguồn NSNN do địa phương quản lý', MOT_PHAN, 'VON_NSNN_DIA_PHUONG: ' + ', '.join(chitieu('VON_NSNN_DIA_PHUONG')), 'Có đúng nguồn này nhưng chỉ theo quý.'),
        ('Kỳ quý: theo loại hình kinh tế', CO, 'VON_DAU_TU: ' + ', '.join(loai('VON_DAU_TU')), 'Vốn đầu tư phát triển toàn xã hội theo giá hiện hành.'),
        ('Kỳ năm: theo nguồn vốn chi tiết, ngành kinh tế', KHONG, '—', 'Không có.'),
        ('Đơn vị tính', MOT_PHAN, '—', 'Eform nhập triệu đồng; API chưa ghi đơn vị.'),
        DB_API]),
    dict(nhom='Đầu tư', ten='Vốn đầu tư có yếu tố nước ngoài (FDI)', cc='QĐ 4795 · chỉ tiêu 11', dm='Sở Tài chính', ky='Ngày, Tháng',
         file='eForm_Von_Dau_Tu_Co_Yeu_To_Nuoc_Ngoai_QD4795.xlsx', api=['VON_DAU_TU'], kl=MOT_PHAN, rows=[
        ('Vốn đầu tư thực hiện', MOT_PHAN, 'VON_DAU_TU: «Vốn đầu tư trực tiếp nước ngoài»', 'Chỉ theo quý.'),
        ('Vốn đăng ký cấp mới; số dự án cấp mới', KHONG, '—', 'Không có.'),
        ('Vốn đăng ký điều chỉnh; số lượt dự án điều chỉnh', KHONG, '—', 'Không có.'),
        ('Góp vốn mua cổ phần', KHONG, '—', 'Không có.'),
        KY_API, DB_API]),
    dict(nhom='Đầu tư', ten='Số dự án, số vốn đầu tư trong nước ngoài NSNN được cấp chủ trương đầu tư', cc='QĐ 4795 · chỉ tiêu 55', dm='Sở Tài chính', ky='Tháng, Quý, Năm',
         file='eForm_Du_An_Von_Dau_Tu_Trong_Nuoc_Ngoai_NSNN_Cap_Chu_Truong_QD4795.xlsx', api=[], kl=KHONG, rows=khong_api(
        'Số dự án được cấp chủ trương đầu tư', 'Số vốn được cấp chủ trương đầu tư', 'Phân tổ theo ngành kinh tế') +
        [('Ghi chú', KHONG, 'VON_DAU_TU: «Vốn ngoài nhà nước»', 'Là vốn **thực hiện** toàn xã hội, không phải dự án được cấp chủ trương; không dùng thay được.')]),
    dict(nhom='Đầu tư', ten='Dự án đầu tư công', cc='QĐ 4795 · chỉ tiêu 12', dm='Sở Tài chính', ky='Tháng',
         file='eForm_Du_An_Dau_Tu_Cong_QD4795.xlsx', api=[], kl=KHONG, rows=khong_api(
        'Số lượng dự án đầu tư công', 'Tổng vốn đầu tư', 'Tỷ lệ giải ngân so với kế hoạch', 'Giải ngân theo từng dự án', 'Phân tổ theo ngành (VSIC)') +
        [('Tham chiếu', MOT_PHAN, 'VON_NSNN_DIA_PHUONG', 'Chỉ có tổng vốn NSNN thực hiện cấp thành phố, cấp xã; không theo dự án.')]),
    dict(nhom='Đầu tư', ten='Dự án quan trọng quốc gia, công trình trọng điểm giao thông vận tải', cc='QĐ 4795 · chỉ tiêu 21', dm='Sở Tài chính', ky='Tháng',
         file='eForm_Du_An_Quan_Trong_QG_Cong_Trinh_Trong_Diem_GTVT_QD4795.xlsx', api=['DA_TRONG_DIEM'], kl=MOT_PHAN, rows=[
        ('Tiến độ', MOT_PHAN, 'DA_TRONG_DIEM: tiến độ hoàn thành (%)', 'Là API **duy nhất có số thật**: ' + ', '.join(f'{k} {v}%' for k, v in DA.items()) + '. Số theo **nhóm**, không theo từng dự án; nhóm «Quy hoạch và Thể chế phát triển Thủ đô» không phải dự án giao thông.'),
        ('Số lượng dự án; mục tiêu, quy mô, địa điểm, thời gian, hình thức đầu tư', KHONG, '—', 'Không có.'),
        ('Tổng vốn, nguồn vốn, tiến độ giải ngân', KHONG, '—', 'Không có.'),
        ('Giải phóng mặt bằng, thi công, vật liệu, vướng mắc', KHONG, '—', 'Không có.'),
        KY_API, DB_API]),
    dict(nhom='Đầu tư', ten='Đấu thầu', cc='QĐ 4795 · chỉ tiêu 7', dm='Sở Tài chính', ky='Tháng, Năm',
         file='eForm_Dau_Thau_QD4795.xlsx', api=[], kl=KHONG, rows=khong_api(
        'Tổng số gói thầu', 'Tổng giá trị trúng thầu', 'Tỷ lệ tiết kiệm trong đấu thầu', 'Phân tổ theo ngành (VSIC)') +
        [('Ghi chú', KHONG, '—', 'Theo QĐ, chỉ tiêu này báo cáo tháng sau khi kết nối Hệ thống mạng đấu thầu quốc gia; nguồn phù hợp là hệ thống đó.')]),
    # ===== Doanh nghiệp, hợp tác xã, kinh tế số
    dict(nhom='Doanh nghiệp, hợp tác xã, kinh tế số', ten='Doanh nghiệp', cc='QĐ 4795 · chỉ tiêu 6', dm='Sở Tài chính', ky='Ngày, Tháng',
         file='eForm_Doanh_Nghiep_QD4795.xlsm', api=[], kl=KHONG, rows=khong_api(
        'Doanh nghiệp đang hoạt động; thành lập mới; vốn đăng ký thành lập mới', 'Doanh nghiệp quay lại hoạt động; tạm ngừng; chờ giải thể; giải thể', 'Phân tổ theo ngành kinh tế chính (VSIC)')),
    dict(nhom='Doanh nghiệp, hợp tác xã, kinh tế số', ten='Hợp tác xã, kinh tế tập thể', cc='QĐ 4795 · chỉ tiêu 8', dm='Sở Tài chính', ky='Tháng',
         file='eForm_HTX_Kinh_Te_Tap_The_QD4795.xlsx', api=[], kl=KHONG, rows=khong_api(
        'HTX đang hoạt động; thành lập mới; vốn điều lệ HTX thành lập mới; giải thể', 'Phân tổ theo ngành (VSIC)')),
    dict(nhom='Doanh nghiệp, hợp tác xã, kinh tế số', ten='Tỷ lệ doanh nghiệp nhỏ và vừa sử dụng nền tảng số', cc='QĐ 5279 · chỉ số 34', dm='—', ky='Năm (tháng, quý để theo dõi)',
         file='eForm_ChiTieu34_DNNVV_Su_Dung_Nen_Tang_So_QD5279.xlsx', api=[], kl=KHONG, rows=khong_api(
        'Tổng số doanh nghiệp nhỏ và vừa (mẫu số)', 'Số doanh nghiệp nhỏ và vừa dùng nền tảng số (tử số)')),
    dict(nhom='Doanh nghiệp, hợp tác xã, kinh tế số', ten='Tỷ lệ doanh nghiệp sử dụng hợp đồng điện tử', cc='QĐ 5279 · chỉ số 35', dm='—', ky='Năm (tháng, quý để theo dõi)',
         file='eForm_ChiTieu35_Doanh_Nghiep_Su_Dung_Hop_Dong_Dien_Tu_QD5279.xlsx', api=[], kl=KHONG, rows=khong_api(
        'Tổng số doanh nghiệp (mẫu số)', 'Số doanh nghiệp dùng hợp đồng điện tử (tử số)')),
    dict(nhom='Doanh nghiệp, hợp tác xã, kinh tế số', ten='Tỷ lệ tổ chức, doanh nghiệp chấp nhận thanh toán không dùng tiền mặt cho dịch vụ thiết yếu', cc='QĐ 5279 · chỉ số 37', dm='—', ky='Năm (tháng, quý để theo dõi)',
         file='eForm_ChiTieu37_To_Chuc_Doanh_Nghiep_Thanh_Toan_Khong_Dung_Tien_Mat_Dich_Vu_Thiet_Yeu_QD5279.xlsx', api=[], kl=KHONG, rows=khong_api(
        'Tổng số tổ chức, doanh nghiệp cung cấp dịch vụ thiết yếu', 'Số đơn vị chấp nhận thanh toán không dùng tiền mặt')),
    # ===== Khác
    dict(nhom='Tín dụng, an sinh', ten='Dư nợ tín dụng của tổ chức tín dụng', cc='QĐ 4795', dm='Ngân hàng Nhà nước Việt Nam khu vực I', ky='Tháng',
         file='eForm_Du_No_Tin_Dung_TCTD_QD4795.xlsx', api=[], kl=KHONG, rows=khong_api(
        'Dư nợ tín dụng', 'Phân tổ theo ngành kinh tế, loại hình kinh tế') +
        [('Ghi chú', KHONG, '—', 'Đầu mối chính thức là Ngân hàng Nhà nước khu vực I, không thuộc API Sở Tài chính.')]),
    dict(nhom='Tín dụng, an sinh', ten='Gạo xuất cấp hỗ trợ các địa phương', cc='QĐ 4795 · chỉ tiêu 5', dm='Sở Tài chính', ky='Tháng, Quyết định',
         file='eForm_Gao_Xuat_Cap_Ho_Tro_Dia_Phuong_QD4795.xlsx', api=[], kl=KHONG, rows=khong_api(
        'Gạo xuất cấp (tấn)', 'Phân tổ theo mục đích')),
]
assert len(CT) == 24, len(CT)
def dem(rows): return {m: sum(1 for r in rows if r[1] == m) for m in (CO, MOT_PHAN, KHONG)}
N_MP = sum(1 for c in CT if c['kl'] == MOT_PHAN); N_K = sum(1 for c in CT if c['kl'] == KHONG)
API_DUNG = sorted({a for c in CT for a in c['api']})
API_KHONG_DUNG = [a for a in API_NAME if a not in API_DUNG]

# ======================================================= TÀI LIỆU
k = Kit('Sở Tài chính · Đối chiếu API với 24 chỉ tiêu eform')
para, table, box, heading, note, bullets = k.para, k.table, k.box, k.heading, k.note, k.bullets
FILL = {CO: k.OK_FILL, MOT_PHAN: k.NOTE_FILL, KHONG: RED_FILL}

k.blank(5)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(4)
para('BÁO CÁO ĐỐI CHIẾU DỮ LIỆU API', 22, CENTER, 6, bold=True, color=NAVY)
para('SỞ TÀI CHÍNH HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('14 API báo cáo của Sở có đáp ứng được 24 chỉ tiêu eform nhóm Sở Tài chính hay không', 14, CENTER, 0, italic=True, color=GREY)
k.blank(5)
table([
    ['Đơn vị', 'Sở Tài chính Thành phố Hà Nội'],
    ['Nguồn API', f'{N_API} API báo cáo của Sở; bản chụp số liệu quý I/2026, lấy ngày 18/09/2026'],
    ['Chỉ tiêu đối chiếu', '24 file eform: 20 chỉ tiêu QĐ 4795, 4 chỉ số QĐ 5279'],
    ['Phạm vi', 'Chỉ kiểm dữ liệu API; không liên quan bộ chỉ tiêu đang hiện trên IOC'],
    ['Ngày', '19/10/2026'],
], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break(); k.toc(); k.page_break()

# ---- PHẦN I
heading('PHẦN I. KẾT LUẬN CHUNG', 1)
para(f'**Không có chỉ tiêu nào API đáp ứng đầy đủ.** {N_MP}/24 chỉ tiêu đáp ứng **một phần** (API có đúng nhóm số liệu nhưng thiếu phân tổ, thiếu kỳ tháng hoặc thiếu dự toán); **{N_K}/24 chỉ tiêu không có API**.')
r1, f1 = [['#', 'Chỉ tiêu', 'Căn cứ', 'API liên quan', 'Kết luận']], {}
for i, c in enumerate(CT, 1):
    r1.append([str(i), c['ten'], c['cc'], ', '.join(c['api']) or '—', c['kl']]); f1[(i, 4)] = FILL[c['kl']]
table(r1, [0.7, 6.4, 3.0, 3.6, 2.3], size=10, fills=f1)
heading('Bốn điểm chung của 14 API', 2)
bullets([
    f'**{N_API - len(CO_SO)}/{N_API} API đang trả về toàn số 0.** Trong bản chụp quý I/2026, chỉ API dự án trọng điểm có số thật. Nghĩa là kể cả những chỉ tiêu "đáp ứng một phần" cũng **chưa có số để hiển thị**.',
    '**Chỉ có số toàn Thành phố.** API không có số theo phường/xã, trong khi cả 24 eform đều thiết kế để phường/xã nhập lớp dữ liệu địa bàn. Phần theo phường/xã vẫn phải lấy từ eform.',
    '**Chỉ theo quý.** API gọi theo năm và quý; các chỉ tiêu QĐ yêu cầu ngày, tháng (thu NSNN, thuế phí, FDI, doanh nghiệp, đấu thầu, dự án đầu tư công…) không lấy được số tháng.',
    '**Không có dự toán, kế hoạch.** Mọi yêu cầu "so với dự toán", "tỷ lệ giải ngân so kế hoạch" đều không đáp ứng.',
])
heading('Đề xuất', 2)
table([['Nhóm', 'Đề xuất'],
       ['Ngân sách (thu, chi)', 'Dùng API cho số toàn Thành phố theo quý (4 lĩnh vực thu, 6 khoản chi chủ yếu) khi Sở có số. Dự toán, sắc thuế, chức năng chi, số tháng: đề nghị Sở bổ sung API hoặc tiếp tục nhập eform.'],
       ['GRDP, CPI, vốn đầu tư', 'Dùng API cho số tổng toàn Thành phố theo quý; chi tiết ngành, loại hình kinh tế, 11 nhóm hàng CPI, dân số: nhập eform hoặc lấy từ Thống kê Thành phố (đầu mối chính thức).'],
       ['Dự án trọng điểm', 'Dùng ngay tiến độ 5 nhóm dự án (đã có số); thông tin từng dự án, vốn, GPMB, vướng mắc: nhập eform.'],
       ['FDI, dự án ngoài NSNN, đầu tư công, đấu thầu, doanh nghiệp, HTX', 'Không có API: nhập eform; về lâu dài nối hệ thống chuyên ngành (đăng ký đầu tư, mạng đấu thầu quốc gia, đăng ký doanh nghiệp, đăng ký HTX).'],
       ['Chuyển đổi số (QĐ 5279), dư nợ, gạo xuất cấp', 'Không có API: nhập eform. Dư nợ tín dụng thuộc Ngân hàng Nhà nước khu vực I.']],
      [4.4, 11.6], size=11, key_col=True)

# ---- PHẦN II
k.page_break()
heading('PHẦN II. 14 API CỦA SỞ TÀI CHÍNH', 1)
para('Mọi API cùng một dạng trả về: mỗi dòng gồm «chỉ tiêu», «loại» (phân tổ), «quý» và «giá trị»; gọi theo năm và quý. Số dòng, phân tổ dưới đây lấy từ bản chụp quý I/2026.')
r2, f2 = [['API', 'Nội dung', 'Số dòng', 'Phân tổ trả về', 'Có số thật', 'Dùng cho chỉ tiêu']], {}
for i, (code, ten) in enumerate(API_NAME.items(), 1):
    dung = [str(j) for j, c in enumerate(CT, 1) if code in c['api']]
    co = code in CO_SO
    pt = chitieu(code) if len(chitieu(code)) > len(loai(code)) else loai(code)  # API thu, chi: «loại» chỉ là kỳ này / kỳ trước
    r2.append([code, ten, str(len(SNAP.get(code, []))), ', '.join(pt)[:150],'Có' if co else 'Không (toàn 0)', ', '.join(dung) or '—'])
    f2[(i, 4)] = k.OK_FILL if co else RED_FILL
table(r2, [3.4, 3.6, 1.3, 4.6, 1.6, 1.5], size=9, fills=f2, mono_col=0)
para(f'**{len(API_KHONG_DUNG)} API không ứng với chỉ tiêu nào trong 24 eform:** ' + ', '.join(f'{nd(a)}' for a in API_KHONG_DUNG) + '. Các API này phục vụ chỉ tiêu của nhóm khác (Công Thương, Du lịch, Xây dựng…).', 11.5, color=GREY)

# ---- PHẦN III
k.page_break()
heading('PHẦN III. ĐỐI CHIẾU TỪNG CHỈ TIÊU', 1)
note('Mỗi chỉ tiêu: căn cứ, đầu mối và kỳ báo cáo theo QĐ; bảng từng yêu cầu với mức đáp ứng (Đáp ứng / Một phần / Không), API lấy được và ghi chú. Yêu cầu lấy từ sheet hướng dẫn và sheet mapping QĐ của từng eform.')
nhom = None
for i, c in enumerate(CT, 1):
    if c['nhom'] != nhom:
        if nhom is not None: k.page_break()
        nhom = c['nhom']; heading(nhom, 2)
    heading(f'{i}. {c["ten"]}', 3)
    table([['Căn cứ', c['cc']], ['Đầu mối theo QĐ', c['dm']], ['Kỳ báo cáo theo QĐ', c['ky']], ['File eform', c['file']],
           ['Kết luận', c['kl'] + (' — API: ' + ', '.join(c['api']) if c['api'] else ' — không có API')]],
          [3.6, 12.4], header=False, size=10.5, key_col=True, keep=True)
    rr = [['Yêu cầu', 'Đáp ứng', 'API / trường', 'Ghi chú']] + [list(r) for r in c['rows']]
    table(rr, [4.6, 1.8, 3.8, 5.8], size=10, fills={(j, 1): FILL[r[1]] for j, r in enumerate(c['rows'], 1)})

# ---- PHẦN IV
k.page_break()
heading('PHẦN IV. VIỆC CẦN SỞ TÀI CHÍNH XÁC NHẬN', 1)
para('Cột "Kết quả" để trống cho Sở ghi ý kiến.')
table([['#', 'Nội dung', 'Kết quả']] + [[str(i + 1), x, ''] for i, x in enumerate([
    f'{N_API - len(CO_SO)}/{N_API} API trả về toàn số 0 (bản chụp quý I/2026, lấy ngày 18/09/2026). Đề nghị Sở cho biết số liệu chưa được nhập hay API chưa nối nguồn, và thời điểm có số.',
    'API «Sản phẩm trên địa bàn»: dòng «Theo giá so sánh cùng kỳ năm trước» là giá trị theo giá so sánh của kỳ này, của cùng kỳ năm trước, hay là tốc độ tăng (%)? Câu trả lời quyết định 3 chỉ tiêu GRDP (70, 71, 72).',
    'Đơn vị tính của từng API (trường «giá trị» không kèm đơn vị): tỷ đồng, triệu đồng, %, chỉ số?',
    'API thu ngân sách: «Kỳ này» là số phát sinh trong quý hay lũy kế từ đầu năm? Dòng «Kỳ trước» của «Thu nội địa» ghi quý I/2026, các dòng khác ghi quý I/2025: đề nghị kiểm tra.',
    'API chi ngân sách là chi **ngân sách địa phương**; chỉ tiêu 58 là chi NSNN trên địa bàn. Đề nghị xác nhận có dùng thay được không.',
    'Đề nghị bổ sung API (nếu có nguồn): dự toán thu, chi; thu theo sắc thuế, phí, lệ phí; chi theo chức năng; FDI cấp mới, điều chỉnh, góp vốn; dự án đầu tư công theo dự án; số liệu theo tháng.',
    'Các chỉ tiêu có đầu mối chính thức là Thống kê Thành phố (GRDP, CPI, vốn đầu tư thực hiện) hoặc Ngân hàng Nhà nước (dư nợ tín dụng): API Sở Tài chính có phải nguồn chính thức để IOC dùng không?',
])], [0.8, 12.2, 3.0], size=10.5)
heading('Phát hiện thêm khi đọc 24 file eform', 2)
bullets([
    'Có **2 eform CPI** (chỉ tiêu 1 và 63) với trường gần như trùng nhau; nên dùng chung một eform.',
    'Có **4 eform GRDP** (chỉ tiêu 70, 71, 72, 73) cùng dựa trên một bộ số giá trị tăng thêm theo ngành; nên gộp một eform và tính 4 chỉ tiêu từ đó.',
    'Ba eform thu ngân sách (chỉ tiêu 2, 57, 3) chồng lấn trường: cùng lĩnh vực thu, khoản thu, dự toán, lũy kế.',
    'Đơn vị nhập không thống nhất: vốn đầu tư thực hiện, FDI, dư nợ tín dụng, chi CNTT nhập **triệu đồng**; các eform còn lại nhập **tỷ đồng**.',
    'Eform chi CNTT, chuyển đổi số (QĐ 5279 chỉ số 33) tự ghi chú nên mapping vào chỉ tiêu 58 (chi NSNN), không phải 57 (thu NSNN); đề nghị nhóm thống nhất.',
    'Một số ô tổng hợp ở sheet mẫu bị sai định dạng phần trăm, ví dụ "Số dòng dữ liệu 600,00%" (eform GRDP), "Số dòng có cảnh báo 19800%" (eform gạo), "Số giao dịch 117000%" (eform chỉ số 34). Đề nghị sửa trước khi gửi phường.',
])

# ---- PHỤ LỤC
k.page_break()
heading('PHỤ LỤC. TOÀN BỘ DÒNG SỐ LIỆU CỦA 14 API (QUÝ I/2026)', 1)
para(f'Nguồn: {SNAP_SRC}. Giá trị giữ nguyên như API trả về.')
for code in API_NAME:
    heading(f'{code} — {nd(code)}', 3)
    table([['Chỉ tiêu', 'Loại', 'Quý', 'Giá trị']] + [[r['chiTieu'], r['loai'], r['quy'], str(r['giaTri'])] for r in SNAP.get(code, [])],
          [7.0, 5.4, 1.8, 1.8], size=9.5)

print('API', N_API, '| có số thật:', CO_SO, '| một phần', N_MP, '| không', N_K, '| API không dùng:', API_KHONG_DUNG)
for p in k.save(OUT): print('ok', p)
