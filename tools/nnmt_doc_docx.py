# -*- coding: utf-8 -*-
"""Sinh docs/NNMT_SoNongNghiepMoiTruong/NNMT_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 10 chỉ tiêu theo 10 eform của Sở Nông nghiệp và
Môi trường trên IOC. Chạy từ thư mục gốc ioc:  python tools/nnmt_doc_docx.py
Lời văn viết tay; CÁC CON SỐ đọc thẳng từ js/core/nnmt-config.js (qua node). Tên trường đúng như file mô tả đầu vào eform
(tools/nnmt-fields.json, sheet "Sở NNMT"). Word + Markdown qua tools/doc_kit.py. Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EF = json.load(open(os.path.join(ROOT, 'tools', 'nnmt-fields.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'docs', 'NNMT_SoNongNghiepMoiTruong', 'NNMT_MO_TA_CHI_TIEU.docx')
_JS = ("const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
       "vm.runInContext(fs.readFileSync('js/core/nnmt-config.js','utf8')+';this.S=NM_SUM;this.CT=NM_CT;"
       "this.L={MUC:NM_MUC,MUC26:NM_MUC26,TH:NM_TH,LR:NM_LOAI_RUNG,NG:NM_NGUON,ND:NM_GN_ND,KT:NM_KTTV_LOAI,PC:NM_PCTT_LOAI,LD:NM_LD,BD:NM_BD_LOAI,TT:NM_TT};"
       "this.X={tmKh:NM_TM_KH,thCk:NM_TH_CUNG_KY,deKm:NM_DE_KM,ntmXa:NM_NTM.filter(r=>r.muc===0)};',c);"
       "process.stdout.write(JSON.stringify({S:c.S,CT:c.CT,L:c.L,X:c.X}));")
_J = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))
S, CT, X = _J['S'], _J['CT'], _J['X']
L = {k: [x[0] for x in v] for k, v in _J['L'].items()}


def n(x, d=0):
    s = f'{abs(x):,.{d}f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return ('−' if x < 0 else '') + s
def pc(a, b, d=1): return n(a / b * 100, d) + '%'
def ty(trieu, d=1): return n(trieu / 1000, d)
def so(a, b): v = (a / b - 1) * 100; return ('+' if v >= 0 else '') + n(v, 1) + '%'


FN = [f[0] for f in EF[0]['fields']]
k = Kit('Sở Nông nghiệp và Môi trường · Mô tả chỉ tiêu trên IOC')
para, table, box, heading, note = k.para, k.table, k.box, k.heading, k.note

# ======================================================= TRANG BÌA
k.blank(4)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(3)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY)
para('SỞ NÔNG NGHIỆP VÀ MÔI TRƯỜNG HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('Biểu đồ, trường dữ liệu và cách tính số liệu của 10 chỉ tiêu trên IOC', 14, CENTER, 4, italic=True, color=GREY)
para('xây dựng từ 10 eform nhập liệu của Sở', 14, CENTER, 0, italic=True, color=GREY)
k.blank(4)
table([
    ['Đơn vị', 'Sở Nông nghiệp và Môi trường Thành phố Hà Nội (hợp nhất từ Sở NN&PTNT và Sở TN&MT)'],
    ['Nguồn dữ liệu', f'File mô tả đầu vào eform, sheet "Sở NNMT": 10 eform, mỗi eform {len(FN)} trường cùng một khuôn'],
    ['Phạm vi', '10 chỉ tiêu, 26 biểu đồ, bảng 126 phường/xã; 2 chỉ tiêu số liệu thật cũ giữ nguyên'],
    ['Số liệu ví dụ', 'Số giả lập đặt theo bậc độ lớn số liệu đã công bố, 9 tháng năm 2026'],
    ['Phiên bản', '1.5 · ngày 13/10/2026 (theo phản hồi nhóm triển khai: chỉ dùng trường có trong eform — bỏ kế hoạch và tỷ lệ so kế hoạch, bỏ số hộ, hỗ trợ lương thực theo tháng báo cáo, đếm dự án/sản phẩm không trùng)'],
], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()
k.toc()
k.page_break()

# ======================================================= PHẦN I
heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Mục đích tài liệu', 2)
para('Tài liệu mô tả cách IOC dựng 10 chỉ tiêu của Sở Nông nghiệp và Môi trường từ 10 eform: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào, mỗi con số được tính ra sao. Trên giao diện, mỗi chỉ tiêu chỉ gồm **thẻ số tổng hợp** và **biểu đồ**; cách tính chỉ trình bày trong tài liệu này.')
para('Bộ chỉ tiêu cũ (STT 17 – 19, 75, 76, 78, 79, 81 – 83, nguồn File) đã được thay bằng bộ này và đã xóa khỏi IOC. Hai chỉ tiêu cũ **"Tổng hợp dữ liệu GPMB"** và **"Thống kê tình hình sử dụng đất đai"** đang dùng số liệu thật lấy từ hệ thống và không có eform mới, nên được **giữ nguyên** ở cuối danh sách chỉ tiêu.')

heading('2. Một khuôn trường dùng chung cho 10 eform', 2)
para(f'Cả 10 eform có cùng {len(FN)} trường: ' + ', '.join('«' + f + '»' for f in FN) + '. Điểm khác giữa các eform chỉ là danh mục «Phân tổ/loại dữ liệu». Vì eform **không có trường đơn vị tính**, IOC quy ước ý nghĩa và đơn vị của "Giá trị" cho từng eform như bảng dưới (cần Sở xác nhận):')
Y = [
    ['1', CT[0]['name'], 'Mức đạt chuẩn của xã theo bộ tiêu chí 2026–2030 (gom từ chữ)', 'Số tiêu chí nông thôn mới xã đã đạt (trên 10, bộ tiêu chí 2026–2030)'],
    ['2', CT[1]['name'], ' / '.join(L['TH']), 'Diện tích bị thiệt hại của vụ việc (ha)'],
    ['3', CT[2]['name'], ' / '.join(L['LR']) + ' / Cây phân tán', 'Diện tích trồng trong tháng (ha); cây phân tán tính bằng cây'],
    ['4', CT[3]['name'], ' / '.join(L['NG']), 'Vốn giải ngân của dự án (triệu đồng): kỳ này = trong tháng, lũy kế = từ đầu năm'],
    ['5', CT[4]['name'], 'Nội dung hỗ trợ (gom từ chữ)', 'Kinh phí giải ngân của nội dung, dự án (triệu đồng)'],
    ['6', CT[5]['name'], ' / '.join(L['KT']), 'Số lượt số liệu quan trắc / số bản tin dự báo / số bản tin cảnh báo trong tháng'],
    ['7', CT[6]['name'], ' / '.join(L['PC']), 'Mỗi bản ghi là một công trình, điểm (giá trị 1); riêng đê điều: chiều dài tuyến đê (km)'],
    ['8', CT[7]['name'], ' / '.join(L['LD'][:4]), 'Số người (nhân khẩu) được hỗ trợ của đợt, tính theo **lượt người** (bản trả lời BA, mục 35 – 37)'],
    ['9', CT[8]['name'], ' / '.join(L['LD']), 'Số gạo hỗ trợ của đợt: nhập **kg**, IOC chia 1.000 và hiển thị **tấn** (đã chốt theo bản trả lời BA, mục 38 – 39)'],
    ['10', CT[9]['name'], ' / '.join(L['BD']), 'Số sản phẩm (bản đồ, cảnh ảnh, lớp dữ liệu) hoàn thành'],
]
table([['#', 'Chỉ tiêu', '«Phân tổ/loại dữ liệu»', '«Giá trị kỳ này», «Giá trị lũy kế» là']] + Y, [0.8, 4.6, 5.0, 5.6], size=10)

heading('3. Kỳ báo cáo và nguyên tắc tính', 2)
k.bullets(['Kỳ hiển thị mặc định: **9 tháng năm 2026** (lũy kế đến 30/9/2026); chỉ tiêu nông thôn mới theo **quý III/2026**; công trình phòng chống thiên tai theo **tháng 9/2026** (số tại thời điểm).',
           '«Giá trị kỳ này» là số phát sinh trong tháng (dùng cho biểu đồ theo tháng); «Giá trị lũy kế» là số từ đầu năm (dùng cho thẻ số).',
           'IOC không dùng «Tỷ lệ/tiến độ tự tính» và «Chênh lệch kỳ này-cùng kỳ» do đơn vị nhập, mà tự tính từ các trường số: tỷ lệ = cộng tử số ÷ cộng mẫu số; so cùng kỳ = (lũy kế ÷ «Cùng kỳ/chuẩn so sánh» − 1) × 100.',
           'Bản ghi «Phân tổ/loại dữ liệu» = Không phát sinh không được cộng; dùng để biết phường/xã đã báo cáo.'])

heading('4. Căn cứ đặt số giả lập', 2)
note('Nguồn: Bộ Xây dựng, Thời báo Tài chính, VnEconomy, Báo Đại biểu Nhân dân 28/8/2026 (nông thôn mới); Caselaw/VnExpress, Báo Văn hóa (hiện trạng rừng); Báo Pháp luật, VnEconomy (đê điều, thủy lợi); VnEconomy, Đại biểu Nhân dân (giảm nghèo). Phân bổ theo xã, theo tháng là giả lập.').paragraph_format.keep_with_next = True
table([
    ['Lĩnh vực', 'Số liệu công bố', 'Số giả lập'],
    ['Nông thôn mới', 'Bộ tiêu chí 2021–2025: 382/382 xã (trước sắp xếp) đạt chuẩn (số lịch sử). Bộ tiêu chí 2026–2030 (QĐ 51/2025/QĐ-TTg, 10 tiêu chí, hiệu lực 15/02/2026) bỏ mức nâng cao, kiểu mẫu; Hà Nội dự kiến hoàn tất hồ sơ công nhận 3 xã trong năm 2026, mục tiêu 2030: 80% xã đạt chuẩn, 20% đạt chuẩn hiện đại', f'Quý III/2026: {S["ntm"]["muc26"][0]} xã được công nhận theo bộ mới; {S["ntm"]["hoSo"]} xã đủ 10/10 tiêu chí đang hoàn thiện hồ sơ; {S["ntm"]["muc26"][2]} xã chưa đạt, bình quân {n(S["ntm"]["tcTb"], 1)}/10 tiêu chí'],
    ['Rừng', '18.342 ha rừng (tự nhiên 7.593 ha, trồng 10.749 ha), chủ yếu ở Ba Vì, Mỹ Đức, Sóc Sơn, Thạch Thất (QĐ 1083/QĐ-UBND ngày 27/02/2025)', f'Thiệt hại {n(S["rungTh"]["ha"], 1)} ha; trồng mới {n(S["rungTm"]["ha"], 1)}/{S["rungTm"]["kh"]} ha; chỉ ở các xã có rừng'],
    ['Vốn nông thôn mới', '2021 – 2025 huy động khoảng 86.800 tỷ đồng; Hà Nội tự cân đối ngân sách (không có NSTW)', f'Giải ngân 9 tháng 2026 {ty(S["ntmVon"]["gn"], 0)} tỷ đồng, không có NSTW'],
    ['Giảm nghèo', 'Từ 1/7/2025: 126/126 xã, phường không còn hộ nghèo; 9.928 hộ cận nghèo theo chuẩn Thành phố; 43 đơn vị hết cả hộ cận nghèo', f'{S["gnVon"]["db"]} phường/xã thực hiện; giải ngân 9 tháng {ty(S["gnVon"]["gn"], 0)} tỷ đồng'],
    ['Phòng chống thiên tai', 'Trên 626 km đê; 89 hồ chứa; hàng chục điểm úng ngập; không có thủy điện', f'{S["pctt"]["loai"][0]} hồ, {n(S["pctt"]["km"], 1)} km đê, {S["pctt"]["loai"][3]} điểm sạt lở, {S["pctt"]["loai"][4]} điểm úng ngập, 0 thủy điện'],
    ['Hỗ trợ lương thực', 'Hà Nội không còn tình trạng giáp hạt; hỗ trợ chủ yếu khi mưa lũ, hỏa hoạn', f'{n(S["hoTro"]["nguoi"])} lượt người, {n(S["hoTro"]["gaoTan"], 1)} tấn gạo; giáp hạt = 0'],
], [3.0, 7.0, 6.0], size=10)

# ======================================================= PHẦN II
k.page_break()
heading('PHẦN II. CHI TIẾT 10 CHỈ TIÊU', 1)
SHOW_NOTE_BOX = False  # khối "Lưu ý, đề nghị Sở xác nhận" cuối mỗi chỉ tiêu — ẩn theo yêu cầu 14/10/2026; nội dung vẫn gom vào Phần IV
note('Mỗi chỉ tiêu: (1) Thông tin chung · (2) Thẻ số · (3) Biểu đồ' + (' · (4) Lưu ý, đề nghị Sở xác nhận' if SHOW_NOTE_BOX else '') + '. Các trường dùng chung giải thích ở Phần I, mục 2, 3.')
ALL_NOTES = []
def notes(ct, items):
    if SHOW_NOTE_BOX: box(['• ' + x for x in items], k.NOTE_FILL, 'Lưu ý, đề nghị Sở xác nhận', 12)
    ALL_NOTES.extend((ct, x) for x in items)
def chi_tieu(i, info, kpi, charts, nts):
    c = CT[i]
    heading(f'Chỉ tiêu {i + 1}. {c["name"]}', 2)
    table([['Eform nguồn', c['eform']], ['Kỳ hiển thị', c['ky']], ['"Giá trị" là', Y[i][3]], ['«Phân tổ/loại dữ liệu»', Y[i][2]]] + info,
          [4.0, 12.0], header=False, size=11, key_col=True, keep=True)
    heading(f'{i + 1}.1. Thẻ số', 3)
    table([['Thẻ số', 'Cách tính', 'Kết quả (giả lập)']] + kpi, [3.8, 8.0, 4.2], size=10.5, keep=True)
    heading(f'{i + 1}.2. Biểu đồ', 3)
    table([['Biểu đồ', 'Loại', 'Cách tính', 'Ví dụ (giả lập)']] + charts, [3.6, 2.6, 5.4, 4.4], size=10)
    notes(str(i + 1), nts)
    k.page_break()

R = S['ntm']; xc = X['ntmXa']
chi_tieu(0, [['Một bản ghi là', 'Một xã (75 xã) trong quý; 51 phường gửi bản "Không phát sinh"']],
    [['Xã đạt chuẩn nông thôn mới (2026–2030)', 'ĐẾM(mức = Đạt chuẩn)', str(R['muc26'][0])],
     ['Xã đạt chuẩn nông thôn mới hiện đại', 'ĐẾM(mức = Nông thôn mới hiện đại)', str(R['muc26'][1])],
     ['Xã đủ 10/10 tiêu chí, đang hoàn thiện hồ sơ', 'ĐẾM(xã chưa được công nhận có «Giá trị kỳ này» = 10)', str(R['hoSo'])],
     ['Xã chưa đạt chuẩn', 'ĐẾM(mức = Chưa đạt chuẩn)', str(R['muc26'][2])],
     ['Số tiêu chí bình quân đã đạt', 'Trung bình «Giá trị kỳ này» của các xã', n(R['tcTb'], 1) + '/10']],
    [['Xã theo mức đạt chuẩn (bộ tiêu chí 2026–2030)', 'Thanh xếp chồng', 'ĐẾM xã theo 3 mức Đạt chuẩn / Nông thôn mới hiện đại / Chưa đạt chuẩn', ' · '.join(f'{L["MUC26"][j]} {R["muc26"][j]}' for j in range(3))],
     ['Xã chưa đạt chuẩn theo số tiêu chí đã đạt (trên 10)', 'Cột', 'ĐẾM xã chưa đạt theo «Giá trị kỳ này» (0 → 10; ngoài khoảng thì gắn cờ)', ' · '.join(f'{r[0]}: {r[1]}' for r in R['tc10'])]],
    ['Căn cứ: Quyết định 51/2025/QĐ-TTg (bộ tiêu chí quốc gia về nông thôn mới 2026–2030, 10 tiêu chí, hiệu lực từ 15/02/2026) không còn mức "nâng cao", "kiểu mẫu". Kết quả theo bộ tiêu chí 2021–2025 giữ làm số lịch sử, chỉ hiện khi xem kỳ trước 15/02/2026 (bản trả lời BA ngày 10/10/2026, mục 23, 24).',
     '«Phân tổ/loại dữ liệu» đang là Chữ; IOC gom về 3 mức Đạt chuẩn / Nông thôn mới hiện đại / Chưa đạt chuẩn (so theo thứ tự: "hiện đại" → Hiện đại; "chưa đạt", "chưa công nhận" → Chưa đạt; "đạt chuẩn", "nông thôn mới" → Đạt chuẩn). Mức "nâng cao", "kiểu mẫu" nhập ở kỳ 2026 bị gắn cờ "mức không còn áp dụng", không xếp. Đề nghị đổi sang Danh mục.',
     'Sau sắp xếp còn 75 xã; từ 2026 Chương trình nông thôn mới được gộp với giảm nghèo và phát triển vùng DTTS (Nghị quyết 257/2025/QH15). IOC dùng bộ tiêu chí 2026–2030 (10 tiêu chí) từ Quý I/2026; đề nghị Sở xác nhận Hà Nội có ban hành thêm mức riêng hay không.',
     'Tên eform là "Tỷ lệ xã…" nhưng không có trường mức đạt chuẩn riêng; đề nghị thêm «Mức đạt chuẩn» (Danh mục) và «Số tiêu chí đạt» (Số).'])

R = S['rungTh']
chi_tieu(1, [['Một bản ghi là', 'Một vụ việc rừng bị thiệt hại (cháy, chặt phá, nguyên nhân khác) ở một xã']],
    [['Diện tích bị thiệt hại', 'TỔNG(«Giá trị kỳ này») 9 tháng; so với «Cùng kỳ/chuẩn so sánh»', f'{n(R["ha"], 1)} ha ({so(R["ha"], R["cungKy"])})'],
     ['Số vụ', 'ĐẾM bản ghi (bỏ "Không phát sinh")', str(R['n'])],
     ['Bị cháy; Bị chặt phá', 'TỔNG theo «Phân tổ»', f'{n(R["nnHa"][0], 1)} ha; {n(R["nnHa"][1], 1)} ha'],
     ['Vụ chưa xử lý xong', 'ĐẾM(«Trạng thái triển khai» ≠ Hoàn thành)', str(R['canXuLy'])]],
    [['Theo nguyên nhân', 'Tròn (ha)', 'TỔNG ha theo «Phân tổ»', ' · '.join(f'{L["TH"][j]} {n(R["nnHa"][j], 1)}' for j in range(3))],
     ['Theo tháng', 'Cột chồng (ha)', 'TỔNG ha theo «Tháng» và «Phân tổ»', 'Cháy tập trung tháng 1 – 4'],
     ['Theo địa bàn', 'Cột ngang (ha)', 'TỔNG ha theo «Địa bàn»', ' · '.join(f'{r[0]} {n(r[1], 2)}' for r in R['top'][:3])]],
    ['Đề nghị thêm trường «Ngày xảy ra» để theo dõi mùa cháy rừng và thời gian xử lý; hiện chỉ có tháng của kỳ báo cáo.',
     'Mã trường «Kế hoạch/chuẩn tham chiếu» của eform này đang là "assignees" (khác 9 eform còn lại), có vẻ nhập nhầm.'])

R = S['rungTm']
chi_tieu(2, [['Một bản ghi là', 'Kết quả trồng rừng trong tháng của một dự án, khu trồng ở một xã']],
    [['Rừng trồng mới tập trung', 'TỔNG(«Giá trị lũy kế») các loại rừng; so cùng kỳ', f'{n(R["ha"], 1)} ha ({so(R["ha"], R["cungKy"])})'],
     ['Theo loại rừng', 'TỔNG theo «Phân tổ»', ' · '.join(f'{L["LR"][j]} {n(R["loaiHa"][j], 1)}' for j in range(3))],
     ['Cây phân tán', 'TỔNG bản ghi «Phân tổ» = Cây phân tán (cây)', f'{n(R["cayPt"]["luyKe"])} cây']],
    [['Lũy kế theo tháng', 'Đường', 'Cộng dồn «Giá trị kỳ này» theo tháng (không vẽ kế hoạch: eform không có kế hoạch dạng số)', f'T9: {n(R["lkT"][8], 1)} ha'],
     ['Theo loại rừng', 'Thẻ cơ cấu', 'TỔNG «Giá trị lũy kế» theo «Phân tổ»', ' · '.join(f'{L["LR"][j]} {n(R["loaiHa"][j], 1)}' for j in range(3))],
     ['Theo địa bàn', 'Cột ngang (ha)', 'TỔNG ha theo «Địa bàn»', ' · '.join(f'{r[0]} {n(r[1], 1)}' for r in R['top'][:3])]],
    ['"Cây phân tán" tính bằng cây, khác đơn vị ha của rừng tập trung; đề nghị tách ra eform hoặc trường riêng.',
     '«Kế hoạch/chuẩn tham chiếu» là kiểu Chữ, không tính được; IOC **không hiện kế hoạch và tỷ lệ so kế hoạch** (phản hồi nhóm triển khai 13/10/2026). Nếu Sở cần, đề nghị thêm «Giá trị kế hoạch» kiểu Số.',
     'Mã giá trị danh mục "Rừng đặc dụng" đang là "rung_dac_trung" (sai chính tả), nên sửa thành "rung_dac_dung".'])

R = S['ntmVon']
chi_tieu(3, [['Một bản ghi là', 'Một dự án, nội dung của Chương trình ở một xã, theo một nguồn vốn, trong một tháng']],
    [['Giải ngân lũy kế', 'TỔNG(«Giá trị lũy kế»)', f'{ty(R["gn"])} tỷ đồng'],
     ['Giải ngân tháng 9', 'TỔNG(«Giá trị kỳ này»), tháng 9', f'{ty(R["gnKy"])} tỷ đồng'],
     ['So cùng kỳ', '(TỔNG lũy kế ÷ TỔNG «Cùng kỳ/chuẩn so sánh» − 1) × 100', so(R['gn'], R['cungKy'])],
     ['Dự án chậm, đình trệ, cần xử lý', 'ĐẾM dự án theo «Trạng thái triển khai» (khóa dự án: «Tên nội dung/dự án/sự kiện» + «Địa bàn», lấy bản mới nhất)', f'{R["tt"][3] + R["tt"][4] + R["tt"][5]}/{R["n"]}']],
    [['Giải ngân lũy kế theo tháng', 'Đường', 'Năm 2026 và cùng kỳ 2025 (không vẽ kế hoạch: eform không có kế hoạch dạng số)', f'T9: {ty(R["luyKeT"][8])} / {ty(R["cungKyT"][8])} tỷ'],
     ['Giải ngân theo nguồn vốn', 'Thẻ cơ cấu', 'TỔNG «Giá trị lũy kế» theo «Phân tổ» (nguồn vốn)', ' · '.join(f'{L["NG"][j]} {ty(R["nguon"][j], 0)}' for j in range(6) if R['nguon'][j])],
     ['Dự án theo trạng thái', 'Tròn', 'ĐẾM dự án (không đếm bản ghi) theo «Trạng thái triển khai»; một dự án nhiều nguồn vốn, nhiều tháng chỉ tính một lần', ' · '.join(f'{L["TT"][j]} {R["tt"][j]}' for j in range(6))],
     ['10 xã giải ngân nhiều nhất', 'Cột ngang', 'TỔNG lũy kế theo «Địa bàn»', ' · '.join(f'{r[0]} {ty(r[1])}' for r in R['top'][:3])]],
    ['«Kế hoạch/chuẩn tham chiếu» là Chữ nên không tính được; IOC **không hiện kế hoạch vốn và tỷ lệ giải ngân so kế hoạch**, biểu đồ nguồn vốn đổi sang giải ngân theo nguồn (phản hồi nhóm triển khai 13/10/2026). Nếu Sở cần, đề nghị thêm «Kế hoạch vốn năm» kiểu Số.',
     'Eform không có mã dự án; một bản ghi là dự án × nguồn vốn × tháng. IOC nhận dạng dự án bằng «Tên nội dung/dự án/sự kiện» + «Địa bàn» (gõ thống nhất qua các kỳ) để không đếm trùng.',
     'Hà Nội tự cân đối ngân sách, không nhận NSTW cho Chương trình; đề nghị tách "NSĐP" thành ngân sách Thành phố và ngân sách xã (vốn đối ứng).',
     'Từ 2026 ba chương trình mục tiêu quốc gia được gộp thành một (Nghị quyết 257/2025/QH15). Đề nghị xác nhận giữ 2 eform riêng (nông thôn mới, giảm nghèo) hay gộp.'])

R = S['gnVon']
chi_tieu(4, [['Một bản ghi là', 'Một nội dung, dự án hỗ trợ ở một phường/xã còn hộ cận nghèo, trong một tháng']],
    [['Giải ngân lũy kế', 'TỔNG(«Giá trị lũy kế»)', f'{ty(R["gn"])} tỷ đồng'],
     ['Phường/xã thực hiện', 'ĐẾM «Địa bàn» có bản ghi (bỏ "Không phát sinh")', str(R['db'])]],
    [['Giải ngân theo nội dung', 'Thẻ cơ cấu', 'TỔNG «Giá trị lũy kế» theo nội dung (gom từ «Phân tổ»); không vẽ kế hoạch', ' · '.join(f'{L["ND"][j]} {ty(R["nd"][j])}' for j in range(2))],
     ['Giải ngân lũy kế theo tháng', 'Đường', 'Cộng dồn theo tháng (không vẽ kế hoạch: eform không có kế hoạch dạng số)', f'T9: {ty(R["luyKeT"][8])} tỷ'],
     ['10 phường/xã giải ngân nhiều nhất', 'Cột ngang', 'TỔNG lũy kế theo «Địa bàn»', ' · '.join(f'{r[0]} {ty(r[1])}' for r in R['top'][:3])]],
    ['«Phân tổ/loại dữ liệu» của eform này là Chữ (các eform khác là Danh mục); IOC gom về 6 nội dung hỗ trợ. Đề nghị đổi sang Danh mục.',
     'Hà Nội không còn hộ nghèo; đề nghị bổ sung «Số hộ cận nghèo được hỗ trợ» để đo kết quả, không chỉ kinh phí.',
     'Mã trường của eform này khác các eform còn lại ("cum_tdp", "ten_noi_dung_du_an_s", "ke_hoach_chuan_tham" bị cắt); đề nghị thống nhất mã trường.'])

R = S['kttv']
chi_tieu(5, [['Một bản ghi là', 'Số bản tin, lượt số liệu của một loại trong một tháng, cả Thành phố']],
    [['Bản tin dự báo', 'TỔNG «Giá trị kỳ này», «Phân tổ» = Bản tin dự báo', f'{n(R["tong"][1])} ({so(R["tong"][1], R["cungKy"][1])})'],
     ['Cảnh báo thiên tai', 'TỔNG, «Phân tổ» = Cảnh báo thiên tai', f'{n(R["tong"][2])} ({so(R["tong"][2], R["cungKy"][2])})'],
     ['Lượt số liệu quan trắc', 'TỔNG, «Phân tổ» = Số liệu quan trắc', n(R['tong'][0])]],
    [['Bản tin dự báo và cảnh báo theo tháng', 'Cột', 'Theo «Tháng» và «Phân tổ»', 'Cảnh báo tăng mạnh tháng 7 – 9 (mùa mưa bão)'],
     ['Cảnh báo thiên tai: 2026 và cùng kỳ 2025', 'Đường', '«Giá trị kỳ này» và «Cùng kỳ/chuẩn so sánh» theo tháng', f'{R["tong"][2]} so với {R["cungKy"][2]}']],
    ['Ba loại trong «Phân tổ» có đơn vị khác nhau (lượt số liệu, bản tin); đề nghị ghi rõ đơn vị từng loại.',
     'Thông tin khí tượng thủy văn là số liệu toàn Thành phố, không theo phường/xã. Đề nghị cho chọn «Địa bàn» = Toàn Thành phố, hoặc ghi theo trạm quan trắc.'])

R = S['pctt']
chi_tieu(6, [['Một bản ghi là', 'Một công trình, điểm (hồ chứa, tuyến đê, điểm sạt lở, điểm úng ngập) với trạng thái tại tháng 9']],
    [['Hồ chứa thủy lợi', 'ĐẾM bản ghi «Phân tổ» = Hồ chứa thủy lợi', str(R['loai'][0])],
     ['Đê điều', 'TỔNG «Giá trị kỳ này» (km) của tuyến đê', f'{n(R["km"], 1)} km ({R["loai"][2]} tuyến)'],
     ['Điểm sạt lở; điểm úng ngập', 'ĐẾM theo «Phân tổ»', f'{R["loai"][3]}; {R["loai"][4]}'],
     ['Cần xử lý', 'ĐẾM(«Trạng thái triển khai» = Cần xử lý)', str(R['canXuLy'])]],
    [['Công trình, điểm theo loại và trạng thái', 'Cột ngang chồng', 'ĐẾM theo «Phân tổ» và «Trạng thái triển khai» (bỏ Thủy điện vì không có)', f'Sạt lở: {R["tt"][3][0]} đã xử lý, {R["tt"][3][1]} đang xử lý, {R["tt"][3][5]} cần xử lý'],
     ['Địa bàn nhiều điểm sạt lở, úng ngập', 'Cột ngang', 'ĐẾM điểm sạt lở, úng ngập theo «Địa bàn»', ' · '.join(f'{r[0]} {r[1]}' for r in R['topDiem'][:3])]],
    ['Hà Nội không có công trình thủy điện; đề nghị bỏ giá trị "Thủy điện" khỏi danh mục hoặc giữ cho đồng bộ cả nước.',
     '"Giá trị" của công trình chưa rõ (số lượng, dung tích hồ, chiều dài đê…). IOC tạm coi mỗi bản ghi là 1 công trình, riêng đê là km. Đề nghị ghi rõ.',
     'Đề nghị thêm «Mức độ nguy hiểm» (Danh mục) cho điểm sạt lở, úng ngập để ưu tiên xử lý.'])

R = S['hoTro']
chi_tieu(7, [['Một bản ghi là', 'Một đợt hỗ trợ lương thực ở một phường/xã']],
    [['Lượt người được hỗ trợ', 'TỔNG «Giá trị kỳ này» (số người) của các đợt trong kỳ, chống trùng theo đợt; so cùng kỳ', f'{n(R["nguoi"])} lượt người ({so(R["nguoi"], R["cungKy"]["nguoi"])})'],
     ['Do thiên tai', 'TỔNG, «Phân tổ» = Thiên tai', f'{n(R["ldNguoi"][0])} lượt người']],
    [['Theo lý do', 'Tròn', 'TỔNG lượt người theo «Phân tổ» (BA mục 35)', ' · '.join(f'{L["LD"][j]} {n(R["ldNguoi"][j])}' for j in range(4))],
     ['Theo tháng', 'Cột', 'TỔNG lượt người theo «Tháng» của kỳ báo cáo (eform không có ngày bắt đầu đợt; trên IOC ghi "theo tháng báo cáo")', f'Tháng 7: {n(R["thangNguoi"][6])} lượt người (mưa lớn gây ngập)'],
     ['Theo địa bàn', 'Bảng', 'TỔNG lượt người theo «Địa bàn»', ' · '.join(f'{r[0]} {n(r[1])}' for r in R['topNguoi'][:3])]],
    ['«Giá trị» là số người (nhân khẩu) được hỗ trợ, không trộn với số hộ, vì định mức hỗ trợ lương thực tính theo người (15 kg gạo/người/tháng, Nghị định 20/2021/NĐ-CP). Một người nhận nhiều đợt thì tính nhiều lần, nên đơn vị là "lượt người" (bản trả lời BA, mục 35 – 37).',
     'Tên eform là "Số hộ/người" nhưng chỉ có một trường giá trị (số người), nên IOC **không hiện số hộ** (phản hồi nhóm triển khai 13/10/2026). Nếu Sở cần, đề nghị thêm trường «Số hộ» riêng.',
     'Eform không có ngày bắt đầu đợt hỗ trợ, nên biểu đồ theo tháng xếp theo «Tháng» của kỳ báo cáo và ghi rõ "theo tháng báo cáo" (thay quy ước "tính vào tháng bắt đầu đợt" của bản trả lời BA mục 36). Áp dụng cả cho gạo hỗ trợ theo tháng.',
     'Hà Nội không còn tình trạng giáp hạt; giá trị "Giáp hạt" gần như không dùng.'])

chi_tieu(8, [['Một bản ghi là', 'Số gạo của một đợt hỗ trợ ở một phường/xã']],
    [['Tổng số gạo hỗ trợ', 'TỔNG «Giá trị lũy kế» (kg) ÷ 1.000, ra tấn; so cùng kỳ', f'{n(R["gaoTan"], 1)} tấn ({so(R["gaoTan"], R["cungKy"]["gaoTan"])})'],
     ['Bình quân mỗi lượt người', 'Tổng gạo (kg) ÷ tổng lượt người được hỗ trợ (chỉ tiêu 8)', f'{n(R["gaoTan"] * 1000 / R["nguoi"], 1)} kg'],
     ['Xuất dự trữ, khẩn cấp', 'TỔNG, «Phân tổ» = Dự trữ/khẩn cấp', '0 tấn']],
    [['Theo lý do', 'Tròn (tấn)', 'TỔNG theo «Phân tổ»', ' · '.join(f'{L["LD"][j]} {n(R["ldGao"][j], 1)}' for j in range(4))],
     ['Theo tháng', 'Cột (tấn)', 'TỔNG theo «Tháng» của kỳ báo cáo (eform không có ngày bắt đầu đợt)', f'Tháng 7: {n(R["thangGao"][6], 1)} tấn']],
    ['«Giá trị» của eform gạo nhập bằng kg (đã chốt theo bản trả lời BA, mục 38 – 39); mọi thẻ số, biểu đồ trên IOC hiển thị tấn.',
     'Eform gạo và eform hộ được hỗ trợ cùng mô tả một đợt hỗ trợ; đề nghị gộp thành một eform có 3 trường: số hộ, số người, số gạo (kg).',
     'IOC giả lập mức 15 kg gạo/người/tháng; đề nghị xác nhận định mức Thành phố áp dụng.'])

R = S['banDo']
chi_tieu(9, [['Một bản ghi là', 'Một sản phẩm bản đồ, cảnh ảnh vệ tinh hoặc lớp dữ liệu GIS']],
    [['Sản phẩm', 'ĐẾM sản phẩm 9 tháng (khóa: «Tên nội dung/dự án/sự kiện» + «Phân tổ», báo lại nhiều tháng chỉ tính một lần); so cùng kỳ', f'{R["n"]} ({so(R["n"], R["cungKy"])})'],
     ['Hoàn thành; Đang thực hiện', 'ĐẾM theo «Trạng thái triển khai»', f'{R["tt"][0]}; {R["tt"][1]}']],
    [['Theo loại', 'Cột ngang', 'ĐẾM theo «Phân tổ»', ' · '.join(f'{L["BD"][j]} {R["loai"][j]}' for j in range(5))],
     ['Theo trạng thái', 'Tròn', 'ĐẾM theo «Trạng thái triển khai»', ' · '.join(f'{L["TT"][j]} {R["tt"][j]}' for j in range(3))]],
    ['Ảnh vệ tinh, lớp GIS là sản phẩm toàn Thành phố, đang phải ghi một «Địa bàn» (IOC ghi Phường Láng, nơi đặt trụ sở Sở). Đề nghị cho chọn "Toàn Thành phố".',
     'Đề nghị thêm «Đường dẫn dữ liệu» để IOC mở được bản đồ, lớp GIS ngay trên bản đồ điều hành.'])

# ======================================================= PHẦN III, IV, PHỤ LỤC
heading('PHẦN III. BẢNG 126 PHƯỜNG/XÃ', 1)
para('Ô bên phải của form là bảng đủ 126 phường/xã. Các cột lấy theo «Địa bàn» của từng eform; "—" là không phát sinh.')
table([['Cột', 'Chỉ tiêu', 'Dòng đầu'],
       ['Nông thôn mới (mức đạt chuẩn theo bộ tiêu chí 2026–2030)', '1', f'{S["ntm"]["hoSo"]} xã đủ 10/10 tiêu chí, đang hoàn thiện hồ sơ'],
       ['Rừng bị thiệt hại (ha)', '2', n(S['rungTh']['ha'], 1)], ['Rừng trồng mới (ha)', '3', n(S['rungTm']['ha'], 1)],
       ['Vốn nông thôn mới đã giải ngân (tỷ đồng)', '4', ty(S['ntmVon']['gn'])], ['Vốn giảm nghèo đã giải ngân (tỷ đồng)', '5', ty(S['gnVon']['gn'])],
       ['Điểm sạt lở, úng ngập', '7', str(S['pctt']['loai'][3] + S['pctt']['loai'][4])], ['Lượt người được hỗ trợ lương thực', '8', n(S['hoTro']['nguoi'])]],
      [8.0, 2.0, 6.0], size=10.5)
k.page_break()
heading('PHẦN IV. TỔNG HỢP ĐỀ NGHỊ SỞ XÁC NHẬN', 1)
chung = ['Cả 10 eform không có trường đơn vị tính; IOC quy ước đơn vị như Phần I, mục 2. Đề nghị thêm «Đơn vị tính» hoặc cố định đơn vị cho từng eform.',
         '«Kế hoạch/chuẩn tham chiếu» đang là Chữ nên không tính được tỷ lệ so với kế hoạch; đề nghị thêm «Giá trị kế hoạch» kiểu Số.',
         'Dữ liệu mẫu các eform lấy năm 2023 – 2025 và các giá trị chênh nhau 0,1 (567,2 / 567,3 / 567,4…), chưa dùng thử được; đề nghị bổ sung dữ liệu mẫu thực tế.']
ALL_NOTES[:0] = [('Chung', x) for x in chung]
para('Gom các đề nghị chung và của 10 chỉ tiêu. Cột "Kết quả" để trống cho Sở ghi ý kiến.')
table([['#', 'Chỉ tiêu', 'Nội dung', 'Kết quả']] + [[str(i + 1), c, x, ''] for i, (c, x) in enumerate(ALL_NOTES)], [0.8, 1.6, 10.6, 3.0], size=10.5)
k.page_break()
ctm_section(heading, para, lambda rows, w: table(rows, w, size=10), 'ubnd-nnmt',
            'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=['Theo phản hồi nhóm triển khai 13/10/2026: ẩn kế hoạch trồng rừng, kế hoạch vốn nông thôn mới, giảm nghèo và các tỷ lệ so kế hoạch («Kế hoạch/chuẩn tham chiếu» là trường Chữ); ẩn số hộ được hỗ trợ (eform chỉ có số người); biểu đồ hỗ trợ lương thực theo tháng ghi "theo tháng báo cáo".', 'Nông thôn mới theo **bộ tiêu chí 2026–2030** (QĐ 51/2025/QĐ-TTg): 3 mức Đạt chuẩn / Nông thôn mới hiện đại / Chưa đạt chuẩn, số tiêu chí trên 10; không còn mức nâng cao, kiểu mẫu (BA mục 23, 24).', 'Diện tích rừng bị thiệt hại, rừng trồng mới ghi **1 số lẻ** (trước: 2 số lẻ).', '**Kế hoạch vốn** (nông thôn mới, giảm nghèo) và **kế hoạch trồng rừng** là mốc/vạch kế hoạch, không phải thanh ngang hàng với số thực hiện.', 'Gạo hỗ trợ **nhập kg, hiển thị tấn** (BA mục 38, 39).', 'Hỗ trợ lương thực tính theo **lượt người** (số chính, so cùng kỳ), thêm biểu đồ theo tháng và bảng theo địa bàn; số hộ chỉ để tham khảo (BA mục 35 – 37).', 'Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
k.page_break()
k.page_break()
heading('PHỤ LỤC. KHUÔN TRƯỜNG VÀ DANH SÁCH 10 EFORM', 1)
para('Trích nguyên từ file mô tả đầu vào eform, sheet "Sở NNMT". Khuôn 18 trường (theo eform đầu tiên):')
table([['#', 'Tên trường', 'Mã trường', 'Kiểu nhập']] + [[str(j + 1), f[0], f[1], f[2] or '(chưa ghi)'] for j, f in enumerate(EF[0]['fields'])], [0.8, 6.6, 6.4, 2.2], size=10, mono_col=2)
para('Danh sách 10 eform:')
table([['#', 'Tên eform', 'Kiểu «Phân tổ/loại dữ liệu»']] + [[str(i + 1), e['eform'], next((f[2] for f in e['fields'] if f[0] == 'Phân tổ/loại dữ liệu'), '')] for i, e in enumerate(EF)], [0.8, 11.6, 3.6], size=10.5)
print('đề nghị:', len(ALL_NOTES))
for p in k.save(OUT): print('ok', p)
