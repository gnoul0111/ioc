# -*- coding: utf-8 -*-
"""Sinh docs/SXD_SoXayDung/SXD_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 4 chỉ tiêu theo 4 eform của Sở Xây dựng trên IOC.
Chạy từ thư mục gốc ioc:  python tools/sxd_doc_docx.py
Lời văn viết tay; CÁC CON SỐ đọc thẳng từ js/core/sxd-config.js (qua node). Tên trường đúng như file mô tả đầu vào eform
(tools/sxd-fields.json, sheet "Sở Xây dựng"). Word + Markdown qua tools/doc_kit.py. Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EF = json.load(open(os.path.join(ROOT, 'tools', 'sxd-fields.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'docs', 'SXD_SoXayDung', 'SXD_MO_TA_CHI_TIEU.docx')
_JS = ("const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
       "vm.runInContext(fs.readFileSync('js/core/sxd-config.js','utf8')+';this.S=SXD_SUM;this.CT=SXD_CT;"
       "this.L={LCT:SXD_LCT,TTCT:SXD_TTCT,NHA:SXD_NHA,VT:SXD_VT,LNC:SXD_LNC,MD:SXD_MD,TTXL:SXD_TTXL,LHVT:SXD_LHVT,HH:SXD_HH,"
       "D:SXD_DIEM.filter(d=>d.muc===3).map(d=>[d.duong,d.diaBan])};',c);"
       "process.stdout.write(JSON.stringify({S:c.S,CT:c.CT,L:c.L}));")
_J = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))
S, CT, L = _J['S'], _J['CT'], _J['L']


def n(x, d=0):
    s = f'{abs(x):,.{d}f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return ('−' if x < 0 else '') + s
def pc(a, b, d=1): return n(a / b * 100, d) + '%'
def so(a, b): v = (a / b - 1) * 100; return ('+' if v >= 0 else '') + n(v, 1) + '%'


H, V, C, D = S['nha'], S['vt'], S['nc'], S['vtdl']
k = Kit('Sở Xây dựng · Mô tả chỉ tiêu trên IOC')
para, table, box, heading, note = k.para, k.table, k.box, k.heading, k.note

k.blank(5)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(4)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY)
para('SỞ XÂY DỰNG HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('Biểu đồ, trường dữ liệu và cách tính số liệu của 4 chỉ tiêu trên IOC', 14, CENTER, 4, italic=True, color=GREY)
para('xây dựng từ 4 eform nhập liệu của Sở', 14, CENTER, 0, italic=True, color=GREY)
k.blank(5)
table([['Đơn vị', 'Sở Xây dựng Thành phố Hà Nội'],
       ['Nguồn dữ liệu', f'File mô tả đầu vào eform, sheet "Sở Xây dựng": 4 eform, {sum(len(e["fields"]) for e in EF)} trường nhập'],
       ['Phạm vi', '4 chỉ tiêu, 12 biểu đồ, danh sách điểm nguy cơ mức rất cao, bảng 126 phường/xã'],
       ['Số liệu ví dụ', 'Số giả lập đặt theo bậc độ lớn số liệu đã công bố, 9 tháng năm 2026'],
       ['Phiên bản', '1.3 · ngày 13/10/2026 (theo phản hồi nhóm triển khai: số chính nhà ở chỉ lấy tình trạng Đã hoàn thành, không cộng các tình trạng; ẩn số theo tuyến đường sắt đô thị vì eform không có trường «Tuyến»)']], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()
k.toc()
k.page_break()

heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Mục đích tài liệu', 2)
para('Tài liệu mô tả cách IOC dựng 4 chỉ tiêu của Sở Xây dựng từ 4 eform: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào, mỗi con số được tính ra sao. Trên giao diện, mỗi chỉ tiêu chỉ gồm **thẻ số tổng hợp** và **biểu đồ**; cách tính chỉ trình bày trong tài liệu này. Bộ chỉ tiêu cũ (STT 20, 84: nhà ở và thị trường bất động sản; thông tin giao thông vận tải) đã được thay bằng bộ này và đã xóa khỏi IOC.')
heading('2. Bốn eform, bốn chỉ tiêu', 2)
table([['#', 'Chỉ tiêu trên IOC', 'Eform nguồn', 'Một bản ghi là']] + [[str(i + 1), c['name'], c['eform'], r] for i, (c, r) in enumerate(zip(CT, [
    'Số công trình, diện tích **phát sinh trong kỳ** của một loại công trình, ở một tình trạng (cấp phép mới, khởi công mới, hoàn thành mới, đưa vào sử dụng mới), tại một phường/xã',
    'Lượt hành khách, cự ly bình quân của một đơn vị vận tải (doanh nghiệp, hợp tác xã) trong một kỳ',
    'Một điểm nguy cơ trên một tuyến đường, có tọa độ',
    'Khối lượng vận chuyển, luân chuyển của một đối tượng (hành khách hoặc hàng hóa), một loại hình vận tải, tại một địa bàn trong một kỳ']))],
    [0.8, 4.0, 5.4, 5.8], size=10)
para('Tên eform có số hiệu "chỉ số 20, 24, 84, 68, 69"; **IOC không hiện số hiệu này trên giao diện**, chỉ ghi tên chỉ tiêu bằng lời.')
heading('3. Kỳ báo cáo và nguyên tắc tính', 2)
k.bullets(['Kỳ hiển thị mặc định: **9 tháng năm 2026**, cộng các bản ghi tháng 1 – 9; riêng điểm nguy cơ lấy bản ghi **tháng 9/2026** (tình trạng tại thời điểm).',
           'Trường «Hành khách.km (tự tính)» **không được IOC dùng**; IOC tự nhân «Số lượt hành khách vận chuyển (HK)» × «Cự ly vận chuyển bình quân (km)».',
           'So cùng kỳ = (số kỳ này ÷ số cùng kỳ năm trước − 1) × 100, lấy từ bản ghi cùng kỳ năm 2025 trên eform.',
           'Phường/xã: lấy theo «Đơn vị báo cáo» (eform 1, 2, 3) hoặc «Địa bàn» (eform 4). Danh mục 126 phường/xã của 4 eform giống nhau và giống danh mục chung của IOC.',
           'Nhà ở: một công trình đi qua nhiều tình trạng (cấp phép → thi công → hoàn thành → sử dụng), nên **không cộng các tình trạng với nhau**. Số chính, bảng 126 phường/xã, biểu đồ theo loại, theo tháng chỉ lấy «Tình trạng công trình» = **Đã hoàn thành**; các tình trạng khác hiện riêng từng số (phản hồi nhóm triển khai 13/10/2026).'])
heading('4. Căn cứ đặt số giả lập', 2)
note('Nguồn: Bộ Xây dựng (đường sắt đô thị quý I/2025); Báo Đấu thầu (doanh thu vận tải); Báo Đầu tư, Nông nghiệp và Môi trường (nhà ở xã hội, kế hoạch nhà ở); VnEconomy (vận tải hàng hóa cả nước 2025); báo chí Thành phố (xe buýt dịp Tết 2025).').paragraph_format.keep_with_next = True
table([['Số liệu công bố', 'Giá trị', 'Số giả lập 9 tháng 2026'],
       ['Đường sắt đô thị quý I/2025', '4,78 triệu lượt (Cát Linh – Hà Đông 3,23; Nhổn – Ga Hà Nội 1,49), +13,3%', f'{n(V["nhom"][4] / 1000, 1)} triệu lượt (cả 2 tuyến; eform không tách theo tuyến)'],
       ['Xe buýt', 'Hơn 6,5 triệu lượt trong 9 ngày Tết 2025 (khoảng 0,7 triệu lượt/ngày dịp nghỉ)', f'{n(V["nhom"][0] / 1000, 1)} triệu lượt ({n(V["nhom"][0] / 273 / 1000, 2)} triệu lượt/ngày)'],
       ['Doanh thu vận tải 4 tháng 2025', '83,6 nghìn tỷ đồng (+18,7%)', f'Lượt hành khách {so(V["tong"], V["ck"])} so cùng kỳ'],
       ['Nhà ở xã hội', '69 dự án, 4,17 triệu m² sàn (73.300 căn)', f'{H["ct"][2]} công trình, {n(H["noxh"])} nghìn m² sàn hoàn thành trong 9 tháng'],
       ['Kế hoạch nhà ở 2021 – 2025', '19,73 triệu m² nhà ở thương mại; 22,5 triệu m² nhà ở riêng lẻ (khoảng 4,5 triệu m²/năm)', f'Hoàn thành: nhà ở riêng lẻ {n(H["san"][0] / 1000, 2)} triệu m²; tổng {n(H["sanTong"] / 1000, 2)} triệu m² sàn (năm 2020 riêng nhà ở thương mại hoàn thành khoảng 6,57 triệu m²)'],
       ['Vận tải hàng hóa cả nước 2025', '3.027,7 triệu tấn (+14,1%); 612,3 tỷ tấn.km', f'Hà Nội {n(D["hh"] / 1000, 1)} triệu tấn ({so(D["hh"], D["hhCk"])}), khoảng 13% số cả nước'],
       ['Điểm nguy cơ sạt lở, úng ngập', 'Chưa tìm được danh sách công bố', f'{C["n"]} điểm đặt theo các tuyến hay ngập, các tuyến đồi núi phía tây (vị trí gần đúng)']], [4.2, 6.0, 5.8], size=10)

k.page_break()
heading('PHẦN II. CHI TIẾT 4 CHỈ TIÊU', 1)
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
    table([['Biểu đồ', 'Loại', 'Cách tính', 'Ví dụ (giả lập)']] + charts, [3.6, 2.4, 5.6, 4.4], size=10, keep=True)
    if SHOW_NOTE_BOX: box(['• ' + x for x in nts], k.NOTE_FILL, 'Lưu ý, đề nghị Sở xác nhận', 12)
    ALL_NOTES.extend((str(i + 1), x) for x in nts)
    k.page_break()
KY = ['Kỳ báo cáo, Năm, Quý, Tháng', 'Lọc kỳ', 'Chọn bản ghi tháng 1 – 9 năm 2026 (và cùng kỳ 2025)']
DV = ['Đơn vị báo cáo', 'Nhóm', 'Phường/xã; bảng 126 phường/xã, biểu đồ 10 phường/xã']
top3 = lambda rows, d=0: ' · '.join(f'{r[0]} {n(r[1], d)}' for r in rows[:3])

chi_tieu(0, [['Đơn vị', 'Diện tích: nghìn m² (eform nhập m²); công trình: cái']],
    [KY, DV, ['Loại công trình', 'Nhóm', 'Biểu đồ diện tích sàn theo loại công trình'], ['Tình trạng công trình', 'Điều kiện, Nhóm', 'Chỉ lấy Đã hoàn thành cho số chính và mọi biểu đồ; bảng theo tình trạng hiện 4 số riêng'],
     ['Số lượng công trình', 'Cộng', 'Thẻ số công trình'], ['Tổng diện tích sàn (m²)', 'Cộng', 'Thẻ số, mọi biểu đồ'],
     ['Số tầng', 'Bình quân', 'Số tầng bình quân, trọng số theo số công trình'],
     ['Loại nhà ở', 'Không dùng', 'Trùng một phần với «Loại công trình» (xem lưu ý)'], ['Tổng diện tích xây dựng (m²)', 'Không dùng', 'Chỉ để xem chi tiết'],
     ['Ngày báo cáo, Ghi chú', 'Không dùng', 'Chỉ để xem chi tiết']],
    [['Diện tích sàn nhà ở hoàn thành', 'TỔNG(«Tổng diện tích sàn (m²)») của «Tình trạng công trình» = Đã hoàn thành, 9 tháng; so cùng kỳ', f'{n(H["sanTong"] / 1000, 2)} triệu m² ({so(H["sanTong"], H["ck"])})'],
     ['Công trình hoàn thành', 'TỔNG(«Số lượng công trình»), «Tình trạng công trình» = Đã hoàn thành', n(H['ctTong'])],
     ['Nhà ở xã hội hoàn thành', 'Như trên, thêm điều kiện «Loại công trình» = Nhà ở xã hội', f'{n(H["noxh"])} nghìn m² · {H["ct"][2]} công trình'],
     ['Khởi công, đang thi công (số riêng)', 'TỔNG diện tích sàn của «Tình trạng công trình» = Đang thi công; không cộng vào số hoàn thành', f'{n(H["sanTT"][1] / 1000, 2)} triệu m²'],
     ['Số tầng bình quân', 'TỔNG(«Số tầng» × «Số lượng công trình») ÷ TỔNG(«Số lượng công trình»)', n(H['tang'], 1)]],
    [['Diện tích sàn hoàn thành theo loại công trình', 'Bảng', 'TỔNG diện tích sàn hoàn thành theo «Loại công trình», xếp giảm', top3([[L['LCT'][j][0], H['san'][j]] for j in range(8)])],
     ['Diện tích sàn theo tình trạng', 'Bảng (không có ô tổng)', 'TỔNG diện tích sàn theo từng «Tình trạng công trình»; 4 số riêng, không cộng với nhau', ' · '.join(f'{L["TTCT"][j][0]} {n(H["sanTT"][j])}' for j in range(4))],
     ['Diện tích sàn hoàn thành theo tháng', 'Cột', 'TỔNG diện tích sàn hoàn thành theo «Tháng»', f'T2: {n(H["sanT"][1])} (Tết) · T9: {n(H["sanT"][8])} nghìn m²'],
     ['Xã, phường hoàn thành nhiều nhất', 'Bảng', 'TỔNG diện tích sàn hoàn thành theo «Đơn vị báo cáo»', top3(H['top'], 1)]],
    ['«Loại công trình» (riêng lẻ, chung cư, nhà ở xã hội, công vụ, tái định cư, biệt thự, liền kề, khác) và «Loại nhà ở» (thương mại, xã hội, tái định cư, công vụ, khác) trùng 4 giá trị. IOC đang dùng «Loại công trình». Đề nghị tách rõ: «Loại công trình» theo hình thức (riêng lẻ, chung cư, biệt thự, liền kề), «Loại nhà ở» theo mục đích (thương mại, xã hội, tái định cư, công vụ).',
     'Eform không có số căn hộ, trong khi chỉ tiêu nhà ở xã hội của Thành phố tính theo căn. Đề nghị thêm «Số căn hộ».',
     'Mỗi bản ghi có nhiều công trình nhưng chỉ một «Số tầng»; IOC hiểu là số tầng bình quân. Đề nghị đổi tên thành «Số tầng bình quân».',
     'Một công trình đi qua nhiều tình trạng (cấp phép → thi công → hoàn thành → sử dụng). IOC coi mỗi bản ghi là số **phát sinh trong tháng** của một tình trạng và **chỉ lấy Đã hoàn thành** cho số chính; các tình trạng không cộng với nhau (phản hồi nhóm triển khai 13/10/2026). Đề nghị Sở xác nhận đơn vị nhập theo nghĩa phát sinh trong tháng.',
     '«Đơn vị báo cáo» là phường/xã, trong khi dự án nhà ở lớn do Sở cấp phép. Đề nghị xác nhận ai nhập phần dự án (Sở nhập thay theo địa bàn, hay phường/xã nhập).'])

chi_tieu(1, [['Đơn vị', 'Hành khách: eform nhập lượt (HK), IOC chia 1.000 và hiển thị **nghìn lượt** ở mọi chỗ (thẻ số, biểu đồ, bảng); hành khách.km: hiển thị tỷ'],
             ['Nhóm vận tải trên biểu đồ', 'Gộp «Ngành vận tải» và «Loại hình vận tải»: ' + '; '.join(x[0] for x in L['VT'])]],
    [KY, ['Đơn vị báo cáo', 'Nhóm', 'Phường/xã nơi đặt trụ sở đơn vị vận tải; bảng 126 phường/xã'],
     ['Ngành vận tải, Loại hình vận tải', 'Nhóm', 'Xếp vào 7 nhóm vận tải ở biểu đồ'], ['Số lượt hành khách vận chuyển (HK)', 'Cộng', 'Thẻ số, mọi biểu đồ'],
     ['Cự ly vận chuyển bình quân (km)', 'Nhân', 'Hành khách.km = lượt × cự ly'], ['Hành khách.km (tự tính)', 'Không dùng', 'IOC tự tính'],
     ['Ngày báo cáo, Ghi chú', 'Không dùng', 'Chỉ để xem chi tiết']],
    [['Lượt hành khách', 'TỔNG(«Số lượt hành khách vận chuyển (HK)») 9 tháng; so cùng kỳ', f'{n(V["tong"])} nghìn lượt ({so(V["tong"], V["ck"])})'],
     ['Hành khách.km', 'TỔNG(lượt × cự ly)', f'{n(V["km"] / 1e6, 2)} tỷ'],
     ['Cự ly bình quân', 'Hành khách.km ÷ lượt hành khách', f'{n(V["cuLy"], 1)} km'],
     ['Đường sắt đô thị', 'TỔNG lượt của «Ngành vận tải» = Đường sắt đô thị (Metro)', f'{n(V["nhom"][4])} nghìn lượt'],
     ['Đơn vị vận tải báo cáo', 'ĐẾM bản ghi tháng 9 (mỗi đơn vị một bản ghi, xem lưu ý)', n(V['soDv'])]],
    [['Lượt hành khách theo nhóm vận tải', 'Cột ngang', 'TỔNG lượt theo nhóm, xếp giảm', top3([[L['VT'][j][0], V['nhom'][j]] for j in range(3)]) + ' nghìn lượt'],
     ['Hành khách.km theo nhóm', 'Tròn', 'TỔNG(lượt × cự ly) theo nhóm', ' · '.join(f'{L["VT"][j][0]} {n(V["kmNhom"][j] / 1000)}' for j in (0, 3)) + ' triệu'],
     ['Theo tháng', 'Cột', 'TỔNG lượt theo «Tháng»', f'T2: {n(V["hkT"][1])} · T9: {n(V["hkT"][8])} nghìn lượt'],
     ],
    ['«Đơn vị báo cáo» là danh mục phường/xã, không có tên đơn vị vận tải, nên không biết bản ghi của doanh nghiệp nào và không đếm chính xác được số đơn vị. Đề nghị thêm «Tên đơn vị vận tải» và «Mã số thuế».',
     '«Hành khách.km (tự tính)» là số suy ra từ hai trường khác; IOC tự tính, không dùng số nhập tay. Đề nghị bỏ trường này hoặc để hệ thống tự tính.',
     'Eform không có trường tuyến đường sắt đô thị, nên IOC **không hiện số theo tuyến** (đã ẩn, phản hồi 13/10/2026). Nếu Sở cần, đề nghị thêm «Tuyến» (ít nhất cho đường sắt đô thị và xe buýt).',
     'Ngành "Hàng hải" không có ở Hà Nội; ngành "Hàng không" do cảng hàng không, hãng bay (cấp trung ương) quản lý. Đề nghị xác nhận có thu hai ngành này không.',
     'Dữ liệu mẫu: «Ngành vận tải» hiện giá trị "Đường sắt" nhưng mã lưu là đường bộ; đề nghị kiểm tra lại danh mục.'])

chi_tieu(2, [['Đơn vị', 'Điểm; chiều dài ảnh hưởng: m (hiển thị km)'],
             ['Điểm mức rất cao', '; '.join(f'{d[0]} ({d[1]})' for d in L['D'])]],
    [['Kỳ báo cáo, Năm, Quý, Tháng', 'Lọc kỳ', 'Lấy bản ghi tháng 9/2026'], DV, ['Cấp báo cáo', 'Nhóm', 'Phường/xã báo cáo hay Sở báo cáo'],
     ['Tên tuyến đường, Tên vị trí / Địa điểm', 'Hiển thị', 'Danh sách điểm mức rất cao'], ['Latitude (Vĩ độ), Longitude (Kinh độ)', 'Kiểm tra', 'Thẻ "Có tọa độ"; sẵn sàng hiện lên bản đồ'],
     ['Loại nguy cơ', 'Nhóm', 'Thẻ số, biểu đồ theo loại'], ['Mức độ nguy cơ', 'Nhóm', 'Biểu đồ loại × mức; thẻ "Mức cao, rất cao"'],
     ['Trạng thái xử lý', 'Nhóm', 'Biểu đồ trạng thái; thẻ "Chưa xử lý", "Đang xử lý"'], ['Chiều dài ảnh hưởng (m)', 'Cộng', 'Thẻ chiều dài ảnh hưởng'],
     ['Phương án xử lý, Ghi chú', 'Không dùng', 'Chỉ để xem chi tiết']],
    [['Điểm nguy cơ', 'ĐẾM bản ghi tháng 9; tách theo «Loại nguy cơ»', f'{C["n"]} ({C["loai"][0]} sạt lở, {C["loai"][1]} úng ngập)'],
     ['Mức cao, rất cao', 'ĐẾM «Mức độ nguy cơ» ∈ {Cao, Rất cao}; tỷ lệ trên tổng', f'{C["caoTro"]} ({pc(C["caoTro"], C["n"])})'],
     ['Chưa xử lý; Đang xử lý', 'ĐẾM theo «Trạng thái xử lý»', f'{C["chuaXl"]}; {C["tt"][1]}'],
     ['Chiều dài ảnh hưởng', 'TỔNG(«Chiều dài ảnh hưởng (m)»)', f'{n(C["dai"] / 1000, 1)} km'],
     ['Có tọa độ', 'ĐẾM điểm có vĩ độ, kinh độ nằm trong Hà Nội', f'{C["n"]}/{C["n"]}']],
    [['Điểm nguy cơ theo loại và mức độ', 'Cột ngang chồng', 'ĐẾM theo «Loại nguy cơ» × «Mức độ nguy cơ»', ' · '.join(f'{L["LNC"][j][0]}: {sum(C["muc"][j])}' for j in range(2))],
     ['Theo trạng thái xử lý', 'Tròn', 'ĐẾM theo «Trạng thái xử lý»', ' · '.join(f'{L["TTXL"][j][0]} {C["tt"][j]}' for j in range(4))],
     ['Điểm mức rất cao', 'Danh sách', 'Lọc «Mức độ nguy cơ» = Rất cao; hiện tuyến, địa bàn, loại, chiều dài, trạng thái', f'{len(L["D"])} điểm']],
    ['Dữ liệu mẫu có vĩ độ, kinh độ đều là 23,456 — nằm ngoài Hà Nội (Hà Nội khoảng 20,5 – 21,4 độ vĩ bắc, 105,3 – 106,0 độ kinh đông). Đề nghị eform kiểm tra phạm vi khi nhập, hoặc cho chọn điểm trên bản đồ.',
     'Mỗi tháng một điểm được báo lại; không có mã điểm nên khó theo dõi một điểm qua các kỳ. Đề nghị thêm «Mã điểm nguy cơ».',
     'Chưa có tiêu chí phân mức độ (thấp, trung bình, cao, rất cao). Đề nghị Sở ban hành tiêu chí (ví dụ theo chiều sâu, thời gian ngập; khối lượng sạt) để các phường/xã chấm thống nhất.',
     'Điểm úng ngập, sạt lở cũng có trong chỉ tiêu của Sở Nông nghiệp và Môi trường. Đề nghị phân định: Sở Xây dựng theo dõi điểm trên tuyến đường, hạ tầng đô thị; Sở Nông nghiệp và Môi trường theo dõi đê, bờ sông, đồi núi.',
     'Các điểm đã có tọa độ nên có thể hiện trên bản đồ của IOC (màu theo mức độ). Đề nghị xác nhận để làm ở bước sau.'])

chi_tieu(3, [['Đơn vị', 'Eform nhập hành khách bằng lượt (HK), hàng hóa bằng tấn; IOC chia 1.000 và hiển thị **nghìn lượt**, **nghìn tấn** ở mọi chỗ (trả lời BA mục 62 – 67); luân chuyển: HK.km, tấn.km (hiển thị tỷ)']],
    [KY, ['Địa bàn', 'Nhóm', 'Phường/xã; bảng 126 phường/xã, biểu đồ 10 phường/xã'], ['Cấp báo cáo', 'Không dùng', 'Chỉ để xem chi tiết'],
     ['Đối tượng vận chuyển', 'Điều kiện', 'Tách hành khách / hàng hóa (đơn vị của hai trường khối lượng theo trường này)'],
     ['Loại hình vận tải', 'Nhóm', 'Biểu đồ theo loại hình'], ['Khối lượng vận chuyển (Hành khách hoặc Tấn)', 'Cộng', 'Thẻ số, mọi biểu đồ'],
     ['Khối lượng luân chuyển (Hành khách.km hoặc Tấn.km)', 'Cộng', 'Thẻ luân chuyển']],
    [['Hành khách vận chuyển', 'TỔNG khối lượng vận chuyển, «Đối tượng» = Hành khách', f'{n(D["hk"])} nghìn lượt'],
     ['Hành khách luân chuyển', 'TỔNG khối lượng luân chuyển, «Đối tượng» = Hành khách', f'{n(D["hkKm"] / 1e6, 2)} tỷ HK.km'],
     ['Hàng hóa vận chuyển', 'TỔNG khối lượng vận chuyển, «Đối tượng» = Hàng hóa; so cùng kỳ', f'{n(D["hh"])} nghìn tấn ({so(D["hh"], D["hhCk"])})'],
     ['Hàng hóa luân chuyển', 'TỔNG khối lượng luân chuyển, «Đối tượng» = Hàng hóa', f'{n(D["hhKm"] / 1e6, 2)} tỷ tấn.km']],
    [['Hàng hóa theo loại hình', 'Cột ngang', 'TỔNG hàng hóa theo «Loại hình vận tải»', top3(sorted([[L['LHVT'][j], D['hhLh'][j]] for j in range(6)], key=lambda r: -r[1])) + ' nghìn tấn'],
     ['Hành khách theo loại hình', 'Cột ngang', 'TỔNG hành khách theo «Loại hình vận tải»', top3(sorted([[L['LHVT'][j], D['hkLh'][j]] for j in range(6)], key=lambda r: -r[1])) + ' nghìn lượt'],
     ['10 phường/xã nhiều hàng hóa nhất', 'Cột ngang', 'TỔNG hàng hóa theo «Địa bàn»', top3(D['topHh']) + ' nghìn tấn']],
    ['Một trường «Khối lượng vận chuyển» chứa hai đơn vị (lượt hành khách hoặc tấn) tùy «Đối tượng vận chuyển»; nếu chọn nhầm đối tượng, số hành khách lẫn vào số tấn. Đề nghị tách hai trường riêng hoặc khóa đơn vị theo đối tượng.',
     'Dữ liệu mẫu «Khối lượng luân chuyển» là 1.000.000.000.000 (10¹²) — lớn hơn cả số cả nước một năm (612,3 tỷ tấn.km). Đề nghị xác nhận đơn vị nhập (tấn.km hay nghìn tấn.km).',
     'Hành khách trùng với eform vận tải hành khách (chỉ tiêu 2). Nếu hai eform lệch nhau, IOC sẽ hiện hai số khác nhau. Đề nghị: eform này chỉ thu hàng hóa, hoặc phần hành khách tự tổng hợp từ eform chỉ tiêu 2.',
     'Vận tải không gắn với một phường/xã rõ ràng (nơi đi, nơi đến hay nơi đặt trụ sở). Đề nghị xác nhận quy ước «Địa bàn».',
     'Chưa tìm được số khối lượng vận chuyển, luân chuyển của Hà Nội đã công bố; số giả lập lấy khoảng 13% số cả nước. Đề nghị Sở cung cấp số thực để hiệu chỉnh.'])

heading('PHẦN III. BẢNG 126 PHƯỜNG/XÃ', 1)
table([['Cột', 'Chỉ tiêu', 'Dòng đầu (cộng 126 phường/xã)'], ['Diện tích sàn nhà ở hoàn thành (nghìn m²)', '1', n(H['sanTong'])], ['Công trình nhà ở hoàn thành', '1', n(H['ctTong'])],
       ['Nhà ở xã hội hoàn thành (nghìn m² sàn)', '1', n(H['noxh'])], ['Hành khách (nghìn lượt)', '2', n(V['tong'])], ['Hàng hóa (nghìn tấn)', '4', n(D['hh'])],
       ['Điểm nguy cơ sạt lở, úng ngập', '3', n(C['n'])]], [8.0, 2.0, 6.0], size=10.5)
para('Vận tải hành khách tính theo phường/xã nơi đặt trụ sở đơn vị vận tải, nên các phường trung tâm có số lớn.')
k.page_break()
heading('PHẦN IV. TỔNG HỢP ĐỀ NGHỊ SỞ XÁC NHẬN', 1)
para('Gom các đề nghị của 4 chỉ tiêu. Cột "Kết quả" để trống cho Sở ghi ý kiến.')
table([['#', 'Chỉ tiêu', 'Nội dung', 'Kết quả']] + [[str(i + 1), c, x, ''] for i, (c, x) in enumerate(ALL_NOTES)], [0.8, 1.6, 10.6, 3.0], size=10.5)
k.page_break()
ctm_section(heading, para, lambda rows, w: table(rows, w, size=10), 'ubnd-xaydung',
            'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=['Theo phản hồi nhóm triển khai 13/10/2026: số chính nhà ở, bảng 126 xã, biểu đồ theo loại, theo tháng **chỉ lấy «Tình trạng công trình» = Đã hoàn thành**; 4 tình trạng hiện thành 4 số riêng, không cộng thành tổng. Ẩn số theo tuyến đường sắt đô thị (eform không có trường «Tuyến»).', 'Hành khách ghi **nghìn lượt**, hàng hóa ghi **nghìn tấn** ở mọi chỗ; eform nhập lượt (HK), tấn, IOC chia 1.000 (BA mục 62 – 67).', 'Diện tích sàn nhà ở: tổng và thẻ ngoài dùng **diện tích hoàn thành** trong kỳ, tab UBND và màn chi tiết cùng một số (BA mục 68 – 71).', 'Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
k.page_break()
k.page_break()
heading('PHỤ LỤC. DANH SÁCH TRƯỜNG CỦA 4 EFORM', 1)
for i, e in enumerate(EF):
    heading(f'{i + 1}. {e["eform"]} ({len(e["fields"])} trường)', 2)
    table([['#', 'Tên trường', 'Mã trường', 'Kiểu nhập']] + [[str(j + 1), f[0], f[1], f[2] or '(chưa ghi)'] for j, f in enumerate(e['fields'])], [0.8, 6.6, 6.4, 2.2], size=10, mono_col=2)
print('đề nghị:', len(ALL_NOTES))
for p in k.save(OUT): print('ok', p)
