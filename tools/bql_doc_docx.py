# -*- coding: utf-8 -*-
"""Sinh docs/BQL_BanQuanLyKCNC_KCN/BQL_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 3 chỉ tiêu của Ban Quản lý các Khu công nghệ cao
và Khu công nghiệp thành phố trên IOC (biểu đồ, trường, cách tính, đề nghị xác nhận).
Chạy từ thư mục gốc ioc:  python tools/bql_doc_docx.py
Lời văn viết tay trong script; CÁC CON SỐ đọc thẳng từ js/core/bql-config.js (qua node) nên luôn khớp giao diện.
Tên trường viết đúng như file mô tả đầu vào eform (tools/bql-fields.json, trích từ sheet "Ban Quản lý Khu công nghệ cao và khu
công nghiệp thành phố"). Word + Markdown cùng sinh một lần qua tools/doc_kit.py.
Sau khi sinh, cập nhật Mục lục bằng Word: tools/vhtt_doc_finalize.ps1 -Docx <đường dẫn .docx> (dùng chung)."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIELDS = json.load(open(os.path.join(ROOT, 'tools', 'bql-fields.json'), encoding='utf-8'))[0]
OUT = os.path.join(ROOT, 'docs', 'BQL_BanQuanLyKCNC_KCN', 'BQL_MO_TA_CHI_TIEU.docx')

# ---------- Số liệu: chạy bql-config.js và lấy danh mục 126 phường/xã từ vpub-config.js ----------
_JS = ("const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
       "vm.runInContext(fs.readFileSync('js/core/bql-config.js','utf8')+fs.readFileSync('js/core/vpub-config.js','utf8')+"
       "';this.S=BQL_SUM;this.U=BQL_UNITS;this.DB=BQL_DB;this.HT=BQL_HT;this.MT=BQL_MT;this.DT=BQL_DOI_TAC;this.DV=VPUB_DV;',c);"
       "process.stdout.write(JSON.stringify({S:c.S,U:c.U,DB:c.DB,HT:c.HT,MT:c.MT,DT:c.DT,DV:c.DV}));")
_J = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))
S, U, DB, HT, MT, DT, DV = _J['S'], _J['U'], _J['DB'], [x[0] for x in _J['HT']], [x[0] for x in _J['MT']], [x[0] for x in _J['DT']], _J['DV']


def n(x, d=0):
    """Số kiểu Việt Nam: 1.234.567,8"""
    s = f'{abs(x):,.{d}f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return ('−' if x < 0 else '') + s
def pc(a, b, d=1): return n(a / b * 100, d) + '%'
def ssum(a): return sum(a)


Q3 = 2
QN = ['Quý I', 'Quý II', 'Quý III']
s1, s2, s3 = S['dn'], S['thuHut'], S['sxkd']
NDB, NDV = S['db'], len(DV)
UB = {u['ten']: u for u in U}
EFORM = FIELDS['eform']
N_FIELDS = len(FIELDS['fields'])
DON_VI = 'Ban Quản lý các Khu công nghệ cao và Khu công nghiệp thành phố Hà Nội'

k = Kit('Ban Quản lý các Khu công nghệ cao và Khu công nghiệp thành phố · Mô tả chỉ tiêu trên IOC')
para, table, box, heading, note = k.para, k.table, k.box, k.heading, k.note

# ======================================================= TRANG BÌA (tên đơn vị dài 2 dòng nên ít dòng trống hơn VPUB để bảng không tràn trang)
k.blank(3)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(3)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY)
para('BAN QUẢN LÝ CÁC KHU CÔNG NGHỆ CAO VÀ KHU CÔNG NGHIỆP THÀNH PHỐ HÀ NỘI', 17, CENTER, 14, bold=True, color=NAVY, md=False)
k.md.title('Ban Quản lý các Khu công nghệ cao và Khu công nghiệp thành phố Hà Nội')
para('Biểu đồ, trường dữ liệu và cách tính số liệu của 3 chỉ tiêu trên IOC', 14, CENTER, 4, italic=True, color=GREY)
para('xây dựng từ eform nhập liệu của Ban', 14, CENTER, 0, italic=True, color=GREY)
k.blank(3)
table([
    ['Đơn vị', DON_VI],
    ['Nguồn dữ liệu', f'File mô tả đầu vào eform, sheet "Ban Quản lý Khu công nghệ cao và khu công nghiệp thành phố": 1 eform "{EFORM}", {N_FIELDS} trường nhập'],
    ['Phạm vi', '3 chỉ tiêu, 9 biểu đồ, 1 khối danh sách nội dung, bảng 126 phường/xã'],
    ['Số liệu ví dụ', f'Số giả lập (chưa có số liệu thật) của {NDB} địa bàn có khu, kỳ quý III và 9 tháng năm 2026'],
    ['Phiên bản', '1.2 · ngày 13/10/2026 (theo phản hồi nhóm triển khai khi nối eform thật: thêm quy ước xử lý dữ liệu eform — khóa bản ghi, cách lấy theo kỳ, chỉ hiện số có trường trong eform)'],
], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()

# ======================================================= MỤC LỤC
k.toc()
k.page_break()

# ======================================================= PHẦN I
heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Mục đích tài liệu', 2)
para('Tài liệu mô tả cách IOC dựng các chỉ tiêu của Ban Quản lý các Khu công nghệ cao và Khu công nghiệp thành phố từ eform nhập liệu của Ban: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào của eform, mỗi trường dùng để làm gì, và mỗi con số được cộng, đếm, tính toán ra sao. Tên trường viết đúng như trong file mô tả đầu vào eform để cán bộ nhập liệu và đội kỹ thuật cùng đối chiếu.')
SHOW_NOTE_BOX = False  # khối "Lưu ý, đề nghị Ban xác nhận" cuối mỗi chỉ tiêu — ẩn theo yêu cầu 14/10/2026; nội dung vẫn gom vào Phần IV
para('Trên giao diện IOC, mỗi chỉ tiêu chỉ gồm **thẻ số tổng hợp** và **biểu đồ**; cách tính từng số chỉ trình bày trong tài liệu này. '
     + ('Cuối mỗi chỉ tiêu có mục **"Lưu ý, đề nghị Ban xác nhận"**; Phần IV gom toàn bộ các đề nghị đó vào một bảng để tiện rà soát.' if SHOW_NOTE_BOX else 'Các đề nghị Ban xác nhận được gom vào một bảng ở Phần IV để tiện rà soát.'))
box(['Mọi con số ví dụ trong tài liệu là **số giả lập** dùng để dựng giao diện, đã được cộng kiểm cho khớp (tổng luôn bằng cộng các phần, số toàn Thành phố bằng cộng các địa bàn). Khi có số liệu thật, cách tính giữ nguyên, chỉ thay số.'], k.NOTE_FILL, 'Lưu ý: ')

heading('2. Một eform, ba chỉ tiêu', 2)
para(f'Ban chỉ có **một eform** "{EFORM}" với {N_FIELDS} trường. Mỗi bản ghi là số liệu của **một địa bàn** (phường/xã) trong **một kỳ báo cáo**. Eform gộp nhiều nhóm thông tin khác nhau, nên IOC tách thành 3 chỉ tiêu cùng đọc chung eform này:')
table([
    ['#', 'Chỉ tiêu trên IOC', 'Các trường của eform'],
    ['1', 'Doanh nghiệp, vốn đầu tư đăng ký và lao động trong các khu', ['«Số doanh nghiệp đang hoạt động», «Tổng vốn đầu tư đăng ký (tỷ đồng)», «Số lao động đang làm việc», «Đối tác/nhà đầu tư chính»']],
    ['2', 'Thu hút đầu tư, thành lập và điều chỉnh trong các khu', ['«Số lượng thành lập, điều chỉnh trong kỳ», «Số dự án thu hút đầu tư mới trong kỳ», «Tổng vốn thu hút đầu tư mới (tỷ đồng)», «Nội dung thành lập/điều chỉnh gần nhất»']],
    ['3', 'Đầu tư hạ tầng, sản xuất kinh doanh và bảo vệ môi trường trong các khu', ['«Vốn đầu tư hạ tầng trong kỳ (tỷ đồng)», «Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng)», «Tình hình đầu tư kết cấu hạ tầng», «Đạt chuẩn môi trường», «Tình hình bảo vệ môi trường»']],
], [0.8, 5.6, 9.6], size=11)
para('Năm trường dùng chung cho cả 3 chỉ tiêu: «Kỳ báo cáo», «Năm», «Quý», «Tháng» (chọn kỳ) và «Địa bàn» (đơn vị của bản ghi).')
note('Bộ chỉ tiêu cũ của Ban (STT 9 "Khu công nghiệp, khu chế xuất, khu kinh tế" và STT 10 "Khu Công nghệ cao", nguồn File) đã được thay bằng bộ này và đã xóa khỏi IOC. Eform mới không có trường cho biết bản ghi thuộc khu nào, nên IOC chưa tách riêng được khu công nghiệp và khu công nghệ cao như bộ cũ (xem đề nghị ở Chỉ tiêu 1).')

heading('3. Kỳ báo cáo: số tại thời điểm và số trong kỳ', 2)
para('IOC dùng «Kỳ báo cáo» (Tháng / Quý / Năm), «Năm», «Quý», «Tháng» để chọn bản ghi thuộc kỳ đang xem. Các trường số của eform chia làm hai loại, lấy theo kỳ khác nhau:')
table([
    ['Loại số', 'Các trường', 'Cách lấy theo kỳ'],
    ['**Số tại thời điểm**', ['«Số doanh nghiệp đang hoạt động»', '«Tổng vốn đầu tư đăng ký (tỷ đồng)»', '«Số lao động đang làm việc»', '«Tình hình đầu tư kết cấu hạ tầng»', '«Đạt chuẩn môi trường»'],
     'Là số đang có tại cuối kỳ. Chỉ lấy bản ghi của **quý đang xem** (mặc định quý III/2026, tức tại 30/9/2026), **không cộng** các quý với nhau. Nếu địa bàn báo cáo theo tháng thì lấy bản ghi của tháng cuối quý.'],
    ['**Số phát sinh trong kỳ**', ['«Số lượng thành lập, điều chỉnh trong kỳ»', '«Số dự án thu hút đầu tư mới trong kỳ»', '«Tổng vốn thu hút đầu tư mới (tỷ đồng)»', '«Vốn đầu tư hạ tầng trong kỳ (tỷ đồng)»', '«Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng)»'],
     '**Cộng** các kỳ từ đầu năm đến kỳ đang xem (mặc định quý I + II + III = 9 tháng năm 2026). Nếu địa bàn báo cáo theo tháng thì cộng các tháng.'],
], [3.2, 6.6, 6.2], size=10.5)
box([f'Số doanh nghiệp quý I, II, III lần lượt là {n(s1["dnQ"][0])}, {n(s1["dnQ"][1])}, {n(s1["dnQ"][2])}. Số hiển thị là **{n(s1["dn"])}** (quý III), không phải {n(ssum(s1["dnQ"]))} (cộng 3 quý). '
     f'Ngược lại, số dự án mới là {n(s2["daQ"][0])} + {n(s2["daQ"][1])} + {n(s2["daQ"][2])} = **{n(s2["da"])}** dự án trong 9 tháng.'], k.FORM_FILL, 'Ví dụ: ')

heading('4. Các phép tính dùng trong tài liệu', 2)
table([
    ['Ký hiệu', 'Ý nghĩa', 'Ví dụ'],
    ['ĐẾM(điều kiện)', 'Đếm số địa bàn (bản ghi) thỏa điều kiện', 'ĐẾM(«Đạt chuẩn môi trường» = Đạt chuẩn)'],
    ['TỔNG(«trường»)', 'Cộng giá trị của trường trên các bản ghi được lấy', 'TỔNG(«Số lao động đang làm việc»)'],
    ['Nhóm theo «trường»', 'Chia bản ghi thành từng nhóm theo giá trị của trường, rồi đếm / cộng trong từng nhóm', 'Nhóm theo «Địa bàn»'],
    ['Tỷ lệ (%)', 'Tử số ÷ Mẫu số × 100, làm tròn 1 chữ số thập phân', f'{s3["mt"][0]} ÷ {NDB} × 100 = {pc(s3["mt"][0], NDB)}'],
    ['Bình quân', 'Tổng ÷ số lượng; tính từ hai số đã cộng, không lấy trung bình các địa bàn', f'{n(s1["ld"])} lao động ÷ {n(s1["dn"])} doanh nghiệp = {n(s1["ldBq"])} người'],
], [3.6, 6.6, 5.8])

heading('5. Vai trò của trường trong cách tính', 2)
para('Ở mỗi chỉ tiêu, bảng "Trường dữ liệu sử dụng" ghi rõ vai trò của từng trường:')
table([
    ['Vai trò', 'Giải thích'],
    ['Lọc kỳ', 'Chọn bản ghi thuộc kỳ đang xem.'],
    ['Khóa', 'Nhận diện một bản ghi (một địa bàn trong một kỳ), dùng để đếm và chống đếm trùng.'],
    ['Điều kiện', 'Quyết định bản ghi có được tính hay không, hoặc thuộc nhóm nào.'],
    ['Nhóm', 'Tạo các cột / lát cắt / hàng của biểu đồ.'],
    ['Cộng', 'Giá trị số được cộng lại để ra con số hiển thị.'],
    ['Xem', 'Trường chữ, không tính toán; hiện nguyên văn để xem chi tiết.'],
], [3.6, 12.4], key_col=True)

heading('6. Địa bàn', 2)
para(f'Danh mục «Địa bàn» của eform gồm đúng **{NDV} phường/xã** ({sum(1 for x in DV if x.startswith("Phường"))} phường, {sum(1 for x in DV if x.startswith("Xã"))} xã). Chỉ những địa bàn có khu công nghiệp, khu chế xuất, khu kinh tế hoặc khu công nghệ cao mới có số để báo cáo. Trong số giả lập có **{NDB} địa bàn** có báo cáo, phần lớn là xã ngoại thành, nơi tập trung các khu:')
para(', '.join(r[0] for r in DB) + '.', 12)
para(f'Bảng bên phải của IOC vẫn hiện đủ {NDV} phường/xã (Phần III); địa bàn không có khu để dấu "—". Các biểu đồ theo địa bàn chỉ vẽ những địa bàn có số liệu.')

heading('7. Cách đọc biểu đồ theo địa bàn', 2)
para('Mỗi chỉ tiêu có một biểu đồ **theo địa bàn** ghép hai số của cùng một địa bàn trên cùng một hàng: hai biểu đồ cột ngang đặt cạnh nhau, dùng chung thứ tự hàng. Hai số này chênh nhau rất xa về độ lớn (ví dụ doanh nghiệp khoảng 100, vốn đăng ký hàng chục nghìn tỷ đồng), nên **mỗi cột có thang đo riêng**, không vẽ chung một trục để tránh đọc sai.')
k.bullets(['Hàng xếp theo số của **cột trái**, từ lớn xuống.',
           'Tên địa bàn ghi ở cột trái, viết tắt "X." là xã, "P." là phường.',
           'Số chính xác ghi ở đầu mỗi cột; di chuột vào một hàng hiện đủ 2 số và tên đầy đủ của địa bàn.',
           'So độ dài cột **trong cùng một bên** (trái với trái, phải với phải); không so cột trái với cột phải.',
           'Bấm vào biểu đồ thì ô bên phải hiện bảng số đủ 2 cột của biểu đồ đó.'])

heading('8. Tổng hợp 3 chỉ tiêu', 2)
table([
    ['#', 'Chỉ tiêu trên IOC', 'Kỳ hiển thị', 'Thẻ số', 'Biểu đồ'],
    ['1', 'Doanh nghiệp, vốn đầu tư đăng ký và lao động trong các khu', 'Quý III/2026 (tại 30/9/2026)', '5', '3'],
    ['2', 'Thu hút đầu tư, thành lập và điều chỉnh trong các khu', '9 tháng năm 2026', '4', '2 + 1 khối danh sách'],
    ['3', 'Đầu tư hạ tầng, sản xuất kinh doanh và bảo vệ môi trường trong các khu', '9 tháng năm 2026; hạ tầng, môi trường theo quý III', '5', '4'],
], [0.8, 6.6, 4.0, 1.6, 3.0], size=10.5)

# ======================================================= PHẦN II
k.page_break()
heading('PHẦN II. CHI TIẾT 3 CHỈ TIÊU', 1)
note('Mỗi chỉ tiêu được trình bày theo cùng một khuôn: (1) Thông tin chung · (2) Trường dữ liệu sử dụng · (3) Thẻ số tổng hợp · (4) Từng biểu đồ' + (' · (5) Lưu ý, đề nghị Ban xác nhận' if SHOW_NOTE_BOX else '') + '.')

USE_W = [0.8, 5.4, 2.0, 2.3, 5.5]
def fields_table(rows, unused):
    data = [['#', 'Tên trường (đúng như eform)', 'Kiểu nhập', 'Vai trò', 'Dùng để']]
    for i, r in enumerate(rows): data.append([str(i + 1)] + list(r))
    table(data, USE_W, size=10.5)
    if unused:
        para('**Trường của eform không dùng ở chỉ tiêu này** (thuộc chỉ tiêu khác hoặc chỉ để xem): ' + ', '.join('«' + x + '»' for x in unused) + '.', 11.5, color=GREY)

def kpi_table(rows):
    table([['Thẻ số', 'Công thức', 'Kết quả (giả lập)']] + rows, [3.6, 8.2, 4.2], size=11, keep=True)

def chart(code, title, kind, axis, value, formula, example, note_=None):
    heading(f'Biểu đồ {code}. {title}', 3)
    rows = [['Loại biểu đồ', kind], ['Trục / nhóm', axis], ['Giá trị hiển thị', value], ['Cách tính', formula], ['Ví dụ (giả lập)', example]]
    if note_: rows.append(['Ghi chú', note_])
    table(rows, [3.4, 12.6], header=False, size=11.5, key_col=True, keep=True)

def info_table(rows):
    table(rows, [4.0, 12.0], header=False, size=11.5, key_col=True, keep=True)

ALL_NOTES = []
def notes(ct, items):
    if SHOW_NOTE_BOX: box(['• ' + x for x in items], k.NOTE_FILL, 'Lưu ý, đề nghị Ban xác nhận', 12)
    ALL_NOTES.extend((ct, x) for x in items)

KY = [[['Kỳ báo cáo, Năm,', 'Quý, Tháng'], 'Danh mục / Số', 'Lọc kỳ', None]]
def ky(txt): return [[KY[0][0], KY[0][1], KY[0][2], txt]]
DIA_BAN = ['Địa bàn', 'Danh mục', 'Khóa, Nhóm', None]
def dia_ban(txt): return [DIA_BAN[0], DIA_BAN[1], DIA_BAN[2], txt]
ALL_NAMES = [f[0] for f in FIELDS['fields']]
def others(used): return [x for x in ALL_NAMES if x not in used and x not in ('Kỳ báo cáo', 'Năm', 'Quý', 'Tháng', 'Địa bàn')]

def top(rows, m=3, unit=''):
    return ' · '.join(f'{r[0]} {n(r[1])}{unit}' for r in rows[:m])

# ---------------- CHỈ TIÊU 1
heading('Chỉ tiêu 1. Doanh nghiệp, vốn đầu tư đăng ký và lao động trong các khu', 2)
heading('1.1. Thông tin chung', 3)
info_table([
    ['Eform nguồn', EFORM],
    ['Một bản ghi là', 'Số liệu một kỳ của một địa bàn'],
    ['Cách lấy theo kỳ', '**Số tại thời điểm.** Lấy bản ghi của quý đang xem, không cộng các quý (Phần I, mục 3).'],
    ['Kỳ hiển thị', f'Quý III/2026 (tại 30/9/2026) · {NDB} bản ghi ({NDB} địa bàn)'],
])
heading('1.2. Trường dữ liệu sử dụng', 3)
U1 = ['Số doanh nghiệp đang hoạt động', 'Tổng vốn đầu tư đăng ký (tỷ đồng)', 'Số lao động đang làm việc', 'Đối tác/nhà đầu tư chính']
fields_table(ky('Chọn bản ghi của quý đang xem; «Quý» còn là trục của biểu đồ 1.1') + [
    dia_ban('Mỗi địa bàn một bản ghi; hàng của biểu đồ 1.2 và bảng phường/xã'),
    ['Số doanh nghiệp đang hoạt động', 'Số', 'Cộng', 'Thẻ số; cột của biểu đồ 1.1; cột trái biểu đồ 1.2'],
    ['Tổng vốn đầu tư đăng ký (tỷ đồng)', 'Số', 'Cộng', 'Thẻ số; cột phải biểu đồ 1.2'],
    ['Số lao động đang làm việc', 'Số', 'Cộng', 'Thẻ số; đường của biểu đồ 1.1; mẫu số doanh thu bình quân (chỉ tiêu 3)'],
    ['Đối tác/nhà đầu tư chính', 'Chữ', 'Nhóm', 'Dò tên nhóm nhà đầu tư trong nội dung: biểu đồ 1.3'],
], others(U1))
heading('1.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Doanh nghiệp đang hoạt động', 'TỔNG(«Số doanh nghiệp đang hoạt động») quý III; dòng phụ = quý III − quý II', f'{n(s1["dn"])} (+{n(s1["dnQ"][2] - s1["dnQ"][1])})'],
    ['Vốn đầu tư đăng ký', 'TỔNG(«Tổng vốn đầu tư đăng ký (tỷ đồng)») quý III', f'{n(s1["von"])} tỷ đồng'],
    ['Lao động đang làm việc', 'TỔNG(«Số lao động đang làm việc») quý III; dòng phụ = quý III − quý II', f'{n(s1["ld"])} (+{n(s1["ldQ"][2] - s1["ldQ"][1])})'],
    ['Lao động bình quân', 'Lao động đang làm việc ÷ Doanh nghiệp đang hoạt động', f'{n(s1["ld"])} ÷ {n(s1["dn"])} = {n(s1["ldBq"])} người'],
    ['Địa bàn có báo cáo', 'ĐẾM(«Địa bàn») có bản ghi trong quý III', f'{NDB} trên {NDV} phường/xã'],
])
heading('1.4. Biểu đồ', 3)
chart('1.1', 'Doanh nghiệp và lao động theo quý', 'Biểu đồ kết hợp: cột (trục trái) + đường (trục phải)',
      'Trục ngang: «Quý» I → III', 'Cột: số doanh nghiệp đang hoạt động · Đường: nghìn lao động',
      ['Nhóm theo «Quý»:', 'Cột = TỔNG(«Số doanh nghiệp đang hoạt động»);', 'Đường = TỔNG(«Số lao động đang làm việc») ÷ 1.000.'],
      ' · '.join(f'{QN[q]}: {n(s1["dnQ"][q])} doanh nghiệp, {n(s1["ldQ"][q])} lao động' for q in range(3)),
      'Mỗi điểm là số tại cuối quý, không cộng dồn các quý.')
H1 = s1['hang']
chart('1.2', 'Doanh nghiệp và vốn đầu tư đăng ký theo địa bàn — quý III', 'Hai biểu đồ cột ngang đặt cạnh nhau, dùng chung hàng (Phần I, mục 7)',
      f'Mỗi hàng là một «Địa bàn» ({len(H1)} hàng), xếp theo số doanh nghiệp từ lớn xuống',
      'Cột trái: số doanh nghiệp · Cột phải: vốn đầu tư đăng ký (tỷ đồng); mỗi cột thang đo riêng',
      ['Nhóm theo «Địa bàn», bản ghi quý III:', 'Cột trái = «Số doanh nghiệp đang hoạt động»;', 'Cột phải = «Tổng vốn đầu tư đăng ký (tỷ đồng)».'],
      ' · '.join(f'{r[0]}: {n(r[1])} doanh nghiệp, {n(r[2])} tỷ đồng' for r in H1[:3]) + f'. Cộng các hàng = {n(s1["dn"])} doanh nghiệp, {n(s1["von"])} tỷ đồng.',
      f'{s1["xepVon"][0][0]} có ít doanh nghiệp hơn {H1[0][0]} nhưng vốn lớn nhất ({pc(s1["xepVon"][0][1], s1["von"])} tổng vốn đăng ký) — hai cột cạnh nhau cho thấy ngay điều này.')
chart('1.3', 'Nhà đầu tư chính (số địa bàn có nêu)', 'Biểu đồ cột ngang',
      'Trục dọc: ' + str(len(DT)) + ' nhóm nhà đầu tư: ' + ' / '.join(DT), 'Số địa bàn',
      'Với mỗi nhóm: ĐẾM(địa bàn có «Đối tác/nhà đầu tư chính» chứa tên nhóm). Một địa bàn nêu nhiều nhóm thì được đếm ở mỗi nhóm, nên cộng các cột lớn hơn số địa bàn.',
      ' · '.join(f'{DT[i]} {s1["doiTac"][i]}' for i in range(len(DT))) + f' (cộng {ssum(s1["doiTac"])} lượt / {NDB} địa bàn)')
notes('1', ['Eform không có trường cho biết bản ghi thuộc khu nào, nên IOC không tách được khu công nghiệp với khu công nghệ cao (bộ chỉ tiêu cũ tách 2 dòng). Đề nghị bổ sung trường «Tên khu» kiểu Danh mục (hoặc ít nhất «Loại khu»: Khu công nghiệp / Khu chế xuất / Khu kinh tế / Khu công nghệ cao).',
            'Đề nghị xác nhận cách nhập khi một địa bàn có nhiều khu: một bản ghi cộng chung cho cả địa bàn, hay mỗi khu một bản ghi. IOC hiện coi là một bản ghi cho mỗi địa bàn.',
            '«Kỳ báo cáo» cho chọn Tháng / Quý / Năm. Đề nghị thống nhất một kỳ (Quý). Nếu có địa bàn báo cáo theo tháng, IOC lấy tháng cuối quý cho số tại thời điểm và cộng các tháng cho số trong kỳ.',
            '«Tổng vốn đầu tư đăng ký (tỷ đồng)»: IOC hiểu là vốn đăng ký lũy kế của các dự án còn hiệu lực tại thời điểm báo cáo. Đề nghị xác nhận; dự án đầu tư bằng ngoại tệ quy đổi ra tỷ đồng theo tỷ giá nào.',
            '«Đối tác/nhà đầu tư chính» đang là Chữ gõ tự do. Đề nghị đổi sang Danh mục chọn nhiều (quốc gia / vùng lãnh thổ của nhà đầu tư) để thống kê chính xác.'])

# ---------------- CHỈ TIÊU 2
k.page_break()
heading('Chỉ tiêu 2. Thu hút đầu tư, thành lập và điều chỉnh trong các khu', 2)
heading('2.1. Thông tin chung', 3)
info_table([
    ['Eform nguồn', EFORM],
    ['Một bản ghi là', 'Số liệu một kỳ của một địa bàn'],
    ['Cách lấy theo kỳ', '**Số phát sinh trong kỳ.** Cộng các quý I, II, III năm 2026 (Phần I, mục 3).'],
    ['Kỳ hiển thị', f'9 tháng năm 2026 · {NDB * 3} bản ghi ({NDB} địa bàn × 3 quý)'],
])
heading('2.2. Trường dữ liệu sử dụng', 3)
U2 = ['Số lượng thành lập, điều chỉnh trong kỳ', 'Số dự án thu hút đầu tư mới trong kỳ', 'Tổng vốn thu hút đầu tư mới (tỷ đồng)', 'Nội dung thành lập/điều chỉnh gần nhất']
fields_table(ky('Lấy quý I – III; «Quý» còn là trục của biểu đồ 2.1') + [
    dia_ban('Hàng của biểu đồ 2.2, khối danh sách và bảng phường/xã'),
    ['Số lượng thành lập, điều chỉnh trong kỳ', 'Số', 'Cộng', 'Thẻ số; cột xám của biểu đồ 2.1'],
    ['Số dự án thu hút đầu tư mới trong kỳ', 'Số', 'Cộng', 'Thẻ số; cột xanh biểu đồ 2.1; cột phải biểu đồ 2.2; mẫu số vốn bình quân'],
    ['Tổng vốn thu hút đầu tư mới (tỷ đồng)', 'Số', 'Cộng', 'Thẻ số; đường biểu đồ 2.1; cột trái biểu đồ 2.2'],
    ['Nội dung thành lập/điều chỉnh gần nhất', 'Chữ', 'Xem', 'Hiện nguyên văn ở khối danh sách 2.3'],
], others(U2))
heading('2.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Lượt thành lập, điều chỉnh', 'TỔNG(«Số lượng thành lập, điều chỉnh trong kỳ»), 3 quý', f'{n(s2["tl"])} lượt'],
    ['Dự án đầu tư mới', 'TỔNG(«Số dự án thu hút đầu tư mới trong kỳ»), 3 quý; dòng phụ = quý III', f'{n(s2["da"])} dự án (quý III: {n(s2["daQ"][2])})'],
    ['Vốn thu hút mới', 'TỔNG(«Tổng vốn thu hút đầu tư mới (tỷ đồng)»), 3 quý', f'{n(s2["vm"])} tỷ đồng'],
    ['Vốn bình quân', 'Vốn thu hút mới ÷ Dự án đầu tư mới', f'{n(s2["vm"])} ÷ {n(s2["da"])} = {n(s2["vmBq"], 1)} tỷ đồng/dự án'],
])
heading('2.4. Biểu đồ và khối danh sách', 3)
chart('2.1', 'Thu hút đầu tư theo quý', 'Biểu đồ kết hợp: 2 cột cạnh nhau (trục trái) + đường (trục phải)',
      'Trục ngang: «Quý» I → III', 'Cột: lượt thành lập, điều chỉnh và số dự án mới · Đường: vốn thu hút mới (tỷ đồng)',
      ['Nhóm theo «Quý»:', 'Cột xám = TỔNG(«Số lượng thành lập, điều chỉnh trong kỳ»);', 'Cột xanh = TỔNG(«Số dự án thu hút đầu tư mới trong kỳ»);', 'Đường = TỔNG(«Tổng vốn thu hút đầu tư mới (tỷ đồng)»).'],
      ' · '.join(f'{QN[q]}: {n(s2["tlQ"][q])} lượt, {n(s2["daQ"][q])} dự án, {n(s2["vmQ"][q])} tỷ đồng' for q in range(3)))
H2 = s2['hang']
chart('2.2', 'Vốn thu hút mới và dự án mới theo địa bàn — 9 tháng', 'Hai biểu đồ cột ngang đặt cạnh nhau, dùng chung hàng (Phần I, mục 7)',
      f'Mỗi hàng là một «Địa bàn» có dự án mới trong 9 tháng ({len(H2)} hàng), xếp theo vốn thu hút mới từ lớn xuống',
      'Cột trái: vốn thu hút mới (tỷ đồng) · Cột phải: số dự án mới; mỗi cột thang đo riêng',
      ['Nhóm theo «Địa bàn», cộng 3 quý:', 'Cột trái = TỔNG(«Tổng vốn thu hút đầu tư mới (tỷ đồng)»);', 'Cột phải = TỔNG(«Số dự án thu hút đầu tư mới trong kỳ»).', 'Địa bàn không có dự án mới thì không vẽ.'],
      ' · '.join(f'{r[0]}: {n(r[1])} tỷ đồng, {n(r[2])} dự án' for r in H2[:3]) + f'. Cộng các hàng = {n(s2["vm"])} tỷ đồng, {n(s2["da"])} dự án.')
GN = s2['ganNhat']
heading('Khối 2.3. Nội dung thành lập, điều chỉnh gần nhất — quý III', 3)
table([['Loại khối', 'Danh sách (không phải biểu đồ)'],
       ['Nội dung', f'{len(GN)} địa bàn có «Tổng vốn thu hút đầu tư mới (tỷ đồng)» quý III lớn nhất; mỗi dòng ghi tên địa bàn, vốn thu hút mới quý III và nguyên văn «Nội dung thành lập/điều chỉnh gần nhất».'],
       ['Cách lấy', 'Lấy bản ghi quý III của các địa bàn, xếp theo vốn thu hút mới giảm dần, lấy 6 dòng đầu. Nội dung chữ hiện đúng như đơn vị nhập, không sửa.'],
       ['Ví dụ (giả lập)', [f'{u["ten"]} — {n(u["vm"][Q3])} tỷ đồng — {u["ndGanNhat"]}' for u in GN[:3]]]],
      [3.4, 12.6], header=False, size=11.5, key_col=True, keep=True)
notes('2', ['Chưa rõ «Số lượng thành lập, điều chỉnh trong kỳ» đếm dự án hay doanh nghiệp, và có gồm cả dự án cấp mới hay không. Đề nghị tách thành hai trường: «Số dự án cấp mới» và «Số lượt điều chỉnh», hoặc ghi rõ định nghĩa.',
            '«Tổng vốn thu hút đầu tư mới (tỷ đồng)»: IOC hiểu là vốn của các dự án cấp mới trong kỳ, không gồm vốn tăng thêm của dự án điều chỉnh. Đề nghị xác nhận; nếu cần theo dõi vốn tăng thêm thì bổ sung trường riêng.',
            '«Nội dung thành lập/điều chỉnh gần nhất» chỉ ghi được một nội dung mỗi kỳ, nên chỉ để xem, không thống kê được. Nếu Ban cần danh sách đầy đủ các dự án cấp mới / điều chỉnh, đề nghị dùng eform riêng (mỗi dự án một bản ghi).',
            'Dữ liệu mẫu trong file mô tả chưa hợp lý: «Số dự án thu hút đầu tư mới trong kỳ» 4.561 nhưng «Tổng vốn thu hút đầu tư mới (tỷ đồng)» chỉ 45,67; «Số lượng thành lập, điều chỉnh trong kỳ» 78.945 lớn hơn «Số doanh nghiệp đang hoạt động» 12.345. Đề nghị sửa lại để làm dữ liệu thử.'])

# ---------------- CHỈ TIÊU 3
k.page_break()
heading('Chỉ tiêu 3. Đầu tư hạ tầng, sản xuất kinh doanh và bảo vệ môi trường trong các khu', 2)
heading('3.1. Thông tin chung', 3)
info_table([
    ['Eform nguồn', EFORM],
    ['Một bản ghi là', 'Số liệu một kỳ của một địa bàn'],
    ['Cách lấy theo kỳ', '**Hai cách** (Phần I, mục 3): vốn đầu tư hạ tầng và doanh thu là số trong kỳ, cộng quý I, II, III; tình hình hạ tầng và đạt chuẩn môi trường là số tại thời điểm, lấy bản ghi quý III.'],
    ['Kỳ hiển thị', f'9 tháng năm 2026 · hạ tầng, môi trường tại quý III/2026 · {NDB} địa bàn'],
])
heading('3.2. Trường dữ liệu sử dụng', 3)
U3 = ['Vốn đầu tư hạ tầng trong kỳ (tỷ đồng)', 'Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng)', 'Tình hình đầu tư kết cấu hạ tầng', 'Đạt chuẩn môi trường', 'Tình hình bảo vệ môi trường', 'Số lao động đang làm việc']
fields_table(ky('Lấy quý I – III; tình hình hạ tầng, môi trường lấy quý III') + [
    dia_ban('Hàng của biểu đồ 3.2; đếm địa bàn ở biểu đồ 3.3, 3.4; bảng phường/xã'),
    ['Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng)', 'Số', 'Cộng', 'Thẻ số; cột biểu đồ 3.1; cột trái biểu đồ 3.2'],
    ['Vốn đầu tư hạ tầng trong kỳ (tỷ đồng)', 'Số', 'Cộng', 'Thẻ số; đường biểu đồ 3.1; cột phải biểu đồ 3.2'],
    ['Số lao động đang làm việc', 'Số', 'Cộng', 'Mẫu số doanh thu bình quân một lao động (quý III)'],
    ['Tình hình đầu tư kết cấu hạ tầng', 'Chữ', 'Nhóm', f'Gom về {len(HT)} giá trị: thẻ số, biểu đồ 3.3'],
    ['Đạt chuẩn môi trường', 'Chữ', 'Điều kiện, Nhóm', f'Gom về {len(MT)} giá trị: thẻ số, biểu đồ 3.4'],
    ['Tình hình bảo vệ môi trường', 'Chữ', 'Xem', 'Chỉ để xem chi tiết, không tính'],
], [x for x in others(U3)])
heading('3.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Doanh thu sản xuất kinh doanh', 'TỔNG(«Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng)»), 3 quý', f'{n(s3["dt"])} tỷ đồng'],
    ['Doanh thu bình quân', 'Doanh thu 9 tháng × 1.000 ÷ TỔNG(«Số lao động đang làm việc») quý III', f'{n(s3["dt"])} × 1.000 ÷ {n(s1["ld"])} = {n(s3["dtLd"])} triệu đồng/lao động'],
    ['Vốn đầu tư hạ tầng', 'TỔNG(«Vốn đầu tư hạ tầng trong kỳ (tỷ đồng)»), 3 quý', f'{n(s3["vh"])} tỷ đồng'],
    ['Hạ tầng đang triển khai', 'ĐẾM(«Tình hình đầu tư kết cấu hạ tầng» = Đang triển khai), quý III', f'{s3["ht"][1]} địa bàn'],
    ['Đạt chuẩn môi trường', 'ĐẾM(«Đạt chuẩn môi trường» = Đạt chuẩn) ÷ số địa bàn báo cáo × 100, quý III', f'{s3["mt"][0]} ÷ {NDB} = {pc(s3["mt"][0], NDB)}'],
])
heading('3.4. Biểu đồ', 3)
chart('3.1', 'Doanh thu và vốn đầu tư hạ tầng theo quý', 'Biểu đồ kết hợp: cột (trục trái) + đường (trục phải)',
      'Trục ngang: «Quý» I → III', 'Cột: doanh thu sản xuất kinh doanh · Đường: vốn đầu tư hạ tầng (đều tỷ đồng)',
      ['Nhóm theo «Quý»:', 'Cột = TỔNG(«Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng)»);', 'Đường = TỔNG(«Vốn đầu tư hạ tầng trong kỳ (tỷ đồng)»).'],
      ' · '.join(f'{QN[q]}: doanh thu {n(s3["dtQ"][q])}, hạ tầng {n(s3["vhQ"][q])}' for q in range(3)),
      'Vốn hạ tầng nhỏ hơn doanh thu hàng chục lần nên vẽ ở trục phải; đọc số trên từng điểm, không so độ cao cột với đường.')
H3 = s3['hang']
chart('3.2', 'Doanh thu và vốn đầu tư hạ tầng theo địa bàn — 9 tháng', 'Hai biểu đồ cột ngang đặt cạnh nhau, dùng chung hàng (Phần I, mục 7)',
      f'Mỗi hàng là một «Địa bàn» ({len(H3)} hàng), xếp theo doanh thu từ lớn xuống',
      'Cột trái: doanh thu (tỷ đồng) · Cột phải: vốn đầu tư hạ tầng (tỷ đồng); mỗi cột thang đo riêng',
      ['Nhóm theo «Địa bàn», cộng 3 quý:', 'Cột trái = TỔNG(«Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng)»);', 'Cột phải = TỔNG(«Vốn đầu tư hạ tầng trong kỳ (tỷ đồng)»).'],
      ' · '.join(f'{r[0]}: {n(r[1])} / {n(r[2])}' for r in H3[:3]) + f'. Cộng các hàng = {n(s3["dt"])} / {n(s3["vh"])} tỷ đồng.',
      'Địa bàn có hạ tầng đang triển khai thường có vốn hạ tầng lớn nhưng doanh thu còn nhỏ.')
chart('3.3', 'Tình hình đầu tư kết cấu hạ tầng — quý III', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi số địa bàn',
      f'{len(HT)} giá trị: ' + ' / '.join(HT), 'Số địa bàn; di chuột hiện thêm tỷ trọng %',
      'Nhóm theo «Tình hình đầu tư kết cấu hạ tầng» (bản ghi quý III), mỗi lát = ĐẾM(«Địa bàn»).',
      ' · '.join(f'{HT[i]} {s3["ht"][i]}' for i in range(len(HT))) + f' → giữa vòng {NDB}')
chart('3.4', 'Đạt chuẩn môi trường — quý III', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi số địa bàn',
      f'{len(MT)} giá trị: ' + ' / '.join(MT), 'Số địa bàn; di chuột hiện thêm tỷ trọng %',
      'Nhóm theo «Đạt chuẩn môi trường» (bản ghi quý III), mỗi lát = ĐẾM(«Địa bàn»).',
      ' · '.join(f'{MT[i]} {s3["mt"][i]}' for i in range(len(MT))) + f' → giữa vòng {NDB}')
notes('3', ['«Tình hình đầu tư kết cấu hạ tầng» đang là Chữ (dữ liệu mẫu "Chưa triển khai"). IOC giả định chỉ có 3 giá trị ' + ' / '.join(HT) + '. Đề nghị đổi sang Danh mục với đúng các giá trị này, hoặc thay bằng «Tỷ lệ hoàn thành hạ tầng (%)» kiểu Số.',
            '«Đạt chuẩn môi trường» đang là Chữ. IOC giả định 3 giá trị ' + ' / '.join(MT) + '. Đề nghị đổi sang Danh mục và ghi rõ đạt chuẩn theo tiêu chí nào (hệ thống xử lý nước thải tập trung, quan trắc tự động…).',
            '«Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng)»: đề nghị xác nhận có gồm doanh thu xuất khẩu và quy đổi ngoại tệ theo tỷ giá nào.',
            'Doanh thu bình quân một lao động tính trên số lao động quý III (số tại thời điểm), không phải lao động bình quân cả kỳ. Đề nghị xác nhận cách tính này phù hợp.'])

# ======================================================= PHẦN III
k.page_break()
heading(f'PHẦN III. BẢNG {NDV} PHƯỜNG/XÃ', 1)
para(f'Ô bên phải của form là bảng đủ **{NDV} phường/xã** theo thứ tự danh mục «Địa bàn» của eform. {NDB} địa bàn có khu hiện số liệu; các phường/xã còn lại không có khu nên để "—". Dòng đầu **Cộng {NDV} phường/xã** là cộng các địa bàn có số.')
table([
    ['Cột trong bảng', 'Chỉ tiêu', 'Cách tính cho mỗi địa bàn', 'Dòng đầu'],
    ['Doanh nghiệp (30/9)', '1', '«Số doanh nghiệp đang hoạt động», quý III', n(s1['dn'])],
    ['Vốn đăng ký (tỷ đồng)', '1', '«Tổng vốn đầu tư đăng ký (tỷ đồng)», quý III', n(s1['von'])],
    ['Lao động (30/9)', '1', '«Số lao động đang làm việc», quý III', n(s1['ld'])],
    ['Dự án mới 9 tháng', '2', 'TỔNG(«Số dự án thu hút đầu tư mới trong kỳ»), quý I – III', n(s2['da'])],
    ['Vốn thu hút mới (tỷ đồng)', '2', 'TỔNG(«Tổng vốn thu hút đầu tư mới (tỷ đồng)»), quý I – III', n(s2['vm'])],
    ['Doanh thu 9 tháng (tỷ đồng)', '3', 'TỔNG(«Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng)»), quý I – III', n(s3['dt'])],
    ['Hạ tầng', '3', '«Tình hình đầu tư kết cấu hạ tầng», quý III', f'{s3["ht"][0]} hoàn thành'],
    ['Môi trường', '3', '«Đạt chuẩn môi trường», quý III', f'{s3["mt"][0]} đạt chuẩn'],
], [4.0, 1.5, 7.8, 2.7], size=10.5)
u = UB['Xã Hòa Lạc']
box([f'**{u["ten"]}**: {n(u["dn"][Q3])} doanh nghiệp · vốn đăng ký {n(u["von"][Q3])} tỷ đồng · {n(u["ld"][Q3])} lao động · '
     f'dự án mới {" + ".join(n(x) for x in u["da"])} = {n(ssum(u["da"]))} · vốn thu hút mới {n(ssum(u["vm"]))} tỷ đồng · '
     f'doanh thu {n(ssum(u["dt"]))} tỷ đồng · hạ tầng {HT[u["ht"]]} · môi trường {MT[u["mt"]]}.'], k.FORM_FILL, 'Ví dụ một dòng: ')
note('Bấm vào một biểu đồ bất kỳ ở cột trái thì ô bên phải đổi sang bảng số của chính biểu đồ đó; bấm nút "Danh sách 126 đơn vị" để quay lại bảng phường/xã.')

# ======================================================= PHẦN IV
k.page_break()
heading('PHẦN IV. TỔNG HỢP ĐỀ NGHỊ BAN XÁC NHẬN', 1)
para('Gom các đề nghị Ban xác nhận của 3 chỉ tiêu. Cột "Kết quả" để trống cho Ban ghi ý kiến.')
table([['#', 'Chỉ tiêu', 'Nội dung', 'Kết quả']] + [[str(i + 1), c, x, ''] for i, (c, x) in enumerate(ALL_NOTES)],
      [0.8, 1.6, 10.6, 3.0], size=10.5)

# ======================================================= PHỤ LỤC
k.page_break()
ctm_section(heading, para, lambda rows, w: table(rows, w, size=10), 'ubnd-bqlkcnc',
            'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=['Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
k.page_break()
k.page_break()
heading('PHỤ LỤC. DANH SÁCH TRƯỜNG CỦA EFORM', 1)
para(f'Trích nguyên từ file mô tả đầu vào eform, sheet "Ban Quản lý Khu công nghệ cao và khu công nghiệp thành phố", eform "{EFORM}" ({N_FIELDS} trường). Cột "Dùng ở chỉ tiêu" cho biết trường tham gia tính toán thẻ số / biểu đồ của chỉ tiêu nào.')
DUNG = {'Kỳ báo cáo': '1, 2, 3', 'Năm': '1, 2, 3', 'Tháng': '1, 2, 3', 'Quý': '1, 2, 3', 'Địa bàn': '1, 2, 3'}
for i, us in ((1, U1), (2, U2), (3, U3)):
    for x in us: DUNG[x] = (DUNG[x] + ', ' if x in DUNG else '') + str(i)
rows, fills = [['#', 'Tên trường', 'Mã trường', 'Kiểu nhập', 'Dùng ở chỉ tiêu']], {}
for j, f in enumerate(FIELDS['fields']):
    d = DUNG.get(f[0], '—'); rows.append([str(j + 1), f[0], f[1], f[2] or '(chưa ghi)', d])
    if d != '—': fills[(j + 1, 4)] = k.OK_FILL
table(rows, [0.8, 5.2, 6.2, 2.0, 1.8], size=10, fills=fills, mono_col=2)
for us in (U1, U2, U3):  # tên trường dùng trong tài liệu phải có thật trong eform
    missing = set(us) - set(ALL_NAMES)
    assert not missing, missing
print('Trường dùng trên IOC:', sum(1 for r in rows[1:] if r[4] != '—'), '/', N_FIELDS, '· đề nghị:', len(ALL_NOTES))

for p in k.save(OUT): print('ok', p)
