<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Chỉ tiêu theo eform — quy ước bắt buộc (bản 2.1, 28/10/2026, sửa 11/11/2026)

Áp dụng cho mọi đơn vị có eform trong "File mô tả đầu vào eform" (Google Sheets `1n1UHGnQ4sULz6_D9J0D2N02B0grCc8RbnLh0h9mY70k`): 126 xã, phường; 4 trục cấp Thành phố (Đảng ủy, HĐND, MTTQ, UBND); 12 sở, ngành. Bản đầy đủ: `docs/CHUNG/QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28.md` (thư mục `docs/` không lên GitHub).

1. **Eform là nguồn duy nhất.** Chỉ dùng trường có trong eform để dựng chỉ tiêu, cách tính, biểu đồ. Không thêm chỉ tiêu, trường dữ liệu ngoài eform; không lấy số từ văn bản, số công bố, bộ chỉ tiêu cũ, mục tiêu Thành phố giao, dân số, diện tích.
   - **Không thêm bất cứ thứ gì ngoài eform và bản đọc đã duyệt** — kể cả số đếm (số bản ghi, số nhóm có số liệu…), kể cả để cho đủ số ô, để qua kiểm thử hay quy tắc trình bày. Kiểm thử, quy tắc đòi thêm mà bản đọc không có thì **hỏi anh**, không tự thêm (anh nhắc nhiều lần; lặp lại ngày 02/11/2026).
   - **Không cộng các chỉ tiêu, tình trạng, đơn vị tính khác nhau thành một số** (X7): chỉ cộng cùng một trường số của các bản ghi giống nhau ở mọi trường mô tả; muốn gộp khác thì phải có trong bản đọc đã duyệt.
2. **Hiện đủ mọi trường.** Mỗi eform có màn "Dữ liệu đã nhập": mọi bản ghi, đủ mọi trường, đúng thứ tự, tên cột đúng như eform; ô danh mục hiện tên hiển thị.
3. **Số đã nhập là số hiển thị.** Không thay trường tỷ lệ, trường tổng của đơn vị bằng số IOC tự tính. IOC được tính thêm từ trường eform nhưng phải ghi rõ "IOC tính" và công thức theo tên trường; lệch thì đánh dấu bản ghi.
4. **Mọi số lần lại được bản ghi**, nhưng chỉ qua các lối vào ở mục 11 (không bắt buộc ô số nào cũng bấm được).
5. **Chia cấp:** Trục/Sở → Đơn vị (Ban) → Eform → Nhóm (danh mục của eform) → Dòng số liệu → Bản ghi.
6. **Không có eform:** đơn vị lấy theo API, nguồn khác thì để nguyên; đơn vị trong 4 trục không có eform và chỉ tiêu nguồn khác trong đơn vị có eform thì **ẩn bằng cờ, không xóa**.
7. **Đọc kỹ eform trước khi làm** (lập bản đọc eform, được duyệt rồi mới code). **Chưa rõ thì hỏi ngay**, không tự đoán ý nghĩa trường.
8. **Khung eform sinh từ file, không sửa tay** (`tools/xa_eform_schema.py`, chạy `--check` trước khi phát hành).
9. **Kiểu trường y hệt eform** (trường Chữ có kèm danh sách vẫn là Chữ); **kỳ xem chọn được Tháng / Quý / Năm**; **quyền xem theo cấp** (cấp trên xem được cấp dưới).
10. Dữ liệu mẫu được tự sinh thoải mái, đúng kiểu trường, mã trong danh mục; **không sinh thêm trường**; màn hình ghi "bản ghi mẫu".
11. **Trình bày (T1, T2, 11/11/2026):** **một dữ liệu chỉ hiện ở một chỗ trên mỗi màn**: một chỗ chọn duy nhất; nhóm trùng tên biểu đồ không liệt kê lại; danh sách đã chứa đủ số của biểu đồ thì chỉ hiện danh sách; tên dòng không lặp tên nhóm, đơn vị tính ở tiêu đề. **Ít chỗ mở Dữ liệu đã nhập**: mỗi màn eform chỉ có nút «Xem bản ghi đã nhập» và các phần của biểu đồ đang xem; ô số không bấm; không ghi "bấm để xem bản ghi" trong tooltip; màn ngoài không mở bản ghi.

Mẫu đã làm theo quy ước: chỉ tiêu xã, phường — một khung chung `js/features/ctm-eform.js` cho xã, 4 trục, sở; khai báo xã `js/features/ctm-xa-eform.js` theo bản đọc `docs/BAN_DOC_EFORM/XA_*` (sinh bằng `tools/xa_ban_doc_eform.py`), kiểm thử `tests/ctm/xa-eform.test.js`. Bố cục 2 lớp cho tài khoản xã (màn ngoài tùy chỉnh, màn eform một biểu đồ lớn): `js/features/ctm-xa-bangtin.js` + `css/ctm-xa-bangtin.css` + `lib/echarts/`, kiểm thử `tests/ctm/xa-bangtin.test.js`; màn cũ giữ, nút «Bố cục cũ».
