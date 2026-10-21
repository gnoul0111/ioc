# -*- coding: utf-8 -*-
"""Sinh docs/KHCN_SoKhoaHocCongNghe/KHCN_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 3 chỉ tiêu chuyển đổi số cấp xã của Sở KH&CN trên IOC.
Chạy từ thư mục gốc ioc:  python tools/khcn_doc_docx.py
Lời văn viết tay; CÁC CON SỐ đọc thẳng từ js/core/khcn-config.js (qua node). Tên trường đúng như file mô tả đầu vào eform
(tools/khcn-fields.json, sheet "Sở KHCN"; tài liệu được ghi đúng tên trường kèm "(mã n)", còn giao diện IOC không hiện mã).
Word + Markdown qua tools/doc_kit.py. Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EF = json.load(open(os.path.join(ROOT, 'tools', 'khcn-fields.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'docs', 'KHCN_SoKhoaHocCongNghe', 'KHCN_MO_TA_CHI_TIEU.docx')
_JS = ("const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
       "vm.runInContext(fs.readFileSync('js/core/xa-dan-so.js','utf8')+fs.readFileSync('js/core/khcn-config.js','utf8')+';this.S=KHCN_SUM;',c);process.stdout.write(JSON.stringify({S:c.S}));")
S = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))['S']


def n(x, d=0):
    s = f'{abs(x):,.{d}f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return ('−' if x < 0 else '') + s
def pc(a, b, d=1): return n(a / b * 100, d) + '%'


H, C, V = S['ht'], S['cn'], S['vb']
E1, E2, E3 = EF
FN = [[f[0] for f in e['fields']] for e in EF]
NDV = 126
TH = [f'T{m + 1}' for m in range(9)]

k = Kit('Sở Khoa học và Công nghệ · Mô tả chỉ tiêu trên IOC')
para, table, box, heading, note = k.para, k.table, k.box, k.heading, k.note

# ======================================================= TRANG BÌA
k.blank(5)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(4)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY)
para('SỞ KHOA HỌC VÀ CÔNG NGHỆ HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('Chỉ số chuyển đổi số cấp phường/xã: biểu đồ, trường dữ liệu và cách tính', 14, CENTER, 4, italic=True, color=GREY)
para('xây dựng từ 3 eform nhập liệu của Sở', 14, CENTER, 0, italic=True, color=GREY)
k.blank(5)
table([
    ['Đơn vị', 'Sở Khoa học và Công nghệ Thành phố Hà Nội (hợp nhất từ Sở Thông tin và Truyền thông và Sở Khoa học và Công nghệ)'],
    ['Nguồn dữ liệu', f'File mô tả đầu vào eform, sheet "Sở KHCN": 3 eform, {sum(len(f) for f in FN)} trường nhập'],
    ['Phạm vi', '3 chỉ tiêu, 9 biểu đồ, bảng 126 phường/xã'],
    ['Số liệu ví dụ', 'Số giả lập đặt theo bậc độ lớn số liệu đã công bố, kỳ tháng 9/2026'],
    ['Phiên bản', '1.3 · ngày 20/10/2026 (số giả lập dân số từng phường/xã lấy đúng dân số thật theo phương án sắp xếp đơn vị hành chính cấp xã năm 2025, tổng 8.818.383 người, để mẫu số tỷ lệ khớp cột Dân số của bảng 126 phường/xã). Bản 1.2 · ngày 13/10/2026: thêm quy ước xử lý dữ liệu eform — khóa bản ghi, cách lấy theo kỳ, chỉ hiện số có trường trong eform'],
], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()
k.toc()
k.page_break()

# ======================================================= PHẦN I
heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Mục đích tài liệu', 2)
para('Tài liệu mô tả cách IOC dựng 3 chỉ tiêu chuyển đổi số cấp phường/xã của Sở Khoa học và Công nghệ từ 3 eform: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào, mỗi con số được tính ra sao. Tên trường viết đúng như file mô tả eform, kèm "(mã n)" là mã chỉ số chuyển đổi số. **Trên giao diện IOC chỉ ghi tên chỉ số bằng lời, không hiện mã.**')
para('Trên giao diện, mỗi chỉ tiêu chỉ gồm **thẻ số tổng hợp** và **biểu đồ**; cách tính chỉ trình bày trong tài liệu này. Trước đây Sở được ghi là "không có chỉ tiêu"; bộ chỉ tiêu này là bổ sung mới.')

heading('2. Ba eform, ba chỉ tiêu', 2)
table([
    ['#', 'Chỉ tiêu trên IOC', 'Eform nguồn', 'Nội dung chính'],
    ['1', 'Hạ tầng và thiết bị số', E1['eform'], 'Hộ có Internet cáp quang, người dùng điện thoại thông minh, 4 tiêu chí hạ tầng tại trụ sở phường/xã'],
    ['2', 'Con người và cộng đồng số', E2['eform'], 'Dùng dịch vụ công trực tuyến, danh tính điện tử, chữ ký số, kỹ năng số, tổ chức hỗ trợ chuyển đổi số, an toàn thông tin'],
    ['3', 'Văn bản, quy trình và dịch vụ công', E3['eform'], 'Hồ sơ trực tuyến toàn trình, thanh toán trực tuyến, văn bản xử lý trên mạng và ký số, trợ lý ảo, hội nghị'],
], [0.8, 3.8, 5.0, 6.4], size=10.5)
para('Mỗi bản ghi là số liệu **một tháng của một «Địa bàn»** (126 phường/xã). IOC hiểu «Loại đối tượng», «Tên đối tượng» là UBND phường/xã (xem đề nghị ở Chỉ tiêu 1).')

heading('3. Kỳ báo cáo', 2)
para(f'Kỳ hiển thị mặc định: **{"tháng 9/2026"}**. Các số dân, hộ, cán bộ, tiêu chí Có/Không là **số tại thời điểm**: lấy bản ghi tháng đang xem, không cộng các tháng. Các số hồ sơ, văn bản, hội nghị là **số trong tháng**; biểu đồ diễn biến dùng bản ghi tháng 1 – 9.')

heading('4. Căn cứ đặt số giả lập', 2)
table([
    ['Số liệu công bố', 'Giá trị', 'Số giả lập tháng 9/2026'],
    ['Hộ gia đình có Internet băng rộng cáp quang', '91,4%', pc(H['hoCq'], H['ho'])],
    ['Dân số trưởng thành có điện thoại thông minh', '97%', pc(H['sm'], H['ds15']) + ' (dân số từ 15 tuổi)'],
    ['Mục tiêu 2025: hồ sơ thủ tục xử lý trực tuyến', '80%; xã, phường tiếp nhận tối thiểu 60% hồ sơ trực tuyến', f'Toàn trình {n(V["toanTrinh"], 1)}%; {V["nhom"][2][1]} phường/xã dưới 60%'],
    ['Mục tiêu 2025: dân số trưởng thành dùng dịch vụ công trực tuyến', '40%', pc(C['dvctt'], C['dan']) + ' (trên tổng dân số)'],
    ['Cán bộ xử lý hồ sơ trên môi trường mạng, ký số', '100% từ 30/6/2025', f'Văn bản xử lý trên mạng {pc(V["vbMang"], V["vbNb"])}, ký số {pc(V["vbKySo"], V["vbCq"])}'],
    ['Tổ công nghệ số cộng đồng', 'Gần 5.000 tổ, hơn 30.000 thành viên', f'{C["tieuChi"][0][1]}/126 phường/xã có tổ'],
    ['Dân số Hà Nội', 'Khoảng 8,6 – 8,7 triệu người', n(C['dan']) + ' người'],
], [5.0, 4.8, 6.2], size=10)
note('Nguồn: VnBusiness (hạ tầng số Hà Nội), Tạp chí Công Thương, Báo Pháp luật Việt Nam (chỉ tiêu dịch vụ công trực tuyến), Cổng thông tin Hà Nội (Tổ công nghệ số cộng đồng, ký số trên VNeID). Phân bổ theo phường/xã, theo tháng là giả lập: phường cao hơn xã, các xã miền núi, xa trung tâm thấp hơn mặt bằng.')

heading('5. Nguyên tắc tính tỷ lệ', 2)
para('Mỗi chỉ số trong eform có sẵn trường tỷ lệ do đơn vị tự tính (ví dụ «Tỷ lệ hộ có Internet cáp quang - mã 9 (%)»). IOC **không dùng** các trường này mà **cộng tử số, mẫu số của 126 phường/xã rồi mới chia**. Riêng tỷ lệ hồ sơ trực tuyến toàn trình, eform chỉ có trường % nên IOC lấy **bình quân có trọng số theo «Tổng hồ sơ TTHC tiếp nhận»**.')
box([f'Tỷ lệ hộ có cáp quang toàn Thành phố = {n(H["hoCq"])} ÷ {n(H["ho"])} = {pc(H["hoCq"], H["ho"])}, không phải trung bình cộng 126 tỷ lệ của phường/xã.'], k.FORM_FILL, 'Ví dụ: ')

# ======================================================= PHẦN II
k.page_break()
heading('PHẦN II. CHI TIẾT 3 CHỈ TIÊU', 1)

def fields_table(rows):
    data = [['#', 'Tên trường (đúng như eform)', 'Kiểu nhập', 'Vai trò', 'Dùng để']]
    for i, r in enumerate(rows): data.append([str(i + 1)] + list(r))
    table(data, [0.8, 5.6, 2.0, 2.1, 5.5], size=10.5)
def kpi_table(rows): table([['Thẻ số', 'Công thức', 'Kết quả (giả lập)']] + rows, [3.6, 8.2, 4.2], size=11, keep=True)
def chart(code, title, kind, axis, value, formula, example, note_=None):
    heading(f'Biểu đồ {code}. {title}', 3)
    rows = [['Loại biểu đồ', kind], ['Trục / nhóm', axis], ['Giá trị hiển thị', value], ['Cách tính', formula], ['Ví dụ (giả lập)', example]]
    if note_: rows.append(['Ghi chú', note_])
    table(rows, [3.4, 12.6], header=False, size=11.5, key_col=True, keep=True)
ALL_NOTES = []
SHOW_NOTE_BOX = False  # khối "Lưu ý, đề nghị Sở xác nhận" cuối mỗi chỉ tiêu — ẩn theo yêu cầu 14/10/2026; nội dung vẫn gom vào Phần IV
def notes(ct, items):
    if SHOW_NOTE_BOX: box(['• ' + x for x in items], k.NOTE_FILL, 'Lưu ý, đề nghị Sở xác nhận', 12)
    ALL_NOTES.extend((ct, x) for x in items)
KY = [['Kỳ báo cáo, Năm,', 'Quý, Tháng'], 'Danh mục / Số', 'Lọc kỳ', 'Chọn bản ghi tháng đang xem']
DB = ['Địa bàn', 'Danh mục', 'Nhóm', 'Phường/xã của bản ghi; tách Phường / Xã; bảng 126 phường/xã']
KHONG = ['Loại đối tượng, Tên đối tượng, Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết']

# ---------------- CHỈ TIÊU 1
heading('Chỉ tiêu 1. Hạ tầng và thiết bị số', 2)
heading('1.1. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Tổng số hộ gia đình (mã 9)', 'Số', 'Cộng', 'Mẫu số tỷ lệ hộ có cáp quang'],
    ['Số hộ có Internet cáp quang (mã 9)', 'Số', 'Cộng', 'Tử số tỷ lệ hộ có cáp quang'],
    ['Dân số từ 15 tuổi (mã 42)', 'Số', 'Cộng', 'Mẫu số tỷ lệ dùng điện thoại thông minh'],
    ['Số người dùng smartphone (mã 42)', 'Số', 'Cộng', 'Tử số tỷ lệ dùng điện thoại thông minh'],
    ['Có kết nối Internet cáp quang (mã 10), Đã đáp ứng hạ tầng CNTT giao ban (mã 12), Có wifi công cộng miễn phí (mã 45), Có phục vụ DVC trực tuyến (mã 13)', 'Danh mục', 'Điều kiện', 'Đếm phường/xã "Có": thẻ số, biểu đồ 1.2'],
    ['Tỷ lệ hộ có Internet cáp quang - mã 9 (%), Tỷ lệ dùng smartphone kết nối Internet - mã 42 (%)', 'Số', 'Không dùng', 'IOC tự tính (Phần I, mục 5)'],
    KHONG])
heading('1.2. Thẻ số tổng hợp', 3)
tc = H['tieuChi']
kpi_table([
    ['Hộ có Internet cáp quang', 'TỔNG(«Số hộ có Internet cáp quang (mã 9)») ÷ TỔNG(«Tổng số hộ gia đình (mã 9)») × 100', pc(H['hoCq'], H['ho'])],
    ['Dùng điện thoại thông minh', 'TỔNG(«Số người dùng smartphone (mã 42)») ÷ TỔNG(«Dân số từ 15 tuổi (mã 42)») × 100', pc(H['sm'], H['ds15'])],
] + [[r[0], 'ĐẾM(phường/xã có giá trị "Có")', f'{r[1]}/{NDV}'] for r in tc])
heading('1.3. Biểu đồ', 3)
chart('1.1', 'Phường và xã: hộ có cáp quang, người dùng điện thoại thông minh', 'Biểu đồ cột ngang, mỗi nhóm 2 cột (%)', 'Trục dọc: Phường / Xã (theo chữ đầu tên «Địa bàn»)',
      'Hai tỷ lệ', 'Trong mỗi nhóm, cộng tử số và mẫu số rồi chia như thẻ số.',
      f'Phường {n(H["cap"][0][0], 1)}% / {n(H["cap"][0][1], 1)}% · Xã {n(H["cap"][1][0], 1)}% / {n(H["cap"][1][1], 1)}%')
chart('1.2', 'Tiêu chí hạ tầng tại trụ sở phường/xã', 'Biểu đồ cột ngang xếp chồng Có / Không', '4 tiêu chí mã 10, 12, 45, 13', 'Số phường/xã; mỗi cột = 126',
      'ĐẾM phường/xã theo giá trị Có / Không của từng trường.', ' · '.join(f'{r[0]} {r[1]}/{NDV}' for r in tc))
chart('1.3', '10 phường/xã có tỷ lệ hộ có cáp quang thấp nhất', 'Biểu đồ cột ngang (%)', 'Trục dọc: 10 «Địa bàn», xếp từ thấp lên', 'Tỷ lệ hộ có cáp quang',
      'Tính tỷ lệ của từng phường/xã, xếp tăng dần, lấy 10 đơn vị đầu.', ' · '.join(f'{r[0]} {n(r[1], 1)}%' for r in H['cqThap'][:3]), 'Dùng để biết nơi cần ưu tiên phát triển hạ tầng.')
notes('1', ['«Loại đối tượng», «Tên đối tượng» đang là Chữ, dữ liệu mẫu "test". IOC hiểu mỗi bản ghi là một UBND phường/xã. Nếu eform còn dùng cho sở, ngành, đề nghị đổi «Loại đối tượng» sang Danh mục (Phường/xã, Sở/ngành…).',
            'Số hộ, số người dùng thay đổi chậm; đề nghị báo cáo theo quý hoặc năm thay vì tháng để giảm nhập liệu. IOC lấy bản ghi mới nhất.',
            'Tiêu chí "Đã đáp ứng hạ tầng CNTT giao ban (mã 12)" trùng nội dung eform hạ tầng công nghệ thông tin (chỉ số 11, 12) của Văn phòng UBND Thành phố. Đề nghị thống nhất một nguồn nhập.',
            'Dữ liệu mẫu chưa khớp: 5/5 hộ có cáp quang nhưng tỷ lệ ghi 8%; 7 người dùng smartphone trên dân số 5.'])

# ---------------- CHỈ TIÊU 2
k.page_break()
heading('Chỉ tiêu 2. Con người và cộng đồng số', 2)
heading('2.1. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Dân số (mã 48), Số người dùng DVC trực tuyến (mã 48)', 'Số', 'Cộng', 'Tỷ lệ dùng dịch vụ công trực tuyến'],
    ['Dân số từ 14 tuổi (mã 40), Số người có danh tính điện tử (mã 40)', 'Số', 'Cộng', 'Tỷ lệ có danh tính điện tử'],
    ['Dân số trưởng thành (mã 41), Số người có chữ ký số (mã 41)', 'Số', 'Cộng', 'Tỷ lệ có chữ ký số'],
    ['Dân số (mã 19), Số người phổ cập kỹ năng số (mã 19)', 'Số', 'Cộng', 'Tỷ lệ phổ cập kỹ năng số'],
    ['Có Tổ chuyển đổi số cộng đồng (mã 14), Có Đội hỗ trợ CĐS phản ứng nhanh (mã 15), Có mô hình khuyến khích DVC trực tuyến (mã 8)', 'Danh mục', 'Điều kiện', 'Thẻ số; biểu đồ 2.2'],
    ['Tổng CBCCVC (mã 21), Số tham gia lớp ATTT (mã 21)', 'Số', 'Cộng', 'Thẻ Cán bộ học an toàn thông tin'],
    ['4 trường tỷ lệ (mã 48, 40, 41, 19)', 'Số', 'Không dùng', 'IOC tự tính (Phần I, mục 5)'],
    KHONG])
heading('2.2. Thẻ số tổng hợp', 3)
kpi_table([
    ['Dùng dịch vụ công trực tuyến', 'TỔNG(«Số người dùng DVC trực tuyến (mã 48)») ÷ TỔNG(«Dân số (mã 48)») × 100', pc(C['dvctt'], C['dan'])],
    ['Có danh tính điện tử', 'TỔNG(«Số người có danh tính điện tử (mã 40)») ÷ TỔNG(«Dân số từ 14 tuổi (mã 40)») × 100', pc(C['dtdt'], C['ds14'])],
    ['Có chữ ký số', 'TỔNG(«Số người có chữ ký số (mã 41)») ÷ TỔNG(«Dân số trưởng thành (mã 41)») × 100', pc(C['cks'], C['dsTt'])],
    ['Phổ cập kỹ năng số', 'TỔNG(«Số người phổ cập kỹ năng số (mã 19)») ÷ TỔNG(«Dân số (mã 19)») × 100', pc(C['kns'], C['dan'])],
    ['Có Tổ chuyển đổi số cộng đồng', 'ĐẾM(«Có Tổ chuyển đổi số cộng đồng (mã 14)» = Có)', f'{C["tieuChi"][0][1]}/{NDV}'],
    ['Cán bộ học an toàn thông tin', 'TỔNG(«Số tham gia lớp ATTT (mã 21)») ÷ TỔNG(«Tổng CBCCVC (mã 21)») × 100', f'{n(C["attt"])} ÷ {n(C["cb"])} = {pc(C["attt"], C["cb"])}'],
])
heading('2.3. Biểu đồ', 3)
LB = ['Dùng dịch vụ công trực tuyến', 'Có danh tính điện tử', 'Có chữ ký số', 'Phổ cập kỹ năng số']
chart('2.1', 'Bốn tỷ lệ công dân số: phường và xã', 'Biểu đồ cột ngang, mỗi tỷ lệ 2 cột Phường / Xã (%)', 'Trục dọc: 4 tỷ lệ ở thẻ số', 'Tỷ lệ (%)',
      'Tách phường/xã theo chữ đầu tên, trong mỗi nhóm cộng tử số và mẫu số rồi chia.', ' · '.join(f'{LB[i]}: {n(C["cap"][0][i], 1)}% / {n(C["cap"][1][i], 1)}%' for i in range(4)))
chart('2.2', 'Tổ chức hỗ trợ chuyển đổi số tại phường/xã', 'Biểu đồ cột ngang xếp chồng Có / Không', '3 tiêu chí mã 14, 15, 8', 'Số phường/xã; mỗi cột = 126',
      'ĐẾM phường/xã theo giá trị Có / Không.', ' · '.join(f'{r[0]} {r[1]}/{NDV}' for r in C['tieuChi']))
chart('2.3', '10 phường/xã có tỷ lệ dùng dịch vụ công trực tuyến thấp nhất', 'Biểu đồ cột ngang (%)', 'Trục dọc: 10 «Địa bàn», xếp từ thấp lên', 'Tỷ lệ dùng dịch vụ công trực tuyến',
      'Tính tỷ lệ của từng phường/xã, xếp tăng dần, lấy 10 đơn vị đầu.', ' · '.join(f'{r[0]} {n(r[1], 1)}%' for r in C['dvcThap'][:3]))
notes('2', ['Eform có 4 – 5 mẫu số dân số khác nhau (dân số mã 48 và mã 19 nhập 2 lần; dân số từ 14 tuổi; dân số trưởng thành; dân số từ 15 tuổi ở eform 1). Đề nghị lấy dân số từ một nguồn chung (Cơ sở dữ liệu quốc gia về dân cư) thay vì nhập tay mỗi tháng.',
            'Đề nghị xác nhận «Số người dùng DVC trực tuyến» là số người có ít nhất một hồ sơ trực tuyến trong kỳ hay lũy kế; «Số người có chữ ký số» có tính cả ký số trên VNeID không.',
            '«Số tham gia lớp ATTT»: đề nghị xác nhận là số cán bộ tham gia trong kỳ hay lũy kế từ đầu năm (IOC so với tổng số cán bộ).'])

# ---------------- CHỈ TIÊU 3
k.page_break()
heading('Chỉ tiêu 3. Văn bản, quy trình và dịch vụ công', 2)
heading('3.1. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Tổng hồ sơ TTHC tiếp nhận (mã 25/49)', 'Số', 'Cộng', 'Thẻ số; trọng số tỷ lệ toàn trình'],
    ['Tỷ lệ hồ sơ trực tuyến toàn trình - mã 25/49 (%)', 'Số', 'Cộng', 'Bình quân có trọng số theo số hồ sơ: thẻ số, biểu đồ 3.1 – 3.3'],
    ['Tổng hồ sơ có nghĩa vụ tài chính (mã 50), Số hồ sơ thanh toán trực tuyến (mã 50)', 'Số', 'Cộng', 'Tỷ lệ thanh toán trực tuyến'],
    ['Tổng văn bản/hồ sơ nội bộ (mã 27), Số xử lý trên môi trường mạng (mã 27)', 'Số', 'Cộng', 'Tỷ lệ xử lý trên môi trường mạng'],
    ['Tổng văn bản trao đổi CQNN (mã 28), Số văn bản điện tử ký số (mã 28)', 'Số', 'Cộng', 'Tỷ lệ văn bản ký số'],
    ['Có chấp nhận thanh toán không tiền mặt (mã 37), Có trợ lý ảo (mã 29)', 'Danh mục', 'Điều kiện', 'Thẻ số'],
    ['Số hội nghị tổ chức trong kỳ (mã 5)', 'Số', 'Cộng', 'Thẻ số'],
    ['Tỷ lệ thanh toán trực tuyến, xử lý trên môi trường mạng, văn bản ký số (mã 50, 27, 28)', 'Số', 'Không dùng', 'IOC tự tính (Phần I, mục 5)'],
    KHONG])
heading('3.2. Thẻ số tổng hợp', 3)
kpi_table([
    ['Hồ sơ thủ tục tiếp nhận', 'TỔNG(«Tổng hồ sơ TTHC tiếp nhận (mã 25/49)»), tháng 9', n(V['hs'])],
    ['Trực tuyến toàn trình', 'TỔNG(«Tỷ lệ… toàn trình» × «Tổng hồ sơ TTHC tiếp nhận») ÷ TỔNG(«Tổng hồ sơ TTHC tiếp nhận»)', n(V['toanTrinh'], 1) + '%'],
    ['Thanh toán trực tuyến', 'TỔNG(«Số hồ sơ thanh toán trực tuyến (mã 50)») ÷ TỔNG(«Tổng hồ sơ có nghĩa vụ tài chính (mã 50)») × 100', pc(V['tttt'], V['nvtc'])],
    ['Văn bản xử lý trên môi trường mạng', 'TỔNG(«Số xử lý trên môi trường mạng (mã 27)») ÷ TỔNG(«Tổng văn bản/hồ sơ nội bộ (mã 27)») × 100', pc(V['vbMang'], V['vbNb'])],
    ['Văn bản trao đổi được ký số', 'TỔNG(«Số văn bản điện tử ký số (mã 28)») ÷ TỔNG(«Tổng văn bản trao đổi CQNN (mã 28)») × 100', pc(V['vbKySo'], V['vbCq'])],
    ['Có trợ lý ảo; Nhận thanh toán không tiền mặt', 'ĐẾM(phường/xã có giá trị "Có")', f'{V["troLy"]}/{NDV}; {V["ktm"]}/{NDV}'],
    ['Hội nghị tổ chức trong tháng', 'TỔNG(«Số hội nghị tổ chức trong kỳ (mã 5)»)', n(V['hoiNghi'])],
])
heading('3.3. Biểu đồ', 3)
XH = ['Hồ sơ trực tuyến toàn trình', 'Thanh toán trực tuyến', 'Văn bản xử lý trên môi trường mạng', 'Văn bản trao đổi được ký số']
chart('3.1', 'Diễn biến các tỷ lệ theo tháng', 'Biểu đồ đường, 4 đường (%)', 'Trục ngang: «Tháng» 1 → 9; trục dọc từ 50%', '4 tỷ lệ ở thẻ số',
      'Với mỗi tháng, tính 4 tỷ lệ như thẻ số trên bản ghi của tháng đó.', ' · '.join(f'{XH[i]}: {n(V["xuHuong"][i][0], 1)}% → {n(V["xuHuong"][i][8], 1)}%' for i in range(4)))
chart('3.2', 'Phường/xã theo tỷ lệ hồ sơ trực tuyến toàn trình — tháng 9', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi 126', '3 nhóm: ' + ' / '.join(g[0] for g in V['nhom']), 'Số phường/xã',
      '«Tỷ lệ hồ sơ trực tuyến toàn trình» tháng 9 của từng phường/xã, xếp vào 3 nhóm.', ' · '.join(f'{g[0]} {g[1]}' for g in V['nhom']),
      'Mốc 60% theo yêu cầu xã, phường tiếp nhận tối thiểu 60% hồ sơ trực tuyến; mốc 80% theo mục tiêu năm 2025 của Thành phố.')
chart('3.3', '10 phường/xã có tỷ lệ trực tuyến toàn trình thấp nhất — tháng 9', 'Biểu đồ cột ngang (%)', 'Trục dọc: 10 «Địa bàn», xếp từ thấp lên', 'Tỷ lệ toàn trình',
      'Xếp tăng dần theo «Tỷ lệ hồ sơ trực tuyến toàn trình» tháng 9, lấy 10 đơn vị đầu.', ' · '.join(f'{r[0]} {n(r[1], 1)}%' for r in V['thap'][:3]))
notes('3', ['Eform chỉ có tỷ lệ hồ sơ trực tuyến toàn trình (%), không có số hồ sơ toàn trình, nên IOC phải lấy bình quân có trọng số theo số hồ sơ. Đề nghị bổ sung trường «Số hồ sơ trực tuyến toàn trình».',
            'Hồ sơ thủ tục hành chính đã có nguồn API của Trung tâm Phục vụ hành chính công; tỷ lệ văn bản xử lý trên môi trường mạng (mã 27) và trợ lý ảo (mã 29) trùng eform chỉ số 27, 29 của Văn phòng UBND Thành phố. Đề nghị thống nhất mỗi chỉ số chỉ nhập ở một nơi.',
            '«Số hội nghị tổ chức trong kỳ (mã 5)»: đề nghị xác nhận là hội nghị trực tuyến hay mọi hội nghị.',
            'Dữ liệu mẫu chưa hợp lý: 4 hồ sơ có nghĩa vụ tài chính nhưng 5 hồ sơ thanh toán trực tuyến.'])

# ======================================================= PHẦN III, IV, PHỤ LỤC
k.page_break()
heading('PHẦN III. BẢNG 126 PHƯỜNG/XÃ', 1)
para('Ô bên phải của form là bảng đủ **126 phường/xã**. Dòng đầu là tỷ lệ chung toàn Thành phố, tính bằng cộng tử số và mẫu số của 126 phường/xã (Phần I, mục 5).')
table([
    ['Cột trong bảng', 'Chỉ tiêu', 'Cách tính cho mỗi phường/xã', 'Dòng đầu'],
    ['Hộ có cáp quang', '1', 'Số hộ có cáp quang ÷ tổng số hộ × 100', pc(H['hoCq'], H['ho'])],
    ['Dùng điện thoại thông minh', '1', 'Người dùng smartphone ÷ dân số từ 15 tuổi × 100', pc(H['sm'], H['ds15'])],
    ['Dùng dịch vụ công trực tuyến', '2', 'Người dùng ÷ dân số × 100', pc(C['dvctt'], C['dan'])],
    ['Có danh tính điện tử', '2', 'Người có danh tính điện tử ÷ dân số từ 14 tuổi × 100', pc(C['dtdt'], C['ds14'])],
    ['Có chữ ký số', '2', 'Người có chữ ký số ÷ dân số trưởng thành × 100', pc(C['cks'], C['dsTt'])],
    ['Trực tuyến toàn trình (T9)', '3', '«Tỷ lệ hồ sơ trực tuyến toàn trình» tháng 9', n(V['toanTrinh'], 1) + '%'],
    ['Thanh toán trực tuyến (T9)', '3', 'Hồ sơ thanh toán trực tuyến ÷ hồ sơ có nghĩa vụ tài chính × 100', pc(V['tttt'], V['nvtc'])],
], [4.4, 1.5, 7.3, 2.8], size=10.5)
k.page_break()
heading('PHẦN IV. TỔNG HỢP ĐỀ NGHỊ SỞ XÁC NHẬN', 1)
para('Gom các đề nghị Sở xác nhận của 3 chỉ tiêu. Cột "Kết quả" để trống cho Sở ghi ý kiến.')
table([['#', 'Chỉ tiêu', 'Nội dung', 'Kết quả']] + [[str(i + 1), c, x, ''] for i, (c, x) in enumerate(ALL_NOTES)], [0.8, 1.6, 10.6, 3.0], size=10.5)
k.page_break()
ctm_section(heading, para, lambda rows, w: table(rows, w, size=10), 'ubnd-khcn',
            'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=['Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
k.page_break()
k.page_break()
heading('PHỤ LỤC. DANH SÁCH TRƯỜNG CỦA 3 EFORM', 1)
para('Trích nguyên từ file mô tả đầu vào eform, sheet "Sở KHCN".')
for i, e in enumerate(EF):
    heading(f'{i + 1}. {e["eform"]} ({len(e["fields"])} trường)', 2)
    table([['#', 'Tên trường', 'Mã trường', 'Kiểu nhập']] + [[str(j + 1), f[0], f[1], f[2] or '(chưa ghi)'] for j, f in enumerate(e['fields'])],
          [0.8, 6.6, 6.4, 2.2], size=10, mono_col=2)
print('đề nghị:', len(ALL_NOTES))
for p in k.save(OUT): print('ok', p)
