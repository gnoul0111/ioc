# -*- coding: utf-8 -*-
"""Sinh tài liệu mô tả chỉ tiêu theo eform của từng sở, ngành cấp Thành phố: docs/<ĐƠN VỊ>/<MÃ>_MO_TA_CHI_TIEU.docx + .md
(bản 2.0, thay bản 27/10/2026 theo bộ chỉ tiêu cũ — bản cũ lưu ở docs/_CU_2026_10_27/).
Chạy từ thư mục gốc ioc:  python3 tools/so_mo_ta_docx.py [mã đơn vị …]   (cần python-docx; Node lấy từ biến NODE hoặc PATH)
Eform, chỉ tiêu, cách tính, biểu đồ, kiểm tra, vai trò từng trường và số mẫu đọc thẳng từ code qua tools/tp_srs_dump.js nên luôn
khớp giao diện; lỗi file eform và các câu đã chốt lấy từ bản đọc eform (docs/BAN_DOC_EFORM). Phần màn hình viết theo hành vi chung
của js/features/ctm-eform.js (thay các file *_MAN_HINH_CHI_TIEU.md cũ)."""
import json, os, re, shutil, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NODE = os.environ.get('NODE') or shutil.which('node')
if not NODE:
    raise SystemExit('Không tìm thấy Node: đặt biến NODE=<đường dẫn node> (hoặc Electron, tool tự bật ELECTRON_RUN_AS_NODE).')
D = json.loads(subprocess.run([NODE, 'tools/tp_srs_dump.js'], cwd=ROOT, capture_output=True, check=True,
                              env=dict(os.environ, ELECTRON_RUN_AS_NODE='1')).stdout.decode('utf-8'))
VER, NGAY = '2.0', '29/10/2026'
SHEET_URL = 'https://docs.google.com/spreadsheets/d/1n1UHGnQ4sULz6_D9J0D2N02B0grCc8RbnLh0h9mY70k'
KIEU = {'dm': 'Danh mục', 'so': 'Số', 'chu': 'Chữ', 'ngay': 'Ngày tháng'}
# đơn vị → (thư mục, mã tệp, bản đọc eform, chỉ lấy các eform có tiền tố …)
DV = {
    'ubnd-vpubnd': ('VPUB_VanPhongUBND', 'VPUB', ['TRUC_UBND_VPUB'], None),
    'ubnd-thanhtra': ('TTRA_ThanhTraThanhPho', 'TTRA', ['SO_THANH_TRA'], None),
    'ubnd-congthuong': ('SCT_SoCongThuong', 'SCT', ['SO_CONG_THUONG'], None),
    'ubnd-noivu': ('SNV_SoNoiVu', 'SNV', ['SO_NOI_VU'], None),
    'ubnd-nnmt': ('NNMT_SoNongNghiepMoiTruong', 'NNMT', ['SO_NNMT'], None),
    'ubnd-khcn': ('KHCN_SoKhoaHocCongNghe', 'KHCN', ['SO_KHCN'], None),
    'ubnd-xaydung': ('SXD_SoXayDung', 'SXD', ['SO_XAY_DUNG'], None),
    'ubnd-dantoc-tongiao': ('DTTG_SoDanTocTonGiao', 'DTTG', ['SO_DTTG'], None),
    'ubnd-yte': ('SYT_SoYTe', 'SYT', ['SO_Y_TE'], None),
    'ubnd-vhtt': ('VHTT_SoVanHoaTheThao', 'VHTT', ['SO_VHTT', 'SO_DU_LICH'], None),
    'ubnd-bqlkcnc': ('BQL_BanQuanLyKCNC_KCN', 'BQL', ['SO_BQL_KCNC'], None),
    'dl': ('DL_SoDuLich', 'DL', ['SO_DU_LICH'], 'dl'),
}
UNITS = {u['id']: u for u in D['units']}


def dm_text(f):
    if not f['dm']:
        return '—'
    if f['t'] != 'dm':
        return f'— (file kèm {len(f["dm"])} giá trị; trường {KIEU.get(f["t"], "để trống kiểu")} nên hiện đúng chữ đã nhập)'
    if len(f['dm']) == 126:
        return '126 xã, phường'
    return f'{len(f["dm"])} mã: ' + ', '.join(f['dm'][:4]) + (f', … (+{len(f["dm"]) - 4})' if len(f['dm']) > 4 else '')


def ban_doc(names):
    """Lỗi file eform (theo tên eform) và các câu hỏi – trả lời đã chốt trong bản đọc eform"""
    loi, chot = [], []
    for nm in names:
        p = os.path.join(ROOT, 'docs', 'BAN_DOC_EFORM', nm + '_2026_10_28.md')
        if not os.path.exists(p):
            continue
        t = open(p, encoding='utf-8').read()
        for sec in re.split(r'\n## ', t)[1:]:
            title = sec.split('\n', 1)[0]
            if '**Lỗi, chỗ nghi trong file eform:**' in sec and re.match(r'\d+\. ', title):
                for ln in sec.split('**Lỗi, chỗ nghi trong file eform:**', 1)[1].strip().split('\n'):
                    if not ln.startswith('- '):
                        break
                    loi.append((title.split('. ', 1)[1].strip(), ln[2:].strip()))
            elif re.match(r'(CÁC CÂU|CÂU HỎI)', title):
                chot += [re.sub(r'^\d+\.\s*', '', ln.strip()) for ln in sec.split('\n', 1)[1].split('\n') if ln.strip() and not ln.startswith('|')]
    return loi, chot


def gen(uid):
    folder, ma, docs, chi_tien_to = DV[uid]
    # Du lịch: nằm trong Sở VH, TT và DL khi gộp (cờ UBND_SAP_XEP_SO_2026), không gộp thì là đơn vị riêng
    u = UNITS[uid] if uid != 'dl' else UNITS.get('ubnd-dulich') or UNITS['ubnd-vhtt']
    efs = [e for e in u['eforms'] if not chi_tien_to or e['ef'].startswith(chi_tien_to)]
    ten_dv = 'Sở Du lịch' if uid == 'dl' else u['name']
    loi, chot = ban_doc(docs)
    nf, nc = sum(len(e['fields']) for e in efs), sum(len(e['chi']) for e in efs)
    out = os.path.join(ROOT, 'docs', folder, ma + '_MO_TA_CHI_TIEU.docx')
    k = Kit(f'Tài liệu mô tả chỉ tiêu · {ten_dv} · theo eform · IOC Hà Nội')
    para, table, heading, note, bullets, box = k.para, k.table, k.heading, k.note, k.bullets, k.box
    # ---------- bìa ----------
    k.blank(3)
    para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
    para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
    k.rule(); k.blank(3)
    para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY, md=False)
    k.md.title(f'Tài liệu mô tả chỉ tiêu — {ten_dv} (theo eform)')
    para(ten_dv.upper(), 16, CENTER, 4, bold=True, color=NAVY)
    para(f'{len(efs)} eform · {nf} trường · {nc} chỉ tiêu dựng từ trường của eform', 13, CENTER, 4, italic=True, color=GREY)
    k.blank(3)
    tren = (f'Thuộc đơn vị «{u["name"]}» trên IOC (eform của sheet "Sở Du lịch")' if uid == 'dl' else f'Đơn vị «{u["name"]}» trên IOC, mỗi eform một thẻ')
    table([['Phạm vi', f'{tren}; màn hình chỉ tiêu, cách tính, Dữ liệu đã nhập của {len(efs)} eform'],
           ['Căn cứ', f'File mô tả đầu vào eform (sheet của đơn vị); bản đọc eform đã duyệt (docs/BAN_DOC_EFORM/{", ".join(docs)}); quy ước chỉ tiêu theo eform bản 2.0; mã nguồn IOC đang chạy'],
           ['Phiên bản', f'{VER} — thay bản 27/10/2026 (bộ chỉ tiêu cũ, lưu ở docs/_CU_2026_10_27/)'], ['Ngày lập', NGAY]], [3.5, 12.5], header=False, key_col=True, size=12)
    k.page_break(); k.toc(); k.page_break()
    # ---------- I. quy ước ----------
    heading('PHẦN I. QUY ƯỚC CHUNG', 1)
    heading('1. Nguyên tắc', 2)
    bullets(['**Eform là nguồn duy nhất**: mọi chỉ tiêu, biểu đồ dựng từ trường của eform; không thêm chỉ tiêu, không lấy số từ văn bản, số công bố, bộ chỉ tiêu cũ, dân số, diện tích.',
             '**Hiện đủ mọi trường**: màn "Dữ liệu đã nhập" hiện mọi bản ghi, đủ mọi trường, đúng thứ tự, tên cột đúng như eform.',
             '**Số đã nhập là số hiển thị**: trường tỷ lệ, trường tổng đơn vị đã nhập hiện đúng số; IOC tính thêm (tỷ lệ, hiệu, bình quân) ghi rõ "(IOC tính)" và công thức theo tên trường; lệch thì đánh dấu bản ghi.',
             '**Mọi số lần lại được bản ghi**: bấm tên dòng ở bảng, thanh ở biểu đồ → các bản ghi tạo ra số đó.',
             'Kiểu trường giữ y hệt eform (trường Chữ có kèm danh sách vẫn hiện đúng chữ đã nhập).'])
    heading('2. Kỳ xem và quy tắc bản ghi', 2)
    bullets(['Chọn **Tháng / Quý / Năm** ở thanh công cụ; bản ghi xếp vào kỳ theo «Kỳ báo cáo», «Năm», «Tháng», «Quý» (kỳ «Đột xuất» theo «Ngày báo cáo»).',
             'Cùng khóa, cùng kỳ có hai bản thì lấy bản gửi sau; cùng khóa trong kỳ xem có bản tháng thì không cộng chồng bản quý, bản năm.',
             'Số tại thời điểm (tồn, đang có, lũy kế) xem quý, năm lấy kỳ cuối; số phát sinh cộng các kỳ.',
             'So với kỳ liền trước cùng loại, màu trung tính (eform không quy định tăng là tốt hay xấu).',
             'Bản ghi cần xem lại: mã ngoài danh mục, ô Số không đọc được, ngày không đọc được, thiếu trường khóa, thiếu kỳ, hoặc vi phạm kiểm tra riêng của eform (Phần II). Bản ghi vẫn hiện đủ, ô lỗi tô màu, rê chuột xem lý do.',
             'Chưa có dữ liệu thật: màn hình chạy bằng **bản ghi mẫu** dựng đúng khung eform và ghi rõ trên màn hình.'])
    heading('3. Eform của đơn vị', 2)
    table([['#', 'Eform (đúng tên trong file)', 'Thẻ trên IOC', 'Trường', 'Chỉ tiêu', 'Theo 126 xã']] +
          [[str(i + 1), e['efTen'], e['ten'], str(len(e['fields'])), str(len(e['chi'])), 'Có' if e['xa'] else '—'] for i, e in enumerate(efs)], [0.8, 6.4, 4.0, 1.5, 1.5, 1.8], size=10)
    # ---------- II. màn hình ----------
    heading('PHẦN II. MÀN HÌNH', 1)
    heading('1. Tổng quan đơn vị', 2)
    bullets([f'Thanh công cụ: "Xem theo" (Tháng / Quý / Năm), "Kỳ báo cáo", "Nhập chỉ tiêu", "Xuất Excel"; nút "←" quay lại màn trước.',
             'Hàng ô số chính: ' + '; '.join(k2['l'] for k2 in u['kpis']) + '. Bấm ô mở màn eform chứa chỉ tiêu.',
             'Thẻ "Dữ liệu đã nhập" (bản ghi của kỳ, tổng số trường) và mỗi eform một thẻ (4 chỉ tiêu chính, so kỳ trước); thẻ "Theo 126 xã, phường" khi eform có trường xã, phường.',
             'Dòng thẻ đơn vị ở màn tổng quan UBND: ' + '; '.join(u['card']) + '.'])
    heading('2. Màn từng eform', 2)
    bullets(['Thẻ so sánh kỳ này – kỳ trước của các chỉ tiêu chính; biểu đồ qua các kỳ (tối đa 12 tháng / 6 quý / 2 năm); thẻ tỷ lệ (IOC tính); top 10 xã, phường khi có.',
             'Các biểu đồ theo trường của eform (Phần III); bấm thanh → bản ghi.', 'Bảng nhiều cấp theo trường chia cấp, mặc định 12 dòng, nút "Xem đủ"; dòng "Cộng".',
             'Kỳ chưa có bản ghi: báo rõ, có nút sang kỳ gần nhất có số.'])
    heading('3. Theo 126 xã, phường; Dữ liệu đã nhập; Xuất Excel', 2)
    bullets(['Theo 126 xã, phường: bảng sắp từ lớn đến nhỏ (số tuyệt đối không xếp hạng tốt/kém), hồ sơ từng xã có nút xem bản ghi của xã; không dùng dân số, diện tích.',
             'Dữ liệu đã nhập: chọn eform; ô đếm; lọc theo nhóm, "Cần xem lại"; tìm chữ; bảng STT + đủ mọi trường; bản ghi không dùng ghi lý do ở cột STT.',
             'Xuất Excel: trang "Chỉ tiêu", trang "Dữ liệu đã nhập" (STT, Ghi chú IOC, đủ mọi trường), trang "Theo xã, phường" khi có.'])
    # ---------- III. từng eform ----------
    heading('PHẦN III. CHI TIẾT TỪNG EFORM', 1)
    for i, e in enumerate(efs):
        heading(f'{i + 1}. {e["ten"]} — eform «{e["efTen"]}»', 2)
        para(f'Sheet "{e["sheet"]}" từ dòng {e["dong"]} · {len(e["fields"])} trường, {len(e["chi"])} chỉ tiêu, {len(e["bieu"])} biểu đồ.')
        bl = [f'**Một bản ghi là**: {e["banGhi"]}', '**Khóa bản ghi**: ' + (' + '.join(f'«{x}»' for x in e['khoa']) + ' + kỳ' if e['khoa'] else '—') + (f' (được để trống: {", ".join("«" + x + "»" for x in e["khoaRong"])})' if e['khoaRong'] else ''),
              '**Chia cấp (bảng nhiều cấp)**: ' + ' › '.join(f'«{x}»' for x in e['cap'])]
        if e['kyCuoi']:
            bl.append('**Số tại thời điểm**: xem quý, năm thì mỗi khóa lấy bản kỳ cuối')
        if e['uuTien']:
            bl.append(f'**Bản ưu tiên**: cùng nhóm có bản {e["uuTien"]} thì chỉ dùng bản đó')
        if e['boNote']:
            bl.append('**Không tính vào số**: ' + e['boNote'])
        if e['dvt']:
            bl.append(f'**Đơn vị tính**: không cộng khác «{e["dvt"]}»')
        if e['bang']:
            bl.append('**Bảng phụ**: ' + '; '.join(f'{b["t"]} (' + ' › '.join(f'«{x}»' for x in b['cap']) + ')' for b in e['bang']))
        if e['xa']:
            bl.append(f'**Theo 126 xã, phường** (theo «{e["xaTruong"]}»): ' + '; '.join(e['xa']))
        if e['khongKy']:
            bl.append('**Kỳ**: eform không có trường «Năm» — mọi kỳ xem hiện toàn bộ bản ghi, không vẽ diễn biến')
        if e['luuY']:
            bl.append('**Lưu ý**: ' + e['luuY'])
        bl.append(f'**Số mẫu {e["mau"]["label"]}**: {e["mau"]["n"]} bản ghi dùng ({e["mau"]["nAll"]} bản ghi mọi kỳ)')
        bullets(bl, 11.5)
        note('Chỉ tiêu')
        table([['#', 'Chỉ tiêu', 'Cách tính (theo tên trường)', 'Hiện ở', e['mau']['label']]] +
              [[str(j + 1), c['l'] + (f' ({c["u"]})' if c['u'] and c['u'] != '%' and '(' + c['u'] + ')' not in c['l'] else ''), c['mota'],
                ', '.join(x for x, ok in (('Ô số', c['kpi']), ('Thẻ', c['the']), ('Bảng', c['cot'])) if ok) or 'Biểu đồ, bảng phụ', c['v'] if c['v'] is not None else '—'] for j, c in enumerate(e['chi'])],
              [0.7, 4.4, 6.8, 1.9, 2.2], size=9)
        if e['bieu']:
            para('**Biểu đồ**: ' + '; '.join(f'{b["t"]} ({b["loai"].lower()}' + (f' theo «{b["theo"]}»' if b['theo'] else '') + ')' for b in e['bieu']) + '.', 11.5)
        if e['kt']:
            para('**Kiểm tra riêng (đánh dấu cần xem lại)**: ' + '; '.join(e['kt']) + '.', 11.5)
        note('Trường của eform (đúng thứ tự trong sheet) — mọi trường đều hiện ở Dữ liệu đã nhập')
        table([['#', 'Tên trường', 'Mã', 'Kiểu', 'Danh mục', 'Vai trò ở phần tổng hợp']] +
              [[str(j + 1), f['l'], f['c'], KIEU.get(f['t'], '(để trống trong file)'), dm_text(f), f['vai']] for j, f in enumerate(e['fields'])],
              [0.7, 3.6, 3.0, 1.6, 3.3, 3.8], size=8.5)
    # ---------- IV. lỗi, câu chốt ----------
    heading('PHẦN IV. LỖI FILE EFORM VÀ CÁC CÂU ĐÃ CHỐT', 1)
    if loi:
        note('Lỗi, chỗ nghi trong file eform (từ bản đọc eform) — IOC hiện đúng như file; đề nghị bên eform rà soát')
        table([['#', 'Eform', 'Lỗi, chỗ nghi']] + [[str(j + 1), a, b] for j, (a, b) in enumerate(loi)], [0.8, 5.0, 10.2], size=9.5)
    else:
        para('Bản đọc eform không ghi lỗi nào.')
    if chot:
        para('**Các câu hỏi đã chốt khi đọc eform** (đã áp dụng vào cách tính ở Phần III):', after=2)
        bullets(chot, 10.5)
    # ---------- phụ lục ----------
    heading('PHỤ LỤC. MÃ NGUỒN, LỊCH SỬ PHIÊN BẢN', 1)
    table([['Tệp', 'Nội dung'],
           ['js/core/eform-khung.js', 'Khung eform cấp Thành phố, sinh từ file (tools/xa_eform_schema.py --tp, không sửa tay)'],
           ['js/features/ctm-eform.js', 'Khung chỉ tiêu theo eform dùng chung: kỳ, bản ghi, cách tính, bảng, biểu đồ, 126 xã, Dữ liệu đã nhập'],
           ['js/features/' + ('ctm-truc-eform.js' if uid == 'ubnd-vpubnd' else 'ctm-so-eform.js' if uid in ('ubnd-thanhtra', 'ubnd-congthuong', 'ubnd-noivu', 'ubnd-nnmt') else 'ctm-so-eform2.js'), 'Khai báo eform, chỉ tiêu của đơn vị'],
           ['js/core/eform-mau.js', 'Bản ghi mẫu theo khung eform (cờ EF_LA_MAU)'],
           ['tools/tp_srs_dump.js, tools/so_mo_ta_docx.py', 'Sinh tài liệu này từ cấu hình đang chạy']], [6.0, 10.0], size=10)
    table([['Phiên bản', 'Ngày', 'Nội dung'], ['1.0', '27/10/2026', 'Bộ chỉ tiêu cũ (lưu ở docs/_CU_2026_10_27/)'],
           [VER, NGAY, f'Làm lại theo {len(efs)} eform: chỉ dùng trường của eform; hiện đủ trường ở Dữ liệu đã nhập; số đã nhập hiện đúng, IOC tính ghi rõ; lần lại bản ghi; kỳ Tháng/Quý/Năm']],
          [2.2, 2.6, 11.2], size=10.5)
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    uf = OxmlElement('w:updateFields'); uf.set(qn('w:val'), 'true'); k.doc.settings.element.append(uf)
    d, m = k.save(out)
    print(f'{ma}: {len(efs)} eform, {nf} trường, {nc} chỉ tiêu, {len(loi)} lỗi file → {os.path.relpath(m, ROOT)}')


if __name__ == '__main__':
    for uid in (sys.argv[1:] or list(DV)):
        gen(uid)
