# -*- coding: utf-8 -*-
"""Sinh docs/DL_SoDuLich/DL_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 2 chỉ tiêu của Sở Du lịch trên IOC
(biểu đồ, trường, cách tính, đề nghị xác nhận).
Chạy từ thư mục gốc ioc:  python tools/dl_doc_docx.py
Lời văn viết tay trong script; CÁC CON SỐ đọc thẳng từ js/core/dl-config.js (qua node) nên luôn khớp giao diện.
Tên trường viết đúng như file mô tả đầu vào eform (tools/dl-fields.json, trích từ sheet "Sở Du lịch").
Word + Markdown cùng sinh một lần qua tools/doc_kit.py. Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EF = json.load(open(os.path.join(ROOT, 'tools', 'dl-fields.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'docs', 'DL_SoDuLich', 'DL_MO_TA_CHI_TIEU.docx')

_JS = ("const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
       "vm.runInContext(fs.readFileSync('js/core/dl-config.js','utf8')+"
       "';this.S=DL_SUM;this.U=DL_UNITS.map(u=>({ten:u.ten,qt:u.qt,nd:u.nd,tong:u.tong,ltau:u.ltau,lh:u.lh,nl:u.loai.filter(Boolean).length}));"
       "this.L=DL_LOAI.map(x=>x[0]);this.CC=DL_CO_CAU.map(x=>x[0]);this.LDT=DL_LDT;',c);"
       "process.stdout.write(JSON.stringify({S:c.S,U:c.U,L:c.L,CC:c.CC,LDT:c.LDT}));")
_J = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))
S, U, L, CC, LDT = _J['S'], _J['U'], _J['L'], _J['CC'], _J['LDT']


def n(x, d=0):
    """Số kiểu Việt Nam: 1.234.567,8"""
    s = f'{abs(x):,.{d}f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return ('−' if x < 0 else '') + s
def pc(a, b, d=1): return n(a / b * 100, d) + '%'
def ty(trieu, d=0): return n(trieu / 1000, d)          # triệu đồng → tỷ đồng
def nghin(v): return n(round(v / 1000))                # lượt → nghìn lượt
def ssum(a): return sum(a)


K, T = S['khach'], S['doanhThu']
NDV = len(U)
UB = {u['ten']: u for u in U}
TH = [f'T{m + 1}' for m in range(9)]
E1, E2 = EF[0], EF[1]

k = Kit('Sở Du lịch · Mô tả chỉ tiêu trên IOC')
para, table, box, heading, note = k.para, k.table, k.box, k.heading, k.note

# ======================================================= TRANG BÌA
k.blank(5)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(4)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY)
para('SỞ DU LỊCH HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('Biểu đồ, trường dữ liệu và cách tính số liệu của 2 chỉ tiêu trên IOC', 14, CENTER, 4, italic=True, color=GREY)
para('xây dựng từ 2 eform nhập liệu của Sở', 14, CENTER, 0, italic=True, color=GREY)
k.blank(5)
table([
    ['Đơn vị', 'Sở Du lịch Thành phố Hà Nội'],
    ['Nguồn dữ liệu', f'File mô tả đầu vào eform, sheet "Sở Du lịch": 2 eform, {len(E1["fields"]) + len(E2["fields"])} trường nhập'],
    ['Phạm vi', '2 chỉ tiêu, 7 biểu đồ, bảng 126 phường/xã'],
    ['Số liệu ví dụ', 'Số giả lập (chưa có số liệu thật), tháng 1 – 9 năm 2026'],
    ['Phiên bản', '1.2 · ngày 13/10/2026 (theo phản hồi nhóm triển khai khi nối eform thật: thêm quy ước xử lý dữ liệu eform — khóa bản ghi, cách lấy theo kỳ, chỉ hiện số có trường trong eform)'],
], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()

# ======================================================= MỤC LỤC
k.toc()
k.page_break()

# ======================================================= PHẦN I
heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Mục đích tài liệu', 2)
para('Tài liệu mô tả cách IOC dựng 2 chỉ tiêu của Sở Du lịch từ 2 eform nhập liệu: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào của eform, mỗi trường dùng để làm gì, và mỗi con số được cộng, đếm, tính toán ra sao. Tên trường viết đúng như trong file mô tả đầu vào eform để cán bộ nhập liệu và đội kỹ thuật cùng đối chiếu.')
SHOW_NOTE_BOX = False  # khối "Lưu ý, đề nghị Sở xác nhận" cuối mỗi chỉ tiêu — ẩn theo yêu cầu 14/10/2026; nội dung vẫn gom vào Phần IV
para('Trên giao diện IOC, mỗi chỉ tiêu chỉ gồm **thẻ số tổng hợp** và **biểu đồ**; cách tính từng số chỉ trình bày trong tài liệu này. '
     + ('Cuối mỗi chỉ tiêu có mục **"Lưu ý, đề nghị Sở xác nhận"**; Phần IV gom toàn bộ các đề nghị đó vào một bảng để tiện rà soát.' if SHOW_NOTE_BOX else 'Các đề nghị Sở xác nhận được gom vào một bảng ở Phần IV để tiện rà soát.'))
box(['Mọi con số ví dụ trong tài liệu là **số giả lập** dùng để dựng giao diện, đã được cộng kiểm cho khớp (tổng luôn bằng cộng các phần, số toàn Thành phố bằng cộng 126 phường/xã). Khi có số liệu thật, cách tính giữ nguyên, chỉ thay số.'], k.NOTE_FILL, 'Lưu ý: ')

heading('2. Hai eform, hai chỉ tiêu', 2)
table([
    ['#', 'Chỉ tiêu trên IOC', 'Eform nguồn', 'Một bản ghi là'],
    ['1', 'Khách du lịch nội địa và quốc tế', E1['eform'], 'Lượt khách của một «Đơn vị báo cáo» tại một «Loại điểm du lịch» trong một tháng'],
    ['2', 'Doanh thu dịch vụ du lịch', E2['eform'], 'Doanh thu của một «Đơn vị báo cáo», một «Loại điểm du lịch», một «Loại doanh thu» trong một tháng'],
], [0.8, 4.4, 4.4, 6.4], size=11)
para('Bộ chỉ tiêu cũ của Sở (STT 22 "Số lượt khách du lịch nội địa", STT 23 "Số lượt khách du lịch quốc tế", STT 65 "Tổng thu từ khách du lịch", nguồn File) đã được thay bằng bộ này và đã xóa khỏi IOC.', 12, italic=True, color=GREY)

heading('3. Kỳ báo cáo', 2)
para('Hai eform đều có «Kỳ báo cáo» (Tháng / Quý / Năm), «Năm», «Quý», «Tháng»; dữ liệu mẫu nhập theo **Tháng**. Mọi trường số của hai eform (lượt khách, doanh thu) là **số phát sinh trong kỳ**, nên IOC **cộng các tháng** từ đầu năm đến tháng đang xem. Kỳ hiển thị mặc định là **9 tháng năm 2026** (tháng 1 – 9).')
box([f'Lượt khách tháng 1 – 9: {" + ".join(nghin(v) for v in K["khT"])} = **{nghin(K["tong"])} nghìn lượt**.'], k.FORM_FILL, 'Ví dụ: ')

heading('4. Các phép tính dùng trong tài liệu', 2)
table([
    ['Ký hiệu', 'Ý nghĩa', 'Ví dụ'],
    ['TỔNG(«trường»)', 'Cộng giá trị của trường trên các bản ghi được lấy', 'TỔNG(«Số lượt khách du lịch quốc tế»)'],
    ['Nhóm theo «trường»', 'Chia bản ghi thành từng nhóm theo giá trị của trường, rồi cộng trong từng nhóm', 'Nhóm theo «Loại điểm du lịch»'],
    ['Tỷ lệ, tỷ trọng (%)', 'Tử số ÷ Mẫu số × 100, làm tròn 1 chữ số thập phân', f'{n(K["qt"])} ÷ {n(K["tong"])} × 100 = {pc(K["qt"], K["tong"])}'],
    ['Đổi đơn vị', 'Lượt → nghìn lượt (÷ 1.000); VND → tỷ đồng (÷ 1.000.000.000)', f'{n(T["tong"] * 1e6)} VND = {ty(T["tong"])} tỷ đồng'],
], [3.6, 6.6, 5.8])

heading('5. Vai trò của trường trong cách tính', 2)
table([
    ['Vai trò', 'Giải thích'],
    ['Lọc kỳ', 'Chọn bản ghi thuộc kỳ đang xem.'],
    ['Nhóm', 'Tạo các cột / lát cắt / hàng của biểu đồ.'],
    ['Cộng', 'Giá trị số được cộng lại để ra con số hiển thị.'],
    ['Không dùng', 'Trường có trong eform nhưng IOC không tính (lý do ghi ở từng chỉ tiêu).'],
], [3.6, 12.4], key_col=True)

heading('6. Đơn vị báo cáo', 2)
para(f'Danh mục «Đơn vị báo cáo» của cả hai eform gồm đúng **{NDV} phường/xã** ({sum(1 for u in U if u["ten"].startswith("Phường"))} phường, {sum(1 for u in U if u["ten"].startswith("Xã"))} xã), trùng danh mục của các sở khác. Mỗi phường/xã báo cáo số khách, doanh thu tại các điểm du lịch trên địa bàn của mình, theo từng «Loại điểm du lịch». Số toàn Thành phố là cộng 126 phường/xã.')

heading('7. Lượt khách cộng theo điểm du lịch', 2)
para('Vì mỗi bản ghi là lượt khách tại **một loại điểm du lịch của một phường/xã**, một khách đi nhiều điểm (hoặc ở cơ sở lưu trú rồi đi tham quan) sẽ được đếm ở mỗi điểm. Con số IOC cộng ra là **tổng lượt khách đến các điểm du lịch**, có thể lớn hơn số lượt khách du lịch đến Hà Nội theo phương pháp thống kê của ngành. Đề nghị Sở xác nhận ở Chỉ tiêu 1.')

heading('8. Tổng hợp 2 chỉ tiêu', 2)
table([
    ['#', 'Chỉ tiêu trên IOC', 'Kỳ hiển thị', 'Thẻ số', 'Biểu đồ'],
    ['1', 'Khách du lịch nội địa và quốc tế', '9 tháng năm 2026', '5', '3'],
    ['2', 'Doanh thu dịch vụ du lịch', '9 tháng năm 2026', '5', '4'],
], [0.8, 7.2, 3.8, 1.8, 2.4], size=11)

# ======================================================= PHẦN II
k.page_break()
heading('PHẦN II. CHI TIẾT 2 CHỈ TIÊU', 1)
note('Mỗi chỉ tiêu được trình bày theo cùng một khuôn: (1) Thông tin chung · (2) Trường dữ liệu sử dụng · (3) Thẻ số tổng hợp · (4) Từng biểu đồ' + (' · (5) Lưu ý, đề nghị Sở xác nhận' if SHOW_NOTE_BOX else '') + '.')

def fields_table(rows):
    data = [['#', 'Tên trường (đúng như eform)', 'Kiểu nhập', 'Vai trò', 'Dùng để']]
    for i, r in enumerate(rows): data.append([str(i + 1)] + list(r))
    table(data, [0.8, 5.4, 2.0, 2.3, 5.5], size=10.5)

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
    if SHOW_NOTE_BOX: box(['• ' + x for x in items], k.NOTE_FILL, 'Lưu ý, đề nghị Sở xác nhận', 12)
    ALL_NOTES.extend((ct, x) for x in items)

KY = [['Kỳ báo cáo, Năm,', 'Quý, Tháng'], 'Danh mục / Số', 'Lọc kỳ', 'Lấy các tháng 1 – 9; «Tháng» còn là trục của biểu đồ theo tháng']

# ---------------- CHỈ TIÊU 1
heading('Chỉ tiêu 1. Khách du lịch nội địa và quốc tế', 2)
heading('1.1. Thông tin chung', 3)
info_table([
    ['Eform nguồn', E1['eform']],
    ['Một bản ghi là', 'Lượt khách của một phường/xã tại một loại điểm du lịch trong một tháng'],
    ['Cách lấy theo kỳ', '**Cộng các tháng** 1 – 9 năm 2026 (Phần I, mục 3).'],
    ['Kỳ hiển thị', f'9 tháng năm 2026 · {n(K["banGhi"])} bản ghi ({NDV} phường/xã × các loại điểm có trên địa bàn × 9 tháng)'],
])
heading('1.2. Trường dữ liệu sử dụng', 3)
fields_table([KY,
    ['Đơn vị báo cáo', 'Danh mục', 'Nhóm', 'Hàng của biểu đồ 1.3 và bảng 126 phường/xã'],
    ['Loại điểm du lịch', 'Danh mục', 'Nhóm', f'Hàng của biểu đồ 1.2 ({len(L)} loại)'],
    ['Số lượt khách du lịch quốc tế', 'Số', 'Cộng', 'Thẻ số; phần "Quốc tế" của mọi biểu đồ'],
    ['Số lượt khách du lịch nội địa', 'Số', 'Cộng', 'Thẻ số; phần "Nội địa" của mọi biểu đồ'],
    ['Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('1.3. Thẻ số tổng hợp', 3)
tg = (K['t9'] / K['t8'] - 1) * 100
kpi_table([
    ['Tổng lượt khách', 'TỔNG(«Số lượt khách du lịch quốc tế») + TỔNG(«Số lượt khách du lịch nội địa»), tháng 1 – 9', f'{n(K["tong"])} lượt'],
    ['Khách quốc tế', 'TỔNG(«Số lượt khách du lịch quốc tế»); dòng phụ = tỷ trọng trong tổng lượt khách', f'{n(K["qt"])} lượt ({pc(K["qt"], K["tong"])})'],
    ['Khách nội địa', 'TỔNG(«Số lượt khách du lịch nội địa»); dòng phụ = tỷ trọng', f'{n(K["nd"])} lượt ({pc(K["nd"], K["tong"])})'],
    ['Tháng 9', 'Tổng lượt khách của «Tháng» = 9; dòng phụ = (tháng 9 ÷ tháng 8 − 1) × 100', f'{n(K["t9"])} lượt ({"+" if tg >= 0 else ""}{n(tg, 1)}%)'],
    ['Đơn vị có khách', 'Số phường/xã có tổng lượt khách > 0', f'{K["dvCoKhach"]} trên {NDV}'],
])
heading('1.4. Biểu đồ', 3)
chart('1.1', 'Lượt khách theo tháng', 'Biểu đồ cột xếp chồng',
      'Trục ngang: «Tháng» 1 → 9; mỗi cột chia 2 phần: Quốc tế / Nội địa', 'Nghìn lượt; số ở đầu cột = tổng lượt khách của tháng',
      ['Nhóm theo «Tháng»:', 'Phần Quốc tế = TỔNG(«Số lượt khách du lịch quốc tế») ÷ 1.000;', 'Phần Nội địa = TỔNG(«Số lượt khách du lịch nội địa») ÷ 1.000.'],
      ' · '.join(f'{TH[m]}: {nghin(K["qtT"][m])} + {nghin(K["ndT"][m])}' for m in (0, 1, 8)) + ' (nghìn lượt)',
      'Hai phần cùng đơn vị (lượt) nên xếp chồng trên một trục; chiều cao cả cột là tổng lượt khách.')
lo = sorted(range(len(L)), key=lambda i: -(K['qtLoai'][i] + K['ndLoai'][i]))
chart('1.2', 'Lượt khách theo loại điểm du lịch — 9 tháng', 'Biểu đồ cột ngang xếp chồng',
      f'Trục dọc: {len(L)} giá trị của «Loại điểm du lịch», xếp theo tổng lượt khách từ lớn xuống; mỗi cột chia 2 phần Quốc tế / Nội địa',
      'Nghìn lượt; số ở đầu cột = tổng',
      'Nhóm theo «Loại điểm du lịch», cộng tháng 1 – 9 và 126 phường/xã: phần Quốc tế = TỔNG(«Số lượt khách du lịch quốc tế»), phần Nội địa = TỔNG(«Số lượt khách du lịch nội địa»).',
      ' · '.join(f'{L[i]} {nghin(K["qtLoai"][i])} + {nghin(K["ndLoai"][i])}' for i in lo[:3]) + ' (nghìn lượt)')
tp = K['top']
chart('1.3', '15 phường/xã đông khách nhất — 9 tháng', 'Biểu đồ cột ngang xếp chồng',
      'Trục dọc: 15 «Đơn vị báo cáo» có tổng lượt khách lớn nhất, xếp từ lớn xuống; mỗi cột chia 2 phần Quốc tế / Nội địa',
      'Nghìn lượt; số ở đầu cột = tổng',
      'Nhóm theo «Đơn vị báo cáo», cộng tháng 1 – 9 và mọi loại điểm; xếp theo tổng lượt khách, lấy 15 đơn vị đầu.',
      ' · '.join(f'{r[0]} {nghin(r[1])} + {nghin(r[2])}' for r in tp[:3]) + ' (nghìn lượt)',
      'Bảng đủ 126 phường/xã ở ô bên phải (Phần III). Tên trên trục viết tắt "P." là phường, "X." là xã.')
notes('1', ['Lượt khách nhập theo từng loại điểm của từng phường/xã nên một khách đi nhiều điểm bị đếm nhiều lần; IOC cộng ra "tổng lượt khách đến các điểm du lịch". Đề nghị Sở xác nhận số lượt khách chính thức của Thành phố lấy từ đâu (ví dụ thêm một bản ghi cấp Thành phố do Sở nhập), để IOC hiện đúng số đó ở thẻ Tổng lượt khách.',
            '«Loại điểm du lịch» có giá trị "Cơ sở lưu trú" là nơi ở chứ không phải điểm tham quan; khách lưu trú thường cũng đã được đếm ở điểm tham quan. Đề nghị tách lượt khách lưu trú thành trường riêng (ví dụ «Số lượt khách có lưu trú»).',
            '«Kỳ báo cáo» cho chọn Tháng / Quý / Năm. Đề nghị thống nhất nhập theo Tháng; nếu có đơn vị nhập theo Quý, IOC dùng bản quý và không cộng thêm các tháng của quý đó.',
            'Bộ chỉ tiêu cũ có phân tổ khách quốc tế theo thị trường (Trung Quốc, Hàn Quốc, Nhật Bản…) và theo có / không lưu trú; eform mới không có. Nếu Sở cần, đề nghị bổ sung trường «Thị trường» (Danh mục) cho khách quốc tế.'])

# ---------------- CHỈ TIÊU 2
k.page_break()
heading('Chỉ tiêu 2. Doanh thu dịch vụ du lịch', 2)
heading('2.1. Thông tin chung', 3)
info_table([
    ['Eform nguồn', E2['eform']],
    ['Một bản ghi là', 'Doanh thu của một phường/xã, một loại điểm du lịch, một loại doanh thu trong một tháng'],
    ['Cách lấy theo kỳ', '**Cộng các tháng** 1 – 9 năm 2026 (Phần I, mục 3).'],
    ['Kỳ hiển thị', f'9 tháng năm 2026 · {n(T["banGhi"])} bản ghi (gấp 3 eform 1, mỗi loại doanh thu một bản ghi) · đơn vị tỷ đồng'],
])
heading('2.2. Trường dữ liệu sử dụng', 3)
fields_table([KY,
    ['Đơn vị báo cáo', 'Chữ', 'Nhóm', 'Hàng của biểu đồ 2.4 và bảng 126 phường/xã'],
    ['Loại điểm du lịch', 'Danh mục', 'Nhóm', 'Hàng của biểu đồ 2.3'],
    ['Loại doanh thu', 'Danh mục', 'Nhóm', 'Tách lưu trú và ăn uống / lữ hành / tổng thu (mục 2.3)'],
    ['Giá trị doanh thu (VND)', 'Số', 'Cộng', 'Mọi con số doanh thu (đổi ra tỷ đồng)'],
    ['Số lượt khách du lịch quốc tế', 'Số', 'Không dùng', 'Trùng eform 1; IOC lấy lượt khách từ eform 1'],
    ['Số lượt khách du lịch nội địa', 'Số', 'Không dùng', 'Trùng eform 1; IOC lấy lượt khách từ eform 1'],
    ['Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('2.3. Loại doanh thu', 3)
para('Danh mục «Loại doanh thu» có 3 giá trị. Giá trị thứ ba là **tổng thu**, đã gồm hai giá trị đầu, nên IOC **không cộng 3 loại với nhau**:').paragraph_format.keep_with_next = True
table([
    ['Mã', 'Loại doanh thu (đúng như eform)', 'IOC dùng làm', 'Số 9 tháng (tỷ đồng)'],
    ['DT01', LDT[0], 'Phần "Lưu trú và ăn uống"', ty(T['ltau'])],
    ['DT02', LDT[1], 'Phần "Lữ hành"', ty(T['lh'])],
    ['DT03', LDT[2], '**Tổng thu** (cả cột biểu đồ, thẻ Tổng thu)', ty(T['tong'])],
    ['—', '(không có trong eform)', 'Phần "Dịch vụ khác" = DT03 − DT01 − DT02', ty(T['khac'])],
], [1.4, 6.0, 5.6, 3.0], size=11, keep=True)
heading('2.4. Thẻ số tổng hợp', 3)
kpi_table([
    ['Tổng thu từ khách du lịch', 'TỔNG(«Giá trị doanh thu (VND)») có «Loại doanh thu» = Tổng thu từ khách du lịch, tháng 1 – 9, ÷ 10⁹', f'{ty(T["tong"])} tỷ đồng'],
    ['Lưu trú và ăn uống', 'Như trên với «Loại doanh thu» = Doanh thu dịch vụ lưu trú và ăn uống; dòng phụ = tỷ trọng trong tổng thu', f'{ty(T["ltau"])} tỷ đồng ({pc(T["ltau"], T["tong"])})'],
    ['Lữ hành', 'Như trên với «Loại doanh thu» = Doanh thu dịch vụ du lịch lữ hành; dòng phụ = tỷ trọng', f'{ty(T["lh"])} tỷ đồng ({pc(T["lh"], T["tong"])})'],
    ['Chi tiêu bình quân', 'Tổng thu (đồng) ÷ Tổng lượt khách (Chỉ tiêu 1), ra nghìn đồng/lượt', f'{ty(T["tong"])} tỷ ÷ {n(K["tong"])} lượt = {n(T["chiBq"])} nghìn đồng'],
    ['Tháng 9', 'Tổng thu của «Tháng» = 9', f'{ty(T["tongT"][8])} tỷ đồng'],
])
heading('2.5. Biểu đồ', 3)
chart('2.1', 'Tổng thu theo tháng', 'Biểu đồ cột xếp chồng',
      'Trục ngang: «Tháng» 1 → 9; mỗi cột chia 3 phần: Lưu trú và ăn uống / Lữ hành / Dịch vụ khác',
      'Tỷ đồng; số ở đầu cột = tổng thu từ khách du lịch của tháng',
      ['Nhóm theo «Tháng» và «Loại doanh thu»:', 'Lưu trú và ăn uống = TỔNG(DT01); Lữ hành = TỔNG(DT02);', 'Dịch vụ khác = TỔNG(DT03) − TỔNG(DT01) − TỔNG(DT02); cả cột = TỔNG(DT03).'],
      ' · '.join(f'{TH[m]}: {ty(T["ltauT"][m])} + {ty(T["lhT"][m])} + {ty(T["khacT"][m])} = {ty(T["tongT"][m])}' for m in (1, 8)))
chart('2.2', 'Cơ cấu tổng thu — 9 tháng', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng thu',
      '3 phần như biểu đồ 2.1', 'Tỷ đồng; di chuột hiện thêm tỷ trọng %', 'Cộng tháng 1 – 9 của 3 phần ở biểu đồ 2.1.',
      ' · '.join(f'{CC[i].split(" (")[0]} {ty(v)} ({pc(v, T["tong"])})' for i, v in enumerate([T['ltau'], T['lh'], T['khac']])) + f' → giữa vòng {ty(T["tong"])}')
lt = sorted(range(len(L)), key=lambda i: -T['tongLoai'][i])
chart('2.3', 'Tổng thu theo loại điểm du lịch — 9 tháng', 'Biểu đồ cột ngang',
      f'Trục dọc: {len(L)} giá trị của «Loại điểm du lịch», xếp từ lớn xuống', 'Tỷ đồng',
      'Nhóm theo «Loại điểm du lịch»: TỔNG(DT03), tháng 1 – 9, 126 phường/xã.',
      ' · '.join(f'{L[i]} {ty(T["tongLoai"][i])}' for i in lt[:3]) + f' … {L[lt[-1]]} {ty(T["tongLoai"][lt[-1]])}')
chart('2.4', '15 phường/xã có tổng thu lớn nhất — 9 tháng', 'Biểu đồ cột ngang',
      'Trục dọc: 15 «Đơn vị báo cáo» có tổng thu lớn nhất, xếp từ lớn xuống', 'Tỷ đồng',
      'Nhóm theo «Đơn vị báo cáo»: TỔNG(DT03), tháng 1 – 9, mọi loại điểm; lấy 15 đơn vị đầu.',
      ' · '.join(f'{r[0]} {ty(r[1])}' for r in T['top'][:3]))
notes('2', ['Eform doanh thu lặp lại 2 trường «Số lượt khách du lịch quốc tế» và «Số lượt khách du lịch nội địa» của eform khách. IOC chỉ lấy lượt khách từ eform khách. Đề nghị bỏ 2 trường này khỏi eform doanh thu để đơn vị không phải nhập hai lần, tránh hai số lệch nhau.',
            '«Đơn vị báo cáo» ở eform doanh thu đang là kiểu Chữ (eform khách là Danh mục). Đề nghị đổi sang Danh mục để gõ đúng tên phường/xã; nếu gõ sai tên, bản ghi không khớp được với bảng 126 phường/xã.',
            '«Tổng thu từ khách du lịch» (DT03) được hiểu là tổng, đã gồm doanh thu lưu trú – ăn uống (DT01) và lữ hành (DT02); IOC tính phần dịch vụ khác = DT03 − DT01 − DT02. Đề nghị Sở xác nhận; nếu DT03 không gồm DT01, DT02 thì tổng thu phải tính bằng cộng cả ba.',
            'Bộ chỉ tiêu cũ tách tổng thu theo khách nội địa / khách quốc tế; eform mới không có. Nếu Sở cần, đề nghị bổ sung «Nhóm khách» (Nội địa / Quốc tế) vào eform doanh thu.',
            'Dữ liệu mẫu: một bản ghi ghi «Loại điểm du lịch» = Làng nghề nhưng doanh thu là "Doanh thu dịch vụ du lịch lữ hành" 6 tỷ đồng. Đề nghị xác nhận doanh thu lữ hành có ghi theo loại điểm hay chỉ ghi chung cho cả phường/xã (khi đó «Loại điểm du lịch» để trống hoặc chọn "Khác").'])

# ======================================================= PHẦN III
k.page_break()
heading(f'PHẦN III. BẢNG {NDV} PHƯỜNG/XÃ', 1)
para(f'Ô bên phải của form là bảng đủ **{NDV} phường/xã** theo thứ tự danh mục «Đơn vị báo cáo». Mọi cột cộng tháng 1 – 9 và mọi loại điểm du lịch của phường/xã đó. Dòng đầu **Cộng {NDV} phường/xã** bằng số toàn Thành phố ở thẻ số.')
table([
    ['Cột trong bảng', 'Chỉ tiêu', 'Cách tính cho mỗi phường/xã', 'Dòng đầu'],
    ['Lượt khách 9 tháng', '1', 'Khách quốc tế + Khách nội địa', n(K['tong'])],
    ['Khách quốc tế', '1', 'TỔNG(«Số lượt khách du lịch quốc tế»)', n(K['qt'])],
    ['Khách nội địa', '1', 'TỔNG(«Số lượt khách du lịch nội địa»)', n(K['nd'])],
    ['Tổng thu (tỷ đồng)', '2', 'TỔNG(DT03) ÷ 10⁹', ty(T['tong'], 1)],
    ['Lưu trú, ăn uống (tỷ đồng)', '2', 'TỔNG(DT01) ÷ 10⁹', ty(T['ltau'], 1)],
    ['Lữ hành (tỷ đồng)', '2', 'TỔNG(DT02) ÷ 10⁹', ty(T['lh'], 1)],
], [4.2, 1.5, 7.3, 3.0], size=10.5)
u = UB['Phường Hoàn Kiếm']
box([f'**{u["ten"]}** ({u["nl"]} loại điểm du lịch): {n(u["qt"])} khách quốc tế + {n(u["nd"])} khách nội địa = {n(u["qt"] + u["nd"])} lượt · tổng thu {ty(u["tong"], 1)} tỷ đồng, trong đó lưu trú, ăn uống {ty(u["ltau"], 1)}, lữ hành {ty(u["lh"], 1)}.'], k.FORM_FILL, 'Ví dụ một dòng: ')
note('Bấm vào một biểu đồ bất kỳ ở cột trái thì ô bên phải đổi sang bảng số của chính biểu đồ đó; bấm nút "Danh sách 126 đơn vị" để quay lại bảng phường/xã.')

# ======================================================= PHẦN IV
k.page_break()
heading('PHẦN IV. TỔNG HỢP ĐỀ NGHỊ SỞ XÁC NHẬN', 1)
para('Gom các đề nghị Sở xác nhận của 2 chỉ tiêu. Cột "Kết quả" để trống cho Sở ghi ý kiến.')
table([['#', 'Chỉ tiêu', 'Nội dung', 'Kết quả']] + [[str(i + 1), c, x, ''] for i, (c, x) in enumerate(ALL_NOTES)],
      [0.8, 1.6, 10.6, 3.0], size=10.5)

# ======================================================= PHỤ LỤC
k.page_break()
ctm_section(heading, para, lambda rows, w: table(rows, w, size=10), 'ubnd-dulich',
            'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=['Lượt khách du lịch (tổng, quốc tế, nội địa) ghi **nghìn lượt ở mọi chỗ**: ô số, thẻ, biểu đồ theo tháng, bảng, bảng 126 phường/xã (trước: ô số ghi triệu lượt, biểu đồ nghìn lượt, bảng xã lượt).', 'Lượt khách **tháng 9** không còn là thanh cạnh số 9 tháng; ghi dòng chú thích "(số riêng một tháng, không cộng vào số trên)".', 'Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
k.page_break()
k.page_break()
heading('PHỤ LỤC. DANH SÁCH TRƯỜNG CỦA 2 EFORM', 1)
para('Trích nguyên từ file mô tả đầu vào eform, sheet "Sở Du lịch". Cột "Dùng trên IOC" cho biết trường có tham gia tính toán thẻ số / biểu đồ hay không.')
KYS = {'Kỳ báo cáo', 'Năm', 'Quý', 'Tháng'}
USED = [KYS | {'Đơn vị báo cáo', 'Loại điểm du lịch', 'Số lượt khách du lịch quốc tế', 'Số lượt khách du lịch nội địa'},
        KYS | {'Đơn vị báo cáo', 'Loại điểm du lịch', 'Loại doanh thu', 'Giá trị doanh thu (VND)'}]
for i, e in enumerate(EF):
    heading(f'{i + 1}. {e["eform"]} ({len(e["fields"])} trường)', 2)
    rows, fills = [['#', 'Tên trường', 'Mã trường', 'Kiểu nhập', 'Dùng trên IOC']], {}
    for j, f in enumerate(e['fields']):
        d = 'Có' if f[0] in USED[i] else '—'; rows.append([str(j + 1), f[0], f[1], f[2] or '(chưa ghi)', d])
        if d == 'Có': fills[(j + 1, 4)] = k.OK_FILL
    table(rows, [0.8, 5.2, 6.2, 2.0, 1.8], size=10, fills=fills, mono_col=2)
    missing = USED[i] - {f[0] for f in e['fields']}
    assert not missing, (i, missing)
print('đề nghị:', len(ALL_NOTES))
for p in k.save(OUT): print('ok', p)
