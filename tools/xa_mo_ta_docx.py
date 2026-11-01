# -*- coding: utf-8 -*-
"""Sinh docs/XA_XaPhuong/XA_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả chỉ tiêu 12 eform cấp xã, phường (bản 1.0, 02/11/2026).
Chạy từ thư mục gốc ioc:  python3 tools/xa_mo_ta_docx.py      (cần python-docx; Node lấy từ biến NODE hoặc PATH)
Eform, chỉ tiêu, cách tính, biểu đồ, kiểm tra, vai trò từng trường, số mẫu đọc thẳng từ code (tools/tp_srs_dump.js xa) nên luôn khớp
giao diện; lỗi file eform, câu đã chốt, sửa đổi lấy từ bản đọc docs/BAN_DOC_EFORM/XA_*."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from xa_doc_chung import ROOT, D, U, EFS, N_EF, N_FIELD, N_CHI, TRUC, BD, CHUNG, CAU_CHUNG, eform_detail

VER, NGAY = '1.0', '02/11/2026'
k = Kit('Tài liệu mô tả chỉ tiêu · 126 xã, phường · theo eform · IOC Hà Nội')
para, table, heading, note, bullets = k.para, k.table, k.heading, k.note, k.bullets
# ---------- bìa ----------
k.blank(3)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule(); k.blank(3)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY, md=False)
k.md.title('Tài liệu mô tả chỉ tiêu — 126 xã, phường (theo eform)')
para('126 XÃ, PHƯỜNG', 16, CENTER, 4, bold=True, color=NAVY)
para(f'{N_EF} eform · {N_FIELD} trường · {N_CHI} chỉ tiêu dựng từ trường của eform', 13, CENTER, 4, italic=True, color=GREY)
k.blank(3)
table([['Phạm vi', f'Màn hình chỉ tiêu của tài khoản xã, phường (và tài khoản cấp trên xem thay một xã, phường): {N_EF} đơn vị, mỗi đơn vị một eform của sheet "XãPhường"'],
       ['Căn cứ', 'File mô tả đầu vào eform (sheet "XãPhường", bản 30/10/2026); bản đọc eform xã đã duyệt 30/10/2026, sửa 02/11/2026 (docs/BAN_DOC_EFORM/XA_*); quy ước chỉ tiêu theo eform bản 2.0 (bổ sung E1 ngày 02/11/2026); mã nguồn IOC đang chạy'],
       ['Phiên bản', VER], ['Ngày lập', NGAY]], [3.5, 12.5], header=False, key_col=True, size=12)
k.page_break(); k.toc(); k.page_break()
# ---------- I. quy ước ----------
heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Nguyên tắc', 2)
bullets(['**Eform là nguồn duy nhất**: chỉ tiêu, ô số, biểu đồ chỉ dựng từ trường của eform và đúng bản đọc đã duyệt — kể cả số đếm cũng không tự thêm.',
         '**Không cộng lẫn**: không cộng các chỉ tiêu, tình trạng, tổ chức, đơn vị tính khác nhau thành một số; chỉ cộng cùng một trường số của các bản ghi giống nhau ở mọi trường mô tả (trừ chỗ bản đọc cho cộng). Bảng nhiều cấp ghi "—" ở dòng gộp nhiều chỉ tiêu.',
         '**Hiện đủ mọi trường**: màn "Dữ liệu đã nhập" hiện mọi bản ghi, đủ mọi trường, đúng thứ tự, tên cột đúng như eform; chữ đã nhập hiện đúng như gõ.',
         '**Số đã nhập là số hiển thị**: trường tỷ lệ, trường tổng đã nhập hiện đúng số; số IOC tính ghi rõ "(IOC tính)" và công thức theo tên trường; lệch thì đánh dấu bản ghi.',
         '**Mọi số lần lại được bản ghi**: bấm ô số, dòng thẻ so sánh, cột qua các kỳ, thanh biểu đồ, tên dòng ở bảng → các bản ghi tạo ra số đó.'])
heading('2. Phần chung của bản đọc', 2)
bullets(CHUNG, 10.5)
heading('3. Kỳ xem và quy tắc bản ghi', 2)
bullets(['Chọn **Tháng / Quý / Năm**, kỳ từ tháng 7/2025 (chính quyền hai cấp); bản ghi xếp vào kỳ theo «Kỳ báo cáo», «Năm», «Tháng», «Quý».',
         'Cùng khóa, cùng kỳ có hai bản thì lấy bản gửi sau (bản bị thay vẫn hiện, ghi lý do); cùng khóa có bản tháng thì không cộng chồng bản quý, bản năm.',
         'Bản ghi kỳ dài hơn kỳ đang xem (bản quý khi xem theo tháng…) không vào phần tổng hợp; màn hình ghi rõ có bao nhiêu bản như vậy.',
         'Số tại thời điểm lấy bản cuối kỳ; số lũy kế so cùng kỳ năm trước; số phát sinh, số tại thời điểm so kỳ liền trước cùng loại; số kế hoạch không so tăng giảm. Màu trung tính.',
         'Chưa có dữ liệu thật (API xã, phường chưa cung cấp): màn hình chạy bằng **bản ghi mẫu** dựng đúng khung eform, ghi rõ trên màn hình.'])
heading(f'4. {N_EF} eform', 2)
table([['#', 'Eform (đúng tên trong file)', 'Trục', 'Nhóm', 'Trường', 'Chỉ tiêu', 'Ô số']] +
      [[str(i + 1), e['efTen'], TRUC[u['role']], str(len(e['tach']['nhom'])) if e['tach'] else '—', str(len(e['fields'])), str(len(e['chi'])), str(len(u['kpis']))] for i, (u, e) in enumerate(EFS)],
      [0.8, 5.4, 2.6, 1.5, 1.6, 1.6, 1.5], size=10)
# ---------- II. màn hình ----------
heading('PHẦN II. MÀN HÌNH', 1)
heading('1. Màn ngoài tài khoản xã, phường', 2)
OV = {o['id']: o for o in D['overviews']}
bullets(['Tab "Tất cả" (4 trục) và tab từng trục; ô số then chốt đúng câu CHUNG-3 của bản đọc, bấm ô mở thẳng các bản ghi tạo ra số.',
         'Tab "Tất cả": ' + '; '.join(x['l'] for x in OV['xa-4truc']['kpis']) + '.',
         'Danh sách thẻ eform theo trục; bấm thẻ mở popup chi tiết của eform.'])
heading('2. Popup chi tiết một eform', 2)
bullets(['Thanh công cụ: "Xem theo" (Tháng / Quý / Năm), "Kỳ báo cáo", "Nhập chỉ tiêu", "Xuất Excel"; nút "←" quay lại màn trước.',
         'Tổng quan: hàng ô số của eform (đúng bản đọc), thẻ "Dữ liệu đã nhập", thẻ «Tất cả nhóm» và mỗi nhóm một thẻ.',
         'Màn nhóm: thẻ so sánh kỳ này – kỳ trước theo từng dòng số liệu, biểu đồ qua các kỳ, các biểu đồ theo trường của eform (Phần III), bảng nhiều cấp đặt dưới (12 dòng, "Xem đủ"); kỳ chưa có bản ghi thì báo rõ và có nút sang kỳ gần nhất có số.',
         'Dữ liệu đã nhập: ô đếm; lọc theo nhóm, "Cần xem lại"; tìm chữ; bảng STT + đủ mọi trường; bản ghi không dùng ghi lý do ở cột STT; ô lỗi tô màu, rê chuột xem lý do.',
         'Xuất Excel: trang "Chỉ tiêu", trang "Dữ liệu đã nhập" (STT, Ghi chú IOC, đủ mọi trường).'])
# ---------- III. từng eform ----------
heading('PHẦN III. CHI TIẾT TỪNG EFORM', 1)
for i, (u, e) in enumerate(EFS):
    eform_detail(k, u, e, str(i + 1), D['xa'])
# ---------- IV. lỗi, câu chốt ----------
heading('PHẦN IV. LỖI FILE EFORM VÀ CÁC CÂU ĐÃ CHỐT', 1)
note('Lỗi, chỗ nghi trong file eform (từ bản đọc) — IOC hiện đúng như file; đề nghị bên eform rà soát')
loi = [(e['efTen'], x) for _, e in EFS for x in BD[e['ef']]['loi']]
table([['#', 'Eform', 'Lỗi, chỗ nghi']] + [[str(j + 1), a, b] for j, (a, b) in enumerate(loi)], [0.8, 4.2, 11.0], size=9)
para('**Câu hỏi chung đã chốt**:', after=2)
bullets(CAU_CHUNG, 10)
for _, e in EFS:
    bd = BD[e['ef']]
    para(f'**{e["efTen"]}** — câu hỏi: ' + ' '.join(bd['cau']) + (' Trả lời: theo đề xuất. ' + ' '.join(bd['traloi']) if bd['traloi'] else ' Trả lời: theo đề xuất.'), 10)
# ---------- phụ lục ----------
heading('PHỤ LỤC. MÃ NGUỒN, LỊCH SỬ PHIÊN BẢN', 1)
table([['Tệp', 'Nội dung'],
       ['js/core/xa-eform.js', 'Khung 12 eform xã, phường, sinh từ file (tools/xa_eform_schema.py, không sửa tay)'],
       ['js/features/ctm-eform.js', 'Khung chỉ tiêu theo eform dùng chung cho xã, 4 trục, sở: kỳ, bản ghi, cách tính, nhóm, dòng số liệu, bảng, biểu đồ, Dữ liệu đã nhập'],
       ['js/features/ctm-xa-eform.js', 'Khai báo 12 eform xã theo bản đọc, màn ngoài tài khoản xã'],
       ['js/features/ctm-xa-units.js', 'Hàm dùng chung: xã đang xem, đọc mã, tên hiển thị, ngày, đơn vị'],
       ['js/core/xa-eform-mau.js', 'Bản ghi mẫu theo khung eform (cờ XA_EF_LA_MAU)'],
       ['tests/ctm/xa-eform.test.js', 'Kiểm thử: đủ trường, ô số đúng bản đọc, không cộng lẫn ở ô số và biểu đồ, lần lại bản ghi, X1, X2, X5, kỳ'],
       ['tools/tp_srs_dump.js xa, tools/xa_mo_ta_docx.py', 'Sinh tài liệu này từ cấu hình đang chạy']], [6.0, 10.0], size=10)
table([['Phiên bản', 'Ngày', 'Nội dung'], [VER, NGAY, f'Lập theo {N_EF} eform trên khung chung, theo bản đọc duyệt 30/10/2026 và sửa 02/11/2026']], [2.2, 2.6, 11.2], size=10.5)
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
uf = OxmlElement('w:updateFields'); uf.set(qn('w:val'), 'true'); k.doc.settings.element.append(uf)
d, m = k.save(os.path.join(ROOT, 'docs', 'XA_XaPhuong', 'XA_MO_TA_CHI_TIEU.docx'))
print(f'XA: {N_EF} eform, {N_FIELD} trường, {N_CHI} chỉ tiêu, {len(loi)} lỗi file → {os.path.relpath(d, ROOT)}, {os.path.relpath(m, ROOT)}')
