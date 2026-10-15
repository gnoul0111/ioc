# -*- coding: utf-8 -*-
"""Phần "Cách hiển thị trên giao diện IOC" dùng chung cho các tài liệu *_MO_TA_CHI_TIEU.
Số liệu, đơn vị, số lẻ, mốc so sánh, chiều tốt/xấu, thẻ và biểu đồ đọc thẳng từ cấu hình khung chỉ tiêu dùng chung
(qua node tools/ctm_dump.js), nên tài liệu luôn khớp giao diện. Lời văn theo "Quy tắc hiển thị chỉ tiêu dùng chung"
(docs/CHUNG/QUY_TAC_HIEN_THI_CHI_TIEU_2026_10_12).

Dùng:  from ctm_display import section
       section(H, P, T, 'ubnd-dulich', 'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=[...])
H(text, level) viết tiêu đề, P(text) viết đoạn, T(rows, widths) viết bảng (hàng đầu là tiêu đề cột)."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from quy_uoc_eform import QU, QUY_UOC, NGAY, TAI_LIEU_CHUNG  # quy ước xử lý dữ liệu eform (13/10/2026)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_CACHE = {}


def dump(spec_id):
    if spec_id not in _CACHE:
        out = subprocess.run(['node', os.path.join('tools', 'ctm_dump.js'), spec_id], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8')
        _CACHE[spec_id] = json.loads(out)[spec_id]
    return _CACHE[spec_id]


KIEU = {'ps': 'Số trong kỳ báo cáo', 'lk': 'Lũy kế từ đầu năm', 'td': 'Số tại thời điểm', 'rate': 'Tỷ lệ', 'score': 'Điểm',
        'plan': 'Kế hoạch, chỉ tiêu giao', 'month': 'Số riêng một tháng'}
CHIEU = {'up': 'Tăng là tốt', 'inv': 'Giảm là tốt', 'neutral': 'Trung tính'}


def _gt(m):
    return m['vs'] + ('%' if m['u'] == '%' else (' ' + m['u']) if m['u'] else '')


def _dv(m):
    u = m['u'] or 'chỉ số'
    d = m['d']
    return f'{u} · ' + ('không số lẻ' if d == 0 else f'{d} số lẻ')


def _so_sanh(s, m):
    if m['type'] == 'plan':
        return 'Không so; là vạch mốc trên thanh, cột thực hiện'
    if m['type'] == 'month':
        return 'Không so; ghi dòng chú thích riêng, không cộng vào số chính'
    if s['ck']:
        return 'So cùng kỳ năm trước' if m['hasCk'] else 'Chưa có số cùng kỳ (chỉ hiện số kỳ này)'
    if len(s['ky']) <= 1:
        return 'Chưa có số cùng kỳ (chỉ hiện số kỳ này)'
    return 'So cùng kỳ năm trước' if m['base'] == 'ck' else 'So kỳ liền trước'


def _the(s, c, M):
    t, ten = c['type'], lambda ks: ', '.join((M[k]['short'] or M[k]['l']) for k in ks if k in M)
    if t == 'cmp':
        thuc = [k for k in c['items'] if k in M and M[k]['type'] not in ('plan', 'month')]
        thang = [k for k in c['items'] if k in M and M[k]['type'] == 'month']
        return ('Thẻ so sánh: số lớn là ' + (ten(thuc[:1]) or 'chỉ tiêu đầu nhóm') + '; các thanh ngang cùng đơn vị: ' + ten(thuc)
                + ('; ' + ten(thang) + ' là số riêng một tháng, ghi dòng chú thích dưới thẻ' if thang else ''))
    if t == 'rates':
        thuc = [k for k in c['items'] if k in M and M[k]['type'] != 'plan']
        moc = [k for k in c['items'] if k in M and M[k]['type'] == 'plan']
        return ('Thẻ tỷ lệ (thanh 0 – 100): ' + ten(thuc)
                + ('; ' + ten(moc) + ' là vạch mốc trên thanh thực hiện, kèm chữ "đạt / chưa đạt"' if moc else ''))
    if t == 'mbars':
        if c['u'] == '%' or c['idx']:
            return 'Biểu đồ đường' + (' có đường mốc 100' if c['idx'] else '') + '; trục không bắt đầu từ 0, điểm kỳ đang xem tô đậm'
        return 'Biểu đồ cột theo tháng/quý' + (' kèm vạch kế hoạch trên cột' if c['plan'] else ' hai dãy (' + c['l2'] + ' là cột phụ)' if c['l2'] else '') + (f' ({c["u"]})' if c['u'] else '')
    if t in ('shares', 'parts'):
        return 'Thẻ cơ cấu: thanh xếp chồng và từng phần (số, tỷ trọng)' + ('; màu theo mức, khớp tên mức' if c['semantic'] else '') + (f' ({c["u"]})' if c['u'] else '')
    if t in ('list', 'table'):
        return 'Bảng'
    if t == 'cols':
        return 'Cột qua các kỳ'
    if t == 'top':
        return 'Xã, phường có số cao nhất'
    return 'Thẻ riêng'


def section(H, P, T, spec_id, title, changes=None, intro=None):
    s = dump(spec_id)
    M = {m['k']: m for m in s['metrics']}
    H(title, 1)
    P(intro or ('Phần này mô tả cách các chỉ tiêu của ' + s['name'] + ' hiện trên giao diện IOC mới, theo **Quy tắc hiển thị chỉ tiêu dùng chung** '
                '(tài liệu chung ngày 12/10/2026). Số liệu, đơn vị, số lẻ và cách so sánh dưới đây được đọc thẳng từ cấu hình đang chạy, nên khớp với giao diện.'))

    H('1. Quy tắc chung áp dụng', 2)
    for x in ['**Một chỉ tiêu một đơn vị** ở mọi chỗ: ô số, thẻ, biểu đồ, bảng, bảng 126 phường/xã. Tiền tổng ghi tỷ đồng; đơn giá ghi nghìn đồng; lượt khách, hành khách ghi nghìn lượt; hàng hóa ghi nghìn tấn.',
              '**Số lẻ theo độ lớn**: từ 1.000 trở lên không số lẻ; từ 1 đến dưới 1.000 một số lẻ; dưới 1 hai số lẻ; các số cùng một thẻ dùng chung số lẻ của số lớn nhất. Hai số lẻ chỉ dùng cho tỷ lệ hồ sơ thủ tục hành chính, bảo hiểm y tế, cận nghèo, học sinh diện chính sách.',
              '**Mốc so sánh theo kiểu số**: số phát sinh, số lũy kế so cùng kỳ năm trước; số tại thời điểm so kỳ liền trước; kế hoạch không so. Mọi mũi tên tăng/giảm đều ghi rõ mốc ("so cùng kỳ", "so kỳ trước"); chưa có số để so thì ghi "Chưa có số cùng kỳ".',
              '**Chiều tốt/xấu**: chỉ tô xanh/đỏ khi tăng hay giảm tự thân là tốt hay xấu. Kiến nghị, phản ánh, đơn thư tiếp nhận, số đếm quy mô… để **trung tính** (màu trung tính, không xếp hạng tốt/kém).',
              '**Kế hoạch** không vẽ thành thanh hay cột ngang hàng với số thực hiện: là vạch mốc trên thanh/cột thực hiện, kèm chữ "đạt / chưa đạt" khi có. Số lớn đầu thẻ luôn là số thực hiện.',
              '**Số riêng một tháng** (ví dụ "tháng 9") không xếp cạnh số cộng dồn 9 tháng: ghi dòng chú thích "(số riêng một tháng, không cộng vào số trên)".',
              '**Biểu đồ**: tỷ lệ, chỉ số, bình quân theo thời gian vẽ đường (chỉ số có đường mốc 100); số đếm theo thời gian vẽ cột; cơ cấu tối đa 6 phần dùng thẻ cơ cấu; biểu đồ có mọi kỳ bằng nhau thì bỏ.',
              '**Bảng 126 phường/xã**: số tuyệt đối và chỉ tiêu trung tính chỉ sắp theo số (cột "Thứ tự", "Nhiều nhất / Ít nhất"); chỉ tỷ lệ, bình quân có chiều tốt/xấu mới xếp "Hạng". Mức chung Thành phố của tỷ lệ gộp theo trọng số (tổng tử số ÷ tổng mẫu số), không lấy trung bình cộng các xã.',
              '**Màn ngoài** (lưới thẻ của tài khoản UBND và tab "Tất cả") đọc đúng dòng thẻ của màn chi tiết, không tự tính lại số. Giao diện không hiện mã kỹ thuật, không hiện khối "Cách tính"; cách tính chỉ ở tài liệu này.']:
        P('• ' + x)

    H('2. Thẻ ở màn tổng quan', 2)
    rows = [['Vị trí', 'Thẻ / ô số', 'Chỉ tiêu', 'Giá trị (giả lập)']]
    for c in s['card']:
        m = M.get(c['k'])
        if m: rows.append(['Lưới thẻ màn ngoài', c['l'], m['l'], _gt(m)])
    for o in s['kpis']:
        m = M.get(o['k'])
        if m: rows.append(['Ô số đầu màn chi tiết', (m['short'] or m['l']) + (f' ({o["sub"]})' if o['sub'] else ''), m['l'], _gt(m)])
    T(rows, [3.0, 4.6, 5.4, 3.0])

    H('3. Từng chỉ tiêu: đơn vị, kiểu số, so sánh, chiều tốt/xấu', 2)
    P('Kỳ hiển thị: ' + s['ky'][0] + ('; kỳ so sánh: ' + s['ck'] if s['ck'] else '') + '.')
    rows = [['Chỉ tiêu', 'Đơn vị · số lẻ', 'Kiểu số', 'So sánh', 'Chiều', 'Giá trị (giả lập)']]
    for m in s['metrics']:
        rows.append([m['l'], _dv(m), KIEU[m['type']], _so_sanh(s, m), CHIEU[m['pol']], m['vs']])
    T(rows, [4.4, 2.6, 2.3, 3.3, 1.6, 1.8])

    H('4. Nhóm và thẻ biểu đồ', 2)
    rows = [['Nhóm', 'Thẻ', 'Cách thể hiện']]
    for g in s['groups']:
        for c in g['cards']:
            ten = c['t'] or g['label']
            cach = _the(s, c, M) + (('. Dòng phụ: ' + c['hint']) if c['hint'] else '')
            rows.append([g['label'], ten, cach])
    T(rows, [3.4, 4.6, 8.0])

    if s['xa']:
        H('5. Bảng 126 phường/xã', 2)
        rows = [['Cột', 'Đơn vị', 'Cách sắp xếp', 'Dòng mức chung']]
        for I in s['xa']:
            if I['tot']: cach = 'Số tuyệt đối: sắp theo số, cột "Thứ tự", "Nhiều nhất / Ít nhất", không tô tốt/kém'
            elif I['better'] == 'none': cach = 'Trung tính: sắp theo số, cột "Thứ tự", không tô tốt/kém'
            elif I['noRank']: cach = 'Sắp theo số, cột "Thứ tự"'
            elif I['better'] == 'low': cach = 'Xếp hạng: thấp là tốt; tô so với mức Thành phố'
            else: cach = 'Xếp hạng: cao là tốt; tô so với mức Thành phố'
            if I['minW']: cach += '; nơi có mẫu số nhỏ ghi "Mẫu nhỏ", không xếp hạng'
            chung = I['tpL'] + ('' if I['tot'] else (' (bằng ô số của sở)' if I['tpm'] else ' (gộp theo trọng số)'))
            rows.append([I['l'], I['u'], cach, chung])
        T(rows, [4.6, 2.2, 5.6, 3.6])

    so = 6 if s['xa'] else 5
    if spec_id in QU:
        H(f'{so}. Quy ước xử lý dữ liệu eform (chốt {NGAY})', 2)
        P('Theo phản hồi của nhóm triển khai khi nối dữ liệu eform thật. Mọi số trên IOC chỉ tính từ trường đang có trong eform; '
          'IOC không thêm trường vào eform. Áp dụng chung cho 12 sở, ngành làm chỉ tiêu theo eform (tài liệu chung: ' + TAI_LIEU_CHUNG + ').')
        for i, x in enumerate(QUY_UOC):
            P(f'{i + 1}. ' + x)
        P('Khóa bản ghi và cách lấy theo kỳ của từng eform:')
        T([['Eform', 'Khóa bản ghi', 'Loại số, cách lấy theo kỳ', 'Ghi chú']] + QU[spec_id], [3.6, 4.4, 4.4, 3.6])
        so += 1
    if changes:
        H(f'{so}. Thay đổi so với bản trước (rà soát 12/10/2026 và phản hồi nhóm triển khai 13/10/2026)', 2)
        for x in changes:
            P('• ' + x)
        if spec_id in QU:
            P(f'• {NGAY}: thêm mục "Quy ước xử lý dữ liệu eform" (khóa bản ghi, cách lấy theo kỳ, không hiện số không có trường trong eform) theo phản hồi của nhóm triển khai.')
