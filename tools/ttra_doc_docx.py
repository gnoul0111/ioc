# -*- coding: utf-8 -*-
"""Sinh docs/TTRA_ThanhTraThanhPho/TTRA_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 3 chỉ tiêu của Thanh tra Thành phố trên IOC.
Chạy từ thư mục gốc ioc:  python tools/ttra_doc_docx.py
Lời văn viết tay; CÁC CON SỐ đọc thẳng từ js/core/ttra-config.js (qua node) nên luôn khớp giao diện.
Tên trường đúng như file mô tả đầu vào eform (tools/tt-fields.json, sheet "Thanh Tra TP"). Word + Markdown qua tools/doc_kit.py.
Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EF = json.load(open(os.path.join(ROOT, 'tools', 'tt-fields.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'docs', 'TTRA_ThanhTraThanhPho', 'TTRA_MO_TA_CHI_TIEU.docx')

_JS = ("const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
       "vm.runInContext(fs.readFileSync('js/core/ttra-config.js','utf8')+"
       "';this.S=TTRA_SUM;this.K=TTRA_KT.map(r=>Object.assign({},r,{qd:ttraNgay(r.ngayQd)}));this.TD=TTRA_THEO_DOI;"
       "this.L={KTTT:TTRA_KT_TT,KTND:TTRA_KT_ND,NGUON:TTRA_NGUON,LV:TTRA_LV,TT:TTRA_TT,CB:TTRA_CB,TD:TTRA_TD,LD:TTRA_LOAI_DON,KQ:TTRA_KQ};"
       "this.TOP=TTRA_SUM.tcd.top;',c);"
       "process.stdout.write(JSON.stringify({S:c.S,K:c.K,TD:c.TD,L:c.L}));")
_J = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))
S, KT, TD, L = _J['S'], _J['K'], _J['TD'], _J['L']
lab = lambda k: [x[0] if isinstance(x, list) else x for x in L[k]]
KTTT, KTND, NGUON, LV, TT, CB, TDL, LD, KQ = (lab(k) for k in ('KTTT', 'KTND', 'NGUON', 'LV', 'TT', 'CB', 'TD', 'LD', 'KQ'))


def n(x, d=0):
    s = f'{abs(x):,.{d}f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return ('−' if x < 0 else '') + s
def pc(a, b, d=1): return n(a / b * 100, d) + '%'
def ssum(a): return sum(a)


K, T, C = S['kt'], S['tt'], S['tcd']
E1, E2, E3 = EF
FN = [[f[0] for f in e['fields']] for e in EF]
TH = [f'T{m + 1}' for m in range(9)]

k = Kit('Thanh tra Thành phố · Mô tả chỉ tiêu trên IOC')
para, table, box, heading, note = k.para, k.table, k.box, k.heading, k.note

# ======================================================= TRANG BÌA
k.blank(5)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(4)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY)
para('THANH TRA THÀNH PHỐ HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('Biểu đồ, trường dữ liệu và cách tính số liệu của 3 chỉ tiêu trên IOC', 14, CENTER, 4, italic=True, color=GREY)
para('xây dựng từ 3 eform nhập liệu của Thanh tra Thành phố', 14, CENTER, 0, italic=True, color=GREY)
k.blank(5)
table([
    ['Đơn vị', 'Thanh tra Thành phố Hà Nội'],
    ['Nguồn dữ liệu', f'File mô tả đầu vào eform, sheet "Thanh Tra TP": 3 eform, {ssum(len(f) for f in FN)} trường nhập'],
    ['Phạm vi', '3 chỉ tiêu, 15 biểu đồ, bảng 126 phường/xã'],
    ['Số liệu ví dụ', 'Số giả lập đặt theo bậc độ lớn số liệu đã công bố, 9 tháng năm 2026'],
    ['Phiên bản', '1.3 · ngày 13/10/2026 (theo phản hồi nhóm triển khai: bỏ số cuộc kiểm tra theo kế hoạch năm vì eform không có trường này)'],
], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()
k.toc()
k.page_break()

# ======================================================= PHẦN I
heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Mục đích tài liệu', 2)
para('Tài liệu mô tả cách IOC dựng 3 chỉ tiêu của Thanh tra Thành phố từ 3 eform nhập liệu: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào của eform, mỗi trường dùng để làm gì, và mỗi con số được cộng, đếm, tính toán ra sao. Tên trường viết đúng như trong file mô tả đầu vào eform.')
SHOW_NOTE_BOX = False  # khối "Lưu ý, đề nghị … xác nhận" cuối mỗi chỉ tiêu — ẩn theo yêu cầu 14/10/2026; nội dung vẫn gom vào Phần IV
para('Trên giao diện IOC, mỗi chỉ tiêu chỉ gồm **thẻ số tổng hợp** và **biểu đồ**; cách tính chỉ trình bày trong tài liệu này. '
     + ('Cuối mỗi chỉ tiêu có mục **"Lưu ý, đề nghị Thanh tra Thành phố xác nhận"**; Phần IV gom toàn bộ các đề nghị.' if SHOW_NOTE_BOX else 'Phần IV gom toàn bộ các đề nghị Thanh tra Thành phố xác nhận.'))

heading('2. Ba eform, ba chỉ tiêu', 2)
table([
    ['#', 'Chỉ tiêu trên IOC', 'Eform nguồn', 'Một bản ghi là'],
    ['1', 'Kiểm tra trách nhiệm Chủ tịch UBND xã, phường và người đứng đầu', E1['eform'], 'Một cuộc kiểm tra (khóa «Mã cuộc kiểm tra»)'],
    ['2', 'Thanh tra', E2['eform'], 'Một cuộc thanh tra («Loại bản ghi» = Cuộc thanh tra) hoặc một kết luận đang theo dõi thực hiện (= Theo dõi sau thanh tra)'],
    ['3', 'Tiếp công dân, giải quyết khiếu nại, tố cáo', E3['eform'], 'Số liệu tổng hợp một tháng của một phường/xã («Loại bản ghi» = Tổng hợp tiếp công dân/đơn thư)'],
], [0.8, 4.4, 4.4, 6.4], size=10.5)
note('Bộ chỉ tiêu cũ của Thanh tra Thành phố (STT 39, 40, 41, nguồn File) đã được thay bằng bộ này và đã xóa khỏi IOC.')

heading('3. Kỳ báo cáo', 2)
para('Ba eform nhập theo **tháng** (eform tiếp công dân có thêm kỳ "Đột xuất"). Kỳ hiển thị mặc định là **9 tháng năm 2026** (01/01 – 30/9/2026):')
k.bullets(['**Chỉ tiêu 1, 2**: lấy các cuộc kiểm tra, thanh tra **đang có hiệu lực trong 9 tháng** (quyết định trong kỳ, hoặc từ năm 2025 chuyển sang và chưa kết thúc trước 01/01/2026); trạng thái, tiến độ lấy theo bản cập nhật mới nhất đến 30/9; mỗi «Mã cuộc…» chỉ tính một lần.',
           '**Chỉ tiêu 3**: **cộng** bản ghi tổng hợp của tháng 1 – 9; riêng «Đơn kỳ trước chuyển sang» lấy của tháng 1 và «Tồn cuối kỳ» lấy của tháng 9. Bản ghi kỳ "Đột xuất" không cộng vào để tránh trùng với bản tháng.'])

heading('4. Căn cứ đặt số giả lập', 2)
para('Chưa có số thật từ eform, nên số trên IOC là số giả lập, nhưng được đặt theo **bậc độ lớn số liệu đã công bố** của Hà Nội rồi quy về 9 tháng năm 2026:')
table([
    ['Số liệu công bố', 'Giá trị', 'Số giả lập 9 tháng 2026'],
    ['Cuộc thanh tra năm 2025 toàn Thành phố', '283 cuộc (152 cuộc kỳ trước chuyển sang), 251 kết luận với 288 đơn vị', f'{T["n"]} cuộc ({T["kyTruoc"]} kỳ trước chuyển sang), {T["kl"]} kết luận với {T["soDvKl"]} đơn vị'],
    ['Vi phạm phát hiện qua thanh tra năm 2025', '10,45 tỷ đồng, kiến nghị thu hồi toàn bộ; 119 m² đất', f'Kiến nghị thu hồi {n(T["thuHoi"] / 1000, 1)} tỷ đồng'],
    ['Kiến nghị xử lý hành chính năm 2025', '31 tổ chức, 147 cá nhân', f'{T["hcToChuc"]} tổ chức, {T["hcCaNhan"]} cá nhân'],
    ['Theo dõi, đôn đốc thực hiện kết luận năm 2025', '939 kết luận, đã hoàn thành 53', f'{n(TD["tong"])} kết luận, đã hoàn thành {n(TD["hoanThanh"])}'],
    ['Kế hoạch 2026 (KH 13/KH-UBND ngày 9/1/2026)', 'Thanh tra trách nhiệm 15 người đứng đầu cấp xã về tiếp công dân, khiếu nại, tố cáo', f'Đã triển khai {K["n"]} cuộc (số kế hoạch không hiện trên IOC vì eform không có trường kế hoạch)'],
    ['Tiếp công dân năm 2024 của các cơ quan hành chính Thành phố', '35.086 lượt / 42.715 công dân, 21.150 vụ việc', f'Cấp xã 9 tháng: {n(C["luot"])} lượt / {n(C["nguoi"])} công dân, {n(C["vuTiepDan"])} vụ việc qua tiếp dân'],
], [4.6, 5.6, 5.8], size=10)
note('Nguồn: Báo Thanh tra (tổng kết công tác thanh tra Hà Nội năm 2025; Thanh tra TP Hà Nội là nòng cốt công tác tiếp công dân năm 2026); Báo Pháp luật Việt Nam, Báo Đấu thầu (số liệu tiếp công dân, kế hoạch thanh tra). Phân bổ theo phường/xã, theo tháng, theo lĩnh vực là giả lập.')

heading('5. Trường tỷ lệ do đơn vị tự tính', 2)
para('Các trường «Tỷ lệ thực hiện kiến nghị», «Tỷ lệ thu hồi», «Tỷ lệ giải quyết vụ việc», «Tỷ lệ giải quyết đúng hạn» do đơn vị tự tính. IOC **không dùng** các trường này mà **cộng tử số, mẫu số của mọi bản ghi rồi mới chia**.')

heading('6. Các phép tính dùng trong tài liệu', 2)
table([
    ['Ký hiệu', 'Ý nghĩa', 'Ví dụ'],
    ['ĐẾM(điều kiện)', 'Đếm số bản ghi thỏa điều kiện', 'ĐẾM(«Đã ban hành kết luận» = Có)'],
    ['TỔNG(«trường»)', 'Cộng giá trị của trường trên các bản ghi được lấy', 'TỔNG(«Số cuộc tiếp công dân»)'],
    ['Nhóm theo «trường»', 'Chia bản ghi thành nhóm theo giá trị của trường, rồi đếm / cộng trong từng nhóm', 'Nhóm theo «Lĩnh vực thanh tra»'],
    ['Tỷ lệ (%)', 'Tử số ÷ Mẫu số × 100, làm tròn 1 chữ số thập phân', f'{n(C["daGq"])} ÷ {n(C["thuLy"])} × 100 = {pc(C["daGq"], C["thuLy"])}'],
], [3.6, 6.6, 5.8])

heading('7. Địa bàn', 2)
para('Cả 3 eform có trường «Địa bàn» với đúng **126 phường/xã**. Với cuộc kiểm tra, thanh tra, «Địa bàn» là nơi đặt trụ sở đơn vị được kiểm tra, thanh tra; với tiếp công dân là phường/xã báo cáo. Bảng bên phải của IOC hiện đủ 126 phường/xã (Phần III).')

heading('8. Tổng hợp 3 chỉ tiêu', 2)
table([
    ['#', 'Chỉ tiêu trên IOC', 'Thẻ số', 'Biểu đồ'],
    ['1', 'Kiểm tra trách nhiệm Chủ tịch UBND xã, phường và người đứng đầu', '5', '4'],
    ['2', 'Thanh tra', '7', '6'],
    ['3', 'Tiếp công dân, giải quyết khiếu nại, tố cáo', '6', '5'],
], [0.8, 10.2, 2.4, 2.6], size=11)

# ======================================================= PHẦN II
k.page_break()
heading('PHẦN II. CHI TIẾT 3 CHỈ TIÊU', 1)
note('Mỗi chỉ tiêu: (1) Thông tin chung · (2) Trường dữ liệu sử dụng · (3) Thẻ số tổng hợp · (4) Từng biểu đồ' + (' · (5) Lưu ý, đề nghị xác nhận' if SHOW_NOTE_BOX else '') + '.')

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
    if SHOW_NOTE_BOX: box(['• ' + x for x in items], k.NOTE_FILL, 'Lưu ý, đề nghị Thanh tra Thành phố xác nhận', 12)
    ALL_NOTES.extend((ct, x) for x in items)
KY = [['Kỳ báo cáo, Năm,', 'Quý, Tháng'], 'Danh mục / Số', 'Lọc kỳ', 'Chọn bản ghi trong 9 tháng']
DB = ['Địa bàn', 'Danh mục', 'Nhóm', 'Hàng của biểu đồ theo địa bàn; bảng 126 phường/xã']

# ---------------- CHỈ TIÊU 1
heading('Chỉ tiêu 1. Kiểm tra trách nhiệm Chủ tịch UBND xã, phường và người đứng đầu trong thực hiện pháp luật', 2)
heading('1.1. Thông tin chung', 3)
info_table([['Eform nguồn', E1['eform']], ['Một bản ghi là', 'Một cuộc kiểm tra (khóa «Mã cuộc kiểm tra»), bản cập nhật mới nhất'],
            ['Cách lấy theo kỳ', 'Cuộc có «Ngày quyết định» trong năm 2026, trạng thái tại 30/9/2026.'],
            ['Kỳ hiển thị', f'9 tháng năm 2026 · {K["n"]} cuộc kiểm tra']])
heading('1.2. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Mã cuộc kiểm tra', 'Chữ', 'Khóa', 'Đếm cuộc kiểm tra, chống đếm trùng'],
    ['Trạng thái kiểm tra', 'Chữ', 'Nhóm', 'Gom về 4 trạng thái: biểu đồ 1.1'],
    ['Nội dung kiểm tra chính', 'Chữ', 'Nhóm', 'Gom về 3 nhóm nội dung: biểu đồ 1.2'],
    ['Thời gian bắt đầu, Thời gian kết thúc kế hoạch, Thời gian kết thúc thực tế', 'Ngày tháng', 'Cộng', 'Số ngày kế hoạch, số ngày thực tế: biểu đồ 1.3'],
    ['Số đơn vị được kiểm tra', 'Số', 'Cộng', 'Thẻ Đã ban hành kết luận (dòng phụ)'],
    ['Đã ban hành kết luận', 'Danh mục', 'Điều kiện', 'Thẻ số; chỉ cuộc đã có kết luận mới có kiến nghị'],
    ['Số kiến nghị xử lý', 'Số', 'Cộng', 'Thẻ Kiến nghị xử lý; biểu đồ 1.4'],
    ['Giá trị kiến nghị thu hồi/giảm trừ (triệu đồng)', 'Số', 'Cộng', 'Thẻ Kiến nghị xử lý (dòng phụ)'],
    ['Đã thực hiện kiến nghị, Đang thực hiện kiến nghị, Quá hạn thực hiện kiến nghị', 'Số', 'Cộng', 'Thẻ số; biểu đồ 1.4'],
    ['Tỷ lệ thực hiện kiến nghị', 'Số', 'Không dùng', 'IOC tự tính (Phần I, mục 5)'],
    ['Thôn/TDP, Tên cuộc kiểm tra/nội dung, Đối tượng kiểm tra, Nhóm đối tượng, Căn cứ/Quyết định kiểm tra số, Số kết luận, Kiến nghị hành chính, Kiến nghị tài chính, Kiến nghị chuyển CQĐT, Vướng mắc/kiến nghị, Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('1.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Cuộc kiểm tra', 'ĐẾM(«Mã cuộc kiểm tra»)', f'{K["n"]}'],
    ['Đã ban hành kết luận', 'ĐẾM(«Đã ban hành kết luận» = Có); dòng phụ = TỔNG(«Số đơn vị được kiểm tra»)', f'{K["kl"]} cuộc; {K["soDv"]} đơn vị'],
    ['Kiến nghị xử lý', 'TỔNG(«Số kiến nghị xử lý»); dòng phụ = TỔNG(«Giá trị kiến nghị thu hồi/giảm trừ»)', f'{K["soKn"]} kiến nghị; {n(K["thuHoi"])} triệu đồng'],
    ['Đã thực hiện kiến nghị', 'TỔNG(«Đã thực hiện kiến nghị») ÷ TỔNG(«Số kiến nghị xử lý») × 100', f'{K["da"]} ÷ {K["soKn"]} = {pc(K["da"], K["soKn"])}'],
    ['Quá hạn thực hiện kiến nghị', 'TỔNG(«Quá hạn thực hiện kiến nghị»)', f'{K["qh"]} kiến nghị'],
])
heading('1.4. Biểu đồ', 3)
chart('1.1', 'Cuộc kiểm tra theo trạng thái', 'Biểu đồ tròn dạng vành khuyên', '4 trạng thái: ' + ' / '.join(KTTT), 'Số cuộc',
      'Nhóm theo «Trạng thái kiểm tra» (đã gom), ĐẾM(«Mã cuộc kiểm tra»).', ' · '.join(f'{KTTT[i]} {K["tt"][i]}' for i in range(4)))
chart('1.2', 'Cuộc kiểm tra theo nội dung chính', 'Biểu đồ tròn dạng vành khuyên', '3 nhóm: ' + ' / '.join(KTND), 'Số cuộc',
      'Nhóm theo «Nội dung kiểm tra chính» (đã gom), ĐẾM(«Mã cuộc kiểm tra»).', ' · '.join(f'{KTND[i]} {K["nd"][i]}' for i in range(3)))
chart('1.3', 'Thời gian kiểm tra: kế hoạch và thực tế', 'Biểu đồ cột ngang, mỗi cuộc 2 cột cạnh nhau (ngày)',
      'Trục dọc: «Địa bàn» của từng cuộc kiểm tra', 'Số ngày kế hoạch và số ngày thực tế',
      ['Kế hoạch = «Thời gian kết thúc kế hoạch» − «Thời gian bắt đầu»;', 'Thực tế = «Thời gian kết thúc thực tế» − «Thời gian bắt đầu»; cuộc chưa kết thúc tính đến 30/9/2026.'],
      ' · '.join(f'{r["diaBan"]}: {r["ngayKh"]} / {r["ngayTt"]} ngày' for r in KT[:3] if r['ngayTt'] is not None),
      'Cột thực tế dài hơn cột kế hoạch là cuộc kiểm tra kéo dài so với kế hoạch.')
kl = [r for r in KT if r['kl']]
chart('1.4', 'Thực hiện kiến nghị theo cuộc kiểm tra đã có kết luận', 'Biểu đồ cột ngang xếp chồng', 'Trục dọc: «Địa bàn» của các cuộc đã có kết luận; mỗi cột chia 3 phần',
      'Số kiến nghị: đã thực hiện / đang thực hiện / quá hạn; số ở đầu cột = «Số kiến nghị xử lý»',
      'Mỗi cuộc: «Đã thực hiện kiến nghị», «Đang thực hiện kiến nghị», «Quá hạn thực hiện kiến nghị».',
      ' · '.join(f'{r["diaBan"]}: {r["da"]} + {r["dang"]} + {r["qh"]} = {r["soKn"]}' for r in kl[:3]))
notes('1', ['«Loại bản ghi» của eform kiểm tra đang dùng danh mục của eform tiếp công dân (Tổng hợp tiếp công dân/đơn thư, Chi tiết đơn thư…), có vẻ chép nhầm. Đề nghị đổi thành "Cuộc kiểm tra / Theo dõi sau kiểm tra / Không phát sinh".',
            '«Cơ quan chủ trì kiểm tra» đang là Danh mục Có / Không, không rõ nghĩa. Đề nghị đổi sang danh mục tên cơ quan chủ trì (Thanh tra Thành phố, UBND xã, phường…).',
            '«Trạng thái kiểm tra», «Nội dung kiểm tra chính», «Lĩnh vực kiểm tra chi tiết», «Nhóm đối tượng», «Tình trạng quá hạn» đang là Chữ; IOC tạm gom về các nhóm ở biểu đồ 1.1, 1.2. Đề nghị đổi sang Danh mục.',
            f'Eform không có số cuộc theo kế hoạch năm, nên IOC **không hiện "theo kế hoạch năm" và "tiến độ so kế hoạch"** (phản hồi nhóm triển khai 13/10/2026; Kế hoạch 13/KH-UBND giao {K["keHoach"]} cuộc chỉ ghi để tham khảo). Nếu Sở cần, đề nghị bổ sung trường «Thuộc kế hoạch năm».',
            'Dữ liệu mẫu chưa khớp: đã thực hiện 12, đang thực hiện 11, quá hạn 10 kiến nghị (tổng 33) nhưng «Số kiến nghị xử lý» là 10 và tỷ lệ thực hiện 88,6%.'])

# ---------------- CHỈ TIÊU 2
k.page_break()
heading('Chỉ tiêu 2. Thanh tra', 2)
heading('2.1. Thông tin chung', 3)
info_table([['Eform nguồn', E2['eform']], ['Một bản ghi là', 'Một cuộc thanh tra (khóa «Mã cuộc thanh tra»), hoặc một kết luận các năm trước đang theo dõi thực hiện («Loại bản ghi» = Theo dõi sau thanh tra)'],
            ['Cách lấy theo kỳ', 'Cuộc thanh tra có hiệu lực trong 9 tháng (quyết định trong kỳ hoặc từ năm 2025 chuyển sang); trạng thái tại 30/9/2026.'],
            ['Kỳ hiển thị', f'9 tháng năm 2026 · {T["n"]} cuộc thanh tra, {n(TD["tong"])} kết luận đang theo dõi']])
heading('2.2. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Loại bản ghi', 'Danh mục', 'Điều kiện', 'Tách cuộc thanh tra với bản ghi theo dõi sau thanh tra'],
    ['Mã cuộc thanh tra', 'Chữ', 'Khóa', 'Đếm cuộc thanh tra'],
    ['Ngày QĐ thanh tra', 'Ngày tháng', 'Điều kiện', 'Xác định cuộc kỳ trước chuyển sang (quyết định trước 01/01/2026)'],
    ['Nguồn kế hoạch', 'Danh mục', 'Nhóm', 'Biểu đồ 2.3'],
    ['Lĩnh vực thanh tra', 'Danh mục', 'Nhóm', 'Biểu đồ 2.2, 2.4'],
    ['Trạng thái cuộc thanh tra', 'Danh mục', 'Nhóm', 'Biểu đồ 2.1'],
    ['Số đơn vị được thanh tra', 'Số', 'Cộng', 'Thẻ Đã ban hành kết luận (dòng phụ)'],
    ['Đã ban hành kết luận', 'Danh mục', 'Điều kiện', 'Thẻ số; chỉ cuộc đã kết luận mới có kiến nghị'],
    ['Số kiến nghị xử lý', 'Số', 'Cộng', 'Bảng bấm-khối'],
    ['Giá trị kiến nghị thu hồi (triệu đồng), Giá trị đã thu hồi (triệu đồng)', 'Số', 'Cộng', 'Thẻ Kiến nghị thu hồi; biểu đồ 2.4'],
    ['Số cá nhân/tổ chức kiến nghị xử lý HC', 'Số', 'Cộng', 'Thẻ Kiến nghị xử lý hành chính'],
    ['Số vụ việc chuyển CQ điều tra', 'Số', 'Cộng', 'Thẻ Chuyển cơ quan điều tra'],
    ['Tiến độ %, Quá hạn (ngày)', 'Số', 'Điều kiện', 'Theo dõi kết luận (biểu đồ 2.6); mức cảnh báo'],
    ['Mức cảnh báo', 'Danh mục', 'Nhóm', 'Thẻ Cảnh báo đỏ; biểu đồ 2.5'],
    ['Tỷ lệ thu hồi', 'Số', 'Không dùng', 'IOC tự tính (Phần I, mục 5)'],
    ['Thôn/TDP, Tên cuộc thanh tra/nội dung, Đơn vị được thanh tra, Số QĐ thanh tra, Số KL thanh tra, Số văn bản đôn đốc/nhắc, Vướng mắc, Kiến nghị hỗ trợ', 'Chữ / Số', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('2.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Cuộc thanh tra', 'ĐẾM(«Mã cuộc thanh tra»), «Loại bản ghi» = Cuộc thanh tra; dòng phụ = cuộc có «Ngày QĐ thanh tra» trước 01/01/2026', f'{T["n"]} ({T["kyTruoc"]} kỳ trước chuyển sang)'],
    ['Đã ban hành kết luận', 'ĐẾM(«Đã ban hành kết luận» = Có); dòng phụ = TỔNG(«Số đơn vị được thanh tra») của các cuộc đó', f'{T["kl"]} kết luận, {T["soDvKl"]} đơn vị'],
    ['Kiến nghị thu hồi', 'TỔNG(«Giá trị kiến nghị thu hồi») ÷ 1.000; dòng phụ = TỔNG(«Giá trị đã thu hồi») ÷ TỔNG(«Giá trị kiến nghị thu hồi») × 100', f'{n(T["thuHoi"] / 1000, 1)} tỷ đồng; đã thu {pc(T["daThu"], T["thuHoi"])}'],
    ['Kiến nghị xử lý hành chính', 'TỔNG(«Số cá nhân/tổ chức kiến nghị xử lý HC»), tách tổ chức / cá nhân', f'{T["hcToChuc"] + T["hcCaNhan"]} ({T["hcToChuc"]} tổ chức, {T["hcCaNhan"]} cá nhân)'],
    ['Chuyển cơ quan điều tra', 'TỔNG(«Số vụ việc chuyển CQ điều tra»)', f'{T["cqdt"]} vụ việc'],
    ['Cảnh báo đỏ', 'ĐẾM(«Mức cảnh báo» = Đỏ - quá hạn/chưa xác nhận)', f'{T["cb"][3]} cuộc'],
    ['Kết luận đang theo dõi', 'ĐẾM(bản ghi «Loại bản ghi» = Theo dõi sau thanh tra); dòng phụ = số có «Tiến độ %» = 100', f'{n(TD["tong"])}; đã hoàn thành {n(TD["hoanThanh"])}'],
])
heading('2.4. Biểu đồ', 3)
chart('2.1', 'Cuộc thanh tra theo trạng thái', 'Biểu đồ tròn dạng vành khuyên', f'{len(TT)} giá trị của «Trạng thái cuộc thanh tra» (bỏ "Không phát sinh")', 'Số cuộc',
      'Nhóm theo «Trạng thái cuộc thanh tra», ĐẾM(«Mã cuộc thanh tra»).', ' · '.join(f'{TT[i]} {T["tt"][i]}' for i in range(len(TT))))
lvs = sorted(range(len(LV)), key=lambda i: -T['lv'][i])
chart('2.2', 'Cuộc thanh tra theo lĩnh vực', 'Biểu đồ cột ngang', f'{len(LV)} giá trị của «Lĩnh vực thanh tra», xếp từ nhiều xuống', 'Số cuộc',
      'Nhóm theo «Lĩnh vực thanh tra», ĐẾM(«Mã cuộc thanh tra»).', ' · '.join(f'{LV[i]} {T["lv"][i]}' for i in lvs[:4]))
chart('2.3', 'Cuộc thanh tra theo nguồn kế hoạch', 'Biểu đồ tròn dạng vành khuyên', f'{len(NGUON)} giá trị của «Nguồn kế hoạch»', 'Số cuộc',
      'Nhóm theo «Nguồn kế hoạch», ĐẾM(«Mã cuộc thanh tra»).', ' · '.join(f'{NGUON[i]} {T["nguon"][i]}' for i in range(len(NGUON))))
lt = sorted([i for i in range(len(LV)) if T['lvTien'][i][0] > 0], key=lambda i: -T['lvTien'][i][0])
chart('2.4', 'Kiến nghị thu hồi và đã thu hồi theo lĩnh vực', 'Biểu đồ cột ngang, mỗi lĩnh vực 2 cột cạnh nhau (triệu đồng)', 'Trục dọc: lĩnh vực có kiến nghị thu hồi, xếp từ lớn xuống',
      'Kiến nghị thu hồi và đã thu hồi (triệu đồng)', 'Nhóm theo «Lĩnh vực thanh tra»: TỔNG(«Giá trị kiến nghị thu hồi»), TỔNG(«Giá trị đã thu hồi»).',
      ' · '.join(f'{LV[i]} {n(T["lvTien"][i][0])} / {n(T["lvTien"][i][1])}' for i in lt[:3]))
chart('2.5', 'Mức cảnh báo cuộc thanh tra', 'Biểu đồ cột ngang, mỗi mức một màu', f'{len(CB)} giá trị của «Mức cảnh báo»', 'Số cuộc',
      ['IOC **tự tính** mức cảnh báo, mức cao nhất thắng; «Mức cảnh báo» nhập tay chỉ để đối chiếu, khác thì hiện số tự tính và đưa vào danh sách "cảnh báo khác nhập tay":', 'Đỏ = «Quá hạn (ngày)» trên 10; Cam = quá hạn đến 10 ngày hoặc tạm dừng;', 'Vàng = đang triển khai và **đã dùng trên 75% thời gian kế hoạch** mà chưa kết thúc, hoặc đang theo dõi mà «Giá trị đã thu hồi» < «Giá trị kiến nghị thu hồi»; Xanh = còn lại.', 'Thời gian đã dùng = (ngày chốt − «Ngày bắt đầu») ÷ («Ngày kết thúc dự kiến» − «Ngày bắt đầu»). Không dùng «Tiến độ %»: tiến độ cao không phải dấu hiệu rủi ro (bản trả lời BA, mục 80).'],
      ' · '.join(f'{CB[i]} {T["cb"][i]}' for i in range(len(CB))))
chart('2.6', 'Theo dõi thực hiện kết luận thanh tra các năm trước', 'Biểu đồ tròn dạng vành khuyên', '3 nhóm: ' + ' / '.join(TDL), 'Số kết luận',
      ['Bản ghi «Loại bản ghi» = Theo dõi sau thanh tra:', 'Đã hoàn thành = «Tiến độ %» = 100; Quá hạn = «Quá hạn (ngày)» > 0; Đang thực hiện = còn lại.'],
      ' · '.join(f'{TDL[i]} {n(T["theoDoi"][i])}' for i in range(3)) + f' → {n(TD["tong"])} kết luận',
      'Năm 2025 Thành phố theo dõi 939 kết luận, mới hoàn thành 53; đây là nội dung cần đôn đốc nhiều.')
notes('2', ['«Lĩnh vực thanh tra» có giá trị "tiêu cực" (mã có dấu và khoảng trắng), có vẻ nhập lỗi. Đề nghị gộp vào "Phòng chống tham nhũng" thành "Phòng, chống tham nhũng, tiêu cực".',
            '«Cơ quan chủ trì» đang là Danh mục Có / Không, không rõ nghĩa. Đề nghị đổi sang danh mục cơ quan chủ trì.',
            '«Mức cảnh báo» đang nhập tay. IOC tự tính theo quy tắc ở biểu đồ 2.5 (bản trả lời BA, mục 80); giá trị nhập tay chỉ để đối chiếu.',
            'Bản ghi "Theo dõi sau thanh tra" chưa có trường liên kết với cuộc thanh tra gốc. Đề nghị thêm «Mã cuộc thanh tra gốc» và «Số kiến nghị đã thực hiện» để IOC theo dõi đúng từng kết luận.',
            'Eform chưa có trường kiến nghị thu hồi đất (năm 2025 thanh tra kiến nghị thu hồi 119 m² đất). Đề nghị bổ sung «Diện tích đất kiến nghị thu hồi (m²)».',
            'IOC xác định cuộc "kỳ trước chuyển sang" bằng «Ngày QĐ thanh tra» trước 01/01/2026. Đề nghị xác nhận, hoặc bổ sung trường đánh dấu.'])

# ---------------- CHỈ TIÊU 3
k.page_break()
heading('Chỉ tiêu 3. Tiếp công dân, giải quyết khiếu nại, tố cáo', 2)
heading('3.1. Thông tin chung', 3)
info_table([['Eform nguồn', E3['eform']], ['Một bản ghi là', 'Số liệu tổng hợp một tháng của một phường/xã («Loại bản ghi» = Tổng hợp tiếp công dân/đơn thư)'],
            ['Cách lấy theo kỳ', 'Cộng tháng 1 – 9; «Đơn kỳ trước chuyển sang» lấy tháng 1, «Tồn cuối kỳ» lấy tháng 9.'],
            ['Kỳ hiển thị', f'9 tháng năm 2026 · {126 * 9} bản ghi tổng hợp (126 phường/xã × 9 tháng)']])
heading('3.2. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Loại bản ghi', 'Danh mục', 'Điều kiện', 'Chỉ lấy bản "Tổng hợp"; bản chi tiết đơn thư, vụ việc để xem'],
    ['Số cuộc tiếp công dân, Số lượt công dân, Số đoàn đông người', 'Số', 'Cộng', 'Thẻ số; biểu đồ 3.1'],
    ['Số vụ việc tiếp nhận qua tiếp dân', 'Số', 'Cộng', 'Bảng bấm-khối'],
    ['Đơn kỳ trước chuyển sang, Đơn mới trong kỳ, Tổng đơn thư tiếp nhận', 'Số', 'Cộng', 'Thẻ Đơn thư tiếp nhận; biểu đồ 3.1, 3.3'],
    ['Số đơn khiếu nại, Số đơn tố cáo, Số đơn kiến nghị/phản ánh, Số đơn nhiều nội dung/khác', 'Số', 'Cộng', 'Biểu đồ 3.2'],
    ['Đơn đủ điều kiện xử lý, Đơn không đủ điều kiện/lưu, Đơn thuộc thẩm quyền, Đơn không thuộc thẩm quyền đã chuyển, Đơn không thuộc thẩm quyền đã hướng dẫn', 'Số', 'Cộng', 'Biểu đồ 3.3'],
    ['Số vụ việc thụ lý, Số vụ việc đã giải quyết, Số vụ giải quyết đúng hạn, Số vụ giải quyết quá hạn, Số vụ đang xử lý trong hạn, Số vụ đang xử lý quá hạn, Số vụ rút đơn/đình chỉ', 'Số', 'Cộng', 'Thẻ số; biểu đồ 3.4, 3.5'],
    ['Số vụ phức tạp/kéo dài, Tồn cuối kỳ', 'Số', 'Cộng', 'Thẻ Tồn cuối kỳ'],
    ['Tỷ lệ giải quyết vụ việc, Tỷ lệ giải quyết đúng hạn', 'Số', 'Không dùng', 'IOC tự tính (Phần I, mục 5)'],
    ['Loại tiếp công dân chính, Tình trạng xử lý tổng hợp, Ngày báo cáo, Hạn báo cáo/chốt số liệu, Quá hạn báo cáo (ngày), Thôn/TDP, Vướng mắc/nguyên nhân, Kiến nghị hỗ trợ, Ghi chú', '', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('3.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Lượt tiếp công dân', 'TỔNG(«Số cuộc tiếp công dân»); dòng phụ = TỔNG(«Số lượt công dân»)', f'{n(C["luot"])} lượt; {n(C["nguoi"])} công dân'],
    ['Đoàn đông người', 'TỔNG(«Số đoàn đông người»)', n(C['doan'])],
    ['Đơn thư tiếp nhận', 'TỔNG(«Đơn mới trong kỳ»); dòng phụ = «Đơn kỳ trước chuyển sang» tháng 1', f'{n(C["donMoi"])}; kỳ trước {n(C["kyTruoc"])}'],
    ['Đơn đã phân loại, xử lý', 'Đơn đủ điều kiện + đơn không đủ điều kiện, lưu (= cộng 4 phần của biểu đồ 3.3)', n(C['daXl'])],
    ['Vụ việc thụ lý', 'TỔNG(«Số vụ việc thụ lý»)', n(C['thuLy'])],
    ['Đã giải quyết', 'TỔNG(«Số vụ việc đã giải quyết») ÷ TỔNG(«Số vụ việc thụ lý») × 100; dòng phụ = đúng hạn ÷ đã giải quyết', f'{pc(C["daGq"], C["thuLy"])}; đúng hạn {pc(C["dungHan"], C["daGq"])}'],
    ['Tồn cuối kỳ', '«Tồn cuối kỳ» tháng 9; dòng phụ = TỔNG(«Số vụ phức tạp/kéo dài»)', f'{n(C["ton"])}; {C["phucTap"]} vụ phức tạp'],
])
heading('3.4. Biểu đồ', 3)
chart('3.1', 'Lượt tiếp công dân và đơn thư tiếp nhận theo tháng', 'Biểu đồ cột, mỗi tháng 2 cột cạnh nhau (cùng đơn vị: số lượt / số đơn)', 'Trục ngang: «Tháng» 1 → 9',
      'Lượt tiếp công dân và đơn mới trong tháng', 'Nhóm theo «Tháng»: TỔNG(«Số cuộc tiếp công dân»), TỔNG(«Đơn mới trong kỳ»).',
      ' · '.join(f'{TH[m]}: {n(C["luotT"][m])} lượt, {n(C["donT"][m])} đơn' for m in (0, 2, 8)))
chart('3.2', 'Đơn thư tiếp nhận theo loại', 'Biểu đồ tròn dạng vành khuyên', '4 loại: ' + ' / '.join(LD), 'Số đơn',
      'TỔNG của 4 trường «Số đơn khiếu nại», «Số đơn tố cáo», «Số đơn kiến nghị/phản ánh», «Số đơn nhiều nội dung/khác».',
      ' · '.join(f'{LD[i]} {n(v)}' for i, v in enumerate([C['kn'], C['tc'], C['knpa'], C['khac']])) + f' = {n(C["donMoi"])}')
chart('3.3', 'Kết quả phân loại, xử lý đơn', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi số đơn đã xử lý', '4 phần: thuộc thẩm quyền / không thuộc thẩm quyền đã chuyển / đã hướng dẫn / không đủ điều kiện, lưu',
      'Số đơn', ['Giữa vòng = đơn **đã** xử lý = cộng 4 phần = đơn đủ điều kiện + đơn không đủ điều kiện, lưu; đơn đủ điều kiện = thuộc thẩm quyền + đã chuyển + đã hướng dẫn.',
                 'Dòng phụ: "Phải xử lý" = «Đơn kỳ trước chuyển sang» (tháng đầu của kỳ) + TỔNG(«Đơn mới trong kỳ»); "Chưa xử lý" = phải xử lý − đã xử lý, âm thì gắn cờ (bản trả lời BA, mục 82).'],
      f'{n(C["tq"])} + {n(C["chuyen"])} + {n(C["huongDan"])} + {n(C["khongDk"])} = {n(C["daXl"])} đã xử lý; phải xử lý {n(C["kyTruoc"])} + {n(C["donMoi"])} = {n(C["phaiXl"])}; chưa xử lý {n(C["chuaXl"])}')
chart('3.4', 'Kết quả giải quyết vụ việc khiếu nại, tố cáo', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi số vụ việc thụ lý', '5 phần: ' + ' / '.join(KQ), 'Số vụ việc',
      'TỔNG của 5 trường kết quả; cộng lại = «Số vụ việc thụ lý».', ' · '.join(f'{KQ[i]} {n(v)}' for i, v in enumerate([C['dungHan'], C['quaHan'], C['dangTh'], C['dangQh'], C['rut']])) + f' = {n(C["thuLy"])}')
chart('3.5', '15 phường/xã nhiều vụ việc khiếu nại, tố cáo nhất', 'Biểu đồ cột ngang xếp chồng', 'Trục dọc: 15 «Địa bàn» có nhiều vụ việc thụ lý nhất; mỗi cột chia 3 phần',
      'Vụ việc đã giải quyết / tồn / rút đơn, đình chỉ', 'Nhóm theo «Địa bàn», cộng tháng 1 – 9.',
      ' · '.join(f'{r[0]}: {r[1]} + {r[2]} + {r[3]}' for r in C['top'][:3]), 'Các phường, xã ven đô có nhiều vụ việc liên quan đất đai, giải phóng mặt bằng.')
notes('3', ['Chưa rõ quan hệ giữa «Tổng đơn thư tiếp nhận», «Đơn kỳ trước chuyển sang», «Đơn mới trong kỳ» (dữ liệu mẫu: 10, 52, 10). IOC hiểu (đã chốt theo bản trả lời BA, mục 82, theo biểu xử lý đơn của Thông tư 06/2025/TT-TTCP): tổng đơn tiếp nhận = đơn mới trong kỳ, chỉ để đối chiếu; đơn phải xử lý = đơn kỳ trước + đơn mới; đơn đã xử lý = cộng 4 phần đã phân loại.',
            '«Tồn cuối kỳ» chưa rõ là tồn đơn hay tồn vụ việc. IOC hiểu là vụ việc đang xử lý (trong hạn + quá hạn). Đề nghị xác nhận.',
            'IOC chỉ cộng bản ghi "Tổng hợp"; bản "Chi tiết đơn thư", "Chi tiết vụ việc" để xem chi tiết, tránh cộng trùng. Đề nghị xác nhận mỗi phường/xã gửi đúng một bản tổng hợp mỗi tháng.',
            '«Quá hạn báo cáo (ngày)» đang là kiểu Ngày tháng; đề nghị đổi sang Số. Dữ liệu mẫu của 6 trường kết quả giải quyết đang là "test", cần thay bằng số.',
            'Bản ghi kỳ "Đột xuất" không được IOC cộng vào số tháng. Đề nghị xác nhận số liệu đột xuất đã nằm trong bản tháng.'])

# ======================================================= PHẦN III
k.page_break()
heading('PHẦN III. BẢNG 126 PHƯỜNG/XÃ', 1)
para('Ô bên phải của form là bảng đủ **126 phường/xã** theo thứ tự danh mục «Địa bàn». Dòng đầu là cộng 126 phường/xã.')
table([
    ['Cột trong bảng', 'Chỉ tiêu', 'Cách tính cho mỗi phường/xã', 'Dòng đầu'],
    ['Lượt tiếp công dân', '3', 'TỔNG(«Số cuộc tiếp công dân»), tháng 1 – 9', n(C['luot'])],
    ['Đơn thư tiếp nhận', '3', 'TỔNG(«Đơn mới trong kỳ»)', n(C['donMoi'])],
    ['Vụ việc thụ lý', '3', 'TỔNG(«Số vụ việc thụ lý»)', n(C['thuLy'])],
    ['Đã giải quyết', '3', 'Đã giải quyết ÷ thụ lý × 100', pc(C['daGq'], C['thuLy'])],
    ['Tồn cuối kỳ', '3', '«Tồn cuối kỳ» tháng 9', n(C['ton'])],
    ['Cuộc thanh tra tại địa bàn', '2', 'ĐẾM(«Mã cuộc thanh tra») có «Địa bàn» là phường/xã đó', n(T['n'])],
    ['Kiểm tra Chủ tịch UBND', '1', 'Trạng thái cuộc kiểm tra tại phường/xã (nếu có)', f'{K["n"]} cuộc'],
], [4.2, 1.5, 7.3, 3.0], size=10.5)

# ======================================================= PHẦN IV
k.page_break()
heading('PHẦN IV. TỔNG HỢP ĐỀ NGHỊ THANH TRA THÀNH PHỐ XÁC NHẬN', 1)
para('Gom các đề nghị xác nhận của 3 chỉ tiêu. Cột "Kết quả" để trống cho Thanh tra Thành phố ghi ý kiến.')
table([['#', 'Chỉ tiêu', 'Nội dung', 'Kết quả']] + [[str(i + 1), c, x, ''] for i, (c, x) in enumerate(ALL_NOTES)], [0.8, 1.6, 10.6, 3.0], size=10.5)

# ======================================================= PHỤ LỤC
k.page_break()
ctm_section(heading, para, lambda rows, w: table(rows, w, size=10), 'ubnd-thanhtra',
            'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=['Theo phản hồi nhóm triển khai 13/10/2026: ẩn "Cuộc kiểm tra theo kế hoạch năm" và "Tiến độ so kế hoạch năm" (eform kiểm tra không có trường kế hoạch).', 'Kiến nghị thu hồi, đã thu hồi ghi **tỷ đồng, 1 số lẻ**.', 'Kiến nghị, đơn thư tiếp nhận để **trung tính**: tăng hay giảm không tô xanh/đỏ.', 'Cảnh báo Vàng của cuộc thanh tra theo **thời gian đã dùng trên 75%** kế hoạch mà chưa kết thúc, không theo tiến độ (BA mục 80); thẻ cảnh báo có chú giải, **màu khớp tên mức** Xanh/Vàng/Cam/Đỏ.', 'Thêm thẻ **Kết quả phân loại, xử lý đơn**: giữa vòng là đơn **đã** xử lý (cộng 4 phần); "phải xử lý", "chưa xử lý" ghi dòng phụ (BA mục 82).', 'Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
k.page_break()
k.page_break()
heading('PHỤ LỤC. DANH SÁCH TRƯỜNG CỦA 3 EFORM', 1)
para('Trích nguyên từ file mô tả đầu vào eform, sheet "Thanh Tra TP".')
for i, e in enumerate(EF):
    heading(f'{i + 1}. {e["eform"]} ({len(e["fields"])} trường)', 2)
    table([['#', 'Tên trường', 'Mã trường', 'Kiểu nhập']] + [[str(j + 1), f[0], f[1], f[2] or '(chưa ghi)'] for j, f in enumerate(e['fields'])],
          [0.8, 6.4, 6.6, 2.2], size=10, mono_col=2)
print('đề nghị:', len(ALL_NOTES))
for p in k.save(OUT): print('ok', p)
