# -*- coding: utf-8 -*-
"""Sinh docs/DL_SoDuLich/DL_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 2 chỉ tiêu của Sở Du lịch trên IOC
(biểu đồ, trường, cách tính, đề nghị xác nhận).
Chạy từ thư mục gốc ioc:  python tools/dl_doc_docx.py
Lời văn viết tay trong script; CÁC CON SỐ đọc thẳng từ js/core/dl-config.js (qua node) nên luôn khớp giao diện.
Tên trường viết đúng như file mô tả đầu vào eform (tools/dl-fields.json, trích từ sheet "Sở Du lịch").
Word + Markdown cùng sinh một lần qua tools/doc_kit.py. Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

from dl_chi_tieu_part import EF, K, T, U, NDV, UB, E1, E2, USED, n, pc, ty, nghin, write as dl_chi_tieu  # số liệu + phần chi tiết 2 chỉ tiêu (dùng chung với tài liệu Sở VH, TT và DL)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'DL_SoDuLich', 'DL_MO_TA_CHI_TIEU.docx')

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
    ['Ghi chú', 'Từ 10/8/2026 Sở Du lịch nhập vào Sở Văn hóa và Thể thao thành **Sở Văn hóa, Thể thao và Du lịch**. Hai chỉ tiêu này nay là **Chỉ tiêu 7, 8** trong tài liệu mô tả chỉ tiêu của Sở Văn hóa, Thể thao và Du lịch; bản này giữ để lưu.'],
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

dl_chi_tieu(heading, para, table, chart, kpi_table, info_table, fields_table, notes, k.page_break, a=1, muc_ky='Phần I, mục 3')

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
