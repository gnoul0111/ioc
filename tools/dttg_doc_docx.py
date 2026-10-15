# -*- coding: utf-8 -*-
"""Sinh docs/DTTG_SoDanTocTonGiao/DTTG_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 4 chỉ tiêu của Sở Dân tộc và Tôn giáo trên IOC
(eform Chương trình mục tiêu quốc gia vùng đồng bào DTTS và miền núi).
Chạy từ thư mục gốc ioc:  python tools/dttg_doc_docx.py
Lời văn viết tay; CÁC CON SỐ đọc thẳng từ js/core/dttg-config.js (qua node) nên luôn khớp giao diện.
Tên trường đúng như file mô tả đầu vào eform (tools/dttg-fields.json, trích từ sheet "Sở DTTG"). Word + Markdown qua tools/doc_kit.py.
Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EF = json.load(open(os.path.join(ROOT, 'tools', 'dttg-fields.json'), encoding='utf-8'))[0]
OUT = os.path.join(ROOT, 'docs', 'DTTG_SoDanTocTonGiao', 'DTTG_MO_TA_CHI_TIEU.docx')

_JS = ("const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
       "vm.runInContext(fs.readFileSync('js/core/dttg-config.js','utf8')+"
       "';this.S=DTTG_SUM;this.X=DTTG_XA;this.R=DTTG_REC;this.C={DATP:DTTG_DATP,NGUON:DTTG_NGUON,TT:DTTG_TT,DS:DTTG_DOI_SOAT,CO:DTTG_CO,NDL:DTTG_NGUON_DL,BC:DTTG_BC,LOAI:DTTG_LOAI_BG,DUNG:DTTG_DUNG_TD};"
       "this.U=DTTG_UNITS.map(u=>({ten:u.ten,bc:u.bc,n:u.rec.length}));',c);"
       "process.stdout.write(JSON.stringify({S:c.S,X:c.X,R:c.R,C:c.C,U:c.U}));")
_J = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))
S, X, REC, C, U = _J['S'], _J['X'], _J['R'], _J['C'], _J['U']
lab = lambda key: [x[0] if isinstance(x, list) else x for x in C[key]]
DATP, NGUON, TT, DS, CO, NDL, BC, LOAI, DUNG = (lab(k) for k in ('DATP', 'NGUON', 'TT', 'DS', 'CO', 'NDL', 'BC', 'LOAI', 'DUNG'))


def n(x, d=0):
    s = f'{abs(x):,.{d}f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return ('−' if x < 0 else '') + s
def pc(a, b, d=1): return n(a / b * 100, d) + '%'
def ty(trieu, d=1): return n(trieu / 1000, d)
def ssum(a): return sum(a)


G, T, K, D = S['gn'], S['td'], S['kq'], S['ds']
NX, NDV = len(X), len(U)
EFORM = EF['eform']
FN = [f[0] for f in EF['fields']]
TH = [f'T{m + 1}' for m in range(9)]

k = Kit('Sở Dân tộc và Tôn giáo · Mô tả chỉ tiêu trên IOC')
para, table, box, heading, note = k.para, k.table, k.box, k.heading, k.note

# ======================================================= TRANG BÌA
k.blank(4)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(3)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY)
para('SỞ DÂN TỘC VÀ TÔN GIÁO HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('Biểu đồ, trường dữ liệu và cách tính số liệu của 4 chỉ tiêu trên IOC', 14, CENTER, 4, italic=True, color=GREY)
para('xây dựng từ eform Chương trình mục tiêu quốc gia vùng đồng bào DTTS và miền núi', 14, CENTER, 0, italic=True, color=GREY)
k.blank(4)
table([
    ['Đơn vị', 'Sở Dân tộc và Tôn giáo Thành phố Hà Nội'],
    ['Nguồn dữ liệu', f'File mô tả đầu vào eform, sheet "Sở DTTG": 1 eform "{EFORM}", {len(FN)} trường nhập'],
    ['Phạm vi', '4 chỉ tiêu, 14 biểu đồ, bảng 126 phường/xã'],
    ['Số liệu ví dụ', f'Số giả lập (chưa có số liệu thật), địa bàn thật theo QĐ 201/QĐ-UBND: {NX} xã, {len(REC)} dự án/công trình, kỳ tháng 9/2026'],
    ['Phiên bản', '1.3 · ngày 13/10/2026 (theo phản hồi nhóm triển khai khi nối eform thật: thêm quy ước xử lý dữ liệu eform — khóa bản ghi, cách lấy theo kỳ, chỉ hiện số có trường trong eform)'],
], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()
k.toc()
k.page_break()

# ======================================================= PHẦN I
heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Mục đích tài liệu', 2)
para('Tài liệu mô tả cách IOC dựng các chỉ tiêu của Sở Dân tộc và Tôn giáo từ eform theo dõi Chương trình mục tiêu quốc gia phát triển kinh tế - xã hội vùng đồng bào dân tộc thiểu số và miền núi: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào của eform, mỗi trường dùng để làm gì, và mỗi con số được cộng, đếm, tính toán ra sao. Tên trường viết đúng như trong file mô tả đầu vào eform.')
SHOW_NOTE_BOX = False  # khối "Lưu ý, đề nghị Sở xác nhận" cuối mỗi chỉ tiêu — ẩn theo yêu cầu 14/10/2026; nội dung vẫn gom vào Phần IV
para('Trên giao diện IOC, mỗi chỉ tiêu chỉ gồm **thẻ số tổng hợp** và **biểu đồ**; cách tính từng số chỉ trình bày trong tài liệu này. '
     + ('Cuối mỗi chỉ tiêu có mục **"Lưu ý, đề nghị Sở xác nhận"**; Phần IV gom toàn bộ các đề nghị.' if SHOW_NOTE_BOX else 'Phần IV gom toàn bộ các đề nghị Sở xác nhận.'))
box(['Mọi con số ví dụ trong tài liệu là **số giả lập** dùng để dựng giao diện, đã được cộng kiểm cho khớp. Khi có số liệu thật, cách tính giữ nguyên, chỉ thay số.',
     'Phần **có thật**: danh sách xã, thôn vùng đồng bào DTTS và miền núi (Quyết định 201/QĐ-UBND, xem Phần I mục 6). Số giả lập được đặt cho sát thực tế: vốn chủ yếu là ngân sách Thành phố, các chỉ số nước sạch, đường, học sinh ở mức cao, hộ nghèo gần như bằng 0.'], k.NOTE_FILL, 'Lưu ý: ')

heading('2. Một eform, bốn chỉ tiêu', 2)
para(f'Sở có **một eform** với {len(FN)} trường. Mỗi bản ghi là **một dự án, tiểu dự án, hoạt động hoặc công trình** của một «Thôn/TDP» thuộc một «Địa bàn» (phường/xã) trong một kỳ báo cáo; phường/xã không có dự án gửi **một bản ghi "Không phát sinh"**. Eform gộp nhiều nhóm thông tin nên IOC tách thành 4 chỉ tiêu cùng đọc chung eform:')
table([
    ['#', 'Chỉ tiêu trên IOC', 'Nhóm trường của eform'],
    ['1', 'Giải ngân vốn Chương trình', ['«Nguồn vốn», «Kế hoạch vốn năm (triệu đồng)», «Vốn được phân bổ (triệu đồng)», «Giải ngân kỳ này (triệu đồng)», «Giải ngân lũy kế (triệu đồng)», «Vốn đình trệ do pháp lý/TTHC (triệu đồng)»']],
    ['2', 'Tiến độ thực hiện dự án, công trình', ['«Loại bản ghi», «Trạng thái triển khai», «Tiến độ kế hoạch (%)», «Tiến độ thực tế (%)», «Đúng tiến độ?», «Số vụ vi phạm/sai phạm», «Có báo cáo KTGS đúng hạn?»']],
    ['3', 'Kết quả đối với vùng đồng bào DTTS', ['«Số hộ DTTS», «Số hộ DTTS dùng nước HVS», «Số địa bàn có đường ô tô đến trung tâm», «Số địa bàn đã cứng hóa», «HS trong độ tuổi đi học», «HS đi học đúng cấp», «Hộ nghèo đầu kỳ», «Hộ nghèo cuối kỳ»']],
    ['4', 'Tình hình báo cáo và đối soát dữ liệu', ['«Loại bản ghi» (Không phát sinh), «Áp dụng công nghệ số/báo cáo tháng?», «Nguồn dữ liệu», «Trạng thái đối soát», «Cờ dữ liệu»']],
], [0.8, 4.6, 10.6], size=10.5)
para('Các trường dùng chung: «Kỳ báo cáo», «Năm», «Quý», «Tháng» (chọn kỳ), «Địa bàn» (phường/xã), «Dự án thành phần/Nội dung CTMTQG» (nhóm dự án).')
note('Bộ chỉ tiêu cũ của Sở (STT 77, nguồn File) đã được thay bằng bộ này và đã xóa khỏi IOC.')

heading('3. Kỳ báo cáo', 2)
para('Eform nhập theo **tháng** (dữ liệu mẫu: Tháng 9/2026). Kỳ hiển thị mặc định là **tháng 9/2026**. Các trường lấy theo kỳ khác nhau:')
table([
    ['Loại số', 'Các trường', 'Cách lấy'],
    ['**Số trong tháng**', '«Giải ngân kỳ này (triệu đồng)»', 'Số giải ngân phát sinh trong tháng. Dùng cho cột "Giải ngân trong tháng" của biểu đồ 1.1 và thẻ Giải ngân tháng 9.'],
    ['**Số lũy kế, số tại thời điểm**', ['«Kế hoạch vốn năm», «Vốn được phân bổ», «Giải ngân lũy kế», «Vốn đình trệ…»', 'Trạng thái, tiến độ, các chỉ số kết quả, trạng thái đối soát'],
     'Lấy bản ghi của **tháng đang xem** (tháng 9), không cộng các tháng. «Giải ngân lũy kế» đã là số từ đầu năm.'],
], [3.4, 6.4, 6.2], size=10.5)
box([f'Giải ngân lũy kế tháng 9 = {ty(G["gn"])} tỷ đồng = cộng giải ngân trong tháng từ tháng 1 đến tháng 9 ({" + ".join(ty(v) for v in G["kyT"])}).'], k.FORM_FILL, 'Kiểm tra khớp: ')

heading('4. Trường tỷ lệ do đơn vị tự tính', 2)
para('Eform có sẵn các trường tỷ lệ: «Tỷ lệ giải ngân/KH», «Tỷ lệ giải ngân/phân bổ», «Tỷ lệ vốn đình trệ», «Tỷ lệ hộ DTTS dùng nước HVS», «Tỷ lệ đường trung tâm cứng hóa», «Tỷ lệ HS đi học đúng cấp», «Tỷ lệ giảm hộ nghèo». IOC **không dùng** các trường này mà **cộng tử số và mẫu số rồi mới chia**, vì lấy trung bình các tỷ lệ của dự án/xã có quy mô khác nhau sẽ sai.')

heading('5. Các phép tính dùng trong tài liệu', 2)
table([
    ['Ký hiệu', 'Ý nghĩa', 'Ví dụ'],
    ['ĐẾM(điều kiện)', 'Đếm số bản ghi thỏa điều kiện', 'ĐẾM(«Trạng thái triển khai» = Hoàn thành)'],
    ['TỔNG(«trường»)', 'Cộng giá trị của trường trên các bản ghi được lấy', 'TỔNG(«Giải ngân lũy kế (triệu đồng)»)'],
    ['Nhóm theo «trường»', 'Chia bản ghi thành nhóm theo giá trị của trường, rồi đếm / cộng trong từng nhóm', 'Nhóm theo «Dự án thành phần/Nội dung CTMTQG»'],
    ['Tỷ lệ (%)', 'Tử số ÷ Mẫu số × 100, làm tròn 1 chữ số thập phân', f'{ty(G["gn"])} ÷ {ty(G["kh"])} × 100 = {pc(G["gn"], G["kh"])}'],
    ['Bình quân có trọng số', 'TỔNG(giá trị × trọng số) ÷ TỔNG(trọng số)', 'Tiến độ bình quân, trọng số là vốn phân bổ'],
    ['Đổi đơn vị', 'Triệu đồng → tỷ đồng (÷ 1.000)', f'{n(G["kh"])} triệu đồng = {ty(G["kh"])} tỷ đồng'],
], [3.6, 6.6, 5.8])

heading('6. Địa bàn và căn cứ số giả lập', 2)
para(f'Danh mục «Địa bàn» gồm đúng **{NDV} phường/xã**. Vùng đồng bào DTTS và miền núi của Hà Nội giai đoạn 2026 – 2030 lấy theo **Quyết định 201/QĐ-UBND ngày 15/01/2026** của UBND Thành phố:')
k.bullets(['**5 xã khu vực I**: ' + ', '.join(x[0] for x in X if len(x) < 6) + '.',
           '**6 thôn**: ' + '; '.join('thôn ' + ', '.join(x[5]) + ' (' + x[0] + ')' for x in X if len(x) >= 6) + '. Ở 2 xã này chỉ các thôn trên có dự án.'])
para(f'Các phường/xã còn lại gửi bản "Không phát sinh" ({D["bc"][1]} đơn vị); trong số giả lập có {D["bc"][2]} phường/xã chưa gửi báo cáo tháng 9. Bảng bên phải của IOC hiện đủ {NDV} phường/xã (Phần III).')
para('Căn cứ để đặt số giả lập cho sát thực tế:')
k.bullets(['**Nguồn vốn**: Hà Nội là địa phương tự cân đối ngân sách, phải tự bố trí ngân sách địa phương cho Chương trình (báo cáo đánh giá thực trạng của Sở Tài chính, 6/2026) → số giả lập không có vốn ngân sách Trung ương, ngân sách Thành phố chiếm ' + pc(G['byNguon'][1], G['kh']) + '.',
           '**Quy mô vốn**: giai đoạn 2021 – 2025 Thành phố bố trí trên 2.144 tỷ đồng cho Chương trình (riêng xã Yên Bài cũ hơn 224 tỷ đồng cho 18 dự án) → số giả lập năm 2026 khoảng ' + ty(G['kh'], 0) + ' tỷ đồng.',
           '**Hộ nghèo**: Hà Nội đã không còn hộ nghèo theo chuẩn nghèo đa chiều từ năm 2024, các xã miền núi huyện Ba Vì cũ đã xóa hết hộ nghèo → số giả lập hộ nghèo bằng 0 ở Ba Vì, Yên Bài, Suối Hai và chỉ vài hộ ở các xã còn lại.',
           '**Hạ tầng, nước sạch, học sinh**: 100% xã vùng DTTS đã có đường nhựa hoặc bê tông đến trung tâm xã → các tỷ lệ giả lập ở mức 95 – 99%.',
           '**Số hộ DTTS, số thôn của từng xã, tên dự án**: chưa có số công bố theo xã mới sau sắp xếp, là số giả lập (Hà Nội có khoảng 108 nghìn người DTTS, chủ yếu dân tộc Mường, Dao).'])

heading('7. Tổng hợp 4 chỉ tiêu', 2)
table([
    ['#', 'Chỉ tiêu trên IOC', 'Kỳ hiển thị', 'Thẻ số', 'Biểu đồ'],
    ['1', 'Giải ngân vốn Chương trình mục tiêu quốc gia vùng đồng bào DTTS', 'Lũy kế đến tháng 9/2026', '5', '4'],
    ['2', 'Tiến độ thực hiện dự án, công trình', 'Tháng 9/2026', '6', '3'],
    ['3', 'Kết quả đối với vùng đồng bào dân tộc thiểu số', 'Tháng 9/2026', '5', '3'],
    ['4', 'Tình hình báo cáo và đối soát dữ liệu', 'Tháng 9/2026', '5', '4'],
], [0.8, 7.0, 3.8, 1.8, 2.6], size=10.5)

# ======================================================= PHẦN II
k.page_break()
heading('PHẦN II. CHI TIẾT 4 CHỈ TIÊU', 1)
note('Mỗi chỉ tiêu: (1) Thông tin chung · (2) Trường dữ liệu sử dụng · (3) Thẻ số tổng hợp · (4) Từng biểu đồ' + (' · (5) Lưu ý, đề nghị Sở xác nhận' if SHOW_NOTE_BOX else '') + '.')

def fields_table(rows):
    data = [['#', 'Tên trường (đúng như eform)', 'Kiểu nhập', 'Vai trò', 'Dùng để']]
    for i, r in enumerate(rows): data.append([str(i + 1)] + list(r))
    table(data, [0.8, 5.4, 2.0, 2.3, 5.5], size=10.5)
def kpi_table(rows): table([['Thẻ số', 'Công thức', 'Kết quả (giả lập)']] + rows, [3.6, 8.2, 4.2], size=11, keep=True)
def chart(code, title, kind, axis, value, formula, example, note_=None):
    heading(f'Biểu đồ {code}. {title}', 3)
    rows = [['Loại biểu đồ', kind], ['Trục / nhóm', axis], ['Giá trị hiển thị', value], ['Cách tính', formula], ['Ví dụ (giả lập)', example]]
    if note_: rows.append(['Ghi chú', note_])
    table(rows, [3.4, 12.6], header=False, size=11.5, key_col=True, keep=True)
def info_table(rows): table(rows, [4.0, 12.0], header=False, size=11.5, key_col=True, keep=True)
ALL_NOTES = []
def notes(ct, items):
    if SHOW_NOTE_BOX: box(['• ' + x for x in items], k.NOTE_FILL, 'Lưu ý, đề nghị Sở xác nhận', 12)
    ALL_NOTES.extend((ct, x) for x in items)
KY = [['Kỳ báo cáo, Năm,', 'Quý, Tháng'], 'Danh mục / Số', 'Lọc kỳ', 'Chọn bản ghi tháng 9 (biểu đồ theo tháng lấy tháng 1 – 9)']
DB = ['Địa bàn', 'Danh mục', 'Nhóm', 'Hàng của biểu đồ theo xã; bảng 126 phường/xã']
DA = ['Dự án thành phần/Nội dung CTMTQG', 'Danh mục', 'Nhóm', 'Hàng của biểu đồ theo dự án thành phần']
LB = ['Loại bản ghi', 'Danh mục', 'Điều kiện', 'Bỏ bản ghi "Không phát sinh" khỏi phép tính']

# ---------------- CHỈ TIÊU 1
heading('Chỉ tiêu 1. Giải ngân vốn Chương trình mục tiêu quốc gia vùng đồng bào DTTS', 2)
heading('1.1. Thông tin chung', 3)
info_table([['Eform nguồn', EFORM], ['Một bản ghi là', 'Một dự án, tiểu dự án, hoạt động hoặc công trình của một thôn trong một tháng'],
            ['Cách lấy theo kỳ', 'Vốn kế hoạch, phân bổ, giải ngân lũy kế: bản ghi tháng 9. Giải ngân trong tháng: «Giải ngân kỳ này» của từng tháng 1 – 9.'],
            ['Kỳ hiển thị', f'Lũy kế đến tháng 9/2026 · {len(REC)} bản ghi dự án của {NX} xã · đơn vị tỷ đồng']])
heading('1.2. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB, DA, LB,
    ['Nguồn vốn', 'Danh mục', 'Nhóm', 'Lát cắt biểu đồ 1.3'],
    ['Kế hoạch vốn năm (triệu đồng)', 'Số', 'Cộng', 'Thẻ số; mẫu số tỷ lệ giải ngân; biểu đồ 1.1 – 1.4'],
    ['Vốn được phân bổ (triệu đồng)', 'Số', 'Cộng', 'Thẻ số; đường gạch biểu đồ 1.1'],
    ['Giải ngân kỳ này (triệu đồng)', 'Số', 'Cộng', 'Thẻ Giải ngân tháng 9; cột biểu đồ 1.1'],
    ['Giải ngân lũy kế (triệu đồng)', 'Số', 'Cộng', 'Thẻ số; đường biểu đồ 1.1; biểu đồ 1.2, 1.4'],
    ['Vốn đình trệ do pháp lý/TTHC (triệu đồng)', 'Số', 'Cộng', 'Thẻ Vốn đình trệ'],
    ['Tỷ lệ giải ngân/KH, Tỷ lệ giải ngân/phân bổ, Tỷ lệ vốn đình trệ', 'Số', 'Không dùng', 'IOC tự tính lại từ tổng (Phần I, mục 4)'],
])
heading('1.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Kế hoạch vốn năm 2026', 'TỔNG(«Kế hoạch vốn năm (triệu đồng)») ÷ 1.000', f'{ty(G["kh"])} tỷ đồng'],
    ['Đã phân bổ', 'TỔNG(«Vốn được phân bổ (triệu đồng)»); dòng phụ = ÷ Kế hoạch × 100', f'{ty(G["pb"])} tỷ đồng ({pc(G["pb"], G["kh"])})'],
    ['Giải ngân lũy kế', 'TỔNG(«Giải ngân lũy kế (triệu đồng)») tháng 9; dòng phụ = ÷ Kế hoạch, ÷ Phân bổ', f'{ty(G["gn"])} tỷ đồng ({pc(G["gn"], G["kh"])} KH, {pc(G["gn"], G["pb"])} PB)'],
    ['Giải ngân tháng 9', 'TỔNG(«Giải ngân kỳ này (triệu đồng)») tháng 9', f'{ty(G["gnKy"])} tỷ đồng'],
    ['Vốn đình trệ do pháp lý, thủ tục', 'TỔNG(«Vốn đình trệ do pháp lý/TTHC (triệu đồng)»); dòng phụ = ÷ Phân bổ × 100', f'{ty(G["dinhTre"])} tỷ đồng ({pc(G["dinhTre"], G["pb"])})'],
])
heading('1.4. Biểu đồ', 3)
chart('1.1', 'Giải ngân theo tháng', 'Biểu đồ kết hợp: cột + đường, cùng một trục (tỷ đồng)',
      'Trục ngang: «Tháng» 1 → 9', 'Cột: giải ngân trong tháng · Đường liền: giải ngân lũy kế · Đường gạch: vốn đã phân bổ và kế hoạch vốn năm',
      ['Nhóm theo «Tháng»:', 'Cột = TỔNG(«Giải ngân kỳ này»); Đường liền = TỔNG(«Giải ngân lũy kế»);', 'Hai đường gạch = TỔNG(«Vốn được phân bổ»), TỔNG(«Kế hoạch vốn năm») của tháng 9 (đường ngang để so).'],
      ' · '.join(f'{TH[m]}: tháng {ty(G["kyT"][m])}, lũy kế {ty(G["luyKeT"][m])}' for m in (2, 5, 8)) + f' (tỷ đồng); kế hoạch {ty(G["kh"])}.',
      'Khoảng cách giữa đường lũy kế và đường kế hoạch là số vốn còn phải giải ngân trong 3 tháng cuối năm.')
dp = sorted(range(len(DATP)), key=lambda i: -G['byDatp'][i][0])
chart('1.2', 'Kế hoạch vốn và giải ngân theo dự án thành phần', 'Biểu đồ cột ngang, mỗi dòng 2 cột cạnh nhau (cùng đơn vị tỷ đồng)',
      f'Trục dọc: {len(DATP)} giá trị của «Dự án thành phần/Nội dung CTMTQG», xếp theo kế hoạch vốn từ lớn xuống', 'Kế hoạch vốn và giải ngân lũy kế (tỷ đồng); di chuột hiện thêm vốn đã phân bổ',
      'Nhóm theo «Dự án thành phần/Nội dung CTMTQG»: TỔNG(«Kế hoạch vốn năm»), TỔNG(«Vốn được phân bổ»), TỔNG(«Giải ngân lũy kế»), bản ghi tháng 9.',
      ' · '.join(f'{DATP[i]}: {ty(G["byDatp"][i][0])} / {ty(G["byDatp"][i][2])}' for i in dp[:3]) + ' (kế hoạch / giải ngân, tỷ đồng)')
chart('1.3', 'Kế hoạch vốn theo nguồn vốn', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng kế hoạch vốn',
      f'{len(NGUON)} giá trị của «Nguồn vốn» (bỏ "Không phát sinh")', 'Tỷ đồng; di chuột hiện thêm tỷ trọng %',
      'Nhóm theo «Nguồn vốn»: TỔNG(«Kế hoạch vốn năm»), bản ghi tháng 9.',
      ' · '.join(f'{NGUON[i]} {ty(v)}' for i, v in enumerate(G['byNguon'])) + f' → giữa vòng {ty(G["kh"])}')
chart('1.4', 'Kế hoạch vốn và giải ngân theo xã', 'Biểu đồ cột ngang, mỗi xã 2 cột cạnh nhau',
      f'Trục dọc: {NX} «Địa bàn» có dự án, xếp theo kế hoạch vốn từ lớn xuống', 'Tỷ đồng',
      'Nhóm theo «Địa bàn»: TỔNG(«Kế hoạch vốn năm»), TỔNG(«Giải ngân lũy kế»), bản ghi tháng 9.',
      ' · '.join(f'{r[0]}: {ty(r[1])} / {ty(r[2])} ({pc(r[2], r[1])})' for r in G['byXa'][:3]))
notes('1', ['Tên eform vẫn là "Chương trình mục tiêu quốc gia phát triển kinh tế - xã hội vùng đồng bào DTTS và miền núi". Từ năm 2026, Chương trình được gộp với Chương trình nông thôn mới và giảm nghèo bền vững thành một Chương trình mục tiêu quốc gia giai đoạn 2026 – 2035 (Nghị quyết 257/2025/QH15). Đề nghị Sở xác nhận có đổi tên eform và danh mục «Dự án thành phần/Nội dung CTMTQG» theo Chương trình mới không.',
            'Hà Nội tự bố trí ngân sách địa phương cho Chương trình nên giá trị "NSTW" của «Nguồn vốn» gần như không dùng. Đề nghị tách "NSĐP" thành "Ngân sách Thành phố" và "Ngân sách xã (vốn đối ứng)" để theo dõi được tỷ lệ đối ứng của xã.',
            'IOC không dùng 3 trường tỷ lệ tự tính («Tỷ lệ giải ngân/KH», «Tỷ lệ giải ngân/phân bổ», «Tỷ lệ vốn đình trệ») mà tự tính từ tổng. Đề nghị để 3 trường này tự tính trên eform (chỉ đọc) để tránh nhập lệch.',
            'Đề nghị eform kiểm tra: «Giải ngân lũy kế» tháng này = lũy kế tháng trước + «Giải ngân kỳ này», và lũy kế ≤ «Vốn được phân bổ» ≤ «Kế hoạch vốn năm». Dữ liệu mẫu đang ghi kỳ này 250,2 lớn hơn lũy kế 200,84 (không hợp lý).',
            'Mỗi bản ghi chỉ chọn được một «Nguồn vốn». Đề nghị xác nhận: dự án dùng nhiều nguồn vốn thì nhập thành nhiều bản ghi (mỗi nguồn một bản ghi, cùng «Mã dự án/tiểu dự án/hoạt động»).',
            'Đề nghị xác nhận «Vốn đình trệ do pháp lý/TTHC» là phần vốn đã phân bổ nhưng chưa giải ngân được vì vướng thủ tục (IOC so với vốn phân bổ).'])

# ---------------- CHỈ TIÊU 2
k.page_break()
heading('Chỉ tiêu 2. Tiến độ thực hiện dự án, công trình', 2)
heading('2.1. Thông tin chung', 3)
done = T['dung'][0] + T['dung'][1]
info_table([['Eform nguồn', EFORM], ['Một bản ghi là', 'Một dự án, tiểu dự án, hoạt động hoặc công trình (khóa: «Mã dự án/tiểu dự án/hoạt động»)'],
            ['Cách lấy theo kỳ', 'Bản ghi tháng 9 (trạng thái, tiến độ tại cuối tháng).'], ['Kỳ hiển thị', f'Tháng 9/2026 · {T["n"]} dự án, công trình']])
heading('2.2. Trường dữ liệu sử dụng', 3)
fields_table([KY, DA, LB,
    ['Mã dự án/tiểu dự án/hoạt động', 'Chữ', 'Khóa', 'Đếm dự án, chống đếm trùng'],
    ['Trạng thái triển khai', 'Danh mục', 'Điều kiện, Nhóm', 'Thẻ số; biểu đồ 2.1, 2.2'],
    ['Tiến độ kế hoạch (%)', 'Số', 'Cộng', 'Biểu đồ 2.3 (bình quân có trọng số)'],
    ['Tiến độ thực tế (%)', 'Số', 'Cộng', 'Biểu đồ 2.3 (bình quân có trọng số)'],
    ['Vốn được phân bổ (triệu đồng)', 'Số', 'Cộng', 'Trọng số của tiến độ bình quân'],
    ['Đúng tiến độ?', 'Danh mục', 'Điều kiện', 'Thẻ Đúng tiến độ'],
    ['Số vụ vi phạm/sai phạm', 'Số', 'Cộng', 'Thẻ Vụ vi phạm'],
    ['Có báo cáo KTGS đúng hạn?', 'Danh mục', 'Điều kiện', 'Thẻ Báo cáo kiểm tra giám sát đúng hạn'],
    ['Thôn/TDP, Tên dự án/tiểu dự án/hoạt động, Vướng mắc/Nguyên nhân, Kiến nghị xử lý', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('2.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Dự án, công trình', 'ĐẾM(«Mã dự án…») có «Loại bản ghi» ≠ Không phát sinh; dòng phụ tách theo «Loại bản ghi»', f'{T["n"]} ({T["loai"][0]} dự án, {T["loai"][1]} tiểu dự án, {T["loai"][2]} công trình)'],
    ['Hoàn thành', 'ĐẾM(«Trạng thái triển khai» = Hoàn thành); dòng phụ = ÷ số dự án', f'{T["tt"][0]} ({pc(T["tt"][0], T["n"])})'],
    ['Đúng tiến độ', 'ĐẾM(«Đúng tiến độ?» = Có) ÷ ĐẾM(«Đúng tiến độ?» = Có hoặc Không) × 100 (bỏ "Không áp dụng")', f'{T["dung"][0]} ÷ {done} = {pc(T["dung"][0], done)}'],
    ['Đình trệ, tạm dừng', 'ĐẾM(«Trạng thái triển khai» = Đình trệ hoặc Tạm dừng)', f'{T["tt"][3] + T["tt"][4]} ({T["tt"][3]} đình trệ, {T["tt"][4]} tạm dừng)'],
    ['Vụ vi phạm, sai phạm', 'TỔNG(«Số vụ vi phạm/sai phạm»)', n(T['viPham'])],
    ['Báo cáo KTGS đúng hạn', 'ĐẾM(«Có báo cáo KTGS đúng hạn?» = Có) ÷ số dự án × 100', f'{T["ktgs"][0]} ÷ {T["n"]} = {pc(T["ktgs"][0], T["n"])}'],
])
heading('2.4. Biểu đồ', 3)
chart('2.1', 'Dự án, công trình theo trạng thái triển khai', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng số dự án',
      f'{len(TT)} giá trị của «Trạng thái triển khai» (bỏ "Không phát sinh")', 'Số dự án; di chuột hiện thêm tỷ trọng %',
      'Nhóm theo «Trạng thái triển khai»: ĐẾM(«Mã dự án…»).', ' · '.join(f'{TT[i]} {T["tt"][i]}' for i in range(len(TT))) + f' → giữa vòng {T["n"]}')
chart('2.2', 'Trạng thái theo dự án thành phần', 'Biểu đồ cột ngang xếp chồng',
      f'Trục dọc: {len(DATP)} dự án thành phần; mỗi cột chia {len(TT)} phần theo trạng thái', 'Số dự án; số ở đầu cột = tổng',
      'Nhóm theo «Dự án thành phần/Nội dung CTMTQG» và «Trạng thái triển khai»: ĐẾM(«Mã dự án…»).',
      ' · '.join(f'{DATP[d]}: ' + ' + '.join(str(v) for v in T['ttDatp'][d]) + f' = {ssum(T["ttDatp"][d])}' for d in (0, 5)))
chart('2.3', 'Tiến độ kế hoạch và thực tế theo dự án thành phần', 'Biểu đồ cột ngang, mỗi dòng 2 cột cạnh nhau (%)',
      f'Trục dọc: {len(DATP)} dự án thành phần', 'Tiến độ kế hoạch và tiến độ thực tế bình quân (%)',
      ['Với mỗi dự án thành phần, bỏ dự án "Chưa triển khai":', 'Tiến độ = TỔNG(tiến độ × «Vốn được phân bổ») ÷ TỔNG(«Vốn được phân bổ»).'],
      ' · '.join(f'{DATP[d]} {n(T["tdDatp"][d][0])}% / {n(T["tdDatp"][d][1])}%' for d in (0, 1, 5)),
      'Cột thực tế ngắn hơn cột kế hoạch là dự án thành phần đang chậm.')
notes('2', ['Tiến độ bình quân của dự án thành phần đang tính có trọng số theo vốn phân bổ (dự án lớn ảnh hưởng nhiều hơn). Đề nghị Sở xác nhận, hoặc chọn bình quân đơn giản.',
            '«Đúng tiến độ?» đang nhập tay. Đề nghị thống nhất quy tắc (ví dụ: tiến độ thực tế không thấp hơn kế hoạch quá 5 điểm %) hoặc để IOC tự xác định từ hai trường tiến độ.',
            'Đề nghị định nghĩa rõ "Đình trệ" (vướng mắc, không thực hiện được) và "Tạm dừng" (dừng theo quyết định) để các xã chọn thống nhất.',
            '«Số vụ vi phạm/sai phạm» được nhập theo từng dự án. Đề nghị xác nhận có tính cả vi phạm phát hiện qua kiểm tra, giám sát của cấp trên không, và tránh nhập trùng một vụ cho nhiều dự án.'])

# ---------------- CHỈ TIÊU 3
k.page_break()
heading('Chỉ tiêu 3. Kết quả đối với vùng đồng bào dân tộc thiểu số', 2)
heading('3.1. Thông tin chung', 3)
info_table([['Eform nguồn', EFORM], ['Một bản ghi là', 'Các chỉ số kết quả của một xã (lấy một lần cho mỗi xã, xem lưu ý)'],
            ['Cách lấy theo kỳ', 'Số tại thời điểm: bản ghi tháng 9. «Hộ nghèo đầu kỳ» là số đầu năm 2026.'], ['Kỳ hiển thị', f'Tháng 9/2026 · {NX} xã']])
heading('3.2. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Số hộ DTTS', 'Số', 'Cộng', 'Thẻ số; mẫu số tỷ lệ nước HVS; biểu đồ 3.3'],
    ['Số hộ DTTS dùng nước HVS', 'Số', 'Cộng', 'Tử số tỷ lệ nước HVS; biểu đồ 3.1, 3.3'],
    ['Số địa bàn có đường ô tô đến trung tâm', 'Số', 'Cộng', 'Mẫu số tỷ lệ đường cứng hóa (IOC hiểu "địa bàn" là thôn)'],
    ['Số địa bàn đã cứng hóa', 'Số', 'Cộng', 'Tử số tỷ lệ đường cứng hóa'],
    ['HS trong độ tuổi đi học', 'Số', 'Cộng', 'Mẫu số tỷ lệ HS đi học đúng cấp'],
    ['HS đi học đúng cấp', 'Số', 'Cộng', 'Tử số tỷ lệ HS đi học đúng cấp'],
    ['Hộ nghèo đầu kỳ', 'Số', 'Cộng', 'Mẫu số tỷ lệ giảm hộ nghèo; biểu đồ 3.2'],
    ['Hộ nghèo cuối kỳ', 'Số', 'Cộng', 'Tỷ lệ giảm hộ nghèo; biểu đồ 3.2'],
    ['4 trường tỷ lệ (nước HVS, đường, HS, giảm hộ nghèo)', 'Số', 'Không dùng', 'IOC tự tính lại từ tổng (Phần I, mục 4)'],
])
heading('3.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Hộ đồng bào DTTS', 'TỔNG(«Số hộ DTTS») của các xã', f'{n(K["soHo"])} hộ, {NX} xã'],
    ['Hộ dùng nước hợp vệ sinh', 'TỔNG(«Số hộ DTTS dùng nước HVS») ÷ TỔNG(«Số hộ DTTS») × 100', f'{n(K["hoNuoc"])} ÷ {n(K["soHo"])} = {pc(K["hoNuoc"], K["soHo"])}'],
    ['Đường đến trung tâm đã cứng hóa', 'TỔNG(«Số địa bàn đã cứng hóa») ÷ TỔNG(«Số địa bàn có đường ô tô đến trung tâm») × 100', f'{K["soCungHoa"]} ÷ {K["soDuong"]} = {pc(K["soCungHoa"], K["soDuong"])}'],
    ['Học sinh đi học đúng cấp', 'TỔNG(«HS đi học đúng cấp») ÷ TỔNG(«HS trong độ tuổi đi học») × 100', f'{n(K["hsDungCap"])} ÷ {n(K["hsTuoi"])} = {pc(K["hsDungCap"], K["hsTuoi"])}'],
    ['Giảm hộ nghèo', '(TỔNG(«Hộ nghèo đầu kỳ») − TỔNG(«Hộ nghèo cuối kỳ»)) ÷ TỔNG(«Hộ nghèo đầu kỳ») × 100', f'({K["hoNgheoDau"]} − {K["hoNgheoCuoi"]}) ÷ {K["hoNgheoDau"]} = {pc(K["hoNgheoDau"] - K["hoNgheoCuoi"], K["hoNgheoDau"])}'],
])
heading('3.4. Biểu đồ', 3)
TL = ['Hộ dùng nước hợp vệ sinh', 'Đường trung tâm cứng hóa', 'Học sinh đi học đúng cấp', 'Giảm hộ nghèo']
chart('3.1', 'Bốn chỉ số kết quả của vùng đồng bào DTTS', 'Biểu đồ cột ngang (%)', 'Trục dọc: 4 chỉ số ở thẻ số', 'Tỷ lệ (%)',
      'Mỗi cột = tỷ lệ tính như thẻ số tương ứng (cộng các xã rồi mới chia).', ' · '.join(f'{TL[i]} {n(K["tl"][i], 1)}%' for i in range(4)))
kx = sorted(S['kqXa'], key=lambda u: -u['hoNgheoDau'])
chart('3.2', 'Hộ nghèo DTTS đầu kỳ và cuối kỳ theo xã', 'Biểu đồ cột ngang, mỗi xã 2 cột cạnh nhau (hộ)',
      f'Trục dọc: {NX} xã, xếp theo hộ nghèo đầu kỳ từ lớn xuống', 'Số hộ nghèo đầu kỳ và cuối kỳ',
      'Nhóm theo «Địa bàn»: «Hộ nghèo đầu kỳ», «Hộ nghèo cuối kỳ».', ' · '.join(f'{u["ten"]}: {u["hoNgheoDau"]} → {u["hoNgheoCuoi"]}' for u in kx[:3]))
nx = sorted(S['kqXa'], key=lambda u: -u['soHo'])
chart('3.3', 'Hộ DTTS và hộ dùng nước hợp vệ sinh theo xã', 'Biểu đồ cột ngang, mỗi xã 2 cột cạnh nhau (hộ)',
      f'Trục dọc: {NX} xã, xếp theo số hộ DTTS từ lớn xuống', 'Số hộ',
      'Nhóm theo «Địa bàn»: «Số hộ DTTS», «Số hộ DTTS dùng nước HVS».', ' · '.join(f'{u["ten"]}: {n(u["hoNuoc"])}/{n(u["soHo"])} ({pc(u["hoNuoc"], u["soHo"])})' for u in nx[:3]))
notes('3', ['Hà Nội đã không còn hộ nghèo theo chuẩn nghèo đa chiều quốc gia. Đề nghị Sở xác nhận «Hộ nghèo đầu kỳ», «Hộ nghèo cuối kỳ» tính theo chuẩn nào (chuẩn quốc gia hay chuẩn riêng của Thành phố), có tính cả hộ cận nghèo không; nếu theo chuẩn quốc gia thì hai trường này gần như luôn bằng 0 và nên thay bằng chỉ tiêu khác (ví dụ thu nhập bình quân của hộ DTTS).',
            'Các trường kết quả (hộ DTTS, nước HVS, đường, học sinh, hộ nghèo) là số của **cả xã**, không phải của từng dự án. Nếu xã nhập lặp lại các số này trên mọi bản ghi dự án thì cộng sẽ sai; IOC hiện lấy **một giá trị cho mỗi xã** (bản ghi tháng 9 có số). Đề nghị tách 8 trường này ra một eform riêng "Chỉ số kết quả vùng đồng bào DTTS" (mỗi xã một bản ghi mỗi kỳ).',
            '«Số địa bàn có đường ô tô đến trung tâm», «Số địa bàn đã cứng hóa»: IOC hiểu "địa bàn" là thôn. Đề nghị Sở xác nhận và đổi tên trường cho rõ.',
            '«Hộ nghèo đầu kỳ»: IOC hiểu là số hộ nghèo DTTS đầu năm (theo kết quả rà soát cuối năm trước). Đề nghị xác nhận.',
            '«HS trong độ tuổi đi học», «HS đi học đúng cấp»: đề nghị xác nhận chỉ tính học sinh là người DTTS.'])

# ---------------- CHỈ TIÊU 4
k.page_break()
heading('Chỉ tiêu 4. Tình hình báo cáo và đối soát dữ liệu', 2)
heading('4.1. Thông tin chung', 3)
info_table([['Eform nguồn', EFORM], ['Một bản ghi là', 'Bản ghi dự án (tính đối soát, cờ dữ liệu) hoặc bản "Không phát sinh" của một phường/xã (tính tình trạng báo cáo)'],
            ['Cách lấy theo kỳ', 'Bản ghi tháng 9.'], ['Kỳ hiển thị', f'Tháng 9/2026 · {D["banGhi"]} bản ghi ({T["n"]} bản ghi dự án + {D["bc"][1]} bản không phát sinh)']])
heading('4.2. Trường dữ liệu sử dụng', 3)
fields_table([KY,
    ['Địa bàn', 'Danh mục', 'Nhóm', 'Xác định phường/xã đã báo cáo hay chưa'],
    ['Loại bản ghi', 'Danh mục', 'Điều kiện', 'Tách bản "Không phát sinh" với bản ghi dự án'],
    ['Trạng thái đối soát', 'Danh mục', 'Nhóm', 'Thẻ Đã đối soát cấp sở; biểu đồ 4.2'],
    ['Cờ dữ liệu', 'Danh mục', 'Nhóm', 'Thẻ Cần giải trình, thiếu minh chứng; biểu đồ 4.3'],
    ['Nguồn dữ liệu', 'Danh mục', 'Nhóm', 'Biểu đồ 4.4'],
    ['Áp dụng công nghệ số/báo cáo tháng?', 'Danh mục', 'Điều kiện', 'Thẻ Áp dụng công nghệ số'],
    ['Minh chứng URL, Người nhập, Người xác nhận', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('4.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Phường/xã đã báo cáo', 'ĐẾM(«Địa bàn» có ít nhất một bản ghi tháng 9, kể cả bản "Không phát sinh")', f'{D["bc"][0] + D["bc"][1]}/{NDV} (chưa báo cáo {D["bc"][2]})'],
    ['Xác nhận không phát sinh', 'ĐẾM(«Địa bàn» chỉ có bản ghi «Loại bản ghi» = Không phát sinh)', f'{D["bc"][1]} phường/xã'],
    ['Đã đối soát cấp sở', 'ĐẾM(bản ghi dự án có «Trạng thái đối soát» = Đã đối soát cấp sở) ÷ số bản ghi dự án × 100', f'{D["doiSoat"][0]} ÷ {T["n"]} = {pc(D["doiSoat"][0], T["n"])}'],
    ['Cần giải trình, thiếu minh chứng', 'ĐẾM(«Cờ dữ liệu» = Cần giải trình hoặc Thiếu minh chứng/xác nhận)', f'{D["co"][1] + D["co"][2]} bản ghi'],
    ['Áp dụng công nghệ số', 'ĐẾM(«Áp dụng công nghệ số/báo cáo tháng?» = Có) ÷ số bản ghi dự án × 100', f'{D["cnso"][0]} ÷ {T["n"]} = {pc(D["cnso"][0], T["n"])}'],
])
heading('4.4. Biểu đồ', 3)
chart('4.1', 'Tình trạng báo cáo của 126 phường/xã — tháng 9', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi 126',
      '3 nhóm: ' + ' / '.join(BC), 'Số phường/xã',
      ['Với mỗi «Địa bàn» trong danh mục:', 'có bản ghi dự án → "Có dự án, hoạt động"; chỉ có bản "Không phát sinh" → "Xác nhận không phát sinh"; không có bản ghi nào trong tháng → "Chưa báo cáo".'],
      ' · '.join(f'{BC[i]} {D["bc"][i]}' for i in range(3)) + f' → {NDV}', 'Phường/xã chưa báo cáo được tô đỏ ở bảng 126 phường/xã.')
chart('4.2', 'Trạng thái đối soát bản ghi dự án', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi số bản ghi dự án',
      f'{len(DS)} giá trị của «Trạng thái đối soát» (bỏ "Không phát sinh")', 'Số bản ghi',
      'Nhóm theo «Trạng thái đối soát»: ĐẾM bản ghi dự án.', ' · '.join(f'{DS[i]} {D["doiSoat"][i]}' for i in range(len(DS))))
chart('4.3', 'Cờ dữ liệu', 'Biểu đồ cột ngang', f'{len(CO)} giá trị của «Cờ dữ liệu»', 'Số bản ghi',
      'Nhóm theo «Cờ dữ liệu»: ĐẾM bản ghi dự án.', ' · '.join(f'{CO[i]} {D["co"][i]}' for i in range(len(CO))))
nd = sorted(range(len(NDL)), key=lambda i: -D['ndl'][i])
chart('4.4', 'Nguồn dữ liệu của bản ghi', 'Biểu đồ cột ngang', f'{len(NDL)} giá trị của «Nguồn dữ liệu» (bỏ "Xác nhận không phát sinh"), xếp từ nhiều xuống', 'Số bản ghi',
      'Nhóm theo «Nguồn dữ liệu»: ĐẾM bản ghi dự án.', ' · '.join(f'{NDL[i]} {D["ndl"][i]}' for i in nd[:3]))
notes('4', ['"Chưa báo cáo" được hiểu là phường/xã không gửi bản ghi nào trong tháng (kể cả bản "Không phát sinh"). Đề nghị Sở xác nhận hạn gửi báo cáo tháng để IOC tính đúng thời điểm.',
            '«Minh chứng URL» và «Người xác nhận» đang không bắt buộc. Đề nghị bắt buộc với bản ghi dự án; khi đó IOC có thể tự gắn cờ "Thiếu minh chứng/xác nhận" cho bản ghi bỏ trống.',
            'Giá trị "Báo cáo UBND phường" của «Nguồn dữ liệu» nên đổi thành "Báo cáo UBND phường/xã", vì các bản ghi chủ yếu do xã gửi.',
            'Dữ liệu mẫu chưa hợp lý: «Nguồn dữ liệu» = Xác nhận không phát sinh nhưng bản ghi vẫn có vốn, tiến độ và chỉ số kết quả. Đề nghị eform khóa các trường số khi «Loại bản ghi» = Không phát sinh.'])

# ======================================================= PHẦN III
k.page_break()
heading(f'PHẦN III. BẢNG {NDV} PHƯỜNG/XÃ', 1)
para(f'Ô bên phải của form là bảng đủ **{NDV} phường/xã** theo thứ tự danh mục «Địa bàn». Phường/xã không có dự án hiện "Không phát sinh" (chữ mờ) hoặc "Chưa báo cáo" (chữ đỏ), các cột số để "—".')
table([
    ['Cột trong bảng', 'Chỉ tiêu', 'Cách tính cho mỗi phường/xã', 'Dòng đầu'],
    ['Báo cáo tháng 9', '4', 'Có dự án / Không phát sinh / Chưa báo cáo (biểu đồ 4.1)', f'{D["bc"][0] + D["bc"][1]} đã báo cáo'],
    ['Dự án, công trình', '2', 'ĐẾM(«Mã dự án…»)', n(T['n'])],
    ['Kế hoạch vốn (tỷ đồng)', '1', 'TỔNG(«Kế hoạch vốn năm») ÷ 1.000', ty(G['kh'])],
    ['Giải ngân lũy kế (tỷ đồng)', '1', 'TỔNG(«Giải ngân lũy kế») ÷ 1.000', ty(G['gn'])],
    ['Giải ngân / kế hoạch', '1', 'Giải ngân lũy kế ÷ Kế hoạch vốn × 100', pc(G['gn'], G['kh'])],
    ['Hộ nghèo DTTS cuối kỳ', '3', '«Hộ nghèo cuối kỳ»', n(K['hoNgheoCuoi'])],
    ['Đã đối soát cấp sở', '4', 'Số bản ghi đã đối soát cấp sở / số bản ghi dự án', f'{D["doiSoat"][0]}/{T["n"]}'],
], [4.2, 1.5, 7.3, 3.0], size=10.5)
x0 = G['byXa'][0]
box([f'**{x0[0]}**: {sum(1 for r in REC if r["xa"] == x0[0])} dự án, công trình · kế hoạch vốn {ty(x0[1])} tỷ đồng · giải ngân {ty(x0[2])} tỷ đồng ({pc(x0[2], x0[1])}).'], k.FORM_FILL, 'Ví dụ một dòng: ')

# ======================================================= PHẦN IV
k.page_break()
heading('PHẦN IV. TỔNG HỢP ĐỀ NGHỊ SỞ XÁC NHẬN', 1)
para('Gom các đề nghị Sở xác nhận của 4 chỉ tiêu. Cột "Kết quả" để trống cho Sở ghi ý kiến.')
table([['#', 'Chỉ tiêu', 'Nội dung', 'Kết quả']] + [[str(i + 1), c, x, ''] for i, (c, x) in enumerate(ALL_NOTES)], [0.8, 1.6, 10.6, 3.0], size=10.5)

# ======================================================= PHỤ LỤC
k.page_break()
ctm_section(heading, para, lambda rows, w: table(rows, w, size=10), 'ubnd-dantoc-tongiao',
            'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=['**Kế hoạch vốn năm** không còn là thanh ngang hàng với giải ngân; là mốc để tính tỷ lệ giải ngân so kế hoạch. Số lớn đầu thẻ là **giải ngân lũy kế**.', '**Giải ngân trong tháng 9** không xếp cạnh số lũy kế; ghi dòng chú thích riêng.', 'Vốn đã phân bổ là số tại thời điểm: khi có số kỳ trước thì so kỳ liền trước, không so cùng kỳ.', 'Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
k.page_break()
k.page_break()
heading('PHỤ LỤC. DANH SÁCH TRƯỜNG CỦA EFORM', 1)
para(f'Trích nguyên từ file mô tả đầu vào eform, sheet "Sở DTTG" ({len(FN)} trường). Cột "Dùng ở chỉ tiêu" cho biết trường tham gia tính thẻ số / biểu đồ của chỉ tiêu nào.')
DUNG_CT = {}
for ct, names in (('1, 2, 3, 4', ['Kỳ báo cáo', 'Năm', 'Quý', 'Tháng', 'Địa bàn']), ('1, 2', ['Dự án thành phần/Nội dung CTMTQG', 'Vốn được phân bổ (triệu đồng)']),
                  ('1, 2, 4', ['Loại bản ghi']), ('1', ['Nguồn vốn', 'Kế hoạch vốn năm (triệu đồng)', 'Giải ngân kỳ này (triệu đồng)', 'Giải ngân lũy kế (triệu đồng)', 'Vốn đình trệ do pháp lý/TTHC (triệu đồng)']),
                  ('2', ['Mã dự án/tiểu dự án/hoạt động', 'Trạng thái triển khai', 'Tiến độ kế hoạch (%)', 'Tiến độ thực tế (%)', 'Đúng tiến độ?', 'Số vụ vi phạm/sai phạm', 'Có báo cáo KTGS đúng hạn?']),
                  ('3', ['Số hộ DTTS', 'Số hộ DTTS dùng nước HVS', 'Số địa bàn có đường ô tô đến trung tâm', 'Số địa bàn đã cứng hóa', 'HS trong độ tuổi đi học', 'HS đi học đúng cấp', 'Hộ nghèo đầu kỳ', 'Hộ nghèo cuối kỳ']),
                  ('4', ['Trạng thái đối soát', 'Cờ dữ liệu', 'Nguồn dữ liệu', 'Áp dụng công nghệ số/báo cáo tháng?'])):
    for x in names:
        assert x in FN, x
        DUNG_CT[x] = ct
rows, fills = [['#', 'Tên trường', 'Mã trường', 'Kiểu nhập', 'Dùng ở chỉ tiêu']], {}
for j, f in enumerate(EF['fields']):
    d = DUNG_CT.get(f[0], '—'); rows.append([str(j + 1), f[0], f[1], f[2] or '(chưa ghi)', d])
    if d != '—': fills[(j + 1, 4)] = k.OK_FILL
table(rows, [0.8, 5.4, 6.0, 2.0, 1.8], size=10, fills=fills, mono_col=2)
print('Trường dùng:', len(DUNG_CT), '/', len(FN), '· đề nghị:', len(ALL_NOTES))
for p in k.save(OUT): print('ok', p)
