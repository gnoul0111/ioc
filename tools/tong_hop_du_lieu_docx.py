# -*- coding: utf-8 -*-
"""Sinh docs/CHUNG/TONG_HOP_DU_LIEU_IOC_2026_10_12.docx + .md — tổng hợp dữ liệu trên IOC: có bao nhiêu loại dữ liệu
(quốc gia, ngành dọc, chuyên ngành, dùng chung Thành phố, sở, khối, xã…), mỗi loại nằm ở trục nào, cấp nào, hiện trạng thật/mô phỏng.
Chạy từ thư mục gốc ioc:  py tools/tong_hop_du_lieu_docx.py
Số đơn vị, số chỉ số đọc thẳng từ cấu hình qua tools/tong-hop-du-lieu-dump.js nên luôn khớp giao diện. Phân loại, nguồn gốc,
hiện trạng viết tay ở bảng UNIT bên dưới (theo ghi chú trong code và tài liệu từng sở).
Sau khi sinh, cập nhật Mục lục bằng Word: tools/vhtt_doc_finalize.ps1 -Docx <đường dẫn .docx>."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'CHUNG', 'TONG_HOP_DU_LIEU_IOC_2026_10_12.docx')
D = json.loads(subprocess.run(['node', 'tools/tong-hop-du-lieu-dump.js'], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))


def n(x):
    return f'{x:,}'.replace(',', '.')


# 12/10/2026 anh thấy khó hiểu → ẩn các cột «loại chính» và «hiện trạng» trong bảng (bảng mức sẵn sàng ở phần V vẫn giữ). Bật lại: True.
SHOW_LOAI_CHINH = False
SHOW_HIEN_TRANG_COT = False


def drop(rows, widths, cols, show):
    """Bỏ các cột `cols` khi show=False; độ rộng còn lại giãn đều cho đủ khổ cũ."""
    if show: return rows, widths
    keep = [i for i in range(len(widths)) if i not in cols]
    w = [widths[i] for i in keep]; f = sum(widths) / sum(w)
    return [[r[i] for i in keep] for r in rows], [round(x * f, 2) for x in w]


# ---------- Số đếm ----------
CTM = {c['id']: c for c in D['ctm']}
SEED = {c['id']: c for r in D['seed'].values() for c in r}
XA_SEED = {c['id']: c for r in D['xa'].values() for c in r}
SO = D['so']  # stc, sgd, hcc
XA = D['xaCount']


def ctm_sum(role, level):
    u = [c for c in D['ctm'] if c['role'] == role and c['level'] == level]
    return len(u), sum(c['metrics'] for c in u)


TP = {r: list(ctm_sum(r, 'city')) for r in ('DANG', 'HDND', 'UBND', 'MTTQ')}
TP['UBND'][0] += 3; TP['UBND'][1] += SO['stc'] + SO['sgd'] + SO['hcc']   # 3 đơn vị form riêng
XAS = {r: ctm_sum(r, 'xa') for r in ('DANG', 'HDND', 'UBND', 'MTTQ')}
UBND_TRONG = [c['name'] for c in D['seed']['UBND'] if not c['items']]
TW = {}
for r, cats in D['tw'].items():
    have = [c for c in cats if c['items']]
    TW[r] = (len(have), sum(len(c['items']) for c in have))
TP_DV = sum(v[0] for v in TP.values()); TP_CS = sum(v[1] for v in TP.values())
XA_DV = sum(v[0] for v in XAS.values()); XA_CS = sum(v[1] for v in XAS.values())
TW_DV = sum(v[0] for v in TW.values()); TW_CS = sum(v[1] for v in TW.values())
EFORM = {'ubnd-vhtt': 6, 'ubnd-vpubnd': 5, 'ubnd-bqlkcnc': 1, 'ubnd-dulich': 2, 'ubnd-dantoc-tongiao': 1, 'ubnd-thanhtra': 3,
         'ubnd-khcn': 3, 'ubnd-nnmt': 10, 'ubnd-congthuong': 5, 'ubnd-xaydung': 4, 'ubnd-noivu': 2, 'ubnd-yte': 4}
N_EFORM = sum(EFORM.values()); N_SO_EFORM = len(EFORM)
EF_CS = sum(CTM[i]['metrics'] for i in EFORM)
FILE_THAT = {i: sum(1 for it in SEED[i]['items'] if it[2] == 'File') for i in ('ubnd-nnmt', 'ubnd-noivu')}

# ---------- Loại dữ liệu ----------
LOAI = [
    ('L1', 'Dữ liệu quốc gia', 'Cơ sở dữ liệu quốc gia và hệ thống dùng chung toàn quốc',
     'Cổng Dịch vụ công quốc gia; dân cư, định danh điện tử (VNeID: sổ sức khỏe điện tử); bảo hiểm (BHXH, BHYT); CSDL quốc gia về công tác xây dựng Đảng (đang triển khai)',
     'Chưa nối thẳng. Số đi vào IOC qua báo cáo của sở (Sở Y tế, Sở Nội vụ), qua TT Phục vụ HCC, hoặc mô phỏng ở cấp Trung ương'),
    ('L2', 'Dữ liệu ngành dọc Trung ương', 'CSDL chuyên ngành của Ban, Bộ, ngành Trung ương, quản lý theo ngành dọc xuống địa phương',
     'Ngành Tổ chức xây dựng Đảng (đảng viên, cán bộ, biên chế, vị trí việc làm); Văn phòng Chủ tịch nước, Quốc hội, Chính phủ, MTTQ Trung ương; hộ tịch (Bộ Tư pháp); công an',
     'Cấp Trung ương: mô phỏng toàn bộ. Cấp Thành phố, xã: số đi qua đơn vị địa phương (Ban Tổ chức Thành ủy, Tư pháp - Hộ tịch, Công an xã)'),
    ('L3', 'Dữ liệu chuyên ngành của sở', 'CSDL, phần mềm nghiệp vụ riêng của một sở, ngành Thành phố, lấy vào IOC bằng kết nối hoặc file',
     'Sở Tài chính (14 API); Sở GD&ĐT (18 API, dữ liệu từng trường); giải phóng mặt bằng, đất đai (Sở NN&MT); lao động, người có công, công chức (Sở Nội vụ); địa chính, LĐTBXH cấp xã',
     'Sở Tài chính: bản chụp thật; Sở GD&ĐT: mới có cấu trúc; Sở NN&MT, Sở Nội vụ: 7 chỉ tiêu số thật dạng file'),
    ('L4', 'Dữ liệu dùng chung Thành phố', 'Nền tảng, hệ thống dùng chung của Thành phố, phục vụ nhiều trục, nhiều đơn vị',
     'Hệ thống giải quyết TTHC, Dịch vụ công Hà Nội (TT Phục vụ HCC, Một cửa xã); iHanoi (phản ánh hiện trường); quản lý nhiệm vụ; quản lý văn bản; lịch công tác; danh mục đơn vị, người dùng; số kinh tế - xã hội tổng hợp (CPI, IIP, xuất nhập khẩu, bán lẻ, du lịch, vận tải, vốn đầu tư, thu chi ngân sách)',
     'Danh mục đơn vị, người dùng: số thật. Dịch vụ công Hà Nội: đã thử gọi được, màn hình vẫn mô phỏng theo quy mô thật. Còn lại mô phỏng'),
    ('L5', 'Dữ liệu báo cáo của sở, ngành (eform)', 'Sở, ngành tự nhập theo biểu mẫu điện tử (eform) định kỳ',
     f'{N_SO_EFORM} sở, ngành, {N_EFORM} eform (Văn hóa, VP UBND, Ban QL KCNC, Du lịch, Dân tộc - Tôn giáo, Thanh tra, KH&CN, NN&MT, Công Thương, Xây dựng, Nội vụ, Y tế)',
     'Mô phỏng theo đúng trường của eform, số đặt sát báo cáo công khai; chờ phần mềm eform vận hành'),
    ('L6', 'Dữ liệu nội bộ khối Đảng, HĐND, MTTQ', 'Số liệu nghiệp vụ của các ban, đơn vị thuộc Thành ủy, HĐND, MTTQ và tổ chức chính trị - xã hội',
     'Ban Tổ chức, UBKT, Nội chính, Tuyên giáo và Dân vận; 9 ban, đơn vị HĐND; 16 ban, tổ chức thuộc MTTQ (Hội LHPN, Hội Nông dân, LĐLĐ, Thành Đoàn…)',
     'Chưa có nguồn số hóa (CSDL hoặc Excel nội bộ). Số mô phỏng, đặt theo báo cáo công khai'),
    ('L7', 'Dữ liệu cấp xã, phường', f'Số liệu của {XA["total"]} xã, phường ({XA["phuong"]} phường, {XA["xa"]} xã), đủ 4 trục',
     'Đảng ủy, HĐND, UBND, MTTQ xã; số Thành phố chia theo từng xã (đảng viên, hồ sơ TTHC, quỹ Vì người nghèo…)',
     'Mô phỏng theo quy mô thật của từng xã (dân số, diện tích); cộng 126 xã khớp số Thành phố'),
    ('L8', 'Dữ liệu phát sinh trên IOC', 'Do chính người dùng IOC tạo ra khi làm việc trên hệ thống',
     'Giao, nhận, phối hợp nhiệm vụ; phản ánh người dùng tự báo trên bản đồ; cảnh báo, thông báo; nhật ký đăng nhập, nhật ký thao tác',
     'Ghi nhận khi dùng (trong phiên trình duyệt), kèm dữ liệu mô phỏng để trình diễn; chưa có máy chủ lưu'),
    ('L9', 'Dữ liệu nền, tham chiếu', 'Danh mục, bản đồ, số nền dùng để tính toán, đối chiếu',
     f'Danh mục {XA["total"]} xã, phường kèm dân số, diện tích (sau sắp xếp 2025, tổng {n(XA["pop"])} người); ranh giới 34 tỉnh, thành (có Hoàng Sa, Trường Sa); mã định danh 632 đơn vị của Dịch vụ công; ảnh vệ tinh nền bản đồ; bộ tiêu chí quốc gia nông thôn mới',
     'Số thật (nguồn công khai). Nền bản đồ đang tạm dùng ảnh vệ tinh, chờ bản đồ nền Việt Nam'),
]
MAP_TU = {'quốc gia': 'L1', 'ngành': 'L2 (ngành dọc Trung ương)', 'chuyên ngành': 'L3', 'Thành phố': 'L4', 'sở': 'L5 (và L3 nếu sở có CSDL riêng)'}

# Hiện trạng
HT = [
    ('T', 'Số thật', 'Số đang hiển thị lấy từ nguồn thật (file, bản xuất, số công bố chính thức)'),
    ('B', 'Bản chụp thật, phần lớn chưa có số', 'Đã lấy về từ hệ thống thật, nhưng nguồn đang trả 0 ở đa số chỉ tiêu, màn hình mặc định bật số mẫu'),
    ('K', 'Đã thử kết nối, màn hình còn mô phỏng', 'Đã gọi được hệ thống thật, chưa đưa số vào màn hình; số mô phỏng theo quy mô thật'),
    ('C', 'Mới có cấu trúc', 'Có mẫu trả về (tên trường) nhưng chưa có bản ghi; số mô phỏng'),
    ('E', 'Mô phỏng theo eform', 'Đủ trường đúng như eform của sở, số mô phỏng sát thực tế; chờ sở nhập thật'),
    ('M', 'Mô phỏng', 'Chưa có nguồn số hóa; số đặt theo báo cáo, tin công khai'),
]

# ---------- Từng đơn vị: (id, tên hiển thị, loại, nguồn gốc dữ liệu, đường vào IOC, hiện trạng) ----------
def u(i, ten, loai, goc, vao, ht):
    return [i, ten, loai, goc, vao, ht]


UNIT_TP = {
    'DANG': [
        u('dang-vptu', 'Văn phòng Thành ủy · Theo dõi nhiệm vụ', 'L4', 'Hệ thống quản lý nhiệm vụ', 'Đồng bộ', 'M'),
        u('dang-to-chuc', 'Ban Tổ chức Thành ủy', 'L6 · L2', 'Đảng viên, cán bộ, biên chế (gốc: CSDL ngành Tổ chức xây dựng Đảng)', 'CSDL/Excel nội bộ', 'M'),
        u('dang-ubkt', 'Ủy ban Kiểm tra Thành ủy', 'L6', 'Kiểm tra, giám sát, kỷ luật đảng', 'CSDL/Excel nội bộ', 'M'),
        u('dang-noi-chinh', 'Ban Nội chính Thành ủy', 'L6', 'Tiếp công dân, đơn thư, phòng chống tham nhũng', 'CSDL/Excel nội bộ', 'M'),
        u('dang-tuyen-giao', 'Ban Tuyên giáo và Dân vận Thành ủy', 'L6', 'Học tập nghị quyết, dân vận khéo, dư luận xã hội', 'CSDL/Excel nội bộ', 'M'),
    ],
    'HDND': [u('hdnd-nhiem-vu', 'HĐND · Theo dõi nhiệm vụ', 'L4', 'Hệ thống quản lý nhiệm vụ', 'Đồng bộ', 'M')] + [
        u(i, None, 'L6' + (' · L2' if i == 'hdnd-doan-dbqh' else ''), g, 'Excel/CSDL nội bộ', 'M') for i, g in (
            ('hdnd-do-thi', 'Giám sát, thẩm tra lĩnh vực đô thị'), ('hdnd-khcn-mt', 'Giám sát, thẩm tra KH&CN, môi trường'),
            ('hdnd-kt-ns', 'Thẩm tra dự toán, quyết toán ngân sách'), ('hdnd-phap-che', 'Giám sát, thẩm tra pháp chế'),
            ('hdnd-vh-xh', 'Giám sát, thẩm tra văn hóa - xã hội'), ('hdnd-vp-doan-dbqh', 'Kỳ họp, văn bản, phục vụ'),
            ('hdnd-doan-dbqh', 'Tiếp xúc cử tri, kiến nghị gửi Quốc hội'), ('hdnd-xa-phuong', 'HĐND 126 xã: kỳ họp, giám sát'),
            ('hdnd-to-tuvan', 'Tư vấn, góp ý dự thảo nghị quyết'))],
    'UBND': [u(i, None, 'L5', f'{EFORM[i]} eform', 'Eform', 'E') for i in (
        'ubnd-vhtt', 'ubnd-vpubnd', 'ubnd-bqlkcnc', 'ubnd-dulich', 'ubnd-dantoc-tongiao', 'ubnd-thanhtra', 'ubnd-khcn')] + [
        u('ubnd-nnmt', None, 'L5 · L3', f'10 eform; {FILE_THAT["ubnd-nnmt"]} chỉ tiêu số thật: giải phóng mặt bằng, thống kê đất đai', 'Eform · File', 'E · T'),
        u('ubnd-congthuong', None, 'L5', '5 eform', 'Eform', 'E'),
        u('ubnd-xaydung', None, 'L5', '4 eform', 'Eform', 'E'),
        u('ubnd-noivu', None, 'L5 · L3 · L1', f'2 eform; {FILE_THAT["ubnd-noivu"]} chỉ tiêu số thật (tuyển dụng, người có công, công chức); bảo hiểm gốc từ BHXH', 'Eform · File', 'E · T'),
        u('ubnd-yte', None, 'L5 · L1', '4 eform; hồ sơ sức khỏe điện tử gốc từ VNeID, BHYT gốc từ BHXH', 'Eform', 'E'),
        u('ubnd-taichinh', 'Sở Tài chính', 'L3 · L4', '14 API: thu chi ngân sách, vốn đầu tư, dự án trọng điểm, CPI, IIP, xuất nhập khẩu, bán lẻ, du lịch, vận tải', 'Bản chụp API nhúng sẵn', 'B'),
        u('ubnd-gddt', 'Sở Giáo dục và Đào tạo', 'L3', '18 API, dữ liệu từng trường gộp lên xã và Thành phố', 'API (chưa có số)', 'C'),
        u('ubnd-hcc', 'Trung tâm Phục vụ hành chính công', 'L4 · L1', 'Hệ thống Dịch vụ công Hà Nội (từ 07/2025 khoảng 3,85 triệu hồ sơ), liên thông Cổng DVC quốc gia', 'API', 'K'),
    ],
    'MTTQ': [u('mttq-nhiem-vu', 'MTTQ · Theo dõi nhiệm vụ', 'L4', 'Hệ thống quản lý nhiệm vụ', 'Đồng bộ', 'M'),
             u('mttq-dantoc-tongiao', None, 'L6 · L4', 'Dân tộc, tôn giáo, hội quần chúng; phản ánh qua iHanoi', 'Excel · iHanoi', 'M')] + [
        u(i, None, 'L6', g, 'Excel/CSDL nội bộ', 'M') for i, g in (
            ('mttq-quy', 'Quỹ Vì người nghèo, an sinh, Tết, biển đảo'), ('mttq-danchu-giamsat', 'Giám sát, phản biện xã hội'),
            ('mttq-cong-tac-phu-nu', 'Công tác phụ nữ'), ('mttq-cong-tac-cong-doan', 'Công tác công đoàn'),
            ('mttq-cuu-chien-binh', 'Công tác cựu chiến binh'), ('mttq-doan-thanh-thieu-nhi', 'Công tác Đoàn, thanh thiếu nhi'),
            ('mttq-cong-tac-nong-dan', 'Công tác nông dân'), ('mttq-thuong-truc', 'Hoạt động Thường trực'),
            ('mttq-to-chuc-kiem-tra', 'Tổ chức, kiểm tra'), ('mttq-hoi-lhpn', 'Hội viên, hoạt động Hội LHPN'),
            ('mttq-hoi-nong-dan-tp', 'Hội viên, hoạt động Hội Nông dân'), ('mttq-lien-doan-lao-dong', 'Đoàn viên, chăm lo người lao động'),
            ('mttq-xa-phuong', 'MTTQ 126 xã'), ('mttq-thanh-doan', 'Đoàn viên, hoạt động Thành Đoàn'), ('mttq-vp-co-quan', 'Văn phòng cơ quan'))],
}
UNIT_XA = {
    'DANG': [u('dangxa-vpdu', 'Văn phòng Đảng ủy · Theo dõi nhiệm vụ', 'L4', 'Hệ thống quản lý nhiệm vụ', 'Đồng bộ', 'M'),
             u('dangxa-tochuc', 'Công tác tổ chức xây dựng Đảng', 'L7 · L2', 'Đảng viên, tổ chức đảng của xã (gốc: CSDL ngành Tổ chức xây dựng Đảng)', 'CSDL/Excel', 'M'),
             u('dangxa-kiemtra', 'Công tác kiểm tra, giám sát', 'L7', 'UBKT Đảng ủy xã', 'CSDL/Excel', 'M'),
             u('dangxa-tuyengiao', 'Tuyên giáo và Dân vận', 'L7', 'Ban Tuyên giáo xã', 'CSDL/Excel', 'M')],
    'HDND': [u('hdndxa-nhiemvu', 'HĐND · Theo dõi nhiệm vụ', 'L4', 'Hệ thống quản lý nhiệm vụ', 'Đồng bộ', 'M'),
             u('hdndxa-tiepxuc', 'Tiếp xúc cử tri', 'L7', 'Thường trực HĐND xã', 'Excel', 'M'),
             u('hdndxa-giamsat', 'Giám sát chuyên đề', 'L7', 'Thường trực HĐND xã', 'Excel', 'M'),
             u('hdndxa-ngansach', 'Thẩm tra ngân sách', 'L7', 'Thường trực HĐND xã', 'Excel', 'M')],
    'UBND': [u('ubndxa-vp', 'Văn phòng UBND · Theo dõi nhiệm vụ', 'L4', 'Hệ thống quản lý nhiệm vụ', 'Đồng bộ', 'M'),
             u('ubndxa-diachinh', 'Địa chính - Xây dựng - Đô thị - Môi trường', 'L3 · L4', 'CSDL địa chính; phản ánh hiện trường', 'CSDL · iHanoi', 'M'),
             u('ubndxa-tuphap', 'Tư pháp - Hộ tịch', 'L2', 'CSDL hộ tịch điện tử (Bộ Tư pháp)', 'CSDL', 'M'),
             u('ubndxa-mocua', 'Bộ phận Một cửa - TTHC', 'L4', 'Dịch vụ công Hà Nội, cùng số với TT Phục vụ HCC', 'API', 'K'),
             u('ubndxa-vhxh', 'Văn hóa - Xã hội', 'L3', 'Hộ nghèo, cận nghèo, người có công (lĩnh vực LĐTBXH cũ)', 'CSDL/Excel', 'M'),
             u('ubndxa-yte', 'Trạm Y tế', 'L5 · L1', 'Số theo xã của Sở Y tế (BHYT, hồ sơ sức khỏe điện tử)', 'Eform Sở Y tế', 'E'),
             u('ubndxa-anninh', 'Công an xã - An ninh trật tự', 'L2', 'Số liệu ngành công an', 'CSDL', 'M')],
    'MTTQ': [u('mttqxa-nhiemvu', 'MTTQ · Theo dõi nhiệm vụ', 'L4', 'Hệ thống quản lý nhiệm vụ', 'Đồng bộ', 'M'),
             u('mttqxa-quyvi', 'Vận động Quỹ Vì người nghèo', 'L7', 'Ủy ban MTTQ xã', 'Excel', 'M'),
             u('mttqxa-giamsat', 'Giám sát - Phản biện xã hội', 'L7', 'Ủy ban MTTQ xã', 'Excel', 'M'),
             u('mttqxa-doanthe', 'Đoàn thể chính trị - xã hội', 'L7', 'Các đoàn thể xã', 'Excel', 'M')],
}
SO_CS = {'ubnd-taichinh': SO['stc'], 'ubnd-gddt': SO['sgd'], 'ubnd-hcc': SO['hcc']}


def name_of(i):
    if i in SEED: return SEED[i]['name'].split(' (')[0]
    return XA_SEED[i]['name'] if i in XA_SEED else i


def cs_of(i):
    return SO_CS[i] if i in SO_CS else CTM[i]['metrics']


# kiểm: bảng viết tay phủ đủ đơn vị khuôn mới
_ids = {r[0] for g in (UNIT_TP, UNIT_XA) for rows in g.values() for r in rows}
_miss = [c['id'] for c in D['ctm'] if c['id'] not in _ids]
assert not _miss, 'Thiếu phân loại cho: ' + ', '.join(_miss)

TRUC = [('DANG', 'Đảng'), ('HDND', 'HĐND'), ('UBND', 'Chính quyền (UBND)'), ('MTTQ', 'MTTQ')]
TRUC_TP = {'DANG': 'Thành ủy', 'HDND': 'HĐND Thành phố', 'UBND': 'UBND Thành phố', 'MTTQ': 'Ủy ban MTTQ Thành phố'}

# Đếm đơn vị theo loại (loại đầu tiên = loại chính; loại phụ cũng được tính "có mặt")
def count_loai():
    c = {l[0]: {'chinh': 0, 'co': 0, 'cs': 0} for l in LOAI}
    for g in (UNIT_TP, UNIT_XA):
        for rows in g.values():
            for r in rows:
                ls = [x.strip() for x in r[2].split('·')]
                c[ls[0]]['chinh'] += 1; c[ls[0]]['cs'] += cs_of(r[0])
                for x in ls: c[x]['co'] += 1
    return c


CL = count_loai()
HT_CNT = {h[0]: 0 for h in HT}
for g in (UNIT_TP, UNIT_XA):
    for rows in g.values():
        for r in rows:
            HT_CNT[r[5].split(' · ')[0]] += 1

k = Kit('Tổng hợp dữ liệu trên IOC theo loại và theo trục')
para, table, box, heading, note, bullets = k.para, k.table, k.box, k.heading, k.note, k.bullets

# ======================================================= TRANG BÌA
k.blank(3)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(3)
para('TỔNG HỢP DỮ LIỆU TRÊN IOC', 22, CENTER, 6, bold=True, color=NAVY, md=False)
k.md.title('Tổng hợp dữ liệu trên IOC theo loại và theo trục')
para('Có bao nhiêu loại dữ liệu, mỗi loại nằm ở trục nào, cấp nào, đang là số thật hay mô phỏng', 14, CENTER, 4, italic=True, color=GREY)
k.blank(3)
table([
    ['Phạm vi', f'Cấp Trung ương, cấp Thành phố Hà Nội (4 trục), {XA["total"]} xã, phường; toàn bộ chỉ tiêu và các dữ liệu khác trên IOC'],
    ['Cách đếm', 'Đọc thẳng cấu hình chỉ tiêu đang chạy trên IOC; phân loại nguồn theo ghi chú trong mã nguồn và tài liệu mô tả từng sở'],
    ['Ngày lập', '12/10/2026'],
], [3.5, 12.5], header=False, key_col=True, size=12)
k.page_break()
k.toc()
k.page_break()

# ======================================================= I. TÓM TẮT
heading('I. TÓM TẮT', 1)
bullets([
    f'Dữ liệu trên IOC chia thành **9 loại** theo nơi sinh ra dữ liệu (Bảng 1). Ứng với cách gọi thường dùng: quốc gia = L1, ngành = L2 (ngành dọc Trung ương), chuyên ngành = L3, Thành phố = L4, sở = L5; thêm 4 loại riêng của IOC: nội bộ khối Đảng, HĐND, MTTQ (L6), cấp xã (L7), phát sinh trên IOC (L8), nền tham chiếu (L9).',
    f'Dữ liệu nằm trên **4 trục × 3 cấp**: Trung ương (5 khối), Thành phố (4 trục, {TP_DV} đơn vị có chỉ tiêu, {n(TP_CS)} chỉ số), xã, phường ({XA_DV} đơn vị mỗi xã, {XA_CS} chỉ số mỗi xã, nhân {XA["total"]} xã).',
    f'Trục Chính quyền (UBND) có đủ các loại dữ liệu nhất (quốc gia, chuyên ngành, dùng chung, eform). Ba trục Đảng, HĐND, MTTQ gần như chỉ có dữ liệu nội bộ (L6) cộng phần theo dõi nhiệm vụ (L4).',
    f'Hiện trạng: **số thật mới có ở rất ít chỗ** — {FILE_THAT["ubnd-nnmt"] + FILE_THAT["ubnd-noivu"]} chỉ tiêu của Sở NN&MT, Sở Nội vụ; nhóm dự án trọng điểm của Sở Tài chính; danh mục đơn vị, người dùng; số nền 126 xã và bản đồ. Còn lại là mô phỏng (đúng khuôn, số sát thực tế) chờ nguồn thật (Bảng 6).',
    'Gần nhất để có số thật: Dịch vụ công Hà Nội (đã gọi thử được), Sở Tài chính (đã có bản chụp, chờ nguồn có số), 46 eform của 12 sở (chờ sở nhập). Xa nhất: khối Đảng, HĐND, MTTQ và cấp xã (chưa có nguồn số hóa).',
])

# ======================================================= II. 9 LOẠI DỮ LIỆU
heading('II. CÁC LOẠI DỮ LIỆU', 1)
para('Phân loại theo **nơi sinh ra dữ liệu** (chủ quản), không theo cách đưa vào IOC. Một đơn vị có thể có nhiều loại, ví dụ Sở Y tế báo cáo bằng eform (L5) nhưng số hồ sơ sức khỏe điện tử gốc từ VNeID (L1).')
heading('Bảng 1. Chín loại dữ liệu', 2)
rows = [['Mã', 'Loại dữ liệu', 'Là gì', 'Có trên IOC', 'Hiện trạng']]
for l in LOAI:
    rows.append([l[0], '**' + l[1] + '**', l[2], l[3], l[4]])
table(*drop(rows, [1.0, 2.6, 3.4, 5.4, 3.6], [4], SHOW_HIEN_TRANG_COT), size=10)
heading('Bảng 2. Số đơn vị theo loại dữ liệu', 2)
para(f'Đếm trên {TP_DV + XA_DV - 3} đơn vị dùng khuôn chỉ tiêu mới và 3 đơn vị có form riêng (Sở Tài chính, Sở GD&ĐT, TT Phục vụ HCC); cấp xã đếm một bộ {XA_DV} đơn vị (dùng chung cho cả {XA["total"]} xã). Cấp Trung ương tính riêng ở Bảng 4.')
rows = [['Mã', 'Loại dữ liệu', 'Là loại chính của', 'Có mặt ở' if SHOW_LOAI_CHINH else 'Số đơn vị có loại dữ liệu này', 'Số chỉ số (loại chính)']]
for l in LOAI:
    c = CL[l[0]]
    rows.append([l[0], l[1], f'{c["chinh"]} đơn vị' if c['chinh'] else '—', f'{c["co"]} đơn vị' if c['co'] else 'Mọi đơn vị (không gắn chỉ tiêu)', n(c['cs']) if c['cs'] else '—'])
table(*drop(rows, [1.0, 5.4, 3.2, 3.6, 2.8], [2, 4], SHOW_LOAI_CHINH), size=11)
note('L8, L9 không gắn với chỉ tiêu cụ thể nên không có trong cột đếm; chi tiết ở Bảng 7.')

# ======================================================= III. MA TRẬN LOẠI × TRỤC
heading('III. DỮ LIỆU NẰM Ở TRỤC NÀO', 1)
heading('Bảng 3. Ma trận loại dữ liệu × trục', 2)
para('Mỗi ô ghi dữ liệu loại đó ở trục đó, theo cấp (TW = Trung ương, TP = Thành phố, Xã = cấp xã). Ô «—» là trục đó không có loại dữ liệu này.')
M = {
    'L1': ['TW: CSDL quốc gia về công tác xây dựng Đảng (đang triển khai, chưa nối)', '—',
           'TW: Cổng DVC quốc gia (1 chỉ tiêu). TP: VNeID, BHYT, BHXH qua Sở Y tế, Sở Nội vụ; DVC quốc gia qua TT HCC. Xã: Trạm Y tế', '—'],
    'L2': [f'TW: ngành Tổ chức xây dựng Đảng ({TW["TW_DANG"][0]} đơn vị, {TW["TW_DANG"][1]} chỉ tiêu). TP, Xã: đảng viên, cán bộ qua Ban Tổ chức',
           f'TW: Quốc hội ({TW["TW_QH"][1]} chỉ tiêu). TP: Đoàn ĐBQH',
           f'TW: Chính phủ ({TW["TW_CP"][1]}), Chủ tịch nước ({TW["TW_CTN"][1]}). Xã: hộ tịch, công an', f'TW: MTTQ Trung ương ({TW["TW_MTTQ"][1]} chỉ tiêu)'],
    'L3': ['—', '—', 'TP: Sở Tài chính, Sở GD&ĐT, đất đai, GPMB, Sở Nội vụ. Xã: địa chính, LĐTBXH', '—'],
    'L4': ['TP, Xã: theo dõi nhiệm vụ', 'TP, Xã: theo dõi nhiệm vụ',
           'TP: Dịch vụ công Hà Nội (TT HCC), số KT-XH tổng hợp (qua Sở Tài chính). Xã: Một cửa, nhiệm vụ, phản ánh hiện trường', 'TP, Xã: theo dõi nhiệm vụ; TP: iHanoi'],
    'L5': ['—', '—', f'TP: {N_SO_EFORM} sở, {N_EFORM} eform. Xã: Trạm Y tế (số Sở Y tế theo xã)', '—'],
    'L6': ['TP: 4 ban', 'TP: 9 ban, đơn vị', '—', 'TP: 16 ban, tổ chức (gồm Hội LHPN, Hội Nông dân, LĐLĐ, Thành Đoàn)'],
    'L7': ['Xã: tổ chức đảng, kiểm tra, tuyên giáo', 'Xã: tiếp xúc cử tri, giám sát, ngân sách', 'Xã: xem L2–L5 (số xã của sở, ngành)', 'Xã: quỹ Vì người nghèo, giám sát, đoàn thể'],
    'L8': ['Mọi cấp', 'Mọi cấp', 'Mọi cấp', 'Mọi cấp'],
    'L9': ['TW: bản đồ 34 tỉnh', 'Xã: danh mục, dân số', 'TP, Xã: danh mục xã, bản đồ, mã định danh DVC', 'Xã: danh mục, dân số'],
}
rows = [['Loại', 'Đảng', 'HĐND', 'Chính quyền (UBND)', 'MTTQ']]
for l in LOAI:
    rows.append(['**' + l[0] + '** ' + l[1]] + M[l[0]])
table(rows, [2.8, 3.3, 2.9, 4.0, 3.0], size=9.5)

heading('Bảng 4. Tổng hợp theo trục và cấp', 2)
para('«Chỉ số» là số dòng số liệu trên màn chi tiết (gồm cả chỉ số thành phần). Cấp Trung ương đếm theo chỉ tiêu (khuôn cũ). Cột «Đánh giá» để trống cho người đánh giá ghi.')
rows = [['Cấp', 'Trục', 'Đơn vị có chỉ tiêu', 'Chỉ số', 'Loại dữ liệu chính', 'Hiện trạng', 'Đánh giá']]
TWROW = [('Đảng', 'BCH Trung ương (Ban Tổ chức TW)', TW['TW_DANG'], 'L2'),
         ('HĐND', 'Quốc hội', TW['TW_QH'], 'L2'),
         ('Chính quyền', 'Chính phủ, Chủ tịch nước', (TW['TW_CP'][0] + TW['TW_CTN'][0], TW['TW_CP'][1] + TW['TW_CTN'][1]), 'L2, L1'),
         ('MTTQ', 'MTTQ Trung ương', TW['TW_MTTQ'], 'L2')]
for t, ten, v, l in TWROW:
    rows.append(['Trung ương', f'{t}: {ten}', str(v[0]), str(v[1]), l, 'M', ''])
LOAI_TP = {'DANG': 'L6, L4', 'HDND': 'L6, L4', 'UBND': 'L5, L3, L4, L1', 'MTTQ': 'L6, L4'}
HT_TP = {'DANG': 'M', 'HDND': 'M', 'UBND': 'E (12 sở), B, C, K, một phần T', 'MTTQ': 'M'}
for r, t in TRUC:
    extra = f' (+{len(UBND_TRONG)} chưa có)' if r == 'UBND' else ''
    rows.append(['Thành phố', TRUC_TP[r], f'{TP[r][0]}{extra}', n(TP[r][1]), LOAI_TP[r], HT_TP[r], ''])
LOAI_XA = {'DANG': 'L7, L4', 'HDND': 'L7, L4', 'UBND': 'L2, L3, L4, L5', 'MTTQ': 'L7, L4'}
HT_XA = {'DANG': 'M', 'HDND': 'M', 'UBND': 'M, K (Một cửa), E (Trạm Y tế)', 'MTTQ': 'M'}
for r, t in TRUC:
    rows.append([f'Xã ({XA["total"]})', t, str(XAS[r][0]), str(XAS[r][1]), LOAI_XA[r], HT_XA[r], ''])
rows.append(['**Cộng**', '', f'**TW {TW_DV} · TP {TP_DV} · Xã {XA_DV}**', f'**{TW_CS} · {n(TP_CS)} · {XA_CS}**', '', '', ''])
rows, wd = drop(rows, [2.0, 3.6, 2.4, 1.6, 2.2, 2.6, 1.6], [4], SHOW_LOAI_CHINH)
if not SHOW_HIEN_TRANG_COT:
    rows, wd = drop(rows, wd, [len(wd) - 2], False)
table(rows, wd, size=9.5)
note(f'UBND Thành phố chưa có chỉ tiêu: {", ".join(UBND_TRONG)}. Cấp xã: mỗi xã cùng một bộ {XA_DV} đơn vị, số riêng từng xã.')

# ======================================================= IV. CHI TIẾT TỪNG ĐƠN VỊ
heading('IV. CHI TIẾT TỪNG ĐƠN VỊ', 1)
para('Mã loại xem Bảng 1.' + (' Mã hiện trạng xem Bảng 6.' if SHOW_HIEN_TRANG_COT else '') + (' Loại ghi trước là loại chính.' if SHOW_LOAI_CHINH else ''))
TBN = 5
for scope, units, cap in ((UNIT_TP, None, 'Thành phố'), (UNIT_XA, None, 'xã, phường')):
    for r, t in TRUC:
        title = (TRUC_TP[r] if cap == 'Thành phố' else f'{t} cấp xã, phường')
        heading(f'Bảng {TBN}.{["DANG","HDND","UBND","MTTQ"].index(r) + (1 if cap == "Thành phố" else 5)}. {title}', 2)
        rows = [['Đơn vị', 'Loại', 'Dữ liệu, nguồn gốc', 'Đường vào IOC', 'Chỉ số', 'Hiện trạng']]
        for x in scope[r]:
            rows.append([x[1] or name_of(x[0]), x[2], x[3], x[4], str(cs_of(x[0])), x[5]])
        table(*drop(rows, [4.2, 1.7, 5.1, 2.3, 1.2, 1.5], [5], SHOW_HIEN_TRANG_COT), size=9.5)
        if r == 'UBND' and cap == 'Thành phố':
            note(f'Chưa có chỉ tiêu: {", ".join(UBND_TRONG)}.')

# ======================================================= V. HIỆN TRẠNG
heading('V. HIỆN TRẠNG: SỐ THẬT HAY MÔ PHỎNG', 1)
heading('Bảng 6. Mức sẵn sàng của dữ liệu', 2)
WHERE = {
    'T': f'{FILE_THAT["ubnd-nnmt"]} chỉ tiêu Sở NN&MT (GPMB, đất đai), {FILE_THAT["ubnd-noivu"]} chỉ tiêu Sở Nội vụ; nhóm dự án trọng điểm Sở Tài chính; danh mục 3.612 đơn vị, 12.577 người dùng; số nền 126 xã; ranh giới 34 tỉnh; mã định danh 632 đơn vị',
    'B': f'Sở Tài chính: {SO["stc"]} chỉ tiêu từ 14 API, bản chụp quý I/2026; 13 API đang trả 0',
    'K': f'TT Phục vụ HCC ({SO["hcc"]} chỉ tiêu) và Một cửa cấp xã: Dịch vụ công Hà Nội đã gọi thử được (trừ 1 loại số liệu)',
    'C': f'Sở GD&ĐT: {SO["sgd"]} chỉ tiêu, 18 API mới có cấu trúc',
    'E': f'{N_SO_EFORM} sở, ngành, {N_EFORM} eform, {n(EF_CS)} chỉ số; Trạm Y tế cấp xã',
    'M': 'Toàn bộ Thành ủy, HĐND, MTTQ Thành phố; phần lớn cấp xã; cấp Trung ương; nhiệm vụ, văn bản, lịch, bản đồ sự kiện',
}
rows = [['Mã', 'Mức', 'Nghĩa', 'Ở đâu', 'Số đơn vị']]
for h in HT:
    rows.append([h[0], '**' + h[1] + '**', h[2], WHERE[h[0]], str(HT_CNT[h[0]]) if HT_CNT[h[0]] else '—'])
table(rows, [1.0, 3.0, 4.2, 6.2, 1.6], size=10)
note('Cột «Số đơn vị» đếm theo hiện trạng chính của đơn vị (Thành phố và một bộ cấp xã), chưa gồm cấp Trung ương; đơn vị có một phần số thật (Sở NN&MT, Sở Nội vụ) tính ở mức E.')

# ======================================================= VI. DỮ LIỆU NGOÀI CHỈ TIÊU
heading('VI. DỮ LIỆU NGOÀI CHỈ TIÊU', 1)
heading('Bảng 7. Dữ liệu dùng chung, phát sinh trên IOC và dữ liệu nền', 2)
rows = [['Dữ liệu', 'Loại', 'Trục', 'Quy mô', 'Hiện trạng']]
rows += [
    ['Danh mục đơn vị, người dùng', 'L4', 'Cả 4 trục', '3.612 đơn vị (6 cấp), 12.577 tài khoản Thành phố Hà Nội', 'T (bản xuất từ hệ thống quản trị); Trung ương mô phỏng'],
    ['Nhiệm vụ: giao, nhận, phối hợp, theo dõi', 'L4 · L8', 'Cả 4 trục, mọi cấp', 'Theo dõi 6 trạng thái; Ban Tổ chức TW kiểm đếm 47 nhiệm vụ', 'M (giao mới trên IOC: ghi trong phiên)'],
    ['Văn bản đến, đi; minh chứng', 'L4', 'Cả 4 trục', 'Theo đơn vị', 'M'],
    ['Lịch công tác, kỳ họp', 'L4', 'Cả 4 trục', 'Đảng ủy, HĐND, UBND, MTTQ', 'M'],
    ['Bản đồ sự kiện hiện trường', 'L4 · L8', 'UBND (giao xử lý), xem được ở mọi trục', '9 loại: trật tự đô thị, ùn tắc, môi trường, an toàn thực phẩm, ngập, cháy nổ, thiên tai, an ninh, sự cố xã hội', 'M (25 điểm mẫu ở vị trí thật + người dùng tự báo)'],
    ['Cảnh báo, thông báo', 'L8', 'Cả 4 trục', 'Quá hạn, sắp hạn, điểm nghẽn, nhắc họp', 'M'],
    ['Nhật ký đăng nhập, nhật ký thao tác', 'L8', 'Cả 4 trục', 'Giữ 365 ngày', 'Ghi khi dùng + mô phỏng'],
    ['Bản đồ 34 tỉnh, thành', 'L9 · L2', 'Đảng (Ban Tổ chức TW)', 'Có Hoàng Sa, Trường Sa; tô màu theo đảng viên, văn bản', 'T (ranh giới); số đảng viên, văn bản: M'],
    [f'Danh mục {XA["total"]} xã, phường', 'L9', 'Cả 4 trục cấp xã', f'{XA["phuong"]} phường, {XA["xa"]} xã; dân số, diện tích', 'T'],
    ['Nền bản đồ GIS', 'L9', 'Mọi trục', 'Ảnh vệ tinh (tạm)', 'Chờ bản đồ nền Việt Nam'],
]
table(*drop(rows, [3.6, 1.6, 3.0, 4.6, 3.2], [4], SHOW_HIEN_TRANG_COT), size=9.5)

# ======================================================= VII. NHẬN XÉT
heading('VII. NHẬN XÉT ĐỂ ĐÁNH GIÁ', 1)
bullets([
    '**Trục lệch nhau về loại dữ liệu.** UBND có 6 loại (L1–L5, L7), có kết nối hệ thống; Đảng, HĐND, MTTQ chủ yếu là L6 nội bộ, chưa có nguồn số hóa — đây là phần cần quyết định cách lấy (eform như 12 sở, hay nhập Excel).',
    '**Dữ liệu quốc gia chưa nối thẳng.** VNeID, BHXH, BHYT, Cổng DVC quốc gia chỉ đi gián tiếp qua sở. Nếu cần số theo thời gian thực phải làm việc với chủ quản quốc gia.',
    '**Cấp xã phụ thuộc cấp Thành phố.** Số xã hiện là số Thành phố chia theo quy mô từng xã; khi có nguồn thật, nên lấy số xã từ hệ thống của sở (Dịch vụ công, Sở Y tế, Sở GD&ĐT đều có số theo xã) thay vì chia.',
    '**Một số liệu, một nguồn.** Đã chốt: hồ sơ TTHC lấy theo TT Phục vụ HCC; BHYT và hồ sơ sức khỏe điện tử lấy theo Sở Y tế. Số hồ sơ trong báo cáo eform của VP UBND vẫn ghi riêng, khác nguồn.',
    f'**Còn trống:** {", ".join(UBND_TRONG)} chưa có chỉ tiêu; cấp Trung ương có {TW_DV} đơn vị có số mô phỏng, các khối khác ngoài Ban Tổ chức TW mới có 1–2 nhóm chỉ tiêu.',
    '**Thứ tự gần có số thật:** Dịch vụ công Hà Nội → Sở Tài chính → 46 eform của 12 sở → Sở GD&ĐT → khối Đảng, HĐND, MTTQ → cấp Trung ương.',
])

docx, md = k.save(OUT)
print(docx); print(md)
print('TP', TP, 'XA', XAS, 'TW', TW, 'CL', {x: CL[x] for x in CL}, 'HT', HT_CNT)
