# -*- coding: utf-8 -*-
"""Sinh docs/SCT_SoCongThuong/SCT_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 5 chỉ tiêu theo 5 eform của Sở Công Thương trên IOC.
Chạy từ thư mục gốc ioc:  python tools/sct_doc_docx.py
Lời văn viết tay; CÁC CON SỐ đọc thẳng từ js/core/sct-config.js (qua node). Tên trường đúng như file mô tả đầu vào eform
(tools/sct-fields.json, sheet "Sở Công thương"). Word + Markdown qua tools/doc_kit.py. Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EF = json.load(open(os.path.join(ROOT, 'tools', 'sct-fields.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'docs', 'SCT_SoCongThuong', 'SCT_MO_TA_CHI_TIEU.docx')
_JS = ("const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
       "vm.runInContext(fs.readFileSync('js/core/sct-config.js','utf8')+';this.S=SCT_SUM;this.CT=SCT_CT;"
       "this.L={TT:SCT_THI_TRUONG,NX:SCT_NGANH_XK,LH:SCT_LH,TM:SCT_TMDT,ND:SCT_TMDT_ND,LHDV:SCT_LHDV,NG:SCT_NGANH};',c);"
       "process.stdout.write(JSON.stringify({S:c.S,CT:c.CT,L:c.L}));")
_J = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))
S, CT, L = _J['S'], _J['CT'], _J['L']


def n(x, d=0):
    s = f'{abs(x):,.{d}f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return ('−' if x < 0 else '') + s
def pc(a, b, d=1): return n(a / b * 100, d) + '%'
def so(a, b): v = (a / b - 1) * 100; return ('+' if v >= 0 else '') + n(v, 1) + '%'


X, B, T, N, I = S['xnk'], S['bl'], S['tmdt'], S['nl'], S['iip']
k = Kit('Sở Công Thương · Mô tả chỉ tiêu trên IOC')
para, table, box, heading, note = k.para, k.table, k.box, k.heading, k.note

k.blank(5)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(4)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY)
para('SỞ CÔNG THƯƠNG HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('Biểu đồ, trường dữ liệu và cách tính số liệu của 5 chỉ tiêu trên IOC', 14, CENTER, 4, italic=True, color=GREY)
para('xây dựng từ 5 eform nhập liệu của Sở', 14, CENTER, 0, italic=True, color=GREY)
k.blank(5)
table([['Đơn vị', 'Sở Công Thương Thành phố Hà Nội'],
       ['Nguồn dữ liệu', f'File mô tả đầu vào eform, sheet "Sở Công thương": 5 eform, {sum(len(e["fields"]) for e in EF)} trường nhập'],
       ['Phạm vi', '5 chỉ tiêu, 17 biểu đồ, bảng 126 phường/xã'],
       ['Số liệu ví dụ', 'Số giả lập đặt theo bậc độ lớn số liệu đã công bố, 9 tháng năm 2026'],
       ['Phiên bản', '1.2 · ngày 13/10/2026 (theo phản hồi nhóm triển khai khi nối eform thật: thêm quy ước xử lý dữ liệu eform — khóa bản ghi, cách lấy theo kỳ, chỉ hiện số có trường trong eform)']], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()
k.toc()
k.page_break()

heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Mục đích tài liệu', 2)
para('Tài liệu mô tả cách IOC dựng 5 chỉ tiêu của Sở Công Thương từ 5 eform: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào, mỗi con số được tính ra sao. Trên giao diện, mỗi chỉ tiêu chỉ gồm **thẻ số tổng hợp** và **biểu đồ**; cách tính chỉ trình bày trong tài liệu này. Bộ chỉ tiêu cũ (STT 15, 16, 25: xăng dầu, than, thương mại điện tử) đã được thay bằng bộ này và đã xóa khỏi IOC.')
heading('2. Năm eform, năm chỉ tiêu', 2)
table([['#', 'Chỉ tiêu trên IOC', 'Một bản ghi là']] + [[str(i + 1), c['name'], r] for i, (c, r) in enumerate(zip(CT, [
    'Kim ngạch xuất khẩu, nhập khẩu của một doanh nghiệp trong một kỳ', 'Doanh thu bán lẻ, dịch vụ của một cơ sở kinh doanh trong một kỳ',
    'Số đối tượng và số đối tượng đạt của một nhóm đối tượng ở một phường/xã', 'Sản lượng một mặt hàng (điện, xăng dầu, than) của một đơn vị cung ứng trong một kỳ',
    'Giá trị sản xuất của một doanh nghiệp công nghiệp trong một kỳ']))], [0.8, 6.4, 8.8], size=10.5)
para('Hai trường «Mã chỉ tiêu con (CĐS)» và «Mã chỉ tiêu QĐ4795» là mã kỹ thuật; **IOC không hiện mã trên giao diện**, chỉ ghi tên chỉ tiêu bằng lời.')
heading('3. Kỳ báo cáo và nguyên tắc tính', 2)
k.bullets(['Kỳ hiển thị mặc định: **9 tháng năm 2026**, cộng các bản ghi tháng 1 – 9; riêng thương mại điện tử lấy bản ghi **tháng 9/2026** (số tại thời điểm).',
           'Các trường tổng, tỷ lệ, tốc độ tăng do đơn vị tự tính («Tổng kim ngạch XNK», «Tổng mức bán lẻ & DV tiêu dùng», «Tốc độ tăng so với kỳ trước», «Tỷ lệ đạt», «Chỉ số IIP so với kỳ trước») **không được IOC dùng**; IOC tự cộng, tự chia từ các trường gốc.',
           'So cùng kỳ = (số kỳ này ÷ số cùng kỳ năm trước − 1) × 100, lấy từ bản ghi cùng kỳ năm 2025 trên eform.'])
heading('4. Căn cứ đặt số giả lập', 2)
note('Nguồn: Đại biểu Nhân dân, Thời báo Tài chính (xuất nhập khẩu, bán lẻ 2025); Nông nghiệp và Môi trường (chỉ số sản xuất công nghiệp); Bộ Công Thương, VCCI (điện); Thời báo Tài chính (xăng dầu); VnEconomy (thương mại điện tử).').paragraph_format.keep_with_next = True
table([['Số liệu công bố', 'Giá trị', 'Số giả lập 9 tháng 2026'],
       ['Xuất khẩu, nhập khẩu năm 2025', '20,65 tỷ USD (+7,8%); 47,12 tỷ USD (+12,7%)', f'{n(X["xk"] / 1000, 2)} tỷ USD ({so(X["xk"], X["xkCk"])}); {n(X["nk"] / 1000, 2)} tỷ USD ({so(X["nk"], X["nkCk"])})'],
       ['Tổng mức bán lẻ và dịch vụ 8 tháng 2025', '615,7 nghìn tỷ đồng (+12,6%)', f'{n(B["tong"] / 1000, 1)} nghìn tỷ đồng ({so(B["tong"], B["ck"])})'],
       ['Chỉ số sản xuất công nghiệp 10 tháng 2025', 'Tăng 6,9%', f'{n(I["chung"], 1)}% so cùng kỳ'],
       ['Điện năng', 'Bình quân hơn 67 triệu kWh/ngày', f'{n(N["dien"])} triệu kWh ({n(N["dien"] / 273, 1)} triệu kWh/ngày)'],
       ['Xăng dầu', 'Khoảng 146.500 m³/tháng', f'{n(N["xangDau"])} nghìn m³ ({n(N["xangDau"] / 9, 1)} nghìn m³/tháng)'],
       ['Thương mại điện tử', 'Mục tiêu B2C chiếm 13% tổng mức bán lẻ; 55% người dân mua sắm trực tuyến', f'Bán hàng qua mạng {pc(B["tmdtB2c"], B["tong"])} tổng mức'],
       ['Than', 'Chưa tìm được số công bố của Hà Nội', f'{n(N["than"])} nghìn tấn (giả lập, cần Sở cung cấp)']], [4.6, 5.6, 5.8], size=10)

k.page_break()
heading('PHẦN II. CHI TIẾT 5 CHỈ TIÊU', 1)
ALL_NOTES = []
SHOW_NOTE_BOX = False  # khối "Lưu ý, đề nghị Sở xác nhận" cuối mỗi chỉ tiêu — ẩn theo yêu cầu 14/10/2026; nội dung vẫn gom vào bảng tổng hợp đề nghị
def chi_tieu(i, info, fields, kpi, charts, nts):
    c = CT[i]
    heading(f'Chỉ tiêu {i + 1}. {c["name"]}', 2)
    table([['Eform nguồn', c['eform']], ['Kỳ hiển thị', c['ky']]] + info, [4.0, 12.0], header=False, size=11, key_col=True, keep=True)
    heading(f'{i + 1}.1. Trường dữ liệu sử dụng', 3)
    table([['Tên trường (đúng như eform)', 'Vai trò', 'Dùng để']] + fields, [6.4, 2.2, 7.4], size=10)
    heading(f'{i + 1}.2. Thẻ số', 3)
    table([['Thẻ số', 'Cách tính', 'Kết quả (giả lập)']] + kpi, [3.8, 8.0, 4.2], size=10.5, keep=True)
    heading(f'{i + 1}.3. Biểu đồ', 3)
    table([['Biểu đồ', 'Loại', 'Cách tính', 'Ví dụ (giả lập)']] + charts, [3.6, 2.4, 5.6, 4.4], size=10)
    if SHOW_NOTE_BOX: box(['• ' + x for x in nts], k.NOTE_FILL, 'Lưu ý, đề nghị Sở xác nhận', 12)
    ALL_NOTES.extend((str(i + 1), x) for x in nts)
    k.page_break()
KY = ['Kỳ báo cáo, Năm, Quý, Tháng', 'Lọc kỳ', 'Chọn bản ghi tháng 1 – 9 năm 2026 (và cùng kỳ 2025)']
DB = ['Địa bàn', 'Nhóm', 'Phường/xã nơi đặt trụ sở; bảng 126 phường/xã, biểu đồ 10 phường/xã']

chi_tieu(0, [['Đơn vị', 'Triệu USD (eform ghi "USD", xem lưu ý)']],
    [KY, DB, ['Kim ngạch xuất khẩu (USD), Kim ngạch nhập khẩu (USD)', 'Cộng', 'Thẻ số, mọi biểu đồ'],
     ['Thị trường chính', 'Nhóm (gom từ chữ)', 'Biểu đồ theo thị trường'], ['Ngành hàng/Mặt hàng', 'Nhóm (gom từ chữ)', 'Cơ cấu xuất khẩu theo ngành hàng'],
     ['Loại hình hoạt động', 'Điều kiện', 'Xuất khẩu / Nhập khẩu / Cả hai'], ['Tổng kim ngạch XNK (USD)', 'Không dùng', 'IOC tự cộng xuất khẩu + nhập khẩu'],
     ['Tên doanh nghiệp/đơn vị XNK, Loại hình doanh nghiệp, Ghi chú', 'Không dùng', 'Chỉ để xem chi tiết']],
    [['Kim ngạch xuất khẩu', 'TỔNG(«Kim ngạch xuất khẩu (USD)») 9 tháng; so cùng kỳ', f'{n(X["xk"] / 1000, 2)} tỷ USD ({so(X["xk"], X["xkCk"])})'],
     ['Kim ngạch nhập khẩu', 'TỔNG(«Kim ngạch nhập khẩu (USD)»)', f'{n(X["nk"] / 1000, 2)} tỷ USD ({so(X["nk"], X["nkCk"])})'],
     ['Tổng kim ngạch; Nhập siêu', 'Xuất khẩu + nhập khẩu; nhập khẩu − xuất khẩu', f'{n((X["xk"] + X["nk"]) / 1000, 2)}; {n((X["nk"] - X["xk"]) / 1000, 2)} tỷ USD'],
     ['Doanh nghiệp báo cáo', 'ĐẾM doanh nghiệp có bản ghi', n(X['soDn'])]],
    [['Theo tháng', 'Cột, 2 cột mỗi tháng', 'TỔNG xuất khẩu, nhập khẩu theo «Tháng»', f'T9: {n(X["xkT"][8])} / {n(X["nkT"][8])} triệu USD'],
     ['Theo thị trường', 'Cột ngang, 2 cột', 'TỔNG theo «Thị trường chính» đã gom', ' · '.join(f'{L["TT"][j][0]} {n(X["ttXk"][j])}/{n(X["ttNk"][j])}' for j in range(2))],
     ['Cơ cấu xuất khẩu theo ngành hàng', 'Tròn', 'TỔNG xuất khẩu theo «Ngành hàng/Mặt hàng» đã gom', ' · '.join(f'{L["NX"][j][0]} {n(X["nganh"][j])}' for j in range(2))],
     ['10 phường/xã lớn nhất', 'Cột ngang chồng', 'TỔNG theo «Địa bàn»', ' · '.join(f'{r[0]} {n(r[1])}' for r in X['top'][:3])]],
    ['«Thị trường chính», «Ngành hàng/Mặt hàng», «Loại hình doanh nghiệp» đang là Chữ; IOC gom về các nhóm ở biểu đồ. Đề nghị đổi sang Danh mục.',
     'Doanh nghiệp "Cả hai" chỉ khai được một «Thị trường chính», không tách được thị trường xuất khẩu và nhập khẩu. Đề nghị thêm «Thị trường xuất khẩu chính», «Thị trường nhập khẩu chính».',
     'Đơn vị ghi "USD" nhưng dữ liệu mẫu là 32,5 – 33,5; đề nghị xác nhận nhập theo USD hay triệu USD. Dữ liệu mẫu tổng (32,6) không bằng xuất khẩu + nhập khẩu (66,0).',
     'Số xuất nhập khẩu chính thức của Thành phố do cơ quan hải quan, thống kê công bố; eform do doanh nghiệp tự khai sẽ không đủ. Đề nghị xác nhận mục đích của eform (theo dõi doanh nghiệp trọng điểm hay thay số chính thức).'])

chi_tieu(1, [['Đơn vị', 'Tỷ đồng (eform ghi "đồng")']],
    [KY, DB, ['Doanh thu bán lẻ hàng hóa (đồng), Doanh thu dịch vụ (đồng)', 'Cộng', 'Thẻ số, mọi biểu đồ'],
     ['Loại hình kinh doanh', 'Nhóm (gom từ chữ)', 'Biểu đồ theo loại hình'], ['Doanh thu kỳ trước liền kề (đồng)', 'Cộng', 'Tính tốc độ tăng so với kỳ trước'],
     ['Tổng mức bán lẻ & DV tiêu dùng (đồng), Tốc độ tăng so với kỳ trước (%)', 'Không dùng', 'IOC tự tính'],
     ['Tên cơ sở/doanh nghiệp kinh doanh, Ngành hàng/Lĩnh vực dịch vụ chính, Ghi chú', 'Không dùng', 'Chỉ để xem chi tiết']],
    [['Tổng mức bán lẻ và dịch vụ', 'TỔNG(bán lẻ + dịch vụ) 9 tháng; so cùng kỳ', f'{n(B["tong"] / 1000, 1)} nghìn tỷ ({so(B["tong"], B["ck"])})'],
     ['Bán lẻ hàng hóa; Dịch vụ', 'TỔNG từng trường; tỷ trọng trong tổng mức', f'{n(B["banLe"] / 1000, 1)} ({pc(B["banLe"], B["tong"])}); {n(B["dichVu"] / 1000, 1)} nghìn tỷ'],
     ['Bán hàng qua mạng', 'TỔNG bán lẻ của loại hình "Bán hàng qua mạng" ÷ tổng mức', pc(B['tmdtB2c'], B['tong'])],
     ['Cơ sở báo cáo', 'ĐẾM cơ sở có bản ghi', n(B['soCs'])]],
    [['Theo tháng', 'Cột chồng', 'Bán lẻ, dịch vụ theo «Tháng»', f'T9: {n(B["tongT"][8])} tỷ đồng'],
     ['Theo loại hình kinh doanh', 'Cột ngang', 'TỔNG theo loại hình đã gom (xanh đậm: bán lẻ; xanh nhạt: dịch vụ)', ' · '.join(f'{L["LH"][j][0]} {n(B["lh"][j])}' for j in range(2))],
     ['10 phường/xã lớn nhất', 'Cột ngang', 'TỔNG theo «Địa bàn»', ' · '.join(f'{r[0]} {n(r[1])}' for r in B['top'][:3])]],
    ['Tổng mức bán lẻ hàng hóa và doanh thu dịch vụ tiêu dùng chính thức là số ước tính của cơ quan thống kê; cộng các cơ sở khai trên eform sẽ thấp hơn. Đề nghị xác nhận eform dùng để theo dõi cơ sở trọng điểm.',
     '«Loại hình kinh doanh» đang là Chữ; đề nghị đổi sang Danh mục (siêu thị, trung tâm thương mại, cửa hàng tiện lợi, chợ, bán hàng qua mạng, lưu trú – ăn uống, du lịch lữ hành, dịch vụ khác).',
     'Dữ liệu mẫu: tổng mức (99,5) không bằng bán lẻ + dịch vụ (198,7); đơn vị "đồng" với số 99,3 có vẻ đang nhập theo đơn vị lớn hơn. Đề nghị xác nhận đơn vị nhập.'])

chi_tieu(2, [['Đơn vị', 'Số đối tượng; tỷ lệ %'], ['Nội dung "đạt" của từng nhóm', '; '.join(f'{L["TM"][j][0]}: {L["ND"][j].lower()}' for j in range(6))]],
    [KY, DB, ['Đối tượng thống kê', 'Nhóm', 'Thẻ số, biểu đồ theo nhóm'], ['Tổng số đối tượng, Số đối tượng đạt', 'Cộng', 'Tỷ lệ đạt'],
     ['Mã chỉ tiêu con (CĐS)', 'Không dùng', 'Mã kỹ thuật, không hiện trên giao diện'], ['Tỷ lệ đạt (%)', 'Không dùng', 'IOC tự tính'],
     ['Nền tảng số/Hình thức áp dụng, Ghi chú', 'Không dùng', 'Chỉ để xem chi tiết']],
    [[L['TM'][j][0], 'TỔNG(«Số đối tượng đạt») ÷ TỔNG(«Tổng số đối tượng») × 100', pc(T['dat'][j], T['tong'][j])] for j in range(6)],
    [['Tỷ lệ đạt theo nhóm: phường và xã', 'Cột ngang, 2 cột', 'Tách phường/xã theo chữ đầu tên, cộng tử số và mẫu số rồi chia', f'Hộ kinh doanh: phường {n(T["tlPX"][2][0], 1)}%, xã {n(T["tlPX"][2][1], 1)}%'],
     ['10 phường/xã có tỷ lệ hộ kinh doanh bán hàng trực tuyến thấp nhất', 'Cột ngang', 'Tỷ lệ từng phường/xã, xếp tăng', ' · '.join(f'{r[0]} {n(r[1], 1)}%' for r in T['hkdThap'][:3])]],
    ['«Mã chỉ tiêu con (CĐS)» và «Đối tượng thống kê» đều có 6 giá trị; đề nghị xác nhận mỗi mã ứng với đúng một nhóm đối tượng, và "đạt" nghĩa là gì với từng nhóm (IOC ghi tạm như bảng thông tin ở trên).',
     'Nhóm "Người dân, đơn vị vận tải/logistics" gộp hai đối tượng rất khác nhau (người, đơn vị); đề nghị tách hai nhóm.',
     'Tổng số doanh nghiệp, hộ kinh doanh nên lấy từ cơ sở dữ liệu đăng ký kinh doanh thay vì phường/xã tự đếm mỗi tháng.'])

chi_tieu(3, [['Đơn vị', 'Điện: triệu kWh; xăng dầu: nghìn m³; than: nghìn tấn (quy đổi theo «Đơn vị tính»)']],
    [KY, DB, ['Loại mặt hàng', 'Nhóm', 'Tách điện năng / xăng dầu / than'], ['Sản lượng trong kỳ', 'Cộng', 'Thẻ số, mọi biểu đồ'],
     ['Đơn vị tính', 'Điều kiện', 'Quy đổi về một đơn vị cho mỗi mặt hàng (1 m³ = 1.000 lít)'], ['Loại hình đơn vị', 'Nhóm', 'Biểu đồ xăng dầu theo loại hình'],
     ['Mã chỉ tiêu QĐ4795', 'Không dùng', 'Mã kỹ thuật, không hiện trên giao diện'], ['Tên đơn vị cung ứng/kinh doanh, Ghi chú', 'Không dùng', 'Chỉ để xem chi tiết']],
    [['Điện năng tiêu thụ', 'TỔNG sản lượng «Loại mặt hàng» = Điện năng; so cùng kỳ', f'{n(N["dien"])} triệu kWh ({so(N["dien"], N["dienCk"])})'],
     ['Bình quân mỗi ngày', 'Điện năng 9 tháng ÷ 273 ngày', f'{n(N["dien"] / 273, 1)} triệu kWh'],
     ['Xăng dầu', 'TỔNG sản lượng xăng dầu (quy về m³)', f'{n(N["xangDau"])} nghìn m³ ({so(N["xangDau"], N["xangDauCk"])})'],
     ['Than', 'TỔNG sản lượng than (tấn)', f'{n(N["than"])} nghìn tấn ({so(N["than"], N["thanCk"])})']],
    [['Điện năng theo tháng', 'Cột', 'TỔNG theo «Tháng»', f'Cao nhất T7: {n(N["dienT"][6])} triệu kWh'],
     ['Xăng dầu theo tháng', 'Cột', 'TỔNG theo «Tháng»', f'T9: {n(N["xdT"][8])} nghìn m³'],
     ['Xăng dầu theo loại hình đơn vị', 'Tròn', 'TỔNG theo «Loại hình đơn vị»', ' · '.join(f'{L["LHDV"][j][0]} {pc(N["lhdv"][0][j], 1, 0)}' for j in range(4) if N['lhdv'][0][j])],
     ['10 phường/xã tiêu thụ điện nhiều nhất', 'Cột ngang', 'TỔNG điện theo «Địa bàn»', ' · '.join(f'{r[0]} {n(r[1])}' for r in N['topDien'][:3])]],
    ['«Đơn vị tính» cho chọn tự do (kWh, lít, m³, tấn) nên cùng mặt hàng có thể nhập lẫn đơn vị. Đề nghị cố định: điện – kWh, xăng dầu – lít hoặc m³, than – tấn.',
     'Chưa tìm được số than tiêu thụ đã công bố của Hà Nội; số giả lập cần Sở cung cấp để hiệu chỉnh.',
     'Điện năng nên lấy trực tiếp từ Tổng công ty Điện lực Thành phố (một nguồn) thay vì nhiều đơn vị cùng khai.'])

chi_tieu(4, [['Đơn vị', 'Giá trị sản xuất: tỷ đồng; chỉ số: kỳ gốc = 100; mức tăng: %'], ['Tên trên IOC', 'Chỉ số giá trị sản xuất của doanh nghiệp công nghiệp báo cáo — **không gọi là chỉ số sản xuất công nghiệp** (bản trả lời BA, mục 40 – 41)']],
    [KY, DB, ['Ngành công nghiệp (VSIC)', 'Nhóm', 'Biểu đồ theo ngành'], ['Giá trị sản xuất công nghiệp kỳ này (đồng)', 'Cộng', 'Thẻ số; trọng số tính chỉ số chung'],
     ['Giá trị sản xuất công nghiệp kỳ trước (đồng)', 'Cộng', 'Chỉ số so với kỳ trước'], ['Chỉ số IIP so với kỳ trước', 'Không dùng', 'IOC tự tính'],
     ['Tên doanh nghiệp/cơ sở sản xuất, Ghi chú', 'Không dùng', 'Chỉ để xem chi tiết']],
    [['Giá trị sản xuất so cùng kỳ (cùng kỳ = 100)', 'Bình quân chỉ số các ngành, trọng số theo giá trị sản xuất; chỉ tính doanh nghiệp báo cáo cả hai kỳ', f'{n(I["chung"], 1)} (cùng kỳ = 100)'],
     ['Tháng 9 so tháng 8', 'TỔNG GTSX tháng 9 ÷ TỔNG GTSX tháng 8 × 100 (theo ngành, bình quân trọng số)', f'{n(I["thang9"], 1)}%'],
     ['Giá trị sản xuất', 'TỔNG «Giá trị sản xuất công nghiệp kỳ này» 9 tháng', f'{n(I["gtsx"] / 1000, 1)} nghìn tỷ đồng'],
     ['Doanh nghiệp báo cáo', 'ĐẾM doanh nghiệp có bản ghi', n(I['soDn'])]],
    [['Mức tăng giá trị sản xuất theo ngành (doanh nghiệp báo cáo, giá hiện hành)', 'Bảng (%)', '(GTSX ngành kỳ này ÷ GTSX ngành cùng kỳ − 1) × 100, trên cùng tập doanh nghiệp báo cáo cả hai kỳ', ' · '.join(f'{x[0]} +{n(x[2] - 100, 1)}%' for x in L['NG'][:2])],
     ['Giá trị sản xuất tháng so với tháng trước (tháng trước = 100)', 'Đường, mốc 100', 'GTSX tháng ÷ GTSX tháng trước × 100, trên cùng tập doanh nghiệp có số cả hai tháng; mức tăng (chỉ số − 100) hiện khi di chuột', f'T2: {n(I["thang"][1], 1)} (Tết) · T3: {n(I["thang"][2], 1)}'],
     ['Cơ cấu giá trị sản xuất theo ngành', 'Tròn', 'TỔNG GTSX theo ngành', ' · '.join(f'{L["NG"][j][0]} {pc(I["nganhGt"][j], I["gtsx"])}' for j in range(2))],
     ['10 phường/xã giá trị sản xuất lớn nhất', 'Cột ngang', 'TỔNG GTSX theo «Địa bàn»', ' · '.join(f'{r[0]} {n(r[1])}' for r in I['top'][:3])]],
    ['Chỉ số sản xuất công nghiệp chính thức tính theo khối lượng sản phẩm và quyền số của cơ quan thống kê; eform chỉ có giá trị sản xuất giá hiện hành của doanh nghiệp tự báo cáo, nên IOC **không gọi số này là chỉ số sản xuất công nghiệp** (đã chốt theo bản trả lời BA, mục 40 – 41). Nếu có số chính thức của cơ quan thống kê Thành phố thì hiện ở thẻ riêng, ghi rõ nguồn.',
     'Danh mục ngành chỉ có 5 nhóm, thiếu "Sản xuất sản phẩm điện tử, máy tính" là ngành lớn của Hà Nội. Đề nghị dùng đúng danh mục ngành cấp 2 của Hệ thống ngành kinh tế Việt Nam.',
     'Eform chỉ có giá trị kỳ trước, không có cùng kỳ năm trước; để so cùng kỳ IOC phải dùng bản ghi năm trước. Đề nghị thêm «Giá trị sản xuất cùng kỳ năm trước».'])

heading('PHẦN III. BẢNG 126 PHƯỜNG/XÃ', 1)
table([['Cột', 'Chỉ tiêu', 'Dòng đầu'], ['Xuất khẩu (triệu USD)', '1', n(X['xk'])], ['Nhập khẩu (triệu USD)', '1', n(X['nk'])], ['Bán lẻ và dịch vụ (tỷ đồng)', '2', n(B['tong'])],
       ['Hộ kinh doanh bán hàng trực tuyến', '3', pc(T['dat'][2], T['tong'][2])], ['Điện năng (triệu kWh)', '4', n(N['dien'])], ['Xăng dầu (nghìn m³)', '4', n(N['xangDau'])],
       ['Giá trị sản xuất công nghiệp (tỷ đồng)', '5', n(I['gtsx'])]], [8.0, 2.0, 6.0], size=10.5)
k.page_break()
heading('PHẦN IV. TỔNG HỢP ĐỀ NGHỊ SỞ XÁC NHẬN', 1)
para('Gom các đề nghị của 5 chỉ tiêu. Cột "Kết quả" để trống cho Sở ghi ý kiến.')
table([['#', 'Chỉ tiêu', 'Nội dung', 'Kết quả']] + [[str(i + 1), c, x, ''] for i, (c, x) in enumerate(ALL_NOTES)], [0.8, 1.6, 10.6, 3.0], size=10.5)
k.page_break()
ctm_section(heading, para, lambda rows, w: table(rows, w, size=10), 'ubnd-congthuong',
            'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=['Xăng dầu tiêu thụ ghi **nghìn m³, không số lẻ**.', 'Số từ eform sản xuất công nghiệp **không gọi là chỉ số sản xuất công nghiệp**: ghi "chỉ số giá trị sản xuất của doanh nghiệp báo cáo"; bảng ngành ghi **mức tăng so cùng kỳ (%)**; biểu đồ "Giá trị sản xuất tháng so với tháng trước" là **đường có mốc 100** (BA mục 40, 41).', 'Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
k.page_break()
k.page_break()
heading('PHỤ LỤC. DANH SÁCH TRƯỜNG CỦA 5 EFORM', 1)
for i, e in enumerate(EF):
    heading(f'{i + 1}. {e["eform"]} ({len(e["fields"])} trường)', 2)
    table([['#', 'Tên trường', 'Mã trường', 'Kiểu nhập']] + [[str(j + 1), f[0], f[1], f[2] or '(chưa ghi)'] for j, f in enumerate(e['fields'])], [0.8, 6.6, 6.4, 2.2], size=10, mono_col=2)
print('đề nghị:', len(ALL_NOTES))
for p in k.save(OUT): print('ok', p)
