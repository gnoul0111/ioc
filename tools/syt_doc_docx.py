# -*- coding: utf-8 -*-
"""Sinh docs/SYT_SoYTe/SYT_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 4 chỉ tiêu theo 4 eform của Sở Y tế trên IOC.
Chạy từ thư mục gốc ioc:  python tools/syt_doc_docx.py
Lời văn viết tay; CÁC CON SỐ đọc thẳng từ js/core/syt-config.js (qua node). Tên trường đúng như file mô tả đầu vào eform
(tools/syt-fields.json, sheet "Sở Y tế"). Word + Markdown qua tools/doc_kit.py. Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EF = json.load(open(os.path.join(ROOT, 'tools', 'syt-fields.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'docs', 'SYT_SoYTe', 'SYT_MO_TA_CHI_TIEU.docx')
_JS = ("const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
       "vm.runInContext(fs.readFileSync('js/core/xa-dan-so.js','utf8')+fs.readFileSync('js/core/syt-config.js','utf8')+';this.S=SYT_SUM;this.N=SYT_NGO_DOC;this.B=SYT_BENH;',c);"
       "process.stdout.write(JSON.stringify({S:c.S,N:c.N,B:c.B}));")
_R = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))
S, NGO, BENH = _R['S'], _R['N'], _R['B']


def n(x, d=0):
    s = f'{abs(x):,.{d}f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return ('−' if x < 0 else '') + s
def pc(a, b, d=1): return n(a / b * 100, d) + '%'


ND, BH, DI, HS = S['nd'], S['bh'], S['dich'], S['hs']
E1, E2, E3, E4 = EF
NDV = 126
T9 = 8

k = Kit('Sở Y tế · Mô tả chỉ tiêu trên IOC')
para, table, box, heading, note = k.para, k.table, k.box, k.heading, k.note

# ======================================================= TRANG BÌA
k.blank(5)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(4)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY)
para('SỞ Y TẾ HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('Ngộ độc thực phẩm, bảo hiểm y tế, dịch bệnh, hồ sơ sức khỏe điện tử: biểu đồ, trường dữ liệu và cách tính', 14, CENTER, 4, italic=True, color=GREY)
para('xây dựng từ 4 eform nhập liệu của Sở', 14, CENTER, 0, italic=True, color=GREY)
k.blank(5)
table([
    ['Đơn vị', 'Sở Y tế Thành phố Hà Nội'],
    ['Nguồn dữ liệu', f'File mô tả đầu vào eform, sheet "Sở Y tế": 4 eform, {sum(len(e["fields"]) for e in EF)} trường nhập'],
    ['Phạm vi', '4 chỉ tiêu, 12 biểu đồ, bảng 126 phường/xã'],
    ['Số liệu ví dụ', 'Số giả lập đặt theo số liệu đã công bố của Hà Nội, kỳ tháng 9/2026'],
    ['Phiên bản', '1.3 · ngày 20/10/2026 (số giả lập dân số từng phường/xã lấy đúng dân số thật theo phương án sắp xếp đơn vị hành chính cấp xã năm 2025, tổng 8.818.383 người, để mẫu số tỷ lệ khớp cột Dân số của bảng 126 phường/xã). Bản 1.2 · ngày 13/10/2026: thêm quy ước xử lý dữ liệu eform — khóa bản ghi, cách lấy theo kỳ, chỉ hiện số có trường trong eform'],
], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()
k.toc()
k.page_break()

# ======================================================= PHẦN I
heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Mục đích tài liệu', 2)
para('Tài liệu mô tả cách IOC dựng 4 chỉ tiêu của Sở Y tế từ 4 eform: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào, mỗi con số được tính ra sao. Tên trường viết đúng như file mô tả eform.')
para('Trên giao diện, mỗi chỉ tiêu chỉ gồm **thẻ số tổng hợp** và **biểu đồ**; cách tính chỉ trình bày trong tài liệu này. Bộ chỉ tiêu cũ STT 36 (ngộ độc thực phẩm), 37 (dịch bệnh nhóm A, B) và 46 (bảo trợ xã hội) **đã thay bằng 4 chỉ tiêu theo eform**.')

heading('2. Bốn eform, bốn chỉ tiêu', 2)
table([
    ['#', 'Chỉ tiêu trên IOC', 'Eform nguồn', 'Một bản ghi là'],
    ['1', 'Ngộ độc thực phẩm và mức độ thiệt hại', E1['eform'], 'Một vụ ngộ độc («Mã bản ghi», «Tên vụ việc», «Ngày phát hiện»)'],
    ['2', 'Tỷ lệ bao phủ bảo hiểm y tế', E2['eform'], 'Một «Thôn/TDP» của một «Địa bàn» trong một tháng'],
    ['3', 'Dịch bệnh nhóm A, B', E3['eform'], 'Một «Tên bệnh» tại một «Thôn/TDP», phát hiện trong kỳ'],
    ['4', 'Người dân có hồ sơ sức khỏe điện tử', E4['eform'], 'Một «Thôn/TDP» của một «Địa bàn» trong một tháng'],
], [0.8, 4.2, 5.0, 6.0], size=10.5)
para(f'«Địa bàn» của cả 4 eform là danh mục 126 phường/xã. Eform 2 và 4 nhập theo thôn, tổ dân phố; số giả lập dùng {n(S["soThon"])} thôn/TDP (giả định, xem đề nghị ở Chỉ tiêu 2).')

heading('3. Kỳ báo cáo', 2)
para('Kỳ hiển thị mặc định: **tháng 9/2026**. Tỷ lệ bảo hiểm y tế và hồ sơ sức khỏe điện tử là **số tại thời điểm**: lấy bản ghi tháng đang xem, không cộng các tháng. Vụ ngộ độc và ca bệnh là **số phát sinh**: thẻ số cộng từ tháng 1 đến tháng 9, biểu đồ theo tháng dùng «Tháng» của bản ghi.')

heading('4. Căn cứ đặt số giả lập', 2)
dich7 = sum(BENH[0][2][:7]); sxh8 = sum(BENH[1][2][:8])
table([
    ['Số liệu công bố', 'Giá trị', 'Số giả lập'],
    ['Tỷ lệ bao phủ BHYT Hà Nội', 'Chỉ tiêu 2026: 96,25%; hết 7/2026: 96,33%, gần 8,6 triệu người; năm 2025: 95,95%', f'Tháng 9: {pc(BH["bhyt"], BH["dan"], 2)}, {n(BH["bhyt"])} người'],
    ['Hồ sơ sức khỏe điện tử', 'Gần 99% dân số hết quý II/2026; mục tiêu 100% có Sổ sức khỏe điện tử trên VNeID từ 15/10/2026', f'Tháng 6: {n(HS["xuHuong"][5], 1)}%; tháng 9: {pc(HS["hssk"], HS["dan"])}'],
    ['Tay chân miệng (cộng dồn 2026)', '3.951 ca đến tháng 7, không tử vong (cùng kỳ 2025: 3.100)', f'{n(dich7)} ca đến tháng 7; {n(DI["benh"][0][1])} ca 9 tháng'],
    ['Sốt xuất huyết', '871 ca tại 111 phường/xã, không tử vong; đỉnh dịch tháng 9 – 11', f'{n(sxh8)} ca đến tháng 8; {n(DI["benh"][1][1])} ca 9 tháng tại {DI["sxhDv"]} phường/xã'],
    ['Sởi, ho gà', 'Sởi 331 – 354 ca tại 108 – 109 phường/xã, giảm so với 2025; ho gà 7 ca', f'Sởi {n(DI["benh"][3][1])} ca; ho gà {n(DI["benh"][4][1])} ca'],
    ['COVID-19', 'Khoảng 185 ca/tuần (tháng 8/2026)', f'{n(DI["benh"][2][1])} ca 9 tháng, {n(BENH[2][2][T9])} ca tháng 9'],
    ['Dại, liên cầu lợn', '8 ổ dịch dại trên chó; có ca liên cầu lợn ở Ba Vì', f'Dại {DI["benh"][6][1]} ca (tử vong {DI["benh"][6][4]}); liên cầu lợn {DI["benh"][5][1]} ca (tử vong {DI["benh"][5][4]})'],
    ['Ngộ độc thực phẩm', 'Cả nước 2025: 84 vụ, 2.301 người mắc; quý I/2026: 36 vụ. Chưa thấy số riêng của Hà Nội', f'{ND["vu"]} vụ, {n(ND["mac"])} người mắc, {ND["tuVong"]} tử vong (giả định)'],
], [4.0, 6.6, 5.4], size=10)
note('Nguồn: Tạp chí Công Thương, Báo Pháp luật (bao phủ BHYT), VnBusiness, Báo Pháp luật (Sổ sức khỏe điện tử trên VNeID), Báo Đại biểu Nhân dân, thông báo tình hình dịch của Sở Y tế Hà Nội (CDC Hà Nội), Báo Nhân Dân (ngộ độc thực phẩm cả nước). Phân bổ theo phường/xã, theo tháng là giả lập: bảo hiểm y tế ở xã cao hơn phường (ngân sách hỗ trợ), hồ sơ sức khỏe điện tử ở xã miền núi chậm hơn; sốt xuất huyết dồn ở các phường nội đô phía nam; các vụ ngộ độc là ví dụ giả định.')

heading('5. Nguyên tắc tính tỷ lệ', 2)
para('Eform 2 và 4 không có trường tỷ lệ. IOC **cộng tử số, mẫu số của tất cả thôn/TDP** (trong một phường/xã, rồi trong toàn Thành phố) **rồi mới chia**, không lấy trung bình các tỷ lệ.')
box([f'Tỷ lệ bao phủ BHYT toàn Thành phố = {n(BH["bhyt"])} ÷ {n(BH["dan"])} = {pc(BH["bhyt"], BH["dan"], 2)}.'], k.FORM_FILL, 'Ví dụ: ')

# ======================================================= PHẦN II
k.page_break()
heading('PHẦN II. CHI TIẾT 4 CHỈ TIÊU', 1)

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
KY = [['Kỳ báo cáo, Năm,', 'Quý, Tháng'], 'Danh mục / Số', 'Lọc kỳ', 'Chọn bản ghi theo tháng']
DB = ['Địa bàn', 'Danh mục', 'Nhóm', 'Phường/xã của bản ghi; bảng 126 phường/xã']

# ---------------- CHỈ TIÊU 1
heading('Chỉ tiêu 1. Ngộ độc thực phẩm và mức độ thiệt hại', 2)
heading('1.1. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Mã bản ghi', 'Chữ', 'Khóa', 'Phân biệt từng vụ; cập nhật số liệu của cùng một vụ không cộng trùng'],
    ['Tên vụ việc', 'Chữ', 'Nhãn', 'Tên vụ trên biểu đồ 1.1'],
    ['Ngày phát hiện', 'Ngày tháng', 'Nhóm', 'Xếp vụ vào tháng: biểu đồ 1.2'],
    ['Số người mắc/nhập viện', 'Số', 'Cộng', 'Thẻ số; biểu đồ 1.1 – 1.3'],
    ['Số ca nặng, Số ca tử vong', 'Số', 'Cộng', 'Thẻ số'],
    ['Nguyên nhân nghi ngờ', 'Chữ', 'Nhóm', 'Xếp vào 4 nhóm theo từ khóa: biểu đồ 1.3'],
    ['Thôn/TDP, Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('1.2. Thẻ số tổng hợp', 3)
kpi_table([
    ['Số vụ ngộ độc', 'ĐẾM(«Mã bản ghi» khác nhau), tháng 1 – 9', n(ND['vu'])],
    ['Người mắc, nhập viện', 'TỔNG(«Số người mắc/nhập viện»)', n(ND['mac'])],
    ['Ca nặng; Tử vong', 'TỔNG(«Số ca nặng»); TỔNG(«Số ca tử vong»)', f'{n(ND["nang"])}; {n(ND["tuVong"])}'],
    ['Vụ từ 30 người mắc trở lên', 'ĐẾM(vụ có «Số người mắc/nhập viện» ≥ 30)', f'{ND["vuLon"]}/{ND["vu"]}'],
])
heading('1.3. Biểu đồ', 3)
chart('1.1', 'Các vụ ngộ độc thực phẩm: số người mắc, nhập viện', 'Biểu đồ cột ngang (người)', 'Trục dọc: «Tên vụ việc» — «Địa bàn», theo thứ tự ngày phát hiện', '«Số người mắc/nhập viện» của từng vụ',
      'Mỗi «Mã bản ghi» một cột.', ' · '.join(f'{v[0]} ({v[1]}) {v[4]}' for v in NGO[:3]))
chart('1.2', 'Người mắc ngộ độc thực phẩm theo tháng', 'Biểu đồ cột (người)', 'Trục ngang: tháng của «Ngày phát hiện», 1 → 9', 'Tổng người mắc trong tháng',
      'TỔNG(«Số người mắc/nhập viện») theo tháng của «Ngày phát hiện».', ' · '.join(f'T{i + 1}: {v}' for i, v in enumerate(ND['thangMac']) if v))
chart('1.3', 'Người mắc theo nhóm nguyên nhân nghi ngờ', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng người mắc', 'Nhóm: Vi sinh vật / Độc tố tự nhiên / Hóa chất / Chưa rõ', 'Tổng người mắc',
      '«Nguyên nhân nghi ngờ» là Chữ; IOC xếp nhóm theo từ khóa (vi sinh, vi khuẩn → Vi sinh vật; nấm, cá nóc, cóc → Độc tố tự nhiên; methanol, hóa chất, thuốc → Hóa chất; còn lại → Chưa rõ).',
      ' · '.join(f'{r[0]} {r[1]}' for r in ND['nguyenNhan']))
notes('1', ['«Nguyên nhân nghi ngờ» là Chữ tự do (mẫu "Chưa rõ"). Đề nghị đổi sang Danh mục: Vi sinh vật / Độc tố tự nhiên / Hóa chất / Chưa rõ nguyên nhân, để không phải xếp nhóm theo từ khóa.',
            'Đề nghị bổ sung «Nơi xảy ra» dạng Danh mục (bếp ăn tập thể, trường học, cỗ/đám, thức ăn đường phố, hộ gia đình) và «Số người ăn», vì đây là các tiêu chí phân loại vụ ngộ độc thường dùng.',
            'Một vụ được cập nhật nhiều lần (số người mắc tăng dần). Đề nghị xác nhận «Mã bản ghi» giữ nguyên giữa các lần cập nhật; IOC lấy bản ghi mới nhất của mỗi mã.',
            'Dữ liệu mẫu chưa khớp: «Tên vụ việc» ghi "Phường Tương Mai" (tên địa bàn), «Địa bàn» "phường Cầu Giấy"; «Tháng» 9 nhưng «Quý» là Quý II.',
            'Số liệu ngộ độc thực phẩm của riêng Hà Nội chưa thấy công bố; 6 vụ trong số giả lập là ví dụ giả định, không phải vụ việc thật.'])

# ---------------- CHỈ TIÊU 2
k.page_break()
heading('Chỉ tiêu 2. Tỷ lệ bao phủ bảo hiểm y tế', 2)
heading('2.1. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Thôn/TDP', 'Chữ', 'Đơn vị nhập', 'Mỗi thôn/TDP một bản ghi; cộng lên phường/xã'],
    ['Tổng dân số thôn', 'Số', 'Cộng', 'Mẫu số tỷ lệ bao phủ'],
    ['Số người có thẻ BHYT', 'Số', 'Cộng', 'Tử số tỷ lệ bao phủ'],
    ['Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('2.2. Thẻ số tổng hợp', 3)
kpi_table([
    ['Dân số có thẻ bảo hiểm y tế', 'TỔNG(«Số người có thẻ BHYT») ÷ TỔNG(«Tổng dân số thôn») × 100, tháng 9', f'{pc(BH["bhyt"], BH["dan"], 2)} · {n(BH["bhyt"])} người'],
    ['Chỉ tiêu năm 2026', 'Số Thành phố được giao (cấu hình, không lấy từ eform)', '96,25%'],
    ['Chưa có thẻ', 'TỔNG(«Tổng dân số thôn») − TỔNG(«Số người có thẻ BHYT»)', n(BH['chua'])],
    ['Phường/xã đạt chỉ tiêu', 'ĐẾM(phường/xã có tỷ lệ ≥ 96,25%)', f'{BH["datCt"]}/{NDV}'],
])
heading('2.3. Biểu đồ', 3)
chart('2.1', 'Tỷ lệ bao phủ bảo hiểm y tế theo tháng', 'Biểu đồ đường (%) kèm đường nét đứt chỉ tiêu 96,25%', 'Trục ngang: «Tháng» 1 → 9; trục dọc 95 – 97,5%', 'Tỷ lệ toàn Thành phố',
      'Với mỗi tháng, tính tỷ lệ như thẻ số.', f'{n(BH["xuHuong"][0], 2)}% → {n(BH["xuHuong"][T9], 2)}%')
chart('2.2', 'Phường/xã theo tỷ lệ bao phủ bảo hiểm y tế — tháng 9', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi 126', '3 nhóm: ' + ' / '.join(g[0] for g in BH['nhom']), 'Số phường/xã',
      'Tính tỷ lệ của từng phường/xã, xếp vào 3 nhóm.', ' · '.join(f'{g[0]} {g[1]}' for g in BH['nhom']))
chart('2.3', '10 phường/xã có tỷ lệ bao phủ bảo hiểm y tế thấp nhất — tháng 9', 'Biểu đồ cột ngang (%), trục từ 90%', 'Trục dọc: 10 «Địa bàn», xếp từ thấp lên', 'Tỷ lệ bao phủ',
      'Tính tỷ lệ của từng phường/xã, xếp tăng dần, lấy 10 đơn vị đầu.', ' · '.join(f'{r[0]} {n(r[1], 2)}%' for r in BH['thap'][:3]))
notes('2', ['«Thôn/TDP» là Chữ tự do (mẫu "thôn 2"). Cùng một thôn có thể nhập nhiều cách viết, IOC không ghép được giữa các tháng. Đề nghị đổi sang Danh mục thôn/TDP theo từng phường/xã.',
            '«Tổng dân số thôn» gồm người thường trú hay cả tạm trú? Tỷ lệ bao phủ BHYT của ngành tính trên dân số gồm cả tạm trú; đề nghị xác nhận để khớp với số của Bảo hiểm xã hội.',
            '«Tổng dân số thôn» được nhập lặp ở eform hồ sơ sức khỏe điện tử (và các eform dân số của sở khác). Đề nghị lấy dân số từ một nguồn chung (Cơ sở dữ liệu quốc gia về dân cư).',
            'Số người có thẻ BHYT do cơ quan Bảo hiểm xã hội quản lý; đề nghị kết nối dữ liệu từ Bảo hiểm xã hội thay vì thôn/TDP nhập tay. Nội dung này cũng có ở eform bảo hiểm của Sở Nội vụ.'])

# ---------------- CHỈ TIÊU 3
k.page_break()
heading('Chỉ tiêu 3. Dịch bệnh nhóm A, B', 2)
heading('3.1. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Tên bệnh', 'Chữ', 'Nhóm', 'Quy về danh mục bệnh nhóm A, B: thẻ số, biểu đồ 3.1, 3.2'],
    ['Ngày phát hiện', 'Ngày tháng', 'Nhóm', 'Xếp ca vào tháng: biểu đồ 3.1'],
    ['Số ca mắc', 'Số', 'Cộng', 'Thẻ số; biểu đồ 3.1 – 3.3'],
    ['Số ca nặng, Số ca tử vong', 'Số', 'Cộng', 'Thẻ số'],
    ['Thôn/TDP, Biện pháp xử lý, Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('3.2. Thẻ số tổng hợp', 3)
kpi_table([
    ['Tổng số ca mắc', 'TỔNG(«Số ca mắc»), tháng 1 – 9', n(DI['ca'])],
    ['Ca mắc trong tháng 9', 'TỔNG(«Số ca mắc») có «Ngày phát hiện» trong tháng 9', n(DI['caT9'])],
    ['Ca nặng; Tử vong', 'TỔNG(«Số ca nặng»); TỔNG(«Số ca tử vong»), tháng 1 – 9', f'{n(DI["nang"])}; {n(DI["tuVong"])}'],
    ['Bệnh nhóm A', 'TỔNG(«Số ca mắc») của các bệnh thuộc nhóm A', n(DI['nhomA'])],
    ['Phường/xã có ca sốt xuất huyết', 'ĐẾM(«Địa bàn» có bản ghi «Tên bệnh» = sốt xuất huyết)', f'{DI["sxhDv"]}/{NDV}'],
])
heading('3.3. Biểu đồ', 3)
chart('3.1', 'Số ca mắc theo tháng và theo bệnh', 'Biểu đồ cột xếp chồng (ca)', 'Trục ngang: tháng của «Ngày phát hiện», 1 → 9; mỗi màu một bệnh, 3 bệnh ít ca gộp "Bệnh khác"', 'Số ca mắc',
      'TỔNG(«Số ca mắc») theo tháng và «Tên bệnh».', f'Tháng 9: {n(DI["caT9"])} ca, trong đó tay chân miệng {n(BENH[0][2][T9])}, sốt xuất huyết {n(BENH[1][2][T9])}, COVID-19 {n(BENH[2][2][T9])}')
chart('3.2', 'Số ca mắc 9 tháng theo bệnh', 'Biểu đồ cột ngang (ca), xếp giảm dần', 'Trục dọc: «Tên bệnh»', 'Tổng số ca mắc',
      'TỔNG(«Số ca mắc») theo «Tên bệnh», tháng 1 – 9.', ' · '.join(f'{b[0]} {n(b[1])}' for b in sorted(DI['benh'], key=lambda b: -b[1])))
chart('3.3', '10 phường/xã có nhiều ca sốt xuất huyết nhất', 'Biểu đồ cột ngang (ca)', 'Trục dọc: 10 «Địa bàn», xếp từ cao xuống', 'Ca sốt xuất huyết 9 tháng',
      'TỔNG(«Số ca mắc») có «Tên bệnh» = sốt xuất huyết, theo «Địa bàn».', ' · '.join(f'{r[0]} {r[1]}' for r in DI['sxhTop'][:3]), 'Dùng để khoanh vùng diệt bọ gậy, phun hóa chất.')
notes('3', ['«Tên bệnh» là Chữ tự do (mẫu "sốt rét"). Cùng một bệnh có thể nhập nhiều cách viết (SXH, sốt xuất huyết Dengue…). Đề nghị đổi sang Danh mục bệnh truyền nhiễm nhóm A, B theo Luật Phòng, chống bệnh truyền nhiễm, có sẵn thông tin nhóm A hay B.',
            'Đề nghị xác nhận một bản ghi là số ca của một bệnh tại một thôn/TDP trong kỳ (cộng dồn), hay một ổ dịch. Nếu là ổ dịch, cần thêm trường «Ổ dịch đã kết thúc» để theo dõi ổ dịch đang hoạt động như báo cáo tuần của CDC Hà Nội.',
            'Báo cáo dịch của ngành y tế theo tuần; eform theo tháng/quý/năm. Đề nghị bổ sung kỳ tuần, hoặc kết nối từ hệ thống giám sát bệnh truyền nhiễm của Bộ Y tế.',
            '«Biện pháp xử lý» là Chữ, mẫu "Đã có". Đề nghị đổi sang Danh mục (đã xử lý ổ dịch / đang xử lý / chưa xử lý) nếu cần đếm.',
            'Dữ liệu mẫu chưa khớp: «Tháng» 8 nhưng «Quý» là Quý II.'])

# ---------------- CHỈ TIÊU 4
k.page_break()
heading('Chỉ tiêu 4. Người dân có hồ sơ sức khỏe điện tử', 2)
heading('4.1. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Thôn/TDP', 'Chữ', 'Đơn vị nhập', 'Mỗi thôn/TDP một bản ghi; cộng lên phường/xã'],
    ['Tổng dân số thôn', 'Số', 'Cộng', 'Mẫu số'],
    ['Số người có hồ sơ SKĐT', 'Số', 'Cộng', 'Tử số'],
    ['Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('4.2. Thẻ số tổng hợp', 3)
kpi_table([
    ['Người dân có hồ sơ sức khỏe điện tử', 'TỔNG(«Số người có hồ sơ SKĐT») ÷ TỔNG(«Tổng dân số thôn») × 100, tháng 9', f'{pc(HS["hssk"], HS["dan"])} · {n(HS["hssk"])} người'],
    ['Chưa có hồ sơ', 'TỔNG(«Tổng dân số thôn») − TỔNG(«Số người có hồ sơ SKĐT»)', n(HS['chua'])],
    ['Phường/xã từ 99,5% trở lên', 'ĐẾM(phường/xã có tỷ lệ ≥ 99,5%)', f'{HS["nhom"][0][1]}/{NDV}'],
])
heading('4.3. Biểu đồ', 3)
chart('4.1', 'Tỷ lệ người dân có hồ sơ sức khỏe điện tử theo tháng', 'Biểu đồ đường (%) kèm đường nét đứt mục tiêu 100%', 'Trục ngang: «Tháng» 1 → 9; trục dọc 90 – 100%', 'Tỷ lệ toàn Thành phố',
      'Với mỗi tháng, tính tỷ lệ như thẻ số.', f'{n(HS["xuHuong"][0], 1)}% → {n(HS["xuHuong"][T9], 1)}%', 'Mục tiêu 100% người dân có Sổ sức khỏe điện tử trên VNeID từ 15/10/2026.')
chart('4.2', 'Phường/xã theo tỷ lệ có hồ sơ sức khỏe điện tử — tháng 9', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi 126', '3 nhóm: ' + ' / '.join(g[0] for g in HS['nhom']), 'Số phường/xã',
      'Tính tỷ lệ của từng phường/xã, xếp vào 3 nhóm.', ' · '.join(f'{g[0]} {g[1]}' for g in HS['nhom']))
chart('4.3', '10 phường/xã có tỷ lệ có hồ sơ sức khỏe điện tử thấp nhất — tháng 9', 'Biểu đồ cột ngang (%), trục từ 90%', 'Trục dọc: 10 «Địa bàn», xếp từ thấp lên', 'Tỷ lệ có hồ sơ',
      'Tính tỷ lệ của từng phường/xã, xếp tăng dần, lấy 10 đơn vị đầu.', ' · '.join(f'{r[0]} {n(r[1], 1)}%' for r in HS['thap'][:3]))
notes('4', ['Đề nghị xác nhận "có hồ sơ sức khỏe điện tử" là có hồ sơ đã chuẩn hóa trên hệ thống của ngành, hay đã có Sổ sức khỏe điện tử trên VNeID (mục tiêu Thành phố tính theo VNeID).',
            'Số người có hồ sơ đã có sẵn trong hệ thống hồ sơ sức khỏe điện tử; đề nghị kết nối tự động thay vì thôn/TDP nhập tay.',
            '«Thôn/TDP», «Tổng dân số thôn» trùng eform bảo hiểm y tế (xem đề nghị ở Chỉ tiêu 2).',
            'Dữ liệu mẫu chưa khớp: «Tháng» 5 nhưng «Quý» là Quý IV.'])

# ======================================================= PHẦN III, IV, PHỤ LỤC
k.page_break()
heading('PHẦN III. BẢNG 126 PHƯỜNG/XÃ', 1)
para('Ô bên phải của form là bảng đủ **126 phường/xã**. Dòng đầu là số chung toàn Thành phố: tỷ lệ tính bằng cộng tử số và mẫu số (Phần I, mục 5); số ca bệnh, số vụ ngộ độc cộng 9 tháng.')
table([
    ['Cột trong bảng', 'Chỉ tiêu', 'Cách tính cho mỗi phường/xã', 'Dòng đầu'],
    ['Dân số', '2', 'TỔNG(«Tổng dân số thôn»), tháng 9', n(BH['dan'])],
    ['Có thẻ BHYT', '2', 'Số người có thẻ ÷ dân số × 100', pc(BH['bhyt'], BH['dan'], 2)],
    ['Có hồ sơ sức khỏe điện tử', '4', 'Số người có hồ sơ ÷ dân số × 100', pc(HS['hssk'], HS['dan'])],
    ['Ca bệnh truyền nhiễm (9 tháng)', '3', 'TỔNG(«Số ca mắc») mọi bệnh', n(DI['ca'])],
    ['Sốt xuất huyết; Tay chân miệng', '3', 'TỔNG(«Số ca mắc») theo bệnh', f'{n(DI["benh"][1][1])}; {n(DI["benh"][0][1])}'],
    ['Vụ ngộ độc thực phẩm', '1', 'ĐẾM vụ (tổng người mắc)', f'{ND["vu"]} ({n(ND["mac"])} người)'],
], [4.4, 1.5, 7.3, 2.8], size=10.5)
k.page_break()
heading('PHẦN IV. TỔNG HỢP ĐỀ NGHỊ SỞ XÁC NHẬN', 1)
para('Gom các đề nghị Sở xác nhận của 4 chỉ tiêu. Cột "Kết quả" để trống cho Sở ghi ý kiến.')
table([['#', 'Chỉ tiêu', 'Nội dung', 'Kết quả']] + [[str(i + 1), c, x, ''] for i, (c, x) in enumerate(ALL_NOTES)], [0.8, 1.6, 10.6, 3.0], size=10.5)
k.page_break()
ctm_section(heading, para, lambda rows, w: table(rows, w, size=10), 'ubnd-yte',
            'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=['Tỷ lệ bảo hiểm y tế và hồ sơ sức khỏe điện tử ở màn **Trạm Y tế cấp xã lấy đúng số từng xã của Sở Y tế** (tháng cuối quý); nguồn chính là Sở Y tế. Bảo hiểm y tế ghi 2 số lẻ.', '**Chỉ tiêu bao phủ bảo hiểm y tế năm 2026** là vạch mốc trên thanh thực hiện, kèm chữ "đạt / chưa đạt".', 'Ca dịch bệnh **trong tháng 9** không xếp cạnh số cộng dồn 9 tháng; ghi dòng chú thích riêng.', 'Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
k.page_break()
k.page_break()
heading('PHỤ LỤC. DANH SÁCH TRƯỜNG CỦA 4 EFORM', 1)
para('Trích nguyên từ file mô tả đầu vào eform, sheet "Sở Y tế". Trường «Địa bàn» của cả 4 eform là danh mục 126 phường/xã.')
for i, e in enumerate(EF):
    heading(f'{i + 1}. {e["eform"]} ({len(e["fields"])} trường)', 2)
    table([['#', 'Tên trường', 'Mã trường', 'Kiểu nhập']] + [[str(j + 1), f[0], f[1], f[2] or '(chưa ghi)'] for j, f in enumerate(e['fields'])],
          [0.8, 6.6, 6.4, 2.2], size=10, mono_col=2)
print('đề nghị:', len(ALL_NOTES))
for p in k.save(OUT): print('ok', p)
