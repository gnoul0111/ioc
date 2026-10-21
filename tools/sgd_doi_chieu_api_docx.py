# -*- coding: utf-8 -*-
"""Sinh docs/SGD_SoGiaoDuc/SGD_DOI_CHIEU_API_4_CHI_TIEU.docx + .md — đối chiếu API CSDL ngành Giáo dục và Đào tạo Hà Nội
với 4 eform chỉ tiêu của Sở (QĐ 5279 chỉ số 19, 44; QĐ 4795 chỉ số 43, 44, 45): API hiện có đáp ứng được trường nào.
Chỉ kiểm dữ liệu API, KHÔNG liên quan bộ chỉ tiêu đang hiện trên IOC.
Chạy từ thư mục gốc ioc:  python tools/sgd_doi_chieu_api_docx.py
CÁC CON SỐ đọc thẳng từ kết quả gọi thật lưu trong bộ Postman "SoGDDT - CSDL GD&ĐT Hà Nội (ĐÃ SỬA + response thật)"
(thư mục cha của ioc). Trường eform chép từ 4 file eform trên Google Drive (19/10/2026).
Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PM = os.path.join(os.path.dirname(ROOT), 'SoGDDT - CSDL GD&ĐT Hà Nội (ĐÃ SỬA + response thật).postman_collection.json')
OUT = os.path.join(ROOT, 'docs', 'SGD_SoGiaoDuc', 'SGD_DOI_CHIEU_API_4_CHI_TIEU.docx')

# ---------------- Đọc bộ Postman ----------------
REQ = []
def _walk(it):
    for x in it.get('item', []):
        if 'request' in x:
            u = x['request']['url']; raw = u if isinstance(u, str) else u.get('raw', '')
            r = (x.get('response') or [None])[0]
            body = None
            try: body = json.loads(r['body']) if r else None
            except Exception: body = None
            REQ.append({'name': x['name'], 'path': raw.replace('{{base_url}}', '').split('?')[0], 'body': body})
        _walk(x)
_walk(json.load(open(PM, encoding='utf-8')))

def rows(path):
    """Dữ liệu trả về của API (danh sách bản ghi); None nếu API không trả dữ liệu (bị chặn quyền)."""
    b = next(r for r in REQ if r['path'] == path)['body']
    if not isinstance(b, dict): return None
    d = b.get('Data', b.get('data'))
    return d if isinstance(d, list) else None
def blocked(path):
    b = next(r for r in REQ if r['path'] == path)['body']
    return isinstance(b, dict) and b.get('error_code') == 'USER_NOT_VALID'

def n(x): return f'{x:,}'.replace(',', '.')

N_API = len(REQ)
N_BLOCK = sum(1 for r in REQ if blocked(r['path']))
N_OK = N_API - N_BLOCK - 1  # trừ API lấy token
NHOM = {}
for r in REQ:
    g = r['path'].strip('/').split('/')[0]
    NHOM[g] = NHOM.get(g, 0) + 1

LOAI_HINH = {x['MA']: x['TEN'] for x in rows('/danhmuc/loai-hinh')}
def theo_loai(path):
    m = {}
    for x in rows(path): m[x['MA_LOAI_HINH_TRUONG']] = m.get(x['MA_LOAI_HINH_TRUONG'], 0) + 1
    return m
def loai_txt(m): return ', '.join((f'{LOAI_HINH[k]} {v}' if k in LOAI_HINH else f'mã "{k}" (chưa có trong danh mục) {v}') for k, v in sorted(m.items()))
def thuong(t): return t[0].lower() + t[1:]

MN, C1, C2, C3, GDTX = (rows('/hoso/truong-' + s) for s in ('mn', 'c1', 'c2', 'c3', 'gdtx'))
LMN, LC1, LC2, LC3, LGDTX = (rows('/hoso/lop-' + s) for s in ('mn', 'c1', 'c2', 'c3', 'gdtx'))
C3_XA = sum(1 for x in C3 if x.get('MA_XA')); GDTX_XA = sum(1 for x in GDTX if x.get('MA_XA'))
LIEN_CAP = sum(1 for x in C3 if ',' in str(x.get('DS_CAP_HOC') or '') or re.search(r'TH,|THCS và THPT', x['TEN']))

def kieu_gdtx(t):
    if re.search(r'GDNN-GDTX', t, re.I): return 'Trung tâm GDNN-GDTX'
    if re.search(r'cao đẳng', t, re.I): return 'Trường cao đẳng'
    if re.search(r'trung cấp', t, re.I): return 'Trường trung cấp'
    if re.search(r'GDTX|giáo dục thường xuyên', t, re.I): return 'Trung tâm GDTX'
    return 'Đơn vị khác (bồi dưỡng, ngoại ngữ, tin học, năng khiếu…)'
KG = {}
for x in GDTX: KG[kieu_gdtx(x['TEN'])] = KG.get(kieu_gdtx(x['TEN']), 0) + 1
N_GDNN = KG.get('Trung tâm GDNN-GDTX', 0) + KG.get('Trường cao đẳng', 0) + KG.get('Trường trung cấp', 0)
KT_GDTX = sum(1 for x in GDTX if x.get('IS_HOC_SINH_KHUYET_TAT') is not None)
HS_GDTX = sum(x.get('HS_TONG_SO') or 0 for x in rows('/thongke/thongkesoluong-gdtx'))
HS_C3 = sum(x.get('HS_TONG_SO') or 0 for x in rows('/thongke/thongkesoluonghocsinh-c3'))
LOP_NAM_NU = sum(1 for L in (LMN, LC1, LC2) for x in L if x.get('TONG_SO_HS_NAM') is not None)
DM = [r['path'].split('/')[-1] for r in REQ if r['path'].startswith('/danhmuc/')]
CO_DM_DAN_TOC = any('dan-toc' in d for d in DM)
TK_FIELDS = set()
for r in REQ:
    if r['path'].startswith('/thongke/'):
        for x in (rows(r['path']) or [])[:1]: TK_FIELDS |= set(x)
HS_DAN_TOC_TK = sorted(f for f in TK_FIELDS if 'DAN_TOC' in f and f.startswith('HS'))

# ---------------- 4 eform (chép từ 4 file trên Google Drive) ----------------
KY = ['Kỳ báo cáo', 'Tháng', 'Quý', 'Năm']
EF = [
    {'so': 'QĐ 5279 · Chỉ số 19, 44', 'ten': 'Eform Thu thập dữ liệu kỹ năng số', 'file': 'SDGĐT_eForm_QD5279_Chỉ số 19, 44.xlsx',
     'ma': 'sdgdt_eform_qd5279_chi_so_19_44'},
    {'so': 'QĐ 4795 · Chỉ số 43', 'ten': 'Giáo dục nghề nghiệp', 'file': 'SDGĐT_eForm_QD4795_Chỉ số 43.xlsx', 'ma': 'sdgdt_eform_qd4795_chi_so_43'},
    {'so': 'QĐ 4795 · Chỉ số 44', 'ten': 'Số cơ sở giáo dục nghề nghiệp có dạy nghề cho người khuyết tật', 'file': 'SDGĐT_eForm_QD4795_Chỉ số 44.xlsx',
     'ma': 'sdgdt_eform_qd4795_chi_so_44'},
    {'so': 'QĐ 4795 · Chỉ số 45', 'ten': 'Giáo dục và đào tạo (trường, học sinh theo địa bàn)', 'file': 'SDGĐT_eForm_QD4795_Chỉ số 45.xlsx',
     'ma': 'sdgdt_eform_qd4795_chi_so_45'},
]
CO, MOT_PHAN, KHONG = 'Đáp ứng', 'Một phần', 'Không'
RED_FILL = 'FBE9E7'

KY_NAM_HOC = ('Một phần', 'API lấy theo «năm học» và «giai đoạn», không có tháng, quý. Chỉ dùng được làm số của cả năm học.')

# Từng trường: [tên trường eform, mức đáp ứng, lấy từ API, ghi chú]
F19 = [
    ['Kỳ báo cáo, Tháng, Quý, Năm', KHONG, '—', 'Không có API kỹ năng số nên không có kỳ để đối chiếu.'],
    ['Đơn vị báo cáo', KHONG, '—', 'Như trên.'],
    ['Loại chương trình (phổ cập / tập huấn)', KHONG, '—', 'CSDL ngành giáo dục không có dữ liệu chương trình phổ cập, tập huấn kỹ năng số.'],
    ['Số người tham gia (được phổ cập / được tập huấn)', KHONG, '—', 'Không có API nào.'],
    ['Tổng số người trong độ tuổi lao động', KHONG, '—', 'Là số dân số – lao động, không thuộc CSDL giáo dục.'],
]
F43 = [
    ['Kỳ báo cáo, Tháng, Quý, Năm', MOT_PHAN, 'Tham số năm học', KY_NAM_HOC[1]],
    ['Địa bàn', MOT_PHAN, 'Danh sách trường GDTX: mã xã', f'{GDTX_XA}/{len(GDTX)} đơn vị trong danh sách GDTX có mã xã; chỉ dùng được cho các cơ sở có trong danh sách đó.'],
    ['Tổng số cơ sở GDNN công lập', MOT_PHAN, 'Danh sách trường GDTX (hồ sơ trường)',
     f'Danh sách GDTX ({len(GDTX)} đơn vị) có lẫn {N_GDNN} cơ sở GDNN ({KG.get("Trường cao đẳng", 0)} cao đẳng, {KG.get("Trường trung cấp", 0)} trung cấp, {KG.get("Trung tâm GDNN-GDTX", 0)} TT GDNN-GDTX), nhưng chỉ là các cơ sở **có dạy chương trình GDTX**, không đủ mọi cơ sở GDNN của Thành phố; không có trường nào đánh dấu "là cơ sở GDNN", phải lọc theo tên.'],
    ['Tổng số cơ sở GDNN ngoài công lập', MOT_PHAN, 'Như trên', 'Như trên; thêm vướng mã loại hình "02" chưa có trong danh mục (Phần IV).'],
    ['Học viên tuyển mới (nam / nữ)', KHONG, '—', f'API GDTX chỉ có tổng số học viên ({n(HS_GDTX)}) của chương trình GDTX, không có tuyển mới, không tách nam/nữ, không phải học viên học nghề.'],
    ['Học viên tốt nghiệp (nam / nữ)', KHONG, '—', 'Không có API.'],
    ['Học viên tốt nghiệp (dân tộc Kinh / thiểu số)', KHONG, '—', 'Không có API.'],
    ['Học sinh có trình độ chuyên môn cao / trung bình / thấp', KHONG, '—', 'Không có API.'],
]
F44 = [
    ['Kỳ báo cáo, Tháng, Quý', MOT_PHAN, 'Tham số năm học', KY_NAM_HOC[1]],
    ['Địa bàn', MOT_PHAN, 'Danh sách trường GDTX: mã xã', 'Chỉ có cho các cơ sở trong danh sách GDTX.'],
    ['Tổng số cơ sở GDNN có dạy nghề cho người khuyết tật', KHONG, '—',
     f'Hồ sơ trường có cờ "trường có học sinh khuyết tật", không phải "có dạy nghề cho người khuyết tật"; ở danh sách GDTX cả {len(GDTX)} đơn vị đều để trống cờ này ({KT_GDTX} đơn vị có giá trị).'],
]
F45 = [
    ['Kỳ báo cáo, Tháng, Quý, Năm', MOT_PHAN, 'Tham số năm học, giai đoạn', KY_NAM_HOC[1]],
    ['Địa bàn', CO, 'Hồ sơ trường: mã xã; API thống kê: mã phường/xã',
     f'API theo phường/xã dùng đúng danh mục 126 phường/xã ({len(rows("/danhmuc/phong"))} đơn vị). Trường THPT: {C3_XA}/{len(C3)} trường có mã xã.'],
    ['Tổng số trường mầm non ngoài công lập', CO, 'Danh sách trường mầm non (mã loại hình)',
     f'Loại hình: {", ".join(LOAI_HINH.values())}. Ngoài công lập = Tư thục. Phải gọi lần lượt 126 phường/xã. Mẫu 1 phường: {loai_txt(theo_loai("/hoso/truong-mn"))}.'],
    ['Tổng số trường mầm non công lập', CO, 'Như trên', 'Như trên.'],
    ['Tổng số trường giáo dục phổ thông ngoài công lập', CO, 'Danh sách trường tiểu học, THCS (theo phường/xã), THPT (toàn Thành phố)',
     f'THPT toàn Thành phố: {len(C3)} trường ({loai_txt(theo_loai("/hoso/truong-c3"))}). Trường liên cấp nằm ở nhiều danh sách (khoảng {LIEN_CAP} trường trong danh sách THPT) nên phải lọc trùng theo mã trường.'],
    ['Tổng số trường giáo dục phổ thông công lập', CO, 'Như trên', 'Như trên.'],
    ['Tổng số trường GDTX công lập', MOT_PHAN, 'Danh sách trường GDTX (mã loại hình)',
     f'Danh sách có {len(GDTX)} đơn vị ({loai_txt(theo_loai("/hoso/truong-gdtx"))}) nhưng lẫn: ' + ', '.join(f'{thuong(k)} {v}' for k, v in sorted(KG.items(), key=lambda x: -x[1]))
     + '. "Trường GDTX" đúng nghĩa chỉ là trung tâm GDTX và TT GDNN-GDTX; cần quy ước cách lọc.'],
    ['Tổng số trường GDTX ngoài công lập', MOT_PHAN, 'Như trên', 'Như trên; mã loại hình "02" chưa có trong danh mục loại hình, cần Sở xác nhận là ngoài công lập.'],
    ['Tổng số học sinh nam trên địa bàn', MOT_PHAN, 'Hồ sơ lớp: số học sinh nam, nữ của từng lớp',
     f'API thống kê chỉ có **tổng số học sinh**. Nam/nữ chỉ có ở hồ sơ lớp của mầm non, tiểu học, THCS, phải gọi từng trường rồi cộng các lớp. Hồ sơ lớp THPT trả {len(LC3)} dòng, GDTX trả {len(LGDTX)} dòng, nên không có nam/nữ của 2 cấp này.'],
    ['Tổng số học sinh nữ trên địa bàn', MOT_PHAN, 'Như trên', 'Như trên.'],
    ['Tổng số học sinh dân tộc Kinh trên địa bàn', KHONG, '—',
     'Không API thống kê nào có số học sinh theo dân tộc (chỉ có số **giáo viên** dân tộc); danh mục cũng không có danh mục dân tộc. Hồ sơ từng học sinh bị chặn với tài khoản hiện tại, chưa biết có trường dân tộc hay không.'],
    ['Tổng số học sinh dân tộc thiểu số trên địa bàn', KHONG, '—', 'Như trên.'],
]
FIELDS = [F19, F43, F44, F45]
def dem(F):
    return {m: sum(1 for f in F if f[1] == m) for m in (CO, MOT_PHAN, KHONG)}
KET_LUAN = [
    ['Không đáp ứng', 'API không có dữ liệu kỹ năng số. Giữ nhập eform.'],
    ['Không đáp ứng', 'CSDL giáo dục không quản lý dữ liệu học nghề; số cơ sở GDNN chỉ thấy một phần. Giữ nhập eform.'],
    ['Không đáp ứng', 'API không có thông tin dạy nghề cho người khuyết tật. Giữ nhập eform.'],
    ['Đáp ứng khoảng một nửa', 'Lấy được số trường mầm non, phổ thông theo loại hình và địa bàn; trường GDTX cần quy ước lọc; học sinh nam/nữ chỉ có một phần; học sinh theo dân tộc không có.'],
]

# ======================================================= TÀI LIỆU
k = Kit('Sở Giáo dục và Đào tạo · Đối chiếu API với 4 chỉ tiêu eform')
para, table, box, heading, note, bullets = k.para, k.table, k.box, k.heading, k.note, k.bullets
def fill_muc(rows_, col):
    f = {}
    for i, r in enumerate(rows_[1:], 1):
        f[(i, col)] = {CO: k.OK_FILL, MOT_PHAN: k.NOTE_FILL, KHONG: RED_FILL}.get(r[col])
    return f

# ---- TRANG BÌA
k.blank(5)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(4)
para('BÁO CÁO ĐỐI CHIẾU DỮ LIỆU API', 22, CENTER, 6, bold=True, color=NAVY)
para('SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('API CSDL ngành Giáo dục và Đào tạo có đáp ứng được 4 chỉ tiêu eform của Sở hay không', 14, CENTER, 0, italic=True, color=GREY)
k.blank(5)
table([
    ['Đơn vị', 'Sở Giáo dục và Đào tạo Thành phố Hà Nội'],
    ['Nguồn API', f'CSDL ngành Giáo dục và Đào tạo Hà Nội: {N_API} API; kết quả gọi thật tháng 9/2026, năm học 2025'],
    ['Chỉ tiêu đối chiếu', '4 eform: QĐ 5279 chỉ số 19, 44; QĐ 4795 chỉ số 43, 44, 45'],
    ['Phạm vi', 'Chỉ kiểm dữ liệu API; không liên quan bộ chỉ tiêu đang hiện trên IOC'],
    ['Ngày', '19/10/2026'],
], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()
k.toc()
k.page_break()

# ---- PHẦN I
heading('PHẦN I. KẾT LUẬN CHUNG', 1)
tot = [dem(F) for F in FIELDS]
r1 = [['#', 'Chỉ tiêu (eform)', 'Số trường dữ liệu', 'Đáp ứng', 'Một phần', 'Không', 'Kết luận']]
for i, (e, d, kl) in enumerate(zip(EF, tot, KET_LUAN)):
    r1.append([str(i + 1), [e['so'], e['ten']], str(len(FIELDS[i])), str(d[CO]), str(d[MOT_PHAN]), str(d[KHONG]), kl[0]])
f1 = {}
for i, kl in enumerate(KET_LUAN, 1): f1[(i, 6)] = k.NOTE_FILL if 'nửa' in kl[0] else RED_FILL
table(r1, [0.7, 6.0, 1.5, 1.5, 1.6, 1.4, 3.3], size=10.5, fills=f1)
para('**Tóm lại:** API hiện tại chỉ đáp ứng được khoảng một nửa **Chỉ số 45** (số trường theo loại hình và địa bàn); **3 chỉ tiêu còn lại không đáp ứng**. Lý do chung: đây là CSDL giáo dục mầm non và phổ thông, không quản lý dữ liệu học nghề, kỹ năng số; còn số học sinh theo giới tính, dân tộc nằm ở hồ sơ từng học sinh mà tài khoản hiện tại chưa được cấp quyền.')
heading('Đề xuất', 2)
table([['Chỉ tiêu', 'Đề xuất']] + [[e['so'], kl[1]] for e, kl in zip(EF, KET_LUAN)]
      + [['Chỉ số 45 (cách làm)', 'Số trường lấy từ API (sau khi Sở xác nhận mã loại hình "02" và cách lọc trường GDTX); số học sinh nam/nữ, dân tộc tiếp tục nhập eform, hoặc xin tài khoản có quyền xem hồ sơ học sinh rồi kiểm lại.']],
      [4.2, 11.8], size=11, key_col=True)

# ---- PHẦN II
k.page_break()
heading('PHẦN II. NGUỒN DỮ LIỆU ĐÃ KIỂM', 1)
heading('1. Bộ API', 2)
TEN_NHOM = {'token': 'Lấy mã truy cập', 'danhmuc': 'Danh mục (giới tính, cấp học, loại hình, phường/xã…)', 'hoso': 'Hồ sơ trường, lớp, nhân sự, học sinh',
            'nhansu': 'Phân công chuyên môn, chủ nhiệm', 'thongke': 'Thống kê lớp, phòng, học sinh, nhân sự', 'thongkekqht': 'Thống kê kết quả học tập, rèn luyện'}
table([['Nhóm API', 'Nội dung', 'Số API']] + [[g, TEN_NHOM.get(g, ''), str(c)] for g, c in NHOM.items()] + [['**Cộng**', '', f'**{N_API}**']],
      [3.0, 10.5, 2.5], size=11)
para(f'Bộ API do nhóm triển khai gọi thật tháng 9/2026: **{N_OK} API trả dữ liệu**, **{N_BLOCK} API bị chặn** ("Thông tin tài khoản không được lấy dữ liệu") vì tài khoản thử nghiệm chưa có quyền xem dữ liệu cá nhân — gồm hồ sơ nhân sự, hồ sơ học sinh các cấp, phân công chuyên môn, chủ nhiệm.')
heading('2. Giới hạn của lần kiểm này', 2)
bullets([
    'Dữ liệu là **năm học 2025**; năm học 2024 hầu như rỗng.',
    f'Các API lọc theo phường/xã mới có kết quả mẫu của **1 phường** (ví dụ: danh sách trường mầm non {len(MN)} trường, tiểu học {len(C1)}, THCS {len(C2)}). Số liệu ở tài liệu này dùng để đánh giá **có hay không có trường dữ liệu**, chưa phải tổng toàn Thành phố.',
    f'API toàn Thành phố có số đầy đủ: trường THPT {len(C3)} trường, đơn vị GDTX {len(GDTX)} đơn vị; học sinh THPT {n(HS_C3)}, học viên GDTX {n(HS_GDTX)}.',
    'Hồ sơ học sinh bị chặn quyền nên chưa biết có trường giới tính, dân tộc hay không; khi có tài khoản đủ quyền cần kiểm lại Chỉ số 45.',
])

# ---- PHẦN III
k.page_break()
heading('PHẦN III. ĐỐI CHIẾU TỪNG CHỈ TIÊU', 1)
note('Mỗi chỉ tiêu: thông tin eform, bảng từng trường của eform với mức đáp ứng (Đáp ứng / Một phần / Không), API lấy được và ghi chú.')
for i, (e, F) in enumerate(zip(EF, FIELDS)):
    if i: k.page_break()
    heading(f'{i + 1}. {e["so"]} – {e["ten"]}', 2)
    table([['File eform', e['file']], ['Mã eform', e['ma']], ['Kết luận', KET_LUAN[i][0] + ' · ' + KET_LUAN[i][1]]],
          [3.2, 12.8], header=False, size=11, key_col=True, keep=True)
    rr = [['#', 'Trường trong eform', 'Đáp ứng', 'Lấy từ API', 'Ghi chú']] + [[str(j + 1)] + f for j, f in enumerate(F)]
    table(rr, [0.7, 3.9, 1.9, 3.6, 5.9], size=10, fills=fill_muc(rr, 2))

# ---- PHẦN IV
k.page_break()
heading('PHẦN IV. VIỆC CẦN SỞ GIÁO DỤC VÀ ĐÀO TẠO XÁC NHẬN', 1)
para('Cột "Kết quả" để trống cho Sở ghi ý kiến.')
table([['#', 'Nội dung', 'Kết quả']] + [[str(i + 1), x, ''] for i, x in enumerate([
    f'Danh sách trường GDTX có {theo_loai("/hoso/truong-gdtx").get("02", 0)} đơn vị mang mã loại hình "02", mã này không có trong danh mục loại hình (chỉ có {", ".join(f"{k_} {v}" for k_, v in LOAI_HINH.items())}). Đề nghị Sở xác nhận "02" là ngoài công lập (tư thục, dân lập…) để tính số trường GDTX ngoài công lập.',
    f'Danh sách trường GDTX ({len(GDTX)} đơn vị) gồm cả trường cao đẳng, trung cấp, trung tâm bồi dưỡng, ngoại ngữ. Đề nghị Sở thống nhất cách tính "trường GDTX" ở Chỉ số 45 (chỉ trung tâm GDTX và TT GDNN-GDTX, hay mọi đơn vị có dạy chương trình GDTX).',
    'Đề nghị cấp tài khoản có quyền xem hồ sơ học sinh để kiểm tra có trường giới tính, dân tộc hay không; nếu có, Chỉ số 45 lấy được số học sinh nam/nữ, Kinh/thiểu số từ API.',
    'Đề nghị Sở cho biết có nguồn dữ liệu nào (hệ thống quản lý GDNN, báo cáo thống kê) cho Chỉ số 43, 44; nếu không, hai chỉ tiêu này tiếp tục nhập eform.',
    'Chỉ số 19, 44 (kỹ năng số): đề nghị Sở cho biết đơn vị đầu mối số liệu phổ cập, tập huấn kỹ năng số; tiếp tục nhập eform.',
])], [0.8, 12.2, 3.0], size=10.5)
heading('Phát hiện thêm khi đọc file eform', 2)
bullets([
    'Chỉ số 43, 44, 45: mã eform ở sheet "01_FORM_TEMPLATE" (giaoducnghenghiep, day_nghe_nguoi_khuyet_tat, giaoducvadaotao) khác mã eform ghi ở các trường (sdgdt_eform_qd4795_chi_so_43, _44, _45). Đề nghị thống nhất một mã.',
    'Chỉ số 45: trường «Địa bàn» đang ghi mã eform của chỉ số 46 (sdgdt_eform_qd4795_chi_so_46), các trường khác là chỉ số 45.',
    'Chỉ số 44: eform không có trường «Năm», chỉ có «Kỳ báo cáo», «Tháng», «Quý»; trường «Địa bàn» chưa có thứ tự hiển thị.',
    'Chỉ số 19, 44 (QĐ 5279): «Tổng số người trong độ tuổi lao động» chỉ nhập khi «Loại chương trình» = Tập huấn; cần quy ước khi Loại chương trình = Phổ cập.',
])

# ---- PHỤ LỤC
k.page_break()
heading('PHỤ LỤC. API ĐÃ DÙNG ĐỂ ĐỐI CHIẾU', 1)
para('Số dòng là số bản ghi trong kết quả gọi thật (API theo phường/xã: mẫu 1 phường).')
AP = [
    ('/danhmuc/loai-hinh', 'Danh mục loại hình trường'), ('/danhmuc/phong', 'Danh mục phường/xã (đơn vị quản lý)'),
    ('/hoso/truong-mn', 'Hồ sơ trường mầm non'), ('/hoso/truong-c1', 'Hồ sơ trường tiểu học'), ('/hoso/truong-c2', 'Hồ sơ trường THCS'),
    ('/hoso/truong-c3', 'Hồ sơ trường THPT (toàn Thành phố)'), ('/hoso/truong-gdtx', 'Hồ sơ đơn vị GDTX (toàn Thành phố)'),
    ('/hoso/lop-mn', 'Hồ sơ lớp mầm non (có số HS nam, nữ)'), ('/hoso/lop-c1', 'Hồ sơ lớp tiểu học (có số HS nam, nữ)'),
    ('/hoso/lop-c2', 'Hồ sơ lớp THCS (có số HS nam, nữ)'), ('/hoso/lop-c3', 'Hồ sơ lớp THPT'), ('/hoso/lop-gdtx', 'Hồ sơ lớp GDTX'),
    ('/hoso/hocsinh-c1', 'Hồ sơ học sinh tiểu học (đại diện nhóm hồ sơ học sinh)'),
    ('/thongke/thongkehocsinh-c1', 'Thống kê học sinh tiểu học'), ('/thongke/thongkesoluonghocsinh-c3', 'Thống kê học sinh THPT'),
    ('/thongke/thongkesoluong-gdtx', 'Thống kê GDTX (lớp, học viên, nhân sự, phòng)'),
    ('/thongke/thongkegiaovienmongiangday-c1', 'Thống kê giáo viên (có giáo viên nữ, dân tộc)'),
]
ra = [['API', 'Nội dung', 'Kết quả', 'Trường dữ liệu liên quan']]
for p, t in AP:
    d = rows(p)
    if blocked(p): kq, ff = 'Bị chặn quyền', '—'
    else:
        kq = f'{len(d)} dòng'
        keys = list(d[0]) if d else []
        ff = ', '.join(x for x in keys if re.fullmatch(r'MA|TEN|MA_PHONG|TEN_PHONG|MA_XA|MA_LOAI_HINH_TRUONG|IS_HOC_SINH_KHUYET_TAT|.*_NAM|.*_NU|.*TONG_SO.*|.*DAN_TOC.*', x))[:160] or ('(không có dòng)' if not d else '')
    ra.append([p, t, kq, ff])
table(ra, [4.4, 4.6, 2.2, 4.8], size=9.5, mono_col=0)
print('API', N_API, '| trả dữ liệu', N_OK, '| bị chặn', N_BLOCK, '| HS dân tộc trong thống kê:', HS_DAN_TOC_TK, '| danh mục dân tộc:', CO_DM_DAN_TOC)
for e, d in zip(EF, tot): print(e['so'], d)
for p in k.save(OUT): print('ok', p)
