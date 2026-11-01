# -*- coding: utf-8 -*-
"""Sinh docs/XA_XaPhuong/XA_SRS_CHI_TIEU_XA_PHUONG_2026_10_28.docx + .md — Đặc tả yêu cầu phần mềm (SRS) phân hệ chỉ tiêu cấp xã,
phường theo 12 eform, bản 3.0 (02/11/2026): 12 eform trên khung chung js/features/ctm-eform.js theo bản đọc docs/BAN_DOC_EFORM/XA_*
(duyệt 30/10, sửa 02/11/2026). Bản 2.1 lưu ở XA_SRS_CHI_TIEU_XA_PHUONG_2026_10_28_ban2.1.*.
Chạy từ thư mục gốc ioc:  python3 tools/xa_srs_docx.py      (cần python-docx; Node lấy từ biến NODE hoặc PATH)
Khung eform, chỉ tiêu, cách tính, biểu đồ, ô số, số mẫu đọc thẳng từ code (tools/tp_srs_dump.js xa) nên luôn khớp giao diện; phần yêu
cầu chức năng, phi chức năng viết theo hành vi của ctm-eform.js, ctm-engine.js, ctm-xa-eform.js, login.js, indicators.js, sidebar-org.js."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from xa_doc_chung import ROOT, D, U, EFS, N_EF, N_FIELD, N_CHI, TRUC, BD, CHUNG, CAU_CHUNG, eform_detail

OUT = os.path.join(ROOT, 'docs', 'XA_XaPhuong', 'XA_SRS_CHI_TIEU_XA_PHUONG_2026_10_28.docx')
VER, NGAY = '3.0', '02/11/2026'
SHEET_URL = 'https://docs.google.com/spreadsheets/d/1n1UHGnQ4sULz6_D9J0D2N02B0grCc8RbnLh0h9mY70k'
TESTS = {'xa-eform.test.js': 1792, 'tp-eform.test.js': 1431, 'ctm.test.js': 7563, 'ctm-quy-tac.test.js': 1996}
OV = {o['id']: o for o in D['overviews']}
Fl = D['flags']

k = Kit('Đặc tả yêu cầu phần mềm · Chỉ tiêu cấp xã, phường theo eform · IOC Hà Nội')
para, table, box, heading, note, bullets = k.para, k.table, k.box, k.heading, k.note, k.bullets

# ======================================================= TRANG BÌA
k.blank(3)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule(); k.blank(3)
para('ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)', 22, CENTER, 6, bold=True, color=NAVY, md=False)
k.md.title('Đặc tả yêu cầu phần mềm (SRS) — Phân hệ chỉ tiêu cấp xã, phường theo eform')
para('Phân hệ chỉ tiêu cấp xã, phường', 16, CENTER, 4, bold=True, color=NAVY)
para(f'{N_EF} eform của 4 trục Đảng ủy, HĐND, UBND, Ủy ban MTTQ trong mỗi xã, phường', 13, CENTER, 4, italic=True, color=GREY)
k.blank(3)
table([['Phạm vi', f'Màn hình chỉ tiêu của tài khoản xã, phường (và tài khoản cấp trên xem thay một xã, phường); {N_EF} đơn vị đúng {N_EF} eform, {N_FIELD} trường, {N_CHI} chỉ tiêu; áp dụng cho 126 xã, phường'],
       ['Căn cứ', 'Sheet "XãPhường" của "File mô tả đầu vào eform" (bản 30/10/2026); bản đọc eform xã duyệt 30/10/2026, sửa 02/11/2026; quy ước chỉ tiêu theo eform bản 2.0 (bổ sung E1 ngày 02/11/2026); mã nguồn IOC đang chạy'],
       ['Phiên bản', VER + ' — thay bản 2.1 ngày 29/10/2026 (lưu ở XA_SRS_CHI_TIEU_XA_PHUONG_2026_10_28_ban2.1)'], ['Ngày lập', NGAY]], [3.5, 12.5], header=False, key_col=True, size=12)
k.page_break(); k.toc(); k.page_break()

# ======================================================= 1. GIỚI THIỆU
heading('1. GIỚI THIỆU', 1)
heading('1.1. Mục đích', 2)
para('Tài liệu đặc tả yêu cầu của phân hệ chỉ tiêu cấp xã, phường trên IOC: mỗi xã, phường xem số liệu chính mình đã nhập vào 12 eform, theo đúng trường của eform, đối chiếu được từng số với bản ghi đã nhập. Tài liệu dùng cho nhóm phát triển, kiểm thử và nghiệm thu.')
heading('1.2. Phạm vi', 2)
bullets([f'Trong phạm vi: {N_EF} eform của sheet "XãPhường" — Đảng ủy, HĐND, Ủy ban MTTQ mỗi trục một eform; UBND 9 eform (Hành chính công, Tài chính - Ngân sách, Quản lý văn bản, GPMB, Giáo dục, Y tế, Văn hóa, Nội vụ, Kinh tế xã hội).',
         'Màn ngoài tài khoản xã, phường (tab "Tất cả" và tab từng trục), popup chi tiết từng eform (tổng quan, «Tất cả nhóm», từng nhóm, Dữ liệu đã nhập), xuất Excel.',
         'Ngoài phạm vi: nối API dữ liệu thật (sheet "API cần IOC cung cấp": 11 API xã, phường đều "Chưa cung cấp"); so sánh 126 xã, phường cho tài khoản xã (chốt 27/10/2026); nhập liệu eform.'])
heading('1.3. Thuật ngữ', 2)
table([['Thuật ngữ', 'Nghĩa'],
       ['Eform', 'Biểu mẫu nhập số liệu của xã, phường; khung trường, kiểu, danh mục lấy từ sheet "XãPhường"'],
       ['Bản ghi', 'Một lần nhập của eform (một dòng ở màn Dữ liệu đã nhập)'],
       ['Khóa bản ghi', 'Các trường xác định một bản ghi (bản đọc); cùng khóa, cùng kỳ là bản gửi lại'],
       ['Nhóm', 'Một giá trị của trường danh mục chia nhóm của eform; mỗi nhóm một màn'],
       ['Dòng số liệu', 'Các bản ghi giống nhau ở mọi trường mô tả của eform (VD «Tên chỉ tiêu», «Đơn vị tính»); một dòng là một chỉ tiêu do xã nhập'],
       ['IOC tính', 'Số IOC tính thêm từ trường eform (tỷ lệ…), ghi rõ công thức theo tên trường'],
       ['Bản đọc eform', 'Tài liệu đọc từng eform đã duyệt: bản ghi, khóa, loại số, vai trò trường, chỉ tiêu, biểu đồ (docs/BAN_DOC_EFORM/XA_*)']], [4.0, 12.0], size=10.5)
heading('1.4. Tài liệu liên quan', 2)
bullets([f'File mô tả đầu vào eform: {SHEET_URL} (sheet "XãPhường")', 'Bản đọc 12 eform xã: docs/BAN_DOC_EFORM/XA_00_TONG_HOP … XA_12_MTTQ_2026_10_30.md',
         'Quy ước chỉ tiêu theo eform: docs/CHUNG/QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28.md (tóm tắt ở AGENTS.md)', 'Tài liệu mô tả chỉ tiêu xã: docs/XA_XaPhuong/XA_MO_TA_CHI_TIEU.docx'])
heading('1.5. Quy ước mã yêu cầu', 2)
para('FR — yêu cầu chức năng; DR — yêu cầu dữ liệu; BR — quy tắc nghiệp vụ; NFR — yêu cầu phi chức năng; TC — kịch bản nghiệm thu.')

# ======================================================= 2. TỔNG QUAN
heading('2. MÔ TẢ TỔNG QUAN', 1)
heading('2.1. Bối cảnh', 2)
para('Từ 01/7/2025 chính quyền địa phương hai cấp: 126 xã, phường báo cáo qua eform. Bộ chỉ tiêu cũ của IOC (19 đơn vị theo phòng ban, số giả lập) được thay bằng chỉ tiêu dựng hoàn toàn từ trường của 12 eform, để người nhập kiểm tra được số đã đẩy lên IOC.')
table([['#', 'Eform', 'Trục', 'Trường', 'Chỉ tiêu', 'Nhóm']] + [[str(i + 1), e['efTen'], TRUC[u['role']], str(len(e['fields'])), str(len(e['chi'])), str(len(e['tach']['nhom'])) if e['tach'] else '—'] for i, (u, e) in enumerate(EFS)],
      [0.8, 6.0, 2.8, 1.8, 1.8, 1.8], size=10)
heading('2.2. Chức năng chính', 2)
bullets(['Màn ngoài theo 4 trục với ô số then chốt đúng câu CHUNG-3 của bản đọc.', 'Popup chi tiết mỗi eform: ô số, «Tất cả nhóm» và từng nhóm (thẻ so sánh, biểu đồ qua các kỳ, biểu đồ theo trường, bảng nhiều cấp).',
         'Dữ liệu đã nhập: đủ mọi trường, đánh dấu bản ghi cần xem lại; lần lại từ mọi số đến bản ghi.', 'Xem theo Tháng / Quý / Năm; so kỳ liền trước hoặc cùng kỳ (số lũy kế); xuất Excel.'])
heading('2.3. Người dùng và quyền xem', 2)
bullets(['Tài khoản xã, phường: chỉ xem số của chính mình (không có bảng, hạng 126 xã — chốt 27/10/2026); tab "Tất cả" gộp 4 trục (cờ CTM_XA_ALL_TAB).',
         'Tài khoản cấp trên (Thành ủy…): "Xem theo cơ cấu tổ chức" chọn một xã, phường để xem đúng như tài khoản xã đó (câu CHUNG-1; sidebar-org.js viewAsUnit).',
         'Tên đơn vị đổi theo loại: "phường" hoặc "xã" theo đơn vị đang xem.'])
heading('2.4. Ràng buộc thiết kế', 2)
bullets(['Eform là nguồn duy nhất; không thêm chỉ tiêu, ô số, biểu đồ ngoài bản đọc đã duyệt — kể cả số đếm (E1, bổ sung 02/11/2026).',
         'Không cộng các chỉ tiêu, tình trạng, tổ chức, đơn vị tính khác nhau thành một số (X7); kiểm thử tự động chặn ở mọi ô số và biểu đồ.',
         'Khung eform sinh từ file, không sửa tay (tools/xa_eform_schema.py, --check trước khi phát hành); một khung chỉ tiêu chung cho xã, 4 trục, sở (js/features/ctm-eform.js).'])
heading('2.5. Giả định và phụ thuộc', 2)
bullets(['Chưa có API xã, phường: màn hình chạy bằng bản ghi mẫu dựng đúng khung eform (cờ XA_EF_LA_MAU), ghi rõ "bản ghi mẫu".', 'Khi có API: thay hàm nguồn XA_EF_NGUON(mã eform, xã) trả mảng bản ghi { mã trường: giá trị } — màn hình không đổi.',
         'File eform có thể đổi bất cứ lúc nào: tải bản mới, chạy --check, sinh lại khung và bản đọc trước khi phát hành.'])

# ======================================================= 3. YÊU CẦU CHỨC NĂNG
heading('3. YÊU CẦU CHỨC NĂNG', 1)


def fr(code, title, rows, ac):
    heading(f'{code}. {title}', 2)
    table([['Mục', 'Nội dung']] + [[a, b if isinstance(b, str) else '\n'.join('• ' + x for x in b)] for a, b in rows], [3.2, 12.8], size=10)
    para('**Tiêu chí chấp nhận**:', 10.5, after=2)
    bullets(ac, 10.5)


fr('FR-01', 'Xác định xã, phường đang xem', [['Kích hoạt', 'Đăng nhập tài khoản xã, phường; hoặc tài khoản cấp trên chọn "Xem theo cơ cấu tổ chức" một xã, phường.'],
    ['Xử lý', ['Mọi số, biểu đồ, bản ghi của 12 eform chỉ lấy bản ghi của xã, phường đó (XA_EF_NGUON(mã eform, xã)).', 'Đổi chữ "phường" ↔ "xã" theo loại đơn vị ở tên đơn vị, tên trục.']]],
   ['Phường Việt Hưng và Xã Ba Vì ra số khác nhau, đúng bản ghi của từng nơi.', 'Tài khoản cấp trên xem thay thấy đúng màn của xã đã chọn.'])
fr('FR-02', 'Màn ngoài — tab "Tất cả" và tab từng trục', [['Kích hoạt', 'Mở mục Chỉ tiêu của tài khoản xã, phường.'],
    ['Xử lý', ['Tab "Tất cả": ' + '; '.join(x['l'] for x in OV['xa-4truc']['kpis']) + '.', 'Tab từng trục: ô số của trục theo câu CHUNG-3; danh sách thẻ eform của trục.',
              'Bấm ô số mở popup eform ở màn Dữ liệu đã nhập, lọc đúng các bản ghi tạo ra số.']]],
   ['Ô số đúng danh sách câu CHUNG-3, không thêm, không bớt.', 'Mọi ô có số với bản ghi mẫu; bấm ô ra đúng bản ghi.'])
fr('FR-03', 'Popup eform — Tổng quan', [['Xử lý', ['Thanh công cụ: "Xem theo" (Tháng / Quý / Năm), "Kỳ báo cáo", "Nhập chỉ tiêu", "Xuất Excel".', 'Hàng ô số của eform đúng bản đọc (mục 5); bấm ô mở bản ghi tạo ra số.',
                                                     'Thẻ "Dữ liệu đã nhập", thẻ «Tất cả nhóm» và mỗi nhóm một thẻ (tối đa 4 dòng số liệu đầu có số).']]],
   ['Ô số của từng eform khớp danh sách mục 5.'])
fr('FR-04', 'Popup eform — màn nhóm', [['Xử lý', ['Thẻ so sánh kỳ này – kỳ trước theo dòng số liệu (cùng đơn vị tính); dòng tỷ lệ vẽ thành thẻ tỷ lệ.', 'Biểu đồ qua các kỳ: dòng đầu có số đổi giữa các kỳ, hoặc dòng người xem chọn (Kinh tế xã hội).',
                                                  'Các biểu đồ theo trường của eform đúng bản đọc; biểu đồ có thể chỉ hiện ở một số nhóm hoặc chỉ ở «Tất cả nhóm».', 'Bảng nhiều cấp đặt dưới biểu đồ, 12 dòng đầu, "Xem đủ"; dòng gộp nhiều chỉ tiêu, nhiều đơn vị tính ghi "—".',
                                                  'Kỳ chưa có bản ghi: báo rõ, ghi số bản ghi kỳ dài hơn không hiện, nút sang kỳ gần nhất có số.']]],
   ['Không biểu đồ nào cộng các chỉ tiêu, tình trạng, tổ chức, đơn vị tính khác nhau.', 'Biểu đồ đặt trên bảng; bấm cột, thanh, dòng ra bản ghi.'])
fr('FR-05', 'Dữ liệu đã nhập', [['Xử lý', ['Bảng STT + đủ mọi trường của eform, đúng thứ tự, tên cột đúng như eform; danh mục hiện tên hiển thị; chữ hiện đúng như gõ.', 'Ô đếm: bản ghi kỳ, số trường, cần xem lại, bản ghi mọi kỳ; lọc theo nhóm, "Cần xem lại"; tìm chữ.',
                                           'Bản ghi không dùng ở phần tổng hợp ghi lý do ở cột STT (bị bản sau thay, trùng bản tháng, bản ưu tiên…); ô lỗi tô màu, rê chuột xem lý do.']]],
   ['Đủ cột, đúng tên, đúng thứ tự ở cả 12 eform.', 'Bản ghi lỗi được tô màu, có lý do.'])
fr('FR-06', 'Lần lại từ số đến bản ghi', [['Xử lý', ['Mọi ô số, dòng thẻ so sánh, cột qua các kỳ (chuyển sang kỳ của cột), thanh biểu đồ, tên dòng ở bảng mở Dữ liệu đã nhập lọc đúng các bản ghi tạo ra số (cùng cách chọn bản ghi như khi tính).',
                                                     'Đầu bảng ghi "Đang xem các bản ghi tạo ra số «…» (cách tính)" và nút "Bỏ lọc".']]], ['Bấm số nào cũng ra bản ghi; số bản ghi khớp số.'])
fr('FR-07', 'Kỳ xem, so sánh', [['Xử lý', ['Tháng / Quý / Năm, từ tháng 7/2025; năm 2025 ghi "(từ tháng 7)".', 'Số phát sinh, số tại thời điểm so kỳ liền trước cùng loại; số lũy kế so cùng kỳ năm trước (chưa có thì ghi rõ); số kế hoạch không so; màu trung tính.']]],
   ['Đổi kỳ thì mọi số, biểu đồ, bản ghi đổi theo.'])
fr('FR-08', 'Xuất Excel', [['Xử lý', 'Trang "Chỉ tiêu"; trang "Dữ liệu đã nhập" (STT, Ghi chú IOC, đủ mọi trường).']], ['Tệp mở được, đủ cột.'])
fr('FR-09', 'Đối chiếu khung eform với file', [['Xử lý', ['tools/xa_eform_schema.py <file.xlsx> --check báo eform, trường thêm / bỏ / đổi và lỗi trong file.', 'Sinh lại khung (không sửa tay), rồi sinh lại bản đọc (tools/xa_ban_doc_eform.py) và tài liệu.']]],
   ['--check báo "Khớp" trước khi phát hành.'])

# ======================================================= 4. DỮ LIỆU, QUY TẮC
heading('4. YÊU CẦU DỮ LIỆU VÀ QUY TẮC NGHIỆP VỤ', 1)
heading('4.1. DR-01. Khung eform', 2)
para(f'js/core/xa-eform.js sinh từ sheet "XãPhường" bằng tools/xa_eform_schema.py: {N_EF} eform, {N_FIELD} trường, đúng thứ tự, kiểu, danh mục (mã chuẩn hóa không dấu, không ký tự ẩn). Trên khung chung mỗi eform có mã "xa_" + mã eform.')
heading('4.2. DR-02. Nguồn bản ghi', 2)
para('XA_EF_NGUON(mã eform, xã) trả mảng bản ghi { mã trường: giá trị }. Hiện là bản ghi mẫu (js/core/xa-eform-mau.js); có API thì thay hàm này và đặt XA_EF_LA_MAU = false.')
heading('4.3. DR-03. Kỳ báo cáo và xếp kỳ', 2)
bullets(['Bản ghi xếp vào kỳ theo «Kỳ báo cáo» (Tháng / Quý / Năm, IOC hiện tên theo mã khi file ghi lệch), «Năm», «Tháng», «Quý».', 'Xem quý gồm bản tháng và bản quý của quý; xem năm gồm mọi bản của năm; bản kỳ dài hơn kỳ đang xem không vào tổng hợp, có ghi số bản.'])
heading('4.4. Quy tắc nghiệp vụ', 2)
table([['Mã', 'Quy tắc'],
       ['BR-01', 'Cùng khóa, cùng kỳ có nhiều bản: lấy bản gửi sau (X1); bản bị thay vẫn hiện ở Dữ liệu đã nhập, ghi lý do.'],
       ['BR-02', 'Cùng khóa trong kỳ xem có bản tháng thì không cộng chồng bản quý, bản năm (X2).'],
       ['BR-03', 'Số tại thời điểm lấy bản cuối kỳ mỗi khóa; số đầu kỳ (VD số kỳ trước chuyển qua) lấy bản đầu kỳ; một trường số trộn hai kiểu số thì tách theo bản đọc.'],
       ['BR-04', 'Chỉ cộng cùng một trường số của các bản ghi giống nhau ở mọi trường mô tả; không cộng các chỉ tiêu, tình trạng, tổ chức, đơn vị tính khác nhau (X7); trừ chỗ bản đọc cho cộng (VD các «Đơn vị» của Hành chính công, các dự án của GPMB).'],
       ['BR-05', 'Trường tỷ lệ, trường tổng đã nhập hiện đúng số; IOC tính tỷ lệ chỉ khi eform có tử số, mẫu số, ghi "(IOC tính)"; kiểm tổng khi eform có trường tổng và thành phần, lệch thì đánh dấu (X5).'],
       ['BR-06', 'Dòng "Tổng số" không cộng chồng với dòng thành phần (G5).'],
       ['BR-07', 'Trường Chữ gộp khi chữ giống nhau sau khi bỏ khoảng trắng thừa, không phân biệt hoa thường; Dữ liệu đã nhập hiện đúng chữ gốc (G8).'],
       ['BR-08', 'Ô số, biểu đồ chỉ đúng bản đọc; không thêm, kể cả số đếm (E1 bổ sung 02/11/2026).']], [2.0, 14.0], size=10)
heading('4.5. Phần chung của bản đọc', 2)
bullets(CHUNG, 10)
heading('4.6. Bản ghi mẫu', 2)
para('Bản ghi theo tháng hoặc quý tùy eform, từ tháng 7/2025; số theo quy mô dân số xã, phường, hạt giống cố định; giữ quan hệ hợp lý (tổng = cộng thành phần, lũy kế tăng dần, số từng phòng là phần của số cả xã); cố ý có bản gửi lại (X1), bản quý trùng bản tháng (X2), vài xã có bản lệch tổng, lệch tỷ lệ (X5) để thử màn Dữ liệu đã nhập.')

# ======================================================= 5. 12 EFORM
heading(f'5. DANH MỤC {N_EF} EFORM', 1)
para(f'Mỗi mục đọc thẳng từ cấu hình đang chạy; số mẫu của {D["xa"]}. Chi tiết lý do từng lựa chọn ở bản đọc eform.')
for i, (u, e) in enumerate(EFS):
    eform_detail(k, u, e, f'5.{i + 1}', D['xa'])

# ======================================================= 6. PHI CHỨC NĂNG
heading('6. YÊU CẦU PHI CHỨC NĂNG', 1)
table([['Mã', 'Yêu cầu', 'Cách kiểm'],
       ['NFR-01 Hiệu năng', 'Số của một đơn vị, một kỳ, một xã tính một lần rồi giữ trong bộ nhớ đệm; đổi kỳ, đổi nhóm không tính lại kỳ đã xem.', 'Mở thử trên máy văn phòng'],
       ['NFR-02 Co giãn màn hình', 'Máy tính, máy tính bảng, điện thoại 390px: không tràn ngang trang; bảng Dữ liệu đã nhập cuộn ngang trong khung.', 'Chụp ảnh ở 390px, 1440px'],
       ['NFR-03 Truy cập', 'Dòng thẻ so sánh, cột qua các kỳ, dòng tỷ lệ bấm được dùng được bằng bàn phím (Tab, Enter); thanh biểu đồ là nút bấm.', 'Thử bàn phím'],
       ['NFR-04 Đúng eform', 'Không trường, chỉ tiêu nào ngoài eform và bản đọc; khung sinh từ file.', '--check; kiểm thử tự động'],
       ['NFR-05 Kiểm thử tự động', 'tests/ctm: ' + ', '.join(f'{a} {b:,} phép kiểm'.replace(',', '.') for a, b in TESTS.items()) + f' (chạy {NGAY}, 0 lỗi). xa-eform.test.js kiểm: đủ trường, ô số đúng bản đọc, ô số và mọi biểu đồ không cộng lẫn, lần lại bản ghi, X1, X2, X5, kỳ.', 'node tests/ctm/*.test.js']],
      [3.5, 9.0, 3.5], size=10)

# ======================================================= 7. CẤU HÌNH
heading('7. CẤU HÌNH BẬT, TẮT', 1)
table([['Cờ', 'Giá trị', 'Ý nghĩa'],
       ['CTM_XA_ALL_TAB (js/features/ctm-xa-units.js)', str(Fl['CTM_XA_ALL_TAB']).lower(), 'Tài khoản xã, phường có tab "Tất cả" gộp 4 trục.'],
       ['CTM_XA_SO_SANH (js/features/ctm-xa-units.js)', str(Fl['CTM_XA_SO_SANH']).lower(), 'Màn so với 126 xã, phường ở cấp xã — tắt (chốt 27/10/2026).'],
       ['XA_EF_LA_MAU (js/core/xa-eform-mau.js)', str(Fl['XA_EF_LA_MAU']).lower(), 'Đang dùng bản ghi mẫu; đặt false khi nối dữ liệu thật.']], [6.0, 2.0, 8.0], size=10)

# ======================================================= 8. NGHIỆM THU
heading('8. KỊCH BẢN NGHIỆM THU', 1)
table([['Mã', 'Thao tác', 'Kết quả mong đợi', 'Yêu cầu'],
       ['TC-01', 'Đăng nhập Phường Việt Hưng, mở Chỉ tiêu', 'Tab "Tất cả" đủ ô số câu CHUNG-3, mọi ô có số', 'FR-02'],
       ['TC-02', 'Bấm ô "Tiếp nhận trực tuyến"', 'Mở Dữ liệu đã nhập, chỉ các bản ghi «Chỉ tiêu» = Tiếp nhận trực tuyến của kỳ', 'FR-06'],
       ['TC-03', 'Mở Hành chính công › Số hồ sơ nhận giải quyết', 'Thẻ so sánh, cột qua các kỳ, thanh 4 chỉ tiêu, bảng; dòng Cộng ghi "—"', 'FR-04'],
       ['TC-04', 'Mở MTTQ › Đoàn Thanh niên', 'Số của riêng Đoàn; thu, chi, tồn quỹ của Đoàn; không cộng tổ chức khác', 'FR-04, BR-04'],
       ['TC-05', 'Chọn Xem theo Tháng, eform báo cáo quý', 'Báo chưa có bản ghi, ghi số bản ghi quý không hiện, nút sang quý gần nhất', 'FR-04, FR-07'],
       ['TC-06', 'Tài chính - Ngân sách, Quý 3/2026', 'Tỷ lệ lũy kế so với dự toán so cùng kỳ Quý 3/2025; cột tỷ lệ đã nhập cạnh tỷ lệ IOC tính', 'FR-07'],
       ['TC-07', 'Dữ liệu đã nhập của GPMB', 'Đủ 28 cột; bản gửi lại ghi lý do; bản lệch tổng khu vực con tô màu', 'FR-05, BR-01, BR-05'],
       ['TC-08', 'Tài khoản Thành ủy "Xem theo cơ cấu tổ chức" Xã Ba Vì', 'Thấy đúng màn của Xã Ba Vì, tên ghi "xã"', 'FR-01'],
       ['TC-09', 'Điện thoại 390px, popup Dữ liệu đã nhập', 'Không tràn ngang trang; bảng cuộn ngang trong khung', 'NFR-02']], [1.6, 5.0, 7.2, 2.2], size=9.5)

# ======================================================= 9. HẠN CHẾ
heading('9. HẠN CHẾ HIỆN TẠI VÀ VẤN ĐỀ MỞ', 1)
table([['#', 'Hạn chế', 'Hướng xử lý'],
       ['1', 'Chưa có dữ liệu thật: API xã, phường chưa cung cấp; màn hình chạy bằng bản ghi mẫu.', 'Có API: thay XA_EF_NGUON, đặt XA_EF_LA_MAU = false.'],
       ['2', 'Nhiều trường mô tả là Chữ do xã gõ («Tên chỉ tiêu», «Đơn vị tính» ở Đảng ủy, MTTQ): gõ khác nhau thành dòng khác nhau.', 'Đề nghị bên eform chuyển thành Danh mục (Phụ lục B).'],
       ['3', 'File eform còn lỗi (mã có dấu, ký tự ẩn, «Kỳ báo cáo» ghi tên lệch mã…).', 'IOC đọc theo mã; đề nghị bên eform sửa (Phụ lục B).']], [0.8, 9.0, 6.2], size=10)

# ======================================================= PHỤ LỤC
heading('PHỤ LỤC A. CÂU HỎI ĐÃ CHỐT KHI ĐỌC EFORM', 1)
bullets(CAU_CHUNG, 10)
for _, e in EFS:
    bd = BD[e['ef']]
    para(f'**{e["efTen"]}**: ' + ' '.join(bd['cau']) + ' Trả lời: theo đề xuất.' + (' ' + ' '.join(bd['traloi']) if bd['traloi'] else ''), 10)
heading('PHỤ LỤC B. LỖI TRONG FILE EFORM CẦN BÊN EFORM SỬA', 1)
loi = [(e['efTen'], x) for _, e in EFS for x in BD[e['ef']]['loi']]
table([['#', 'Eform', 'Lỗi, chỗ nghi']] + [[str(j + 1), a, b] for j, (a, b) in enumerate(loi)], [0.8, 4.2, 11.0], size=9)
heading('PHỤ LỤC C. BẢN ĐỒ MÃ NGUỒN', 1)
table([['Tệp', 'Nội dung'],
       ['js/core/xa-eform.js', 'Khung 12 eform, sinh từ file (tools/xa_eform_schema.py)'], ['js/core/xa-eform-mau.js', 'Bản ghi mẫu (XA_EF_NGUON, XA_EF_LA_MAU)'],
       ['js/features/ctm-eform.js', 'Khung chỉ tiêu theo eform dùng chung: kỳ, bản ghi, cách tính, nhóm, dòng số liệu, bảng, biểu đồ, Dữ liệu đã nhập'],
       ['js/features/ctm-xa-eform.js', 'Khai báo 12 eform xã theo bản đọc; màn ngoài tài khoản xã'], ['js/features/ctm-xa-units.js', 'Hàm dùng chung: xã đang xem, đọc mã, tên hiển thị; cờ CTM_XA_ALL_TAB, CTM_XA_SO_SANH'],
       ['js/features/ctm-engine.js', 'Màn hình chung: ô số, thẻ so sánh, cột qua các kỳ, popup, lần lại bản ghi'], ['css/ctm.css', 'Giao diện popup chỉ tiêu'],
       ['tests/ctm/xa-eform.test.js', 'Kiểm thử chỉ tiêu xã'], ['tools/xa_ban_doc_eform.py', 'Sinh bản đọc eform xã'], ['tools/tp_srs_dump.js xa, tools/xa_srs_docx.py, tools/xa_mo_ta_docx.py', 'Sinh tài liệu từ cấu hình đang chạy']], [6.0, 10.0], size=10)
heading('PHỤ LỤC D. LỊCH SỬ PHIÊN BẢN', 1)
table([['Phiên bản', 'Ngày', 'Nội dung'],
       ['1.0', '27/10/2026', '19 đơn vị theo phòng ban, 161 chỉ tiêu, số giả lập và số dùng chung với cấp Thành phố.'],
       ['2.0', '28/10/2026', 'Làm lại theo 12 eform: bỏ mọi chỉ tiêu ngoài eform; màn Dữ liệu đã nhập đủ mọi trường; lần lại từ số đến bản ghi; khung eform sinh từ sheet.'],
       ['2.1', '29/10/2026', 'Khung eform sinh lại theo file eform sửa 28/10/2026; «Kỳ báo cáo», «Quý» hiện tên theo mã; nút ← quay lại màn trước.'],
       [VER, NGAY, 'Theo bản đọc 12 eform (duyệt 30/10, sửa 02/11/2026) trên khung chung ctm-eform.js: khung sinh lại theo file 30/10/2026; xem Tháng / Quý / Năm; X1, X2, X5; chia nhóm, dòng số liệu; mọi số lần lại được bản ghi; ô số đúng bản đọc; không cộng các chỉ tiêu khác nhau.']],
      [2.2, 2.6, 11.2], size=10)
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
uf = OxmlElement('w:updateFields'); uf.set(qn('w:val'), 'true'); k.doc.settings.element.append(uf)
d, m = k.save(OUT)
print(os.path.relpath(d, ROOT)); print(os.path.relpath(m, ROOT))
