# -*- coding: utf-8 -*-
"""Phần chi tiết 2 chỉ tiêu du lịch (khách du lịch; doanh thu dịch vụ du lịch) — dùng chung cho 2 tài liệu:
  - tools/vhtt_doc_docx.py: tài liệu Sở Văn hóa, Thể thao và Du lịch (Sở Du lịch nhập vào từ 10/8/2026), là Chỉ tiêu 7, 8;
  - tools/dl_doc_docx.py: tài liệu cũ của Sở Du lịch (giữ làm bản lưu), là Chỉ tiêu 1, 2.
Lời văn chuyển nguyên từ dl_doc_docx.py, chỉ đổi số thứ tự chỉ tiêu / biểu đồ theo tham số. CÁC CON SỐ đọc thẳng từ
js/core/dl-config.js (qua node) nên luôn khớp giao diện. Tên trường đúng như file mô tả đầu vào eform (tools/dl-fields.json)."""
import json, os, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EF = json.load(open(os.path.join(ROOT, 'tools', 'dl-fields.json'), encoding='utf-8'))

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


K, T = S['khach'], S['doanhThu']
NDV = len(U)
UB = {u['ten']: u for u in U}
TH = [f'T{m + 1}' for m in range(9)]
E1, E2 = EF[0], EF[1]
KYS = {'Kỳ báo cáo', 'Năm', 'Quý', 'Tháng'}
USED = [KYS | {'Đơn vị báo cáo', 'Loại điểm du lịch', 'Số lượt khách du lịch quốc tế', 'Số lượt khách du lịch nội địa'},
        KYS | {'Đơn vị báo cáo', 'Loại điểm du lịch', 'Loại doanh thu', 'Giá trị doanh thu (VND)'}]
KY = [['Kỳ báo cáo, Năm,', 'Quý, Tháng'], 'Danh mục / Số', 'Lọc kỳ', 'Lấy các tháng 1 – 9; «Tháng» còn là trục của biểu đồ theo tháng']
# 2 dòng của bảng tổng hợp chỉ tiêu: [tên chỉ tiêu, eform nguồn, số thẻ số, số biểu đồ]
TONG_HOP = [['Khách du lịch nội địa và quốc tế', E1['eform'], '5', '3'], ['Doanh thu dịch vụ du lịch', E2['eform'], '5', '4']]
SO_BIEU_DO = 7


def write(H, para, table, chart, kpi_table, info_table, fields_table, notes, page_break, a=1, muc_ky='Phần I, mục 3'):
    """Viết 2 chỉ tiêu, đánh số a và a + 1. H(text, level): tiêu đề; fields_table(rows); notes(ct, items); muc_ky: mục nói về kỳ báo cáo."""
    b = a + 1
    # ---------------- CHỈ TIÊU a: KHÁCH DU LỊCH
    H(f'Chỉ tiêu {a}. Khách du lịch nội địa và quốc tế', 2)
    H(f'{a}.1. Thông tin chung', 3)
    info_table([
        ['Eform nguồn', E1['eform']],
        ['Một bản ghi là', 'Lượt khách của một phường/xã tại một loại điểm du lịch trong một tháng'],
        ['Cách lấy theo kỳ', f'**Cộng các tháng** 1 – 9 năm 2026 ({muc_ky}).'],
        ['Kỳ hiển thị', f'9 tháng năm 2026 · {n(K["banGhi"])} bản ghi ({NDV} phường/xã × các loại điểm có trên địa bàn × 9 tháng)'],
    ])
    H(f'{a}.2. Trường dữ liệu sử dụng', 3)
    fields_table([KY,
        ['Đơn vị báo cáo', 'Danh mục', 'Nhóm', f'Hàng của biểu đồ {a}.3 và bảng 126 phường/xã'],
        ['Loại điểm du lịch', 'Danh mục', 'Nhóm', f'Hàng của biểu đồ {a}.2 ({len(L)} loại)'],
        ['Số lượt khách du lịch quốc tế', 'Số', 'Cộng', 'Thẻ số; phần "Quốc tế" của mọi biểu đồ'],
        ['Số lượt khách du lịch nội địa', 'Số', 'Cộng', 'Thẻ số; phần "Nội địa" của mọi biểu đồ'],
        ['Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
    ])
    H(f'{a}.3. Thẻ số tổng hợp', 3)
    tg = (K['t9'] / K['t8'] - 1) * 100
    kpi_table([
        ['Tổng lượt khách', 'TỔNG(«Số lượt khách du lịch quốc tế») + TỔNG(«Số lượt khách du lịch nội địa»), tháng 1 – 9', f'{n(K["tong"])} lượt'],
        ['Khách quốc tế', 'TỔNG(«Số lượt khách du lịch quốc tế»); dòng phụ = tỷ trọng trong tổng lượt khách', f'{n(K["qt"])} lượt ({pc(K["qt"], K["tong"])})'],
        ['Khách nội địa', 'TỔNG(«Số lượt khách du lịch nội địa»); dòng phụ = tỷ trọng', f'{n(K["nd"])} lượt ({pc(K["nd"], K["tong"])})'],
        ['Tháng 9', 'Tổng lượt khách của «Tháng» = 9; dòng phụ = (tháng 9 ÷ tháng 8 − 1) × 100', f'{n(K["t9"])} lượt ({"+" if tg >= 0 else ""}{n(tg, 1)}%)'],
        ['Đơn vị có khách', 'Số phường/xã có tổng lượt khách > 0', f'{K["dvCoKhach"]} trên {NDV}'],
    ])
    H(f'{a}.4. Biểu đồ', 3)
    chart(f'{a}.1', 'Lượt khách theo tháng', 'Biểu đồ cột xếp chồng',
          'Trục ngang: «Tháng» 1 → 9; mỗi cột chia 2 phần: Quốc tế / Nội địa', 'Nghìn lượt; số ở đầu cột = tổng lượt khách của tháng',
          ['Nhóm theo «Tháng»:', 'Phần Quốc tế = TỔNG(«Số lượt khách du lịch quốc tế») ÷ 1.000;', 'Phần Nội địa = TỔNG(«Số lượt khách du lịch nội địa») ÷ 1.000.'],
          ' · '.join(f'{TH[m]}: {nghin(K["qtT"][m])} + {nghin(K["ndT"][m])}' for m in (0, 1, 8)) + ' (nghìn lượt)',
          'Hai phần cùng đơn vị (lượt) nên xếp chồng trên một trục; chiều cao cả cột là tổng lượt khách.')
    lo = sorted(range(len(L)), key=lambda i: -(K['qtLoai'][i] + K['ndLoai'][i]))
    chart(f'{a}.2', 'Lượt khách theo loại điểm du lịch — 9 tháng', 'Biểu đồ cột ngang xếp chồng',
          f'Trục dọc: {len(L)} giá trị của «Loại điểm du lịch», xếp theo tổng lượt khách từ lớn xuống; mỗi cột chia 2 phần Quốc tế / Nội địa',
          'Nghìn lượt; số ở đầu cột = tổng',
          'Nhóm theo «Loại điểm du lịch», cộng tháng 1 – 9 và 126 phường/xã: phần Quốc tế = TỔNG(«Số lượt khách du lịch quốc tế»), phần Nội địa = TỔNG(«Số lượt khách du lịch nội địa»).',
          ' · '.join(f'{L[i]} {nghin(K["qtLoai"][i])} + {nghin(K["ndLoai"][i])}' for i in lo[:3]) + ' (nghìn lượt)')
    tp = K['top']
    chart(f'{a}.3', '15 phường/xã đông khách nhất — 9 tháng', 'Biểu đồ cột ngang xếp chồng',
          'Trục dọc: 15 «Đơn vị báo cáo» có tổng lượt khách lớn nhất, xếp từ lớn xuống; mỗi cột chia 2 phần Quốc tế / Nội địa',
          'Nghìn lượt; số ở đầu cột = tổng',
          'Nhóm theo «Đơn vị báo cáo», cộng tháng 1 – 9 và mọi loại điểm; xếp theo tổng lượt khách, lấy 15 đơn vị đầu.',
          ' · '.join(f'{r[0]} {nghin(r[1])} + {nghin(r[2])}' for r in tp[:3]) + ' (nghìn lượt)',
          'Bảng đủ 126 phường/xã ở ô bên phải (Phần III). Tên trên trục viết tắt "P." là phường, "X." là xã.')
    notes(str(a), ['Lượt khách nhập theo từng loại điểm của từng phường/xã nên một khách đi nhiều điểm bị đếm nhiều lần; IOC cộng ra "tổng lượt khách đến các điểm du lịch". Đề nghị Sở xác nhận số lượt khách chính thức của Thành phố lấy từ đâu (ví dụ thêm một bản ghi cấp Thành phố do Sở nhập), để IOC hiện đúng số đó ở thẻ Tổng lượt khách.',
                   '«Loại điểm du lịch» có giá trị "Cơ sở lưu trú" là nơi ở chứ không phải điểm tham quan; khách lưu trú thường cũng đã được đếm ở điểm tham quan. Đề nghị tách lượt khách lưu trú thành trường riêng (ví dụ «Số lượt khách có lưu trú»).',
                   '«Kỳ báo cáo» cho chọn Tháng / Quý / Năm. Đề nghị thống nhất nhập theo Tháng; nếu có đơn vị nhập theo Quý, IOC dùng bản quý và không cộng thêm các tháng của quý đó.',
                   'Bộ chỉ tiêu cũ có phân tổ khách quốc tế theo thị trường (Trung Quốc, Hàn Quốc, Nhật Bản…) và theo có / không lưu trú; eform mới không có. Nếu Sở cần, đề nghị bổ sung trường «Thị trường» (Danh mục) cho khách quốc tế.'])

    # ---------------- CHỈ TIÊU b: DOANH THU DU LỊCH
    page_break()
    H(f'Chỉ tiêu {b}. Doanh thu dịch vụ du lịch', 2)
    H(f'{b}.1. Thông tin chung', 3)
    info_table([
        ['Eform nguồn', E2['eform']],
        ['Một bản ghi là', 'Doanh thu của một phường/xã, một loại điểm du lịch, một loại doanh thu trong một tháng'],
        ['Cách lấy theo kỳ', f'**Cộng các tháng** 1 – 9 năm 2026 ({muc_ky}).'],
        ['Kỳ hiển thị', f'9 tháng năm 2026 · {n(T["banGhi"])} bản ghi (gấp 3 eform khách, mỗi loại doanh thu một bản ghi) · đơn vị tỷ đồng'],
    ])
    H(f'{b}.2. Trường dữ liệu sử dụng', 3)
    fields_table([KY,
        ['Đơn vị báo cáo', 'Chữ', 'Nhóm', f'Hàng của biểu đồ {b}.4 và bảng 126 phường/xã'],
        ['Loại điểm du lịch', 'Danh mục', 'Nhóm', f'Hàng của biểu đồ {b}.3'],
        ['Loại doanh thu', 'Danh mục', 'Nhóm', f'Tách lưu trú và ăn uống / lữ hành / tổng thu (mục {b}.3)'],
        ['Giá trị doanh thu (VND)', 'Số', 'Cộng', 'Mọi con số doanh thu (đổi ra tỷ đồng)'],
        ['Số lượt khách du lịch quốc tế', 'Số', 'Không dùng', 'Trùng eform khách; IOC lấy lượt khách từ eform khách'],
        ['Số lượt khách du lịch nội địa', 'Số', 'Không dùng', 'Trùng eform khách; IOC lấy lượt khách từ eform khách'],
        ['Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
    ])
    H(f'{b}.3. Loại doanh thu', 3)
    para('Danh mục «Loại doanh thu» có 3 giá trị. Giá trị thứ ba là **tổng thu**, đã gồm hai giá trị đầu, nên IOC **không cộng 3 loại với nhau**:').paragraph_format.keep_with_next = True
    table([
        ['Mã', 'Loại doanh thu (đúng như eform)', 'IOC dùng làm', 'Số 9 tháng (tỷ đồng)'],
        ['DT01', LDT[0], 'Phần "Lưu trú và ăn uống"', ty(T['ltau'])],
        ['DT02', LDT[1], 'Phần "Lữ hành"', ty(T['lh'])],
        ['DT03', LDT[2], '**Tổng thu** (cả cột biểu đồ, thẻ Tổng thu)', ty(T['tong'])],
        ['—', '(không có trong eform)', 'Phần "Dịch vụ khác" = DT03 − DT01 − DT02', ty(T['khac'])],
    ], [1.4, 6.0, 5.6, 3.0], size=11, keep=True)
    H(f'{b}.4. Thẻ số tổng hợp', 3)
    kpi_table([
        ['Tổng thu từ khách du lịch', 'TỔNG(«Giá trị doanh thu (VND)») có «Loại doanh thu» = Tổng thu từ khách du lịch, tháng 1 – 9, ÷ 10⁹', f'{ty(T["tong"])} tỷ đồng'],
        ['Lưu trú và ăn uống', 'Như trên với «Loại doanh thu» = Doanh thu dịch vụ lưu trú và ăn uống; dòng phụ = tỷ trọng trong tổng thu', f'{ty(T["ltau"])} tỷ đồng ({pc(T["ltau"], T["tong"])})'],
        ['Lữ hành', 'Như trên với «Loại doanh thu» = Doanh thu dịch vụ du lịch lữ hành; dòng phụ = tỷ trọng', f'{ty(T["lh"])} tỷ đồng ({pc(T["lh"], T["tong"])})'],
        ['Chi tiêu bình quân', f'Tổng thu (đồng) ÷ Tổng lượt khách (Chỉ tiêu {a}), ra nghìn đồng/lượt', f'{ty(T["tong"])} tỷ ÷ {n(K["tong"])} lượt = {n(T["chiBq"])} nghìn đồng'],
        ['Tháng 9', 'Tổng thu của «Tháng» = 9', f'{ty(T["tongT"][8])} tỷ đồng'],
    ])
    H(f'{b}.5. Biểu đồ', 3)
    chart(f'{b}.1', 'Tổng thu theo tháng', 'Biểu đồ cột xếp chồng',
          'Trục ngang: «Tháng» 1 → 9; mỗi cột chia 3 phần: Lưu trú và ăn uống / Lữ hành / Dịch vụ khác',
          'Tỷ đồng; số ở đầu cột = tổng thu từ khách du lịch của tháng',
          ['Nhóm theo «Tháng» và «Loại doanh thu»:', 'Lưu trú và ăn uống = TỔNG(DT01); Lữ hành = TỔNG(DT02);', 'Dịch vụ khác = TỔNG(DT03) − TỔNG(DT01) − TỔNG(DT02); cả cột = TỔNG(DT03).'],
          ' · '.join(f'{TH[m]}: {ty(T["ltauT"][m])} + {ty(T["lhT"][m])} + {ty(T["khacT"][m])} = {ty(T["tongT"][m])}' for m in (1, 8)))
    chart(f'{b}.2', 'Cơ cấu tổng thu — 9 tháng', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng thu',
          f'3 phần như biểu đồ {b}.1', 'Tỷ đồng; di chuột hiện thêm tỷ trọng %', f'Cộng tháng 1 – 9 của 3 phần ở biểu đồ {b}.1.',
          ' · '.join(f'{CC[i].split(" (")[0]} {ty(v)} ({pc(v, T["tong"])})' for i, v in enumerate([T['ltau'], T['lh'], T['khac']])) + f' → giữa vòng {ty(T["tong"])}')
    lt = sorted(range(len(L)), key=lambda i: -T['tongLoai'][i])
    chart(f'{b}.3', 'Tổng thu theo loại điểm du lịch — 9 tháng', 'Biểu đồ cột ngang',
          f'Trục dọc: {len(L)} giá trị của «Loại điểm du lịch», xếp từ lớn xuống', 'Tỷ đồng',
          'Nhóm theo «Loại điểm du lịch»: TỔNG(DT03), tháng 1 – 9, 126 phường/xã.',
          ' · '.join(f'{L[i]} {ty(T["tongLoai"][i])}' for i in lt[:3]) + f' … {L[lt[-1]]} {ty(T["tongLoai"][lt[-1]])}')
    chart(f'{b}.4', '15 phường/xã có tổng thu lớn nhất — 9 tháng', 'Biểu đồ cột ngang',
          'Trục dọc: 15 «Đơn vị báo cáo» có tổng thu lớn nhất, xếp từ lớn xuống', 'Tỷ đồng',
          'Nhóm theo «Đơn vị báo cáo»: TỔNG(DT03), tháng 1 – 9, mọi loại điểm; lấy 15 đơn vị đầu.',
          ' · '.join(f'{r[0]} {ty(r[1])}' for r in T['top'][:3]))
    notes(str(b), ['Eform doanh thu lặp lại 2 trường «Số lượt khách du lịch quốc tế» và «Số lượt khách du lịch nội địa» của eform khách. IOC chỉ lấy lượt khách từ eform khách. Đề nghị bỏ 2 trường này khỏi eform doanh thu để đơn vị không phải nhập hai lần, tránh hai số lệch nhau.',
                   '«Đơn vị báo cáo» ở eform doanh thu đang là kiểu Chữ (eform khách là Danh mục). Đề nghị đổi sang Danh mục để gõ đúng tên phường/xã; nếu gõ sai tên, bản ghi không khớp được với bảng 126 phường/xã.',
                   '«Tổng thu từ khách du lịch» (DT03) được hiểu là tổng, đã gồm doanh thu lưu trú – ăn uống (DT01) và lữ hành (DT02); IOC tính phần dịch vụ khác = DT03 − DT01 − DT02. Đề nghị Sở xác nhận; nếu DT03 không gồm DT01, DT02 thì tổng thu phải tính bằng cộng cả ba.',
                   'Bộ chỉ tiêu cũ tách tổng thu theo khách nội địa / khách quốc tế; eform mới không có. Nếu Sở cần, đề nghị bổ sung «Nhóm khách» (Nội địa / Quốc tế) vào eform doanh thu.',
                   'Dữ liệu mẫu: một bản ghi ghi «Loại điểm du lịch» = Làng nghề nhưng doanh thu là "Doanh thu dịch vụ du lịch lữ hành" 6 tỷ đồng. Đề nghị xác nhận doanh thu lữ hành có ghi theo loại điểm hay chỉ ghi chung cho cả phường/xã (khi đó «Loại điểm du lịch» để trống hoặc chọn "Khác").'])
